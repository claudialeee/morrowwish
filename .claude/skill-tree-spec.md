# Cat Bond 技能树重构 Spec (data-driven, from sim analysis)

## 2026-11-22 属性归属修正（高优先级，覆盖下文过时设计）

**禁止恢复旧版 SPLASH_ELEMENT 的元素循环。** 曾经的火→草→水→电→暗→光→火将所有猫误判为双属性，导致蓝莓等水猫随机学到雷光爪。这个规则已经被彻底删除。

- 33 种猫各有一个固定主属性。绝大多数猫（27/33）是**单属性**，永远不能解锁与主属性不符的技能，含训练师、觉醒、默认配装、手动流派和高等级。
- 唯一 6 种明确设计的双属性猫：xianluo 电+光；yinghua 光+草；youling 暗+光；jinwu 火+光；yuelian 光+水；xingchen 暗+光。配置以 `Skills.SPECIES_SECONDARY` / `Skills.secondaryOf` 为唯一真值，不从主属性推导副属性。
- 允许的副属性普通技能最多两招：第一招觉醒或 Lv.4，第二招 Lv.12 + 好感 60。副属性不能继承第二套完整的技能树，不能获得副属性的必杀。
- 单属性猫首次收服奖励是**本系第二招**而不是跨属性招式。比如 lanbao（蓝莓）始终水系，早期应该有寒冰爪（frostClaw，水），高阶霜锥（frostLance）由训练师学习；不能学雷光爪、雷电盾或雷系必杀。
- 电系专用的镜面炸毛墙（mirrorWall）即使属于坦克流派也不能让水系坦克学会。切换流派不会改变元素资格。
- 旧存档跨属性已学 ID 可保存在历史字段，但**禁止被放进战斗配装**；`ensureLoadout` 用合法的主属性技能修复槽位，不删除等级、好感、资源与其他合法学习记录。
- 无法凭“稀有度高”或“好感高”自动赋予新元素。需要明确审过的品种级属性归属。基础技能库和 VFX 能提供所有元素的独立近战/远程/辅助，不需要跨属性借技能。
- `scripts/check-cat-bond.mjs` 对全部 33 种猫、1/4/15 级、训练师、普通/双属性、蓝莓旧存档、觉醒和寒冰爪执行可重复验收。下文所有提到的“环形 splash”或“所有猫默认跨系借招”均已废止。


分析依据: 43 技能中 26 个(60%)从不被任何猫自动装备(72 cat-states 实测)。
auto-loadout 的 find() 顺序偏向本系基础攻击,导致 gated/重复技能永不被选。
真正信号 = **重叠**: 既是 near-dup 又从不装备 = 安全删除。

## 目标
43 → ~24-27 技能。每系 = 2 条升级链 + 1-2 特色独立技 + 护盾/治疗 + 终结技。
升级链: tier2 升级版 **替换** tier1 占同一技能槽(学习靠等级/亲密/花费),玩家手里槽位少但成长感强。

## 升级链映射(current id → tier)
- 火 melee: emberClaw(炽爪1.3) → cometClaw(彗星爪1.7) → [terminal=sunflare ult]
- 火 ranged: fireballMeow(咳毛球) 独立(火唯一远程,固定槽)
- 火 util: puffHiss(弓背炸毛) 独立; 火 ULT: sunflare(金乌焱); purrNova 折叠进 sunflare 最高 tier
- 水 ranged: waterLash(水鞭1.0) → frostLance(霜锥1.45+chill)
- 水 melee: tidalBite(潮汐咬) 独立; 水 channel: waterJet(水枪) 独立(保留特点)
- 水 shield: bubbleVeil(泡泡幕,31装备,通用E盾); 水 ULT: tsunamiPaw(潮汐掌)
- 水 删: grooming(舔毛,冗余heal); knockOff(拨下桌)/tidePool(潮汐池) 降级为可选特色
- 电 dash: staticPounce(疯跑冲刺1.4) → voltRush(雷遁突袭1.6)
- 电 ranged: boltArc(电弧) 独立(保留,combo 需要); 电 shield: mirrorWall(炸毛墙反弹)
- 电 ULT: thunderYowl(雷鸣啸); 电 **补 1-2 个**(控制/治疗,电系无控无奶,凑齐 parity)
- 草 ranged: leafDart(叶刃1.0,cd1.6 快速连发) 独立
- 草 melee: thornCoil(荆缠1.1 bind+bleed) → thornLash(荆棘鞭1.5)
- 草 独立: sporeBloom(孢子涨,grow 边飞边膨胀+束缚,远距铺场控), homingSeed(追踪草种,HOMING 追踪=高命中,打机动目标), quakeStomp(泰山压顶 leap-slam), boxAmbush(纸箱埋伏 隐身); 草 heal: photosynth(光合)
- 草 **不删 homingSeed**: agent 误判为 leafDart 重复(只比了 power1.0),实际 homing 追踪=独特高命中机制,叶刃/孢子涨/追踪草种三者手感定位完全不同(连发/铺场/锁定),都保留
- 教训: "从不自动装备" ≠ 重复。grow/homing/channel 这类机制差异必须纳入判断,不能只看 power 数字
- 草 **缺口**: 无伤害终结技 — 要么 quakeStomp 升级成草 aoe ult,要么新增草 ult
- 暗 melee: shadowSwipe(影袭1.35 bleed) → veteranStrike(百战斩1.9)
- 暗 pounce: shadeLeap(飞扑1.3) → apexPounce(绝顶扑1.8) [可整条删,暗更干净]
- 暗 独立: hex(猫咒,唯一 expose 减抗+40%), batAround(戏弄爪 dizzy 可删); 暗 ULT: voidMaw(虚吞 rewind)
- 光 ranged: prismBeam(棱光束) 独立; 光 leap: highGround(居高临下) 独立
- 光 heal: dawnHeal(慢眨眼) → tenderPaw(抚心掌); 光 shield: guardStance(守护,29装备,通用E盾)
- 光 ULT(伤害型): moonlitHalo(月华环); moonfang 折叠进最高 tier
- 光 ULT(辅助型): blessFur(呼噜光环)**升级成大招** — buff/regen 底子,做成团队增益终极技(全队强化+回复光环),和月华环的伤害型 ult 区分,给光系一个辅助系终极。改 ultCost>0 + tags ult。**不删**

