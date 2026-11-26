# V4 Audit Checklist — brutally honest cross-reference

**Status:** 2026-11-25 cold read of the V4 proposal archive (10/11/12 docs +
BALANCE-BRIEF) against the live `public/cat-bond/js/` code.

**Refreshed:** 2026-11-26 after crescent + merge cycle. Rows closed this pass:
A1, A2, B1–B5, C1, C2, C4, G1 (via C1). Two NEW rows added for post-V4 authored
additions (N1 shadowTendrils, N2 arcanePulse → umbralBarrage rework).

**Legend for "Current code state":**
- **DONE** — V4 item present in code, matches spec, non-stub
- **PARTIAL** — present but spec-divergent, bugged, stub, or narrower than spec
- **MISSING** — not in code
- **WRONGLY-ADDED** — in code but V4 says delete / reshape
- **CONTRADICTS** — code does the OPPOSITE of V4

**TL;DR (as of 2026-11-26 refresh):** the stop-the-line wiring bugs A1 + A2
are now fixed — traits dispatch correctly and field-reading traits land in
the field. 金豆 element migration (C1/C2/C4) and the full purrNova delete
(B1–B5) are also shipped. **Still open:** emit sites A3/A4/A5/A6/A7/A11 are
missing (so ≥5 traits remain stubs and multi-hit skills re-fire traits),
~7 trait flags are never consumed by battle.js (D4/D13/D17/D25/D28/D29/D30),
form awakening is 0/14, and the trait VFX layer (I4) is unbuilt.

---

## Section A — STOP-THE-LINE infra bugs (hidden regressions)

| # | V4 item | Type | State | file:line | Owner-action |
|---|---------|------|-------|-----------|--------------|
| A1 | §10 §5.3 "Event bus: dispatch to subject cat whose passive could fire" | other | **DONE** (commit `4cd7f93e`, 2026-11-26) — `traitForCat` now accepts both shapes: `cat.species \|\| cat.cat?.species`. Traits can now fire. | `traits.js:58-64` | — |
| A2 | §10 §5.3 fields spec: `onFieldTick` ctx reads `fld.cx, fld.cy` | other | **DONE** (commit `4cd7f93e`, 2026-11-26) — all 4 `fld.cx`/`fld.cy` reads renamed to `fld.x`/`fld.y` in traits.js. Field-reading traits now land in-field. | `traits.js:372, 544, 763, 806` | — |
| A3 | §10 §5.3 Shield-break emit site in `applyShieldHit()` on hp→0 by hit (NOT expiry) | other | **PARTIAL** — no shield-break emit exists. Trait polls `onTick` for `(protectT>0||wardT>0)` transitions. **Can't distinguish `broken-by-hit` from `natural expiry`** — V4 explicitly bans firing on natural expiry. Will cheese freeze every time a shield times out. | `traits.js:152-181`; `battle.js` (no applyShieldHit function exists) | Add a real emit at the depletion site; pin `shield._triggerFired`. |
| A4 | §12 (P2) `onStatusApplied` emit site | other | **MISSING** — emit absent in battle.js. 蓝莓/焰焰 depend on an `onStatusApplied` path that doesn't exist; traits.js wires them to `onHitResolved` with a hack that checks `skill.appliesTag`, so they run but at the wrong moment (on the applying HIT, not when the tag is already present). | `traits.js:186-208, 517-531`; battle.js has no `onStatusApplied` emit | Add emit in `applyHitEffects` / `applyEnemyHitEffects` when tag is pushed. |
| A5 | §12 (P2) `onHealResolved` emit site | other | **MISSING** — no emit in battle.js. 云朵 and 绒绒 are **flagged stubs in traits.js itself** ("needs onHealResolved emit site — currently absent; this trait is a stub until that emit lands"). | `traits.js:435-448, 452-467`; search `applyHeal` emit → none | Add emit at each `.hp = Math.min(maxhp, hp + heal)` chokepoint; expose `overflow` for 绒绒. |
| A6 | §12 (P2) `onSkillCast` emit site | other | **MISSING** — 绅绅 决斗节奏 and 花花 流光连舞 depend on timing-since-last-cast. traits.js wires them to `onHitResolved` instead, so timing is measured between HITS not CASTS → rhythm window fires on every hit landing in 0.8–1.4s, triggering for anyone with a basic auto-hit cadence. | `traits.js:555-570, 574-591`; battle.js no `onSkillCast` emit | Add emit in `castOffensiveSkill`/`castSupportSkill` on real cast. |
| A7 | §12 (P2) `onCleanse` emit site | other | **MISSING** — 雪团 净化庇护 trait falls back to `_nainaiActive = true` stub, does nothing. | `traits.js:905-912`; battle.js no cleanse emit | Add emit in the `canCleanse`/`photosynth` branch. |
| A8 | §12 (P2) `onFieldExpired` emit site | other | **MISSING** — 樱桃 落樱余韵 handles its own detection via `onTick` Map diff (traits.js:794-823), not an emit. Works but off-spec and risks pollination with 'yinghuaFields' Map leaking fields across battles if not reset. | `traits.js:794-823`; battle.js no `onFieldExpired` emit | Add emit in `tickFields` cleanup; also audit Map reset. |
| A9 | §10 §5.3 `onDashCompleted` emit site in `endDash/endPounce` | other | **PARTIAL** — polls `onTick` using `c._niuniuPrevDashing` transitions. Works, but misses dashes shorter than one frame. | `traits.js:334-358` | Add direct emit or accept poll. |
| A10 | §10 §5.3 `onDetectionLost` emit site | other | **PARTIAL** — polls `onTick`, scans `e.aiTarget === c` + distance each frame. OK as poll. | `traits.js:299-329` | None needed (poll acceptable). |
| A11 | §10 §5.4 recursion guard: multi-hit skill fires passive ONCE per cast | other | **MISSING** — no `_traitFiredThisCast` flag enforced. A pulseCount:3 skill (tidalPulse/arcanePulse) will fire the attached trait THREE times per cast. 蓝莓/幽幽/芝士/露露 can all compound. | `traits.js` dispatcher lacks per-cast dedup | Add `ctx._castUid` + per-trait `_lastCastUid` guard. |
| A12 | §10 §5.4 recursion guard: self-spawned damage must flag `_isDerived` | other | **PARTIAL** — guard exists in `emit()` (traits.js:71), but trait `effect()` calls `b.hurtEnemy(...)` directly which does NOT emit, so re-entrancy is accidentally safe. If any future hurtEnemy path re-emits onHitResolved, the guard is already by-passed for the self-call bonus damage in qisi/lixiao/sanhua/xianluo/xingchen/youling echo. | `traits.js:242, 274, 307, 344, 511, 526, 566, 586, 601, 624, 649, 668, 685, 711, 730`; `battle.js:6134` | Decide whether trait-damage should route through resolveHit (which emits) and carry `_isDerived`. |

