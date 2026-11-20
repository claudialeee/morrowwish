import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const origin=process.env.MOBILE_PLAYTEST_ORIGIN||'http://127.0.0.1:8765';
const games=[
  {slug:'pawsibly-innocent',title:'Cat stealth'},
  {slug:'elsewhere',title:'Elsewhere'},
  {slug:'tiny-town',title:'Tiny Town'},
  {slug:'flip-dash',title:'Flip Dash'},
  {slug:'parcel-panic',title:'Parcel Panic'},
  {slug:'pocket-aquarium',title:'Pocket Aquarium'}
];
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
          const positions=await page.evaluate(()=>{const t=document.querySelector('#tool').getBoundingClientRect(),b=document.querySelector('#board').getBoundingClientRect();return{toolBottom:t.bottom,boardTop:b.top,toolH:t.height};});
          assert.ok(positions.toolBottom<positions.boardTop,'Yarn button must appear above board');
          assert.ok(positions.toolH>=44,'Yarn button touch target too small');
          await button.tap();
          const yarn=await page.evaluate(()=>window.__PAWSIBLY_TEST__?.getState()?.yarn);
          assert.equal(yarn,0,'Tapping yarn button must throw the starting yarn');
        }else if(game.slug==='elsewhere'){
          const start=page.locator('[data-random-world]').first();
          assert.equal(await start.isVisible(),true,'Story start not visible');
          await start.tap();
          assert.equal(await page.locator('#play-view').isVisible(),true,'Story did not open on tap');
        }else if(game.slug==='tiny-town'){
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
else console.log('All six Morrow Wish games passed 390px and 320px phone checks (plus touch gameplay at 390px).');
