# RSI SOTA Survey + Upgrade Plan for the Cat Bond RSI Harness

Status: design doc only. Changes NO code. Benchmarks the in-repo RSI harness
(`scripts/rsi/`) against the current state of the art in recursive self-improvement (RSI)
and self-improving AI, then gives a prioritized, concrete upgrade plan with the exact code
seam each change plugs into.

## 0. What we actually have today (grounded in the files, not invented)

The harness is a clean **generator → verifier** loop in four files:

- **`scripts/rsi/evaluator.mjs`** — the deterministic fitness oracle. Boots the real
  `public/cat-bond/js/battle.js` under a fake DOM + `vm` sandbox (`boot()`, L63-145), pins
  `Math.random`/`Date.now` per seed so a run is a pure function of `(seed, config)`
  (`withDeterministicGlobals`, L162-168), and drives 3 scenarios — `solo-pinned`,
  `solo-live`, `multi` (L207-208). `evaluate(config, opts) -> {perScenario, aggregate}`
  (L375-396) returns raw + a normalized `{survival, win, output, positioning, efficiency,
  speed}` vector (`normalize`, L332-343). Reward is kept **separate** behind
  `scoreConfig(result, rewardModel)` (L457-470): `rewardModel` is `undefined` (baseline
  weighted sum, `DEFAULT_WEIGHTS` L406-408), a `{weights}` object, or a function
  `(result, ctx) => number` — the external-proxy seam.
- **`scripts/rsi/optimize.mjs`** — a **(1+1)-ES** with Rechenberg 1/5-success step adaptation
  (`optimizeCell`, L133-168) over a 3-scalar bounded vector `SPACE = [min, max, dodge]`
  (L74-78). One parent, one mutated child/iter, keep-if-better by `scoreConfig`. Three
  hand-listed `CELLS` (fighter/assassin/dps, L176-195). Trains on `[7,42,101]`, re-scores the
  winner on disjoint held-out `[13,202,999]`, and labels wins OVERFIT/WEAK/GENERALIZES
  (L264-273). Writes `optimized-params.json`; never edits the game.
- **`scripts/rsi/propose.mjs`** — the **FunSearch/Eureka-shaped structural proposer**. A
  `CANDIDATE` schema (L52-70) where each candidate carries a positioning **rule as code**
  (`band: (f) => ({min,max,rush,role,hp})`) and/or a proposed `rewardModel`. Candidates are
  **hand-authored** (`CANDIDATES` array, L172-225) — baseline, two real rules, one
  deliberately-bad control. The `JUDGE` (L166) is `mobaGroundTruthJudge` (L145-162), a
  hand-written MOBA-derived rubric (derivation in `.claude/moba-ai-groundtruth-spec.md`).
  Ranks by the judge; asserts the control ranks last.
- **`scripts/rsi/rsi-loop.mjs`** — the standing orchestrator (cron ~3h). Runs `optimize.mjs`
  + `propose.mjs`, greps their stdout, appends one line to `rsi-history.log`. Proposes only;
  no auto-edit, no push, no deploy.

**So the shape today is:** deterministic evaluator + verifier/judge + (1+1)-ES numeric
optimizer + hand-authored structural proposer + a standing loop. Explicitly **absent**: no
learned/ensemble reward model (the judge is a fixed hand rubric), no LLM/agent proposer wired
(the `band` functions are human-written — the code even says so, propose.mjs L12-16), no
population/archive (optimizer keeps **one** point per cell; proposer keeps a leaderboard but
discards everything but the winner), no novelty/behavioral-diversity search, no
self-modification of the proposer/judge.

---

## 1. SOTA survey — what each is, and why it matters to US

Accurate titles/authors/venues/years. "Matters to us" is judged against our actual problem:
a cheap, fully deterministic combat-param + positioning-rule search judged by a MOBA proxy,
with Claude subagents available as free proposers/judges but no external API key and a real
token budget.

### Program/agent evolution with an LLM proposer (the core family we're closest to)

