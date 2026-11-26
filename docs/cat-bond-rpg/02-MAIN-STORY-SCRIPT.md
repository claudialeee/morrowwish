# 星铃回响 · Echoes of the Starbell
## Canon 2.1 — A World Worth Remembering / 奇幻冒险完整重写

**状态：Canon 2.1 玩家动力迭代稿（第二轮），未迁移至运行时，未实机验收，未部署。** 本稿在 Canon 2.0 基础上完成反套路审查，取代此前 Canon 1.3 的全部章节事件、强制任务、玩家对白与美术接入要求；1.3 原稿及旧运行时保留作历史参照，不再作为新玩法验收标准。世界因果、核心身份、暮铃的责任、完整幸福结局保留。允许重做不够好玩的内容，不因资产或测试沉没成本降低品质。旧版本固定链接： https://github.com/claudialeee/morrowwish/blob/76aae0af7964d74bc44f4cd96742c3108dd294b0/docs/cat-bond-rpg/02-MAIN-STORY-SCRIPT.md

## 地区地理与名称（唯一公开命名）
风铃镇（Windchime Town）是阳光花园外的山谷小镇，不在海边；镇民在屋檐挂家铃，用不同音色辨认家门。千灯城（Lantern City）是山地灯匠城，节庆光影是当地生活的一部分，不是工业设施。其余四地为眠根林（Rootsleep Forest）、云脊群岛（Skyspine Isles）、月镜书库（Moonmirror Library）、星坠原（Starfall Expanse）。风铃镇与千灯城的旧技术 ID 分别仍为 `harbor`、`forge`，只用于迁移定位，不得出现在玩家可见文本、地图、任务或音频字幕。角色檐灯（Yandeng，旧 ID `jiedeng`）是风铃镇修铃匠、栖蓝是镇中熟悉小巷的年轻探路者。归家调取代旧的海上旋律命名。总地图、区域图、道具、角色职业与场景音频都按山谷镇及灯匠城重构。

## 游戏承诺与因果
玩家醒来后只知道自己丢了名字，星铃守护记忆且近日遗忘复发。追随古铃给出的个人线索旅行，先发现不可能在现实发生的奇幻现象，再学会当地的玩法、结识猫咪、取得答案。每个地方恢复的真实回应让最终解法有根基。地图线索不应只引向下一章；至少风铃镇与森林、森林与千灯城的回铃应让玩家在中途就看到此前帮助的角色仍在行动。幕间可自由探索、捕捉/招募猫咪和培养队伍，主线不被刷资源、物资、好感或稀有度阻塞。主角是固定金渐层，暮铃是银渐层；单猫操控，伙伴实际参战。每一章不同的主要动作：追逐、地形探索、光影空间、飞行、镜中推理、星光遗迹、综合战斗。不存在必须到每地区调解一桩纠纷的模板。

**奇幻规则（作者知道，玩家逐渐发现）：** 空白回响是破损星铃未得到真实回应时产生的重复现象，可复制图像、声音、动作，不具备理解或独立恶意。地方古铃原本各有当地的魔法表现（风铃镇声音、森林生长、千灯城光影、天空风、书库影像、星原星光）；失去回应后，各自的魔法被重复现象扰乱。真实花朵会因玩家行动改变，真正的伙伴会根据玩家的新动作回答，复制只会重复旧内容。假象的形态变化源于当地魔法与回响叠加，不新增六个无关反派或六种新灾难。主人公的第一音仅能发起当地旋律，当地居民的自主回应才能修复其古铃，不能用假回响或收藏数量替代。暮铃偷偷将已恢复的铃调向中央；主角旅途中的朋友建立了真正的联系，最终有能力让六铃彼此接续，中央不必再用任何猫的记忆维持封印。早期不给技术术语，书库以可操作模型说明两种方案的代价，星原历史记录解释为什么当年的牺牲是必要的。最终真实合作与稳定验证不可省略；不设货运前置。

## 线索与回报
| 章节 | 玩家主动去的原因 | 必得的新答案 | 下一步 |
|---|---|---|---|
| 序章 | 找回名字 | 古铃可能认识我 | 风铃镇古铃 |
| 风铃镇 | 听到熟悉的歌 | 我会唱早已失传的旋律 | 叶形刻记在森林 |
| 森林 | 追寻刻记 | 我甚至知道旧路怎么画 | 火焰印来自千灯城 |
| 千灯城 | 寻找印记来源 | 印记属于守铃人 | 书库有记录，入口在天空 |
| 天空 | 找书库入口，也想帮暮铃 | 失忆前有猫从书库借走星铃旧图；暮铃在等一位朋友 | 镜廊的历史 |
| 书库 | 查清我的身份 | 我曾是守铃人；暮铃认识我且造成新灾 | 赶到最后一座铃证明另一条路 |
| 星原 | 找暮铃，不牺牲别的猫 | 当年的选择与约定；六地真的可以相互回应 | 保住所有声音 |
| 终章 | 与伙伴一起回家 | 恢复所有记忆，暮铃承担责任 | 自由世界 |

## 反模板设计约束（Canon 2.1）
最重要的世界特征不是六种魔法，而是**猫咪用铃声找回家的路**。风铃镇每家门铃不同，森林的月叶桥为猫引路，千灯城的灯影记住每家想念的东西；这些地方原本就有用途，不是等玩家来触发随机怪事。星铃的作用是守住各自的记忆，回响只会复刻过去；它不随意赋予物体生命、制造实体影桥或突然变出新规则。奇观先让玩家看到正常用途，再看到失常。区域道具与旧巡铃图属于同一条历史路线，而不是每章掉落下一把钥匙。旧图不是万能道具，负责路标、工匠印与月门入口，主角仍须从行动取得线索。
- 节奏有高低：风铃镇实战、森林探索（无必打Boss）、千灯城战斗、天空飞行（无必打Boss）、书库伙伴推理（默认无必打Boss）、星原追寻/历史（无必打Boss）、终章集中战斗。不得为了凑章节长度增加守卫。
- 两声铃是玩家与暮铃主动约定的普通信号，不是超自然万能密码。第一次用于集市拐角，战后确认平安，书库用新发起与等待回应辨认真伙伴，暮铃离队时主角摇铃却无人回，结局再由暮铃主动回应。不要预告伏笔意义。
- 各地恢复古铃后可用独立的短暂试铃通道给相邻地区报平安，邻居必须确实收到并回应；主路线仍由暮铃调向中央，短试铃不能替代最终稳定环路。风铃镇↔森林于 R-04，森林↔千灯城于 E-04，千灯城↔天空于 S-03，天空↔书库于 M-02，书库↔星原和星原↔风铃镇于 F-04；只通过当场短动作/伙伴真实回应完成，不重复任务。最终证明不是“大家是朋友所以魔法成功”，而是六对邻居已真实回应且能承受中央失稳。
- 审查标准：若移除猫咪、铃声、记忆三个核心，某场景仍几乎不变，就要重写；若更换地区名称后玩法与剧情仍等价，就删重复。任何独立魔法奇观须有当地用途、明确规则、玩家可行动的结果。不要每段台词都抖包袱，也不要每章重复“真假”“守护”“回应”等抽象结论。

