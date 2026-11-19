/* Five meaningful scenes per life. The removed episodes are folded into the neighboring scenes.
   Legacy story data is retained in window.ELSEWHERE_EIGHT_SCENE_BACKUP for existing analytics and migration. */
(()=>{'use strict';
const short={"map":[1,3,4,6,7],"narratives":{"no-work":[["Seven years after AI took over routine work, everyone has a home and enough to live on. Yet Sol's abandoned greenhouse has stood empty for months. Bea wants somewhere to play violin; her neighbor wants somewhere to sit in silence. They ask what you would build together."],["Because you invited the neighbors first, the greenhouse opens with a handmade sign and a list of very different wishes. Bea brings her violin; one elderly neighbor carries a book and asks for quiet.","Your seedlings turn the cracked greenhouse green. Neighbors begin dropping by, but Bea asks who decided that the benches should all face your flowers."],["The concert becomes a local sensation. Bea is thrilled, but a regular visitor says she no longer has a place to be alone. Sol asks how the greenhouse can belong to both of them.","The reading corner is peaceful and always occupied. Then you spot Bea practicing outside beside the bicycle rack: she doesn't want to spoil anyone's silence."],["A volunteer schedule and a quiet-hour agreement solve some problems. But a visitor complains that the greenhouse is turning into another organization with rules about who belongs.","The door is always open, which feels wonderfully free—until the seedlings are trampled and no one knows who should close up at night. The city offers to manage the place for you."],["The city has listed the greenhouse as a public space. Sol hands you the keys, but insists you shouldn't become its unpaid manager. For once, you can choose what to do with tomorrow.","The greenhouse stays small enough for everyone to recognize each other. Bea leaves fresh bread beside the door and asks whether you'll still visit next Tuesday."]],"bookshop":[["You inherit a bookshop in a harbor town and discover two things on your first morning: a box of undelivered letters and a notice saying the lease ends in ten days. Mara, who has cared for the shop for years, says some stories should be returned, not displayed."],["The family you traced arrives in the rain. One woman recognizes her father's handwriting but stops at the threshold: she doesn't want an audience. Mara offers to close the shop for an hour.","Your invitation wall reaches the family, but they ask you to remove a photograph before they enter. Their memories, they remind you, are not the town's entertainment."],["After the visit, the shop fills with neighbors who want it to survive. The landlord has another offer. Mara spreads the bills on the counter and asks what everyone is actually willing to contribute.","The visitor trusted you with her story, and a modest crowd returns the next day. The landlord still wants a concrete plan, not good intentions. Mara suggests a budget before anyone plans a celebration."],["The neighbors have pledged small monthly contributions, and a storm-night gathering proved the shop matters. But a cooperative lease means sharing control. The landlord waits for your final proposal.","The seaside book festival draws a surprising crowd even as a storm gathers. The visitors sign a support sheet, but Mara reminds you that one busy weekend is not a year's rent. The landlord waits."],["The community lease has been signed. Mara hangs a ring of spare keys by the register, each labeled with a neighbor's name. What will your own key mean now?","You negotiate a three-month independent lease. It saves the shop for now, but the ledger still needs attention. Mara puts a map of coastal towns on the counter and asks what comes next."]],"paris":[["You move into a tiny apartment above Camille's Paris bakery. She lends you a bicycle and points out the cinema across the street: it closes on Sunday. The projectionist mentions a missing film reel and says there may not be time for one last screening."],["The invitations fill the cinema with neighbors. They bring old home videos and stories of this street, but the lost reel remains missing. The projectionist asks how you would make this one night worth remembering.","You find the retired editor who kept the damaged reel. She refuses to call it complete, but she brings what survives back to the cinema. Camille gathers the neighbors for a screening."],["The neighborhood screening attracts attention. A developer offers money to turn the cinema into shops while keeping its pretty facade. Camille is tempted: the building is expensive to repair.","The scratched film brings a crowd, and someone offers to buy the reels. Camille asks a different question: do you need this building, or do you need places where people can watch films together?"],["The neighborhood cooperative has a budget and enough signatures for a one-year trial. But the council wants proof that volunteers can keep the old building open safely. You have one proposal to make.","A rooftop screening works beautifully, until a neighbor complains about the noise. The council wants clear local hosts, accessibility and quiet hours before approving citywide screenings."],["The old cinema wins a one-year trial season. Camille slips you a ticket to its reopening, still smelling faintly of bakery flour. Paris has started to feel familiar.","The city approves a pilot network of small outdoor screens. Camille circles the first location on your old bicycle map. There are so many streets you haven't explored."]],"cabin":[["You came to a lakeside cabin for a week of silence. Then June, the caretaker's daughter, knocks: the weather station is failing and someone has walked onto the frozen lake. The old logbook warns that the ice can crack without a sound."],["Your warning reaches the village, and everyone gets off the lake before the first crack. But the bridge is damaged. June asks whether you want to repair it or look for a safer route.","You repair the weather sensors just in time: a warning sounds before the ice breaks. The bridge is still unsafe. June unfolds her father's map and points toward the wooded ridge."],["The bridge holds after an emergency repair, but June refuses to open it without an inspection. A stranded hiker waits on the far shore. The neighbors ask you to plan a safe rescue.","Your marked ridge trail avoids the fragile ice. Then a hiker strays from the path at an unmarked fork. You spot their light as dusk falls, and June reaches for a lantern."],["The hiker makes it back safely, thanks to the rescue team. But June says no one person should have to save everyone each winter. The villagers want a permanent, shared solution.","June guides the hiker home along your marked trail. The village realizes the forest route could help others—but only if closures and nesting seasons are respected."],["Weeks later, the ranger cabin has been restored and stocked with blankets. The village rotates emergency checks, so nobody has to be a hero every day. June asks whether you'll stay.","The new ridge route has seasonal warning signs and a plan to close whenever the thaw makes it unsafe. June hands you the first updated map and asks where you'll go next."]]},"cfg":{"no-work":{"start":["The empty greenhouse","DAY 1 · 11:20 AM"],"specs":[["At the cracked glass","DAY 2 · 4:10 PM"],["The morning after","DAY 3 · 9:35 AM"],["The decision","DAY 5 · 2:30 PM"],["Another ordinary Tuesday","DAY 10 · 9:10 AM"]]},"bookshop":{"start":["Ten days left","DAY 1 · 10:00 AM"],"specs":[["The visitor","DAY 3 · 3:15 PM"],["The landlord's offer","DAY 5 · 5:40 PM"],["The lease","DAY 9 · 11:30 AM"],["A new morning","DAY 11 · 8:15 AM"]]},"paris":{"start":["The last cinema","FRIDAY · 9:15 AM"],"specs":[["One last screening","SATURDAY · 8:10 PM"],["The tempting offer","SUNDAY · 4:30 PM"],["The council","TUESDAY · 1:20 PM"],["A ticket, or a map","AUTUMN · 5:00 PM"]]},"cabin":{"start":["The warning","WINTER · 7:00 AM"],"specs":[["The first crack","DAY 2 · 4:00 AM"],["The missing hiker","DAY 4 · 5:10 PM"],["The safer winter","DAY 6 · 11:30 AM"],["The thaw","EARLY SPRING · 5:10 PM"]]}}};
const oldToNew=Object.fromEntries(short.map.map((old,i)=>[old,i]));
window.ELSEWHERE_EIGHT_SCENE_BACKUP=structuredClone(window.ELSEWHERE_SEASON);
window.ELSEWHERE_FAST_STORY_VERSION=3;
const t=window.MORROW_ZH_STORIES=window.MORROW_ZH_STORIES||{};
const tSet=(en,zh)=>{t[en]=zh;return en;};
for(const world of window.ELSEWHERE_SEASON){
 const id=world.id,origin=world.acts;
 const mapped=short.map.map((index,i)=>{
   const a=structuredClone(origin[index]),narr=short.narratives[id][i];
   a.n=narr.map(([en,zh])=>tSet(en,zh));
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