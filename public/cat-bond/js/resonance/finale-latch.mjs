const text=(zh,en)=>window.MorrowwishI18n?.get?.()==="zh"?zh:en;

export function openFinaleLatch(){
 const api=window.CatBondResonance, view=api.view(), stage=document.getElementById("stage");
 const operation="mechanism:muling-unlock";
 if(!stage||document.querySelector(".res-finale-latch")||view.current?.id!=="finale:B-03"||
    view.cursor!==view.current.lines.length||!view.objective.includes(operation)||
    !view.ring||window.__game?.scene!=="map"||window.WorldMap.currentRegion!=="starfall")return;
 const token=api.captureAction();
 const overlay=document.createElement("section");
 overlay.className="cb-story-overlay is-visible res-finale-latch";
 overlay.setAttribute("role","dialog");
 overlay.setAttribute("aria-modal","true");
 const card=document.createElement("div");
 const heading=document.createElement("h2"),hint=document.createElement("p"),progress=document.createElement("progress");
 const hold=document.createElement("button"),cancel=document.createElement("button");
 hold.type=cancel.type="button";
 progress.max=1; progress.value=0;
 card.append(heading,hint,progress,hold,cancel);overlay.append(card);stage.append(overlay);
 let started=null, frame=0;
 function render(){
  heading.textContent=text("最后的锁","The last lock");
  hint.textContent=text("扶住放松的铃链，让暮铃打开最后一道锁。","Hold the loose bell chain while Muling opens the last lock.");
  hold.textContent=text("按住铃链","Hold the bell chain");
  cancel.textContent=text("返回","Back");
  overlay.setAttribute("aria-label",heading.textContent);
 }
 function reset(){started=null;cancelAnimationFrame(frame);progress.value=0;}
 function close(){
  reset();overlay.remove();
  window.removeEventListener("morrowwish-language-change",render);
  window.removeEventListener("cat-bond-resonance-changed",check);
  window.removeEventListener("cat-bond-active-save-changed",close);
  window.removeEventListener("pagehide",close);
  window.removeEventListener("blur",reset);
 }
 function check(){if(!api.isCurrentAction(token)||window.__game?.scene!=="map"||window.WorldMap?.currentRegion!=="starfall")close();}
 function tick(now){
  if(!api.isCurrentAction(token)||window.__game?.scene!=="map"||window.WorldMap?.currentRegion!=="starfall"){close();return;}
  if(started===null)return;
  progress.value=Math.min(1,(now-started)/1450);
  if(progress.value<1){frame=requestAnimationFrame(tick);return;}
  const result=api.recordEvidence({sceneId:view.current.id,operation,region:"starfall",verified:true,token});
  if(result.ok){
   window.MorrowwishAudio?.effect?.("discover");
   close();
  }else{reset();hint.textContent=text("存档失败，请再试一次。","The save failed. Try again.");}
 }
 function start(){if(started!==null)return;started=performance.now();frame=requestAnimationFrame(tick);}
 hold.onpointerdown=event=>{if(event.button>0)return;hold.setPointerCapture(event.pointerId);start();};
 hold.onpointerup=hold.onpointercancel=hold.onlostpointercapture=reset;
 hold.onkeydown=event=>{if([" ","Enter"].includes(event.key)){event.preventDefault();start();}};
 hold.onkeyup=event=>{if([" ","Enter"].includes(event.key)){event.preventDefault();reset();}};
 hold.onblur=reset;
 cancel.onclick=close;
 overlay.onkeydown=event=>{if(event.key==="Escape")close();};
 window.addEventListener("morrowwish-language-change",render);
 window.addEventListener("cat-bond-resonance-changed",check);
 window.addEventListener("cat-bond-active-save-changed",close);
 window.addEventListener("pagehide",close);
 window.addEventListener("blur",reset);
 render();hold.focus();
}
