# Pawsibly Innocent! — pre-release core-loop QA (2026-11-22)

**Gate: HOLD / PARTIAL.** This audit is not external-portal approval.

## Scope
Reviewed canonical source `public/pawsibly-innocent/`: eight maps, stealth AI, three-fish escape, four-fish three-star run, yarn distraction, room bonuses, cat power progression, save state, daily remix, bilingual HUD, portal iframe styles and regression scripts.

## Findings / patch
- **P1, fixed:** switching cats during a live heist could regenerate Marmalade's free starting yarn indefinitely. Other loadouts are now locked after a genuine action until the run ends or restarts. Switching before the run sets precisely the selected cat's initial yarn.
- **P2, fixed:** an opening yarn throw previously failed to set `started` / emit `game_start`. A valid first throw now starts the tracked run.
- **P2, fixed:** the in-menu progress meter showed 0/4 despite a three-fish escape goal. It now shows 0/3 and labels the optional fourth fish separately; the top HUD matches.
- **Regression protected, not a confirmed bug:** existing menu pause keeps the yarn investigation state intact and resumes the owner when closed.

## Evidence and constraints
- Static shortest-path calculations found reachable four-fish + applicable physical bonus + exit paths in all eight room maps within published three-star step allowances. This does NOT prove safe routes against dynamic guards.
- Existing `scripts/check-pawsibly.mjs` asserts actual eight-room no-hit and eight-room perfect three-star deterministic scripted routes, but the full test suite needs a fresh CI execution on this patch.
- Added deterministic and Playwright checks for yarn-first tracking, pause/resume, finite per-run loadout and mission progress.
- JavaScript parsing and an isolated mocked-DOM runtime scenario were executed successfully when preparing this patch.
- **Not verified:** fresh green GitHub Actions, Cloudflare/Vercel live revision, physical/mobile screenshots, page performance, real cold-player fun/comprehension, and CrazyGames portal review preview. Browser-agent quota currently prevents direct independent live clicking.
- Leave `promotion/crazygames-quality-gate.json` at `status: hold`. No external submission.

## Required for release PASS
Execute `npm ci && npm run check` and the full Chromium/mobile/fullscreen Playwright workflows on the exact commit. Inspect deployment and 907×510/800×450 portal embeds, phone 320/390px input, FPS and visual clipping. Gather unprompted first-time-player evidence and retention; conduct a separate adversarial playability review before changing HOLD to approved.
