// raising.js — idle/placement raising system (stations, offline, breeding,
// visitors, gacha pity, personality/trait, bond, shiny, golden butterfly).
// Pure logic + data only: NO DOM / canvas here. The integrator wires UI & draw.
//
// =====================================================================
// INTEGRATION  (read carefully — you have not seen this code)
// =====================================================================
// This module is self-contained and exposes a single global `window.Raising`.
// It stores ALL of its state under `State.S.raising = {...}` so it never
// collides with existing save fields. It mutates cat instances by ADDING new
// fields (personality, trait, bond, bondXp, shiny, traitRevealed) — existing
// fields are untouched.
//
// 1) BOOT ORDER (index.html): load AFTER data.js + state.js, before/after
//    game.js is fine. e.g. <script src="js/raising.js"></script>
//
// 2) ON GAME START, after `State.load()` (do this in main.js startGame, and
//    prefer this INSTEAD of State.applyIdle() — Raising.tick already does gentle
//    hunger/joy decay, so running both double-decays):
//        Raising.init();                       // ensures sub-state + cat fields
//        const report = Raising.applyOffline(Date.now());
//    `report` = {
//        minutes,                // real elapsed minutes (pre-cap, for display)
//        capped,                 // true if elapsed exceeded the 8h cap
//        produced:{coins?,fish?,yarn?,luck?},  // PENDING in stations, must be collected
//        gains:{coins,fish,yarn,luck},         // auto-granted (visitor gifts, already added to S)
//        visitors:[ {name,speciesId,rarity,gift,memento,rare} ],  // for a reveal animation
//        events:[ {type:'egg'|'butterfly', text} ]
//    }
//    Show a "欢迎回来" modal from this. produced = go collect at stations;
//    gains = already in the player's wallet; visitors/events = fun reveals.
//
// 3) GAME LOOP: once per frame call `Raising.tick(dt)` (dt in SECONDS). This is
//    the ONE reducer — online == offline. It returns a small delta:
//        { coins, fish, yarn, luck, xp, butterfly:bool }
//    `butterfly:true` on the frame a golden butterfly spawned → spawn a yard
//    sprite; call Raising.catchButterfly() when the player taps it.
//    Check Raising.butterflyActive() to know if one is currently out.
//
// 4) WHEN A NEW CAT IS CREATED (starter, capture win, gacha, hatch) call:
//        Raising.decorateNewCat(cat);   // rolls personality+trait, ~1% shiny
//    then State.S.cats.push(cat) as usual. (Raising.init() backfills any
//    pre-existing cats with personality/trait but will NOT retro-roll shiny.)
//
// 5) STATIONS (the economy). Read with Raising.stationsView() → array of:
//        {id,type,name,icon,res,level,stored,cap,pct,ratePerHour,catName,assignedUid,busy}
//    Actions (all take the station id string):
//        Raising.assignCat(stationId, catUid)   // one cat per station; auto-moves it
//        Raising.unassignCat(stationId)
//        Raising.collect(stationId)  -> {res, amount}   // moves stored → wallet
//        Raising.collectAll()        -> { coins?,fish?,... }
//        Raising.upgradeCost(stationId) -> {coins, yarn}
//        Raising.upgrade(stationId)  -> {ok, msg?}       // deducts cost, +1 level
//    Collected resources route to: fish→State.S.fish, coins→State.S.coins,
//    luck→State.S.luckLure (feeds GameData.rollSpecies), yarn→State.S.raising.yarn
//    (a NEW currency used only for upgrades — add a HUD chip if you like).
//    Use Raising.isBusy(uid) to grey out cats that are working/breeding.
//
// 6) BREEDING (nursery). Raising.startBreeding(uidA, uidB) -> {ok,msg?}.
//    Progresses via tick (works offline). Raising.breedingView() ->
//    {active, pct, ready, parents:[names]} or {active:false}. When ready,
//    Raising.collectEgg() -> {ok, cat, shiny, parents:[names], msg?}; push the
//    returned cat into State.S.cats and bump State.S.dex yourself. Preview odds
//    with Raising.breedPreview(uidA,uidB). Target combos: Raising.BREED_COMBOS.
//
// 7) GACHA (pity-protected). Raising.rollGacha(luck=0) ->
//    {species, rarity, pity, floored}. Create the cat with State.makeCat +
//    Raising.decorateNewCat. DUPES: if you already own species, offer
//    Raising.recycleCat(uid) -> {shards} (adds to State.S.raising.starShards),
//    or query Raising.shardValue(rarity). Pity counter persists in save.
//
// 8) BOND via gift. Raising.giftCat(uid) spends 1 State.S.treats ->
//    {ok, bond, leveled, story, msg?}. Higher bond = passive production buff
//    (auto-applied in station rate) + unlocks a one-line story (show `story`).
//    Badges for a cat detail panel: Raising.catBadges(cat) -> array of
//    {icon,name,hidden}; pass reveal=true once discovered (sets traitRevealed).
//
// 9) SAVE: call State.save() after any mutating action above (they do NOT
//    auto-save). Everything lives in the normal save blob.
// =====================================================================

