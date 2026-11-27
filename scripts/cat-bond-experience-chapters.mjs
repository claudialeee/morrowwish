// Complete chapter acceptance using real browser inputs from isolated synthetic chapter starts.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {campaign} from '../public/cat-bond/js/resonance/campaign.mjs';
import {installLocaleProbe,inspectLocale} from './cat-bond-locale-purity.mjs';
import {attachExperienceRecorder,captureExperienceMilestone} from './cat-bond-experience-recorder.mjs';
const root=process.argv[2]||'artifacts/cat-bond-experience',out=root+'/chapter-acceptance',origin='http://127.0.0.1:8765';
await fs.mkdir(out,{recursive:true});
process.env.CAT_BOND_EXPERIENCE='1';
const order=['harbor','forest','forge','sky','library','starfall','finale','epilogue'];
const requested=process.env.CAT_BOND_CHAPTERS?.split(',')||order;
assert.ok(requested.every(c=>order.includes(c)));
const browser=await chromium.launch({headless:true});
const results=[];
const locale=process.env.CAT_BOND_CHAPTER_LOCALE||'en';
assert.ok(['en','zh'].includes(locale),'Chapter locale must be en or zh');
const labels=Object.freeze({
  "Tide cave logbook": "潮洞日志",
  "Storm boat": "遇险小船",
  "Lighthouse mirrors": "灯塔反射镜",
  "Chase the runaway chime": "穿过风铃巷",
  "Take shortcut": "抄近路",
  "Belllight beast": "铃光兽",
  "Town bell sanctuary": "古铃圣所",
  "Coming Home": "归家调",
  "Moonleaf bridge": "拨动月叶 · 根桥",
  "Break the forest loop": "打破森林回环",
  "Ancient-root sanctuary": "古根圣所",
  "Living Roots": "相枝调",
  "Help Xiaomao put on a show": "帮小铆演一场灯影",
  "Finish the show and meet Xiaomao": "演完啦，去找小铆",
  "Light the stone bridge": "照亮石桥",
  "Shadow beast": "剪影兽",
  "Lantern sanctuary": "千灯圣所",
  "Song of Ember": "承火调",
  "Catch the wind · Practice gliding": "借风起飞 · 练习滑翔",
  "Find the moon gate · Cloud route": "寻找月门 · 云间航线",
  "Joint gliding platform": "双猫滑翔台",
  "Windwing sanctuary": "风翼圣所",
  "Open Sky": "逐风调",
  "Walk around the lookout": "沿观景台走走",
  "Sit beside Muling": "坐到暮铃身边",
  "Moonmirror sanctuary": "月镜圣所",
  "Reflections": "照影调",
  "Public records · Investigation": "公开记录 · 调查",
  "Ask about the borrowed map": "问借图的事",
  "Six-region model · Compare the two routes": "六地桌上模型 · 验证两条路线",
  "Routes explored 1/2": "已体验路线 1/2",
  "Routes explored 2/2": "已体验路线 2/2",
  "Finish demonstration": "结束演示",
  "Walk on starlight": "踩着星光走",
  "Observatory · Complete record": "天文台 · 完整灾变记录",
  "Remember the choice": "回想当年的抉择",
  "Test the neighboring bells": "邻铃试音",
  "Starfall sanctuary": "星原圣所",
  "Beyond Stars": "续星调",
  "Watch the story scene": "观看剧情",
  "Approach the Star Bell": "前往中央星铃",
  "Help Muling release the last lock": "协助暮铃打开最后一道锁",
  "Hold the bell chain": "按住铃链",
  "Give Muling the key": "交给暮铃",
  "THE BELL RINGS AGAIN": "星铃再次响起",
  "Return to Sunlit Garden": "回到阳光花园",
  "Choose the left cat": "选左边的猫",
  "Move and ring": "换位置，摇铃",
  "Choose the right cat": "选右边的猫",
  "Two Mulings in the mirror": "镜中的两只暮铃",
  "Dew · Low": "露珠 · 低音",
  "Starlight · Middle": "星光 · 中音",
  "Flower bell · High": "花铃 · 高音",
  "FURNACE STABILIZED": "熔炉试验完成",
  "Turn left light": "转动左灯",
  "Turn center light": "转动中灯",
  "Turn right light": "转动右灯",
  "Outer ring": "外环",
  "Middle ring": "中环",
  "Inner ring": "内环",
  "Ring the local bell": "摇响古铃",
  "Free the trapped kitten": "帮小猫离开根丛",
  "Far bank": "对岸",
  "Continue festival": "继续庆典",
  "Cross the bridge": "走过石桥",
  "Aim left": "向左",
  "Aim right": "向右",
  "Turn moonleaf": "拨动月叶",
  "Left mirror": "左镜",
  "Center mirror": "中镜",
  "Right mirror": "右镜",
  "Upstream": "上游",
  "Branch": "支流",
  "Roots": "根系",
  "Fork": "岔路",
  "Canopy": "树冠",
  "Cat": "猫",
  "Return": "返回",
  "Continue": "继续",
  "Continue story": "继续剧情",
  "Explore": "探索",
  "Start exploring": "开始探索",
  "Jump to stone 2": "跳向星石 2",
  "Jump to stone 4": "跳向星石 4",
  "Jump to stone 6": "跳向星石 6",
  "Jump to stone 8": "跳向星石 8",
  "Talk to Muling": "交谈 暮铃",
  "Invite Muling": "邀请 暮铃",
  "Talk to Qilan": "交谈 栖蓝",
  "Invite Qilan": "邀请 栖蓝",
  "Talk to Yandeng": "交谈 檐灯",
  "Invite Yandeng": "邀请 檐灯",
  "Talk to Yahe": "交谈 芽禾",
  "Invite Yahe": "邀请 芽禾",
  "Talk to Yuchuan": "交谈 榆川",
  "Invite Yuchuan": "邀请 榆川",
  "Talk to Jinpo": "交谈 烬婆",
  "Invite Jinpo": "邀请 烬婆",
  "Talk to Xiaomao": "交谈 小铆",
  "Invite Xiaomao": "邀请 小铆",
  "Talk to Yuanfan": "交谈 远帆",
  "Invite Yuanfan": "邀请 远帆",
  "Talk to Baikan": "交谈 白栞",
  "Invite Baikan": "邀请 白栞",
  "Talk to Moye": "交谈 墨页",
  "Invite Moye": "邀请 墨页",
  "Talk to Lichuan": "交谈 砾川",
  "Invite Lichuan": "邀请 砾川",
  "Talk to Xingya": "交谈 星芽",
  "Invite Xingya": "邀请 星芽"
});
const local=label=>{if(locale==='en')return label;if(!Object.hasOwn(labels,label))throw Error('Missing Chinese test selector: '+label);return labels[label];};
const continuous=process.env.CAT_BOND_CONTINUOUS==='1',portrait=process.env.CAT_BOND_PORTRAIT==='1';let earnedSave=null;
if(continuous)assert.deepEqual(requested,order,'Fresh campaign must cover every chapter in sequence');
async function run(chapter){
 const expected=campaign.scenes.filter(s=>s.chapter===chapter),start=expected[0].id;
 const next=campaign.scenes[campaign.scenes.findIndex(s=>s.id===expected.at(-1).id)+1]?.id||null;
 const fixture=continuous?null:JSON.parse(await fs.readFile(root+'/synthetic-checkpoints/'+start.replace(':','-')+'.json','utf8'));
 if(fixture)assert.equal(fixture.provenance,'synthetic engine-model browser-restored');
 const context=await browser.newContext({...(continuous?(earnedSave?{storageState:earnedSave}:{}):{storageState:fixture.storageState}),...(portrait?{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2}:{viewport:{width:1440,height:900}})});
 await context.route('**/*',r=>{const u=new URL(r.request().url());return u.origin===origin||['data:','blob:'].includes(u.protocol)?r.continue():r.abort();});
 const page=await context.newPage(),errors=[],readLines=[],steps=[],battleMeasurements=[],localeIssues=[];
 const cdp=portrait?await context.newCDPSession(page):null;
 const tapAt=async(x,y)=>portrait?page.touchscreen.tap(x,y):page.mouse.click(x,y);
 const touch=async(type,p)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:p?[p]:[]});
 async function gesture(a,b,hold=0){
  if(portrait){await touch('touchStart',a);try{if(b)for(let i=1;i<=8;i++)await touch('touchMove',{x:a.x+(b.x-a.x)*i/8,y:a.y+(b.y-a.y)*i/8});if(hold)await page.waitForTimeout(hold);}finally{await touch('touchEnd');}}
  else{await page.mouse.move(a.x,a.y);await page.mouse.down();try{if(b)await page.mouse.move(b.x,b.y,{steps:8});if(hold)await page.waitForTimeout(hold);}finally{await page.mouse.up();}}
 }
 const activate=async locator=>portrait?locator.tap():locator.click();
 await installLocaleProbe(page);
 page.setDefaultTimeout(18000);page.on('pageerror',e=>errors.push(e.message));
 await attachExperienceRecorder(context,page,{id:(continuous?'fresh-':'chapter-')+chapter,root:out,synthetic:!continuous,chapterEntry:continuous?null:start});
 const view=()=>page.evaluate(()=>CatBondResonance.view());
 const scene=id=>page.waitForFunction(id=>{const v=CatBondResonance.view();return v.current?.id===id||(id==='epilogue:E-01'&&v.current?.id==='epilogue:E-02'&&v.completed.includes(id));},id,{timeout:35000});
 const shot=async id=>{if(id!=='FAIL')localeIssues.push(...await inspectLocale(page,locale,chapter+':'+id));return page.screenshot({path:out+'/'+chapter+'-'+id.replace(':','-')+'.png'});};
 async function click(label,scope=page,alreadyLocalized=false){
  label=alreadyLocalized?label:local(label);
  const b=scope.getByRole('button',{name:label,exact:true}).first();
  if(scope===page&&!await b.isVisible()){
   const hidden=page.getByRole('button',{name:label,exact:true,includeHidden:true}).or(page.locator('button').and(page.getByText(label,{exact:true})));
   await hidden.first().waitFor({state:'attached'});
   if(!await b.isVisible()&&await page.locator('.rw-region-toggle[aria-expanded="false"],.rw-atlas-menu:not([open]) > summary').count()){
    const t=page.locator('.rw-region-toggle[aria-expanded="false"]:visible,.rw-atlas-menu:not([open]) > summary:visible').first();if(await t.count())await t.click();else{await page.locator('#map-menu').click();await page.locator('#cb-system-menu [data-system="world-explore"]').click();}
   }
   const optional=page.locator('.rw-optional-actions:not([open]) > summary:visible');
   if(!await b.isVisible()&&await optional.count())await optional.first().click();
   const prev=page.locator('[data-fit-prev]:visible'),next=page.locator('[data-fit-next]:visible');
   for(let i=0;i<20&&!await b.isVisible()&&await prev.count()&&await prev.isEnabled();i++)await prev.click();
   for(let i=0;i<20&&!await b.isVisible()&&await next.count()&&await next.isEnabled();i++)await next.click();
  }
  await b.waitFor({state:'visible'});
  if(locale==='zh')localeIssues.push(...await inspectLocale(page,locale,chapter+':action:'+label));
  steps.push({scene:(await view()).current?.id,action:label});await activate(b);
 }
 async function trial(id,actions){const modal=page.locator("[data-adventure=trial-"+id+"]");await modal.waitFor({state:"visible",timeout:15000});for(const a of actions)await modal.locator("[data-play-action="+a+"]").click();assert.equal(await modal.getAttribute("data-complete"),"true");await shot("trial-"+id);await modal.getByRole("button",{name:local("Return"),exact:true}).click();await modal.waitFor({state:"detached"});}
 const op=async(id)=>page.waitForFunction(op=>!CatBondResonance.view().objective.includes(op),id,{timeout:35000});
 async function talk(npc){
  const before=await view();
  const pending=before.objective.find(o=>o.startsWith('npc:'));
  if(locale==='zh'&&await page.evaluate(()=>__game.scene==='yard'))await click('与'+({Muling:'暮铃'})[npc]+'对话',page,true);else await click('Talk to '+npc);
  if(pending&&!['npc:public-accountability','npc:second-garden-key'].includes(pending))await op(pending);
  else if(before.current?.lines.length)await page.locator('.res-host[data-scene="'+before.current.id+'"]').waitFor();
 }
 async function dialogue(id,choice){
  const dlg=page.locator('.res-host[data-scene="'+id+'"]');
  for(let i=0;i<50;i++){
   const v=await view();if(v.current?.id!==id)return;
   const canChoose=!v.choice&&v.current.choices.length>0&&(v.current.choiceTiming==='beforeAction'||v.cursor===(v.current.choiceAt??v.current.lines.length));
   const canRead=v.lineReady&&v.cursor<v.current.lines.length;
   if(!canChoose&&!canRead){if(id!=='epilogue:E-03'&&await dlg.isVisible())await dlg.waitFor({state:'hidden',timeout:20000});return;}
   if(!await dlg.isVisible()){
    // Wait for the normal event-driven presentation first. Resume only via a real control.
    await dlg.waitFor({timeout:2500}).catch(()=>{});
    if(!await dlg.isVisible()){
     if(await page.evaluate(()=>__game.scene)==='yard')await talk('Muling');
     else await click('Continue story');
    }
    await dlg.waitFor();
   }
   if(canChoose){const selected=v.current.choices.find(c=>c.label.en===choice)||v.current.choices[0];await click(selected.label[locale],dlg,true);await page.waitForFunction(({id,choice})=>CatBondResonance.view().current?.id!==id||CatBondResonance.view().choice===choice,{id,choice:selected.id});continue;}
   const line=v.current.lines[v.cursor];
   await page.waitForFunction(t=>document.querySelector('.res-host .res-line')?.textContent===t,line.text[locale]);
   readLines.push({scene:id,cursor:v.cursor,speaker:line.speaker,text:line.text[locale]});
   if(/^library:M-0[345]$/.test(id)){
    const body=dlg.locator('.res-body'),panel=dlg.locator('.res-dialogue');
    const [b,p]=await Promise.all([body.boundingBox(),panel.boundingBox()]);
    assert.ok(b&&p&&b.width>=p.width*.9&&b.x>=0&&b.x+b.width<=1441,'Library reveal dialogue must occupy its full readable row');
    if(v.cursor===0||v.cursor===v.current.lines.length-1)await page.waitForFunction(()=>{const stage=document.querySelector('.library-reveal-stage');const img=stage?.querySelector('.library-reveal-painting.is-current');return stage?.dataset.ready==='true'&&img&&Number(getComputedStyle(img).opacity)>=.95;});
   }
   if(v.cursor===0||v.cursor===v.current.lines.length-1)await shot(id+'-'+v.cursor);
   else if(locale==='zh')localeIssues.push(...await inspectLocale(page,locale,chapter+':dialogue:'+id+':'+v.cursor));
   await page.waitForFunction(()=>!document.querySelector('.res-host .res-skip-top')?.disabled);
   await dlg.locator('.res-line').click();
   await page.waitForFunction(({id,cursor})=>{const v=CatBondResonance.view();return v.current?.id!==id||v.cursor>cursor;},{id,cursor:v.cursor});
  }
  throw Error('Dialogue loop '+id);
 }
 let checkedPuzzleLayout=false;
 async function checkPuzzleLayout(){
  const rail=page.locator('.rw-dedicated-rail'),surface=page.locator('.rw-world .rw-surface');
  await rail.waitFor();
  const measure=async()=>{try{await page.waitForFunction(()=>{const a=document.querySelector('.rw-dedicated-rail'),b=document.querySelector('.rw-world .rw-surface');if(!a||!b)return false;const x=a.getBoundingClientRect(),y=b.getBoundingClientRect();return x.width>0&&y.width>0&&(x.left>=y.right-1||y.bottom<=x.top+1||x.bottom<=y.top+1||y.left>=x.right-1);},null,{timeout:5000});}catch(e){const layout=await page.evaluate(()=>Object.fromEntries(['.rw-world','.rw-shell','.rw-surface','.rw-dedicated-rail'].map(sel=>{const el=document.querySelector(sel);if(!el)return [sel,null];const r=el.getBoundingClientRect(),s=getComputedStyle(el);return [sel,{rect:r.toJSON(),classes:el.className,display:s.display,inset:s.inset,width:s.width,height:s.height,gridArea:s.gridArea}]})));throw Error('Minigame layout overlap '+JSON.stringify(layout),{cause:e});}
   assert.ok(await rail.locator('.rw-minigame-title').isVisible(),'Minigame goal is visible');
   assert.ok(await rail.locator('.rw-minigame-hint').isVisible(),'Minigame controls are explained');
   const [a,b]=await Promise.all([rail.boundingBox(),surface.boundingBox()]);
   assert.ok(a&&b&&b.width>80&&b.height>45,'Playable scene is not collapsed');
   assert.ok(a.x>=-1&&a.y>=-1&&a.x+a.width<=page.viewportSize().width+1&&a.y+a.height<=page.viewportSize().height+1,'Controls remain on screen');
  };
  await measure();
  if(!checkedPuzzleLayout){checkedPuzzleLayout=true;const original=page.viewportSize();if(!portrait){try{for(const viewport of [{width:390,height:844},{width:844,height:390}]){await page.setViewportSize(viewport);await measure();}}finally{await page.setViewportSize(original);}}await measure();}
 }
 async function puzzle(label,inputs){
  const directHarbor={'Tide cave logbook':'explore:tide-logbook','Storm boat':'rescue:storm-boat','Lighthouse mirrors':'puzzle:beam-mirrors','Town bell sanctuary':'repair:harbor','Coming Home':'melody:harbor'};
  if(chapter==='harbor'&&directHarbor[label]){const operation=directHarbor[label];assert.ok((await view()).objective.includes(operation),'Expected required harbor action '+operation);await click(label);await op(operation);await shot(operation);return;}
  await click(label);const controls=page.locator('.rw-puzzle-controls');await controls.waitFor();await checkPuzzleLayout();
  for(const input of inputs){if(locale==='zh'&&input==='Roots'&&['Moonleaf bridge','Break the forest loop'].includes(label))await click('地下',controls,true);else await click(input,controls);}
  await controls.waitFor({state:'hidden',timeout:35000});
 }
 async function invite(npc){await click('Invite '+npc);await page.getByRole('button',{name:local('Invite '+npc),exact:true,includeHidden:true}).waitFor({state:'detached'});}
 async function restore(label,inputs,people,melody,notes){const direct={forest:"repair:forest",forge:"repair:forge",starfall:"repair:starfall"}[chapter];if(direct){assert.equal(inputs.length,0,"Retired restoration minigames must not be scripted as success");await click(label);await op(direct);assert.equal(await page.locator(".rw-puzzle-controls:visible").count(),0,"Restoration must not launch a retired dial puzzle: "+direct);await shot(direct+"-no-legacy-puzzle");}else await puzzle(label,inputs);if(chapter==='harbor')for(const npc of people)await invite(npc);await puzzle(melody,['forge','sky','library','starfall'].includes(chapter)?notes.slice(-1):notes);}
 const low='Dew · Low',mid='Starlight · Middle',high='Flower bell · High';
 async function flyWaterfall(label){
  await click(label);const status=page.locator('[data-sky-flight-status][data-route="open"]');await status.waitFor();await checkPuzzleLayout();
  const box=await page.locator('.rw-surface').boundingBox();assert.ok(box,"flight surface");
  await tapAt(box.x+box.width*.35,box.y+box.height*.30);
  // Route is continuous, not a three-gate sequence. Read only visual progress via
  // the canvas status; the underlying flight completion must come from real pointer input.
  await page.waitForFunction(()=>Number(document.querySelector('[data-sky-flight-status]')?.dataset.progress)>=.74,{timeout:20000});
  await tapAt(box.x+box.width*.35,box.y+box.height*.50);
  await status.waitFor({state:'hidden',timeout:20000});
}
 async function fly(label,heights){
  await click(label);const status=page.locator('[data-sky-flight-status]');await status.waitFor();await checkPuzzleLayout();const box=await page.locator('.rw-surface').boundingBox();
  const p=y=>({x:box.x+box.width*.30,y:box.y+box.height*y});
  let q=p(heights[0]);await page.mouse.move(q.x,q.y);await page.mouse.down();
  try{for(let i=1;i<=3;i++){await page.waitForFunction(g=>Number(document.querySelector('[data-sky-flight-status]')?.dataset.gates)===g,i,{timeout:25000});q=p(i===3?.5:heights[i]);await page.mouse.move(q.x,q.y,{steps:5});}}finally{await page.mouse.up();}
  await status.waitFor({state:'hidden',timeout:30000});
 }
 async function battle(label,operation,type='regional'){
  await click(label);await page.locator('#panel [data-battle-auto="true"]').click();await page.locator('#bp-go').click();await page.locator('#battle-ui.on').waitFor();
  const tutorial=page.locator('#battle-tutorial-skip');if(await tutorial.isVisible())await tutorial.click();
  if(portrait){
   const fit=await page.evaluate(()=>{const stage=document.querySelector('#stage').getBoundingClientRect(),dock=document.querySelector('#battle-ui .move-bar').getBoundingClientRect(),buttons=[...document.querySelectorAll('#battle-ui .move-bar .move')].filter(e=>e.getBoundingClientRect().width&&getComputedStyle(e).display!=='none').map(e=>{const r=e.getBoundingClientRect();return {id:e.id,w:r.width,h:r.height,left:r.left,top:r.top,right:r.right,bottom:r.bottom};});return {stage:{left:stage.left,top:stage.top,right:stage.right,bottom:stage.bottom},dock:{top:dock.top,bottom:dock.bottom},buttons,fieldBottom:stage.top+__game.H-__game.battle.bottomMargin};});
   assert.ok(fit.buttons.length>=5&&fit.buttons.every(r=>r.w>=44&&r.h>=44&&r.left>=fit.stage.left-1&&r.right<=fit.stage.right+1&&r.bottom<=fit.stage.bottom+1),'portrait skill targets '+JSON.stringify(fit));
   assert.ok(fit.fieldBottom<=fit.dock.top+2,'combat field reserved above skill dock '+JSON.stringify(fit));
   if(type==='finale'){
    const goal=page.locator('#cb-finale-compact'),details=page.locator('#cb-finale-hud');
    await goal.waitFor({state:'visible'});await page.waitForFunction(()=>document.querySelector('#cb-finale-compact [data-compact-goal]')?.textContent&&document.querySelector('#cb-finale-compact [data-compact-count]')?.textContent);
    assert.equal(await details.isVisible(),false,'Finale details must not cover the field by default');
    const original=page.viewportSize();
    for(const viewport of operation==='battle:inward-gates'?[{width:320,height:568},original,{width:430,height:932}]:[original]){
     await page.setViewportSize(viewport);
     await page.waitForFunction(()=>{const g=document.querySelector('#cb-finale-compact'),bar=document.querySelector('#battle-ui .battle-topbar'),menu=document.querySelector('#cb-system-toggle'),r=g.getBoundingClientRect(),b=bar.getBoundingClientRect(),m=menu?.getBoundingClientRect();return r.height>=44&&r.width>=44&&r.bottom<=b.top+1&&(!m||r.right<=m.left+1)&&g.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2));});
     await shot(operation+'-goal-'+viewport.width);
    }
    await page.setViewportSize(original);await goal.tap();await details.waitFor({state:'visible'});
    assert.equal(await goal.getAttribute('aria-expanded'),'true');await goal.tap();await details.waitFor({state:'hidden'});assert.equal(await goal.getAttribute('aria-expanded'),'false');
   }
  }
  await shot(operation+'-battle');
  const before=await page.evaluate(()=>__game.battle?.team?.map(f=>({actor:f.cat?.storyActor||f.cat?.species,level:f.cat?.level,hp:f.hp,maxhp:f.maxhp})));
  const t=Date.now();
  const measurement={scene:(await view()).current?.id,operation,type,mode:'auto',initialTeam:before,status:'started',samples:[]};
  battleMeasurements.push(measurement);
  // Read-only observation of the actual game. Keep the last live battle state
  // even when the battle object is destroyed before the result panel appears.
  await page.evaluate(()=>{
   if(window.__cbChapterBattleTrace)clearInterval(window.__cbChapterBattleTrace.timer);
   const trace={samples:[]};
   const sample=()=>{
    const b=window.__game?.battle;
    if(!b||trace.samples.length>=1800)return;
    const finale=b.resonanceFinale;
     trace.samples.push({t:b.t,duoUses:b.duoUses??null,result:b.result??null,
      finale:finale?{elapsed:finale.elapsed,phase:finale.id,nodes:finale.nodes.map(n=>({region:n.region,done:n.done,integrity:n.integrity,progress:n.progress,cleared:n.reply?.cleared??null,interference:n.reply?.interference??null}))}:null,
     team:(b.team||[]).map(f=>({actor:f.cat?.storyActor||f.cat?.species||null,level:f.cat?.level??null,hp:f.hp,maxhp:f.maxhp,alive:f.alive})),
     enemies:(b.enemies||[]).map(f=>({hp:f.hp,maxhp:f.maxhp,alive:f.alive}))});
   };
   sample();trace.timer=setInterval(sample,250);window.__cbChapterBattleTrace=trace;
  });
  try{
  if(type==='forge'){
   for(let i=0;i<240;i++){if(await page.locator('#cb-forge-result').isVisible())break;const support=page.locator('[data-forge-support-button]');if(await support.isVisible()&&await support.isEnabled())await support.click();await page.waitForTimeout(750);}
   await page.locator('#cb-forge-result').waitFor({timeout:180000});await shot(operation+'-result');assert.equal(await page.locator('#cb-forge-result h2').innerText(),local('FURNACE STABILIZED'));await page.locator('[data-forge-return]').click();
  }else if(type==='finale'){
   if(operation==='battle:identify-echo'){await page.waitForFunction(()=>__game.battle?.resonanceFinale?.probeChanged===true||!!document.getElementById('cb-finale-result'),null,{timeout:30000});await shot(operation+'-live-reply');}
   const result=page.locator('#cb-finale-result');
    if(operation==='battle:central-echo'){
     // The runtime has its own active-simulation time cap. CI rendering may run
     // slower than real time; allow bounded wall-clock headroom, but fail on a frozen simulation.
     const deadline=Date.now()+360000;let lastT=-1,lastAdvance=Date.now();
     while(!await result.isVisible()){
      const state=await page.evaluate(()=>({t:__game.battle?.t,phase:__game.battle?.resonanceFinale?.id,elapsed:__game.battle?.resonanceFinale?.elapsed}));
      if(Number.isFinite(state.t)&&state.t>lastT){lastT=state.t;lastAdvance=Date.now();}
      if(Date.now()-lastAdvance>35000||Date.now()>deadline)throw Error('Central echo simulation stalled or exceeded bounded wall time: '+JSON.stringify(state));
      if(errors.length)throw Error('Central echo browser error: '+errors.join('; '));
      await page.waitForTimeout(1000);
     }
    }else await result.waitFor({timeout:240000});
    await shot(operation+'-result');assert.equal(await result.getAttribute('data-finale-outcome'),'saved');await page.locator('[data-finale-return]').click();
  }else{
   await page.waitForFunction(()=>__game.scene==='map',null,{timeout:180000});
   await page.locator('#library-battle-ok').waitFor();await shot(operation+'-result');await page.locator('#library-battle-ok').click();
  }
  await op(operation);if(operation==='battle:central-echo')assert.equal(await page.evaluate(()=>CatBondResonance.snapshot().support.length),6,'All six regions must have answered');
  measurement.status='verified win';
  }finally{
   measurement.wallSeconds=(Date.now()-t)/1000;
   measurement.samples=await page.evaluate(()=>{
    const trace=window.__cbChapterBattleTrace;
    if(!trace)return [];
    clearInterval(trace.timer);delete window.__cbChapterBattleTrace;return trace.samples;
   }).catch(()=>[]);
   measurement.last=measurement.samples.at(-1)||null;
    if(measurement.status!=='verified win')console.error('BATTLE LAST STATE',operation,JSON.stringify(measurement.last));
   await fs.writeFile(out+'/'+chapter+'-combat.json',JSON.stringify({provenance:'synthetic chapter start, actual browser battles',chapter,battles:battleMeasurements},null,2));
  }
  assert.ok(measurement.samples.length,'Actual combat telemetry is required: '+operation);
  steps.push({battle:operation,wallSeconds:measurement.wallSeconds,team:before,result:measurement.status,gameSeconds:measurement.last?.t,duoUses:measurement.last?.duoUses});
 }
 async function artProfiles(label,art,action=null){
  const original=page.viewportSize();
  try{
   for(const [device,viewport] of (portrait?[['portrait',original]]:[['desktop',original],['portrait',{width:390,height:844}],['landscape',{width:844,height:390}]])){
    await page.setViewportSize(viewport);
    await art.waitFor({state:'visible'});
    const bounds=await art.boundingBox();
    assert.ok(bounds&&bounds.width>0&&bounds.height>0,label+' renders in '+device);
    if(action)assert.ok(await action.isVisible(),label+' keeps its action visible in '+device);
    await shot(label+'-'+device);
   }
  }finally{await page.setViewportSize(original);}
 }
 async function cinema(id,label){
  await scene(id);await page.waitForFunction(()=>CatBondChapterCinematics.developmentReady(),null,{timeout:15000});await click(label);
  await page.locator('.cbcp-art').first().waitFor();await shot(id+'-cinematic');
  if(id==='finale:B-04'){const reply=page.getByRole('button',{name:locale==='zh'?'摇两下铃回应':'Ring twice in reply',exact:true});await reply.waitFor();await shot(id+'-ring-reply');await reply.click();}
  if(id==='starfall:F-02'&&!continuous){await page.waitForFunction(()=>{const root=document.querySelector('.cbcp-root');if(root?.dataset.frameId!=='starfall:F-02-last-patrol')return false;const art=root.querySelector('.cbcp-art[src$="lantern-entrustment.jpg"]');return art&&art.complete&&art.naturalWidth>0&&Number(getComputedStyle(art).opacity)>=.95;},{},{timeout:45000});await shot(id+'-lamp-handoff');await page.locator('.cbcp-skip').click();const summary=page.locator('[data-canon-acknowledgement="starfall:F-02"]');await summary.waitFor();assert.match(await summary.innerText(),locale==='zh'?/答应过暮铃/:/promised Muling/);assert.equal((await view()).current.id,id);await shot(id+'-skip-summary');await click('Continue',summary);}
  await page.waitForFunction(id=>CatBondResonance.view().current?.id!==id,id,{timeout:180000});
 }
 async function libraryEcho(){
  await click('Two Mulings in the mirror');const controls=page.locator('.rw-puzzle-controls');await controls.waitFor();await checkPuzzleLayout();
  const status=controls.locator('[data-mirror-response]');await status.waitFor();
  await click('Choose the left cat',controls);await status.waitFor();assert.equal(await status.getAttribute('data-position'),'0','guess cannot complete the scene');
  await click('Move and ring',controls);await status.waitFor();
  const left=Number(await status.getAttribute('data-left-facing')),right=Number(await status.getAttribute('data-right-facing')),position=Number(await status.getAttribute('data-position'));
  assert.ok(position!==0&&(left===position)!==(right===position),'new action must distinguish the cats');
  await shot('mirror-new-response');await click(left===position?'Choose the left cat':'Choose the right cat',controls);
  await controls.waitFor({state:'hidden'});
 }
 try{
  await page.goto(origin+'/cat-bond/?lang='+locale+'&rpgDev=1');
  await page.waitForFunction(()=>window.__CAT_BOND_READY__&&window.CatBondResonance);
  await page.evaluate(l=>MorrowwishI18n.set(l),locale);
  await page.waitForFunction(l=>document.documentElement.lang.startsWith(l),locale);
  if(continuous&&!earnedSave){
   assert.equal(chapter,'harbor');await page.locator('#intro-start').click();await page.locator('#intro-slot-list [data-slot="slot1"]').click();await scene('prologue:P-05');
   await page.locator('#cb-player-first-intro').getByRole('button',{name:local('Start exploring'),exact:true}).click();
   // Start from a new slot, no fixture or direct state mutation.
   if(locale==='zh'){
    await shot('prologue-intro');
    await page.locator('[data-npc-talk="muling"]').click();const encounter=page.locator('#cb-traveler-encounter');
    await encounter.getByRole('button',{name:'寻找航图',exact:true}).click();await encounter.waitFor({state:'detached'});
    for(const id of ['chart-0','chart-echo','chart-1']){await page.locator('[data-garden-explore="'+id+'"]').click();await shot('prologue-'+id);}
    await page.locator('[data-npc-talk="muling"]').click();await shot('prologue-encounter');
    await encounter.getByRole('button',{name:'继续',exact:true}).click();await encounter.getByRole('button',{name:'告别',exact:true}).click();
    await encounter.waitFor({state:'detached'});assert.equal(await page.evaluate(()=>CatBondResonance.view().openingMet),true);await shot('prologue-garden');
   }
   await page.locator('.sg-prologue-guide').getByRole('button',{name:locale==='zh'?/下一场景/:/Next scene/}).click();await scene(start);
  }else{await page.locator('#intro-continue').click();await page.locator('#intro-slot-list [data-slot="slot1"]').click();await scene(start);}
  assert.ok(start==='epilogue:E-01'||!(await view()).completed.includes(start),'Chapter start is not already completed');
  await page.waitForFunction(()=>['map','yard'].includes(__game.scene));
  // Continue can restore to the atlas rather than directly to its region.
  // Navigate via the actual visible next-scene control; never set WorldMap state.
  if(await page.evaluate(region=>__game.scene==='map'&&(WorldMap.mode!=='region'||(region!=='epilogue'&&WorldMap.currentRegion!==region)),chapter==='finale'?'starfall':chapter)){
   if(!await page.locator('[data-next-scene="'+start+'"]').isVisible())await page.locator('.rw-quest-toggle[aria-expanded="false"]').click();await page.locator('[data-next-scene="'+start+'"]:visible').click();
  }
  await page.waitForFunction(()=>WorldMap.mode==='region'||__game.scene==='yard');
  if(chapter==='finale'&&await page.evaluate(()=>__game.scene==='yard')){
   const travel=page.getByRole('button',{name:local('Explore'),exact:true});
   if(await travel.isVisible())await travel.click();
   else {await page.locator('#map-menu').click();await page.locator('#cb-system-menu [data-system="world-explore"]').click();}
   if(!await page.locator('[data-next-scene="'+start+'"]').isVisible())await page.locator('.rw-quest-toggle[aria-expanded="false"]').click();await page.locator('[data-next-scene="'+start+'"]:visible').click();
   await page.waitForFunction(()=>WorldMap.mode==='region');
  }
  // Verify the actual canvas affordances rather than only the menu buttons.
  if(await page.evaluate(()=>__game.scene==='map'&&WorldMap.mode==='region')){
   await page.waitForFunction(()=>JSON.parse(document.querySelector('.rw-surface')?.dataset.affordances||'[]').length>0);
   const markers=await page.locator('.rw-surface').evaluate(el=>JSON.parse(el.dataset.affordances||'[]'));
   const geometry=await page.locator('.rw-surface').evaluate(e=>[Number(e.dataset.logicalWidth||960),Number(e.dataset.logicalHeight||540)]);for(const m of markers){assert.ok(m.x>=0&&m.x<=geometry[0]&&m.y>=0&&m.y<=geometry[1],'Marker inside world: '+m.t);if(m.rect)assert.ok(m.rect.x>=0&&m.rect.y>=0&&m.rect.x+m.rect.w<=geometry[0]&&m.rect.y+m.rect.h<=geometry[1],'Label inside world: '+m.t);}
   await shot('interaction-markers');
  }
  if(chapter==='harbor'){
   await talk('Qilan');await dialogue('harbor:H-01');await scene('harbor:H-02');
   await click('Chase the runaway chime');const chase=page.locator('[data-spatial="chase"]');await chase.waitFor();if(portrait){const surface=page.locator('.rw-surface');await page.waitForFunction(()=>document.querySelector('.rw-world')?.dataset.artReady==='true');const b=await surface.boundingBox();assert.ok(b.height>b.width,'native portrait chase');for(const viewport of [{width:320,height:568},{width:390,height:844},{width:430,height:932}]){await page.setViewportSize(viewport);await page.waitForFunction(()=>{const e=document.querySelector('.rw-chase-mode .rw-surface'),r=e?.getBoundingClientRect(),s=e?.parentElement?.getBoundingClientRect();return !!r&&!!s&&r.height>=s.height-2&&r.width>=s.width-2&&r.height>r.width;});await page.screenshot({path:out+'/portrait-chase-'+viewport.width+'.png'});}await page.setViewportSize({width:390,height:844});await click('Take shortcut');await chase.waitFor({state:'hidden',timeout:30000});}else if(continuous){await page.keyboard.down('ArrowUp');await page.waitForTimeout(920);await page.keyboard.up('ArrowUp');await page.keyboard.down('ArrowRight');await chase.waitFor({state:'hidden',timeout:15000});await page.keyboard.up('ArrowRight');}else{const surface=page.locator('.rw-surface');const bounds=await surface.boundingBox();await surface.click({position:{x:bounds.width*.8,y:bounds.height*.35}});await chase.waitFor({state:'hidden',timeout:30000});}await dialogue('harbor:H-02');await scene('harbor:H-03');
   await talk('Yandeng');await dialogue('harbor:H-03');await scene('harbor:H-04');
   await battle('Belllight beast','battle:chime-beast');await dialogue('harbor:H-04');await scene('harbor:H-05');
   await restore('Town bell sanctuary',['Left mirror','Center mirror','Center mirror','Right mirror'],['Qilan','Yandeng'],'Coming Home',[low,high,mid]);await dialogue('harbor:H-05');await trial('qilan',['deploy','cast']);
  }else if(chapter==='forest'){
   await talk('Yahe');await dialogue('forest:R-01');await scene('forest:R-02');await trial('yahe',['deploy','escort']);
   await puzzle('Moonleaf bridge',['Fork','Roots','Turn moonleaf','Roots','Free the trapped kitten','Far bank']);await dialogue('forest:R-02');await scene('forest:R-03');
   await puzzle('Break the forest loop',['Fork','Canopy','Turn moonleaf','Canopy','Far bank']);await dialogue('forest:R-03');await scene('forest:R-04');
   await restore('Ancient-root sanctuary',[],['Yahe','Yuchuan'],'Living Roots',[mid,low,high]);await dialogue('forest:R-04');
  }else if(chapter==='forge'){
   await click('Help Xiaomao put on a show');const festival=page.locator('.rw-festival-card');await festival.waitFor();assert.equal(await page.locator('.rw-dedicated-rail:visible').count(),0,'Festival must be a story scene, not a control rail');assert.equal(await festival.locator('button').count(),4);await click('Cat',festival);assert.equal(await festival.getByRole('button',{name:local('Cat'),exact:true}).getAttribute('aria-pressed'),'true');await shot('festival-story');await click('Finish the show and meet Xiaomao',festival);await op('puzzle:lantern-show');await festival.waitFor({state:'hidden'});await talk('Xiaomao');await dialogue('forge:E-01');await scene('forge:E-02');
   await puzzle('Light the stone bridge',['Cross the bridge','Aim left','Aim right','Cross the bridge']);await dialogue('forge:E-02');await scene('forge:E-03');
   await battle('Shadow beast','battle:shadow-beast');await dialogue('forge:E-03');await scene('forge:E-04');
   await restore('Lantern sanctuary',[],['Jinpo','Xiaomao'],'Song of Ember',[high,mid,low]);await dialogue('forge:E-04');await trial('xiaomao',['deploy','warn','impact']);
  }else if(chapter==='sky'){
   await flyWaterfall('Catch the wind · Practice gliding');await talk('Yuanfan');await dialogue('sky:S-01');await scene('sky:S-02');
   await click('Find the moon gate · Cloud route');await op('explore:flight-recorder');await dialogue('sky:S-02','Let Yuanfan lead');await scene('sky:S-03');
   await flyWaterfall('Joint gliding platform');await dialogue('sky:S-03');await click('Windwing sanctuary');await op('repair:sky');await puzzle('Open Sky',[low]);await dialogue('sky:S-03');await scene('sky:S-04');assert.ok((await view()).melodies.includes('sky'),'Sky must answer before the tea scene');
   await talk('Muling');const lookout=page.locator('.sky-lookout-view');await lookout.waitFor();await click('Walk around the lookout');assert.equal(await lookout.getAttribute('data-pose'),'walk');await click('Sit beside Muling');assert.equal(await lookout.getAttribute('data-pose'),'sit');await page.locator('.sky-lookout-painting').evaluate(img=>img.decode());await artProfiles('sky-lookout-sit',page.locator('.sky-lookout-painting'),page.getByRole('button',{name:local('Walk around the lookout')}));await dialogue('sky:S-04','Sit with her for a while');await scene('sky:S-05');
   await dialogue('sky:S-05');
  }else if(chapter==='library'){
   await talk('Baikan');await dialogue('library:M-01');await scene('library:M-02');
   await libraryEcho();await dialogue('library:M-02');await click('Moonmirror sanctuary');await op('repair:library');await puzzle('Reflections',[mid]);await dialogue('library:M-02');await scene('library:M-03');assert.ok((await view()).melodies.includes('library'),'Library must answer before the identity reveal');
   await talk('Muling');await dialogue('library:M-03','I feel hurt');await scene('library:M-04');await puzzle('Public records · Investigation',['Ask about the borrowed map']);await dialogue('library:M-04','I need some distance');await scene('library:M-05');
   await talk('Moye');await click('Six-region model · Compare the two routes');const routes=page.locator('.rw-puzzle-controls');await routes.waitFor();await checkPuzzleLayout();const surface=page.locator('.rw-surface'),box=await surface.boundingBox();assert.ok(box);const dragBell=async(a,b)=>gesture({x:box.x+box.width*a[0],y:box.y+box.height*a[1]},{x:box.x+box.width*b[0],y:box.y+box.height*b[1]});await dragBell([.5,.40],[.5,.54]);await page.getByText(local('Routes explored 1/2'),{exact:true}).waitFor();await page.evaluate(async()=>{const img=new Image();img.src='assets/story-art/library-shared-memories.jpg';await img.decode();});await shot('route-inward');await dragBell([.5,.40],[.5+.22*Math.sqrt(3)/2,.47]);await page.getByText(local('Routes explored 2/2'),{exact:true}).waitFor();await artProfiles('route-neighbors',surface,page.getByRole('button',{name:local('Finish demonstration')}));await click('Finish demonstration',routes);await dialogue('library:M-05');
  }else if(chapter==='starfall'){
   await talk('Lichuan');await talk('Xingya');await puzzle('Walk on starlight',['Jump to stone 2','Jump to stone 4','Jump to stone 6','Jump to stone 8']);await dialogue('starfall:F-01');await scene('starfall:F-02');
   assert.deepEqual((await view()).objective,['explore:catastrophe-record','cinematic:starfall-memory']);await click('Observatory · Complete record');await op('explore:catastrophe-record');await cinema('starfall:F-02','Remember the choice');
   await talk('Muling');await dialogue('starfall:F-03');await scene('starfall:F-04');
   await puzzle('Test the neighboring bells',['Ring the local bell']);await restore('Starfall sanctuary',[],['Xingya','Lichuan'],'Beyond Stars',[low,mid,high]);await dialogue('starfall:F-04');await cinema('starfall:F-05','Watch the story scene');
  }else if(chapter==='finale'){
   await battle('Approach the Star Bell','battle:inward-gates','finale');await dialogue('finale:B-01');await scene('finale:B-02');
   await battle('Approach the Star Bell','battle:identify-echo','finale');await dialogue('finale:B-02');await scene('finale:B-03');
   await battle('Approach the Star Bell','battle:central-echo','finale');await dialogue('finale:B-03');
   await click('Help Muling release the last lock');const latch=page.getByRole('button',{name:local('Hold the bell chain'),exact:true});await latch.waitFor();if(portrait){const r=await latch.boundingBox();await gesture({x:r.x+r.width/2,y:r.y+r.height/2},null,1800);}else{await latch.focus();await page.keyboard.down('Space');try{await page.waitForTimeout(1800);}finally{await page.keyboard.up('Space');}}
   await scene('finale:B-04');await cinema('finale:B-04','Watch the story scene');
  }else if(chapter==='epilogue'){
   if(await page.evaluate(()=>__game.scene!=='yard')){if(!await page.locator('[data-next-scene="epilogue:E-01"]').isVisible())await page.locator('.rw-quest-toggle[aria-expanded="false"]').click();await page.locator('[data-next-scene="epilogue:E-01"]:visible').click();}await page.waitForFunction(()=>__game.scene==='yard');assert.equal(await page.locator('#first-quest').isVisible(),false,'The legacy catch tutorial must stay hidden during homecoming');await scene('epilogue:E-02');if(!await page.locator('.res-host[data-scene="epilogue:E-02"]').isVisible())await talk('Muling');await dialogue('epilogue:E-02','Give everyone some time');await scene('epilogue:E-03');await talk('Muling');await dialogue('epilogue:E-03');
   await click('Give Muling the key');await page.getByRole('heading',{name:local('THE BELL RINGS AGAIN')}).waitFor();await page.locator('.res-ending-title img').evaluate(img=>img.decode());await artProfiles('ending',page.locator('.res-ending-title img'),page.getByRole('button',{name:local('Return to Sunlit Garden')}));assert.equal((await view()).ending,true);await captureExperienceMilestone(page,'ending');
  }
  if(next)await scene(next);
  const final=await page.evaluate(()=>({view:CatBondResonance.view(),snapshot:CatBondResonance.snapshot()}));
  const missing=expected.flatMap(s=>s.requires.filter(op=>!final.snapshot.evidence[s.id]?.includes(op)).map(op=>s.id+'/'+op));
  assert.deepEqual(missing,[],'Every required chapter operation must be durably recorded');
  assert.ok(expected.every(s=>final.view.completed.includes(s.id)),'All chapter scenes must be completed');
  const requiredBattles=expected.flatMap(s=>s.requires.filter(op=>op.startsWith('battle:')));
  assert.deepEqual(requiredBattles.filter(op=>!battleMeasurements.some(b=>b.operation===op&&b.status==='verified win'&&b.samples.length)),[],'Every required battle needs real outcome and telemetry');
  assert.deepEqual(errors,[]);
  await fs.writeFile(out+'/'+chapter+'-locale.json',JSON.stringify(localeIssues,null,2));
  assert.deepEqual(localeIssues,[],locale+' chapter UI/Canvas purity');
  if(continuous){
   const expectedCount=campaign.scenes.indexOf(expected.at(-1))+1+(next==='epilogue:E-01'&&final.snapshot.completed.includes(next)?1:0);assert.equal(final.snapshot.completed.length,expectedCount,'Fresh route must preserve all previous chapter history');
   earnedSave=await context.storageState();await fs.writeFile(out+'/fresh-earned-save-'+chapter+'.json',JSON.stringify({provenance:'fresh real inputs, chapter boundary reload',storageState:earnedSave,completed:expectedCount},null,2));
  }
  return {chapter,locale,status:'passed',start,next,scenes:expected.map(s=>s.id),readLines,steps,battleMeasurements:battleMeasurements.map(({samples,...m})=>({...m,sampleCount:samples.length})),stagingArt:chapter==='starfall'||chapter==='finale'||chapter==='epilogue'};
 }catch(e){
  await shot('FAIL').catch(()=>{});await fs.writeFile(out+'/'+chapter+'-locale.json',JSON.stringify(localeIssues,null,2)).catch(()=>{});const observed=await view().catch(()=>null);
  return {chapter,locale,status:'failed',start,next,error:String(e).slice(0,2500),stack:String(e.stack||'').slice(0,3000),lastActions:steps.slice(-5),observedScene:observed?.current?.id,remaining:observed?.objective,completed:expected.filter(s=>observed?.completed.includes(s.id)).map(s=>s.id),readLines,steps,battleMeasurements:battleMeasurements.map(({samples,...m})=>({...m,sampleCount:samples.length})),pageErrors:errors};
 }finally{await context.close();}
}
try{
 // Keep the chapter runs independent; report every failure instead of aborting on the first.
 for(const chapter of requested){
  let result;try{result=await run(chapter);}catch(e){result={chapter,status:'failed',error:String(e)};}
  results.push(result);
  await fs.writeFile(out+'/index.json',JSON.stringify({locale,profile:portrait?'portrait-touch':'desktop',provenance:continuous?'fresh slot; real inputs throughout campaign; real save reload at chapter boundaries':'synthetic chapter starts; real inputs throughout each chapter',results},null,2));
  console.log('CHAPTER ACCEPTANCE',JSON.stringify({chapter,locale,status:result.status,scene:result.observedScene,remaining:result.remaining,completed:result.scenes||result.completed,lastActions:result.lastActions,stack:result.stack?.split('\n').slice(-4).join('\n'),error:result.error}));
  if(continuous&&result.status!=='passed')break;
 }
}finally{await browser.close();}
if(results.some(r=>r.status!=='passed'))process.exitCode=1;
