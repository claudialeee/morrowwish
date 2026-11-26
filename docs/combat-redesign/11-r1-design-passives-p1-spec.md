# R1 Task D (P1) — 12-cat passive full spec

**Status (2026-11-25):** Companion to `10-r1-design-species-passives.md`.
That doc is the V4 proposal archive + architecture. This one specs the
**12 P1 reference cats** with the numbers, trigger conditions, VFX phases,
de-dup assertions, and code hooks each `traits.js` entry needs.

**Owner-locked path B (2026-11-25):** infra PR (0 cats) → 12-cat PR (this
spec) → 21-cat PR. Not 33-at-once, so bugs in `traits.js` or an event hook
get caught before amplifying to 33 cats.

**Each cat's spec has 7 fields** (mirrors the `TraitDef` shape in §10 §5.2):

1. **Trigger** — which event + condition
2. **Numbers** — ICD, radius, dmg %, stacks, decay
3. **Effect** — what gameplay primitive changes
4. **VFX phases** — 准备 / 触发 / 消散
5. **De-dup test** — which cat it collides with, how to stay distinct
6. **Code hook** — site in battle.js where emit happens
7. **Form-awakening sensitivity** — base-form only / applies to all forms

Numbers below are **starting points for sim tuning**, not final.
`check-cat-bond-combat-matrix` must stay green after each cat lands.

---

## Index

| # | 猫 | id | element | role | passive | event |
|---|---|---|---|---|---|---|
| 1 | 汤圆 | tangyuan | 火 | tank | 炎怒反击 | `onDamageTaken` + storage |
| 2 | 团团 | dundun | 水 | tank | 碎霜反击 | `onShieldBreak` |
| 3 | 蓝莓 | lanbao | 水 | fighter | 冰川破击 | `onStatusApplied` + stacks |
| 4 | 松松 | senlin | 草 | fighter | 巨兽之躯 | persistent (not event) |
| 5 | 杏仁 | abi | 火 | DPS | 疾风燃势 | `onMove` distance threshold |
| 6 | 桃桃 | wumao | 电 | DPS | 静电蓄能 | `onStationary` ramp |
| 7 | 墨球 | moqiu | 暗 | assassin | 暗夜潜伏 | `onDetectionLost` |
| 8 | 奥利奥 | niuniu | 电 | assassin | 雷影追击 | `onDashCompleted` |
| 9 | 圈圈 | meidu | 草 | control | 藤蔓漩涡 | `onFieldTick` |
| 10 | 跳跳 | duanduan | 电 | control | 电荷轨迹 | `onMove` + trail |
| 11 | 云朵 | yunduo | 光 | support | 羁绊丝线 | `onHealResolved` + relay |
| 12 | 绒绒 | bosi | 光 | support | 柔光护甲 | `onHealResolved` + overheal |

**Event coverage:** 11 of V4's 17 events touched by these 12 cats. Remaining
events (`onSkillCast`, `onBeforeDamage`, `onTargetKilled`, `onFieldExpired`,
`onCleanse`, `onResourceGained`) exercise in P2.

**Recursion guards exercised:** 5 of 8.奥利奥 self-echo, 云朵 heal relay,
绒绒 overheal→armor loop, 蓝莓 multi-hit-per-cast, 松松 persistent re-apply.
Remaining 3 guards (幽幽 echo, 圆宝 chain, 金豆 cycle) exercise in P2.

---

## 1. 汤圆 (tangyuan) · 炎怒反击 · 火 tank

**Trigger** `onDamageTaken` — any successful incoming hit on tangyuan.

**Numbers**
- Store 25% of incoming dmg into `cat._emberCharge` (max cap = 60% maxhp)
- Decay 5%/sec if out of combat for >3s (`cat._lastHitT` + 3)
- Consumed by the NEXT `heavy: true` melee or `kind: 'pounce'` skill (`cometClaw`, `emberClaw` upgraded, 烈焰飞扑 if ships)
- Consumption adds `_emberCharge` damage ON TOP of the hit (not multiplicative), capped at +120% of the hit's base dmg
- ICD none — storage-consumption gate self-limits

**Effect** → damage-sponging tank gets REACTIVE burst. Encourages "get hit → heavy counter" play loop, discourages "just block".

**VFX phases**
- 准备: `_emberCharge > 0` → lava-vein overlay on tangyuan's sprite, intensity ∝ charge/cap
- 触发: heavy hit frame → ember particles converge on target + crimson impact flash + 0.08s hitstop
- 消散: `_emberCharge = 0` → lava veins fade over 0.4s

