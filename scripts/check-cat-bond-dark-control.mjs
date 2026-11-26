// Regression: strict role gates, starter availability, real beam methods.
import fs from 'node:fs';
const w={};
for(const name of ['data.js','skills.js','battle.js'])new Function('window','Skills',fs.readFileSync(new URL('../public/cat-bond/js/'+name,import.meta.url),'utf8'))(w,w.Skills);
function run(w){
const S=w.Skills,P=w.Battle.CaptureBattle.prototype,skill=S.skillById('shadowTendrils'),tests=[];
const check=(v,n)=>{if(!v)throw Error(n);tests.push(n)};
const make=(species,role,level=6)=>({species,buildType:role,level,affinity:70,learned:[],loadout:[],skillEdited:true});
const c=make('mengmai','control');
check(S.canLearn(c,skill),'Lv6 dark control can learn');check(!S.canLearn(make('mengmai','control',5),skill),'Lv5 blocked');check(!S.canLearn(make('duanduan','control'),skill),'electric control blocked');
check(S.learnSkill(c,skill.id).ok,'trainer teaches skill');check(S.learnableSkills(c).some(s=>s.id===skill.id),'learned skill equippable');check(S.recommendLoadout(c,'control').includes(skill.id),'control recommendation');
c.loadout=[null,skill.id,null,null];S.applyBuild(c,'dps');check(!c.loadout.includes(skill.id)&&c.learned.includes(skill.id),'role swap strips equip, preserves history');
const t=S.trainerSkills(make('mengmai','dps'));check(!t.ready.concat(t.locked).some(s=>s.id===skill.id),'off-role trainer hides skill');
const dark=w.GameData.SPECIES.filter(s=>S.elementOf(s.id)==='dark');
check(dark.filter(s=>S.canLearn({species:s.id,level:6,learned:[]},skill)).map(s=>s.id).sort().join(',')==='mengmai,xingchen','two native dark controllers');
for(const id of ['mengmai','xingchen'])check(S.enemyKitFor(id,6).rotation.some(s=>s.id===skill.id),id+' wild rotation');
check(!S.enemyKitFor('youling',12).attacks.some(s=>s.id===skill.id),'wild DPS excludes skill');
let combinations=0;
for(const sp of w.GameData.SPECIES)for(const role of S.BUILD_ORDER)for(const level of [1,6,12]){
  const starter=make(sp.id,role,level);starter.affinity=level===1?0:70;
  const load=S.ensureLoadout(starter);
  if(!load[1])throw Error('empty Q '+sp.id+' '+role+' '+level);
  const stale=make(sp.id,role,level);stale.learned=S.SKILLS.filter(s=>s.unlock).map(s=>s.id);stale.loadout=[skill.id,skill.id,'mirrorWall',null];
  const pool=[...S.learnableSkills(stale),...S.basicChoices(stale),...S.ensureLoadout(stale).map(id=>S.skillById(id)).filter(Boolean),...load.map(id=>S.skillById(id)).filter(Boolean)];
  if(pool.some(s=>!S.roleAllowsSkill(role,s)))throw Error('off-role '+sp.id+' '+role+' '+level);
  combinations++;
}
check(combinations===594,'594 role/breed/level combinations');
const actor=(x,y,i)=>({x,y,r:18,i,alive:true,hp:100,maxhp:100,cat:{uid:'a'+i,species:'mengmai'},sp:{id:'mengmai'},status:{},tags:[]});
const a=actor(0,100,0),e1=actor(100,100,1),e2=actor(200,115,2),out=actor(150,160,3),behind=actor(5,100,4),far=actor(290,100,5);
const hits=[];const B=Object.assign(Object.create(P),{W:800,H:500,t:0,team:[a],enemies:[e1,e2,out,behind,far],beams:[],skillStrokes:[],game:{isTouch:false},vfx:{trail(){},impactType(){},ring(){},burst(){},text(){}},me(){return a},aim:0,beamSoftTarget(){return null},addShake(){},hitstop:0,liveEnemies(){return this.enemies.filter(e=>e.alive)},elemMult(){return 1},elemColor(){return '#b18cff'},controlFx(){},resolveHit(e,side,sk,dmg){const n=side==='me'?this.applyHitEffects(e,sk,dmg,e.x,e.y):this.applyEnemyHitEffects(e,sk,dmg,e.x,e.y);hits.push({i:e.i,side,dmg:n});return {dealt:n}}});
B.castBeam(a,0,{...skill,_traitCaster:a},20*skill.power,'#b18cff');B.tickBeams(.125);
check(hits.length===2&&hits[0].i===1&&hits[1].i===2,'two aligned targets only');check(e1.status.bind===.65&&e2.status.bind===.65,'short bind');check(B.skillStrokes.filter(v=>v.kind==='shadowBindHit').length===2,'local bind contact cues');
e1.status.bind=2;B.tickBeams(.125);check(e1.status.bind===2,'stronger existing bind preserved');B.tickBeams(2);check(!B.beams.length&&a._beamRoot===0,'anchor released');check(hits.filter(x=>x.i===1).length===12,'bounded tick count');
hits.length=0;B.team=[e1,e2];B.enemies=[a];e1.status={};e1.tags=[];e2.status={};e2.tags=[];B.castBeam(a,0,skill,20*skill.power,'#b18cff','wild');B.tickBeams(.125);
check(hits.length===2&&hits.every(x=>x.side==='wild')&&e1.status.bind===.65,'wild corridor and bounded soft CC');
return {tests,combinations};
}
console.log(JSON.stringify(run(w),null,2));
