# Cat Bond — Pre-launch gameplay and CrazyGames QA

Date: 2026-11-22. Scope: game at `public/cat-bond/` and game-specific release QA. **Release status: HOLD; do not submit automatically.**

## Actual findings and iteration

The first playable loop works in headless Chromium: choose a starter → tap a highlighted bush → select auto/manual → fight and capture → victory → continue.

Problems found and fixed:
- **Unlocked duo was not selected for the next fight.** Fresh players' saved `battlePrefs.teamUids` still contained just the starter. On the first capture, the newly befriended cat is now appended as the second active fighter; deliberately configured multi-cat rosters are preserved.
- **Duo signature could remain invisible.** Normal early battles end before the regular slow Duo charge fills. The first eligible *real* two-cat fight receives one immediately usable Duo move. Only a successful cast consumes the flag; Golden Paw mastery rematches do not qualify. Later battles retain the normal balance.
- **Five competing buttons and verbose first result.** The initial capture result now prioritizes one 'Try your duo' follow-up, with 'Explore other activities' and 'Back to yard' available. Detailed grade, healing and XP remain accessible in a collapsible section.
- **Mismatched guidance.** When a newly unlocked duo has a highlighted next-hunt bush, the quest hint now points to the duo hunt, rather than obscuring it with an unrelated petting instruction. The optional broader tutorial continues afterward.
- **English joined words and untranslated new strings.** Changed 'WildBean' / 'WildOreo' to correctly separated labels and added every new Chinese game line to the English dictionary.

All of these changes preserve cat ownership, existing saved UIDs, the five-map world, rarity tables, all existing duo moves, and the same browser save key. No game economy or ranking boost is permanently granted.

## Tests executed

1. `node scripts/check-cat-bond.mjs`: PASS, including first duo lineup, first-capture result and once-only onboarding flag assertions.
2. `npm run check`: PASS, including hidden story translation paths (8 worlds, 24 openings, 216 story choices, 72 finales, 13 memories, 21 duo moves).
3. `MOBILE_PLAYTEST_ORIGIN=http://127.0.0.1:8765 node scripts/cat-bond-crazygames-smoke.mjs`: PASS at 907×510, 821×462, 800×450, 1366×768. Tests first entry, no portal fullscreen/cross-promotion, English, manual/auto toggle, first capture, second-battle Duo activation, 33 unique art portraits, five distinct regions and roster navigation.
4. Separate real-browser tests at 907×510 and mobile portrait 390×844: first full automatic capture, two active saved roster UIDs, three victory actions, next highlighted bush and no uncaught exceptions / horizontal overflow: PASS.
5. Cold local static-server measurements (headless Chromium; **not** an external-network SLA): 907×510 878 ms to starter choice; 800×450 1,462 ms. 56 resource requests, ~6.04 MB browser transfer each, no 4xx/5xx or `/api/session` requests in CrazyGames mode.
6. Reload regression: two captured residents, selected duo UIDs and the one-use availability flag survive a page reload. After a Duo is actually used, the flag remains consumed through a second reload. In auto mode the Duo can be cast immediately before a test reads the initial charge; manual-mode browser QA checks its ready state before the cast.

The local Cat Bond directory contained 60 files totaling approximately 7.1 MiB at audit time. **Do not use this as the full uploaded or initial-download size without a final bundle audit.**

## Unresolved release blockers

- **Deployment parity:** Vercel production logs previously reported `git_info_fail` on the newest two deployment attempts. A 200 response from `morrowwish.vercel.app/cat-bond/` is NOT evidence of the latest commit; verify deployed `js/game.js` and `js/ui.js` markers. Confirm Cloudflare Pages' published version and use a verified live URL in any CrazyGames draft.
- **Independent players:** scripted gameplay proves functionality, not fun or retention. At least three cold players should attempt the first five minutes without coaching; collect confusion points, time to first capture, Duo use, and voluntary second engagement. Do not substitute automated retries for player satisfaction.
- **Real hardware:** Chromium emulation does not replace Safari on iOS, Android touch, 4 GB Chromebook, or audio interruption testing. Capture actual screenshots/frame-time diagnostics.
- **Rights and legal:** complete art/music rights evidence and necessary privacy disclosures before external submission. CrazyGames QA must verify this separately.
- **Portal upload:** HTML source currently contains root-relative shared-site files. The existing live iframe route can work if it loads those files, but an offline/ZIP upload must bundle/rewrite dependencies to relative paths and retest.
- **CrazyGames approval:** `promotion/crazygames-quality-gate.json` must remain `hold` until the above review evidence is recorded; no draft or submission is approved here.

## Official release benchmarks

- [CrazyGames basic launch guidance](https://docs.crazygames.com/resources/basic-launch-metrics/): optimize for voluntary play time, return sessions, game conversion, and cover CTR; successful games often see 10+ minutes, **not** a guaranteed threshold.
- [Gameplay](https://docs.crazygames.com/requirements/gameplay/): legible English, intuitive controls, reliable iframe layouts, host fullscreen, and no cross-promotion.
- [Technical](https://docs.crazygames.com/requirements/technical/): ≤50 MB initial, ≤20 MB for mobile homepage, ≤1,500 files, ≤250 MB overall, or ≤50 MB total without SDK. Externally hosted games evaluated on time to real gameplay (≤20 seconds).

## Portability

This iteration keeps gameplay state and all Duo logic in HTML5/Canvas code, not the portal adapter. Future iOS/Android or Steam editions need their own OS lifecycle, offline packaging, save export/cloud-sync conflict handling, platform UX and store compliance. No native release is represented as built.
