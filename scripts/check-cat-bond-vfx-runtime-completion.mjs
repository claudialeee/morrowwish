// Run: node scripts/check-cat-bond-vfx-runtime-completion.mjs
// Tests actual battle methods with isolated actors and rendering API. Not a complete browser fight.
import fs from 'node:fs';
const w={};
for(const file of ["skills.js","contact-fx.js","moon-fx.js","skill-fx.js","ult-vfx.js","trait-fx.js","vfx.js","traits.js","battle.js","magnetic-fx.js","vfx-atlas.js","duo-finale.js","ward-art.js"])new Function('window',fs.readFileSync(new URL('../public/cat-bond/js/'+file,import.meta.url),'utf8'))(w);
function run(w){
const S=w.Skills,F=w.CatBondSkillFX,T=w.CatBondTraitFX,Tr=w.CatTraits;
const tests=[];const check=(v,m)=>{if(!v)throw Error(m);tests.push(m)};
check(S.skillById("waterJet").width===12,"water lance skill definition");
check(S.skillById("magneticField").cd===9,"magnetic field skill definition");
check(T.ids.length===33&&T.ids.every(k=>Tr.TRAIT_BY_SPECIES[k]),"33 registered trait renderers");
let frames=0,calls=0,depth=0;
const gradient={addColorStop(p){if(!(p>=0&&p<=1))throw Error('gradient '+p)}};
const ctx=new Proxy({}, {get(o,k){if(k in o)return o[k];return (...a)=>{calls++;if(!a.every(v=>typeof v!=='number'||Number.isFinite(v)))throw Error('nonfinite '+String(k));if(k==='save')depth++;if(k==='restore')depth--;if(k==='ellipse'&&!(a[2]>=0&&a[3]>=0))throw Error('ellipse');if(k==='arc'&&!(a[2]>=0))throw Error('arc');if(String(k).includes('Gradient'))return gradient}},set(o,k,v){if(k==='globalAlpha'&&!(v>=0&&v<=1))throw Error('alpha '+v);o[k]=v;return true}});
const cases=w.CatBondVFXAtlas.getCases();
check(new Set(cases.map(x=>x.group+':'+x.id)).size===cases.length,"atlas has no duplicate entries");
for(const item of cases)for(let phase=0;phase<2;phase++)for(const t of [.05,.2,.32,.55,.8]){w.CatBondVFXAtlas.render(ctx,item,phase,t);frames++;if(depth!==0)throw Error("unbalanced canvas stack "+item.id)}
check(cases.length===156&&frames===1560,"156 cases / 1560 isolated rendering samples");
const fx=new w.VFX();fx.impactType(100,100,'heavy',{skill:S.skillById('fireballMeow')});
check(fx.fx[0].skillId==='fireballMeow','contact carries actual skill identity');
fx.draw(ctx,'contact');check(depth===0,'authored hit balances canvas stack');
const P=w.Battle.CaptureBattle.prototype;
const actor=(x,y,i)=>({x,y,r:18,i,alive:true,hp:100,cat:{uid:"a"+i}});
const f=actor(0,100,0),a=actor(100,100,1),b=actor(200,100,2),c=actor(170,150,3),behind=actor(10,100,4),hits=[];
const B=Object.assign(Object.create(P),{W:800,H:500,topMargin:25,bottomMargin:25,t:0,team:[f],enemies:[a,b,c,behind],beams:[],fields:[],skillStrokes:[],game:{isTouch:false},vfx:{trail(){},impactType(){},ring(){},burst(){}},me(){return f},aim:0,beamSoftTarget(){return null},addShake(){},hitstop:0,liveEnemies(){return this.enemies.filter(e=>e.alive)},resolveHit(e,side,sk,dmg){hits.push({i:e.i,side,id:sk.id,dmg});return {dealt:dmg}}});
B.castBeam(f,0,S.skillById("waterJet"),20,"#fff");B.tickBeams(.125);
check(hits.length===2&&hits.some(x=>x.i===1)&&hits.some(x=>x.i===2),"water pierces two aligned targets only");
check(B.skillStrokes.filter(x=>x.kind==="waterPierce").length===2,"both contacts emit directional FX");
B.tickBeams(1.5);check(B.beams.length===0&&f._beamRoot===0,"water beam releases anchor");
check(hits.filter(x=>x.i===1).length===9,"oversized final frame cannot add beam ticks");
hits.length=0;B.team=[a,b];B.enemies=[f];B.castBeam(f,0,S.skillById("waterJet"),20,"#fff","wild");B.tickBeams(.125);
check(hits.length===2&&hits.every(x=>x.side==='wild'),"wild water lance uses same piercing path");B.tickBeams(1.5);
hits.length=0;B.team=[f];B.enemies=[a,b];B.castBeam(f,0,S.skillById("thunderStream"),20,"#fff");B.tickBeams(.125);check(hits.length===1&&hits[0].i===1,"ordinary lightning still stops at first target");B.tickBeams(1.5);
hits.length=0;const m=actor(180,115,5),out=actor(250,100,6);B.enemies=[m,out];B.castMagneticField(f,0,S.skillById("magneticField"),10,"#fff","me");B.tickFields(.5);
check(hits.length===1&&hits[0].i===5,"magnetic damage uses pole corridor");
const m2=actor(195,120,7);B.enemies=[m2];B.tickFields(.25);check(m2.x<195&&m2.x>180,"magnetic field pulls toward centerline");
B.tickFields(10);check(B.fields.length===0&&hits.length===8,"magnetic field expires after exactly eight pulses even on oversized frame");
return {tests,frames,calls,cases:cases.length,normal:cases.filter(x=>x.kind==='skill'||x.kind==='magnetic').length,ults:cases.filter(x=>x.kind==='ult').length};
}
const result=run(w);console.log(JSON.stringify(result,null,2));
