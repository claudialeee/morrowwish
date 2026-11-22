// TikTok Display API v2 — private, owner-authorized native analytics.
// Credentials live in Cloudflare Worker secrets; OAuth tokens are AES-GCM
// encrypted in D1, never in public assets, GitHub commits, logs, or responses.
const TK_REDIRECT="https://morrowwish.vercel.app/api/tiktok/callback";
const TK_API="https://open.tiktokapis.com";
const TK_GAMES=["cat-bond","pawsibly-innocent","tiny-town","elsewhere","flip-dash","parcel-panic","pocket-aquarium"];
const TK_MAX_AGE_MS=15*60*1000;
const TK_FIELDS="id,create_time,share_url,video_description,title,view_count,like_count,comment_count,share_count";
const TK_CUTOFF="2026-11-21";
const TK_ENCODER=new TextEncoder();

async function tkDb(env){
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS social_native_store (key TEXT PRIMARY KEY, payload TEXT NOT NULL, updated_at INTEGER NOT NULL)").run();
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS social_native_oauth (state TEXT PRIMARY KEY, created_at INTEGER NOT NULL)").run();
}
async function tkGet(env,key){
  const row=await env.DB.prepare("SELECT payload,updated_at FROM social_native_store WHERE key=?").bind(key).first();
  return row?{data:JSON.parse(row.payload),updatedAt:row.updated_at}:null;
}
async function tkSet(env,key,data){
  await env.DB.prepare("INSERT INTO social_native_store(key,payload,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at")
    .bind(key,JSON.stringify(data),Date.now()).run();
}
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
      throw Error("TikTok Display API "+(data?.error?.code||res.status));
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
      throw Error("TikTok OAuth token exchange rejected: "+(data.error||response.status));
    if(data.scope&&!String(data.scope).split(",").includes("video.list"))throw Error("TikTok OAuth missing video.list scope");
    return {access_token:data.access_token,refresh_token:data.refresh_token,
      expires_at:Date.now()+Math.max(0,Number(data.expires_in)||0)*1000,
      refresh_expires_at:Date.now()+Math.max(0,Number(data.refresh_expires_in)||0)*1000,
      open_id:data.open_id||null,scope:data.scope||""};
  }finally{clearTimeout(timer);}
}
async function tkAuthorizedToken(env){
  const saved=await tkGet(env,"tiktok:token");
  if(!saved)return null;
  let token=await tkDecrypt(env,saved.data.cipher);
  if(token.expires_at>Date.now()+5*60*1000)return token.access_token;
  if(token.refresh_expires_at&&token.refresh_expires_at<Date.now())throw Error("TikTok authorization expired; reconnect required");
  const next=await tkTokenExchange(env,{grant_type:"refresh_token",refresh_token:token.refresh_token});
  await tkSet(env,"tiktok:token",{cipher:await tkEncrypt(env,next)});
  return next.access_token;
}
export function tkGame(video){
  const text=String(video.video_description||"")+" "+String(video.title||"");
  const slug=TK_GAMES.find(g=>new RegExp("(?:morrowwish\\.(?:vercel\\.app|pages\\.dev)/|/go/tiktok/)"+g+"(?:[/?#\\s]|$)","i").test(text));
  if(slug)return slug;
  const s=text.toLowerCase();
  for(const [id,hint] of Object.entries({
    "cat-bond":/cat bond|combo attack|rare cat|猫猫纽带/,
    "pawsibly-innocent":/pawsibly|sneaky cat|fish.*cat|cat.*heist/,
    "tiny-town":/tiny town|no bosses|no jobs/,
    "elsewhere":/elsewhere|paris.*moon|second chance.*life/,
    "flip-dash":/flip dash|flip gravity/,
    "parcel-panic":/parcel panic|wrong parcel|sorting parcels/,
    "pocket-aquarium":/pocket aquarium|hungry fish|feed them all/
  }))if(hint.test(s))return id;
  return null;
}
export function tkPost(video){
  if(!/^\d{15,22}$/.test(String(video.id||"")))return null;
  const date=new Date(Number(video.create_time)*1000);
  if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)<TK_CUTOFF)return null;
  const game=tkGame(video);
  if(!game)return null;
  const fallback="https://www.tiktok.com/@morrowwishgames/video/"+video.id;
  let url=fallback;
  try{
    const origin=new URL(video.share_url);
    if(origin.protocol==="https:"&&
       (origin.hostname==="tiktok.com"||origin.hostname.endsWith(".tiktok.com"))&&
       origin.pathname.includes("/video/"+video.id))url=origin.origin+origin.pathname;
  }catch{}
  const views=video.view_count==null?null:Number(video.view_count);
  return {platform:"tiktok",game,url,publishedAt:date.toISOString().slice(0,10),
    views:Number.isSafeInteger(views)&&views>=0?views:null,
    approved:true,publicVerified:true,dataSource:"tiktok-display-api-v2"};
}
async function tkList(env){
  const token=await tkAuthorizedToken(env);
  if(!token)return null;
  const raw=[],seen=new Set();let cursor=null;
  for(let page=0;page<8;page++){
    const body={max_count:20};
    if(cursor!=null)body.cursor=cursor;
    const data=await tkApi("/v2/video/list/?fields="+TK_FIELDS,token,body);
    if(!Array.isArray(data.videos))throw Error("TikTok returned no video list");
    for(const v of data.videos){
      if(!seen.has(String(v.id))){seen.add(String(v.id));raw.push(v);}
    }
    if(!data.has_more)break;
    if(data.cursor==null||String(cursor)===String(data.cursor))throw Error("TikTok pagination cursor stalled");
    cursor=data.cursor;
  }
  const posts=raw.map(tkPost).filter(Boolean);
  // A valid feed can include videos that do not advertise a Morrow Wish game.
  const state={posts,feedCount:raw.length,unmatchedCount:raw.length-posts.length,
    checkedAt:new Date().toISOString(),source:"tiktok-display-api-v2"};
  await tkSet(env,"tiktok:posts",state);
  return state;
}
export function tkOverlay(base,state,status){
  const result=JSON.parse(JSON.stringify(base||{}));
  if(!Array.isArray(result.platforms))return result;
  const row=result.platforms.find(p=>p.id==="tiktok");
  if(!row)return result;
  if(state?.checkedAt)result.capturedAt=state.checkedAt.slice(0,10);
  result.nativeTikTok={status,source:"tiktok-display-api-v2",
    checkedAt:state?.checkedAt||null,
    postMetricsCount:state?.posts?.length||0,
    feedCount:state?.feedCount??null,
    unmatchedCount:state?.unmatchedCount??null};
  if(!state?.posts?.length)return result;
  const keep=(result.metricScope?.verifiedPosts||[]).filter(p=>p.platform!=="tiktok");
  const previously=(result.metricScope?.verifiedPosts||[]).filter(p=>p.platform==="tiktok");
  // TikTok returns different share_url handles for the same video ID.
  // Identify a post by provider ID, never by URL or username presentation.
  const postKey=p=>/\/video\/(\d{15,22})/.exec(p.url||"")?.[1]||p.url;
  const combined=new Map(previously.map(p=>[postKey(p),p]));
  for(const post of state.posts){
    const key=postKey(post),prior=combined.get(key);
    // Preserve a more recent positive count if a provider cache regresses.
    combined.set(key,prior?.views!=null&&post.views!=null
      ?{...post,views:Math.max(prior.views,post.views)}:post);
  }
  const posts=[...combined.values()];
  result.metricScope.verifiedPosts=[...keep,...posts];
  result.metricScope.activeApprovedPosts=result.metricScope.verifiedPosts.length;
  // Preserve externally confirmed 7-published profile baseline if the API
  // returns a partial feed, but never assert that five missing videos have zero views.
  row.published=Math.max(Number(row.published)||0,posts.length);
  row.views=posts.length===row.published&&posts.every(p=>p.views!=null)
    ?posts.reduce((n,p)=>n+p.views,0):null;
  row.phase=row.views==null?"partial-native-metrics":"native-api-connected";
  row.metricScope="verified-tiktok-display-api;profile-count-if-feed-partial";
  row.note=row.views==null
    ?"TikTok has "+row.published+" published videos; native API currently identifies "+posts.length+" with metrics. Total views unknown until coverage is complete."
    :"TikTok video counts and plays are obtained via authorized TikTok Display API v2.";
  if(result.accountOverview?.platforms){
    const ov=result.accountOverview.platforms.find(p=>p.id==="tiktok");
    if(ov){ov.published=row.published;ov.views=row.views;ov.status=row.phase;}
  }
  return result;
}
export async function nativeTikTokSnapshot(env,base){
  if(!env.TIKTOK_CLIENT_KEY||!env.TIKTOK_CLIENT_SECRET)
    return tkOverlay(base,null,"needs_developer_app");
  try{
    await tkDb(env);
    const auth=await tkGet(env,"tiktok:token");
    if(!auth)return tkOverlay(base,null,"needs_owner_authorization");
    let cached=await tkGet(env,"tiktok:posts");
    let status="ready";
    if(!cached||Date.now()-cached.updatedAt>TK_MAX_AGE_MS){
      try{await tkList(env);cached=await tkGet(env,"tiktok:posts");}
      catch(e){status="sync_error";console.error("TikTok native sync failed:",String(e?.message||e).slice(0,200));}
    }
    return tkOverlay(base,cached?.data||null,status);
  }catch(e){
    console.error("TikTok native storage failed:",String(e?.message||e).slice(0,200));
    return tkOverlay(base,null,"storage_error");
  }
}
export async function nativeTikTokRoute(req,env,hasAdminSession,json){
  const path=new URL(req.url).pathname;
  if(!["/api/tiktok/status","/api/tiktok/connect","/api/tiktok/callback","/api/tiktok/refresh"].includes(path))return null;
  if(req.method!=="GET"&&!(path==="/api/tiktok/refresh"&&req.method==="POST"))
    return json({error:"Unsupported method"},405);
  if(!env.DB)return json({error:"D1 unavailable"},503);
  if(path==="/api/tiktok/callback"){
    try{
      if(!env.TIKTOK_CLIENT_KEY||!env.TIKTOK_CLIENT_SECRET)throw Error("Developer app not configured");
      const params=new URL(req.url).searchParams,state=params.get("state")||"",code=params.get("code")||"";
      if(!/^[0-9a-f-]{36}$/.test(state)||!code||code.length>2048)throw Error("Missing OAuth state or code");
      await tkDb(env);
      const used=await env.DB.prepare("DELETE FROM social_native_oauth WHERE state=? AND created_at>? RETURNING state")
        .bind(state,Date.now()-10*60*1000).first();
      if(!used)throw Error("Invalid or expired OAuth state");
      const token=await tkTokenExchange(env,{grant_type:"authorization_code",code,redirect_uri:TK_REDIRECT});
      await tkSet(env,"tiktok:token",{cipher:await tkEncrypt(env,token)});
      await tkList(env);
      return Response.redirect("https://morrowwish.vercel.app/studio-insights/?tiktok=connected",302);
    }catch(e){
      console.error("TikTok callback failed:",String(e?.message||e).slice(0,180));
      return Response.redirect("https://morrowwish.vercel.app/studio-insights/?tiktok=error",302);
    }
  }
  if(!await hasAdminSession())return json({error:"Not authorized"},401);
  if(!env.TIKTOK_CLIENT_KEY||!env.TIKTOK_CLIENT_SECRET)
    return json({status:"needs_developer_app",required:["TIKTOK_CLIENT_KEY","TIKTOK_CLIENT_SECRET"],redirectUri:TK_REDIRECT},503);
  await tkDb(env);
  if(path==="/api/tiktok/connect"){
    const state=crypto.randomUUID();
    await env.DB.prepare("INSERT INTO social_native_oauth(state,created_at) VALUES(?,?)")
      .bind(state,Date.now()).run();
    await env.DB.prepare("DELETE FROM social_native_oauth WHERE created_at<?")
      .bind(Date.now()-10*60*1000).run();
    const url=new URL("https://www.tiktok.com/v2/auth/authorize/");
    url.searchParams.set("client_key",env.TIKTOK_CLIENT_KEY);
    url.searchParams.set("response_type","code");
    url.searchParams.set("scope","user.info.basic,video.list");
    url.searchParams.set("redirect_uri",TK_REDIRECT);
    url.searchParams.set("state",state);
    return Response.redirect(url.toString(),302);
  }
  const auth=await tkGet(env,"tiktok:token");
  if(path==="/api/tiktok/status"){
    const cache=await tkGet(env,"tiktok:posts");
    return json({status:auth?"connected":"needs_owner_authorization",redirectUri:TK_REDIRECT,
      fetchedAt:cache?.data?.checkedAt||null,postMetricsCount:cache?.data?.posts?.length??0,
      feedCount:cache?.data?.feedCount??null,expectedPublished:7});
  }
  if(!auth)return json({error:"TikTok OAuth authorization required",status:"needs_owner_authorization"},409);
  try{
    const result=await tkList(env);
    return json({ok:true,checkedAt:result.checkedAt,postMetricsCount:result.posts.length,
      feedCount:result.feedCount,unmatchedCount:result.unmatchedCount});
  }catch(e){return json({error:"TikTok native refresh failed",details:String(e?.message||e).slice(0,180)},502);}
}