1. **FunSearch** — Romera-Paredes, Barekatain, Novikov, et al., *"Mathematical discoveries
   from program search with large language models,"* **Nature 2024**. An LLM (code model)
   mutates a small Python function; a **deterministic evaluator scores it**; best programs are
   stored in an **islands-based** evolutionary database and fed back as few-shot context.
   Found new constructions for the cap-set problem and better bin-packing heuristics.
   **Why it matters to us:** this is almost exactly our `propose.mjs` shape — propose a
   *function* (our `band`), score with a ground-truth evaluator (our `evaluate`) — except
   FunSearch's proposer is an LLM and it keeps an **island population with few-shot
   feedback**, while ours is a static hand-written `CANDIDATES` list with no memory. This is
   the single most relevant precedent.

2. **AlphaEvolve** — Novikov, et al. (Google DeepMind), *"AlphaEvolve: A coding agent for
   scientific and algorithmic discovery,"* **technical report, 2025**. Generalizes FunSearch:
   a Gemini ensemble (fast + strong) evolves **whole code files / diffs** (not one function),
   with an automated evaluation pipeline and a program database; improved a 4×4 complex matrix
   multiplication bound, data-center scheduling, and kernel/hardware snippets.
   **Why it matters to us:** it's the maturation of the exact loop we have — but evolving
   *diffs over a file* and running an ensemble of a cheap + strong proposer. The cheap/strong
   split maps cleanly onto Haiku-proposer / Opus-judge with our token budget. Full
   file-evolution is likely **overkill** for a 3-scalar + one-function search; the
   diff-over-a-rule idea is the useful part.

3. **Eureka** — Ma, Liang, Wang, et al. (NVIDIA/UPenn/Caltech), *"Eureka: Human-Level Reward
   Design via Coding Large Language Models,"* **ICLR 2024**. An LLM writes **reward-function
   code**, a simulator evaluates policies trained on it, and reward functions are **evolved**
   with reflection on fitness feedback; GPU-parallel evaluation.
   **Why it matters to us:** `propose.mjs` already treats a `rewardModel` as a first-class
   candidate (`REWARD_CANDIDATE`, L230-246) and the evaluator's `scoreConfig` function-seam is
   built for exactly this. Eureka is the blueprint for *evolving our judge/reward as code*
   instead of hand-writing `mobaGroundTruthJudge`. Highly applicable; our sim is the cheap
   deterministic evaluator Eureka assumes.

4. **ADAS / Meta Agent Search** — Hu, Lu, Clune, *"Automated Design of Agentic Systems,"*
   **2024 (ICLR 2025)**. A "meta agent" **programs new agents in code**, stores them in a
   growing **archive**, and reads the archive to invent better ones; discovered agent designs
   that transfer across domains.
   **Why it matters to us:** same archive-of-code-candidates idea, one level up (agents vs
   rules). The reusable lesson is the **archive as few-shot memory** for the proposer — our
   proposer currently has zero memory between cron cycles. Designing whole *agents* is
   overkill; the archive mechanism is not.

5. **STOP (Self-Taught Optimizer)** — Zelikman, Lu, Goodman, et al., *"Self-Taught Optimizer
   (STOP): Recursively Self-Improving Code Generation,"* **COLM 2024**. A seed "improver"
   program calls an LLM to improve an arbitrary solution; then it is pointed **at itself** to
   improve the improver. Improves the *scaffold*, not model weights.
   **Why it matters to us:** this is the self-referential upgrade of our proposer — have the
   proposer rewrite `propose.mjs`'s own candidate-generation logic. Powerful but **the
   riskiest** item for us: it needs strong sandboxing and a held-out anti-reward-hacking gate,
   and the payoff on a tiny fixed search space is modest. Worth prototyping behind a hard gate,
   not running unattended.

