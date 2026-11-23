import assert from 'node:assert/strict';
import fs from 'node:fs';
import {igOverlay,igApprovedReel,nativeInstagramSnapshot} from '../src/instagram-native.js';
const base=JSON.parse(fs.readFileSync('promotion/social-metrics-snapshot.json','utf8'));
const posts=base.metricScope.verifiedPosts.filter(x=>x.platform==='instagram');
assert.equal(posts.length,7);
assert.ok(posts.find(x=>x.game==='cat-bond')?.url.includes('/DgEawn_x8GT/'));
assert.ok(!JSON.stringify(posts).includes('DgDdwz6T4Gy'));
// The new Cat Bond Reel was posted Nov 22 in Pacific time, which is Nov 23 UTC.
const reel={permalink:'https://www.instagram.com/reel/DgEawn_x8GT/',
  timestamp:'2026-11-23T00:35:00+0000',media_type:'VIDEO',media_product_type:'REELS'};
assert.equal(igApprovedReel(reel),'cat-bond','a Nov 22 Pacific Reel must not be lost at midnight UTC');
assert.equal(igApprovedReel({...reel,permalink:'https://www.instagram.com/p/DgEawn_x8GT/'}),'cat-bond');
assert.equal(igApprovedReel({...reel,permalink:'https://www.instagram.com/reel/DgDdwz6T4Gy/'}),null,'deleted V12 Reel rejected');
assert.equal(igApprovedReel({...reel,media_product_type:'FEED'}),null,'Reels only');
assert.equal(igApprovedReel({...reel,permalink:'https://www.instagram.com/reel/other-post/'}),null,'not on allowlist');
const state={checkedAt:'2026-11-22T23:45:00.000Z',posts:posts.map((p,i)=>({...p,views:i+5,likes:i,comments:0,dataSource:'instagram-graph-insights'}))};
const o=igOverlay(base,state,'ready');
assert.equal(o.platforms.find(p=>p.id==='instagram').views,56);
assert.equal(o.nativeInstagram.postMetricsCount,7);
assert.equal(o.metricScope.verifiedPosts.length,28);
const partial=igOverlay(base,{...state,posts:state.posts.slice(0,6)},'ready');
assert.equal(partial.platforms.find(p=>p.id==='instagram').views,null);
assert.equal(partial.metricScope.verifiedPosts.find(p=>p.platform==='instagram'&&p.game==='pocket-aquarium').views,null);
const noView=igOverlay(base,{...state,posts:state.posts.map((p,i)=>i===2?{...p,views:null}:p)},'ready');
assert.equal(noView.platforms.find(p=>p.id==='instagram').views,null);
assert.equal((await nativeInstagramSnapshot({},base)).nativeInstagram.status,'needs_developer_app');
console.log('Instagram owner Insights integration guards missing metrics and older Reels.');
