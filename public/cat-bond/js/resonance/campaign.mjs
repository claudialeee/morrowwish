// Story causality v3 — bilingual story runtime, stable scene IDs.
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
        "zh": "醒来的小猫",
        "en": "The waking cat"
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
        "zh": "没有署名的信",
        "en": "The unsigned note"
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
        "zh": "忘记回家的猫",
        "en": "The cat who forgot her home"
      },
      "previous": "prologue:P-05",
      "lines": [
        {
          "speaker": "player",
          "text": {
            "zh": "请问，你认识我吗？我在附近的花园醒来，什么都不记得了。",
            "en": "Excuse me, do you know me? I woke up in a garden nearby and can't remember a thing."
          }
        },
        {
          "speaker": "qilan",
          "text": {
            "zh": "抱歉，我没见过你。哎，阿婆！您家在这边，怎么又往别处走？",
            "en": "Sorry, I haven't seen you before. Oh, Gran! Your home is this way. Where are you going?"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "她也忘记了？",
            "en": "She's forgotten too?"
          }
        },
        {
          "speaker": "qilan",
          "text": {
            "zh": "自从旧铃房的古铃不响了，镇上就开始有人忘事。檐灯正在那儿检查古铃。",
            "en": "Cats started forgetting things when the old bell fell silent. Alder is checking it in the bell house."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "我们去看看。也许能弄清楚发生了什么。",
            "en": "Let's take a look. Maybe we can find out what's happening."
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
        "zh": "前往旧铃房",
        "en": "The old bell house"
      },
      "previous": "harbor:H-01",
      "lines": [
        {
          "speaker": "qilan",
          "text": {
            "zh": "旧铃房就在前面。我留在这里照看阿婆。",
            "en": "The bell house is just ahead. I'll stay with Gran."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "好，我们去找檐灯。",
            "en": "Okay, let's find Alder."
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
      "id": "harbor:H-03",
      "chapter": "harbor",
      "title": {
        "zh": "檐灯记得你",
        "en": "Alder remembers you"
      },
      "previous": "harbor:H-02",
      "lines": [
        {
          "speaker": "jiedeng",
          "text": {
            "zh": "镇上的铃都是我修的。可这座古铃明明没坏，却怎么敲都不响。",
            "en": "I mend the town's bells, but this ancient one isn't broken. It just won't ring."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "咦？我刚走过来，它怎么响了？",
            "en": "Wait, why did it ring when I came closer?"
          }
        },
        {
          "speaker": "jiedeng",
          "text": {
            "zh": "我试了一整天都没动静！难道它认识你？",
            "en": "It hasn't made a sound all day! Could it recognize you?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "当心！黑雾聚起来了！",
            "en": "Watch out! The dark mist is gathering!"
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
            "zh": "那团黑雾散了！听，古铃又响了。",
            "en": "The mist is gone! Listen, the bell is ringing again."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "刚才它只响了一下。现在才真的恢复了。",
            "en": "It only rang for a moment before. Now it's really back."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "去看看阿婆吧。",
            "en": "Let's check on Gran."
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
        "zh": "寻找失忆的原因",
        "en": "A clue to the forgetting"
      },
      "previous": "harbor:H-04",
      "lines": [
        {
          "speaker": "qilan",
          "text": {
            "zh": "阿婆认得家了，刚刚还叫出了小孙子的名字！",
            "en": "Gran found her way home and even remembered her grandson's name!"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "太好了！可我为什么还是什么都不记得？",
            "en": "That's wonderful! But why can't I remember anything?"
          }
        },
        {
          "speaker": "jiedeng",
          "text": {
            "zh": "眠根林的榆川前几天也来找我，说那里的古铃不响了。我原以为只是铃坏了。",
            "en": "Rowan from Rootsleep Forest told me their bell had fallen silent too. I thought it was just broken."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "如果那里的古铃也认得我，说不定能找到原因。",
            "en": "If that bell recognizes me too, maybe we'll find out why."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "那就去看看吧。",
            "en": "Then let's go."
          }
        },
        {
          "speaker": "jiedeng",
          "text": {
            "zh": "沿镇北的小路走。这张地图拿着，森林里容易迷路。",
            "en": "Take the trail north of town. Bring this map; it's easy to get lost in the forest."
          }
        },
        {
          "speaker": "qilan",
          "text": {
            "zh": "我也想去看看！我熟悉镇外的小路。",
            "en": "I'd love to come! I know the trails outside town."
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
            "zh": "太好了，终于遇见别的猫了！别踩那里，根桥刚转过去。",
            "en": "Finally, another cat! Don't step there; the root bridge just moved."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "我们是来找榆川的。听说古铃出了问题？",
            "en": "We're looking for Rowan. We heard something happened to the bell."
          }
        },
        {
          "speaker": "yahe",
          "text": {
            "zh": "他在森林深处。有只小猫掉进树根里了，我却够不着。",
            "en": "He's deeper in the forest. A kitten fell between the roots, and I can't reach it."
          }
        },
        {
          "speaker": "yahe",
          "text": {
            "zh": "那片月叶能转动根桥。转到下面就能过去。",
            "en": "That moonleaf turns the root bridge. Move it down and we can cross."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "别怕，我们来帮你。",
            "en": "Don't worry, we'll help."
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
            "zh": "小家伙没事就好。你们是从风铃镇来的？",
            "en": "I'm glad the little one is safe. Are you from Windchime Town?"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "檐灯说这里的古铃也不响了。我们来看看。",
            "en": "Alder said your bell had fallen silent too. We came to investigate."
          }
        },
        {
          "speaker": "yuchuan",
          "text": {
            "zh": "自从它停了，这里的路就老是转回原处。铃在森林深处。",
            "en": "Ever since it stopped, these paths keep circling back. The bell is deeper in the forest."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "我们先找到真正的路。",
            "en": "Let's find the real path first."
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
            "zh": "总算到了。这里的路本来不是这样的吧？",
            "en": "We made it. The paths aren't normally like this, are they?"
          }
        },
        {
          "speaker": "yahe",
          "text": {
            "zh": "当然不是！看，古铃就在前面。",
            "en": "Of course not! Look, the old bell is just ahead."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "让我靠近试试。如果跟镇上一样，黑雾就会现身。",
            "en": "Let me get closer. If it's like the town, the mist will come out."
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
        "zh": "森林重获自由",
        "en": "The forest opens again"
      },
      "previous": "forest:R-03",
      "lines": [
        {
          "speaker": "player",
          "text": {
            "zh": "果然！打败那团回响，古铃就恢复了。",
            "en": "Just like in town! Defeating the echo restored the bell."
          }
        },
        {
          "speaker": "yuchuan",
          "text": {
            "zh": "桥稳了！前几天千灯城的灯匠也说那里出了怪事。",
            "en": "The bridge is steady again! A lantern maker from Lantern City said strange things were happening there too."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "风铃镇、眠根林、千灯城……为什么这么多地方同时出事？",
            "en": "Windchime Town, Rootsleep Forest, Lantern City… why are so many places affected?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "恐怕和中央星铃有关。六座古铃都和它相连。",
            "en": "It may be the Star Bell. All six ancient bells are connected to it."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "我的失忆会不会也和星铃有关？我们去千灯城看看。",
            "en": "Could it have something to do with my memory? Let's investigate Lantern City."
          }
        },
        {
          "speaker": "yahe",
          "text": {
            "zh": "带颗月叶种子回去吧！以后见面记得告诉我路上的故事。",
            "en": "Take a moonleaf seed! Tell me about your adventures next time."
          }
        }
      ],
      "requires": [
        "battle:root-guardian",
        "repair:forest",
        "melody:forest"
      ],
      "choices": [],
      "lineGate": [
        "battle:root-guardian",
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
            "zh": "快看！我做了只歪耳朵猫，它还会摇尾巴呢！",
            "en": "Look! I made a crooked-eared cat that can wag its tail!"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "灯都不动了，它怎么还在跑？",
            "en": "The lamp stopped moving. Why is its shadow still running?"
          }
        },
        {
          "speaker": "jinpo",
          "text": {
            "zh": "又来了！这些旧影子把藏灯室和古铃的路都堵了。",
            "en": "Not again! Old shadows have blocked the lantern vault and the path to the bell."
          }
        },
        {
          "speaker": "xiaomao",
          "text": {
            "zh": "我的三只影子猫也跑进去啦！",
            "en": "My three shadow cats ran in there too!"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "别担心，我们去找它们。",
            "en": "Don't worry, we'll find them."
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
          "speaker": "xiaomao",
          "text": {
            "zh": "三只都找到了！谢谢你们！",
            "en": "We found all three! Thank you!"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "那边就是古铃吧？等等，黑雾又聚起来了。",
            "en": "That's the bell over there, right? Wait, the mist is gathering again."
          }
        },
        {
          "speaker": "xiaomao",
          "text": {
            "zh": "好大的影子！我用灯照着它，你们小心！",
            "en": "What a huge shadow! I'll shine the light on it. Be careful!"
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
            "zh": "影子终于听话啦！",
            "en": "The shadows are behaving again!"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "小栗，多亏你帮忙照亮它。",
            "en": "Thanks for keeping the light on it, Pip."
          }
        },
        {
          "speaker": "jinpo",
          "text": {
            "zh": "古铃也重新响了，今晚终于可以安心过节了。",
            "en": "The bell is ringing again. Now we can enjoy the festival."
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
        "zh": "寻找当年的记录",
        "en": "Records of the old disaster"
      },
      "previous": "forge:E-03",
      "lines": [
        {
          "speaker": "player",
          "text": {
            "zh": "我们在三个地方都遇到了这种怪物。它们到底从哪儿来的？",
            "en": "We've seen these creatures in three places. Where are they coming from?"
          }
        },
        {
          "speaker": "jinpo",
          "text": {
            "zh": "很多年前也发生过这样的事。那时候连灯火节都停办了。",
            "en": "Something like this happened years ago. We even had to cancel the lantern festival."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "那后来是怎么解决的？",
            "en": "How did it end?"
          }
        },
        {
          "speaker": "jinpo",
          "text": {
            "zh": "听说有只猫阻止了灾难。月镜书库保存着当年的记录，去那里查查吧。",
            "en": "I heard a cat stopped the disaster. The Moonmirror Library keeps records from those days."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "如果能找到当年的办法，说不定也能阻止这次灾难。",
            "en": "If we learn what worked then, maybe we can stop it this time."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "……去书库得经过云脊群岛。我认识月门的位置。",
            "en": "…We'll have to cross the Skyspine Isles. I know where the moon gate is."
          }
        },
        {
          "speaker": "xiaomao",
          "text": {
            "zh": "这盏歪耳灯送给你！路上小心！",
            "en": "Take this crooked-eared lantern! Stay safe!"
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
            "zh": "去月镜书库？月门就在两座高岛中间。最近的风向有些古怪。",
            "en": "Going to Moonmirror Library? The moon gate is between those high islands, but the winds have been strange lately."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "真的非得飞过去吗？",
            "en": "Do we really have to fly there?"
          }
        },
        {
          "speaker": "lingyu",
          "text": {
            "zh": "先练习滑翔，再看看今天哪条风路安全。",
            "en": "Practice gliding first, then check which route is safe today."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "好。你们飞慢一点。",
            "en": "Okay. Just don't fly too fast."
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
            "zh": "月牙岩那边的风比较稳。",
            "en": "The wind near the crescent rock is steadier."
          }
        },
        {
          "speaker": "yuanfan",
          "text": {
            "zh": "月门就在后面！可云瀑挡住了路。古铃也在那里。",
            "en": "The moon gate is beyond it! The cloudfall blocks the way, and the bell is there too."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "我们先飞到那边看看。",
            "en": "Let's fly over and see."
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
            "zh": "云瀑散开了！月门就在前面。",
            "en": "The cloudfall cleared! The moon gate is ahead."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "暮铃，你还好吗？",
            "en": "Luna, are you okay?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "当然！就是腿还有点软。",
            "en": "Of course! My legs are just a little shaky."
          }
        },
        {
          "speaker": "lingyu",
          "text": {
            "zh": "古铃已经恢复，风路安全了。先去观景台歇会儿吧。",
            "en": "The bell is restored and the wind route is safe. Rest at the lookout first."
          }
        }
      ],
      "requires": [
        "puzzle:joint-flight",
        "battle:gale-guardian",
        "repair:sky",
        "melody:sky"
      ],
      "choices": [],
      "lineGate": [
        "puzzle:joint-flight",
        "battle:gale-guardian",
        "repair:sky",
        "melody:sky"
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
            "zh": "以前有只猫答应我，忙完就一起回花园喝茶。",
            "en": "Someone once promised me we'd have tea in the garden when our work was done."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "后来呢？",
            "en": "What happened then?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "我等了很久。那杯茶，我就一直留着。",
            "en": "I waited a long time. I kept a cup for them."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "那我陪你喝一杯吧。",
            "en": "Then I'll share a cup with you."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "……好。小心烫。",
            "en": "…Okay. Careful, it's hot."
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
            "zh": "答应帮她找朋友",
            "en": "Offer to find her friend"
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
              "zh": "那我把两杯都喝掉，你明天就可以少泡一杯啦！",
              "en": "Then I'll drink both, and tomorrow you can make one less!"
            }
          },
          {
            "speaker": "muling",
            "text": {
              "zh": "噗……还是给我留一杯吧。",
              "en": "Pfft… leave me one, would you?"
            }
          }
        ],
        "company": [
          {
            "speaker": "player",
            "text": {
              "zh": "那我陪你坐一会儿。",
              "en": "Then I'll sit with you for a while."
            }
          },
          {
            "speaker": "muling",
            "text": {
              "zh": "好。小心烫。",
              "en": "Okay. Careful, it's hot."
            }
          }
        ],
        "search": [
          {
            "speaker": "player",
            "text": {
              "zh": "等找到解决灾难的办法，我们也帮你找找它吧。",
              "en": "Once we find a way to stop the disaster, let's look for your friend too."
            }
          },
          {
            "speaker": "muling",
            "text": {
              "zh": "……好。",
              "en": "…Okay."
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
          "speaker": "player",
          "text": {
            "zh": "请问，书库有当年星铃灾难的记录吗？",
            "en": "Excuse me, does the library have records of the old Star Bell disaster?"
          }
        },
        {
          "speaker": "baikan",
          "text": {
            "zh": "有呀。前些天也有只猫来查过，还问我怎么打开星铃的封印。",
            "en": "Yes. Someone came to read them recently and asked how to open the Star Bell's seal."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "封印？这次的灾难难道不是意外？",
            "en": "A seal? Could the new disaster be something other than an accident?"
          }
        },
        {
          "speaker": "baikan",
          "text": {
            "zh": "进来吧，我带你们看记录。",
            "en": "Come inside. I'll show you the records."
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
            "zh": "欢迎！当年的记录在镜廊里面。",
            "en": "Welcome! The records from those days are in the mirror gallery."
          }
        },
        {
          "speaker": "moye",
          "text": {
            "zh": "这些镜子能保存过去发生的事。最近它们却总照出不该有的东西。",
            "en": "These mirrors preserve scenes from the past. Lately they've been showing things that shouldn't be there."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "我们想知道上次灾难是怎么结束的。",
            "en": "We want to learn how the last disaster ended."
          }
        },
        {
          "speaker": "baikan",
          "text": {
            "zh": "沿镜廊往里走，小心别跟错了影子。",
            "en": "Follow the gallery, and be careful not to follow the wrong reflection."
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
            "zh": "刚才那两个暮铃一模一样！",
            "en": "Those two Lunas looked exactly alike!"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "假的只会重复之前的声音。你换个位置，它就不知道该怎么回答了。",
            "en": "The fake only repeats what it's heard. When you move, it doesn't know how to respond."
          }
        },
        {
          "speaker": "moye",
          "text": {
            "zh": "古铃在里面。小心，还有黑雾挡着它！",
            "en": "The bell is inside. Watch out, there's more mist blocking it!"
          }
        },
        {
          "speaker": "baikan",
          "text": {
            "zh": "镜子恢复正常了！现在可以看看真正的旧记录。",
            "en": "The mirrors are back to normal! Now we can see the real records."
          },
          "afterOperations": [
            "battle:mirror-guardian"
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
        "zh": "第一位守铃人",
        "en": "The first Bellkeeper"
      },
      "previous": "library:M-02",
      "lines": [
        {
          "speaker": "player",
          "text": {
            "zh": "等等……画里的两只猫，是我们？",
            "en": "Wait… are those two cats us?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "……是。",
            "en": "…Yes."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "你从一开始就认识我？",
            "en": "You've known me all along?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "以前我们一起守护星铃。",
            "en": "We used to look after the Star Bell together."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "那我为什么什么都不记得？",
            "en": "Then why can't I remember anything?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "陨星击坏星铃后，你把自己的记忆留在里面，才暂时挡住了灾难。",
            "en": "After a falling star damaged the bell, you left your memories inside it to hold back the disaster."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "所以古铃才会对我有反应？",
            "en": "So that's why the ancient bells respond to me?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "你的记忆还在星铃里。它们认得你。关于你醒来的事……我还有些话没说。",
            "en": "Your memories are still inside the Star Bell. The bells recognize you. There's more I haven't told you about why you woke up."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "我们去看借阅记录。",
            "en": "Let's look at the records."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "好。",
            "en": "Okay."
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
            "zh": "追问还有什么没说",
            "en": "Ask what else is hidden"
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
              "zh": "那就去看看。",
              "en": "Then let's look."
            }
          },
          {
            "speaker": "muling",
            "text": {
              "zh": "嗯。",
              "en": "Okay."
            }
          }
        ],
        "hurt": [
          {
            "speaker": "player",
            "text": {
              "zh": "暮铃，还有什么是我不知道的？",
              "en": "Luna, what else haven't you told me?"
            }
          },
          {
            "speaker": "muling",
            "text": {
              "zh": "我会说清楚的。对不起。",
              "en": "I'll tell you. I'm sorry."
            }
          }
        ],
        "space": [
          {
            "speaker": "player",
            "text": {
              "zh": "让我自己待一会儿。等会儿再去看记录。",
              "en": "I need a moment alone. I'll look at the record in a bit."
            }
          },
          {
            "speaker": "muling",
            "text": {
              "zh": "好，我在附近等你。",
              "en": "Okay. I'll wait nearby."
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
            "zh": "暮铃，借阅印记和你的铃坠一样。那天正是失忆重新出现的时候。",
            "en": "Luna, the borrower's mark matches your pendant. The forgetting started again that very day."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "是你打开了封印？",
            "en": "You opened the seal?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "是我。我想让你醒过来。我知道回响会逃出去，却以为自己能控制住它。",
            "en": "I did. I wanted you to wake up. I knew the echoes could escape, but I thought I could control them."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "所以那些失忆的猫……",
            "en": "So all those cats who lost their memories…"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "……对不起。我不敢告诉你。",
            "en": "…I'm sorry. I was afraid to tell you."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "你还查了什么？",
            "en": "What else did you look up?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "另一种封印办法。用其他猫的记忆换出你的记忆。",
            "en": "Another way to seal the echoes. Using other cats' memories to release yours."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "那我们认识的朋友，都会忘记自己的过去？",
            "en": "Then our friends would forget their own pasts?"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "我不能让你替大家做这个决定。",
            "en": "You can't make that decision for everyone."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "……我知道。",
            "en": "…I know."
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
            "zh": "不能替大家决定",
            "en": "No one can decide for everyone"
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
            "zh": "别人也有想念的人",
            "en": "Other cats have loved ones too"
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
              "zh": "暮铃，我不能接受你替大家做这个决定。",
              "en": "Luna, you can't make that choice for everyone."
            }
          },
          {
            "speaker": "muling",
            "text": {
              "zh": "对不起。我没有资格这么做。",
              "en": "I'm sorry. It wasn't my choice to make."
            }
          }
        ],
        "distance": [
          {
            "speaker": "player",
            "text": {
              "zh": "我现在不想谈这个。先想办法救大家。",
              "en": "I don't want to talk about this right now. Let's find a way to help everyone."
            }
          },
          {
            "speaker": "muling",
            "text": {
              "zh": "好。我们再看看当年的记录。",
              "en": "Okay. Let's look at the old records."
            }
          }
        ],
        "understand": [
          {
            "speaker": "player",
            "text": {
              "zh": "我知道你很想我回来，但别的猫也有想念的人啊。",
              "en": "I know you wanted me back. But other cats have loved ones too."
            }
          },
          {
            "speaker": "muling",
            "text": {
              "zh": "……我知道。对不起。",
              "en": "…I know. I'm sorry."
            }
          }
        ]
      }
    },
    {
      "id": "library:M-05",
      "chapter": "library",
      "title": {
        "zh": "追赶暮铃",
        "en": "Follow Luna"
      },
      "previous": "library:M-04",
      "lines": [
        {
          "speaker": "moye",
          "text": {
            "zh": "每座恢复的古铃都能压制一部分回响。六座都恢复，就有机会对付中央星铃里的源头。",
            "en": "Each restored bell can hold back some of the echoes. With all six, you may have a chance against the source in the Star Bell."
          }
        },
        {
          "speaker": "baikan",
          "text": {
            "zh": "只剩星坠原的古铃了。中央星铃也在那里。",
            "en": "Only the bell in Starfall Expanse remains. The Star Bell is there too."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "那我们一起去，彻底解决它。",
            "en": "Then let's go together and end this."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "如果来不及呢？我不能再失去你一次。",
            "en": "What if we're too late? I can't lose you again."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "我先去圣所……如果最后的办法不行，我就用封印。",
            "en": "I'll go to the sanctuary first. If the last bell isn't enough, I'll use the seal."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "暮铃，等等！……我得追上她，不能让她夺走大家的记忆。",
            "en": "Luna, wait! …I have to catch her. I can't let her take everyone's memories."
          }
        }
      ],
      "requires": [
        "npc:two-routes"
      ],
      "choices": [],
      "lineGate": [
        "npc:two-routes"
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
            "zh": "你说的银色猫？她刚往中央遗迹去了。",
            "en": "The silver cat? She just headed toward the central ruins."
          }
        },
        {
          "speaker": "xingya",
          "text": {
            "zh": "这边有当年留下的灾变记录。你们是来查星铃的？",
            "en": "The records of the disaster are here. Are you investigating the Star Bell?"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "是。我们得找到结束灾难的办法，也得追上暮铃。",
            "en": "Yes. We need to end the disaster and catch up with Luna."
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
            "zh": "再等等！也许还有别的办法！",
            "en": "Wait! There might be another way!"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "回响已经蔓延，大家连家人都认不出来了。来不及了。",
            "en": "The echoes have spread. Cats can't even recognize their families. There's no time."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "你别一个人进去！",
            "en": "Don't go in alone!"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "先用我的记忆把回响封住。这样大家就安全了。",
            "en": "I'll use my memories to seal the echoes. That will keep everyone safe."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "你答应我，一定要回来。",
            "en": "Promise me you'll come back."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "好。记得给我留杯茶。",
            "en": "I promise. Save me a cup of tea."
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
            "zh": "你追来了……我还没有开始。",
            "en": "You caught up… I haven't started yet."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "我看见了当年的记录。那时我没有别的办法。",
            "en": "I saw what happened back then. I had no other choice."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "可现在我们已经恢复了五座古铃。最后一座就在这里。",
            "en": "But now we've restored five bells. The last one is right here."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "……好。我们先试试。",
            "en": "…Okay. Let's try it first."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "我们一起把最后的回响赶走。",
            "en": "Let's drive out the last local echo."
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
          "speaker": "xingya",
          "text": {
            "zh": "最后一座也恢复了！六座古铃都在响。",
            "en": "The last bell is restored! All six are ringing."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "我们做到了。现在可以去中央星铃了。",
            "en": "We did it. Now we can face the Star Bell."
          }
        }
      ],
      "requires": [
        "battle:star-guardian",
        "repair:starfall",
        "melody:starfall"
      ],
      "choices": [],
      "lineGate": [
        "battle:star-guardian",
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
        "zh": "封印再次松动",
        "en": "The seal slips"
      },
      "previous": "starfall:F-04",
      "lines": [
        {
          "speaker": "player",
          "text": {
            "zh": "咦……这盏歪耳灯是谁送我的？",
            "en": "Wait… who gave me this crooked-eared lantern?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "是小栗！不好，中央的回响又开始夺走记忆了。",
            "en": "Pip did! Oh no, the echo in the Star Bell is taking memories again."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "我不能再等了……对不起。",
            "en": "I can't wait any longer… I'm sorry."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "暮铃！别去！我们已经有机会阻止它了！",
            "en": "Luna! Don't go! We finally have a chance to stop it!"
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
            "zh": "别过来！完成封印，你就能想起以前的一切。",
            "en": "Stay back! When the seal is complete, you'll remember everything."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "可那些朋友呢？他们也有想珍惜的人啊！",
            "en": "What about our friends? They have loved ones too!"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "我只是想让你回来！",
            "en": "I just want you back!"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "我就在这里啊！",
            "en": "I'm right here!"
          }
        }
      ],
      "requires": [
        "battle:inward-gates"
      ],
      "choices": [],
      "lineGate": [],
      "choiceTiming": "afterDialogue",
      "orderedRequires": true
    },
    {
      "id": "finale:B-02",
      "chapter": "finale",
      "title": {
        "zh": "现在的回忆",
        "en": "The memories we made"
      },
      "previous": "finale:B-01",
      "lines": [
        {
          "speaker": "muling",
          "text": {
            "zh": "这些声音……怎么都变成了同一句？",
            "en": "Those voices… why are they all repeating the same words?"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "我不记得以前的事，可我记得我们一起看灯火节、飞过云海。现在的回忆也很重要。",
            "en": "I can't remember the old days, but I remember the festival and flying over the clouds with you. These memories matter too."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "我差点让你失去现在拥有的一切……我停下仪式了。对不起。",
            "en": "I almost took everything you have now away from you… I've stopped the ritual. I'm sorry."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "回响还在星铃里。我们一起阻止它。",
            "en": "The echo is still inside the Star Bell. Let's stop it together."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "好。六座古铃已经响了，这一次我们并肩作战。",
            "en": "Okay. All six bells are ringing. This time we'll face it together."
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
      "id": "finale:B-03",
      "chapter": "finale",
      "title": {
        "zh": "最后的空白回响",
        "en": "The final Hollow Echo"
      },
      "previous": "finale:B-02",
      "lines": [
        {
          "speaker": "xingya",
          "text": {
            "zh": "六座古铃都还亮着！中央的回响消失了。",
            "en": "All six bells are still shining! The central echo is gone."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "星铃终于恢复了……封印可以解开了。",
            "en": "The Star Bell is restored at last… the seal can open now."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "大家的记忆都保住了。",
            "en": "Everyone's memories are safe."
          }
        }
      ],
      "requires": [
        "battle:central-echo"
      ],
      "choices": [],
      "lineGate": [
        "battle:central-echo"
      ],
      "choiceTiming": "afterDialogue",
      "orderedRequires": true
    },
    {
      "id": "finale:B-04",
      "chapter": "finale",
      "title": {
        "zh": "记忆回来了",
        "en": "Memories return"
      },
      "previous": "finale:B-03",
      "lines": [
        {
          "speaker": "muling",
          "text": {
            "zh": "你……想起来了吗？",
            "en": "Do you… remember?"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "嗯。以前的事，还有一路上的朋友，我都记得。",
            "en": "Yes. I remember the old days, and all the friends we made."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "那你还愿意和我一起回家吗？",
            "en": "Will you still come home with me?"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "走吧。还有两杯茶等着我们。",
            "en": "Let's go. Two cups of tea are waiting for us."
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
            "zh": "檐灯爷爷，我得跟您说件事。是我松开了星铃的锁，害阿婆忘了回家的路。对不起。",
            "en": "Alder, I need to tell you something. I loosened the Star Bell's lock. That's why Gran forgot her way home. I'm sorry."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "她家门铃还坏着。我能去帮她修吗？",
            "en": "Her doorbell's still broken. May I go fix it?"
          }
        },
        {
          "speaker": "jiedeng",
          "text": {
            "zh": "你自己去跟她说吧。她愿意，你就帮她。别替她拿主意。",
            "en": "Go tell her yourself. Help if she wants you to. Don't decide for her."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "嗯。我会跟她说清楚，也会去问问其他受影响的猫。",
            "en": "I will. I'll tell her what happened, and speak with the other cats who were hurt too."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "我在这儿等你。",
            "en": "I'll wait here."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "谢谢。我去找阿婆。",
            "en": "Thank you. I'll go find Gran."
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
              "zh": "我在这儿等你。",
              "en": "I'll wait here."
            }
          },
          {
            "speaker": "muling",
            "text": {
              "zh": "谢谢。我去找阿婆。",
              "en": "Thank you. I'll go find Gran."
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
            "zh": "以后……我还能来这里吗？",
            "en": "Can I… still come here?"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "当然。这里也是你的家。",
            "en": "Of course. This is your home too."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "我去准备两杯茶。",
            "en": "I'll make two cups of tea."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "等等，多准备几杯吧。朋友们快到了。",
            "en": "Wait, make a few more. Our friends will be here soon."
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
  "runtimeRevision": "starbell-story-causality-v3",
  "eventTimingRevision": 1,
  "storyRevision": 3
};
