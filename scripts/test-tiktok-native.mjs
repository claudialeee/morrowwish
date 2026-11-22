import assert from 'node:assert/strict';
import {tkGame,tkPost,tkOverlay,nativeTikTokRoute,nativeTikTokSnapshot} from '../src/tiktok-native.js';
import fs from 'node:fs';

const baseline=JSON.parse(fs.readFileSync('promotion/social-metrics-snapshot.json','utf8'));
assert.equal(baseline.platforms.find(p=>p.id==='tiktok').published,7,'seven account-level TikTok videos preserved');
assert.equal(baseline.platforms.find(p=>p.id==='tiktok').views,null,'missing videos must not be zero');
const games=['cat-bond','pawsibly-innocent','tiny-town','elsewhere','flip-dash','parcel-panic','pocket-aquarium'];
for(const game of games){
 const caption='Play free: https://morrowwish.vercel.app/'+game+'/';
 assert.equal(tkGame({video_description:caption,title:'Test'}),game);
}
const day=Math.floor(Date.parse('2026-11-22T12:00:00Z')/1000);
const ids=['7711071500000000001','7711071409966943502','7711071500000000003',
  '7711071458256112909','7711071500000000005','7711071500000000006','7711071500000000007'];
const raw=games.map((game,index)=>({
 id:ids[index],create_time:day+index,video_description:'Play: https://morrowwish.vercel.app/'+game+'/',
 share_url:'https://www.tiktok.com/@morrowwishgames/video/'+ids[index],
 view_count:index+10
}));
const posts=raw.map(tkPost);
assert.equal(posts.length,7);
assert.ok(posts.every(p=>p.publicVerified&&p.approved&&p.dataSource==='tiktok-display-api-v2'));
let partial=tkOverlay(baseline,{posts:posts.slice(0,2),feedCount:2,checkedAt:'2026-11-22T20:00:00.000Z'},'ready');
assert.equal(partial.platforms.find(p=>p.id==='tiktok').published,7);
assert.equal(partial.platforms.find(p=>p.id==='tiktok').views,null,'partial feed total must not be an invented zero');
assert.equal(partial.metricScope.verifiedPosts.filter(p=>p.platform==='tiktok').length,3,'never drop baseline verified videos on partial provider feed');
const complete=tkOverlay(baseline,{posts,feedCount:7,checkedAt:'2026-11-22T20:05:00.000Z'},'ready');
assert.equal(complete.platforms.find(p=>p.id==='tiktok').published,7);
assert.equal(complete.platforms.find(p=>p.id==='tiktok').views,91,'only complete seven-post feed totals are displayed');
assert.equal(complete.metricScope.verifiedPosts.filter(p=>p.platform==='tiktok').length,7,'all seven TikTok videos available by game');
assert.equal(complete.capturedAt,'2026-11-22');
assert.equal(baseline.platforms.find(p=>p.id==='tiktok').views,null,'baseline snapshot stays immutable');
const noMetric=tkOverlay(baseline,{posts:posts.map((p,i)=>i===4?{...p,views:null}:p),feedCount:7,checkedAt:'2026-11-22T20:00:00.000Z'},'ready');
assert.equal(noMetric.platforms.find(p=>p.id==='tiktok').views,null,'incomplete provider metrics are not zero');
assert.equal(tkPost({...raw[0],create_time:Math.floor(Date.parse('2026-11-20T00:00:00Z')/1000)}),null,'Nov 20 historical videos stay out');
assert.equal(tkPost({...raw[0],id:'invalid'}),null);
const result=await nativeTikTokSnapshot({DB:{}},baseline);
assert.equal(result.nativeTikTok.status,'needs_developer_app','no developer app must be transparent');
const err=await nativeTikTokRoute(new Request('https://morrowwish.vercel.app/api/tiktok/status'),
 {DB:{}},async()=>false,(o,s)=>new Response(JSON.stringify(o),{status:s}));
assert.equal(err.status,401,'authenticated settings route not public');
console.log('TikTok Display API: seven canonical games, pagination-driven overlay, missing metrics, OAuth configuration and auth guards validated.');
