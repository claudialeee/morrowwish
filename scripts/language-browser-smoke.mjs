// Browser language gate: all 15 games, two languages, phone + desktop.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const root=(process.env.LANGUAGE_QA_ORIGIN||'http://127.0.0.1:8765').replace(/\/$/,'');
const slugs=['','cat-bond','color-current','echo-heist','elsewhere','flip-dash',
'grid-glider','mirror-mosaic','orbit-escape','parcel-panic','pawsibly-innocent',
'perfect-pour','pocket-aquarium','tiny-town','tower-tuck','traffic-tangle'];
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];let checks=0;
async function scan(page,slug,lang,phase){
 await page.waitForTimeout(230);
 const v=await page.evaluate(()=>{
  const han=/[\u3400-\u9fff]/,issues=[];let hanCount=0;
  const visible=el=>{
   if(!el||!el.isConnected||el.closest('script,style,noscript,template,head'))return false;
   if(!el.getClientRects().length)return false;
   const css=getComputedStyle(el);return css.display!=='none'&&css.visibility!=='hidden'&&css.opacity!=='0';
  };
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  while(walker.nextNode()){
   const n=walker.currentNode,s=(n.nodeValue||'').trim();
   if(!s||!visible(n.parentElement))continue;
   if(han.test(s)){hanCount++;issues.push('text '+n.parentElement.tagName+': '+s.slice(0,100));}
  }
  for(const el of document.querySelectorAll('[aria-label],[title],[placeholder]')){
   if(!visible(el))continue;
   for(const a of ['title','aria-label','placeholder']){
    const s=el.getAttribute(a)||'';
    if(han.test(s))issues.push(a+' '+el.tagName+': '+s.slice(0,100));
   }
  }
  const b=document.querySelector('#mw-game-settings .mw-settings-language, #mw-language');
  return{lang:document.documentElement.lang,issues:issues.slice(0,25),count:issues.length,hanCount,button:b?.textContent?.trim()||null,canvas:window.__mwLanguageCanvasLeaks||[],title:document.title};
 });
 assert.equal(v.lang,lang==='en'?'en':'zh-CN','Incorrect document language: '+slug);
 if(lang==='en')assert.equal(v.count,0,'Chinese text in '+slug+' '+phase+': '+JSON.stringify(v.issues));
 if(lang==='en')assert.equal(v.canvas.length,0,'Chinese in Canvas on '+slug+' '+phase+': '+JSON.stringify(v.canvas));
 if(lang==='en')assert.ok(!/[\u3400-\u9fff]/.test(v.title),'Chinese page title: '+slug);
 if(v.button)assert.equal(v.button,lang==='en'?'EN':'中文','Mixed language toggle in '+slug);
 checks++;console.log('PASS '+(slug||'home')+' '+lang+' '+phase);
}
try{
 for(const width of [390,1280])for(const lang of ['en','zh'])for(const slug of (process.env.LANGUAGE_QA_HOME_ONLY==='1'?['']:slugs)){
  const ctx=await browser.newContext({viewport:{width,height:844}});
  const page=await ctx.newPage(),key=(slug||'home')+' '+lang+' '+width;
  // Capture the final text that actually reaches Canvas after game i18n hooks.
  // Checking DOM alone misses skill callouts and HUD drawn directly on Canvas.
  await page.addInitScript(()=>{
   window.__mwLanguageCanvasLeaks=[];
   for(const method of ['fillText','strokeText']){
    const proto=CanvasRenderingContext2D.prototype,original=proto[method];
    proto[method]=function(label,...args){
     const s=String(label);
     if(document.documentElement.lang==='en'&&/[\u3400-\u9fff]/.test(s)){
      const issues=window.__mwLanguageCanvasLeaks;
      if(issues.length<25&&!issues.includes(s))issues.push(s.slice(0,120));
     }
     return original.call(this,label,...args);
    };
   }
  });
  try{
   await page.goto(root+(slug?'/'+slug+'/':'/')+'?lang='+lang,{waitUntil:'domcontentloaded',timeout:30000});
   await page.waitForTimeout(slug==='cat-bond'?850:550);
   await scan(page,slug,lang,'landing');
   if(!slug){
    const layout=await page.evaluate(()=>{
     const rpg=document.querySelector('#rpg'), worlds=document.querySelector('#worlds'), tiny=document.querySelector('#tiny-games'), cards=[...worlds.querySelectorAll('.feature-card')];
     const rect=e=>e.getBoundingClientRect();
     const visible=e=>rect(e).height>0&&rect(e).width>0;
     return {order:rect(rpg).top<rect(worlds).top&&rect(worlds).top<rect(tiny).top,heading:rpg.querySelector('h2').textContent.trim(),subtitles:[...document.querySelectorAll('main .section-index')].filter(visible).length,
      preview:!!rpg.querySelector('.starbell-preview-label'),cards:cards.length,allButtons:cards.every(c=>visible(c.querySelector('.card-button'))&&rect(c.querySelector('.card-button')).bottom<=rect(c).bottom+1),columns:new Set(cards.map(c=>Math.round(rect(c).left))).size,
      overflow:document.documentElement.scrollWidth>innerWidth+1,nav:[...document.querySelectorAll('.site-nav a')].every(a=>visible(a)&&rect(a).right<=innerWidth+1)};
    });
    assert.ok(layout.order&&layout.heading==='RPG'&&layout.preview&&layout.cards===4&&layout.allButtons&&layout.nav&&!layout.overflow,'Home layout regression: '+JSON.stringify(layout));
    assert.equal(layout.subtitles,0,'Remove redundant section eyebrows');
    assert.equal(layout.columns,width===390?2:4,'Home card columns');
   }
   if(slug==='cat-bond'&&await page.locator('#intro-start').isVisible()){
    await page.locator('#intro-start').click({timeout:7000});
    await scan(page,slug,lang,'starter');
    if(await page.locator('#panel .dex-cell').first().isVisible()){
     await page.locator('#panel .dex-cell').first().click({timeout:7000});
     await scan(page,slug,lang,'yard');
    }
   }
   if(slug==='pocket-aquarium'&&await page.locator('#start').isVisible()){
    await page.locator('#start').click({timeout:7000});
    await scan(page,slug,lang,'feeding game');
   }
   if(slug==='pawsibly-innocent'&&await page.locator('#menuButton').isVisible()){
    await page.locator('#menuButton').click({timeout:7000});
    await scan(page,slug,lang,'pause menu');
   }
   if(slug==='tiny-town'&&await page.locator('#introStart').isVisible()){
    await page.locator('#introStart').click({timeout:7000});
    await scan(page,slug,lang,'town');
   }
  }catch(err){
   console.error('FAIL '+key+': '+err.message);errors.push(key+': '+err.message);
  }finally{await ctx.close()}
 }
}finally{await browser.close()}
console.log('Browser language gate: '+checks+' checks, 16 routes, English/Chinese, phone/desktop.');
if(errors.length){console.error(errors.join('\n'));process.exitCode=1}
