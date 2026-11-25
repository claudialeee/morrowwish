# Cat Bond · 品质素材接手清单

美术审查基于 `review/cat-bond-storybook-visuals@4dc1093b`。将本提交移植到 `rpg/release-combined-next`。核对时统一分支为 `63083ae`，仍缺现有水闸背景和两张开局图，暮铃表情也仍旧。接手时从美术分支带入这些已整改素材，确认新版 `world-runtime.mjs` 的示范逻辑已移植，再接本清单。以下素材已导出，接入和试玩验收由 Chat 完成。路径均相对 `public/cat-bond/assets/`。

## P0 · 眠根林 R-03 双猫水闸

保留上游猫到位的前置条件和现有水闸背景 `resonance-world-v2/forest-waterworks.webp`。用背景交代场景，在下方或窄屏抽屉里显示三个同屏操作卡。玩家能直接点击卡片，也能沿卡片所示方向拖动。拖动时物件跟手，卡片提供同轴导线和终点。交互热区与卡片绑定，避免再从复杂背景里寻找看似可拖动的物件。

| 顺序 | 素材 · `waterworks/` 下的 WebP | 动作与反馈 |
| --- | --- | --- |
| 水压 | `valve-wheel.webp`、`pressure-gauge.webp` | 向右拨手轮，或点按两次。面板始终显示 `水压 0/2 → 1/2 → 2/2`，手轮分段转动，水压到位后锁定。 |
| 开闸 | `gate-handle.webp`、`sluice-panel.webp` | 向上抬闸柄，或点「抬起闸门 / Lift gate」。闸板上移，露出水流。 |
| 清根 | `tangled-roots.webp`、`water-release.webp` | 向右拖根团，或点「移开根团 / Clear roots」。根团滑出、出水闪动，播放 `quality-audio/water-splash.ogg` 一次，并显示「水渠畅通 / Waterway restored」。 |

- 当前操作用轮廓、方向和动词共同标记。提前点另一个卡片时，保留已完成步骤，提示具体条件，如「先把水压调到两格」。拖错方向或取消只让当前道具回位，提示正确方向。拖动完成只提交一次。减少动态效果模式下即时显示最终姿态。
- 接入 `js/resonance/world-runtime.mjs` 的 `pairedWater` 输入、绘制和文案。调整 `world-exploration.mjs` 中水压超调及重复关闭的规则，或在统一操作入口对已完成步骤拦截。保留成功状态 `[2,1,1]` 和现有双猫证据，`repair:forest` 后续谜题照旧。
- 验收用 R-03 存档直达。在桌面和 390 px 触屏分别验证点按和拖动、拖错恢复、提前点闸柄、取消及重复手势。玩家应能读出下一步，完成后只记一次进度。

## P0 · 旋律与音频

保留六区各自的三音顺序、示范播放和 NPC 回应。每个铃固定使用一个清楚的形状与名字（圆·露珠、菱形·星光、花形·花铃）。示范结束后，三个提示格保留相同图形；当前格加粗并带序号。允许任意重播。选错只轻提示「试试这一格」并标记当前目标，正确格保留。成功后铃声短句连起来回应一次，进入已有合奏流程。静音时完整流程用形状、序号和高亮即可完成。Chat 对接 `addMelodyControls`、`paintMelodyBoard`、`movePuzzle` 并保留仪式提交时机。

| 路径 · `quality-audio/` | 试点与授权 |
| --- | --- |
| `enchanted-valley.ogg` | 只试森林自由探索 BGM。Kevin MacLeod 的 *Enchanted Valley*，CC BY 4.0，转码为 Opus。[原曲与署名](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1200093) · [许可](https://creativecommons.org/licenses/by/4.0/)。上线时游戏内署名：*Enchanted Valley* by Kevin MacLeod (incompetech.com), CC BY 4.0, transcoded to Opus。 |
| `bell-g4.ogg`、`bell-c5.ogg`、`bell-e5.ogg` | 森林低／中／高三铃，对应现有三键和顺序中→低→高。stamperadam 实录 celesta，CC0。源文件 [G♯4 soft](https://freesound.org/people/stamperadam/sounds/96059/) 重采样生成 G4/C5，[E5 soft](https://freesound.org/people/stamperadam/sounds/96053/) 重采样生成 E5。按录音实测音高匹配现有 392／523／659 Hz，剪辑加短尾，平衡相对响度。 |
| `water-splash.ogg` | 水闸成功短音。*Water Splash 1* by qubodup，CC0。[源文件](https://freesound.org/people/qubodup/sounds/210428/)。 |

- Chat 通过既有音频导演接入。森林候选曲替换该场景的单一 BGM，试听谜题时压低当前曲，完整示范、跟奏和 NPC 回应各自可辨；离开、切存档、完成仪式及重播时检查单 BGM 与清理。循环点和切换由 Chat 实机确认。
- 扩展前只验森林。与现有 `forest.mp3` 对照，试听代表性段落及实际混音，确认气质更轻快、低中高能分辨、重复尝试不刺耳；静音下首试和故意输错后均能完成。候选曲通过试听前，其他地区维持原配乐。

## P1 · 剧情玩家立绘

`player-portraits/jinjc.webp` 和 `player-portraits/yunduo.webp` 为独立胸像，保留金豆、云朵的毛色、眼色和围巾，新增朴素铜扣。Chat 在 `js/resonance/narrative-host.mjs` 按当前选定的玩家猫匹配；其他品种和明显不同的自定义外观走现有动态头像。验收两种开局及切档，名字和身份跟随玩家，手机上耳尖和围巾完整。待在剧情界面确认画面后再启用。

代表性抽查含序章庭院、地图、云脊群岛、港口战斗背景、两张开局图和暮铃剧情表情。现有暮铃对话表情已是浅色小猫，`traveler-full.webp` 是旧深色全身图，未在剧情头像入口发现引用。保留已整改素材。本提交只新增资产，33 种猫、63 幅合击源图及游戏逻辑无需迁移。

针对性检查覆盖 390 px 静态合成、WebP 尺寸和透明边缘、现有水闸及六区旋律状态机、五段音频离线解码。剧情实机、触控和主观音质对比待验收。
