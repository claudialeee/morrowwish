# Canon 2.2: fast preview vs Work acceptance
- Authority: review/starbell-canon13-player-experience. Preview must match exact source SHA, never publish main or use production APIs.
- Fast gate: deterministic model/regression tests, twenty actual image decodes from preview host, title locale, real garden interactions, direct saves, reload, and first chapter entrance on desktop/portrait/landscape. All three profiles complete independently; report all failures, not secondary browser-close errors.
- Chapter acceptance: independent chapter fixtures exercise actual player input and combat, then reload earned chapter saves across languages and profiles. Synthetic starts are explicitly not proof of fresh campaign continuity.
- Fresh campaign: continuous real-input run from new slot to ending with earned save reloads; use as the Work handoff gate, not a duplicate blocker on isolated preview publication.
- Stable systems: skills, combat, progression, saves; rerun on shared driver changes or relevant runtime changes.
- Do not infer visual acceptance from successful image decode. Review actual chapter screenshots and mobile replays for bridge anchors, projection crop, enemy readability, flight islands, history and garden props. Work receives only unresolved visual polish after engineering gates pass.
