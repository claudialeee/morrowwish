# Cat Bond platform release bundle — 2026-11-27
Frozen source: 7637c688dc6efee7145bf6fe46e25f704d57e6fc. This branch intentionally contains no deployment or CI workflows. It is not the website.
- `source/public/cat-bond/`: immutable original 129 files (38749593 bytes), including all 63 native portrait duo paintings. Shared web files also preserved in source/public.
- `approved-covers/`: the three previously approved original JPEG covers; not new gameplay captures. Reuse only after visual check.
- `package-base/`: isolated portal candidate with local paths, no site links or outgoing telemetry, no remote background music, existing SFX, language and fullscreen controls, and pause lifecycle. Original save format unchanged. Not browser-tested. Do not claim portal readiness.
- `export-gamepix.py`: produces ZIP and SHA-256 report locally, no network or paid services. SDK-free candidate only, no monetization integration claim.
- `handoff/`: existing copy, specs and validation tools (unmodified). Use `CAT_BOND_SOURCE=source/public/cat-bond` for itch verification.
- `inventory.json`: exact pinned Git blob IDs and byte lengths for source files and covers.
## Remaining execution
1. Open frozen source locally and verify actual gameplay in both viewports. Fresh native captures only; older scripts that inject inventory/levels or force combat cannot be used for public marketing footage. Record authentic progression, then reuse captures to export all specified media. Verify existing covers visually.
2. Run export-gamepix.py, then preview and inspect browser console. Apply actual GamePix SDK only if needed for monetization; do not fabricate ad events. Use existing GamePix record.
3. Use package-base as the common candidate for Y8 and GameDistribution. Retrieve actual existing SDK IDs, use official platform SDK lifecycle and ad callbacks, test, then export separate ZIPs. Never upload this common candidate as a verified SDK package.
4. CrazyGames: verify exact deployed iframe parity and update existing draft, no review submission. itch.io: verify public Run game iframe before any replacement, preserve existing project.
5. Store final ZIP hashes, fresh media hashes, signed-in draft-save and actual preview evidence. No TinyFish, no paid runs, no production deployment or unrelated regression.
