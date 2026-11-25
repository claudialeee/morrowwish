// Canonical NPC presence and companion presentation adapter.
// Does not duplicate quest, trust, region progression, or the Muling arc.
import {campaign} from "./campaign.mjs";
const root=new URL("../../assets/npc/",import.meta.url);
const load=name=>{const img=new Image();img.src=new URL(name,root).href;return img};
const frames=[load("muling-follow-sprite.svg"),load("muling-follow-step-a.svg"),load("muling-follow-step-b.svg")];
const language=()=>window.MorrowwishI18n?.get?.()==="zh"?"zh":"en";
function drawMuling(ctx,{x,y,scale=1,time=0,moving=false,face=1}){
 const img=frames[moving?1+Math.floor(time*5)%2:0];if(!img?.complete||!img.naturalWidth)return false;
 const w=56*scale,h=94*scale;
 ctx.save();ctx.translate(x,y);if(face<0)ctx.scale(-1,1);ctx.drawImage(img,-w/2,-h,w,h);ctx.restore();return true;
}
function install(){
 const api=window.CatBondResonance;if(!api)return;
 let follower=null,lastSlot=null;
 function drawFollower(ctx,{x,y,time,moving=false,face=1,scale=1}){
  if(!api.isMulingFollowing()){follower=null;return false}
  const slot=window.State.S;if(slot!==lastSlot){lastSlot=slot;follower=null}
  const tx=x-face*74*scale,ty=y+18*scale;if(!follower)follower={x:tx,y:ty};const walking=moving||Math.hypot(tx-follower.x,ty-follower.y)>5;
  follower.x+=(tx-follower.x)*.14;follower.y+=(ty-follower.y)*.14;
  return drawMuling(ctx,{x:follower.x,y:follower.y,scale,time,moving:walking,face});
 }
 function talk(id,region){
  const v=api.view();if(!v.current)return false;
  const r=api.recordNPC({sceneId:v.current.id,npcId:id,region});
  if(r.ok){api.showCurrent();return true}
  const p=api.npcProfile(id);
  if(p)window.dispatchEvent(new CustomEvent("cat-bond-resonance-npc-profile",{detail:{...p,ambient:api.ambientAvailable(region).filter(a=>a.npc===id)}}));
  return false;
 }
 const gardenAdapter={getHomeNpcs:()=>api.residents("garden"),drawHomeNpc(ctx,npc,position){if(npc.id!=="muling")return false;return drawMuling(ctx,{x:position.x,y:position.y,scale:position.scale,time:position.time})},interactHomeNpc:id=>talk(id,"garden")};
 window.SunlitGarden?.registerNarrativeAdapter?.(gardenAdapter);
 window.CatBondResonanceNPC=Object.freeze({residents:api.residents,profile:api.npcProfile,talk,drawFollower,gardenAdapter});
}
if(document.readyState==="complete")install();else document.addEventListener("DOMContentLoaded",install,{once:true});
