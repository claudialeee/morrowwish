# Chat 4 — playable NPC sample H-02
Status: playable sample implementation; not full NPC system.
Canon source: The Last Resonance, Narrative Bible §5 Misttide Harbor and Main Story Script H-02.
 
## In-game access
Start Cat Bond and select the gold story star in the courtyard action rail. It opens the H-02 dialogue overlay. It is loaded from index.html and uses the active State.S save slot. No new storage key or Save Manager was created.
 
## Actual art files
- Qilan: 5 expression-specific, authored vector portrait files.
- Jiedeng: 4 expression-specific, authored vector portrait files.
- Misttide Harbor environment and storm-memory scene: 2 original vector scene paintings.
These are individual game-ready SVG assets loaded by the UI, not a presentation board.
 
## Gameplay
The five official H-02 dialogue lines are sourced directly from campaign.mjs. Two official choices are shown: comfort Qilan first, or ask Jiedeng about the old storm. Each path has three authored follow-up lines. The choice persists trust deltas, a future support preference, the H-02 event, and starts the official H-03 quest “The Flooded Logbook”. The task remains active; the UI does not falsely mark map exploration complete. A quest tracker remains available after closing the story.
 
## Save and interfaces
Progress is stored under State.S.npcStories.harborKeeper, so the existing three-slot save isolation applies. The module exposes window.CatBondHarborSample.open(), state(), and supportPreference() for integration with later systems. It never creates its own localStorage database. Language changes re-render the currently open dialogue.
 
## Verification
Run node scripts/test-cat-bond-harbor-sample.mjs. Test covers official line count, choice validation, branch-specific trust, future support preference, quest/event trigger, duplicate choice rejection, and JSON save/restore. Browser harness: tests/fixtures/npc-harbor-sample.html. The harness is isolated from production and does not claim to be a screenshot of the production game. Actual production deployment and independent Chat 6 visual review are not claimed.
