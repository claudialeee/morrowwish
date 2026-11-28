import {drawGuardianCast,guardianColors} from "./guardian-effects.mjs?v=guardian-art-20261127";
import {REGIONAL_BOSSES,bossKey,optionalBossAvailable,atBoss,bossReward,bossTemplates,regionalBossLevel,guardianProfile} from "./regional-bosses.mjs";
import {activateCompanionTalents} from "./companion-talents.mjs";
import {applyRegionalKeepsake,forgeLightScale,hasRegionalKeepsake,regionalKeepsakes} from "./regional-keepsake-talents.mjs?v=work-closure-20261127-r3";
import {canonArt,visibleBounds} from "./canon22-art.mjs";
import {positionObjectiveHud,watchObjectiveHud,cinematicActive,syncCinematicHud} from "./battle-hud.mjs";
// Regional combat extensions: attach to actual CaptureBattle instances, never to campaign state.
// Wild cats remain collectible; scripted Forge/Finale encounters use separate adapters.
import {libraryBlocked,libraryPoints,catdexRecord} from "./library-mechanisms.mjs?v=work-closure-20261127-r3";
export const REGION_KITS=Object.freeze({
 harbor:{name:["风铃镇","Windchime Town"],enemy:["铃舌兽","Belltongue Beast"],npcs:["jiedeng","qilan"],element:"water",color:"#e7c775",kind:"surge",period:6.2,support:["真铃支援","True chime support"]},
 forest:{name:["眠根林","Rootsleep Forest"],enemy:["根须围猎","Root ambush"],npcs:["yahe","yuchuan"],element:"grass",color:"#97ba76",kind:"roots",period:6.8,support:["疏通根脉","Clear the roots"]},
 forge:{name:["千灯城","Lantern City"],enemy:["灯影围猎","Lantern shadow hunt"],npcs:["jinpo","xiaomao"],element:"fire",color:"#e9a16b",kind:"embers",period:6.5,support:["照亮舞台","Light the stage"]},
 sky:{name:["云脊群岛","Skyspine Isles"],enemy:["风切追逐","Gale chase"],npcs:["lingyu","yuanfan"],element:"elec",color:"#c6dce9",kind:"gale",period:6.1,support:["稳定气流","Stabilize the wind"]},
 library:{name:["月镜书库","Moonmirror Library"],enemy:["镜影反击","Mirror counter"],npcs:["moye","baikan"],element:"dark",color:"#b6a7dd",kind:"mirror",period:7.2,support:["辨认真迹","Reveal the original"]},
 starfall:{name:["星坠原","Starfall Expanse"],enemy:["星轨围猎","Orbital hunt"],npcs:["xingya","lichuan"],element:"light",color:"#e6c68b",kind:"orbit",period:7.0,support:["校准星图","Align the star chart"]}
});
// Match the actual two-cat field, not the full roster including reserves.
// The casual legendary challenge is a single full-strength SSR; the promised
// duo challenge adds an escort. Hardcore retains a level advantage and escort.
export function ruinsEncounterProfile(fighters,mode,difficulty){
 const field=fighters.slice(0,2);
 if(!field.length)return null;
 const average=field.reduce((n,c)=>n+(Number(c.level)||1),0)/field.length;
 const hardcore=difficulty==="hardcore",duo=mode==="duo";
 return {level:Math.max(1,Math.round(average)+(hardcore?(duo?2:1):0)),escorts:field.length===2&&(hardcore||duo)?1:0};
}
// The player uses the shared ultimate meter, not the enemy-only ultMeter.
// Earned promises provide a single recovery window when local support is used
// in the casual postgame duo challenge; hardcore and ordinary captures retain
// their existing enemy strength and do not receive the additional recovery.
export function applyStarfallSupport(b,cats,difficulty){
 b.gainUlt(15);
 const r=b.postgameRuins;
 if(difficulty!=="casual"||r?.mode!=="duo"||!r.promised||!b.duoUses||!b.duo)return;
 const pair=new Set([b.duo.a.uid,b.duo.b.uid]);
 for(const f of cats){
  if(!f.alive||!pair.has(f.cat?.uid))continue;
  b.healUnit(f,f.maxhp*.20);
  f.shieldT=Math.max(f.shieldT||0,4);
 }
}
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
// The trial has a moving safe corridor rather than the normal guardian's circles.
// Both layouts use the same line hitboxes and guardian telegraph renderer.
export function buildMasteryPattern(W,H,top,bottom,cycle,element){
 const vertical=element!=="dark",span=vertical?W:H-top-bottom;
 const start=vertical?0:top,end=start+span;
 const center=start+span*(cycle%2===0?.35:.65),half=span*.21;
 const bands=[[start,center-half],[center+half,end]];
 return bands.filter(([a,z])=>z>a).map(([a,z])=>{
  const mid=(a+z)/2,w=z-a;
  return vertical?{shape:"line",x1:mid,y1:top-w,y2:H-bottom+w,x2:mid,w}:
   {shape:"line",x1:-w,y1:mid,x2:W+w,y2:mid,w};
 });
}
export function inPattern(p,f){
 if(p.shape==="circle")return Math.hypot(f.x-p.x,f.y-p.y)<=p.r;
 const dx=p.x2-p.x1,dy=p.y2-p.y1,k=clamp(((f.x-p.x1)*dx+(f.y-p.y1)*dy)/(dx*dx+dy*dy||1),0,1);
 return Math.hypot(f.x-p.x1-k*dx,f.y-p.y1-k*dy)<=p.w/2;
}

