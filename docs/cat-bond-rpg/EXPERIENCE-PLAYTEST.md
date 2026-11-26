# Cat Bond — Experience Playtest Harness

## Purpose

This harness supports experience-led improvement, not merely regression testing. A successful script is **not** evidence that the game is fun. The authored browser route is a repeatable evidence generator; an independent player-perspective reviewer must assess motivation, understanding, emotional resonance, causal coherence, and the gameplay loop. Do not confuse synthetic behavior with real-player retention.

## Run

From the branch root, with Node 22 and Chromium installed:
```sh
npm ci
npm install --no-save --no-package-lock playwright@1.57.0
npx playwright install chromium
node scripts/cat-bond-local-cloud-server.mjs
```
In a second terminal:
```sh
# Fast: opening, Muling encounter/skip paths, actual departure and first conversation.
CAT_BOND_EXPERIENCE=1 PROLOGUE_LANG=zh PROLOGUE_PROFILE=desktop node scripts/cat-bond-release-prologue-qa.mjs
# Deep: reuse existing authored real-input campaign route (English).
CAT_BOND_EXPERIENCE=1 CAT_BOND_PROFILE=desktop CAT_BOND_FULL_CAMPAIGN=1 node scripts/cat-bond-harbor-playthrough.mjs
# Generate even if the route failed; failure itself is evidence.
node scripts/cat-bond-experience-report.mjs
```
The local server uses in-memory SQLite; no production save or analytics are touched. The recorder is opt-in. Existing scripts still determine functional pass/fail. The full route has historical test assumptions; report actual reached scenes, not intended coverage. Never grant story evidence or teleport via state writes to get past an obstacle. If an authored selector is stale, distinguish harness drift from a game bug.

Output: `artifacts/cat-bond-experience/*.jsonl`, `review-packet.json`, `REVIEW-INDEX.md`; existing runners keep screenshots under their own artifact folders. Internal objective IDs are routing evidence only. For the blind reviewer, read rendered text and actions in order, without looking ahead at the campaign source.

## Autonomous qualitative playtest protocol (Work or human)

1. **Fresh player pass**: start with no walkthrough, no prior plot knowledge, no code or spoilers. Play visible controls. At the first meaningful decision and each scene transition, write a short first-person reaction based only on what has appeared. If unsure where to go, record what you tried before looking up the answer. Do not bypass real play with debug flags, hidden scene knowledge or skip dialogue. The scripted route is useful for reference but cannot substitute for this pass.
2. **Independent narrative critic**: inspect the ordered evidence and player reactions before reading source. Track the player's knowledge, desire, expectation, action and consequence per story beat. Only afterward inspect campaign data and code to establish the cause of contradictions. Use both an empathetic first-player lens and a skeptical editor lens; if only one agent is available, perform separate passes and label them as such.
3. **Gameplay critic**: assess meaningful choices, feedback, discovery, pacing, skill variety, sense of progress, and the role of companions. Cover every authored fight and interaction type, using automated state-space coverage for repetitive combinations and recording any untested combinations and risks. Compare the shortest honest route with an exploratory route. Note where the story requires an action that has no meaningful connection to its stakes.
4. **Fix**: prioritize root causes, not superficial text polishing. Implement small coherent improvements on a review branch. Larger changes that alter the central story or core mechanics must be explicitly scoped; do not invent authorization. For example, clarify the immediate goal through an action and consequence, not an extra exposition wall. Preserve already approved character art, story canon, and functionality unless the change is necessary.
5. **Retest**: replay affected scenes from a clean or genuine prior save, then verify adjacent scenes and alternative choices. Record before/after player-visible evidence, not just code diffs. Use the scripted runner for regression. Never describe an unplayed scene as verified. No main push or deployment.

### Qualitative review rubric

| Dimension | Evidence and questions |
|---|---|
| Hook / desire to continue | What specific question or goal is compelling? At what beat would you stop, and why? Does a later revelation pay off a planted clue? |
| Comprehension | Can the player explain who they are, why they care, what just happened and what to do next without opening a guide? Is information introduced when it becomes useful? |
| Logic / continuity | Are facts, character knowledge, timing, stakes and motivations internally consistent? Does the consequence follow from the player's action? Flag contradictions with exact scene and lines. |
| Emotional attachment | What did the protagonist or Muling actually do to earn empathy? Is there reciprocal care, vulnerability, humor or an earned moment? Do NPCs become memorable through action, not exposition? |
| Gameplay | What is the decision or challenge? Does it feel responsive? Does the outcome matter? Are exploration and combat distinct, rewarding and tied to the narrative? |
| Pacing / repetition | Are there repeated clicks, travel, dialogue, or puzzles with no new insight, challenge or reward? Compare actual inputs and visible feedback. Automation timings are not human reading times. |
| Agency / progression | Is the player's goal clear while preserving mystery? Does the player experience meaningful progress, build a bond, earn a discovery or gain a new possibility? |

For every issue: scene and exact evidence; expected player experience; actual experience; hypothesized root cause; severity (P0 stop-play / incoherent, P1 significant motivation or fun problem, P2 polish); smallest meaningful fix; before/after evidence; verification status. Scores alone are not acceptance. Do not fabricate player behavior, feelings, metrics, or a claimed independent review.

### Cost control

Start with one desktop clean opening. Fix high-impact issues before deep runs. Use authored tests for coverage, screenshots and reproductions. Prioritize main beats first, then cover every authored optional path and reachable branch; verify supported device layouts and languages. Sampling is only acceptable for explicitly bounded combinatorial states, never as a substitute for authored content coverage. Keep a persistent issue/evidence log so future Work sessions can resume without re-reading the repo. Stop only after the full-game coverage matrix has evidence for every applicable item, P0/P1 engineering blockers are resolved, and the independent acceptance gate passes. Subjective preferences may remain explicitly documented; missing evidence is not a pass. User only reviews consolidated decisions and unresolved tradeoffs.

### Scope / known limitations

The recorder captures DOM text, visible controls, inputs and routing metadata; canvas art, sound, skipped dialogue and unvisited branches require actual playback. It does not infer boredom, empathy or retention. The legacy headless simulator remains available for combat policy metrics, not narrative validation. Existing full campaign automation may need repairs as the game evolves. A browser failure must be classified rather than hidden.
