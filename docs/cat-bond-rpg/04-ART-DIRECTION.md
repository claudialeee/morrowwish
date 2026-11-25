# CAT BOND — THE LAST RESONANCE
## 04 · Global Art Direction Bible
**Version:** 1.0 · 2026-11-24  
**Owner:** Chat 6 · Principal Art Director / Cinematic Director

This document is the shared visual authority for the six-region campaign. It implements the visual needs of the canonical story; it does not alter story facts, chapter order, NPC motivations, combat rules, or save-state ownership.

## 1. Visual thesis

**Refined fantasy epic × cinematic hand-painted atmosphere × expressive feline character design.**

Cat Bond must feel like a coherent, inhabited fantasy world with emotional warmth—not a pastel children's picture book, a generic dark fantasy, or a browser-game UI dressed in RPG labels.

The target is a painterly world with:
- layered environmental depth and readable silhouettes;
- nuanced, restrained color grading rather than candy saturation;
- tactile materials: weathered brass, glazed ceramic, aged paper, damp stone, woven cloth, bark, basalt and polished glass;
- expressive feline faces and body language;
- compositions that communicate relationships and story stakes before dialogue explains them.

The visual references are limited to broad craft qualities: the cinematic staging and environmental storytelling of *Clair Obscur: Expedition 33*, the warmth and character appeal of *Ni no Kuni*, and the luminous layered environments of *Ori and the Will of the Wisps*. No protected character, composition, asset, costume, location or signature design may be copied.

## 2. Non-negotiable art rules

1. Keep feline anatomy, ears, muzzles, paws, tails and individual body language readable.
2. Preserve warmth and approachability, but mature the rendering, material detail, lighting and silhouette design.
3. No crude line-art cats, flat paper cut-outs, sticker sprites enlarged to fill a screen, generic emoji portraits, plastic fur, over-sharpened AI texture, neon oversaturation or random decorative particles.
4. Do not turn Muling into an unrelated monster at the reveal. Her face, eyes, pendant, coat silhouette and proportions remain recognizable through every story phase.
5. Do not use a static paragraph or a title card as a substitute for a scripted emotional scene.
6. A polished original still with deliberate camera movement is preferable to weak continuous animation.
7. Keep the selected player cat's identity. The protagonist's role is the First Bellkeeper; do not force a fixed breed, fur color or personal name over the player's selected cat.
8. Visuals may foreshadow canon only at the exact point permitted by the script. Never visually reveal Muling's identity, hidden routing or the Reverse Resonance before the approved reveal sequence.

## 3. Global color and material system

| Role | Color | Use |
|---|---|---|
| Deep ink | `#172532` | night, deep UI surfaces, cinematic negative space |
| Blue slate | `#405967` | stone, distant architecture, cool shadows |
| Sea glass | `#6F9C9A` | water light, restoration accents |
| Aged brass | `#B58C55` | Star Bell, mechanisms, trim, meaningful highlights |
| Warm parchment | `#E6D8BD` | readable warm light, paper, skin/fur bounce |
| Moon silver | `#AEBBC4` | reflections, archive light, mist |
| Moss | `#6D876E` | forest life, natural fabric |
| Ember copper | `#B96E49` | forge metal, heat, worn leather |
| Star violet | `#77749B` | distant resonance, not general-purpose neon |

Use a 70/20/10 balance: 70% environment base, 20% secondary material/light, 10% high-value accent. Avoid making every object glow. A highlight should identify a story-relevant object or guide the eye.

**Materials**
- Fur: layered directional strokes and soft value shifts; avoid a uniform airbrushed gradient.
- Metal: brushed and worn edges, dark oxidation in recesses, narrow warm highlights.
- Stone: broad value planes, mineral variation, edge wear and environmental staining.
- Cloth: visible weave at close range, weighted folds, restrained embroidery.
- Glass/water: reflected environment and broken highlights, never a flat cyan fill.
- Resonance: thin structured light paths with a source and destination; never arbitrary glitter.

