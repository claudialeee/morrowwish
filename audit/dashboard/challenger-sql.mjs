// Challenger: independent SQL implementation; uses immutable audit boundary.
// Read only. Never import the builder or production dashboard aggregator.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const file='audit/dashboard/raw-reconciliation.json';
const report=JSON.parse(fs.readFileSync(file,'utf8'));
assert.equal(process.env.GITHUB_REF,'refs/heads/audit/dashboard-data-integrity-20261123');
const token=process.env.D1_READ_TOKEN;assert.ok(token);
const endpoint='https://api.cloudflare.com/client/v4/accounts/'+process.env.CLOUDFLARE_ACCOUNT_ID+'/d1/database/'+process.env.D1_DATABASE_ID;
async function query(sql,params=[]){
 assert.match(sql.trim(),/^(SELECT|WITH)\b/i);assert.ok(!/;|\b(INSERT|UPDATE|DELETE|DROP|ALTER|REPLACE|CREATE|ATTACH|PRAGMA|VACUUM)\b/i.test(sql));
 const res=await fetch(endpoint+'/query',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({sql,params})});
 if(!res.ok)throw Error('D1 HTTP '+res.status);
 const j=await res.json();if(!j.success||!Array.isArray(j.result?.[0]?.results))throw Error('D1 query failed');return j.result[0].results;
}
const {start,cutoff,maxId,previousLastEventAt}=report.scope;
const args=[Date.parse(start),Date.parse(cutoff),maxId];
const cte="WITH original AS (SELECT id,game,kind,view_id,payload,ts FROM events WHERE ts>=? AND ts<=? AND id<=? AND category='arcade'), clean AS (SELECT o.* FROM original o WHERE NOT (o.kind='session' AND COALESCE(o.view_id,'')<>'' AND json_type(o.payload,'$.seq')='integer' AND json_extract(o.payload,'$.seq')>=0 AND EXISTS (SELECT 1 FROM original p WHERE p.id<o.id AND p.game=o.game AND p.kind='session' AND p.view_id=o.view_id AND json_type(p.payload,'$.seq')='integer' AND json_extract(p.payload,'$.seq')=json_extract(o.payload,'$.seq')))), views AS (SELECT game,view_id,MAX(CASE WHEN json_extract(payload,'$.trackingVersion')>=11 THEN 1 ELSE 0 END) AS v11 FROM clean WHERE kind='visit' AND COALESCE(view_id,'')<>'' GROUP BY game,view_id), actions AS (SELECT game,view_id,MAX(CASE WHEN json_extract(payload,'$.signals.bond_enter')>0 THEN 1 ELSE 0 END) AS entered,MAX(CASE WHEN json_extract(payload,'$.signals.funnel_first_run')>0 THEN 1 ELSE 0 END) AS firstPlay,MAX(CASE WHEN json_extract(payload,'$.signals.funnel_first_finish')>0 THEN 1 ELSE 0 END) AS firstFinish,MAX(CASE WHEN json_extract(payload,'$.signals.bond_battle_end_v2')>0 THEN 1 ELSE 0 END) AS battleEnd FROM clean WHERE kind='session' GROUP BY game,view_id) ";
const funnels=await query(cte+"SELECT v.game,SUM(COALESCE(a.firstPlay,0)) AS firstPlayPages,SUM(CASE WHEN a.firstPlay=1 AND a.firstFinish=1 THEN 1 ELSE 0 END) AS firstFinishPages,SUM(COALESCE(a.entered,0)) AS entryPages,SUM(v.v11) AS v11Visits,SUM(CASE WHEN v.v11=1 AND a.entered=1 THEN 1 ELSE 0 END) AS v11EntryPages,SUM(CASE WHEN v.v11=1 AND a.entered=1 AND a.battleEnd=1 THEN 1 ELSE 0 END) AS v11FinishPages FROM views v LEFT JOIN actions a ON a.game=v.game AND a.view_id=v.view_id GROUP BY v.game",args);
const signals=await query(cte+"SELECT c.game,j.key AS signal,SUM(CAST(j.value AS INTEGER)) AS n FROM clean c,json_each(c.payload,'$.signals') j WHERE c.kind='session' GROUP BY c.game,j.key",args);
const coverage=await query("SELECT game,kind,COUNT(*) AS n,MIN(ts) AS firstTs,MAX(ts) AS lastTs FROM events WHERE id<=? AND ts<=? GROUP BY game,kind ORDER BY game,kind",[maxId,Date.parse(cutoff)]);
const prior=await query("SELECT game,kind,COUNT(*) AS n FROM events WHERE id<=? AND ts<? GROUP BY game,kind",[maxId,Date.parse(start)]);
const rawCounts=await query("SELECT CASE WHEN ts<=? THEN 'previousWindow' ELSE 'newIncrement' END AS segment,COUNT(*) AS n FROM events WHERE ts>=? AND ts<=? AND id<=? GROUP BY segment",[Date.parse(previousLastEventAt),...args]);
const checks=[];const check=(name,a,b)=>checks.push({name,actual:a,expected:b,pass:a===b});
for(const g of report.allGames){
 const row=funnels.find(r=>r.game===g.game)||{};
 for(const k of ['firstPlayPages','firstFinishPages',...(g.game==='cat-bond'?['entryPages','v11Visits','v11EntryPages','v11FinishPages']:[])])check(g.game+' independent joined '+k,Number(row[k]||0),g[k]);
 const sg=Object.fromEntries(signals.filter(r=>r.game===g.game).map(r=>[r.signal,Number(r.n)]));
 for(const k of new Set([...Object.keys(sg),...Object.keys(g.signals)]))check(g.game+' independent signal '+k,sg[k]||0,g.signals[k]||0);
}
const legacy=JSON.parse(fs.readFileSync('recovery/d1-analytics-audit.json','utf8'));
for(const g of report.split){
 const old=legacy.byGame.find(x=>x.game===g.game);if(!old)continue;
 const m=g.oldWindowRecomputed;
 for(const [k,v] of [['visitRows',old.visitRows],['sessionRows',old.sessionRows],['legacyStarts',old.rawBattleStarts],['legacyEnds',old.rawBattleFinishes],['legacyRetries',old.rawRetries]])check(g.game+' historical '+k,m[k],v);
 for(const k of new Set([...Object.keys(m.signals),...Object.keys(old.signals||{})]))check(g.game+' historical signal '+k,m.signals[k]||0,old.signals[k]||0);
}
check('previous window record count',Number(rawCounts.find(r=>r.segment==='previousWindow')?.n||0),legacy.scope.rawEventRows);
check('both windows record count',rawCounts.reduce((n,r)=>n+Number(r.n),0),report.scope.rawRows);
const failures=checks.filter(c=>!c.pass);
const result={status:failures.length?'CHALLENGER_FAILED':'CHALLENGER_SQL_PASSED_HISTORICAL_IDENTITY_UNPROVEN',boundary:report.scope,checks,rawCounts,earlierThanReportingStart:prior,coverage,limitations:['Independent SQL verifies stored counts and joins, not unrecorded player actions.','Earlier recovery checkpoint identities are unavailable; aggregate equality does not establish historical event identity.','No browser or production API validation, no production modification.','No model-agent independence is claimed: this is an independent implementation.']};
fs.writeFileSync('audit/dashboard/challenger-report.json',JSON.stringify(result,null,2)+'\n');
const esc=x=>String(x??'待核实').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const b=report.allGames.find(g=>g.game==='cat-bond');
const old=report.split.find(g=>g.game==='cat-bond');
const rows=report.allGames.filter(g=>g.game!=='hub').map(g=>'<tr><td>'+esc(g.game)+'</td><td>'+g.pageLoadsById+'</td><td>'+ (g.recordedFirstPlay||'未记录')+'</td><td>'+(g.firstFinishPages||'未记录')+'</td></tr>').join('');
const metric=(name,n)=>'<div class="metric"><small>'+esc(name)+'</small><strong>'+esc(n)+'</strong></div>';
const html='<!doctype html><html lang="zh"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Studio Audit Preview — NOT PRODUCTION</title><style>body{font:15px system-ui;margin:0;background:#f4f6f8;color:#203043}main{max-width:1000px;margin:auto;padding:26px}h1,h2{margin:12px 0}small,p{color:#536378}section{background:white;padding:18px;margin:16px 0;border:1px solid #dbe1e8;border-radius:12px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(155px,1fr));gap:12px}.metric{padding:12px;border:1px solid #e3e7ed;border-radius:8px}strong{display:block;font-size:26px;margin-top:8px}table{border-collapse:collapse;width:100%}td,th{text-align:left;border-bottom:1px solid #e2e7ed;padding:9px}.warn{border-left:4px solid #b97517;padding:8px 12px;background:#fff8ed}</style><main><small>ISOLATED AUDIT • STATIC OFFLINE PREVIEW • NOT PRODUCTION</small><h1>工作室数据审计预览</h1><p>起点：'+esc(start)+'　原始事件截止：'+esc(report.scope.latestEventAt)+'　审计边界：'+esc(cutoff)+'</p><p class="warn">历史覆盖不完整：显示已记录事件，不冒充完整历史。旧 starts / ends 混合计数不作为开局或战斗结算。未记录并不等于零。独立 SQL：'+esc(result.status)+'</p><section><h2>猫猫纽带</h2><div class="grid">'+metric('页面访问（ID 去重）',b.pageLoadsById)+metric('已记录游戏开局',b.recordedGameEntries)+metric('完整历史战斗',null)+metric('完整历史结算',null)+metric('新版战斗开始信号',b.recordedBattleStartsV2)+metric('新版战斗结算信号',b.recordedBattleEndsV2)+'</div><p>新版 V11 漏斗：'+b.v11Visits+' 次访问 → '+b.v11EntryPages+' 次进入 → '+b.v11FinishPages+' 次至少完成一场战斗。</p><p>前一快照：'+old.oldWindowRecomputed.pageLoadsById+' 浏览 / '+old.oldWindowRecomputed.recordedGameEntries+' 开局；后续新增：'+old.afterOldCutoff.pageLoadsById+' 浏览 / '+old.afterOldCutoff.recordedGameEntries+' 开局。</p></section><section><h2>各游戏已记录数据</h2><table><thead><tr><th>游戏</th><th>页面访问</th><th>首次开玩信号</th><th>首次结算页面</th></tr></thead><tbody>'+rows+'</tbody></table></section><section><h2>猫猫纽带 · 全部历史信号</h2><table><thead><tr><th>信号</th><th>次数</th></tr></thead><tbody>'+Object.entries(b.signals).map(([k,v])=>'<tr><td>'+esc(k)+'</td><td>'+v+'</td></tr>').join('')+'</tbody></table></section><section><h2>验收证据</h2><p>原始事件 '+report.scope.rawRows+'；Builder '+report.checks.filter(x=>x.pass).length+'/'+report.checks.length+'；Challenger '+checks.filter(x=>x.pass).length+'/'+checks.length+'；历史事件身份完整性、真实浏览器仍待核实。</p></section></main></html>';
fs.writeFileSync('audit/dashboard/preview.html',html);
console.log(JSON.stringify({status:result.status,checks:checks.length,failures,rawCounts,earlierThanReportingStart:prior},null,2));
if(failures.length)process.exitCode=1;
