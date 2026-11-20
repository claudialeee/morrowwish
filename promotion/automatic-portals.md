# Fully unattended game-portal publishing — Morrow Wish

Scope: **itch.io and CrazyGames only**. Reddit and Newgrounds remain excluded.

## Trigger and verified state

GitHub Actions `.github/workflows/auto-publish-portals.yml` runs **only after a successful production Cloudflare deployment**, on manual dispatch, and daily for retry/catch-up. It reads the currently visible/playable games from `public/index.html`, matching `scripts/discovery.mjs`. It never changes Vercel, the existing Cloudflare project or D1.

- **itch.io:** if a new game has no project, uses a saved, authorized Chromium session to complete the New Project form, add the game description, matching auto-rendered cover, upload an HTML playable bridge to the real public game, set the listing Public, and verify anonymous page access. Existing six projects are not recreated. These are browser operations, **not Butler**: official Butler cannot create new projects. The bridge loads the actual interactive game from the live Morrow Wish host, allowing new gameplay changes to propagate without reupload. Verify itch.io accepts this embedded arrangement for each game (iframes or content security policies may change). A published static screenshot is not accepted as a game.
- **CrazyGames:** one submission per review cycle, in the priority order in `promotion/portal-status.json`. If any existing game is awaiting review, the automation does **not** submit another. It only attempts the next game when the official form and game assets are available and the game has actual rights, QA and human-playtest attestations (see below). It uses the official developer portal UI, not private APIs. A GitHub queue item does not count as portal submission.
- **Both platforms:** a changed form, CAPTCHA, expired login, iframe restrictions or platform review limit causes a safe stop rather than a false `published` status. No bypassing security challenges or mass-spam retries. GitHub Action run summaries show what really happened.

## One-time secure login authorization

The workflow is installed, but it is **not activated until the owner adds GitHub repository secrets**. OAuth through a read-only chat connector is not a persistent GitHub Actions login. On a trusted Mac, the repo owner can do once:

```sh
gh auth login
gh repo clone claudialeee/morrowwish
cd morrowwish
npm ci
npm install --no-save --no-package-lock playwright@1.56.1
npx playwright install chromium
node scripts/authorize-portals.mjs itch
node scripts/authorize-portals.mjs crazy
```

Each script opens a regular browser to sign into the **existing studio account**, verifies the account name, and writes the browser session directly into the private repository's GitHub Actions secret via GitHub CLI:
- `ITCH_STORAGE_STATE_B64`
- `CRAZY_STORAGE_STATE_B64`

Do not paste passwords or cookies in chat; do not check browser state files into the repository. A session can expire or be revoked by its provider, so a future re-authorization may occasionally be needed. Never attempt to bypass a login challenge.

After one-time setup, go to GitHub Actions → **Auto-publish Morrow Wish to game portals** → **Run workflow** to process existing new games (including Cat Bond); subsequent successfully deployed new games are automatic. On any blocked step, inspect the workflow summary. No recurring Work session is required.

## CrazyGames submission readiness (never fake a legal/product declaration)

Each game needs `public/<slug>/portal-release.json` recording a genuine developer/tester sign-off, e.g.:

```json
{
  "crazygames": {
    "rightsOwned": true,
    "humanPlaytestCompleted": true,
    "qaPassed": true
  }
}
```

Only add `true` when actually substantiated. The publisher also expects `public/promo/<slug>/cover-landscape.png` and `cover-square.png`. If any are absent, it will hold that game's place in the queue. The same files can be produced as part of future game release work; these are release gates, not new manual account-creation chores. The platform itself may require additional fields or video. A submission is successful only when its portal displays a review confirmation.

## Honest current status

Six itch.io game projects are confirmed public. Cat Bond is **not yet created on itch.io**. Pawsibly Innocent! is **Awaiting review** at CrazyGames; the other entries are drafts or not created. The browser publication scripts and workflow have been committed, but are **unverified against authenticated forms** because the GitHub secrets are not set. Once authorized, review the first real run and adjust selectors as needed; never assume an untested form automation worked.

Publishing a new game to the main Morrow Wish homepage remains the trigger. Do not create public posts for Reddit or Newgrounds.