// In each region the arena leaves room for the cats, paths and attack indicators.
const artFiles={
 harbor:["harbor-arena.webp","tide-shell-watercolor.webp"],
 forest:["forest-arena.webp","rootbound-watercolor.webp"],
 forge:["emberforge-painted.webp","forge-guardian-painted.webp"],
 sky:["sky-arena.webp","gale-wing-watercolor.webp"],
 library:["library-arena.webp","mirror-sentinel-watercolor.webp"],
 starfall:["starfall-arena.webp","orbit-sentinel-watercolor.webp"],
};
const portraitFocalPoints={harbor:.50,forest:.20,forge:.50,sky:.68,library:.50,starfall:.65};
const art={},nativePortrait=new Map();
const orbitalArt={};
function orbitalImage(key){
 const image=new Image();
 image.decoding="async";
 image.src=new URL(`../../assets/combat/orbit-${key}-watercolor.webp`,import.meta.url).href;
 orbitalArt[key]=image;
}
const imageReady=image=>image?.complete&&image.naturalWidth>0;
function nativeArena(region){if(!nativePortrait.has(region)){const im=new Image();im.decoding='async';im.src=new URL('../../assets/mobile-portrait/battle-'+(region==='forge'?'lantern':region==='harbor'?'windchime':region)+'.webp',import.meta.url).href;nativePortrait.set(region,im);}return nativePortrait.get(region);}
function loadArt(){orbitalImage("dark");orbitalImage("mastery");canonArt("shadow-beast");canonArt("lantern-theater");for(const [id,[background,enemy]] of Object.entries(artFiles)){
 const pair={background:new Image(),enemy:new Image()};pair.background.decoding=pair.enemy.decoding="async";
 pair.background.src=new URL("../../assets/combat/"+background,import.meta.url).href;if(enemy)pair.enemy.src=new URL("../../assets/combat/"+enemy,import.meta.url).href;
 art[id]=pair;nativeArena(id);
}}
function drawScene(ctx,W,H,region){
 const pair=art[region],ready=image=>image?.complete&&image.naturalWidth>0;
 const img=region==="forge"&&window.__game?.battle?.regionalCombat?.shadowLight?(canonArt("lantern-theater")||pair?.background):pair?.background;
 const tall=H>W?nativeArena(region):null;
 if(ready(tall)){const k=Math.max(W/tall.naturalWidth,H/tall.naturalHeight);ctx.drawImage(tall,(W-tall.naturalWidth*k)/2,(H-tall.naturalHeight*k)/2,tall.naturalWidth*k,tall.naturalHeight*k);return true;}
 if(!ready(img))return false;
 ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
 window.CatBondSceneFit.draw(ctx,img,W,H,{top:"#e7dceb",bottom:"#d9c0aa",portraitFocus:portraitFocalPoints[region]??.5});
 ctx.restore();
 return true;
}
// Dedicated hand-painted regional creatures; combat and capture data are unchanged.
function drawManifestation(ctx,e,b){
 if(b.libraryEncounter?.region==="library"&&b.libraryEncounter.op!=="battle:mirror-guardian")return false;
 const shadow=e.regionalEnemy==="forge"&&b.regionalCombat?.shadowLight,painted=shadow&&canonArt("shadow-beast");const standard=painted||art[e.regionalEnemy]?.enemy;
 const master=b.libraryEncounter?.bossId==="mastery";
 const variantAtRest=master?orbitalArt.mastery:standard;
 const dark=e._darkPhase&&!master?orbitalArt.dark:variantAtRest;
 const img=imageReady(dark)?dark:variantAtRest;
 if(!imageReady(img))return false;
 const originalSize=Math.max(96,Math.min(166,126*(b.catScale?.("enemy")||.62)/.62));
 const visualScale=b.catScale?.("enemy")||.95;
 const emphasis=e.isBoss?1.12:1;
 const size=e.regionalEnemy==="forge"?originalSize:Math.max(92,Math.min(e.isBoss?134:138,118*emphasis*visualScale/.95)),bob=e.frozen?0:Math.sin(b.t*3+e.i)*1.5;
 // Fit the authored creature within the existing visual box without stretching.
 const src=(painted||e.regionalEnemy==="harbor")?visibleBounds(img):[0,0,img.naturalWidth,img.naturalHeight];const fit=Math.min(size/src[2],size/src[3]),dw=src[2]*fit,dh=src[3]*fit;
 // Ground the unchanged silhouette at its visual foot anchor, not a
 // glow ring. The shadow stays planted during idle motion.
 const foot=e.regionalEnemy==="forge"?size*.06:23;
 const portraitBoss=e.isBoss&&b.H>b.W;
 const footX=portraitBoss?clamp(e.x,dw/2+1,b.W-dw/2-1):e.x;
 const footY=portraitBoss?Math.min(e.y+foot,b.H-b.bottomMargin-3):e.y+foot;
 ctx.save();ctx.translate(footX,footY);ctx.scale(Math.max(1,dw*.34),Math.max(1,size*.055));
 const contact=ctx.createRadialGradient(0,0,0,0,0,1);
 contact.addColorStop(0,"rgba(13,23,25,.46)");contact.addColorStop(.55,"rgba(13,23,25,.24)");contact.addColorStop(1,"rgba(13,23,25,0)");
 ctx.fillStyle=contact;ctx.beginPath();ctx.arc(0,0,1,0,Math.PI*2);ctx.fill();ctx.restore();
 ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";ctx.translate(footX,footY+bob);ctx.scale(e.face===-1?1:-1,1);
 if(painted){const x=b.W*.50,y=b.topMargin+(b.H-b.topMargin-b.bottomMargin)*.50,r=Math.min(118,b.W*.22,(b.H-b.topMargin-b.bottomMargin)*.28);if(Math.hypot(e.x-x,e.y-y)>r)ctx.filter="brightness(.55) saturate(.75)";}if(master&&e._darkPhase)ctx.filter="hue-rotate(28deg) saturate(1.12) brightness(.88)";
 const fade=img!==variantAtRest?clamp((b.t-e.darkPhaseAt)/.34,0,1):1;
 if(fade<1&&imageReady(variantAtRest)){
  ctx.globalAlpha=1-fade;
  const lightFit=size/Math.max(variantAtRest.naturalWidth,variantAtRest.naturalHeight);
  const lightW=variantAtRest.naturalWidth*lightFit,lightH=variantAtRest.naturalHeight*lightFit;
  ctx.drawImage(variantAtRest,-lightW/2,-lightH,lightW,lightH);
 }
 ctx.globalAlpha=fade;
 ctx.drawImage(img,...src,-dw/2,-dh,dw,dh);ctx.restore();return true;
}


