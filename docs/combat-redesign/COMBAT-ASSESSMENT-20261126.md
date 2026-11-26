# Cat Bond 战斗评估 — 2026-11-26

Cold-read against `battle.js` / `skills.js` / `traits.js`, 2026-11-26 element×role snapshot, and playtest cycles `wn6wmtgzj → wb4kwxa4y → wrtiogrp8 → woebtgclk → wmxn087xn`.

## 分数 (非客观刻度，是 subagent 对 real telemetry 的加工)

| 轴 | 分 | 一句话 |
|---|---|---|
| 游戏性 (playability) | 6/10 | Inputs 有分量 + mechanically clean，但游戏自己说的话玩家听不见 |
| 战斗趣味 (combat fun) | 4/10 | 一个 30 秒 loop 打 8 遍 |
| 策略性 (strategic depth) | 5/10 | 真 role identity 系统架在"没必做决定"的 gameplay 层上 |

**警告**: 这组绝对数字是 LLM 分析 real telemetry 后的 vibe check，**不是**测量。可信的是**相对差距**（climax 空 / choice 稀）+ **code-cited evidence**，不是具体 "4 vs 7"。真要测量得把 playtest `voice:persona` 的 `funRating` 持久化到 cycle log 做长期趋势。

## 1. 游戏性 — moment-to-moment

**What works** (有代码证据):
- `resolveHit` 走 hitstop + shakeTrauma + slowmo — 真有 craft
- Perfect-dodge path (`battle.js:3553`): 0.9s slowmo + 0.7s i-frames + full combo + 18 ult — 最满足的 input
- 自动 dodge gate 修好 (`battle.js:885`, player cats `dodgeCd: 0`)
- Closing ramp (`battle.js:4968`): `max((t-25)/20, hpDealt/0.20)` — iterated pacing

**What's hostile**:
- Combo mult cap ×1.20 (`battle.js:4173`) `sqrt(min(combo,50))*0.029` → 100-tap chain 跟 10-tap 同样感觉；5 轮 cron 都说
- `BASIC_POWER_MULT=0.85` + `BASIC_SKILL_DMG_MULT=1.0` → basic 是 flat chip 流，没节奏奖励
- `_pressure` + `_closing` sim-side 有，**HUD 零暴露**（每轮都要"closing-rim VFX"）
- 18s ult-ready 悬崖（impatient persona 每轮都卡）

## 2. 战斗趣味 — do fights feel different

**Shape of a fight** (弱 arc):
- 0-5s: 开场（`_pressure` 门 `t>5`）
- 5-25s: mid（pressure ramp，closing dormant）
- 25-45s: 后段（closing 起、poise suppress、+0.25 execute dmg sub-28% HP）
- Climax: **flat**。`captureReady` toggle 一个金 bar + "FINISH IT" toast，**零 damage math 变化**（playtest-log.md:9 被叫做 "taunt to a frustrated player"）

**Variety**: 两场同队 **indistinguishable**。
- `wb4kwxa4y`: "100% HP behavior = 15% HP behavior"
- No phase shift on `makeEnemy()`
- Explorer "solved encounter at battle 3" — 4 轮连续

**Juice**:
- 实际 hitstop (0.016-0.07s) + shakeT 短 — 克制有度
- 7 trait flag 设 multiplier **nothing in battle.js reads** (V4-AUDIT §D4/D13/D17/D25/D28/D29/D30)
- 33 species identity layer = **registered, inert, undetectable**

## 3. 策略性 — do choices matter

**Team-build**:
- 33×6×6 看起来深 — 实际有两个塌陷：
  - Element×role 矩阵歪 (`ELEMENT-ROLE-REVIEW-20261126.md:16-25`): fire 无 control/assassin/support; elec 无 tank/fighter; dark/light 无 tank
  - 必填每 role 的 teamcomp **结构性 forced into 水+草** (唯二 6/6)
- `roleAllowsSkill` 是好 identity gate，但 net effect: 大多 slot 只有 ~3 真选择

**In-fight decisions**:
- `smartAutoAction` 大概率选对 → **消灭决策**（lazy persona 每轮都讲）
- 每轮都是 "E has zero decision-cost, 278× basic:Q ratio"
- basic always right: (a) `gainUlt(1)` per hit (b) 没 "break chain" 信号
- Dodge 是唯一非 trivial read，但 auto-mode 把它藏了

