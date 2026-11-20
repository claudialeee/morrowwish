// Record authentic Cat Bond gameplay through the same browser used by mobile smoke tests.
// Captures a living yard, one menu interaction, then a real-time battle.
// No mock UI, false achievements, or fabricated game states.
import { chromium } from 'playwright';
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const port=8769;
const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1','--directory','public'],{stdio:'ignore'});
const root=fs.mkdtempSync(path.join(os.tmpdir(),'mw-cat-bond-capture-'));
const outDir='public/promo/cat-bond';
fs.mkdirSync(outDir,{recursive:true});
let browser, context, page;
try{
  await new Promise(resolve=>setTimeout(resolve,1300));
  browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  context=await browser.newContext({viewport:{width:720,height:1280},deviceScaleFactor:1,isMobile:true,hasTouch:true,
    recordVideo:{dir:root,size:{width:720,height:1280}},locale:'en-US',reducedMotion:'no-preference'});
  page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+port+'/cat-bond/?autodev&lang=en',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>!!window.__game&&!!window.State&&window.State.S.cats.length>=3&&document.querySelector('#intro').classList.contains('hide'),null,{timeout:18000});
  await page.waitForTimeout(3600); // actual live roaming cats
  await page.locator('#fab-feed').tap({timeout:5000});
  await page.waitForTimeout(1100);
  await page.evaluate(()=>window.UI?.closeAll?.());
  await page.waitForTimeout(1300);
  await page.evaluate(()=>{
    const g=window.__game;
    const opponent=GameData.SPECIES.find(s=>!State.S.cats.some(c=>c.id===s.id))||GameData.SPECIES[1];
    g.startBattle(State.S.cats.slice(0,2),opponent);
  });
  await page.waitForFunction(()=>window.__game.scene==='battle',{timeout:10000});
  await page.waitForTimeout(1700);
  try{await page.locator('#btn-auto').tap({timeout:1800});}catch{}
  await page.waitForTimeout(8500);
  if(errors.length) console.warn('Cat Bond capture browser warnings:',errors.join(' | '));
  const vid=page.video();
  await context.close();
  context=null;
  const file=await vid.path();
  const out=path.join(outDir,'real-gameplay-portrait.mp4');
  const soundtrack='public/audio/cat-happy-clappy.ogg';
  if(!fs.existsSync(soundtrack)) throw Error('Missing licensed soundtrack at '+soundtrack);
  execFileSync('ffmpeg',['-nostdin','-y','-hide_banner','-loglevel','error',
    '-i',file,'-stream_loop','-1','-i',soundtrack,
    '-t','16','-vf','fps=30,scale=720:1280:flags=lanczos,format=yuv420p',
    '-map','0:v:0','-map','1:a:0','-c:v','libx264','-preset','veryfast','-crf','20',
    '-c:a','aac','-b:a','128k','-movflags','+faststart',out],{stdio:'inherit',timeout:180000});
  const check=execFileSync('ffprobe',['-v','error','-show_entries','stream=codec_type','-of','csv=p=0',out],{encoding:'utf8'});
  if(!check.includes('video')||!check.includes('audio')) throw Error('Cat Bond capture not playable with audio');
  console.log('Recorded actual Cat Bond from running game:',out,fs.statSync(out).size,'bytes');
}catch(error){
  console.error('Cat Bond recording failed:',error);
  process.exitCode=1;
}finally{
  try{if(context)await context.close()}catch{}
  try{if(browser)await browser.close()}catch{}
  server.kill('SIGTERM');
  fs.rmSync(root,{recursive:true,force:true});
}
