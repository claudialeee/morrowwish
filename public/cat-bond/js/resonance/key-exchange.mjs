// Story-specific second key interaction. No separate save state and no
// generic completion button. The final key is handed over only after E-03 dialogue.
const asset=new URL("../../assets/npc/props/garden-key.svg",import.meta.url).href;
export function mountKeyExchange({root,language,portrait,isCurrent,commit,onComplete,onClose,onLanguage}){
 const el=(tag,cl,txt)=>{const n=document.createElement(tag);if(cl)n.className=cl;if(txt)n.textContent=txt;return n};
 const panel=el("section","res-key-panel"),title=el("h2"),hint=el("p","res-key-hint"),board=el("div","res-key-board"),target=el("div","res-key-recipient"),actor=el("img"),name=el("strong"),piece=el("button","res-key-piece"),img=el("img"),message=el("p","res-key-message"),tools=el("div","res-controls"),close=el("button"),toggle=el("button");
 piece.type=close.type=toggle.type="button";img.src=asset;img.alt="";img.draggable=false;piece.append(img);
 actor.alt="";actor.draggable=false;if(portrait)actor.src=portrait;else actor.hidden=true;target.append(actor,name);board.append(target,piece);tools.append(toggle,close);panel.append(title,hint,board,message,tools);root.append(panel);
 let x=.22,y=.58,drag=null,disposed=false,busy=false,error=false;
 const localized=(zh,en)=>language()==="zh"?zh:en;
 function position(nx,ny){x=Math.max(.05,Math.min(.95,nx));y=Math.max(.08,Math.min(.92,ny));piece.style.left=x*100+"%";piece.style.top=y*100+"%"}
 function render(){if(disposed)return;title.textContent=localized("第二把花园钥匙","The second garden key");hint.textContent=localized("把钥匙交到暮铃的手中。","Hand the key to Muling.");name.textContent=localized("暮铃","Muling");piece.setAttribute("aria-label",localized("花园钥匙，拖动或使用方向键移动","Garden key; drag or move with arrow keys"));close.textContent=localized("关闭","Close");toggle.textContent=language()==="zh"?"EN":"中文";message.textContent=error?localized("未能保存，请再次交付钥匙。","Unable to save. Hand over the key again."):"";}
 function deliver(){if(disposed||busy||!isCurrent())return;if(Math.hypot((x-.77)*1.2,y-.54)>.20){position(.22,.58);return}busy=true;let r;try{r=commit()}finally{busy=false}if(r?.ok){onComplete();return}error=true;position(.22,.58);render()}
 function point(e){const r=board.getBoundingClientRect();return [(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height]}
 piece.onpointerdown=e=>{if(e.button>0||drag!==null||!isCurrent())return;drag=e.pointerId;piece.setPointerCapture(e.pointerId);e.preventDefault()};
 piece.onpointermove=e=>{if(drag===e.pointerId)position(...point(e))};
 piece.onpointerup=e=>{if(drag!==e.pointerId)return;drag=null;position(...point(e));deliver()};
 piece.onpointercancel=()=>{drag=null;position(.22,.58)};
 piece.onkeydown=e=>{if(!["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Enter"," "].includes(e.key))return;e.preventDefault();if(e.key==="Enter"||e.key===" "){deliver();return}position(x+(e.key==="ArrowRight"?.06:e.key==="ArrowLeft"?-.06:0),y+(e.key==="ArrowDown"?.06:e.key==="ArrowUp"?-.06:0))};
 close.onclick=onClose;toggle.onclick=()=>onLanguage(language()==="zh"?"en":"zh");
 function dispose(){if(disposed)return;disposed=true;window.removeEventListener("morrowwish-language-change",render);panel.remove()}
 window.addEventListener("morrowwish-language-change",render);position(x,y);render();piece.focus();return {dispose,render};
}