## 中文原生对白规范（先中文，后英文适配）
中文是创作原文，不是英文逐句对译。说话像真实的角色：短、自然、有停顿、有潜台词，不把玩法说明或编剧主题塞进角色嘴里。不用“真正的回应”“验证方案”“保持个体记忆”等抽象词替代角色眼前看见的具体事物。动作提示由地图、特效或 UI 承担，人物只说自己有理由说的话。
- 主角：好奇、直接，有一点得意和玩心；遇到背叛会追问，不做长篇道德演讲。
- 暮铃：聪明、嘴硬、带点干巴巴的幽默，伤心时反而说得少；前期双关不能泄露身份，不用网络流行语。
- 栖蓝/远帆：兴奋、敢试、语速快，不能说成任务引导机器人。芽禾活泼俏皮；榆川话少，务实；小铆一张嘴就是点子，烬婆老练爽利；白栞爱发现，墨页沉静但不打官腔；星芽专注，砾川直来直去。
- 每句尽量表达一个意思；能演出来就不解释。仅在确实发生过的事件上引用回忆；B-04 的默认对白只回忆必经风铃镇与森林事件，不提可错过的花园初遇。
- 英文独立本地化，确保意义、人物态度、伏笔与分支条件一致，不要求字对字。UI 目标也必须中文原生，不使用开发术语；例如“跟着亮起来的月叶走”，不写“验证真实路径”；“让六座铃接着唱”，不写“完成双向共鸣配置”。实际运行时与所有分支仍需母语级复核。

## 每章的玩家体验硬要求
开场迅速给可玩的奇观；一次主要玩法有真实选择或技巧、可读反馈、失败可恢复；短对白穿插行动。每章提供一个可选秘密、一次队伍成长/伙伴机会、一项可见世界变化。既可沿主线流畅推进，也可主动偏离探索；不必清空地图。不强迫大量新系统；必要时新增可复用的真正玩法。不得将操作列表或按钮确认当作游玩，不准因减少测试而保留原无聊事件。地区Boss不设配额。剧情伙伴加入必须有自身动机：栖蓝探路、小铆试飞、远帆想去书库看古地图、白栞追查失忆；不能每章自动派发一只猫。未加入的居民以所在地短回应和本地支援完成主线，避免所有NPC同时拥进队伍。下文为完整主线的场景、行动、触发、关键中英对白和出口要求，具体数值、动画时长、操作细节需根据实机迭代。场景 ID 是设计迁移定位，不要求保留旧 operation IDs。选择仅在改变路线、帮助方式或关系反馈时保留；台词带条件的必须由真实状态触发。所有关键对话和操作目标双语；可选内容不得成为必要理解条件。

## 序章 · 一座陌生的花园 / Prologue — The garden with no name

**本章体验：** 温暖、自由、立刻获得个人目标；不强制看电影，不泄露主角和暮铃的过去。

### prologue:P-01 · 花园醒来 / Awake in the garden

**实机事件与推进：** 可跳过的短背景页：星铃守护记忆；多年前破碎，灾难曾平息；最近遗忘重新出现。阳光花园中醒来。立即可玩。跳过者在风铃镇看到一个忘记自己门铃的居民，并听到暮铃一句必要背景。

**关键对白（ZH / EN）：**

- 很久以前，星铃守护着六片土地上的猫咪。有一年，星铃被落下来的星星撞碎了，许多猫渐渐忘了朋友、家园，甚至自己的名字。后来，灾难终于平息。可最近，又有猫开始忘事了。 / Long ago, the Star Bell protected the memories of cats across six lands. Then a falling star shattered it, and many cats forgot their friends, their homes, even their own names. The disaster finally passed. But lately, the forgetting has returned.

### prologue:P-02 · 没有名字的猫 / A cat without a name

**实机事件与推进：** 固定金渐层；自由移动、扑蝴蝶、拨动草丛、拾落花。花园门旁的老木牌写着“风铃镇·修铃匠”，即使跳过旧铃与暮铃，也有合理的求助方向。门边有一枚磨损的空白木名牌和两道不同高度的爪痕；主角可把名牌翻过来，背面只有一笔被磨掉的刻字。只表现这曾是有猫生活的地方，不展示守铃标志、第二只猫肖像或固定姓名。玩家可保留名牌在庭院原位，日后回收；不另设必收道具。旧铃在主角靠近时发出短音；无需逐点完成教程。若未走近，通往风铃镇的路标明确指向有古铃的城镇。

**关键对白（ZH / EN）：**

- 主角：咦，这是哪儿？……等等，我叫什么？ / Huh? Where am I? …Wait, what's my name?
- 主角（听见铃才说）：刚才那声铃……怎么有点耳熟？ / That chime… why does it sound so familiar?

### prologue:P-03 · 一张不肯落地的地图 / A map that won't land

**实机事件与推进：** 风吹走暮铃的地图，玩家可移动帮忙；她站在另一端拦住地图。可以错过，不损失关键线索；不自动招募。

**关键对白（ZH / EN）：**

- 暮铃：哎！别飞了！我就剩这一张地图啦！ / Hey! Come back! That's my last map!
- 暮铃：谢啦，我叫暮铃。风铃镇有座老铃，听说附近有猫认识以前的旅行者。要不要去碰碰运气？ / Thanks! I'm Muling. Windchime Town has an old bell, and some cats there remember the travelers who used to visit. Might be worth a look.

### prologue:P-04 · 出去看看 / Let's see what's out there

**实机事件与推进：** 沿路有草坡、远处屋檐下成排的风铃与明确风铃镇标志。不需要物品或额外解谜。玩家可回花园，自由离开。

**关键对白（ZH / EN）：**

- 主角：反正在这儿也想不起来。去风铃镇看看吧！ / I'm not remembering anything here. Off to Windchime Town, then!

### prologue:P-05 · 第一站，风铃镇 / First stop, Windchime Town

**实机事件与推进：** 抵达热闹集市。初见路线与已认识暮铃路线汇合。第一章的会跑光团事件在玩家附近启动；不强制观看长演出。

**关键对白（ZH / EN）：**

- 栖蓝（远处）：哎！那是我的铃！ / Hey! That's my bell!

## 第一章 · 追着铃声跑的小怪物 / Chapter I — Catch that chime!

**本章体验：** 一个本该普通的集市突然活起来；追逐、秘密铃房、第一次真正的双猫战斗。沿着自己竟然会唱的旧曲，第一次主动走进另一个世界。

### harbor:H-01 · 会逃跑的铃声 / Catch that chime

**实机事件与推进：** 集市不是任意魔法展示。当地猫在门前挂不同的铃，家猫用两声短铃叫对方回家。开场栖蓝正在帮一位老猫辨认门铃；她摇自己家的铃，老猫却往相反方向走，经过自家门口时仍认不出门。栖蓝扶她坐在鱼摊边；她摸出给家里小猫买的糖，却想不起该给谁。玩家看到的是一个具体的人失去生活，不只是铃变响。街上突然有一团卷着铃舌碎光的小回响，照搬刚才的呼唤，令所有门铃响成同一声。主角无意中哼出曲子的下一句，小回响立刻沿旧铃房方向退去（它重复旧旋律和路径，并非有意引诱）。主角主动追：想知道自己怎么会唱。暮铃察觉老猫的处境，先把糖包放好、请摊主照看她，再与主角追上去；她没有声称知道回响来自哪里。她需要主角的第一音恢复六铃，但也真心想陪伴主角；后续 M-04 必须由她承认两重动机，不能让玩家误以为一切友情都是演戏。若跳过序章，此处补一句星铃旧灾和近期遗忘。

**关键对白（ZH / EN）：**

- 栖蓝：阿婆，是这儿！你家铃上系着蓝绳呢。……哎？怎么全响了？ / Gran, over here! Yours has a blue ribbon. …Hey, why are they all ringing?
- 主角：等一下……这调子我好像会。 / Wait… I think I know this tune.
- 暮铃：它往旧铃房去了。走，别跟丢。 / It's heading for the old bell house. Come on.

