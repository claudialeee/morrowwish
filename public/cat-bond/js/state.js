// state.js — persistent game state, save/load, and raising/economy logic.

const SAVE_KEY = 'catbond_save_v1';
const SAVE_SLOTS_KEY = 'catbond_save_slots_v1';
const ACTIVE_SLOT_KEY = 'catbond_active_slot_v1';
const SAVE_SLOT_IDS = ['slot1','slot2','slot3'];

const DEFAULT_STATE = () => ({
  coins: 50,           // general currency (shop, buildings, skill learning, upgrades)
  medkits: 2, // dedicated medical supplies (legacy saves receive 2 once)
  fish: 5,             // cat-raising / feeding / premium currency (luck lures, old treats folded in)
  luckLure: 0,         // active luck boost charges
  cats: [],            // owned cats (instances)
  dex: {},             // speciesId -> count caught
  lastSeen: Date.now(),
  lastDaily: 0,
  streak: 0,
  tutorialDone: false,
  catchCount: 0,
  petCount: 0, // real taps on living cats, across sessions
  yardBuildings: [], // placed yard play-structures {type,x,y}: 猫爬架/猫抓板/猫猫洞…
  bondingRewards: [], // claimed bonding milestones
  collectionMilestones: [], // one-time, cumulative codex discovery rewards
  repeatSightings: 0, // repeated already-owned species encountered while searching
  battlePrefs: { autoBattle: false }, // remember the last combat control choice across captures and reloads
  // Difficulty mode: 'casual' (战斗力求没难度 — player hits harder, wild cats are
  // softer, level-gap suppression nearly off) or 'hardcore' (current tuning + a
  // STRONGER level-gap 等级压制). Default casual so the game is approachable; hardcore
  // is an opt-in toggle in the pause/settings menu. battle.js reads this.
  difficulty: 'casual',
  bestGrades: {}, // speciesId -> best capture score (C/B/A/S), for rematches
  masteryBadges: {}, // speciesId -> true; only a first S earns a permanent Golden Paw
  // Tiny adaptive-AI profile: enemies learn the player's habits across battles.
  // Plain statistics (EMAs + a decayed element table), all clamped. ~200 bytes.
  aiProfile: { v: 1, battles: 0, dodgeDir: 0, favRange: 0.5, evasive: 0.4, aggression: 0.5, elemLead: {}, skill: 0.5, adapt: true },
});

let S = DEFAULT_STATE();

// --- cat instance factory ---
let _uid = 1;
function makeCat(speciesId, opts = {}) {
  const sp = GameData.speciesById(speciesId);
  const rar = GameData.RARITY[sp.rarity];
  const jitter = () => 0.85 + Math.random() * 0.3;
  return {
    uid: 'c' + (_uid++) + '_' + Math.floor(Math.random() * 9999),
    species: speciesId,
    nickname: '',     // player-given name; falls back to species name
    level: 1,
    xp: 0,
    affinity: opts.affinity || 0,     // 0..100 bond
    stats: {
      pow: Math.round(sp.base.pow * rar.statMul * jitter()),
      agi: Math.round(sp.base.agi * rar.statMul * jitter()),
      vit: Math.round(sp.base.vit * rar.statMul * jitter()),
      cha: Math.round(sp.base.cha * rar.statMul * jitter()),
    },
    hunger: 70,       // 0..100, decays over time
    joy: 70,          // 0..100
    caughtAt: opts.caughtAt || Date.now(),
    learned: [],      // skill ids this cat has explicitly LEARNED/unlocked at a trainer
    battlesWon: 0,    // wins with this cat on the field (feeds a 领悟 skill-learning quest)
    // ---- growth forms (universal evolution; every cat can reach 灵) ----
    stage: 0,         // 0=幼 1=成 2=灵(觉醒)
    awaken: null,     // 'pow'|'agi'|'cha' aura branch chosen at stage 2
  };
}

function xpToNext(level) { return 20 + level * level * 8; }

