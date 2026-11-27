# Starbell launch trailer — Work handoff (one master only)
Source snapshot: [c10af4e](https://github.com/claudialeee/morrowwish/commit/c10af4e16a16604c08dbbae1c8352570a60c781b); branch review/starbell-trailer-handoff. Latest integration continues separately. Before release compare game asset/runtime changes against source, recapture affected shots only. No main merge, no deploy, no social publish. Use [preview](https://cat-bond-preview.morrowwish.pages.dev/cat-bond/) for final public availability verification; captures use local isolated repo, not production.

## Single goal
Make someone who knows nothing about this small free browser game click Play. Cats first, story second, distinctive playable magic third. Not an epic RPG, a list of systems, or an animated picture slideshow. 30s English, 9:16, 1080x1920, 30 fps, H.264/AAC MP4. No other public cut, voiceover, new art batch, marketing research, or gameplay rewrite.

## Locked editorial direction
See STAR-BELL-TRAILER-TIMELINE.json (exact 30 seconds). Prioritize close, recognizable golden and silver cats and a concrete mystery: a cat forgot its name but can sing an old melody, and its new companion knows more than she says. Preserve warmth and playfulness. The promotional “someone remembers you” is not an in-game quotation; never reveal the protagonist's past identity, Muling's role in the disaster, or the exchange cost. No late-game reveal/reunion/ending paintings. If this line feels too revealing, use “Then you meet her.” Avoid invented animation or implied gameplay. Keep at least 60% actual interactive game footage; cut a visually weak minigame rather than fabricate it. A short actual battle is enough; do not promise a duo if not observed. Replace a weak shot with a better real cat interaction; not with old Cat Bond footage. No requirement to show all six regions. Four seconds on the official title + legible Play free in your browser (3.5s planned). Actual URL in publishing description, not an invented store link.

## Source-verified shot and asset shortlist
Paths relative to public/cat-bond/assets/; existence checked against source tree, not visually reviewed.
| ID | Actual entry and action | Supporting existing art (not proof of actual footage) |
|---|---|---|
| garden | Fresh slot, Start exploring, butterfly interaction | garden/sunlit-garden-landscape.webp; core-art-remaster/leads/player.webp |
| meet | Fresh slot, Talk to Muling, Find the chart pieces | core-art-remaster/leads/muling.webp; cinematics/characters/muling/traveler-garden-sunlit.webp |
| chase | harbor:H-02 / Chase the runaway chime | canon22-final-art/windchime-chase.webp; canon22-final-art/windchime-wisp.webp |
| forest | forest:R-02 / Moonleaf bridge, turn leaf | canon22-final-art/forest-root-bridge.webp; forest-moonleaf-control.webp (same directory) |
| shadow | forge:E-01 / Lantern festival · Shadow show | canon22-final-art/lantern-theater.webp; shadow-cat.webp (same directory) |
| glide | sky:S-01 / Catch the wind · Practice gliding | canon22-final-art/sky-cloudfall.webp; sky-glider.webp (same directory) |
| battle | harbor:H-04 / Belllight beast | combat/harbor-arena.webp; combat/tide-shell-watercolor.webp |
| lookout | sky:S-04 / Talk to Muling, Sit beside Muling | story-art/cloud-lookout.jpg |
| mystery | harbor:H-03 / Talk to Yandeng, old tune clue | cinematics/prologue/star-bell.webp; no spoilers |
| title | actual title page, English | garden/title-bell-sanctuary.webp (verify actual usage, prefer real title) |

## Engineering prepared by Chat
- Source tree inspected at fixed SHA; reused actual selectors and inputs from scripts/cat-bond-release-prologue-qa.mjs and scripts/cat-bond-experience-chapters.mjs.
- Existing knowledge/targets scripts create isolated per-scene starting saves. They are synthetic QA entry points, not earned progress; all recorded subsequent interactions must be real. Do not publish fixture/debug menus, claim real achievements from seeded context, or expose save data.
- scripts/capture-starbell-trailer.mjs records native 9:16 touch-profile Playwright WebM, screenshots, approximate timestamps, per-shot scene/revision/error manifest. Localhost only. No mutation of production or game runtime. Playwright video is silent, so music/SFX added separately.
- scripts/render-starbell-trailer-draft.py creates internal rough cut from successful clips only. Approximate markers are not exact editorial in-points. Override using capture-dir/cut-overrides.json (source seconds). No automatic “approval.”
- Branch workflow Starbell trailer preparation runs capture only, attempts internal animatic, uploads evidence. It does not deploy. If capture fails, isolate only that shot; do not rerun entire game QA or use obsolete game trailer. Review capture-index.json even if job fails. Artifacts are internal.
- Chat used the GitHub connector for source access and commits; browser capture is delegated to GitHub Actions. Runtime capture and draft remain unverified until workflow evidence; do not treat this handoff as completed footage. Work can use existing artifacts and recapture only weak or failed shots.

## Local rerun (Node 22, Python 3, FFmpeg, Playwright 1.57.0)
```bash
npm ci
npm install --no-save --no-package-lock playwright@1.57.0
npx playwright install chromium
node scripts/cat-bond-local-cloud-server.mjs & # localhost 8765; stop after capture
node scripts/cat-bond-experience-knowledge.mjs
CAT_BOND_TARGET_SCENES=harbor:H-02,harbor:H-03,harbor:H-04,forest:R-02,forge:E-01,sky:S-01,sky:S-04 node scripts/cat-bond-experience-targets.mjs
node scripts/capture-starbell-trailer.mjs
python3 scripts/render-starbell-trailer-draft.py
```
For the rough capture the default is 540x960 CSS pixels. Try TRAILER_WIDTH=720 or 1080 only if the actual layout remains readable; output is 1080x1920, not a claim of native source resolution. Reframe individual shots without cropping off interactive elements. TRAILER_CLIPS=glide,lookout (example) limits recapture; use a separate output dir so the existing index is not overwritten; manually select/merge reviewed results. If browser cannot record or ffmpeg not available, report concrete blocker and preserve assets and partial deliverables; do not falsely claim a finished video. No additional engineering platform.

## Music
Draft only: assets/audio/garden.mp3, original project score per audio/manifest.json and AUDIO-PROVENANCE.md, retain instrument license as applicable. Audition final music, not mood tag. Existing premium cues Tomorrow, Discovery, Life in Silico and Childhood are documented candidates in quality-audio/premium-manifest.json (not automatically listening-approved); use at most one cohesive cue, or original project music. CC BY 4.0 tracks require title, author, source, license and edit attribution in release description/credits. Prefer gentle bell, strings and forward motion; two actual bell samples quality-audio/bell-c5.ogg and bell-e5.ogg are available, confirm provenance before external use. No dark stingers, loud first beat, exaggerated epic trailer percussion. If audio rights uncertain use project original score/known project procedural SFX. Target clear, comfortable audio (approx -14 to -16 LUFS, peak <= -1 dBTP), not a mandatory loudness chase.

## Work: only creative finish
Start by viewing actual footage/artifact and the draft if available. If missing or visually unfit, recapture only necessary shots. Improve framing, choose 1-2 memorable cat actions, maintain identity and accurate proportions, use cuts on action and restrained transitions, mix actual sounds and music. Never generate fake gameplay or show placeholder or debug UI; keep gameplay readability. At 0-3 sec show cats and visual action immediately; no black fade-in. Captions in English only, natural and readable, no additional generic feature claims. Music resolves warmly with the CTA rather than thriller cliffhanger. Title and CTA must remain readable at small screen size. Cut if viewer cannot tell what is playable.

Deliver ONE final MP4 (no separate marketing variants), source/trim manifest and reproducible edit script/project, music credit text, optional internal contact sheet for verification (not public). Place on this independent branch or provide file/artifact link; no deployment. Actually watch at normal speed and check silent viewing, no spoilers, no Chinese labels, no crop/stretch/frozen frames, no watermark, no audio clipping. If a clip is not shown in current playable version, remove it. The desired reaction is “these cats are adorable; what happened before I woke up? I'll play.” No claim of measured conversion uplift without data.

## Short-video platform override (owner request)
This is the ONLY public master: native portrait 9:16, 1080x1920 delivery, about 30 seconds. No landscape version and no platform-specific re-edits. Start directly with a large, recognizable cat and an action in the first frame; story hook should be understood without sound by 2 seconds. If actual butterfly framing is weak, choose a stronger real cat shot; do not spend the first seconds on title, black or a distant landscape. Avoid stacking UI and captions. Compose for a phone: cat faces and core action in the center; conservative working safe area x=8–80%, y=13–77% (not guaranteed platform UI dimensions). Use big, short two-line max English captions with contrast, keep them away from character faces and actual controls; no right-side/bottom-edge critical text. Keep edits purposeful and warm, not a frantic montage. End with the actual title and “Play free in your browser”, held legibly for 3.5 seconds. Place actual playable link in the post/profile wherever the platform supports it; do not imply the video itself is clickable. Verify real preview availability before publication. Suggested English post copy: “A little cat wakes up with no memory of its name. Why does a silver cat seem to know it? 🐾 Explore a cozy watercolor adventure in Echoes of the Starbell — free to play in your browser.” Use only the platform-supported real URL. No fictitious endorsements, engagement claims, extra variants or paid ads. The previous horizontal workflow failed preflight because ffmpeg was absent; the portrait workflow moves FFmpeg setup after footage capture and preserves raw assets even if rough-cut generation fails.