### harbor:H-02 · 穿过风铃巷 / Through Chime Lane

**实机事件与推进：** 街巷追逐沿明确路线：小回响反复经过同一对门铃，玩家第一次可跟在后面观察，第二次从低矮围墙旁抄近道或绕鱼摊截住。栖蓝熟悉街巷，叫住摊主让出窄路；暮铃在拐角摇两下随身铃，玩家找到她后也摇/拍两下回应。两声是这段共同经历中约定的信号，不是神秘解锁口令。迟到不失败，回响在下一路口重复原轨迹。旁边可选野猫：被不断响起的铃吓得躲在篮子后，玩家让环境安静、靠近后可结识，不强制捕捉。

**关键对白（ZH / EN）：**

- 栖蓝：它又绕回来了！你从鱼摊那边过去，我堵这头！ / It's coming around again! You go past the fish stall; I'll cover this end!
- 暮铃：转角看不见就摇两下。我听得见。 / If we lose sight of each other, ring twice. I'll hear you.
- 主角：好，两下。 / Got it. Twice.

### harbor:H-03 · 唱歌的旧房子 / The house that hums

**实机事件与推进：** 檐灯正在收拾旧铃房，墙上一排居民家的旧门铃与风铃镇古铃相连。主角唱出第一音；小回响只能重复，檐灯接下一句时门铃分别亮起各自颜色。玩家循两段实际铃声的方向走至古铃，视觉光纹替代听觉；不再独立出三道谜。回响被真实不同的铃声打断，重叠成挡路的铃舌兽。主角发现墙上的曲谱有自己刚才无意唱出的开头。檐灯接完下一句时，暮铃正忙着扶倒下的灯架；不要安排她提前唱出失传旋律（否则她的身份与隐瞒过早成为唯一答案）。

**关键对白（ZH / EN）：**

- 檐灯：慢着。你刚才唱的，能再唱一遍么？ / Hold on. Can you sing what you just sang?
- 主角：是墙上这段？我可没学过呀。 / The tune on the wall? I've never learned it.
- 檐灯：这就怪了。老曲子没几只猫会唱。 / That's odd. Hardly anyone knows the old tune.
- 暮铃：檐灯，你守住那盏灯。它要过来了！ / Yandeng, keep that lamp steady. Here it comes!

### harbor:H-04 · 两只猫，一场漂亮的胜利 / Two cats, one good fight

**实机事件与推进：** 一次真实双猫战斗。铃舌兽有清楚的横扫预警和短暂硬直，檐灯的真铃照出安全位置。暮铃用既有暗系控制技能制造窗口，玩家利用普通攻击或技能，双猫合击只在实际触发后演出。不要把本章机制变成一串按钮。获胜后玩家先看见暮铃被灰尘呛得咳嗽，伸爪拉她；两声铃互报平安。她在实际合作后邀约结伴。主线一次战斗足够，不追加第二场。

**关键对白（ZH / EN）：**

- 暮铃：我按住它了！快！ / I've pinned it! Now!
- 主角：你没事吧？ / Are you all right?
- 暮铃：没事。……就是这下得洗毛了。 / Fine. …I'll need a bath, though.
- 主角：嘿嘿，咱俩还挺厉害。 / Heh. We make a pretty good team.
- 暮铃：那就接着搭个伴？我也想去看看别的古铃。 / Shall we stick together, then? I want to see the other bells too.

### harbor:H-05 · 一首我忘记的歌 / A song I forgot

**实机事件与推进：** 檐灯与栖蓝唱完本地后半段，旧门铃重新各有声音；阿婆循蓝绳铃回家，一只等在门口的小猫扑上来；她认出小猫、把糖分给孩子和主角。恢复的是眼前被回响压住的近期记忆，不是主角留在中央封印的过去。糖可直接吃或带回花园，不影响剧情。檐灯取出一张旧巡铃图：画着风铃镇至眠根林的叶形路标，曲谱开头与主角的音一致。图曾是巡铃人用来走访六地的路线，不是凭空出现的藏宝图。栖蓝加入是因为阿婆已经平安、檐灯请她把风铃镇恢复的消息带给森林的守铃猫；她本就爱探路。图背面有一小幅未画完的阳光花园入口，门边画着空白的木名牌（即使未在花园互动也能认出门）。主角发现图与自己的住处有关，决定沿图找绘图者，而不只是为下一地解谜。檐灯约定森林那边若听见风铃镇的铃，就摇回一声；这是后续真实跨地联系的起点。檐灯示范古铃侧钮后交给暮铃收尾，玩家能在同一镜头看到她用铃坠调整；没有可疑特写。

**关键对白（ZH / EN）：**

- 檐灯：这张旧图上也有那段曲子。瞧，这片叶子是眠根林的路标。 / The old map has that tune too. See the leaf? That's the sign for Rootsleep Forest.
- 主角：画图的猫说不定认识我！ / Maybe whoever drew it knew me!
- 栖蓝：我认路。走，咱们去问问！ / I know the way. Come on, let's ask!
- 檐灯：到了记得摇铃，给我报个平安。 / Ring back when you arrive, so I know you're safe.
- 主角：这不是我醒来的花园吗？画图的猫也去过那里！ / Isn't that the garden where I woke up? Whoever drew this has been there!


## 第二章 · 森林把路藏起来了 / Chapter II — The forest that hides its paths

**本章体验：** 进入会改变形状的迷宫，寻找自己竟然认识的旧路。核心乐趣是观察环境、路线选择和发现；不是再追一只怪。

### forest:R-01 · 会挪窝的树 / Trees that move

**实机事件与推进：** 眠根林平常的奇观是沿树冠生长的月叶桥，古铃的声音让桥根在一夜间慢慢移向下一处营地。近期它们却反复伸向旧位置，居民绕回起点。芽禾正用一片月叶给来往的猫指路，旁边花朵可选互动。栖蓝拿出风铃镇旧巡铃图，芽禾认出叶形标记对应一条已经失去的老路；芽禾原本要带一株会打喷嚏的小月叶到榆川那里，却被循环桥困住。主角主动提出一起带路：若真的走过此地，老路或许会唤起记忆。她不是发放钥匙的任务NPC。

**关键对白（ZH / EN）：**

- 芽禾：看着脚下呀！这条桥昨天还通着呢，今天又拐回来了。 / Watch your step! This bridge led somewhere yesterday. Today it just turns back.
- 主角：这张图是风铃镇找来的。你见过这片叶子吗？ / We found this map at Windchime Town. Have you seen this leaf?
- 芽禾：月叶呀！老路就在那边。能不能走过去，就得看你的本事啦。 / A moonleaf! The old path is over there. Getting across is another matter.

### forest:R-02 · 一条会长出来的路 / A path that grows

**实机事件与推进：** 本章只用一个核心动作：走到可生长的根节点，站在月叶朝向的一侧让根桥连接对应支路，立即看到桥伸展、可通过，离开后保持直到另一节点切换。上层路线宽、能看地图全貌；地下路线短，有根须阻挡。没有强制战斗；野猫挑战可选。两路汇合处榆川保存旧路标，主角凭本能补出图上缺的一笔，根桥接上最后一截；不能凭空画出新能力，旧巡铃图给可见线索。两条路各有独立惊喜而非纯长短差异：树冠可发现花园山谷的方向，地下可救出被根须隔住的野猫（可选）；两路都能回来，不锁主线。暮铃认得图上的旧路符号，但不抢主角解谜；让她先走错一处再由主角发现更好路线。

