# Morrow Wish

Publicly viewable source repository for the Morrow Wish browser-game studio. This repository is not open-source.

**Public website:** https://morrowwish.vercel.app/
**Unified dashboard:** https://morrowwish.vercel.app/studio-insights/


## Copyright and permitted use

© 2026 Morrow Wish. All rights reserved.

This repository is publicly viewable but **not offered under an open-source license**. Unless expressly stated otherwise, no permission is granted to copy, modify, redistribute, or republish its original source code, writing, artwork, or other protected content. Third-party materials retain their respective licenses and required attributions. See [COPYRIGHT.md](COPYRIGHT.md) for details.

## Production architecture

Vercel is ONLY the fixed public URL and reverse proxy. Its project-level rewrite routes requests to **Cloudflare Pages project `morrowwish`**. Game files, rules, APIs, and Analytics are all served by Cloudflare Pages + D1, with **no Vercel deployments required for updates**.

- `public/` contains the homepage, games, language switch and unified dashboard.
- `public/pawsibly-innocent/` contains Pawsibly Innocent!, an original cat stealth-puzzle game with eight themed rooms, yarn lures, collectible souvenirs, light stealth, roaming vacuums, five cats with perks, a daily remix, and bilingual text.
- `public/elsewhere/` is an illustrated anthology of eight dream lives: a brand-new Paris romance, carefree Amalfi luxury, a Tokyo superstar comeback, Iceland aurora wonder, a floating Maldives island, the extravagant Alpine Express, a five-star Moon hotel, and a whimsical magical Monday. Each has three opening-driven story arcs and three route-specific endings, plus one hidden ending: **80 bilingual collectible conclusions** across eight worlds. Each life takes five scenes, with linked choice consequences and narrated outcomes, not randomized disconnected events. `absurd-worlds.js` establishes the new surreal worlds' rules; `route-endings.js` authors 72 distinct route-and-choice combinations; `dreams.js` is the engine; `dreams.css` provides responsive presentation and a compact, expandable collector. Earlier story editions are preserved as inactive archives.
- `public/cat-bond/` contains Cat Bond (猫猫纽带), a cozy cat collector and RPG with cat collection, real-time battles, workshop, world map, Catdex, duo bonds, and Sunlit Garden. Authored in Chinese with a `js/i18n.js` display layer for English. **Current RPG story authority:** [docs/cat-bond-rpg/README.md](docs/cat-bond-rpg/README.md), the new six-region **The Last Resonance** canon. It supersedes the archived **The Last Page** story draft. Important: the narrative documents define the approved new story but do not prove that the playable game has been migrated; existing story code may still contain legacy content until separately updated and verified. Cross-device saves use browser-side AES-GCM encryption and a user-held recovery code; the existing D1 database stores the encrypted payload, a one-way recovery-token hash and revision metadata; it cannot decrypt the save. Local game resets pause automatic cloud sync so a reset cannot silently overwrite an existing backup.
- `public/tiny-town/` is the freedom-first **No More Mondays** game: seven wishes, 16 types of everyday freedom, combinable town wonders, optional neighbor dreams, two playable travel interludes and a personalized illustrated postcard. `game-v4.js` owns the deterministic rules; `freedom-scenes.js`/`.css` provide responsive illustrated free-day adventures using the shared studio artwork.\n- `public/index.html`: four signature featured worlds (Elsewhere, Tiny Town, Pawsibly Innocent!, Cat Bond) plus a separate section for quick mini-games.
- `public/telemetry.js`: game analytics events and supported game IDs.
- `public/lang.js`: shared Chinese and English interface.
- `public/studio-insights/index.html`: single Analytics dashboard and ordering.
- `src/worker.js`: API router, bundled into the Pages `_worker.js`.
- `src/cat-bond-cloud-save.js`: encrypted Cat Bond cloud-save API, bundled into the Pages Worker by `scripts/build-pages.mjs` and stored in the existing D1 database.
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

The same release automatically generates a per-game **promotion kit** as a GitHub Actions artifact, including `reddit-posts.json` and `reddit-posts.md` with honest community-specific launch drafts, prefilled submission links and per-game Reddit UTM tags. After a successful production deploy, genuinely **new visible game launches** also open a private GitHub issue containing their Reddit draft; code-only changes do not create Reddit campaigns. Reddit account ownership does **not** confer API posting approval, and the automation never pretends an issue or draft is a published Reddit post. Reddit posting requires the studio's authorized publishing route and current subreddit rules. `scripts/detect-new-games.mjs` identifies truly new visible game slugs relative to the prior homepage to prevent announcing every minor code change. Optional studio-only Bluesky publication can be enabled with GitHub secrets `MORROW_BLUESKY_HANDLE` and `MORROW_BLUESKY_APP_PASSWORD`; if absent, posting is safely skipped. Do not place these values in source control. Basic on-site attribution is tracked by UTM in the existing D1 Analytics dashboard, under **Promotion channel performance**. CrazyGames iframe links use `utm_source=crazygames&utm_medium=portal` and automatically suppress game cross-promotion links.

Game portals **are not social networks**. CrazyGames Basic Launch can consider externally hosted iframe games but requires platform submission and QA. itch.io requires its own project and publishing settings. GitHub promotion kits **do not imply** game-portal publication. Only use studio identities, follow each platform's policies, avoid bulk automated community spam, and prioritize gameplay/retention over impressions. Existing Cloudflare Pages and Vercel proxy architecture remains unchanged.
