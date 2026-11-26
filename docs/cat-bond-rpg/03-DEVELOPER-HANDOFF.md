# CAT BOND RPG — DEVELOPER HANDOFF
## Implementation and QA contract · Canon 1.0 · 2026-11-24

Read README.md, 01-NARRATIVE-BIBLE.md, and 02-MAIN-STORY-SCRIPT.md before touching Cat Bond RPG content.

## 1. Source-of-truth rules

- The new Cat Bond RPG folder is the only current narrative authority.
- The old docs/cat-bond-the-last-page-story-bible.md is an archived, non-canonical draft.
- These documents do not mean the game code has already been migrated. Inspect the live source and identify legacy story content before implementation.
- Do not silently combine the old Last Page plot with The Last Resonance.
- Do not change locked canon facts without explicit owner approval.
- Story state must be saved per save slot. Never use one global story-state object shared by all three slots.

## 2. Required player-facing RPG structure

- The overworld/map is the main RPG interface and shows the current main quest, story progress, region status, and next objective.
- NPCs must exist physically in the world, with distinct character art, identity, personality, dialogue, relationships, and quest state.
- Sunlit Garden is a living home and cultivation sanctuary, not the main RPG dashboard. Cats and NPCs can return there as the campaign progresses.
- Keep cat collection, training, workshop, Catdex, Duo Bond, Duo Promises, battles, and exploration. Integrate them into the narrative instead of removing them to make room for story.
- Main story scenes need clear entry conditions, objectives, player actions, exit conditions, and saved progress.
- Provide skip and language controls for cinematic scenes. Switching Chinese/English during an open scene must update the scene immediately.

## 3. Story-state model

Persist the following categories per save slot. Exact implementation names are up to engineering, but semantics must remain intact.

### Main progression
- Current chapter and scene.
- Unlocked regions and map routes.
- Six sanctuary restoration states.
- Six melody recovery states.
- Muling identity reveal and Reverse Resonance reveal states.
- Final battle phase and ending completion.

### Reciprocal regional links
Track each pair independently:
- Harbor ↔ Forest.
- Forest ↔ Emberforge.
- Emberforge ↔ Skyspine.
- Skyspine ↔ Moonmirror.
- Moonmirror ↔ Starfall.
- Starfall ↔ Harbor.

A link counts only after both sides have sent and received a meaningful response. A one-way quest completion or a prerecorded signal is not sufficient.

### NPC and choice state
- Each major NPC's relationship and chapter outcome.
- The player's six regional decisions.
- Muling relationship responses and post-reveal trust state.
- Which NPCs have returned to Sunlit Garden and which final-battle support actions they can perform.

### Collection and duo state
- Collected cats and Catdex records.
- Duo Bond levels.
- Completed Duo Promises.
- Selected battle roster and duo combinations.

Do not require every optional cat to finish the main story. Collection depth should enrich the final battle, not create an arbitrary hard lock.

## 4. System-to-story integration

| Existing system | Required narrative function |
|---|---|
| Cat collection | Gives the player individual companions with distinct combat roles and identities |
| Catdex | Records verified identity, habits, discovered memories, and helps distinguish real cats from Hollow Echo copies |
| Duo Bond | Enables paired cats to recognize mismatched copied behavior and interrupt false echoes |
| Duo Promises | Unlocks special coordinated responses in the final battle and relationship scenes |
| Sunlit Garden | Shows the growing community, returning NPCs, cat activities, and postgame life |
| Workshop | Produces region-specific repair parts and practical support used in the campaign |
| World map | Shows the six regions, current objective, restored routes, and reciprocal links |
| Six melodies | Restore the six sanctuaries and unlock the final network configuration |
| Three save slots | Each slot retains its own chapter, choices, collected cats, relationships, and ending |

## 5. Region implementation checklist

Every region needs:
- A distinct visual theme and music.
- An explorable map with more than a straight corridor.
- Important NPCs physically present and interactable.
- A complete local story with conflict, reveal, climax, and resolution.
- A unique exploration or puzzle mechanic.
- A combat encounter or boss with a region-specific identity.
- A melody scene in which local cats contribute; the player cannot complete the melody alone.
- At least one clue about the main mystery.
- A cross-region exchange that persists after the chapter.
- A later return or final-battle role for its important NPCs.

Do not use the same quest sequence six times.

## 6. Final battle acceptance

The final battle is not accepted if it is only a boss health bar followed by a cutscene.

It must include:
1. **Muling phase:** inward routes, reversed melodies, recognizable former-partner moves, and player actions that interrupt the inward gates.
2. **Hollow Echo phase:** copied cats/NPCs, Catdex identity clues, Duo Bond interruption, Duo Promise special actions.
3. **Six Notes Return phase:** all six regional NPC groups physically perform their actions; the player protects them, activates melodies, and defeats the Hollow Echo.
4. **Choice consequence:** earlier choices change support methods, dialogue, and at least some battle conditions or rewards.
5. **Muling's final action:** she opens the final neighbor path after the player and NPCs have made the ring possible. Her action completes the mechanism but does not replace the player's work.
6. **Resolution:** all memories remain with their owners; the player's memories return; the Hollow Echo dissipates; the Happy Ending is complete.

## 7. Cinematic and art standards

