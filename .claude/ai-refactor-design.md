# Cat Bond combat-AI — principled refactor design (v0, up for critique)

## Problem (why it's a parameter shit-pile today)
battle.js has TWO independent distance-threshold systems that must agree by hand and don't:
1. **Movement** `kitRangeBand(f) → {min,max}` — per-role hand-tuned standoff bands (melee/ranged/dash/support/bruiser/basic).
2. **Firing** `smartAutoAction`'s `offensive(sk,slot)` — a SEPARATE per-kind distance gate
   (dash: `55<dist<~160`, pounce: `60<300`, melee: `≤106`, leap: `70<240`, proj: `<460`).

When they disagree, bugs emerge structurally. Proven example: a pure-DASH kit's READY band is
min=38/max=109, but the dash only FIRES at `dist>55` — so the cat parks at 38–55 (inside its own
fire-floor) and never triggers → "突进猫在不远处干等" (user report). Every role-specific band is a
chance for a new mismatch; we've been patching one kit at a time.

## Principle
**One source of truth for "where this skill wants to be used" drives BOTH movement and firing.**

Introduce `engageRange(skill, f) → {fireMin, fireMax, ideal}`:
- derived from the skill's kind + reach + projectile speed (the numbers already live in `offensive`).
- `offensive()` uses it verbatim to decide "can I fire now?" (`fireMin ≤ dist ≤ fireMax`).
- `kitRangeBand()` builds the movement band from the READY skills' engageRanges:
  - **ready** attack kit → stand at `ideal` of the best ready skill (ALWAYS inside its fire window).
  - **all on cooldown** → fade to a safe kite distance (outside enemy effective range) and wait.
- INVARIANT (new test INV-5): for any ready attacking kit, the movement band ⊆ at least one ready
  skill's [fireMin,fireMax]. Structurally impossible to "stand where you can't attack".

## Behavior the user explicitly wants
- **Dasher = hit-and-FADE**: approach while AVOIDING damage (weave/respect telegraphs), commit the
  dash when in window, then FADE OUT (retreat to safe distance) during cooldown instead of loitering
  in melee. This is the classic skirmisher loop. Needs: an "approach vector that biases away from
  incoming projectiles" + a post-attack fade impulse.
- Rules like approach-bias, fade-distance, re-commit timing should be **evolved by the simulation
  agent**, not hand-tuned. The sim harness measures: dmg-taken-while-approaching, time-to-first-hit,
  loiter% (frames in dead-zone), hit-rate, fade% (frames retreating on cooldown).

## Scope discipline
- Refactor ONLY `kitRangeBand` + `smartAutoAction/offensive` + a small `engageRange` helper + the
  approach/fade steering. Do NOT rewrite all 5700 lines (owner pushes battle.js every few minutes;
  big diffs = merge hell + breaks ~20 CI assertions).
- Keep all skill ids + existing public method signatures (CI pins them).
- Every change gated by `scripts/check-cat-bond-invariants.mjs` (INV-1..4 live; INV-5 to add).

## Open questions for the panel
1. Is utility-scoring per candidate action (fire X / basic / reposition / dodge) worth it here, or is
   the engageRange-unification enough to kill the bug class? (bias: smallest change that removes the
   class, not a full behavior tree.)
2. Hysteresis to avoid dithering between approach/fade — timer lock vs state machine?
3. How to make "avoid damage while approaching" cheap (no pathfinding): projectile-threat gradient?
4. What's the SOTA for lightweight real-time action-game/MOBA bot steering (context steering /
   steering behaviors / utility AI) that fits a Canvas2D game with ~10 entities?
