# Cat Bond RPG — Supervisor Integration Contract v1
Effective 2026-11-24. Scope: Chat 0–7 and overall Supervisor.
This governance contract implements the approved division of responsibilities; it does not replace Canon 1.0 or reduce any existing requirements. The integration branch is a non-production staging branch. No release is authorized by this document.

## Authority and ownership
| Owner | Exclusive responsibilities | Primary paths / boundaries |
|---|---|---|
| Chat 0 | Product direction, requirements, gameplay decisions | Product requirements; no independent runtime implementation |
| Chat 1 | Canon, script, narrative continuity | docs/cat-bond-rpg/README.md, 01-NARRATIVE-BIBLE.md, 02-MAIN-STORY-SCRIPT.md, 03-DEVELOPER-HANDOFF.md |
| Chat 2 | Title/menu, three slots, local/cloud save lifecycle, cinematic entry | save manager, save/cloud transport, title/menu module; invokes Chat 6 player; no world map or independent story |
| Chat 3 | Atlas, six region exploration, movement, puzzles, physical world evidence | resonance/world-bridge.mjs, world-runtime.mjs, world-exploration.mjs, atlas/exploration assets and scoped CSS; no second narrative engine or NPC dialogue authority |
| Chat 4 | Canonical story engine, dialogue, quests, NPCs, relationships, NPC portraits and in-world assets | resonance/campaign.mjs, engine.mjs, dialogue UI, NPC runtime and assets/npc/; no alternate NPC sample state |
| Chat 5 | Garden, facilities, cat cultivation, workshop, home activity and garden art | sunlit-garden.js, garden-specific rendering in world.js, garden assets and scoped CSS; no story/NPC trust authority |
| Chat 6 | Art direction, key story illustrations, cinematic player, independent visual QA | cinematic-presentation.js, cinematic-scenes.js, assets/cinematics/, cinematic CSS, visual standards; not an art outsourcing team for other modules |
| Chat 7 | Actual battle runtime, AI, enemy art, skills, combat mechanics, region bosses and finale | battle.js, resonance/*combat*, assets/combat/, battle-scoped CSS; no parallel narrative state or release approval |
| Supervisor | Interface arbitration, integration branch, cross-module tests, independent release gate | Integration contract, shared wiring, integration PRs and release approval |

Paths are ownership boundaries, not permission to delete existing features. Existing branches can keep reviewed changes while converging; do not overwrite other contributors or force-push shared refs. Shared files (index.html, game.js, main.js, state/save plumbing, i18n.js, style.css, package.json, common CI, shared assets) require explicit cross-owner coordination through the Supervisor. Prefer scoped modules, unique namespaces, small patches, and describe required shared wiring in the PR. All teams remain responsible for their own original production-quality art.

## Runtime contract: source of truth and slot lifecycle
- Canon: The Last Resonance, the six-region Canon 1.0 script; The Last Page is archived and never an active campaign.
- Chat 4 owns campaign.mjs and makeEngine(campaign, savedNarrative) in public/cat-bond/js/resonance/. Only the active slot's State.S.resonance is authoritative for story. No lastResonanceWorld, npcStories, global campaign object or parallel trust/quest progress may participate in the release path.
- Region IDs per Chat 4: garden, harbor, forest, forge, sky, library, starfall. All NPC IDs, scene IDs (namespaced, e.g. forge:E-03), operations and choice IDs are read from the canonical campaign data, not independently invented. All six reciprocal links follow the canonical ordered exchange.
- Chat 2 owns State.save(), load/start/reset/slot switching and cloud persistence; each slot isolates narrative, collection, facilities, duo and physical exploration. No additional storage systems.
- Supervisor and Chat 4 consolidate a single slot-aware mutation path around makeEngine: rehydrate from current State.S.resonance, validate action and slot, persist only successful result.state via existing save API, roll back on failure, emit change notification only on successful local persistence. Distinguish local commit from cloud backup failure. Discard/rebind runtime references and overlays on slot switch. Avoid stale engine snapshots overwriting another module's progress. This is a required integration behavior, not a claim it is already implemented.
- Chat 3 may persist non-story physical exploration under State.S.resonanceExploration; Chat 5 may persist garden-only data in State.S.sunlitGarden and existing yardBuildings. These namespaces cannot independently grant story completion.
- Existing State.S.cats, Catdex and CatRelations remain authoritative for their own data. Preserve 32 breeds, six elements, all 63 approved Duo art frames and three trust tiers; do not revive rejected cat-overlay animation.

## Integration interfaces
Use Chat 4's actual interface: view(), snapshot(), choose(id), nextLine(), record(sceneId, operation), exchange({a,b,stage,actor,action}), supportAction(region,action), finish(), postgame(id,operation), supportProfile(region). Follow the engine's actual return contract, including {ok:true,state}/{ok:false,reason}; consult docs/cat-bond-rpg/04-NARRATIVE-ENGINE-INTERFACE.md on rpg/narrative-engine. Any change requires coordinated migration, not duplicate copied engines diverging across branches.
- Map -> NPC: existing cat-bond-resonance-npc-request event with {sceneId,npcId,region}; Chat 4 must actually open canonical dialogue, persist choices, and return to exploration. Dispatch alone is not integration.
- Map -> combat: existing cat-bond-resonance-battle-request event with {sceneId,operation,region}; Chat 7 validates prerequisites, starts a playable encounter, reports actual victory only, and returns to the originating scene. Defeat/retreat cannot advance story. Example forge:E-03 / battle:forge-guardian; derive other IDs from campaign.
- Garden: SunlitGarden.registerNarrativeAdapter({getHomeNpcs,drawHomeNpc,interactHomeNpc}); Chat 4 owns visibility and dialogue eligibility, Chat 5 owns positioning and activities. No generic NPC stand-ins; returned NPC state comes from resonance.
- Cinematics: Chat 2 invokes Chat 6's common player; Chat 4 controls scene eligibility and narrative effects. Skip may skip presentation, never required gameplay. Use canonical namespaced scene IDs (adapt existing slash-keyed cinematic IDs at one boundary, not in each caller).
- Language: use shared MorrowwishI18n and morrowwish-language-change; open overlays, subtitles, dialogue, controls and errors update immediately.
- All event adapters must validate actual gameplay evidence and prevent duplicate, stale, out-of-order or wrong-slot completion. Test-only routes and simulated events cannot be the normal game flow. Shared event dispatches are not proof that listeners exist.

## Branch workflow
- rpg/integration is the Supervisor-owned staging branch, initialized from main at 5cc9c998402f5f54682ea732d4df18e159c5ec1f. Existing active branches remain intact.
- Existing module heads: Chat 2 feat/cat-bond-rpg-cinematic-save-slots-20261123; Chat 3 feat/cat-bond-last-resonance-world; Chat 4 rpg/narrative-engine; Chat 5 rpg/sunlit-garden; Chat 6 rpg/cinematic-art-direction; Chat 7 rpg/combat-integration.
- Open/retarget module integration PRs to rpg/integration in coordination with their owner; do not silently merge current main-targeted drafts. Existing PRs #72, #75, #77, #78 remain evidence and are not approved. Preserve branch histories, resolve shared-file collisions explicitly.
- First integrate the minimum canonical engine and slot lifecycle + shared wiring; then an end-to-end playable harbor slice with real NPC, exploration, combat, return to garden and save/reload; then successive regions, cinematics, finale and postgame. This is an integration ordering only: all owners continue independent work now, and the full original scope remains mandatory.
- Small tested increments may enter staging after Supervisor review; no final module PASS just for staging merge. Never merge incomplete RPG into main or authorize production deployment before the full game gate.
- Do not spend production D1 quota for development or QA, use isolated fixtures, and check free tool/CI quotas before expensive runs; no TinyFish. Fixtures may be used in tests but not represented as actual game delivery.

## Acceptance and execution
Follow the user's mandatory execution protocol: inspect history/repo/permissions/quotas -> develop real functionality and production art -> integrate -> test actual gameplay -> fix -> retest -> next task. PARTIAL is not a reason to end while executable work remains. Only PASS with appropriate evidence, or BLOCKED with verifiable objective cause after all independent executable work. Record recoverable work in GitHub if actual tool/session limits intervene; no promises of autonomous continued work.
- Module evidence: exact commit, actual runtime scene through normal flow, desktop/portrait/landscape, real Chinese/English UI switching, inputs, error handling, relevant regressions, screenshots/continuous recording, independent art review. Static, simulated and fixture tests are useful but cannot alone pass experience gates.
- Cross-module: actual three-slot isolation and cross-device restoration; six distinct regions, all canonical NPCs and choices, six sanctuaries and melodies, six four-step reciprocal exchanges, actual NPC return and garden progression, all battle modes, no missing assets, complete B-01–B-04 finale including all three gameplay phases, Happy Ending and postgame, 32 breed/63 art/three-tier regression, mobile operation-area fullscreen, normal entry and return paths.
- Full real playthrough from a new save to ending, plus regressions and known defect closure. Independent Supervisor review must distinguish direct testing from others' reports. Visual quality requires examining actual rendered gameplay, not just file presence or test success.
- Only after approval: release PR into main, successful Cloudflare Pages production deployment matching intended commit, real live verification, no unapproved changes to unrelated Morrow Wish games/analytics.
- Keep reports short: actual result, commit/test evidence, remaining work and genuine blockers. No unsupported PASS.

## Current handoff
The contract and staging branch establish coordination only; they do not certify any existing module. Next integration work: align Chat 4 runtime and slot lifecycle, reconcile duplicate old story code and event consumers, and verify the real harbor slice. Do not wait to continue independent art, exploration, garden, dialogue and battle development.
