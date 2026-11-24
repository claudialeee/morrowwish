// Local end-to-end contract for the D1-bound analytics handler.
// No production events, API secrets or internet access are used.
import assert from 'node:assert/strict';
// Exercise the REAL deployed ESM handler, including its imported native
// routes. Rewriting an ESM module as new Function() breaks on genuine imports
// and does not faithfully test production module loading.
const {api}=await import('../src/analytics.js');
const games=['pawsibly-innocent','tiny-town','elsewhere','flip-dash','parcel-panic','pocket-aquarium','cat-bond'];
const rows=[];
const DB={prepare(sql){
 let args=[];
 return {
  bind(...v){args=v;return this},
  async run(){
   if(sql.startsWith('INSERT INTO events'))rows.push({category:args[0],day:args[1],ts:args[2],game:args[3],visitor:args[4],view_id:args[5],run_id:args[6],event_name:args[7],kind:args[8],payload:args[9],id:rows.length+1});
   else if(sql==='DELETE FROM events WHERE category=? AND view_id=?'){assert.equal(args[0],'diagnostic','Only isolated diagnostic cleanup is allowed');for(let i=rows.length-1;i>=0;i--)if(rows[i].category===args[0]&&rows[i].view_id===args[1])rows.splice(i,1)}
   else throw Error('Unexpected SQL run '+sql);
   return {success:true}
  },
  async first(){
   assert.match(sql,/SELECT id FROM events/);
   return rows.find(r=>r.category===args[0]&&r.view_id===args[1])||null;
  },
  async all(){
   if(sql.startsWith('SELECT id,category,day,game,ts,visitor,view_id,run_id,event_name,kind,payload FROM events WHERE category=? AND ts>=? AND id<?')){
     return {results:rows.filter(r=>r.category===args[0]&&Number(r.ts)>=Number(args[1])&&Number(r.id)<Number(args[2])).sort((a,b)=>b.id-a.id).slice(0,400)};
    }
    if(sql.startsWith('SELECT kind,payload FROM events'))return {results:rows.filter(r=>r.category===args[0]&&r.view_id===args[1]).sort((a,b)=>a.id-b.id)};
   if(sql.includes('WITH page_visits AS')){
    const counts=new Map();
    const sessions=rows.filter(r=>r.category==='arcade'&&r.game==='cat-bond'&&r.kind==='session'&&r.day>=args[1]);
    const states=new Map();
    for(const r of sessions){const v=JSON.parse(r.payload||'{}'),z=states.get(r.view_id)||{started:0,finished:0};if(Number(v.starts)>0)z.started=1;if(Number(v.ends)>0)z.finished=1;states.set(r.view_id,z);}
    for(const r of rows.filter(r=>r.category==='arcade'&&r.game==='cat-bond'&&r.kind==='visit'&&r.day>=args[0])){
     const z=counts.get(r.day)||{day:r.day,rawVisits:0,keys:new Set()};
     z.rawVisits++;z.keys.add(r.view_id||'visit-row:'+r.id);counts.set(r.day,z);
    }
    return {results:[...counts.values()].sort((a,b)=>a.day.localeCompare(b.day)).map(x=>({
     day:x.day,rawVisits:x.rawVisits,pageviews:x.keys.size,
     startedViews:[...x.keys].filter(id=>states.get(id)?.started).length,
     finishedViews:[...x.keys].filter(id=>states.get(id)?.started&&states.get(id)?.finished).length
    }))};
   }
   if(sql.startsWith('SELECT MIN(day) AS firstDay')){
    const visits=rows.filter(r=>r.category==='arcade'&&r.game==='cat-bond'&&r.kind==='visit');
    const days=visits.map(r=>r.day).sort();
    return {results:[{firstDay:days[0]||null,lastDay:days.at(-1)||null,rawVisits:visits.length,
     pageviews:visits.length}]};
   }
   assert.match(sql,/SELECT category,day,game/);
   return {results:rows.filter(r=>r.category===args[0]&&r.day>=args[1]).sort((a,b)=>b.id-a.id)};
  }
 }
}};
const env={DB,ARCADE_ANALYTICS_KEY:'local-test-key-not-a-secret'};
const req=(route,data)=>new Request('https://morrowwish.pages.dev'+route,{
 method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify(data)
});
for(let i=0;i<games.length;i++){
 const g=games[i],viewId='test-view-'+g;
 for(const event of [
  {kind:'visit',game:g,viewId,visitor:'test-visitor',utmSource:g==='cat-bond'?'itchio':'bluesky',source:'external',trackingVersion:g==='cat-bond'?11:undefined},
  {kind:'session',game:g,viewId,visitor:'test-visitor',starts:1,ends:1,completion:1,seconds:42,utmSource:g==='cat-bond'?'itchio':'bluesky',
 seq:g==='cat-bond'?0:undefined,
 signals:g==='cat-bond'?{bond_enter:1,bond_battle_start_v2:1,bond_battle_end_v2:1}:undefined}
 ]){
  const result=await api(req('/api/session',event),env);
  assert.equal(result.status,202,g+' visit or session write');
 }
 const probe='mw-qa-'+['00000000','0000','4000','8000',String(i).padStart(12,'0')].join('-');
 const smoke=await api(req('/api/session',{kind:'visit',game:g,viewId:probe,visitor:'qa',smokeProbe:'mw-qa-v1'}),env);
 assert.equal(smoke.status,202,g+' probe write');
 assert.equal(rows.find(x=>x.view_id===probe).category,'diagnostic',g+' isolated');
 const smokeFinish=await api(req('/api/session',{kind:'session',game:g,viewId:probe,visitor:'qa',smokeProbe:'mw-qa-v1',starts:1,ends:1}),env);
 assert.equal(smokeFinish.status,202,g+' diagnostic start and finish write');
 const checked=await api(new Request('https://morrowwish.pages.dev/api/diagnostic-check?probe='+probe),env);
 assert.deepEqual(await checked.json(),{recorded:true,sessionRecorded:true,startRecorded:true,endRecorded:true,removed:true},g+' completed run read and clean');
 assert.equal(rows.find(x=>x.view_id===probe),undefined,g+' probe cleanup');
}
for(const g of ['flip-dash','parcel-panic']){
 const id='test-abandoned-'+g;
 for(const evt of [
  {kind:'visit',game:g,viewId:id,visitor:'test-visitor',utmSource:'bluesky',source:'external'},
  {kind:'session',game:g,viewId:id,visitor:'test-visitor',starts:1,ends:0,abandons:1,seconds:9,utmSource:'bluesky'}
 ]){
  const response=await api(req('/api/session',evt),env);
  assert.equal(response.status,202,g+' abandoned-run write');
 }
}
// A refresh/reopen can produce another visit row with the same view_id.
const originalBondVisit=rows.find(x=>x.game==='cat-bond'&&x.kind==='visit');
rows.push({...originalBondVisit,id:rows.length+1});
// Duplicate delivery of the same incremental session must not inflate counts.
const oldSession=rows.find(x=>x.game==='cat-bond'&&x.kind==='session');
rows.push({...oldSession,id:rows.length+1});
const bad=await api(new Request('https://morrowwish.pages.dev/api/diagnostic-check?probe=bad'),env);
assert.equal(bad.status,400,'invalid diagnostic token must be rejected');
// Simulate a browser event stored under the next UTC date but still on the
// previous Pacific calendar day (Nov 22, 16:30 PT).
const boundaryVisit=rows.find(r=>r.category==='arcade'&&r.game==='cat-bond'&&r.kind==='visit');
assert.ok(boundaryVisit,'boundary visit fixture exists');
boundaryVisit.day='2026-11-23';
boundaryVisit.ts=Date.parse('2026-11-23T00:30:00.000Z');
const auth=await api(new Request('https://morrowwish.pages.dev/api/summary?days=1'),env);
assert.equal(auth.status,401,'real dashboard must remain password protected');
const response=await api(new Request('https://morrowwish.pages.dev/api/summary?days=1',{headers:{'x-analytics-key':env.ARCADE_ANALYTICS_KEY}}),env);
assert.equal(response.status,200);
const summary=await response.json();
assert.equal(summary.byDay.find(r=>r.day==='2026-11-22')?.pageviews,1,
 'UTC Nov 23 event at 16:30 PT must be grouped into Nov 22 Pacific day');
