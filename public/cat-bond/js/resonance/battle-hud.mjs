// Shared battle HUD geometry; presentation never mutates battle or save state.
export function objectiveTop(host,rectangles){
 const relevant=rectangles.filter(r=>r&&r.width>0&&r.height>0);
 return Math.max(0,Math.round(Math.max(host.top,...relevant.map(r=>r.bottom))-host.top+7));
}
export function positionObjectiveHud(panel){
 if(!panel)return;
 const host=document.getElementById("battle-ui"),header=host?.querySelector(".battle-topbar");
 if(!host||!header)return;
 const frame=host.getBoundingClientRect(),top=header.getBoundingClientRect(),box=panel.getBoundingClientRect();
 if(!frame.height||!top.height||!box.width)return;
 const rails=[...host.querySelectorAll("#battle-squad-rail,#ult-wrap,#duo-burst")].filter(el=>!el.hidden&&getComputedStyle(el).visibility!=="hidden"&&getComputedStyle(el).display!=="none").map(el=>el.getBoundingClientRect()).filter(r=>r.right>box.left+1&&r.left<box.right-1);
 const value=objectiveTop(frame,[top,...rails])+"px";
 if(panel.style.getPropertyValue("--cb-rpg-hud-top")!==value)panel.style.setProperty("--cb-rpg-hud-top",value);
}
const watched=new WeakMap();
export function watchObjectiveHud(panel){
 if(!panel||watched.has(panel))return;
 const host=document.getElementById("battle-ui");
 if(!host)return;
 const observer=new ResizeObserver(()=>positionObjectiveHud(panel));
 const lifecycle=new MutationObserver(()=>{if(!panel.isConnected){observer.disconnect();lifecycle.disconnect();watched.delete(panel);return;}positionObjectiveHud(panel);});
 watched.set(panel,observer);
 for(const el of [host,panel,...host.querySelectorAll(".battle-topbar,#battle-squad-rail,#ult-wrap,#duo-burst")])observer.observe(el);
 lifecycle.observe(host,{childList:true,subtree:true,attributes:true,attributeFilter:["hidden","class"]});
 requestAnimationFrame(()=>positionObjectiveHud(panel));
}
export function cinematicActive(b){return !!(b?.duoCinematic||b?.ultCinematic);}
export function syncCinematicHud(panel,b){
 if(!panel)return;
 const value=String(cinematicActive(b));
 if(panel.dataset.cinematic!==value)panel.dataset.cinematic=value;
}
