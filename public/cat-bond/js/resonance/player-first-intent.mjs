// Player-first scene intent. A short reason is shown before each next action; no new completion gate.
export const sceneIntent=Object.freeze({
  "prologue:P-01": [
    "星铃再次失常，有猫忘了回家的路。",
    "The Star Bell is failing again; cats are forgetting their way home."
  ],
  "prologue:P-02": [
    "你连自己的名字都想不起来。门外也许有人认识你。",
    "You cannot remember your own name. Someone beyond the gate might know you."
  ],
  "prologue:P-03": [
    "那只猫的地图被风吹走了，帮不帮她由你。",
    "A cat's map has blown away. Help her if you like."
  ],
  "prologue:P-04": [
    "路标写着风铃镇，那里有修铃匠。",
    "The sign points to Windchime Town and its bellkeeper."
  ],
  "prologue:P-05": [
    "去热闹的风铃镇，问问有没有猫认得你。",
    "Visit Windchime Town and ask if anyone recognizes you."
  ],
  "harbor:H-01": [
    "栖蓝正在帮一位找不到家的阿婆。过去看看。",
    "Qilan is helping an old cat who cannot find her home. Go see."
  ],
  "harbor:H-02": [
    "那团铃光唱出了你熟悉的旋律！追上它，或从低墙抄近路。",
    "That runaway chime sang a tune you know! Chase it or cut across the low wall."
  ],
  "harbor:H-03": [
    "檐灯也许认得那首你从没学过的曲子。",
    "Yandeng might recognize the song you never learned."
  ],
  "harbor:H-04": [
    "铃光兽挡住了去路。和暮铃一起打散它。",
    "The belllight beast blocks the way. Fight it alongside Muling."
  ],
  "harbor:H-05": [
    "让阿婆家的门铃重新响起来，也许檐灯能告诉你曲子的来历。",
    "Help the old cat hear her own doorbell again; Yandeng may know the tune's origin."
  ],
  "forest:R-01": [
    "旧图上的叶形路标就在这里，但森林的桥一直在挪窝。",
    "The leaf mark on the map is here, but the forest bridges keep moving."
  ],
  "forest:R-02": [
    "月叶能让桥长向不同地方。选一条路，去找榆川。",
    "Moonleaves make bridges grow toward different places. Choose a route to Yuchuan."
  ],
  "forest:R-03": [
    "暮铃又走回了同一个地方。换一条真正连通的桥，带她出去。",
    "Muling has looped back to the same spot. Find a real connected bridge and lead her out."
  ],
  "forest:R-04": [
    "古树也许记得画图的猫。让它重新听见邻地的铃声。",
    "The old tree may remember the mapmaker. Let it hear the neighboring bells again."
  ],
  "forge:E-01": [
    "小铆担心没人喜欢他的歪耳灯。陪他演一场吧。",
    "Xiaomao worries nobody likes his crooked-ear lantern. Put on a show with him."
  ],
  "forge:E-02": [
    "烬婆认得火纹！旧灯匣在桥的另一头，先照亮桥面。",
    "Jinpo recognizes the mark! The old lantern case lies beyond the bridge. Light the way."
  ],
  "forge:E-03": [
    "剪影兽还在模仿刚才的影戏。和伙伴一起把它赶出暗处。",
    "The shadow beast keeps repeating the show. Drive it out of the dark with your companions."
  ],
  "forge:E-04": [
    "恢复城里的灯火，再看看那只旧灯匣里藏了什么。",
    "Restore the city's lights and discover what is inside the old lantern case."
  ],
  "sky:S-01": [
    "旧图上的月门在云上。远帆愿意教你怎么滑翔。",
    "The moon gate on the map is above the clouds. Yuanfan can show you how to glide."
  ],
  "sky:S-02": [
    "两座高岛之间有一块月牙岩，去那里找藏在云后的门。",
    "A crescent rock lies between two islands. Find the gate hidden behind the clouds."
  ],
  "sky:S-03": [
    "云瀑堵住了月门。借风越过它，找到安全落脚点。",
    "A cloudfall blocks the moon gate. Ride the wind around it and land safely."
  ],
  "sky:S-04": [
    "冒险告一段落，暮铃在观景台留了两杯茶。",
    "Take a break. Muling has set out two cups of tea at the lookout."
  ],
  "sky:S-05": [
    "白栞说近期有猫查过旧封印。进书库找线索。",
    "Baikan says someone recently researched the old seal. Follow the clue into the library."
  ],
  "library:M-01": [
    "公开记忆镜里可能留着旧封印的线索。跟白栞去看看。",
    "The public memory mirrors may hold clues about the old seal. Follow Baikan."
  ],
  "library:M-02": [
    "镜子里有两只暮铃。换个位置摇铃，找出真正会回应你的她。",
    "Two Mulings appear in the mirror. Move and ring to find the one who responds to you."
  ],
  "library:M-03": [
    "壁画里那只猫长得和你一模一样。问暮铃究竟发生过什么。",
    "The cat in the mural looks just like you. Ask Muling what happened."
  ],
  "library:M-04": [
    "借阅记录上的印记与暮铃的铃坠相同。你想先问她什么？",
    "The borrowing mark matches Muling's pendant. What do you want to ask first?"
  ],
  "library:M-05": [
    "恢复自己的记忆，会不会让其他猫忘掉家人？看看两种办法的后果。",
    "Would recovering your memories cost other cats theirs? See what each plan would do."
  ],
  "starfall:F-01": [
    "暮铃先一步去了中央遗迹。沿发亮的星石追上她。",
    "Muling has gone ahead to the central ruins. Follow the glowing stones."
  ],
  "starfall:F-02": [
    "这里记下了星铃破碎的那一天。看看你当时做了什么选择。",
    "This place records the day the Star Bell broke. Discover the choice you made."
  ],
  "starfall:F-03": [
    "暮铃就在遗迹边。你还有话没跟她说完。",
    "Muling is waiting by the ruins. You still have things to say to her."
  ],
  "starfall:F-04": [
    "试着摇响邻铃，让六地各自回应，而不是把记忆交给中央。",
    "Ring the neighboring bells so all six places can answer in their own voices."
  ],
  "starfall:F-05": [
    "中央传来当年的错误铃声。六地已经答上，必须守住它们。",
    "The old false note sounds from the center. The six regions have answered; protect them."
  ],
  "finale:B-01": [
    "中央回响正在夺走一路上的新记忆。和暮铃一起阻止它。",
    "The central echo is stealing the memories you made together. Stop it with Muling."
  ],
  "finale:B-02": [
    "它只会重复别人说过的话。改变你的行动，找出假回响。",
    "It only repeats what others said. Change your actions to expose the false echo."
  ],
  "finale:B-03": [
    "六地正在回铃。守住它们，等真正稳定后与暮铃一起开锁。",
    "All six regions are answering. Protect them, then release the lock with Muling."
  ],
  "finale:B-04": [
    "星铃终于重新响起。你还记得一路上的伙伴吗？",
    "The Star Bell rings again. Do you remember the friends you met?"
  ],
  "epilogue:E-01": [
    "回到阳光花园；如果想，也可以去看看一路认识的猫。",
    "Return to Sunlit Garden, or visit the cats you met along the way."
  ],
  "epilogue:E-02": [
    "暮铃决定为自己做错的事负责，陪她面对大家。",
    "Muling wants to take responsibility. Be there as she faces the others."
  ],
  "epilogue:E-03": [
    "暮铃想要一把花园钥匙。你愿意让她留下吗？",
    "Muling asks for a garden key. Will you let her stay?"
  ]
});
export const beforeActionDialogue=v=>!!(v.current?.beforeActionLines&&v.cursor<v.current.beforeActionLines&&v.lineReady);
