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
 'cat-bond':'JoDtL_gIk4M',
 'pawsibly-innocent':'-Xkue1ZSG8Y',
 'tiny-town':'z_TnR8X7hjk',
 'elsewhere':'6_Q1t7AmdnM',
 'flip-dash':'w8K468QRebU',
 'parcel-panic':'iytuR8G7UjQ',
 'pocket-aquarium':'vMeqdhGaPf4'
};
assert.equal(yt.views,null,'new Shorts must not inherit historical views');
assert.equal(ytPosts.length,7,'exactly seven new Shorts');
for(const [game,id] of Object.entries(ytExpected)){
 const p=ytPosts.find(x=>x.game===game);
 assert.ok(p?.url.endsWith('/'+id),'expected current approved YouTube Short ID for '+game);
 assert.equal(p.views,null,'new Short cannot inherit historical views for '+game);
 assert.equal(p.likes,null,'new Short cannot inherit historical likes for '+game);
 assert.equal(p.dataSource,null,'new Short waits for native API refresh');
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
 'cat-bond':'DgEawn_x8GT',
 'pawsibly-innocent':'DgEaP0UxXKj',
 'tiny-town':'DgEZpBfNovK',
 'elsewhere':'DgEZCmQywBy',
 'flip-dash':'DgEYd0Xh93-',
 'parcel-panic':'DgEX5QUzyj3',
 'pocket-aquarium':'DgEXVLtCNH-'
};
for(const [game,shortcode] of Object.entries(igExpected)){
 const post=posts.find(p=>p.platform==='instagram'&&p.game===game);
 assert.ok(post?.url.includes(shortcode),'canonical V14 Reel for '+game);
 assert.equal(post.views,null,'new Instagram video must not inherit previous views');
 assert.equal(post.likes,null,'new Instagram video must not inherit previous likes');
}
assert.equal(snap.accountOverview,undefined,'historical promo summaries must never ship');
assert.equal(snap.metricScope.campaignStart,'2026-11-22','approved campaign begins Nov 22');
assert.ok(posts.every(p=>p.publishedAt==='2026-11-22'),'only this launch campaign is tracked');
const rounds=snap.publicationRounds?.rounds||[];
assert.equal(rounds.length,2,'both Nov 22 publication rounds must be preserved');
const firstRound=rounds.find(x=>x.id==='morning-first');
const activeRound=rounds.find(x=>x.id==='evening-repost');
assert.equal(firstRound?.status,'deleted','morning round must be marked deleted');
assert.equal(firstRound?.posts.length,28,'all 28 deleted first-round posts must remain archived');
assert.deepEqual([
 firstRound.platforms.youtube.views,firstRound.platforms.instagram.views,
 firstRound.platforms.tiktok.views,firstRound.platforms.bluesky.likes,
 firstRound.platforms.bluesky.reposts
],[458,363,94,14,14],'first-round last observed native metrics must be preserved');
assert.equal(activeRound?.status,'active','evening repost is the current round');
assert.equal(activeRound?.postsCount,28,'all 28 current reposts are represented');
assert.equal(activeRound.platforms.youtube.views,null,'deleted YouTube views cannot transfer to current posts');
assert.equal(activeRound.platforms.instagram.views,null,'deleted Instagram views cannot transfer to current posts');
assert.equal(activeRound.platforms.tiktok.views,null,'deleted TikTok views cannot transfer to current posts');
assert.deepEqual([
 activeRound.platforms.bluesky.likes,activeRound.platforms.bluesky.reposts,
 activeRound.platforms.bluesky.replies
],[19,16,1],'current Bluesky native engagement snapshot retained');
assert.ok(posts.every(p=>!firstRound.posts.some(old=>old.url===p.url)),
 'deleted first-round URLs must never enter the current native allowlist');
assert.ok(JSON.stringify(snap).indexOf('instagram-historical')<0,'legacy posts absent from snapshot');
const dashboard=fs.readFileSync('public/studio-insights/index.html','utf8');
assert.ok(dashboard.includes('id="video-detail-rows"'),'per-game detail table present');
assert.ok(!dashboard.includes('id="games-total"')&&!dashboard.includes('gamesTrackedTotal')&&!dashboard.includes('gamesTotalNote'),
 'per-game metrics must not render an aggregate row');