6. **Darwin Gödel Machine (DGM)** — Zhang, Hu, Lu, Lange, Clune, *"Darwin Gödel Machine:
   Open-Ended Evolution of Self-Improving Agents,"* **Sakana AI / UBC, 2025**. An *empirical*
   relaxation of Schmidhuber's Gödel machine: instead of requiring a proof that a self-edit
   helps, it **empirically validates** each self-modification on a benchmark and keeps an
   **open-ended archive** of agent variants (Darwinian, not greedy). Improved its own coding
   agent on SWE-bench/Polyglot. Related: **Gödel Agent** (Yin et al., 2024) — runtime
   self-modification of an agent's own logic.
   **Why it matters to us:** the "empirical validation instead of proof + keep an archive of
   variants" is precisely the safe way to do self-improvement, and our deterministic evaluator
   is the validator. But DGM self-modifies a *general coding agent*; our search is tiny and
   fixed. The **transferable idea is the archive + empirical gate**, which we also get from
   MAP-Elites far more cheaply. Full self-rewriting is overkill here.

7. **Promptbreeder** — Fernando, Banarse, Michalewski, Osindero, Rocktäschel (DeepMind),
   *"Promptbreeder: Self-Referential Self-Improvement via Prompt Evolution,"* **2023**.
   Evolves task-prompts *and* the mutation-prompts that mutate them (self-referential), scored
   on task fitness.
   **Why it matters to us:** if/when we wire an LLM proposer, Promptbreeder is how you keep its
   **proposal prompt** improving instead of static — evolve the instruction we give the Claude
   proposer. Only relevant *after* an LLM proposer exists; until then, N/A.

### Reward / judge learning (our judge is the weakest link)

8. **Self-Rewarding Language Models** — Yuan, Pang, Cho, Sukhbaatar, Xu, Weston (Meta),
   *"Self-Rewarding Language Models,"* **2024**. The model acts as its own **LLM-as-judge** to
   generate preference rewards for its own outputs, then trains on them (iterative DPO),
   improving both the policy and its own judging.
   **Why it matters to us:** our `scoreConfig` function-seam *is* the LLM-as-judge injection
   point (evaluator.mjs L432-456 documents exactly this), and the spec already sketches an
   `llmJudge`. The caution Self-Rewarding surfaces — the judge can drift / reward-hack — is why
   any learned judge must be **anchored to the deterministic engine metrics** (blend with
   `ctx.baseline()`), never replace them.

9. **Process/outcome reward models & "generator–verifier" grounding** — e.g. Lightman et al.,
   *"Let's Verify Step by Step,"* **2023** (process reward models); the broader
   evaluator-grounded paradigm behind FunSearch/AlphaEvolve. The unifying principle: **a cheap,
   trustworthy verifier is what makes RSI safe and non-circular** — you only keep what the
   verifier certifies.
   **Why it matters to us:** this is the thing we already do *right*. The evaluator is
   deterministic, has committed negative controls (evaluator.mjs L518-546), and the optimizer
   has a held-out generalization gate (optimize.mjs L264-273). Our verifier is our strongest
   asset; the upgrades should **lean on it harder**, not weaken it.

### Open-ended science / agent pipelines (context, mostly out of scope)

10. **The AI Scientist** — Lu, Lu, Lange, Foerster, Clune, Ha (Sakana AI),
    *"The AI Scientist: Towards Fully Automated Open-Ended Scientific Discovery,"* **2024**
    (and **AI Scientist v2, 2025**). End-to-end loop: idea → code → run experiments → write +
    review a paper.
    **Why it matters to us:** mostly a *framing* precedent — a standing autonomous
    research loop with an automated reviewer, which `rsi-loop.mjs` is a miniature of. Its
    automated-reviewer idea could inform a better history/report step, but the full pipeline is
    **out of scope** for a combat-param search.

### Quality-Diversity — the archive backbone (most immediately useful theory)

