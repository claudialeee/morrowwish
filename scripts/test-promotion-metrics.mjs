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
 'cat-bond':['2hd2LMg9iJY',null],
 'pawsibly-innocent':['JUQ8PsYCFG8',39],
 'tiny-town':['64Uh0S9dqmQ',1],
 'elsewhere':['n8bbePy8Unw',3],
 'flip-dash':['cC7akb-kUIo',219],
 'parcel-panic':['dHD2UnbmSqU',null],
 'pocket-aquarium':['O3tMbulVPvk',36]
};
assert.equal(yt.views,null,'deleted Cat Bond YouTube counts must not be reused');
assert.equal(ytPosts.length,7,'seven current Shorts only');
for(const [game,[id,views]] of Object.entries(ytExpected)){
 const p=ytPosts.find(x=>x.game===game);
 assert.ok(p?.url.endsWith('/'+id),'expected current approved YouTube Short ID for '+game);
 assert.equal(p.views,views,'owner-verified play count for '+game);
 assert.equal(p.dataSource,['cat-bond','parcel-panic'].includes(game)?null:'vidiq-youtube-owner-uploads-2026-11-22');
}
const tk=snap.platforms.find(x=>x.id==='tiktok');
assert.equal(tk.published,7,'all 7 TikTok videos published');
assert.equal(tk.publicationEvidence.videoCount,7,'publication count has source evidence');
assert.equal(posts.filter(p=>p.platform==='tiktok').length,7,'all seven public videos have per-video figures');
assert.equal(tk.views,null,'deleted Cat Bond TikTok counts must not be reused');
const ig=snap.platforms.find(x=>x.id==='instagram');
assert.equal(ig.published,7,'seven current Instagram Reels');
assert.equal(ig.views,null,'deleted Cat Bond Instagram views must not be reused');
assert.equal(ig.likes,null,'deleted Cat Bond Instagram likes must not be reused');
const igExpected={
 'cat-bond':['DgEGgecOxst',null],
 'pawsibly-innocent':['DgDfM-DBb1K',11],
 'tiny-town':['DgDfO6ztxnM',3],
 'elsewhere':['DgDfQqkT6Gx',1],
 'flip-dash':['DgDfUwbB4EP',254],
 'parcel-panic':['DgEOAAcJ74v',null],
 'pocket-aquarium':['DgDfRT3O7EK',43]
};
for(const [game,[shortcode,views]] of Object.entries(igExpected)){
 const post=posts.find(p=>p.platform==='instagram'&&p.game===game);
 assert.ok(post?.url.includes(shortcode),'canonical current Reel for '+game);
 assert.equal(post.views,views,'Instagram nonzero native views for '+game);
}
assert.equal(snap.accountOverview,undefined,'historical promo summaries must never ship');
assert.equal(snap.metricScope.campaignStart,'2026-11-22','approved campaign begins Nov 22');
assert.ok(posts.every(p=>p.publishedAt==='2026-11-22'),'only this launch campaign is tracked');
assert.ok(JSON.stringify(snap).indexOf('instagram-historical')<0,'legacy posts absent from snapshot');
const dashboard=fs.readFileSync('public/studio-insights/index.html','utf8');
assert.ok(dashboard.includes('id="video-detail-rows"'),'per-game detail table present');
assert.ok(dashboard.includes("post.checkedAt&&Number.isSafeInteger(post[key])"),'unknown views blank, not zero');
assert.ok(dashboard.includes('igNativePosts.length'), 'partial Instagram provider totals must show verified coverage');
assert.ok(dashboard.includes("p.checkedAt&&"), 'partial Instagram totals must exclude missing native readings');
assert.ok(dashboard.includes("verifiedVideos.find(p=>p.platform===platform&&p.game===id)"),'individual game/medium cells');
assert.ok(!dashboard.includes('id="native-account-overview"'),'old and duplicate promo overview hidden permanently');
assert.ok(!dashboard.includes('instagram-historical')&&!dashboard.includes('Nov 20 old Reels'),'no historical promo presentation');
assert.ok(!dashboard.includes('pulse.accountOverview'),'old promo metrics never read by dashboard');
const liveChannels=['itch','youtube','tiktok','instagram','bluesky'];
assert.deepEqual(snap.platforms.map(x=>x.id),liveChannels,'do not include unlaunched promo channels in snapshot');
assert.ok(dashboard.includes("const fallbackIds=['youtube','tiktok','instagram','bluesky','itch'];"),'only live sources rendered and itch.io ordered last');
assert.ok(dashboard.includes('.sort((a,b)=>fallbackIds.indexOf(a.id)-fallbackIds.indexOf(b.id))'), 'reported channel rows must honor requested order');
assert.ok(dashboard.includes("itch:['itch','itch.io','itchio','itch.zone']"),'Cat Bond itch.io old UTM alias cannot disappear');
for(const name of ['crazygames','kongregate','search'])assert.ok(!snap.platforms.some(p=>p.id===name),'future channel not stored: '+name);
for(const keyword of ['id="future-channels"','id="future-channel-list"','channelFuture:', 'Poki:', 'GamePix:', 'GameDistribution:', 'tiktok-native-status', 'nativeTikTokNeedsApp:', 'Connect TikTok account'])assert.ok(!dashboard.includes(keyword),'future work must not appear in dashboard: '+keyword);
const inline=dashboard.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i)?.[1];
assert.doesNotThrow(()=>new vm.Script(inline),'dashboard script parses');
console.log('Direct connected-platform snapshot reconciled dynamically; initial publication coverage preserved and historical video views excluded.');


