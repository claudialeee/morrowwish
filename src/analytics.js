
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
  const score=(part)=>{
    const visitsOf=part.filter(r=>r.kind==="visit"),sessionsOf=part.filter(r=>r.kind==="session");
    const pageviews=uniq(visitsOf.map(r=>r.view_id||r.visitor+"-"+r.day));
    const startedViews=uniq(sessionsOf.filter(r=>Number(r.data.starts)>0).map(r=>r.view_id));
    const times=sum(sessionsOf,"seconds"),signals={};
    for(const r of sessionsOf)for(const [k,v] of Object.entries(r.data.signals||{})){
      if(/^[a-z0-9_-]{2,40}$/.test(k)&&Number.isFinite(Number(v))&&Number(v)>0)signals[k]=(signals[k]||0)+Math.min(10000,Number(v));
    }
    return {pageviews,visitors:visitors(visitsOf),sessions:uniq([...visitsOf,...sessionsOf].map(r=>r.view_id)),startedViews,startRate:pct(startedViews,pageviews),starts:sum(sessionsOf,"starts"),ends:sum(sessionsOf,"ends"),retries:sum(sessionsOf,"retries"),shares:sum(sessionsOf,"shares"),clicks:sum(sessionsOf,"clicks"),completion:sum(sessionsOf,"completion"),avgSeconds:sessionsOf.length?Math.round(times/Math.max(1,uniq(sessionsOf.map(r=>r.view_id)))):0,signals};
  };
  const breakdown=(key)=>{let m=new Map();for(let r of visits){let v=tidy(r.data[key],100);if(!v)v=key==="referrer"&&r.data.source==="direct"?"direct_no_referrer":"unknown";m.set(v,(m.get(v)||0)+1)}return [...m].map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value).slice(0,16)};
  const byGame=[...new Set(rows.map(r=>r.game).filter(Boolean))].map(game=>{let g=rows.filter(r=>r.game===game);let z=score(g);const sources={direct:0,internal:0,external:0};for(let r of g.filter(r=>r.kind==="visit")){if(r.data.source in sources)sources[r.data.source]++}return {game,...z,sources}}).sort((a,b)=>b.pageviews-a.pageviews);
  const byDay=dates.map(day=>{let r=rows.filter(x=>x.day===day),v=r.filter(x=>x.kind==="visit"),s=r.filter(x=>x.kind==="session");return {day,pageviews:uniq(v.map(r=>r.view_id||r.visitor+"-"+r.day)),visitors:visitors(v),starts:sum(s,"starts"),retries:sum(s,"retries"),shares:sum(s,"shares")}});
  // Attribute every visit and its subsequent session deltas to the actual game + campaign.
  // UTM beats referrer, which beats direct. Keep organic traffic as a separate cohort.
  const channelGroups=new Map();
  for(const r of rows){
    if(r.kind!=="visit"&&r.kind!=="session")continue;
    const d=r.data||{};
    const source=tidy(d.utmSource,45)||((d.source==="external"&&d.referrer)?tidy(d.referrer,60):d.source==="internal"?"internal":"direct");
    const campaign=tidy(d.utmCampaign,45)||"organic";
    const game=tidy(r.game,40);
    const key=JSON.stringify([game,source,campaign]);
    if(!channelGroups.has(key))channelGroups.set(key,{game,source,campaign,views:new Set(),startedViews:new Set(),visitors:new Set(),runs:0,retries:0,seconds:0,ends:0,shares:0});
    const z=channelGroups.get(key);
    if(r.kind==="visit"){z.views.add(r.view_id||r.visitor+"-"+r.day);z.visitors.add(r.visitor||r.view_id);}
    else {if(Number(d.starts)>0)z.startedViews.add(r.view_id);z.runs+=Math.max(0,Number(d.starts)||0);z.retries+=Math.max(0,Number(d.retries)||0);z.ends+=Math.max(0,Number(d.ends)||0);z.shares+=Math.max(0,Number(d.shares)||0);z.seconds+=Math.max(0,Number(d.seconds)||0);}
  }
  const byGameChannel=[...channelGroups.values()].map(z=>({game:z.game,source:z.source,campaign:z.campaign,pageviews:z.views.size,visitors:z.visitors.size,starts:z.runs,retries:z.retries,ends:z.ends,shares:z.shares,avgSeconds:z.views.size?Math.round(z.seconds/z.views.size):0,startRate:pct(z.startedViews.size,z.views.size)})).sort((a,b)=>b.pageviews-a.pageviews).slice(0,150);
  const total=score(rows.filter(r=>r.game!=="hub"));
  const all=score(rows);
  return {days:x.days,updated:new Date().toISOString(),partial:x.partial,records:rows.length,rollup:{...all,gameStarts:total.starts,gameAvgSeconds:total.avgSeconds,completions:total.completion,unknownPastVisits:0},byGame,byDay,byGameChannel,sources:breakdown("source"),referrers:breakdown("referrer"),devices:breakdown("_device"),countries:breakdown("_country"),sites:breakdown("site")};
}
function elsewhereStats(x){
 // Five-scene edition only. Legacy eight-scene records stay in D1 but are not mixed into this funnel.
 const rows=x.rows.filter(r=>Number(r.data.scenes)===5),runsById=new Map(),worlds=["no-work","bookshop","paris","cabin"];
 for(const r of rows){
   const id=r.run_id||r.data.runId||r.visitor+"-"+(r.data.session||"na");
   if(!runsById.has(id))runsById.set(id,{world:r.data.world||"no-work",visitor:r.visitor||id,opened:false,views:new Set(),completed:new Set(),finished:false,restarted:0});
   const z=runsById.get(id),ev=r.event_name||r.data.event||"",ch=Number(r.data.chapter);
   z.world=r.data.world||z.world;
   if(ev==="world_open")z.opened=true;
   if(ev==="chapter_view"&&ch>=1&&ch<=5)z.views.add(ch);
   if(ev==="chapter_completed"&&ch>=1&&ch<=5)z.completed.add(ch);
   if(ev==="life_completed")z.finished=true;
   if(ev==="life_restarted")z.restarted++;
 }
 const runs=[...runsById.values()],opened=runs.filter(r=>r.opened),has=(k,phase)=>runs.filter(r=>r[phase].has(k)).length;
 const finished=opened.filter(r=>r.finished).length;
 const visitorGroups=new Map();
 for(const r of opened){if(!visitorGroups.has(r.visitor))visitorGroups.set(r.visitor,[]);visitorGroups.get(r.visitor).push(r);}
 const replayVisitors=[...visitorGroups.values()].filter(a=>a.length>=2||a.some(r=>r.restarted>0)).length;
 const continueRates=Array.from({length:4},(_,i)=>{const from=i+1,eligible=has(from,"completed"),continued=runs.filter(r=>r.completed.has(from)&&r.views.has(from+1)).length;return {from,to:from+1,eligible,continued,rate:pct(continued,eligible)};});
 const dropoff=continueRates.filter(r=>r.eligible>0).sort((a,b)=>(b.eligible-b.continued)-(a.eligible-a.continued)||a.from-b.from)[0];
 const worldSummary=worlds.map(world=>{const a=opened.filter(r=>r.world===world),done=a.filter(r=>r.finished).length;return {world,starts:a.length,ends:done,fullRate:pct(done,a.length)};});
 return {updated:new Date().toISOString(),days:x.days,records:rows.length,partial:x.partial,trackingVersion:5,summary:{runs:opened.length,completed:finished,fullRate:pct(finished,opened.length),replayVisitors,replayRate:pct(replayVisitors,visitorGroups.size),dropoffChapter:dropoff?.from||null,dropoffRate:dropoff?.rate??null,dropoffLost:dropoff?dropoff.eligible-dropoff.continued:0},funnel:Array.from({length:5},(_,i)=>[{step:(i+1)+"-view",value:has(i+1,"views")},{step:(i+1)+"-complete",value:has(i+1,"completed")}]).flat(),continueRates,worlds:worldSummary};
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
