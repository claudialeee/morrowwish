import {attachExperienceRecorder} from './cat-bond-experience-recorder.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
const locale=process.env.PROLOGUE_LANG==='zh'?'zh':'en',tr=(zh,en)=>locale==='zh'?zh:en;
const output='artifacts/cat-bond-release-prologue/'+locale;await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true});let failed=false;
for(const profile of [{name:'desktop',viewport:{width:1440,height:900},hasTouch:false},{name:'portrait',viewport:{width:390,height:844},hasTouch:true},{name:'landscape',viewport:{width:844,height:390},hasTouch:true}].filter(p=>!process.env.PROLOGUE_PROFILE||p.name===process.env.PROLOGUE_PROFILE)){
 const {name,...options}=profile;
 for(const meet of [true,false]){
 const context=await browser.newContext(options),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await attachExperienceRecorder(context,page,{id:'opening-'+locale+'-'+name+'-'+(meet?'meet':'skip')});
 const screenshot=id=>page.screenshot({path:output+'/'+name+'-'+(meet?'meet':'skip')+'-'+id+'.png'});
 const waitScene=id=>page.waitForFunction(id=>window.CatBondResonance?.view()?.current?.id===id,id,{timeout:45000});
 const press=async locator=>{await locator.waitFor({state:'visible'});if(options.hasTouch)await locator.tap();else await locator.click();};
 try{
 await page.goto('http://127.0.0.1:8765/cat-bond/?lang='+locale);
 await page.waitForFunction(()=>window.__CAT_BOND_READY__&&window.CatBondResonance);
 const nameExpected=tr('星铃回响','Echoes of the Starbell');
 await page.waitForFunction(name=>document.querySelector('#cb-title-name')?.textContent===name,nameExpected);
 const title=await page.evaluate(()=>{
  const panel=document.querySelector('#intro .cb-title-content'),title=document.querySelector('#cb-title-name'),button=document.querySelector('#intro-start');
  const style=getComputedStyle(panel),bounds=el=>{const r=el.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom};};
  return {name:title.textContent,documentTitle:document.title,background:style.backgroundColor,image:style.backgroundImage,border:style.borderTopWidth,shadow:style.boxShadow,title:bounds(title),button:bounds(button),width:innerWidth,height:innerHeight};
 });
 await screenshot('title');
 assert.equal(title.name,nameExpected);assert.ok(title.documentTitle.includes(nameExpected),'Localized browser title');
 assert.equal(title.background,'rgba(0, 0, 0, 0)','No title card background');
 assert.equal(title.image,'none','No title card gradient');assert.equal(title.border,'0px');assert.equal(title.shadow,'none');
 for(const rect of [title.title,title.button])assert.ok(rect.left>=-1&&rect.top>=-1&&rect.right<=title.width+1&&rect.bottom<=title.height+1,'Title and start button fit viewport: '+JSON.stringify(title));
 await fs.writeFile(output+'/'+name+'-'+(meet?'meet':'skip')+'-title.json',JSON.stringify(title,null,2));
 await press(page.locator('#intro-start'));await press(page.locator('#intro-slot-list [data-slot="slot1"]'));await waitScene('prologue:P-05');
 const intro=page.locator('#cb-player-first-intro');await intro.waitFor();assert.match(await intro.innerText(),locale==='zh'?/星铃.*记忆/s:/Star Bell.*memories/s);
 assert.equal(await page.locator('.cbcp-root:not([hidden])').count(),0);assert.deepEqual(await page.evaluate(()=>State.S.cats.map(c=>c.species)),['jinjc']);
 assert.equal(await page.evaluate(()=>CatBondResonance.view().muling),'unmet');
 assert.equal(await page.evaluate(()=>Object.values(State.S.resonance.evidence).flat().some(o=>o.startsWith('cinematic:'))),false);
 await screenshot('context');await press(intro.getByRole('button',{name:meet?tr('开始探索','Start exploring'):tr('跳过介绍','Skip introduction'),exact:true}));
 const guide=page.locator('.sg-prologue-guide');
 if(meet){await press(page.locator('[data-npc-talk="muling"]'));const encounter=page.locator('#cb-traveler-encounter');
 assert.equal(await page.locator('.res-garden-bell').count(),0);
 await press(encounter.getByRole('button',{name:tr('寻找航图','Find the chart pieces'),exact:true}));
 await encounter.waitFor({state:'detached'});
 for(const id of ['chart-0','chart-1'])await press(page.locator('[data-garden-explore="'+id+'"]'));
 await press(page.locator('[data-npc-talk="muling"]'));
 for(const label of [tr('继续','Continue'),tr('告别','Say goodbye')])await press(encounter.getByRole('button',{name:label,exact:true}));
 for(let i=0;i<3;i++){await press(page.locator('[data-garden-explore="butterfly"]'));await page.waitForFunction(n=>GardenExploration.read(State.S).butterfly===n,i+1);}
 await press(page.locator('[data-garden-explore="seed"]'));
 await press(page.locator('[data-garden-explore="snack"]'));await press(page.getByRole('button',{name:tr('带在身上','Keep for later'),exact:true}));
 assert.equal(await page.evaluate(()=>GardenExploration.read(State.S).butterfly),3);
 assert.equal(await page.evaluate(()=>CatBondResonance.view().openingMet),true);assert.equal(await page.evaluate(()=>CatBondResonance.residents('garden').some(n=>n.id==='muling')),false);}
 else assert.equal(await page.evaluate(()=>CatBondResonance.view().openingMet),false);
 await screenshot('garden');await press(guide.getByRole('button',{name:tr('下一场景 · 霁潮港','Next scene · Misttide Harbor'),exact:true}));await waitScene('harbor:H-01');
 assert.equal(await page.evaluate(()=>WorldMap.currentRegion),'harbor');assert.equal(await page.evaluate(()=>WorldMap.mode),'region');
 const next=page.locator('[data-next-scene="harbor:H-01"]');await next.waitFor({state:'attached'});await screenshot('harbor');
 // Main story affordance must be visible without menu navigation.
 await next.waitFor({state:'visible'});
 assert.equal(await page.evaluate(()=>CatBondResonance.view().objective.includes('npc:harbor-arrival')),true,'navigation must not complete NPC proof by itself');
 await press(next);await page.waitForFunction(()=>!CatBondResonance.view().objective.includes('npc:harbor-arrival'));await page.locator('.res-host[data-scene="harbor:H-01"]').waitFor();assert.equal(await page.evaluate(()=>CatBondResonance.view().muling),'unmet');
 await screenshot('first-conversation');
 await page.reload();await page.waitForFunction(()=>window.__CAT_BOND_READY__);await press(page.locator('#intro-continue'));await press(page.locator('#intro-slot-list [data-slot="slot1"]'));await waitScene('harbor:H-01');assert.equal(await page.evaluate(()=>CatBondResonance.view().openingMet),meet);assert.equal(await page.locator('#cb-player-first-intro').count(),0);
 assert.equal(await page.evaluate(()=>State.getSaveSlot('slot2')),null);assert.equal(await page.evaluate(()=>State.getSaveSlot('slot3')),null);assert.deepEqual(errors,[]);
 console.log('PASS',name,locale,meet?'encounter':'skip','opening, direct travel, real NPC action, persistence');
 }catch(e){failed=true;console.error('FAIL',name,meet,e);await screenshot('FAIL').catch(()=>{});}finally{await context.close();}
 }
}
await browser.close();if(failed)process.exitCode=1;
