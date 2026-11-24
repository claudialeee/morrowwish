// Branch-only audit. Production connection is used exclusively for fixed SELECT queries.
// No writes, restore, migration, deployment, or raw player data output.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const START=Date.parse('2026-11-22T08:00:00Z');
const GAMES=['cat-bond','pawsibly-innocent','tiny-town','elsewhere','pocket-aquarium','parcel-panic','flip-dash','hub'];
const pct=(n,d)=>d?Math.round(n/d*1000)/10:null;
const signal=(r,k)=>Number(r.p.signals?.[k]||0);
const field=(r,k)=>Number(r.p[k]||0);
const sum=(rs,f)=>rs.reduce((a,r)=>a+f(r),0);
const key=r=>r.view_id||'row:'+r.id;
const countSet=xs=>new Set(xs).size;
const day=ts=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'}).format(ts);
function normalize(rows) {
 const sorted=[...rows].sort((a,b)=>a.id-b.id), seen=new Map(), out=[], conflicts=[];
 let duplicateSessionRows=0;
 for(const raw of sorted){
  const p=JSON.parse(raw.payload); const r={...raw,p};
  if(!Number.isSafeInteger(r.id)||!Number.isFinite(r.ts)||!p||typeof p!=='object'||Array.isArray(p))throw Error('Invalid event schema');
  if(r.category!=='arcade')continue;
  if(r.kind==='session'&&r.view_id&&Number.isInteger(p.seq)&&p.seq>=0){
   const k=JSON.stringify([r.game,r.view_id,p.seq]); const old=seen.get(k);
   if(old){duplicateSessionRows++;if(old.payload!==r.payload)conflicts.push(r.id);continue;}seen.set(k,r);
  }
  out.push(r);
 }
 return {rows:out,duplicateSessionRows,conflictingSequenceCount:conflicts.length};
}
function aggregate(rows,g){
 const v=rows.filter(r=>r.game===g&&r.kind==='visit'),s=rows.filter(r=>r.game===g&&r.kind==='session');
 const ids=new Set(v.map(r=>r.view_id).filter(Boolean));
 const v11=new Set(v.filter(r=>Number(r.p.trackingVersion)>=11&&r.view_id).map(r=>r.view_id));
 const linked=(pred,scope=ids)=>new Set(s.filter(r=>scope.has(r.view_id)&&pred(r)).map(r=>r.view_id));
 const enter=linked(r=>signal(r,'bond_enter')>0),first=linked(r=>signal(r,'funnel_first_run')>0);
 const finish=linked(r=>signal(r,'funnel_first_finish')>0);
 const enteredV11=linked(r=>signal(r,'bond_enter')>0,v11);
 const finishedV11=linked(r=>signal(r,'bond_battle_end_v2')>0,enteredV11);
 const metrics={visitRows:v.length,pageLoadsById:countSet(v.map(key)),missingVisitIds:v.filter(r=>!r.view_id).length,sessionRows:s.length,unsequencedSessions:s.filter(r=>!Number.isInteger(r.p.seq)||r.p.seq<0||!r.view_id).length,unlinkedSessionRows:s.filter(r=>!ids.has(r.view_id)).length,
 recordedFirstPlay:sum(s,r=>signal(r,'funnel_first_run')),firstPlayPages:first.size,firstFinishPages:[...finish].filter(x=>first.has(x)).length,
 legacyStarts:sum(s,r=>field(r,'starts')),legacyEnds:sum(s,r=>field(r,'ends')),legacyRetries:sum(s,r=>field(r,'retries'))};
 if(g==='cat-bond')Object.assign(metrics,{recordedGameEntries:sum(s,r=>signal(r,'bond_enter')),entryPages:enter.size,entryRate:pct(enter.size,metrics.pageLoadsById),v11Visits:v11.size,v11EntryPages:enteredV11.size,v11FinishPages:finishedV11.size,v11EntryRate:pct(enteredV11.size,v11.size),v11FinishRate:pct(finishedV11.size,enteredV11.size),
 recordedBattleStartsV2:sum(s,r=>signal(r,'bond_battle_start_v2')),recordedBattleEndsV2:sum(s,r=>signal(r,'bond_battle_end_v2')),recordedBattleWinsV2:sum(s,r=>signal(r,'bond_battle_win_v2')),allHistoricalBattleStarts:null,allHistoricalBattleEnds:null,allHistoricalGameStarts:null});
 const signals={};for(const r of s)for(const [k,n] of Object.entries(r.p.signals||{})){if(!/^[a-z0-9_-]{2,40}$/.test(k)||!Number.isFinite(Number(n))||Number(n)<0)throw Error('Invalid signal');signals[k]=(signals[k]||0)+Number(n);}
 return {...metrics,signals};
}
const fixture=(id,kind,p,view_id='v')=>({id,category:'arcade',game:'cat-bond',kind,ts:START+id,view_id,payload:JSON.stringify(p)});
const f=normalize([fixture(1,'visit',{trackingVersion:11}),fixture(2,'session',{seq:0,starts:1,signals:{bond_enter:1,funnel_first_run:1}}),fixture(3,'session',{seq:1,signals:{bond_battle_start_v2:1}}),fixture(4,'session',{seq:2,starts:1,ends:1,signals:{bond_battle_start_v2:1,bond_battle_end_v2:1,funnel_first_finish:1}}),fixture(5,'session',{seq:2,starts:1,ends:1,signals:{bond_battle_start_v2:1,bond_battle_end_v2:1,funnel_first_finish:1}}),fixture(6,'visit',{trackingVersion:11},'v2'),fixture(7,'session',{seq:0,signals:{bond_enter:1}},'orphan')]);
const m=aggregate(f.rows,'cat-bond');
assert.equal(f.duplicateSessionRows,1);assert.equal(m.pageLoadsById,2);assert.equal(m.recordedGameEntries,2);assert.equal(m.entryPages,1);assert.equal(m.recordedBattleStartsV2,2);assert.equal(m.recordedBattleEndsV2,1);assert.equal(m.v11FinishPages,1);assert.equal(m.unlinkedSessionRows,1);
if(process.argv.includes('--self-test')){console.log('Synthetic fixture assertions passed');process.exit(0);}
assert.equal(process.env.GITHUB_REF,'refs/heads/audit/dashboard-data-integrity-20261123','Ref guard: audit branch only');
const token=process.env.D1_READ_TOKEN;assert.ok(token,'No D1 read credential');
const account=process.env.CLOUDFLARE_ACCOUNT_ID, db=process.env.D1_DATABASE_ID;
assert.ok(account&&db);
const endpoint='https://api.cloudflare.com/client/v4/accounts/'+account+'/d1/database/'+db;
async function api(url,body){
 const res=await fetch(url,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
 if(!res.ok)throw Error('Cloudflare HTTP '+res.status);
 const j=await res.json();if(!j.success)throw Error('Cloudflare API query failed');return j.result;
}
async function query(sql,params=[]){
 assert.match(sql.trim(),/^(SELECT|WITH)\b/i);assert.ok(!/;|\b(INSERT|UPDATE|DELETE|DROP|ALTER|REPLACE|CREATE|ATTACH|PRAGMA|VACUUM)\b/i.test(sql),'Read-only SQL guard');
 const result=await api(endpoint+'/query',{sql,params});
 assert.ok(Array.isArray(result?.[0]?.results));return result[0].results;
}
const info=await api(endpoint);assert.equal(info.name,'morrowwish-analytics');assert.equal(info.uuid,db);assert.equal(info.version,'production');
const cutoff=Date.now();
const [{maxId}]=await query('SELECT COALESCE(MAX(id),0) AS maxId FROM events');
const bind=[START,cutoff,maxId],scope='ts>=? AND ts<=? AND id<=?';
const count=async()=>Number((await query('SELECT COUNT(*) AS n FROM events WHERE '+scope,bind))[0].n);
const before=await count(),raw=[];
let afterId=0;
for(;;){
 const batch=await query('SELECT id,category,game,kind,ts,view_id,payload FROM events WHERE '+scope+' AND id>? ORDER BY id LIMIT 200',[...bind,afterId]);
 if(!batch.length)break;
 assert.ok(batch[0].id>afterId);raw.push(...batch);afterId=batch.at(-1).id;
 if(batch.length<200)break;
}
assert.equal(raw.length,before);assert.equal(new Set(raw.map(r=>r.id)).size,before);
const normalized=normalize(raw), rows=normalized.rows;
const allGames=GAMES.map(g=>({game:g,...aggregate(rows,g)}));
const byPacificDay=[...new Set(rows.map(r=>day(r.ts)))].sort().map(d=>({day:d,games:GAMES.map(g=>({game:g,...aggregate(rows.filter(r=>day(r.ts)===d),g)}))}));
const checks=[];function check(name,a,b){checks.push({name,actual:a,expected:b,pass:a===b});}
check('raw count',raw.length,before);check('fixed boundary count after read',await count(),before);check('no conflicting sequence retries',normalized.conflictingSequenceCount,0);
// Independent D1 SQL aggregation, no application analytics imports.
const sql= "WITH base AS (SELECT id,game,kind,view_id,payload,CASE WHEN kind='session' AND COALESCE(view_id,'')<>'' AND json_type(payload,'$.seq')='integer' AND json_extract(payload,'$.seq')>=0 THEN 1 ELSE 0 END AS seq_ok FROM events WHERE "+scope+" AND category='arcade'), ranked AS (SELECT *,ROW_NUMBER() OVER (PARTITION BY game,CASE WHEN seq_ok=1 THEN view_id ELSE 'row:'||id END,CASE WHEN seq_ok=1 THEN json_extract(payload,'$.seq') ELSE -1 END ORDER BY id) AS rn FROM base), clean AS (SELECT * FROM ranked WHERE rn=1) SELECT game, SUM(CASE WHEN kind='visit' THEN 1 ELSE 0 END) AS visitRows, COUNT(DISTINCT CASE WHEN kind='visit' THEN COALESCE(NULLIF(view_id,''),'row:'||id) END) AS pageLoadsById, SUM(CASE WHEN kind='session' THEN 1 ELSE 0 END) AS sessionRows, SUM(CASE WHEN kind='session' THEN COALESCE(json_extract(payload,'$.signals.funnel_first_run'),0) ELSE 0 END) AS recordedFirstPlay, SUM(CASE WHEN kind='session' THEN COALESCE(json_extract(payload,'$.signals.bond_enter'),0) ELSE 0 END) AS recordedGameEntries, SUM(CASE WHEN kind='session' THEN COALESCE(json_extract(payload,'$.signals.bond_battle_start_v2'),0) ELSE 0 END) AS recordedBattleStartsV2, SUM(CASE WHEN kind='session' THEN COALESCE(json_extract(payload,'$.signals.bond_battle_end_v2'),0) ELSE 0 END) AS recordedBattleEndsV2 FROM clean GROUP BY game";
const cross=await query(sql,bind);
for(const g of allGames){const x=cross.find(r=>r.game===g.game)||{};for(const k of ['visitRows','pageLoadsById','sessionRows','recordedFirstPlay',...(g.game==='cat-bond'?['recordedGameEntries','recordedBattleStartsV2','recordedBattleEndsV2']:[])])check(g.game+' SQL '+k,g[k],Number(x[k]||0));}
const legacy=JSON.parse(fs.readFileSync('recovery/d1-analytics-audit.json','utf8'));
const oldCutoff=Date.parse(legacy.lastEventAt);
const beforeOld=rows.filter(r=>r.ts<=oldCutoff),afterOld=rows.filter(r=>r.ts>oldCutoff);
const split=GAMES.map(g=>({game:g,oldSnapshotVisits:legacy.byGame.find(x=>x.game===g)?.visitRows??null,oldWindowRecomputed:aggregate(beforeOld,g),afterOldCutoff:aggregate(afterOld,g)}));
for(const g of split)if(g.oldSnapshotVisits!==null)check(g.game+' historical visit-row count vs prior snapshot',g.oldWindowRecomputed.visitRows,g.oldSnapshotVisits);
check('fixed boundary final count',await count(),before);
const report={status:checks.every(c=>c.pass)?'RAW_RECONCILIATION_PASSED_COVERAGE_NOT_PROVEN':'RAW_RECONCILIATION_FAILED',generatedAt:new Date().toISOString(),scope:{start:new Date(START).toISOString(),cutoff:new Date(cutoff).toISOString(),maxId,rawRows:raw.length,arcadeRowsAfterDedup:rows.length,previousLastEventAt:legacy.lastEventAt,latestEventAt:raw.length?new Date(Math.max(...raw.map(r=>r.ts))).toISOString():null,rawDigest:crypto.createHash('sha256').update(JSON.stringify(raw)).digest('hex')},duplicateSessionRows:normalized.duplicateSessionRows,conflictingSequenceCount:normalized.conflictingSequenceCount,allGames,byPacificDay,split,checks,limitations:['Historical count comparison cannot prove event identity; original recovery raw snapshot unavailable.','Missing or never-delivered events cannot be recovered by this audit.','No production API or browser verification; no live dashboard deployment.','Historical mixed counters are diagnostics only. No full historical battle or game-start count is claimed.','SQL independently cross-checks additive metrics only; funnel identity joins are independently tested by fixture, not yet SQL-cross-checked.','No raw player identifiers or payloads are committed.']};
fs.writeFileSync('audit/dashboard/raw-reconciliation.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,scope:report.scope,failedChecks:checks.filter(c=>!c.pass),catBond:allGames.find(g=>g.game==='cat-bond')},null,2));
if(checks.some(c=>!c.pass))process.exitCode=1;
