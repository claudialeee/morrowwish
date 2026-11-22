// Bluesky native public AppView analytics. No credentials, scheduling service,
// or browser scraping: likes/reposts/replies/quotes are first-party public counts.
const BSKY_ACTOR = "did:plc:d55banmfpsnzmt35hqmmwha7";
const BSKY_HANDLE = "morrowwishgames.bsky.social";
const BSKY_API = "https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed";
const BSKY_CACHE_MS = 10 * 60 * 1000;
const BSKY_START = "2026-11-21";
const BSKY_GAMES = ["cat-bond","pawsibly-innocent","tiny-town","elsewhere","flip-dash","parcel-panic","pocket-aquarium"];
const BSKY_HINTS = {
  "cat-bond": /cat bond|rare cat|combo attack|cat crew|猫猫纽带/i,
  "pawsibly-innocent": /pawsibly innocent|sneaky cat|fish.*human|cat.*escape/i,
  "tiny-town": /tiny town|your town, your rules|no jobs. no bosses/i,
  "elsewhere": /elsewhere|wake up in paris|on the moon|second chance.*life/i,
  "flip-dash": /flip dash|flip gravity/i,
  "parcel-panic": /parcel panic|wrong parcel/i,
  "pocket-aquarium": /pocket aquarium|hungry fish|feed them all/i
};
export function bskyGame(text) {
  const s = String(text || "");
  const explicit = BSKY_GAMES.find(id => new RegExp("(?:morrowwish\\.(?:vercel\\.app|pages\\.dev)/|/go/bluesky/)" + id + "(?:[/?#\\s]|$)", "i").test(s));
  return explicit || BSKY_GAMES.find(id => BSKY_HINTS[id].test(s)) || null;
}
function bskyCount(v) {
  return Number.isSafeInteger(v) && v >= 0 ? v : null;
}
export function bskyPost(item) {
  const p = item?.post, rec = p?.record;
  if (!p || !rec || p.author?.did !== BSKY_ACTOR || item.reason) return null;
  const date = new Date(p.indexedAt || rec.createdAt);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) < BSKY_START) return null;
  const game = bskyGame(rec.text);
  const id = String(p.uri || "").match(/^at:\/\/did:plc:[a-z0-9]+\/app\.bsky\.feed\.post\/([a-z0-9]+)$/i)?.[1];
  if (!game || !id) return null;
  return {
    platform:"bluesky", game,
    url:"https://bsky.app/profile/" + BSKY_HANDLE + "/post/" + id,
    publishedAt:date.toISOString().slice(0,10),
    views:null, likes:bskyCount(p.likeCount), reposts:bskyCount(p.repostCount),
    replies:bskyCount(p.replyCount), quotes:bskyCount(p.quoteCount),
    approved:true,publicVerified:true,dataSource:"bluesky-public-appview"
  };
}
async function bskyStore(env) {
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS social_native_store (key TEXT PRIMARY KEY, payload TEXT NOT NULL, updated_at INTEGER NOT NULL)").run();
}
async function bskyGet(env) {
  const row = await env.DB.prepare("SELECT payload, updated_at FROM social_native_store WHERE key=?").bind("bluesky:posts").first();
  if(!row) return null;
  return {data:JSON.parse(row.payload),updatedAt:row.updated_at};
}
async function bskySet(env,state) {
  await env.DB.prepare("INSERT INTO social_native_store(key,payload,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at")
    .bind("bluesky:posts",JSON.stringify(state),Date.now()).run();
}
async function bskyList(env) {
  let cursor=null, pages=0;
  const posts=new Map();
  for (let page=0;page<4;page++) {
    const u=new URL(BSKY_API);
    u.searchParams.set("actor",BSKY_ACTOR);
    u.searchParams.set("filter","posts_no_replies");
    u.searchParams.set("limit","100");
    if(cursor)u.searchParams.set("cursor",cursor);
    const r=await fetch(u.toString(),{headers:{Accept:"application/json"},signal:AbortSignal.timeout(10000)});
    if(!r.ok)throw Error("Bluesky public AppView HTTP " + r.status);
    const data=await r.json();
    if(!Array.isArray(data.feed))throw Error("Bluesky feed missing");
    pages++;
    for(const item of data.feed) {
      const p=bskyPost(item);
      if(p)posts.set(p.url,p);
    }
    if(!data.cursor || data.cursor===cursor || data.feed.length===0)break;
    // Continue even when older posts appear; promoted videos may be interleaved
    // with other posts. Never fabricate metrics for missing entries.
    cursor=data.cursor;
  }
  const state={posts:[...posts.values()],checkedAt:new Date().toISOString(),pages,source:"bluesky-public-appview"};
  await bskySet(env,state);
  return state;
}
export function bskyOverlay(base,state,status) {
  const result=structuredClone(base||{});
  const row=result.platforms?.find(p=>p.id==="bluesky");
  result.nativeBluesky={status,checkedAt:state?.checkedAt||null,postMetricsCount:state?.posts?.length??0,source:"bluesky-public-appview"};
  if(!row || !state?.posts?.length)return result;
  // Replace previous Bluesky readings atomically; do not accumulate snapshots.
  const prev=result.metricScope?.verifiedPosts||[];
  const current=state.posts;
  if(result.metricScope){
    result.metricScope.verifiedPosts=[...prev.filter(p=>p.platform!=="bluesky"),...current];
    result.metricScope.activeApprovedPosts=result.metricScope.verifiedPosts.length;
  }
  row.published=current.length;
  row.views=null; // Public Bluesky app views are not available on this feed.
  for(const k of ["likes","reposts","replies","quotes"]){
    row[k]=current.every(p=>p[k]!=null)?current.reduce((n,p)=>n+p[k],0):null;
  }
  row.phase="native-public-api";
  row.metricScope="individually-verified-campaign-post-engagement";
  row.note="Public Bluesky likes, reposts, replies and quotes refreshed from Bluesky AppView; no play/view number inferred.";
  return result;
}
export async function nativeBlueskySnapshot(env,base) {
  let cached=null,status="ready";
  try{
    await bskyStore(env);
    cached=await bskyGet(env);
    if(!cached||Date.now()-cached.updatedAt>BSKY_CACHE_MS){
      try{const state=await bskyList(env);cached={data:state,updatedAt:Date.now()};}
      catch(e){status="sync_error";console.error("Bluesky analytics refresh failed:",String(e?.message||e).slice(0,160));}
    }
  }catch(e){status="storage_error";console.error("Bluesky native cache error:",String(e?.message||e).slice(0,160));}
  return bskyOverlay(base,cached?.data||null,status);
}
