# Echoes of the Starbell — portrait artwork contract for Work
Engineering candidate: 0ef3eff2c67f310fbd76e39d1acca5ed5e603020.
Use the actual screenshots, not generic concept art. The original desktop assets must stay untouched.
## Priority 0: cover and world
| Scene | Current source (relative to public/cat-bond/assets/) | Required composition |
| --- | --- | --- |
| Title | garden/title-bell-sanctuary.webp | Same orange-scarf golden cat and purple-bow ragdoll, both full and recognizable; warm archway, no story protagonist substitution. Leave separate title and start/continue region. |
| Atlas | resonance-world-v2/atlas.webp | Six regions arranged recognizably around the central journey; all seven existing destinations reachable. |
| Windchime Town | resonance-world-v2/harbor-mist.webp and harbor.webp | Preserve road from lower-left harbor to upper-right/lower-right tide cave, lighthouse and old bell sanctuary on left. |
| Rootsleep Forest | resonance-world-v2/forest.webp | Connected root trail, moonleaf bridge, wet channel, ancient-root sanctuary. Preserve forest-waterworks.webp as independent mechanism art. |
| Lantern City | resonance-world-v2/forge.webp | Festival stage, stone bridge, lamp array, shadow beast approach and sanctuary. No old furnace temperature UI. |
| Skyspine Isles | resonance-world-v2/sky.webp | Lower-left launch, cloud route, glider platform, courier dock, separate Farwind Isle and upper-right sanctuary. |
| Moonmirror Library | resonance-world-v2/library.webp | Continuous gallery route, public archive, upper mural, mirror pair, guardian, route model and sanctuary. |
| Starfall Expanse | resonance-world-v2/starfall.webp | Crater, starlight path, star chart, ruin record, observatory, adjacent bells, final sanctuary. |
## Anchor mapping handoff
Runtime coordinate system is a 960 × 540 logical world with normalized [x,y] positions (0..1), independent of screen size. Portrait images may use a different composition; provide a JSON mapping of original path vertices, NPC anchor IDs, feature IDs, survey/cache anchors to normalized positions in each new painting. Do not crop a required location, draw UI labels into the image, or move an anchor without documenting it. The mapping is an art specification, not a gameplay or save migration. Chat will implement and verify the transform separately. Current authoritative coordinates:
- [world-exploration.mjs](../../public/cat-bond/js/resonance/world-exploration.mjs) — layouts, paths, castPoints, features for each region.
- [library-mechanisms.mjs](../../public/cat-bond/js/resonance/library-mechanisms.mjs) — libraryPoints and libraryInvitations.
- [world-runtime.mjs](../../public/cat-bond/js/resonance/world-runtime.mjs) — atlas coordinates, ruins, discovery/marker rendering and coordinate transform.
- [sky-flight.mjs](../../public/cat-bond/js/resonance/sky-flight.mjs) — separate Farwind Isle survey route and cache.
- Atlas source positions (normalized): harbor [.5,.18], forest [.79,.33], forge [.79,.68], sky [.5,.85], library [.21,.68], starfall [.21,.33]; preserve the separate central destination.
- Every route must connect in its existing order; map landmarks to the same feature IDs, including IDs sharing a landmark. Do not duplicate a feature as a new mission.
## Priority 1: story and battle art
Use portrait variants only when the current actual frame demonstrably fails. Prioritize the library mural, broken-bell reveal, final reunion, and any landscape battle background that leaves the combat area visually weak. Cloud tea already has a dedicated painting. The existing portrait garden is a good baseline: preserve its paths and home NPC anchors. Keep the 63 approved original duo paintings, the 28 existing story-art assets, and the existing original battle backgrounds. Do not replace with procedural cats or low-quality animation fallback.
## Deliverable and acceptance
Deliver new mobile images in an independent portrait-art branch with names distinct from existing assets, a path/anchor manifest for each regional painting, and real 320×568, 390×844, 430×932 screenshot comparisons. A native vertical canvas is a new art composition, not a stretched landscape plate. Use approved watercolor fantasy direction, bright, lively, gentle, detailed. The controls, save paths, story, combat stats and desktop version are frozen. Chat owns ordinary integration and testing. Work should spend its quota on polished artwork and an unfamiliar-player experience review, not re-running engineering gates.
