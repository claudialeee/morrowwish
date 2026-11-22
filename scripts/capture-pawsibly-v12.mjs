// Real Pawsibly Innocent V12 footage: one room, actual first fish and earned
// game-over modal after all three real captures. Promo-only browser capture;
// not a fake result and not a change to normal player gameplay.
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const dir=process.env.MW_PAWSIBLY_V12_DIR||path.join(process.env.RUNNER_TEMP||os.tmpdir(),'morrowwish-pawsibly-v12');
fs.mkdirSync(path.join(dir,'raw'),{recursive:true});
const server=spawn('python3',['-m','http.server','8795','--bind','127.0.0.1','--directory','public'],{stdio:'ignore'});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
let browser=null,context=null;
function fullBoardCamera(){
 const source=document.getElementById('board');
 if(!source)throw Error('Missing live Pawsibly game canvas');
 const out=document.createElement('canvas');
 out.id='mw-v12-camera';out.width=540;out.height=960;
 Object.assign(out.style,{position:'fixed',inset:'0',width:'100vw',height:'100vh',
  zIndex:'2147483640',pointerEvents:'none'});
 document.body.append(out);
 const ctx=out.getContext('2d',{alpha:false});
 function paint(){
  ctx.fillStyle='#2c2237';ctx.fillRect(0,0,540,960);
  const s=window.__PAWSIBLY_TEST__?.getState();
  if(s&&source.width&&source.height){
   ctx.save();ctx.filter='blur(26px) brightness(0.48)';
   ctx.drawImage(source,0,0,source.width,source.height,-440,0,1420,960);
   ctx.restore();
   const h=540*source.height/source.width;
   ctx.drawImage(source,0,0,source.width,source.height,0,(960-h)/2,540,h);
   ctx.font='bold 26px system-ui,sans-serif';ctx.fillStyle='#fff8ef';
   ctx.fillText('THE SUNNY LOUNGE',25,137);
   ctx.fillText('FISH '+s.got+'/3',25,772);
   if(s.lives<3&&!s.done)ctx.fillText('HEARTS '+('♥'.repeat(s.lives)),25,819);
  }
  requestAnimationFrame(paint);
 }requestAnimationFrame(paint);
 const badge=document.getElementById('achievementToast');
 if(badge){Object.assign(badge.style,{position:'fixed',top:'13%',left:'50%',width:'min(470px,88vw)',
  zIndex:'2147483643'});}
 const css=document.createElement('style');
 css.textContent=`
 #overlay:not([hidden]){position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;
   z-index:2147483647!important;display:grid!important;place-items:center!important;
   padding:13px!important;box-sizing:border-box!important;background:rgba(40,28,49,.76)!important}
 #overlay:not([hidden]) .modal{width:min(460px,94vw)!important;max-height:89dvh!important;
   overflow:auto!important;box-sizing:border-box!important;padding:15px 18px!important}
 #overlay:not([hidden]) .modal h2{font-size:30px!important;line-height:1.15!important}
 #overlay:not([hidden]) .cat-medal{font-size:58px!important}
 #overlay:not([hidden]) .modal .buttons{margin-top:12px!important}
 `;
 document.head.append(css);
 // Game's #stage establishes its own stacking context; moving the REAL
 // result dialog to the body is required for it to appear above our capture
 // camera. This touches only the isolated promo browser, never the game code.
 const result=document.getElementById('overlay');
 if(!result)throw Error('Missing native game settlement overlay');
 document.body.appendChild(result);
}
try{
 await wait(1000);
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 context=await browser.newContext({viewport:{width:540,height:960},deviceScaleFactor:1,
  isMobile:true,hasTouch:true,locale:'en-US',recordVideo:{dir:path.join(dir,'raw'),size:{width:540,height:960}}});
 const page=await context.newPage(),born=Date.now(),errors=[];
 const stamp=()=>+(Date.now()-born)/1000;
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/session**',route=>route.abort('blockedbyclient'));
 await page.goto('http://127.0.0.1:8795/pawsibly-innocent/?lang=en',{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>!!window.__PAWSIBLY_TEST__?.getState(),null,{timeout:12000});
 await page.evaluate(fullBoardCamera);
 const shots=[];
 const intro=stamp();await wait(450);
 const fish=await page.evaluate(()=>{
  const api=window.__PAWSIBLY_TEST__,start=api.getState();
  if(start.index!==0||start.got!==0||start.lives!==3||start.cat.x!==1||start.cat.y!==3)
   throw Error('Opening fixture is not the real Sunny Lounge spawn');
  api.move(1,0);const after=api.getState();
  return {room:after.room.en,got:after.got,fishTotal:after.fish.length,cat:after.cat,lives:after.lives};
 });
 if(fish.got!==1||fish.lives!==3||fish.room!=='The Sunny Lounge')
  throw Error('First fish was not actually collected '+JSON.stringify(fish));
 await wait(1960);
 shots.push({label:'intro-fish',start:intro,duration:stamp()-intro-.08});
 let finalCatchAt=0,finalCatchBegin=0;
 // All three lives must be consumed by actual legal move() collisions or
 // exposure rules. Never set s.lives, s.done, or manipulate the result DOM.
 for(let attempt=0;attempt<3;attempt++){
  const startLives=3-attempt;
  const roundStart=stamp();
  if(attempt===2)finalCatchBegin=roundStart;
  let result=null;
  for(let step=0;step<85;step++){
   result=await page.evaluate(()=>{
    const api=window.__PAWSIBLY_TEST__,s=api.getState();
    if(s.done)return {done:true,lives:s.lives};
    const dirs=[[1,0],[0,1],[0,-1],[-1,0]];
    const ok=dirs.map(([dx,dy])=>({dx,dy,x:s.cat.x+dx,y:s.cat.y+dy}))
      .filter(p=>p.x>=0&&p.x<10&&p.y>=0&&p.y<7&&
        !['#','S'].includes(s.grid[p.y][p.x])&&
        (p.x!==s.human.x||p.y!==s.human.y)&&
        (!s.vacuum||p.x!==s.vacuum.x||p.y!==s.vacuum.y));
    if(!ok.length)throw Error('Cat cannot take any legal step');
    // Genuine line-of-sight exposure, not illegal overlap with the owner.
    // When adjacent, alternate safe open tiles so the detection meter fills.
    // Keep moving in/near the owner's visible zone, never edit lives/done.
    const visibility=p=>{
      const dist=Math.abs(p.x-s.human.x)+Math.abs(p.y-s.human.y);
      if(dist<=1)return 3;
      if(dist>3)return 0;
      if(p.x===s.human.x||p.y===s.human.y)return 2;
      return dist===2?1:0;
    };
    ok.sort((a,b)=>{
      const rate=p=>{
        const dist=Math.abs(p.x-s.human.x)+Math.abs(p.y-s.human.y);
        return visibility(p)*8-dist*2+
          ((s.exposure>0&&visibility(p)>0)?6:0);
      };
      return rate(b)-rate(a);
    });
    const target=ok[0];
    api.move(target.dx,target.dy);
    const after=api.getState();
    return {lives:after.lives,done:after.done,winning:after.winning,
     steps:after.steps,cat:after.cat,human:after.human,got:after.got};
   });
   if(result.lives<startLives)break;
   if(result.done)throw Error('Unexpected win or early end before all captures');
   await wait(attempt===2?550:170);
  }
  if(!result||result.lives!==startLives-1||!!result.winning)
   throw Error('Actual capture '+(attempt+1)+' was not earned '+JSON.stringify(result));
  if(attempt===2)finalCatchAt=stamp();
  console.log('V12 REAL CAPTURE '+JSON.stringify({attempt:attempt+1,result}));
  await wait(attempt===2?180:370);
 }
 if(!finalCatchAt||finalCatchAt-finalCatchBegin<1.2)throw Error('Final chase too short to read');
 await page.waitForFunction(()=>{
  const state=window.__PAWSIBLY_TEST__?.getState();
  return state?.done===true&&state.winning===false&&state.lives===0&&
    document.getElementById('overlay')?.hidden===false&&
    /Caught red-pawed/i.test(document.getElementById('resultTitle')?.textContent||'');
 },null,{timeout:8000});
 const visual=await page.evaluate(()=>{
  const modal=document.querySelector('#overlay .modal'),title=document.getElementById('resultTitle'),
        score=document.getElementById('resultScore'),retry=document.getElementById('retryResult'),
        rect=modal.getBoundingClientRect(),s=window.__PAWSIBLY_TEST__.getState();
  return {result:title.textContent,score:score.textContent,retry:retry.textContent,
   fish:s.got,lives:s.lives,done:s.done,winning:s.winning,room:s.room.en,
   rect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},
   modalActuallyOnTop:!!document.elementFromPoint(270,480)?.closest('#overlay'),
   topElement:document.elementFromPoint(270,480)?.tagName};
 });
 if(!visual.modalActuallyOnTop)throw Error('Native result is behind recording canvas '+JSON.stringify(visual));
 if(visual.rect.x<0||visual.rect.y<0||visual.rect.x+visual.rect.width>540||
  visual.rect.y+visual.rect.height>960||!visual.retry||!visual.score)
   throw Error('Real native settlement clipped/empty '+JSON.stringify(visual));
 const frame='public/promo/pawsibly-innocent/v12-real-failure-result-proof.png';
 fs.mkdirSync(path.dirname(frame),{recursive:true});
 await page.screenshot({path:frame,animations:'disabled'});
 // Include ~2.9 s of the native game-over modal in the actual recording.
 const resultAt=stamp();await wait(3150);
 const tail=stamp();
 shots.push({label:'last-chase',start:Math.max(finalCatchBegin,finalCatchAt-3.1),
   duration:Math.min(3.0,finalCatchAt-Math.max(finalCatchBegin,finalCatchAt-3.1))});
 shots.push({label:'real-failure-result',start:resultAt,duration:tail-resultAt-.14});
 const input=page.video();await context.close();context=null;
 const raw=await input.path();const output=path.join(dir,'pawsibly-v12.webm');fs.renameSync(raw,output);
 if(errors.length)throw Error('Browser errors '+JSON.stringify(errors));
 const manifest={slug:'pawsibly-innocent',file:output,shots,proof:visual,source:'real browser',
   noCheats:true,noArtificialResult:true,room:'The Sunny Lounge'};
 fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 console.log('V12 CAPTURED REAL FAILURE '+JSON.stringify({file:output,shots,proof:visual}));
}catch(e){console.error('V12 CAPTURE FAILED',e.stack||e);process.exitCode=1;}
finally{if(context)await context.close().catch(()=>{});if(browser)await browser.close().catch(()=>{});
 server.kill('SIGTERM');}