// display name: player nickname if set, else species name
function catName(cat) {
  if (!cat) return window.MorrowwishI18n?.get?.()==='zh'?'猫猫':'Kitten';
  // Assign unique names deterministically across the entire save, including
  // duplicate breeds AND user-defined nicknames. Never delete a collected cat.
  const cats = Array.isArray(S.cats) ? S.cats : [];
  const used = new Set();
  const english=window.MorrowwishI18n?.get?.()!=='zh';
  const prefixes=english
    ?['Little ','Sunny ','Lucky ','Sweet ','Star ','Mimi ','Moon ','Coco ','Tiny ']
    :['小','阿','甜','糯','团','米','奶','星','云','花','桃','栗'];
  const displayBase=c=>c.nickname || GameData.speciesName?.(c.species) ||
    GameData.speciesById(c.species)?.name || (english?'Kitten':'猫猫');
  for(const owned of cats){
    const base = displayBase(owned);
    let name=base,attempt=0;
    while(used.has(name)){
      name=attempt<prefixes.length ? prefixes[attempt]+base : base+' '+(attempt-prefixes.length+2);
      attempt++;
    }
    used.add(name);
    if(owned.uid===cat.uid)return name;
  }
  return displayBase(cat);
}

// Per-level growth is shaped by the cat's BREED identity, RARITY and awaken branch,
// not a flat bump — so a cat levels up ALONG its character. A breed's base-stat
// profile sets how each stat grows (a high-pow bruiser gains more pow/level), the
// rarity statMul scales total growth (legends out-scale commons), and an awakened
// branch pours extra into its chosen stat. This makes level genuinely matter and
// keeps distinct breeds feeling distinct as they grow.
function statGrowth(cat) {
  const sp = GameData.speciesById(cat.species);
  const base = (sp && sp.base) || { pow: 6, agi: 6, vit: 6, cha: 6 };
  const rar = sp ? GameData.RARITY[sp.rarity] : null;
  const rarMul = rar ? rar.statMul : 1;                 // N 1.0 → SSR 2.1
  const total = base.pow + base.agi + base.vit + base.cha || 1;
  // ~5.5 stat-points per level for a common, scaled by rarity, split by the breed's
  // profile so the biggest base stat grows fastest. Awaken branch gets a bonus share.
  const budget = 5.5 * rarMul;
  const out = {};
  for (const k of ['pow', 'agi', 'vit', 'cha']) {
    let share = base[k] / total;
    if (cat.awaken === k) share += 0.25;                 // 灵 awakening favours its aura stat
    out[k] = budget * share;
  }
  return out;
}

function addXp(cat, amount) {
  cat.xp += amount;
  let leveled = 0;
  while (cat.xp >= xpToNext(cat.level)) {
    cat.xp -= xpToNext(cat.level);
    cat.level++;
    leveled++;
    const g = statGrowth(cat);
    // accumulate fractional growth so small per-level shares still add up cleanly
    cat._gacc = cat._gacc || { pow: 0, agi: 0, vit: 0, cha: 0 };
    for (const k of ['pow', 'agi', 'vit', 'cha']) {
      cat._gacc[k] += g[k] + (Math.random() * 0.6 - 0.3);   // tiny jitter so twins differ
      const whole = Math.max(1, Math.round(cat._gacc[k]));   // always at least +1
      cat.stats[k] += whole;
      cat._gacc[k] -= whole;
    }
  }
  return leveled;
}

function catPower(cat) {
  const s = cat.stats;
  return Math.round((s.pow + s.agi + s.vit + s.cha) * (1 + cat.level * 0.05) * (1 + cat.affinity / 200));
}

// Affinity gates: higher affinity unlocks better capture support.
function bondTier(cat) {
  if (cat.affinity >= 100) return 3;
  if (cat.affinity >= 60) return 2;
  if (cat.affinity >= 25) return 1;
  return 0;
}

