// Run against the frozen source in a local browser with Playwright installed.
// No generated saves, debug switches, state injection, or fabricated outcomes.
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const args=process.argv.slice(2),orientation=args[0]||'landscape';
const presets={landscape:[1920,1080],portrait:[1080,1620],vertical:[1080,1920],standard:[760,570],wide:[1280,720],gamepix:[720,1280]};
if(!presets[orientation])throw Error('Choose '+Object.keys(presets).join(', '));
const [width,height]=presets[orientation];
const dest=path.resolve('output/raw',orientation+'-'+Date.now());
fs.mkdirSync(dest,{recursive:true});
const port=Number(process.env.CAPTURE_PORT||18963);
const url='http://127.0.0.1:'+port+'/cat-bond/?lang=en';
const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1','--directory','source/public'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let browser,context,rl;
try{
 let ready=false;
 for(let i=0;i<50;i++){try{if((await fetch(url)).ok){ready=true;break}}catch{}await sleep(200)}
 if(!ready)throw Error('Local frozen source did not start');
 browser=await chromium.launch({headless:false,args:['--window-size='+width+','+height]});
 context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,recordVideo:{dir:dest,size:{width,height}},...(args.includes('--touch')?{hasTouch:true,isMobile:true}:{}),...(process.env.ATTAINED_SAVE?{storageState:process.env.ATTAINED_SAVE}:{})});
 await context.route('**/*',route=>{const u=new URL(route.request().url());return u.hostname!=='127.0.0.1'||/telemetry/.test(u.pathname)?route.abort():route.continue()});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url,{waitUntil:'domcontentloaded'});
 const video=page.video();const marks=[];let start=Date.now();
 rl=readline.createInterface({input:process.stdin,output:process.stdout});
 console.log('Play using real mouse/touch. Enter a scene name to capture a screenshot and timestamp; enter done to finish. No save injection.');
 while(true){const cmd=(await rl.question('scene or done: ')).trim();if(cmd==='done')break;if(!/^[a-z0-9-]+$/i.test(cmd))continue;
 await page.screenshot({path:path.join(dest,cmd+'.png')});marks.push({scene:cmd,elapsedMs:Date.now()-start});
 }
 await context.storageState({path:path.join(dest,'attained-save.json')});
 await context.close();context=null;
 const recorded=await video.path();
 fs.writeFileSync(path.join(dest,'capture-report.json'),JSON.stringify({sourceCommit:'7637c688dc6efee7145bf6fe46e25f704d57e6fc',width,height,recorded,marks,errors,source:'real-input, not seeded',approved:false},null,2)+'\n');
 console.log('Raw capture saved:',dest,'; visually inspect before export.');
}finally{rl?.close();await context?.close().catch(()=>{});await browser?.close().catch(()=>{});server.kill();}
