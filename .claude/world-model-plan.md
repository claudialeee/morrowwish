# Cat Bond combat "world model" + verifier-gated AI improvement — plan (SOTA-grounded)

Status: building Phase ① locally. NO PUSH until owner reviews (user asleep, explicit no-push).

## SOTA verdict (research-grounded, citations in agent log)
- World model = **thin snapshot/restore/rollout wrapper around the REAL battle.js**, NOT a
  learned neural model. We own the exact rules → a net (Dreamer/Genie/GameNGen/DIAMOND) would
  be a slower, lossy copy. Borrow vocabulary only.
- Determinism retrofit (minimal): seed the PRNG (mulberry32) threaded through the battle;
  serialize RNG state in snapshots; fixed dt. State-serialize (structuredClone of ~10 plain-
  number entities), NOT input-replay (overkill at this scale). Borrow GGPO's snapshot/restore
  primitive only — no netcode/prediction.
- Improvement loop = two-tier, VERIFIER-GATED: CMA-ES/(1+1)-ES numeric tuning (inner) + LLM-as-
  proposer for structural heuristics (outer, Eureka/FunSearch shape); archive/league prevents
  regression. "RSI" honestly = automated verifier-gated iteration (compounding comes from the
  verifier = the sim, AlphaZero-style). Not AGI.
- Challenger = regret-driven scenario search (QD/MAP-Elites or LLM-proposed configs) → configs
  where current AI loses/stalls → hardening curriculum + permanent regression fixtures.
- DO NOT BUILD: learned world model, neural-RL/self-play leagues/PBT/GPU, rollback netcode
  machinery, PAIRED neural adversary, LLM in the 60fps loop.

## The one insight that orders everything
**Everything depends on the deterministic VERIFIER first.** The compounding in every SOTA
improvement loop (AlphaZero, Eureka, FunSearch) comes from a ground-truth verifier, not the
proposer. So: build the deterministic sim + metrics + invariants FIRST; optimizer/challenger
are worthless without it.

## Phases (each lands locally, green `npm run check`, committed; NOT pushed)
① **Deterministic verifier** (the foundation)
   - minimal seeded-RNG injection into battle.js: a `this.rng()` (mulberry32) seeded per-battle;
     route only DECISION-RELEVANT Math.random() through it (dodge roll, target pick, pack build,
     crit/variance). Leave cosmetic VFX jitter on Math.random() — determinism of OUTCOME, not pixels.
   - fixed-dt stepping already exists (update(dt) with dt*=0.8 global). Sim uses constant dt.
   - fork the proven /tmp/combat-sim.mjs → scripts/check-cat-bond-combat-matrix.mjs: real
     b.update() over kit×build matrix, metrics (inWindow% / loiter% / fade% / TTK), + INVARIANTS
     (every healthy cell inWindow≥X, loiter≤Y). Wire into check-source.mjs (CI).
   - verify same seed → identical run (determinism unit check).
② **Challenger loop** (adversarial edge cases) — agent searches scenario-config space for
   regret (AI loses/stalls); survivors frozen as matrix fixtures. READ-ONLY on game; grows the test.
③ **engageRange unification** (the actual AI fix the matrix flagged: hybrid/melee-backline
   loiter 30-49%) — now VERIFIABLE against the matrix. Band derived from same per-skill fire
   window offensive() gates on.
④ (only if owner wants) numeric optimizer (CMA-ES) over enemy-AI param vector, sim as fitness.

## Guardrails
- No push. Owner churns battle.js every few min → small diffs, merge cleanly, stop on conflict.
- Phase ③ changes combat feel → land infra (①②) + propose, let owner decide before shipping feel.
- Seeded RNG must not change live gameplay feel when unseeded (default path = Math.random()).

---
## Progress log (local, unpushed — user asleep)
- Phase ①a DONE (commit 3c08a63): seeded RNG hook. this.rng() defaults to Math.random (live
  unchanged); seedRng/ctor{seed} → mulberry32. Verified same seed=identical, unseeded=varies.