## 4. Lighting and composition

- Use motivated light sources: lighthouse beams, canopy openings, furnace mouths, cloud gaps, moonlit mirrors and the Star Bell.
- Separate foreground, playable midground and distant background. Keep important characters against a contrasting value field.
- Use atmospheric perspective: distant forms lose contrast and saturation; near forms retain material detail.
- Use rim light selectively to separate a character from a dark environment.
- Frame important two-character scenes so the distance, orientation and gaze between characters carry meaning.
- Avoid placing subtitles over faces, key props, the bell pendant, sanctuary mechanisms or puzzle-critical details.
- Key art master: 2400×1350 (16:9); character sheet master: 1800×2400 or larger; export WebP/AVIF for runtime only after visual approval. Keep editable SVG/source and a manifest entry.

## 5. Six-region visual identities

| Region | Visual identity | Palette and light | Required landmarks / motifs |
|---|---|---|---|
| Misttide Harbor / 霁潮港 | weathered maritime fantasy | fog blue, sea glass, wet slate, lantern amber | lighthouse, tidal caves, mooring towers, rescue boat, storm beam |
| Rootsleep Forest / 眠根林 | immense living vertical ecosystem | deep moss, jade, bark umber, pollen gold | giant trees, canopy dwellings, exposed root bridges, underground water channels |
| Emberforge City / 赤炉环城 | industrial craft city built into volcanic stone | basalt, oxidized copper, furnace amber, smoke plum | central furnace, molten channels, mechanical bridges, workshop terraces |
| Skyspine Isles / 云脊群岛 | open-air archipelago | cloud ivory, wind blue, muted indigo, high-altitude gold | floating islands, cloud waterfalls, rope bridges, gliders, courier docks |
| Moonmirror Library / 月镜书库 | monumental archive of reflection | moon silver, ink blue, pale violet, candle ivory | mirrored halls, archive towers, water mirrors, sealed record chamber |
| Starfall Expanse / 星坠原 | ancient astronomical frontier | midnight blue, mineral sand, muted violet, star brass | impact crater, broken observatory, star maps, central Star Bell route |

These six identities are not interchangeable color filters. Each region requires its own terrain, architecture, vertical composition, landmark silhouette, surface materials, weather and light behavior.

The existing `painted-regions.js` legacy set (`home`, `sakura`, `creek`, `volcano`, `ruins`) is not a six-region canon art set. It may remain in the old game until Chat 3 replaces the exploration implementation, but it must not be relabeled as the final six-region artwork.

## 6. Character art direction

- Keep each named character recognizable at thumbnail size through silhouette, ear shape, body proportions, face markings, costume and signature prop.
- Do not use one base portrait with only fur color and accessory swaps.
- NPC costume must be practical for their work and environment; no arbitrary royal armor or generic fantasy robes.
- Design facial acting as readable eye shape, brow/ear angle, muzzle tension, whisker direction and body posture—not only mouth changes.
- Keep character-specific palette and material notes in `05-CHARACTER-VISUAL-BIBLE.md`.
- Muling's bell pendant is a continuity anchor. The pendant belongs to the player, has a concealed route-adjustment mechanism, and is tapped twice when she is nervous. Its function must not be exposed early.

## 7. Canonical cinematic coverage

Scene keys must be namespaced because the script reuses the source ID `E-01` for both Emberforge Chapter III and the epilogue:
- `chapter-iii/E-01`
- `epilogue/E-01`

Do not rewrite the narrative script to solve an asset-key collision. Preserve the exact source scene ID in the manifest and use a unique technical key.

Required cinematic anchors:
- Prologue P-01–P-05: six sanctuaries, the Starfall Catastrophe, the willing choice, years of waiting, awakening and departure.
- Chapters I–VI: each regional climax, each local melody, each reciprocal cross-region response, Muling's companion scenes and the fair-play clue progression.
- Chapter V M-03 identity reveal must precede M-04 betrayal reveal; M-05 explains the two paths.
- Chapter VI F-02 reveals the player's willing sacrifice; F-03 explains the Reverse Resonance; F-04 proves reciprocal links; F-05 begins the final confrontation.
- Finale B-01–B-04: Muling, Hollow Echo, six regional actions and the Final Note.
- Epilogue E-01–E-03: six regions answering, Muling taking responsibility, and the return to Sunlit Garden.

