# MOBA / Game-AI Ground-Truth Scoring Spec for Cat Bond Combat

Status: design + drop-in code. Owner request: "use mature game-AI logic as a ground-truth reward
proxy." This document surveys the published game-AI paradigms that actually map to a 1-v-few arena
cat fight, maps each to the live engine (`public/cat-bond/js/battle.js`), derives a prioritized
scoring rubric from the metrics the deterministic simulator (`scripts/rsi/evaluator.mjs`) ALREADY
emits, and ships a drop-in `mobaGroundTruthJudge(result, ctx)` that replaces `goodCombatJudge`
in `scripts/rsi/propose.mjs`.

It changes NO game code. It is a scoring lens only.

---

## 0. The contract this must honor (verified against the code)

`scoreConfig(result, rewardModel)` in `evaluator.mjs` (lines 457-470) calls a function
`rewardModel` as `rewardModel(result, ctx)` and **throws unless it returns a finite Number**.
`ctx` is exactly `{ baseline(weights?), weightedSum(norm, weights), DEFAULT_WEIGHTS }`
(lines 458-462). Higher = better; scale is arbitrary (optimizers compare relative values only).

`result` shape (verified, evaluator.mjs lines 314-396):
- `result.perScenario['solo-pinned' | 'solo-live' | 'multi']` — each is a mean-over-seeds metric
  object with a `.norm` sub-vector and raw fields.
- `result.aggregate` — same shape, mean of the per-scenario means.

**The ONLY normalized keys that exist** (`normalize()`, lines 332-343), each clamped to [0,1]:
`survival`, `win`, `output`, `positioning`, `efficiency`, `speed`.

**The ONLY raw keys that exist** (lines 314-327):
`dmgDealt`, `dmgTaken`, `hpFracLeft`, `faints`, `won` (0|1), `timeToKill`, `actsPct`, `posPct`,
`negatedPct`, plus private `_enemyInitHp`, `_frames`, `_dt`.

Any rubric term below is phrased so it computes from THESE keys. Anything a mature paradigm wants
that the sim does not produce is flagged **NEEDS NEW METRIC** rather than faked.

