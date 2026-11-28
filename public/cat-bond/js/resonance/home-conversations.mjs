// Post-ending conversations use the canonical slot and choice outcomes. No second quest state.
import {sideMemory} from "./side-adventures.mjs";
import {campaign} from "./campaign.mjs";
const lines={
 jiedeng:{normal:["今晚小猫们帮我挂好了风铃。我带了集市上的糖果。","The kittens helped hang the chimes tonight. I brought sweets from the market."],method:"precise-beacon",alternate:["那天古铃响起后，大家又听得出自家门前的铃了。","Ever since the town bell rang again, everyone can recognize the chime at their own door."]},
 qilan:{normal:["新地图放在这里啦！下回想去风铃镇，咱们一起抄近路。","I left the new map here! Next time we visit Windchime Town, let's take the shortcut."],method:"rapid-rescue",alternate:["我们一起画的第一条路，我还留着呢。下次我来带路！","I still have the first trail we drew together. Next time I'll lead!"]},
 yahe:{normal:["月叶长出新芽了！等它再大一点，就能搭出一座小桥。","The moonleaf has sprouted! When it grows a little more, we can make a tiny bridge."],method:"herbal-supplies",alternate:["水道通啦，药草也长高了。下回送你一盆猫薄荷！","The water's flowing and the herbs are growing. I'll bring you a pot of catnip next time!"]},
 yuchuan:{normal:["地下的发光菌又长出来了。下回带你去看看！","The glowing fungi are back underground. I'll take you to see them next time!"],method:"root-stability",alternate:["多亏你稳住了根系！新水量表挂好了，欢迎随时来看看。","Thanks for stabilizing the roots! The new water chart is up. Come check it anytime."]},
 jinpo:{normal:["小栗把我的老灯做成了歪耳猫。小家伙，还真挺好看。","Pip turned my old lantern into a crooked-eared cat. It's rather charming, actually."],method:"shared-repair",alternate:["工坊出了岔子，得我这个老婆子亲自去说。下回可不能光顾着摆弄图纸喽。","When something goes wrong in the workshop, it's my job to tell the others. Can't spend all day hiding behind my blueprints."]},
 xiaomao:{normal:["我想在花园办场影子戏！师傅答应来帮我挂灯。","I want to put on a shadow show in the garden! Master promised to help hang the lanterns."],method:"worker-transparency",alternate:["每回试灯，师傅都让我把结果贴墙上。我画了个歪耳猫，表示这盏灯没问题！","Ember has me post our lamp tests on the wall. I draw a crooked-ear cat when a lamp passes!"]},
 lingyu:{normal:["远帆今天独自飞过了群岛！我在码头给他准备了热茶。","Finn flew across the islands on his own today! I have hot tea ready for him at the dock."],method:"escort-flight",alternate:["那次一起训练真有意思！现在我们有各自的航线，也常常约好一起飞。","That training was wonderful! We have our own routes now, and often arrange to fly together."]},
 yuanfan:{normal:["今天的信送到了。我还给花园带了一根从云脊吹来的羽毛。","Today's letters are delivered. I brought the garden a feather carried by the Skyspine winds."],method:"fast-courier",alternate:["你那时让我自己领航。现在我每周都飞一趟花园的航线。","You let me take the lead back then. Now I fly the garden route every week."]},
 moye:{normal:["又有小猫来翻旧画了。私人的那几本我收在柜子里，得先问问主人。","More kittens came to look at the old pictures. I keep private books in the cabinet. Best ask their owners first."],method:"verified-records",alternate:["有位阿婆认出了画里的小猫，还帮我补上了一个名字。多亏她来看看。","A grandmother recognized a kitten in one of the pictures and helped me fill in a missing name. I'm glad she came."]},
 baikan:{normal:["六地的新故事越写越多啦！我得给书架再加一层。","New stories are arriving from all six regions! I'll need another shelf."],method:"full-records",alternate:["我在旧图上贴了小书签，改过哪里一眼就能看出来。可别把书签当玩具抓走呀。","I put little tabs on the old maps so you can spot any changes. No pouncing on the tabs, please!"]},
 xingya:{normal:["六地每月轮流校准，新星图漂亮极了！下次带你去看星星。","The regions take turns calibrating each month, and the new star chart looks fantastic! Let's go stargazing sometime."],method:"coordinated-repair",alternate:["以前我总一个猫守着观星台。现在其他地方也帮着看星星，我终于能睡个懒觉啦。","I used to watch the stars all by myself. Now the other regions help. I can finally sleep in!"]},
 lichuan:{normal:["星桥上又能听见风铃镇的铃了。下次走夜路，就让它给我们伴奏吧。","You can hear Windchime Town from the star bridge again. Next time we travel at night, the chimes can keep us company."],method:"distributed-repair",alternate:["那次大家一起决定怎样维修，我才重新敢走那条旧路。现在每支商队都可以自己选择。","When everyone decided how to repair the route together, I found the courage to travel it again. Every caravan can now choose its own way."]},
 muling:{normal:["钥匙在这儿，茶也泡好了。今天要不要在花园晒晒太阳？我给你留了半块蜂蜜饼。","I've got my key, and the tea's ready. Fancy a nap in the sun? I saved you half a honey biscuit."]}
};
const muling={
 anger:["今天我会去风铃镇修门铃。你想来的话，记得带上你喜欢的点心。","I'll help mend door chimes in Windchime Town today. If you'd like to come, bring your favorite snack."],
 distance:["我去整理花园的工具啦。你可以按自己的节奏四处逛逛，想聊天时来找我就好。","I'm going to tidy the garden tools. Explore at your own pace, and come find me whenever you'd like to talk."],
 understand:["谢谢你陪我走到这里。今天还有一点维修工作，做完我们去看看新开的花吧。","Thank you for coming this far with me. I've got a little repair work left today. Let's see the new flowers when it's done."]
};

