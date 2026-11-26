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
