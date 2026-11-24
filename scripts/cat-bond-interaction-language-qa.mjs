// Cat Bond transactional bilingual QA. Previous "open panel" audit missed
// dynamically-generated toasts, labels and state transitions after clicking.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';

const root=(process.env.CAT_BOND_QA_ORIGIN||'http://127.0.0.1:8765').replace(/\/$/,'');
const profiles=[
 {host:'site',lang:'en',width:1280,height:800},
 {host:'crazygames',lang:'en',width:907,height:510},
 {host:'site',lang:'zh',width:390,height:844}
];
const dir='.check/cat-bond-interaction-language';
fs.mkdirSync(dir,{recursive:true});
const results=[],failures=[],browser=await chromium.launch({headless:true,args:['--no-sandbox']});

async function visibleLeaks(page){
 await page.waitForTimeout(130);
 return page.evaluate(()=>{
  const han=/[\u3400-\u9fff]/,out=[];
  function visible(el){
   if(!el||!el.isConnected||!el.getClientRects().length)return false;
   for(let e=el;e;e=e.parentElement){
    const c=getComputedStyle(e);
    if(c.visibility==='hidden'||c.display==='none')return false;
   }
   return true;
  }
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  while(walker.nextNode()){
   const n=walker.currentNode,txt=(n.nodeValue||'').trim();
   if(txt&&han.test(txt)&&visible(n.parentElement))out.push(txt.slice(0,135));
  }
  for(const el of document.querySelectorAll('[title],[aria-label],[placeholder]')){
   if(!visible(el))continue;
   for(const key of ['title','aria-label','placeholder']){
    const txt=el.getAttribute(key)||'';
    if(han.test(txt))out.push(key+': '+txt.slice(0,135));
   }
  }
  for(const txt of window.__catBondInteractionCanvasLeaks||[])out.push('canvas: '+txt);
  return out.slice(0,25);
 });
}

