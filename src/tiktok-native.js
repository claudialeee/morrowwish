import {socialCount, socialStore, socialRead, socialWrite, socialRefresh, socialOverlay, SocialSyncError, socialOAuthStart, socialOAuthCode, socialOAuthResult, socialRefreshResponse} from "./social-native.js";
// TikTok Display API v2 — private, owner-authorized native analytics.
// Credentials live in Cloudflare Worker secrets; OAuth tokens are AES-GCM
// encrypted in D1, never in public assets, GitHub commits, logs, or responses.
const TK_REDIRECT="https://morrowwish.vercel.app/api/tiktok/callback";
const TK_API="https://open.tiktokapis.com";
const TK_MAX_AGE_MS=15*60*1000;
const TK_FIELDS="id,view_count,like_count,comment_count,share_count";
const TK_CUTOFF="2026-11-22";
// Only the owner's seven explicitly approved launch promos belong in this
// dashboard. A similarly titled older/future post is never auto-imported.
const TK_APPROVED={
  "cat-bond":"7711071401913896206",
  "pawsibly-innocent":"7711071409966943502",
  "tiny-town":"7711071395941240095",
  "elsewhere":"7711071458256112909",
  "flip-dash":"7711071406368312589",
  "parcel-panic":"7711071416099032333",
  "pocket-aquarium":"7711071765379829005"
};
const tkApprovedPost=p=>p&&TK_APPROVED[p.game]===/\/video\/(\d{15,22})/.exec(p.url||"")?.[1]&&p.publishedAt>=TK_CUTOFF;
const TK_ENCODER=new TextEncoder();

