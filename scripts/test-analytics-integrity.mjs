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
   if(sql.startsWith('INSERT INTO events'))rows.push({category:args[0],day:args[1],game:args[3],visitor:args[4],view_id:args[5],run_id:args[6],event_name:args[7],kind:args[8],payload:args[9],id:rows.length+1});
   else if(sql.startsWith("DELETE FROM events WHERE category IN")){const before=rows.length;for(let i=rows.length-1;i>=0;i--)if(['arcade','elsewhere','diagnostic'].includes(rows[i].category))rows.splice(i,1);return {success:true,meta:{changes:before-rows.length}}}
   else if(sql.startsWith('DELETE FROM events')){for(let i=rows.length-1;i>=0;i--)if(rows[i].category===args[0]&&rows[i].view_id===args[1])rows.splice(i,1)}
   else throw Error('Unexpected SQL run '+sql);
   return {success:true}
  },
  async first(){
   assert.match(sql,/SELECT id FROM events/);
   return rows.find(r=>r.category===args[0]&&r.view_id===args[1])||null;
  },
  async all(){
   if(sql.startsWith('SELECT kind,payload FROM events'))return {results:rows.filter(r=>r.category===args[0]&&r.view_id===args[1]).sort((a,b)=>a.id-b.id)};
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
  {kind:'visit',game:g,viewId,visitor:'test-visitor',utmSource:g==='cat-bond'?'itchio':'bluesky',source:'external'},
  {kind:'session',game:g,viewId,visitor:'test-visitor',starts:1,ends:1,completion:1,seconds:42,utmSource:g==='cat-bond'?'itchio':'bluesky'}
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
const bad=await api(new Request('https://morrowwish.pages.dev/api/diagnostic-check?probe=bad'),env);
assert.equal(bad.status,400,'invalid diagnostic token must be rejected');
const auth=await api(new Request('https://morrowwish.pages.dev/api/summary?days=1'),env);
assert.equal(auth.status,401,'real dashboard must remain password protected');
const response=await api(new Request('https://morrowwish.pages.dev/api/summary?days=1',{headers:{'x-analytics-key':env.ARCADE_ANALYTICS_KEY}}),env);
assert.equal(response.status,200);
const summary=await response.json();
for(const g of games){
 const row=summary.byGame.find(x=>x.game===g);
 const endless=g==='flip-dash'||g==='parcel-panic';
 assert.equal(row?.starts,endless?2:1,g+' all starts counted');
 assert.equal(row?.ends,1,g+' finished run counted');
 assert.equal(row?.abandons,endless?1:0,g+' abandoned runs never count as completions');
 assert.equal(row?.pageviews,endless?2:1,g+' game views counted');
}
assert.equal(summary.byChannel.find(x=>x.source==='bluesky')?.starts,8,'unrelated referral starts');
assert.equal(summary.byChannel.find(x=>x.source==='itch')?.pageviews,1,'legacy itchio visit must appear in itch channel');
assert.equal(summary.byChannel.find(x=>x.source==='itch')?.starts,1,'legacy itchio start must appear in itch channel');
assert.equal(summary.itch?.pageviews,1,'itch game rollup includes historic itchio campaign visit');
assert.equal(summary.itch?.starts,1,'itch game rollup includes historic itchio start');
assert.equal(summary.itch?.games.find(x=>x.game==='cat-bond')?.pageviews,1,'Cat Bond itchio visit mapped back to itch');
assert.equal(rows.some(x=>x.category==='diagnostic'),false,'no persistent smoke events');
// A reset must require authenticated same-origin confirmation and clear all
// reporting categories, while preserving unrelated records and future writes.
const resetUrl='https://morrowwish.pages.dev/api/reset-metrics';
const resetReq=(confirm='RESET_METRICS',extra={})=>new Request(resetUrl,{method:'POST',headers:{
 Origin:'https://morrowwish.vercel.app','Content-Type':'application/json',
 'X-Morrowwish-Reset':'confirmed',...extra
},body:JSON.stringify({confirm})});
const unauth=await api(resetReq(),env);
assert.equal(unauth.status,401,'unauthenticated reset rejected');
assert.equal(rows.length,18,'rejected reset must not affect reporting events');
const wrongOrigin=await api(resetReq('RESET_METRICS',{'Origin':'https://foreign.example','x-analytics-key':env.ARCADE_ANALYTICS_KEY}),env);
assert.equal(wrongOrigin.status,403,'cross-origin reset rejected even with key');
const absentOrigin=await api(resetReq('RESET_METRICS',{'Origin':'','x-analytics-key':env.ARCADE_ANALYTICS_KEY}),env);
assert.equal(absentOrigin.status,403,'originless reset rejected');
const invalidConfirm=await api(resetReq('no',{'x-analytics-key':env.ARCADE_ANALYTICS_KEY}),env);
assert.equal(invalidConfirm.status,400,'unconfirmed reset rejected');
const invalidHeader=await api(resetReq('RESET_METRICS',{'X-Morrowwish-Reset':'','x-analytics-key':env.ARCADE_ANALYTICS_KEY}),env);
assert.equal(invalidHeader.status,400,'missing reset header rejected');
const getReset=await api(new Request(resetUrl),env);
assert.equal(getReset.status,405,'GET may never reset metrics');
const loginResponse=await api(new Request('https://morrowwish.pages.dev/api/auth',{
 method:'POST',headers:{'x-analytics-key':env.ARCADE_ANALYTICS_KEY}
}),env);
assert.equal(loginResponse.status,200);
const cookie=loginResponse.headers.get('set-cookie')?.split(';')[0];
assert.ok(cookie?.startsWith('morrowwish_studio_auth='));
rows.push({category:'other',day:new Date().toISOString().slice(0,10),game:'other',visitor:'control',view_id:'keep-me',payload:'{}',id:999});
const cleared=await api(resetReq('RESET_METRICS',{Cookie:cookie}),env);
assert.equal(cleared.status,200,'signed dashboard session can reset metrics');
assert.deepEqual(await cleared.json(),{ok:true,removed:18},'reset reports removed rows');
assert.deepEqual(rows.map(x=>x.category),['other'],'non-dashboard records remain');
const empty=await api(new Request('https://morrowwish.pages.dev/api/summary?days=1',{headers:{Cookie:cookie}}),env);
assert.equal((await empty.json()).records,0,'dashboard starts empty after reset');
const restarted=await api(req('/api/session',{kind:'visit',game:'cat-bond',viewId:'new-visit',visitor:'test'}),env);
assert.equal(restarted.status,202,'fresh post-reset gameplay events still write normally');
assert.equal(rows.filter(x=>x.category==='arcade').length,1,'tracking restarted');
console.log('Seven-game D1 analytics contract: visit, start, end, referral, auth and diagnostic write/read/delete all passed.');
