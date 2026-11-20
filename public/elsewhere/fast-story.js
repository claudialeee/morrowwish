/* Five meaningful scenes per life. The removed episodes are folded into the neighboring scenes.
   Legacy story data is retained in window.ELSEWHERE_EIGHT_SCENE_BACKUP for existing analytics and migration. */
(()=>{'use strict';
const short={"map":[1,3,4,6,7],"narratives":{"no-work":[["Seven years after AI took over routine work, everyone has a home and enough to live on. Yet Sol's abandoned greenhouse has stood empty for months. Bea wants somewhere to play violin; her neighbor wants somewhere to sit in silence. They ask what you would build together."],["Because you invited the neighbors first, the greenhouse opens with a handmade sign and a list of very different wishes. Bea brings her violin; one elderly neighbor carries a book and asks for quiet.","Your seedlings turn the cracked greenhouse green. Neighbors begin dropping by, but Bea asks who decided that the benches should all face your flowers."],["The concert becomes a local sensation. Bea is thrilled, but a regular visitor says she no longer has a place to be alone. Sol asks how the greenhouse can belong to both of them.","The reading corner is peaceful and always occupied. Then you spot Bea practicing outside beside the bicycle rack: she doesn't want to spoil anyone's silence."],["A volunteer schedule and a quiet-hour agreement solve some problems. But a visitor complains that the greenhouse is turning into another organization with rules about who belongs.","The door is always open, which feels wonderfully free—until the seedlings are trampled and no one knows who should close up at night. The city offers to manage the place for you."],["The city has listed the greenhouse as a public space. Sol hands you the keys, but insists you shouldn't become its unpaid manager. For once, you can choose what to do with tomorrow.","The greenhouse stays small enough for everyone to recognize each other. Bea leaves fresh bread beside the door and asks whether you'll still visit next Tuesday."]],"bookshop":[["You inherit a bookshop in a harbor town and discover two things on your first morning: a box of undelivered letters and a notice saying the lease ends in ten days. Mara, who has cared for the shop for years, says some stories should be returned, not displayed."],["The family you traced arrives in the rain. One woman recognizes her father's handwriting but stops at the threshold: she doesn't want an audience. Mara offers to close the shop for an hour.","Your invitation wall reaches the family, but they ask you to remove a photograph before they enter. Their memories, they remind you, are not the town's entertainment."],["After the visit, the shop fills with neighbors who want it to survive. The landlord has another offer. Mara spreads the bills on the counter and asks what everyone is actually willing to contribute.","The visitor trusted you with her story, and a modest crowd returns the next day. The landlord still wants a concrete plan, not good intentions. Mara suggests a budget before anyone plans a celebration."],["The neighbors have pledged small monthly contributions, and a storm-night gathering proved the shop matters. But a cooperative lease means sharing control. The landlord waits for your final proposal.","The seaside book festival draws a surprising crowd even as a storm gathers. The visitors sign a support sheet, but Mara reminds you that one busy weekend is not a year's rent. The landlord waits."],["The community lease has been signed. Mara hangs a ring of spare keys by the register, each labeled with a neighbor's name. What will your own key mean now?","You negotiate a three-month independent lease. It saves the shop for now, but the ledger still needs attention. Mara puts a map of coastal towns on the counter and asks what comes next."]],"paris":[["You move into a tiny apartment above Camille's Paris bakery. She lends you a bicycle and points out the cinema across the street: it closes on Sunday. The projectionist mentions a missing film reel and says there may not be time for one last screening."],["The invitations fill the cinema with neighbors. They bring old home videos and stories of this street, but the lost reel remains missing. The projectionist asks how you would make this one night worth remembering.","You find the retired editor who kept the damaged reel. She refuses to call it complete, but she brings what survives back to the cinema. Camille gathers the neighbors for a screening."],["The neighborhood screening attracts attention. A developer offers money to turn the cinema into shops while keeping its pretty facade. Camille is tempted: the building is expensive to repair.","The scratched film brings a crowd, and someone offers to buy the reels. Camille asks a different question: do you need this building, or do you need places where people can watch films together?"],["The neighborhood cooperative has a budget and enough signatures for a one-year trial. But the council wants proof that volunteers can keep the old building open safely. You have one proposal to make.","A rooftop screening works beautifully, until a neighbor complains about the noise. The council wants clear local hosts, accessibility and quiet hours before approving citywide screenings."],["The old cinema wins a one-year trial season. Camille slips you a ticket to its reopening, still smelling faintly of bakery flour. Paris has started to feel familiar.","The city approves a pilot network of small outdoor screens. Camille circles the first location on your old bicycle map. There are so many streets you haven't explored."]],"cabin":[["You came to a lakeside cabin for a week of silence. Then June, the caretaker's daughter, knocks: the weather station is failing and someone has walked onto the frozen lake. The old logbook warns that the ice can crack without a sound."],["Your warning reaches the village, and everyone gets off the lake before the first crack. But the bridge is damaged. June asks whether you want to repair it or look for a safer route.","You repair the weather sensors just in time: a warning sounds before the ice breaks. The bridge is still unsafe. June unfolds her father's map and points toward the wooded ridge."],["The bridge holds after an emergency repair, but June refuses to open it without an inspection. A stranded hiker waits on the far shore. The neighbors ask you to plan a safe rescue.","Your marked ridge trail avoids the fragile ice. Then a hiker strays from the path at an unmarked fork. You spot their light as dusk falls, and June reaches for a lantern."],["The hiker makes it back safely, thanks to the rescue team. But June says no one person should have to save everyone each winter. The villagers want a permanent, shared solution.","June guides the hiker home along your marked trail. The village realizes the forest route could help others—but only if closures and nesting seasons are respected."],["Weeks later, the ranger cabin has been restored and stocked with blankets. The village rotates emergency checks, so nobody has to be a hero every day. June asks whether you'll stay.","The new ridge route has seasonal warning signs and a plan to close whenever the thaw makes it unsafe. June hands you the first updated map and asks where you'll go next."]]},"cfg":{"no-work":{"start":["The empty greenhouse","DAY 1 · 11:20 AM"],"specs":[["At the cracked glass","DAY 2 · 4:10 PM"],["The morning after","DAY 3 · 9:35 AM"],["The decision","DAY 5 · 2:30 PM"],["Another ordinary Tuesday","DAY 10 · 9:10 AM"]]},"bookshop":{"start":["Ten days left","DAY 1 · 10:00 AM"],"specs":[["The visitor","DAY 3 · 3:15 PM"],["The landlord's offer","DAY 5 · 5:40 PM"],["The lease","DAY 9 · 11:30 AM"],["A new morning","DAY 11 · 8:15 AM"]]},"paris":{"start":["The last cinema","FRIDAY · 9:15 AM"],"specs":[["One last screening","SATURDAY · 8:10 PM"],["The tempting offer","SUNDAY · 4:30 PM"],["The council","TUESDAY · 1:20 PM"],["A ticket, or a map","AUTUMN · 5:00 PM"]]},"cabin":{"start":["The warning","WINTER · 7:00 AM"],"specs":[["The first crack","DAY 2 · 4:00 AM"],["The missing hiker","DAY 4 · 5:10 PM"],["The safer winter","DAY 6 · 11:30 AM"],["The thaw","EARLY SPRING · 5:10 PM"]]}}};
// Curated complete Chinese prose for each short-life scene and choice route.
const chineseNarratives={"no-work":[["七年前，AI 接手了日常工作。每个人都有房子住，也不必为温饱发愁。可索尔发现的那座废弃温室，几个月来一直空着。碧娅想找个练小提琴的地方，邻居只想安安静静坐一会儿。他们问你：不如一起把这里变成点什么？"],["你先请来了街坊。温室门口挂起手写招牌，墙上贴满了五花八门的愿望。碧娅抱着小提琴来了，一位老人带着书，只希望能有个安静的角落。","你种下的幼苗爬满了破裂的玻璃窗。邻居们开始陆续走进温室，但碧娅问你：为什么所有长椅都朝着你的花？"],["音乐会意外成了社区里的热门话题。碧娅开心极了，可一位常客说，自己再也找不到独处的地方。索尔问你，温室怎样才能同时容下这两种需要？","阅读角安静又受欢迎，几乎没有空位。一天你看见碧娅躲在外面的自行车架旁练琴，她怕打扰里面的人。"],["志愿者轮值表和安静时段解决了一些麻烦。可有人抱怨：这间温室怎么又变成了一个规定谁能来、谁不能来的组织？","大门永远敞开，听上去自由极了。直到幼苗被踩坏，夜里又没人知道该由谁锁门。市政府提出，可以替你们管理这地方。"],["市政府已经把温室列为公共空间。索尔把钥匙交给你，却坚持不让你成为这里不领薪水的管理员。难得的是，明天怎么过，现在完全由你决定。","温室一直不大，来这里的人却都叫得出彼此的名字。碧娅把刚烤好的面包放在门边，问你下个星期二还会不会来。"]],"bookshop":[["你在海港小镇继承了一家书店。开门第一天就发现两件事：一箱从没寄出的信，以及一张通知——租约十天后到期。照料书店多年的玛拉说，有些故事应该还给当事人，而不是摆出来供人观看。"],["你找到的那家人在雨中赶来。一位女士认出了父亲的笔迹，却停在门口，不愿被人围观。玛拉主动提出，今天先关店一小时。","留言墙终于把消息传到了那家人耳中，但他们来之前希望你撤掉一张照片。他们提醒你：那些回忆属于自己，不是小镇的娱乐节目。"],["来访之后，越来越多的邻居走进书店，希望它留下来。房东却收到了另一份报价。玛拉把账单摊在柜台上，问大家究竟愿意拿出多少实际支持。","那位访客把自己的故事托付给了你。第二天，书店又来了几位客人，但房东要的是具体计划，不是美好愿望。玛拉建议先把账算清，再谈庆祝。"],["邻居们答应每月凑一点钱，暴风雨之夜的聚会也证明了书店的重要。但社区共同承租，就意味着你不能独自说了算。房东还在等最后的提案。","海边读书节来了比预想更多的人，天空却渐渐聚起乌云。大家签下支持书店的名字，玛拉仍提醒你：热闹的周末付不了一整年的租金。房东还在等。"],["社区租约终于签下。玛拉把一串备用钥匙挂在收银台旁，每把都贴着一位邻居的名字。那属于你的钥匙，现在意味着什么？","你谈下了三个月的独立租约，书店暂时保住了，但账本上的数字依旧紧张。玛拉把一张海滨小镇地图铺在柜台上，问你接下来想去哪儿。"]],"paris":[["你搬进巴黎一家面包店楼上的小公寓。店主卡米耶借你一辆自行车，指着街对面的电影院说：它周日就要关门了。放映师提起一卷失踪的胶片，担心来不及再办最后一场放映。"],["你的邀请让电影院坐满了街坊。大家带来旧家庭录像，讲起这条街从前的故事，唯独那卷胶片始终没有找到。放映师问你：怎样才能让今夜值得被记住？","你找到了保留受损胶片的退休剪辑师。她说这部片子算不上完成，但还是把剩下的部分带回了电影院。卡米耶也开始挨家邀请街坊来看放映。"],["社区放映意外引起关注。一位开发商出钱想把电影院改成商铺，只保留漂亮的外墙。卡米耶有些动心，毕竟修好这栋老楼要花不少钱。","划痕累累的老胶片吸引了许多观众，也有人提出高价收购。卡米耶却问了你另一个问题：你究竟想保住这栋楼，还是想留住大家一起看电影的机会？"],["街坊合作社已经筹到预算，也收集了足够多的签名，想让电影院试运营一年。但市议会要求证明志愿者能够安全地维护这栋老建筑。你只有一次提出方案的机会。","露天屋顶放映办得很成功，直到一位邻居抱怨噪声。市议会要求明确的负责人、无障碍设施和安静时段，才肯批准在全城开展露天放映。"],["老电影院终于争取到一年的试运营机会。卡米耶把重新开张的电影票塞给你，票上似乎还带着一点面包香。巴黎这座城，开始让你觉得熟悉。","市政府批准试建几处小型露天银幕。卡米耶在你那张旧自行车地图上圈出第一处地点。还有那么多街道，你都没走过。"]],"cabin":[["你原本只想在湖边小屋安安静静待一周。没想到守湖人的女儿琼敲响了门：气象站出了故障，还有人走上了结冰的湖面。旧日志里写着，冰层有时会悄无声息地裂开。"],["你的提醒及时传遍了村子，冰面开裂前，所有人都已经上岸。可桥还是损坏了。琼问你，是赶紧把桥修好，还是另找一条安全的路？","你们及时修好了气象传感器，警报在冰层断裂前响起。但桥仍然不安全。琼摊开父亲留下的地图，指向一条穿过林间山脊的小路。"],["紧急抢修后的桥勉强撑住了，但琼坚持检查完才能放行。对岸还有一位被困的徒步者。邻居们希望你安排一次安全的营救。","你标出的山脊小径避开了薄冰。可一名徒步者在没有路标的岔口走错了方向。黄昏时你看见远处一点灯光，琼已经拿起了提灯。"],["多亏救援队，那位徒步者平安回来了。但琼说，村子不能每个冬天都指望某个人挺身而出。大家想建立一个可以长期运作的共同方案。","琼沿着你标出的路线把徒步者带回了家。村民发现，这条林间小路或许也能帮助其他人——但必须尊重封路季节和野生动物繁殖期。"],["几周后，巡护小屋修好了，里面备着毛毯和应急用品。村里的人轮流巡查，再也不用谁天天当英雄。琼问你，会不会留下来。","山脊新路装上了季节性警示牌，冰雪融化到危险程度时就会封闭。琼把第一张修订后的地图交给你，问你下一站打算去哪儿。"]]};
const oldToNew=Object.fromEntries(short.map.map((old,i)=>[old,i]));
window.ELSEWHERE_EIGHT_SCENE_BACKUP=structuredClone(window.ELSEWHERE_SEASON);
window.ELSEWHERE_FAST_STORY_VERSION=3;
const t=window.MORROW_ZH_STORIES=window.MORROW_ZH_STORIES||{};
const tSet=(en,zh)=>{t[en]=zh;return en;};
for(const world of window.ELSEWHERE_SEASON){
 const id=world.id,origin=world.acts;
 const mapped=short.map.map((index,i)=>{
   const a=structuredClone(origin[index]),narr=short.narratives[id][i];
   a.n=narr.map((entry,variant)=>{
    // A narrative entry is a string; destructuring it as [en,zh] extracts only
    // its first two characters, leaving a stray letter in every chapter.
    const en=typeof entry==='string'?entry:entry[0];
    const translation=typeof entry==='string'?chineseNarratives[id]?.[i]?.[variant]:entry[1];
    return tSet(en,translation||en);
   });
   if(a.n.length===1)a.n.push(a.n[0]);
   const heading=i===0?short.cfg[id].start:short.cfg[id].specs[i-1];
   a.loc=tSet(heading[0],({"The empty greenhouse":"空置的温室","At the cracked glass":"碎玻璃窗旁","The morning after":"第二天清晨","The decision":"必须作出的决定","Another ordinary Tuesday":"又一个平凡星期二","Ten days left":"十天期限","The visitor":"到访的客人","The landlord's offer":"房东的提议","The lease":"租约","A new morning":"新的一天","The last cinema":"最后一家电影院","One last screening":"最后一场放映","The tempting offer":"诱人的提议","The council":"市议会","A ticket, or a map":"电影票，还是地图","The warning":"警告","The first crack":"第一道裂痕","The missing hiker":"失踪的徒步者","The safer winter":"更安全的冬天","The thaw":"冰雪消融"})[heading[0]]||heading[0]);a.clock=tSet(heading[1],({"DAY 1 · 11:20 AM":"第1天 · 上午11:20","DAY 2 · 4:10 PM":"第2天 · 下午4:10","DAY 3 · 9:35 AM":"第3天 · 上午9:35","DAY 5 · 2:30 PM":"第5天 · 下午2:30","DAY 10 · 9:10 AM":"第10天 · 上午9:10","DAY 1 · 10:00 AM":"第1天 · 上午10:00","DAY 3 · 3:15 PM":"第3天 · 下午3:15","DAY 5 · 5:40 PM":"第5天 · 下午5:40","DAY 9 · 11:30 AM":"第9天 · 上午11:30","DAY 11 · 8:15 AM":"第11天 · 上午8:15","FRIDAY · 9:15 AM":"星期五 · 上午9:15","SATURDAY · 8:10 PM":"星期六 · 晚上8:10","SUNDAY · 4:30 PM":"星期日 · 下午4:30","TUESDAY · 1:20 PM":"星期二 · 下午1:20","AUTUMN · 5:00 PM":"秋天 · 下午5:00","WINTER · 7:00 AM":"冬日 · 上午7:00","DAY 2 · 4:00 AM":"第2天 · 凌晨4:00","DAY 4 · 5:10 PM":"第4天 · 下午5:10","DAY 6 · 11:30 AM":"第6天 · 上午11:30","EARLY SPRING · 5:10 PM":"初春 · 下午5:10"})[heading[1]]||heading[1]);
   return a;
 });
 if(id==='paris'){
  mapped[0].choices[0][0]=tSet('Invite neighbors to share their films','邀请邻居们带来自己的影像');
  mapped[0].choices[1][0]=tSet('Search for the missing reel','寻找那卷失踪的胶片');
  mapped[0].choices[0][1]=tSet("You invite the street, and people promise to bring old home videos. The projectionist thanks you, though the missing reel remains lost.","你邀请街坊们带着旧家庭录像来看电影。放映师向你道谢，但失踪的胶片依旧没有找到。");
  mapped[0].choices[1][1]=tSet("A retired editor still has the damaged film. She agrees to return it, but warns that its ending was never finished.","一位退休剪辑师保留着那卷受损的电影。她同意归还，却提醒你：它的结尾从未拍完。");
 }
 if(id==='cabin'){
  mapped[0].choices[0][0]=tSet('Warn the village immediately','立刻提醒村民');
  mapped[0].choices[1][0]=tSet('Repair the weather station first','先修好气象站');
  mapped[0].choices[0][1]=tSet("You go door to door with June. Before dawn, everyone is warned; nobody is left on the cracking ice.","你和 June 挨家挨户通知。天亮前，所有人都知道了危险；冰层开裂时湖上已没有人。");
  mapped[0].choices[1][1]=tSet("You restore the station and its alarms with June. The warning arrives in time, but now you know how fragile the system is.","你和 June 修好气象站及警报。警告及时发出，但你也知道这套系统有多脆弱。");
  mapped[0].choices.forEach((c,i)=>{c[2]=origin[2].choices[i][2]});
 }
 if(id==='no-work'){
  mapped[0].inspect[1]=['🔎',tSet("Look at the gardener's screen","查看园艺机器人的屏幕"),tSet("An old city counter labels some visitors 'worth a seat'. No one remembers agreeing to that.","城市的旧计数器把一部分访客标为“值得拥有座位”。没有人记得同意过这个标准。")];
 }
 if(id==='bookshop'){
  mapped[0].inspect[0]=['✉️',tSet("Inspect the unopened envelope","查看未拆封的信"),tSet("In your aunt's handwriting: ONLY IF THEY ASK. A small key is drawn by the seal.","姨妈在信封上写着：只有他们主动问起时才能打开。封口旁画着一把小钥匙。")];
 }
 if(id==='cabin'){
  mapped[0].inspect[1]=['📖',tSet("Read the caretaker's logbook","阅读守湖人的日志"),tSet("Two trails are marked: one inked, one penciled. The last note reads, THE LAKE CHANGES; SO MUST THE MAP.","日志里画着两条路：一条用墨水画，一条用铅笔画。最后写着：湖在变化，地图也必须改变。")];
 }
 // Maintain one decisive action per scene while the other beats are shown as consequences.
 world.acts=mapped;
}
const con=window.ELSEWHERE_CONTINUITY||{};
for(const world of window.ELSEWHERE_SEASON){
 const id=world.id,oldBeats=con.beats?.[id]||{},oldHints=con.hints?.[id]||[];
 const beats={};
 for(const [oldIndex,beat] of Object.entries(oldBeats)){
  const idx=oldToNew[oldIndex],previous=oldToNew[beat.from];
  if(Number.isInteger(idx)&&Number.isInteger(previous)&&previous<idx)beats[idx]={...beat,from:previous};
 }
 con.beats[id]=beats;
 con.hints[id]=short.map.map(i=>oldHints[i]||[]);
}
if(con.overrides?.paris?.[3]){
 const old=con.overrides.paris[3];
 con.overrides.paris={1:{...old,from:0}};
}
con.hints.paris[0]=[
 ['Build a crowd; the film may stay lost.','聚拢观众，也可能错过失踪的电影。'],
 ['Find the film, with less time to invite people.','寻找胶片，也少了邀请大家的时间。']
];
con.hints.cabin[0]=[
 ['Act on the warning before you have perfect proof.','先提醒大家，不必等待所有证据。'],
 ['Make the alarm reliable, but time is running out.','修好警报，但时间正在流逝。']
];
const mystery=window.ELSEWHERE_MYSTERIES;
for(const [id,route] of Object.entries(mystery||{})){
 const map=id==='no-work'?{1:0,2:0,4:2,6:3}:
   id==='bookshop'?{1:0,2:0,3:1,6:3}:
   id==='paris'?{2:0,3:1,6:3}:{2:0,3:1,6:3};
 for(const step of route.steps)step.at=map[step.at]??step.at;
}
const endings=window.ELSEWHERE_ENDINGS;
for(const [id,route] of Object.entries(endings||{})){
 for(const mem of route.memories){
  const index=id==='cabin'&&mem.at===2?0:id==='cabin'&&mem.at===3?1:
   id==='paris'&&mem.at===1?0:oldToNew[mem.at];
  if(Number.isInteger(index))mem.at=index;
 }
}
})();