// ---------- tunables ----------
const SHINY_RATE = 0.01;          // ~1%异色 on new cats
const PITY_CAP = 40;              // force >= SR at this pull count
const BOND_MAX = 5;
const OFFLINE_CAP_H = 8;          // offline earnings cap
const BREED_SECONDS = 2 * 3600;   // 2h egg timer (advances via tick, offline too)

// ---------- station catalogue ----------
// base = units PER HOUR at level 1 (scaled by 1.15^(level-1) and the cat).
const STATION_TYPES = {
  fishing: { name: '钓鱼位',   icon: '🎣', res: 'fish',  base: 2.5, cap: 20,  desc: '派猫钓鱼，攒小鱼干。' },
  yarn:    { name: '毛线坊',   icon: '🧶', res: 'yarn',  base: 9,   cap: 60,  desc: '织毛线团，升级站点的材料。' },
  sun:     { name: '晒太阳位', icon: '☀️', res: 'coins', base: 90,  cap: 270, desc: '持续赚金币：派猫上岗后约每分钟赚 1 枚，离线也继续生产；回工坊点收取到账。' },
  watch:   { name: '瞭望台',   icon: '🔭', res: 'luck',  base: 0.5, cap: 5,   desc: '瞭望远方，积攒好运（提升野猫稀有度）。' },
  nursery: { name: '暖窝',     icon: '🥚', res: null,    base: 0,   cap: 0,   desc: '把两只猫放进暖窝，孵化小猫。' },
};

// ---------- personality (visible) ----------
const PERSONALITIES = {
  glutton:  { name: '贪吃', icon: '🍗', weight: 22, prod: 1.0,  decay: 1.3, note: '饿得快，但吃饱后干劲十足。' },
  diligent: { name: '勤劳', icon: '💪', weight: 20, prod: 1.18, decay: 1.0, note: '站点产出 +18%。' },
  lazy:     { name: '慵懒', icon: '😴', weight: 20, prod: 0.9,  decay: 0.55, note: '产出 -10%，但几乎不掉状态。' },
  clever:   { name: '机敏', icon: '✨', weight: 19, prod: 1.05, decay: 1.0, luck: 1.6, note: '更容易招来访客与好运。' },
  gentle:   { name: '温柔', icon: '🌸', weight: 19, prod: 1.0,  decay: 1.0, bond: 1.6, note: '羁绊成长更快。' },
};

// ---------- hidden trait (revealed via play) ----------
const TRAITS = {
  none:    { name: '—',    icon: '·',  weight: 55, note: '没有特殊天赋。', },
  goldpaw: { name: '金爪',  icon: '🐾', weight: 10, note: '金币产出 +12%。', res: { coins: 1.12 } },
  angler:  { name: '钓王',  icon: '🎣', weight: 9,  note: '小鱼干产出 +20%。', res: { fish: 1.20 } },
  weaver:  { name: '巧手',  icon: '🧶', weight: 9,  note: '毛线产出 +20%。', res: { yarn: 1.20 } },
  charm:   { name: '招财',  icon: '🧧', weight: 7,  note: '访客更慷慨。', visitor: 1.4 },
  warrior: { name: '斗志',  icon: '⚔️', weight: 6,  note: '战斗力 +8%（战斗系统可读取 trait）。', battle: 1.08 },
  fortune: { name: '福星',  icon: '🍀', weight: 4,  note: '异色后代概率翻倍。', shiny: 2 },
};

