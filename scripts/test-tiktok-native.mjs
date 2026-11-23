import assert from 'node:assert/strict';
import {tkPost,tkOverlay,nativeTikTokRoute,nativeTikTokSnapshot} from '../src/tiktok-native.js';
import fs from 'node:fs';

const baseline=JSON.parse(fs.readFileSync('promotion/social-metrics-snapshot.json','utf8'));
assert.equal(baseline.platforms.find(p=>p.id==='tiktok').published,7,'seven account-level TikTok videos preserved');
assert.equal(baseline.platforms.find(p=>p.id==='tiktok').views,null,'V13 data excludes old play counts');
const games=['cat-bond','pawsibly-innocent','tiny-town','elsewhere','flip-dash','parcel-panic','pocket-aquarium'];
const day=Math.floor(Date.parse('2026-11-22T12:00:00Z')/1000);
const ids=['7711158345406680334','7711071409966943502','7711071395941240095',
  '7711071458256112909','7711071406368312589','7711071416099032333','7711071765379829005'];
const raw=games.map((game,index)=>({
 id:ids[index],create_time:day+index,video_description:'Play: https://morrowwish.vercel.app/'+game+'/',
 share_url:'https://www.tiktok.com/@morrowwishgames/video/'+ids[index],
 view_count:index+100,like_count:index,comment_count:0,share_count:index+1
}));
const posts=raw.map(tkPost);
assert.equal(posts.length,7);
assert.deepEqual(posts.map(p=>p.game),games);
let partial=tkOverlay(baseline,{posts:posts.slice(0,2),feedCount:2,checkedAt:'2026-11-22T20:00:00.000Z'},'ready');
assert.equal(partial.platforms.find(p=>p.id==='tiktok').published,7);
assert.equal(partial.platforms.find(p=>p.id==='tiktok').views,null,'partial native responses never sum old numbers');
assert.equal(partial.metricScope.verifiedPosts.filter(p=>p.platform==='tiktok').length,7,'never drop baseline verified videos on partial provider feed');
const complete=tkOverlay(baseline,{posts,feedCount:7,checkedAt:'2026-11-22T20:05:00.000Z'},'ready');
assert.equal(complete.platforms.find(p=>p.id==='tiktok').published,7);
assert.equal(complete.platforms.find(p=>p.id==='tiktok').views,721,'newer full provider readings replace old verified counts');
assert.equal(complete.metricScope.verifiedPosts.filter(p=>p.platform==='tiktok').length,7,'all seven TikTok videos available by game');
assert.equal(complete.platforms.find(p=>p.id==='tiktok').likes,21);
assert.equal(complete.platforms.find(p=>p.id==='tiktok').comments,0);
assert.equal(complete.platforms.find(p=>p.id==='tiktok').shares,28);
assert.equal(partial.nativeTikTok.status,"partial");
assert.equal(partial.metricScope.verifiedPosts.find(p=>p.platform==="tiktok"&&p.game==="tiny-town").views,null);
assert.equal(baseline.platforms.find(p=>p.id==='tiktok').views,null,'baseline snapshot stays immutable');
const noMetric=tkOverlay(baseline,{posts:posts.map((p,i)=>i===4?{...p,views:null}:p),feedCount:7,checkedAt:'2026-11-22T20:00:00.000Z'},'ready');
assert.equal(noMetric.platforms.find(p=>p.id==='tiktok').views,null,'incomplete provider metrics are not zero');
assert.equal(tkPost({...raw[0],id:'invalid'}),null);
const result=await nativeTikTokSnapshot({DB:{}},baseline);
assert.equal(result.nativeTikTok.status,'needs_developer_app','no developer app must be transparent');
const err=await nativeTikTokRoute(new Request('https://morrowwish.vercel.app/api/tiktok/status'),
 {DB:{}},async()=>false,(o,s)=>new Response(JSON.stringify(o),{status:s}));
assert.equal(err.status,401,'authenticated settings route not public');
console.log('TikTok Display API: seven canonical games, exact ID overlay, missing metrics, OAuth configuration and auth guards validated.');
