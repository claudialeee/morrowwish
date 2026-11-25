# Premium soundtrack review (candidate, not release-approved)

The existing 31 original recordings were mostly short sampled arrangements. Replace the 25 non-sanctuary cues with 17 licensed, editorially selected full recordings, including the existing forest candidate. The six puzzle/ceremony pieces remain original because their notes, durations, state commits and NPC responses are gameplay evidence. This is a curated external score, not an exclusive or newly commissioned original OST.

## Technical gate
- All 25 non-sanctuary scene IDs must resolve to a measured local recording; all six regions distinct. Fallback must fail browser acceptance rather than be counted as premium.
- Full musical form, no arbitrary 30-second cut; 1.2-second equal-power loop seam (subjective musical continuity still must be heard).
- Stereo 44.1 kHz 192 kbps MP3 deliverables, source provenance and SHA-256 recorded. Target integrated loudness -19 LUFS, measured acceptance -21.5 to -16.5, post-encode true peak no higher than -0.9 dBTP. Source may already be lossy; transcoding does not improve its fidelity.
- Decode lazily, 32 kHz stereo on touch devices, 44.1 kHz desktop; evict inactive long buffers and retain only active/retiring tracks as needed. Check long-track memory on actual iOS and low-end mobile. Never block gameplay when audio is disabled.
- No external runtime audio calls. Existing master/music/effects sliders, puzzle ducking, pause, save switching and one-shot ceremony evidence intact. Transition must have at most two music sources during a bounded crossfade and one after it.

## Listening gate (mandatory; not satisfied by format or CI)
Listen to the full theme and three loop transitions in each of the six regions, plus opening and final battle. Compare the existing original recording and candidate at matched loudness. Score musical phrasing, regional fit, instrumental realism, lack of annoying repetition, transition/seam, and dialogue/SFX separation on 1–5. Minimum 4/5 in every category, no severe issue; two independent listeners including owner approval. Re-edit/replace if too melancholic, too trailer-like, too harsh, or the seam is noticeable. Verify actual desktop speakers and phone speakers/headphones, 10-minute garden/region session, battle/return and muted melody puzzles. Keep PR draft until listening and device QA pass; no automatic deployment on this branch.

The local music-credits.html page allows single-track review and documents CC BY 4.0 credits. Include source attribution in any exported trailer using these tracks. Do not claim original composition or artist endorsement. For a long-term exclusive identity commission a bespoke original score if budget permits.