11. **MAP-Elites** — Mouret & Clune, *"Illuminating search spaces by mapping elites,"*
    **2015**. Discretize a low-dim **behavior space** into a grid; keep the single best
    (elite) solution per cell. Yields a **diverse archive** of high-performers across behaviors
    instead of one global optimum, and empirically improves the optimum too (stepping-stones).
    **Why it matters to us:** this is the **highest-leverage, lowest-risk** idea for us. Our
    optimizer collapses each cell to one `(min,max,dodge)` point and the proposer throws away
    everything but the winner. A MAP-Elites archive keyed on behavior descriptors we *already
    compute* (e.g. mean engagement distance × survival, or playstyle = aggression vs kiting)
    would keep a **diverse set of winning rules** — exactly the deliverable the prompt asks
    for — with trivial code and zero extra sim cost.

12. **Novelty Search** — Lehman & Stanley, *"Abandoning Objectives: Evolution Through the
    Search for Novelty Alone,"* **Evolutionary Computation 2011**; and **CMA-ME** (Fontaine et
    al., GECCO 2020) combining CMA-ES-style adaptation with MAP-Elites.
    **Why it matters to us:** behavioral-diversity pressure escapes the "seed notch"/local
    optimum the optimizer's own header warns about (optimize.mjs L25-29). We can compute a
    behavior descriptor from existing metrics (`posPct`, mean distance, `actsPct`) and reward
    distance-to-archive. Useful as a secondary pressure; pure novelty (no objective) is
    overkill — we have a good objective.

---

## 2. Gap analysis — do we have it, and is it worth adopting HERE?

| SOTA idea | Have it? | For THIS problem (cheap deterministic param+rule search, MOBA proxy judge) |
|---|---|---|
| **Generator→verifier, evaluator-grounded (FunSearch core)** | **Yes** | Core strength. Deterministic evaluator + held-out gate + negative controls. Keep and lean harder on it. |
| **Deterministic verifier with negative controls** | **Yes** | Strong asset (evaluator.mjs L518-546). Don't weaken. |
| **Held-out generalization / anti-overfit gate** | **Yes (optimizer only)** | Present in `optimize.mjs` (L264-273); **missing in `propose.mjs`** — structural rules are judged on one seed set with no held-out re-score. Worth fixing (cheap). |
| **MAP-Elites / QD archive** | **No** | **Worth it, top pick.** Turns "one winning point" into "a diverse set of winning rules." Near-zero cost, directly matches the ask. |
| **Novelty / behavioral-diversity metric** | **No** | Partial-worth. Good as a secondary pressure to dodge local optima; pure novelty search is overkill (we have a real objective). |
| **LLM/agent proposer writing rules as code (FunSearch/AlphaEvolve/Eureka)** | **No (seam exists, not wired)** | **Worth it.** The `band` and `rewardModel` candidate seams (propose.mjs L52-70) are built for it. Claude subagents are free here. Island/diff-evolution of *whole files* is overkill; evolving the **one `band` function + the reward** is the right scope. |
| **Program database / island populations with few-shot feedback** | **No** | Worth a lightweight version: an archive file the proposer reads as few-shot context across cron cycles (today it has zero memory). Full multi-island migration is overkill at our scale. |
| **Learned/ensemble reward model (vs single hand rubric)** | **No (single hand rubric)** | **Worth it, partial.** The judge is the weakest link. An *ensemble* of cheap judges (MOBA rubric + engine baseline + an LLM judge, blended) is cheap and robust. A fully *learned* reward model (train a net on labels) is overkill — we have no label corpus and the sim already gives ground truth. |
| **LLM-as-judge (Self-Rewarding)** | **Seam only** | Worth it behind an anchor. Must blend with `ctx.baseline()` to resist drift/hacking. Cheap with a subagent. |
| **Self-referential proposer/judge improvement (STOP / DGM / Gödel)** | **No** | **Mostly overkill + riskiest.** Payoff on a tiny fixed space is small; needs hard sandboxing + anti-reward-hacking held-out gate. Prototype one guarded step at most; do **not** run unattended. |
| **Promptbreeder (evolve the proposal prompt)** | **No** | N/A until an LLM proposer exists; then a nice-to-have. |
| **Whole-file / diff evolution (AlphaEvolve)** | **No** | Overkill. Our search surface is a 3-scalar vector + one function; evolving whole files adds risk, not reach. |
| **Open-ended science pipeline (AI Scientist)** | **Miniature (rsi-loop)** | Out of scope beyond a better history/report step. |
| **MCTS / learned policy (OpenAI Five-style)** | **No** | Out of scope (also noted in the judge spec §1b). The RSI search *is* our policy-improvement layer. |

