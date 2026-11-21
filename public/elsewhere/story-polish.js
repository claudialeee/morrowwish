/* Elsewhere: authored situation-specific decisions for all eight dream lives.
   Loaded after the active casefiles and before dreams.js. Each finale
   now follows the actual route the player took. No generic mismatched
   character names, invented scenes, or arbitrary stat gating. */
(()=>{"use strict";
const L=(zh,en)=>[zh,en];
const variants={
paris:[
 [["把书店偶遇变成每周一次的约会","Turn your bookshop meeting into a weekly date"],["牵起诺亚的手，认真开始这段新恋情","Take Noa's hand and make your new romance official"],["带着共同拍的照片，约好去南法旅行","Plan a trip south with the photos you made together"]],
 [["约诺亚一起做一本塞纳河照片日记","Make a Seine photo diary with Noa"],["邀请诺亚再跳一支只属于你们的舞","Ask Noa for one more dance by the river"],["订下去尼斯的火车票，继续追逐日落","Book a train to Nice for another sunset"]],
 [["把今晚的照片留在你的露台私人影展","Hang tonight's portraits in your own rooftop gallery"],["摘下面具，告诉诺亚你想认真约会","Take off your mask and ask Noa for a real date"],["邀诺亚去海边办下一场小小假面舞会","Invite Noa to a seaside masquerade next weekend"]]
],
amalfi:[
 [["把这艘游艇变成你的私人海上早餐厅","Turn the yacht into your floating breakfast haven"],["邀请卢卡和主厨常常来船上共进晚餐","Make relaxed yacht dinners a new tradition with Luca and the chef"],["请卢卡带你去一座没有闹钟的小岛","Ask Luca to find an island without alarm clocks"]],
 [["为自己留一间永远开放的花园影院","Keep a private garden cinema just for you"],["每个夏夜都邀请朋友来柠檬树下看电影","Invite friends to movie nights beneath the lemon trees"],["把露天电影带到游艇上，边航行边看","Take your open-air cinema aboard the yacht"]],
 [["把小镇的海景餐桌变成你的专属老位置","Make the seaside restaurant your new favorite table"],["邀请新认识的邻居一起过每个夏天","Spend the summer with the new friends you made in town"],["沿着海岸继续寻找更好吃的柠檬甜点","Follow the coast in search of its best lemon desserts"]]
],
tokyo:[
 [["把现场歌声录成只属于自己的母带","Record a live master that belongs to you"],["让全场粉丝一起唱完整首副歌","Let the entire stadium sing the chorus with you"],["独立发行今晚的演唱会，不再依赖经纪公司","Release tonight's show independently of the label"]],
 [["让那份不公平的合同成为明日头条","Make the unfair contract tomorrow's headline"],["请整支乐队来到台前，和你一起谢幕","Bring the whole band center stage for the encore"],["带着乐队宣布下一场独立演唱会","Announce an independent show with your band"]],
 [["用真实歌声回应台上的虚拟替身","Outsing the digital double with your own voice"],["让台下十万人接过麦克风一起合唱","Let the crowd of 100,000 carry the chorus"],["把替身介绍成你的暖场节目，自己压轴","Turn the double into an opening act; headline yourself"]]
],
moon:[
 [["把最后一块环形蛋糕留给自己","Save the final orbit cake slice for yourself"],["把这场低重力舞会办成每年一次的传统","Make the low-gravity gala an annual tradition"],["带着主厨把银河蛋糕舞会开遍空间站","Take your space-cake gala on a station tour"]],
 [["在观景穹顶留一张永远的地球景观座位","Keep a private Earth-view seat in the observatory"],["邀请艾拉再来一次只有你们两人的观星约会","Invite Ella to another stargazing date"],["带上相册，和艾拉去看下一颗星球","Travel to another planet with Ella and your photo album"]],
 [["把月球的温暖沙滩包成私人度假角","Keep the lunar beach as your personal getaway"],["邀请朋友每年来一次飘飘泡泡派对","Throw an annual floating-bubble party for friends"],["把这片人工沙滩搬进下一座太空酒店","Build an artificial beach at your next space hotel"]]
],
monday:[
 [["买下云朵公交的永久靠窗座位","Claim a permanent window seat on the cloud bus"],["让全城的小朋友都免费坐云朵公交","Let the whole city ride the cloud buses for free"],["让天空咖啡馆成为每年必开的星期一庆典","Make the sky café an annual Monday tradition"]],
 [["要一张橘猫主播的亲笔签名照","Ask the orange-cat host for an autograph"],["约动物们明年再办一场脱口秀","Reunite the animal talk-show crew next year"],["让橘猫拥有自己的永久广播电台","Give the orange cat a radio station of its own"]],
 [["收藏提拉米苏最后唱出的那段高音","Record the tiramisu's final high note"],["让全城一起分享这场甜点音乐会的蛋糕","Share the concert cake with the whole city"],["把荒诞的甜点歌剧办成年度节日","Turn the dessert opera into an annual festival"]]
],
maldives:[
 [["把海底餐厅留作独享蓝光的秘密座位","Keep a private seat for the underwater blue glow"],["邀朋友在海底玻璃墙前听一场鲸歌音乐会","Invite friends to a whale-song listening party"],["请船长带你去追另一片发蓝光的海域","Sail toward another sea that glows blue"]],
 [["留一场只为自己绽放的海上灯光秀","Save a private ocean light show for yourself"],["让三千架无人机为你的朋友跳舞","Make 3,000 drones dance for your friends"],["把浮岛变成巡回海上派对，继续开航","Turn the floating island into a traveling party"]],
 [["把粉色沙洲记进只有你知道的私人海图","Mark the pink sandbar on your secret chart"],["请朋友们一起看海面发光的银河","Bring friends to watch the ocean's glowing galaxy"],["让船长继续寻找地图上不存在的颜色","Ask the captain to hunt for a color missing from maps"]]
],
iceland:[
 [["把极光温泉之夜留在私人明信片里","Keep your aurora hot-spring night on a postcard"],["在温泉边约阿里下次继续追极光","Plan another aurora night with Ari"],["和阿里去下一处更北边的极光山谷","Travel north to another aurora valley with Ari"]],
 [["把望远镜旁的小小观景台当作私人秘密","Keep the mountaintop telescope as your secret retreat"],["把那颗星星旁的心愿告诉同伴","Share your wish beside the telescope"],["带着山顶拍的照片继续向北追光","Keep chasing the lights with your mountaintop photos"]],
 [["把祖母的信和极光投影收藏在玻璃屋","Keep the letter and aurora projection in your cabin"],["和一起看投影的人约定明年重逢","Arrange a reunion with your fellow aurora watcher"],["带着祖母留下的光影作品环游世界","Travel with the light artwork inspired by the letter"]]
],
swiss:[
 [["把今晚的巧克力王冠留在自己的车厢","Keep the chocolate crown in your private suite"],["邀请整节舞会车厢一起举行滑稽加冕礼","Invite the whole carriage to a ridiculous coronation"],["让王冠舞会跟着列车去其他城市巡演","Take the crown masquerade on tour"]],
 [["把玻璃温室留作你的云端秘密花园","Keep the mountaintop greenhouse as your private garden"],["邀请旅伴一起分享雪山的暖心灯光秀","Share a warm mountain light show with friends"],["请车长设计下一趟穿过花海的路线","Ask the conductor for a journey through alpine flowers"]],
 [["要一张进入夏日车厢的终身门票","Keep a lifetime pass to the summer carriage"],["让全车厢一起再过一次冬日夏季派对","Throw another winter-summer party for the whole train"],["和舞台师设计一条会变换四季的奇幻列车","Design a train that changes seasons with the stage artist"]]
]
};
const prompts={
paris:{
 intro:["你的巴黎第一天，想从哪里邂逅惊喜？","Where will your first Paris surprise begin?"],
 paths:[
 [["诺亚就在你面前，怎么开启这场新邂逅？","How will you break the ice with Noa?"],["雨落下来了，你想和诺亚留下什么回忆？","What memory will you make together in the rain?"],["这张新照片，要成为你们怎样的约定？","What promise will this photograph hold?"]],
 [["你和诺亚刚在船上认识，先做什么？","You've just met Noa aboard. What now?"],["音乐与灯光就在河边，你怎么享受这一刻？","How will you enjoy the lights and music together?"],["短片放完了，你想给明天留下什么期待？","The film ends. What will you plan for tomorrow?"]],
 [["诺亚向你举起相机，怎样接住这份心动？","Noa raises the camera. How do you respond?"],["午夜放映快开始了，你想一起做什么？","The midnight screening is near. What will you do?"],["照片放映结束了，你想怎么回应诺亚？","The screening ends. What will you say to Noa?"]]
 ],
 finale:["巴黎夜色正好，下一段浪漫由你选择。","Paris glows at midnight. Where will this love go?"]
},
amalfi:{
 intro:["没有工作日程，今天的第一份快乐是什么？","No schedule today. What's your first indulgence?"],
 paths:[
 [["甲板、海风、早餐都归你，先享受哪样？","The yacht is yours. How will you enjoy it?"],["小海湾里的午餐，想怎样过得更尽兴？","How will you enjoy lunch in the hidden bay?"],["夕阳落下了，还想为自己安排什么？","The sun is setting. What's your next delight?"]],
 [["主厨正等你点菜，想怎样度过这个假日？","Your chef awaits. What kind of afternoon?"],["发现秘密花园后，你最想做什么？","You found the hidden garden. What next?"],["星空电影院开场，你想把位置留给谁？","The outdoor cinema opens. Who gets a seat?"]],
 [["柠檬甜点和陶器就在面前，先选什么？","Desserts and ceramics await. Where first?"],["海景餐厅已经找到，想怎么享受？","You've found the hidden restaurant. What now?"],["乐队为你演奏，想怎么留下这份快乐？","The band plays for you. How will you celebrate?"]]
 ],
 finale:["这一天还没结束，你想让哪份快乐继续？","Which part of your dream holiday should continue?"]
},
moon:{
 intro:["你拥有整座月球酒店，先玩什么？","You own the Moon hotel. What's your first treat?"],
 paths:[
 [["杯子都飘起来了，这顿晚宴怎么玩？","The glasses float. How will you celebrate?"],["环形蛋糕登场，谁来享受这份离谱甜蜜？","The orbit cake arrives. What's the plan?"],["月球舞会的最后一刻，由你来决定。","The lunar gala is ending. Your grand finale?"]],
 [["地球就在窗外，你想怎样看这场景？","Earth fills the window. How will you enjoy it?"],["特别放映开始，你要留住哪个瞬间？","The private screening starts. What will you save?"],["艾拉就在旁边，你想怎样续写这次约会？","Ella is here. What will you do next?"]],
 [["没有海的沙滩上，先来玩什么？","A beach without an ocean. What will you try?"],["泡泡舞池开放了，你会怎么加入？","The bubble dance floor opens. How will you join?"],["午夜的人工海滩，你想怎样收尾？","Midnight on a fake beach. What's the finale?"]]
 ],
 finale:["这家月球酒店，下一次惊喜由你决定。","You own this hotel. What's its next surprise?"]
},
monday:{
 intro:["买下星期一以后，先施哪一个荒诞魔法？","You bought Monday. Which ridiculous spell first?"],
 paths:[
 [["云朵公交来了，你想怎样坐这一班？","The cloud bus arrives. How will you ride?"],["天空咖啡馆藏在云朵上，先点什么？","A café floats overhead. What's your order?"],["全城等你的云朵巡游，怎么玩？","The city awaits your cloud parade. What's next?"]],
 [["橘猫主持人开口了，你想问什么？","The orange-cat host speaks. What's your move?"],["动物电台电话打来了，你怎么接招？","The animal radio receives a call. How do you answer?"],["动物颁奖礼就要开始了，你要颁什么奖？","The animal awards begin. What's the prize?"]],
 [["提拉米苏唱起歌，你想先做什么？","The tiramisu sings. What will you do?"],["甜点演唱会开场，你想安排什么节目？","The dessert concert starts. What's your act?"],["甜点的告别曲响起，你想如何谢幕？","The dessert farewell plays. How will you end it?"]]
 ],
 finale:["荒诞的一天快结束了，快乐怎么留下？","Your absurd day is ending. How will it live on?"]
}
};
Object.assign(prompts,{
maldives:{
 intro:["私人浮岛的一天开始了，你要先享受什么？","You own a floating island. What's your first adventure?"],
 paths:[
 [["玻璃墙外都是鱼，你想怎么享用这一餐？","Fish circle the glass. How will you enjoy dinner?"],["巨鲸就在窗外，你想留住什么瞬间？","A whale swims past. What will you do?"],["蓝光围住餐厅，怎么回应这场奇迹？","Blue light surrounds the restaurant. Your move?"]],
 [["朋友们都登岛了，先怎么招待大家？","Your friends arrive. How will you welcome them?"],["海上的礼物竟这么离谱，你想怎么玩？","The captain's gift is wild. What's next?"],["三千个灯光点亮天空，你想许什么愿？","Three thousand lights appear. What will you celebrate?"]],
 [["粉色沙洲就在船边，先去哪里？","A pink sandbar appears. Where first?"],["研究员说今夜有奇迹，你想怎么看？","A natural wonder is coming. How will you watch?"],["海底的银河亮起，你想怎样记住它？","The reef glows like a galaxy. What will you do?"]]
 ],
 finale:["整座浮岛都是你的，下一站去哪里？","The island is yours. Where will it sail next?"]
},
iceland:{
 intro:["极光就在头顶，你的第一站是哪里？","The aurora is overhead. Where will you begin?"],
 paths:[
 [["温泉和星空都在眼前，你先做什么？","Warm water, cold stars. What's your first move?"],["灯笼队伍走来了，你想怎么加入？","A lantern procession arrives. How will you join?"],["极光变亮，你想和阿里留下什么？","The aurora brightens. What memory with Ari?"]],
 [["山顶已经到了，你想看哪边？","You've reached the summit. Where will you look?"],["发现一架望远镜，你想寻找什么？","There's a telescope. What will you look for?"],["山谷像波浪一样发光，你怎么庆祝？","The valley glows. How will you celebrate?"]],
 [["玻璃屋里星光闪烁，你先做什么？","The glass cabin glimmers. What's next?"],["发现祖母的信，你想如何回应？","You discover a letter. How will you respond?"],["光影与极光同框，你想留住哪部分？","The aurora meets the projections. What will you keep?"]]
 ],
 finale:["天亮之前，带哪份极光记忆走？","Dawn is near. Which aurora memory will you keep?"]
},
swiss:{
 intro:["列车已经启程，你先体验哪份奢华？","The luxury train departs. Where will you begin?"],
 paths:[
 [["舞会车厢变成星空，你想先玩什么？","The ballroom becomes a star field. Your move?"],["甜点车推来王冠，你想怎么戴？","The dessert crown arrives. What will you do?"],["你成了加冕主角，要怎么谢幕？","You're tonight's guest of honor. Your finale?"]],
 [["缆车升到云上，你想先看什么？","The cable car climbs above the clouds. What next?"],["玻璃温室藏在山顶，你想做什么？","A greenhouse sits at the summit. Your move?"],["私人灯光秀开始，你想邀请谁？","The private light show begins. Who will you invite?"]],
 [["车厢里竟有沙滩，你想先体验什么？","There's a beach aboard. What will you try?"],["天气遥控器到手，你要按哪个按钮？","You have the weather remote. What's your choice?"],["全车厢都在等许愿，你想实现什么？","Everyone awaits your wish. What will you do?"]]
 ],
 finale:["列车到站了，你想留下怎样的传说？","The train arrives. What legend will you leave?"]
},
tokyo:{
 intro:["今晚你是巨星，先从哪里夺回舞台？","Tonight you're a star. Where will you take control?"],
 paths:[
 [["真唱与舞台都在手里，你要先做什么？","The live stage is yours. How will you use it?"],["经纪公司想抢走成果，你怎么回应？","The label wants control. Your move?"],["十万人正在看你，最后要怎样压轴？","A hundred thousand fans watch. Your grand finale?"]],
 [["合同被拿出来了，你会怎么处理？","The contract is on the table. What will you do?"],["乐队和你站在一起，下一步怎么走？","The band stands with you. What's next?"],["今晚就是你的舞台，想怎样赢下掌声？","The stage belongs to you. How will you finish?"]],
 [["虚拟替身登台，你想如何接招？","The digital double takes the stage. Your response?"],["粉丝听见两种声音，你要证明什么？","Two voices fill the arena. What's your move?"],["压轴时刻到了，你决定如何亮相？","It's showtime. How will you headline?"]]
 ],
 finale:["这场演唱会属于你，接下来呢？","Tonight's show is yours. What happens next?"]
}
});
for(const [id,routeTitles] of Object.entries(variants)){
 const world=window.ELSEWHERE_CASEFILES?.[id];
 if(!world||!Array.isArray(world.paths)||world.paths.length!==3)throw Error("Elsewhere story missing routes: "+id);
 if(!Array.isArray(world.finale?.choices)||world.finale.choices.length!==3)throw Error("Elsewhere story missing final choices: "+id);
 world.finale.routeChoices=routeTitles.map((choices,r)=>choices.map(([zh,en],i)=>{
  const base=world.finale.choices[i];
  // Maintain original ending category while making actual choices specific to this route.
  return {title:L(zh,en),result:base.result,gain:base.gain};
 }));
 if(world.finale.routeChoices.some(route=>route.length!==3))throw Error("Invalid route-specific ending choices "+id);
 const p=prompts[id];
 if(p){
  world.intro.prompt=L(...p.intro);
  world.finale.prompt=L(...p.finale);
  for(let r=0;r<3;r++)for(let stage=0;stage<3;stage++)
   world.paths[r][stage].prompt=L(...p.paths[r][stage]);
 }
}

// Important payoffs change WITH the specific route instead of mentioning a
// character, ship, or invitation the player never encountered.
const payoffs={
 amalfi:{
  1:{2:L("管家和主厨开心地把银幕搬上你的游艇，海风成了新配乐。","Your housekeeper and chef carry the screen onto your yacht. The sea breeze becomes the soundtrack.")},
  2:{2:L("小镇店主在餐巾纸上为你画了十家最好吃的柠檬甜点店。","The owner draws ten favorite lemon-pastry stops on your napkin.")}
 },
 moon:{
  1:{1:L("艾拉立刻约好下一次约会，问你想看哪颗星星。","Ella eagerly sets another stargazing date and asks which stars to watch."),2:L("艾拉为你们挑好第一站，还答应带上今晚的合照。","Ella picks your first destination and promises to bring tonight's photos.")},
  2:{2:L("经理帮你量好沙滩模型，准备把这份夏天装上下一班飞船。","The manager measures the beach set for your next station's summer escape.")}
 },
 monday:{
  1:{0:L("橘猫高傲地在你的照片上按下一枚肉垫签名。","The orange-cat host stamps your photograph with a very proud paw print."),1:L("动物们把下一次脱口秀的日期写满了市政日历。","The animals crowd around to mark their reunion on the calendar."),2:L("橘猫宣布它的新节目从明天早晨七点开播。","The orange cat announces a permanent morning radio show.")},
  2:{0:L("录音师把提拉米苏的绝唱压成黑胶，唱片封面还带巧克力香。","The final tiramisu aria becomes a record with a chocolate-scented cover."),1:L("整条甜点街摆出共享蛋糕，连糖霜都不舍得错过。","The dessert street offers enough farewell cake to share with everyone."),2:L("市长宣布甜点歌剧节从此成为童话城的年度节日。","The mayor declares dessert opera an annual citywide holiday.")}
 },
 iceland:{
  1:{1:L("和你并肩看星星的人轻轻说：下次，还坐在这里。","Your fellow stargazer whispers: same telescope, next time."),2:L("观景台管理员给你标出另一座能看见极光的山峰。","The observatory guide marks another aurora summit on your map.")},
  2:{1:L("一同观看光影的人和你约好明年还回玻璃屋相见。","Your fellow viewer arranges to meet you at the glass cabin next year."),2:L("策展人为你装好祖母留下的影像作品，下一站是你的新旅途。","The curator packs the artwork inspired by the letter for your next journey.")}
 }
};
for(const [id,routes] of Object.entries(payoffs))for(const [route,choices] of Object.entries(routes))
 for(const [choice,reply] of Object.entries(choices))
  window.ELSEWHERE_CASEFILES[id].finale.routeChoices[Number(route)][Number(choice)].result=reply;
// Distinct scene bodies for genuinely different Paris actions: a shared
// umbrella does not magically become a studio portrait, and a terrace
// visit does not mysteriously become a bookshop meeting.
const parisBook=window.ELSEWHERE_CASEFILES.paris.paths[0][2];
parisBook.bodyByPrior=[
 parisBook.body,
 L("你和诺亚共撑一把伞走过雨巷，边走边聊，聊到笑得停不下来。雨停后，诺亚邀请你到暗房看看今天的底片。两个人的笑容，比任何摆拍都更好看。","After sharing an umbrella through the rainy lane, you and Noa laugh at stories you never expected to tell a stranger. When the rain stops, Noa invites you to look at the day's photographs. Your laughter makes every image brighter."),
 L("诺亚站在你家的露台边，拍下刚放晴的塞纳河与晚霞，还悄悄把你在窗边的背影拍了进去。傍晚，诺亚带着新冲洗的照片来找你。","From your terrace, Noa photographs the Seine after the rain and catches you smiling by the window. At dusk, Noa returns with the fresh prints.")
];

})();