---

## Section B — purrNova (呼噜新星) delete

| # | V4 item | Type | State | file:line | Owner-action |
|---|---------|------|-------|-----------|--------------|
| B1 | §10 purrNova deleted (dup of sunflare) | skill-delete | **DONE** — removed from SKILLS roster (dedup marker comment preserved) | `skills.js:333-335` | None. |
| B2 | purrNova dead refs in ult-vfx.js | skill-delete | **DONE** — `ids` array + `col` + `paint` object no longer include purrNova; function definition deleted. | `ult-vfx.js:10-19, 219-223` | None. (User brief listed this as "still present"; the file was already cleaned up.) |
| B3 | purrNova dead ref in game.js skill-icon map | skill-delete | **DONE** — removed from byId map. | `game.js:1140-1146` | None. |
| B4 | purrNova dead ref in battle.js skill id check | skill-delete | **DONE** — no `skill.id==='purrNova'` branch remains. | `battle.js:3395` only has `moonfang` | None. |
| B5 | purrNova dead ref in i18n.js | skill-delete | **DONE** — both the EN name map entry ("呼噜新星": "Purr Nova") and the gated-skill name line have been removed. | `i18n.js` (grep: 0 matches for 呼噜新星/purrNova) | None. |

**NOTE:** the user's brief states "purrNova is still in skills.js:333, ult-vfx.js, i18n.js, game.js". This appears **stale**. Code grep shows zero live references other than the dedup marker comment at skills.js:333. If a stale CDN cache in `cloudflare-pages/public/` differs, that's a separate publish issue — all `public/cat-bond/js/*` source files are clean.

---

## Section C — 金豆 (jinjc) element migration 光 → 电

| # | V4 item | Type | State | file:line | Owner-action |
|---|---------|------|-------|-----------|--------------|
| C1 | §10 §8 Q1 LOCKED: `SPECIES_ELEMENT[jinjc]: 'light' → 'elec'` | element-change | **DONE** (this cycle, 2026-11-26) — `jinjc: 'elec'` per V4 §8 Q1. | `skills.js:186` | — |
| C2 | §10 §8 Q1 save-migration: `ensureLoadout` strips light-only skills from jinjc loadout once; stamp `State.S._jinjcMigratedAt` | other | **DONE** (this cycle, 2026-11-26) — ensureLoadout gated on `State.S._jinjcMigratedAt`; strips light-element loadout entries ONCE then stamps. Learned[] untouched per §8 Q1. | `skills.js:1075-1093` | — |
| C3 | §12 P2 trait `dianLiGongXiang` (electric share) subscribes `onResourceGained` — but trait fires for ANY cat species=jinjc regardless of element-of-skill | passive | **PARTIAL (stub)** — trait only increments `_jinjcShared` counter; no actual ult share logic. | `traits.js:897-903` | Implement real share to lowest-ult ally; species-guard against another jinjc; 4s hard ICD. |
| C4 | §10 §3.2 element distribution after migration: light 7→6, elec 4→5 | element-change | **DONE** (this cycle, 2026-11-26) — after C1: light=6 (nainai, sanhua, yunduo, yinghua, yuelian, bosi), elec=5 (niuniu, duanduan, xianluo, wumao, jinjc). | `skills.js:168-200` | — |
| C5 | Save-compat: existing jinjc.learned[] keeps old light-only entries as cosmetic inventory bloat | other | **MISSING** — not addressed anywhere. | n/a | OK to no-op per §8 Q1 ("entries stay, non-equippable"), but worth a code comment. |

---

## Section D — 33-cat passive roster (TRAIT_BY_SPECIES coverage)

All 33 species IDs appear in `traits.js registerTrait` calls (verified: 33/33 speciesIds match data.js SPECIES list). **BUT** every trait is dead code due to bug A1. Even once A1 is fixed, several are stubs or spec-divergent.

### D.1 — P1 reference 12 cats

