// Canonical NPC presence and companion presentation adapter.
// Does not duplicate quest, trust, region progression, or the Muling arc.
import {campaign} from "./campaign.mjs";
const root=new URL("../../assets/npc/",import.meta.url);
const load=name=>{const img=new Image();img.src=new URL(name,root).href;return img};
const frames=[load("muling-follow-sprite.svg"),load("muling-follow-step-a.svg"),load("muling-follow-step-b.svg")];
const residents={
 jiedeng:load("jiedeng-painted.webp"),
 qilan:load("qilan-painted.webp")
};
function drawResident(ctx,id,{x,y,scale=1,time=0}){
 if(id==="muling")return drawMuling(ctx,{x,y,scale,time});
 const image=residents[id];
 if(!image?.complete||!image.naturalWidth)return false;
 const height=84*scale,width=height*image.naturalWidth/image.naturalHeight;
 ctx.drawImage(image,x-width/2,y-height+Math.sin(time*2)*scale,width,height);
 return true;
}
function drawMuling(ctx,{x,y,scale=1,time=0,moving=false,face=1}){
 const img=frames[moving?1+Math.floor(time*5)%2:0];if(!img?.complete||!img.naturalWidth)return false;
 const w=56*scale,h=94*scale;
 ctx.save();ctx.translate(x,y);if(face<0)ctx.scale(-1,1);ctx.drawImage(img,-w/2,-h,w,h);ctx.restore();return true;
}
function install(){
 const api=window.CatBondResonance;if(!api)return;
 let follower=null,lastSlot=null,followerDrawn=false;
 function drawFollower(ctx,{x,y,time,moving=false,face=1,scale=1}){
  if(!api.isMulingFollowing()){follower=null;followerDrawn=false;return false}
  const slot=window.State.S;if(slot!==lastSlot){lastSlot=slot;follower=null}
  const tx=x-face*74*scale,ty=y+18*scale;if(!follower)follower={x:tx,y:ty};const walking=moving||Math.hypot(tx-follower.x,ty-follower.y)>5;
  follower.x+=(tx-follower.x)*.14;follower.y+=(ty-follower.y)*.14;
  followerDrawn=drawMuling(ctx,{x:follower.x,y:follower.y,scale,time,moving:walking,face});return followerDrawn;
 }
 function followerHit(x,y,radius=36){return !!(followerDrawn&&follower&&lastSlot===window.State.S&&api.isMulingFollowing()&&Math.hypot(x-follower.x,y-(follower.y-30))<=radius)}
 function interactFollower({x,y,playerX,playerY,region,radius=36,reach=120}){if(!followerHit(x,y,radius)||Math.hypot(playerX-follower.x,playerY-follower.y)>reach)return false;return talk("muling",region)}
 function talk(id,region,requestedScene){
  const v=api.view();if(requestedScene&&requestedScene!==v.current?.id)return false;
  const r=v.current?api.recordNPC({sceneId:v.current.id,npcId:id,region}):{ok:false};
  if(r.ok){api.showCurrent();return true}
  const p=api.npcProfile(id);
  if(p){const a=api.ambientAvailable(region).filter(a=>a.npc===id);if(a.length){window.dispatchEvent(new CustomEvent("cat-bond-resonance-npc-profile",{detail:{...p,ambient:a}}));return true}}
  return false;
 }
 const gardenAdapter={getHomeNpcs:()=>api.residents("garden"),drawHomeNpc(ctx,npc,position){return drawResident(ctx,npc.id,position)},interactHomeNpc:id=>talk(id,"garden")};
 window.SunlitGarden?.registerNarrativeAdapter?.(gardenAdapter);
 window.CatBondResonanceNPC=Object.freeze({residents:api.residents,profile:api.npcProfile,talk,drawResident,drawFollower,followerHit,interactFollower,gardenAdapter});
}
if(document.readyState==="complete")install();else document.addEventListener("DOMContentLoaded",install,{once:true});
