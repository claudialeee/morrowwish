import {campaign} from "./campaign.mjs";
import {getSlotRuntime} from "./slot-runtime.mjs";
import {mountResonanceCinematics} from "../resonance-cinematic.mjs";

const language=()=>window.MorrowwishI18n?.get?.()==="zh"?"zh":"en";
const manifestURL=new URL("../../assets/cinematics/asset-manifest.json",import.meta.url);
let active=null;

async function play(sceneId){
 const game=window.__game, slot=window.State.S, runtime=getSlotRuntime(window.State);
 const view=runtime.view();
 if(active||game.scene!=="map"||view.current?.id!==sceneId||!view.objective.length||!view.objective.every(op=>op.startsWith("cinematic:")))return false;
 const token=runtime.capture(), controller={dispose:null};
 const current=()=>active===controller&&window.State.S===slot&&runtime.isCurrentAction(token);
 active=controller;
 let root,player;
 const close=()=>{
  player?.dispose();
  root?.remove();
  if(active===controller)active=null;
 };
 controller.dispose=close;
 const error=()=>{
  if(!current())return;
  close();
  game.toast({zh:"演出暂未就绪，请重试。",en:"The cinematic could not play. Try again."});
 };
 try{
  const response=await fetch(manifestURL);
  if(!response.ok)throw Error("Missing cinematic manifest");
  const manifest=await response.json();
  if(!current()){close();return false;}
  root=document.createElement("div");
  root.className="res-chapter-cinematic cb-story-overlay is-visible";
  document.getElementById("stage").append(root);
  player=mountResonanceCinematics({
   root, engine:runtime, campaign, manifest,
   rendererFactory:window.CatBondCinematicPresentation.create,
   staging:window.__CAT_BOND_INTEGRATION_ART__===true,
   getSlotKey:()=>window.State.S,
   language,
   onLanguageChange:next=>window.MorrowwishI18n?.set?.(next),
   onError:error,
   onResolved:()=>{
    if(!current())return;
    const result=runtime.finish(token);
    if(!result.ok){error();return;}
    close();
    if(runtime.view().current?.id==="epilogue:E-02")window.WorldMap.exitToYard();
   }
  });
  const result=await player.playCurrent();
  return result.ok;
 }catch{
  error();
  return false;
 }
}
window.CatBondChapterCinematics=Object.freeze({play});
window.addEventListener("pagehide",()=>active?.dispose());
window.addEventListener("cat-bond-active-save-changed",()=>active?.dispose());
