import fs from "node:fs";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const token = process.env.CLOUDFLARE_D1_RECOVERY_TOKEN;
const account = process.env.CLOUDFLARE_ACCOUNT_ID;
const databaseId = process.env.D1_DATABASE_ID;
const databaseName = "morrowwish-analytics";
const targetTimestamp = "2026-11-23T00:59:00.000Z";
const base = "https://api.cloudflare.com/client/v4";
const root = `/accounts/${account}/d1/database/${databaseId}`;
const output = {
  generatedAt: new Date().toISOString(),
  targetTimestamp,
  backup: null,
  historicalRows: [],
  historicalTotalRows: 0,
  currentRowsBefore: null,
  currentRowsAfter: null,
  rollbackBookmark: null,
  currentStateRestored: false,
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

async function query(sql) {
  const result = await api(root + "/query", {
    method: "POST",
    body: JSON.stringify({ sql })
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
      fs.writeFileSync("/tmp/morrowwish-current-d1.sql", bytes);
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

  output.backup = await exportCurrentDatabase();
  const originalBookmark = (await api(root + "/time_travel/bookmark")).bookmark;
  if (!originalBookmark) throw new Error("Could not capture current bookmark before temporary restore");

  const before = await query(
    "SELECT day,category,game,kind,COUNT(*) AS rows FROM events GROUP BY day,category,game,kind ORDER BY day,category,game,kind"
  );
  output.currentRowsBefore = before.reduce((sum, row) => sum + Number(row.rows || 0), 0);

  let restoreAttempted = false;
  let rollbackBookmark = null;
  try {
    restoreAttempted = true;
    const result = await restore(targetBookmark);
    rollbackBookmark = result.previous_bookmark || originalBookmark;
    output.rollbackBookmark = rollbackBookmark;
    output.restoreMessage = result.message || null;

    output.historicalRows = await query(
      "SELECT day,category,game,kind,COUNT(*) AS rows,MIN(id) AS first_id,MAX(id) AS last_id,MIN(ts) AS first_ts,MAX(ts) AS last_ts " +
      "FROM events WHERE category IN ('arcade','elsewhere') AND day >= '2026-11-22' " +
      "GROUP BY day,category,game,kind ORDER BY day,category,game,kind"
    );
    output.historicalTotalRows = output.historicalRows.reduce((sum, row) => sum + Number(row.rows || 0), 0);
  } finally {
    if (restoreAttempted) {
      if (!rollbackBookmark) rollbackBookmark = originalBookmark;
      try {
        await restore(rollbackBookmark);
      } catch (firstError) {
        output.rollbackError = String(firstError);
        try {
          const latest = (await api(root + "/time_travel/bookmark")).bookmark;
          if (latest && latest !== rollbackBookmark) {
            await restore(rollbackBookmark);
          }
        } catch (secondError) {
          output.rollbackError += "; retry failed: " + String(secondError);
        }
      }
    }
  }

  output.rollbackBookmark = rollbackBookmark;
  const after = await query(
    "SELECT day,category,game,kind,COUNT(*) AS rows FROM events GROUP BY day,category,game,kind ORDER BY day,category,game,kind"
  );
  output.currentRowsAfter = after.reduce((sum, row) => sum + Number(row.rows || 0), 0);

  const key = row => [row.day, row.category, row.game, row.kind].join("|");
  const afterMap = new Map(after.map(row => [key(row), Number(row.rows)]));
  const lost = before.filter(row => (afterMap.get(key(row)) || 0) < Number(row.rows));
  output.currentStateRestored = !output.rollbackError && lost.length === 0;
  if (lost.length) output.lostCurrentGroups = lost;

  if (!output.currentStateRestored) {
    throw new Error("Current production state did not pass post-rollback verification");
  }
}

try {
  await main();
} catch (error) {
  output.error = String(error?.stack || error);
}

fs.mkdirSync("recovery", { recursive: true });
fs.writeFileSync("recovery/d1-historical-probe.json", JSON.stringify(output, null, 2) + "\n");
console.log(JSON.stringify(output, null, 2));
if (output.error || output.rollbackError || !output.currentStateRestored) process.exitCode = 1;