| # | V4 item (cat / passive) | Type | State | file:line | Owner-action |
|---|---|---|---|---|---|
| D1 | 汤圆 `tangyuan` · 炎怒反击 — store 25% dmg, release on next heavy, cap 60% maxhp | passive | **PARTIAL** — storage logic present in `yanNuFanJi`. **BUT**: no consumption branch — nothing in battle.js reads `_emberCharge` when `cometClaw`/pounce fires. No decay-after-3s. No one-shot cap enforcement at release. Entire release half of the spec is missing. | `traits.js:136-147`; `battle.js` grep `_emberCharge` → 0 hits | Add heavy-attack consumption in castOffensiveSkill or hurtEnemy multiplier. |
| D2 | 团团 `dundun` · 碎霜反击 — shield-break → 90u ice burst, 1.2s freeze, 8s ICD; MUST ignore natural expiry; MUST NOT fire twice per shield | passive | **PARTIAL + BUG** — fires on `onTick` transition of `protectT/wardT > 0` to 0. **Can't distinguish `broken-by-hit` from `expired`.** V4 §11 explicitly: "护盾自然消失不触发". Also missing boss override "50% slow + 20% poise削减". | `traits.js:152-181`; (A3) | Depends on A3 fix. Also use `chill` tag + explicit hard-stun duration; battle's chill ttl is 2.2s so `Math.max(chill||0, 1.2)` won't extend if already chilled. Add boss branch. |
| D3 | 蓝莓 `lanbao` · 冰川破击 — chill/soak stacks on enemy, next heavy consumes all for +30%/stack | passive | **PARTIAL** — stacks increment in trait, but field read is `ctx.skill.appliesTag` — skills.js has `appliesTag: 'chill'` only on `frostLance` (gated). lanbao's default waterLash/frostClaw apply `soak`, so stacks only go up via the soak path. Also trait triggers on lanbao's OWN hit, but V4 says "chill/soak application" (any source). Not tagged `_isDerived` on bonus hurtEnemy. | `traits.js:186-208` | Review: V4 §11.3 says "applies chill/soak"; code is fine for own-applied but widen if any-source intended. |
| D4 | 松松 `senlin` · 巨兽之躯 — ×1.25 heavy, ×1.4 poise, ×0.85 speed, sprite 1.4× | passive | **PARTIAL** — stats set in trait once, but **`_heavyBonus` is never read anywhere in battle.js** (grep `_heavyBonus` → 1 hit, trait itself). `poiseMax`/`speed` are set, but after `makeCat()` which already set them → applied correctly ONLY if onTick fires AFTER fighter init. Sprite scale 1.4× missing (cat draw code doesn't read senlin flag). | `traits.js:214-227`; `battle.js` no `_heavyBonus` consumer | Wire heavy multiplier in castOffensiveSkill; wire sprite scale in draw. |
| D5 | 杏仁 `abi` · 疾风燃势 — move 200u → next proj +40% dmg + 1.3× size | passive | **PARTIAL** — distance accumulates correctly. But: bonus is applied as a SECOND hurtEnemy call for +40% of base, NOT as a +40% multiplier on the shot, so combo/element-effectiveness is double-counted on the bonus. Projectile size 1.3× not implemented (projectile object has no size field read at spawn). Charge gates only on `skill.kind==='projectile'`, not elemental; firing non-element projectile consumes charge anyway. | `traits.js:232-259`; `battle.js:1908` spawnProj no size param | Multiply hit damage inline; wire a projectile size override. |
| D6 | 桃桃 `wumao` · 静电蓄能 — stand still 1.5-3s → +30% elec proj dmg, +40% proj speed | passive | **PARTIAL** — same double-hurtEnemy bug as D5 (bonus is a second call). Projectile speed +40% not applied. | `traits.js:263-295` | Same fix as D5 + spawnProj speed scalar. |
| D7 | 墨球 `moqiu` · 暗夜潜伏 — detect-lost 1.5s + >180u → next hit +85% | passive | **PARTIAL** — same double-hurtEnemy bug. Also missing `backstab:1.5` when hit angled from behind; missing alpha-0.5 visual render. | `traits.js:299-329` | Same fix + angle detection + sprite alpha. |
| D8 | 奥利奥 `niuniu` · 雷影追击 — dash finish → next attack within 1.4s echoes at 50%, ICD 3s | passive | **PARTIAL** — echo is a second hurtEnemy call, not a spawned projectile from midpoint. No midpoint storage. No "_isDerived" flag on hurtEnemy call (but hurtEnemy doesn't emit, so moot for now — flagged for A12). | `traits.js:334-358` | Echo should be an actual delayed projectile from midpoint per V4. |
| D9 | 圈圈 `meidu` · 藤蔓漩涡 — grass field pulls enemies to control point 60u/s | passive | **CONTRADICTS (field schema)** — reads `fld.cx/cy` which don't exist; pulls go to (NaN,NaN) or (25,25). (See A2.) | `traits.js:362-386` | Fix A2. |
| D10 | 跳跳 `duanduan` · 电荷轨迹 — movement leaves 1.6s trail, enemies crossing → 8% chip + shock | passive | **DONE** (once A1 fires it). Distance, trail cap, shock tag all implemented. One concern: `hitKey = 'dd' + seg.t` could collide if two segments share the same `b.t` (same frame two moves). | `traits.js:390-431` | Minor hitKey uniqueness tweak; otherwise OK. |
| D11 | 云朵 `yunduo` · 羁绊丝线 — heal links ally, next heal spreads 25% (cap 2 links) | passive | **STUB** — trait self-admits "this trait is a stub until that emit lands". Only sets `_yunduoTraitActive = true`. | `traits.js:437-448`; (A5) | Implement after A5. |
| D12 | 绒绒 `bosi` · 柔光护甲 — overheal × 0.6 → armor, decays 10%/s, cap 25% maxhp | passive | **STUB + WRONGLY-ADDED** — armor DECAY logic runs every onTick, so pre-existing `c.armor` (from skills.js shield stuff) drains at 10% maxhp/s unconditionally for every bosi cat. Overheal-to-armor path missing entirely. Also no damage-absorb branch in hurtMe (armor exists on fighter but nothing reads `f.armor` before `f.hp`). | `traits.js:453-467`; `battle.js` grep `\.armor` → only 1 unrelated hit | Gate decay on `c.armor > 0 && c._bosiTraitActive`; add the overheal path after A5. |

### D.2 — P2 21 cats

| # | V4 item | Type | State | file:line | Owner-action |
|---|---|---|---|---|---|
| D13 | 奶酥 `nietu` · 扎根 — stand 1.5s → +20% DR, 3s → +35% DR | passive | **PARTIAL** — sets `_dmgTakenMult` but **battle.js never reads `_dmgTakenMult`** (grep → 1 hit, trait itself). No immune-to-stagger. Soft-exit decay OK. | `traits.js:474-490` | Consume `_dmgTakenMult` in hurtMe damage math. |
| D14 | 圆宝 `jiafei` · 同甘共苦 — redirect 30% ally dmg to jiafei within 220u | passive | **STUB** — `triggerCondition: () => false`, just sets `_jiafeiActive`. Has subscribedEvent `onBeforeDamage` and battle DOES emit that — but condition always false. | `traits.js:493-499`; `battle.js:6147` emit present | Implement redirect math via `ctx.redirect` object; species-guard. |
| D15 | 芝士 `qisi` · 越战越勇 — melee streak +4%/hit, cap 10 | passive | **PARTIAL** — double-hurtEnemy bug (as D5). Decay ("lose 1 stack per 1s of no-melee after 3s grace") not implemented — stacks only reset on next hit that happens to be the same frame > 3s. | `traits.js:502-514` | Fix damage path + add onTick decay loop. |
| D16 | 焰焰 `jinwu` · 燃尽 — heavy on burning enemy → consume burn, instant ×2.2 burst | passive | **PARTIAL** — fires on `onHitResolved` check. Burn removal OK. But "convert remaining DoT ticks" spec requires reading `target.status.burn` TTL; code just deletes tag and does flat ×2.2. Simpler than spec, probably fine — but V4 says "remaining ticks × 2.2" (scales with remaining duration), code does it flat. | `traits.js:517-531` | Owner decides: flat vs scaled. |
| D17 | 枫枫 `nuowei` · 领地意识 — in own/ally grass field → +18% dmg, +12% speed, +20% poise regen | passive | **PARTIAL** — only +18% damage (via `_dmgOutMult`) is set, but **battle.js never reads `_dmgOutMult`**. Speed + poise regen not applied. Also no 2s grace + 1s fade on step-out (goes binary on/off). | `traits.js:534-551` | Wire _dmgOutMult; add speed/poise; add grace-fade state. |
| D18 | 绅绅 `lixiao` · 决斗节奏 — skill cast within 0.8-1.4s since last → +12%/rhythm, cap 3 | passive | **PARTIAL** — depends on A6 (onSkillCast missing). Currently fires on `onHitResolved`, so "cast interval" is really "hit-landing interval", which breaks for AoE/channel delays and multi-hit pulses. Double-hurtEnemy bug. | `traits.js:554-570` | Fix after A6. |
| D19 | 花花 `sanhua` · 流光连舞 — alternate DIFFERENT skill id → +15%/alt, cap 4 | passive | **PARTIAL** — same `onHitResolved` instead of `onSkillCast` issue (D18 / A6). Logic otherwise matches. | `traits.js:573-591` | Fix after A6. |
| D20 | 小雾 `xiaohui` · 水流共鸣 — hit on soak-tagged enemy → spawn secondary 40% proj homing nearest ≤240u, ICD 1.2s | passive | **PARTIAL** — "spawn secondary" is implemented as a second hurtEnemy on the SAME target, not a homing projectile that could switch targets. VFX ring is drawn, no actual projectile spawn. | `traits.js:594-606` | Call `spawnProj` toward nearest, not hurtEnemy. |
| D21 | 露露 `xianluo` · 声波共振 — same-target hit streak, +8%/resonance, cap 6, 2.5s decay | passive | **PARTIAL** — decay ("if 2.5s no hit → _resonance halves") not implemented (trait only resets on different target, never on timeout). Double-hurtEnemy bug. | `traits.js:609-628` | Add onTick decay. |
| D22 | 幽幽 `youling` · 暗影回响 — ranged hit → 1.1s later echo at original pos, 40% dmg, ICD 2.5s | passive | **PARTIAL** — deferred-hit queue is on `battle._deferredHits` (per-battle state leak if not reset). Echo target is the ORIGINAL target pointer; if dead, spec says "if alive within 90u of original position". Code checks `h.target.alive` only, not position proximity. No `_isDerived` flag on the derived hurtEnemy call. | `traits.js:631-655` | Fix target+position check; ensure reset. |
| D23 | 月月 `yuelian` · 月华焦距 — ranged at 160-240u → +35% dmg | passive | **PARTIAL** — double-hurtEnemy bug. Band values OK. | `traits.js:658-671` | Fix damage path. |
| D24 | 豆豆 `doudou` · 林间伏击 — backstab 120° cone → +70% dmg + expose tag 3s | passive | **PARTIAL + LIKELY-BROKEN** — reads `ctx.target._vy / _vx` to infer enemy facing. Enemies in battle.js do NOT consistently expose `_vx/_vy` (velocities are on `.vx/.vy`). Angle check uses `(facing + Math.PI)` which is "behind the enemy" — but if `_vy/_vx` are undefined, `Math.atan2(0,0)=0`, so "facing" is always 0 and "behind" is always π. Any hit from the left (x < target.x) will register as backstab. | `traits.js:674-692` | Use `ctx.target.vx/vy` (no underscore); add zero-vel guard. |
| D25 | 斑斑 `baomao` · 狩猎本能 — mark 5s, kill marked → +25% speed, −30% CD for 3s, chain-hunt +2s | passive | **PARTIAL** — mark + kill logic OK. BUT: sets `_speedMult = 1.25`, `_cdMult = 0.70` which **battle.js never reads** (grep → 0 hits). Chain-hunt extension math (`Math.max(...)+2.0`) over-stacks: on 3 consecutive kills `_baomaoChainUntil` grows unbounded. | `traits.js:695-716`; battle has no `_speedMult/_cdMult` | Wire buff consumers; cap chain extension. |
| D26 | 星星 `xingchen` · 星界裂隙 — move 60u → leave rift (max 5, 2.5s), attack through +50% dmg + expose | passive | **PARTIAL** — rift detection uses "within 80u of target" — spec says "attacking THROUGH a rift" (line-of-attack vs rift). Code treats target proximity as "through". No expose tag. Double-hurtEnemy bug. | `traits.js:719-749` | Proper line-intersection check; add expose. |
| D27 | 奶糖 `fanmao` · 潮汐牵引 — water field rotational pull | passive | **CONTRADICTS (field schema)** — reads `fld.cx/cy` not `fld.x/y` (A2). Rotation math OK once schema fixed. Missing "inward pull at edge". | `traits.js:752-773` | Fix A2 + add edge-pull. |
| D28 | 夜夜 `mengmai` · 寂静压制 — hit active attacker → suppress tag -40% atk freq, 3s | passive | **PARTIAL** — requires `target._lastAttackT` to be tracked on enemies. **battle.js never sets `_lastAttackT` on enemies** (grep → 0 hits). Condition always false (undefined < 2.0 is false). Sets `_fireRateMult = 0.60` which battle doesn't read. | `traits.js:776-791`; battle has no `_lastAttackT` | Track enemy last-attack time; wire fire-rate consumer. |
| D29 | 樱桃 `yinghua` · 落樱余韵 — own light field expires → 160u slow cone + self next-skill +30% buff | passive | **PARTIAL** — detection via Map diff on onTick. Light field filter is `fld.element !== 'light'`, but V4 says "yinghua's own". Code applies to any light field, not specifically yinghua-cast (no per-owner tracking). Slow applied via `e._slowMult = 0.6; e._slowT = b.t + 2.0;` — **battle.js never reads `_slowMult`** (grep → 0 hits). Self +30% buff `_yinghuaBuff` not consumed. | `traits.js:794-823` | Wire _slowMult; add owner-field attribution. |
| D30 | 雪袜 `xuewa` · 踏浪之路 — trail HELPS allies: +15% speed 1s + 4 ult pop, 0.8s ICD/ally | passive | **PARTIAL** — sets `ally._speedMult = 1.15` which **battle doesn't read**. `gainUlt(4)` is called — but gainUlt is the global team ult, so the 4-pop accrues to the current `me()` cat not the specific crossing ally. | `traits.js:826-860` | Wire _speedMult; decide where ult pop goes. |
| D31 | 布丁 `zherdd` · 安宁之庭 — stand 1.5s → 160u regen aura, +3% maxhp/s, cap 6s | passive | **PARTIAL** — regen is +1.5% maxhp per 0.5s tick → +3%/s correct. BUT cap enforced via `_zherddStillT <= 7.5` — if cat stands 8s then moves, cap-exit never resets `_zherddStillT` cleanly. Also aura applies to self (`if (!ally.alive) continue`) — spec says "allies (self included)" which matches. OK-ish, needs cap-reset audit. | `traits.js:863-893` | Minor cap-reset cleanup. |
| D32 | 金豆 `jinjc` · 电力共享 — share 20% ult to lowest-ult ally, species-guard, 4s global ICD | passive | **STUB** — counter only; no actual share logic. | `traits.js:896-903` | Implement; depends on cross-cat ult model (game is global single-meter, so "lowest-ult ally" is semantically different than V4 assumes — needs design call). |
| D33 | 雪团 `nainai` · 净化庇护 — cleansed ally gets 50% DR shield 2.5s | passive | **STUB** — depends on A7. | `traits.js:906-912` | Implement after A7. |

---

## Section E — Form awakening (14 forms = 7 species × 2)

V4 §6 P3 list: 汤圆 / 蓝莓 / 松松 / 圈圈 / 露露 / 墨球 / 云朵 — 2 forms each.

| # | V4 item | Type | State | file:line | Owner-action |
|---|---|---|---|---|---|
| E1 | Architecture: `cat.formId` swaps, `cat.speciesId` stays permanent | form-awaken | **MISSING** — `formId` only referenced once in code (traits.js:91 `subj.formId \|\| 'base'`). Never set anywhere, never persisted. `EVOLUTION` table in `skills.js:1457-1464` still REPLACES `speciesId` (e.g. `tangyuan → senlin`) — **CONTRADICTS V4 §9.1 "speciesId never replaced"**. | `skills.js:1457-1488` | Rewrite evolution to formId swap OR document decision to keep evolution-as-species-change while form-awakening is a parallel concept. |
| E2 | Per-form loadouts: `cat.loadouts = { base: [...], yanjia: [...] }` (plural, keyed) | form-awaken | **MISSING** — `cat.loadout` is still a flat array. No `cat.loadouts` object. No `_loadoutsMigratedAt` stamp. | `skills.js:1083-1123` | Migrate shape. |
| E3 | `unlockedFormIds: ['base']` initial | form-awaken | **MISSING** — not in save schema. | `game.js` cat creation sites | Add. |
| E4 | 汤圆 → 熔岩战将 form (replaces passive with "offensive charge") | form-awaken | **MISSING** | n/a | Design + implement. |
| E5 | 汤圆 → 烟甲 (yanjia) form | form-awaken | **MISSING** | n/a | Design + implement. |
| E6 | 蓝莓 → 冰川斗士 form (deepens stacks) | form-awaken | **MISSING** | n/a | Design + implement. |
| E7 | 蓝莓 → 霜铠守卫 form (replaces mechanic) | form-awaken | **MISSING** | n/a | Design + implement. |
| E8 | 松松 → 森林狮王 form (scales stats) | form-awaken | **MISSING** | n/a | Design + implement. |
| E9 | 松松 → 古树守卫 form (tank numbers) | form-awaken | **MISSING** | n/a | Design + implement. |
| E10 | 圈圈 → 藤蔓支配者 form | form-awaken | **MISSING** | n/a | Design + implement. |
| E11 | 圈圈 → 日光术士 form (DPS switch — no passive) | form-awaken | **MISSING** | n/a | Design + implement. |
| E12 | 露露 (+form 1) | form-awaken | **MISSING** | n/a | Spec incomplete in docs; needs owner names for the 2 forms. |
| E13 | 露露 (+form 2) | form-awaken | **MISSING** | n/a | Same. |
| E14 | 墨球 → 暗夜猎手 form (deepens stealth) | form-awaken | **MISSING** | n/a | Design + implement. |
| E15 | 墨球 (+form 2) | form-awaken | **MISSING** | n/a | Owner names form 2. |
| E16 | 云朵 → 梦境治愈者 form (50% spread) | form-awaken | **MISSING** | n/a | Design + implement. |
| E17 | 云朵 → 云海庇护者 form (replaces link) | form-awaken | **MISSING** | n/a | Design + implement. |
| E18 | `allowedForms` field gating on TRAITS | form-awaken | **PARTIAL** — gate exists in dispatcher (traits.js:90-93) but no trait declares `allowedForms`, so gate never kicks in. | `traits.js:90` | None until E1 exists. |

**0 of 14 form-awakening passives implemented.** Entire P3 phase of V4's roadmap is unstarted.

---

## Section F — "Less is More: 33 passives + 40 skills + 8 ults + 14 form awakenings"

| # | V4 item | Type | State | file:line | Owner-action |
|---|---|---|---|---|---|
| F1 | 33 species passives | passive | **PARTIAL** — 33 registered, but ALL inert (A1) + ≥8 are stubs/missing consumers (D11, D12, D14, D32, D33 plus heavy consumer-miss D4/D13/D17/D25/D28/D29/D30). | `traits.js` | Fix A1, then burn down D-rows. |
| F2 | 40 skills total | skill-add | **DIVERGES** — authored SKILLS count is 57 including `purrNova` dedup comment line (so 57 non-generated entries), plus `genericSkills()` injects element×archetype fillers. V4 "40 skills" target isn't met or even close; the game has *more* skills than V4 prescribes. No consolidation done. | `skills.js:227-337` | If 40 is a real target, prune the generic auto-fillers or hand-authored overlap. |
| F3 | 8 ults | balance | **CONTRADICTS** — only **7** ults implemented: sunflare, tsunamiPaw, sunbloom, thunderYowl, voidMaw, moonlitHalo, moonfang. V4 says 8. The 8th (likely a dedicated DARK or ELEC hybrid, or the deleted purrNova replacement) is missing. | `skills.js:233, 269, 279, 285, 295, 301, 325` | Owner names the 8th or confirms 7 is the new target. |
| F4 | 14 form awakenings | form-awaken | **CONTRADICTS** — 0/14 (see §E). | n/a | Full P3 unstarted. |

---

## Section G — Element × role spread (owner-required matrix)

V4 §2.6 table:

| Element | Tank | Fighter | DPS | Assassin | Control | Support | Total |
|---|---|---|---|---|---|---|---|
| 火 fire | 2 | 2 | 1 | 0 | 0 | 0 | 5 |
| 水 water | 1 | 1 | 1 | 0 | 1 | 1 | 5 |
| 草 grass | 1 | 2 | 0 | 1 | 1 | 1 | 6 |
| 电 elec | 0 | 0 | 2 | 1 | 1 | 1 | 5 |
| 暗 dark | 0 | 1 | 1 | 3 | 1 | 0 | 6 |
| 光 light | 0 | 1 | 1 | 0 | 1 | 3 | 6 |

Computed from live code (skills.js SPECIES_ELEMENT + buildTypeForBreed with BREED_ROLES overrides), post-C1:

| Element | Tank | Fighter | DPS | Assassin | Control | Support | Total |
|---|---|---|---|---|---|---|---|
| 火 fire | tangyuan,jiafei (2) | qisi,jinwu (2) | abi (1) | — | — | — | 5 ✅ |
| 水 water | dundun (1) | lanbao (1) | xiaohui (1) | — | fanmao (1) | xuewa (1) | 5 ✅ |
| 草 grass | nietu (1) | senlin,nuowei (2) | — | doudou (1) | meidu (1) | zherdd (1) | 6 ✅ |
| 电 elec | — | — | xianluo,wumao (2) | niuniu (1) | duanduan (1) | jinjc (1) | 5 ✅ |
| 暗 dark | — | lixiao (1) | youling (1) | moqiu,baomao,xingchen (3) | mengmai (1) | — | 6 ✅ |
| 光 light | — | sanhua (1) | yuelian (1) | — | yinghua (1) | nainai,yunduo,bosi (3) | 6 ✅ |

| # | V4 item | Type | State | file:line | Owner-action |
|---|---|---|---|---|---|
| G1 | Element×role matrix completeness | element-change | **DONE** (this cycle, 2026-11-26) — C1 landed. Matrix now matches V4 §2.6 exactly. jinjc moved from light-support to elec-support; light drops to 3 supports (nainai/yunduo/bosi) and elec gains jinjc. | `skills.js:168-200` | — |
| G2 | V4 §2.3 says 月月 is DPS (ranged band). Code BREED_ROLES does NOT force yuelian; stat-matrix infers dps (agi17, pow14) ✓. | role | **DONE** | computed above | None. |
| G3 | V4 §2.5 says 樱桃 (yinghua) is Control. Code stat-matrix: agi11,cha12 → control (via `cha|agi`). | role | **DONE** | computed | None. |
| G4 | V4 §2.4 says 墨球 (moqiu) is Assassin. Stat-matrix: pow7,agi6 → assassin. | role | **DONE** | computed | None. |
| G5 | V4 §2.2 says 芝士 (qisi) is Fighter. Live has `BREED_ROLES.qisi='fighter'`. | role | **DONE** | skills.js:1187 | None. |
| G6 | V4 §2.2 says 绅绅 (lixiao) is Fighter. Live has `BREED_ROLES.lixiao='fighter'`. | role | **DONE** | skills.js:1187 | None. |
| G7 | V4 §2.2 says 松松 (senlin) is Fighter. Live has `BREED_ROLES.senlin='fighter'`. | role | **DONE** | skills.js:1187 | None. |
| G8 | V4 §2.6 says 云朵 (yunduo) is Support. Computed: cha9 top → support ✓. | role | **DONE** | computed | None. |
| G9 | V4 §2.6 says 布丁 (zherdd) is Support. Computed: cha9 → support ✓. | role | **DONE** | computed | None. |
| G10 | V4 §2.3 says 杏仁 (abi) is DPS (fire). Computed: agi9 → dps ✓. | role | **DONE** | computed | None. |
| G11 | All 33 computed roles MATCH V4 2.1-2.6 prescription one-for-one (modulo G1). | role | **DONE** | all SPECIES iter | None. |

**Role spread is a win:** every species's current build maps to V4's prescribed role. The only misalignment is the jinjc element issue (G1/C1).

---

## Section H — De-dup assertions (V4 §4 risky collisions)

V4 flagged 14 de-dup pairs; code must make them mechanically distinct.

| # | V4 pair | Distinction required | State | Owner-action |
|---|---|---|---|---|
| H1 | 汤圆 vs 团团 | Store-release OFFENSE vs shield-break-burst DEFENSE | **PARTIAL** — tangyuan's release half isn't wired (D1), so distinction can't be tested in-sim yet. | Finish D1. |
| H2 | 奶酥 vs 布丁 | Self DR vs ally regen | **PARTIAL** — nietu's `_dmgTakenMult` unread (D13); zherdd regen works. | Fix D13. |
| H3 | 奶酥 vs 枫枫 | Still-DR anywhere vs in-field combat buff | **PARTIAL** — both consumers unread (D13, D17). | Fix both. |
| H4 | 杏仁 vs 桃桃 | Move-charge vs stand-charge | **DONE** (once A1 fires). Mechanics are symmetric-inverse as spec. | A1. |
| H5 | 芝士 vs 露露 | Any-melee streak vs same-target streak | **PARTIAL** — qisi doesn't decay (D15), xianluo doesn't decay (D21). | Fix decay. |
| H6 | 绅绅 vs 花花 | Timing window vs variety | **CONTRADICTS semantics** — both wired to `onHitResolved` instead of `onSkillCast` (A6). | A6. |
| H7 | 焰焰 vs 蓝莓 | ANY-source burn vs OWN-applied chill/soak | **DONE (logic-wise)** — jinwu reads tag from any source; lanbao reads own skill.appliesTag. | None. |
| H8 | 豆豆 vs 墨球 | Backstab ANGLE vs STEALTH | **PARTIAL** — doudou angle broken (D24 vx/vy field name); moqiu stealth missing damage path (D7). | Fix both. |
| H9 | 奥利奥 vs 幽幽 | Dash-midpoint echo vs post-attack echo | **PARTIAL** — niuniu has no midpoint (D8), youling echo-target pos wrong (D22). | Fix. |
| H10 | 跳跳 vs 星星 | Trail CC vs attack-window | **PARTIAL** — xingchen rift uses target-proximity not line-of-attack (D26). | Fix D26. |
| H11 | 奶糖 vs 圈圈 | Rotational vs point-pull | **CONTRADICTS (both broken)** — both read `fld.cx/cy` (A2). | A2. |
| H12 | 雪袜 vs 跳跳 | Trail HELPS vs HURTS | **PARTIAL** — xuewa _speedMult unread (D30). | Fix D30. |
| H13 | 圆宝 vs 云朵 | Redirect DAMAGE-in vs transfer HEAL-out | **STUB BOTH** — D14 / D11. | Fix. |
| H14 | 雪团 vs 绒绒 | Cleanse-react vs overheal-preempt | **STUB BOTH** — D12 / D33. | Fix. |

---

## Section I — Other tenets (§1 core design)

| # | V4 item | Type | State | file:line | Owner-action |
|---|---|---|---|---|---|
| I1 | §1.1 "One passive per cat" | passive | **STRUCTURALLY OK** — TRAIT_BY_SPECIES is 1-to-1. | `traits.js` | None. |
| I2 | §1.2 "Changes decision-making, not raw numbers" | passive | **CONTRADICTS 7 traits** — tangyuan/senlin/doudou/baomao/yunduo/bosi/jinwu all boil down to flat damage multipliers (D1, D4, D8, D13, D15, D16, D17, D20, D21, D23, D24, D25, D26). V4 explicitly says "no flat +10% atk" — most P2 traits are exactly flat +X% damage. | `traits.js` | Design-level: either accept the reading or redesign the hit-math traits. |
| I3 | §1.3 "No new buttons / no new resource bars" | other | **DONE** — no new HUD elements. | n/a | None. |
| I4 | §1.4 "Visible VFX feedback with 3 phases (准备/触发/消散)" | other | **MISSING** — `vfxId` fields declared per trait but **no renderer code consumes them** (grep `_bosiTraitActive`, `_emberCharge`, `vfxId` → only internal). No 3-phase VFX anywhere. | `traits.js` all | Build the trait-VFX layer. |
| I5 | §1.5 "Form awakening ALTERS the passive, not replaces species" | form-awaken | **CONTRADICTS** — EVOLUTION table still replaces species (E1). | `skills.js:1457` | See E1. |
| I6 | §1.6 "Rare cats do not strictly dominate commons" | balance | **UNKNOWN** — not tested. SR/SSR cats still have higher base stats; passives are layered on top. | n/a | Needs sim data. |
| I7 | §5 Visual priority ceiling: `TRAIT > basic/status` but `< heavy/ult/duo` | other | **MISSING** — no VFX layer; moot until I4 done. | n/a | After I4. |

---

## Section J — Load order / registry hygiene

| # | V4 item | Type | State | file:line | Owner-action |
|---|---|---|---|---|---|
| J1 | §5.2 `traits.js` loaded AFTER skills.js, BEFORE battle.js | other | **DONE** — load order correct in index.html. | `index.html:206, 208, 228, 229` | None. |
| J2 | §5.2 Trait registry file separate from skills.js | other | **DONE** — standalone `traits.js`. | n/a | None. |
| J3 | §5.2 `TraitDef` shape includes `allowedForms`, `vfxId`, `internalCooldown` | passive | **DONE** — all three fields supported in registerTrait. | `traits.js:28-110` | None. |
| J4 | §5.4 recursion guard: dispatcher short-circuits on `ctx._isDerived` | other | **DONE** — guard present. | `traits.js:71` | None. |

---

## Section K — BALANCE-BRIEF locked numbers (sanity check)

The owner-locked P1 numbers (BALANCE-BRIEF §Specific numbers) should appear verbatim in traits.js:

| # | V4 number | Code value | file:line | State |
|---|---|---|---|---|
| K1 | 汤圆 store 25%, cap 60% maxhp | 0.25, maxhp*0.6 | traits.js:142-143 | **DONE** |
| K2 | 团团 freeze 1.2s, ICD 8s | 1.2, 8.0 | traits.js:155, 173 | **DONE** |
| K3 | 蓝莓 +30%/stack, cap 5 | 0.3, 5 | traits.js:196, 204 | **DONE** |
| K4 | 松松 heavy ×1.25, speed ×0.85 | 1.25, 0.85 | traits.js:221, 224 | **DONE** (but unread, D4) |
| K5 | 杏仁 200u | 200 | traits.js:251 | **DONE** |
| K6 | 桃桃 1.5-3s ramp | `_wumaoStillT/1.5 - 1` clamp 0..1 | traits.js:286 | **DONE** |
| K7 | 墨球 1.5s, 180u, +85% | 1.5, 180, 0.85 | traits.js:321-323, 307 | **DONE** |
| K8 | 奥利奥 50%, ICD 3s | 0.5, 3.0 | traits.js:337, 344 | **DONE** |
| K9 | 圈圈 pull 60u/s | 60 | traits.js:379 | **DONE** (but broken via A2) |
| K10 | 跳跳 chip 8%, shock 0.25s | 0.08, 0.25 | traits.js:421, 423 | **DONE** |
| K11 | 云朵 spread 25%, range 300u, link cap 2 | — | traits.js:437-448 | **STUB** (D11) |
| K12 | 绒绒 conversion 0.6, cap 25% maxhp | — | traits.js:452-467 | **STUB** (D12) |

---

## Section L — Data-integrity & save-migration

| # | V4 item | State | file:line | Owner-action |
|---|---|---|---|---|
| L1 | §8 `_jinjcMigratedAt` stamp — run migration once per save | **MISSING** | — | Implement with C1. |
| L2 | §9 `cat.formId = 'base'` default on makeCat / cat creation | **MISSING** | `game.js` catch sites | Add default. |
| L3 | §9 `loadouts` becomes object keyed by form (`loadouts.base`) | **MISSING** — still array | `skills.js:1083` | Shape migration. |
| L4 | §7 recursion guard list: 8 guards named; `_isDerived`, `_traitFiredThisCast`, distinct `onHeal` vs `onHealDerived`, species-self-guard | **PARTIAL** — `_isDerived` works at the `emit()` entry (traits.js:71); `_traitFiredThisCast` missing (A11); dual onHeal missing; species-self-guard not enforced anywhere (no trait declares `avoidSameSpecies: true`). | `traits.js:21` doc says supports it, no trait uses it | Add species-self-guard for jiafei & jinjc at minimum. |

---

## Section N — Post-V4 authored additions (not in V4 docs)

Skills/traits/content added since the V4 archive was frozen. These are not
specced in V4-10/11/12 but shipped to fix owner-reported gaps.

| # | Addition | Type | State | file:line | Notes |
|---|---|---|---|---|---|
| N1 | `shadowTendrils` 暗影触手 — dark beam/channel, Lv6+dark+control auto-learn | skill-add | **DONE** (commit `15ae616e`, 2026-11-26) — identity-gated beam with bind tag, channel 1.6s, autoLearn=true so any cat that meets Lv6 + dark + control gets it without trainer. Also introduced `allowRoles` role-gate enforcement to fix Y夜夜 missing the skill. | `skills.js:296`; autoLearn plumbing at `skills.js:833` | New dark-control identity skill; fills the missing elec/dark control archetype gap. |
| N2 | `arcanePulse` reworked into **Umbral Barrage** (暗星轰击) lob-salvo | skill-change | **DONE** (commit `ceeaa352`, 2026-11-26) — kind changed from pulse/aoe burst to 3-shot lobbed ground-target salvo (lobCount:3, lobGap:.42, lobFlight:.76, lobRadius:46). Was a duplicate-ish ranged pulse; now a unique dark-DPS artillery cast. Lv5+dark+dps unlock. | `skills.js:295` | Partially moots A11's worry about pulseCount re-firing traits for arcanePulse — new shape is 3 discrete lobs not a single multi-hit skill, so each lob is its own hit-cast anyway. Still worth confirming the trait-dedup semantics once A11 lands. |

---

## TOP 10 MISSES BY SEVERITY (refreshed 2026-11-26)

1. **E1 — Form awakening infrastructure 0/14.** `cat.formId` is read by the trait gate but never set. `EVOLUTION` still replaces `speciesId` (CONTRADICTS §9.1 "speciesId never replaced"). The entire P3 phase is unstarted. **[TOP MISS now that A1/A2/C1 are closed.]**
2. **D11, D12, D14, D32, D33 — 5 P1+P2 traits are self-admitted stubs** (yunduo, bosi, jiafei, jinjc, nainai) because their required emit sites (A5, A7) were never added.
3. **A6 — `onSkillCast` emit missing.** 绅绅/花花 fire on hit-landed, not skill-cast. Means their rhythm/variety semantics are measured against a different event than V4 specs.
4. **A11 — No per-cast dedup guard.** Multi-hit skills (tidalPulse/boltSwarm/prismSwarm) will fire 蓝莓/幽幽/芝士/露露 traits 3–5× per cast. (arcanePulse is now 3 discrete lobs per N2, so moot for it.)
5. **Trait-side flags unread by battle.js.** `_dmgTakenMult` (nietu), `_dmgOutMult` (nuowei), `_heavyBonus` (senlin), `_slowMult` (yinghua), `_speedMult/_cdMult` (baomao, xuewa), `_fireRateMult` (mengmai) — all set by traits, none consumed. 7+ traits effectively do nothing even after A1.
6. **A3 — Shield-break emit site missing.** 团团 fires on natural shield expiry, cheesing freeze every time a shield times out. V4 §11 explicitly bans this.
7. **A4 / A5 / A7 — onStatusApplied / onHealResolved / onCleanse emits missing.** Blocks lanbao/jinwu precision timing + all heal-reactive and cleanse-reactive stubs.
8. **I4 — No trait VFX layer.** `vfxId` declared on every trait, consumed by nothing. V4 §1.4 and §5 explicitly require 3-phase visible feedback; players will have no idea when their passive fires.
9. **F3 — ult count is 7, not V4's 8.** Likely purrNova was the 8th and is correctly deleted, but V4 §15 roster hasn't been reconciled.
10. **I2 — "Traits should change decision-making, not raw numbers."** 7+ P1/P2 traits are flat ±% damage multipliers. Design-level question for the owner: accept the current reading, or redesign toward decision-shaping effects.

---

## What this doc is NOT

- Not a fix. Zero code changed.
- Not exhaustive — focused on the 33+14 passives + element/role matrix. Did not audit: combo-chain tuning, bond tiers, gated-skill trainer flow, assassin role identity, duo cinematics.
- Not a sim result — all findings are static code-vs-spec diff, not in-game observation.