export function skyChapterVisitors(view){return view&&!view.ending&&view.completed?.includes("sky:S-05")?["lingyu","yuanfan"]:[];}
 const skyVisit={
  lingyu:{normal:["今天我让远帆独自送信，我留在码头等他回来。观风台的数据可以帮花园的猫咪。","Today Finn delivers letters on his own. I wait at the dock for his return. The lookout data can help the garden cats."],alternate:["一起训练时，他告诉我什么时候需要帮助。现在我学会了先问，再伸手。","During our training he told me when he needed help. Now I ask before lending a paw."]},
  yuanfan:{normal:["我把新航路的图带来啦！下次我们去远风岛看看，那边还藏着信使的补给。","I brought our new route chart! Let's visit Farwind Isle sometime. The old couriers left supplies there."],alternate:["谢谢你让我领飞。今天的信，我是自己送过来的。姐姐在码头等我。","Thank you for letting me lead. I delivered today's letters myself. My sister is waiting at the dock."]}
 };
export function homeConversation(id,view,profile,snapshot){
 const q=lines[id];if(skyChapterVisitors(view).includes(id)){const visit=skyVisit[id];return profile?.methods?.includes(q.method)?visit.alternate:visit.normal;}if(!q||!view?.ending||(id!=="muling"&&!view.returned?.includes(id)))return null;
 if(id==="muling"){
  const c=snapshot?.choices||{},base=muling[c["library:M-04"]]||q.normal;
  const responses={
   "sky:S-04":{joke:["云朵茶会的约定，我还记得。","I still remember our promise of a tea party in the clouds."],company:["谢谢你那天安静地陪我坐着。","Thank you for sitting quietly beside me that day."],search:["那天你说要陪我找朋友。其实呀，你就在我旁边。","You offered to help me find my friend that day. You were right beside me all along."]},
   "library:M-03":{details:["你问过的事实，我都会如实告诉你。","I'll tell you the truth about everything you asked."],hurt:["那天我瞒了你那么久。以后不会了。","I kept that from you for far too long. I won't do it again."],space:["我会给你需要的时间。","I'll give you the time you need."]},
   "finale:B-01":{stop:["谢谢你让我停下来听见大家。","Thank you for asking me to stop and listen."],challenge:["你提醒我不能替任何人决定。","You reminded me not to decide for anyone else."]},
   "epilogue:E-02":{listen:["阿婆说门铃还有点歪，我明天再去看看。","Gran says her doorbell's a bit crooked. I'll check it tomorrow."],help:["谢谢你陪我完成第一次修复。","Thank you for joining my first repair."],space:["等阿婆愿意见我了，我再过去。","I'll visit Gran when she's ready to see me."]}
  };
  return [0,1].map(i=>[base[i],...Object.entries(responses).map(([scene,variants])=>variants[c[scene]]?.[i]).filter(Boolean)].join(i?" ":""));
 }
 return q.alternate&&profile?.methods?.includes(q.method)?q.alternate:q.normal;
}
const visits={
 qilan:{action:["一起标出回家的航线","Mark the route home together"],done:["你们在新航图上标出花园。以后每次迷路，都能顺着这条线回家。纪念物：栖蓝的新航图。","Together you mark the garden on the new chart. Whenever you lose your way, this route will lead home. Keepsake: Skye’s new route chart."]},
 yahe:{action:["一起给月叶浇水","Water the moonleaf together"],done:["新芽在水珠下舒展开来。芽禾把第一片新叶留给花园。纪念物：月叶新芽。","A new shoot unfurls beneath the droplets. Fern leaves the first new leaf in the garden. Keepsake: Moonleaf sprout."]},
 xiaomao:{action:["点亮歪耳猫灯","Light the crooked-ear lantern"],done:["歪耳猫的影子跳上墙，小栗笑着把灯挂好。纪念物：歪耳灯。","The crooked-eared cat’s shadow jumps onto the wall. Pip hangs the lantern with a grin. Keepsake: Crooked-ear lantern."]}
};
export function mountHomeConversation(id,api){
 const view=api.view(),actor=campaign.cast[id],baseCopy=homeConversation(id,view,api.supportProfile(actor?.region),api.snapshot()),memories=sideMemory(id,window.State.S),copy=baseCopy&&[0,1].map(i=>[baseCopy[i],...memories.map(m=>m[i])].join(i?" ":""));
 const stage=document.getElementById("stage");if(!stage||!copy||window.__game?.scene!=="yard")return false;
 const owner=window.State.S;api.close?.();document.querySelector(".res-home-conversation")?.dispatchEvent(new Event("cat-bond-close"));
 const root=document.createElement("div");root.className="cb-story-overlay is-visible res-host res-home-conversation";
 const panel=document.createElement("section");panel.className="res-dialogue";panel.setAttribute("role","dialog");panel.setAttribute("aria-modal","true");
 const art=document.createElement("img");art.className="res-portrait";art.alt="";art.src=new URL(id==="muling"?"../../assets/core-art-remaster/leads/muling.webp":"../../assets/npc/"+id+"-painted.webp",import.meta.url).href;
 const body=document.createElement("div");body.className="res-body";const title=document.createElement("h2"),line=document.createElement("p"),controls=document.createElement("div"),close=document.createElement("button");
 title.className="res-speaker";line.className="res-line";controls.className="res-controls";close.type="button";
 const visit=view.ending&&view.returned?.includes(id)?visits[id]:null,action=document.createElement("button");action.type="button";action.dataset.homeRevisit=id;let finished=!!window.GardenExploration?.read(owner).keepsakes.includes("revisit-"+id);if(visit)controls.append(action);controls.append(close);body.append(title,line,controls);panel.append(art,body);root.append(panel);
 function render(){if(owner!==window.State.S||window.__game?.scene!=="yard"){dispose();return}const zh=window.MorrowwishI18n?.get?.()==="zh";title.textContent=actor.name[zh?"zh":"en"];line.textContent=visit&&finished?[visit.done[zh?0:1],...memories.map(m=>m[zh?0:1])].join(zh?"":" "):copy[zh?0:1];if(visit){action.hidden=finished;action.textContent=visit.action[zh?0:1];}close.textContent=zh?"关闭":"Close";panel.setAttribute("aria-label",title.textContent);}
 function dispose(){root.remove();window.removeEventListener("morrowwish-language-change",render);window.removeEventListener("cat-bond-active-save-changed",dispose);window.removeEventListener("pagehide",dispose);}
 action.onclick=()=>{if(owner!==window.State.S||window.__game?.scene!=="yard"||!visit||finished)return;if(window.GardenExploration?.completeRevisit(id)){finished=true;window.MorrowwishAudio?.effect?.("discover");window.__game?.toast?.({zh:visit.done[0],en:visit.done[1]});render();close.focus();}};close.onclick=dispose;root.addEventListener("cat-bond-close",dispose);root.addEventListener("keydown",e=>{if(e.key==="Escape")dispose();});
 if(owner!==window.State.S)return false;stage.append(root);window.addEventListener("morrowwish-language-change",render);window.addEventListener("cat-bond-active-save-changed",dispose);window.addEventListener("pagehide",dispose,{once:true});render();close.focus();return true;
}
