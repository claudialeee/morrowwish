
const json=(x,status=200)=>new Response(JSON.stringify(x),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"}});
const pct=(a,b)=>b?Math.round(a*1000/b)/10:null;
const tidy=(s,max=100)=>typeof s==="string"?s.slice(0,max):"";
const uniq=(a)=>new Set(a.filter(Boolean)).size;
function dateDays(n){const d=new Date();d.setUTCHours(0,0,0,0);const x=[];for(let i=n-1;i>=0;i--)x.push(new Date(d.getTime()-86400000*i).toISOString().slice(0,10));return x;}
function params(req){const n=Number(new URL(req.url).searchParams.get("days"));return Number.isFinite(n)&&n>=1?Math.min(90,Math.floor(n)):7;}
async function read(req,env,category){let days=params(req),dates=dateDays(days);const result=await env.DB.prepare("SELECT category,day,game,visitor,view_id,run_id,event_name,kind,payload FROM events WHERE category=? AND day>=? ORDER BY id DESC LIMIT 10000").bind(category,dates[0]).all();return {days,dates,rows:(result.results||[]).map(r=>({...r,data:JSON.parse(r.payload||"{}")})),partial:(result.results||[]).length>=10000};}
function visitors(rows){return uniq(rows.map(r=>r.visitor||r.view_id));}
function mainStats(x){
  const {rows,dates}=x,visits=rows.filter(r=>r.kind==="visit"),sessions=rows.filter(r=>r.kind==="session");
  const sum=(r,k)=>r.reduce((a,b)=>a+Math.max(0,Number(b.data[k])||0),0);
  const score=(part)=>{const visitsOf=part.filter(r=>r.kind==="visit"),sessionsOf=part.filter(r=>r.kind==="session");const times=sum(sessionsOf,"seconds");return {pageviews:uniq(visitsOf.map(r=>r.view_id||r.visitor+"-"+r.day)),visitors:visitors(visitsOf),sessions:uniq([...visitsOf,...sessionsOf].map(r=>r.view_id)),starts:sum(sessionsOf,"starts"),ends:sum(sessionsOf,"ends"),retries:sum(sessionsOf,"retries"),shares:sum(sessionsOf,"shares"),clicks:sum(sessionsOf,"clicks"),completion:sum(sessionsOf,"completion"),avgSeconds:sessionsOf.length?Math.round(times/Math.max(1,uniq(sessionsOf.map(r=>r.view_id)))):0,avgFirstMs:(()=>{let n=sessionsOf.filter(r=>Number(r.data.firstMs)>=0);return n.length?Math.round(n.reduce((s,r)=>s+Number(r.data.firstMs),0)/n.length):0})(),maxLevel:Math.max(0,...sessionsOf.map(r=>Number(r.data.levels)||0))};};
  const breakdown=(key)=>{let m=new Map();for(let r of visits){let v=tidy(r.data[key],100)||"unknown";m.set(v,(m.get(v)||0)+1)}return [...m].map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value).slice(0,16)};
  const byGame=[...new Set(rows.map(r=>r.game).filter(Boolean))].map(game=>{let g=rows.filter(r=>r.game===game);let z=score(g);const sources={direct:0,internal:0,external:0};for(let r of g.filter(r=>r.kind==="visit")){if(r.data.source in sources)sources[r.data.source]++}return {game,...z,sources}}).sort((a,b)=>b.pageviews-a.pageviews);
  const byDay=dates.map(day=>{let r=rows.filter(x=>x.day===day),v=r.filter(x=>x.kind==="visit"),s=r.filter(x=>x.kind==="session");return {day,pageviews:uniq(v.map(r=>r.view_id||r.visitor+"-"+r.day)),visitors:visitors(v),starts:sum(s,"starts"),retries:sum(s,"retries"),shares:sum(s,"shares")}});
  const total=score(rows);
  return {days:x.days,updated:new Date().toISOString(),partial:x.partial,records:rows.length,rollup:{...total,completions:total.completion,d1Cohort:0,d1Returned:0,d1Rate:null,unknownPastVisits:0},byGame,byDay,sources:breakdown("source"),referrers:breakdown("referrer"),devices:breakdown("_device"),countries:breakdown("_country"),sites:breakdown("site")};
}
function elsewhereStats(x){
 const rows=x.rows, events=new Map(),people=new Map(),worlds=["no-work","bookshop","paris","cabin"];const getId=r=>r.run_id||r.data.runId||r.visitor+"-"+(r.data.session||"na");
 for(let r of rows){const id=getId(r),world=r.data.world||"no-work";if(!events.has(id))events.set(id,{id,world,visitor:r.visitor||id,opened:false,views:new Set(),completed:new Set(),finished:false,ending:false,restarted:0,shares:0,route:""});let a=events.get(id);a.world=world;a.visitor=r.visitor||a.visitor;const ev=r.event_name||r.data.event||"";let ch=Number(r.data.chapter);if(ev==="world_open")a.opened=true;if(ev==="chapter_view"&&ch>=1&&ch<=8)a.views.add(ch);if(ev==="chapter_completed"&&ch>=1&&ch<=8)a.completed.add(ch);if(ev==="life_completed"){a.finished=true;a.route=tidy(r.data.routeVector,60)||a.route;}if(ev==="ending_view")a.ending=true;if(ev==="life_restarted")a.restarted++;if(ev==="share_clicked")a.shares++;if(r.data.routeVector)a.route=tidy(r.data.routeVector,60);}
 const runs=[...events.values()],opened=runs.filter(a=>a.opened),count=(pred)=>runs.filter(pred).length,has=(k,phase)=>count(a=>a[phase].has(k));
 const firstViews=has(1,"views"),firstCompletions=has(1,"completed");
 const worldSummary=worlds.map(world=>{let a=runs.filter(r=>r.world===world);let starts=a.filter(r=>r.opened).length,first=a.filter(r=>r.completed.has(1)).length,views=a.filter(r=>r.views.has(1)).length,ends=a.filter(r=>r.finished).length;return {world,starts,ch1Views:views,ch1Completed:first,firstRate:pct(first,views),ends,endingViews:a.filter(r=>r.ending).length,replays:a.reduce((n,r)=>n+r.restarted,0),fullRate:pct(ends,starts)};});
 const visitorGroups=new Map();for(let a of runs){let p=visitorGroups.get(a.visitor)||[];p.push(a);visitorGroups.set(a.visitor,p)}const replayVisitors=[...visitorGroups.values()].filter(g=>g.filter(x=>x.opened).length>=2||g.some(x=>x.restarted>0)).length;const differentRouteVisitors=[...visitorGroups.values()].filter(g=>new Set(g.filter(x=>x.finished).map(x=>x.world+":"+x.route)).size>=2).length;
 const routeMap=new Map();for(let a of runs.filter(a=>a.finished&&a.route)){let k=a.world+"|"+a.route;routeMap.set(k,(routeMap.get(k)||0)+1)}const routes=[...routeMap].map(([key,count])=>({world:key.split("|")[0],route:key.split("|")[1],count})).sort((a,b)=>b.count-a.count).slice(0,12);
 return {updated:new Date().toISOString(),days:x.days,records:rows.length,partial:x.partial,readErrors:0,trackingVersion:2,summary:{runs:opened.length,firstViews,firstCompletions,firstCompletionRate:pct(firstCompletions,firstViews),completed:count(a=>a.finished),endingViews:count(a=>a.ending),replayVisitors,replayRate:pct(replayVisitors,visitorGroups.size),differentRouteVisitors,differentRouteReplayRate:pct(differentRouteVisitors,replayVisitors),differentRouteDenominator:replayVisitors,shares:runs.reduce((n,r)=>n+r.shares,0)},funnel:Array.from({length:8},(_,i)=>[{step:(i+1)+"-view",value:has(i+1,"views")},{step:(i+1)+"-complete",value:has(i+1,"completed")}]).flat(),continueRates:Array.from({length:7},(_,i)=>{const from=i+1,eligible=has(from,"completed"),continued=runs.filter(r=>r.completed.has(from)&&r.views.has(from+1)).length;return {from,to:from+1,eligible,continued,rate:pct(continued,eligible)}}),worlds:worldSummary,routes};
}
const cookieName="morrowwish_studio_auth", ttl=30*24*60*60;
async function signSession(exp,keyText){
 const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(keyText),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 const bytes=await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(String(exp)));
 return Array.from(new Uint8Array(bytes)).map(x=>x.toString(16).padStart(2,"0")).join("");
}
async function hasSession(req,env){
 const raw=(req.headers.get("cookie")||"").split(";").map(s=>s.trim()).find(x=>x.startsWith(cookieName+"="));
 if(!raw)return false;
 const match=/^(\d{10})\.([a-f0-9]{64})$/.exec(raw.slice(cookieName.length+1));
 if(!match)return false;
 const exp=Number(match[1]),now=Math.floor(Date.now()/1000);
 if(exp<=now||exp>now+ttl)return false;
 const expected=await signSession(exp,env.ARCADE_ANALYTICS_KEY);
 let diff=0;for(let i=0;i<64;i++)diff|=match[2].charCodeAt(i)^expected.charCodeAt(i);
 return diff===0;
}
export async function api(req,env){
 const p=new URL(req.url).pathname;
 if(p==="/api/auth"){
   if(req.method!=="POST")return json({error:"POST required"},405);
   if(!env.ARCADE_ANALYTICS_KEY)return json({error:"Access not configured"},503);
   if(req.headers.get("x-analytics-key")!==env.ARCADE_ANALYTICS_KEY)return json({error:"Access denied"},401);
   const exp=Math.floor(Date.now()/1000)+ttl;
   const signed=await signSession(exp,env.ARCADE_ANALYTICS_KEY);
   const response=json({ok:true,expiresInDays:30},200);
   response.headers.set("Set-Cookie",cookieName+"="+exp+"."+signed+"; Max-Age="+ttl+"; Path=/api; HttpOnly; Secure; SameSite=Strict");
   return response;
 }
 if(p==="/api/logout"){
   if(req.method!=="POST")return json({error:"POST required"},405);
   const response=json({ok:true},200);
   response.headers.set("Set-Cookie",cookieName+"=; Max-Age=0; Path=/api; HttpOnly; Secure; SameSite=Strict");
   return response;
 }
 if(!env.DB)return json({error:"Database not configured"},503);
 if(p==="/api/session"||p==="/api/elsewhere-collect"){
  if(req.method!=="POST")return json({error:"POST required"},405);
  const origin=req.headers.get("Origin");if(origin){try{if(!new Set([new URL(req.url).origin,"https://morrowwish.vercel.app"]).has(new URL(origin).origin))return json({error:"Origin not allowed"},403)}catch{return json({error:"Invalid origin"},403)}}
  const raw=await req.text();if(raw.length>4000)return json({error:"Payload too large"},413);
  let data;try{data=JSON.parse(raw)}catch{return json({error:"Invalid JSON"},400)}
  if(!data||typeof data!=="object")return json({error:"Invalid event"},400);
  const category=p==="/api/session"?"arcade":"elsewhere";
  if(category==="arcade"&&!["visit","session"].includes(data.kind))return json({error:"Invalid kind"},400);
  if(category==="elsewhere"&&!["world_open","chapter_view","choice_made","chapter_completed","life_completed","life_restarted","ending_view","share_clicked","ending_feedback"].includes(data.event))return json({error:"Invalid event"},400);
  data._device=/mobile|android|iphone/i.test(req.headers.get("User-Agent")||"")?"mobile":"desktop";data._country=req.cf?.country||"unknown";
  const now=Date.now(),day=new Date(now).toISOString().slice(0,10),game=category==="elsewhere"?"elsewhere":tidy(data.game||"hub",40),visitor=tidy(data.visitor,80),viewId=tidy(data.viewId,90)||tidy(data.session,90)||crypto.randomUUID(),runId=tidy(data.runId,90);
  await env.DB.prepare("INSERT INTO events(category,day,ts,game,visitor,view_id,run_id,event_name,kind,payload) VALUES(?,?,?,?,?,?,?,?,?,?)").bind(category,day,now,game,visitor,viewId,runId,tidy(data.event,48),tidy(data.kind,48),JSON.stringify(data)).run();
  return json({ok:true},202);
 }
 if(p==="/api/summary"||p==="/api/elsewhere-summary"){
  if(req.method!=="GET")return json({error:"GET required"},405);
  if(!env.ARCADE_ANALYTICS_KEY)return json({error:"Dashboard key not configured"},503);
  if(req.headers.get("x-analytics-key")!==env.ARCADE_ANALYTICS_KEY && !(await hasSession(req,env)))return json({error:"Access denied"},401);
  const x=await read(req,env,p==="/api/summary"?"arcade":"elsewhere");
  return json(p==="/api/summary"?mainStats(x):elsewhereStats(x));
 }
 return json({error:"Not found"},404);
}
