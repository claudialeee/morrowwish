/* Elsewhere — dream lives. Standalone, bilingual, illustrated micro-adventures. */
(()=>{"use strict";
const L=(zh,en)=>[zh,en];
const WORLDS=[
{id:"amalfi",place:L("意大利 · 阿马尔菲","ITALY · AMALFI"),name:L("醒来，拥有一座海边别墅","You wake up owning a seaside villa"),tag:L("财富与自由","LUXURY & FREEDOM"),tease:L("无边泳池、私人游艇，还有一把不属于你的钥匙。","A private yacht, an infinity pool, and a key that isn't yours."),color:"#cf7c51",secret:L("藏在柠檬树下的银钥匙","A silver key beneath the lemon tree"),
 acts:[
 {title:L("第一天，你拥有一切","DAY ONE: YOU HAVE EVERYTHING"),body:L("管家递来游艇钥匙：今天没有行程，没有人催你。","Your butler hands you the yacht keys. Nothing is scheduled."),choices:[
 [L("开船去无人海湾","Sail to a hidden cove"),L("沙滩上有一张写着你名字的旧明信片。","An old postcard on the beach bears your name.")],
 [L("办一场盛大的露台派对","Throw a spectacular terrace party"),L("最后一位客人留下一把金钥匙。","The last guest leaves a golden key.")],
 [L("什么都不做，只看日落","Do nothing but watch the sunset"),L("海上的陌生帆船，为你亮起灯。","A strange sailboat turns on its lights for you.")]]},
 {title:L("这不是普通的假期","THIS ISN'T AN ORDINARY HOLIDAY"),twists:[
 L("那张明信片来自明天，落款竟然是你自己。","The postcard is dated tomorrow. It's signed by you."),
 L("金钥匙打开一扇暗门，里面有另一份遗嘱。","The key opens a secret room with a second will."),
 L("帆船送来一封信：日落前，选好真正想要的生活。","The boat delivers a note: choose your real life before sunset.")],
 choices:[
 [L("解开这座别墅的秘密","Uncover the villa's secret"),L("你发现了通往一座私人小岛的航线。","You find a route to a private island.")],
 [L("先享受，再说其他","Live extravagantly while you can"),L("你把整座海岸的灯光都请到了晚宴上。","You fill the coast with the lights of your party.")],
 [L("带一个陌生人一起冒险","Take a stranger on an adventure"),L("一个人告诉你：这里其实不必属于谁。","Someone tells you this place needn't belong to anyone.")]]},
 {title:L("最后一场日落","ONE LAST SUNSET"),turns:[
 L("海面出现一条发光的航线，尽头是一座地图上不存在的岛。","A glowing sea route leads to an island on no map."),
 L("晚宴上所有人突然安静下来，等你说出真正的愿望。","The guests go quiet. They're waiting for your real wish."),
 L("你可以把钥匙留给一个人，也可以把整片海还给自己。","You could give someone the key—or keep the horizon for yourself.")],
 choices:[
 [L("追着光，驶向未知","Follow the light into the unknown"),L("你的第一段真正自由的航程开始了。","Your first truly free voyage begins.")],
 [L("把今晚变成传奇","Make this night legendary"),L("你让整座海岸记住了这场派对。","The whole coast remembers your party.")],
 [L("留下钥匙，和喜欢的人出发","Leave the keys and leave together"),L("你终于明白，有些浪漫不需要房产证。","Some kinds of romance don't need a deed.")]]}],
 endings:[
 [L("永远的第一张船票","A Ticket to Everywhere"),L("你拥有的不再只是一座别墅，而是想去哪里的自由。","You trade one extraordinary address for a world of destinations.")],
 [L("阿马尔菲的传说","The Amalfi Legend"),L("人们多年后还会谈起那晚，而你永远是故事的主人公。","Years later, they still talk about your impossible party.")],
 [L("比海景更珍贵","Something Better Than a View"),L("你放下豪宅，却找到了愿意一起看遍日落的人。","You leave the villa and find someone to chase sunsets with.")]],
 rare:[L("你继承了整个夏天","The Summer That Stayed"),L("银钥匙打开的不是房门，而是一封邀请：想回来时，夏天随时为你重开。","The silver key unlocks a promise: summer will be here whenever you return.")]},
{id:"paris",place:L("法国 · 巴黎","FRANCE · PARIS"),name:L("在巴黎，谈一场电影般的恋爱","A cinematic love story in Paris"),tag:L("浪漫与心动","ROMANCE"),tease:L("花店、天台与午夜十二点前的一次大胆决定。","Roses, rooftops, and one brave decision before midnight."),color:"#be7591",secret:L("藏在咖啡杯底的手写号码","A handwritten number under your coffee"),
 acts:[
 {title:L("巴黎今夜只属于你","PARIS IS YOURS TONIGHT"),body:L("你住进蒙马特的顶楼，桌上躺着一张写着「今晚见」的明信片。","You wake in a Montmartre penthouse. A postcard says: 'See you tonight.'"),choices:[
 [L("穿上最好看的衣服赴约","Dress up and show up"),L("咖啡馆有一张桌子为你留着。","A table at the café is waiting for you.")],
 [L("拿着明信片寻找寄信人","Find the postcard's sender"),L("你沿着玫瑰花瓣走到了一家唱片店。","A trail of rose petals leads to a record shop.")],
 [L("骑单车，随心所欲逛巴黎","Explore Paris on a bicycle"),L("转过街角，你撞见了一个熟悉的背影。","Around a corner, you glimpse a strangely familiar figure.")]]},
 {title:L("一封不可能的情书","AN IMPOSSIBLE LOVE LETTER"),twists:[
 L("约会对象说：我们曾在十年后的巴黎见过。","Your date claims you met in Paris ten years from now."),
 L("唱片店播放的歌，是你还没写出来的情歌。","The song playing is one you haven't written yet."),
 L("那个背影转过头，竟拿着你未来的合照。","The stranger turns, holding a photo of your future together.")],
 choices:[
 [L("相信这场荒唐的缘分","Believe in impossible fate"),L("对方带你去看一处不对外开放的天台。","You're invited onto a secret rooftop.")],
 [L("先问清楚真相","Demand the truth first"),L("你得到一份只写着午夜时间的地址。","You're handed an address marked midnight.")],
 [L("把故事改写成自己的","Rewrite the script yourself"),L("你拉起对方的手，跑进了雨中的巴黎。","You take their hand and run into rainy Paris.")]]},
 {title:L("午夜之前","BEFORE MIDNIGHT"),turns:[
 L("天台上的最后一盏灯亮了，你们只能许下一个愿望。","One rooftop light comes on. You can make only one wish."),
 L("塞纳河畔的钟开始敲响，真相和心动只能选一个。","The Seine's bells ring. Truth and romance pull in different directions."),
 L("雨停了，空荡荡的街道等着你们决定下一站。","The rain stops. An empty boulevard waits for your next move.")],
 choices:[
 [L("勇敢告白","Say how you feel"),L("你说出了从前不敢说的那句话。","You say the words you've always held back.")],
 [L("一起消失在巴黎的夜里","Disappear into the Paris night"),L("两张火车票，目的地留白。","Two train tickets, destination blank.")],
 [L("留下来，把浪漫过成日常","Stay and make this your everyday"),L("第二天，咖啡馆多了两只熟悉的杯子。","The café saves two cups for tomorrow.")]]}],
 endings:[
 [L("爱在午夜降临","Love Arrives at Midnight"),L("你没有保证永远，但这一刻你终于选择了心动。","You can't promise forever. You can choose this moment.")],
 [L("私奔去世界尽头","The Great Escape"),L("巴黎是故事的第一站，你们连下一张车票都不想提前买。","Paris is only chapter one. No return ticket required.")],
 [L("住在玫瑰花开的街角","A Life Full of Roses"),L("电影不会在接吻之后结束。你们喜欢的，是每天的续集。","The movie doesn't end with a kiss. You love the everyday sequel.")]],
 rare:[L("写给十年后的你","A Letter From Ten Years Ahead"),L("那个号码打通后，接电话的是十年后的你：别害怕，幸福是真的。","You call the number. Your future self answers: don't be afraid—it's real.")]},
{id:"tokyo",place:L("日本 · 东京","JAPAN · TOKYO"),name:L("今晚，你是世界级巨星","Tonight, you're a global superstar"),tag:L("名气与冒险","FAME & REBELLION"),tease:L("十万人在等你登台，后台却出现了另一份歌单。","A stadium awaits. Someone has switched your setlist."),color:"#8e70c8",secret:L("藏在后台镜子上的星形贴纸","A star sticker on your dressing mirror"),
 acts:[
 {title:L("十万人在喊你的名字","A HUNDRED THOUSAND VOICES"),body:L("东京巨蛋，倒计时三十秒。经纪人说：千万别唱那首歌。","Tokyo Dome. Thirty seconds to showtime. Your manager bans one song."),choices:[
 [L("照着剧本完美登场","Deliver the perfect show"),L("舞台升起，尖叫声盖过了心跳。","The stage rises above a wave of screams.")],
 [L("直接唱那首禁歌","Sing the forbidden song"),L("第一句歌词响起，后台所有人都愣住了。","Your first lyric stuns everyone backstage.")],
 [L("邀请一位粉丝合唱","Bring a fan on stage"),L("被选中的粉丝竟比你还懂这首歌。","The chosen fan knows every word—even the lost verse.")]]},
 {title:L("演唱会突然失控","THE SHOW GOES OFF-SCRIPT"),twists:[
 L("巨幕出现一段你从没拍过的纪录片，观众屏住呼吸。","The big screen plays a documentary you never filmed."),
 L("全场忽然跟着你唱起经纪公司删掉的歌词。","The stadium sings the lyrics your label erased."),
 L("那位粉丝递来耳返：有人想在今晚夺走你的声音。","The fan whispers: someone plans to steal your voice tonight.")],
 choices:[
 [L("当着所有人公开秘密","Tell the whole stadium"),L("灯光灭了一秒，然后十万人为你鼓掌。","The lights cut out. Then the stadium cheers for you.")],
 [L("跟幕后老板正面对决","Confront the people in control"),L("你走向后台，第一次把话筒握在自己手里。","For once, you hold the microphone on your terms.")],
 [L("抛下剧本，开一场即兴秀","Throw away the script"),L("乐队跟上节奏，今晚变得不可复制。","The band follows. The show becomes one of a kind.")]]},
 {title:L("最后一首歌，唱给谁","WHO GETS YOUR ENCORE?"),turns:[
 L("歌声停下，数万只手举着手机，等你的最后一句话。","Thousands of lights rise, waiting for your last words."),
 L("公司递来一份天价合同：签字，就不能再唱自己的歌。","A fortune is offered—if you give up your own songs."),
 L("巨幕上的倒计时归零。现在，没有任何人能告诉你怎么做。","The countdown hits zero. Nobody gets to tell you what to do.")],
 choices:[
 [L("宣布独立，夺回自己的人生","Go independent, take back your life"),L("你把麦克风交给乐队，走向真正的自由。","You take ownership of your music.")],
 [L("让今夜成为史上最疯狂的演出","Make it the wildest show ever"),L("烟花从体育馆上空绽放，震撼所有人。","Fireworks explode above the stadium.")],
 [L("摘下明星面具，去过普通日子","Disappear and live anonymously"),L("你戴上帽子，坐上了最后一班地铁。","You pull on a cap and board the last train.")]]}],
 endings:[
 [L("你的名字，你的音乐","The Music Is Yours"),L("没有人再能替你决定唱什么。下一张专辑，你会自己命名。","Nobody gets to choose your songs. Your next album is yours.")],
 [L("东京最耀眼的夜晚","A Night That Shook Tokyo"),L("这场演唱会成为传奇。所有人都说，没人能复制你的疯狂。","The concert becomes legend, impossible to reproduce.")],
 [L("消失的超级巨星","The Superstar Who Vanished"),L("你拥有过全世界的掌声，现在最奢侈的是没人认出你。","You had the world's applause. Now anonymity is a luxury.")]],
 rare:[L("写给未来的安可","The Secret Encore"),L("星形贴纸后是一卷老录音：那首禁歌本就属于你。今夜，音乐回家了。","Behind the star is proof the forbidden song was always yours.")]},
{id:"iceland",place:L("冰岛 · 极光之夜","ICELAND · NORTHERN LIGHTS"),name:L("在极光下，实现一个愿望","One wish beneath the northern lights"),tag:L("奇迹与探险","MAGIC & ADVENTURE"),tease:L("玻璃小屋、热泉与一个据说能实现愿望的夜晚。","A glass cabin, a hot spring, and one night when wishes may work."),color:"#568f99",secret:L("藏在雪地里的蓝色星石","A blue starstone in the snow"),
 acts:[
 {title:L("整个天空为你亮起","THE SKY LIGHTS UP FOR YOU"),body:L("你躺在冰岛玻璃小屋里。极光出现时，桌上的旧指南针突然旋转。","In an Icelandic glass cabin, an antique compass spins as the aurora appears."),choices:[
 [L("冲出去追极光","Chase the lights"),L("你发现雪上有一串发亮的脚印。","Glowing footprints appear in the snow.")],
 [L("泡进露天温泉，看星星","Watch the sky from a hot spring"),L("水面浮上一只装着纸条的小瓶子。","A tiny message bottle surfaces beside you.")],
 [L("乘雪地摩托去冰川","Ride out to the glacier"),L("冰缝里传来一阵遥远又熟悉的歌声。","A familiar song echoes through the glacier.")]]},
 {title:L("北极光给出的选择","A MESSAGE IN THE AURORA"),twists:[
 L("脚印的尽头站着明天的你，正向你挥手。","At the end of the footprints stands tomorrow's you."),
 L("瓶中纸条写着：你可以找回一个失去的瞬间。","The note promises you one moment from your past."),
 L("歌声的主人说：今晚能让世界暂停一小时。","A traveler says you can stop time for one hour.")],
 choices:[
 [L("大胆许一个不可能的愿","Make an impossible wish"),L("天空亮得像白昼，你听到了自己的答案。","The sky flares bright as day.")],
 [L("去追问奇迹的真相","Find out how the magic works"),L("你发现了埋在冰雪下的古老观测站。","You discover an ancient observatory under the ice.")],
 [L("把愿望送给需要的人","Give your wish to someone else"),L("极光从绿色变成金色，像在回答你。","The aurora turns gold, as if answering.")]]},
 {title:L("天亮以后，奇迹会消失","THE MAGIC ENDS AT DAWN"),turns:[
 L("黎明的第一缕光出现，你只剩最后一次许愿机会。","The first dawn light rises. One wish remains."),
 L("观测站的门打开，里面有一张通往未知世界的地图。","The observatory reveals a map to a world nobody knows."),
 L("你的愿望让整片天空都变亮了，陌生人等你决定最后一件事。","The sky glows brighter. A stranger asks for your final decision.")],
 choices:[
 [L("把时间留给自己","Keep a moment just for yourself"),L("世界安静下来，幸福终于不是匆忙的事。","The world goes quiet. Happiness doesn't have to hurry.")],
 [L("跟随极光去世界尽头","Follow the aurora beyond the map"),L("你跨进了从未有人抵达的黎明。","You step into a dawn nobody has ever seen.")],
 [L("让奇迹留给所有人","Let everyone share the magic"),L("整个小镇今夜都看见了从未见过的星光。","The whole village sees a sky full of impossible stars.")]]}],
 endings:[
 [L("偷来的一小时","One Extra Hour"),L("你不再想把每分钟填满。只想慢慢过完这一刻。","You discover that one unhurried hour can be a whole life.")],
 [L("极光尽头的旅行者","Beyond the Northern Lights"),L("你找到一条只在极光下出现的路，世界从此没有边界。","You find a path that appears only beneath the aurora.")],
 [L("全世界的流星雨","A Sky for Everyone"),L("这次奇迹不再属于你一个人。你的愿望让所有人抬头。","Your wish gives the whole world one unforgettable night.")]],
 rare:[L("极光记得你的名字","The Aurora Knows Your Name"),L("蓝色星石让你保留了一个愿望。往后的每个平凡夜晚，都会有光。","The starstone saves one wish for every ordinary night to come.")]},
{id:"maldives",place:L("马尔代夫 · 私人海岛","MALDIVES · PRIVATE ISLAND"),name:L("突然继承一座私人小岛","You inherit a private island"),tag:L("躺平与惊喜","PARADISE"),tease:L("水上别墅、透明海水，以及海底一封奇怪的邀请。","An overwater villa, turquoise sea, and a message beneath the reef."),color:"#4c9e9b",secret:L("海星旁的珍珠贝壳","A pearl shell beside the starfish"),
 acts:[
 {title:L("起床，就是海上天堂","YOU WAKE IN PARADISE"),body:L("你醒在水上别墅。律师留下信：整座小岛现在是你的。","You wake in an overwater villa. A letter says the island is yours."),choices:[
 [L("跳进海里，和海龟潜水","Dive with the sea turtles"),L("海底珊瑚之间夹着一只密封的玻璃瓶。","A sealed bottle waits beneath the reef.")],
 [L("邀请好友开海岛狂欢派对","Invite friends for an island party"),L("所有客人都到了，唯独送信的人没出现。","Everyone arrives—except the person who sent the letter.")],
 [L("独享漂浮早餐和无边泳池","Enjoy a floating breakfast in peace"),L("泳池底部出现了一条隐藏的海底通道。","A hidden passage appears beneath your pool.")]]},
 {title:L("海底藏着另一座岛","THE ISLAND BENEATH THE ISLAND"),twists:[
 L("瓶子里的地图指向附近一座潮汐才会露出的秘密岛。","The bottle maps an island that appears only at low tide."),
 L("派对开始时，整个岛的灯同时变成了蓝色。","As the party begins, every island light turns blue."),
 L("通道尽头是一间能看见海底鲸鱼的旧观景室。","The passage leads to a forgotten whale-watching room.")],
 choices:[
 [L("驾驶快艇去寻找秘密","Take a speedboat to investigate"),L("你看见了世界上最安静的私人沙滩。","You discover a beach untouched by anyone.")],
 [L("带所有朋友一起寻找","Take everyone on the adventure"),L("一整船的人笑着冲向一座没人标记的岛。","You all race toward an unmarked island.")],
 [L("暂时保守秘密，一个人看看","Keep the discovery to yourself"),L("你发现了一件只属于这座岛的宝物。","You find something precious hidden in plain sight.")]]},
 {title:L("天堂的真正主人","WHO REALLY OWNS PARADISE?"),turns:[
 L("潮水将要上涨，秘密岛只剩最后一个小时。","The tide rises. You have one hour left on the secret island."),
 L("朋友们要为这场冒险取名。你却突然想永远留在这里。","Your friends want to name the adventure. You want to stay forever."),
 L("宝物是一封未寄出的信：真正的快乐不必拥有。","The treasure is an unsent letter: joy isn't something to own.")],
 choices:[
 [L("把秘密留给自己，悠闲过一生","Keep this paradise a private secret"),L("你决定让日落和海风成为日常。","You make sunsets and sea breezes your everyday life.")],
 [L("举办世界上最快乐的海岛节","Host the happiest island festival"),L("海滩上亮起了比星星还多的灯。","The beach shines brighter than the stars.")],
 [L("交出岛屿，去下一站冒险","Give up the island and keep exploring"),L("你背起一只小包，跳上远航的船。","You board the next boat with one small bag.")]]}],
 endings:[
 [L("每天都是假期","Every Day Is a Holiday"),L("小岛没有周一。你终于可以跟着潮汐决定一天怎么过。","Your island has no Mondays. The tide sets your schedule.")],
 [L("世界上最快乐的岛","The Happiest Island on Earth"),L("没人记得派对的预算，只记得海上那个发光的晚上。","Nobody remembers the budget, only the luminous night.")],
 [L("拥有世界的人","Rich in the Whole World"),L("你曾拥有一整座岛，最后发现自由比所有权更大。","You owned an island. Freedom turned out to be bigger.")]],
 rare:[L("海洋送给你的秘密","A Gift From the Ocean"),L("珍珠里的微小地图告诉你：世界上还有六座等待被发现的小岛。","Inside the pearl is a map of six more islands waiting for you.")]},
{id:"swiss",place:L("瑞士 · 阿尔卑斯山","SWITZERLAND · THE ALPS"),name:L("登上一列开往未知的豪华列车","Board a train to an unknown life"),tag:L("奇遇与命运","MYSTERY & WONDER"),tease:L("雪山全景套房、香槟，以及一张没有终点的车票。","Alpine suites, champagne, and a ticket with no destination."),color:"#7495c0",secret:L("餐车座位下的金色车票","A golden ticket beneath the dining seat"),
 acts:[
 {title:L("你拥有一张没有终点的票","THE TICKET HAS NO DESTINATION"),body:L("你在阿尔卑斯豪华列车里醒来。车窗外是雪山，车票上写着：任何人生。","You wake aboard an Alpine luxury train. The ticket reads: ANY LIFE."),choices:[
 [L("去餐车认识神秘旅客","Meet the stranger in the dining car"),L("对方知道你的名字，却说你们还没见过。","They know your name, but insist you haven't met.")],
 [L("打开包厢里上锁的行李箱","Open the locked suitcase"),L("箱子里是一张几十年后的你的照片。","The suitcase contains a photo of you decades from now.")],
 [L("在观景车厢欣赏雪山","Watch the Alps roll by"),L("玻璃倒影里的列车，竟朝相反方向行驶。","In the glass reflection, the train moves backward.")]]},
 {title:L("下一站，可以改写人生","THE NEXT STOP CAN CHANGE YOUR LIFE"),twists:[
 L("神秘旅客说：下一站下车，你就能交换一次人生。","The stranger offers you one chance to swap lives."),
 L("照片背面写着：别在下一站下车。","The photo says: Do not leave at the next station."),
 L("列车员说：每扇车门都通向一个不同的你。","The conductor says every door leads to a different you.")],
 choices:[
 [L("选一扇门，赌一次运气","Choose a door and take a chance"),L("门外是你从没去过的夏天。","The door opens onto a summer you've never lived.")],
 [L("先认识车上的每一个人","Meet everyone aboard before deciding"),L("所有人都在讲述自己错过的一段人生。","Everyone describes a life they almost lived.")],
 [L("保持神秘，继续看窗外的雪山","Keep riding into the mountains"),L("列车越过云层，整个世界突然亮了起来。","The train rises above the clouds.")]]},
 {title:L("终点站由你决定","YOU CHOOSE THE LAST STOP"),turns:[
 L("车长递来最后一张空白车票：只需要写一个愿望。","The conductor offers a blank ticket. Write one wish."),
 L("旅客们开始下车，他们每个人都找到了自己的另一段人生。","The other passengers disembark into alternate lives."),
 L("铁轨尽头不是车站，是一片你从未见过的星空。","The tracks end beneath a sky you've never seen.")],
 choices:[
 [L("下车，去过最疯狂的新生活","Step off into your wildest new life"),L("车门打开，风里全是新故事的味道。","The door opens into your next great story.")],
 [L("邀请刚认识的人一起冒险","Bring your new friends along"),L("这趟原本孤独的旅行有了同行者。","Your once-solitary journey finds its people.")],
 [L("不下车，让列车永远开下去","Never disembark; keep riding"),L("列车长笑了：你找到真正属于自己的终点了。","The conductor smiles. You've found your destination.")]]}],
 endings:[
 [L("另一个你，终于出发","The Life You Almost Missed"),L("你走进没有选过的生活。最好的故事才刚开始。","You step into the life you never chose. The best part is still ahead.")],
 [L("永远有朋友的旅程","A Journey With Your People"),L("风景再美，也有人愿意陪你看。下一站一起决定。","The views are sweeter shared. You choose the next stop together.")],
 [L("没有终点的幸福","The Train That Never Ends"),L("你不再寻找所谓正确的人生，只享受一路经过的风景。","You stop searching for the right life and love the journey.")]],
 rare:[L("最后一张黄金车票","The Golden Ticket"),L("金色车票写着：你随时都可以重新出发。它永远有效。","The golden ticket never expires. Another beginning is always possible.")]}
];
const $=s=>document.querySelector(s);
const S=(k,def)=>{try{return JSON.parse(localStorage.getItem(k)||"null")??def}catch{return def}};
const SAVE="elsewhere_dream_v1",COLL="elsewhere_dream_gallery_v1",LANG="morrowwish.language";
let lang=(()=>{const q=new URLSearchParams(location.search).get("lang");if(q==="zh"||q==="en"){try{localStorage.setItem(LANG,q)}catch{}return q}try{const stored=localStorage.getItem(LANG);if(stored==="zh"||stored==="en")return stored}catch{}return navigator.language?.toLowerCase().startsWith("zh")?"zh":"en"})();
const tr=v=>Array.isArray(v)?v[lang==="zh"?0:1]||v[0]:v;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let gallery=S(COLL,{}),state=null,lastWorld=null;
const uid=()=>globalThis.crypto?.randomUUID?.()||String(Date.now())+"-"+Math.random().toString(36).slice(2);
const canTrack=()=>navigator.globalPrivacyControl!==true&&navigator.doNotTrack!=="1";
const visitor=(()=>{if(!canTrack())return "";try{return localStorage.getItem("arcade-visitor-v2")||uid()}catch{return ""}})();
const labels={
 hero:L("你想体验哪一种人生？","Which life would you dare to live?"),
 intro:L("醒来，你已经拥有了梦寐以求的一切。然后，意外发生了。","You wake up with everything you ever wanted. Then something unexpected happens."),
 random:L("命运随机开局","Surprise me"),explore:L("选择你的梦幻人生","Pick your dream life"),
 tiny:L("6 段人生 · 每局约 2 分钟 · 24 种结局","6 DREAM LIVES · ABOUT 2 MINUTES · 24 ENDINGS"),
 gallery:L("人生收藏册","Your life collection"),saved:L("已解锁","discovered"),noSave:L("还没有开启。试试第一段人生。","Your first adventure is waiting."),
 restart:L("换条路再活一次","Try a different fate"),home:L("其他人生","All lives"),next:L("继续这段人生","See what happens next"),
 ending:L("这一生，你活成了……","THIS IS THE LIFE YOU LIVED"),another:L("再体验另一段人生","Live another life"),
 share:L("分享我的结局","Share my ending"), secret:L("插画里有个隐藏的小秘密","There's a secret hidden in the illustration"),
 secretFound:L("隐藏线索已找到！可能开启特殊结局","Hidden clue found! A rare ending may await."),
 progress:L("关键时刻","TURNING POINT"),choice:L("这次，你怎么选？","WHAT WILL YOU DO?"),
 consequence:L("你改变了故事","YOUR CHOICE CHANGED THINGS"),all:L("已收藏结局","Endings discovered"),
 return:L("返回主页","Back to Morrow Wish"),lang:L("中文 / EN","中文 / EN"),
 collected:L("你解锁了一张人生明信片","YOU UNLOCKED A LIFE POSTCARD"),
 reveal:L("发现隐藏细节","Discover a hidden detail")
};
function E(key){return esc(tr(labels[key]))}
function track(event,data={}){
 if(!canTrack())return;
 if(event==="world_open")window.arcadeMetric?.("game_start");
 if(event==="life_completed")window.arcadeMetric?.("game_complete");
 if(event==="life_restarted")window.arcadeMetric?.("retry");
 if(event==="share_clicked")window.arcadeMetric?.("share_clicked");
 let payload={event,world:state?.id||"",scenes:3,visitor,session:state?.session||"",runId:state?.runId||"",...data};
 try{const body=JSON.stringify(payload);if(visitor){const blob=new Blob([body],{type:"text/plain;charset=UTF-8"});if(!navigator.sendBeacon?.("/api/elsewhere-collect",blob))fetch("/api/elsewhere-collect",{method:"POST",headers:{"Content-Type":"text/plain"},body,keepalive:true}).catch(()=>{})}}catch{}
}
const sky=(a,b)=>'<defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="'+a+'"/><stop offset="1" stop-color="'+b+'"/></linearGradient><linearGradient id="sea" x2="0" y2="1"><stop stop-color="#71d5d5"/><stop offset="1" stop-color="#196f9c"/></linearGradient><filter id="glow"><feGaussianBlur stdDeviation="22"/></filter></defs><rect width="900" height="540" fill="url(#sky)"/>';
function art(id){
 let s="",defs="";
 const mount=(x,y,w,h,c)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="'+c+'"/>';
 const windowGrid=(x,y,c)=>Array.from({length:c},(_,i)=>'<rect x="'+(x+(i%3)*19)+'" y="'+(y+Math.floor(i/3)*28)+'" width="11" height="17" rx="2" fill="#f9e7bd"/>').join("");
 if(id==="amalfi"){
 defs=sky("#a67cbf","#ffd6a3");
 s='<circle cx="709" cy="137" r="69" fill="#fff1bd"/><path d="M0 270Q170 176 344 241T900 220V540H0Z" fill="#608f9b"/><path d="M0 337Q225 273 432 351T900 310V540H0Z" fill="#2b819d"/><path d="M0 404Q255 368 433 404T900 385V540H0Z" fill="#1884aa"/><path d="M0 540V195Q93 168 167 216T380 178L455 540Z" fill="#4c7582"/>';
 for(let i=0;i<11;i++){let x=14+(i*31)%380,y=172+Math.floor(i/4)*60;s+='<rect x="'+x+'" y="'+y+'" width="54" height="74" rx="4" fill="'+["#ffdec8","#f9c8ac","#f0dacd"][i%3]+'"/><path d="M'+(x-4)+' '+y+'l31-30 31 30" fill="#b88289"/>'+windowGrid(x+6,y+15,3);}
 s+='<path d="M0 462Q220 419 460 471T900 441V540H0Z" fill="#c9ae93"/><path d="M0 491H900" stroke="#e8d1b0" stroke-width="14"/><path d="M40 540V357M223 540V357" stroke="#ffdfc2" stroke-width="24"/><path d="M13 354q113-85 237 0" fill="none" stroke="#ffdfc2" stroke-width="25"/><circle cx="315" cy="394" r="36" fill="#f5cbb2"/><path d="M260 447q48-43 100 0v65H260z" fill="#fff4e6"/><g fill="#d25587">'+Array.from({length:13},(_,i)=>'<circle cx="'+(38+(i*37)%850)+'" cy="'+(450+(i*17)%60)+'" r="'+(9+i%3*4)+'"/>').join("")+'</g><g fill="#f1d15e">'+Array.from({length:9},(_,i)=>'<circle cx="'+(55+i*42)+'" cy="'+(340+(i%2)*29)+'" r="12"/>').join("")+'</g>';
 }else if(id==="paris"){
 defs=sky("#957eb2","#ffd3c6");
 s='<circle cx="737" cy="116" r="58" fill="#fff1cc"/><path d="M0 300L91 255l74 33 66-86 85 85 101-30 85 40 65-59 93 30 108-60 132 45V540H0Z" fill="#a482aa"/>';
 for(let i=0;i<10;i++){let x=i*100-20,y=263+(i%3)*31;s+='<rect x="'+x+'" y="'+y+'" width="106" height="'+(540-y)+'" fill="'+["#d9adad","#ba94a2","#efc5bb"][i%3]+'"/><path d="M'+(x-5)+' '+y+'l60-49 60 49" fill="#8b718e"/>'+windowGrid(x+18,y+29,9);}
 s+='<path d="M580 357l49-236 45 236M599 263h56M610 207h34" stroke="#6c5a78" stroke-width="10" fill="none"/><rect x="39" y="331" width="290" height="116" rx="17" fill="#842f5e"/><path d="M27 342h315" stroke="#eaa4af" stroke-width="26" stroke-dasharray="27 15"/><rect x="92" y="414" width="141" height="13" rx="4" fill="#e6be9e"/><path d="M159 425v89" stroke="#f6d4b1" stroke-width="12"/><path d="M0 492q350-47 900 0v48H0Z" fill="#b78c9b"/><g fill="#f6c4bf">'+Array.from({length:11},(_,i)=>'<circle cx="'+(i*93+18)+'" cy="'+(480+(i%2)*14)+'" r="'+(8+i%3*3)+'"/>').join("")+'</g><path d="M39 86Q300 169 580 75" stroke="#fff4c9" stroke-width="3" fill="none" stroke-dasharray="2 18"/>';
 }else if(id==="tokyo"){
 defs=sky("#201b4d","#bd5fa1");
 s='<circle cx="733" cy="105" r="64" fill="#ffc0e9" opacity=".55" filter="url(#glow)"/><path d="M0 317L43 260h85v-93h86v128h73v-175h101v155h91v-145h105v142h92v-90h103v130h120V540H0Z" fill="#292958"/>';
 for(let i=0;i<21;i++){let x=10+i*42,y=176+(i%4)*25;s+='<rect x="'+x+'" y="'+y+'" width="22" height="13" rx="2" fill="'+(i%2?"#eb84ff":"#6de6ed")+'" opacity=".85"/>';}
 s+='<path d="M320 38L442 340H277Z" fill="#ec78d1" opacity=".23"/><path d="M720 20L461 345H604Z" fill="#8effd8" opacity=".23"/><path d="M0 384Q450 340 900 385V540H0Z" fill="#1d1d49"/><rect x="188" y="324" width="525" height="87" rx="9" fill="#c653ba"/><rect x="221" y="339" width="460" height="53" fill="#392352"/><path d="M0 478h900" stroke="#e578d1" stroke-width="16"/><g fill="#171837">'+Array.from({length:44},(_,i)=>'<circle cx="'+(i*53%902)+'" cy="'+(460+(i*19%73))+'" r="'+(13+i%3*3)+'"/>').join("")+'</g><path d="M405 398v-108m-32 121l32-43 29 43" stroke="#ffe2b8" stroke-width="15" stroke-linecap="round"/><circle cx="405" cy="268" r="26" fill="#ffe2b8"/><path d="M377 259q27-46 53-1" stroke="#2a2647" stroke-width="19"/>';
 }else if(id==="iceland"){
 defs=sky("#172d52","#6989a8");
 s='<path d="M0 175Q203-29 398 157T900 68" stroke="#66ffca" stroke-width="80" opacity=".34" fill="none"/><path d="M0 80Q270 239 490 40T900 110" stroke="#c88fff" stroke-width="65" opacity=".32" fill="none"/><path d="M0 359l152-173 123 103 152-173 167 205 168-159 138 150v228H0Z" fill="#b4d2d4"/><path d="M0 402l190-118 121 131 179-171 155 179 132-123 123 97v143H0Z" fill="#5b899e"/><path d="M0 457q260-45 463 12t437-18v89H0Z" fill="#e0e9e7"/><path d="M454 459V317l130-92 147 92v142Z" fill="#334f64"/><path d="M436 318l147-111 169 111" fill="#f1e4d3"/><rect x="515" y="340" width="155" height="102" fill="#f2bd82"/><path d="M592 336v110" stroke="#466076" stroke-width="12"/><circle cx="778" cy="149" r="5" fill="#fff"/><g fill="#fff">'+Array.from({length:23},(_,i)=>'<circle cx="'+(i*137%890)+'" cy="'+(i*83%215)+'" r="'+(i%2+2)+'"/>').join("")+'</g>';
 }else if(id==="maldives"){
 defs=sky("#7ad7e1","#fff3cb");
 s='<circle cx="761" cy="105" r="63" fill="#fff6bd"/><path d="M0 280Q250 249 480 286T900 262V540H0Z" fill="url(#sea)"/><path d="M0 364Q230 343 446 378T900 346" stroke="#c4fff0" stroke-width="10" fill="none"/><path d="M0 439Q220 418 500 450T900 416" stroke="#9de9e0" stroke-width="9" fill="none"/><path d="M0 507Q255 478 531 511T900 479" stroke="#c0f4e6" stroke-width="7" fill="none"/><path d="M0 540V385q143-53 255 0v155Z" fill="#f9e6b2"/><rect x="326" y="310" width="277" height="108" rx="10" fill="#f8d9aa"/><path d="M300 316l158-105 169 105Z" fill="#bd956f"/><path d="M358 414v126m215-126v126" stroke="#8d6e63" stroke-width="16"/><rect x="414" y="340" width="111" height="73" rx="9" fill="#78bac0"/><path d="M457 340v74" stroke="#f9dfb7" stroke-width="10"/><path d="M130 420Q200 255 233 193" stroke="#926956" stroke-width="25" fill="none"/><path d="M234 195q-150-74-203-7m203 7q-53-118 45-140m-45 140q116-104 150-39m-150 39q148 4 156 89" stroke="#3eaa87" stroke-width="32" fill="none" stroke-linecap="round"/><path d="M220 447h680" stroke="#f0dfbf" stroke-width="17"/>';
 }else if(id==="swiss"){
 defs=sky("#84bbdc","#fff1d5");
 s='<circle cx="733" cy="112" r="67" fill="#fff6c6"/><path d="M0 384L151 140l105 145 148-215 172 274 124-218 200 259v155H0Z" fill="#dce9ec"/><path d="M0 411l180-200 99 144 125-212 165 229 127-176 204 224v120H0Z" fill="#7aa4b5"/><path d="M0 450Q240 386 430 442T900 410V540H0Z" fill="#8ab6a7"/><path d="M0 490q270-51 510-3t390-33v86H0Z" fill="#577e83"/><path d="M40 381q370-30 820-56" fill="none" stroke="#735e62" stroke-width="31"/><path d="M40 381q370-30 820-56" fill="none" stroke="#e6d6c3" stroke-width="10"/><path d="M156 362L235 302h404l84 44v56H156Z" fill="#ab4047"/><rect x="232" y="322" width="385" height="42" fill="#f1c57f"/><g fill="#416a86">'+Array.from({length:7},(_,i)=>'<rect x="'+(244+i*55)+'" y="327" width="40" height="28" rx="4"/>').join("")+'</g><path d="M156 399h567" stroke="#593f52" stroke-width="19"/><path d="M0 520q260-58 540-8t360-19" fill="none" stroke="#a9d2a5" stroke-width="18"/>';
 }
 const unique=(defs+s).replaceAll('id="sky"','id="sky-'+id+'"').replaceAll("url(#sky)","url(#sky-"+id+")").replaceAll('id="sea"','id="sea-'+id+'"').replaceAll("url(#sea)","url(#sea-"+id+")");
 return '<svg class="dream-art" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 540" preserveAspectRatio="xMidYMid slice" aria-hidden="true">'+unique+'</svg>';
}
function renderHome(){
 state=null;history.replaceState({}, "", "/elsewhere/"+(lang==="zh"?"?lang=zh":""))
 $("#home").hidden=false;$("#game").hidden=true;$("#ending").hidden=true;
 const explored=Object.values(gallery).flat().length;
 $("#home").innerHTML='<div class="intro"><span class="kicker">ELSEWHERE · PARALLEL LIVES</span><h1>'+E("hero")+'</h1><p>'+E("intro")+'</p><div class="intro-actions"><button class="big-btn" data-random>'+E("random")+' ↗</button><a class="soft-link" href="#lives">'+E("explore")+' ↓</a></div><small>'+E("tiny")+'</small></div><div id="lives" class="life-grid">'+WORLDS.map(w=>'<button class="life-card" data-world="'+w.id+'" style="--accent:'+w.color+'"><div class="card-image">'+art(w.id)+'</div><span class="place">'+esc(tr(w.place))+'</span><strong>'+esc(tr(w.name))+'</strong><span class="tease">'+esc(tr(w.tease))+'</span><span class="card-foot">'+esc(tr(w.tag))+' <b>↗</b></span></button>').join("")+'</div><section class="album"><div class="album-head"><h2>'+E("gallery")+'</h2><span>'+explored+' / 24 '+E("saved")+'</span></div><div class="album-cards">'+(explored?Object.entries(gallery).flatMap(([id,nums])=>nums.map(n=>{let w=WORLDS.find(x=>x.id===id);if(!w)return "";let ending=n===3?w.rare:w.endings[n];return '<div class="album-card"><span>'+esc(tr(w.place))+'</span><strong>'+esc(tr(ending[0]))+'</strong></div>'})).join(""):'<p>'+E("noSave")+'</p>')+'</div></section>';
 document.title=(lang==="zh"?"平行人生 — Morrow Wish":"Elsewhere — Morrow Wish");
}
function randomWorld(){
 const pool=WORLDS.filter(w=>w.id!==lastWorld);const w=pool[Math.floor(Math.random()*pool.length)]||WORLDS[0];openWorld(w.id);
}
function openWorld(id,retry=false,push=true){
 const w=WORLDS.find(x=>x.id===id);if(!w)return;
 lastWorld=id;state={id,stage:0,selected:null,history:[],secret:false,runId:uid(),session:uid(),start:Date.now()};
 if(retry)track("life_restarted",{world:id});
 track("world_open",{world:id,resume:false});
 $("#home").hidden=true;$("#game").hidden=false;$("#ending").hidden=true;
 if(push)history.pushState({world:id},"","/elsewhere/?world="+encodeURIComponent(id)+(lang==="zh"?"&lang=zh":""));
 renderStage();window.scrollTo({top:0,behavior:"instant"});
 document.title=tr(w.name)+" — Elsewhere";
}
function renderStage(){
 const w=WORLDS.find(x=>x.id===state.id),i=state.stage,act=w.acts[i],prior=state.history[i-1],body=i===0?act.body:i===1?act.twists[state.history[0]?.index??0]:act.turns[state.history[1]?.index??0];
 const impact=state.selected!==null?act.choices[state.selected][1]:null;
 const choiceHTML=state.selected===null?
 '<div class="choices-label">'+E("choice")+'</div><div class="choices">'+act.choices.map((c,j)=>'<button class="choice" data-choice="'+j+'"><span class="choice-num">0'+(j+1)+'</span><strong>'+esc(tr(c[0]))+'</strong><span>↗</span></button>').join("")+'</div>':
 '<div class="impact"><span>'+E("consequence")+'</span><p>'+esc(tr(impact))+'</p><button class="big-btn" data-continue>'+E("next")+' →</button></div>';
 $("#game").innerHTML='<div class="game-top"><button class="ghost-btn" data-home>← '+E("home")+'</button><span>'+esc(tr(w.place))+'</span><span class="count">'+(i+1)+' / 3</span></div><div class="scene"><div class="scene-picture" data-phase="'+i+'">'+art(w.id)+'<button class="secret-pin '+(state.secret?"is-found":"")+'" aria-label="'+E("reveal")+'" title="'+E("secret")+'" data-secret>✦</button><div class="art-label"><span>'+esc(tr(w.tag))+'</span><h2>'+esc(tr(w.name))+'</h2></div></div><div class="scene-body"><div class="progress-track"><span style="width:'+Math.round(((i+1)/3)*100)+'%"></span></div><span class="scene-kicker">'+E("progress")+' '+String(i+1).padStart(2,"0")+' / 03</span><h2>'+esc(tr(act.title))+'</h2><p class="story-line">'+esc(tr(body))+'</p>'+(state.secret?'<div class="found-clue">✦ '+E("secretFound")+'</div>':'')+choiceHTML+'</div></div>';
 if(state.selected===null)track("chapter_view",{world:w.id,chapter:i+1});
}
function makeChoice(n){
 if(!state||state.selected!==null||!Number.isInteger(n)||n<0||n>2)return;
 state.selected=n;
 const w=WORLDS.find(x=>x.id===state.id);
 state.history.push({stage:state.stage,index:n});
 track("choice_made",{world:w.id,chapter:state.stage+1,choice:n+1,routeVector:state.history.map(x=>x.index+1).join("-")});
 track("chapter_completed",{world:w.id,chapter:state.stage+1});
 renderStage();
}
function advance(){
 if(!state||state.selected===null)return;
 if(state.stage<2){state.stage++;state.selected=null;renderStage();window.scrollTo({top:0,behavior:"smooth"})}else finish();
}
function finish(){
 const w=WORLDS.find(x=>x.id===state.id);
 // Hidden ending requires noticing the artwork and choosing the mystery route at least once.
 const rare=state.secret&&state.history.some(x=>x.index===0);
 const n=rare?3:state.history[2].index;
 const ending=n===3?w.rare:w.endings[n],previous=Array.isArray(gallery[w.id])?gallery[w.id]:[];
 if(!previous.includes(n)){gallery[w.id]=[...previous,n];try{localStorage.setItem(COLL,JSON.stringify(gallery))}catch{}}
 if(!state.completed){track("life_completed",{world:w.id,routeVector:state.history.map(x=>x.index+1).join("-")});
 track("ending_view",{world:w.id,storyRoute:state.history[1].index,lifeDirection:n,routeVector:state.history.map(x=>x.index+1).join("-")});state.completed=true;}
 $("#game").hidden=true;$("#ending").hidden=false;
 $("#ending").innerHTML='<div class="game-top"><button class="ghost-btn" data-home>← '+E("home")+'</button><span>'+esc(tr(w.place))+'</span><span>'+E("all")+' '+Object.values(gallery).flat().length+'/24</span></div><div class="ending-art">'+art(w.id)+'<span>'+E("collected")+'</span></div><div class="ending-paper"><span class="kicker">'+E("ending")+'</span><h1>'+esc(tr(ending[0]))+'</h1><p>'+esc(tr(ending[1]))+'</p><div class="footprints">'+state.history.map((d,j)=>'<span>'+esc(tr(w.acts[j].choices[d.index][0]))+'</span>').join('<b>→</b>')+'</div><div class="end-actions"><button class="big-btn" data-retry>'+E("restart")+' ↺</button><button class="outline-btn" data-random>'+E("another")+' ↗</button><button class="outline-btn" data-share>'+E("share")+'</button></div></div>';
 window.scrollTo({top:0,behavior:"smooth"});
}
async function share(){
 if(!state)return;
 const w=WORLDS.find(x=>x.id===state.id),n=state.secret&&state.history.some(x=>x.index===0)?3:state.history[2].index;
 const ending=n===3?w.rare:w.endings[n],url=location.origin+"/elsewhere/?world="+encodeURIComponent(w.id);
 const text=lang==="zh"?"我在《平行人生》活成了「"+tr(ending[0])+"」。如果是你，会走向什么结局？":'My alternate life in Elsewhere ended as "'+tr(ending[0])+'". What would yours be?';
 if(window.MorrowwishSocialShare?.open){window.MorrowwishSocialShare.open({title:lang==="zh"?"平行人生 · "+tr(ending[0]):"Elsewhere · "+tr(ending[0]),message:text,url,language:lang,meta:{game:"elsewhere",world:w.id},onShare:platform=>track("share_clicked",{world:w.id,platform})});return}
 track("share_clicked",{world:w.id});
 try{if(navigator.share){await navigator.share({title:tr(ending[0]),text,url});return}}catch(e){if(e?.name==="AbortError")return}
 try{await navigator.clipboard.writeText(text+" "+url);toast(lang==="zh"?"分享文案和链接已复制":"Share link copied")}catch{toast(url)}
}
function toast(msg){$("#toast").textContent=msg;$("#toast").hidden=false;setTimeout(()=>$("#toast").hidden=true,2400)}
function setLanguage(l){
 lang=l;document.documentElement.lang=l==="zh"?"zh-CN":"en";
 try{localStorage.setItem(LANG,l)}catch{}
 $("#language").textContent=l==="zh"?"EN":"中文";
 $(".brand").innerHTML=(l==="zh"?"平行人生":"Elsewhere")+"<i>.</i>";
 $(".top-right span").textContent=l==="zh"?"MORROW WISH · 梦幻人生":"A MORROW WISH ADVENTURE";
 $(".footer").textContent=l==="zh"?"平行人生 · MORROW WISH · 每段人生都有另一扇门":"ELSEWHERE · MORROW WISH · EVERY LIFE HAS ANOTHER DOOR";
 if(state){if($("#ending").hidden)renderStage();else finish()}else renderHome();
}
document.addEventListener("click",e=>{
 const el=e.target.closest("button,a");if(!el)return;
 if(el.matches("[data-world]"))openWorld(el.dataset.world);
 else if(el.matches("[data-random]"))randomWorld();
 else if(el.matches("[data-home]"))renderHome();
 else if(el.matches("[data-retry]"))openWorld(state.id,true);
 else if(el.matches("[data-choice]"))makeChoice(Number(el.dataset.choice));
 else if(el.matches("[data-continue]"))advance();
 else if(el.matches("[data-secret]")&&state&&!state.secret){state.secret=true;toast(tr(WORLDS.find(w=>w.id===state.id).secret));renderStage();}
 else if(el.matches("[data-share]"))share();
});
$("#language").addEventListener("click",()=>setLanguage(lang==="zh"?"en":"zh"));
window.addEventListener("popstate",()=>{const id=new URLSearchParams(location.search).get("world");if(!id)renderHome();else if(!state||state.id!==id)openWorld(id,false,false)});
const urlWorld=new URLSearchParams(location.search).get("world");
setLanguage(lang);
if(urlWorld&&WORLDS.some(w=>w.id===urlWorld))openWorld(urlWorld);
if("serviceWorker" in navigator)navigator.serviceWorker.register("/elsewhere/sw.js").catch(()=>{});
})();