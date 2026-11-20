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
      this.game.syncBattleModeUI();
      window.arcadeMetric?.('bond_auto_mode',{enabled:on});
    });
    const journey=document.getElementById('collection-goal');
    if(journey)journey.addEventListener('click',()=>this.openJourney());
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
    const visitors = (r.visitors || []).map(v => {
      const giftText = this.formatVisitorGift(v.gift);
      return `<div class="wb-visitor ${v.rare ? 'rare' : ''}"><b>${v.name}</b> 来访${giftText ? ' · 留下 ' + giftText : ''}${v.rare ? ' ✨稀客!' : ''}</div>`;
    }).join('');
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
  // Visitor gifts are resource dictionaries (e.g. {coins: 12, fish: 1}), not printable strings.
  formatVisitorGift(gift) {
    if (!gift || typeof gift !== 'object' || Array.isArray(gift)) return '';
    return Object.entries(gift)
      .filter(([, amount]) => Number.isFinite(amount) && amount > 0)
      .map(([resource, amount]) => `${this.resIcon(resource) || resource}+${amount}`)
      .join(' ');
  },
  resIcon(k) { return ({ coins: '🪙', fish: '🐟', yarn: '🧶', luck: '🍀', xp: '✨', treats: '🍖' })[k] || ''; },

  panel(html) {
    const p = document.getElementById('panel');
    p.innerHTML = `<div class="card">${html}</div>`;
    p.dataset.mandatory = 'false';
    p.classList.add('open');
    // clicking backdrop closes
    p.onclick = e => { if (e.target === p) this.closeAll(); };
  },
  closeAll() {
    const panel=document.getElementById('panel');
    panel.classList.remove('open');
    delete panel.dataset.mandatory;
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
    const chips = cats.map(c => { const sp = GameData.speciesById(c.species); const busy = window.Raising && Raising.isBusy && Raising.isBusy(c.uid); return `<div class="chip ${busy ? 'busy' : ''}" data-uid="${c.uid}"><canvas width="44" height="38"></canvas><div><div style="font-weight:700">${State.catName(c)}</div><div class="tiny">${busy ? '工作中' : 'Lv.' + c.level}</div></div></div>`; }).join('');
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
      return `<div class="dex-cell ${State.S.masteryBadges?.[c.species]?'golden-paw':''}" data-uid="${c.uid}">
        ${State.S.masteryBadges?.[c.species]?'<span class="golden-paw-stamp" title="Golden Paw · S rank">🏅 S</span>':''}
        <canvas width="90" height="76"></canvas>
        <div class="name">${State.catName(c)} <span class="tiny">Lv.${c.level}</span></div>
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
    const dispName = State.catName(cat);
    const sub = cat.nickname ? ` <span class="tiny" style="font-weight:400">· ${sp.name}</span>` : '';
    host.innerHTML = `
      <h2>${dispName}${sub} <span class="rarity-${sp.rarity}">◆${rar.name}</span> <span id="cd-rename" style="cursor:pointer;font-size:0.9rem" title="起名">✏️</span></h2>
      <p class="sub">${sp.desc}</p>
      ${State.S.masteryBadges?.[sp.id]
        ?'<p class="mastery-detail">🏅 '+(window.MorrowwishI18n?.get?.()==='zh'
          ?'金爪徽章已解锁 · 每三枚提高永久寻猫运气':'Golden Paw earned · Every 3 improve rare-cat odds')+'</p>':''}
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
        <button class="btn" id="cd-skills">📖 技能搭配</button>
        <button class="btn ghost" id="cd-pet">🤲 撸猫</button>
        <button class="btn ghost" id="cd-feed">🍖 喂食 (${feedCost}🪙)</button>
        <button class="btn ghost" id="cd-tease">🪶 逗猫</button>
      </div>`;
    // animated preview
    const cv = document.getElementById('cd-canvas');
    const cx = cv.getContext('2d');
    let tt = 0;
    const anim = () => {
      if (this.openCatUid !== cat.uid) return;
      tt += 0.03; cx.clearRect(0, 0, 120, 100);
      CatArt.drawCat(cx, 60, 70, { species: sp, scale: 1.15, face: 1, t: tt, pose: 'play', mood: cat.joy > 60 ? 'happy' : 'neutral', growth: window.Growth ? Growth.visual(cat) : null });
      requestAnimationFrame(anim);
    };
    anim();
    document.getElementById('cd-pet').onclick = () => {
      cat.affinity = Math.min(100, cat.affinity + 3); cat.joy = Math.min(100, cat.joy + 4);
      window.MorrowwishAudio?.effect?.('pet');
      State.addXp(cat, 4); State.save(); this.renderCatDetail(cat); this.game.toast('❤ 好感提升');
    };
    document.getElementById('cd-feed').onclick = () => {
      if (State.S.coins < feedCost) { this.game.toast('金币不足'); return; }
      State.S.coins -= feedCost; cat.hunger = Math.min(100, cat.hunger + 35); cat.joy = Math.min(100, cat.joy + 8);
      cat.affinity = Math.min(100, cat.affinity + 1); State.addXp(cat, 6);
      window.MorrowwishAudio?.effect?.('feed');
      State.save(); this.game.refreshHUD(); this.renderCatDetail(cat); this.game.toast('🍖 吃得好开心');
    };
    document.getElementById('cd-tease').onclick = () => this.openTease(cat);
    document.getElementById('cd-skills').onclick = () => this.openSkillEditor(cat);
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
    const renameBtn = document.getElementById('cd-rename');
    if (renameBtn) renameBtn.onclick = () => {
      const cur = cat.nickname || '';
      const name = (window.prompt('给它起个名字吧（最多6字）', cur) || '').trim().slice(0, 6);
      if (name !== null && name !== cur) { cat.nickname = name; State.save(); this.renderCatDetail(cat); this.game.toast(name ? '💛 ' + name + '，就是你啦！' : '已还原名字'); }
    };
    const evoBtn = document.getElementById('cd-evolve');
    if (evoBtn) evoBtn.onclick = () => this.doEvolve(cat);
    const growBtn = document.getElementById('cd-grow');
    if (growBtn) growBtn.onclick = () => this.doGrow(cat, null);
    document.querySelectorAll('#cat-detail [data-awaken]').forEach(b => b.onclick = () => this.doGrow(cat, b.dataset.awaken));
  },
  doGrow(cat, awakenKey) {
    const G = window.Growth; if (!G) return;
    const before = cat.stage || 0;
    const r = G.advance(cat, awakenKey);
    if (!r.ok) { this.game.toast('条件不足'); return; }
    State.save(); this.game.rebuildYard(); this.game.refreshHUD();
    const name = G.stageName(cat);
    if (cat.stage >= 2) this.openGrowthAnim(cat, name);
    else { this.renderCatDetail(cat); this.game.toast('🌟 成长为 ' + name + '！'); }
  },
  openGrowthAnim(cat, name) {
    const sp = GameData.speciesById(cat.species);
    const aw = window.Growth.AWAKEN[cat.awaken];
    const col = aw ? aw.color : '#ffd36b';
    this.panel(`<span class="card-close">×</span>
      <h2 class="center">★ 觉醒！</h2>
      <canvas id="evo-cv" width="200" height="170" style="display:block;margin:10px auto"></canvas>
      <p class="center">${sp.name} 觉醒为 <b style="color:${col}">${name}</b>！</p>
      <p class="sub center">${aw ? aw.desc : ''}</p>
      <div class="btn-row" style="justify-content:center"><button class="btn gold" onclick="UI.closeAll()">太棒了</button></div>`);
    const cv = document.getElementById('evo-cv'); const cx = cv.getContext('2d'); let tt = 0;
    const anim = () => {
      if (!document.getElementById('evo-cv')) return;
      tt += 0.04; cx.clearRect(0, 0, 200, 170);
      cx.save(); cx.translate(100, 95); cx.globalAlpha = 0.5;
      for (let i = 0; i < 14; i++) { cx.rotate(Math.PI / 7 + tt * 0.6); cx.fillStyle = withA2(col, 0.3); cx.fillRect(0, -3, 120, 6); }
      cx.restore();
      CatArt.drawCat(cx, 100, 105, { species: sp, scale: 1.3, face: 1, t: tt, pose: 'sit', mood: 'happy', growth: window.Growth.visual(cat) });
      requestAnimationFrame(anim);
    };
    anim();
  },

  // growth-form (成长形态) row + optional species 蜕变 row
  evoRowHtml(cat) {
    let html = this.growthRowHtml(cat);
    html += this.speciesEvoRowHtml(cat);
    return html;
  },
  // universal growth-form advancement (幼→成→灵觉醒)
  growthRowHtml(cat) {
    const G = window.Growth; if (!G) return '';
    const st = cat.stage || 0;
    const stageName = G.stageName(cat);
    if (st >= 2) {
      const aw = G.AWAKEN[cat.awaken];
      return `<div class="evo-row ready"><div class="evo-info">★ 已觉醒 <b style="color:${aw ? aw.color : '#ffd36b'}">${stageName}</b><div class="tiny">${aw ? aw.desc : ''} · 最终形态</div></div></div>`;
    }
    const chk = G.canAdvance(cat);
    const nextName = st === 0 ? '成形态' : '灵·觉醒';
    const reqStr = chk.ok ? '条件已满足！' : ('还需 ' + chk.missing.join(' · '));
    if (st === 1) {
      // awakening choice buttons
      return `<div class="evo-row ${chk.ok ? 'ready' : ''}">
        <div class="evo-info">★ 可觉醒为 <b>灵形态</b><div class="tiny">${reqStr}${chk.ok ? ' · 选择觉醒之路：' : ''}</div></div>
        ${chk.ok ? `<div class="awaken-pick">
          <button class="btn gold tiny-btn" data-awaken="pow">💪力</button>
          <button class="btn gold tiny-btn" data-awaken="agi">⚡速</button>
          <button class="btn gold tiny-btn" data-awaken="cha">💖心</button>
        </div>` : ''}
      </div>`;
    }
    return `<div class="evo-row ${chk.ok ? 'ready' : ''}">
      <div class="evo-info">${G.stageTag(cat) || '🐣'} 当前 <b>${stageName}</b> · 可成长为 <b>${nextName}</b><div class="tiny">${reqStr}</div></div>
      <button class="btn ${chk.ok ? 'gold' : ''}" id="cd-grow" ${chk.ok ? '' : 'disabled'}>成长</button>
    </div>`;
  },
  // species 蜕变 (the rarer, flavor evolution that swaps species)
  speciesEvoRowHtml(cat) {
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
      <div class="evo-info">🦋 可蜕变为 <b>${toSp.name}</b><div class="tiny">特殊变身 · ${reqStr}</div></div>
      <button class="btn ${ready ? 'gold' : ''}" id="cd-evolve" ${ready ? '' : 'disabled'}>蜕变</button>
    </div>`;
  },
  // ---- 技能搭配: learn & swap each loadout slot ----
  openSkillEditor(cat) {
    const S = window.Skills; if (!S) { this.openCatDetail(cat); return; }
    S.ensureLoadout(cat);
    const learn = S.learnableSkills(cat) || [];          // all skills this cat MAY slot
    const slots = [
      { i: 0, label: '普攻', kinds: ['melee', 'projectile'] },
      { i: 1, label: '技能1', kinds: ['melee', 'projectile', 'dash', 'buff', 'heal', 'aoe'] },
      { i: 2, label: '技能2', kinds: ['melee', 'projectile', 'dash', 'buff', 'heal', 'aoe'] },
      { i: 3, label: '必杀', kinds: ['aoe'], ult: true },
    ];
    const icon = sk => this.game.skillIcon ? this.game.skillIcon(sk) : '🐾';
    const kindName = { melee: '近战', projectile: '远程', dash: '突进', buff: '增益', heal: '治疗', aoe: '范围' };
    const rows = slots.map(slot => {
      const cur = S.skillById(cat.loadout[slot.i]);
      // candidates: learnable, matching the slot's allowed kinds, ult-slot only ults
      const opts = learn.filter(s => (slot.ult ? s.ultCost > 0 : s.ultCost === 0) && slot.kinds.indexOf(s.kind) >= 0);
      const chips = opts.map(s => {
        const on = cur && s.id === cur.id;
        return `<button class="sk-chip ${on ? 'on' : ''}" data-slot="${slot.i}" data-sk="${s.id}" title="${s.desc || ''}">${icon(s)} ${s.name}<span class="tiny">${kindName[s.kind] || ''}·${this.game.elemIcon(s.element)}</span></button>`;
      }).join('') || '<span class="tiny">暂无可选（提升等级/好感解锁）</span>';
      return `<div class="sk-slot"><div class="sk-slot-label">${slot.label}<div class="tiny">${cur ? cur.name : '空'}</div></div><div class="sk-opts">${chips}</div></div>`;
    }).join('');
    this.panel(`<span class="card-close">×</span>
      <h2>📖 ${State.catName(cat)} · 技能搭配</h2>
      <p class="sub">点击学习/切换每个槽位的技能。元素克制、连招、状态都看搭配！可学范围随等级与好感解锁。</p>
      <div class="sk-list">${rows}</div>
      <div class="btn-row"><button class="btn gold" id="sk-back">← 返回</button></div>`);
    this.panel && document.querySelectorAll('#panel .sk-chip').forEach(b => b.onclick = () => {
      const slotI = +b.dataset.slot, skId = b.dataset.sk;
      cat.loadout = cat.loadout.slice(); cat.loadout[slotI] = skId;
      State.save(); this.openSkillEditor(cat);
      this.game.toast('已装备 ' + (S.skillById(skId) || {}).name);
    });
    document.getElementById('sk-back').onclick = () => this.openCatDetail(cat);
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
    const en=window.MorrowwishI18n?.get?.()!=='zh';
    const mastery=this.game.masteryStatus();
    const cells = GameData.SPECIES.map(sp => {
      const count = State.S.dex[sp.id] || 0;
      const locked = count === 0;
      const mastered=!!State.S.masteryBadges?.[sp.id];
      const best=State.S.bestGrades?.[sp.id];
      return `<div class="dex-cell ${locked ? 'locked' : ''} ${mastered?'golden-paw':''}" data-id="${sp.id}">
        ${mastered?'<span class="golden-paw-stamp" title="Golden Paw · S rank">🏅 S</span>'
          :best?'<span class="battle-best-stamp">'+best+'</span>':''}
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
      <p class="sub">${en?'Discover breeds and earn an S-rank Golden Paw for each one.'
        :'发现不同猫咪，为每个品种挑战 S 级「金爪徽章」。'}</p>
      <div class="mastery-summary">
        <b>🏅 ${en?'Golden Paws':'金爪徽章'} ${mastery.medals}/${mastery.total}</b>
        <span>${en?'Every 3 medals permanently improve rare-encounter odds.'
          :'每获得 3 枚徽章，永久增加稀有猫的遭遇机会。'}</span>
        <small>${en?'Permanent rarity-weight boost':'当前永久稀有权重加成'}：+${Math.round(mastery.luckBonus*100)}%</small>
      </div>
      <div class="dex-grid">${cells}</div>`);
    document.querySelector('#panel .card')?.classList.add('cat-highlight-card');
    document.querySelectorAll('#panel .dex-cell').forEach(cell => {
      const sp = GameData.speciesById(cell.dataset.id);
      if (!cell.classList.contains('locked')) CatArt.renderCatThumb(cell.querySelector('canvas'), sp);
      cell.addEventListener('click', () => {
        if (State.S.dex[sp.id]) this.panel(`<span class="card-close">×</span>
          <h2>${sp.name} <span class="rarity-${sp.rarity}">◆${GameData.RARITY[sp.rarity].name}</span></h2>
          <p class="sub">${sp.desc}</p>
          <p class="mastery-detail">${State.S.masteryBadges?.[sp.id]
            ?(en?'🏅 Golden Paw earned · S rank':'🏅 金爪徽章已解锁 · S 评级')
            :(en?'Best: '+(State.S.bestGrades?.[sp.id]||'—')+' · Earn S to unlock the Golden Paw'
              :'最佳战绩：'+(State.S.bestGrades?.[sp.id]||'暂无')+' · 达到 S 评级可获得金爪徽章')}</p>
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
      window.MorrowwishAudio?.effect?.('feed');
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
    const firstCapture=(State.S.catchCount||0)===0;
    const english=window.MorrowwishI18n?.get?.()!=='zh';
    const hasMedal=!!State.S.masteryBadges?.[wildSp.id];
    const deadline=this.game.gradeTimeLimit(wildSp.rarity);
    const masteryChallenge=english
      ?('🏅 S challenge: Win in '+deadline+'s · Keep 70% HP · 6-hit combo or perfect dodge. '
        +(hasMedal?'Golden Paw already earned.':'First S unlocks a permanent Golden Paw and a rare-cat lure.'))
      :('🏅 S 评级：'+deadline+'秒内获胜 · 保持70%血量 · 6连击或完美闪避。'
        +(hasMedal?'该品种已有金爪徽章。':'首次 S 解锁永久金爪徽章和稀有猫诱饵。'));
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
        <div><div style="font-weight:700">${State.catName(c)}</div><div class="tiny">⚔${State.catPower(c)} ❤${Math.round(c.affinity)}</div></div>
      </div>`;
    }).join('');
    const newBreed=!State.S.dex[wildSp.id];
    const rareText=wildSp.rarity==='SSR'?'👑 传说邂逅'
      :wildSp.rarity==='SR'?'🌟 史诗邂逅'
      :wildSp.rarity==='R'?'✨ 稀有邂逅'
      :newBreed?'🐾 新品种发现':'🐾 熟悉的朋友';
    this.panel(`<span class="card-close">×</span>
      <div class="sighting-badge rarity-${wildSp.rarity}">${rareText}</div>
      <h2>发现野生 <span class="rarity-${wildSp.rarity}">${wildSp.name}</span></h2>
      <p class="sub">${wildSp.desc}</p>
      <canvas id="cp-wild" width="160" height="120" style="display:block;margin:4px auto;background:rgba(255,255,255,0.04);border-radius:12px"></canvas>
      <p class="center tiny">稀有度 <span class="rarity-${wildSp.rarity}">◆${rar.name}</span> · 越稀有斗志越强</p>
      ${firstCapture?'':'<p class="center tiny capture-challenge">'+masteryChallenge+'</p>'}
      <h3 style="margin:14px 0 6px;font-size:0.95rem">${firstCapture?'你的猫咪准备好出战啦！':'组建出战队伍（最多 3 只，点击选择）'}</h3>
      <div class="roster" id="cp-roster" style="${firstCapture?'display:none':''}">${chips}</div>
      <p class="tiny">${firstCapture?'电脑按住鼠标左键攻击；手机右半屏按住攻击、左半屏移动。打赢就能收服！':'战斗玩法：WASD 移动 · 鼠标瞄准 · 左键猫爪 · Q/E 技能 · 空格闪避 · R 必杀 · 1/2/3 换猫 · P 自动'}</p>
      <div class="btn-row">
        <button class="btn gold" id="cp-go">${firstCapture?'出发！收服这只猫':'开始战斗'}</button>
        <button class="btn" id="cp-ai" style="${firstCapture?'display:none':''}">⚙️ AI策略</button>
        <button class="btn ghost" id="cp-cancel">放它走</button>
      </div>`);
    document.querySelector('#panel .card')?.classList.add('cat-highlight-card');
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

  openCatchResult(wildSp, newCat, rewards=[], performance=null, masteryReward=null) {
    const status=this.game.collectionStatus();
    const exploring=this.game.scene==='map';
    const english=window.MorrowwishI18n?.get?.()!=='zh';
    const name=wildSp.name;
    const headline=english?'A new friend joined!':'新伙伴加入啦！';
    const totalText=english
      ?'Cat collection '+status.count+'/'+status.total
      :'猫咪图鉴 '+status.count+'/'+status.total;
    const goalText=status.next===null
      ?(english?'Every breed discovered!':'全部品种已收集！')
      :(english?'Next goal: '+status.next+' breeds':'下一目标：收集 '+status.next+' 种猫咪');
    const grade=performance?.grade||'C';
    const mastery=this.game.masteryStatus();
    const medalMessage=masteryReward
      ?(english?'First S on this breed! +1 rare-cat lure · +15 new cat affection'
        :'该品种首次达成 S 级！+1 幸运诱饵 · 新猫好感 +15')
      :'';
    const gradeLabel=english?'Battle grade':'战斗评级';
    const battleResult=performance
      ?(english?'Bonus: +'+performance.bonusCoins+' coins'+(performance.bonusTreats?' · +'+performance.bonusTreats+' treats':'')
        :'战斗奖励：+'+performance.bonusCoins+' 金币'+(performance.bonusTreats?' · +'+performance.bonusTreats+' 零食':''))
      :'';
    const rewardText=rewards.length
      ?rewards.map(r=>english
        ?('Collection bonus: +'+r.coins+' coins, +'+r.treats+' treats')
        :('图鉴奖励：+'+r.coins+' 金币，+'+r.treats+' 零食')).join(' · ')
      :'';
    this.panel(`<span class="card-close">×</span>
      <h2 class="center">🎉 ${headline}</h2>
      <canvas id="cr" width="180" height="140" style="display:block;margin:8px auto"></canvas>
      <p class="center"><b class="rarity-${wildSp.rarity}">${name}</b> ${english?'joined your yard':'已加入庭院'}</p>
      <p class="sub center">${totalText} · ${goalText}</p>
      ${performance?'<div class="battle-grade grade-'+grade+'"><b>'+grade+'</b><div><strong>'+gradeLabel+'</strong><small>'+battleResult+' · '+performance.combo+' '+(english?'best combo':'最高连击')+'</small></div></div>':''}
      ${rewardText?'<p class="center collection-reward">🎁 '+rewardText+'</p>':''}
      ${masteryReward?'<div class="golden-paw-unlock"><strong>🏅 '+(english?'GOLDEN PAW UNLOCKED!':'金爪徽章解锁！')+'</strong><p>'+medalMessage+'</p><small>'
        +(english?'Medals':'已获徽章')+' '+mastery.medals+'/'+mastery.total+' · '
        +(english?'Permanent rare-weight boost':'永久稀有权重加成')+' +'+Math.round(mastery.luckBonus*100)+'%</small></div>':''}
      <div class="btn-row" style="justify-content:center">
        <button class="btn gold" id="cr-next">${english?(exploring?'Keep exploring':'Find another wild cat'):(exploring?'继续探索':'再找一只野猫')}</button>
        <button class="btn" id="cr-ok">${english?(exploring?'Back to map':'Back to yard'):(exploring?'返回地图':'回庭院')}</button>
        <button class="btn ghost" id="cr-journey">${english?'What else can I do?':'还有什么可以玩？'}</button>
        ${masteryReward?'<button class="btn gold" id="cr-medal">'+(english?'View medal collection':'查看金爪徽章')+'</button>':''}
      </div>`);
    document.querySelector('#panel .card')?.classList.add('cat-highlight-card');
    CatArt.renderCatThumb(document.getElementById('cr'),wildSp);
    const dismiss=()=>{
      this.closeAll();
      if(this.game.scene==='yard')document.getElementById('yard-actions').classList.remove('hidden');
      this.game.refreshCollectionGoal();
    };
    document.getElementById('cr-ok').onclick=dismiss;
    document.getElementById('cr-journey').onclick=()=>this.openJourney();
    const medalButton=document.getElementById('cr-medal');
    if(medalButton)medalButton.onclick=()=>this.openDex();
    document.getElementById('cr-next').onclick=()=>{
      dismiss();
      if(this.game.scene==='yard'&&!this.game.yard.hide)this.game.yard.startHideAndSeek();
      window.arcadeMetric?.('bond_continue_search');
    };
  },

  // Show meaningful next activities instead of keeping players in a catch-only loop.
  openJourney(){
    const status=this.game.collectionStatus();
    const mastery=this.game.masteryStatus();
    const adv=this.game.adventureStatus();
    const en=window.MorrowwishI18n?.get?.()!=='zh';
    const target=status.next||status.total;
    const petTarget=[3,10,25].find(n=>adv.pets<n)||25;
    const exploreText=en
      ?(adv.unlocked<=1?'Explore 40% of Home to unlock Sakura Woods'
        :adv.unlocked+'/'+adv.totalRegions+' regions unlocked')
      :(adv.unlocked<=1?'探索庭院地区 40%，解锁樱花林'
        :'已解锁 '+adv.unlocked+'/'+adv.totalRegions+' 个探索区域');
    this.panel(`<span class="card-close">×</span>
      <h2 class="center">${en?'🧭 Your Cat Adventure':'🧭 猫猫冒险手册'}</h2>
      <p class="sub center">${en?'Collect new friends, build bonds and unlock hidden places.'
        :'收集新朋友、培养感情、探索更广阔的猫咪世界。'}</p>
      <div class="journey-paths">
        <article class="journey-path">
          <div class="journey-icon">🐾</div>
          <div class="journey-copy"><b>${en?'Collect cats':'猫咪图鉴'}</b>
            <p>${en?'Discovered '+status.count+'/'+status.total+' · Next bonus at '+target
              :'已发现 '+status.count+'/'+status.total+' 种 · '+target+' 种时可领取奖励'}</p>
            <div class="journey-progress"><span style="width:${Math.min(100,status.count/target*100)}%"></span></div>
          </div><button class="btn gold" id="journey-collect">${en?'Find':'寻找'}</button>
        </article>
        <article class="journey-path">
          <div class="journey-icon">💞</div>
          <div class="journey-copy"><b>${en?'Bond with your cats':'和猫咪培养感情'}</b>
            <p>${en?'Pet your cats '+adv.pets+'/'+petTarget+' times to earn rewards'
              :'撸猫 '+adv.pets+'/'+petTarget+' 次可获得亲密奖励'}</p>
            <div class="journey-progress"><span style="width:${Math.min(100,adv.pets/petTarget*100)}%"></span></div>
          </div><button class="btn gold" id="journey-bond">${en?'Pet':'撸猫'}</button>
        </article>
        <article class="journey-path">
          <div class="journey-icon">🗺️</div>
          <div class="journey-copy"><b>${en?'Explore new places':'探索新区域'}</b>
            <p>${exploreText}</p>
            <div class="journey-progress"><span style="width:${Math.min(100,adv.unlocked<=1?adv.homeExplored/40*100:adv.unlocked/adv.totalRegions*100)}%"></span></div>
          </div><button class="btn gold" id="journey-explore">${en?'Explore':'探索'}</button>
        </article>
      <div class="journey-master-row">
        <div><b>🏅 ${en?'Golden Paw challenge':'金爪评级挑战'} ${mastery.medals}/${mastery.total}</b>
          <p>${en?'Earn 3 S medals to permanently improve rare-cat odds. Boost: +'
            :'每 3 枚 S 级徽章永久提升遇稀有猫机会 · 当前稀有权重 +'}${Math.round(mastery.luckBonus*100)}%${en?' rare weight':''}</p>
        </div>
        <button class="btn gold" id="journey-mastery">${en?'Medals':'看徽章'}</button>
      </div>
      </div>`);
    document.querySelector('#panel .card')?.classList.add('cat-highlight-card');
    document.getElementById('journey-mastery').onclick=()=>this.openDex();
    document.getElementById('journey-collect').onclick=()=>{
      this.closeAll();
      if(this.game.scene==='map'){this.game.scene='yard';this.game.showYardChrome();}
      if(!this.game.yard.hide)this.game.yard.startHideAndSeek();
    };
    document.getElementById('journey-bond').onclick=()=>{
      this.closeAll();
      if(this.game.scene==='map'){this.game.scene='yard';this.game.showYardChrome();}
      this.game.toast(en?'Tap a cat in the yard to earn affection!':'点击庭院里的猫咪，提高好感并领取奖励！');
    };
    document.getElementById('journey-explore').onclick=()=>{this.closeAll();this.game.openWorldMap();};
  },

  // ---------- starter picker (first run) ----------
  openStarter(onPick) {
    const options = GameData.SPECIES.filter(s => s.rarity === 'N').slice(0, 3);
    const chips = options.map(sp => `<button type="button" class="dex-cell" data-id="${sp.id}" aria-label="选择 ${sp.name}">
      <canvas width="90" height="76"></canvas>
      <div class="name">${sp.name}</div>
      <div class="rarity rarity-N">普通</div>
      <div class="tiny">${sp.desc}</div>
    </button>`).join('');
    const p = document.getElementById('panel');
    p.innerHTML = `<div class="card cat-highlight-card cat-starter-card"><h2 class="center">选择你的第一只猫猫</h2>
      <p class="sub center">它会陪你一起去捕捉更多伙伴</p>
      <div class="dex-grid">${chips}</div></div>`;
    p.dataset.mandatory = 'true';
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
function withA2(h, a) { if (!h || h[0] !== '#') return h || '#fff'; const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; }

window.UI = UI;
