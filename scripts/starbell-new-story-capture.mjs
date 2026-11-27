import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const out='artifacts/starbell-story-trailer';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const liveOrigin='https://starbell-portrait-preview.morrowwish.pages.dev';
const origin='http://127.0.0.1:8765';
const version=await (await fetch(liveOrigin+'/preview-version.json?trailer='+Date.now())).json();
if(version.sha!==process.env.TRAILER_GAME_SHA||version.sha==='b7195bb31d43450c33e2a1a985c40c8f121c6ffd')throw Error('Live portrait source changed; refusing mismatched capture');
const evidence={origin:liveOrigin,captureOrigin:origin,source:version,script:process.env.GITHUB_SHA,clips:[],errors:[]};console.log('LIVE SOURCE',JSON.stringify(version));
async function open(region){
 const ctx=await browser.newContext({viewport:{width:540,height:960},deviceScaleFactor:2,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 const p=await ctx.newPage();p.setDefaultTimeout(15000);
 if(region==='harbor')await p.route('**/developer-preview.mjs*',async route=>{const response=await route.fetch();const body=await response.text();const staged=body.replace("'Windchime Town','harbor:H-01'","'Windchime Town','harbor:H-04'");if(staged===body)throw Error('Cannot set isolated canonical battle checkpoint');await route.fulfill({response,body:staged});});
 p.on('pageerror',e=>evidence.errors.push(region+': '+e.message));
 await p.goto(origin+'/cat-bond/?developer=1&qa=trailer&reset=1&region='+region+'&lang=en',{waitUntil:'domcontentloaded',timeout:45000});
 await p.locator('#starbell-developer-menu').waitFor({timeout:45000});
 await p.waitForFunction(r=>r==='garden'?__game.scene==='yard':__game.scene==='map'&&WorldMap.mode==='region'&&WorldMap.currentRegion===r,region,{timeout:20000});
 await p.addStyleTag({content:'#starbell-developer-menu{display:none!important}'});
 await p.waitForTimeout(700);
 return {ctx,p};
}
async function click(p,label){
 const b=p.getByRole('button',{name:label,exact:true}).first();
 if(!await b.isVisible()){
  const opt=p.locator('.rw-optional-actions:not([open]) > summary:visible');if(await opt.count())await opt.first().click();
  if(!await b.isVisible()&&await p.locator('.rw-region-toggle[aria-expanded="false"],.rw-atlas-menu:not([open]) > summary').count()){
   await p.locator('#map-menu').click();await p.locator('#cb-system-menu [data-system="world-explore"]').click();
  }
  for(const sel of ['[data-fit-prev]:visible','[data-fit-next]:visible'])for(let i=0;i<16&&!await b.isVisible();i++){const a=p.locator(sel);if(!await a.count()||!await a.isEnabled())break;await a.click();}
 }
 await b.click();
}
async function dialogue(p,id){
 for(let i=0;i<40;i++){
  const v=await p.evaluate(()=>CatBondResonance.view());
  if(v.current?.id!==id)return;
  const host=p.locator('.res-host[data-scene="'+id+'"]');
  if(!await host.isVisible()){await host.waitFor({timeout:2200}).catch(()=>{});if(!await host.isVisible())return;}
  if(!v.choice&&v.current.choices.length&&(v.current.choiceTiming==='beforeAction'||v.cursor===(v.current.choiceAt??v.current.lines.length))){await click(p,v.current.choices[0].label.en);continue;}
  if(v.cursor>=v.current.lines.length)return;
  if(!v.lineReady){await p.waitForTimeout(300);continue;}
  await host.locator('.res-line').click();await p.waitForTimeout(220);
 }
}
async function record(p,id,secs,action){
 const dir=out+'/'+id;await fs.mkdir(dir,{recursive:true});
 const rect=await p.evaluate(id=>{const el=['glide','chase'].includes(id)?document.querySelector('.rw-surface'):null;const r=el?.getBoundingClientRect();return r?{x:r.x,y:r.y,width:r.width,height:r.height,vw:innerWidth,vh:innerHeight}:null},id);
 const session=await p.context().newCDPSession(p);
 const frames=[];let active=true;const begin=Date.now();
 const observations=[];const monitor=setInterval(async()=>{try{const v=await p.evaluate(()=>({duo:!!__game?.battle?.duoCinematic,layout:window.CatBondPremiumCinematics?.lastLayout?.source,asset:window.CatBondPremiumCinematics?.lastLayout?.asset,resources:performance.getEntriesByType('resource').map(x=>x.name).filter(x=>x.includes('/mobile-portrait/'))}));observations.push({t:(Date.now()-begin)/1000,...v});}catch{}},100);
 session.on('Page.screencastFrame',e=>{const at=(Date.now()-begin)/1000;session.send('Page.screencastFrameAck',{sessionId:e.sessionId}).catch(()=>{});if(active&&at<=secs+0.2)frames.push({at,data:e.data});});
 await session.send('Page.startScreencast',{format:'jpeg',quality:95,maxWidth:1080,maxHeight:1920,everyNthFrame:1});
 const err=await Promise.allSettled([action(),p.waitForTimeout(secs*1000)]);
 clearInterval(monitor);active=false;await session.send('Page.stopScreencast');await session.detach();
 if(err[0].status==='rejected')throw err[0].reason;
 if(frames.length<12)throw Error('Insufficient changing frames: '+id+' '+frames.length);
 for(let i=0;i<frames.length;i++)await fs.writeFile(dir+'/'+String(i).padStart(5,'0')+'.jpg',Buffer.from(frames[i].data,'base64'));
 const times=frames.map(f=>f.at);let list='';
 let index=0;for(let k=0;k<Math.round(secs*30);k++){const t=k/30;while(index+1<frames.length&&times[index+1]<=t)index++;await fs.link(dir+'/'+String(index).padStart(5,'0')+'.jpg',dir+'/sample-'+String(k).padStart(5,'0')+'.jpg');}
 for(let i=0;i<frames.length;i++){list+="file '"+String(i).padStart(5,'0')+".jpg'\n";list+='duration '+Math.max(.015,(i+1<times.length?times[i+1]:secs)-times[i]).toFixed(4)+'\n';}
 list+="file '"+String(frames.length-1).padStart(5,'0')+".jpg'\n";await fs.writeFile(dir+'/frames.txt',list);
 await p.screenshot({path:out+'/'+id+'-proof.png'});
 evidence.clips.push({id,seconds:secs,frames:frames.length,rect,observations,scene:await p.evaluate(()=>({scene:__game.scene,region:WorldMap.currentRegion,story:CatBondResonance.view().current?.id}))});
 console.log('CAPTURED',id,frames.length);
}
async function attempt(id,region,fn){let ctx;try{const c=await open(region);ctx=c.ctx;await fn(c.p);}catch(e){evidence.errors.push(id+': '+String(e));console.log('CAPTURE ERROR',id,String(e));}finally{await ctx?.close();}}
try{
 await attempt('explore','forest',async p=>{
  const close=p.locator('#panel.open .panel-dismiss');
  if(await close.isVisible())await close.click();
  await p.waitForFunction(()=>!document.querySelector('#panel.open')&&!__game.worldDialogueOpen());
  const cv=p.locator('.rw-surface');await cv.waitFor({timeout:20000});
  await p.waitForFunction(()=>performance.getEntriesByType('resource').some(x=>x.name.includes('/mobile-portrait/rootsleep-forest.webp')));
  await p.waitForTimeout(500);
  const before=await p.evaluate(()=>JSON.stringify(State.S.resonanceExploration?.positions?.forest||null));
  await record(p,'explore',5,async()=>{
   for(const key of ['ArrowRight','ArrowRight','ArrowUp','ArrowUp','ArrowRight','ArrowUp']){
    await cv.focus();await p.keyboard.press(key);await p.waitForTimeout(650);
   }
  });
  const after=await p.evaluate(()=>JSON.stringify(State.S.resonanceExploration?.positions?.forest||null));
  if(before===after)throw Error('Forest walking did not change player position');
  evidence.forestMovement={before,after};console.log('VERIFIED FOREST WALK',before,after);
 });
}finally{await browser.close();await fs.writeFile(out+'/capture-evidence.json',JSON.stringify(evidence,null,2));}
if(!evidence.clips.some(x=>x.id==='explore')||!evidence.forestMovement)throw Error('No verified live forest exploration');
