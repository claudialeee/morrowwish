# Morrow Wish — instructions for all coding agents

You are contributing to the EXISTING Morrow Wish browser-game studio. Do not create a separate website, repository, analytics dashboard, or deployment.

## Read first
1. Read `README.md`, `CLAUDE.md`, `package.json`, and the current `main` branch.
2. Read the specific game and shared files relevant to your task; inspect existing conventions instead of assuming that your own template is compatible.
3. If the request is unclear on a design detail, use existing styling and conventions as defaults, but complete the implementation and tests rather than stopping after a proposal.

## Production and permissions
- Repo: `claudialeee/morrowwish` (private).
- Public site: https://morrowwish.vercel.app/
- Unified dashboard: https://morrowwish.vercel.app/studio-insights/
- Production: **existing Cloudflare Pages project `morrowwish`**, with D1 `morrowwish-analytics`.
- Vercel is **only** the fixed external URL and reverse proxy to `https://morrowwish.pages.dev/`. Never deploy or edit Vercel for ordinary game changes.
- GitHub Actions workflow `.github/workflows/deploy-cloudflare.yml` automatically checks and deploys relevant changes pushed to `main`. The repository's `CLOUDFLARE_API_TOKEN` secret is already the CI deployment credential.
- The collaborator is authorized to commit and push work to `main` **without requesting owner approval**, as long as all project constraints and checks pass. A feature branch and PR are optional for risky or larger changes, not mandatory; do not require a human to approve ordinary releases.
- Prefer push-to-main via GitHub; do not manually deploy to Cloudflare when CI is available. If the platform cannot push, state the specific blocker instead of claiming an update was published.

## Source map
- `public/index.html`: homepage, featured and mini-game cards, ranking and metadata.
- `public/<slug>/`: playable game source and game assets.
- `public/telemetry.js`: canonical session/visit analytics; `window.arcadeMetric(event, payload)`.
- `public/lang.js`, `public/zh-site.js`, `public/zh-stories.js`, `public/zh-polish.js`: current bilingual UI translations. Inspect all relevant translation paths.
- `public/studio-insights/index.html`: ONE unified dashboard, homepage-first ordering matching visible homepage games; preserve the dedicated Elsewhere detail section.
- `src/analytics.js`: analytics collection, summaries, D1 access, session login and allowed event payloads.
- `src/worker.js`: API routing, bundled as `_worker.js`.
- `scripts/build-pages.mjs`: copies source and builds Cloudflare Pages output.
- `scripts/check-source.mjs`: source consistency and integration checks.
- `cloudflare-pages/wrangler.jsonc`: existing production Pages and D1 binding; **do not alter account/project/database identifiers**.
- `cloudflare-pages/public/`: generated output; NEVER edit or commit it.

## Adding a new playable game — all steps required
1. Build the **actual playable** game in `public/<new-slug>/` (usually `index.html` and assets). Not a mock screen, click-to-score page, or placeholder.
2. Follow the existing site visual language and responsive layout; make it understandable within roughly 30 seconds, with clear controls, feedback, retry/replay and meaningful challenge or choices. Check desktop and mobile.
3. Add the real game link and appropriate thumbnail/metadata to `public/index.html`; keep only launched games in the public list and choose a sensible order.
4. Update canonical analytics: register the slug in the allowlist in `public/telemetry.js`, include the script on the game page, use `window.arcadeMetric` for game start, completion/end, retries, and relevant game-specific interactions. Ensure `/api/session` receives visit/session events; do not pretend that calling an arbitrary event records a new database category. Respect browser Do Not Track and Global Privacy Control.
5. Add a matching bilingual game label and row in `public/studio-insights/index.html`; place **homepage (hub) first**, then games in exactly the public homepage display order. Update the dashboard displayOrder and name mappings, not just text labels. Do not add dashboards for games that are not on the homepage.
6. Update translations everywhere they apply; check language toggling on the homepage, game, and dashboard. No stray English text in Chinese mode, duplicated translated fragments, or split-word translation bugs.
7. Preserve existing games (especially Tiny Town and Elsewhere), their analytics, D1 records and dashboard authentication. **Elsewhere** must be capitalized in English.
8. Update `scripts/check-source.mjs` if the new game needs coverage, and update `README.md` if architecture or visible game inventory changes.
9. Run `npm ci` and `npm run check`; play through a full run/retry in a browser if browser access is available, and test desktop/mobile layouts. If live browser tests are unavailable, say so specifically.
10. Commit and push to `main`; inspect GitHub Actions until the run is **success**, then check the actual public routes and analytics API behavior. A successful git push alone does not establish successful release.

