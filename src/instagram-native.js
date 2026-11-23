import {socialCount, socialStore, socialRead, socialWrite, socialRefresh, socialOverlay, SocialSyncError, socialOAuthStart, socialOAuthCode, socialOAuthResult, socialRefreshResponse} from "./social-native.js";
// Instagram API with Unified Login: approved reels, business OAuth, Insights.
// No vidIQ, Metricool, scraping, publishing privileges or public credentials.
const IG_API="https://graph.facebook.com/v27.0";
const IG_OAUTH="https://www.facebook.com/dialog/oauth";
const IG_TOKEN="https://graph.facebook.com/v27.0/oauth/access_token";
const IG_CONFIG="2480710455789845";
const IG_REDIRECT="https://morrowwish.vercel.app/api/instagram/callback";
const IG_TTL=15*60*1000;
const IG_APPROVED={
 "cat-bond":"DgEGgecOxst",
 "pawsibly-innocent":"DgDfM-DBb1K",
 "tiny-town":"DgDfO6ztxnM",
 "elsewhere":"DgDfQqkT6Gx",
 "flip-dash":"DgDfUwbB4EP",
 "parcel-panic":"DgDfRCJAF83",
 "pocket-aquarium":"DgDfRT3O7EK"
};
const igCode=p=>/instagram\\.com\\/(?:reel|p)\\/([A-Za-z0-9_-]+)/.exec(p||"")?.[1]||null;
// Match the exact seven approved video shortcodes, not the UTC date of posting.
// Meta timestamps are UTC: an upload at 4:30pm Pacific on Nov 22 is Nov 23 UTC,
// and must not be silently dropped from the launch-campaign dashboard.
export function igApprovedReel(p){
 if(p?.media_type!=="VIDEO"||p.media_product_type!=="REELS")return null;
 const shortcode=igCode(p.permalink);
 return Object.keys(IG_APPROVED).find(game=>IG_APPROVED[game]===shortcode)||null;
}
async function igKey(env){
 const pass=env.INSTAGRAM_TOKEN_KEY||env.ARCADE_ANALYTICS_KEY;
 if(!pass)throw Error("Instagram encryption key is not configured");
 const hash=await crypto.subtle.digest("SHA-256",new TextEncoder().encode("morrowwish/instagram/v1:"+pass));
 return crypto.subtle.importKey("raw",hash,{name:"AES-GCM"},false,["encrypt","decrypt"]);
}
async function igEncrypt(env,value){
 const iv=crypto.getRandomValues(new Uint8Array(12));
 const plain=new TextEncoder().encode(JSON.stringify(value));
 const ct=new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv},await igKey(env),plain));
 const combined=new Uint8Array(iv.length+ct.length);combined.set(iv);combined.set(ct,iv.length);
 return btoa(Array.from(combined,b=>String.fromCharCode(b)).join(""));
}
async function igDecrypt(env,value){
 const bytes=Uint8Array.from(atob(value),x=>x.charCodeAt(0));
 if(bytes.length<29)throw Error("Invalid Instagram token ciphertext");
 const raw=await crypto.subtle.decrypt({name:"AES-GCM",iv:bytes.slice(0,12)},await igKey(env),bytes.slice(12));
 return JSON.parse(new TextDecoder().decode(raw));
}
async function igRequest(path,token,params={}){
 const u=new URL(IG_API+path);
 for(const [k,v] of Object.entries(params))u.searchParams.set(k,String(v));
 const r=await fetch(u.toString(),{headers:{Authorization:"Bearer "+token,Accept:"application/json"},signal:AbortSignal.timeout(12000)});
 const obj=await r.json();
 if(!r.ok||obj.error){
   const code=obj.error?.code;
   throw new SocialSyncError(r.status===401||code===190?"needs_owner_authorization":r.status===403||code===10||code===200?"needs_permission":"sync_error");
 }
 return obj;
}
async function igVerifiedAccount(token){
 const [me,accounts]=await Promise.all([
   igRequest("/me",token,{fields:"client_business_id"}),
   igRequest("/me/assigned_instagram_accounts",token,{fields:"id,username",limit:100})
 ]);
 const account=accounts.data?.find(item=>String(item.username||"").toLowerCase()==="morrowwishgames");
 if(!account||!/^[0-9]+$/.test(account.id||"")||!/^[0-9]+$/.test(me.client_business_id||""))
   throw new SocialSyncError("wrong_account");
 return {accountId:account.id,username:account.username,businessId:me.client_business_id};
}
async function igGrant(env,code){
 const u=new URL(IG_TOKEN);
 for(const [key,value] of Object.entries({client_id:env.INSTAGRAM_APP_ID,
   client_secret:env.INSTAGRAM_APP_SECRET,code:code.replace(/#_$/,""),redirect_uri:IG_REDIRECT}))
   u.searchParams.set(key,value);
 const r=await fetch(u.toString(),{signal:AbortSignal.timeout(12000),headers:{Accept:"application/json"}});
 const grant=await r.json();
 if(!r.ok||grant.error||!grant.access_token)
   throw new SocialSyncError(grant.error?.code===190?"needs_owner_authorization":"oauth_exchange_failed");
 const details=await igVerifiedAccount(grant.access_token);
 // This configuration issues a system-user token with no expiry. If Meta returns
 // an expiry in a future configuration, surface reconnect before it expires.
 return {accessToken:grant.access_token,expiresAt:grant.expires_in?Date.now()+Number(grant.expires_in)*1000:null,...details};
}
async function igAuthorizedToken(env){
 const row=await socialRead(env,"instagram:token");
 if(!row)return null;
 const token=await igDecrypt(env,row.data.cipher);
 if(token.expiresAt&&token.expiresAt<=Date.now())throw new SocialSyncError("needs_owner_authorization");
 return token;
}
const IG_CACHE="instagram:approved:20261122:v13";
async function igFetch(env){
 const auth=await igAuthorizedToken(env);
 if(!auth)throw new SocialSyncError("needs_owner_authorization");
 const {accessToken:token,accountId:userId}=auth;
 if(!userId)throw new SocialSyncError("needs_owner_authorization");
 let after=null,matched=new Map();
 for(let page=0;page<4;page++){
   const q={fields:"id,permalink,media_type,media_product_type,timestamp,like_count,comments_count",limit:100};
   if(after)q.after=after;
   const response=await igRequest("/"+userId+"/media",token,q);
   if(!Array.isArray(response.data))throw Error("Instagram media listing missing");
   for(const p of response.data){
     const game=igApprovedReel(p);
     if(!game||matched.has(game))continue;
     matched.set(game,{platform:"instagram",game,url:"https://www.instagram.com/reel/"+IG_APPROVED[game]+"/",
       publishedAt:"2026-11-22",views:null,likes:socialCount(p.like_count),comments:socialCount(p.comments_count),
       approved:true,publicVerified:true,dataSource:"instagram-graph-insights",mediaId:p.id});
   }
   if(matched.size===7||!response.paging?.cursors?.after||!response.paging?.next||response.paging.cursors.after===after)break;
   after=response.paging.cursors.after;
 }
 const insightResults=await Promise.allSettled([...matched.values()].map(async ({mediaId,...post})=>{
   const insights=await igRequest("/"+encodeURIComponent(mediaId)+"/insights",token,{metric:"views,shares"});
   if(!Array.isArray(insights.data))throw new SocialSyncError("sync_error");
   const value=key=>{
     const metric=insights.data.find(item=>item.name===key);
     return socialCount(metric?.total_value?.value??metric?.values?.[0]?.value);
   };
   return {...post,views:value("views"),shares:value("shares")};
 }));
 if(insightResults.length&&insightResults.every(item=>item.status==="rejected")){
   const failure=insightResults.find(item=>item.reason?.status==="needs_owner_authorization"||item.reason?.status==="needs_permission");
   throw (failure??insightResults[0]).reason;
 }
 return [...matched.values()].map(({mediaId,...post},index)=>{
   const item=insightResults[index];
   return item.status==="fulfilled"?item.value:post;
 });
}
export function igOverlay(base,state,status){
 return socialOverlay(base,state,status,{
   id:"instagram",name:"nativeInstagram",source:"instagram-graph-insights",
   metrics:["views","likes","comments","shares"],isApproved:p=>IG_APPROVED[p.game]===igCode(p.url)
 });
}
export async function nativeInstagramSnapshot(env,base,force=false){
 if(!env.INSTAGRAM_APP_ID||!env.INSTAGRAM_APP_SECRET||!(env.INSTAGRAM_CONFIG_ID||IG_CONFIG))return igOverlay(base,null,"needs_developer_app");
 try{
   await socialStore(env);
   if(!await socialRead(env,"instagram:token"))return igOverlay(base,null,"needs_owner_authorization");
   const {state,status}=await socialRefresh(env,IG_CACHE,IG_TTL,igFetch,force);
   return igOverlay(base,state,status);
 }catch{return igOverlay(base,null,"storage_error");}
}
export async function nativeInstagramRoute(req,env,hasAdminSession,json){
 const path=new URL(req.url).pathname;
 if(!["/api/instagram/status","/api/instagram/connect","/api/instagram/callback","/api/instagram/refresh"].includes(path))return null;
 const refresh=path.endsWith("/refresh");
 if(req.method!==(refresh?"POST":"GET"))return json({error:"Unsupported method"},405);
 if(path.endsWith("/callback")){
   try{
     if(!env.INSTAGRAM_APP_ID||!env.INSTAGRAM_APP_SECRET)throw Error("Instagram app is not configured");
     const code=await socialOAuthCode(req,env,"instagram");
     const token=await igGrant(env,code);
     await socialStore(env);
     await socialWrite(env,"instagram:token",{cipher:await igEncrypt(env,token)});
     await nativeInstagramSnapshot(env,null,true);
     return socialOAuthResult("instagram",true);
   }catch{return socialOAuthResult("instagram",false);}
 }
 if(!await hasAdminSession())return json({error:"Not authorized"},401);
 if(!env.INSTAGRAM_APP_ID||!env.INSTAGRAM_APP_SECRET)
   return json({status:"needs_developer_app",required:["INSTAGRAM_APP_ID","INSTAGRAM_APP_SECRET"],redirectUri:IG_REDIRECT},503);
 if(path.endsWith("/connect")){
   const url=new URL(IG_OAUTH);
   url.searchParams.set("client_id",env.INSTAGRAM_APP_ID);
   url.searchParams.set("config_id",env.INSTAGRAM_CONFIG_ID||IG_CONFIG);
   url.searchParams.set("redirect_uri",IG_REDIRECT);
   url.searchParams.set("response_type","code");
   url.searchParams.set("display","popup");
   url.searchParams.set("prompt","login");
   return socialOAuthStart(env,"instagram",url);
 }
 const data=await nativeInstagramSnapshot(env,null,refresh);
 return refresh?socialRefreshResponse(json,data.nativeInstagram):json(data.nativeInstagram);
}