// --- three-slot persistence (legacy single-save migration is automatic) ---
function readSlots() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SAVE_SLOTS_KEY) || 'null');
    if (parsed && parsed.version === 1 && parsed.slots && typeof parsed.slots === 'object') return parsed;
  } catch (e) {}
  return { version: 1, slots: {} };
}
function writeSlots(book) {
  try { localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(book)); return true; }
  catch (e) { return false; }
}
function activeSlot() {
  const id = localStorage.getItem(ACTIVE_SLOT_KEY);
  return SAVE_SLOT_IDS.includes(id) ? id : 'slot1';
}
function setActiveSlot(id) {
  if (!SAVE_SLOT_IDS.includes(id)) return false;
  try { localStorage.setItem(ACTIVE_SLOT_KEY, id); } catch (e) {}
  return true;
}
function migrateLegacySave() {
  const book = readSlots();
  if (SAVE_SLOT_IDS.some(id => book.slots[id]?.data)) return book;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const legacy = JSON.parse(raw);
      if (legacy && typeof legacy === 'object' && Array.isArray(legacy.cats)) {
        book.slots.slot1 = { data: legacy, savedAt: Number(legacy.lastSeen) || Date.now(), migrated: true };
        writeSlots(book);
        setActiveSlot('slot1');
      }
    }
  } catch (e) {}
  return book;
}
function save() {
  S.lastSeen = Date.now();
  try {
    const raw = JSON.stringify(S);
    localStorage.setItem(SAVE_KEY, raw);
    const book = migrateLegacySave();
    const id = activeSlot();
    book.slots[id] = { data: S, savedAt: S.lastSeen };
    writeSlots(book);
  } catch (e) {}
}
function load(slotId) {
  if (slotId) setActiveSlot(slotId);
  const id = activeSlot();
  const book = migrateLegacySave();
  const entry = book.slots[id];
  try {
    const raw = entry?.data ? JSON.stringify(entry.data) : (id === 'slot1' ? localStorage.getItem(SAVE_KEY) : null);
    if (raw) {
      S = Object.assign(DEFAULT_STATE(), JSON.parse(raw));
      // Currency migration (4 resources → 2): fold retired resources into current balances once.
      if ('treats' in S) { S.fish = (S.fish || 0) + (S.treats || 0); delete S.treats; }
      if ('yarn' in S) { S.coins = (S.coins || 0) + (S.yarn || 0); delete S.yarn; }
      if (S.raising && 'yarn' in S.raising) { S.coins = (S.coins || 0) + (S.raising.yarn || 0); delete S.raising.yarn; }
      if (Array.isArray(S.cats)) for (const c of S.cats) {
        if (!Array.isArray(c.learned)) c.learned = [];
        if (typeof c.battlesWon !== 'number') c.battlesWon = 0;
      }
      return true;
    }
  } catch (e) {}
  S = DEFAULT_STATE();
  return false;
}
function listSaveSlots() {
  const book = migrateLegacySave();
  return SAVE_SLOT_IDS.map((id, index) => {
    const entry = book.slots[id];
    const data = entry?.data;
    const story = data?.story || {};
    const fragments = Array.isArray(story.fragments) ? story.fragments.length : 0;
    const regionCount = Object.values(data?.worldmap?.regions || {}).filter(r => Number(r?.explored) > 0).length;
    const chapter = fragments >= 6 ? '终章 · 最后一页' : fragments >= 5 ? '第五章 · 逆响' :
      fragments >= 4 ? '第四章 · 最后的守铃者' : fragments >= 3 ? '第三章 · 失去的名字' :
      fragments >= 2 ? '第二章 · 旧约' : fragments >= 1 ? '第一章 · 空白页' :
      (data?.cats?.length ? '序章 · 倒着响的铃' : '尚未开始');
    return {
      id, number: index + 1, exists: !!data, savedAt: Number(entry?.savedAt || data?.lastSeen || 0),
      cats: Array.isArray(data?.cats) ? data.cats.length : 0,
      coins: Number(data?.coins || 0), chapter, fragments, regionCount,
      active: id === activeSlot()
    };
  });
}
function startNewGame(slotId) {
  if (!SAVE_SLOT_IDS.includes(slotId)) return false;
  setActiveSlot(slotId);
  S = DEFAULT_STATE();
  save();
  return true;
}
function loadSlot(slotId) {
  if (!SAVE_SLOT_IDS.includes(slotId)) return false;
  setActiveSlot(slotId);
  return load(slotId);
}
function deleteSlot(slotId) {
  if (!SAVE_SLOT_IDS.includes(slotId)) return false;
  const book = migrateLegacySave();
  delete book.slots[slotId];
  writeSlots(book);
  if (slotId === activeSlot()) {
    S = DEFAULT_STATE();
    try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
  }
  return true;
}
function hardReset() {
  S = DEFAULT_STATE();
  save();
}
// Expedition health: casual battles always restore everyone to full HP.
// Hardcore wounds heal automatically in real time (including while offline):
// 100% over five minutes, no button or timer required.
const HEALTH_REGEN_MS = 5 * 60 * 1000;
const FISH_HEAL_FRACTION = 0.35;
function catHpFraction(cat, now=Date.now()) {
  if (!cat || difficulty() === 'casual') return 1;
  const initial=typeof cat._hpFrac==='number'?Math.max(.15,Math.min(1,cat._hpFrac)):1;
  if (initial>=1) {
    delete cat._hpFrac;delete cat._hpAt;
    return 1;
  }
  const at=Number.isFinite(cat._hpAt)?Math.min(now,cat._hpAt):now;
  const hp=Math.min(1,initial+Math.max(0,now-at)/HEALTH_REGEN_MS);
  if(hp>=1){delete cat._hpFrac;delete cat._hpAt;return 1;}
  cat._hpFrac=hp;cat._hpAt=now;
  return hp;
}
function setBattleHealth(cat, ratio, now=Date.now()) {
  if(!cat)return 1;
  if(difficulty()==='casual'){delete cat._hpFrac;delete cat._hpAt;return 1;}
  const hp=Math.max(.15,Math.min(1,Number.isFinite(ratio)?ratio:1));
  if(hp>=1){delete cat._hpFrac;delete cat._hpAt;return 1;}
  cat._hpFrac=hp;cat._hpAt=now;
  return hp;
}
function healAllCats() {
  let count=0;
  for(const cat of S.cats||[]){
    if(cat._hpFrac!==undefined || cat._hpAt!==undefined)count++;
    delete cat._hpFrac;delete cat._hpAt;
  }
  if(count)save();
  return count;
}
function useMedkitForHealth(cat) {
  if(!cat)return {ok:false,reason:'cat'};
  if(difficulty()==='casual')return {ok:false,reason:'full'};
  const before=catHpFraction(cat);
  if(before>=.999)return {ok:false,reason:'full'};
  if((S.medkits||0)<1)return {ok:false,reason:'medkit'};
  S.medkits--;
  const after=Math.min(1,before+FISH_HEAL_FRACTION);
  setBattleHealth(cat,after);
  save();
  return {ok:true,cost:1,before,after};
}
function useMedkitForTeam(cats) {
  const unique=[...new Map((cats||[]).filter(Boolean).map(c=>[c.uid,c])).values()];
  if(difficulty()==='casual')return {ok:false,reason:'full'};
  const wounded=unique.map(c=>({cat:c,before:catHpFraction(c)})).filter(x=>x.before<.999);
  if(!wounded.length)return {ok:false,reason:'full'};
  if((S.medkits||0)<wounded.length)return {ok:false,reason:'medkit',cost:wounded.length};
  S.medkits-=wounded.length;
  for(const x of wounded)setBattleHealth(x.cat,Math.min(1,x.before+FISH_HEAL_FRACTION));
  save();
  return {ok:true,cost:wounded.length,count:wounded.length};
}

