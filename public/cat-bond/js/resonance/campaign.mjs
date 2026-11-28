// Canon 1.3 dialogue pass; gameplay migration and player acceptance tracked separately.
export const campaign = {
  "canon": "The Last Resonance",
  "version": 1,
  "regionalBossRevision": 1,
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
        "zh": "你",
        "en": "You"
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
        "en": "Luna"
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
        "en": "Alder"
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
        "en": "Skye"
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
        "en": "Fern"
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
        "en": "Rowan"
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
        "en": "Ember"
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
        "zh": "小栗",
        "en": "Pip"
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
        "en": "Wren"
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
        "en": "Finn"
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
        "en": "Quill"
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
        "zh": "白羽",
        "en": "Ivy"
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
        "en": "Nova"
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
        "en": "Flint"
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
        "zh": "门口的旧名牌",
        "en": "The old nameplate"
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
        "zh": "找不到家的阿婆",
        "en": "Gran has lost her way"
      },
      "previous": "prologue:P-05",
      "lines": [
        {
          "speaker": "qilan",
          "text": {
            "zh": "檐灯爷爷？顺着这条路走就是。哎，阿婆！您怎么又在敲别人家的门啦？",
            "en": "Grandpa Alder? Just down this road. Oh, Gran! That's someone else's door again!"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "糟了……镇上的铃也不响了。上次星铃坏掉的时候，大家就这样忘东忘西的。",
            "en": "Oh no… the town bell's gone quiet too. Last time the Star Bell broke, everyone started forgetting things."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "她跟我一样，也忘了以前的事？咱们得帮帮她。",
            "en": "She's forgotten things too? Just like me. We have to help her."
          }
        },
        {
          "speaker": "qilan",
          "text": {
            "zh": "好！我陪阿婆。你们去找檐灯爷爷。路上有三块坏掉的路标，帮忙拼好，免得其他猫也走丢。",
            "en": "I'll stay with Gran. You find Alder. Three signs along the road are broken. Put them back together so no one else gets lost."
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
        "zh": "通往旧铃房的路",
        "en": "The road to the bell house"
      },
      "previous": "harbor:H-01",
      "lines": [
        {
          "speaker": "qilan",
          "text": {
            "zh": "这下好啦！阿婆，您抓着我的尾巴，咱们慢慢走。",
            "en": "That's better! Gran, hold my tail. We'll take it slow."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "走吧，檐灯就在前面。",
            "en": "Come on. Alder's just ahead."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "希望他还记得我。",
            "en": "I hope he remembers me."
          }
        }
      ],
      "requires": [
        "puzzle:chime-chase"
      ],
      "choices": [],
      "lineGate": [
        "puzzle:chime-chase"
      ],
      "choiceTiming": "afterDialogue",
      "orderedRequires": true
    },
    {
      "id": "harbor:H-03",
      "chapter": "harbor",
      "title": {
        "zh": "老猫与旧地图",
        "en": "The old cat and the map"
      },
      "previous": "harbor:H-02",
      "lines": [
        {
          "speaker": "jiedeng",
          "text": {
            "zh": "阳光花园？我当然记得！以前有只金灿灿的小猫常来找我。它到哪儿都带着一张地图。",
            "en": "Sunlit Garden? Of course I remember! A little golden cat used to come by all the time, always carrying a map."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "金色的？跟我一样？爷爷，您还记得它叫什么吗？",
            "en": "Golden? Like me? Do you remember their name?"
          }
        },
        {
          "speaker": "jiedeng",
          "text": {
            "zh": "叫什么来着……哎哟！又是那只撞门的铃舌兽！快把阿婆带远点！",
            "en": "What was it again… Oh, whiskers! That beast is at the door again! Get Gran somewhere safe!"
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
        "zh": "铃房终于安静了",
        "en": "The bell house falls quiet"
      },
      "previous": "harbor:H-03",
      "lines": [
        {
          "speaker": "muling",
          "text": {
            "zh": "呼……还好。你没受伤吧？",
            "en": "Phew… you're not hurt, are you?"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "没有。你的尾巴怎么这么大啦？",
            "en": "No. Why's your tail so huge?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "哪有！这是我冬天的毛。",
            "en": "It's not! Just my winter fluff."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "可现在又不是冬天。",
            "en": "But it's not winter."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "咳……快去帮爷爷修铃啦。阿婆还等着回家呢。",
            "en": "Ahem. Let's help Alder fix the bell. Gran's still waiting to go home."
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
        "zh": "地图上的家",
        "en": "Home on the map"
      },
      "previous": "harbor:H-04",
      "lines": [
        {
          "speaker": "jiedeng",
          "text": {
            "zh": "阿婆刚才还认出我了！对了，小家伙，那只金猫走之前把地图落在我这儿了。你瞧，它在阳光花园旁写了个‘家’字。",
            "en": "Gran recognized me again! Oh, little one, that golden cat left this map with me before they went away. See? Sunlit Garden is marked 'home.'"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "它住在那儿？那它说不定知道我是怎么到花园的！",
            "en": "They lived there? Then maybe they know how I ended up in the garden!"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "第一站是眠根林。暮铃，陪我去看看吧？",
            "en": "Rootsleep Forest is the first stop. Luna, will you come with me?"
          }
        },
        {
          "speaker": "qilan",
          "text": {
            "zh": "哎哎，算我一个！地图这事我最拿手。",
            "en": "Hey, count me in! Maps are my thing."
          }
        },
        {
          "speaker": "jiedeng",
          "text": {
            "zh": "下次去花园，记得把旧屋的门闩往上提。别傻乎乎地一直推门啊。路上小心！",
            "en": "Next time you're at the garden, lift the old house latch. Don't spend all day pushing on the door! Safe travels!"
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
            "zh": "小心！别踩！这桥刚才还在另一边呢。",
            "en": "Careful! Don't step there! The bridge was on the other side a moment ago."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "咦？底下是不是有只小猫在叫？",
            "en": "Wait… is that a kitten crying down there?"
          }
        },
        {
          "speaker": "yahe",
          "text": {
            "zh": "是呀！它掉进树根里了，我够不着。",
            "en": "Yes! It's stuck in the roots, and I can't reach it."
          }
        },
        {
          "speaker": "yahe",
          "text": {
            "zh": "看见岔路那片月叶没？拨一下就能把桥转到下面。",
            "en": "See that moonleaf at the fork? Turn it to swing the bridge down."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "别怕啊，小家伙。我们来啦！",
            "en": "Hang on, little one! We're coming!"
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
            "zh": "多亏你们！你说的是一只金猫？我还真见过。那会儿它天天往老树那边跑。",
            "en": "Thank you! A golden cat, you say? I did meet one. They used to go to the old tree every day."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "它在那儿干什么呀？",
            "en": "What were they doing there?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "过去看看不就知道了？不过这路……怎么堵成这样。",
            "en": "Shall we go take a look? Though… look at all those roots in the way."
          }
        },
        {
          "speaker": "qilan",
          "text": {
            "zh": "等我画张新图。这地方一天一个样，我可不想迷路。",
            "en": "Let me draw a new map first. This place changes every day. I'm not getting lost here."
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
            "zh": "老树就在前面，可这根树根比我还粗！",
            "en": "The old tree's right there, but this root is bigger than I am!"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "又动了！看来这里的古铃也坏了。",
            "en": "It moved again! Looks like the local bell's broken too."
          }
        },
        {
          "speaker": "yahe",
          "text": {
            "zh": "铃就在树上。等它恢复正常，咱们就不用跟树根赛跑啦。",
            "en": "The bell's up in the tree. Once it's working, no more racing against roots!"
          }
        }
      ],
      "requires": [],
      "choices": [],
      "lineGate": [],
      "choiceTiming": "afterDialogue",
      "orderedRequires": true
    },
    {
      "id": "forest:R-04",
      "chapter": "forest",
      "title": {
        "zh": "金猫走过的路",
        "en": "The golden cat's trail"
      },
      "previous": "forest:R-03",
      "lines": [
        {
          "speaker": "yuchuan",
          "text": {
            "zh": "我想起来啦！那只金猫是来修铃的。它后来去了千灯城，说要找烬婆做个灯匣。",
            "en": "I remember now! The golden cat came to fix the bell. Then they went to Lantern City to ask Ember for a lantern case."
          }
        },
        {
          "speaker": "qilan",
          "text": {
            "zh": "喂——檐灯爷爷！听得见不？我们到森林啦！",
            "en": "Hello-o-o, Grandpa Alder! Can you hear me? We made it to the forest!"
          }
        },
        {
          "speaker": "yahe",
          "text": {
            "zh": "来，送你颗种子。用水浇，千万别用鱼汤啊。",
            "en": "Here, a seed for you. Water it, okay? Not fish soup."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "这只金猫到底想修什么？咱们去问问烬婆。",
            "en": "What was that cat trying to fix? Let's ask Ember."
          }
        },
        {
          "speaker": "yahe",
          "text": {
            "zh": "好呀。下回回来给我看看它长多高了！",
            "en": "Okay! Show me how tall it grows next time!"
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
            "zh": "快看快看！我做的猫影子会扑蝴蝶！",
            "en": "Look, look! My shadow cat can pounce on butterflies!"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "好可爱！哎？你没动灯，它怎么自己跑起来了？",
            "en": "It's adorable! Huh? The lamp isn't moving. Why is the shadow running on its own?"
          }
        },
        {
          "speaker": "jinpo",
          "text": {
            "zh": "金猫留下的灯匣还在藏灯室呢。这几只影子钻进去，把门口堵了。劳烦你们帮我看看。",
            "en": "The golden cat's lantern case is still in the vault. Those shadows ran inside and blocked the entrance. Could you help me out?"
          }
        },
        {
          "speaker": "xiaomao",
          "text": {
            "zh": "我的歪耳猫是不是也闯祸啦？",
            "en": "Did my crooked-ear cat get into trouble too?"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "才没有呢。等找回它，咱们接着看你的戏！",
            "en": "Of course not. Let's get it back so you can finish your show!"
          }
        }
      ],
      "requires": [
        "npc:forge-dispute"
      ],
      "choices": [],
      "lineGate": [
        "npc:forge-dispute"
      ],
      "choiceTiming": "afterDialogue",
      "orderedRequires": true
    },
    {
      "id": "forge:E-02",
      "chapter": "forge",
      "title": {
        "zh": "藏灯室的三只影子",
        "en": "Three shadows in the lantern vault"
      },
      "previous": "forge:E-01",
      "lines": [
        {
          "speaker": "jinpo",
          "text": {
            "zh": "找齐了！瞧，那就是灯匣。",
            "en": "Found them all! There, that's the lantern case."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "等等……墙上那个影子怎么越来越大？",
            "en": "Wait… why's that shadow on the wall getting bigger?"
          }
        },
        {
          "speaker": "xiaomao",
          "text": {
            "zh": "不好！它变成大怪猫啦！我照住它，你们快上！",
            "en": "Oh no! It's turned into a giant monster cat! I'll keep it in the light. Go get it!"
          }
        }
      ],
      "requires": [
        "puzzle:shadow-bridge"
      ],
      "choices": [],
      "lineGate": [
        "puzzle:shadow-bridge"
      ],
      "choiceTiming": "afterDialogue",
      "orderedRequires": true
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
            "zh": "赢啦！我的歪耳猫也回来啦！",
            "en": "We won! My crooked-ear cat is back!"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "小栗真厉害。刚才那盏灯照得可准了。",
            "en": "Nice work, Pip. You aimed that lamp perfectly."
          }
        },
        {
          "speaker": "jinpo",
          "text": {
            "zh": "唉，灯匣倒是找着了。我怎么也想不起那只金猫临走前交代过什么。看来得先修好古铃。",
            "en": "Well, we have the case. But I can't for the life of me remember what the golden cat asked me to do. Better fix our bell first."
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
            "zh": "瞧，匣子里是张图。月牙画在这两座高岛中间，是去书库的路。",
            "en": "Look, there's a map inside. The crescent between those two islands marks the way to the library."
          }
        },
        {
          "speaker": "jinpo",
          "text": {
            "zh": "啊！我想起来了！它说，哪天有猫拿着檐灯的地图来，就把这个匣子交给它。",
            "en": "Ah! Now I remember! They said to give the case to whoever came here with Alder's map."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "它连这都交代过？那它现在在哪儿？",
            "en": "They planned all this? Where are they now?"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "不知道它后来怎么样了……我想找到它。",
            "en": "I wonder what happened to them. I really want to find out."
          }
        },
        {
          "speaker": "jinpo",
          "text": {
            "zh": "书库里有巡铃人的画像。去瞧瞧，没准儿就认出来啦。",
            "en": "The library has portraits of the bellkeepers. Take a look. You might recognize someone."
          }
        },
        {
          "speaker": "xiaomao",
          "text": {
            "zh": "带上我的歪耳灯！这样路上就不怕黑啦。",
            "en": "Take my crooked-ear lantern! Then you won't be scared of the dark."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "等等，书库在天上？……咱们不能走过去吗？",
            "en": "Wait, the library's in the sky? …Can't we walk there?"
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
            "zh": "月门就在那两座高岛中间，不过得飞过去。",
            "en": "The Moon Gate is between those high islands. We'll have to fly."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "飞……就飞嘛。我又不是怕高。",
            "en": "Fly… fine. I'm not afraid of heights."
          }
        },
        {
          "speaker": "lingyu",
          "text": {
            "zh": "别慌。先试着滑翔，拖动就能升降。咱们顺着云路找航线记录。",
            "en": "No rush. Practice gliding first. Drag to go up or down, and follow the clouds to find the flight log."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "那个……能飞慢一点吗？",
            "en": "Um… can we go a little slower?"
          }
        }
      ],
      "requires": [
        "npc:sky-dispute"
      ],
      "choices": [],
      "lineGate": [
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
            "zh": "找到了！记录里画着两座山，月门就在中间。",
            "en": "Found it! Two peaks in the flight log. The moon gate's between them."
          }
        },
        {
          "speaker": "yuanfan",
          "text": {
            "zh": "看见没？云后面有个月牙尖儿。",
            "en": "See that little crescent poking out of the clouds?"
          }
        },
        {
          "speaker": "qilan",
          "text": {
            "zh": "先飞到月牙岩。那儿的古铃修好了，云路才会打开。你想跟谁飞？",
            "en": "First, Crescent Rock. We need its bell working before the cloud route opens. Who do you want to fly with?"
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
            "en": "Let Finn lead"
          },
          "npc": "yuanfan",
          "method": "fast-courier"
        },
        {
          "id": "train",
          "label": {
            "zh": "让翎羽陪同飞行",
            "en": "Glide with Wren"
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
            "zh": "到啦！这就是月牙岩。",
            "en": "We made it! Crescent Rock."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "暮铃！你还好吧？",
            "en": "Luna! You okay?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "还好！我的毛都吹到另一边去了。快去修铃吧，月门还等着咱们。",
            "en": "Fine! All my fur's pointing the wrong way. Come on, let's fix the bell and open that gate."
          }
        },
        {
          "speaker": "lingyu",
          "text": {
            "zh": "月门开了！就在前面那片云后。",
            "en": "The moon gate's open! Just past that cloud."
          },
          "afterOperations": [
            "melody:sky"
          ]
        },
        {
          "speaker": "jinpo",
          "text": {
            "zh": "云上那只小金猫！听得见吗？别把小栗的灯摔了！",
            "en": "Little golden cat up there! Can you hear me? Don't drop Pip's lantern!"
          },
          "afterOperations": [
            "melody:sky"
          ]
        },
        {
          "speaker": "player",
          "text": {
            "zh": "听见啦！灯好好的呢！",
            "en": "Loud and clear! The lantern's safe!"
          },
          "afterOperations": [
            "melody:sky"
          ]
        }
      ],
      "requires": [
        "puzzle:joint-flight",
        "repair:sky",
        "melody:sky"
      ],
      "choices": [],
      "lineGate": [
        "puzzle:joint-flight"
      ],
      "choiceTiming": "afterDialogue",
      "orderedRequires": true
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
            "zh": "以前有只猫可喜欢喝茶了。每次还没喝呢，下巴就搁到杯沿上了。它说等忙完，就回花园陪我喝。",
            "en": "A friend of mine loved tea. Before the first sip, their chin was already on the rim. They promised we'd have tea in the garden when the work was done."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "花园？你说的是阳光花园吗？",
            "en": "The garden? You mean Sunlit Garden?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "嗯。后来它没回来。我倒是一直改不了泡两杯茶的习惯。",
            "en": "Yes. They never came back. And I never quite stopped making two cups."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "那这杯给我吧。等找到那只金猫，我也陪你去找你的朋友。",
            "en": "Then I'll have this one. Once I find the golden cat, I'll help you look for your friend too."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "……好呀。慢点喝，烫呢。",
            "en": "…I'd like that. Sip slowly. It's hot."
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
            "zh": "逗她笑一笑",
            "en": "Make her laugh"
          }
        },
        {
          "id": "company",
          "npc": "muling",
          "method": "tea-company",
          "label": {
            "zh": "陪她喝茶",
            "en": "Share some tea"
          }
        },
        {
          "id": "search",
          "npc": "muling",
          "method": "tea-search",
          "label": {
            "zh": "陪她找那位朋友",
            "en": "Offer to help find her friend"
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
              "zh": "那今天我负责把两杯都喝光！",
              "en": "Then I'll drink both cups today!"
            }
          },
          {
            "speaker": "muling",
            "text": {
              "zh": "噗……慢点，你的胡须都沾上茶了。",
              "en": "Heh… slow down. You've got tea on your whiskers."
            }
          }
        ],
        "company": [
          {
            "speaker": "player",
            "text": {
              "zh": "那这杯给我吧。等找到那只金猫，我也陪你去找你的朋友。",
              "en": "Then I'll have this one. Once I find the golden cat, I'll help you look for your friend too."
            }
          },
          {
            "speaker": "muling",
            "text": {
              "zh": "……好呀。慢点喝，烫呢。",
              "en": "…I'd like that. Sip slowly. It's hot."
            }
          }
        ],
        "search": [
          {
            "speaker": "player",
            "text": {
              "zh": "等忙完我的事，我陪你找它，好不好？",
              "en": "When we're done here, I'll help you look for your friend."
            }
          },
          {
            "speaker": "muling",
            "text": {
              "zh": "……好，说定了。",
              "en": "…Okay. It's a deal."
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
            "zh": "终于到啦！我能跟你们进去吗？我也想看看那只金猫长什么样。",
            "en": "We made it! Can I come in too? I want to see what that golden cat looked like."
          }
        },
        {
          "speaker": "baikan",
          "text": {
            "zh": "找巡铃人的画像？行呀。最近还真热闹，前些天有只猫来借星铃的图，非要问那把锁怎么开。",
            "en": "Looking for bellkeeper portraits? Sure. We've been busy lately. A cat borrowed the Star Bell map the other day and kept asking how to open its lock."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "锁？为什么要把星铃锁起来？",
            "en": "A lock? Why was the Star Bell locked up?"
          }
        },
        {
          "speaker": "baikan",
          "text": {
            "zh": "它坏了，会偷走大家的记忆呀。前些天好像又有人动过它。来，画像在里面。",
            "en": "Because it was broken and stealing everyone's memories. I think someone's been tampering with it again. Come on, the portraits are inside."
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
            "zh": "欢迎欢迎！先把爪子擦干净，别把云上的泥带进书库哦。",
            "en": "Welcome! Wipe your paws first. No cloud mud in the library, please."
          }
        },
        {
          "speaker": "moye",
          "text": {
            "zh": "墙上的画随便看。柜子里的信可别乱翻，那是别的猫的私事。",
            "en": "Feel free to look at the pictures. But no rummaging through the letters in the cabinets. They're private."
          }
        },
        {
          "speaker": "yuanfan",
          "text": {
            "zh": "咱们先看画像吧！等了这么久，我可太想知道那只金猫是谁了。",
            "en": "Let's see the portraits first! I really want to know who that golden cat is."
          }
        },
        {
          "speaker": "baikan",
          "text": {
            "zh": "就在镜廊那边。最近镜子有点不对劲，你们跟紧我。",
            "en": "They're in the mirror hall. The mirrors have been acting up lately. Stay close."
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
        "en": "The other Luna"
      },
      "previous": "library:M-01",
      "lines": [
        {
          "speaker": "player",
          "text": {
            "zh": "两只暮铃！刚才我都不知道该往哪边跑。",
            "en": "Two Lunas! I didn't know which way to run."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "假的只会学我刚摇过的声音。",
            "en": "The fake could only repeat my last chime."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "所以我一换节奏，它就露馅了。总算找到你啦！",
            "en": "So when I changed the rhythm, it gave itself away. There you are!"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "这扇门是真的。古铃就在里面，修好了应该就能看清旧画。",
            "en": "This is the real door. Once the bell inside is fixed, the murals should be clear again."
          }
        },
        {
          "speaker": "moye",
          "text": {
            "zh": "小心！镜影在学你们的招式。先打败它，才能靠近古铃！",
            "en": "Watch out! That mirror guardian is copying your attacks. Defeat it before you approach the bell."
          }
        },
        {
          "speaker": "baikan",
          "text": {
            "zh": "安全了！古铃就在那边，去修好它吧。",
            "en": "It's safe now! The bell's over there. Let's fix it."
          },
          "afterOperations": [
            "battle:mirror-guardian"
          ]
        },
        {
          "speaker": "lingyu",
          "text": {
            "zh": "喂，书库！云海这边听得到你们的铃声啦！",
            "en": "Hello, Moonmirror! We can hear your bell up in the clouds!"
          },
          "afterOperations": [
            "melody:library"
          ]
        },
        {
          "speaker": "moye",
          "text": {
            "zh": "听见了！一路平安。",
            "en": "Loud and clear! Safe travels."
          },
          "afterOperations": [
            "melody:library"
          ]
        }
      ],
      "requires": [
        "puzzle:library-echo",
        "battle:mirror-guardian",
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
            "zh": "等一下……这只猫，怎么长得跟我一模一样？",
            "en": "Wait… why does that cat look exactly like me?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "……那是你。",
            "en": "…That's you."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "你说什么？你看，旁边这只……是你吧？",
            "en": "What? And the cat beside me… that's you, isn't it?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "嗯。以前咱们就住在阳光花园。每天一起吃饭、晒太阳，还一起照看星铃。",
            "en": "Yes. We lived in Sunlit Garden. We'd eat together, nap in the sun, and look after the Star Bell."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "那你明明认识我！为什么我什么都不记得？",
            "en": "Then you knew me all along! Why can't I remember any of it?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "那年星铃碎了，到处都有猫失忆。你把自己的记忆交给了星铃，它才停下来。你是最早的守铃人。",
            "en": "When the Star Bell broke, cats everywhere started forgetting things. You gave it your memories to make it stop. You were the first Bellkeeper."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "暮铃……在花园的时候，你就知道是我？",
            "en": "Luna… you knew it was me back in the garden?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "知道。我怕告诉你以后，你又要像当年那样。我想等铃修好了再说……对不起。",
            "en": "I did. I was afraid you'd do the same thing all over again. I wanted to fix the bells first… I'm sorry."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "我想知道当年到底发生了什么。",
            "en": "I want to know what really happened back then."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "好，我带你去。",
            "en": "Okay. I'll show you."
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
            "zh": "看看当年的记录",
            "en": "See the old records"
          }
        },
        {
          "id": "hurt",
          "npc": "muling",
          "method": "identity-hurt",
          "label": {
            "zh": "我没想到你一直瞒着我",
            "en": "You've been keeping this from me"
          }
        },
        {
          "id": "space",
          "npc": "muling",
          "method": "identity-space",
          "label": {
            "zh": "让我自己待一会儿",
            "en": "Give me a moment"
          }
        }
      ],
      "lineGate": [
        "npc:identity-confrontation"
      ],
      "choiceTiming": "afterDialogue",
      "choiceAt": 8,
      "choiceResponses": {
        "details": [
          {
            "speaker": "player",
            "text": {
              "zh": "我想知道当年到底发生了什么。",
              "en": "I want to know what really happened back then."
            }
          },
          {
            "speaker": "muling",
            "text": {
              "zh": "好，我带你去。",
              "en": "Okay. I'll show you."
            }
          }
        ],
        "hurt": [
          {
            "speaker": "player",
            "text": {
              "zh": "我一直以为你和我一样，什么都不知道。",
              "en": "I thought you were discovering all of this with me."
            }
          },
          {
            "speaker": "muling",
            "text": {
              "zh": "对不起。我早就该告诉你。",
              "en": "I'm sorry. I should've told you long ago."
            }
          }
        ],
        "space": [
          {
            "speaker": "player",
            "text": {
              "zh": "让我先一个人待一会儿吧。",
              "en": "I need a minute on my own."
            }
          },
          {
            "speaker": "muling",
            "text": {
              "zh": "好。我就在附近。",
              "en": "Okay. I'll be nearby."
            }
          }
        ]
      }
    },
    {
      "id": "library:M-04",
      "chapter": "library",
      "title": {
        "zh": "谁打开了封印",
        "en": "Who opened the seal"
      },
      "previous": "library:M-03",
      "lines": [
        {
          "speaker": "baikan",
          "text": {
            "zh": "咦，暮铃？借图的这枚印记和你的铃坠一模一样。那天……星铃的锁也被打开了。",
            "en": "Luna? This mark on the borrowing record matches your pendant. That was also the day the Star Bell's lock opened."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "暮铃……是你打开的封印？",
            "en": "Luna… did you open the seal?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "是我。我想让你回来。我知道那把锁一开，大家可能又会失忆。",
            "en": "It was me. I wanted you back. I knew opening the lock might make other cats forget again."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "那阿婆找不到家……也是因为你？",
            "en": "Then Gran getting lost… that was because of you?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "……嗯。我以为来得及修好古铃，没想到会这么快。我一直不敢说。",
            "en": "…Yes. I thought I'd have time to fix the bells. I didn't think it would happen so fast. I was too scared to tell you."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "如果修不好呢？你本来打算怎么办？",
            "en": "What if we couldn't fix them? What were you going to do?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "我想过……用别的猫的记忆，换你的回来。",
            "en": "I thought about… trading other cats' memories for yours."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "那阿婆呢？小栗呢？他们会连自己的名字都忘了啊！",
            "en": "What about Gran? Pip? They could forget their own names!"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "我真的很生气。阿婆差点连自己的家都忘了。",
            "en": "I'm angry. Gran nearly lost her home because of this."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "对不起。我当时只想着你。",
            "en": "I'm sorry. All I could think about was you."
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
            "zh": "我真的很生气",
            "en": "I'm angry"
          },
          "npc": "muling",
          "method": "anger"
        },
        {
          "id": "distance",
          "label": {
            "zh": "我现在不想谈这个",
            "en": "I need some space"
          },
          "npc": "muling",
          "method": "distance"
        },
        {
          "id": "understand",
          "label": {
            "zh": "我知道你想让我回来，可是……",
            "en": "I understand why, but…"
          },
          "npc": "muling",
          "method": "understand"
        }
      ],
      "lineGate": [
        "explore:routing-record"
      ],
      "choiceTiming": "afterDialogue",
      "choiceAt": 8,
      "choiceResponses": {
        "anger": [
          {
            "speaker": "player",
            "text": {
              "zh": "我真的很生气。阿婆差点连自己的家都忘了。",
              "en": "I'm angry. Gran nearly lost her home because of this."
            }
          },
          {
            "speaker": "muling",
            "text": {
              "zh": "对不起。我当时只想着你。",
              "en": "I'm sorry. All I could think about was you."
            }
          }
        ],
        "distance": [
          {
            "speaker": "player",
            "text": {
              "zh": "我现在不想说这些。先看看有没有别的办法。",
              "en": "I don't want to talk about this right now. Let's find another way."
            }
          },
          {
            "speaker": "muling",
            "text": {
              "zh": "好。墨页知道旧铃是怎么连起来的。",
              "en": "Okay. Quill knows how the old bells were linked."
            }
          }
        ],
        "understand": [
          {
            "speaker": "player",
            "text": {
              "zh": "我知道你很想我回来。可阿婆怎么办？",
              "en": "I know you wanted me back. But what about Gran?"
            }
          },
          {
            "speaker": "muling",
            "text": {
              "zh": "是我没想清楚。对不起。",
              "en": "I didn't think it through. I'm sorry."
            }
          }
        ]
      }
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
            "zh": "别急着下决定。你们刚才看见了，两种办法差别很大。",
            "en": "Don't decide just yet. You've seen how different the two ways are."
          }
        },
        {
          "speaker": "baikan",
          "text": {
            "zh": "只要六座古铃都接通，星铃夺走的记忆就能回到原来的猫身上。不用拿谁的记忆去换。",
            "en": "Connect all six local bells, and the memories the Star Bell took can return to their owners. No one has to trade theirs away."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "那我也能想起来？不用让其他猫失忆？",
            "en": "Then I could remember too? Without making anyone else forget?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "有希望。可中央还有把锁，得等六地都连好，才能打开。",
            "en": "There's a chance. But the central lock must stay shut until all six are connected."
          }
        },
        {
          "speaker": "baikan",
          "text": {
            "zh": "咱们已经修好五座了。就差星坠原那一座！",
            "en": "Five are working already. Only Starfall's bell is left!"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "我先去看看那把锁。我等你来，不会自己动手。",
            "en": "I'll go check the lock. I'll wait for you. I won't touch it alone."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "好，咱们去星坠原。阿婆好不容易才认得家门，我不想再让她忘掉。",
            "en": "All right. To Starfall. Gran finally knows her way home again. I'm not letting her forget it."
          }
        }
      ],
      "requires": [
        "npc:two-routes",
        "puzzle:two-route-model"
      ],
      "choices": [],
      "lineGate": [
        "npc:two-routes",
        "puzzle:two-route-model"
      ],
      "choiceTiming": "afterDialogue",
      "orderedRequires": true
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
            "zh": "多亏你们找到了星石，商队终于过来了。",
            "en": "Thanks for finding the star stones. The caravan's finally across."
          }
        },
        {
          "speaker": "xingya",
          "text": {
            "zh": "刚才有只银色的猫往遗迹那边去了。你们认识她？",
            "en": "A silver cat just headed toward the ruins. Do you know her?"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "认识。先去观星台吧，我想看看当年到底发生了什么。为什么非得有一只猫忘掉自己？",
            "en": "I do. Take me to the observatory first. I want to know what really happened. Why did someone have to forget who they were?"
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
            "zh": "（当年的暮铃）再等等！一定还有别的办法！",
            "en": "(Luna, years ago) Wait! There must be another way!"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "（当年的你）六座铃全坏了，大家连家人都认不出来。来不及修了。",
            "en": "(You, years ago) All six bells are broken. Cats can't even recognize their families. There's no time to repair them."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "那我陪你去。",
            "en": "Then I'm coming with you."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "先用我的记忆让星铃停下来，再把它锁上。等六座古铃修好了，我们也许还能找到办法。",
            "en": "Use my memories to stop the Star Bell, then lock it. When all six bells are fixed, maybe we'll find a way to undo this."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "那你得答应我，一定想办法回来。",
            "en": "Then promise me you'll find a way back."
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
            "zh": "那时候我每天都泡两杯茶。听见门口有点动静就跑出去……总以为是你回来了。",
            "en": "I used to make two cups of tea every day. Any sound at the door and I'd run outside… thinking you'd come home."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "一直等到现在？",
            "en": "You've been waiting all this time?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "嗯。有一天我泡了两杯，却想不起来另一杯是给谁的。我好害怕……再等下去，连你都忘了。",
            "en": "Yes. One day I made two cups and couldn't remember who the second one was for. I was terrified I'd forget you altogether."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "暮铃，我也想记起以前的事。可是栖蓝、芽禾、小栗……我也不想忘了他们。",
            "en": "Luna, I want my old memories back too. But Skye, Fern, Pip… I don't want to forget them either."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "要是大家都忘了彼此，咱们回来又有什么用呢？",
            "en": "If we all forget each other, what kind of home would we come back to?"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "再试一次吧。这次咱们先修好最后一座铃。",
            "en": "Let's try once more. This time we'll fix the last bell first."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "……好。这次我听你的。",
            "en": "…Okay. This time, we'll do it your way."
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
        "zh": "六座铃重新连上了",
        "en": "Six bells connected"
      },
      "previous": "starfall:F-03",
      "lines": [
        {
          "speaker": "jiedeng",
          "text": {
            "zh": "听见啦！风铃镇这边好好的！",
            "en": "We hear you! All's well in Windchime!"
          }
        },
        {
          "speaker": "yahe",
          "text": {
            "zh": "眠根林也听见了！",
            "en": "Rootsleep hears you too!"
          }
        },
        {
          "speaker": "xingya",
          "text": {
            "zh": "六座都响了！现在就差中央星铃那把锁了。",
            "en": "All six are ringing! Now there's just the lock on the Star Bell."
          }
        },
        {
          "speaker": "jiedeng",
          "text": {
            "zh": "小金猫，忙完了记得回来吃饭！",
            "en": "Little golden cat, come back for dinner when you're done!"
          }
        }
      ],
      "requires": [
        "battle:star-guardian",
        "puzzle:distributed-routing",
        "repair:starfall",
        "melody:starfall"
      ],
      "choices": [],
      "lineGate": [
        "battle:star-guardian",
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
            "zh": "六座铃不是都修好了吗？……咦，我手里的灯是谁送的？",
            "en": "Weren't all six bells fixed? …Wait. Who gave me this lantern?"
          },
          "narration": false
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "是小栗！糟了，封印在裂开，星铃又开始夺走记忆了。",
            "en": "Pip did! Oh no, the seal's cracking. The Star Bell's taking memories again."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "快去中央星铃！它还在夺走大家的记忆，必须先让它停下来。",
            "en": "To the Star Bell, quickly! It's still taking memories. We have to stop it first."
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
            "zh": "门口的回响退了。别碰那把锁！你刚才差点连小栗的灯都忘了。",
            "en": "The echoes at the gate are gone. Don't touch that lock! You nearly forgot Pip's lantern."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "前面还有假的铃声，连你的声音都在学。咱们一起过去。",
            "en": "There are more echoes ahead. They're even copying your voice. Let's go together."
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
            "zh": "刚才那只假的我，只会说同一句话：我会在这里等你。",
            "en": "That fake Luna kept saying the same thing: I'll wait for you here."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "我往旁边走，它一点反应也没有。只有你跟了过来。",
            "en": "I moved away and it didn't react. You followed me."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "它能学以前的我，却不知道咱们现在在做什么。",
            "en": "It knows what I used to say, not what's happening now."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "刚才那团回响一直想把你引到锁前。它要是再夺走记忆，连我们这次认识的朋友都会忘掉。",
            "en": "That echo kept trying to lure you to the lock. If it takes more memories, even the friends we've made on this trip will forget."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "六地的铃还在响。先赶走最后那团回响，才能安全打开锁，让记忆回到大家身上。",
            "en": "All six local bells are still ringing. Let's drive off the last echo, then open the lock safely and return everyone's memories."
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
            "zh": "听见你啦！",
            "en": "We hear you!"
          }
        },
        {
          "speaker": "jinpo",
          "text": {
            "zh": "灯还亮着呢！",
            "en": "The lights are still on!"
          }
        },
        {
          "speaker": "xingya",
          "text": {
            "zh": "六座铃都连上了！这次没断！",
            "en": "All six bells are linked! They're holding!"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "大家都没忘……真的成功了。",
            "en": "Nobody's forgotten… It actually worked."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "暮铃，打开锁吧。这次不用拿谁的记忆来换了。",
            "en": "Luna, open the lock. Nobody has to give up their memories this time."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "嗯。咱们回家。",
            "en": "Yeah. Let's go home."
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
            "zh": "你……认得我吗？",
            "en": "Do you… remember me?"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "暮铃。……我想起来啦！我叫小曦。那壶茶，那座花园……还有小栗的歪耳灯，我全都记得！",
            "en": "Luna. …I remember! I'm Sunny. Our tea, our garden… and Pip's crooked-ear lantern. I remember it all!"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "小曦……那我做的那些事，你也记得吗？",
            "en": "Sunny… do you remember what I did, too?"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "记得。咱们先去看看阿婆，好吗？回去以后……茶可要泡两杯哦。",
            "en": "I do. Let's visit Gran first, okay? And when we get home… make two cups of tea."
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
            "zh": "是我打开了封印。害得阿婆连回家的路都忘了。对不起。",
            "en": "I opened the seal, and Gran forgot how to get home because of me. I'm sorry."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "我能先帮她修好门铃吗？",
            "en": "Can I start by fixing her doorbell?"
          }
        },
        {
          "speaker": "jiedeng",
          "text": {
            "zh": "去问问阿婆吧。她愿意的话，就从她家开始。",
            "en": "Ask Gran. If she's happy with that, start at her house."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "好。修完了我再去问问其他几家。",
            "en": "Okay. Then I'll ask the other families."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "你们慢慢说。我在这儿等。",
            "en": "Take your time. I'll wait here."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "谢谢。我先去阿婆家。",
            "en": "Thanks. I'll go see Gran first."
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
            "zh": "在旁边等着",
            "en": "Wait nearby"
          }
        },
        {
          "id": "help",
          "npc": "muling",
          "method": "accountability-help",
          "label": {
            "zh": "帮忙修铃",
            "en": "Help mend the bells"
          }
        },
        {
          "id": "space",
          "npc": "muling",
          "method": "accountability-space",
          "label": {
            "zh": "让阿婆歇一会儿",
            "en": "Give Gran some time"
          }
        }
      ],
      "lineGate": [],
      "choiceTiming": "afterDialogue",
      "choiceAt": 4,
      "choiceResponses": {
        "listen": [
          {
            "speaker": "player",
            "text": {
              "zh": "你们慢慢说。我在这儿等。",
              "en": "Take your time. I'll wait here."
            }
          },
          {
            "speaker": "muling",
            "text": {
              "zh": "谢谢。我先去阿婆家。",
              "en": "Thanks. I'll go see Gran first."
            }
          }
        ],
        "help": [
          {
            "speaker": "player",
            "text": {
              "zh": "我可以帮你递工具。",
              "en": "I can help with the tools."
            }
          },
          {
            "speaker": "muling",
            "text": {
              "zh": "好。阿婆那边我自己去说。",
              "en": "Thanks. I'll talk to Gran myself."
            }
          }
        ],
        "space": [
          {
            "speaker": "player",
            "text": {
              "zh": "先让阿婆歇一会儿吧。",
              "en": "Let's give Gran a little time."
            }
          },
          {
            "speaker": "muling",
            "text": {
              "zh": "嗯。等她愿意了，我再去。",
              "en": "Okay. I'll wait until she's ready."
            }
          }
        ]
      }
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
            "zh": "小曦……花园里还有我的位置吗？",
            "en": "Sunny… is there still a place for me in the garden?"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "有呀。以后有事可别瞒着我。还有，我那块坐垫得还给我！",
            "en": "There is. No more keeping things from me, though. And I want my cushion back!"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "知道啦。那我去找檐灯做把钥匙！……坐垫能分我一半吗？",
            "en": "I know, I know. I'll ask Alder for a key! …Can I have half the cushion?"
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
        "zh": "今天的茶有点苦。来，给你块蜂蜜饼。",
        "en": "The tea's a bit bitter today. Here, have a honey biscuit."
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
        "zh": "糟了！锅冒烟了！快把盖子拿来。",
        "en": "Oh no, the pot's smoking! Quick, grab the lid."
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
        "zh": "铃舌没了。等找到合适的零件，咱们再修。",
        "en": "The clapper's gone. Let's fix it when we find a replacement."
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
        "zh": "花园的铃坏了。我去问问大家，要不要一起修。",
        "en": "The garden bell's broken. I'll ask if anyone wants to help fix it."
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
        "zh": "家铃都好好的。你呀，想去哪儿就去哪儿，记得回来看看。",
        "en": "The house bells are fine. Go wherever you like, but come visit."
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
        "zh": "地图又画好一段啦！下回走这条路就不怕迷路了。",
        "en": "Another stretch of the map is done! We won't get lost next time."
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
        "zh": "先看看水够不够，再种点薄荷吧。",
        "en": "Let's check the water, then plant some mint."
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
        "zh": "水够啦，芽禾刚来瞧过。",
        "en": "Plenty of water. Fern just checked."
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
        "zh": "小栗又想了个新花样，说要让影子转圈呢。",
        "en": "Pip's got a new idea. Spinning shadows this time!"
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
        "zh": "烬婆让我自己试了新灯架。你看，歪耳猫的影子能跳舞啦！",
        "en": "Ember let me try my new lantern frame. Look, the crooked-eared cat can dance!"
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
        "en": "Finn chooses the route. I'll check the wind."
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
        "zh": "壁画随便看。想看柜子里的记录，先问问主人。",
        "en": "Enjoy the murals. Ask the owner before opening a cabinet."
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
        "zh": "又找到一张旧图！这回得先比对一下原件。",
        "en": "Another old map! Better check it against the original first."
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
        "zh": "现在六地都能看见铃有没有响，不用我一个人守着了。",
        "en": "All six regions can check their bells now. I don't have to watch alone."
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
        "zh": "下趟去风铃镇，有猫等我的信。一起走吗？",
        "en": "Next stop, Windchime. Someone's waiting for my letter. Coming?"
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
