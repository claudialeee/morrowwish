// ui.js — all overlay panels & menus. Talks to State + Game.

const UI = {
  game: null,
  openCatUid: null,

  init(game) {
    this.game = game;
    // tab bar
    document.querySelectorAll('.tab').forEach(btn => {
      btn.addEventListener('click', () => this.onTab(btn.dataset.tab));
    });
    // yard FABs
    document.getElementById('fab-seek').addEventListener('click', () => {
      if (this.game.scene !== 'yard') return;
      this.game.yard.startHideAndSeek();
    });
    document.getElementById('fab-feed').addEventListener('click', () => this.openFeed());
    document.getElementById('fab-play').addEventListener('click', () => this.openTease());
    const fabMap = document.getElementById('fab-map');
    if (fabMap) fabMap.addEventListener('click', () => { if (this.game.scene === 'yard') this.game.openWorldMap(); });
    // battle buttons
    document.getElementById('btn-flee').addEventListener('click', () => {
      if (this.game.battle) { this.game.battle.finish(false); }
    });
    document.getElementById('btn-auto').addEventListener('click', () => {
      if (!this.game.battle) return;
      const on = this.game.battle.toggleAuto();
      const b = document.getElementById('btn-auto');
      b.textContent = on ? '🎮 手动' : '🤖 自动';
      b.classList.toggle('gold', on);
    });
    // move-bar buttons (also usable by touch / clicking)
    document.querySelectorAll('.move-bar .move').forEach(btn => {
      btn.addEventListener('click', () => {
        const b = this.game.battle; if (!b) return;
        const m = btn.dataset.move;
        if (m === 'dodge') b.dodge(); else b.castMove(m);
      });
    });
    // generic close
    document.body.addEventListener('click', e => {
      if (e.target.classList.contains('card-close') || e.target.classList.contains('panel-bg')) {
        this.closeAll();
      }
    });
  },

  onTab(tab) {
    // if we're out in the overworld map, any tab click returns to the yard first
    if (this.game.scene === 'map') {
      this.game.scene = 'yard';
      this.game.showYardChrome();
    }
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    if (tab === 'yard') { this.closeAll(); }
    else if (tab === 'cats') this.openRoster();
    else if (tab === 'work') this.openWorkshop();
    else if (tab === 'dex') this.openDex();
    else if (tab === 'daily') this.openDaily();
    else if (tab === 'shop') this.openShop();
  },

  // ---- 欢迎回来 (offline raising report) ----
  openWelcomeBack(r) {
    const prod = r.produced || {};
    const gains = r.gains || {};
    const prodStr = Object.entries(prod).filter(([, v]) => v > 0).map(([k, v]) => `${this.resIcon(k)}+${v}`).join(' ');
    const gainStr = Object.entries(gains).filter(([, v]) => v > 0).map(([k, v]) => `${this.resIcon(k)}+${v}`).join(' ');
    const visitors = (r.visitors || []).map(v => `<div class="wb-visitor ${v.rare ? 'rare' : ''}"><b>${v.name}</b> 来访${v.gift ? ' · 留下 ' + v.gift : ''}${v.rare ? ' ✨稀客!' : ''}</div>`).join('');
    this.panel(`<span class="card-close">×</span>
      <h2 class="center">😺 欢迎回来</h2>
      <p class="sub center">你离开了约 ${r.minutes} 分钟${r.capped ? '（已达上限）' : ''}</p>
      ${prodStr ? `<p class="center">工坊产出待收取：<b>${prodStr}</b></p>` : ''}
      ${gainStr ? `<p class="center">猫猫带回：<b>${gainStr}</b></p>` : ''}
      ${visitors ? `<div class="wb-list">${visitors}</div>` : ''}
      <div class="btn-row" style="justify-content:center">
        <button class="btn gold" id="wb-collect">${prodStr ? '全部收取' : '收下'}</button>
      </div>`);
    document.getElementById('wb-collect').onclick = () => {
      if (window.Raising && prodStr) Raising.collectAll();
      State.save(); this.game.refreshHUD(); this.closeAll();
    };
  },
  resIcon(k) { return ({ coins: '🪙', fish: '🐟', yarn: '🧶', luck: '🍀', xp: '✨' })[k] || ''; },

  panel(html) {
    const p = document.getElementById('panel');
    p.innerHTML = `<div class="card">${html}</div>`;
    p.classList.add('open');
    // clicking backdrop closes
    p.onclick = e => { if (e.target === p) this.closeAll(); };
  },
  closeAll() {
    document.getElementById('panel').classList.remove('open');
    this.openCatUid = null;
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === 'yard'));
  },

  // ---------- roster ----------
  // ---- 工坊: 派工生产 + 繁育 (idle/placement economy) ----
  openWorkshop() {
    if (!window.Raising) { this.panel(`<span class="card-close">×</span><h2>工坊</h2><p class="sub">加载中…</p>`); return; }
    const stations = Raising.stationsView();
    const yarn = (State.S.raising && State.S.raising.yarn) || 0;
    const breeding = Raising.breedingView ? Raising.breedingView() : { active: false };
    const stRows = stations.map(s => {
      const pct = Math.round((s.pct || 0) * 100);
      return `<div class="st-row" data-id="${s.id}">
        <div class="st-ico">${s.icon || '🏭'}</div>
        <div class="st-main">
          <div class="st-name">${s.name} <span class="tiny">Lv.${s.level}</span></div>
          <div class="st-bar"><span style="width:${pct}%"></span></div>
          <div class="tiny">${s.catName ? '👷 ' + s.catName : '空缺（点猫派工）'} · ${s.stored}/${s.cap} ${this.resIcon(s.res)} · ${s.ratePerHour}/时</div>
        </div>
        <div class="st-btns">
          <button class="btn gold tiny-btn" data-act="collect" data-id="${s.id}">收取</button>
          <button class="btn ghost tiny-btn" data-act="assign" data-id="${s.id}">派工</button>
          <button class="btn ghost tiny-btn" data-act="upgrade" data-id="${s.id}">升级</button>
        </div>
      </div>`;
    }).join('');
    const breedBox = breeding.active
      ? `<div class="st-row"><div class="st-ico">🥚</div><div class="st-main"><div class="st-name">暖窝孵化中 <span class="tiny">${breeding.parents ? breeding.parents.join(' + ') : ''}</span></div><div class="st-bar"><span style="width:${Math.round((breeding.pct || 0) * 100)}%"></span></div></div><div class="st-btns">${breeding.ready ? '<button class="btn gold tiny-btn" data-act="egg">抱回小猫</button>' : '<span class="tiny">孵化中…</span>'}</div></div>`
      : `<div class="st-row"><div class="st-ico">🥚</div><div class="st-main"><div class="st-name">暖窝（繁育）</div><div class="tiny">选两只猫繁育，可能产出继承花色+变异的小猫</div></div><div class="st-btns"><button class="btn ghost tiny-btn" data-act="breed">开始繁育</button></div></div>`;
    this.panel(`<span class="card-close">×</span>
      <h2>🧶 工坊 <span class="tiny">派猫咪上工，离线也产出</span></h2>
      <p class="sub">毛线 🧶 ${yarn} · 把猫派到工位生产资源，等级越高产量/容量越大</p>
      <div class="st-list">${stRows}${breedBox}</div>`);
    const host = document.getElementById('panel');
    host.querySelectorAll('[data-act]').forEach(b => b.onclick = () => this.workshopAct(b.dataset.act, b.dataset.id));
  },
  workshopAct(act, id) {
    const R = window.Raising; if (!R) return;
    if (act === 'collect') { R.collect(id); State.save(); this.game.refreshHUD(); this.openWorkshop(); }
    else if (act === 'upgrade') { const r = R.upgrade(id); this.game.toast(r && r.ok ? '升级成功！' : (r && r.msg) || '资源不足'); State.save(); this.game.refreshHUD(); this.openWorkshop(); }
    else if (act === 'assign') { this.openCatPicker('选择上工的猫', uid => { R.assignCat(id, uid); State.save(); this.openWorkshop(); }); }
    else if (act === 'breed') { this.openBreedPicker(); }
    else if (act === 'egg') { const r = R.collectEgg(); if (r && r.ok) { if (r.cat) { State.S.cats.push(r.cat); State.S.dex[r.cat.species] = (State.S.dex[r.cat.species] || 0) + 1; } State.save(); this.game.rebuildYard(); this.game.toast('🐱 ' + (r.parents ? r.parents.join('+') : '') + ' 的小猫诞生了！' + (r.shiny ? ' ✨闪光!' : '')); } this.openWorkshop(); }
  },
  openCatPicker(title, onPick) {
    const cats = State.S.cats;
    const chips = cats.map(c => { const sp = GameData.speciesById(c.species); const busy = window.Raising && Raising.isBusy && Raising.isBusy(c.uid); return `<div class="chip ${busy ? 'busy' : ''}" data-uid="${c.uid}"><canvas width="44" height="38"></canvas><div><div style="font-weight:700">${sp.name}</div><div class="tiny">${busy ? '工作中' : 'Lv.' + c.level}</div></div></div>`; }).join('');
    this.panel(`<span class="card-close">×</span><h2>${title}</h2><div class="roster">${chips}</div>`);
    document.querySelectorAll('#panel .chip').forEach(chip => {
      const c = cats.find(x => x.uid === chip.dataset.uid);
      CatArt.renderCatThumb(chip.querySelector('canvas'), GameData.speciesById(c.species));
      chip.onclick = () => onPick(chip.dataset.uid);
    });
  },
  openBreedPicker() {
    const cats = State.S.cats; this._breedSel = [];
    const render = () => {
      const chips = cats.map(c => { const sp = GameData.speciesById(c.species); const sel = this._breedSel.includes(c.uid); return `<div class="chip ${sel ? 'sel' : ''}" data-uid="${c.uid}"><canvas width="44" height="38"></canvas><div><div style="font-weight:700">${sp.name}</div><div class="tiny">${GameData.RARITY[sp.rarity].name}</div></div></div>`; }).join('');
      this.panel(`<span class="card-close">×</span><h2>🥚 选两只猫繁育</h2><p class="sub">已选 ${this._breedSel.length}/2</p><div class="roster">${chips}</div><div class="btn-row"><button class="btn gold" id="bp-go" ${this._breedSel.length === 2 ? '' : 'disabled'}>开始孵化</button></div>`);
      document.querySelectorAll('#panel .chip').forEach(chip => {
        const c = cats.find(x => x.uid === chip.dataset.uid);
        CatArt.renderCatThumb(chip.querySelector('canvas'), GameData.speciesById(c.species));
        chip.onclick = () => { const u = chip.dataset.uid; const i = this._breedSel.indexOf(u); if (i >= 0) this._breedSel.splice(i, 1); else if (this._breedSel.length < 2) this._breedSel.push(u); render(); };
      });
      const go = document.getElementById('bp-go'); if (go) go.onclick = () => { const r = Raising.startBreeding(this._breedSel[0], this._breedSel[1]); this.game.toast(r && r.ok ? '🥚 开始孵化！' : (r && r.msg) || '无法繁育'); State.save(); this.openWorkshop(); };
    };
    render();
  },

  openRoster() {
    const cats = State.S.cats;
    if (cats.length === 0) { this.panel(`<span class="card-close">×</span><h2>我的猫猫</h2><p class="sub">还没有猫猫，去庭院捉迷藏找一只吧！</p>`); return; }
    const chips = cats.map(c => {
      const sp = GameData.speciesById(c.species);
      return `<div class="dex-cell" data-uid="${c.uid}">
        <canvas width="90" height="76"></canvas>
        <div class="name">${sp.name} <span class="tiny">Lv.${c.level}</span></div>
        <div class="rarity rarity-${sp.rarity}">${GameData.RARITY[sp.rarity].name}</div>
        <div class="tiny">❤ ${Math.round(c.affinity)}</div>
      </div>`;
    }).join('');
    this.panel(`<span class="card-close">×</span>
      <h2>我的猫猫 <span class="tiny">(${cats.length})</span></h2>
      <p class="sub">点击查看详情、培养与互动</p>
      <div class="dex-grid">${chips}</div>`);
    const cells = document.querySelectorAll('#panel .dex-cell');
    cells.forEach(cell => {
      const uid = cell.dataset.uid;
      const c = cats.find(x => x.uid === uid);
      CatArt.renderCatThumb(cell.querySelector('canvas'), GameData.speciesById(c.species));
      cell.addEventListener('click', () => this.openCatDetail(c));
    });
  },

  openCatDetail(cat) {
    this.openCatUid = cat.uid;
    this.panel(`<span class="card-close">×</span><div id="cat-detail"></div>`);
    this.renderCatDetail(cat);
  },

  renderCatDetail(cat) {
    const host = document.getElementById('cat-detail');
    if (!host) return;
    const sp = GameData.speciesById(cat.species);
    const rar = GameData.RARITY[sp.rarity];
    const need = State.xpToNext(cat.level);
    const tier = State.bondTier(cat);
    const tierText = ['路人', '熟悉', '亲密', '灵魂纽带'][tier];
    const feedCost = 5, playCost = 0;
    host.innerHTML = `
      <h2>${sp.name} <span class="rarity-${sp.rarity}">◆${rar.name}</span></h2>
      <p class="sub">${sp.desc}</p>
      <div style="display:flex;gap:16px;align-items:center;">
        <canvas id="cd-canvas" width="120" height="100" style="background:rgba(255,255,255,0.04);border-radius:12px;"></canvas>
        <div style="flex:1">
          <div class="stat-row"><span class="label">等级</span><span class="val" style="width:auto">Lv.${cat.level}</span></div>
          <div class="stat-row"><span class="label">经验</span><div class="bar xp"><span style="width:${Math.round(cat.xp / need * 100)}%"></span></div><span class="val">${Math.round(cat.xp)}/${need}</span></div>
          <div class="stat-row"><span class="label">好感 (${tierText})</span><div class="bar aff"><span style="width:${cat.affinity}%"></span></div><span class="val">${Math.round(cat.affinity)}</span></div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 18px;margin-top:12px">
        ${statLine('力量', cat.stats.pow)}${statLine('敏捷', cat.stats.agi)}
        ${statLine('体力', cat.stats.vit)}${statLine('魅力', cat.stats.cha)}
      </div>
      <div class="stat-row" style="margin-top:12px"><span class="label">饱食</span><div class="bar hp"><span style="width:${cat.hunger}%"></span></div><span class="val">${Math.round(cat.hunger)}</span></div>
      <div class="stat-row"><span class="label">心情</span><div class="bar aff"><span style="width:${cat.joy}%"></span></div><span class="val">${Math.round(cat.joy)}</span></div>
      <p class="tiny" style="margin-top:8px">战力 ⚔ ${State.catPower(cat)}${cat.personality ? ' · 性格: ' + cat.personality : ''}${cat.trait ? ' · 特性: ' + cat.trait : ''}</p>
      ${this.evoRowHtml(cat)}
      <p class="sub" style="margin:12px 0 4px">🎣 用挂机产出培养它变强</p>
      <div class="btn-row">
        <button class="btn gold" id="cd-trainxp">🐟 喂鱼练级 (×3🐟 → +经验)</button>
        <button class="btn" id="cd-trainstat">🧶 毛线特训 (×8🧶 → 全属性+)</button>
      </div>
      <div class="btn-row">
        <button class="btn ghost" id="cd-pet">🤲 撸猫 (+好感)</button>
        <button class="btn ghost" id="cd-feed">🍖 喂食 (${feedCost}🪙)</button>
        <button class="btn ghost" id="cd-tease">🪶 逗猫游戏</button>
      </div>`;
    // animated preview
    const cv = document.getElementById('cd-canvas');
    const cx = cv.getContext('2d');
    let tt = 0;
    const anim = () => {
      if (this.openCatUid !== cat.uid) return;
      tt += 0.03; cx.clearRect(0, 0, 120, 100);
      CatArt.drawCat(cx, 60, 70, { species: sp, scale: 1.15, face: 1, t: tt, pose: 'play', mood: cat.joy > 60 ? 'happy' : 'neutral' });
      requestAnimationFrame(anim);
    };
    anim();
    document.getElementById('cd-pet').onclick = () => {
      cat.affinity = Math.min(100, cat.affinity + 3); cat.joy = Math.min(100, cat.joy + 4);
      State.addXp(cat, 4); State.save(); this.renderCatDetail(cat); this.game.toast('❤ 好感提升');
    };
    document.getElementById('cd-feed').onclick = () => {
      if (State.S.coins < feedCost) { this.game.toast('金币不足'); return; }
      State.S.coins -= feedCost; cat.hunger = Math.min(100, cat.hunger + 35); cat.joy = Math.min(100, cat.joy + 8);
      cat.affinity = Math.min(100, cat.affinity + 1); State.addXp(cat, 6);
      State.save(); this.game.refreshHUD(); this.renderCatDetail(cat); this.game.toast('🍖 吃得好开心');
    };
    document.getElementById('cd-tease').onclick = () => this.openTease(cat);
    // 培养: fish → XP (scaled to level so it stays useful), yarn → permanent stats
    document.getElementById('cd-trainxp').onclick = () => {
      if (State.S.fish < 3) { this.game.toast('小鱼干不足（去钓鱼位产出）'); return; }
      State.S.fish -= 3;
      const gain = 20 + cat.level * 12;        // scales so high-level cats still progress
      const lv = State.addXp(cat, gain);
      cat.hunger = Math.min(100, cat.hunger + 20);
      State.save(); this.game.refreshHUD(); this.renderCatDetail(cat);
      this.game.toast(lv ? `🎉 升到 Lv.${cat.level}！(+${gain}经验)` : `🐟 +${gain} 经验`);
    };
    document.getElementById('cd-trainstat').onclick = () => {
      const yarn = (State.S.raising && State.S.raising.yarn) || 0;
      if (yarn < 8) { this.game.toast('毛线不足（去毛线坊产出）'); return; }
      State.S.raising.yarn -= 8;
      cat.stats.pow += 1; cat.stats.agi += 1; cat.stats.vit += 1; cat.stats.cha += 1;
      State.save(); this.game.refreshHUD(); this.renderCatDetail(cat);
      this.game.toast('🧶 特训完成！全属性 +1');
    };
    const evoBtn = document.getElementById('cd-evolve');
    if (evoBtn) evoBtn.onclick = () => this.doEvolve(cat);
  },

  // evolution row shown in cat detail
  evoRowHtml(cat) {
    const S = window.Skills; if (!S || !S.evolutionOf) return '';
    const evo = S.evolutionOf(cat.species); if (!evo) return '';
    const toSp = GameData.speciesById(evo.evolvesTo);
    const req = evo.req || {};
    const lvlOk = cat.level >= (req.level || 0);
    const bondOk = (cat.affinity || 0) >= (req.bond || 0);
    const itemOk = !req.item || ((State.S.evoStones && State.S.evoStones[req.item]) > 0);
    const ready = lvlOk && bondOk && itemOk;
    const reqStr = [
      `Lv.${req.level}${lvlOk ? '✓' : `(当前${cat.level})`}`,
      `好感${req.bond}${bondOk ? '✓' : ''}`,
      req.item ? `${req.item}×1${itemOk ? '✓' : '(缺)'}` : null,
    ].filter(Boolean).join(' · ');
    return `<div class="evo-row ${ready ? 'ready' : ''}">
      <div class="evo-info">✨ 可进化为 <b>${toSp.name}</b><div class="tiny">${reqStr}</div></div>
      <button class="btn ${ready ? 'gold' : ''}" id="cd-evolve" ${ready ? '' : 'disabled'}>进化</button>
    </div>`;
  },
  doEvolve(cat) {
    const S = window.Skills;
    const evo = S.evolutionOf(cat.species); if (!evo) return;
    const req = evo.req || {};
    if (cat.level < (req.level || 0) || (cat.affinity || 0) < (req.bond || 0)) { this.game.toast('条件不满足'); return; }
    if (req.item) {
      if (!State.S.evoStones || !(State.S.evoStones[req.item] > 0)) { this.game.toast('缺少 ' + req.item + '（商店购买）'); return; }
      State.S.evoStones[req.item]--;
    }
    const toSp = GameData.speciesById(evo.evolvesTo);
    const oldName = GameData.speciesById(cat.species).name;
    const fromSpecies = cat.species;
    // evolve: change species, keep level/bond/xp, boost stats, re-roll loadout, log dex
    cat.species = evo.evolvesTo;
    cat.stats.pow = Math.round(cat.stats.pow * 1.35 + 4);
    cat.stats.agi = Math.round(cat.stats.agi * 1.35 + 4);
    cat.stats.vit = Math.round(cat.stats.vit * 1.35 + 4);
    cat.stats.cha = Math.round(cat.stats.cha * 1.35 + 4);
    cat.loadout = null; if (S.ensureLoadout) S.ensureLoadout(cat);
    cat.evolved = true;
    State.S.dex[evo.evolvesTo] = (State.S.dex[evo.evolvesTo] || 0) + 1;
    State.save(); this.game.rebuildYard(); this.game.refreshHUD();
    if (typeof metric === 'function') metric('cat_evolve', { from: fromSpecies, to: evo.evolvesTo });
    this.openEvolveAnim(oldName, toSp);
  },
  openEvolveAnim(oldName, toSp) {
    this.panel(`<span class="card-close">×</span>
      <h2 class="center">✨ 进化成功！</h2>
      <canvas id="evo-cv" width="200" height="160" style="display:block;margin:10px auto"></canvas>
      <p class="center"><b>${oldName}</b> 进化为 <b class="rarity-${toSp.rarity}">${toSp.name}</b>！</p>
      <p class="sub center">${toSp.desc}</p>
      <div class="btn-row" style="justify-content:center"><button class="btn gold" onclick="UI.closeAll()">太棒了</button></div>`);
    const cv = document.getElementById('evo-cv'); const cx = cv.getContext('2d'); let tt = 0;
    const anim = () => {
      if (!document.getElementById('evo-cv')) return;
      tt += 0.04; cx.clearRect(0, 0, 200, 160);
      // burst rays
      cx.save(); cx.translate(100, 85); cx.globalAlpha = 0.5;
      for (let i = 0; i < 12; i++) { cx.rotate(Math.PI / 6 + tt * 0.5); cx.fillStyle = 'rgba(255,211,107,0.3)'; cx.fillRect(0, -3, 110, 6); }
      cx.restore();
      CatArt.drawCat(cx, 100, 95, { species: toSp, scale: 1.5, face: 1, t: tt, pose: 'sit', mood: 'happy' });
      requestAnimationFrame(anim);
    };
    anim();
  },

  // ---------- collection / dex ----------
  openDex() {
    const cells = GameData.SPECIES.map(sp => {
      const count = State.S.dex[sp.id] || 0;
      const locked = count === 0;
      return `<div class="dex-cell ${locked ? 'locked' : ''}" data-id="${sp.id}">
        ${count > 1 ? `<div class="badge-count">×${count}</div>` : ''}
        <canvas width="90" height="76"></canvas>
        <div class="name">${locked ? '？？？' : sp.name}</div>
        <div class="rarity rarity-${sp.rarity}">${GameData.RARITY[sp.rarity].name}</div>
      </div>`;
    }).join('');
    const total = GameData.SPECIES.length;
    const owned = GameData.SPECIES.filter(s => State.S.dex[s.id]).length;
    this.panel(`<span class="card-close">×</span>
      <h2>图鉴 <span class="tiny">${owned}/${total}</span></h2>
      <p class="sub">收集所有猫猫，解锁隐藏传说种！</p>
      <div class="dex-grid">${cells}</div>`);
    document.querySelectorAll('#panel .dex-cell').forEach(cell => {
      const sp = GameData.speciesById(cell.dataset.id);
      if (!cell.classList.contains('locked')) CatArt.renderCatThumb(cell.querySelector('canvas'), sp);
      cell.addEventListener('click', () => {
        if (State.S.dex[sp.id]) this.panel(`<span class="card-close">×</span>
          <h2>${sp.name} <span class="rarity-${sp.rarity}">◆${GameData.RARITY[sp.rarity].name}</span></h2>
          <p class="sub">${sp.desc}</p>
          <canvas id="dx" width="160" height="130" style="display:block;margin:10px auto;background:rgba(255,255,255,0.04);border-radius:12px"></canvas>
          <p class="tiny center">已捕获 ${State.S.dex[sp.id]} 只 · 基础 力${sp.base.pow}/敏${sp.base.agi}/体${sp.base.vit}/魅${sp.base.cha}</p>
          <div class="btn-row" style="justify-content:center"><button class="btn ghost" onclick="UI.openDex()">返回图鉴</button></div>`),
          CatArt.renderCatThumb(document.getElementById('dx'), sp);
      });
    });
  },

  // ---------- daily ----------
  openDaily() {
    const avail = State.dailyAvailable();
    this.panel(`<span class="card-close">×</span>
      <h2>每日签到</h2>
      <p class="sub">连续登录领更多奖励，第7天必得小鱼干！</p>
      <p class="center" style="font-size:1.1rem;margin:14px 0">🔥 连续签到 <b>${State.S.streak}</b> 天</p>
      <div class="btn-row" style="justify-content:center">
        <button class="btn gold" id="claim" ${avail ? '' : 'disabled'}>${avail ? '🎁 领取今日奖励' : '✅ 今日已领取'}</button>
      </div>
      <p class="tiny center" style="margin-top:10px">奖励随连签天数增长</p>`);
    const btn = document.getElementById('claim');
    if (btn && avail) btn.onclick = () => {
      const { reward, streak } = State.claimDaily();
      State.save(); this.game.refreshHUD();
      let msg = `+${reward.coins}🪙 +${reward.treats}🐟零食`;
      if (reward.fish) msg += ` +${reward.fish}🐠`;
      this.game.toast(`签到成功！${msg}`);
      this.openDaily();
    };
  },

  // ---------- shop ----------
  openShop() {
    this.panel(`<span class="card-close">×</span>
      <h2>小卖部</h2>
      <p class="sub">用金币与小鱼干换补给与运气</p>
      <div class="btn-row" style="flex-direction:column;align-items:stretch">
        <button class="btn gold" data-buy="treat5">🐟 零食 ×5 — 30🪙</button>
        <button class="btn gold" data-buy="treat15">🐟 零食 ×15 — 75🪙</button>
        <button class="btn" data-buy="lure">🍀 幸运诱饵 ×1 (下次捉迷藏更易遇稀有) — 2🐠</button>
        <button class="btn ghost" data-buy="fish">🐠 用 60🪙 兑换 1 小鱼干</button>
      </div>
      <p class="sub" style="margin-top:14px">💎 进化石（猫咪进化所需）</p>
      <div class="btn-row" style="flex-direction:column;align-items:stretch">
        <button class="btn" data-buy="stone:夜影石">🌑 夜影石 ×1 — 3🐠</button>
        <button class="btn" data-buy="stone:月华露">🌙 月华露 ×1 — 4🐠</button>
        <button class="btn" data-buy="stone:赤焰晶">🔥 赤焰晶 ×1 — 4🐠</button>
      </div>
      <p class="tiny center" style="margin-top:12px">小鱼干也可每日签到获得</p>`);
    document.querySelectorAll('#panel [data-buy]').forEach(b => {
      b.onclick = () => this.buy(b.dataset.buy);
    });
  },
  buy(what) {
    const S = State.S;
    const spend = (coins = 0, fish = 0) => {
      if (S.coins < coins || S.fish < fish) { this.game.toast('资源不足'); return false; }
      S.coins -= coins; S.fish -= fish; return true;
    };
    if (what === 'treat5' && spend(30)) { S.treats += 5; this.game.toast('+5 零食'); }
    else if (what === 'treat15' && spend(75)) { S.treats += 15; this.game.toast('+15 零食'); }
    else if (what === 'lure' && spend(0, 2)) { S.luckLure += 1; this.game.toast('🍀 幸运诱饵就绪'); }
    else if (what === 'fish' && spend(60)) { S.fish += 1; this.game.toast('+1 小鱼干'); }
    else if (what && what.indexOf('stone:') === 0) {
      const name = what.slice(6);
      const cost = name === '夜影石' ? 3 : 4;
      if (spend(0, cost)) { S.evoStones = S.evoStones || {}; S.evoStones[name] = (S.evoStones[name] || 0) + 1; this.game.toast('获得 ' + name); }
    }
    State.save(); this.game.refreshHUD();
  },

  // ---------- feed (quick) ----------
  openFeed() {
    const cats = State.S.cats;
    if (!cats.length) { this.game.toast('还没有猫猫'); return; }
    this.panel(`<span class="card-close">×</span>
      <h2>喂食全员</h2>
      <p class="sub">花 ${cats.length * 4}🪙 给所有猫猫加餐</p>
      <div class="btn-row" style="justify-content:center">
        <button class="btn gold" id="feedall">🍖 全部喂食</button>
      </div>`);
    document.getElementById('feedall').onclick = () => {
      const cost = cats.length * 4;
      if (State.S.coins < cost) { this.game.toast('金币不足'); return; }
      State.S.coins -= cost;
      cats.forEach(c => { c.hunger = Math.min(100, c.hunger + 35); c.joy = Math.min(100, c.joy + 6); State.addXp(c, 4); });
      State.save(); this.game.refreshHUD(); this.game.toast('🍖 全员吃饱啦'); this.closeAll();
    };
  },

  // ---------- tease mini-game (逗猫) ----------
  openTease(cat) {
    const cats = State.S.cats;
    if (!cats.length) { this.game.toast('还没有猫猫'); return; }
    const target = cat || cats[0];
    this.panel(`<span class="card-close">×</span>
      <h2>逗猫 🪶</h2>
      <p class="sub">点击逗猫棒，让 ${GameData.speciesById(target.species).name} 扑抓！抓中越多，好感与心情涨得越快。</p>
      <div style="position:relative;height:220px;background:rgba(255,255,255,0.04);border-radius:12px;overflow:hidden" id="tease-area">
        <canvas id="tz" width="500" height="220" style="width:100%;height:100%"></canvas>
      </div>
      <p class="center" style="margin-top:8px">得分 <b id="tz-score">0</b> / 10</p>
      <div class="btn-row" style="justify-content:center"><button class="btn ghost" id="tz-done">结束</button></div>`);
    this.runTease(target);
  },

  runTease(cat) {
    const sp = GameData.speciesById(cat.species);
    const cv = document.getElementById('tz');
    const ctx = cv.getContext('2d');
    const W = 500, H = 220;
    let score = 0, misses = 0, tt = 0, active = true;
    // feather toy position
    let fx = W / 2, fy = H / 2, tx = fx, ty = fy, moveTimer = 0;
    // cat position chases toy
    let cx = W / 2, cy = H - 40, pounce = 0;
    const scoreEl = document.getElementById('tz-score');

    const area = document.getElementById('tease-area');
    const tap = e => {
      if (!active) return;
      const r = cv.getBoundingClientRect();
      const p = e.touches ? e.touches[0] : e;
      const mx = (p.clientX - r.left) * (W / r.width);
      const my = (p.clientY - r.top) * (H / r.height);
      // if clicking near toy AND cat is close → score
      const toCatp = Math.hypot(mx - cx, my - cy);
      if (toCatp < 60) {
        score++; pounce = 0.4; scoreEl.textContent = score;
        this.game.toast('🐾 抓到啦！');
        if (score >= 10) finish();
      }
      // move toy to tap
      tx = Math.max(20, Math.min(W - 20, mx));
      ty = Math.max(20, Math.min(H - 60, my));
    };
    area.addEventListener('mousedown', tap);
    area.addEventListener('touchstart', e => { tap(e); e.preventDefault(); }, { passive: false });

    const finish = () => {
      if (!active) return;
      active = false;
      const gain = 3 + score;
      cat.affinity = Math.min(100, cat.affinity + gain * 0.8);
      cat.joy = Math.min(100, cat.joy + gain);
      State.addXp(cat, gain * 2);
      State.save(); this.game.refreshHUD();
      this.game.toast(`逗猫结束！好感 +${Math.round(gain * 0.8)}`);
      if (this.openCatUid === cat.uid) this.renderCatDetail(cat);
    };
    document.getElementById('tz-done').onclick = finish;

    const anim = () => {
      if (!document.getElementById('tz')) { active = false; return; }
      tt += 0.03;
      // toy drifts a little + auto-wanders if not moved
      moveTimer -= 0.03;
      if (moveTimer <= 0) { tx = 30 + Math.random() * (W - 60); ty = 30 + Math.random() * (H - 80); moveTimer = 1.4; }
      fx += (tx - fx) * 0.12; fy += (ty - fy) * 0.12;
      // cat chases toy
      cx += (fx - cx) * 0.06; cy += (fy + 20 - cy) * 0.06;
      if (pounce > 0) pounce -= 0.03;
      ctx.clearRect(0, 0, W, H);
      // cat
      CatArt.drawCat(ctx, cx, cy, { species: sp, scale: 1.2, face: fx < cx ? -1 : 1, t: tt, pose: pounce > 0 ? 'play' : 'walk', mood: 'alert' });
      // feather toy
      ctx.save(); ctx.translate(fx, fy);
      ctx.strokeStyle = '#b5a6cf'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(10, 18); ctx.stroke();
      ctx.fillStyle = '#ff7b9c'; ctx.font = '20px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('🪶', 0, 0);
      ctx.restore();
      if (active) requestAnimationFrame(anim);
    };
    anim();
  },

  // ---------- capture prep ----------
  openCapturePrep(wildSp) {
    const cats = State.S.cats;
    const rar = GameData.RARITY[wildSp.rarity];
    if (!cats.length) {
      this.panel(`<span class="card-close">×</span><h2>发现野生猫猫</h2><p class="sub">你还没有伙伴猫，无法发起捕捉。</p>`);
      return;
    }
    // sort partners by power; pick top 3 as the default team
    const sorted = [...cats].sort((a, b) => State.catPower(b) - State.catPower(a));
    this.teamUids = sorted.slice(0, 3).map(c => c.uid);
    const chips = sorted.map(c => {
      const sp = GameData.speciesById(c.species);
      const sel = this.teamUids.includes(c.uid);
      return `<div class="chip ${sel ? 'sel' : ''}" data-uid="${c.uid}">
        <canvas width="44" height="38"></canvas>
        <div><div style="font-weight:700">${sp.name}</div><div class="tiny">⚔${State.catPower(c)} ❤${Math.round(c.affinity)}</div></div>
      </div>`;
    }).join('');
    this.panel(`<span class="card-close">×</span>
      <h2>发现野生 <span class="rarity-${wildSp.rarity}">${wildSp.name}</span></h2>
      <p class="sub">${wildSp.desc}</p>
      <canvas id="cp-wild" width="160" height="120" style="display:block;margin:4px auto;background:rgba(255,255,255,0.04);border-radius:12px"></canvas>
      <p class="center tiny">稀有度 <span class="rarity-${wildSp.rarity}">◆${rar.name}</span> · 越稀有斗志越强</p>
      <h3 style="margin:14px 0 6px;font-size:0.95rem">组建出战队伍（最多 3 只，点击选择）</h3>
      <div class="roster" id="cp-roster">${chips}</div>
      <p class="tiny">战斗玩法：WASD 移动 · 鼠标瞄准 · 左键猫爪 · Q/E 技能 · 空格闪避 · R 必杀 · 1/2/3 换猫 · P 自动</p>
      <div class="btn-row">
        <button class="btn gold" id="cp-go">开始战斗</button>
        <button class="btn" id="cp-ai">⚙️ AI策略</button>
        <button class="btn ghost" id="cp-cancel">放它走</button>
      </div>`);
    CatArt.renderCatThumb(document.getElementById('cp-wild'), wildSp);
    const roster = document.getElementById('cp-roster');
    const refreshSel = () => roster.querySelectorAll('.chip').forEach(ch => ch.classList.toggle('sel', this.teamUids.includes(ch.dataset.uid)));
    roster.querySelectorAll('.chip').forEach(chip => {
      const c = cats.find(x => x.uid === chip.dataset.uid);
      CatArt.renderCatThumb(chip.querySelector('canvas'), GameData.speciesById(c.species));
      chip.onclick = () => {
        const uid = chip.dataset.uid;
        const idx = this.teamUids.indexOf(uid);
        if (idx >= 0) { if (this.teamUids.length > 1) this.teamUids.splice(idx, 1); }  // keep at least 1
        else { if (this.teamUids.length >= 3) this.teamUids.shift(); this.teamUids.push(uid); }
        refreshSel();
      };
    });
    document.getElementById('cp-cancel').onclick = () => { this.closeAll(); document.getElementById('yard-actions').classList.remove('hidden'); };
    document.getElementById('cp-ai').onclick = () => this.openGambitEditor(wildSp);
    document.getElementById('cp-go').onclick = () => {
      // preserve the selection order; fall back to strongest if somehow empty
      const team = this.teamUids.map(uid => cats.find(x => x.uid === uid)).filter(Boolean);
      this.closeAll();
      this.game.startBattle(team.length ? team : [sorted[0]], wildSp);
    };
  },

  // ---- Gambit editor: configure each team cat's auto-battle rule list ----
  openGambitEditor(wildSp) {
    const cats = State.S.cats;
    const team = this.teamUids.map(uid => cats.find(x => x.uid === uid)).filter(Boolean);
    const S = window.Skills;
    if (!S || !team.length) { this.openCapturePrep(wildSp); return; }
    this._gbIdx = this._gbIdx || 0;
    if (this._gbIdx >= team.length) this._gbIdx = 0;
    const cat = team[this._gbIdx];
    const sp = GameData.speciesById(cat.species);
    if (!cat.gambits || !cat.gambits.length) cat.gambits = S.defaultGambits(cat).slice();

    const condOpts = S.GAMBIT_CONDITIONS.map(c => `<option value="${c.key}">${c.label}</option>`).join('');
    const actOpts = S.GAMBIT_ACTIONS.map(a => `<option value="${a.key}">${a.label}</option>`).join('');
    const tabs = team.map((c, i) => {
      const s = GameData.speciesById(c.species);
      return `<button class="gb-tab ${i === this._gbIdx ? 'sel' : ''}" data-i="${i}">${s.name}</button>`;
    }).join('');
    const rows = cat.gambits.map((r, i) => `
      <div class="gb-row" data-i="${i}">
        <span class="gb-num">${i + 1}</span>
        <span class="gb-if">若</span>
        <select class="gb-cond" data-i="${i}">${condOpts}</select>
        <span class="gb-then">→</span>
        <select class="gb-act" data-i="${i}">${actOpts}</select>
        <button class="gb-del" data-i="${i}">✕</button>
      </div>`).join('');

    this.panel(`<span class="card-close">×</span>
      <h2>⚙️ AI 策略 <span class="tiny">自上而下逐条判定</span></h2>
      <p class="sub">给每只猫配置自动战斗规则：满足「条件」就执行「动作」，最先命中的生效。</p>
      <div class="gb-tabs">${tabs}</div>
      <p class="tiny" style="margin:6px 0"><b>${sp.name}</b> · ${S.elementOf ? this.game.elemIcon(S.elementOf(cat.species)) : ''} 元素 · 技能：${(cat.loadout || []).map(id => { const sk = S.skillById(id); return sk ? sk.name : ''; }).filter(Boolean).join(' / ') || '默认'}</p>
      <div id="gb-list">${rows}</div>
      <div class="btn-row" style="margin-top:8px">
        <button class="btn ghost" id="gb-add">＋ 加一条</button>
        <button class="btn ghost" id="gb-reset">恢复默认</button>
      </div>
      <div class="btn-row">
        <button class="btn gold" id="gb-back">← 返回出战</button>
      </div>`);

    // set current values
    document.querySelectorAll('#gb-list .gb-cond').forEach(sel => { sel.value = cat.gambits[+sel.dataset.i].cond; });
    document.querySelectorAll('#gb-list .gb-act').forEach(sel => { sel.value = cat.gambits[+sel.dataset.i].act; });
    // wire changes
    document.querySelectorAll('#gb-list .gb-cond').forEach(sel => sel.onchange = () => { cat.gambits[+sel.dataset.i].cond = sel.value; State.save(); });
    document.querySelectorAll('#gb-list .gb-act').forEach(sel => sel.onchange = () => { cat.gambits[+sel.dataset.i].act = sel.value; State.save(); });
    document.querySelectorAll('#gb-list .gb-del').forEach(b => b.onclick = () => { if (cat.gambits.length > 1) { cat.gambits.splice(+b.dataset.i, 1); State.save(); this.openGambitEditor(wildSp); } });
    document.querySelectorAll('.gb-tab').forEach(b => b.onclick = () => { this._gbIdx = +b.dataset.i; this.openGambitEditor(wildSp); });
    document.getElementById('gb-add').onclick = () => { cat.gambits.push({ cond: 'always', act: 'basic' }); State.save(); this.openGambitEditor(wildSp); };
    document.getElementById('gb-reset').onclick = () => { cat.gambits = S.defaultGambits(cat).slice(); State.save(); this.openGambitEditor(wildSp); };
    document.getElementById('gb-back').onclick = () => this.openCapturePrep(wildSp);
  },

  openCatchResult(wildSp, newCat) {
    this.panel(`<span class="card-close">×</span>
      <h2 class="center">🎉 捕捉成功！</h2>
      <canvas id="cr" width="180" height="140" style="display:block;margin:8px auto"></canvas>
      <p class="center"><b class="rarity-${wildSp.rarity}">${wildSp.name}</b> 加入了你的大家庭！</p>
      <p class="sub center">${wildSp.desc}</p>
      <div class="btn-row" style="justify-content:center">
        <button class="btn" id="cr-ok">太好了</button>
      </div>`);
    CatArt.renderCatThumb(document.getElementById('cr'), wildSp);
    // celebratory sparkle
    document.getElementById('cr-ok').onclick = () => { this.closeAll(); document.getElementById('yard-actions').classList.remove('hidden'); };
  },

  // ---------- starter picker (first run) ----------
  openStarter(onPick) {
    const options = GameData.SPECIES.filter(s => s.rarity === 'N').slice(0, 3);
    const chips = options.map(sp => `<div class="dex-cell" data-id="${sp.id}">
      <canvas width="90" height="76"></canvas>
      <div class="name">${sp.name}</div>
      <div class="rarity rarity-N">普通</div>
      <div class="tiny">${sp.desc}</div>
    </div>`).join('');
    const p = document.getElementById('panel');
    p.innerHTML = `<div class="card"><h2 class="center">选择你的第一只猫猫</h2>
      <p class="sub center">它会陪你一起去捕捉更多伙伴</p>
      <div class="dex-grid">${chips}</div></div>`;
    p.classList.add('open');
    p.onclick = null;
    p.querySelectorAll('.dex-cell').forEach(cell => {
      const sp = GameData.speciesById(cell.dataset.id);
      CatArt.renderCatThumb(cell.querySelector('canvas'), sp);
      cell.onclick = () => { this.closeAll(); onPick(sp.id); };
    });
  },
};

function statLine(label, val) {
  const pct = Math.min(100, val * 3);
  return `<div class="stat-row"><span class="label">${label}</span><div class="bar xp"><span style="width:${pct}%"></span></div><span class="val">${val}</span></div>`;
}

window.UI = UI;
