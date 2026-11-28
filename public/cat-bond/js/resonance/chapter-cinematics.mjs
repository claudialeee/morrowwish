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
 const isolated=['https://cat-bond-preview.morrowwish.pages.dev','https://starbell-portrait-preview.morrowwish.pages.dev'].includes(location.origin)&&window.ARCADE_COLLECTOR==='/api/preview-disabled';
 return local||isolated;
};
const developmentReady=()=>developmentPreview()&&['starfall:F-02','starfall:F-05','finale:B-04'].every(id=>{const current=campaign.scenes.find(s=>s.id===id);return !!current&&buildCanonicalScene({campaign,manifest:releaseManifest,view:{current,choice:null,objective:current.requires.filter(o=>o.startsWith('cinematic:')),cursor:0,lineReady:true},staging:true}).ok;});
async function refreshReleaseManifest(){try{const response=await fetch(manifestURL);if(response.ok){releaseManifest=await response.json();window.dispatchEvent(new Event("cat-bond-resonance-changed"));}}catch{/* Invalid manifest remains locked. */}}
refreshReleaseManifest();

async function play(sceneId){
 const game=window.__game, slot=window.State.S, runtime=getSlotRuntime(window.State);
 const view=runtime.view();
 if(sceneId.startsWith("starfall:")){const pos=slot.resonanceExploration?.positions?.starfall;if(slot.resonanceExploration?.location!=="starfall"||!pos||Math.hypot(pos.x-.92,pos.y-.30)>=.072)return false;}
 const atRegion=window.WorldMap?.currentRegion,atScene=sceneId==="epilogue:E-01"?["harbor","forest"].includes(atRegion):atRegion===(sceneId.startsWith("finale:")?"finale":"starfall");if(active||game.scene!=="map"||!atScene||view.current?.id!==sceneId||!view.objective.some(op=>op.startsWith("cinematic:"))||view.objective.some(op=>!op.startsWith("cinematic:")))return false;
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
  controller.cancelAcknowledgement?.();
  player?.dispose();
  root?.remove();
  if(active===controller)active=null;
 };
 // Explicit acknowledgement is part of the scene, not a timed toast.
 function acknowledge(title,body,label,{ring=false}={}){
  return new Promise(resolve=>{
   root.hidden=false;
   const panel=document.createElement("section");panel.dataset.canonAcknowledgement=sceneId;
   panel.style.cssText="position:absolute;inset:0;z-index:20;display:grid;place-items:center;padding:16px;background:rgba(42,32,56,.76);overflow:auto";
   const card=document.createElement("div");card.style.cssText="width:min(100%,520px);box-sizing:border-box;background:#fff5e9;color:#493852;border-radius:18px;padding:22px;text-align:center;box-shadow:0 8px 30px #30223b66";
   const h=document.createElement("h2"),p=document.createElement("p"),button=document.createElement("button");
   const localize=()=>{const l=language();h.textContent=title[l];p.textContent=body[l];button.textContent=label[l];};
   p.style.cssText="line-height:1.65;margin:12px 0 20px";button.type="button";button.style.cssText="min-height:48px;padding:10px 20px;border-radius:12px;background:#765c91;color:white;border:0;font:inherit;cursor:pointer";
   card.append(h,p,button);panel.append(card);root.append(panel);localize();button.focus();
   const playReply=()=>{window.MorrowwishAudio?.note?.(392,.20,.12);window.setTimeout(()=>{if(current())window.MorrowwishAudio?.note?.(523.25,.22,.12);},260);};
   if(ring)playReply();
   const cleanup=()=>{window.removeEventListener("morrowwish-language-change",localize);panel.remove();};
   window.addEventListener("morrowwish-language-change",localize);
   controller.cancelAcknowledgement=()=>{cleanup();resolve(false);};
   button.addEventListener("click",()=>{if(!current()){cleanup();resolve(false);return;}if(ring)playReply();cleanup();controller.cancelAcknowledgement=null;resolve(true);},{once:true});
  });
 }

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
   beforeResolve:({sceneId,skipped})=>sceneId==="starfall:F-02"&&skipped?acknowledge({zh:"星芽",en:"Nova"},{zh:"当年落星击坏星铃，回响四处蔓延。你还不能唤醒古铃，只能用自己的记忆封住回响。如今五座古铃已经恢复了。",en:"When the fallen star broke the Star Bell, the echoes spread. You could not awaken the bells then, so you sealed the echoes with your own memories. Today five local bells are ringing again."},{zh:"继续",en:"Continue"}):true,
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
