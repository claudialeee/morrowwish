// Cat Bond scale and control-size regression. Real browser dimensions:
 // 390px phone, compact 844x390 touch landscape, and desktop.
import assert from 'node:assert/strict';
import {startNewAdventure,continueSavedAdventure} from './cat-bond-test-start.mjs';
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
   await startNewAdventure(page);
   await page.evaluate(()=>{
    const g=window.__game;
    g.keys={};
    // Follow the REAL map navigation: it hides yard chrome and enables
    // cb-exploring before entering the region. A direct scene assignment
    // would produce a false screenshot with garden buttons covering the map.
    g.openWorldMap();UI.closeAll();
    WorldMap.onEncounter(()=>{});
    // A new save has NOT explored 40% of home, so sakura is correctly locked.
    // Exercise the genuinely unlocked home expedition rather than bypassing
    // progression or reading a null WorldMap.view after rejected entry.
    if(!WorldMap.enterRegion('home'))throw Error('Starter expedition home is locked');
    if(!WorldMap.view)throw Error('Starter expedition did not create a playable region');
   });
   const oldGardenNotices=await page.locator('#toasts .toast').allTextContents();
   assert.ok(!oldGardenNotices.some(t=>/院子里|草丛里|庭院|sneaking|hiding in the yard/i.test(t)),
      'Garden-specific toasts must not obscure the map after entering: '+JSON.stringify(oldGardenNotices));
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
      canvasWidth:g.W,canvasHeight:g.H,
      mapNav:['map-index','map-squad'].map(id=>{
        const el=document.getElementById(id);
        return {id,visible:!!el&&getComputedStyle(el).display!=='none'};
      }),
      sharedMapMenu:!!document.getElementById('map-menu')&&
        !document.getElementById('map-menu').hidden&&
        getComputedStyle(document.getElementById('map-menu')).display!=='none',
      leakedYardUi:['hud','tabbar','yard-actions','first-quest','collection-goal','yard-duo-status','yard-surprise']
       .filter(id=>{const el=document.getElementById(id);return el&&getComputedStyle(el).display!=='none'&&
         el.getBoundingClientRect().width>0&&el.getBoundingClientRect().height>0;})};
   });
   assert.ok(mapStats.lead>=.95&&mapStats.lead<=1,
      'Map lead must be proportionate and visible: '+JSON.stringify(mapStats));
   assert.ok(mapStats.wild.length>=1&&mapStats.wild.every(s=>s>.70&&s<=1),
      'Wild cats must remain distinguishable from environment');
   assert.deepEqual(mapStats.leakedYardUi,[],
      'Yard-only buttons/prompts must not obscure exploration: '+JSON.stringify(mapStats.leakedYardUi));
   assert.ok(mapStats.mapNav.every(x=>!x.visible),
     'Legacy world/squad buttons must stay hidden; both moved to shared Menu: '+JSON.stringify(mapStats.mapNav));
   assert.equal(mapStats.sharedMapMenu,true,'Map management remains accessible through top-right Menu');
   await page.screenshot({path:'/tmp/cat-bond-scale-'+spec.name+'-map.png'});
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
      stage:rect('stage'),canvas:rect('scene'),totalTeam:b.team.length,reserve:b.reserve.length,
      cooldownBadges:[...document.querySelectorAll('#battle-ui .move .cd')]
       .map(el=>({width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height}))};
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
   assert.ok(battleStats.cooldownBadges.every(b=>b.height<=22&&b.width<=47),
     'Cooldown badge must never cover the skill icon and full button');
   if(spec.touch){
    const threshold=spec.height<470?47:49;
    assert.ok(battleStats.buttons.every(btn=>btn.w>=threshold&&btn.h>=threshold),
      'Every skill must have finger-sized width and height: '+JSON.stringify(battleStats.buttons));
   }
   if(spec.touch&&spec.height<470){
    // Real pointer targeting is essential: a visible bench button is not
    // playable if the floating skill-help button steals its touch events.
    // Do not force the click or use DOM dispatch (both conceal the bug).
    const tapTargets=await page.evaluate(()=>{
      const bench=document.querySelector('#bench-slots .bench-caption');
      const help=document.querySelector('#battle-skill-info-toggle');
      const b=bench?.getBoundingClientRect(),h=help?.getBoundingClientRect();
      const overlap=b&&h&&getComputedStyle(help).display!=='none'&&
        b.left<h.right&&h.left<b.right&&b.top<h.bottom&&h.top<b.bottom;
      const center=b?document.elementFromPoint(b.left+b.width/2,b.top+b.height/2):null;
      return {bench:b?{x:b.x,y:b.y,w:b.width,h:b.height}:null,
        help:h?{x:h.x,y:h.y,w:h.width,h:h.height}:null,
        overlap:!!overlap,hit:center?.id||center?.className||center?.tagName};
    });
    assert.ok(!tapTargets.overlap,
      'Skill-help must not cover the reserve bench tap region: '+JSON.stringify(tapTargets));
    assert.ok(/bench-caption/.test(String(tapTargets.hit)),
      'Bench center must receive the actual pointer: '+JSON.stringify(tapTargets));
    await page.screenshot({path:'/tmp/cat-bond-scale-'+spec.name+'-touch-targets.png'});
    assert.equal(battleStats.benchOpen,false,
      'Reserves must start collapsed on compact landscape to keep the fighter visible');
    await page.locator('#bench-slots .bench-caption').click({timeout:7000});
    assert.equal(await page.locator('#bench-slots').evaluate(el=>el.classList.contains('is-open')),
      true,'Tap must expand substitutes');
    await page.locator('#bench-slots .bench-caption').click({timeout:7000});
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
