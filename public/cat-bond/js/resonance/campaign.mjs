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
            "zh": "阿婆，是这儿！你家铃上系着蓝绳呢。……哎，所有铃怎么都响成了同一个调子？快看，那团光卷着铃舌跑了！",
            "en": "Gran, yours has a blue ribbon! …Wait, why do all the bells sound the same? Look, that little glow is running off with a clapper!"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "我叫暮铃。以前星铃碎过一次，那时也是这样，到处有猫忘事。",
            "en": "I'm Luna. The Star Bell broke once before. Cats all over started forgetting, just like this."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "等一下……它重复的调子我好像会。刚才我一哼，它就往旧铃房那边跑了！我想追上去看看。",
            "en": "Wait… I think I know the tune it's repeating. It headed toward the old bell house when I hummed! I want to find out why."
          }
        },
        {
          "speaker": "qilan",
          "text": {
            "zh": "它会绕回来！你从鱼摊那边截住它，我照看阿婆。暮铃，走散了就摇两下铃！",
            "en": "It'll circle back! Cut it off by the fish stall; I'll look after Gran. Luna, ring twice if you get separated!"
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
            "zh": "你截住它了！可它一闪就钻进旧铃房，那里的铃全响起来了。",
            "en": "You cut it off! But it flashed into the old bell house, and all the bells inside started ringing."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "听见你那两声铃啦，我在这儿。檐灯就在旧铃房守着，咱们去问他那团光是怎么回事。",
            "en": "I heard your two chimes. I'm here! Alder tends the old bell house. Let's ask him about that glow."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "好！他也许认得我刚才哼的曲子。",
            "en": "Right! Maybe he knows the tune I hummed."
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
            "zh": "那团光在重复你的曲子，墙上的家铃都乱了。慢着……你刚才哼的，是这里失传的归家调？",
            "en": "That glow is repeating your tune and scrambling the house bells. Wait… were you humming our lost homecoming song?"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "我没学过这首曲子。刚才不知怎么就哼出了开头……你知道它的下一句吗？",
            "en": "I've never learned it. The first notes just came to me… Do you know the next line?"
          }
        },
        {
          "speaker": "jiedeng",
          "text": {
            "zh": "我记得下一句。可我的铃声一接上，那团光就聚成了铃舌兽！它堵住古铃了，先把它赶走，我们才能让家铃各自响起来。",
            "en": "I remember the next line. But when my bell answers, the glow gathers into a Belltongue Beast! It's blocking the old bell. Drive it away so we can restore the house bells."
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
            "zh": "它散开了！幸好刚才咱俩一起把它拦住了。",
            "en": "It's dispersed! Good thing we stopped it together."
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
            "zh": "那就接着搭个伴？先陪檐灯修好古铃，让阿婆认得回家的路。我也想看看别的古铃。",
            "en": "Shall we stick together? Let's help Alder restore the bell so Gran can find her way home. I'd like to see the other bells, too."
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
            "zh": "家铃各自响起来了，阿婆认得蓝绳铃了！多亏你们。这张旧巡铃图上也有那段曲子，叶形路标指向眠根林。",
            "en": "The house bells have their own voices again. Gran recognizes her blue-ribbon bell! Thank you. This old bellkeeper's map has the same tune; the leaf mark points to Rootsleep Forest."
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
            "zh": "月叶能让根桥换方向，先把它拨向对岸。过去找榆川，他认得老路上的标记。",
            "en": "The moonleaf turns the root bridge. Bend it toward the far bank first, then find Rowan; he knows the old trail marks."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "也许走过那条老路，我就能想起些什么。我们一起过去吧！",
            "en": "Maybe walking that old trail will jog my memory. Let's go together!"
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
            "zh": "我认得老路标，可前面那段桥又在往回绕。刚才的月叶办法能不能再试一次？",
            "en": "I recognize those old trail marks, but the next bridge is looping back. Could we use the moonleaf again?"
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
            "zh": "终于过来了！刚才那座桥绕回去好多次，幸好月叶还能改变方向。",
            "en": "We made it! That bridge kept looping back. Good thing the moonleaf could redirect it."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "这回你带对了路。下一次我跟紧你。",
            "en": "You found the right way this time. I'll stick close next time."
          }
        },
        {
          "speaker": "yahe",
          "text": {
            "zh": "古树就在这儿！让它的古铃唱回自己的调子，根桥就不会再迷路啦。",
            "en": "The ancient tree is right here! Let its bell sing its own tune again, and the root bridges won't lose their way."
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
            "en": "That's the old trail map. The lantern makers' mark is still here. Ask Ember in Lantern City; she knows old things like this."
          }
        },
        {
          "speaker": "qilan",
          "text": {
            "zh": "檐灯！听见没有？我们到啦！",
            "en": "Alder! Can you hear us? We made it!"
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
            "zh": "你刚才选的影戏真好看！瞧，我这只猫的耳朵都能动。",
            "en": "Your shadow show was lovely! Look, my cat's ears can move."
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
            "zh": "旧戏散不掉，影子都堆到藏灯室那座桥上了。你们图上的火纹是我家的；里面有守铃人留下的灯匣，先照亮桥才能过去。",
            "en": "The old show won't fade, and its shadows have covered the bridge to the lantern vault. The flame mark on your map is my family's. A bellkeeper left a case inside; light the bridge to reach it."
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
            "zh": "你们照亮桥面走过来了。那就是守铃人留下的灯匣！",
            "en": "You lit the bridge and made it across. That's the case the bellkeeper left!"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "守铃人？说不定它知道那张旧图是谁画的……咦，影子怎么聚到一起了？",
            "en": "A bellkeeper? Maybe they know who drew the old map… Wait, why are the shadows gathering?"
          }
        },
        {
          "speaker": "xiaomao",
          "text": {
            "zh": "糟了，是剪影兽！它挡在灯匣前。我来照住它，你们把它赶出暗处！",
            "en": "Oh no, a shadow beast! It's blocking the case. I'll keep the light on it; drive it out of the dark!"
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
            "zh": "它散开啦！你看，幕布上的影子又跟得上我们了！",
            "en": "It’s gone! Look, the shadows on the screen are following us again!"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "多亏你扶稳了灯，小栗。不然它早就溜回暗处了。",
            "en": "Good thing you held that light steady, Pip. It would’ve slipped back into the dark."
          }
        },
        {
          "speaker": "jinpo",
          "text": {
            "zh": "好啦，这回轮到我们点灯。小栗，把那盏歪耳灯也挂上吧。",
            "en": "Now let’s light up the festival. Pip, hang up your crooked-ear lantern too."
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
        "zh": "第一次飞上云端",
        "en": "First flight above the clouds"
      },
      "previous": "forge:E-04",
      "lines": [
        {
          "speaker": "yuanfan",
          "text": {
            "zh": "刚才那趟试飞不错！那朵像大鱼的云就在前面，月门应该藏在云后。",
            "en": "Nice practice flight! That fish-shaped cloud is ahead, and the moon gate should be behind it."
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
            "zh": "你们已经学会借风落脚了。沿云路去找航线记录，先弄清月门的位置。",
            "en": "You've learned to ride the wind and land safely. Follow the cloud route to the flight record so we can find the moon gate."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "试飞都过来了。接下来你们飞慢一点就好。",
            "en": "I made it through the practice flight. Just take it a little slower on the next one."
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
            "zh": "航线画好了。借风飞到月牙岩，再让那里的古铃与千灯城答铃，我们就能找到月门。",
            "en": "I've marked our route. Ride the wind to Crescent Rock, then let its bell answer Lantern City; that should reveal the moon gate."
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
            "zh": "我们飞到月牙岩啦！刚才那股风把咱们送上来了。",
            "en": "We reached Crescent Rock! That updraft carried us right up."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "暮铃，你也到了！",
            "en": "Luna, you made it!"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "到了，围巾倒比我先到了！先让古铃唱回自己的调子吧。",
            "en": "I did, though my scarf got here first! Now let's restore the old bell's own song."
          }
        },
        {
          "speaker": "lingyu",
          "text": {
            "zh": "看，月门就在前面。走哪条路都能飞到这里。",
            "en": "Look, the moon gate is just ahead. Either route leads here."
          },
          "afterOperations": [
            "melody:sky"
          ]
        },
        {
          "speaker": "jinpo",
          "text": {
            "zh": "喂！云上那只小金猫，别把灯摔了！",
            "en": "Hey, little golden cat up in the clouds! Don't drop that lantern!"
          },
          "afterOperations": [
            "melody:sky"
          ]
        },
        {
          "speaker": "player",
          "text": {
            "zh": "听见啦！下次给你带云朵看！",
            "en": "I hear you! Next time I'll show you some clouds!"
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
            "zh": "有人在查封印？那场失忆不是自己回来的吗？",
            "en": "Someone was looking into the seal? Didn't the forgetting return on its own?"
          }
        },
        {
          "speaker": "baikan",
          "text": {
            "zh": "进来吧，书库还有从前的公开壁画，我带你们去看。",
            "en": "Come inside. The library still has public murals from those days. I'll show you."
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
            "zh": "刚才白羽说，有猫查过旧封印。说不定这里能找到线索。",
            "en": "Ivy said someone looked into the old seal. Maybe we'll find a clue here."
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
        "en": "The other Luna"
      },
      "previous": "library:M-01",
      "lines": [
        {
          "speaker": "player",
          "text": {
            "zh": "暮铃，刚才有两只猫同时摇了铃。",
            "en": "Luna, two cats just rang their bells at once."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "嗯，其中一个只会重复我刚才的铃声。",
            "en": "Yes. One of them was just repeating my last chime."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "这回我换了个办法，只有你接上了。是你！",
            "en": "I changed what I did, and only you answered. It's you!"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "我们找到了真正的门。先让书库古铃恢复回应，镜廊里的旧画也许就能看清了。",
            "en": "We found the real door. Let's restore the library bell's answer; then we may be able to see the old murals clearly."
          }
        },
        {
          "speaker": "moye",
          "text": {
            "zh": "门前的镜影在学你们的招式！先打散它，才能让古铃恢复。",
            "en": "That mirror guardian is copying your attacks! Dispel it before restoring the bell."
          }
        },
        {
          "speaker": "baikan",
          "text": {
            "zh": "镜廊终于安静了。去古铃那边吧！",
            "en": "The gallery is quiet at last. Let's go to the bell!"
          },
          "afterOperations": [
            "battle:mirror-guardian"
          ]
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
        "zh": "那串不该响起的铃声",
        "en": "The bell that should have stayed silent"
      },
      "previous": "library:M-03",
      "lines": [
        {
          "speaker": "baikan",
          "text": {
            "zh": "借图的印记……暮铃，这不是你那只铃坠么？",
            "en": "The mark on the borrowing record… Luna, isn't that your pendant?"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "等一下。那天封印松了，失忆就又开始了？暮铃，我想听你自己说。",
            "en": "Wait. The forgetting started again the day the seal was loosened? Luna, I want to hear it from you."
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
            "zh": "风铃镇那只连家都找不到的猫……你那时候就知道为什么？",
            "en": "That cat at Windchime Town who couldn't find home… you knew why, even then?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "……知道。我一个人唱不响那些铃。只有你能唱出开头。我怕告诉你，你就不肯跟我走了。",
            "en": "…I knew. I couldn't wake those bells alone. Only you knew their first notes. I was afraid you'd refuse to come with me if I told you."
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
            "zh": "嗯。万一接不起来，我想留一个办法。……对不起。那时候，我只想着怎么把你带回来。",
            "en": "Yes. I wanted another way if we couldn't reconnect them. …I'm sorry. All I could think about was bringing you back."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "你明明可以告诉我，让我自己选。你也不能替其他猫决定。",
            "en": "You could have told me and let me choose. You had no right to decide for the other cats either."
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
            "zh": "你们刚才试过模型里的两条路线了。它们会带来完全不同的结果。白羽，你带上记录。",
            "en": "You've just tested both routes in the model. They have very different consequences. Ivy, take the records."
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
            "zh": "所以就算我想起来了，风铃镇那只猫也会忘记家？",
            "en": "So even if I remember everything, the cat in Windchime Town would forget home?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "我把铃修过好多次，可没有你，它们唱不起来。要是再失败，大家还是会慢慢忘掉一切。",
            "en": "I repaired those bells so many times, but without you they wouldn't sing. If we fail again, everyone will slowly forget everything."
          }
        },
        {
          "speaker": "baikan",
          "text": {
            "zh": "风铃镇的家铃、森林的月叶、千灯城的影戏、云海上的风铃……大家已经在互相报平安了。",
            "en": "The house bells, the moonleaves, the lantern show, the wind chimes above the clouds… our friends are already answering each other."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "我想，至少得有一只猫能把从前留下来……中央那边撑不了多久了。我先去稳住它。",
            "en": "I thought at least one cat should get to keep the past… The center won't hold much longer. I'll go try to steady it."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "我想知道以前的事，可我也不想忘了今天。咱们在灯火节玩得多开心啊。不能拿他们的过去换我的。走吧，白羽，最后一座铃还没响呢。",
            "en": "I want to know my past, but I don't want to forget today either. We had such a good time at the lantern festival. We can't trade their past for mine. Come on, Ivy. There's one bell left to wake."
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
            "zh": "嗯。我还有话没跟她说完。先去看看观星台留下的旧记录，也许能知道当年究竟发生了什么。",
            "en": "Yeah. We still have something to talk about. Let's check the old observatory records first; they may explain what happened back then."
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
            "zh": "那栖蓝呢？她的地图才画了一条路。芽禾还等着看月叶。小栗连影戏都约好了。",
            "en": "What about Skye? She's only drawn one trail. Fern's waiting to see the moonleaf grow. Pip's already promised us a show."
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
            "en": "Alder (Windchime Town): We hear you! Ringing back now!"
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
            "en": "Wait, look! Flint's light is back. It's not over yet! Let's protect their voices together."
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
            "zh": "入口的回响退下去了。那把锁还是不能碰，差一点你就连这一路的事都忘了！",
            "en": "The echoes at the entrance have fallen back. We must still leave that lock alone; you almost lost our whole journey!"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "这次我不是一个人。前面的回响连你的声音都在模仿，咱们用真正的回应把它分辨出来。",
            "en": "This time I'm not alone. The echoes ahead are even copying your voice. Let's tell them apart by how they really answer."
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
            "zh": "刚才那个回响一直在学我说：我会在这里等你。",
            "en": "That echo kept copying my words: I'll wait for you here."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "可我换了个问题，它就答不上来了。",
            "en": "But when I changed the question, it couldn't answer."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "对，它只会重复刚才那句。真正的回应不是这样。",
            "en": "Right. It only repeats the last line. A real answer isn't like that."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "是我把他们的声音压下去了。刚才我亲手停掉了那条旧路线。",
            "en": "I'm the one who drowned out their voices. I've just shut down that old route myself."
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
            "zh": "你们守住了亮处，灯还在！",
            "en": "You kept the light safe. It's still shining!"
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
            "en": "Hear that? Those are their own voices. Luna, open it."
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
            "zh": "记得。我想起了我的名字，还有以前的事。以前说好了回家喝茶。风铃镇那场架、森林里那条绕来绕去的路……后来这些，我也都记得。",
            "en": "I do. I remember my name and my life before. We promised to have tea back home. And that fight in Windchime Town, the winding forest path… I remember everything we've done since, too."
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
        "zh": "第二把钥匙",
        "en": "The second key"
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
        "en": "Today's water levels are recorded. Fern has checked them too."
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
        "zh": "图纸给小栗看过了。谁发现问题，谁就先说。",
        "en": "Pip has checked the diagram. Whoever sees a problem speaks first."
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
