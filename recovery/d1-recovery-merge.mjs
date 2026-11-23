import fs from "node:fs";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const token = process.env.CLOUDFLARE_D1_RECOVERY_TOKEN;
const account = process.env.CLOUDFLARE_ACCOUNT_ID;
const databaseId = process.env.D1_DATABASE_ID;
const databaseName = "morrowwish-analytics";
const targetTimestamp = process.env.D1_TARGET_TIMESTAMP || "2026-11-23T00:36:56.250Z";
const startTimestamp = "2026-11-22T08:00:00.000Z"; // 00:00 Pacific on Nov 22
const startMs = Date.parse(startTimestamp);
const base = "https://api.cloudflare.com/client/v4";
const root = `/accounts/${account}/d1/database/${databaseId}`;
const columns = [
  "category", "day", "ts", "game", "visitor", "view_id",
  "run_id", "event_name", "kind", "payload"
];
const output = {
  generatedAt: new Date().toISOString(),
  databaseName,
  targetTimestamp,
  startTimestamp,
  backup: null,
  historicalTotalRows: 0,
  historicalRowsByGame: [],
  currentRowsBeforeMerge: null,
  currentRowsAfterMerge: null,
  totalRowsBeforeMerge: null,
  totalRowsAfterMerge: null,
  restoredRows: 0,
  duplicatesSkipped: 0,
  insertedIdRange: null,
  currentStateRestored: false,
  mergeVerified: false,
  error: null,
  rollbackError: null
};

async function api(path, init = {}) {
  const response = await fetch(base + path, {
    ...init,
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
      ...(init.headers || {})
    }
  });
  const body = await response.json();
  if (!response.ok || !body.success) {
    throw new Error("Cloudflare API " + response.status + ": " + JSON.stringify(body.errors || body.messages || []));
  }
  return body.result;
}

async function query(sql, params = []) {
  const result = await api(root + "/query", {
    method: "POST",
    body: JSON.stringify({ sql, params })
  });
  return result?.[0]?.results || [];
}

async function exportCurrentDatabase() {
  let state = await api(root + "/export", {
    method: "POST",
    body: JSON.stringify({
      output_format: "polling",
      dump_options: { compatibility: "d1" }
    })
  });
  const atBookmark = state.at_bookmark;
  if (!atBookmark) throw new Error("D1 export did not return its pinned bookmark");

  for (let attempt = 0; attempt < 120; attempt++) {
    const status = state.status || state.result?.status;
    if (status === "complete") {
      const signedUrl = state.result?.signed_url || state.signed_url;
      if (!signedUrl) throw new Error("D1 export completed without a signed URL");
      const response = await fetch(signedUrl);
      if (!response.ok) throw new Error("Could not download current D1 backup: HTTP " + response.status);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length < 100) throw new Error("Current D1 backup unexpectedly small");
      fs.writeFileSync("/tmp/morrowwish-current-d1-before-merge.sql", bytes);
      return {
        atBookmark,
        bytes: bytes.length,
        sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
        keptOnlyOnEphemeralRunner: true
      };
    }
    if (status === "error") throw new Error("D1 export failed: " + (state.error || JSON.stringify(state.messages || [])));
    await new Promise(resolve => setTimeout(resolve, 1000));
    state = await api(root + "/export", {
      method: "POST",
      body: JSON.stringify({ output_format: "polling", current_bookmark: atBookmark })
    });
  }
  throw new Error("D1 export polling timed out");
}

function readBookmark(timestamp) {
  const stdout = execFileSync(
    "npx",
    ["wrangler", "d1", "time-travel", "info", databaseName, "--config", "wrangler.jsonc", "--timestamp", timestamp, "--json"],
    { cwd: "cloudflare-pages", encoding: "utf8", env: process.env }
  );
  let parsed = null;
  try { parsed = JSON.parse(stdout); } catch {}
  return parsed?.bookmark
    || parsed?.result?.bookmark
    || stdout.match(/[0-9a-f]{8}-[0-9a-f]{8}-[0-9a-f]{8}-[0-9a-f]{32}/i)?.[0]
    || null;
}

async function restore(bookmark) {
  return api(root + "/time_travel/restore?bookmark=" + encodeURIComponent(bookmark), {
    method: "POST"
  });
}

