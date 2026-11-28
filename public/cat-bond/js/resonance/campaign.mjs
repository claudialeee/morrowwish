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
        "zh": "走丢的铃声",
        "en": "The missing chime"
      },
      "previous": "prologue:P-05",
      "lines": [
        {
          "speaker": "qilan",
          "text": {
            "zh": "阿婆，您家门口系的是蓝绳！……咦？怎么每家的铃都响得一样？我的耳朵可没听错呀。",
            "en": "Gran, your bell has a blue ribbon! Wait. Why do all the bells sound alike? My ears can't be that bad."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "我叫暮铃。星铃上次碎的时候，好多猫也突然不认得回家的路了。",
            "en": "I'm Luna. Last time the Star Bell broke, cats couldn't even find their own homes."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "等等，这曲子……我会唱。你看，我一哼，鱼摊那边的铃纹就亮了！",
            "en": "Wait. I know that tune. Look! The markings by the fish stall lit up when I hummed."
          }
        },
        {
          "speaker": "qilan",
          "text": {
            "zh": "补好那三组铃纹，看看光往哪儿去了。我先陪着阿婆，别让她再走丢。",
            "en": "Fill in those three patterns and see where the light went. I'll stay with Gran so she doesn't get lost."
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
        "zh": "寻回铃纹",
        "en": "Restore the bell patterns"
      },
      "previous": "harbor:H-01",
      "lines": [
        {
          "speaker": "qilan",
          "text": {
            "zh": "找到了！那团光钻进旧铃房了。你们听，里面吵得要命。",
            "en": "There it goes, into the old bell house! Listen to that racket."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "檐灯就在里面。他懂很多旧曲子。走散了就摇两下铃，我来找你。",
            "en": "Alder's inside. He knows the old songs. If we get separated, ring twice and I'll find you."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "还得问问那首曲子。我明明没学过啊。",
            "en": "And that tune. How on earth do I know it?"
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
            "zh": "刚才是你在哼歌？那是老巡铃人唱的归家调！我好多年没听过了。",
            "en": "Was that you humming? That's the old bellkeepers' homecoming song! I haven't heard it in years."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "巡铃人？我连自己叫什么都不知道，怎么会唱他们的歌？",
            "en": "Bellkeepers? I can't even remember my name. How do I know their song?"
          }
        },
        {
          "speaker": "jiedeng",
          "text": {
            "zh": "我还留着一张他们的旧图。哎哟！铃舌兽挡住古铃了！快帮我把它赶走。",
            "en": "I've still got one of their old maps. Oh, bother! A Belltongue Beast is blocking the bell. Help me chase it off!"
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
            "zh": "总算安静了。没伤着吧？",
            "en": "Finally, some quiet. You hurt?"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "没有。你呢？",
            "en": "I'm fine. You?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "还好。就是尾巴炸得像个鸡毛掸子。",
            "en": "I'm fine. My tail looks like a feather duster, though."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "哈哈，我帮你捋捋。",
            "en": "Ha! Here, let me smooth it down."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "走，帮檐灯修好古铃，阿婆就能认得家门了。他还答应给你看旧图呢。",
            "en": "Come on, let's fix Alder's bell so Gran can find home. He's still got that map to show you."
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
            "zh": "阿婆认得家门啦！来，看看这张旧图。上面记着你哼的那首歌，还有巡铃人去过的地方。",
            "en": "Gran found her front door! Come look at this old map. It has your song on it, and the places its owner visited."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "咦？图上这座花园，不就是我醒来的地方吗？",
            "en": "Wait, isn't this the garden where I woke up?"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "下一站是眠根林。说不定那儿还有猫记得画图的人！",
            "en": "Rootsleep Forest is next. Someone there might remember who drew this!"
          }
        },
        {
          "speaker": "qilan",
          "text": {
            "zh": "对！把地图交给我吧，保证不带你们钻进鱼摊！",
            "en": "Yep! Let me handle the map. I promise not to lead you straight into a fish stall."
          }
        },
        {
          "speaker": "jiedeng",
          "text": {
            "zh": "路上小心。到了摇个铃，让我知道你们没事。",
            "en": "Take care out there. Give me a ring when you arrive."
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
            "zh": "站住站住！爪子别往前伸！这桥昨天还通着，今天又拐弯了。",
            "en": "Stop! Paws back! That bridge was fine yesterday, but it's turned again."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "我想找画这张旧地图的猫。你认得这片叶子吗？",
            "en": "I'm looking for the cat who drew this old map. Do you recognize that leaf?"
          }
        },
        {
          "speaker": "yahe",
          "text": {
            "zh": "是月叶！你看，底下还有只小猫，困在树根里了。",
            "en": "A moonleaf! Look down there. A kitten's caught in the roots."
          }
        },
        {
          "speaker": "yahe",
          "text": {
            "zh": "到岔路拨一下月叶，桥就会转向地下。先救小猫，再过桥找榆川。",
            "en": "Turn the moonleaf at the fork to swing the bridge down. Free the kitten, then cross and find Rowan."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "好！它一定吓坏了，先把它抱出来。",
            "en": "Right. Poor little thing must be terrified. Let's get it out."
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
            "zh": "小家伙没事就好！你们这张图……我见过类似的。老树上也有这样的刻痕。",
            "en": "Glad the little one is safe! That map… I've seen marks like those on the old tree."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "真的？带我去看看吧。我在找画图的猫。",
            "en": "Really? Could you show me? I'm looking for whoever drew it."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "老树那条路还在乱转。得先想办法过去。",
            "en": "The path to the old tree keeps shifting. We've got to reach it first."
          }
        },
        {
          "speaker": "qilan",
          "text": {
            "zh": "等等，我先把这条路画下来。可别让下一只小猫也掉进根丛里。",
            "en": "Hold on, I'll mark the path. No more kittens getting stuck down there."
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
            "zh": "老树明明就在前面，可路怎么一直绕弯？",
            "en": "The old tree's right there. Why does the path keep bending away?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "风铃镇的古铃修好以后，阿婆就记得家在哪儿了。这里说不定也是古铃出了事。",
            "en": "Once we fixed the town bell, Gran remembered where home was. Maybe this bell is the problem too."
          }
        },
        {
          "speaker": "yahe",
          "text": {
            "zh": "对！古铃就在老树上。让桥不再乱转，就能看清那里的旧刻痕。",
            "en": "Right! The bell's on the old tree. Once the paths settle, we can read those marks."
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
        "zh": "树记得我的爪印",
        "en": "The tree remembers my paw"
      },
      "previous": "forest:R-03",
      "lines": [
        {
          "speaker": "yuchuan",
          "text": {
            "zh": "你看，树上的刻痕和旧图一样，连那条没画完的路都对得上。图角这火纹是千灯城的，烬婆准认得。",
            "en": "Look, the marks on the tree match your map, even the unfinished path. That's a Lantern City maker's mark. Ember will recognize it."
          }
        },
        {
          "speaker": "qilan",
          "text": {
            "zh": "檐灯！听得见吗？我们到眠根林啦！",
            "en": "Alder! Can you hear me? We made it to Rootsleep!"
          }
        },
        {
          "speaker": "yahe",
          "text": {
            "zh": "给你颗种子！记得浇水啊，别拿鱼汤浇。",
            "en": "Here, a seed for your garden! Water, not fish broth, please."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "檐灯居然听得到！那条没画完的路……画图的猫是不是也在想办法让古铃连起来？",
            "en": "Alder can hear us all the way here! That unfinished path… Was the map's owner trying to link the bells too?"
          }
        },
        {
          "speaker": "yahe",
          "text": {
            "zh": "下次回来，告诉我种子长多高啦。",
            "en": "Next time you visit, tell me how big it's grown!"
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
            "zh": "来来来，看我的歪耳猫！它一摇尾巴，连我都想扑上去抓。",
            "en": "Come see my crooked-ear cat! When its tail wiggles, even I want to pounce on it."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "咦，你都把灯移开了，它怎么还在跑？",
            "en": "Wait, you moved the lamp. Why is the shadow still running?"
          }
        },
        {
          "speaker": "jinpo",
          "text": {
            "zh": "这火纹是我家的！以前有个巡铃人留下过一只灯匣，就在藏灯室。可三只影子钻进去了，先把它们找出来吧。",
            "en": "That's my family's mark! A bellkeeper left a lantern case in the vault. Three shadows slipped inside, though. Can you find them first?"
          }
        },
        {
          "speaker": "xiaomao",
          "text": {
            "zh": "我还以为大家会嫌它耳朵歪呢。",
            "en": "I thought everybody would laugh at its crooked ears."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "才不歪呢，是特别好认！下次来我家演吧，我给你留最好的坐垫。",
            "en": "Crooked? It's what makes it special! Bring your show to my garden. I'll save you the best cushion."
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
            "zh": "都找齐啦。瞧，就是那只灯匣。",
            "en": "That's all three. Look, there's the case I told you about."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "我能看看吗？说不定跟地图有关。……那些影子怎么又动了？",
            "en": "May I look inside? It might explain the map. Wait, the shadows are moving again."
          }
        },
        {
          "speaker": "xiaomao",
          "text": {
            "zh": "它们变成剪影兽了！我来照着它，你们快帮忙！",
            "en": "They're turning into a Shadow Beast! I'll keep the light on it. Help!"
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
            "zh": "赢啦！这回影子乖乖跟着灯走了。",
            "en": "We did it! Look, the shadows are behaving again."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "小栗，灯照得真准！现在可以去看看灯匣了。",
            "en": "Nice work with that lamp, Pip! Now we can take a look at the case."
          }
        },
        {
          "speaker": "jinpo",
          "text": {
            "zh": "等一下，古铃也得修。它再响起来，我说不定就能想起是谁把匣子送来的。",
            "en": "One moment. We still need to fix the bell. When it rings, I might remember who brought the case."
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
            "zh": "匣子里有张去月镜书库的图。看，这个小月牙就是云脊群岛的入口。",
            "en": "There's a map to Moonmirror Library inside. See the crescent? That's its entrance in Skyspine."
          }
        },
        {
          "speaker": "jinpo",
          "text": {
            "zh": "我想起来了，是落星之后的事。那只猫说，要是有一天连回家的路都忘了，就去书库看看。",
            "en": "I remember now. It was after the star fell. That cat said if they ever forgot the way home, they should look in the library."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "……它也怕自己忘了回家的路？就像我一样。",
            "en": "…They were afraid of forgetting home too? Just like me."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "它是不是早就知道自己会失忆？我想知道那只猫是谁。",
            "en": "Did they know they were going to lose their memory? I need to find out who that was."
          }
        },
        {
          "speaker": "jinpo",
          "text": {
            "zh": "我没看清它的脸。不过书库保存着巡铃人的旧画，兴许能找到你要的人。",
            "en": "I never saw their face clearly. But the library keeps old pictures of the bellkeepers. You might find your cat there."
          }
        },
        {
          "speaker": "xiaomao",
          "text": {
            "zh": "这盏歪耳灯送你！拿好，不许摔。",
            "en": "Here, take my crooked-ear lantern! Don't drop it."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "等等，去书库还得飞？你们可别笑我啊。",
            "en": "Wait. We have to fly to the library? No laughing at me, okay?"
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
            "zh": "你们要去月镜书库？灯匣里的图画的是两座高岛，月门就在它们中间。",
            "en": "Heading to Moonmirror Library? Your map shows two high islands. The moon gate is between them."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "我可不怕高。就是……爪子有点舍不得地面。",
            "en": "I'm not afraid of heights. My paws are just a little attached to the ground."
          }
        },
        {
          "speaker": "lingyu",
          "text": {
            "zh": "先练练滑翔吧。起飞后拖动就能升降。沿云路找航线记录，咱们再去月门。",
            "en": "Let's practice gliding first. Drag to fly higher or lower. Follow the cloud trail to the flight log, then we'll find the gate."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "行，你们可别飞太快啊！",
            "en": "All right. Just don't leave me behind!"
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
            "zh": "以前有只猫说，忙完就回花园喝茶。它总爱把下巴搁在杯子边上。",
            "en": "A friend once promised we'd have tea in the garden. They always rested their chin on the rim of the cup."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "那它后来回家了吗？",
            "en": "Did they ever come home?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "没有。它没回来。我却总是多拿一只杯子。",
            "en": "No. They never came back. I still set out an extra cup."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "今天我陪你喝吧。我也可以把下巴搁这儿。",
            "en": "I'll have tea with you today. I can rest my chin here, too."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "小心烫着胡须。……谢谢你。",
            "en": "Mind your whiskers. …Thank you."
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
              "zh": "今天我陪你喝吧。我也可以把下巴搁这儿。",
              "en": "I'll have tea with you today. I can rest my chin here, too."
            }
          },
          {
            "speaker": "muling",
            "text": {
              "zh": "小心烫着胡须。……谢谢你。",
              "en": "Mind your whiskers. …Thank you."
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
            "zh": "终于到月门啦！我能跟你们一起进去吗？我也想知道那张图是谁画的。",
            "en": "We made it to the moon gate! Can I come in with you? I want to know who drew that map too."
          }
        },
        {
          "speaker": "baikan",
          "text": {
            "zh": "你们也是来查旧巡铃人的？前阵子有只猫借过星铃的图，还问我怎么打开封印。",
            "en": "Are you here about the old bellkeepers too? A cat borrowed a Star Bell map recently and asked how to open its seal."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "封印？有人动过星铃？那……我醒来的事和大家失忆，会不会有关？",
            "en": "The seal? Someone's been meddling with the Star Bell? Could that be why I woke up, and why everyone's forgetting?"
          }
        },
        {
          "speaker": "baikan",
          "text": {
            "zh": "先别急。书库有以前的巡铃人壁画，进来看看，说不定能认出你要找的猫。",
            "en": "Easy now. We have murals of the old bellkeepers. Come inside. You might recognize the one you're looking for."
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
            "zh": "爪子擦干净再进来哦！看，这些镜子照的不是你，是很久以前的事。",
            "en": "Wipe your paws on the way in! Look, these mirrors don't show your reflection. They show the past."
          }
        },
        {
          "speaker": "moye",
          "text": {
            "zh": "墙上的旧画随便看。柜子里是别猫的私事，没经过同意可不能翻。",
            "en": "The murals are open to everyone. The cabinets hold private memories. Ask before opening those."
          }
        },
        {
          "speaker": "yuanfan",
          "text": {
            "zh": "先看看巡铃人的画吧。没准能找到留下灯匣的猫。",
            "en": "Let's look at the bellkeepers' pictures first. Maybe we'll find whoever left the case."
          }
        },
        {
          "speaker": "baikan",
          "text": {
            "zh": "巡铃人的旧画就在镜廊，可惜现在看不清。走，我带你们过去。",
            "en": "The old bellkeeper murals are in the gallery, but they're hard to make out right now. Come with me."
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
            "zh": "这幅画里……怎么有我？",
            "en": "Why am I in that painting?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "……是你。",
            "en": "…That's you."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "旁边的是你。暮铃，你早就认识我？",
            "en": "And that's you. Luna, you've known me all along?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "嗯。以前，我们一起守着星铃。",
            "en": "Yes. We used to look after the Star Bell together."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "那灯匣……也是我留的吗？我到底是谁？",
            "en": "Then the lantern case… did I leave it? Who am I?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "你是第一位守铃人。地图和灯匣是你留下的。星铃碎了以后，你用自己的名字和记忆救了大家。",
            "en": "You were the first Bellkeeper. The map and the case were yours. When the Star Bell broke, you gave up your name and memories to save everyone."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "那你为什么不早点告诉我？",
            "en": "Then why didn't you tell me sooner?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "我怕你知道了，又会把自己忘掉一次。",
            "en": "I was scared you'd do it all over again."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "我想看看当年的记录。",
            "en": "I want to see what happened back then."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "好，我带你去找。",
            "en": "Okay. I'll show you where to look."
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
              "zh": "我想看看当年的记录。",
              "en": "I want to see what happened back then."
            }
          },
          {
            "speaker": "muling",
            "text": {
              "zh": "好，我带你去找。",
              "en": "Okay. I'll show you where to look."
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
        "zh": "那串不该响起的铃声",
        "en": "The bell that should have stayed silent"
      },
      "previous": "library:M-03",
      "lines": [
        {
          "speaker": "baikan",
          "text": {
            "zh": "借图的日子，正好是封印松开、大家又开始失忆的那天。暮铃，这个印记怎么跟你的铃坠一样？",
            "en": "The map was borrowed the day the seal opened and the forgetting returned. Luna, why does that mark match your pendant?"
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
            "zh": "是我。我想让你醒过来。我知道这样做可能会让别的猫失忆。",
            "en": "I did. I wanted you back. I knew other cats might start forgetting again."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "那风铃镇的阿婆找不到家时，你就已经知道原因了？",
            "en": "So when Gran couldn't find her home, you already knew why?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "嗯。我试了好多年，只能修好铃，却没法让它响。只有你会唱开头。我怕你知道真相就不肯来了。",
            "en": "Yes. For years I could fix the bells but not make them ring. Only you knew the first notes. I was afraid you'd leave if I told you."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "那你让我们修六座古铃，又是为了什么？",
            "en": "Then why have we been fixing all six bells?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "我本来想让它们重新连起来。实在不行，就把大家的记忆送进星铃，让你先想起来。",
            "en": "I wanted to reconnect them. But if that failed, I'd send everyone's memories to the Star Bell so you could remember."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "……那些猫会怎么样？你想过吗？",
            "en": "…And what would happen to everyone else? Did you think about them?"
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
            "zh": "你们都看见了吧？两种办法，结果完全不一样。",
            "en": "You saw both ways. Two very different endings."
          }
        },
        {
          "speaker": "baikan",
          "text": {
            "zh": "把记忆都收进星铃，只有一个人能记起来。让六座古铃互相连通，大家就能保住各自的记忆。",
            "en": "Send all the memories to the Star Bell and only one cat gets them back. Link the six bells and everyone can keep theirs."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "也就是说，我记起来了，阿婆却还会忘记自己的家？",
            "en": "So I get my memories back, but Gran forgets her home?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "嗯。要是六座古铃连不上，大家还是会慢慢忘掉所有事。",
            "en": "Yes. If we can't link the six bells, everyone will keep forgetting."
          }
        },
        {
          "speaker": "baikan",
          "text": {
            "zh": "可是已经有五座铃响起来啦！阿婆都能听见云海的铃声了。还差星坠原。",
            "en": "But five bells are ringing already! Gran can hear the bells up in the clouds. Only Starfall is left."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "中央星铃快撑不住了。我先去看看。",
            "en": "The Star Bell's getting worse. I'll go see what I can do."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "我不想拿大家的记忆换我的。白羽，咱们去星坠原，修好最后一座铃。",
            "en": "I won't trade their memories for mine. Ivy, let's go to Starfall and fix that last bell."
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
            "zh": "认识。可我还是想先看看观星台的记录。为什么当年只有我的记忆能让灾难停下来？",
            "en": "I do. But first I want to see the observatory records. Why was giving up my memories the only way to stop it?"
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
            "zh": "再等等！我们一定能找到别的办法。",
            "en": "Wait! There has to be another way."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "风铃镇的猫已经不认得家人了，六座铃又全断了。我们来不及一座座修了。",
            "en": "Cats in Windchime can't recognize their own families. All six bells are cut off. We don't have time to fix them all."
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
            "zh": "要让星铃停下来，得有一份记忆留在里面。用我的。",
            "en": "The Star Bell won't stop unless someone leaves their memories inside. Take mine."
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
            "zh": "我每天都泡两杯茶。每次铃一响，我就以为你回来了。结果又有一座铃不响了。",
            "en": "I made two cups of tea every day. Every time a bell rang, I thought you were home. Then another bell went quiet."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "你等了那么久……你也开始忘事了吗？",
            "en": "All that time… Have you started forgetting too?"
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "有一次，我连为什么要泡两杯茶都忘了。我怕再等下去，就连你是谁也不记得了。",
            "en": "One day I couldn't remember why I'd made two cups. I was scared I'd forget you too."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "可栖蓝还欠我一张地图，芽禾等着看种子发芽，小栗连花园里的戏台都想好了。",
            "en": "But Skye still owes me a map, Fern's waiting for her seed to sprout, and Pip's already planned a show in our garden."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "要是她们都不认识我了，那我回的还是家吗？",
            "en": "What kind of home would it be if none of them knew me?"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "先试试把最后一座古铃修好吧。说不定这次真的能成。",
            "en": "Let's fix the last bell first. This time it might actually work."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "……好。我陪你。中央的锁先别碰。",
            "en": "…Okay. I'm with you. Let's leave the central lock alone."
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
            "zh": "六座都响了！你们听，一座也没落下！",
            "en": "All six! Listen, not one is missing!"
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
            "zh": "六座铃不是都响了吗？……咦，我手里的灯是谁送的？",
            "en": "Weren't all six bells ringing? …Wait. Who gave me this lantern?"
          },
          "narration": false
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "小栗啊！糟了，刚才中央星铃响的那一声，跟当年一模一样。",
            "en": "Pip did! Oh no. That sound from the Star Bell… just like last time."
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "砾川那边的灯还亮着！快，我们得赶在大家忘掉之前阻止它。",
            "en": "Flint's light is still on! Come on, we've got to stop this before everyone forgets."
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
            "zh": "风铃镇刚才差点又没声了。我要是真把记忆都拿走，大家就不认得你了。",
            "en": "Windchime almost went silent again. If I'd taken their memories, your friends wouldn't know you anymore."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "现在星铃不再吸走记忆了。可最后那团回响还在，咱们把它赶走吧！",
            "en": "The bell's stopped taking memories. One echo's still left. Let's get rid of it!"
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
            "zh": "你……还认得我吗？",
            "en": "Do you… remember me?"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "认得。我的名字、从前的事，我都想起来了。还有阿婆的蓝绳铃、芽禾的种子、小栗的歪耳灯，一个都没忘。",
            "en": "I do. My name, my old life, all of it. Gran's blue ribbon, Fern's seed, Pip's lantern. I remember those too."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "那……我做过的那些事呢？",
            "en": "And… what I did?"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "也记得。走，先去看看大家。茶凉了再泡一壶，记得给我留块蜂蜜饼。",
            "en": "Those too. Let's check on everyone first. We can brew more tea. Save me a honey biscuit, okay?"
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
            "zh": "是我打开了封印。阿婆忘了家里的小猫，是我害的。对不起。",
            "en": "I opened the seal. Gran forgot her kitten because of me. I'm sorry."
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
            "zh": "那个……我还能住在花园吗？",
            "en": "Um… can I still live in the garden?"
          }
        },
        {
          "speaker": "player",
          "text": {
            "zh": "当然。以后有什么大事，先跟我商量。还有，别把我的坐垫占了。",
            "en": "Of course. Talk to me first next time something big comes up. And don't steal my cushion."
          }
        },
        {
          "speaker": "muling",
          "text": {
            "zh": "那我也能有一把花园的钥匙吗？",
            "en": "Could I have a garden key of my own?"
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
