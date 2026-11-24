import {authorizedSocialSchedule} from "./social-schedule.js";

import {nativeTikTokRoute,nativeTikTokSnapshot} from "./tiktok-native.js";
import {nativeBlueskySnapshot} from "./bluesky-native.js";
import {nativeYouTubeSnapshot,nativeYouTubeRoute} from "./youtube-native.js";
import {nativeInstagramSnapshot,nativeInstagramRoute} from "./instagram-native.js";
const json=(x,status=200)=>new Response(JSON.stringify(x),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"}});
const pct=(a,b)=>b?Math.round(a*1000/b)/10:null;
const tidy=(s,max=100)=>typeof s==="string"?s.slice(0,max):"";
const uniq=(a)=>new Set(a.filter(Boolean)).size;
const REPORT_FROM="2026-11-22T08:00:00.000Z"; // Nov 22, 00:00 Pacific
const REPORT_FROM_MS=Date.parse(REPORT_FROM);
const pacificDate=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Los_Angeles",year:"numeric",month:"2-digit",day:"2-digit"});
function localDay(ts){
 const p=Object.fromEntries(pacificDate.formatToParts(new Date(ts)).map(x=>[x.type,x.value]));
 return p.year+"-"+p.month+"-"+p.day;
}
function reportDates(fromTs,toTs=Date.now()){
 const first=localDay(fromTs),last=localDay(toTs);
 const cursor=new Date(first+"T12:00:00.000Z"),end=new Date(last+"T12:00:00.000Z"),out=[];
 while(cursor<=end){out.push(cursor.toISOString().slice(0,10));cursor.setUTCDate(cursor.getUTCDate()+1);}
 return out;
}
async function read(req,env,category){
 const requested=Date.parse(new URL(req.url).searchParams.get("from")||REPORT_FROM);
 const fromTs=Number.isFinite(requested)?Math.max(REPORT_FROM_MS,requested):REPORT_FROM_MS;
 const dates=reportDates(fromTs),raw=[];
 // Keyset pagination avoids the former 10,000-row truncation and remains stable
 // while new visits arrive during a dashboard refresh.
 let beforeId=Number.MAX_SAFE_INTEGER;
 for(;;){
  const result=await env.DB.prepare("SELECT id,category,day,game,ts,visitor,view_id,run_id,event_name,kind,payload FROM events WHERE category=? AND ts>=? AND id<? ORDER BY id DESC LIMIT 400").bind(category,fromTs,beforeId).all();
  const batch=result.results||[];
  raw.push(...batch);
  if(batch.length<400)break;
  const next=Number(batch[batch.length-1].id);
  if(!Number.isSafeInteger(next)||next>=beforeId)throw Error("Analytics pagination did not advance");
  beforeId=next;
 }
 const seenSequence=new Set();
 const rows=raw.map(r=>({...r,data:JSON.parse(r.payload||"{}")})).filter(r=>{
  // Browser network retry + fallback beacon can repeat an incremental seq.
  // Preserve unsequenced history; do NOT mutate the production D1 rows.
  const seq=r.data.seq;
  if(category!=="arcade"||r.kind!=="session"||!r.view_id||
     !Number.isInteger(seq)||seq<0)return true;
  const id=r.game+"|"+r.view_id+"|"+seq;
  if(seenSequence.has(id))return false;
  seenSequence.add(id);return true;
 });
 return {days:dates.length,dates,from:new Date(fromTs).toISOString(),rows,partial:false};
}
function visitors(rows){return uniq(rows.map(r=>r.visitor||r.view_id));}
function mainStats(x){
  const {rows,dates}=x,visits=rows.filter(r=>r.kind==="visit"),sessions=rows.filter(r=>r.kind==="session");
  const sum=(r,k)=>r.reduce((a,b)=>a+Math.max(0,Number(b.data[k])||0),0);
  const score=(part)=>{
    const visitsOf=part.filter(r=>r.kind==="visit"),sessionsOf=part.filter(r=>r.kind==="session");
    const pageviews=uniq(visitsOf.map(r=>r.view_id||r.visitor+"-"+r.day));
    const startedViews=uniq(sessionsOf.filter(r=>Number(r.data.starts)>0).map(r=>r.view_id));
    const times=sum(sessionsOf,"seconds"),signals={};
    const visitIds=new Set(visitsOf.map(r=>r.view_id).filter(Boolean));
    const viewsWith=(predicate)=>new Set(sessionsOf.filter(r=>predicate(r.data))
      .map(r=>r.view_id).filter(id=>visitIds.has(id)));
    const startedIds=viewsWith(d=>Number(d.starts)>0);
    const finishedIds=viewsWith(d=>Number(d.ends)>0);
    const finishedStarted=[...finishedIds].filter(id=>startedIds.has(id));
    // Funnel denominators always count unique page visits, never battle-count
    // / visit. Cat Bond's old starts mixed game entry and fighting, so only
    // visits explicitly tagged with v11 tracking can enter its new funnel.
    const v2Ids=new Set(visitsOf.filter(r=>r.game==="cat-bond"&&
      Number(r.data.trackingVersion)>=11&&r.view_id).map(r=>r.view_id));
    const v2Entered=new Set(sessionsOf.filter(r=>v2Ids.has(r.view_id)&&
      Number(r.data.signals?.bond_enter)>0).map(r=>r.view_id));
    const v2Finished=new Set(sessionsOf.filter(r=>v2Entered.has(r.view_id)&&
      Number(r.data.signals?.bond_battle_end_v2)>0).map(r=>r.view_id));
    const isBond=part.every(r=>r.game==="cat-bond"||!r.game)&&
      part.some(r=>r.game==="cat-bond");
    const pv=isBond?v2Ids.size:visitIds.size;
    const entered=isBond?v2Entered.size:startedIds.size;
    const finished=isBond?v2Finished.size:finishedStarted.length;
    const conversion={pageviews:pv,startedViews:entered,finishedViews:finished,
      visitStart:pct(entered,pv),startFinish:pct(finished,entered),
      visitFinish:pct(finished,pv),version:isBond?11:null};
    // All-version observed visit funnel: one qualifying event per page visit.
    // Legacy starts/finishes represent observed battle activity, not v11 entry.
    const historicalVisitFunnel=isBond?{
      pageviews:visitIds.size,startedViews:startedIds.size,
      finishedViews:finishedStarted.length,scope:"all-version-visit-activity"
    }:null;
    for(const r of sessionsOf)for(const [k,v] of Object.entries(r.data.signals||{})){
      if(/^[a-z0-9_-]{2,40}$/.test(k)&&Number.isFinite(Number(v))&&Number(v)>0)signals[k]=(signals[k]||0)+Math.min(10000,Number(v));
    }
    return {pageviews,visitors:visitors(visitsOf),sessions:uniq([...visitsOf,...sessionsOf].map(r=>r.view_id)),startedViews,startRate:pct(startedViews,pageviews),starts:sum(sessionsOf,"starts"),ends:sum(sessionsOf,"ends"),abandons:sum(sessionsOf,"abandons"),retries:sum(sessionsOf,"retries"),shares:sum(sessionsOf,"shares"),clicks:sum(sessionsOf,"clicks"),completion:sum(sessionsOf,"completion"),avgSeconds:sessionsOf.length?Math.round(times/Math.max(1,uniq(sessionsOf.map(r=>r.view_id)))):0,signals,conversion,historicalVisitFunnel};
  };
  const breakdown=(key)=>{let m=new Map();for(let r of visits){let v=tidy(r.data[key],100);if(!v)v=key==="referrer"&&r.data.source==="direct"?"direct_no_referrer":"unknown";m.set(v,(m.get(v)||0)+1)}return [...m].map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value).slice(0,16)};
  const byGame=[...new Set(rows.map(r=>r.game).filter(Boolean))].map(game=>{let g=rows.filter(r=>r.game===game);let z=score(g);const sources={direct:0,internal:0,external:0};for(let r of g.filter(r=>r.kind==="visit")){if(r.data.source in sources)sources[r.data.source]++}return {game,...z,sources}}).sort((a,b)=>b.pageviews-a.pageviews);
  const byDay=dates.map(day=>{let r=rows.filter(x=>localDay(Number(x.ts)||Date.parse(x.day+"T00:00:00Z"))===day),v=r.filter(x=>x.kind==="visit"),s=r.filter(x=>x.kind==="session");return {day,pageviews:uniq(v.map(r=>r.view_id||r.visitor+"-"+r.day)),visitors:visitors(v),starts:sum(s,"starts"),retries:sum(s,"retries"),shares:sum(s,"shares")}});
  // Acquisition view: one compact channel row across all visible games.
  // Only real game-page visits count towards start rate; homepage and internal hops
  // are excluded. Joining by view_id avoids double-counting incremental beacons.
  const eligible=new Set(["pawsibly-innocent","cat-bond","elsewhere","tiny-town","flip-dash","parcel-panic","pocket-aquarium"]);
  // itch.io embeds use both utm_source=itch and utm_source=itchio (Cat Bond).
  // Canonicalize at report time so previously stored visits are re-attributed
  // without fabricating any new player events or altering the original logs.
  const normalizeSource=s=>{
    const v=String(s||"").toLowerCase();
    if(/(^|\.)bsky\.(app|social)$/.test(v))return "bluesky";
    if(["itch","itch.io","itchio"].includes(v)||/(^|\.)itch\.(io|zone)$/.test(v))return "itch";
    return s;
  };
  const sessionsByView=new Map();
  for(const r of sessions){
    if(!r.view_id||!eligible.has(r.game))continue;
    if(!sessionsByView.has(r.view_id))sessionsByView.set(r.view_id,[]);
    sessionsByView.get(r.view_id).push(r);
  }
  const channels=new Map(),seenVisits=new Set();
  for(const r of visits){
    if(!eligible.has(r.game))continue;
    const id=r.view_id||r.visitor+"-"+r.day+"-"+r.game;
    if(seenVisits.has(id))continue;
    seenVisits.add(id);
    const d=r.data||{};
    const source=normalizeSource(tidy(d.utmSource,45)||(d.source==="external"&&d.referrer?tidy(d.referrer,60):d.source==="internal"?"internal":"direct"));
    // Internal navigation is not an acquisition channel; new visits inherit
    // their first-party landing source through telemetry.js.
    if(source==="internal")continue;
    if(!channels.has(source))channels.set(source,{source,views:0,startedViews:0,starts:0,ends:0,abandons:0,seconds:0});
    const z=channels.get(source);z.views++;
    const events=sessionsByView.get(r.view_id)||[];
    if(events.some(s=>Number(s.data.starts)>0))z.startedViews++;
    z.starts+=events.reduce((n,s)=>n+Math.max(0,Number(s.data.starts)||0),0);
    z.ends+=events.reduce((n,s)=>n+Math.max(0,Number(s.data.ends)||0),0);
    z.abandons+=events.reduce((n,s)=>n+Math.max(0,Number(s.data.abandons)||0),0);
    z.seconds+=events.reduce((n,s)=>n+Math.max(0,Number(s.data.seconds)||0),0);
  }
  const byChannel=[...channels.values()].map(z=>({
    source:z.source,pageviews:z.views,startedViews:z.startedViews,starts:z.starts,ends:z.ends,abandons:z.abandons,
    startRate:pct(z.startedViews,z.views),
    seconds:z.seconds,avgSeconds:z.views?Math.round(z.seconds/z.views):0
  })).sort((a,b)=>b.pageviews-a.pageviews);
  // Click-attribution is opt-in by telemetry version, so historical visits do
  // not distort this new conversion baseline (no invented 0-click sessions).
  const featuredIds=["pawsibly-innocent","tiny-town","cat-bond","elsewhere"];
  const homeSessions=new Map();
  for(const s of sessions.filter(s=>s.game==="hub"&&s.view_id)){
    if(!homeSessions.has(s.view_id))homeSessions.set(s.view_id,[]);
    homeSessions.get(s.view_id).push(s);
  }
  const homeBySource=new Map(),homeClickCounts=Object.fromEntries(featuredIds.map(id=>[id,0])),seenHomeViews=new Set();
  for(const v of visits.filter(v=>v.game==="hub"&&v.data.hubClickVersion===1)){
    const id=v.view_id||v.visitor+"-"+v.day;
    if(seenHomeViews.has(id))continue;seenHomeViews.add(id);
    const d=v.data||{};
    const source=normalizeSource(tidy(d.utmSource,45)||(d.source==="external"&&d.referrer?tidy(d.referrer,60):d.source==="internal"?"internal":"direct"));
    if(source==="internal")continue;
    if(!homeBySource.has(source))homeBySource.set(source,{source,visits:0,clickedViews:0,clicks:0});
    const z=homeBySource.get(source);z.visits++;
    const signals={};
    for(const s of homeSessions.get(v.view_id)||[]){
      for(const [key,value] of Object.entries(s.data.signals||{})){
        if(!key.startsWith("hub_card_")||!Number.isFinite(Number(value))||Number(value)<=0)continue;
        signals[key]=(signals[key]||0)+Math.min(100,Number(value));
      }
    }
    const clicks=Object.values(signals).reduce((n,x)=>n+x,0);
    if(clicks>0)z.clickedViews++;z.clicks+=clicks;
    for(const gameId of featuredIds)homeClickCounts[gameId]+=(signals["hub_card_"+gameId.replaceAll("-","_")]||0);
  }
  const homeSources=[...homeBySource.values()].map(z=>({...z,clickRate:pct(z.clickedViews,z.visits)})).sort((a,b)=>b.visits-a.visits);
  const homeViews=homeSources.reduce((n,z)=>n+z.visits,0),homeClickedViews=homeSources.reduce((n,z)=>n+z.clickedViews,0);
  const homeFunnel={visits:homeViews,clickedViews:homeClickedViews,clickRate:pct(homeClickedViews,homeViews),byGame:homeClickCounts,bySource:homeSources};
  // These events are first-party gameplay from itch.io-attributed game loads,
  // not itch.io's own Browser Plays or creator project-page views.
  const itchByGame=new Map(),itchSeen=new Set();
  for(const v of visits){
    if(!eligible.has(v.game))continue;
    const d=v.data||{},ref=String(d.referrer||"").toLowerCase(),utm=String(d.utmSource||"").toLowerCase();
    if(!["itch","itch.io","itchio"].includes(utm)&&!/(^|\.)itch\.(io|zone)$/.test(ref))continue;
    const id=v.game+":"+(v.view_id||v.visitor+"-"+v.day);
    if(itchSeen.has(id))continue;itchSeen.add(id);
    if(!itchByGame.has(v.game))itchByGame.set(v.game,{game:v.game,pageviews:0,startedViews:0,starts:0,ends:0,completions:0,seconds:0});
    const z=itchByGame.get(v.game),events=sessionsByView.get(v.view_id)||[];
    z.pageviews++;
    if(events.some(s=>Number(s.data.starts)>0))z.startedViews++;
    z.starts+=events.reduce((n,s)=>n+Math.max(0,Number(s.data.starts)||0),0);
    z.ends+=events.reduce((n,s)=>n+Math.max(0,Number(s.data.ends)||0),0);
    z.completions+=events.reduce((n,s)=>n+Math.max(0,Number(s.data.completion)||0),0);
    z.seconds+=events.reduce((n,s)=>n+Math.max(0,Number(s.data.seconds)||0),0);
  }
  const itchGames=[...itchByGame.values()].map(z=>({
    ...z,startRate:pct(z.startedViews,z.pageviews),avgSeconds:z.pageviews?Math.round(z.seconds/z.pageviews):0
  })).sort((a,b)=>b.pageviews-a.pageviews);
  const itch={source:"first-party-game-events",pageviews:itchGames.reduce((n,z)=>n+z.pageviews,0),
    starts:itchGames.reduce((n,z)=>n+z.starts,0),games:itchGames};
  const total=score(rows.filter(r=>r.game!=="hub"));
  const all=score(rows);
  return {days:x.days,from:x.from,updated:new Date().toISOString(),lastEventAt:rows.length&&rows.some(z=>Number(z.ts)>0)?new Date(Math.max(...rows.map(z=>Number(z.ts)||0))).toISOString():null,partial:x.partial,records:rows.length,itch,rollup:{...all,gameStarts:total.starts,gameAvgSeconds:total.avgSeconds,completions:total.completion,unknownPastVisits:0},byGame,byDay,byChannel,homeFunnel,sources:breakdown("source"),referrers:breakdown("referrer"),devices:breakdown("_device"),countries:breakdown("_country"),sites:breakdown("site")};
}
function elsewhereStats(x){
 // Track only the current eight-world dream-life edition, keeping older story editions separate.
 const rows=x.rows.filter(r=>r.data.edition==="life-v5"&&Number(r.data.scenes)===5),runsById=new Map(),worlds=["amalfi","paris","tokyo","moon","monday","iceland","maldives","swiss"];
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
 return {updated:new Date().toISOString(),days:x.days,from:x.from,records:rows.length,partial:x.partial,trackingVersion:10,summary:{runs:opened.length,completed:finished,fullRate:pct(finished,opened.length),replayVisitors,replayRate:pct(replayVisitors,visitorGroups.size),dropoffChapter:dropoff?.from||null,dropoffRate:dropoff?.rate??null,dropoffLost:dropoff?dropoff.eligible-dropoff.continued:0},funnel:Array.from({length:5},(_,i)=>[{step:(i+1)+"-view",value:has(i+1,"views")},{step:(i+1)+"-complete",value:has(i+1,"completed")}]).flat(),continueRates,worlds:worldSummary};
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
async function socialPulseFor(env, base) {
 const entries = await Promise.all([
   nativeYouTubeSnapshot(env,base).then(result=>["youtube","nativeYouTube",result]),
   nativeInstagramSnapshot(env,base).then(result=>["instagram","nativeInstagram",result]),
   nativeTikTokSnapshot(env,base).then(result=>["tiktok","nativeTikTok",result]),
   nativeBlueskySnapshot(env,base).then(result=>["bluesky","nativeBluesky",result])
 ]);
 const result=structuredClone(base??{});
 for(const [id,key,patch] of entries){
   result[key]=patch[key];
   if(result.platforms)result.platforms=result.platforms.map(row=>row.id===id?patch.platforms.find(x=>x.id===id):row);
 }
 if(result.metricScope){
   result.metricScope.verifiedPosts=entries.flatMap(([id,,patch])=>patch.metricScope.verifiedPosts.filter(post=>post.platform===id));
   result.metricScope.activeApprovedPosts=result.metricScope.verifiedPosts.length;
 }
 return result;
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
 if(p==="/api/social/refresh"){
  if(req.method!=="POST")return json({error:"POST required"},405);
  if(!await authorizedSocialSchedule(req))return json({error:"Not authorized"},401);
  const result=await socialPulseFor(env,null);
  return json({youtube:result.nativeYouTube,instagram:result.nativeInstagram,tiktok:result.nativeTikTok,bluesky:result.nativeBluesky});
 }
 if(p.startsWith("/api/tiktok/"))return nativeTikTokRoute(req,env,
   async()=>!!env.ARCADE_ANALYTICS_KEY&&(req.headers.get("x-analytics-key")===env.ARCADE_ANALYTICS_KEY||await hasSession(req,env)),json);
 if(p.startsWith("/api/instagram/"))return nativeInstagramRoute(req,env,
   async()=>!!env.ARCADE_ANALYTICS_KEY&&(req.headers.get("x-analytics-key")===env.ARCADE_ANALYTICS_KEY||await hasSession(req,env)),json);
 if(p.startsWith("/api/youtube/"))return nativeYouTubeRoute(req,env,
   async()=>!!env.ARCADE_ANALYTICS_KEY&&(req.headers.get("x-analytics-key")===env.ARCADE_ANALYTICS_KEY||await hasSession(req,env)),json);
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
  // Real gameplay and isolated deployment probes share the same D1 INSERT.
  // Probe rows live outside the arcade and story reporting categories.
  const qaGames=new Set(["pawsibly-innocent","tiny-town","elsewhere","flip-dash","parcel-panic","pocket-aquarium","cat-bond"]);
  const smoke=category==="arcade"&&(data.kind==="visit"||data.kind==="session")&&data.smokeProbe==="mw-qa-v1"&&/^mw-qa-[0-9a-f-]{36}$/.test(viewId)&&qaGames.has(game);
  const storageCategory=smoke?"diagnostic":category;
  await env.DB.prepare("INSERT INTO events(category,day,ts,game,visitor,view_id,run_id,event_name,kind,payload) VALUES(?,?,?,?,?,?,?,?,?,?)").bind(storageCategory,day,now,game,visitor,viewId,runId,tidy(data.event,48),tidy(data.kind,48),JSON.stringify(data)).run();
  return json({ok:true},202);
 }
 // Only isolated diagnostic tokens may be queried; this endpoint never
 // exposes real user events. Delete the matching probe immediately on read.
 if(p==="/api/diagnostic-check"){
  if(req.method!=="GET")return json({error:"GET required"},405);
  const probe=new URL(req.url).searchParams.get("probe")||"";
  if(!/^mw-qa-[0-9a-f-]{36}$/.test(probe))return json({error:"Invalid diagnostic probe"},400);
  const query=await env.DB.prepare("SELECT kind,payload FROM events WHERE category=? AND view_id=? ORDER BY id ASC LIMIT 4").bind("diagnostic",probe).all();
  const results=query.results||[],visits=results.filter(r=>r.kind==="visit"),sessions=results.filter(r=>r.kind==="session");
  const sawStart=sessions.some(r=>Number(JSON.parse(r.payload||"{}").starts)>=1);
  const sawEnd=sessions.some(r=>Number(JSON.parse(r.payload||"{}").ends)>=1);
  if(results.length)await env.DB.prepare("DELETE FROM events WHERE category=? AND view_id=?").bind("diagnostic",probe).run();
  return json({recorded:visits.length>0,sessionRecorded:sessions.length>0,startRecorded:sawStart,endRecorded:sawEnd,removed:results.length>0});
 }
 if(p==="/api/reset-metrics"){
  if(req.method!=="POST")return json({error:"POST required"},405);
  if(!env.ARCADE_ANALYTICS_KEY)return json({error:"Dashboard key not configured"},503);
  // Require a first-party browser request, not just an authenticated cross-site form.
  const caller=req.headers.get("Origin")||req.headers.get("Referer");
  let callerOrigin;try{callerOrigin=new URL(caller).origin}catch{return json({error:"Origin required"},403)}
  if(!new Set([new URL(req.url).origin,"https://morrowwish.vercel.app"]).has(callerOrigin))return json({error:"Origin not allowed"},403);
  if((req.headers.get("Content-Type")||"").split(";")[0].trim().toLowerCase()!=="application/json")return json({error:"JSON required"},415);
  if(req.headers.get("X-Morrowwish-Reset")!=="confirmed")return json({error:"Confirmation header required"},400);
  if(req.headers.get("x-analytics-key")!==env.ARCADE_ANALYTICS_KEY && !(await hasSession(req,env)))return json({error:"Access denied"},401);
  let data;try{data=await req.json()}catch{return json({error:"Invalid JSON"},400)}
  if(data?.confirm!=="RESET_METRICS")return json({error:"Confirmation required"},400);
  // Clear only anonymous dashboard events. Never destroy the D1 table, schema,
  // player saves, campaign schedules or static provider status snapshots.
  const result=await env.DB.prepare("DELETE FROM events WHERE category IN ('arcade','elsewhere','diagnostic')").run();
  return json({ok:true,removed:result.meta?.changes??null});
 }
  // Keep an authenticated verification endpoint, but use the same complete
  // Pacific-time event read as the dashboard instead of a separate UTC aggregate.
  if(p==="/api/cat-bond-traffic-audit"){
    if(req.method!=="GET")return json({error:"GET required"},405);
    if(!env.ARCADE_ANALYTICS_KEY)return json({error:"Dashboard key not configured"},503);
    if(req.headers.get("x-analytics-key")!==env.ARCADE_ANALYTICS_KEY && !(await hasSession(req,env)))return json({error:"Access denied"},401);
    const x=await read(req,env,"arcade"),stats=mainStats(x);
    const row=stats.byGame.find(g=>g.game==="cat-bond"),f=row?.historicalVisitFunnel||{};
    const h=await env.DB.prepare("SELECT MIN(day) AS firstDay,MAX(day) AS lastDay,COUNT(*) AS rawVisits,COUNT(DISTINCT COALESCE(NULLIF(view_id,''),'legacy:'||COALESCE(visitor,'')||':'||day)) AS pageviews FROM events WHERE category='arcade' AND game='cat-bond' AND kind='visit'").all();
    const history=(h.results||[])[0]||{};
    return json({game:"cat-bond",from:x.from,source:"full-d1-event-read",
      total:Number(f.pageviews)||0,
      totals:{pageviews:Number(f.pageviews)||0,startedViews:Number(f.startedViews)||0,finishedViews:Number(f.finishedViews)||0},
      history:{firstDay:history.firstDay||null,lastDay:history.lastDay||null,
        pageviews:Number(history.pageviews)||0,rawVisits:Number(history.rawVisits)||0}});
  }
if(p==="/api/summary"||p==="/api/elsewhere-summary"){
  if(req.method!=="GET")return json({error:"GET required"},405);
  if(!env.ARCADE_ANALYTICS_KEY)return json({error:"Dashboard key not configured"},503);
  if(req.headers.get("x-analytics-key")!==env.ARCADE_ANALYTICS_KEY && !(await hasSession(req,env)))return json({error:"Access denied"},401);
  const x=await read(req,env,p==="/api/summary"?"arcade":"elsewhere");
  return json(p==="/api/summary"?{...mainStats(x),socialPulse:await socialPulseFor(env,typeof SOCIAL_CAMPAIGN==="undefined"?null:SOCIAL_CAMPAIGN)}:elsewhereStats(x));
 }
 return json({error:"Not found"},404);
}
