import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import fs from 'node:fs';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const failures=[];
fs.mkdirSync('artifacts/resonance-cinematic-component',{recursive:true});
try {
 for(const profile of [{name:'desktop',width:1280,height:800},{name:'portrait',width:390,height:844},{name:'landscape',width:844,height:390}]){
  const page=await browser.newPage({viewport:{width:profile.width,height:profile.height}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try {
   await page.goto('http://127.0.0.1:8765/cat-bond/cinematic-preview.html');
   await page.locator('#status').filter({hasText:'拒绝播放'}).waitFor();
   // Test fixtures are browser-generated PNG swatches, not art, never written to the asset manifest.
   const result=await page.evaluate(async()=>{
    const root=document.querySelector('#preview'),events=[];
    root.style.height='min(70svh, 600px)';
    const make=(color)=>{const c=document.createElement('canvas');c.width=800;c.height=450;const x=c.getContext('2d');x.fillStyle=color;x.fillRect(0,0,800,450);return c.toDataURL('image/png')};
    const a=make('#37526b'),b=make('#6f4d37');
    const shot=(id,image,text)=>({id,image,durationMs:5000,subtitle:{zh:{speaker:'测试',text},en:{speaker:'Test',text:'Test subtitle '+id}}});
    const p=window.CatBondCinematicPresentation.create(root,{language:'zh',onComplete:e=>events.push(['complete',e.sceneId]),onSkip:e=>events.push(['skip',e.sceneId]),onError:e=>events.push(['error',e.reason]),onFrameChange:e=>events.push(['frame',e.frameIndex])});
    window.fixturePlayer=p;window.fixtureEvents=events;
    const s={id:'prologue:P-02',sourceSceneId:'P-02',title:{zh:'组件测试',en:'Component test'},mode:'manual',allowSkip:true,frames:[shot('one',a,'第一段测试对白'),shot('two',a,'第二段测试对白'),shot('three',b,'第三段测试对白')]};
    p.register(s);p.play(s.id);return {ready:true}
   });
   assert.equal(result.ready,true);
   await page.locator('.cbcp-subtitle').filter({hasText:'第一段测试对白'}).waitFor();
   await page.waitForFunction(()=>window.fixturePlayer.frameReady);
   await page.locator('.cbcp-language').click();
   assert.equal(await page.locator('.cbcp-subtitle').textContent(),'Test subtitle one');
   await page.locator('.cbcp-language').click();
   assert.equal(await page.locator('.cbcp-subtitle').textContent(),'第一段测试对白');
   const old=await page.locator('.cbcp-art').first().elementHandle();
   await page.locator('.cbcp-continue').click();
   await page.locator('.cbcp-subtitle').filter({hasText:'第二段测试对白'}).waitFor();
   assert.equal(await old.evaluate(e=>e.isConnected),true,'subtitle-only frame must reuse image node');
   const snapshot=await page.evaluate(()=>window.fixturePlayer.interrupt());
   assert.equal(snapshot.frameIndex,1);
   await page.evaluate(s=>window.fixturePlayer.restore(s),snapshot);
   await page.waitForFunction(()=>window.fixturePlayer.frameReady);
   await page.locator('.cbcp-pause').click();
   await page.locator('.cbcp-continue').click();
   await page.locator('.cbcp-subtitle').filter({hasText:'第三段测试对白'}).waitFor();
   await page.waitForFunction(()=>window.fixturePlayer.frameReady);
   const geometry=await page.evaluate(()=>{
    const stage=document.querySelector('.cbcp-root').getBoundingClientRect();
    const nodes=[...document.querySelectorAll('.cbcp-tool,.cbcp-continue,.cbcp-subtitle')].filter(x=>!x.hidden);
    return nodes.map(e=>{const r=e.getBoundingClientRect();return {label:e.textContent,inside:r.left>=stage.left-1&&r.right<=stage.right+1&&r.top>=stage.top-1&&r.bottom<=stage.bottom+1}})
   });
   assert.ok(geometry.every(g=>g.inside),JSON.stringify(geometry));
   await page.screenshot({path:'artifacts/resonance-cinematic-component/'+profile.name+'-FIXTURE.png'});
   await page.locator('.cbcp-skip').click();
   assert.equal(await page.locator('#preview').isVisible(),false);
   assert.ok(await page.evaluate(()=>window.fixtureEvents.some(e=>e[0]==='skip')));
   await page.evaluate(()=>{const p=window.fixturePlayer;p.register({id:'prologue:P-03',mode:'manual',allowSkip:true,frames:[{image:'missing-test-art.png'}]});p.play('prologue:P-03')});
   await page.waitForFunction(()=>window.fixtureEvents.some(e=>e[0]==='error'));
   assert.equal(await page.locator('#preview').isVisible(),false);
   assert.deepEqual(errors,[]);
   console.log('COMPONENT BROWSER TEST PASS',profile.name,JSON.stringify(geometry));
  } catch(e){failures.push(profile.name+': '+e.message);console.error(e);await page.screenshot({path:'artifacts/resonance-cinematic-component/'+profile.name+'-FAIL.png'});}
  finally{await page.close();}
 }
}finally{await browser.close()}
if(failures.length){console.error(failures.join('\n'));process.exitCode=1;}
