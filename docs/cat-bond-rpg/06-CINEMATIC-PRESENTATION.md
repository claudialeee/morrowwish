# CAT BOND — THE LAST RESONANCE
## 06 · Cinematic Presentation System
**Version:** 1.0 · 2026-11-24 · Chat 6 implementation contract

## 1. Ownership boundary

Chat 6 owns the visual playback layer: frame presentation, image layers, camera motion, subtitles, sound-effect cues, language refresh, skip, pause and resume.

Chat 4 owns narrative event triggers, story flags, player choices, scene entry/exit conditions and save-state persistence. Chat 2 owns title/save UI. Chat 3 owns world/map exploration. Chat 5 owns Sunlit Garden and progression.

This module does not create or mutate story state. It never decides that a scene has been completed in the campaign. It only reports visual completion through callbacks.

## 2. Integration-safe global

Load `js/cinematic-presentation.js` after the game shell. It exports:

```js
const cinematic = window.CatBondCinematicPresentation.create(
  document.querySelector('[data-catbond-cinematic]'),
  {
    language: () => window.CatBondI18n?.language || document.documentElement.lang || 'zh',
    onComplete: ({ sceneId }) => { /* Chat 4 advances its own story state */ },
    onSkip: ({ sceneId, snapshot }) => { /* Chat 4 decides the skip result */ }
  }
);
```

The global name is deliberately distinct from the existing/parallel `CatBondRpgCinematic` prototype so this branch does not overwrite Chat 2's file or global.

## 3. Scene data contract

```js
{
  id: 'chapter-v/M-03',
  sourceSceneId: 'M-03',
  chapter: 'chapter-v',
  mode: 'auto', // 'auto' or 'manual'
  allowSkip: true,
  title: { zh: '身份揭晓', en: 'The Identity Reveal' },
  frames: [
    {
      id: 'm03-mural',
      image: 'assets/cinematics/chapter-v/m03-mural.svg',
      alt: { zh: '星铃壁画前的两只猫', en: 'Two cats before the Star Bell mural' },
      durationMs: 4200,
      camera: { from: { x: 0, y: 0, scale: 1.02 }, to: { x: -2, y: -1, scale: 1.07 } },
      subtitle: {
        zh: { speaker: '玩家', text: '壁画上的那只猫……是你？' },
        en: { speaker: 'Player', text: 'The cat in the mural… is that you?' }
      },
      layers: [{ image: 'assets/cinematics/fx/mirror-dust.svg', depth: 0.35, opacity: 0.45 }],
      sfx: { src: 'assets/audio/bell-soft.ogg', volume: 0.55 }
    }
  ]
}
```

All image paths are relative to the Cat Bond game route. Scene IDs are namespaced by chapter. The script reuses `E-01` for Emberforge Chapter III and the epilogue; use `chapter-iii/E-01` and `epilogue/E-01` as technical IDs while preserving `sourceSceneId: 'E-01'`.

## 4. Runtime API

- `create(root, options)`: create an isolated presentation instance.
- `register(scene)`: validate and register a scene.
- `play(sceneId, options)`: play from the first frame or a supplied frame index.
- `next()`: continue manually or advance to the next authored frame.
- `pause()` / `resume()`: pause and resume the current frame timer.
- `interrupt()`: pause and return a serializable snapshot.
- `snapshot()`: return scene ID, frame index, elapsed time and pause state.
- `restore(snapshot)`: resume the exact scene/frame without changing narrative state.
- `setLanguage('zh'|'en')`: update the currently visible title, speaker, subtitle and controls immediately.
- `skip()`: stop the visual scene and notify the caller.
- `stop()` / `destroy()`: stop playback or dispose the instance.

The static `validateScene(scene)` helper is available for content tests.

## 5. Visual behavior

- One high-quality authored image per frame, optionally layered with foreground/atmosphere overlays.
- Slow camera pan/zoom and per-layer parallax; no sudden actor teleporting.
- Cross-fade between authored frames, not hard image swaps.
- Subtitles use text nodes, not HTML injection.
- Auto mode advances by `durationMs`; manual mode waits for player input.
- Escape skips only when the scene allows skipping. Space/Enter advances manual scenes.
- Language toggling does not restart the current frame or reset the timer.
- SFX are optional and triggered only during an explicit play interaction; this module adds no background music.
- `prefers-reduced-motion` disables camera interpolation and uses still frames.
- Portrait and landscape mobile layouts keep subtitles and controls within safe areas.

## 6. Required integration sequence

1. Chat 4 defines a canon scene event and story-state gate.
2. Chat 4 passes the namespaced scene ID to this renderer.
3. Renderer plays visual frames and calls `onComplete` or `onSkip`.
4. Chat 4 updates its per-slot story state and decides the next scene/action.
5. If interrupted, Chat 4 stores the returned snapshot inside its own per-slot save data and later calls `restore(snapshot)`.

Do not store campaign progression in `localStorage` from this renderer. Do not create a second cloud-save path. Do not call Chat 2 save APIs directly.

## 7. Acceptance

A scene is not accepted because the API returns successfully. Verify actual rendered images, timing, camera movement, subtitle localization, keyboard/touch controls, skip, pause/resume and portrait/landscape crops in a real browser before production integration.


## Supervisor contract v1 — integration override
Integration target: rpg/integration. Only scoped Chat 6 files proposed. No changes to shared entry, game, state, i18n, package or CI. Chat 2 invokes installGameCinematicHost with slot-scoped checkpointStore {read(),write(value)} implementing its own existing save/rollback. Chat 4 supplies transactional runtime and canonical campaign and owns eligibility and finish(). Pass rendererFactory from CatBondCinematicPresentation.create and shared MorrowwishI18n language callbacks. Rejected SVGs archived at 4e42ac8ec8ac23215154462c5e9f62bde589b46a; excluded from this branch. Portrait is an unapproved candidate; no actual normal-flow cinematic accepted yet. Missing approved shots fail closed without story evidence. This section supersedes conflicting older examples.
