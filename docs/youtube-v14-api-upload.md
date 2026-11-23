# Morrow Wish — YouTube Data API V14 官方上传

使用最新审核页 https://morrowwish.vercel.app/promo/review/ 中的七条 MP4，直接从官方 YouTube Data API v3 上传至 **@morrowwishgames**，不经过 vidIQ / Metricool。

## 一次性 Google 授权

1. 用拥有 **@morrowwishgames** 频道管理权限的 Google 账号打开 [Google Cloud Console](https://console.cloud.google.com/)。创建一个项目（或复用你已有、专门为此上传客户端配置的项目）。
2. 在 [API Library](https://console.cloud.google.com/apis/library/youtube.googleapis.com) 启用 **YouTube Data API v3**。
3. 在 [Google Auth Platform](https://console.cloud.google.com/auth/overview) 配置 OAuth consent screen。个人账号可以选择 External + Testing，并将自己的 Google 邮箱添加为 test user；也可以按实际需求设置发布状态。Google 更改权限设置时，以控制台实时提示为准。
4. 在 [Credentials](https://console.cloud.google.com/apis/credentials) 创建 **OAuth client ID → Desktop app**，下载 JSON 客户端文件。不要创建 API Key 代替 OAuth，也不要使用 Instagram 的 client secret。
5. 将下载的 JSON 保存到自己电脑的 `~/.config/morrowwish/youtube-client.json`（创建目录即可）。**不要提交到 GitHub，也不要贴到聊天。**

## 在自己的 Mac 上启动

在 `claudialeee/morrowwish` 项目目录中运行：

```bash
mkdir -p ~/.config/morrowwish
chmod 700 ~/.config/morrowwish
python3 -m venv .venv
.venv/bin/pip install -r scripts/requirements-youtube-upload.txt
.venv/bin/python scripts/upload-youtube-v14.py
```

首次执行会打开 Google 官方 OAuth 授权页面，请确认选择正确的频道和授权信息。授权范围只有 YouTube 视频上传及只读频道信息。程序会验证当前授权对应的频道 ID 必须是 `UC9v31QGhSfBASDsbXMjch4Q`，否则停止上传。

程序会自动：
- 实时读取 `/promo/latest-review.json`，拒绝旧版 `hook-v3` 和不完整的七条清单
- 使用审核清单中的七个原始 MP4 和已批准的英文标题、描述、`#Shorts`
- 使用 Google 官方可恢复上传协议；上传后检查真实 video ID 和频道是否正确
- 避免重复：先查询频道最近上传列表，再对比本地上传登记
- 依次按 **Pocket Aquarium → Parcel Panic → Flip Dash → Elsewhere → Tiny Town → Pawsibly Innocent → Cat Bond** 上传
- 原计划 2026-11-22 太平洋时间 19:00 起，每隔五分钟；**如果原定时间已经过去，则直接公开，不会冒充过去时间发布**；仍在未来的会按原计划定时公开
- 每条创建完成后显示真实 Shorts URL，并在 `~/.config/morrowwish/youtube-v14-release-20261122.json` 保留本地结果

授权令牌只保存在用户电脑 `~/.config/morrowwish/youtube-oauth-token.json`，权限为 0600，不会写入仓库或发送给 ChatGPT。用户可以随时到 Google Account → Third-party connections 撤销授权。

## 限制

ChatGPT 中的“我给你授权”不等于 Google OAuth 登录同意。Google 必须由频道持有人在自己的浏览器里完成一次授权，否则该脚本不能上传。无需支付 vidIQ 套餐。

每条的视频处理状态取决于 YouTube。返回视频 ID 代表 API 接受了上传，并不保证视频处理完成、进入 Shorts 推荐流或获得观看量。脚本不更改 YouTube 频道主页或 Morrow Wish 官网。

官方文档：
- https://developers.google.com/youtube/data/guides/uploading_a_video
- https://developers.google.com/youtube/data/reference/rest/v3/videos/insert
- https://developers.google.com/youtube/data/determine_quota_cost
