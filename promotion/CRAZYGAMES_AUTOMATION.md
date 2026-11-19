# CrazyGames 自动发行：使用官网链接，不上传游戏 ZIP

Morrow Wish 的游戏代码以 https://morrowwish.vercel.app/ 为唯一线上版本来源。CrazyGames 官方允许考虑嵌入独立域名托管的游戏，但游戏仍须通过平台审核，不会自动上架。

不使用 Work / TinyFish，不使用个人社交账号，不发布未经核实的提交记录。

## 1. 已完成的自动化

GitHub workflow：.github/workflows/crazygames-preflight.yml

- 通过 Playwright Chromium 检查 promotion/ledger.json 中的正式游戏 URL、UTM 和 iframe 实际加载。
- 自动生成三种合规尺寸的封面：1920x1080、800x1200、800x800。封面使用各游戏现有美术和名称，不会当成游戏录像。
- 对 Flip Dash / Parcel Panic 录制真实游戏网页运行画面：横版和竖版无声 MP4，不能用静态图替代。
- 测试时阻断站内统计接口，避免自动化浏览污染真实试玩数据。
- 每次执行都在 GitHub Actions artifacts 留存素材、检查结果，有效期 14 天。
- 不会将素材制作成功冒充平台审核、游戏发布或玩家流量。

[打开游戏检查工作流](https://github.com/claudialeee/morrowwish/actions/workflows/crazygames-preflight.yml)

## 2. CrazyGames 账户首次授权（只需一次）

GitHub 的仓库连接无法自动取得你在普通 Chrome 或 Work 中对 CrazyGames 的登录状态。登录已有工作室开发者账户，不需要重新注册账号。

如果希望让 GitHub Actions 能访问 CrazyGames 后台：

1. 在你的计算机上安装 Node.js / Playwright。
2. 从仓库根目录执行：

    npx playwright codegen --save-storage=.check/crazygames.auth.json https://developer.crazygames.com/

3. 使用已注册的 Morrow Wish 开发者账户登录，关闭 Playwright 浏览器保存会话。
4. 用 GitHub CLI 将浏览器会话保存为私有 Actions Secret：

    base64 < .check/crazygames.auth.json | tr -d '\n' | gh secret set CRAZYGAMES_STORAGE_STATE_B64 --repo claudialeee/morrowwish

5. 运行只读检测：[CrazyGames Portal inspection](https://github.com/claudialeee/morrowwish/actions/workflows/crazygames-portal.yml)。

会话文件可能含登录 cookie / token，绝不能上传到聊天、Issue、公开日志或代码库。仓库已将 .check/ 忽略。会话过期时才需要更新密钥。

这一步之后可以根据真实后台表单的字段适配自动提交；在没有可用授权和实际字段验证前，不能安全地假设已登录、假设按钮存在或声称提交成功。

## 3. 验证与去重原则

- promotion/ledger.json 是发行状态来源。只有拿到平台提交 ID、提交确认或可验证的游戏公开页后，才能写入该渠道对应状态。
- 首轮优先 Flip Dash、Parcel Panic，其余四款按检查结果跟进。
- CrazyGames URL 保留 utm_source=crazygames、utm_medium=portal 和 <slug>-playtest 活动标记。
- 不会绕过验证码、条款确认和平台审核。
- 平台内的开局数和停留时间以 CrazyGames Dashboard 为准，官网 UTM 归因和平台统计分开比较。
- CrazyGames Basic Launch 可不接 SDK；Full Launch 则需要满足 SDK 等平台要求。

官方参考： https://docs.crazygames.com/faq/ ; https://docs.crazygames.com/requirements/game-covers/ ; https://playwright.dev/docs/auth 。