**关键对白（ZH / EN）：**

- 榆川：图上少了一截。你怎么知道该往这边画？ / A piece of the map is missing. How did you know the line goes this way?
- 主角：不知道……就是觉得该这么走。 / I don't know… it just felt right.
- 暮铃：我看得懂这几个老路标。可缺的这一笔，得靠你啦。 / I can read these old trail marks. But that missing line is all yours.

### forest:R-03 · 森林的坏梦 / The forest's bad dream

**实机事件与推进：** 不用第二场强制Boss。林间出现一处回环，玩家站在不同侧重新让根桥生长，真正根桥按新方向改变，复制桥固守上一次方向。一次可以看懂的空间挑战：改变路线、穿越到古树；卡住时芽禾给视觉提示，不要求背口诀。暮铃先走错，主角叫住她，她接受玩家引路；两猫分别站在桥头和新方向，暮铃提醒别踩到尾巴，主角走过后回身等她。不是用按钮确认合作。紧张来自迷路，不是又长出一只怪兽。若喜爱战斗，可挑战根系回响，获额外成长奖励而非古铃前置。

**关键对白（ZH / EN）：**

- 主角：暮铃，等等！那条桥又绕回去了。 / Muling, wait! That bridge loops back again.
- 暮铃：……还真是。行，这回你带路。 / …You're right. Fine, you lead this time.
- 芽禾：这边这边！桥长过来了！ / Over here! The bridge is growing toward us!

### forest:R-04 · 树记得我的爪印 / The tree remembers my paw

**实机事件与推进：** 旧路恢复，榆川与芽禾回应古铃；风铃镇檐灯的两声平安铃从旁侧响起，芽禾现场摇回森林自己的旋律，玩家看见风铃镇方向的灯亮起，两地回复完成（这是短暂测试通道，不是全环已经稳定）。古树露出曾被回环遮住的旧刻记：一条不通往任何铃的支路，终点画着小花园，旁边两只猫爪印大小不同。主角发现旧巡铃人并非只关心古铃，也在各地留下生活痕迹；这幅图可以由另一位曾经的旅行者绘制，不在此确认主角身份。树皮上出现旧巡铃图同一笔迹；图角的灯匠火纹标识维修巡铃图的千灯城工坊，非另一枚无关魔法钥匙。芽禾将月叶种子送主角，栖蓝把回应记在图上。暮铃仍将主要输出转向中央。

**关键对白（ZH / EN）：**

- 榆川：这是旧路上的画。千灯城灯匠的火纹还在，去问烬婆吧，她认得这种老东西。 / That's the old trail map. The lantern makers' mark is still here. Ask Jinpo in Lantern City; she knows old things like this.
- 栖蓝：檐灯！听见没有？我们到啦！ / Yandeng! Can you hear us? We made it!
- 芽禾：种子给你。回去记得浇水，别拿鱼汤浇啊。 / Here, take a seed. Water it when you get home. No fish soup!
- 主角：这条路没通到铃，倒通到一座花园。画图的猫还挺会找地方玩嘛。 / This trail doesn't lead to a bell. It leads to a garden. Whoever drew it knew where to have fun.


## 第三章 · 不肯熄灭的影子 / Chapter III — The shadows that won't fade

**本章体验：** 一次奇幻灯火节与影子剧场冒险。由好奇和庆典吸引进入，核心是用灯光揭开被影子遮挡的真实空间。

### forge:E-01 · 全城的灯笼都在跳舞 / A city of dancing lanterns

**实机事件与推进：** 灯火节有当地传统：每只猫用一盏灯在墙上投出自己最想记住的事。烬婆正为小铆的一盏歪耳灯调光；玩家实际让自己的灯投出猫影，选择鱼、蝴蝶或猫影作为此次灯火节的记忆，立即看见旁边暮铃给它添一颗小星；选项只改变纪念灯图案，默认自动保留最初轮廓，不成为门槛。主角拥有一段现在的回忆，而不是只寻找过去。小铆认得森林火纹，带玩家见烬婆。烬婆见到旧图先认出她家做过的灯匣，却想不起把灯匣交给谁；这是回响造成的真实记忆缺失，恢复灯火后才解开。回响让影戏里已演完的剪影不断重复，越叠越黑，挡住通向旧藏灯室的路；不是所有影子突然有生命。

**关键对白（ZH / EN）：**

- 小铆：来来来，你也挑盏灯！瞧，我这只猫的耳朵都能动。 / Come on, choose a lantern! Look, my cat's ears can move!
- 主角：你刚才那只猫……怎么还在跑？ / That cat you just made… why's it still running?
- 烬婆：别添灯了。旧戏没散，越照越乱。 / No more lights. The old shadows won't fade; you're just making it worse.

### forge:E-02 · 影子底下的桥 / The bridge beneath the shadows

**实机事件与推进：** 灯影不能凭空成为实体。旧藏灯室有一条原本就存在的石桥，被反复叠加的影子遮住，黑暗区域的方向提示消失。玩家转动一盏可拖动的灯，让真实桥面清晰、影子缩短，走到对岸；另一盏可选照出隐藏壁龛。烬婆认出火纹属于她家曾替巡铃人制作的灯。她指出藏灯室中有旧灯匣；匣底刻守铃人标记和书库旧章，玩家照亮桥后首次看见它。盒内图还未取出。

**关键对白（ZH / EN）：**

- 烬婆：这纹是我家老灯匠的。以前守铃人来过，留下个灯匣。 / That's my family's old mark. A bellkeeper once came here and left a lantern case.
- 主角：守铃人？能让我看看么？ / A bellkeeper? Can I see it?
- 小铆：先把灯往这边挪。桥就在底下，照亮就能走！ / Move the lantern this way first. The bridge is right there; we just need to light it up!

### forge:E-03 · 最大的影子猫 / The biggest shadow cat

**实机事件与推进：** 本章主战斗：重复影戏聚成剪影兽，移动时有可读剪影预警，玩家把敌人引入灯光范围才露出真身；小铆维持灯，烬婆给一处安全亮区，玩家通过真实走位/技能打出窗口。没有温压控制、不做第二道灯光谜；可通过普通技能取胜，不强迫火或光猫。战后小铆主动修好自己造成的乱子（演出未照顾观众但不是回响起因），先问旁边猫想看什么，再重开影戏。

**关键对白（ZH / EN）：**

- 小铆：糟了！它钻进灯影里了！ / Oh no! It's slipped into the shadows!
- 暮铃：引它过来。等它站到灯底下再打。 / Draw it over here. Strike when it's under the light.
- 烬婆：灯有我呢！ / I'll keep the light on!

### forge:E-04 · 把星星挂回夜空 / Hang the stars back up

**实机事件与推进：** 当地猫唱承火调，灯火重新显出每家不同的影戏。旧灯匣内完整巡铃图带守铃人标记及月镜书库藏书章，并画一扇月形门在云脊群岛。烬婆恢复记忆后想起：当年的来客嘱咐她留下灯匣，说若有一天连回家的路都忘了，就让来找它的猫去书库。她只记得嘱咐，没看清来客的脸；玩家可猜是原主人的安排，也可猜是某个关心自己的猫留下的。此处首次提出旧图是有人刻意留给将来的猫，而不是一串随机路标。森林芽禾回应千灯城小铆的报平安铃，两者各有声音；可见实际跨地回复。小铆将歪耳灯送主角并自愿同行去试飞，非强制送货。小铆在旁示范旋钮维修，暮铃协助调整向中央的路径；不增加另一次可疑停顿。

