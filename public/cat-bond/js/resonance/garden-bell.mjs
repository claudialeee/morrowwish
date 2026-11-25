// The garden bell is physical evidence for the canonical Awakening scene.
const tr=(zh,en)=>window.MorrowwishI18n?.get?.()==="zh"?zh:en;
const asset=new URL("../../assets/npc/props/bell-sunlit.webp",import.meta.url).href;
function install(){
 const api=window.CatBondResonance,stage=document.getElementById("stage");if(!api||!stage)return;
 let bell=null,drag=null;
 function closeBell(){bell?.remove();bell=null;drag=null}
 function drawBell(){
  if(bell)return;bell=document.createElement("button");bell.type="button";bell.className="res-garden-bell";bell.setAttribute("aria-label",tr("拉动花园的旧铃","Pull the old garden bell"));
  const im=document.createElement("img");im.src=asset;im.alt="";im.draggable=false;const rope=document.createElement("span");rope.className="res-bell-rope";const label=document.createElement("span");label.className="res-bell-label";label.textContent=tr("向下拉动铃绳","Pull the bell cord down");bell.append(im,rope,label);stage.append(bell);
  const token=api.captureAction();
  bell.onpointerdown=e=>{if(e.button>0||drag)return;bell.setPointerCapture(e.pointerId);drag={id:e.pointerId,y:e.clientY,pull:0,slot:window.State.S};e.preventDefault()};
  bell.onpointermove=e=>{if(drag?.id!==e.pointerId)return;drag.pull=Math.max(0,Math.min(95,e.clientY-drag.y));bell.style.setProperty("--pull",drag.pull+"px");bell.style.setProperty("--swing",Math.min(14,drag.pull/5)+"deg")};
  bell.onpointerup=e=>{if(drag?.id!==e.pointerId)return;const d=drag;drag=null;bell.style.setProperty("--pull","0px");bell.style.setProperty("--swing","0deg");if(d.slot===window.State.S&&d.pull>=45)ring(token)};
  bell.onpointercancel=()=>{drag=null;bell?.style.setProperty("--pull","0px");bell?.style.setProperty("--swing","0deg")};
  let keys=0;bell.onkeydown=e=>{if(e.key!=="ArrowDown"&&e.key!=="Enter")return;e.preventDefault();if(e.key==="ArrowDown"){keys=Math.min(60,keys+15);bell.style.setProperty("--pull",keys+"px");bell.style.setProperty("--swing",keys/5+"deg");}else if(keys>=45){keys=0;ring(token)}};
 }
 function ring(token){
  if(!bell||window.__game?.scene!=="yard")return;
  const v=api.view();if(v.current?.id!=="prologue:P-04"||!v.objective.includes("explore:garden-bell"))return;
  const r=api.recordEvidence({sceneId:"prologue:P-04",operation:"explore:garden-bell",region:"garden",verified:true,token});
  if(!r.ok){bell.querySelector(".res-bell-label").textContent=tr("保存失败，再拉一次","Save failed. Pull again.");return}
  window.MorrowwishAudio?.effect?.("discover");window.MorrowwishAudio?.note?.(660,.6,.2);closeBell();
 }
 function refresh(){
  const game=window.__game;
  if(!window.__CAT_BOND_STARTED__||game?.scene!=="yard"){closeBell();return;}
  const view=api.view();
  if(view.current?.id==="prologue:P-04"){
   if(view.objective.includes("explore:garden-bell")&&view.cursor===view.current.lines.length)drawBell();
   else closeBell();
  }else{
   closeBell();
   if(view.current?.id==='prologue:P-05'&&view.cursor<view.current.lines.length)api.showCurrent();
  }
 }
 window.addEventListener("cat-bond-garden-entered",refresh);
 window.addEventListener("cat-bond-resonance-changed",refresh);
 window.addEventListener("morrowwish-language-change",()=>{
  if(!bell)return;
  bell.setAttribute("aria-label",tr("拉动花园的旧铃","Pull the old garden bell"));
  bell.querySelector(".res-bell-label").textContent=tr("向下拉动铃绳","Pull the bell cord down");
 });
}
document.addEventListener("DOMContentLoaded",install,{once:true});
