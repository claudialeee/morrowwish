import {campaign} from "./campaign.mjs";
import {getSlotRuntime} from "./slot-runtime.mjs";
import {mountResonanceCinematics,starfallReleaseReady,buildCanonicalScene} from "../resonance-cinematic.mjs";

const language=()=>window.MorrowwishI18n?.get?.()==="zh"?"zh":"en";
const manifestURL=new URL("../../assets/cinematics/asset-manifest.json",import.meta.url);
let active=null,releaseManifest=null;
// Candidate paintings are restricted to an explicitly opted-in loopback build or
// the isolated owner preview. Its build injects the disabled analytics collector
// and serves no production Worker/D1 or cloud-save endpoints. Never grant this
// permission on the production hostname or via a URL query parameter alone.
// This never changes the independent production approval result or save schema.
const developmentPreview=()=>{
 const local=['localhost','127.0.0.1','[::1]'].includes(location.hostname)&&new URLSearchParams(location.search).get('rpgDev')==='1';
 const isolated=location.origin==='https://cat-bond-preview.morrowwish.pages.dev'&&window.ARCADE_COLLECTOR==='/api/preview-disabled';
 return local||isolated;
};
const developmentReady=()=>developmentPreview()&&['starfall:F-02','starfall:F-05','finale:B-04','epilogue:E-01'].every(id=>{const current=campaign.scenes.find(s=>s.id===id);return !!current&&buildCanonicalScene({campaign,manifest:releaseManifest,view:{current,choice:null,objective:current.requires.filter(o=>o.startsWith('cinematic:')),cursor:0,lineReady:true},staging:true}).ok;});
async function refreshReleaseManifest(){try{const response=await fetch(manifestURL);if(response.ok){releaseManifest=await response.json();window.dispatchEvent(new Event("cat-bond-resonance-changed"));}}catch{/* Invalid manifest remains locked. */}}
refreshReleaseManifest();

async function play(sceneId){
 const game=window.__game, slot=window.State.S, runtime=getSlotRuntime(window.State);
 const view=runtime.view();
 if(sceneId.startsWith("starfall:")){const pos=slot.resonanceExploration?.positions?.starfall;if(slot.resonanceExploration?.location!=="starfall"||!pos||Math.hypot(pos.x-.92,pos.y-.30)>=.072)return false;}
 if(active||game.scene!=="map"||window.WorldMap?.currentRegion!=="starfall"||view.current?.id!==sceneId||!view.objective.some(op=>op.startsWith("cinematic:")))return false;
 const token=runtime.capture(), slotId=window.State.activeSlot(), controller={dispose:null,checkpoint:null};
 const current=()=>active===controller&&window.State.S===slot&&window.State.activeSlot()===slotId&&runtime.isCurrentAction(token);
 const checkpointKey="chapterPresentation";
 const writeCheckpoint=value=>{
  if(window.State.S!==slot||window.State.activeSlot()!==slotId)return false;
  const old=slot[checkpointKey];if(value===undefined)delete slot[checkpointKey];else slot[checkpointKey]=value;
  let saved;try{saved=window.State.save();}catch{}
  if(!saved?.ok){if(old===undefined)delete slot[checkpointKey];else slot[checkpointKey]=old;return false;}return true;
 };
 const persist=pending=>{if(current()&&pending?.snapshot)writeCheckpoint({slotId,revision:pending.revision,snapshot:pending.snapshot});};
 controller.checkpoint=()=>persist(player?.snapshot?.());
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
   staging:developmentPreview(),
   getSlotKey:()=>window.State.S,
   language,
   onLanguageChange:next=>window.MorrowwishI18n?.set?.(next),
   onError:error,
   onCheckpoint:persist,
   onResolved:()=>{
    if(!current())return;
    const result=runtime.finish(token);
    if(!result.ok){error();return;}
    writeCheckpoint(undefined);
    close();
    if(runtime.view().current?.id==="epilogue:E-02")window.WorldMap.exitToYard();
   }
  });
  const saved=slot[checkpointKey];
  const valid=saved?.slotId===slotId&&saved.revision===view.revision&&saved.snapshot?.sceneId===sceneId&&Number.isInteger(saved.snapshot.frameIndex)&&saved.snapshot.frameIndex>=0&&Number.isFinite(saved.snapshot.elapsedMs)&&saved.snapshot.elapsedMs>=0;
  const resume=valid?{slot,revision:saved.revision,snapshot:{...saved.snapshot,paused:true}}:null;
  if(saved&&!valid)writeCheckpoint(undefined);
  const result=await player.playCurrent(resume);
  // A changed shot list may invalidate an old checkpoint. Clear only that slot's checkpoint; never advance story.
  if(!result.ok&&resume&&window.State.S===slot&&window.State.activeSlot()===slotId)writeCheckpoint(undefined);
  return result.ok;
 }catch{
  error();
  return false;
 }
}
window.CatBondChapterCinematics=Object.freeze({play,starfallReleaseReady:()=>starfallReleaseReady(campaign,releaseManifest),developmentReady});
window.addEventListener("pagehide",()=>{active?.checkpoint?.();active?.dispose();});
window.addEventListener("cat-bond-active-save-changed",()=>active?.dispose());
