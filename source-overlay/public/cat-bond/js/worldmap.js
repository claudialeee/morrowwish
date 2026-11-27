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
//        // reward = { coins, fish, label }  (any field may be 0/absent)
//        if (reward.coins)  State.S.coins  += reward.coins;
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
      id: 'home', name: '阳光花园', sub: 'Sunlit Garden',
      node: { x: 0.16, y: 0.74 }, difficulty: 1,
      theme: { region:'home',sky1: '#241634', sky2: '#3a2d4e', ground: '#3a5a40', ground2: '#588157', accent: '#9be7c4' },
      speciesPool: ['tangyuan', 'doudou', 'xiaohui', 'niuniu', 'nietu'],
      unlock: null, // first explorable area, separate from the home yard scene
      desc: '从熟悉的庭院出发，在阳光和花径间寻找野猫与宝藏。',
    },
    {
      id: 'sakura', name: '樱花林', sub: 'Sakura Woods',
      node: { x: 0.37, y: 0.52 }, difficulty: 2,
      theme: { region:'sakura',sky1: '#2e1a30', sky2: '#4a2a44', ground: '#7a4a66', ground2: '#b06a90', accent: PINK },
      speciesPool: ['nainai', 'moqiu', 'sanhua', 'jiafei', 'yunduo', 'yinghua'],
      unlock: { after: 'home', level: 3, own: 'tangyuan' },
      desc: '粉樱纷飞的林间，稀有猫猫出没。',
    },
    {
      id: 'creek', name: '溪谷', sub: 'Creek Valley',
      node: { x: 0.58, y: 0.68 }, difficulty: 3,
      theme: { region:'creek',sky1: '#122436', sky2: '#1e3c54', ground: '#2f5a6a', ground2: '#4d879a', accent: '#8fd3ff' },
      speciesPool: ['lanbao', 'dundun', 'lixiao', 'zherdd', 'youling'],
      unlock: { after: 'sakura', level: 6 },
      desc: '清凉溪水穿谷而过，史诗猫猫在此栖息。',
    },
    {
      id: 'volcano', name: '火山口', sub: 'Volcano',
      node: { x: 0.74, y: 0.36 }, difficulty: 4,
      theme: { region:'volcano',sky1: '#2a1410', sky2: '#4a1e14', ground: '#5a241a', ground2: '#9a3a1f', accent: '#ff6a1f' },
      speciesPool: ['senlin', 'xianluo', 'jinwu'],
      unlock: { after: 'creek', level: 9, own: 'youling' },
      desc: '灼热的火山口，传说之火焰猫金乌沉睡于此。',
    },
    {
      id: 'ruins', name: '月影遗迹', sub: 'Moonshadow Ruins',
      node: { x: 0.9, y: 0.6 }, difficulty: 5,
      theme: { region:'ruins',sky1: '#17102e', sky2: '#2f2650', ground: '#3a2f66', ground2: '#5a4a9a', accent: PURPLE },
      speciesPool: ['youling', 'yuelian', 'xingchen'],
      unlock: { after: 'volcano', level: 12, own: 'jinwu' },
      desc: '月光笼罩的古老遗迹，最稀有的传说猫沉眠在星河之中。',
    },
  ];
  var DISCOVERIES={
    home:{icon:'🧶',name:'旧院子的毛线盒',en:'The old yarn box',story:'木凳下藏着一盒毛线，像是为新猫咪准备的礼物。',storyEn:'A hidden box of yarn welcomes your kitten.',reward:{coins:32}},
    sakura:{icon:'🌸',name:'樱花的许愿信',en:'A wish in the blossoms',story:'信上写着：愿每只流浪小猫都找到自己的家。',storyEn:'A note wishes that every stray cat finds a home.',reward:{fish:4,coins:18}},
    creek:{icon:'🐚',name:'溪谷的蓝贝壳',en:'The blue creek shell',story:'溪水里的贝壳闪闪发亮，里面藏着小鱼干。',storyEn:'A sparkling shell holds a stash of fish.',reward:{fish:3,coins:20}},
    volcano:{icon:'🔥',name:'火山暖光石',en:'The warm ember stone',story:'温暖的石头带来了寻找稀有猫咪的好运。',storyEn:'A warm stone brings luck for the next rare friend.',reward:{luck:2,coins:30}},
    ruins:{icon:'🌙',name:'月影星光匣',en:'The moonlit star box',story:'古老的匣子为一路冒险到这里的猫咪留下祝福。',storyEn:'An ancient chest rewards cats that made it this far.',reward:{luck:3,fish:3,coins:40}}
  };
  // Native physical finds for each region; old saved node IDs stay stable.
  // Rewards use only 🪙 coins + 🐠 fish (old treats→fish 1:1, old yarn→coins ×10, merged).
  var REGION_FINDS={"home":[["forage","窗台猫薄荷","Catnip on the windowsill",{"fish":2,"coins":10}],["play","午后的晒太阳角","The sunny corner",{"coins":34}],["cache","花盆下的零钱","Coins beneath a planter",{"coins":28}],["forage","厨房掉落的小鱼干","A fish treat by the kitchen",{"fish":3}],["rare","幸运许愿铃","The lucky wishing bell",{"luck":1,"coins":18}],["play","篱笆边的毛线球","Yarn by the garden fence",{"coins":30}]],"sakura":[["forage","樱花蜜糖","Blossom nectar",{"fish":3}],["play","飘落的发光花瓣","Glowing falling petals",{"coins":40}],["cache","神社祈愿签","Shrine fortune slip",{"luck":1,"coins":22}],["forage","樱树根下的鱼干","Fish beneath the cherry tree",{"fish":2}],["rare","樱色琥珀","Cherry blossom amber",{"luck":2,"coins":28}],["play","小猫的花环","A kitten flower crown",{"fish":2,"coins":20}]],"creek":[["forage","小溪里的银鱼","Silver minnows",{"fish":3}],["play","石头跳跳乐","Stepping-stone game",{"coins":25,"fish":1}],["cache","水车边的宝贝","Waterwheel keepsake",{"coins":20,"fish":1}],["forage","苔藓里的猫薄荷","Catnip in the moss",{"fish":3}],["rare","月光珍珠","Moonwater pearl",{"luck":2,"fish":2}],["play","贝壳寻宝","Shell treasure hunt",{"coins":34,"fish":1}]],"volcano":[["forage","暖石上的零食","Treats on warm stone",{"fish":4}],["play","火山温泉","Volcanic hot spring",{"coins":56}],["cache","矿工遗落的金币","Forgotten prospector coins",{"coins":50}],["forage","岩洞秘密鱼干","Hidden cave fish",{"fish":3}],["rare","余烬晶石","Ember crystal",{"luck":3,"coins":22}],["play","火山流星雨","Ember meteor shower",{"luck":1,"fish":2}]],"ruins":[["forage","星光小鱼干","Starlit fish",{"fish":3}],["play","月光下的约定","A promise in moonlight",{"coins":62}],["cache","遗迹古币","Ancient coins",{"coins":60}],["forage","夜花蜜露","Nightflower nectar",{"fish":4}],["rare","星河碎片","Stardust fragment",{"luck":3,"fish":2}],["play","旋转的星盘","The turning astrolabe",{"luck":2,"coins":20}]]};
  var DUO_MEMORIES={"home":["☀️","暖阳里的好朋友","Sunbeam Friends","两只小猫挤进同一缕阳光，谁都不愿先离开。","Two kittens squeeze into one sunbeam, and neither wants to leave."],"sakura":["🌸","花瓣下的双猫约定","Promise Under Petals","花瓣落在它们的耳朵上，它们约好来年春天还一起回来。","Petals land on their ears; they promise to return together next spring."],"creek":["🐚","一起越过小溪","Across the Creek Together","一只猫伸出小爪子，另一只已经在石头上等着它。","One kitten stretches out a paw; the other waits patiently on the stepping stone."],"volcano":["🔥","并肩的勇气","Brave Little Paws","面对炙热的石头，两只猫紧紧相随，找到了安全的路。","Side by side, the kittens find a safe way through the hot stones."],"ruins":["🌙","双猫星座","Two-Cat Constellation","古老星盘为它们亮起了两颗星，这次它们的名字并排写在星空里。","Two new stars appear on the old astrolabe, carrying their names side by side."]};
  var SPOT_COORDS=[[330,610],[590,345],[875,475],[1150,950],[1490,445],[1360,1070]];
  function activeDuo(){
    const cats=window.CatRelations?.chosen?.()||[];
    if(cats.length!==2)return null;
    const trust=window.CatRelations?.pair(cats[0],cats[1])?.value||0;
    return {cats,trust,ready:trust>=20&&window.CatRelations?.mood(cats[0],cats[1])!=='sulky'};
  }
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
    wm.unlocked.home = true;       // courtyard is the permanent starting region
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

  // Owner 2026-11-27: region gate uses TEAM-AVG LEVEL (not explore %) — level is
  // the natural progression signal, and computeWildLevel already keys off team
  // avg. If `unlock.level` is set, use it; else fall back to legacy `unlock.explore`.
  function teamAvgLevel() {
    var S = window.State && window.State.S;
    var cats = (S && S.cats) || [];
    if (!cats.length) return 1;
    var sum = 0, n = 0;
    for (var i = 0; i < cats.length; i++) { sum += (cats[i].level || 1); n++; }
    return n ? sum / n : 1;
  }
  function isUnlocked(id) {
    var wm = ensureSave();
    if (wm.unlocked[id]) return true;
    var r = regionById(id);
    if (!r || !r.unlock) return !!(r && !r.unlock);
    var okProgress;
    if (r.unlock.level != null) {
      okProgress = teamAvgLevel() >= r.unlock.level;
    } else {
      var prev = wm.regions[r.unlock.after];
      okProgress = prev && prev.explored >= r.unlock.explore;
    }
    var okOwn = !r.unlock.own || owns(r.unlock.own);
    return !!(okProgress && okOwn);
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
    var parts;
    if (r.unlock.level != null) {
      parts = ['队伍平均等级 ≥ ' + r.unlock.level];
    } else {
      parts = ['探索「' + (prev ? prev.name : '') + '」至 ' + Math.round(r.unlock.explore * 100) + '%'];
    }
    if (r.unlock.own) {
      var sp = window.GameData.speciesById(r.unlock.own);
      parts.push('并拥有「' + (sp ? window.GameData.speciesName(sp) : r.unlock.own) + '」');
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
  function exitToYard() { if (cbExit) cbExit(); }

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

  // Resume the region the player left for a battle WITHOUT rebuilding it — keeps
  // their explored position, camera and entities exactly where they were, instead
  // of snapping back to the portal.
  //
  // `outcome` is whether the battle was a WIN (the wild cat was captured and now
  // lives in the player's yard). On a WIN we REMOVE that cat from world.spawns so
  // it no longer draws or roams the map. On a FLEE/LOSS (or an undefined outcome,
  // for backward compatibility) we keep the cat but drop its cooldown from the
  // 9999 "handed-off-to-battle" sentinel back to a short value, so the updateRegion
  // movement loop resumes animating it after a brief pause instead of letting the
  // player instantly re-encounter it on the same tile.
  function resumeRegion(outcome) {
    if (!world || !world.region) return enterRegion(cur);   // nothing to resume → fresh enter
    var s = world._lastEncounter;
    if (s) {
      if (outcome === true) {
        var idx = world.spawns ? world.spawns.indexOf(s) : -1;
        if (idx >= 0) world.spawns.splice(idx, 1);          // captured → remove from the map entirely
      } else {
        s.cd = 2.5;                                         // fled/lost → short cooldown, then resume motion
      }
      world._lastEncounter = null;
    }
    mode = 'region';
    return true;
  }

  // ================================================================
  // REGION RUNTIME
  // ================================================================
  function playerSpecies() {
    var cats = window.State.S.cats || [];
    if (cats.length) {
      var leader=(window.CatRelations?.chosen?.()||[])[0]||
        cats.find(c=>c.uid===window.State.S.battlePrefs?.teamUids?.[0])||cats[0];
      var sp=window.GameData.speciesById(leader.species);
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
    // A region defines WHICH cats live here, but does not guarantee that every
    // listed species (especially legendary cats) spawns at the same rate.
    var candidates = pool.map(function (id) {
      var species = window.GameData.speciesById(id);
      return { id: id, weight: species ? (window.GameData.RARITY[species.rarity].weight || 1) : 1 };
    });
    var totalWeight = candidates.reduce(function (sum, item) { return sum + item.weight; }, 0);
    function rollRegionCat() {
      var roll = Math.random() * totalWeight;
      for (var j = 0; j < candidates.length; j++) {
        roll -= candidates[j].weight;
        if (roll < 0) return candidates[j].id;
      }
      return candidates[candidates.length - 1].id;
    }
    var nSpawn = 5 + r.difficulty;           // more wild cats in harder regions
    for (var i = 0; i < nSpawn; i++) {
      spawns.push({
        x: 180 + Math.random() * (WORLD_W - 360),
        y: 180 + Math.random() * (WORLD_H - 360),
        sp: rollRegionCat(),
        cd: 0,                                // encounter cooldown after trigger
        bob: Math.random() * 6.28,
        homeX:0,homeY:0,face:1,stride:Math.random()*6,
        pace:.5+Math.random()*.5,
      });
    }
    // Every visible roaming cat has an immutable encounter level, before
    // contact, regardless of changes to the team chooser afterward.
    const roster=window.State?.S?.cats||[];
    const preferred=(window.State?.S?.battlePrefs?.teamUids||[])
      .map(uid=>roster.find(c=>c.uid===uid)).filter(Boolean);
    for(const kitten of spawns){
      kitten.homeX=kitten.x;kitten.homeY=kitten.y;
      const sp=window.GameData.speciesById(kitten.sp);
      kitten.level=sp&&window.Battle?.CaptureBattle?.previewWildLevel
        ?window.Battle.CaptureBattle.previewWildLevel(sp,id,preferred.length?preferred:roster.slice(0,5))
        :1;
    }
    // FIRST-BATTLE COUNTER SEED (owner call 2026-11-25): a complete newcomer's very first wild
    // encounter should feel like they're CRUSHING it — "效果拔群!" on the first swing, not the
    // reverse. If catchCount === 0 and the player owns a starter, convert the spawn closest to
    // the player's entry point into a species the starter DOES extra damage to (effectiveness > 1).
    // Does NOTHING once catchCount > 0, in any non-home region, or if no counter is in the pool.
    try {
      var S1 = window.Skills, GD1 = window.GameData, St1 = window.State;
      var caught = (St1 && St1.S && St1.S.catchCount) || 0;
      var starter = (St1 && St1.S && St1.S.cats && St1.S.cats[0]) || null;
      if (caught === 0 && starter && S1 && GD1 && spawns.length) {
        var starterEl = S1.elementOf(starter.species);
        // Find a pool species the starter's element is strong against.
        var weakIds = pool.filter(function(sid){
          var e = S1.elementOf(sid);
          return S1.effectiveness(starterEl, e) > 1;
        });
        if (weakIds.length) {
          // Pick the strongest matchup (2× before 1.5×), then lowest rarity so the fight
          // stays an easy win.
          var rarityOrd = {N:0, R:1, SR:2, SSR:3};
          weakIds.sort(function(a,b){
            var ea = S1.elementOf(a), eb = S1.elementOf(b);
            var em = S1.effectiveness(starterEl, eb) - S1.effectiveness(starterEl, ea);
            if (em !== 0) return em;
            var ra = (GD1.speciesById(a)||{}).rarity || 'N';
            var rb = (GD1.speciesById(b)||{}).rarity || 'N';
            return (rarityOrd[ra]||0) - (rarityOrd[rb]||0);
          });
          // Overwrite the FIRST spawn (first one spawned → typically closest to entry).
          spawns[0].sp = weakIds[0];
          spawns[0]._firstBattleSeed = true;      // debug/telemetry; not gameplay
          // Recompute its encounter level for the new species.
          var seededSp = GD1.speciesById(weakIds[0]);
          if (seededSp && window.Battle && window.Battle.CaptureBattle && window.Battle.CaptureBattle.previewWildLevel) {
            spawns[0].level = window.Battle.CaptureBattle.previewWildLevel(
              seededSp, id, preferred.length ? preferred : roster.slice(0,5));
          }
        }
      }
    } catch (_) { /* best-effort; never block world setup */ }
    // COUNTER-CAT FLOOR (owner: "玩家可能拿不到克制 SR/SSR 的猫"): if this region holds a gated SR/SSR
    // whose element the player CANNOT counter (owns no cat strong vs it), make sure a CAPTURABLE
    // counter roams here too — convert one ambient low-rarity spawn to a counter-element N/R from the
    // region pool. SR/SSR DENS are untouched (we only re-skin a common roamer), so the world layout and
    // the boss encounters are preserved; the player just gets a reachable answer in the same region.
    try {
      var S = window.Skills, GD = window.GameData;
      if (S && S.effectiveness && S.elementOf) {
        var owned = (window.State && window.State.S && window.State.S.cats) || [];
        var poolSp = pool.map(function(pid){ return GD.speciesById(pid); }).filter(Boolean);
        // gated SR/SSR species present in this region's pool
        var bosses = poolSp.filter(function(sp){ return sp.rarity==='SR'||sp.rarity==='SSR'; });
        for (var bi=0; bi<bosses.length; bi++) {
          var bEl = S.elementOf(bosses[bi].id);
          var ownsCounter = owned.some(function(c){ return S.effectiveness(S.elementOf(c.species), bEl) > 1; });
          // "already roaming" only counts a CAPTURABLE (N/R) counter — an SR/SSR counter (e.g. grass
          // 松松 vs elec 露露) is itself a boss the player can't easily capture to USE, so it doesn't
          // discharge the floor. Must match the seed's own capturability bar.
          var alreadyRoaming = spawns.some(function(sp0){ var s0=GD.speciesById(sp0.sp); return s0 && (s0.rarity==='N'||s0.rarity==='R') && S.effectiveness(S.elementOf(s0.id), bEl) > 1; });
          if (ownsCounter || alreadyRoaming) continue;        // player can already answer it, or a CAPTURABLE counter already roams
          // find a CAPTURABLE (N/R) counter-element species — prefer one native to THIS region pool,
          // but fall back to the GLOBAL N/R roster. The fallback matters: a boss region's pool can be
          // ALL SR/SSR (e.g. volcano = 松松/露露/焰焰) with zero native commons, so without a global
          // reach a 露露 region could never offer the grass counter the player needs.
          // Prefer the STRONGEST matchup (a 2× hard counter over a 1.5× advantage), then lowest rarity,
          // then id — so a 露露 player is handed the breed that most decisively answers it (R1 MINOR-1),
          // deterministically. Search the region pool first, then the global N/R roster.
          var pickCounter = function(list){
            return list.filter(function(sp){ return (sp.rarity==='N'||sp.rarity==='R') && S.effectiveness(S.elementOf(sp.id), bEl) > 1; })
              .sort(function(a,b){
                var o={N:0,R:1};
                return (S.effectiveness(S.elementOf(b.id),bEl) - S.effectiveness(S.elementOf(a.id),bEl))  // 2× before 1.5×
                    || (o[a.rarity]-o[b.rarity])                                                          // N before R
                    || (a.id<b.id?-1:1);                                                                   // stable
              })[0] || null;
          };
          var counterSp = pickCounter(poolSp) || pickCounter(GD.SPECIES||[]);
          if (!counterSp) continue;                           // no N/R counter exists anywhere → leave as-is
          // Pick a victim spawn to re-skin as the counter. Prefer a COMMON roamer (N/R) if any exist;
          // otherwise (an all-boss region like volcano) re-skin a REDUNDANT boss copy — the one whose
          // species appears most often among spawns — so every boss type still roams at least once and
          // we only ever thin a duplicate. Never convert the LAST copy of any boss.
          var countBySp = {};
          spawns.forEach(function(s0){ countBySp[s0.sp]=(countBySp[s0.sp]||0)+1; });
          var alreadySeeded = {};   // don't stack two seeds onto the same spawn across boss iterations
          var ord={N:0,R:1,SR:2,SSR:3};
          var victim = spawns.slice().filter(function(s0){ return !s0._counterSeed; }).sort(function(a,b){
            var ra=(GD.speciesById(a.sp)||{}).rarity||'N', rb=(GD.speciesById(b.sp)||{}).rarity||'N';
            // commons first; among same rarity, the most-duplicated species first (safe to thin)
            return (ord[ra]-ord[rb]) || (countBySp[b.sp]-countBySp[a.sp]);
          }).find(function(s0){
            var r0=(GD.speciesById(s0.sp)||{}).rarity;
            // if it's a boss, only convert when it's a DUPLICATE (>=2 of that species remain)
            return (r0==='N'||r0==='R') || countBySp[s0.sp] >= 2;
          });
          if (victim) {
            countBySp[victim.sp]--;                            // consume one copy
            victim.sp = counterSp.id;
            victim._counterSeed = bEl;                         // mark (debug/telemetry; not gameplay)
            // recompute this spawn's immutable encounter level for its NEW species (the level loop
            // above already ran, so set it here to keep the preview/encounter level honest).
            victim.level = window.Battle && window.Battle.CaptureBattle && window.Battle.CaptureBattle.previewWildLevel
              ? window.Battle.CaptureBattle.previewWildLevel(counterSp, id, preferred.length?preferred:roster.slice(0,5))
              : (victim.level||1);
          }
        }
      }
    } catch(e) { /* floor is best-effort; never block region build */ }

    // Place local finds at recognizable permanent spots; no boxes randomly
    // reshuffled between visits. A later visit keeps the same landmarks.
    var nativeFinds=REGION_FINDS[id]||REGION_FINDS.home;
    for (var j = 0; j < nativeFinds.length; j++) {
      const spot=SPOT_COORDS[j], shift=(r.difficulty-1)*28;
      nodes.push({id:id+'_n'+j,
        x:Math.max(90,Math.min(WORLD_W-90,spot[0]+(j%2?shift:-shift*.3))),
        y:Math.max(90,Math.min(WORLD_H-90,spot[1]+(j%3-1)*shift)),
        taken:prog.nodes.includes(id+'_n'+j),
        kind:nativeFinds[j][0],find:nativeFinds[j],bob:j*.85});
    }
    const secretId=id+'_secret';
    nodes.push({id:secretId,x:WORLD_W*.22,y:WORLD_H*.5+(r.difficulty-3)*23,
      taken:prog.nodes.includes(secretId),kind:'secret',bob:0});
    // A different duo memory in every region, unlocked by friendship.
    const duoId=id+'_duo';
    const expeditionPair=activeDuo()?.cats;
    const remembered=expeditionPair&&window.CatRelations?.memoryList?.(expeditionPair[0],expeditionPair[1])||[];
    nodes.push({id:duoId,x:WORLD_W*.42,y:WORLD_H*.77,
      memoryId:id,taken:remembered.includes(id),kind:'duo',bob:1.8});
    // A second, distinct duet moment in each region: extra discovery, not
    // a second prize for the same memory and not a crowded field of icons.
    const extraMemory=id+'-moment';
    nodes.push({id:id+'_duo_moment',x:WORLD_W*.71,y:WORLD_H*.66,
      memoryId:extraMemory,taken:remembered.includes(extraMemory),
      kind:'duo',bob:3.2});
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

  // One world-unit transform for every viewport. The logical world, saved
  // coordinates, collision radii and artwork remain unchanged. Zoom only when
  // the viewport would exceed the map, preserving aspect ratio and input.
  function regionViewport(){
    const screenW=Math.max(1,game?.W||1),screenH=Math.max(1,game?.H||1);
    const scale=Math.max(1,screenW/WORLD_W,screenH/WORLD_H);
    return {scale,width:Math.min(WORLD_W,screenW/scale),height:Math.min(WORLD_H,screenH/scale)};
  }
  function clampCamera(cam,view=regionViewport()){
    cam.x=Math.max(0,Math.min(Math.max(0,WORLD_W-view.width),cam.x));
    cam.y=Math.max(0,Math.min(Math.max(0,WORLD_H-view.height),cam.y));
  }
  function setDestination(sx,sy){
    if(mode!=='region'||!world||!game)return false;
    const view=regionViewport();clampCamera(world.cam,view);
    world.panMode=false;
    world.target={x:Math.max(60,Math.min(WORLD_W-60,world.cam.x+sx/view.scale)),
      y:Math.max(60,Math.min(WORLD_H-60,world.cam.y+sy/view.scale))};
    return true;
  }

  // Physically pan the 1800x1300 meadow; stop following the avatar until tapped.
  function panBy(dx,dy){
    if(mode!=='region'||!world||!game)return false;
    world.panMode=true;world.target=null;world.pvx=0;world.pvy=0;world.moving=false;
    const view=regionViewport();
    world.cam.x-=dx/view.scale;world.cam.y-=dy/view.scale;
    clampCamera(world.cam,view);
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
    const view=regionViewport();
    if(!w.panMode){
      var tx = w.px - view.width / 2, ty = w.py - view.height / 2;
      w.cam.x += (tx - w.cam.x) * Math.min(1, dt * 6);
      w.cam.y += (ty - w.cam.y) * Math.min(1, dt * 6);
    }
    clampCamera(w.cam,view);

    // ---- fog-of-exploration: mark the grid cell under the player ----
    var gx = Math.floor((w.px / WORLD_W) * GRID_C);
    var gy = Math.floor((w.py / WORLD_H) * GRID_R);
    var gi = Math.max(0, Math.min(GRID_C * GRID_R - 1, gy * GRID_C + gx));
    if (!w.grid[gi]) { w.grid[gi] = true; w.visited++; commitExplore(); }

    // ---- World kittens really walk between points and change direction.
    // The encounter triggers on their *live* position, not a stationary icon.
    for (var i = 0; i < w.spawns.length; i++) {
      var s = w.spawns[i];
      if (s.cd > 0) { s.cd -= dt; continue; }
      const prevX=s.x;
      const phase=w.t*s.pace+s.bob;
      s.x=Math.max(100,Math.min(WORLD_W-100,s.homeX+
        69*(Math.sin(phase)-Math.sin(s.bob))));
      s.y=Math.max(100,Math.min(WORLD_H-100,s.homeY+
        27*(Math.sin(phase*.67)-Math.sin(s.bob*.67))));
      if(Math.abs(s.x-prevX)>.03)s.face=s.x<prevX?-1:1;
      s.stride+=dt*(5+Math.max(.25,Math.abs(s.x-prevX)/Math.max(dt,.001))*.12);
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
      if (Math.hypot(w.px - n.x, w.py - n.y) < 48) {
        if(n.kind==='duo'&&activeDuo()?.cats&&window.CatRelations?.memoryList?.(...activeDuo().cats)?.includes(n.memoryId||w.region.id))n.taken=true;
        else if(n.kind==='duo'&&!activeDuo()?.ready){
          if(toastCd<=0&&game?.toast){
            const en=window.MorrowwishI18n?.get?.()!=='zh';
            game.toast(en?'Pair two cats and reach 20 trust to discover this memory':'双猫搭档默契达到20，才能发现这段回忆');
            toastCd=4;
          }
        }else collectNode(n);
      }
    }

    // Map switching is intentionally controlled by the top-right map directory.
    // Walking through the old entrance no longer teleports the player out.
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
    if (world) world._lastEncounter = s;        // remember which den triggered, to cool it down on resume
    var sp = window.GameData.speciesById(s.sp);
    if (!sp) {
      // fall back to a region-pool roll if the id went missing
      var pool = world.region.speciesPool;
      sp = window.GameData.speciesById(pool[Math.floor(Math.random() * pool.length)]);
    }
    // bias the roll a little by difficulty using the existing luck system,
    // but keep the species anchored to the one standing in the field.
    if (cbEncounter) cbEncounter({...sp,encounterLevel:s.level||1}, world.region.id);
  }

  function collectNode(n) {
    n.taken = true;
    world.flash = 0.4;
    var wm = ensureSave();
    var prog = wm.regions[world.region.id];
    if(n.kind!=='duo'&&prog.nodes.indexOf(n.id)<0)prog.nodes.push(n.id);
    var d = world.region.difficulty;
    var reward;
    if(n.kind==='secret'){
      const disc=DISCOVERIES[world.region.id];
      reward=Object.assign({discovery:Object.assign({id:world.region.id},disc)},disc.reward);
    }else if(n.kind==='duo'){
      const memoryId=n.memoryId||world.region.id,duo=activeDuo();
      const album=window.CatRelations?.MEMORY_CATALOG||[];
      const moment=album.find(m=>m.id===memoryId);
      const entry=DUO_MEMORIES[world.region.id];
      const disc=memoryId===world.region.id
        ?{id:memoryId+'_duo',icon:entry[0],name:entry[1],en:entry[2],
          story:entry[3],storyEn:entry[4]}
        :{id:memoryId,icon:moment?.icon||'🐾',
          name:moment?.zh||'双猫小回忆',en:moment?.en||'Duo memory',
          story:moment?.zhStory||'',storyEn:moment?.enStory||''};
      // currency folded to 2-resource: yarn→coins (×10), treats→fish
      const extra=memoryId===world.region.id
        ?({home:{coins:30},sakura:{fish:3,coins:22},
          creek:{fish:3},volcano:{luck:2,coins:25},ruins:{luck:2,fish:2}})[world.region.id]
        :{coins:12};
      reward=Object.assign({discovery:disc,duoMemory:true,duoMemoryId:memoryId,
        duoTrust:memoryId===world.region.id?12:4,
        duoNames:duo?.cats.map(c=>window.State.catName(c))||[]},extra);
      window.arcadeMetric?.('bond_duo_map_memory',{region:world.region.id,memory:memoryId});
    }else{
      const en=window.MorrowwishI18n?.get?.()!=='zh',info=n.find;
      const labelZh=info?info[1]:'发现宝贝';
      const labelEn=info?info[2]:'Found a treasure';
      reward=Object.assign({},info?info[3]:{coins:12+d*8},
        {label:en?labelEn:labelZh,labelZh,labelEn,kind:n.kind});
    }
    window.State.save();
    if (cbCollect) cbCollect(reward);
  }

  // ================================================================
  // INPUT (world-map nodes and the in-scene upper-left yard button)
  // ================================================================
  function backBounds(){
    // Direct in-scene top-left courtyard navigation, away from the header menu.
    var narrow=game&&game.W<=360;
    return {x:narrow?8:12,y:8,w:narrow?76:120,h:narrow?34:38};
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
      // tap the back-to-yard button (upper-left) to leave the overworld
      if (inBackButton(x,y)) { if (cbExit) cbExit(); return true; }
      return false;
    }
    // In a region, only the upper-left action returns to the courtyard.
    // Use the header exploration menu’s 世界目录 to change regions.
    if (world && inBackButton(x,y)) { if (cbExit) cbExit(); return true; }
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
      ctx.fillText(window.MorrowwishI18n?.get?.()==='zh'?reg2.name:reg2.sub, mn.px, mn.py + mn.r + 6);
      if (!open) {
        ctx.font = '11px system-ui, sans-serif';
        ctx.fillStyle = PURPLE;
        ctx.fillText(unlockHint(reg2), mn.px, mn.py + mn.r + 24);
      }
    }

    // A real, accessible return button is now in the left header slot.
    // Draw the legacy canvas affordance only when the shared header is absent.
    if (!globalThis.document?.getElementById('cb-yard-return')) {
      var back=backBounds(),bbx=back.x,bby=back.y,bbw=back.w,bbh=back.h;
      ctx.fillStyle = 'rgba(30,20,45,0.92)'; roundRect(ctx, bbx, bby, bbw, bbh, 12); ctx.fill();
      ctx.strokeStyle = PINK; ctx.lineWidth = 1.5; roundRect(ctx, bbx, bby, bbw, bbh, 12); ctx.stroke();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '700 15px system-ui, sans-serif'; ctx.fillStyle = '#fff';
      ctx.font = (W<=360?'700 13px':'700 15px')+' system-ui, sans-serif';
      ctx.fillText(window.MorrowwishI18n?.get?.()==='zh'?(W<=360?'← 庭院':'← 回庭院'):'← Yard', bbx + bbw / 2, bby + bbh / 2);
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.font = '700 20px system-ui, sans-serif'; ctx.fillStyle = '#fff';
    ctx.fillText('🗺️ 世界地图', W / 2, W<650?105:83);
    ctx.font = '12px system-ui, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillText('点击已解锁区域进入探索', W / 2, W<650?158:105);
    ctx.textAlign = 'left';
  }

  // Physical relics and signposts replace flat floating emoji markers.
  // Everything is in the same world coordinate system as the cats.
  function drawWorldRelic(ctx,node,region,t){
    const x=node.x,y=node.y,secret=node.kind==='secret',rare=node.kind==='rare';
    ctx.save();
    const contactY=y+16;
    ctx.fillStyle='rgba(32,40,38,.22)';
    ctx.beginPath();ctx.ellipse(x+5,contactY+3,23,6,0,0,Math.PI*2);ctx.fill();
    if(secret){
      if(region==='home'){
        ctx.fillStyle='#96735b';ctx.fillRect(x-20,y-3,40,21);
        ctx.fillStyle='#cba786';ctx.fillRect(x-23,y-11,46,11);
        ctx.strokeStyle='#f7e3be';ctx.lineWidth=2;
        ctx.beginPath();ctx.arc(x,y-6,7,0,Math.PI*1.7);ctx.stroke();
      }else if(region==='sakura'){
        ctx.save();ctx.rotate(-.16);
        ctx.fillStyle='#fbf2e7';ctx.fillRect(x-20,y-13,40,30);
        ctx.strokeStyle='#d6aab7';ctx.lineWidth=2;
        ctx.beginPath();ctx.moveTo(x-20,y-12);ctx.lineTo(x,y+3);ctx.lineTo(x+20,y-12);ctx.stroke();
        ctx.restore();
      }else if(region==='creek'){
        ctx.fillStyle='#d8cbb5';ctx.beginPath();ctx.arc(x,y+3,18,Math.PI,0);ctx.closePath();ctx.fill();
        for(let i=-2;i<=2;i++){ctx.strokeStyle='#fbf5dd';ctx.lineWidth=2;
          ctx.beginPath();ctx.moveTo(x,y+16);ctx.lineTo(x+i*7,y-11);ctx.stroke();}
      }else if(region==='volcano'){
        ctx.fillStyle='#554e56';ctx.beginPath();
        ctx.moveTo(x-23,y+17);ctx.lineTo(x-12,y-20);ctx.lineTo(x+7,y-33);
        ctx.lineTo(x+23,y+18);ctx.closePath();ctx.fill();
        ctx.strokeStyle='#f8b47c';ctx.lineWidth=4;
        ctx.beginPath();ctx.moveTo(x+6,y-29);ctx.lineTo(x,y-11);ctx.lineTo(x+7,y+13);ctx.stroke();
      }else{
        ctx.fillStyle='#b9b5ca';ctx.fillRect(x-19,y-25,38,45);
        ctx.strokeStyle='#e5d7c4';ctx.lineWidth=3;
        ctx.beginPath();ctx.arc(x,y-3,12,-2.1,1.4);ctx.stroke();
        ctx.fillStyle='#faf1d4';ctx.beginPath();ctx.arc(x+3,y-5,3,0,Math.PI*2);ctx.fill();
      }
    }else if(node.kind==='duo'){
      // Paired stone kittens physically inhabit the memory site.
      for(const side of [-1,1]){
        const xx=x+side*15;
        ctx.fillStyle='#b9a69e';ctx.beginPath();ctx.ellipse(xx,y+5,12,17,0,0,Math.PI*2);ctx.fill();
        ctx.beginPath();ctx.moveTo(xx-11,y-8);ctx.lineTo(xx-8,y-25);ctx.lineTo(xx,y-13);
        ctx.lineTo(xx+8,y-25);ctx.lineTo(xx+11,y-8);ctx.fill();
        ctx.fillStyle='#fff1d9';ctx.beginPath();ctx.arc(xx-side*3,y-1,2,0,Math.PI*2);ctx.fill();
      }
      ctx.strokeStyle='#e4b7c1';ctx.lineWidth=4;ctx.beginPath();
      ctx.moveTo(x-13,y-18);ctx.quadraticCurveTo(x,y-38,x+13,y-18);ctx.stroke();
      ctx.fillStyle='#ffefd0';ctx.beginPath();ctx.arc(x,y-28,5,0,Math.PI*2);ctx.fill();
    }else if(rare){
      ctx.fillStyle=({home:'#c39f73',sakura:'#f0b8d0',creek:'#91cfdb',volcano:'#b77c61',ruins:'#aaa4d6'})[region]||'#8b9aac';ctx.beginPath();ctx.moveTo(x-9,y+18);ctx.lineTo(x-17,y-6);
      ctx.lineTo(x,y-27);ctx.lineTo(x+19,y-6);ctx.lineTo(x+8,y+18);ctx.closePath();ctx.fill();
      ctx.fillStyle='#d7ebec';ctx.beginPath();ctx.moveTo(x,y-26);ctx.lineTo(x+18,y-6);
      ctx.lineTo(x+4,y+5);ctx.closePath();ctx.fill();
    }else if(node.kind==='forage'){
      // A living herb or plant clump; creek forage becomes a silvery fish.
      if(region==='creek'||region==='ruins'){
        ctx.fillStyle=region==='creek'?'#d9eff0':'#e1d8fa';
        ctx.beginPath();ctx.ellipse(x,y,21,11,0,0,Math.PI*2);ctx.fill();
        ctx.beginPath();ctx.moveTo(x-16,y);ctx.lineTo(x-29,y-11);ctx.lineTo(x-29,y+11);ctx.closePath();ctx.fill();
        ctx.fillStyle='#617a89';ctx.beginPath();ctx.arc(x+11,y-3,2.2,0,Math.PI*2);ctx.fill();
      }else{
        ctx.strokeStyle='#699a6b';ctx.lineWidth=4;
        ctx.beginPath();ctx.moveTo(x,y+19);ctx.lineTo(x,y-21);ctx.stroke();
        for(const side of [-1,1])for(let i=0;i<3;i++){
          ctx.fillStyle=region==='volcano'?'#d0a66c':region==='sakura'?'#f3adc7':'#87b78c';
          ctx.beginPath();ctx.ellipse(x+side*(8+i*3),y-12+i*12,12,6,side*.6,0,Math.PI*2);ctx.fill();
        }
      }
    }else if(node.kind==='play'){
      // A toy with wrapped thread, not a treasure chest.
      ctx.fillStyle=region==='volcano'?'#e7b990':region==='ruins'?'#c6bde3':
        region==='creek'?'#a8d6d8':region==='sakura'?'#f9c2d0':'#deb49a';
      ctx.beginPath();ctx.arc(x,y,19,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#fff3df';ctx.lineWidth=2;
      for(let i=-2;i<=2;i++){ctx.beginPath();ctx.arc(x,y,7+i*3,-1.7,1.8);ctx.stroke();}
      ctx.strokeStyle='#dbc99e';ctx.lineWidth=2;ctx.beginPath();
      ctx.moveTo(x+10,y+10);ctx.quadraticCurveTo(x+26,y+23,x+31,y+8);ctx.stroke();
    }else if(node.kind==='cache'){
      // Small coin pouch or shrine offering, visually different from plants/toys.
      ctx.fillStyle=region==='volcano'?'#8e6960':region==='ruins'?'#8e8ba6':'#a58a6f';
      ctx.beginPath();ctx.moveTo(x-16,y-15);ctx.lineTo(x+16,y-15);
      ctx.quadraticCurveTo(x+28,y+12,x,y+21);ctx.quadraticCurveTo(x-28,y+12,x-16,y-15);ctx.fill();
      ctx.strokeStyle='#f4d39a';ctx.lineWidth=3;ctx.beginPath();
      ctx.moveTo(x-12,y-13);ctx.quadraticCurveTo(x,y-5,x+12,y-13);ctx.stroke();
      // The visible currency is always a silver minted coin, even inside pouches.
       ctx.fillStyle='#ffe9a0';ctx.strokeStyle='#b58427';ctx.lineWidth=1.6;
       ctx.beginPath();ctx.arc(x,y+5,7,0,Math.PI*2);ctx.fill();ctx.stroke();
       ctx.strokeStyle='#fff8d8';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y+5,4.7,0,Math.PI*2);ctx.stroke();
    }else{
      // Visual reward identity depends on the biome, never the same box.
      if(region==='sakura'){
        ctx.strokeStyle='#a17681';ctx.lineWidth=4;ctx.beginPath();
        ctx.moveTo(x-18,y+15);ctx.lineTo(x+6,y-12);ctx.stroke();
        for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ctx.fillStyle=i%2?'#f3b5cd':'#ffedf0';
          ctx.beginPath();ctx.ellipse(x+6+Math.cos(a)*12,y-12+Math.sin(a)*11,9,5,a,0,Math.PI*2);ctx.fill();}
        ctx.fillStyle='#fff0a5';ctx.beginPath();ctx.arc(x+6,y-12,4,0,Math.PI*2);ctx.fill();
      }else if(region==='creek'){
        ctx.fillStyle='#f0e4d0';ctx.beginPath();ctx.ellipse(x,y+6,21,15,0,Math.PI,0);ctx.closePath();ctx.fill();
        for(let i=-2;i<=2;i++){ctx.strokeStyle='#9cc5bd';ctx.lineWidth=2;ctx.beginPath();
          ctx.moveTo(x,y+19);ctx.lineTo(x+i*8,y-9);ctx.stroke();}
      }else if(region==='volcano'){
        ctx.fillStyle='#64565a';ctx.beginPath();ctx.moveTo(x-22,y+18);ctx.lineTo(x-14,y-6);
        ctx.lineTo(x+7,y-28);ctx.lineTo(x+23,y+18);ctx.closePath();ctx.fill();
        ctx.strokeStyle='#f3ae70';ctx.lineWidth=5;ctx.beginPath();
        ctx.moveTo(x+7,y-25);ctx.lineTo(x-5,y-1);ctx.lineTo(x+8,y+14);ctx.stroke();
      }else if(region==='ruins'){
        ctx.fillStyle='#a4a7c5';ctx.beginPath();ctx.ellipse(x,y,19,20,0,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='#eee4be';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,10,-2.1,1.5);ctx.stroke();
        ctx.fillStyle='#fff7dc';ctx.beginPath();ctx.arc(x+8,y-6,3,0,Math.PI*2);ctx.fill();
      }else{
        ctx.fillStyle='#b68e70';ctx.beginPath();ctx.ellipse(x,y+4,21,16,0,0,Math.PI*2);ctx.fill();
        for(let i=0;i<4;i++){ctx.strokeStyle='#f8d8a6';ctx.lineWidth=2;
          ctx.beginPath();ctx.arc(x,y+4,7+i*4,-2,2);ctx.stroke();}
      }
    }
    // Discovery sparkle clings to the object and does not float as a sticker.
    const glint=Math.max(0,Math.sin(t*3+node.bob))*5;
    if(glint>1){ctx.fillStyle='rgba(255,247,213,.65)';
      ctx.beginPath();ctx.ellipse(x+17,y-13,1.5+glint*.3,1.5+glint*.3,0,0,Math.PI*2);ctx.fill();}
    ctx.restore();
  }
  // ================================================================
  // DRAW — region exploration
  // ================================================================
  function drawRegion(ctx) {
    var w = world; if (!w) return;
    const screenW=game.W,screenH=game.H,view=regionViewport();
    var W = view.width, H = view.height, th = w.region.theme, cam = w.cam;
    // Clamp on draw as well as update: resize can happen while a panel pauses
    // simulation. Background and entities share this exact uniform transform.
    clampCamera(cam,view);
    ctx.save();ctx.scale(view.scale,view.scale);

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

    // Do not paint generic blurry decorative circles on top of five
    // individually illustrated maps; only legacy fallback needs them.
    if(!window.CatBondPaintedRegions?.region){
      drawDecorLayer(ctx, 0.4, th);
      drawDecorLayer(ctx, 0.8, th);
    }

    // world-space items (1:1 with camera)
    ctx.save();
    ctx.translate(-cam.x, -cam.y);

    // No duplicate back-to-map signpost in the scenery: the right-side
    // map directory is the single explicit region-switching control.

    // Small in-world chests, crystals and five unique secret relics.
    for(var j=0;j<w.nodes.length;j++){
      var n=w.nodes[j];if(n.taken)continue;
      drawWorldRelic(ctx,n,w.region.id,t);
    }

    // Real roaming full-body wild kittens, each with a ground shadow and gait.
    for (var i = 0; i < w.spawns.length; i++) {
      var s = w.spawns[i];
      if (s.cd >= 9999) continue;      // consumed
      var sp = window.GameData.speciesById(s.sp);
      var by=s.y; // Stay on the ground instead of bobbing like a sticker.
      // Wild cats must read at a glance on phones and in dark regions.
      var spInfo=window.GameData.speciesById(s.sp);
      var rColor=spInfo?.rarity==='SSR'?'#ffdc6c':spInfo?.rarity==='SR'?'#c49df2'
        :spInfo?.rarity==='R'?'#fff2bd':th.accent;
      // Distinct but grounded wild-cat discovery cue; no giant orbiting ring.
      ctx.save();ctx.strokeStyle=rColor;ctx.globalAlpha=.75;ctx.lineWidth=2.5;
      ctx.beginPath();ctx.ellipse(s.x,by+20,27,8,0,0,Math.PI*2);ctx.stroke();
      ctx.restore();
      const wildScale=game.H<480?.82:.87;
      if(window.CatMotion&&sp){
        CatMotion.draw(ctx,s.x,by,{species:sp,scale:wildScale,
          face:s.face,t:w.t,stride:s.stride,pose:'walk',motion:.75,mood:'alert'});
      }else if(window.CatArt&&sp){
        CatArt.drawCat(ctx,s.x,by,{species:sp,scale:wildScale,face:s.face,t,pose:'walk'});
      }
      // Player sees the exact Lv. and rarity BEFORE deciding to start the
      // encounter; the tag is compact but legible on small touch screens.
      if(spInfo){
        const label='Lv.'+(s.level||1)+' · '+spInfo.rarity;
        ctx.save();ctx.textAlign='center';ctx.font='800 11px system-ui';
        const ww=Math.max(62,ctx.measureText(label).width+17);
        ctx.fillStyle='#fffcf1e8';ctx.strokeStyle=rColor;ctx.lineWidth=1.5;
        ctx.beginPath();ctx.roundRect(s.x-ww/2,by-76,ww,23,10);
        ctx.fill();ctx.stroke();
        ctx.fillStyle='#465365';ctx.fillText(label,s.x,by-60);
        ctx.restore();
      }
    }

    // An actual duo expedition shows both kittens, with the second
    // following just behind the leader. This isn't a floating HUD sticker.
    const members=window.CatRelations?.chosen?.()||[];
    const leadCat=members[0]||
      window.State.S.cats?.find(c=>c.uid===window.State.S.battlePrefs?.teamUids?.[0])||
      window.State.S.cats?.[0];
    const companion=members.length===2?members.find(c=>c.uid!==leadCat?.uid):null;
    if(companion&&(window.CatMotion||window.CatArt)){
      const partnerSpecies=window.GameData.speciesById(companion.species);
      const render=window.CatMotion?.draw||window.CatArt?.drawCat;
      if(partnerSpecies&&render){
        // Gap keeps the partner from covering the player's face/ears.
        // Grown partners get breathing room without enlarging the explorer.
        const grown=!!((leadCat?.stage||0)||(companion.stage||0));
        const gap=(game.H<480?64:73)+(grown?5:0);
        const x=Math.max(53,Math.min(WORLD_W-53,w.px-(w.face||1)*gap));
        try{render(ctx,x,w.py+18,{
          species:partnerSpecies,scale:game.H<480?.78:.83,face:w.face,t:w.t,
          stride:w.walkT*11,motion:w.moving?.85:0,pose:w.moving?'walk':'idle',mood:'happy',
          growth:window.Growth?.visual(companion)||null
        });}catch(e){}
      }
    }
    // Distinguish the controllable kitten from roaming wild cats.
    ctx.save();ctx.fillStyle='rgba(255,248,206,.20)';
    ctx.strokeStyle='rgba(114,149,103,.82)';ctx.lineWidth=2.5;
    ctx.beginPath();ctx.ellipse(w.px,w.py+20,36,10,0,0,Math.PI*2);
    ctx.fill();ctx.stroke();ctx.restore();
    // player avatar (lead cat) + shadow
    var pose = w.moving ? 'walk' : 'idle';
    if (window.CatArt) {
      try { (window.CatMotion?.draw||CatArt.drawCat)(ctx,w.px,w.py,{
        species:playerSpecies(),scale:game.H<480?.95:1,face:w.face,t:w.t,
        stride:w.walkT*13,motion:w.moving?1:0,pose,mood:'happy',
        growth:leadCat&&window.Growth?Growth.visual(leadCat):null
      }); }
      catch (e2) { ctx.fillStyle = PINK; ctx.beginPath(); ctx.arc(w.px, w.py, 18, 0, Math.PI * 2); ctx.fill(); }
    }

    ctx.restore();

    ctx.restore(); // world transform; HUD remains in screen-space CSS pixels.
    W=screenW;H=screenH;
    // collect flash
    if (w.flash > 0) {
      ctx.globalAlpha = w.flash;
      ctx.fillStyle = GOLD; ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }

    drawRegionHUD(ctx);
    if(w.t<12){
      ctx.save();
      const en=window.MorrowwishI18n?.get?.()!=='zh';
      const hint=game.isTouch?(en?'Tap to walk · Drag to pan':'轻点草坪行走 · 手指拖动平移地图')
        :(en?'Click to walk · Mouse drag to pan':'点击草坪行走 · 鼠标拖拽查看周围');
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
    // Header menu/fullscreen/language/audio now occupy only the right side.
    // Keep the scene title just beneath the first row.
    // Region title sits slightly higher now that redundant second-row controls are gone.
    var narrow=W<650;
    // Leave a full touch-sized gap under the scene's upper-left yard button.
    // The progress bar stays in its own readable block, never underneath it.
    var back=backBounds();
    var hx=compact?64:(narrow?12:20),hy=Math.max(narrow?125:80,back.y+back.h+14),
      hw=compact?180:220,hh=compact?46:56;
    ctx.fillStyle = 'rgba(27,16,38,0.6)';
    roundRect(ctx,hx,hy,hw,hh,12);ctx.fill();
    ctx.textAlign='left';ctx.textBaseline='top';
    ctx.font=compact?'700 14px system-ui,sans-serif':'700 18px system-ui,sans-serif';ctx.fillStyle='#fff';
    ctx.fillText(window.MorrowwishI18n?.get?.()==='zh'?w.region.name:w.region.sub,hx+12,hy+6);
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
      ctx.fillText('点击行走 · 按住鼠标拖拽视角 · WASD也可移动',W/2,game.H-30);
    }
    // Keep the legacy canvas control only as a standalone fallback.
    if (!globalThis.document?.getElementById('cb-yard-return')) {
      var bbx=back.x,bby=back.y,bbw=back.w,bbh=back.h;
      ctx.fillStyle = 'rgba(30,20,45,0.92)'; roundRect(ctx, bbx, bby, bbw, bbh, 12); ctx.fill();
      ctx.strokeStyle = PINK; ctx.lineWidth = 1.5; roundRect(ctx, bbx, bby, bbw, bbh, 12); ctx.stroke();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '700 15px system-ui, sans-serif'; ctx.fillStyle = '#fff';
      ctx.font = (W<=360?'700 13px':'700 15px')+' system-ui, sans-serif';
      ctx.fillText(window.MorrowwishI18n?.get?.()==='zh'?(W<=360?'← 庭院':'← 回庭院'):'← Yard', bbx + bbw / 2, bby + bbh / 2);
    }
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }

  // ================================================================
  // EXPORT
  // ================================================================
  window.WorldMap = {
    init: init,
    enterMap: enterMap,
    enterRegion: enterRegion,
    resumeRegion: resumeRegion,
    update: update,
    draw: draw,
    handleTap: handleTap,
    setDestination: setDestination,
    panBy: panBy,
    get view(){return world&&{camX:world.cam.x,camY:world.cam.y,px:world.px,py:world.py,panMode:!!world.panMode,target:!!world.target, targetWorld:world.target?{x:world.target.x,y:world.target.y}:null,...regionViewport()};},
    onEncounter: onEncounter,
    onCollect: onCollect,
    onExit: onExit,
    exitToYard: exitToYard,
    isUnlocked: isUnlocked,
    REGIONS: REGIONS,
    get currentRegion() { return cur; },
    get mode() { return mode; },
    // read-only view of the current region's roaming spawns (species id + encounter level + any
    // counter-seed mark) — for the counter-floor regression test + telemetry. Never mutate via this.
    get spawns(){ return world && Array.isArray(world.spawns) ? world.spawns.map(function(s){ return {sp:s.sp, level:s.level, x:s.x, y:s.y, counterSeed:s._counterSeed||null}; }) : []; },
  };
})();
