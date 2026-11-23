# Morrow Wish · YouTube Data API V14 上传（零本地环境）

**推荐方案：打开网页即可操作，不需要本地仓库、终端、Python、Desktop OAuth JSON 或上传任何密钥到 GitHub。**

👉 https://morrowwish.vercel.app/studio-youtube-upload/

此网页会读取官网的 `/promo/latest-review.json`，核实七条 V14 审核视频。使用 Google Identity Services 在**浏览器**中以 `youtube.upload` 与 `youtube.readonly` 授权，确认 OAuth 对应的频道 ID 为 `UC9v31QGhSfBASDsbXMjch4Q` 后才能开始。采用 YouTube Data API 的 resumable `videos.insert` 上传。

## 唯一必要的手动步骤

1. 在 https://console.cloud.google.com/apis/credentials 的原有 Morrow Wish Google Cloud 项目中选择 **Create Credentials → OAuth client ID → Web application**（**不是** Desktop app）。如果提供 **Personal mode**，个人使用可选择该选项；否则按控制台引导配置 OAuth 同意页面，并添加自己的 Google 邮箱为测试用户。
2. 在 **Authorized JavaScript origins** 填入 **https://morrowwish.vercel.app**。本页面使用弹窗 Token 模式，不需要填入 redirect URI。
3. 从创建结果中**仅复制 Client ID**（以 `.apps.googleusercontent.com` 结尾），粘贴到上面网页的 OAuth Client ID 输入框，然后点击 Google 授权。
4. 网页验证是指定的 @morrowwishgames 频道后，勾选确认并点击 **开始上传 7 条 Shorts**，保持页面打开至完成。

**禁止**将 Client Secret、API Key、Google 密码或 Access Token 粘贴到网页或聊天。Client ID 是客户端公开标识，可以放在浏览器中。上传 Access Token **只保留在浏览器内存中**，该页面不会传给 Morrow Wish 服务器。

## 上传规则

发布顺序：Pocket Aquarium → Parcel Panic → Flip Dash → Elsewhere → Tiny Town → Pawsibly Innocent → Cat Bond。起始计划 2026-11-22 19:00 PST，每五分钟一条；已过计划时间直接公开，尚未到时的由 YouTube 定时公开。不修改发布文案和网站其他页面。

在上传前进行频道 ID 核对、读取频道最近上传的视频标题、检查本次网页的本地完成登记；成功后逐条显示 YouTube 实际返回的视频 ID 与 Shorts URL。已存在同名视频会跳过避免重复上传。上传成功不代表审核已完成或保证公开可观看，需再核实 YouTube 的状态。

**技术说明：** 网页只在用户点击上传后执行。Google 免费上传配额以 Google Cloud 项目当前有效政策为准。当前纯网页路径仍需要 Google 用户本人 OAuth 授权，这步无法代替。

## 旧版备用方法（不推荐）

`scripts/upload-youtube-v14.py` 和 `scripts/requirements-youtube-upload.txt` 保留作为独立本地脚本备用，不再是要求用户执行的方案。