- Opening must not trigger a cinematic: optional short public-background text over the live garden, immediately dismissible. Identity reveal, betrayal reveal, major chapter climaxes, final battle and ending need authored cinematic staging. Historical sacrifice footage is eligible only after Chapter V/VI reveal gates.
- Use polished original key art, layered depth, camera movement, lighting, particles, character acting, and sound design.
- No crude line cats, cheap paper-cutout animation, static text-card sequences, or simple image carousels as substitutes for scenes.
- Do not use a generic sprite in place of a named NPC's character art.
- Duo scenes must use the approved polished original-art direction and preserve the actual selected cats where the system requires it.
- Test portrait mobile, landscape mobile, and desktop. Keep dialogue readable and controls reachable.

## 8. Localization and dialogue

- Chinese and English are both complete deliverables, not optional polish.
- Preserve each character's distinct voice.
- No exposition monologues that explain the entire world.
- Player dialogue choices must be touch, mouse, and keyboard accessible.
- Changing language during a scene updates the currently visible text, choice labels, and subtitles immediately.
- Check every branch and every post-reveal line for mixed-language fragments.

## 9. QA and Supervisor gate

Before reporting a story task complete:
- Compare the implemented scene to the exact Bible and script sections.
- Verify entry/exit triggers and reload persistence.
- Play the scene in Chinese and English.
- Test the relevant choices and confirm downstream consequences.
- Inspect actual rendered character art and cinematic transitions on mobile and desktop.
- Verify Catdex, Duo Bond, Duo Promises, garden, map, and combat integrations where relevant.
- Check that no archived Last Page plot element has been reintroduced.
- Have a distinct adversarial review challenge the implementation. If no independent reviewer is available, label it self-review; do not claim independent approval.
- Report PASS / FAIL / PARTIAL with evidence. A commit is not proof of gameplay completion or deployment.

## 10. Forbidden shortcuts

- Do not replace story scenes with static paragraphs or a slideshow.
- Do not make Muling a shallow villain or excuse her actions.
- Do not let the player solve the crisis alone with a newly invented power.
- Do not make NPCs decorative quest markers.
- Do not make the six regions interchangeable.
- Do not make the Catdex a magic device that can restore stolen memories.
- Do not treat a one-way signal as a completed reciprocal regional link.
- Do not claim the new canon is live until the actual game has been migrated, tested, deployed, and verified.


## 11. Canon 1.1 opening migration and acceptance
- P-01..P-05 retain scene references but replace old operations: public context dismiss/skip; solo movement; optional map rescue with stranger; independent harbor travel; harbor arrival. Neither map rescue nor optional sign is a prerequisite for travel. H-01 accepts or defers temporary cooperation; H-04 verifies actual rescue and establishes companion; H-05 requires actual local response. Persist encounter, introduction, accepted/deferred cooperation and companion states per slot; no duplicate rewards or introductions. A player bypassing the map must receive public introduction at the harbor.
- Remove all new-game/continue automatic opening animation triggers, not the archived art itself. Never mark historical footage completed by a click on a substitute. Legacy saves preserve inventory, progression and earned relationships; new opening flags migrate explicitly, with no forced replay of old cutscenes.
- Keep the V3 exploration loop: optional discovery, side routes, paired actions, combat, ability-gated return, visible post-repair change, souvenirs and garden return. Do not turn the opening into a conversation chain. The player must understand what the Star Bell is, what forgetting means, and why they are going to the harbor without knowing the late secrets.
- Cold-player check: after two minutes, ask for the world problem and immediate personal objective in their own words; after the harbor, ask what changed and why they want to visit the forest. Check both languages, desktop/mobile, skip/alternate encounter/reload/deferral. Verify no premature companion HUD or spoiler assets/subtitles/accessibility text. Narrative-only edits are not proof of runtime migration.


## 12. Canon 1.2 full-campaign adaptation gate
All 40 scene references are retained but the entire critical path in 02 is rewritten. For each scene map entry/action/exit/evidence, bilingual lines and choice consequences to actual runtime; do not treat old tests as coverage. Chapter II needs investigation evidence, real paired channel operation and visible water flow; III a safe prototype test and public accountability; IV a meaningful delivered letter, gliding and companion moment; V verified mural, route ledger, separation and interactive two-route model; VI verified catastrophe gate and six real reciprocal links; finale three distinct mechanical phases and Muling's free last-lock action. Preserve optional exploration and checkpoint retry in every region. Cold-player checks: can they explain the local goal on arrival, why a character disagrees, what their action changed, and why the next region matters? Confirm the original six-link four-stage evidence remains intact. Before implementation, plan localization/operation migration and per-slot save compatibility. No runtime or deployment claim for this document commit.


## Owner amendment: single-avatar exploration and real story companions
RPG is not released; no legacy RPG migration is required. Control one protagonist in exploration; teammates assist automatically. Muling and the 12 regional actors become real selectable battle roster members, not wild catches or map-following avatars. Use existing two active cats (one directly controlled), reserves and elemental Duo Bond. Muling leaves at M-05 and returns at E-03 with her own progress; other NPCs join on regional resolution. The 33 collectible species stay separate. Verify clean-slot play, recruitment, actual combo damage/status, swap, and current-version reload.
