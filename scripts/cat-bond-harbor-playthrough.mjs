import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';

const origin = 'http://127.0.0.1:8765';
const out = 'artifacts/cat-bond-harbor';
await fs.mkdir(out, {recursive:true});
const browser = await chromium.launch({headless:true});
const profiles = [
  {name:'desktop', viewport:{width:1440,height:960}, hasTouch:false},
  {name:'portrait', viewport:{width:390,height:844}, hasTouch:true},
  {name:'landscape', viewport:{width:844,height:390}, hasTouch:true}
];

const results = [];
try {
  for (const {name, ...options} of profiles.filter(p=>!process.env.CAT_BOND_PROFILE||p.name===process.env.CAT_BOND_PROFILE)) {
    const context = await browser.newContext(options);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => {errors.push(error.message);console.error('Actual browser page error',error.stack||error.message);});
    await page.route('**/*', route => /^(data:|blob:)/.test(route.request().url())||route.request().url().startsWith(origin + '/') ? route.continue() : route.abort());
    await page.goto(origin+'/cat-bond/?lang=en');
    await page.waitForFunction(() => window.WorldMap === window.CatBondCanonicalWorld && window.CatBondResonance && window.__game);
    assert.equal(await page.evaluate(()=>window.__CAT_BOND_INTEGRATION_ART__),false,'Production entry must not enable unreviewed staging art');
    const button = (name, scope = page) => scope.getByRole('button',{name,exact:true});
    const scene = id => page.waitForFunction(expected => CatBondResonance.view().current?.id === expected, id);
    const shot = id => page.screenshot({path:out+'/'+name+'-'+id+'.png'});
    const checkObjective = operation => page.waitForFunction(op => CatBondResonance.view().objective.includes(op),operation);
    async function tapLandmark(x,y) {
      assert.deepEqual(errors,[],'No runtime errors before interacting with the world map');
      const surface = page.locator('.rw-surface');
      await surface.scrollIntoViewIfNeeded();
      const rect = await surface.boundingBox();
      const point = {x:rect.x + rect.width*x,y:rect.y + rect.height*y};
      if (options.hasTouch) await page.touchscreen.tap(point.x,point.y);
      else await page.mouse.click(point.x,point.y);
    }
    async function readDialogue(id,choice) {
      const dialogue = page.locator('.res-host[data-scene="'+id+'"]');
      await dialogue.waitFor();
      const advance = button('Skip dialogue',dialogue);
      async function advanceLines(){
        if(!id.startsWith('harbor:')){if(await advance.isVisible()&&await advance.isEnabled())await advance.click();return;}
        const next=button('Continue',dialogue);let count=0;
        while(await next.isVisible()&&await next.isEnabled()){
          assert.ok(++count<30,'Dialogue must progress without looping: '+id);
          const line=dialogue.locator('.res-line'),english=await line.innerText();assert.ok(english.trim()&&!/[\u3400-\u9fff]/.test(english),'English dialogue is localized');
          const expected=await page.evaluate(sceneId=>{const v=CatBondResonance.view();return v.current?.id===sceneId&&v.lineReady?v.current.lines[v.cursor]:null},id);
          assert.ok(expected,id+' must have a canonical dialogue line');
          assert.equal(english,expected.text.en);
          const portrait=dialogue.locator('.res-portrait');
          if(['qilan','jiedeng','muling'].includes(expected.speaker)){
            await portrait.waitFor({state:'visible'});
            await page.waitForFunction(()=>{const p=document.querySelector('.res-host .res-portrait');return p&&!p.hidden&&p.complete&&p.naturalWidth>0});
            assert.ok((await portrait.getAttribute('src'))?.endsWith('.webp'),'Authored portrait must be loaded');
          }
          if(name==='portrait'){
            await dialogue.locator('[data-res-language]').click();await page.waitForFunction(text=>document.querySelector('.res-host .res-line')?.textContent===text,expected.text.zh);
            if(count===1)await shot(id.replace(':','-')+'-zh');
            await dialogue.locator('[data-res-language]').click();assert.equal(await line.innerText(),english,'Language switch preserves exact dialogue cursor');
          }
          await next.click();
        }
      }
      await advanceLines();
      if (choice) {
        await button(choice,dialogue).click();
        await advanceLines();
      }
      if (await dialogue.isVisible()) {
        const close = button('Close',dialogue);
        if (await close.isVisible()) await close.click();
      }
    }
    async function readForestDialogue(id,choice) {
      const dialogue=page.locator('.res-host[data-scene="'+id+'"]');
      await dialogue.waitFor();
      if(choice){await button(choice,dialogue).click();}
      const observed=[];
      while(await dialogue.isVisible()){
        const line=await page.evaluate(expected=>{const v=CatBondResonance.view();return v.current?.id===expected&&v.lineReady?v.current.lines[v.cursor]:null},id);
        if(!line)break;
        await page.waitForFunction(text=>document.querySelector('.res-host .res-line')?.textContent===text,line.text.en);
        if(['yahe','yuchuan','muling'].includes(line.speaker)){
          const portrait=dialogue.locator('.res-portrait');
          await portrait.waitFor({state:'visible'});
          const expected=line.speaker==='muling'?'/cinematics/characters/muling/traveler-neutral.webp':'/npc/'+line.speaker+'-painted.webp';
          try{await page.waitForFunction(({actor,expected})=>{const d=document.querySelector('.res-host .res-dialogue'),img=d?.querySelector('.res-portrait');return d?.dataset.speaker===actor&&img?.complete&&img.naturalWidth>0&&img.currentSrc.endsWith(expected)}, {actor:line.speaker,expected}, {timeout:12000});await portrait.evaluate(img=>img.decode());}
          catch(e){await shot(id.replace(':','-')+'-portrait-failure-'+line.speaker);console.error('Actual dialogue portrait failed',await portrait.evaluate(img=>({src:img.src,current:img.currentSrc,complete:img.complete,width:img.naturalWidth})));throw e;}
          if(line.speaker==='muling'&&id==='forest:R-04'&&!observed.includes('muling'))await shot('forest-muling-portrait');
        }
        await dialogue.locator('[data-res-language]').click();
        assert.equal(await page.evaluate(()=>MorrowwishI18n.get()),'zh');
        await page.waitForFunction(text=>document.querySelector('.res-host .res-line')?.textContent===text,line.text.zh);
        if(!observed.length)await shot(id.replace(':','-')+'-zh-dialogue');
        await dialogue.locator('[data-res-language]').click();
        assert.equal(await page.evaluate(()=>MorrowwishI18n.get()),'en');
        await page.waitForFunction(text=>document.querySelector('.res-host .res-line')?.textContent===text,line.text.en);
        observed.push(line.speaker);
        await button('Continue',dialogue).click();
      }
      if(await dialogue.isVisible())await button('Close',dialogue).click();
      if(!choice)assert.equal(observed.length,{'forest:R-01':4,'forest:R-02':4,'forest:R-03':4,'forest:R-04':6}[id],id+' all canonical dialogue lines');
    }
    async function readForgeDialogue(id,choice) {
      const dialogue=page.locator('.res-host[data-scene="'+id+'"]');
      await dialogue.waitFor();
      const first=await page.evaluate(()=>CatBondResonance.view().cursor);
      let observed=0;
      for(;;){
        const v=await page.evaluate(()=>CatBondResonance.view());
        if(v.current?.id!==id)break;
        if(!v.lineReady||v.cursor>=v.current.lines.length){
          if(choice&&!v.choice){await button(choice,dialogue).click();choice=null;continue;}
          break;
        }
        const line=v.current.lines[v.cursor];
        await page.waitForFunction(text=>document.querySelector('.res-host .res-line')?.textContent===text,line.text.en);
        if(['jinpo','xiaomao','muling'].includes(line.speaker)){
          const expected=line.speaker==='muling'?'/cinematics/characters/muling/traveler-neutral.webp':'/npc/'+line.speaker+'-painted.webp';
          await page.waitForFunction(({actor,expected})=>{const d=document.querySelector('.res-host .res-dialogue'),img=d?.querySelector('.res-portrait');return d?.dataset.speaker===actor&&img?.complete&&img.naturalWidth>0&&img.currentSrc.endsWith(expected)},{actor:line.speaker,expected});
        }
        await dialogue.locator('[data-res-language]').click();
        await page.waitForFunction(text=>document.querySelector('.res-host .res-line')?.textContent===text,line.text.zh);
        if(!observed)await shot(id.replace(':','-')+'-'+first+'-zh');
        await dialogue.locator('[data-res-language]').click();
        await page.waitForFunction(text=>document.querySelector('.res-host .res-line')?.textContent===text,line.text.en);
        if(!observed)await shot(id.replace(':','-')+'-'+first+'-en');
        observed++;
        await button('Continue',dialogue).click();
      }
      assert(observed>0,id+' canonical dialogue actually read');
      if(await dialogue.isVisible())await button('Close',dialogue).click();
    }
    async function puzzle(label, inputs) {
      await button(label).click();
      const controls = page.locator('.rw-puzzle-controls');
      await controls.waitFor();
      if(name==='landscape'&&label==='Storm boat'){
        const layout=await page.evaluate(()=>{const a=document.querySelector('.rw-surface').getBoundingClientRect(),b=document.querySelector('.rw-forest-rail').getBoundingClientRect();return {a:a.toJSON(),b:b.toJSON(),w:innerWidth,h:innerHeight}});
        assert.ok(layout.a.top>=40&&layout.a.bottom<=layout.h+1,'Entire Harbor puzzle is visible above bottom edge');
        assert.ok(layout.a.right<=layout.b.left&&layout.b.right<=layout.w+1&&layout.b.bottom<=layout.h+1,'Puzzle controls must occupy a separate landscape rail');
      }
      if(['Storm boat','Lighthouse mirrors','Returning Tides','Tide cave logbook','Safety blueprint','Furnace controls','Hearth sanctuary'].includes(label)){
        await shot('mechanism-'+label.toLowerCase().replaceAll(' ','-'));
      }
      for (const input of inputs) await button(input,controls).click();
      await controls.waitFor({state:'hidden'});
    }

    await shot('title');
    await page.locator('#intro-start').click();
    await page.locator('#intro-slot-list [data-slot="slot1"]').click();
    for (const id of ['prologue:P-01','prologue:P-02','prologue:P-03']) {
      await scene(id);
      await page.locator('.cbcp-art').first().waitFor();
      await page.waitForFunction(() => {
        const image=document.querySelector('.cbcp-art');
        const skip=document.querySelector('.cbcp-skip');
        return image?.naturalWidth > 0 && skip && !skip.disabled;
      });
      if (id === 'prologue:P-01') {
        await page.locator('.cbcp-art').first().evaluate(image=>image.decode());
        await page.waitForTimeout(600);
        await shot('opening');
        await page.locator('.cbcp-language').click();
        assert.equal(await page.evaluate(() => MorrowwishI18n.get()),'zh');
        await page.locator('.cbcp-language').click();
        assert.equal(await page.evaluate(() => MorrowwishI18n.get()),'en');
      }
      if (id === 'prologue:P-01' && name === 'desktop') {
        await scene('prologue:P-02');
      } else {
        await page.locator('.cbcp-skip').click();
      }
    }

    await scene('prologue:P-04');
    await page.locator('#panel .cat-starter-card .dex-cell').first().click();
    await button('Talk to Muling',page.locator('.sg-prologue-guide')).click();
    await readDialogue('prologue:P-04');
    const bell = page.locator('.res-garden-bell');
    await bell.waitFor();
    await shot('garden');
    const rect = await bell.boundingBox();
    const x=Math.floor(rect.x+rect.width/2), y=Math.floor(rect.y+rect.height/3);
    if (options.hasTouch) {
      const cdp = await context.newCDPSession(page);
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y+62}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    } else {
      await page.mouse.move(x,y);
      await page.mouse.down();
      await page.mouse.move(x,y+62,{steps:8});
      await page.mouse.up();
    }
    await scene('prologue:P-05');
    await readDialogue('prologue:P-05');
    await button('World map',page.locator('.sg-prologue-guide')).click();
    await shot('atlas');
    await tapLandmark(.5,.18);
    await scene('harbor:H-01');
    await page.locator('.rw-shell').evaluate(shell=>Promise.allSettled(shell.getAnimations().map(animation=>animation.finished)));
    await shot('harbor');
    assert.ok(await page.locator('.rw-world').evaluate(e=>e.getBoundingClientRect().top>=40),'Harbor scroll viewport stays below fixed game controls');
    await button('Talk to Qilan').click();
    await readDialogue('harbor:H-01');
    await scene('harbor:H-02');
    const mapActivity = page.getByRole('heading',{name:'Check the harbor route with Muling'});
    await tapLandmark(.102,.569);
    await mapActivity.waitFor();
    await button('Close',page.locator('.res-ambient-route')).click();
    await mapActivity.waitFor({state:'hidden'});
    await tapLandmark(.102,.569);
    await mapActivity.waitFor();
    const mapBoard = page.locator('.res-ambient-map');
    async function dragMarker(target) {
      const markerButton = mapBoard.locator('[data-piece="marker"]');
      const targetButton = mapBoard.locator('[data-piece="'+target+'"]');
      await Promise.all([markerButton,targetButton].map(control=>control.locator('img').evaluate(image=>image.decode())));
      const marker = await markerButton.boundingBox();
      const destination = await targetButton.boundingBox();
      assert.ok(marker?.height && destination?.height,'Route marker and destination must be visible');
      const from = {x:marker.x+marker.width/2,y:marker.y+marker.height/2};
      const to = {x:destination.x+destination.width/2,y:destination.y+destination.height/2};
      if (options.hasTouch) {
        const cdp = await context.newCDPSession(page);
        await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[from]});
        await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[to]});
        await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
        await cdp.detach();
      } else {
        await page.mouse.move(from.x,from.y);
        await page.mouse.down();
        await page.mouse.move(to.x,to.y,{steps:8});
        await page.mouse.up();
      }
    }
    await shot('muling-map');
    await dragMarker('lighthouse');
    await page.getByText('Drag the route marker to the pier in the east',{exact:true}).waitFor();
    await dragMarker('pier');
    await button('Return to exploration').click();
    await button('Talk to Jiedeng').click();
    await page.locator('.res-host[data-scene="harbor:H-02"]').waitFor();
    await shot('dialogue');
    const comfort=name!=='portrait';
    await readDialogue('harbor:H-02',comfort?'Comfort Qilan first':'Ask Jiedeng about the old storm');
    await scene('harbor:H-03');
    assert.ok(await page.evaluate(method=>CatBondResonance.view().support.find(x=>x.region==='harbor')?.methods.includes(method),comfort?'navigator-trust':'keeper-trust'),'H-02 choice grants distinct persistent resident support');
    await button('Inspect the ebb marks · 1/2').waitFor();
    await tapLandmark(.82,.45);
    await button('Find the dry steps · 2/2').waitFor();
    await shot('harbor-ebb-marks');
    await tapLandmark(.80,.682);
    await button('Tide cave logbook').waitFor();
    await puzzle('Tide cave logbook',['Ebb mark','Dry steps','Logbook chest']);
    await readDialogue('harbor:H-03');
    await scene('harbor:H-04');
    const calibrate=name==='portrait';
    await tapLandmark(...(calibrate?[.195,.50]:[.16,.60]));
    await readDialogue('harbor:H-04',calibrate?'Calibrate the lighthouse first':'Prioritize rescue');
    const rescue=() => puzzle('Storm boat',calibrate?['Secure','Signal','Guide','Guide','Signal']:['Secure','Secure','Signal','Guide','Guide','Signal']);
    const mirrors=() => puzzle('Lighthouse mirrors',['Left mirror','Left mirror','Center mirror','Center mirror','Right mirror']);
    assert.equal(await page.evaluate(()=>CatBondResonance.view().choice),calibrate?'calibrate':'rescue');
    await button(calibrate?'Storm boat':'Lighthouse mirrors').click();
    await page.getByText(calibrate?'Align the lighthouse first':'Rescue the boat first',{exact:true}).waitFor();
    assert.equal(await page.locator('.rw-puzzle-controls').count(),0,'Wrong H-04 order must not open the puzzle');
    if (calibrate) {await mirrors();await rescue();} else {await rescue();await mirrors();}
    await scene('harbor:H-05');
    await checkObjective('repair:harbor');
    assert.equal(await button('Returning Tides').count(),0,'Melody cannot precede sanctuary repair');
    assert.equal(await button('Invite Qilan').count(),0,'Invitation cannot precede sanctuary repair');
    await puzzle('Lighthouse sanctuary',['Left mirror','Center mirror','Center mirror','Right mirror']);
    await button('Invite Qilan').click();
    await button('Invite Qilan').waitFor({state:'hidden'});
    if(name==='desktop'){
      await page.reload();
      await page.locator('#intro-continue').click();
      await page.locator('#intro-slot-list [data-slot="slot1"]').click();
      await scene('harbor:H-05');
      if(await button('Misttide Harbor').isVisible())await button('Misttide Harbor').click();
      await button('Invite Jiedeng').waitFor();
      assert.equal(await button('Invite Qilan').isVisible(),false,'Invitation survives save reload');
    }
    await button('Invite Jiedeng').click();
    await button('Invite Jiedeng').waitFor({state:'hidden'});
    const rewardBefore=await page.evaluate(()=>({coins:State.S.coins,fish:State.S.fish}));
    await button('Returning Tides').click();
    const harborMelodyControls=page.locator('.rw-puzzle-controls');await harborMelodyControls.waitFor();
    await button('Middle',harborMelodyControls).click(); // wrong note: retry must not commit a melody
    assert.equal(await page.evaluate(()=>CatBondResonance.view().melodies.includes('harbor')),false);
    for(const input of ['Low','High','Middle'])await button(input,harborMelodyControls).click();
    await page.locator('.rw-world[data-ceremony="harbor"]').waitFor();
    await page.locator('.rw-surface').scrollIntoViewIfNeeded();await page.waitForTimeout(750);await shot('harbor-ceremony');
    await page.waitForTimeout(650);await shot('harbor-ceremony-late');
    await harborMelodyControls.waitFor({state:'hidden'});
    assert.deepEqual(await page.evaluate(()=>({coins:State.S.coins,fish:State.S.fish})),{coins:rewardBefore.coins+35,fish:rewardBefore.fish+3},'Returning Tides grants its one-time canonical reward');
    await readDialogue('harbor:H-05');
    await scene('forest:R-01');
    await page.locator('.rw-shell').scrollIntoViewIfNeeded();
    assert.equal(await page.locator('.rw-shell').evaluate(e=>getComputedStyle(e).animationName),'none');
    await shot('harbor-restored');
    assert.equal(await page.evaluate(()=>State.S.resonance.choices['harbor:H-02']),comfort?'comfort':'ask');
    await page.evaluate(()=>MorrowwishI18n.set('zh'));
    await page.getByText('灯塔 · 已复明',{exact:true}).waitFor();
    await page.evaluate(()=>MorrowwishI18n.set('en'));

    // Follow a normal encounter through the actual battle setup and tutorial.
    await button('Approach wild cat').click();
    await page.locator('#bp-go').click();
    await page.locator('#battle-ui.on').waitFor();
    await shot('battle');
    assert.equal(await page.evaluate(() => window.__game.battle.regionalCombat?.region),'harbor');
    const tutorial = page.locator('#battle-tutorial-skip');
    if (await tutorial.isVisible()) await tutorial.click();
    await page.waitForFunction(() => window.__game.scene === 'map', null, {timeout:75000});
    assert.equal(await page.evaluate(() => WorldMap.currentRegion),'harbor');
    const resultClose=page.locator('#cr-ok,#battle-recovery-ok');
    await resultClose.waitFor();
    const captured=await resultClose.getAttribute('id')==='cr-ok';
    assert.equal(await page.evaluate(() => State.S.catchCount || 0),captured?1:0);
    await resultClose.click();
    await button('Sunlit Garden',page.locator('.rw-head')).click();
    await page.waitForFunction(() => window.__game.scene === 'yard');
    await shot('garden-return');

    await page.reload();
    await page.locator('#intro-continue').click();
    await page.locator('#intro-slot-list [data-slot="slot1"]').click();
    await scene('forest:R-01');
    const state = await page.evaluate(() => ({
      sanctuaries:CatBondResonance.view().sanctuaries,
      melodies:CatBondResonance.view().melodies,
      choice:State.S.resonance.choices['harbor:H-04'],
      slot:State.activeSlot(),
      mulingMap:State.S.resonance.ambientDone.includes('muling:map'),
      legacy:!!State.S.lastResonanceWorld
    }));
    assert.deepEqual(state,{sanctuaries:['harbor'],melodies:['harbor'],choice:calibrate?'calibrate':'rescue',slot:'slot1',mulingMap:true,legacy:false});
    // Continue the SAME normal-flow save through Rootsleep Forest, without injecting narrative evidence.
    await page.locator('.rw-world:not([hidden]) .rw-surface').waitFor();
    await button('Rootsleep Forest').click();
    await button('Talk to Yahe').click();
    await readForestDialogue('forest:R-01');
    await scene('forest:R-02');
    await button('Talk to Yahe').click();
    await readForestDialogue('forest:R-02','Prioritize the gardens');
    await button('Scent on damp moss · 1/3').waitFor();
    await tapLandmark(.31,.58);
    await button('Scent on damp moss · 1/3').click();
    await button('Herbs on the canopy path · 2/3').waitFor();
    await shot('forest-trail-first');
    await page.evaluate(()=>MorrowwishI18n.set('zh'));
    await button('林间药草痕迹 · 2/3').waitFor();
    await page.getByText('湿苔上留下了药箱经过的痕迹。沿上方林道继续追踪。',{exact:true}).waitFor();
    await page.evaluate(()=>MorrowwishI18n.set('en'));
    await page.reload();
    await page.locator('#intro-continue').click();
    await page.locator('#intro-slot-list [data-slot="slot1"]').click();
    await scene('forest:R-02');
    await button('Herbs on the canopy path · 2/3').waitFor();
    await tapLandmark(.42,.28);
    await button('Herbs on the canopy path · 2/3').click();
    await button('Medicine at the root channel · 3/3').waitFor();
    await tapLandmark(.69,.53);
    await button('Medicine at the root channel · 3/3').click();
    await readForestDialogue('forest:R-02');
    await scene('forest:R-03');
    await button('Open the upper gate with Yahe').click();
    await button('Paired water gates').waitFor();
    if(name==='landscape'){
      const layout=await page.evaluate(()=>{const a=document.querySelector('.rw-surface').getBoundingClientRect(),b=document.querySelector('.rw-forest-rail').getBoundingClientRect();return {canvas:{x:a.x,y:a.y,right:a.right,bottom:a.bottom},rail:{x:b.x,y:b.y,right:b.right,bottom:b.bottom},w:innerWidth,h:innerHeight}});
      assert(layout.canvas.y>=0&&layout.canvas.bottom<=layout.h+1,'Forest canvas must fit entirely in landscape viewport');
      assert(layout.canvas.right<=layout.rail.x&&layout.rail.right<=layout.w+1&&layout.rail.bottom<=layout.h+1,'Forest controls must sit beside, not cover, the canvas');
    }
    if(name==='portrait'){const box=await page.locator('.rw-surface').boundingBox();assert(box.y>=40&&box.y+box.height<=844,'Forest painting is fully visible before progress details on portrait');}
    await shot('forest-upper-gate');
    await button('Paired water gates').click();
    const pairedControls=page.locator('.rw-puzzle-controls');await pairedControls.waitFor();await shot('forest-paired-puzzle');
    const pressureStatus=pairedControls.locator('.rw-paired-status');
    const verifyPressure=async text=>{await pressureStatus.filter({hasText:text}).waitFor();};
    await button('Open lower channel',pairedControls).click();
    await button('Clear together',pairedControls).click();
    await verifyPressure('Pressure 0/3');
    await checkObjective('puzzle:paired-water-gates');
    for(const input of ['Steady upper pressure','Steady upper pressure','Open lower channel'])await button(input,pairedControls).click();
    await verifyPressure('Both channels open');
    await button('Steady upper pressure',pairedControls).click();
    await verifyPressure('Overpressure — lower gate closed');
    await button('Clear together',pairedControls).click();
    await checkObjective('puzzle:paired-water-gates');
    await shot('forest-overpressure-recovery');
    if(name==='portrait'){
      const locale=page.locator('#mw-game-settings .mw-settings-language');await locale.click();await page.waitForFunction(()=>MorrowwishI18n.get()==='zh');
      await verifyPressure('水压过高 · 地下闸门关闭');
      for(const input of ['稳住上层','稳住上层','稳住上层','打开地下'])await button(input,pairedControls).click();
      await verifyPressure('双路稳定 · 共同疏通根脉');
      await shot('forest-paired-flow-zh');await locale.click();await page.waitForFunction(()=>MorrowwishI18n.get()==='en');
    }else for(const input of ['Steady upper pressure','Steady upper pressure','Steady upper pressure','Open lower channel'])await button(input,pairedControls).click();
    await verifyPressure('Both channels open');
    await shot('forest-paired-flow');await button('Clear together',pairedControls).click();await pairedControls.waitFor({state:'hidden'});
    await readForestDialogue('forest:R-03');
    await scene('forest:R-04');
    await puzzle('Ancient-root sanctuary',['Upstream','Branch','Roots']);
    await button('Invite Yahe').click();
    await button('Invite Yahe').waitFor({state:'hidden'});
    // Reload through the real title and continue menu, not through save mutation.
    await page.reload();await page.locator('#intro-continue').click();await page.locator('#intro-slot-list [data-slot="slot1"]').click();
    await scene('forest:R-04');await button('Invite Yuchuan').waitFor();
    assert.equal(await button('Invite Yahe').count(),0,'Forest invitation survives reload');
    await button('Invite Yuchuan').click();
    await button('Invite Yuchuan').waitFor({state:'hidden'});
    await button('Living Roots').click();const melodyControls=page.locator('.rw-puzzle-controls');await melodyControls.waitFor();
    for(const note of ['Middle','Low','High'])await button(note,melodyControls).click();
    await page.waitForFunction(()=>document.querySelector('.rw-puzzle-controls button')?.disabled===true);
    await page.waitForTimeout(950);await shot('forest-living-roots-ceremony');
    await melodyControls.waitFor({state:'hidden'});
    await readForestDialogue('forest:R-04');
    await scene('forge:E-01');
    assert.deepEqual(await page.evaluate(()=>CatBondResonance.view().melodies),['harbor','forest']);
    assert.deepEqual(await page.evaluate(()=>CatBondResonance.view().sanctuaries),['harbor','forest']);
    assert.equal(await page.evaluate(()=>WorldMap.isUnlocked('forge')),true);
    await shot('forest-complete');
    if(name==='desktop'){
      await button('Approach wild cat').click();
      await page.locator('#panel [data-battle-auto="true"]').click();
      await page.locator('#bp-go').click();await page.locator('#battle-ui.on').waitFor();
      assert.equal(await page.evaluate(()=>window.__game.battle.regionalCombat?.kit.kind),'roots');
      assert.equal(await page.evaluate(()=>window.__game.battle.autoMode),true);
      await shot('forest-battle');
      // Real in-battle controls; keep the original engine's natural victory/loss cap.
      await page.locator('#btn-auto').click();
      assert.equal(await page.evaluate(()=>window.__game.battle.autoMode),false);
      const tutorial=page.locator('#battle-tutorial-skip');
      if(await tutorial.isVisible())await tutorial.click();
      await page.keyboard.down('d');await page.waitForTimeout(350);await page.keyboard.up('d');
      await shot('forest-battle-manual');
      await page.locator('#btn-auto').click();
      assert.equal(await page.evaluate(()=>window.__game.battle.autoMode),true);
      // 85 simulation seconds at normal time scaling may be well over 75 wall seconds.
      try{await page.waitForFunction(()=>window.__game.scene==='map',null,{timeout:200000});}
      catch(error){await shot('forest-battle-timeout');console.error('Forest combat remained active',await page.evaluate(()=>{const b=__game.battle;return {t:b?.t,done:b?.done,auto:b?.autoMode,help:__game.battleHelpOpen,tutorial:!!__game.battleTutorial,cycle:b?.regionalCombat?.cycle,team:b?.team?.map(c=>({hp:c.hp,alive:c.alive})),enemies:b?.enemies?.map(c=>({hp:c.hp,alive:c.alive}))}}));throw error;}
      await page.locator('#cr-ok,#battle-recovery-ok').click();
    }
    async function ship(region, cargo){
      await button('Collect '+cargo).click();
      await button('Deliver '+cargo).click();
      await button('Deliver '+cargo).waitFor({state:'hidden'});
    }
    async function travel(name){await button('World atlas',page.locator('.rw-head')).click();await button(name).click();}
    await travel('Misttide Harbor');await ship('harbor','Beacon-guided supplies');
    await travel('Rootsleep Forest');await ship('forest','Beacon-guided supplies');
    await ship('forest','Herbs and waterway map');
    await travel('Misttide Harbor');await ship('harbor','Herbs and waterway map');
    await travel('Rootsleep Forest');await ship('forest','Cooling water and herbs');
    assert.deepEqual(await page.evaluate(()=>CatBondResonance.view().links['harbor:forest']),['sendA','receiveB','sendB','receiveA']);
    assert.deepEqual(await page.evaluate(()=>CatBondResonance.view().links['forest:forge']),['sendA']);
    await shot('forest-exchange');
    await button('Sunlit Garden',page.locator('.rw-head')).click();
    await page.waitForFunction(()=>window.__game.scene==='yard');
    assert(await page.evaluate(()=>CatBondResonance.ambientAvailable('garden').some(a=>a.id==='muling:cooking')));
    assert(await page.evaluate(()=>GardenProjects.progress().find(p=>p.id==='forest')?.unlocked));
    await shot('forest-home');
    const mapHit=await page.locator('#fab-map').evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));});
    assert(mapHit,'Garden map button must not be obscured by the cat roster');await page.locator('#fab-map').click();
    await button('Rootsleep Forest').click();
    await button('World atlas',page.locator('.rw-head')).click();
    await button('Emberforge City').click();
    await page.waitForFunction(()=>WorldMap.mode==='region'&&WorldMap.currentRegion==='forge');
    await page.waitForSelector('.rw-forge-region[data-art-ready="true"]');await page.locator('.rw-surface').evaluate(c=>Promise.allSettled(c.parentElement.getAnimations().map(a=>a.finished)));const forgeRect=await page.locator('.rw-surface').boundingBox();assert(forgeRect&&forgeRect.y>=0&&forgeRect.y+forgeRect.height<=options.viewport.height+1,'Forge painting fully visible');await shot('forge-silent');
    await ship('forge','Cooling water and herbs');
    await button('Talk to Xiaomao').click();
    await readForgeDialogue('forge:E-01');await scene('forge:E-02');
    await button('Recover the frame · 1/3').click();
    await button('Recover the old pipe · 2/3').waitFor();
    await shot('forge-workshop-clue');
    await page.reload();await page.locator('#intro-continue').click();await page.locator('#intro-slot-list [data-slot="slot1"]').click();
    await scene('forge:E-02');
    if(await button('Emberforge City').isVisible())await button('Emberforge City').click();
    await tapLandmark(.35,.58);await button('Recover the relief valve · 3/3').waitFor();
    await tapLandmark(.44,.50);await button('Safety blueprint').waitFor();
    await puzzle('Safety blueprint',['Frame','Pipes','Valve']);
    const forgeChoice=name==='portrait'?'Let Jinpo speak to the workers first':'Publish the accident record now';
    await readForgeDialogue('forge:E-02',forgeChoice);await scene('forge:E-03');
    await button('Continue story').click();await readForgeDialogue('forge:E-03');
    await puzzle('Furnace controls',['Heat','Heat','Heat','Heat','Vent','Vent','Vent']);
    await page.waitForSelector('.rw-forge-region[data-art-ready="true"]');await shot('forge-test-ready');
    await button('Forge guardian').click();
    if(name==='desktop'){
      // A real, intentionally underprepared attempt: one cat, manual mode,
      // no attacks or support. No game state, HP, clock or save writes.
      await page.locator('#battle-team-details summary').click();
      const selected=page.locator('#panel .map-squad-choice[aria-pressed="true"]');
      while(await selected.count()>1)await selected.first().click();
      await page.locator('#panel [data-battle-auto="false"]').click();
      await page.locator('#bp-go').click();
      await page.locator('#cb-forge-hud').waitFor();
      const intro=page.locator('#battle-tutorial-skip');if(await intro.isVisible())await intro.click();
      await page.waitForFunction(()=>__game.battle?.team.length===1&&!__game.battle.autoMode);
      await page.waitForFunction(()=>__game.battle?.forgeState?.cast?.kind==='hammerfall');await shot('forge-hammer-warning');
      await page.locator('#cb-forge-result').waitFor({timeout:200000});
      assert.equal(await page.locator('#cb-forge-result h2').innerText(),'THE SQUAD NEEDS REST');
      assert.equal(await page.evaluate(()=>CatBondResonance.view().objective.includes('battle:forge-guardian')),true);
      await shot('forge-defeat');
      await page.locator('[data-forge-retry]').click();
      await page.locator('#bp-best-team').click();
    }
    await page.locator('#panel [data-battle-auto="true"]').click();await page.locator('#bp-go').click();
    await page.locator('#battle-ui.on').waitFor();try{await page.locator('#cb-forge-hud').waitFor();}catch(e){await shot('forge-boss-entry-failed');console.error('Forge entry failed',await page.evaluate(()=>({scene:__game.scene,story:__game.battle?.storyEncounter,forge:!!__game.battle?.forgeState,errors:document.getElementById('toasts')?.textContent})));throw e;}
    assert.equal(await page.evaluate(()=>__game.battle.forgeState.assist),name==='portrait'?'jinpo':'xiaomao');
    const forgeTutorial=page.locator('#battle-tutorial-skip');if(await forgeTutorial.isVisible())await forgeTutorial.click();
    await page.locator('#cb-forge-hud img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
    if(name==='portrait'){
      const clearance=await page.evaluate(()=>{
        const hud=document.getElementById('cb-forge-hud').getBoundingClientRect();
        const controls=[...document.querySelectorAll('#team-slots .team-slot,#duo-burst,#ult-wrap,.move-bar .move')].filter(el=>!el.hidden&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden');
        const overlap=controls.filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&Math.min(hud.right,r.right)-Math.max(hud.left,r.left)>1&&Math.min(hud.bottom,r.bottom)-Math.max(hud.top,r.top)>1}).map(el=>el.id||el.className);
        return {overlap,inside:hud.left>=0&&hud.right<=innerWidth+1&&hud.top>=0&&hud.bottom<=innerHeight+1};
      });
      assert.deepEqual(clearance,{overlap:[],inside:true},'Portrait furnace HUD must not cover battle controls');
    }
    await shot('forge-boss');
    await page.locator('#btn-flee').click();
    await page.locator('#cb-forge-result').waitFor();
    assert.equal(await page.locator('#cb-forge-result h2').innerText(),'WITHDRAWN');await shot('forge-retreat');
    await page.locator('[data-forge-retry]').click();await page.locator('#bp-go').click();await page.locator('#battle-ui.on').waitFor();await page.locator('#cb-forge-hud').waitFor();
    if(await page.evaluate(()=>__game.battle.autoMode))await page.locator('#btn-auto').click();assert.equal(await page.evaluate(()=>__game.battle.autoMode),false);
    // Switching from automatic to manual can open the first manual lesson.
    // Dismiss through its real UI, never by clearing the coach or changing saves.
    if(await page.locator('#battle-help').isVisible()){
      const skip=page.locator('#battle-tutorial-skip');
      if(await skip.isVisible()){await shot('forge-manual-tutorial');await skip.click();}
      else await page.locator('#battle-help-start').click();
    }
    await page.locator('#battle-help').waitFor({state:'hidden'});
    await page.locator('[data-forge-support-button]').click();await page.waitForFunction(()=>__game.battle.forgeState.ventOpen>0&&__game.battle.forgeState.supportCharges===1);await shot('forge-boss-vent');
    if(options.hasTouch){const cdp=await context.newCDPSession(page);const c=await page.locator('#scene').boundingBox();const x=c.x+c.width*.20,y=c.y+c.height*.65;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+38,y}]});await page.waitForTimeout(300);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();}else{await page.keyboard.down('d');await page.waitForTimeout(300);await page.keyboard.up('d');}
    await page.locator('#btn-auto').click();
    // Natural combat only: no HP, time, save or engine writes.
    for(const phase of [1,2]){await page.waitForFunction(p=>__game.battle?.forgeState?.phase>=p,phase,{timeout:150000});await shot('forge-phase-'+(phase+1));}
    await page.locator('#cb-forge-result').waitFor({timeout:200000});
    const outcome=await page.locator('#cb-forge-result h2').innerText();await shot('forge-result');
    assert.equal(outcome,'FURNACE STABILIZED','Natural guardian battle must be won before Chapter III can pass');
    await page.locator('[data-forge-return]').click();await scene('forge:E-04');
    await readForgeDialogue('forge:E-04');
    assert.equal(await page.evaluate(()=>CatBondResonance.view().lineReady),false,"Route dialogue waits for the melody");
    await puzzle('Hearth sanctuary',['Heat','Heat','Heat','Heat','Vent']);
    await button('Invite Jinpo').click();await button('Invite Jinpo').waitFor({state:'hidden'});
    await page.reload();await page.locator('#intro-continue').click();await page.locator('#intro-slot-list [data-slot="slot1"]').click();
    await scene('forge:E-04');if(await button('Emberforge City').isVisible())await button('Emberforge City').click();
    assert.equal(await button('Invite Jinpo').count(),0,'Forge invitation persists');
    await button('Invite Xiaomao').click();await button('Invite Xiaomao').waitFor({state:'hidden'});
    await button('Song of Ember').click();const forgeMelody=page.locator('.rw-puzzle-controls');await forgeMelody.waitFor();
    for(const note of ['High','Middle','Low'])await button(note,forgeMelody).click();
    await page.waitForTimeout(1800);await shot('forge-ceremony');await page.waitForTimeout(1300);await shot('forge-routing-reveal');await forgeMelody.waitFor({state:'hidden'});
    await readForgeDialogue('forge:E-04');
    await scene('sky:S-01');await shot('forge-restored');
    assert.deepEqual(await page.evaluate(()=>CatBondResonance.view().melodies),['harbor','forest','forge']);
    await ship('forge','Pumps and tools');await travel('Rootsleep Forest');await ship('forest','Pumps and tools');
    assert.deepEqual(await page.evaluate(()=>CatBondResonance.view().links['forest:forge']),['sendA','receiveB','sendB','receiveA']);
    await travel('Emberforge City');await ship('forge','Wind vanes and flight parts');
    await button('World atlas',page.locator('.rw-head')).click();
    assert.equal(await page.evaluate(()=>WorldMap.isUnlocked('sky')),true);
    assert.equal(await button('Skyspine Isles').isEnabled(),true);
    await button('Workshop',page.locator('.rw-system-nav')).click();
    await page.locator('.workshop-row[data-id="st_forge"]').waitFor();
    await page.locator('[data-act="forge-tools"]').click();
    await page.getByText('Reinforced tools equipped · +25%',{exact:true}).waitFor();
    assert.equal(await page.evaluate(()=>Raising.stationsView().find(s=>s.id==='st_forge')?.reinforced),true);
    await shot('forge-workshop');await page.locator('#panel .panel-dismiss').click();
    await button('Catdex',page.locator('.rw-system-nav')).click();await page.locator('#panel.open').waitFor();const record=page.locator('[data-dex-record="forge"]');await record.scrollIntoViewIfNeeded();await record.getByText('Furnace Guardian',{exact:true}).waitFor();await record.locator('img').evaluate(img=>img.decode());await shot('forge-catdex');await page.locator('#panel .panel-dismiss').click();
    await button('Party',page.locator('.rw-system-nav')).click();await page.locator('#map-squad-best').click();await page.locator('#map-squad-save').click();await page.locator('#panel.open').waitFor({state:'hidden'});
    await button('Sunlit Garden',page.locator('.rw-head')).click();await page.waitForFunction(()=>__game.scene==='yard');assert(await page.evaluate(()=>GardenProjects.progress().find(p=>p.id==='forge')?.unlocked));await shot('forge-garden-restoration');await page.locator('#fab-map').click();
    await button('Skyspine Isles').click();await page.waitForFunction(()=>WorldMap.currentRegion==='sky');
    await page.locator('.rw-sky-region[data-art-ready="true"]').waitFor();const skyRect=await page.locator('.rw-surface').boundingBox();assert(skyRect&&skyRect.y>=0&&skyRect.y+skyRect.height<=options.viewport.height+1,'Skyspine painting must be entirely visible on arrival');await shot('sky-arrival');
    await ship('sky','Wind vanes and flight parts');
    async function skyDialogue(id,choice){
      const dlg=page.locator('.res-host[data-scene="'+id+'"]');await dlg.waitFor();
      if(choice)await button(choice,dlg).click();
      let seen=0;
      for(;;){
        const line=await page.evaluate(expected=>{const v=CatBondResonance.view();return v.current?.id===expected&&v.lineReady?v.current.lines[v.cursor]:null},id);
        if(!line||!await dlg.isVisible())break;
        await page.waitForFunction(t=>document.querySelector('.res-host .res-line')?.textContent===t,line.text.en);
        if(['lingyu','yuanfan','muling'].includes(line.speaker))await dlg.locator('.res-portrait').evaluate(img=>img.decode());
        if(id==='sky:S-04'&&seen===0){
          await dlg.locator('.res-sky-pendant-shot[data-ready="true"][data-repair-action="adjusting"]').waitFor();await shot('sky-pendant-repair');
        }
        if(id==='sky:S-04'&&seen===11){
          await dlg.locator('.res-sky-pendant-shot[data-ready="true"]').waitFor();
          const shotLayout=await dlg.evaluate(root=>{const r=root.querySelector('.res-sky-pendant-shot').getBoundingClientRect(),parts=[root.querySelector('.res-portrait'),root.querySelector('.res-body')].filter(el=>el&&!el.hidden);return parts.every(el=>{const p=el.getBoundingClientRect();return Math.min(r.right,p.right)<=Math.max(r.left,p.left)+1||Math.min(r.bottom,p.bottom)<=Math.max(r.top,p.top)+1;});});assert(shotLayout,'Pendant cutaway must not cover the speaker or dialogue');
          await dlg.locator('[data-sky-taps="1"]').waitFor();await shot('sky-pendant-tap-one');
          await dlg.locator('[data-sky-taps="2"]').waitFor();await shot('sky-pendant-tap-two');
        }
        await dlg.locator('[data-res-language]').click();
        await page.waitForFunction(t=>document.querySelector('.res-host .res-line')?.textContent===t,line.text.zh);
        if(!seen)await shot(id.replace(':','-')+'-zh');
        await dlg.locator('[data-res-language]').click();
        await page.waitForFunction(t=>document.querySelector('.res-host .res-line')?.textContent===t,line.text.en);
        seen++;await button('Continue',dlg).click();
      }
      assert.equal(seen,{'sky:S-01':4,'sky:S-02':3,'sky:S-03':3,'sky:S-04':12}[id],id+' all real dialogue lines');
      if(await dlg.isVisible())await button('Close',dlg).click();
    }
    async function skyFlight(label,heights,failFirst=false){
      await button(label).click();const status=page.locator('[data-sky-flight-status]');await status.waitFor();
      const surface=page.locator('.rw-surface');await surface.scrollIntoViewIfNeeded();const box=await surface.boundingBox();
      const send=options.hasTouch?await context.newCDPSession(page):null;
      const p=y=>({x:Math.round(box.x+box.width*.30),y:Math.round(box.y+box.height*y)});
      const start=async y=>{const q=p(y);if(send)await send.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[q]});else{await page.mouse.move(q.x,q.y);await page.mouse.down();}};
      const move=async y=>{const q=p(y);if(send)await send.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[q]});else await page.mouse.move(q.x,q.y,{steps:5});};
      const end=async()=>{if(send)await send.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});else await page.mouse.up();};
      if(failFirst){await start(.5);await end();await page.waitForFunction(()=>Number(document.querySelector('[data-sky-flight-status]')?.dataset.attempts)>0,null,{timeout:20000});await shot('sky-flight-failed');}
      const keys=!options.hasTouch&&label==='Flight recorder';
      const preset=async y=>{await surface.focus();await page.keyboard.press(y<.4?'1':y>.6?'3':'2');};
      if(keys)await preset(heights[0]);else await start(heights[0]);await shot('sky-flight-'+label.replaceAll(' ','-'));
      for(let i=1;i<=3;i++){await page.waitForFunction(g=>Number(document.querySelector('[data-sky-flight-status]')?.dataset.gates)===g,i,{timeout:18000});if(keys)await preset(i===3?.5:heights[i]);else await move(i===3?.5:heights[i]);}
      if(!keys)await end();await status.waitFor({state:'hidden',timeout:20000});if(send)await send.detach();
    }
    await button('Talk to Yuanfan').click();await skyDialogue('sky:S-01');await scene('sky:S-02');
    await skyFlight('Flight recorder',[.68,.29,.66],true);await skyDialogue('sky:S-02');await scene('sky:S-03');
    await button('Talk to Yuanfan').click();const skyChoice=name==='portrait'?'Train on a joint route first':'Let Yuanfan lead';
    await skyDialogue('sky:S-03',skyChoice);
    assert.equal(await page.evaluate(()=>CatBondResonance.view().choice),name==='portrait'?'train':'lead');
    await skyFlight('Joint gliding platform',[.29,.72,.31]);await scene('sky:S-04');
    assert(await page.evaluate(method=>CatBondResonance.view().support.find(x=>x.region==='sky')?.methods?.includes(method),name==='portrait'?'escort-flight':'fast-courier'));
    await button('Talk to Muling').click();await skyDialogue('sky:S-04');await scene('sky:S-05');
    await skyFlight('Windwing sanctuary',[.67,.30,.64]);
    await button('Invite Lingyu').click();await button('Invite Lingyu').waitFor({state:'hidden'});
    await page.reload();await page.locator('#intro-continue').click();await page.locator('#intro-slot-list [data-slot="slot1"]').click();await scene('sky:S-05');
    if(await button('Skyspine Isles').isVisible())await button('Skyspine Isles').click();
    assert.equal(await button('Invite Lingyu').count(),0);
    await button('Invite Yuanfan').click();await button('Invite Yuanfan').waitFor({state:'hidden'});
    await button('Open Sky').click();const skyMelody=page.locator('.rw-puzzle-controls');await skyMelody.waitFor();
    for(const note of ['Middle','High','Low'])await button(note,skyMelody).click();
    await page.waitForTimeout(850);await shot('sky-open-sky-ceremony');await page.waitForTimeout(1050);await shot('sky-air-route-reopening');await skyMelody.waitFor({state:'hidden'});
    await scene('library:M-01');assert.deepEqual(await page.evaluate(()=>CatBondResonance.view().melodies),['harbor','forest','forge','sky']);await shot('sky-restored');
    await ship('sky','Wind data and airship route');await travel('Emberforge City');await ship('forge','Wind data and airship route');
    assert.deepEqual(await page.evaluate(()=>CatBondResonance.view().links['forge:sky']),['sendA','receiveB','sendB','receiveA']);
    await travel('Skyspine Isles');
    await skyFlight('Fly to Farwind Isle',[.72,.27,.67]);await tapLandmark(.39,.20);await button('Inspect courier cache').click();
    await page.waitForFunction(()=>!!State.S.resonanceExploration.pickups['sky:survey-cache']);await shot('sky-hidden-cache');
    await skyFlight('Return to Courier Dock',[.28,.73,.29]);
    // Real optional regional battle; preserve natural battle outcome.
    await button('Approach wild cat').click();await page.locator('#panel [data-battle-auto="true"]').click();await page.locator('#bp-go').click();
    await page.locator('#battle-ui.on').waitFor();assert.equal(await page.evaluate(()=>__game.battle.regionalCombat?.kit.kind),'gale');
    const catchBefore=await page.evaluate(()=>State.S.catchCount);if(await page.locator('#battle-tutorial-skip').isVisible())await page.locator('#battle-tutorial-skip').click();
    await page.locator('#btn-flee').click();await page.getByText('Retreated from the gale',{exact:true}).waitFor();await shot('sky-retreat');assert.equal(await page.evaluate(()=>State.S.catchCount),catchBefore);
    await page.locator('#sky-retry-encounter').click();await page.locator('#panel [data-battle-auto="true"]').click();await page.locator('#bp-go').click();await page.locator('#battle-ui.on').waitFor();
    await page.locator('#btn-auto').click();
    if(await page.locator('#battle-help').isVisible()){const skip=page.locator('#battle-tutorial-skip');if(await skip.isVisible())await skip.click();else await page.locator('#battle-help-start').click();}
    await page.locator('#battle-help').waitFor({state:'hidden'});
    const supportPanel=page.locator('#cb-region-combat[data-region="sky"]'),supportButton=supportPanel.locator('[data-region-support]');
    await supportPanel.waitFor();
    assert.equal(await page.evaluate(()=>__game.battle.regionalCombat.skyMethod),name==='portrait'?'escort-flight':'fast-courier');
    const supportClearance=await supportPanel.evaluate(panel=>{
      const hud=panel.getBoundingClientRect();
      const controls=[...document.querySelectorAll('#team-slots .team-slot,#duo-burst,#ult-wrap,.move-bar .move')].filter(el=>!el.hidden&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden');
      return {overlap:controls.filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&Math.min(hud.right,r.right)-Math.max(hud.left,r.left)>1&&Math.min(hud.bottom,r.bottom)-Math.max(hud.top,r.top)>1}).map(el=>el.id||el.className),inside:hud.left>=0&&hud.right<=innerWidth+1&&hud.top>=0&&hud.bottom<=innerHeight+1};
    });
    assert.deepEqual(supportClearance,{overlap:[],inside:true},'Gale support panel must leave native battle controls unobscured');
    await page.waitForFunction(()=>__game.battle?.regionalCombat?.cast,{},{timeout:20000});
    await shot('sky-gale-warning');
    await supportButton.click();
    await page.waitForFunction(()=>!!__game.battle?.regionalCombat?.skySupportEffect);
    const effect=await page.evaluate(()=>__game.battle.regionalCombat.skySupportEffect);
    assert.equal(effect.method,name==='portrait'?'escort-flight':'fast-courier');
    assert.equal(effect.duration,name==='portrait'?1.8:.8);
    assert.equal(effect.chargeAfter,name==='portrait'?effect.chargeBefore:Math.min(100,effect.chargeBefore+12));
    assert(effect.protected>0);
    await shot('sky-choice-support-used');
    if(options.hasTouch){const cdp=await context.newCDPSession(page);const rect=await page.locator('#scene').boundingBox();const x=rect.x+rect.width*.4,y=rect.y+rect.height*.5;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+32,y}]});await page.waitForTimeout(280);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();}else{await page.keyboard.down('d');await page.waitForTimeout(350);await page.keyboard.up('d');}
    await shot('sky-battle-manual');await page.locator('#btn-auto').click();
    await page.waitForFunction(()=>__game.scene==='map',null,{timeout:200000});await page.locator('#cr-ok,#battle-recovery-ok').waitFor();await shot('sky-natural-battle-result');const skyWon=await page.locator('#cr-ok').isVisible();assert.equal(await page.evaluate(()=>State.S.catchCount),catchBefore+(skyWon?1:0));if(!skyWon)await page.getByText('Squad defeated in the gale',{exact:true}).waitFor();await page.locator('#cr-ok,#battle-recovery-ok').click();
    // A distinct normal-player loss and win must both be demonstrated on desktop.
    // Deliberately enter with only one cat, in manual mode, without attacking.
    if(name==='desktop'){
      await button('Approach wild cat').click();
      await page.locator('#battle-team-details summary').click();
      const selected=page.locator('#panel .map-squad-choice[aria-pressed="true"]');
      while(await selected.count()>1)await selected.first().click();
      await page.locator('#panel [data-battle-auto="false"]').click();await page.locator('#bp-go').click();
      await page.locator('#battle-ui.on').waitFor();
      if(await page.locator('#battle-help').isVisible()){const skip=page.locator('#battle-tutorial-skip');if(await skip.isVisible())await skip.click();else await page.locator('#battle-help-start').click();}
      await page.waitForFunction(()=>__game.battle?.team.length===1&&!__game.battle.autoMode);
      await page.waitForFunction(()=>__game.scene==='map',null,{timeout:200000});
      await page.getByText('Squad defeated in the gale',{exact:true}).waitFor();await shot('sky-natural-defeat');
      assert.equal(await page.evaluate(()=>State.S.catchCount),catchBefore+(skyWon?1:0));
      await page.locator('#sky-retry-encounter').click();await page.locator('#bp-best-team').click();
      await page.locator('#panel [data-battle-auto="true"]').click();await page.locator('#bp-go').click();
      await page.locator('#battle-ui.on').waitFor();
      if(await page.locator('#battle-tutorial-skip').isVisible())await page.locator('#battle-tutorial-skip').click();
      await page.waitForFunction(()=>__game.scene==='map',null,{timeout:200000});await page.locator('#cr-ok').waitFor();
      assert.equal(await page.evaluate(()=>State.S.catchCount),catchBefore+(skyWon?2:1));
      await shot('sky-natural-victory-after-defeat');await page.locator('#cr-ok').click();
    }
    await button('World atlas',page.locator('.rw-head')).click();assert.equal(await page.evaluate(()=>WorldMap.isUnlocked('library')),true);assert.equal(await button('Moonmirror Library').isDisabled(),true);
    const stablePanel=async()=>{await page.locator('#panel.open > .card').waitFor();await page.locator('#panel.open').evaluate(el=>Promise.allSettled(el.getAnimations({subtree:true}).filter(a=>a.effect?.getTiming().iterations!==Infinity).map(a=>a.finished)));};
    await button('Catdex',page.locator('.rw-system-nav')).click();await stablePanel();
    const skyRecords=page.locator('.cb-dex-sky-records');await skyRecords.locator('summary').click();
    await skyRecords.getByText('Skyspine flight record',{exact:true}).waitFor();await skyRecords.getByText('Muling · familiar habit',{exact:true}).waitFor();await skyRecords.scrollIntoViewIfNeeded();await shot('sky-catdex');await page.locator('#panel .panel-dismiss').click();
    await button('Workshop',page.locator('.rw-system-nav')).click();await stablePanel();const calibrated=page.getByText(/Skyspine wind calibration/);await calibrated.waitFor();await calibrated.scrollIntoViewIfNeeded();assert(await page.evaluate(()=>Raising.stationsView().find(s=>s.id==='st_watch')?.skyCalibrated));await shot('sky-workshop');await page.locator('#panel .panel-dismiss').click();
    await page.evaluate(()=>MorrowwishI18n.set('zh'));await page.getByText(/第四章已完成 · 月镜书库已解锁/).waitFor();await shot('sky-release-zh');await page.evaluate(()=>MorrowwishI18n.set('en'));
    await button('Sunlit Garden',page.locator('.rw-head')).click();await page.waitForFunction(()=>__game.scene==='yard');assert(await page.evaluate(()=>GardenProjects.progress().find(p=>p.id==='sky')?.unlocked));const guide=page.getByRole('button',{name:/Skip/}).filter({visible:true});if(await guide.count()===1)await guide.click();
    await shot('sky-garden');
    const homeScene=page.locator('#scene');
    for(const [id,x,y] of [['lingyu',.65,.46],['yuanfan',.70,.57]]){
      const rect=await homeScene.boundingBox();
      const point={x:rect.x+rect.width*x,y:rect.y+rect.height*y};
      if(options.hasTouch)await page.touchscreen.tap(point.x,point.y);else await page.mouse.click(point.x,point.y);
      const convo=page.locator('.res-home-conversation');await convo.waitFor();
      assert.equal(await convo.locator('.res-speaker').innerText(),id==='lingyu'?'Lingyu':'Yuanfan');
      const line=await convo.locator('.res-line').innerText();
      if(id==='lingyu'&&name==='portrait')assert.equal(line,'During our training he told me when he needed help. Now I ask before lending a paw.');
      if(id==='yuanfan'&&name!=='portrait')assert.equal(line,'Thank you for letting me lead. I delivered today\'s letters myself. My sister is waiting at the dock.');
      await button('中文',convo).click();await convo.getByRole('button',{name:'关闭',exact:true}).waitFor();await shot('sky-home-'+id+'-zh');
      await convo.getByRole('button',{name:'English',exact:true}).click();await button('Close',convo).click();
    }
    await page.locator('#fab-map').click();await button('Rootsleep Forest').click();

    // Save isolation: detached controls and the old region must not survive a slot switch,
    // even if a queued callback is invoked synchronously before the next animation frame.
    await button('World atlas',page.locator('.rw-head')).click();
    const slotIsolation=await page.evaluate(()=>{
      const stale=document.querySelector('.rw-regions [data-region="forge"]');
      const original=State.S;
      if(!stale||stale.disabled)throw Error('Expected unlocked forge');
      if(!State.startNewGame('slot2',{overwriteConfirmed:true}))throw Error('Create isolated slot failed');
      stale.click();
      const newSlot={different:State.S!==original,mode:WorldMap.mode,location:WorldMap.currentRegion,forge:WorldMap.isUnlocked('forge'),oldDetached:!stale.isConnected,puzzle:!!document.querySelector('.rw-puzzle-controls')};
      if(!State.loadSlot('slot1'))throw Error('Restore original slot failed');
      return {newSlot,melodies:State.S.resonance.melodies,slot:State.activeSlot()};
    });
    assert.deepEqual(slotIsolation,{newSlot:{different:true,mode:'map',location:null,forge:false,oldDetached:true,puzzle:false},melodies:['harbor','forest','forge','sky'],slot:'slot1'});
    assert.deepEqual(errors,[]);
    const finalState=await page.evaluate(()=>{const v=CatBondResonance.view(),snapshot=CatBondResonance.snapshot();return {slot:State.activeSlot(),current:v.current?.id,completed:v.completed,sanctuaries:v.sanctuaries,melodies:v.melodies,links:v.links,skyChoice:snapshot.choices['sky:S-03'],skySupport:v.support.find(x=>x.region==='sky'),hiddenCache:!!State.S.resonanceExploration.pickups['sky:survey-cache'],lookout:!!Raising.stationsView().find(s=>s.id==='st_watch')?.skyCalibrated,catchCount:State.S.catchCount};});
    assert.deepEqual(finalState.melodies,['harbor','forest','forge','sky']);
    assert.deepEqual(finalState.sanctuaries,['harbor','forest','forge','sky']);
    assert.deepEqual(finalState.links['forge:sky'],['sendA','receiveB','sendB','receiveA']);
    assert(finalState.hiddenCache&&finalState.lookout&&finalState.slot==='slot1'&&finalState.current==='library:M-01');
    assert.deepEqual(finalState.completed.filter(id=>id.startsWith('sky:')),['sky:S-01','sky:S-02','sky:S-03','sky:S-04','sky:S-05']);
    results.push({profile:name,captured,...finalState,forestComplete:finalState.completed.includes('forest:R-04'),forgeComplete:finalState.completed.includes('forge:E-04'),skyComplete:finalState.completed.includes('sky:S-05'),battle:{retreat:true,choiceSupport:effect,firstNaturalOutcome:skyWon?'win':'defeat',additionalNaturalDefeat:name==='desktop',additionalNaturalVictory:name==='desktop'}});
    await context.close();
  }
} finally {
  await fs.writeFile(out+'/results.json',JSON.stringify(results,null,2));
  await browser.close();
}
