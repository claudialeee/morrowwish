# Cat Bond — Narrative & gameplay experience pre-audit
Source: campaign.mjs, engine.mjs, title-entry.mjs, npc-world.mjs, dialogue-ui.mjs and story-party.mjs at the playtest branch baseline 70781445. This is an author-side semantic audit, not a claim of human or independent blind playtesting. It contains spoilers. Keep it separate from first-player packets.

## Overall
The central story is viable: a cat loses its identity, befriends a traveler, discovers she knew it all along and caused the new memory crisis in trying to rescue it, then rejects a solution that sacrifices other cats' memories. The promise of two cups of tea is a good emotional anchor. Preserve this. The main risks are delayed reciprocal attachment, repeated local dispute patterns and a final reveal overloaded with mechanical exposition. The aim is fewer, more meaningful interactions—not more lore, crafting, rewards or cinematics.

## Scene-by-scene author-side assessment (all 40 scenes)
| Scene | Intended player knowledge / desire and experience risk | Recommended action or test |
|---|---|---|
| P-01 to P-04 (4 retired entries) | Empty scene records are internal; actual intro is title-entry text. Player knows old crisis stabilized, forgetting returned, name missing. | Keep retired entries invisible; verify no obsolete art or opening lore leaks later. |
| P-05 | Find a name; optional chart rescue gives first contact. | Compare meet and skip. Confirm player has a personal reason to go to harbor without meeting traveler; chart search should feel like exploration, not three button presses. |
| H-01 | A fisherman forgets his own door; player recognizes shared vulnerability. | Strong specific example; show a confused cat or observable consequence if possible. Avoid repeating introduction if met. |
| H-02 | Keeper refuses risky rescue; navigator wants agency. | Good conflict; verify different choices produce visibly different treatment, not only trust points. |
| H-03 | Past shutdown endangered boat; fear has a reason. | Check urgency: active boat in danger versus lengthy optional errands. |
| H-04 | Rescue and joint effort; Muling proposes journey. | Crucial bond moment: show both cats contributing and responding to one another; ensure real recruitment. |
| H-05 | Player knows an old song; first mystery payoff. | Strong chapter hook. Test whether player distinguishes normal regional song from inexplicably knowing older version. |
| R-01 | Medicine missing, moving roots, supply problem. | Shift from social dispute to exploration; keep scent trail visually discoverable. |
| R-02 | Yuchuan intended to help; two water systems connected. | Choice follows evidence, good. Test whether the gardens/roots choice visibly affects rescue, rather than immediately overridden. |
| R-03 | Rescue trapped cats, echo impersonates call. | New single-player sequence replaces obsolete paired gates. Test false lead, combat, rescue causality and success feedback. |
| R-04 | Player recognizes markings; Muling knows unexplained second route. | Valuable suspicious clue. Keep short and let player notice; avoid explaining twice. |
| E-01 (forge) | Apprentice innovation versus mentor caution. | Repeats H-02 pattern; emphasize furnace pressure/physical risk rather than another long argument. |
| E-02 (forge) | Mentor erased test record and admits responsibility. | Verify safe options show materially different consequences; prevent preemptive exposition. |
| E-03 (forge) | Heat/pressure conflict becomes battle. | Distinct mechanic worth keeping if players can infer controls and feel victory. |
| E-04 (forge) | New design accepted; player recognizes six routes. | Second/third old-route clue: ensure adds evidence, not redundant. |
| S-01 | New flying skill, courier conflict. | Flight is good mechanical contrast; tutorial must be legible without walkthrough. |
| S-02 | Sister misjudged wind; courier saved both. | Third/fourth guardian-control pattern. Shorten repetition and make choosing flight strategy matter. |
| S-03 | Players cooperate and deliver letter. | Verify letter delivery after flight actually gives feedback and advances plot, not hidden extra objective. |
| S-04 | Tea promise, friend missing, double bell means safe, player smells tea first. | Remove obsolete pendant repair presentation. Show shared tea or adapt line if optional tea event was skipped. |
| S-05 | Library signal before relapse; Muling reacts. | Strong hook: preserve specific record and reaction. |
| M-01 | Missing page, privacy constraint. | Avoid yet another moral debate before identity; one clear evidence-based choice. |
| M-02 | Echo can imitate, not understand. | Mechanic must demonstrate difference rather than just state it; check mirror/Catdex/battle gate burden. |
| M-03 | Player was first bellkeeper; Muling knowingly concealed it. | Critical reveal; mural must actually look like player & companion. Let emotional reaction breathe. |
| M-04 | Muling loosened seal and knew harm; new crisis not accidental. | Strong reversal. Test whether prior clues made this credible, not obvious. |
| M-05 | Central route mixes memories; neighbor route alternative; Muling leaves. | Highest cognitive load; use visual causal comparison and a clear next goal. Verify departure really affects party. |
| F-01 | Caravan misled by false star; another coordination debate. | Use short rescue and evidence; do not reset suspense with lengthy unrelated local politics. |
| F-02 | Player chose sacrifice; Muling promised return. | Six required operations before memory; prioritize important clues, collapse redundant investigations. Verify historical art consistency. |
| F-03 | Muling misread promise; cost to all cats. | Emotional climax worth preserving; let her fear and player agency both land. |
| F-04 | Six sanctuaries answer; distributed route works. | Make successful prior relationships visible, including no-cargo route. |
| F-05 | Muling wants stability verified; player requests test. | Avoid repeating conflict if F-03 already settled; use brief transition or meaningful new risk. |
| B-01 | Player refuses Muling's unilateral choice. | Choice should affect dialogue/feedback, not punishment for anger. |
| B-02 | Echo repeats but cannot respond. | Verify mechanics communicate pattern versus responsive voice; clarify speaker label (Muling quoting Echo). |
| B-03 | Six genuine replies; Muling chooses to unlock. | Payoff: recruited allies contribute; unlock stays Muling's agency. Avoid 6 nearly identical acknowledgments without meaningful action. |
| B-04 | Recovered memory, tea promise, wrongdoing still remembered. | Excellent emotional line; use one strong new reunion image, not repetitive garden bell art. |
| E-01 (epilogue) | Communities recover. | Existing NPC/map layers sufficient; avoid mandatory travel montage repetition. |
| E-02 (epilogue) | Muling owns harm and respects others' pace. | Keep accountability; not everyone forgives instantly. Test anger/distance paths. |
| E-03 (epilogue) | Garden key means chosen relationship and new beginning. | Preserve ending; ensure consent and visual consistency. |

