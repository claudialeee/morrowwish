import {attachExperienceRecorder} from './cat-bond-experience-recorder.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import {playStarfallFromForge} from './cat-bond-starfall-playthrough.mjs';
import {continueToFinale} from './cat-bond-finale-real-playthrough.mjs';
const fullCampaign=process.env.CAT_BOND_FULL_CAMPAIGN==='1';

const origin = 'http://127.0.0.1:8765';
const out = 'artifacts/cat-bond-harbor';
await fs.mkdir(out, {recursive:true});
const browser = await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
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
    await attachExperienceRecorder(context,page,{id:'campaign-en-'+name});
    const errors = [];
    page.on('pageerror', error => {errors.push(error.message);console.error('Actual browser page error',error.stack||error.message);});
    await page.route('**/*', route => /^(data:|blob:)/.test(route.request().url())||route.request().url().startsWith(origin + '/') ? route.continue() : route.abort());
    await page.goto(origin+'/cat-bond/?lang=en'+(fullCampaign?'&rpgDev=1':''));
    await page.waitForFunction(() => window.WorldMap === window.CatBondCanonicalWorld && window.CatBondResonance && window.__game);
    assert.equal(await page.evaluate(()=>window.__CAT_BOND_INTEGRATION_ART__),false,'Production entry must not enable unreviewed staging art');
    // The dialogue intentionally hides the global menu and language toggle.
    // This is a localization-only probe; no story, map, or battle state is written.
    // The continuous player route otherwise uses actual game controls.
    const changeDialogueLanguage=async()=>{const target=await page.evaluate(()=>MorrowwishI18n.get()==='zh'?'en':'zh');await page.evaluate(lang=>MorrowwishI18n.set(lang),target);await page.waitForFunction(lang=>MorrowwishI18n.get()===lang,target);};
    const button = (name, scope = page) => {
      if(name==='Continue'&&scope!==page){const line=scope.locator('.res-line');if(scope.toString().includes('res-host'))return line;}
      const target=name==='Approach wild cat'?scope.locator('button[data-wild-rarity]'):scope.getByRole('button',{name,exact:true});
      // Look up the exact text even when its paged-out ancestor hides the
      // accessible name. Real clicks still use the visible role locator.
      const all=name==='Approach wild cat'?target:scope.getByRole('button',{name,exact:true,includeHidden:true}).or(scope.locator('button').and(scope.getByText(name,{exact:true})));
      const reveal=async()=>{if(await target.isVisible())return;await all.waitFor({state:'attached',timeout:30000});if(await target.isVisible())return;const world=page.locator('.rw-world:not([hidden])');if(!(await world.isVisible()))return;
       const atlas=world.locator('.rw-atlas-menu:not([open]) > summary');
       if(await atlas.count()&&await all.first().evaluate(el=>!!el.closest('.rw-atlas-menu'))){await page.locator('#map-menu').click();await page.locator('#cb-system-menu [data-system="world-explore"]').click();};
       const region=world.locator('.rw-region-toggle[aria-expanded="false"]');
       if(await region.count()&&await all.first().evaluate(el=>!!el.closest('#rw-region-actions'))){await page.locator('#map-menu').click();await page.locator('#cb-system-menu [data-system="world-explore"]').click();};
       // Optional exploration is nested under its own details element.
       const optional=world.locator('.rw-optional-actions:not([open]) > summary');
       if(!await target.isVisible()&&await optional.count()&&await all.first().evaluate(el=>!!el.closest('.rw-optional-actions'))){
        if(await optional.first().isVisible())await optional.first().click();
        else{
         const pages=Number(await world.getAttribute('data-fit-pages')||1),prev=world.locator('[data-fit-prev]'),next=world.locator('[data-fit-next]');
         for(let i=0;i<pages&&await prev.isVisible()&&await prev.isEnabled()&&!await optional.first().isVisible();i++)await prev.click();
         for(let i=0;i<pages&&await next.isVisible()&&await next.isEnabled()&&!await optional.first().isVisible();i++)await next.click();
         if(await optional.first().isVisible())await optional.first().click();
        }
       }
       if(await target.isVisible())return;
       const count=Number(await world.getAttribute('data-fit-pages')||1),next=world.locator('[data-fit-next]'),prev=world.locator('[data-fit-prev]');
       const press=async locator=>options.hasTouch?locator.tap():locator.click();
       for(let i=0;i<count&&await prev.isVisible()&&await prev.isEnabled()&&!await target.isVisible();i++)await press(prev);
       for(let i=0;i<count&&await next.isVisible()&&await next.isEnabled()&&!await target.isVisible();i++)await press(next);
      };
      const click=target.click.bind(target),wait=target.waitFor.bind(target),enabled=target.isEnabled.bind(target);
      target.isEnabled=async opts=>{await reveal();return enabled(opts)};
      target.click=async opts=>{if(['World atlas','Sunlit Garden'].includes(name)&&await all.first().evaluate(el=>!!el.dataset.worldNav).catch(()=>false)){await page.locator('#map-menu').click();return page.locator('#cb-system-menu [data-system="'+(name==='World atlas'?'world-atlas':'world-garden')+'"]').click(opts);}if(scope===page&&['+','−','Overview','Follow cat'].includes(name)){await page.locator('#map-menu').click();await page.locator('#cb-system-menu [data-system="page-camera"]').click();const label={'+':'Zoom in','−':'Zoom out','Overview':'Overview','Follow cat':'Follow cat'}[name];return page.locator('#cb-system-menu').getByRole('button',{name:label,exact:true}).click(opts);}await reveal();return click(opts)};
      target.waitFor=async opts=>{if(opts?.state==='hidden'&&/^(Invite |Deliver )/.test(name))return all.waitFor({...opts,state:'detached'});if(!opts||!['hidden','detached'].includes(opts.state))await reveal();return wait(opts)};
      if(/^(Invite |Returning Tides)/.test(name))target.count=()=>all.count();
      return target;
    };
    // A persistent status may live on another actual control page. Verify
    // it is reachable by tapping the game's pager, not by changing DOM state.
    const revealText=async text=>{const message=page.getByText(text,{exact:true});await message.waitFor({state:'attached'});if(await message.isVisible())return;const world=page.locator('.rw-world:not([hidden])'),prev=world.locator('[data-fit-prev]'),next=world.locator('[data-fit-next]');const atlas=world.locator('.rw-atlas-menu:not([open]) > summary');if(await atlas.count()&&await message.evaluate(el=>!!el.closest('.rw-atlas-menu'))){await page.locator('#map-menu').click();await page.locator('#cb-system-menu [data-system="world-explore"]').click();};const region=world.locator('.rw-region-toggle[aria-expanded="false"]');if(await region.count()&&await message.evaluate(el=>!!el.closest('#rw-region-actions'))){await page.locator('#map-menu').click();await page.locator('#cb-system-menu [data-system="world-explore"]').click();};const press=el=>options.hasTouch?el.tap():el.click();const count=Number(await world.getAttribute('data-fit-pages')||1);for(let i=0;i<count&&!await message.isVisible()&&await prev.isVisible()&&await prev.isEnabled();i++)await press(prev);for(let i=0;i<count&&!await message.isVisible()&&await next.isVisible()&&await next.isEnabled();i++)await press(next);await message.waitFor();};
    const scene = id => page.waitForFunction(expected => CatBondResonance.view().current?.id === expected, id);
    const audioEvidence=[];
    const expectedAudio={garden:'garden',atlas:'atlas',harbor:'harbor','harbor-ceremony':'song-harbor','garden-return':'garden','forest-paired-puzzle':'forest','forest-living-roots-ceremony':'song-forest','forest-to-forge':'forge','forge-ceremony':'song-forge'};
    const shot = async id => {
      const expected=expectedAudio[id]||(id.startsWith('battle-attempt-')?'battle':null);
      if(process.env.CAT_BOND_AUDIO_ACCEPTANCE==='1'&&expected){
        await page.waitForFunction(track=>{const s=window.MorrowwishMusic?.status?.();return s?.track===track&&s.playing&&(track.startsWith('song-')?s.source==='recorded-mp3:'+track:s.source?.startsWith('premium-mp3:'))&&s.activeMusicSources<=2;},expected,{timeout:15000});
        const audio=await page.evaluate(()=>MorrowwishMusic.status());assert.equal(audio.audioState,'running');audioEvidence.push({checkpoint:id,...audio});
      }
      const cinematic=page.locator('.cbcp-root:not([hidden])');
      if(await cinematic.isVisible()){
       // Layered epilogue frames append NPC images after the background. The
       // last child is therefore not necessarily a background image. Require
       // the latest background, every current actor layer, and actual painted
       // geometry; a missing or unrenderable asset still fails acceptance.
       await page.waitForFunction(()=>{
        const root=document.querySelector('.cbcp-root:not([hidden])');
        if(!root||root.dataset.ready!=='true')return false;
        const stack=root.querySelector('.cbcp-art-stack'),image=[...stack.querySelectorAll('.cbcp-art')].at(-1);
        if(!image?.complete||!image.naturalWidth||Number(getComputedStyle(image).opacity)<.95)return false;
        const layers=[...stack.children].slice([...stack.children].indexOf(image)+1).filter(n=>n.classList.contains('cbcp-layer'));
        return layers.every(n=>n.complete&&n.naturalWidth>0);
       },null,{timeout:10000});
       const fit=await cinematic.evaluate(el=>{
        const r=el.getBoundingClientRect(),stage=document.getElementById('stage').getBoundingClientRect(),art=el.querySelector('.cbcp-art-stack'),sub=el.querySelector('.cbcp-subtitle-wrap'),image=[...art.querySelectorAll('.cbcp-art')].at(-1);
        const layers=[...art.children].slice([...art.children].indexOf(image)+1).filter(n=>n.classList.contains('cbcp-layer'));
        const bounds=art.getBoundingClientRect(),visible=n=>{const b=n.getBoundingClientRect(),style=getComputedStyle(n);return n.complete&&n.naturalWidth>0&&b.width>0&&b.height>0&&style.visibility!=='hidden'&&Number(style.opacity)>0&&b.right>bounds.left&&b.left<bounds.right&&b.bottom>bounds.top&&b.top<bounds.bottom;};
        const layeredExchange=el.dataset.frameId?.startsWith('epilogue:E-01-exchange-');
        return {inside:r.left>=stage.left-1&&r.top>=stage.top-1&&r.right<=stage.right+1&&r.bottom<=stage.bottom+1,art:!!image&&visible(image)&&art.clientWidth>0&&art.clientHeight>0,subtitle:sub.hidden||sub.getBoundingClientRect().bottom<=r.bottom+1,layers:(!layeredExchange||layers.length===2)&&layers.every(visible)};
       });
       assert.deepEqual(fit,{inside:true,art:true,subtitle:true,layers:true},id+' actual cinematic stage fit and loaded actor layers');
      }else if(await page.locator('.rw-world:not([hidden])').isVisible()&&!await page.locator('#panel.open,.res-host').count()){
       const fit=await page.evaluate(()=>{const w=document.querySelector('.rw-world:not([hidden])'),s=w?.querySelector('.rw-surface');if(!s)return null;const stage=document.getElementById('stage').getBoundingClientRect(),rect=s.getBoundingClientRect(),shell=s.parentElement.getBoundingClientRect(),rail=w.querySelector('.rw-fit-rail');return {scene:rect.width>0&&rect.height>0&&shell.top>=stage.top-1&&shell.bottom<=stage.bottom+1&&shell.left>=stage.left-1&&shell.right<=stage.right+1,ratio:Math.abs(rect.width/rect.height-16/9)<.03,noScroll:w.scrollHeight<=w.clientHeight+2,buttons:[...rail.querySelectorAll('button')].filter(b=>b.getClientRects().length&&b.getBoundingClientRect().top<rail.getBoundingClientRect().bottom&&b.getBoundingClientRect().bottom>rail.getBoundingClientRect().top&&(!w.classList.contains('rw-region-compact')||!rail.contains(b))).every(b=>{const r=b.getBoundingClientRect();return r.top>=stage.top-1&&r.bottom<=stage.bottom+1&&r.left>=stage.left-1&&r.right<=stage.right+1;}),noFollower:!CatBondResonance.isMulingFollowing()&&!CatBondResonanceNPC.drawFollower};});
       if(fit)assert.deepEqual(fit,{scene:true,ratio:true,noScroll:true,buttons:true,noFollower:true},id+' stage fit / solo exploration');
      }
      return page.screenshot({path:out+'/'+name+'-'+id+'.png'});
    };
    const checkObjective = operation => page.waitForFunction(op => CatBondResonance.view().objective.includes(op),operation);
    async function tapLandmark(x,y) {
      assert.deepEqual(errors,[],'No runtime errors before interacting with the world map');
      const surface = page.locator('.rw-surface');
      // Landmarks are authored in world coordinates; the new camera can zoom
      // and pan. Read the painted transform rather than mutating the game.
      await surface.scrollIntoViewIfNeeded();
      await page.waitForFunction(()=>!!document.querySelector('.rw-surface')?.dataset.camera);
      const project=()=>surface.evaluate((el,{x,y})=>{const [z,px,py]=JSON.parse(el.dataset.camera),r=el.getBoundingClientRect(),u=x*z+px,v=y*z+py;const shell=el.parentElement.getBoundingClientRect(),sx=r.left+r.width*u,sy=r.top+r.height*v;return {x:sx,y:sy,visible:u>=.015&&u<=.985&&v>=.015&&v<=.985&&sx>=shell.left+4&&sx<=shell.right-4&&sy>=shell.top+4&&sy<=shell.bottom-4};},{x,y});
      let point=await project();
      if(!point.visible){await button('Overview').click();await page.waitForFunction(()=>document.querySelector('.rw-surface')?.dataset.camera==='[1,0,0]');point=await project();}
// Cover-cropped painting is a real camera viewport. Pan the authored landmark into view using actual input.
for(let attempt=0;attempt<8&&!point.visible;attempt++){const shell=await surface.locator('..').boundingBox(),cx=shell.x+shell.width/2,cy=shell.y+shell.height/2,dx=Math.max(-shell.width*.32,Math.min(shell.width*.32,cx-point.x)),dy=Math.max(-shell.height*.32,Math.min(shell.height*.32,cy-point.y));if(options.hasTouch){const cdp=await context.newCDPSession(page);try{await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cx,y:cy}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:cx+dx,y:cy+dy}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}finally{await cdp.detach();}}else{await page.mouse.move(cx,cy);await page.mouse.down();await page.mouse.move(cx+dx,cy+dy,{steps:5});await page.mouse.up();}point=await project();}
      assert.ok(point.visible,'Landmark must be visible before pointer input');
      if (options.hasTouch) await page.touchscreen.tap(point.x,point.y);
      else await page.mouse.click(point.x,point.y);
    }
    async function verifyAtlasCamera(){
      const surface=page.locator('.rw-surface');
      await page.waitForFunction(()=>document.querySelector('.rw-surface')?.dataset.camera==='[1,0,0]');
      await button('+').click();
      await page.waitForFunction(()=>Number(JSON.parse(document.querySelector('.rw-surface')?.dataset.camera||'[0]')[0])>1);
      const before=JSON.parse(await surface.getAttribute('data-camera'));
      const box=await surface.boundingBox(),x=box.x+box.width*.5,y=box.y+box.height*.5,dx=box.width*.08;
      if(options.hasTouch){const cdp=await context.newCDPSession(page);try{await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx,y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}finally{await cdp.detach();}}
      else{await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+dx,y,{steps:5});await page.mouse.up();}
      const after=JSON.parse(await surface.getAttribute('data-camera'));
      assert.ok(after[1]>before[1]+.025,'Real pointer drag pans atlas');
      assert.equal(await page.evaluate(()=>WorldMap.mode),'map','Dragging is not a landmark tap');
      await button('Overview').click();
      await page.waitForFunction(()=>document.querySelector('.rw-surface')?.dataset.camera==='[1,0,0]');
      await button('+').click();
      await page.waitForFunction(()=>JSON.parse(document.querySelector('.rw-surface')?.dataset.camera||'[0]')[0]>1);
      await shot('atlas-camera-zoom');
    }
    async function readDialogue(id,choice) {
      const dialogue = page.locator('.res-host[data-scene="'+id+'"]');
      await dialogue.waitFor();
      const advance = button('Skip dialogue',dialogue);
      async function advanceLines(){
        if(process.env.CAT_BOND_EXPERIENCE!=='1'&&!id.startsWith('harbor:')){if(await advance.isVisible()&&await advance.isEnabled())await advance.click();return;}
        const next=button('Continue',dialogue);let count=0;
        while(await dialogue.isVisible()&&await page.evaluate(id=>{const v=CatBondResonance.view();return v.current?.id===id&&v.lineReady&&v.cursor<v.current.lines.length},id)){
          assert.ok(++count<100,'Dialogue must progress without looping: '+id);
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
            await changeDialogueLanguage();await page.waitForFunction(text=>document.querySelector('.res-host .res-line')?.textContent===text,expected.text.zh);
            if(count===1)await shot(id.replace(':','-')+'-zh');
            await changeDialogueLanguage();assert.equal(await line.innerText(),english,'Language switch preserves exact dialogue cursor');
          }
          await line.click();
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
    function expectedRegionalPortrait(actor){
      if(actor!=='muling')return '/npc/'+actor+'-painted.webp';
      return '/core-art-remaster/leads/muling.webp';
    }
    async function readForestDialogue(id,choice) {
      const dialogue=page.locator('.res-host[data-scene="'+id+'"]');
      await dialogue.waitFor();
      const expectedCount=await page.evaluate(()=>{const v=CatBondResonance.view();return v.current.lines.length-v.cursor});
      const observed=[];
      while(await dialogue.isVisible()){
        const line=await page.evaluate(expected=>{const v=CatBondResonance.view();return v.current?.id===expected&&v.lineReady&&v.current.lines[v.cursor]?{...v.current.lines[v.cursor],cursor:v.cursor}:null},id);
        if(!line)break;
        await page.waitForFunction(text=>document.querySelector('.res-host .res-line')?.textContent===text,line.text.en);
        if(['yahe','yuchuan','muling'].includes(line.speaker)){
          const portrait=dialogue.locator('.res-portrait');
          await portrait.waitFor({state:'visible'});
          const expected=expectedRegionalPortrait(line.speaker,id,line.cursor);
          try{await page.waitForFunction(({actor,expected})=>{const d=document.querySelector('.res-host .res-dialogue'),img=d?.querySelector('.res-portrait');return d?.dataset.speaker===actor&&img?.complete&&img.naturalWidth>0&&img.currentSrc.endsWith(expected)}, {actor:line.speaker,expected}, {timeout:12000});await portrait.evaluate(img=>img.decode());}
          catch(e){await shot(id.replace(':','-')+'-portrait-failure-'+line.speaker);console.error('Actual dialogue portrait failed',await portrait.evaluate(img=>({src:img.src,current:img.currentSrc,complete:img.complete,width:img.naturalWidth})));throw e;}
          if(line.speaker==='muling'&&id==='forest:R-04'&&!observed.includes('muling'))await shot('forest-muling-portrait');
        }
        await changeDialogueLanguage();
        assert.equal(await page.evaluate(()=>MorrowwishI18n.get()),'zh');
        await page.waitForFunction(text=>document.querySelector('.res-host .res-line')?.textContent===text,line.text.zh);
        if(!observed.length)await shot(id.replace(':','-')+'-zh-dialogue');
        await changeDialogueLanguage();
        assert.equal(await page.evaluate(()=>MorrowwishI18n.get()),'en');
        await page.waitForFunction(text=>document.querySelector('.res-host .res-line')?.textContent===text,line.text.en);
        observed.push(line.speaker);
        await dialogue.locator('.res-line').click();
      }
      if(choice)await button(choice,dialogue).click();
      if(await dialogue.isVisible())await dialogue.waitFor({state:'hidden'});
      assert.equal(observed.length,expectedCount,id+' all remaining canonical dialogue lines');
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
          const expected=expectedRegionalPortrait(line.speaker,id,v.cursor);
          await page.waitForFunction(({actor,expected})=>{const d=document.querySelector('.res-host .res-dialogue'),img=d?.querySelector('.res-portrait');return d?.dataset.speaker===actor&&img?.complete&&img.naturalWidth>0&&img.currentSrc.endsWith(expected)},{actor:line.speaker,expected});
        }
        await changeDialogueLanguage();
        await page.waitForFunction(text=>document.querySelector('.res-host .res-line')?.textContent===text,line.text.zh);
        if(!observed)await shot(id.replace(':','-')+'-'+first+'-zh');
        await changeDialogueLanguage();
        await page.waitForFunction(text=>document.querySelector('.res-host .res-line')?.textContent===text,line.text.en);
        if(!observed)await shot(id.replace(':','-')+'-'+first+'-en');
        observed++;
        await dialogue.locator('.res-line').click();
      }
      assert(observed>0,id+' canonical dialogue actually read');
      if(await dialogue.isVisible())await dialogue.waitFor({state:'hidden'});
    }
    async function puzzle(label, inputs) {
      const harborDirect={'Tide cave logbook':'explore:tide-logbook','Storm boat':'rescue:storm-boat','Lighthouse mirrors':'puzzle:beam-mirrors','Lighthouse sanctuary':'repair:harbor'};
      if(harborDirect[label]){
        const op=harborDirect[label];await checkObjective(op);
        await button(label).click();
        await page.waitForFunction(op=>!CatBondResonance.view().objective.includes(op),op,{timeout:35000});
        await shot('adventure-'+label.toLowerCase().replaceAll(' ','-'));return;
      }
      await button(label).click();
      const controls = page.locator('.rw-puzzle-controls');
      await controls.waitFor();
      if(name==='landscape'&&label==='Storm boat'){
        const layout=await page.evaluate(()=>{const a=document.querySelector('.rw-surface').getBoundingClientRect(),b=document.querySelector('.rw-forest-rail').getBoundingClientRect();return {a:a.toJSON(),b:b.toJSON(),w:innerWidth,h:innerHeight}});
        assert.ok(layout.a.top<=0&&layout.a.bottom>=layout.h-1,'Harbor painting covers the landscape viewport');
        assert.ok(layout.b.left>=0&&layout.b.top>=0&&layout.b.right<=layout.w+1&&layout.b.bottom<=layout.h+1,'Puzzle control overlay stays within the viewport');
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
    // The current Player-First opening retires the old cinematic and bell.
    // Follow the real visible opening and optional Muling encounter instead.
    await scene('prologue:P-05');
    const contextIntro=page.locator('#cb-player-first-intro');
    await contextIntro.waitFor();
    await shot('opening');
    await contextIntro.getByRole('button',{name:'Start exploring',exact:true}).click();
    assert.deepEqual(await page.evaluate(()=>State.S.cats.map(c=>c.species)),['jinjc']);
    await page.locator('[data-npc-talk="muling"]').click();
    const encounter=page.locator('#cb-traveler-encounter');
    await encounter.getByRole('button',{name:'Find the chart pieces',exact:true}).click();
    await encounter.waitFor({state:'detached'});
    for(const id of ['chart-0','chart-1'])await page.locator('[data-garden-explore="'+id+'"]').click();
    await page.locator('[data-npc-talk="muling"]').click();
    for(const label of ['Continue','Say goodbye'])await encounter.getByRole('button',{name:label,exact:true}).click();
    assert.equal(await page.evaluate(()=>CatBondResonance.view().openingMet),true);
    await shot('garden');
    await page.locator('.sg-prologue-guide').getByRole('button',{name:'Next scene · Misttide Harbor',exact:true}).click();
    await scene('harbor:H-01');
    await page.locator('.rw-shell').evaluate(shell=>Promise.allSettled(shell.getAnimations().map(animation=>animation.finished)));
    await shot('harbor');
    assert.ok(await page.locator('.rw-world').evaluate(e=>{const stage=e.parentElement.getBoundingClientRect(),bar=e.parentElement.querySelector('#cb-header')?.getBoundingClientRect(),world=e.getBoundingClientRect();return world.top>=stage.top-1&&world.bottom<=stage.bottom+1&&world.left>=stage.left-1&&world.right<=stage.right+1&&e.scrollHeight<=e.clientHeight+2;}),'Full-bleed Harbor remains inside stage without scrolling');
    await button('Talk to Qilan').click();
    await readDialogue('harbor:H-01');
    await scene('harbor:H-02');
    // Optional interaction has a separate acceptance lane; mainline must be completable without it.
    const testAmbient=process.env.CAT_BOND_TEST_AMBIENT==='1';
    if(testAmbient){
      const mapActivity=page.locator('.res-ambient-simple');
      await button('Talk to Muling').click();await mapActivity.waitFor();
      await button('Maybe later',mapActivity).click();await mapActivity.waitFor({state:'hidden'});
      assert.equal(await page.evaluate(()=>State.S.resonance.ambientDone.includes('muling:map')),false);
      await button('Talk to Muling').click();await mapActivity.waitFor();await shot('muling-map');
      await button('Turn the map around',mapActivity).click();await button('Return to exploration',mapActivity).click();
      assert.equal(await page.evaluate(()=>State.S.resonance.ambientDone.includes('muling:map')),true);
    }else{
      console.log('OPTIONAL COVERAGE DEFERRED harbor muling:map; separate route needed (last run could not find Talk to Muling)');
    }
    await button('Talk to Jiedeng').click();
    await page.locator('.res-host[data-scene="harbor:H-02"]').waitFor();
    await shot('dialogue');
    const comfort=name!=='portrait';
    await readDialogue('harbor:H-02',comfort?'Comfort Qilan first':'Ask Jiedeng about the old storm');
    await scene('harbor:H-03');
    assert.ok(await page.evaluate(method=>CatBondResonance.view().support.find(x=>x.region==='harbor')?.methods.includes(method),comfort?'navigator-trust':'keeper-trust'),'H-02 choice grants distinct persistent resident support');
    // Use the exposed actual quest action; it walks to the landmark and records the same evidence.
    await button('Inspect the ebb marks · 1/2').click();
    await page.waitForFunction(()=>!!State.S.resonanceExploration.interactions['harbor:H-03:tide:0']);
    await button('Find the dry steps · 2/2').waitFor();
    await shot('harbor-ebb-marks');
    await button('Find the dry steps · 2/2').click();
    await page.waitForFunction(()=>!!State.S.resonanceExploration.interactions['harbor:H-03:tide:1']);
    await button('Tide cave logbook').waitFor();
    await puzzle('Tide cave logbook',['Ebb mark','Dry steps','Logbook chest']);
    await readDialogue('harbor:H-03');
    await scene('harbor:H-04');
    const calibrate=name==='portrait';
    await button(calibrate?'Talk to Jiedeng':'Talk to Qilan').click();
    await readDialogue('harbor:H-04',calibrate?'Calibrate the lighthouse first':'Prioritize rescue');
    const rescue=() => puzzle('Storm boat',calibrate?['Secure','Signal','Guide','Guide','Signal']:['Secure','Secure','Signal','Guide','Guide','Signal']);
    const mirrors=() => puzzle('Lighthouse mirrors',['Left mirror','Left mirror','Center mirror','Center mirror','Right mirror']);
    assert.equal(await page.evaluate(()=>CatBondResonance.view().choice),calibrate?'calibrate':'rescue');
    await button(calibrate?'Storm boat':'Lighthouse mirrors').click();
    await page.getByText(calibrate?'Align the lighthouse first':'Rescue the boat first',{exact:true}).waitFor();
    assert.equal(await page.locator('.rw-puzzle-controls').count(),0,'Wrong H-04 order must not open the puzzle');
    if (calibrate) {await mirrors();await rescue();} else {await rescue();await mirrors();}
    // Last two lines are gated by actual rescue and mirror completion.
    if(await page.evaluate(()=>CatBondResonance.view().current?.id==='harbor:H-04'))await readDialogue('harbor:H-04');
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
    // Current Harbor direct-action ceremony; no retired note keypad or demo.
    await page.locator('.rw-world[data-ceremony="harbor"]').waitFor();
    await shot('harbor-ceremony');
    await page.waitForFunction(()=>!CatBondResonance.view().objective.includes('melody:harbor'),null,{timeout:35000});
    await page.locator('.rw-world[data-ceremony="harbor"]').waitFor({state:'hidden'});
    assert.deepEqual(await page.evaluate(()=>({coins:State.S.coins,fish:State.S.fish})),{coins:rewardBefore.coins+35,fish:rewardBefore.fish+3},'Returning Tides grants its one-time canonical reward');
    await readDialogue('harbor:H-05');
    await scene('forest:R-01');
    await page.locator('.rw-shell').scrollIntoViewIfNeeded();
    assert.equal(await page.locator('.rw-shell').evaluate(e=>getComputedStyle(e).animationName),'none');
    await shot('harbor-restored');
    assert.equal(await page.evaluate(()=>State.S.resonance.choices['harbor:H-02']),comfort?'comfort':'ask');
    await page.evaluate(()=>MorrowwishI18n.set('zh'));
    await revealText('灯塔 · 已复明');
    await page.evaluate(()=>MorrowwishI18n.set('en'));

    // A lost optional encounter cannot prove a Duo exists. Use normal retry
    // and actual battle inputs until the first capture unlocks it, without
    // changing HP, affinity, save flags, encounter RNG or the story engine.
    let captured=false;
    for(let attempt=1;attempt<=4&&!captured;attempt++){
      await button('Approach wild cat').click({timeout:30000});
      await page.locator('#panel [data-battle-auto="true"]').click();
      await page.locator('#bp-go').click();
      await page.locator('#battle-ui.on').waitFor();
      await shot('battle-attempt-'+attempt);
      assert.equal(await page.evaluate(() => window.__game.battle.regionalCombat?.region),'harbor');
      const tutorial=page.locator('#battle-tutorial-skip');
      if(await tutorial.isVisible())await tutorial.click();
      if(!await page.evaluate(()=>window.__game.battle.autoMode))await page.locator('#btn-auto').click();
      try{await page.waitForFunction(()=>window.__game.scene==='map',null,{timeout:200000});}
      catch(error){await shot('harbor-battle-timeout-'+attempt);console.error('Harbor combat remained active',await page.evaluate(()=>{const b=__game.battle;return {t:b?.t,done:b?.done,auto:b?.autoMode,help:__game.battleHelpOpen,tutorial:!!__game.battleTutorial,cycle:b?.regionalCombat?.cycle,team:b?.team?.map(c=>({hp:c.hp,alive:c.alive})),enemies:b?.enemies?.map(c=>({hp:c.hp,alive:c.alive}))}}));throw error;}
      assert.equal(await page.evaluate(()=>WorldMap.currentRegion),'harbor');
      const resultClose=page.locator('#cr-ok,#battle-recovery-ok');
      await resultClose.waitFor();
      captured=await resultClose.getAttribute('id')==='cr-ok';
      assert.equal(await page.evaluate(()=>State.S.catchCount||0),captured?1:0);
      await shot('harbor-capture-result-'+attempt);
      await resultClose.click();
    }
    assert(captured,'Earn the first capture through actual gameplay before testing a Duo');
    assert(await page.evaluate(()=>{const pair=CatRelations.chosen();return pair.length===2&&CatRelations.pair(...pair).value>=20;}),'First capture must unlock a real chosen Duo');
    await button('Sunlit Garden',page.locator('.rw-head')).click();
    await page.waitForFunction(() => window.__game.scene === 'yard');
    await shot('garden-return');
    if(process.env.CAT_BOND_AUDIO_ACCEPTANCE==='1'){
      await page.locator('#map-menu').click();
      const system=page.locator('#cb-system-menu');await system.waitFor({state:'visible'});await system.locator('[data-system="page-settings"]').click();
      await system.locator('[data-audio-volume="music"]').fill('46');
      await page.waitForFunction(()=>MorrowwishMusic.status().volume===.46);
      await system.locator('[data-system="close"]').click();
    }

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
    assert.deepEqual(state,{sanctuaries:['harbor'],melodies:['harbor'],choice:calibrate?'calibrate':'rescue',slot:'slot1',mulingMap:testAmbient,legacy:false});
    // Continue the SAME normal-flow save through Rootsleep Forest, without injecting narrative evidence.
    await page.locator('.rw-world:not([hidden]) .rw-surface').waitFor();
    await button('Rootsleep Forest').click();
    await button('Talk to Yahe').click();
    await readForestDialogue('forest:R-01');
    await scene('forest:R-02');
    // Canon 1.2: investigate before choosing; no paired-gate minigame.
    await button('Forest floor · Scattered herbs · 1/3').click();
    await button('Canopy · Moving roots · 2/3').waitFor();
    await shot('forest-trail-first');
    if(process.env.CAT_BOND_MAP_ONLY==='1'){
      assert.deepEqual(errors,[]);
      results.push({profile:name,mapSmoke:true,captured,harborComplete:true,forestEntered:true});
      await context.close();continue;
    }
    await page.reload();await page.locator('#intro-continue').click();await page.locator('#intro-slot-list [data-slot="slot1"]').click();
    await scene('forest:R-02');
    await button('Canopy · Moving roots · 2/3').click();
    await button('Root cavern · Medicine and sick roots · 3/3').click();
    await readForestDialogue('forest:R-02','Prioritize the gardens');
    await scene('forest:R-03');
    await checkObjective('rescue:steady-channel');
    assert.equal(await page.evaluate(()=>CatBondResonance.view().objective.includes('puzzle:paired-water-gates')),false);
    await button('Meet Yahe · Stabilize the channel').click();
    await page.waitForFunction(()=>CatBondResonance.view().objective[0]==='explore:water-marks');
    await shot('forest-channel-held');
    await button('Investigate the call from dry roots').click();
    await revealText('There are no water marks here, but the voice repeats. This is not where the cats are trapped.');
    await checkObjective('explore:water-marks');
    await shot('forest-false-echo');
    await button('Inspect the wet water marks').click();
    await page.waitForFunction(()=>CatBondResonance.view().objective[0]==='battle:root-echo');
    await button('Dispel the mimicking echo').click();
    await page.locator('#panel [data-battle-auto="true"]').click();
    await page.locator('#bp-go').click();
    await page.locator('#battle-ui.on').waitFor();
    await page.waitForFunction(()=>__game.battle?.libraryEncounter?.region==='forest');
    const forestTutorial=page.locator('#battle-tutorial-skip');
    if(await forestTutorial.isVisible())await forestTutorial.click();
    if(!await page.evaluate(()=>__game.battle.autoMode))await page.locator('#btn-auto').click();
    await shot('forest-root-echo-battle');
    await page.waitForFunction(()=>__game.scene==='map',null,{timeout:200000});
    await page.getByText('Hollow echo dispelled',{exact:true}).waitFor();
    await page.locator('#library-battle-ok').click();
    await page.waitForFunction(()=>CatBondResonance.view().objective[0]==='rescue:trapped-cats');
    await button('Free the roots · Rescue the cats').click();
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
    const playExample=melodyControls.locator('.rw-melody-demo');await playExample.click();await playExample.waitFor();await melodyControls.and(page.locator('[data-demo-state="complete"]')).waitFor({state:'visible'});
    assert.deepEqual(await melodyControls.locator('.rw-quality-step').allTextContents(),['1 ◆','2 ●','3 ✿'],'Forest example remains visible for silent and audio play');
    const key=i=>melodyControls.locator('[data-note="'+i+'"]');
    await key(1).click();await key(2).click(); // wrong second note preserves first
    assert.match(await melodyControls.locator('.rw-quality-step').first().textContent(),/✓/);
    await key(0).click();await key(2).click();
    await page.waitForFunction(()=>document.querySelector('.rw-puzzle-controls button')?.disabled===true);
    await page.waitForTimeout(950);await shot('forest-living-roots-ceremony');
    await melodyControls.waitFor({state:'hidden'});
    await readForestDialogue('forest:R-04');
    await scene('forge:E-01');
    assert.deepEqual(await page.evaluate(()=>CatBondResonance.view().melodies),['harbor','forest']);
    assert.deepEqual(await page.evaluate(()=>CatBondResonance.view().sanctuaries),['harbor','forest']);
    assert.equal(await page.evaluate(()=>WorldMap.isUnlocked('forge')),true);
    await shot('forest-complete');
    if(process.env.CAT_BOND_FOREST_ONLY==='1'){
      assert.deepEqual(errors,[]);
      results.push({profile:name,captured,harborComplete:true,forestComplete:true});
      await context.close();continue;
    }
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
    assert.equal(await page.locator('#fab-map').isVisible(),false,'Garden map belongs in the menu');await page.locator('#map-menu').click();await page.locator('#cb-system-menu [data-system="yard-map"]').click();
    await button('Rootsleep Forest').click();
    await button('World atlas',page.locator('.rw-head')).click();
    await button('Emberforge City').click();
    await page.waitForFunction(()=>WorldMap.mode==='region'&&WorldMap.currentRegion==='forge');
    await page.waitForSelector('.rw-forge-region[data-art-ready="true"]');await page.locator('.rw-surface').evaluate(c=>Promise.allSettled(c.parentElement.getAnimations().map(a=>a.finished)));const forgeRect=await page.locator('.rw-shell').boundingBox();assert(forgeRect&&forgeRect.y>=0&&forgeRect.y+forgeRect.height<=options.viewport.height+1,'Forge painting fully visible');await shot('forge-silent');
    await ship('forge','Cooling water and herbs');
    await puzzle('Workshop · Build a safe lantern',['Fit frame','Fit relief valve','Light safely']);
    await button('Talk to Xiaomao').click();
    await readForgeDialogue('forge:E-01');await scene('forge:E-02');
    await button('Recover the frame · 1/3').click();
    await button('Recover the old pipe · 2/3').waitFor();
    await shot('forge-workshop-clue');
    await page.reload();await page.locator('#intro-continue').click();await page.locator('#intro-slot-list [data-slot="slot1"]').click();
    await scene('forge:E-02');
    if(await button('Emberforge City').isVisible())await button('Emberforge City').click();
    await button('Recover the old pipe · 2/3').click();await button('Recover the relief valve · 3/3').waitFor();
    await button('Recover the relief valve · 3/3').click();await button('Safety blueprint').waitFor();
    await puzzle('Safety blueprint',['Frame','Pipes','Valve']);
    const forgeChoice=name==='portrait'?'Let Jinpo explain to the workers first':'Publish verified safety findings now';
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
    // The strongest lineup is not necessarily the bonded pair; choose the
    // explicit player-facing duo lineup control before the regional encounter.
    await page.locator('#bp-chosen-duo').click();
    await page.locator('#panel [data-battle-auto="true"]').click();await page.locator('#bp-go').click();
    await page.locator('#battle-ui.on').waitFor();try{await page.locator('#cb-forge-hud').waitFor();}catch(e){await shot('forge-boss-entry-failed');console.error('Forge entry failed',await page.evaluate(()=>({scene:__game.scene,story:__game.battle?.storyEncounter,forge:!!__game.battle?.forgeState,errors:document.getElementById('toasts')?.textContent})));throw e;}
    assert.equal(await page.evaluate(()=>__game.battle.forgeState.assist),name==='portrait'?'jinpo':'xiaomao');
    const forgeTutorial=page.locator('#battle-tutorial-skip');if(await forgeTutorial.isVisible())await forgeTutorial.click();
    await page.locator('#cb-forge-hud img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
    assert.equal(await page.locator('#btn-debug').isVisible(),false,'Hidden developer control must not consume the battle header');
    const headerClearance=await page.evaluate(()=>{
      const a=document.querySelector('.battle-enemy-summary').getBoundingClientRect(),b=document.querySelector('.battle-tools').getBoundingClientRect();
      return a.right<=b.left+1;
    });assert(headerClearance,'Enemy information and battle controls have independent header columns');
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
    await page.locator('[data-forge-retry]').click();await page.locator('#bp-chosen-duo').click();await page.locator('#bp-go').click();await page.locator('#battle-ui.on').waitFor();await page.locator('#cb-forge-hud').waitFor();
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
    // Real duo linkage: use the player's manual button when charged; otherwise let
    // natural auto-combat charge and cast. Do not write charge, HP, timers or saves.
    const duoButton=page.locator('#duo-burst');
    const duoBefore=await page.evaluate(()=>__game.battle.duoUses);
    const pair=await page.evaluate(()=>{
      const b=__game.battle;if(!b.duo)return null;
      return [b.duo.a.uid,b.duo.b.uid].map(uid=>({uid,species:b.team.find(f=>f.cat.uid===uid)?.cat.species}));
    });
    assert(pair?.length===2&&pair.every(c=>c.species),'The chosen pair must enter the regional encounter');
    // Observe the renderer actually installed by duo-bond.js. No combat mutations.
    await page.evaluate(()=>{
      const hero=CatBondDuoHero,original=hero.draw;
      window.__cbDuoEvidence={original,frames:[]};
      hero.draw=function(ctx,W,H,seq,lookup){
        const draw=CatArt.drawCat,seen=[];
        CatArt.drawCat=function(c,x,y,opts){const result=draw.call(this,c,x,y,opts);if(c===ctx)seen.push(opts?.species?.id);return result;};
        try{
          const result=original.call(this,ctx,W,H,seq,lookup);
          const p=(seq.max-seq.t)/seq.max;
          if(p>=.25&&p<=.8&&seen.length===2)window.__cbDuoEvidence.frames.push({uids:[...seq.actorUids||[]],seen,p});
          return result;
        }finally{CatArt.drawCat=draw;}
      };
    });
    try{
      if(await duoButton.isVisible()&&await duoButton.isEnabled())await duoButton.click();
      else if(!await page.evaluate(()=>__game.battle.autoMode))await page.locator('#btn-auto').click();
      await page.waitForFunction(({n,pair})=>{
        const b=__game.battle,v=b?.duoCinematic;
        if(!v||b.duoUses<=n)return false;
        const p=(v.max-v.t)/v.max;
        return p>=.25&&p<=.8&&window.__cbDuoEvidence.frames.some(f=>f.uids.length===2&&f.uids.every((uid,i)=>pair.find(c=>c.uid===uid)?.species===f.seen[i]));
      },{n:duoBefore,pair},{timeout:120000});
      await shot('forge-duo-actual-actors');
      console.log('REAL DUO CUTIN',JSON.stringify({pair,frames:await page.evaluate(()=>window.__cbDuoEvidence.frames)}));
      await page.waitForFunction(()=>{const b=__game.battle;return b&&!b.duoCinematic&&b.duoUses>0&&document.querySelector('#cb-forge-hud')?.dataset.cinematic==='false'});
    }finally{
      await page.evaluate(()=>{if(window.__cbDuoEvidence){CatBondDuoHero.draw=window.__cbDuoEvidence.original;delete window.__cbDuoEvidence;}});
    }
    if(!await page.evaluate(()=>__game.battle.autoMode))await page.locator('#btn-auto').click();
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
    for(const note of ['Flower bell · High','Starlight · Middle','Dew · Low'])await button(note,forgeMelody).click();
    await page.waitForTimeout(1800);await shot('forge-ceremony');await page.waitForTimeout(1300);await shot('forge-routing-reveal');await forgeMelody.waitFor({state:'hidden'});
    await readForgeDialogue('forge:E-04');
    await scene('sky:S-01');await shot('forge-restored');
    assert.deepEqual(await page.evaluate(()=>CatBondResonance.view().melodies),['harbor','forest','forge']);
    await ship('forge','Pumps and tools');await travel('Rootsleep Forest');await ship('forest','Pumps and tools');
    assert.deepEqual(await page.evaluate(()=>CatBondResonance.view().links['forest:forge']),['sendA','receiveB','sendB','receiveA']);
    await travel('Emberforge City');await ship('forge','Wind vanes and flight parts');
    await button('World atlas',page.locator('.rw-head')).click();
    assert.equal(await page.evaluate(()=>WorldMap.isUnlocked('sky')),true);
    await button('Skyspine Isles').waitFor();assert.equal(await button('Skyspine Isles').isEnabled(),true,'Chapter IV must be playable after Chapter III');
    await button('Resonance Book',page.locator('.rw-system-nav')).click();await page.locator('[data-book-tab="workshop"]').click();
    await page.locator('.workshop-row[data-id="st_forge"]').waitFor();
    await page.locator('[data-act="forge-tools"]').click();
    await page.getByText('Reinforced tools equipped · +25%',{exact:true}).waitFor();
    assert.equal(await page.evaluate(()=>Raising.stationsView().find(s=>s.id==='st_forge')?.reinforced),true);
    await shot('forge-workshop');await page.locator('#panel .panel-dismiss:visible,.rb-close:visible').first().click();
    await button('Resonance Book',page.locator('.rw-system-nav')).click();await page.locator('[data-book-tab="dex"]').click();await page.locator('#panel.open').waitFor();const record=page.locator('[data-dex-record="forge"]');await record.scrollIntoViewIfNeeded();await record.getByText('Furnace Guardian',{exact:true}).waitFor();await record.locator('img').evaluate(img=>img.decode());await shot('forge-catdex');await page.locator('#panel .panel-dismiss:visible,.rb-close:visible').first().click();
    await button('Resonance Book',page.locator('.rw-system-nav')).click();await page.locator('[data-book-tab="party"]').click();await page.locator('#map-squad-best').click();await page.locator('#map-squad-save').click();await page.locator('#panel.open').waitFor({state:'hidden'});
    if(fullCampaign){
    const protagonist=await page.evaluate(()=>({uid:State.S.cats[0].uid,species:State.S.cats[0].species}));
    await button('Skyspine Isles').click();await page.waitForFunction(()=>WorldMap.currentRegion==='sky');
    await page.locator('.rw-sky-region[data-art-ready="true"]').waitFor();await shot('sky-arrival');
    await ship('sky','Wind vanes and flight parts');
    async function skyDialogue(id,choice){
      const dlg=page.locator('.res-host[data-scene="'+id+'"]');await dlg.waitFor();
      let seen=0;
      for(;;){
        const line=await page.evaluate(expected=>{const v=CatBondResonance.view();return v.current?.id===expected&&v.lineReady?v.current.lines[v.cursor]:null},id);
        if(!line||!await dlg.isVisible())break;
        await page.waitForFunction(t=>document.querySelector('.res-host .res-line')?.textContent===t,line.text.en);
        if(['lingyu','yuanfan','muling'].includes(line.speaker))await dlg.locator('.res-portrait').evaluate(img=>img.decode());
        await changeDialogueLanguage();
        await page.waitForFunction(t=>document.querySelector('.res-host .res-line')?.textContent===t,line.text.zh);
        if(!seen)await shot(id.replace(':','-')+'-zh');
        await changeDialogueLanguage();
        await page.waitForFunction(t=>document.querySelector('.res-host .res-line')?.textContent===t,line.text.en);
        seen++;await dlg.locator('.res-line').click();
      }
      const expectedLines=await page.evaluate(id=>window.CatBondResonance.view().current?.id===id?window.CatBondResonance.view().current.lines.length:null,id);if(expectedLines!==null)assert.ok(seen<=expectedLines,id+' no extra dialogue lines');assert.ok(seen>0,id+' real dialogue observed');
      if(choice)await button(choice,dlg).click();
      if(await dlg.isVisible())await dlg.waitFor({state:'hidden'});
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
      await start(heights[0]);await shot('sky-flight-'+label.replaceAll(' ','-'));
      for(let i=1;i<=3;i++){await page.waitForFunction(g=>Number(document.querySelector('[data-sky-flight-status]')?.dataset.gates)===g,i,{timeout:18000});await move(i===3?.5:heights[i]);}
      await end();await status.waitFor({state:'hidden',timeout:20000});if(send)await send.detach();
    }
    await skyFlight('Catch the mail pouch · Practice gliding',[.65,.34,.64],true);
    await button('Talk to Yuanfan').click();await skyDialogue('sky:S-01');await scene('sky:S-02');
    const skyChoice=name==='portrait'?'Train on a joint route first':'Let Yuanfan lead';
    await skyFlight('Flight recorder',[.68,.29,.66]);await skyDialogue('sky:S-02',skyChoice);await scene('sky:S-03');
    await skyFlight('Joint gliding platform',[.29,.72,.31]);await skyDialogue('sky:S-03');
    await button('Isolated mail station · Deliver the pouch').click();await scene('sky:S-04');
    await button('Talk to Muling').click();await skyDialogue('sky:S-04','Sit with her for a while');await scene('sky:S-05');
    await skyFlight('Windwing sanctuary',[.67,.30,.64]);
    await button('Invite Lingyu').click();await button('Invite Lingyu').waitFor({state:'hidden'});
    await page.reload();await page.locator('#intro-continue').click();await page.locator('#intro-slot-list [data-slot="slot1"]').click();await scene('sky:S-05');
    if(await button('Skyspine Isles').isVisible())await button('Skyspine Isles').click();
    assert.equal(await button('Invite Lingyu').count(),0);
    await button('Invite Yuanfan').click();await button('Invite Yuanfan').waitFor({state:'hidden'});
    await button('Open Sky').click();const skyMelody=page.locator('.rw-puzzle-controls');await skyMelody.waitFor();
    for(const note of ['Starlight · Middle','Flower bell · High','Dew · Low'])await button(note,skyMelody).click();
    await page.waitForTimeout(850);await shot('sky-open-sky-ceremony');await skyMelody.waitFor({state:'hidden'});
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
    await page.locator('#btn-auto').click();if(await page.locator('#battle-tutorial-skip').isVisible())await page.locator('#battle-tutorial-skip').click();
    if(options.hasTouch){const battle=page.locator('#battle-ui');const rect=await battle.boundingBox();await page.touchscreen.tap(rect.x+rect.width*.6,rect.y+rect.height*.5);}else{await page.keyboard.down('d');await page.waitForTimeout(350);await page.keyboard.up('d');}
    await shot('sky-battle-manual');await page.locator('#btn-auto').click();
    await page.waitForFunction(()=>__game.scene==='map',null,{timeout:200000});await page.locator('#cr-ok,#battle-recovery-ok').waitFor();await shot('sky-natural-battle-result');const skyWon=await page.locator('#cr-ok').isVisible();assert.equal(await page.evaluate(()=>State.S.catchCount),catchBefore+(skyWon?1:0));if(!skyWon)await page.getByText('Squad defeated in the gale',{exact:true}).waitFor();await page.locator('#cr-ok,#battle-recovery-ok').click();

    await ship('sky','Courier route');await travel('Moonmirror Library');await scene('library:M-01');
    await page.locator('.rw-library-region[data-art-ready="true"]').waitFor();await shot('library-arrival');
    await ship('library','Courier route');
    async function archiveDialogue(id,choice){
      const dlg=page.locator('.res-host[data-scene="'+id+'"]');await dlg.waitFor();
      const initial=await page.evaluate(()=>{const v=CatBondResonance.view();return {cursor:v.cursor,length:v.current.lines.length}});
      let seen=0;
      for(;;){
        const v=await page.evaluate(()=>CatBondResonance.view());
        if(v.current?.id!==id||!v.lineReady||v.cursor>=v.current.lines.length)break;
        const line=v.current.lines[v.cursor];
        await page.waitForFunction(t=>document.querySelector('.res-host .res-line')?.textContent===t,line.text.en);
        if(['library:M-03','library:M-04','library:M-05'].includes(id)){
          const stage=dlg.locator('.library-reveal-stage[data-ready="true"]');await stage.waitFor();
          const painting=dlg.locator('.library-reveal-painting.is-current');await painting.waitFor();await painting.evaluate(img=>img.decode());
          const expectsPlayer=id==='library:M-03'||id==='library:M-04'&&v.cursor>=2||id==='library:M-05'&&v.cursor>=3;
          if(expectsPlayer){const actor=stage.locator('[data-actor="player"]');await actor.waitFor();await actor.evaluate(img=>img.decode());assert.equal(await actor.getAttribute('data-species'),protagonist.species);assert.equal(await actor.getAttribute('data-cat-uid'),protagonist.uid);}
          if(seen===0||v.cursor===initial.length-1)await shot(id.replace(':','-')+'-shot-'+v.cursor);
        }
        await changeDialogueLanguage();await page.waitForFunction(t=>document.querySelector('.res-host .res-line')?.textContent===t,line.text.zh);
        await changeDialogueLanguage();await page.waitForFunction(t=>document.querySelector('.res-host .res-line')?.textContent===t,line.text.en);
        seen++;await dlg.locator('.res-line').click();
      }
      assert.equal(seen,initial.length-initial.cursor,id+' canonical lines observed');
      if(choice){await button(choice,dlg).click();await page.waitForFunction(id=>CatBondResonance.view().current?.id!==id||!!CatBondResonance.view().choice,id);}
      if(await dlg.isVisible())await dlg.waitFor({state:'hidden'});
    }
    await button('Talk to Baikan').click();
    await puzzle('Sealed archive · Review records',['Public history','Living subjects','Seal notice']);
    await archiveDialogue('library:M-01','Let affected families review personal records first');await scene('library:M-02');
    await puzzle('Ground floor · Reflection gallery',['West mirror','Middle mirror','Middle mirror','Middle mirror','East mirror','East mirror']);
    await puzzle('Upper floor · Sealed mural',['Fallen star','Broken tongue','Emergency anchor']);
    await button('Hidden room · Verify memories').click();const echoControls=page.locator('.rw-puzzle-controls');await echoControls.waitFor();
    await button('Inspect Catdex',echoControls).click();await page.locator('#panel.open').waitFor();const memoryCard=page.locator('[data-library-catdex-memory]');await memoryCard.scrollIntoViewIfNeeded();const interval=await memoryCard.getAttribute('data-library-catdex-memory');assert.match(interval,/^\d+\.\d{2}$/);assert.match(await memoryCard.innerText(),new RegExp(interval.replace('.','\\.')+'s'));await shot('library-catdex-inspection');await page.locator('#panel .rb-close:visible,#panel .panel-dismiss:visible').first().click();await page.locator('#panel.open').waitFor({state:'hidden'});
    await echoControls.waitFor();await checkObjective('puzzle:library-echo');const clue=await echoControls.locator('[data-library-memory]').textContent();assert(!clue.includes(interval+'s'),'The puzzle must not expose the Catdex answer');
    const echoes=echoControls.getByRole('button',{name:/^Echo [ABC] · /});const labels=await echoes.allTextContents();assert.equal(labels.length,3);
    const correct=labels.find(t=>t.endsWith(interval+'s'));assert(correct);await button(labels.find(t=>t!==correct),echoControls).click();await echoControls.locator('[data-library-mismatch]').waitFor();await checkObjective('puzzle:library-echo');await shot('library-incorrect-memory');await button(correct,echoControls).click();await echoControls.waitFor({state:'hidden'});
    const libraryCaught=await page.evaluate(()=>State.S.catchCount);
    async function enterArchiveBattle(){await button('Archive echo · Guardian illusion').click();await page.locator('#panel [data-battle-auto="true"]').click();await page.locator('#bp-go').click();await page.locator('#battle-ui.on').waitFor();await page.waitForFunction(()=>!!__game.battle?.libraryEncounter);if(await page.locator('#battle-tutorial-skip').isVisible())await page.locator('#battle-tutorial-skip').click();}
    await enterArchiveBattle();await shot('library-echo-battle');await page.locator('#btn-flee').click();await page.waitForFunction(()=>__game.scene==='map');await page.getByText('Retreated from the archive echo',{exact:true}).waitFor();assert(await page.evaluate(()=>CatBondResonance.view().objective.includes('battle:library-echo')));await shot('library-echo-retreat');
    await page.locator('#library-retry-encounter').click();await page.locator('#panel [data-battle-auto="true"]').click();await page.locator('#bp-go').click();await page.locator('#battle-ui.on').waitFor();await page.waitForFunction(()=>!!__game.battle?.libraryEncounter);if(await page.locator('#battle-tutorial-skip').isVisible())await page.locator('#battle-tutorial-skip').click();
    await page.locator('#btn-auto').click();await shot('library-echo-manual');if(options.hasTouch){const rect=await page.locator('#battle-ui').boundingBox();await page.touchscreen.tap(rect.x+rect.width*.6,rect.y+rect.height*.5);}else{await page.keyboard.down('d');await page.waitForTimeout(350);await page.keyboard.up('d');}await page.locator('#btn-auto').click();
    await page.waitForFunction(()=>__game.scene==='map',null,{timeout:200000});await page.getByText('Archive echo defeated',{exact:true}).waitFor();await shot('library-echo-victory');await page.locator('#library-battle-ok').click();await scene('library:M-03');assert.equal(await page.evaluate(()=>State.S.catchCount),libraryCaught);
    await button('Talk to Muling').click();await archiveDialogue('library:M-03','I feel hurt');await scene('library:M-04');
    await puzzle('Hidden ledger · Resonance routes',['Original routes','Seal loosened','Inward routing']);
    await archiveDialogue('library:M-04',name==='desktop'?"I'm angry":name==='portrait'?'I need some distance':"I want to understand, but it doesn't change what you did");await scene('library:M-05');
    await button('Talk to Moye').click();await puzzle('Six-region model · Compare the two routes',['Converge inward','Connect neighbors','Receive distinct replies']);await archiveDialogue('library:M-05');
    assert.equal(await page.evaluate(()=>CatBondResonance.isMulingFollowing()),false);
    await puzzle('Moonmirror sanctuary',['Moon window','Neighbor bridge','Reciprocal reply']);
    await button('Invite Moye').click();await button('Invite Moye').waitFor({state:'hidden'});
    await page.reload();await page.locator('#intro-continue').click();await page.locator('#intro-slot-list [data-slot="slot1"]').click();await scene('library:M-05');
    if(await button('Moonmirror Library').isVisible())await button('Moonmirror Library').click();
    assert.equal(await button('Invite Moye').count(),0);await button('Invite Baikan').click();await button('Invite Baikan').waitFor({state:'hidden'});
    await button('Reflections').click();const libraryMelody=page.locator('.rw-puzzle-controls');await libraryMelody.waitFor();
    for(const note of ['Flower bell · High','Dew · Low','Starlight · Middle'])await button(note,libraryMelody).click();
    await page.waitForTimeout(950);await shot('library-reflections-ceremony');await libraryMelody.waitFor({state:'hidden'});
    await page.waitForFunction(()=>CatBondResonance.view().completed.includes('library:M-05'));
    assert.deepEqual(await page.evaluate(()=>CatBondResonance.view().melodies),['harbor','forest','forge','sky','library']);
    assert.equal(await page.evaluate(()=>WorldMap.isUnlocked('starfall')),true);assert.equal(await page.evaluate(()=>CatBondResonance.isMulingFollowing()),false);
    await ship('library','Archived flight maps');await travel('Skyspine Isles');await ship('sky','Archived flight maps');
    assert.deepEqual(await page.evaluate(()=>CatBondResonance.view().links['sky:library']),['sendA','receiveB','sendB','receiveA']);
    await travel('Moonmirror Library');await ship('library','Star chart and coordinates');await button('World atlas',page.locator('.rw-head')).click();
    await button('Resonance Book',page.locator('.rw-system-nav')).click();await page.locator('[data-book-tab="dex"]').click();await page.getByText('Moonmirror archive',{exact:true}).waitFor();const archive=page.getByText('Moonmirror archive',{exact:true}).locator('xpath=ancestor::section');assert.match(await archive.innerText(),new RegExp(interval.replace('.','\\.')+'s'),'The verified echo survives combat and reload');await shot('library-catdex-complete');await page.locator('#panel .rb-close:visible,#panel .panel-dismiss:visible').first().click();await page.locator('#panel.open').waitFor({state:'hidden'});
    assert.equal(await button('Starfall Expanse').isEnabled(),true);await shot('library-unlock');await button('Starfall Expanse').click();await page.waitForFunction(()=>WorldMap.currentRegion==='starfall'&&CatBondResonance.view().current?.id==='starfall:F-01');await ship('starfall','Star chart and coordinates');await shot('library-to-starfall');

    const starfall=await playStarfallFromForge({page,button,scene,shot,puzzle,readDialogue,travel,ship,profile:name,startAtStarfall:true,continueFinale:true});
    const finale=await continueToFinale({page,context,options,name,button,scene,shot,puzzle,travel,ship,skyFlight,startAtFinale:true});
    assert.deepEqual(errors,[]);results.push({profile:name,captured,forestComplete:true,forgeComplete:true,skyComplete:true,libraryComplete:true,starfall,finale});await context.close();continue;
    }
    await button('Sunlit Garden',page.locator('.rw-head')).click();await page.waitForFunction(()=>__game.scene==='yard');assert(await page.evaluate(()=>GardenProjects.progress().find(p=>p.id==='forge')?.unlocked));await shot('forge-garden-restoration');await page.locator('#map-menu').click();await page.locator('#cb-system-menu [data-system="yard-map"]').click();await button('Rootsleep Forest').click();
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
    assert.deepEqual(slotIsolation,{newSlot:{different:true,mode:'map',location:null,forge:false,oldDetached:true,puzzle:false},melodies:['harbor','forest','forge'],slot:'slot1'});
    assert.deepEqual(errors,[]);
    results.push({profile:name, captured, ...state, forestComplete:true,forgeComplete:true,forgeDuoActualActors:true,audio:audioEvidence});
    await context.close();
  }
} finally {
  await fs.writeFile(out+'/results.json',JSON.stringify(results,null,2));
  await browser.close();
}
