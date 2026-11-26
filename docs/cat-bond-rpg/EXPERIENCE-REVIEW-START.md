# Experience Lab — start here
Branch review/cat-bond-playtest-harness. Do not deploy or merge automatically.

## Verified baseline (CI run 45780045518, commit 0dd413e)
- Real Chromium: Chinese desktop opening with optional traveler encounter and skip both passed; Harbor H-01 arrival and NPC interaction plus normal save reload passed.
- Engine-only: 3 paths x 40 scene records, all 28 choice options, no optional cargo; passed.
- Legacy combat simulator: 7 policies x 2 seeds x 6 battles = 84 simulations executed. Execution success does not mean combat balance is accepted; see actual summary.json.
- Full browser campaign: failed at stale fixed-viewport assertion in Harbor (full-bleed map now intentionally extends under header). Updated assertion in subsequent commit, pending new CI.
- No real browser coverage after Harbor H-01 is claimed.

## Work: choose evidence in this order
1. Read EXPERIENCE-PRE-AUDIT.md for author-side critique and prioritized leads (spoilers).
2. For first-player review, do not read future chapters: use knowledge/<route>-<chapter>.json (engine dialogue model) or a real browser run's evidence JSONL (actual visible text and inputs).
3. Prefer checkpoints/ real browser saves; use synthetic-checkpoints/ only for local targeted review when real earned save is unavailable. The synthetic runner creates saves from actual engine transition snapshots and storyPartyPatch, then opens them via the normal Continue menu and checks scene/party/cursor. It does NOT reproduce earlier physical puzzle history, optional activities, combat progress or currency. Never count it as a real playthrough.
4. Review chapter start and emotional peaks; prioritize H-04, S-04, M-03/04/05, F-02/03, B-03/04, E-02/03. No need to repeat all optional cargo deliveries or static code reading.
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
