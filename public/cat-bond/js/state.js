// state.js — persistent game state, save/load, and raising/economy logic.

const SAVE_KEY = 'catbond_save_v1';

const DEFAULT_STATE = () => ({
  coins: 50,           // general currency (shop, buildings, skill learning, upgrades)
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

// --- persistence ---
function save() {
  S.lastSeen = Date.now();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {}
}
function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      S = Object.assign(DEFAULT_STATE(), JSON.parse(raw));
      // Currency migration (4 resources → 2): fold the retired 小鱼干 treats into
      // 🐠 fish and the retired 🧶 yarn into 🪙 coins, ONCE per old key. Guarding on
      // key presence (and deleting afterwards) keeps repeated load()s idempotent so
      // balances never double-count. Legacy yarn lived both at the top level and
      // under raising.yarn — fold and clear both.
      if ('treats' in S) { S.fish = (S.fish || 0) + (S.treats || 0); delete S.treats; }
      if ('yarn' in S) { S.coins = (S.coins || 0) + (S.yarn || 0); delete S.yarn; }
      if (S.raising && 'yarn' in S.raising) { S.coins = (S.coins || 0) + (S.raising.yarn || 0); delete S.raising.yarn; }
      // Migrate older saves: every cat must carry a learned-skills list and a
      // per-cat win counter so the gated skill-learning system never sees undefined.
      if (Array.isArray(S.cats)) for (const c of S.cats) {
        if (!Array.isArray(c.learned)) c.learned = [];
        if (typeof c.battlesWon !== 'number') c.battlesWon = 0;
      }
      return true;
    }
  } catch (e) {}
  return false;
}
function hardReset() { S = DEFAULT_STATE(); save(); }

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
  save();
  return S.difficulty;
}

window.State = {
  get S() { return S; },
  makeCat, addXp, xpToNext, catPower, bondTier, catName,
  save, load, hardReset, applyIdle, dailyAvailable, claimDaily,
  difficulty, difficultyMult, setDifficulty, DIFFICULTY_MULTS,
};
