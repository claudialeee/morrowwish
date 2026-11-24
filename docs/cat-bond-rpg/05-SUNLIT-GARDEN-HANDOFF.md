# Chat 5 — Sunlit Garden Module Handoff
## Owner: garden environment, home presentation, cultivation integration
## Canon: The Last Resonance · Canon 1.0

This is an independent home-space implementation. It does not own the overworld, combat engine, narrative runtime, dialogue, NPC relationship state, or Save Manager.

## 1. Canon and dependency contract
- Only the new Cat Bond RPG canon is authoritative. Never revive The Last Page.
- State.S.resonance is the campaign source of truth. Chat 5 derives garden presentation from its sanctuaries, returned, completed, postgame and current scene fields. It never writes campaign progress.
- Chat 4 owns NPC identities, dialogue, relationships, choices, tasks, return conditions and postgame events. Chat 5 owns home anchors, environment art, lighting, garden activity spaces and interaction hit areas.
- Chat 3 owns the overworld and region travel. The existing Game.openWorldMap() / WorldMap.onExit() path remains the travel boundary.
- Chat 2 owns the three-slot Save Manager and cloud sync. Garden-specific presentation state is nested under State.S.sunlitGarden; no second localStorage, IndexedDB or cloud store is allowed.

## 2. Data ownership
| Data | Owner | Garden integration |
|---|---|---|
| Cat identities, levels, stats, skills, collection | Chat 2 Save Manager + existing State.S.cats | Read existing cat objects; never duplicate them |
| Yard buildings and placement | Chat 5, persisted by Chat 2 | Existing State.S.yardBuildings |
| Workshop stations, workers, production, breeding | Existing Raising system | Read/actions through Raising only |
| Catdex discovery | Existing Catdex/collection state | Read State.S.dex; do not invent a second dex |
| Duo Bond, trust tiers, memories | CatRelations | Read/render through its API |
| Duo Promises and narrative consequences | Chat 4 | Provide scene anchors and visual space; do not create parallel quest state |
| NPC identity, relationship, dialogue, visit/return flags | Chat 4 | Consume a registered narrative adapter |
| Campaign scenes, sanctuary repairs, reciprocal links, ending | Chat 4 | Read State.S.resonance; never grant or complete story operations |
| Garden visit metadata and visual decorations | Chat 5 | State.S.sunlitGarden, inside the active slot snapshot |

## 3. Narrative adapter
Chat 4 may register this adapter after its runtime is mounted:
SunlitGarden.registerNarrativeAdapter({ getHomeNpcs, drawHomeNpc, interactHomeNpc })

- getHomeNpcs() returns only NPCs whose canonical story state currently permits them to be physically present.
- drawHomeNpc(ctx, npc, {x, y, scale, time}) renders approved original character art supplied by the narrative module. Missing art must not be replaced by emoji or generic sprites.
- interactHomeNpc(id) delegates to Chat 4 dialogue/quest runtime. Chat 5 does not open its own dialogue system.
- Stable home anchors are exported as SunlitGarden.homeAnchors. The muling anchor is the tea terrace; regional cast anchors are near their related home spaces.
- Muling's pre-reveal, post-reveal and postgame visibility/content must be selected by Chat 4, never inferred or authored by Chat 5.

## 4. Visual deliverables in this increment
- assets/sunlit-garden-cinematic.svg: original, text-free, layered fantasy garden environment artwork. Actual cat entities, placed facilities, NPCs and ambient particles are rendered by the game over this background.
- sunlit-garden.js: home hotspot controller, canonical progress adapter, returned-NPC anchors, sanctuary restoration accents and home entry/exit hooks.
- style.css: garden-specific responsive presentation and location controls. CSS positions controls only; it is not used as a substitute for scene art.
- world.js: loads the new environment art and draws restored-sanctuary accents behind cats/facilities.
- game.js: routes garden entry/exit and NPC hit testing through the module.
- index.html: loads the module after the main controller is defined.

## 5. Acceptance gates
- Garden is shown only when game.scene === 'yard'; world map remains the main RPG interface.
- Scene art contains no baked UI, text labels or fake NPCs.
- Existing cats, facilities, loot, seek/feed/play/build, Catdex, workshop, duo bond and map return remain interactive.
- Only canonical State.S.resonance controls sanctuary/return/postgame presentation.
- NPCs are drawn only when Chat 4 provides approved art and a valid home-return state.
- All garden state remains inside the active Save Manager slot.
- No production deployment from this branch. Final integration owner performs merge, cross-module QA and Cloudflare Pages release.

## 6. Status
This is an implementation handoff for the first independent increment. It does not claim full garden acceptance, final art approval, completed NPC art, full mobile visual QA, or production deployment.
