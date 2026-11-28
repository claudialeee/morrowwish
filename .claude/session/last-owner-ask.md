# Last owner ask (session 2026-11-28 04-44 UTC)

## Latest explicit owner message

**RSI cron directive** (every 3h, findings-only) — then POKE audit. Both delivered.

## Status (most recent → oldest)

- **RSI cycle 2026-11-28T04:44:17Z — BREAKTHROUGH**:
  - New best score **0.712** (prior 0.703). Champion: `agent:alternating-oscillator` in cell 1,3,3,3, displaced `pack-robust-peel-fused`.
  - New niche filled: `agent:qready-burst-else-wide` score 0.700 in cell 1,2,3,3 (previously empty).
  - **Archive coverage 2/256 → 3/256** (+50% in one cycle).
  - Both winners read CD signals (f.cd.q / f.cd.e).
  - **Correction to prior-reply overstatement**: this is NOT the first cycle to propose CD rules — earlier CD-reading candidates (`cd-aware-lunge`, `e-aware-dive`, `e-only-burst`, `either-ready-collapse`, `ready-hitrun-tight`, `hitandrun-double-gate`, etc. — git log shows 31+ lines referencing f.cd.q/f.cd.e) existed and did NOT produce elites. This cycle's `alternating-oscillator` + `qready-burst-else-wide` are the first CD-axis candidates to produce elites. Prior attempts were not erased; they just didn't score.
  - Appended one-line log to playtest-log.md "## RSI" section.
  - Harness state unchanged from supervisor-PASSed 04:13Z cycle (PERSONAS_SCORING = [null,lazy,explorer,panicky], COHORT_AGGREGATE='median'). No new supervisor needed for the harness; winners emerged under the already-vetted rule.

- **Playtest cycle wjwzq0own 2026-11-28T04:37Z** — funMean 3.83 (vs prior low 3.67):
  - 40 critiques: 0 critique-P0, 26 P1, 14 P2.
  - 1 P0 auto-fixed: af9c93cf `basicTimeScalar` ramp window 25-55s → 12-30s. Peak at t=30s, 1.0× crossover at **t≈22.8s** (NOT ~19s as af9c93cf commit body incorrectly claimed; corrected in 6c6e9985 + playtest-log.md).
  - 2 P0 findings-only (multi-site/i18n): auto-ult agency+telemetry, Wild-Pack HP ribbon.
  - Supervisor FAIL → corrected via 6c6e9985 (cache-buster `basic-ramp-12-30-20261128` + math correction) → supervisor re-run PASS.
  - Cycle log committed b8743471.

- **RSI cycle 2026-11-28T04:13:38Z** (median experiment, supervisor PASS):
  - Cohort rule `PERSONAS_SCORING` re-included panicky; aggregation MIN → median.
  - Winner `agent:pack-robust-peel-fused` 0.703 held — breakthrough not an artifact of hiding panicky.
  - Supervisor PASS.

- **RSI cycle 2026-11-28T03:41:06Z**: `pack-robust-peel-fused` 0.703 (recombined), `multi-rush-solo-kite` 0.641. Supervisor PASS.
- **RSI cycle 2026-11-28T03:22:31Z**: `pack-count-robust` 0.703 vs 0.023 baseline (first breakthrough). Panicky-exclusion unlocked cohort.

## Measured facts (probe data)

`scripts/rsi/probe-panicky.mjs` — baseline cat vs doudou-1100 solo-live by persona:
- auto-drive / lazy: win=1.0 surv=0.974 score=0.894
- explorer: win=1.0 surv=0.994 score=0.899
- panicky: win=0.0 surv=0.917 out=804 **score=0.527** (NOT ~0 as earlier overclaim)

## Uncommitted state (RSI cron step 5 — no commit)

- `scripts/rsi/propose.mjs` — PERSONAS_SCORING = [null,lazy,explorer,panicky]; COHORT_AGGREGATE = 'median'; agg() helper.
- `scripts/rsi/probe-panicky.mjs` — NEW diagnostic probe (one-shot, not in npm run check).
- `scripts/rsi/agent-candidates.json` — 5 CD-axis + HP-gradient + stomp + support-triage + oscillator candidates.
- `scripts/rsi/rsi-archive.json` — 3/256 elites.
- `scripts/rsi/optimized-params.json`, `scripts/rsi/rsi-archive.json` — regenerated.
- `playtest-log.md`, `.claude/session/last-owner-ask.md` — updated.

## Open design questions (flag for owner)

1. **Exclude vs median vs weighted** — current state: median. 0.712 win holds under median. Confirmed robust.
2. **MAP-Elites diversity gap SHRINKING**: 2→3 cells this cycle, driven by CD-axis proposals. 253 cells remain unfilled; next proposal batch should target stomp/_closing/alive-count × HP × CD combos the oscillator ignores.
3. **Winner-apply question**: `agent:alternating-oscillator` at 0.712 is the strongest RSI winner so far. Still uncommitted / unapplied per RSI step 5. Owner review needed before applying any band to battle.js.

## Standing directives still active

- `都继续 ，不要问我` — autonomous drive
- `scope不允许降级` — don't defer
- `然后他说什么你就要听` — supervisor subagent is binding
- `truly done, truly honest, or keep poking`
- Never push without owner typing **"push main"** verbatim
- Playtest cron rule: adversary P0 auto-fix only if low-risk; P1/P2 findings-only; revert on gate failure
- RSI cron rule: findings-only; never push, never auto-edit game code; proposals + archive only

## Not yet pushed

**17 commits ahead of origin** (verified via `git status`). af9c93cf + b8743471 + 6c6e9985 added this session above prior base. Holding for "push main" verbatim.