// Offline/idle progression: cats gain a little xp & affinity, lose hunger/joy.
function applyIdle() {
  const now = Date.now();
  const dtMin = Math.min((now - (S.lastSeen || now)) / 60000, 60 * 12); // cap 12h
  if (dtMin < 0.2 || S.cats.length === 0) return null;
  let totXp = 0, totCoins = 0;
  for (const c of S.cats) {
    const gained = Math.floor(dtMin * (1 + c.level * 0.1));
    addXp(c, gained);
    totXp += gained;
    c.hunger = Math.max(0, c.hunger - dtMin * 0.6);
    c.joy = Math.max(0, c.joy - dtMin * 0.5);
    // bonded cats earn coins while you're away
    if (c.affinity >= 25) totCoins += Math.floor(dtMin * c.affinity / 120);
  }
  S.coins += totCoins;
  return { minutes: Math.round(dtMin), xp: totXp, coins: totCoins };
}

function dailyAvailable() {
  const now = new Date();
  const last = new Date(S.lastDaily || 0);
  return now.toDateString() !== last.toDateString();
}
function claimDaily() {
  const prev = S.lastDaily || 0;
  const oneDay = 864e5;
  const gapDays = Math.floor((Date.now() - prev) / oneDay);
  S.streak = (prev && gapDays <= 2) ? S.streak + 1 : 1;
  S.lastDaily = Date.now();
  // Both the old daily 小鱼干 (treats) and the premium 🐠 (fish) now pay out as
  // one 🐠 fish currency, so the daily reward grants a single combined fish amount.
  const reward = {
    coins: 40 + S.streak * 10,
    fish: (2 + Math.floor(S.streak / 2)) + (S.streak % 7 === 0 ? 5 : (S.streak % 3 === 0 ? 1 : 0)),
  };
  S.coins += reward.coins; S.fish += reward.fish;
  return { reward, streak: S.streak };
}

