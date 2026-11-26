// Isolated real runtime APIs on synthetic cats, not earned gameplay progression.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import {startNewAdventure} from './cat-bond-test-start.mjs';
const out='artifacts/starbell-parallel/progression',origin='http://127.0.0.1:8765';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});const results=[];
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 await page.route('**/*',r=>{const u=new URL(r.request().url());return u.origin===origin||['data:','blob:'].includes(u.protocol)?r.continue():r.abort()});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+'/cat-bond/?lang=en&rpgDev=1');await page.waitForFunction(()=>window.__CAT_BOND_READY__);
 await startNewAdventure(page);
 const report=await page.evaluate(()=>{
  const G=GameData,S=Skills,roster=[G.speciesById('jinjc'),...G.SPECIES,...Object.values(G.STORY_SPECIES)],state=State.S;
  const fail=(ok,msg)=>{if(!ok)throw Error(msg)};
  const native=new Map(),all=new Map(),roles=[],evolutions=[],kits=[];
  state.coins=1000000;state.fish=1000000;state.catchCount=100;state.petCount=100;
  for(const sp of roster){
   for(const role of S.BUILD_ORDER)for(const [level,affinity] of [[1,0],[4,40],[8,40],[12,70],[16,80],[20,100]]){
    const cat=State.makeCat(sp.id,{affinity});cat.level=level;cat.affinity=affinity;cat.battlesWon=100;cat.protagonist=sp.id==='jinjc';cat.buildType=role;cat.learned=[];cat.loadout=[];cat.autoSkillLoadout=[];cat.skillAwakened=false;
    if(level>=4)S.awakenFirstSkill(cat);
    for(const sk of S.SKILLS)if(S.canLearn(cat,sk))fail(S.learnSkill(cat,sk.id).ok,'Trainer '+sp.id+'/'+sk.id);
    const pool=S.learnableSkills(cat),ids=new Set(pool.map(sk=>sk.id));
    for(const sk of pool){if(!all.has(sk.id))all.set(sk.id,{species:sp.id,role,level,affinity});if(role===S.buildTypeForBreed(cat)&&!native.has(sk.id))native.set(sk.id,{species:sp.id,role,level,affinity});}
    const kit=S.applyBuild(cat,role);for(const id of kit.filter(Boolean))fail(ids.has(id)||S.learnableSkills(cat).some(x=>x.id===id),'Illegal equipped '+sp.id+'/'+role+'/'+id);
    kits.push({species:sp.id,role,level,affinity,kit});
   }
   const evo=S.evolutionOf(sp.id);if(evo){const cat=State.makeCat(sp.id,{affinity:0}),req=evo.req;fail(!S.canEvolve(cat),'Early evolution '+sp.id);cat.level=req.level||20;cat.affinity=req.bond||100;cat.items=req.item?[req.item]:[];fail(S.canEvolve(cat),'Valid evolution blocked '+sp.id);const to=S.evolveResult(cat);fail(to.toSpecies&&G.SPECIES.some(x=>x.id===to.to),'Retired evolution target '+sp.id);evolutions.push({from:sp.id,to:to.to});}
   const c=State.makeCat(sp.id,{affinity:20}),before=c.level;State.addXp(c,State.xpToNext(c.level));fail(c.level===before+1,'XP growth '+sp.id);fail(Object.values(c.stats).every(Number.isFinite),'Invalid stats '+sp.id);
  }
  const parentA=State.makeCat(G.SPECIES[0].id,{affinity:40}),parentB=State.makeCat(G.SPECIES[1].id,{affinity:40}),hero=State.makeCat('jinjc',{affinity:40});
  state.cats.push(parentA,parentB);state.raising=null;Raising.init();
  fail(!Raising.startBreeding(parentA.uid,parentA.uid).ok,'Self breeding');
  fail(!Raising.startBreeding(state.cats[0].uid,parentB.uid).ok,'Story protagonist must not breed');
  fail(Raising.startBreeding(parentA.uid,parentB.uid).ok,'Legal breeding');
  fail(!Raising.collectEgg().ok,'Early egg collection');
  const fish=state.fish;const affinity=parentA.affinity;fail(Raising.giftCat(parentA.uid).ok&&state.fish===fish-1&&parentA.affinity===Math.min(100,affinity+3),'Gift economy');
  const before=State.DIFFICULTY_MULTS.casual,hard=State.DIFFICULTY_MULTS.hardcore;fail(before.enemyDmg<hard.enemyDmg&&before.enemyHp<hard.enemyHp,'Difficulty contract');
  return {roster:roster.length,kitChecks:kits.length,reachable:[...all].map(([id,witness])=>({id,...witness})),nativeReachable:[...native.keys()],unreachable:S.SKILLS.filter(s=>!all.has(s.id)).map(s=>({id:s.id,element:s.element,kind:s.kind,unlock:s.unlock})),evolutions,growthChecks:roster.length,breeding:{legal:true,selfRejected:true,protagonistRejected:true,earlyCollectRejected:true},gift:true,difficulty:{casual:before,hardcore:hard}};
 });
 await fs.writeFile(out+'/report.json',JSON.stringify(report,null,2));console.log('PROGRESSION RUNTIME',JSON.stringify(report));assert.deepEqual(errors,[]);
 await page.screenshot({path:out+'/runtime.png'});
}finally{await browser.close();}