## 每系 6 个终结技(破坏死光级,打完定身/后遗症不同)
火=sunflare, 水=tsunamiPaw, 电=thunderYowl, 暗=voidMaw, 光=moonlitHalo, 草=需新增/quakeStomp升级
- 破坏死光(电/暗): 打完完全不能动 X 秒
- 阳光烈焰(草系新终结技): 打完不能攻击 X 秒(移动可)
- 发射时全程锁定

## 实现时必须处理的 gating/断言
- SIGNATURE_SKILL 引用 sunflare/moonlitHalo/voidMaw/thunderYowl/photosynth/tsunamiPaw — 全是 KEEP,安全
- check-cat-bond.mjs: cometClaw 花费测试(~235-254)、frostLance Lv10 测试(~258-264)、moonfang 品种锁测试(~276-281) — 改 id/gate 会挂,需同步更新
- defaultLoadout/ensureLoadout E-slot 依赖 bubbleVeil/guardStance/mirrorWall 三个盾经 SPLASH_ELEMENT 环到达各系 — 别全删
- SPLASH_ELEMENT 环: 一系删技能会影响另一系 splash 池,改后重跑 72-state 验证每猫填满 4 槽
- 删 gated 技能要同步删 QUEST_CHECKS/SIGNATURE 引用,否则 trainer UI 列出不存在的技能

## 用户对 agent 删除清单的人工纠正(MUST 遵守,不可照搬 agent 的 cut 建议)
agent 的"从不自动装备"清单有多个误判(只看 power/equip-count,忽略机制)。以下用户明确要**保留**:
- 追踪草种 homingSeed — HOMING 追踪=高命中,打机动目标,保留
- 咳毛球 fireballMeow — 火唯一远程,蓄力精准,保留
- 纸箱埋伏 boxAmbush — 隐身伏击,保留
- 泰山压顶 quakeStomp — 跳砸击虚,保留
- 电弧 boltArc — 连锁,combo 必需,保留
- 戏弄爪 batAround — dizzy 控制,保留
- 居高临下 highGround — 跳跃致盲,保留
- 呼噜光环 blessFur — **升级成光系辅助型大招**(团队增益+回复),不删
原则: 实现时每个"建议删除"的技能都要二次确认有无独特机制(homing/grow/channel/场地/控制/VFX手感),
只有纯 power 不同、机制完全一致的 gated 版才折叠成升级链,其余一律保留。真正要删的基本只剩
homingSeed 以外的纯重复项 — 复查后清单可能缩到很小。

## 配套机制(task #57)
吟唱可打断; 先制技(电光一闪打断敌人吟唱); 叠攻/蓄能; 场地陷阱; 接棒传buff;
普攻槽只允许伤害型+少量buff/debuff(收紧 basicEligible); 每技能冷却差异化。

## 用户新增技能创意(待实现,归入技能树重构)
- **星星眼 StarEyes**: 锥形范围内控制住对方所有猫(魅惑/定身),但自己也不能动(持续引导型控制,自锁)
- **肉垫波 PawWave**: 肉垫发出一道波(龟派气功式 beam),可缓慢转向但自己不能动;转向速度很慢(引导型移动光束)
- **踩奶 Knead**: 踩奶机制(待定——可能是自我增益/叠层,或节奏型蓄能;猫味十足)
- **禁锢圈 CageRing**: 限制对方移动——把目标猫控制在一个小圆圈里,出不去(范围禁锢/力场牢笼),参考宝可梦"黑色目光/蛛网"
- **星星眼/肉垫波/禁锢圈 都属于"控制/引导"类**,和已登记的 6 系终结技、吟唱可打断、先制打断 一起设计
- 分配建议: 禁锢圈→可做暗/草系控制; 星星眼→光/魅力系(cha高的猫); 肉垫波→通用或水系引导beam; 踩奶→通用自增益