Critical honesty note on the three scenarios (from the evaluator's own header, lines 30-41):
- `solo-pinned`: enemy is reasserted-pinned + velocity-zeroed every frame; it barely attacks.
  `survival≈1` there is **meaningless** — only `output`/`positioning` are real signal.
- `solo-live` / `multi`: real shipping enemy AI; these carry survival / target-switching /
  getting-surrounded. They are a **relative** signal (config A vs B under identical enemies),
  not an absolute difficulty rating.

So the rubric reads **output from the pinned scenario** and **survival/win from the live+multi
scenarios** — using each scenario only for what it can honestly certify.

---

## 1. Survey — mature paradigms that map to a 1-v-few arena cat fight

Each entry: one-line "what it is" + canonical source. Only paradigms that genuinely fit are kept;
rejected ones are listed in §1b with the reason.

1. **Utility AI / Infinite Axis Utility System (IAUS) — response curves.**
   Enumerate candidate actions (or, here, candidate *standoff distances*), score each by several
   weighted "considerations" passed through normalized [0,1] response curves, pick the argmax.
   *Source:* Dave Mark & Kevin Dill, GDC AI Summit "Improving AI Decision Modeling Through Utility
   Theory" (2010) and "Embracing the Dark Art of Mathematical Modeling in AI" (2012); Dave Mark,
   *Behavioral Mathematics for Game AI* (2009).

2. **Dota 2 bot-script `desire` / role system.**
   Valve's bot API scores every possible action as a scalar *desire* in [0,1]
   (`GetDesire`-family returns, e.g. `AbilityUsageThink` returns an ability + desire; `ModeDesire`
   for Roam/Push/Defend/Retreat/Fight), and assigns each bot a lane **role** (carry / support /
   offlane) that biases those desires. Highest-desire action wins each tick.
   *Source:* Valve, Dota 2 Bot Scripting API (`GetDesire`, `GetDesiredLane`, ability-usage "think"
   functions), https://developer.valvesoftware.com/wiki/Dota_Bot_Scripting .

3. **MOBA role theory — carry / peel / engage / disengage / kite / focus-fire / aggro
   management.** The canonical division of labor: front-line **engage/peel** (tanks absorb and
   body-block), back-line **carry** (deals sustained DPS from safety), **kiting** (attack while
   retreating to hold spacing vs melee), **focus-fire** (whole team concentrates one target),
   **disengage** (break off when a fight is lost), **aggro/threat management** (who the AI chooses
   to attack and who it exposes itself to).
   *Source:* established competitive-MOBA design vocabulary (Riot / Valve design talks, GDC
   "Designing Heroes" sessions); summarized in Dota 2 / LoL design literature.

4. **Behavior Trees (BTs).** A prioritized tree of selectors/sequences with guard conditions:
   the agent re-evaluates top-down each tick and runs the highest-priority satisfiable branch
   (flee-the-smash > dodge-the-shot > heal > shield > ult > skill > basic).
   *Source:* Damian Isla, "Handling Complexity in the Halo 2 AI" (GDC 2005); Millington & Funge,
   *Artificial Intelligence for Games* (BT chapter).

5. **Threat / influence maps.** A spatial scalar field summarizing danger (enemy fire, telegraph
   discs) and value; agents move down the threat gradient / toward value. A lightweight scalar
   variant is "predicted incoming damage in the next N seconds."
   *Source:* Dave Mark & Mike Lewis, GDC "Practical Influence Maps" / *AI Game Programming Wisdom*
   influence-map chapters; Millington & Funge (influence mapping).

6. **Lane equilibrium / last-hit priority as an output-vs-safety tradeoff.** In MOBA laning the
   agent must maximize farm (last-hit gold/output) while staying out of harass range — an explicit
   *tension* between output and safety that a good policy balances rather than maximizing either
   alone. Maps here as "deal real damage AND keep HP," not one at the expense of the other.
   *Source:* MOBA laning theory (Dota 2 / LoL last-hit + harass mechanics).

### 1b. Paradigms deliberately SKIPPED (don't force them)

- **Macro / objective AI (push lanes, take towers/Roshan, ward/dewarding, rotations, item/jungle
  economy).** This is the bulk of a real MOBA bot's `ModeDesire` logic. A 1-v-few arena cat fight
  has **no lanes, towers, economy, map vision, or rotations** — there is exactly one objective
  (down the pack, survive). Importing push/defend/farm desires would be theater. **Skipped.**
- **GOAP / HTN planners.** Multi-step symbolic planning toward changing goals buys nothing when the
  goal is fixed ("win the one fight"); the reactive BT + utility layer the engine already has is the
  right tool. **Skipped.**
- **Team draft / counter-pick / composition.** No draft phase exists. **Skipped.**
- **MCTS / learned (OpenAI Five-style) policies.** Out of scope for a *scoring proxy*; and the RSI
  loop in `propose.mjs` is itself the search layer. **Skipped.**

---

## 2. Mapping table — paradigm ↔ engine concept ↔ what's missing

| Paradigm | Where it already lives in `battle.js` | What the engine is MISSING vs the mature pattern |
|---|---|---|
| **IAUS response curves** | `kitRangeBand` (L1016-1110) literally enumerates candidate distances `d=20..top step 5`, scores each by weighted considerations `output/safety/closeness` via curves (`1-dev*dev` bell, quadratic hug penalty), keeps argmax. Header even cites "Dave-Mark IAUS style" (L993-994). | Utility is applied to **positioning only**. *Action* selection (`smartAutoAction`, L1333) is a hand-ordered BT, not utility-scored — no per-action desire score to compare "ult now vs save it," "poke vs commit." |
| **Dota 2 `desire` scalars** | No numeric desire. Actions are fixed-priority branches in `smartAutoAction`. The enemy `specialMeter` → telegraph → `unleashEnemySpecial` (L4428-4493) is a cadence gate, not a desire. | No `GetDesire`-style scalar per action; no "should I retreat vs fight" **mode desire** on the player side (retreat is only the HP-gated band push at L1106-1107, not a decision). |
| **MOBA role theory** | Full build→role table in `kitRangeBand.P` (L1049-1056): tank/fighter/assassin = frontline (low pref, wide tol), dps/control/support = backline (high pref, hug-penalty). Role tag returned (`'tank'/'bruiser'/'melee'/'ranged'/'support'/'basic'`, L1100-1104). Enemy roles ambusher/sharpshooter/skirmisher drive `enemyRangeBand` (L4284-4297). | **Focus-fire** across a pack is only "nearest / commanded target" (`commandedTarget`, `unwardedTarget` L1454) — no "concentrate the lowest-effective-HP enemy" logic. **Peel/body-block** (tank protecting a carry) does not exist — allies don't guard each other. **Disengage** is a passive band-shift, not a committed retreat-and-reset. |
| **Behavior Trees** | `smartAutoAction` (L1333-1406) is a textbook prioritized selector: flee smash disc → reflect-guard → dodge shot → heal <62% → shield → ult (if will-connect) → Q → E → buff → basic. `autoDrive` (L1225-1328) gates it behind a ~0.28s human-cadence reaction timer. | Priorities are **static**; no situational re-ordering (e.g. a true "burst the interruptible enemy cast" branch — the engine models enemy-cast interrupts L4414 but the player BT has no "interrupt that telegraph" node). |
| **Threat / influence maps** | Scalar threat only: `incomingThreat` (L872-893) predicts projectile *collision* (ETA within 0.62s, miss-distance gate) and counts a `volley`; `incomingSmash` (L898-905) reads telegraph discs. Enemy side learns a 1-D **influence** of the player's comfort range: `aiP.favRange` slides `enemyRangeBand` to crowd a kiter / kite a brawler (L4295). | No 2-D spatial field — the cat can't pick the *safest open tile*; it dodges perpendicular to one shot (`autoDrive` L1275-1286) and can juke into a second threat or a corner. No "where is the low-threat space" query. |
| **Lane-equilibrium output↔safety tension** | `kitRangeBand` consideration (a) `canOutput` vs (b) `safety` is exactly this tension, resolved by weights `wBasic/wSkill` + bell (L1071-1080). HP-gated retreat (L1106) is the "back off when harassed" half. | The tradeoff is baked into **fixed** weights per build; there's no dynamic "I'm ahead, play safe / I'm behind, take the risky farm" shift. (The ENEMY has this via `_pressure`/`_stomp`; the player AI does not.) |

**One-line summary of the gap:** the engine is strong on *positioning* (IAUS) and *reactive defense*
(BT + scalar threat), partial on *role theory*, and missing *action-level desire scoring*,
*focus-fire target selection*, *peel*, *committed disengage*, and *2-D influence*. The scoring proxy
can only reward what the simulator measures — so §3 rewards the observable *consequences* of good
role/kite/focus play (survival, clean output, not-whiffing, staying engaged) and flags the rest.

---

## 3. The ground-truth scoring rubric (prioritized)

Priority order encodes mature-MOBA value: **winning the fight dominates; not dying is next; then
clean, real output; then don't-whiff and don't-overextend.** Each term names the EXACT metric key(s)
it reads and the scenario it reads them from (per §0's honesty rule).

Weights sum to 1.0. They are justified per-term below and deliberately tilt **more survival/win-heavy
than `DEFAULT_WEIGHTS`** (evaluator.mjs L406-408: win .30/surv .25/output .20/pos .12/speed .08/eff
.05) — a mature player trades raw DPS for not-dying, which is the whole point of an external proxy
diverging from the engine's own weighted sum.

| # | Rubric term | Weight | Reads (exact keys) | From scenario | MOBA principle |
|---|---|---|---|---|---|
| 1 | **Win the fight(s)** | **0.30** | `norm.win` | mean(solo-live, multi) | Dota `ModeDesire` top-line: the objective is to win. Weighted across the 1-v-1 and the 3-pack so a config can't win solo but feed the pack. |
| 2 | **Survive / don't get worn down or surrounded** | **0.26** | `norm.survival` (= clamped `hpFracLeft`) | mean(solo-live, multi), **multi weighted 0.6** | Role theory: carries/bruisers that die contribute nothing; getting surrounded in `multi` is the harshest honest survival test, so it carries more weight. |
| 3 | **Deal real, non-stalling output** | **0.18** | `norm.output` (= `dmgDealt/_enemyInitHp`) | **solo-pinned** (only honest output read), fallback mean(live,multi) | Last-hit/farm: a kiter that never commits is useless. Read on pinned because that's the only scenario where output is uncontaminated by survival. |
| 4 | **Don't whiff — hits land, not negated** | **0.12** | `norm.efficiency` (= `1 - negatedPct/100`) | mean(solo-live, multi) | Focus-fire / target-selection quality: firing into i-frames/shields/reflect walls is wasted desire. `unwardedTarget` (L1454) is the engine's attempt; efficiency measures whether it worked. |
| 5 | **Stay engaged — don't overextend or flee to a corner** | **0.08** | `norm.positioning` (= coarse "in [15,320]px band" `posPct`) | mean(solo-live, multi) | IAUS standoff discipline / lane equilibrium: a melee fighter parked at 300px (the `stand-at-max-range` control) or hugging into a volley both score low here. Coarse band, so low weight. |
| 6 | **Close the fight fast when you do win** | **0.06** | `norm.speed` (= `1 - timeToKill/duration`, 0 if not won) | mean(solo-live, multi) | Tempo: a faster clear = less exposure window. Tie-breaker weight only; it is gated on `won` so it never rewards a fast *loss*. |

Rationale for the re-weighting vs `goodCombatJudge` (propose.mjs L128,
`win .30/surv .28/output .18/eff .12/pos .12`): this rubric (a) **splits positioning's weight** to
introduce `speed` (tempo is a real MOBA value the old judge ignored entirely), (b) **weights multi
survival above solo survival** (getting surrounded is the signature 1-v-few failure), and (c) reads
output **only from the pinned scenario** instead of averaging live/multi — because per the
evaluator's own header, live/multi output is confounded by the enemy fighting back, so averaging it
in double-counts survival. These are the three substantive corrections a mature-MOBA lens makes.

### 3b. NEEDS NEW METRIC — mature principles the sim does NOT yet measure

These are real MOBA-AI signals the rubric would reward if the data existed. They are **flagged, not
faked.** Each notes how to compute it from sim state (the evaluator already wraps `resolveHit` and
owns the world, so adding a tally is cheap and non-invasive to `battle.js`).

- **NEEDS NEW METRIC: `focusFireConcentration` = (damage dealt to the single most-damaged enemy) /
  (total damage dealt), measured in `multi`.** Encodes MOBA focus-fire: good play concentrates one
  target to remove a DPS source, rather than smearing damage across the pack. Compute by keying the
  `resolveHit` wrapper (evaluator.mjs L271-275) by `target.i` and tracking per-enemy dealt totals;
  report `max(perEnemy)/sum(perEnemy)`. Currently the sim only tracks pack-aggregate `dmgDealt`.

- **NEEDS NEW METRIC: `timeSurrounded` = fraction of `multi` frames with ≥2 live enemies within
  ~90px of the active cat.** Encodes peel/disengage failure (getting collapsed on). Compute in the
  `runScenarioInner` frame loop (L286-304) alongside the existing `posFrames` tally. The current
  `posPct` only checks *nearest* enemy distance, so it cannot see "surrounded."

- **NEEDS NEW METRIC: `overkillWasteFrac` = damage dealt to already-lethal/sub-zero HP targets /
  total damage, in `multi`.** Encodes target-switching discipline (stop hitting a corpse). Compute
  in the `resolveHit` wrapper by checking `target.hp <= 0` pre-hit. Not currently tracked.

- **NEEDS NEW METRIC: `interruptRate` = enemy heavy casts interrupted by the player / enemy heavy
  casts started.** The engine fully models interruptible enemy casts (`castInterruptible`,
  `castDmgTaken`/`castDmgBudget`, `interruptEnemyCast`, L4414-4416) but no metric credits the player
  for reading and bursting a telegraph — a core high-skill MOBA play. Compute by counting
  `interruptEnemyCast` calls vs `telegraphKind` assignments during a run.

Until these exist, terms #2 (survival, multi-weighted) and #4 (efficiency) are the best *proxies*
for focus-fire / not-getting-surrounded, and the judge below leans on them accordingly. **This is a
proxy, not a measurement of those behaviors — do not claim otherwise.**

---

## 4. Drop-in `mobaGroundTruthJudge(result, ctx)`

Real JavaScript honoring `(result, ctx) => finite Number`. Uses ONLY keys that `normalize()`
actually emits (verified §0). Replaces `goodCombatJudge` in `scripts/rsi/propose.mjs` — assign
`const JUDGE = mobaGroundTruthJudge;` (propose.mjs L134). It degrades gracefully if a scenario
subset was run, and clamps to a finite number so it can never violate the `scoreConfig` contract.

```javascript
/**
 * mobaGroundTruthJudge — a mature-MOBA-AI lens as the ground-truth reward proxy.
 * Signature: (result, ctx) => finite Number (higher = better). Honors evaluator.scoreConfig's
 * external-proxy contract (ctx = { baseline, weightedSum, DEFAULT_WEIGHTS }).
 *
 * Reads ONLY the normalized keys evaluator.mjs emits: survival, win, output, positioning,
 * efficiency, speed. Each scenario is used only for what it can honestly certify (see spec §0/§3):
 *   - OUTPUT comes from solo-pinned (the only uncontaminated output read);
 *   - WIN/SURVIVAL/EFFICIENCY/POSITIONING/SPEED come from the FIGHTING scenarios (solo-live, multi);
 *   - MULTI survival is weighted above solo survival (getting surrounded is the 1-v-few failure).
 */
function mobaGroundTruthJudge(result, ctx) {
  const live  = result.perScenario['solo-live']?.norm   || {};
  const multi = result.perScenario['multi']?.norm       || {};
  const pin   = result.perScenario['solo-pinned']?.norm || {};

  // mean of defined values; returns 0 if none present (graceful subset handling)
  const mean = (...xs) => { const v = xs.filter(x => Number.isFinite(x)); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0; };
  // weighted mean of two possibly-missing values (wA for a, wB for b), renormalized over present ones
  const wmean = (a, wA, b, wB) => {
    let s = 0, w = 0;
    if (Number.isFinite(a)) { s += a * wA; w += wA; }
    if (Number.isFinite(b)) { s += b * wB; w += wB; }
    return w > 0 ? s / w : 0;
  };

  const rubric = {
    // (1) WIN — Dota ModeDesire top-line: the objective is to win both the duel and the 3-pack.
    win: mean(live.win, multi.win),
    // (2) SURVIVE — role theory: a dead carry does nothing; multi (surrounded) weighted 0.6 > solo 0.4.
    survival: wmean(live.survival, 0.4, multi.survival, 0.6),
    // (3) OUTPUT — last-hit/farm: read on PINNED only (uncontaminated by the enemy fighting back);
    //     fall back to live/multi mean if the pinned scenario wasn't run.
    output: Number.isFinite(pin.output) ? pin.output : mean(live.output, multi.output),
    // (4) EFFICIENCY — focus-fire/target quality proxy: don't fire into i-frames/shields/reflect walls.
    efficiency: mean(live.efficiency, multi.efficiency),
    // (5) POSITIONING — IAUS standoff / lane-equilibrium: stay engaged, don't park at max range or hug a volley.
    positioning: mean(live.positioning, multi.positioning),
    // (6) SPEED — tempo: close a WON fight fast (norm.speed is already 0 when not won, so no fast-loss reward).
    speed: mean(live.speed, multi.speed),
  };

  // Mature-MOBA priority: winning + not-dying dominate; real output next; whiff/overextend penalized;
  // tempo is a tie-breaker. Tilts more survival/win-heavy than engine DEFAULT_WEIGHTS on purpose.
  const WEIGHTS = { win: 0.30, survival: 0.26, output: 0.18, efficiency: 0.12, positioning: 0.08, speed: 0.06 };

  const score = ctx.weightedSum(rubric, WEIGHTS);
  // contract guard: scoreConfig throws on non-finite; never let a missing scenario break the loop.
  return Number.isFinite(score) ? score : 0;
}
```

### How to install
In `scripts/rsi/propose.mjs`, replace the `goodCombatJudge` definition (L113-130) with the function
above, or simply add it and change the binding on L134 to `const JUDGE = mobaGroundTruthJudge;`.
Nothing else changes — the pipeline is judge-agnostic (`runCandidate` at L219-228 calls
`scoreConfig(result, JUDGE)`). The deliberately-bad `stand-at-max-range` control will still rank
last (low output on pinned + low win/survival live/multi), satisfying the harness assertion
(propose.mjs L308).

### Honest limits of THIS judge
- It is a **proxy built on consequences**, not on observed MOBA micro. It rewards the *outcomes* of
  good focus-fire / peel / kiting (survival, clean output, staying engaged) because the sim measures
  outcomes, not those behaviors directly. The four §3b `NEEDS NEW METRIC` flags are exactly where it
  is blind.
- `positioning`/`efficiency` are the evaluator's own coarse proxies (its header calls `posPct` a
  coarse "engaged, not fled" band and `negatedPct` "a cheap efficiency proxy, not a true whiff
  rate"). Treat terms #4/#5 as directional, not precise.
- Live/multi numbers are **relative to the chosen enemy** (propose.mjs operating point
  `enemy {hp:1100, dmg:130}`), not an absolute skill rating. Compare configs under identical enemies
  only.

### References (real, checkable)
- Valve, *Dota 2 Bot Scripting API* — `GetDesire`/`ModeDesire`/ability-usage think functions, bot
  roles/lanes: https://developer.valvesoftware.com/wiki/Dota_Bot_Scripting
- Dave Mark, *Behavioral Mathematics for Game AI*, Charles River Media, 2009.
- Dave Mark & Kevin Dill, GDC AI Summit: "Improving AI Decision Modeling Through Utility Theory"
  (2010); "Embracing the Dark Art of Mathematical Modeling in AI" (2012) — the Infinite Axis Utility
  System (IAUS) and response curves.
- Dave Mark & Mike Lewis, GDC: "Practical Influence Maps"; influence-map chapters in
  *AI Game Programming Wisdom* (Charles River Media).
- Damian Isla, "Handling Complexity in the Halo 2 AI," GDC 2005 — behavior trees in a shipped game.
- Ian Millington & John Funge, *Artificial Intelligence for Games* (2nd ed.) — behavior trees,
  steering, influence mapping, decision making.
