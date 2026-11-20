// worldmap.js — semi-open-world region map + in-region exploration.
// Self-contained scene module. Exposes a single global: window.WorldMap.
// Does NOT implement battle/capture — it only DETECTS an encounter and hands
// off to a callback the integrator wires to the existing capture battle.
//
// =====================================================================
// INTEGRATION GUIDE (the integrator has not seen this code)
// =====================================================================
// 1) Load order — add AFTER data.js / state.js / catart.js, before main.js:
//      <script src="js/worldmap.js"></script>
//
// 2) Boot — inside Game.start(), after State.load():
//      WorldMap.init(this);                 // stores refs, ensures save sub-state
//      WorldMap.onEncounter((species, regionId) => {
//        // species is a GameData SPECIES object rolled from the region pool.
//        // Start the normal capture battle with the player's current team.
//        const team = this.pickBattleTeam ? this.pickBattleTeam() : State.S.cats.slice(0, 3);
//        this.startBattle(team, species);    // existing Game.startBattle(team, wildSpecies)
//        // When startBattle flips this.scene to 'battle', WorldMap stops drawing.
//        // After the battle ends you can return to the region with:
//        //   this.scene = 'map'; WorldMap.enterRegion(WorldMap.currentRegion);
//      });
//      WorldMap.onCollect((reward) => {
//        // reward = { coins, treats, fish, label }  (any field may be 0/absent)
//        if (reward.coins)  State.S.coins  += reward.coins;
//        if (reward.treats) State.S.treats += reward.treats;
//        if (reward.fish)   State.S.fish   += reward.fish;
//        State.save(); this.refreshHUD();
//        this.toast('📦 ' + (reward.label || '拾获补给'));
//      });
//
// 3) Scene switching — this module uses ONE scene string: 'map'.
//    Treat Game.scene === 'map' as "WorldMap owns the frame". Suggested wiring:
//      // enter the overworld (e.g. from a tab-bar button):
//      openWorldMap() { this.scene = 'map'; WorldMap.enterMap(); }
//    WorldMap has two internal sub-modes ('map' node-graph / 'region' explore);
//    the integrator only ever sees the single 'map' scene string.
//
// 4) Main loop — in Game.update(dt) / Game.draw():
//      else if (this.scene === 'map') WorldMap.update(dt);     // in update()
//      else if (this.scene === 'map') WorldMap.draw(ctx);      // in draw()
//    update() reads game.keys (WASD / arrows) and game.mouse for region movement,
//    so no extra key wiring is needed — it polls the same maps the battle uses.
//
// 5) Input routing — in Game.bindInput()'s pointer-down handler add a branch:
//      else if (this.scene === 'map') WorldMap.handleTap(x, y);
//    (x,y are canvas-space, same coords already computed for yardTap.)
//    Clicking the ← / 返回 hint or pressing Escape leaves map mode; the integrator
//    decides where to go back to, e.g.:
//      WorldMap.onExit(() => { this.scene = 'yard'; });
//
// 6) Save fields — all persistent state lives under State.S.worldmap (auto-created
//    by init()). Shape:
//      State.S.worldmap = {
//        current: 'home',              // last region entered
//        unlocked: { home:true, ... }, // regionId -> bool
//        regions: {                    // regionId -> progress
//          home: { explored: 0,        //   0..1 fraction of area revealed
//                  nodes: [],          //   collected collectible ids (persist)
//                  cleared: false } }  //   reached unlock threshold once
//      };
//    Nothing else is written. State.save() is called by WorldMap on meaningful
//    changes (collect, unlock, region enter); the existing autosave also covers it.
//
// 7) Public API (window.WorldMap):
//      init(game) / enterMap() / enterRegion(id)
//      update(dt) / draw(ctx) / handleTap(x,y)
//      onEncounter(fn(speciesObj, regionId))
//      onCollect(fn(reward))  / onExit(fn())
//      isUnlocked(id) -> bool
//      currentRegion   (getter, regionId string)
//      REGIONS         (the data table, read-only use)
// =====================================================================

