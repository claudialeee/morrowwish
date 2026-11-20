/* Elsewhere: two new dramatic, reactive scenes per dream life, fully bilingual. */
(()=>{"use strict";const L=(zh,en)=>[zh,en];
window.ELSEWHERE_EXTRA_SCENES={
amalfi:{
bridge:{title:L("岛上不该存在的第二栋房子","THE HOUSE THAT SHOULDN'T EXIST"),
branches:[
L("你按明信片上的坐标航行，发现一座只能在落潮时出现的玻璃灯塔。灯亮了，里面的人竟和你长得一模一样。","You follow the postcard to a glass lighthouse revealed at low tide. The person inside looks exactly like you."),
L("暗门后的遗嘱写着：这座别墅只属于今天。日落时，它将消失。窗外，一艘无人的豪华游艇正驶向海湾。","The will says the villa belongs to you only today. At sunset, it vanishes. Outside, an empty superyacht heads your way."),
L("陌生人带你登上一座无人岛。沙滩上却排满了写着你名字的行李箱——每一个都来自另一种人生。","Your new companion takes you to an empty island, where suitcases bearing your name await—one from every life you never lived.")],
choices:[
[L("进入灯塔，和另一个我见面","Enter the lighthouse and meet your double"),L("另一个你递来一张船票：上面没有返程日期。","Your double hands you a ticket without a return date.")],
[L("登上无人游艇，查明真相","Board the empty yacht"),L("游艇的导航自动设定了午夜的目的地。","The yacht sets its own midnight destination.")],
[L("打开其中一只人生行李箱","Open one of the life suitcases"),L("里面是一张照片：你在另一个世界里笑得灿烂。","Inside is a photo of you laughing in another world.")]]},
storm:{title:L("午夜，整个海岸都消失了","AT MIDNIGHT, THE COAST VANISHES"),
branches:[
L("另一个你把船票撕成两半。海水忽然退去，露出通往第二座阿马尔菲的街道——那里永远不会有星期一。","Your double tears the ticket in half. The tide withdraws, revealing another Amalfi—where Mondays don't exist."),
L("游艇的目的地不是港口，而是一场悬浮在海上的盛大舞会。你是唯一收到两张邀请函的人。","The yacht reaches a ballroom floating over the sea. You're the only guest invited twice."),
L("照片里的你走出画框，说出一句话：你可以留下豪宅，也可以带走全部的自由。","The you in the photo steps into reality: you may keep the villa, or take all the freedom with you.")],
choices:[
[L("把所有被困的人带走","Take everyone along"),L("海岸线上亮起一艘接一艘的船灯。","One by one, boats light up along the coast.")],
[L("赌一把，开启新世界","Bet everything on the new world"),L("第二座阿马尔菲在你眼前升起。","A second Amalfi rises out of the sea.")],
[L("放弃房产，只保留这一天","Keep the day, not the property"),L("落日停止移动，你拥有了时间。","The sunset stops moving. You gain time itself.")]]},
after:[L("身后的灯塔最后亮了一次，你知道这不是普通的告别。","The lighthouse flashes one last time. This isn't an ordinary goodbye."),L("海上的舞会为你奏响最后一首曲子，所有船都向你致意。","The floating ballroom plays one final song for you."),L("第二个你微笑着挥手，你带着两段人生的勇气继续往前走。","Your other self waves goodbye. You carry the courage of two lives.")],
shock:L("海岸消失了！","THE COAST IS GONE!")},
paris:{
bridge:{title:L("未来的照片，出现了第二个人","THERE'S SOMEONE ELSE IN THE PHOTO"),
branches:[
L("天台上，你们打开一台旧相机。里面拍的竟是十年后的婚礼——主角是你，而另一人面容模糊。","On the rooftop, an old camera reveals your wedding ten years from now—but the other person's face is blurred."),
L("午夜的地址是一家只在雨中营业的电影院。银幕上正在放映你明天要做的选择。","The address leads to a cinema that opens only in the rain. It's screening tomorrow's decisions."),
L("雨中的巴黎忽然静止，路人像照片一样不动。只有你和那个人还可以自由走动。","Paris freezes mid-rain, everyone suspended like a photograph. Only you two can move.")],
choices:[
[L("寻找照片中消失的脸","Find the missing face"),L("照片背面写着：不要相信完美的结局。","The photo says: Don't trust the perfect ending.")],
[L("冲进那部放映未来的电影","Step into the film of tomorrow"),L("银幕化成一道门，你听见了自己的心跳。","The screen becomes a doorway. Your heartbeat is louder than the projector.")],
[L("趁时间停止，偷偷改写这一夜","Rewrite the frozen night"),L("你在塞纳河边留下了一张新的明信片。","You leave a new postcard beside the Seine.")]]},
storm:{title:L("午夜钟声响起，两个人同时出现","AT MIDNIGHT, TWO FUTURES ARRIVE"),
branches:[
L("照片里的陌生人终于出现。他说他不是情敌，而是来自另一条时间线的你。","The blurred figure appears. They're not your rival—they're you from another timeline."),
L("你从电影银幕走出，发现巴黎已经过了十年，而对方仍在同一个路口等你。","You step out of the screen. Ten years have passed, yet the same person waits at the corner."),
L("钟声敲响，明信片上的文字开始自己改写：幸福不是命中注定，而是你敢不敢选择。","The bells ring. The postcard rewrites itself: happiness isn't destiny; it's a decision.")],
choices:[
[L("当众说出从未敢说的真心话","Confess everything out loud"),L("广场上响起掌声，连路灯都亮了。","Applause sweeps the square. Even the streetlights brighten.")],
[L("撕掉剧本，创造新的未来","Tear up the script"),L("旧胶片化为玫瑰花瓣，飞满整个街口。","The old film dissolves into rose petals across the boulevard.")],
[L("谁都不追，先选择自己","Choose yourself first"),L("你独自走向塞纳河，却没有半点遗憾。","You walk toward the Seine alone, without a trace of regret.")]]},
after:[L("十年后的你在人群中朝你点头。","Your future self nods from the crowd."),L("电影院的招牌突然变成了你的名字。","The cinema marquee changes to your name."),L("明信片上的明天一片空白，等你亲自书写。","Tomorrow's postcard is blank. The rest is yours.")],
shock:L("未来的你出现了","YOUR FUTURE SELF ARRIVES")},
tokyo:{
bridge:{title:L("巨幕里的明星，竟不是你","THE STAR ON SCREEN ISN'T YOU"),
branches:[
L("纪录片最后一幕，你在东京街头失踪。与此同时，演唱会后台出现了第二个你。","The documentary ends with your disappearance. Backstage, a second you steps into the spotlight."),
L("全场唱起你从没发布的歌。经纪人承认，公司用你的声音训练了一个虚拟替身。","The stadium sings your unreleased song. Your manager admits the label created a virtual replacement."),
L("粉丝给你的耳返里传来一条秘密广播：午夜后，所有屏幕都只会播放假明星。","A secret broadcast cuts into your earpiece: at midnight, every screen will show the fake star.")],
choices:[
[L("走向第二个我，要求对唱","Challenge your double to a duet"),L("数万只荧光棒开始一明一暗地闪烁。","Tens of thousands of lightsticks begin blinking in two rhythms.")],
[L("关闭提词器，唱从没发行过的歌","Turn off the teleprompter and sing"),L("整个体育馆安静了，你第一次听见真正的自己。","The stadium goes silent. You hear your own voice for the first time.")],
[L("让粉丝投票，选择真正的你","Let the fans choose the real you"),L("观众把手机屏幕翻转，组成巨大的你的名字。","The crowd flips their phones to spell your name.")]]},
storm:{title:L("全东京停电了，只有你的舞台还亮着","TOKYO GOES DARK. YOUR STAGE STAYS LIT"),
branches:[
L("虚拟替身忽然跪下说：我也不想当你的影子。它请求和你一起唱最后一首歌。","Your digital double begs: I don't want to be your shadow. It asks to share one final song."),
L("你的清唱传遍停电的城市。附近街道上的人打开窗户，一起唱了起来。","Your unamplified song carries across the dark city. People open windows and sing along."),
L("十万人组成的光海从体育馆流向东京街头。你发现今夜不需要经纪公司，也能拥有舞台。","A sea of lights flows from the stadium into Tokyo's streets. You no longer need a label to have a stage.")],
choices:[
[L("和替身合唱一次，随后放它自由","Sing with your double, then set it free"),L("最后一个和弦落下时，所有屏幕映出了真实的你。","On the final chord, every screen shows the real you.")],
[L("走进观众席，把麦克风交给大家","Hand the microphone to the crowd"),L("十万人接力唱完了一首没有歌手的歌。","A hundred thousand people finish a song without a singer.")],
[L("登上楼顶，把整座城市变成舞台","Turn the city into your stage"),L("东京塔的灯光开始跟随你的节拍。","Tokyo Tower's lights begin pulsing with your beat.")]]},
after:[L("你的名字出现在整座城市的屏幕上，但这次没人能控制你。","Your name fills the city's screens. This time, nobody controls you."),L("无数陌生人跟着唱了起来，这首歌真正属于了大家。","Strangers sing along. The song finally belongs to everyone."),L("当最后一盏灯熄灭，你终于可以选择自己的明天。","When the last spotlight fades, tomorrow belongs to you.")],
shock:L("全东京突然停电","THE ENTIRE CITY BLACKS OUT")},
iceland:{
bridge:{title:L("极光里有人向你发送讯息","THE AURORA SENDS YOU A MESSAGE"),
branches:[
L("明天的你踩着蓝色雪光走来，手里握着一块冰：里面冻结着你遗忘的一天。","Tomorrow's you arrives holding a block of ice containing a day you've forgotten."),
L("瓶中的纸条变成了你童年的字迹，上面只有一句：你还记得第一次快乐的事吗？","The note turns into your childhood handwriting: do you remember the first moment you felt truly happy?"),
L("冰川深处有一座停摆的钟，钟面显示全世界只剩六十分钟。","Deep in the glacier stands a stopped clock. It says the whole world has sixty minutes left.")],
choices:[
[L("敲碎冰块，把那一天找回来","Break the ice and recover the day"),L("一场失落的夏日烟火突然在雪地里绽放。","A lost summer's fireworks burst over the snow.")],
[L("追随极光中闪烁的名字","Follow the names in the aurora"),L("夜空变成了一幅通往天空岛屿的地图。","The sky becomes a map to a floating island.")],
[L("修好冰川上的钟，让时间继续","Repair the clock and restart time"),L("秒针第一次移动，整片冰原开始发光。","The second hand moves. The whole glacier glows.")]]},
storm:{title:L("整个天空打开了一扇门","A DOOR OPENS IN THE SKY"),
branches:[
L("冰块裂开后，记忆没有消失，而是变成一场能亲自走进去的夏天。","The ice opens into a summer memory you can physically step into."),
L("云层像海浪一样分开，极光岛屿真的落在你面前。岛上居民知道你的名字。","The clouds part. An aurora island descends, and its inhabitants know your name."),
L("时间重启后，整个世界的天空同时亮起极光。只有你知道这场奇迹从哪里开始。","Time restarts, and auroras light every sky on Earth. Only you know how it happened.")],
choices:[
[L("再体验一次最快乐的瞬间","Relive your happiest moment"),L("你在雪地中听见一声久违的笑。","A long-forgotten laugh echoes across the snow.")],
[L("把天空的秘密带给世界","Share the secret with the world"),L("所有灯光熄灭一秒，极光照亮了城市。","City lights fade for a heartbeat as auroras fill the sky.")],
[L("放下愿望，走进新的世界","Let go of your wish and step through"),L("极光之门在身后合拢，你却一点也不害怕。","The aurora door closes behind you. You aren't afraid.")]]},
after:[L("消失的夏天在你的心里重新闪亮。","The lost summer shines inside you once more."),L("你抬头看见了地图上不存在的星座。","You look up and see constellations on no map."),L("远方城市的人们也同时许下了愿望。","Faraway cities make wishes beneath the same sky.")],
shock:L("天空裂开一扇门","A DOOR OPENS IN THE SKY")},
maldives:{
bridge:{title:L("海水退去，出现一条发光的路","THE SEA REVEALS A GLOWING ROAD"),
branches:[
L("潮汐露出一条发光的珊瑚路。终点竟是一座水下玻璃宫殿，里面有人在举行宴会。","The receding tide reveals a glowing coral path to an underwater palace hosting a grand dinner."),
L("岛上所有灯变蓝的那一刻，海里跃起几十只发光的海豚，在空中组成了你的名字。","As the island lights turn blue, glowing dolphins leap into the shape of your name."),
L("海底观景室的窗外出现一头巨鲸。它停下来看着你，背上居然驮着一座小花园。","A giant whale pauses outside the viewing room, carrying a tiny garden on its back.")],
choices:[
[L("进入水下宫殿，参加神秘晚宴","Enter the underwater palace"),L("餐桌中央摆着一封写给你的邀请函。","A letter addressed to you waits at the center of the table.")],
[L("跟随海豚去看一场奇景","Follow the dolphins"),L("海豚带你穿过一道彩虹色水幕。","The dolphins guide you through a rainbow curtain of water.")],
[L("登上鲸鱼背上的秘密花园","Explore the whale's secret garden"),L("花园里的每一朵花都记录着一个海上愿望。","Every flower in the garden holds an ocean wish.")]]},
storm:{title:L("私人小岛忽然从海面升空","YOUR PRIVATE ISLAND RISES INTO THE SKY"),
branches:[
L("晚宴主人宣布：这座岛不是房产，而是一艘隐藏了百年的飞行船。现在它终于要起飞了。","The host reveals the island is not land at all, but a flying ship hidden for a century. It's taking off."),
L("彩虹水幕背后是一座漂浮在云上的热带岛，你的私人岛屿正缓缓升到它旁边。","Behind the rainbow curtain floats a tropical island among the clouds. Your own island rises to meet it."),
L("鲸鱼将你送回海边。海岛突然拔地而起，露出底部的巨型螺旋桨——它一直是一艘飞船。","The whale brings you ashore. The island rises, revealing giant propellers beneath it. It's been a ship all along.")],
choices:[
[L("驾驶飞行岛冲上云层","Pilot the flying island into the clouds"),L("云端露出了另一片蓝色海洋。","Above the clouds lies another blue ocean.")],
[L("邀请所有朋友一起上船","Invite everyone aboard"),L("岛上的音乐响起，整座岛像游行花车一样穿过天空。","Music starts as the whole island sails through the sky.")],
[L("让岛屿降落，保护海里的朋友","Bring the island down for the ocean"),L("鲸鱼跃出水面，像在向你道谢。","The whale leaps from the sea, as if thanking you.")]]},
after:[L("你的私人小岛第一次有了真正的目的地。","For the first time, your island has a true destination."),L("朋友们从云端寄出了一张张不可思议的明信片。","Your friends send impossible postcards from the clouds."),L("整片海再次恢复平静，但你知道它藏着奇迹。","The ocean calms, but you know the miracle beneath it.")],
shock:L("整座岛飞起来了！","THE ISLAND TAKES FLIGHT!")},
swiss:{
bridge:{title:L("对面的旅客，是另一个你","THE PASSENGER ACROSS FROM YOU IS YOU"),
branches:[
L("餐车里坐着穿晚礼服的你。对方说自己选了最富有的人生，却一直想坐上这班列车逃走。","Across the dining car sits you in eveningwear: impossibly rich, yet desperate to escape this train."),
L("行李箱里的未来照片开始改变。每当你眨眼，就出现另一张不同人生的合照。","The future photo changes every time you blink, showing another version of your life."),
L("车窗里的倒影伸手敲玻璃。列车员说，那是另一条平行轨道上的你。","Your reflection knocks from the other side of the window. The conductor says it's you on a parallel track.")],
choices:[
[L("和另一个自己交换一小时","Trade lives with your other self for an hour"),L("你突然站在一座悬空的山顶舞厅里。","You find yourself in a ballroom suspended above a mountain.")],
[L("把所有人生照片拼成一张地图","Arrange the photos into a map"),L("地图指向一座不属于任何国家的车站。","The map points to a station in no country.")],
[L("请列车员带你去秘密车厢","Ask to see the secret carriage"),L("车厢门打开，里面竟是一整片夏日海滩。","The carriage opens onto an entire summer beach.")]]},
storm:{title:L("列车驶出隧道，铁轨悬在云上","THE TRACKS LEAVE THE MOUNTAIN"),
branches:[
L("舞厅的落地窗外不是雪山，而是无数条悬空铁轨，每条都载着不同人生的你。","Beyond the ballroom are countless floating tracks, each carrying another version of you."),
L("地图上的车站出现在云端，站牌写着：只允许带走一样东西。","The impossible station appears among the clouds. Its sign says: take only one thing."),
L("夏日海滩突然变成冰雪森林，整列火车穿过四季。终点站的钟正在倒转。","The summer beach shifts to snowy woods. The train passes through every season as the final clock runs backward.")],
choices:[
[L("跳上最不可思议的那条轨道","Leap onto the wildest track"),L("你看见一座漂浮着热气球的城市。","You glimpse a city drifting among hot-air balloons.")],
[L("带上一个珍贵的人继续走","Bring one precious person with you"),L("所有车厢的灯都变得温暖起来。","Every carriage light turns warm.")],
[L("别选了，自己造一条新的铁轨","Build a track of your own"),L("列车第一次开进了一片没有地图的星空。","For the first time, the train enters an unmapped sky.")]]},
after:[L("另一条轨道上的你朝你竖起大拇指。","Your other self gives you a thumbs-up from another track."),L("云端车站响起欢呼，你的旅程有了新的同行者。","The sky station cheers as new companions join you."),L("你听见列车长说：真正的目的地，是你敢不敢出发。","The conductor whispers: the real destination is having the courage to go.")],
shock:L("火车驶上云端轨道","THE TRAIN RIDES INTO THE CLOUDS")}
};
})();