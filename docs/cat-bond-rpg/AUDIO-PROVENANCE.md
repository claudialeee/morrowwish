# Cat Bond: The Last Resonance — audio provenance

New original score and environmental audio authored for Morrow Wish in this change. No outside composition, MIDI score, or copyrighted game OST is used. The original score can be rendered with FluidR3 GM sampled instruments for release; the instrument library is not an external musical composition. The source is provided for use, modification and distribution as part of this game without attribution or royalty requirements. No third-party license is asserted for older assets. Existing studio-audio.js effects are retained; they are procedural game sounds already in the repository.

| Source | Original author/source | Scenes |
|---|---|---|
| public/cat-bond/js/rpg-audio-score.js | Original project composition and instrument modeling | title, opening, garden, atlas, six regions, six bosses, regular combat, Muling, identity, betrayal, finale phases 1–3, ending, postgame garden, six sanctuary songs |
| public/cat-bond/js/rpg-audio.js | Original programmatic environmental sound | garden, harbor, forest, forge, sky, library, starfall |
| public/studio-audio.js | Existing project procedural effects, no external recording | controls, attacks, skills, duo and other existing game effects |

Release renderer: scripts/render-cat-bond-score.mjs produces 96 kbps stereo MP3 recordings, a per-file manifest including checksums, and the exact distribution copyright notice. Browser loads only the requested recording, decodes to 24 kHz, and uses an original offline score fallback if the recording is absent. No external runtime audio service. A maximum of three cached scores is retained after loading settles. Final audio quality and device/browser acceptance are required before release. No production deployment authorized by this change.

## Sampled instrument source
- Fluid (R3) GM SoundFont, Frank Wen, copyright 2000–2002, 2008, MIT license; distribution package fluid-soundfont-gm. See https://sources.debian.org/src/musescore-general-soundfont-small/0.2-2/MuseScore_General_License.md/ and https://github.com/pinkflames/fluid-soundfont/blob/main/LICENSE. The release renderer copies the actual package copyright notice alongside the recordings. Commercial use, modification and distribution are permitted under the MIT terms with the copyright and permission notice retained. The soundfont itself is not shipped in the game.
- All 31 compositions remain original project work, not third-party songs. A released MP3 has a corresponding manifest entry, duration, byte count and SHA-256. No claim of subjective listening acceptance is made solely from rendering.

The director observes the actual visible sanctuary ceremony and committed melody state, and responds to real final-phase regional support recorded in the active save. New environmental textures combine filtered noise, water/wind envelopes, bird-call harmonics, metallic impacts and page-like transients. All are original procedural sound design; no external samples are used for ambience. `scripts/check-cat-bond-audio-assets.mjs` verifies the rendered recording manifest, source checksum, license, recording checksums and compressed size budget.

All six world-exploration melody puzzles now defer successful evidence until the actual performance finishes (or the player explicitly skips or has music disabled/unavailable). Existing harbor/forest cinematics remain intact; the other four use the corresponding regional scene and real invited residents, with a performance progress indicator. Explicit skip retires the track and does not replay it on the resulting committed melody. Existing chapter-specific cinematic work remains authoritative and should be checked at integration.
