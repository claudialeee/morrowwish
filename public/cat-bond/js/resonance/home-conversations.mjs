// Post-ending conversations use the canonical slot and choice outcomes. No second quest state.
import {campaign} from "./campaign.mjs";
const lines={
 jiedeng:{normal:["我现在值夜班，也会让年轻水手轮流掌灯。海路不能只靠我一个人。","I still take the night watch, but the young sailors now take turns at the light. The sea route cannot depend on me alone."],method:"precise-beacon",alternate:["当初你坚持先校准灯塔，我终于明白，指引方向和控制方向不是一回事。","When you insisted on calibrating the lighthouse first, I finally learned that guiding a route is not the same as controlling it."]},
 qilan:{normal:["我带来的航图留在这里。想去港口的话，随时跟我说。","I've left a route chart here. Tell me whenever you'd like to visit the harbor."],method:"rapid-rescue",alternate:["你当时先来救我，那盏灯照亮了我们的路。现在轮到我带别的船回家。","You came to rescue me first. That light guided our way. Now it's my turn to bring other boats home."]},
 yahe:{normal:["这些药草能在花园里长得很好。我和榆川每月都会一起核对水量。","These herbs will thrive in the garden. Yuchuan and I now check the water flow together every month."],method:"herbal-supplies",alternate:["你当初帮我们恢复药草园，现在地下水道也重新通了。两边都不需要再猜测对方的意思。","You helped restore our herb gardens first, and now the underground channels are open too. Neither side has to guess anymore."]},
 yuchuan:{normal:["我把水路图留给工坊了。没有人需要独自守着一条暗河。","I've left the channel maps at the workshop. No one has to guard a hidden river alone."],method:"root-stability",alternate:["谢谢你先稳住地下根系。下次我们会先把水量说清楚，不再默默替别人决定。","Thank you for stabilizing the roots first. Next time we'll explain the water flow, instead of quietly deciding for others."]},
 jinpo:{normal:["工坊里的每件新工具都要经过小铆的检查。她可比我严格多了。","Every new workshop tool must pass Xiaomao's inspection. She's stricter than I am."],method:"shared-repair",alternate:["你让我先亲自向工人说明事故。以后我不会再把责任藏进图纸里。","You let me explain the accident to the workers myself. I won't hide responsibility inside a blueprint again."]},
 xiaomao:{normal:["花园的新工具我还在改。师傅这次只问我需要什么，不再替我选设计。","I'm still improving the garden's tools. This time Master asks what I need instead of choosing my design."],method:"worker-transparency",alternate:["你支持公开事故记录。现在工坊每次试验都会把安全记录贴出来。","You supported releasing the accident record. The workshop now posts the safety log for every test."]},
 lingyu:{normal:["远帆今天自己飞过了群岛。我在地面等他，不再替他决定航线。","Yuanfan flew across the islands on his own today. I waited on the ground instead of choosing his route."],method:"escort-flight",alternate:["一起训练以后，我学会了在他需要时才伸手。这样的陪伴，比替他掌舵更难。","After training together, I learned to help only when he needs me. Staying beside someone is harder than steering for them."]},
 yuanfan:{normal:["今天的信送到了。我还给花园带了一根从云脊吹来的羽毛。","Today's letters are delivered. I brought the garden a feather carried by the Skyspine winds."],method:"fast-courier",alternate:["你那时让我自己领航。现在我每周都飞一趟花园的航线。","You let me take the lead back then. Now I fly the garden route every week."]},
 moye:{normal:["档案里留下了真实的记录，也留下了每位当事人决定公开什么的权利。","The archives preserve the truth, and each person's right to decide what private memories to share."],method:"verified-records",alternate:["让家属先核对私人记录，确实让我们找到了一些遗漏。真相和体谅并不冲突。","Letting families review their records first helped us find omissions. Truth and consideration need not conflict."]},
 baikan:{normal:["我正在整理六地的新记录。过去没有消失，我们也终于有了新的故事。","I'm compiling new records from all six regions. The past hasn't vanished, and we finally have new stories."],method:"full-records",alternate:["你支持公开完整记录。现在我们把改动逐项标记，让每个人都能查证。","You supported opening the records. We now label every revision so anyone can verify it."]},
 xingya:{normal:["六地每月轮流负责校准。我仍然会检查数据，但不再把所有决定握在自己手里。","The regions take turns calibrating each month. I still check the data, but I no longer keep every decision in my paws."],method:"coordinated-repair",alternate:["你让我负责那次维修。现在我明白，负责协调并不意味着独自拥有决定权。","You let me coordinate that repair. I now understand that coordinating doesn't mean owning every decision."]},
 lichuan:{normal:["从星坠原到港口的路重新开通了。下一次商队会顺路把花园的货物送过来。","The route from Starfall to the harbor has reopened. The next caravan will bring the garden's supplies along the way."],method:"distributed-repair",alternate:["那次大家一起决定怎样维修，我才重新敢走那条旧路。现在每支商队都可以自己选择。","When everyone decided how to repair the route together, I found the courage to travel it again. Every caravan can now choose its own way."]},
 muling:{normal:["第二把钥匙我一直带着。今天的维修已经做完了，茶也泡好了。你想留下来，还是想去看看远处的风景？","I keep the second key with me. Today's repairs are finished, and the tea is ready. Would you like to stay, or go see what's beyond the horizon?"]}
};
const muling={
 anger:["我记得你那时的愤怒。你不必收回它。今天的灯路，我会照约定和大家一起检查。","I remember your anger. You don't have to take it back. Today I'll check the beacon route with everyone, as promised."],
 distance:["你那时需要距离。现在也可以。花园的第二把钥匙，并不意味着你欠我什么。","You needed distance then. You can still have it. The garden's second key doesn't mean you owe me anything."],
 understand:["谢谢你愿意听我解释。那没有抹去我做过的事。我还会继续把答应的维修做完。","Thank you for hearing me out. It didn't erase what I did. I'll keep finishing the repairs I promised."]
};

