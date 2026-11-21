# Morrow Wish background-music licenses

The four background recordings are public-domain / **CC0** tracks distributed by the FreePD music library. These recordings are **third-party works**, not exclusive compositions owned by Morrow Wish. The existing sound effects are separate.

Library and licensing: https://en.freepd.cn/music (CC0, including commercial games and apps).

| Game | Track | FreePD genre | MP3 source |
| --- | --- | --- | --- |
| Tiny Town | Happy Whistling Ukulele | Upbeat | https://en.freepd.cn/api/music/5570626561742f48617070792057686973746c696e6720556b756c656c652e6d7033 |
| Flip Dash | Inventing Flight | Upbeat | https://en.freepd.cn/api/music/5570626561742f496e76656e74696e6720466c696768742e6d7033 |
| Parcel Panic | Funshine | Upbeat | https://en.freepd.cn/api/music/5570626561742f46756e7368696e652e6d7033 |
| Pocket Aquarium | Connecting Rainbows | World | https://en.freepd.cn/api/music/576f726c642f436f6e6e656374696e67205261696e626f77732e6d7033 |

The selected files are served as `audio/mpeg` by FreePD's download endpoint. All four game pages preload their respective recording. Each game attempts autoplay and loops the chosen track through a native HTML audio element, honoring the browser's autoplay rules and the independent music switch.

Earlier AERIS Lo-fi selections were retired because they were too similar and bass-forward. They must not be used as a silent fallback.

## Short-video soundtrack policy (2026-11-21)

The older batch of promotional videos was **rejected and unpublished**. It reused
Happy Clappy Loop across every game. The replacement workflow must use the
independent seven-track catalog in `promotion/promo-music-catalog.json`:

| Video | Licensed recording | License |
| --- | --- | --- |
| Pawsibly Innocent | Happy Clappy Loop · OwlishMedia | CC0 1.0 · OpenGameArt |
| Cat Bond | My Giant Bunny Friend · FreePD | CC0 |
| Tiny Town | Happy Whistling Ukulele · FreePD | CC0 |
| Elsewhere | Easy Lemon · Kevin MacLeod | CC BY 4.0 |
| Flip Dash | Inventing Flight · FreePD | CC0 |
| Parcel Panic | Funshine · FreePD | CC0 |
| Pocket Aquarium | Connecting Rainbows · FreePD | CC0 |

**Mandatory attribution for any Elsewhere short using Easy Lemon:**
“Easy Lemon by Kevin MacLeod (incompetech.com), licensed under CC BY 4.0.
https://creativecommons.org/licenses/by/4.0/” Include this in the post description
and preserve the attribution if the video is reposted. The master reel needs it
whenever that excerpt's audio is audible.

Before recording, run `node scripts/fetch-promo-audio.mjs` to retrieve and
validate the recorded audio files. The renderer fails if a track is missing,
undecodable or duplicated. The 7-game montage uses the audio from each individual
clip with short crossfades. This is a track-selection and QA fix; it **does not
mean** the previously rejected videos have been redesigned or approved.