assert.ok(dashboard.includes('colVisitStart:"访问开玩率"')&&dashboard.includes('colStartFinish:"开玩结算率"')&&
 dashboard.includes('colVisitFinish:"访问结算率"'),
 'per-game conversion headers must use concise labels without arrows or parentheses');
assert.ok(dashboard.includes("verifiedPlatforms=['youtube','instagram','tiktok','bluesky']")&&dashboard.includes('<th>Bluesky</th>'),
 'Bluesky must be a single column in the same per-game platform table');
assert.ok(!dashboard.includes('id="bluesky-engagement-rows"'),
 'separate Bluesky engagement table must stay removed');
assert.ok(dashboard.includes("platform==='bluesky'?['likes','reposts','replies','quotes']"),
 'Bluesky cells must use interaction counts, never views');
assert.ok(dashboard.includes('id="archived-first-round"')&&dashboard.includes('id="archived-first-round-rows"'),
 'deleted first-round metrics must have their own independent archive frame');
for(const key of ['roundPosts','roundViews','roundLikes','roundComments','roundReposts','roundReplies','roundQuotes','roundCaptured'])
 assert.equal((dashboard.match(new RegExp(key+':"','g'))||[]).length,2,key+' must have zh/en labels');
assert.ok(dashboard.includes('id="archived-first-round-posts"'),
 'all 28 first-round post readings must be inspectable by game and platform');
assert.ok(!dashboard.includes('roundHistoryFirst')&&!dashboard.includes('roundHistorySecond'),
 'the deleted/current comparison table must stay removed');
assert.ok(dashboard.indexOf('metricCard(t("statPv")')<dashboard.indexOf('metricCard(t("statHome")'),
 'homepage views must immediately follow overall pageviews');
const build=fs.readFileSync('scripts/build-pages.mjs','utf8');
assert.ok(build.includes('publicationRounds: metricsSnapshot.publicationRounds'),
 'private dashboard Worker must receive the archived round history');
assert.ok(dashboard.includes("post[timestampKey]&&Number.isSafeInteger(post[key])"),'unknown views blank, not zero');
assert.ok(dashboard.includes('igNativePosts.length'), 'partial Instagram provider totals must show verified coverage');
assert.ok(dashboard.includes("p.checkedAt&&"), 'partial Instagram totals must exclude missing native readings');
assert.ok(dashboard.includes("posts.find(p=>p.platform===platform&&p.game===id)"),'individual game/medium cells');
assert.ok(!dashboard.includes('id="native-account-overview"'),'old and duplicate promo overview hidden permanently');
assert.ok(!dashboard.includes('instagram-historical')&&!dashboard.includes('Nov 20 old Reels'),'no historical promo presentation');
assert.ok(!dashboard.includes('pulse.accountOverview'),'old promo metrics never read by dashboard');
const liveChannels=['itch','youtube','tiktok','instagram','bluesky'];
assert.deepEqual(snap.platforms.map(x=>x.id),liveChannels,'do not include unlaunched promo channels in snapshot');
assert.ok(dashboard.includes("const fallbackIds=['youtube','tiktok','instagram','bluesky','itch'];"),'only live sources rendered and itch.io ordered last');
assert.ok(dashboard.includes("reportedPlatforms.filter(p=>platformIds.has(p.id))"), 'only approved live channels can appear in reported channel rows');
assert.ok(dashboard.includes("platforms.sort((a,b)=>(a.id==='itch')-(b.id==='itch')||fallbackIds.indexOf(a.id)-fallbackIds.indexOf(b.id))"), 'reported channel rows must preserve live-channel order and keep itch.io last');
assert.ok(dashboard.includes("itch:['itch','itch.io','itchio','itch.zone']"),'Cat Bond itch.io old UTM alias cannot disappear');
for(const name of ['crazygames','kongregate','search'])assert.ok(!snap.platforms.some(p=>p.id===name),'future channel not stored: '+name);
for(const keyword of ['id="future-channels"','id="future-channel-list"','channelFuture:', 'Poki:', 'GamePix:', 'GameDistribution:', 'tiktok-native-status', 'nativeTikTokNeedsApp:', 'Connect TikTok account'])assert.ok(!dashboard.includes(keyword),'future work must not appear in dashboard: '+keyword);
const inline=dashboard.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i)?.[1];
assert.doesNotThrow(()=>new vm.Script(inline),'dashboard script parses');
console.log('Direct connected-platform snapshot reconciled dynamically; initial publication coverage preserved and historical video views excluded.');


