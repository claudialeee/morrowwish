// Canonical NPC presence and companion presentation adapter.
// Does not duplicate quest, trust, region progression, or the Muling arc.
import {campaign} from "./campaign.mjs";
import {mountHomeConversation} from "./home-conversations.mjs";
const root=new URL("../../assets/npc/",import.meta.url);
const load=name=>{const img=new Image();img.src=new URL(name,root).href;return img};
const residentImages=new Map();
const mulingGarden=load('../cinematics/characters/muling/traveler-neutral.webp');
function residentImage(id){
 if(!campaign.regions.includes(campaign.cast[id]?.region))return null;
 if(!residentImages.has(id))residentImages.set(id,load(id+"-painted.webp"));
 return residentImages.get(id);
}
function drawResident(ctx,id,{x,y,scale=1,time=0}){
 if(id==='muling'){if(!mulingGarden.complete||!mulingGarden.naturalWidth)return false;const h=132*scale,w=h*mulingGarden.naturalWidth/mulingGarden.naturalHeight;ctx.save();ctx.shadowColor='rgba(24,27,39,.25)';ctx.shadowBlur=9;ctx.drawImage(mulingGarden,x-w/2,y-h,w,h);ctx.restore();return true;}
 const image=residentImage(id);
 if(!image?.complete||!image.naturalWidth)return false;
 const height=84*scale,width=height*image.naturalWidth/image.naturalHeight;
 ctx.drawImage(image,x-width/2,y-height+Math.sin(time*2)*scale,width,height);
 return true;
}
function install(){
 const api=window.CatBondResonance;if(!api)return;
 function talk(id,region,requestedScene){
  const v=api.view();if(requestedScene&&requestedScene!==v.current?.id)return false;
  if(region==="garden"&&v.ending)return mountHomeConversation(id,api);
  const r=v.current?api.recordNPC({sceneId:v.current.id,npcId:id,region}):{ok:false};
  if(r.ok){api.showCurrent();return true}
  const p=api.npcProfile(id);
  if(p){const a=api.ambientAvailable(region).filter(a=>a.npc===id);if(a.length){window.dispatchEvent(new CustomEvent("cat-bond-resonance-npc-profile",{detail:{...p,ambient:a}}));return true}}
  return false;
 }
 const gardenAdapter={getHomeNpcs:()=>api.residents("garden"),drawHomeNpc(ctx,npc,position){return drawResident(ctx,npc.id,position)},interactHomeNpc:id=>talk(id,"garden")};
 window.SunlitGarden?.registerNarrativeAdapter?.(gardenAdapter);
 window.CatBondResonanceNPC=Object.freeze({residents:api.residents,profile:api.npcProfile,talk,drawResident,gardenAdapter});
}
if(document.readyState==="complete")install();else document.addEventListener("DOMContentLoaded",install,{once:true});
