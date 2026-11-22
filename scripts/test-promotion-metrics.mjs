import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const snap=JSON.parse(fs.readFileSync('promotion/social-metrics-snapshot.json','utf8'));
const posts=snap.metricScope.verifiedPosts;
const slugs=['cat-bond','pawsibly-innocent','tiny-town','elsewhere','flip-dash','parcel-panic','pocket-aquarium'];
const expected={youtube:{count:7,views:73},instagram:{count:7,views:31},tiktok:{count:2,views:0}};
assert.equal(posts.length,16,'exactly verified current campaign posts, no old reels');
for(const [platform,expect] of Object.entries(expected)){
 const all=posts.filter(p=>p.platform===platform);
 assert.equal(all.length,expect.count,platform+' count');
 assert.equal(all.reduce((n,p)=>n+p.views,0),expect.views,platform+' views');
 const row=snap.platforms.find(p=>p.id===platform);
 assert.equal(row.published,expect.count);
 assert.equal(row.views,expect.views);
}
assert.equal(new Set(posts.map(p=>p.url)).size,posts.length,'no duplicates');
for(const post of posts){
 assert.ok(slugs.includes(post.game),'unknown slug');
 assert.equal(post.approved,true);
 assert.equal(post.publicVerified,true);
 assert.ok(post.publishedAt>='2026-11-21');
 assert.ok(Number.isSafeInteger(post.views)&&post.views>=0,'native views are nonnegative');
}
assert.deepEqual(slugs.filter(x=>posts.some(p=>p.platform==='tiktok'&&p.game===x)),['pawsibly-innocent','elsewhere'],'never fabricate missing TikTok posts');
const historic=snap.accountOverview.platforms.find(x=>x.id==='instagram');
assert.equal(historic.views,273,'old campaign remains separate');
assert.equal(historic.posts.length,6,'old Reels not merged');
assert.ok(posts.every(p=>!historic.posts.some(h=>h.url===p.url)),'historical and current posts disjoint');
const dashboard=fs.readFileSync('public/studio-insights/index.html','utf8');
assert.ok(dashboard.includes('id="video-detail-rows"'),'per-game detail table present');
assert.ok(dashboard.includes("if(!items.length||items.some(p=>p.views==null"),'unknown views blank, not zero');
assert.ok(dashboard.includes("verifiedVideos.filter(p=>p.platform===platform&&p.game===id)"),'individual game/medium cells');
const inline=dashboard.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i)?.[1];
assert.doesNotThrow(()=>new vm.Script(inline),'dashboard script parses');
console.log('Direct connected-platform snapshot: verified 7 YouTube, 7 Instagram, 2 TikTok; no historical contamination or manufactured metrics.');
