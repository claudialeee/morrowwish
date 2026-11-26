# Balance brief — P1 species-passives (read BEFORE running playtest or RSI)

**Purpose:** when the hourly adversarial playtest OR the RSI balance-probe
runs, the sim should reflect that **12 cats are about to ship with unique
passives**. This brief tells both harnesses what to assume + what to flag.

**Scope:** 12 P1 cats listed below. The other 21 are P2; treat them as current
(no-passive) for now.

**Not code:** this doc shapes HOW playtest + RSI interpret results — not
what the game does. Game code still has zero traits implemented.

---

## The 12 P1 cats (short form)

| Cat | Element | Role | Passive | Numbers I picked |
|---|---|---|---|---|
| 汤圆 tangyuan | 火 | tank | 承伤储能 → 下一次重击释放 | store 25%, cap 60% maxhp, release +120% |
| 团团 dundun | 水 | tank | 护盾破裂 → 90u 冰爆冻结 1.2s | ICD 8s, dmg 0.6× |
| 蓝莓 lanbao | 水 | fighter | chill/soak 叠 1-5 层 → 重击引爆 | +30% dmg/层, cap 5 |
| 松松 senlin | 草 | fighter | 持续：×1.25 重击、×1.4 韧性、×0.85 速度 | 持续被动 |
| 杏仁 abi | 火 | DPS | 移动 200u → 下次 proj +40% 大 1.3× | binary flag |
| 桃桃 wumao | 电 | DPS | 静止 1.5-3s → ELEC proj +0-30% dmg +40% 速度 | ramp |
| 墨球 moqiu | 暗 | assassin | 脱离注视 1.5s + 180u 外 → 下击 +85% | one-shot |
| 奥利奥 niuniu | 电 | assassin | Dash 终点 → 下击 50% 回放 | ICD 3s |
| 圈圈 meidu | 草 | control | 草场每 tick 拉敌人向控点 60u/s | 每场一个控点 |
| 跳跳 duanduan | 电 | control | 走路留 1.6s 电痕，敌入 → 8% dmg + shock | 40 段上限 |
| 云朵 yunduo | 光 | support | 奶后羁绊 ≤2 位队友 4s，下次奶 25% 扩散 | 2 link cap |
| 绒绒 bosi | 光 | support | 奶溢出 × 0.6 → 临时护甲 (cap 25% maxhp) | decay 10%/s |

Full spec: `docs/combat-redesign/11-r1-design-passives-p1-spec.md`.

---

## What playtest should flag

When writing critiques, consider:

**P0 if a passive directly causes:**
- Infinite loop (云朵-绒绒 heal cycle, 奥利奥 echo-of-echo, 蓝莓 multi-hit
  one-cast re-stacking, 圆宝-圆宝 damage ping-pong (圆宝 is P2 but keep
  in mind))
- One-shot via 汤圆 cap (should cap at 60% maxhp = never one-shot)
- 团团 freeze-stunlock a boss (should use V4 override: slow + 削韧 only)
- Passive VFX drowns out enemy telegraphs (owner V4 §12: trait VFX < skill
  VFX < ult VFX)

**P1 if:**
- A P1 cat's passive NEVER FIRES in an 8-battle sample for a "normal" play
  pattern (trigger too tight)
- A P1 cat's passive fires >15× / fight (trigger too loose, numbers inflate)
- Two P1 cats have INDISTINGUISHABLE in-fight impact (de-dup fail — see §4
  of 11-doc for the risky pairs)
- Masher persona can ignore the passive and still win (not forcing a
  decision change)
- Cautious persona can't trigger their passive from pure kiting (e.g.
  moqiu's detection-lost trigger should NOT be satisfied by always-fled)

**P2 if:**
- A passive's VFX phase (准备 / 触发 / 消散) isn't readable
- Numbers feel "off" but still in the 15-35% tuning window

---

## What RSI balance-probe should weight

Current balance-probe ranks element balance by per-element kit power.
When P1 ships, the probe should ALSO account for passive contribution:

```
expected damage per cat = base kit DPS + passive contribution
```

Rough starting passive-contribution estimates (adjust after sim):

| Cat | Passive contribution (as % of base DPS) |
|---|---|
| 汤圆 | +15-20% if taking hits, 0 if not touched |
| 团团 | +8-12% (CC not raw DPS; counts via time-saved) |
| 蓝莓 | +20-25% with regular heavy cadence |
| 松松 | +15% raw heavy boost -5% speed → net ≈ +10% |
| 杏仁 | +15% assuming 3-5 moves per 15s fight |
| 桃桃 | +10-15% assuming 2-3 stationary windows |
| 墨球 | +20% assuming 1-2 ambush per fight |
| 奥利奥 | +10% echo at 50% |
| 圈圈 | +8% via better field coverage (hits more enemies) |
| 跳跳 | +12% via trail chip + shock utility |
| 云朵 | +12% team-wide via spread |
| 绒绒 | +8-10% via armor recycle |

**Balance targets:**
- No element's P1 cats collectively > 1.3× any other element after passives
- No P1 cat's passive contribution < +5% (dead trait)
- No P1 cat's passive contribution > +35% (dominant trait)

**If after P1 ships, RSI detects element imbalance:** attribute to passives
first (check which element's P1 cats fired most), then kit second.

---

## What's NOT in scope for this balance brief

- Form awakening (P3) — P1 is base-form only
- The 21 P2 cats — treat as unchanged
- Infrastructure correctness (`traits.js` recursion guards) — covered by
  unit test in the infra PR, not a playtest concern

---

## Specific numbers playtest/RSI should hold constant (owner-locked)

These are MY (agent's) calls, owner delegated balance. Flag if sim data
contradicts them:

- 汤圆 store% = 25 / cap% = 60 maxhp
- 团团 freeze = 1.2s / ICD = 8s
- 蓝莓 per-stack = +30% / cap = 5
- 松松 heavy = ×1.25 / speed = ×0.85
- 杏仁 distance threshold = 200u
- 桃桃 charge time = 1.5-3s ramp
- 墨球 detect timeout = 1.5s / distance = 180u / bonus = +85%
- 奥利奥 echo = 50% / ICD = 3s
- 圈圈 pull = 60u/s
- 跳跳 chip = 8% / shock = 0.25s
- 云朵 spread = 25% / range = 300u / link cap = 2
- 绒绒 conversion = 0.6 / armor cap = 25% maxhp

If adversary suggests changes outside the "likely range" column of 11-doc,
treat as a FINDING (not auto-applicable; owner gate).

---

## When this brief updates

- After P2 ships: add the 21 P2 cats
- After form awakening P3 ships: add per-form sensitivity
- If owner overrides a number: update the "locked" list above