async function tkKey(env){
  const pass=env.TIKTOK_TOKEN_KEY||env.ARCADE_ANALYTICS_KEY;
  if(!pass)throw Error("TikTok encryption key not configured");
  const hash=await crypto.subtle.digest("SHA-256",TK_ENCODER.encode("morrowwish/tiktok/v1:"+pass));
  return crypto.subtle.importKey("raw",hash,{name:"AES-GCM"},false,["encrypt","decrypt"]);
}
function tkB64(bytes){let chars="";for(let i=0;i<bytes.length;i++)chars+=String.fromCharCode(bytes[i]);return btoa(chars).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");}
function tkUnb64(value){const str=atob(value.replace(/-/g,"+").replace(/_/g,"/"));return Uint8Array.from(str,c=>c.charCodeAt(0));}
async function tkEncrypt(env,token){
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const encrypted=new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv},await tkKey(env),TK_ENCODER.encode(JSON.stringify(token))));
  const data=new Uint8Array(iv.length+encrypted.length);data.set(iv);data.set(encrypted,iv.length);
  return tkB64(data);
}
async function tkDecrypt(env,cipher){
  const bytes=tkUnb64(cipher);
  if(bytes.length<29)throw Error("Invalid encrypted TikTok token");
  const clear=await crypto.subtle.decrypt({name:"AES-GCM",iv:bytes.slice(0,12)},await tkKey(env),bytes.slice(12));
  return JSON.parse(new TextDecoder().decode(clear));
}
async function tkApi(path,token,body){
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),12000);
  try{
    const res=await fetch(TK_API+path,{
      method:body?"POST":"GET",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},
      ...(body?{body:JSON.stringify(body)}:{}),signal:ctrl.signal
    });
    const data=await res.json();
    if(!res.ok||data?.error?.code&&data.error.code!=="ok")
      throw new SocialSyncError(res.status===401||data?.error?.code==="access_token_invalid"?"needs_owner_authorization":res.status===403||data?.error?.code==="scope_not_authorized"?"needs_permission":"sync_error");
    return data?.data||{};
  }finally{clearTimeout(timer);}
}
async function tkTokenExchange(env,values){
  const body=new URLSearchParams({client_key:env.TIKTOK_CLIENT_KEY,client_secret:env.TIKTOK_CLIENT_SECRET,...values});
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),12000);
  try{
    const response=await fetch(TK_API+"/v2/oauth/token/",{
      method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},
      body:body.toString(),signal:ctrl.signal
    });
    const data=await response.json();
    if(!response.ok||!data.access_token||!data.refresh_token)
      throw new SocialSyncError(["invalid_grant","refresh_token_invalid"].includes(data.error)?"needs_owner_authorization":"sync_error");
    if(data.scope&&!String(data.scope).split(",").includes("video.list"))throw new SocialSyncError("needs_permission");
    return {access_token:data.access_token,refresh_token:data.refresh_token,
      expires_at:Date.now()+Math.max(0,Number(data.expires_in)||0)*1000,
      refresh_expires_at:Date.now()+Math.max(0,Number(data.refresh_expires_in)||0)*1000,
      open_id:data.open_id||null,scope:data.scope||""};
  }finally{clearTimeout(timer);}
}
async function tkAuthorizedToken(env){
  const saved=await socialRead(env,"tiktok:token");
  if(!saved)return null;
  let token=await tkDecrypt(env,saved.data.cipher);
  if(token.expires_at>Date.now()+5*60*1000)return token.access_token;
  if(token.refresh_expires_at&&token.refresh_expires_at<Date.now())throw new SocialSyncError("needs_owner_authorization");
  const next=await tkTokenExchange(env,{grant_type:"refresh_token",refresh_token:token.refresh_token});
  await socialWrite(env,"tiktok:token",{cipher:await tkEncrypt(env,next)});
  return next.access_token;
}
const TK_CACHE="tiktok:approved:20261122:v2";
const TK_GAME_BY_ID=new Map(Object.entries(TK_APPROVED).map(([game,id])=>[id,game]));
export function tkPost(video){
  const game=TK_GAME_BY_ID.get(video?.id);
  if(!game)return null;
  return {platform:"tiktok", game, url:"https://www.tiktok.com/@morrowwishgames/video/"+video.id,
    publishedAt:TK_CUTOFF, views:socialCount(video.view_count), likes:socialCount(video.like_count),
    comments:socialCount(video.comment_count), shares:socialCount(video.share_count)};
}
async function tkVideos(token){
  const data=await tkApi("/v2/video/query/?fields="+TK_FIELDS,token,{filters:{video_ids:Object.values(TK_APPROVED)}});
  if(!Array.isArray(data.videos))throw Error("TikTok did not return a video list");
  return data.videos.map(tkPost).filter(Boolean);
}
async function tkFetch(env){
  const token=await tkAuthorizedToken(env);
  if(!token)throw new SocialSyncError("needs_owner_authorization");
  return tkVideos(token);
}
export function tkOverlay(base,state,status){
  return socialOverlay(base,state,status,{
    id:"tiktok",name:"nativeTikTok",source:"tiktok-display-api-v2",
    metrics:["views","likes","comments","shares"],isApproved:tkApprovedPost
  });
}
export async function nativeTikTokSnapshot(env,base,force=false){
  if(!env.TIKTOK_CLIENT_KEY||!env.TIKTOK_CLIENT_SECRET)return tkOverlay(base,null,"needs_developer_app");
  try{
    await socialStore(env);
    if(!await socialRead(env,"tiktok:token"))return tkOverlay(base,null,"needs_owner_authorization");
    const {state,status}=await socialRefresh(env,TK_CACHE,TK_MAX_AGE_MS,tkFetch,force);
    return tkOverlay(base,state,status);
  }catch{return tkOverlay(base,null,"storage_error");}
}
export async function nativeTikTokRoute(req,env,hasAdminSession,json){
  const path=new URL(req.url).pathname;
  if(!["/api/tiktok/status","/api/tiktok/connect","/api/tiktok/callback","/api/tiktok/refresh"].includes(path))return null;
  const refresh=path.endsWith("/refresh");
  if(req.method!==(refresh?"POST":"GET"))return json({error:"Unsupported method"},405);
  if(path.endsWith("/callback")){
    try{
      if(!env.TIKTOK_CLIENT_KEY||!env.TIKTOK_CLIENT_SECRET)throw Error("Developer app not configured");
      const code=await socialOAuthCode(req,env,"tiktok");
      const token=await tkTokenExchange(env,{grant_type:"authorization_code",code,redirect_uri:TK_REDIRECT});
      // The query only returns videos owned by the account that consented.
      if(!(await tkVideos(token.access_token)).length)throw Error("The authorized account owns no approved videos");
      await socialStore(env);
      await socialWrite(env,"tiktok:token",{cipher:await tkEncrypt(env,token)});
      await nativeTikTokSnapshot(env,null,true);
      return socialOAuthResult("tiktok",true);
    }catch{return socialOAuthResult("tiktok",false);}
  }
  if(!await hasAdminSession())return json({error:"Not authorized"},401);
  if(!env.TIKTOK_CLIENT_KEY||!env.TIKTOK_CLIENT_SECRET)
    return json({status:"needs_developer_app",required:["TIKTOK_CLIENT_KEY","TIKTOK_CLIENT_SECRET"],redirectUri:TK_REDIRECT},503);
  if(path.endsWith("/connect")){
    const url=new URL("https://www.tiktok.com/v2/auth/authorize/");
    url.searchParams.set("client_key",env.TIKTOK_CLIENT_KEY);
    url.searchParams.set("response_type","code");
    url.searchParams.set("scope","user.info.basic,video.list");
    url.searchParams.set("redirect_uri",TK_REDIRECT);
    return socialOAuthStart(env,"tiktok",url);
  }
  const data=await nativeTikTokSnapshot(env,null,refresh);
  return refresh?socialRefreshResponse(json,data.nativeTikTok):json(data.nativeTikTok);
}