## Cross-cutting issues (ordered by likely player impact)
1. **P0 verified presentation defect:** `rpg-fullbleed.css` hides header buttons including `data-next-scene`; both opening browser paths timed out at Harbor. Preserve the one main-story control; validate on desktop/mobile, then merge only after verification.
2. **P1 confirmed script/presentation mismatch:** S-04 has no repair in its canonical dialogue; `dialogue-ui.mjs` inserts repair narration and `sky-pendant-shot.mjs` old art/cropped paw and blocking timer. Remove presentation, not replace with expensive art. Double bell may remain nonblocking if story supports it. This audit does not change narrative code.
3. **P1 route-dependent tea evidence:** H-04 unlocks optional `muling:tea`; S-04 asserts shared tea habit regardless of ambient completion. If tea has not been shown, the claim is unearned. Make an inexpensive visible cup/sniff moment at S-04, or branch dialogue based on ambientDone. Validate both routes; no fabricated player reaction.
4. **P1 repeated conflict template:** Harbor, Forge, Sky, Library, Starfall each introduce a disagreement around control/authority. Theme is intentional; repetition is a design risk. Differentiate actual player actions and emotional outcomes, reduce didactic dialogue, make Forest playful and Sky skill-based.
5. **P1 no-cargo logic gap risk:** Engine ring depends on six restored sanctuaries, not optional cargo. F-05 says “really helping one another”; test that local story events provide sufficient proof even if zero shipments. Do not make 24 delivery steps mandatory just to prove theme.
6. **P1 pacing:** Library has 12 required operations / 29 lines, Starfall 15 / 23, versus Harbor 7 / 28. Counts are authoring proxies; actual click/wait burden may be higher. Inspect M-02, M-05, F-02, F-04 first; consolidate redundant objectives only if real route confirms.
7. **P1 emotional relationship test:** Muling joins H-04, departs M-05, returns E-03 (same UID by story-party tests). Confirm player experiences companionship in play rather than just dialogue/state. Keep small optional moments, visible team contribution and bond attacks. No new systems needed.
8. **P1 asset/identity:** Historical mural and reunion are central evidence/payoff, not generic decor. Use existing new character layers plus a small number of key illustrations. Remove old portrait references in engineering cleanup. Source audit alone does not certify visual correctness.

## Work handoff (minimal)
First replay opening and H-04; then S-04, M-03/04/05, F-02/03 and B-03/04/E-02/03. Use real checkpoint fixtures where available; no synthetic engine snapshot may masquerade as a browser save. Read only current chapter's knowledge packet for blind review, then inspect authored audit. Confirm or reject the eight issue leads with actual play, fix top verified experience defects and replay adjacent scenes. No need to repeat code analysis, static structure checks or every optional exchange. Mark unvisited scenes and non-reproduced findings honestly. Do not grade fun with a fabricated numeric score.

## Status boundaries
40 scene records reviewed, including 4 retired opening records. Three engine-model routes and seven policy x two seed combat runs are planned in CI by the lab scripts; actual results must come from artifacts. All current full-browser coverage beyond first arrival remains unverified until the authored runner is repaired and run successfully. No main merge or deployment.
