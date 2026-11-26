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
 await page.locator('#intro-start').click();await page.locator('#intro-slot-list [data-slot="slot1"]').click();
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
 async function reachable(){return page.evaluate(()=>{const e=document.querySelector('.rw-surface'),r=e.getBoundingClientRect(),s=e.parentElement.getBoundingClientRect(),[z,px,py]=JSON.parse(e.dataset.camera);return JSON.parse(e.dataset.affordances).map(m=>({t:m.t,target:m.target,x:r.left+(m.x/960*z+px)*r.width,y:r.top+(m.y/540*z+py)*r.height})).filter(m=>m.x>=s.left+12&&m.x<=s.right-12&&m.y>=s.top+12&&m.y<=s.bottom-12&&document.elementFromPoint(m.x,m.y)===e);});}
 const atlasSeen=new Map();const capture=async()=>{for(const m of await reachable())atlasSeen.set(m.t,m);};await capture();
 const box=await page.locator('.rw-shell').boundingBox();
 if(name==='portrait'){const before=await surface.getAttribute('data-camera');for(let i=0;i<4;i++){await swipe(box.width*.7,0);await capture();}assert.notEqual(await surface.getAttribute('data-camera'),before,'portrait touch drag must move cropped map');await page.screenshot({path:out+'/'+name+'-atlas-left.png'});for(let i=0;i<8;i++){await swipe(-box.width*.7,0);await capture();}await page.screenshot({path:out+'/'+name+'-atlas-right.png'});}
 else{await capture();}
 assert.ok(atlasSeen.size>=7,name+' reachable atlas markers '+JSON.stringify([...atlasSeen.keys()]));
 // Test an actual tap on an unlocked region after dragging, not a DOM menu shortcut.
 let points=await reachable();const target=points.find(m=>/Windchime|Forest|Lantern|Skyspine|Moonmirror|Starfall/.test(m.t));assert.ok(target,name+' no reachable region');
 if(cdp)await page.touchscreen.tap(target.x,target.y);else await page.mouse.click(target.x,target.y);
 await page.waitForFunction(()=>WorldMap.mode==='region');await page.waitForFunction(()=>JSON.parse(document.querySelector('.rw-surface')?.dataset.affordances||'[]').length>0);await page.screenshot({path:out+'/'+name+'-region.png'});
 if(name==='portrait'){const a=await surface.getAttribute('data-camera');await swipe(box.width*.65,0);await swipe(-box.width*.65,0);assert.ok(await surface.getAttribute('data-camera'),'regional camera transform');}
 assert.deepEqual(errors,[]);console.log('LAYOUT PASS',name,'visitors',seen.size,'atlas markers',atlasSeen.size);await context.close();
}}finally{await browser.close();}