export function homeConversation(id,view,profile,snapshot){
 const q=lines[id];if(!q||!view?.ending||(id!=="muling"&&!view.returned?.includes(id)))return null;
 if(id==="muling")return muling[snapshot?.choices?.["library:M-04"]]||q.normal;
 return q.alternate&&profile?.methods?.includes(q.method)?q.alternate:q.normal;
}
export function mountHomeConversation(id,api){
 const view=api.view(),actor=campaign.cast[id],copy=homeConversation(id,view,api.supportProfile(actor?.region),api.snapshot());
 const stage=document.getElementById("stage");if(!stage||!copy||window.__game?.scene!=="yard")return false;
 const owner=window.State.S;api.close?.();document.querySelector(".res-home-conversation")?.dispatchEvent(new Event("cat-bond-close"));
 const root=document.createElement("div");root.className="cb-story-overlay is-visible res-host res-home-conversation";
 const panel=document.createElement("section");panel.className="res-dialogue";panel.setAttribute("role","dialog");panel.setAttribute("aria-modal","true");
 const art=document.createElement("img");art.className="res-portrait";art.alt="";art.src=new URL(id==="muling"?"../../assets/cinematics/characters/muling/traveler-neutral.webp":"../../assets/npc/"+id+"-painted.webp",import.meta.url).href;
 const body=document.createElement("div");body.className="res-body";const title=document.createElement("h2"),line=document.createElement("p"),controls=document.createElement("div"),close=document.createElement("button"),language=document.createElement("button");
 title.className="res-speaker";line.className="res-line";controls.className="res-controls";close.type=language.type="button";
 controls.append(close,language);body.append(title,line,controls);panel.append(art,body);root.append(panel);
 function render(){if(owner!==window.State.S||window.__game?.scene!=="yard"){dispose();return}const zh=window.MorrowwishI18n?.get?.()==="zh";title.textContent=actor.name[zh?"zh":"en"];line.textContent=copy[zh?0:1];close.textContent=zh?"关闭":"Close";language.textContent=zh?"English":"中文";panel.setAttribute("aria-label",title.textContent);}
 function dispose(){root.remove();window.removeEventListener("morrowwish-language-change",render);window.removeEventListener("cat-bond-active-save-changed",dispose);window.removeEventListener("pagehide",dispose);}
 close.onclick=dispose;language.onclick=()=>window.MorrowwishI18n?.set?.(window.MorrowwishI18n.get()==="zh"?"en":"zh");root.addEventListener("cat-bond-close",dispose);root.addEventListener("keydown",e=>{if(e.key==="Escape")dispose();});
 if(owner!==window.State.S)return false;stage.append(root);window.addEventListener("morrowwish-language-change",render);window.addEventListener("cat-bond-active-save-changed",dispose);window.addEventListener("pagehide",dispose,{once:true});render();close.focus();return true;
}