// ---------- breeding target combos (either order; others inherit a parent) ----------
const BREED_COMBOS = [
  { a: 'tangyuan', b: 'doudou',  result: 'sanhua',   chance: 0.4,  note: '橘猫 + 狸花 → 三花' },
  { a: 'lanbao',   b: 'dundun',  result: 'yunduo',   chance: 0.35, note: '蓝猫 + 银渐层 → 布偶云朵' },
  { a: 'xianluo',  b: 'yinghua', result: 'youling',  chance: 0.3,  note: '暹罗 + 樱花 → 幽灵' },
  { a: 'senlin',   b: 'jinwu',   result: 'xingchen', chance: 0.12, note: '森林 + 金乌 → 星尘(极罕见)' },
  { a: 'niuniu',   b: 'nainai',  result: 'lixiao',   chance: 0.4,  note: '奶牛 + 奶白 → 礼小绅士' },
];

const MEMENTOS = ['小鱼骨', '毛线球', '松果', '贝壳', '铃铛', '干花', '玻璃珠', '猫薄荷'];
const BOND_STORIES = [
  '',
  '它第一次主动蹭了蹭你的手心。',
  '它会在你回家时跑到门口迎接。',
  '夜里它悄悄睡到了你的枕边。',
  '它把最爱的毛线球叼来送给你。',
  '无论走到哪，它的目光都追随着你。',
];

