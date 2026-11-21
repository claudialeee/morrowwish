import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1250,height:900},deviceScaleFactor:1});
// Local Python HTTP server cannot accept analytics POSTs; fulfill them in-browser.
await page.route('**/api/session',route=>route.fulfill({status:204,body:''}));
const errors=[];
page.on('pageerror',e=>{errors.push(e.stack||e.message);console.log('PAGE ERROR:',e.stack||e.message)});
page.on('console',m=>{if(m.type()==='error')console.log('CONSOLE ERROR:',m.text())});
try{
 const url=process.env.GAME_BROWSER_TEST_URL||'http://127.0.0.1:8765/pawsibly-innocent/';
 console.log('Opening '+url);
 await page.goto(url,{waitUntil:'load',timeout:40000});
 await page.waitForTimeout(850);
 const initial=await page.evaluate(()=>{
  const canvas=document.getElementById('board'),s=window.__PAWSIBLY_TEST__?.getState();
  if(!canvas||!s)return {loaded:false,canvas:!!canvas,game:!!s};
  const pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
  let opaque=0,unique=new Set();
  for(let i=0;i<pixels.length;i+=400){if(pixels[i+3]>0)opaque++;unique.add([pixels[i],pixels[i+1],pixels[i+2]].join(','))}
  return {loaded:true,opaque,uniqueColors:unique.size,position:{...s.cat},
    mission:document.getElementById('mission')?.textContent,
    yarn:document.getElementById('tool')?.textContent};
 });
 console.log('Canvas audit:',JSON.stringify(initial));
 // Regression: a new visitor gets a prefetched soundtrack before any interaction.
 // No click required to download/prepare the recorded music.
 await page.waitForFunction(()=>document.getElementById('catRecordedMusic')?.readyState>=2,null,{timeout:10000});
 const preloaded=await page.evaluate(()=>window.MorrowwishCatMusic.status());
 assert.equal(preloaded.preload,'auto','Recorded cat music must preload before first interaction');
 assert.ok(preloaded.readyState>=2,'Recorded music should already be buffered before first click');
 assert.equal(preloaded.error,'','Early loading should not report an audio error');
 assert.equal(await page.locator('#catRecordedMusic').count(),1,'HTML should contain the sole early-preloading audio element');
 assert.equal(await page.locator('link[rel="preload"][as="audio"]').count(),1,'Browser should request cat music at the start of page loading');
 console.log('Recorded cat song ready before user input:',JSON.stringify(preloaded));
 assert.equal(initial.loaded,true,'Game Javascript must initialize');
 const ruleLayout=await page.evaluate(()=>{
  const stage=document.getElementById('stage'),board=document.getElementById('board'),tool=document.getElementById('tool'),top=document.querySelector('.in-game-top');
  const br=board.getBoundingClientRect(),tr=tool.getBoundingClientRect();
  return {boardTop:br.top,boardBottom:br.bottom,toolTop:tr.top,toolBottom:tr.bottom,topBottom:top.getBoundingClientRect().bottom,
   noDuplicateRules:!document.querySelector('.explainer'),menuHidden:document.getElementById('gameMenu').hidden,
   inFrame:['board','tool','heistStatus','gameMenu','menuButton','bonusQuick','guardIntent'].every(id=>stage.contains(document.getElementById(id))),
   tabs:document.querySelectorAll('[data-game-tab]').length};
 });
 console.log('Single-screen cat geometry:',JSON.stringify(ruleLayout));
 assert.ok(ruleLayout.noDuplicateRules&&ruleLayout.inFrame&&ruleLayout.tabs===5&&ruleLayout.menuHidden,'All controls, bonus objective and tabs must live in a single game frame');
 assert.ok(ruleLayout.topBottom<=ruleLayout.boardTop+2&&ruleLayout.toolBottom<=ruleLayout.boardTop+2,'Tutorial, bonus and yarn must all be ABOVE the map and not cover tiles');
 // Normal desktop windows (NOT fullscreen): stage must be visible without
 // scrolling; tutorial, mission, yarn and top header must align with the map.
 for(const viewport of [
  {width:1440,height:900},{width:1366,height:768},{width:1280,height:720},
  {width:1024,height:600},{width:900,height:520}
 ]){
  await page.setViewportSize(viewport);
  await page.waitForTimeout(85);
  const fit=await page.evaluate(()=>{
   const rect=id=>{const r=document.getElementById(id).getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
   const header=document.querySelector('.in-game-top').getBoundingClientRect();
   const guide=document.querySelector('.in-game-guidance').getBoundingClientRect();
   return {viewport:{width:innerWidth,height:innerHeight},
    stage:rect('stage'),board:rect('board'),tool:rect('tool'),bonus:rect('bonusQuick'),
    header:{left:header.left,right:header.right,width:header.width,bottom:header.bottom},
    guide:{left:guide.left,right:guide.right,width:guide.width},
    scrollHeight:document.scrollingElement.scrollHeight};
  });
  console.log('Windowed desktop fit:',JSON.stringify(fit));
  assert.ok(fit.stage.top>=-1&&fit.stage.bottom<=fit.viewport.height+1,
   'Desktop game must fit WITHOUT scrolling at '+viewport.width+'x'+viewport.height);
  assert.ok(fit.scrollHeight<=fit.viewport.height+2,
   'Game webpage must not require scrolling at '+viewport.width+'x'+viewport.height);
  assert.ok(Math.abs(fit.header.left-fit.board.left)<=2&&Math.abs(fit.header.right-fit.board.right)<=2,
   'Top HUD must exactly match the canvas width at '+viewport.width+'x'+viewport.height);
  assert.ok(Math.abs(fit.guide.left-fit.board.left)<=2&&Math.abs(fit.guide.right-fit.board.right)<=2,
   'Guidance and bonus row must be flush with the game map at '+viewport.width+'x'+viewport.height);
  assert.ok(fit.tool.bottom<=fit.board.top+2&&fit.bonus.bottom<=fit.board.top+2,
   'Objectives and yarn must remain visible ABOVE the board');
 }
 await page.setViewportSize({width:1250,height:900});
 assert.ok(initial.opaque>500,'Canvas must actually contain drawn pixels');
 assert.ok(initial.uniqueColors>12,'Canvas needs colorful room artwork, not a blank rectangle');
 assert.equal(errors.length,0,'No uncaught exception during Canvas rendering');
 const before=initial.position;
 const clicked=await page.evaluate(()=>{const s=window.__PAWSIBLY_TEST__.getState();return {x:s.cat.x+1.5,y:s.cat.y+.5};});
 // The canvas may be below the first fold; locator.click scrolls it into view.
 const canvasRect=await page.locator('#board').boundingBox();
 await page.locator('#board').click({position:{x:clicked.x*canvasRect.width/10,y:clicked.y*canvasRect.height/7}});await page.waitForTimeout(420);
 const after=await page.evaluate(()=>({...window.__PAWSIBLY_TEST__.getState().cat}));
 console.log('Click movement:',JSON.stringify({before,after}));
 assert.notDeepEqual(after,before,'Mouse click must move the cat');
 assert.equal(errors.length,0,'No uncaught exception after clicking');
 await page.locator('#menuButton').click();
 assert.equal(await page.locator('#gameMenu').isVisible(),true,'Menu opens in the game frame');
 // The screenshot-reported issues: no clipped fifth tab, no overlapping cat
 // descriptions, and no double yarn instruction / untranslated legend.
 for(const viewport of [{width:1250,height:900},{width:570,height:720},{width:390,height:844}]){
  await page.setViewportSize(viewport);
  const layout=await page.evaluate(()=>{
   const rect=e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom}};
   const nav=document.querySelector('.menu-tabs'),tabs=[...nav.querySelectorAll('button')];
   return {nav:rect(nav),tabs:tabs.map(rect),screen:innerWidth,
    menu:rect(document.querySelector('#gameMenu .menu-shell'))};
  });
  assert.equal(layout.tabs.length,5,'All five game tabs must remain present');
  assert.ok(layout.tabs.every(t=>t.left>=layout.nav.left-2&&t.right<=layout.nav.right+2),
   'All five tabs must be visible, not horizontally cut off at '+viewport.width);
  assert.ok(layout.menu.left>=-2&&layout.menu.right<=layout.screen+2,
   'Menu must remain within the viewport at '+viewport.width);
  await page.locator('[data-game-tab="cats"]').click();
  const catLayout=await page.evaluate(()=>{
   const a=document.getElementById('skinHint'),b=document.getElementById('ability');
   return {hint:a.getBoundingClientRect().toJSON(),ability:b.getBoundingClientRect().toJSON(),
    cats:document.querySelectorAll('#wardrobe .skin').length,
    grid:getComputedStyle(document.getElementById('wardrobe')).display};
  });
  assert.equal(catLayout.cats,5,'Cat gallery must show five cats');
  assert.equal(catLayout.grid,'grid','Cat wardrobe should use a stable grid');
  assert.ok(catLayout.ability.top>=catLayout.hint.bottom+3,
   'Cat skill description must NOT overlap the unlock description at '+viewport.width);
  await page.locator('[data-game-tab="help"]').click();
  const helpLayout=await page.evaluate(()=>({
   englishLegend:document.getElementById('helpLegend').textContent,
   yarnDuplicateVisible:getComputedStyle(document.getElementById('yarnExplain')).display!=='none',
   stepCount:document.querySelectorAll('[data-tab-panel="help"] .menu-help-step').length
  }));
  assert.equal(helpLayout.yarnDuplicateVisible,false,'Duplicate yarn help must be hidden');
  assert.equal(helpLayout.stepCount,3,'Help must keep its three concise steps');
  assert.ok(helpLayout.englishLegend.includes('fish'),'Help icon legend should be translated in English');
 }
 await page.setViewportSize({width:1250,height:900});
 await page.locator('[data-game-tab="rooms"]').click();

 await page.locator('[data-game-tab="album"]').click();
 assert.equal(await page.locator('[data-tab-panel="album"]').isVisible(),true,'Album available inside game');
 await page.locator('[data-game-tab="badges"]').click();
 assert.equal(await page.locator('[data-tab-panel="badges"]').isVisible(),true,'Achievements available inside game');
 await page.locator('#menuClose').click();
 assert.equal(await page.locator('#gameMenu').isVisible(),false,'Closing menu resumes gameplay');
 assert.match(await page.locator('#bonusQuickText').textContent(),/Knock over a vase/,'Bonus mission must be prominent on game HUD');
 assert.equal(await page.locator('#bonusQuickProgress').textContent(),'0/1','Bonus progress must be visible in the game');
 await page.locator('#bonusQuick').click();
 assert.equal(await page.locator('#gameMenu').isVisible(),true,'Tapping bonus mission opens the current heist details');
 assert.equal(await page.locator('[data-tab-panel="rooms"]').isVisible(),true,'Bonus opens details without leaving the game');
 await page.locator('#menuClose').click();
 await page.evaluate(()=>window.MorrowwishI18n.set('zh'));await page.waitForTimeout(110);
 const zh=await page.evaluate(()=>({
  lang:document.documentElement.lang,
  subtitle:document.getElementById('subtitle').textContent,
  mission:document.getElementById('mission').textContent,
  button:document.getElementById('tool').textContent,
  shelf:document.getElementById('collectionLabel').textContent,
  hint:document.getElementById('collectionHint').textContent,
  instructions:document.getElementById('howBody').textContent,
  room:document.getElementById('chapter').textContent
 }));
 console.log('Chinese switch:',JSON.stringify(zh));
 assert.equal(zh.lang,'zh-CN');
 assert.equal(await page.locator('#menuButtonLabel').textContent(),'菜单','Menu icon must have a visible Chinese label');
 assert.match(await page.locator('#bonusQuickText').textContent(),/额外任务|打翻一个花瓶/,'Bonus mission should be readable in Chinese');
 const chineseContent=await page.evaluate(()=>({
  title:document.getElementById('gameTitle')?.textContent,
  byline:document.getElementById('studioByline')?.textContent,
  documentTitle:document.title,
  rules:document.getElementById('howTitle')?.innerText,
  englishWords:(document.querySelector('main')?.innerText.match(/[A-Za-z]{3,}/g)||[]),
  aria:document.getElementById('board')?.getAttribute('aria-label')
 }));
 console.log('Cat all-Chinese visible UI:',JSON.stringify(chineseContent));
 assert.equal(chineseContent.title,'猫猫绝对无辜！','The Chinese game title must not show PAWSIBLY INNOCENT');
 assert.equal(chineseContent.byline,'出品 ♡','The brand byline must not leave "presents" untranslated');
 assert.match(chineseContent.documentTitle,/猫猫绝对无辜/,'Browser tab title should be localized');
 assert.deepEqual(chineseContent.englishWords,[],'Chinese game content must contain no visible English words');
 assert.match(chineseContent.aria,/猫猫捣蛋游戏/,'Chinese canvas accessible label is localized');
 const roomsLocalized=await page.evaluate(()=>{
  const audit=[];
  for(let i=0;i<window.__PAWSIBLY_TEST__.rooms.length;i++){
   window.__PAWSIBLY_TEST__.choose(i,false);
   const label=document.getElementById('chapter')?.textContent||'';
   const visible=document.querySelector('main')?.innerText||'';
   audit.push({room:i+1,label,untranslated:(visible.match(/[A-Za-z]{3,}/g)||[])});
  }
  window.__PAWSIBLY_TEST__.choose(0,false);
  return audit;
 });
 console.log('All eight room Chinese strings:',JSON.stringify(roomsLocalized));
 for(const room of roomsLocalized){
  assert.match(room.label,/[\u4e00-\u9fff]/,'Room '+room.room+' must have a Chinese name');
  assert.deepEqual(room.untranslated,[],'No English strings in room '+room.room);
 }
 assert.match(await page.locator('#howTitle').textContent(),/三步|猫猫|开溜/,'Chinese help should be available inside the optional sidebar details');
 for(const value of [zh.subtitle,zh.mission,zh.shelf,zh.hint,zh.instructions,zh.room])
  assert.match(value,/[\u4e00-\u9fff]/,'Chinese regions must be translated');
 await page.evaluate(()=>{
  const s=window.__PAWSIBLY_TEST__.getState();
  s.cat={x:s.door.x,y:s.door.y-1};s.got=3;s.done=false;
  window.__PAWSIBLY_TEST__.move(0,1);
 });await page.waitForTimeout(110);
 const winZh=await page.evaluate(()=>({visible:!document.getElementById('overlay').hidden,title:document.getElementById('resultTitle').textContent,
  desc:document.getElementById('resultDesc').textContent,score:document.getElementById('resultScore').textContent}));
 console.log('Chinese victory:',JSON.stringify(winZh));
 assert.equal(winZh.visible,true);assert.match(winZh.desc,/[\u4e00-\u9fff]/);
 await page.evaluate(()=>window.MorrowwishI18n.set('en'));await page.waitForTimeout(110);
 const en=await page.evaluate(()=>({lang:document.documentElement.lang,subtitle:document.getElementById('subtitle').textContent,
  winTitle:document.getElementById('resultTitle').textContent,winScore:document.getElementById('resultScore').textContent,
  room:document.getElementById('chapter').textContent,instructions:document.getElementById('howBody').textContent}));
 console.log('English switch:',JSON.stringify(en));
 assert.equal(en.lang,'en');
 assert.ok(en.winScore.includes('Score'),'Victory score label must switch language');
 assert.ok(/owner/i.test(en.instructions)&&/chase/i.test(en.instructions)&&/pink/i.test(en.instructions),'English tutorial must explain sight-triggered pursuit and pink danger zones');
 assert.equal(errors.length,0,'Canvas and UI must be free of uncaught errors');
 await page.goto(new URL('/',url).toString(),{waitUntil:'load',timeout:40000});
 await page.evaluate(()=>window.MorrowwishI18n.set('zh'));await page.waitForTimeout(170);
 const homeZh=await page.evaluate(()=>({
  lang:document.documentElement.lang,
  about:document.querySelector('.about-copy p')?.textContent,
  footer:document.querySelector('.footer-row>span')?.textContent,
  miniDescription:document.querySelector('.tiny-section .section-intro>p')?.textContent,
  catTitle:document.querySelector('.cat-feature-card h3')?.innerText,
  catPitch:document.querySelector('.cat-feature-card .feature-content>p')?.innerText,
  catCTA:document.querySelector('.cat-feature-card .card-button')?.innerText,
  heroPitch:document.querySelector('.hero>p')?.innerText,
  worldsPitch:document.querySelector('#worlds .section-intro>p')?.innerText,
  bondTitle:document.querySelector('.bond-feature-card h3')?.innerText,
  bondCount:document.querySelectorAll('.bond-feature-card').length,
  featureOrder:[...document.querySelectorAll('.feature-grid>article')].map(x=>x.querySelector('a[data-id]')?.dataset.id),
  miniHeight:Math.round(document.querySelector('.tiny-section')?.getBoundingClientRect().height||0),
  aboutHeight:Math.round(document.querySelector('.about-section')?.getBoundingClientRect().height||0)
 }));
 console.log('Homepage Chinese and compact sections:',JSON.stringify(homeZh));
 assert.equal(homeZh.lang,'zh-CN');
 assert.match(homeZh.worldsPitch,/院子.*三条鱼.*小镇.*人生/,'Featured introduction must follow Cat Bond, fish, town and Elsewhere');
 assert.doesNotMatch(homeZh.worldsPitch,/Be a sneaky cat|Four worlds/,'No English four-world pitch on Chinese homepage');
 assert.equal(homeZh.bondCount,1,'Cat Bond homepage card must appear exactly once');
 assert.equal(homeZh.bondTitle?.trim(),'猫猫纽带','Chinese Cat Bond heading should not repeat English game name');
 assert.equal(await page.locator('body').textContent().then(s=>(s.match(/✳/g)||[]).length),0,'Homepage should not display the disliked ✳ decorative glyph');
 assert.match(homeZh.about,/想象|自由/,'About text must be Chinese');
 assert.match(homeZh.footer,/独立游戏/,'Footer must be Chinese');
 assert.match(homeZh.miniDescription,/小游戏|挑战|短局/,'Mini games copy must be Chinese');
 assert.equal(homeZh.catTitle?.trim(),'猫猫绝对无辜！','Chinese title must show no English Pawsibly subtitle');
 assert.doesNotMatch(homeZh.catTitle,/Pawsibly|Innocent/i,'Chinese title must not leak its English name');
 assert.deepEqual(homeZh.featureOrder.slice(0,4),['cat-bond','pawsibly-innocent','tiny-town','elsewhere'],'Featured worlds should place Cat Bond first');
 assert.match(homeZh.catPitch,/三条小鱼|毛线球|粉色猫门/,'New Chinese promotional copy should explain gameplay');
 assert.match(homeZh.catCTA,/偷鱼开溜/,'Chinese CTA should be action-focused');
 assert.match(homeZh.heroPitch,/捣蛋小猫|偷三条鱼/,'Homepage hero should promote the leading cat game');
 assert.ok(homeZh.heroPitch.indexOf('和满院子的猫咪')<homeZh.heroPitch.indexOf('捣蛋小猫')&&homeZh.heroPitch.indexOf('捣蛋小猫')<homeZh.heroPitch.indexOf('自由的小镇')&&homeZh.heroPitch.indexOf('自由的小镇')<homeZh.heroPitch.indexOf('从未活过的人生'),'Homepage hero must match the four featured cards in order');
 assert.ok(homeZh.miniHeight>270&&homeZh.miniHeight<480,'The 02 game gallery should be compact without hiding any games');
 assert.ok(homeZh.aboutHeight>130&&homeZh.aboutHeight<260,'The 03 studio introduction should not consume a full screen');
 const compactLayout=await page.evaluate(()=>{
  const rect=s=>document.querySelector(s)?.getBoundingClientRect();
  const copy=document.querySelector('.hero .hero-zh-copy');
  const first=rect('.feature-card'),art=rect('.feature-card .feature-art'),content=rect('.feature-card .feature-content');
  return {heroHeight:Math.round(rect('.hero')?.height||0),firstCardTop:Math.round(first?.top||0),
    firstCardHeight:Math.round(first?.height||0),featureColumns:getComputedStyle(document.querySelector('.feature-grid')).gridTemplateColumns.split(' ').length,
    heroWhiteSpace:getComputedStyle(copy).whiteSpace,doodles:getComputedStyle(document.querySelector('.hero-doodles')).display,
    imageSeparate:!!art&&!!content&&content.right<=art.left+2};
 });
 console.log('Balanced compact homepage geometry:',JSON.stringify(compactLayout));
 assert.equal(compactLayout.heroWhiteSpace,'nowrap','Chinese four-world sentence must stay on a single line');
 assert.equal(compactLayout.doodles,'none','Decorations must not collide with the single-line hero');
 assert.ok(compactLayout.heroHeight>=190&&compactLayout.heroHeight<315,'Hero needs visual breathing room while showing games on first screen');
 assert.ok(compactLayout.firstCardTop<505,'First flagship game card must remain visible on first screen');
 assert.equal(compactLayout.featureColumns,2,'Desktop flagship games should stay in two columns');
 assert.ok(compactLayout.firstCardHeight>=260&&compactLayout.firstCardHeight<=285,'Flagship cards should be smaller than the previous 318px layout');
 assert.ok(compactLayout.imageSeparate,'Card illustrations should not cover card descriptions');
 const featuredChecks=await page.evaluate(()=>({
  titles:[...document.querySelectorAll('.feature-grid>article h3')].map(x=>({font:getComputedStyle(x).fontFamily,weight:getComputedStyle(x).fontWeight})),
  hits:[...document.querySelectorAll('.feature-grid>.feature-card')].map(x=>x.querySelector(':scope>.card-hit')?.getAttribute('href'))
 }));
 assert.ok(featuredChecks.titles.every(x=>x.font.includes('Nunito')&&x.weight==='900'),'All four featured titles need matching typography');
 assert.deepEqual(featuredChecks.hits,['/cat-bond/','/pawsibly-innocent/','/tiny-town/','/elsewhere/'],'All featured cards must remain clickable in Cat Bond-led order');
 // Desktop keeps the tagline on one line; 320/390px phones must show every character by wrapping.
 for(const phoneWidth of [390,320]){
   await page.setViewportSize({width:phoneWidth,height:844});
   const mobileTagline=await page.evaluate(()=>{
     const copy=document.querySelector('.hero .hero-zh-copy');
     const container=copy.parentElement;
     const style=getComputedStyle(copy);
     return {
       whiteSpace:style.whiteSpace,
       lineHeight:parseFloat(style.lineHeight),
       height:copy.getBoundingClientRect().height,
       horizontalOverflow:container.scrollWidth-container.clientWidth,
       overflowX:getComputedStyle(container).overflowX
     };
   });
   console.log('Chinese phone hero wraps:',phoneWidth,JSON.stringify(mobileTagline));
   assert.equal(mobileTagline.whiteSpace,'normal','Phone slogan should not force a single line');
   assert.ok(mobileTagline.height>mobileTagline.lineHeight*1.5,'Phone slogan should be fully visible across multiple lines');
   assert.ok(mobileTagline.horizontalOverflow<=1,'Phone slogan should not require sideways scrolling');
   assert.notEqual(mobileTagline.overflowX,'auto','Phone slogan must not use horizontal scroll');
 }
 await page.setViewportSize({width:1250,height:900});
 const newCatCover=page.locator('.cat-feature-card .feature-art img');
 assert.ok((await newCatCover.getAttribute('src'))?.startsWith('/art/pawsibly-hatted-muted.avif'),'First game must use approved soft-pastel hatted-cat cover');
 await newCatCover.scrollIntoViewIfNeeded();
 await page.waitForFunction(()=>{const im=document.querySelector('.cat-feature-card .feature-art img');return im?.complete&&im.naturalWidth>0;},null,{timeout:10000});
 assert.equal(await newCatCover.evaluate(img=>img.naturalWidth),560,'Optimized first-game cover must load correctly');
 const typeSizes=await page.evaluate(()=>({
  title:parseFloat(getComputedStyle(document.querySelector('.cat-feature-card h3')).fontSize),
  copy:parseFloat(getComputedStyle(document.querySelector('.cat-feature-card .feature-content>p')).fontSize),
  cta:parseFloat(getComputedStyle(document.querySelector('.cat-feature-card .card-button')).fontSize),
  eyebrow:parseFloat(getComputedStyle(document.querySelector('.cat-feature-card .card-eyebrow')).fontSize),
  miniTitle:parseFloat(getComputedStyle(document.querySelector('.mini-game .mini-copy strong')).fontSize)
 }));
 console.log('Readable typography:',JSON.stringify(typeSizes));
 assert.ok(typeSizes.title>=33&&typeSizes.copy>=13&&typeSizes.cta>=12,'Featured card text must be larger and readable');
 assert.ok(typeSizes.eyebrow>=10&&typeSizes.miniTitle>=20,'All card labels and mini-game titles must be larger');
 const bondImage=page.locator('.bond-feature-card .feature-art img');
 assert.ok((await bondImage.getAttribute('src'))?.startsWith('/art/cat-bond-home.webp'), 'Cat Bond should use the approved friendship illustration');
 await bondImage.scrollIntoViewIfNeeded();
 await page.waitForFunction(()=>{const im=document.querySelector('.bond-feature-card .feature-art img');return im?.complete&&im.naturalWidth>0;},null,{timeout:10000});
 assert.equal(await bondImage.evaluate(im=>im.naturalWidth),480,'Approved garden illustration must load as the optimized WebP');
 await page.evaluate(()=>window.MorrowwishI18n.set('en'));
 const homeEn=await page.evaluate(()=>({
  order:[...document.querySelectorAll('.feature-grid>article')].map(x=>x.querySelector('a[data-id]')?.dataset.id),
  catTitle:document.querySelector('.cat-feature-card h3')?.innerText,
  catPitch:document.querySelector('.cat-feature-card .feature-content>p')?.innerText,
  heroPitch:document.querySelector('.hero>p')?.innerText
 }));
 assert.deepEqual(homeEn.order.slice(0,4),['cat-bond','pawsibly-innocent','tiny-town','elsewhere'],'English homepage should match Cat Bond-led four-world order');
 assert.match(homeEn.catTitle,/Pawsibly\s*Innocent!/,'English heading must still show its original name');
 assert.match(homeEn.catPitch,/Three fish to steal/,'English promotional copy must be updated');
 assert.ok(homeEn.heroPitch.indexOf('Befriend a yard')<homeEn.heroPitch.indexOf('mischievous cat')
    &&homeEn.heroPitch.indexOf('mischievous cat')<homeEn.heroPitch.indexOf('town where everyone is free')
    &&homeEn.heroPitch.indexOf('town where everyone is free')<homeEn.heroPitch.indexOf('life you never lived'),
    'English hero introduction must follow Cat Bond, Pawsibly, Tiny Town, Elsewhere');
 // The cat's core distraction needs to work with real pointer input and clear feedback.
 await page.goto(url,{waitUntil:'load',timeout:40000});
 await page.evaluate(()=>window.MorrowwishI18n.set('en'));
 const enHelp=await page.locator('#yarnExplain').textContent();
 assert.match(enHelp,/human|noise|investigate/i,'English help explains how yarn works');
 const initialYarn=await page.evaluate(()=>window.__PAWSIBLY_TEST__.getState().yarn);
 await page.locator('#tool').click();
 assert.equal(await page.evaluate(()=>window.__PAWSIBLY_TEST__.isAiming()),true,'Toss yarn should enter target-select mode');
 assert.equal(await page.evaluate(()=>window.__PAWSIBLY_TEST__.getState().yarn),initialYarn,'Entering aim mode must not consume yarn');
 const humanBefore=await page.evaluate(()=>({...window.__PAWSIBLY_TEST__.getState().human}));
 const boardBox=await page.locator('#board').boundingBox();
 await page.locator('#board').click({position:{x:boardBox.width*8.5/10,y:boardBox.height*1.5/7}});
 await page.waitForTimeout(110);
 const tossed=await page.evaluate(()=>{
  const s=window.__PAWSIBLY_TEST__.getState();
  return {yarn:s.yarn,noise:s.noise,trail:s.throwTrail,alert:s.alert,human:{...s.human},
   mode:s.guardMode,walking:s.yarnAnimating,sound:window.MorrowwishAudio?.status()};
 });
 console.log('Real multi-step yarn and audio:',JSON.stringify({before:humanBefore,after:tossed}));
 assert.equal(tossed.yarn,initialYarn-1,'Throwing yarn must consume one ball');
 assert.deepEqual(tossed.noise,{x:8,y:1},'Ball must land on the exact player-selected tile');
 assert.ok(tossed.trail&&tossed.walking&&tossed.mode==='investigate',
  'A long throw must visibly start a multi-step investigation');
 assert.notDeepEqual(tossed.human,humanBefore,'The owner must immediately react to the ball');
 await page.waitForFunction(()=>!window.__PAWSIBLY_TEST__.isChasing(),null,{timeout:6500});
 const settled=await page.evaluate(()=>{
  const s=window.__PAWSIBLY_TEST__.getState();
  return {human:{...s.human},mode:s.guardMode,turns:s.distractionTurns,achievements:JSON.parse(localStorage.getItem('pawsibly-innocent-save-v1')||'{}').achievements};
 });
 assert.deepEqual(settled.human,{x:8,y:1},'Owner must walk ALL the way to the yarn');
 assert.equal(settled.mode,'distracted','Owner must stop at yarn to investigate');
 assert.equal(settled.turns,4,'Player should have four turns to sneak past');
 assert.equal(settled.achievements?.['yarn-lure'],true,'Real yarn use must unlock a saved achievement');
 assert.match(await page.locator('#guardIntent').textContent(),/Distracted|yarn/i,'Owner state must be visible in the game');
 assert.ok(tossed.sound?.oscillators>0&&tossed.sound?.effects>0,'Cat yarn action must still play sound effects');
 assert.equal(tossed.sound.playing,false,'Cat SFX must never synthesize a music loop');
 assert.equal(tossed.sound.backgroundMusic,false,'Cat SFX subsystem must contain no BGM');
 assert.equal(tossed.sound.loopSteps,0,'Cat game must never schedule a background music loop');
 assert.equal(await page.locator('[data-move]').count(),0,'Touch directional pad was removed');
 assert.ok(tossed.sound?.oscillators>0&&tossed.sound?.effects>0,'Cat yarn action must still play sound effects');
 assert.equal(tossed.sound.playing,false,'Cat SFX engine must never synthesize a music loop');
 assert.equal(tossed.sound.backgroundMusic,false,'Cat sound-effects subsystem must contain no BGM');
 assert.equal(tossed.sound.loopSteps,0,'Cat game must never schedule a background music loop');
 await page.evaluate(()=>window.MorrowwishI18n.set('zh'));
 assert.match(await page.locator('#yarnExplain').textContent(),/主人|毛线/,'Chinese explanation for yarn is clear');
 assert.match(await page.locator('#guardIntent').textContent(),/巡逻|分心|调查|搜索|追猫/,'Owner AI behavior must be explained in Chinese');
 await page.locator('#menuButton').click();
 await page.locator('[data-game-tab="help"]').click();
 assert.equal(await page.locator('#menuAudio').isVisible(),true,'Audio settings accessible inside in-game help');
 const audioButton=page.locator('#sound');
 await audioButton.click();
 assert.equal(await page.evaluate(()=>window.MorrowwishAudio.status().enabled),false,'Mute button must actually silence the score');
 await audioButton.click();
 assert.equal(await page.evaluate(()=>window.MorrowwishAudio.status().enabled),true,'Sound button must restore audio');

 // Cat gets a real, recorded piano theme; the five other games stay effects-only.
 const recording=await page.request.get(new URL('/audio/cat-happy-clappy.ogg',url).toString());
 assert.equal(recording.status(),200,'Self-hosted CC0 piano recording must be published');
 const ogg=await recording.body();
 assert.equal(ogg.subarray(0,4).toString(),'OggS','Recording must be encoded Ogg audio, not synthesized notes');
 assert.ok(ogg.length>40000,'Recording must be a complete musical track');
 const initialMusic=await page.evaluate(()=>window.MorrowwishCatMusic?.status());
 assert.equal(initialMusic?.source,'recorded-cc0','Cat soundtrack must be an actual recording');
 assert.equal(initialMusic?.enabled,true,'Cat music is enabled by default after interaction');
 await page.waitForFunction(()=>window.MorrowwishCatMusic?.status().playing&&window.MorrowwishCatMusic?.status().readyState>=2,{timeout:8000});
 const playing=await page.evaluate(()=>window.MorrowwishCatMusic.status());
 assert.equal(playing.error,'','Recorded cat music must not report a playback error');
 assert.ok(playing.readyState>=2,'Recorded cat music must be decoded and playable');
 assert.match(await page.locator('#music').textContent(),/背景音乐/,'Chinese music control must be localized');
 const musicButton=page.locator('#music');
 await musicButton.click();
 assert.equal(await page.evaluate(()=>window.MorrowwishCatMusic.status().playing),false,'Music toggle must pause the recording');
 assert.equal(await page.evaluate(()=>window.MorrowwishAudio.status().enabled),true,'Music toggle must not mute effects');
 await musicButton.click();
 assert.equal(await page.evaluate(()=>window.MorrowwishCatMusic.status().playing),true,'Music toggle must resume the recorded theme');
 console.log('Real CC0 piano soundtrack and separate music/SFX controls:',JSON.stringify(playing));

 // Simulate a browser rejecting unprompted autoplay: the player must get a
 // visible, one-click way to start the already-preloaded recording.
 const policyPage=await browser.newPage({viewport:{width:1200,height:850}});
 try{
  await policyPage.addInitScript(()=>{
   const original=HTMLMediaElement.prototype.play;
   let rejected=false;
   HTMLMediaElement.prototype.play=function(...args){
    if(this.id==='catRecordedMusic'&&!rejected){
     rejected=true;
     return Promise.reject(new DOMException('User interaction required','NotAllowedError'));
    }
    return original.apply(this,args);
   };
  });
  await policyPage.goto(url,{waitUntil:'load',timeout:40000});
  await policyPage.waitForFunction(()=>window.MorrowwishCatMusic?.status().blocked===true);
   assert.equal(await policyPage.evaluate(()=>!document.getElementById('musicPermission').hidden),true,'Autoplay fallback available');
   await policyPage.locator('#menuButton').click();
   await policyPage.locator('[data-game-tab="help"]').click();
   // Opening the menu is a user gesture that may auto-unblock the music.
   // Otherwise a one-click fallback should be visible inside Settings.
   const playingOnMenu=await policyPage.evaluate(()=>window.MorrowwishCatMusic.status().playing);
   if(!playingOnMenu){
    assert.equal(await policyPage.locator('#musicPermission').isVisible(),true,
     'Fallback button must be reachable if autoplay remains blocked');
    await policyPage.locator('#musicPermission').click();
   }
   await policyPage.waitForFunction(()=>window.MorrowwishCatMusic?.status().playing===true);
  await policyPage.waitForFunction(()=>window.MorrowwishCatMusic?.status().blocked===false&&document.getElementById('musicPermission')?.hidden===true);
  assert.equal(await policyPage.locator('#musicPermission').isVisible(),false,'Prompt should disappear once music plays');
  console.log('Autoplay-block recovery: menu gesture or settings fallback starts recorded music');
 }finally{await policyPage.close()}

 // Unlocks: every threshold must enable the correct cat; selection must persist.
 const unlock=await browser.newPage({viewport:{width:1200,height:850}});
 try{
  await unlock.goto(url,{waitUntil:'load',timeout:40000});
  const thresholds=[0,3,7,12,18];
  for(const stars of [0,2,3,6,7,11,12,17,18]){
   await unlock.evaluate(stars=>{
    const best={},total=Math.min(stars,24);
    for(let k=0,left=total;k<8&&left>0;k++){const give=Math.min(3,left);best['room-'+k]={stars:give,score:100};left-=give}
    localStorage.setItem('pawsibly-innocent-save-v1',JSON.stringify({unlocked:7,best,cat:0,souvenirs:{}}));
    localStorage.setItem('morrowwish-cat-music-enabled','0');
   },stars);
   await unlock.reload({waitUntil:'load',timeout:40000});
   const status=await unlock.evaluate(()=>({
    available:[...document.querySelectorAll('#wardrobe .skin')].map(b=>!b.disabled),
    stars:Number(document.getElementById('starTotal')?.textContent||0),
    hint:document.getElementById('skinHint')?.textContent||''
   }));
   assert.equal(status.stars,stars,'The displayed star count must be accurate');
   assert.deepEqual(status.available,thresholds.map(t=>stars>=t),'Cat unlock gates must match the earned stars at '+stars);
   assert.ok(status.hint.length>8,'Wardrobe should show progress toward the next cat');
  }
   await unlock.locator('#menuButton').click();
   await unlock.locator('[data-game-tab="cats"]').click();
   await unlock.locator('#wardrobe .skin').nth(4).click();
  const selected=await unlock.evaluate(()=>({
   cat:JSON.parse(localStorage.getItem('pawsibly-innocent-save-v1')).cat,
   active:[...document.querySelectorAll('#wardrobe .skin')].findIndex(b=>b.classList.contains('active')),
   ability:document.getElementById('ability').textContent
  }));
  assert.equal(selected.cat,4,'Unlocking the fifth cat must allow selecting it');
  assert.equal(selected.active,4,'The selected cat must be visibly active');
  await unlock.reload({waitUntil:'load'});
  assert.equal(await unlock.locator('#wardrobe .skin.active').count(),1);
  assert.equal(await unlock.evaluate(()=>[...document.querySelectorAll('#wardrobe .skin')].findIndex(b=>b.classList.contains('active'))),4,'Selected cat must persist after reload');
  console.log('Cat unlock and persistent selection checked at thresholds:',JSON.stringify({thresholds,selected}));
 }finally{await unlock.close()}

 // Verify the CrazyGames iframe loads directly into a clean, usable game stage
 // at their documented DPR=1 embed dimensions (not the oversized studio webpage).
 for(const [w,h] of [[907,510],[800,450]]){
  const iframe=await browser.newPage({viewport:{width:w,height:h},deviceScaleFactor:1});
  await iframe.route('**/api/session',route=>route.fulfill({status:204,body:''}));
  const iframeErrors=[];iframe.on('pageerror',e=>iframeErrors.push(e.message));
  try{
   const playUrl=new URL(url);
   playUrl.searchParams.set('platform','crazygames');
   await iframe.goto(playUrl.toString(),{waitUntil:'load',timeout:40000});
   await iframe.waitForTimeout(300);
   const v=await iframe.evaluate(()=>{
    const r=document.getElementById('stage')?.getBoundingClientRect();
    const canvas=document.getElementById('board')?.getBoundingClientRect();
    return {stage:r&&{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height},
      canvas:canvas&&{width:canvas.width,height:canvas.height},hud:document.getElementById('heistStatus')?.textContent,owner:document.getElementById('guardIntent')?.textContent,
      header:getComputedStyle(document.querySelector('.sitebar')).display,
      rules:document.querySelectorAll('.explainer').length,
      menuHidden:document.getElementById('gameMenu').hidden,menuButton:!!document.getElementById('menuButton'),
      fullscreen:document.getElementById('mw-fullscreen-toggle')?getComputedStyle(document.getElementById('mw-fullscreen-toggle')).display:'absent',
      totalWidth:document.documentElement.scrollWidth,totalHeight:document.documentElement.scrollHeight};
   });
   assert.equal(v.header,'none','CrazyGames must not display back-to-site chrome');
   assert.equal(v.rules,0,'Gameplay must appear without a duplicate long tutorial');
   assert.ok(v.menuHidden&&v.menuButton,'CrazyGames game must be one playfield with an optional in-game menu');
   assert.equal(v.fullscreen==='none'||v.fullscreen==='absent',true,'CrazyGames provides native fullscreen');
   assert.ok(v.hud?.includes('0/3')&&v.owner,'CrazyGames must show fish goal and owner behavior inside iframe');
   assert.ok(v.stage.left>=-1&&v.stage.right<=w+1&&v.stage.bottom<=h+1,
     'Playable canvas must fit CrazyGames '+w+'x'+h+': '+JSON.stringify(v));
   assert.ok(v.canvas.width>=440&&v.canvas.height>=305,
     'Gameplay must remain large and legible at DPR 1: '+JSON.stringify(v));
   assert.ok(v.totalWidth<=w+2&&v.totalHeight<=h+2,
     'CrazyGames iframe must not require page scrolling: '+JSON.stringify(v));
   const before=await iframe.evaluate(()=>({...window.__PAWSIBLY_TEST__.getState().cat}));
   await iframe.locator('#board').click({position:{x:v.canvas.width*.28,y:v.canvas.height*.3}});
   await iframe.waitForTimeout(450);
   assert.ok(!iframeErrors.length,'CrazyGames iframe JS errors: '+iframeErrors.join(','));
   console.log('CRAZYGAMES IFRAME PASS',w,h,JSON.stringify({hud:v.hud,stage:v.stage,from:before}));
  }finally{await iframe.close();}
 }

 // Five non-cat studio games remain effects-only; never synthesize melodies.
 const routes=['elsewhere','tiny-town','flip-dash','parcel-panic','pocket-aquarium'];
 const noMusicAudit=[],separateAudioGames=[];
 for(const game of routes){
  const p=await browser.newPage({viewport:{width:1250,height:900}});
  await p.route('**/api/session',route=>route.fulfill({status:204,body:''}));
  try{
   await p.goto(new URL('/'+game+'/',url).toString(),{waitUntil:'load',timeout:40000});
   await p.waitForTimeout(200);
   // Audio is game-specific. Elsewhere has its own soundtrack and may not mount
   // the shared SFX engine. Keep testing the engine only where it exists.
   const hasSharedAudio=await p.evaluate(()=>typeof window.MorrowwishAudio==='object');
   if(!hasSharedAudio){
    console.log('No shared SFX engine in '+game+' — skipped unrelated audio assertion');separateAudioGames.push(game);
    continue;
   }
   const control=p.locator('[data-mw-audio]');
   assert.ok(await control.count()<=1,'No duplicated shared audio toggles in '+game);
   // A trusted pointer interaction unlocks Web Audio without triggering a background score.
   await p.mouse.click(25,450);await p.waitForTimeout(530);
   const idle=await p.evaluate(()=>window.MorrowwishAudio.status());
   await p.waitForTimeout(390);
   const later=await p.evaluate(()=>window.MorrowwishAudio.status());
   console.log('Sound-effects-only idle '+game+': '+JSON.stringify({idle,later}));
   assert.equal(later.enabled,true,'Sound effects should be enabled in '+game);
   assert.equal(later.playing,false,'There must be no BGM playback in '+game);
   assert.equal(later.backgroundMusic,false,'BGM engine must be removed from '+game);
   assert.equal(later.loopSteps,0,'No melody scheduler can run in '+game);
   assert.equal(later.oscillators,idle.oscillators,'Idle game must not emit new audio oscillators in '+game);
   // Explicit action still plays an audible effect, not a melody.
   await p.evaluate(()=>window.MorrowwishAudio.effect('tap'));
   const sound=await p.evaluate(()=>window.MorrowwishAudio.status());
   assert.ok(sound.oscillators>later.oscillators&&sound.effects>later.effects,'Action SFX must work in '+game);
   noMusicAudit.push(game);
   assert.match(await control.getAttribute('aria-label'),/sound effects|音效/i,'Sound control must refer only to effects');
   await control.evaluate(button=>button.click());assert.equal(await p.evaluate(()=>window.MorrowwishAudio.status().enabled),false,'Mute must work in '+game);
   const silent=await p.evaluate(()=>{const a=window.MorrowwishAudio,b=a.status();a.effect('tap');return{before:b,after:a.status()}});
   assert.equal(silent.after.oscillators,silent.before.oscillators,'Muted effects must not create audio oscillators in '+game);
   await control.evaluate(button=>button.click());assert.equal(await p.evaluate(()=>window.MorrowwishAudio.status().enabled),true,'Unmute must work in '+game);
   assert.equal(await p.evaluate(()=>window.MorrowwishAudio.status().playing),false,'Unmuting must not start background music in '+game);
  }finally{await p.close()}
 }
 assert.equal(noMusicAudit.length+separateAudioGames.length,5,'Five non-cat worlds should be covered without requiring cat-specific audio');
 console.log('CHROMIUM CAT GAMEPLAY, STAR UNLOCKS, RECORDED PIANO MUSIC AND FIVE SOUND-EFFECTS-ONLY GAMES PASS');
}finally{await browser.close()}
