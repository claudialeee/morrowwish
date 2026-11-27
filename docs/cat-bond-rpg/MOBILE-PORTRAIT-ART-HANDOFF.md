# 星铃回响 · 竖屏美术素材交接

基于工程分支 `review/starbell-mobile-portrait` 的 `52f3c14da9aa3b84573959f8140347700ed01705`。本分支提供独立 WebP 与布置资料。所有路径相对于 `public/cat-bond/assets/mobile-portrait/`。使用水彩长图，由原图参考重构首页和四张关键剧情插画。角色、动态玩法、场地代码和台词由原运行时负责。

| 场景 | 竖屏文件 | 接入说明 |
| --- | --- | --- |
| 首页 | `title-bell-sanctuary.webp` | 橘色领巾金猫与紫色蝴蝶结布偶猫。标题在上，主按钮在下。随语言切换叠加标题，素材本身无字。 |
| 世界总图 | `atlas.webp` | [七个目的地锚点](mobile-portrait-atlas-anchors.json)。 |
| 六地 | `windchime-town-tall.webp`、`rootsleep-forest.webp`、`lantern-city.webp`、`skyspine-isles.webp`、`moonmirror-library-tall.webp`、`starfall-expanse.webp` | [各地区路径、NPC、功能点、探索点、缓存、远风岛锚点](mobile-portrait-region-anchors.json)。源坐标仍是 960×540 逻辑空间。 |
| 状态变体 | `harbor-ceremony-matched.webp`、`sky-farwind.webp` | 风铃镇庆典图复用主图空间关系，实接时复核门、主街、古铃与相机。远风岛用单独路线及缓存点。 |
| 追铃、森林、千灯城、云脊 | `harbor-chase.webp`、`forest-moonleaf-bridge.webp`、`forest-waterworks.webp`、`lantern-shadow-square.webp`、`lantern-vault.webp`、`sky-glide.webp` | 对应原追铃底图、森林分岔、水路可选机制、灯影剧场、藏灯室与云瀑飞行。水路只在现有独立机制使用。桥、灯影、风带、飞行门、落点和铃光反馈由运行时绘制。 |
| 地区战斗备选 | `battle-windchime.webp`、`battle-forest.webp`、`battle-lantern.webp`、`battle-sky.webp`、`battle-library.webp`、`battle-starfall.webp` | 场地或特效舞台确实裁坏再采用对应图。风铃镇首战现有战场在 390×844 已铺满，优先保留原铃房镜位并检查另外两种尺寸。 |
| 终战 | `battle-finale-lock.webp`、`battle-finale.webp`、`battle-finale-chorus.webp` | 分别供防护节点、破铃广场阶段、六地接唱构图。节点、真铃和安全位按运行时可交互区域布置，勿借静态特效替代。 |
| 序章与关键剧情 | `prologue-garden.webp`、`story-cloud-tea.webp`、`story-m03-reveal.webp`、`story-f02-history.webp`、`story-broken-bell.webp` | 前两张是环境板。M-03、F-02 是评级用原画的忠实竖版改绘，须保留揭示顺序。破铃环境板为备用过场镜位。 |
| 终章与尾声 | `story-b04-reunion.webp`、`story-e03-garden.webp` | 从原 B-04 与 E-03 重构，保留角色动作、服装、邀请与交钥匙动作。画面下方可叠对白。 |

## 接入顺序

1. 首页和序章先接。首页猫咪主体在 x=.13–.87、y=.41–.70。标题约 y=.08–.19，开玩按钮约 y=.86–.96，接入时随画面取景调整。庭院实机 390×844 已全屏铺底，继续使用原图，缩小任务卡。
2. 地图使用原逻辑坐标保存进度，按竖版坐标渲染。锚点清单包含 79 个主路径顶点、12 个地区居民与 51 个功能 ID。中间折点只描述画面中的道路。天空峡口为飞行段，森林跨水、书库折返和千灯城桥两端需要在实接时确认路径连续，图标、猫脚和点击命中使用同一映射。主任务卡压成可收起的底部抽屉。
3. 追铃实测的默认说明在 320px 折成六行。把两条路线和矮墙的关系作为主画面，把当前可用动作从文字栏迁到清晰的场上落点，底部保留退出与辅助入口。战斗战场、猫体与护盾、技能区分别复核，确保动态反馈不会挡住战斗对象。
4. 剧情肖像与结局画从对应剧情点读取。未在此表列出的旧过场须逐项视检。尤其首战触发的 Moonlight Starburst 仍使用横幅原画和上下模糊填充。已批准的合击分镜保留，若最终竖屏全屏验收覆盖合击，该段及同类合击仍需匹配的原画重构，不能用模糊层充当画面。
5. 接入后在 320×568、390×844、430×932 截取相同场景作实机对照，复核触控安全区、画面取景、地标、角色脚下与对话层，并跑原有横屏验证。当前实拍证据为既有试玩基线，见 [玩家视角评估](MOBILE-PORTRAIT-PLAYER-REVIEW.md)。
