# Experience Lab — start here
Branch review/cat-bond-playtest-harness. Do not deploy or merge automatically.

## Current verified checkpoint — 2026-11-26
Tested game revision: `bf025cf2aa4b4f80cee92deaa2f617d7ae51cdb5`. [CI run 45835996647](https://github.com/claudialeee/morrowwish/actions/runs/45835996647), attempt 1: **9/9 story parts independently passed**, and the targets job passed. Eight chapter jobs started from synthetic chapter-entry saves only and completed every required scene and operation using real inputs; the opening job used a fresh slot. These are not a single continuous player-earned route. The continuous campaign job was cancelled during the browser route; its log blob is unavailable, so the cause and reached scene are unknown. The single cancelled job has been successfully re-run on the same SHA (attempt 2, job 140080359571). Do not call it passed until that attempt finishes. No game changes in this documentation-only checkpoint.

| Story part | Actual result (attempt 1) | Download evidence |
|---|---|---|
| Prologue | Pass (fresh save) | [opening](https://github.com/claudialeee/morrowwish/actions/runs/45835996647/artifacts/15126345263) |
| Harbor | 5 scenes pass | [harbor](https://github.com/claudialeee/morrowwish/actions/runs/45835996647/artifacts/15125746351) |
| Forest | 4 scenes pass | [forest](https://github.com/claudialeee/morrowwish/actions/runs/45835996647/artifacts/15126710108) |
| Forge | 4 scenes pass | [forge](https://github.com/claudialeee/morrowwish/actions/runs/45835996647/artifacts/15126510428) |
| Sky | 5 scenes pass | [sky](https://github.com/claudialeee/morrowwish/actions/runs/45835996647/artifacts/15126265367) |
| Library | 5 scenes pass | [library](https://github.com/claudialeee/morrowwish/actions/runs/45835996647/artifacts/15125421949) |
| Starfall | 5 scenes pass | [starfall](https://github.com/claudialeee/morrowwish/actions/runs/45835996647/artifacts/15125312124) |
| Finale | 4 scenes pass | [finale](https://github.com/claudialeee/morrowwish/actions/runs/45835996647/artifacts/15126960667) |
| Epilogue | 3 scenes pass | [epilogue](https://github.com/claudialeee/morrowwish/actions/runs/45835996647/artifacts/15125361856) |
| Targets | 36/36 restores; 5/5 emotional interactions; 3/3 current RPG encounter measurements won | [targets](https://github.com/claudialeee/morrowwish/actions/runs/45835996647/artifacts/15127470338) |

Opening also passed 16 collectible passive contracts, 16 actual battle prototype hook checks, 24 image decodes, 18 actual game-rendered characters. Targets logged Forest auto 13.35s (1 Duo), manual 10.47s (0 Duo), Starfall auto 14.04s (1 Duo), all game-clock times. Three isolated encounters, not a statistical difficulty estimate. Use actual evidence before changing balance.

### Remaining acceptance gates — do not declare complete
- Fresh-slot continuous main story to ending and all real captured checkpoint replays. Prior verified continuous progress reached Forest R-03; the cancelled run has no retrievable progress evidence.
- Production cinematic approval: source manifest has zero approved shots/assets; remaster cinematic assets are candidates allowed in explicit local staging only. Successful staged cinematics cannot certify production-ready art. Inspect all key frames (F-02, F-05, B-04, E-01), visual continuity and no old thin orange-cat layers before approval. Do not approve blindly.
- Independent blind player-perspective assessment of every chapter and implemented optional activity, including no-meet/no-cargo and alternate choices; emotional payoff, clear next goal, repetition, enjoyable challenge, companion identity. Author-side 40-scene pre-audit is already available, not independent player evidence. Use these existing chapter packets to locate/reproduce issues; do not spend Work time rerunning known passing functional checks unless relevant to a fix.
- Actual wild capture/collection, per-cat combat performance (not just passive helper checks), meaningful Duo visuals, mobile/portrait and landscape readability, both languages, actual audio, optional paths, legacy art reference cleanup. Earlier isolated or source checks are not a blanket pass.
- No merge, release approval, deployment, or production analytics. All evidence tied to its tested revision; 7-day artifact retention.

## Historical baseline (CI run 45780045518, commit 0dd413e)
- Real Chromium: Chinese desktop opening with optional traveler encounter and skip both passed; Harbor H-01 arrival and NPC interaction plus normal save reload passed.
- Engine-only: 3 paths x 40 scene records, all 28 choice options, no optional cargo; passed.
- Legacy combat simulator: 7 policies x 2 seeds x 6 battles = 84 simulations executed. Execution success does not mean combat balance is accepted; see actual summary.json.
- Full browser campaign: failed at stale fixed-viewport assertion in Harbor (full-bleed map now intentionally extends under header). Updated assertion in subsequent commit, pending new CI.
- No real browser coverage after Harbor H-01 is claimed.

## Work: choose evidence in this order
1. Read EXPERIENCE-PRE-AUDIT.md for author-side critique and prioritized leads (spoilers).
2. For first-player review, do not read future chapters: use knowledge/<route>-<chapter>.json (engine dialogue model) or a real browser run's evidence JSONL (actual visible text and inputs).
3. Prefer checkpoints/ real browser saves; use synthetic-checkpoints/ only for local targeted review when real earned save is unavailable. The synthetic runner creates saves from actual engine transition snapshots and storyPartyPatch, then opens them via the normal Continue menu and checks scene/party/cursor. It does NOT reproduce earlier physical puzzle history, optional activities, combat progress or currency. Never count it as a real playthrough.
4. Review every chapter, reachable scene, branch and implemented optional activity; prioritize H-04, S-04, M-03/04/05, F-02/03, B-03/04, E-02/03 for early investigation, not as a coverage limit. Reuse revision-matched evidence where appropriate; record unexecuted cases as unverified. The full-game coverage matrix and independent acceptance gate in EXPERIENCE-PLAYTEST.md govern handoff.
5. Record player-visible confusion, boring/repeated action, emotional payoff, causal mismatch; compare before/after on the same target. Actual reactions remain hypotheses until tested by humans.
6. Use local loopback server, no analytics or deployment. Keep game changes on an independent review branch.

## Reopen a checkpoint
Run local server: node scripts/cat-bond-local-cloud-server.mjs
Then:
node scripts/cat-bond-experience-replay.mjs <real-fixture.json> --headed
or explicitly:
node scripts/cat-bond-experience-replay.mjs <synthetic-fixture.json> --synthetic --headed

CI has opening, campaign and targets jobs. Read each result separately; target restore is not chapter completion. Artifacts are revision-bound and retained 7 days; regenerate rather than import a fixture from a different commit unless intentionally testing migration.

## Runner migration checkpoint
Canon 1.2 browser runner now uses forest scent investigation before choice, single-player rescue with false clue and real echo battle (no retired paired-water objective), plus current Sky mail-pouch, flight-choice, delivery and tea choice order. Harbor gated post-rescue dialogue is read explicitly. These are source-aligned changes awaiting actual CI, not claims of verified chapter completion. Other legacy assertions may still need repair.

## Verified target fixtures (run 45780443380)
All 36/36 active scene checkpoints successfully restored via the real Continue flow, including roster/cursor assertions. Download the targets artifact at https://github.com/claudialeee/morrowwish/actions/runs/45780443380. These are revision-bound synthetic saves. Latest full campaign failed at obsolete harbor optional map minigame expectation; the runner now uses the current simple ambient interaction. New targeted dialogue checks (S-04, M-03, F-03, E-02, E-03) exercise visible controls from synthetic fixtures, record subsequent real dialogue and input evidence in emotional-targets/, and must never be counted as a fresh full campaign. Pending CI. Combat policy summaries are now emitted in CI for review without downloading the entire artifact.

## Combat baseline and mainline scope
See EXPERIENCE-COMBAT-BASELINE.md: the legacy single-cat fixture won only 3/84. Treat as a risk to validate with current real RPG teams, not justification for automatic rebalance. Harbor optional map interaction remains explicitly unverified; its UI locator blocked two consecutive campaigns. Mainline now deliberately skips it by default, and CAT_BOND_TEST_AMBIENT=1 retains a dedicated acceptance check. Library route migrated to Baikan first, archive before choice, current identity choice, and two-route model before departure; awaits browser CI. No real end-to-end completion is claimed.

## Emotional and RPG battle verification update
Run 45781052155 restored 36/36 synthetic checkpoints and passed real subsequent dialogue/choice interaction at S-04 (5 lines), M-03 (8), E-02 (4) and E-03 (3, including the key and same-UID Muling return). F-03 failed to open dialogue. Source confirmed the world positioned Muling at (.86,.36) but the proximity validator requires (.92,.30), distance .085 > .072. Map placement now uses the central ruins point for F-03; regression pending. New independent real-input combat measurement tests Forest rescue automatic/manual and Starfall observatory automatic, using the default recruited roster, recording outcomes without injecting victories. Earlier chapter history is synthetic; these are not real progression difficulty estimates. Full campaign remains unresolved.

## Harbor progression repair
Run 45782101674: opening and the isolated target restore/emotional interaction step passed; the continuous campaign failed at the second tide clue after the authored canvas click. The runner now clicks the real quest controls for both tide clues and verifies each persisted interaction before proceeding, without injecting map coordinates or evidence. H-04 actor selection uses real NPC actions rather than old fixed canvas points. Forge now includes the required safe-lantern task, current choice labels and real workshop-part controls. These migrations are pending browser regression. Combat measurement from run 45782101674 is still in progress at this checkpoint; do not infer results before the job completes.

## Mandatory full chapter acceptance
The acceptance scope is all nine story parts: prologue, six regions, finale, epilogue. Prologue uses fresh-slot opening CI; each of the remaining eight has an independent real-input chapter driver, using the verified synthetic *entry* fixture only. Every required operation and every completed scene must be durably present at the end, with the next chapter or actual ending reached. No seeded within-chapter evidence and no early success on checkpoint restore. Failure in any chapter is recorded with remaining objectives and evidence; other chapters continue. Full fresh-slot campaign remains a separate acceptance gate. Staging cinematics are explicitly identified and do not certify production art. New independent chapter suite awaits CI.

Verified on run 45782101674: 36/36 restores, 5/5 emotional nodes, Forest auto/manual and Starfall auto all won (game clock 11.98, 13.11, 16.83 seconds). Three battles are not a win-rate estimate; the old single-cat simulation is not representative of these three party encounters. No global difficulty change is justified from those results.

## Chapter acceptance checkpoint (2026-11-26)
Run 45783158403 independently completed all five Sky scenes; seven other region/finale/epilogue lanes failed. Harbor/Forest/Forge reached the end of required action lists but did not advance due to premature dialogue reads; Library battle reward was covered by a story overlay; Starfall actor sequence and finale/epilogue entry navigation were blocked. Subsequent commits d611949 and 5923ee5 migrate Harbor actions, await actual evidence, and defer the story overlay until the battle result is dismissed. This commit additionally opens the real finale Catdex control in phase B-02, checks all six support responses in phase B-03, awaits Starfall investigation commits, and emits last action/stack diagnostics. All fixes require new CI; Sky pass belongs to older revision only. The new 16-cat passive static contract and browser art gallery passed on run 45785537087 (completed steps); new actual battle prototype passive checks still await execution. Passive design is provisional, not human playtest acceptance or balance signoff.

## Continuous route now reaches Forest
Run 45785537087, campaign job 139791246788: the actual continuous route completed Harbor (including sanctuary, melody, saved progress, optional wild capture and Duo unlock) and reached Forest R-01. It then failed at a retired language settings control hidden during dialogue, not at a story gate. Changed only the localization probe to use the public i18n API, explicitly not player-input evidence. Gameplay and progression remain real input only. Forest dialogue assertions now derive the canonical remaining line count instead of old fixed counts. Run 45785835823 opening job 139792249916 passed remaster rendering, all 16 passive hooks via the battle prototype, prologue and real checkpoint restore. Full combat performance and all chapter passes remain pending.

## Parallel full-chapter acceptance
Run 45786569588 campaign job 139794709593 progressed past Harbor, Forest R-01/R-02, and the channel stabilization in R-03. It then failed at the optional dry-root exploration button, which sits within a collapsed details group. The continuous runner now opens the real optional group and navigates its actual pager, without skipping the false clue. CI chapter acceptance is now eight independent jobs, one synthetic entry fixture per chapter; opening, campaign and 36-scene targets remain separate. Each job retains its own evidence artifact and failure status. This avoids waiting for all eight sequential chapter cases before seeing early failures. The full workflow only passes if all matrix jobs pass; no reduction in chapter coverage. Unified baseline rpg/release-combined-next remains 16dd58ee, verified unchanged.

## Narrative continuity fixes after the 9/9 checkpoint
Two author-side issues from the 40-scene audit are now addressed without changing quest structure. S-04 uses the tea-habit clue only if the optional Muling tea interaction was completed; otherwise she recognizes the player's manner of speaking, preserving the reveal without presuming a tea scene. F-05 describes the actual verified six regional replies rather than claiming that optional cargo exchanges happened. Canonical cinematic text remains invariant across cargo routes. Bilingual source/engine checks were added for both tea variants, save reload and the invariant F-05 line. The previously passing nine chapter results apply to bf025cf2; new source changes require a new regression. Attempt 2 of that earlier continuous route was still running when this fix was prepared. No approval of candidate cinematics; no deployment.

## Regression correction
Run 45869709249 opening/targets failed the newly added F-05 assertion with Invalid ring: the generic scene fixture did not contain six sanctuaries/melodies. This was a test construction error, not a player regression. The F-05 check is now inside both legally progressed engine routes (with and without optional cargo), asserts ring and six melodies, and verifies reload. No change to the production ring invariant or narrative fixes. Downstream targets could not run because the failed prerequisite prevented fixture generation. New CI required.

## Companion rarity integrated
Owner requested integration of review/rpg-companion-rarity. Fast-forwarded from c96a33fd to 68272aae (three commits, no divergent changes); all previous harness work preserved. See COMPANION-RARITY.md: 16 wild + 13 story companions + separate protagonist, 6 SSR covering six elements. Added companion contract to mandatory CI. Old 9/9 evidence is not a signoff on new stat/skill progression. Fixed F-05 test to read persisted melodies from snapshot, not view. Run 45870251956 candidate cinematic review failed at decorative subtitle halo overflow (negative pseudo-element inset); changed check to use actual speaker/text range bounds, wait for actor images, and fixed paused actor animation elapsed time. New screenshot regression required; no production art approval.
