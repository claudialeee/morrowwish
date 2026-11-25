# Chat 7 — Forge Guardian vertical slice
**Status: PARTIAL — runtime implementation committed; not yet verified as playable in a browser.**
## Canon and entry point
- Canon scene: `forge:E-03`
- Required narrative operation: `battle:forge-guardian`
- Canon support cast IDs: `jinpo`, `xiaomao`
- Isolated QA entry: start/load a save and visit the world, then open Cat Bond with query parameter `?combat=forge`. The optional route launches the test encounter after a real save slot and team exist. It is not a production story trigger and must not be used to bypass narrative prerequisites.
- Chat 4 owns the campaign state. Call `window.CatBondForgeCombat.bindNarrative(engine)` with the active Chat 4 engine instance after it is created for the current save slot. On actual battle victory the adapter calls `record('forge:E-03','battle:forge-guardian')`; no second story save is created. Until bound, preview victory does not advance story progress.
## Files
- `public/cat-bond/js/resonance/forge-combat-rules.mjs` — pressure, phase, telegraph, support and damage rules.
- `public/cat-bond/js/resonance/forge-combat-runtime.mjs` — adapter to existing `Battle.CaptureBattle` / `Game`; boss AI, attacks, hazards, NPC support, win/defeat/retreat/retry and result handling.
- `public/cat-bond/assets/combat/emberforge-arena.svg` — original detailed vector arena.
- `public/cat-bond/assets/combat/forge-guardian.svg` — original mechanical feline guardian.
- `public/cat-bond/assets/combat/jinpo-portrait.svg`, `xiaomao-portrait.svg` — original support portraits.
- `public/cat-bond/css/forge-combat.css` — scoped encounter HUD and result overlay.
- `public/cat-bond/js/battle.js` — guarded hooks for encounter-only background, enemy renderer and molten projectiles; ordinary battles delegate to existing render/AI.
- `public/cat-bond/js/main.js` — query-gated QA entry only.
- `public/cat-bond/index.html` — loads the encounter CSS and module.
- `scripts/test-cat-bond-forge-combat.mjs` — pure encounter-rule test.
## Implemented behavior
- Reuses existing 2-cat field squad, reserves, elemental damage, skills, auto/manual modes and Duo system; no separate cat roster.
- Guardian uses existing arena movement planner with its generic attack kit suppressed, then its own three telegraphed attacks: hammerfall, five-shot slag fan and three steam vents.
- Heat rises through the encounter. At 65% pressure the core is armored; Jinpo and Xiaomao's two-use coolant bypass lowers pressure and exposes the core for six seconds. At 100% pressure a radial burst creates dodge zones.
- Boss phases change at 55% and 22% HP; phase 2 shortens telegraphs and introduces chained steam vents.
- Defeat, retreat and victory are distinct; no boss capture or Catdex entry. Victory grants 80 coins, 2 fish and 42 battle XP per participating cat. Existing casual/hardcore recovery paths are preserved in the encounter handler.
- Result, HUD and boss label support live Chinese/English switching. No new looping music is added; existing battle audio routing remains unchanged.
## Tests and evidence
- `node scripts/test-cat-bond-forge-combat.mjs`: 36 assertions passed in a local Node 22.16.0 run. The test covers three attack sets, phase thresholds, pressure burst, two-use support, damage scaling, target capture and invalid-state rejection.
- This is a rules test, not a live battle test.
- Runtime module, canvas integration, asset loading, boss balance, battle cleanup, result UI and query launch have NOT been executed in a real browser.
- Desktop, phone portrait, phone landscape, operation-area fullscreen, input, performance, EN/ZH live switching, Duo regression and ordinary-battle regression are NOT TESTED.
- SVG assets are original vector source artwork; Chat 6 has not independently approved their final visual quality. The generated painterly background concept is not committed or mounted in this runtime.
## Next work
1. Run this branch in an actual browser without deploying to production; verify launch, live battle, hit detection, all three attacks, phase transitions, support, win/defeat/retreat/retry and clean return.
2. Replace the first-pass SVG arena with the approved high-resolution painted background and obtain Chat 6's visual review; verify the guardian and two NPC portraits against the Character Visual Bible.
3. Fix all runtime issues found; then submit this slice for independent review.
4. Implement distinct playable enemy encounters for the other five regions; do not copy/paste this boss with palette changes.
5. Implement B-01–B-04 only after the six-region combat adapters and NPC/region evidence are stable.
