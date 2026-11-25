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

// Original regional scene and manifestation artwork. Render at native canvas scale; no CSS image substitute.
const artFiles={harbor:["harbor-arena.svg","tide-shell.svg"],forest:["../resonance-world-v2/forest.webp","rootbound.svg"],forge:["emberforge-painted.webp","forge-guardian-painted.webp"],sky:["sky-arena.svg","gale-wing.svg"],library:["library-arena.svg","mirror-sentinel.svg"],starfall:["starfall-arena.svg","orbit-sentinel.svg"]};
const art={};
function loadArt(){for(const [id,[background,enemy]] of Object.entries(artFiles)){
 const pair={background:new Image(),enemy:new Image()};pair.background.decoding=pair.enemy.decoding="async";
 pair.background.src=new URL("../../assets/combat/"+background,import.meta.url).href;pair.enemy.src=new URL("../../assets/combat/"+enemy,import.meta.url).href;art[id]=pair;
}}
function drawScene(ctx,W,H,region){
 const img=art[region]?.background;if(!img?.complete||!img.naturalWidth)return false;
 window.CatBondSceneFit.draw(ctx,img,W,H,{top:"#263c45",bottom:"#354a40"});
 if(region==="forest"){ctx.save();const light=ctx.createLinearGradient(0,H*.18,0,H);light.addColorStop(0,"rgba(15,43,29,.04)");light.addColorStop(.55,"rgba(15,43,29,.18)");light.addColorStop(1,"rgba(12,34,27,.4)");ctx.fillStyle=light;ctx.fillRect(0,0,W,H);ctx.restore();}
 return true;
}
function drawManifestation(ctx,e,b){
 const img=art[e.regionalEnemy]?.enemy;if(!img?.complete||!img.naturalWidth)return false;
 const size=Math.max(96,Math.min(166,126*(b.catScale?.("enemy")||.62)/.62)),bob=Math.sin(b.t*3+e.i)*2;
 ctx.save();ctx.translate(e.x,e.y-size*.44+bob);ctx.scale(e.face===-1?1:-1,1);const scale=Math.min(size/img.naturalWidth,size/img.naturalHeight),dw=img.naturalWidth*scale,dh=img.naturalHeight*scale;ctx.drawImage(img,-dw/2,size/2-dh,dw,dh);ctx.restore();return true;
}

// Position the mechanic HUD below the actual battle topbar on every viewport.
function positionObjectiveHud(panel){
 if(!panel)return;const host=document.getElementById("battle-ui"),top=host?.querySelector(".battle-topbar");
 if(!host||!top)return;
 const hr=host.getBoundingClientRect(),tr=top.getBoundingClientRect();
 if(hr.height&&tr.height)panel.style.setProperty("--cb-rpg-hud-top",Math.round(tr.bottom-hr.top+7)+"px");
}