const release=JSON.parse(fs.readFileSync('public/promo/social-release-status.json','utf8'));
const cat=release.games.find(x=>x.slug==='cat-bond');
const newIds={youtube:'JoDtL_gIk4M',tiktok:'7711203988582010126',instagram:'DgEawn_x8GT',bluesky:'3n2x7ul3ndo2k'};
for(const [platform,id] of Object.entries(newIds)){
 const post=posts.find(x=>x.platform===platform&&x.game==='cat-bond');
 assert.ok(post?.url.includes(id),'latest Cat Bond video allowlist missing: '+platform);
 assert.equal(post.url,cat.socialUrls[platform]);
 assert.equal(post.views,null,'new campaign never inherits older views');
 assert.equal(post.likes,platform==='bluesky'?2:null,'Cat Bond must use new native engagement only');
}
for(const oldId of ['ELv02K9K294','7711071401913896206','DgDdwz6T4Gy','3n2wcn56m33kj']){
  assert.ok(!JSON.stringify(cat).includes(oldId),'deleted Cat Bond link remains');
  assert.ok(!JSON.stringify(posts).includes(oldId),'deleted Cat Bond metrics remain');
}
assert.equal(cat.media,'/promo/cat-bond/trailer-v13-20261122.mp4');

// Parcel Panic: only the latest video URLs may be tracked, with native Bluesky readings.
const parcel=release.games.find(x=>x.slug==='parcel-panic');
const parcelIds={youtube:'iytuR8G7UjQ',instagram:'DgEX5QUzyj3',bluesky:'3n2x6mhxl3t2n',tiktok:'7711197500115406094'};
for(const [platform,id] of Object.entries(parcelIds)){
 const current=posts.find(x=>x.platform===platform&&x.game==='parcel-panic');
 assert.ok(current?.url.includes(id),'Parcel Panic current '+platform+' video missing');
 assert.equal(current.url,parcel.socialUrls[platform]);
 assert.equal(current.views,null,'replacement video never inherits prior views');
 assert.equal(current.likes,platform==='bluesky'?2:null,'only native Bluesky likes may exist');
}
for(const old of ['DgDfRCJAF83','3n2wcrdnc2owx']){
 assert.ok(!JSON.stringify(posts).includes(old),'deleted Parcel Panic post retained in metrics');
 assert.ok(!JSON.stringify(parcel.socialUrls).includes(old),'deleted Parcel Panic link retained in release');
}
const igSource=fs.readFileSync('src/instagram-native.js','utf8');
const bskySource=fs.readFileSync('src/bluesky-native.js','utf8');
const ytSource=fs.readFileSync('src/youtube-native.js','utf8');
const tkSource=fs.readFileSync('src/tiktok-native.js','utf8');
assert.ok(igSource.includes('"parcel-panic":"DgEX5QUzyj3"')&&!igSource.includes('DgEOAAcJ74v'),'Instagram V14 native allowlist');
assert.ok(bskySource.includes('"parcel-panic":"3n2x6mhxl3t2n"')&&!bskySource.includes('3n2wyfh4x63vg'),'Bluesky V14 native allowlist');
assert.ok(ytSource.includes('"cat-bond":"JoDtL_gIk4M"')&&!ytSource.includes('"cat-bond":"2hd2LMg9iJY"'),'YouTube V14 native allowlist');
assert.ok(tkSource.includes('"cat-bond":"7711203988582010126"')&&!tkSource.includes('"cat-bond":"7711158345406680334"'),'TikTok V14 native allowlist');
for(const source of [igSource,bskySource,ytSource,tkSource])assert.ok(source.includes('v14-full-relaunch-28'),'every native cache must rotate for new IDs');
assert.ok(bskySource.includes('"cat-bond":"3n2x7ul3ndo2k"')&&!bskySource.includes('3n2wu5hqa4gl3')&&!bskySource.includes('3n2wzprxlt63l'),'Bluesky latest native Cat Bond V14 excludes deleted precursors');
assert.ok(igSource.includes('morrowwishgames/reel/'),'account-qualified Instagram Reel link remains');
console.log('Parcel Panic replacement links and native allowlists verified; old metrics excluded.');
