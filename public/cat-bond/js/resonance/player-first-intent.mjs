// Only observations and goals available before an action. Outcomes belong to dialogue.
export const sceneIntent=Object.freeze({
  "prologue:P-01": [
    "醒来后，看看四周。",
    "Look around after waking up."
  ],
  "prologue:P-02": [
    "找找有没有认识你的猫。",
    "Look for a cat who might know you."
  ],
  "prologue:P-03": [
    "风把地图吹跑了。",
    "A map has blown away."
  ],
  "prologue:P-04": [
    "沿路标走出花园。",
    "Follow the sign out of the garden."
  ],
  "prologue:P-05": [
    "去镇上问问你的名字。",
    "Ask about your name in town."
  ],
  "harbor:H-01": [
    "那位阿婆好像迷路了。",
    "That old cat seems lost."
  ],
  "harbor:H-02": [
    "追上那团会唱歌的光。",
    "Catch the singing light."
  ],
  "harbor:H-03": [
    "去问问旧铃房里的猫。",
    "Ask the cat in the old bell house."
  ],
  "harbor:H-04": [
    "和暮铃一起挡住怪物。",
    "Stop the creature with Muling."
  ],
  "harbor:H-05": [
    "让阿婆家的铃重新响起来。",
    "Help Grandma's doorbell ring again."
  ],
  "forest:R-01": [
    "桥怎么长到树上去了？去看看。",
    "Why has the bridge grown into a tree? Go see."
  ],
  "forest:R-02": [
    "选条有意思的路，去对岸。",
    "Pick a path and reach the far bank."
  ],
  "forest:R-03": [
    "又回到这里了？找一条新路。",
    "Back here again? Find a new way out."
  ],
  "forest:R-04": [
    "去古树下看看。",
    "Look beneath the old tree."
  ],
  "forge:E-01": [
    "小铆的灯没人看，陪他玩一会儿。",
    "Keep Xiaomao company at his lantern show."
  ],
  "forge:E-02": [
    "桥太黑了，照亮它才能过去。",
    "Light the dark bridge to cross."
  ],
  "forge:E-03": [
    "把那只怪影赶出去。",
    "Drive away the strange shadow."
  ],
  "forge:E-04": [
    "帮大家重新点亮节日的灯。",
    "Help relight the festival lanterns."
  ],
  "sky:S-01": [
    "试试在云上飞是什么感觉。",
    "Try flying above the clouds."
  ],
  "sky:S-02": [
    "旧图上画的岩石就在附近。",
    "The rock on the old map is nearby."
  ],
  "sky:S-03": [
    "借着风，绕过云瀑。",
    "Ride the wind around the cloudfall."
  ],
  "sky:S-04": [
    "暮铃在观景台等你。",
    "Muling is waiting at the lookout."
  ],
  "sky:S-05": [
    "去月门那边看看。",
    "See what lies beyond the moon gate."
  ],
  "library:M-01": [
    "跟白栞去看从前的画。",
    "Follow Baikan to see the old paintings."
  ],
  "library:M-02": [
    "镜廊里有些不对劲。",
    "Something feels strange in the mirror hall."
  ],
  "library:M-03": [
    "去看看墙上那幅画。",
    "Go look at the painting on the wall."
  ],
  "library:M-04": [
    "去查那份借书记录。",
    "Check the borrowing record."
  ],
  "library:M-05": [
    "看看桌上两种办法有什么不同。",
    "See how the two plans on the table differ."
  ],
  "starfall:F-01": [
    "沿发亮的石头走到遗迹。",
    "Follow the glowing stones to the ruins."
  ],
  "starfall:F-02": [
    "去看看留下来的旧记录。",
    "Look at the old record."
  ],
  "starfall:F-03": [
    "找到暮铃，听听她想说什么。",
    "Find Muling and hear what she has to say."
  ],
  "starfall:F-04": [
    "摇响这里的铃，听听远处。",
    "Ring this bell and listen to the distance."
  ],
  "starfall:F-05": [
    "中央传来了奇怪的声音。",
    "A strange sound comes from the center."
  ],
  "finale:B-01": [
    "挡住正在靠近的怪物。",
    "Stop the approaching creature."
  ],
  "finale:B-02": [
    "听清那个声音，再试一次。",
    "Listen to that voice and try again."
  ],
  "finale:B-03": [
    "和伙伴守住亮起来的铃。",
    "Protect the glowing bells with your friends."
  ],
  "finale:B-04": [
    "看看铃声停下来之后发生了什么。",
    "See what happens when the ringing stops."
  ],
  "epilogue:E-01": [
    "回花园看看大家。",
    "Return to the garden to see everyone."
  ],
  "epilogue:E-02": [
    "陪暮铃去见檐灯。",
    "Go with Muling to see Yandeng."
  ],
  "epilogue:E-03": [
    "暮铃在花园里等你。",
    "Muling is waiting in the garden."
  ]
});
export const beforeActionDialogue=v=>!!(v.current?.beforeActionLines&&v.cursor<v.current.beforeActionLines&&v.lineReady);