(function () {
  'use strict';

  // ---- dusk palette (Morrow · Wish) ----
  var BG = '#1b1026', PINK = '#ffb3c7', PURPLE = '#9d7bff', GOLD = '#ffd36b';

  // ---------------------------------------------------------------
  // REGION DATA TABLE
  //  speciesPool spreads the ~20 existing species by rarity:
  //  commons in early regions, SSR only in the late ones.
  //  node = position on the stylized map (0..1 of map canvas).
  //  unlock.explore = required explored fraction of `after` region.
  //  unlock.own = optional key speciesId whose ownership is also required.
  // ---------------------------------------------------------------
  var REGIONS = [
    {
      id: 'home', name: '庭院', sub: 'Home',
      node: { x: 0.16, y: 0.74 }, difficulty: 1,
      theme: { sky1: '#241634', sky2: '#3a2d4e', ground: '#3a5a40', ground2: '#588157', accent: '#9be7c4' },
      speciesPool: ['tangyuan', 'doudou', 'xiaohui', 'niuniu', 'nietu'],
      unlock: null, // always open
      desc: '熟悉的后院，新手猫猫的乐园。',
    },
    {
      id: 'sakura', name: '樱花林', sub: 'Sakura Woods',
      node: { x: 0.37, y: 0.52 }, difficulty: 2,
      theme: { sky1: '#2e1a30', sky2: '#4a2a44', ground: '#7a4a66', ground2: '#b06a90', accent: PINK },
      speciesPool: ['nainai', 'moqiu', 'sanhua', 'yunduo', 'yinghua'],
      unlock: { after: 'home', explore: 0.4 },
      desc: '粉樱纷飞的林间，稀有猫猫出没。',
    },
    {
      id: 'creek', name: '溪谷', sub: 'Creek Valley',
      node: { x: 0.58, y: 0.68 }, difficulty: 3,
      theme: { sky1: '#122436', sky2: '#1e3c54', ground: '#2f5a6a', ground2: '#4d879a', accent: '#8fd3ff' },
      speciesPool: ['lanbao', 'dundun', 'lixiao', 'zherdd', 'youling'],
      unlock: { after: 'sakura', explore: 0.5 },
      desc: '清凉溪水穿谷而过，史诗猫猫在此栖息。',
    },
    {
      id: 'volcano', name: '火山口', sub: 'Volcano',
      node: { x: 0.74, y: 0.36 }, difficulty: 4,
      theme: { sky1: '#2a1410', sky2: '#4a1e14', ground: '#5a241a', ground2: '#9a3a1f', accent: '#ff6a1f' },
      speciesPool: ['senlin', 'xianluo', 'jinwu'],
      unlock: { after: 'creek', explore: 0.6, own: 'youling' },
      desc: '灼热的火山口，传说之火焰猫金乌沉睡于此。',
    },
    {
      id: 'ruins', name: '月影遗迹', sub: 'Moonshadow Ruins',
      node: { x: 0.9, y: 0.6 }, difficulty: 5,
      theme: { sky1: '#17102e', sky2: '#2f2650', ground: '#3a2f66', ground2: '#5a4a9a', accent: PURPLE },
      speciesPool: ['youling', 'yuelian', 'xingchen'],
      unlock: { after: 'volcano', explore: 0.7, own: 'jinwu' },
      desc: '月光笼罩的古老遗迹，最稀有的传说猫沉眠在星河之中。',
    },
  ];
  function regionById(id) { for (var i = 0; i < REGIONS.length; i++) if (REGIONS[i].id === id) return REGIONS[i]; return null; }

  // ---- module-internal state ----
  var game = null;
  var mode = 'map';                 // 'map' | 'region'
  var cur = 'home';                 // current region id
  var cbEncounter = null, cbCollect = null, cbExit = null;
  var world = null;                 // active region runtime (player/camera/entities)
  var t = 0;                        // local clock
  var mapNodes = [];                // cached {region, px, py, r} for hit-testing
  var toastCd = 0;

  // region world dimensions (bigger than screen → scrollable)
  var WORLD_W = 1800, WORLD_H = 1300;
  var GRID_C = 10, GRID_R = 7;      // fog-of-exploration grid for explored %

  // ================================================================
  // SAVE / UNLOCK
  // ================================================================
  function ensureSave() {
    var S = window.State.S;
    if (!S.worldmap) S.worldmap = { current: 'home', unlocked: {}, regions: {} };
    var wm = S.worldmap;
    if (!wm.unlocked) wm.unlocked = {};
    if (!wm.regions) wm.regions = {};
    wm.unlocked.home = true;       // home is always open
    for (var i = 0; i < REGIONS.length; i++) {
      var id = REGIONS[i].id;
      if (!wm.regions[id]) wm.regions[id] = { explored: 0, nodes: [], cleared: false };
    }
    if (!wm.current) wm.current = 'home';
    return wm;
  }

  function owns(speciesId) {
    var dex = window.State.S.dex || {};
    if (dex[speciesId]) return true;
    var cats = window.State.S.cats || [];
    for (var i = 0; i < cats.length; i++) if (cats[i].species === speciesId) return true;
    return false;
  }

  function isUnlocked(id) {
    var wm = ensureSave();
    if (wm.unlocked[id]) return true;
    var r = regionById(id);
    if (!r || !r.unlock) return !!(r && !r.unlock);
    var prev = wm.regions[r.unlock.after];
    var okExplore = prev && prev.explored >= r.unlock.explore;
    var okOwn = !r.unlock.own || owns(r.unlock.own);
    return !!(okExplore && okOwn);
  }

  // Promote newly-satisfied unlocks into the save and toast once.
  function refreshUnlocks() {
    var wm = ensureSave();
    for (var i = 0; i < REGIONS.length; i++) {
      var r = REGIONS[i];
      if (!wm.unlocked[r.id] && isUnlocked(r.id)) {
        wm.unlocked[r.id] = true;
        if (game && game.toast) game.toast('🗺️ 新区域解锁：' + r.name + '！');
        if (typeof window.arcadeMetric === 'function') window.arcadeMetric('region_unlock', { region: r.id });
        window.State.save();
      }
    }
  }

  function unlockHint(r) {
    if (!r.unlock) return '';
    var prev = regionById(r.unlock.after);
    var parts = ['探索「' + (prev ? prev.name : '') + '」至 ' + Math.round(r.unlock.explore * 100) + '%'];
    if (r.unlock.own) {
      var sp = window.GameData.speciesById(r.unlock.own);
      parts.push('并拥有「' + (sp ? sp.name : r.unlock.own) + '」');
    }
    return '需 ' + parts.join(' ');
  }

  // ================================================================
  // PUBLIC: lifecycle
  // ================================================================
  function init(g) {
    game = g;
    ensureSave();
    cur = window.State.S.worldmap.current || 'home';
    refreshUnlocks();
  }
  function onEncounter(fn) { cbEncounter = fn; }
  function onCollect(fn) { cbCollect = fn; }
  function onExit(fn) { cbExit = fn; }

  function enterMap() {
    mode = 'map';
    refreshUnlocks();
  }

  function enterRegion(id) {
    if (!isUnlocked(id)) {
      if (game && game.toast) game.toast('🔒 区域未解锁');
      return false;
    }
    cur = id;
    var wm = ensureSave();
    wm.current = id;
    window.State.save();
    buildRegion(id);
    mode = 'region';
    return true;
  }

  // ================================================================
  // REGION RUNTIME
  // ================================================================
  function playerSpecies() {
    var cats = window.State.S.cats || [];
    if (cats.length) {
      var sp = window.GameData.speciesById(cats[0].species);
      if (sp) return sp;
    }
    return window.GameData.speciesById('tangyuan') || window.GameData.SPECIES[0];
  }

  function buildRegion(id) {
    var r = regionById(id);
    var wm = ensureSave();
    var prog = wm.regions[id];
    // seeded-ish scatter (Math.random is fine; layout only lives per-visit)
    var spawns = [], nodes = [], decor = [];
    var pool = r.speciesPool;
    var nSpawn = 5 + r.difficulty;           // more wild cats in harder regions
    for (var i = 0; i < nSpawn; i++) {
      spawns.push({
        x: 180 + Math.random() * (WORLD_W - 360),
        y: 180 + Math.random() * (WORLD_H - 360),
        sp: pool[Math.floor(Math.random() * pool.length)],
        cd: 0,                                // encounter cooldown after trigger
        bob: Math.random() * 6.28,
      });
    }
    var nNode = 6;
    for (var j = 0; j < nNode; j++) {
      var nid = id + '_n' + j;
      nodes.push({
        id: nid, x: 160 + Math.random() * (WORLD_W - 320), y: 160 + Math.random() * (WORLD_H - 320),
        taken: prog.nodes.indexOf(nid) >= 0, kind: Math.random() < 0.3 ? 'rare' : 'coin', bob: Math.random() * 6.28,
      });
    }
    // parallax decor blobs (themed shrubs / rocks / crystals)
    for (var k = 0; k < 40; k++) {
      decor.push({
        x: Math.random() * WORLD_W, y: Math.random() * WORLD_H,
        r: 14 + Math.random() * 40, layer: Math.random() < 0.5 ? 0.4 : 0.8,
        a: 0.08 + Math.random() * 0.14,
      });
    }
    // visited grid (restore explored% but start fresh fog each visit)
    var grid = [];
    for (var c = 0; c < GRID_C * GRID_R; c++) grid.push(false);

    world = {
      region: r,
      px: WORLD_W * 0.12, py: WORLD_H * 0.5,   // player start near the portal
      pvx: 0, pvy: 0, face: 1, t: 0, walkT: 0, moving: false,
      cam: { x: 0, y: 0 },
      target: null,
      spawns: spawns, nodes: nodes, decor: decor,
      grid: grid, visited: 0,
      portal: { x: WORLD_W * 0.08, y: WORLD_H * 0.5 },
      flash: 0,
    };
    // seed explored fraction already achieved (so the bar reflects saved progress)
    world.baseExplored = prog.explored || 0;
  }

  function update(dt) {
    t += dt;
    if (toastCd > 0) toastCd -= dt;
    if (mode === 'map') { refreshUnlocks(); return; }
    if (!world) return;
    updateRegion(dt);
  }

  function setDestination(sx,sy){
    if(mode!=='region'||!world||!game)return false;
    world.panMode=false;
    world.target={x:Math.max(60,Math.min(WORLD_W-60,world.cam.x+sx)),
      y:Math.max(60,Math.min(WORLD_H-60,world.cam.y+sy))};
    return true;
  }

  // Physically pan the 1800x1300 meadow; stop following the avatar until tapped.
  function panBy(dx,dy){
    if(mode!=='region'||!world||!game)return false;
    world.panMode=true;world.target=null;world.pvx=0;world.pvy=0;world.moving=false;
    world.cam.x=Math.max(0,Math.min(Math.max(0,WORLD_W-game.W),world.cam.x-dx));
    world.cam.y=Math.max(0,Math.min(Math.max(0,WORLD_H-game.H),world.cam.y-dy));
    return true;
  }

  function updateRegion(dt) {
    var w = world, k = game.keys || {};
    w.t += dt;
    if (w.flash > 0) w.flash -= dt;

    // ---- movement (WASD / arrows) ----
    var ax = 0, ay = 0;
    if (k['a'] || k['arrowleft']) ax -= 1;
    if (k['d'] || k['arrowright']) ax += 1;
    if (k['w'] || k['arrowup']) ay -= 1;
    if (k['s'] || k['arrowdown']) ay += 1;
    // Mobile drag is a floating joystick. Short taps walk to a destination.
    var joy=game.joystick;
    if(joy&&joy.active&&joy.context==='region'){
      if(Math.hypot(joy.dx,joy.dy)>.12){ax+=joy.dx;ay+=joy.dy;}
      w.target=null;
    }
    if(ax||ay)w.target=null;
    if(!ax&&!ay&&w.target){
      var dx=w.target.x-w.px,dy=w.target.y-w.py,dist=Math.hypot(dx,dy);
      if(dist>14){ax=dx/dist;ay=dy/dist;}else w.target=null;
    }
    var SPD=230,ease=Math.min(1,dt*11);
    if (ax || ay) {
      var m = Math.hypot(ax, ay) || 1;
      w.pvx += ((ax/m)*SPD-w.pvx)*ease;
      w.pvy += ((ay/m)*SPD-w.pvy)*ease;
      w.face = ax < -.08 ? -1 : (ax > .08 ? 1 : w.face);
      w.moving = true; w.walkT += dt;
    } else {
      var drag=Math.exp(-dt*12);
      w.pvx*=drag;w.pvy*=drag;
      if (Math.hypot(w.pvx,w.pvy)<4){w.pvx=0;w.pvy=0;w.moving=false;}
    }
    w.px = Math.max(60, Math.min(WORLD_W - 60, w.px + w.pvx * dt));
    w.py = Math.max(60, Math.min(WORLD_H - 60, w.py + w.pvy * dt));

    // Dragging locks the view. Walking resumes smooth follow.
    if(!w.panMode){
      var tx = w.px - game.W / 2, ty = w.py - game.H / 2;
      w.cam.x += (tx - w.cam.x) * Math.min(1, dt * 6);
      w.cam.y += (ty - w.cam.y) * Math.min(1, dt * 6);
    }
    w.cam.x = Math.max(0, Math.min(Math.max(0,WORLD_W - game.W), w.cam.x));
    w.cam.y = Math.max(0, Math.min(Math.max(0,WORLD_H - game.H), w.cam.y));

    // ---- fog-of-exploration: mark the grid cell under the player ----
    var gx = Math.floor((w.px / WORLD_W) * GRID_C);
    var gy = Math.floor((w.py / WORLD_H) * GRID_R);
    var gi = Math.max(0, Math.min(GRID_C * GRID_R - 1, gy * GRID_C + gx));
    if (!w.grid[gi]) { w.grid[gi] = true; w.visited++; commitExplore(); }

    // ---- wild-cat spawns: walk near to trigger encounter ----
    for (var i = 0; i < w.spawns.length; i++) {
      var s = w.spawns[i];
      if (s.cd > 0) { s.cd -= dt; continue; }
      if (Math.hypot(w.px - s.x, w.py - s.y) < 56) {
        s.cd = 9999;                 // consumed; handoff to battle
        triggerEncounter(s);
        return;                      // scene is about to change
      }
    }

    // ---- collectible nodes ----
    for (var j = 0; j < w.nodes.length; j++) {
      var n = w.nodes[j];
      if (n.taken) continue;
      if (Math.hypot(w.px - n.x, w.py - n.y) < 48) collectNode(n);
    }

    // ---- return portal ----
    if (Math.hypot(w.px - w.portal.x, w.py - w.portal.y) < 54) {
      enterMap();
    }
  }

  function commitExplore() {
    var wm = ensureSave();
    var prog = wm.regions[world.region.id];
    var frac = world.visited / (GRID_C * GRID_R);
    var val = Math.max(world.baseExplored, Math.min(1, frac));
    if (val > prog.explored) {
      prog.explored = val;
      if (prog.explored >= (world.region.unlock ? 0.6 : 0.4)) prog.cleared = true;
      refreshUnlocks();
      window.State.save();
    }
  }

  function triggerEncounter(s) {
    var sp = window.GameData.speciesById(s.sp);
    if (!sp) {
      // fall back to a region-pool roll if the id went missing
      var pool = world.region.speciesPool;
      sp = window.GameData.speciesById(pool[Math.floor(Math.random() * pool.length)]);
    }
    // bias the roll a little by difficulty using the existing luck system,
    // but keep the species anchored to the one standing in the field.
    if (cbEncounter) cbEncounter(sp, world.region.id);
  }

  function collectNode(n) {
    n.taken = true;
    world.flash = 0.4;
    var wm = ensureSave();
    var prog = wm.regions[world.region.id];
    if (prog.nodes.indexOf(n.id) < 0) prog.nodes.push(n.id);
    var d = world.region.difficulty;
    var reward;
    if (n.kind === 'rare') {
      reward = { coins: 10 + d * 6, fish: 1, label: '发现珍稀补给 (+' + (10 + d * 6) + '🪙 +1🐠)' };
    } else {
      reward = { coins: 12 + d * 8, treats: 1, label: '拾获补给 (+' + (12 + d * 8) + '🪙 +1🐟)' };
    }
    window.State.save();
    if (cbCollect) cbCollect(reward);
  }

  // ================================================================
  // INPUT (map-view clicks; region taps for portal convenience)
  // ================================================================
  function backBounds(){
    var compact=game&&game.isTouch&&game.W>game.H&&game.H<520;
    return {x:compact?64:20,y:game.H-(compact?50:56),w:compact?100:128,h:compact?36:40};
  }
  function inBackButton(x,y){
    var b=backBounds();return x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h;
  }
  function handleTap(x, y) {
    if (mode === 'map') {
      for (var i = 0; i < mapNodes.length; i++) {
        var mn = mapNodes[i];
        if (Math.hypot(x - mn.px, y - mn.py) <= mn.r + 10) {
          if (isUnlocked(mn.region.id)) { enterRegion(mn.region.id); }
          else if (game && game.toast && toastCd <= 0) { toastCd = 1.2; game.toast('🔒 ' + unlockHint(mn.region)); }
          return true;
        }
      }
      // tap the back-to-yard button (bottom-left) to leave the overworld
      if (inBackButton(x,y)) { if (cbExit) cbExit(); return true; }
      return false;
    }
    // region mode: tapping near the portal glyph returns to the node map
    if (world) {
      var sx = world.portal.x - world.cam.x, sy = world.portal.y - world.cam.y;
      if (Math.hypot(x - sx, y - sy) < 34) { enterMap(); return true; }
      if (inBackButton(x,y)) { enterMap(); return true; }
    }
    return false;
  }

  // ================================================================
  // DRAW — dispatcher
  // ================================================================
  function draw(ctx) {
    if (mode === 'map') drawMap(ctx);
    else drawRegion(ctx);
  }

  // ---- shared helpers ----
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function glowDot(ctx, x, y, r, color, a) {
    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = a == null ? 1 : a;
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }

  // ================================================================
  // DRAW — node map (overworld)
  // ================================================================
  function drawMap(ctx) {
    var W = game.W, H = game.H;
    // dusk sky backdrop
    var sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, BG);
    sky.addColorStop(0.6, '#241a38');
    sky.addColorStop(1, '#140c1e');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    // drifting star motes (parallax-ish ambience)
    for (var i = 0; i < 46; i++) {
      var sx = ((i * 137.5 + t * 6) % W);
      var sy = (i * 53) % (H * 0.7);
      ctx.globalAlpha = 0.25 + 0.5 * Math.abs(Math.sin(t * 0.8 + i));
      ctx.fillStyle = i % 5 === 0 ? GOLD : '#fff';
      ctx.fillRect(sx, sy, 1.6, 1.6);
    }
    ctx.globalAlpha = 1;

    // resolve node screen positions
    mapNodes = [];
    for (var r = 0; r < REGIONS.length; r++) {
      var reg = REGIONS[r];
      mapNodes.push({ region: reg, px: 40 + reg.node.x * (W - 80), py: 70 + reg.node.y * (H - 150), r: 30 });
    }

    // connecting paths (dashed, glowing) between consecutive regions
    ctx.lineWidth = 3; ctx.setLineDash([2, 10]); ctx.lineCap = 'round';
    for (var p = 0; p < mapNodes.length - 1; p++) {
      var a = mapNodes[p], b = mapNodes[p + 1];
      var nextOpen = isUnlocked(b.region.id);
      ctx.strokeStyle = nextOpen ? 'rgba(255,211,107,0.55)' : 'rgba(157,123,255,0.22)';
      ctx.beginPath(); ctx.moveTo(a.px, a.py); ctx.lineTo(b.px, b.py); ctx.stroke();
    }
    ctx.setLineDash([]);

    // region nodes
    for (var n = 0; n < mapNodes.length; n++) {
      var mn = mapNodes[n], reg2 = mn.region, open = isUnlocked(reg2.id);
      var th = reg2.theme;
      var pulse = 1 + Math.sin(t * 2 + n) * 0.06;
      if (open) glowDot(ctx, mn.px, mn.py, mn.r * 2.1 * pulse, th.accent, 0.35);
      // disc
      var g = ctx.createRadialGradient(mn.px - 8, mn.py - 10, 4, mn.px, mn.py, mn.r);
      if (open) { g.addColorStop(0, th.ground2); g.addColorStop(1, th.ground); }
      else { g.addColorStop(0, '#3a3348'); g.addColorStop(1, '#262233'); }
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(mn.px, mn.py, mn.r, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = (cur === reg2.id) ? GOLD : (open ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.14)');
      ctx.stroke();

      if (!open) {
        ctx.font = '20px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillText('🔒', mn.px, mn.py);
      } else {
        // explored ring
        var prog = ensureSave().regions[reg2.id];
        var frac = prog ? prog.explored : 0;
        if (frac > 0) {
          ctx.lineWidth = 4; ctx.strokeStyle = th.accent;
          ctx.beginPath(); ctx.arc(mn.px, mn.py, mn.r + 5, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.stroke();
        }
        ctx.font = '18px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        ctx.fillText('★'.repeat(Math.min(3, reg2.difficulty)), mn.px, mn.py - 2);
      }

      // label
      ctx.font = '600 14px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillStyle = open ? '#fff' : 'rgba(255,255,255,0.45)';
      ctx.fillText(reg2.name, mn.px, mn.py + mn.r + 6);
      if (!open) {
        ctx.font = '11px system-ui, sans-serif';
        ctx.fillStyle = PURPLE;
        ctx.fillText(unlockHint(reg2), mn.px, mn.py + mn.r + 24);
      }
    }

    // back-to-yard button (bottom-left, clear of the HUD pills)
    var back=backBounds(),bbx=back.x,bby=back.y,bbw=back.w,bbh=back.h;
    ctx.fillStyle = 'rgba(30,20,45,0.92)'; roundRect(ctx, bbx, bby, bbw, bbh, 12); ctx.fill();
    ctx.strokeStyle = PINK; ctx.lineWidth = 1.5; roundRect(ctx, bbx, bby, bbw, bbh, 12); ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '700 15px system-ui, sans-serif'; ctx.fillStyle = '#fff';
    ctx.fillText('← 回庭院', bbx + bbw / 2, bby + bbh / 2);
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.font = '700 20px system-ui, sans-serif'; ctx.fillStyle = '#fff';
    ctx.fillText('🗺️ 世界地图', W / 2, 20);
    ctx.font = '12px system-ui, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillText('点击已解锁区域进入探索', W / 2, 46);
    ctx.textAlign = 'left';
  }

  // ================================================================
  // DRAW — region exploration
  // ================================================================
  function drawRegion(ctx) {
    var w = world; if (!w) return;
    var W = game.W, H = game.H, th = w.region.theme, cam = w.cam;

    // The explored regions share the illustrated garden art, with region-specific
    // tint; retain the original thematic fallback for unsupported browsers.
    var scenic=window.CatBondScenery&&CatBondScenery.drawRegion(ctx,W,H,t,th,cam,{width:WORLD_W,height:WORLD_H});
    if(!scenic){
    // sky gradient (fixed to screen)
    var sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, th.sky1); sky.addColorStop(1, th.sky2);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

    // ground band (world-space, parallax 1:1) — a big rounded field
    var groundTop = -cam.y * 1 + H * 0.26;
    var gg = ctx.createLinearGradient(0, groundTop, 0, H + 200);
    gg.addColorStop(0, th.ground2); gg.addColorStop(1, th.ground);
    ctx.fillStyle = gg;
    ctx.fillRect(0, groundTop, W, H - groundTop + 200);
    }

    // far parallax decor (layer 0.4)
    drawDecorLayer(ctx, 0.4, th);
    // near parallax decor (layer 0.8)
    drawDecorLayer(ctx, 0.8, th);

    // world-space items (1:1 with camera)
    ctx.save();
    ctx.translate(-cam.x, -cam.y);

    // return portal
    var por = w.portal, pg = 1 + Math.sin(t * 3) * 0.12;
    glowDot(ctx, por.x, por.y, 50 * pg, GOLD, 0.5);
    ctx.fillStyle = 'rgba(27,16,38,0.85)';
    ctx.beginPath(); ctx.ellipse(por.x, por.y, 26, 30, 0, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = GOLD; ctx.stroke();
    ctx.font = '22px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff'; ctx.fillText('🏠', por.x, por.y);

    // collectible nodes
    for (var j = 0; j < w.nodes.length; j++) {
      var n = w.nodes[j];
      if (n.taken) continue;
      var ny = n.y + Math.sin(t * 2 + n.bob) * 4;
      var col = n.kind === 'rare' ? PURPLE : GOLD;
      glowDot(ctx, n.x, ny, 26, col, 0.6);
      ctx.font = '20px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(n.kind === 'rare' ? '💎' : '📦', n.x, ny);
    }

    // wild-cat spawn markers (draw as tiny cats via CatArt)
    for (var i = 0; i < w.spawns.length; i++) {
      var s = w.spawns[i];
      if (s.cd >= 9999) continue;      // consumed
      var sp = window.GameData.speciesById(s.sp);
      var by = s.y + Math.sin(t * 1.8 + s.bob) * 3;
      // curiosity marker ring
      glowDot(ctx, s.x, by, 30, th.accent, 0.3);
      if (window.CatArt && sp) {
        try { window.CatArt.drawCat(ctx, s.x, by, { species: sp, scale: 0.6, face: 1, t: t, pose: 'sit', mood: 'neutral' }); }
        catch (e) { ctx.fillStyle = th.accent; ctx.beginPath(); ctx.arc(s.x, by, 14, 0, Math.PI * 2); ctx.fill(); }
      }
      ctx.font = '13px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('❔', s.x, by - 34);
    }

    // player avatar (lead cat) + shadow
    var pose = w.moving ? 'walk' : 'idle';
    if (window.CatArt) {
      try { window.CatArt.drawCat(ctx, w.px, w.py, { species: playerSpecies(), scale: 0.8, face: w.face, t: w.walkT, pose: pose, mood: 'happy' }); }
      catch (e2) { ctx.fillStyle = PINK; ctx.beginPath(); ctx.arc(w.px, w.py, 18, 0, Math.PI * 2); ctx.fill(); }
    }

    ctx.restore();

    // collect flash
    if (w.flash > 0) {
      ctx.globalAlpha = w.flash;
      ctx.fillStyle = GOLD; ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }

    drawRegionHUD(ctx);
    if(game.isTouch&&w.t<12){
      ctx.save();
      const hint='轻点草坪让猫咪前往 · 拖动草坪查看周围';
      ctx.font='700 12px system-ui,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
      const hw=Math.min(W-16,ctx.measureText(hint).width+24),hx=W/2,hy=Math.max(95,H-74);
      ctx.fillStyle='rgba(255,252,242,.92)';
      roundRect(ctx,hx-hw/2,hy-14,hw,29,13);ctx.fill();
      ctx.fillStyle='#516754';ctx.fillText(hint,hx,hy,Math.max(50,hw-14));
      ctx.restore();
    }
  }

  // themed parallax decor (shrubs/crystals) scrolling at a fraction of cam speed
  function drawDecorLayer(ctx, layer, th) {
    var w = world, cam = w.cam;
    ctx.save();
    for (var i = 0; i < w.decor.length; i++) {
      var d = w.decor[i];
      if (Math.abs(d.layer - layer) > 0.01) continue;
      var sx = d.x - cam.x * layer;
      var sy = d.y - cam.y * layer;
      // wrap horizontally for a fuller field
      sx = ((sx % (WORLD_W)) + WORLD_W) % WORLD_W;
      if (sx > game.W + 60) continue;
      ctx.globalAlpha = d.a;
      var col = layer < 0.5 ? th.sky2 : th.accent;
      glowDot(ctx, sx, sy, d.r, col, d.a);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawRegionHUD(ctx) {
    var W = game.W, w = world;
    var prog = ensureSave().regions[w.region.id];
    // Compact safe-side HUD for landscape phone screens.
    var compact=game.isTouch&&W>game.H&&game.H<520;
    var hx=compact?64:12,hy=compact?8:14,hw=compact?180:220,hh=compact?46:56;
    ctx.fillStyle = 'rgba(27,16,38,0.6)';
    roundRect(ctx,hx,hy,hw,hh,12);ctx.fill();
    ctx.textAlign='left';ctx.textBaseline='top';
    ctx.font=compact?'700 14px system-ui,sans-serif':'700 18px system-ui,sans-serif';ctx.fillStyle='#fff';
    ctx.fillText(w.region.name,hx+12,hy+6);
    ctx.font=compact?'10px system-ui,sans-serif':'12px system-ui,sans-serif';ctx.fillStyle=w.region.theme.accent;
    ctx.fillText(w.region.sub+' · '+'★'.repeat(w.region.difficulty),hx+12,hy+(compact?28:30),hw-20);
    var bx=hx+12,by=hy+hh+8,bw=hw-24;
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; roundRect(ctx, bx, by, bw, 10, 5); ctx.fill();
    ctx.fillStyle = w.region.theme.accent;
    roundRect(ctx, bx, by, bw * Math.max(0, Math.min(1, prog.explored)), 10, 5); ctx.fill();
    ctx.font = '11px system-ui, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText('探索度 ' + Math.round(prog.explored * 100) + '%', bx, by + 14);

    // Keyboard help is not useful on phones and overlapped the controls.
    if(!game.isTouch&&game.H>=530){
      ctx.textAlign='center';ctx.fillStyle='rgba(27,16,38,0.6)';
      roundRect(ctx,W/2-170,game.H-46,340,32,10);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.85)';ctx.font='13px system-ui,sans-serif';ctx.textBaseline='middle';
      ctx.fillText('WASD/方向键移动 · 靠近🐾遇敌 · 走到🏠返回地图',W/2,game.H-30);
    }
    // back-to-map button (bottom-left)
    var back=backBounds(),bbx=back.x,bby=back.y,bbw=back.w,bbh=back.h;
    ctx.fillStyle = 'rgba(30,20,45,0.92)'; roundRect(ctx, bbx, bby, bbw, bbh, 12); ctx.fill();
    ctx.strokeStyle = PINK; ctx.lineWidth = 1.5; roundRect(ctx, bbx, bby, bbw, bbh, 12); ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '700 15px system-ui, sans-serif'; ctx.fillStyle = '#fff';
    ctx.fillText('← 回地图', bbx + bbw / 2, bby + bbh / 2);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }

  // ================================================================
  // EXPORT
  // ================================================================
  window.WorldMap = {
    init: init,
    enterMap: enterMap,
    enterRegion: enterRegion,
    update: update,
    draw: draw,
    handleTap: handleTap,
    setDestination: setDestination,
    panBy: panBy,
    get view(){return world&&{camX:world.cam.x,camY:world.cam.y,px:world.px,py:world.py,panMode:!!world.panMode,target:!!world.target};},
    onEncounter: onEncounter,
    onCollect: onCollect,
    onExit: onExit,
    isUnlocked: isUnlocked,
    REGIONS: REGIONS,
    get currentRegion() { return cur; },
    get mode() { return mode; },
  };
})();
