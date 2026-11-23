# Cat Bond — CrazyGames second pre-submission QA recheck

Date: 2026-11-22 (US Pacific). Verdict: **PARTIAL / HOLD — not cleared for submission**.
Scope: main-branch source inspection, prior documented browser-QA evidence, CrazyGames' official current requirements, and live GitHub Actions release evidence. This recheck does **not** claim to have driven a fresh live browser playthrough or CrazyGames Portal preview.

## Build and source evidence
- Game: `public/cat-bond/`; HTML5 canvas, five exploration regions, 33 cat breeds, dual-cat battle moves, first capture and progression.
- Portal adapter `js/platform.js` identifies CrazyGames from query, UTM or referrer. `js/main.js` skips the studio splash in portal mode and offers starter selection immediately. `public/portal-mode.js` hides other playable-game and site cross-promotions; shared fullscreen controls defer to the host.
- First-capture refinements and automated behavior previously recorded at `docs/cat-bond-prelaunch-qa-2026-11-22.md`: starter -> highlighted bush -> auto/manual battle -> capture -> immediately selected two-cat roster -> follow-up with one-use ready Duo. Prior tests checked save/reload, primary English copy, 33 unique portraits, five region paints and portal viewport sizes. This is **prior-run evidence**, not re-executed against the newest HEAD during this recheck.
- Prior local browser measurement: ~6.04MB transferred for first screen and <2 sec to starter; not a live CrazyGames iframe SLA and not a final package audit. No current 4xx/5xx evidence gathered in this pass.

## New or independently confirmed release risks
1. **P0: latest deployment not proven**. GitHub Actions Cloudflare deploy run `45086057853` failed at source checks in `scripts/test-dashboard-sorting.mjs:96` with `ReferenceError: t is not defined` (a dashboard fixture regression, not Cat Bond combat). At review time, a later Cloudflare deployment run `45086162922` was in progress and run `45086223028` pending; the latest observed completed success was `45085828379`, SHA `e2c14abe10`. This is moving release state: re-query runs, require a green deployment, and independently compare production game assets to the intended HEAD. Do not equate HTTP 200 with parity.
2. **P0: platform-specific artifact not validated**. `public/cat-bond/index.html` refers to shared root-absolute assets and scripts (`/lang.js`, `/telemetry.js`, `/game-settings.js`, etc.). That can work on the existing first-party hosted iframe but **does not constitute a standalone CrazyGames ZIP**. Decide external first-party iframe vs fully bundled relative-path build, then test that exact mode in CrazyGames Preview.
3. **P0: missing real player-quality signoff**. The `cat-bond-crazygames-smoke.mjs` test calls `game.yardTap(spot.x, spot.y)` and directly forces battle outcomes/duo casts in sections. It proves state transitions but is not evidence that a new player can locate, click/tap, fight, and voluntarily continue without developer help. Run >=3 uncoached cold-player first-five-minute sessions; log time to cat choice, wild encounter, capture, first Duo use, and willingness to play again.
4. **P1: untested hardware and sizes**. Prior portal smoke covers 907x510, 821x462, 800x450, 1366x768; it uses DPR 2 at 907x510. Additional real-device checks are needed for DPR 1, 1216x684, 1077x606, tablet 1080x607, iOS Safari (including audio resume), Android, and modest-memory Chromebook. Test actual pointer/touch input, modal scrolling, HUD and battle button reachability, pause/reload and sustained performance.
5. **P1: submission media unsigned**. `scripts/record-cat-bond-crazygames-previews.mjs` and `scripts/prepare-cat-bond-crazygames-media.mjs` can technically generate 3 covers + 2 native-aspect MP4 previews from art and the actual game engine. The footage includes seeded high-level state; editorial approval must verify it is an attainable, truthful portrayal and that all five assets are sharp, legible, uncut and rights-cleared. Final render outputs are not committed release artifacts.
6. **P1: rights, privacy and portal QA**. Gather licenses/ownership for artwork and audio, verify privacy disclosures where required, and complete the actual Developer Portal preview and QA responses. The current `promotion/portal-status.json` lists Cat Bond `not-created` as of 2026-11-20, not a verified up-to-date portal receipt. Do not auto-answer self-certification questions on behalf of unexecuted QA.

## Platform standards checked
- Gameplay: https://docs.crazygames.com/requirements/gameplay/
- Technical: https://docs.crazygames.com/requirements/technical/
- Quality: https://docs.crazygames.com/requirements/quality/
- FAQ / first QA and Basic Launch: https://docs.crazygames.com/faq/
- For basic implementation: SDK is optional; external iframe on an independent studio domain is accepted for consideration. SDK required for full implementation. If no SDK is present, total game file size must be <=50MB (<=20MB for mobile home eligibility), and external-host gameplay should begin within 20 seconds.