**Counter-play**:
- 元素优劣存在 (`applyHitEffects` burn/soak/chill/shock)
- Shield 真 timing（perfect-block window `battle.js:2439`）
- **但** "敌人出了 committed heavy，你**必须** shield/dodge/ult" — **五轮不变的 #1 P1**
- 游戏有防御，但**没有瞄向防御的进攻**

## 4. 三个最大 GAPS (ranked)

### GAP 1 — 没有防御动词的 forcing function
- Evidence: 5 轮 P1 都讲同一个 ask (`w6hmojrj6:1850`, `wb4kwxa4y:1900`, `wrtiogrp8:1942`)
- Ship: `makeEnemy` 加 `telegraphHeavy` cadence — 每 ~10-12s 红圈 1.2s windup + `_committed=true`，命中 40% maxhp **除非** `inv>0` (dodge) OR `wallHp>0` (shield) OR cancel-by-ult-cast

### GAP 2 — Passive identity layer 70% wired, 30% inert
- V4-AUDIT §D4/D13/D17/D25/D28/D29/D30 — 6 multiplier flags 消费者 0 命中
- 5 self-admitted stubs (D11, D12, D14, D32, D33)
- 任何 `vfxId` **没 consumer** (§I4) — 可用的 trait 也是隐形
- Ship: 1 PR 把 6 个 multiplier consumer wired into `hurtMe` / `hurtEnemy` / `castOffensiveSkill` + 单个 `trait-fire` VFX ring

### GAP 3 — `comboMult` + `captureReady` 是 UI 骗人（climax 没数）
- `comboMult()` ×1.20 cap 5s saturate → flat 30s
- `captureReady` cosmetic only (playtest-log.md:9, 2026-11-20 P1 **still open**)
- Impatient flee at exactly 18s — ult-ready 悬崖 fires before any payoff
- Ship: (a) combo cap ×1.20→×1.35 + 每 25 hits 一次 0.8s ×1.8 fever; (b) `captureReady` 真 execute — sub-28% HP non-boss 吃 ×2.2 from Q/E hit + kill-finisher VFX

## 5. 已经做对的 3 件

1. **`roleAllowsSkill` identity gate** (`skills.js:760-782`) — 6-case switch 真 principled，+ per-skill `allowRoles` opt-in (如 暗星/shadowTendrils) — 真 content system
2. **Perfect-dodge 是唯一真 skill expression** (`battle.js:3553`) — 0.9s slowmo + 0.25 flash + 0.7s i-frames + full combo + 18 ult；2026-11-24 窄化 window — 真 craft
3. **Closing ramp** (`battle.js:4968`) — `max(time, hpDealt/0.20)` 保护 "kiter 真在打" 的 pacing，不是 clock-only；注释 block 4934-4956 真有 cycle-over-cycle iteration

## 单一下一步建议

**Ship telegraphed committed heavy** — 一个新 attack type on `makeEnemy` (红 1.2s windup every 10-12s, 40% maxhp on contact, cancellable by dodge/shield/ult). 它是单一能把**最多存在但不用**的系统转成**load-bearing**的改动:

- Shields 变 situationally correct, 不再 filler
- 18s ult-ready 悬崖从 flee-timer 变 "I was saving this" payoff
- Dodge 变 decision 不是 screensaver
- Auto-mode 必须 express legible reaction 玩家能看
- **两场同队开始感觉不一样** — heavy timing + element rotate

这也是 **5 轮 cron 不变的 P1** — the market is telling you what to build.

## 引用的 5 轮 cycle

- `wb4kwxa4y` 2026-11-26 — "verbs/pacing/difficulty exist, no decision-forcer"
- `w6hmojrj6` 2026-11-26 — "one verb + one enemy script"
- `wrtiogrp8` 2026-11-26 — "mechanically solid, flat progress bar, first 18s no beat"
- `woebtgclk` 2026-11-26 — "well-instrumented internally but visually mute, combo saturates"
- `wmxn087xn` 2026-11-26 — "numerically solid but feels OFF, no verb for sustained input"
