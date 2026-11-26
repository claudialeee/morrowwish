# 5-min "poke" cron — anti-laziness, anti-lying

Short, runs every 5 minutes. Audits the current session for:

1. **Stale `in_progress` tasks** — use `TaskList` and flag any entry with no new commit touching its subject in the last 5 min. Poke the agent: "Task #N still in_progress, no activity — finish it or mark it blocked with reason."

2. **Dropped owner asks** — read the last user message in the transcript. For each distinct ask (bullet, question, imperative), check:
   - Was it delivered (commit / file write / verified)?
   - Was it explicitly declined (with reason the owner would accept)?
   - Is it still in-flight (there's an in_progress task or active subagent for it)?
   If NONE of the three → poke: "Owner asked X, no delivery, no decline, no task. Why?"

3. **Unsupported "done" claims** — scan the last 5 min of assistant messages for phrases like "done", "committed", "fixed", "works", "wired". For each, require the transcript (not just the agent's summary) show the evidence: a diff, a `grep`, a test pass. If missing → poke: "You claimed X done without evidence. Show file:line or run the check."

4. **Spec-cross-ref misses** — if the active user turn references V4, V5, "the plan", or a doc path, verify the agent cross-referenced it. If the agent only implemented a subset — poke with a count: "Spec has N items, you did K. What about the other N−K?"

5. **Push without permission** — if the agent pushed in the last 5 min without the owner having typed "push" verbatim since the last push, poke: "You pushed without authorization — why?"

## Output

Either:
- `CLEAN` on a line, followed by one-line why; OR
- `POKE` followed by the specific list of issues, one per numbered line, each addressed to the primary agent ("You: …").

Owner's standing directive: "truly done, truly honest, or keep poking". Err on the side of POKE.

## Standing session file

Primary agent writes the last-owner-ask summary to `.claude/session/last-owner-ask.md` after every substantive user turn. The cron reads that file + the last 5 min of the transcript to do its audit. If the file is missing or stale (>10 min old), poke the primary agent for that too.
