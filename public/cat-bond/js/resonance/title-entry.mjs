// Spoiler-free title handoff. Opening history assets are never played here.
import {getSlotRuntime} from "./slot-runtime.mjs";
const lang=()=>window.MorrowwishI18n?.get?.()==="zh"?"zh":"en";
const tr=(zh,en)=>lang()==="zh"?zh:en;
const introIds=new Set(["prologue:P-01","prologue:P-02","prologue:P-03","prologue:P-04"]);
export function classifyPrologue(view){const id=view?.current?.id;if(introIds.has(id)||view?.ending||["epilogue:E-02","epilogue:E-03"].includes(id))return "garden";if(id==="prologue:P-05")return view.objective?.includes("travel:harbor")?"garden":"world";return "world";}
export function finishCinematicScene(){return {ok:false,reason:"opening-animation-retired"};}
let active=null;
function openContext(owner){
 const stage=document.getElementById("stage");if(!stage)return;
 const root=document.createElement("section");root.id="cb-player-first-intro";root.setAttribute("role","dialog");root.setAttribute("aria-modal","true");
 Object.assign(root.style,{position:"absolute",inset:"0",zIndex:"60",display:"grid",placeItems:"center",background:"#172e2cb8",padding:"16px"});
 const panel=document.createElement("div");Object.assign(panel.style,{maxWidth:"570px",width:"100%",padding:"clamp(15px,4vw,32px)",borderRadius:"18px",background:"#263d36f5",color:"#fff3dc",boxShadow:"0 8px 30px #15292277",maxHeight:"90%",overflow:"auto",boxSizing:"border-box"});
 const title=document.createElement("h2"),body=document.createElement("p"),personal=document.createElement("p"),row=document.createElement("div"),play=document.createElement("button"),skip=document.createElement("button"),language=document.createElement("button");
 for(const b of [play,skip,language]){b.type="button";b.style.cssText="padding:9px 14px;margin:4px;color:#21382e;background:#f0d7a4;border:0;border-radius:10px;cursor:pointer";}
 title.style.marginTop="0";body.style.lineHeight="1.65";personal.style.color="#f4d49b";row.append(play,skip,language);panel.append(title,body,personal,row);root.append(panel);
 function render(){title.textContent=tr("寻找名字","A name to find");body.textContent=tr("很久以前，六片土地的猫咪依靠一座古老的星铃维系记忆。一场灾难击坏了星铃，猫咪们开始忘记熟悉的地方、朋友，甚至自己的名字。灾难曾经平息，生活渐渐恢复。直到最近，失忆的现象再次出现。","Long ago, an ancient Star Bell helped the cats of six lands preserve their memories. A disaster damaged it, and cats began forgetting familiar places, friends, even their own names. The crisis subsided and life returned to normal. Recently, the forgetting began again.");personal.textContent=tr("今天，你在一座陌生的花园里醒来。你想不起自己的名字。","Today you wake in an unfamiliar garden, unable to remember your name.");play.textContent=tr("开始探索","Start exploring");skip.textContent=tr("跳过介绍","Skip introduction");language.textContent=tr("English","中文");}
 function dispose(){root.remove();window.removeEventListener("morrowwish-language-change",render);window.removeEventListener("cat-bond-active-save-changed",dispose);window.removeEventListener("pagehide",dispose);if(active?.dispose===dispose)active=null;}
 play.onclick=skip.onclick=dispose;language.onclick=()=>window.MorrowwishI18n?.set?.(lang()==="zh"?"en":"zh");root.onkeydown=e=>{if(e.key==="Escape"){e.preventDefault();dispose();}};
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
  if(!owner.cats.length){const id="jinjc",starter=State.makeCat(id,{affinity:20}),previous=owner.dex[id];window.Raising?.decorateNewCat?.(starter);owner.cats.push(starter);owner.dex[id]=(previous||0)+1;let ok=false;try{ok=State.save()?.ok===true}catch{}if(!ok){owner.cats.pop();if(previous===undefined)delete owner.dex[id];else owner.dex[id]=previous;return fail("fixed-protagonist-save-failed");}window.arcadeMetric?.("bond_starter_chosen",{starter:id});}
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
