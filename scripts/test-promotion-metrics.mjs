import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const snap=JSON.parse(fs.readFileSync('promotion/social-metrics-snapshot.json','utf8'));
const posts=snap.metricScope.verifiedPosts;
const slugs=['cat-bond','pawsibly-innocent','tiny-town','elsewhere','flip-dash','parcel-panic','pocket-aquarium'];
const minimumCounts={youtube:7,instagram:7,tiktok:7};
assert.ok(posts.length>=16,'new campaign verification baseline must not be lost');
for(const [platform,minCount] of Object.entries(minimumCounts)){
 const all=posts.filter(p=>p.platform===platform);
 assert.ok(all.length>=minCount,platform+' known posts must not disappear silently');
 const row=snap.platforms.find(p=>p.id===platform);
 const accountCount=platform==='tiktok'&&row.publicationEvidence?.source==='vidIQ-public-profile'
   ?row.publicationEvidence.videoCount:all.length;
 assert.equal(row.published,Math.max(accountCount,all.length),platform+' published count reconciled');
 const complete=all.length===row.published&&all.length>0&&all.every(p=>p.views!=null);
 assert.equal(row.views,complete?all.reduce((n,p)=>n+p.views,0):null,platform+' verified views reconcile');
}
assert.equal(new Set(posts.map(p=>p.url)).size,posts.length,'no duplicates');
for(const post of posts){
 assert.ok(slugs.includes(post.game),'unknown slug');
 assert.equal(post.approved,true);
 assert.equal(post.publicVerified,true);
 assert.ok(post.publishedAt>='2026-11-21');
 assert.ok(post.views==null||(Number.isSafeInteger(post.views)&&post.views>=0),'native views are nonnegative or unreported');
}
assert.ok(posts.some(p=>p.platform==='tiktok'&&p.game==='pawsibly-innocent')&&posts.some(p=>p.platform==='tiktok'&&p.game==='elsewhere'),'TikTok original publication baseline preserved');
const tk=snap.platforms.find(x=>x.id==='tiktok');
assert.equal(tk.published,7,'all 7 TikTok videos published');
assert.equal(tk.publicationEvidence.videoCount,7,'publication count has source evidence');
assert.equal(posts.filter(p=>p.platform==='tiktok').length,7,'all seven public videos have per-video figures');
assert.equal(tk.views,94,'seven individually verified TikTok videos sum to 94 plays');
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
console.log('Direct connected-platform snapshot reconciled dynamically; initial publication coverage preserved and historical video views excluded.');
