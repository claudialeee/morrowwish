# Chat 7 — Combat Supervisor
**Status:** PARTIAL · 2026-11-24 · isolated branch only  
**Branch:** `rpg/combat-integration`  
**Base:** `1476c6a03097c92126744c7a52b4e123917bba0b`  
**Canon:** The Last Resonance only. No merge or production deploy.
## Supervisor findings
- Main branch still contains active legacy The Last Page code in `public/cat-bond/js/story-cloud.js`; must be removed/replaced by Chat 2/4 before campaign integration.
- Chat 3 world model and Chat 4 narrative engine currently have separate campaign state models. Chat 4's slot-local engine must own narrative state. Chat 3 should own world position/puzzle runtime only, with a documented adapter and canonical NPC IDs.
- Forge E-03 uses Chat 4's exact scene ID `forge:E-03`, operation `battle:forge-guardian`, and NPC IDs `jinpo` / `xiaomao`. The combat module does not create story state. `bindNarrative(engine)` is an explicit adapter to Chat 4's engine; it calls `engine.record(sceneId, operation)` only after an actual win and stores the returned snapshot under the active `State.S.resonance`.
- Chat 6's Art Direction and Character Visual Bible are design authority. Chat 7's SVG assets are original first-pass vector assets, not independently approved final painterly art.
## Current implementation
See `08-FORGE-VERTICAL-SLICE.md` for the current code, assets, preview route, test evidence and limitations.
## Release gates
No module passes on code presence alone. Required evidence: actual desktop and phone portrait/landscape playthrough; mobile operation-area fullscreen; live EN/ZH switch for every open panel; battle result/retry/retreat; all six elements, auto/manual/smart modes, team/reserves and Duo regression; all 32 breed mappings and 63 original paintings/three bond tiers; slot-local save and real cross-device restore; full six-region and B-01–B-04 playthrough; Chat 6 independent visual approval; build and Cloudflare production commit match; post-deploy verification.
## QA status
- 42 isolated finale state-machine assertions: PASS (self-test; simulated events only).
- 36 Forge encounter rule assertions: PASS (Node 22 local test of the committed rule logic; not a browser battle).
- Runtime wiring and SVG source existence: committed; browser execution NOT TESTED.
- Full npm check, browser/real-time battle, desktop/mobile, real saves, independent visual QA, all six regions, final boss, CI and Cloudflare deployment: NOT TESTED.
- No production D1 queries, no extra GitHub Actions run, no TinyFish, no paid tools.
- No merge, no production deploy, no release authorization.
