// Third independent check: explain user-reported PV=85, do not force it to match.
// Read-only fixed SELECTs. No analytics imports, no production writes or deployments.
import fs from 'node:fs';
import assert from 'node:assert/strict';
assert.equal(process.env.GITHUB_REF,'refs/heads/audit/dashboard-data-integrity-20261123');
const report=JSON.parse(fs.readFileSync('audit/dashboard/raw-reconciliation.json','utf8'));
const challenger=JSON.parse(fs.readFileSync('audit/dashboard/challenger-report.json','utf8'));
assert.deepEqual(report.scope,challenger.boundary);
const {start,cutoff,maxId}=report.scope;
const oldCutoff=Date.parse('2026-11-24T04:54:01.551Z'),oldMaxId=16967;
const token=process.env.D1_READ_TOKEN;assert.ok(token);
const endpoint='https://api.cloudflare.com/client/v4/accounts/'+process.env.CLOUDFLARE_ACCOUNT_ID+'/d1/database/'+process.env.D1_DATABASE_ID+'/query';
async function read(sql,params=[]){
 assert.match(sql,/^SELECT\b/i);assert.ok(!/;|\b(INSERT|UPDATE|DELETE|DROP|ALTER|REPLACE|CREATE|ATTACH|PRAGMA|VACUUM)\b/i.test(sql));
 const r=await fetch(endpoint,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({sql,params})});
 if(!r.ok)throw Error('HTTP '+r.status);const j=await r.json();if(!j.success||!Array.isArray(j.result?.[0]?.results))throw Error('D1 read failed');return j.result[0].results;
}
const args=[Date.parse(start),Date.parse(cutoff),maxId];
const base=" FROM events WHERE game='cat-bond' AND kind='visit' AND ts>=? AND ts<=? AND id<=?";
const live=(await read("SELECT COUNT(*) AS n,COUNT(DISTINCT CASE WHEN COALESCE(view_id,'')<>'' THEN view_id ELSE 'row:'||id END) AS distinctViews,MIN(ts) AS firstTs,MAX(ts) AS lastTs"+base+" AND category='arcade'",args))[0];
const previous=(await read("SELECT COUNT(*) AS n"+base+" AND category='arcade'",[args[0],oldCutoff,oldMaxId]))[0];
const later=await read("SELECT strftime('%Y-%m-%dT%H:%M:00Z',ts/1000,'unixepoch') AS minute,COUNT(*) AS n"+base+" AND category='arcade' AND (ts>? OR id>?) GROUP BY minute ORDER BY minute",[...args,oldCutoff,oldMaxId]);
const categories=await read("SELECT category,COUNT(*) AS n"+base+" GROUP BY category ORDER BY category",args);
const earlier=await read("SELECT category,COUNT(*) AS n,MIN(ts) AS firstTs,MAX(ts) AS lastTs FROM events WHERE game='cat-bond' AND kind='visit' AND ts<? AND id<=? GROUP BY category",[args[0],maxId]);
const hours=await read("SELECT strftime('%Y-%m-%dT%H:00:00Z',ts/1000,'unixepoch') AS hour,COUNT(*) AS n"+base+" AND category='arcade' GROUP BY hour ORDER BY hour",args);
const b=report.allGames.find(g=>g.game==='cat-bond');
const checks=[];
function check(name,a,b){checks.push({name,actual:a,expected:b,pass:a===b});}
check('Direct COUNT(*) vs raw JS visit rows',Number(live.n),b.visitRows);
check('Direct distinct view IDs vs raw JS',Number(live.distinctViews),b.pageLoadsById);
check('Previous cutoff reproduce 81',Number(previous.n),81);
check('Previous plus new PV equals fresh PV',Number(previous.n)+later.reduce((n,r)=>n+Number(r.n),0),Number(live.n));
check('Hourly PV sum equals fresh PV',hours.reduce((n,r)=>n+Number(r.n),0),Number(live.n));
const result={status:checks.every(c=>c.pass)?'PV_CHECK_PASSED_AT_FIXED_BOUNDARY':'PV_CHECK_FAILED',scope:report.scope,productionSourceContract:'Repository main src/analytics.js uses category=arcade, kind=visit, raw visit row count; not an authenticated deployed browser observation.',userReportedPV:85,actualPV:Number(live.n),differenceFromUser: Number(live.n)-85,previousBoundary:{cutoff:new Date(oldCutoff).toISOString(),maxId:oldMaxId,pv:Number(previous.n)},newPVByMinute:later,byHour:hours,categories,earlierThanReportingStart:earlier,firstCatBondVisitAt:live.firstTs?new Date(live.firstTs).toISOString():null,lastCatBondVisitAt:live.lastTs?new Date(live.lastTs).toISOString():null,checks,limitations:['User observation timestamp, dashboard build and exact displayed filters not supplied. Matching 85 at a later boundary does not prove the exact time of the user observation.','Authenticated production API/browser not queried; cannot establish current deployed UI value from repository source alone.','No earlier deleted/unrecorded data can be inferred from present D1.','Three independent computation paths, not three independent AI agents.']};
fs.writeFileSync('audit/dashboard/pv-discrepancy-report.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
if(checks.some(c=>!c.pass))process.exitCode=1;
