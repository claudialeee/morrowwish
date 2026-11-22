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
 
## Simulated player follow-up · 2026-11-22
The novice click-nearest-fish test completed rooms 1,2,3,6,7, stalled on rooms 4 and 5, and lost room 8. Root causes for stalls: a robot occupied a fish in room 4 and the human occupied one in room 5. Both only advance on turns. Re-clicking the occupied fish did nothing and no wait option existed. Implemented a new ⏳ Wait action (period key) which spends a step and advances patrol, robot and sight without moving the cat. Added specific bilingual occupied-fish guidance and rendered the hidden fish marker atop its blocker. Waiting while spotted remains dangerous. Regression checks cover both blockers and exposure. The release gate stays HOLD.
 
## Hosted Chromium run 1: concrete defect discovered
Workflow runs 45074534302 and 45074529468 both PASSED dependency installation, CC0 audio loading, core rules and the full `npm run check`. Browser smoke failed due to a stale 0/4 portal assertion after legitimate goal change to 0/3. This was a test bug, not evidence that fish were missing. Independent browser geometry **did** expose unreadable bonus controls: 22px at 900×520 and 41px at 1024×600. Changed short-desktop layout to a full-width action row while shrinking the board enough to preserve no-scrolling play. Added a minimum bonus width gate and screenshot capture for desktop, mobile and portal sizes; next full CI run required.
