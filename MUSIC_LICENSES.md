# Morrow Wish background-music licenses

The four background recordings are public-domain / **CC0** tracks distributed by the FreePD music library. These recordings are **third-party works**, not exclusive compositions owned by Morrow Wish. The existing sound effects are separate.

Library and licensing: https://en.freepd.cn/music (CC0, including commercial games and apps).

| Game | Track | FreePD genre | MP3 source |
| --- | --- | --- | --- |
| Tiny Town | Happy Whistling Ukulele | Upbeat | https://en.freepd.cn/api/music/5570626561742f48617070792057686973746c696e6720556b756c656c652e6d7033 |
| Flip Dash | Inventing Flight | Upbeat | https://en.freepd.cn/api/music/5570626561742f496e76656e74696e6720466c696768742e6d7033 |
| Parcel Panic | Busybody | Comedy | https://en.freepd.cn/api/music/436f6d6564792f42757379626f64792e6d7033 |
| Pocket Aquarium | Connecting Rainbows | World | https://en.freepd.cn/api/music/576f726c642f436f6e6e656374696e67205261696e626f77732e6d7033 |

The selected files are served as `audio/mpeg` by FreePD's download endpoint. All four game pages preload their respective recording. Each game attempts autoplay and loops the chosen track through a native HTML audio element, honoring the browser's autoplay rules and the independent music switch.

Earlier AERIS Lo-fi selections were retired because they were too similar and bass-forward. They must not be used as a silent fallback.
