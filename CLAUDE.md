# Morrow Wish instructions for Claude Code and other coding agents

You are editing an **existing** Cloudflare browser-game site, not creating a standalone project.

## Mandatory rules
1. Read `README.md` and inspect the current code before editing.
2. Preserve Tiny Town v3, Elsewhere stories and assets, other games, and all D1 records.
3. Add each new game at `public/<slug>/` and register it in the existing homepage and unified Analytics dashboard.
4. Follow the existing `public/telemetry.js` event format; use `window.arcadeMetric` for meaningful game events. Follow user privacy settings.
5. Update homepage ordering and `displayOrder` / `gameNames` in `public/studio-insights/index.html`.
6. Respect bilingual `public/lang.js` and the **Morrow Wish** brand. Use **Elsewhere** (capitalized) everywhere in the UI.
7. Keep login/Analytics protected. Never include any dashboard password, API token or OAuth file in code or Git.
8. Run `npm run check` and test games on mobile/desktop browsers. Do not claim gameplay tested if only HTTP status was checked.
9. **Deploy only Cloudflare** with `npm run deploy` (existing Worker `ruckus-button`). Do not deploy to Vercel: `morrowwish.vercel.app` is an unchanged proxy.
10. Do not rebuild or rename the Cloudflare D1 database. Do not buy domains, enable paid plans, or remove other game assets.
11. `public/` and `src/` are sources of truth; `cloudflare-pages/public/` is generated, not hand-edited.
12. Report exact game URL, changed paths, and Analytics verification results.

## Useful entry points
- Public URL: https://morrowwish.vercel.app/
- Dashboard: https://morrowwish.vercel.app/studio-insights/
- Main Worker name: `ruckus-button`
- D1 database: `ruckus-button-analytics`
- Build & validate: `npm run check`
- Publish Worker: `npm run deploy`
