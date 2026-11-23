# Cat Bond — Elemental "carrier ↔ reaper" axis design (owner-approved framework)

Status: DESIGN (owner approved framework "A: three carrier↔reaper axes" 2026-11-22). Part partly
implemented (water→elec conductive +20%, UNTESTED/UNREVIEWED, in battle.js working tree). Rest is
spec-only. ALL of this is combat balance → must pass two-round challenger before commit. battle.js
is also being edited by the band-builder workstream (kitRangeBand) — coordinate / don't collide.

## Core framework: 3 paired axes, each "carrier sets a state → reaper detonates it"
Every element is EITHER a carrier (applies a debuff that enables) OR a reaper (detonates a debuff
for a burst), ideally a bit of both. The six elements pair into THREE two-cat dances so cross-team
play has a clear best answer instead of scattered combos.

| Axis | Carrier (applies state) | Reaper (detonates) | Fantasy |
|---|---|---|---|
| 💧水 ↔ ⚡电 | water → soak (湿身) | elec | wet field conducts → lightning follows up |
| 🔥火 ↔ 🌿草 | fire → burn, grass → bind/bleed | each other | fire burns the vines / vines feed the fire |
| 🌑暗 ↔ ☀️光 | dark → expose/bleed/dizzy | light | shadow marks the weak point → light judges it |

## Water identity (locked): CARRIER + CONTROL, not a nuker
Water doesn't burst; it WETS the field so ELEC cashes in, and slows/controls. Supported by: soak
slow 0.8, low water attack matchups (0.5 vs grass/elec, 2× only vs fire), water role spread
(control/support heavy). The "conductive" bonus below is water's signature enabler payoff.

### IMPLEMENTED (working tree, battle.js applyHitEffects, UNTESTED/UNREVIEWED):
- CONDUCTIVE: a SOAKED target takes +20% from ELECTRIC hits (`skill.element==='elec' && e.status.soak>0 → bonus+=0.20`).
  Additive in the shared bucket (not multiplicative), persistent (does NOT consume soak), separate
  from the one-shot `soak|elec` chain. ONLY elec benefits — a water attacker hitting a wet target
  gets nothing (water sets up, elec cashes in). Stacks fairly atop the 2× elec→water matchup
  (2.0 matchup + 0.20 conductive = water-cat-wet target eaten hard by elec, as intended).

## REACTION GAPS to fill (make all 3 axes bidirectional) — SPEC ONLY, not yet added
Current COMBO already has: water↔elec complete (soak|elec 1.5, shock|water 1.4); fire↔grass mostly
(burn|grass 1.3, bind|fire 1.35); dark↔light partial (dizzy|light 1.4, blind|dark 1.3). Missing the
legs that make 火↔草 and 暗↔光 fully two-way. Add exactly 3 (additive, 1.2–1.5, no removals):

| key | name | bonusMult | effect | consumes | axis / rationale |
|---|---|---|---|---|---|
| `bleed\|fire` | 焚血 | 1.30 | explode | true | 火↔草: fire detonates grass's open bleeding wound |
| `expose\|light` | 圣光曝击 | 1.40 | shatter | true | 暗↔光: light JUDGES the weak point dark exposed (currently expose is detonated by dark itself; give light its signature reap) |
| `bleed\|light` | 净血裁决 | 1.30 | shatter | false | 暗↔光: light detonates dark's bleed |

Design rules honored: bonusMult 1.2–1.5; element-effectiveness and reaction bonus stay ADDITIVE
(1 + (combo-1) + (elem-1)); reuse existing effect keys (explode/shatter/chainAll/bloom/steam);
consumes=true for one-shot bursts, false for DoT/spread. No existing reaction changed or removed.

## What is NOT changing (deliberately, to keep each element's identity)
- Elec stays a pure REAPER (few self-setup reactions) — it's the burst finisher that needs a carrier
  (esp. water). Playing elec solo is meant to feel like it wants a wet/oiled/bound target.
- Dark stays an inward self-loop assassin (expose|dark, bleed|dark) AND now also feeds light.
- Matchup table (EFFECT) untouched — elec→water 2× etc. are intended.

## Verification plan before commit (feed to challenger)
1. Conductive +20%: confirm it ONLY triggers for elec attacker on soaked target; a water/other hit
   on a soaked target gets nothing; it's additive (elec→water on wet = 1 + (2-1) + 0.20 = 2.20×, not
   2.4×); it does NOT consume soak; stacks correctly with (not double-counting) soak|elec chain.
2. New reactions: each fires on the right tag+element, bonusMult in 1.2–1.5, consumes flag behaves,
   no collision with existing keys, VFX/label present.
3. Balance: does elec-on-wet become a one-shot? (2.20× + combo + execute on a low-HP target — compute
   worst case vs the existing additive cap). Does any axis create a degenerate infinite loop?
4. npm run check green; add a test asserting conductive only-elec-on-soak and the 3 new reactions resolve.
