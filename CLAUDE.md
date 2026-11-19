# Morrow Wish — Claude development instructions

Read `AGENTS.md` and `README.md` **before** editing; their collaboration, deployment, analytics, bilingual, safety, and test requirements all apply.

You are modifying the **existing** Morrow Wish browser-game studio in private GitHub repository `claudialeee/morrowwish`.

- Site: https://morrowwish.vercel.app/
- Production content and API: Cloudflare Pages **morrowwish**, D1 **morrowwish-analytics**.
- Vercel only forwards to Cloudflare Pages; never deploy Vercel.
- Source: `public/` and `src/`; `cloudflare-pages/public/` is generated; do not edit it.
- Preserve existing games, especially Tiny Town and Elsewhere; always capitalize Elsewhere in English.
- New game: playable route + homepage card + bilingual translation + telemetry allowlist and events + unified dashboard row/order + tests.
- Collaborator `Kartepolo` is authorized to push directly to `main` and publish ordinary code changes without requesting owner review. Optional PRs are fine, but not required; the GitHub Actions workflow automatically deploys on qualifying `main` pushes.
- Run `npm run check`, verify gameplay and translations, then confirm CI success and check the deployed URLs. No approval loop, no unverified success claims.
- Never create extra projects, delete/overwrite D1 data, change billing, expose secrets, or redeploy Vercel.

Follow all detailed instructions in `AGENTS.md`; report the commit, deployment run, changed game URLs, verification, and failures.

Organic discovery and release workflow: `scripts/discovery.mjs` generates search metadata, `sitemap.xml`, `feed.xml` and `games.json` from visible gameplay links during the Cloudflare build. GitHub Actions produces tracked channel promotion kits; truly new game slugs are detected via `scripts/detect-new-games.mjs`; optionally connected studio Bluesky can publish, but portal submissions still require their own approvals. Maintain proper game-specific descriptions and visual preview assets and verify real live links before marketing. Respect the unified Analytics dashboard's promotion channel attribution, existing deploy architecture and no-TinyFish rule.
