// Regional combat extensions: attach to actual CaptureBattle instances, never to campaign state.
// Wild cats remain collectible; scripted Forge/Finale encounters use separate adapters.
export const REGION_KITS=Object.freeze({
 harbor:{name:["霁潮港","Misttide Harbor"],enemy:["潮汐追猎","Tide pursuit"],npcs:["jiedeng","qilan"],element:"water",color:"#71c9d9",kind:"surge",period:6.2,support:["灯塔引航","Beacon guidance"]},
 forest:{name:["眠根林","Rootsleep Forest"],enemy:["根须围猎","Root ambush"],npcs:["yahe","yuchuan"],element:"grass",color:"#97ba76",kind:"roots",period:6.8,support:["疏通根脉","Clear the roots"]},
 forge:{name:["赤炉环城","Emberforge City"],enemy:["高温巡猎","Furnace hunt"],npcs:["jinpo","xiaomao"],element:"fire",color:"#e9a16b",kind:"embers",period:6.5,support:["冷却旁路","Coolant bypass"]},
 sky:{name:["云脊群岛","Skyspine Isles"],enemy:["风切追逐","Gale chase"],npcs:["lingyu","yuanfan"],element:"elec",color:"#c6dce9",kind:"gale",period:6.1,support:["稳定气流","Stabilize the wind"]},
 library:{name:["月镜书库","Moonmirror Library"],enemy:["镜影反击","Mirror counter"],npcs:["moye","baikan"],element:"dark",color:"#b6a7dd",kind:"mirror",period:7.2,support:["辨认真迹","Reveal the original"]},
 starfall:{name:["星坠原","Starfall Expanse"],enemy:["星轨围猎","Orbital hunt"],npcs:["xingya","lichuan"],element:"light",color:"#e6c68b",kind:"orbit",period:7.0,support:["校准星图","Align the star chart"]}
});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const tr=x=>window.MorrowwishI18n?.get?.()==="zh"?x[0]:x[1];
const living=b=>b.team.filter(f=>f.alive);
const target=b=>b.me()?.alive?b.me():living(b)[0];
export function buildPattern(kind,W,H,top,bottom,point,cycle){
 const x=clamp(point.x,32,W-32),y=clamp(point.y,top+15,H-bottom-15),area=H-top-bottom;
 const circle=(x,y,r)=>({shape:"circle",x:clamp(x,20,W-20),y:clamp(y,top,H-bottom),r});
 const stripe=(x1,y1,x2,y2,w)=>({shape:"line",x1,y1,x2,y2,w});
 switch(kind){
  case "surge":return [stripe(0,y,W,y,44),stripe(0,clamp(y+area*.31,top,H-bottom),W,clamp(y+area*.31,top,H-bottom),25)];
  case "roots":return [circle(x,y,57),circle(x-W*.19,y+area*.13,47),circle(x+W*.19,y-area*.13,47)];
  case "embers":return [circle(x,y,75),circle(x+W*.21,y,52)];
  case "gale":return [stripe(x-W*.3,top,x+W*.3,H-bottom,36),stripe(x-W*.55,top,x+W*.05,H-bottom,26)];
  case "mirror":return [circle(x,y,53),circle(W-x,y,53)];
  case "orbit":return [0,1,2].map(i=>{const a=cycle*.8+i*Math.PI*2/3;return circle(W*.5+Math.cos(a)*W*.24,top+area*.5+Math.sin(a)*area*.32,48);});
  default:return [];
 }
}
export function inPattern(p,f){
 if(p.shape==="circle")return Math.hypot(f.x-p.x,f.y-p.y)<=p.r;
 const dx=p.x2-p.x1,dy=p.y2-p.y1,k=clamp(((f.x-p.x1)*dx+(f.y-p.y1)*dy)/(dx*dx+dy*dy||1),0,1);
 return Math.hypot(f.x-p.x1-k*dx,f.y-p.y1-k*dy)<=p.w/2;
}
function install(){
 const BP=window.Battle?.CaptureBattle?.prototype,GP=window.Game?.prototype;
 if(!BP||!GP)return;
 function notice(b,zh,en){b.game.toast({zh,en});}
 const labels={surge:["潮浪来袭，避开横向水带！","Tidal surge: leave the horizontal lanes!"],roots:["根须正在锁定你的位置！","Roots are locking onto your position!"],embers:["熔渣即将落下！","Molten fragments are about to fall!"],gale:["风切线即将贯穿战场！","Gale shear is about to cross the arena!"],mirror:["镜影将复制你的落点！","Mirror echoes will strike both marked positions!"],orbit:["星轨正在轮转，避开落点！","Orbital markers are rotating. Keep clear!"]};
 function mount(game,b){
  document.getElementById("cb-region-combat")?.remove();
  const host=document.getElementById("battle-ui");if(!host)return;
  const panel=document.createElement("div");panel.id="cb-region-combat";panel.className="cb-region-combat";
  const label=document.createElement("span"),button=document.createElement("button");button.type="button";
  panel.append(label,button);button.addEventListener("click",()=>useSupport(b));
  host.append(panel);paintHud(b);
 }
 function paintHud(b){
  const panel=document.getElementById("cb-region-combat");if(!panel||!b.regionalCombat)return;
  const r=b.regionalCombat,kit=r.kit,button=panel.querySelector("button");
  panel.querySelector("span").textContent=tr(kit.name)+" · "+tr(kit.enemy);
  button.hidden=!r.supportAvailable;button.disabled=r.supportUsed||!r.cast;
  button.textContent=r.supportUsed?tr(["已支援","Support used"]):tr(kit.support);
 }
 function useSupport(b){
  const r=b.regionalCombat;if(!r||!r.supportAvailable||r.supportUsed||!r.cast||b.done)return false;
  r.supportUsed=true;r.cast=null;r.next=Math.max(r.next,4);
  const cats=living(b);
  if(r.kit.kind==="roots")for(const f of cats){f.rootT=0;f.rooted=false;if(f.status)delete f.status.bind;}
  else if(r.kit.kind==="mirror"){for(const e of b.liveEnemies())e.reflectT=0;}
  else if(r.kit.kind==="embers"){for(const f of cats){if(f.status)delete f.status.burn;}}
  else if(r.kit.kind==="gale"){for(const f of cats)f.inv=Math.max(f.inv||0,.8);}
  else if(r.kit.kind==="orbit"){for(const f of cats)f.ultMeter=Math.min(100,(f.ultMeter||0)+15);}
  else{for(const f of cats)f.shieldT=Math.max(f.shieldT||0,2.5);}
  for(const f of cats)b.vfx.ring(f.x,f.y,{r0:16,vr:170,life:.55,color:r.kit.color,width:4});
  notice(b,"地区伙伴已解除本次危险。","Local allies have cleared this hazard.");paintHud(b);return true;
 }
 function resolve(b,r,cast){
  for(const f of living(b)){
   if(!cast.patterns.some(p=>inPattern(p,f)))continue;
   const hit=b.resolveHit(f,"wild",{element:r.kit.element,kind:"aoe",isBasic:false},Math.max(8,f.maxhp*(r.kit.kind==="embers"?.14:.10)),f.x,f.y);
   if(hit?.dealt>0){
    if(r.kit.kind==="roots")f.rootT=Math.max(f.rootT||0,1.5);
    if(r.kit.kind==="gale"){const dir=f.x<b.W/2?-1:1;f.x=clamp(f.x+dir*38,32,b.W-32);}
    if(r.kit.kind==="mirror")f.vulnerableT=Math.max(f.vulnerableT||0,1.1);
   }
   b.vfx.ring(f.x,f.y,{r0:8,vr:220,life:.35,color:r.kit.color,width:3});
  }
  for(const p of cast.patterns)if(p.shape==="circle")b.vfx.ring(p.x,p.y,{r0:p.r*.3,vr:160,life:.45,color:r.kit.color,width:5});
 }
 function tick(b,dt){
  const r=b.regionalCombat;if(!r||b.done||b.captureSeq||b.coachHoldsEnemies?.()||b.game.battleHelpOpen||b.duoRun)return;
  if(!living(b).length||!b.liveEnemies().length)return;
  if(r.cast){
    r.cast.remaining-=dt;
    if(r.cast.remaining<=0){resolve(b,r,r.cast);r.cast=null;r.next=r.kit.period;paintHud(b);}
    return;
  }
  r.next-=dt;
  if(r.next<=0){
   const t=target(b);if(!t)return;
   r.cast={remaining:1.45,max:1.45,patterns:buildPattern(r.kit.kind,b.W,b.H,b.topMargin,b.bottomMargin,t,r.cycle++)};
   const line=labels[r.kit.kind];notice(b,line[0],line[1]);paintHud(b);
  }
 }
 function draw(b,ctx){
  const r=b.regionalCombat,cast=r?.cast;if(!cast)return;
  ctx.save();ctx.fillStyle=r.kit.color;ctx.strokeStyle=r.kit.color;ctx.lineCap="round";
  for(const p of cast.patterns){
    ctx.globalAlpha=.2;ctx.beginPath();
    if(p.shape==="circle"){ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();}
    else{ctx.lineWidth=p.w;ctx.moveTo(p.x1,p.y1);ctx.lineTo(p.x2,p.y2);ctx.stroke();}
    ctx.globalAlpha=.92;ctx.lineWidth=2;ctx.setLineDash([6,5]);ctx.beginPath();
    if(p.shape==="circle"){ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.stroke();}
    else{const dx=p.x2-p.x1,dy=p.y2-p.y1,len=Math.hypot(dx,dy)||1,nx=-dy/len*p.w/2,ny=dx/len*p.w/2;ctx.moveTo(p.x1+nx,p.y1+ny);ctx.lineTo(p.x2+nx,p.y2+ny);ctx.moveTo(p.x1-nx,p.y1-ny);ctx.lineTo(p.x2-nx,p.y2-ny);ctx.stroke();}
    ctx.setLineDash([]);
  }
  ctx.restore();
 }
 const start=GP.startBattle;
 GP.startBattle=function(team,wild,opts={}){
  const region=this._battleTheme?.region,kit=REGION_KITS[region],result=start.call(this,team,wild,opts);
  if(kit&&!opts.storyEncounter&&!opts.storyBoss&&!opts.masteryChallenge&&this.battle){
   const snapshot=window.State.S.resonance;
   const supportAvailable=Array.isArray(snapshot?.sanctuaries)&&snapshot.sanctuaries.includes(region);
   this.battle.regionalCombat={region,kit,next:3.7,cast:null,cycle:0,supportAvailable,supportUsed:false};
   mount(this,this.battle);
  }
  return result;
 };
 const update=BP.update;
 BP.update=function(dt){const result=update.call(this,dt);if(this.regionalCombat)tick(this,Math.min(.06,Math.max(0,dt)));return result;};
 const enemyAI=BP.updateEnemyAI;
 BP.updateEnemyAI=function(dt,e,me){
  const r=this.regionalCombat;
  if(!r)return enemyAI.call(this,dt,e,me);
  // Preserve native skills and combat physics, specialize engagement per region.
  const baseSpeed=e.speed,baseRate=e.fireRate,baseRole=e.role;
  switch(r.kit.kind){
   case "surge":e.role="ambusher";e.speed*=1.13;break;
   case "roots":e.role="skirmisher";e.speed*=.88;break;
   case "embers":e.role="elite";e.fireRate*=.9;break;
   case "gale":e.role="ambusher";e.speed*=1.28;break;
   case "mirror":e.role="sharpshooter";e.fireRate*=1.14;break;
   case "orbit":e.role=r.cycle%2?"sharpshooter":"ambusher";break;
  }
  try{return enemyAI.call(this,dt,e,me);}finally{e.speed=baseSpeed;e.fireRate=baseRate;e.role=baseRole;}
 };
 const drawBattle=BP.draw;
 BP.draw=function(ctx){const result=drawBattle.call(this,ctx);if(this.regionalCombat)draw(this,ctx);return result;};
 const end=GP.endBattle;
 GP.endBattle=function(){if(this.battle?.regionalCombat)document.getElementById("cb-region-combat")?.remove();return end.call(this);};
 window.addEventListener("morrowwish-language-change",()=>{const b=window.__game?.battle;if(b?.regionalCombat)paintHud(b);});
}
if(typeof window!=="undefined")install();
