// Post-ending conversations use the canonical slot and choice outcomes. No second quest state.
import {campaign} from "./campaign.mjs";
const lines={
 jiedeng:{normal:["今晚轮到年轻水手掌灯啦！我终于能带点港口点心来花园了。","The young sailors have the light tonight! I've finally got time to bring some harbor treats to the garden."],method:"precise-beacon",alternate:["多亏你先校准了灯塔，现在每艘船都有一条明亮的回家路。","Thanks to your beacon calibration, every boat now has a bright path home."]},
 qilan:{normal:["我带来的航图留在这里。想去港口的话，随时跟我说。","I've left a route chart here. Tell me whenever you'd like to visit the harbor."],method:"rapid-rescue",alternate:["你当时先来救我，那盏灯照亮了我们的路。现在轮到我带别的船回家。","You came to rescue me first. That light guided our way. Now it's my turn to bring other boats home."]},
 yahe:{normal:["这些药草能在花园里长得很好。我和榆川每月都会一起核对水量。","These herbs will thrive in the garden. Yuchuan and I now check the water flow together every month."],method:"herbal-supplies",alternate:["你当初帮我们恢复药草园，现在地下水道也重新通了。两边都不需要再猜测对方的意思。","You helped restore our herb gardens first, and now the underground channels are open too. Neither side has to guess anymore."]},
 yuchuan:{normal:["水路图已经送到工坊啦。芽禾说，花园今年可以多种两排花！","The channel maps are at the workshop! Yahe says we can plant two extra rows of flowers this year."],method:"root-stability",alternate:["多亏你稳住了根系！新水量表挂好了，欢迎随时来看看。","Thanks for stabilizing the roots! The new water chart is up. Come check it anytime."]},
 jinpo:{normal:["新工具都让小铆检查过了。她还给我的锤子盖了个合格章！","Xiaomao has checked every new tool. She even stamped my hammer with her seal of approval!"],method:"shared-repair",alternate:["你让我先亲自向工人说明事故。以后我不会再把责任藏进图纸里。","You let me explain the accident to the workers myself. I won't hide responsibility inside a blueprint again."]},
 xiaomao:{normal:["花园的新工具快做好啦！师傅帮我找来了最顺手的材料。","The garden's new tools are almost ready! Master helped me find just the right materials."],method:"worker-transparency",alternate:["你支持公开事故记录。现在工坊每次试验都会把安全记录贴出来。","You supported releasing the accident record. The workshop now posts the safety log for every test."]},
 lingyu:{normal:["远帆今天独自飞过了群岛！我在码头给他准备了热茶。","Yuanfan flew across the islands on his own today! I have hot tea ready for him at the dock."],method:"escort-flight",alternate:["那次一起训练真有意思！现在我们有各自的航线，也常常约好一起飞。","That training was wonderful! We have our own routes now, and often arrange to fly together."]},
 yuanfan:{normal:["今天的信送到了。我还给花园带了一根从云脊吹来的羽毛。","Today's letters are delivered. I brought the garden a feather carried by the Skyspine winds."],method:"fast-courier",alternate:["你那时让我自己领航。现在我每周都飞一趟花园的航线。","You let me take the lead back then. Now I fly the garden route every week."]},
 moye:{normal:["档案里留下了真实的记录，也留下了每位当事人决定公开什么的权利。","The archives preserve the truth, and each person's right to decide what private memories to share."],method:"verified-records",alternate:["让家属先核对私人记录，确实让我们找到了一些遗漏。真相和体谅并不冲突。","Letting families review their records first helped us find omissions. Truth and consideration need not conflict."]},
 baikan:{normal:["六地的新故事越写越多啦！我得给书架再加一层。","New stories are arriving from all six regions! I'll need another shelf."],method:"full-records",alternate:["你支持公开完整记录。现在我们把改动逐项标记，让每个人都能查证。","You supported opening the records. We now label every revision so anyone can verify it."]},
 xingya:{normal:["六地每月轮流校准，新星图漂亮极了！下次带你去看星星。","The regions take turns calibrating each month, and the new star chart looks fantastic! Let's go stargazing sometime."],method:"coordinated-repair",alternate:["你让我负责那次维修。现在我明白，负责协调并不意味着独自拥有决定权。","You let me coordinate that repair. I now understand that coordinating doesn't mean owning every decision."]},
 lichuan:{normal:["从星坠原到港口的路重新开通了。下一次商队会顺路把花园的货物送过来。","The route from Starfall to the harbor has reopened. The next caravan will bring the garden's supplies along the way."],method:"distributed-repair",alternate:["那次大家一起决定怎样维修，我才重新敢走那条旧路。现在每支商队都可以自己选择。","When everyone decided how to repair the route together, I found the courage to travel it again. Every caravan can now choose its own way."]},
 muling:{normal:["第二把钥匙我一直带着。今天的维修已经做完了，茶也泡好了。你想留下来，还是想去看看远处的风景？","I keep the second key with me. Today's repairs are finished, and the tea is ready. Would you like to stay, or go see what's beyond the horizon?"]}
};
const muling={
 anger:["今天我会和港口的伙伴一起检查灯路。你想来的话，记得带上你喜欢的点心。","I'll check the beacon route with our harbor friends today. If you'd like to come, bring your favorite snack."],
 distance:["我去整理花园的工具啦。你可以按自己的节奏四处逛逛，想聊天时来找我就好。","I'm going to tidy the garden tools. Explore at your own pace, and come find me whenever you'd like to talk."],
 understand:["谢谢你陪我走到这里。今天还有一点维修工作，做完我们去看看新开的花吧。","Thank you for coming this far with me. I've got a little repair work left today. Let's see the new flowers when it's done."]
};