**De-dup vs 团团**: tangyuan STORES incoming dmg, releases on NEXT heavy swing (offensive). 团团 waits for shield-break, releases ice INSTANTLY in a ring (defensive). Sim assertion: tangyuan with no heavy slot = 0 trait damage per fight; 团团 with 1 broken shield = 1 trait ring per fight.

**Code hook** `battle.js hurtFighter()` after dmg applied to tangyuan → `TraitEngine.emit('onDamageTaken', {cat, dmg})`.

**Form sensitivity** base only. 熔岩战将 form replaces with "offensive charge" variant (different triggerCondition).

---

## 2. 团团 (dundun) · 碎霜反击 · 水 tank

**Trigger** `onShieldBreak` — any shield (bubbleVeil, guardStance, mirrorWall) on dundun is reduced to 0 by enemy damage (NOT by natural expiry).

**Numbers**
- Radius 90 game units
- Freeze duration 1.2s (hard-stun, enemy can't move/attack)
- Internal cooldown 8s
- Base damage: 0.6 × dundun.dmg (low — this is a CC trigger, not DPS)
- MUST NOT trigger if shield expired naturally (owner V4: "护盾自然消失不触发")
- MUST NOT trigger more than once per shield (`shield._triggerFired` pin)
- Against bosses: V4 override — replace freeze with 50% slow + 20% poise削减 (owner call)

**Effect** → shields become both defense AND offense. Incentivizes TAKING shield damage, not avoiding it.

**VFX phases**
- 准备: `shield.hp / shield.maxhp < 0.3` → cracks spread across shield surface
- 触发: shield.hp → 0 by hit → ice-crystal burst, enemies within R get frost-encased
- 消散: freeze expires → crystals shatter on each enemy with a sharp ting

**De-dup vs 汤圆**: see §1 (storage-release vs shield-break-burst).

**Code hook** battle.js `applyShieldHit()` (wherever shield.hp decrements) → when crossing 0 from a hit source → `TraitEngine.emit('onShieldBreak', {cat, shield, attacker, reason: 'depleted'})`. Naturally-expired shields emit with `reason: 'expired'` which the trigger ignores.

**Form sensitivity** base + both forms (shield mechanic is signature).

---

## 3. 蓝莓 (lanbao) · 冰川破击 · 水 fighter

**Trigger** `onStatusApplied` — lanbao's attack applies `chill` or `soak` tag to an enemy (not any attack).

**Numbers**
- Each application: +1 `enemy._frostStack` (max 5, decay 6s if no new stack)
- Next `heavy: true` hit from lanbao (water-element) on same enemy CONSUMES all stacks:
  - +30% damage per stack (max +150% at 5 stacks)
  - Clears all stacks
  - Spawns ice-shatter visual

**Effect** → chip-attacks build up, heavy spends it. Forces player to think "when do I heavy-hit?"

**VFX phases**
- 准备: frost crystals grow on enemy sprite, intensity ∝ stack count
- 触发: heavy hit → crystals shatter outward in cone
- 消散: stack count visibly decays (every 6s one crystal falls off)

**De-dup vs 焰焰 (P2)**: 蓝莓 uses OWN-applied chill/soak stacks via chip hits → heavy detonate. 焰焰 consumes EXISTING burn tag from ANY source → instant nova.

**Code hook** battle.js `applyStatusTag()` when tag is `chill`/`soak` and source is lanbao → `emit('onStatusApplied', {cat, target, tag})`. Heavy-consumption branch in `fireHeavyMelee` reads `target._frostStack`.

**Form sensitivity** base + 冰川斗士 (deepens); 霜铠守卫 replaces mechanic.

---

## 4. 松松 (senlin) · 巨兽之躯 · 草 fighter

**Trigger** persistent (no event). Active while on field.

**Numbers**
- Sprite scale 1.4×
- Heavy damage × 1.25
- Poise max × 1.4 (harder to stagger)
- Attack animation × 1.15 (slower)
- Move speed × 0.85

**Effect** → human-tempo powerhouse. Trades speed for weight.

**VFX phases**
- 准备: persistent rune glow under feet
- 触发: heavy attack → ground-crack lines + dust cloud + larger slash arc
- 消散: fight end — rune fades

**De-dup**: senlin is the ONLY "persistent stat tweak" archetype. Everyone else has event triggers.

**Code hook** battle.js `makeCat()` or `ensureLoadout()` applies stat tweaks when `cat.species === 'senlin'`. No emit needed.

**Form sensitivity** base + 森林狮王 (further scales); 古树守卫 switches to tank numbers.

---

## 5. 杏仁 (abi) · 疾风燃势 · 火 DPS

**Trigger** `onMove` — distance since last charge-reset ≥ 200 units.

**Numbers**
- Track `cat._abiDistance` summed by frame-dt × move-speed
- `_abiDistance >= 200` → set `cat._abiCharged = true`, reset distance
- `_abiCharged = true` → next PROJECTILE +40% damage, 1.3× projectile size
- Consumed on cast; extra distance doesn't stack (binary flag)
- ICD none

**Effect** → walk-shoot gameplay. Standing still = no charge.

**VFX phases**
- 准备: ember trail behind cat (intensity ∝ `_abiDistance/200`)
- 触发: cast charged → compressed flame burst, larger projectile
- 消散: cast → ember trail fades, charge indicator pops

**De-dup vs 桃桃**: abi = MOVE to charge. wumao = STAND STILL to charge. Direct inverse.

**Code hook** battle.js `update()` after f.x/f.y change → `emit('onMove', {cat, distance})`. Charged flag read in `castOffensiveSkill` when `sk.kind === 'projectile'`.

**Form sensitivity** base only.

---

## 6. 桃桃 (wumao) · 静电蓄能 · 电 DPS

**Trigger** `onStationary` — not moved for ≥ 1.5s.

**Numbers**
- Track `cat._wumaoStillT` ticking up when `|dx|+|dy| < epsilon`, reset to 0 on movement
- `_wumaoStillT >= 1.5` → `cat._wumaoCharged = clamp(_wumaoStillT/1.5 - 1, 0, 1)` (partial at 1.5s, full at 3s)
- Next ELEC projectile/beam: +30% dmg × `_wumaoCharged`, +40% projectile speed
- Consumed on cast
- ICD none

**Effect** → pylon-cat. Approaching enemies forces movement = charge reset.

**VFX phases**
- 准备: electric arcs thicken around cat, intensity ∝ charge
- 触发: cast charged → arcs discharge into projectile with crack-sound
- 消散: cast → arcs dissipate

**De-dup vs 杏仁**: see §5.

**Code hook** battle.js `update()` → `emit('onStationary', {cat, dt})` with cumulative stillness time.

**Form sensitivity** base only.

---

## 7. 墨球 (moqiu) · 暗夜潜伏 · 暗 assassin

**Trigger** `onDetectionLost` — all enemies' aiTarget !== moqiu for ≥ 1.5s AND moqiu >180 units from nearest enemy.

**Numbers**
- Enter `_moqiuStalk = true` state
- Next melee/pounce +85% dmg; grants `backstab:1.5` if angled from behind
- Consumed on first hit
- Visible "obscured" render (alpha 0.5) while in state
- ICD none

**Effect** → stealth-ambush. "Hit, retreat, re-engage" loop.

**VFX phases**
- 准备: moqiu fades to 0.5 alpha + shadow mist pools
- 触发: emergence hit → mist-burst + sharp claw-slash + 0.1s hitstop
- 消散: alpha returns to 1.0, mist disperses

**De-dup vs 豆豆 (P2)**: moqiu = AMBUSH via visibility reset. 豆豆 = BACKSTAB via angle (no stealth required).

**Code hook** trait polls every 0.2s: if no enemy targets moqiu AND distance >180, tick `_moqiuStalkT`.

**Form sensitivity** base + 暗夜猎手 (deepens stealth window).

---

## 8. 奥利奥 (niuniu) · 雷影追击 · 电 assassin

**Trigger** `onDashCompleted` — niuniu finishes a dash or pounce.

**Numbers**
- Spawn electric afterimage at path midpoint, duration 1.4s
- Afterimage echoes NEXT niuniu attack within window at 50% damage, same target as original
- MUST NOT echo an already-echo attack (flag with `_isDerived: true`)
- ICD 3s (prevents 2 dashes → double echo compound)

**Effect** → dash sets up "second attack from the past". Strong with wind-ups.

**VFX phases**
- 准备: dash trail leaves lightning afterimage at midpoint
- 触发: next attack → afterimage recreates cast motion in cyan-blue, projectile flies from there
- 消散: afterimage flickers out at 1.4s or on-echo

**De-dup vs 幽幽 (P2)**: niuniu echoes AFTER DASH, from midpoint. 幽幽 echoes AFTER ATTACK, from original position.

**Code hook** battle.js `endDash()` → `emit('onDashCompleted', {cat, path})`. Trait stores midpoint; on next attack `castOffensiveSkill`, spawns parallel projectile with `_isDerived: true` + damage × 0.5.

**Form sensitivity** base only.

---

## 9. 圈圈 (meidu) · 藤蔓漩涡 · 草 control

**Trigger** `onFieldTick` — thornCoil/vineMire/grass field owned by meidu ticks (every 0.2s).

**Numbers**
- Each tick: pull enemies within field toward control point (field center + 25u offset)
- Pull strength 60 units/sec toward target
- MUST NOT double-pull (one field = one vector per enemy per tick)
- Pull → slow+root only vs bosses

**Effect** → fields collect enemies for team alpha-strike.

**VFX phases**
- 准备: field cast with visible control point marker (pulsing green dot at offset)
- 触发: tick → vines contract toward marker, enemies drift
- 消散: field expires → vines retract

**De-dup vs 奶糖 (P2)**: meidu pulls to FIXED point. 奶糖 pulls radially/rotationally. Different geometry.

**Code hook** battle.js `fieldTick()` → emit. Trait applies position nudge toward `(field.cx + 25, field.cy + 25)` scaled by (60 × dt / distance).

**Form sensitivity** base + 藤蔓支配者 (deepens); 日光术士 removes entirely (DPS switch).

---

## 10. 跳跳 (duanduan) · 电荷轨迹 · 电 control

**Trigger** `onMove` — duanduan moves > 10 units/frame.

**Numbers**
- Leave segment (x1,y1,x2,y2) as electric trail
- Trail persists 1.6s
- Enemy crossing: chip-damage 0.08 × duanduan.dmg + `shock` tag (0.25s stun)
- MUST NOT retrigger on same enemy within 0.4s per segment
- Trail segment cap 40 (oldest expires first)

**Effect** → movement is terrain-painting. Route planning around enemy spawns.

**VFX phases**
- 准备: duanduan sparks faintly between paws (constant)
- 触发: trail segments laid, visible pulsing yellow arcs
- 消散: segment expires → fades over 0.3s

**De-dup vs 雪袜 (P2)**: duanduan trail HURTS enemies. 雪袜 trail HELPS allies. Explicit inverse.

**Code hook** battle.js `update()` after position change → `emit('onMove', ...)`. Trait appends to `cat._duanduanTrail[]`, prunes old, checks enemy intersections each tick.

**Form sensitivity** base only.

---

## 11. 云朵 (yunduo) · 羁绊丝线 · 光 support

**Trigger** `onHealResolved` — yunduo's heal hits an ally (not self).

**Numbers**
- Mark healed ally `_yunduoLinked = yunduo.uid` (expires 4s after last heal)
- Yunduo's NEXT heal: 25% also goes to linked ally within 300u
- MUST NOT recursively trigger (relay heal has `_isDerived: true`)
- MUST NOT spread from one yunduo to another yunduo (species guard)
- Link limit: 2 simultaneous linked allies

**Effect** → single-heal becomes cone-heal via long-tail links. Rewards squad spread but near yunduo.

**VFX phases**
- 准备: linked allies have faint light-thread tether to yunduo
- 触发: next heal → thread PULSES, 25% flows along thread
- 消散: 4s after last heal → thread fades

**De-dup vs 绒绒**: yunduo transfers PART of heal via links. 绒绒 converts OVERHEAL to armor on target. Different axis.

**Code hook** battle.js `applyHeal()` → `emit('onHealResolved', {cat, target, amount, isDerived})`. Trait sets `target._yunduoLinked`; next heal spawns `applyHeal(..., {_isDerived:true})` to linked allies.

**Form sensitivity** base + 梦境治愈者 (50% spread); 云海庇护者 replaces (link → barrier).

---

## 12. 绒绒 (bosi) · 柔光护甲 · 光 support

**Trigger** `onHealResolved` — heal that would overflow target's maxhp (heal > maxhp - current).

**Numbers**
- Compute overflow: `overflow = heal_amount - (target.maxhp - target.hp)` before clamping
- Convert: `target.armor += overflow * 0.6`
- Armor decays 10%/sec OR absorbs next hit
- Cap `target.armor` at 25% maxhp
- Armor-tick is NOT an onHealResolved emit (prevents recursion)

**Effect** → wasted heals have value. Pop big heals even on near-full allies if enemy ult incoming.

**VFX phases**
- 准备: overheal detected → golden ripple on target
- 触发: armor active → soft golden shell, intensity ∝ armor/maxhp
- 消散: armor → 0 → shell shatters with chime

**De-dup vs 云朵**: see §11.

**Code hook** battle.js `applyHeal()` after clamp → compute overflow → `emit('onHealResolved', ...)` with overflow value. Trait adds to `target.armor`. Incoming damage reads `target.armor` before `target.hp`.

**Form sensitivity** base only.

---

## Per-cat de-dup matrix (P1 only)

| Pair | Risk | Mitigation (sim assertion) |
|---|---|---|
| 汤圆 vs 团团 | both "take hit → fire back" | storage-then-heavy vs shield-break-ring-INSTANT |
| 杏仁 vs 桃桃 | charge mechanic | move vs stand inverse |
| 奥利奥 vs 幽幽 (P2) | both echo | dash-midpoint vs attack-original |
| 圈圈 vs 奶糖 (P2) | field control | point-pull vs radial-pull |
| 跳跳 vs 雪袜 (P2) | trail | enemy-hurt vs ally-help |
| 云朵 vs 绒绒 | buff-heal | link-spread vs overheal-armor |
| 蓝莓 vs 焰焰 (P2) | element consume | own-stacks vs ANY burn |

**Must-pass before P2**: run `check-cat-bond-combat-matrix` with each P1 cat as active fighter and confirm:
- No two cats produce identical DPS curves vs same enemy
- No infinite-loop runtime (team fight > 10s with no new damage event)
- Each cat's trait fires at least 1× in a 20s fight

---

## Code hook summary (what battle.js emits)

| Event | Site | Cats |
|---|---|---|
| `onDamageTaken` | hurtFighter() after dmg applied | 汤圆 |
| `onShieldBreak` | applyShieldHit() when hp→0 by hit (NOT expiry) | 团团 |
| `onStatusApplied` | applyStatusTag() after new tag added | 蓝莓 |
| `onMove` | update() after f.x/f.y change | 杏仁, 跳跳 |
| `onStationary` | update() while cat not moving | 桃桃 |
| `onDetectionLost` | enemy updateAI() after aiTarget write (poll-based) | 墨球 |
| `onDashCompleted` | endDash() / endPounce() | 奥利奥 |
| `onFieldTick` | fieldTick() damage emit | 圈圈 |
| `onHealResolved` | applyHeal() after clamp, with overflow | 云朵, 绒绒 |

**Infra PR creates all 9 emits as inert calls (no listeners yet).** 12-cat PR
hands each cat a `TRAITS` entry that subscribes.

**Persistent trait (松松)** uses no emit — applied at `makeCat()` time.

---

## Numbers to tune in sim (owner review before P1 ships)

| Cat | Starting | Likely range |
|---|---|---|
| 汤圆 store% | 25% | 15-35% |
| 汤圆 cap% | 60% maxhp | 40-80% |
| 团团 freeze | 1.2s | 0.8-1.6s |
| 团团 ICD | 8s | 5-12s |
| 蓝莓 per-stack | +30% dmg | +20-40% |
| 蓝莓 max stacks | 5 | 3-6 |
| 松松 heavy mult | ×1.25 | ×1.15-1.35 |
| 松松 speed mult | ×0.85 | ×0.80-0.90 |
| 杏仁 distance | 200u | 150-300u |
| 杏仁 bonus | +40% | +30-50% |
| 桃桃 charge time | 1.5-3s | 1-4s |
| 桃桃 bonus | +30% | +20-40% |
| 墨球 detect timeout | 1.5s | 1-2s |
| 墨球 distance | 180u | 150-250u |
| 墨球 bonus | +85% | +60-100% |
| 奥利奥 echo % | 50% | 40-60% |
| 奥利奥 ICD | 3s | 2-5s |
| 圈圈 pull speed | 60u/s | 40-80u/s |
| 跳跳 chip | 8% | 5-12% |
| 跳跳 shock | 0.25s | 0.15-0.4s |
| 云朵 spread % | 25% | 20-35% |
| 云朵 range | 300u | 200-400u |
| 绒绒 conversion | 0.6 | 0.5-0.7 |
| 绒绒 cap | 25% maxhp | 20-30% |

---

## P1 owner-review gate

Before shipping the 12-cat PR:

1. **Numbers above** — accept starting values, or pick different in-range?
2. **汤圆 cap at 60% maxhp** — too much? 40%? 80%?
3. **团团 vs bosses** — use V4's "50% slow + 20% poise削减" override, or let full freeze apply?
4. **奥利奥 _isDerived flag** — does echo attack count for combo chain? (y/n)
5. **云朵 2-link cap** — ok, or raise to 3 (whole team)?
6. **绒绒 cap at 25% maxhp** — ok, or lower (10%)?

---

## What this doc is NOT
- NOT the 21 P2 cats. Sibling doc before P2 ships.
- NOT the infra PR. That's `traits.js` file create + emit-sites-only.
- NOT final numbers. Sim must confirm before ship.