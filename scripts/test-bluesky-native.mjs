import assert from 'node:assert/strict';
import fs from 'node:fs';
import {bskyPost,bskyOverlay,nativeBlueskySnapshot} from '../src/bluesky-native.js';

const baseline=JSON.parse(fs.readFileSync('promotion/social-metrics-snapshot.json','utf8'));
const did='did:plc:d55banmfpsnzmt35hqmmwha7';
const make=(rkey, likes, reposts)=>({
  author:{did},uri:'at://'+did+'/app.bsky.feed.post/'+rkey,
  embed:{$type:'app.bsky.embed.video#view'}, likeCount:likes,repostCount:reposts,replyCount:0,quoteCount:0
});
const cat=bskyPost(make('3n2wu5hqa4gl3',3,2));
const town=bskyPost(make('3n2wcr7nylvrr',1,4));
assert.equal(cat.game,'cat-bond');
assert.equal(cat.likes,3);
assert.equal(cat.reposts,2);
assert.ok(cat.url.endsWith('/post/3n2wu5hqa4gl3'));
assert.equal(bskyPost({...make('3n2wu5hqa4gl3',3,2),embed:null}),null);
assert.equal(bskyPost({...make('3n2wu5hqa4gl3',3,2),author:{did:'did:plc:other'}}),null);
assert.equal(bskyPost(make('3n2notapproved',500,1000)),null);
const oldCache={platform:'bluesky',game:'cat-bond',url:'https://bsky.app/profile/morrowwishgames.bsky.social/post/3n2rcatbond',publishedAt:'2026-11-22',views:null,likes:999,reposts:999,publicVerified:true,approved:true};
const result=bskyOverlay(baseline,{posts:[cat,town,oldCache],checkedAt:'2026-11-22T20:00:00Z'},'ready');
const bluesky=result.platforms.find(p=>p.id==='bluesky');
assert.equal(bluesky.published,7);
assert.equal(bluesky.likes,null);
assert.equal(bluesky.reposts,null);
assert.equal(bluesky.replies,null);
assert.equal(bluesky.quotes,null);
assert.equal(result.nativeBluesky.postMetricsCount,2);
assert.equal(result.nativeBluesky.status,'partial');
assert.equal(result.metricScope.verifiedPosts.find(p=>p.platform==='bluesky'&&p.game==='cat-bond').likes,3);
assert.equal(bluesky.views,null,'Bluesky public likes must not be mislabeled as views');
assert.equal(result.platforms.find(p=>p.id==='tiktok').views,94,'TikTok snapshot retained');
assert.equal(result.metricScope.verifiedPosts.filter(p=>p.platform==='bluesky').length,7);
assert.equal(result.metricScope.verifiedPosts.length,28);
assert.equal(bskyOverlay(result,{posts:[cat,town]},'ready').metricScope.verifiedPosts.length,28,'refresh replaces, not duplicates, old values');
const failed=await nativeBlueskySnapshot({DB:{prepare(){throw Error('not available')}}},baseline);
assert.equal(failed.nativeBluesky.status,'storage_error');
assert.equal(failed.platforms.find(p=>p.id==='tiktok').views,94);
console.log('Bluesky native engagement: identity, campaign matching, accurate public reactions, isolation and fail-safe verified.');
