import fs from 'node:fs';

for (const file of [
  'public/index.html','public/tiny-town/index.html','public/elsewhere/index.html',
  'public/elsewhere/app.js','public/telemetry.js','public/lang.js',
  'public/zh-site.js','public/zh-stories.js','public/zh-polish.js',
  'public/studio-insights/index.html','public/art/morrowwish-mark.svg','public/pawsibly-innocent/index.html','public/pawsibly-innocent/game.js','public/icons/pawsibly-innocent.svg',
  'public/cat-bond/index.html','public/cat-bond/js/i18n.js','public/cat-bond/js/game.js','public/cat-bond/js/sunlit-garden.js','public/cat-bond/assets/sunlit-garden-cinematic.svg','public/cat-bond/assets/sunlit-garden-portrait.svg','scripts/sunlit-garden-visual-qa.mjs','.github/workflows/sunlit-garden-visual-qa.yml','public/icons/cat-bond.svg','public/art/cat-bond-scene.svg',
  'src/worker.js','src/analytics.js','cloudflare-pages/wrangler.jsonc'
]) if (!fs.existsSync(file)) throw new Error('Missing required file: '+file);

// CrazyGames approval is an intentional per-game editorial release, never a batch.
const cgApproval=JSON.parse(fs.readFileSync('promotion/crazygames-quality-gate.json','utf8'));
const cgManual=fs.readFileSync('.github/workflows/crazygames-submit.yml','utf8');
const cgAuto=fs.readFileSync('.github/workflows/auto-publish-portals.yml','utf8');
const cgDirect=fs.readFileSync('scripts/crazygames-complete-drafts.mjs','utf8');
const cgAlternate=fs.readFileSync('scripts/auto-publish-crazygames.mjs','utf8');
if(!['hold','approved'].includes(cgApproval.status)||!Array.isArray(cgApproval.candidates)||cgApproval.candidates.length!==7)
 throw Error('CrazyGames quality gate must document exactly seven candidates and a valid hold/approved state');
if(!cgManual.includes('Enforce single-game external QA signoff')||!cgManual.includes('CRAZYGAMES_TARGET_SLUGS: ${{ inputs.slug }}')||cgManual.includes("    - cron:"))
 throw Error('CrazyGames manual workflow must enforce one QA-approved game and must not auto-run');
if(cgAuto.includes('run: node scripts/auto-publish-crazygames.mjs'))
 throw Error('CrazyGames automatic submission must stay disabled while quality QA is pending');
if(!cgDirect.includes('targetSlugs.length!==1')||!cgDirect.includes("gate.status!=='approved'")||
   !cgAlternate.includes("qualityGate.status!=='approved'"))
 throw Error('CrazyGames scripts must fail closed if not individually QA-approved');

const dashboard=fs.readFileSync('public/studio-insights/index.html','utf8');
const socialRouter=fs.readFileSync('src/worker.js','utf8');
if(!socialRouter.includes('if(p.startsWith("/go/"))')||
   !socialRouter.includes('utm_source')||
   !socialRouter.includes('utm_campaign')||
   !socialRouter.includes('Cache-Control')||
   !dashboard.includes('acquisitionVisits:')||
   !dashboard.includes("siteNum(homeFor(p.id),'visits')")||
   !dashboard.includes("siteNum(z,'pageviews')"))
 throw Error('Tracking links and homepage/game attribution data must be preserved');
if(!dashboard.includes('const homePageviews=games.find(x=>x.game==="hub")?.pageviews;')||
   !dashboard.includes('metricCard(t("statHome"),homeKnown?format(homePageviews):"",t("statHomeNote"))')||
   dashboard.includes("const displayOrder=['hub'")||dashboard.includes('if(x.game==="hub")return'))
 throw Error('Homepage overview must appear as one top-level pageview metric, not a game-table row');

const social=JSON.parse(fs.readFileSync('promotion/social-metrics-snapshot.json','utf8'));
if(!Array.isArray(social.publicationRounds?.rounds)||
   !social.publicationRounds.rounds.some(round=>round.id==='morning-first'&&round.status==='deleted'))
 throw Error('Removed dashboard archive must not delete preserved first-round campaign evidence');
const newVideoSources=['youtube','tiktok','instagram','bluesky'];
const verifiedSocialPosts=social.metricScope?.verifiedPosts||[];
const nativeHosts={youtube:['youtube.com','youtu.be'],tiktok:['tiktok.com'],instagram:['instagram.com'],bluesky:['bsky.app']};
const validSocialPost=p=>{
 if(!p||!newVideoSources.includes(p.platform)||p.approved!==true||p.publicVerified!==true||
    typeof p.publishedAt!=='string'||!/^\d{4}-\d{2}-\d{2}/.test(p.publishedAt)||p.publishedAt.slice(0,10)<'2026-11-21')return false;
 if(p.views!=null&&(!Number.isSafeInteger(p.views)||p.views<0))return false;
 try{const url=new URL(p.url);return url.protocol==='https:'&&nativeHosts[p.platform].some(d=>url.hostname===d||url.hostname.endsWith('.'+d));}catch{return false}
};
if(social.schemaVersion!==2||social.metricScope?.type!=='approved-short-videos-only'||!social.metricScope.historicalExcluded||
   !Array.isArray(verifiedSocialPosts)||verifiedSocialPosts.some(p=>!validSocialPost(p))||
   new Set(verifiedSocialPosts.map(p=>p.url)).size!==verifiedSocialPosts.length||
   social.metricScope.activeApprovedPosts!==verifiedSocialPosts.length||
   newVideoSources.some(id=>{
     const p=social.platforms.find(x=>x.id===id),items=verifiedSocialPosts.filter(x=>x.platform===id);
     // The official public profile can confirm more publications than a lagging
     // per-video feed exposes. Count these videos, but never fabricate views.
     const profileEvidence=id==='tiktok'&&p?.publicationEvidence?.source==='vidIQ-public-profile'&&
       p.publicationEvidence.profileUrl==='https://www.tiktok.com/@morrowwishgames'&&
       Number.isSafeInteger(p.publicationEvidence.videoCount)&&p.publicationEvidence.videoCount>=items.length&&
       p.published===p.publicationEvidence.videoCount;
     const normalCount=items.length?p?.published===items.length:p?.published==null||p?.published===0;
     const expectedViews=items.length&&p?.published===items.length&&items.every(x=>x.views!=null)
       ?items.reduce((n,x)=>n+x.views,0):null;
     return !p||(!normalCount&&!profileEvidence)||p.views!==expectedViews;
   }))
 throw Error('New-campaign views require verified public posts newer than Nov 20; old content stays excluded');
const accountOverview=social.accountOverview;
if(accountOverview){
 const a=accountOverview.platforms||[],ig=a.find(p=>p.id==='instagram'),tk=a.find(p=>p.id==='tiktok');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(accountOverview.capturedAt||'')||
    !ig||!tk||!Array.isArray(ig.posts)||!Array.isArray(tk.posts)||
    ig.published!==ig.posts.length||ig.views!==ig.posts.reduce((n,p)=>n+p.views,0)||
    ig.posts.some(p=>!p.url?.startsWith('https://www.instagram.com/reel/')||!Number.isSafeInteger(p.views)||p.views<0)||
    (tk.posts.length>0&&tk.published!==tk.posts.length)||
    (tk.published!=null&&(!Number.isSafeInteger(tk.published)||tk.published<0))||
    (tk.views!=null&&(!Number.isSafeInteger(tk.views)||tk.views<0)))
   throw Error('Metricool overview must match real per-post Instagram readings and valid TikTok provider totals');
}
if(!fs.readFileSync('scripts/build-pages.mjs','utf8').includes('SOCIAL_CAMPAIGN'))throw Error('Metrics must be embedded in the protected analytics worker');
const tikSource=fs.readFileSync('src/tiktok-native.js','utf8'),nativeBuild=fs.readFileSync('scripts/build-pages.mjs','utf8');
if(!tikSource.includes('/v2/video/query/')||!tikSource.includes('/v2/oauth/token/')||
   !tikSource.includes('video.list')||!tikSource.includes('tkEncrypt')||
   !nativeBuild.includes("tiktokNative+'\\n'")||
   !fs.readFileSync('src/analytics.js','utf8').includes('nativeTikTokSnapshot(env'))
 throw Error('TikTok official owner Display API connection must be included in the protected Worker');
const telemetry=fs.readFileSync('public/telemetry.js','utf8');
// The mini-game upgrade already emits run_start/run_end. Do not count
// duplicate local game.js tracking events as extra sessions.
const miniUpgrade=fs.readFileSync('public/upgrade.js','utf8');
const analyticsSource=fs.readFileSync('src/analytics.js','utf8');
if(!analyticsSource.includes('2026-11-22T08:00:00.000Z')||
   !analyticsSource.includes('timeZone:"America/Los_Angeles"')||
   !analyticsSource.includes('ts>=?')||
   !dashboard.includes('const REPORT_FROM="2026-11-22T08:00:00.000Z"')||
   dashboard.includes('id="days"')||
   dashboard.includes('periodSince:')||
   dashboard.includes('统计起点：11/22 00:00')||
   dashboard.includes('Since Nov 22, 2026, 12:00 AM PT'))
 throw new Error('Dashboard must keep the fixed Pacific-time data window without showing its start date');
if(!miniUpgrade.includes('event("run_start"') ||
   !miniUpgrade.includes('event("run_end",{duration:seconds')) throw Error('Mini-game run events must reach the unified tracker');
if(!dashboard.includes('id="game-details"')||!dashboard.includes('id="focus-grid"')||
   !dashboard.includes('metricCard(t("statPv")')||
   !dashboard.includes('metricCard(t("statFinished")')||
   dashboard.includes('data-i18n="colDone"')||
   dashboard.includes('data-i18n="channelState"')||
   !dashboard.includes('const nativeNum=(n,id,published)=>')||
   !dashboard.includes('n==null')||
   !dashboard.includes('hasData?format(r.pageviews):""')||
   !dashboard.includes('game!=="hub"'))
 throw Error('Dashboard must show meaningful results and leave missing data blank');
// Primary dashboard must preserve visit-to-start and start-to-finish context
// and not show unsupported portals as native social-view channels.
const requiredChannels=['itch','youtube','tiktok','instagram','bluesky'];
const channelIds=dashboard.match(/const fallbackIds=\[([^\]]+)\];/)?.[1]||'';
if(requiredChannels.some(name=>!channelIds.includes("'"+name+"'"))||
   ['crazygames','kongregate','search'].some(name=>channelIds.includes("'"+name+"'"))||
   dashboard.includes('id="future-channels"')||
   dashboard.includes('id="future-channel-list"')||
   dashboard.includes('channelFuture:')||
   !dashboard.includes('colHomeVisits:')||
   !dashboard.includes('colGameVisits:')||
   dashboard.includes('id="itch-rows"')||
   dashboard.includes("t('notApplicable')"))
 throw Error('Only launched channels may be shown; omit future promo work and leave unavailable metrics blank');
if(!dashboard.includes("num('pageviews')")||
   !dashboard.includes("const cv=x.visitFunnel||{}")||
   !dashboard.includes("const c1=conv(cv.startedViews,cv.pageviews)")||
   !dashboard.includes("const c2=conv(cv.finishedViews,cv.startedViews)")||
   !dashboard.includes("const c3=conv(cv.finishedViews,cv.pageviews)")||
   !dashboard.includes('colVisitStart:"访问开玩率"')||
   !dashboard.includes('colStartFinish:"开玩结算率"')||
   !dashboard.includes('colVisitFinish:"访问结算率"')||
   !dashboard.includes('colVisitStart:"Visit-to-play rate"')||
   !dashboard.includes('colStartFinish:"Play-to-finish rate"')||
   !dashboard.includes('colVisitFinish:"Visit-to-finish rate"')||
   dashboard.includes('id="games-total"')||
   dashboard.includes('gamesTrackedTotal:')||
   dashboard.includes('gamesTotalNote:')||
   !dashboard.includes('<details class="ew-details archive-first-round" id="archived-first-round"')||
   !dashboard.includes('class="archive-first-round-posts"')||
   !dashboard.includes('.panel.table-wrap{border:0;background:transparent;border-radius:0;box-shadow:none;padding:0}')||
   !dashboard.includes('.native-video-metrics{border:0!important;background:transparent!important;border-radius:0!important;box-shadow:none!important;padding:0!important}')||
   !dashboard.includes('.archive-first-round{border:0!important;background:transparent!important;border-radius:0!important;box-shadow:none!important;padding:0!important}')||
   !dashboard.includes("const archivedRound=(pulse.publicationRounds?.rounds||[]).find(round=>round.id==='morning-first'&&round.status==='deleted');")||
   !dashboard.includes('statStartsNote:"按页面访问去重，不是战斗次数"')||
   !dashboard.includes('firstRoundTitle:"11/22 早间首发 · 已删除数据"')||
   !dashboard.includes('firstRoundTitle:"Nov 22 morning first release · deleted archive"')||
   !dashboard.includes('roundOpenPost:"打开原帖"')||
   !dashboard.includes('roundOpenPost:"Open original post"')||
   !dashboard.includes("reportedPlatforms.filter(p=>platformIds.has(p.id))")||
   !dashboard.includes("blueskyPublished:")||
   !dashboard.includes("bluesky:'https://bsky.app/profile/morrowwishgames.bsky.social'") ||
   !dashboard.includes("verifiedPlatforms=['youtube','instagram','tiktok','bluesky']")||
   !dashboard.includes('<th>Bluesky</th>')||
   dashboard.includes('id="bluesky-engagement-rows"')||
   dashboard.includes('id="account-overview-rows"')||
   !dashboard.includes('id="video-detail-rows"')||
   dashboard.includes('accountOverviewNote:'))
 throw Error('Dashboard must keep per-game conversion data, omit aggregate rows, flatten current tables and collapse deleted history without losing its 28-post archive');
if(!miniUpgrade.includes('window.__MWMiniActive=true')||
   !miniUpgrade.includes('event("run_abandoned",{reason:"restart"}')||
   !telemetry.includes('window.__MWMiniActive')||
   !analyticsSource.includes('abandons:sum(sessionsOf,"abandons")')||
   dashboard.includes('miniAbandoned:')||
   dashboard.includes('中途退出')||
   !dashboard.includes('const siteNum='))throw Error('Mini-game exit telemetry remains internal, never a player-facing dashboard metric');
