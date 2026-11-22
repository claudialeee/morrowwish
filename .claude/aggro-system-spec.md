# Cat Bond 仇恨/威胁系统 (option A) — design spec for owner review

Status: SPEC ONLY — no combat code changed. Changes combat FEEL, needs owner go-ahead.

## Why (data-backed)
4 consecutive adversarial playtests converge on ONE root: a button-masher (hold attack,
never dodge/skill) coasts to a flat 100% win-rate victory lap. The sharpest diagnosis
(cycle @1ed183d) is that the game's two escalation systems key off FLAWLESSNESS, not
DOMINANCE, so they never fire for the dominant casual profile:
- `stompStreak` only increments on a LITERALLY zero-damage win (`won && dmgTaken<=0`,
  battle.js ~1712) → a masher takes ~47 dmg/fight → resets every battle → the
  foe-sharpening built to punish dominators NEVER engages.
- within-fight `_pressure` only accrues while `teamHpFrac>0.88` (~3379) → one chip drops
  it below → the must-dodge smash switches OFF exactly when the fight gets real.
Net: the game punishes PERFECTION and rewards sloppy DOMINANCE with the easiest run.

## Design: AGGRO as a continuous "how are you playing?" signal (systemic, not a hack)
Instead of hard-coding "if 6s basic-only then smash", give each enemy a per-fight AGGRO
meter 0..1 that tracks the PLAYER's behaviour and drives escalation smoothly:

  aggro rises when the player plays passively/monotonously:
    + holding basic with no Q/E/ult/dodge           (+ per second of basic-only)
    + standing/strafing in place (low positional variety)
    + dominating by margin (hpFrac high) — the re-anchored dominance signal
  aggro falls when the player engages the toolbox:
    − casting Q/E/ult                                (− per cast)
    − dodging (esp. a perfect dodge)                 (− per dodge)
    − landing a stagger-break / combo reaction       (− per break)
    − taking real damage (the fight is already honest) 

  decay toward a baseline each second so it's a rolling window, not permanent.

## What aggro DRIVES (escalation tiers, all already-built levers — just re-gated)
  aggro低 : normal fight (today's feel for an engaged player)
  aggro中 : enemy fires faster + leads better (reuse _stomp→aiReact/aiJitter/lead 145-150)
  aggro高 : the telegraphed must-dodge SMASH starts firing, aimed at the player (reuse
            the ~3797 smash; see fixes below so drift can't free-dodge it)
  aggro满 : "armored guard" state — ~80% flat reduction vs UNMARKED basics, decaying only
            to burst/stagger/ult/reaction → a pure masher hits a wall it literally cannot
            basic through inside the 70s cap, so it MUST press one Q/E/R or land a break.

## The 2 mis-gate fixes the playtest pinned (fold INTO aggro, the minimal core)
1. battle.js ~1712: stompStreak increment `won && dmgTaken<=0` → `won && hpFrac>=0.75`
   (hpFrac already computed ~1706). An 80%-HP win now counts as dominance.
2. battle.js ~3379: `_pressure` accrual gate `teamHpFrac>0.88` → `>0.60` so the rubber-band
   keeps climbing while the player is clearly winning instead of collapsing on a scratch.
(These two alone are a ~2-line "minimal aggro" — do them first, measure, THEN layer the
full meter + armored-guard tier if the masher still coasts.)

## Smash teeth (so the high-aggro tier is a REAL reaction test, not flavor)
- retarget `smashTarget` to the player's LIVE position partway through the windup (so
  incidental WASD drift no longer free-dodges an 86px circle), OR R up to ~110 / windup
  down to ~1.0s. Keep it interruptible + telegraphed (readable, not unfair burst).
- a landed smash deals % of MAX HP (not flat e.dmg): ~35-45% 硬核 / ~18-22% 休闲,
  NON-LETHAL from full HP (preserves the no-death first-fight coach + casual accessibility),
  + short vulnerableT/slow tail. Keep the 0.85 shield-chip so DODGE (i-frames), not shield,
  is the correct answer — the move the telegraph already teaches.

## HARD guardrails (adversary + owner intent — MUST preserve)
- casual's 0.60 enemyDmg flat mult stays (accessibility).
- the no-death first-fight coach stays; smash non-lethal from full.
- DO NOT re-add a global basic-mash damage floor (that regressed task #45 soft-lock).
- the carrots (0.7× unmarked, poise/stagger, cast-interrupt) stay — the gap is the missing
  STICK, not the existing rewards.

## Validation (sim harness, before/after)
Re-run the playtest harness for the masher persona over 8 fights; targets:
- lowest hpFracLeft drops below ~0.5 (was ~0.80)
- ≥1 of 8 fights approaches a faint
- an engaged player (cautious/explorer persona) is NOT made meaningfully harder (aggro
  stays low for them) — i.e. the squeeze is specific to monotone play, not global difficulty.
Add an INV: aggro rises under basic-only input and falls after a cast/dodge (lock the signal).

## Scope / risk
Touches battle.js enemy-AI + escalation only (~3 functions: commitAiProfile gate, _pressure
gate, a new aggro accumulator + the smash/guard tier). Additive to existing systems. Owner
churns battle.js constantly → land in two passes: (1) the 2-line re-gate, (2) the aggro meter
+ armored-guard tier, each behind the invariant + a sim re-run.
