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
.cbcp-stage{position:relative;isolation:isolate;overflow:hidden;min-height:0;background:radial-gradient(ellipse at 50% 42%,#52616a 0%,#263744 54%,#101d28 100%)}
.cbcp-art,.cbcp-layer{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;object-position:center;will-change:transform,opacity;transform-origin:center;transition:transform 5600ms cubic-bezier(.2,.55,.24,1),opacity 520ms ease}
.cbcp-art-stack{position:absolute;inset:0;overflow:hidden}.cbcp-layer{pointer-events:none}
.cbcp-stage::before{content:'';position:absolute;inset:-15px;background:var(--cbcp-backplate,none) center/cover no-repeat;filter:blur(14px) brightness(.52);opacity:.85;pointer-events:none}
.cbcp-fx{position:absolute;inset:0;width:100%;height:100%;z-index:3;pointer-events:none}
.cbcp-subtitle-wrap{padding:12px 18px;background:linear-gradient(90deg,transparent,rgba(7,14,24,.78) 16%,rgba(7,14,24,.78) 84%,transparent)}
@media(orientation:portrait) and (max-width:680px){
  .cbcp-stage::before{content:'';position:absolute;inset:-15px;background:var(--cbcp-backplate,none) center/cover no-repeat;filter:blur(14px) brightness(.52);opacity:.85;pointer-events:none}
 .cbcp-stage .cbcp-art-stack{position:absolute;inset:12% 0 19%;overflow:hidden}
 .cbcp-stage .cbcp-art{object-fit:contain;background:transparent}
 .cbcp-stage .cbcp-subtitle-wrap{bottom:3%;padding:9px 6px}
}
@media(prefers-reduced-motion:reduce){.cbcp-fx{display:none}}

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
  .cbcp-stage{aspect-ratio:auto;min-height:0}
 .cbcp-art,.cbcp-layer{object-fit:contain;background:#101d28}
 .cbcp-topline{flex-wrap:wrap}
 .cbcp-heading{max-width:100%}
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
 .cbcp-tool,.cbcp-action{min-height:44px;padding:7px 10px}
}
@media(prefers-reduced-motion:reduce){
 .cbcp-art,.cbcp-layer{transition:none!important;will-change:auto}
 .cbcp-crossfade{animation:none!important}
}
`;

  function validateScene(scene) {
    if (!scene || typeof scene !== 'object') throw new TypeError('Scene must be an object');
    if (typeof scene.id !== 'string' || !/^(prologue|harbor|forest|forge|sky|library|starfall|finale|epilogue):[A-Z]-\d{2}$/.test(scene.id)) throw new TypeError('Scene id must match Chat 4, e.g. library:M-03');
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
      this.language = typeof options.language === 'string' ? options.language : 'zh';
      this.languageProvider = typeof options.language === 'function' ? options.language : null;
      this.forcedLanguage = null;
      this.scenes = new Map();
      this.scene = null;
      this.frameIndex = 0;
      this.frameElapsedMs = 0;
      this.frameStartedAt = 0;
      this.timer = null;
      this.paused = false;
      this.destroyed = false;
      this.audio = null;
      this.renderToken = 0;
      this.activeImage = null;
      this.frameReady = false;
      this.fxRAF=0;
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
            <canvas class="cbcp-fx" aria-hidden="true"></canvas><div class="cbcp-vignette"></div>
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
        stage:this.root.querySelector('.cbcp-stage'),
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
      this.nodes.language.addEventListener('click', () => this.requestLanguage(this.currentLanguage() === 'zh' ? 'en' : 'zh'));
      this.nodes.pause.addEventListener('click', () => this.paused ? this.resume() : this.pause());
      this.nodes.skip.addEventListener('click', () => this.skip());
      this.nodes.continue.addEventListener('click', () => this.next());
      this.updateControls();
    }

    currentLanguage() {
      const supplied = this.forcedLanguage || this.languageProvider?.();
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
      this.stop();
      this.scene = scene;
      this.frameIndex = clamp(options.frameIndex, 0, scene.frames.length - 1);
      this.frameElapsedMs = Math.max(0, Number(options.elapsedMs) || 0);
      this.paused = !!options.paused;
      this.root.hidden = false;
      // Controls must reflect restored pause state before asynchronous image decoding.
      this.updateControls();
      this.renderFrame();
      return this;
    }

    renderFrame() {
      if (!this.scene) return;
      const frame = this.scene.frames[this.frameIndex];
      const lang = this.currentLanguage();
      const token = ++this.renderToken;
      this.frameReady = false;
      this.root.dataset.ready='false';
      this.updateControls();
      this.nodes.continue.disabled = true;
      const fail = () => {
        if (token !== this.renderToken || !this.scene) return;
        const sceneId = this.scene.id;
        this.stop();
        this.options.onError?.({sceneId, reason:'image-load-failed', image:frame.image});
      };
      const ready = () => {
        if (token !== this.renderToken || !this.scene) return;
        this.frameReady = true;
        this.root.dataset.ready='true';this.root.dataset.frameId=frame.id||'';
        this.nodes.kicker.textContent = localized(frame.kicker||this.scene.kicker, this.currentLanguage()) || localized(this.scene.chapter, this.currentLanguage());
        this.nodes.title.textContent = localized(this.scene.title, this.currentLanguage());
        this.renderSubtitle();
        this.renderProgress();
        this.updateControls();
        this.nodes.continue.disabled = false;
        if(this.activeEffect!==frame.effect||this.activeEffectImage!==frame.image){this.activeEffect=frame.effect;this.activeEffectImage=frame.image;if(!this.paused)this.playEffect(frame.effect,frame);}
        if(!this.paused)this.playSfx(frame.sfx);
        this.startAtmosphere();
        this.options.onFrameChange?.({sceneId:this.scene.id,frameIndex:this.frameIndex,frameId:frame.id||null});
        if (!this.paused) this.startTimer();
        this.options.onCheckpoint?.(this.snapshot());
      };
      // A subtitle change on the same authored shot must not restart zoom or fade.
      if (this.activeImage === frame.image && this.nodes.stack.querySelector('.cbcp-art')) { ready(); return; }
      const previous = Array.from(this.nodes.stack.children);
      const image = document.createElement('img');
      image.className = 'cbcp-art';
      image.alt = localized(frame.alt, lang);
      image.draggable = false;
      image.decoding = 'async';
      image.style.opacity = '0';
      image.style.objectPosition = frame.focus || 'center';
      image.addEventListener('error', fail, {once:true});
      image.addEventListener('load', async () => {
        try { await image.decode?.(); } catch (_) { fail(); return; }
        if (token !== this.renderToken || !this.scene) { image.remove(); return; }
        this.activeImage = frame.image;
        this.nodes.stage.style.setProperty('--cbcp-backplate',`url("${frame.image}")`);
        this.applyCamera(image, frame.camera, 1, frame.shotDurationMs||frame.durationMs, frame.transitionMs, (frame.shotOffsetMs||0)+this.frameElapsedMs);
        requestAnimationFrame(() => {
          if (token !== this.renderToken) return;
          // Never spend the first painted shot (or a restored paused shot) behind a blank fade.
          if(!previous.length||this.paused)image.style.transitionDuration='0ms';
          image.style.opacity = '1';
          for (const node of previous) {
            node.style.opacity = '0';
            window.setTimeout(() => node.remove(), Math.max(980,Number(frame.transitionMs)||0));
          }
        });
        for (const layer of frame.layers || []) {
          if (!layer.image) continue;
          const node = document.createElement('img');
          node.className = 'cbcp-layer';
          node.alt = '';
          node.setAttribute('aria-hidden','true');
          node.style.opacity = String(clamp(layer.opacity ?? 1,0,1));
          node.style.mixBlendMode = layer.blend || 'normal';
          node.src = layer.image;
          this.applyCamera(node,frame.camera,Number(layer.depth)||0,frame.durationMs,frame.transitionMs);
          this.nodes.stack.appendChild(node);
        }
        ready();
      }, {once:true});
      this.nodes.stack.appendChild(image);
      image.src = frame.image;
    }

    applyCamera(node, camera, depth = 1, durationMs = 5600, transitionMs = 520, offset=0) {
      const reduced = prefersReducedMotion();
      const from = camera?.from || { x: 0, y: 0, scale: 1.02 };
      const to = camera?.to || { x: 0, y: 0, scale: 1.06 };
      const factor = reduced ? 0 : clamp(depth, 0, 1.5);
      node.style.transition = `opacity ${clamp(transitionMs ?? 520, 320, 1000)}ms ease`;
      const transform=p=>{const scale=reduced?1:Math.max(.94,Math.min(1,Number(p.scale||1)));const bound=(1-scale)*50,clamp=v=>Math.max(-bound,Math.min(bound,v));return `translate3d(${clamp(Number(p.x||0)*factor)}%,${clamp(Number(p.y||0)*factor)}%,0) scale(${scale})`;};
      node.style.transform=transform(to);
      if(!reduced&&node.animate){
        const animation=node.animate([{transform:transform(from)},{transform:transform(to)}],{duration:Math.max(1200,durationMs||5600),fill:'both',easing:'cubic-bezier(.2,.55,.24,1)'});
        animation.currentTime=Math.min(offset,Math.max(1200,durationMs||5600));
        if(this.paused)animation.pause();
      }
    }

    playEffect(effect,frame){
      // All cinematic cues share the RPG audio director and sound-volume controls.
      const director=window.MorrowwishMusic;
      const cue=({sanctuary:'sanctuary',impact:'impact',blackout:'impact',seal:'seal',seasons:'seasons',memory:'memory'})[effect];
      if(cue&&director?.cue){director.cue(cue,frame.note);return;}
      const audio=window.MorrowwishAudio;
      if(effect==='sanctuary')audio?.note?.(frame.note,.7,.13);
      if(effect==='impact'||effect==='blackout')audio?.note?.(196,.7,.16);
      if(effect==='impact')audio?.effect?.('discover');
      if(effect==='seal')audio?.note?.(196,.35,.15);
      if(effect==='seasons')audio?.note?.(440,.65,.15);
    }

    startAtmosphere(){
      if(this.fxRAF||this.paused||prefersReducedMotion()||!this.scene?.frames[this.frameIndex]?.effect)return;
      const canvas=this.root.querySelector('.cbcp-fx');
      const ctx=canvas?.getContext('2d');
      if(!ctx)return;
      const draw=()=>{
        this.fxRAF=0;
        if(!this.scene||this.paused)return;
        const frame=this.scene.frames[this.frameIndex];
        if(!frame.effect)return;
        const w=Math.max(1,Math.round(canvas.clientWidth)),h=Math.max(1,Math.round(canvas.clientHeight));
        if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
        ctx.clearRect(0,0,w,h);
        const elapsed=(frame.shotOffsetMs||0)+this.frameElapsedMs+(this.frameStartedAt?performance.now()-this.frameStartedAt:0);
        const p=clamp(elapsed/(frame.shotDurationMs||frame.durationMs||1),0,1),t=elapsed/1000;
        const glow=(x,y,r,color)=>{const g=ctx.createRadialGradient(x,y,0,x,y,Math.max(1,r));g.addColorStop(0,color);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(0,0,w,h)};
        const seed=i=>((Math.sin(i*97.17+4.71)*43758.54)%1+1)%1;
        const particles=(count,color,speed,down=false)=>{
          ctx.fillStyle=color;
          for(let i=0;i<count;i++){const x=((seed(i)*w+Math.sin(t*.6+i)*15+w)%w),y=((seed(i+99)*h+(down?1:-1)*t*speed)%h+h)%h;
            ctx.globalAlpha=.18+.55*seed(i+55);ctx.beginPath();ctx.ellipse(x,y,1+2*seed(i+21),down?3:1+2*seed(i+22),0,0,Math.PI*2);ctx.fill();}
          ctx.globalAlpha=1;
        };
        if(frame.effect==='sanctuary'){glow(w*.5,h*.46,w*.42,'rgba(247,211,139,'+(.05+.08*Math.sin(p*Math.PI))+')');particles(15,'#fce3a2',12);}
        else if(frame.effect==='impact'){
          // Six sanctuary glows answer in order; then the falling star strikes the bell.
          const sites=[[.53,.30],[.61,.24],[.70,.28],[.81,.38],[.90,.31],[.96,.43]];
          sites.forEach(([x,y],i)=>{const strength=Math.max(0,1-Math.abs(p*9-i)*.85);glow(x*w,y*h,w*.045,'rgba(255,205,113,'+strength*.8+')')});
          const travel=clamp((p-.35)/.32,0,1);
          if(p>.35&&p<.69){ctx.strokeStyle='rgba(255,220,165,.9)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(w*(.93-.66*travel),h*(.02+.38*travel));ctx.lineTo(w*(1.04-.66*travel),h*(-.05+.38*travel));ctx.stroke()}
          if(p>.67){const k=(p-.67)/.33;glow(w*.28,h*.43,w*(.10+k*.75),'rgba(255,220,174,'+Math.max(0,.85-k)+')');ctx.strokeStyle='rgba(238,201,144,'+(1-k)*.65+')';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(w*.28,h*.43,w*(.03+k*.7),h*(.02+k*.38),0,0,Math.PI*2);ctx.stroke();}
          particles(36,'#ffdba4',20);
        }else if(frame.effect==='blackout'){
          const g=ctx.createLinearGradient(0,0,w,0);g.addColorStop(0,'rgba(12,19,43,'+p*.74+')');g.addColorStop(1,'rgba(37,24,65,'+p*.4+')');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
          for(let i=0;i<4;i++){ctx.strokeStyle='rgba(150,165,228,'+.11*(1-p)+')';ctx.beginPath();for(let x=0;x<w;x+=8){const y=h*(.49+i*.085)+Math.sin(x*.025-t*3+i)*5; x===0?ctx.moveTo(x,y):ctx.lineTo(x,y)}ctx.stroke()}
        }else if(frame.effect==='storm'){particles(50,'#b8d7f9',90,true);glow(w*.87,h*.34,w*.46,'rgba(255,193,98,'+(.12+Math.sin(t*2)*.05)+')')}
        else if(frame.effect==='seal'){
          particles(52,'#fce3a2',18);const q=clamp((elapsed-(frame.shotDurationMs-4200))/4200,0,1);
          if(q>0){const x=w*.52;glow(x,h*.54,w*.45,'rgba(255,209,115,'+q*.55+')');const gap=w*.53*(1-q);ctx.fillStyle='rgba(11,19,34,'+q*.82+')';ctx.fillRect(0,0,Math.max(0,x-gap),h);ctx.fillRect(x+gap,0,w,h);ctx.strokeStyle='rgba(255,225,164,'+q*(1-q)*3+')';ctx.lineWidth=2;ctx.strokeRect(x-gap,0,gap*2,h)}
        }else if(frame.effect==='rain'){
          ctx.strokeStyle='rgba(193,221,246,.28)';ctx.lineWidth=1;
          for(let i=0;i<70;i++){const x=seed(i)*w,y=(seed(i+78)*h+t*210)%h;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-6,y+23);ctx.stroke()}
          glow(w*.84,h*.3,w*.3,'rgba(255,175,77,'+(.1+Math.sin(t*3)*.035)+')');
        }else if(frame.effect==='seasons'){
          const colors=['#f6c86c','#e6a46b','#d9eaff','#ffe5b9'];const season=Math.min(3,Math.floor(p*4));
          glow(w*.78,h*.15,w*.75,['rgba(236,198,100,.18)','rgba(222,138,58,.22)','rgba(180,211,255,.25)','rgba(255,227,147,.3)'][season]);
          particles(45,colors[season],season===2?24:35,true);
        }
        this.fxRAF=requestAnimationFrame(draw);
      };
      this.fxRAF=requestAnimationFrame(draw);
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
      this.nodes.language.setAttribute('aria-label', lang === 'zh' ? '切换到英文' : 'Switch to Chinese');
      this.nodes.pause.textContent = this.paused ? (lang === 'zh' ? '继续播放' : 'Resume') : (lang === 'zh' ? '暂停' : 'Pause');
      this.nodes.skip.textContent = lang === 'zh' ? '跳过' : 'Skip';
      this.root.dataset.paused=String(this.paused);
      this.nodes.pause.disabled=!this.frameReady;
      this.nodes.skip.disabled=!this.frameReady;
      this.nodes.skip.hidden = !this.scene?.allowSkip;
      const manual = this.scene?.mode === 'manual' || !(Number(this.scene?.frames?.[this.frameIndex]?.durationMs) > 0);
      this.nodes.continue.textContent = this.frameIndex < (this.scene?.frames?.length || 1) - 1
        ? (lang === 'zh' ? '继续' : 'Continue')
        : (lang === 'zh' ? '完成' : 'Finish');
      this.nodes.continue.hidden = !manual && this.scene?.mode !== 'manual';
    }

    startTimer(remainingOverride) {
      this.clearTimer();
      if (!this.scene || !this.frameReady || this.paused || this.scene.mode === 'manual') return;
      const duration = Number(this.scene.frames[this.frameIndex]?.durationMs) || 0;
      if (duration <= 0) return;
      const remaining = remainingOverride == null ? Math.max(0, duration - this.frameElapsedMs) : Math.max(0, remainingOverride);
      this.frameStartedAt = performance.now();
      this.timer = window.setTimeout(() => this.next(), remaining);
    }

    clearTimer() {
      if (this.timer != null) window.clearTimeout(this.timer);
      this.timer = null;
      this.frameStartedAt = 0;
    }

    next() {
      if (!this.scene || !this.frameReady || this.paused) return;
      this.clearTimer();
      if (this.frameIndex < this.scene.frames.length - 1) {
        this.frameIndex += 1;
        this.frameElapsedMs = 0;
        this.frameStartedAt = 0;
        this.renderFrame();
      } else {
        const completed = this.scene;
        this.stop();
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
      if(this.fxRAF)cancelAnimationFrame(this.fxRAF);this.fxRAF=0;
      this.nodes.stack.getAnimations?.({subtree:true}).forEach(a=>a.pause());
      this.audio?.pause();
      window.MorrowwishMusic?.cancelCinematicSounds?.();
      this.updateControls();
      this.options.onCheckpoint?.(this.snapshot());
      return this.snapshot();
    }

    resume() {
      if (!this.scene || !this.paused) return this;
      this.paused = false;
      this.nodes.stack.getAnimations?.({subtree:true}).forEach(a=>a.play());
      this.updateControls();
      this.startAtmosphere();
      const duration = Number(this.scene.frames[this.frameIndex]?.durationMs) || 0;
      this.startTimer(Math.max(0, duration - this.frameElapsedMs));
      this.options.onCheckpoint?.(this.snapshot());
      return this;
    }

    snapshot() {
      if (!this.scene) return null;
      return {
        sceneId: this.scene.id,
        frameIndex: this.frameIndex,
        frameId: this.scene.frames[this.frameIndex]?.id||null,
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

    requestLanguage(language) {
      this.options.onLanguageChange?.(language);
      return this.setLanguage(language);
    }

    setLanguage(language) {
      this.language = String(language).toLowerCase().startsWith('en') ? 'en' : 'zh';
      this.forcedLanguage = this.language;
      if (this.scene) {
        this.nodes.title.textContent = localized(this.scene.title, this.currentLanguage());
        const frame=this.scene.frames[this.frameIndex];
        this.nodes.kicker.textContent = localized(frame?.kicker||this.scene.kicker, this.currentLanguage()) || localized(this.scene.chapter, this.currentLanguage());
        for(const image of this.nodes.stack.querySelectorAll('.cbcp-art'))if(image.getAttribute('src')===frame?.image)image.alt=localized(frame.alt,this.currentLanguage());
        this.renderSubtitle();
      }
      this.updateControls();
      return this;
    }

    playSfx(sfx) {
      if (!sfx?.src || typeof Audio === 'undefined' || window.MorrowwishAudio?.isEnabled?.()===false) return;
      try {
        this.audio?.pause();
        this.audio = new Audio(sfx.src);
        this.audio.volume = clamp((sfx.volume ?? 0.6)*(window.MorrowwishMusic?.status?.().effectsVolume??1), 0, 1);
        const result = this.audio.play();
        result?.catch?.(() => {});
      } catch (_) { /* Audio is optional; visual playback must continue. */ }
    }

    skip() {
      if (!this.scene || !this.frameReady || !this.scene.allowSkip) return false;
      const skipped = this.scene;
      const snapshot = this.snapshot();
      this.stop();
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
      this.renderToken++;
      this.activeImage = null;
      this.activeEffect=null;this.activeEffectImage=null;
      if(this.fxRAF)cancelAnimationFrame(this.fxRAF);this.fxRAF=0;
      const fx=this.root.querySelector('.cbcp-fx');fx?.getContext('2d')?.clearRect(0,0,fx.width,fx.height);
      this.frameReady = false;this.root.dataset.ready='false';delete this.root.dataset.frameId;
      this.nodes.stack.replaceChildren();
      this.nodes.stage.style.removeProperty('--cbcp-backplate');
      this.paused = false;
      this.frameElapsedMs = 0;
      this.root.hidden = true;
      this.audio?.pause();
      window.MorrowwishMusic?.cancelCinematicSounds?.();
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
