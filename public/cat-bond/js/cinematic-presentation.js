/* Cat Bond — The Last Resonance
 * Independent cinematic presentation layer.
 * Owns visual playback only; story events and per-slot persistence belong to Chat 4.
 */
(() => {
  'use strict';

  const STYLE_ID = 'cbcp-presentation-styles';
  const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));
  const copy = value => JSON.parse(JSON.stringify(value));
  const localized = (value, language) => {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    return value[language] ?? value.en ?? value.zh ?? '';
  };
  const prefersReducedMotion = () => {
    try { return !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches; }
    catch (_) { return false; }
  };

  const CSS = `
.cbcp-root{position:relative;isolation:isolate;width:100%;height:100%;min-height:260px;color:#f2e8d5;background:#101d28;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
.cbcp-root[hidden]{display:none!important}
.cbcp-shell{position:relative;display:grid;grid-template-rows:minmax(0,1fr) auto;width:100%;height:100%;min-height:260px;overflow:hidden;background:#101d28}
.cbcp-stage{position:relative;isolation:isolate;overflow:hidden;min-height:0;aspect-ratio:16/9;background:radial-gradient(ellipse at 50% 42%,#52616a 0%,#263744 54%,#101d28 100%)}
.cbcp-art,.cbcp-layer{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;will-change:transform,opacity;transform-origin:center;transition:transform 5600ms cubic-bezier(.2,.55,.24,1),opacity 520ms ease}
.cbcp-layer{pointer-events:none}
.cbcp-vignette{position:absolute;inset:0;z-index:4;pointer-events:none;background:linear-gradient(0deg,rgba(6,15,22,.83),transparent 36%,rgba(6,15,22,.14) 100%),radial-gradient(ellipse at center,transparent 42%,rgba(5,12,19,.42) 100%)}
.cbcp-topline{position:absolute;z-index:6;top:clamp(10px,2.2vw,26px);left:clamp(12px,3vw,36px);right:clamp(12px,3vw,36px);display:flex;align-items:flex-start;justify-content:space-between;gap:14px;pointer-events:none}
.cbcp-heading{max-width:min(70%,720px);text-shadow:0 2px 18px rgba(0,0,0,.65)}
.cbcp-kicker{display:block;margin-bottom:7px;color:#e0c18c;font:600 10px/1.3 Georgia,serif;letter-spacing:.22em;text-transform:uppercase}
.cbcp-title{margin:0;color:#fff0d5;font:600 clamp(21px,3.2vw,42px)/1.1 Georgia,"Noto Serif SC",serif;letter-spacing:.02em}
.cbcp-tools{display:flex;gap:7px;pointer-events:auto}
.cbcp-tool,.cbcp-action{min-height:40px;padding:9px 13px;border:1px solid rgba(212,184,132,.65);border-radius:5px;background:rgba(18,34,43,.78);color:#f6e9d2;font:600 12px/1.2 system-ui,sans-serif;cursor:pointer;backdrop-filter:blur(8px)}
.cbcp-tool:hover,.cbcp-action:hover{background:rgba(49,71,78,.94)}
.cbcp-tool:focus-visible,.cbcp-action:focus-visible{outline:2px solid #f0d29a;outline-offset:3px}
.cbcp-subtitle-wrap{position:absolute;z-index:7;left:50%;bottom:clamp(22px,5.2vw,66px);width:min(900px,calc(100% - 36px));transform:translateX(-50%);text-align:center;text-shadow:0 2px 14px #06111a}
.cbcp-speaker{display:block;margin-bottom:7px;color:#e2c28f;font:600 12px/1.3 Georgia,"Noto Serif SC",serif;letter-spacing:.08em}
.cbcp-subtitle{margin:0;color:#fff6e8;font:500 clamp(15px,2vw,22px)/1.6 system-ui,"Noto Sans SC",sans-serif;white-space:pre-line}
.cbcp-footer{z-index:8;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 14px calc(10px + env(safe-area-inset-bottom,0px));background:linear-gradient(180deg,#182a35,#101d28);border-top:1px solid rgba(181,140,85,.35)}
.cbcp-progress{display:flex;align-items:center;gap:6px;min-width:0;flex:1}
.cbcp-progress-dot{width:6px;height:6px;border-radius:50%;background:#64747a;transition:background .2s,transform .2s}
.cbcp-progress-dot.is-active{background:#d8b57d;transform:scale(1.35)}
.cbcp-footer-actions{display:flex;gap:8px}
.cbcp-action-primary{background:linear-gradient(180deg,#8d7048,#6b5438);border-color:#d2b17b;color:#fff2dc}
.cbcp-status{position:absolute;z-index:9;top:50%;left:50%;transform:translate(-50%,-50%);padding:9px 14px;border:1px solid #a98b5e;border-radius:4px;background:rgba(12,24,31,.9);color:#f5e8d3;font-size:12px}
.cbcp-crossfade{animation:cbcp-fade-in .48s ease both}
@keyframes cbcp-fade-in{from{opacity:0}to{opacity:1}}
@media(max-width:680px){
 .cbcp-root,.cbcp-shell{min-height:240px}
 .cbcp-stage{aspect-ratio:4/3;min-height:0}
 .cbcp-heading{max-width:64%}
 .cbcp-kicker{font-size:9px;letter-spacing:.14em}
 .cbcp-title{font-size:clamp(19px,5.2vw,28px)}
 .cbcp-tool,.cbcp-action{min-height:44px;padding:9px 10px;font-size:11px}
 .cbcp-tools{gap:5px}
 .cbcp-subtitle-wrap{bottom:16px;width:calc(100% - 28px)}
 .cbcp-subtitle{font-size:clamp(14px,3.8vw,18px);line-height:1.48}
 .cbcp-footer{padding:8px 10px calc(8px + env(safe-area-inset-bottom,0px))}
}
@media(max-height:460px) and (orientation:landscape){
 .cbcp-stage{aspect-ratio:auto}
 .cbcp-title{font-size:clamp(18px,4.5vh,27px)}
 .cbcp-subtitle-wrap{bottom:10px}
 .cbcp-subtitle{font-size:clamp(13px,3vh,17px);line-height:1.35}
 .cbcp-footer{padding:5px 9px}
 .cbcp-tool,.cbcp-action{min-height:36px;padding:7px 10px}
}
@media(prefers-reduced-motion:reduce){
 .cbcp-art,.cbcp-layer{transition:none!important;will-change:auto}
 .cbcp-crossfade{animation:none!important}
}
`;

  function validateScene(scene) {
    if (!scene || typeof scene !== 'object') throw new TypeError('Scene must be an object');
    if (typeof scene.id !== 'string' || !scene.id.includes('/')) throw new TypeError('Scene id must be namespaced, e.g. chapter-v/M-03');
    if (!Array.isArray(scene.frames) || scene.frames.length === 0) throw new TypeError('Scene must contain at least one authored frame');
    scene.frames.forEach((frame, index) => {
      if (!frame || typeof frame.image !== 'string' || !frame.image.trim()) {
        throw new TypeError(`Frame ${index} requires an image path`);
      }
      if (frame.durationMs != null && (!Number.isFinite(frame.durationMs) || frame.durationMs < 0)) {
        throw new TypeError(`Frame ${index} has an invalid durationMs`);
      }
    });
    return true;
  }

  class Presentation {
    constructor(root, options = {}) {
      this.root = typeof root === 'string' ? document.querySelector(root) : root;
      if (!this.root) throw new Error('Cinematic root element was not found');
      this.options = options;
      this.language = options.language || 'zh';
      this.languageProvider = typeof options.language === 'function' ? options.language : null;
      this.scenes = new Map();
      this.scene = null;
      this.frameIndex = 0;
      this.frameElapsedMs = 0;
      this.frameStartedAt = 0;
      this.timer = null;
      this.paused = false;
      this.destroyed = false;
      this.audio = null;
      this._onKeyDown = event => this.handleKeyDown(event);
      this._onVisibility = () => {
        if (document.hidden && this.scene && !this.paused) this.pause();
      };
      this.injectStyles();
      this.mount();
      document.addEventListener('keydown', this._onKeyDown);
      document.addEventListener('visibilitychange', this._onVisibility);
    }

    injectStyles() {
      if (document.getElementById(STYLE_ID)) return;
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = CSS;
      document.head.appendChild(style);
    }

    mount() {
      this.root.classList.add('cbcp-root');
      this.root.hidden = true;
      this.root.innerHTML = `
        <div class="cbcp-shell" role="dialog" aria-modal="true" aria-label="Cat Bond cinematic">
          <div class="cbcp-stage">
            <div class="cbcp-art-stack"></div>
            <div class="cbcp-vignette"></div>
            <div class="cbcp-topline">
              <div class="cbcp-heading"><span class="cbcp-kicker"></span><h2 class="cbcp-title"></h2></div>
              <div class="cbcp-tools">
                <button class="cbcp-tool cbcp-language" type="button"></button>
                <button class="cbcp-tool cbcp-pause" type="button"></button>
                <button class="cbcp-tool cbcp-skip" type="button"></button>
              </div>
            </div>
            <div class="cbcp-subtitle-wrap" aria-live="polite">
              <span class="cbcp-speaker"></span><p class="cbcp-subtitle"></p>
            </div>
          </div>
          <div class="cbcp-footer">
            <div class="cbcp-progress" aria-hidden="true"></div>
            <div class="cbcp-footer-actions">
              <button class="cbcp-action cbcp-continue cbcp-action-primary" type="button"></button>
            </div>
          </div>
        </div>`;
      this.nodes = {
        stack: this.root.querySelector('.cbcp-art-stack'),
        kicker: this.root.querySelector('.cbcp-kicker'),
        title: this.root.querySelector('.cbcp-title'),
        speaker: this.root.querySelector('.cbcp-speaker'),
        subtitle: this.root.querySelector('.cbcp-subtitle'),
        language: this.root.querySelector('.cbcp-language'),
        pause: this.root.querySelector('.cbcp-pause'),
        skip: this.root.querySelector('.cbcp-skip'),
        continue: this.root.querySelector('.cbcp-continue'),
        progress: this.root.querySelector('.cbcp-progress')
      };
      this.nodes.language.addEventListener('click', () => this.setLanguage(this.language === 'zh' ? 'en' : 'zh'));
      this.nodes.pause.addEventListener('click', () => this.paused ? this.resume() : this.pause());
      this.nodes.skip.addEventListener('click', () => this.skip());
      this.nodes.continue.addEventListener('click', () => this.next());
      this.updateControls();
    }

    currentLanguage() {
      const supplied = this.languageProvider?.();
      const candidate = supplied || this.language;
      return String(candidate).toLowerCase().startsWith('en') ? 'en' : 'zh';
    }

    register(scene) {
      validateScene(scene);
      this.scenes.set(scene.id, scene);
      return this;
    }

    registerAll(scenes) {
      (scenes || []).forEach(scene => this.register(scene));
      return this;
    }

    play(sceneId, options = {}) {
      if (this.destroyed) throw new Error('Cinematic instance has been destroyed');
      const scene = typeof sceneId === 'object' ? sceneId : this.scenes.get(sceneId);
      if (!scene) throw new Error(`Unknown cinematic scene: ${sceneId}`);
      validateScene(scene);
      this.clearTimer();
      this.scene = scene;
      this.frameIndex = clamp(options.frameIndex, 0, scene.frames.length - 1);
      this.frameElapsedMs = Math.max(0, Number(options.elapsedMs) || 0);
      this.paused = !!options.paused;
      this.root.hidden = false;
      this.renderFrame();
      if (!this.paused) this.startTimer();
      return this;
    }

    renderFrame() {
      if (!this.scene) return;
      const frame = this.scene.frames[this.frameIndex];
      const lang = this.currentLanguage();
      this.nodes.stack.innerHTML = '';
      const image = document.createElement('img');
      image.className = 'cbcp-art cbcp-crossfade';
      image.src = frame.image;
      image.alt = localized(frame.alt, lang);
      image.draggable = false;
      image.decoding = 'async';
      image.loading = 'eager';
      this.applyCamera(image, frame.camera);
      this.nodes.stack.appendChild(image);

      (frame.layers || []).forEach(layer => {
        if (!layer?.image) return;
        const node = document.createElement('img');
        node.className = 'cbcp-layer';
        node.src = layer.image;
        node.alt = '';
        node.setAttribute('aria-hidden', 'true');
        node.draggable = false;
        node.style.opacity = String(clamp(layer.opacity ?? 1, 0, 1));
        node.style.mixBlendMode = layer.blend || 'normal';
        this.applyCamera(node, frame.camera, Number(layer.depth) || 0);
        this.nodes.stack.appendChild(node);
      });

      this.nodes.kicker.textContent = localized(this.scene.kicker, lang) || localized(this.scene.chapter, lang);
      this.nodes.title.textContent = localized(this.scene.title, lang);
      this.renderSubtitle();
      this.renderProgress();
      this.updateControls();
      this.playSfx(frame.sfx);
      this.options.onFrameChange?.({
        sceneId: this.scene.id,
        frameIndex: this.frameIndex,
        frameId: frame.id || null
      });
    }

    applyCamera(node, camera, depth = 1) {
      const reduced = prefersReducedMotion();
      const from = camera?.from || { x: 0, y: 0, scale: 1.02 };
      const to = camera?.to || { x: 0, y: 0, scale: 1.06 };
      const factor = reduced ? 0 : clamp(depth, 0, 1.5);
      node.style.transform = `translate3d(${Number(from.x || 0) * factor}%,${Number(from.y || 0) * factor}%,0) scale(${reduced ? 1 : Number(from.scale || 1.02)})`;
      if (!reduced) requestAnimationFrame(() => {
        if (!node.isConnected) return;
        node.style.transform = `translate3d(${Number(to.x || 0) * factor}%,${Number(to.y || 0) * factor}%,0) scale(${Number(to.scale || 1.06)})`;
      });
    }

    renderSubtitle() {
      const frame = this.scene?.frames?.[this.frameIndex];
      const sub = localized(frame?.subtitle, this.currentLanguage());
      const speaker = typeof sub === 'object' ? sub.speaker : '';
      const line = typeof sub === 'object' ? sub.text : sub;
      this.nodes.speaker.textContent = speaker || '';
      this.nodes.subtitle.textContent = line || '';
      this.nodes.speaker.hidden = !speaker;
      this.nodes.subtitle.hidden = !line;
    }

    renderProgress() {
      const count = this.scene?.frames?.length || 0;
      this.nodes.progress.innerHTML = '';
      for (let i = 0; i < count; i += 1) {
        const dot = document.createElement('span');
        dot.className = 'cbcp-progress-dot' + (i === this.frameIndex ? ' is-active' : '');
        this.nodes.progress.appendChild(dot);
      }
    }

    updateControls() {
      const lang = this.currentLanguage();
      if (!this.nodes) return;
      this.nodes.language.textContent = lang === 'zh' ? 'EN' : '中文';
      this.nodes.language.setAttribute('aria-label', lang === 'zh' ? 'Switch to English' : '切换到中文');
      this.nodes.pause.textContent = this.paused ? (lang === 'zh' ? '继续播放' : 'Resume') : (lang === 'zh' ? '暂停' : 'Pause');
      this.nodes.skip.textContent = lang === 'zh' ? '跳过' : 'Skip';
      this.nodes.skip.hidden = !this.scene?.allowSkip;
      const manual = this.scene?.mode === 'manual' || !(Number(this.scene?.frames?.[this.frameIndex]?.durationMs) > 0);
      this.nodes.continue.textContent = this.frameIndex < (this.scene?.frames?.length || 1) - 1
        ? (lang === 'zh' ? '继续' : 'Continue')
        : (lang === 'zh' ? '完成' : 'Finish');
      this.nodes.continue.hidden = !manual && this.scene?.mode !== 'manual';
    }

    startTimer(remainingOverride) {
      this.clearTimer();
      if (!this.scene || this.paused || this.scene.mode === 'manual') return;
      const duration = Number(this.scene.frames[this.frameIndex]?.durationMs) || 0;
      if (duration <= 0) return;
      const remaining = remainingOverride == null ? Math.max(0, duration - this.frameElapsedMs) : Math.max(0, remainingOverride);
      this.frameStartedAt = performance.now();
      this.timer = window.setTimeout(() => this.next(), remaining);
    }

    clearTimer() {
      if (this.timer != null) window.clearTimeout(this.timer);
      this.timer = null;
    }

    next() {
      if (!this.scene || this.paused) return;
      this.clearTimer();
      if (this.frameIndex < this.scene.frames.length - 1) {
        this.frameIndex += 1;
        this.frameElapsedMs = 0;
        this.renderFrame();
        this.startTimer();
      } else {
        const completed = this.scene;
        this.scene = null;
        this.root.hidden = true;
        this.options.onComplete?.({ sceneId: completed.id, sourceSceneId: completed.sourceSceneId || null });
      }
    }

    pause() {
      if (!this.scene || this.paused) return this.snapshot();
      const duration = Number(this.scene.frames[this.frameIndex]?.durationMs) || 0;
      if (duration > 0 && this.frameStartedAt) {
        this.frameElapsedMs = clamp(this.frameElapsedMs + (performance.now() - this.frameStartedAt), 0, duration);
      }
      this.clearTimer();
      this.paused = true;
      this.updateControls();
      return this.snapshot();
    }

    resume() {
      if (!this.scene || !this.paused) return this;
      this.paused = false;
      this.updateControls();
      const duration = Number(this.scene.frames[this.frameIndex]?.durationMs) || 0;
      this.startTimer(Math.max(0, duration - this.frameElapsedMs));
      return this;
    }

    snapshot() {
      if (!this.scene) return null;
      return {
        sceneId: this.scene.id,
        frameIndex: this.frameIndex,
        elapsedMs: Math.round(this.frameElapsedMs + (!this.paused && this.frameStartedAt ? performance.now() - this.frameStartedAt : 0)),
        paused: this.paused
      };
    }

    interrupt() {
      const snapshot = this.pause();
      this.options.onInterrupt?.(snapshot);
      return snapshot;
    }

    restore(snapshot) {
      if (!snapshot?.sceneId) throw new TypeError('A valid cinematic snapshot is required');
      this.play(snapshot.sceneId, {
        frameIndex: snapshot.frameIndex,
        elapsedMs: snapshot.elapsedMs,
        paused: snapshot.paused
      });
      return this;
    }

    setLanguage(language) {
      this.language = String(language).toLowerCase().startsWith('en') ? 'en' : 'zh';
      if (this.scene) {
        this.nodes.title.textContent = localized(this.scene.title, this.currentLanguage());
        this.nodes.kicker.textContent = localized(this.scene.kicker, this.currentLanguage()) || localized(this.scene.chapter, this.currentLanguage());
        this.renderSubtitle();
      }
      this.updateControls();
      return this;
    }

    playSfx(sfx) {
      if (!sfx?.src || typeof Audio === 'undefined') return;
      try {
        this.audio?.pause();
        this.audio = new Audio(sfx.src);
        this.audio.volume = clamp(sfx.volume ?? 0.6, 0, 1);
        const result = this.audio.play();
        result?.catch?.(() => {});
      } catch (_) { /* Audio is optional; visual playback must continue. */ }
    }

    skip() {
      if (!this.scene || !this.scene.allowSkip) return false;
      const skipped = this.scene;
      const snapshot = this.snapshot();
      this.clearTimer();
      this.scene = null;
      this.root.hidden = true;
      this.options.onSkip?.({
        sceneId: skipped.id,
        sourceSceneId: skipped.sourceSceneId || null,
        snapshot
      });
      return true;
    }

    stop() {
      this.clearTimer();
      this.scene = null;
      this.paused = false;
      this.frameElapsedMs = 0;
      this.root.hidden = true;
      this.audio?.pause();
      return this;
    }

    handleKeyDown(event) {
      if (!this.scene || this.root.hidden) return;
      if (event.target && /INPUT|TEXTAREA|SELECT|BUTTON/.test(event.target.tagName)) return;
      if (event.key === 'Escape') {
        if (this.scene.allowSkip) { event.preventDefault(); this.skip(); }
      } else if (event.key === ' ' || event.key === 'Enter') {
        if (this.scene.mode === 'manual') { event.preventDefault(); this.next(); }
      }
    }

    destroy() {
      if (this.destroyed) return;
      this.stop();
      document.removeEventListener('keydown', this._onKeyDown);
      document.removeEventListener('visibilitychange', this._onVisibility);
      this.root.innerHTML = '';
      this.root.classList.remove('cbcp-root');
      this.destroyed = true;
    }
  }

  window.CatBondCinematicPresentation = {
    version: '1.0.0',
    create: (root, options) => new Presentation(root, options),
    validateScene
  };
})();
