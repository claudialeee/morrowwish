import {campaign} from "./campaign.mjs";
import {getSlotRuntime} from "./slot-runtime.mjs";
import {mountDialogue} from "./dialogue-ui.mjs";
import {mountKeyExchange} from "./key-exchange.mjs";
const lang=()=>window.MorrowwishI18n?.get?.()==="zh"?"zh":"en";
const portraitRoot=new URL("../../assets/npc/",import.meta.url);
const playerPortraits=new Map();
function portrait(id,scene,cursor){
 if(id==="player"){const sp=window.State?.S?.cats?.[0]?.species;if(!sp||!window.CatBondArtworkStatus?.breedsLoaded||!window.CatArt?.renderCatThumb)return null;if(!playerPortraits.has(sp)){const c=document.createElement("canvas");c.width=400;c.height=460;window.CatArt.renderCatThumb(c,window.GameData.speciesById(sp));playerPortraits.set(sp,c.toDataURL("image/png"));}return playerPortraits.get(sp)}
 if(id==="muling")return new URL("../cinematics/characters/muling/traveler-neutral.webp",portraitRoot).href;
 if(campaign.regions.includes(campaign.cast[id]?.region))return new URL(id+"-painted.webp",portraitRoot).href;
 return null;
}
function install(){
 const stage=document.getElementById("stage"),State=window.State;
 if(!stage||!State||window.CatBondResonance)return;
 let dialogue=null,root=null,slot=null,openedScene=null,scheduled=false,keyExchange=null;
 const announce=detail=>{const savedSlot=State.S;queueMicrotask(()=>{if(savedSlot!==State.S)return;window.dispatchEvent(new CustomEvent("cat-bond-resonance-changed",{detail}));if(detail.trustChanges?.length){const names=detail.trustChanges.map(c=>({zh:campaign.cast[c.id].name.zh+" "+(c.delta>0?"+":"")+c.delta,en:campaign.cast[c.id].name.en+" "+(c.delta>0?"+":"")+c.delta}));window.__game?.toast?.({zh:"信任变化 · "+names.map(n=>n.zh).join(" / "),en:"Trust changed · "+names.map(n=>n.en).join(" / ")});}})};
 const runtime=getSlotRuntime(State);runtime.subscribe(announce);
 function close(){keyExchange?.dispose();keyExchange=null;dialogue?.dispose();dialogue=null;root?.remove();root=null;openedScene=null;slot=null;}
 function show(){
  const v=runtime.view(),game=window.__game;
  if(!v.current||game?.scene==="battle")return false;
  if(slot===State.S&&openedScene===v.current.id&&(dialogue||keyExchange)){(dialogue||keyExchange).render();return true}
  close();slot=State.S;openedScene=v.current.id;
  root=document.createElement("div");root.className="cb-story-overlay is-visible res-host";root.dataset.scene=openedScene;stage.append(root);
  const action=runtime.capture();
  if(v.current.id==="epilogue:E-03"&&v.cursor===v.current.lines.length&&v.objective.includes("npc:second-garden-key")){showKey(action);return true}
  // Bind each overlay to the slot and scene it opened in. Even a click in the
  // interval before the slot-change listener runs cannot write to another slot.
  const boundEngine={view:()=>runtime.isCurrentAction(action)?runtime.view():{current:null},choose:id=>runtime.choose(id,action),nextLine:()=>runtime.nextLine(action)};
  dialogue=mountDialogue({root,engine:boundEngine,campaign,language:lang,resolvePortrait:portrait,onPersist:()=>{},onClose:close,onLanguage:value=>window.MorrowwishI18n?.set?.(value),onAwaitAction:()=>{scheduleFinish()}});
  return true;
 }
 function showKey(action){
  if(keyExchange||!root||!runtime.isCurrentAction(action))return;
  dialogue?.dispose();dialogue=null;
  keyExchange=mountKeyExchange({root,language:lang,portrait:portrait("muling","epilogue:E-03",3),isCurrent:()=>runtime.isCurrentAction(action),commit:()=>runtime.completeNPCScene({sceneId:"epilogue:E-03",operation:"npc:second-garden-key",npcId:"muling",region:"garden",verified:true,token:action}),onComplete:()=>{close();scheduleFinish()},onClose:close,onLanguage:value=>window.MorrowwishI18n?.set?.(value)});
 }
 function scheduleFinish(){
  if(scheduled)return;scheduled=true;const scheduledRoot=State.S;queueMicrotask(()=>{scheduled=false;
   if(scheduledRoot!==State.S)return;
   if(slot&&slot!==State.S){close();return}
   const v=runtime.view();if(!v.current)return;
   if(dialogue&&slot===State.S&&openedScene===v.current.id&&v.cursor===v.current.lines.length){
    if(v.current.id==="epilogue:E-02"&&v.objective.includes("npc:public-accountability")){const r=runtime.completeNPCScene({sceneId:v.current.id,operation:"npc:public-accountability",npcId:"muling",region:"garden",verified:true,token:runtime.capture()});if(!r.ok)return;scheduleFinish();return}
    if(v.current.id==="epilogue:E-03"&&v.objective.includes("npc:second-garden-key")){showKey(runtime.capture());return}
    if(v.objective.length&&(!v.current.choices.length||v.choice)){close();return;}
   }
   if(v.cursor===v.current.lines.length&&!v.objective.length&&(!v.current.choices.length||v.choice)){
    const old=v.current.id,r=runtime.finish();if(r.ok&&openedScene===old)close();
   }
  })
 }
 function refresh(){if(slot&&slot!==State.S)close();else if(dialogue||keyExchange){if(openedScene!==runtime.view().current?.id)close();else (dialogue||keyExchange).render()}scheduleFinish()}
 // The physical map interaction already validates movement and proximity. No generic story button can grant NPC evidence.
 window.addEventListener("cat-bond-resonance-npc-request",event=>{
  if(window.__game?.scene==="battle")return;
  const d=event.detail||{};if(window.CatBondResonanceNPC){if(!window.CatBondResonanceNPC.talk(d.npcId,d.region,d.sceneId))window.__game?.toast?.({zh:"暂时没有新的话题。",en:"Nothing new to discuss yet."});return}const r=runtime.recordNPC(d);if(r.ok)show();
 });
 window.addEventListener("cat-bond-resonance-changed",refresh);
 window.addEventListener("cat-bond-active-save-changed",close);
 // Detect external world/battle commits and slot replacements without a second progression store.
 let observedRoot=State.S,observedRevision=State.S.resonance?.revision??-1,observedView=runtime.view();
 setInterval(()=>{const revision=State.S.resonance?.revision??-1;if(observedRoot!==State.S||observedRevision!==revision){const sameSlot=observedRoot===State.S,old=observedView;observedRoot=State.S;observedRevision=revision;observedView=runtime.view();refresh();
  if(sameSlot&&!dialogue&&window.__game?.scene!=="battle"&&old.current?.id===observedView.current?.id&&old.objective.length>observedView.objective.length&&(!old.lineReady||observedView.objective.length===0)&&observedView.lineReady&&observedView.cursor<observedView.current.lines.length)show();
 }},200);
 window.addEventListener("cat-bond-resonance-evidence",event=>{
  const r=runtime.evidence(event.detail);if(r.ok){const v=runtime.view();if(v.current?.lines.length&&v.lineReady)show();scheduleFinish()}
 });
 window.addEventListener("cat-bond-resonance-ambient-result",event=>{runtime.ambient(event.detail)});
 window.addEventListener("cat-bond-resonance-support-result",event=>{runtime.support(event.detail)});
 window.addEventListener("cat-bond-resonance-postgame-result",event=>{runtime.postgame(event.detail)});
 // Map and cinematic hosts can present the current scene without granting evidence.
 window.CatBondResonance=Object.freeze({captureAction:runtime.capture,isCurrentAction:runtime.isCurrentAction,exchange:runtime.exchange,initialize:runtime.initialize,npcProfile:runtime.npcProfile,residents:runtime.residents,isMulingFollowing:runtime.follows,view:runtime.view,snapshot:runtime.snapshot,showCurrent:show,close,recordEvidence:runtime.evidence,commitFinaleVictory:runtime.commitFinaleVictory,recordNPC:runtime.recordNPC,ambient:runtime.ambient,support:runtime.support,postgame:runtime.postgame,supportProfile:runtime.supportProfile,ambientAvailable:runtime.ambientAvailable});
}
if(document.readyState==="complete")install();else document.addEventListener("DOMContentLoaded",install,{once:true});