function install(){
 const BP=window.Battle?.CaptureBattle?.prototype,GP=window.Game?.prototype;
 if(!BP||!GP||window.CatBondRegionalArt)return;
 loadArt();
 const ruinsTask={id:"postgame:ruins",operation:"postgame:ruins-victory"};
 function ruinsAvailable(game){
  const v=window.CatBondResonance?.view(),pos=window.State.S.resonanceExploration?.positions?.starfall;
  return v?.ending&&game?.scene==="map"&&!game.battle&&window.WorldMap.currentRegion==="starfall"&&pos&&Math.hypot(pos.x-.23,pos.y-.78)<.072;
 }
 function prepareRuins(game){
  if(!ruinsAvailable(game))return false;
  const root=window.State.S,host=window.CatBondResonance,team=window.UI.getPreferredBattleTeam();
  if(!team.length)return false;
  // A real optional capture challenge, not another manifestation of the defeated Hollow Echo.
  // Select a legendary breed that is least represented in the player's collection.
  const owned=id=>root.cats.filter(cat=>cat.species===id).length;
  const legends=window.GameData.SPECIES.filter(sp=>sp.rarity==="SSR").sort((a,b)=>owned(a.id)-owned(b.id)||a.id.localeCompare(b.id));
  const wild=legends[0];if(!wild)return false;
  const companions=["wumao","bosi"].map(id=>window.GameData.speciesById(id)).filter(Boolean);
  const title={zh:"星铃废墟 · 传说挑战",en:"Star Bell Ruins · Legendary challenge"};
  window.UI.openBattleModePrompt(team,wild,{origin:"map",storyTitle:[title.zh,title.en],onStart:fighters=>{
   if(root!==window.State.S||!ruinsAvailable(game)||!fighters.length)return;
   const token=host.captureAction();
   game._returnScene="map";game._battleTheme={region:"starfall",sky1:"#16273b",sky2:"#596985",ground:"#393f55",ground2:"#1d2436",accent:"#d8c397"};
   game.startBattle(fighters,wild,{pack:[wild,...companions]});
   if(game.battle)game.battle.postgameRuins={root,token};
  }});
  return true;
 }
 window.CatBondRegionalArt=Object.freeze({drawScene,drawManifestation,prepareRuins});
 const bg=BP.drawArenaBackground;
 BP.drawArenaBackground=function(ctx,W,H){if(this.regionalCombat&&drawScene(ctx,W,H,this.regionalCombat.region))return;return bg.call(this,ctx,W,H);};
 function notice(b,zh,en){b.game.toast({zh,en});}
 const labels={surge:["潮浪来袭，避开横向水带！","Tidal surge: leave the horizontal lanes!"],roots:["根须正在锁定你的位置！","Roots are locking onto your position!"],embers:["熔渣即将落下！","Molten fragments are about to fall!"],gale:["风切线即将贯穿战场！","Gale shear is about to cross the arena!"],mirror:["镜影将复制你的落点！","Mirror echoes will strike both marked positions!"],orbit:["星轨正在轮转，避开落点！","Orbital markers are rotating. Keep clear!"]};
 function mount(game,b){
  document.getElementById("cb-region-combat")?.remove();
  const host=document.getElementById("battle-ui");if(!host)return;
  const panel=document.createElement("div");panel.id="cb-region-combat";panel.className="cb-region-combat";
  const label=document.createElement("span"),button=document.createElement("button");button.type="button";
  panel.append(label,button);button.addEventListener("click",()=>useSupport(b));
  host.append(panel);paintHud(b);requestAnimationFrame(()=>positionObjectiveHud(panel));
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
  const r=b.regionalCombat;if(!r||b.done||b.captureSeq||b.coachHoldsEnemies?.()||b.game.battleHelpOpen||b.duoRun||b.duoCinematic||b.ultCinematic)return;
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
  const region=this._battleTheme?.region,kit=REGION_KITS[region];
  const canonical=window.State.S.resonance?.schema===1&&window.State.S.resonanceExploration?.location===region;
  const normal=kit&&!opts.storyEncounter&&!opts.storyBoss&&!opts.masteryChallenge;
  // Only later optional regional hunts receive a distinct non-collectible manifestation.
  // The lead wild cat remains the sole capture/reward target. First capture and tutorial stay unchanged.
  const manifestation=normal&&canonical&&(window.State.S.catchCount||0)>=2&&!opts.pack;
  const result=start.call(this,team,wild,manifestation?{...opts,pack:[wild,wild]}:opts);
  if(normal&&this.battle){
   const snapshot=window.State.S.resonance;
   const supportAvailable=canonical&&Array.isArray(snapshot?.sanctuaries)&&snapshot.sanctuaries.includes(region);
   this.battle.regionalCombat={region,kit,next:3.7,cast:null,cycle:0,supportAvailable,supportUsed:false};
   if(manifestation&&this.battle.enemies[1]){
    const e=this.battle.enemies[1];e.regionalEnemy=region;e.combatName=kit.enemy;e.element=kit.element;e.role=kit.kind==="gale"?"ambusher":kit.kind==="mirror"?"sharpshooter":"skirmisher";
    e.maxhp=Math.max(45,Math.round(e.maxhp*.48));e.hp=e.maxhp;e.poiseMax=Math.round(e.maxhp*.55);e.poise=e.poiseMax;e.regionalCd=2.6;e.regionalCycle=0;e.rotation=[];e.ultSkill=null;
   }
   mount(this,this.battle);
  }
  return result;
 };
 const capture=BP.startCaptureSeq;
 BP.startCaptureSeq=function(){if(this.regionalCombat&&this.enemies.some(e=>e.regionalEnemy))this._lastDropped=this.enemies[0];return capture.call(this);};
 const update=BP.update;
 BP.update=function(dt){const result=update.call(this,dt);if(this.regionalCombat)tick(this,Math.min(.06,Math.max(0,dt*(this.tempoScale??.64))));return result;};
 const enemyAI=BP.updateEnemyAI;
 BP.updateEnemyAI=function(dt,e,me){
  const r=this.regionalCombat;
  if(!r||!e.regionalEnemy)return enemyAI.call(this,dt,e,me);
  const baseSpeed=e.speed,baseRole=e.role;
  if(r.kit.kind==="gale")e.speed*=1.28;
  if(r.kit.kind==="roots")e.speed*=.84;
  if(r.kit.kind==="orbit")e.role=e.regionalCycle%2?"sharpshooter":"ambusher";
  e.rotation=[];e.ultSkill=null;e.specialMeter=-10000;e.fireCd=99999;e.wardCd=99999;
  try{enemyAI.call(this,dt,e,me);}finally{e.speed=baseSpeed;e.role=baseRole;}
  e.fireCd=99999;
  if(!me?.alive)return;e.regionalCd-=dt;if(e.regionalCd>0)return;
  e.regionalCycle++;e.regionalCd=r.kit.kind==="gale"?2.7:3.5;
  const a=Math.atan2(me.y-e.y,me.x-e.x),skill={element:r.kit.element,isBasic:true},fire=(angle,speed,mult,kind="ball")=>this.spawnProj(e.x,e.y,angle,speed,e.dmg*mult,"wild",r.kit.color,7,kind,skill);
  switch(r.kit.kind){
   case "surge":for(let i=-2;i<=2;i++)fire(a+i*.20,168,.47);break;
   case "roots":for(let i=-1;i<=1;i++)this.spawnProj(e.x,e.y,a+i*.22,138,e.dmg*.55,"wild",r.kit.color,8,"leaf",{element:"grass",isBasic:false,appliesTag:"bind"});break;
   case "embers":for(let i=-1;i<=1;i++)fire(a+i*.28,220,.62,"forge-slag");break;
   case "gale":fire(a-.11,325,.66);fire(a+.11,325,.66);break;
   case "mirror":fire(a,200,.78);e.reflectT=Math.max(e.reflectT||0,.65);break;
   case "orbit":for(let i=0;i<7;i++)fire(a+i*Math.PI*2/7,165,.42);break;
  }
  this.vfx.ring(e.x,e.y,{r0:10,vr:160,life:.45,color:r.kit.color,width:3});
 };
 const drawBattle=BP.draw;
 BP.draw=function(ctx){const result=drawBattle.call(this,ctx);if(this.regionalCombat)draw(this,ctx);return result;};
 const end=GP.endBattle;
 GP.endBattle=function(){
  const b=this.battle,ruins=b?.postgameRuins,host=window.CatBondResonance;
  let committed=null;
  if(ruins&&b.done&&b.result==="win"&&ruins.root===window.State.S&&host?.isCurrentAction?.(ruins.token)&&!host.view().postgame.includes(ruinsTask.id)){
   committed=host.postgame({...ruinsTask,verified:true,token:ruins.token});
  }
  if(b?.regionalCombat)document.getElementById("cb-region-combat")?.remove();
  const result=end.call(this);
  if(committed?.ok)this.toast({zh:"星铃废墟挑战完成。",en:"Star Bell Ruins challenge complete."});
  else if(committed&&!committed.ok)this.toast({zh:"挑战记录未保存，可以再次挑战。",en:"Challenge record was not saved. You can retry."});
  return result;
 };
 window.addEventListener("resize",()=>requestAnimationFrame(()=>positionObjectiveHud(document.getElementById("cb-region-combat"))));
 window.addEventListener("morrowwish-language-change",()=>{const b=window.__game?.battle;if(b?.regionalCombat){paintHud(b);requestAnimationFrame(()=>positionObjectiveHud(document.getElementById("cb-region-combat")));}});
}
if(typeof window!=="undefined")install();
