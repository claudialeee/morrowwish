// A short interactive rest, not a quest or a new persistence gate.
const asset=p=>new URL("../../assets/"+p,import.meta.url).href;
export function mountSkyLookout(context,{player,muling,language,onReady}){
 const doc=context.ownerDocument,make=(tag,cls)=>{const n=doc.createElement(tag);n.className=cls;return n;};
 const stage=make("div","sky-lookout-view"),actions=make("div","sky-lookout-actions"),caption=make("span","sky-lookout-caption");
 stage.style.cssText="position:relative;overflow:hidden;border-radius:12px;height:clamp(70px,16vh,150px);background:center 52% / cover url("+asset("resonance-world-v2/sky.webp")+");isolation:isolate";
 actions.style.cssText="display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin:4px 0";
 const actor=(url,x)=>{const i=make("img","sky-lookout-cat");i.src=url;i.alt="";i.style.cssText="position:absolute;bottom:6%;height:78%;width:30%;object-fit:contain;left:"+x+"%;transform:translateX(-50%);transition:left .65s ease,transform .65s ease;filter:drop-shadow(0 3px 3px #25344966);pointer-events:none";stage.append(i);return i;};
 const a=actor(player||asset("core-art-remaster/leads/player.webp"),18),b=actor(muling||asset("core-art-remaster/leads/muling.webp"),62);
 b.dataset.actor="muling";a.dataset.actor="player";
 for(let n=0;n<2;n++){const i=make("img","sky-lookout-cup");i.src=asset("canon22-final-art/garden-teacup.webp");i.alt="";i.style.cssText="position:absolute;bottom:5%;height:24%;width:12%;object-fit:contain;left:"+(44+n*8)+"%;transform:translateX(-50%)";stage.append(i);}
 const sit=make("button"),walk=make("button");for(const btn of [sit,walk]){btn.type="button";btn.style.cssText="min-height:44px;padding:4px 12px;border-radius:10px;border:1px solid #d7bd8b;background:#fff2dc;color:#4d4053;font:inherit;cursor:pointer";}
 actions.append(sit,walk);context.replaceChildren(stage,actions,caption);
 let pose="",choice="",disposed=false;
 function render(k,selected){
  if(disposed)return;choice=selected||"";const zh=k==="zh";
  sit.textContent=zh?"坐到暮铃身边":"Sit beside Muling";walk.textContent=zh?"沿观景台走走":"Walk around the lookout";
  sit.setAttribute("aria-pressed",String(pose==="sit"));walk.setAttribute("aria-pressed",String(pose==="walk"));
  caption.textContent=choice==="joke"?(zh?"暮铃笑了。":"Muling smiles."):choice==="search"?(zh?"约好了，下次多带一杯。":"A promise: bring another cup next time."):pose==="sit"?(zh?"两只猫静静看着云海。":"The two cats watch the clouds together."):pose==="walk"?(zh?"云海在脚下流动，暮铃在茶杯旁等你。":"Clouds drift below; Muling waits beside the tea."):zh?"暮铃摆好了两杯茶。坐到她身边，或沿观景台走走。":"Muling sets out two cups. Sit beside her or walk around the lookout.";
  stage.dataset.pose=pose||"arrival";stage.dataset.choice=choice;
  a.style.left=pose==="sit"?"38%":pose==="walk"?"25%":"18%";a.style.transform=pose==="sit"?"translateX(-50%) scale(.89)":"translateX(-50%)";
 }
 function move(next){pose=next;render(language(),choice);onReady?.();}
 sit.onclick=()=>move("sit");walk.onclick=()=>move("walk");
 return {render,dispose(){disposed=true;context.replaceChildren();},get pose(){return pose;}};
}
