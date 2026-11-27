const locale=()=>window.MorrowwishI18n?.get?.()==="zh"?"zh":"en";
const t=(zh,en)=>locale()==="zh"?zh:en;
export const activities={
 "muling:tea":{title:["花园茶会","Garden tea"],action:["一起喝茶","Share tea"],hint:["暮铃泡好了茶，给你留了一块蜂蜜饼。","Luna has made tea and saved you a honey biscuit."]},
 "muling:map":{title:["暮铃的地图","Luna’s map"],action:["帮暮铃转正地图","Turn the map around"],hint:["暮铃：奇怪，海怎么跑到山上去了？你来看看这张地图！","Luna: Strange, how did the sea end up on the mountain? Could you take a look at this map?"]},
 "muling:bells":{title:["修理旧铃","The old bell"],action:["帮暮铃修理","Help Luna repair it"],hint:["暮铃打开工具袋，请你帮忙扶稳旧铃。","Luna opens the toolbox and asks you to steady the old bell."]},
 "muling:cooking":{"title":["烟熏惊喜","A smoky surprise"],"action":["一起尝尝今天的料理","Taste today's cooking together"],"hint":["暮铃端来一盘微微焦黑的点心，偷偷看你的表情。","Luna brings over a slightly scorched snack and watches your expression."]},
 "muling:accountability":{"title":["一起决定","Decide together"],"action":["先听听大家的想法","Ask everyone what they think"],"hint":["暮铃带来了修花园铃铛的提议。这一次，她没有擅自开始。","Luna brings a proposal to repair the garden bell. This time, she hasn't started without asking."]},
 "jiedeng:maintain-lighthouse":{"title":["灯塔的值守","Keeping the light"],"action":["陪檐灯检查灯光","Check the light with Alder"],"hint":["檐灯正在记录灯塔的光。他把记录本向你挪了挪。","Alder is checking the beacon. He shifts his logbook toward you."]},
 "qilan:chart-harbor":{"title":["下一趟航程","The next voyage"],"action":["和栖蓝看看新航图","Look over the new chart"],"hint":["栖蓝摊开航图，上面画着几条新的路线。","Skye unfolds a chart with several new routes drawn on it."]},
 "yahe:plant-herbs":{"title":["药草园的新芽","New garden shoots"],"action":["看看水渠和新芽","Look at the channels and shoots"],"hint":["芽禾蹲在新苗旁，正犹豫要把下一批种子种在哪里。","Fern sits beside the seedlings, wondering where to plant the next seeds."]},
 "yuchuan:inspect-water":{"title":["水边的记录","Notes by the water"],"action":["陪榆川核对水量","Review the water readings"],"hint":["榆川把两份水量记录放在一起，等你来看看。","Rowan lays two water-level records side by side for you to see."]},
 "jinpo:test-safety":{"title":["安全不是一个人的事","Safety is shared"],"action":["听听烬婆和小栗的意见","Listen to Ember and Pip"],"hint":["烬婆把炉城的新图纸铺在桌上，特地留了一个空白位置。","Ember spreads a new forge diagram on the table, deliberately leaving space for comments."]},
 "xiaomao:assemble-part":{"title":["小栗的新阀门","Pip's new valve"],"action":["看看小栗的成果","Look at Pip's work"],"hint":["小栗举起刚做好的阀门，兴奋地向你展示。","Pip proudly holds up a newly finished valve."]},
 "lingyu:prepare-flight":{"title":["出发前的风","Wind before departure"],"action":["陪翎羽观察风向","Watch the wind with Wren"],"hint":["翎羽望着飘动的风标，准备下一趟飞行。","Wren watches the wind markers before the next flight."]},
 "yuanfan:deliver-cargo":{"title":["自己的路线","A route of my own"],"action":["听远帆讲讲新路线","Hear Finn's route"],"hint":["远帆指着自己画出的航线，眼里闪着期待。","Finn points to a route drawn in their own hand, eyes bright with anticipation."]},
 "moye:catalog-record":{"title":["档案的新规则","New archive rules"],"action":["看看档案的查阅说明","Read the archive guide"],"hint":["墨页正在整理新目录，把公共记录与私人记录分开。","Quill is sorting the new catalogue, separating public from personal records."]},
 "baikan:verify-document":{"title":["再核对一次","Check once more"],"action":["陪白羽比对原件","Compare the originals"],"hint":["白羽发现了另一份记录，想先把两份放在一起看看。","Ivy has found another record and wants to compare the originals first."]},
 "xingya:align-observatory":{"title":["各地的星图","Each settlement's stars"],"action":["看看各地送来的观测记录","Review the settlements' readings"],"hint":["星芽桌上不再只有一张中央星图，而是六地送来的记录。","Nova's desk now holds readings from the six regions, rather than just one central star chart."]},
 "lichuan:guide-caravan":{"title":["有回信的旅程","A journey with replies"],"action":["听砾川说下一趟旅行","Hear about Flint's next journey"],"hint":["砾川整理着行囊，旁边放着写给港口朋友的信。","Flint packs a bag beside a letter addressed to a friend at the harbor."]}
};
function install(){
 const stage=document.getElementById("stage"),api=window.CatBondResonance;if(!stage||!api)return;
 const atRegion=region=>region==="garden"?window.__game?.scene==="yard":window.__game?.scene==="map"&&window.WorldMap?.currentRegion===region;
 let overlay=null,active=null;const el=(tag,cls,copy)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(copy)n.textContent=copy;return n;};
 function close(){overlay?.remove();overlay=null;active=null;}
 function render(){
  if(!active||!overlay)return;overlay.replaceChildren();
  if(!active.event){
   const panel=el("section","res-ambient-card");panel.append(el("h2","",t("想一起做什么？","What shall we do together?")));
   for(const event of active.options){const choice=el("button","res-ambient-action",t(...activities[event.id].title));choice.type="button";choice.dataset.ambientChoice=event.id;choice.onclick=()=>{if(active.slot!==window.State.S||!api.isCurrentAction(active.token)||!atRegion(event.region)){close();return;}active.event=event;render();};panel.append(choice);}
   const dismiss=el("button","res-ambient-action res-ambient-dismiss",t("稍后再聊","Maybe later"));dismiss.type="button";dismiss.onclick=close;panel.append(dismiss);overlay.append(panel);return;
  }
  const {event,done}=active,a=activities[event.id];
  const panel=el("section","res-ambient-card");const title=el("h2","",t(...a.title)),hint=el("p","",done?event.text[locale()]:t(...a.hint));panel.append(title,hint);

  if(done)panel.append(el("small","",t("信任 +1","Trust +1")));
  const button=el("button","res-ambient-action",done?t("返回探索","Return to exploration"):t(...a.action));button.type="button";
  button.onclick=()=>{if(done){close();return;}if(active.slot!==window.State.S||!api.isCurrentAction(active.token)||!atRegion(event.region)){close();return;}const r=api.ambient({id:event.id,operation:event.operation,region:event.region,verified:true,token:active.token});if(r.ok){active.done=true;render();}else hint.textContent=t("未能保存，请重试。","Unable to save. Try again.");};
  panel.append(button);if(!done){const dismiss=el("button","res-ambient-action res-ambient-dismiss",t("稍后再聊","Maybe later"));dismiss.type="button";dismiss.onclick=close;panel.append(dismiss);}overlay.append(panel);
 }
 window.addEventListener("cat-bond-resonance-npc-profile",e=>{const profile=e.detail;if(overlay||!profile?.id)return;const options=(profile.ambient||[]).filter(a=>a.npc===profile.id&&activities[a.id]&&atRegion(a.region)&&api.ambientAvailable(a.region).some(e=>e.id===a.id));if(!options.length)return;active={options,event:options.length===1?options[0]:null,slot:window.State.S,token:api.captureAction(),done:false};overlay=el("div","cb-story-overlay is-visible res-ambient-simple");overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");stage.append(overlay);render();});
 window.addEventListener("morrowwish-language-change",render);window.addEventListener("cat-bond-active-save-changed",close);
}
if(typeof document!=="undefined"){if(document.readyState==="complete")install();else document.addEventListener("DOMContentLoaded",install,{once:true});}
