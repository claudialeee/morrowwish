# Morrow Wish native campaign video analytics

The private [Studio Insights dashboard](https://morrowwish.vercel.app/studio-insights/) tracks only the 28 published V14 relaunch videos (seven games × YouTube, TikTok, Instagram Reels and Bluesky) on November 22, 2026 Pacific. Public YouTube IDs are verified from the channel RSS feed, Instagram/TikTok URLs from completed provider publication statuses, and Bluesky IDs plus likes/reposts/replies from public AppView. All 28 canonical links live in `public/promo/social-release-status.json` and `promotion/social-metrics-snapshot.json`, and the native provider allowlists match them exactly. Previously posted, cancelled and deleted videos are excluded; no counts are migrated from previous video IDs. YouTube, Instagram and TikTok initial counts remain null until first-party metric refresh succeeds. The supplied V14 review manifest is the video reference, not publication status.

| Platform | First-party API | Production setup | Metrics |
| --- | --- | --- | --- |
| YouTube | Data API v3 `videos.list` | `YOUTUBE_DATA_API_KEY` restricted to YouTube Data API v3 | Views, likes, comments |
| Instagram | Instagram API with Unified Login, Reel Insights | `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`, `INSTAGRAM_CONFIG_ID`; business OAuth with `instagram_basic` and `instagram_manage_insights` | Views, likes, comments, shares |
| TikTok | Display API v2 `video/query` | `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, owner OAuth with `user.info.basic` and `video.list` | Views, likes, comments, shares |
| Bluesky | AppView `app.bsky.feed.getPosts` | No credentials | Likes, reposts, replies, quotes. Views are unavailable. |

The existing D1 cache has a refresh lease per provider. Bluesky reads refresh after 10 minutes and the other providers after 15 minutes. The dashboard checks every 10 minutes while visible. The GitHub Actions refresh runs twice hourly, including while the dashboard is closed, and uses a short-lived GitHub OIDC token restricted to the main-branch refresh workflow. GitHub can delay scheduled runs. A failed upstream request retains the previous native reading and its timestamp with a five-minute retry cooldown. Missing values in a successful partial response remain null. A total is shown only when all seven posts have a value for that metric. Player visits, campaign attribution, game starts and conversions retain their existing source.

## Production activation

- Add credentials only as Cloudflare Pages production secrets for `morrowwish`, then deploy. Never put credential values in a commit or command output.
- Instagram requires the studio's Professional account in a business portfolio and a Facebook Login for Business configuration that requests only an Instagram account and the app's required read scopes. Meta's Unified Login configuration also requires `instagram_manage_messages`. Set its callback to `https://morrowwish.vercel.app/api/instagram/callback`. The app receives a system-user token; keep it encrypted in D1. Standard Access is for app-role testing; connections outside app roles require Meta App Review and Advanced Access.
- For TikTok configure Login Kit for Web and the Display API `video.list` scope. Use callback `https://morrowwish.vercel.app/api/tiktok/callback`. Production access can require TikTok review. See [TikTok setup](tiktok-native-analytics.md).
- Sign in to Studio Insights on the canonical hostname before opening [Instagram OAuth](https://morrowwish.vercel.app/api/instagram/connect) or [TikTok OAuth](https://morrowwish.vercel.app/api/tiktok/connect). Each provider stores the studio token encrypted in D1. The optional dedicated storage key names are `INSTAGRAM_TOKEN_KEY` and `TIKTOK_TOKEN_KEY`. Otherwise the dashboard's existing key is used for encryption.

## Verify a release

Read the authenticated `GET /api/summary?days=7` and check `socialPulse.nativeYouTube`, `nativeInstagram`, `nativeTikTok`, `nativeBluesky`, and `metricScope.verifiedPosts`. Confirm the official timestamp, seven matched posts, and Cat Bond and Pawsibly Innocent metrics in the dashboard. The protected platform-specific `/status` and `POST /refresh` routes help diagnose credentials and API coverage. An unauthenticated request to the schedule endpoint must return 401. In Actions, select **Refresh first-party video metrics** to run the same authenticated request that scheduled runs use. Check the printed status and later confirm a scheduled run advances the dashboard timestamp.