**Honest bottom line:** we already nail the hard, safety-critical part (a grounded
deterministic verifier). The famous *self-rewriting* headliners (STOP, Darwin Gödel Machine,
Gödel Agent) are the **least** worth it here — high risk, low marginal payoff on a tiny fixed
search. The quietly-foundational idea (MAP-Elites) and the proposer upgrade (LLM-written rules
+ a memory archive) are where the real wins are.

---

## 3. Prioritized, concrete upgrade plan

Ranked by (expected win ÷ effort × safety). Each names the exact code seam.

### P1 — MAP-Elites archive of diverse winning rules *(highest leverage, lowest risk)*
- **What:** Add a quality-diversity archive. Define a 2-D behavior descriptor from metrics the
  evaluator **already emits** — e.g. `(meanEngagementDist, survival)` or
  `(aggression = actsPct, kiting = posPct-band-center)`. Discretize into a grid (say 6×6); keep
  the best-by-`scoreConfig` candidate per cell. Both the optimizer's accepted points and the
  proposer's candidates feed the same archive; emit `rsi-archive.json` (a *set* of winning
  rules, not one point).
- **Where:** new `scripts/rsi/archive.mjs` (pure data structure: `add(descriptor, candidate,
  score)`, `elites()`); descriptor computed from `result.perScenario[...]` fields already
  present (`posPct`, `actsPct`, `hpFracLeft`). Wire into `optimizeCell` (optimize.mjs L147-166,
  at each accepted child) and into `main()` of propose.mjs (L268-269, each `runCandidate`).
- **Effort:** ~0.5 day. No new sim cost — descriptors come from existing metrics.
- **Win:** Directly delivers "a DIVERSE set of winning rules instead of one point." Also seeds
  P2's proposer with varied few-shot exemplars, and empirically (per MAP-Elites) finds a
  *better* global optimum via stepping-stones.

### P2 — LLM/agent proposer that writes `band` rules (and reward models) as code
- **What:** Replace the static `CANDIDATES` list with a generator that spawns a Claude subagent
  (free here, no API key) to emit new candidates in the **existing schema** (propose.mjs
  L52-70): a `band: (f) => ({min,max,rush,role,hp})` function body + rationale, optionally a
  `rewardModel`. Feed the MAP-Elites archive (P1) as few-shot context (FunSearch/ADAS style).
  Validate each returned function in a sandbox (it must be a pure function of `f`, return finite
  `{min,max}`), then score with the real evaluator. Keep the hand-written candidates as a
  permanent regression floor + the deliberately-bad control.
- **Where:** `propose.mjs` `CANDIDATES` array (L172-225) becomes `CANDIDATES =
  [...SEED_CANDIDATES, ...(await proposeFromLLM(archive))]`; `toConfig` (L71-76) already turns a
  `band` into eval config unchanged. The subagent call sits beside `main()` (L268).
- **Effort:** ~1-1.5 days (subagent prompt + sandbox validation of returned code + archive
  plumbing).
- **Win:** This is the actual FunSearch/AlphaEvolve/Eureka step — open-ended discovery of
  *structural* rules a scalar sweep can't express (branching on cooldown/HP/enemy-count), with
  real novelty across cron cycles instead of a fixed list. Biggest capability jump.
- **Safety:** proposer emits rules scored by the deterministic verifier and written to JSON
  only — same propose-don't-apply model as today (rsi-loop.mjs L9-12). Sandbox the returned
  function (no `require`/network/globals); reject non-finite outputs.

