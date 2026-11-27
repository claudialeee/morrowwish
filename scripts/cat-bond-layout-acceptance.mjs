// Targeted browser layout fixture, not new-game progression evidence.
// Run against isolated preview; all visitors unlocked via the canonical engine
// solely to stress the garden at maximum occupancy.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
const origin=process.env.CAT_BOND_SMOKE_ORIGIN||'http://127.0.0.1:8766';
const out='artifacts/cat-bond-layout';await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const profiles=[{name:'portrait',viewport:{width:390,height:844},isMobile:true,hasTouch:true},{name:'landscape',viewport:{width:844,height:390},isMobile:true,hasTouch:true},{name:'desktop',viewport:{width:1280,height:800}}];
try{for(const {name,...profile} of profiles){
 const context=await browser.newContext(profile),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto(origin+'/cat-bond/?lang=en&rpgDev=1');
 await page.locator('#intro-start').waitFor({state:'visible'});
 if(name==='portrait'){
  // Real title art, not the synthetic postgame fixture below.
  for(const viewport of [{width:320,height:568},{width:390,height:844},{width:430,height:932}]){
   await page.setViewportSize(viewport);
   await page.waitForFunction(()=>{const i=document.querySelector('.cb-title-cover-art');return i?.complete&&i.naturalWidth>0&&i.getBoundingClientRect().height>0;});
   await page.evaluate(()=>document.fonts.ready);
   const m=await page.evaluate(()=>{
    const rect=e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
    const root=document.querySelector('#intro'),art=root.querySelector('.cb-title-cover'),content=root.querySelector('.cb-title-content'),i=art.querySelector('img');
    const r=rect(i),scale=Math.max(r.width/i.naturalWidth,r.height/i.naturalHeight);
    const cropX=(i.naturalWidth*scale-r.width)*.5,cropY=(i.naturalHeight*scale-r.height)*.5;
    // Manually inspected source painting: both cover cats are inside this conservative normalized bounding box.
    const cats={left:.13*i.naturalWidth*scale-cropX,right:.87*i.naturalWidth*scale-cropX,top:.41*i.naturalHeight*scale-cropY,bottom:.70*i.naturalHeight*scale-cropY};
    return {root:rect(root),art:rect(art),content:rect(content),image:{src:new URL(i.currentSrc).pathname,fit:getComputedStyle(i).objectFit,position:getComputedStyle(i).objectPosition,r,cats},spoilers:root.querySelectorAll('.cb-title-lead,img[src*="/leads/"]').length,buttons:[...content.querySelectorAll('button')].map(b=>{const r=rect(b);return {r,hit:b.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2))};})};
   });
   assert.equal(m.image.src,'/cat-bond/assets/mobile-portrait/title-bell-sanctuary.webp','native portrait illustration');
   assert.equal(m.spoilers,0,'no plot lead portraits on the title');
   assert.ok(m.art.height>=m.root.height-2&&m.art.width>=m.root.width-2,'native title fills stage '+JSON.stringify(m));
   const {r,cats,fit,position}=m.image;
   assert.equal(fit,'cover');assert.equal(position,'50% 50%');
   assert.ok(r.width>=135&&r.height>=135&&r.left>=m.root.left-1&&r.right<=m.root.right+1&&r.top>=m.root.top-1&&r.bottom<=m.root.bottom+1,'cover frame is full bleed '+JSON.stringify(m));
   assert.ok(cats.left>=0&&cats.right<=r.width+1&&cats.top>=0&&cats.bottom<=r.height+1,'both original cover cats remain fully within the frame '+JSON.stringify(m));
   assert.ok(m.buttons.every(b=>b.r.height>=44&&b.r.width>=44&&b.hit&&b.r.bottom<=m.root.bottom+1),'title actions accessible '+JSON.stringify(m));
   await page.screenshot({path:out+'/portrait-title-'+viewport.width+'.png'});
  }
  await page.setViewportSize(profile.viewport);
 }else{
  assert.equal(await page.locator('.cb-title-cover').isVisible(),false,name+' desktop/landscape title stays unchanged');
  await page.screenshot({path:out+'/'+name+'-title.png'});
 }
 if(profile.hasTouch)await page.locator('#intro-start').tap();else await page.locator('#intro-start').click();
 await page.locator('#intro-slot-list [data-slot="slot1"]').click();
 await page.locator('#cb-player-first-intro').getByRole('button',{name:'Start exploring',exact:true}).click();
 await page.waitForFunction(()=>State.S.cats.length===1&&window.__game?.scene==='yard');
 await page.evaluate(async()=>{
  const {campaign}=await import('/cat-bond/js/resonance/campaign.mjs'),{makeEngine}=await import('/cat-bond/js/resonance/engine.mjs');
  const e=makeEngine(campaign);const ok=r=>{if(!r.ok)throw Error(r.reason);};
  const late=new Set(['mechanism:muling-unlock','npc:public-accountability','npc:second-garden-key']);
  for(const s of campaign.scenes){
   if(s.choiceTiming==='beforeAction'&&s.choices.length)ok(e.choose(s.choices[0].id));
   if(s.id==='finale:B-03')for(let i=0;i<campaign.regions.length;i++)ok(e.supportAction(campaign.regions[i],campaign.support[i]));
   for(const op of s.requires.filter(op=>!late.has(op)))ok(e.record(s.id,op));
   while(e.view().cursor<s.lines.length){if(s.choiceAt===e.view().cursor&&!e.view().choice)ok(e.choose(s.choices[0].id));ok(e.nextLine());}
   if(s.choiceTiming!=='beforeAction'&&s.choices.length&&!e.view().choice)ok(e.choose(s.choices[0].id));
   for(const op of s.requires.filter(op=>late.has(op)))ok(e.record(s.id,op));ok(e.finish());
  }
  for(const q of campaign.side)ok(e.postgame(q.id,q.operation));
  const next=e.snapshot(),root=State.S;root.resonance=next;root.resonanceExploration={location:'garden',positions:{},interactions:{},pickups:{},cargo:null};if(!State.save()?.ok)throw Error('fixture save failed');
 });
 await page.reload();await page.locator('#intro-continue').click();await page.locator('#intro-slot-list [data-slot="slot1"]').click();
 await page.waitForFunction(()=>CatBondResonance.view().ending&&__game.scene==='yard'&&document.querySelector('[data-guest-layout]')?.dataset.guestLayout);
 const seen=new Set();
 for(let i=0;i<3;i++){
  await page.waitForFunction(n=>{const d=JSON.parse(document.querySelector('[data-guest-layout]')?.dataset.guestLayout||'{}');return d.page===n&&d.visible?.length===5&&d.visible.every(x=>x.box);},i);
  const metrics=await page.evaluate(()=>{const root=document.querySelector('[data-guest-layout]'),r=root.getBoundingClientRect(),d=JSON.parse(root.dataset.guestLayout);return {d,w:r.width,h:r.height,buttons:[...root.querySelectorAll('.sg-npc-talk-marker:not([hidden])')].map(el=>{const b=el.getBoundingClientRect();return {id:el.dataset.npcTalk,x:b.x-r.x,y:b.y-r.y,w:b.width,h:b.height,hit:document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)?.closest('.sg-npc-talk-marker')===el};})};});
  assert.equal(metrics.buttons.length,5,name+' visible visitor controls');
  assert.ok(metrics.buttons.every(b=>b.w>=44&&b.h>=44),name+' all visitor controls retain full 44px touch targets');
  for(const b of metrics.buttons){seen.add(b.id);assert.ok(b.w>=44&&b.h>=44&&b.x>=-1&&b.y>=-1&&b.x+b.w<=metrics.w+1&&b.y+b.h<=metrics.h+1&&b.hit,name+' inaccessible visitor '+JSON.stringify(b));}
  const boxes=metrics.d.visible.map(x=>x.box);for(let a=0;a<boxes.length;a++)for(let b=a+1;b<boxes.length;b++){const x=boxes[a],y=boxes[b];assert.ok(Math.min(x.right,y.right)<=Math.max(x.left,y.left)||Math.min(x.bottom,y.bottom)<=Math.max(x.top,y.top),name+' visitor footprint overlap '+JSON.stringify([x,y]));}
  await page.screenshot({path:out+'/'+name+'-garden-'+i+'.png'});await page.locator('[data-guest-page]').click();
 }
 assert.equal(seen.size,13,name+' all visitors accessible across groups');
 // Real input opens the conversation; selecting a guest never edits story state.
 const marker=page.locator('[data-npc-talk="muling"]');await marker.click();await page.locator('.res-home-conversation, .res-ambient-simple').waitFor({state:'visible'});await page.reload();await page.locator('#intro-continue').click();await page.locator('#intro-slot-list [data-slot="slot1"]').click();
 await page.waitForFunction(()=>CatBondResonance.view().ending&&__game.scene==='yard');
 await page.locator('.sg-postgame-guide').getByRole('button',{name:'Continue exploring',exact:true}).click();
 const surface=page.locator('.rw-surface');await surface.waitFor();await page.waitForFunction(()=>JSON.parse(document.querySelector('.rw-surface')?.dataset.affordances||'[]').length>=7);
 const cdp=profile.hasTouch?await context.newCDPSession(page):null;
 async function swipe(dx,dy){const b=await page.locator('.rw-shell').boundingBox();const x=b.x+b.width/2,y=b.y+b.height/2;const start={x:x-dx/2,y:y-dy/2},end={x:x+dx/2,y:y+dy/2};if(cdp){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[start]});for(let i=1;i<=6;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start.x+(end.x-start.x)*i/6,y:start.y+(end.y-start.y)*i/6}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}else{await page.mouse.move(start.x,start.y);await page.mouse.down();await page.mouse.move(end.x,end.y,{steps:6});await page.mouse.up();}}
 async function reachable(){return page.evaluate(()=>{const e=document.querySelector('.rw-surface'),r=e.getBoundingClientRect(),s=e.parentElement.getBoundingClientRect(),[z,px,py]=JSON.parse(e.dataset.camera);return JSON.parse(e.dataset.affordances).map(m=>({t:m.t,target:m.target,x:r.left+(m.x/Number(e.dataset.logicalWidth||960)*z+px)*r.width,y:r.top+(m.y/Number(e.dataset.logicalHeight||540)*z+py)*r.height})).filter(m=>m.x>=s.left+12&&m.x<=s.right-12&&m.y>=s.top+12&&m.y<=s.bottom-12&&document.elementFromPoint(m.x,m.y)===e);});}
 const atlasSeen=new Map();const capture=async()=>{for(const m of await reachable())atlasSeen.set(m.t,m);};await capture();
 const box=await page.locator('.rw-shell').boundingBox();
 if(name==='portrait'){
  const assertFit=async()=>{
   const g=await page.evaluate(()=>{const r=s=>{const b=document.querySelector(s).getBoundingClientRect();return {left:b.left,right:b.right,top:b.top,bottom:b.bottom,width:b.width,height:b.height};};return {art:r('.rw-surface'),shell:r('.rw-shell'),rail:r('.rw-fit-rail'),head:r('.rw-head'),stage:r('#stage')};});
   assert.ok(g.art.width>0&&Math.abs(g.art.width/g.art.height-9/16)<.03,'undistorted canvas '+JSON.stringify(g));
   assert.ok(g.art.left<=g.shell.left+1&&g.art.right>=g.shell.right-1&&g.art.top<=g.shell.top+1&&g.art.bottom>=g.shell.bottom-1,'native canvas fills shell '+JSON.stringify(g));
   assert.ok(g.head.top>=g.stage.top-1&&g.rail.bottom<=g.stage.bottom+1&&g.rail.height<=g.stage.height*.31,'compact controls remain inside stage '+JSON.stringify(g));
  };
  for(const viewport of [{width:320,height:568},{width:390,height:844},{width:430,height:932}]){
   await page.setViewportSize(viewport);await page.waitForTimeout(250);await assertFit();
   const menu=page.locator('.rw-atlas-menu');if(await menu.getAttribute('open')!==null)await menu.locator(':scope > summary').click();await capture();assert.ok((await reachable()).length>=5,'most atlas markers directly reachable with menu collapsed at '+viewport.width);if(await menu.getAttribute('open')===null)await menu.locator(':scope > summary').click();
   await page.screenshot({path:out+'/portrait-atlas-'+viewport.width+'.png'});
  }
  await page.setViewportSize(profile.viewport);await page.waitForTimeout(250);
  const before=await surface.getAttribute('data-camera');await swipe(box.width*.5,0);
  assert.equal(JSON.parse(await surface.getAttribute('data-camera'))[0],JSON.parse(before)[0],'panning does not change zoom');
  const rail=page.locator('.rw-atlas-rail');await rail.getByRole('button',{name:'+',exact:true}).click();
  assert.ok(JSON.parse(await surface.getAttribute('data-camera'))[0]>1,'explicit zoom available');
  await rail.getByRole('button',{name:'Overview',exact:true}).click();
  assert.deepEqual(JSON.parse(await surface.getAttribute('data-camera')),[1,0,0],'overview restores the actual full map');
  await assertFit();const menu=page.locator('.rw-atlas-menu');if(await menu.getAttribute('open')!==null)await menu.locator(':scope > summary').click();await capture();await swipe(box.width*.5,0);await capture();await swipe(-box.width,0);await capture();
 }
 else{await capture();}
 assert.ok(atlasSeen.size>=7,name+' reachable atlas markers '+JSON.stringify([...atlasSeen.keys()]));
 // Test an actual tap on an unlocked region from the default overview, not a DOM menu shortcut.
 let points=await reachable();const target=points.find(m=>/Windchime|Forest|Lantern|Skyspine|Moonmirror|Starfall/.test(m.t));assert.ok(target,name+' no reachable region');
 if(cdp)await page.touchscreen.tap(target.x,target.y);else await page.mouse.click(target.x,target.y);
 await page.waitForFunction(()=>WorldMap.mode==='region');await page.waitForFunction(()=>JSON.parse(document.querySelector('.rw-surface')?.dataset.affordances||'[]').length>0);await page.screenshot({path:out+'/'+name+'-region.png'});
 if(name==='portrait'){
  const g=await page.evaluate(()=>{const a=document.querySelector('.rw-surface').getBoundingClientRect(),s=document.querySelector('.rw-shell').getBoundingClientRect(),r=document.querySelector('.rw-fit-rail').getBoundingClientRect();return {fit:a.left<=s.left+1&&a.right>=s.right-1&&a.top<=s.top+1&&a.bottom>=s.bottom-1,clear:r.height<=s.height*.31};});
  assert.ok(g.fit&&g.clear,'regional art fills viewport and controls remain compact');
  assert.ok(JSON.parse(await surface.getAttribute('data-camera'))[0]>1,'enter region with local follow camera by default');
  const rail=page.locator('.rw-fit-rail');if(!await rail.isVisible())await page.locator('.rw-region-toggle').click();await rail.getByRole('button',{name:'Follow cat',exact:true}).click();
  assert.ok(JSON.parse(await surface.getAttribute('data-camera'))[0]>1,'optional follow camera');
  await rail.getByRole('button',{name:'Overview',exact:true}).click();
  assert.deepEqual(JSON.parse(await surface.getAttribute('data-camera')),[1,0,0],'region overview restores the whole painting');
  await page.screenshot({path:out+'/portrait-region-overview.png'});
 }
 assert.deepEqual(errors,[]);console.log('LAYOUT PASS',name,'visitors',seen.size,'atlas markers',atlasSeen.size);await context.close();
}}finally{await browser.close();}
