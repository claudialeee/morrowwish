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
        "zh": "世界的背景",
        "en": "The world in a few lines"
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
        "zh": "独自醒来",
        "en": "Awakening alone"
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
        "zh": "风中的航图",
        "en": "A map on the wind"
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
        "zh": "去港口",
        "en": "The road to the harbor"
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
        "zh": "前往霁潮港",
        "en": "Travel to Misttide Harbor"
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
            "zh": "阿婆，是这儿！你家铃上系着蓝绳呢。……哎？怎么全响了？",
            "en": "Gran, over here! Yours has a blue ribbon. …Hey, why are they all ringing?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "我叫暮铃。以前星铃碎过一次，那时也是这样，到处有猫忘事。",
            "en": "I'm Muling. The Star Bell broke once before. Cats all over started forgetting, just like this."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "等一下……这调子我好像会。",
            "en": "Wait… I think I know this tune."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "它往旧铃房去了。走，别跟丢。",
            "en": "It's heading for the old bell house. Come on."
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
            "zh": "它又绕回来了！你从鱼摊那边过去，我堵这头！",
            "en": "It's coming around again! You go past the fish stall; I'll cover this end!"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "转角看不见就摇两下。我听得见。",
            "en": "If we lose sight of each other, ring twice. I'll hear you."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "好，两下。",
            "en": "Got it. Twice."
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
            "zh": "是墙上这段？我可没学过呀。",
            "en": "The tune on the wall? I've never learned it."
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
            "zh": "我按住它了！快！",
            "en": "I've pinned it! Now!"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "你没事吧？",
            "en": "Are you all right?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "没事。……就是这下得洗毛了。",
            "en": "Fine. …I'll need a bath, though."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "嘿嘿，咱俩还挺厉害。",
            "en": "Heh. We make a pretty good team."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "那就接着搭个伴？我也想去看看别的古铃。",
            "en": "Shall we stick together, then? I want to see the other bells too."
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
            "zh": "这张旧图上也有那段曲子。瞧，这片叶子是眠根林的路标。",
            "en": "The old map has that tune too. See the leaf? That's the sign for Rootsleep Forest."
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
            "zh": "画图的猫说不定认识我！",
            "en": "Maybe whoever drew it knew me!"
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
            "zh": "去吧。到了记得摇铃，给我报个平安。",
            "en": "Go on, then. Ring back when you arrive."
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
            "zh": "看着脚下呀！这条桥昨天还通着呢，今天又拐回来了。",
            "en": "Watch your step! This bridge led somewhere yesterday. Today it just turns back."
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
            "zh": "月叶呀！老路就在那边。能不能走过去，就得看你的本事啦。",
            "en": "A moonleaf! The old path is over there. Getting across is another matter."
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
            "zh": "……还真是。行，这回你带路。",
            "en": "…You're right. Fine, you lead this time."
          }
        },
        {
          "speaker": "yahe",
          "text": {
            "zh": "这边这边！桥长过来了！",
            "en": "Over here! The bridge is growing toward us!"
          }
        }
      ],
      "requires": [
        "puzzle:moonleaf-loop"
      ],
      "choices": [],
      "lineGate": [
        "puzzle:moonleaf-loop"
      ],
      "choiceTiming": "afterDialogue",
      "orderedRequires": true
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
            "zh": "这是旧路上的画。千灯城灯匠的火纹还在，去问烬婆吧，她认得这种老东西。",
            "en": "That's the old trail map. The lantern makers' mark is still here. Ask Jinpo in Lantern City; she knows old things like this."
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
            "zh": "种子给你。回去记得浇水，别拿鱼汤浇啊。",
            "en": "Here, take a seed. Water it when you get home. No fish soup!"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "路断了，铃声却能过去！那只猫当年是不是也想把它们接起来？",
            "en": "The road's broken, but the bells can still reach each other! Was that cat trying to reconnect them too?"
          }
        },
        {
          "speaker": "yahe",
          "text": {
            "zh": "等你回来，咱们去看看种子长成什么样。说好啦！",
            "en": "When you come back, we'll see how that seed has grown. Deal?"
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
            "zh": "来来来，你也挑盏灯！瞧，我这只猫的耳朵都能动。",
            "en": "Come on, choose a lantern! Look, my cat's ears can move!"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "你刚才那只猫……怎么还在跑？",
            "en": "That cat you just made… why's it still running?"
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
            "zh": "它耳朵都歪成这样了，还有猫喜欢？",
            "en": "Even with ears that crooked, they like it?"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "你瞧，那个小家伙都在学它歪耳朵了。下回去我家演吧！",
            "en": "Look, that kitten's trying to bend its ears just like yours. Come put on a show at my place!"
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
            "zh": "糟了！它钻进灯影里了！",
            "en": "Oh no! It's slipped into the shadows!"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "引它过来。等它站到灯底下再打。",
            "en": "Draw it over here. Strike when it's under the light."
          }
        },
        {
          "speaker": "jinpo",
          "text": {
            "zh": "灯有我呢！",
            "en": "I'll keep the light on!"
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
            "zh": "怎么像是专门留给我的……？",
            "en": "It's almost as if someone left it for me…"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "连这条路都没画完……它后来去哪儿了？",
            "en": "This trail isn't even finished… Where did that cat go?"
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
            "zh": "这盏送你！耳朵歪是特色，不许笑。",
            "en": "This one's yours! The crooked ear is a feature, not a mistake."
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
        "zh": "接住风",
        "en": "Catch the wind"
      },
      "previous": "forge:E-04",
      "lines": [
        {
          "speaker": "yuanfan",
          "text": {
            "zh": "接住那个包！里头是去书库的信——哇，你飞得比我第一次好多了！",
            "en": "Catch that pouch! It's mail for the library—wow, you're better than I was on my first flight!"
          }
        },
        {
          "speaker": "xiaomao",
          "text": {
            "zh": "我的飞翼真的飞起来了！呃……降落好像还需要改进。",
            "en": "My glider actually flies! Er... the landing might need work."
          }
        },
        {
          "speaker": "lingyu",
          "text": {
            "zh": "外侧风道的风不对劲，远帆！记得看风旗。",
            "en": "The wind is wrong in the outer channel, Yuanfan! Watch the flags."
          }
        },
        {
          "speaker": "yuanfan",
          "text": {
            "zh": "没问题！我发现了一条穿过云洞的新路线。等会儿带你们试飞！",
            "en": "Got it! I found a new route through the clouds. I'll take you flying in a minute!"
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
        "zh": "风中的旧记录",
        "en": "The wind recorder"
      },
      "previous": "sky:S-01",
      "lines": [
        {
          "speaker": "lingyu",
          "text": {
            "zh": "原来那天的风旗是假的。我们差点被带进风暴里。",
            "en": "So the wind flag was false that day. It nearly led us into the storm."
          }
        },
        {
          "speaker": "yuanfan",
          "text": {
            "zh": "我割掉货绳才飞了回来。现在我知道要看真正的风，不看假旗。",
            "en": "I cut the cargo rope to fly us home. Now I know to read the real wind, not the false flags."
          }
        },
        {
          "speaker": "qilan",
          "text": {
            "zh": "我认得这种假信号！远帆，你挑路线，我来观察风旗。",
            "en": "I recognize that kind of false signal! Yuanfan, pick a route; I'll watch the flags."
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
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "我还没到呢，围巾倒先飞过去了！",
            "en": "My scarf made it before I did!"
          }
        },
        {
          "speaker": "lingyu",
          "text": {
            "zh": "前面那座岛能落脚。先歇一会儿吧。",
            "en": "There's a safe island ahead. Let's rest there."
          }
        }
      ],
      "requires": [
        "puzzle:joint-flight"
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
          "speaker": "player",
          "text": {
            "zh": "你旅行这么久，是在找什么吗？",
            "en": "You've traveled a long time. Are you looking for something?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "有个朋友答应我，等事情结束就回花园喝茶。后来我一直给他留着一杯。",
            "en": "A friend promised we'd have tea in the garden when it was all over. I've kept a cup for them ever since."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "那我们也帮你找吧。你帮我找名字，我帮你找朋友。",
            "en": "Then let's help you look, too. You help me find my name; I'll help you find your friend."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "那就请他们喝茶。以前有人教过我，铃响两次就知道彼此平安。",
            "en": "I'll invite them for tea. Someone once taught me that two bell notes mean we're both safe."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "……你喝茶也总是先闻一下。没什么，我们继续走吧。",
            "en": "...You always smell your tea first, too. Never mind. Let's keep going."
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
            "zh": "等找到朋友，我们三个一起喝茶",
            "en": "When you find them, all three of us can have tea"
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
      "lineGate": [],
      "choiceTiming": "afterDialogue"
    },
    {
      "id": "sky:S-05",
      "chapter": "sky",
      "title": {
        "zh": "风把信送到了",
        "en": "The mail arrives"
      },
      "previous": "sky:S-04",
      "lines": [
        {
          "speaker": "yuanfan",
          "text": {
            "zh": "第一条正式航线！我想继续往书库送信，你们愿意带上我吗？",
            "en": "My first official route! I'd like to carry letters to the library. Will you take me along?"
          }
        },
        {
          "speaker": "lingyu",
          "text": {
            "zh": "记得带备用绳。我留在这里照看航线；你们回来，我再带你们练飞行。",
            "en": "Remember a spare rope. I'll tend the routes here; come back whenever you want to practice flying."
          }
        },
        {
          "speaker": "yuanfan",
          "text": {
            "zh": "书库回信了！你在港口唱的音是旧守铃人的信号。还有一次信号，就在最近的失忆发生前。",
            "en": "The library replied! Your harbor note was an old bellkeeper's signal. Another signal was recorded just before the recent memory loss."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "那份记录还在？……我们得去书库。",
            "en": "That record still exists? ...We need to go to the library."
          }
        }
      ],
      "requires": [
        "repair:sky",
        "melody:sky"
      ],
      "choices": [],
      "lineGate": [
        "repair:sky",
        "melody:sky"
      ],
      "choiceTiming": "afterDialogue"
    },
    {
      "id": "library:M-01",
      "chapter": "library",
      "title": {
        "zh": "本该存在的一页",
        "en": "A page that should exist"
      },
      "previous": "sky:S-05",
      "lines": [
        {
          "speaker": "baikan",
          "text": {
            "zh": "你唱的第一个音，在一本很古老的守铃人记录里出现过。偏偏那一页不见了。",
            "en": "Your first note appears in a very old bellkeeper's record. But that particular page is missing."
          }
        },
        {
          "speaker": "moye",
          "text": {
            "zh": "私人回忆不能随意翻看。不过公开的镜廊也许还保留着当年的画像。",
            "en": "We can't freely browse private memories. But the public mirror gallery may still hold a picture from that time."
          }
        },
        {
          "speaker": "yuanfan",
          "text": {
            "zh": "我是送信来的。回信提到一个没有署名的信号——会不会和我们一路遇见的失忆有关？",
            "en": "I'm delivering letters. Your reply mentioned an unsigned signal. Could it explain the memory loss we've seen?"
          }
        },
        {
          "speaker": "baikan",
          "text": {
            "zh": "走，去镜廊！如果你真的来过这里，镜子或许能给我们答案。",
            "en": "Come on, to the gallery! If you've really been here before, the mirrors might have an answer."
          }
        }
      ],
      "requires": [
        "npc:archive-dispute",
        "explore:sealed-archive"
      ],
      "choices": [
        {
          "id": "open",
          "label": {
            "zh": "公开已核实的公共历史（保护私人记忆）",
            "en": "Publish verified public history (protect private memories)"
          },
          "npc": "baikan",
          "method": "full-records"
        },
        {
          "id": "review",
          "label": {
            "zh": "先请相关家庭审阅个人档案",
            "en": "Let affected families review personal records first"
          },
          "npc": "moye",
          "method": "verified-records"
        }
      ],
      "lineGate": [
        "npc:archive-dispute",
        "explore:sealed-archive"
      ],
      "choiceTiming": "afterDialogue",
      "orderedRequires": true
    },
    {
      "id": "library:M-02",
      "chapter": "library",
      "title": {
        "zh": "镜中的两只暮铃",
        "en": "Two Mulings in the mirror"
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
            "zh": "我换了地方，只有你会转过来找我。是你！",
            "en": "I moved, and only you turned to find me. It's you!"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "走吧。那边的门是真的。",
            "en": "Come on. That door over there is real."
          }
        }
      ],
      "requires": [
        "puzzle:library-echo"
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
        "zh": "你早就认识我",
        "en": "You knew my name"
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
            "zh": "……认识。我们以前一起守过星铃。",
            "en": "…I did. We used to tend the Star Bell together."
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
            "zh": "为什么不告诉我？",
            "en": "Why didn't you tell me?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "我怕你知道之后，又会做一样的选择。",
            "en": "I was afraid that once you knew, you'd make the same choice again."
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
        "zh": "线索与承认",
        "en": "Clues and confession"
      },
      "previous": "library:M-03",
      "lines": [
        {
          "speaker": "baikan",
          "text": {
            "zh": "借阅簿上有暮铃的名字。公开日志也记着：封印松动的那天，失忆又开始了。",
            "en": "Muling's name is in the borrowing ledger. The public log also records that the forgetting began again on the day the seal loosened."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "借过地图不代表她改了线路。暮铃，我想听你自己说。",
            "en": "Borrowing a map doesn't mean she redirected the routes. Muling, I want to hear it from you."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "是我。我把修好的线路拨向中央。",
            "en": "It was me. I redirected the repaired routes toward the center."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "封印也是你松开的？",
            "en": "Did you loosen the seal too?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "是。我知道可能会有人失去记忆，以为自己来得及补救。",
            "en": "Yes. I knew others might lose their memories. I thought I could fix it in time."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "那些忘了回家路的猫呢？",
            "en": "What about the cats who forgot their way home?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "我知道。我只是……太想让你回来了。",
            "en": "I knew. I just... wanted you back so badly."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "你没有权利替他们决定。也没有权利替我决定。",
            "en": "You had no right to decide for them. Or for me."
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
        "zh": "两条回家的路",
        "en": "The two ways home"
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
            "zh": "所以就算我想起来了，港口那只猫也会忘记家？",
            "en": "So even if I remember everything, the cat at the harbor would forget home?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "是……我试过修另一条路线。修了很多年，没有一次收到完整的回应。",
            "en": "Yes… I tried to repair the other route. For years, I never got a complete set of replies."
          }
        },
        {
          "speaker": "baikan",
          "text": {
            "zh": "港口的灯、森林的路、炉城的火、天空的信——它们都重新活起来了。也许这次六座铃真的能互相听见。",
            "en": "The harbor light, forest paths, forge fires, sky mail—they're alive again. Maybe this time all six bells can really hear one another."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "我不能拿你的命运赌一次还没验证的方案。我先去星坠原，你们……不用等我。",
            "en": "I can't gamble your fate on an untested route. I'll go ahead to Starfall. You... don't have to wait for me."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "我想找回名字，但不是用别人的名字来换。走吧，白栞。我们得在暮铃动手前让最后一座铃响起来。",
            "en": "I want my name back, but not in exchange for everyone else's. Come on, Baikan. We need to wake the last bell before Muling acts."
          }
        }
      ],
      "requires": [
        "npc:two-routes",
        "puzzle:two-route-model",
        "repair:library",
        "melody:library"
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
            "zh": "站稳。等旁边两块石头亮了，再挑一块跳。",
            "en": "Steady. Wait for the two stones beside you to light up, then pick one to jump to."
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
            "zh": "港口已经有猫认不出家人了。再等下去，会有更多猫失去自己。",
            "en": "Cats at the harbor can no longer recognize their families. If we wait, more will lose themselves."
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
        "puzzle:echo-navigation",
        "puzzle:star-map",
        "explore:catastrophe-record",
        "cinematic:starfall-memory"
      ],
      "choices": [],
      "lineGate": [
        "puzzle:echo-navigation",
        "puzzle:star-map",
        "explore:catastrophe-record"
      ],
      "choiceTiming": "afterDialogue"
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
            "zh": "我每天都泡两杯茶。每次有座铃响了，我都以为这回你该回来了。可另一座又没声了……",
            "en": "I made two cups of tea every day. Every time a bell rang, I thought this would be the time you'd come home. Then another went silent…"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "你是说……连你自己也会把我忘了？",
            "en": "You mean… even you'd forget me?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "我以为再失败，谁的过去都留不住。至少……你还能记得。",
            "en": "I thought if we failed again, nobody would keep their past. At least… you could remember."
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
            "zh": "我不想回到一个谁都不认识我的家。",
            "en": "I don't want to go home to a world where nobody knows me."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "咱们先听听大家怎么说，好不好？",
            "en": "Let's hear what our friends have to say first, all right?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "好，先试一次。那把锁……先别动。",
            "en": "All right. One try first. But leave that lock alone for now."
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
            "zh": "听见啦！这就摇回去！",
            "en": "Yandeng (Windchime Town): We hear you! Ringing back now!"
          }
        },
        {
          "speaker": "yahe",
          "text": {
            "zh": "眠根林也在！",
            "en": "Rootsleep is here too!"
          }
        },
        {
          "speaker": "xingya",
          "text": {
            "zh": "听！最后一个地方也答上了！",
            "en": "Listen! The last place answered too!"
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
        "zh": "最后一声向内的铃",
        "en": "One last inward call"
      },
      "previous": "starfall:F-04",
      "lines": [
        {
          "speaker": "player",
          "text": {
            "zh": "六地都回应了。这次不是中央替它们发声，是每个地方自己送来的回应。",
            "en": "All six answered. This time the center isn't speaking for them. Each region sent its own reply."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "可是星铃还在发抖。如果它再次吞掉声音……我会再失去你。",
            "en": "But the Star Bell is still shaking. If it swallows their voices again… I'll lose you again."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "那就一起守住它们的声音。听，朋友们已经来了。",
            "en": "Then let's protect their voices together. Listen, our friends are here."
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
            "zh": "你学得倒挺像。可你知道自己在等谁吗？",
            "en": "That sounds just like her. But do you even know who you're waiting for?"
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
            "zh": "……嗯。这回一起回家。",
            "en": "…Yeah. We're going home together this time."
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
        "en": "The bell rings normally"
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
            "zh": "记得。也记得这一路你陪我做过的事。还有那两杯茶。",
            "en": "I do. I remember everything we did together on this journey. And those two cups of tea."
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
            "zh": "也记得。我们先去看看大家。茶凉了，还可以再泡。",
            "en": "I remember those too. Let's go see everyone first. If the tea's cold, we can brew another pot."
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
            "zh": "我先帮你把坏掉的家铃修好，行吗？",
            "en": "Can I start by helping you mend the damaged house bells?"
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
        "zh": "花园的第二把钥匙",
        "en": "A key for the garden"
      },
      "previous": "epilogue:E-02",
      "lines": [
        {
          "speaker": "muling",
          "text": {
            "zh": "你还愿意让我留下吗？",
            "en": "Would you still let me stay?"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "可以啊。不过下次要做这么大的事，先跟我商量。",
            "en": "You can. But next time it's something this big, talk to me first."
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
        "zh": "灯会一直亮着。船要不要出海，由领航员自己决定。",
        "en": "The light will stay on. Whether to sail is the navigator's choice."
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
        "zh": "这张新航图，下一趟出发时就能用上。",
        "en": "This new chart will be ready for our next voyage."
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
        "zh": "下一趟我不独自走。港口那边有人等着回信。",
        "en": "I won't travel alone next time. Someone at the harbor is waiting for an answer."
      },
      "action": "guide-caravan"
    }
  ],
  "openingPresentationVersion": 2,
  "fullCampaignPresentationVersion": 2,
  "openingRevision": "canon-1.2-player-first-opening",
  "runtimeRevision": "canon-2.2-finale-implementation"
};
