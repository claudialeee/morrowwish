// Spoiler-free title handoff. Opening history assets are never played here.
import {getSlotRuntime} from "./slot-runtime.mjs";
const lang=()=>window.MorrowwishI18n?.get?.()==="zh"?"zh":"en";
const tr=(zh,en)=>lang()==="zh"?zh:en;
const introIds=new Set(["prologue:P-01","prologue:P-02","prologue:P-03","prologue:P-04"]);
export function classifyPrologue(view){const id=view?.current?.id;if(introIds.has(id)||view?.ending||["epilogue:E-01","epilogue:E-02","epilogue:E-03"].includes(id))return "garden";if(id==="prologue:P-05")return view.objective?.includes("travel:harbor")?"garden":"world";return "world";}
export function finishCinematicScene(){return {ok:false,reason:"opening-animation-retired"};}
let active=null;
function openContext(owner){
 const stage=document.getElementById("stage");if(!stage)return;
 const root=document.createElement("section");root.id="cb-player-first-intro";root.setAttribute("role","dialog");root.setAttribute("aria-modal","true");root.setAttribute("aria-labelledby","cb-prologue-heading");
 // A full-stage storybook page, not a floating card. Auto margins keep short
 // viewports scrollable without clipping the heading or the action buttons.
 Object.assign(root.style,{position:"absolute",inset:"0",zIndex:"60",display:"flex",flexDirection:"column",boxSizing:"border-box",overflow:"auto",overscrollBehavior:"contain",padding:"clamp(20px,5vmin,64px)",background:"radial-gradient(ellipse at 14% 8%, #fffdf5 0%, transparent 56%), radial-gradient(ellipse at 92% 100%, #e2ead8 0%, transparent 55%), linear-gradient(145deg, #fbf4e5, #f1e7d2)",color:"#443b2d"});
 const panel=document.createElement("div");Object.assign(panel.style,{maxWidth:"760px",width:"100%",margin:"auto",flexShrink:"0",boxSizing:"border-box",display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center",gap:"clamp(8px,2vmin,18px)",background:"transparent"});
 const title=document.createElement("h2"),body=document.createElement("p"),personal=document.createElement("p"),row=document.createElement("div"),play=document.createElement("button"),skip=document.createElement("button");
 title.id="cb-prologue-heading";
 Object.assign(title.style,{margin:"0",fontFamily:"var(--cb-font-display, Georgia, serif)",fontSize:"clamp(30px,5vmin,56px)",fontWeight:"700",lineHeight:"1.18",color:"#4b3828",textShadow:"none"});
 Object.assign(body.style,{margin:"0",fontSize:"clamp(16px,2.7vmin,23px)",lineHeight:"1.85",color:"#514638",textShadow:"none",overflowWrap:"anywhere"});
 Object.assign(personal.style,{margin:"0",paddingTop:"clamp(12px,2vmin,20px)",borderTop:"1px solid #cdbb96",fontSize:"clamp(18px,3vmin,25px)",lineHeight:"1.65",fontWeight:"600",color:"#65502e",textShadow:"none",overflowWrap:"anywhere"});
 Object.assign(row.style,{display:"flex",flexWrap:"wrap",justifyContent:"center",alignItems:"center",gap:"12px",width:"100%",marginTop:"4px"});
 for(const b of [play,skip]){b.type="button";Object.assign(b.style,{padding:"12px 24px",minHeight:"44px",maxWidth:"100%",boxSizing:"border-box",fontFamily:"inherit",fontSize:"clamp(14px,2.2vmin,18px)",fontWeight:"600",lineHeight:"1.4",borderRadius:"10px",cursor:"pointer",textShadow:"none",whiteSpace:"normal"});}
 Object.assign(play.style,{color:"#fffdf5",background:"#536b4d",border:"1px solid #536b4d",boxShadow:"0 3px 8px #51463822"});
 Object.assign(skip.style,{color:"#65502e",background:"transparent",border:"1px solid #bba780",boxShadow:"none"});
 const letter=document.createElement("blockquote");letter.id="cb-opening-letter";Object.assign(letter.style,{margin:"0",width:"min(100%,440px)",boxSizing:"border-box",padding:"clamp(12px,2.8vmin,24px)",background:"#fff3d9",color:"#563d29",border:"1px solid #c9a974",borderRadius:"6px",boxShadow:"0 5px 18px #3e2c2033",fontSize:"clamp(16px,2.7vmin,23px)",lineHeight:"1.65",textAlign:"left",whiteSpace:"pre-line"});row.append(play,skip);panel.append(title,body,personal,row);root.append(panel);
 function render(){title.textContent=tr("陌生的花园","An unfamiliar garden");body.textContent=tr("你在一座陌生的花园醒来。微风吹过草地，却想不起自己为什么在这里。","You wake in an unfamiliar garden. A breeze stirs the grass, but you cannot remember why you are here.");personal.textContent=tr("我连自己的名字都想不起来了……附近会有人认识我吗？","I cannot even remember my name… Does anyone nearby know me?");play.textContent=tr("开始探索","Start exploring");skip.textContent=tr("跳过介绍","Skip introduction");}
 function dispose(){root.remove();window.removeEventListener("morrowwish-language-change",render);window.removeEventListener("cat-bond-active-save-changed",dispose);window.removeEventListener("pagehide",dispose);if(active?.dispose===dispose)active=null;}
 play.onclick=skip.onclick=dispose;root.onkeydown=e=>{if(e.key==="Escape"){e.preventDefault();dispose();}};
 if(owner!==window.State.S)return;stage.append(root);active={dispose};window.addEventListener("morrowwish-language-change",render);window.addEventListener("cat-bond-active-save-changed",dispose);window.addEventListener("pagehide",dispose,{once:true});render();play.focus();
}
export async function startCanonicalOpening(game,{onWorld}={}){
 active?.dispose();window.CatBondOpeningCover?.show();const State=window.State,owner=State?.S,slot=State?.activeSlot?.();
 const live=()=>owner===State?.S&&slot===State?.activeSlot?.();
 const fail=reason=>{window.CatBondOpeningCover?.hide();game?.toast?.({zh:"无法进入故事，请重试。",en:"Could not enter the story. Please retry."});return {ok:false,reason};};
 if(!owner||!slot)return fail("no-active-slot");window.__CAT_BOND_CANONICAL_ACTIVE__=true;
 try{
  const rt=getSlotRuntime(State),init=rt.initialize();if(!init.ok)return fail(init.reason);
  if(!live())return fail("slot-changed");
  if(!owner.cats.length){const id="jinjc",starter=State.makeCat(id,{affinity:20,protagonist:true}),previous=owner.dex[id];window.Raising?.decorateNewCat?.(starter);owner.cats.push(starter);owner.dex[id]=(previous||0)+1;let ok=false;try{ok=State.save()?.ok===true}catch{}if(!ok){owner.cats.pop();if(previous===undefined)delete owner.dex[id];else owner.dex[id]=previous;return fail("fixed-protagonist-save-failed");}window.arcadeMetric?.("bond_starter_chosen",{starter:id});}
  const showContext=introIds.has(rt.view().current?.id);
  // Retired entries carry no mandatory operations. Do not manufacture cinematic or gameplay evidence.
  while(introIds.has(rt.view().current?.id)){const v=rt.view();if(v.objective.length||v.current.lines.length)return fail("old-opening-data");const result=rt.finish(rt.capture());if(!result.ok)return fail(result.reason);if(!live())return fail("slot-changed");}
  if(owner.openingPresentation){const prev=owner.openingPresentation;delete owner.openingPresentation;try{if(!State.save()?.ok)owner.openingPresentation=prev}catch{owner.openingPresentation=prev}}
  const v=rt.view(),mode=classifyPrologue(v);
  if(mode==="garden"){game.scene="yard";game.battle=null;game.rebuildYard?.();game.showYardChrome?.();game.refreshHUD?.();window.dispatchEvent(new Event("cat-bond-garden-entered"));window.CatBondOpeningCover?.hide();if(showContext)openContext(owner);}
  else{onWorld?.();if(v.current?.chapter===owner.resonanceExploration?.location)window.WorldMap?.resumeRegion?.();window.CatBondOpeningCover?.hide();}
  return {ok:true,mode};
 }catch(e){return fail(e.message||"canonical-opening-failed");}
}
if(typeof window!=="undefined")window.CatBondTitlePrologue=Object.freeze({start:startCanonicalOpening,available:()=>!!(window.__CAT_BOND_CANONICAL_RELEASE__||window.CatBondResonance||window.CatBondCanonicalWorld),dispose:()=>active?.dispose()});
