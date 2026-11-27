// Headless real-engine balance regression. Synthetic level/party fixtures; no browser rendering or scripted wins.
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const names=["data","state","skills","cat-relationships","contact-fx","vfx","moon-fx","magnetic-fx","skill-fx","ult-vfx","battle"],mods=["regional-bosses","regional-combat","companion-talents","guardian-effects"];
const src=Object.fromEntries([...names.map(n=>[n,readFileSync(new URL('../public/cat-bond/js/'+n+'.js',import.meta.url),'utf8')]),...mods.map(n=>[n,readFileSync(new URL('../public/cat-bond/js/resonance/'+n+'.mjs',import.meta.url),'utf8')])]);

function runGuardianMatrix(src,emit){
 const names=["data","state","skills","cat-relationships","contact-fx","vfx","moon-fx","magnetic-fx","skill-fx","ult-vfx","battle"];
 const nop=()=>{},clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),listeners={},storage=new Map();
 const ImageMock=class{constructor(){this.complete=true;this.naturalWidth=400;this.naturalHeight=400}};
 const strip=s=>s.replace(/^import .*?;\s*$/gm,"").replace(/^export\s+(?=(const|function|class|let|var)\b)/gm,"").replaceAll("import.meta","({url:'https://example.invalid/'})");
 const w={URL:class{constructor(p,b){this.href=p}},clamp,lerp:(a,b,t)=>a+(b-a)*t,MorrowwishI18n:{get:()=>"en"},MorrowwishAudio:{effect:nop},arcadeMetric:nop,location:{hostname:"",search:""},performance:{now:()=>0},addEventListener:(n,f)=>(listeners[n]||=[]).push(f),Image:ImageMock,localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)},document:{getElementById:()=>null,body:{classList:{add:nop}}}};
 w.window=w;
 for(const n of names)new Function("window","with(window){"+src[n]+"\n}")(w);
 Object.assign(w,new Function(strip(src["regional-bosses"])+"\nreturn {REGIONAL_BOSSES,bossKey,optionalBossAvailable,atBoss,bossReward,bossTemplates,regionalBossLevel,guardianProfile}")());
 Object.assign(w,new Function(strip(src["companion-talents"])+"\nreturn {activateCompanionTalents}")());
 Object.assign(w,new Function(strip(src["guardian-effects"])+"\nreturn {drawGuardianCast,guardianColors}")());
 w.canonArt=()=>new ImageMock();w.visibleBounds=()=>[0,0,400,400];w.cinematicActive=()=>false;w.syncCinematicHud=nop;w.watchObjectiveHud=nop;w.positionObjectiveHud=nop;
 let seed=42;
 w.Game=class{constructor(W,H){Object.assign(this,{W,H,scene:"map",isTouch:H>W,keys:{},mouse:{x:W*.7,y:H*.6},toast:nop,ui:{},onBattleEnd:nop});} startBattle(team,wild,opts){this.battle=new w.Battle.CaptureBattle(this,team,wild,{...opts,seed});this.battle.coach=null;this.battle.autoMode=true;this.scene="battle";} endBattle(){this.battle=null;}};
 new Function("window","with(window){"+strip(src["regional-combat"])+"\n}")(w);
 const S=w.Skills,State=w.State;
 const fixtures=[["harbor","harbor","harbor:H-04","battle:chime-beast",[.195,.50],false,1],["forge","forge","forge:E-03","battle:shadow-beast",[.74,.40],false,3],...Object.entries(w.REGIONAL_BOSSES).map(([id,d])=>[id,d.region,d.scene,d.op,d.point,!!d.optional,({forest:3,sky:4,library:5,starfall:6,mastery:12})[id]])];
 const assert=(condition,message)=>{if(!condition)throw Error(message);};
 function start(fixture,{W=960,H=540,mode="casual",teamType="plain",seedValue=42,levelDelta=0}={}){
  const [id,region,scene,op,point,optional,level]=fixture;seed=seedValue;
  const species=teamType==="solo"?["jinjc"]:teamType==="elemental"?["story_yahe","story_xiaomao"]:teamType==="reserve"?["jinjc","story_muling","story_qilan"]:["jinjc","story_muling"];
  const cats=species.map((sp,i)=>{const c=State.makeCat(sp,{affinity:teamType==="bonded"?75:35,protagonist:sp==="jinjc"});const lv=teamType==="reserve"&&i===2?25:Math.max(1,level+levelDelta);while(c.level<lv)State.addXp(c,State.xpToNext(c.level));c.buildType=S.buildTypeForBreed(c);S.autoLearn(c);return c;});
  const root=State.S;Object.assign(root,{gameStarted:true,cats,coins:0,fish:0,difficulty:mode,catchCount:2,battlePrefs:{autoBattle:true},tutorial:{battle:true},aiProfile:{},battleTutorialDone:true,resonance:{schema:1},resonanceExploration:{location:region,positions:{[region]:{x:point[0],y:point[1]}},interactions:{}}});
  if(teamType==="bonded")w.CatRelations.grow(cats[0],cats[1],90);
  w.CatBondResonance={view:()=>({current:{id:scene},objective:[op],melodies:[region],ending:true}),captureAction:()=>root,isCurrentAction:t=>t===root,recordEvidence:()=>({ok:true})};
  w.UI={getPreferredBattleTeam:()=>cats,openBattleModePrompt:(t,sp,opts)=>opts.onStart(t)};w.WorldMap={currentRegion:region,resumeRegion:nop};const g=w.__game=new w.Game(W,H);
  if(optional)w.CatBondRegionalArt.prepareOptionalBoss(g,id);else for(const f of listeners["cat-bond-resonance-battle-request"]||[])f({detail:{sceneId:scene,operation:op,region}});
  assert(g.battle,"encounter failed to start "+id);return g.battle;
 }
 const matrix=[];
 for(const f of fixtures){
  for(const [W,H,mode,teamType,seedValue] of [[960,540,"casual","plain",42],[390,844,"casual","plain",42],[960,540,"hardcore","plain",42],[960,540,"casual","bonded",42],[844,390,"casual","plain",73],[960,540,"casual","solo",17],[390,844,"casual","elemental",53],[960,540,"hardcore","reserve",42]]){
   const b=start(f,{W,H,mode,teamType,seedValue}),enemy=b.enemies[0];let frames=0;
   for(;frames<14000&&!b.done;frames++)b.update(1/60);
   matrix.push({id:f[0],mode,size:W>H?(H<540?"L":"W"):"P",teamType,seed:seedValue,result:b.result||"timeout",t:Math.round(b.t),wall:Math.round(frames/60),casts:b.regionalCombat.cycle,enemyAttacks:enemy.regionalCycle,duo:b.duoUses,hp:Math.round(b.team.reduce((n,f)=>n+Math.max(0,f.hp),0)/b.team.reduce((n,f)=>n+f.maxhp,0)*100),dark:!!enemy._darkPhase,level:enemy.level,maxhp:enemy.maxhp});
  }
 }
 emit({matrix});
 // Isolated mechanism probes use real hit resolution and AI attack routines.
 const mechanism=[];
 for(const fixture of fixtures){
  const b=start(fixture),f=b.team[0],e=b.enemies[0],r=b.regionalCombat;
  b.autoMode=false;b.coach=null;b.game.keys={};f.inv=0;f.flash=0;f.shieldT=0;f.protectT=0;f.reflectT=0;f.status={};f.tags=[];
  const before=f.hp,x=f.x;
  r.cast={remaining:.001,max:1.45,patterns:[{shape:"circle",x:f.x,y:f.y,r:80}]};
  b.update(1/60);
  assert(f.hp<before,"hazard dealt no damage "+fixture[0]);
  if(fixture[0]==="forest")assert(f.rootT>0,"root hazard did not bind");
  if(fixture[0]==="sky")assert(Math.abs(f.x-x)>10,"wind hazard did not displace");
  if(fixture[0]==="library")assert(f.vulnerableT>0,"mirror hazard did not expose");
  if(fixture[0]==="forge"){
   e.x=46;e.y=b.topMargin;let hp=e.hp;b.hurtEnemy(e,60,e.x,e.y,false);assert(e.hp===hp,"unlit shadow took damage");
   e.x=b.W*.5;e.y=b.topMargin+(b.H-b.topMargin-b.bottomMargin)*.5;b.hurtEnemy(e,60,e.x,e.y,false);assert(e.hp<hp,"lit shadow did not take damage");
  }
  if(fixture[0]==="library"){
   b.spawnProj(f.x,f.y,0,190,10,"me","#abc",8,"leaf",{element:"grass",isBasic:false,homing:2.2,grow:1.5});e.regionalCd=0;b.updateEnemyAI(1/60,e,f);
   const copies=b.projectiles.filter(p=>p.owner==="wild"&&p.skill?.element==="grass"&&p.kind==="leaf");
   assert(copies.length===3&&copies.every(p=>p.homing===2.2&&p.grow===1.5),"mirror did not copy real projectile properties");
  }
  if(["starfall","mastery"].includes(fixture[0])){
   e.tags=[];e.status={};const light=b.applyHitEffects(e,{element:"light",isBasic:true},100,e.x,e.y);
   e.hp=e.maxhp*.49;b.updateEnemyAI(1/60,e,f);assert(e._darkPhase&&e.element==="dark","no phase change");
   e.tags=[];e.status={};const dark=b.applyHitEffects(e,{element:"light",isBasic:true},100,e.x,e.y);
   assert(Math.abs(light-100*S.effectiveness("light","light"))<.001&&Math.abs(dark-100*S.effectiveness("light","dark"))<.001&&dark!==light,"dynamic defensive element not applied");
  }
  mechanism.push({id:fixture[0],hazardDamage:Math.round(before-f.hp),root:f.rootT||0,displacement:Math.round(f.x-x),phase:e.element});
 }
 emit({mechanism});
 const main=matrix.filter(r=>r.mode==="casual"&&r.teamType==="plain"&&r.size!=="L");
 assert(main.length===14&&main.every(r=>r.result==="win"&&r.casts>=1&&r.enemyAttacks>=1),"on-level casual regression");
 const reserve=matrix.filter(r=>r.teamType==="reserve");for(const r of reserve){const p=matrix.find(x=>x.id===r.id&&x.mode==="hardcore"&&x.teamType==="plain");assert(r.level===p.level&&r.maxhp===p.maxhp,"reserve inflated boss "+r.id);}
 const solo=matrix.filter(r=>r.teamType==="solo");assert(solo.every(r=>r.result==="win"&&r.t<85),"solo accessible without a time-cap loss");
 const bonded=matrix.filter(r=>r.teamType==="bonded");assert(bonded.every(r=>r.result==="win"&&r.duo>=1),"bonded team failed to use duo");
 const phases=main.filter(r=>["starfall","mastery"].includes(r.id));assert(phases.every(r=>r.dark),"phase skipped");
 return {matrix,mechanism};
}

const result=runGuardianMatrix(src,x=>console.log(JSON.stringify(x)));assert.equal(result.matrix.length,56);console.log('56 actual engine challenges plus direct mechanic and reserve checks passed.');
