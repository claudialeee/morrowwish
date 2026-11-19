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
  const intro=document.querySelector('.explainer'),board=document.getElementById('board'),steps=intro?.querySelectorAll('.rule-step')||[];
  return{introTop:intro?.getBoundingClientRect().top,introBottom:intro?.getBoundingClientRect().bottom,
    boardTop:board?.getBoundingClientRect().top,steps:steps.length,
    ruleText:intro?.textContent,numberOfRules:document.querySelectorAll('.explainer').length,
    strayTip:document.querySelectorAll('#tip').length};
 });
 console.log('Above-board how-to guide:',JSON.stringify(ruleLayout));
 assert.equal(ruleLayout.numberOfRules,1,'Only one main rule guide should remain');
 assert.equal(ruleLayout.steps,3,'Rules must be grouped into three visible actions');
 assert.equal(ruleLayout.strayTip,0,'Do not duplicate the top three-step tutorial');
 assert.ok(ruleLayout.introBottom<ruleLayout.boardTop,'Game rules must be above the playable canvas');
 assert.ok(initial.opaque>500,'Canvas must actually contain drawn pixels');
 assert.ok(initial.uniqueColors>12,'Canvas needs colorful room artwork, not a blank rectangle');
 assert.equal(errors.length,0,'No uncaught exception during Canvas rendering');
 const before=initial.position;
 const clicked=await page.evaluate(()=>{const s=window.__PAWSIBLY_TEST__.getState(),b=document.getElementById('board').getBoundingClientRect();return {x:b.x+(s.cat.x+1.5)*b.width/10,y:b.y+(s.cat.y+.5)*b.height/7};});
 await page.mouse.click(clicked.x,clicked.y);await page.waitForTimeout(420);
 const after=await page.evaluate(()=>({...window.__PAWSIBLY_TEST__.getState().cat}));
 console.log('Click movement:',JSON.stringify({before,after}));
 assert.notDeepEqual(after,before,'Mouse click must move the cat');
 assert.equal(errors.length,0,'No uncaught exception after clicking');
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
 const chineseContent=await page.evaluate(()=>({
  title:document.getElementById('gameTitle')?.innerText,
  byline:document.getElementById('studioByline')?.innerText,
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
 assert.match(await page.locator('.explainer').textContent(),/三步学会|偷到三条|粉色猫门/,'Chinese rules must be visible above the board');
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
 assert.ok(en.instructions.includes('human'),'English tutorial must explain human movement');
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
  featureOrder:[...document.querySelectorAll('.feature-grid>article')].map(x=>x.querySelector('a[data-id]')?.dataset.id),
  miniHeight:Math.round(document.querySelector('.tiny-section')?.getBoundingClientRect().height||0),
  aboutHeight:Math.round(document.querySelector('.about-section')?.getBoundingClientRect().height||0)
 }));
 console.log('Homepage Chinese and compact sections:',JSON.stringify(homeZh));
 assert.equal(homeZh.lang,'zh-CN');
 assert.equal(await page.locator('body').textContent().then(s=>(s.match(/✳/g)||[]).length),0,'Homepage should not display the disliked ✳ decorative glyph');
 assert.match(homeZh.about,/想象|自由/,'About text must be Chinese');
 assert.match(homeZh.footer,/独立游戏/,'Footer must be Chinese');
 assert.match(homeZh.miniDescription,/小游戏|挑战|短局/,'Mini games copy must be Chinese');
 assert.equal(homeZh.catTitle?.trim(),'猫猫绝对无辜！','Chinese title must show no English Pawsibly subtitle');
 assert.doesNotMatch(homeZh.catTitle,/Pawsibly|Innocent/i,'Chinese title must not leak its English name');
 assert.deepEqual(homeZh.featureOrder,['pawsibly-innocent','elsewhere','tiny-town'],'Cat must be the first game on homepage');
 assert.match(homeZh.catPitch,/三条小鱼|毛线球|粉色猫门/,'New Chinese promotional copy should explain gameplay');
 assert.match(homeZh.catCTA,/偷鱼开溜/,'Chinese CTA should be action-focused');
 assert.match(homeZh.heroPitch,/捣蛋小猫|偷三条鱼/,'Homepage hero should promote the leading cat game');
 assert.ok(homeZh.heroPitch.indexOf('捣蛋小猫')<homeZh.heroPitch.indexOf('从未活过的人生')&&homeZh.heroPitch.indexOf('从未活过的人生')<homeZh.heroPitch.indexOf('自由的小镇'),'Hero copy must list cat, Elsewhere and town in their displayed order');
 assert.ok(homeZh.miniHeight>420&&homeZh.miniHeight<720,'The 02 game gallery must be comfortably sized');
 assert.ok(homeZh.aboutHeight>230&&homeZh.aboutHeight<420,'The 03 studio introduction should be medium-sized');
 await page.evaluate(()=>window.MorrowwishI18n.set('en'));
 const homeEn=await page.evaluate(()=>({
  order:[...document.querySelectorAll('.feature-grid>article')].map(x=>x.querySelector('a[data-id]')?.dataset.id),
  catTitle:document.querySelector('.cat-feature-card h3')?.innerText,
  catPitch:document.querySelector('.cat-feature-card .feature-content>p')?.innerText,
  heroPitch:document.querySelector('.hero>p')?.innerText
 }));
 assert.deepEqual(homeEn.order,['pawsibly-innocent','elsewhere','tiny-town'],'English homepage should share the same first-game order');
 assert.match(homeEn.catTitle,/Pawsibly\s*Innocent!/,'English heading must still show its original name');
 assert.match(homeEn.catPitch,/Three fish to steal/,'English promotional copy must be updated');
 assert.ok(homeEn.heroPitch.indexOf('mischievous cat')<homeEn.heroPitch.indexOf('life you never lived')&&homeEn.heroPitch.indexOf('life you never lived')<homeEn.heroPitch.indexOf('town where everyone is free'),'English hero copy must match cat, Elsewhere and town order');
 // The cat's core distraction needs to work with real pointer input and clear feedback.
 await page.goto(url,{waitUntil:'load',timeout:40000});
 await page.evaluate(()=>window.MorrowwishI18n.set('en'));
 const enHelp=await page.locator('#yarnExplain').textContent();
 assert.match(enHelp,/human|noise|investigate/i,'English help explains how yarn works');
 const initialYarn=await page.evaluate(()=>window.__PAWSIBLY_TEST__.getState().yarn);
 await page.locator('#tool').click();await page.waitForTimeout(200);
 const tossed=await page.evaluate(()=>{
  const s=window.__PAWSIBLY_TEST__.getState();
  return {yarn:s.yarn,noise:s.noise,trail:s.throwTrail,alert:s.alert,sound:window.MorrowwishAudio?.status()};
 });
 console.log('Real yarn button and audio:',JSON.stringify(tossed));
 assert.equal(tossed.yarn,initialYarn-1,'Yarn ball should be consumed after pressing the button');
 assert.ok(tossed.noise&&tossed.trail,'Yarn ball should draw an arc and lure the human');
 assert.ok(tossed.sound?.oscillators>0&&tossed.sound?.effects>0,'Cat yarn action must still play sound effects');
 assert.equal(tossed.sound.playing,false,'Cat SFX engine must never synthesize a music loop');
 assert.equal(tossed.sound.backgroundMusic,false,'Cat sound-effects subsystem must contain no BGM');
 assert.equal(tossed.sound.loopSteps,0,'Cat game must never schedule a background music loop');
 await page.evaluate(()=>window.MorrowwishI18n.set('zh'));
 assert.match(await page.locator('#yarnExplain').textContent(),/主人|毛线/,'Chinese explanation for yarn is clear');
 assert.match(await page.locator('#catLegend').textContent(),/纸箱|小鱼/,'Chinese prop legend is present');
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
  assert.equal(await policyPage.locator('#musicPermission').isVisible(),true,'Autoplay block must show a clear music start prompt');
  await policyPage.locator('#musicPermission').click();
  await policyPage.waitForFunction(()=>window.MorrowwishCatMusic?.status().playing===true);
  assert.equal(await policyPage.locator('#musicPermission').isVisible(),false,'Prompt should disappear once music plays');
  console.log('Autoplay-block fallback: one click starts the recorded music');
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

 // Five non-cat studio games remain effects-only; never synthesize melodies.
 const routes=['elsewhere','tiny-town','flip-dash','parcel-panic','pocket-aquarium'];
 const noMusicAudit=[];
 for(const game of routes){
  const p=await browser.newPage({viewport:{width:1250,height:900}});
  await p.route('**/api/session',route=>route.fulfill({status:204,body:''}));
  try{
   await p.goto(new URL('/'+game+'/',url).toString(),{waitUntil:'load',timeout:40000});
   await p.waitForTimeout(200);
   assert.equal(await p.evaluate(()=>typeof window.MorrowwishAudio),'object','Audio engine missing in '+game);
   const control=p.locator('[data-mw-audio]');
   assert.equal(await control.count(),1,'Must show exactly one audio toggle in '+game);
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
   await control.click();assert.equal(await p.evaluate(()=>window.MorrowwishAudio.status().enabled),false,'Mute must work in '+game);
   const silent=await p.evaluate(()=>{const a=window.MorrowwishAudio,b=a.status();a.effect('tap');return{before:b,after:a.status()}});
   assert.equal(silent.after.oscillators,silent.before.oscillators,'Muted effects must not create audio oscillators in '+game);
   await control.click();assert.equal(await p.evaluate(()=>window.MorrowwishAudio.status().enabled),true,'Unmute must work in '+game);
   assert.equal(await p.evaluate(()=>window.MorrowwishAudio.status().playing),false,'Unmuting must not start background music in '+game);
  }finally{await p.close()}
 }
 assert.equal(noMusicAudit.length,5,'Five non-cat games must remain without BGM');
 console.log('CHROMIUM CAT GAMEPLAY, STAR UNLOCKS, RECORDED PIANO MUSIC AND FIVE SOUND-EFFECTS-ONLY GAMES PASS');
}finally{await browser.close()}
