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
const igNum=v=>v!=null&&Number.isSafeInteger(Number(v))&&Number(v)>=0?Number(v):null;
const igCode=p=>/instagram\.com\/reel\/([A-Za-z0-9_-]+)/.exec(p||"")?.[1]||null;
async function igDb(env){
 await env.DB.prepare("CREATE TABLE IF NOT EXISTS social_native_store (key TEXT PRIMARY KEY, payload TEXT NOT NULL, updated_at INTEGER NOT NULL)").run();
 await env.DB.prepare("CREATE TABLE IF NOT EXISTS social_native_oauth (state TEXT PRIMARY KEY, created_at INTEGER NOT NULL)").run();
}
async function igGet(env,key){
 const r=await env.DB.prepare("SELECT payload,updated_at FROM social_native_store WHERE key=?").bind(key).first();
 return r?{data:JSON.parse(r.payload),updatedAt:r.updated_at}:null;
}
async function igSet(env,key,data){
 await env.DB.prepare("INSERT INTO social_native_store(key,payload,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at")
  .bind(key,JSON.stringify(data),Date.now()).run();
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
 if(!r.ok)throw Error("Instagram Graph API HTTP "+r.status);
 const obj=await r.json();
 if(obj.error)throw Error("Instagram Graph API "+String(obj.error.code||"error"));
 return obj;
}
async function igGrant(env,code){
 const form=new URLSearchParams({
   client_id:env.INSTAGRAM_APP_ID,client_secret:env.INSTAGRAM_APP_SECRET,
   grant_type:"authorization_code",redirect_uri:IG_REDIRECT,code:code.replace(/#_$/,"")
 });
 const r=await fetch("https://api.instagram.com/oauth/access_token",{
   method:"POST",body:form,signal:AbortSignal.timeout(12000)
 });
 const short=await r.json();
 if(!r.ok||!short.access_token)throw Error("Instagram OAuth exchange failed");
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
 const row=await igGet(env,"instagram:token");
 if(!row)return null;
 const token=await igDecrypt(env,row.data.cipher);
 if(token.expiresAt>Date.now()+7*86400000)return token.accessToken;
 if(token.expiresAt<Date.now())throw Error("Instagram token expired; reconnect required");
 const u=new URL("https://graph.instagram.com/refresh_access_token");
 u.searchParams.set("grant_type","ig_refresh_token");u.searchParams.set("access_token",token.accessToken);
 const r=await fetch(u.toString(),{signal:AbortSignal.timeout(12000)});
 const obj=await r.json();
 if(!r.ok||!obj.access_token)throw Error("Instagram token refresh failed; reconnect required");
 const next={accessToken:obj.access_token,expiresAt:Date.now()+Number(obj.expires_in||5184000)*1000};
 await igSet(env,"instagram:token",{cipher:await igEncrypt(env,next)});
 return next.accessToken;
}
async function igFetch(env){
 const token=await igAuthorizedToken(env);
 if(!token)return null;
 const me=await igRequest("/me",token,{fields:"user_id,username"});
 if(String(me.username||"").toLowerCase()!=="morrowwishgames")throw Error("Instagram connected account does not match @morrowwishgames");
 let after=null,matched=new Map();
 for(let page=0;page<4;page++){
   const q={fields:"id,permalink,media_type,media_product_type,timestamp,like_count,comments_count",limit:100};
   if(after)q.after=after;
   const response=await igRequest("/me/media",token,q);
   if(!Array.isArray(response.data))throw Error("Instagram media listing missing");
   for(const p of response.data){
     const game=Object.keys(IG_APPROVED).find(k=>IG_APPROVED[k]===igCode(p.permalink));
     if(!game||matched.has(game)||String(p.timestamp||"").slice(0,10)<"2026-11-22")continue;
     if(p.media_type!=="VIDEO"&&p.media_product_type!=="REELS")continue;
     matched.set(game,{platform:"instagram",game,url:"https://www.instagram.com/reel/"+IG_APPROVED[game]+"/",
       publishedAt:"2026-11-22",views:null,likes:igNum(p.like_count),comments:igNum(p.comments_count),
       approved:true,publicVerified:true,dataSource:"instagram-graph-insights",mediaId:p.id});
   }
   if(matched.size===7||!response.paging?.cursors?.after||!response.paging?.next||response.paging.cursors.after===after)break;
   after=response.paging.cursors.after;
 }
 const posts=[];
 for(const p of matched.values()){
   try{
     const insights=await igRequest("/"+encodeURIComponent(p.mediaId)+"/insights",token,{metric:"views"});
     const metric=(insights.data||[]).find(x=>x.name==="views");
     const raw=metric?.total_value?.value??metric?.values?.[0]?.value;
     p.views=igNum(raw);
   }catch(e){console.error("Instagram Reel views unavailable:",p.game,String(e?.message||e).slice(0,65));}
   delete p.mediaId;
   posts.push(p);
 }
 const state={posts,checkedAt:new Date().toISOString(),source:"instagram-graph-insights",account:"morrowwishgames"};
 await igSet(env,"instagram:approved:20261122",state);
 return state;
}
export function igOverlay(base,state,status){
 const result=structuredClone(base||{});
 const row=result.platforms?.find(p=>p.id==="instagram");
 const posts=(state?.posts||[]).filter(p=>IG_APPROVED[p.game]===igCode(p.url));
 result.nativeInstagram={status,source:"instagram-graph-insights",checkedAt:state?.checkedAt||null,postMetricsCount:posts.length,expectedPosts:7};
 if(!row||!state)return result;
 const known=new Map(posts.map(p=>[p.game,p]));
 if(result.metricScope){
   result.metricScope.verifiedPosts=result.metricScope.verifiedPosts.map(p=>p.platform==="instagram"
     ?(known.get(p.game)||{...p,views:null,likes:null,comments:null,dataSource:"instagram-native-unavailable"}):p);
   result.metricScope.activeApprovedPosts=result.metricScope.verifiedPosts.length;
 }
 row.views=posts.length===7&&posts.every(p=>p.views!=null)?posts.reduce((n,p)=>n+p.views,0):null;
 row.likes=posts.length===7&&posts.every(p=>p.likes!=null)?posts.reduce((n,p)=>n+p.likes,0):null;
 row.phase=row.views==null?"partial-native-metrics":"native-api-connected";
 row.metricScope="seven-approved-reels-instagram-native-insights";
 row.note="Instagram official Reel insights; last checked "+state.checkedAt+". Missing views remain blank.";
 return result;
}
export async function nativeInstagramSnapshot(env,base){
 if(!env.INSTAGRAM_APP_ID||!env.INSTAGRAM_APP_SECRET)return igOverlay(base,null,"needs_developer_app");
 try{
   await igDb(env);
   if(!await igGet(env,"instagram:token"))return igOverlay(base,null,"needs_owner_authorization");
   let cached=await igGet(env,"instagram:approved:20261122"),status="ready";
   if(!cached||Date.now()-cached.updatedAt>IG_TTL){
     try{await igFetch(env);cached=await igGet(env,"instagram:approved:20261122");}
     catch(e){status="sync_error";console.error("Instagram metrics sync failed:",String(e?.message||e).slice(0,85));}
   }
   return igOverlay(base,cached?.data||null,status);
 }catch(e){console.error("Instagram native cache failed:",String(e?.message||e).slice(0,85));return igOverlay(base,null,"storage_error");}
}
export async function nativeInstagramRoute(req,env,hasAdminSession,json){
 const path=new URL(req.url).pathname;
 if(!["/api/instagram/status","/api/instagram/connect","/api/instagram/callback","/api/instagram/refresh"].includes(path))return null;
 if(req.method!=="GET"&&!(path==="/api/instagram/refresh"&&req.method==="POST"))return json({error:"Unsupported method"},405);
 if(!env.DB)return json({error:"D1 unavailable"},503);
 if(path==="/api/instagram/callback"){
   try{
     if(!env.INSTAGRAM_APP_ID||!env.INSTAGRAM_APP_SECRET)throw Error("Instagram app is not configured");
     const q=new URL(req.url).searchParams,state=q.get("state")||"",code=q.get("code")||"";
     if(!/^[0-9a-f-]{36}$/.test(state)||!code||code.length>2048)throw Error("Invalid OAuth response");
     await igDb(env);
     const used=await env.DB.prepare("DELETE FROM social_native_oauth WHERE state=? AND created_at>? RETURNING state")
       .bind(state,Date.now()-600000).first();
     if(!used)throw Error("Invalid or expired OAuth state");
     const token=await igGrant(env,code);
     await igSet(env,"instagram:token",{cipher:await igEncrypt(env,token)});
     await igFetch(env);
     return Response.redirect("https://morrowwish.vercel.app/studio-insights/?instagram=connected",302);
   }catch(e){console.error("Instagram OAuth callback failed:",String(e?.message||e).slice(0,85));
     return Response.redirect("https://morrowwish.vercel.app/studio-insights/?instagram=error",302);}
 }
 if(!await hasAdminSession())return json({error:"Not authorized"},401);
 if(!env.INSTAGRAM_APP_ID||!env.INSTAGRAM_APP_SECRET)
   return json({status:"needs_developer_app",required:["INSTAGRAM_APP_ID","INSTAGRAM_APP_SECRET"],redirectUri:IG_REDIRECT},503);
 await igDb(env);
 if(path==="/api/instagram/connect"){
   const state=crypto.randomUUID();
   await env.DB.prepare("INSERT INTO social_native_oauth(state,created_at) VALUES(?,?)").bind(state,Date.now()).run();
   await env.DB.prepare("DELETE FROM social_native_oauth WHERE created_at<?").bind(Date.now()-600000).run();
   const url=new URL("https://www.instagram.com/oauth/authorize");
   url.searchParams.set("client_id",env.INSTAGRAM_APP_ID);
   url.searchParams.set("redirect_uri",IG_REDIRECT);
   url.searchParams.set("response_type","code");
   url.searchParams.set("scope","instagram_business_basic,instagram_business_manage_insights");
   url.searchParams.set("state",state);
   return Response.redirect(url.toString(),302);
 }
 const token=await igGet(env,"instagram:token");
 if(path==="/api/instagram/status"){
   const cached=await igGet(env,"instagram:approved:20261122");
   return json({status:token?"connected":"needs_owner_authorization",redirectUri:IG_REDIRECT,
     fetchedAt:cached?.data?.checkedAt||null,postMetricsCount:cached?.data?.posts?.length??0,expectedPublished:7});
 }
 if(!token)return json({status:"needs_owner_authorization",error:"Instagram owner OAuth required"},409);
 try{
   const state=await igFetch(env);
   return json({ok:true,checkedAt:state.checkedAt,postMetricsCount:state.posts.length,expectedPublished:7,
     completeViews:state.posts.length===7&&state.posts.every(p=>p.views!=null)});
 }catch(e){return json({error:"Instagram native refresh failed",details:String(e?.message||e).slice(0,85)},502);}
}