**关键对白（ZH / EN）：**

- 烬婆：这月牙印是月镜书库的。以前巡铃人从云脊那扇月门进去。想查名字，去那儿。 / That crescent is Moonmirror Library's seal. The old bellkeepers entered through a moon gate in Skyspine. Look for your name there.
- 小铆：这盏送你！耳朵歪是特色，不许笑。 / This one's yours! The crooked ear is a feature, not a mistake.
- 暮铃：接下来得飞。先说好，谁笑谁自己走。 / Next stop means flying. Anyone who laughs can walk.
- 烬婆：我想起来了。那猫说，要是哪天有谁忘了怎么回家，就把这匣子给它。 / I remember now. The cat said, if someone ever forgot the way home, I should give them this case.
- 主角：怎么像是专门留给我的……？ / It's almost as if someone left it for me…


## 第四章 · 天空中的秘密岛屿 / Chapter IV — The island beyond the clouds

**本章体验：** 全游戏最自由、漂亮、温馨的一章。实际滑翔发现隐藏岛屿、星空倒映、两杯茶。

### sky:S-01 · 第一次飞上云端 / First flight above the clouds

**实机事件与推进：** 远帆邀请主角试滑翔。先一段安全短飞行，玩家操控方向、利用上升气流，能够随时落地重试。暮铃的围巾先被风吹得笔直，嘴硬说只是在检查风向。翎羽提供简短安全提示。

**关键对白（ZH / EN）：**

- 远帆：瞧那朵云，像不像条大鱼？走，咱们从鱼嘴里钻过去！ / See that cloud? Looks like a giant fish! Come on, let's fly through its mouth!
- 暮铃：谁怕高了？我就是看看……地还在不在。 / Scared of heights? Me? I'm just checking… the ground's still there.

### sky:S-02 · 地图上没有的岛 / The island not on the map

**实机事件与推进：** 云瀑会遮住月门，但正常风向让云分开。月门的位置在灯匣图中已有明确线索：两座高岛之间的月牙岩。玩家从不同高度看清岩石，选稳妥环线或利用上升风近路；不做真假云判断（森林已教辨认）。翎羽在远处标出落脚岛，远帆陪飞。可选高岛有猫咪和风羽，并能从高处看见先前恢复的风铃镇与千灯城灯光；不是另一道主线谜。

**关键对白（ZH / EN）：**

- 翎羽：图上这两座山我认得。月门就在中间，云把它挡住了。 / I recognize those two peaks. The moon gate lies between them, behind the clouds.
- 远帆：从高处绕一圈就能看见啦！跟我来！ / Circle above them and you'll see it! Follow me!

### sky:S-03 · 倒流的云瀑 / The upside-down waterfall

**实机事件与推进：** 飞行本身是高潮：短连续滑翔，穿上升气流、绕云瀑、找安全落点，路线选择影响难度与景观；可慢速辅助，不能自动成功。风的异常表现是上升气流周期重复造成一段强回卷，真实风圈由翎羽的风旗标出，不再添加假云选择题。抵达后远帆和翎羽从两侧唱逐风调，风路恢复，月门显露；千灯城灯匣与天空风铃彼此传出实际短回复。无强制Boss。

**关键对白（ZH / EN）：**

- 远帆：借这股风往上飞！前面就是月牙岩！ / Ride this updraft! That's the crescent rock ahead!
- 主角：暮铃，快到了！ / Muling, we're almost there!
- 暮铃：我还没到呢，围巾倒先飞过去了！ / My scarf made it before I did!

### sky:S-04 · 留着的那杯茶 / A cup for someone missing

**实机事件与推进：** 落地后是星空和云海观景台，玩家实际坐下或走动，暮铃摆两杯茶；短而必经的相处。主角先给今天发生的事起个名字（例如穿过鱼嘴云或围巾先到），暮铃以此为话题；玩家可选玩笑、陪坐或帮忙寻找朋友，三种回应各有一句不同的双语反馈。玩家现在想保留的是与新朋友一起度过的日子。无修铃坠动画，无历史图。若未做额外茶互动，也因本幕确实建立两杯茶约定而可回收。

**关键对白（ZH / EN）：**

- 暮铃：以前有只猫跟我说，等忙完了，回花园喝茶。 / Someone once told me we'd have tea in the garden when all our work was done.
- 主角：那后来呢？ / What happened after that?
- 暮铃：……那杯茶，我就一直留着。 / …I've kept a cup for them ever since.
- 主角：等找到我的名字，咱们也去找你那位朋友！下回多带一只杯子。 / Once we find my name, let's look for your friend too! We'll bring another cup next time.
- 暮铃：……好。 / …All right.
- 暮铃（玩家开玩笑）：你还好意思说，那朵云差点把咱俩都吞了。 / You're one to talk. That cloud nearly swallowed us both.
- 暮铃（玩家陪坐）：这样也挺好。今天先记住今天吧。 / This is nice too. Let's remember today for what it is.
- 暮铃（玩家主动提出帮忙）：那……说定了。 / Then… it's a promise.


### sky:S-05 · 月门那边的访客 / The visitor through the moon gate

**实机事件与推进：** 月门原本是书库的普通访客入口，认识旧调即可开门；主角第一音与当地恢复的古铃只是让其风路可达。白栞从里面回应，说明前阵子有猫借走中央星铃的旧图后就从门离开，借阅登记由白栞在书库保管，此处不展示印记；她只说借阅者查的是如何开启旧封印，而非名字名册。玩家第一次知道近期有猫主动碰过封印，但嫌疑人尚不确定。这个事实与失忆时间接近，后来可验证暮铃来过书库、取得旧图；不暗示只有主角能唱的能力也被另一猫使用。白栞邀请主角看公开壁画；书库尚未恢复，不在此处提前确认跨地回复。

**关键对白（ZH / EN）：**

- 白栞：咦，你们从月门来的？前阵子也有只猫走这条路，还借走了星铃的老图。 / Oh, you came through the moon gate? Someone else took that route recently and borrowed an old map of the Star Bell.
- 主角：老图？上面会不会有守铃人的名字？ / An old map? Could it have the bellkeepers' names?
- 白栞：进来吧，我给你找。 / Come inside. I'll look for it.
- 主角：有人在查封印？那场失忆不是自己回来的吗？ / Someone was looking into the seal? Didn't the forgetting return on its own?

## 第五章 · 镜子里的另一个我 / Chapter V — The cat on the other side

**本章体验：** 先让玩家用一路建立的默契辨认真正的伙伴，再给身份与背叛双重反转。

### library:M-01 · 一面走得进去的镜子 / A mirror you can walk through

**实机事件与推进：** 白栞邀请玩家进入公共记忆镜廊：镜子保存旧事件的图像，不恢复个人真实记忆。墨页解释只有当事人允许才打开私人回忆，主线使用公开壁画和修铃记录，不需要隐私政策选择。主角进入镜像风铃镇，看到走过的场景却有细节不对。

**关键对白（ZH / EN）：**

- 白栞：这些镜子可不一般。你站过来，瞧，里头还留着从前的景象呢。 / These aren't ordinary mirrors. Stand here. See? They still hold scenes from the past.
- 墨页：旧画尽管看。只是别猫的私事，没点头就不要翻。 / Look at the old public pictures all you like. Leave private memories alone unless their owners say otherwise.

### library:M-02 · 假的暮铃 / The other Muling