// Difficulty affects ordinary player skills, incoming enemy damage and HP.
// The old casual 1.35x outgoing + 0.80x enemy HP erased enemies during the
// first resonance. Keep casual forgiving WITHOUT making duo a one-cast wipe.
// duoHpBudget is a shared per-enemy cap across opening, pulses and crossed paws.
const DIFFICULTY_MULTS = {
  casual:   { playerDmg: 1.16, enemyDmg: 0.60, enemyHp: 0.95, gapScale: 0.25,
              duoDmg: 0.80, duoHpBudget: 0.48 },
  // gapScale 1.25 (was 1.4): a balance sim showed 1.4 overtuned the 等级压制 into a
  // ~1-in-4 WIPE at a moderate under-level (gap −3) — "硬核打得太快". 1.25 is the
  // HIGHEST value that pulls that wipe rate back to ~9% ("punishing, not a coin-flip")
  // while leaving ON-LEVEL hardcore unchanged (bend() is insensitive to gapScale at
  // gap 0) — strong 等级压制 preserved, just no longer a cliff. (The flat duoDmg /
  // playerDmg / enemyHp tuning is the owner's; only the gap curve is softened here.)
  hardcore: { playerDmg: 0.94, enemyDmg: 1.00, enemyHp: 1.10, gapScale: 1.25,
              duoDmg: 0.72, duoHpBudget: 0.43 },
};
function difficulty() { return (S.difficulty === 'hardcore') ? 'hardcore' : 'casual'; }
function difficultyMult() { return DIFFICULTY_MULTS[difficulty()]; }
function setDifficulty(mode) {
  S.difficulty = (mode === 'hardcore') ? 'hardcore' : 'casual';
  if(S.difficulty==='casual')healAllCats();
  save();
  return S.difficulty;
}

window.State = {
  get S() { return S; },
  makeCat, addXp, xpToNext, catPower, bondTier, catName,
  save, load, hardReset, applyIdle, dailyAvailable, claimDaily,
  listSaveSlots, startNewGame, loadSlot, deleteSlot, setActiveSlot, activeSlot, SAVE_SLOT_IDS, SAVE_SLOTS_KEY, ACTIVE_SLOT_KEY,
  difficulty, difficultyMult, setDifficulty, DIFFICULTY_MULTS,
  HEALTH_REGEN_MS, FISH_HEAL_FRACTION, catHpFraction, setBattleHealth,
  healAllCats, useMedkitForHealth, useMedkitForTeam,
};