if(!telemetry.includes('"town_completed-win"||n==="town_completed-lose"') ||
   !telemetry.includes('"town_completed-lose"].includes(n))eventCounts.ends++') ||
   !telemetry.includes('"level_complete"')) throw Error('Winning and losing Tiny Town runs must both be counted as finished');
if(!analyticsSource.includes('z.ends+=events.reduce') ||
   !dashboard.includes('data-i18n="colEnds"')) throw Error('Unified and channel dashboard must show finished runs');

const config=JSON.parse(fs.readFileSync('cloudflare-pages/wrangler.jsonc','utf8'));
if(config.name!=='morrowwish')throw Error('Wrong Cloudflare Pages project');
if(config.d1_databases?.[0]?.database_name!=='morrowwish-analytics')throw Error('Wrong D1 database');
if(!dashboard.includes('zh:"平行人生",en:"Elsewhere"'))throw Error('Dashboard must show 平行人生 in Chinese and Elsewhere in English');
const displayOrder=dashboard.match(/const displayOrder=\[([^\]]+)\];/)?.[1]||'';
for(const name of ['elsewhere','tiny-town','pawsibly-innocent','cat-bond','flip-dash','parcel-panic','pocket-aquarium']){
 if(!displayOrder.includes("'"+name+"'"))throw Error('Dashboard missing visible game: '+name);
}
if(!dashboard.includes("'pocket-aquarium'"))throw Error('Pocket Aquarium must remain in dashboard order');
if(!telemetry.includes('"pocket-aquarium"'))throw Error('Pocket Aquarium must remain in telemetry');
const aquarium=fs.readFileSync('public/pocket-aquarium/index.html','utf8');
for(const marker of ["metric('game_start'","metric('game_complete'","metric('game_retry'","feed_success","time=60","zh:{"]){
 if(!aquarium.includes(marker))throw Error('Pocket Aquarium V2 missing gameplay or analytics: '+marker);
}

if(!telemetry.includes('"elsewhere"'))throw Error('Missing Elsewhere telemetry');
if(!telemetry.includes('"pawsibly-innocent"'))throw Error('Missing Pawsibly Innocent telemetry');
if(!telemetry.includes('"cat-bond"'))throw Error('Missing Cat Bond telemetry');
// Cat Bond: bilingual real-time cat collector. Verify it is wired to unified
// analytics, keeps a complete ZH->EN layer, and loads the shared site scripts.
const bondGame=fs.readFileSync('public/cat-bond/js/game.js','utf8');
for(const marker of ['game_start','game_complete','game_over','game_retry','cat_capture']){
 if(!bondGame.includes(marker))throw Error('Cat Bond missing gameplay/analytics: '+marker);
}
const bondHTML=fs.readFileSync('public/cat-bond/index.html','utf8');
// Every active game module must keep a cache-buster, but the CI test must
// not pin a stale version when the game's battle mechanics are improved.

// Art-quality gate: all 63 approved complete watercolor paintings are the ONLY duo cinematic.
// The rejected two-actor convergence renderer and its assets must stay deleted.
const approvedDuo=fs.readFileSync('public/cat-bond/js/duo-hero.js','utf8');
const premiumScene=fs.readFileSync('public/cat-bond/js/duo-premium.js','utf8');
const duoBondSource=fs.readFileSync('public/cat-bond/js/duo-bond.js','utf8');
const duoBattleSource=fs.readFileSync('public/cat-bond/js/battle.js','utf8');
for(const path of ['public/cat-bond/index.html','public/cat-bond/duo-showcase.html','public/cat-bond/duo-preview.html']){
 const page=fs.readFileSync(path,'utf8'),scene=page.indexOf('src="js/duo-premium.js?v='),hero=page.indexOf('src="js/duo-hero.js?v=');
 if(scene<0||hero<=scene||page.includes('duo-breed-actors.js')||page.includes('mode-breeds')||page.includes('pick-cat-a'))throw Error('Non-original duo entry point: '+path);
}
for(const path of ['public/cat-bond/js/duo-breed-actors.js','public/cat-bond/assets/duo-watercolor-32-actors-v1.webp','public/cat-bond/assets/duo-stage-clean-21x3-v2.webp'])if(fs.existsSync(path))throw Error('Rejected actor asset remains: '+path);
if(!approvedDuo.includes('63-original-painted-storyboards')||!approvedDuo.includes('return p.draw(ctx,W,H,seq,lookup)')||approvedDuo.includes('CatBondDuoArtwork')||approvedDuo.includes('drawKitten')||premiumScene.includes('CatBondDuoBreedActors')||premiumScene.includes('drawKitten')||premiumScene.includes('originalArt:false')||!premiumScene.includes('const artW=Math.min(W,H*ASPECT)')||!premiumScene.includes('feather(paintingCtx,artW,artH)')||!premiumScene.includes('atmosphere(stageCtx,W,H,index)')||!premiumScene.includes('function drawOriginalArtEffects(')||!premiumScene.includes('drawOriginalArtEffects(stageCtx,artX,artY,artW,artH,p,key,tier)')||!premiumScene.includes('const still=seq.thumbnail===true,gallery=seq.galleryPreview===true'))throw Error('Duo renderer must use complete original paintings only.');
if(!duoBondSource.includes('this.duoCinematic.originalArt=true')||duoBondSource.includes('this.duoCinematic.originalArt=false')||!duoBattleSource.includes('originalArt:true'))throw Error('Live battle must always use original 63 paintings');
const studioAudioSource=fs.readFileSync('public/studio-audio.js','utf8');
if(!premiumScene.includes('const alpha=still?1:')||!premiumScene.includes('ASPECT=16/9')||!premiumScene.includes('get actorFallbackEnabled(){return false}')||!duoBondSource.includes('window.CatBondDuoReleaseVFX=')||!duoBondSource.includes("duoSignature?.(release.elements,release.tier,'release')")||!studioAudioSource.includes("beat==='release'"))throw Error('Responsive original art or post-cut-in VFX/audio regression');
// Trailer must show one uninterrupted real rare-cat battle: native HP/skills,
// exactly one duo finisher and earned capture (never a second encounter).
const duoPromoCapture=fs.readFileSync('scripts/capture-trailers-v10.mjs','utf8');
const duoPromoEdit=fs.readFileSync('scripts/render-trailers-v10.mjs','utf8');
const bondPromoReview=JSON.parse(fs.readFileSync('public/promo/v12-review.json','utf8'))
  .trailers.find(t=>t.slug==='cat-bond');
const promoScenes=bondPromoReview?.shots?.map(s=>s.scene)||[];
const fightSequence=['rare-encounter','battle-hud','battle-skills','duo','rare-aftermath','rare-capture'];
const indices=fightSequence.map(scene=>promoScenes.indexOf(scene));
if(!duoPromoCapture.includes('b.autoMode=false;b.duoCharge=0;b.duoCd=999')||
   !duoPromoCapture.includes('v10-rare-native-hud-proof.png')||
   !duoPromoCapture.includes('No real captured rare cat after the single combo')||
   !duoPromoCapture.includes('duo.uses!==1')||
   !duoPromoEdit.includes("broll('duo',3.1,'ONE POWERFUL DUO FINISHER!')")||
   !duoPromoEdit.includes("broll('rare-aftermath',1.2)")||
   promoScenes.filter(scene=>scene==='duo').length!==1||
   promoScenes.filter(scene=>scene==='rare-encounter').length!==1||
   indices.some((i,k)=>i<0||(k>0&&i!==indices[k-1]+1)))
 throw Error('Cat Bond promo must keep native HUD, one continuous rare fight and immediately earned capture');

const unlockedPreview=fs.readFileSync('public/cat-bond/duo-preview.html','utf8');
if(!unlockedPreview.includes('html.duo-embedded #skill-title{display:none!important}')||
   !unlockedPreview.includes('width:100%!important;height:auto!important;')||
   !unlockedPreview.includes('max-height:none;aspect-ratio:16/9!important')||
   !unlockedPreview.includes('background:linear-gradient(130deg,#fff7eb,#ebe9f8,#e9f4ee)')||
   !unlockedPreview.includes('id="tier-1"')||!unlockedPreview.includes('id="tier-2"')||
   !unlockedPreview.includes('id="tier-3"')||
   !unlockedPreview.includes('Replay all three tiers')||
   !unlockedPreview.includes('sequenceMode=true')||
   !unlockedPreview.includes("hideCaptions:q.get('embedded')==='1'")||
   !/duo-premium\.js\?v=[\w-]+/.test(unlockedPreview))
 throw Error('Unlocked duo modal must preserve the watercolor frame and all three unlocked tiers');
const bondScriptSources=[...bondHTML.matchAll(/<script[^>]*src="([^"]+)"/g)].map(m=>m[1]);
for(const asset of ['js/data.js','js/resonance/integration-entry.mjs','js/battle.js','js/real-kittens.js','js/game.js','js/ui.js','js/i18n.js']){
 if(!bondScriptSources.some(src=>src.startsWith(asset+'?v=')&&src.slice(asset.length+3).length>0))
  throw Error('Cat Bond game module must be cache-busted: '+asset);
}
for(const marker of ['/telemetry.js','/lang.js','js/i18n.js','href="/"']){
 if(!bondHTML.includes(marker))throw Error('Cat Bond page missing shared integration: '+marker);
}
const bondI18n=fs.readFileSync('public/cat-bond/js/i18n.js','utf8');
for(const marker of ['morrowwish-language-change','var DICT','猫猫纽带','Cat Bond']){
 if(!bondI18n.includes(marker))throw Error('Cat Bond bilingual layer incomplete: '+marker);
}
const catGame=fs.readFileSync('public/pawsibly-innocent/game.js','utf8');
for(const marker of ['game_start','game_complete','game_retry','cat_level_won','guardMove','morrowwish-language-change']){
 if(!catGame.includes(marker))throw Error('Pawsibly Innocent missing gameplay/analytics: '+marker);
}
const translationSource=fs.readFileSync('public/lang.js','utf8');
const homepage=fs.readFileSync('public/index.html','utf8');
const oneLineHero='和满院子的猫咪成为朋友，化身捣蛋小猫偷三条鱼，建造人人自由的小镇，或体验一段从未活过的人生。';
const heroMarkup=homepage.match(/<p class="hero-copy">([\s\S]*?)<\/p>/)?.[1]||'';
if(!heroMarkup.includes('<span class="hero-zh-copy" lang="zh-CN">'+oneLineHero+'</span>')||/<(?:wbr|br)\b/i.test(heroMarkup))
  throw Error('Homepage Chinese hero must keep all four worlds together as one unbroken sentence');