for(const g of games){
 const row=summary.byGame.find(x=>x.game===g);
 const endless=g==='flip-dash'||g==='parcel-panic';
 assert.equal(row?.starts,endless?2:1,g+' all starts counted');
 assert.equal(row?.ends,1,g+' finished run counted');
 assert.equal(row?.abandons,endless?1:0,g+' abandoned runs never count as completions');
 assert.equal(row?.pageviews,g==='cat-bond'?2:endless?2:1,g+' raw page loads counted');
}
assert.equal(summary.byChannel.find(x=>x.source==='bluesky')?.starts,8,'unrelated referral starts');
const bond=summary.byGame.find(x=>x.game==='cat-bond');
assert.deepEqual([bond?.historicalVisitFunnel?.pageviews,bond?.historicalVisitFunnel?.startedViews,bond?.historicalVisitFunnel?.finishedViews],[1,1,1],'Joined all-version visit funnel');
assert.equal(bond?.conversion?.pageviews,1,'V2 denominator is the new cohort only');
assert.equal(bond?.conversion?.startedViews,1,'V2 starts count page entry');
assert.equal(bond?.conversion?.finishedViews,1,'V2 finishes count distinct pages');
assert.equal(bond?.signals.bond_battle_start_v2,1,'duplicate seq cannot inflate battles');
assert.equal(bond?.signals.bond_battle_end_v2,1,'duplicate seq cannot inflate results');
for(const g of summary.byGame.filter(g=>g.game!=='hub')){
 assert.equal(g.conversion.pageviews,g.game==='cat-bond'?1:g.pageviews,
   g.game+' conversion denominator uses distinct page visits, not raw refresh pageviews');
 assert.equal(g.conversion.visitStart,100,g.game+' visit to play');
 // Flip Dash and Parcel Panic include one extra abandoned visit/run, so
 // completion conversion is correctly 1/2, not a fabricated 100%.
 const withAbandoned=g.game==='flip-dash'||g.game==='parcel-panic';
 assert.equal(g.conversion.startFinish,withAbandoned?50:100,g.game+' play to finish');
 assert.equal(g.conversion.visitFinish,withAbandoned?50:100,g.game+' visit to finish');
}
// Legacy rare encounters vs captures: the old 4/57 events must remain in
// historical reporting but never be mistaken for V2 same-funnel conversions.
for(const event of [
 {kind:'visit',game:'cat-bond',viewId:'legacy-bond',visitor:'legacy',source:'direct'},
 {kind:'session',game:'cat-bond',viewId:'legacy-bond',visitor:'legacy',
  starts:4,ends:3,signals:{bond_enter:1,bond_rare_encounter:4,bond_rare_capture:57}}
])assert.equal((await api(req('/api/session',event),env)).status,202,'legacy fixture accepted');
// Same visitor/day, no view_id: count both raw page loads separately.
for(let i=0;i<2;i++)rows.push({id:rows.length+1,category:'arcade',day:'2026-11-22',
 ts:Date.parse('2026-11-22T18:00:00.000Z')+i,game:'cat-bond',visitor:'legacy-no-view',
 view_id:null,kind:'visit',payload:'{}'});
