// Canonical NPC presence and companion presentation adapter.
// Does not duplicate quest, trust, region progression, or the Luna arc.
import {campaign} from "./campaign.mjs";
import {hasPendingDialogue} from "./dialogue-ui.mjs";
import {mountHomeConversation,skyChapterVisitors} from "./home-conversations.mjs";
const root=new URL("../../assets/npc/",import.meta.url);
const load=name=>{const img=new Image();img.src=new URL(name,root).href;return img};
const residentImages=new Map();
const mulingGarden=load('../core-art-remaster/leads/muling.webp');
function residentImage(id){
 if(!campaign.regions.includes(campaign.cast[id]?.region))return null;
 if(!residentImages.has(id))residentImages.set(id,load(id+"-painted.webp"));
 return residentImages.get(id);
}
function drawResident(ctx,id,{x,y,scale=1,time=0}){
 // The dialogue portrait owns the speaking actor while the modal is visible.
 const dialogue=document.querySelector(".res-host .res-dialogue:not([hidden])");if(dialogue?.dataset.speaker===id&&dialogue.querySelector(".res-portrait:not([hidden])"))return false;
 if(id==='muling'){if(!mulingGarden.complete||!mulingGarden.naturalWidth)return false;const fit=Math.min(118*scale/mulingGarden.naturalWidth,108*scale/mulingGarden.naturalHeight),w=mulingGarden.naturalWidth*fit,h=mulingGarden.naturalHeight*fit;ctx.save();ctx.translate(x,y);ctx.save();ctx.scale(1,.22);const shadow=ctx.createRadialGradient(0,0,0,0,0,Math.max(1,w*.46));shadow.addColorStop(0,"#20272b44");shadow.addColorStop(1,"#20272b00");ctx.fillStyle=shadow;ctx.fillRect(-w/2,-w/2,w,w);ctx.restore();ctx.drawImage(mulingGarden,-w/2,-h,w,h);ctx.restore();return true;}
 const image=residentImage(id);
 if(!image?.complete||!image.naturalWidth)return false;
 const height=84*scale,width=height*image.naturalWidth/image.naturalHeight;
 ctx.drawImage(image,x-width/2,y-height,width,height);
 return true;
}
function openingEncounter(api){
 const owner=window.State.S,token=api.captureAction(),stage=document.getElementById("stage");if(!stage||api.view().current?.id!=="prologue:P-05"||api.view().openingMet||window.__game?.scene!=="yard")return false;
 if(document.getElementById("cb-traveler-encounter"))return true;
 const root=document.createElement("div");root.id="cb-traveler-encounter";root.className="cb-story-overlay is-visible res-host res-home-conversation";
 const panel=document.createElement("section");panel.className="res-dialogue";panel.dataset.speaker="muling";panel.setAttribute("role","dialog");panel.setAttribute("aria-modal","true");const art=document.createElement("img");art.className="res-portrait";art.alt="";art.src=mulingGarden.src;
 const body=document.createElement("div"),name=document.createElement("h2"),copy=document.createElement("p"),controls=document.createElement("div"),next=document.createElement("button"),close=document.createElement("button");body.className="res-body";name.className="res-speaker";copy.className="res-line";controls.className="res-controls cb-encounter-controls";
 for(const b of [next,close])b.type="button";next.className="cb-encounter-next";close.className="cb-encounter-leave";copy.setAttribute("aria-live","polite");
 controls.append(next,close);body.append(name,copy,controls);panel.append(art,body);root.append(panel);let step=0;
 const lines=[
 ["陌生猫","Stranger","你可算醒啦！","You're awake at last!","继续","Continue"],
 ["你","You","咦？你在等我吗？","Huh? Were you waiting for me?","继续","Continue"],
 ["陌生猫","Stranger","我路过的时候看你睡在这儿。怎么，找不到回家的路啦？","I found you asleep here. Lost your way home?","继续","Continue"],
 ["你","You","我……连自己叫什么都想不起来了。你认识我吗？","I… can't even remember my name. Do you know me?","继续","Continue"],
 ["暮铃","Luna","不认识。我叫暮铃，这儿是阳光花园。风铃镇的檐灯爷爷常来修屋子，没准儿见过你呢。","No. I'm Luna, and this is Sunlit Garden. Alder in Windchime Town used to fix up the house. He might have seen you before.","继续","Continue"],
 ["你","You","那我去找他！不过……风铃镇怎么走呀？","I'll go ask him! Um… which way is Windchime Town?","继续","Continue"],
 ["暮铃","Luna","别急，我先去镇上等你。对啦，草地上有块鱼饼，饿了就吃。","No rush. I'll meet you in town. Oh, there's a fish cake in the garden if you're hungry.","告别","Say goodbye"]
 ];

 function dispose(){root.remove();window.removeEventListener("morrowwish-language-change",render);window.removeEventListener("cat-bond-active-save-changed",dispose);window.removeEventListener("pagehide",dispose);}
 function render(){if(owner!==window.State.S||window.__game?.scene!=="yard"){dispose();return}const zh=window.MorrowwishI18n?.get?.()==="zh",i=zh?0:1,l=lines[step];const player=l[0]==="你";panel.dataset.speaker=player?"player":"muling";const url=player?new URL("../../assets/core-art-remaster/leads/player.webp",import.meta.url).href:mulingGarden.src;if(art.src!==url)art.src=url;name.textContent=l[i];copy.textContent=l[2+i];next.textContent=l[4+i];close.textContent=zh?"返回花园":"Back to garden";}
 function advance(){if(owner!==window.State.S||window.__game?.scene!=="yard"||api.view().current?.id!=="prologue:P-05"){dispose();return}if(step<lines.length-1){step++;render();return}const r=api.meetTraveler(token);if(r.ok||api.view().openingMet)dispose();else copy.textContent=window.MorrowwishI18n?.get?.()==="zh"?"无法保存，请重试。也可以暂时离开。":"Unable to save. Retry or leave for now.";}
 next.onclick=advance;body.addEventListener("click",e=>{if(!e.target.closest("button,select,a,input"))advance()});close.onclick=dispose;root.onkeydown=e=>{if(e.key==="Escape"){e.preventDefault();dispose()}else if((e.key==="Enter"||e.key===" ")&&!e.target.closest("button,select,a,input")){e.preventDefault();advance()}};stage.append(root);window.addEventListener("morrowwish-language-change",render);window.addEventListener("cat-bond-active-save-changed",dispose);window.addEventListener("pagehide",dispose,{once:true});render();next.focus();return true;
}
function install(){
 const api=window.CatBondResonance;if(!api)return;
 function talk(id,region,requestedScene){
  const v=api.view();if(requestedScene&&requestedScene!==v.current?.id)return false;
  if(region==="garden"&&id==="muling"&&v.current?.id==="prologue:P-05"&&!v.openingMet)return openingEncounter(api);
  if(region==="garden"&&skyChapterVisitors(v).includes(id)&&!api.ambientAvailable(region).some(a=>a.npc===id))return mountHomeConversation(id,api);
  // A completed story must not be treated as a pending scene. Luna’s home
  // conversation is the ending’s payoff, even if an old scene is retained in view.
  if(region==="garden"&&v.ending&&id==="muling")return mountHomeConversation(id,api);
  const r=v.current?api.recordNPC({sceneId:v.current.id,npcId:id,region,token:api.captureAction()}):{ok:false};
  const storyPending=v.current&&(v.objective.some(o=>o.startsWith("npc:"))||hasPendingDialogue(v));
  if(r.ok&&(!r.dialogueOnly||storyPending)){if(v.current.id==="epilogue:E-01"){window.__game?.toast?.({zh:"亲眼看见伙伴的新生活。可以回顾旅程了。",en:"You have seen your friends’ new lives. You can revisit the journey now."});return true;}if(v.current.id==="starfall:F-01"&&!api.view().lineReady){const next=api.view().objective[0];window.__game?.toast?.(next==="npc:central-dispute"?{zh:"砾川：那颗假星把商队困住了。去找星芽。",en:"Flint: The false star has trapped the caravan. Find Nova."}:{zh:"先辨认真星，引导商队离开。",en:"Verify the real stars and guide the caravan to safety."});return true;}api.showCurrent();return true}
  const p=api.npcProfile(id);
  if(p){const a=api.ambientAvailable(region).filter(a=>a.npc===id);if(a.length){window.dispatchEvent(new CustomEvent("cat-bond-resonance-npc-profile",{detail:{...p,ambient:a}}));return true}}
  if(region==="garden"&&(v.ending||skyChapterVisitors(v).includes(id)))return mountHomeConversation(id,api);
  return false;
 }
 const gardenAdapter={getHomeNpcs:()=>{const existing=api.residents("garden");const extra=skyChapterVisitors(api.view()).filter(id=>!existing.some(n=>n.id===id)).map(id=>({...api.npcProfile(id),visiting:true})).filter(n=>n.id);return [...existing,...extra];},drawHomeNpc(ctx,npc,position){return drawResident(ctx,npc.id,position)},interactHomeNpc:id=>talk(id,"garden")};
 window.SunlitGarden?.registerNarrativeAdapter?.(gardenAdapter);
 window.CatBondResonanceNPC=Object.freeze({residents:api.residents,profile:api.npcProfile,talk,drawResident,gardenAdapter});
}
if(document.readyState==="complete")install();else document.addEventListener("DOMContentLoaded",install,{once:true});
