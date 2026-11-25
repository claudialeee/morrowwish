import {MULING_INTERACTIONS,createMulingState,normalizeMulingState,completeMulingInteraction,setMulingFollowing} from "./muling-companion-data.mjs";
const ROOT="/cat-bond/assets/npc/";
const FACES={neutral:"muling-neutral.svg",dry:"muling-dry.svg",nervous:"muling-nervous.svg",sheepish:"muling-sheepish.svg",warm:"muling-warm.svg",curious:"muling-neutral.svg"};
const words={zh:{title:"暮铃同行",kicker:"同行者 · 暮铃",trust:"信任",following:"正在同行",solo:"暂时独自探索",followOn:"邀请暮铃同行",followOff:"让暮铃暂时休息",choose:"想从哪件小事开始？",next:"继续",remember:"记住这一刻",close:"关闭",completed:"已留在共同记忆里",back:"返回霁潮港",count:"已发现的日常",hint:"这些日常互动不会提前揭晓她的秘密。"},en:{title:"Travel with Muling",kicker:"COMPANION · MULING",trust:"Trust",following:"Traveling together",solo:"Exploring alone for now",followOn:"Invite Muling to follow",followOff:"Let Muling rest for now",choose:"Which small moment shall we share?",next:"Continue",remember:"Keep this moment",close:"Close",completed:"Added to your shared memories",back:"Return to Misttide Harbor",count:"Moments discovered",hint:"These everyday moments do not reveal her secret early."}};
const lang=()=>window.MorrowwishI18n?.get?.()==="zh"?"zh":"en";
const copy=x=>JSON.parse(JSON.stringify(x));
const sprite=new Image();sprite.src=ROOT+"muling-follow-sprite.svg";
function mount(){
 const stage=document.getElementById("stage"),actions=document.getElementById("yard-actions"),game=window.__game;
 if(!stage||!actions||!game||document.getElementById("cb-muling-companion-open"))return;
 const launch=document.createElement("button");launch.id="cb-muling-companion-open";launch.type="button";launch.className="fab cb-muling-launch";launch.innerHTML='<span aria-hidden="true">♧</span><small>同行</small>';actions.append(launch);
 const overlay=document.createElement("section");overlay.className="cb-muling-companion";overlay.hidden=true;overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");overlay.setAttribute("aria-label","Muling companion");
 overlay.innerHTML=`
 <div class="cb-muling-bg-wrap"><img class="cb-muling-bg" src="${ROOT}sunlit-garden-companion.svg" alt=""><div class="cb-muling-bg-shade"></div></div>
 <header class="cb-muling-header"><div><span class="cb-muling-kicker"></span><h2 class="cb-muling-title"></h2></div><div class="cb-muling-tools"><button type="button" data-muling-action="language">中文 / EN</button><button type="button" data-muling-action="close" aria-label="Close">×</button></div></header>
 <div class="cb-muling-content">
  <figure class="cb-muling-portrait-wrap"><img class="cb-muling-portrait" src="${ROOT}muling-neutral.svg" alt="Muling"><figcaption>暮铃 · Muling</figcaption></figure>
  <aside class="cb-muling-side"><div class="cb-muling-status"><span class="cb-muling-trust-label"></span><b class="cb-muling-trust-value"></b><div class="cb-muling-trust-bar"><i></i></div></div><div class="cb-muling-habit-list"></div><button type="button" class="cb-muling-follow" data-muling-action="follow"></button></aside>
  <main class="cb-muling-dialogue"><span class="cb-muling-speaker"></span><p class="cb-muling-line" aria-live="polite"></p><small class="cb-muling-hint"></small><div class="cb-muling-actions"><button type="button" data-muling-action="next" class="cb-muling-primary"></button><button type="button" data-muling-action="back" class="cb-muling-secondary"></button></div></main>
 </div>
 <footer class="cb-muling-footer"><span class="cb-muling-count"></span><span class="cb-muling-memory"></span></footer>`;
 stage.append(overlay);
 let previousScene="yard",active=false,mode="choose",interactionId=null,lineIndex=0,justCompleted=false;
 const $=s=>overlay.querySelector(s),w=()=>words[lang()];
 function getState(){const root=window.State?.S;if(!root)return null;if(!root.npcStories)root.npcStories={};root.npcStories.mulingCompanion=normalizeMulingState(root.npcStories.mulingCompanion);return root.npcStories.mulingCompanion}
 function save(){try{window.State?.save?.()}catch(e){console.warn("Muling companion save failed",e)}}
 function updateLaunch(){launch.querySelector("small").textContent=lang()==="zh"?"同行":"Companion";launch.title=w().title;launch.setAttribute("aria-label",w().title)}
 function setPortrait(face){const name=FACES[face]||FACES.neutral;$(".cb-muling-portrait").src=ROOT+name;$(".cb-muling-portrait").alt=lang()==="zh"?"暮铃":"Muling"}
 function activeInteraction(){return MULING_INTERACTIONS.find(x=>x.id===interactionId)||null}
 function render(){
  updateLaunch();if(!active)return;
  const p=getState(),t=w(),item=activeInteraction(),line=mode==="dialogue"&&item?item.lines[lineIndex]:null;
  $(".cb-muling-kicker").textContent=t.kicker;$(".cb-muling-title").textContent=t.title;
  $(".cb-muling-trust-label").textContent=t.trust;$(".cb-muling-trust-value").textContent=p.trust;
  $(".cb-muling-trust-bar i").style.width=Math.min(100,p.trust*5)+"%";
  $(".cb-muling-count").textContent=t.count+" · "+p.completed.length+"/"+MULING_INTERACTIONS.length;
  $(".cb-muling-follow").textContent=p.following?t.followOff:t.followOn;
  const list=$(".cb-muling-habit-list");list.replaceChildren();
  for(const it of MULING_INTERACTIONS){const b=document.createElement("button");b.type="button";b.className="cb-muling-habit";b.textContent=(p.completed.includes(it.id)?"✓ ":"✦ ")+it.title[lang()];b.addEventListener("click",()=>{interactionId=it.id;lineIndex=0;mode="dialogue";justCompleted=false;render()});list.append(b)}
  if(line){
   $(".cb-muling-speaker").textContent=line.speaker==="muling"?"暮铃 · Muling":(lang()==="zh"?"你":"You");
   $(".cb-muling-line").textContent=line.text[lang()];$(".cb-muling-hint").textContent=item.summary[lang()];
   setPortrait(line.face);$(".cb-muling-actions").hidden=false;
   $(".cb-muling-primary").textContent=lineIndex===item.lines.length-1?t.remember:t.next;
   $(".cb-muling-secondary").textContent=t.close;
   $(".cb-muling-footer").classList.toggle("is-memory",justCompleted);
   $(".cb-muling-memory").textContent=justCompleted?t.completed:"";
  }else{
   $(".cb-muling-speaker").textContent="暮铃 · Muling";
   $(".cb-muling-line").textContent=mode==="choose"?t.choose:(justCompleted?t.completed:t.choose);
   $(".cb-muling-hint").textContent=t.hint;
   setPortrait("neutral");$(".cb-muling-actions").hidden=true;
   $(".cb-muling-footer").classList.remove("is-memory");$(".cb-muling-memory").textContent="";
  }
 }
 function open(){if(active)return;previousScene=game.scene||"yard";if(previousScene==="battle")return;active=true;mode="choose";interactionId=null;lineIndex=0;overlay.hidden=false;game.scene="story";document.body.classList.add("cb-muling-open");render();overlay.querySelector('[data-muling-action="close"]').focus()}
 function close(){if(!active)return;active=false;overlay.hidden=true;document.body.classList.remove("cb-muling-open");game.scene=previousScene==="story"?"yard":previousScene;save();launch.focus()}
 function advance(){const p=getState(),item=activeInteraction();if(!item||mode!=="dialogue")return;if(lineIndex<item.lines.length-1){lineIndex++;render();return}const next=completeMulingInteraction(p,item.id);window.State.S.npcStories.mulingCompanion=next;save();mode="choose";lineIndex=0;justCompleted=!p.completed.includes(item.id);render()}
 function click(e){const action=e.target.closest("[data-muling-action]")?.dataset.mulingAction;if(!action)return;if(action==="close")close();else if(action==="next")advance();else if(action==="back"){mode="choose";interactionId=null;lineIndex=0;render()}else if(action==="follow"){const p=getState();window.State.S.npcStories.mulingCompanion=setMulingFollowing(p,!p.following);save();render()}else if(action==="language"){window.MorrowwishI18n?.set?.(lang()==="zh"?"en":"zh");render()}}
 overlay.addEventListener("click",click);overlay.addEventListener("keydown",e=>{if(e.key==="Escape"){e.preventDefault();close()}else if(e.key==="Enter"&&mode==="dialogue"){e.preventDefault();advance()}});
 window.addEventListener("morrowwish-language-change",render);launch.addEventListener("click",open);
 function npcState(){return getState()||createMulingState()}
 window.CatBondMulingCompanion={open,close,state:()=>copy(npcState()),isFollowing:()=>npcState().following,setFollowing(v){window.State.S.npcStories.mulingCompanion=setMulingFollowing(npcState(),v);save();return v},supportAffinity:()=>npcState().trust};
 window.CatBondNPC={
  forRegion(id){const p=npcState();if(!p.following||window.WorldMap?.currentRegion!==id)return[];return[{id:"muling-companion",name:"暮铃",en:"Muling",x:0,y:0,follow:true,ready:false}]},
  draw(ctx,npc,t){if(npc.id!=="muling-companion"||!sprite.complete||!sprite.naturalWidth)return;const v=window.WorldMap?.view;if(v){const tx=v.px-74,ty=v.py+18;if(!npc.ready){npc.x=tx;npc.y=ty;npc.ready=true}else{npc.x+=(tx-npc.x)*.13;npc.y+=(ty-npc.y)*.13}}ctx.save();ctx.globalAlpha=.98;ctx.shadowColor="rgba(18,22,42,.42)";ctx.shadowBlur=10;ctx.drawImage(sprite,npc.x-28,npc.y-94+Math.sin(t*2.1)*2,56,94);ctx.shadowBlur=0;ctx.fillStyle="rgba(20,29,45,.8)";ctx.beginPath();ctx.roundRect(npc.x-28,npc.y-112,56,18,8);ctx.fill();ctx.fillStyle="#f4dfb2";ctx.font="700 10px system-ui";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(lang()==="zh"?"暮铃":"Muling",npc.x,npc.y-103);ctx.restore()},
  talk(id){if(id==="muling-companion")open()},
  onRegionEntered(id){const p=npcState();if(p.lastRegion!==id){p.lastRegion=id;window.State.save?.()}},
  onDiscovery(id,reward){if(reward?.discovery){const p=npcState();p.events.push("discovery:"+id+":"+reward.discovery.id);window.State.save?.()}}
 };
}
if(document.readyState==="complete")mount();else document.addEventListener("DOMContentLoaded",mount,{once:true});
