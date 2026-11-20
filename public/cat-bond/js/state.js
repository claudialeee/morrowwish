// state.js — persistent game state, save/load, and raising/economy logic.

const SAVE_KEY = 'catbond_save_v1';

const DEFAULT_STATE = () => ({
  coins: 50,
  treats: 8,           // used in capture battles
  fish: 5,             // premium-ish currency for luck lures
  luckLure: 0,         // active luck boost charges
  cats: [],            // owned cats (instances)
  dex: {},             // speciesId -> count caught
  lastSeen: Date.now(),
  lastDaily: 0,
  streak: 0,
  tutorialDone: false,
  catchCount: 0,
  petCount: 0, // real taps on living cats, across sessions
  bondingRewards: [], // claimed bonding milestones
  collectionMilestones: [], // one-time, cumulative codex discovery rewards
  repeatSightings: 0, // repeated already-owned species encountered while searching
  bestGrades: {}, // speciesId -> best capture score (C/B/A/S), for rematches
  masteryBadges: {}, // speciesId -> true; only a first S earns a permanent Golden Paw
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
    // ---- growth forms (universal evolution; every cat can reach 灵) ----
    stage: 0,         // 0=幼 1=成 2=灵(觉醒)
    awaken: null,     // 'pow'|'agi'|'cha' aura branch chosen at stage 2
  };
}

function xpToNext(level) { return 20 + level * level * 8; }

// display name: player nickname if set, else species name
function catName(cat) {
  if (cat && cat.nickname) return cat.nickname;
  const sp = cat && GameData.speciesById(cat.species);
  return sp ? sp.name : '猫猫';
}

function addXp(cat, amount) {
  cat.xp += amount;
  let leveled = 0;
  while (cat.xp >= xpToNext(cat.level)) {
    cat.xp -= xpToNext(cat.level);
    cat.level++;
    leveled++;
    // small stat growth on level up
    cat.stats.pow += 1 + Math.floor(Math.random() * 2);
    cat.stats.agi += 1 + Math.floor(Math.random() * 2);
    cat.stats.vit += 1 + Math.floor(Math.random() * 2);
    cat.stats.cha += 1 + Math.floor(Math.random() * 2);
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
    if (raw) { S = Object.assign(DEFAULT_STATE(), JSON.parse(raw)); return true; }
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
  const reward = {
    coins: 40 + S.streak * 10,
    treats: 2 + Math.floor(S.streak / 2),
    fish: S.streak % 7 === 0 ? 5 : (S.streak % 3 === 0 ? 1 : 0),
  };
  S.coins += reward.coins; S.treats += reward.treats; S.fish += reward.fish;
  return { reward, streak: S.streak };
}

window.State = {
  get S() { return S; },
  makeCat, addXp, xpToNext, catPower, bondTier, catName,
  save, load, hardReset, applyIdle, dailyAvailable, claimDaily,
};