**实机事件与推进：** 只保留一个真正有情感的镜中选择，不轮流重做前四章。镜中风铃镇的两声铃反复响起；两只暮铃出现，一只重复上一次的两声，另一只等主角先摇两声才回摇，并根据玩家走的位置转身。玩家主动摇铃或靠近再判断，错误有提示可退回，不靠猜美术差异。这个信号在 H-02、H-04 都已实际发生，必须无条件成立。辨认后合力打开公开壁画的真实门；此处没有必打Boss。墨页与白栞引导主角唱出书库古铃的第一音，两位居民接续本地旋律，镜廊恢复正常。翎羽由天空古铃向书库报平安，墨页回铃，完成天空与书库的实际短回复。古铃恢复后的旋钮调整由墨页主持，暮铃按旧图帮忙；玩家可见主声路指向中央，不给予作者式的危险提示。

**关键对白（ZH / EN）：**

- 假暮铃：过来，我在这儿。 / Come here, I'm over here.
- 主角：暮铃，老办法！ / Muling, our usual signal!
- 暮铃（等玩家摇完才回两声）：听见了。过来吧。 / Heard you. Come on over.
- 主角：这边才是你。 / There you are.

### library:M-03 · 原来你认识我 / You knew me

**实机事件与推进：** 壁画经验证后显现昔日守铃人和银渐层暮铃。主角亲自认出自己；留安静空间。暮铃承认曾共同守铃以及主角主动留下名字和记忆平息灾难。主角对着公开壁画试做画中巡铃人的招牌敲铃动作，发现自己无须思考便能完成；图角记录的未完刻字与旧图一致，千灯城那句留给忘记回家之猫的嘱咐竟是过去的主角自己留下的。不是因为长得一样就确定身份。玩家可追问、表达伤心或独处，暮铃分别回答；后续继续。

**关键对白（ZH / EN）：**

- 主角：画里的那只猫……是我？ / That cat in the picture… is me?
- 暮铃：是。 / Yes.
- 主角：那咱们第一次见面的时候……你就认出我了？ / So when we first met… you already recognized me?
- 暮铃：……以前，我们俩一起守着星铃。那场灾难要不是你把记忆留在铃里，早就控制不住了。 / …We used to look after the Star Bell together. You left your memories inside it. Without that, the disaster would never have stopped.
- 主角：为什么不告诉我？ / Why didn't you tell me?
- 暮铃：我怕你知道了，又把自己丢下。 / I was afraid you'd leave yourself behind again if you knew.
- 主角：灯匣也是我留下的？原来我一直在给自己找回家的路。 / I left the lantern case too? All this time, I'd been leaving myself a way home.
- 暮铃（玩家要独处）：好。我在门外，你叫我就来。 / All right. I'll be outside. Call if you need me.
- 暮铃（玩家追问或伤心）：我本该早点告诉你。 / I should have told you sooner.


### library:M-04 · 那串不该响起的铃声 / The bell that should have stayed silent

**实机事件与推进：** 白栞在借阅记录认出暮铃铃坠的印记，找出她借走的中央旧图和日期；墨页出示公开星铃观测记录，显示封印松开当天失忆重新出现。玩家在同一台借阅桌把铃坠登记印、观测日期和公开声路图三项证据对应起来；可自由先查看任意一项，正确连接会亮出当时的中央指向，错误可撤回。若不愿推理，白栞可把原件并排指给主角看；不因没亲手检查漏掉必要事实。不是回放未见事件。证据仅证明借图、日期与路径，暮铃亲口确认是她松开封印并秘密调向中央。不要用万能镜子看到从未记录的私密动作。

**关键对白（ZH / EN）：**

- 白栞：借图的印记……暮铃，这不是你那只铃坠么？ / The mark on the borrowing record… Muling, isn't that your pendant?
- 主角：等一下。那天封印松了，失忆就又开始了？ / Wait. The forgetting started again the day the seal was loosened?
- 暮铃：……是我。我松开了封印，才让你醒过来。那时我知道别的猫也可能开始忘事。 / …It was me. I loosened the seal so you'd wake up. I knew the other cats might start forgetting again.
- 主角：风铃镇那只连家都找不到的猫……你那时候就知道为什么？ / That cat at Windchime Town who couldn't find home… you knew why, even then?
- 暮铃：……知道。每座铃都得你来唱第一声，我才有办法接上星铃。可我也是真的想跟你再走一趟。 / …I knew. I needed you to sing the first note at each bell so I could connect them to the Star Bell. But I really did want to travel with you again.
- 主角：那你怎么不问问我愿不愿意？ / Then why didn't you ask me?
- 暮铃：……对不起。 / …I'm sorry.

### library:M-05 · 如果铃声只能属于一个人 / If the song belonged to only one cat

**实机事件与推进：** 一个可操作的直观模型：六个有独特颜色和旋律的铃，向中央汇入时各色变灰，仅主角记忆恢复；彼此接续时每色保留。两条路必须都真实演示；模型只显示短时运行，完整环能否承受中央持续失稳仍未证明。中央正在失去封印内的旧记忆锚：若没有稳定替代，旧记忆可能再也找不回来，且回响可能覆盖旅途中形成的新记忆。不是主角肉体将凭空消失。玩家可用灯火节的纪念灯或必经的风铃镇糖包意象理解新记忆也值得守护；不解释分布式系统。暮铃过去修过铃但从未得到完整回应；她得知中央的旧记忆锚开始散去，前往星坠原尝试稳住旧装置。她不承诺放弃向内方案，但不是无缘无故逃离。暮铃离开后，主角习惯性摇两声铃，第一次没有回音；无需对白解释。玩家决定去最后一座铃，让朋友一起证明另一条路可行；白栞加入协助。

**关键对白（ZH / EN）：**

- 白栞：你看，六盏铃都往中间响，颜色就混成一团了。你的记忆能回来，可其他猫的过去就没了。 / Look. When all six bells ring into the center, their colors merge. You get your memories back, but every other cat loses their past.
- 主角：那……不往中间送，让它们互相接着唱呢？ / Then… what if they sing to one another instead of into the center?
- 暮铃：我试过。好多年了，一座响了，另一座又没声。我真的……不想再失去你。 / I've tried. For years. One bell rings, another goes quiet. I just… can't bear to lose you again.
- 主角：我想知道以前的事，可我也不想忘了今天。咱们在灯火节玩得多开心啊。 / I want to know my past, but I don't want to forget today either. We had such a good time at the lantern festival.
- 暮铃：中央那边撑不了多久了。我先去稳住它。 / The center won't hold much longer. I'm going to try to steady it.
- 主角：走，去星坠原。最后一座铃还没响呢。 / Come on, to Starfall. There's one bell left to wake.

## 第六章 · 星星落在地上的地方 / Chapter VI — Where the stars fell

**本章体验：** 暮铃离队后的孤独与伙伴成长；在失落星辰的遗迹中找回历史，最后从绝望转向希望。

### starfall:F-01 · 踩着星光走 / Walking on starlight

**实机事件与推进：** 星坠原的真实奇观是当年落星的碎石嵌在旧巡铃路上，走近发光形成一条星桥；不再做第三次真假路径判断。砾川熟悉碎石地形，星芽会读旧星图，伙伴合力让路上的星灯亮起。核心挑战是选择顺序走过会短时暗下的踏石，慢速辅助仍要选择落点；途中实际看见暮铃刚走过的足迹。没有商队、假星和重复调查。

**关键对白（ZH / EN）：**