Do not show the full Reverse Resonance mechanism in early promotional or prologue art. Use framing, silhouette and partial information to preserve the reveal.

## 8. Cinematic stills and motion

Use a layered 2.5D composition:
- base environment painting;
- distant atmospheric layer;
- foreground frame elements;
- character/prop layer where the art supports separation;
- light, fog, weather or resonance overlays.

Camera movement should be subtle and intentional: 3–7% pan, 1.02–1.10 scale, slow parallax, and a 250–700 ms transition between authored frames. Hold on an emotional image long enough to read the acting. Do not use rapid slideshow pacing.

Use authored stills with camera motion when full-body animation cannot meet the same quality bar. Never fake continuous animation with abrupt character position jumps.

## 9. UI visual language

- Surfaces: deep ink/blue slate with warm parchment text and restrained brass separators.
- Typography: serif display face for chapter/scene titles; highly legible sans-serif for body and controls. Use system fallbacks; do not depend on an unlicensed remote font.
- Panels: low-opacity layered surfaces, fine separators, modest corner radius. Avoid thick glowing frames and excessive nested cards.
- Buttons: clear hierarchy, minimum 44px touch target, visible keyboard focus, distinct disabled state.
- Icons: consistent engraved/etched line weight, not mixed emoji and glossy app icons.
- Text: Chinese and English must be authored together; changing language during a scene updates the current subtitle and controls immediately.
- Keep existing gameplay controls and settings behavior. Chat 6 supplies visual tokens and the cinematic surface, not the save system, map engine, dialogue state or garden logic.

## 10. Responsive and performance requirements

- Master compositions are 16:9, but all key subjects must remain inside a central 70% safe region.
- Desktop: preserve the full cinematic composition; do not stretch artwork.
- Landscape mobile: keep subtitle and controls within safe-area insets.
- Portrait mobile: use deliberate alternate focal positioning or a portrait crop. Never shrink the entire desktop UI until text becomes unreadable.
- Respect `prefers-reduced-motion`; keep a static high-quality frame and functional controls.
- Lazy-load later chapter assets; preload only the next frame and essential transition layer.
- Use compressed runtime formats after approval; do not add multi-megabyte unoptimized images to every scene.
- No background music is introduced by this module. Scene-specific sound effects are optional and must be user-gesture safe.

## 11. Existing asset preservation audit

Preserve and evaluate before replacing:
- `assets/duo-storyboard-21x3-v3.webp` — existing 63 original duo storyboard frames.
- `assets/duo-premium-sheet.webp` and `assets/duo-stage-clean-21x3-v1.webp` — existing duo presentation assets.
- `assets/jiafei-watercolor-v2.webp`, `assets/watercolor-cats-v2.webp`, `assets/yard_bg.png`, `assets/yard-storybook.svg`, `assets/battle-garden.svg`.
- Existing CatArt, breed atlas, real-kitten and combat art modules.

These are preserved unless a separate, evidenced visual review approves a replacement. Duo battle art is not a substitute for story character portraits or regional key art.

## 12. Acceptance gate

A visual deliverable is not accepted merely because it exists or parses. It must pass:
1. canon/scene-ID review;
2. distinct character silhouette review;
3. lighting/material review at full size and thumbnail size;
4. Chinese and English text review;
5. desktop, landscape-mobile and portrait-mobile crop review;
6. reduced-motion and skip/resume review;
7. asset size/loading review;
8. actual browser screenshot review before production integration.

This branch's SVG key-art studies are original, editable production sources. They are not represented as hand-painted raster final art or as deployed game content until integrated and visually accepted.