const release=JSON.parse(fs.readFileSync('public/promo/social-release-status.json','utf8'));
const cat=release.games.find(x=>x.slug==='cat-bond');
const newIds={youtube:'2hd2LMg9iJY',tiktok:'7711158345406680334',instagram:'DgEGgecOxst',bluesky:'3n2wzprxlt63l'};
for(const [platform,id] of Object.entries(newIds)){
  const post=posts.find(x=>x.platform===platform&&x.game==='cat-bond');
  assert.ok(post?.url.includes(id),'new Cat Bond video allowlist missing: '+platform);
  assert.equal(post.url,cat.socialUrls[platform]);
  assert.equal(post.views,null,'V13 cannot inherit deleted V12 plays');
  assert.equal(post.likes,null,'V13 cannot inherit deleted V12 likes');
}
for(const oldId of ['ELv02K9K294','7711071401913896206','DgDdwz6T4Gy','3n2wcn56m33kj']){
  assert.ok(!JSON.stringify(cat).includes(oldId),'deleted Cat Bond link remains');
  assert.ok(!JSON.stringify(posts).includes(oldId),'deleted Cat Bond metrics remain');
}
assert.equal(cat.media,'/promo/cat-bond/trailer-v13-20261122.mp4');

// Parcel Panic: only the two replaced social videos changed; do not reuse deleted-post counts.
const parcel=release.games.find(x=>x.slug==='parcel-panic');
const parcelIds={instagram:'DgEOAAcJ74v',bluesky:'3n2wyfh4x63vg'};
for(const [platform,id] of Object.entries(parcelIds)){
 const current=posts.find(x=>x.platform===platform&&x.game==='parcel-panic');
 assert.ok(current?.url.includes(id),'Parcel Panic current '+platform+' video missing');
 assert.equal(current.url,parcel.socialUrls[platform]);
 assert.equal(current.views,null,'Parcel Panic replacement cannot inherit deleted views');
 assert.equal(current.likes,null,'Parcel Panic replacement cannot inherit deleted likes');
}
for(const old of ['DgDfRCJAF83','3n2wcrdnc2owx']){
 assert.ok(!JSON.stringify(posts).includes(old),'deleted Parcel Panic post retained in metrics');
 assert.ok(!JSON.stringify(parcel.socialUrls).includes(old),'deleted Parcel Panic link retained in release');
}
const igSource=fs.readFileSync('src/instagram-native.js','utf8');
const bskySource=fs.readFileSync('src/bluesky-native.js','utf8');
assert.ok(igSource.includes('"parcel-panic":"DgEOAAcJ74v"')&&!igSource.includes('DgDfRCJAF83'),'Instagram native allowlist must use replacement');
assert.ok(bskySource.includes('"parcel-panic":"3n2wyfh4x63vg"')&&!bskySource.includes('3n2wcrdnc2owx'),'Bluesky native allowlist must use replacement');
assert.ok(igSource.includes('v14-parcel-replacement')&&bskySource.includes('v15-cat-bond-resubmission'),'native caches must rotate after each replacement');
assert.ok(bskySource.includes('"cat-bond":"3n2wzprxlt63l"')&&!bskySource.includes('3n2wu5hqa4gl3'),'Bluesky tracks the newly confirmed Cat Bond V13 repost only');
assert.ok(igSource.includes('morrowwishgames/reel/'),'account-qualified Instagram Reel link must be supported');
console.log('Parcel Panic replacement links and native allowlists verified; old metrics excluded.');
