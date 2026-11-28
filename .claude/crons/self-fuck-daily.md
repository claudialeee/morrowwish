# Daily "self-fuck" adversarial audit cron

**Cadence**: once every 24h. Owner mandate 2026-11-28: "这个 self fuck 的 process 每天重复一次". Born from the oscillator incident where the primary shipped an RSI winner with no build gate and no sim to prove it — supervisor passed, playtest didn't catch it, only the owner caught it after live inspection.

The point: this agent is biased toward looking competent. The only reliable way to find its bugs is to spawn a fleet of adversarial subagents whose job description IS finding bugs, each with a different mandate. Run them in parallel (no prompt-chaining, so no cross-contamination), then synthesize.

## What the cron does

cd `/Users/jxianhua/morrowish/morrowwish`.

Spawn **5 subagents in parallel** (one Agent tool call with 5 blocks in a single response). Each gets its own narrow adversarial mandate. All run in background. Primary agent waits for all 5 to return, then synthesizes a merged findings list and ranks by severity.

### Subagent 1 — Independent system reviewer
- Purpose: audit the CURRENT state of the RSI system (not just this session's changes) and name every open bug / overclaim.
- Inputs: full repo. Must read `scripts/rsi/*`, `public/cat-bond/js/battle.js` kitRangeBand + nearby, `.claude/supervisor-prompt.md`, `playtest-log.md ## RSI roadmap`, `scripts/rsi/rsi-archive.json`.
- Output shape: `STRENGTHS` / `BUGS / PREMATURE CLAIMS` / `RECOMMENDATIONS` (prioritized P0/P1/P2) / `VERDICT`.
- Explicit anti-lazy prompt phrase: "be adversarial. no polite withholding. owner just caught the primary over-generalizing — hunt for the next miss."

### Subagent 2 — RSI pit-digger
- Purpose: find holes in the RSI *loop itself* (propose.mjs / evaluator.mjs / archive.mjs / rsi-loop.mjs) that let a bad candidate score high, let a good candidate score low, or make winners stop generalizing.
- Minimum 10 pits. Must include: harness-gaming attacks, archive descriptor binning realism, cohort-aggregate fairness, seed-variance vs winner-margin, timeout/stall exploits, dead-code fallbacks, caveat-strip bugs.
- Attack format: `PIT N title | file:line | severity CRITICAL/HIGH/MEDIUM/LOW | concrete scenario | patch sketch`.

### Subagent 3 — Supervisor pit-digger
- Purpose: break the supervisor system (`.claude/supervisor-prompt.md` + practice of invoking it via Agent tool).
- Minimum 15 pits.
- Must cover: prompt-injection by primary, context-shaping bias, retroactive vs pre-commit, grep-fragility on rename, no-git-access, no-gate-run, no-funMean-cross-check, PASS binary loophole, same-model blind spots, no skin-in-the-game ledger, retry wear-down, scope-exempt loopholes, tool-permission narrowing, date-noise channel, primary-summarizes-supervisor-to-owner problem.

### Subagent 4 — Evaluator/simulator pit-digger
- Purpose: find bugs + blind spots + false positives/negatives in the simulator that produces RSI scores.
- Must read: `scripts/rsi/evaluator.mjs`, `scripts/playtest-sim.mjs`, `scripts/rsi/propose.mjs`, `scripts/rsi/archive.mjs`, enough of `public/cat-bond/js/battle.js` to trace pin assumptions, determinism claims, norm clamping, persona reaction queues, vision cone fog, enemies scope, cohort median edge cases, archive descriptor collision, archivePoint easy-enemy bias, time-budget behavior, negatedPct metric, enemy-AI symmetry, scenario state leak, judge weighted-sum, hardcoded CAT stats, candidate `this` null guards.
- Minimum 15 pits.

### Subagent 5 — Playtest cron + fun↔RSI cross-check challenger
- Purpose: audit whether the playtest cron (`.claude/workflows/cat-bond-playtest.js` or similar) honestly cross-references RSI winners against actual persona funMean. Flag any RSI winner currently live in battle.js that was NEVER funMean-validated. Check whether critique-tier P0s + fixes-array P0s are consistently classified. Flag any auto-fix cadence drift (e.g. critiques-P0 stayed findings-only while fixes-array P0 auto-fixed, or vice versa).
- Minimum 10 pits.
- Must read: `.claude/workflows/cat-bond-playtest.js`, recent playtest-log entries, every commit touching `kitRangeBand` since the session the oscillator shipped.

## After all 5 return

Primary:
1. Reads all 5 reports. Does NOT self-filter.
2. Writes a merged ranked list to `.claude/session/self-fuck-<yyyy-mm-dd>.md` (not to playtest-log — keep this file as the audit trail separate from gameplay-balance logs).
3. For each CRITICAL finding: fix it this session OR open a numbered task + commit explaining why the fix is deferred. Never silently drop a CRITICAL.
4. For each HIGH finding: open a task entry. Do not ship if any HIGH touches live game code.
5. For MEDIUM/LOW: log in the self-fuck file; batch them into a weekly cleanup.
6. Append a one-line summary to `playtest-log.md`'s "## Self-fuck audit history" section: `date | subagent count | CRITICAL N / HIGH N / MEDIUM N / LOW N | commits-ahead-of-origin`.
7. Spawn a supervisor subagent to verify the merged list is honestly ranked (supervisor also reads all 5 subagent outputs — not the primary's filtered merge).

## Guardrails

- **Never apply** subagent-suggested patches without owner review unless the patch is pure local-numeric (same class as playtest auto-fix). Everything else is findings-only.
- **Never push** — all fixes land as commits, no push without "push main" verbatim.
- **Preserve all 5 raw outputs** in `.claude/session/self-fuck-<date>-raw/` so a future reviewer can audit whether the primary cherry-picked.
- If the primary catches itself writing "all 5 agents confirmed X" — STOP. That's how model-family shared blind spots hide. Flag it in the merged list as "needs out-of-family red team" (owner's call).

## When the cron fires
Every 24h on Cat Bond work days. Can be triggered manually by the owner saying "self fuck" or by any explicit cron-dispatch message. If the primary has already run a self-fuck audit in the last 20h, note "recent audit, deferring 4h" rather than re-running.

## What the primary MUST NOT do

- Write the subagent prompts in a way that biases them toward specific findings.
- Summarize the subagent outputs before saving raw copies.
- Mark a CRITICAL as resolved without a commit + supervisor pass.
- Skip the supervisor step at the end.

Owner's standing words: "truly done, truly honest, or keep poking." The self-fuck cron IS the poking.
