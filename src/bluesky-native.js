import {socialCount, socialStore, socialRefresh, socialOverlay} from "./social-native.js";
// Bluesky native public AppView analytics. No credentials, scheduling service,
// or browser scraping: likes/reposts/replies/quotes are first-party public counts.
const BSKY_ACTOR = "did:plc:d55banmfpsnzmt35hqmmwha7";
const BSKY_HANDLE = "morrowwishgames.bsky.social";
const BSKY_API = "https://public.api.bsky.app/xrpc/app.bsky.feed.getPosts";
const BSKY_CACHE_MS = 10 * 60 * 1000;
const BSKY_START = "2026-11-22";
// Launch-campaign allowlist. Never read/track other posts, even if their
// captions also link to a Morrow Wish game.
const BSKY_APPROVED={
  "cat-bond":"3n2wu5hqa4gl3",
  "pawsibly-innocent":"3n2wcqugab5jq",
  "tiny-town":"3n2wcr7nylvrr",
  "elsewhere":"3n2wcraws7xga",
  "flip-dash":"3n2wcrc4lqcyn",
  "parcel-panic":"3n2wcrdnc2owx",
  "pocket-aquarium":"3n2wcreq5hq3p"
};
const BSKY_STORE_KEY="bluesky:approved-20261122:v13";
const BSKY_URI_PREFIX = "at://" + BSKY_ACTOR + "/app.bsky.feed.post/";
const BSKY_GAME_BY_URI = new Map(Object.entries(BSKY_APPROVED).map(([game,id])=>[BSKY_URI_PREFIX+id,game]));
export function bskyPost(post) {
  const game = BSKY_GAME_BY_URI.get(post?.uri);
  if (!game || post.author?.did !== BSKY_ACTOR || post.embed?.$type !== "app.bsky.embed.video#view") return null;
  const id = BSKY_APPROVED[game];
  return {
    platform:"bluesky", game, url:"https://bsky.app/profile/" + BSKY_HANDLE + "/post/" + id,
    publishedAt:BSKY_START, views:null, likes:socialCount(post.likeCount), reposts:socialCount(post.repostCount),
    replies:socialCount(post.replyCount), quotes:socialCount(post.quoteCount)
  };
}
async function bskyFetch() {
  const url = new URL(BSKY_API);
  for (const uri of BSKY_GAME_BY_URI.keys()) url.searchParams.append("uris", uri);
  const response = await fetch(url, {signal:AbortSignal.timeout(10000)});
  if (!response.ok) throw Error("AppView feed unavailable");
  const data = await response.json();
  if (!Array.isArray(data.posts)) throw Error("AppView posts missing");
  return data.posts.map(bskyPost).filter(Boolean);
}
export function bskyOverlay(base,state,status) {
  return socialOverlay(base,state,status,{
    id:"bluesky",name:"nativeBluesky",source:"bluesky-public-appview",
    metrics:["likes","reposts","replies","quotes"],
    isApproved:p=>p.publishedAt===BSKY_START&&BSKY_APPROVED[p.game]===(p.url||"").match(/\/post\/([a-z0-9]+)$/)?.[1]
  });
}
export async function nativeBlueskySnapshot(env,base,force=false) {
  try {
    await socialStore(env);
    const {state,status} = await socialRefresh(env,BSKY_STORE_KEY,BSKY_CACHE_MS,bskyFetch,force);
    return bskyOverlay(base,state,status);
  } catch {return bskyOverlay(base,null,"storage_error");}
}