## Recheck release gate
- **Functionality**: prior automated PASS only; re-execute browser tests at intended HEAD and against deploy.
- **Localization**: existing hidden-story pass observed in failed deploy log, before an unrelated dashboard test crashed; not a current full browser QA.
- **Art consistency and retention**: art uniqueness established earlier; first-five-minute fun / independent retention **unverified**.
- **CrazyGames Preview, published asset parity, 5 media assets, rights**: **not cleared**.
- **Decision**: remain `status=hold`, `approvedSlug=null` in `promotion/crazygames-quality-gate.json`. No portal submission or automated approval. Owner can review this report and previous QA; all missing checks must receive explicit evidence before changing the gate.

## Adversarial review
The strongest contrary evidence to 'ready' is not a gameplay exception: previous tests use game APIs and injected outcomes, so real first-time control clarity and second-session motivation remain unknown. The current deployment has an unrelated blocking test failure, and the actual CrazyGames preview has never been verified in this audit. Claiming PASS or submitting now would overstate the test evidence. Supervisor decision: **PARTIAL / HOLD**.

## Verified remediation — 2026-11-22, second follow-up

**Code fixes** (all on `main`, without changing gameplay saves or other games):

1. `5a20b00f3`: prioritize live glowing-bush encounter over overlapping resource/golden-cat targets; suppress touch text selection only in CrazyGames mode. Replaced direct `yardTap` QA shortcuts with actual browser mouse actions; added `scripts/cat-bond-crazygames-real-input.mjs` for 10 DPR-1 portal viewport cases, pointer/touch and a real auto-battle-to-capture path. Integrated into release CI.
2. `f3e5a2395`: changed Cat Bond CSS/world cache-buster references.
3. `5a864b2aa`, `b9c848740`: repaired two-tier duo rendering. The live fight now sets **`originalArt:false`** in both the primary battle initializer and the later `duo-bond.js` wrapper, avoiding the old wrapper's silent forced `true`. The live cut-in resolves the **actual two selected cats' UIDs** to original watercolor breed images over a 21×3 clean illustrated scenic backdrop. Complete fixed-cat storyboard paintings remain for archival art/gallery previews, not substituted for players' cats. Updated JS cache-busters.
4. `73ad9d643`, `fd4446e73`: reconciled contradictory old static art gates so they require selected real breed art in current battles and preserve the 63 legacy gallery originals. `ed2775af9` retriggered the deploy release gate. `f4d1159a5` removed an obsolete hardcoded V13-only script-version assertion from historical QA.

**Positive test evidence:**
- `Cat Bond original-art 21x3 visual QA`: [run 45093659456](https://github.com/claudialeee/morrowwish/actions/runs/45093659456), **SUCCESS** after the wrapper fix.
- `Cat Bond mobile playable test`: [run 45093659432](https://github.com/claudialeee/morrowwish/actions/runs/45093659432), **SUCCESS** after the wrapper fix.
- `Cat Bond fast combat regression`: [run 45093659520](https://github.com/claudialeee/morrowwish/actions/runs/45093659520), **SUCCESS**.
- [Deploy Morrow Wish to Cloudflare Pages run 45094107322](https://github.com/claudialeee/morrowwish/actions/runs/45094107322), **SUCCESS**, source SHA `ed2775af9`. Verified source tests, the ten-viewport Chromium browser suite, bilingual browser suite, release build, Cloudflare live bytes/API, and Vercel proxy/game asset checks. Subsequent `f4d1159a5` only changes an offline historical QA script, not public gameplay assets.

**Remaining limits before CrazyGames release approval:** no authenticated CrazyGames Developer Portal preview QA has been completed; no independent uncoached first-time human-player sessions; no human full-resolution signoff of the three actual CrazyGames covers and two platform previews; complete art/music usage-rights dossier and on-device iOS/Android/low-memory performance evidence remain to be reviewed. Prior English/Chromium tests and license files alone do not prove these. External-host iframe is the intended submission mode; standalone ZIP is not asserted to be ready or necessary for that route.

**Supervisor adversarial self-review:** This is a real build/QA improvement, not just updated documentation. The strongest contrary case is still an untested real new player and unreviewed platform embed. Thus gameplay/CI fixes are **PASS**, external-platform submission approval remains **PARTIAL / HOLD**. Do not set `promotion/crazygames-quality-gate.json` to `approved`, claim CrazyGames preview acceptance, or start a submission without the missing evidence.