## New-game organic discovery and distribution
- Treat the homepage's actual playable game links as the launch catalog. The build now automatically generates `sitemap.xml`, RSS `feed.xml`, `games.json` and VideoGame/social metadata via `scripts/discovery.mjs`; do not hand-edit generated production sitemap content.
- Provide accurate per-game title, description and preferably PNG/JPEG share thumbnail; SVG-only Open Graph images may not preview on social networks. Every new game launch will generate a tracked, per-game release kit in the GitHub Actions artifacts.
- Keep game and homepage metadata consistent. The unified Analytics dashboard includes UTM-attributed channel quality; use `utm_source`, `utm_medium` and `utm_campaign` in promotion links.
- Do not assume social posts or portal listings exist merely because release kits were generated. Platform submission/review or account authorization may still be required. No TinyFish, personal social accounts, spam posts or paid promotional tools.

## Platform targeting and AI-promotion safety (2026-11-20)
- Read `promotion/channel-policy.json` before any platform application, post, automation, or new channel work.
- Promote real browser gameplay, not follower/like/impression vanity metrics. Judge channel ROI on attributable game starts, finished runs and repeat play.
- Never submit to Newgrounds, r/playmygame or r/Games. Do not target r/IndieGaming unless its current rules explicitly permit this AI-assisted work and developer self-promotion.
- Do not auto-generate or auto-publish Reddit submissions; vet each subreddit for AI-use disclosures and promotional-post rules, including recent moderation examples, first.
- YouTube Shorts, TikTok and Instagram Reels are P1 channels. DO NOT reuse any old promotional videos: they show outdated gameplay and have unacceptable blur. Capture fresh high-definition clips from the current game build and verify playability/accuracy before any new video post; existing old videos may remain published unless they are misleading. Bluesky P2: Metricool now connects `morrowwishgames.bsky.social`, never the retired `ruckusbutton.bsky.social`. Avoid duplicate text-only announcements; check existing Metricool queue before scheduling. GitHub autopublishing requires explicit opt-in with new credentials.
- CrazyGames is on a single-game quality hold; Poki is conditional on originality and cold-player QA. itch.io is live but avoid bulk announcements, AI disclosure omissions and reposting to refresh discovery ranking.
- Existing scheduled social posts do not prove publication, clicks or gameplay. Do not change historical status to published without provider-issued evidence.

## Editing an existing game, homepage, or dashboard
- Locate the canonical source file(s), understand the current behavior, and make targeted changes without silently replacing other games or translations.
- For game changes, test the full playable loop and instrumentation.
- For homepage changes, verify both languages and every promoted link; keep game ranking and dashboard ordering aligned.
- Homepage hero tagline: preserve the approved Chinese sentence verbatim. On desktop it stays in a single line; at phone widths (700px and below), it must wrap naturally into visible lines without any horizontal scrolling. Verify at 390px and 320px. Do not revert to the old phone `white-space:nowrap` + `overflow-x:auto` behavior.
- For analytics changes, preserve existing event formats and Elsewhere dedicated reporting; do not change database or authentication secrets. Test whether events arrive rather than merely checking that the page loads.
- **Analytics historical-data release invariant:** NEVER replace existing displayed visit/start/finish/capture/replay counters with new-cohort-only numbers, zeros or blanks. Preserve historical values for the selected date range, make new cohort metrics an additional clearly labeled panel, and NEVER backfill them from legacy events. Before any dashboard/telemetry release, execute `npm run check` (which imports `test-dashboard-sorting.mjs`), `node scripts/test-analytics-integrity.mjs`, and the real Chromium `test-dashboard-history-browser.mjs` against legacy-only and mixed-V2 Cat Bond fixtures in Chinese and English, desktop and mobile. A failed old-number assertion must stop the Cloudflare deployment before release. Do not remove or weaken the fixtures to silence failures; repair the UI. Never report PASS without confirming the release workflow's success and public endpoint verification.
- Protect user data; never reset, wipe, or migrate production D1 without separate explicit authorization.

## Non-negotiable safety and cost rules
- Do not commit credentials, tokens, passwords, `.env`, `.dev.vars`, or keys.
- Do not create or delete Cloudflare projects/Workers/D1 databases, buy domains, enable paid tiers, change billing, or modify Vercel.
- Do not push broken code; do not claim a deploy or analytics fix succeeded without verification.
- The owner's collaborator authorization covers ordinary code edits and live game publishing, not infrastructure destruction or paid actions.