try{
 for(const p of profiles){
  const ctx=await browser.newContext({viewport:{width:p.width,height:p.height},
    isMobile:p.width<500,hasTouch:p.width<500});
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   const han=/[\u3400-\u9fff]/;
   window.__catBondInteractionCanvasLeaks=[];
   for(const key of ['fillText','strokeText']){
    const proto=CanvasRenderingContext2D.prototype,prev=proto[key];
    proto[key]=function(label,...args){
     const txt=String(label);
     if(document.documentElement.lang==='en'&&han.test(txt)){
      const leaks=window.__catBondInteractionCanvasLeaks;
      if(leaks.length<25&&!leaks.includes(txt))leaks.push(txt.slice(0,130));
     }
     return prev.call(this,label,...args);
    };
   }
  });
  const mode=p.host==='crazygames'?'&utm_source=crazygames&utm_medium=portal':'';
  try{
   await page.goto(root+'/cat-bond/?lang='+p.lang+mode,{waitUntil:'load',timeout:30000});
   await page.locator('#intro-start').click();
   await page.locator('#intro-slot-panel.is-open').waitFor({state:'visible',timeout:10000});
   await page.locator('#intro-slot-list [data-slot="slot1"]').click();
   // The first-run cinematic prologue now precedes the starter picker.
   const prologue=page.locator('.cb-story-overlay');
   if(await prologue.count()){
    await prologue.waitFor({state:'visible',timeout:5000});
    await prologue.locator('.cb-story-skip').click({timeout:5000});
    await prologue.waitFor({state:'detached',timeout:5000});
   }
   // This QA path skips the capture tutorial, so seed one deterministic test
   // cat when the save is still empty before opening the roster. Test fixture
   // setup only; this does not change the shipped starter/capture flow.
   await page.evaluate(()=>{
    State.S.cats=Array.isArray(State.S.cats)?State.S.cats:[];
    if(!State.S.cats.length)State.S.cats.push(State.makeCat(GameData.SPECIES[0].id));
    State.save();
    window.UI.openCatHub('solo');
   });
   await page.waitForFunction(()=>document.querySelector('#panel')?.classList.contains('open'));
   await page.locator('#panel.open .dex-cell').first().click();
   await page.evaluate(()=>{
    const b=State.makeCat(State.S.cats[0].species);
    State.S.cats.push(b);
    State.S.coins=10000;State.S.fish=1000;State.save();
   });
   const toastLocale=await page.evaluate(async()=>{
    const original=MorrowwishI18n.get();
    const game=Object.create(Game.prototype);game.scene='yard';
    game.toast({zh:'厨房掉落的小鱼干 🐠+3',en:'A fish treat by the kitchen 🐠+3'});
    const el=document.querySelector('#toasts .toast:last-child');
    if(!el)throw Error('Localized reward toast was not created');
    const read=()=>el.textContent.trim();
    const pause=()=>new Promise(resolve=>setTimeout(resolve,30));
    MorrowwishI18n.set('en');await pause();const en=read();
    MorrowwishI18n.set('zh');await pause();const zh=read();
    MorrowwishI18n.set('en');await pause();const enAgain=read();
    MorrowwishI18n.set(original);await pause();
    return {en,zh,enAgain,restored:read(),original};
   });
   if(toastLocale.en!=='A fish treat by the kitchen 🐠+3'||
      toastLocale.zh!=='厨房掉落的小鱼干 🐠+3'||
      toastLocale.enAgain!=='A fish treat by the kitchen 🐠+3'){
    failures.push(p.host+' '+p.lang+' live reward toast language switch: '+JSON.stringify(toastLocale));
   }
   results.push({host:p.host,lang:p.lang,width:p.width,
    action:'live-reward-toast-language-switch',result:toastLocale});
   const actions=[
    {name:'train-once',setup:()=>{UI.openCatDetail(State.S.cats[0]);},selector:'#cd-trainstat'},
    {name:'train-batch',setup:()=>{UI.openCatDetail(State.S.cats[0]);document.getElementById('cd-grow-more').open=true;},selector:'#cd-stat-ten'},
    {name:'feed-all',setup:()=>UI.openFeed(),selector:'#feedall'},
    {name:'shop-quantity',setup:()=>UI.openShop(),selector:'[data-shop-qty="10"]'},
    {name:'shop-purchase',setup:()=>{UI._shopQuantity=1;UI.openShop();},selector:'[data-buy="medkit"]'},
    {name:'daily-claim',setup:()=>UI.openDaily(),selector:'#claim'},
    {name:'squad-save',setup:()=>UI.openMapSquad(),selector:'#map-squad-save'},
    {name:'gambit-add',setup:()=>{
      UI.teamUids=State.S.cats.map(c=>c.uid);UI.openGambitEditor(GameData.SPECIES[0]);
    },selector:'#gb-add'},
    {name:'skill-trainer',setup:()=>UI.openSkillEditor(State.S.cats[0]),selector:'#sk-trainer'}
   ];
   for(const action of actions){
    try{
     await page.evaluate(setup=>{
      UI.closeAll();
      const cat=State.S.cats[0];
      switch(setup){
       case 'train-once':UI.openCatDetail(cat);break;
       case 'train-batch':UI.openCatDetail(cat);
         document.getElementById('cd-grow-more').open=true;break;
       case 'feed-all':UI.openFeed();break;
       case 'shop-quantity':UI.openShop();break;
       case 'shop-purchase':UI._shopQuantity=1;UI.openShop();break;
       case 'daily-claim':UI.openDaily();break;
       case 'squad-save':UI.openMapSquad();break;
       case 'gambit-add':UI.teamUids=State.S.cats.map(c=>c.uid);
         UI.openGambitEditor(GameData.SPECIES[0]);break;
       case 'skill-trainer':UI.openSkillEditor(cat);break;
      }
     },action.name);
     const target=page.locator(action.selector);
     await target.waitFor({state:'visible',timeout:7000});
     if(await target.isDisabled()){
      if(action.name==='daily-claim'){
       results.push({host:p.host,lang:p.lang,action:action.name,skipped:'already claimed'});
       continue;
      }
      throw Error('Action unexpectedly disabled: '+action.selector);
     }
     await target.click({timeout:10000});
     const leaks=p.lang==='en'?await visibleLeaks(page):[];
     if(leaks.length)failures.push(p.host+' '+p.lang+' '+action.name+': '+JSON.stringify(leaks));
     const result=await page.evaluate(()=>({
       panel:document.querySelector('#panel .card')?.innerText?.slice(0,220)||'',
       toast:document.getElementById('toast')?.textContent?.trim()?.slice(0,220)||'',
       coins:State.S.coins,fish:State.S.fish
     }));
     results.push({host:p.host,lang:p.lang,width:p.width,
       action:action.name,leaks,result});
     console.log('ACTION LOCALE',p.host,p.lang,action.name,
       leaks.length?'FAIL':'PASS');
    }catch(e){
     failures.push(p.host+' '+p.lang+' '+action.name+' threw '+e.message);
     await page.screenshot({path:dir+'/'+p.host+'-'+p.lang+'-'+action.name+'-fail.png'})
       .catch(()=>{});
    }
   }
   if(errors.length)failures.push(p.host+' '+p.lang+
     ' uncaught runtime errors: '+JSON.stringify(errors.slice(0,6)));
  }catch(e){failures.push(p.host+' '+p.lang+' setup failed: '+e.message)}
  finally{await ctx.close()}
 }
}finally{await browser.close()}
fs.writeFileSync(dir+'/report.json',JSON.stringify({count:results.length,
 failures,results},null,2));
console.log('CAT BOND INTERACTION LOCALE QA:',results.length,
 'interactions,',failures.length,'failures');
for(const error of failures)console.error('INTERACTION LOCALE FAIL:',error);
assert.equal(failures.length,0,'Cat Bond interactive localization regression');
