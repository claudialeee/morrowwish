import {campaign} from "./campaign.mjs";
import {createSlotRuntime} from "./slot-runtime.mjs";
import {mountDialogue} from "./dialogue-ui.mjs";
const lang=()=>window.MorrowwishI18n?.get?.()==="zh"?"zh":"en";
const portraitRoot=new URL("../../assets/npc/",import.meta.url);
// Existing branch-only draft art: not approved final art. Other actors remain unillustrated until assets are ready.
const faces={jiedeng:["guarded","worried","firm","soft"],qilan:["curious","annoyed","determined","warm"],muling:["neutral","dry","nervous","warm"]};
function portrait(id,scene,cursor){
 const list=faces[id];if(!list)return null;
 const face=scene==="harbor:H-02"?(id==="jiedeng"?["guarded","worried","guarded","worried","soft"]:["curious","annoyed","determined","determined","warm"])[cursor]:list[cursor%list.length];
 return new URL(id+"-"+(face||list[0])+".svg",portraitRoot).href;
}
function install(){
 const stage=document.getElementById("stage"),State=window.State;
 if(!stage||!State||window.CatBondResonance)return;
 let dialogue=null,root=null,slot=null,openedScene=null,scheduled=false;
 const announce=detail=>window.dispatchEvent(new CustomEvent("cat-bond-resonance-changed",{detail}));
 const runtime=createSlotRuntime(State,{notify:announce});
 function close(){dialogue?.dispose();dialogue=null;root?.remove();root=null;openedScene=null;slot=null;}
 function show(){
  const v=runtime.view(),game=window.__game;
  if(!v.current||game?.scene==="battle")return false;
  if(dialogue&&slot===State.S&&openedScene===v.current.id){dialogue.render();return true}
  close();slot=State.S;openedScene=v.current.id;
  root=document.createElement("div");root.className="cb-story-overlay res-host";root.dataset.scene=openedScene;stage.append(root);
  dialogue=mountDialogue({root,engine:runtime,campaign,language:lang,resolvePortrait:portrait,onPersist:()=>{},onClose:close,onAwaitAction:()=>{scheduleFinish()}});
  return true;
 }
 function scheduleFinish(){
  if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;
   if(slot&&slot!==State.S){close();return}
   const v=runtime.view();if(!v.current)return;
   if(v.cursor===v.current.lines.length&&!v.objective.length&&(!v.current.choices.length||v.choice)){
    const old=v.current.id,r=runtime.finish();if(r.ok&&openedScene===old)close();
   }
  })
 }
 function refresh(){if(slot&&slot!==State.S)close();else if(dialogue){if(openedScene!==runtime.view().current?.id)close();else dialogue.render()}scheduleFinish()}
 // The physical map interaction already validates movement and proximity. No generic story button can grant NPC evidence.
 window.addEventListener("cat-bond-resonance-npc-request",event=>{
  if(window.__game?.scene==="battle")return;
  const d=event.detail||{},r=runtime.recordNPC(d);
  if(r.ok)show();
 });
 window.addEventListener("cat-bond-resonance-changed",refresh);
 window.addEventListener("cat-bond-resonance-evidence",event=>{
  const r=runtime.evidence(event.detail);if(r.ok){const v=runtime.view();if(v.current?.lines.length&&v.lineReady)show();scheduleFinish()}
 });
 window.addEventListener("cat-bond-resonance-ambient-result",event=>{runtime.ambient(event.detail)});
 window.addEventListener("cat-bond-resonance-support-result",event=>{runtime.support(event.detail)});
 window.addEventListener("cat-bond-resonance-postgame-result",event=>{runtime.postgame(event.detail)});
 // Map and cinematic hosts can present the current scene without granting evidence.
 window.CatBondResonance=Object.freeze({view:runtime.view,snapshot:runtime.snapshot,showCurrent:show,close,recordEvidence:runtime.evidence,recordNPC:runtime.recordNPC,ambient:runtime.ambient,support:runtime.support,postgame:runtime.postgame,supportProfile:runtime.supportProfile,ambientAvailable:runtime.ambientAvailable});
}
if(document.readyState==="complete")install();else document.addEventListener("DOMContentLoaded",install,{once:true});
