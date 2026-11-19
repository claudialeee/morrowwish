# Morrow Wish

Private source repository for the Morrow Wish browser-game studio.

**Public website:** https://morrowwish.vercel.app/
**Unified dashboard:** https://morrowwish.vercel.app/studio-insights/

## Production architecture

Vercel is ONLY the fixed public URL and reverse proxy. Its project-level rewrite routes requests to **Cloudflare Pages project `morrowwish`**. Game files, rules, APIs, and Analytics are all served by Cloudflare Pages + D1, with **no Vercel deployments required for updates**.

- `public/` contains the homepage, games, language switch and unified dashboard.
- `public/pawsibly-innocent/` contains Pawsibly Innocent!, an original cat stealth-puzzle game with eight themed rooms, yarn lures, collectible souvenirs, light stealth, roaming vacuums, five cats with perks, a daily remix, and bilingual text.
- `public/index.html`: three signature featured worlds (Elsewhere, Tiny Town, Pawsibly Innocent!) plus a separate section for quick mini-games.
- `public/telemetry.js`: game analytics events and supported game IDs.
- `public/lang.js`: shared Chinese and English interface.
- `public/studio-insights/index.html`: single Analytics dashboard and ordering.
- `src/worker.js`: API router, bundled into the Pages `_worker.js`.
- `src/analytics.js`: Analytics API and server-side login.
- `cloudflare-pages/wrangler.jsonc`: production project name and D1 binding.
- `scripts/build-pages.mjs`: builds Pages from the canonical source.
- `CLAUDE.md`: integration rules for AI game developers.

The production Cloudflare project is **`morrowwish`** and its D1 database is **`morrowwish-analytics`**. `cloudflare-pages/public/` is generated and ignored by Git; DO NOT edit it directly.

## Install and validate

```sh
npm ci
npm run check
```

## Deploy changes (Cloudflare only)

```sh
npx wrangler login
npm run deploy
```

`npm run deploy` builds and deploys to the **existing Cloudflare Pages project `morrowwish`**. Never deploy Vercel, create a second Cloudflare Pages project, or modify the public URL. Deployments do not use Vercel's deployment quota.

The Analytics login key (`ARCADE_ANALYTICS_KEY`) is a secret in the Pages project, never in Git. Do not commit credentials, dashboard passwords or .env/.dev.vars files. Existing D1 records must be preserved.

## Add a game

Add `public/<game-slug>/`, link a card in `public/index.html`, add the game slug to `public/telemetry.js`, and register its display name and its homepage-consistent order in `public/studio-insights/index.html`. Keep **Elsewhere** capitalized, existing detailed Elsewhere analytics functional, and language support bilingual.

## Collaborative publishing

All coding agents should read [AGENTS.md](AGENTS.md) first; Claude also reads [CLAUDE.md](CLAUDE.md). These files document source layout, new-game integration, bilingual content, telemetry, unified dashboard ordering, tests, production restrictions, and verified-release reporting.

The authorized collaborator `Kartepolo` has GitHub write permission and may **push directly to `main` for ordinary code changes without owner approval**. Feature branches/PRs are optional when useful; they are not an approval prerequisite. The active GitHub Actions workflow at `.github/workflows/deploy-cloudflare.yml` checks source and deploys qualifying `main` pushes to the **existing Cloudflare Pages project** using the `CLOUDFLARE_API_TOKEN` repository secret. Do not redeploy Vercel or create replacement Cloudflare resources. After a push, check the Actions run and verify the live game and analytics; a pushed commit is not automatically proof of a successful release.

The `automation/deploy-cloudflare.example.yml` file is an inactive legacy template.

## Growth and discovery automation

Every successful GitHub Actions release generates a complete public `/sitemap.xml`, `/feed.xml`, and `/games.json` based on **actual visible playable homepage links**. Game pages receive missing social metadata and VideoGame JSON-LD during the existing Cloudflare Pages build. New URLs are submitted to IndexNow only after live verification; Google discovers the sitemap separately (Search Console setup still requires site verification).

The same release automatically generates a per-game **promotion kit** as a GitHub Actions artifact. `scripts/detect-new-games.mjs` identifies truly new visible game slugs relative to the prior homepage to prevent announcing every minor code change. Optional studio-only Bluesky publication can be enabled with GitHub secrets `MORROW_BLUESKY_HANDLE` and `MORROW_BLUESKY_APP_PASSWORD`; if absent, posting is safely skipped. Do not place these values in source control. Basic on-site attribution is tracked by UTM in the existing D1 Analytics dashboard, under **Promotion channel performance**. CrazyGames iframe links use `utm_source=crazygames&utm_medium=portal` and automatically suppress game cross-promotion links.

Game portals **are not social networks**. CrazyGames Basic Launch can consider externally hosted iframe games but requires platform submission and QA. itch.io and Newgrounds typically require HTML5 uploads and their own publishing settings. GitHub promotion kits **do not imply** game-portal publication. Only use studio identities, follow each platform's policies, avoid bulk automated community spam, and prioritize gameplay/retention over impressions. Existing Cloudflare Pages and Vercel proxy architecture remains unchanged.
