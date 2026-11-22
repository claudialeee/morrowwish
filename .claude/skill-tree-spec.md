# Cat Bond 技能树重构 Spec (data-driven, from sim analysis)

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