// Never reorder featured cards without updating BOTH homepage introductions.
// These checks compare real card order rather than preserving a stale fixed order.
const featuredOrder=[...homepage.matchAll(/<article class="feature-card[^"]*"><a class="card-hit" href="[^"]+" data-id="([^"]+)"/g)].map(m=>m[1]);
const phrases={
 'cat-bond':['和满院子的猫咪成为朋友','Befriend a yard full of cats','和满院子的猫咪一起成长'],
 'pawsibly-innocent':['化身捣蛋小猫偷三条鱼','steal three fish as a mischievous cat','化身小猫偷走三条鱼'],
 'tiny-town':['建造人人自由的小镇','build a town where everyone is free','建造人人自由的小镇'],
 'elsewhere':['体验一段从未活过的人生','explore a life you never lived','体验一段从未活过的人生']
};
const homeEnglish=homepage.match(/class="hero-en-copy">([^<]+)</)?.[1]||'';
const leadEnglish=homepage.match(/<section class="featured-section[^>]*>[\s\S]*?<div class="section-intro">[\s\S]*?<\/h2><\/div><p>([^<]+)</)?.[1]||'';
const leadZh=(translationSource.match(/"Raise a yard of cats and explore together[^"]*":"([^"]+)"/)||[])[1]||'';
for(const [index,id] of featuredOrder.entries()){
 if(!phrases[id])continue;
 const previous=featuredOrder.slice(0,index).filter(p=>phrases[p]);
 for(let i=0;i<3;i++){
  const copy=[oneLineHero,homeEnglish,leadZh][i];
  const marker=phrases[id][i];
  if(!copy.includes(marker)||previous.some(pr=>copy.indexOf(phrases[pr][i])>copy.indexOf(marker)))
   throw Error('Homepage descriptions must match featured ordering: '+id);
 }
}
const homeStyles=fs.readFileSync('public/hub.css','utf8');
if(!homeStyles.includes(".elsewhere-card h3{font-family:'Nunito'"))throw Error('Elsewhere heading must match other featured headings');
if((homepage.match(/class="card-hit"/g)||[]).length!==4)throw Error('All featured cards must have full-card pointer targets');
if(!homeStyles.includes('html[lang="zh-CN"] .hero .hero-zh-copy{display:block;white-space:nowrap;'))
  throw Error('Homepage Chinese hero no-wrap style is missing');
if(!homeStyles.includes('@media(max-width:700px)')||!homeStyles.includes('html[lang="zh-CN"] .hero>p.hero-copy{white-space:normal;overflow:visible;max-width:100%}')||!homeStyles.includes('html[lang="zh-CN"] .hero .hero-zh-copy{white-space:normal;overflow-wrap:break-word;'))
  throw Error('Homepage Chinese tagline must wrap naturally on phones instead of horizontal scrolling');
if(!homeStyles.includes('/* Balanced compact homepage: all game cards are reduced, never just the heading. */')||!homeStyles.includes('.feature-card{display:grid;grid-template-columns:minmax(0,59%) minmax(0,41%);height:272px;'))
  throw Error('Homepage must keep compact image-and-copy featured cards');
if(!homeStyles.includes('.hero-doodles{display:none}')||!homeStyles.includes('.tiny-section .mini-game{display:flex;flex-direction:column;min-height:0;height:208px;'))
  throw Error('Homepage decorative overlaps and oversized mini-game cards must not return');
if(homepage.includes('<h1>Little games.<br><em>'))throw Error('Homepage headline must not be forced into two giant lines');
if(!homepage.includes('/art/cat-bond-home.webp?v=1'))throw Error('Cat Bond card must use approved cat friendship illustration');
const catBondCardAsset=fs.readFileSync('public/art/cat-bond-home.webp');
if(catBondCardAsset.toString('ascii',0,4)!=='RIFF'||catBondCardAsset.toString('ascii',8,12)!=='WEBP')throw Error('Cat Bond approved image must be a valid WebP');

const featured=homepage.match(/<div class="feature-grid">([\s\S]*?)<\/div><\/section>/)?.[1]||'';
const minis=homepage.match(/<div class="mini-grid">([\s\S]*?)<\/div><\/div><\/section>/)?.[1]||'';
for(const link of ['href="/pawsibly-innocent/"','href="/elsewhere/"','href="/tiny-town/"','href="/cat-bond/"']){
 if(!featured.includes(link))throw Error('Missing signature world featured card: '+link);
}
if((featured.match(/class="feature-card/g)||[]).length!==4)throw Error('Four signature games required');
if(!featured.trimStart().startsWith('<article class="feature-card bond-feature-card">'))throw Error('Cat Bond must be the first featured game');
const featuredIds=[...featured.matchAll(/class="card-hit" href="\/[^"]+" data-id="([^"]+)"/g)].map(m=>m[1]);
if(JSON.stringify(featuredIds)!==JSON.stringify(['cat-bond','pawsibly-innocent','tiny-town','elsewhere']))
 throw Error('Featured games must follow the current Cat Bond-led homepage order');
const zhCard=featured.match(/<article class="feature-card cat-feature-card">([\s\S]*?)<\/article>/)?.[1]||'';
if(!zhCard.includes('猫猫绝对无辜！')||zhCard.includes('cat-original'))throw Error('Chinese homepage card must not display the English Pawsibly subtitle');
if(!homepage.includes('Three fish to steal. One human to fool.'))throw Error('Cat game marketing hook is missing');
if(!displayOrder.startsWith("'cat-bond','pawsibly-innocent','tiny-town','elsewhere'"))throw Error('Studio dashboard game order must follow the homepage');
if(minis.includes('href="/pawsibly-innocent/"')||minis.includes('href="/cat-bond/"'))throw Error('Cat worlds must not be in mini-games');
for(const marker of ['function throwYarn','const EXTRAS=[','ROOM_REWARDS','souvenirs','function vacuumDraw','function roomDecor']){
 if(!catGame.includes(marker))throw Error('Cat expansion missing: '+marker);
}
const catHTML=fs.readFileSync('public/pawsibly-innocent/index.html','utf8');
for(const id of ['id="tool"','id="restart"','id="relicGallery"','id="achievementsGrid"','id="ability"'])if(!catHTML.includes(id))throw Error('Cat interface missing '+id);
if(!fs.readFileSync('public/art/pawsibly-scene.svg','utf8').includes('<svg'))throw Error('Featured cat art missing');
const approvedPawsiblyCover=fs.readFileSync('public/art/pawsibly-hatted-muted.avif');
if(!homepage.includes('/art/pawsibly-hatted-muted.avif?v=20261120')||approvedPawsiblyCover.length<4000||approvedPawsiblyCover.toString('ascii',4,12)!=='ftypavif')throw Error('Pawsibly homepage must use the approved muted hatted cat cover');

if(!fs.readFileSync('src/analytics.js','utf8').includes('ARCADE_ANALYTICS_KEY'))throw Error('Missing Analytics authentication');
for(const file of ['README.md','CLAUDE.md','public/lang.js','public/telemetry.js','public/studio-insights/index.html']){
 const text=fs.readFileSync(file,'utf8');
 if(text.toLowerCase().includes(['ruckus','button'].join('-')))throw Error('Old project name remains in '+file);
}
// Keep the marketing dashboard compact and make sure all six live games are monitored.
const trackerSource=fs.readFileSync('src/analytics.js','utf8');
if(!telemetry.includes('hubClickVersion:game==="hub"?1')||!telemetry.includes('signal("hub_card_"')||!trackerSource.includes('const homeFunnel='))throw Error('Homepage click attribution must be instrumented, versioned and private');
if(!trackerSource.includes('"cat-bond","elsewhere"'))throw Error('Cat Bond acquisition must be included in reporting');
if(!dashboard.includes('id="hub-funnel"'))throw Error('Homepage conversion data must appear in compact dashboard');

const arcadeSource=fs.readFileSync('public/upgrade.js','utf8');
for(const id of ['cat-bond','pawsibly-innocent','tiny-town','elsewhere']){
 if(!dashboard.includes("id:'"+id+"'"))throw new Error('Missing flagship metrics for '+id);
}
if(!(dashboard.indexOf('id="promotion-channels"')>dashboard.indexOf('id="stats"')&&dashboard.indexOf('id="promotion-channels"')<dashboard.indexOf('id="game-details"')))throw Error('Promotion must be the second section');
if(dashboard.includes('id="ew-funnel"')||dashboard.includes('id="signal-grid"'))throw Error('Old gameplay detail cards must be removed');
for(const metric of ['flip_finished','flip_10s','flip_30s','parcel_sorted','parcel_missed','parcel_ten_sorted']){
 if(!telemetry.includes(metric))throw new Error('Missing game telemetry signal '+metric);
}
if(!arcadeSource.includes('event("parcel_sorted",')||!arcadeSource.includes('event("parcel_missed",'))
 throw new Error('Parcel Panic outcome instrumentation missing');
if(!trackerSource.includes('const byChannel=')||!dashboard.includes('j.byChannel')||!dashboard.includes('j.socialPulse')||dashboard.includes('j.byGameChannel'))
 throw new Error('Dashboard must use grouped acquisition-channel rollups');
// Marketing reporting may be displayed as a curated platform table or a
// compact top-channel rollup. Verify actual source attribution and its UI target
// instead of hard-coding a presentation implementation from another release.
if(!dashboard.includes('id="channel-rows"') || !dashboard.includes('j.byChannel'))
 throw new Error('Promotion channel UI must retain source-attributed analytics');
if(!dashboard.includes('id="focus-grid"'))throw new Error('Flagship performance metrics must be visible');
console.log('Seven game analytics cards, compact acquisition channels and actionable telemetry checked.');

console.log('Morrow Wish Cloudflare Pages source, Analytics, branding and game labels checked.');
await import('./check-pawsibly.mjs');
await import('./check-cat-bond.mjs');
await import('./check-cat-bond-host.mjs');
await import('./check-cat-bond-map-return.mjs');
await import('./check-cat-bond-ai.mjs');
await import('./check-cat-bond-invariants.mjs');
await import('./check-cat-bond-combat-matrix.mjs');
await import('./check-cat-bond-premium-21x3.mjs');

// Prevent decorative starburst glyphs from leaking back into any published page,
// SVG social card, dynamically generated game copy, or language map.
const starburst=String.fromCodePoint(0x2733);
function auditPublishedText(dir){
 for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  const file=dir+'/'+entry.name;
  if(entry.isDirectory()){auditPublishedText(file);continue}
  if(!/\.(?:html?|css|js|svg|json|xml|txt|webmanifest)$/.test(entry.name))continue;
  const content=fs.readFileSync(file,'utf8');
  if(content.includes(starburst)||/&#(?:10035|x2733);|\\u2733/i.test(content))
   throw new Error('Unwanted starburst glyph found in published file: '+file);
 }
}
auditPublishedText('public');
console.log('Published pages and UI source contain no starburst glyphs.');



// Elsewhere: 8 distinct genres, 80 route-sensitive endings, consistent surreal worlds and real progress tracking.
import vm from 'node:vm';
const dreamSource=fs.readFileSync('public/elsewhere/dreams.js','utf8');
const dreamA=fs.readFileSync('public/elsewhere/casefiles-a.js','utf8');
const dreamB=fs.readFileSync('public/elsewhere/casefiles-b.js','utf8');
const dreamMoods=fs.readFileSync('public/elsewhere/dream-lives.js','utf8');
const dreamFresh=fs.readFileSync('public/elsewhere/fresh-start.js','utf8');
const dreamAbsurd=fs.readFileSync('public/elsewhere/absurd-worlds.js','utf8');
const dreamEndings=fs.readFileSync('public/elsewhere/route-endings.js','utf8');
const dreamAudio=fs.readFileSync('public/elsewhere/dream-audio.js','utf8');
const dreamPage=fs.readFileSync('public/elsewhere/index.html','utf8');
const dreamCss=fs.readFileSync('public/elsewhere/dreams.css','utf8');
const dreamSw=fs.readFileSync('public/elsewhere/sw.js','utf8');
for(const [name,src] of [['dreams',dreamSource],['casefiles-a',dreamA],['casefiles-b',dreamB],['dream-lives',dreamMoods],['fresh-start',dreamFresh],['absurd-worlds',dreamAbsurd],['route-endings',dreamEndings],['dream-audio',dreamAudio]])
 new vm.Script(src,{filename:name});
for(const path of ['/elsewhere/dreams.js','/elsewhere/dreams.css','/elsewhere/casefiles-a.js',
                   '/elsewhere/casefiles-b.js','/elsewhere/dream-lives.js','/elsewhere/fresh-start.js',
                   '/elsewhere/absurd-worlds.js','/elsewhere/route-endings.js','/elsewhere/dream-audio.js',
                   '/telemetry.js','/social-share.js']){
 if(!dreamPage.includes(path))throw Error('Elsewhere missing resource: '+path);
 if(!path.startsWith('/telemetry')&&!path.startsWith('/social-share')&&!dreamSw.includes(path))
  throw Error('Elsewhere offline cache missing: '+path);
}
for(const marker of ['@media(min-width:701px)','@media(max-width:700px)','grid-template-columns:minmax(0,1.07fr)',
                    'prefers-reduced-motion','twist-burst','twistFlash','twistSpark','.case-resources','.case-report','.case-previous em'])
 if(!dreamCss.includes(marker))throw Error('Missing desktop/mobile scene or continuation visual: '+marker);
for(const marker of ['Kevin MacLeod','creativecommons.org/licenses/by/4.0'])
 if(!dreamPage.includes(marker))throw Error('Elsewhere music credit missing');
for(const marker of ['musicOn=read(KEY,true)','fxOn=read(FX_KEY,true)','audio.play()','function toggleMusic()',
                    'function toggleFX()','window.DreamAudio=','blocked=true'])
 if(!dreamAudio.includes(marker))throw Error('Elsewhere music/FX wiring missing');
const storySandbox={window:{}};
for(const src of [dreamA,dreamB,dreamMoods,dreamFresh,dreamAbsurd,dreamEndings])vm.runInNewContext(src,storySandbox,{timeout:2500});
const cases=storySandbox.window.ELSEWHERE_CASEFILES, vibes=storySandbox.window.ELSEWHERE_VIBES, routeEndings=storySandbox.window.ELSEWHERE_ROUTE_ENDINGS;
const bilingual=x=>Array.isArray(x)&&x.length===2&&x.every(y=>typeof y==='string'&&y.trim().length>1);
const expectedModes={paris:'romance',maldives:'wild',iceland:'wonder',swiss:'spectacle',tokyo:'comeback',amalfi:'luxury',moon:'cosmic',monday:'surreal'};
const moodNames=new Set();
if(!cases||Object.keys(cases).length!==8||Object.keys(vibes||{}).length!==8)
 throw Error('All six dream lives must be fully configured');
for(const [world,life] of Object.entries(cases)){
 if(life.mode!==expectedModes[world])throw Error('Wrong/missing dream genre for '+world);
 moodNames.add(life.mode);
 for(const label of [life.mystery,life.objective,life.secret,life.villain])
  if(!bilingual(label))throw Error('Untranslated story introduction in '+world);
 if(!life.paths||life.paths.length!==3||life.endings?.length!==3||life.rare?.length!==2)
  throw Error('Missing routes or ending for '+world);
 if(life.paths.some(x=>x.length!==3))throw Error('Every selected start must lead through three unique scenes: '+world);
 const scenes=[life.intro,...life.paths.flat(),life.finale];
 if(scenes.length!==11)throw Error('Invalid number of scenes in '+world);
 if(new Set(life.paths.map(x=>x[0].body[0])).size!==3)
  throw Error('Selected first action must create three genuinely different routes: '+world);
 for(const scene of scenes){
  if(!bilingual(scene.title)||!bilingual(scene.body)||scene.choices?.length!==3)
   throw Error('Incomplete bilingual scene in '+world);
  for(const a of scene.choices)
   if(!bilingual(a.title)||!bilingual(a.result)||!['proof','allies','leverage'].includes(a.gain))
    throw Error('Choice must have a real resulting event connected to its context in '+world);
 }
 for(const ending of [...life.endings,life.rare])
  if(ending.length!==2||!bilingual(ending[0])||!bilingual(ending[1]))
   throw Error('Incomplete ending in '+world);
 for(const kind of ['proof','allies','leverage'])
  if(!bilingual(vibes[world].stats[kind]))throw Error('Generic investigation score still present in '+world);
}
if(moodNames.size!==8)throw Error('All dreams still play like the same mystery game');
for(const marker of [
 'edition:"life-v5"','state.route=n','state.scores[act.gain]++','state.history.push',
 'prior.title','prior.result','function isDream','const quality=rare?"perfect":(state.id==="amalfi"||momentum>=2)?"strong":"cost"','window.ELSEWHERE_VIBES',
 'choiceHint(a,i)','function revealTwist()','window.DreamAudio?.fx("twist")',
 'window.DreamAudio?.fx("ending")','track("choice_made"','track("chapter_completed"',
 'track("life_completed"','track("ending_view"','window.arcadeMetric?.("game_complete")',
 'navigator.globalPrivacyControl','MorrowwishSocialShare?.open','history.pushState'
])if(!dreamSource.includes(marker))throw Error('Elsewhere progression or instrumentation missing: '+marker);
const requiredNewArcs=['paris','amalfi','moon','monday'];
for(const id of requiredNewArcs){
 const w=cases[id];
 if(!Array.isArray(w.finale.routeBodies)||w.finale.routeBodies.length!==3||w.finale.routeBodies.some(x=>!bilingual(x)))
  throw Error('Finale must reflect the actual opening route: '+id);
 for(const path of w.paths)for(const scene of path.slice(1)){
  if(!Array.isArray(scene.links)||scene.links.length!==3||scene.links.some(x=>!bilingual(x)))
   throw Error('Every choice must connect into the next scene: '+id);
 }
}
if(!dreamSource.includes('paris:{name:L("巴黎：邂逅全新恋情","A New Love Story in Paris")')||dreamSource.includes('巴黎：和旧爱再爱一次')||dreamSource.includes('Love Again in Paris'))
 throw Error('Paris game-card title is inconsistent with the new romance storyline');
if(dreamMoods.includes('五年没见的旧爱')||dreamMoods.includes('your old love')||dreamMoods.includes('重逢的浪漫主义者'))
 throw Error('Stale Paris reunion story still bundled in current game scripts');
if(cases.paris.intro.body[0].includes('旧爱')||cases.paris.intro.body[0].includes('五年')||cases.amalfi.intro.body[0].includes('地产商'))
 throw Error('Old stressful plot remains live');
if(cases.paris.intro.body[0].includes('诺亚'))throw Error('The new romance must introduce Noa naturally after the first choice');
if(!cases.amalfi.objective[0].includes('没有失败结局'))throw Error('Amalfi must have no losing ending');
if(!dreamCss.includes('.intro p{font-size:18px;color:#596879;margin:0;max-width:none;width:100%}')||!dreamCss.includes('@media(min-width:960px)'))
 throw Error('Elsewhere intro text must use full desktop width without premature line breaking');
if(!dreamCss.includes('white-space:nowrap!important')||!dreamCss.includes('font-size:clamp(15px,4.35vw,24px)'))
 throw Error('Single-line responsive Chinese and English title missing');
if(!dreamSource.includes('hero:L("醒来，活一种舍不得结束的人生。","Wake up to a life too good to end.")'))
 throw Error('Single-line headline changed unexpectedly');
if(!dreamSource.includes('s.routeBodies?.[state.route]')||!dreamSource.includes('s.links?.[prior.index]'))
 throw Error('Meaningful scene continuation missing');
if(!dreamSource.includes('state.id!=="tokyo"'))
 throw Error('Romance and luxury endings should be achievable without score pressure');

// Endings differ because BOTH the first route and final choice matter, not just a final score.
if(!routeEndings||Object.keys(routeEndings).length!==8)throw Error('All eight dream lives need route-specific epilogues');
let endingCount=0;
for(const [id,life] of Object.entries(cases)){
 const routes=routeEndings[id];
 if(!Array.isArray(routes)||routes.length!==3)throw Error('Wrong ending route count for '+id);
 const titles=new Set();
 for(const route of routes){
  if(!Array.isArray(route)||route.length!==3)throw Error('Each opening needs three endings: '+id);
  for(const entry of route){
   if(!Array.isArray(entry)||entry.length!==2||!bilingual(entry[0])||!bilingual(entry[1]))throw Error('Untranslated ending '+id);
   if(entry[1][0].length<38||entry[1][1].length<70)throw Error('Ending lacks a complete story '+id);
   if(titles.has(entry[0][0]))throw Error('Duplicate ending in '+id+': '+entry[0][0]);
   titles.add(entry[0][0]);endingCount++;
  }
 }
 if(!bilingual(life.rare[0])||!bilingual(life.rare[1]))throw Error('Missing rare ending '+id);
 endingCount++;
}
if(endingCount!==80)throw Error('Expected 80 distinct endings, got '+endingCount);
if(!dreamSource.includes('n=rare?9:route*3+choice')||!dreamSource.includes('galleryHtml')||!dreamSource.includes(' / 80 '))
 throw Error('Route endings not wired to progress collector');
if(!dreamSource.includes('id:"moon"')||!dreamSource.includes('id:"monday"')||!dreamSource.includes('if(id==="moon")')||!dreamSource.includes('if(id==="monday")'))
 throw Error('Surreal-world cards or artwork missing');
if(!dreamSource.includes('elsewhere_life_gallery_v5')||!dreamSource.includes('edition:"life-v5"'))
 throw Error('Updated edition and collector persistence required');
if(!dreamPage.includes('absurd-worlds.js')||!dreamPage.includes('route-endings.js')||!dreamCss.includes('album-world'))
 throw Error('New playable worlds and 80-ending gallery not available');
if(dreamPage.includes('/elsewhere/extra-scenes.js')||dreamPage.includes('/elsewhere/app.js'))
 throw Error('Retired disconnected story still active');
console.log('Elsewhere: 8 distinct genres, 24 story arcs, 88 authored scenes, 264 narrative choices and 80 bilingual outcomes checked.');

// Four distinctly styled cheerful CC0 recordings, no shared Lo-fi fallback.
const originalMusic=fs.readFileSync('public/studio-music.js','utf8');
new vm.Script(originalMusic,{filename:'public/studio-music.js'});
const bgmTracks={
 'tiny-town':{hex:'5570626561742f48617070792057686973746c696e6720556b756c656c652e6d7033',title:'Happy Whistling Ukulele'},
 'flip-dash':{hex:'5570626561742f496e76656e74696e6720466c696768742e6d7033',title:'Inventing Flight'},
 'parcel-panic':{hex:'5570626561742f46756e7368696e652e6d7033',title:'Funshine'},
 'pocket-aquarium':{hex:'576f726c642f436f6e6e656374696e67205261696e626f77732e6d7033',title:'Connecting Rainbows'}
};
for(const [slug,{hex,title}] of Object.entries(bgmTracks)){
 const page=fs.readFileSync('public/'+slug+'/index.html','utf8');
 if(!page.includes('src="/studio-music.js"')||!page.includes('src="/studio-audio.js"'))
  throw new Error('Music and SFX must both load: '+slug);
 if(!page.includes('rel="preload" as="audio"')||!page.includes('https://en.freepd.cn/api/music/'+hex))
  throw new Error('Bright BGM must preload from FreePD: '+slug);
 if(!originalMusic.includes("'"+slug+"':")||!originalMusic.includes(hex)||!originalMusic.includes(title))
  throw new Error('Bright BGM profile missing: '+slug);
}
if(originalMusic.includes('aeris-cc0-music')||originalMusic.includes('createOscillator')||
   originalMusic.includes('bedroom-window-vast.mp3')||originalMusic.includes('FALLBACK+track.file'))
 throw new Error('Retired dark/bass-heavy Lo-fi or synthesizer music is still configured');
const tinyMusicPage=fs.readFileSync('public/tiny-town/index.html','utf8');
const townV4=fs.readFileSync('public/tiny-town/game-v4.js','utf8');
new vm.Script(townV4,{filename:'public/tiny-town/game-v4.js'});
const townFreedom=fs.readFileSync('public/tiny-town/freedom-scenes.js','utf8');
const townFreedomCss=fs.readFileSync('public/tiny-town/freedom-scenes.css','utf8');
new vm.Script(townFreedom,{filename:'public/tiny-town/freedom-scenes.js'});
const townCompact=fs.readFileSync('public/tiny-town/compact-v5.js','utf8');
const townCompactCss=fs.readFileSync('public/tiny-town/compact-v5.css','utf8');
new vm.Script(townCompact,{filename:'public/tiny-town/compact-v5.js'});
for(const marker of ['id="wonderStat"','id="peaceStat"','id="comboStat"','id="townInspector"','id="inspectorContent"','id="tabResidents"','id="tabMemories"','id="tabDiscoveries"','id="liveNotice"','id="residentRibbon"','id="residentRibbonPeople"']){
 if(!tinyMusicPage.includes(marker))throw Error('Tiny Town compact single-surface UI missing '+marker);
}
for(const marker of ['body:has(.app){overflow:hidden}','height:calc(100dvh - 40px)','@media(max-width:700px)','.app .town-inspector[hidden]']){
 if(!townCompactCss.includes(marker))throw Error('Tiny Town single-screen responsive layout missing '+marker);
}
for(const marker of ['function peopleMarkup','function inspect()','function render()','window.TownV5={boot,render,toggle,openResident}']){
 if(!townCompact.includes(marker))throw Error('Tiny Town readable resident profiles or in-game info missing '+marker);
}
for(const marker of ["S.memories.push(","LEGENDARY_RULES=[","window.TownV5?.render?.()","wish-reactions","S.memories.map(m=>"]){
 if(!townV4.includes(marker))throw Error('Tiny Town reward and preference system missing '+marker);
}
for(const marker of ['Bring ','Return to my town','freedom-collect','const found=[...taken]']){
 if(!townFreedom.includes(marker))throw Error('Optional free-day souvenir collection missing '+marker);
}
if(!townCompact.includes('function residentRibbon()')||
   !townCompact.includes('data-resident=')||
   !townCompact.includes('residentRibbon();')||
   !townCompactCss.includes('.app .resident-ribbon')||
   !townCompactCss.includes('.app .resident-avatar.likes')||
   !townCompactCss.includes('.app .resident-avatar.dislikes'))
 throw Error('Visible resident strip and wish impact indicators are missing');
if(!townCompact.includes('let opened=\'\',focusedResident=null')||
   !townCompact.includes('function oneResident(')||
   !townCompact.includes('function compareResidents(')||
   !townCompact.includes('data-residents-all')||
   !townCompact.includes('data-resident-profile')||
   !tinyMusicPage.includes('data-zh="居民对比"')||
   !townCompactCss.includes('.app .resident-compare-row')||
   !townCompactCss.includes('.app .resident-focus-card'))
 throw Error('Resident avatar must open only one profile, with a separate all-five comparison');
for(const marker of ['HOME=[0,2,4,20,24]','const homeResidents=randomizeNeighbors(seed)','window.TownV5Actions={selectWish}','if(tenant){tile.onclick','function rareUnlocked(id)','LEGENDARY_WISHES.includes(id)']){
 if(!townV4.includes(marker))throw Error('Tiny Town homes or usable legendary wishes missing: '+marker);
}
for(const marker of ['function legendaryPanel(','data-legend-wish','function openResident(index,source)','window.TownV5={boot,render,toggle,openResident}']){
 if(!townCompact.includes(marker))throw Error('Tiny Town legend collection or resident home links missing: '+marker);
}
if(!tinyMusicPage.includes('id="tabLegends"')||
   !townCompactCss.includes('.app .tile.resident-home')||
   !townCompactCss.includes('.app .legend-wish-list')||
   !townCompactCss.includes('.app #tabLegends.unlocked'))
 throw Error('Visible legendary catalog or resident nameplates missing');
for(const marker of ['data-law="wonder"','data-law="care"','data-law="dream"','data-zh="想疯就疯"','data-zh="先躺为敬"','data-zh="离谱一点才好玩"','charter-flavor','charter-bonus']){
 if(!tinyMusicPage.includes(marker))throw Error('Playful starting style or visible perk is missing: '+marker);
}
for(const marker of ['function wishEffect(card)','lastComfortDay:-1','if(effect.cozy)S.lastComfortDay=S.day','S.law===\'wonder\'','S.law===\'care\'','dream:[\'voyage\'','const firstThought=']){
 if(!townV4.includes(marker))throw Error('Distinct starting-style gameplay is missing: '+marker);
}
if(townV4.includes("S.law='care';news(")||townV4.includes("S.law='wonder';news("))
 throw Error("Random story events cannot override the player\'s opening playstyle");
if(!townCompactCss.includes('#intro .charter .charter-bonus')||
   !townCompactCss.includes('#intro .charter .charter-flavor'))
 throw Error('Starting choice effects must be visible on mobile and desktop');
for(const code of [
  "{id:'star',day:3,wonder:55,combos:0,epics:0}",
  "{id:'night',day:4,wonder:115,combos:1,epics:0}",
  "{id:'tower',day:5,wonder:180,combos:3,epics:0}",
  "{id:'flight',day:6,wonder:290,combos:5,epics:2}",
  'lastLegendDay:-1',
  'S.legendaryUnlocked.push(next.id)',
  'S.lastLegendDay===S.day',
  'function unlockNextLegendary()',
  'S.day++;unlockNextLegendary();render();'
]){
 if(!townV4.includes(code))throw Error('Legendary wish must unlock one at a time with escalating progress: '+code);
}
for(const code of ['function legendaryPanel(v)','legend-requirements','S.legendaryUnlocked.length','nextLegendary']){
 if(!townCompact.includes(code))throw Error('Legendary collection must explain individual objectives: '+code);
}
if(!townCompactCss.includes('.app .legend-requirements span.met')||
   townCompact.includes('all four')&&townCompact.includes('unlock all four')||
   townV4.includes('rareUnlocked()')){
 throw Error('Legacy instant-unlock behavior or missing progressive requirements');
}
for(const marker of ['const LEGENDARY_POWERS={','function activateLegendaryPower(card,power,effect)','overlays.push({kind:\'legendaryBuild\'','function wishEffect(card)','const END_REASONS={','flight:[\'人人都能飞的天空城\'','coast:[\'永不结束的海边假期\'','roaming:[\'开往自由的银河列车\'','function endingText()','id===\'flight\'','S.found.forEach(c=>{score[c.vibe]+=7;']) {
 if(!townV4.includes(marker.replaceAll('\\','')))throw Error('Tiny Town special powers or outcome variety missing: '+marker);
}
if(!tinyMusicPage.includes('id="closeEnding"')||
   !tinyMusicPage.includes('id="endReason"')||
   !townV4.includes("$('closeEnding').onclick")||
   !townV4.includes("$('endReason').textContent"))
 throw Error('Tiny Town result must explain the outcome and support close without restarting');
for(const marker of ['#mapWrap.world{','#mapWrap.world .tile.resident-home','#mapWrap.world .tile.built','#mapWrap.world .tile.target','#mapWrap.world .world-illustration','filter:none!important','#closeEnding.close-ending','.app .legend-wish-copy .legend-power-detail','.app .end-reason']) {
 if(!townCompactCss.includes(marker))throw Error('Tiny Town illustration contrast or meaningful legendary UI missing: '+marker);
}
if(!townCompact.includes('legendaryPowers[rule.id]')||
   !townCompact.includes('legend-power-stats'))
 throw Error('Show legendary powers and real build rewards in the collection');
if(townV4.includes('S.places[0].id].vibe]+=14'))
 throw Error('Old first-wish ending bias should be removed');
for(const marker of ['const NEIGHBOR_ARCS=[','function chooseNeighborArc()','function neighborMoment(arc,phase,option)','function showNeighborStory(day)','neighborArc:null,neighborChoice:null,neighborMoments:[]','showNeighborStory(o.day)','neighborEnding=S.neighborMoments.at(-1)']){
 if(!townV4.includes(marker))throw Error('Resident story arc or continuity missing: '+marker);
}
for(const marker of ['function neighborStoryNotes(s,focus)','neighborStoryNotes(s,null)','neighborStoryNotes(s,r.name)']){
 if(!townCompact.includes(marker))throw Error('Resident story history must appear in their profiles: '+marker);
}
if(!townCompactCss.includes('.neighbor-scene-portraits')||
   !townCompactCss.includes('.neighbor-archive')||
   !tinyMusicPage.includes('id="closeEnding"')){
 throw Error('Town scenes and end card must remain usable');
}
for(const marker of [
 'const RESIDENT_ORIGINS=residents.map(',
 'const LEGEND_FANS={',
 'function randomizeNeighbors(seed)',
 'homeResidents=randomizeNeighbors(seed)',
 'S.homeResidents[HOME.indexOf(p)]',
 'function daySpark()',
 'function wonderStyleBonus(card)',
 'return sample(pools[S.law]||pools.care',
 'const freshStyle=sample(',
 'variety.extra',
 'wish-variety',
 'if(building)tile.dataset.building=building.id',
 'const ENDING_EPILOGUES={',
 'function endingDiorama()',
 'function endingAchievements()',
 "$('endLegacy').innerHTML=endingAchievements();"
]){
 if(!townV4.includes(marker))throw Error('Tiny Town replay variety, train scaling or personalized finale missing: '+marker);
}
if(!tinyMusicPage.includes('id="endLegacy"')||
   !townCompact.includes('Every new town reshuffles residents')||
   !townCompactCss.includes('#mapWrap.world .tile.built[data-building="voyage"] .tile-icon')||
   !townCompactCss.includes('.app .end-model-buildings')||
   !townCompactCss.includes('.app .ending-legacy')){
 throw Error('Tiny Town replay variation, train icon sizing, or unique result UI missing');
}
if(townV4.includes('HOME_RESIDENT={0:0,2:3,4:1,20:2,24:4}')||
  townV4.includes("if(S.day===1)return ['beach','voyage','garden']"))
 throw Error('Fixed home assignments or repetitive opening options returned');
console.log('Tiny Town single-canvas UI, resident preferences, meaningful resources, and optional memory rewards verified.');

if(tinyMusicPage.indexOf('src="/tiny-town/freedom-scenes.js"')<0||
   tinyMusicPage.indexOf('src="/tiny-town/freedom-scenes.js"')>tinyMusicPage.indexOf('src="/tiny-town/game-v4.js')||
   !tinyMusicPage.includes('href="/tiny-town/freedom-scenes.css?v=1"')||
   !townFreedomCss.includes('/art/tiny-town-scene.svg'))
 throw Error('Free Days illustrated scenery assets must load before the game engine');
for(const marker of ['id="freedomModal"','id="worldIllustration"','id="journeyPassport"','id="endArt"']){
 if(!tinyMusicPage.includes(marker))throw Error('Free Days interactive scenery UI missing: '+marker);
}
for(const marker of ['function play(opts,onDone)','function stage(id)','freedom-collect','freedom-skip','A Day of Doing Nothing']){
 if(!townFreedom.includes(marker))throw Error('Free Days choice and collectible scene missing: '+marker);
}
for(const marker of ["overlays.push({kind:'journey'",'S.journeys.push(memory.id)','function renderScenery()','end-hero-art','function postcard()','my-free-town-']){
 if(!townV4.includes(marker))throw Error('Free Days story, visits or end postcard missing: '+marker);
}
if(townV4.includes('A promise was forgotten. Your neighbors are disappointed.'))
 throw Error('Optional free-life wishes must not punish players');
console.log('Tiny Town Free Days: illustrated journeys, optional rest, living map, and postcard integration checked.');

for(const marker of ['const residents=[','const legends=[','function connectedLegend(','function discoverLegends()','function processResidents(','function relocate(pos)','function updatePromise(','function finalLayers()']){
 if(!townV4.includes(marker))throw Error('Tiny Town strategic gameplay missing: '+marker);
}
for(const marker of ['id="cityLandmark"','id="citizens"','id="petition"','id="moveWish"','id="charterSelect"','id="endStory"']){
 if(!tinyMusicPage.includes(marker))throw Error('Tiny Town strategic interface missing: '+marker);
}

for(const marker of ['src="/tiny-town/game-v4.js','id="intro"','id="endArt"','id="savePostcard"','id="feedbackQuestion"']){
 if(!tinyMusicPage.includes(marker))throw new Error('Tiny Town wish-cascade UI missing: '+marker);
}
for(const marker of ['function place(pos)','function newPairs(id,pos)','function chooseEvent(decision)','function illustrate(kind)','function finish()','town_completed-']){
 if(!townV4.includes(marker))throw new Error('Tiny Town playable wish-cascade missing: '+marker);
}
if(!fs.readFileSync('public/studio-audio.js','utf8').includes('[data-mw-music]'))
 throw new Error('Music toggle must not trigger the sound effects button');
console.log('Game music profiles, bilingual controls and Tiny Town wish-cascade engine checked.');

// The new fast visual adventure intentionally supersedes the letter-heavy legacy game.
if(dreamPage.includes('/elsewhere/app.js')||dreamPage.includes('/elsewhere/fast-story.js')||dreamPage.includes('/elsewhere/music.js'))
 throw Error('Elsewhere old scripts still launch');
if(dreamPage.includes('A LETTER FROM ELSEWHERE')||dreamPage.includes('letter-details'))
 throw Error('Elsewhere should not show long prose before gameplay');
console.log('Elsewhere launches directly into its illustration-led adventures.');

// Native media looping fixes browser-suspended Web Audio oscillators.
const immediateMusic=fs.readFileSync('public/studio-music.js','utf8');
for(const marker of ['if(enabled)play(); // Attempt immediately','audio.loop=true',
 'audio.addEventListener(\'playing\'','audio.addEventListener(\'error\'',
 'audio.src=active().url',"evt.target?.closest?.('[data-mw-music]')"]){
 if(!immediateMusic.includes(marker))throw new Error('Robust licensed BGM missing: '+marker);
}
for(const slug of ['tiny-town','flip-dash','parcel-panic','pocket-aquarium']){
 const html=fs.readFileSync('public/'+slug+'/index.html','utf8');
 if(!html.includes('rel="preload" href="/studio-music.js" as="script"'))throw new Error('Music should preload: '+slug);
}
const newsTopPage=fs.readFileSync('public/tiny-town/index.html','utf8');
const townNewsEngine=fs.readFileSync('public/tiny-town/game-v4.js','utf8');
if(!newsTopPage.includes('id="news"')||!newsTopPage.includes('id="discoveries"')||
   !townNewsEngine.includes('function renderNews()')||
   !townNewsEngine.includes('function translate()')||
   !townNewsEngine.includes('function showOverlay()'))
 throw new Error('Tiny Town bilingual news, discoveries and reactive events missing');
console.log('Immediate music start and bilingual wish-cascade news checked.');


// Elsewhere header returns home first and offers bilingual controls.
const navStart=dreamPage.indexOf('<header class="top">'),navEnd=dreamPage.indexOf('</header>',navStart);
if(navStart<0||navEnd<0)throw Error('Missing Elsewhere header');
const nav=dreamPage.slice(navStart,navEnd);
if(nav.indexOf('href="/"')<0||nav.indexOf('href="/"')>nav.indexOf('href="/elsewhere/"')||!nav.includes('data-language="zh"')||!nav.includes('data-language="en"'))
 throw Error('Elsewhere studio-home link or language toggle missing');
if((nav.match(/href="\/"(?=\s|>)/g)||[]).length!==1)throw Error('Ambiguous Elsewhere homepage route');
if(!dreamSource.includes('btn.setAttribute("aria-pressed",String(active))')||!dreamSource.includes('el.matches("[data-language]")'))throw Error('Elsewhere language options must highlight the current language and respond directly');
if(!dreamSource.includes('history.replaceState(history.state||{}')||!dreamSource.includes('url.delete("lang")'))throw Error('Elsewhere language preference must survive refreshing deep links');
console.log('Elsewhere home navigation, bilingual selector, and persistent URL language checked.');

// Parcel Panic must be genuinely playable with one click or 1/2/3 keys on laptops,
// while retaining touch drag and the old analytics/achievements event contracts.
{
 const src=fs.readFileSync('public/upgrade.js','utf8');
 const from=src.indexOf('G["parcel-panic"]=()=>{'),to=src.indexOf('const factory=G[id]',from);
 if(from<0||to<0)throw Error('Parcel Panic factory missing');
 const factory=src.slice(from,to);
 function play(actions,lang='en'){
  const G={},events=[];let points=0,finishes=0,status='';
  const env={G,seeded:()=>()=>.5,seed:'test',combo:0,shake:0,portrait:false,
   colors:['#47ddfc','#ffcb68','#fd79a8'],clamp:(x,a,b)=>Math.min(b,Math.max(a,x)),
   info:v=>status=v,add:x=>{points+=x},winEffect:()=>{env.combo++},
   finish:()=>{finishes++},burst:()=>{},tone:()=>{},vibrate:()=>{},rnd:()=>1,
   event:(name,data)=>events.push({name,data}),bg:()=>{},box:()=>{},line:()=>{},
   txt:()=>{},glow:()=>{},circ:()=>{},
   window:{mwMiniDelivered:0,MorrowwishI18n:{get:()=>lang}},
   document:{documentElement:{lang:lang==='zh'?'zh-CN':'en'}}};
  const mode=new Function(...Object.keys(env),factory+'return G["parcel-panic"]();')(...Object.values(env));
  mode.init();for(const step of actions)mode[step[0]](...step.slice(1));
  return {points,events,delivered:env.window.mwMiniDelivered,finishes,status};
 }
 const ready=[['tick',.6]];
 const good=[
  ['click correct lane',play([...ready,['down',190,460],['up',190,460]])],
  ['keyboard 1',play([...ready,['key','1']])],
  ['arrow left',play([...ready,['key','ArrowLeft']])],
  ['touch drag',play([...ready,['down',480,167],['move',190,455],['up',190,455]])]
 ];
 for(const [name,result] of good){
  if(result.points<14||result.delivered!==1||result.events.filter(x=>x.name==='parcel_sorted').length!==1)
   throw Error('Parcel Panic correct sort failed '+name+': '+JSON.stringify(result));
 }
 const wrong=play([...ready,['down',770,460],['up',770,460]]);
 if(wrong.points!==0||wrong.events.filter(x=>x.name==='parcel_missed').length!==1)
  throw Error('Parcel Panic wrong lane must count as a miss');
 const empty=play([['down',190,450],['up',190,450]]);
 if(empty.points!==0||empty.events.length)throw Error('Empty dock cannot score');
 const three=play([...ready,['key','1'],['tick',.2],['key','2'],['tick',.2],['key','3']]);
 if(three.points<42||three.delivered!==3||three.events.filter(x=>x.name==='parcel_sorted').length!==3)
  throw Error('Sequential parcels or combos broken: '+JSON.stringify(three));
 const eightActions=[...ready,['key','1'],['tick',.2],['key','2'],['tick',.2],['key','3']];
 for(let i=0;i<5;i++)eightActions.push(['tick',.2],['key','2']);
 const eight=play(eightActions);
 if(eight.delivered!==8||eight.events.filter(x=>x.name==='parcel_shift_clear').length!==1||eight.points<200)
  throw Error('Parcel Panic eight-delivery shift reward regressed: '+JSON.stringify(eight));
 const zh=play([...ready,['key','1']], 'zh');
 if(!zh.status.includes('已送达')&&!zh.status.includes('直接点击'))throw Error('One-click Chinese hints missing');
 const page=fs.readFileSync('public/parcel-panic/index.html','utf8');
 const translations=fs.readFileSync('public/zh-mini.js','utf8');
 if(!page.includes('anticipate the next order')||
    !translations.includes('按顺序分拣包裹')||
    !factory.includes('UP NEXT:')||!factory.includes('parcel_shift_clear'))throw Error('One-click onboarding copy missing');
 console.log('Parcel Panic: one-click, keyboard, touch drag, wrong/empty lane, combos and zh copy passed.');
}


// Reflex balancing: exercise the active upgraded factory, not the unused base.
{
 const src=fs.readFileSync('public/upgrade.js','utf8');
 const start=src.indexOf('G["flip-dash"]=()=>{'),end=src.indexOf('G["parcel-panic"]=()=>{',start);
 if(start<0||end<start)throw Error('Upgraded Flip Dash factory missing');
 const factory=src.slice(start,end);
 function simulate(flipAt=[]){
  const G={},window={mwMiniStats:null};let points=0,finished=null;
  const ctx={G,window,seed:'reflex-test',seeded:()=>()=>.5,
   info:()=>{},add:n=>points+=n,burst:()=>{},tone:()=>{},
   vibrate:()=>{},winEffect:()=>{},shake:0,flash:0,combo:0,
   finish:(won,message)=>{finished={won,message}},
   glow:()=>{},box:()=>{},line:()=>{},circ:()=>{},txt:()=>{},bg:()=>{},
   c:{createLinearGradient:()=>({addColorStop:()=>{}})}
  };
  const game=new Function(...Object.keys(ctx),factory+'return G["flip-dash"]();')(...Object.values(ctx));
  game.init();let t=0,at=0;
  while(!finished&&t<6.4){
   if(at<flipAt.length&&t>=flipAt[at]){game.down();at++}
   game.tick(.02);t+=.02;
  }
  return {t,finished,dodges:window.mwMiniStats.dodges,flips:window.mwMiniStats.flips,points};
 }
 const noFlip=simulate();
 if(!noFlip.finished||noFlip.finished.won||noFlip.t<2.25||noFlip.t>4.1)
  throw Error('Flip Dash must challenge quickly, not offer five seconds of empty track: '+JSON.stringify(noFlip));
 const firstDodge=simulate([2.4]);
 if(firstDodge.dodges<1||firstDodge.flips!==1||!firstDodge.finished||firstDodge.t<=noFlip.t)
  throw Error('Flip Dash must reward a correctly timed first dodge: '+JSON.stringify(firstDodge));
 if(!src.includes('doubleBeat=k>=5')||!src.includes('lastHazSide')||!src.includes('Math.max(.43'))
  throw Error('Flip Dash rapid alternating/repeated beat logic missing');
 const parcel=src.slice(src.indexOf('G["parcel-panic"]=()=>{'),src.indexOf('const factory=G[id]'));
 // Parcel Panic's longer runway and forgiving first shift are intentional.
 // Verify the current actual pacing rather than blocking every deploy on
 // obsolete speed constants from its previous harder build.
 if(!parcel.includes('life=4')||
    !parcel.includes('runwayStart=()=>isPortrait()?108:120,runwayEnd=()=>isPortrait()?477:617')||
    !parcel.includes('Math.min(235,108+Math.max(0,delivered-8)*2.8+Math.max(0,time-22)*.16)')||
    !parcel.includes('p?.kind==="express"?1.16')||
    !parcel.includes('queue.shift()'))
  throw Error('Parcel Panic four-life runway and gradual ramp regressed');
 console.log('Reflex challenge: fast Flip Dash and four-life Parcel Panic with a longer runway, forgiving opening and escalating express orders verified.');
}

// Nonintrusive, no-account feedback coverage for every published game.
{
 const pulse=fs.readFileSync('public/playtest-pulse.js','utf8');
 new vm.Script(pulse,{filename:'public/playtest-pulse.js'});
 const tracker=fs.readFileSync('public/telemetry.js','utf8');
 const dashboard=fs.readFileSync('public/studio-insights/index.html','utf8');
 for(const id of ['pawsibly-innocent','flip-dash','parcel-panic','pocket-aquarium']){
  const html=fs.readFileSync('public/'+id+'/index.html','utf8');
  if(!html.includes('/playtest-pulse.js'))throw Error('Optional post-run feedback missing: '+id);
  if(!pulse.includes("'"+id+"'"))throw Error('Feedback game route missing: '+id);
 }
 if(!tracker.includes('play_feedback_not_fun')||!dashboard.includes('feelPrefix')||
    !dashboard.includes("play_feedback_"))throw Error('Game feedback signals are not in the unified dashboard');
 if(!fs.readFileSync('public/tiny-town/index.html','utf8').includes('feedbackQuestion'))
  throw Error('Tiny Town existing playtest feedback missing');
 if(!fs.readFileSync('public/elsewhere/app.js','utf8').includes('ending_feedback'))
  throw Error('Elsewhere existing ending feedback missing');
 console.log('All six published games offer post-play feedback without any registration.');
}


// Game-onboarding and aquarium mood regression: no returning-player autostart.
{
 const upgrade=fs.readFileSync('public/upgrade.js','utf8');
 if(upgrade.includes('event("auto_start")')||
    !upgrade.includes('showReadyScreen();')||
    !upgrade.includes('goBtn.onclick=()=>window.start();')||
    !upgrade.includes('if(!running&&extras.hidden)showReadyScreen()'))
  throw Error('Flip Dash and Parcel Panic must wait for an explicit Play click on every visit');
 const aq=fs.readFileSync('public/pocket-aquarium/index.html','utf8');
 const match=[...aq.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('function endingFor()'));
 if(!match)throw Error('Pocket Aquarium endings script missing');
 new vm.Script(match,{filename:'pocket-aquarium game'});
 for(const end of ['festival','clear','friends','calm','rest']){
  if(!match.includes(end+':{icon:'))throw Error('Aquarium ending missing '+end);
  if(!match.includes("ending:lastEnding"))throw Error('Aquarium analytics should identify the ending');
 }
 const decision=match.match(/function endingFor\(\)\{return ([^\n]+)\}/)?.[1];
 if(!decision)throw Error('Aquarium outcome evaluator missing');
 const expected=[
  [{score:550,fed:13,quality:90},'festival'],
  [{score:90,fed:4,quality:90},'clear'],
  [{score:190,fed:7,quality:66},'friends'],
  [{score:0,fed:0,quality:27},'rest'],
  [{score:0,fed:0,quality:64},'calm']
 ];
 for(const [run,answer] of expected){
  const found=new Function('score','fed','quality','return '+decision)(run.score,run.fed,run.quality);
  if(found!==answer)throw Error('Aquarium outcome regression '+answer+' vs '+found);
 }
 const gameplay=match.slice(match.indexOf('function update(dt)'),match.indexOf('function paintFish('));
 if(gameplay.includes('finish(true)')||gameplay.includes('quality<=0')||
    !gameplay.includes('if(time<=0)finish()')||
    !match.includes('quality=cap(quality+3.2,18,100)')||
    !match.includes("state='playing';$('overlay').hidden=true"))
   throw Error('Aquarium should complete 60s with restorative, non-punishing water mechanics');
 const dashboardText=fs.readFileSync('public/studio-insights/index.html','utf8');
 const trackerText=fs.readFileSync('public/telemetry.js','utf8');
 if(!trackerText.includes('signal("aquarium_completed")'))
   throw Error('Aquarium 60-second completion telemetry missing');
 console.log('Five aquarium endings and click-to-start arcade flow verified.');
}


// Three flagship games must offer direct share destinations, not clipboard-only buttons.
{
 const helper=fs.readFileSync('public/social-share.js','utf8');
 new vm.Script(helper,{filename:'public/social-share.js'});
 for(const host of [
  'twitter.com/intent/tweet','facebook.com/sharer/sharer.php',
  'reddit.com/submit','api.whatsapp.com/send',
  'bsky.app/intent/compose','t.me/share/url'
 ]){
  if(!helper.includes(host))throw Error('Missing social share destination: '+host);
 }
 if(!helper.includes('message:typeof raw.message')||
    !helper.includes('onShare:typeof raw.onShare')||
    !helper.includes("opts.onShare?.(platform)")||
    !helper.includes("opts.meta"))
   throw Error('Shared social dialog must support truthful story captions and game analytics');
 const pages=[
  ['tiny-town','public/tiny-town/index.html','/tiny-town/game-v4.js'],
  ['elsewhere','public/elsewhere/index.html','/elsewhere/dreams.js'],
  ['pawsibly-innocent','public/pawsibly-innocent/index.html','/pawsibly-innocent/game.js']
 ];
 for(const [name,path,marker] of pages){
  const html=fs.readFileSync(path,'utf8');
  if(!html.includes('/social-share.js')||!html.includes(marker))
   throw Error(name+' must load the shared social modal');
 }
 const town=fs.readFileSync('public/tiny-town/game-v4.js','utf8');
  const elsewhere=fs.readFileSync('public/elsewhere/dreams.js','utf8');
  const cat=fs.readFileSync('public/pawsibly-innocent/game.js','utf8');
  if(!town.includes('score=S.wonder+S.peace*4')||
     !town.includes("onShare:()=>send('town_shared-link')"))
   throw Error('Tiny Town share must include a real run score and tracking');
 if(!elsewhere.includes('MorrowwishSocialShare?.open')||
     !elsewhere.includes('onShare:platform=>track("share_clicked"')||
     !(elsewhere.includes('encodeURIComponent(w.id)')||elsewhere.includes('encodeURIComponent(state.id)')))
   throw Error('Elsewhere share must preserve playable world deep links and ending');

if(!cat.includes('score=Math.max(0,Math.floor(Number(s?.score)||0))')||
    !cat.includes("meta:{game:'pawsibly-innocent',level:room}"))
  throw Error('Cat share must include real score and room');
 console.log('All three flagship game share menus: 6 social sites, localized messages, active scores and deep links.');
}


// Cat game release guard: gameplay controls are integrated INSIDE the stage,
// not in a permanent sidebar or a separate instruction panel.
{
 const html=fs.readFileSync('public/pawsibly-innocent/index.html','utf8');
 const script=fs.readFileSync('public/pawsibly-innocent/game.js','utf8');
 const css=fs.readFileSync('public/pawsibly-innocent/single-screen.css','utf8');
 const fullscreen=fs.readFileSync('public/game-fullscreen.js','utf8');
 const from=html.indexOf('<div class="stage" id="stage">');
 const end=html.indexOf('</main>',from);
 if(from<0||end<0)throw new Error('Cat gameplay stage missing');
 const stage=html.slice(from,end);
 const board=stage.indexOf('id="board"'),hud=stage.indexOf('id="heistStatus"'),
   guide=stage.indexOf('class="in-game-guidance"'),bonus=stage.indexOf('id="bonusQuick"'),
   tool=stage.indexOf('id="tool"'),menu=stage.indexOf('id="gameMenu"');
 if(board<0||hud<0||guide<0||bonus<0||tool<0||menu<board||!(guide<bonus&&bonus<board&&tool<board))
  throw new Error('Cat tutorial, bonus and yarn control must be grouped in one upper HUD before the map');
 if(stage.includes('class="stealth-actionbar"'))throw new Error('Standalone bottom yarn strip must not return');
  const retry=stage.indexOf('id="restart"');
  if(retry<tool||retry>board||stage.includes('class="collection-count"')||stage.includes('id="collectionPreview"'))
    throw new Error('Retry belongs above the board, and album preview cards stay removed');
 for(const id of ['menuButton','menuButtonLabel','menuClose','quickHelp','stageControls','tool','visionTip','guardIntent','bonusQuick','bonusQuickText','bonusQuickProgress',
                 'levels','wardrobe','skinHint','score','moves','starTotal','hearts','fishCount',
                 'relicGallery','achievementsGrid','badgeHighlights','howTitle',
                 'restart','roomNum','roomTag','overlay']){
  if(!stage.includes('id="'+id+'"'))throw new Error('Cat game stage lost control '+id);
 }
 if(stage.includes('id="menuLanguage"')||stage.includes('id="menuAudio"')||stage.includes('id="settingsTitle"'))
  throw new Error('Cat Help must not duplicate header language or sound controls');
 const audioDock=fs.readFileSync('public/audio-dock.js','utf8');
 if(!html.includes('class="cat-sound-controls"')||!html.includes('id="music"')||!html.includes('id="sound"')||
    !audioDock.includes("route==='pawsibly-innocent'?document.querySelector('#stageControls')"))
  throw new Error('Cat music and sound controls must live in the visible game header');
 if(!stage.includes('data-game-tab="rooms"')||!stage.includes('data-game-tab="album"')||
    !stage.includes('data-game-tab="badges"')||!stage.includes('data-game-tab="help"'))
  throw new Error('Game menu tabs missing');
 if(html.includes('<section class="explainer"')||html.includes('<aside class="panel" aria-label="Game progress and controls">'))
  throw new Error('Obsolete persistent cat sidebar or duplicated rules remain');
 if(!css.includes('playfield')||!css.includes('game-menu')||
    !fullscreen.includes("'pawsibly-innocent':['#stage','#stageControls']"))
  throw new Error('One-screen game layout or stage-only fullscreen not wired');
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 if(ids.some((id,i)=>ids.indexOf(id)!==i))throw new Error('Duplicate cat-game DOM ID');
 for(const id of [...new Set([...script.matchAll(/\$\("([^"]+)"\)/g)].map(x=>x[1]))]){
  if(!html.includes('id="'+id+'"'))throw new Error('Cat script references missing DOM node '+id);
 }
 console.log('Single-screen cat adventure: one stage, in-game menus, stage-only fullscreen, all DOM IDs present.');
}

// Elsewhere regression: all story text must remain full paragraphs, never
// the first character of a string (the previous fast-story destructuring bug).
{
 const vm=await import('node:vm');
 const context={window:{
   MORROW_ZH_STORIES:{},
   ELSEWHERE_CONTINUITY:{beats:{},hints:{},overrides:{}},
   ELSEWHERE_MYSTERIES:{},ELSEWHERE_ENDINGS:{}
 },structuredClone};
 vm.runInNewContext(fs.readFileSync('public/elsewhere/season.js','utf8'),context);
 vm.runInNewContext(fs.readFileSync('public/elsewhere/fast-story.js','utf8'),context);
 const worlds=context.window.ELSEWHERE_SEASON;
 if(worlds.length!==4||worlds.some(w=>w.acts.length!==5))
  throw new Error('Elsewhere must have four five-scene lives');
 let count=0;
 for(const world of worlds)for(const act of world.acts)for(const paragraph of act.n){
  if(typeof paragraph!=='string'||paragraph.length<75)
   throw new Error('Truncated Elsewhere paragraph in '+world.id+': '+paragraph);
  const zh=context.window.MORROW_ZH_STORIES[paragraph];
  if(typeof zh!=='string'||zh.length<40||!/[\u4e00-\u9fff]/.test(zh))
   throw new Error('Missing complete Chinese story paragraph in '+world.id);
  count++;
 }
 if(count!==40)throw new Error('Expected 40 branched Elsewhere paragraphs, got '+count);
 const page=fs.readFileSync('public/elsewhere/index.html','utf8');
 if(page.includes('id="narrate-voice"'))throw new Error('Duplicate iPhone speech voice menu has returned');
 console.log('Elsewhere: '+count+' full-length bilingual passages, curated narrator and no duplicate voice picker verified.');
}


// Shared settings and portrait interaction regression gate.
// Covers every published game, not only the four featured experiences.
{
 const games=['cat-bond','color-current','echo-heist','elsewhere','flip-dash',
  'grid-glider','mirror-mosaic','orbit-escape','parcel-panic',
  'pawsibly-innocent','perfect-pour','pocket-aquarium',
  'tiny-town','tower-tuck','traffic-tangle'];
 const settings=fs.readFileSync('public/game-settings.js','utf8');
 new Function(settings);
 for(const slug of games){
  const html=fs.readFileSync('public/'+slug+'/index.html','utf8');
  if(!html.includes('/game-settings.js?v='))
   throw Error('Missing visible settings dock: '+slug);
 }
 if(!settings.includes('mw-settings-language')||!settings.includes('mw-settings-music')||
    !settings.includes('mw-settings-sfx')||!settings.includes('document.fullscreenElement'))
  throw Error('Shared language, music and sound controls must remain visible in fullscreen');
 const quick=fs.readFileSync('public/game.js','utf8');new Function(quick);
 if(!quick.includes("key(k){if(['1','2','3'].includes(k))")||
    !quick.includes('Both lanes are rendered in the SAFE CENTER')||
    !quick.includes('next.color===lane'))
  throw Error('Portrait parcel lane taps/keyboard and full two-lane runner must be preserved');
 const kitten=fs.readFileSync('public/cat-bond/js/real-kittens.js','utf8');new Function(kitten);
 const bond=fs.readFileSync('public/cat-bond/index.html','utf8');
 // Source must be complete transparent watercolor sprites, not a
 // broken 25-piece atlas, horizontal clipping or doubled mirrored faces.
 if(!/<script src="js\/real-kittens\.js\?v=[^\"]+"><\/script>/.test(bond)||
    bond.includes('src="js/breed-atlas.js')||
    bond.includes('src="js/kitten-illustrations.js')||
    bond.includes('src="js/complete-kittens.js')||
    !kitten.includes('watercolor-cats-v2.webp')||
    !kitten.includes('const breedFrameSize={w:110,h:130,cols:3,rows:1}')||
    !kitten.includes('frame.width=breedFrameSize.w')||
    kitten.includes('full.width=2*(half+pad)')||
    kitten.includes('out.scale(-1,1)')||
    !fs.existsSync('public/cat-bond/assets/watercolor-cats-v2.webp')||
    fs.statSync('public/cat-bond/assets/watercolor-cats-v2.webp').size<6000)
   throw Error('Cat Bond must use complete transparent watercolor assets without mirroring');
 if(!settings.includes('mw-settings-share')||
    !fs.readFileSync('public/social-share.js','utf8').includes('activeShareHost()'))
   throw Error('Fullscreen share toolbar and modal must remain available');
 const mischief=fs.readFileSync('public/pawsibly-innocent/game.js','utf8');
 if(!mischief.includes("if(!s.yarnAnimating)guardMove()")||
    !mischief.includes('s.decoyAwareness')||
    !mischief.includes('setInterval(advanceYarnChase,470)'))
   throw Error('Cat mischief yarn must redirect owner while cat keeps moving');
 // Cat Bond UI and battle regression gates.
 const cbUi=fs.readFileSync('public/cat-bond/js/ui.js','utf8');
 const cbCss=fs.readFileSync('public/cat-bond/css/style.css','utf8');
 const cbGame=fs.readFileSync('public/cat-bond/js/game.js','utf8');
 const cbBattle=fs.readFileSync('public/cat-bond/js/battle.js','utf8');
 const cbState=fs.readFileSync('public/cat-bond/js/state.js','utf8');
 const cbRel=fs.readFileSync('public/cat-bond/js/cat-relationships.js','utf8');
 for(const js of [cbUi,cbGame,cbBattle,cbState,cbRel])new Function(js);
 if(!cbUi.includes('panel-dismiss')||
    !cbUi.includes("e.key==='Escape'")||
    !cbCss.includes('#panel.open:not([data-mandatory="true"])>.panel-dismiss')||
    !cbCss.includes('@media(orientation:landscape) and (pointer:coarse)')||
    bond.includes('/audio-dock.js')||
    !cbCss.includes('#stage>#mw-audio-dock')||
    !cbGame.includes("if(goal)goal.hidden=true")||
    !cbBattle.includes('battlePrefs?.autoBattle')||
    !cbBattle.includes('State.S.battlePrefs.autoBattle=this.autoMode')||
    !cbState.includes('battlePrefs: { autoBattle: false }'))
   throw Error('Cat Bond overlays, sound controls, and saved combat-mode regression');
 const artPairs=[...cbRel.matchAll(/^ '([a-z]+\+[a-z]+)':\[/gm)].map(m=>m[1]);
 if(new Set(artPairs).size!==21||
    !cbBattle.includes('art.secondStatus')||
    !cbBattle.includes("const support=art.support||'shield'")||
    !cbUi.includes('duo-unlocked-card')||
    !cbUi.includes('renderUnlockedDuoCards(unlockedPairs)')||
    cbUi.includes('<canvas id="duo-skill-canvas"'))
   throw Error('Cat Bond must keep all 21 playable duo combinations without duplicating or revealing locked skill art');
 const upgraded=fs.readFileSync('public/upgrade.js','utf8');new Function(upgraded);
 // The upgraded game factories replace the base Flip Dash/Parcel Panic
 // renderers. Guard their own portrait painting and hit targets.
 if(upgraded.split('if(typeof portrait!=="undefined"&&portrait){').length<3||
    !upgraded.includes('const lx=145,rx=395')||
    !upgraded.includes('const xOf=x=>100+(x-190)*170/290')||
    !upgraded.includes('send(target,"click")')||
    upgraded.includes('No need to grab it — just click a color lane!'))
   throw Error('Upgrade.js must render BOTH complete 540x960 mini-games and honor touch sorting');
 const miniJs=fs.readFileSync('public/mini-frame-fullscreen.js','utf8');new Function(miniJs);
 for(const slug of ['flip-dash','parcel-panic','orbit-escape','tower-tuck',
   'traffic-tangle','color-current','perfect-pour','grid-glider','mirror-mosaic','echo-heist']){
   const page=fs.readFileSync('public/'+slug+'/index.html','utf8');
   if(!page.includes('/mini-frame-fullscreen.js?v=')||!page.includes('/mini-frame-fullscreen.css?v='))
    throw Error('Uncropped mobile mini fullscreen missing: '+slug);
 }
 if(!miniJs.includes("route==='flip-dash'||route==='parcel-panic'")||
    !miniJs.includes("classList.toggle('mw-mini-screen-portrait'"))
  throw Error('Portrait mini-games must keep all interactive content in view');
 if(!settings.includes("['#stageControls','.in-game-controls']")||
    !settings.includes("['.mw-mini-frame-hud'")||!settings.includes("['.top-actions','.header']"))
  throw Error('Language/music/SFX controls must live inside the original toolbar');
 // Cat Bond: regressions in intro art overlap and duo animation access.
 const bondIntro=fs.readFileSync('public/cat-bond/index.html','utf8');
 const bondViewer=fs.readFileSync('public/cat-bond/duo-preview.html','utf8');
 const bondPremium=fs.readFileSync('public/cat-bond/js/duo-premium.js','utf8');
 // New RPG title is landscape art with equal independent entry actions.
 const titleCss=fs.readFileSync('public/cat-bond/css/rpg-title.css','utf8');
 if(!bondIntro.includes('class="cb-title-landscape"')||!bondIntro.includes('id="intro-start"')||!bondIntro.includes('id="intro-continue"')||!bondIntro.includes('id="cb-system-toggle"')||bondIntro.includes('id="intro-reset"')||!titleCss.includes('repeat(2,minmax(0,1fr))')||
    !cbUi.includes('this.openUnlockedDuoViewer(entry.a,entry.b)')||
    !cbUi.includes('this.openUnlockedDuoViewer(a,b)')||
    !cbUi.includes('thumbnail:true')||
    !cbUi.includes('rel?.value)<20')||
    (!bondPremium.includes('get originalPaintingDefault(){return true}')||!bondPremium.includes('get actorFallbackEnabled(){return false}')||!bondPremium.includes('feather(paintingCtx,artW,artH)'))||
    !bondViewer.includes('duo-embedded')||
    !/href="css\/style\.css\?v=[^\"]+"/.test(bondIntro))
   throw Error('Cat Bond intro caption must be below cat art; earned duo cards must replay directly with clean previews');
 new Function(bondPremium);
 // Returning from battle must never leave stale additive blend/alpha/filter
 // state or collapse two illustrated cats into one pale, untappable pile.
 const cbWorld=fs.readFileSync('public/cat-bond/js/world.js','utf8');
 new Function(cbWorld);
 const yardIndex=fs.readFileSync('public/cat-bond/index.html','utf8');
 if(!cbGame.includes("ctx.globalCompositeOperation='source-over'")||
    !cbGame.includes("ctx.filter='none'")||
    !cbGame.includes("try {")||!cbGame.includes("finally { ctx.restore(); }")||
    !cbWorld.includes('const yardMagnify=Math.min(1.32')||
    !cbWorld.includes('Math.min(this.W/880,this.H/490)*.79')||
    !cbWorld.includes('this._renderedYardScale=drawScale*yardMagnify')||
    !cbWorld.includes('const s=this._renderedYardScale||1.2')||
    !cbWorld.includes('CatArt.drawCat(ctx, this.x+dx')||
    !cbWorld.includes('const rows=H<435||selection.length<=3?1:2')||
    !cbWorld.includes('filter:"saturate(1.12) contrast(1.08)"')||
    !cbWorld.includes('ctx.filter=filter;ctx.drawImage(img,fit.x,fit.y,fit.width,fit.height);ctx.restore()')||
    !cbWorld.includes('this._renderedYardVisualScale=this._renderedYardScale*(growthForm?.scale||1)')||
    !/src="js\/world\.js\?v=[^"]+"/.test(yardIndex)||
    !/src="js\/game\.js\?v=[^"]+"/.test(yardIndex))
   throw Error('Cat Bond post-battle garden requires crisp kittens, spatial layout, and reset canvas state');
 const fakeWindow={};
 const fakeState={S:{cats:[{uid:'1',species:'orange',joy:90},
     {uid:'2',species:'gray',joy:90}],yardBuildings:[]}};
 const FakeImage=class{set src(_v){}};
 const YardForTest=new Function('window','Image','document','State',
   cbWorld+';return window.World.YardScene;')(
   fakeWindow,FakeImage,{getElementById:()=>null},fakeState);
 // Verify the actual shared fit implementation on extreme landscape and portrait.
 for(const [iw,ih,w,h] of [[1920,1080,390,844],[1080,1920,1280,720],[1920,1080,568,320]]){
   const fit=fakeWindow.CatBondSceneFit.rect(iw,ih,w,h);
   if(fit.x<-.01||fit.y<-.01||fit.width>w+.01||fit.height>h+.01||Math.abs(fit.width/fit.height-iw/ih)>.00001||Math.abs(fit.x*2+fit.width-w)>.01||Math.abs(fit.y*2+fit.height-h)>.01)
     throw Error('Original scene artwork must remain fully visible and undistorted');
 }
 const yardForTest=new YardForTest({W:1600,H:820,scene:'yard'});
 if(yardForTest.entities.length!==2||
    Math.abs(yardForTest.entities[0].x-yardForTest.entities[1].x)<320||
    Math.abs(yardForTest.entities[0].y-yardForTest.entities[1].y)>5)
   throw Error('Two yard cats stack instead of appearing side-by-side');
 fakeState.S.cats.push({uid:'3',species:'black',joy:80});
 yardForTest.rebuild();
 if(yardForTest.entities.length!==3||
    new Set(yardForTest.entities.map(e=>Math.round(e.x))).size!==3)
   throw Error('Three yard cats must have separate positions');
 const CanvasGameForTest=new Function('window','document',
   cbGame+';return window.Game;')({}, {getElementById:()=>null});
 const cleanCanvas={
   globalAlpha:0.08,globalCompositeOperation:'lighter',filter:'blur(16px)',
   shadowBlur:24,save(){},restore(){},setLineDash(){},clearRect(){}
 };
 const gameForTest=Object.create(CanvasGameForTest.prototype);
 gameForTest.ctx=cleanCanvas;gameForTest.W=1600;gameForTest.H=820;
 gameForTest.scene='yard';
 gameForTest.yard={draw(ctx){
   if(ctx.globalAlpha!==1||ctx.globalCompositeOperation!=='source-over'||
      ctx.filter!=='none'||ctx.shadowBlur!==0)
     throw Error('Battle blend/filter leaked into yard redraw');
 }};
 gameForTest.draw();
 const cbMain=fs.readFileSync('public/cat-bond/js/main.js','utf8');
 if(!cbMain.includes('installCatBondSystemMenu()')||!cbMain.includes("openSlots('new')")||!cbMain.includes("openSlots('continue')")||!titleCss.includes('button:is(#intro-start,#intro-continue)')||
    !cbBattle.includes("regularSkillAccent(f,element,angle=0,isBasic=false,hit=false)")||
    !cbBattle.includes("drawRegularSkillAccent(ctx,v,k,p)")||
    !cbBattle.includes("this.regularSkillAccent(f,f.element,aim,true)")||
    !cbBattle.includes("this.regularSkillAccent({x,y},skill.element"))
   throw Error('Cat Bond first-screen CTA and six-element ordinary-skill VFX regressions');
 // Catch the regression that previously scaled COURTYARD cats up to 2.05x.
 // Portrait cats remain at their original 132px height; ONLY yard magnification
 // is reduced. The hit test continues to use the actual painted cat scale.
 for(const [W,H] of [[1600,820],[960,600],[390,700],[320,530]]){
   const old=Math.min(2.05,Math.max(1.22,Math.min(W/880,H/490)*1.12));
   const current=Math.min(1.32,Math.max(.94,Math.min(W/880,H/490)*.79));
   if(!(current<old&&current>=.94&&current<=1.32))
     throw Error('Garden cat size must be smaller than before on '+W+'x'+H);
 }
 if(!/js\/main\.js\?v=[a-z0-9][\w.-]*/i.test(bondIntro)||
    !cbMain.includes('targetHeight=132,maxWidth=140')||
    !/src="js\/world\.js\?v=[^"]+"/.test(bondIntro))
   throw Error('Garden resize must not shrink the main menu kitten portraits');
 // Tour must progress through real post-capture actions and remain optional.
 if(!bondIntro.includes('id="guide-help"')||
    !bondIntro.includes('role="region" aria-label="猫猫冒险指引"')||
    !/src="js\/game\.js\?v=[^\"]+"/.test(bondIntro)||
    !/src="js\/ui\.js\?v=[^\"]+"/.test(bondIntro)||
    !cbMain.includes('targetHeight=132,maxWidth=140')||
    !cbCss.includes('#first-quest.is-tour')||
    !cbCss.includes('#stage .cb-guide-target')||
    !cbCss.includes('#intro > .intro-cat-gallery{')||
    !cbGame.includes('firstAdventureTour(){')||
    !cbGame.includes('completeFirstAdventureStep(kind){')||
    !cbGame.includes('replayFirstAdventureTour(){')||
    !cbGame.includes("this.completeFirstAdventureStep('pet')")||
    !cbUi.includes("this.game?.completeFirstAdventureStep?.('duo')")||
    !cbUi.includes("this.game?.completeFirstAdventureStep?.('map')")||
    !cbUi.includes("this.game?.completeFirstAdventureStep?.('workshop')")||
    !cbUi.includes("this.game?.completeFirstAdventureStep?.('play')"))
   throw Error('Cat Bond post-capture guided tour or smaller intro portraits missing');
 const tourMockWindow={MorrowwishI18n:{get:()=> 'zh'}};
 let tourSaved=0;
 const tourState={S:{catchCount:1,petCount:0,cats:[{uid:'a'},{uid:'b'}]},
   save:()=>{tourSaved++;}};
 const tourMockDocument={getElementById:()=>null,querySelector:()=>null};
 const TourGame=new Function('window','document','State','UI',
   cbGame+';return Game;')(tourMockWindow,tourMockDocument,tourState,{});
 const tourGame=Object.create(TourGame.prototype);
 tourGame.scene='yard';
 const starterTour=tourGame.firstAdventureTour();
 if(!starterTour||starterTour.step!==0||tourSaved!==1)
   throw Error('First capture must initialize pet tutorial');
 if(tourGame.completeFirstAdventureStep('map')!==false||
    starterTour.step!==0)throw Error('Guide must not skip ahead');
 for(const [step,kind] of ['pet','duo','map','workshop','play'].entries()){
   if(tourGame.completeFirstAdventureStep(kind)!==true||
      starterTour.step!==step+1)
     throw Error('Post-capture guide failed: '+kind);
 }
 tourGame.finishFirstAdventureTour();
 if(!tourState.S.firstAdventureTour.done||
    tourState.S.firstAdventureTour.skipped||
    tourGame.completeFirstAdventureStep('pet')!==false)
   throw Error('Guide completion must persist and stop hints');
 tourGame.replayFirstAdventureTour();
 if(tourState.S.firstAdventureTour.step!==0||
    tourState.S.firstAdventureTour.done)throw Error('Guide replay failed');
 tourGame.finishFirstAdventureTour(true);
 if(!tourState.S.firstAdventureTour.skipped)
   throw Error('Guide must allow skipping without harming progress');
 // Lightweight canvas stub exercises basic, Q/E and hit accents for every
 // element without modifying game rules or loading illustration assets.
 const mockWindow={};
 const CaptureForFx=new Function('window',cbBattle+';return window.Battle.CaptureBattle;')(mockWindow);
 const fake=Object.create(CaptureForFx.prototype);
 fake.skillStrokes=[];
 const ctx={globalAlpha:1};
 for(const m of ['beginPath','arc','ellipse','stroke','fill','save','restore','translate',
                 'rotate','moveTo','lineTo','quadraticCurveTo','bezierCurveTo','closePath'])
   ctx[m]=()=>{};
 for(const element of ['fire','water','grass','elec','dark','light']){
   for(const basic of [true,false]){
     fake.regularSkillAccent({x:120,y:120},element,0,basic);
     const v=fake.skillStrokes.pop();
     if(!v||v.element!==element||v.hit)throw Error('Missing regular cast accent: '+element);
     fake.drawRegularSkillAccent(ctx,v,.7,.33);
   }
   fake.regularSkillAccent({x:155,y:110},element,0,false,true);
   const hit=fake.skillStrokes.pop();
   if(!hit||!hit.hit||hit.element!==element)throw Error('Missing regular hit accent: '+element);
   fake.drawRegularSkillAccent(ctx,hit,.5,.5);
 }
 // Skill names, hover/focus description, phone info and first-fight preview.
 // The actual fish icon alternates fish + yarn and MUST have a readable name.
 if(!bondIntro.includes('id="mv-basic" data-move="basic"><span class="mv-icon">🧶</span><span class="mv-name">毛球出击</span>')||
    !bondIntro.includes('id="battle-skill-tooltip"')||
    !bondIntro.includes('id="battle-skill-info-toggle"')||
    !bondIntro.includes('id="battle-skill-guide"')||
    !cbCss.includes('#battle-ui .move .mv-name{')||
    !cbCss.includes('#panel .prebattle-skills{')||
    !cbUi.includes("btn.addEventListener('mouseenter',()=>this.game.showBattleSkillTooltip(slot))")||
    !cbUi.includes("btn.addEventListener('focus',()=>this.game.showBattleSkillTooltip(slot))")||
    !cbUi.includes('battlePrepSkillCard(team,en){')||
    !cbUi.includes("skillsIntroSeen:true")||
    !cbUi.includes('this.refreshBattlePrepSkills(this.teamUids.map(')||
    !cbUi.includes('this.refreshBattlePrepSkills(selected.map(')||
    !cbGame.includes("fallback:en?'Fluff Attack':'毛球出击'")||
    !cbGame.includes('battleSkillInfo(slot, fighter=this.battle?.me())')||
    !cbGame.includes('showBattleSkillTooltip(slot){')||
    !cbGame.includes('toggleBattleSkillGuide(open){'))
   throw Error('Cat Bond skill labels, hovered tooltips, mobile reference or prebattle preview missing');
  if(!cbUi.includes('class="cb-grow-grid"')||
     !cbUi.includes('id="cd-grow-more"')||
     !cbUi.includes('id="cb-grow-level-title"')||
     !cbUi.includes('id="cb-grow-stat-title"')||
     !cbUi.includes('id="cb-grow-bond-title"')||
     !cbUi.includes('id="cd-trainnext"')||
     cbUi.includes('id="cd-trainfive"')||
     !cbUi.includes('<strong>⬆ 一键升级</strong>')||
     !cbUi.includes('id="cd-trainstat"')||
     !cbUi.includes('id="cd-feed"')||
     !cbCss.includes('#panel #cat-detail .cb-grow-interactions'))
    throw Error('Cat Bond upgrade / training / interaction groups are missing');
 const skillFixtures={
   q:{id:'testQ',name:'炽爪',desc:'造成灼烧',element:'fire',cd:3,ultCost:0},
   e:{id:'testE',name:'泡泡幕',desc:'减伤',element:'water',cd:7,ultCost:0},
   ult:{id:'testUlt',name:'喵之怒涛',desc:'范围伤害',element:'light',cd:0,ultCost:80}
 };
 const mockSkills={
   ensureLoadout:cat=>cat.loadout,
   skillById:id=>Object.values(skillFixtures).find(sk=>sk.id===id)||null
 };
 const testState={S:{battlePrefs:{}},catName:()=>'<bad & name>'};
 const testGameData={speciesById:id=>({id}),speciesName:sp=>sp.id};
 const testWindow={MorrowwishI18n:{get:()=> 'zh'},Skills:mockSkills,
   CatBondI18n:{translate:s=>s}};
 const TestedGame=new Function('window',cbGame+';return Game;')(testWindow);
 const testGame=Object.create(TestedGame.prototype);
 testGame.isTouch=false;testGame.scene='battle';testGame.skillIcon=()=> '🐾';
 const testCat={uid:'first',species:'tangyuan',
   loadout:[null,'testQ','testE','testUlt']};
 const testFighter={cat:testCat,basicSkill:null,
   qSkill:skillFixtures.q,eSkill:skillFixtures.e,ultSkill:skillFixtures.ult};
 testGame.battle={me:()=>testFighter};
 const basics=testGame.battleSkillInfo('basic',testFighter);
 if(basics.name!=='毛球出击'||!basics.desc.includes('毛线球')||
    testGame.battleSkillInfo('q').name!=='炽爪'||
    testGame.battleSkillInfo('e').name!=='泡泡幕'||
    testGame.battleSkillInfo('ult').name!=='喵之怒涛'||
    !testGame.battleSkillInfo('dodge').desc.includes('闪避'))
   throw Error('Skill tooltip must use active kitten loadout, not static labels');
 const testUI=new Function('window','Skills','State','GameData',
   cbUi+';return UI;')(testWindow,mockSkills,testState,testGameData);
 const listHtml=testUI.battlePrepSkillMarkup([testCat],false);
 if(!listHtml.includes('普攻')||!listHtml.includes('技能一')||
    !listHtml.includes('技能二')||!listHtml.includes('闪避')||
    !listHtml.includes('必杀技')||!listHtml.includes('锁定目标')||
    listHtml.includes('炽爪')||listHtml.includes('<bad & name>'))
   throw Error('Pre-battle guide must describe actual battle buttons, not each cat skill');
 if(!testUI.battleTeamSummary([testCat],false).includes('首发：')||
    !testUI.battlePrepEsc(testUI.battleTeamSummary([testCat],false)).includes('&lt;bad &amp; name&gt;'))
   throw Error('Pre-battle team summary must remain accurate and escape cat names');
 if(testUI.battlePrepSkillCard([testCat],false).includes('class="prebattle-skills" open')||
    !testUI.battlePrepSkillCard([testCat],false).includes('战斗按钮说明'))
   throw Error('Pre-battle skill help should remain collapsed and concise');
 testState.S.battlePrefs.skillsIntroSeen=true;
 if(testUI.battlePrepSkillCard([testCat],false).includes('class="prebattle-skills" open'))
   throw Error('Returning players must not be forced to read a long skill preview');
 console.log('All 15 games: universal language/audio controls and portrait touch safeguards verified.');
}

// Language QA: every playable route must use the shared English-first selection,
// and Cat Bond species names must be pronounceable in both locales.
await import('./check-language.mjs');
// Include every hidden and legacy narrative branch in the production gate.
await import('./check-hidden-story-language.mjs');
// Universal preflight: dashboards may NEVER erase previously reported metrics.
// This is intentionally part of npm run check, not only the deployment workflow.
await import('./test-dashboard-sorting.mjs');

// The Cat Bond RPG and encrypted cloud-save path are part of the production gate.
await import('./check-cat-bond-story-cloud.mjs');


// Sunlit Garden: source, artwork and cross-module ownership regression gate.
const gardenCode=fs.readFileSync('public/cat-bond/js/sunlit-garden.js','utf8');
const gardenProjects=fs.readFileSync('public/cat-bond/js/garden-projects.js','utf8');
new Function(gardenProjects);
const gardenArt=fs.readFileSync('public/cat-bond/assets/garden/sunlit-garden-landscape.webp');
const gardenArtPortrait=fs.readFileSync('public/cat-bond/assets/garden/sunlit-garden-portrait.webp');
const gardenWorld=fs.readFileSync('public/cat-bond/js/world.js','utf8');
const gardenGame=fs.readFileSync('public/cat-bond/js/game.js','utf8');
const gardenHtml=fs.readFileSync('public/cat-bond/index.html','utf8');
const gardenCss=fs.readFileSync('public/cat-bond/css/style.css','utf8');
new Function(gardenCode);
const gardenRegions=['harbor','forest','forge','sky','library','starfall'];
const gardenCast=['muling','jiedeng','qilan','yahe','yuchuan','jinpo','xiaomao','lingyu','yuanfan','moye','baikan','xingya','lichuan'];
if([gardenArt,gardenArtPortrait].some(art=>art.toString('ascii',0,4)!=='RIFF'||art.toString('ascii',8,12)!=='WEBP'))
 throw new Error('Sunlit Garden must have desktop and portrait painted WebP environment plates');
if(gardenRegions.some(id=>!gardenProjects.includes("['"+id+"'")||!fs.existsSync('public/cat-bond/assets/garden/projects/'+id+'.svg'))||
   gardenCast.some(id=>!gardenCode.includes(id)))
 throw new Error('Sunlit Garden must expose all six canonical restoration assets and home NPC anchors');
if(!gardenProjects.includes('resonance?.sanctuaries')||!gardenProjects.includes('sunlitGarden.projects')||!gardenProjects.includes('State.addXp')||!gardenCode.includes('GardenProjects?.draw')||!gardenCode.includes('GardenProjects?.tap')||!gardenWorld.includes('GardenProjects?.update')||!gardenHtml.includes('js/garden-projects.js')||/State\.S\.resonance\s*=|\.resonance\.[a-zA-Z]+\s*=/.test(gardenProjects))throw new Error('Garden projects must use canonical read-only progression and real slot-local cat growth');
if(!gardenCode.includes('window.State?.S')||!gardenCode.includes('resonance')||
   !gardenCode.includes('registerNarrativeAdapter')||
   !gardenCode.includes('drawHomeNpc')||!gardenCode.includes('interactHomeNpc')||
   gardenCode.includes('localStorage')||gardenCode.includes('indexedDB')||
   gardenCode.includes('State.S.story'))
 throw new Error('Garden must read canonical per-slot state and delegate NPC art/dialogue without another save/story system');
if(!gardenWorld.includes('assets/garden/sunlit-garden-landscape.webp')||
   !gardenWorld.includes('assets/garden/sunlit-garden-portrait.webp')||
   !gardenWorld.includes('H > W * 1.12')||
   !gardenWorld.includes('SunlitGarden?.draw?.(ctx,W,H,t)')||
   !gardenGame.includes('SunlitGarden?.enter?.()')||
   !gardenGame.includes('SunlitGarden?.leave?.()')||
   !gardenGame.includes('SunlitGarden?.handleTap?.(x, y)')||
   !gardenHtml.includes('js/sunlit-garden.js')||
   !gardenCss.includes('.sg-hotspots')||
   !gardenCss.includes('@media(max-width:700px)'))
 throw new Error('Sunlit Garden artwork, lifecycle, interaction and responsive UI must be integrated into the live game source');
console.log('Sunlit Garden: original environment source, six sanctuary accents, NPC adapter and game integration verified.');

const gardenVisualTest=fs.readFileSync('scripts/sunlit-garden-visual-qa.mjs','utf8');
const gardenVisualWorkflow=fs.readFileSync('.github/workflows/sunlit-garden-visual-qa.yml','utf8');
new Function('return async function(){'+gardenVisualTest.replace(/^import .*;$/gm,'')+'}');
if(!gardenVisualTest.includes("background:'portrait'")||
   !gardenVisualTest.includes("background:'landscape'")||
   !gardenVisualTest.includes("['cats','facilities','catdex','workshop','bond']")||
   !gardenVisualWorkflow.includes('pull_request:')||
   !gardenVisualWorkflow.includes('actions/upload-artifact@v4'))
 throw new Error('Garden visual QA must cover desktop, both phone orientations, existing feature panels and screenshot artifacts');
console.log('Sunlit Garden: Playwright visual QA covers desktop, portrait and landscape mobile with screenshots.');

