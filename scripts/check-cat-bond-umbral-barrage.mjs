// Run: node scripts/check-cat-bond-umbral-barrage.mjs
import fs from 'node:fs';
const w={};for(const n of ['data.js','skills.js','battle.js','skill-fx.js'])new Function('window','Skills',fs.readFileSync(new URL('../public/cat-bond/js/'+n,import.meta.url),'utf8'))(w,w.Skills);
function run(w){
 const S=w.Skills,P=w.Battle.CaptureBattle.prototype,F=w.CatBondSkillFX,sk=S.skillById('arcanePulse'),tests=[];
 const check=(v,n)=>{if(!v)throw Error(n);tests.push(n)};
 const cat=(species,role,level=5)=>({species,buildType:role,level,affinity:70,learned:[]});
 const d=cat('youling','dps');
 check(sk.name==='暗星轰击'&&sk.kind==='aoe'&&sk.lobCount===3&&!sk.pulseHoming&&!sk.appliesTag,'legacy ID, new ground-only artillery data');
 check(S.canLearn(d,sk)&&!S.canLearn(cat('youling','dps',4),sk),'dark DPS level 5');
 check(S.BUILD_ORDER.filter(r=>S.canLearn(cat('youling',r),sk)).join(',')==='dps','strict DPS-only gate');
 check(!S.canLearn(cat('xianluo','dps'),sk),'electric DPS blocked');
 check(S.learnSkill(d,sk.id).ok&&S.recommendLoadout(d,'dps').includes(sk.id),'learn and recommend authored artillery');
 S.applyBuild(d,'control');check(!d.loadout.includes(sk.id)&&d.learned.includes(sk.id),'old learned ID retained, forbidden equip stripped');
 check(S.enemyKitFor('youling',5).rotation.some(s=>s.id===sk.id)&&!S.enemyKitFor('xingchen',12).attacks.some(s=>s.id===sk.id),'wild role-specific rotation');
 const actor=(x,y,i)=>({x,y,i,alive:true,cat:{species:'youling',uid:'a'+i}});
 const a=actor(100,150,0),e=actor(300,150,1),outside=actor(300,250,2),mid=actor(200,150,3);
 let hits=[];
 const b=Object.assign(Object.create(P),{W:800,H:550,topMargin:50,bottomMargin:50,game:{isTouch:false,mouse:{x:300,y:150}},team:[a],enemies:[e,outside,mid],_umbralLobs:[],skillStrokes:[],vfx:{muzzle(){}},me(){return a},liveEnemies(){return this.enemies.filter(e=>e.alive)},resolveHit(...args){hits.push(args)}});
 const cast=()=>b.castUmbralBarrage(a,0,sk,10,'#b89cff');
 const reset=()=>{b._umbralLobs=[];b.skillStrokes=[];hits=[];a.alive=true;e.x=300;e.y=150;b.game.mouse={x:300,y:150};b.team=[a];b.enemies=[e,outside,mid]};
 cast();check(b._umbralLobs.length===3&&b._umbralLobs.filter(x=>x.launched).length===1,'three shells scheduled, first immediate');
 check(b._umbralLobs.map(x=>x.ty).join(',')==='150,174,126','precise first, two fixed scatter landings');
 const s=b._umbralLobs[0],p0=F.umbralLobPosition(s,0),p5=F.umbralLobPosition(s,.5),p1=F.umbralLobPosition(s,1);
 check(p0.x===s.sx&&p1.x===s.tx&&p1.y===s.ty&&p5.y<p5.gy-60,'true parabolic elevation and exact endpoint');
 b.tickUmbralLobs(.4);check(!hits.length,'no in-flight collision');
 b.tickUmbralLobs(.36);check(hits.length===1,'first landing at 0.76');
 b.tickUmbralLobs(.42);check(hits.length===2,'second landing at 1.18');
 b.tickUmbralLobs(.42);check(hits.length===3,'third landing at 1.60');
 check(!b._umbralLobs.length&&b.skillStrokes.length===3,'three actual ground impact effects and queue expires');
 check(hits.every(x=>x[0]===e&&x[1]==='me'&&x[2]._traitCaster===a&&x[3]===10),'only in-radius enemy, caster attribution, per-shell damage');
 reset();cast();e.y=400;b.game.mouse={x:600,y:400};b.tickUmbralLobs(2);check(!hits.length&&b.skillStrokes.length===3,'moving out dodges, cursor does not retarget, large frame no extra impacts');
 reset();cast();a.alive=false;b.tickUmbralLobs(2);check(hits.length===1&&b.skillStrokes.length===1,'faint cancels unlaunched shells only');
 reset();b.game.mouse={x:1000,y:150};cast();check(b._umbralLobs.every(x=>Math.hypot(x.tx-a.x,x.ty-a.y)<=sk.reach+1e-8),'max range cap');
 reset();b.team=[e,outside];b.enemies=[a];b.castUmbralBarrage(a,0,sk,10,'#b89cff','wild',e);b.tickUmbralLobs(2);
 check(hits.length===3&&hits.every(x=>x[0]===e&&x[1]==='wild'&&!x[2]._traitCaster),'wild same geometry and three impacts');
 return {tests,count:tests.length};
}
console.log(JSON.stringify(run(w),null,2));