- 砾川：踩亮了再走下一块。别急，石头又不会跑。 / Light one stone before stepping to the next. No rush; the stones aren't going anywhere.
- 星芽：刚才有只银色的猫过去了。你是来找她的？ / A silver cat went by a little while ago. Are you looking for her?
- 主角：嗯。我还有话没跟她说完。 / Yeah. We still have something to talk about.

### starfall:F-02 · 星铃破碎的那一天 / The day the bell broke

**实机事件与推进：** 用一次星图对齐打开真实历史遗迹（导航+星图是一个连贯挑战），陨坑及六地受损信息自然呈现，不做收集记录清单。此时首次播放可跳过的历史演出（跳过后由星芽用不超过两句的必经摘要说明旧灾、主动牺牲与回家约定）：落星击坏星铃，六地失忆蔓延，过去主角自愿用自己的记忆稳定灾难，暮铃见证并请求一起寻找回来的办法。历史由可靠旧记录展示，主角只确认发生过什么，个人记忆仍未恢复。旧记录也显示当时环路曾在中央反复失稳时断开；旧守铃人来不及建立所有短试铃连接，所以必须留下记忆锚。现在的朋友已经建立了当年没有的条件。

**关键对白（ZH / EN）：**

- 过去的暮铃：再等等！一定还有办法，咱们再找找！ / Wait! There has to be another way. Let's keep looking!
- 过去的主角：已经有猫连家人都认不出来了。再等下去，谁也不知道会怎样。用我的记忆吧，先让星铃安静下来。 / Some cats can't recognize their own families anymore. Who knows what will happen if we wait? Use my memories. We have to quiet the Star Bell first.
- 过去的暮铃：那你得答应我，一定要想办法回来。 / Then promise me you'll find a way back.
- 过去的主角：我答应你。 / I promise.
- 星芽（跳过历史演出）：当年六地接不起来，是你自己留下记忆，才救了大家。你还答应过暮铃，要找到回家的办法。 / The six lands couldn't connect back then. You chose to leave your memories behind to save everyone. And you promised Muling you'd find a way home.


### starfall:F-03 · 等了太久的猫 / The cat who waited too long

**实机事件与推进：** 主角在中央遗迹前找到暮铃。她承认多年修铃失败，宁愿用所有猫、包括自己的过去交换主角。玩家指出选择不是她单独承担的代价，并邀请她亲眼看伙伴回应。暮铃答应暂缓启动向内线路，让大家做一次试铃；她亲自帮星芽扶住最后古铃，但把应急锁留着。由此 F-04 的合作确实改变她的行为，F-05 的失败是新事实而非重复争吵。不要重复三场相同的道德辩论；主角可以表达愤怒或关心。

**关键对白（ZH / EN）：**

- 暮铃：我每天都泡两杯茶。每次有座铃响了，我都以为这回你该回来了。可另一座又没声了…… / I made two cups of tea every day. Every time a bell rang, I thought this would be the time you'd come home. Then another went silent…
- 主角：你是说……连你自己也会把我忘了？ / You mean… even you'd forget me?
- 暮铃：……只要你能回来。 / …As long as you come back.
- 主角：可我回来了，你却不认识我。栖蓝、芽禾他们也不认识自己的朋友了。暮铃，我不想要那样的家。 / But I'd come back, and you wouldn't know me. Qilan, Yahe and the others wouldn't recognize their friends either. Muling, that's not the home I want.
- 主角：咱们先听听大家怎么说，好不好？ / Let's hear what our friends have to say first, all right?
- 暮铃：好，先试一次。那把锁……先别动。 / All right. One try first. But leave that lock alone for now.


### starfall:F-04 · 世界在唱另一首歌 / The world sings a different song

**实机事件与推进：** 星原最后一次古铃启动是伙伴协作的高潮，不必再打一个地区守卫。星芽沿旧图修复星原古铃的断裂发声部件，并接通短暂试铃通道，砾川从另一端回音，主角唱出第一音，当地居民接续。此前各相邻地区在实际章节分别相互回复；书库与星原在本幕回复，星原与风铃镇也回复。地图六条线逐次亮起、各自旋律可听可见，证明每对真实邻居愿意相互回应。玩家只做本地一次有反馈的引导，不点六地清单，不依赖运输。全环仍未接入稳定的中央，因为暮铃此前将主路线向内并保留最后锁。

**关键对白（ZH / EN）：**

- 栖蓝：风铃镇听见啦！檐灯，快摇回去！ / Windchime Town hears you! Yandeng, ring back!
- 芽禾：眠根林也在！ / Rootsleep is here too!
- 星芽：一条、两条……六条都通了！ / One, two… all six connections answer!

### starfall:F-05 · 最后一声错误的铃 / The last wrong chime

**实机事件与推进：** 中央星铃发出一次旧灾同样的断音，刚才六条短试铃虽已连通，却无法同步承受冲击；一条边实际熄灭，星芽摇铃后邻居迟迟未回，主角一时想不起刚刚共同经历的灯火节细节（不抹除玩家存档或道具）。暮铃认出与旧灾相同的征兆，启动早已准备的向内应急方案，保留最后的锁；不是因一句恐惧突然反悔。与此同时，砾川主动重新摇铃，熄灭的边短暂亮起，证明仍有可争取的窗口。现实危害是眼前朋友忘了彼此、铃色变灰；玩家要先保住短试铃，不能靠喊话解决。玩家明确目标是阻止所有声音被合并，同时让真正的合唱持续。允许准备，不造任意倒计时。

**关键对白（ZH / EN）：**

- 暮铃：那一声……跟当年一模一样。你刚才连灯火节都想不起来了！ / That sound… it's exactly like last time. You couldn't even remember the lantern festival just now!
- 主角：等等，你看！砾川那边又亮了。还没完呢！ / Wait, look! Lichuan's light is back. It's not over yet!

## 终章 · 我们都在这里 / Finale — All of us are here

**本章体验：** 用此前学会的玩法和真实伙伴完成高潮，最后把奇幻冒险的快乐与情感意义合在一起。

### finale:B-01 · 不要替我选择 / Don't choose for me

**实机事件与推进：** 暮铃在仪式门前启动向内声路的防护，阻拦玩家破坏她认为唯一可靠的应急方案；熟悉的双猫合击被她用于封住通路，而非对朋友下杀手。玩家识别曾学过的预警、闪避并实际击破三个可读的错误铃光节点，打断集中过程、保护伙伴；不得以击倒暮铃或清空她的生命作为胜利条件。她仍保留最终开锁权。

**关键对白（ZH / EN）：**

- 暮铃：别碰那把锁！我不能再眼睁睁看你消失了！ / Don't touch that lock! I can't watch you disappear again!
- 主角：这次我不是一个人。 / This time, I'm not alone.

### finale:B-02 · 不会回答的声音 / A voice that cannot answer

**实机事件与推进：** 中央回响复制玩家和伙伴的外形与声音。用早已学过的真实回应规律辨认，实际作出行动并等伙伴回应，创造战斗窗口；不强制打开图鉴翻菜单。暮铃看到回响复刻她自己的等候声、压住栖蓝叫同伴的声音；她第一次亲自看到向内方案正在消除新记忆，立即停止阻拦、用原先共同战斗的技能护住栖蓝。这个动作是转变，不是胜利后自动原谅。

**关键对白（ZH / EN）：**

- 假回响：我会在这里等你。 / I'll wait for you here.
- 主角：你学得倒挺像。可你知道自己在等谁吗？ / That sounds just like her. But do you even know who you're waiting for?
- 暮铃：别听它的！它就会学刚才那句，根本不管你说了什么！ / Don't listen to it! It just repeats the last line, no matter what you say!

