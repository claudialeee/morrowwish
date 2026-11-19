import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1250,height:900},deviceScaleFactor:1});
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
 assert.equal(initial.loaded,true,'Game Javascript must initialize');
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
 assert.ok(en.instructions.includes('Tap'),'English tutorial must remain usable');
 assert.equal(errors.length,0,'Canvas and UI must be free of uncaught errors');
 await page.goto(new URL('/',url).toString(),{waitUntil:'load',timeout:40000});
 await page.evaluate(()=>window.MorrowwishI18n.set('zh'));await page.waitForTimeout(170);
 const homeZh=await page.evaluate(()=>({
  lang:document.documentElement.lang,
  about:document.querySelector('.about-copy p')?.textContent,
  footer:document.querySelector('.footer-row>span')?.textContent,
  miniDescription:document.querySelector('.tiny-section .section-intro>p')?.textContent,
  catTitle:document.querySelector('.cat-feature-card h3')?.textContent,
  miniHeight:Math.round(document.querySelector('.tiny-section')?.getBoundingClientRect().height||0),
  aboutHeight:Math.round(document.querySelector('.about-section')?.getBoundingClientRect().height||0)
 }));
 console.log('Homepage Chinese and compact sections:',JSON.stringify(homeZh));
 assert.equal(homeZh.lang,'zh-CN');
 assert.match(homeZh.about,/想象|自由/,'About text must be Chinese');
 assert.match(homeZh.footer,/独立游戏/,'Footer must be Chinese');
 assert.match(homeZh.miniDescription,/小游戏|挑战|短局/,'Mini games copy must be Chinese');
 assert.match(homeZh.catTitle,/猫猫绝对无辜/,'Chinese flagship title must appear');
 assert.ok(homeZh.miniHeight>420&&homeZh.miniHeight<720,'The 02 game gallery must be comfortably sized');
 assert.ok(homeZh.aboutHeight>230&&homeZh.aboutHeight<420,'The 03 studio introduction should be medium-sized');
 // The cat's core distraction needs to work with real pointer input and clear feedback.
 await page.goto(url,{waitUntil:'load',timeout:40000});
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
 assert.ok(tossed.sound?.oscillators>0&&tossed.sound?.loopSteps>0,'Real WebAudio soundtrack should emit notes after user click');
 assert.ok(tossed.sound.playing,'Original cat background score should be playing');
 await page.evaluate(()=>window.MorrowwishI18n.set('zh'));
 assert.match(await page.locator('#yarnExplain').textContent(),/主人|毛线/,'Chinese explanation for yarn is clear');
 assert.match(await page.locator('#catLegend').textContent(),/纸箱|小鱼/,'Chinese prop legend is present');
 const audioButton=page.locator('#sound');
 await audioButton.click();
 assert.equal(await page.evaluate(()=>window.MorrowwishAudio.status().enabled),false,'Mute button must actually silence the score');
 await audioButton.click();
 assert.equal(await page.evaluate(()=>window.MorrowwishAudio.status().enabled),true,'Sound button must restore audio');

 // All six showcased studio games must have real audio controls and synthesized music.
 const routes=['elsewhere','tiny-town','flip-dash','parcel-panic','pocket-aquarium','pawsibly-innocent'];
 for(const game of routes){
  const p=await browser.newPage({viewport:{width:1250,height:900}});
  try{
   await p.goto(new URL('/'+game+'/',url).toString(),{waitUntil:'load',timeout:40000});
   await p.waitForTimeout(200);
   assert.equal(await p.evaluate(()=>typeof window.MorrowwishAudio),'object','Audio engine missing in '+game);
   const control=p.locator('[data-mw-audio]');
   assert.equal(await control.count(),1,'Must show exactly one audio toggle in '+game);
   // A trusted pointer interaction unlocks Web Audio without an autoplay attempt.
   await p.mouse.click(25,450);await p.waitForTimeout(680);
   const sound=await p.evaluate(()=>window.MorrowwishAudio.status());
   console.log('Audio smoke '+game+': '+JSON.stringify(sound));
   assert.equal(sound.enabled,true,'Music must be enabled after the first click in '+game);
   assert.equal(sound.playing,true,'Music loop must start in '+game);
   assert.ok(sound.oscillators>0&&sound.loopSteps>0,'Synthesizer must play actual notes in '+game);
   await control.click();assert.equal(await p.evaluate(()=>window.MorrowwishAudio.status().enabled),false,'Mute must work in '+game);
   await control.click();assert.equal(await p.evaluate(()=>window.MorrowwishAudio.status().enabled),true,'Unmute must work in '+game);
  }finally{await p.close()}
 }
 console.log('CHROMIUM CAT GAMEPLAY, BILINGUAL YARN TUTORIAL, HOME LAYOUT AND SIX ORIGINAL MUSIC SCORES PASS');
}finally{await browser.close()}
