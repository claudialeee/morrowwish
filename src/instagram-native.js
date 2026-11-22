import {socialCount, socialStore, socialRead, socialWrite, socialRefresh, socialOverlay, SocialSyncError, socialOAuthStart, socialOAuthCode, socialOAuthResult, socialRefreshResponse} from "./social-native.js";
// Instagram API with Instagram Login: approved reels, owner OAuth, Insights.
// No vidIQ, Metricool, scraping, publishing privileges or public credentials.
const IG_API="https://graph.instagram.com/v27.0";
const IG_REDIRECT="https://morrowwish.vercel.app/api/instagram/callback";
const IG_TTL=15*60*1000;
const IG_APPROVED={
 "cat-bond":"DgDdwz6T4Gy",
 "pawsibly-innocent":"DgDfM-DBb1K",
 "tiny-town":"DgDfO6ztxnM",
 "elsewhere":"DgDfQqkT6Gx",
 "flip-dash":"DgDfUwbB4EP",
 "parcel-panic":"DgDfRCJAF83",
 "pocket-aquarium":"DgDfRT3O7EK"
};
const igCode=p=>/instagram\.com\/reel\/([A-Za-z0-9_-]+)/.exec(p||"")?.[1]||null;
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
async function igGrant(env,code){
 const form=new FormData();
 for(const [key,value] of Object.entries({
   client_id:env.INSTAGRAM_APP_ID,client_secret:env.INSTAGRAM_APP_SECRET,
   grant_type:"authorization_code",redirect_uri:IG_REDIRECT,code:code.replace(/#_$/,"")
 }))form.set(key,value);
 const r=await fetch("https://api.instagram.com/oauth/access_token",{
   method:"POST",body:form,signal:AbortSignal.timeout(12000)
 });
 const grant=await r.json();
 const short=grant.data?.[0]??grant;
 if(!r.ok||!short.access_token)throw Error("Instagram OAuth exchange failed");
 const scopes=typeof short.permissions==="string"?short.permissions.split(/[,\s]+/):short.permissions;
 if(Array.isArray(scopes)&&!["instagram_business_basic","instagram_business_manage_insights"].every(scope=>scopes.includes(scope)))
   throw new SocialSyncError("needs_permission");
 const u=new URL("https://graph.instagram.com/access_token");
 u.searchParams.set("grant_type","ig_exchange_token");
 u.searchParams.set("client_secret",env.INSTAGRAM_APP_SECRET);
 u.searchParams.set("access_token",short.access_token);
 const longResponse=await fetch(u.toString(),{signal:AbortSignal.timeout(12000)});
 const long=await longResponse.json();
 if(!longResponse.ok||!long.access_token)throw Error("Instagram long-lived token exchange failed");
 return {accessToken:long.access_token,expiresAt:Date.now()+Number(long.expires_in||5184000)*1000};
}
async function igAuthorizedToken(env){
 const row=await socialRead(env,"instagram:token");
 if(!row)return null;
 const token=await igDecrypt(env,row.data.cipher);
 if(token.expiresAt>Date.now()+7*86400000)return token.accessToken;
 if(token.expiresAt<Date.now())throw new SocialSyncError("needs_owner_authorization");
 const u=new URL("https://graph.instagram.com/refresh_access_token");
 u.searchParams.set("grant_type","ig_refresh_token");u.searchParams.set("access_token",token.accessToken);
 const r=await fetch(u.toString(),{signal:AbortSignal.timeout(12000)});
 const obj=await r.json();
 if(!r.ok||!obj.access_token)throw new SocialSyncError(obj.error?.code===190?"needs_owner_authorization":"sync_error");
 const next={accessToken:obj.access_token,expiresAt:Date.now()+Number(obj.expires_in||5184000)*1000};
 await socialWrite(env,"instagram:token",{cipher:await igEncrypt(env,next)});
 return next.accessToken;
}
const IG_CACHE="instagram:approved:20261122";
async function igVerifiedAccount(token) {
 const me=await igRequest("/me",token,{fields:"user_id,username"});
 if(String(me.username||"").toLowerCase()!=="morrowwishgames"||!/^\d+$/.test(me.user_id||""))
   throw new SocialSyncError("wrong_account");
 return me.user_id;
}
async function igFetch(env){
 const token=await igAuthorizedToken(env);
 if(!token)throw new SocialSyncError("needs_owner_authorization");
 const userId=await igVerifiedAccount(token);
 let after=null,matched=new Map();
 for(let page=0;page<4;page++){
   const q={fields:"id,permalink,media_type,media_product_type,timestamp,like_count,comments_count",limit:100,
     since:Date.parse("2026-11-22T00:00:00-08:00")/1000,until:Date.parse("2026-11-23T00:00:00-08:00")/1000};
   if(after)q.after=after;
   const response=await igRequest("/"+userId+"/media",token,q);
   if(!Array.isArray(response.data))throw Error("Instagram media listing missing");
   for(const p of response.data){
     const game=Object.keys(IG_APPROVED).find(k=>IG_APPROVED[k]===igCode(p.permalink));
     if(!game||matched.has(game)||String(p.timestamp||"").slice(0,10)<"2026-11-22")continue;
     if(p.media_type!=="VIDEO"||p.media_product_type!=="REELS")continue;
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
 if(!env.INSTAGRAM_APP_ID||!env.INSTAGRAM_APP_SECRET)return igOverlay(base,null,"needs_developer_app");
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
     await igVerifiedAccount(token.accessToken);
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
   const url=new URL("https://www.instagram.com/oauth/authorize");
   url.searchParams.set("client_id",env.INSTAGRAM_APP_ID);
   url.searchParams.set("redirect_uri",IG_REDIRECT);
   url.searchParams.set("response_type","code");
   url.searchParams.set("scope","instagram_business_basic,instagram_business_manage_insights");
   url.searchParams.set("enable_fb_login","0");
   return socialOAuthStart(env,"instagram",url);
 }
 const data=await nativeInstagramSnapshot(env,null,refresh);
 return refresh?socialRefreshResponse(json,data.nativeInstagram):json(data.nativeInstagram);
}
