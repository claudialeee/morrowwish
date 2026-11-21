# Cat Bond — Combat hit-system redesign (design doc, not yet implemented)

Status: **proposal for owner/user sign-off**. No gameplay code changed by this doc.
Scope: `public/cat-bond/js/battle.js` (+ small `vfx.js` additions, + i18n strings for any
new display text). **No balance numbers** change (damage/HP/rarity/cooldown values stay as the
owner tuned them); this is about *hit geometry, readability, and three shield verbs*.

Constraints honored: no push until allowed; no PNG/asset edits; don't fight the owner's live
balance work (data.js rarity + eliteFactor + the CI asserts in check-cat-bond.mjs stay intact).

---

## 1. The problem (verified in current code)

There are **three unrelated hit-resolution paths**, so skills of different `kind` collapse into
two looks and some behave wrong:

- Flying projectile — `spawnProj` + the projectile loop at `battle.js:845-864` (circle overlap,
  has travel time, dodgeable). Used by basic + `projectile` skills + ALL enemy fire.
- Instant melee arc — `meleeStrike` (`battle.js:628-643`): loop live enemies, distance + frontal
  angle, resolve now.
- Instant self-centered AOE — only inside `ultimate()` (`battle.js:699-718`): loop live enemies
  within a radius of the caster.

`skillQ`/`skillE` only branch `melee` vs **else** (`battle.js:610-619`). Consequences:
- The 5 `aoe` skills are all ults; a Q/E-slot `aoe` would render as a plain projectile fan.
- `dash` (静电扑) falls into the fan — wrong visual AND wrong behavior (should lunge).
- Control skills (dizzy/blind/expose/shock) apply status via `applyHitEffects` but have **no
  distinct cast visual** — stunning looks identical to poking.
- VFX vocabulary already exists and is unused per-kind: `ring, shockwave, beam, orb, impact,
  trail, muzzle, burst, text` (`vfx.js`).

---

## 2. Design decisions (locked with user)

- **Directional skills = flying projectiles** (keep travel time + dodgeable + shield-interceptable);
  just add a stronger **trajectory trail**.
- **Placed AOE = a slow projectile that travels to a target point, then bursts into a circle**;
  only enemies **inside the burst circle** are hit. Players AND enemy AI can aim/drag it. The
  travel is deliberately slow (telegraphed, dodgeable by leaving the circle).
- **Chain lightning = jump hits** enemy→nearest-unhit enemy; only enemies **on the chain** are hit.
- **"Only things on the path/in the area get hit"** — every skill has honest hit geometry, not a
  blanket radius.
- **Three distinct shield verbs**, each with its own limit + after-effect (下面 §5). **Both players
  and enemies** can use them.
- Ship order: **this doc → sign-off → one implementation pass** (not piecemeal).

---

## 3. Unified hit pipeline (the core refactor)

Collapse the three paths into ONE resolver so every weapon/skill/enemy attack is consistent and
every attack passes through the same shield check.

```
resolveHit(target, source, skill, dmg, hitX, hitY)
  // ONE place that: checks target i-frames/flash, runs shield interception (§5),
  // then applyHitEffects (element/combo/status) + hurtEnemy/hurtMe + impact VFX.
  // Returns {blocked, reflected, dealt}.
```

All five geometries just decide **which targets** to feed into `resolveHit`:

| kind | geometry | dodgeable? | VFX |
|---|---|---|---|
| `projectile` (directional) | flying body, circle overlap (existing loop) | yes | strong colored **trail** + elemental head (beam/orb/spark by element) |
| `melee` | instant frontal arc (existing `meleeStrike`) | no (walk out) | slash arc (existing) |
| `aoe` (placed) | **slow projectile** → on arrival/expire, burst circle; hit enemies within `R` of burst center | yes (leave circle) | travel trail + **ground target ring** at destination + `shockwave`+`ring` on burst |
| `dash` | lunge the caster along aim; hit enemies crossed along the lunge segment | partial | `trail` on caster + `impact` at contact |
| `chain` (new tag on elec combos / a chain skill) | hit nearest enemy, then jump to nearest-unhit within `jumpR`, up to `N` jumps | no | `beam` segment per jump (existing `vfx.beam`) |

Projectiles get a `burst` descriptor so the **existing** projectile loop (`battle.js:845`) does the
AOE on expiry — **no new update loop**. e.g. `spawnProj(...,{burst:{r, skill, dmg}})`; when
`p.life<=0` or it reaches its target point, call a `burstAt(p)` that feeds the circle into
`resolveHit`. This is the key to not creating a 4th parallel system.

---

## 4. Placed-AOE targeting (desktop + mobile + AI) — DECIDED

- **Desktop = draggable aim.** Target point follows `game.mouse`; while the slow AOE lob is in
  flight the destination keeps tracking the cursor, so you can steer where it lands.
