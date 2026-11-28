import {gardenDiscovery} from './starbell-garden-qa.mjs';
import {attachExperienceRecorder} from './cat-bond-experience-recorder.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import {installLocaleProbe,inspectLocale} from './cat-bond-locale-purity.mjs';
const locale=process.env.PROLOGUE_LANG==='zh'?'zh':'en',tr=(zh,en)=>locale==='zh'?zh:en;
const output='artifacts/cat-bond-release-prologue/'+locale;await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true});let failed=false;
for(const profile of [{name:'desktop',viewport:{width:1440,height:900},hasTouch:false},{name:'portrait',viewport:{width:390,height:844},hasTouch:true},{name:'landscape',viewport:{width:844,height:390},hasTouch:true}].filter(p=>!process.env.PROLOGUE_PROFILE||p.name===process.env.PROLOGUE_PROFILE)){
 const {name,...options}=profile;
 for(const meet of [true,false]){
 const context=await browser.newContext(options),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await installLocaleProbe(page);const localeIssues=[];
 await attachExperienceRecorder(context,page,{id:'opening-'+locale+'-'+name+'-'+(meet?'meet':'skip')});
 const screenshot=async id=>{if(id!=='FAIL')localeIssues.push(...await inspectLocale(page,locale,'opening:'+id));return page.screenshot({path:output+'/'+name+'-'+(meet?'meet':'skip')+'-'+id+'.png'});};
 const waitScene=id=>page.waitForFunction(id=>window.CatBondResonance?.view()?.current?.id===id,id,{timeout:45000});
 const press=async locator=>{await locator.waitFor({state:'visible'});if(options.hasTouch)await locator.tap();else await locator.click();};
 try{
 const origin=process.env.CAT_BOND_SMOKE_ORIGIN||'http://127.0.0.1:8765';
 await page.goto(origin+'/cat-bond/?lang='+locale+'&qa=opening-'+name+'-'+(meet?'meet':'skip'));
 if(process.env.SOURCE_SHA)assert.equal(await page.locator('body').getAttribute('data-source-sha'),process.env.SOURCE_SHA,'Exact packaged source');
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
 assert.equal(await page.locator('#cb-title-subtitle').count(),0,'No second-language subtitle');
 const tagline=await page.locator('.cb-intro-tagline').innerText();assert.equal(/[\u4e00-\u9fff]/.test(tagline),locale==='zh','Single-language tagline');
 assert.equal(title.background,'rgba(0, 0, 0, 0)','No title card background');
 assert.equal(title.image,'none','No title card gradient');assert.equal(title.border,'0px');assert.equal(title.shadow,'none');
 for(const rect of [title.title,title.button])assert.ok(rect.left>=-1&&rect.top>=-1&&rect.right<=title.width+1&&rect.bottom<=title.height+1,'Title and start button fit viewport: '+JSON.stringify(title));
 await fs.writeFile(output+'/'+name+'-'+(meet?'meet':'skip')+'-title.json',JSON.stringify(title,null,2));
 await press(page.locator('#intro-start'));await press(page.locator('#intro-slot-list [data-slot="slot1"]'));await waitScene('prologue:P-05');
 const intro=page.locator('#cb-player-first-intro');await intro.waitFor();assert.match(await intro.innerText(),locale==='zh'?/陌生的花园/:/unfamiliar garden/i);assert.doesNotMatch(await intro.innerText(),locale==='zh'?/星铃|巡铃图|署名的信/:/Star Bell|patrol map|unsigned letter/i);
 assert.equal(await page.locator('.cbcp-root:not([hidden])').count(),0);assert.deepEqual(await page.evaluate(()=>State.S.cats.map(c=>c.species)),['jinjc']);
 assert.equal(await page.evaluate(()=>CatBondResonance.view().muling),'unmet');
 assert.equal(await page.evaluate(()=>Object.values(State.S.resonance.evidence).flat().some(o=>o.startsWith('cinematic:'))),false);
 await screenshot('context');await press(intro.getByRole('button',{name:meet?tr('开始探索','Start exploring'):tr('跳过介绍','Skip introduction'),exact:true}));
 const guide=page.locator('.sg-prologue-guide');
 // The fish cake must be discoverable before approaching it or hearing the travel dialogue.
 const snack=page.locator('[data-garden-explore="snack"]');await snack.waitFor({state:'visible'});
 assert.equal(await snack.getAttribute('aria-label'),tr('鱼饼','Fish cake'));
 if(meet){await press(page.locator('[data-npc-talk="muling"]'));const encounter=page.locator('#cb-traveler-encounter');
 assert.equal(await page.locator('.res-garden-bell').count(),0);
 await encounter.waitFor();const seen=[];for(let i=0;i<6;i++){
 seen.push(await encounter.locator('.res-line').innerText());
 await page.waitForFunction(()=>{const p=document.querySelector('#cb-traveler-encounter .res-portrait');return !!(p?.complete&&p.naturalWidth&&p.getClientRects().length)});
 if(i===1||i===2){
  const paints=await page.evaluate(async()=>{const e=__game.yardPlayer(),original=e.draw;let calls=0;e.draw=function(...args){calls++;return original.apply(this,args)};try{await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));return calls;}finally{e.draw=original;}});
  if(i===1)assert.equal(paints,0,'Speaking protagonist must not be painted behind its portrait');else assert.ok(paints>0,'Non-speaking protagonist must return to the garden canvas');
  await screenshot(i===1?'player-dialogue-no-duplicate':'luna-dialogue-player-restored');
 }
 await press(encounter.getByRole('button',{name:i===5?tr('告别','Say goodbye'):tr('继续','Continue'),exact:true}));
 }await encounter.waitFor({state:'detached'});assert.doesNotMatch(seen.join(' '),locale==='zh'?/巡铃图|封印|小曦|那封信/:/patrol map|seal|Sunny|letter/i);
 for(let i=0;i<3;i++){const butterfly=page.locator('[data-garden-explore="butterfly"]');await press(butterfly);await page.waitForFunction(n=>GardenExploration.read(State.S).butterfly===n,i+1,{timeout:45000});}
 await gardenDiscovery(page,'seed',{touch:options.hasTouch});
 await gardenDiscovery(page,'snack',{touch:options.hasTouch});await press(page.getByRole('button',{name:tr('带在身上','Keep for later'),exact:true}));
 assert.equal(await page.evaluate(()=>GardenExploration.read(State.S).butterfly),3);
 assert.equal(await page.evaluate(()=>GardenExploration.read(State.S).seed),true);
 assert.equal(await page.evaluate(()=>GardenExploration.read(State.S).snack),'keep');
 assert.equal(await page.evaluate(()=>CatBondResonance.view().openingMet),true);assert.equal(await page.evaluate(()=>CatBondResonance.residents('garden').some(n=>n.id==='muling')),false);}
 else assert.equal(await page.evaluate(()=>CatBondResonance.view().openingMet),false);
 await screenshot('garden');
 const toggle=guide.locator('.sg-quest-toggle');
 assert.equal(await toggle.getAttribute('aria-expanded'),'false','Main quest starts collapsed');
 await press(toggle);
 await press(guide.getByRole('button',{name:meet?tr('下一场景 · 风铃镇','Next scene · Windchime Town'):tr('跳过此次相遇','Skip this encounter'),exact:true}));await waitScene('harbor:H-01');
 assert.equal(await page.evaluate(()=>WorldMap.currentRegion),'harbor');assert.equal(await page.evaluate(()=>WorldMap.mode),'region');
 const next=page.locator('[data-next-scene="harbor:H-01"]');await next.waitFor({state:'attached'});await screenshot('harbor');
 // Main story affordance must be visible without menu navigation.
 await next.waitFor({state:'visible'});
 assert.equal(await page.evaluate(()=>CatBondResonance.view().objective.includes('npc:harbor-arrival')),true,'navigation must not complete NPC proof by itself');
 await press(next);await page.waitForFunction(()=>!CatBondResonance.view().objective.includes('npc:harbor-arrival'));await page.locator('.res-host[data-scene="harbor:H-01"]').waitFor();assert.equal(await page.evaluate(()=>CatBondResonance.view().muling),'unmet');
 await screenshot('first-conversation');
 await page.reload();await page.waitForFunction(()=>window.__CAT_BOND_READY__);await press(page.locator('#intro-continue'));await press(page.locator('#intro-slot-list [data-slot="slot1"]'));await waitScene('harbor:H-01');assert.equal(await page.evaluate(()=>CatBondResonance.view().openingMet),meet);assert.equal(await page.locator('#cb-player-first-intro').count(),0);
 assert.equal(await page.evaluate(()=>State.getSaveSlot('slot2')),null);assert.equal(await page.evaluate(()=>State.getSaveSlot('slot3')),null);assert.deepEqual(errors,[]);
 await fs.writeFile(output+'/'+name+'-'+(meet?'meet':'skip')+'-locale.json',JSON.stringify(localeIssues,null,2));assert.deepEqual(localeIssues,[],'P1 opening locale purity');
 console.log('PASS',name,locale,meet?'encounter':'skip','opening, direct travel, real NPC action, persistence');
 }catch(e){failed=true;console.error('FAIL',name,meet,e);await screenshot('FAIL').catch(()=>{});}finally{await context.close();}
 }
}
await browser.close();if(failed)process.exitCode=1;
