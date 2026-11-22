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
 assert.equal(post.publishedAt,'2026-11-22','old promo post blocked');
 assert.ok(post.views==null||(Number.isSafeInteger(post.views)&&post.views>=0),'native views are nonnegative or unreported');
}
assert.ok(posts.some(p=>p.platform==='tiktok'&&p.game==='pawsibly-innocent')&&posts.some(p=>p.platform==='tiktok'&&p.game==='elsewhere'),'TikTok original publication baseline preserved');
const yt=snap.platforms.find(x=>x.id==='youtube');
const ytPosts=posts.filter(p=>p.platform==='youtube');
const ytExpected={
 'cat-bond':['ELv02K9K294',11],
 'pawsibly-innocent':['JUQ8PsYCFG8',38],
 'tiny-town':['64Uh0S9dqmQ',1],
 'elsewhere':['n8bbePy8Unw',3],
 'flip-dash':['cC7akb-kUIo',216],
 'parcel-panic':['c1qeZ3tvuLU',16],
 'pocket-aquarium':['O3tMbulVPvk',36]
};
assert.equal(yt.views,321,'seven current owner-confirmed YouTube Shorts sum to 321');
assert.equal(ytPosts.length,7,'seven current Shorts only');
for(const [game,[id,views]] of Object.entries(ytExpected)){
 const p=ytPosts.find(x=>x.game===game);
 assert.ok(p?.url.endsWith('/'+id),'expected current approved YouTube Short ID for '+game);
 assert.equal(p.views,views,'owner-verified play count for '+game);
 assert.equal(p.dataSource,'vidiq-youtube-owner-uploads-2026-11-22');
}
const tk=snap.platforms.find(x=>x.id==='tiktok');
assert.equal(tk.published,7,'all 7 TikTok videos published');
assert.equal(tk.publicationEvidence.videoCount,7,'publication count has source evidence');
assert.equal(posts.filter(p=>p.platform==='tiktok').length,7,'all seven public videos have per-video figures');
assert.equal(tk.views,94,'seven individually verified TikTok videos sum to 94 plays');
const ig=snap.platforms.find(x=>x.id==='instagram');
assert.equal(ig.published,7,'seven current Instagram Reels');
assert.equal(ig.views,305,'Instagram owner Insights seven-reel plays');
assert.equal(ig.likes,10,'Instagram owner Insights seven-reel likes');
assert.equal(snap.accountOverview,undefined,'historical promo summaries must never ship');
assert.equal(snap.metricScope.campaignStart,'2026-11-22','approved campaign begins Nov 22');
assert.ok(posts.every(p=>p.publishedAt==='2026-11-22'),'only this launch campaign is tracked');
assert.ok(JSON.stringify(snap).indexOf('instagram-historical')<0,'legacy posts absent from snapshot');
const dashboard=fs.readFileSync('public/studio-insights/index.html','utf8');
assert.ok(dashboard.includes('id="video-detail-rows"'),'per-game detail table present');
assert.ok(dashboard.includes("if(!items.length||items.some(p=>p.views==null"),'unknown views blank, not zero');
assert.ok(dashboard.includes("verifiedVideos.filter(p=>p.platform===platform&&p.game===id)"),'individual game/medium cells');
assert.ok(!dashboard.includes('id="native-account-overview"'),'old and duplicate promo overview hidden permanently');
assert.ok(!dashboard.includes('instagram-historical')&&!dashboard.includes('Nov 20 old Reels'),'no historical promo presentation');
assert.ok(!dashboard.includes('pulse.accountOverview'),'old promo metrics never read by dashboard');
const inline=dashboard.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i)?.[1];
assert.doesNotThrow(()=>new vm.Script(inline),'dashboard script parses');
console.log('Direct connected-platform snapshot reconciled dynamically; initial publication coverage preserved and historical video views excluded.');
