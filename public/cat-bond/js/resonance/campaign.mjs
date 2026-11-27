// Canon 1.3 dialogue pass; gameplay migration and player acceptance tracked separately.
export const campaign = {
  "canon": "The Last Resonance",
  "version": 1,
  "sourceSha": "e76fb300981187f2db7a799588425dbe4ad7323f",
  "regions": [
    "harbor",
    "forest",
    "forge",
    "sky",
    "library",
    "starfall"
  ],
  "links": [
    [
      "harbor",
      "forest",
      "beacon-supply-vessel",
      "herbs-waterway-map"
    ],
    [
      "forest",
      "forge",
      "cooling-plans-herbs",
      "pumps-tools"
    ],
    [
      "forge",
      "sky",
      "wind-vanes-flight-parts",
      "wind-data-airship-route"
    ],
    [
      "sky",
      "library",
      "courier-route",
      "archived-flight-maps"
    ],
    [
      "library",
      "starfall",
      "star-chart-coordinates",
      "astronomical-observations"
    ],
    [
      "starfall",
      "harbor",
      "navigation-bell-compass",
      "beacon-response"
    ]
  ],
  "support": [
    "lighthouse-signal",
    "paired-root-channel",
    "sound-gate-repair",
    "aerial-melody",
    "authentic-melody-order",
    "star-map-alignment"
  ],
  "cast": {
    "player": {
      "id": "player",
      "name": {
        "zh": "无名守铃者",
        "en": "Bellkeeper"
      },
      "region": "garden",
      "artDirection": {
        "zh": "青年成年猫，柔和而坚毅；旅行斗篷、旧铃绳；保持玩家选定的猫咪外观",
        "en": "Young adult; gentle determination; travel cloak and worn bell cord; preserve chosen player-cat appearance"
      },
      "expressionNotes": "谨慎观察、惊讶、坚定、温暖",
      "artStatus": "unproduced"
    },
    "muling": {
      "id": "muling",
      "name": {
        "zh": "暮铃",
        "en": "Muling"
      },
      "region": "garden",
      "artDirection": {
        "zh": "细长而优雅的成年母猫，烟银长毛与琥珀眼，靛青旅行披肩；旧铜铃坠始终一致；最终战使用独立环形铃器与仪式服，而非放大原角色",
        "en": "Slender adult silver-smoke longhair, amber eyes, indigo travel mantle; consistent aged bronze bell pendant. Finale: distinct ritual attire and ring instrument, never an enlarged sprite."
      },
      "expressionNotes": "温暖、俏皮、好奇、专注、坦诚、悔意、释然",
      "artStatus": "unproduced",
      "narrativeRole": "core"
    },
    "jiedeng": {
      "id": "jiedeng",
      "name": {
        "zh": "檐灯",
        "en": "Yandeng"
      },
      "region": "harbor",
      "artDirection": {
        "zh": "老年宽肩深灰猫，厚毛、风雨磨损的海岸守灯衣，旧灯钥匙；站姿沉稳",
        "en": "Older broad-shouldered slate cat, dense fur, weathered keeper coat and lighthouse key; grounded posture"
      },
      "expressionNotes": "沉默、忧虑、坚决、释然",
      "artStatus": "unproduced",
      "narrativeRole": "regional"
    },
    "qilan": {
      "id": "qilan",
      "name": {
        "zh": "栖蓝",
        "en": "Qilan"
      },
      "region": "harbor",
      "artDirection": {
        "zh": "年轻修长蓝灰短毛猫，海青领航围巾、潮汐图；动作敏捷",
        "en": "Young slender blue-gray shorthair, teal navigator scarf and tide chart; quick movement"
      },
      "expressionNotes": "好奇、急躁、勇敢、喜悦",
      "artStatus": "unproduced",
      "narrativeRole": "core"
    },
    "yahe": {
      "id": "yahe",
      "name": {
        "zh": "芽禾",
        "en": "Yahe"
      },
      "region": "forest",
      "artDirection": {
        "zh": "年轻暖棕斑纹猫，植物编织药袋，眼神明亮，前倾姿态",
        "en": "Young warm-brown tabby, woven herbal satchel, bright eyes, forward stance"
      },
      "expressionNotes": "热情、怀疑、担忧、欣慰",
      "artStatus": "unproduced",
      "narrativeRole": "support"
    },
    "yuchuan": {
      "id": "yuchuan",
      "name": {
        "zh": "榆川",
        "en": "Yuchuan"
      },
      "region": "forest",
      "artDirection": {
        "zh": "成年厚实深棕猫，长眉、根系护具和测水刻尺，安静的姿态",
        "en": "Sturdy dark-brown adult with long brows, root work gear and water gauge; quiet stance"
      },
      "expressionNotes": "克制、固执、专注、信任",
      "artStatus": "unproduced",
      "narrativeRole": "regional"
    },
    "jinpo": {
      "id": "jinpo",
      "name": {
        "zh": "烬婆",
        "en": "Jinpo"
      },
      "region": "forge",
      "artDirection": {
        "zh": "老年结实玳瑁猫，烧蚀皮革围裙、护目镜与锻锤；独特不对称轮廓",
        "en": "Older muscular tortoiseshell, scorched leather apron, goggles and hammer; asymmetric silhouette"
      },
      "expressionNotes": "严厉、羞愧、专注、骄傲",
      "artStatus": "unproduced",
      "narrativeRole": "support"
    },
    "xiaomao": {
      "id": "xiaomao",
      "name": {
        "zh": "小铆",
        "en": "Xiaomao"
      },
      "region": "forge",
      "artDirection": {
        "zh": "年轻瘦小狸花猫，偏大的机械工具带、护腕、铆钉图纸；灵活的耳朵",
        "en": "Lean young tabby, oversized tool belt, wrist guards and rivet drawings; expressive ears"
      },
      "expressionNotes": "兴奋、不服、专注、成就感",
      "artStatus": "unproduced",
      "narrativeRole": "core"
    },
    "lingyu": {
      "id": "lingyu",
      "name": {
        "zh": "翎羽",
        "en": "Lingyu"
      },
      "region": "sky",
      "artDirection": {
        "zh": "成熟银白虎斑猫，长腿、修身飞行披风和风向计，保护性的站姿",
        "en": "Mature silver tabby, long legs, fitted flight mantle and wind gauge; protective stance"
      },
      "expressionNotes": "认真、戒备、动摇、欣慰",
      "artStatus": "unproduced",
      "narrativeRole": "support"
    },
    "yuanfan": {
      "id": "yuanfan",
      "name": {
        "zh": "远帆",
        "en": "Yuanfan"
      },
      "region": "sky",
      "artDirection": {
        "zh": "年轻奶油色长腿猫，轻型飞翼背带、磨损飞行日志，向前的剪影",
        "en": "Young cream long-legged cat, light glider harness and worn flight log; forward silhouette"
      },
      "expressionNotes": "期待、委屈、坚定、自豪",
      "artStatus": "unproduced",
      "narrativeRole": "core"
    },
    "moye": {
      "id": "moye",
      "name": {
        "zh": "墨页",
        "en": "Moye"
      },
      "region": "library",
      "artDirection": {
        "zh": "成年黑色长毛猫，窄眼、层叠墨色档案袍、银色书签；动作精确",
        "en": "Adult black longhair, narrow eyes, layered ink archivist robe and silver bookmark; precise movement"
      },
      "expressionNotes": "疏离、迟疑、忧虑、坦然",
      "artStatus": "unproduced",
      "narrativeRole": "regional"
    },
    "baikan": {
      "id": "baikan",
      "name": {
        "zh": "白栞",
        "en": "Baikan"
      },
      "region": "library",
      "artDirection": {
        "zh": "年轻白底灰斑猫，不对称书卷肩带、镜片与档案笔，眼神锐利",
        "en": "Young white-and-gray cat, asymmetric folio strap, lens and archive pen; sharp gaze"
      },
      "expressionNotes": "求知、急切、震惊、温和",
      "artStatus": "unproduced",
      "narrativeRole": "core"
    },
    "xingya": {
      "id": "xingya",
      "name": {
        "zh": "星芽",
        "en": "Xingya"
      },
      "region": "starfall",
      "artDirection": {
        "zh": "年轻琥珀色短毛猫，锐利轮廓、星图机械护腕、观测仪；紧绷姿态",
        "en": "Young amber shorthair, angular silhouette, star-map bracer and observatory instrument; tense posture"
      },
      "expressionNotes": "专注、争执、惊愕、信任",
      "artStatus": "unproduced",
      "narrativeRole": "support"
    },
    "lichuan": {
      "id": "lichuan",
      "name": {
        "zh": "砾川",
        "en": "Lichuan"
      },
      "region": "starfall",
      "artDirection": {
        "zh": "成年沙色长毛猫，粗粝旅装、星罗盘、长围巾，宽厚稳定的剪影",
        "en": "Adult sandy longhair, rugged caravan gear, star compass and long scarf; steady broad silhouette"
      },
      "expressionNotes": "冷幽默、怀疑、沉着、宽慰",
      "artStatus": "unproduced",
      "narrativeRole": "regional"
    }
  },
  "scenes": [
    {
      "id": "prologue:P-01",
      "chapter": "prologue",
      "title": {
        "zh": "花园醒来",
        "en": "Awake in the garden"
      },
      "previous": null,
      "lines": [],
      "requires": [],
      "choices": [],
      "lineGate": [],
      "choiceTiming": "afterDialogue"
    },
    {
      "id": "prologue:P-02",
      "chapter": "prologue",
      "title": {
        "zh": "没有名字的猫",
        "en": "A cat without a name"
      },
      "previous": "prologue:P-01",
      "lines": [],
      "requires": [],
      "choices": [],
      "lineGate": [],
      "choiceTiming": "afterDialogue"
    },
    {
      "id": "prologue:P-03",
      "chapter": "prologue",
      "title": {
        "zh": "一张不肯落地的地图",
        "en": "A map that won't land"
      },
      "previous": "prologue:P-02",
      "lines": [],
      "requires": [],
      "choices": [],
      "lineGate": [],
      "choiceTiming": "afterDialogue"
    },
    {
      "id": "prologue:P-04",
      "chapter": "prologue",
      "title": {
        "zh": "出去看看",
        "en": "Let's see what's out there"
      },
      "previous": "prologue:P-03",
      "lines": [],
      "requires": [],
      "choices": [],
      "lineGate": [],
      "choiceTiming": "afterDialogue"
    },
    {
      "id": "prologue:P-05",
      "chapter": "prologue",
      "title": {
        "zh": "第一站，风铃镇",
        "en": "First stop, Windchime Town"
      },
      "previous": "prologue:P-04",
      "lines": [],
      "requires": [
        "travel:harbor"
      ],
      "choices": [],
      "lineGate": [],
      "choiceTiming": "afterDialogue"
    },
    {
      "id": "harbor:H-01",
      "chapter": "harbor",
      "title": {
        "zh": "会逃跑的铃声",
        "en": "Catch that chime"
      },
      "previous": "prologue:P-05",
      "lines": [
        {
          "speaker": "qilan",
          "text": {
            "zh": "阿婆，蓝绳铃就在这儿！……怎么每家的铃都变成同一个声音了？",
            "en": "Grandma, your blue-ribbon bell is right here! Wait... why do all the doorbells sound the same?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "她还攥着给家里小猫买的糖呢。以前星铃碎了，也有猫这样忘事。叫我暮铃吧。",
            "en": "She's still holding candy for her kitten. Cats forgot things like this when the Star Bell broke. I'm Muling."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "刚才那个声音……我居然知道下一句怎么唱。可我连自己的名字都不记得。",
            "en": "That sound... I know the next note. But I can't even remember my name."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "它往旧铃房跑了！那里的檐灯认识老曲子。我们追上去。",
            "en": "It's headed to the old bell house! Yandeng knows the old songs. Let's catch it."
          }
        }
      ],
      "requires": [
        "npc:harbor-arrival"
      ],
      "choices": [],
      "lineGate": [
        "npc:harbor-arrival"
      ],
      "choiceTiming": "afterDialogue",
      "orderedRequires": true
    },
    {
      "id": "harbor:H-02",
      "chapter": "harbor",
      "title": {
        "zh": "穿过风铃巷",
        "en": "Through Chime Lane"
      },
      "previous": "harbor:H-01",
      "lines": [
        {
          "speaker": "qilan",
          "text": {
            "zh": "它又绕回鱼摊了！你可以跟着跑，也可以翻过矮墙，在前面截它！",
            "en": "It's looping back to the fish stall! Follow it or cut over the low wall and meet it ahead!"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "要是走散了，就摇两下铃。我听见了，一定会回你。",
            "en": "If we get separated, ring twice. When I hear you, I'll ring back."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "两下。你听，我还记得咱们的暗号。",
            "en": "Twice. See? I remember our signal."
          },
          "afterOperations": [
            "puzzle:chime-chase"
          ],
          "beat": {
            "key": "signal",
            "zh": "两声铃，第一次约定。",
            "en": "Two chimes. A first promise."
          }
        }
      ],
      "requires": [
        "puzzle:chime-chase"
      ],
      "choices": [],
      "lineGate": [],
      "choiceTiming": "afterDialogue",
      "orderedRequires": true,
      "beforeActionLines": 2
    },
    {
      "id": "harbor:H-03",
      "chapter": "harbor",
      "title": {
        "zh": "唱歌的旧房子",
        "en": "The house that hums"
      },
      "previous": "harbor:H-02",
      "lines": [
        {
          "speaker": "jiedeng",
          "text": {
            "zh": "慢着。你刚才唱的，能再唱一遍么？",
            "en": "Hold on. Can you sing what you just sang?"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "墙上少了半段，可我知道接下来是什么。为什么？",
            "en": "Half the song is missing from the wall. But I know what comes next. Why?"
          }
        },
        {
          "speaker": "jiedeng",
          "text": {
            "zh": "这就怪了。老曲子没几只猫会唱。",
            "en": "That's odd. Hardly anyone knows the old tune."
          }
        }
      ],
      "requires": [
        "npc:keeper-talk"
      ],
      "choices": [],
      "lineGate": [
        "npc:keeper-talk"
      ],
      "choiceTiming": "afterDialogue",
      "orderedRequires": true
    },
    {
      "id": "harbor:H-04",
      "chapter": "harbor",
      "title": {
        "zh": "两只猫，一场漂亮的胜利",
        "en": "Two cats, one good fight"
      },
      "previous": "harbor:H-03",
      "lines": [
        {
          "speaker": "muling",
          "text": {
            "zh": "咳、咳……打赢啦！你刚才那一下，我差点跟不上。",
            "en": "Cough... we did it! I almost couldn't keep up with that last move."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "你先别动，头上还顶着一撮灰呢。过来，我帮你拍掉。",
            "en": "Hold still. You've got dust on your head. Come here, I'll brush it off."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "……你自己也有！真是的，两只灰猫。",
            "en": "...So do you! Look at us, two dusty cats."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "下次走散，还是摇两下。别装作没听见啊。",
            "en": "If we get separated again, ring twice. No pretending you didn't hear."
          },
          "beat": {
            "key": "signal",
            "zh": "风铃巷的暗号",
            "en": "The signal from Chime Lane"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "嗯。那就一起走吧。你找名字，我也有件想弄明白的事。",
            "en": "Mm. Let's go together. You can find your name; there's something I need to figure out, too."
          }
        }
      ],
      "requires": [
        "battle:chime-beast"
      ],
      "choices": [],
      "lineGate": [
        "battle:chime-beast"
      ],
      "choiceTiming": "afterDialogue",
      "orderedRequires": true
    },
    {
      "id": "harbor:H-05",
      "chapter": "harbor",
      "title": {
        "zh": "一首我忘记的歌",
        "en": "A song I forgot"
      },
      "previous": "harbor:H-04",
      "lines": [
        {
          "speaker": "jiedeng",
          "text": {
            "zh": "蓝绳铃响对了！阿婆总算认出了等她的小猫。她让我给你们留两颗糖。",
            "en": "The blue-ribbon bell sounds right! Grandma recognized her waiting kitten. She saved two candies for you."
          },
          "beat": {
            "key": "home",
            "zh": "蓝绳铃 · 回家的声音",
            "en": "Blue-ribbon bell · The sound of home"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "这不是我醒来的花园吗？画图的猫也去过那里！",
            "en": "Isn't that the garden where I woke up? Whoever drew this has been there!"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "画图的猫认识那里，还会唱那首歌。说不定真的认识我！",
            "en": "The mapmaker knew that garden and the song. Maybe they really knew me!"
          }
        },
        {
          "speaker": "qilan",
          "text": {
            "zh": "我那张图出了镇就全是空白。要不咱们一起画第一条路？",
            "en": "My map is blank beyond the town. Want to draw the first trail together?"
          }
        },
        {
          "speaker": "jiedeng",
          "text": {
            "zh": "去吧。等阿婆的小猫听到两声铃，就知道她又回家了。你们也记得报平安。",
            "en": "Go on. When her kitten hears two chimes, it'll know Grandma's home. Let us know you're safe, too."
          }
        }
      ],
      "requires": [
        "repair:harbor",
        "melody:harbor"
      ],
      "choices": [],
      "lineGate": [
        "repair:harbor",
        "melody:harbor"
      ],
      "choiceTiming": "afterDialogue",
      "orderedRequires": true
    },
    {
      "id": "forest:R-01",
      "chapter": "forest",
      "title": {
        "zh": "会挪窝的树",
        "en": "Trees that move"
      },
      "previous": "harbor:H-05",
      "lines": [
        {
          "speaker": "yahe",
          "text": {
            "zh": "小心！桥昨晚还是朝树冠长的，今早一觉醒来，它又钻回地底了。",
            "en": "Careful! The bridge grew toward the canopy last night. This morning it went underground again."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "这张图是风铃镇找来的。你见过这片叶子吗？",
            "en": "We found this map at Windchime Town. Have you seen this leaf?"
          }
        },
        {
          "speaker": "yahe",
          "text": {
            "zh": "是呀！榆川认得老路。月叶送你，拨一下就能让桥转向。",
            "en": "It is! Yuchuan knows the old paths. Take this moonleaf; turn it to redirect the bridge."
          }
        },
        {
          "speaker": "yahe",
          "text": {
            "zh": "噗！哈哈，你头上长了颗小太阳！",
            "en": "Pfft! Ha! You've got a little sun on your head!"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "你还笑我？低头看看你自己！",
            "en": "You're laughing at me? Look at your own paws!"
          }
        }
      ],
      "requires": [
        "npc:forest-dispute"
      ],
      "choices": [],
      "lineGate": [
        "npc:forest-dispute"
      ],
      "choiceTiming": "afterDialogue",
      "orderedRequires": true
    },
    {
      "id": "forest:R-02",
      "chapter": "forest",
      "title": {
        "zh": "一条会长出来的路",
        "en": "A path that grows"
      },
      "previous": "forest:R-01",
      "lines": [
        {
          "speaker": "yuchuan",
          "text": {
            "zh": "图上少了一截。你怎么知道该往这边画？",
            "en": "A piece of the map is missing. How did you know the line goes this way?"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "不知道……就是觉得该这么走。",
            "en": "I don't know… it just felt right."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "我看得懂这几个老路标。可缺的这一笔，得靠你啦。",
            "en": "I can read these old trail marks. But that missing line is all yours."
          }
        },
        {
          "speaker": "qilan",
          "text": {
            "zh": "这次不是照着老图走啦。这一笔是咱们画的。",
            "en": "We're not just following the old map now. This line is ours."
          }
        }
      ],
      "requires": [
        "puzzle:moonleaf-crossing"
      ],
      "choices": [],
      "lineGate": [
        "puzzle:moonleaf-crossing"
      ],
      "choiceTiming": "afterDialogue",
      "orderedRequires": true
    },
    {
      "id": "forest:R-03",
      "chapter": "forest",
      "title": {
        "zh": "森林的坏梦",
        "en": "The forest's bad dream"
      },
      "previous": "forest:R-02",
      "lines": [
        {
          "speaker": "player",
          "text": {
            "zh": "暮铃，等等！那条桥又绕回去了。",
            "en": "Muling, wait! That bridge loops back again."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "好吧，这次听你的。看看哪边的桥真的接上了，我跟着你。",
            "en": "All right, your turn to lead. Find the bridge that really connects, and I'll follow."
          }
        },
        {
          "speaker": "yahe",
          "text": {
            "zh": "这边这边！桥长过来了！",
            "en": "Over here! The bridge is growing toward us!"
          },
          "afterOperations": [
            "puzzle:moonleaf-loop"
          ]
        }
      ],
      "requires": [
        "puzzle:moonleaf-loop"
      ],
      "choices": [],
      "lineGate": [],
      "choiceTiming": "afterDialogue",
      "orderedRequires": true,
      "beforeActionLines": 2
    },
    {
      "id": "forest:R-04",
      "chapter": "forest",
      "title": {
        "zh": "树记得我的爪印",
        "en": "The tree remembers my paw"
      },
      "previous": "forest:R-03",
      "lines": [
        {
          "speaker": "yuchuan",
          "text": {
            "zh": "古树露出了旧刻记。你看，花园旁有两串爪印，还有千灯城灯匠的火纹。",
            "en": "The old tree has revealed an old carving: two sets of pawprints beside the garden, and the lantern makers' mark."
          }
        },
        {
          "speaker": "qilan",
          "text": {
            "zh": "檐灯！听见没有？我们到啦！",
            "en": "Yandeng! Can you hear us? We made it!"
          }
        },
        {
          "speaker": "yahe",
          "text": {
            "zh": "这颗月叶种子送你，回去种在花园里。别拿鱼汤浇啊！",
            "en": "Take this moonleaf seed for your garden. Don't water it with fish soup!"
          },
          "beat": {
            "key": "seed",
            "zh": "一颗要带回花园的种子",
            "en": "A seed to take home"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "路明明断了，铃声却传过去了。画图的猫是不是也在找让六地重新说话的办法？",
            "en": "The path is broken, but the sound made it through. Was the mapmaker trying to let all six places talk again?"
          }
        },
        {
          "speaker": "yahe",
          "text": {
            "zh": "去千灯城问问烬婆吧。等你回来，我们再一起看看种子长成了什么样。",
            "en": "Ask Jinpo in Lantern City. When you come back, we'll see what the seed has grown into."
          }
        }
      ],
      "requires": [
        "repair:forest",
        "melody:forest"
      ],
      "choices": [],
      "lineGate": [
        "repair:forest",
        "melody:forest"
      ],
      "choiceTiming": "afterDialogue",
      "orderedRequires": true
    },
    {
      "id": "forge:E-01",
      "chapter": "forge",
      "title": {
        "zh": "全城的灯笼都在跳舞",
        "en": "A city of dancing lanterns"
      },
      "previous": "forest:R-04",
      "lines": [
        {
          "speaker": "xiaomao",
          "text": {
            "zh": "原来不用做成最漂亮的灯，也有猫愿意停下来看看。谢谢你陪我。",
            "en": "Turns out a lantern doesn't have to be the prettiest for someone to stop and watch. Thanks for helping me."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "等等……灯已经停了，台上还有一只影子在自己动。",
            "en": "Wait... the lantern stopped, but there's still a shadow moving on its own."
          }
        },
        {
          "speaker": "jinpo",
          "text": {
            "zh": "别添灯了。旧戏没散，越照越乱。",
            "en": "No more lights. The old shadows won't fade; you're just making it worse."
          }
        },
        {
          "speaker": "xiaomao",
          "text": {
            "zh": "我怕它又把我的歪耳灯弄坏……那可是我自己做的第一盏。",
            "en": "I'm afraid it'll ruin my crooked-ear lantern again... it's the first one I made myself."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "我们去看看它到底躲在哪儿。等事情结束，你来我家演一场吧。",
            "en": "Let's see where it's hiding. When this is over, come put on a show at my place."
          }
        }
      ],
      "requires": [
        "puzzle:lantern-show",
        "npc:forge-dispute"
      ],
      "choices": [],
      "lineGate": [
        "puzzle:lantern-show",
        "npc:forge-dispute"
      ],
      "choiceTiming": "afterDialogue",
      "orderedRequires": true
    },
    {
      "id": "forge:E-02",
      "chapter": "forge",
      "title": {
        "zh": "影子底下的桥",
        "en": "The bridge beneath the shadows"
      },
      "previous": "forge:E-01",
      "lines": [
        {
          "speaker": "jinpo",
          "text": {
            "zh": "这纹是我家老灯匠的。以前守铃人来过，留下个灯匣。",
            "en": "That's my family's old mark. A bellkeeper once came here and left a lantern case."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "守铃人？能让我看看么？",
            "en": "A bellkeeper? Can I see it?"
          }
        },
        {
          "speaker": "xiaomao",
          "text": {
            "zh": "先把灯往这边挪。桥就在底下，照亮就能走！",
            "en": "Move the lantern this way first. The bridge is right there; we just need to light it up!"
          }
        }
      ],
      "requires": [
        "puzzle:shadow-bridge"
      ],
      "choices": [],
      "lineGate": [],
      "choiceTiming": "afterDialogue",
      "orderedRequires": true,
      "beforeActionLines": 3
    },
    {
      "id": "forge:E-03",
      "chapter": "forge",
      "title": {
        "zh": "最大的影子猫",
        "en": "The biggest shadow cat"
      },
      "previous": "forge:E-02",
      "lines": [
        {
          "speaker": "xiaomao",
          "text": {
            "zh": "它散开啦！你看，幕布上的影子又跟得上我们了！",
            "en": "It’s gone! Look, the shadows on the screen are following us again!"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "多亏你扶稳了灯，小铆。不然它早就溜回暗处了。",
            "en": "Good thing you held that light steady, Xiaomao. It would’ve slipped back into the dark."
          }
        },
        {
          "speaker": "jinpo",
          "text": {
            "zh": "好啦，这回轮到我们点灯。小铆，把那盏歪耳灯也挂上吧。",
            "en": "Now let’s light up the festival. Xiaomao, hang up your crooked-ear lantern too."
          }
        }
      ],
      "requires": [
        "battle:shadow-beast"
      ],
      "choices": [],
      "lineGate": [
        "battle:shadow-beast"
      ],
      "choiceTiming": "afterDialogue",
      "orderedRequires": true
    },
    {
      "id": "forge:E-04",
      "chapter": "forge",
      "title": {
        "zh": "把星星挂回夜空",
        "en": "Hang the stars back up"
      },
      "previous": "forge:E-03",
      "lines": [
        {
          "speaker": "jinpo",
          "text": {
            "zh": "这月牙印是月镜书库的。以前巡铃人从云脊那扇月门进去。想查名字，去那儿。",
            "en": "That crescent is Moonmirror Library's seal. The old bellkeepers entered through a moon gate in Skyspine. Look for your name there."
          }
        },
        {
          "speaker": "jinpo",
          "text": {
            "zh": "我想起来了。那是落星之后。那猫说，要是哪天有谁忘了怎么回家，就把这匣子给它。",
            "en": "I remember now. It was after the star fell. The cat said, if someone ever forgot the way home, I should give them this case."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "它怎么知道会有猫忘了回家？为什么连我醒来的花园都画了进去？",
            "en": "How did they know a cat would forget the way home? Why did they draw the garden where I woke up?"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "而且这条线画到一半就停了。那只猫后来没能走完吗？",
            "en": "And this line stops halfway. Did the mapmaker never finish the journey?"
          }
        },
        {
          "speaker": "jinpo",
          "text": {
            "zh": "不知道。书库留着那时候的画，去那儿看看吧。",
            "en": "I don't know. The library keeps pictures from those days. Have a look there."
          }
        },
        {
          "speaker": "xiaomao",
          "text": {
            "zh": "歪耳灯送你！暮铃还给它添了颗星。下次在你家演，记得给我留个位子。",
            "en": "The crooked-ear lantern is yours! Muling added a star. Save me a spot at your garden show."
          },
          "beat": {
            "key": "lantern",
            "zh": "歪耳灯 · 花园里的下一场影戏",
            "en": "The crooked-ear lantern · A show in the garden"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "非得飞过去啊？……那你们可不许笑。",
            "en": "We really have to fly there? …No laughing, all right?"
          }
        }
      ],
      "requires": [
        "repair:forge",
        "melody:forge"
      ],
      "choices": [],
      "lineGate": [
        "repair:forge",
        "melody:forge"
      ],
      "choiceTiming": "afterDialogue",
      "orderedRequires": true
    },
    {
      "id": "sky:S-01",
      "chapter": "sky",
      "title": {
        "zh": "第一次飞上云端",
        "en": "First flight above the clouds"
      },
      "previous": "forge:E-04",
      "lines": [
        {
          "speaker": "yuanfan",
          "text": {
            "zh": "飞得不错！刚才那朵云像条大鱼，下次咱们从鱼嘴里钻过去！",
            "en": "Nice flying! That cloud looked like a big fish. Next time let's fly through its mouth!"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "谁怕高了？我就是看看……地还在不在。",
            "en": "Scared of heights? Me? I'm just checking… the ground's still there."
          }
        },
        {
          "speaker": "lingyu",
          "text": {
            "zh": "记住刚才那个落脚的办法，前面可就没有这么平坦了。",
            "en": "Remember how you landed. The next stretch won't be as gentle."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "我自己来。你们飞慢一点就好。",
            "en": "I'll do it myself. Just don't fly too fast."
          }
        }
      ],
      "requires": [
        "puzzle:sky-pouch",
        "npc:sky-dispute"
      ],
      "choices": [],
      "lineGate": [
        "puzzle:sky-pouch",
        "npc:sky-dispute"
      ],
      "choiceTiming": "afterDialogue",
      "orderedRequires": true
    },
    {
      "id": "sky:S-02",
      "chapter": "sky",
      "title": {
        "zh": "地图上没有的岛",
        "en": "The island not on the map"
      },
      "previous": "sky:S-01",
      "lines": [
        {
          "speaker": "lingyu",
          "text": {
            "zh": "图上这两座山我认得。月门就在中间，云把它挡住了。",
            "en": "I recognize those two peaks. The moon gate lies between them, behind the clouds."
          }
        },
        {
          "speaker": "yuanfan",
          "text": {
            "zh": "咱们刚飞过的云层后面，露出了个亮闪闪的尖儿。看见了吗？",
            "en": "Something’s glinting behind the clouds we just flew past. Can you see the tip of it?"
          }
        },
        {
          "speaker": "qilan",
          "text": {
            "zh": "我把找到的路画下来，下次就不会迷路了。",
            "en": "I'll mark the route we found, so we won't get lost next time."
          }
        }
      ],
      "requires": [
        "explore:flight-recorder"
      ],
      "choices": [
        {
          "id": "lead",
          "label": {
            "zh": "让远帆领飞",
            "en": "Let Yuanfan lead"
          },
          "npc": "yuanfan",
          "method": "fast-courier"
        },
        {
          "id": "train",
          "label": {
            "zh": "先共同训练航线",
            "en": "Train on a joint route first"
          },
          "npc": "lingyu",
          "method": "escort-flight"
        }
      ],
      "lineGate": [
        "explore:flight-recorder"
      ],
      "choiceTiming": "afterDialogue"
    },
    {
      "id": "sky:S-03",
      "chapter": "sky",
      "title": {
        "zh": "倒流的云瀑",
        "en": "The upside-down waterfall"
      },
      "previous": "sky:S-02",
      "lines": [
        {
          "speaker": "yuanfan",
          "text": {
            "zh": "借这股风往上飞！前面就是月牙岩！",
            "en": "Ride this updraft! That's the crescent rock ahead!"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "暮铃，快到了！",
            "en": "Muling, we're almost there!"
          },
          "afterOperations": [
            "puzzle:joint-flight"
          ]
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "我还没到呢，围巾倒先飞过去了！",
            "en": "My scarf made it before I did!"
          },
          "afterOperations": [
            "puzzle:joint-flight"
          ]
        },
        {
          "speaker": "lingyu",
          "text": {
            "zh": "看，月门就在前面。走哪条路都能飞到这里。",
            "en": "Look, the moon gate is just ahead. Either route leads here."
          },
          "afterOperations": [
            "melody:sky",
            "puzzle:joint-flight"
          ]
        },
        {
          "speaker": "jinpo",
          "text": {
            "zh": "喂！云上那只小金猫，歪耳灯还好好的吧？",
            "en": "Hey, little golden cat in the clouds! Is that crooked-ear lantern still in one piece?"
          },
          "afterOperations": [
            "melody:sky",
            "puzzle:joint-flight"
          ]
        },
        {
          "speaker": "player",
          "text": {
            "zh": "好好的！等回去，我给小铆讲云朵怎么从我们脚底下跑过去。",
            "en": "It's safe! When I come back, I'll tell Xiaomao how the clouds ran under our paws."
          },
          "afterOperations": [
            "melody:sky",
            "puzzle:joint-flight"
          ]
        }
      ],
      "requires": [
        "puzzle:joint-flight",
        "repair:sky",
        "melody:sky"
      ],
      "choices": [],
      "lineGate": [],
      "choiceTiming": "afterDialogue",
      "orderedRequires": true,
      "beforeActionLines": 1
    },
    {
      "id": "sky:S-04",
      "chapter": "sky",
      "title": {
        "zh": "留着的那杯茶",
        "en": "A cup for someone missing"
      },
      "previous": "sky:S-03",
      "lines": [
        {
          "speaker": "muling",
          "text": {
            "zh": "以前有只猫跟我说，等忙完了，回花园喝茶。",
            "en": "Someone once told me we'd have tea in the garden when all our work was done."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "那后来呢？",
            "en": "What happened after that?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "……那杯茶，我就一直留着。",
            "en": "…I've kept a cup for them ever since."
          },
          "beat": {
            "key": "tea",
            "zh": "两杯茶",
            "en": "Two cups of tea"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "那我陪你坐一会儿。",
            "en": "I'll sit with you for a while, then."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "好。今天先记住今天吧。",
            "en": "Okay. Let's remember today for what it is."
          }
        }
      ],
      "requires": [
        "npc:broken-pendant"
      ],
      "choices": [
        {
          "id": "joke",
          "npc": "muling",
          "method": "tea-joke",
          "label": {
            "zh": "开个玩笑，让她放松一下",
            "en": "Lighten the mood with a joke"
          }
        },
        {
          "id": "company",
          "npc": "muling",
          "method": "tea-company",
          "label": {
            "zh": "安静地陪她坐一会儿",
            "en": "Sit with her for a while"
          }
        },
        {
          "id": "search",
          "npc": "muling",
          "method": "tea-search",
          "label": {
            "zh": "愿意陪你一起找",
            "en": "I'll help you look"
          }
        }
      ],
      "lineGate": [
        "npc:broken-pendant"
      ],
      "choiceTiming": "afterDialogue",
      "choiceAt": 3,
      "choiceResponses": {
        "joke": [
          {
            "speaker": "player",
            "text": {
              "zh": "下次可得把茶杯系在围巾上，省得飞丢了。",
              "en": "Next time, tie the cups to your scarf so they don't fly away."
            }
          },
          {
            "speaker": "muling",
            "text": {
              "zh": "那围巾可要收两份飞行费了。",
              "en": "Then my scarf gets to charge two airfares."
            }
          }
        ],
        "company": [
          {
            "speaker": "player",
            "text": {
              "zh": "那我陪你坐一会儿。",
              "en": "I'll sit with you for a while, then."
            }
          },
          {
            "speaker": "muling",
            "text": {
              "zh": "好。今天先记住今天吧。",
              "en": "Okay. Let's remember today for what it is."
            }
          }
        ],
        "search": [
          {
            "speaker": "player",
            "text": {
              "zh": "等找到我的名字，咱们也去找你那位朋友！下回多带一只杯子。",
              "en": "Once we find my name, let's look for your friend too! We'll bring another cup next time."
            }
          },
          {
            "speaker": "muling",
            "text": {
              "zh": "那……说定了。",
              "en": "Then… it's a promise."
            }
          }
        ]
      }
    },
    {
      "id": "sky:S-05",
      "chapter": "sky",
      "title": {
        "zh": "月门那边的访客",
        "en": "The visitor through the moon gate"
      },
      "previous": "sky:S-04",
      "lines": [
        {
          "speaker": "yuanfan",
          "text": {
            "zh": "月门就在前面！我想继续探路，你们愿意带上我吗？",
            "en": "The moon gate is just ahead! May I come along and scout the next route?"
          }
        },
        {
          "speaker": "baikan",
          "text": {
            "zh": "前阵子也有只猫从月门借走了星铃的老图，问的是怎么打开旧封印。",
            "en": "Someone recently came through the moon gate and borrowed an old Star Bell map. They wanted to know how to open the seal."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "等等。如果有人打开过封印……失忆会不会是那之后才回来的？",
            "en": "Wait. If someone opened the seal... could the forgetting have returned afterward?"
          }
        },
        {
          "speaker": "baikan",
          "text": {
            "zh": "借阅记录还在。先进来，等你看过壁画，也许就明白该问什么了。",
            "en": "The borrowing record is still here. Come inside. After you see the murals, you may know what to ask."
          }
        }
      ],
      "requires": [],
      "choices": [],
      "lineGate": [],
      "choiceTiming": "afterDialogue"
    },
    {
      "id": "library:M-01",
      "chapter": "library",
      "title": {
        "zh": "一面走得进去的镜子",
        "en": "A mirror you can walk through"
      },
      "previous": "sky:S-05",
      "lines": [
        {
          "speaker": "baikan",
          "text": {
            "zh": "这些镜子可不一般。你站过来，瞧，里头还留着从前的景象呢。",
            "en": "These aren't ordinary mirrors. Stand here. See? They still hold scenes from the past."
          }
        },
        {
          "speaker": "moye",
          "text": {
            "zh": "旧画尽管看。只是别猫的私事，没点头就不要翻。",
            "en": "Look at the old public pictures all you like. Leave private memories alone unless their owners say otherwise."
          }
        },
        {
          "speaker": "yuanfan",
          "text": {
            "zh": "刚才白栞说，有猫查过旧封印。说不定这里能找到线索。",
            "en": "Baikan said someone looked into the old seal. Maybe we'll find a clue here."
          }
        },
        {
          "speaker": "baikan",
          "text": {
            "zh": "走，去镜廊！那里还留着从前风铃镇的样子。",
            "en": "Come on, to the gallery! It still holds pictures of Windchime Town as it used to be."
          }
        }
      ],
      "requires": [
        "npc:archive-dispute"
      ],
      "choices": [],
      "lineGate": [
        "npc:archive-dispute"
      ],
      "choiceTiming": "afterDialogue",
      "orderedRequires": true
    },
    {
      "id": "library:M-02",
      "chapter": "library",
      "title": {
        "zh": "假的暮铃",
        "en": "The other Muling"
      },
      "previous": "library:M-01",
      "lines": [
        {
          "speaker": "player",
          "text": {
            "zh": "暮铃，刚才有两只猫同时摇了铃。",
            "en": "Muling, two cats just rang their bells at once."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "听见了。过来吧。",
            "en": "Heard you. Come on over."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "风铃巷说好的，走散了就摇两下。假暮铃只会学声音，真的你才会找我。",
            "en": "Our promise in Chime Lane: ring twice if we get separated. The fake copied the sound. Only you came looking for me."
          },
          "beat": {
            "key": "signal",
            "zh": "风铃巷的暗号",
            "en": "The signal from Chime Lane"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "走吧。那边的门是真的。",
            "en": "Come on. That door over there is real."
          }
        },
        {
          "speaker": "lingyu",
          "text": {
            "zh": "书库那边听得见吗？云海这边一切平安！",
            "en": "Moonmirror, can you hear us? All is well above the clouds!"
          },
          "afterOperations": [
            "melody:library"
          ]
        },
        {
          "speaker": "moye",
          "text": {
            "zh": "听见了！你们的铃声传到这里来了。",
            "en": "We hear you! Your bells reached the library."
          },
          "afterOperations": [
            "melody:library"
          ]
        }
      ],
      "requires": [
        "puzzle:library-echo",
        "repair:library",
        "melody:library"
      ],
      "choices": [],
      "lineGate": [
        "puzzle:library-echo"
      ],
      "choiceTiming": "afterDialogue",
      "orderedRequires": true
    },
    {
      "id": "library:M-03",
      "chapter": "library",
      "title": {
        "zh": "原来你认识我",
        "en": "You knew me"
      },
      "previous": "library:M-02",
      "lines": [
        {
          "speaker": "player",
          "text": {
            "zh": "画里这只猫……是我？",
            "en": "That cat in the mural… is me?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "是。",
            "en": "Yes."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "旁边是你。你从花园见到我时就认识我？",
            "en": "And that's you beside me. You knew me when we met in the garden?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "认识。我们一起守过星铃。花园里那两只杯子……本来就是我们的。",
            "en": "I knew you. We guarded the Star Bell together. Those two cups in the garden... they were ours."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "那我是谁？",
            "en": "Then who am I?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "你是第一位守铃人。当年为了让灾难停下来，你把自己的名字和记忆留在了星铃里。",
            "en": "You were the First Bellkeeper. To stop the disaster, you left your name and memories inside the Star Bell."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "所以这一路，你都知道我在找的是谁。只有我不知道。",
            "en": "So all this time, you knew who I was looking for. I was the only one who didn't."
          },
          "beat": {
            "key": "fracture",
            "zh": "同一段旅程，两种记忆。",
            "en": "One journey, two sets of memories."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "……我怕你想起来以后，又会把自己留下。可我知道，我不该替你决定什么时候知道。",
            "en": "...I was afraid you'd remember and choose to leave yourself behind again. But I know it wasn't mine to decide when you should know."
          }
        }
      ],
      "requires": [
        "npc:identity-confrontation"
      ],
      "choices": [
        {
          "id": "details",
          "npc": "muling",
          "method": "identity-details",
          "label": {
            "zh": "我想知道更多事实",
            "en": "I want to know more"
          }
        },
        {
          "id": "hurt",
          "npc": "muling",
          "method": "identity-hurt",
          "label": {
            "zh": "我觉得受伤",
            "en": "I feel hurt"
          }
        },
        {
          "id": "space",
          "npc": "muling",
          "method": "identity-space",
          "label": {
            "zh": "我需要一点时间",
            "en": "I need some time"
          }
        }
      ],
      "lineGate": [
        "npc:identity-confrontation"
      ],
      "choiceTiming": "afterDialogue"
    },
    {
      "id": "library:M-04",
      "chapter": "library",
      "title": {
        "zh": "那串不该响起的铃声",
        "en": "The bell that should have stayed silent"
      },
      "previous": "library:M-03",
      "lines": [
        {
          "speaker": "baikan",
          "text": {
            "zh": "借图的印记……暮铃，这不是你那只铃坠么？",
            "en": "The mark on the borrowing record… Muling, isn't that your pendant?"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "等一下。那天封印松了，失忆就又开始了？暮铃，我想听你自己说。",
            "en": "Wait. The forgetting started again the day the seal was loosened? Muling, I want to hear it from you."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "……是我。我松开了封印，才让你醒过来。那时我知道别的猫也可能开始忘事。",
            "en": "…It was me. I loosened the seal so you'd wake up. I knew the other cats might start forgetting again."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "那天阿婆攥着糖，连要给谁都忘了。你站在我旁边……你知道为什么？",
            "en": "Grandma was holding candy and couldn't remember who it was for. You were standing beside me... you knew why?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "知道。我想让你回来，又怕你知道代价之后就不肯跟我走。我不敢说。",
            "en": "I knew. I wanted you back, and I was afraid you'd leave if you knew the cost. I was afraid to tell you."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "那些铃也是你故意调过去的？",
            "en": "And you turned those bells toward the center on purpose?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "是。我想留一条能救回你的路。可我没有问过你，也没有问过那些猫。对不起。",
            "en": "Yes. I wanted a way to save you. But I never asked you, or any of those cats. I'm sorry."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "我在云上还以为你在等另一个朋友。你明明知道，却让我一直蒙在鼓里。",
            "en": "Up in the clouds, I thought you were waiting for someone else. You knew everything, and you kept me in the dark."
          },
          "beat": {
            "key": "fracture",
            "zh": "一时无话",
            "en": "A moment of silence"
          }
        }
      ],
      "requires": [
        "explore:routing-record"
      ],
      "choices": [
        {
          "id": "anger",
          "label": {
            "zh": "我很愤怒",
            "en": "I'm angry"
          },
          "npc": "muling",
          "method": "anger"
        },
        {
          "id": "distance",
          "label": {
            "zh": "我需要一点距离",
            "en": "I need some distance"
          },
          "npc": "muling",
          "method": "distance"
        },
        {
          "id": "understand",
          "label": {
            "zh": "我想理解，但这不能改变你做过的事",
            "en": "I want to understand, but it doesn't change what you did"
          },
          "npc": "muling",
          "method": "understand"
        }
      ],
      "lineGate": [
        "explore:routing-record"
      ],
      "choiceTiming": "afterDialogue"
    },
    {
      "id": "library:M-05",
      "chapter": "library",
      "title": {
        "zh": "如果铃声只能属于一个人",
        "en": "If the song belonged to only one cat"
      },
      "previous": "library:M-04",
      "lines": [
        {
          "speaker": "moye",
          "text": {
            "zh": "看这个模型。旧记录里有两种让星铃重新响起的办法。白栞，你带上记录。",
            "en": "Look at this model. The old records show two ways to make the Star Bell ring again. Baikan, take the records."
          }
        },
        {
          "speaker": "baikan",
          "text": {
            "zh": "第一种把所有记忆收进星铃。第二种让六座铃彼此唱和，各自的记忆都能留下。",
            "en": "The first sends everyone's memories into the Star Bell. The second lets six bells answer one another, so every cat keeps their own memories."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "要是我选中央那条路，阿婆又会不认识她的小猫，小铆也会忘了自己的灯？",
            "en": "If I choose the central path, Grandma forgets her kitten again, and Xiaomao forgets his lantern?"
          },
          "afterOperations": [
            "puzzle:two-route-model"
          ]
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "我把铃修过好多次，可没有你，它们唱不起来。要是再失败，大家还是会慢慢忘掉一切。",
            "en": "I repaired those bells so many times, but without you they wouldn't sing. If we fail again, everyone will slowly forget everything."
          },
          "afterOperations": [
            "puzzle:two-route-model"
          ]
        },
        {
          "speaker": "baikan",
          "text": {
            "zh": "风铃镇的家铃、森林的月叶、千灯城的影戏、云海上的风铃……大家已经在互相报平安了。",
            "en": "The house bells, the moonleaves, the lantern show, the wind chimes above the clouds… our friends are already answering each other."
          },
          "afterOperations": [
            "puzzle:two-route-model"
          ]
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "中央撑不了太久了。我先去稳住它。……我知道，你现在可能不想跟我一起走。",
            "en": "The center won't hold much longer. I'll go steady it. ...I know you may not want to walk with me right now."
          },
          "afterOperations": [
            "puzzle:two-route-model"
          ]
        },
        {
          "speaker": "player",
          "text": {
            "zh": "我还没决定怎么面对她，但我知道不能拿大家的记忆换我的。白栞，走吧。还有最后一座铃没响。",
            "en": "I haven't decided how to face her. But I know I can't trade everyone's memories for mine. Baikan, let's go. One last bell hasn't rung."
          },
          "afterOperations": [
            "puzzle:two-route-model"
          ]
        }
      ],
      "requires": [
        "npc:two-routes",
        "puzzle:two-route-model"
      ],
      "choices": [],
      "lineGate": [
        "npc:two-routes"
      ],
      "choiceTiming": "afterDialogue",
      "orderedRequires": true,
      "beforeActionLines": 2
    },
    {
      "id": "starfall:F-01",
      "chapter": "starfall",
      "title": {
        "zh": "踩着星光走",
        "en": "Walking on starlight"
      },
      "previous": "library:M-05",
      "lines": [
        {
          "speaker": "lichuan",
          "text": {
            "zh": "两条星路都能过来。记住亮过的石头，回去时还有路可走。",
            "en": "Both star paths lead here. Remember which stones lit up, and you’ll have a way back."
          }
        },
        {
          "speaker": "xingya",
          "text": {
            "zh": "刚才有只银色的猫过去了。你是来找她的？",
            "en": "A silver cat went by a little while ago. Are you looking for her?"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "嗯。我还有话没跟她说完。",
            "en": "Yeah. We still have something to talk about."
          }
        }
      ],
      "requires": [
        "npc:central-dispute-lichuan",
        "npc:central-dispute",
        "puzzle:star-steps"
      ],
      "choices": [],
      "lineGate": [
        "npc:central-dispute-lichuan",
        "npc:central-dispute",
        "puzzle:star-steps"
      ],
      "choiceTiming": "afterDialogue",
      "orderedRequires": true
    },
    {
      "id": "starfall:F-02",
      "chapter": "starfall",
      "title": {
        "zh": "星铃破碎的那一天",
        "en": "The day the bell broke"
      },
      "previous": "starfall:F-01",
      "lines": [
        {
          "speaker": "muling",
          "text": {
            "zh": "再给我们一点时间。我们还可以一起找办法！",
            "en": "Give us more time. We can still find a way together!"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "风铃镇已经有猫认不出家人了。再等下去，会有更多猫失去自己。",
            "en": "Cats in Windchime Town can no longer recognize their families. If we wait, more will lose themselves."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "那让我跟你一起去。",
            "en": "Then let me go with you."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "星铃需要一个不会消失的记忆才能安静下来。用我的吧。",
            "en": "The Star Bell needs a memory that won't disappear before it can fall quiet. Use mine."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "那你答应我，别放弃回来的办法。",
            "en": "Then promise you won't give up on finding a way back."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "我答应你。",
            "en": "I promise."
          }
        }
      ],
      "requires": [
        "explore:catastrophe-record",
        "cinematic:starfall-memory"
      ],
      "choices": [],
      "lineGate": [
        "explore:catastrophe-record"
      ],
      "choiceTiming": "afterDialogue",
      "orderedRequires": true
    },
    {
      "id": "starfall:F-03",
      "chapter": "starfall",
      "title": {
        "zh": "等了太久的猫",
        "en": "The cat who waited too long"
      },
      "previous": "starfall:F-02",
      "lines": [
        {
          "speaker": "muling",
          "text": {
            "zh": "我每天泡两杯茶。刚开始还会换热水，后来只要听见铃响就跑到门口。可是你一直没回来。",
            "en": "I made two cups of tea every day. At first I'd refill them. Later, every bell made me run to the door. But you never came home."
          },
          "beat": {
            "key": "tea",
            "zh": "从前的约定",
            "en": "A promise from the past"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "你怕的不只是我忘记你。你也快忘了我们在一起的日子，是吗？",
            "en": "You weren't only afraid I'd forget you. You were starting to forget our days together, weren't you?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "嗯。我害怕最后连那杯茶是给谁的都不记得。我就……只顾着把你找回来。",
            "en": "Yes. I was afraid I'd forget who the other cup was for. So I... only thought about bringing you back."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "那栖蓝呢？她的地图才画了一条路。芽禾还等着看月叶。小铆连影戏都约好了。",
            "en": "What about Qilan? She's only drawn one trail. Yahe's waiting to see the moonleaf grow. Xiaomao's already promised us a show."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "就算旧记忆回来了，我也不想失去现在这些朋友。",
            "en": "Even if my old memories return, I don't want to lose the friends I have now."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "这次别替我选，也别替他们选。让大家自己回应，好不好？",
            "en": "This time don't choose for me, or for them. Let everyone answer for themselves, all right?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "好。我不碰那把锁。你说什么时候开始，我就什么时候回铃。",
            "en": "Okay. I won't touch the lock. When you're ready to begin, I'll answer."
          }
        }
      ],
      "requires": [
        "npc:central-ruin"
      ],
      "choices": [],
      "lineGate": [
        "npc:central-ruin"
      ],
      "choiceTiming": "afterDialogue",
      "orderedRequires": true
    },
    {
      "id": "starfall:F-04",
      "chapter": "starfall",
      "title": {
        "zh": "世界在唱另一首歌",
        "en": "The world sings a different song"
      },
      "previous": "starfall:F-03",
      "lines": [
        {
          "speaker": "jiedeng",
          "text": {
            "zh": "小金猫！听见了。阿婆刚才还问你什么时候回来呢！",
            "en": "Little golden cat! We hear you. Grandma was just asking when you're coming back!"
          }
        },
        {
          "speaker": "yahe",
          "text": {
            "zh": "眠根林也在！等月叶长大了，记得叫我去看！",
            "en": "Rootsleep is here! Call me when your moonleaf grows!"
          }
        },
        {
          "speaker": "xingya",
          "text": {
            "zh": "听，最后一座铃也接上了！六个声音，没有一个被盖掉。",
            "en": "Listen, the last bell has joined in! Six voices, and not one has been drowned out."
          },
          "beat": {
            "key": "home",
            "zh": "六座铃，六个声音。",
            "en": "Six bells, six voices."
          }
        },
        {
          "speaker": "jiedeng",
          "text": {
            "zh": "小金猫，回来的时候记得叫我们一声。",
            "en": "Little golden cat, give us a ring when you get home."
          }
        }
      ],
      "requires": [
        "puzzle:distributed-routing",
        "repair:starfall",
        "melody:starfall"
      ],
      "choices": [],
      "lineGate": [
        "puzzle:distributed-routing",
        "repair:starfall",
        "melody:starfall"
      ],
      "choiceTiming": "afterDialogue",
      "orderedRequires": true
    },
    {
      "id": "starfall:F-05",
      "chapter": "starfall",
      "title": {
        "zh": "最后一声错误的铃",
        "en": "The last wrong chime"
      },
      "previous": "starfall:F-04",
      "lines": [
        {
          "speaker": "player",
          "text": {
            "zh": "刚才六地都送来了自己的回应。咦……这盏灯是哪来的？",
            "en": "Each region sent its own reply. Huh… where did this lantern come from?"
          },
          "narration": false
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "千灯城呀！咱俩一起做的！……那一声，跟当年一模一样。",
            "en": "Lantern City! We made it together! …That sound was exactly like last time."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "等等，你看！砾川那边又亮了。还没完呢！我们一起守住它们的声音。",
            "en": "Wait, look! Lichuan's light is back. It's not over yet! Let's protect their voices together."
          }
        }
      ],
      "requires": [
        "cinematic:inward-call"
      ],
      "choices": [],
      "lineGate": [],
      "choiceTiming": "afterDialogue"
    },
    {
      "id": "finale:B-01",
      "chapter": "finale",
      "title": {
        "zh": "不要替我选择",
        "en": "Don't choose for me"
      },
      "previous": "starfall:F-05",
      "lines": [
        {
          "speaker": "muling",
          "text": {
            "zh": "别碰那把锁！再这样下去，你连这一路的事都要忘了！",
            "en": "Don't touch that lock! At this rate you'll forget our whole journey too!"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "这次我不是一个人。",
            "en": "This time, I'm not alone."
          }
        }
      ],
      "requires": [
        "battle:inward-gates"
      ],
      "choices": [],
      "lineGate": [
        "battle:inward-gates"
      ],
      "choiceTiming": "afterDialogue"
    },
    {
      "id": "finale:B-02",
      "chapter": "finale",
      "title": {
        "zh": "不会回答的声音",
        "en": "A voice that cannot answer"
      },
      "previous": "finale:B-01",
      "lines": [
        {
          "speaker": "muling",
          "narration": true,
          "text": {
            "zh": "假回响：我会在这里等你。",
            "en": "False echo: I'll wait for you here."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "你只会说这一句。那你知道我们说好在什么地方喝茶吗？",
            "en": "That's all you ever say. Do you know where we promised to have tea?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "别听它的！它就会学刚才那句，根本不管你说了什么！",
            "en": "Don't listen to it! It just repeats the last line, no matter what you say!"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "是我把他们的声音压下去了。够了！",
            "en": "I'm the one drowning out their voices. No more!"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "我把它停了。小心，剩下的回响全过来了！",
            "en": "I've stopped it. Watch out—the echoes are all coming this way!"
          }
        }
      ],
      "requires": [
        "battle:identify-echo"
      ],
      "choices": [],
      "lineGate": [
        "battle:identify-echo"
      ],
      "choiceTiming": "afterDialogue"
    },
    {
      "id": "finale:B-03",
      "chapter": "finale",
      "title": {
        "zh": "六个不同的声音",
        "en": "Six different voices"
      },
      "previous": "finale:B-02",
      "lines": [
        {
          "speaker": "jiedeng",
          "text": {
            "zh": "听见你了！",
            "en": "We hear you!"
          }
        },
        {
          "speaker": "jinpo",
          "text": {
            "zh": "往亮处来！",
            "en": "Come into the light!"
          }
        },
        {
          "speaker": "xingya",
          "text": {
            "zh": "接上了！这次没断！",
            "en": "It's connected! It's holding!"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "大家……都还记得自己是谁。",
            "en": "Everyone… still remembers who they are."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "听见了吗？是他们自己的声音。暮铃，开吧。",
            "en": "Hear that? Those are their own voices. Muling, open it."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "这次我听你的。一起回家。",
            "en": "This time, I'm listening. Let's go home together."
          }
        }
      ],
      "requires": [
        "battle:central-echo",
        "mechanism:muling-unlock"
      ],
      "choices": [],
      "lineGate": [
        "battle:central-echo"
      ],
      "choiceTiming": "afterDialogue"
    },
    {
      "id": "finale:B-04",
      "chapter": "finale",
      "title": {
        "zh": "星铃重新响了",
        "en": "The bell rings again"
      },
      "previous": "finale:B-03",
      "lines": [
        {
          "speaker": "muling",
          "text": {
            "zh": "你……还记得我吗？",
            "en": "Do you… remember me?"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "记得。以前说好了回花园喝茶。也记得风铃巷的两下铃，月叶的花粉，还有那盏歪耳灯。",
            "en": "I do. We promised tea in the garden. I remember the two chimes in Chime Lane, the moonleaf pollen, and the crooked-ear lantern."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "还有我做错的事。",
            "en": "And the things I did wrong."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "也记得。我们先去看看阿婆和小铆吧。还有些事得慢慢做。茶凉了，可以再泡。",
            "en": "That too. Let's visit Grandma and Xiaomao first. Some things will take time. We can make fresh tea."
          }
        }
      ],
      "requires": [
        "cinematic:final-note"
      ],
      "choices": [],
      "lineGate": [],
      "choiceTiming": "afterDialogue"
    },
    {
      "id": "epilogue:E-01",
      "chapter": "epilogue",
      "title": {
        "zh": "世界又热闹起来了",
        "en": "The world is lively again"
      },
      "previous": "finale:B-04",
      "lines": [],
      "requires": [],
      "choices": [],
      "lineGate": [],
      "choiceTiming": "afterDialogue"
    },
    {
      "id": "epilogue:E-02",
      "chapter": "epilogue",
      "title": {
        "zh": "道歉不只是说对不起",
        "en": "More than an apology"
      },
      "previous": "epilogue:E-01",
      "lines": [
        {
          "speaker": "muling",
          "text": {
            "zh": "封印是我打开的。阿婆连家里的小猫都忘了……是我害的。对不起。",
            "en": "I opened the seal. Gran forgot the kitten waiting at home… because of me. I'm sorry."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "我想先把坏掉的蓝绳铃修好。你愿意让我帮忙吗？",
            "en": "I'd like to start by fixing the broken blue-ribbon bell. Will you let me help?"
          }
        },
        {
          "speaker": "jiedeng",
          "text": {
            "zh": "那就从这儿开始吧。别的事，慢慢来。",
            "en": "Then let's start here. The rest will take time."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "嗯。要是还有哪家需要帮忙，告诉我一声。",
            "en": "Okay. Let me know if any other families need help."
          }
        }
      ],
      "requires": [
        "npc:public-accountability"
      ],
      "choices": [
        {
          "id": "listen",
          "npc": "muling",
          "method": "accountability-listen",
          "label": {
            "zh": "听他们把话说完",
            "en": "Hear them out"
          }
        },
        {
          "id": "help",
          "npc": "muling",
          "method": "accountability-help",
          "label": {
            "zh": "愿意陪她一起修铃",
            "en": "Offer to mend bells with her"
          }
        },
        {
          "id": "space",
          "npc": "muling",
          "method": "accountability-space",
          "label": {
            "zh": "给大家留一点时间",
            "en": "Give everyone some time"
          }
        }
      ],
      "lineGate": [],
      "choiceTiming": "afterDialogue"
    },
    {
      "id": "epilogue:E-03",
      "chapter": "epilogue",
      "title": {
        "zh": "第二把钥匙",
        "en": "The second key"
      },
      "previous": "epilogue:E-02",
      "lines": [
        {
          "speaker": "muling",
          "text": {
            "zh": "那两杯茶……以后我还可以泡吗？",
            "en": "Those two cups of tea... may I keep making them?"
          },
          "beat": {
            "key": "tea",
            "zh": "回到花园",
            "en": "Back in the garden"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "可以。不过下次有事先告诉我。就算意见不同，咱们也可以一起想办法。",
            "en": "Yes. But tell me first next time. Even if we disagree, we can work things out together."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "那……我可以有一把花园钥匙吗？",
            "en": "Then… may I have a garden key?"
          }
        }
      ],
      "requires": [
        "npc:second-garden-key"
      ],
      "choices": [],
      "lineGate": [],
      "choiceTiming": "afterDialogue"
    }
  ],
  "side": [
    {
      "id": "postgame:letter-harbor",
      "region": "harbor",
      "operation": "postgame:repair-harbor"
    },
    {
      "id": "postgame:reunion-harbor",
      "region": "harbor",
      "operation": "postgame:meet-harbor"
    },
    {
      "id": "postgame:letter-forest",
      "region": "forest",
      "operation": "postgame:repair-forest"
    },
    {
      "id": "postgame:reunion-forest",
      "region": "forest",
      "operation": "postgame:meet-forest"
    },
    {
      "id": "postgame:letter-forge",
      "region": "forge",
      "operation": "postgame:repair-forge"
    },
    {
      "id": "postgame:reunion-forge",
      "region": "forge",
      "operation": "postgame:meet-forge"
    },
    {
      "id": "postgame:letter-sky",
      "region": "sky",
      "operation": "postgame:repair-sky"
    },
    {
      "id": "postgame:reunion-sky",
      "region": "sky",
      "operation": "postgame:meet-sky"
    },
    {
      "id": "postgame:letter-library",
      "region": "library",
      "operation": "postgame:repair-library"
    },
    {
      "id": "postgame:reunion-library",
      "region": "library",
      "operation": "postgame:meet-library"
    },
    {
      "id": "postgame:letter-starfall",
      "region": "starfall",
      "operation": "postgame:repair-starfall"
    },
    {
      "id": "postgame:reunion-starfall",
      "region": "starfall",
      "operation": "postgame:meet-starfall"
    },
    {
      "id": "postgame:ruins",
      "region": "starfall",
      "operation": "postgame:ruins-victory"
    }
  ],
  "ambient": [
    {
      "id": "muling:tea",
      "npc": "muling",
      "region": "garden",
      "after": "harbor:H-04",
      "before": "library:M-04",
      "operation": "ambient:brew-bitter-tea",
      "text": {
        "zh": "今天的茶有点苦，配一块蜂蜜饼刚刚好！",
        "en": "Today's tea is a little bitter. A honey biscuit would go perfectly with it!"
      },
      "action": "sip-tea"
    },
    {
      "id": "muling:map",
      "npc": "muling",
      "region": "harbor",
      "after": "harbor:H-01",
      "before": "library:M-04",
      "operation": "ambient:inspect-map",
      "text": {
        "zh": "好啦，地图转个方向就对了！下次换你领路。",
        "en": "There we go! The map was upside down. You can lead next time!"
      },
      "action": "check-map"
    },
    {
      "id": "muling:cooking",
      "npc": "muling",
      "region": "garden",
      "after": "forest:R-04",
      "before": "library:M-04",
      "operation": "ambient:share-cooked-meal",
      "text": {
        "zh": "咦，锅在冒烟！看来今天的料理叫烟熏惊喜。我们再试一次吧！",
        "en": "Oh, the pot's smoking! Today's special is a smoky surprise. Let's try again!"
      },
      "action": "burnt-meal"
    },
    {
      "id": "muling:bells",
      "npc": "muling",
      "region": "sky",
      "after": "sky:S-04",
      "before": "library:M-04",
      "operation": "ambient:repair-broken-bell",
      "text": {
        "zh": "铃舌不见了。先把它放好吧，等找到合适的零件再说。",
        "en": "The tongue is missing. Let's keep it safe until we find a part that fits."
      },
      "action": "repair-bell"
    },
    {
      "id": "muling:accountability",
      "npc": "muling",
      "region": "garden",
      "after": "epilogue:E-03",
      "operation": "ambient:repair-garden-bell",
      "text": {
        "zh": "花园的铃铛等着修好呢！先问问大家想不想一起动手。",
        "en": "The garden bell is ready for a repair! Let's ask everyone whether they'd like to join."
      },
      "action": "ask-permission"
    },
    {
      "id": "jiedeng:maintain-lighthouse",
      "npc": "jiedeng",
      "region": "harbor",
      "after": "harbor:H-05",
      "operation": "ambient:maintain-lighthouse",
      "text": {
        "zh": "门铃会一直响着。下一趟去哪里，由巡铃人自己决定。",
        "en": "The door bells will keep ringing. The bellkeeper can choose where to go next."
      },
      "action": "maintain-lighthouse"
    },
    {
      "id": "qilan:chart-harbor",
      "npc": "qilan",
      "region": "harbor",
      "after": "harbor:H-05",
      "operation": "ambient:chart-harbor",
      "text": {
        "zh": "这张巡铃图，下一趟出发时就能用上。",
        "en": "This new bell route map will be ready for our next trip."
      },
      "action": "chart-harbor"
    },
    {
      "id": "yahe:plant-herbs",
      "npc": "yahe",
      "region": "forest",
      "after": "forest:R-04",
      "operation": "ambient:plant-herbs",
      "text": {
        "zh": "我们一起看看水渠，再决定种什么。",
        "en": "Let's check the channels together before we decide what to plant."
      },
      "action": "plant-herbs"
    },
    {
      "id": "yuchuan:inspect-water",
      "npc": "yuchuan",
      "region": "forest",
      "after": "forest:R-04",
      "operation": "ambient:inspect-water",
      "text": {
        "zh": "今天的水量已经记下来了。芽禾也看过。",
        "en": "Today's water levels are recorded. Yahe has checked them too."
      },
      "action": "inspect-water"
    },
    {
      "id": "jinpo:test-safety",
      "npc": "jinpo",
      "region": "forge",
      "after": "forge:E-04",
      "operation": "ambient:test-safety",
      "text": {
        "zh": "图纸给小铆看过了。谁发现问题，谁就先说。",
        "en": "Xiaomao has checked the diagram. Whoever sees a problem speaks first."
      },
      "action": "test-safety"
    },
    {
      "id": "xiaomao:assemble-part",
      "npc": "xiaomao",
      "region": "forge",
      "after": "forge:E-04",
      "operation": "ambient:assemble-part",
      "text": {
        "zh": "师傅没抢走我的扳手。你看，新的阀门能用了！",
        "en": "Master didn't take my wrench away. Look, the new valve works!"
      },
      "action": "assemble-part"
    },
    {
      "id": "lingyu:prepare-flight",
      "npc": "lingyu",
      "region": "sky",
      "after": "sky:S-05",
      "operation": "ambient:prepare-flight",
      "text": {
        "zh": "远帆选路线，我负责检查风向。",
        "en": "Yuanfan chooses the route. I'll check the wind."
      },
      "action": "prepare-flight"
    },
    {
      "id": "yuanfan:deliver-cargo",
      "npc": "yuanfan",
      "region": "sky",
      "after": "sky:S-05",
      "operation": "ambient:deliver-cargo",
      "text": {
        "zh": "这是我自己选的路线。你要一起飞吗？",
        "en": "I chose this route myself. Want to fly with me?"
      },
      "action": "deliver-cargo"
    },
    {
      "id": "moye:catalog-record",
      "npc": "moye",
      "region": "library",
      "after": "library:M-05",
      "operation": "ambient:catalog-record",
      "text": {
        "zh": "档案开放了，私人记录也有妥善的查阅方式。",
        "en": "The archive is open. Personal records have a proper way to be consulted."
      },
      "action": "catalog-record"
    },
    {
      "id": "baikan:verify-document",
      "npc": "baikan",
      "region": "library",
      "after": "library:M-05",
      "operation": "ambient:verify-document",
      "text": {
        "zh": "我找到了另一份原件。这次先核对，再公布。",
        "en": "I found another original. This time we'll verify it before releasing it."
      },
      "action": "verify-document"
    },
    {
      "id": "xingya:align-observatory",
      "npc": "xingya",
      "region": "starfall",
      "after": "starfall:F-04",
      "operation": "ambient:align-observatory",
      "text": {
        "zh": "每个聚落都能检查自己的数据。这样比我一个人盯着可靠。",
        "en": "Every settlement can inspect its own readings. That's safer than me watching alone."
      },
      "action": "align-observatory"
    },
    {
      "id": "lichuan:guide-caravan",
      "npc": "lichuan",
      "region": "starfall",
      "after": "starfall:F-04",
      "operation": "ambient:guide-caravan",
      "text": {
        "zh": "下一趟我不独自走。风铃镇那边有人等着回信。",
        "en": "I won't travel alone next time. Someone in Windchime Town is waiting for an answer."
      },
      "action": "guide-caravan"
    }
  ],
  "openingPresentationVersion": 2,
  "fullCampaignPresentationVersion": 2,
  "openingRevision": "canon-1.2-player-first-opening",
  "runtimeRevision": "canon-2.2-finale-implementation",
  "eventTimingRevision": 1
};
