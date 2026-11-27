# 星铃回响 — 仅剩原画交付（Canon 2.2）
基线：线上 0cf0e75；固定全景实机双端已通过 run 46062465811。本独立分支未部署，不改 main、正式猫猫纽带及玩法。Work 不再运行全章节测试、不重画已批准素材、不改剧情、战斗、UI 或代码。

## 仅三个待写入的文件
| 精确目标路径（public/cat-bond/assets/ 下） | 来源 |
|---|---|
| resonance-world-v2/sky-farwind-wide.webp | 用户原画 Cloud Sea Farwind Island Observatory.png 的 1672×941 WebP；直接应用现成 starbell-farwind-original-art.patch，SHA256 e406dcd10c8895e4976ebde7cf31b751b65811ffd125a204de338949715e69dd，禁止重绘/裁切/用相似图 |
| combat/star-bell-arena-lock-wide.webp | B-01 防护锁，参照现有 mobile-portrait/battle-finale-lock.webp 重新构图为独立 16:9 水彩战场 |
| combat/star-bell-arena-chorus-wide.webp | B-03 六地共鸣，参照现有 mobile-portrait/battle-finale-chorus.webp 重新构图为独立 16:9 水彩战场 |

B-02 保留现有 combat/star-bell-arena-wide.webp / mobile-portrait/battle-finale.webp；B-04 保留已有 core-art-remaster/story/b04-reunion.webp / mobile-portrait/story-b04-reunion.webp。B-01/B-03 的现有竖屏均保留。除非实际发现素材不正确，禁止重画或更换。
## 绘画
独立中央星铃圣所，不是云海岛、星坠原或首页封面。参照现有竖屏终章原画和原版宽屏战场，而非先前失败的拼图。保持同一建筑、星铃与画风。明亮精致、开阔连续石质战场、六道真实节点及猫咪安全站位由引擎动态绘制，原画不得烘焙猫、文字、UI 或预先完成的发光战斗状态。两幅独立高分辨率 WebP，不拼图、不裁竖图、不拉伸，保留完整镜位。终章无需新探索地图或额外玩法。
## 交付
从此分支最新头开始，在一次提交中加入三个指定文件；已有 patch 用 git apply --check 后 git apply。自动触发仅针对这两处场景的 CI：原画哈希、解码、横竖屏方向、终章固定镜位及远风岛实际开发者画面。Work 不等待、不重跑、不部署；提交 SHA、两个新增原画路径即可。Chat 负责复核、补测、合并、部署以及线上验收。
