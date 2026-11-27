# Starbell — mobile portrait engineering candidate
Status: implementation candidate; NOT accepted, NOT deployed. Base ede9fecbe0dad83dbcaae785201f4165523b466b.
The new portrait stylesheet is loaded after the shared visual styles. It reserves independent areas for the chapter title, uncropped 16:9 logical world, and scrollable controls. The original scene coordinates, movement, hit tests, save logic, and story are unchanged. The atlas and regional exploration action rails remain accessible; optional zoom and follow are explicit, and Overview restores the full painting. Chase uses a fit canvas instead of cover. Story dialogue separates the portrait from the text; selected chapter backgrounds preserve the whole painting.
This is a deliberate engineering baseline, not the finished mobile aesthetic. In particular, the original landscape painting is still a short horizontal field on a phone. Do not claim a premium portrait scene or full mobile playthrough based on this patch.

## Chat acceptance before Work
- Run npm run check, then scripts/cat-bond-layout-acceptance.mjs against isolated candidate, save screenshots at 320x568, 390x844 and 430x932, plus existing desktop/landscape.
- New fixture assertions require all atlas markers visible before panning, no pan at 1x, real touch to enter a region, non-overlapping art/controls, explicit zoom and overview reset. Synthetic postgame fixture is layout evidence only.
- Real fresh Chinese and English portrait campaign; verify prologue/garden, six regions, pursuit, bridge, shadow, flight, mirror, star paths, three-phase finale and epilogue; include actual touch, no required manual pan, 44px controls, no clipped text or blocked overlays. Inspect battle HUD/VFX, garden, title and cinematic rendering separately. Verify orientation change, zoom state, saves, and touch input.
- Fix failures in Chat. Do not weaken tests, declare release, or deploy main. Do not spend Work quota on routine code or QA.
## Work scope only after engineering gate
- Use actual high-resolution game screenshots from the verified SHA to identify specific hero scenes needing mobile-first painted compositions. No universal crop, blur, stretch, or synthetic replacement. Preserve authored paths and anchors unless a tested layout contract accompanies the change.
- Prioritize emotionally compelling story moments, the garden, town and six regional vistas; only commission a new painting where the real portrait frame fails. A separate mobile art layer must preserve navigation and landscape assets. No speculative whole-game rework.
- Verify full-body cats and expressions, story readability and visual hierarchy on real 9:16 screens. Deliver asset paths and approved portrait compositions in an art branch. Chat owns integration, tests and deployment.
- Record real vertical gameplay footage only from the verified build. The story and cats are the hook, not a minigame montage.
