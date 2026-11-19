# Morrow Wish

Private source repository for the Morrow Wish browser-game studio.

**Public website:** https://morrowwish.vercel.app/
**Unified dashboard:** https://morrowwish.vercel.app/studio-insights/

## Production architecture

Vercel is ONLY the fixed public URL and reverse proxy. Its project-level rewrite routes requests to **Cloudflare Pages project `morrowwish`**. Game files, rules, APIs, and Analytics are all served by Cloudflare Pages + D1, with **no Vercel deployments required for updates**.

- `public/` contains the homepage, games, language switch and unified dashboard.
- `public/index.html`: homepage and ordered game cards.
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

Contributors work in feature branches and open pull requests into `main`. The Actions workflow in `automation/deploy-cloudflare.example.yml` is an **inactive, manual-only template**, not installed as an active workflow. Only the owner deploys after reviewing and merging PRs. No push triggers a deployment.
