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

## Push lock on main (STANDING — owner mandate 2026-11-26)

**NEVER push to origin/main unless the owner types "push main" verbatim in the same session.** `push`, `yes push`, `go push`, implicit greenlight — none of those unlock main. Branches other than main may be pushed with normal `push`/`yes` consent. If the owner reacts to an unauthorized main push with frustration, do NOT silently rebase past it; ask once for explicit force-push authorization and stop if denied.

## Supervisor loop (STANDING — owner mandate 2026-11-26)

Every time you finish a piece of real work (edit + commit, or a visible deliverable), you MUST spawn a `supervisor` subagent before claiming done. The supervisor's job is to brutally verify:

1. **Did you actually complete what the owner asked, or a convenient subset?** Check against the latest user message, not your own summary.
2. **Did you lie or hedge?** Any claim that something "works" / "is added" / "is wired" must be backed by a file:line read or a test run shown in the transcript.
3. **Did you take shortcuts** the owner didn't approve (skipping delete-this-skill, bundling commits, skipping checks, leaving stale cache-busters, skipping i18n, skipping specs)?
4. **Did you cross-reference the source spec** (V4/V5 doc, pasted plan, owner's exact words) line by line? Or did you cherry-pick?
5. **Does `npm run check` + the 4 combat scripts still pass?**

Supervisor returns `PASS` or a punch list. On punch list you MUST keep fixing and re-spawning supervisor until it returns `PASS`. Do NOT tell the owner "done" between failed supervisor rounds. Do NOT self-mark `PASS` — the supervisor subagent is a separate call.

Prompt for the supervisor lives at `.claude/supervisor-prompt.md` — read + inline it every time.

## 5-min cron — anti-laziness, anti-lying

A short 5-minute cron (see `.claude/crons/poke-agent.md`) audits:
- Any TaskList entries left `in_progress` with no commits in the last 5 min.
- Any user ask in the last message that was not either (a) delivered, (b) explicitly declined with reason, or (c) still mid-work.
- Any commit in the last 5 min whose message asserts a fact unsupported by the diff.
- Any "done" claim whose cache-buster, i18n, or spec-cross-ref is missing.

On any hit the cron pokes until the item is fully resolved — not until it's "addressed", not until the summary reads clean. Owner directive: **truly done, truly honest, or keep poking**.
