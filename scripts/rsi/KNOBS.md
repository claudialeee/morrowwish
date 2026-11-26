# Cat Bond combat knob map (Occam's-razor inventory)

**Owner request:** "我们是不是还需要一个 occam razor agent 来约束这么多的 rule" + "Archive coverage: 2/64 — why not 64?"

**Status (2026-11-25):** 20 knobs, 88 refs in `battle.js`. Per the knob-usage-probe, **all of
them report ~0 drop under RSI AI-driven scenarios** — not because they're dead, but because
the RSI harness doesn't model the human-experience branches they're built for. Per the
archive-reachability-probe, **120 random bands only landed in 3 of 64 cells** — the archive's
64-cell target is theatrical; the real coverage ceiling is ~3-5.

## The 20 knobs, grouped by purpose

### A. Rubber-band / escalation (3 knobs, overlapping)

| Knob | What it ramps | Trigger | Consumed at |
|---|---|---|---|
| `_pressure` (0..1) | Enemy fire cadence, aim-lock cap | teamHp > 0.70 AND t > 5s AND !_stalled | `fireCd / pressureBoost` L5004, lock cap L5007 |
| `_closing` (0..1) | Enemy fire cadence, range band collapse, execute bonus | max(timeRamp[45-70s], hitProgress) | `fireCd / closingFireBoost` L5009, `enemyRangeBand` L4725, exec dmg L4379 |
| `_stomp` (0..1) | AI reaction/jitter/lead, challenge | aiP.stompStreak / 5 | `aiReact/aiJitter/aiLeadConf` L197, challenge bonus L763 |

**Overlap:** all three answer "make fights harder when player is winning." `_pressure` is intra-fight,
`_closing` is intra-fight time-driven, `_stomp` is inter-fight memory. Could consolidate into
one `encounterEscalation` compound signal but it would blur the owner-intended semantics.

### B. Mercy / assist (6 knobs, layered)

| Knob | What it eases | Trigger |
|---|---|---|
| `playerDmgMult` / `enemyDmgMult` / `enemyHpScaleGap` (ctor bake) | outgoing dmg up, incoming dmg down, enemy HP down | `clamp(lossStreak/5, 0, 1)` casual-only |
| `_autoAssist` | opening-grace + masher-guard scale | `max(streakAssist, autoBaseline)` |
| `streakAssist` | `_autoAssist` input | lossStreak≥2 → 0.6; ≥4 → 0.8 |
| `autoBaseline` | `_autoAssist` input | autoMode && casual → 0.4 |
| `graceScale` | opening grace activation | `!autoMode ? 1 : _autoAssist` |
| `manualEase` | enemy fireCd multiplier | base 1.12 manual, 1.0 auto, decayed by `_pressure` |

**Overlap:** `streakAssist` + `autoBaseline` feed `_autoAssist` which feeds `graceScale` which
feeds `manualEase`. 4-level chain for one signal. Could flatten but each layer is an owner-
approved P0 fix with its own gating semantic.

### C. Teach / coach signals (4 knobs)

| Knob | What it triggers | Trigger |
|---|---|---|
| `_dangerFrac` (0..1) | Red vignette, heartbeat sfx, mash-stall teach | 1 - active cat hp/maxhp |
| `_inCrit` (bool) | One-shot heartbeat sfx latch | `_dangerFrac ≤ CRIT_HP_FRAC` |
| `CRIT_HP_FRAC` (0.45) | Threshold for crit vignette + stall teach | const |
| `_stalled` / `_stallBanner` / `dyingNoSkill` | "Use a skill!" banner pulse | (pinned<20% && noSkill 3.5s) OR (dangerFrac<CRIT && noSkill 2s && t>4) |

**Safety:** these are VISUAL ONLY — don't affect sim math. The RSI probe will never measure
their contribution (correctly); their value is human-player legibility.

### D. Softening of in-fight mechanics (7 knobs)

| Knob | What it softens |
|---|---|
| `softAuto` (on win) | lossStreak decrements -1 instead of hard-zero for auto-casual |
| `closingPull` | enemyRangeBand min/max collapse under _closing |
| `pressureBoost` | enemy fireCd under _pressure |
| `closingFireBoost` | enemy fireCd under _closing |
| `rookieGrace` (unused, reverted) | battle 0-2 assist floor — reverted on matrix regression |
| `tempoScale *= 0.88` | casual-auto slowdown |

## What the probes tell us

1. **`archive-reachability-probe.mjs`** — 3 of 64 cells reachable with the default fighter config.
   Durability bin 3 captures 100% of samples. The 64-target is a myth; realistic target is 4-6
   after adding more diverse configs (different builds / levels / enemies).

2. **`knob-usage-probe.mjs`** — Most knobs are invisible to the AI-driven sim because they exist
   for human-perception signals (vignettes, teach banners, mercy bakes at ctor) or require
   conditions the short-fight scenarios don't produce (long lossStreak history, _pressure buildup
   over 60+s).

## Recommendations (findings-only, owner review)

1. **Don't add more knobs without an existing-knob kill target.** The current 20 are the ceiling.
2. **If you want RSI to *see* mercy band effects,** change the harness to pre-stamp `aiP.lossStreak=3`
   before ctor so the mercy bake fires — then the probe can measure its real contribution.
3. **The real archive ceiling is ~5 cells.** Update `rsi-archive.json.maxCells` from 64 to a honest
   number, OR change the descriptor binning to capture variance that actually exists (e.g. bin by
   time-to-kill instead of durability).
4. **Document knob intent in battle.js.** Each ctor-bake lookup already has 10+ line comments;
   the mid-frame knobs don't. Adding one-line `// WHO sets this | WHO reads it | WHY` comments
   would prevent future duplicate-P0s.
