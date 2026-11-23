# Y8 submission draft — Cat Bond (Morrow Wish)
Prepared: 2026-11-22; updated 2026-11-23. **DRAFT ONLY — do not request review before App ID and Y8 portal validation are complete.**

## Verified portal state
- Studio: **Morrow Wish**, visible in the signed-in Y8 Developer Portal.
- My Games: no game records visible when checked 2026-11-22.
- Start record: https://developer.y8.com/games/new
- Record name: **Cat Bond**
- Game ID and App ID: **NOT CREATED / NOT AVAILABLE**. Obtain from SDK Initialization after the game record is created.

## Basic Info — copy to Y8
**Game name:** Cat Bond

**Developer / Studio:** Morrow Wish

**Engine / technology:** HTML5 / JavaScript (Custom Engine)

**Suggested genres, subject to the portal's actual options:** Casual; Simulation; Adventure; Strategy; Action

**Suggested tags, if supported:** cats, pets, collection, cozy, adventure, exploration, strategy, browser game

**Short description:**
Build a cozy home for your cats, discover wild companions, and explore a charming world of collecting, care, and real-time challenges.

**Full description:**
Cat Bond is a cozy cat-collecting adventure where a peaceful garden opens the door to a much bigger world. Choose your first kitten, play together, and search the yard for hidden wild cats. Venture into new regions, meet different companions, and use real-time battles to bring new cats into your family.

Care for and train your cats, grow their bonds, customize your garden with facilities, and discover rare companions as your collection expands. Take your time with everyday cat life, or switch to the excitement of exploration and tactical encounters. Every new friend gives you another reason to return.

**Instructions:**
Start by choosing your first kitten. Use your mouse or touch screen to interact with cats, objects, the map, and the on-screen menus. Search for hidden wild cats, explore regions, and enter encounters to discover new companions. During battles, use the on-screen controls or switch to Auto Battle. Return to the garden to feed, play with, train, and care for your cats.

**Website (studio profile only):** https://morrowwish.vercel.app/
**Original game URL (reference for review, not an in-game external link):** https://morrowwish.vercel.app/cat-bond/

## Media — required Y8 slots (each slot needs at least one file)
**Must use authentic current-game captures, no fabricated mechanics, no old/incorrect duo animation, no website/social overlays.**

| Slot | Exact pixel dimensions | Max bytes | Status |
| --- | ---: | ---: | --- |
| Standard Screenshot | 760 × 570 (4:3) | 2 MB | GENERATED; size verified; portal upload pending |
| Widescreen Screenshot | 1280 × 720 (16:9) | 5 MB | GENERATED; size verified; portal upload pending |
| Landscape Promo | 1920 × 1080 (16:9) | 5 MB | GENERATED; size verified; portal upload pending |
| Portrait Promo | 1080 × 1920 (9:16) | 5 MB | GENERATED; size verified; portal upload pending |
| Game Card Promo | 760 × 570 (4:3) | 2 MB | GENERATED; size verified; portal upload pending |
| Gameplay video | min. 1280 × 720 (16:9), min. 15 s, MP4/MOV | 50 MB | GENERATED; size verified; portal upload pending |

Proposed media themes: lively cat garden; cat interaction and care; the five-region exploration map; workshop/courtyard building; a short ordinary battle/capture; different cats to collect. Prefer multiple gameplay themes; **do not feature the full-screen duo finisher**.

**Important:** Y8 video must be one *continuous* real gameplay recording starting with gameplay, preferably 20–25 seconds. Existing edited V13/V14 social trailers and CrazyGames montage are **not acceptable as the gameplay video**. Avoid black bars and intro cards. Media reviewer may crop preview to 4:3.

