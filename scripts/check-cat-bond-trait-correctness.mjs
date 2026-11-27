// Narrow integration regression: real CaptureBattle methods with isolated
// damage formula, enemy HP and renderer dependencies. Not a full fight or visual QA.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../public/cat-bond/js');
const w={};
for(const file of ['skills.js','traits.js','trait-fx.js','battle.js'])new Function('window',fs.readFileSync(path.join(root,file),'utf8'))(w);
function verify(w){
 const T=w.CatTraits,P=w.Battle.CaptureBattle.prototype;
 let tests=[];const check=(name,condition)=>{if(!condition)throw Error(name);tests.push(name)};
 const C=(species,extra={})=>({cat:{species,uid:species},x:0,y:0,maxhp:100,hp:100,dmg:20,alive:true,inv:0,flash:0,shieldT:0,protectT:0,reflectT:0,cd:{},status:{},tags:[],...extra});
 const B=()=>Object.assign(Object.create(P),{t:1,team:[],enemies:[],fields:[],projectiles:[],barrierWalls:[],game:{isTouch:false,toast(){}},ult:10,combo:0,hitstop:0,vfx:new Proxy({}, {get:()=>()=>{}}),hitNormal:()=>({x:1,y:0,angle:0}),addShake(){},floater(){},gainUlt(n){this.ult=Math.min(100,this.ult+n)},elemColor:()=>"#fff",applyEnemyHitEffects:(t,sk,d)=>d,applyHitEffects:(t,sk,d)=>d,reflectCovers:()=>false,applyPoiseOnSkillHit(){},regularSkillAccent(){},hurtEnemy(e,d){e.hp=Math.max(0,e.hp-d);if(e.hp===0)e.alive=false},me(){return this.team[0]},supportBeneficiary(){return this.team[1]},onFaint(a){a.alive=false}});
 // Owner 2026-11-27 defense formula in hurtMe (flat+pct mitigation, softer curve + cap 15):
 // dmg → max(1,(dmg-min(15,2+vit*0.15+lv*0.1))*(1-min(0.35,0.08+vit*0.006+lv*0.002)))
 // With default fixture (vit 6, lv 1): flat=3, pct=0.118 → 40 dmg becomes 32.634, 20 dmg becomes 14.994
 let b=B(),c=C('tangyuan'),e=C('enemy',{x:40});b.team=[c];b.enemies=[e];b.hurtMe(40,0,0,c);check('actual hurtMe stores actual HP loss',Math.abs(c.hp-67.366)<0.01&&Math.abs(c._emberCharge-8.159)<0.01);b.resolveHit(e,'me',{kind:'melee',heavy:true,_traitCaster:c},20,40,0);check('actual resolveHit releases charge',Math.abs(e.hp-71.841)<0.01&&c._emberCharge===0);
 b=B();c=C('dundun');e=C('enemy',{x:20});b.team=[c];b.enemies=[e];b.castWard(c,'barrier',{wardDuration:1});b.tickWards(c,1.1);check('natural shield expiry does not freeze',!e.status.chill&&e.hp===100);b.castWard(c,'barrier',{wardDuration:5});b.resolveHit(c,'wild',{element:'fire'},80,0,0);check('actual barrier depletion freezes',c.shieldT===0&&e.status.chill===1.2&&e.hp===88);
 b=B();c=C('nietu');b.team=[c];for(let j=0;j<241;j++){b.t=j/60;T.emit('onTick',{battle:b,cat:c,dt:1/60})}b.hurtMe(40,0,0,c);check('root damage reduction actually applies',Math.abs(c.hp-79.714)<0.01);
 b=B();c=C('jiafei');e=C('abi');b.team=[e,c];b.hurtMe(40,0,0,e);check('actual redirect moves 30 percent of damage',Math.abs(e.hp-77.156)<0.01&&Math.abs(c.hp-90.210)<0.01);
 b=B();c=C('bosi');e=C('abi',{hp:90});b.team=[c,e];b.castSupportSkill(c,{id:'test',kind:'heal',healPct:.4});check('actual heal overflow grants armor',e.hp===100&&e._traitArmor===18);b.hurtMe(10,0,0,e);check('actual armor absorbs damage',e.hp===99&&e._traitArmor===8);
 b=B();c=C('nainai');e=C('abi',{hp:90,status:{burn:2},tags:['burn']});b.team=[c,e];b.castSupportSkill(c,{kind:'heal',healMode:'cleanse',healPct:.4});check('cleanse creates protection',!e.status.burn&&e._cleanseGuardUntil===3);b.hurtMe(20,0,0,e);check('cleanse protection affects HP',Math.abs(e.hp-88.534)<0.01);
 b=B();c=C('yunduo');e=C('abi',{hp:50});const a=C('qisi',{hp:50});b.team=[c,e,a];b.castSupportSkill(c,{kind:'heal',healPct:.2});b.supportBeneficiary=()=>a;b.castSupportSkill(c,{kind:'heal',healPct:.2});check('linked ally receives 25 percent relay',e.hp===75&&a.hp===70);b.t=6;b.castSupportSkill(c,{kind:'heal',healPct:.2});check('expired link does not relay',e.hp===75);
 b=B();c=C('tangyuan');const actual=C('xiaohui');e=C('enemy',{x:40,tags:['soak'],status:{soak:2}});b.team=[c,actual];b.enemies=[e];const p=b.spawnProj(0,0,0,100,20,'me','#fff',10,'ball',{kind:'projectile',_traitCaster:actual},1);b.resolveHit(e,'me',p.skill,20,40,0,p);check('projectile belongs to actual caster after switch',e.hp===72&&p._traitCaster===actual);
 for(const species of ['duanduan','xuewa'])for(const fps of [30,60,120]){b=B();c=C(species);b.team=[c];for(let j=0;j<=fps;j++){b.t=j/fps;c.x=180*b.t;T.emit('onTick',{battle:b,cat:c,dt:1/fps})}const n=c[species==='duanduan'?'_duanduanTrail':'_xuewaTrail'].length;check(species+' path '+fps+'fps: '+n,n>=(species==='duanduan'?14:9)&&n<=(species==='duanduan'?15:10))}
 b=B();c=C('fanmao');e=C('enemy',{x:50});b.fields=[{x:0,y:0,r:90,side:'me',element:'water',_traitCaster:c}];b.enemies=[e];T.emit('onTick',{battle:b,cat:c,dt:.5});check('water pull reduces distance',Math.hypot(e.x,e.y)<30);
 b=B();c=C('youling');e=C('enemy',{x:30});T.emit('onTick',{battle:b,cat:c,dt:.016});T.emit('onHitResolved',{battle:b,cat:c,target:e,skill:{kind:'projectile'},dmg:20});b.t=2.2;T.emit('onTick',{battle:b,cat:c,dt:.016});check('echo survives per-frame dispatch',e.hp===92);
 check('33 registered',Object.keys(T.TRAITS).length===33);
 check('trait error log clean',!(b._traitErrors||[]).length);
 return tests;
}
const tests=verify(w);for(const t of tests)console.log('PASS '+t);console.log(tests.length+' checks passed');
