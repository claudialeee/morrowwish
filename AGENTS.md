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

## Editing an existing game, homepage, or dashboard
- Locate the canonical source file(s), understand the current behavior, and make targeted changes without silently replacing other games or translations.
- For game changes, test the full playable loop and instrumentation.
- For homepage changes, verify both languages and every promoted link; keep game ranking and dashboard ordering aligned.
- For analytics changes, preserve existing event formats and Elsewhere dedicated reporting; do not change database or authentication secrets. Test whether events arrive rather than merely checking that the page loads.
- Protect user data; never reset, wipe, or migrate production D1 without separate explicit authorization.

## Non-negotiable safety and cost rules
- Do not commit credentials, tokens, passwords, `.env`, `.dev.vars`, or keys.
- Do not create or delete Cloudflare projects/Workers/D1 databases, buy domains, enable paid tiers, change billing, or modify Vercel.
- Do not push broken code; do not claim a deploy or analytics fix succeeded without verification.
- The owner's collaborator authorization covers ordinary code edits and live game publishing, not infrastructure destruction or paid actions.

## Final report
Report: files changed; game URLs and gameplay changes; `npm run check` results; bilingual and analytics checks; Git commit SHA; GitHub Actions run URL and conclusion; live URL checks; and any genuine remaining blocker.