- **Mobile = lands on the locked/nearest enemy.** No new touch gesture — reuse `lockedEnemy()`
  (falling back to `nearestEnemy`). This deliberately AVOIDS the owner's live hold-to-fire /
  joystick touch surface (risk #3) — no gesture conflict, works today.
- **Enemy AI** uses the same `aoe` lob aimed (with lead) at the player, obeying the existing
  `_novaLock` stagger so two AOEs don't drop at once.
- The lob is **slow** and shows a **ground ring** at the predicted impact circle the whole time it
  travels, so it stays readable and dodgeable (leave the circle) on both platforms.

---

## 5. Three shield verbs (players + enemies), each with a real cost

A shield is a short-lived property on a fighter; `resolveHit` consults it first.

| verb | effect | limit | after-effect (后遗症) |
|---|---|---|---|
| **Protect (守护)** | fully blocks the next hit(s) for a very short window (all kinds: projectile/AOE/melee/chain) | tiny window (~0.4s); long cooldown | brief **vulnerable** window after it drops (takes +% dmg), so spamming is punished |
| **Reflect (反弹壁)** | reflects flying **projectiles** back at their owner; **instant** melee/AOE/chain only get reduced, not reflected | only flips projectiles; duration short | caster is **rooted/slowed** while the wall is up (can't kite) |
| **Barrier (护盾)** | % damage reduction for a duration (strengthen existing `shieldT` 55%) | not a full block; chip damage still lands | drains the caster's ult/energy or leaves low regen after |

Implementation seam: `resolveHit` checks `target.protectT` (block → VFX `ring` + "格挡"), then
`target.reflectT` (if `source` is a projectile → re-own it to the target and reverse velocity),
then `target.shieldT` (scale dmg). Enemies get the same fields; their AI casts them via the gambit
system (new gambit actions `protect`/`reflect`/`barrier`). Status/`applyHitEffects` only runs on
the portion that actually lands.

---

## 6. VFX per kind (readability; all reuse existing `vfx.js`, maybe 1-2 new helpers)

- directional: elemental projectile head + bright `trail` (fire=embers, water=droplet, elec=spark,
  light=`beam`, dark=`orb`).
- placed AOE: travel `trail` + persistent **ground ring** + on-burst `shockwave`+`ring`+`burst`.
- chain: a `beam` per hop + small `impact` at each node.
- dash: caster `trail` + `impact`.
- control landing (in `applyHitEffects`): dizzy = spinning stars ring over target; blind = dark
  wash; expose/armor-break = cracked red ring; shock = jitter + arcs. So "I controlled it" is visible.
- shields: Protect = solid bubble flash; Reflect = flat mirror wall oriented to aim; Barrier = soft
  dome that chips.

---

## 7. What stays untouched (safety)

- All damage/HP/rarity/cooldown/eliteFactor numbers (owner's balance). New geometry reuses existing
  `dmg`/`power`/`applyHitEffects`, so totals are unchanged except where geometry naturally changes
  *who* is hit (intended).
- `check-cat-bond.mjs` + `check-source.mjs` asserts (normal/elite HP, rarity weights, module cache-
  busts, bilingual markers). I'll re-run both; if a legitimately-changed behavior trips an assert,
  I flag it rather than weaken the check.
- No PNG/asset edits. Bilingual: any new on-screen words (e.g. 守护/反弹壁/格挡) get i18n entries.

---

## 8. Open risks to confirm before coding

1. **Reflect vs enemy projectiles**: reflected shots re-owned to `'me'`/`'wild'` — need to prevent
   infinite ping-pong (cap reflects per projectile).
2. **Chain targeting** must skip dead/already-hit nodes and cap jumps, or it can loop.
3. **Draggable AOE on mobile** — RESOLVED: do NOT add a mobile gesture. Desktop drags with the
   mouse; mobile drops the AOE on the locked/nearest enemy. Avoids the owner's hold-to-fire surface.
4. **Perf**: more per-hit VFX on phones — reuse pooled fx, gate particle counts on `isTouch`.
5. This is a sizable change to a file the owner edits frequently — I'll implement against the
   latest `main` at code time and keep it one coherent commit.

---

## 9. Proposed implementation order (one pass, after sign-off)

1. Add `resolveHit` + shield fields; route the existing projectile/melee/ult hits through it (no
   behavior change yet — pure refactor, verify tests still pass).
2. Add `kind` dispatch in `skillQ`/`skillE`: `aoe` (placed lob+burst), `dash` (lunge), `chain`,
   keep `projectile`/`melee`.
3. Add the three shield verbs (player buff slots + enemy gambit actions).
4. Per-kind + control + shield VFX.
5. Enemy AI: AOE lob with lead, shield casts.
6. i18n for new words; `npm run check` + headless test; report; **wait for push approval**.
