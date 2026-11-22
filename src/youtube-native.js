// YouTube Data API v3: approved Morrow Wish Shorts only.
// Public per-video statistics, fetched server-side with an owner-managed API key.
const YT_API="https://www.googleapis.com/youtube/v3/videos";
const YT_CHANNEL="UC9v31QGhSfBASDsbXMjch4Q";
const YT_TTL=15*60*1000;
const YT_APPROVED={
 "cat-bond":"ELv02K9K294",
 "pawsibly-innocent":"JUQ8PsYCFG8",
 "tiny-town":"64Uh0S9dqmQ",
 "elsewhere":"n8bbePy8Unw",
 "flip-dash":"cC7akb-kUIo",
 "parcel-panic":"c1qeZ3tvuLU",
 "pocket-aquarium":"O3tMbulVPvk"
};
const ytIdOf=p=>/\/(?:shorts\/|watch\?v=)([\w-]{11})/.exec(p?.url||"")?.[1]||null;
const ytNum=v=>v!=null&&/^\d+$/.test(String(v))&&Number.isSafeInteger(Number(v))?Number(v):null;
async function ytStorage(env){
 await env.DB.prepare("CREATE TABLE IF NOT EXISTS social_native_store (key TEXT PRIMARY KEY, payload TEXT NOT NULL, updated_at INTEGER NOT NULL)").run();
}
async function ytRead(env){
 const r=await env.DB.prepare("SELECT payload,updated_at FROM social_native_store WHERE key=?").bind("youtube:approved:20261122").first();
 return r?{data:JSON.parse(r.payload),updatedAt:r.updated_at}:null;
}
async function ytFetch(env){
 const q=new URL(YT_API);
 q.searchParams.set("part","snippet,statistics,status");
 q.searchParams.set("id",Object.values(YT_APPROVED).join(","));
 q.searchParams.set("key",env.YOUTUBE_DATA_API_KEY);
 // Key is never placed into response or logs.
 const r=await fetch(q.toString(),{signal:AbortSignal.timeout(12000)});
 if(!r.ok)throw Error("YouTube Data API HTTP "+r.status);
 const obj=await r.json();
 if(!Array.isArray(obj.items))throw Error("YouTube response missing items");
 const lookup=new Map(Object.entries(YT_APPROVED).map(([game,id])=>[id,game]));
 const posts=[];
 for(const video of obj.items){
   const game=lookup.get(video.id);
   if(!game||video.snippet?.channelId!==YT_CHANNEL)continue;
   if(video.status?.privacyStatus && video.status.privacyStatus!=="public")continue;
   posts.push({platform:"youtube",game,url:"https://www.youtube.com/shorts/"+video.id,
     publishedAt:"2026-11-22",views:ytNum(video.statistics?.viewCount),
     likes:ytNum(video.statistics?.likeCount),comments:ytNum(video.statistics?.commentCount),
     approved:true,publicVerified:true,dataSource:"youtube-data-api-v3"});
 }
 const state={posts,checkedAt:new Date().toISOString(),source:"youtube-data-api-v3",returned:obj.items.length};
 await env.DB.prepare("INSERT INTO social_native_store(key,payload,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at")
   .bind("youtube:approved:20261122",JSON.stringify(state),Date.now()).run();
 return state;
}
export function ytOverlay(base,state,status){
 const result=structuredClone(base||{});
 const row=result.platforms?.find(p=>p.id==="youtube");
 const posts=(state?.posts||[]).filter(p=>YT_APPROVED[p.game]===ytIdOf(p));
 result.nativeYouTube={status,source:"youtube-data-api-v3",checkedAt:state?.checkedAt||null,postMetricsCount:posts.length,expectedPosts:7};
 if(!row||!state)return result;
 const prior=result.metricScope?.verifiedPosts||[];
 const byGame=new Map(posts.map(p=>[p.game,p]));
 result.metricScope.verifiedPosts=prior.map(p=>p.platform==="youtube"
   ?(byGame.get(p.game)||{...p,views:null,likes:null,comments:null,dataSource:"youtube-native-unavailable"}):p);
 result.metricScope.activeApprovedPosts=result.metricScope.verifiedPosts.length;
 // A missing video, permission mismatch or missing count must remain unknown.
 row.views=posts.length===7&&posts.every(p=>p.views!=null)?posts.reduce((n,p)=>n+p.views,0):null;
 row.likes=posts.length===7&&posts.every(p=>p.likes!=null)?posts.reduce((n,p)=>n+p.likes,0):null;
 row.phase=row.views==null?"partial-native-metrics":"native-api-connected";
 row.metricScope="approved-video-ids-youtube-data-api-v3";
 row.note="YouTube official video-level statistics; last checked "+state.checkedAt+". Missing values are blank.";
 return result;
}
export async function nativeYouTubeSnapshot(env,base){
 if(!env.YOUTUBE_DATA_API_KEY)return ytOverlay(base,null,"needs_api_key");
 try{
   await ytStorage(env);
   let cached=await ytRead(env),status="ready";
   if(!cached||Date.now()-cached.updatedAt>YT_TTL){
     try{await ytFetch(env);cached=await ytRead(env);}
     catch(e){status="sync_error";console.error("YouTube metrics sync failed:",String(e?.message||e).slice(0,80));}
   }
   return ytOverlay(base,cached?.data||null,status);
 }catch(e){console.error("YouTube cache error:",String(e?.message||e).slice(0,80));return ytOverlay(base,null,"storage_error");}
}