const mixedResponse=await api(new Request('https://morrowwish.pages.dev/api/summary?days=1',{
 headers:{'x-analytics-key':env.ARCADE_ANALYTICS_KEY}}),env);
const mixed=(await mixedResponse.json()).byGame.find(g=>g.game==='cat-bond');
assert.equal(mixed.pageviews,5,'Every raw page load counts, including refreshes and legacy visits without view IDs');
assert.equal(mixed.starts,5,'Preserve five raw battle starts across two visits');
assert.equal(mixed.ends,4,'Preserve four raw battle finishes across two visits');
assert.deepEqual([mixed.historicalVisitFunnel.pageviews,mixed.historicalVisitFunnel.startedViews,mixed.historicalVisitFunnel.finishedViews],[4,2,2],
  'Conversion columns count distinct page visits; raw pageviews separately include refreshes');
assert.equal(mixed.conversion.pageviews,1,'Legacy PV excluded from V2 funnel');
assert.equal(mixed.conversion.finishedViews,1,'Legacy finish excluded from V2 funnel');
assert.equal(mixed.signals.bond_rare_encounter,4,'Old encounter counts preserved');
assert.equal(mixed.signals.bond_rare_capture,57,'Old capture counts preserved');
const auditDenied=await api(new Request('https://morrowwish.pages.dev/api/cat-bond-traffic-audit?days=1'),env);
assert.equal(auditDenied.status,401,'Owner audit must require authentication');
const auditResponse=await api(new Request('https://morrowwish.pages.dev/api/cat-bond-traffic-audit?days=1',{
 headers:{'x-analytics-key':env.ARCADE_ANALYTICS_KEY}}),env);
