// Cat Bond scale and control-size regression. Real browser dimensions:
 // 390px phone, compact 844x390 touch landscape, and desktop.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const origin=process.env.MOBILE_PLAYTEST_ORIGIN||'http://127.0.0.1:8765';
const browser=await chromium.launch({headless:true});
const specs=[
 {name:'phone-portrait',width:390,height:844,touch:true},
 {name:'phone-landscape',width:844,height:390,touch:true},
 {name:'desktop',width:1180,height:760,touch:false}
];
const problems=[];
try{
 for(const spec of specs){
  const context=await browser.newContext({
    viewport:{width:spec.width,height:spec.height},
    isMobile:spec.touch,hasTouch:spec.touch,deviceScaleFactor:spec.touch?2:1
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.goto(origin+'/cat-bond/?lang=zh',{waitUntil:'domcontentloaded'});
   await page.locator('#intro-start').click();
   await page.locator('#panel.open .dex-cell').first().click();
   await page.evaluate(()=>{
    const g=window.__game;
    g.scene='map';g.keys={};
    WorldMap.onEncounter(()=>{});WorldMap.enterRegion('sakura');
   });
   const mapStats=await page.evaluate(()=>{
    const g=window.__game,calls=[];
    const old=window.CatMotion.draw,real=window.CatArt.drawCat,actual=[];
    window.CatMotion.draw=function(ctx,x,y,o){
     calls.push({species:o.species?.id,scale:o.scale,x,y});
     return old.apply(this,arguments);
    };
    window.CatArt.drawCat=function(ctx,x,y,o){
      actual.push(o.scale);return real.apply(this,arguments);
    };
    WorldMap.draw(g.ctx);
    window.CatMotion.draw=old;window.CatArt.drawCat=real;
    const scales=calls.map(q=>q.scale);
    return {count:calls.length,actualLead:actual.at(-1),
      actualWild:actual.slice(0,-1),
      lead:scales.at(-1),wild:scales.slice(0,-1),
      x:WorldMap.view.px,y:WorldMap.view.py,
      canvasWidth:g.W,canvasHeight:g.H};
   });
   assert.ok(mapStats.lead>=.95&&mapStats.lead<=1,
      'Map lead must be proportionate and visible: '+JSON.stringify(mapStats));
   assert.ok(mapStats.wild.length>=1&&mapStats.wild.every(s=>s>.70&&s<=1),
      'Wild cats must remain distinguishable from environment');
   const battleStats=await page.evaluate(()=>{
    const g=window.__game;
    State.S.cats.push(State.makeCat('doudou',{affinity:50}));
    State.S.cats.push(State.makeCat('xiaohui',{affinity:50}));
    State.S.battlePrefs={...(State.S.battlePrefs||{}),
     manualTutorialSeen:true,tutorialSeen:true,autoBattle:false};
    g.startBattle(State.S.cats.slice(0,3),GameData.speciesById('moqiu'));
    const b=g.battle;
    const canv=[],actual=[];
    const original=window.CatMotion.draw,actualRender=window.CatArt.drawCat;
    window.CatMotion.draw=function(ctx,x,y,o){
      canv.push({species:o.species?.id,scale:o.scale,x,y});return original.apply(this,arguments)
    };
    window.CatArt.drawCat=function(ctx,x,y,o){
      actual.push(o.scale);return actualRender.apply(this,arguments)
    };
    g.draw();
    window.CatMotion.draw=original;window.CatArt.drawCat=actualRender;
    const rect=(id)=>{let el=document.getElementById(id);if(!el)return null;
      let b=el.getBoundingClientRect();return {x:b.left,y:b.top,w:b.width,h:b.height}};
    const skillBtns=[...document.querySelectorAll('.move-bar .move')].filter(el=>getComputedStyle(el).display!=='none');
    return {roleScales:{active:b.catScale('active'),ally:b.catScale('ally'),enemy:b.catScale('enemy')},
      renderedScales:canv.map(o=>o.scale),actualScales:actual,actualMax:Math.max(...actual),
      buttons:skillBtns.map(el=>({id:el.id,w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height})),
      benchOpen:document.getElementById('bench-slots')?.classList.contains('is-open'),
      benchLabel:rect('bench-slots'),
      team:rect('team-slots'),joystick:rect('battle-touch-joystick'),
      stage:rect('stage'),canvas:rect('scene'),totalTeam:b.team.length,reserve:b.reserve.length};
   });
   assert.ok(battleStats.roleScales.active>=.78,
     'Active fighter must be larger than the old tiny 0.50 scale');
   assert.ok(battleStats.roleScales.enemy>=.68,
     'Wild battle kittens must be visually readable');
   assert.ok(battleStats.roleScales.active>battleStats.roleScales.ally,
     'Players must be able to distinguish the controlled kitten');
   assert.ok(battleStats.renderedScales.some(s=>s>=battleStats.roleScales.active-.01),
     'The real canvas must receive the new scale');
   assert.ok(battleStats.actualMax>=mapStats.actualLead*.94,
     'Rendered battle hero must be comparable in size to the rendered map hero: '+
       JSON.stringify({map:mapStats.actualLead,battle:battleStats.actualMax}));
   assert.ok(battleStats.actualScales.every(s=>s>=mapStats.actualWild[0]*.88),
     'Final painted combat bodies should not shrink dramatically versus map cats');
   if(spec.touch){
    const threshold=spec.height<470?47:49;
    assert.ok(battleStats.buttons.every(btn=>btn.w>=threshold&&btn.h>=threshold),
      'Every skill must have finger-sized width and height: '+JSON.stringify(battleStats.buttons));
   }
   if(spec.touch&&spec.height<470){
    assert.equal(battleStats.benchOpen,false,
      'Reserves must start collapsed on compact landscape to keep the fighter visible');
    await page.locator('#bench-slots .bench-caption').click();
    assert.equal(await page.locator('#bench-slots').evaluate(el=>el.classList.contains('is-open')),
      true,'Tap must expand substitutes');
    await page.locator('#bench-slots .bench-caption').click();
    assert.equal(await page.locator('#bench-slots').evaluate(el=>el.classList.contains('is-open')),
      false,'Second tap must collapse substitutes');
   }
   const minDims=spec.touch?{w:48,h:48}:{w:0,h:0};
   await page.screenshot({path:'/tmp/cat-bond-scale-'+spec.name+'.png'});
   console.log('CAT BOND SIZE PASS '+spec.name+' '+JSON.stringify({map:mapStats,battle:battleStats}));
   assert.deepEqual(errors,[],'Page runtime errors');
  }catch(e){problems.push(spec.name+': '+e.message);console.error('CAT BOND SIZE FAIL '+problems.at(-1))}
  finally{await context.close()}
 }
}finally{await browser.close()}
if(problems.length){console.error(problems.join('\n'));process.exitCode=1}
