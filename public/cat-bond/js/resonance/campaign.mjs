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
        "zh": "岬灯",
        "en": "Jiedeng"
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
        "zh": "找不到家的船",
        "en": "A boat without a way home"
      },
      "previous": "prologue:P-05",
      "lines": [
        {
          "speaker": "qilan",
          "text": {
            "zh": "那位渔夫刚才在自家门口迷路了。看海上！那艘船绕着礁石打转，快帮我把它带回来！",
            "en": "That fisherman just got lost outside his own door. Look out to sea! A boat is circling the reef. Help me bring it home!"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "他忘了家，我忘了名字……那座铃会不会也知道些什么？",
            "en": "He forgot his home; I forgot my name. Could that bell know something about me?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "我是暮铃，来找古铃的。星铃曾经破碎，最近失忆又出现了。港口的铃可能藏着线索。",
            "en": "I'm Muling, looking for old bells. The Star Bell broke long ago, and the forgetting has returned. The harbor bell might hold a clue."
          }
        },
        {
          "speaker": "qilan",
          "text": {
            "zh": "我是栖蓝，领航员！可是灯塔没亮，船找不到安全的路。",
            "en": "I'm Qilan, a navigator! The lighthouse is dark, and the boat can't find a safe route."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "先救船。等大家安全了，我们一起听听那座铃。",
            "en": "Let's save the boat first. Once everyone's safe, let's listen to that bell."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "我有工具和绳子。你愿意搭把手的话，我在港口等你。",
            "en": "I've got tools and rope. If you'd like to help, I'll be here at the harbor."
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
      "choiceTiming": "afterDialogue"
    },
    {
      "id": "harbor:H-02",
      "chapter": "harbor",
      "title": {
        "zh": "两盏灯",
        "en": "Two lights"
      },
      "previous": "harbor:H-01",
      "lines": [
        {
          "speaker": "jiedeng",
          "text": {
            "zh": "别点灯。光路没校准，亮错方向比没有灯更危险。",
            "en": "Don't light it. Until the beam is aligned, a false light is worse than none."
          }
        },
        {
          "speaker": "qilan",
          "text": {
            "zh": "那就校准它！我读得懂潮汐表。",
            "en": "Then let's align it! I can read the tide charts."
          }
        },
        {
          "speaker": "jiedeng",
          "text": {
            "zh": "我见过灯指错路的后果。先别出海，退潮时能找到旧航海日志。",
            "en": "I've seen what happens when a beacon points the wrong way. Stay ashore for now; the old logbook appears at low tide."
          }
        },
        {
          "speaker": "qilan",
          "text": {
            "zh": "我来读潮汐，你来找日志。看，我们已经有办法了！",
            "en": "I'll read the tide; you find the logbook. See? We've already got a plan!"
          }
        },
        {
          "speaker": "jiedeng",
          "text": {
            "zh": "日志里有安全航道的记号。找到它就能校准灯塔。",
            "en": "The log marks the safe channel. Find it and we can align the beacon."
          }
        }
      ],
      "requires": [
        "npc:keeper-talk"
      ],
      "choices": [
        {
          "id": "comfort",
          "label": {
            "zh": "先安慰栖蓝",
            "en": "Comfort Qilan first"
          },
          "npc": "qilan",
          "method": "navigator-trust"
        },
        {
          "id": "ask",
          "label": {
            "zh": "先询问岬灯过去的风暴",
            "en": "Ask Jiedeng about the old storm"
          },
          "npc": "jiedeng",
          "method": "keeper-trust"
        }
      ],
      "lineGate": [],
      "choiceTiming": "afterDialogue"
    },
    {
      "id": "harbor:H-03",
      "chapter": "harbor",
      "title": {
        "zh": "盐渍航海日志",
        "en": "Salt on the logbook"
      },
      "previous": "harbor:H-02",
      "lines": [
        {
          "speaker": "jiedeng",
          "text": {
            "zh": "当年我关了主灯，想拦住出海的船。救援船却已经在海上了。",
            "en": "I shut off the main light to keep boats ashore. The rescue boat had already left."
          }
        },
        {
          "speaker": "qilan",
          "text": {
            "zh": "备用灯的消息没有送到船上，所以他们找不到方向？",
            "en": "The backup signal never reached the boat, so they lost their bearings?"
          }
        },
        {
          "speaker": "jiedeng",
          "text": {
            "zh": "是。船员活了下来，可我从此不敢再把航线交给别人。",
            "en": "Yes. The crew survived, but I haven't trusted anyone else with a route since."
          }
        },
        {
          "speaker": "qilan",
          "text": {
            "zh": "那这次你照亮礁石，我带船绕过去。我们试一次！",
            "en": "Then light up the reef this time, and I'll steer around it. Let's try!"
          }
        },
        {
          "speaker": "jiedeng",
          "text": {
            "zh": "……好。风暴快到了，航图给我。",
            "en": "…All right. The storm's coming. Show me the chart."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "风起来了。先决定怎么把船带回安全水域。",
            "en": "The wind's picking up. Let's decide how to bring the boat to safety."
          }
        }
      ],
      "requires": [
        "explore:tide-logbook"
      ],
      "choices": [],
      "lineGate": [
        "explore:tide-logbook"
      ],
      "choiceTiming": "afterDialogue"
    },
    {
      "id": "harbor:H-04",
      "chapter": "harbor",
      "title": {
        "zh": "雾里那声铃",
        "en": "The bell in the fog"
      },
      "previous": "harbor:H-03",
      "lines": [
        {
          "speaker": "jiedeng",
          "text": {
            "zh": "礁石在左边。光路给你了，航线你选！",
            "en": "Reefs to port. The light is yours; choose your route!"
          }
        },
        {
          "speaker": "qilan",
          "text": {
            "zh": "看见了！我会跟着真正的灯走。",
            "en": "I see it! I'll follow the real light."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "听我的铃声，别听海里的假铃。准备好了，我们一起行动！",
            "en": "Listen to my bell, not the false one out at sea. When you're ready, we'll move together!"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "我的航图又湿透了……不过刚才配合得真好。你找名字，我找古铃，一起走吧？",
            "en": "My map is soaked again… but we made a good team. You're looking for your name, I'm looking for old bells. Shall we travel together?"
          },
          "afterOperations": [
            "puzzle:beam-mirrors",
            "rescue:storm-boat"
          ]
        },
        {
          "speaker": "player",
          "text": {
            "zh": "好啊！不过下次你得把航图放进防水袋。",
            "en": "Of course! But next time, put that map in a waterproof pouch."
          },
          "afterOperations": [
            "puzzle:beam-mirrors",
            "rescue:storm-boat"
          ]
        }
      ],
      "requires": [
        "puzzle:beam-mirrors",
        "rescue:storm-boat"
      ],
      "choices": [
        {
          "id": "rescue",
          "label": {
            "zh": "先救援",
            "en": "Prioritize rescue"
          },
          "npc": "qilan",
          "method": "rapid-rescue"
        },
        {
          "id": "calibrate",
          "label": {
            "zh": "先校准灯塔",
            "en": "Calibrate the lighthouse first"
          },
          "npc": "jiedeng",
          "method": "precise-beacon"
        }
      ],
      "lineGate": [],
      "choiceTiming": "beforeAction"
    },
    {
      "id": "harbor:H-05",
      "chapter": "harbor",
      "title": {
        "zh": "第一个音",
        "en": "The first note"
      },
      "previous": "harbor:H-04",
      "lines": [
        {
          "speaker": "player",
          "text": {
            "zh": "等等……我明明不记得自己的名字，为什么会唱这首歌？",
            "en": "Wait... I can't even remember my name. How do I know this song?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "那是归潮调很久以前的唱法。你竟然记得第一个音。",
            "en": "That's a very old version of Returning Tide. Somehow you remember its first note."
          }
        },
        {
          "speaker": "qilan",
          "text": {
            "zh": "归潮调！船回港的时候，我们就唱这个。",
            "en": "Returning Tide! We sing it when boats come home."
          }
        },
        {
          "speaker": "qilan",
          "text": {
            "zh": "灯塔恢复了。至少现在，船能重新找到回家的路。",
            "en": "The lighthouse is working. At least the boats can find their way home again."
          }
        },
        {
          "speaker": "qilan",
          "text": {
            "zh": "眠根林的药草船没到。我跟你们去，顺便画一张不会把猫带丢的航图！",
            "en": "The forest's medicine boat is missing. I'll come with you and draw a chart that won't get anyone lost!"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "眠根林的古铃旁有旧旅人留下的刻记。或许那儿能解释你为什么认得这首歌。",
            "en": "The old bell in Rootsleep Forest has carvings left by travelers. Maybe they can explain why you know this song."
          }
        }
      ],
      "requires": [
        "repair:harbor",
        "melody:harbor"
      ],
      "choices": [],
      "lineGate": [
        "melody:harbor"
      ],
      "choiceTiming": "afterDialogue"
    },
    {
      "id": "forest:R-01",
      "chapter": "forest",
      "title": {
        "zh": "会走动的森林 · 药草园",
        "en": "The Moving Forest · Herb garden"
      },
      "previous": "harbor:H-05",
      "lines": [
        {
          "speaker": "yahe",
          "text": {
            "zh": "欢迎来眠根林！树根昨晚自己搬了家，连药篮都被挂到了树上。地下的伙伴也失去了消息。",
            "en": "Welcome to Rootsleep Forest! The roots moved overnight, and even the medicine basket ended up in a tree. We haven't heard from our friends underground."
          }
        },
        {
          "speaker": "qilan",
          "text": {
            "zh": "我见过药船停在树冠下。跟着药香走，也许能找到它。",
            "en": "I saw the medicine boat stop beneath the canopy. Follow the herbal scent and we might find it."
          }
        },
        {
          "speaker": "yahe",
          "text": {
            "zh": "认得！我能沿着药香找过去。别踩到会打喷嚏的花——啊，已经晚了！",
            "en": "I do! I can follow the scent. Don't step on the sneezing flowers—oh, too late!"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "我负责认路。至于那些会打喷嚏的花……你先走。",
            "en": "I'll navigate. As for those sneezing flowers… after you."
          }
        }
      ],
      "requires": [
        "npc:forest-dispute"
      ],
      "choices": [],
      "lineGate": [],
      "choiceTiming": "afterDialogue"
    },
    {
      "id": "forest:R-02",
      "chapter": "forest",
      "title": {
        "zh": "树冠小径与地下根洞",
        "en": "Canopy path and root cavern"
      },
      "previous": "forest:R-01",
      "lines": [
        {
          "speaker": "yuchuan",
          "text": {
            "zh": "药篮在这里！病根缠住了分水口，我拿药来救树，没想到水道也塌了。",
            "en": "The medicine basket is here! Sick roots tangled the water junction. I brought medicine to save the tree, but the channel collapsed too."
          }
        },
        {
          "speaker": "yahe",
          "text": {
            "zh": "这根大树把上面和地下连在一起。它要是倒了，两边都危险！",
            "en": "This great tree connects the canopy and the tunnels. If it falls, both are in danger!"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "先稳住水道。看地上的水痕，别被树根绕晕了。",
            "en": "Let's steady the channel. Follow the water marks and don't let the roots turn us around."
          }
        },
        {
          "speaker": "yuchuan",
          "text": {
            "zh": "等等！下面传来求救声。有猫被困在塌陷的水道里，先救他们！",
            "en": "Wait! Someone's calling for help below. Cats are trapped in the collapsed channel. Let's rescue them first!"
          }
        }
      ],
      "requires": [
        "explore:scent-trail"
      ],
      "choices": [
        {
          "id": "gardens",
          "label": {
            "zh": "优先恢复药草园",
            "en": "Prioritize the gardens"
          },
          "npc": "yahe",
          "method": "herbal-supplies"
        },
        {
          "id": "roots",
          "label": {
            "zh": "优先稳定地下根系",
            "en": "Stabilize the roots first"
          },
          "npc": "yuchuan",
          "method": "root-stability"
        }
      ],
      "lineGate": [
        "explore:scent-trail"
      ],
      "choiceTiming": "afterDialogue"
    },
    {
      "id": "forest:R-03",
      "chapter": "forest",
      "title": {
        "zh": "坍塌水道 · 回声救援",
        "en": "Collapsed channel · Echo rescue"
      },
      "previous": "forest:R-02",
      "lines": [
        {
          "speaker": "yahe",
          "text": {
            "zh": "被困的伙伴安全了！水也终于流回药草园。",
            "en": "The trapped cats are safe! Water is finally flowing back to the garden."
          }
        },
        {
          "speaker": "yuchuan",
          "text": {
            "zh": "你们听，根在慢慢舒展。刚才那个声音根本不是我们的伙伴。幸好你们找到了真正的路。",
            "en": "Listen, the roots are stretching out again. That voice wasn't our friend at all. Good thing you found the real trail."
          }
        },
        {
          "speaker": "yahe",
          "text": {
            "zh": "快看！刚才还蔫着的花全开了！下次来，我请你们喝花茶。",
            "en": "Look! All those wilted flowers just opened! Come back sometime and I'll make you flower tea."
          }
        },
        {
          "speaker": "yuchuan",
          "text": {
            "zh": "成交。我留下照看水闸。你们去古根圣所吧，那里会响起相枝调。",
            "en": "Deal. I'll stay and watch the gates. Go to the ancient root sanctuary; the Branching Song will sound there."
          }
        }
      ],
      "requires": [
        "rescue:steady-channel",
        "explore:water-marks",
        "battle:root-echo",
        "rescue:trapped-cats"
      ],
      "choices": [],
      "lineGate": [
        "rescue:steady-channel",
        "explore:water-marks",
        "battle:root-echo",
        "rescue:trapped-cats"
      ],
      "choiceTiming": "afterDialogue",
      "orderedRequires": true
    },
    {
      "id": "forest:R-04",
      "chapter": "forest",
      "title": {
        "zh": "古根圣所 · 相枝调",
        "en": "Ancient-root sanctuary · Living Roots"
      },
      "previous": "forest:R-03",
      "lines": [
        {
          "speaker": "player",
          "text": {
            "zh": "这个刻记……我好像知道下一笔应该往哪儿画。难道我以前来过这里？",
            "en": "This carving… I think I know where the next stroke goes. Have I been here before?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "那条线通往另一座古铃。另一条通往星铃。",
            "en": "That line leads to another old bell. The other leads to the Star Bell."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "暮铃，我还没说第二条线通向哪里。你怎么知道的？",
            "en": "Muling, I hadn't told you where the second line went. How did you know?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "我见过类似的图。只是隔壁的铃已经很多年没有回音了。",
            "en": "I've seen drawings like it. The neighboring bell hasn't answered in years."
          }
        },
        {
          "speaker": "qilan",
          "text": {
            "zh": "港口的航图也刻着一条横线！我以为那是旧航路。要不带上图纸，问问赤炉环城的工匠？",
            "en": "The harbor chart has a cross-line too! I thought it was an old shipping route. Let's take the drawings to the smiths of Ember Ring."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "如果炉城的工匠认得这个记号，也许我们就能找到你以前的足迹。",
            "en": "If the forge artisans recognize that mark, we might finally find a trace of your past."
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
      "choiceTiming": "afterDialogue"
    },
    {
      "id": "forge:E-01",
      "chapter": "forge",
      "title": {
        "zh": "没有火花的庆典",
        "en": "A festival without fire"
      },
      "previous": "forest:R-04",
      "lines": [
        {
          "speaker": "xiaomao",
          "text": {
            "zh": "接住我的飞轮！漂亮！欢迎来灯火节——呃，本来应该有很多灯的。",
            "en": "Catch my flywheel! Nice! Welcome to the Lantern Festival—uh, there are usually a lot more lanterns."
          }
        },
        {
          "speaker": "qilan",
          "text": {
            "zh": "森林的水闸缺一台泵。还有，刚才那一下差点把我的航图烤熟！",
            "en": "The forest gates need a pump. Also, that almost roasted my chart!"
          }
        },
        {
          "speaker": "xiaomao",
          "text": {
            "zh": "主炉卡住了。你们要不要和我一起把节日救回来？",
            "en": "The main furnace is jammed. Want to help me save the festival?"
          }
        },
        {
          "speaker": "jinpo",
          "text": {
            "zh": "先去安全的工坊试试，别让主炉再喷火了。",
            "en": "Test it in the safe workshop first. We don't need the main furnace spitting fire again."
          }
        },
        {
          "speaker": "xiaomao",
          "text": {
            "zh": "好！我的新阀门终于能派上用场了！",
            "en": "Great! My new valve finally gets its moment!"
          }
        }
      ],
      "requires": [
        "puzzle:festival-lantern",
        "npc:forge-dispute"
      ],
      "choices": [],
      "lineGate": [
        "puzzle:festival-lantern",
        "npc:forge-dispute"
      ],
      "choiceTiming": "afterDialogue",
      "orderedRequires": true
    },
    {
      "id": "forge:E-02",
      "chapter": "forge",
      "title": {
        "zh": "被擦掉的签名",
        "en": "The missing signature"
      },
      "previous": "forge:E-01",
      "lines": [
        {
          "speaker": "player",
          "text": {
            "zh": "这张古铃图上也有森林的刻记！不过炉子的旧图漏了一次测试。",
            "en": "The old bell diagram has the same mark as the forest! But the furnace plan is missing a safety test."
          }
        },
        {
          "speaker": "jinpo",
          "text": {
            "zh": "上次是我急着点亮节日的灯，出了岔子。今天可不能再来一次。",
            "en": "Last time I rushed to light the festival lanterns and things went wrong. Not again today."
          }
        },
        {
          "speaker": "xiaomao",
          "text": {
            "zh": "那就试试我的新设计吧！让炉子好好喘口气。",
            "en": "Let's try my new design! Time to let that furnace breathe."
          }
        }
      ],
      "requires": [
        "puzzle:safety-blueprint"
      ],
      "choices": [
        {
          "id": "publish",
          "label": {
            "zh": "立即公开已核实的安全事实",
            "en": "Publish verified safety findings now"
          },
          "npc": "xiaomao",
          "method": "worker-transparency"
        },
        {
          "id": "private",
          "label": {
            "zh": "请烬婆先亲自向工人说明",
            "en": "Let Jinpo explain to the workers first"
          },
          "npc": "jinpo",
          "method": "shared-repair"
        }
      ],
      "lineGate": [
        "puzzle:safety-blueprint"
      ],
      "choiceTiming": "afterDialogue"
    },
    {
      "id": "forge:E-03",
      "chapter": "forge",
      "title": {
        "zh": "会反击的熔炉",
        "en": "The furnace that fights back"
      },
      "previous": "forge:E-02",
      "lines": [
        {
          "speaker": "jinpo",
          "text": {
            "zh": "小心！火焰挡住了出口，压力还在上升！",
            "en": "Careful! Flames are blocking the exit, and the pressure's still rising!"
          }
        },
        {
          "speaker": "xiaomao",
          "text": {
            "zh": "先泄压，再关进料！师傅，替我看住温度！",
            "en": "Vent first, then stop the feed! Master, watch the temperature for me!"
          }
        },
        {
          "speaker": "jinpo",
          "text": {
            "zh": "温度降下来了！趁现在，去找真正的阀门！",
            "en": "The temperature's falling! Now, find the real valve!"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "右边那道火没有热气，是回响。真正的阀在下面！",
            "en": "The flame on the right gives off no heat. It's an echo. The real valve is below!"
          }
        }
      ],
      "requires": [
        "puzzle:heat-pressure",
        "battle:forge-guardian"
      ],
      "choices": [],
      "lineGate": [],
      "choiceTiming": "afterDialogue",
      "orderedRequires": true
    },
    {
      "id": "forge:E-04",
      "chapter": "forge",
      "title": {
        "zh": "把灯点起来",
        "en": "Light the lanterns"
      },
      "previous": "forge:E-03",
      "lines": [
        {
          "speaker": "jinpo",
          "text": {
            "zh": "灯火节回来啦！小铆，第一盏灯就用你的图纸。",
            "en": "The Lantern Festival is back! Xiaomao, the first lantern will use your design."
          }
        },
        {
          "speaker": "xiaomao",
          "text": {
            "zh": "给师傅！我们的第一盏灯。下次做个猫耳朵形状的！",
            "en": "For you, Master! Our first lantern. Next time we'll give it cat ears!"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "这图上有六座铃。这个记号我居然能一笔画出来……",
            "en": "There are six bells on this diagram. Somehow I can draw this mark in a single stroke…"
          },
          "afterOperations": [
            "repair:forge",
            "melody:forge"
          ]
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "这是守铃人用的记号。月镜书库有他们的记录，那里也许有你的名字。",
            "en": "It's a bellkeeper's mark. Moonmirror Library keeps their records. Your name might be there."
          }
        },
        {
          "speaker": "xiaomao",
          "text": {
            "zh": "我的飞翼零件做好啦！我带一套去云脊，剩下的交给师傅送到森林。云脊见！",
            "en": "My glider parts are ready! I'll take a set to Skyspine, and Master can send the rest to the forest. See you there!"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "去云脊群岛吧。信使知道通往书库的航路。终于有个明确的线索了。",
            "en": "Let's head to Skyspine Isles. The couriers know the way to the library. At last, a real lead."
          }
        }
      ],
      "requires": [
        "repair:forge",
        "melody:forge"
      ],
      "choices": [],
      "lineGate": [],
      "choiceTiming": "afterDialogue"
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
        "zh": "云上的信",
        "en": "A letter in the clouds"
      },
      "previous": "sky:S-02",
      "lines": [
        {
          "speaker": "yuanfan",
          "text": {
            "zh": "姐姐，右边有上升气流，我走右边！",
            "en": "Sis, there's an updraft on the right. I'm taking it!"
          }
        },
        {
          "speaker": "lingyu",
          "text": {
            "zh": "看见了！我就在你身后。前面云洞是安全的！",
            "en": "I see it! I'm right behind you. The opening in the clouds is safe!"
          }
        },
        {
          "speaker": "xiaomao",
          "text": {
            "zh": "稳住左翼！暮铃，你的围巾比我们飞得还快！",
            "en": "Steady the left wing! Muling, your scarf is flying faster than we are!"
          }
        },
        {
          "speaker": "yuanfan",
          "text": {
            "zh": "前面就是孤岛的收信站。把包交给收信的伙伴，别让信再飞走啦！",
            "en": "The isolated island's mail station is ahead. Deliver the pouch to its recipient!"
          }
        }
      ],
      "requires": [
        "puzzle:joint-flight",
        "explore:letter-recipient"
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
        "zh": "不会记住你的镜子",
        "en": "The mirror that lies"
      },
      "previous": "library:M-01",
      "lines": [
        {
          "speaker": "player",
          "text": {
            "zh": "它学会了声音，却不知道那句话是什么意思。",
            "en": "It learned the voice, but it doesn't know what the words mean."
          }
        },
        {
          "speaker": "baikan",
          "text": {
            "zh": "这就是空白回响。就像镜子里的影子，只会模仿，不会真正回应你。",
            "en": "That's the Hollow Echo. Like a shadow in a mirror: it can copy you, but it can't truly answer."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "别靠太近。它会模仿你熟悉的声音，我先把镜面固定住。",
            "en": "Don't get too close. It can imitate voices you know. I'll secure the mirror."
          }
        }
      ],
      "requires": [
        "puzzle:library-reflections",
        "puzzle:mirror-records",
        "puzzle:library-echo",
        "battle:library-echo"
      ],
      "choices": [],
      "lineGate": [
        "puzzle:library-reflections",
        "puzzle:mirror-records",
        "puzzle:library-echo",
        "battle:library-echo"
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
        "zh": "六条路都指向中央",
        "en": "All the arrows point inward"
      },
      "previous": "library:M-03",
      "lines": [
        {
          "speaker": "baikan",
          "text": {
            "zh": "这些不是旧图。上面是最近的修复日期。",
            "en": "These aren't old maps. They show recent repair dates."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "暮铃，港口、森林、炉城……每次修好之后，都是你把线路拨过去的？",
            "en": "Muling, the harbor, the forest, the forge… you redirected each route after we fixed it?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "是。我需要它们通向中央。",
            "en": "Yes. I needed them to lead to the center."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "最近的失忆，也是你做的？",
            "en": "And the forgetting that's happening now—was that you too?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "我松开了封印。我知道会有风险，以为来得及补救。",
            "en": "I loosened the seal. I knew there was a risk. I thought I could fix it in time."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "栖蓝说过，那位渔夫连自己的家门都不认识。你听到的时候，就已经知道原因了吗？",
            "en": "Qilan told us about a fisherman who couldn't recognize his own door. When you heard that, did you already know why?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "知道。我只是……太想让你回来了。",
            "en": "I knew. I just... wanted you back so badly."
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
        "zh": "走不出星原的商队",
        "en": "The caravan that cannot leave"
      },
      "previous": "library:M-05",
      "lines": [
        {
          "speaker": "lichuan",
          "text": {
            "zh": "第三次了。那颗假星总把我们带回原地。",
            "en": "Third time. That false star keeps bringing us back here."
          }
        },
        {
          "speaker": "xingya",
          "text": {
            "zh": "我能修路标，可那颗假星一直把信号带偏。",
            "en": "I can fix the beacons, but that false star keeps pulling their signals off course."
          }
        },
        {
          "speaker": "lichuan",
          "text": {
            "zh": "别看假星，认脚下的石柱。商队里还有小猫，得先把他们带出去。",
            "en": "Ignore the false star and watch the stone pillars. There are kittens in the caravan. We have to get them out first."
          }
        },
        {
          "speaker": "baikan",
          "text": {
            "zh": "救出商队就去观星台。暮铃走过的那条路，应该就在那儿。",
            "en": "Once the caravan is safe, let's head to the observatory. The path Muling took should be there."
          }
        }
      ],
      "requires": [
        "npc:central-dispute-lichuan",
        "npc:central-dispute",
        "puzzle:caravan-route"
      ],
      "choices": [
        {
          "id": "coordinate",
          "label": {
            "zh": "让星芽协调修复",
            "en": "Let Xingya coordinate repairs"
          },
          "npc": "xingya",
          "method": "coordinated-repair"
        },
        {
          "id": "distribute",
          "label": {
            "zh": "由各聚落共同决策",
            "en": "Share decisions among settlements"
          },
          "npc": "lichuan",
          "method": "distributed-repair"
        }
      ],
      "lineGate": [
        "npc:central-dispute-lichuan",
        "npc:central-dispute",
        "puzzle:caravan-route"
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
        "explore:crater-fragment",
        "puzzle:echo-navigation",
        "puzzle:star-map",
        "explore:ruin-fragment",
        "explore:catastrophe-record",
        "cinematic:starfall-memory"
      ],
      "choices": [],
      "lineGate": [
        "explore:crater-fragment",
        "puzzle:echo-navigation",
        "puzzle:star-map",
        "explore:ruin-fragment",
        "explore:catastrophe-record"
      ],
      "choiceTiming": "afterDialogue"
    },
    {
      "id": "starfall:F-03",
      "chapter": "starfall",
      "title": {
        "zh": "被她记错的约定",
        "en": "The promise she kept wrong"
      },
      "previous": "starfall:F-02",
      "lines": [
        {
          "speaker": "player",
          "text": {
            "zh": "我记起来了。我说过会想办法回来，从没说过你必须一个人救我。",
            "en": "I remember. I promised to find a way back. I never said you had to save me alone."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "我在花园等了那么多年。每次修好一座铃，另一座又没了声音。我以为再也等不到你了。",
            "en": "I waited in the garden for so many years. Every time I fixed one bell, another fell silent. I thought you'd never come back."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "你把所有猫的记忆送进星铃，就能换出我的？",
            "en": "If you send every cat's memories into the bell, you can release mine?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "可以。封印会稳定，你会记起来。包括我的记忆在内，其他猫都会失去属于自己的过去。",
            "en": "Yes. The seal will stabilize and you'll remember. Every other cat, including me, will lose their own past."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "那不是你一个人的代价。港口的家、森林的朋友、我们走过的路，都不是你可以替他们放弃的东西。",
            "en": "That's not a cost you bear alone. Homes at the harbor, friends in the forest, the roads we traveled—none of them are yours to give up for others."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "我每天都泡两杯茶。如果这次又失败，我还能等到你吗？",
            "en": "I make two cups of tea every day. If this fails again, will you ever come home?"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "别再等了。这次我就在你面前，还有一路认识的朋友。我们先让六座铃一起响，好吗？",
            "en": "No more waiting. I'm right here, and so are the friends we met along the way. Let's make all six bells ring together, all right?"
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
      "choiceTiming": "afterDialogue"
    },
    {
      "id": "starfall:F-04",
      "chapter": "starfall",
      "title": {
        "zh": "世界正在回答",
        "en": "The world answers"
      },
      "previous": "starfall:F-03",
      "lines": [
        {
          "speaker": "qilan",
          "text": {
            "zh": "港口听见星原的铃声了！岬灯说灯塔也在回应。大家都准备好了。",
            "en": "Harbor heard Starfall's bell! Jiedeng says the lighthouse is answering too. Everyone is ready."
          }
        },
        {
          "speaker": "lichuan",
          "text": {
            "zh": "商队安全回来了。我在路上听见了另外几座圣所的铃声——不是幻象。",
            "en": "The caravan returned safely. On the way I heard the bells of the other sanctuaries—they weren't illusions."
          }
        },
        {
          "speaker": "xingya",
          "text": {
            "zh": "听！六座铃在唱歌，每座的音都不同，却能接住下一座的声音。我们做到了！",
            "en": "Listen! Six bells are singing. Each has a different note, but each picks up the next. We did it!"
          }
        }
      ],
      "requires": [
        "battle:observatory-echo",
        "puzzle:distributed-routing",
        "repair:starfall",
        "melody:starfall"
      ],
      "choices": [],
      "lineGate": [
        "battle:observatory-echo",
        "puzzle:distributed-routing",
        "repair:starfall",
        "melody:starfall"
      ],
      "choiceTiming": "afterDialogue"
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
        "en": "Don't make the choice for me"
      },
      "previous": "starfall:F-05",
      "lines": [
        {
          "speaker": "muling",
          "text": {
            "zh": "别碰最后的锁！封印还没有稳定！",
            "en": "Don't touch the last lock! The seal isn't stable yet!"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "我不会毁掉封印。我要让每座铃都能听见别的声音。",
            "en": "I won't break the seal. I'm going to let every bell hear the others."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "你又要冒险——",
            "en": "You're risking yourself again—"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "你听，港口的灯还亮着。大家都在等我们的回答。我不是一个人来的。",
            "en": "Listen. The harbor light is still burning. Everyone is waiting for our answer. I didn't come alone."
          }
        }
      ],
      "requires": [
        "battle:inward-gates"
      ],
      "choices": [
        {
          "id": "stop",
          "npc": "muling",
          "method": "final-stop",
          "label": {
            "zh": "暮铃，停下来听听大家的声音",
            "en": "Muling, stop and hear everyone"
          }
        },
        {
          "id": "challenge",
          "npc": "muling",
          "method": "final-challenge",
          "label": {
            "zh": "不要再替我和别人做决定",
            "en": "Don't decide for me or anyone else"
          }
        }
      ],
      "lineGate": [
        "battle:inward-gates"
      ],
      "choiceTiming": "afterDialogue"
    },
    {
      "id": "finale:B-02",
      "chapter": "finale",
      "title": {
        "zh": "模仿不等于回应",
        "en": "A copy cannot answer"
      },
      "previous": "finale:B-01",
      "lines": [
        {
          "speaker": "muling",
          "text": {
            "zh": "空白回响：“我会在这里等你。”",
            "en": "Hollow Echo: “I'll wait for you here.”"
          },
          "narration": true
        },
        {
          "speaker": "player",
          "text": {
            "zh": "那句话我听过。可你不知道自己在等谁。",
            "en": "I've heard those words. But you don't know who you're waiting for."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "听它的节拍！它只会重复，不会等你回应。",
            "en": "Listen to its rhythm! It can repeat, but it can't wait for your answer."
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
        "zh": "六个真实的回答",
        "en": "Six living replies"
      },
      "previous": "finale:B-02",
      "lines": [
        {
          "speaker": "qilan",
          "text": {
            "zh": "港口收到星原的信号！灯路正常！",
            "en": "Harbor has Starfall's signal! Beacon steady!"
          }
        },
        {
          "speaker": "yahe",
          "text": {
            "zh": "上面和下面都收到啦！",
            "en": "Both upper and lower settlements received it!"
          }
        },
        {
          "speaker": "xiaomao",
          "text": {
            "zh": "炉城的灯都亮着！火焰也稳住了！",
            "en": "Every lantern in the forge is glowing! The flames are steady!"
          }
        },
        {
          "speaker": "yuanfan",
          "text": {
            "zh": "信号送到了，回信也到了！",
            "en": "Signal delivered—and the reply's back!"
          }
        },
        {
          "speaker": "baikan",
          "text": {
            "zh": "是真正的声音！镜子里的假回响消失了！",
            "en": "Those are real voices! The false echoes in the mirrors are gone!"
          }
        },
        {
          "speaker": "xingya",
          "text": {
            "zh": "最后一声也接上了！六座铃，谁都没少！",
            "en": "The final note is in place! Six bells, not one missing!"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "它们都还记得自己……原来真的可以。",
            "en": "They all still remember who they are… It really is possible."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "只差你的那把锁。你可以自己决定打开它。",
            "en": "Only your lock remains. You can choose to open it."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "我来打开它。这一次，我们一起回家。",
            "en": "I'll open it. This time, we'll go home together."
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
        "zh": "我们走过的路",
        "en": "The roads we made"
      },
      "previous": "finale:B-04",
      "lines": [
        {
          "speaker": "qilan",
          "text": {
            "zh": "下一班船去森林。你要搭个便船吗？",
            "en": "Next boat's for the forest. Want a ride?"
          }
        },
        {
          "speaker": "yuchuan",
          "text": {
            "zh": "今天上面的人来帮我们检查水闸。等六地的修复安稳了，再回来找我和老伙伴们，我们也想跟你们旅行一趟。",
            "en": "The cats above came to check the gates today. Once the repairs are stable, return to me and the other residents. We'd like to travel with you too."
          }
        }
      ],
      "requires": [
        "npc:regional-reunion",
        "cinematic:regional-reunion"
      ],
      "choices": [],
      "lineGate": [
        "npc:regional-reunion"
      ],
      "choiceTiming": "afterDialogue",
      "orderedRequires": true
    },
    {
      "id": "epilogue:E-02",
      "chapter": "epilogue",
      "title": {
        "zh": "道歉之后",
        "en": "An apology with work attached"
      },
      "previous": "epilogue:E-01",
      "lines": [
        {
          "speaker": "muling",
          "text": {
            "zh": "封印是我松开的。把大家的记忆汇进星铃的计划也是我的。不是意外。",
            "en": "I loosened the seal. The plan to merge your memories into the Star Bell was mine. It wasn't an accident."
          }
        },
        {
          "speaker": "jiedeng",
          "text": {
            "zh": "先把受影响的航路修好。信任的事，以后慢慢说。",
            "en": "Repair the damaged routes first. Trust will take longer."
          }
        },
        {
          "speaker": "yahe",
          "text": {
            "zh": "我愿意一起修水道。但有些猫还没准备好见你。",
            "en": "I'll help repair the waterways. Some cats aren't ready to see you yet."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "我会尊重他们的决定。能做的修复，我会做完。",
            "en": "I'll respect their choices. I'll finish the repairs I can make."
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
            "zh": "听完各地伙伴的意见",
            "en": "Listen to the residents"
          }
        },
        {
          "id": "help",
          "npc": "muling",
          "method": "accountability-help",
          "label": {
            "zh": "陪她完成第一次修复",
            "en": "Join her first repair"
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
            "zh": "愿意。以后出发前，记得问我要不要一起去。",
            "en": "I do. Next time you set off, remember to ask if I'd like to come along."
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
  "openingRevision": "canon-1.2-player-first-opening"
};