Potential source material (not validated for Y8 media dimensions or eligibility):
- Existing Cat Bond source: `public/cat-bond/`
- Current real-game assets: `public/cat-bond/assets/`
- Current social footage, montage reference only: `public/promo/cat-bond/trailer-v13-20261122.mp4` and `trailer-v13-landscape-20261122.mp4`
- Real gameplay capture scripts, for adaptation: `scripts/record-cat-bond-crazygames-previews.mjs`; `scripts/record-cat-bond-crazygames-previews.mjs` focuses on the duo finisher, so do **not** upload its video unchanged.
- Original V13 scene manifest: `public/promo/cat-bond/trailer-v13-landscape-20261122.json`

## Technical blockers — fix on a platform-specific copy, not the live website
1. **ZIP, not iframe.** Y8's current iframe policy is limited to technically justified complex multiplayer games. Cat Bond is a single-player game and should be a self-contained Y8-hosted HTML5 ZIP.
2. **All resources local within ZIP.** Current Cat Bond source relies on root-relative `/cat-bond/*` and shared `/lang.js`, audio/scripts; rewrite and package all dependencies. Verify no network/asset 404, no broken fonts/music, no remote game dependencies.
3. **Y8 SDK.** After creating game record, obtain **App ID** (and Game ID if using ads) from the portal, integrate Y8 JavaScript SDK into the isolated Y8 build. Allow guest play even when login fails.
4. **No external navigation.** Remove/disable `← Morrow Wish 首页` external home link and any external/share links in the Y8 build; retain external website link only on studio profile. No third-party ad network.
5. **Pause/mute on blur and `visibilitychange`**, and resume respecting the existing sound setting.
6. **Test mouse and touch** with the exact selected devices, responsive UI, save/reload, tutorial flow, capture, collection, garden building, encounters, English locale, loading and sound.
7. **Rights and AI declaration.** Verify third-party audio/font/art rights and fill Y8's AI Declaration accurately. Avoid misrepresenting AI asset provenance.
8. **No live game modifications.** Never change production Cat Bond, homepage, analytics or existing CrazyGames draft as a side effect of preparing this Y8-specific build.

## Latest export and validation
- GitHub Actions **PASS**: https://github.com/claudialeee/morrowwish/actions/runs/45114981291
- Downloadable artifact: `y8-cat-bond-draft-7`; includes `cat-bond-y8.zip`, five JPG image slots, continuous 19-second MP4 and JSON QA reports.
- Automatic game bootstrap and real player garden screenshot capture succeeded in landscape and portrait Chromium sessions.
- ZIP contains the approved original 63-painting source; original production game files and CrazyGames submission were not changed.
- Images have exact Y8 dimensions and stay beneath published size limits. Continuous video is 1920×1080/19s, real recorded gameplay from the shipping game. Videos/media were also visually inspected.
- **Remaining blocker:** The studio's My Games panel had no Cat Bond entry when checked; App ID and Game ID were not available. The SDK loader is present but its config is blank. This ZIP is a technical draft and is **not yet a complete Y8-ready SDK integration**. Enter the real portal credentials and rebuild before requesting review.
- Rights/AI declaration and Y8's own upload/preview validation still require review.

## Submission QA gates
- [ ] Studio approval shown, if required
- [ ] Y8 game record created; App ID known
- [ ] Y8 SDK initialized without page errors
- [x] Standalone ZIP builds and launches locally under HTTP (Y8 hosting not yet verified)
- [ ] No external site navigation; no 404s
- [ ] Guest play; save and reload
- [x] Original 63-painting Cat Bond assets present; basic boot/starter/garden browser smoke passed
- [ ] Browser blur/hidden gameplay and audio pause
- [x] Five media slots; dimensions/byte sizes checked
- [x] Gameplay preview continuous, actual gameplay, 19 seconds
- [x] Gameplay/screenshots visually inspected
- [ ] AI declaration and content settings verified
- [ ] Only then request Y8 review

## Official sources checked
- https://docs.y8.com/studio/studio/
- https://docs.y8.com/studio/create-game/
- https://docs.y8.com/studio/media/
- https://docs.y8.com/studio/game-requirements/
- https://docs.y8.com/studio/iframe-game-hosting/
- https://docs.y8.com/studio/sdk-initialization/
- https://docs.y8.com/sdk/intro/
