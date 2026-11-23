# Cat Bond — Enemy/Player Skill Unification (design spec, owner-approved 2026-11-22)

Status: DESIGN → implementing. Owner-approved direction: **"野猫也应该用和我们一样的技能"** =
wild enemies draw from `skills.js` through the SAME `buildTypeForBreed` + role×category gate as
player cats. No parallel enemy-only skill system. Must pass the standing TWO-round challenger
review (combat/AI/balance) before landing. No push.

## Root problem (measured)
Enemies and players run two PARALLEL combat systems:
- **Player side** = `skills.js` data objects (`kind/power/cd/element/unlock`), routed through
  `buildTypeForBreed` + `roleAllowsSkill`/`roleFilterForAutoEquip` (the role×category gate) + ult
  gate (`ultCost>0` only via the ult meter).
- **Enemy side** = hardcoded in `battle.js`:
  - `pickWildSkillFor(element,rIdx)` grabs ANY element skill, and for `rIdx>=2` grabs the
    element's **ULT** 50% of the time — ignoring role, level, and the ult meter.
  - `unleashEnemySpecial` fires hardcoded `telegraphKind` patterns (`nova`/`barrage`/`lob`/
    `pounce`/`smash`) that are NOT skills — they ignore cd/ultCost/gate entirely.
  - `enemyMaybeWard` casts `reflect`/`barrier`/`protect` with NO role check.

### Three concrete bugs this produces (all confirmed live)
1. **3级 桃桃 (wumao, elec SR) casts `thunderYowl` (power 2.3, ultCost 70) as a normal attack** —
   via `pickWildSkillFor` rIdx>=2 ult grab. A level-3 wild cat should not have a signature ult.
2. **露露 (xianluo, 暹罗, elec SR, agi11/cha11 = dps/control) opens `mirrorWall` (炸毛墙, tank-only
   `unlock:{build:'tank'}`) reflect wall** — `enemyMaybeWard` never checks role. 暹罗 is not a tank.
3. **Players have no `barrage`/`nova`** because those were never skills — just enemy AI firing
   styles. (Owner asked "为什么没有"; answer: they're delivery presentation, not library skills.)

## Target design: ONE gate, both sides

### E1 — Enemy loadout comes from the gated skills.js pool (makeEnemy)
Build a pseudo-cat for the enemy's species (`{species: sp.id, level, stats}`), compute its build via
`Skills.buildTypeForBreed`, then draw a legal loadout from the SAME path the player auto-equip uses
(`defaultLoadout`/`recommendLoadout`, which already run `roleFilterForAutoEquip` → the role gate and
exclude `ultCost>0` from normal slots). Store `e.loadout = {basic, q, e}` (real skill objects) and
keep `e.skill` = the primary offensive skill (for the existing fire-path reads at 4196/4447/4514).
→ Fixes bug 1 structurally: the normal pool excludes ults, so no wild cat can grab `thunderYowl`.
→ 暹罗 draws dps/control skills (lightningOrb/boltArc/thunderStream), never the tank wall.

### E2 — telegraphKind becomes the DELIVERY STYLE of the equipped skill, not an arbitrary pattern
`unleashEnemySpecial` keeps its readable telegraph presentation, but what it FIRES is the enemy's
equipped skill, with element + power + appliesTag from that skill object:
- equipped kind `aoe`        → radial `nova` / lobbed `lob` (element+power from skill)
- equipped kind `projectile` → `barrage` fan (element+power from skill)
- equipped kind `beam`       → a channeled beam (reuse castBeam path) — not a ball fan
- equipped kind `chain`      → the chain/boltArc delivery
- equipped kind melee/dash/pounce/leap → `pounce`/rush delivery
Barrage/nova stop being "free" — their power is the equipped skill's `power`, scaled by `enemyDmgMult`.
`smash` (the must-dodge heavy disc) is NOT a library skill — it is the universal dodge-test forcing
function every breed can wind up (like a basic). It STAYS, element-tinted. Keep it.

### E3 — Wards gated by role (enemyMaybeWard)
Only cast a ward the enemy's breed role could legally learn:
- `reflect` (mirrorWall) → tank only.
- `barrier`/`protect` (generic shields/protect) → roles the gate allows a shield for (tank/support,
  + fighter small shield). Use `roleAllowsSkill(build, {kind:'buff',...})` as the test, or gate on
  build ∈ allowed set. A dps/control/assassin enemy gets NO ward.
→ Fixes bug 2: 暹罗 (dps/control) can never reflect.

### E4 — Enemy ults become a rare CHARGED event (not a free normal attack)
Normal slots exclude ults (E1). If we want signature ults on tough wild cats, they must charge like
the player's (a meter that fills over the fight) and fire ONCE, telegraphed, at reduced power.
DECISION (owner "调低必杀威力"): for THIS pass, enemy ults are DROPPED from normal rotation (E1
handles it). A future charged-ult event can be added behind its own meter; log it, don't ship half.
When an enemy ult IS eventually fired, clone it at reduced power (e.g. ×0.6) so a wild ult never
out-damages a player ult of the same tier.

### E5 — Level-suppression starter clamp only protects the UNDER-levelled player (owner-approved)
`makeEnemy` starter-region clamp (`Math.min(1.08, enemyDmgMult/enemyHpScaleGap)`) currently fires
both ways, so when the player OUT-levels the wild (gap>0) it also stops the enemy from getting
softer/squishier — blunting the player's deserved crush. Change: apply the starter clamp ONLY when
`gap <= 0` (player is at or below the wild's level — the true new-player-protection case). When
gap>0 the normal logistic suppression runs unclamped so out-levelling feels like out-levelling.

## Must-verify (feed to challenger)
1. Every wild species still gets a legal, non-empty, non-ult loadout in its element (enumerate all
   33 breeds as enemies; any (element,role) with <4 legal skills is flagged, same as player audit).
2. No wild cat equips an ult in a normal slot; no dps/control/assassin wild cat casts a ward;
   no non-tank casts reflect. (Direct assertions for 桃桃 no-thunderYowl, 露露 no-mirrorWall.)
3. barrage/nova still READ as the same threat shapes (telegraph legibility unchanged) — only the
   damage SOURCE moved to the equipped skill. Confirm the 5-dart barrage + radial nova still draw.
4. Enemy damage output per fight does not spike or crater vs today (the firing power now = skill
   power × enemyDmgMult instead of e.dmg × hardcoded mult — verify parity within a reasonable band).
5. smash disc still fires as the dodge-test; interruptible-cast + poise still work.
6. Level-suppression: gap>0 fights get the full crush (enemy softer+squishier) in the starter region;
   gap<=0 new-player fights still clamped safe. Re-measure lv10 senlin vs lv3 桃桃 crush.

## Implementation order
1. Spec (this file). 
2. E1 enemy gated loadout in makeEnemy (+ helper enemyLoadoutFor(sp,level)).
3. E2 unleashEnemySpecial fires the equipped skill (element/power/tag from skill).
4. E3 enemyMaybeWard role gate.
5. E5 starter-clamp gap<=0 only. (E4 = drop ults from normal; log future charged-ult.)
6. Tests in check-cat-bond.mjs: all-33-as-enemy legal loadout, no-ult-in-slot, ward role gate,
   桃桃≠thunderYowl, 露露≠mirrorWall, barrage/nova still draw, crush re-measure.
7. npm run check green → TWO-round challenger → land local, no push.
