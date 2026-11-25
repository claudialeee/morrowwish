// state.js — persistent game state, save/load, and raising/economy logic.

const SAVE_KEY = 'catbond_save_v1';
const SAVE_SLOTS_KEY = 'catbond_save_slots_v1';
const ACTIVE_SLOT_KEY = 'catbond_active_slot_v1';
const SAVE_SLOT_IDS = ['slot1','slot2','slot3'];
let suppressSave = false;

const DEFAULT_STATE = () => ({
  coins: 50,           // general currency (shop, buildings, skill learning, upgrades)
  medkits: 2, // dedicated medical supplies (legacy saves receive 2 once)
  fish: 5,             // cat-raising / feeding / premium currency (luck lures, old treats folded in)
  luckLure: 0,         // active luck boost charges
  cats: [],            // owned cats (instances)
  dex: {},             // speciesId -> count caught
  lastSeen: Date.now(),
  playTimeMs: 0,
  gameStarted: false,
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

// --- versioned three-slot Save Manager ---
const SAVE_BOOK_VERSION = 2;
const SAVE_BACKUP_KEY = 'catbond_save_slots_backup_v2';
function isSaveObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
function cloneSaveData(value) {
  const raw = JSON.stringify(value);
  if (!raw) throw new Error('Save data is not serializable');
  const copy = JSON.parse(raw);
  if (!isSaveObject(copy)) throw new Error('Save data must be an object');
  return copy;
}
function saveChecksum(raw) {
  let hash = 2166136261;
  for (let i = 0; i < raw.length; i++) {
    hash ^= raw.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
function emptySaveBook() {
  return { version: SAVE_BOOK_VERSION, updatedAt: 0, slots: {}, deleted: {} };
}
function upgradeSaveBook(parsed) {
  if (!isSaveObject(parsed) || !isSaveObject(parsed.slots)) return emptySaveBook();
  if (parsed.version === SAVE_BOOK_VERSION) return parsed;
  if (parsed.version === 1) {
    const slots = {};
    for (const id of SAVE_SLOT_IDS) {
      const old = parsed.slots[id];
      if (!old || !isSaveObject(old.data)) continue;
      const data = cloneSaveData(old.data);
      const raw = JSON.stringify(data);
      slots[id] = {
        schemaVersion: 1,
        revision: Math.max(1, Number(old.revision) || 1),
        savedAt: Number(old.savedAt || data.lastSeen || Date.now()),
        checksum: saveChecksum(raw),
        data
      };
    }
    return { version: SAVE_BOOK_VERSION, updatedAt: Number(parsed.updatedAt) || Date.now(), slots, migrated: true };
  }
  return emptySaveBook();
}
function readSlots() {
  let raw = '';
  try { raw = localStorage.getItem(SAVE_SLOTS_KEY) || ''; } catch (e) {}
  if (raw) {
    try { return upgradeSaveBook(JSON.parse(raw)); } catch (e) {}
  }
  // A previous complete book is kept as a recovery copy. A failed write never
  // replaces the canonical book with a half-written JSON document.
  try {
    const backup = localStorage.getItem(SAVE_BACKUP_KEY);
    if (backup) {
      const restored = upgradeSaveBook(JSON.parse(backup));
      if (Object.keys(restored.slots).length || Object.keys(restored.deleted || {}).length) return restored;
    }
  } catch (e) {}
  return emptySaveBook();
}
function activeSlot() {
  try {
    const id = localStorage.getItem(ACTIVE_SLOT_KEY);
    return SAVE_SLOT_IDS.includes(id) ? id : 'slot1';
  } catch (e) { return 'slot1'; }
}
function setActiveSlot(id) {
  if (!SAVE_SLOT_IDS.includes(id)) return false;
  try { localStorage.setItem(ACTIVE_SLOT_KEY, id); return true; }
  catch (e) { return false; }
}
function inspectSlot(book, id) {
  const entry = book?.slots?.[id];
  if (!entry) return { occupied: false, readable: false, corrupt: false, entry: null, data: null };
  if (!isSaveObject(entry.data)) return { occupied: true, readable: false, corrupt: true, entry, data: null };
  try {
    const raw = JSON.stringify(entry.data);
    const corrupt = !!entry.checksum && entry.checksum !== saveChecksum(raw);
    return { occupied: true, readable: !corrupt, corrupt, entry, data: corrupt ? null : entry.data };
  } catch (e) {
    return { occupied: true, readable: false, corrupt: true, entry, data: null };
  }
}
function writeSlots(book) {
  const next = {
    version: SAVE_BOOK_VERSION,
    updatedAt: Date.now(),
    slots: isSaveObject(book?.slots) ? book.slots : {},
    deleted: isSaveObject(book?.deleted) ? book.deleted : {}
  };
  const raw = JSON.stringify(next);
  try {
    const previous = localStorage.getItem(SAVE_SLOTS_KEY);
    if (previous) {
      try {
        const previousBook = upgradeSaveBook(JSON.parse(previous));
        const healthy = SAVE_SLOT_IDS.every(id => !inspectSlot(previousBook, id).corrupt);
        if (healthy) localStorage.setItem(SAVE_BACKUP_KEY, previous);
      } catch (e) {}
    }
    // One canonical key contains the complete three-slot book. setItem is
    // atomic for a single key, so a quota/error cannot leave half a slot written.
    localStorage.setItem(SAVE_SLOTS_KEY, raw);
  } catch (e) {
    return { ok: false, reason: 'storage_unavailable', error: String(e?.message || e) };
  }
  // Compatibility mirror for older story helpers. It is never authoritative.
  try {
    const current = next.slots[activeSlot()];
    const snapshot = current?.data;
    const mirror = snapshot?.snapshotVersion === 1 && isSaveObject(snapshot.state) ? snapshot.state : snapshot;
    if (mirror) localStorage.setItem(SAVE_KEY, JSON.stringify(mirror));
    else localStorage.removeItem(SAVE_KEY);
  } catch (e) {}
  return { ok: true };
}
function migrateLegacySave(book = readSlots()) {
  if (SAVE_SLOT_IDS.some(id => book.slots?.[id] || book.deleted?.[id])) return book;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const legacy = JSON.parse(raw);
      if (isSaveObject(legacy) && Array.isArray(legacy.cats)) {
        const data = cloneSaveData(legacy);
        const serialized = JSON.stringify(data);
        book.slots.slot1 = {
          schemaVersion: 1,
          revision: 1,
          savedAt: Number(data.lastSeen) || Date.now(),
          checksum: saveChecksum(serialized),
          data
        };
        book.migrated = true;
        setActiveSlot('slot1');
      }
    }
  } catch (e) {}
  return book;
}
function makeSlotRecord(data, savedAt, revision) {
  const copy = cloneSaveData(data);
  const raw = JSON.stringify(copy);
  return {
    schemaVersion: 1,
    revision: Math.max(1, Number(revision) || 1),
    savedAt: Number(savedAt) || Date.now(),
    checksum: saveChecksum(raw),
    data: copy
  };
}
function persistSlot(id, data, options = {}) {
  if (!SAVE_SLOT_IDS.includes(id)) return { ok: false, reason: 'invalid_slot' };
  const book = migrateLegacySave();
  const previous = book.slots[id];
  if (previous && !options.overwriteConfirmed && !options.allowOverwrite)
    return { ok: false, reason: 'confirmation_required', slotId: id };
  const revision = (Number(previous?.revision) || 0) + 1;
  try {
    book.slots[id] = makeSlotRecord(data, options.savedAt, revision);
    if (book.deleted) delete book.deleted[id];
  } catch (error) {
    return { ok: false, reason: 'invalid_data', error: String(error?.message || error) };
  }
  const result = writeSlots(book);
  if (!result.ok) return result;
  return { ok: true, slotId: id, revision, savedAt: book.slots[id].savedAt };
}
function normalizeLoadedState(data) {
  const next = Object.assign(DEFAULT_STATE(), cloneSaveData(data));
  // Preserve future fields while applying only additive defaults and known
  // one-time currency migrations.
  if (typeof next.playTimeMs !== 'number' || !Number.isFinite(next.playTimeMs)) next.playTimeMs = 0;
  if (typeof next.gameStarted !== 'boolean') next.gameStarted = true;
  if ('treats' in next) { next.fish = (next.fish || 0) + (next.treats || 0); delete next.treats; }
  if ('yarn' in next) { next.coins = (next.coins || 0) + (next.yarn || 0); delete next.yarn; }
  if (next.raising && 'yarn' in next.raising) { next.coins = (next.coins || 0) + (next.raising.yarn || 0); delete next.raising.yarn; }
  if (Array.isArray(next.cats)) for (const c of next.cats) {
    if (!Array.isArray(c.learned)) c.learned = [];
    if (typeof c.battlesWon !== 'number') c.battlesWon = 0;
  }
  return next;
}
let sessionStartedAt = Date.now();
const saveAdapters = new Map();
let pendingSaveSystems = {};
function restoreOneSaveAdapter(key) {
  const adapter = saveAdapters.get(key);
  const record = pendingSaveSystems[key];
  if (!adapter || !record) return false;
  try {
    const fromVersion = Number(record.version) || 1;
    const toVersion = Number(adapter.version) || 1;
    let payload = Object.prototype.hasOwnProperty.call(record, 'data') ? record.data : record;
    if (fromVersion !== toVersion) {
      if (typeof adapter.migrate !== 'function') return false;
      payload = adapter.migrate(cloneSaveData(payload), fromVersion, toVersion);
    }
    adapter.restore(cloneSaveData(payload));
    delete pendingSaveSystems[key];
    return true;
  } catch (error) {
    console.warn('Cat Bond save adapter restore failed:', key, String(error?.message || error));
    return false;
  }
}
function registerSaveAdapter(key, adapter) {
  const id = String(key || '').trim();
  if (!id || !adapter || typeof adapter.serialize !== 'function' || typeof adapter.restore !== 'function') return false;
  saveAdapters.set(id, {
    version: Number(adapter.version) || 1,
    serialize: adapter.serialize,
    restore: adapter.restore,
    migrate: adapter.migrate,
    reset: adapter.reset
  });
  restoreOneSaveAdapter(id);
  return true;
}
function restoreSaveSystems(systems) {
  pendingSaveSystems = isSaveObject(systems) ? cloneSaveData(systems) : {};
  for (const [key, adapter] of saveAdapters) {
    // Never retain a previous slot's live adapter state when the next slot has no record.
    if (Object.prototype.hasOwnProperty.call(pendingSaveSystems, key)) {
      if (!restoreOneSaveAdapter(key)) throw new Error('Cannot restore save system: ' + key);
    } else {
      if (typeof adapter.reset !== 'function') throw new Error('Save system requires a reset handler: ' + key);
      adapter.reset();
    }
  }
}
function buildSaveSnapshot() {
  const systems = cloneSaveData(pendingSaveSystems);
  for (const [key, adapter] of saveAdapters.entries()) {
    const value = adapter.serialize();
    if (value !== undefined) systems[key] = { version: adapter.version, data: cloneSaveData(value) };
  }
  return { snapshotVersion: 1, state: cloneSaveData(S), systems };
}
function flushPlayTime() {
  if (!S.gameStarted) return;
  const now = Date.now();
  if (!Number.isFinite(S.playTimeMs)) S.playTimeMs = 0;
  if (sessionStartedAt) S.playTimeMs += Math.max(0, now - sessionStartedAt);
  sessionStartedAt = now;
}
function save() {
  if (suppressSave) return { ok: false, reason: 'suppressed' };
  if (!S.gameStarted && !(Array.isArray(S.cats) && S.cats.length)) return { ok: false, reason: 'not_started' };
  flushPlayTime();
  S.lastSeen = Date.now();
  try { return persistSlot(activeSlot(), buildSaveSnapshot(), { allowOverwrite: true, savedAt: S.lastSeen }); }
  catch (error) { return { ok: false, reason: 'adapter_failed', error: String(error?.message || error) }; }
}
// Transient overlays must be invalidated synchronously, but only after a successful slot transition.
function notifyActiveSaveChanged() {
  if (typeof window.dispatchEvent === 'function' && typeof window.Event === 'function') {
    window.dispatchEvent(new window.Event('cat-bond-active-save-changed'));
  }
}
function load(slotId) {
  const id = slotId || activeSlot();
  if (!SAVE_SLOT_IDS.includes(id)) return false;
  const book = migrateLegacySave();
  const inspected = inspectSlot(book, id);
  if (!inspected.readable) return false;
  const previous = {state:S, systems:pendingSaveSystems, active:activeSlot(), suppressed:suppressSave, started:sessionStartedAt};
  const previousAdapters = new Map();
  try {
    for (const [key, adapter] of saveAdapters) {
      const value = adapter.serialize();
      if (value !== undefined) previousAdapters.set(key, cloneSaveData(value));
    }
    const snapshot = inspected.data;
    const wrapped = snapshot?.snapshotVersion === 1 && isSaveObject(snapshot.state);
    S = normalizeLoadedState(wrapped ? snapshot.state : snapshot);
    restoreSaveSystems(wrapped ? snapshot.systems : {});
    if (id !== previous.active && !setActiveSlot(id)) throw new Error('Cannot select save slot');
    if (!S.gameStarted) S.gameStarted = true;
    suppressSave = false;
    sessionStartedAt = Date.now();
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {}
    if (book.migrated) writeSlots(book);
    notifyActiveSaveChanged();
    return true;
  } catch (e) {
    S = previous.state; pendingSaveSystems = previous.systems;
    suppressSave = previous.suppressed; sessionStartedAt = previous.started;
    if (activeSlot() !== previous.active) setActiveSlot(previous.active);
    for (const [key, value] of previousAdapters) {
      try { saveAdapters.get(key)?.restore(cloneSaveData(value)); } catch (_) {}
    }
    return false;
  }
}
function listSaveSlots() {
  const book = migrateLegacySave();
  const regionNames = {
    garden: ['阳光花园', 'Sunlit Garden'],
    harbor: ['霁潮港', 'Misttide Harbor'],
    forest: ['眠根林', 'Rootsleep Forest'],
    forge: ['赤炉环城', 'Emberforge City'],
    sky: ['云脊群岛', 'Skyspine Isles'],
    library: ['月镜书库', 'Moonmirror Library'],
    starfall: ['星坠原', 'Starfall Expanse'],
    home: ['阳光花园', 'Sunlit Garden'],
    sakura: ['樱花林', 'Sakura Woods'],
    creek: ['溪谷', 'Creek Valley'],
    volcano: ['火山口', 'Volcano'],
    ruins: ['月影遗迹', 'Moonshadow Ruins']
  };
  return SAVE_SLOT_IDS.map((id, index) => {
    const inspected = inspectSlot(book, id);
    const entry = inspected.entry;
    const snapshot = inspected.data;
    const data = snapshot?.snapshotVersion === 1 && isSaveObject(snapshot.state) ? snapshot.state : snapshot;
    // Only the formal engine's slot-local snapshot supplies narrative metadata.
    const story = data?.resonance || {};
    const fragments = Array.isArray(story.melodies) ? story.melodies.length : 0;
    const regionCount = Array.isArray(story.sanctuaries) ? story.sanctuaries.length : 0;
    // New narrative code may supply localized chapter metadata directly. Do
    // not label a legacy save with a chapter from the retired campaign.
    const chapterKey=typeof story.scene==='string'?story.scene.split(':')[0]:'';
    const chapterNumber=['prologue','harbor','forest','forge','sky','library','starfall','finale'].indexOf(chapterKey);
    const explicitChapter=chapterKey==='prologue'?{zh:'序章',en:'Prologue'}:chapterKey==='finale'?{zh:'终章',en:'Finale'}:chapterKey==='epilogue'?{zh:'尾声',en:'Epilogue'}:null;
    const chapterLabelZh=typeof explicitChapter?.zh==='string'?explicitChapter.zh:
      Number.isInteger(chapterNumber)&&chapterNumber>0?'第 '+chapterNumber+' 章':
      data?.cats?.length?'冒险进行中':'尚未开始';
    const chapterLabelEn=typeof explicitChapter?.en==='string'?explicitChapter.en:
      Number.isInteger(chapterNumber)&&chapterNumber>0?'Chapter '+chapterNumber:
      data?.cats?.length?'Adventure in progress':'Not started';
    const chapter=chapterLabelZh;
    const sceneRegion=['harbor','forest','forge','sky','library','starfall'].includes(chapterKey)?chapterKey:'garden';
    const regionId = data?.resonance ? (data.resonanceExploration?.location || sceneRegion) : (data?.worldmap?.current || 'home');
    const region = typeof WorldMap !== 'undefined' ? WorldMap.REGIONS?.find(item => item.id === regionId) : null;
    const names = regionNames[regionId] || [region?.name || regionId, region?.sub || region?.nameEn || regionId];
    const playTimeMs = Math.max(0, Number(data?.playTimeMs) || 0);
    const totalMinutes = Math.floor(playTimeMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const gameTimeLabel = hours ? hours + 'h ' + String(minutes).padStart(2, '0') + 'm' : totalMinutes + 'm';
    return {
      id, number: index + 1,
      exists: inspected.occupied,
      readable: inspected.readable,
      corrupt: inspected.corrupt,
      savedAt: Number(entry?.savedAt || data?.lastSeen || 0),
      lastSavedAt: Number(entry?.savedAt || data?.lastSeen || 0),
      revision: Number(entry?.revision) || 0,
      cats: Array.isArray(data?.cats) ? data.cats.length : 0,
      coins: Number(data?.coins || 0),
      chapter, chapterLabelZh, chapterLabelEn,
      fragments,
      regionCount,
      regionId,
      regionLabelZh: names[0],
      regionLabelEn: names[1],
      playTimeMs,
      gameTimeLabel,
      gameTimeLabelZh: hours ? hours+'小时 '+minutes+'分钟' : minutes+'分钟',
      storyProgress: fragments + '/6',
      active: id === activeSlot()
    };
  });
}
function startNewGame(slotId, options = {}) {
  if (!SAVE_SLOT_IDS.includes(slotId)) return false;
  const book = migrateLegacySave();
  if (book.slots[slotId] && !options.overwriteConfirmed) return false;
  const previousState = S;
  const previousActive = activeSlot();
  const previousSystems = pendingSaveSystems;
  const previousStarted = sessionStartedAt, previousSuppressed = suppressSave;
  const previousAdapterStates = {};
  try {
    for (const [key, adapter] of saveAdapters.entries()) {
      const value = adapter.serialize();
      if (value !== undefined) previousAdapterStates[key] = cloneSaveData(value);
    }
  } catch (error) { return false; }
  S = DEFAULT_STATE();
  S.gameStarted = true;
  pendingSaveSystems = {};
  sessionStartedAt = Date.now();
  suppressSave = false;
  let result;
  try {
    if (!setActiveSlot(slotId)) throw new Error('Cannot select save slot');
    for (const [key,adapter] of saveAdapters) {
      if (typeof adapter.reset !== 'function') throw new Error('Save system requires a reset handler: '+key);
      adapter.reset();
    }
    result = persistSlot(slotId, buildSaveSnapshot(), { allowOverwrite: true, savedAt: Date.now() });
  }
  catch (error) { result = { ok: false, reason: 'adapter_failed', error: String(error?.message || error) }; }
  if (!result.ok) {
    S = previousState;
    pendingSaveSystems = previousSystems;
    sessionStartedAt=previousStarted; suppressSave=previousSuppressed;
    if(activeSlot()!==previousActive)setActiveSlot(previousActive);
    for (const [key, value] of Object.entries(previousAdapterStates)) {
      try { saveAdapters.get(key)?.restore(cloneSaveData(value)); } catch (e) {}
    }
    return false;
  }
  notifyActiveSaveChanged();
  return true;
}
function loadSlot(slotId) {
  if (!SAVE_SLOT_IDS.includes(slotId)) return false;
  const book = migrateLegacySave();
  if (!inspectSlot(book, slotId).readable) return false;
  return load(slotId);
}
function saveToSlot(slotId, options = {}) {
  if (!SAVE_SLOT_IDS.includes(slotId) || !S.gameStarted) return { ok: false, reason: 'invalid_state_or_slot' };
  flushPlayTime();
  S.lastSeen = Date.now();
  try { return persistSlot(slotId, buildSaveSnapshot(), { ...options, savedAt: S.lastSeen }); }
  catch (error) { return { ok: false, reason: 'adapter_failed', error: String(error?.message || error) }; }
}
function importSaveSlot(slotId, data, metadata = {}) {
  if (!SAVE_SLOT_IDS.includes(slotId) || !isSaveObject(data)) return { ok: false, reason: 'invalid_data' };
  return persistSlot(slotId, data, { allowOverwrite: true, savedAt: metadata.savedAt, overwriteConfirmed: true });
}
function deletedSaveSlot(id) {
  if (!SAVE_SLOT_IDS.includes(id)) return null;
  const book = readSlots(), item = book.deleted?.[id];
  return item && !book.slots[id] ? cloneSaveData(item) : null;
}
function deleteSaveSlot(id, options = {}) {
  if (!SAVE_SLOT_IDS.includes(id)) return {ok:false, reason:'invalid_slot'};
  if (!options.confirmed) return {ok:false, reason:'confirmation_required'};
  if (S.gameStarted && id === activeSlot()) return {ok:false, reason:'active_slot'};
  const book = migrateLegacySave();
  if (!book.slots[id]) return {ok:false, reason:'empty_slot'};
  delete book.slots[id];
  book.deleted = {...book.deleted, [id]:{deletedAt:Date.now()}};
  const result = writeSlots(book);
  if (!result.ok) return result;
  // Prevent a recovered backup from reviving the explicitly removed save.
  try { localStorage.setItem(SAVE_BACKUP_KEY, JSON.stringify(book)); }
  catch (_) { try { localStorage.removeItem(SAVE_BACKUP_KEY); } catch (_) {} }
  return {ok:true, slotId:id};
}
function applyRemoteSaveSlot(id, entry, deletion = null) {
  if (!SAVE_SLOT_IDS.includes(id)) return {ok:false,reason:'invalid_slot'};
  if (!entry && (!deletion || !Number.isFinite(deletion.deletedAt) || deletion.deletedAt<=0)) return {ok:false,reason:'invalid_data'};
  const book=migrateLegacySave();
  book.deleted={...book.deleted};
  if(entry){
    if(!isSaveObject(entry.data))return {ok:false,reason:'invalid_data'};
    try{book.slots[id]=makeSlotRecord(entry.data,entry.savedAt,(Number(book.slots[id]?.revision)||0)+1);}
    catch(error){return {ok:false,reason:'invalid_data'};}
    delete book.deleted[id];
  }else{
    delete book.slots[id];
    book.deleted[id]={deletedAt:deletion.deletedAt};
  }
  const result=writeSlots(book);
  if(!result.ok)return result;
  if(!entry)try{localStorage.setItem(SAVE_BACKUP_KEY,JSON.stringify(book));}catch(_){try{localStorage.removeItem(SAVE_BACKUP_KEY);}catch(_){}}
  return {ok:true,slotId:id,deleted:!entry};
}
function replaceSaveSlots(entries, activeId, deletedEntries = {}) {
  if (!isSaveObject(entries)) return { ok: false, reason: 'invalid_slots' };
  const slots = {};
  for (const id of SAVE_SLOT_IDS) {
    const value = entries[id];
    if (!value) continue;
    const data = isSaveObject(value.data) ? value.data : value;
    if (!isSaveObject(data)) return { ok: false, reason: 'invalid_data', slotId: id };
    try { slots[id] = makeSlotRecord(data, value.savedAt || data.lastSeen, value.revision || 1); }
    catch (error) { return { ok: false, reason: 'invalid_data', slotId: id, error: String(error?.message || error) }; }
  }
  const deleted = {};
  for (const id of SAVE_SLOT_IDS) {
    if (!slots[id] && Number(deletedEntries[id]?.deletedAt)>0) deleted[id]={deletedAt:Number(deletedEntries[id].deletedAt)};
  }
  const nextActive = SAVE_SLOT_IDS.includes(activeId) && slots[activeId]
    ? activeId
    : (SAVE_SLOT_IDS.find(id => slots[id]) || 'slot1');
  const previousActive=activeSlot();
  // Select before changing the canonical book. If selecting fails, no slot is touched.
  if (nextActive!==previousActive && !setActiveSlot(nextActive)) return {ok:false,reason:'active_slot_unavailable'};
  const result = writeSlots({ version: SAVE_BOOK_VERSION, slots, deleted });
  if (!result.ok) {
    if(nextActive!==previousActive)setActiveSlot(previousActive);
    return result;
  }
  try {
    const snapshot = slots[nextActive]?.data;
    const mirror = snapshot?.snapshotVersion === 1 && isSaveObject(snapshot.state) ? snapshot.state : snapshot;
    if (mirror) localStorage.setItem(SAVE_KEY, JSON.stringify(mirror));
    else localStorage.removeItem(SAVE_KEY);
  } catch (e) {}
  return { ok: true, activeSlot: nextActive, count: Object.keys(slots).length };
}
function hardReset() {
  // Emergency recovery only: the caller reloads the page to clear transient
  // scene/input state. Never replace, clear, or autosave over any of the slots.
  suppressSave = true;
  return { ok: true, preservedSlots: true };
}
const SaveManager = Object.freeze({
  version: SAVE_BOOK_VERSION,
  slotIds: SAVE_SLOT_IDS.slice(),
  activeSlot,
  listSlots: listSaveSlots,
  getSlot: id => {
    if (!SAVE_SLOT_IDS.includes(id)) return null;
    const inspected = inspectSlot(migrateLegacySave(), id);
    if (!inspected.readable) return inspected.occupied ? { corrupt: true, savedAt: Number(inspected.entry?.savedAt) || 0 } : null;
    return {
      slotId: id,
      savedAt: Number(inspected.entry?.savedAt || inspected.data.lastSeen || 0),
      revision: Number(inspected.entry?.revision) || 0,
      schemaVersion: Number(inspected.entry?.schemaVersion) || 1,
      data: cloneSaveData(inspected.data)
    };
  },
  snapshot: buildSaveSnapshot,
  registerAdapter: registerSaveAdapter,
  saveCurrent: saveToSlot,
  load: loadSlot,
  startNew: startNewGame,
  importSlot: importSaveSlot,
  replaceSlots: replaceSaveSlots,
  applyRemoteSlot:applyRemoteSaveSlot,
  deleteSlot: deleteSaveSlot,
  getDeletedSlot: deletedSaveSlot
});
window.SaveManager = SaveManager;
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
  if(!dailyAvailable())return {ok:false,reward:{coins:0,fish:0},streak:S.streak};
  const prev = S.lastDaily || 0;
  const before={lastDaily:S.lastDaily,streak:S.streak,coins:S.coins,fish:S.fish};
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
  let saved=false;try{saved=save()?.ok===true}catch{}
  if(!saved){Object.assign(S,before);return {ok:false,reward:{coins:0,fish:0},streak:S.streak};}
  return { ok:true, reward, streak: S.streak };
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
  listSaveSlots, startNewGame, loadSlot, saveToSlot, setActiveSlot, activeSlot, SAVE_SLOT_IDS, SAVE_SLOTS_KEY, ACTIVE_SLOT_KEY,
  getSaveSlot: SaveManager.getSlot, importSaveSlot, replaceSaveSlots, registerSaveAdapter, deleteSaveSlot, deletedSaveSlot, applyRemoteSaveSlot,
  difficulty, difficultyMult, setDifficulty, DIFFICULTY_MULTS,
  HEALTH_REGEN_MS, FISH_HEAL_FRACTION, catHpFraction, setBattleHealth,
  healAllCats, useMedkitForHealth, useMedkitForTeam,
};