### P3 — Ensemble/blended judge + held-out gate for the proposer
- **What:** (a) Make the judge an **ensemble**: `0.5*mobaGroundTruthJudge +
  0.3*ctx.baseline() + 0.2*llmJudge`, where `llmJudge` is a Claude subagent given
  `result.perScenario` JSON and returning a 0..1 label (the seam at evaluator.mjs L432-456 and
  the spec's sketch). Anchoring to engine metrics defeats drift/reward-hacking (the
  Self-Rewarding caution). (b) Port the optimizer's **held-out re-score** (optimize.mjs
  L264-273) into `propose.mjs` so a structural rule must beat baseline on **held-out seeds**,
  not just the training seeds, before it's called a win.
- **Where:** judge binding `const JUDGE = ...` (propose.mjs L166) → an ensemble function; new
  held-out evaluation in `runCandidate` (propose.mjs L251-260) mirroring optimize.mjs's
  train/held split.
- **Effort:** ~0.5 day for the held-out gate; +0.5 day if wiring the LLM judge subagent.
- **Win:** Closes the biggest honesty gap (structural rules currently have no generalization
  gate) and makes the judge robust via disagreement across independent judges. Low risk.

### P4 — Novelty/behavioral-diversity bonus in the optimizer
- **What:** Add an optional novelty term: reward a child partly for distance (in behavior-
  descriptor space from P1) to the current archive, not just raw `scoreConfig`. Keep it a small
  secondary pressure (objective still dominates).
- **Where:** `optimizeCell` acceptance test (optimize.mjs L154-155): `childFit = score +
  λ*noveltyVsArchive(descriptor)`. Needs P1.
- **Effort:** ~0.5 day (after P1).
- **Win:** Escapes the "seed notch" local optimum the optimizer explicitly worries about
  (L25-29); fills archive cells faster. Moderate win, cheap once P1 exists.

### P5 — Self-referential improvement of the proposer/judge (STOP / DGM-style) — *prototype only, hard-gated*
- **What:** One guarded experiment: let a subagent propose an edit to the proposer's *own*
  generation prompt (Promptbreeder) or to `mobaGroundTruthJudge`'s weights/terms (Eureka on the
  reward). Accept an edit **only if** it increases held-out performance of the *downstream*
  search *and* doesn't change the deliberately-bad control's last-place ranking (anti-reward-
  hack tripwire). Never self-edit the evaluator or `battle.js`.
- **Where:** a new opt-in `scripts/rsi/meta.mjs` that treats `propose.mjs`'s prompt / the JUDGE
  weights as the mutable artifact; the evaluator (evaluator.mjs) stays **immutable ground
  truth**. Gate reuses the held-out machinery from P3.
- **Effort:** ~2-3 days, most of it sandboxing + the anti-hacking gate.
- **Win:** Small on a tiny fixed space; this is the "interesting but mostly overkill" item.
  Highest risk (a self-modifying loop can reward-hack its own judge). **Do not run
  unattended**; keep the evaluator and its negative controls as the immovable anchor.

---

## 4. The single "do this next" recommendation

**Do P1 — the MAP-Elites archive — first.** It is the highest-leverage, lowest-risk,
cheapest change, it *directly* delivers the requested "diverse set of winning rules instead of
one point," and it is the enabling substrate for P2 (few-shot exemplars for the LLM proposer)
and P4 (novelty distance). It adds **zero** simulation cost because the behavior descriptors
are computed from metrics the evaluator already returns, and it touches nothing safety-critical
(the evaluator, the game, the propose-don't-apply discipline all stay exactly as they are).

**Exact code seam:** add `scripts/rsi/archive.mjs` exporting a MAP-Elites grid keyed on a
behavior descriptor built from existing `result.perScenario[...]` fields (`posPct`/`actsPct`/
`hpFracLeft` → `(engagementStyle, survival)` cell), then call `archive.add(descriptor,
candidate, scoreConfig(result, JUDGE))` at two existing points: each accepted child in
`optimizeCell` (optimize.mjs L154-155) and each `runCandidate` in `propose.mjs` (L268-269).
Dump `rsi-archive.json` from `rsi-loop.mjs` next to `rsi-history.log`. No change to
`evaluate`, `scoreConfig`, or `battle.js`.
