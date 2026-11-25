# Independent mature / awakened illustration inventory

Baseline: a80833cd3d10d3fd9c2065b1d931f8cdb7a19d23. Runtime evidence: `js/adult-art.js` reports `matureArtIsSeparateImage:false`; `js/growth.js` retires progression. The current runtime has 32 atlas breeds plus Jiafei (33 entries in data.js). Neither the watercolor atlas nor the standalone Jiafei asset is independent mature art.

No new growth transformation is enabled by this PR. Existing stage data and power multipliers remain unchanged. Until art approval, legacy stages use the same original watercolor image at the same size, with no synthetic glow or gem.

| Runtime species ID | Display name | Adult master | Awakened master | Reference |
|---|---|---|---|---|
| tangyuan | 汤圆 | Missing | Missing | watercolor-cats-v2.webp / tangyuan |
| doudou | 豆豆 | Missing | Missing | watercolor-cats-v2.webp / doudou |
| xiaohui | 小雾 | Missing | Missing | watercolor-cats-v2.webp / xiaohui |
| moqiu | 墨球 | Missing | Missing | watercolor-cats-v2.webp / moqiu |
| nainai | 雪团 | Missing | Missing | watercolor-cats-v2.webp / nainai |
| nietu | 奶酥 | Missing | Missing | watercolor-cats-v2.webp / nietu |
| niuniu | 奥利奥 | Missing | Missing | watercolor-cats-v2.webp / niuniu |
| sanhua | 花花 | Missing | Missing | watercolor-cats-v2.webp / sanhua |
| lixiao | 绅绅 | Missing | Missing | watercolor-cats-v2.webp / lixiao |
| lanbao | 蓝莓 | Missing | Missing | watercolor-cats-v2.webp / lanbao |
| dundun | 团团 | Missing | Missing | watercolor-cats-v2.webp / dundun |
| yunduo | 云朵 | Missing | Missing | watercolor-cats-v2.webp / yunduo |
| zherdd | 布丁 | Missing | Missing | watercolor-cats-v2.webp / zherdd |
| qisi | 芝士 | Missing | Missing | watercolor-cats-v2.webp / qisi |
| duanduan | 跳跳 | Missing | Missing | watercolor-cats-v2.webp / duanduan |
| jinjc | 金豆 | Missing | Missing | watercolor-cats-v2.webp / jinjc |
| jiafei | 圆宝 | Missing | Missing | jiafei-watercolor-v2.webp |
| xianluo | 露露 | Missing | Missing | watercolor-cats-v2.webp / xianluo |
| yinghua | 樱桃 | Missing | Missing | watercolor-cats-v2.webp / yinghua |
| senlin | 松松 | Missing | Missing | watercolor-cats-v2.webp / senlin |
| youling | 幽幽 | Missing | Missing | watercolor-cats-v2.webp / youling |
| nuowei | 枫枫 | Missing | Missing | watercolor-cats-v2.webp / nuowei |
| baomao | 斑斑 | Missing | Missing | watercolor-cats-v2.webp / baomao |
| jinwu | 焰焰 | Missing | Missing | watercolor-cats-v2.webp / jinwu |
| yuelian | 月月 | Missing | Missing | watercolor-cats-v2.webp / yuelian |
| xingchen | 星星 | Missing | Missing | watercolor-cats-v2.webp / xingchen |
| abi | 杏仁 | Missing | Missing | watercolor-cats-v2.webp / abi |
| meidu | 圈圈 | Missing | Missing | watercolor-cats-v2.webp / meidu |
| xuewa | 雪袜 | Missing | Missing | watercolor-cats-v2.webp / xuewa |
| mengmai | 夜夜 | Missing | Missing | watercolor-cats-v2.webp / mengmai |
| fanmao | 奶糖 | Missing | Missing | watercolor-cats-v2.webp / fanmao |
| bosi | 绒绒 | Missing | Missing | watercolor-cats-v2.webp / bosi |
| wumao | 桃桃 | Missing | Missing | watercolor-cats-v2.webp / wumao |

For each listed species: retain markings, eye color, muzzle, ears, tail and fur palette; create an independently drawn adult and awakened character sheet. Deliver transparent WebP runtime portraits and grounded gameplay poses, matching approved watercolor brushwork. Master 1800×2400 or larger, export at least 512×512 transparent portrait, with consistent paw anchor, bounds and color/alpha checks. Do not activate growth until separately approved.

## Other asset review

Six region WebP environment files, 12 NPC painted WebPs and the 63-frame Duo sheet exist. Current regional combat mapping mixes WebP and SVG arenas; only Emberforge has a separately named painted battle arena and painted boss WebP. Harbor, Skyspine, Moonmirror and Starfall regional arena references are SVG; Rootsleep uses the exploration WebP. Their rendered quality and replacement needs require actual screenshot review. No unreviewed arena or NPC asset is deleted or substituted.

This inventory establishes file/runtime facts, not a visual approval of any asset.
