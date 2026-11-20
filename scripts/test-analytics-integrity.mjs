// Local end-to-end contract for the D1-bound analytics handler.
// No production events, API secrets or internet access are used.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const source=fs.readFileSync('src/analytics.js','utf8').replace('export async function api','async function api');
const {api}=new Function(source+';return {api};')();
const games=['pawsibly-innocent','tiny-town','elsewhere','flip-dash','parcel-panic','pocket-aquarium'];
const rows=[];
const DB={prepare(sql){
 let args=[];
 return {
  bind(...v){args=v;return this},
  async run(){
   if(sql.startsWith('INSERT INTO events'))rows.push({category:args[0],day:args[1],game:args[3],visitor:args[4],view_id:args[5],run_id:args[6],event_name:args[7],kind:args[8],payload:args[9],id:rows.length+1});
   else if(sql.startsWith('DELETE FROM events')){for(let i=rows.length-1;i>=0;i--)if(rows[i].category===args[0]&&rows[i].view_id===args[1])rows.splice(i,1)}
   else throw Error('Unexpected SQL run '+sql);
   return {success:true}
  },
  async first(){
   assert.match(sql,/SELECT id FROM events/);
   return rows.find(r=>r.category===args[0]&&r.view_id===args[1])||null;
  },
  async all(){
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
  {kind:'visit',game:g,viewId,visitor:'test-visitor',utmSource:'bluesky',source:'external'},
  {kind:'session',game:g,viewId,visitor:'test-visitor',starts:1,ends:1,completion:1,seconds:42,utmSource:'bluesky'}
 ]){
  const result=await api(req('/api/session',event),env);
  assert.equal(result.status,202,g+' visit or session write');
 }
 const probe='mw-qa-'+['00000000','0000','4000','8000',String(i).padStart(12,'0')].join('-');
 const smoke=await api(req('/api/session',{kind:'visit',game:g,viewId:probe,visitor:'qa',smokeProbe:'mw-qa-v1'}),env);
 assert.equal(smoke.status,202,g+' probe write');
 assert.equal(rows.find(x=>x.view_id===probe).category,'diagnostic',g+' isolated');
 const checked=await api(new Request('https://morrowwish.pages.dev/api/diagnostic-check?probe='+probe),env);
 assert.deepEqual(await checked.json(),{recorded:true,removed:true},g+' read and clean');
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
assert.equal(summary.byChannel.find(x=>x.source==='bluesky')?.starts,8,'combined referral starts');
assert.equal(rows.some(x=>x.category==='diagnostic'),false,'no persistent smoke events');
console.log('Six-game D1 analytics contract: visit, start, end, referral, auth and diagnostic write/read/delete all passed.');
