# Morrow Wish

Private source repository for the Morrow Wish browser-game studio.

**Public site:** https://morrowwish.vercel.app/  
**Studio dashboard:** https://morrowwish.vercel.app/studio-insights/

## Architecture

Vercel is a **fixed, unchanging URL/reverse-proxy layer only**. Never redeploy it for game updates. The production game files, logic and Analytics run on **Cloudflare Workers + Assets + D1**. Cloudflare Pages (`morrowwish`) is a secondary independent deployment. All ordinary updates are deployed to the existing Cloudflare Worker `ruckus-button`.

- `public/index.html`: games home and rankings
- `public/<game-slug>/`: each browser game
- `public/telemetry.js`: shared visit/game metrics; register new game IDs here
- `public/lang.js`: shared English/Chinese switch
- `public/studio-insights/index.html`: single Analytics dashboard and display order
- `public/elsewhere/`: Elsewhere game and story assets
- `src/worker.js`: Cloudflare Worker router
- `src/analytics.js`: API and Cloudflare D1 queries, shared by both deployments
- `wrangler.jsonc`: existing production Worker and D1 bindings
- `scripts/build-pages.mjs`: generates secondary Pages deployment from the same source files
- `cloudflare-pages/wrangler.jsonc`: secondary Pages binding config

## Develop

Edit existing source in `public/` and `src/`. **Do not treat `cloudflare-pages/public/` as source:** it is generated and gitignored.

```sh
npm install
npm run check
```

Deploy **only Cloudflare Worker** to production:

```sh
npx wrangler login
npm run deploy
```

Publish independent Cloudflare Pages backup when required:

```sh
npm run deploy:pages
```

The Pages deployment is optional; routine updates go to the Worker only. Never deploy Vercel, create additional Cloudflare Workers, upgrade plans, buy domains, or reset D1. The dashboard password is an existing secret `ARCADE_ANALYTICS_KEY` stored in Cloudflare, **never** in the repository. Do not commit OAuth tokens, Wrangler auth files, passwords, or access-code files.

## Analytics integration

When adding a game, add its route to `public/index.html`, whitelist its ID in `public/telemetry.js`, integrate calls to `window.arcadeMetric` for important gameplay events, and add its display name and order to `public/studio-insights/index.html`. Keep hub first, preserve Elsewhere detailed reports, and check DNT/GPC behavior. Keep all games bilingual where possible.

## CI publishing

`automation/deploy-cloudflare.example.yml` is a **manual-run-only** GitHub Actions template, intentionally not active. To enable it later, move it to `.github/workflows/deploy-cloudflare.yml` with a GitHub credential authorized for workflow changes, and configure the repository secret `CLOUDFLARE_API_TOKEN` with narrowly scoped Cloudflare Worker edit permissions. It will never deploy Vercel. No GitHub Action is configured to run on push in the current repository.