// ---------- rng helpers ----------
function rand(a, b) { return a + Math.random() * (b - a); }
function randInt(a, b) { return Math.floor(rand(a, b + 1)); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function chance(p) { return Math.random() < p; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function weightedKey(table) {
  let total = 0;
  for (const k in table) total += table[k].weight || 0;
  let roll = Math.random() * total;
  for (const k in table) { if ((roll -= (table[k].weight || 0)) <= 0) return k; }
  return Object.keys(table)[0];
}

// ---------- state access ----------
function raising() { return State.S.raising; }
function findCat(uid) { return (State.S.cats || []).find(c => c.uid === uid); }

function defaultStations() {
  return [
    { id: 'st_fish',   type: 'fishing', level: 1, stored: 0, assignedUid: null },
    { id: 'st_yarn',   type: 'yarn',    level: 1, stored: 0, assignedUid: null },
    { id: 'st_sun',    type: 'sun',     level: 1, stored: 0, assignedUid: null },
    { id: 'st_watch',  type: 'watch',   level: 1, stored: 0, assignedUid: null },
    { id: 'st_nursery',type: 'nursery', level: 1, stored: 0, assignedUid: null },
  ];
}

function defaultRaising() {
  return {
    ver: 1,
    yarn: 0,
    starShards: 0,
    offlineCapH: OFFLINE_CAP_H,
    stations: defaultStations(),
    pity: { count: 0 },
    breeding: null,
    butterfly: { active: false, spawnAt: 0 },
    mementos: {},
    firstSunPay:false,
  };
}

// Ensure sub-state + per-cat fields exist. Safe to call repeatedly.
function init() {
  if (!window.State || !State.S) return null;
  if (!State.S.raising) State.S.raising = defaultRaising();
  const r = State.S.raising;
  if (!r.stations) r.stations = defaultStations();
  if (!r.pity) r.pity = { count: 0 };
  if (!r.butterfly) r.butterfly = { active: false, spawnAt: 0 };
  if (r.yarn == null) r.yarn = 0;
  if (r.starShards == null) r.starShards = 0;
  if (r.offlineCapH == null) r.offlineCapH = OFFLINE_CAP_H;
  if (!('breeding' in r)) r.breeding = null;
  if (!r.mementos) r.mementos = {};
  if(r.firstSunPay==null)r.firstSunPay=!!(r.stations||[]).find(st=>st.type==='sun'&&(st.assignedUid||st.stored));
  (State.S.cats || []).forEach(ensureCatFields);
  return r;
}

// ---------- cat fields: personality / trait / bond / shiny ----------
function rollPersonality() { return weightedKey(PERSONALITIES); }
function rollTrait() { return weightedKey(TRAITS); }

function ensureCatFields(cat) {
  if (!cat) return cat;
  if (!cat.personality) cat.personality = rollPersonality();
  if (!cat.trait) cat.trait = rollTrait();
  if (cat.bond == null) cat.bond = 0;
  if (cat.bondXp == null) cat.bondXp = 0;
  if (cat.shiny == null) cat.shiny = false;
  if (cat.traitRevealed == null) cat.traitRevealed = false;
  return cat;
}

// Call for brand-new cats so they get a ~1% shiny roll (existing cats don't).
function decorateNewCat(cat, opts) {
  ensureCatFields(cat);
  const tr = TRAITS[cat.trait];
  let odds = (opts && opts.shinyOdds != null) ? opts.shinyOdds : SHINY_RATE;
  if (tr && tr.shiny) odds *= tr.shiny; // 福星 parents handled at breed time
  if (!cat.shiny && chance(odds)) cat.shiny = true;
  return cat;
}

function bondLevel(cat) { return (cat && cat.bond) || 0; }
function bondReq(level) { return level * 30; }

// ---------- stations ----------
function stationById(id) { return (raising().stations || []).find(s => s.id === id); }
function assignedCat(st) { return st && st.assignedUid ? findCat(st.assignedUid) : null; }
function stationCap(st) {
  const t = STATION_TYPES[st.type];
  return Math.round(t.cap * (1 + 0.5 * (st.level - 1)));
}

// per-HOUR production for a station (0 if no worker or non-producing type).
function stationRate(st) {
  const t = STATION_TYPES[st.type];
  if (!t || !t.res) return 0;
  const cat = assignedCat(st);
  if (!cat) return 0;
  let mult = 0.75 + clamp((cat.affinity || 0) / 100, 0, 1) * 0.75; // 0.75x..1.5x by bond
  const p = PERSONALITIES[cat.personality];
  if (p) mult *= p.prod;
  mult *= 1 + bondLevel(cat) * 0.04;                               // gift-bond buff
  const tr = TRAITS[cat.trait];
  if (tr && tr.res && tr.res[t.res]) mult *= tr.res[t.res];
  return t.base * Math.pow(1.15, st.level - 1) * mult;
}

function isBusy(uid) {
  const r = raising();
  if (r.breeding && !r.breeding.done && (r.breeding.aUid === uid || r.breeding.bUid === uid)) return true;
  return (r.stations || []).some(s => s.assignedUid === uid);
}

function assignCat(stationId, uid) {
  init();
  const st = stationById(stationId);
  if (!st) return { ok: false, msg: '没有这个站点' };
  if (st.type === 'nursery') return { ok: false, msg: '暖窝请用繁育功能' };
  const cat = findCat(uid);
  if (!cat) return { ok: false, msg: '找不到猫猫' };
  // a cat only works one place — pull it off any other station first
  raising().stations.forEach(s => { if (s.assignedUid === uid) s.assignedUid = null; });
  st.assignedUid = uid;
  let firstPay=0;
  if(st.type==='sun'&&!raising().firstSunPay){
    firstPay=Math.min(12,Math.max(0,stationCap(st)-st.stored));
    st.stored+=firstPay;raising().firstSunPay=true;
  }
  return {ok:true,firstPay};
}

function unassignCat(stationId) {
  const st = stationById(stationId);
  if (st) st.assignedUid = null;
  return { ok: !!st };
}

function resWallet(res, amount) {
  if (amount <= 0) return;
  if (res === 'coins') State.S.coins += amount;
  else if (res === 'fish') State.S.fish += amount;
  else if (res === 'yarn') raising().yarn += amount;
  else if (res === 'luck') State.S.luckLure = (State.S.luckLure || 0) + amount;
}

function collect(stationId) {
  init();
  const st = stationById(stationId);
  const t = st && STATION_TYPES[st.type];
  if (!st || !t || !t.res) return { res: null, amount: 0 };
  const amount = Math.floor(st.stored);
  if (amount > 0) { resWallet(t.res, amount); st.stored -= amount; }
  return { res: t.res, amount };
}

function collectAll() {
  init();
  const got = {};
  (raising().stations || []).forEach(s => {
    const r = collect(s.id);
    if (r.res && r.amount) got[r.res] = (got[r.res] || 0) + r.amount;
  });
  return got;
}

function upgradeCost(stationId) {
  const st = stationById(stationId);
  if (!st) return { coins: 0, yarn: 0 };
  return {
    coins: Math.round(25 * Math.pow(1.15, st.level)),
    yarn: Math.round(8 * Math.pow(1.15, st.level)),
  };
}

function upgrade(stationId) {
  init();
  const st = stationById(stationId);
  if (!st) return { ok: false, msg: '没有这个站点' };
  const cost = upgradeCost(stationId);
  if (State.S.coins < cost.coins) return { ok: false, msg: '金币不够' };
  if (raising().yarn < cost.yarn) return { ok: false, msg: '毛线不够' };
  State.S.coins -= cost.coins;
  raising().yarn -= cost.yarn;
  st.level++;
  return { ok: true, level: st.level };
}

function stationsView() {
  init();
  return (raising().stations || []).map(st => {
    const t = STATION_TYPES[st.type];
    const cat = assignedCat(st);
    const cap = stationCap(st);
    return {
      id: st.id, type: st.type, name: t.name, icon: t.icon, res: t.res,
      level: st.level, stored: Math.floor(st.stored), storedExact: st.stored, cap,
      pct: cap ? clamp(st.stored / cap, 0, 1) : 0,
      ratePerHour: Math.round(stationRate(st) * 10) / 10,
      catName: cat ? speciesName(cat) : null, active: !!cat,
      assignedUid: st.assignedUid || null,
      desc: t.desc,
    };
  });
}

// ---------- the ONE reducer: tick(dtSeconds) ----------
function tick(dt) {
  init();
  const r = raising();
  const delta = { coins: 0, fish: 0, yarn: 0, luck: 0, xp: 0, butterfly: false };
  if (!(dt > 0)) return delta;
  const hours = dt / 3600;

  // station production + sun-station cat care
  for (const st of (r.stations || [])) {
    const t = STATION_TYPES[st.type];
    if (!t) continue;
    if (st.type === 'sun') {
      const cat = assignedCat(st);
      if (cat) {
        cat.joy = Math.min(100, (cat.joy == null ? 70 : cat.joy) + hours * 8);
        const gain = Math.round(hours * (6 + cat.level));
        if (gain > 0) { State.addXp(cat, gain); delta.xp += gain; }
      }
    }
    if (!t.res) continue;
    const cap = stationCap(st);
    if (st.stored < cap && assignedCat(st)) {
      const before = st.stored;
      st.stored = Math.min(cap, st.stored + stationRate(st) * hours);
      const res = t.res; delta[res] = (delta[res] || 0) + (st.stored - before);
    }
  }

  // gentle decay for all cats (days, not minutes). personality softens it.
  for (const c of (State.S.cats || [])) {
    const p = PERSONALITIES[c.personality];
    const dmul = p ? p.decay : 1;
    c.hunger = Math.max(0, (c.hunger == null ? 70 : c.hunger) - hours * 0.4 * dmul);
    if (!onSunDuty(c.uid)) c.joy = Math.max(0, (c.joy == null ? 70 : c.joy) - hours * 0.3 * dmul);
  }

  // breeding advances purely via tick (so offline == online)
  if (r.breeding && !r.breeding.done) {
    r.breeding.progress = (r.breeding.progress || 0) + dt;
    if (r.breeding.progress >= r.breeding.duration) r.breeding.done = true;
  }

  // random golden butterfly: ~once/20min expected while none is out
  if (!r.butterfly.active && chance(Math.min(0.9, dt / 1200))) {
    r.butterfly.active = true;
    r.butterfly.spawnAt = Date.now();
    delta.butterfly = true;
  }
  return delta;
}

function onSunDuty(uid) {
  return (raising().stations || []).some(s => s.type === 'sun' && s.assignedUid === uid);
}

// ---------- offline earnings (capped) ----------
function applyOffline(now) {
  init();
  const r = raising();
  now = now || Date.now();
  const last = State.S.lastSeen || now;
  const rawMs = Math.max(0, now - last);
  const capMs = (r.offlineCapH || OFFLINE_CAP_H) * 3600 * 1000;
  const ms = Math.min(rawMs, capMs);
  const secs = ms / 1000;
  const minutes = Math.round(ms / 60000);

  // snapshot station stores to report what accumulated (pending collection)
  const before = (r.stations || []).map(s => s.stored);
  tick(secs);
  const produced = {};
  (r.stations || []).forEach((s, i) => {
    const t = STATION_TYPES[s.type];
    if (!t || !t.res) return;
    const d = s.stored - before[i];
    if (d > 0.01) produced[t.res] = Math.floor((produced[t.res] || 0) + d);
  });

  // visitors leave gifts directly into the wallet (Neko-Atsume charm)
  const visitors = rollVisitors(minutes);
  const gains = { coins: 0, fish: 0, yarn: 0, luck: 0 };
  for (const v of visitors) {
    for (const k in v.gift) gains[k] = (gains[k] || 0) + v.gift[k];
    if (v.memento) r.mementos[v.memento] = (r.mementos[v.memento] || 0) + 1;
  }
  for (const k in gains) resWallet(k, gains[k]);

  const events = [];
  if (r.breeding && r.breeding.done) events.push({ type: 'egg', text: '🥚 暖窝里的蛋可以孵化啦！' });
  if (r.butterfly.active) events.push({ type: 'butterfly', text: '🦋 院子里出现了一只金色蝴蝶！' });

  State.S.lastSeen = now;
  return { minutes, capped: rawMs > capMs, produced, gains, visitors, events };
}

// ---------- visitors (weighted, offline reveal) ----------
function rollVisitors(minutes) {
  init();
  const out = [];
  if (minutes < 10) return out;
  const owned = State.S.cats || [];
  // boost from 机敏 cats + stored watch-luck
  let luckBoost = 0;
  owned.forEach(c => { if (c.personality === 'clever') luckBoost += 0.02; });
  const n = clamp(Math.floor(minutes / 60) + (chance(0.5) ? 1 : 0), 0, 6);
  for (let i = 0; i < n; i++) {
    const rare = chance(0.05 + luckBoost);
    let sp;
    if (rare) {
      const pool = GameData.SPECIES.filter(s => s.rarity === 'SR' || s.rarity === 'SSR');
      sp = pick(pool);
    } else if (owned.length) {
      sp = GameData.speciesById(pick(owned).species) || pick(GameData.SPECIES);
    } else {
      sp = pick(GameData.SPECIES.filter(s => s.rarity === 'N'));
    }
    // 招财 trait makes visitors more generous (works even if still hidden)
    let charm = 1;
    owned.forEach(c => { if (c.trait === 'charm') charm = Math.max(charm, TRAITS.charm.visitor); });
    const gift = {};
    if (rare) {
      gift.coins = Math.round(randInt(40, 80) * charm);
      gift.fish = 2;
      gift.yarn = randInt(4, 10);
    } else {
      gift.coins = Math.round(randInt(6, 18) * charm);
      if (chance(0.3)) gift.fish = 1;
      if (chance(0.3)) gift.yarn = randInt(2, 6);
    }
    out.push({
      name: sp.name, speciesId: sp.id, rarity: sp.rarity,
      gift, memento: chance(rare ? 0.9 : 0.4) ? pick(MEMENTOS) : null, rare,
    });
  }
  return out;
}

// ---------- breeding ----------
function startBreeding(uidA, uidB) {
  init();
  const r = raising();
  if (r.breeding && !r.breeding.done) return { ok: false, msg: '暖窝已经有蛋在孵了' };
  if (uidA === uidB) return { ok: false, msg: '需要两只不同的猫猫' };
  const a = findCat(uidA), b = findCat(uidB);
  if (!a || !b) return { ok: false, msg: '找不到猫猫' };
  if (isBusy(uidA) || isBusy(uidB)) return { ok: false, msg: '猫猫正在忙（工作或繁育中）' };
  r.breeding = { aUid: uidA, bUid: uidB, progress: 0, duration: BREED_SECONDS, done: false, startAt: Date.now() };
  return { ok: true };
}

function breedPreview(uidA, uidB) {
  const a = findCat(uidA), b = findCat(uidB);
  if (!a || !b) return null;
  const combo = findCombo(a.species, b.species);
  let shinyOdds = SHINY_RATE;
  if (a.trait === 'fortune' || b.trait === 'fortune') shinyOdds *= 2;
  return {
    combo: combo ? { result: GameData.speciesById(combo.result).name, chance: combo.chance, note: combo.note } : null,
    fallback: '否则随机继承一位父母的品种',
    shinyOdds: Math.round(shinyOdds * 1000) / 10 + '%',
  };
}

function findCombo(sa, sb) {
  return BREED_COMBOS.find(c => (c.a === sa && c.b === sb) || (c.a === sb && c.b === sa)) || null;
}

function breedingView() {
  init();
  const r = raising();
  if (!r.breeding) return { active: false };
  const a = findCat(r.breeding.aUid), b = findCat(r.breeding.bUid);
  return {
    active: true,
    ready: !!r.breeding.done,
    pct: clamp((r.breeding.progress || 0) / r.breeding.duration, 0, 1),
    parents: [a ? speciesName(a) : '?', b ? speciesName(b) : '?'],
    remainSec: Math.max(0, r.breeding.duration - (r.breeding.progress || 0)),
  };
}

function collectEgg() {
  init();
  const r = raising();
  if (!r.breeding) return { ok: false, msg: '暖窝里没有蛋' };
  if (!r.breeding.done) return { ok: false, msg: '蛋还没孵好' };
  const a = findCat(r.breeding.aUid), b = findCat(r.breeding.bUid);
  if (!a || !b) { r.breeding = null; return { ok: false, msg: '父母不见了' }; }

  // decide species: combo target, else inherit a parent
  const combo = findCombo(a.species, b.species);
  let speciesId;
  if (combo && chance(combo.chance)) speciesId = combo.result;
  else speciesId = chance(0.5) ? a.species : b.species;

  const kit = State.makeCat(speciesId, { affinity: 10 });
  ensureCatFields(kit);
  // inherit personality from a random parent; trait small chance to pass down
  kit.personality = chance(0.5) ? a.personality : b.personality;
  const donor = chance(0.5) ? a : b;
  if (donor.trait && donor.trait !== 'none' && chance(0.5)) kit.trait = donor.trait;
  // shiny: base + 福星 parent doubles
  let odds = SHINY_RATE;
  if (a.trait === 'fortune' || b.trait === 'fortune') odds *= 2;
  kit.shiny = chance(odds);
  kit.bornFrom = [a.species, b.species];

  r.breeding = null;
  return { ok: true, cat: kit, shiny: kit.shiny, parents: [speciesName(a), speciesName(b)] };
}

// ---------- gacha (pity-protected) ----------
function rollRarity(luck, floor) {
  const order = ['N', 'R', 'SR', 'SSR'];
  const rs = order.map(k => GameData.RARITY[k]);
  let total = 0;
  const adj = rs.map(r => {
    const bias = r.key === 'N' ? (1 - luck * 0.6) : (1 + luck * (r.key === 'SSR' ? 3 : r.key === 'SR' ? 2 : 1));
    const w = Math.max(0, r.weight * bias); total += w; return { k: r.key, w };
  });
  let roll = Math.random() * total, chosen = 'N';
  for (const a of adj) { if ((roll -= a.w) <= 0) { chosen = a.k; break; } }
  if (floor && (chosen === 'N' || chosen === 'R')) chosen = chance(0.15) ? 'SSR' : 'SR';
  return chosen;
}

function rollGacha(luck) {
  init();
  const p = raising().pity;
  p.count = (p.count || 0) + 1;
  const floor = p.count >= PITY_CAP;
  const rarity = rollRarity(luck || 0, floor);
  if (rarity === 'SR' || rarity === 'SSR') p.count = 0;
  const pool = GameData.SPECIES.filter(s => s.rarity === rarity);
  return { species: pick(pool), rarity, pity: p.count, floored: floor };
}

// ---------- dupes → star shards ----------
function shardValue(rarity) { return ({ N: 1, R: 3, SR: 8, SSR: 20 })[rarity] || 1; }

function recycleCat(uid) {
  init();
  const cats = State.S.cats || [];
  const idx = cats.findIndex(c => c.uid === uid);
  if (idx < 0) return { ok: false, msg: '找不到猫猫' };
  if (isBusy(uid)) return { ok: false, msg: '猫猫正在忙' };
  const cat = cats[idx];
  const sp = GameData.speciesById(cat.species);
  let shards = shardValue(sp ? sp.rarity : 'N');
  if (cat.shiny) shards *= 3;
  cats.splice(idx, 1);
  raising().starShards += shards;
  return { ok: true, shards, total: raising().starShards };
}

// ---------- bond via gift ----------
function giftCat(uid) {
  init();
  const cat = findCat(uid);
  if (!cat) return { ok: false, msg: '找不到猫猫' };
  if ((State.S.treats || 0) <= 0) return { ok: false, msg: '没有零食了' };
  ensureCatFields(cat);
  State.S.treats--;
  const p = PERSONALITIES[cat.personality];
  const bondMul = p && p.bond ? p.bond : 1;
  cat.bondXp += Math.round(10 * bondMul);
  let leveled = false, story = null;
  while (cat.bond < BOND_MAX && cat.bondXp >= bondReq(cat.bond + 1)) {
    cat.bondXp -= bondReq(cat.bond + 1);
    cat.bond++;
    leveled = true;
    story = bondStory(cat);
  }
  cat.affinity = Math.min(100, (cat.affinity || 0) + 3);
  cat.joy = Math.min(100, (cat.joy || 0) + 6);
  cat.hunger = Math.min(100, (cat.hunger || 0) + 8);
  return { ok: true, bond: cat.bond, bondXp: cat.bondXp, next: bondReq(cat.bond + 1), leveled, story };
}

function bondStory(cat) {
  const line = BOND_STORIES[Math.min(cat.bond, BOND_STORIES.length - 1)] || '';
  return speciesName(cat) + '：' + line;
}

// ---------- golden butterfly ----------
function butterflyActive() { init(); return !!raising().butterfly.active; }

function catchButterfly() {
  init();
  const r = raising();
  if (!r.butterfly.active) return { ok: false };
  r.butterfly.active = false;
  const reward = { coins: randInt(30, 70) };
  if (chance(0.4)) reward.treats = 1;
  if (chance(0.15)) reward.fish = 1;
  resWallet('coins', reward.coins);
  if (reward.treats) State.S.treats += reward.treats;
  if (reward.fish) State.S.fish += reward.fish;
  return { ok: true, reward };
}

// ---------- render-data helpers ----------
function speciesName(cat) {
  const sp = GameData.speciesById(cat.species);
  return (cat.shiny ? '✨' : '') + (sp ? sp.name : '猫猫');
}

// Badges for a cat detail panel. reveal=true marks the hidden trait discovered.
function catBadges(cat, reveal) {
  ensureCatFields(cat);
  if (reveal) cat.traitRevealed = true;
  const out = [];
  const p = PERSONALITIES[cat.personality];
  if (p) out.push({ icon: p.icon, name: p.name, note: p.note, hidden: false });
  const tr = TRAITS[cat.trait];
  if (tr && cat.trait !== 'none') {
    out.push(cat.traitRevealed
      ? { icon: tr.icon, name: tr.name, note: tr.note, hidden: false }
      : { icon: '❔', name: '隐藏天赋', note: '多相处就会显现…', hidden: true });
  }
  if (cat.bond > 0) out.push({ icon: '💗', name: '羁绊 Lv.' + cat.bond, note: bondStory(cat), hidden: false });
  if (cat.shiny) out.push({ icon: '✨', name: '异色', note: '稀有的异色毛发。', hidden: false });
  return out;
}

// ---------- public surface ----------
window.Raising = {
  // core
  init, tick, applyOffline,
  // stations
  STATION_TYPES, stationsView, assignCat, unassignCat, collect, collectAll,
  upgrade, upgradeCost, stationRate, isBusy,
  // cats: personality / trait / shiny / bond
  PERSONALITIES, TRAITS, rollPersonality, rollTrait, ensureCatFields,
  decorateNewCat, giftCat, bondLevel, catBadges,
  // visitors
  rollVisitors,
  // breeding
  BREED_COMBOS, startBreeding, breedPreview, breedingView, collectEgg,
  // gacha + recycling
  rollGacha, shardValue, recycleCat,
  // butterfly
  butterflyActive, catchButterfly,
  // config
  config: { SHINY_RATE, PITY_CAP, BOND_MAX, OFFLINE_CAP_H, BREED_SECONDS },
};
