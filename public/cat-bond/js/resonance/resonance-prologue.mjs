// Canonical prologue lifecycle. It never grants cinematic evidence when
// approved artwork is absent, and never loads the retired campaign.
import {campaign} from "./campaign.mjs";
const tr=(zh,en)=>window.MorrowwishI18n?.get?.()==="zh"?zh:en;
const asset=new URL("../../assets/npc/props/bell-shell.svg",import.meta.url).href;
function install(){
 const api=window.CatBondResonance,stage=document.getElementById("stage");if(!api||!stage)return;
 let bell=null,drag=null,slot=null,cinematic=null,attempted=null,starting=false,initialized=null,initAt=0,enteredGarden=null;
 function closeBell(){bell?.remove();bell=null;drag=null}
 function drawBell(){
  if(bell)return;bell=document.createElement("button");bell.type="button";bell.className="res-garden-bell";bell.setAttribute("aria-label",tr("拉动花园的旧铃","Pull the old garden bell"));
  const im=document.createElement("img");im.src=asset;im.alt="";im.draggable=false;const rope=document.createElement("span");rope.className="res-bell-rope";const label=document.createElement("span");label.className="res-bell-label";label.textContent=tr("向下拉动铃绳","Pull the bell cord down");bell.append(im,rope,label);stage.append(bell);
  bell.onpointerdown=e=>{if(e.button>0||drag)return;bell.setPointerCapture(e.pointerId);drag={id:e.pointerId,y:e.clientY,pull:0,slot:window.State.S};e.preventDefault()};
  bell.onpointermove=e=>{if(drag?.id!==e.pointerId)return;drag.pull=Math.max(0,Math.min(95,e.clientY-drag.y));bell.style.setProperty("--pull",drag.pull+"px");bell.style.setProperty("--swing",Math.min(14,drag.pull/5)+"deg")};
  bell.onpointerup=e=>{if(drag?.id!==e.pointerId)return;const d=drag;drag=null;bell.style.setProperty("--pull","0px");bell.style.setProperty("--swing","0deg");if(d.slot===window.State.S&&d.pull>=45)ring()};
  bell.onpointercancel=()=>{drag=null;bell?.style.setProperty("--pull","0px");bell?.style.setProperty("--swing","0deg")};
  let keys=0;bell.onkeydown=e=>{if(e.key!=="ArrowDown"&&e.key!=="Enter")return;e.preventDefault();if(e.key==="ArrowDown"){keys=Math.min(60,keys+15);bell.style.setProperty("--pull",keys+"px");bell.style.setProperty("--swing",keys/5+"deg");}else if(keys>=45){keys=0;ring()}};
 }
 function ring(){
  if(!bell||window.__game?.scene!=="yard")return;
  const v=api.view();if(v.current?.id!=="prologue:P-04"||!v.objective.includes("explore:garden-bell"))return;
  const r=api.recordEvidence({sceneId:"prologue:P-04",operation:"explore:garden-bell",region:"garden",verified:true});
  if(!r.ok){bell.querySelector(".res-bell-label").textContent=tr("保存失败，再拉一次","Save failed. Pull again.");return}
  window.MorrowwishAudio?.effect?.("discover");window.MorrowwishAudio?.note?.(660,.6,.2);closeBell();api.showCurrent();
 }
 async function playCurrent(){
  if(starting||cinematic||document.querySelector(".res-host,.res-ambient"))return false;
  const v=api.view(),s=v.current,operation=v.objective.find(o=>o.startsWith("cinematic:"));if(!s||!operation)return false;
  const library=window.CatBondCinematicScenes,provider=window.CatBondCinematicPresentation;
  if(!Array.isArray(library)||!provider?.create)return false;
  const item=library.find(x=>x.id===s.id.replace(":","/")&&(x.approved===true||x.productionApproved===true||x.approval==="approved"));
  if(!item?.frames?.length)return false;
  const key=s.id+":"+String(item.version||item.frames[0].image);if(attempted===key)return false;
  starting=true;attempted=key;const owner=window.State.S;
  try{
   // All frames must be real, decoded artwork. Never complete on a missing image.
   await Promise.all(item.frames.map(f=>new Promise((resolve,reject)=>{if(!f.image){reject(Error("missing art"));return}const img=new Image();img.onload=resolve;img.onerror=reject;img.src=f.image})));
   if(owner!==window.State.S||api.view().current?.id!==s.id)return false;
   const overlay=document.createElement("section");overlay.className="cb-story-overlay is-visible res-cinematic";stage.append(overlay);
   let loaded=0;const finish=event=>{
    if(!cinematic||event.sceneId!==item.id)return;
    const p=cinematic;cinematic=null;p.player.destroy();p.overlay.remove();
    if(owner!==window.State.S||api.view().current?.id!==s.id||loaded===0)return;
    const r=api.recordEvidence({sceneId:s.id,operation,region:s.chapter,verified:true});if(!r.ok){attempted=null;return}
    // Present the complete official dialogue after the art sequence, rather
    // than counting a partial cinematic caption as a canonical line.
    if(s.lines.length)api.showCurrent();
   };
   const player=provider.create(overlay,{language:()=>window.MorrowwishI18n?.get?.()==="zh"?"zh":"en",onFrameChange:()=>loaded++,onComplete:finish,onSkip:finish});
   cinematic={player,overlay,owner};
   // Canonical campaign owns dialogue text; image provider owns visual playback.
   const presentation={...item,frames:item.frames.map(f=>({...f,subtitle:null})),allowSkip:item.allowSkip!==false};
   player.register(presentation);player.play(presentation.id);return true;
  }catch(error){console.warn("Canonical cinematic unavailable",s.id,String(error));if(cinematic){cinematic.player.destroy();cinematic.overlay.remove();cinematic=null}return false}
  finally{starting=false}
 }
 function tick(){
  const game=window.__game,root=window.State.S;
  if(root!==slot){slot=root;attempted=null;enteredGarden=null;closeBell();if(cinematic){cinematic.player.destroy();cinematic.overlay.remove();cinematic=null}}
  if(!window.__CAT_BOND_STARTED__||!root.gameStarted||!root.cats?.length||game?.scene==="battle"){closeBell();return}
  if(!root.resonance&&Date.now()-initAt>2500){initAt=Date.now();api.initialize()}
  const v=api.view(),id=v.current?.id;
  if(id==="prologue:P-04"&&v.objective.includes("explore:garden-bell")&&!document.querySelector(".res-host,.res-ambient,.res-cinematic")){
   if(game.scene==="map"&&enteredGarden!==root){enteredGarden=root;window.WorldMap?.exitToYard?.()}
   if(game.scene==="yard")drawBell();else closeBell();
  }else closeBell();
  if(id==="prologue:P-05"&&v.objective.includes("travel:harbor")&&game.scene==="map"&&window.WorldMap?.mode==="region"&&root.resonanceExploration?.location==="harbor"){
   const result=api.recordEvidence({sceneId:id,operation:"travel:harbor",region:"harbor",verified:true});if(result.ok)api.showCurrent();
  }
  if(v.objective.some(o=>o.startsWith("cinematic:")))playCurrent();
 }
 window.addEventListener("morrowwish-language-change",()=>{if(bell){bell.setAttribute("aria-label",tr("拉动花园的旧铃","Pull the old garden bell"));bell.querySelector(".res-bell-label").textContent=tr("向下拉动铃绳","Pull the bell cord down")}});
 window.addEventListener("cat-bond-resonance-changed",tick);setInterval(tick,250);
 window.CatBondResonanceCinematics=Object.freeze({playCurrent});
}
if(document.readyState==="complete")install();else document.addEventListener("DOMContentLoaded",install,{once:true});