## 护盾/保护类技能特效(待实现)
- 护盾/保护类技能(守护 guardStance / 泡泡幕 bubbleVeil / 炸毛墙 mirrorWall)激活时需要明显特效:
  **半透明的墙 或 球状护罩**(semi-transparent barrier wall / dome bubble around the cat)
- 现在 vfx 只有 ring,要加一个持续的半透明护罩绘制(跟随猫,持续到护盾结束),区分 barrier(墙)/dome(球)
- 改 vfx.js(加护罩绘制)+ battle.js(护盾激活时挂载/绘制护罩,shieldT/protectT/reflectT 期间)

---

# v2 设计 (用户确认): 通用模板 × 6属性 + 本系专属 + 终结技

分析依据: /tmp/tmplscan.mjs 扫描 — 技能分三类(template-able / special-signature / ult)。
元素×原型覆盖矩阵(/tmp/elemmap.mjs)显示每系都有大量 role 缺口(火无 dash/盾/愈, 暗无盾/愈/buff,
电无 melee/heal),这就是"草猫配电技能/跨系借"的根因。

## 第1层: 通用模板(数值共用, 属性染色自动派生) — 命名=元素形象名
一个 ELEMENT_KIT 表 + 一个 genericSkills() 工厂: 每模板 × 每系, 若该系缺此原型则生成注入 SKILLS。
数值由模板统一(等 balance agent 结论定稿), 元素只换 tag/颜色/名字。所有 role 不再跨系借。

模板清单(current → 补齐):
- 爪击 melee   pow~1.3 cd~1.5  现:炽爪(火)影袭(暗) → 补 水/草/电/光
- 弹射 projectile pow~1.0 cd~2.0 现:水鞭/叶刃/棱光束(有cc的归专属) → 补齐6系基础弹
- 冲刺 dash    pow~1.4 cd~4.0  现:仅电(疯跑冲刺=专属heavy) → 补 火/水/草/暗/光 通用冲刺
- 护盾 shield-buff cd~7.0     现:泡泡幕(水barrier)/守护(光protect)/炸毛墙(电reflect) → 补 火/草/暗(半透明罩, ward-art 已支持 barrier/reflect/protect)
- 愈合 heal    cd~7.5         现:慢眨眼/抚心掌(光)/光合(草)/舔毛(水) → 补 火/电/暗

命名(爪击系示例): 烈焰爪(火) 碧波爪(水) 藤蔓爪(草) 雷光爪(电) 暗影爪(暗) 耀光爪(光)
护盾系: 烈焰罩/碧波罩/…  愈合系: 炽愈/润愈/…  (工厂按 ELEMENT_KIT.prefix 组名)

ELEMENT_KIT 表(每系): { tag, color, 名字词根 }
  fire:{tag:'burn',color:'#ff7a3c'} water:{tag:'soak',...} grass:{tag:'bleed'/'bind'}
  elec:{tag:'shock'} dark:{tag:'bleed'} light:{tag:'blind'}

## 第2层: 本系专属(手写保留, 不套模板 — 体现各系独特玩法)
scan 已识别(有 windup/channel/grow/homing/field/shield/cc/heavy 机制), 全部保留:
- 火: 咳毛球(蓄力精准) 弓背炸毛(威吓) 横扫喷焰(channel) 彗星爪(heavy升级)
- 水: 水枪(引导beam) 潮汐池(场地) 拨下桌(击飞) 霜锥(冰冻)
- 草: 孢子涨(grow) 追踪草种(homing) 纸箱埋伏(隐身) 泰山压顶(跳砸) 荆棘鞭(升级)
- 电: 电弧(连锁) 球状闪电(homing) 雷流喷射(channel) 雷遁突袭(heavy升级)
- 暗: 猫咒(expose) 戏弄爪(dizzy) 绝顶扑/百战斩(heavy升级)
- 光: 棱光束(致盲) 居高临下(跳跃致盲)

## 第3层: 终结技(每系1 ult, 已齐): 金乌焱/潮汐掌/阳光烈焰/雷鸣啸/虚吞/月华环

## 实现(加法, 小 diff, 不与 owner churn 大撞)
1. ELEMENT_KIT 常量表 + TEMPLATES 常量(模板数值) + genericSkills() 工厂
2. 工厂只对"该系缺的原型"生成 → 不覆盖已有专属/升级技
3. recommendLoadout 的本系优先现在天然满足(每系都有本系 role 技能了)
4. 矩阵不变量 INV: 每系 melee/projectile/dash/shield/heal 原型齐全(覆盖矩阵无✗)
5. i18n: 生成名进字典(或走通用翻译路径)
6. 数值待 balance agent 结论定稿后再锁 TEMPLATES 的 pow/cd
