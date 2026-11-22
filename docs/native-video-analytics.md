# Morrow Wish — native campaign-video analytics

The protected `/studio-insights/` dashboard reads the **seven approved 2026-11-22 promo posts** on YouTube Shorts, TikTok, Instagram Reels and Bluesky. It never counts old content, profile totals as video views, or social plays as game starts. This integration is **read-only**: publishing is not enabled.

| Platform | First-party source | Account prerequisites | Refresh |
| --- | --- | --- | --- |
| YouTube Shorts | YouTube Data API v3 `videos.list(part=snippet,statistics,status)` | Cloudflare secret `YOUTUBE_DATA_API_KEY` with the YouTube Data API enabled in a Google Cloud project | 15-minute D1 cache, batch of exactly seven video IDs (1 API quota unit) |
| TikTok | TikTok Display API v2 `/v2/video/list/` | TikTok developer app with Login Kit and Display API, `video.list` permission; Cloudflare secrets `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`; owner consent | 15-minute D1 cache |
| Instagram Reels | Instagram API with Instagram Login / Graph API media and media Insights `views` | Professional Business/Creator Instagram `@morrowwishgames`, Meta developer app with Instagram Login and `instagram_business_basic`, `instagram_business_manage_insights` permissions; Cloudflare secrets `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`; owner consent | 15-minute D1 cache; per-Reel views/likes/comments |
| Bluesky | public AppView author feed | No secret or account connection | 10-minute D1 cache; likes/reposts/replies/quotes; views intentionally null |

Official APIs have provider-enforced quotas and permission requirements, but **no Metricool or vidIQ per-post analytics quota is used**. If authorization, post coverage, a required metric or an API response is missing, the dashboard does not fabricate values; it surfaces the source status in `socialPulse.nativeYouTube`, `nativeTikTok`, `nativeInstagram` and `nativeBluesky`. The preexisting snapshot is a dated, historical baseline until the owner connects each provider; it must not be described as live.

## Activate without sharing secrets

1. In Google Cloud Console, enable **YouTube Data API v3** and create a restricted server API key. Store the key as the **Cloudflare Pages production Worker secret** `YOUTUBE_DATA_API_KEY` (never in GitHub or the public client).
2. In Meta for Developers, enable **Instagram API with Instagram Login**. Add the exact OAuth redirect URI `https://morrowwish.vercel.app/api/instagram/callback` and access to the owner's Professional Instagram account. Store `INSTAGRAM_APP_ID` and `INSTAGRAM_APP_SECRET` as Cloudflare production secrets. `INSTAGRAM_TOKEN_KEY` is an optional stable AES-GCM passphrase; the existing `ARCADE_ANALYTICS_KEY` is the fallback encryption key.
3. TikTok approval and direct owner OAuth are described in [TikTok setup](./tiktok-native-analytics.md). The separate, approved developer app is required: the vidIQ OAuth token cannot be reused.
4. **Redeploy** the existing Cloudflare Pages project after adding secrets. Sign into `https://morrowwish.vercel.app/studio-insights/`. Open `/api/instagram/connect` and `/api/tiktok/connect` on the same domain in the same signed-in browser to complete owner OAuth. These links do not create or publish any posts.

Private, authenticated validation:

- `GET /api/youtube/status` and `POST /api/youtube/refresh`
- `GET /api/tiktok/status` and `POST /api/tiktok/refresh`
- `GET /api/instagram/status` and `POST /api/instagram/refresh`
- `GET /api/summary?days=7`: verify `socialPulse.native{YouTube,TikTok,Instagram,Bluesky}.status` and `postMetricsCount`; require **seven mapped videos** before publishing an aggregate playback total for each comparable platform.

An authorized `GET /api/summary` also refreshes a stale native data cache. This does **not** change `/go/` UTM attribution, first-party game events, the D1 analytics counters, or existing posts.

**Important:** Cloudflare Pages deployment and adding secrets are distinct actions. Code presence does not mean a live account has been authorized. To verify the deployment, read the production summary and confirm the native source status and fresh timestamp, not merely a GitHub workflow success.
