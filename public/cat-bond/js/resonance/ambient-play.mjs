import {ambientGames,createAmbientGame} from "./ambient-puzzles.mjs";
const rootUrl=new URL("../../assets/npc/props/",import.meta.url);
const locale=()=>window.MorrowwishI18n?.get?.()==="zh"?"zh":"en";
const t=(zh,en)=>locale()==="zh"?zh:en;
function install(){
 const stage=document.getElementById("stage"),api=window.CatBondResonance;if(!stage||!api)return;
 let overlay=null,session=null,actor=null,slot=null,token=null,game=null,drag=null,persisted=false;
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n};
 function close(){overlay?.remove();overlay=null;session=null;actor=null;slot=null;token=null;game=null;drag=null;persisted=false}
 function render(){
  if(!overlay||!session)return;
  const data=session.game,step=data.steps[session.stage()];overlay.replaceChildren();
  const header=el("header","res-ambient-head");header.append(el("h2","",data[locale()]));const closeBtn=el("button","","×");closeBtn.type="button";closeBtn.setAttribute("aria-label",t("关闭","Close"));closeBtn.onclick=close;const controls=el("div","res-ambient-tools");const langBtn=el("button","",locale()==="zh"?"EN":"中文");langBtn.type="button";langBtn.onclick=()=>window.MorrowwishI18n?.set?.(locale()==="zh"?"en":"zh");controls.append(langBtn,closeBtn);header.append(controls);overlay.append(header);
  if(persisted){const result=el("section","res-ambient-result");result.append(el("h3","",actor.name[locale()]),el("p","",actor.event.text[locale()]),el("small","",t("信任 +1","Trust +1")));const b=el("button","",t("返回探索","Return to exploration"));b.onclick=close;result.append(b);overlay.append(result);return}
  const hint=el("p","res-ambient-hint",step?step[locale()]:t("已完成操作，请重试保存。","Action completed. Retry saving."));overlay.append(hint);
  const board=el("div",data.board?"res-ambient-board res-ambient-map":"res-ambient-board");board.style.backgroundImage='url("'+new URL(data.board||"workbench.svg",rootUrl).href+'")';overlay.append(board);
  const place=(n,x,y)=>{n.style.left=(x*100)+"%";n.style.top=(y*100)+"%"};
  for(const p of data.props){
   if(data.steps.slice(0,session.stage()).some(s=>s.piece===p.id)&&["leaves","tongue","pin"].includes(p.id))continue;
   const b=el("button","res-ambient-prop");b.type="button";b.dataset.piece=p.id;b.style.width=p.w*100+"%";place(b,p.x,p.y);
   const im=el("img");im.src=new URL(p.asset,rootUrl).href;im.alt="";im.draggable=false;b.append(im);
   b.disabled=step?.piece!==p.id;b.classList.toggle("res-ambient-target",step?.target===p.id);
   if(!b.disabled){
    b.setAttribute("aria-label",step[locale()]);
    function position(e){const r=board.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height}}
    b.onpointerdown=e=>{if(!session||e.button>0)return;e.preventDefault();b.setPointerCapture(e.pointerId);drag={id:e.pointerId,piece:p.id};b.classList.add("dragging")};
    b.onpointermove=e=>{if(drag?.id!==e.pointerId)return;const q=position(e);place(b,Math.min(1,Math.max(0,q.x)),Math.min(1,Math.max(0,q.y)))};
    b.onpointerup=e=>{if(drag?.id!==e.pointerId)return;const q=position(e);drag=null;const r=session.drop(p.id,q.x,q.y);if(r.done)finish();else render()};
    b.onpointercancel=()=>{drag=null;render()};
    // Keyboard alternative still moves the object to a spatial target.
    let keyboard={x:p.x,y:p.y};b.onkeydown=e=>{if(!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Enter"," "].includes(e.key))return;e.preventDefault();if(e.key==="Enter"||e.key===" "){const r=session.drop(p.id,keyboard.x,keyboard.y);if(r.done)finish();else if(r.ok)render();return}
     if(e.key==="ArrowLeft")keyboard.x-=.05;if(e.key==="ArrowRight")keyboard.x+=.05;if(e.key==="ArrowUp")keyboard.y-=.05;if(e.key==="ArrowDown")keyboard.y+=.05;keyboard.x=Math.max(0,Math.min(1,keyboard.x));keyboard.y=Math.max(0,Math.min(1,keyboard.y));place(b,keyboard.x,keyboard.y)};
   }
   board.append(b);
  }
  const footer=el("footer","res-ambient-footer",session.stage()+"/"+data.steps.length);
  if(session.done()){const retry=el("button","",t("重试保存","Retry save"));retry.onclick=finish;footer.append(retry)}
  overlay.append(footer);
 }
 function finish(){
  if(!session?.done()||slot!==window.State.S||!api.isCurrentAction(token)){close();return}
  const event=actor.event,result=api.ambient({id:event.id,operation:event.operation,region:event.region,verified:true,token});
  if(result.ok){persisted=true;render()}else render();
 }
 function open(profile,event){
  if(overlay||!ambientGames[event.id]||!api.ambientAvailable(event.region).some(a=>a.id===event.id))return false;
  slot=window.State.S;token=api.captureAction();session=createAmbientGame(event.id);actor={...profile,event};overlay=el("section","cb-story-overlay is-visible res-ambient"+(session.game.board?" res-ambient-route":""));overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");overlay.addEventListener("keydown",e=>{if(e.key==="Escape"){e.preventDefault();close()}});
  stage.append(overlay);render();return true;
 }
 window.addEventListener("cat-bond-resonance-npc-profile",e=>{const p=e.detail;if(p?.id!=="muling")return;const a=p.ambient?.find(a=>ambientGames[a.id]);if(a)open(p,a)});
 window.addEventListener("morrowwish-language-change",()=>{if(overlay&&!drag)render()});
 window.addEventListener("cat-bond-active-save-changed",close);
 window.addEventListener("cat-bond-resonance-changed",()=>{if(overlay&&(slot!==window.State.S||!api.isCurrentAction(token)))close()});
}
if(document.readyState==="complete")install();else document.addEventListener("DOMContentLoaded",install,{once:true});
