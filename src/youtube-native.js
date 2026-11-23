import {socialCount, socialStore, socialRefresh, socialOverlay, socialRefreshResponse} from "./social-native.js";
// YouTube Data API v3: approved Morrow Wish Shorts only.
// Public per-video statistics, fetched server-side with an owner-managed API key.
const YT_API="https://www.googleapis.com/youtube/v3/videos";
const YT_CHANNEL="UC9v31QGhSfBASDsbXMjch4Q";
const YT_TTL=15*60*1000;
const YT_APPROVED={
 "cat-bond":"JoDtL_gIk4M",
 "pawsibly-innocent":"-Xkue1ZSG8Y",
 "tiny-town":"z_TnR8X7hjk",
 "elsewhere":"6_Q1t7AmdnM",
 "flip-dash":"w8K468QRebU",
 "parcel-panic":"iytuR8G7UjQ",
 "pocket-aquarium":"vMeqdhGaPf4"
};
const ytIdOf=p=>/\/(?:shorts\/|watch\?v=)([\w-]{11})/.exec(p?.url||"")?.[1]||null;
const YT_CACHE="youtube:approved:20261122:v14-full-relaunch-28";
async function ytFetch(env){
 const q=new URL(YT_API);
 q.searchParams.set("part","snippet,statistics,status");
 q.searchParams.set("id",Object.values(YT_APPROVED).join(","));
 const r=await fetch(q.toString(),{headers:{"X-Goog-Api-Key":env.YOUTUBE_DATA_API_KEY},signal:AbortSignal.timeout(12000)});
 if(!r.ok)throw Error("YouTube Data API HTTP "+r.status);
 const obj=await r.json();
 if(!Array.isArray(obj.items))throw Error("YouTube response missing items");
 const lookup=new Map(Object.entries(YT_APPROVED).map(([game,id])=>[id,game]));
 const posts=[];
 for(const video of obj.items){
   const game=lookup.get(video.id);
   if(!game||video.snippet?.channelId!==YT_CHANNEL)continue;
   if(video.status?.privacyStatus!=="public")continue;
   posts.push({platform:"youtube",game,url:"https://www.youtube.com/shorts/"+video.id,
     publishedAt:"2026-11-22",views:socialCount(video.statistics?.viewCount),
     likes:socialCount(video.statistics?.likeCount),comments:socialCount(video.statistics?.commentCount),
     approved:true,publicVerified:true,dataSource:"youtube-data-api-v3"});
 }
 return posts;
}
export function ytOverlay(base,state,status){
 return socialOverlay(base,state,status,{
   id:"youtube",name:"nativeYouTube", source:"youtube-data-api-v3",
   metrics:["views","likes","comments"],isApproved:p=>YT_APPROVED[p.game]===ytIdOf(p)
 });
}
export async function nativeYouTubeSnapshot(env,base,force=false){
 if(!env.YOUTUBE_DATA_API_KEY)return ytOverlay(base,null,"needs_api_key");
 try{
   await socialStore(env);
   const {state,status}=await socialRefresh(env,YT_CACHE,YT_TTL,ytFetch,force);
   return ytOverlay(base,state,status);
 }catch{return ytOverlay(base,null,"storage_error");}
}
export async function nativeYouTubeRoute(req,env,hasAdminSession,json){
 const path=new URL(req.url).pathname;
 if(!["/api/youtube/status","/api/youtube/refresh"].includes(path))return null;
 if(req.method!==(path.endsWith("/refresh")?"POST":"GET"))return json({error:"Unsupported method"},405);
 if(!await hasAdminSession())return json({error:"Not authorized"},401);
 if(!env.YOUTUBE_DATA_API_KEY)return json({status:"needs_api_key",required:["YOUTUBE_DATA_API_KEY"]},503);
 const data=await nativeYouTubeSnapshot(env,null,path.endsWith("/refresh"));
 return path.endsWith("/refresh")?socialRefreshResponse(json,data.nativeYouTube):json(data.nativeYouTube);
}
