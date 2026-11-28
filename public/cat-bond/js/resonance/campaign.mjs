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
        "zh": "找不到家的阿婆",
        "en": "Gran has lost her way"
      },
      "previous": "prologue:P-05",
      "lines": [
        {
          "speaker": "qilan",
          "text": {
            "zh": "找檐灯爷爷？在旧铃房呢。哎，阿婆！您家在这边，怎么又往别处走呀？",
            "en": "Looking for Alder? He's at the old bell house. Oh, Gran! Your house is over here, not down that lane!"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "不好，连风铃镇的古铃都停了。这里以前也发生过这种事。古铃一坏，大家就会忘事。",
            "en": "Oh no. Even the town bell has stopped. This happened once before. When the bell fails, cats start forgetting things."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "阿婆也不记得自己的家了？爷爷就在附近吧？咱们去找他帮忙。",
            "en": "Gran's forgotten where she lives? Alder's nearby, right? Let's ask him for help."
          }
        },
        {
          "speaker": "qilan",
          "text": {
            "zh": "我陪阿婆。通往铃房的三块路标坏了，你们顺手拼好吧，别再让别的猫走丢了。",
            "en": "I'll stay with Gran. The three signs on the way to the bell house are broken. Could you fix them so no one else gets lost?"
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
            "zh": "好啦，认得路了！阿婆，咱们慢慢走。",
            "en": "There we go! We know where we're going now. Come along, Gran, nice and slow."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "铃房就在前面。檐灯不在的时候，连我都不敢乱碰他那些宝贝铃铛。",
            "en": "The bell house is just ahead. Even I don't dare touch Alder's precious bells when he's out."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "走吧。得先弄清楚镇上出了什么事。",
            "en": "Come on. We need to find out what's happened to the town."
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
        "zh": "檐灯记得你",
        "en": "Alder remembers you"
      },
      "previous": "harbor:H-02",
      "lines": [
        {
          "speaker": "jiedeng",
          "text": {
            "zh": "小曦？……不对，你怎么会在这儿？我这脑子，连昨天吃的什么都记不清了。",
            "en": "Sunny? …No, wait. How can you be here? Oh, my head. I can't even remember what I had for supper."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "您认识我？爷爷，您能不能告诉我，我以前都做过些什么？",
            "en": "You know me? Can you tell me what I used to do?"
          }
        },
        {
          "speaker": "jiedeng",
          "text": {
            "zh": "让我想想……哎哟，那只怪兽又撞门了！先把它赶走，别让它伤着阿婆！",
            "en": "Let me think… Oh, whiskers, that beast is battering the door again! Get it away from Gran!"
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
            "zh": "没事吧？刚才它差点扑到你身上！",
            "en": "Are you okay? It nearly got you!"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "没事。倒是你……尾巴怎么变得这么大啦？",
            "en": "I'm fine. But you… what happened to your tail?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "我毛多。",
            "en": "I'm fluffy."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "刚才还没这么多呢。",
            "en": "Not that fluffy a minute ago."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "……好啦！怪兽赶跑了，快帮爷爷把古铃修好。",
            "en": "…All right, all right! The beast is gone. Let's help Alder get that bell working."
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
        "zh": "巡铃图",
        "en": "The bellkeeper's map"
      },
      "previous": "harbor:H-04",
      "lines": [
        {
          "speaker": "jiedeng",
          "text": {
            "zh": "小曦！这下想起来了。你以前是巡铃的，常来帮我修铃。喏，你临走前托我收好的巡铃图。",
            "en": "Sunny! Now I remember. You were a bellkeeper. You used to help me with repairs. Here, the inspection map you asked me to keep."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "这就是我以前走的路线？上面标着六座古铃……还有阳光花园。",
            "en": "So this is the route I used to take? Six local bells marked here… and Sunlit Garden."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "您看，镇上的铃修好了，阿婆就认得家了。要是别的地方也有猫失忆……咱们先去最近的眠根林看看！",
            "en": "Gran remembered her home when we fixed this bell. What if cats elsewhere are forgetting too? Let's check the next stop, Rootsleep Forest!"
          }
        },
        {
          "speaker": "qilan",
          "text": {
            "zh": "算我一个！你那张图都旧成这样了，我来补上现在还能走的路。",
            "en": "Count me in! That map's ancient. I'll mark the routes we can actually use today."
          }
        },
        {
          "speaker": "jiedeng",
          "text": {
            "zh": "慢着，花园旧屋的门闩要往上提！你以前就老忘。得空回来吃鱼啊。",
            "en": "Wait! Lift the latch on the garden house, don't push it. You always forgot that one. Come back for fish when you can!"
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
            "zh": "别踩别踩！桥刚转过去，你会掉下去的！",
            "en": "Don't step there! The bridge just turned. You'll fall!"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "底下怎么有小猫在叫？",
            "en": "Is that a kitten crying down there?"
          }
        },
        {
          "speaker": "yahe",
          "text": {
            "zh": "它追着叶子跑，一下子掉进树根里啦！我够不着它。",
            "en": "It chased a leaf and tumbled into the roots! I can't reach it."
          }
        },
        {
          "speaker": "yahe",
          "text": {
            "zh": "岔路上那片月叶能转动根桥。把桥转到下面，就能过去。",
            "en": "The moonleaf at the fork turns the root bridge. Swing it down and we can reach the kitten."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "小家伙，别乱动！我们这就来。",
            "en": "Stay put, little one! We're coming."
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
            "zh": "出来了就好。小曦？好些年没见了，你还是老样子，看见小猫有事就往前冲。",
            "en": "Glad the little one's safe. Sunny? It's been years! Still rushing in whenever a kitten needs help, I see."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "您还记得我？我以前来这儿做什么呀？",
            "en": "You remember me? What brought me here before?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "你来看过老树上的铃。现在桥乱转，恐怕也是那座铃的问题。",
            "en": "You used to check the bell on the old tree. With the bridges moving like this, I suspect the bell's failing again."
          }
        },
        {
          "speaker": "qilan",
          "text": {
            "zh": "那就去看看。我把刚才救小猫的路线标下来。",
            "en": "Let's go have a look. I'll mark the route we used to rescue the kitten."
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
            "zh": "总算到了！原来这些根桥平时是给大家过河的呀。",
            "en": "We made it! So these root bridges are how everyone normally gets across."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "是啊。以前一摇铃，桥就会乖乖转回去。现在它连自己该在哪儿都记不住了。",
            "en": "That's right. A ring of the bell used to bring them back into place. Now even the bridges seem to have forgotten where they belong."
          }
        },
        {
          "speaker": "yahe",
          "text": {
            "zh": "铃就在树上。咱们把它修好，免得再有猫掉下去。",
            "en": "The bell's up in the tree. Let's fix it before another cat falls."
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
        "zh": "断掉的旧路",
        "en": "The broken route"
      },
      "previous": "forest:R-03",
      "lines": [
        {
          "speaker": "yuchuan",
          "text": {
            "zh": "看，桥稳了！我想起一件事，你上回来，说要把风铃镇和这里的铃连起来。可那条旧路后来断了。",
            "en": "Look, the bridge is steady! I remember something. Last time you came, you wanted to link our bell with Windchime's. But the old route broke."
          }
        },
        {
          "speaker": "qilan",
          "text": {
            "zh": "听见没？风铃镇的铃！相邻的古铃还能隔着断路传声呢！",
            "en": "Did you hear that? Windchime's bell! Neighboring bells can still carry sound across the broken route!"
          }
        },
        {
          "speaker": "yahe",
          "text": {
            "zh": "给你颗月叶种子。用水浇，别浇鱼汤哦。",
            "en": "Here, a moonleaf seed. Give it water, not fish soup!"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "我以前想把铃连起来？那我得弄清楚为什么。图上下一站是千灯城，去问问烬婆。",
            "en": "I was trying to connect the bells? I need to find out why. Lantern City's next on my map. Let's ask Ember."
          }
        },
        {
          "speaker": "yahe",
          "text": {
            "zh": "嗯！下回见，记得给我讲讲你们路上的事。",
            "en": "Deal! Tell me all about your travels next time."
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
            "zh": "快看！我做了只歪耳朵猫，它还会摇尾巴呢！",
            "en": "Look! I made a crooked-eared cat. It can wag its tail!"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "咦？灯都不动了，它怎么还在跑？",
            "en": "Huh? The lamp's stopped moving. Why's the shadow still running?"
          }
        },
        {
          "speaker": "jinpo",
          "text": {
            "zh": "又来了！那些旧影子把藏灯室都堵了。小曦，你来得正好，里面还有你托我保管的灯匣。",
            "en": "Not again! Those old shadows have blocked up the vault. Sunny, good timing. The case you left with me is still inside."
          }
        },
        {
          "speaker": "xiaomao",
          "text": {
            "zh": "我的歪耳猫也跑进去啦！它可不是坏猫。",
            "en": "My crooked-ear cat ran in there too! It's not a bad cat."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "放心，咱们一起把它找出来。",
            "en": "Don't worry. We'll find it together."
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
            "zh": "三只都找齐了。好，灯匣就在里面。",
            "en": "That's all three. Good. The case is inside."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "等等，墙上怎么又多了这么大一只影子？",
            "en": "Wait! Where did that enormous shadow come from?"
          }
        },
        {
          "speaker": "xiaomao",
          "text": {
            "zh": "哎呀！它朝我们扑过来了！我用灯照着它，你们小心！",
            "en": "Oh no! It's coming right at us! I'll keep the light on it. Watch out!"
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
            "zh": "嘿嘿，这下歪耳猫总算听话啦！",
            "en": "Hee-hee! My crooked-ear cat's behaving again!"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "小栗，刚才多亏你没松开灯。",
            "en": "Good thing you held on to that lamp, Pip."
          }
        },
        {
          "speaker": "jinpo",
          "text": {
            "zh": "先把古铃修了吧。这些影子没了铃的管束，还会再跑出来。灯匣在这儿，跑不了。",
            "en": "Let's fix the bell first. Without it, the shadows will be running loose again. The case isn't going anywhere."
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
        "zh": "通往书库的航图",
        "en": "A chart to the library"
      },
      "previous": "forge:E-03",
      "lines": [
        {
          "speaker": "jinpo",
          "text": {
            "zh": "拿去吧。你当年托我保管的不是宝贝，是去月镜书库的旧航图。以前巡铃走的云路，现在只有这张图认得全。",
            "en": "Here you go. What you left with me wasn't treasure, but an old flight chart to Moonmirror Library. It's the only complete record of the old bellkeeper route through the clouds."
          }
        },
        {
          "speaker": "jinpo",
          "text": {
            "zh": "你说，书库里存着星铃的旧图纸。你怕哪天记不住路，就让我把航图收好。",
            "en": "You told me the library kept the Star Bell's original plans. You wanted me to keep this chart in case you forgot the way."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "原来我早就知道自己可能会失忆……",
            "en": "So I knew there was a chance I'd lose my memories…"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "书库里有星铃的图纸，说不定还有我以前修铃的记录。得去看看。",
            "en": "If the library has those plans, it might have records of my work too. I need to see them."
          }
        },
        {
          "speaker": "jinpo",
          "text": {
            "zh": "去吧。云路的入口在那两座高岛中间。别跟着假影子乱跑。",
            "en": "Go on. The cloud route enters between those two high islands. Don't chase any stray shadows."
          }
        },
        {
          "speaker": "xiaomao",
          "text": {
            "zh": "这盏歪耳灯给你！以后晚上走路就不怕黑啦。",
            "en": "Take my crooked-ear lantern! Now you won't be scared walking in the dark."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "……高岛？咱们非得飞过去吗？",
            "en": "…High islands? Do we really have to fly?"
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
            "zh": "月门在两座高岛中间。航图是老的，风向可每天都在变。",
            "en": "The Moon Gate is between those two islands. Your chart's old, though, and the wind changes every day."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "我可以飞。就是……不太想往下看。",
            "en": "I can fly. I just… don't particularly want to look down."
          }
        },
        {
          "speaker": "lingyu",
          "text": {
            "zh": "先跟着云路练习吧，拖动就能升降。找到最新的航线记录，再挑条安全的路。",
            "en": "Practice along the cloud trail. Drag to climb or descend. Find the latest flight record before we choose a safe route."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "好。飞慢一点，等等我。",
            "en": "Okay. Slow down a little and wait for me."
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
            "zh": "找到今天的航线了。月牙岩那边的风比较稳。",
            "en": "Found today's route. The wind around Crescent Rock is steadier."
          }
        },
        {
          "speaker": "yuanfan",
          "text": {
            "zh": "看！月门就在后面。可那团云挡得严严实实的。",
            "en": "Look! The Moon Gate's behind it. That cloud's completely in the way, though."
          }
        },
        {
          "speaker": "qilan",
          "text": {
            "zh": "先飞到月牙岩，把那儿的铃修好，风就能把云吹开。你想让谁带路？",
            "en": "Let's reach Crescent Rock and fix its bell. Then the wind can clear the clouds. Who do you want to guide us?"
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
            "zh": "到啦！月牙岩。",
            "en": "Made it! Crescent Rock."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "暮铃？你还敢睁眼吗？",
            "en": "Luna? Are your eyes open yet?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "早睁啦！……就是腿还有点软。咱们快修铃吧。",
            "en": "Of course they are! …My legs are just a bit wobbly. Let's fix that bell."
          }
        },
        {
          "speaker": "lingyu",
          "text": {
            "zh": "云散了！月门就在前面。",
            "en": "The clouds have cleared! The Moon Gate's ahead."
          },
          "afterOperations": [
            "melody:sky"
          ]
        },
        {
          "speaker": "jinpo",
          "text": {
            "zh": "小曦！听得到吗？小栗叫我问你，他那盏灯好不好用！",
            "en": "Sunny! Can you hear me? Pip wanted to know how his lantern's holding up!"
          },
          "afterOperations": [
            "melody:sky"
          ]
        },
        {
          "speaker": "player",
          "text": {
            "zh": "好用！告诉小栗，灯没摔坏，我也没摔坏！",
            "en": "It's great! Tell Pip the lantern's in one piece, and so am I!"
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
            "zh": "你以前喝茶，总喜欢把下巴搁在杯沿上。说过忙完这趟就回花园陪我喝。",
            "en": "You used to rest your chin on the rim of your teacup. You promised we'd have tea in the garden when the trip was over."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "我和你……以前就这么熟啊？",
            "en": "Were we really that close before?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "嗯。你没回来的那些日子，我还是每天泡两杯。后来就习惯了。",
            "en": "Yes. All those days you were gone, I kept making two cups. It became a habit."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "那这杯就给我吧。以前的事虽然想不起来，可今天我在这儿呀。",
            "en": "Then I'll have this one. I can't remember those days, but I'm here today."
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
            "zh": "约好回花园喝茶",
            "en": "Promise tea in the garden"
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
              "zh": "那这杯就给我吧。以前的事虽然想不起来，可今天我在这儿呀。",
              "en": "Then I'll have this one. I can't remember those days, but I'm here today."
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
        "search": [
          {
            "speaker": "player",
            "text": {
              "zh": "等我想起来了，咱们回花园再喝一次，好不好？",
              "en": "When I remember, let's have tea in the garden again, okay?"
            }
          },
          {
            "speaker": "muling",
            "text": {
              "zh": "……好。说定了。",
              "en": "…Okay. It's a promise."
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
            "zh": "终于到了！我也想看看那些古地图，能跟你们进去吗？",
            "en": "We're here! I'd love to see those old maps too. Can I come in?"
          }
        },
        {
          "speaker": "baikan",
          "text": {
            "zh": "找星铃的图纸？巧了，前些天有猫来借过，还问我中央那把锁怎么松开。",
            "en": "The Star Bell plans? Funny, a cat borrowed them recently and asked how to loosen the central lock."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "那把锁不是不能乱动吗？谁会想打开它？",
            "en": "Isn't that lock supposed to stay shut? Who would want to open it?"
          }
        },
        {
          "speaker": "baikan",
          "text": {
            "zh": "是啊。星铃坏的时候会吞掉记忆，那把锁就是为了拦住它。借阅记录在里面，进来查查吧。",
            "en": "Exactly. A broken Star Bell takes memories. The lock was there to hold it back. The borrowing records are inside. Let's have a look."
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
            "zh": "欢迎！先擦擦爪子，别把云上的泥带进书库哦。",
            "en": "Welcome! Wipe your paws first. No cloud mud in the library!"
          }
        },
        {
          "speaker": "moye",
          "text": {
            "zh": "巡铃的记录在里面。公用的图随便看，别的猫留下的私人信件可不能乱翻。",
            "en": "The bellkeeper records are inside. Public charts are for everyone, but don't rummage through anyone's private letters."
          }
        },
        {
          "speaker": "yuanfan",
          "text": {
            "zh": "先找小曦以前的记录吧。我想知道这几张图是怎么画出来的。",
            "en": "Let's find Sunny's old records. I want to know how those maps were made."
          }
        },
        {
          "speaker": "baikan",
          "text": {
            "zh": "沿镜廊往里走。最近镜子老是照出不该有的东西，跟紧我。",
            "en": "Through the mirror hall. The mirrors have been showing things they shouldn't lately. Stay close."
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
            "zh": "两只暮铃！刚才我差点跟错了。",
            "en": "Two Lunas! I nearly followed the wrong one."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "假的只会学已经听过的铃声。我换个节奏，它就跟不上了。",
            "en": "The copy could only repeat the sounds it had heard. Change the rhythm and it couldn't keep up."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "怪不得。真的你还会等我。",
            "en": "That explains it. The real you waited for me."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "这里才是入口。修好里面的古铃，镜子就不会乱照了。",
            "en": "This is the real entrance. Fix the bell inside and the mirrors will settle down."
          }
        },
        {
          "speaker": "moye",
          "text": {
            "zh": "当心！还有一只镜影挡着古铃，它在学你们的招式。",
            "en": "Watch out! Another reflection is guarding the bell, copying your moves."
          }
        },
        {
          "speaker": "baikan",
          "text": {
            "zh": "好了，路通了。修铃吧。",
            "en": "There. The way is clear. Let's fix the bell."
          },
          "afterOperations": [
            "battle:mirror-guardian"
          ]
        },
        {
          "speaker": "lingyu",
          "text": {
            "zh": "书库？听得到吗？我们在云海！",
            "en": "Library, can you hear us? We're out in the clouds!"
          },
          "afterOperations": [
            "melody:library"
          ]
        },
        {
          "speaker": "moye",
          "text": {
            "zh": "听到了。奇怪，两边的铃已经能传声了……去看看旧图纸。",
            "en": "We hear you. Interesting… the two bells can carry sound between them again. Let's see those old plans."
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
        "zh": "第一位守铃人",
        "en": "The first Bellkeeper"
      },
      "previous": "library:M-02",
      "lines": [
        {
          "speaker": "player",
          "text": {
            "zh": "这幅画……是我和你？怎么跟咱们现在长得一模一样？",
            "en": "This picture… is it you and me? We look exactly the same."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "嗯。那时候我们还一起照看星铃。",
            "en": "Yes. Back when we looked after the Star Bell together."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "可画里的星铃是完整的。我不是普通的巡铃猫吗？",
            "en": "But the Star Bell in the picture is whole. I thought I just inspected local bells."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "你是最早的守铃人。六座地方的古铃，都由你和大家一起照看。",
            "en": "You were the first Bellkeeper. You and the others looked after all six local bells."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "原来如此。那后来到底发生了什么？",
            "en": "I see. So what happened after that?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "一颗落星砸碎了星铃。它一直夺走大家的记忆。你为了让它停下来，把自己的记忆留在了里面。",
            "en": "A falling star shattered it. It kept stealing everyone's memories. To stop it, you left your own memories inside."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "可我明明留下了信，说那把锁不能开。我现在却醒了……怎么回事？",
            "en": "But I left a note saying the lock had to stay shut. And now I'm awake… how did that happen?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "……小曦，我有件事一直没敢告诉你。你看过借阅记录就会明白。",
            "en": "…Sunny, there's something I haven't had the courage to tell you. The borrowing record will explain it."
          }
        },
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
            "zh": "暮铃，这不是你铃坠上的印记吗？借图那天，正好是各地又开始失忆的日子。",
            "en": "Luna, isn't this the mark on your pendant? The day these plans were borrowed was the day the forgetting started again."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "暮铃……是你动了星铃的锁？",
            "en": "Luna… you loosened the Star Bell's lock?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "是我。我想让你醒过来。我知道松开锁会有回响跑出去，可我以为来得及把铃修好。",
            "en": "I did. I wanted you to wake up. I knew loosening it would let echoes escape, but I thought I'd have time to fix the bells."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "那风铃镇的阿婆，还有被困在树根里的小猫……都是因为这件事？",
            "en": "Then Gran getting lost, and the kitten trapped in the roots… was all of that because of what you did?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "……嗯。你醒过来的时候，我很高兴。看到阿婆以后，我才知道自己闯了多大的祸。可我不敢告诉你。",
            "en": "…Yes. I was so happy when you woke. Then I saw Gran and realized how much harm I'd done. I was too scared to tell you."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "要是古铃修不好呢？你为什么还借了这张图？",
            "en": "What if we couldn't fix the bells? Why did you need these plans?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "图上还有个办法……把大家的记忆送给星铃，换回一个人的。我当时想，至少能让你想起来。",
            "en": "There's another route on the plans… feed everyone's memories to the Star Bell to restore one cat's past. I thought at least I could bring yours back."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "你想过阿婆会怎么样吗？她连自己家的门都认不出来了！",
            "en": "Did you think about what would happen to Gran? She couldn't even recognize her own door!"
          }
        },
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
              "zh": "我现在不想谈这个。先找办法救大家。",
              "en": "I don't want to talk about this right now. Let's find a way to help everyone."
            }
          },
          {
            "speaker": "muling",
            "text": {
              "zh": "好。墨页刚才说有另一种接法。",
              "en": "Okay. Quill mentioned another way to connect the bells."
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
        "zh": "不必忘掉谁",
        "en": "No one has to forget"
      },
      "previous": "library:M-04",
      "lines": [
        {
          "speaker": "moye",
          "text": {
            "zh": "先看刚才的模型。把六座铃的记忆都送往中央，最后就只有一个人的记忆留下。",
            "en": "Look at the model we just used. Send all six bells' memories inward, and only one cat gets theirs back."
          }
        },
        {
          "speaker": "baikan",
          "text": {
            "zh": "可如果六座铃彼此接通，就能让记忆回到原来的主人。谁也不用替谁失忆。",
            "en": "But connect the six bells to each other, and memories can return to their owners. No one has to forget for someone else's sake."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "所以，森林和风铃镇能互相听见，云海也能听见千灯城……我们已经做对了一部分？",
            "en": "So when the forest heard Windchime, and the clouds heard Lantern City… we'd already made part of that work?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "是。可还差最后一座铃，中央的锁也得等六地连好才能彻底打开。",
            "en": "Yes. One bell is still missing, and the central lock mustn't open fully until all six are connected."
          }
        },
        {
          "speaker": "baikan",
          "text": {
            "zh": "星坠原！最后一座在那里。以前的巡铃记录也存在那里。",
            "en": "Starfall! That's where the last bell is. The old inspection records are there too."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "我先去守着中央的锁，不让回响再跑出来。你不到，我绝不会再碰它。",
            "en": "I'll go watch the central lock so no more echoes get out. I won't touch it again until you're there."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "我去星坠原。先把大家的记忆保住，再想我的事。",
            "en": "I'll head to Starfall. Everyone's memories come first. Mine can wait."
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
            "zh": "多亏你们找对了星石，商队总算过来了。",
            "en": "Thanks for finding the right star stones. The caravan's finally through."
          }
        },
        {
          "speaker": "xingya",
          "text": {
            "zh": "有只银色猫刚往中央遗迹去了。你们是一路的吗？",
            "en": "A silver cat just went toward the central ruins. Is she with you?"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "是。我们得修好这里的铃。对了，我想看看观星台当年留下的记录。",
            "en": "Yes. We need to fix this bell. And I'd like to see the old records at the observatory."
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
            "zh": "再等等！也许还能把几座铃接起来！",
            "en": "Wait! Maybe we can still connect some of the bells!"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "六座铃全断了。大家已经连家人都不认识了。咱们来不及了。",
            "en": "All six bells are disconnected. Cats can't even recognize their families anymore. We're out of time."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "那怎么办？你别一个人进去！",
            "en": "Then what do we do? Don't go in alone!"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "先用我的记忆让星铃停下来，再把锁关上。等六座铃都修好，才能安全打开。",
            "en": "Use my memories to quiet the Star Bell, then shut the lock. Don't open it until all six local bells are repaired."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "信我会放在花园。你答应我，就算忘了自己，也要想办法回来。",
            "en": "I'll keep your letter in the garden. Promise me you'll find a way back, even if you forget who you are."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "好。到时候，记得给我留杯茶。",
            "en": "I promise. And when I do, save me a cup of tea."
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
            "zh": "你来啦……我没碰那把锁。",
            "en": "You're here… I haven't touched the lock."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "我看见当年的记录了。原来那时真的没别的办法。",
            "en": "I saw what happened back then. There really wasn't time for another way."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "有一天，我泡了两杯茶，却想不起另一杯给谁。我害怕再等下去，就连你都忘了……但这不是我伤害大家的理由。",
            "en": "One day I made two cups of tea and couldn't remember who the other was for. I was afraid I'd forget you too… but that doesn't excuse what I did."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "我很想记起以前的事。可是栖蓝、芽禾、小栗……现在认识的朋友，我也不想忘。",
            "en": "I want my old memories back. But Skye, Fern, Pip… I don't want to lose the friends I know now either."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "我不想再让谁回不了家。",
            "en": "I don't want anyone else to lose their way home."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "最后一座铃就在这里。咱们一起修，等大家都接上再开锁。",
            "en": "The last bell's here. Let's fix it together, then wait until everyone's connected before opening the lock."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "好。这次咱们一起决定。",
            "en": "Okay. This time we decide together."
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
            "zh": "星坠原？听得见！风铃镇的铃也好好的！",
            "en": "Starfall? We hear you! Windchime's bell is fine too!"
          }
        },
        {
          "speaker": "yahe",
          "text": {
            "zh": "森林这边也能听见！",
            "en": "We hear you in the forest too!"
          }
        },
        {
          "speaker": "xingya",
          "text": {
            "zh": "六座都接上了！等中央那把锁打开，记忆就能沿这些路回去。",
            "en": "All six are connected! Once the central lock opens, memories can travel back along those routes."
          }
        },
        {
          "speaker": "jiedeng",
          "text": {
            "zh": "小曦，忙完这趟回来吃饭啊！",
            "en": "Sunny, come back for supper when you're done!"
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
        "zh": "封印再次松动",
        "en": "The seal slips"
      },
      "previous": "starfall:F-04",
      "lines": [
        {
          "speaker": "player",
          "text": {
            "zh": "六座铃都接好了……咦？这盏灯是谁送我的？",
            "en": "All six bells are connected… Wait. Who gave me this lantern?"
          },
          "narration": false
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "是小栗！不好，中央的锁又松动了。回响在抢记忆！",
            "en": "Pip! Oh no, the central lock's slipping again. The echoes are stealing memories!"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "先去中央！不能让它把刚接好的路也弄断。",
            "en": "To the Star Bell! We can't let it break the connections we just made."
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
            "zh": "门口的回响退了。先别碰锁，刚才那一声差点让你忘了小栗。",
            "en": "The echoes at the entrance have retreated. Don't touch the lock yet. That last chime nearly made you forget Pip."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "前面还有假的铃声。咱们跟紧点，别被它骗了。",
            "en": "There are more false chimes ahead. Let's stick together so they can't fool us."
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
            "zh": "刚才那个假的我，来来回回只会说‘我会在这里等你’。",
            "en": "That false version of me kept saying the same thing: 'I'll be waiting here.'"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "可我一走，你就跟上来了。它连看都没看我。",
            "en": "But when I moved, you followed. It didn't even look at me."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "它只会重复以前的事，根本不知道我们现在想做什么。",
            "en": "It only repeats the past. It has no idea what we're doing now."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "那团最大的回响还挡着星铃。再让它这么响下去，大家又会失忆。",
            "en": "The biggest echo is still blocking the Star Bell. If it keeps ringing like that, cats will start forgetting again."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "六地还连着。咱们先把它赶走，再一起打开锁。",
            "en": "All six local bells are still connected. Let's drive it away, then open the lock together."
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
            "zh": "风铃镇听见啦！",
            "en": "Windchime hears you!"
          }
        },
        {
          "speaker": "jinpo",
          "text": {
            "zh": "千灯城的灯还亮着呢！",
            "en": "Lantern City's lights are still on!"
          }
        },
        {
          "speaker": "xingya",
          "text": {
            "zh": "六座铃都接着，没断！",
            "en": "All six bells are still connected!"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "大家都好好的……这回真的做到了。",
            "en": "Everyone's okay… We really did it this time."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "暮铃，可以开锁了。让大家的记忆回去吧。",
            "en": "Luna, it's safe to open the lock now. Let everyone's memories go home."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "嗯。一起。",
            "en": "Yes. Together."
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
        "zh": "记忆回来了",
        "en": "Memories return"
      },
      "previous": "finale:B-03",
      "lines": [
        {
          "speaker": "muling",
          "text": {
            "zh": "小曦……你还认得我吗？",
            "en": "Sunny… do you still know me?"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "暮铃！我想起来了。以前那棵树、窗边的茶……还有阿婆和小栗，我一个都没忘！",
            "en": "Luna! I remember now. The old tree, our tea by the window… and Gran and Pip. I haven't forgotten anyone!"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "那我后来做的那些事……你也记得？",
            "en": "And what I did afterwards… you remember that too?"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "记得。我们先去看阿婆，好吗？答应过的事得一件一件做好。",
            "en": "I do. Let's visit Gran first, okay? We've got promises to keep, one at a time."
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
            "zh": "小曦……我还能回花园吗？",
            "en": "Sunny… may I come back to the garden?"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "可以呀。以后有什么事，咱们都商量着来。还有，那杯茶可别忘了。",
            "en": "Yes. From now on, we'll talk things through together. And don't forget that cup of tea."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "不会啦。我去找檐灯配把钥匙……你要鱼饼还是蜂蜜饼？",
            "en": "I won't. I'll ask Alder for a key… fish cakes or honey biscuits?"
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
