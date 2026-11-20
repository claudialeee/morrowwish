// game.js — main controller: loop, scene management, input, UI panels, economy hooks.

// Unified Morrow Wish analytics shim. window.arcadeMetric is installed by
// /telemetry.js (and wrapped by /studio-audio.js); this is a no-op if either is
// absent, so the game still runs standalone. See public/telemetry.js for the
// canonical event names (game_start / game_complete / game_over / game_retry).
function metric(name, payload) {
  try { if (typeof window.arcadeMetric === 'function') window.arcadeMetric(name, payload || {}); } catch (e) {}
}

class Game {
  constructor() {
    this.canvas = document.getElementById('scene');
    this.ctx = this.canvas.getContext('2d');
    this.W = 0; this.H = 0;
    this.t = 0;
    this.scene = 'yard';     // yard | battle
    this.yard = null;
    this.battle = null;
    this.selectedPartner = null;   // uid for battle
    this._lastTs = 0;
    this._toastTimer = null;
    this.mouse = { x: 0, y: 0, active: false, idle: 0, down: false };
    this.keys = {};
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.W = rect.width; this.H = rect.height;
    this.canvas.width = this.W * dpr; this.canvas.height = this.H * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  start() {
    State.load();
    // ensure first-time player gets a starter choice handled by main.js
    this.yard = new World.YardScene(this);
    this.bindInput();
    this.refreshHUD();
    this.initWorldMap();
    requestAnimationFrame(ts => this.loop(ts));
  }

  // wire the semi-open-world module (worldmap.js) to the capture battle + economy
  initWorldMap() {
    if (!window.WorldMap) return;
    WorldMap.init(this);
    WorldMap.onEncounter((species, regionId) => {
      const team = State.S.cats.slice(0, 3);
      if (!team.length) { this.toast('没有可出战的猫'); return; }
      this._returnScene = 'map';           // after battle, go back to the region
      const region = WorldMap.REGIONS.find(r => r.id === regionId);
      this._battleTheme = region ? region.theme : null;
      this.startBattle(team, species);
    });
    WorldMap.onCollect((reward) => {
      if (reward.coins) State.S.coins += reward.coins;
      if (reward.treats) State.S.treats += reward.treats;
      if (reward.fish) State.S.fish += reward.fish;
      State.save(); this.refreshHUD();
      this.toast('📦 ' + (reward.label || '拾获补给'));
    });
    WorldMap.onExit(() => { this.scene = 'yard'; this.showYardChrome(); });
  }

  openWorldMap() {
    this.scene = 'map';
    document.getElementById('yard-actions').classList.add('hidden');
    WorldMap.enterMap();
  }
  showYardChrome() {
    document.getElementById('yard-actions').classList.remove('hidden');
    document.getElementById('tabbar').classList.remove('hidden');
    document.getElementById('hud').classList.remove('hidden');
  }

  rebuildYard() { this.yard.rebuild(); }

  loop(ts) {
    // Schedule the NEXT frame first, so a thrown error in update/draw can never
    // permanently freeze the game (the cats-don't-move failure mode).
    requestAnimationFrame(t => this.loop(t));
    const dt = Math.min(0.05, (ts - this._lastTs) / 1000 || 0);
    this._lastTs = ts; this.t += dt;
    // decay cursor "activity" so cats lose interest when the mouse stops
    if (this.mouse.active) { this.mouse.idle += dt; if (this.mouse.idle > 1.2) this.mouse.active = false; }
    // idle/placement economy tick (online == offline). butterfly flag → yard event
    if (window.Raising) { try { const d = Raising.tick(dt); if (d && d.butterfly) this._butterflyOut = true; } catch (e) {} }
    try { this.update(dt); } catch (e) { console.error('update error', e); }
    try { this.draw(); } catch (e) { console.error('draw error', e); }
  }

  update(dt) {
    if (this.scene === 'yard') this.yard.update(dt);
    else if (this.scene === 'map' && window.WorldMap) WorldMap.update(dt);
    else if (this.scene === 'battle' && this.battle) {
      this.battle.update(dt);
      this.updateBattleUI();
      if (this.battle.done) this.endBattle();
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.W, this.H);
    if (this.scene === 'yard') this.yard.draw(ctx);
    else if (this.scene === 'map' && window.WorldMap) WorldMap.draw(ctx);
    else if (this.scene === 'battle' && this.battle) this.battle.draw(ctx);
  }

  // ---------- input ----------
  bindInput() {
    const c = this.canvas;
    const pos = e => {
      const r = c.getBoundingClientRect();
      const p = e.touches ? e.touches[0] : e;
      return { x: p.clientX - r.left, y: p.clientY - r.top };
    };
    const down = e => {
      const { x, y } = pos(e);
      this.mouse.x = x; this.mouse.y = y;
      if (this.scene === 'yard') this.yardTap(x, y);
      else if (this.scene === 'map' && window.WorldMap) WorldMap.handleTap(x, y);
      else if (this.scene === 'battle') { this.mouse.down = true; e.preventDefault(); }
    };
    const move = e => {
      const { x, y } = pos(e);
      // always track the cursor (yard reactions + battle aim)
      this.mouse.x = x; this.mouse.y = y; this.mouse.active = true; this.mouse.idle = 0;
      if (this.scene === 'yard') this.maybeRevealWild(x, y);
      if (this.scene === 'battle') e.preventDefault();
    };
    const up = () => { this.mouse.down = false; };
    c.addEventListener('mousedown', down);
    c.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    c.addEventListener('touchstart', e => { down(e); this.mouse.active = true; e.preventDefault(); }, { passive: false });
    c.addEventListener('touchmove', e => { const p = pos(e); this.mouse.x = p.x; this.mouse.y = p.y; this.mouse.active = true; if (this.scene === 'battle') e.preventDefault(); }, { passive: false });
    c.addEventListener('touchend', up);

    // real-time key polling for the action battle (held keys stay down)
    const keyName = e => (e.key.length === 1 ? e.key.toLowerCase() : e.key.toLowerCase());
    window.addEventListener('keydown', e => {
      this.keys[keyName(e)] = true;
      if (this.scene === 'battle' && ['w', 'a', 's', 'd', ' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(keyName(e))) e.preventDefault();
    });
    window.addEventListener('keyup', e => { this.keys[keyName(e)] = false; });
    // prevent right-click menu over the arena
    c.addEventListener('contextmenu', e => { if (this.scene === 'battle') e.preventDefault(); });
  }

  // As the player sweeps the cursor over the yard, a wild cat gets curious and peeks
  // from the nearest bush. Keep moving near it and it reveals; tap it to start capture.
  maybeRevealWild(x, y) {
    if (this.scene !== 'yard' || !this.yard) return;
    const panelOpen = document.getElementById('panel').classList.contains('open');
    if (panelOpen) return;
    // if a wild cat is already hiding, nudge it to peek when cursor is close
    if (this.yard.hide && !this.yard.hide.found) {
      const h = this.yard.hide;
      if (Math.hypot(x - h.spot.x, y - h.spot.y) < 120) { h.peeking = true; h.peekT = 0.6; }
      return;
    }
    // throttle spawns; small chance per move once off cooldown
    this._wildCd = (this._wildCd || 0);
    const now = this.t;
    if (now < this._wildCd) return;
    if (Math.random() < 0.05) {
      this._wildCd = now + 6;              // at most ~1 spawn / 6s from cursor
      this.yard.startHideAndSeekNear(x, y);
    }
  }

  yardTap(x, y) {
    const hit = this.yard.handleTap(x, y);
    if (!hit) return;
    if (hit.type === 'loot') {
      const r = this.yard.collectLoot(hit.bubble, hit.idx);
      if (r.amount > 0) { State.save(); this.refreshHUD(); this.toast(`${r.icon || ''} +${r.amount}`); }
      return;
    }
    if (hit.type === 'hide') {
      // found the hiding wild cat → open capture prep
      const sp = this.yard.hide.species;
      this.yard.hide.found = true;
      this.spawnFoundFx(this.yard.hide.spot);
      this.yard.hide = null;
      UI.openCapturePrep(sp);
    } else if (hit.type === 'cat') {
      this.petCat(hit.entity);
    }
  }

  spawnFoundFx(spot) {
    for (let i = 0; i < 10; i++) {
      this.yard.petParticles.push({
        x: spot.x, y: spot.y - 10, vx: Math.random() * 120 - 60, vy: -60 - Math.random() * 60,
        life: 1, ch: '✨', color: '#ffd36b', size: 14 + Math.random() * 8,
      });
    }
    this.toast('✨ 找到了一只野生猫猫！');
  }

  petCat(entity) {
    this.yard.petEntity(entity);
    const cat = entity.cat;
    cat.affinity = Math.min(100, cat.affinity + 2);
    cat.joy = Math.min(100, cat.joy + 5);
    const lv = State.addXp(cat, 3);
    if (lv) this.toast(`${GameData.speciesById(cat.species).name} 升到 Lv.${cat.level}！`);
    State.save();
    // if a detail panel is open for this cat, refresh it
    if (UI.openCatUid === cat.uid) UI.renderCatDetail(cat);
  }

  // ---------- battle flow ----------
  // team = array of up to 3 cat instances (or a single cat for back-compat)
  startBattle(team, wildSpecies) {
    this.keys = {}; this.mouse.down = false;
    this.battle = new Battle.CaptureBattle(this, team, wildSpecies);
    this.battle.theme = this._battleTheme || null;   // region palette for the arena bg
    this._battleTheme = null;
    this.scene = 'battle';
    // Unified Morrow Wish analytics: a capture battle is a game "run". If the
    // previous run ended in a loss, count this fresh attempt as a retry too.
    if (this._lastBattleLost) { metric('game_retry', { rarity: wildSpecies.rarity }); this._lastBattleLost = false; }
    metric('game_start', { level: (State.S.catchCount || 0) + 1, rarity: wildSpecies.rarity });
    document.getElementById('battle-ui').classList.add('on');
    document.getElementById('yard-actions').classList.add('hidden');
    document.getElementById('tabbar').classList.add('hidden');
    document.getElementById('hud').classList.add('hidden');
    // clear any lingering yard toasts
    document.getElementById('toasts').innerHTML = '';
    document.getElementById('wild-name').textContent = `野生 ${wildSpecies.name} · ${GameData.RARITY[wildSpecies.rarity].name}`;
    this.buildTeamSlots();
    this.updateSkillLabels();
    this.updateBattleUI();
    // reset auto button text
    const ab = document.getElementById('btn-auto');
    if (ab) { ab.textContent = '🤖 自动'; ab.classList.remove('gold'); }
  }

  updateSkillLabels() {
    const b = this.battle; if (!b) return;
    const f = b.me();
    const qBtn = document.getElementById('mv-q');
    const eBtn = document.getElementById('mv-e');
    if (qBtn) {
      const sk = f.qSkill;
      qBtn.querySelector('.mv-icon').textContent = sk ? this.elemIcon(sk.element) : '🧶';
      qBtn.querySelector('.mv-k').textContent = sk ? sk.name : 'Q';
    }
    if (eBtn) {
      const sk = f.eSkill;
      eBtn.querySelector('.mv-icon').textContent = sk ? this.elemIcon(sk.element) : '💨';
      eBtn.querySelector('.mv-k').textContent = sk ? sk.name : 'E';
    }
  }

  elemIcon(el) {
    return ({ fire: '🔥', water: '💧', grass: '🌿', elec: '⚡', dark: '🌑', light: '✨' })[el] || '🐾';
  }

  buildTeamSlots() {
    const b = this.battle;
    const host = document.getElementById('team-slots');
    if (!host) return;
    host.innerHTML = '';
    b.team.forEach((f, i) => {
      const sp = GameData.speciesById(f.cat.species);
      const el = document.createElement('div');
      el.className = 'team-slot';
      el.innerHTML = `<canvas width="46" height="40"></canvas><span class="slot-key">${i + 1}</span><div class="slot-hp"><span></span></div>`;
      host.appendChild(el);
      CatArt.renderCatThumb(el.querySelector('canvas'), sp);
      el.addEventListener('click', () => b.switchTo(i));
    });
  }

  updateBattleUI() {
    const b = this.battle; if (!b) return;
    // wild HP + player active HP shown on canvas; here we update the control bar
    document.getElementById('ult-bar').style.width = b.ult + '%';
    document.getElementById('ult-btn').classList.toggle('ready', b.ult >= 100);
    const hint = document.getElementById('battle-hint');
    if (hint && hint.textContent !== b.hint) hint.textContent = b.hint;
    // move cooldowns; refresh labels if active cat changed
    const f = b.me();
    if (this._lastActiveIdx !== b.active) { this._lastActiveIdx = b.active; this.updateSkillLabels(); }
    this.renderCd('mv-basic', f.cd.basic);
    this.renderCd('mv-q', f.cd.q);
    this.renderCd('mv-e', f.cd.e);
    // team slots: hp + active highlight
    const host = document.getElementById('team-slots');
    if (host) [...host.children].forEach((el, i) => {
      const fi = b.team[i];
      el.classList.toggle('active', i === b.active);
      el.classList.toggle('fainted', !fi.alive);
      const hp = el.querySelector('.slot-hp > span');
      if (hp) hp.style.width = (fi.hp / fi.maxhp * 100) + '%';
    });
  }

  // show/clear a cooldown overlay on a move button
  renderCd(id, cd) {
    const el = document.getElementById(id); if (!el) return;
    let ov = el.querySelector('.cd');
    if (cd > 0.05) {
      el.classList.add('cooling');
      if (!ov) { ov = document.createElement('span'); ov.className = 'cd'; el.appendChild(ov); }
      ov.textContent = cd.toFixed(1);
    } else {
      el.classList.remove('cooling');
      if (ov) ov.remove();
    }
  }

  endBattle() {
    const b = this.battle;
    if (!b) return;                 // already ended (loop may call this once on finish)
    const win = b.result === 'win';
    document.getElementById('battle-ui').classList.remove('on');
    document.getElementById('hud').classList.remove('hidden');
    // return to wherever we came from (yard normally, overworld region if exploring)
    const backToMap = this._returnScene === 'map' && window.WorldMap;
    this._returnScene = null;
    if (backToMap) {
      this.scene = 'map';
      WorldMap.enterRegion(WorldMap.currentRegion);
    } else {
      document.getElementById('tabbar').classList.remove('hidden');
      this.scene = 'yard';
    }
    if (win) {
      const newCat = State.makeCat(b.wild.id);
      if (window.Raising && Raising.decorateNewCat) Raising.decorateNewCat(newCat);
      State.S.cats.push(newCat);
      State.S.dex[b.wild.id] = (State.S.dex[b.wild.id] || 0) + 1;
      State.S.catchCount++;
      // reward: partner gains affinity + xp, coins
      b.partner.affinity = Math.min(100, b.partner.affinity + 6);
      State.addXp(b.partner, 25);
      State.S.coins += 20 + (['N', 'R', 'SR', 'SSR'].indexOf(b.wild.rarity)) * 25;
      this.rebuildYard();
      State.save();
      this.refreshHUD();
      // Unified analytics: a won capture completes the run; also a game-specific capture event.
      metric('game_complete', { level: State.S.catchCount, rarity: b.wild.rarity, score: State.S.catchCount });
      metric('cat_capture', { species: b.wild.id, rarity: b.wild.rarity });
      UI.openCatchResult(b.wild, newCat);
    } else {
      // Unified analytics: fleeing/wiping ends the run as a loss.
      metric('game_over', { level: (State.S.catchCount || 0) + 1, rarity: b.wild.rarity });
      this._lastBattleLost = true;   // a subsequent battle counts as a retry
      this.toast('💨 野生猫猫跑掉了…下次再来！');
      if (!backToMap) document.getElementById('yard-actions').classList.remove('hidden');
    }
    this.battle = null;
  }

  // ---------- helpers ----------
  refreshHUD() {
    document.getElementById('coins').textContent = State.S.coins;
    document.getElementById('treats').textContent = State.S.treats;
    document.getElementById('fish').textContent = State.S.fish;
    const yarnEl = document.getElementById('yarn');
    if (yarnEl) yarnEl.textContent = (State.S.raising && State.S.raising.yarn) || 0;
    const dailyBtn = document.getElementById('daily-dot');
    if (dailyBtn) dailyBtn.classList.toggle('hidden', !State.dailyAvailable());
  }

  toast(msg) {
    const wrap = document.getElementById('toasts');
    const el = document.createElement('div');
    el.className = 'toast'; el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .4s'; }, 1600);
    setTimeout(() => el.remove(), 2100);
  }
}

window.Game = Game;
