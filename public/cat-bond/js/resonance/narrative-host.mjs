import "./adventure-play.mjs?v=illustrated-activities-20261127";
import {companionTalents} from "./companion-talents.mjs";
import {campaign} from "./campaign.mjs";
import {getSlotRuntime} from "./slot-runtime.mjs";
import {mountDialogue,awaitingGameplay} from "./dialogue-ui.mjs";
import {mountKeyExchange} from "./key-exchange.mjs";
import {isLibraryReveal,mountLibraryReveal} from "./library-reveal.mjs";
const lang=()=>window.MorrowwishI18n?.get?.()==="zh"?"zh":"en";
const portraitRoot=new URL("../../assets/npc/",import.meta.url);
function portrait(id,scene,cursor){
 if(id==="player")return new URL("../core-art-remaster/leads/"+(scene==="library:M-03"&&cursor>=2?"player-reveal":"player")+".webp",portraitRoot).href;
 if(id==="muling")return new URL("../core-art-remaster/leads/"+(["library:M-03","library:M-04"].includes(scene)?"muling-uneasy":"muling")+".webp",portraitRoot).href;
 if(campaign.regions.includes(campaign.cast[id]?.region))return new URL(id+"-painted.webp",portraitRoot).href;
 return null;
}
function install(){
 const stage=document.getElementById("stage"),State=window.State;
 if(!stage||!State||window.CatBondResonance)return;
 let dialogue=null,root=null,slot=null,openedScene=null,scheduled=false,keyExchange=null,libraryReveal=null,deferredDialogue=null;
 const announce=detail=>{const savedSlot=State.S;queueMicrotask(()=>{if(savedSlot!==State.S)return;window.dispatchEvent(new CustomEvent("cat-bond-resonance-changed",{detail}));if(detail.joined?.length){const names=detail.joined.map(id=>{const n=campaign.cast[id].name;const tier=window.GameData?.STORY_SPECIES?.["story_"+id]?.rarity;return {zh:n.zh+(tier?" · "+tier:""),en:n.en+(tier?" · "+tier:"")};});window.__game?.toast?.({zh:names.map(n=>n.zh).join("、")+" 已加入战队 · 可在队伍中选择出战",en:names.map(n=>n.en).join(", ")+" joined the party · select them in Party"});const talent=detail.joined.map(id=>companionTalents[id]).find(Boolean);if(talent)window.__game?.toast?.({zh:"新专长："+talent.name[0]+" · "+talent.description[0]+"。上阵试试！",en:"New talent: "+talent.name[1]+" · "+talent.description[1]+". Try it in battle!"});if(window.__game?.scene==="yard")window.__game?.rebuildYard?.();}if(detail.left?.length){window.__game?.toast?.({zh:"暮铃暂时离开战队",en:"Luna has temporarily left the party"});}if(detail.trustChanges?.length){const names=detail.trustChanges.map(c=>({zh:campaign.cast[c.id].name.zh+" "+(c.delta>0?"+":"")+c.delta,en:campaign.cast[c.id].name.en+" "+(c.delta>0?"+":"")+c.delta}));window.__game?.toast?.({zh:"信任变化 · "+names.map(n=>n.zh).join(" / "),en:"Trust changed · "+names.map(n=>n.en).join(" / ")});}})};
 const runtime=getSlotRuntime(State);runtime.subscribe(announce);
 function close(){libraryReveal?.dispose();libraryReveal=null;keyExchange?.dispose();keyExchange=null;dialogue?.dispose();dialogue=null;root?.remove();root=null;openedScene=null;slot=null;}
 function show(){
  const v=runtime.view(),game=window.__game;
  if(!v.current||game?.scene==="battle"||document.getElementById("cb-finale-result"))return false;
  // Regional battle rewards must be acknowledged before the next story overlay.
  if(document.querySelector('#panel.open #library-battle-ok')){deferredDialogue={owner:State.S,id:v.current.id};return false;}
  // Cinematic-only scenes have a physical entrance and an approved shot sequence.
  // Reading their dialogue in the journal must never consume the cinematic cursor.
  if(v.current.chapter!=="prologue"&&v.current.requires.some(op=>op.startsWith("cinematic:"))&&v.objective.some(op=>op.startsWith("cinematic:"))){
   game?.toast?.(v.current.chapter==="finale"?{zh:"前往中央星铃，选择观看剧情。",en:"Visit the Star Bell and choose Watch the story scene."}:{zh:"前往星坠原遗迹，选择观看剧情。",en:"Visit the ruins in Starfall and choose Watch the story scene."});return false;
  }
  if(v.current.chapter==="epilogue"&&game?.scene!=="yard"){
   game?.toast?.({zh:"回到阳光花园，与暮铃交谈。",en:"Return to Sunlit Garden and speak with Luna."});return false;
  }
  if(v.current.chapter==="finale"&&(window.WorldMap?.currentRegion!=="finale"||window.WorldMap?.mode!=="region")){game?.toast?.({zh:"请前往中央星铃继续终章。",en:"Travel to the Star Bell to continue the finale."});return false;}
  if(v.current.chapter==="starfall"&&(window.WorldMap?.currentRegion!=="starfall"||window.WorldMap?.mode!=="region")){game?.toast?.({zh:"请前往星坠原继续剧情。",en:"Travel to Starfall to continue the story."});return false;}
  if(awaitingGameplay(v)){if(root)close();return false;}
  if(slot===State.S&&openedScene===v.current.id&&(dialogue||keyExchange)){(dialogue||keyExchange).render();return true}
  close();slot=State.S;openedScene=v.current.id;
  root=document.createElement("div");root.className="cb-story-overlay is-visible res-host";root.dataset.scene=openedScene;stage.append(root);
  const action=runtime.capture();
  if(isLibraryReveal(openedScene))libraryReveal=mountLibraryReveal(root,portrait,scheduleFinish);
  if(v.current.id==="epilogue:E-03"&&v.cursor===v.current.lines.length&&v.objective.includes("npc:second-garden-key")){showKey(action);return true}
  // Bind each overlay to the slot and scene it opened in. Even a click in the
  // interval before the slot-change listener runs cannot write to another slot.
  const boundEngine={view:()=>runtime.isCurrentAction(action)?runtime.view():{current:null},choose:id=>runtime.choose(id,action),nextLine:()=>runtime.nextLine(action)};
  dialogue=mountDialogue({root,engine:boundEngine,campaign,language:lang,resolvePortrait:portrait,onRender:(view,k)=>libraryReveal?.render(view,k),onPersist:()=>{},onClose:close,onLanguage:value=>window.MorrowwishI18n?.set?.(value),onAwaitAction:()=>{scheduleFinish()}});
  return true;
 }
 function showKey(action){
  if(keyExchange||!root||!runtime.isCurrentAction(action))return;
  dialogue?.dispose();dialogue=null;
  keyExchange=mountKeyExchange({root,language:lang,portrait:portrait("muling"),isCurrent:()=>window.__game?.scene==="yard"&&runtime.isCurrentAction(action),commit:()=>window.__game?.scene!=="yard"?{ok:false,reason:"wrong-location"}:runtime.completeNPCScene({sceneId:"epilogue:E-03",operation:"npc:second-garden-key",npcId:"muling",region:"garden",verified:true,token:action}),onComplete:()=>{close();scheduleFinish()},onClose:close,onLanguage:value=>window.MorrowwishI18n?.set?.(value)});
 }
 function showEndingTitle(){
  const ending=document.createElement("section");ending.className="cb-story-overlay is-visible res-ending-title";
  ending.setAttribute("role","dialog");ending.setAttribute("aria-modal","true");
  Object.assign(ending.style,{position:"absolute",inset:"0",zIndex:"40",display:"grid",placeItems:"center",overflow:"hidden",background:"#f6e9dc",alignContent:"end",padding:"clamp(12px,4vh,38px)"});
  const art=document.createElement("img");art.src=new URL(window.matchMedia("(orientation:portrait) and (max-width:700px)").matches?"../../assets/mobile-portrait/story-e03-garden.webp":"../../assets/core-art-remaster/story/e03-garden.webp",import.meta.url).href;
  art.alt="";Object.assign(art.style,{position:"absolute",inset:"0 0 20% 0",width:"100%",height:"80%",objectFit:"contain",objectPosition:"center"});
  const card=document.createElement("div");Object.assign(card.style,{position:"relative",textAlign:"center",padding:"10px 22px",color:"#50415d",borderRadius:"18px",background:"#fff5e9ef",maxWidth:"95%"});
  const title=document.createElement("h2");title.textContent="THE BELL RINGS AGAIN";title.style.font="700 clamp(24px,5vw,54px) Georgia,serif";title.style.letterSpacing=".10em";
  const sub=document.createElement("p"),button=document.createElement("button");button.type="button";card.append(title,sub,button);ending.append(art,card);stage.append(ending);
  function render(){title.textContent=lang()==="zh"?"星铃再次响起":"THE BELL RINGS AGAIN";sub.textContent=lang()==="zh"?"世界再次回应":"The world answers again";button.textContent=lang()==="zh"?"回到阳光花园":"Return to Sunlit Garden";}
  function dismiss(){ending.remove();window.removeEventListener("cat-bond-active-save-changed",dismiss);window.removeEventListener("morrowwish-language-change",render);}
  button.onclick=dismiss;window.addEventListener("cat-bond-active-save-changed",dismiss);window.addEventListener("morrowwish-language-change",render);render();button.focus();
  const mobile=()=>window.matchMedia("(orientation:portrait) and (max-width:700px)").matches;
  const shots=[
   {wide:"../../assets/combat/star-bell-arena-chorus-wide.webp",tall:"../../assets/mobile-portrait/battle-finale-chorus.webp",zh:"六座古铃再次回应，失去的记忆回来了。",en:"The six bells answer again, and lost memories return."},
   {wide:"../../assets/core-art-remaster/story/b04-reunion.webp",tall:"../../assets/mobile-portrait/story-b04-reunion.webp",zh:"这一次，他们一起回家。",en:"This time, they go home together."},
   {wide:"../../assets/core-art-remaster/story/e03-garden.webp",tall:"../../assets/mobile-portrait/story-e03-garden.webp",zh:"朋友们快到了。多准备几杯茶吧。",en:"Their friends are coming. Put on a few more cups of tea."}
  ];let shot=0,timer=0,disposed=false;const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const skip=document.createElement("button");skip.type="button";skip.className="res-ending-skip";ending.append(skip);
  const caption=document.createElement("p");caption.className="res-ending-caption";ending.append(caption);
  ending.classList.add("res-ending-film");button.hidden=true;card.hidden=true;art.style.inset="0";art.style.height="100%";
  function localizeFilm(){skip.textContent=lang()==="zh"?"跳过演出":"Skip scene";caption.textContent=shots[Math.min(shot,shots.length-1)][lang()];}
  function finishFilm(){clearTimeout(timer);if(disposed||!ending.isConnected)return;shot=shots.length-1;art.getAnimations?.().forEach(a=>a.cancel());art.src=new URL(mobile()?shots[shot].tall:shots[shot].wide,import.meta.url).href;card.hidden=false;button.hidden=false;caption.hidden=true;skip.hidden=true;art.style.inset="0 0 20% 0";art.style.height="80%";if(!reduced)card.animate([{opacity:0,transform:"translateY(12px)"},{opacity:1,transform:"translateY(0)"}],{duration:800,fill:"forwards"});window.MorrowwishAudio?.note?.(523.25,.8,.15);button.focus();}
  function showShot(){if(disposed||!ending.isConnected)return;if(shot>=shots.length){finishFilm();return;}const s=shots[shot],img=new Image(),url=new URL(mobile()?s.tall:s.wide,import.meta.url).href;let done=false;const next=()=>{if(done||disposed||skip.hidden)return;done=true;clearTimeout(timer);shot++;showShot();};timer=setTimeout(next,6500);img.onload=()=>{if(done||disposed||!ending.isConnected||skip.hidden)return;clearTimeout(timer);art.getAnimations?.().forEach(a=>a.cancel());art.src=url;localizeFilm();if(!reduced)art.animate([{opacity:0,transform:"scale(1)"},{opacity:1,transform:"scale(1.035)"}],{duration:3200,fill:"forwards",easing:"ease-out"});window.MorrowwishAudio?.note?.([392,493.88,587.33][shot],.5,.10);timer=setTimeout(next,3400);};img.onerror=next;img.src=url;}
  skip.onclick=finishFilm;ending.addEventListener("keydown",e=>{if(e.key==="Escape"){e.preventDefault();finishFilm();}});
  const cleanupFilm=()=>{disposed=true;clearTimeout(timer);window.removeEventListener("morrowwish-language-change",localizeFilm);window.removeEventListener("cat-bond-active-save-changed",cleanupFilm);};
  button.addEventListener("click",cleanupFilm,{once:true});window.addEventListener("cat-bond-active-save-changed",cleanupFilm,{once:true});window.addEventListener("morrowwish-language-change",localizeFilm);localizeFilm();if(reduced)finishFilm();else{skip.focus();showShot();}
 }
 function scheduleFinish(){
  if(scheduled)return;scheduled=true;const scheduledRoot=State.S;queueMicrotask(()=>{scheduled=false;
   if(scheduledRoot!==State.S)return;
   if(slot&&slot!==State.S){close();return}
   const v=runtime.view();if(!v.current)return;
   // Title handoff exclusively retires the four historical presentation checkpoints.
   // Background slot-change notifications cannot consume them before the context overlay is shown.
   if(/^prologue:P-0[1-4]$/.test(v.current.id)&&campaign.openingPresentationVersion===2)return;
   if(["epilogue:E-01","epilogue:E-02","epilogue:E-03"].includes(v.current.id)&&window.__game?.scene!=="yard"){if(root)close();return;}
   if(dialogue&&slot===State.S&&openedScene===v.current.id&&awaitingGameplay(v)){close();return;}
   if(dialogue&&slot===State.S&&openedScene===v.current.id&&v.cursor===v.current.lines.length){
    if(v.current.id==="epilogue:E-02"&&v.objective.includes("npc:public-accountability")&&(!v.current.choices.length||v.choice)){const r=runtime.completeNPCScene({sceneId:v.current.id,operation:"npc:public-accountability",npcId:"muling",region:"garden",verified:true,token:runtime.capture()});if(!r.ok)return;scheduleFinish();return}
    if(v.current.id==="epilogue:E-03"&&v.objective.includes("npc:second-garden-key")){showKey(runtime.capture());return}
    if(libraryReveal?.departurePending(v))return;
    if(v.objective.length&&(!v.current.choices.length||v.choice)){close();return;}
   }
   if(v.cursor===v.current.lines.length&&!v.objective.length&&(!v.current.choices.length||v.choice)){
    const old=v.current.id,r=runtime.finish();if(r.ok){if(openedScene===old)close();if(old==="epilogue:E-03")showEndingTitle();else if(old==="epilogue:E-01"&&window.__game?.scene==="yard")show();}
   }
  })
 }
 function refresh(){if(slot&&slot!==State.S)close();else if(dialogue||keyExchange){const v=runtime.view();if(openedScene!==v.current?.id||(dialogue&&awaitingGameplay(v)))close();else (dialogue||keyExchange).render()}scheduleFinish()}
 // The physical map interaction already validates movement and proximity. No generic story button can grant NPC evidence.
 window.addEventListener("cat-bond-resonance-npc-request",event=>{
  if(window.__game?.scene==="battle")return;
  const d=event.detail||{};if(window.CatBondResonanceNPC){if(!window.CatBondResonanceNPC.talk(d.npcId,d.region,d.sceneId))window.__game?.toast?.({zh:"暂时没有新的话题。",en:"Nothing new to discuss yet."});return}const r=runtime.recordNPC({...d,token:runtime.capture()});if(r.ok)show();
 });
 window.addEventListener("cat-bond-garden-entered",scheduleFinish);
 window.addEventListener("cat-bond-resonance-changed",refresh);
 window.addEventListener("cat-bond-active-save-changed",close);
 window.addEventListener("cat-bond-illustrations-ready",()=>{if(dialogue&&slot===State.S)dialogue.render()});
 // Detect external world/battle commits and slot replacements without a second progression store.
 let observedRoot=State.S,observedRevision=State.S.resonance?.revision??-1,observedView=runtime.view();
 setInterval(()=>{if(deferredDialogue){const pending=deferredDialogue;if(pending.owner!==State.S||pending.id!==runtime.view().current?.id)deferredDialogue=null;else if(!document.querySelector('#panel.open #library-battle-ok')&&window.__game?.scene!=='battle'){deferredDialogue=null;show();}}const revision=State.S.resonance?.revision??-1;if(observedRoot!==State.S||observedRevision!==revision){const sameSlot=observedRoot===State.S,old=observedView;observedRoot=State.S;observedRevision=revision;observedView=runtime.view();refresh();
  if(sameSlot&&!dialogue&&window.__game?.scene!=="battle"&&old.current?.id===observedView.current?.id&&(old.objective.length>observedView.objective.length||(!old.lineReady&&observedView.lineReady))&&(!old.lineReady||observedView.objective.length===0)&&observedView.lineReady&&observedView.cursor<observedView.current.lines.length)show();
 }},200);
 window.addEventListener("cat-bond-resonance-evidence",event=>{
  const r=runtime.evidence(event.detail);if(r.ok){const v=runtime.view();if(v.current?.lines.length&&v.lineReady)show();scheduleFinish()}
 });
 window.addEventListener("cat-bond-resonance-ambient-result",event=>{runtime.ambient(event.detail)});
 window.addEventListener("cat-bond-resonance-support-result",event=>{runtime.support(event.detail)});
 window.addEventListener("cat-bond-resonance-postgame-result",event=>{runtime.postgame(event.detail)});
 // Map and cinematic hosts can present the current scene without granting evidence.
 window.CatBondResonance=Object.freeze({captureAction:runtime.capture,meetTraveler:runtime.meetTraveler,isCurrentAction:runtime.isCurrentAction,exchange:runtime.exchange,initialize:runtime.initialize,npcProfile:runtime.npcProfile,residents:runtime.residents,isMulingFollowing:runtime.follows,view:runtime.view,snapshot:runtime.snapshot,showCurrent:show,close,recordEvidence:runtime.evidence,commitFinaleVictory:runtime.commitFinaleVictory,commitRuinsVictory:runtime.commitRuinsVictory,recordNPC:runtime.recordNPC,ambient:runtime.ambient,support:runtime.support,postgame:runtime.postgame,supportProfile:runtime.supportProfile,ambientAvailable:runtime.ambientAvailable});
}
if(document.readyState==="complete")install();else document.addEventListener("DOMContentLoaded",install,{once:true});