function signature(row) {
  return JSON.stringify(columns.map(column => row[column] === undefined ? null : row[column]));
}

function countBySignature(rows) {
  const counts = new Map();
  for (const row of rows) {
    const key = signature(row);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}

function missingFrom(haveCounts, requiredCounts) {
  const missing = [];
  for (const [key, count] of requiredCounts) {
    const have = haveCounts.get(key) || 0;
    if (have < count) missing.push({ signature: key, missing: count - have });
  }
  return missing;
}

function summarize(rows) {
  const map = new Map();
  for (const row of rows) {
    const key = [row.day, row.category, row.game || "", row.kind || ""].join("|");
    map.set(key, (map.get(key) || 0) + 1);
  }
  return [...map].map(([key, rows]) => {
    const [day, category, game, kind] = key.split("|");
    return { day, category, game: game || null, kind: kind || null, rows };
  }).sort((a, b) =>
    a.day.localeCompare(b.day) ||
    String(a.game).localeCompare(String(b.game)) ||
    String(a.kind).localeCompare(String(b.kind))
  );
}

async function main() {
  if (!token || !account || !databaseId) throw new Error("Missing recovery token or D1 configuration");

  const database = await api(root);
  output.database = {
    name: database.name,
    uuid: database.uuid,
    version: database.version,
    fileSize: database.file_size
  };
  if (database.name !== databaseName || database.uuid !== databaseId || database.version !== "production") {
    throw new Error("D1 database identity/version did not match the expected production database");
  }

  const targetBookmark = readBookmark(targetTimestamp);
  if (!targetBookmark) throw new Error("No Time Travel bookmark for " + targetTimestamp);
  output.targetBookmark = targetBookmark;

  // Back up the live database before any Time Travel restore.
  output.backup = await exportCurrentDatabase();

  // Capture live rows first, then capture the rollback bookmark immediately
  // before the temporary historical restore so concurrent writes are retained.
  const liveRowsBeforeProbe = await query(
    "SELECT " + ["id", ...columns].join(",") + " FROM events WHERE ts >= ? ORDER BY id",
    [startMs]
  );
  const liveTotalBeforeProbe = await query("SELECT COUNT(*) AS rows FROM events");
  output.totalRowsBeforeMerge = Number(liveTotalBeforeProbe[0]?.rows || 0);
  const originalBookmark = (await api(root + "/time_travel/bookmark")).bookmark;
  if (!originalBookmark) throw new Error("Could not capture the live D1 bookmark before historical restore");

  let historicalRows = [];
  let rollbackBookmark = originalBookmark;
  let restoreAttempted = false;
  try {
    restoreAttempted = true;
    const restored = await restore(targetBookmark);
    rollbackBookmark = restored.previous_bookmark || originalBookmark;
    output.restoreMessage = restored.message || null;
    historicalRows = await query(
      "SELECT " + ["id", ...columns].join(",") +
      " FROM events WHERE ts >= ? ORDER BY id",
      [startMs]
    );
  } finally {
    if (restoreAttempted) {
      try {
        await restore(rollbackBookmark);
      } catch (firstError) {
        output.rollbackError = String(firstError);
        try {
          const latest = (await api(root + "/time_travel/bookmark")).bookmark;
          if (latest && latest !== rollbackBookmark) await restore(rollbackBookmark);
        } catch (secondError) {
          output.rollbackError += "; retry failed: " + String(secondError);
        }
      }
    }
  }

  if (output.rollbackError) throw new Error("Could not restore the original production bookmark: " + output.rollbackError);

  // Confirm that every pre-probe live event survived the temporary restore.
  const liveRowsAfterProbe = await query(
    "SELECT " + ["id", ...columns].join(",") + " FROM events WHERE ts >= ? ORDER BY id",
    [startMs]
  );
  const liveBeforeCounts = countBySignature(liveRowsBeforeProbe);
  const liveAfterProbeCounts = countBySignature(liveRowsAfterProbe);
  const missingLive = missingFrom(liveAfterProbeCounts, liveBeforeCounts);
  if (missingLive.length) {
    throw new Error("Live rows were missing after Time Travel rollback; merge aborted");
  }
  output.currentStateRestored = true;
  output.currentRowsBeforeMerge = liveRowsAfterProbe.length;
  const liveTotalBeforeMerge = await query("SELECT COUNT(*) AS rows FROM events");
  output.totalRowsBeforeMerge = Number(liveTotalBeforeMerge[0]?.rows || 0);
  output.historicalTotalRows = historicalRows.length;
  output.historicalRowsByGame = summarize(historicalRows);

  // Merge by event content, not old integer IDs. This preserves the original
  // visitor/view/session identifiers and timestamps while avoiding ID clashes
  // with events recorded after the reset. Re-running this script is idempotent.
  const availableCounts = countBySignature(liveRowsAfterProbe);
  const toInsert = [];
  for (const row of historicalRows) {
    const key = signature(row);
    const available = availableCounts.get(key) || 0;
    if (available > 0) {
      availableCounts.set(key, available - 1);
      output.duplicatesSkipped++;
    } else {
      toInsert.push(row);
      availableCounts.set(key, 0);
    }
  }

  const batchSize = 8; // 80 bound parameters; stay below D1's SQLite variable limit
  for (let offset = 0; offset < toInsert.length; offset += batchSize) {
    const batch = toInsert.slice(offset, offset + batchSize);
    const rowPlaceholders = "(" + columns.map(() => "?").join(",") + ")";
    const sql = "INSERT INTO events (" + columns.join(",") + ") VALUES " +
      batch.map(() => rowPlaceholders).join(",");
    const params = batch.flatMap(row => columns.map(column => row[column] === undefined ? null : row[column]));
    await query(sql, params);
  }

  const liveRowsAfterMerge = await query(
    "SELECT " + ["id", ...columns].join(",") + " FROM events WHERE ts >= ? ORDER BY id",
    [startMs]
  );
  const afterCounts = countBySignature(liveRowsAfterMerge);
  const historicalCounts = countBySignature(historicalRows);
  const missingHistorical = missingFrom(afterCounts, historicalCounts);
  const missingPreMergeLive = missingFrom(afterCounts, liveBeforeCounts);
  if (missingHistorical.length || missingPreMergeLive.length) {
    output.currentRowsAfterMerge = liveRowsAfterMerge.length;
    output.mergeVerified = false;
    throw new Error("Post-merge verification failed: historical or pre-existing events are missing");
  }

  const totalAfter = await query("SELECT COUNT(*) AS rows FROM events");
  output.currentRowsAfterMerge = liveRowsAfterMerge.length;
  output.totalRowsAfterMerge = Number(totalAfter[0]?.rows || 0);
  output.restoredRows = toInsert.length;
  output.mergeVerified = true;

  // Report IDs assigned to restored rows so a precise rollback remains possible.
  const remainingLiveCounts = new Map(liveBeforeCounts);
  const insertedIds = [];
  for (const row of liveRowsAfterMerge) {
    const key = signature(row);
    const beforeCount = remainingLiveCounts.get(key) || 0;
    if (beforeCount > 0) {
      remainingLiveCounts.set(key, beforeCount - 1);
    } else if (historicalCounts.has(key)) {
      insertedIds.push(Number(row.id));
      const n = historicalCounts.get(key);
      if (n > 0) historicalCounts.set(key, n - 1);
    }
  }
  if (insertedIds.length) {
    output.insertedIdRange = {
      min: Math.min(...insertedIds),
      max: Math.max(...insertedIds),
      count: insertedIds.length
    };
  }
  output.liveRowsAddedDuringMerge = Math.max(
    0,
    liveRowsAfterMerge.length - liveRowsBeforeProbe.length - toInsert.length
  );
  output.currentBookmarkAfterMerge = (await api(root + "/time_travel/bookmark")).bookmark;
}

try {
  await main();
} catch (error) {
  output.error = String(error?.stack || error);
}

fs.mkdirSync("recovery", { recursive: true });
fs.writeFileSync("recovery/d1-merge-report.json", JSON.stringify(output, null, 2) + "\n");
console.log(JSON.stringify(output, null, 2));
if (output.error || output.rollbackError || output.currentStateRestored !== true || output.mergeVerified !== true) {
  process.exitCode = 1;
}