- Phase ①b DONE (commit 2bcfc87): completed decision-path RNG retrofit (auto-decision cadence
  was the dominant leak — found honestly after the matrix exposed non-determinism I'd
  under-claimed). scripts/check-cat-bond-combat-matrix.mjs: deterministic kit×build verifier,
  36 healthy cells regression-locked + 12 tracked-broken, wired into CI. npm run check green 3x.
  Real stable baseline captured: ranged/beam/support=100%, dash/leap~90%, melee~48% (natural),
  pounce~60-79%, HYBRID=6-47% inWin / up to 40% loiter (the real target).
- Phase ② METRIC OVERHAUL (uncommitted, in 2-round review): two challenger rounds DEMOLISHED the
  original inWindow/loiter metric as a LIE, twice:
    R1: the "hybrid 6-47% broken" verdict was a Q-only-inWindow artifact (a hybrid poking with its
        ranged E read as loiter). Widened to per-skill (Q OR E OR basic) inWindow → every cell 93-100%.
    R1 (deeper): even per-skill inWindow was contaminated — simCell re-pinned only e.y and let the
        enemy AI drive e.x to CHASE, so inWindow measured the enemy closing, not the cat. A FROZEN cat
        passed 6/8 archetypes. For ranged/support/hybrid the union window = 460px = whole arena →
        structurally unfailable. VERDICT NO-GO.
    R2: bandHold (first fix attempt) was CIRCULAR — it graded the cat against its OWN
        kitRangeBand(f), the very function a positioning bug lives in. Injecting the historical
        brawler-backline bug (kitRangeBand→[230,320]) scored 76% "healthy" because the cat obeys
        the broken ruler. VERDICT NO-GO again.
  FINAL FIX (GO — same adversary, R3): enemy FULLY pinned (reassert e.x+e.y+zero velocity every
  frame → no chase); THREE ground-truth signals graded against a FIXED verifier-OWNED envelope
  (NOT kitRangeBand):
    inEnv% = frames the cat's distance is inside ENVELOPE[kind] (brawlers ≤185-200, kiters ≤245-250).
             Fixed constant → a band bug can't self-certify. Floor 70 (worst healthy 90; every
             regression ≤26).
    acts%  = frames the cat actually attacked (enemy lost HP, or a live player projectile). Floor 10
             (worst healthy 22). Catches "positions but never fights" (incl. band-widened-to-arena).
    dmg    = PER-ARCHETYPE floor at ~45% of each kind's worst-healthy (dash 450, leap 360, hybrid 500…).
  COMMITTED NEGATIVE CONTROLS (all must FAIL inEnv, for every applicable archetype): frozen,
  450px-runaway, backline-band [230,320] (brawlers), widened-band [0,1000]+frozen@300. All caught
  (inEnv 0-26%). All 48 cells + controls green 3×; every gate proven to bite (sed self-tests). The
  SAME challenger that issued both NO-GOs re-ran its own killer attacks and returned GO. COMMITTED.
- Phase ③ (engageRange unification) = NOT NEEDED as originally framed. The "12 broken cells" was a
  metric phantom across TWO bad metrics; under the honest envelope verifier all 48 cells position
  correctly and deal damage. Verifier survives owner's battle.js churn (re-ran post-merge vs owner's
  poise-rework: identical within noise). Any FUTURE positioning change is now graded honestly.
- Verifier SCOPE (printed by the test): certifies single-enemy engagement distance + offensive
  output + action-taken vs a stationary target. Does NOT certify survivability (pinned enemy barely
  attacks — decertified honestly rather than faked), target-switching, or multi-enemy (future work).
- HONEST NOTE: the verifier-first + two-round-review discipline caught my OWN lies FOUR times
  (under-claimed determinism; Q-only inWindow artifact; enemy-chase contamination; circular bandHold).
  Every one found by the adversary, not me. This is exactly why the mandatory two-round rule exists.
