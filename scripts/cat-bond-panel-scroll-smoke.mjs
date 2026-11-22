// Real Chromium mobile regression: skill and duo selection must not reset the
// scrolling card or long per-cat chip lists. Runs with normal mobile CI.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const origin=process.env.MOBILE_PLAYTEST_ORIGIN||'http://127.0.0.1:8765';
try{
 for(const width of [320,390]){
  const page=await browser.newPage({viewport:{width,height:780},isMobile:true,
    hasTouch:true,deviceScaleFactor:2});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/cat-bond/?lang=zh',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.__game&&!!window.UI&&!!window.Skills,
    null,{timeout:30000});
  const result=await page.evaluate(async()=>{
   const settle=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   document.getElementById('intro')?.classList.add('hide');
   const species=GameData.SPECIES.filter(s=>s.id!=='jiafei').slice(0,16);
   const cats=species.map(s=>State.makeCat(s.id,{affinity:35}));
   State.S.cats=cats;
   const skillCat=cats[0];skillCat.level=38;skillCat.affinity=85;
   UI.openSkillEditor(skillCat);
   let card=document.querySelector('#panel > .card');
   const expanded=[...card.querySelectorAll('details.skill-extra-options')];
   expanded.forEach(d=>d.open=true);
   card.scrollTop=Math.min(220,Math.max(0,card.scrollHeight-card.clientHeight));
   const beforeSkill=card.scrollTop;
   const move=[...card.querySelectorAll('.sk-chip[data-slot="1"]')]
     .find(button=>button.dataset.sk&&button.dataset.sk!==skillCat.loadout[1]);
   if(!move)throw Error('No alternative skill to select at Lv.38');
   const selectedId=move.dataset.sk;
   move.click();await settle();
   card=document.querySelector('#panel > .card');
   const afterSkill=card.scrollTop;
   const stillExpanded=[...card.querySelectorAll('details.skill-extra-options')].every(d=>d.open);
   const equipped=skillCat.loadout[1]===selectedId;
   UI._duoChangeOpen=true;
   UI.openBondPanel();
   card=document.querySelector('#panel > .card');
   const chooser=card.querySelector('#duo-direct-chooser');
   const confirm=card.querySelector('#duo-choose');
   const gallery=card.querySelector('.duo-unlocked-section');
   if(!chooser||!confirm||!gallery)throw Error('Quick duo form or gallery is missing');
   const formBeforeGallery=Boolean(confirm.compareDocumentPosition(gallery)&Node.DOCUMENT_POSITION_FOLLOWING);
   const lists=[...card.querySelectorAll('.duo-cat-chip-list')];
   lists.forEach(x=>x.scrollTop=Math.min(70,x.scrollHeight-x.clientHeight));
   card.scrollTop=Math.min(210,Math.max(0,card.scrollHeight-card.clientHeight));
   const beforeDuo=card.scrollTop,beforeLists=lists.map(x=>x.scrollTop);
   const pick=[...card.querySelectorAll('[data-duo-cat="0"]')][11];
   if(!pick)throw Error('Not enough duo candidates');
   const uid=pick.dataset.catUid;pick.click();await settle();
   card=document.querySelector('#panel > .card');
   const afterDuo=card.scrollTop;
   const afterLists=[...card.querySelectorAll('.duo-cat-chip-list')].map(x=>x.scrollTop);
   const selected=card.querySelector('[data-duo-cat="0"][aria-pressed="true"]')?.dataset.catUid;
   const quick=card.querySelector('#duo-choose');
   quick?.click();await settle();
   const formed=CatRelations.chosen().some(c=>c.uid===uid);
   UI.closeAll();
   return {beforeSkill,afterSkill,stillExpanded,equipped,formBeforeGallery,
     beforeDuo,afterDuo,beforeLists,afterLists,selected,uid,formed};
  });
  assert.ok(result.beforeSkill>=30,'Skill dialog not tall enough for real scroll regression: '+JSON.stringify(result));
  assert.ok(Math.abs(result.beforeSkill-result.afterSkill)<=4,
    'Selecting skill jumped to top at '+width+'px: '+JSON.stringify(result));
  assert.ok(result.equipped&&result.stillExpanded,
    'Skill editor lost equipped move or expanded skill tree: '+JSON.stringify(result));
  assert.ok(result.formBeforeGallery,'Quick duo formation must precede long gallery');
  assert.ok(result.beforeDuo>=30,'Duo picker not tall enough: '+JSON.stringify(result));
  assert.ok(Math.abs(result.beforeDuo-result.afterDuo)<=4,
    'Selecting duo cat jumped to top at '+width+'px: '+JSON.stringify(result));
  assert.deepEqual(result.afterLists,result.beforeLists,
    'Duo chip list scrolled back to its first cat');
  assert.equal(result.selected,result.uid,'Selected cat was not retained');
  assert.ok(result.formed,'Quick form did not assemble the selected duo');
  assert.deepEqual(errors,[],'Browser runtime errors: '+JSON.stringify(errors));
  console.log('CAT BOND PANEL SCROLL PASS',width,result);
  await page.close();
 }
}finally{await browser.close()}
