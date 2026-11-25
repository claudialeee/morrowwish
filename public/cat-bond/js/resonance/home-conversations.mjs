// Optional home conversations read canonical choices and returned NPCs; no separate progression.
const stories={
 jiedeng:["harbor:H-04","calibrate",["你先校准灯塔的那天，我们找回了照料航线的耐心。","The day you aligned the lighthouse first, we remembered how much patience a safe route takes."],["你当时先去救船。我如今每天检查备用灯路，不让下一次救援只能依靠运气。","You went to rescue the boat first. Now I check the spare beacon daily, so the next rescue won't depend on luck."]],
 qilan:["harbor:H-04","rescue",["还记得那艘小船吗？现在我把救援路线教给新来的领航员。","Remember that little boat? Now I teach the rescue route to new navigators."],["那次校准后的灯光真的照到了船。我把新航图带来了，哪天一起看吧。","The calibrated beacon reached the boat that day. I've brought the new charts. We can look at them together."]],
 yahe:["forest:R-02","gardens",["药草园最先恢复，但这一次，药材也会留给地下的邻居。","The herb gardens recovered first, but this time we'll keep medicine for our neighbors below."],["根系先恢复以后，药草长得更好了。我给你带了些种子。","After the roots recovered, our herbs grew better. I brought you some seeds."]],
 yuchuan:["forest:R-02","roots",["谢谢你那时先去稳定根系。现在我和芽禾共同记下每一次水位变化。","Thank you for stabilizing the roots first. Yahe and I now record every change in the water level together."],["药草园恢复后，我们终于能坐下来商量怎样分水。今天也是一起检查的。","Once the gardens recovered, we could finally sit down and agree on sharing the water. We checked it together today, too."]],
 jinpo:["forge:E-02","private",["你给了我亲自面对工人的机会。那不是替我隐瞒。新的维修记录谁都能查。","You gave me a chance to face the workers myself. That wasn't a cover-up. Everyone can read the new repair logs."],["事故记录公开之后，我们有过很艰难的谈话。现在安全检查不再只由我签字。","We had some difficult conversations after the accident record went public. I'm no longer the only one signing the safety checks."]],
 xiaomao:["forge:E-02","publish",["工人看到了完整记录，后来我们一起改了阀门。花园里的工具也用的是新设计。","Once the workers saw the complete record, we redesigned the valve together. The garden tools use that new design too."],["烬婆自己告诉了我们发生的事。我们没有跳过后来的公开检查。","Jinpo told us what happened herself. We didn't skip the public inspection afterward."]],
 lingyu:["sky:S-03","train",["共同训练的路线还在。如今远帆可以自己选择起飞的时机。","We still use the joint training route. Now Yuanfan can decide when to take off."],["那次让远帆领飞，我学会了不把保护变成阻拦。","When Yuanfan took the lead, I learned that protection needn't mean holding someone back."]],
 yuanfan:["sky:S-03","lead",["我第一次领飞的日志还在这里。下一次送信，我想自己挑一条新路。","My first lead-flight log is still here. On my next delivery I'd like to choose a new route myself."],["共同训练时画的航线救了我们不少麻烦。下一次，我会带着这些经验独自送信。","The routes we drew in joint training saved us a lot of trouble. I'll take those lessons on my next solo delivery."]],
 moye:["library:M-05","review",["家庭先审阅自己的记录之后，我们保存了经核实的版本。没有人的记忆必须拿来交换真相。","After families reviewed their own records, we preserved verified versions. No one has to trade away a memory for the truth."],["公开档案之后，有些家庭来找我谈了很久。我们后来也留出了私人阅读的空间。","After the archives opened, some families came to talk for a long time. We've since made room for private reading as well."]],
 baikan:["library:M-05","open",["那次公开档案以后，越来越多居民愿意帮忙核对记录。我带来了新编的目录。","After the archives opened, more residents helped verify the records. I brought the new catalog."],["逐份审阅比我想的慢，但新目录里的每条证词都有出处。","Reviewing each record took longer than I expected, but every account in the new catalog has a source."]],
 xingya:["starfall:F-04","coordinate",["你当时让我协调修复。现在我把每次校准结果送到其他五地，让他们也能判断。","You let me coordinate the repair. Now I send every calibration result to the other five regions, so they can judge for themselves."],["各聚落共同决策的记录已经整理好了。下次遇到故障，不会只有中央说了算。","The settlements' shared decisions are recorded. Next time something fails, the center won't have the only say."]],
 lichuan:["starfall:F-04","distribute",["六地各自的回应接起来以后，商队才真正有了归路。今天我又带来一份航线回报。","Once the six regions' replies joined up, the caravans finally had a way home. I brought another route report today."],["星芽协调修复时，我们也把路线上的问题交给沿途的聚落。现在这份习惯还留着。","While Xingya coordinated the repair, we brought route problems to the settlements along the way. We've kept that practice."]]
};
const muling={
 anger:["我记得你那时的愤怒。你不必收回它。今天的灯路，我会照约定和大家一起检查。","I remember your anger. You don't have to take it back. Today I'll check the beacon route with everyone, as promised."],
 distance:["你那时需要距离。现在也可以。花园的第二把钥匙，并不意味着你欠我什么。","You needed distance then. You can still have it. The garden's second key doesn't mean you owe me anything."],
 understand:["谢谢你愿意听我解释。那没有抹去我做过的事。我还会继续把答应的维修做完。","Thank you for hearing me out. It didn't erase what I did. I'll keep finishing the repairs I promised."]
};
const line=(speaker,text)=>({speaker,text:{zh:text[0],en:text[1]}});
export function homeConversation(snapshot,id){
 if(!snapshot?.completed?.includes("epilogue:E-03"))return null;
 let words;
 if(id==="muling")words=muling[snapshot.choices?.["library:M-04"]];
 else{
  const s=stories[id];
  if(!s||!snapshot.returned?.includes(id))return null;
  words=s[snapshot.choices?.[s[0]]===s[1]?2:3];
 }
 if(!words)return null;
 return {id:"home:"+id,title:{zh:"阳光花园",en:"Sunlit Garden"},lines:[line(id,words)],choices:[],choiceTiming:"afterDialogue"};
}