// Keep automatic commands responsive to the same visible safe corridor as a player.
export function guardianSteer(b,f){
 const r=b.regionalCombat,cast=r?.cast;
 if(!b.autoMode||b.libraryEncounter?.bossId!=="mastery"||!cast||!f.alive||cast.patterns.length!==2||cast.patterns.some(p=>p.shape!=="line"))return null;
 const vertical=cast.element!=="dark",axis=vertical?"x":"y",start=vertical?"x1":"y1";
 const [lo,hi]=[...cast.patterns].sort((a,z)=>a[start]-z[start]);
 const a=lo[start]+lo.w/2,z=hi[start]-hi.w/2;
 if(z<=a)return null;
 const margin=Math.min(12,(z-a)*.18),v=f[axis];
 if(v>=a+margin&&v<=z-margin)return null;
 const d=Math.sign((a+z)/2-v);
 return vertical?{x:d,y:0}:{x:0,y:d};
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
 function prepareRuins(game,mode="legendary"){
  if(!ruinsAvailable(game))return false;
  const root=window.State.S,host=window.CatBondResonance,team=window.UI.getPreferredBattleTeam();
  if(!team.length)return false;
  // A real optional capture challenge, not another manifestation of the defeated Hollow Echo.
  // Select a legendary breed that is least represented in the player's collection.
  const owned=id=>root.cats.filter(cat=>cat.species===id).length;
  const legends=window.GameData.SPECIES.filter(sp=>sp.rarity==="SSR").sort((a,b)=>owned(a.id)-owned(b.id)||a.id.localeCompare(b.id));
  const wild=legends[0];if(!wild)return false;
  const companions=["zest","sunlace"].map(id=>window.GameData.speciesById(id)).filter(Boolean);
  const duoMode=mode==="duo";
  const title=duoMode?{zh:"星铃废墟 · 双猫约定挑战",en:"Star Bell Ruins · Duo Promise challenge"}:{zh:"星铃废墟 · 传说挑战",en:"Star Bell Ruins · Legendary challenge"};
  window.UI.openBattleModePrompt(team,wild,{origin:"map",storyTitle:[title.zh,title.en],onStart:fighters=>{
   if(root!==window.State.S||!ruinsAvailable(game)||!fighters.length)return;
   const token=host.captureAction();
   game._returnScene="map";game._battleTheme={region:"starfall",sky1:"#16273b",sky2:"#596985",ground:"#393f55",ground2:"#1d2436",accent:"#d8c397"};
   const profile=ruinsEncounterProfile(fighters,mode,window.State.difficulty());
   if(!profile)return;
   const lead={...wild,encounterLevel:profile.level};
   game.startBattle(fighters,lead,{pack:[lead,...companions.slice(0,profile.escorts)]});
   if(game.battle){const b=game.battle,p=b.duo;const promised=!!(p&&window.CatRelations?.memoryList?.(p.a,p.b)?.includes("sakura"));b.postgameRuins={root,token,mode,promised,attemptId:globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random()}`};if(b.regionalCombat)b.regionalCombat.next=2.6;if(promised&&(duoMode||window.State.difficulty()!=="hardcore")){b.duoCharge=100;notice(b,"已完成的双猫约定让合击准备就绪。","Your earned Duo Promise readies a real Duo cast.");}if(duoMode&&!promised)notice(b,"本次未携带已完成约定的双猫；仍可捕捉，不能获得约定奖励。","No promised duo in this party; capture remains available, but the promise bonus is locked.");}
  }});
  return true;
 }
 window.CatBondRegionalArt=Object.freeze({drawScene,drawManifestation,prepareRuins,guardianSteer,prepareOptionalBoss:(game,id)=>prepareLibrary(game,id,true)});
 const bg=BP.drawArenaBackground;
 BP.drawArenaBackground=function(ctx,W,H){
  const regional=this.regionalCombat;
  if(!regional||!drawScene(ctx,W,H,regional.region))bg.call(this,ctx,W,H);
  if(regional?.balance&&!cinematicActive(this)){
   if(regional.shadowLight)drawSpotlight(this,ctx);
   draw(this,ctx);
  }
 };
 function notice(b,zh,en){b.game.toast({zh,en});}
 const labels={surge:["铃光横扫，避开预警光带！","Belllight sweep: leave the marked lanes!"],roots:["根须正在锁定你的位置！","Roots are locking onto your position!"],embers:["影火即将落下，避开预警区域！","Shadow sparks incoming. Leave the marked areas!"],gale:["风切线即将贯穿战场，注意侧风推移！","Gale shear incoming. Counter the crosswind drift!"],mirror:["镜影将复制你的落点！","Mirror echoes will strike both marked positions!"],orbit:["星轨即将落下，离开标记圆圈！","Orbital strike incoming. Leave the marked circles!"]};
 function mount(game,b){
  document.getElementById("cb-region-combat")?.remove();
  const host=document.getElementById("battle-ui");if(!host)return;
  const panel=document.createElement("div");panel.id="cb-region-combat";panel.className="cb-region-combat";panel.dataset.region=b.regionalCombat.region;
  if(b.libraryEncounter?.bossId)panel.dataset.guardian="true";
  const label=document.createElement("span"),button=document.createElement("button");button.type="button";
  panel.append(label,button);button.addEventListener("click",()=>useSupport(b));
  let lastTouch=-Infinity;button.addEventListener('touchstart',e=>{if(!b.game?.isTouch||button.disabled)return;e.preventDefault();e.stopPropagation();lastTouch=performance.now();useSupport(b);},{passive:false});button.addEventListener('click',e=>{if(e.detail!==0&&performance.now()-lastTouch<700)e.stopImmediatePropagation();},{capture:true});host.append(panel);paintHud(b);watchObjectiveHud(panel);
 }
 function paintHud(b){
  const panel=document.getElementById("cb-region-combat");if(!panel||!b.regionalCombat)return;
  const r=b.regionalCombat,kit=r.kit,button=panel.querySelector("button"),phase=b.libraryEncounter&&["starfall","mastery"].includes(b.libraryEncounter.bossId)?(b.liveEnemies()[0]?.element==="dark"?tr([" · 暗属性"," · Dark"]):tr([" · 光属性"," · Light"])):"";
  const warning=r.cast?Math.max(0,Math.ceil(r.cast.remaining)):0;panel.dataset.phase=r.cast?"warning":r.recoveryUntil>b.t?"opening":"normal";panel.querySelector("span").textContent=r.recoveryUntil>b.t?tr(["破绽 · 伤害提升","Opening · damage bonus"]):r.cast?tr(["危险预警 · "+warning+"秒","Incoming attack · "+warning+"s"]):r.shadowLight?tr(["引剪影兽进入灯光再攻击","Draw the shadow beast into the light"]):b.libraryEncounter?.bossId&&REGIONAL_BOSSES[b.libraryEncounter.bossId]?tr(REGIONAL_BOSSES[b.libraryEncounter.bossId].name)+phase:tr(kit.name)+" · "+tr(kit.enemy);
  button.hidden=!r.supportAvailable;button.disabled=r.supportUsed||!r.cast;button.setAttribute('aria-label',r.supportUsed?tr(['支援已使用','Support used']):r.cast?tr(['点击支援，解除本次攻击','Tap support to cancel this attack']):tr(['等待敌方预警后使用支援','Support becomes available during an enemy warning']));
  button.textContent=r.supportUsed?tr(["已支援","Support used"]):b.libraryEncounter?.bossId==="library"?tr(["打断镜影","Break the reflection"]):r.skyMethod==="fast-courier"?tr(["远帆 · 快速引航","Finn · Fast guidance"]):r.skyMethod==="escort-flight"?tr(["翎羽 · 并肩护航","Wren · Escort flight"]):tr(kit.support);
 }
 function useSupport(b){
  const r=b.regionalCombat;if(!r||!r.supportAvailable||r.supportUsed||!r.cast||b.done||cinematicActive(b))return false;
  if(b.libraryEncounter?.op==="battle:library-echo"&&(!catdexRecord(window.State.S)||!window.State.S.resonanceExploration?.interactions?.["library:M-02:puzzle:library-echo"]))return false;
  r.supportUsed=true;r.cast=null;r.next=Math.max(r.next,4);if(r.balance)r.recoveryUntil=b.t+1.8;
  const cats=living(b);
  if(r.kit.kind==="roots")for(const f of cats){f.rootT=0;f.rooted=false;if(f.status)delete f.status.bind;}
  else if(r.kit.kind==="mirror"){for(const e of b.liveEnemies())e.reflectT=0;}
  else if(r.kit.kind==="embers"){for(const f of cats){if(f.status)delete f.status.burn;}}
  else if(r.kit.kind==="gale"){const duration=r.skyMethod==="escort-flight"?1.8:.8,before=b.ult;for(const f of cats)f.inv=Math.max(f.inv||0,duration);if(r.skyMethod==="fast-courier")b.gainUlt(12);r.skySupportEffect={method:r.skyMethod,chargeBefore:before,chargeAfter:b.ult,protected:cats.length,duration};}
  else if(r.kit.kind==="orbit"){applyStarfallSupport(b,cats,window.State.difficulty());}
  else{for(const f of cats)f.shieldT=Math.max(f.shieldT||0,2.5);}
  for(const f of cats)b.vfx.ring(f.x,f.y,{r0:16,vr:170,life:.55,color:r.kit.color,width:4});
  notice(b,"地区伙伴已解除本次危险。","Local allies have cleared this hazard.");paintHud(b);return true;
 }
 function resolve(b,r,cast){
  if(r.balance)r.impact={cast,at:b.t};
  const controlled=target(b),avoided=controlled&&((controlled.inv||0)>0||!cast.patterns.some(p=>inPattern(p,controlled)));
  if(r.balance&&avoided){const master=b.libraryEncounter?.bossId==="mastery";r.recoveryUntil=b.t+(master?2.6:2.8);r.successfulDodges=(r.successfulDodges||0)+1;notice(b,...(master?["星轨已破解！守卫暂时失去防御。","Orbit broken! The guardian is briefly exposed."]:["成功避开攻击！趁破绽反击。","Attack evaded! Counter while the guardian is open."]));}
  if(avoided)applyRegionalKeepsake(b,window.State.S,"evade");
  const impactColor=r.balance?guardianColors(r.kit.kind,cast.element)[1]:r.kit.color;
  for(const f of living(b)){
   if(!cast.patterns.some(p=>inPattern(p,f)))continue;
   const hit=b.resolveHit(f,"wild",{element:cast.element||(r.kit.kind==="orbit"?(b.liveEnemies()[0]?.element||r.kit.element):r.kit.element),kind:"aoe",isBasic:false},Math.max(8,f.maxhp*(r.balance?.hazard??(r.kit.kind==="embers"?.14:.10))),f.x,f.y);
   if(hit?.dealt>0){
    if(r.kit.kind==="roots")f.rootT=Math.max(f.rootT||0,1.5);
    if(r.kit.kind==="gale"&&r.keepsakeGaleCast!==cast){const dir=f.x<b.W/2?-1:1;f.x=clamp(f.x+dir*38,32,b.W-32);}
    if(r.kit.kind==="mirror")f.vulnerableT=Math.max(f.vulnerableT||0,1.1);
   }
   b.vfx.ring(f.x,f.y,{r0:8,vr:220,life:.35,color:impactColor,width:3});
  }
  for(const p of cast.patterns)if(p.shape==="circle")b.vfx.ring(p.x,p.y,{r0:p.r*.3,vr:160,life:.45,color:impactColor,width:5});
 }
 function tick(b,dt){
  const r=b.regionalCombat;if(!r||b.done||b.captureSeq||b.coachHoldsEnemies?.()||b.game.battleHelpOpen||b.duoRun||b.duoCinematic||b.ultCinematic)return;
  if((r.hazardEnabled===false&&!b.postgameRuins)||!living(b).length||!b.liveEnemies().length)return;
  if(r.recoveryUntil&&b.t>=r.recoveryUntil){r.recoveryUntil=0;paintHud(b);}
  if(r.cast){
    if(r.kit.kind==="gale"&&r.keepsakeGaleCast!==r.cast){const direction=r.cycle%2?1:-1;for(const f of living(b)){if((f.inv||0)>0)continue;f.x=clamp(f.x+direction*22*Math.min(.05,dt),32,b.W-32);}}
    r.cast.remaining-=dt;
    if(b.autoMode&&r.cast.remaining>0&&r.cast.remaining<=.42){const danger=living(b).filter(f=>r.cast.patterns.some(p=>inPattern(p,f))&&!(f.inv>0));if(danger.length&&(danger.length>=2||danger.some(f=>f.hp/f.maxhp<.40))&&r.supportAvailable&&!r.supportUsed&&useSupport(b))return;for(const f of danger){if(f.dodgeCd>0||f._castRoot>0||f._beamRoot>0)continue;const reach=Math.max(35,f.speed*3*.28),angles=Array.from({length:12},(_,i)=>i*Math.PI/6);const safe=angles.find(a=>{const q={x:clamp(f.x+Math.cos(a)*reach,32,b.W-32),y:clamp(f.y+Math.sin(a)*reach,b.topMargin,b.H-b.bottomMargin)};return !r.cast.patterns.some(p=>inPattern(p,q));});if(safe!==undefined)b.dodge(f,safe);}}
    const second=Math.ceil(r.cast.remaining);if(r.hudSecond!==second){r.hudSecond=second;paintHud(b);}
    if(r.cast.remaining<=0){resolve(b,r,r.cast);r.cast=null;r.next=(r.balance?.period??r.kit.period)*(b.libraryEncounter?.bossId==="mastery"&&b.liveEnemies()[0]?.element==="dark"?.82:1);paintHud(b);}
    return;
  }
  r.next-=dt;
  if(r.next<=0){
   const t=target(b);if(!t)return;
   const master=b.libraryEncounter?.bossId==="mastery",element=r.kit.kind==="orbit"?(b.liveEnemies()[0]?.element||r.kit.element):r.kit.element,cycle=r.cycle++,warning=master?2.15:b.game?.isTouch?2.15:1.8;
   r.hudSecond=null;r.cast={remaining:warning,max:warning,element,patterns:master?buildMasteryPattern(b.W,b.H,b.topMargin,b.bottomMargin,cycle,element):buildPattern(r.kit.kind,b.W,b.H,b.topMargin,b.bottomMargin,t,cycle)};
   applyRegionalKeepsake(b,window.State.S,"warning");
   const line=master?(element==="dark"?["暗相横向封锁！进入未标记的安全带。","Dark horizontal seal! Move into the unmarked lane."]:["光相纵向封锁！进入未标记的安全带。","Light vertical seal! Move into the unmarked lane."]):b.libraryEncounter?.bossId==="library"?["镜影即将反击，躲开标记！","Mirror counter incoming: dodge the marked areas!"]:labels[r.kit.kind];notice(b,line[0],line[1]);paintHud(b);
  }
 }
 function draw(b,ctx){
  const r=b.regionalCombat,cast=r?.cast;if(!r)return;
  ctx.save();ctx.beginPath();ctx.rect(0,b.topMargin,b.W,Math.max(0,b.H-b.topMargin-b.bottomMargin));ctx.clip();
  if(r.balance){
   const impact=r.impact;
   if(impact&&b.t-impact.at<.38)drawGuardianCast(ctx,r.kit.kind,impact.cast,b.t-impact.at);
   if(cast)drawGuardianCast(ctx,r.kit.kind,cast);
   ctx.restore();return;
  }
  if(!cast){ctx.restore();return;}
  ctx.save();ctx.fillStyle="#cc6d58";ctx.strokeStyle="#cc6d58";ctx.lineCap="round";
  for(const p of cast.patterns){
    ctx.globalAlpha=.12;ctx.beginPath();
    if(p.shape==="circle"){ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();}
    else{ctx.lineWidth=p.w;ctx.moveTo(p.x1,p.y1);ctx.lineTo(p.x2,p.y2);ctx.stroke();}
    ctx.globalAlpha=.65;ctx.lineWidth=1.6;ctx.setLineDash([]);ctx.beginPath();
    if(p.shape==="circle"){ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.stroke();}
    else{const dx=p.x2-p.x1,dy=p.y2-p.y1,len=Math.hypot(dx,dy)||1,nx=-dy/len*p.w/2,ny=dx/len*p.w/2;ctx.moveTo(p.x1+nx,p.y1+ny);ctx.lineTo(p.x2+nx,p.y2+ny);ctx.moveTo(p.x1-nx,p.y1-ny);ctx.lineTo(p.x2-nx,p.y2-ny);ctx.stroke();}
    ctx.setLineDash([]);
  }
  ctx.restore();ctx.restore();
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
   const received=canonical?window.CatBondResonance?.supportProfile?.(region)?.received||[]:[];
   const supportAvailable=canonical&&(snapshot?.sanctuaries?.includes(region)||received.length>0);
   const skyMethods=region==="sky"?window.CatBondResonance?.view?.()?.support?.find(x=>x.region==="sky")?.methods||[]:[];const skyMethod=skyMethods.includes("fast-courier")?"fast-courier":skyMethods.includes("escort-flight")?"escort-flight":null;
   this.battle.regionalCombat={region,kit,hazardEnabled:manifestation,next:3.7,cast:null,cycle:0,supportAvailable,supportUsed:false,skyMethod};
   if(manifestation&&this.battle.enemies[1]){
    const e=this.battle.enemies[1];e.regionalEnemy=region;e.combatName=kit.enemy;e.element=kit.element;e.role=kit.kind==="gale"?"ambusher":kit.kind==="mirror"?"sharpshooter":"skirmisher";
    e.maxhp=Math.max(45,Math.round(e.maxhp*.48));e.hp=e.maxhp;e.poiseMax=Math.round(e.maxhp*.55);e.poise=e.poiseMax;e.regionalCd=2.6;e.regionalCycle=0;e.rotation=[];e.ultSkill=null;
   }
   mount(this,this.battle);
  }
  return result;
 };
 const shadowLight=b=>({x:b.W*.50,y:b.topMargin+(b.H-b.topMargin-b.bottomMargin)*.50,r:Math.min(118,b.W*.22,(b.H-b.topMargin-b.bottomMargin)*.28)*forgeLightScale(b,window.State.S)});
 const inLight=(b,e)=>{const l=shadowLight(b);return Math.hypot(e.x-l.x,e.y-l.y)<=l.r;};
 function shiftGuardian(b,e){
  if(!["starfall","mastery"].includes(b.libraryEncounter?.bossId)||!e?.regionalEnemy||e._darkPhase||!e.alive||e.hp<=0||e.hp>e.maxhp*.5)return;
  e._darkPhase=true;e.darkPhaseAt=b.t;e.element="dark";
  const color=guardianColors("orbit","dark")[1];
  b.vfx.ring(e.x,e.y,{r0:18,vr:145,life:.55,color,width:3});
  notice(b,...(b.libraryEncounter?.bossId==="mastery"?["暗相降临！下一次星轨转为横向封锁，光系攻击可克制。","Dark phase! The next seal turns horizontal; light attacks have the advantage."]:["暗相降临，光系攻击可克制。","Dark phase. Light attacks have the advantage."]));paintHud(b);
 }
 const hurt=BP.hurtEnemy;
 BP.hurtEnemy=function(e,dmg,...args){if(this.regionalCombat?.shadowLight&&!inLight(this,e))return 0;const r=this.regionalCombat;const tactical=r?.balance&&e.regionalEnemy;if(tactical){if(r.recoveryUntil>this.t)dmg*=this.libraryEncounter?.bossId==="mastery"?1.4:this.libraryEncounter?.bossId==="harbor"?1.25:1.4;else if(r.cast&&!r.shadowLight&&this.libraryEncounter?.bossId!=="harbor")dmg*=.85;}const result=hurt.call(this,e,dmg,...args);shiftGuardian(this,e);return result;};
 window.CatBondShadowCombat={steer(b,f){if(!b.regionalCombat?.shadowLight||!b.autoMode||!f.alive)return null;const l=shadowLight(b),dx=l.x-f.x,dy=l.y-f.y,d=Math.hypot(dx,dy);return d>18?{x:dx/d,y:dy/d}:{x:0,y:0};}};
 const capture=BP.startCaptureSeq;
 BP.startCaptureSeq=function(){if(this.libraryEncounter){if(this.done||this.liveEnemies().length)return;this.libraryEncounter.cleared=true;this.projectiles=[];this.enemyProjectiles=[];this.finish(true);return;}if(this.regionalCombat&&this.enemies.some(e=>e.regionalEnemy))this._lastDropped=this.enemies[0];return capture.call(this);};
 const update=BP.update;
 BP.update=function(dt){const result=update.call(this,dt);if(this.regionalCombat){tick(this,Math.min(.06,Math.max(0,this.libraryEncounter?(this._lastDt??dt*(this.tempoScale??.64)):dt*(this.tempoScale??.64))));activateCompanionTalents(this);if(!this.duoCinematic&&!this.ultCinematic&&!this.duoRun&&!this.game.battleHelpOpen)applyRegionalKeepsake(this,window.State.S,"tick");}if(this.libraryEncounter&&!this.done&&this.t>100){this._timeCapLoss=true;this.finish(false);}return result;};
 const playerProjectile=BP.spawnProj;
 BP.spawnProj=function(x,y,ang,spd,dmg,owner,color,r,kind,skill,life){if(this.libraryEncounter?.bossId==="library"&&owner==="me"&&skill&&!skill.isBasic){this.libraryEncounter.lastSkill={element:skill.element,color,spd,kind,homing:skill.homing,grow:skill.grow};}return playerProjectile.call(this,x,y,ang,spd,dmg,owner,color,r,kind,skill,life);};
 const enemyAI=BP.updateEnemyAI;
 BP.updateEnemyAI=function(dt,e,me){
  const r=this.regionalCombat;
  if(!r||!e.regionalEnemy)return enemyAI.call(this,dt,e,me);
  if(r.shadowLight&&me?.alive){const dx=me.x-e.x,dy=me.y-e.y,d=Math.hypot(dx,dy);if(d>32){e.x+=dx/d*Math.min(d,105*dt);e.y+=dy/d*Math.min(d,105*dt);}e.pose="idle";if(!inLight(this,e))e.reflectT=0;}
  const baseSpeed=e.speed,baseRole=e.role;
  if(r.kit.kind==="gale")e.speed*=1.28;
  if(r.kit.kind==="roots")e.speed*=.84;
  if(r.kit.kind==="orbit"){e.role=e.regionalCycle%2?"sharpshooter":"ambusher";shiftGuardian(this,e); }
  e.rotation=[];e.ultSkill=null;e.specialMeter=-10000;e.fireCd=99999;e.wardCd=99999;
  try{enemyAI.call(this,dt,e,me);}finally{e.speed=baseSpeed;e.role=baseRole;}
  e.fireCd=99999;
  if(!me?.alive)return;e.regionalCd-=dt;if(e.regionalCd>0)return;
  e.regionalCycle++;e.regionalCd=(r.balance?.shot??(r.kit.kind==="gale"?2.7:3.5))*(this.libraryEncounter?.bossId==="mastery"&&e._darkPhase?.80:1);
  const color=r.balance?guardianColors(r.kit.kind,e.element)[1]:r.kit.color;
  const a=Math.atan2(me.y-e.y,me.x-e.x),skill={element:r.kit.kind==="orbit"?e.element:r.kit.element,isBasic:true},fire=(angle,speed,mult,kind="ball")=>this.spawnProj(e.x,e.y,angle,speed,e.dmg*mult,"wild",color,7,kind,skill);
  switch(r.kit.kind){
   case "surge":for(let i=-2;i<=2;i++)fire(a+i*.20,168,.47);break;
   case "roots":for(let i=-1;i<=1;i++)this.spawnProj(e.x,e.y,a+i*.22,138,e.dmg*.55,"wild",r.kit.color,8,"leaf",{element:"grass",isBasic:false,appliesTag:"bind"});break;
   case "embers":for(let i=-1;i<=1;i++)fire(a+i*.28,220,.62,"forge-slag");break;
   case "gale":fire(a-.11,325,.66);fire(a+.11,325,.66);break;
   case "mirror":{const original=applyRegionalKeepsake(this,window.State.S,"mirror-counter"),copied=original?null:this.libraryEncounter?.lastSkill;if(copied){const k={element:copied.element||"dark",isBasic:false,homing:copied.homing?clamp(copied.homing,.1,4.2):undefined,grow:copied.grow?clamp(copied.grow,1,2):undefined};const kind=["ball","orb","fireball","lightningOrb","leaf","hex"].includes(copied.kind)?copied.kind:"ball";for(let i=-1;i<=1;i++)this.spawnProj(e.x,e.y,a+i*.18,clamp(copied.spd||200,120,320),e.dmg*.54,"wild",copied.color||r.kit.color,8,kind,k); }else fire(a,200,.78);if(!original)e.reflectT=Math.max(e.reflectT||0,.65);break;}
   case "orbit":{const master=this.libraryEncounter?.bossId==="mastery",dark=master&&e._darkPhase,n=dark?9:7;for(let i=0;i<n;i++)fire(a+i*Math.PI*2/n,dark?195:165,master?.49:.42);break;}
  }
  this.vfx.ring(e.x,e.y,{r0:10,vr:160,life:.45,color,width:3});
 };
 function drawSpotlight(b,ctx){
  const l=shadowLight(b),g=ctx.createRadialGradient(l.x,l.y,4,l.x,l.y,l.r);
  g.addColorStop(0,"#ffe3a066");g.addColorStop(.75,"#ffe3a044");g.addColorStop(1,"#ffe3a000");
  ctx.save();ctx.fillStyle=g;ctx.fillRect(l.x-l.r,l.y-l.r,l.r*2,l.r*2);
  ctx.strokeStyle="#f7d48c";ctx.lineWidth=2;ctx.setLineDash([5,6]);
  ctx.beginPath();ctx.arc(l.x,l.y,l.r,0,Math.PI*2);ctx.stroke();ctx.restore();
 }
 const drawBattle=BP.draw;
 BP.draw=function(ctx){
  const result=drawBattle.call(this,ctx);
  if(this.regionalCombat){
   syncCinematicHud(document.getElementById("cb-region-combat"),this);
   if(!cinematicActive(this)&&!this.regionalCombat.balance)draw(this,ctx);
  }
  return result;
 };
 const libraryOp="battle:mirror-guardian",libraryScene="library:M-02";
 const victoryNotes={
  harbor:["铃房恢复了安静。去找暮铃，告诉她这里发生的事。","The bell house is quiet. Find Luna and tell her what happened."],
  forest:["根须退回林中深处，林间小路重新畅通。","The roots retreat into the woods and the forest trail opens again."],
  forge:["剪影退入幕后，灯下的故事可以继续了。去找烬婆。","The shadow slips backstage. The lantern show can go on. Find Ember."],
  sky:["风切散去，岛屿之间又能平稳通行。","The shearing wind fades. The passage between the islands is calm again."],
  library:["镜影凝成微光，照出了真迹所在。","The reflection settles into a faint light, revealing the original."],
  starfall:["光与暗归于平衡，观星台重新安静下来。","Light and shadow return to balance. The observatory falls quiet."],
  mastery:["光暗星轨已平息，你的队伍通过了终局试炼。","The light and dark orbits settle. Your party has passed the postgame trial."]
 };
 const storyEcho={forge:{scene:"forge:E-03",op:"battle:shadow-beast",point:[.74,.40],title:["灯影剧场 · 剪影兽","Shadow theater · Shadow beast"],name:["剪影兽","Shadow beast"],clue:["剪影兽在灯光外免疫伤害。引它到发光的圆形舞台内再攻击。","The shadow beast is immune outside the light. Lure it into the glowing circle before attacking."]},harbor:{scene:"harbor:H-04",op:"battle:chime-beast",point:[.195,.50],title:["铃房 · 铃舌兽","Bell house · Belltongue Beast"],name:["铃舌兽","Belltongue Beast"],clue:["避开铃声预警光带，再接近攻击；预警期间可以请地区伙伴支援一次。","Leave the marked chime lanes before closing in. Local allies can cancel one telegraphed attack."]},forest:{...REGIONAL_BOSSES.forest,scene:"forest:R-04",op:"battle:root-guardian",title:["森林古铃 · 空白回响","Forest bell · Hollow Echo"]},sky:{...REGIONAL_BOSSES.sky,scene:"sky:S-03",op:"battle:gale-guardian",title:["云海古铃 · 空白回响","Sky bell · Hollow Echo"]},library:{...REGIONAL_BOSSES.library,title:REGIONAL_BOSSES.library.name},starfall:{...REGIONAL_BOSSES.starfall,title:REGIONAL_BOSSES.starfall.name}};
 function libraryAvailable(game,id="library",optional=false){
  const d=optional?REGIONAL_BOSSES[id]:storyEcho[id],v=window.CatBondResonance?.view(),root=window.State.S,region=d?.region||id,w=root.resonanceExploration,p=w?.positions?.[region],q=d?.point;
  return !!(d&&game?.scene==="map"&&!game.battle&&w?.location===region&&p&&Math.hypot(p.x-q[0],p.y-q[1])<.072&&(optional?optionalBossAvailable(id,v,w):v?.current?.id===d.scene&&v.objective[0]===d.op));
 }
 function prepareLibrary(game,id="library",optional=false){
  if(!libraryAvailable(game,id,optional))return false;
  const d=optional?REGIONAL_BOSSES[id]:storyEcho[id],region=d.region||id,root=window.State.S,host=window.CatBondResonance,team=window.UI.getPreferredBattleTeam();
  if(!team.length)return false;const sp=window.GameData.speciesById(bossTemplates[id]);if(!sp)return false;const creature=region==="forge"?canonArt("shadow-beast"):art[region]?.enemy;if(!imageReady(creature)||(region==="starfall"&&!imageReady(orbitalArt[id==="mastery"?"mastery":"dark"]))){game.toast?.({zh:"守卫原画尚未加载，请稍后再次挑战。",en:"Guardian artwork is not ready. Please try again."});return false;}host.close?.();
  window.UI.openBattleModePrompt(team,sp,{origin:"map",storyTitle:d.title||d.name,bossElement:REGION_KITS[region].element,regionalGuardian:true,
   bossSecondElement:region==="starfall"?"dark":null,bossClue:[d.clue[0]+" 避开预警攻击后抓住短暂破绽反击。"+(id!=="mastery"&&hasRegionalKeepsake(root,region)?" "+regionalKeepsakes[region].description[0]:""),d.clue[1]+" Evade the marked attack, then counter during the brief opening."+(id!=="mastery"&&hasRegionalKeepsake(root,region)?" "+regionalKeepsakes[region].description[1]:"")],onStart:fighters=>{
   if(root!==window.State.S||!libraryAvailable(game,id,optional)||!fighters.length)return;
   const token=host.captureAction(),base={...sp,encounterLevel:regionalBossLevel(id,fighters)};
   game._returnScene="map";game._battleTheme={region,sky1:"#20253f",sky2:"#697ca8",ground:"#464967",ground2:"#232843",accent:REGION_KITS[region].color};
   game.startBattle(fighters,base,{storyEncounter:"regional-boss",pack:[base]});const b=game.battle;if(!b)return;
   b.storyEncounter=true;b.captureReady=false;b.libraryEncounter={root,token,cleared:false,region,scene:d.scene,op:d.op,optional,bossId:id,reward:bossReward(id,root.resonanceExploration)};
   const balance=guardianProfile(id,b.team,window.State.difficulty());
   const methods=host.supportProfile?.(region)?.methods||[],skyMethod=methods.includes("fast-courier")?"fast-courier":methods.includes("escort-flight")?"escort-flight":null;
   b.regionalCombat={region,kit:REGION_KITS[region],balance,next:balance.first,cast:null,cycle:0,supportAvailable:true,supportUsed:false,skyMethod};
   if(region==="forge")b.regionalCombat.shadowLight=true;
   const echo=b.enemies[0];if(echo){echo.regionalEnemy=region;echo.isBoss=true;echo.combatName=d.name;echo.element=REGION_KITS[region].element;echo.role=region==="forge"?"brawler":"sharpshooter";echo.regionalCd=balance.first;echo.regionalCycle=0;echo.rotation=[];echo.ultSkill=null;echo.maxhp=balance.hp;echo.dmg*=balance.attack;echo.hp=echo.maxhp;echo.poiseMax=Math.round(echo.maxhp*.6);echo.poise=echo.poiseMax;}
   mount(game,b);game.updateBattleUI?.();if(d.clue)notice(b,...d.clue);
  }});return true;
 }
 window.addEventListener("cat-bond-resonance-battle-request",event=>{const x=event.detail,d=storyEcho[x?.region];if(d&&x.sceneId===d.scene&&x.operation===d.op&&!prepareLibrary(window.__game,x.region))window.__game?.toast?.({zh:"请前往守卫所在的位置。",en:"Approach the guardian first."});});
 function showLibraryResult(game,owner,recovery,outcome,region="library",encounter={}){
  const ui=window.UI;if(!ui?.panel||window.State.S!==owner)return;
  const win=outcome==="win",retry=!win,title=REGIONAL_BOSSES[encounter.bossId]?(win?(encounter.bossId==="mastery"?["星轨大师试炼通过","Orbital Master Trial cleared"]:[REGIONAL_BOSSES[encounter.bossId].name[0]+"已击败",REGIONAL_BOSSES[encounter.bossId].name[1]+" defeated"]):[outcome==="save-failed"?"战斗记录未保存":"挑战未完成",outcome==="save-failed"?"Battle result not saved":"Challenge incomplete"]):region==="forge"?(win?["剪影兽已消散","Shadow beast defeated"]:["灯影挑战未完成","Shadow challenge incomplete"]):region==="harbor"?(win?["铃舌兽已消散","Belltongue Beast defeated"]:["铃房仍不安全","Bell house still unsafe"]):region==="forest"?(win?["空响已消散","Hollow echo dispelled"]:["救援尚未完成","Rescue incomplete"]):region==="starfall"?(win?["星轨守卫已消散","Orbital guardian defeated"]:["星轨挑战未完成","Orbital challenge incomplete"]):win?["守档幻象已消散","Archive echo defeated"]:outcome==="retreat"?["已从镜影战斗撤退","Retreated from the archive echo"]:outcome==="save-failed"?["战斗记录未保存","Battle result not saved"]:["队伍在镜影战斗中落败","Squad defeated by the archive echo"];
  const detail=REGIONAL_BOSSES[encounter.bossId]?(win?(encounter.optional?["挑战完成，可以继续探索。","Challenge cleared. Continue exploring."]:["道路已安全，可以继续主线。","The path is safe. Continue your journey."]):["保留任务进度。休整或更换队伍后再试。","Quest progress is preserved. Rest or change your party and retry."]):region==="forge"?(win?["影戏重新清晰了。去找烬婆。","The shadows are clear again. Find Ember."]:["将剪影兽引到灯光下，休整后再试。","Lure the beast into the light and try again."]):region==="harbor"?(win?["铃房安静下来了。去找暮铃。","The bell house is quiet. Find Luna."]:["休整后再试。","Rest and try again."]):region==="forest"?(win?["根须松动了。沿水道找到被困的猫咪。","The roots loosened. Follow the channel to the trapped cats."]:["芽禾仍稳住水道，已调查的水痕不会丢失。休整后再试。","Fern is holding the channel; the trail remains verified. Rest and retry."]):region==="starfall"?(win?["观星台已安全。现在可以验证六地的分布式航线。","The observatory is safe. Verify the six regions’ distributed routes."]:["休整或更换队伍后再试。","Rest or change your team and try again."]):win?["真实记忆已核实。壁画中的身份线索可以继续调查。","The original memory is verified. Continue investigating the identity shown in the mural."]:["猫咪和档案进度已保留。休整或更换上阵猫咪后可以再次挑战。","Your cats and archive progress are preserved. Rest or change your team before trying again."];
  ui.panel('<span class="card-close">×</span><h2 class="center">'+tr(title)+'</h2><p class="sub">'+tr(win&&!encounter.optional?["空白回响消散，古铃恢复正常。","The Hollow Echo is gone. The ancient bell is restored."]:win&&victoryNotes[encounter.bossId]?victoryNotes[encounter.bossId]:detail)+'</p>'+(win&&encounter.optional?'<p class="center sub">'+tr(encounter.reward?.some(Boolean)?["首次挑战完成 · 胜利已记录","First clear · Victory recorded"]:["再次挑战成功 · 首次奖励已领取","Rematch cleared · First-clear reward already claimed"])+'</p>':'')+(win&&encounter.reward?.some(Boolean)?'<p class="center">+'+encounter.reward[0]+' '+tr(["金币","coins"])+' · +'+encounter.reward[1]+' '+tr(["小鱼干","fish"])+' · '+encounter.reward[2]+tr([' 参战猫咪经验',' XP per participating cat'])+'</p>':'')+(ui.battleRecoveryMarkup?.(recovery)||'')+'<div class="btn-row" style="justify-content:center">'+(retry?'<button type="button" class="btn gold" id="library-retry-encounter">'+tr(["再次挑战","Retry encounter"])+'</button>':'')+'<button type="button" class="btn '+(retry?'ghost':'gold')+'" id="library-battle-ok">'+tr(["继续探索","Continue exploring"])+'</button></div>');
  const ok=document.getElementById("library-battle-ok"),again=document.getElementById("library-retry-encounter");if(ok){
   ok.closest(".card")?.classList.add("cb-guardian-result");
   ok.onclick=()=>ui.closeAll();
  }
  if(again)again.onclick=()=>{ui.closeAll();if(owner!==window.State.S||!prepareLibrary(game,encounter.bossId||region,encounter.optional))game.toast({zh:"请重新前往守卫所在的位置。",en:"Return to the guardian's location to retry."});};
 }
 const end=GP.endBattle;
 GP.endBattle=function(){
  const b=this.battle,ruins=b?.postgameRuins,host=window.CatBondResonance;
  if(b?.libraryEncounter){
   const f=b.libraryEncounter,root=window.State.S,valid=f.root===root&&host?.isCurrentAction?.(f.token),win=b.done&&b.result==="win"&&f.cleared,recovery={mode:window.State.difficulty(),fromMap:true,team:[]};let saved=false;
   if(valid){const oldCoins=root.coins,oldFish=root.fish,oldCats=(root.cats||[]).map(c=>[c,JSON.parse(JSON.stringify(c))]),oldShowcase=root.firstDuoShowcasePending,oldWorld=root.resonanceExploration;
    try{const seen=new Set();for(const fighter of [...(b.team||[]),...(b._benchFighters?.values?.()||[])]){if(!fighter.cat||fighter._reinforcement||seen.has(fighter.cat.uid))continue;seen.add(fighter.cat.uid);const before=fighter.alive?Math.max(.15,Math.min(1,fighter.hp/fighter.maxhp)):.15,after=recovery.mode==="hardcore"?window.State.setBattleHealth(fighter.cat,before):1;if(after===1){delete fighter.cat._hpFrac;delete fighter.cat._hpAt;}recovery.team.push({name:window.State.catName(fighter.cat),before:Math.round(before*100),after:Math.round(after*100)});}if(window.State.difficulty()!=="hardcore")for(const cat of root.cats||[]){delete cat._hpFrac;delete cat._hpAt;}if(b._firstDuoShowcase&&b.duoUses>0)root.firstDuoShowcasePending=false;
     if(win){const [coins,fish,xp]=f.reward||[38,2,28];root.coins=(root.coins||0)+coins;root.fish=(root.fish||0)+fish;const participants=new Map([...(b.team||[]),...(b._benchFighters?.values?.()||[])].filter(f=>f.cat&&!f._reinforcement).map(f=>[f.cat.uid,f.cat]));for(const c of participants.values()){if(xp>0){window.State.addXp?.(c,xp);c.battlesWon=(c.battlesWon||0)+1;}}if(f.optional){if(!optionalBossAvailable(f.bossId,host.view(),root.resonanceExploration)||!atBoss(f.bossId,root.resonanceExploration))throw Error("Boss position changed");root.resonanceExploration={...root.resonanceExploration,interactions:{...root.resonanceExploration.interactions,[bossKey(f.bossId)]:true}};saved=!!window.State.save()?.ok;}else{if(["forest","sky"].includes(f.bossId))root.resonanceExploration={...root.resonanceExploration,interactions:{...root.resonanceExploration.interactions,[bossKey(f.bossId)]:true}};saved=!!host.recordEvidence({sceneId:f.scene,operation:f.op,region:f.region,verified:true,outcome:"win",token:f.token})?.ok;}}else saved=!!window.State.save()?.ok;
     if(!saved)throw Error("Library outcome save rejected");
    }catch(err){root.coins=oldCoins;root.fish=oldFish;root.firstDuoShowcasePending=oldShowcase;root.resonanceExploration=oldWorld;for(const [c,old] of oldCats){for(const k of Object.keys(c))if(!(k in old))delete c[k];Object.assign(c,old);}console.error(err);}
   }
   document.getElementById("cb-region-combat")?.remove();document.getElementById("battle-ui")?.classList.remove("on");const duo=document.getElementById("duo-burst");if(duo)duo.hidden=true;this.setBattleHelpVisible?.(false);this.battle=null;this._returnScene=null;this.scene="map";document.body.classList.add("cb-exploring");this.refreshHUD?.();window.WorldMap?.resumeRegion?.(false);
   window.MorrowwishMusic?.switchScene?.("map");if(valid){if(win&&saved){window.MorrowwishAudio?.effect?.("combat_win");if(!f.optional)window.MorrowwishAudio?.note?.(523.25,.42,.15);}showLibraryResult(this,root,recovery,saved?(win?"win":b._voluntaryFlee?"retreat":"defeat"):"save-failed",f.region,f);}return;
  }
  let committed=null;
  if(ruins&&b.done&&b.result==="win"&&ruins.root===window.State.S&&host?.isCurrentAction?.(ruins.token) ){
   const duoPromise=ruins.mode==="duo"&&ruins.promised&&b.duoUses>0;
   committed=host.commitRuinsVictory({attemptId:ruins.attemptId,duoPromise,verified:true,outcome:"win",token:ruins.token});
  }
  if(b?.regionalCombat)document.getElementById("cb-region-combat")?.remove();
  const result=end.call(this);
  if(ruins&&ruins.root===window.State.S){
   const outcome=b.result==="win"?(committed?.ok?"saved":"save-failed"):"defeat";
   const card=document.querySelector("#panel.open .card");
   if(card){const p=document.createElement("p");p.dataset.ruinsResult=outcome;p.dataset.ruinsDuo=String(ruins.mode==="duo"&&ruins.promised&&b.duoUses>0);p.setAttribute("role","status");p.className="sub";p.textContent=outcome==="saved"?tr(["星铃废墟挑战完成，探索奖励已保存。","Star Bell Ruins cleared; exploration rewards saved."]):outcome==="save-failed"?tr(["捕捉胜利，但探索奖励未保存。请再次挑战。","Capture won, but the exploration reward was not saved. Retry the challenge."]):tr(["挑战未获胜，队伍与任务进度已保留。","Challenge not won. Your party and quest progress are preserved."]);card.prepend(p);}
   if(outcome==="save-failed")console.error("Ruins victory transaction rejected",committed?.reason||"stale or missing action",ruins.attemptId);
   if(committed?.ok)this.toast({zh:"星铃废墟挑战完成，探索奖励已保存。",en:"Star Bell Ruins cleared; exploration rewards saved."});
   else if(outcome==="save-failed")this.toast({zh:"挑战记录未保存，可以再次挑战。",en:"Challenge record was not saved. You can retry."});
  }
  return result;
 };
 window.addEventListener("resize",()=>requestAnimationFrame(()=>positionObjectiveHud(document.getElementById("cb-region-combat"))));
 window.addEventListener("morrowwish-language-change",()=>{const b=window.__game?.battle;if(b?.regionalCombat){paintHud(b);requestAnimationFrame(()=>positionObjectiveHud(document.getElementById("cb-region-combat")));}});
}
if(typeof window!=="undefined")install();
