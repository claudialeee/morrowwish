# Narrative refactoring — no deployment

Base: 180b0829d3ebb9535a943a102780197fd4c226f1 (includes full-screen prologue and garden exploration).
This iteration preserves all scene IDs, evidence/operation gates, choices, line counts and scene order. It revises 32 bilingual dialogue beats and adds cast roles. The main quest still works through the existing six sanctuaries; gameplay mechanics are not replaced.

## Cast and recruitment
- Core travelers: Muling, Qilan, Xiaomao, Yuanfan, Baikan. The latter four have dialogue beyond their home chapters; they auto-fill free battle slots, never displacing a user-selected cat. Muling leaves at M-05 and returns with the same UID/level at E-03.
- Support reserve: Yahe, Jinpo, Lingyu, Xingya join the roster but do not automatically take active battle slots. Their existing region activities remain; no new crafting, herb, flight, or tracking systems are claimed.
- Regional residents: Jiedeng, Yuchuan, Moye, Lichuan stay home during main story and become recruitable through the existing optional postgame reunion tasks. Their main-story scenes, ambient activities and original art remain intact.
- Existing pair bond initialization applies to all recruited companions; no new signature effects are claimed.

## Narrative arc
Harbor rescue and Qilan's invitation → forest water mystery and repeated routes → forge anomaly and Xiaomao's invention → sky delivery and unsigned signal → library trust crisis and Baikan's investigation → starfall verification → finale pays off each traveler's contribution. The central sacrifice and Muling reveal remain intact.

## Validation
Scene-by-scene invariant check and story-party unit test executed in JavaScript with strict assertions. Browser playthrough and full CI are outstanding. Do not merge to the auto-deploying combined branch until explicitly approved.

## Lightweight RPG direction — second pass
The story, cats, exploration, and short battles are the product. Do not introduce potion crafting, equipment forging, skill trees, mandatory garden management, or new resource currencies. Roles are narrative identities, not required subsystems. This pass revises 30 existing dialogue beats, shortens the opening lore, links the old song, familiar diagram, recent unsigned signal, and two cups of tea into an escalating personal mystery. It corrects stale paired-water-gate dialogue and removes promises of unimplemented workshop services. All scene/evidence gates remain unchanged. The 24-step cargo exchange gate is an existing pacing risk; it is not simplified in this pass and needs a separate world-runtime and progression QA change before release. Two full engine variants and the broader narrative regression passed in a JavaScript harness; no browser QA or deployment.

## Third pass: remove mandatory cargo grind
Story ring now requires genuine restoration and melody evidence from all six regions, not any cargo receipts. Support availability follows local restoration; actual optional deliveries retain the original verified rewards and finale tactical bonuses. Cargo progress stays independent (cargoComplete), never fabricated. Forge chapter completion supplies the sky flight parts narratively. Removed the mandatory-looking Starfall 24-step ledger; optional local cargo remains collapsed by default. Updated both full campaign variants (zero versus 24 real deliveries) and the world regression expectations. Browser QA outstanding.