## Reduce redundant CI runs and notification noise
- Make related source changes and cache-version updates as **one coherent commit/push per task** whenever possible. Do not push one commit per edited game or file.
- Run static checks before the push; let GitHub Actions test the completed batch, not intermediate half-finished states.
- While another agent is editing the same repository, avoid repeated speculative pushes that cancel an in-progress deploy. Newer main revisions supersede older releases, but every push still creates Action run history.
- Do not disable actual deployment or gameplay checks just to suppress errors. Fix obsolete assertions when the authored assets or requirements legitimately change.
- Use the latest successful Cloudflare deploy as release evidence; standalone test failures and superseded/cancelled deploys are not evidence that the live site is down.

## Mandatory adversarial Supervisor Review — owner's standing instruction (2026-11-22)

The owner explicitly required: “call one supervior to always challenge your shit and keep up the bar。如果做的很垃圾/偷懒了，就督促你重做。把这个作为你每完成一项任务后的固定流程”.

**This is a mandatory delivery gate for EVERY task, not a congratulatory self-check.** After implementing and before declaring completion:

1. **Builder proof:** Enumerate the exact user requirements, reference assets/style and non-negotiable constraints. Point to changed source/assets, actual outputs, tests and game-screen evidence, not plans or mockups.
2. **Adversarial reviewer:** Run a distinctly separate review pass; challenge laziness, shortcuts, generic replacements, missing details, visual mismatch, integration bugs, regressions and deployment assumptions. The reviewer must be allowed to reject the work and require a new implementation. Do not claim a separate human/model reviewed it unless one actually did. If independence is unavailable, label the check as self-review and mark that limitation.
3. **Only PASS / FAIL / PARTIAL:** PASS means all requirements plus evidence are satisfied. FAIL means the deliverable is poor, wrong, misleading, or materially below reference; **rework before delivery**. PARTIAL means there is real progress, but important evidence or requirements remain; report blockers precisely and NEVER say "done"/"live"/"verified". No cosmetic checklist can turn an unknown into PASS.
4. **Supervisor report:** Include requirements met/unmet; suspected shortcuts; quality versus the real reference; strongest counterexamples; actual test and live proof; decision PASS/FAIL/PARTIAL; and concrete forced rework items. Rerun the gate after rework, not only once.
5. **Art-specific hard fail:** In Cat Bond, a crude vector/SVG, collage crop, upscaled small sprite, unrelated 3D mockup, procedural stand-in or generic cat is **not** a substitute for the approved original kitten's consistent **2D watercolor** style. Inspect real existing art first, compare proportions, texture, line, palette, lighting, visible face/eyes, outline and silhouette side by side at native resolution and in in-game battle/yard/portrait/duo, on phone and desktop. Test transparency, alpha edges and resolution; capture actual game frames. A code import or headless render test does not prove art quality.
6. **Art approval gate:** For a newly requested cat illustration, share the exact prospective **in-game 2D artwork** for owner review BEFORE calling the art approved or shipping it as final. Rejected art remains FAIL even if committed, present in the renderer or already publicly served. Preserve any underlying playable game functionality while replacing unapproved art.
7. **Release proof:** Commit != completed task; green headless tests != visually approved; ongoing/cancelled workflow != deployed. Verify correct git SHA, all pertinent CI gates, Cloudflare production and player-facing Vercel proxy separately before any "live" claim. If a test or source-version mismatch blocks release, fix or accurately mark PARTIAL.
8. **Repeated failure:** Preserve root-cause observations. Reattempt only with a substantive change/hypothesis, and do not weaken tests solely to greenwash. A Supervisor FAIL triggers implementation rework, tests, and another adversarial review.

**2026-11-22 negative example — SR Exotic Shorthair 圆宝/Jiafei:** The ad-hoc SVG committed at `public/cat-bond/assets/jiafei-sr-tank.svg` was rejected by the owner as ugly. Its existence, a successful renderer import, and previous "done" claims are NOT proof of acceptable artwork. Treat **dedicated character art as FAIL/unapproved** until redrawn to match the existing watercolor references, shown to the owner and accepted, tested in actual scenes, and deployed with evidence. See issue #57. The SR tank species data does not need to be deleted.

## Final report
Report: files changed; game URLs and gameplay changes; `npm run check` results; bilingual and analytics checks; Git commit SHA; GitHub Actions run URL and conclusion; live URL checks; and any genuine remaining blocker.
