# Cat Bond — web release gate and future platform plan

Updated: 2026-11-22. Status: **candidate / QA hold**, not a shipped Steam or mobile build.

## Product principle
Keep the current HTML5/Canvas gameplay, cat data, skill calculations, and save schema authoritative.
Platform integration must live behind the tiny `public/cat-bond/js/platform.js` host adapter.
A successful web launch is evidence to invest in other platforms; it is not a reason to rewrite the engine now.

## Web release gate
1. **Real cold-player QA:** have people unfamiliar with the project start with empty saves; record whether they select a cat, find the first wild cat, finish the first fight, capture, and reach their next self-selected activity within five minutes.
2. **Controls and viewport:** verify Chrome, Edge, Safari where supported; keyboard + mouse, touch, and at least 821×462, 907×510, 800×450 and 390×844. Check the top HUD, battle buttons, scrolling panels, dialogs and iOS safe areas.
3. **Game-loop regression:** test manual/auto battle, five maps, 33 breed collection, rarities, first capture, returning player, duo cinematic once, pause/resume, and long-session progress; verify no silent JavaScript errors.
4. **Save integrity:** test refresh, background/foreground, navigation, old save migration, save-full and blocked localStorage. Never clear other games' storage. Keep `catbond_save_v1` readable until an explicit versioned migration exists.
5. **Portal privacy:** CrazyGames host mode must not show Morrow Wish playable links or custom fullscreen controls. CrazyGames Basic Launch uses host reporting instead of a persistent first-party visitor ID. Other portals retain normal first-party attribution.
6. **Distribution assets:** verify CrazyGames iframe URL serves the commit intended for review. Check externally hosted first-play loading time (target no more than 20 seconds) and link resources. For future ZIP/offline builds, convert root-absolute asset paths to relative/bundled paths and audit game file count and initial download size. Do not claim offline packaging is ready today.
7. **Release:** only mark `promotion/crazygames-quality-gate.json` approved after written gameplay, cold-player, visual, technical preview and asset-rights evidence. Do not auto-submit from a local smoke-test pass.

## Potential mobile apps (conditional)
- Prototype the game in an iOS/Android WebView shell only after retention/engagement evidence; preserve touch controls and safe-area layout.
- Put OS lifecycle, audio interruption/resume, controller/haptics, app-specific billing, notifications and privacy into native adapters. Do not put store checks inside the combat engine.
- Provide explicit export/import and later cloud synchronization with conflict resolution and save schema migration; **neither is implemented yet**.
- Test offline asset packaging and cold-start performance. Do not assume web URLs or current localStorage persistence are portable.
- Meet platform rules for permissions, purchases, accounts, content ratings and privacy before any store submission.

## Potential Steam build (conditional)
- Evaluate a lightweight packaged Chromium shell versus an engine migration based on real frame-time, gamepad and offline needs; do not choose a new engine prematurely.
- Keep keyboard/mouse UX, add gamepad focus/navigation and scalable desktop resolutions, and test full-screen/alt-tab/resume.
- Support offline bundled assets, durable local saves, and (if appropriate) Steam Cloud / achievements through a dedicated bridge, never inside core state/battle logic.
- Expand content/replay depth and accessibility before asking players to pay for a desktop edition.

## Evidence to track before deciding to port
First encounter completion, first capture, first meaningful second session, return rate, play-session duration, saved-progress recovery, control failures and mobile frame-times.
Interpret these by platform and acquisition source; do not count automated QA views as real players.

## Scope of current implementation
The host adapter handles CrazyGames detection, cross-promotion/fullscreen ownership, optional native-host markers and first-party telemetry policy. Background save is handled by `main.js`. **No native SDK, cloud save, gamepad support or app store distribution is claimed to exist.**
