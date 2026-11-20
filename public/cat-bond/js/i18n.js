/* Cat Bond — bilingual display layer (Morrow Wish).
 *
 * The game is authored in Chinese. Rather than rewrite 5,700 lines, this module
 * translates DISPLAYED text ZH->EN at the two output chokepoints the game uses:
 *   1. DOM text nodes + title/aria-label attributes under #game-root (panels,
 *      HUD, tabs, intro — all built as Chinese innerHTML by ui.js).
 *   2. Canvas fillText / strokeText (battle labels, cat tags, world map, HUD).
 * It NEVER touches JS logic, object keys, save data, or element IDs — only the
 * text a human reads. In Chinese mode it is a complete no-op.
 *
 * Direction is the mirror of the site's global /lang.js (which does EN->ZH and
 * only acts in zh mode); the two compose cleanly because each is active in a
 * single, opposite language mode. Load this AFTER /lang.js so we wrap its canvas
 * patch, and it follows the shared `morrowwish-language-change` event + toggle.
 */
(function () {
  'use strict';

  // ZH -> EN. Longest keys are applied first at runtime so compound phrases win
  // over the shorter fragments they contain (e.g. 力量 before 力).
  var DICT = {
    // ---- site shell (back link + aria) ----
    '← Morrow Wish 首页': '← Morrow Wish',
    '返回 Morrow Wish': 'Back to Morrow Wish',
    'Morrow Wish 首页': 'Morrow Wish home',
    '首页': 'home',
    '返回': 'Back',
    // ---- title / studio / intro ----
    '猫猫纽带': 'Cat Bond',
    'STUDIO 工作室 呈现': 'STUDIO presents',
    '一群会思考的小猫咪住在你的庭院里。陪它们玩耍、喂养、建立': 'A yard full of thinking little cats lives with you. Play with them, feed them, build',
    '好感纽带': 'bonds of affection',
    '然后带上最亲密的伙伴，去草丛里': ', then bring your closest companions to the grass for',
    '，在即时竞技场里收服更多野生猫猫。': ' and capture more wild cats in a real-time arena.',
    '💡 点猫=撸猫 · 🌿=找野猫 · 战斗：WASD移动 · 鼠标瞄准 · Q/E技能 · 空格闪避 · R必杀':
      '💡 Tap a cat = pet it · 🌿 = find wild cats · Battle: WASD move · aim with mouse · Q/E skills · Space dodge · R ultimate',
    '开始冒险 🐱': 'Start the adventure 🐱',
    '🗑️ 重置存档（出问题点这里）': '🗑️ Reset save (tap here if stuck)',
    // 30-second onboarding guide
    '30 秒上手': '30-SECOND GUIDE',
    '① 撸猫 & 找野猫': '① Pet & find wild cats',
    '点击院子里的猫咪增加好感，点右下 🌿 在草丛里找野生猫猫。': 'Tap cats in the yard to raise affection; tap 🌿 (bottom-right) to find wild cats in the grass.',
    '② 即时战斗': '② Real-time battle',
    'WASD 移动，鼠标瞄准，左键猫爪，Q/E 放技能，空格闪避。': 'WASD to move, aim with the mouse, left-click to claw, Q/E for skills, Space to dodge.',
    '③ 收服 & 养成': '③ Capture & raise',
    '把野猫斗志打空就能收服。喂养、培养、进化，建立更强的纽带。': "Drain a wild cat's morale to capture it. Feed, train and evolve to build stronger bonds.",

    // ---- HUD / tab bar / yard actions ----
    '🏡 庭院': '🏡 Yard',
    '庭院': 'Yard',
    '猫猫': 'Cats',
    '工坊': 'Workshop',
    '图鉴': 'Codex',
    '签到': 'Daily',
    '商店': 'Shop',
    '探索世界': 'Explore the world',
    '捉迷藏': 'Hide & seek',
    '逗猫游戏': 'Teaser game',
    '逗猫 🪶': 'Cat teaser 🪶',
    '逗猫': 'Tease',
    '喂食全员': 'Feed everyone',
    '喂食': 'Feed',

    // ---- battle chrome ----
    '野生猫猫': 'Wild cat',
    '🤖 自动战斗中 · 点击设集火点 · R 必杀 · 1/2/3 换猫': '🤖 Auto-battle · tap to set focus · R ultimate · 1/2/3 swap cat',
    '🤖 自动战斗 开启（你当指挥官）': '🤖 Auto-battle on (you command)',
    '🎮 手动操控 开启': '🎮 Manual control on',
    '🤖 自动': '🤖 Auto',
    '🎮 手动': '🎮 Manual',
    '🏳️ 撤退': '🏳️ Retreat',
    '鼠标瞄准 · 左键猫爪 · 空格闪避 · P 自动战斗': 'Aim with mouse · left-click claw · Space dodge · P auto-battle',
    '鼠标瞄准 · 左键猫爪 · 空格闪避 · 斗志清零即收服': 'Aim with mouse · left-click claw · Space dodge · drain morale to capture',
    '鼠标瞄准 · 左键猫爪 · Q/E 技能 · 空格闪避': 'Aim with mouse · left-click claw · Q/E skills · Space dodge',
    '只 · 鼠标瞄准 · Q/E 技能': ' left · aim with mouse · Q/E skills',
    '野猫群': 'Wild pack',
    '野猫斗志快耗尽了，收服它！': "The wild cat's morale is nearly gone — capture it!",
    '必杀能量已满！按 R 释放': 'Ultimate ready! Press R to unleash',
    '必杀': 'Ultimate',
    '左键/J': 'LMB/J',
    '空格': 'Space',
    '战斗玩法：WASD 移动 · 鼠标瞄准 · 左键猫爪 · Q/E 技能 · 空格闪避 · R 必杀 · 1/2/3 换猫 · P 自动':
      'Controls: WASD move · aim with mouse · left-click claw · Q/E skills · Space dodge · R ultimate · 1/2/3 swap · P auto',

    // ---- battle toasts / effects ----
    '🌪️ 必杀·喵之怒涛！': '🌪️ Ultimate · Meow Tempest!',
    '喵之怒涛!': 'Meow Tempest!',
    '喵之怒涛': 'Meow Tempest',
    '喵火球': 'Meow Fireball',
    '⚠️ 野猫在蓄力大招！': '⚠️ The wild cat is charging a big move!',
    '必杀能量不足': 'Not enough ultimate energy',
    '切换到': 'Switched to',
    '累瘫了！': ' is worn out!',
    '斗志耗尽！': ' is out of morale!',
    ' 施放 ': ' casts ',
    '猫猫怒涛': 'Cat Tempest',
    '连射': 'Barrage',
    '❤ 纽带之力！': '❤ Power of the bond!',
    '绝境不倒！': ' refuses to fall!',
    '纽带·不倒!': 'Bond · Unbroken!',
    '✨ 连携 ': '✨ Combo ',
    '连携!': 'Combo!',
    '连携': 'Combo',
    '效果绝佳!!': 'Super effective!!',
    '效果拔群!': 'Super effective!',
    '效果不佳…': 'Not very effective…',
    '🐾 抓到啦！': '🐾 Caught it!',
    '逗猫结束！好感 +': 'Teasing done! Affection +',
    '发现野生猫猫': 'Wild cat spotted',
    '发现野生': 'Wild ',
    '你还没有伙伴猫，无法发起捕捉。': 'You have no companion cats yet, so you cannot start a capture.',
    '组建出战队伍（最多 3 只，点击选择）': 'Build your battle team (up to 3, tap to choose)',
    '稀有度': 'Rarity',
    '越稀有斗志越强': 'rarer cats have stronger morale',
    '开始战斗': 'Start battle',
    '放它走': 'Let it go',
    '🎉 捕捉成功！': '🎉 Capture succeeded!',
    '加入了你的大家庭！': ' joined your family!',
    '太好了': 'Wonderful',
    '太棒了': 'Awesome',
    '✨闪光!': '✨ shiny!',
    '✨稀客!': '✨ rare guest!',
    '得分': 'Score',
    '施放': 'casts',
    '野生': 'Wild',

    // ---- yard / world toasts ----
    '✨ 找到了一只野生猫猫！': '✨ Found a wild cat!',
    '🌿 草丛里有只野猫在探头…点它！': '🌿 A wild cat is peeking from the grass… tap it!',
    '💨 野生猫猫跑掉了…下次再来！': '💨 The wild cat ran away… try again next time!',
    '没有可出战的猫': 'No cats available to fight',
    '👋 点击猫猫撸它，点右下🌿开始捉迷藏！': '👋 Tap a cat to pet it, tap 🌿 (bottom-right) to start hide & seek!',
    '🦋 院子里出现了一只金色蝴蝶！': '🦋 A golden butterfly appeared in the yard!',

    // ---- welcome back / workshop ----
    '😺 欢迎回来': '😺 Welcome back',
    '欢迎回来': 'Welcome back',
    '你离开了约': 'You were away about',
    '分钟': ' min',
    '（已达上限）': ' (capped)',
    '工坊产出待收取：': 'Workshop output to collect: ',
    '猫猫带回：': 'Cats brought back: ',
    '来访': ' visited',
    ' · 留下 ': ' · left ',
    ' ✨稀客!': ' ✨ rare guest!',
    '全部收取': 'Collect all',
    '收下': 'Take it',
    '🧶 工坊': '🧶 Workshop',
    '派猫咪上工，离线也产出': 'Put cats to work — they produce even offline',
    '毛线 🧶': 'Yarn 🧶',
    '· 把猫派到工位生产资源，等级越高产量/容量越大': '· Assign cats to stations to gather resources; higher level means more output and capacity',
    '加载中…': 'Loading…',
    '空缺（点猫派工）': 'Empty (tap to assign a cat)',
    '收取': 'Collect',
    '派工': 'Assign',
    '升级': 'Upgrade',
    '升级成功！': 'Upgrade complete!',
    '选择上工的猫': 'Choose a cat to work',
    '工作中': 'Working',
    '暖窝孵化中': 'Nest incubating',
    '抱回小猫': 'Bring the kitten home',
    '孵化中…': 'Incubating…',
    '暖窝（繁育）': 'Nest (breeding)',
    '选两只猫繁育，可能产出继承花色+变异的小猫': 'Pick two cats to breed; the kitten may inherit coats and mutate',
    '开始繁育': 'Start breeding',
    // breed-combo notes (BREED_COMBOS[].note, shown in the breeding preview)
    '橘猫 + 狸花 → 三花': 'Tangyuan + Doudou → Calico',
    '蓝猫 + 银渐层 → 布偶云朵': 'Sapphire + Chonk → ragdoll Cloud',
    '暹罗 + 樱花 → 幽灵': 'Siam + Sakura → Spirit',
    '森林 + 金乌 → 星尘(极罕见)': 'Forest + Suncrow → Stardust (ultra rare)',
    '奶牛 + 奶白 → 礼小绅士': 'Moomoo + Nana → gentleman Tux',
    '🥚 选两只猫繁育': '🥚 Pick two cats to breed',
    '已选': 'Selected',
    '开始孵化': 'Start incubation',
    '🥚 开始孵化！': '🥚 Incubation started!',
    '无法繁育': 'Cannot breed',
    '暖窝已经有蛋在孵了': 'An egg is already incubating in the nest',
    '需要两只不同的猫猫': 'You need two different cats',
    '猫猫正在忙（工作或繁育中）': 'The cat is busy (working or breeding)',
    '猫猫正在忙': 'The cat is busy',
    '暖窝请用繁育功能': 'Use the breeding function for the nest',
    '暖窝里没有蛋': 'No egg in the nest',
    '蛋还没孵好': "The egg hasn't hatched yet",
    '父母不见了': 'The parents are gone',
    '没有零食了': 'No treats left',
    '的小猫诞生了！': "'s kitten was born!",
    ' 的小猫诞生了！': "'s kitten was born!",
    '🥚 暖窝里的蛋可以孵化啦！': '🥚 The egg in the nest is ready to hatch!',
    '暖窝里的蛋可以孵化啦！': 'The egg in the nest is ready to hatch!',
    ' ✨闪光!': ' ✨ shiny!',
    '没有这个站点': 'No such station',
    '找不到猫猫': 'Cat not found',
    '金币不够': 'Not enough coins',
    '毛线不够': 'Not enough yarn',
    '否则随机继承一位父母的品种': 'Otherwise randomly inherits one parent breed',

    // ---- roster / cat detail ----
    '我的猫猫': 'My Cats',
    '点击查看详情、培养与互动': 'Tap to view details, train and interact',
    '还没有猫猫，去庭院捉迷藏找一只吧！': 'No cats yet — go play hide & seek in the yard to find one!',
    '还没有猫猫': 'No cats yet',
    '等级': 'Level',
    '经验': 'XP',
    '好感 (': 'Affection (',
    '心情': 'Mood',
    '饱食': 'Fullness',
    '战力 ⚔': 'Power ⚔',
    ' · 性格: ': ' · Personality: ',
    ' · 特性: ': ' · Trait: ',
    '🎣 用挂机产出培养它变强': '🎣 Use idle output to train it stronger',
    '🐟 喂鱼练级 (×3🐟 → +经验)': '🐟 Feed fish to level (×3🐟 → +XP)',
    '🧶 毛线特训 (×8🧶 → 全属性+)': '🧶 Yarn training (×8🧶 → +all stats)',
    '🤲 撸猫 (+好感)': '🤲 Pet (+affection)',
    '🍖 喂食 (': '🍖 Feed (',
    '❤ 好感提升': '❤ Affection up',
    '🍖 吃得好开心': '🍖 Yum, so happy',
    '🎉 升到 Lv.': '🎉 Reached Lv.',
    '升到 Lv.': 'reached Lv.',
    '🐟 +': '🐟 +',
    '经验': 'XP',
    '小鱼干不足（去钓鱼位产出）': 'Not enough dried fish (gather at the fishing spot)',
    '毛线不足（去毛线坊产出）': 'Not enough yarn (gather at the yarn mill)',
    '🧶 特训完成！全属性 +1': '🧶 Training done! All stats +1',
    '力量': 'Power',
    '敏捷': 'Agility',
    '体力': 'Vitality',
    '魅力': 'Charm',

    // ---- evolution ----
    '✨ 可进化为 ': '✨ Can evolve into ',
    '✨ 可进化为': '✨ Can evolve into',
    '进化为': 'evolves into',
    '✨ 进化成功！': '✨ Evolution complete!',
    '进化': 'Evolve',
    '条件不满足': 'Requirements not met',
    '缺少 ': 'Missing ',
    '（商店购买）': ' (buy in shop)',
    '当前': 'now ',

    // ---- dex ----
    '收集所有猫猫，解锁隐藏传说种！': 'Collect every cat to unlock hidden legendary species!',
    '已捕获': 'Caught',
    '只 · 基础 力': ' · Base PWR ',
    '返回图鉴': 'Back to Codex',

    // ---- daily ----
    '每日签到': 'Daily Check-in',
    '连续登录领更多奖励，第7天必得小鱼干！': 'Log in daily for bigger rewards; day 7 always grants dried fish!',
    '🔥 连续签到': '🔥 Check-in streak',
    '🎁 领取今日奖励': "🎁 Claim today's reward",
    '✅ 今日已领取': '✅ Claimed today',
    '奖励随连签天数增长': 'Rewards grow with your streak',
    '签到成功！': 'Checked in! ',
    '天': ' days',
    '🐟零食': '🐟 treats',

    // ---- shop ----
    '小卖部': 'Corner Shop',
    '用金币与小鱼干换补给与运气': 'Trade coins and dried fish for supplies and luck',
    '🐟 零食 ×5 — 30🪙': '🐟 Treats ×5 — 30🪙',
    '🐟 零食 ×15 — 75🪙': '🐟 Treats ×15 — 75🪙',
    '🍀 幸运诱饵 ×1 (下次捉迷藏更易遇稀有) — 2🐠': '🍀 Lucky Lure ×1 (next hide & seek favors rarer cats) — 2🐠',
    '🐠 用 60🪙 兑换 1 小鱼干': '🐠 Trade 60🪙 for 1 dried fish',
    '💎 进化石（猫咪进化所需）': '💎 Evolution Stones (needed to evolve cats)',
    '🌑 夜影石 ×1 — 3🐠': '🌑 Nightshade Stone ×1 — 3🐠',
    '🌙 月华露 ×1 — 4🐠': '🌙 Moondew ×1 — 4🐠',
    '🔥 赤焰晶 ×1 — 4🐠': '🔥 Crimson Flame Crystal ×1 — 4🐠',
    '小鱼干也可每日签到获得': 'Dried fish can also be earned from daily check-in',
    '+5 零食': '+5 treats',
    '+15 零食': '+15 treats',
    '🍀 幸运诱饵就绪': '🍀 Lucky lure ready',
    '+1 小鱼干': '+1 dried fish',
    '获得 ': 'Got ',
    '资源不足': 'Not enough resources',
    '金币不足': 'Not enough coins',
    '夜影石': 'Nightshade Stone',
    '月华露': 'Moondew',
    '赤焰晶': 'Crimson Flame Crystal',

    // ---- feed / tease ----
    '🪙 给所有猫猫加餐': '🪙 Feed all cats a snack',
    '🍖 全部喂食': '🍖 Feed all',
    '🍖 全员吃饱啦': '🍖 Everyone is full',
    '点击逗猫棒，让': 'Tap the teaser wand to make ',
    '扑抓！抓中越多，好感与心情涨得越快。': ' pounce! More catches raise affection and mood faster.',
    '结束': 'Finish',

    // ---- gambit / AI strategy ----
    '⚙️ AI 策略': '⚙️ AI Strategy',
    '⚙️ AI策略': '⚙️ AI Strategy',
    '自上而下逐条判定': 'evaluated top to bottom',
    '给每只猫配置自动战斗规则：满足「条件」就执行「动作」，最先命中的生效。':
      'Set auto-battle rules per cat: when a Condition is met, do its Action; the first match wins.',
    '元素 · 技能：': ' element · Skills: ',
    '默认': 'default',
    '若': 'If',
    '＋ 加一条': '+ Add rule',
    '恢复默认': 'Reset to default',
    '← 返回出战': '← Back to battle setup',
    // gambit conditions
    '总是': 'Always',
    '敌斗志<30%': "Enemy morale < 30%",
    '敌斗志<50%': "Enemy morale < 50%",
    '我方斗志<40%': 'Ally morale < 40%',
    '我方斗志<25%': 'Ally morale < 25%',
    '必杀能量满': 'Ultimate charged',
    '连携已就绪': 'Combo ready',
    '敌身中异常': 'Enemy has a status',
    '敌在近身': 'Enemy close',
    '敌在远处': 'Enemy far',
    '有弹幕来袭': 'Incoming fire',
    '高羁绊': 'High bond',
    // gambit actions
    '放必杀': 'Use ultimate',
    '连携终结': 'Combo finisher',
    '打连携': 'Combo attack',
    '治疗': 'Heal',
    '拉开距离': 'Keep distance',
    '闪避': 'Dodge',
    '贴近突进': 'Dash in',
    '普攻': 'Basic attack',
    '技能1': 'Skill 1',
    '技能2': 'Skill 2',

    // ---- starter picker ----
    '选择你的第一只猫猫': 'Choose your first cat',
    '它会陪你一起去捕捉更多伙伴': "It will join you to capture more companions",

    // ---- rarities ----
    '普通': 'Common',
    '稀有': 'Rare',
    '史诗': 'Epic',
    '传说': 'Legendary',

    // ---- species names ----
    '汤圆': 'Tangyuan', '豆豆': 'Doudou', '小灰': 'Ash', '墨球': 'Inky',
    '奶奶': 'Nana', '捏图': 'Butter', '牛牛': 'Moomoo', '三花': 'Calico',
    '礼小': 'Tux', '蓝宝': 'Sapphire', '墩墩': 'Chonk', '云朵': 'Cloud',
    '折耳': 'Fold', '起司': 'Cheese', '短短': 'Stubby', '金金': 'Goldie',
    '暹罗': 'Siam', '樱花': 'Sakura', '森林': 'Forest', '幽灵': 'Spirit',
    '挪威': 'Norway', '豹猫': 'Leopard', '金乌': 'Suncrow', '月莲': 'Moonlotus',
    '星尘': 'Stardust',

    // ---- species descriptions ----
    '爱睡懒觉的橘猫，据说三斤起步。': 'A sleepy orange cat — reportedly starts at three pounds.',
    '标准狸花猫，机灵又好动。': 'A classic tabby, clever and lively.',
    '银渐层的雏形，蹲窗台看雨。': 'A budding silver tabby who watches the rain from the windowsill.',
    '黑夜里只剩一双发光的眼睛。': 'In the dark, only a pair of glowing eyes remain.',
    '一身奶白，像落了一层初雪。': 'Milky white all over, like a dusting of first snow.',
    '奶油色的小懒猫，踩奶高手。': 'A cream-colored lazy cat, a master kneader.',
    '黑白分明的奶牛猫，话痨一只。': 'A crisp black-and-white cow cat, quite the chatterbox.',
    '三色福猫，传说能招来好运。': 'A tricolor lucky cat, said to summon good fortune.',
    '穿燕尾服的绅士，优雅又傲娇。': 'A gentleman in a tuxedo — elegant and a little haughty.',
    '英短蓝猫，圆脸包子，捏不腻。': "A British blue shorthair with a bun face you can't stop squishing.",
    '银渐层，眼线天生，表情包担当。': 'A silver shaded cat with natural eyeliner — the meme star.',
    '布偶幼崽，软成一团云。': 'A ragdoll kitten, soft as a cloud.',
    '折耳小团子，坐姿像佛系大师。': 'A folded-ear dumpling who sits like a zen master.',
    '橘白相间的起司猫，贪吃界冠军。': 'An orange-and-white cheese cat, champion glutton.',
    '曼基康矮脚猫，小短腿跑起来超可爱。': 'A Munchkin short-legs — adorable when those tiny legs run.',
    '金渐层，雍容华贵的小土豪。': 'A golden shaded cat — a dignified little tycoon.',
    '暹罗贵族，蓝眼如宝石，嗓门极大。': 'A Siamese noble with jewel-blue eyes and a huge voice.',
    '粉樱梦幻猫，走过留下花瓣。': 'A dreamy cherry-blossom cat that leaves petals in its wake.',
    '缅因巨猫，像一头小狮子。': 'A Maine Coon giant, like a little lion.',
    '半透明的紫雾猫，来去无声。': 'A translucent purple-mist cat, silent coming and going.',
    '挪威森林猫，披着厚毛的山林王者。': 'A Norwegian Forest cat — the thick-furred king of the woods.',
    '孟加拉豹猫，野性斑纹，爆发极快。': 'A Bengal leopard cat — wild markings, explosive bursts.',
    '传说中背负太阳的火焰之猫。': 'The legendary flame cat said to carry the sun.',
    '踏月而行的云端仙猫，毛泛微光。': 'A celestial cat that walks on moonlight, fur faintly aglow.',
    '身披星河的梦境之猫，极为罕见。': 'A dream cat draped in the galaxy — exceedingly rare.',

    // ---- skill names ----
    '炽爪': 'Ember Claw', '喵火球': 'Meow Fireball', '金乌焱': 'Suncrow Blaze',
    '水鞭': 'Water Lash', '泡泡幕': 'Bubble Veil', '潮汐掌': 'Tidal Paw',
    '叶刃': 'Leaf Blade', '荆缠': 'Thorn Coil', '光合': 'Photosynthesis',
    '静电扑': 'Static Pounce', '电弧': 'Bolt Arc', '雷鸣啸': 'Thunder Yowl',
    '影袭': 'Shadow Strike', '猫咒': 'Cat Hex', '虚吞': 'Void Maw',
    '棱光束': 'Prism Beam', '祝福绒': 'Blessed Fluff', '曙光愈': 'Dawn Mend',
    '月华环': 'Moonlit Halo', '毛球散射': 'Furball Spray', '疾扑冲刺': 'Dash Pounce',
    '猫爪': 'Cat Claw',

    // ---- skill descriptions ----
    '燃烧的猫爪撕击，附加灼烧。': 'A burning claw slash that applies Burn.',
    '吐出滚烫火球，命中后持续灼烧。': 'Spits a scorching fireball that keeps burning on hit.',
    '【必杀】背负烈日炸裂全场，重灼。': '[Ultimate] Unleashes the sun across the field, searing all.',
    '高压水流抽击，使目标淋湿。': 'A high-pressure water whip that soaks the target.',
    '展开泡泡护盾，短时减伤。': 'Raises a bubble shield that briefly reduces damage.',
    '【必杀】掀起巨浪，全体淋湿。': '[Ultimate] Raises a great wave, soaking everyone.',
    '锋利草叶高速飞射。': 'Fires razor-sharp leaves at high speed.',
    '荆棘缠绕撕裂，造成流血。': 'Thorns coil and tear, causing Bleed.',
    '吸收日光回复自身斗志。': 'Absorbs sunlight to restore its own morale.',
    '带电冲刺，命中麻痹目标。': 'An electric dash that paralyzes on hit.',
    '跳跃的电弧，附加感电。': 'A leaping arc of electricity that applies Shock.',
    '【必杀】一声炸雷贯穿全场。': '[Ultimate] A thunderclap tears across the field.',
    '自暗影中突袭，造成撕裂伤。': 'Ambushes from the shadows, dealing a rending wound.',
    '诅咒之球令目标眩晕。': 'A cursed orb that dizzies the target.',
    '【必杀】深渊巨口吞噬一切。': '[Ultimate] An abyssal maw devours everything.',
    '聚焦光束灼目，可致短暂失明。': 'A focused beam that sears the eyes and may briefly blind.',
    '圣洁绒光提升自身伤害。': 'Holy fluff-light raises its own damage.',
    '沐浴晨光回复斗志。': 'Bathes in dawn light to restore morale.',
    '【必杀】月华绽放，净化并反击。': '[Ultimate] Moonlight blooms, cleansing and counterattacking.',

    // ---- combo names ----
    '导电连锁!': 'Conductive Chain!',
    '浸油爆燃!': 'Oil Ignition!',
    '蒸发…': 'Evaporate…',
    '碎冰暴击!': 'Ice Shatter Crit!',
    '碎冰缠绕!': 'Ice Shatter Bind!',
    '野火蔓延!': 'Wildfire Spread!',
    '电解过载!': 'Electrolytic Overload!',
    '嗜血突袭!': 'Bloodthirst Strike!',
    '圣光制裁!': 'Holy Judgment!',
    '暗影处决!': 'Shadow Execution!',

    // ---- status tags ----
    '灼烧': 'Burn', '淋湿': 'Soak', '感电': 'Shock', '浸油': 'Oil',
    '冰冻': 'Freeze', '眩晕': 'Dizzy', '流血': 'Bleed', '失明': 'Blind', '束缚': 'Bind',

    // ---- bond tiers ----
    '灵魂纽带': 'Soul Bond',
    '生死与共': 'Inseparable',
    '羁绊 Lv.': 'Bond Lv.',
    '羁绊': 'Bonded',
    '默契': 'In Sync',
    '信赖': 'Trusting',
    '亲密': 'Close',
    '熟悉': 'Familiar',
    '路人': 'Stranger',
    '陌生': 'Distant',
    '反噬': 'Backlash',

    // ---- personalities ----
    '贪吃': 'Glutton', '勤劳': 'Diligent', '慵懒': 'Lazy', '机敏': 'Clever', '温柔': 'Gentle',
    '饿得快，但吃饱后干劲十足。': 'Gets hungry fast, but works hard once fed.',
    '站点产出 +18%。': 'Station output +18%.',
    '产出 -10%，但几乎不掉状态。': 'Output -10%, but barely loses condition.',
    '更容易招来访客与好运。': 'More likely to attract visitors and luck.',
    '羁绊成长更快。': 'Bond grows faster.',

    // ---- traits ----
    '金爪': 'Gold Paw', '钓王': 'Angler', '巧手': 'Weaver', '招财': 'Lucky Cat',
    '斗志': 'Warrior', '福星': 'Fortune', '隐藏天赋': 'Hidden talent', '异色': 'Shiny',
    '没有特殊天赋。': 'No special talent.',
    '金币产出 +12%。': 'Coin output +12%.',
    '小鱼干产出 +20%。': 'Dried fish output +20%.',
    '毛线产出 +20%。': 'Yarn output +20%.',
    '访客更慷慨。': 'Visitors are more generous.',
    '战斗力 +8%（战斗系统可读取 trait）。': 'Combat power +8%.',
    '异色后代概率翻倍。': 'Doubles the chance of shiny offspring.',
    '多相处就会显现…': 'It will show with more time together…',
    '稀有的异色毛发。': 'A rare shiny coat.',

    // ---- stations ----
    '钓鱼位': 'Fishing Spot', '毛线坊': 'Yarn Mill', '晒太阳位': 'Sunbathing Spot',
    '瞭望台': 'Lookout', '暖窝': 'Nest',
    '派猫钓鱼，攒小鱼干。': 'Send cats fishing to gather dried fish.',
    '织毛线团，升级站点的材料。': 'Weave yarn — the material for upgrading stations.',
    '晒太阳的猫心情超好，还会捡到金币。': 'Sunbathing cats are happy and even find coins.',
    '瞭望远方，积攒好运（提升野猫稀有度）。': 'Scout afar to build luck (raises wild-cat rarity).',
    '把两只猫放进暖窝，孵化小猫。': 'Place two cats in the nest to hatch a kitten.',

    // ---- mementos ----
    '小鱼骨': 'Fish Bone', '毛线球': 'Yarn Ball', '松果': 'Pinecone', '贝壳': 'Seashell',
    '铃铛': 'Bell', '干花': 'Dried Flower', '玻璃珠': 'Glass Bead', '猫薄荷': 'Catnip',

    // ---- bond stories ----
    '它第一次主动蹭了蹭你的手心。': 'For the first time, it nuzzled your palm on its own.',
    '它会在你回家时跑到门口迎接。': 'It runs to the door to greet you when you come home.',
    '夜里它悄悄睡到了你的枕边。': 'At night it quietly slept beside your pillow.',
    '它把最爱的毛线球叼来送给你。': 'It brought you its favorite yarn ball as a gift.',
    '无论走到哪，它的目光都追随着你。': 'Wherever you go, its gaze follows you.',

    // ---- world map ----
    '🗺️ 世界地图': '🗺️ World Map',
    '世界地图': 'World Map',
    '点击已解锁区域进入探索': 'Tap an unlocked region to explore',
    '← 回庭院': '← Back to yard',
    '← 回地图': '← Back to map',
    '回地图': 'Back to map',
    '回庭院': 'Back to yard',
    'WASD/方向键移动 · 靠近🐾遇敌 · 走到🏠返回地图': 'WASD/arrows to move · approach 🐾 to fight · reach 🏠 to return',
    '探索度 ': 'Explored ',
    '探索度': 'Explored',
    '🔒 区域未解锁': '🔒 Region locked',
    '🗺️ 新区域解锁：': '🗺️ New region unlocked: ',
    '探索「': 'Explore "',
    '」至 ': '" to ',
    '」至': '" to',
    '并拥有「': ' and own "',
    '需 ': 'Need ',
    '需要': 'Need ',
    '发现珍稀补给 (+': 'Found rare supplies (+',
    '拾获补给 (+': 'Picked up supplies (+',
    '拾获补给': 'Picked up supplies',
    // region names
    '樱花林': 'Sakura Woods', '溪谷': 'Creek Valley', '火山口': 'Volcano Crater', '月影遗迹': 'Moonshadow Ruins',
    '熟悉的后院，新手猫猫的乐园。': 'A familiar backyard — a paradise for new cats.',
    '粉樱纷飞的林间，稀有猫猫出没。': 'A grove of drifting cherry blossoms where rare cats roam.',
    '清凉溪水穿谷而过，史诗猫猫在此栖息。': 'A cool creek winds through the valley, home to epic cats.',
    '灼热的火山口，传说之火焰猫金乌沉睡于此。': 'A scorching crater where the legendary flame cat Suncrow slumbers.',
    '月光笼罩的古老遗迹，最稀有的传说猫沉眠在星河之中。': 'Moonlit ancient ruins where the rarest legendary cats sleep among the stars.',

    // ---- small shared fragments (applied last; longer phrases above win) ----
    '升到': 'reached',
    '来访': 'visited',
    '获得': 'Got',
    '元素': ' element',
    '好感': 'affection',
    '闪光': 'shiny',
    '绅士': 'gentleman',
    '基础': 'Base',
    '天赋': 'talent',
    '缺少': 'Missing',
    '需': 'Need',
    '只': '',
    '火': 'Fire', '水': 'Water', '草': 'Grass', '电': 'Elec', '暗': 'Dark', '光': 'Light',
    '力': 'PWR ', '敏': 'AGI ', '体': 'VIT ', '魅': 'CHA ', '时': '/h',
    '花': 'flower',
  };

  var KEYS = Object.keys(DICT).sort(function (a, b) { return b.length - a.length; });
  // Han ideographs + CJK symbols/punctuation + fullwidth forms.
  var CJK = /[一-鿿　-〿＀-￯]/;
  var HAN = /[一-鿿]/;
  // Fullwidth / CJK punctuation that leaks into dynamically-assembled strings.
  var PUNCT = { '！': '!', '？': '?', '，': ', ', '。': '. ', '：': ': ', '；': '; ', '、': ', ', '（': ' (', '）': ') ', '「': '"', '」': '"', '『': '"', '』': '"', '…': '…', '　': ' ' };
  var PUNCT_RE = /[！？，。：；、（）「」『』　]/g;

  function lang() {
    try {
      if (window.MorrowwishI18n && window.MorrowwishI18n.get) return window.MorrowwishI18n.get();
    } catch (e) {}
    return (document.documentElement.lang || 'en').toLowerCase().indexOf('zh') === 0 ? 'zh' : 'en';
  }

  // Pure ZH -> EN substring conversion, INDEPENDENT of the current language mode.
  // Longest keys first so compounds win. Used at capture time so the English
  // form is computed correctly even if the page is currently showing Chinese.
  function toEnglish(str) {
    if (typeof str !== 'string' || !str || !CJK.test(str)) return str;
    var out = str;
    for (var i = 0; i < KEYS.length; i++) {
      var k = KEYS[i];
      if (out.indexOf(k) !== -1) out = out.split(k).join(DICT[k]);
      if (!HAN.test(out)) break;
    }
    // Normalize any remaining CJK/fullwidth punctuation from assembled strings.
    out = out.replace(PUNCT_RE, function (c) { return PUNCT[c]; }).replace(/ +/g, ' ').replace(/ ([.,!?:;]) ?/g, '$1 ').trimEnd();
    return out;
  }

  // Mode-aware translate: the public API + the canvas hook. In English mode it
  // converts ZH->EN; in Chinese mode it leaves text as-is.
  function translate(str) {
    if (typeof str !== 'string' || !str) return str;
    if (lang() !== 'en') return str;
    return toEnglish(str);
  }

  // ---- canvas text hook (wraps whatever /lang.js already installed) ----
  if (window.CanvasRenderingContext2D) {
    ['fillText', 'strokeText'].forEach(function (name) {
      var proto = CanvasRenderingContext2D.prototype;
      var original = proto[name];
      if (original && !original.__catbond) {
        var wrapped = function (text) {
          var rest = Array.prototype.slice.call(arguments, 1);
          return original.apply(this, [translate(String(text))].concat(rest));
        };
        wrapped.__catbond = true;
        proto[name] = wrapped;
      }
    });
  }

  // ---- DOM text + attribute translation (English mode only) ----
  var ATTRS = ['title', 'aria-label', 'placeholder'];
  var SKIP = { SCRIPT: 1, STYLE: 1, CANVAS: 1 };
  var originals = new WeakMap();     // text node -> original zh value
  var attrOriginals = new WeakMap(); // element -> { attr: original }

  function handleTextNode(node) {
    var parent = node.parentNode;
    if (parent && SKIP[parent.nodeName]) return;
    var saved = originals.get(node);
    var current = node.nodeValue;
    // (Re)capture the Chinese source whenever the node shows new untranslated
    // text. Use the mode-independent converter so saved.en is always correct,
    // even when the node is first seen while the page is in Chinese mode.
    if (saved === undefined || (current !== saved.en && current !== saved.zh)) {
      saved = { zh: current, en: toEnglish(current) };
      originals.set(node, saved);
    }
    var want = lang() === 'en' ? saved.en : saved.zh;
    if (node.nodeValue !== want) node.nodeValue = want;
  }

  function handleElementAttrs(el) {
    if (!el || el.nodeType !== 1) return;
    var store = attrOriginals.get(el) || {};
    for (var i = 0; i < ATTRS.length; i++) {
      var a = ATTRS[i];
      if (!el.hasAttribute || !el.hasAttribute(a)) continue;
      var cur = el.getAttribute(a);
      var rec = store[a];
      if (!rec || (cur !== rec.en && cur !== rec.zh)) { rec = { zh: cur, en: toEnglish(cur) }; store[a] = rec; }
      var want = lang() === 'en' ? rec.en : rec.zh;
      if (cur !== want) el.setAttribute(a, want);
    }
    attrOriginals.set(el, store);
  }

  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { handleTextNode(root); return; }
    if (root.nodeType !== 1 || SKIP[root.nodeName]) return;
    handleElementAttrs(root);
    var tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, null);
    var n;
    while ((n = tw.nextNode())) {
      if (n.nodeType === 3) handleTextNode(n);
      else handleElementAttrs(n);
    }
  }

  var observer = null, busy = false;
  function render() {
    if (!document.body) return;
    busy = true;
    if (observer) observer.disconnect();
    walk(document.body);
    // Localize the document title. The page ships an English <title> for SEO;
    // Chinese mode needs an explicit Chinese form (it has no Han to convert).
    try {
      document.title = lang() === 'en'
        ? 'Cat Bond — Raise cats, capture wild ones | Morrow Wish'
        : '猫猫纽带 — 养猫、收服野猫 | Morrow Wish';
    } catch (e) {}
    if (observer) observer.observe(document.body, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ATTRS });
    busy = false;
  }

  function mount() {
    if (!document.body) return;
    observer = new MutationObserver(function (records) {
      if (busy) return;
      busy = true;
      observer.disconnect();
      for (var r = 0; r < records.length; r++) {
        var rec = records[r];
        if (rec.type === 'characterData') handleTextNode(rec.target);
        else if (rec.type === 'attributes') handleElementAttrs(rec.target);
        else for (var a = 0; a < rec.addedNodes.length; a++) walk(rec.addedNodes[a]);
      }
      observer.observe(document.body, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ATTRS });
      busy = false;
    });
    render();
  }

  window.addEventListener('morrowwish-language-change', function () { setTimeout(render, 0); });

  // Expose for tests / debugging.
  window.CatBondI18n = { translate: translate, toEnglish: toEnglish, dict: DICT, render: render };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
})();
