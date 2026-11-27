# Element × Role × Skill Review — 2026-11-26

Snapshot after `b72b0be8` (arcanePulse reverted to dark dps-only per test gate + i18n key).

## 元素 × 角色 分布（33 猫）

| 元素 | 坦克 | 斗士 | 输出 | 收割 | 控制 | 辅助 |
|---|---|---|---|---|---|---|
| 🔥火 | tangyuan 汤圆(N) jiafei 圆宝(SR) | qisi 芝士(N) jinwu 焰焰(SSR) | abi 杏仁(N) | — | — | — |
| 💧水 | dundun 团团(R) | lanbao 蓝莓(R) | xiaohui 小雾(N) | — | fanmao 奶糖(R) | xuewa 雪袜(R) |
| 🌿草 | nietu 奶酥(N) | senlin 松松(SR) nuowei 枫枫(SR) | — | doudou 豆豆(N) | meidu 圈圈(N) | zherdd 布丁(R) |
| ⚡电 | — | — | xianluo 露露(SR) wumao 桃桃(SR) | niuniu 奥利奥(N) | duanduan 跳跳(R) | jinjc 金豆(R) |
| 🌑暗 | — | lixiao 绅绅(R) | youling 幽幽(SR) | moqiu 墨球(N) baomao 斑斑(SR) | xingchen 星星(SSR) mengmai 夜夜(R) | — |
| ✨光 | — | sanhua 花花(R) | yuelian 月月(SSR) | — | yinghua 樱桃(SR) | nainai 奶奶(N) yunduo 云朵(R) bosi 绒绒(SR) |

## 杠铃点（缺口）

| 元素 | 缺的角色 |
|---|---|
| 🔥火 | 收割/控制/辅助 |
| ⚡电 | 坦克/斗士 |
| 🌑暗 | 坦克/辅助 |
| ✨光 | 坦克/收割 |

水 + 草 最全（6/6 角色都有）。

## 角色 → 可学技能规则 (`roleAllowsSkill` battle.js skills.js:773)

| 角色 | 可学 | 禁 |
|---|---|---|
| 🛡️坦克 | close / shield / heal-self / control (via ults) | ranged-weak, ranged-strong |
| ⚔️斗士 | close / shield / heal-self / control | heal-group, ranged-weak, ranged-strong |
| 🎯输出 | close / ranged-weak / ranged-strong | heal-group, shield, isControlSkill |
| 🗡️收割 | close(projectile OK) / 弱控 | shield, heal-*, beam, aoe |
| 🌀控制 | close / ranged-weak / shield / 控 | heal-group, ranged-strong |
| 💚辅助 | shield / heal-* / weak-ranged | ranged-strong, control, close-power≥1.3 |

## 每系所有非 ult 技能 → category 分类

### 火
- emberClaw 炽爪 (melee 1.3) — close
- fireballMeow 火球术 (projectile 1.65) — ranged-strong
- puffHiss 弓背炸毛 (buff) — shield
- flameSweep 横扫喷焰 (beam 1.85) — ranged-strong
- meteor 陨石术 (aoe 2.4) — ranged-strong
- cometClaw 彗星爪 (melee 2.25) — close

### 水
- frostClaw 寒冰爪 (melee 1.22) — close
- waterLash 水鞭 (projectile 1.2) — ranged-weak
- knockOff 拨下桌 (pounce 1.75) — close
- grooming 舔毛理顺 (heal group) — heal-group · role=support only
- waterJet 水枪 (beam 1.75) — ranged-strong
- bubbleVeil 泡泡幕 (buff) — shield
- tidePool 潮汐池 (aoe 0.6) — ranged-weak
- tidalPulse 潮波三叠 (projectile 1.15) — ranged-weak
- tidalBite 潮汐咬 (melee 1.5) — close
- frostLance 霜锥 (projectile 1.95) — ranged-strong

### 草
- vineMire 藤蔓沼泽 (aoe 0.6) — ranged-weak
- leafDart 叶刃 (projectile 1.0) — ranged-weak
- sporeBloom 孢子涨 (projectile 1.25) — ranged-weak
- homingSeed 追踪草种 (projectile 1.25) — ranged-weak
- thornCoil 荆缠 (melee 1.55) — close
- boxAmbush 纸箱埋伏 (buff) — shield
- quakeStomp 泰山压顶 (leap 1.9) — close
- photosynth 光合 (heal group) — heal-group
- knead 踩奶 (buff) — shield
- thornLash 荆棘鞭 (melee 1.5) — close

### 电
- staticPounce 疯跑冲刺 (dash 1.85) — close
- boltArc 电弧 (chain 1.35) — chain
- lightningOrb 球状闪电 (projectile 1.5) — ranged-strong
- thunderStream 雷流喷射 (beam 1.75) — ranged-strong
- magneticField 雷极磁场 (aoe 0.45) — ranged-weak · role=control
- voltRush 雷遁突袭 (dash 2.3) — close
- boltSwarm 雷弹群 (projectile 0.34) — ranged-weak · role=dps,control

### 暗
- shadowSwipe 影袭 (melee 1.35) — close
- shadeLeap 飞扑 (pounce 1.7) — close
- batAround 戏弄爪 (melee 0.8) — close
- hex 猫咒 (projectile 0.9) — ranged-weak
- **arcanePulse 暗星轰击 (aoe 0.78) — ranged-weak · role=dps + autoLearn** ← 2026-11-27 reverted to DPS-only (b72b0be8)
- **shadowTendrils 暗影触手 (beam 0.65) — ranged-weak · role=control + autoLearn**
- apexPounce 绝顶扑 (pounce 2.3) — close
- veteranStrike 百战斩 (melee 2.3) — close

### 光
- glareField 炫目光域 (aoe 0.6) — ranged-weak
- guardStance 守护 (buff) — shield · role=tank,fighter
- prismBeam 棱光束 (projectile 1.2) — ranged-weak
- highGround 居高临下 (leap 1.85) — close
- blessFur 呼噜光环 (buff) — shield
- dawnHeal 慢眨眼 (heal self) — heal-self
- prismSwarm 棱光群 (projectile 0.34) — ranged-weak · role=dps,control
- crescentFan 月华连弧 (projectile 0.6) — ranged-weak
- tenderPaw 抚心掌 (heal self) — heal-self

## 已知问题 / 待定 design calls

1. **DPS 能学 close (melee / dash / pounce / leap)** — owner 2026-11-26 说"dps 不能学近战"，尝试加 `c !== 'close'` 到 `dps` 分支 → `check-cat-bond.mjs:901 recommendLoadout` 断言失败 → **revert + findings-only**。真正修需同时改 recommendLoadout + 每只 dps 猫的 skill pool。
2. **星星 (SSR SSR dark)** BREED_ROLES 显式 override 为 `control`，按 raw stats (pow17 agi16) 本应 dps/assassin。注释说"SSR spatial-control identity"。owner 2026-11-26 问过但没决。
3. **樱桃** 是 `light` 不是 `dark`（我之前列错过）。
4. **火系无 control / 收割 / 辅助** — 系间不均衡最严重。
5. **电系无 close heavy**（voltRush 2.3 是 dash，没真正 heavy melee）+ 无 heal。
6. **光系 dps 只有月月** — 仅 crescentFan + prismBeam + crescentFan 作为输出核心。

## Session changes affecting this table

- `28dccc02` 暗星轰击 dps → dps+control + autoLearn
- `8d52482e` (merged origin / local) learnableSkills honors `cat.awakenedSkill` for splash picks
- `010d6651` V4 audit refresh (9 rows closed)
