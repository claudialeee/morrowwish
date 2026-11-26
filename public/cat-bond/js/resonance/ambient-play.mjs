const locale=()=>window.MorrowwishI18n?.get?.()==="zh"?"zh":"en";
const t=(zh,en)=>locale()==="zh"?zh:en;
const activities={
 "muling:tea":{title:["花园茶会","Garden tea"],action:["一起喝茶","Share tea"],hint:["暮铃泡好了茶，给你留了一块蜂蜜饼。","Muling has made tea and saved you a honey biscuit."]},
 "muling:map":{title:["港口的航线","Harbor route"],action:["记住路线","Remember the route"],hint:["灯塔在西边，码头通向东岸。沿港口石径即可到达，不需要绕上灯塔。","The lighthouse is in the west; the pier leads east. Follow the harbor path without climbing the lighthouse."]},
 "muling:bells":{title:["修理旧铃","The old bell"],action:["帮暮铃修理","Help Muling repair it"],hint:["暮铃打开工具袋，请你帮忙扶稳旧铃。","Muling opens the toolbox and asks you to steady the old bell."]}
};
function install(){
 const stage=document.getElementById("stage"),api=window.CatBondResonance;if(!stage||!api)return;
 let overlay=null,active=null;const el=(tag,cls,copy)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(copy)n.textContent=copy;return n;};
 function close(){overlay?.remove();overlay=null;active=null;}
 function render(){
  if(!active||!overlay)return;const {event,done}=active,a=activities[event.id];overlay.replaceChildren();
  const panel=el("section","res-ambient-card");const title=el("h2","",t(...a.title)),hint=el("p","",done?event.text[locale()]:t(...a.hint));panel.append(title,hint);
  if(event.id==="muling:map"){const map=el("div","res-route-preview");map.append(el("span","res-route-west",t("西 · 灯塔","West · Lighthouse")));panel.append(map);}
  if(done)panel.append(el("small","",t("信任 +1","Trust +1")));
  const button=el("button","res-ambient-action",done?t("返回探索","Return to exploration"):t(...a.action));button.type="button";
  button.onclick=()=>{if(done){close();return;}if(active.slot!==window.State.S||!api.isCurrentAction(active.token)){close();return;}const r=api.ambient({id:event.id,operation:event.operation,region:event.region,verified:true,token:active.token});if(r.ok){active.done=true;render();}else hint.textContent=t("未能保存，请重试。","Unable to save. Try again.");};
  panel.append(button);overlay.append(panel);
 }
 window.addEventListener("cat-bond-resonance-npc-profile",e=>{const profile=e.detail;if(overlay||profile?.id!=="muling")return;const event=profile.ambient?.find(a=>activities[a.id]);if(!event||!api.ambientAvailable(event.region).some(a=>a.id===event.id))return;active={event,slot:window.State.S,token:api.captureAction(),done:false};overlay=el("div","cb-story-overlay is-visible res-ambient-simple");overlay.setAttribute("role","dialog");stage.append(overlay);render();});
 window.addEventListener("morrowwish-language-change",render);window.addEventListener("cat-bond-active-save-changed",close);
}
if(document.readyState==="complete")install();else document.addEventListener("DOMContentLoaded",install,{once:true});
