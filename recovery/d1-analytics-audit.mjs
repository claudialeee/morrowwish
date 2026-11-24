import fs from "node:fs";

const token = process.env.CLOUDFLARE_D1_RECOVERY_TOKEN;
const account = process.env.CLOUDFLARE_ACCOUNT_ID;
const databaseId = process.env.D1_DATABASE_ID;
const databaseName = "morrowwish-analytics";
const startTimestamp = "2026-11-22T08:00:00.000Z"; // Nov 22 00:00 Pacific
const startMs = Date.parse(startTimestamp);
const base = "https://api.cloudflare.com/client/v4";
const root = `/accounts/${account}/d1/database/${databaseId}`;

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

const columns = ["category","day","ts","game","visitor","view_id","run_id","event_name","kind","payload"];
const uniq = values => new Set(values.filter(Boolean)).size;
const sum = (rows,key) => rows.reduce((n,row) => n + Math.max(0,Number(row.data?.[key]) || 0),0);
const pacificDay = ts => new Intl.DateTimeFormat("en-CA",{
  timeZone:"America/Los_Angeles",year:"numeric",month:"2-digit",day:"2-digit"
}).format(new Date(ts));

function dedupe(rows) {
  const seen = new Set();
  return rows.filter(row => {
    if (row.category !== "arcade" || row.kind !== "session" || !row.view_id) return true;
    const seq = row.data?.seq;
    if (!Number.isInteger(seq) || seq < 0) return true;
    const key = row.game + "|" + row.view_id + "|" + seq;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function summarizeGame(game, rows) {
  const visits = rows.filter(r => r.kind === "visit");
  const sessions = rows.filter(r => r.kind === "session");
  const visitKeys = new Set(visits.map(r => r.view_id || ("visit-row:" + String(r.id))));
  const visitIds = new Set(visits.map(r => r.view_id).filter(Boolean));
  const isBond = game === "cat-bond";
  const startedIds = new Set(sessions.filter(r => visitIds.has(r.view_id) &&
    (isBond ? Number(r.data?.signals?.bond_enter) > 0 :
      Number(r.data?.signals?.funnel_first_run) > 0 || Number(r.data?.starts) > 0)).map(r => r.view_id));
  const finishedIds = new Set(sessions.filter(r => visitIds.has(r.view_id) &&
    (Number(r.data?.signals?.funnel_first_finish) > 0 || Number(r.data?.ends) > 0)).map(r => r.view_id));
  const finishedStarted = [...finishedIds].filter(id => startedIds.has(id));
  const v11Visits = new Set(visits.filter(r => Number(r.data?.trackingVersion) >= 11 && r.view_id).map(r => r.view_id));
  const v11Entered = new Set(sessions.filter(r => v11Visits.has(r.view_id) && Number(r.data?.signals?.bond_enter) > 0).map(r => r.view_id));
  const v11Finished = new Set(sessions.filter(r => v11Entered.has(r.view_id) && Number(r.data?.signals?.bond_battle_end_v2) > 0).map(r => r.view_id));
  const signals = {};
  for (const row of sessions) for (const [key,value] of Object.entries(row.data?.signals || {})) {
    if (/^[a-z0-9_-]{2,40}$/.test(key) && Number.isFinite(Number(value)) && Number(value) > 0) {
      signals[key] = (signals[key] || 0) + Math.min(10000,Number(value));
    }
  }
  return {
    game,
    rawRows:rows.length,
    visitRows:visits.length,
    uniquePageVisits:visitKeys.size,
    sessionRows:sessions.length,
    uniqueSessionViews:uniq(sessions.map(r=>r.view_id)),
    rawBattleStarts:sum(sessions,"starts"),
    rawBattleFinishes:sum(sessions,"ends"),
    rawRetries:sum(sessions,"retries"),
    rawAbandons:sum(sessions,"abandons"),
    startedPageVisits:startedIds.size,
    finishedPageVisits:finishedStarted.length,
    trackingV11PageVisits:v11Visits.size,
    trackingV11EnteredViews:v11Entered.size,
    trackingV11FinishedViews:v11Finished.size,
    signals
  };
}

async function main() {
  if (!token || !account || !databaseId) throw new Error("Missing D1 recovery credentials");
  const database = await api(root);
  if (database.name !== databaseName || database.uuid !== databaseId || database.version !== "production") {
    throw new Error("Unexpected D1 database identity/version");
  }
  const total = Number((await query("SELECT COUNT(*) AS rows FROM events"))[0]?.rows || 0);
  const since = Number((await query("SELECT COUNT(*) AS rows FROM events WHERE ts >= ?",[startMs]))[0]?.rows || 0);
  const all = [];
  for (let offset=0; offset<since; offset+=400) {
    const page = await query(
      "SELECT " + ["id",...columns].join(",") + " FROM events WHERE ts >= ? ORDER BY id LIMIT 400 OFFSET ?",
      [startMs,offset]
    );
    all.push(...page.map(row=>({...row,data:JSON.parse(row.payload||"{}")})));
    if (page.length < 400) break;
  }
  if (all.length !== since) throw new Error("Paged D1 read incomplete: expected " + since + ", received " + all.length);
  const rows = dedupe(all);
  const arcade = rows.filter(r=>r.category==="arcade");
  const byGame = [...new Set(arcade.map(r=>r.game).filter(Boolean))]
    .map(game=>summarizeGame(game,arcade.filter(r=>r.game===game)))
    .sort((a,b)=>b.uniquePageVisits-a.uniquePageVisits);
  const byPacificDay = [...new Set(arcade.map(r=>pacificDay(r.ts)))].sort().map(day=>{
    const dayRows=arcade.filter(r=>pacificDay(r.ts)===day);
    return {day,byGame:[...new Set(dayRows.map(r=>r.game).filter(Boolean))]
      .map(game=>summarizeGame(game,dayRows.filter(r=>r.game===game)))};
  });
  const catBond = byGame.find(x=>x.game==="cat-bond") || null;
  const eventKinds = {};
  for (const row of rows) {
    const key=[row.category,row.game||"",row.kind||"",row.event_name||""].join("|");
    eventKinds[key]=(eventKinds[key]||0)+1;
  }
  const timestamps = rows.map(r=>Number(r.ts)).filter(Number.isFinite);
  const report = {
    generatedAt:new Date().toISOString(),
    database:{name:database.name,uuid:database.uuid,version:database.version,fileSize:database.file_size},
    scope:{startTimestamp,startPacific:"2026-11-22 00:00:00 America/Los_Angeles",rawEventRows:since,totalDatabaseRows:total,rowsAfterSessionSequenceDedup:rows.length},
    catBond,
    byGame,
    byPacificDay,
    eventKinds,
    firstEventAt:timestamps.length?new Date(Math.min(...timestamps)).toISOString():null,
    lastEventAt:timestamps.length?new Date(Math.max(...timestamps)).toISOString():null,
    firstEventPacific:timestamps.length?new Date(Math.min(...timestamps)).toLocaleString("en-US",{timeZone:"America/Los_Angeles"}):null,
    lastEventPacific:timestamps.length?new Date(Math.max(...timestamps)).toLocaleString("en-US",{timeZone:"America/Los_Angeles"}):null
  };
  fs.mkdirSync("recovery",{recursive:true});
  fs.writeFileSync("recovery/d1-analytics-audit.json",JSON.stringify(report,null,2)+"\n");
  console.log(JSON.stringify(report,null,2));
}
main().catch(error=>{console.error(error?.stack||error);process.exitCode=1;});
