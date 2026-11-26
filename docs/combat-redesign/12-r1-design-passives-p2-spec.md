# R1 Task D (P2) — 21-cat passive full spec

**Status (2026-11-25):** Companion to `11-r1-design-passives-p1-spec.md`.
P1 covers 12 reference cats; this spec is the remaining 21 to fully populate
V4's 33-passive system. Same 7-field shape per cat.

**Balance numbers are my (agent) calls** — owner delegated balance
2026-11-25. Flagged only when a number sits outside V4's implicit range.

**Event coverage added by P2 (over P1's 11 events):**
`onSkillCast`, `onBeforeDamage`, `onTargetKilled`, `onFieldExpired`, `onCleanse`, `onResourceGained`.

**Recursion guards added by P2 (over P1's 5):**
- 幽幽 echo-of-echo (attack echo mustn't re-echo)
- 圆宝 damage ping-pong (圆宝 A redirecting to 圆宝 B)
- 金豆 charge-cycle (金豆 A sharing to 金豆 B)

---

## Index

| # | 猫 | id | element | role | passive | event |
|---|---|---|---|---|---|---|
| 1 | 奶酥 | nietu | 草 | tank | 扎根 | `onStationary` + stance |
| 2 | 圆宝 | jiafei | 火 | tank | 同甘共苦 | `onBeforeDamage` (ally redirect) |
| 3 | 芝士 | qisi | 火 | fighter | 越战越勇 | `onHitResolved` + streak |
| 4 | 焰焰 | jinwu | 火 | fighter | 燃尽 | `onStatusApplied` (consume burn) |
| 5 | 枫枫 | nuowei | 草 | fighter | 领地意识 | `onFieldTick` (self-field buff) |
| 6 | 绅绅 | lixiao | 暗 | fighter | 决斗节奏 | `onSkillCast` + timing window |
| 7 | 花花 | sanhua | 光 | fighter | 流光连舞 | `onSkillCast` + alternation |
| 8 | 小雾 | xiaohui | 水 | DPS | 水流共鸣 | `onHitResolved` (soak targets) |
| 9 | 露露 | xianluo | 电 | DPS | 声波共振 | `onHitResolved` + same-target |
| 10 | 幽幽 | youling | 暗 | DPS | 暗影回响 | `onHitResolved` + delayed |
| 11 | 月月 | yuelian | 光 | DPS | 月华焦距 | `onHitResolved` + distance |
| 12 | 豆豆 | doudou | 草 | assassin | 林间伏击 | `onHitResolved` + angle |
| 13 | 斑斑 | baomao | 暗 | assassin | 狩猎本能 | `onTargetKilled` (marked) |
| 14 | 星星 | xingchen | 暗 | assassin | 星界裂隙 | `onMove` + rift |
| 15 | 奶糖 | fanmao | 水 | control | 潮汐牵引 | `onFieldTick` (water pull) |
| 16 | 夜夜 | mengmai | 暗 | control | 寂静压制 | `onHitResolved` (suppress) |
| 17 | 樱桃 | yinghua | 光 | control | 落樱余韵 | `onFieldExpired` |
| 18 | 雪袜 | xuewa | 水 | support | 踏浪之路 | `onMove` + ally trail |
| 19 | 布丁 | zherdd | 草 | support | 安宁之庭 | `onStationary` + aura |
| 20 | 金豆 | jinjc | 电 ⚠ | support | 电力共享 | `onResourceGained` + share |
| 21 | 雪团 | nainai | 光 | support | 净化庇护 | `onCleanse` + protect |

⚠ 金豆 element migration light → elec (locked in 10-doc §8 Q1).

---

## 1. 奶酥 (nietu) · 扎根 · 草 tank

**Trigger** `onStationary` — not moved > 1.5s.

**Numbers**
- Standing ramp: `_rootT` ticks up when `|dx|+|dy|<ε`
- At `_rootT >= 1.5s`: +20% damage reduction + immune to stagger
- At `_rootT >= 3s`: ramp to +35% DR, still immune
- Reset to 0 on any movement
- Decay smooth over 0.5s on move (soft exit)

**Effect** → position-anchor tank. Moving loses ramp, standing is safe.

**VFX** 准备: roots emerge from paws / 触发: full root armor visible / 消散: roots retract over 0.5s on move

**De-dup vs 松松** (persistent) and 布丁 (P2 §19, stationary ally aura): nietu buffs SELF defensively. 松松 is permanent stats. 布丁 heals ALLIES.

**Code hook** `update()` tick — reuse 桃桃's `onStationary` emit.

**Form** base only.

---

## 2. 圆宝 (jiafei) · 同甘共苦 · 火 tank

**Trigger** `onBeforeDamage` — ally takes damage, 圆宝 is within 220u.

**Numbers**
- Redirect 30% of ally's incoming damage to 圆宝
- MUST NOT redirect to another 圆宝 (species-check guard — prevents infinite ping-pong)
- MUST NOT redirect self-damage sources (DoT, self-stagger)
- No ICD — always active while in range

**Effect** → protective frontline. Tank absorbs, team survives.

**VFX** 准备: red-gold link thread visible to allies / 触发: thread pulses on redirect, damage flies to 圆宝 / 消散: ally out of range → thread fades

**De-dup vs 云朵**: 圆宝 redirects DAMAGE in; 云朵 spreads HEAL out.

**Code hook** new `onBeforeDamage` emit in `hurtFighter()` BEFORE dmg applied; trait can modify incoming via `event.redirect = {to: jiafeiCat, amount: dmg*0.3}`.

**Form** base + both forms.

---

## 3. 芝士 (qisi) · 越战越勇 · 火 fighter

**Trigger** `onHitResolved` — qisi lands a MELEE hit (not projectile).

**Numbers**
- `cat._qisiStreak += 1` per melee hit, reset to 0 if 3s pass without melee
- Each streak point = +4% melee damage (cap at 10 streaks → +40%)
- Decay: lose 1 stack per 1s of no-melee after 3s grace

**Effect** → sustained in-close combat. Walking away loses ramp.

**VFX** 准备: fur crackles with heat ∝ streak / 触发: hit → ember trail per strike / 消散: 3s no-melee → streak fades

**De-dup vs 露露**: qisi any melee; 露露 same-target projectile.

**Code hook** `onHitResolved` with `skill.kind === 'melee'` check.

**Form** base only.

---

## 4. 焰焰 (jinwu) · 燃尽 · 火 fighter

**Trigger** `onHitResolved` — jinwu lands a `heavy` hit on an enemy carrying `burn` tag (from ANY source — including DoT, teammate's burn, etc).

**Numbers**
- Consume the burn tag
- Convert remaining DoT ticks into instant burst damage × 2.2
- No ICD; self-gated by burn availability

**Effect** → DoT setup → burst finisher. Jinwu doesn't apply burn well; team or enemy stacks it.

**VFX** 准备: enemy burn tag visibly intensifies when jinwu near / 触发: heavy hit → burn implodes, crimson nova / 消散: burn tag gone

**De-dup vs 蓝莓**: 蓝莓 uses OWN-applied chill/soak. 焰焰 uses ANY-source burn.

**Code hook** `onHitResolved` + `sk.heavy === true` + `target.tags.includes('burn')`. Remaining-DoT math reads target's burn-ttl + burn-dps.

**Form** base only.

---

## 5. 枫枫 (nuowei) · 领地意识 · 草 fighter

**Trigger** `onFieldTick` — nuowei is INSIDE their own (or ally's) grass field.

**Numbers**
- While inside: +18% dmg, +12% move speed, +20% poise regen
- Steps outside: 2s grace, then fades over 1s

**Effect** → encourages setup → fight → setup rhythm.

**VFX** 准备: field cast / 触发: nuowei inside → leafy aura / 消散: leaves aura

**De-dup vs 奶酥**: nuowei needs FIELD (ally-dependent OR self-cast setup). 奶酥 needs STILLNESS (anywhere).

**Code hook** `onFieldTick` emit when grass-element field ticks; check if nuowei is within field radius.

**Form** base only.

---

## 6. 绅绅 (lixiao) · 决斗节奏 · 暗 fighter

**Trigger** `onSkillCast` — lixiao casts a skill within 0.8-1.4s window since last skill.

**Numbers**
- If within window → `_lixiaoRhythm += 1` (cap 3)
- If outside window (either too fast <0.8s OR too slow >1.4s) → reset to 0
- Each rhythm point adds +12% dmg to next skill hit (cap +36% at 3)
- Consumed on next skill lands

**Effect** → human-timing play. Punishes spam AND dithering.

**VFX** 准备: shadow blade flickers when timing tight / 触发: perfect rhythm hit → X-slash pattern / 消散: miss window → blade resets

**De-dup vs 花花**: lixiao = TIMING (any skill). 花花 = ALTERNATION (different skills).

**Code hook** new `onSkillCast` emit in `castOffensiveSkill/castSupportSkill`.

**Form** base only.

---

## 7. 花花 (sanhua) · 流光连舞 · 光 fighter

**Trigger** `onSkillCast` — sanhua casts a DIFFERENT skill id than previous.

**Numbers**
- Track `cat._lastSkillId`
- If current skill.id !== _lastSkillId → `_sanhuaCombo += 1` (cap 4)
- If same → reset to 0
- Each combo point: +15% dmg (cap +60% at 4 different skills chained)

**Effect** → punishes Q-Q-Q-Q, rewards Q-E-R-dodge-Q.

**VFX** 准备: light ribbons trail between recent skill positions / 触发: new-skill hit → ribbons connect in crossing / 消散: same-skill reset → ribbons fade

**De-dup vs 绅绅**: 花花 doesn't care about timing, cares about VARIETY.

**Code hook** `onSkillCast` + id comparison.

**Form** base only.

---

## 8. 小雾 (xiaohui) · 水流共鸣 · 水 DPS

**Trigger** `onHitResolved` — xiaohui's hit lands on an enemy with `soak` tag.

**Numbers**
- Spawn secondary water projectile from hit point at 40% damage
- Secondary proj homes to nearest live enemy within 240u
- MUST flag as `_isDerived: true` (no double trait)
- ICD 1.2s per target

**Effect** → wet-and-weep playstyle. Setup via other water skills.

**VFX** 准备: soaked enemies drip visibly when xiaohui near / 触发: hit → water jet splashes outward / 消散: secondary lands or lifetime expires

**De-dup vs 蓝莓**: 蓝莓 own-stacks to heavy detonate. xiaohui ANY-source soak to proj spawn.

**Code hook** `onHitResolved` + `target.tags.includes('soak')`. Spawns derived projectile via existing `spawnProj`.

**Form** base only.

---

## 9. 露露 (xianluo) · 声波共振 · 电 DPS

**Trigger** `onHitResolved` — xianluo hits SAME target as previous attack.

**Numbers**
- Track `cat._lastTargetId` and `_resonance`
- Same target → `_resonance += 1` (cap 6), different → reset to 0
- Each resonance point: +8% dmg to that target (cap +48%)
- Decay: if 2.5s no hit on target → _resonance halves

**Effect** → single-target lockdown. Rewards focus on one enemy (boss cat).

**VFX** 准备: sound waves pulse around target ∝ resonance / 触发: resonance hit → sharper waves / 消散: target switch → waves fade

**De-dup vs 芝士**: both streak. 芝士 any melee; 露露 same-target ranged.

**Code hook** `onHitResolved` + target id comparison.

**Form** base only.

---

## 10. 幽幽 (youling) · 暗影回响 · 暗 DPS

**Trigger** `onHitResolved` — youling's ranged projectile lands (not melee).

**Numbers**
- 1.1s delay, then spawn shadow-echo attack at ORIGINAL target position at 40% dmg
- Target enemy if still alive and within 90u of original position
- MUST NOT echo an echo (`_isDerived: true` flag on the echo projectile)
- ICD 2.5s per target

**Effect** → predict-the-position play. Opening a window where enemy moves between origin and echo lands.

**VFX** 准备: original hit leaves purple spiral lingering / 触发: 1.1s later → spiral snaps into shadow copy of attack / 消散: echo lands or expires

**De-dup vs 奥利奥**: 幽幽 after ATTACK, from original position. 奥利奥 after DASH, from midpoint.

**Code hook** `onHitResolved` + ranged; schedule `_derivedHit` 1.1s later.

**Form** base only.

---

## 11. 月月 (yuelian) · 月华焦距 · 光 DPS

**Trigger** `onHitResolved` — yuelian's ranged attack on enemy within optimal-distance band.

**Numbers**
- Optimal band: 160-240u from yuelian to target at cast time
- Within band: +35% damage
- Outside band: no bonus (NOT penalized — "distance=further=better" wrong)

**Effect** → precision-distance play, not raw range. Encourages staying at 'sniper' distance.

**VFX** 准备: moonlight corona pulse around yuelian ∝ nearest-enemy distance match / 触发: optimal hit → moon-blade visibly sharper / 消散: nothing (band-check per cast)

**De-dup vs other DPS**: only distance-gated.

**Code hook** `onHitResolved` + distance-check at cast time.

**Form** base only.

---

## 12. 豆豆 (doudou) · 林间伏击 · 草 assassin

**Trigger** `onHitResolved` — doudou melee hit from enemy's back arc (behind 120° cone).

**Numbers**
- Back arc: enemy's facing direction ± 60°, enemy OPPOSITE 60° (behind) = backstab zone
- Backstab hit: +70% dmg, applies `expose` tag (3s, incoming dmg +15%)

**Effect** → positional play. Different from moqiu (which needs stealth).

**VFX** 准备: back-arc shimmer visible when doudou flanked / 触发: backstab → leaf-slash cascade / 消散: expose tag timer visible on enemy

**De-dup vs 墨球**: doudou ANGLE. 墨球 STEALTH.

**Code hook** `onHitResolved` + melee + angle check against `enemy.facing`.

**Form** base only.

---

## 13. 斑斑 (baomao) · 狩猎本能 · 暗 assassin

**Trigger** `onTargetKilled` — baomao gets final hit on a marked enemy.

**Numbers**
- Mark: baomao's first hit on any enemy applies `hunterMark` tag (5s decay)
- Kill marked enemy: baomao gets +25% move speed and -30% all CDs for 3s
- Buff extends by 2s per additional marked kill in the window (chain hunt)

**Effect** → kill-chain assassin. Target selection = strategy.

**VFX** 准备: marked enemies have crosshair glyph above them / 触发: kill → red mist burst + baomao sprint-ready glow / 消散: buff expires → glow fades

**De-dup**: 斑斑 is the only kill-chain cat.

**Code hook** new `onTargetKilled` emit in `hurtEnemy()` when `e.hp<=0` from baomao.

**Form** base only.

---

## 14. 星星 (xingchen) · 星界裂隙 · 暗 assassin

**Trigger** `onMove` — xingchen moves > 60u since last rift.

**Numbers**
- Leave a star-rift at every 60u traveled, lifetime 2.5s
- Max 5 active rifts (oldest expires)
- Attacking THROUGH a rift: +50% dmg, enemy gets `expose` tag (3s)
- Rift is consumed on first attack-through

**Effect** → path-painting play. Creates attack windows via movement.

**VFX** 准备: rifts visible as purple spatial tears / 触发: attack through → galaxy-slash animation / 消散: rift consumed or expires

**De-dup vs 跳跳**: xingchen rifts GRANT attack windows. 跳跳 trail CCs enemies.

**Code hook** `onMove` distance tally. New `_xingchenRifts[]` array. Attack line-segment check against rift positions.

**Form** base only.

---

## 15. 奶糖 (fanmao) · 潮汐牵引 · 水 control

**Trigger** `onFieldTick` — fanmao's water field ticks.

**Numbers**
- Each tick, each enemy in field: rotate 15° around field center (orbital motion)
- Total orbit over field lifetime: slow swirl
- Additionally pull enemies at edge toward 30% radius (gentle inward)

**Effect** → enemies swirl inside water field (not linear pull like 圈圈).

**VFX** 准备: water field cast with visible orbital guides / 触发: tick → enemies drift rotationally / 消散: field expires → ripples dissipate

**De-dup vs 圈圈**: 奶糖 rotational. 圈圈 point-pull.

**Code hook** `onFieldTick` for water-element fields.

**Form** base only.

---

## 16. 夜夜 (mengmai) · 寂静压制 · 暗 control

**Trigger** `onHitResolved` — mengmai hits an enemy that has attacked within last 2s.

**Numbers**
- Apply `suppress` tag (new tag type): reduces enemy attack frequency by 40%, duration 3s
- Max 1 suppress per enemy (not stacking)
- ICD 1s per target

**Effect** → targets high-attack-frequency enemies (shooters, brawlers). Peel control.

**VFX** 准备: shadow coils form around aggressing enemy / 触发: hit → coils cinch, enemy animation slows / 消散: suppress tag expires

**De-dup vs other controls**: targeted suppress, not AOE.

**Code hook** `onHitResolved`. Enemy tracks `_lastAttackT`; mengmai's hit checks recency.

**Form** base only.

---

## 17. 樱桃 (yinghua) · 落樱余韵 · 光 control

**Trigger** `onFieldExpired` — yinghua's light-element field (glareField) ends naturally.

**Numbers**
- On expiry: burst outward with slow-cone wave, radius 160u
- Enemies hit: `_yinghuaSlow = 0.6` for 2s (40% move slow)
- Yinghua gains +30% next-skill-dmg buff for 3s (natural setup)

**Effect** → punishes AT field end, not during. Opens next cycle.

**VFX** 准备: field cast as normal / 触发: expire → petals scatter radially, enemies caught in slow motion / 消散: slow tag expires on each enemy

**De-dup**: only field-expiry cat.

**Code hook** new `onFieldExpired` emit when field's lifetime < 0 (BEFORE removal).

**Form** base only.

---

## 18. 雪袜 (xuewa) · 踏浪之路 · 水 support

**Trigger** `onMove` — xuewa moves > 15u/frame.

**Numbers**
- Leave trail segment (x1,y1,x2,y2) for 2s
- Ally crossing trail: +15% move speed for 1s, +4 ult meter one-time (ICD 0.8s per ally)
- Trail segment cap 50

**Effect** → movement is SUPPORT. Inverse of 跳跳.

**VFX** 准备: xuewa's paws leave soft water paw-prints / 触发: ally crosses → glow follows ally for 1s / 消散: trail fades

**De-dup vs 跳跳**: xuewa HELPS allies. 跳跳 HURTS enemies.

**Code hook** `onMove` for xuewa. Trait appends to `_xuewaTrail[]`. Ally-intersection check per tick.

**Form** base only.

---

## 19. 布丁 (zherdd) · 安宁之庭 · 草 support

**Trigger** `onStationary` — zherdd not moved > 1.5s.

**Numbers**
- At 1.5s still: emit 160u radius regen aura
- Aura ticks: +3% maxhp/s to allies within (self included)
- Cap aura duration 6s (even if standing longer, decays to allow re-trigger)
- Move = immediate aura off

**Effect** → anchor-healer. Different from 奶酥 (self DR) by target (allies not self).

**VFX** 准备: zherdd standing → soft grass tile grows under / 触发: aura active → green ripples pulse / 消散: move → grass retracts

**De-dup vs 奶酥**: 奶酥 self DR. 布丁 ally regen.

**Code hook** `onStationary`. Aura tick timer 0.5s intervals during aura.

**Form** base only.

---

## 20. 金豆 (jinjc) · 电力共享 · 电 support ⚠

**Trigger** `onResourceGained` — jinjc's ult meter ticks up (any source).

**Numbers**
- 20% of jinjc's incoming ult meter also goes to lowest-ult ally (not self)
- MUST NOT share to another 金豆 (species-check guard)
- ICD 1s per receiver ally (prevents swarm compound)
- Hard ICD 4s on the "share" event itself

**Effect** → energy-cheerleader. Enables team ult cadence.

**VFX** 准备: jinjc → ally gold-arc thread when ally low-ult / 触发: thread pulses on share, ally gets +N ult pop / 消散: ally ult full → thread detaches

**De-dup**: only energy-share cat.

**Code hook** new `onResourceGained` emit in `gainUlt()` for jinjc specifically; could be filtered trait-side. Jinjc element now `elec` (10-doc §8 Q1 decision).

**Form** base only. Save-migration: ensureLoadout strips light-only skills from jinjc's loadout per 10-doc.

---

## 21. 雪团 (nainai) · 净化庇护 · 光 support

**Trigger** `onCleanse` — nainai's cleanse effect removes a debuff from an ally.

**Numbers**
- Cleansed ally gains `protectShield` buff: next incoming hit reduced by 50%, duration 2.5s (or until consumed)
- MUST NOT stack (one protect at a time per ally)
- ICD none (self-gated by cleanse availability)

**Effect** → reactive save. Cleanse is defensive, protect is reactive.

**VFX** 准备: nainai's cleanse animation / 触发: cleanse completes → golden shell wraps target briefly / 消散: shell absorbs hit or expires

**De-dup vs 绒绒**: 绒绒 PRE-emptive via overheal. 雪团 REACTIVE post-cleanse.

**Code hook** new `onCleanse` emit in `applyHeal()` path when `canCleanse` branch resolves.

**Form** base only.

---

## Per-cat de-dup matrix (P1+P2 combined, exhaustive)

| Pair | Risk | Mitigation |
|---|---|---|
| 奶酥 vs 布丁 (P2) | both onStationary | 奶酥 self-DR, 布丁 ally-regen |
| 奶酥 vs 松松 (P1) | both static-defense | 奶酥 event, 松松 persistent |
| 圆宝 vs 云朵 (P1) | both relay | 圆宝 damage-IN, 云朵 heal-OUT |
| 芝士 vs 露露 (P2) | both streak | 芝士 any-melee, 露露 same-target-ranged |
| 焰焰 vs 蓝莓 (P1) | element consume | 焰焰 ANY-source burn, 蓝莓 OWN-applied stacks |
| 绅绅 vs 花花 (P2) | onSkillCast | 绅绅 timing, 花花 variety |
| 幽幽 vs 奥利奥 (P1) | echo | 幽幽 post-attack-original, 奥利奥 post-dash-midpoint |
| 豆豆 vs 墨球 (P1) | assassin | 豆豆 angle, 墨球 stealth |
| 奶糖 vs 圈圈 (P1) | water-field | 奶糖 rotational, 圈圈 point-pull |
| 雪袜 vs 跳跳 (P1) | onMove-trail | 雪袜 ally-help, 跳跳 enemy-hurt |
| 星星 vs 跳跳 (P1) | onMove-trail | 星星 attack-window, 跳跳 CC |
| 雪团 vs 绒绒 (P1) | support-react | 雪团 cleanse-reactive, 绒绒 overheal-preempt |

**Must-pass before 33-cat PR (P2) ships**: same sim assertions as P1 but
expanded — every P1 + P2 cat (33 total) produces distinct DPS/behavior
signature vs the same enemy. No infinite loops. Every trait fires ≥1× per
20s fight.

---

## Code hook summary (what battle.js emits — P1+P2 combined)

| Event | Site | P1 Cats | P2 Cats |
|---|---|---|---|
| `onDamageTaken` | hurtFighter() after dmg | 汤圆 | — |
| `onShieldBreak` | applyShieldHit() | 团团 | — |
| `onStatusApplied` | applyStatusTag() | 蓝莓 | 焰焰 (burn consume) |
| `onMove` | update() position Δ | 杏仁, 跳跳 | 星星, 雪袜 |
| `onStationary` | update() stillness | 桃桃 | 奶酥, 布丁 |
| `onDetectionLost` | enemy updateAI() poll | 墨球 | — |
| `onDashCompleted` | endDash() | 奥利奥 | — |
| `onFieldTick` | fieldTick() | 圈圈 | 枫枫, 奶糖 |
| `onHealResolved` | applyHeal() | 云朵, 绒绒 | — |
| `onSkillCast` | castOffensiveSkill/Support | — | 绅绅, 花花 |
| `onHitResolved` | resolveHit() after dmg | — | 芝士, 小雾, 露露, 幽幽, 月月, 豆豆, 夜夜 |
| `onBeforeDamage` | hurtFighter() BEFORE dmg | — | 圆宝 |
| `onTargetKilled` | hurtEnemy() when hp<=0 | — | 斑斑 |
| `onFieldExpired` | field lifetime cleanup | — | 樱桃 |
| `onCleanse` | applyHeal() cleanse branch | — | 雪团 |
| `onResourceGained` | gainUlt() | — | 金豆 |

**15 total emit points.** Infra PR creates all 15 as inert.

---

## Starting numbers (P2 — balance targets I picked)

| Cat | Key number |
|---|---|
| 奶酥 | 1.5s to +20% DR, 3s to +35% |
| 圆宝 | 30% redirect, 220u range |
| 芝士 | +4%/stack, cap 10 (+40%) |
| 焰焰 | burst mult × 2.2 |
| 枫枫 | +18% dmg in field |
| 绅绅 | window 0.8-1.4s, cap 3 (+36%) |
| 花花 | +15%/alt, cap 4 (+60%) |
| 小雾 | derived proj 40% dmg, 1.2s ICD |
| 露露 | +8%/resonance, cap 6 (+48%) |
| 幽幽 | 1.1s echo delay, 40% dmg |
| 月月 | optimal band 160-240u, +35% |
| 豆豆 | backstab +70%, expose 3s |
| 斑斑 | kill → +25% speed, -30% CD, 3s + chain |
| 星星 | rift per 60u, max 5, +50% dmg through |
| 奶糖 | 15°/tick rotation |
| 夜夜 | suppress -40% atk freq, 3s |
| 樱桃 | field-expire slow 40% in 160u, 2s |
| 雪袜 | ally +15% speed, +4 ult (0.8s ICD/ally) |
| 布丁 | aura radius 160u, +3% maxhp/s, cap 6s |
| 金豆 | share 20% ult, ICD 1s/receiver + 4s global |
| 雪团 | cleanse → 50% DR shield, 2.5s |

---

## What this doc is NOT

- NOT the infra PR. That creates `traits.js` + 15 inert emits.
- NOT final — Round 2 adversarial review will attack it.
- NOT final numbers — in-sim tuning required before ship.
