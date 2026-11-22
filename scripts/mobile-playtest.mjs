import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const origin=process.env.MOBILE_PLAYTEST_ORIGIN||'http://127.0.0.1:8765';
const gamesAll=[
  {slug:'pawsibly-innocent',title:'Cat stealth'},
  {slug:'elsewhere',title:'Elsewhere'},
  {slug:'tiny-town',title:'Tiny Town'},
  {slug:'flip-dash',title:'Flip Dash'},
  {slug:'parcel-panic',title:'Parcel Panic'},
  {slug:'pocket-aquarium',title:'Pocket Aquarium'}
];
const games=process.env.GAME_TEST_SCOPE?gamesAll.filter(g=>g.slug===process.env.GAME_TEST_SCOPE):gamesAll;
if(!games.length)throw new Error('Unknown GAME_TEST_SCOPE');
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
let failures=[];
try{
  for(const width of [390,320]){
    for(const game of games){
      const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
      const page=await context.newPage();
      await page.route('**/api/session',route=>route.fulfill({status:204,body:''}));
      const errs=[];page.on('pageerror',e=>errs.push(e.message));
      try{
        await page.goto(origin+'/'+game.slug+'/',{waitUntil:'domcontentloaded',timeout:30000});
        await page.waitForTimeout(170);
        const metrics=await page.evaluate(()=>{
          const root=document.documentElement;
          return{width:root.clientWidth,scrollWidth:root.scrollWidth,
            h:document.body.scrollHeight,buttons:[...document.querySelectorAll('button')].filter(b=>b.getBoundingClientRect().width>0).length};
        });
        console.log('MOBILE '+game.slug+' '+width+'px: '+JSON.stringify(metrics));
        if(metrics.scrollWidth>metrics.width+3){
          const offenders=await page.evaluate(()=>[...document.body.querySelectorAll('*')].map(e=>({element:e.tagName.toLowerCase()+(e.id?'#'+e.id:e.className&&typeof e.className==='string'?'.'+e.className.replace(/\\s+/g,'.'):''),
            left:Math.round(e.getBoundingClientRect().left),right:Math.round(e.getBoundingClientRect().right),width:Math.round(e.getBoundingClientRect().width)}))
            .filter(e=>e.right>document.documentElement.clientWidth+3||e.left< -3)
            .sort((a,b)=>b.right-a.right).slice(0,12));
          console.log('MOBILE OVERFLOW ELEMENTS '+game.slug+' '+width+': '+JSON.stringify(offenders));
        }
        assert.ok(metrics.scrollWidth<=metrics.width+3,game.slug+' has horizontal overflow at '+width+'px: '+JSON.stringify(metrics));
        assert.ok(metrics.buttons>0,game.slug+' has no usable buttons');
        if(game.slug==='pawsibly-innocent'){
          assert.equal(await page.locator('#gameMenu').isVisible(),false,'Cat game should start with only the playfield');
          await page.locator('#menuButton').tap();
          await page.locator('[data-game-tab="help"]').tap();
        }
        const dock=page.locator('#mw-audio-dock');
        assert.equal(await dock.count(),1,game.slug+' missing unified audio controls');
        assert.equal(await dock.locator('button').count(),2,game.slug+' should offer music and sound switches');
        const audioBox=await dock.boundingBox();
        assert.ok(audioBox&&audioBox.x>=-2&&audioBox.x+audioBox.width<=width+2,game.slug+' audio controls overflow the phone');
         if(game.slug==='pawsibly-innocent'){
           assert.equal(await dock.evaluate(el=>el.closest('#stageControls')!==null),true,'Cat music and sound controls must live in the VISIBLE game header');
           const bounds=await dock.locator('button').evaluateAll(items=>items.map(el=>{const r=el.getBoundingClientRect();return{left:r.left,right:r.right,width:r.width,height:r.height,visible:r.width>0&&r.height>0}}));
           assert.ok(bounds.every(b=>b.visible&&b.left>=-2&&b.right<=width+2&&b.width>=38&&b.height>=40),
             'Both cat audio controls must be visible and tap-sized inside the mobile viewport: '+JSON.stringify(bounds));
         }
        if(game.slug==='pawsibly-innocent'){
          await page.locator('#menuClose').tap();
          const sound=page.locator('#stageControls #sound');
          const wasPressed=await sound.getAttribute('aria-pressed');
          await sound.tap();
          assert.notEqual(await sound.getAttribute('aria-pressed'),wasPressed,'Visible mobile sound button should toggle');
          await sound.tap();
          assert.equal(await sound.getAttribute('aria-pressed'),wasPressed,'Mobile sound button should restore');
          const music=page.locator('#stageControls #music');
          const musicPressed=await music.getAttribute('aria-pressed');
          await music.tap();
          assert.notEqual(await music.getAttribute('aria-pressed'),musicPressed,'Visible mobile music button should toggle');
          await music.tap();
          assert.equal(await music.getAttribute('aria-pressed'),musicPressed,'Mobile music button should restore');
         }
        if(width!==390)continue;
        if(game.slug==='flip-dash'||game.slug==='parcel-panic'){
          const play=page.locator('#play-btn');assert.equal(await play.isVisible(),true,'PLAY NOW clipped');
          await play.tap();assert.equal(await page.locator('#overlay').isVisible(),false,'Game did not start');
          if(game.slug==='flip-dash'){
            await page.locator('#game').tap({position:{x:100,y:60}});
            assert.equal(await page.locator('#status').isVisible(),true);
          }else{
            await page.waitForTimeout(650);
            const canvas=page.locator('#game');
            const b=await canvas.boundingBox();
            await page.touchscreen.tap(b.x+b.width*190/960,b.y+b.height*430/540);
            await page.waitForTimeout(80);
            assert.ok(Number(await page.locator('#score').textContent())>0,'Tap lane did not sort parcel');
          }
        }else if(game.slug==='pocket-aquarium'){
          await page.locator('#zh').tap();
          assert.equal(await page.locator('.heading h1').textContent(),'口袋水族馆','Chinese aquarium title missing');
          assert.match(await page.title(),/口袋水族馆/,'Aquarium tab title must be localized');
          await page.locator('#start').tap();
          assert.equal(await page.locator('#overlay').isVisible(),false);
          await page.locator('.food').nth(1).tap();
          const stockBefore=await page.locator('#stock').textContent();
          await page.locator('#sea').tap({position:{x:100,y:130}});
          const stockAfter=await page.locator('#stock').textContent();
          assert.notEqual(stockBefore,stockAfter,'Tap did not feed fish');
        }else if(game.slug==='pawsibly-innocent'){
          const button=page.locator('#tool');
          assert.ok(await button.isVisible(),'Yarn action not visible');
          const positions=await page.evaluate(()=>{const t=document.querySelector('#tool').getBoundingClientRect(),b=document.querySelector('#board').getBoundingClientRect();return{toolTop:t.top,toolBottom:t.bottom,boardTop:b.top,boardBottom:b.bottom,toolH:t.height};});
          assert.ok(positions.toolBottom<=positions.boardTop+2,'Yarn action must be completely ABOVE the map without covering a tile');
          assert.ok(positions.toolH>=44,'Yarn button touch target too small');
          await button.tap();
          assert.equal(await page.evaluate(()=>window.__PAWSIBLY_TEST__?.isAiming()),true,'Tapping the yarn button must enter aiming mode');
          const board=page.locator('#board');
          const b=await board.boundingBox();
          await board.tap({position:{x:b.width*8.5/10,y:b.height*1.5/7}});
          const inFlight=await page.evaluate(()=>{const s=window.__PAWSIBLY_TEST__?.getState();return{yarn:s?.yarn,mode:s?.guardMode,walking:s?.yarnAnimating,noise:s?.noise};});
          assert.equal(inFlight.yarn,0,'Tapping the desired landing tile must throw the starting yarn');
          assert.deepEqual(inFlight.noise,{x:8,y:1},'The yarn must land at the tapped tile');
          assert.equal(inFlight.mode,'investigate','The owner must visibly start investigating the yarn');
          assert.equal(inFlight.walking,true,'A long yarn throw must launch an animated pursuit');
          await page.waitForFunction(()=>!window.__PAWSIBLY_TEST__.isChasing(),null,{timeout:6000});
          const owner=await page.evaluate(()=>{const s=window.__PAWSIBLY_TEST__.getState();return{pos:s.human,mode:s.guardMode,turns:s.distractionTurns};});
          assert.deepEqual(owner.pos,{x:8,y:1},'Owner must reach yarn even on a touch screen');
          assert.equal(owner.mode,'distracted','Yarn must create a real safe opening');
          assert.equal(owner.turns,4,'Four distracted turns should remain');
          assert.equal(await page.locator('[data-move]').count(),0,'On-screen D-pad should be removed');
        }else if(game.slug==='elsewhere'){
          assert.equal(await page.locator('#narrate-voice').count(),0,'Duplicate browser voice selector should not appear');
          const start=page.locator('[data-random-world]').first();
          assert.equal(await start.isVisible(),true,'Story start not visible');
          await start.tap();
          assert.equal(await page.locator('#play-view').isVisible(),true,'Story did not open on tap');
          assert.ok((await page.locator('#narration-text').textContent()).trim().length>75,'Story narrative must show full paragraphs, not a stray character');
          assert.equal(await page.locator('#narrate-btn').isVisible(),true,'Curated read-aloud action unavailable');
        }else if(game.slug==='tiny-town'){
          assert.equal(await page.locator('#incoming .tt-painted-newcomer svg').count(),4,'Four incoming residents need visible portraits');
          assert.ok(await page.locator('#board .tile').count()===16,'Town map unavailable');
          const choices=page.locator('#cards .choice');
          assert.ok(await choices.count()>0,'No venue choices on mobile');
          await choices.first().tap();
          assert.ok(await page.locator('#board .tile.awPlaceable').count()>0,'No buildable tiles after tapping a venue');
        }
        assert.deepEqual(errs,[],'Uncaught JavaScript errors: '+errs.join(' | '));
      }catch(e){
        failures.push(game.slug+' '+width+'px: '+e.message);
        console.error('MOBILE FAIL',failures.at(-1));
      }finally{await context.close();}
    }
  }
}finally{await browser.close();}
if(failures.length){console.error('\nMobile check failures:\n'+failures.join('\n'));process.exitCode=1;}
else console.log((process.env.GAME_TEST_SCOPE||'All six Morrow Wish games')+' passed 390px and 320px phone checks (plus touch gameplay at 390px).');
