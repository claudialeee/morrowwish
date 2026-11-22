# Morrow Wish — TikTok native video analytics

The dashboard's previous TikTok provider feed returned only two video records, although the public `@morrowwishgames` profile confirmed **7 videos published** on 2026-11-22. A profile-level video count is not a valid sum of per-video views.

## Independent native connection

The authenticated Cloudflare Pages Worker now has a TikTok **Display API v2** integration. It requests `id,view_count,like_count,comment_count,share_count` from `POST /v2/video/query/` with exactly seven approved IDs; tokens are refreshed and stored AES-GCM encrypted in the existing D1 database. The protected summary and twice-hourly GitHub Actions schedule refresh stale data (15-minute cache). It will not remove known videos or invent view counts for a partial feed. Each video is keyed by TikTok video ID, not its potentially changing share URL.

This connection **is not active until the owner's TikTok developer application is approved, configured and authorized**. ChatGPT/vidIQ's TikTok OAuth authorization is held by vidIQ and cannot be reused by Morrow Wish's Worker.

1. Visit [TikTok for Developers](https://developers.tiktok.com/), register or select an approved Web app, enable **Login Kit** and **Display API**, and request `user.info.basic` plus `video.list` access.
2. Configure the exact registered redirect URI: `https://morrowwish.vercel.app/api/tiktok/callback`.
3. In the **Cloudflare Pages `morrowwish` production project**, add encrypted Worker secrets `TIKTOK_CLIENT_KEY` and `TIKTOK_CLIENT_SECRET`. Add `TIKTOK_TOKEN_KEY` (recommended stable encryption passphrase); without it, the existing `ARCADE_ANALYTICS_KEY` is used to encrypt D1 tokens. **Never put secrets in GitHub source, public web pages, or chat messages.**
4. Redeploy the existing Cloudflare Pages project after configuring secrets. Log into the [private Morrow Wish dashboard](https://morrowwish.vercel.app/studio-insights/), then open [Connect TikTok account](https://morrowwish.vercel.app/api/tiktok/connect); consent must come from the `@morrowwishgames` owner.
5. Once connected, use the protected dashboard normally. Owner-only `GET /api/tiktok/status` shows the connection state and last refresh time; owner-only `POST /api/tiktok/refresh` forces a new provider request.

**Acceptance check:** all seven verified new TikTok video IDs and their actual provider `view_count` values appear in `socialPulse.metricScope.verifiedPosts`, and the TikTok platform total equals the sum only when every published post has a known numeric count. If TikTok's official query exposes fewer than seven, total views remain blank and the private status reports incomplete coverage. The profile's **7 published** remains accurate regardless.

The existing Cloudflare deploy workflow still has independent Cat Bond game QA gates; passing the isolated TikTok test does not bypass those checks or prove the production Worker has been deployed. Test: `node scripts/test-tiktok-native.mjs`.
