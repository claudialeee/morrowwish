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
