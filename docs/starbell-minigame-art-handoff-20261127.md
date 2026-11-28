# Starbell — finalized narrow art handoff, 2026-11-27
Supersedes all earlier six-board, art-integration, or playthrough briefs. Chat owns design, implementation, engineering integration, tests, merge and deployment. Work is commissioned for finished artwork only.

## Implemented design baseline
Code: a4f42c91680df567281cb794f173c619ecafc2ab. Six standalone side boards are removed from the live map. Their legacy proof and save data remain compatible; new environmental discovery trails award each regional perk once and preserve prior rewards.
- Harbor: guide Gran by the brass-chime landmark and remember her recovered memory later; no independent board.
- Forest: moonleaf bridge, rescue, optional canopy discovery with real reward.
- Forge: three escaped shadow cats with distinct hide, run and opposite-side mimic rules; five verified interaction phases; optional theater remains the festival payoff.
- Sky: real upper/lower gliding routes, optional feather and safe-island stops with rewards; preserve two cups of tea.
- Library: move and identify real Luna by two-chime signal; inspect three evidence items before asking Luna; no generic order quiz.
- Starfall: short upper pursuit and longer lower route with historical marker; defer unrelated discoveries until after the epilogue.
No change to approved duo illustration collection or independent finale artwork.

## Verification / release gate
GitHub Actions: https://github.com/claudialeee/morrowwish/actions/runs/46112901387
The rules job and portrait (Chinese) and landscape (English) browser jobs have passed, covering moonleaf crossing, shadow hunt, joint flight, mirror, ledger and star steps. Desktop English job was still running when this brief was recorded. Confirm its successful conclusion before starting the art commission. Browser checkpoint fixtures verify actual game controls, not a full fresh-save playthrough; no commercial quality or production release claim is made.

## Existing artwork reviewed and reused
Source images inspected: canon22-final-art/shadow-cat.webp (existing running cat, keep), forest-landing.webp, lantern-vault.webp, sky-safety-island.webp, sky-cloudfall.webp; mobile-portrait/lantern-vault.webp and starfall-expanse.webp; resonance-world-v2/starfall.webp. Reuse the existing forest bridge/moonleaf, glider, theater, environment paintings, mirror characters and narrative art. No new background, full-screen minigame panel, scene repaint, or decorative board.

## Work: exactly three final transparent WebP assets
Destination directory: public/cat-bond/assets/canon22-final-art/
1. shadow-cat-crouch.webp — 640×640 transparent canvas, hiding/crouching silhouette, tucked paws and low tail. Existing shadow-cat.webp is the sole style/character reference; same muted indigo pigment, paper texture, soft watercolor edge, clear silhouette.
2. shadow-cat-listen.webp — 640×640 transparent canvas, attentive upright pose, ears raised, readable profile and complete silhouette; same palette and style. Chat will mirror the sprite programmatically for the opposite-side response. Do not bake a second cat, light cone, eyes glow or effects into either sprite.
3. star-step-stone.webp — 640×400 transparent canvas, one reusable floating stepping stone, horizontal walkable top seen in slight three-quarter perspective, pale warm stone and subtle golden inlaid star, slate/rose side surfaces. Match mobile-portrait/starfall-expanse.webp; no background, text, other stones, baked active glow or beams. Chat controls placement, hit testing, path, highlights, transitions and variants.

All files: final original painted game assets, true alpha (not a checkerboard image), no clipping, no artificial 3D look, no logos, no text, no extra files. Maintain full silhouette and consistent style; do not overwrite existing originals. Keep file sizes practical for mobile.

Work must commit only those three assets to review/starbell-regional-depth-20261127 and report exact SHA, paths, dimensions, transparency and byte sizes. No code modifications, integration, CI, playthrough, deployment, unrelated drawing or redesign. Chat handles all of those separately. Do not start until the desktop verification gate is green.

## Integration acceptance (completed)
Original art commit: 9a71de78e41b6fb54b046fa85fc152f27b9097ff (three WebP files only). Integration source: 05f38a442000089a13e935c7435eecc85fe694f8. Prior complete gameplay gate: https://github.com/claudialeee/morrowwish/actions/runs/46113504351. New rule and targeted actual browser render/interaction gate: https://github.com/claudialeee/morrowwish/actions/runs/46114136724 — all four jobs succeeded. Art-specific browser test decodes PNG-compatible canvas RGBA pixels from WebP, checks dimensions and alpha, observes actual main game canvas drawing all three files, and finishes shadow hunt and star steps on desktop, mobile landscape and mobile portrait. Rendering only; no change to underlying path nodes, proof or rewards. Production publication is a separate gate. No additional Work task.
