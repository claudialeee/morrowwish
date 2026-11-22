import assert from 'node:assert/strict';
import fs from 'node:fs';
import {bskyGame,bskyPost,bskyOverlay,nativeBlueskySnapshot} from '../src/bluesky-native.js';

const baseline=JSON.parse(fs.readFileSync('promotion/social-metrics-snapshot.json','utf8'));
const did='did:plc:d55banmfpsnzmt35hqmmwha7';
const make=(game,rkey,likes,reposts)=>({
  post:{author:{did},uri:'at://'+did+'/app.bsky.feed.post/'+rkey,
    indexedAt:'2026-11-22T20:00:00Z',
    record:{text:'Play free: https://morrowwish.vercel.app/'+game+'/'},
    likeCount:likes,repostCount:reposts,replyCount:2,quoteCount:1}
});
assert.equal(bskyGame('Play free: https://morrowwish.vercel.app/cat-bond/'),'cat-bond');
assert.equal(bskyGame('No jobs. No bosses. Your town, your rules.'),'tiny-town');
assert.equal(bskyGame('Unrelated post'),null);
const cat=bskyPost(make('cat-bond','3n2rcatbond',3,2));
const town=bskyPost(make('tiny-town','3n2rtinytown',1,4));
assert.equal(cat.likes,3);
assert.equal(cat.reposts,2);
assert.ok(cat.url.endsWith('/post/3n2rcatbond'));
assert.equal(bskyPost({...make('cat-bond','3n2rcatbond',3,2),reason:{$type:'app.bsky.feed.defs#reasonRepost'}}),null);
assert.equal(bskyPost({...make('cat-bond','3n2rcatbond',3,2),post:{...make('cat-bond','3n2rcatbond',3,2).post,author:{did:'did:plc:other'}}}),null);
assert.equal(bskyPost({...make('cat-bond','3n2rcatbond',3,2),post:{...make('cat-bond','3n2rcatbond',3,2).post,indexedAt:'2026-11-20T10:00:00Z'}}),null);
const result=bskyOverlay(baseline,{posts:[cat,town],checkedAt:'2026-11-22T20:00:00Z'},'ready');
const bluesky=result.platforms.find(p=>p.id==='bluesky');
assert.equal(bluesky.published,2);
assert.equal(bluesky.likes,4);
assert.equal(bluesky.reposts,6);
assert.equal(bluesky.replies,4);
assert.equal(bluesky.quotes,2);
assert.equal(bluesky.views,null,'Bluesky public likes must not be mislabeled as views');
assert.equal(result.platforms.find(p=>p.id==='tiktok').views,94,'TikTok snapshot retained');
assert.equal(result.metricScope.verifiedPosts.filter(p=>p.platform==='bluesky').length,2);
assert.equal(result.metricScope.verifiedPosts.length,23);
assert.equal(bskyOverlay(result,{posts:[cat,town]},'ready').metricScope.verifiedPosts.length,23,'refresh replaces, not duplicates, old values');
const failed=await nativeBlueskySnapshot({DB:{prepare(){throw Error('not available')}}},baseline);
assert.equal(failed.nativeBluesky.status,'storage_error');
assert.equal(failed.platforms.find(p=>p.id==='tiktok').views,94);
console.log('Bluesky native engagement: identity, campaign matching, accurate public reactions, isolation and fail-safe verified.');
