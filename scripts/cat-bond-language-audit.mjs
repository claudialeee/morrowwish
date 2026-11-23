// Full Cat Bond bilingual regression: real DOM, real coin-icon transforms,
// website + CrazyGames portal, desktop + touch/mobile, 19 key player surfaces.
// Report *all* leaks rather than stopping at the first mislabeled button.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';

const origin=(process.env.CAT_BOND_QA_ORIGIN||'http://127.0.0.1:8765').replace(/\/$/,'');
const cases=[
  'cat-detail','cat-detail-advanced','roster','breed-roster','workshop',
  'build','cat-dex','daily','shop','feed','tease','cat-duos','skill-editor',
  'trainer','world-map','map-squad','yard-menu','journey','capture-prep',
  'gambit-editor','welcome-back','battle-recovery','mastery-result'
];
const profiles=[
  // Both languages on BOTH hosts and BOTH input/viewport sizes. The older
  // 77-check smoke skipped Chinese portal entirely and English site-mobile.
  {host:'site',width:1280,height:800,touch:false,lang:'en'},
  {host:'site',width:1280,height:800,touch:false,lang:'zh'},
  {host:'site',width:390,height:844,touch:true,lang:'en'},
  {host:'site',width:390,height:844,touch:true,lang:'zh'},
  {host:'crazygames',width:907,height:510,touch:false,lang:'en'},
  {host:'crazygames',width:907,height:510,touch:false,lang:'zh'},
  {host:'crazygames',width:390,height:844,touch:true,lang:'en'},
  {host:'crazygames',width:390,height:844,touch:true,lang:'zh'}
];
const dir='.check/cat-bond-language-audit';
fs.mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const reports=[],failures=[];
try{
  for(const profile of profiles){
    const context=await browser.newContext({
      viewport:{width:profile.width,height:profile.height},
      hasTouch:profile.touch,isMobile:profile.touch
    });
    const page=await context.newPage(),pageErrors=[];
    page.on('pageerror',error=>pageErrors.push(error.message));
    const q=profile.host==='crazygames'
      ?'&utm_source=crazygames&utm_medium=portal&utm_campaign=cat-bond-language-audit':'';
    try{
      await page.goto(origin+'/cat-bond/?lang='+profile.lang+q,
        {waitUntil:'domcontentloaded',timeout:30000});
      await page.waitForFunction(()=>window.UI&&window.State&&window.CatBondI18n,
        {timeout:15000});
      await page.locator('#intro-start').click({timeout:10000});
      await page.locator('#panel.open .dex-cell').first().click({timeout:10000});
      await page.waitForFunction(()=>State.S.cats.length>=1,{timeout:10000});
      await page.evaluate(()=>{
        State.S.coins=2500;
        State.S.fish=500;
        // Give the in-memory test save a second owned cat so Duo and
        // squad menus render substantive content, not an empty placeholder.
        State.S.cats.push(State.makeCat(State.S.cats[0].species));
        State.save();
      });
      for(const key of cases){
        let result;
        try{
          result=await page.evaluate(key=>{
            const cat=State.S.cats[0];
            UI.closeAll();
            const routes={
              'cat-detail':()=>UI.openCatDetail(cat),
              'cat-detail-advanced':()=>{UI.openCatDetail(cat);
                const x=document.getElementById('cd-grow-more');if(x)x.open=true;},
              'roster':()=>UI.openRoster(),
              'breed-roster':()=>UI.openBreedRoster(GameData.speciesById(cat.species)),
              'workshop':()=>UI.openWorkshop(),
              'build':()=>UI.openBuild(),
              'cat-dex':()=>UI.openDex(),
              'daily':()=>UI.openDaily(),
              'shop':()=>UI.openShop(),
              'feed':()=>UI.openFeed(),
              'tease':()=>UI.openTease(cat),
              'cat-duos':()=>UI.openBondPanel(),
              'skill-editor':()=>UI.openSkillEditor(cat),
              'trainer':()=>UI.openTrainer(cat),
              'world-map':()=>UI.openMapChooser(),
              'map-squad':()=>UI.openMapSquad(),
              'yard-menu':()=>UI.openExploreMenu(),
              'journey':()=>UI.openJourney(),
              'capture-prep':()=>{
                State.S.catchCount=1; // Expose editable squad controls, not the first-time tutorial shortcut.
                UI.openCapturePrep(GameData.SPECIES[0]);
              },
              'gambit-editor':()=>{
                UI.teamUids=State.S.cats.map(c=>c.uid);
                UI.openGambitEditor(GameData.SPECIES[0]);
              },
              'welcome-back':()=>UI.openWelcomeBack({
                minutes:15,capped:false,produced:{coins:25,fish:2},
                gains:{coins:3},visitors:[{name:'Test Visitor',gift:{coins:1},rare:true}]
              }),
              'battle-recovery':()=>UI.openBattleRecoveryResult({
                mode:'casual',fromMap:false,
                team:[{name:State.catName(cat),before:38,after:100}]
              }),
              'mastery-result':()=>UI.openMasteryChallengeResult(
                GameData.SPECIES[0],{grade:'A'},false,true)
            };
            routes[key]();
            const panel=document.querySelector('#panel');
            return{open:panel?.classList.contains('open'),
              detail:!!document.getElementById('cat-detail')};
          },key);
        }catch(error){
          const msg=profile.host+' '+profile.lang+' '+profile.width+' '+key+
            ' action failed: '+error.message;
          failures.push(msg);reports.push({profile,key,error:msg});continue;
        }
        await page.waitForTimeout(120); // allow both coin + i18n observers to flush
        const audit=await page.evaluate(()=>{
          const leaks=[];
          const han=/[\u3400-\u9fff]/;
          const visible=el=>{
            if(!el||!el.isConnected||el.closest('script,style,noscript,template,head'))return false;
            if(!el.getClientRects().length)return false;
            let p=el;
            while(p&&p.nodeType===1){
              const c=getComputedStyle(p);
              if(c.display==='none'||c.visibility==='hidden')return false;
              p=p.parentElement;
            }
            return true;
          };
          const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
          while(walker.nextNode()){
            const n=walker.currentNode;
            const str=(n.nodeValue||'').trim();
            if(str&&han.test(str)&&visible(n.parentElement)){
              const target=n.parentElement.closest('button,section,article,.card')||n.parentElement;
              leaks.push({kind:'text',text:str.slice(0,135),
                in:target?.id||target?.className?.toString()?.slice(0,90)||target?.tagName});
            }
          }
          for(const el of document.querySelectorAll('[aria-label],[title],[placeholder]')){
            if(!visible(el))continue;
            for(const attr of ['title','aria-label','placeholder']){
              const v=el.getAttribute(attr)||'';
              if(han.test(v))leaks.push({kind:attr,text:v.slice(0,135),in:el.id||el.tagName});
            }
          }
          const price=document.querySelector('#cd-trainstat small');
          const bulk=document.querySelector('#cd-stat-ten small');
          return {leaks:leaks.slice(0,75),
            coinIcons:document.querySelectorAll('#panel .cb-gold-coin').length,
            price:price?.textContent?.trim()||null,
            bulk:bulk?.textContent?.trim()||null,
            detail:!!document.querySelector('#cat-detail')};
        });
        if(!result?.open)failures.push(profile.host+' '+profile.lang+' '+key+' did not open a panel');
        if(profile.lang==='en'&&audit.leaks.length)
          failures.push(profile.host+' '+profile.width+' '+key+' untranslated: '+
            JSON.stringify(audit.leaks.slice(0,12)));
        if(profile.lang==='en'&&key==='cat-detail'){
          if(!/^Cost\s+80/.test(audit.price||''))
            failures.push(profile.host+' cat detail coin label should be Cost 80: '+JSON.stringify(audit));
          if(audit.coinIcons<1)
            failures.push(profile.host+' cat detail does not render coin icon');
        }
        if(profile.lang==='en'&&key==='cat-detail-advanced'&&
           !/^Up to 10 times/.test(audit.bulk||''))
          failures.push(profile.host+' bulk training price not translated: '+JSON.stringify(audit));
        reports.push({host:profile.host,locale:profile.lang,
          viewport:profile.width+'x'+profile.height,screen:key,
          open:result?.open,coinIcons:audit.coinIcons,price:audit.price,bulk:audit.bulk,
          issues:audit.leaks});
        if(['cat-detail','cat-detail-advanced','shop'].includes(key)){
          // Force screenshots to show the actual problematic lower training
          // controls, not merely the upper half of the tall scrollable panel.
          if(key==='cat-detail'||key==='cat-detail-advanced'){
            // Direct scroll avoids Playwright actionability waits when the
            // target sits in a long, internally scrolling game modal.
            await page.evaluate(key=>{
              const id=key==='cat-detail'?'cd-trainstat':'cd-stat-ten';
              document.getElementById(id)?.scrollIntoView({block:'center',behavior:'instant'});
            },key);
            await page.waitForTimeout(90);
          }
          await page.screenshot({path:dir+'/'+profile.host+'-'+profile.lang+
            '-'+profile.width+'-'+key+'.png',fullPage:false});
        }
        // Deliberate LIVE language switching while the current screen stays
        // open. Compare its rendered Chinese copy with the canonical output
        // of opening THAT SAME screen directly in Chinese. Unlike a mere
        // "no Han text in English" detector this catches English surviving
        // inside Chinese panels, too.
        if(profile.lang==='en'&&key==='tease'){
          const baseline=await page.evaluate(()=>({
            text:document.querySelector('#panel .card h2')?.textContent||'',
            score:document.querySelector('#tz-score')?.textContent||'',
            active:!!UI._teaseStop
          }));
          await page.evaluate(()=>window.MorrowwishI18n.set('zh'));
          await page.waitForTimeout(130);
          const switched=await page.evaluate(()=>({
            text:document.querySelector('#panel .card h2')?.textContent||'',
            score:document.querySelector('#tz-score')?.textContent||''
          }));
          if(!switched.text.includes('逗猫'))
            failures.push('Active tease game failed to translate to Chinese: '+JSON.stringify(switched));
          if(switched.score!==baseline.score)
            failures.push('Locale change restarted or reset active tease score');
          await page.evaluate(()=>window.MorrowwishI18n.set('en'));
          await page.waitForTimeout(130);
          const restored=await page.locator('#panel .card h2').textContent();
          if(!restored.includes('Cat Teaser'))
            failures.push('Active tease game failed to restore English title: '+restored);
          reports.push({host:profile.host,locale:'en-zh-en',
            viewport:profile.width+'x'+profile.height,screen:key,
            ok:switched.text.includes('逗猫')&&restored.includes('Cat Teaser'),issues:[]});
        }
        if(profile.lang==='en'&&key!=='tease'){
          const route=await page.evaluate(()=>UI._localePanelRoute?.method||null);
          if(!route){
            failures.push(profile.host+' '+profile.width+' '+key+
              ' has no tracked locale route; cannot verify bilingual switching');
          }else{
            const norm=t=>String(t||'').replace(/\\s+/g,' ').trim()
              .replace(/\\b\\d+\\s*(?:s|秒)\\b/g,'<time>');
            // Exercise real unsaved battle setup choices BEFORE changing
            // language. A locale refresh may never reset the chosen squad or
            // auto/manual mode; the prior QA did not verify any form state.
            if(key==='map-squad'||key==='capture-prep'){
              await page.evaluate(key=>{
                const chosen=key==='map-squad'
                  ?document.querySelector('#panel .map-squad-choice[aria-pressed="true"]')
                  :document.querySelector('#panel #cp-roster .chip[aria-pressed="true"]');
                chosen?.click();
                document.querySelector('#panel .capture-mode-option[data-battle-auto="false"]')?.click();
              },key);
              await page.waitForTimeout(75);
            }
            const savedChoices=await page.evaluate(()=>({
              team:document.querySelector('#cp-roster')
                ?[...(UI.teamUids||[])]
                :document.querySelector('.map-squad-roster')
                  ?[...(UI._localeLiveTeamSelection||[])]:null,
              mode:document.querySelector('.capture-mode-option[data-battle-auto][aria-checked="true"]')
                ?.dataset.battleAuto||null,
              coins:State.S.coins,fish:State.S.fish,cats:State.S.cats.length
            }));
            const beforeEnglish=norm(await page.locator('#panel .card').innerText());
            await page.evaluate(()=>window.MorrowwishI18n.set('zh'));
            await page.waitForTimeout(180);
            const switchedZh=norm(await page.locator('#panel .card').innerText());
            const postChoices=await page.evaluate(()=>({
              team:document.querySelector('#cp-roster')
                ?[...(UI.teamUids||[])]
                :document.querySelector('.map-squad-roster')
                  ?[...(UI._localeLiveTeamSelection||[])]:null,
              mode:document.querySelector('.capture-mode-option[data-battle-auto][aria-checked="true"]')
                ?.dataset.battleAuto||null,
              coins:State.S.coins,fish:State.S.fish,cats:State.S.cats.length
            }));
            if(JSON.stringify(savedChoices)!==JSON.stringify(postChoices))
              failures.push(profile.host+' '+profile.width+' '+key+
                ' language toggle changed gameplay selections or resources: '+
                JSON.stringify({before:savedChoices,after:postChoices}));
            const ref=await page.evaluate(()=>{
              const route=UI._localePanelRoute;
              if(!route)return {found:false};
              UI[route.method](...route.args);
              return {found:true};
            });
            await page.waitForTimeout(100);
            const nativeZh=norm(await page.locator('#panel .card').innerText());
            if(!ref.found||switchedZh!==nativeZh){
              failures.push(profile.host+' '+profile.width+' '+key+
                ' EN→ZH does not match a genuinely Chinese-rendered panel: '+
                JSON.stringify({switched:switchedZh.slice(0,420),
                  native:nativeZh.slice(0,420)}));
            }
            const keyChinese={
              'roster':'我的猫猫','cat-detail':'特训',
              'cat-detail-advanced':'连续特训','shop':'小卖部',
              'skill-editor':'技能搭配','workshop':'工坊',
              'cat-duos':'双猫纽带','trainer':'技能训练师'
            };
            if(keyChinese[key]&&!nativeZh.includes(keyChinese[key]))
              failures.push(profile.host+' '+profile.width+' '+key+
                ' native Chinese title missing: '+keyChinese[key]);
            await page.evaluate(()=>window.MorrowwishI18n.set('en'));
            await page.waitForTimeout(180);
            const backToEnglish=norm(await page.locator('#panel .card').innerText());
            if(beforeEnglish!==backToEnglish)
              failures.push(profile.host+' '+profile.width+' '+key+
                ' ZH→EN did not restore original text: '+
                JSON.stringify({before:beforeEnglish.slice(0,350),
                  after:backToEnglish.slice(0,350)}));
            reports.push({host:profile.host,locale:'en-zh-en',
              viewport:profile.width+'x'+profile.height,screen:key,
              ok:switchedZh===nativeZh&&beforeEnglish===backToEnglish,
              issues:[]});
          }
        }
        if(profile.lang==='en'&&!audit.leaks.length)console.log('CAT BOND LOCALE PASS',
          profile.host,profile.width+'x'+profile.height,key);
      }
      if(profile.host==='site'&&profile.lang==='en'){
        // Switching while the coin icon has replaced its original text node
        // must restore Chinese correctly, then English, without rerendering
        // the cat-detail panel or dropping the embedded coin images.
        await page.evaluate(()=>{
          UI.closeAll();UI.openCatDetail(State.S.cats[0]);
          document.getElementById('cd-grow-more').open=true;
          window.MorrowwishI18n.set('zh');
        });
        await page.waitForTimeout(220);
        const zh=await page.evaluate(()=>({
          price:document.querySelector('#cd-trainstat small')?.textContent||'',
          bulk:document.querySelector('#cd-stat-ten small')?.textContent||'',
          icons:document.querySelectorAll('#panel .cb-gold-coin').length
        }));
        if(!zh.price.includes('消耗')||!zh.bulk.includes('最多')||zh.icons<2)
          failures.push('Live English→Chinese toggle lost original coin labels: '+JSON.stringify(zh));
        await page.screenshot({path:dir+'/site-zh-toggle-cat-detail.png'});
        await page.evaluate(()=>window.MorrowwishI18n.set('en'));
        await page.waitForTimeout(220);
        const en=await page.evaluate(()=>({
          price:document.querySelector('#cd-trainstat small')?.textContent||'',
          bulk:document.querySelector('#cd-stat-ten small')?.textContent||''
        }));
        if(!en.price.startsWith('Cost ')||!en.bulk.startsWith('Up to 10 times'))
          failures.push('Live Chinese→English toggle failed to restore costs: '+JSON.stringify(en));
        reports.push({host:'site',locale:'toggle-en-zh-en',screen:'live-cat-detail-currency',
          zh,en,issues:[]});
        await page.screenshot({path:dir+'/site-en-toggle-cat-detail.png'});
      }
      if(pageErrors.length)failures.push(profile.host+' '+profile.lang+
        ' uncaught errors: '+JSON.stringify(pageErrors.slice(0,12)));
    }catch(error){failures.push(profile.host+' '+profile.lang+' setup: '+error.message)}
    finally{await context.close()}
  }
}finally{await browser.close()}
fs.writeFileSync(dir+'/report.json',JSON.stringify({screenCount:reports.length,
  failures,reports},null,2));
console.log('CAT BOND LOCALE AUDIT:',reports.length,'screens checked,',
  failures.length,'problems');
for(const e of failures)console.error('CAT BOND LOCALE FAIL:',e);
assert.equal(failures.length,0,'Cat Bond bilingual UI audit must have zero untranslated visible strings and broken screens');
