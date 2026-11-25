import { harborSample } from "./harbor-sample-data.mjs";
import { BRANCH_DIALOGUE, createHarborState, normalizeHarborState, advanceHarborState, chooseHarborState } from "./harbor-sample-state.mjs";

const ROOT="/cat-bond/assets/npc/";
const SCENE=harborSample.scene;
const FACE={
 jiedeng:["guarded","worried","guarded","worried","soft"],
 qilan:["annoyed","annoyed","determined","determined","warm"]
};
const ASSETS={
 qilan:{curious:"qilan-curious.svg",annoyed:"qilan-annoyed.svg",determined:"qilan-determined.svg",warm:"qilan-warm.svg",worried:"qilan-worried.svg"},
 jiedeng:{guarded:"jiedeng-guarded.svg",worried:"jiedeng-worried.svg",firm:"jiedeng-firm.svg",soft:"jiedeng-soft.svg"}
};
const words={
 zh:{title:"霁潮港 · 拒绝点灯的守灯人",chapter:"第一章 · 霁潮港",close:"关闭",next:"继续",choice:"你的选择",comfort:"先安慰栖蓝",ask:"先询问岬灯过去的风暴",trust:"人物关系",quest:"新任务已接取",questTitle:"被淹没的航海日志",objective:"前往灯塔地下室，沿着潮痕找回旧救援日志",event:"剧情事件已记录",eventName:"H-02 · 守灯人的选择",finish:"继续冒险",active:"进行中",qilan:"栖蓝",jiedeng:"岬灯",roleQ:"年轻领航员",roleJ:"灯塔守护者",stage:"当前进度",hint:"选择会改变人物信任与后续支援倾向。",revisit:"已完成本段剧情。任务仍在进行。"},
 en:{title:"Misttide Harbor · The Keeper Who Refuses",chapter:"CHAPTER I · MISTTIDE HARBOR",close:"Close",next:"Continue",choice:"Your choice",comfort:"Comfort Qilan first",ask:"Ask Jiedeng about the old storm",trust:"Relationships",quest:"Quest accepted",questTitle:"The Flooded Logbook",objective:"Enter the lighthouse basement and follow the tide marks to recover the old rescue log",event:"Story event recorded",eventName:"H-02 · The Keeper's Choice",finish:"Return to adventure",active:"Active",qilan:"Qilan",jiedeng:"Jiedeng",roleQ:"Young Navigator",roleJ:"Lighthouse Keeper",stage:"Progress",hint:"Your choice changes trust and later support.",revisit:"This scene is complete. The quest remains active."}
};
const lang=()=>window.MorrowwishI18n?.get?.()==="zh"?"zh":"en";
const copy=x=>JSON.parse(JSON.stringify(x));
function getState(){
 const root=window.State?.S;if(!root)return null;
 if(!root.npcStories||typeof root.npcStories!=="object")root.npcStories={};
 root.npcStories.harborKeeper=normalizeHarborState(root.npcStories.harborKeeper);
 return root.npcStories.harborKeeper;
}
function persist(){try{window.State?.save?.();}catch(e){console.warn("Harbor sample save failed",e);}}
function supportPreference(){return getState()?.supportRoute||null;}
function mount(){
 const stage=document.getElementById("stage"),actions=document.getElementById("yard-actions"),game=window.__game;
 if(!stage||!actions||!game||document.getElementById("cb-harbor-story-open"))return;
 const launch=document.createElement("button");launch.id="cb-harbor-story-open";launch.type="button";launch.className="fab cb-story-launch";launch.innerHTML='<span aria-hidden="true">✦</span><small>剧情</small>';launch.setAttribute("aria-label","打开霁潮港剧情");launch.title="Misttide Harbor story";actions.append(launch);
 const tracker=document.createElement("button");tracker.id="cb-harbor-quest-tracker";tracker.type="button";tracker.hidden=true;tracker.className="cb-harbor-quest-tracker";stage.append(tracker);
 const overlay=document.createElement("section");overlay.className="cb-harbor-story";overlay.hidden=true;overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");overlay.setAttribute("aria-label","Misttide Harbor story");
 overlay.innerHTML=`
 <div class="cb-harbor-backdrop" aria-hidden="true"><img class="cb-harbor-bg" src="${ROOT}misttide-harbor.svg" alt=""><div class="cb-harbor-shade"></div><div class="cb-harbor-beam"></div></div>
 <header class="cb-harbor-top"><div><span class="cb-harbor-kicker"></span><h2 class="cb-harbor-title"></h2></div><div class="cb-harbor-tools"><button type="button" data-action="language" class="cb-harbor-tool">中文 / EN</button><button type="button" data-action="close" class="cb-harbor-tool" aria-label="Close">×</button></div></header>
 <div class="cb-harbor-cast"><figure class="cb-harbor-character active"><img class="cb-harbor-portrait" alt=""><figcaption></figcaption></figure><figure class="cb-harbor-character companion"><img class="cb-harbor-companion" alt=""><figcaption></figcaption></figure></div>
 <aside class="cb-harbor-relations"><h3></h3><div class="cb-harbor-relation" data-npc="qilan"><span class="cb-harbor-npc-name"></span><div class="cb-harbor-meter"><i></i></div><b></b></div><div class="cb-harbor-relation" data-npc="jiedeng"><span class="cb-harbor-npc-name"></span><div class="cb-harbor-meter"><i></i></div><b></b></div></aside>
 <main class="cb-harbor-dialogue"><div class="cb-harbor-speaker"></div><p class="cb-harbor-line" aria-live="polite"></p><div class="cb-harbor-hint"></div><div class="cb-harbor-actions"><button type="button" data-action="next" class="cb-harbor-primary"></button><button type="button" data-action="close" class="cb-harbor-secondary"></button></div><div class="cb-harbor-choices" hidden></div></main>
 <aside class="cb-harbor-quest" hidden><span class="cb-harbor-quest-kicker"></span><h3></h3><p></p><div class="cb-harbor-event"></div><button type="button" data-action="finish" class="cb-harbor-primary"></button></aside>
 <div class="cb-harbor-progress"></div>`;
 stage.append(overlay);
 let previousScene="yard",active=false,typingTimer=0;
 const $=sel=>overlay.querySelector(sel),t=()=>words[lang()];
 const portrait=(id,face)=>ROOT+(ASSETS[id]?.[face]||ASSETS[id]?.guarded||"");
 function currentLine(p){
  if(p.stage==="dialogue")return SCENE.lines[p.index]||null;
  if(p.stage==="branch")return BRANCH_DIALOGUE[p.choice]?.[p.branchIndex]||null;
  return null;
 }
 function setPortrait(id,face,slot){
  const img=$(slot==="main"?".cb-harbor-portrait":".cb-harbor-companion");
  const npc=harborSample.cast[id];if(!npc||!img)return;
  img.src=portrait(id,face);img.alt=npc.name[lang()];
  const figure=img.closest("figure");figure.querySelector("figcaption").textContent=npc.name[lang()];
  figure.classList.toggle("active",slot==="main");
 }
 function relation(){
  const p=getState(),w=t();
  $(".cb-harbor-relations h3").textContent=w.trust;
  for(const id of ["qilan","jiedeng"]){
   const el=$('.cb-harbor-relation[data-npc="'+id+'"]'),value=p.trust[id]||0;
   el.querySelector(".cb-harbor-npc-name").textContent=harborSample.cast[id].name[lang()];
   el.querySelector("b").textContent="+"+value;
   el.querySelector(".cb-harbor-meter i").style.width=Math.min(100,Math.max(0,value/10*100))+"%";
  }
 }
 function updateLaunch(){const w=t();launch.querySelector("small").textContent=lang()==="zh"?"剧情":"Story";launch.title=w.title;launch.setAttribute("aria-label",w.title)}
 function updateTracker(){const p=getState(),w=t();tracker.hidden=!p?.quest;if(p?.quest)tracker.textContent=(lang()==="zh"?"任务 · ":"QUEST · ")+w.questTitle+" · 0/1"}
 function bindSaveLoad(){const state=window.State;if(!state||state.__cbHarborLoadHooks)return;state.__cbHarborLoadHooks=true;for(const method of ["load","loadSlot","startNewGame","hardReset"]){const original=state[method];if(typeof original!=="function")continue;const wrapped=function(...args){const result=original.apply(this,args);window.dispatchEvent(new Event("cb-harbor-state-loaded"));return result};wrapped.__cbHarborHooked=true;state[method]=wrapped;}window.addEventListener("cb-harbor-state-loaded",updateTracker)}
 function render(){
  updateLaunch();
  if(!active)return;
  clearTimeout(typingTimer);
  const p=getState(),w=t(),line=currentLine(p);
  updateTracker();
  $(".cb-harbor-kicker").textContent=w.chapter;$(".cb-harbor-title").textContent=w.title;
  relation();
  const quest=$(".cb-harbor-quest"),dialogue=$(".cb-harbor-dialogue"),choices=$(".cb-harbor-choices");
  if(line){
   overlay.classList.toggle("is-memory",p.stage==="branch");
   $(".cb-harbor-bg").src=ROOT+(p.stage==="branch"?"harbor-storm-memory.svg":"misttide-harbor.svg");
   const face=line.face||FACE[line.speaker]?.[p.index]||"guarded";
   setPortrait(line.speaker,face,"main");
   const other=line.speaker==="qilan"?"jiedeng":"qilan";
   setPortrait(other,other==="qilan"?"curious":"guarded","companion");
   $(".cb-harbor-speaker").textContent=harborSample.cast[line.speaker].name[lang()];
   $(".cb-harbor-line").textContent=line.text?.[lang()] ?? line[lang()];
   $(".cb-harbor-hint").textContent=w.hint;
   $(".cb-harbor-actions").hidden=false;choices.hidden=true;quest.hidden=true;dialogue.hidden=false;
   $(".cb-harbor-primary").textContent=w.next;$(".cb-harbor-secondary").textContent=w.close;
   $(".cb-harbor-progress").textContent=(p.stage==="dialogue"?"H-02 · "+(p.index+1)+"/"+SCENE.lines.length:"H-02 · "+(p.branchIndex+1)+"/3");
  }else if(p.stage==="choice"){
   overlay.classList.remove("is-memory");$(".cb-harbor-bg").src=ROOT+"misttide-harbor.svg";
   setPortrait("qilan","determined","main");setPortrait("jiedeng","worried","companion");
   $(".cb-harbor-speaker").textContent=w.choice;$(".cb-harbor-line").textContent=w.hint;$(".cb-harbor-hint").textContent="";
   $(".cb-harbor-actions").hidden=true;dialogue.hidden=false;choices.hidden=false;choices.replaceChildren();
   for(const c of SCENE.choices){
    const b=document.createElement("button");b.type="button";b.className="cb-harbor-choice";b.textContent=c.label[lang()];b.addEventListener("click",()=>{const next=chooseHarborState(getState(),c.id);if(!next)return;window.State.S.npcStories.harborKeeper=next;persist();render();});choices.append(b);
   }
   quest.hidden=true;$(".cb-harbor-progress").textContent="H-02 · "+w.choice;
  }else{
   overlay.classList.add("is-memory");$(".cb-harbor-bg").src=ROOT+"harbor-storm-memory.svg";
   dialogue.hidden=true;choices.hidden=true;quest.hidden=false;
   const p=getState();$(".cb-harbor-quest-kicker").textContent=w.quest;
   $(".cb-harbor-quest h3").textContent=w.questTitle;$(".cb-harbor-quest p").textContent=w.objective;
   $(".cb-harbor-event").textContent=w.event+": "+w.eventName;
   $(".cb-harbor-quest [data-action=finish]").textContent=w.finish;
   $(".cb-harbor-progress").textContent=w.active+" · "+w.questTitle;

  }
 }
 function open(){
  const p=getState();if(!p)return;
  previousScene=game.scene||"yard";if(previousScene==="battle")return;
  active=true;overlay.hidden=false;game.scene="story";document.body.classList.add("cb-harbor-story-open");render();overlay.querySelector('[data-action="next"]')?.focus();
 }
 function close(){
  if(!active)return;active=false;clearTimeout(typingTimer);overlay.hidden=true;document.body.classList.remove("cb-harbor-story-open");
  game.scene=previousScene==="story"?"yard":previousScene;persist();
  launch.focus();
 }
 function advance(){
  const p=getState();if(!p)return;
  if(p.stage==="dialogue"||p.stage==="branch"){window.State.S.npcStories.harborKeeper=advanceHarborState(p);persist();render();}
 }
 function onClick(e){
  const action=e.target.closest("[data-action]")?.dataset.action;
  if(!action)return;
  if(action==="close")close();
  if(action==="next")advance();
  if(action==="finish")close();
  if(action==="language"){window.MorrowwishI18n?.set?.(lang()==="zh"?"en":"zh");render();}
 }
 overlay.addEventListener("click",onClick);
 overlay.addEventListener("keydown",e=>{if(e.key==="Escape"){e.preventDefault();close();}else if(e.key==="Enter"&&getState()?.stage!=="choice"&&getState()?.stage!=="quest"){e.preventDefault();advance();}});
 window.addEventListener("morrowwish-language-change",()=>{updateLaunch();render()});
 launch.addEventListener("click",open);tracker.addEventListener("click",open);
 bindSaveLoad();updateTracker();render();
 window.CatBondHarborSample={open,close,state:()=>copy(getState()),supportPreference};
}
if(document.readyState==="complete")mount();else document.addEventListener("DOMContentLoaded",mount,{once:true});
