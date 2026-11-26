# Starbell RPG: preview vs full acceptance

- Scope: RPG integration rpg/release-combined-next and RPG test branch review/cat-bond-playtest-harness only. main Cat Bond is independent.
- Preview: exact SHA, source checks, three real browser viewport smoke tests before publishing, postdeploy SHA/API isolation and the same smoke after publishing. Never wait for a separate complete campaign run; metadata explicitly says fullReleaseAccepted=false. The preview workflow is already independent; the fix updates the direct save entry and its assertions.
- Daily Playtest: ordinary pushes run fast source checks and six real title/menu/save profiles (quick smoke). Existing RPG integration PR change router still checks affected modules separately; no full approval implied.
- Final acceptance: manually dispatch scope full, or put [starbell-full] in the final candidate commit message and push it to the exact test branch. This retains every existing independent chapter, fresh continuous campaign, real checkpoint reload, art/audio/optional interaction and systems lane on the same SHA. Scoped manual runs remain supported.
- Do not cancel a still-useful final campaign merely to test a small UI change; use separate isolated diagnostic branches. Use one final run after fixes settle.
- Save lifecycle checks run device contexts in parallel; they use the real region selection control instead of a fixed coordinate on a cropped portrait atlas. The existing separate real map/pointer suites remain required; no forced clicks or fabricated progression.
- No measured speedup claim until the new workflow has run. A 10-minute quick job limit is not a time guarantee. Long campaign remains a separate final gate, not a per-preview requirement.