assert.equal(auditResponse.status,200,'Owner D1 audit should succeed');
const audit=await auditResponse.json();
assert.equal(audit.source,'full-d1-event-read');
assert.equal(audit.total,5,'Full D1 audit counts every raw page load');
assert.deepEqual(audit.totals,{pageviews:5,startedViews:2,finishedViews:2},
 'Uncapped D1 visit funnel counts each visit at most once');
assert.equal(audit.history.pageviews,5,'Stored lifetime count must include refreshes and legacy page loads');
assert.equal(audit.byDay.reduce((n,r)=>n+r.pageviews,0),5,'Daily raw pageview counts must reconcile');

assert.equal(summary.byChannel.find(x=>x.source==='itch')?.pageviews,2,'itch channel counts both original load and refresh');
assert.equal(summary.byChannel.find(x=>x.source==='itch')?.starts,1,'legacy itchio start must appear in itch channel');
assert.equal(summary.itch?.pageviews,1,'itch game rollup includes historic itchio campaign visit');
assert.equal(summary.itch?.starts,1,'itch game rollup includes historic itchio start');
assert.equal(summary.itch?.games.find(x=>x.game==='cat-bond')?.pageviews,1,'Cat Bond itchio visit mapped back to itch');
assert.equal(rows.some(x=>x.category==='diagnostic'),false,'no persistent smoke events');
// Regression: no caller, including a fully authenticated owner, may erase history.
const resetUrl='https://morrowwish.pages.dev/api/reset-metrics';
const resetReq=(confirm='RESET_METRICS',extra={})=>new Request(resetUrl,{method:'POST',headers:{
 Origin:'https://morrowwish.vercel.app','Content-Type':'application/json',
 'X-Morrowwish-Reset':'confirmed',...extra
},body:JSON.stringify({confirm})});
const loginResponse=await api(new Request('https://morrowwish.pages.dev/api/auth',{
 method:'POST',headers:{'x-analytics-key':env.ARCADE_ANALYTICS_KEY}
}),env);
assert.equal(loginResponse.status,200);
const cookie=loginResponse.headers.get('set-cookie')?.split(';')[0];
assert.ok(cookie?.startsWith('morrowwish_studio_auth='));
// Synthetic recovered historical record BEFORE the old Nov 22 cutoff.
rows.push({id:900,category:'arcade',day:'2026-11-20',ts:Date.parse('2026-11-20T18:00:00Z'),
 game:'cat-bond',visitor:'recovered-fixture',view_id:'recovered-fixture',kind:'visit',payload:'{}'});
const beforeReset=JSON.stringify(rows);
for(const request of [resetReq(),resetReq('RESET_METRICS',{Cookie:cookie}),
 resetReq('RESET_METRICS',{'x-analytics-key':env.ARCADE_ANALYTICS_KEY}),
 resetReq('no',{'x-analytics-key':env.ARCADE_ANALYTICS_KEY}),new Request(resetUrl)]){
 assert.equal((await api(request,env)).status,410,'Destructive reset permanently unavailable');
 assert.equal(JSON.stringify(rows),beforeReset,'Every stored row must remain byte-for-byte unchanged');
}
const retained=await api(new Request('https://morrowwish.pages.dev/api/summary',{
 headers:{Cookie:cookie}}),env);
assert.equal(retained.status,200);
const retainedStats=await retained.json(),retainedBond=retainedStats.byGame.find(g=>g.game==='cat-bond');
assert.equal(retainedStats.dataCoverage.status,'historical-recovery-unverified');
assert.equal(retainedStats.byDay.find(d=>d.day==='2026-11-20')?.pageviews,1,'Pre-Nov22 recovered data must be visible');
assert.equal(retainedBond.pageviews,6,'Recovered historical visit included in total');
assert.equal(retainedBond.recordedGameEntries,2,'Explicit entry signal only, not mixed starts');
assert.equal(retainedBond.starts,5,'Legacy raw counter preserved separately');
const priorArcade=rows.filter(x=>x.category==='arcade').length;
const restarted=await api(req('/api/session',{kind:'visit',game:'cat-bond',viewId:'new-visit',visitor:'test'}),env);
assert.equal(restarted.status,202,'Future gameplay collection still works');
assert.equal(rows.filter(x=>x.category==='arcade').length,priorArcade+1);
assert.equal(JSON.stringify(rows.slice(0,-1)),beforeReset,'New collection does not mutate any historical row');
console.log('Seven-game analytics contract: history preserved, pre-cutoff data included, destructive reset blocked, collection intact.');
await import('./test-cat-bond-analytics-funnel.mjs');