### finale:B-03 · 六个不同的声音 / Six different voices

**实机事件与推进：** 终战只用已经学过的两种玩家机制：读真铃的战斗窗口与利用灯光/位置避险，不把六套地区小游戏塞进Boss。六地伙伴的贡献由他们真实执行并可见：风铃镇与森林回声保持相邻连接，千灯城小铆照亮安全位置，天空远帆送来风使散开的假影远离，书库白栞与星原星芽维持最后两条回复；三阶段实际战斗（识别真身、保住安全位、持续输出）。玩家熟悉控制与队伍合击，伙伴有不同支援而非六次确认。战斗中各地守铃猫按约定把本地旋钮从中央转向相邻铃（星原由星芽操作），逐一呈现六条真实双向短回复；中央的最后锁仍挡住完整环路。回响施压时，邻居短回复仍持续，各地不同颜色没有混合，暮铃亲眼看见伙伴没有忘记彼此。她主动解除最后锁，让六个相邻通道真正连成环；立即进行一次完整稳定合唱，持续成功才归还主角记忆。主角不可强迫她，也不能以胜利标志伪造邻居回应。

**关键对白（ZH / EN）：**

- 栖蓝：听见你了！ / We hear you!
- 小铆：往亮处来！ / Come into the light!
- 白栞：接上了！这次没断！ / It's connected! It's holding!
- 暮铃：大家……都还记得自己是谁。 / Everyone… still remembers who they are.
- 主角：还剩那把锁。暮铃，你来开吧。 / Just the lock left. Muling, you can open it.
- 暮铃：……嗯。这回一起回家。 / …Yeah. We're going home together this time.

### finale:B-04 · 星铃重新响了 / The bell rings again

**实机事件与推进：** 六声形成彼此真实回应的合唱，中央恢复协调，旧封印解除，主角取回名字和个人记忆，其他猫均保留自己的。回收名字目标：若玩家有自定义显示名，以该名呈现恢复记忆，不另造固定姓名；否则用私密耳语/确认“我想起来了”表现，不把守铃人的称号冒充本名。无新牺牲或最后一分钟神力。让玩家恢复控制、走向朋友与暮铃。暮铃先摇两声铃，主角主动回应，再进入下面的短对白；从普通报平安的约定变成结局的情感回收。

**关键对白（ZH / EN）：**

- 主角：我想起来了。我的名字，还有以前的事。 / I remember now. My name, and everything from before.
- 暮铃：你……还记得我吗？ / Do you… remember me?
- 主角：记得。以前说好了回家喝茶。还有风铃镇那场架、森林里那条绕来绕去的路……后来这些，我也都记得。 / I do. We promised to have tea back home. And that fight in Windchime Town, the winding forest path… I remember everything we've done since, too.
- 暮铃：……那些我做错的事呢？ / …And the things I did wrong?
- 主角：也记得。走吧，先看看大家怎么样了。 / Those too. Come on. Let's see how everyone's doing.

## 尾声 · 花园的第二把钥匙 / Epilogue — The second garden key

**本章体验：** 不再强迫玩家完成任务清单。已经爱上的世界仍值得回来。

### epilogue:E-01 · 世界又热闹起来了 / The world is lively again

**实机事件与推进：** 任选一处重访，真实看到风铃镇铃、森林树路、灯火节、天空岛屿、镜廊或星桥恢复。其余均可选。纪念品、猫咪来访及游戏中真实获得的成长保持有效。

**关键对白（ZH / EN）：**

- 栖蓝：这下整条街的铃可算老实了！哎，下回去哪儿玩？ / Finally, the bells on this street are behaving! Hey, where are we off to next?

### epilogue:E-02 · 道歉不只是说对不起 / More than an apology

**实机事件与推进：** 暮铃主动承认自己松开封印、使别猫面临失忆；受影响猫可不立即原谅。玩家可陪伴、倾听或给空间。可选后日谈修复实际损害，不设道德分数或每日重复劳动。

**关键对白（ZH / EN）：**

- 暮铃：这次大家又开始失忆，是因为我。对不起。接下来该修的、该补的，我会一件件做。 / I'm the reason the forgetting started again. I'm sorry. I'll put things right, one step at a time.
- 檐灯：那就从这儿开始吧。别的事，慢慢来。 / Then let's start here. The rest will take time.

### epilogue:E-03 · 第二把钥匙 / The second key

**实机事件与推进：** 回阳光花园。真实获得的月叶、灯笼等形成旅程的可见痕迹；门旁的木名牌可以翻到新的一面：玩家自定义显示名则呈现该名，否则保持无文字的猫爪刻记，不强造本名。并排添上新的爪印，形成过去的家和自己重新选择的家的可见区别。暮铃把当初的两只杯子放好；若天空主角说过多带杯子，庭院来客时桌上会多一只杯子，作为无需任务的回报。暮铃在门外询问是否留下，主角给第二把钥匙。两杯茶，普通铃声，恢复自由游玩。

**关键对白（ZH / EN）：**

- 暮铃：我还能……住在这里吗？ / Can I… still stay here?
- 主角：当然。不过以后去哪儿，记得先叫上我。 / Of course. But next time you're going somewhere, ask me first.
- 暮铃：那……能给我一把钥匙吗？ / Then… may I have a key?
- 主角：喏，早给你留着呢。进来吧，茶还热着。 / Here. I saved one for you. Come in. The tea's still warm.

## 玩家动力第二轮约束（全章适用）
- 每章离开前必须有已经兑现的具体回报，而不是只给下一张地图；至少一次当场角色主动反应。庭院纪念物和可选发现是生活痕迹，不变为收藏门槛。
- 前四章逐步推进三个问题：谁认识我、是谁刻意留下归家路线、近期是谁碰过封印。不得通过暮铃的可疑特写、提前公布银铃借阅印或作者解释直接给谜底。可以让玩家猜中关系，但责任与代价仍须由独立证据揭晓。
- F-04 短回复是真实成功，F-05 的中央冲击是真实新失败，B-03 是在压力下恢复并稳定的全环；三个状态绝不合并成一次通关旗标。暮铃的改变通过实际保护伙伴、主动开锁与后续承担责任呈现。

## 通关后
庭院中的猫咪真实来访；可选节庆、飞行、星桥等挑战可重复但不强制刷分；区域野猫、秘密路线、猫咪阵容和合击提供继续探索的理由。暮铃修复造成的损害与道歉不以万能原谅收尾，玩家不负责替她跑六次重复劳动。禁止以另一轮世界末日推翻完整结局。

## 工程与验收
- 新剧本需要实际重构六地地图交互、任务、UI目标、NPC条件、战斗机制与测试。旧船只、药材、水闸、工坊事故、送货、档案辩论、商队可作为可选背景或彻底移除，不得阻塞主线，不得用旧任务重贴文字冒充重构。主线无货运、无可选猫也必须完整可玩。
- 每章可独立验证，最终新游戏连续通关；检查双语、桌面与移动、横竖屏、真实战斗/存档/失败恢复、可选路线、角色加入与暮铃离队重聚。旧测试框架可复用，旧测试结果不算新剧本验收。
- 盲测在每章结束记录玩家能否复述答案及下一目标、是否有主动探索动机、是否发生重复机械确认。必要时再次改故事，而不是降低验收标准。每章玩法重构未完成时明确标记，不发版。
- 美术以 ART-RESET-CANON2.md（已同步 2.1）为重置/保留清单；新奇观必须有实际可玩的画面，不能仅靠静态插图或对话。