export function skyChapterVisitors(view){return view&&!view.ending&&view.completed?.includes("sky:S-05")?["lingyu","yuanfan"]:[];}
 const skyVisit={
  lingyu:{normal:["今天我让远帆独自送信，我留在码头等他回来。观风台的数据可以帮花园的猫咪。","Today Yuanfan delivers letters on his own. I wait at the dock for his return. The lookout data can help the garden cats."],alternate:["一起训练时，他告诉我什么时候需要帮助。现在我学会了先问，再伸手。","During our training he told me when he needed help. Now I ask before lending a paw."]},
  yuanfan:{normal:["我把新航路的图带来啦！下次我们去远风岛看看，那边还藏着信使的补给。","I brought our new route chart! Let's visit Farwind Isle sometime. The old couriers left supplies there."],alternate:["谢谢你让我领飞。今天的信，我是自己送过来的。姐姐在码头等我。","Thank you for letting me lead. I delivered today's letters myself. My sister is waiting at the dock."]}
 };
export function homeConversation(id,view,profile,snapshot){
 const q=lines[id];if(skyChapterVisitors(view).includes(id)){const visit=skyVisit[id];return profile?.methods?.includes(q.method)?visit.alternate:visit.normal;}if(!q||!view?.ending||(id!=="muling"&&!view.returned?.includes(id)))return null;
 if(id==="muling"){
  const c=snapshot?.choices||{},base=muling[c["library:M-04"]]||q.normal;
  const responses={
   "sky:S-04":{joke:["云朵茶会的约定，我还记得。","I still remember our promise of a tea party in the clouds."],company:["谢谢你那天安静地陪我坐着。","Thank you for sitting quietly beside me that day."],search:["你曾愿意陪我寻找那个朋友。","You offered to help me look for that friend."]},
   "library:M-03":{details:["你问过的事实，我都会如实告诉你。","I'll tell you the truth about everything you asked."],hurt:["我记得你说过受伤，我会尊重那份感受。","I remember how hurt you felt, and I'll respect that."],space:["我会给你需要的时间。","I'll give you the time you need."]},
   "finale:B-01":{stop:["谢谢你让我停下来听见大家。","Thank you for asking me to stop and listen."],challenge:["你提醒我不能替任何人决定。","You reminded me not to decide for anyone else."]},
   "epilogue:E-02":{listen:["我会继续听居民们的意见。","I'll keep listening to the residents."],help:["谢谢你陪我完成第一次修复。","Thank you for joining my first repair."],space:["我会尊重大家需要的时间。","I'll respect the time everyone needs."]}
  };
  return [0,1].map(i=>[base[i],...Object.entries(responses).map(([scene,variants])=>variants[c[scene]]?.[i]).filter(Boolean)].join(i?" ":""));
 }
 return q.alternate&&profile?.methods?.includes(q.method)?q.alternate:q.normal;
}
export function mountHomeConversation(id,api){
 const view=api.view(),actor=campaign.cast[id],copy=homeConversation(id,view,api.supportProfile(actor?.region),api.snapshot());
 const stage=document.getElementById("stage");if(!stage||!copy||window.__game?.scene!=="yard")return false;
 const owner=window.State.S;api.close?.();document.querySelector(".res-home-conversation")?.dispatchEvent(new Event("cat-bond-close"));
 const root=document.createElement("div");root.className="cb-story-overlay is-visible res-host res-home-conversation";
 const panel=document.createElement("section");panel.className="res-dialogue";panel.setAttribute("role","dialog");panel.setAttribute("aria-modal","true");
 const art=document.createElement("img");art.className="res-portrait";art.alt="";art.src=new URL(id==="muling"?"../../assets/cinematics/characters/muling/traveler-silver-cream.webp":"../../assets/npc/"+id+"-painted.webp",import.meta.url).href;
 const body=document.createElement("div");body.className="res-body";const title=document.createElement("h2"),line=document.createElement("p"),controls=document.createElement("div"),close=document.createElement("button");
 title.className="res-speaker";line.className="res-line";controls.className="res-controls";close.type="button";
 controls.append(close);body.append(title,line,controls);panel.append(art,body);root.append(panel);
 function render(){if(owner!==window.State.S||window.__game?.scene!=="yard"){dispose();return}const zh=window.MorrowwishI18n?.get?.()==="zh";title.textContent=actor.name[zh?"zh":"en"];line.textContent=copy[zh?0:1];close.textContent=zh?"关闭":"Close";panel.setAttribute("aria-label",title.textContent);}
 function dispose(){root.remove();window.removeEventListener("morrowwish-language-change",render);window.removeEventListener("cat-bond-active-save-changed",dispose);window.removeEventListener("pagehide",dispose);}
 close.onclick=dispose;root.addEventListener("cat-bond-close",dispose);root.addEventListener("keydown",e=>{if(e.key==="Escape")dispose();});
 if(owner!==window.State.S)return false;stage.append(root);window.addEventListener("morrowwish-language-change",render);window.addEventListener("cat-bond-active-save-changed",dispose);window.addEventListener("pagehide",dispose,{once:true});render();close.focus();return true;
}
