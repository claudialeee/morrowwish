// skills.js — DATA + PURE LOGIC skill / combo / element / evolution / bond system.
// No DOM, no canvas, no reading the live battle. battle.js consumes these tables
// and functions to decide damage, status, combos, AI, learning and evolution.
//
// ============================================================================
// INTEGRATION GUIDE  (read this first — the integrator has NOT seen the code)
// ============================================================================
//
// Load order: AFTER data.js (needs window.GameData), BEFORE battle.js. Exposes a
// single global `window.Skills`. Everything here is pure: same inputs -> same
// outputs, no side effects. battle.js owns all mutable state and VFX.
//
// ----------------------------------------------------------------------------
// (A) ELEMENT MATCHUPS — how to multiply damage
// ----------------------------------------------------------------------------
// Every SPECIES id maps to one of 6 elements (火 水 草 电 暗 光). A skill also
// carries `element`. On any damaging hit:
//
//   const atkEl = skill.element;                      // element of the skill
//   const defEl = Skills.elementOf(wild.species.id);  // element of the target
//   const mult  = Skills.effectiveness(atkEl, defEl); // 0.5 | 1 | 1.5 | 2
//   dmg *= mult;
//
// Additionally a cat gets STAB (same-type-attack-bonus) when its own element
// matches the skill it fires: multiply by Skills.STAB (1.2) — helper:
//   dmg *= Skills.stabBonus(cat, skill);              // 1.2 or 1
// Show `Skills.effectivenessLabel(mult)` ("效果拔群!" etc.) as a floater.
//
// ----------------------------------------------------------------------------
// (B) APPLYING A SKILL — the shape battle.js fires
// ----------------------------------------------------------------------------
// Look a skill up with Skills.skillById(id). Fields:
//   id        unique key
//   name      zh-CN display name
//   element   one of Skills.ELEMENTS keys
//   kind      'projectile'|'melee'|'dash'|'aoe'|'buff'|'heal'  (how to spawn)
//   power     damage multiplier applied to fighter.dmg (buffs/heals may be 0)
//   cd        cooldown seconds (store on fighter.cd[skillId])
//   ultCost   0 = normal skill; >0 = costs that much ult meter to fire
//   tags      descriptive role tags (for AI / UI filtering)
//   appliesTag  status tag this skill INFLICTS on the target (or null); push it
//               onto target.tags so later skills can combo off it. May be an
//               array for multi-status skills.
//   vfx       a VFX method key — battle already has: 'muzzle','burst','ring',
//             'shockwave','trail','impact','text','orb','beam'. Map 1:1.
//   desc      zh-CN tooltip.
//
// Suggested apply flow in battle.js:
//   1. if (skill.ultCost) require this.ult >= skill.ultCost, then subtract.
//   2. base = fighter.dmg * skill.power.
//   3. base *= effectiveness(skill.element, elementOf(target)) * stabBonus(cat,skill).
//   4. combo = Skills.checkCombo(target.tags, skill); if (combo) base *= combo.bonusMult
//      and apply combo.effect (see C). Clear the consumed tag if combo.consumes.
//   5. deal `base`, then if (skill.appliesTag) add it to target.tags with a TTL.
//   6. fire this.vfx[skill.vfx](...) for the look.
// Status tags are just strings living on target.tags (array). Give each a
// timer; Skills.TAG_INFO[tag] provides {name, ttl, dps} hints for ticking.
//
// ----------------------------------------------------------------------------
// (C) COMBOS ("1+1=3") — detect + trigger
// ----------------------------------------------------------------------------
// Before dealing a skill's damage, call:
//   const c = Skills.checkCombo(target.tags, skill);
//   if (c) { dmg *= c.bonusMult; triggerComboEffect(c.effect, ...); toast(c.name); }
// Returns null if no combo, else {name, bonusMult, effect, consumes}. `effect`
// is a string key YOU interpret, e.g.:
//   'explode'  -> big aoe burst + radial damage around target
//   'chainAll' -> arc lightning to ALL enemies (here just the one wild cat × mult)
//   'shatter'  -> guaranteed crit, remove 'chill'
//   'bloom'    -> spread tags to nearby / heal-drain
//   'blind'    -> target's next attack misses (set wild_telegraph miss flag)
// `consumes:true` means remove the matched existing tag after the combo fires.
//
// ----------------------------------------------------------------------------
// (D) RISKY COMBO-CHAIN STATE MACHINE (signature mechanic)
// ----------------------------------------------------------------------------
// A cat can pre-queue a chain A->B->C (e.g. from its loadout / a gambit). Each
// link escalates damage but raises vulnerability and, if interrupted, backfires.
// battle.js runs this state machine on the active fighter:
//
//   state: { chain:[skillIds], link:0, windup:0, committed:false }
//   - To advance a link: fighter takes damage multiplier Skills.chainMultiplier(link)
//     on that link's hit.
//   - While winding up link i, fighter.vulnMult = Skills.chainVulnerability(i):
//     multiply INCOMING damage by this and DISABLE dodge i-frames (can't dodge
//     during windup). So a chain is a high-risk damage race.
//   - If the fighter is HIT (or the player cancels) before the link resolves,
//     call Skills.backfireDamage(linkBaseDmg, link) and apply it to the fighter
//     as self-damage ("反噬"), then reset link=0. Use Skills.CHAIN for tuning +
//     Skills.chainState() to get a fresh state object and Skills.advanceChain().
//   - Completing the final link grants Skills.CHAIN.finisherUltRefund ult.
//
// ----------------------------------------------------------------------------
// (E) BOND (纽带 / affinity 0..100) — qualitative unlocks
// ----------------------------------------------------------------------------
//   const tier = Skills.bondTier(cat.affinity);     // 0..5
//   const b    = Skills.bondBonuses(tier);
//   b.dmgMult         -> multiply all outgoing damage
//   b.cdReduction     -> multiply cooldowns (e.g. 0.85 = 15% faster)
//   b.extraGambitSlots-> allow this many extra gambit rules in auto-battle
//   b.reviveOnce      -> on faint, revive once at 40% hp (consume a per-battle flag)
//   b.unlockSignature -> cat may slot/learn its signature & run combo-chains
// Apply dmgMult/cdReduction wherever you compute dmg / set fighter.cd[...].
//
// ----------------------------------------------------------------------------
// (F) LOADOUT / LEARNING
// ----------------------------------------------------------------------------
// A cat's active 4 skills live in `cat.loadout` (array of skill ids). Call
// Skills.ensureLoadout(cat) once when a battle/menu opens — it fills a missing
// or invalid loadout from Skills.defaultLoadout(cat). Skills.learnableSkills(cat)
// is the full pool it is ALLOWED to pick from (menu UI). battle.js reads
// cat.loadout[slot] to know what Q/E/etc. fire.
//
// ----------------------------------------------------------------------------
// (G) EVOLUTION
// ----------------------------------------------------------------------------
//   if (Skills.canEvolve(cat)) { const r = Skills.evolveResult(cat); /* r.to */ }
// Pure data only: evolveResult returns {to, toSpecies, req}. The integrator does
// the actual species swap, stat recomputation, and VFX.
//
// ----------------------------------------------------------------------------
// (H) GAMBITS (auto-battle commander AI)
// ----------------------------------------------------------------------------
// Skills.GAMBIT_CONDITIONS / GAMBIT_ACTIONS are building blocks. A gambit is
// {cond, act} where cond is a condition KEY (see GAMBIT_CONDITIONS[].key) battle
// evaluates each tick top-to-bottom; first true -> perform its action. Use
// Skills.defaultGambits(cat) for a sane preset. Condition meanings are documented
// in GAMBIT_CONDITIONS; action meanings in GAMBIT_ACTIONS.
// ============================================================================

(function () {
  'use strict';

  // ---- numeric helper (self-contained; do not rely on battle's clamp) ----
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  // ==========================================================================
  // 1. ELEMENT TYPE SYSTEM (宝可梦式克制)
  // ==========================================================================
  // 6 elements. matchup table encodes attacker -> defender multiplier. Cycle:
  //   火>草>水>火 (classic), 电>水, 草>电(grounded), 暗<->光 mutual 2x, both
  //   neutral/weak into the elemental trio.
  const ELEMENTS = {
    fire:  { key: 'fire',  name: '火', color: '#ff7a3c' },
    water: { key: 'water', name: '水', color: '#4aa8ff' },
    grass: { key: 'grass', name: '草', color: '#6fcf5f' },
    elec:  { key: 'elec',  name: '电', color: '#ffd23c' },
    dark:  { key: 'dark',  name: '暗', color: '#8a6bff' },
    light: { key: 'light', name: '光', color: '#ffe9a8' },
  };
  const ELEMENT_ORDER = ['fire', 'water', 'grass', 'elec', 'dark', 'light'];

  // EFFECT[atk][def] = multiplier. Missing pair defaults to 1.
  const EFFECT = {
    fire:  { grass: 2,   water: 0.5, fire: 0.5, elec: 1,   dark: 1,   light: 1 },
    water: { fire: 2,    grass: 0.5, water: 0.5, elec: 0.5, dark: 1,   light: 1 },
    grass: { water: 2,   elec: 1.5,  fire: 0.5, grass: 0.5, dark: 1,   light: 1 },
    elec:  { water: 2,   light: 1.5, grass: 0.5, elec: 0.5, dark: 1,   fire: 1 },
    dark:  { light: 2,   grass: 1.5, dark: 0.5, fire: 1,   water: 1,   elec: 1 },
    light: { dark: 2,    fire: 1.5,  light: 0.5, grass: 1,  water: 1,   elec: 1 },
  };
  const STAB = 1.2; // same-type-attack-bonus — NOTE: defined but NOT currently applied in battle.js
                    // combat (elemMult/effectiveness is the only element multiplier wired in). So a
                    // same-element hit nets the raw 0.75 diagonal, NOT 0.75×1.2. Wire stabBonus()
                    // into hurtEnemy if STAB should actually matter; until then it's data-only.

  // Assign an element to every existing species by flavor / palette.
  const SPECIES_ELEMENT = {
    // N
    tangyuan: 'fire',   // 橘猫，暖色
    doudou:   'grass',  // 狸花，野外机灵
    xiaohui:  'water',  // 银灰，雨天窗台
    moqiu:    'dark',   // 纯黑夜猫
    nainai:   'light',  // 奶白初雪
    nietu:    'grass',  // 奶油踩奶
    niuniu:   'elec',   // 话痨跳脱
    // R
    sanhua:   'light',  // 招福三花
    lixiao:   'dark',   // 燕尾服绅士
    lanbao:   'water',  // 英短蓝猫
    dundun:   'water',  // 银渐层
    yunduo:   'light',  // 布偶云朵
    zherdd:   'grass',  // 折耳佛系
    qisi:     'fire',   // 起司橘白，暖色贪吃
    duanduan: 'elec',   // 曼基康矮脚，小电球冲刺
    jinjc:    'elec',   // V4 §8 Q1 LOCKED 2026-11-25: 金渐层 migrated 光 → 电 (dianLiGongXiang trait)
    nuowei:   'grass',  // 挪威森林山林王者
    baomao:   'dark',   // 豹猫野性爆发
    // SR
    xianluo:  'elec',   // 暹罗大嗓门
    yinghua:  'light',  // 粉樱梦幻
    senlin:   'grass',  // 缅因森林巨猫
    youling:  'dark',   // 紫雾幽灵
    // SSR
    jinwu:    'fire',   // 火焰金乌
    yuelian:  'light',  // 踏月仙猫
    xingchen: 'dark', // 星河梦境
    abi: 'fire', meidu: 'grass', xuewa: 'water', mengmai: 'dark',
    fanmao: 'water', bosi: 'light', wumao: 'elec', jiafei: 'fire',
  };

  function elementOf(speciesId) { return SPECIES_ELEMENT[speciesId] || 'light'; }

  // 0.5 | 1 | 1.5 | 2
  function effectiveness(atkEl, defEl) {
    const row = EFFECT[atkEl];
    if (!row) return 1;
    const m = row[defEl];
    return (m == null) ? 1 : m;
  }
  function effectivenessLabel(mult) {
    if (mult >= 2) return '效果绝佳!!';
    if (mult >= 1.5) return '效果拔群!';
    if (mult <= 0.5) return '效果不佳…';
    return '';
  }
  // STAB: cat firing a skill of its own element hits 20% harder.
  function stabBonus(cat, skill) {
    const sp = cat && cat.species;
    return (sp && elementOf(sp) === skill.element) ? STAB : 1;
  }

  // ==========================================================================
  // 2. SKILL LIBRARY (~18 skills across elements + roles)
  // ==========================================================================
  // power = multiplier of fighter.dmg. appliesTag seeds the combo system.
  const SKILLS = [
    // ---- 火 fire ----
    { id: 'emberClaw',  name: '炽爪',     element: 'fire',  kind: 'melee',      power: 1.3, cd: 2.2, ultCost: 0,  tags: ['burn'],          appliesTag: 'burn',  vfx: 'muzzle',    desc: '燃烧的猫爪撕击，附加灼烧。' },
    { id: 'fireballMeow', name: '火球术', element: 'fire',  kind: 'projectile', power: 1.65, cd: 2.5, ultCost: 0, windup: 0.18, precise: true, tags: ['burn','ranged'], appliesTag: 'burn',  vfx: 'impact',    desc: '短暂蓄力后射出高速压缩火球，命中第一个敌人并施加灼烧，不产生范围伤害。' },
    { id: 'puffHiss',   name: '弓背炸毛', element: 'fire',  kind: 'buff',       power: 0,   cd: 8.0, ultCost: 0,  tags: ['buff','threat'], appliesTag: null, vfx: 'ring',      desc: '弓背炸毛虚张声势：自身伤害提升，并把靠得太近的敌人吓退一步。' },
    { id: 'flameSweep', name: '横扫喷焰', element: 'fire', kind: 'beam', channel: 2.7, damageChannel: 1.35, reach: 156, width: 22, sweep: .72, sweepPasses: 3, power: 1.85, cd: 6.3, ultCost: 0, windup: .18, tags: ['burn','channel'], appliesTag: 'burn', vfx: 'flame', desc: '左右横扫三趟；每趟扫中造成一次适中伤害，不重复跳伤。', unlock: { level: 6, element: 'fire' } },
    { id: 'sunflare',   name: '金乌焱',   element: 'fire',  kind: 'aoe',        power: 2.4, cd: 0,   ultCost: 70, tags: ['burn','ult'],    appliesTag: 'burn',  vfx: 'shockwave', desc: '【必杀】背负烈日炸裂全场，重灼。' },
    // ---- 水 / 冰 water ----
    // All Water cats (including 蓝莓) receive an actual water-typed ice claw,
    // never an electric claw borrowed from an invented elemental ring.
    { id: 'frostClaw', name: '寒冰爪', element: 'water', kind: 'melee',
      power: 1.22, cd: 2.05, ultCost: 0, tags: ['soak','frost'],
      appliesTag: 'soak', vfx: 'ice',
      desc: '短距离挥出霜晶爪痕，使目标湿润；更强的霜锥需向训练师学习。' },
    { id: 'waterLash',  name: '水鞭',     element: 'water', kind: 'projectile', power: 1.2, cd: 2.0, ultCost: 0,  tags: ['soak','ranged'], appliesTag: 'soak',  vfx: 'impact',    desc: '高压水流抽击，使目标淋湿——淋湿会减速移动，并为元素反应铺垫。' },
    { id: 'knockOff',   name: '拨下桌',   element: 'water', kind: 'pounce',     power: 1.75, cd: 3.5, ultCost: 0,  heavy: true, tags: ['soak','dash','launch'], appliesTag: 'soak', vfx: 'beam', desc: '一掌把目标拨向场地边缘——重重击退并淋湿。侧后方突袭更狠。' },
    { id: 'grooming',   name: '舔毛理顺', element: 'water', kind: 'heal', healMode: 'area', power: 0,   cd: 8.0, ultCost: 0,  tags: ['heal'], appliesTag: null, vfx: 'orb', desc: '舔毛安抚周围的伙伴，展开一片持续回复的水雾领域。仅辅助能领悟。', unlock: { element: 'water', role: ['support'] } },
    { id: 'waterJet',   name: '水枪',     element: 'water', kind: 'beam', channel: 1.2, reach: 300, width: 12, power: 1.75, cd: 5.0, ultCost: 0, castSlow: 0.5, tags: ['soak','channel','ranged'], appliesTag: 'soak', vfx: 'beam', desc: '高压水凝成锋锐长枪，沿细直线贯穿多个敌人并持续造成伤害；施放时原地不动，收枪后短暂迟缓。' },
    { id: 'bubbleVeil', name: '泡泡幕',   element: 'water', kind: 'buff', shieldType: 'barrier', power: 0, cd: 5.0, ultCost: 0, wardDuration: 5.2, tags: ['shield','soak'], appliesTag: null, vfx: 'ring', desc: '展开泡泡护盾，减伤 45%，持续约 5 秒——前排的持续减伤罩。' },
    { id: 'tidePool',   name: '潮汐池',   element: 'water', kind: 'aoe', power: 0.6, cd: 4.0, ultCost: 0, field: { element: 'water', tag: 'soak', life: 6 }, tags: ['soak','field'], appliesTag: 'soak', vfx: 'ring', desc: '抛出一片潮汐水域：站在其中持续淋湿；用⚡电系技能打入水域可引爆「元素反应」，范围内全体过载！' },
    { id: 'tidalPulse', name: '潮波三叠', element: 'water', kind: 'projectile', power: 1.15, cd: 5.2, ultCost: 0, pulseCount: 3, pulseGap: 0.30, pulseHoming: 1.8, tags: ['soak','ranged','pulse'], appliesTag: 'soak', vfx: 'orb', desc: '一发激起三叠潮波：每 0.3 秒一发自动追击当下最近的敌人，持续淋湿。', unlock: { level: 5 } },
    // GRASS mirror of 潮汐池: a lingering aoe FIELD that BINDS (束缚) enemies standing in it, instead of
    // soaking them (owner: "草系也要有类似的，但是是束缚住对面"). Same aoe/field delivery (lobAoe reads
    // sk.field → spawnField applies the tag each frame); bind is a real soft-CC (roots movement, slows).
    { id: 'vineMire',   name: '藤蔓沼泽', element: 'grass', kind: 'aoe', power: 0.6, cd: 4.0, ultCost: 0, windup: 1.4, castSlow: 0.8, field: { element: 'grass', tag: 'bind', life: 6 }, tags: ['bind','field'], appliesTag: 'bind', vfx: 'ring', desc: '长时间吟唱后抛出一片缠绕藤蔓的沼泽：站在其中的敌人被持续束缚、难以移动；吟唱期间可被打断，是草系控制流的领域技。' },
    // FIRE heavy-aoe mirror (owner: "火系要有类似的 比如陨石"): a long-channel BURST aoe that drops a
    // meteor for big area damage + leaves a burning field (burn tag). High power (1.6 → ranged-strong =
    // a dps nuke), long windup so it's a readable, interruptible commit like vineMire. Same aoe/field
    // delivery path (lobAoe reads sk.field → spawnField), cd floored higher for the payoff.
    { id: 'meteor',     name: '陨石术',   element: 'fire',  kind: 'aoe', power: 2.4, cd: 7.0, ultCost: 0, windup: 1.5, castSlow: 0.9, field: { element: 'fire', tag: 'burn', life: 5 }, tags: ['burn','field'], appliesTag: 'burn', vfx: 'shockwave', desc: '长时间吟唱后召唤多颗燃烧陨石砸向目标：巨额范围爆发伤害，并在落点留下灼烧火场；吟唱期间可被打断。' },
    // LIGHT field mirror (owner: light had NO regular aoe-blind — only ult moonlitHalo/moonfang). A long
    // -channel aoe that leaves a dazzling light zone: enemies inside are continually BLINDED (miss/stray
    // their shots). Symmetric to 潮汐池 soak / 藤蔓沼泽 bind / 陨石 burn — same aoe+windup+field delivery;
    // low power (0.6) so it's a control-field, not a nuke → control/dps/support can learn it.
    { id: 'glareField', name: '炫目光域', element: 'light', kind: 'aoe', power: 0.6, cd: 4.5, ultCost: 0, windup: 1.4, castSlow: 0.8, field: { element: 'light', tag: 'blind', life: 5 }, tags: ['blind','field'], appliesTag: 'blind', vfx: 'ring', desc: '长时间吟唱后在目标区域炸开刺目光幕：站在其中的敌人被持续致盲、攻击频频失准；吟唱期间可被打断，是光系的控制领域技。' },
    { id: 'guardStance', name: '守护',   element: 'light', kind: 'buff', shieldType: 'protect', power: 0, cd: 9.0, ultCost: 0, tags: ['shield'], appliesTag: null, vfx: 'ring', unlock: { role: ['tank','fighter'] }, desc: '坦克 / 格斗专属：极短时间完全格挡下一次攻击；结束后短暂易伤。' },
    { id: 'mirrorWall',  name: '炸毛墙', element: 'neutral',  kind: 'buff', shieldType: 'reflect', power: 0, cd: 10.0, ultCost: 0, tags: ['shield'], appliesTag: null, vfx: 'ring', unlock: { role: ['tank'] }, desc: '坦克专属：在身前架起长形镜面护墙，为身后队友阻挡或反弹远程弹体。持墙期间移速减半，转向缓慢。' },
    // Tank self-heal (owner call 2026-11-25): tanks must be self-sustaining — they absorb damage and
    // patch themselves back up, rather than relying on a support medic. Neutral element so any-element
    // tank can slot it (parallel to 炸毛墙); role-gated to tank; locks caster to self via healMode:'self'
    // (new dispatch branch) so it NEVER auto-routes to a worse-off ally (that's grooming's job now).
    { id: 'lickWound',  name: '舔伤口', element: 'neutral', kind: 'heal', healMode: 'self', healPct: 0.30, power: 0, cd: 8.0, ultCost: 0, castSlow: 0.5, tags: ['heal'], appliesTag: null, vfx: 'orb', unlock: { role: ['tank'] }, desc: '坦克专属：蹲下舔舐伤口，回复 30% 生命——舔毛时移动变慢，但撑住队伍是坦克的职责。' },
    { id: 'tsunamiPaw', name: '潮汐掌',   element: 'water', kind: 'aoe',        power: 2.2, cd: 0,   ultCost: 65, tags: ['soak','ult'],    appliesTag: 'soak',  vfx: 'shockwave', desc: '【必杀】掀起巨浪，全体淋湿。' },
    // ---- 草 grass ----
    { id: 'leafDart',   name: '叶刃',     element: 'grass', kind: 'projectile', power: 1.0, cd: 1.6, ultCost: 0,  tags: ['ranged'],        appliesTag: null,    vfx: 'muzzle',    desc: '锋利草叶高速飞射。' },
    { id: 'sporeBloom', name: '孢子涨',   element: 'grass', kind: 'projectile', power: 1.25, cd: 3.2, ultCost: 0, grow: 3.2, tags: ['ranged','bind'], appliesTag: 'bind', vfx: 'impact', desc: '孢子团边飞边膨胀，飞得越远覆盖范围越大，命中束缚目标。' },
    { id: 'homingSeed', name: '追踪草种', element: 'grass', kind: 'projectile', power: 1.25, cd: 3.6, ultCost: 0, homing: 3.2, tags: ['ranged'], appliesTag: null, vfx: 'muzzle', desc: '会追踪目标的草种，最多飞行数秒后消散。' },
    { id: 'thornCoil',  name: '荆缠',     element: 'grass', kind: 'melee',      power: 1.55, cd: 3.5, ultCost: 0,  tags: ['bind','bleed'],  appliesTag: 'bleed', vfx: 'impact',    desc: '荆棘缠绕撕裂，造成流血。' },
    { id: 'boxAmbush',  name: '纸箱埋伏', element: 'grass', kind: 'buff',       power: 0,   cd: 9.0, ultCost: 0,  tags: ['buff','camo'],   appliesTag: null, vfx: 'ring',      desc: '钻进纸箱短暂隐身不可被选中，下一击必定把目标打得踉跄并造成双倍伤害。' },
    { id: 'quakeStomp', name: '泰山压顶', element: 'grass', kind: 'leap',       power: 1.9, cd: 5.0, ultCost: 0,  heavy: true, tags: ['melee','stagger'], appliesTag: null, vfx: 'impact', desc: '腾空跃起，泰山压顶般砸向目标点，落地小范围震荡并击虚周围敌人。' },
    { id: 'photosynth', name: '光合',     element: 'grass', kind: 'heal', healMode: 'cleanse', power: 0,   cd: 8.0, ultCost: 0,  tags: ['heal','cleanse'], appliesTag: null, vfx: 'orb', desc: '吸收日光回复斗志，并洗去一种异常状态或挣脱束缚——草木的再生之力。' },
    { id: 'knead',      name: '踩奶',     element: 'grass', kind: 'buff',       power: 0,   cd: 2.4, ultCost: 0,  tags: ['buff','knead'],  appliesTag: null,    vfx: 'orb',       desc: '原地踩奶进入状态：每次叠一层（最多4层），层层提升伤害并回一点斗志；猫味十足的节奏型蓄能。' },
    { id: 'sunbloom', name: '阳光烈焰', element: 'grass', kind: 'aoe', power: 2.2, cd: 0, ultCost: 70, tags: ['ult'], vfx: 'beam', desc: '【必杀】蓄力0.85秒后释放强力直线日光束，命中路径上的敌人。' },
    // ---- 电 elec ----
    { id: 'staticPounce', name: '疯跑冲刺', element: 'elec', kind: 'dash',      power: 1.85, cd: 4.0, ultCost: 0,  heavy: true, tags: ['shock','dash'],  appliesTag: 'shock', vfx: 'beam',  desc: '半夜疯跑般的带电冲刺，撞中麻痹目标。侧后方突袭更狠。' },
    { id: 'boltArc',    name: '电弧',     element: 'elec',  kind: 'chain',      power: 1.35, cd: 2.2, ultCost: 0,  tags: ['shock','ranged'],appliesTag: 'shock', vfx: 'beam',      desc: '跳跃的电弧，在敌群间连锁跳跃，附加感电。' },
    { id: 'lightningOrb',name: '球状闪电', element: 'elec', kind: 'projectile', power: 1.5, cd: 4.8, ultCost: 0, homing: 3.4, tags: ['shock','ranged'], appliesTag: 'shock', vfx: 'orb', desc: '缓慢浮游的电球转向敌人，命中放出感电火花。', unlock: { level: 5, element: 'elec' } },
    { id: 'thunderStream',name: '雷流喷射', element: 'elec', kind: 'beam', channel: 1.22, reach: 270, width: 13, power: 1.75, cd: 5.5, ultCost: 0, tags: ['shock','channel','ranged'], appliesTag: 'shock', vfx: 'lightning', desc: '猫咪短暂站定，持续吐出可转向的折线雷电。', unlock: { level: 4, element: 'elec' } },
    { id:'magneticField',name:'雷极磁场',element:'elec',kind:'aoe',power:.45,cd:9,ultCost:0,reach:180,tags:['shock','control','field'],appliesTag:'shock',vfx:'lightning',desc:'在目标方向展开双雷核，持续4秒牵引并电击两极之间的敌人。',unlock:{level:8,element:'elec',role:['control']} },
    { id: 'thunderYowl',name: '雷鸣啸',   element: 'elec',  kind: 'aoe',        power: 2.3, cd: 0,   ultCost: 70, tags: ['shock','ult'],   appliesTag: 'shock', vfx: 'beam',      desc: '【必杀】一声炸雷贯穿全场。' },
    // ---- 暗 dark ----
    { id: 'shadowSwipe',name: '影袭',     element: 'dark',  kind: 'melee',      power: 1.35,cd: 2.4, ultCost: 0,  tags: ['bleed'],         appliesTag: 'bleed', vfx: 'muzzle',    desc: '自暗影中突袭，造成撕裂伤。' },
    { id: 'shadeLeap',  name: '飞扑',     element: 'dark',  kind: 'pounce',     power: 1.7, cd: 4.0, ultCost: 0,  tags: ['melee','dash'],  appliesTag: null,    vfx: 'beam',      desc: '猛地飞扑而出，撞上的第一个敌人受到重击并被击退。' },
    { id: 'batAround',  name: '戏弄爪',   element: 'dark',  kind: 'melee',      power: 0.8, cd: 2.0, ultCost: 0,  tags: ['dizzy'],         appliesTag: 'dizzy', vfx: 'muzzle',    desc: '像拍打玩具一样戏弄目标：伤害不高，却打得它眩晕又后仰。' },
    { id: 'hex',        name: '猫咒',     element: 'dark',  kind: 'projectile', power: 0.9, cd: 3.0, ultCost: 0,  precise: true, tags: ['expose','curse'], appliesTag: 'expose', vfx: 'orb',       desc: '诅咒之球直取破绽——正中命中威力更强，使目标受到的伤害提高40%。' },
    // SALVO/PULSE projectile: ONE cast queues 3 waves ~0.35s apart. Each wave re-aims at the
    // NEAREST enemy at its own release time, so the player can watch the first wave land and
    // the second/third can retarget mid-cast. pulseCount/pulseGap/pulseHoming define the pattern.
    { id:'arcanePulse', name:'暗星轰击', element:'dark', kind:'aoe', power:.78, cd:6.5, ultCost:0, reach:340, lobCount:3, lobGap:.42, lobFlight:.76, lobRadius:46, lobSpread:24, tags:['ranged','lob','salvo'], appliesTag:null, vfx:'umbralLob', allowRoles:['dps','control'], autoLearn:true, unlock:{level:5,element:'dark',role:['dps','control']}, desc:'向锁定地面连续抛射三颗暗星能量弹，落地小范围爆裂；落点固定，不追踪。暗系输出/控制共享。' },
    { id:'shadowTendrils', name:'暗影触手', element:'dark', kind:'beam', power:.65, cd:8, ultCost:0, channel:1.6, windup:.22, castSlow:.4, reach:240, width:30, statusDuration:.65, tags:['control','bind','channel','ranged'], appliesTag:'bind', vfx:'tendrils', allowRoles:['control'], autoLearn:true, unlock:{level:6,element:'dark',role:['control']}, desc:'持续喷出多条暗影触手，贯穿前方狭长区域，低伤害压制并短暂束缚敌人。暗系控制专属。' },
    { id: 'voidMaw',    name: '虚吞',     element: 'dark',  kind: 'aoe',        power: 2.5, cd: 0,   ultCost: 80, tags: ['curse','ult','rewind'],   appliesTag: ['dizzy','rewind'], vfx: 'shockwave', desc: '【必杀】深渊巨口吞噬，时间回溯——将目标斗志拉回数秒前！' },
    // ---- 光 light ----
    { id: 'prismBeam',  name: '棱光束',   element: 'light', kind: 'projectile', power: 1.2, cd: 2.6, ultCost: 0,  tags: ['ranged','blind'],appliesTag: 'blind', vfx: 'beam',      desc: '聚焦光束灼目，可致短暂失明。' },
    { id: 'highGround', name: '居高临下', element: 'light', kind: 'leap',       power: 1.85, cd: 4.5, ultCost: 0,  heavy: true, tags: ['melee','blind'], appliesTag: 'blind', vfx: 'impact', desc: '抢占高处俯冲而下的一记重扑，眩光致盲。侧后方突袭更狠。' },
    { id: 'blessFur',   name: '呼噜光环', element: 'light', kind: 'buff',       power: 0,   cd: 9.0, ultCost: 0,  tags: ['buff','regen'],  appliesTag: null,    vfx: 'orb',       desc: '发出安心的呼噜声形成光环，提升自身伤害。' },
    { id: 'dawnHeal',   name: '慢眨眼',   element: 'light', kind: 'heal', healMode: 'single',       power: 0,   cd: 7.5, ultCost: 0,  tags: ['heal'],          appliesTag: null,    vfx: 'ring',      desc: '对你缓缓眨眼表达信任，回复斗志。' },
    { id: 'moonlitHalo',name: '月华环',   element: 'light', kind: 'heal',       power: 0,   cd: 0,   ultCost: 60, healUlt: true, healPct: 0.6, tags: ['heal','ult'], appliesTag: null, vfx: 'ring',      desc: '【必杀】月华绽放，为全体队友回复 60% 生命——光系的团队治疗大招。' },

    // ========================================================================
    // GATED / LEARNED skills — NOT innate. Each carries an `unlock` descriptor
    // (see section 5). A cat must LEARN these at the trainer before equipping;
    // learning drops the skill id into cat.learned. Skills WITHOUT `unlock`
    // follow the classic element/level/rarity rules and stay free as before.
    // ========================================================================
    // ---- 付费领悟 (pay a trainer) ----
    { id: 'cometClaw',  name: '彗星爪',   element: 'fire',  kind: 'melee',      power: 2.25, cd: 3.2, ultCost: 0, heavy: true, upgradeOf: 'emberClaw', tags: ['burn','heavy'],   appliesTag: 'burn',  vfx: 'impact',    desc: '付费领悟的重爪：拖着火尾的一记猛击，灼烧更重。', unlock: { cost: { coins: 150 } } },
    { id: 'tidalBite',  name: '潮汐咬',   element: 'water', kind: 'melee',      power: 1.5, cd: 2.8, ultCost: 0, tags: ['soak','heavy'],   appliesTag: 'soak',  vfx: 'impact',    desc: '用小鱼干向训练师换来的近身咬击，淋湿并重创。', unlock: { cost: { fish: 6 } } },
    { id: 'thornLash',  name: '荆棘鞭',   element: 'grass', kind: 'melee',      power: 1.5, cd: 3.0, ultCost: 0, upgradeOf: 'thornCoil', tags: ['bind','bleed'],   appliesTag: 'bleed', vfx: 'impact',    desc: '用金币换来的缠斗技，撕裂并束缚目标。', unlock: { cost: { coins: 120 } } },
    // ---- 等级 / 亲密 / 组合门槛 ----
    // Owner 2026-11-26: 霜锥和水鞭不要做成上下级关系. Removed upgradeOf — 霜锥 is a
    // standalone high-tier chill ranged (gated by Lv10 unlock), NOT a replacement for 水鞭.
    { id: 'frostLance', name: '霜锥',     element: 'water', kind: 'projectile', power: 1.95,cd: 2.2, ultCost: 0, precise: true, tags: ['soak','ranged','precise','heavy'], appliesTag: 'chill', vfx: 'impact', desc: '精准的寒冰锥，正中可冻住目标，冷却更短。达到等级方可领悟。', unlock: { level: 10 } },
    { id: 'voltRush',   name: '雷遁突袭', element: 'elec',  kind: 'dash',       power: 2.3, cd: 4.2, ultCost: 0, heavy: true, upgradeOf: 'staticPounce', tags: ['shock','dash','heavy'], appliesTag: 'shock', vfx: 'beam', desc: '高亲密才能驾驭的闪电冲刺，撞中强麻痹。', unlock: { affinity: 60 } },
    // ---- 多发追踪弹幕 (homing VOLLEY — the multi-shot cousin of 球状闪电/追踪草种) ----
    // Fires `shots` tracking projectiles in a spread; each turns toward the target (homing) and
    // expires after maxLife. Per-pellet power is modest so the SUM isn't a nuke. ranged-weak →
    // control-legal; dps/control learn it (not tanks/fighters — no backline guns; not assassin —
    // beam/aoe/long-gun banned, but a thrown homing swarm is a gun, so gated off assassin too).
    { id: 'boltSwarm',  name: '雷弹群',   element: 'elec',  kind: 'projectile', power: 0.34, cd: 5.0, ultCost: 0, shots: 4, spread: 0.5, homing: 2.6, maxProjLife: 2.4, tags: ['shock','ranged'], appliesTag: 'shock', vfx: 'orb',    desc: '一次放出数枚会追踪目标的小电弹，单发威力低但成群压制；数秒后消散。达到等级方可领悟。', unlock: { level: 8, element: 'elec', role: ['dps','control'] } },
    { id: 'prismSwarm', name: '棱光群',   element: 'light', kind: 'projectile', power: 0.34, cd: 5.0, ultCost: 0, shots: 4, spread: 0.5, homing: 2.6, maxProjLife: 2.4, tags: ['ranged','blind'], appliesTag: 'blind', vfx: 'orb',    desc: '折射出数道会追踪目标的光弹，单发威力低但成群致盲；数秒后消散。达到等级方可领悟。', unlock: { level: 8, element: 'light', role: ['dps','control'] } },
    { id: 'apexPounce', name: '绝顶扑',   element: 'dark',  kind: 'pounce',     power: 2.3, cd: 4.0, ultCost: 0, heavy: true, upgradeOf: 'shadeLeap', tags: ['dash','heavy'],   appliesTag: null,    vfx: 'beam',      desc: '需要等级与金币双重积累的绝技，重创并击退。', unlock: { level: 12, cost: { coins: 200 } } },
    // ---- 品种专属 (breed-locked signature) ----
    { id: 'moonfang',   name: '月噬牙',   element: 'light', kind: 'aoe',        power: 2.6, cd: 0,   ultCost: 70, tags: ['light','ult','weaken'], appliesTag: ['blind','weaken'], vfx: 'ring', desc: '【必杀·品种专属】唯踏月血脉能领悟的月华獠牙，致盲并削弱。', unlock: { species: ['yuelian','xingchen','yinghua'] } },
    // YUELIAN (月月) signature skill — a wide fan of 5 crescent-moon energy waves, each auto-homing.
    // Species-locked signature: 月月 only. Owner-driven redesign 2026-11-26:
    //   • 2.5s CHARGE: 5 moon-arcs spawn in a FAN AIMED at the target (owner:
    //     "方向应该指向目标位置 … 蓄力时就该看见朝向"). Caster CANNOT move while
    //     charging (owner: "发动时猫不能动").
    //   • Each fires 0.3s apart (owner: "发射间隔改成0.3s"), re-locks nearest enemy
    //     at release, only fires if a live target exists (owner: "触手有时候在效果
    //     范围外就发射了" — applied here as "require live enemy at release").
    //   • Slow launch, continuously ACCELERATES — infinite range, authored moon-fx sprite.
    { id: 'crescentFan', name: '月华连弧', element: 'light', kind: 'projectile', power: 0.6, cd: 6.5, ultCost: 0, pulseCount: 3, pulseGap: 0.45, chargeT: 2.5, chargeLock: true, tags: ['ranged','blind','moon','pulse','channel'], appliesTag: 'blind', vfx: 'crescent', desc: '踏月之猫的招牌：月月头顶凝结月弧蓄势2.5秒，而后每隔0.45秒逐一射出三道，锁敌之后由慢渐快，无视射程。', unlock: { species: ['yuelian'], level: 10 } },
    // ---- 领悟条件 (quirky quests) ----
    { id: 'veteranStrike', name: '百战斩', element: 'dark', kind: 'melee',      power: 2.3, cd: 3.4, ultCost: 0, heavy: true, upgradeOf: 'shadowSwipe', tags: ['bleed','heavy'], appliesTag: 'bleed', vfx: 'muzzle', desc: '身经百战方能领悟：随它出战并赢得十场战斗后解锁的致命一击。', unlock: { quest: 'battlesWon10' } },
    // 呼噜新星 purrNova removed per V4 (owner 2026-11-26): duplicated 金乌焱 sunflare (same fire
    // aoe ult; sunflare power 2.4 ultCost 70 is the canonical one). Keep this comment as a
    // dedup marker so a future agent doesn't re-add it.
    { id: 'tenderPaw',  name: '抚心掌',   element: 'light', kind: 'heal', healMode: 'single', healPct: 0.62,       power: 0,   cd: 7.0, ultCost: 0, upgradeOf: 'dawnHeal', tags: ['heal'],           appliesTag: null,    vfx: 'orb',       desc: '被长久撸爱后领悟的治愈掌，回复更多斗志。', unlock: { quest: 'pet40' } },
  ];

  // ==========================================================================
  // GENERIC SKILL TEMPLATES × 6 ELEMENTS (#56 — give every element a full role kit)
  // ==========================================================================
  // Each element gets its OWN basic version of the core archetypes (爪击/弹射/冲刺/
  // 护盾/愈合) so build recommendations never have to borrow cross-element. The NUMBERS
  // are shared per template (balance once, applies to all); the element only changes the
  // name, color, applied status-tag, AND a small per-element MICRO-TWEAK so "烈焰爪" and
  // "碧波爪" feel different, not reskinned. The factory only fills a (element,archetype)
  // slot that the hand-authored roster is MISSING — it never duplicates a signature skill.
  const ELEMENT_KIT = {
    fire:  { tag: 'burn',  color: '#ff7a3c', claw: '烈焰爪', bolt: '焰弹',   rush: '炽焰冲', ward: '烈焰罩', heal: '暖阳舔毛', volley: '焰花连射', tw: { melee: { powMul: 1.05 }, dash: { trail: true }, shield: { variant: 'barrier', reflectBurn: true }, heal: { selfBuff: true } } },
    water: { tag: 'soak',  color: '#4aa8ff', claw: '碧波爪', bolt: '水弹',   rush: '潮涌冲', ward: '碧波罩', heal: '润泽舔毛', volley: '水珠连射', tw: { dash: { knockMul: 1.4 }, heal: { hot: true } } },
    grass: { tag: 'bind',  color: '#6fcf5f', claw: '藤蔓爪', bolt: '草弹',   rush: '疾藤冲', ward: '藤甲罩', heal: '光合舔毛', volley: '飞叶连射', tw: { melee: { lifesteal: 0.1 }, dash: { bindOnHit: true }, shield: { variant: 'barrier', regen: true } } },
    elec:  { tag: 'shock', color: '#ffd23c', claw: '雷光爪', bolt: '电弹',   rush: '迅雷冲', ward: '雷光罩', heal: '静电舔毛', volley: '电弹连射', tw: { melee: { cdMul: 0.85 }, heal: { haste: true } } },
    dark:  { tag: 'bleed', color: '#8a6bff', claw: '暗影爪', bolt: '影弹',   rush: '幽影冲', ward: '暗影罩', heal: '夜舔毛',   volley: '影弹连射', tw: { melee: { backstab: 1.25 }, dash: { stealthFrames: true }, shield: { variant: 'barrier' }, heal: { leech: true } } },
    light: { tag: 'blind', color: '#ffe9a8', claw: '耀光爪', bolt: '光弹',   rush: '流光冲', ward: '耀光罩', heal: '晨光舔毛', volley: '光弹连射', tw: { melee: { powMul: 1.0 }, dash: { trail: true }, heal: { ally: true, big: true } } },
  };
  // Base stats per archetype (balance here once → all six elements inherit).
  const TEMPLATES = {
    melee:  { kind: 'melee',      power: 1.25, cd: 1.6, vfx: 'muzzle', nameKey: 'claw', descZh: '元素猫爪撕击，附带元素效果。' },
    ranged: { kind: 'projectile', power: 1.0,  cd: 2.0, vfx: 'impact', nameKey: 'bolt', descZh: '射出元素弹丸，附带元素效果。' },
    // 直线多发弹幕 (barrage): a FAN of straight low-power darts. Per-pellet power is deliberately
    // low (stays ranged-weak → control-legal, never a nuke) and the suppression comes from volume,
    // not a single big hit. Role-gated to dps/control (backline suppression/zoning) — tanks/fighters
    // barrage removed per V4 owner 2026-11-26.
    dash:   { kind: 'dash',       power: 1.35, cd: 4.0, vfx: 'beam',   nameKey: 'rush', descZh: '带电般冲刺撞击，侧后方突袭更狠。' },
    shield: { kind: 'buff',       power: 0,    cd: 7.0, vfx: 'ring',   nameKey: 'ward', descZh: '展开元素护罩，短时减伤。', shield: true },
    heal:   { kind: 'heal',       power: 0,    cd: 7.5, vfx: 'orb',    nameKey: 'heal', descZh: '安抚自身，回复斗志。' },
  };
  // What archetype is this skill a "basic version of"? (used to detect gaps)
  function _archOf(s) {
    if (s.ultCost > 0) return null;
    if (s.kind === 'melee') return 'melee';
    if (s.kind === 'projectile') return 'ranged';
    if (['dash','pounce','leap'].includes(s.kind)) return 'dash';
    if (s.kind === 'heal') return 'heal';
    if (s.kind === 'buff' && (s.shieldType || (s.tags || []).includes('shield'))) return 'shield';
    return null;
  }
  // Build one generated skill for (element, archetype) from the template + kit tweak.
  function _genSkill(el, arch) {
    const kit = ELEMENT_KIT[el], t = TEMPLATES[arch], tw = (kit.tw && kit.tw[arch]) || {};
    const id = 'gen_' + el + '_' + arch;
    const sk = {
      id, name: kit[t.nameKey], element: el, kind: t.kind,
      power: +(t.power * (tw.powMul || 1)).toFixed(2),
      cd: +(t.cd * (tw.cdMul || 1)).toFixed(2),
      ultCost: 0, generic: true,
      tags: [], appliesTag: null, vfx: t.vfx,
      desc: kit[t.nameKey] + '：' + t.descZh,
    };
    if (arch === 'shield') {
      sk.shieldType=tw.variant||'barrier';
      sk.tags=['shield',kit.tag];
      // Different-element barriers share a mechanic, not identical outcomes.
      const wards={
        fire:{reduction:.40,duration:3.6,retaliateBurn:true},
        grass:{reduction:.30,duration:5.2,regenPct:.015},
        dark:{reduction:.55,duration:3.3}
      };
      const w=wards[el]||{reduction:.45,duration:4.8};
      sk.wardReduction=w.reduction;sk.wardDuration=w.duration;
      if(w.retaliateBurn)sk.wardRetaliateBurn=true;
      if(w.regenPct)sk.wardRegenPct=w.regenPct;
      sk.desc=sk.name+'：'+Math.round(w.reduction*100)+'%减伤，持续'+w.duration+'秒'+
        (w.retaliateBurn?'；近身受击灼烧攻击者':w.regenPct?'；护盾期间缓慢恢复生命':'')+'。';
    }
    else if (arch === 'heal') {
      sk.tags = ['heal'];
      // Owner 2026-11-27 '两个舔伤口和舔毛重复了': tanks already have lickWound
      // (neutral-element self-heal, role:['tank']). Generic per-element heal
      // (gen_fire_heal '暖阳舔毛' etc.) should NOT also offer itself to tanks, or
      // the loadout picker shows two self-heals side by side. Non-tank roles still
      // get the element-flavored heal gap-filler.
      sk.allowRoles = ['fighter','dps','assassin','control','support'];
    }
    else { sk.tags = [kit.tag]; sk.appliesTag = kit.tag; }
    // carry the element micro-tweaks forward so battle.js can read them if it wants
    Object.assign(sk, tw);
    return sk;
  }
  // Fill every (element × core archetype) slot the hand-authored roster is MISSING.
  function genericSkills() {
    const out = [];
    for (const el of ELEMENT_ORDER) {
      for (const arch of ['melee', 'ranged', 'dash', 'shield', 'heal']) {
        const covered = SKILLS.some(s => s.element === el && _archOf(s) === arch);
        if (!covered) out.push(_genSkill(el, arch));
      }
      // Every element gets its own straight multi-dart barrage (role-gated to dps/control). It is a
      // distinct archetype (not covered by the 5 above), so it always generates for all six elements.
    }
    // Keep former duplicate dash IDs parseable for historical saves, without
    // offering them to new players. Never delete a stored player's old skill.
    for(const el of ['water','grass','dark','light']){
      const old=_genSkill(el,'dash');
      old.legacy=true;out.push(old);
    }
    return out;
  }
  // Inject the generated gap-fillers into the live roster BEFORE the lookup map builds.
  SKILLS.push(...genericSkills());

  const SKILL_BY_ID = {};
  SKILLS.forEach(s => { SKILL_BY_ID[s.id] = s; });
  function skillById(id) { return SKILL_BY_ID[id] || null; }
  function skillsByElement(el) { return SKILLS.filter(s => s.element === el); }
  // UPGRADE CHAINS (升级链): a skill may carry `upgradeOf: baseId` meaning it is the
  // stronger tier of that base (same slot role, same element — e.g. 彗星爪←炽爪). The
  // tier2 still has its own id (so saves/CI stay stable) + its own unlock gate; the
  // metadata just lets the UI show "升级版 of X" and lets a cat that learns the tier2
  // treat it as the natural successor. upgradeTargetOf(baseId) → the tier2 id (if any).
  const _UPGRADE_TARGET = {};
  SKILLS.forEach(s => { if (s.upgradeOf) _UPGRADE_TARGET[s.upgradeOf] = s.id; });
  function upgradeTargetOf(id) { return _UPGRADE_TARGET[id] || null; }          // base → tier2
  function upgradeBaseOf(id) { const s = skillById(id); return s && s.upgradeOf || null; } // tier2 → base
  // Full ordered chain [base, tier2, ...] that a given skill id belongs to.
  function upgradeChainFor(id) {
    let root = id;
    while (upgradeBaseOf(root)) root = upgradeBaseOf(root);   // walk down to the base
    const chain = [root];
    let next = upgradeTargetOf(root);
    while (next) { chain.push(next); next = upgradeTargetOf(next); }
    return chain;
  }

  // Status-tag metadata so battle.js can tick them uniformly.
  // dps = fraction of target maxhp per second (0 for crowd-control tags).
  const TAG_INFO = {
    burn:  { name: '灼烧', ttl: 4.0, dps: 0.03, color: '#ff7a3c' },
    soak:  { name: '淋湿', ttl: 5.0, dps: 0,    color: '#4aa8ff' },
    shock: { name: '感电', ttl: 3.0, dps: 0.02, color: '#ffd23c' },
    oil:   { name: '浸油', ttl: 6.0, dps: 0,    color: '#8a6bff' },
    // Tiered CC (see battle.js tickStatus): chill = hard freeze (no move/attack),
    // dizzy = full stun (shortest — it's the strongest), bind = root only (can still
    // attack, so it can run a little longer). Durations trimmed — CC felt too long.
    chill: { name: '冰冻', ttl: 2.2, dps: 0,    color: '#9ec8ff' },
    dizzy: { name: '眩晕', ttl: 1.4, dps: 0,    color: '#c9b6ff' },
    bleed: { name: '流血', ttl: 4.5, dps: 0.025,color: '#ff6b6b' },
    blind: { name: '失明', ttl: 2.6, dps: 0,    color: '#ffe9a8' },
    bind:  { name: '束缚', ttl: 3.0, dps: 0,    color: '#6fcf5f' },
    // --- advanced debuffs ---
    expose:{ name: '破绽', ttl: 5.0, dps: 0,    color: '#ff5a8a', dmgTaken: 1.2 },   // 破绽: +20% incoming damage
    weaken:{ name: '虚弱', ttl: 5.0, dps: 0,    color: '#b0a0c8', dmgDealt: 0.5 },   // 减攻: 自身伤害 ×0.5
    rust:  { name: '破甲', ttl: 10.0,dps: 0,    color: '#c98a4a', dmgTaken: 1.12 },  // 破甲: 10s +12% incoming damage, no passive HP drain
    rewind:{ name: '回溯', ttl: 0.1, dps: 0,    color: '#9d7bff', rewind: true },    // 时间倒流: 回退到数秒前的血量
  };

  // ==========================================================================
  // 3. STATUS-TAG COMBO TABLE ("1+1=3")
  // ==========================================================================
  // Keyed as `${existingTag}|${incomingElement}` OR `${existingTag}|@${skillId}`
  // for skill-specific combos. checkCombo scans the target's current tags.
  const COMBO = {
    // soak(淋湿) + 电 = 全体连锁 ×3
    'soak|elec':   { name: '导电连锁!', bonusMult: 1.5, effect: 'chainAll', consumes: true },
    // oil(浸油) + 火 = 爆炸
    'oil|fire':    { name: '浸油爆燃!', bonusMult: 1.45, effect: 'explode',  consumes: true },
    // soak(淋湿) + 火 = 蒸发(减伤, 清除淋湿)
    'soak|fire':   { name: '蒸发…',     bonusMult: 0.6, effect: 'steam',    consumes: true },
    // chill(冰冻) + 扑击(dash) = 碎冰暴击
    'chill|@staticPounce': { name: '碎冰暴击!', bonusMult: 1.5, effect: 'shatter', consumes: true },
    'chill|@thornCoil':    { name: '碎冰缠绕!', bonusMult: 1.4,  effect: 'shatter', consumes: true },
    // burn(灼烧) + 草 = 野火蔓延
    'burn|grass':  { name: '野火蔓延!', bonusMult: 1.3, effect: 'bloom',    consumes: false },
    // shock(感电) + 水 = 过载
    'shock|water': { name: '电解过载!', bonusMult: 1.4, effect: 'chainAll', consumes: true },
    // bleed(流血) + 暗 = 嗜血
    'bleed|dark':  { name: '嗜血突袭!', bonusMult: 1.35, effect: 'bloom',    consumes: false },
    // dizzy(眩晕) + 任意近战重击(光) = 制裁
    'dizzy|light': { name: '圣光制裁!', bonusMult: 1.4, effect: 'shatter', consumes: true },
    // blind(失明) + 暗 = 处决(目标下次攻击必失手)
    'blind|dark':  { name: '暗影处决!', bonusMult: 1.3, effect: 'blind',    consumes: false },

    // ============ 元素反应扩展 (more cross-element chemistry) ============
    // Each is a believable elemental interaction; every element both SETS UP a tag and
    // DETONATES someone else's. Effect keys reuse the implemented set (bonusMult +
    // shared combo VFX; shatter adds the icy-crit flash). consumes=true for the big
    // one-shot bursts, false for DoT/spread reactions so the status keeps ticking.

    // --- 水/冰 family ---
    'soak|grass':  { name: '藤蔓缠水!', bonusMult: 1.25, effect: 'bloom',    consumes: false }, // 湿润助长 → 束缚更久
    'chill|fire':  { name: '冰火爆裂!', bonusMult: 1.4, effect: 'explode',  consumes: true },  // 骤热碎冰 → 爆裂
    'chill|light': { name: '折射冰华!', bonusMult: 1.35, effect: 'shatter',  consumes: true },  // 光穿冰晶 → 碎
    'soak|dark':   { name: '溺影侵蚀!', bonusMult: 1.3, effect: 'bloom',    consumes: false }, // 湿透导蚀 → 流血叠加

    // --- 火/灼烧 family ---
    'burn|elec':   { name: '热离子化!', bonusMult: 1.4, effect: 'chainAll', consumes: true },  // 灼热电离 → 连锁
    'burn|water':  { name: '炽焰骤熄!', bonusMult: 0.7, effect: 'steam',    consumes: true },  // 水浇灭火(反制, 低倍)
    'oil|elec':    { name: '油烟引爆!', bonusMult: 1.45, effect: 'explode',  consumes: true },  // 浸油遇电火花 → 爆

    // --- 电/感电 family ---
    'shock|light': { name: '离子过曝!', bonusMult: 1.35, effect: 'shatter',  consumes: true },  // 感电+强光 → 过曝定身
    'shock|grass': { name: '雷击落种!', bonusMult: 1.25, effect: 'bloom',    consumes: false }, // 电流催长孢子

    // --- 束缚 / 控制 reactions (bind had NO reaction before) ---
    'bind|fire':   { name: '焚烬藤蔓!', bonusMult: 1.35, effect: 'explode',  consumes: true },  // 烧断束缚 → 爆烬
    'bind|elec':   { name: '缚身过载!', bonusMult: 1.4, effect: 'chainAll', consumes: true },  // 定身目标被连锁贯穿
    'dizzy|elec':  { name: '眩雷贯穿!', bonusMult: 1.4, effect: 'shatter',  consumes: true },  // 眩晕中雷 → 定身暴击

    // --- 暗/流血/破绽 reactions (expose/weaken were unused) ---
    'expose|dark': { name: '致命弱点!', bonusMult: 1.45, effect: 'shatter',  consumes: true },  // 破绽+暗影 → 致命一击
    'expose|fire': { name: '灼心强袭!', bonusMult: 1.35, effect: 'explode',  consumes: true },  // 破绽处灼烧爆发
    'bleed|grass': { name: '荆棘深撕!', bonusMult: 1.3, effect: 'bloom',    consumes: false }, // 荆棘撕裂流血伤口
    'weaken|light':{ name: '净光裁决!', bonusMult: 1.35, effect: 'shatter',  consumes: true },  // 虚弱目标受圣光裁决

    // --- 光/失明 reactions ---
    'blind|light': { name: '炫目爆闪!', bonusMult: 1.3, effect: 'shatter',  consumes: true },  // 失明叠光 → 爆闪
    'burn|fire':   { name: '烈焰叠烧!', bonusMult: 1.25, effect: 'bloom',    consumes: false }, // 同系叠烧(本系也有小反应)

    // --- CARRIER↔REAPER axis completion (火↔草, 暗↔光 made fully two-way) ---
    'bleed|fire':  { name: '焚血!',     bonusMult: 1.3,  effect: 'explode',  consumes: true },  // 火↔草: 火点爆草的流血伤口
    'expose|light':{ name: '圣光曝击!', bonusMult: 1.4,  effect: 'shatter',  consumes: true },  // 暗↔光: 光制裁暗揭露的破绽
    'bleed|light': { name: '净血裁决!', bonusMult: 1.3,  effect: 'shatter',  consumes: false }, // 暗↔光: 光引爆暗的流血
  };

  // checkCombo(targetTags, skill) -> null | {name, bonusMult, effect, consumes, tag}
  // Scans existing tags; skill-specific (@id) keys win over element keys.
  function checkCombo(targetTags, skill) {
    if (!targetTags || !targetTags.length || !skill) return null;
    let elHit = null;
    for (const tag of targetTags) {
      const bySkill = COMBO[tag + '|@' + skill.id];
      if (bySkill) return Object.assign({ tag }, bySkill);
      const byEl = COMBO[tag + '|' + skill.element];
      if (byEl && !elHit) elHit = Object.assign({ tag }, byEl);
    }
    return elHit;
  }

  // ==========================================================================
  // 4. RISKY COMBO-CHAIN (signature mechanic) — pure helpers + tuning
  // ==========================================================================
  // A chain is a pre-queued A->B->C. Each link multiplies damage AND raises the
  // caster's incoming-damage vulnerability while winding up. Getting interrupted
  // mid-link backfires self-damage. battle.js runs the state machine.
  const CHAIN = {
    maxLinks: 3,
    windupPerLink: 0.5,     // seconds of vulnerable windup before a link resolves
    dmgStep: 0.6,           // each link adds +0.6x damage
    vulnStep: 0.35,         // each link adds +0.35x incoming damage
    backfireBase: 0.25,     // interrupted link i backfires (0.25*(i+1)) of link dmg
    finisherUltRefund: 35,  // completing the final link refunds this much ult
  };

  // link 0 -> 1.0x, link 1 -> 1.6x, link 2 -> 2.2x ...
  function chainMultiplier(linkIndex) {
    return 1 + clamp(linkIndex, 0, CHAIN.maxLinks - 1) * CHAIN.dmgStep;
  }
  // link 0 -> 1.0x incoming, link 1 -> 1.35x, link 2 -> 1.7x (can't dodge too)
  function chainVulnerability(linkIndex) {
    return 1 + clamp(linkIndex, 0, CHAIN.maxLinks - 1) * CHAIN.vulnStep;
  }
  // interrupted while on link i: self-damage scales with how deep the chain was.
  function backfireDamage(baseDmg, linkIndex) {
    return baseDmg * CHAIN.backfireBase * (clamp(linkIndex, 0, CHAIN.maxLinks - 1) + 1);
  }
  // fresh state object for battle.js to carry on the active fighter.
  function chainState(skillIds) {
    return { chain: (skillIds || []).slice(0, CHAIN.maxLinks), link: 0, windup: 0, committed: false };
  }
  // advance after a link resolves cleanly; returns {done, link, refund}.
  function advanceChain(state) {
    if (!state) return { done: true, link: 0, refund: 0 };
    state.link += 1;
    state.windup = 0;
    const done = state.link >= Math.min(CHAIN.maxLinks, state.chain.length);
    return { done, link: state.link, refund: done ? CHAIN.finisherUltRefund : 0 };
  }

  // ==========================================================================
  // 5. SKILL LEARNING / LOADOUTS
  // ==========================================================================
  // Gates: native element, earned training, and rare explicit dual-element
  // breeds. No arbitrary elemental cycle or rarity-based off-element unlocks.
  const RARITY_ORDER = ['N', 'R', 'SR', 'SSR'];
  function rarityIdx(r) { return Math.max(0, RARITY_ORDER.indexOf(r)); }

  // DELIBERATELY CURATED SECONDARY BREEDS, not primary-element → next-element.
  // Only 6 fantasy-themed cats have a second element. The other 27—including
  // 蓝莓/lanbao, 雪团, 圆宝, all ordinary water cats—are single-element.
  // These are gameplay affinities, not claims about real-world cat breeds.
  const SPECIES_SECONDARY = Object.freeze({
    xianluo: 'light', // electric Siamese: bright-focus technique
    yinghua: 'grass', // cherry blossom / flowering greenery
    youling: 'light', // ghostly dusk / spectral glow
    jinwu: 'light',   // sun = flame + daylight
    yuelian: 'water', // moon / tidal mist
    xingchen: 'light' // starry dark sky / starlight
  });
  function secondaryOf(catOrId){
    const id=typeof catOrId==='string'?catOrId:catOrId?.species;
    const primary=elementOf(id);
    const secondary=SPECIES_SECONDARY[id]||null;
    return secondary&&secondary!==primary?secondary:null;
  }

  // Which species owns which signature ult (unlocked at max bond).
  const SIGNATURE_SKILL = {
    jinwu: 'sunflare', yuelian: 'moonlitHalo', xingchen: 'voidMaw',
    xianluo: 'thunderYowl', yinghua: 'moonlitHalo', senlin: 'sunbloom',
    youling: 'voidMaw', lanbao: 'tsunamiPaw',
  };

  function speciesOf(cat) {
    return (window.GameData && window.GameData.speciesById)
      ? window.GameData.speciesById(cat.species) : null;
  }

  // A dual-element cat has ONE primary school and exactly two curated side
  // techniques, not two complete skill libraries. The first secondary move is
  // an offensive discovery, the second a defensive/support complement (or a
  // different attack when none exists). Selection is stable by skill IDs and
  // costs no additional stored state or changes to the save schema.
  const SECONDARY_ATTACK_KINDS=new Set([
    'melee','projectile','dash','pounce','chain','beam','leap','aoe']);
  function secondaryChoices(cat) {
    const secondary=secondaryOf(cat);
    if(!secondary)return [];
    // Select the curated side pair from role-legal skills BEFORE applying the slot cap.
    // Otherwise Jinwu awakens the second choice while the first (illegal) choice occupies the only unlocked slot.
    const role=cat.buildType||buildTypeForBreed(cat);
    const native=SKILLS.filter(s=>s.element===secondary&&!s.unlock&&!s.ultCost&&roleAllowsSkill(role,s));
    const attacks=native.filter(s=>SECONDARY_ATTACK_KINDS.has(s.kind));
    const first=attacks.find(s=>!s.generic)||attacks[0]||null;
    const support=native.find(s=>(s.kind==='buff'||s.kind==='heal')&&!s.generic)
      ||native.find(s=>s.kind==='buff'||s.kind==='heal');
    const second=(support&&support.id!==first?.id?support:null)
      ||attacks.find(s=>s.id!==first?.id&&!s.generic)
      ||attacks.find(s=>s.id!==first?.id)||null;
    return [first,second].filter(Boolean);
  }
  function secondaryLimit(cat) {
    if(!secondaryOf(cat))return 0; // A single-element cat NEVER opens a secondary tree.
    const level=cat.level||1,bond=cat.affinity||0;
    if(!cat.skillAwakened&&level<4)return 0;
    // An intentional late-game support technique, never a second entire tree.
    return level>=12&&bond>=60?2:1;
  }
  // Role-exclusive tank training and actual breed-exclusive signatures remain
  // special exceptions. Other advanced skill gates belong to the cat's OWN
  // element (also prevents global quests awarding every cat fire/light ults).
  function gatedElementEligible(cat,s) {
    // An ELEMENT-NEUTRAL skill carries no element identity (e.g. 炸毛墙 reflect wall — a pure TANK
    // BUILD utility, owner: "反弹墙应该做成无属性的"). Its only gate is its build/role, so it's
    // element-eligible for ANY cat; the build gate (unlock.build) still restricts WHO can learn it.
    // This is what lets a FIRE tank like 圆宝 learn the wall (owner: "元宝怎么没有学反弹墙的地方") —
    // previously the wall was elec-tagged so gatedElementEligible rejected every non-elec tank.
    if (s.element==='neutral'||s.element==null) return true;
    // An elemental skill still needs the cat's own or curated-splash element (a tank build is NOT an
    // elemental license — a Water tank such as 蓝莓 still can't learn an electric-tagged skill).
    return s.element===elementOf(cat.species)||
      (s.unlock?.species?.includes(cat.species)&&
       (s.element===secondaryOf(cat)||s.id==='moonfang'));
  }

  // ==========================================================================
  // 5b. GATED SKILL-LEARNING (付费 / 等级 / 亲密 / 品种 / 领悟)
  // ==========================================================================
  // A skill may carry an `unlock` descriptor; skills without one stay innate and
  // follow the classic element/level rules below. An `unlock` can combine any of:
  //   cost:{coins?,fish?}  — pay at the trainer (deducted on learn)
  //   level: N                   — cat.level must be >= N
  //   affinity: N                — cat.affinity (亲密) must be >= N
  //   species: ['id',...]        — cat.species must be one of these (品种专属)
  //   quest: 'id'                — a quirky "领悟" condition (see QUEST_CHECKS)
  // A skill is LEARNABLE when every NON-cost gate is met (the player can afford
  // or not); it is EQUIPPABLE only once its id is in cat.learned. Pure non-cost
  // quest rewards auto-learn on completion; other free gates only reveal
  // trainer choices so a cat's move list does not suddenly balloon.

  // Quirky "领悟" conditions, keyed by unlock.quest. Each is a pure predicate over
  // the cat + global State — small by design, reusing counters that already tick.
  const QUEST_CHECKS = {
    // Win 10 battles while THIS cat was on the field (per-cat battlesWon counter,
    // incremented by game.js when a won squad includes the cat).
    battlesWon10: { need: 10, get: (cat) => cat.battlesWon || 0,
      label: { zh: '随它出战并累计胜利 {cur}/{need}', en: 'Win {cur}/{need} battles with this cat' } },
    // Collect 15 cats total (reuses State.S.catchCount).
    catchFifteen: { need: 15, get: () => (window.State && State.S && State.S.catchCount) || 0,
      label: { zh: '收服猫猫 {cur}/{need}', en: 'Capture {cur}/{need} cats' } },
    // Pet living cats 40 times (reuses State.S.petCount).
    pet40: { need: 40, get: () => (window.State && State.S && State.S.petCount) || 0,
      label: { zh: '撸猫互动 {cur}/{need}', en: 'Pet cats {cur}/{need} times' } },
  };
  function questProgress(id) {
    const q = QUEST_CHECKS[id];
    return q ? { cur: 0, need: q.need } : null;
  }
  // Is a quirky condition satisfied for this cat right now?
  function questMet(cat, id) {
    const q = QUEST_CHECKS[id];
    if (!q) return false;
    return q.get(cat) >= q.need;
  }

  // ---- ROLE × SKILL-CATEGORY GATE (owner-approved role identities 2026-11-22) ----
  // Each build-type may only learn skills whose CATEGORY fits its fantasy, so roles read as
  // distinct playstyles (a tank never backline-guns, a dps never locks down, etc.). Ults are
  // exempt (signature/ult always allowed). Verified by audit: every real cat keeps >=4 legal
  // native-element skills under this gate.
  function skillCategory(sk) {
    if (sk.ultCost > 0) return 'ult';
    const k = sk.kind;
    if (k === 'heal') return sk.healMode === 'single' ? 'heal-self' : 'heal-group';
    if (k === 'buff') return 'shield';
    if (k === 'melee' || k === 'dash' || k === 'leap' || k === 'pounce') return 'close';
    if (k === 'projectile' || k === 'beam' || k === 'aoe') return (sk.power >= 1.3) ? 'ranged-strong' : 'ranged-weak';
    return k;
  }
  // A DEDICATED control skill = its job is lockdown, not damage. Explicit tags:['control'], OR it
  // applies hard-CC (chill/bind/dizzy) WHILE being low-damage (power < 1.3). A high-power nuke that
  // merely chills on hit (e.g. 霜锥 frostLance power 1.6) is a DAMAGE skill, not control — otherwise
  // "dps can't learn control" would wrongly ban every damage skill with an incidental freeze.
  function isControlSkill(sk) {
    if ((sk.tags || []).includes('control')) return true;
    const t = sk.appliesTag, a = Array.isArray(t) ? t : [t];
    return a.some(x => ['chill', 'bind', 'dizzy'].includes(x)) && (sk.power || 0) < 1.3;
  }
  // Returns false if this role may NOT learn this skill. Mirror of the audited DENY policy.
  function roleAllowsSkill(role, sk) {
    if (!sk || sk.ultCost > 0) return true;          // ults/signatures exempt
    const u=sk.unlock;
    if(u?.build&&u.build!==role)return false;
    if(u?.role&&![].concat(u.role).includes(role))return false;
    // AUTHORED override: a skill may carry an explicit allow-list (e.g. 弹幕 barrage is a
    // suppression fan authored for dps+fighter) that wins over the category rules below — a
    // fighter's "no ranged" identity bends ONLY for the specific skills we opt in, nothing else.
    if (Array.isArray(sk.allowRoles)) return sk.allowRoles.includes(role);
    // Fire support has no weak innate ranged attack; retain its ordinary claw
    // as a legal starter, not access to high-power fire DPS skills.
    if(role==='support'&&sk.id==='emberClaw')return true;
    const c = skillCategory(sk);
    switch (role) {
      case 'tank':     return c !== 'ranged-weak' && c !== 'ranged-strong';            // wall: no backline guns
      case 'fighter':  return c !== 'heal-group' && c !== 'ranged-weak' && c !== 'ranged-strong'; // self-sustain duelist
      case 'dps':      return c !== 'heal-group' && c !== 'shield' && !isControlSkill(sk);        // pure damage, no lockdown
      case 'assassin': return c !== 'shield' && c !== 'heal-self' && c !== 'heal-group'
                           && sk.kind !== 'beam' && sk.kind !== 'aoe';                 // glass striker: thrown projectile pokes OK, no long-range beam/aoe guns, no safety tools
      case 'control':  return c !== 'heal-group' && c !== 'ranged-strong';             // lockdown; only weak ranged poke
      case 'support':  return c !== 'ranged-strong' && !(c === 'close' && sk.power >= 1.3) && !isControlSkill(sk);
      default:         return true;
    }
  }

  // Does the cat meet every NON-cost part of a skill's gate? (cost is paid, not met)
  function gateMet(cat, skill) {
    // ROLE × CATEGORY identity gate runs FIRST — it applies to EVERY skill (even ones with no
    // unlock block): a tank can't learn ranged, a dps can't learn control, etc.
    if (skill && !roleAllowsSkill(cat.buildType || buildTypeForBreed(cat), skill)) return false;
    const u = skill && skill.unlock;
    if (!u) return true;
    if (u.level && (cat.level || 1) < u.level) return false;
    // Element-locked spells do not auto-unlock for all six types.
    if (u.element && elementOf(cat.species)!==u.element) return false;
    if (u.affinity && (cat.affinity || 0) < u.affinity) return false;
    if (u.species && (!Array.isArray(u.species) || u.species.indexOf(cat.species) < 0)) return false;
    // The mirror wall is a TANK BUILD skill, not an electric-cat or breed
    // exclusive skill. Switching away from tank must revoke equipment use.
    if (u.build && (cat.buildType || buildTypeForBreed(cat)) !== u.build) return false;
    if (u.quest && !questMet(cat, u.quest)) return false;
    // ROLE gate: only cats whose current build-type (applied override OR breed default)
    // is in the list may learn it. Uses `cat.buildType || buildTypeForBreed(cat)` so an
    // explicit `applyBuild(cat,'tank')` on a non-tank breed unlocks the tank skills, same
    // as the legacy `u.build` branch above. (舔毛理顺 = support only; 守护 = tank+fighter;
    // 炸毛墙 = tank only — so a 收割 assassin can't learn any of them.)
    if (u.role) {
      const roles = Array.isArray(u.role) ? u.role : [u.role];
      if (roles.indexOf(cat.buildType || buildTypeForBreed(cat)) < 0) return false;
    }
    return true;
  }
  function hasLearned(cat, id) {
    return Array.isArray(cat.learned) && cat.learned.indexOf(id) >= 0;
  }
  function isGated(skill) { return !!(skill && skill.unlock); }

  // Can this gated skill be LEARNED now? (gate met AND not already learned)
  function canLearn(cat, skill) {
    return isGated(skill) && !hasLearned(cat, skill.id) &&
      gateMet(cat, skill) && gatedElementEligible(cat, skill);
  }
  // Only earned quest milestones are automatic. Level, affection, species and
  // build gates REVEAL trainer choices rather than quietly filling the book.
  // Do not delete pre-existing learned skills from older save games.
  function isAutoLearn(skill) {
    const u = skill && skill.unlock;
    if (!u || u.cost) return false;
    // Quest milestones are automatic.
    if (u.quest) return true;
    // Opt-in identity-gated auto-learn: a skill may declare `autoLearn:true` to
    // auto-grant when its level×element×role gate is satisfied (no cost, no quest).
    // Used for role-identity skills like 暗影触手 — if a cat meets Lv6 + dark +
    // control, the skill should appear in their book without a trainer visit.
    // Owner 2026-11-26: "为什么我没在夜夜身上看到" — 暗影触手 was unreachable because
    // isAutoLearn only honored quest unlocks; identity-gated skills stayed trainer-only.
    if (skill.autoLearn === true) return true;
    return false;
  }
  // Auto-grant any pure-gate skills the cat now qualifies for. Returns the list of
  // skills freshly learned (so the UI can toast / metric them). ensureLoadout and
  // the trainer both call this so autobattle only ever sees legal skills.
  function autoLearn(cat) {
    if (!cat) return [];
    if (!Array.isArray(cat.learned)) cat.learned = [];
    const fresh = [];
    for (const s of SKILLS) {
      if (isGated(s) && isAutoLearn(s) && gatedElementEligible(cat,s) &&
          !hasLearned(cat, s.id) && gateMet(cat, s)) {
        cat.learned.push(s.id);
        fresh.push(s);
      }
    }
    return fresh;
  }
  // Skills shown at the trainer: gated, not-yet-learned, grouped by whether their
  // non-cost gate is already met (ready to learn) or still locked.
  function trainerSkills(cat) {
    const ready = [], locked = [];
    for (const s of SKILLS) {
      if (!isGated(s) || hasLearned(cat, s.id) ||
          !gatedElementEligible(cat,s)) continue;
      // Do not show another build's exclusive equipment in the trainer.
      if(s.unlock?.build&&(cat.buildType||buildTypeForBreed(cat))!==s.unlock.build)
        continue;
      // Do not list skills the cat's ROLE×CATEGORY identity can never learn (e.g. an assassin
      // such as 焰焰 can never wield a beam like 横扫喷焰). Otherwise they'd fall into "locked"
      // while their ONLY visible unlock line (Lv.6 ✓) reads as satisfied — a contradictory
      // "condition met but still locked" entry. The real blocker (role) isn't a level/pay gate,
      // so hiding it mirrors the build-exclusive skip above. Switching build re-reveals it.
      if(!roleAllowsSkill(cat.buildType||buildTypeForBreed(cat), s)) continue;
      (gateMet(cat, s) ? ready : locked).push(s);
    }
    return { ready, locked };
  }

  // learnableSkills(cat) -> array of skill objects the cat is allowed to slot.
  function learnableSkills(cat) {
    const el = elementOf(cat.species);
    const splash = secondaryOf(cat);
    const lvl = cat.level || 1;
    const bond = cat.affinity || 0;
    const rIdx = rarityIdx((speciesOf(cat) || {}).rarity || cat.rarity || 'N');
    const tier = bondTier(bond);
    const sideChoices=secondaryChoices(cat).map(s=>s.id);
    const sideLimit=secondaryLimit(cat);
    // Natural 领悟: grant any pure-gate skills the cat now qualifies for before we
    // build the pool, so the auto-loadout immediately sees them.
    autoLearn(cat);
    const out = [];
    for (const s of SKILLS) {
      // GATED skills bypass the element rules entirely: they are equippable ONLY
      // when explicitly learned (via trainer or auto-领悟). This keeps powerful
      // skills out of the free pool until their condition is met + learned.
      if (isGated(s)) {
        // A remembered skill is NOT automatically legal after changing builds.
        // Re-check both legacy `unlock.build` AND the new `unlock.role` list at
        // equip time so a save that previously learned a tank-only skill cannot
        // suddenly equip it after a role swap (fighter cat with 'mirrorWall' in
        // learned must still be rejected).
        if (hasLearned(cat, s.id)&&gatedElementEligible(cat,s)&&
            roleAllowsSkill(cat.buildType||buildTypeForBreed(cat),s)&&
            (!s.unlock?.build||
             (cat.buildType||buildTypeForBreed(cat))===s.unlock.build)&&
            (!s.unlock?.role||
             (Array.isArray(s.unlock.role)?s.unlock.role:[s.unlock.role])
               .indexOf(cat.buildType||buildTypeForBreed(cat))>=0))out.push(s);
        continue;
      }
      const isUlt = s.ultCost > 0;
      const sig = SIGNATURE_SKILL[cat.species] === s.id;
      // Each cat discovers its OWN element gradually and can later branch to
      // ONE secondary element. Previously a high-level rare cat suddenly got
      // all six elemental libraries; that made every breed feel identical.
      // Old cross-element skills remain in saved history, but can no longer
      // equip on a breed without that element. The next ensureLoadout() repairs
      // active slots without deleting levels, learned IDs, XP, or currencies.
      const alreadyEquipped=(Array.isArray(cat.loadout)&&cat.loadout.includes(s.id))||
        (Array.isArray(cat.autoSkillLoadout)&&cat.autoSkillLoadout.includes(s.id));
      const elemOk=s.element===el||
        (s.element===splash&&!isUlt&&
         (sideChoices.slice(0,sideLimit).includes(s.id)||
          (cat.skillAwakened&&cat.awakenedSkill===s.id)));
      if(!elemOk)continue;
      // ROLE × CATEGORY GATE (owner 2026-11-26 bug: fire tank 元宝 was learning
      // ranged/beam/aoe/volley). The gated-skill branch above already role-checks,
      // but this NON-gated branch was skipping it entirely — a tank/fighter could
      // slot any native-element ranged/aoe. Apply roleAllowsSkill here too so the
      // identity gate matches the one in gateMet(). Ults are exempt (signature/ult
      // always allowed) to preserve 金乌焱/潮汐掌/etc on their native tank species.
      if(!isUlt&&
         !roleAllowsSkill(cat.buildType||buildTypeForBreed(cat),s))continue;
      const awakenedNative=cat.skillAwakened&&cat.awakenedSkill===s.id&&s.element===el;
      if(!isUlt&&!alreadyEquipped&&!awakenedNative){
        if(s.element===el){
          // The first STARTER ATTACK must be available regardless of where
          // utility/shield definitions appear in SKILLS. E.g. electric has
          // mirrorWall defined before staticPounce; previously Lv.1 electric
          // cats were left with no native Q skill.
          const native=SKILLS.filter(k=>k.element===el&&!k.unlock&&!k.ultCost);
          const role=cat.buildType||buildTypeForBreed(cat);
          // Ranking the attack pool must respect the role filter — otherwise a
          // doudou assassin ranks leafDart (projectile, role-forbidden) as rank
          // 0 and the first role-legal attack (thornCoil) gets ranked 2 and
          // locked until bond ≥ 55 (owner 2026-11-26: starter kittens went
          // learnable-empty after the role-gate fix).
          const attacking=native.filter(k=>
            ['melee','projectile','dash','pounce','chain','beam','leap','aoe'].includes(k.kind)
            &&roleAllowsSkill(role,k));
          if(['heal','buff'].includes(s.kind)){
            if(lvl<3&&bond<30)continue;
          }else{
            const rank=attacking.findIndex(k=>k.id===s.id);
            if(rank>=1){
              // One new attack per milestone, not every remaining native
              // attack on reaching Lv.7. Affection can advance ONE step.
              const threshold=rank===1?3:3+(rank-1)*3;
              const bondGate=[0,30,55,75,90,100][Math.min(rank,5)];
              if(lvl<threshold&&bond<bondGate)continue;
            }
          }
        }else{
          // Secondary selection and timing were already verified above.
          // Do NOT silently grant every splash buff and late-game attack.
          // Explicitly equipped old-save skills are grandfathered.
          if(!alreadyEquipped&&!sideChoices.slice(0,sideLimit).includes(s.id))
            continue;
        }
      }
      // An owned rare kitten needs to FEEL different right away, not at Lv.20.
      // N earns an ultimate by training; R earns it with some bonding; SR and
      // SSR arrive with one innate signature or elemental ultimate.
      if (isUlt) {
        const minLevel=[8,3,1,1][rIdx];
        const minBond=[40,20,0,0][rIdx];
        if(lvl<minLevel||bond<minBond)continue;
        if(sig && rIdx<2 && bond<40)continue;
      }
      // Non-ultimate signature helpers become available through bonding.
      if (sig && !isUlt && tier < 2 && rIdx < 2) continue;
      out.push(s);
    }
    // Hide obsolete generic mobility fillers when the element already has a
    // hand-authored pounce/leap. Existing equipped IDs are grandfathered until
    // the player re-equips them; nothing is removed from the lookup map.
    const retiredDash=new Set(['gen_water_dash','gen_grass_dash','gen_dark_dash','gen_light_dash']);
    // A learned tier-2 move supersedes its tier-1 counterpart in selection.
    // Keep the old ID resolvable for legacy save migration.
    const upgrades=new Set(out.filter(sk=>sk.upgradeOf).map(sk=>sk.upgradeOf));
    const equipped=new Set([...(cat.loadout||[]),...(cat.autoSkillLoadout||[])]);
    return out.filter(sk=>
      (!retiredDash.has(sk.id)||equipped.has(sk.id)) &&
      (!upgrades.has(sk.id)||equipped.has(sk.id)));
  }
  // Auto-equipment and manual equipment share the same strict role gate.
  // Explicit starter exceptions belong in roleAllowsSkill, not an off-role fallback.
  function roleFilterForAutoEquip(cat, pool) {
    const role = cat.buildType || buildTypeForBreed(cat);
    // The innate toy basic is always available. Never restore forbidden active skills.
    return pool.filter(sk => roleAllowsSkill(role, sk));
  }

  // BASIC-ELIGIBLE: a skill the player may slot as their LEFT-CLICK basic attack.
  // Owner 2026-11-26 lock: basic = light + spammable tier-1 only.
  // Rules:
  //   - melee / projectile kind only (no dash/pounce/chain/leap/aoe/beam)
  //   - power ≤ 1.60 (admits thornCoil 1.55 so grass fighter 枫枫 has a basic;
  //     keeps out frostLance 1.95, tidalBite 1.5 excluded by other filters)
  //   - no sk.heavy field (knockOff slam)
  //   - no sk.windup (fireballMeow precise-shot)
  //   - no sk.channel / pulseCount (continuous / multi-wave)
  //   - no ultCost
  //   - no unlock requirement (purchased or Lv-gated advanced skills shouldn't basic-spam)
  //   - no tag 'heavy' or 'precise' (frostLance precise+heavy tagged, tidalBite heavy tag)
  const BASIC_MAX_POWER = 1.60;
  function basicEligible(sk){
    if(!sk)return false;
    if(sk.kind!=='melee'&&sk.kind!=='projectile')return false;
    if((sk.ultCost||0)>0)return false;
    if(!((sk.power||0)>0)||(sk.power||0)>BASIC_MAX_POWER)return false;
    if(sk.heavy||sk.windup||sk.channel||sk.pulseCount||sk.unlock)return false;
    const tags=sk.tags||[];
    if(tags.includes('pulse')||tags.includes('heavy')||tags.includes('precise'))return false;
    return true;
  }
  // The pool of basic-eligible skills a given cat can actually equip (already-learned
  // / innate only — mirrors learnableSkills). UI reads this to populate the basic slot.
  //
  // Owner: 无法装备水鞭 (as basic). Root cause: learnableSkills HIDES a tier-1 move whose
  // tier-2 upgrade has been learned (e.g. waterLash hidden once frostClaw is learned). The
  // upgrade is intended for Q/E slots (power 1.6 for frostClaw), but it EXCEEDS the basic
  // power cap (1.35), so the cat ends up with ZERO water basic option even though the
  // innate tier-1 is perfectly basic-eligible. Fix: for the basic slot, add back any
  // upgrade-base that (a) is basic-eligible, (b) the cat qualifies for (by element), and
  // (c) whose tier-2 upgrade is NOT basic-eligible — so the player doesn't lose access to
  // an elemental basic just because they learned a heavier upgrade.
  function basicChoices(cat){
    const learnable=learnableSkills(cat);
    const direct=learnable.filter(basicEligible);
    if(typeof hasLearned!=='function'||!Array.isArray(SKILLS))return direct;
    const el=elementOf(cat.species);
    const splash=secondaryOf(cat);
    const haveId=new Set(direct.map(s=>s.id));
    for(const upgrade of learnable){
      if(!upgrade.upgradeOf)continue;
      if(basicEligible(upgrade))continue;    // upgrade itself qualifies — no need to rescue the base
      const base=skillById(upgrade.upgradeOf);
      if(!base||!basicEligible(base)||!roleAllowsSkill(cat.buildType||buildTypeForBreed(cat),base))continue;
      if(haveId.has(base.id))continue;
      if(base.element!==el&&base.element!==splash)continue;  // keep element discipline
      direct.push(base);
      haveId.add(base.id);
    }
    return direct;
  }

  // Slots have strict gameplay meaning: [basic, Q, E, ultimate].
  // Earlier builds filled the first four arbitrary skills and accidentally
  // put an ultimate in Q/E; every cat then appeared to have the same attacks.
  function defaultLoadout(cat){
    // Auto-equip respects the same role identity gate as manual learning and
    // equipping; native ultimates retain their existing exemption.
    const rawPool=learnableSkills(cat);
    const ultsPool=rawPool.filter(sk=>sk.ultCost>0);
    const pool=roleFilterForAutoEquip(cat, rawPool.filter(sk=>!(sk.ultCost>0))).concat(ultsPool);
    const own=pool.filter(sk=>sk.element===elementOf(cat.species)&&!sk.ultCost);
    const splash=pool.filter(sk=>sk.element===secondaryOf(cat.species)&&!sk.ultCost);
    const attackKinds=['melee','projectile','dash','leap','pounce'];
    const isAttack=sk=>['melee','projectile','dash','leap','pounce','chain','aoe'].includes(sk.kind);
    // Slot 0 (left-click BASIC) is the innate cat-toy toss (小鱼干/毛线团) — it is NOT
    // a chosen skill, so it stays null. This stops a real skill from being duplicated
    // into both the basic slot AND Q. Q/E/ult are the three skills the player equips.
    const basic=null;
    // Q = the primary attack. A BACKLINE role (dps/control/support) prefers a RANGED attack
    // (projectile/beam/chain/aoe) so it fights at distance — without this a dps whose element lists a
    // dash first (e.g. elec 疯跑冲刺) got a melee gap-closer as its main attack and stood too close
    // (owner: "露露站太近"). Frontline roles keep the original first-attack pick (they want melee).
    const role=cat.buildType||buildTypeForBreed(cat);
    const backline=role==='dps'||role==='control'||role==='support';
    const rangedKind=sk=>['projectile','beam','chain','aoe'].includes(sk.kind);
    const q=(['control','dps'].includes(role)?own.find(sk=>sk.allowRoles?.length===1&&sk.allowRoles[0]===role):null)
      ||(backline?(own.find(rangedKind)||pool.find(rangedKind)):null)
      ||own.find(sk=>attackKinds.includes(sk.kind))
      ||pool.find(sk=>attackKinds.includes(sk.kind))||null;
    // E is the DEFENSIVE / utility slot so the shield + heal verbs are actually
    // visible in play. Prefer a shield the cat knows, then a heal, then a buff;
    // only fall back to a splash attack when the cat has no defensive option.
    const isShield=sk=>sk.kind==='buff'&&(sk.shieldType||(sk.tags||[]).includes('shield'));
    const e=own.find(sk=>isShield(sk)&&sk!==basic&&sk!==q)
      ||own.find(sk=>sk.kind==='heal'&&sk!==basic&&sk!==q)
      ||own.find(sk=>['buff','heal'].includes(sk.kind)&&sk!==basic&&sk!==q)
      ||own.find(sk=>sk!==basic&&sk!==q)
      // A true dual breed MAY slot a side skill; it never displaces an
      // available primary move in the default recommendations.
      ||splash.find(sk=>sk.kind==='buff'||sk.kind==='heal')
      ||splash.find(sk=>sk!==q&&sk!==basic)||null;
    const starterE=(cat.level||1)<3&&!cat.skillAwakened&&
      !(Array.isArray(cat.loadout)&&cat.loadout[2])?null:e;
    const ult=pool.find(sk=>sk.ultCost>0&&SIGNATURE_SKILL[cat.species]===sk.id)
      ||pool.find(sk=>sk.ultCost>0&&sk.element===elementOf(cat.species))
      ||pool.find(sk=>sk.ultCost>0)||null;
    return [basic?.id||null,q?.id||null,starterE?.id||null,ult?.id||null];
  }

  // Keep valid player-chosen equipment; backfill new unlocks and safely migrate
  // legacy 2/3-slot saves without erasing the rest of the user's progress.
  function ensureLoadout(cat){
    // V4 §8 Q1 C2 one-shot migration (owner-locked 2026-11-25): jinjc 金豆
    // migrated from 光 → 电. A legacy save still has light-only skills equipped
    // on the loadout. Strip them ONCE per save (stamp on State.S) so the next
    // ensureLoadout pass can slot in proper elec skills via defaults. Learned[]
    // untouched per §8 Q1 ("entries stay, non-equippable").
    if (cat.species === 'jinjc' && Array.isArray(cat.loadout)) {
      const S = window.State && State.S;
      if (S && !S._jinjcMigratedAt) {
        for (let i = 0; i < cat.loadout.length; i++) {
          const id = cat.loadout[i]; if (!id) continue;
          const sk = skillById(id);
          if (sk && sk.element === 'light') cat.loadout[i] = null;
        }
        cat.autoSkillLoadout = null;  // force re-default for proper elec kit
        S._jinjcMigratedAt = (window.State && State.todayKey) ? State.todayKey() : 'migrated';
      }
    }
    // Promote saved tier-1 IDs to learned upgrades before calculating legal
    // choices; never wipe custom equipment or break legacy IDs in save files.
    const current=Array.isArray(cat.loadout)?cat.loadout.slice():[];
    const learned=new Set(Array.isArray(cat.learned)?cat.learned:[]);
    // Owner 2026-11-26 "水鞭为什么不能成为普攻技能了": basic slot (idx 0) must NOT
    // auto-promote a basic-eligible tier-1 to its tier-2 if the tier-2 exceeds the
    // basic power cap — that would strip the player's chosen basic to the innate
    // toy toss. Only slots 1-2 (Q/E) auto-upgrade; slot 0 only upgrades if the
    // upgrade is also basic-eligible.
    for(let i=0;i<current.length;i++){
      const next=upgradeTargetOf(current[i]);
      if(next&&learned.has(next)){
        if(i===0){
          const upSk=skillById(next);
          if(!upSk||!basicEligible(upSk))continue;   // keep tier-1 as basic
        }
        current[i]=next;
      }
    }
    if(Array.isArray(cat.loadout)&&current.some((id,i)=>id!==cat.loadout[i])){
      cat.loadout=current.slice();
    }
    const available=new Set(learnableSkills(cat).map(sk=>sk.id));
    // Basic-slot rescue: basicChoices may expose an upgrade-base that learnableSkills hides
    // (because the tier-2 is learned but exceeds BASIC_MAX_POWER). Register those IDs so the
    // slot-0 sanitizer doesn't strip them. Non-basic slots keep the stricter gate.
    for(const sk of basicChoices(cat))available.add(sk.id);
    const defaults=defaultLoadout(cat);
    // Auto-created equipment upgrades itself when a new level/bond gate opens.
    // An explicitly edited loadout is left alone and only repairs illegal slots.
    const lastAuto=Array.isArray(cat.autoSkillLoadout)?cat.autoSkillLoadout:[];
    const unchanged=lastAuto.length===4&&current.length===4
      &&current.every((sk,i)=>sk===lastAuto[i]);
    if(!cat.skillEdited&&(!current.length||unchanged)){
      cat.loadout=defaults.slice();
      cat.autoSkillLoadout=defaults.slice();
      return cat.loadout;
    }
    const next=Array.from({length:4},(_,idx)=>{
      const id=current[idx],sk=id?skillById(id):null;
      // Slot 0 (basic): null (=innate toy toss) is valid, else must be basic-eligible.
      if(idx===0){
        if(id==null)return null;
        return (sk&&basicEligible(sk)&&available.has(id))?id:defaults[0];
      }
      const legal=idx===3?sk&&sk.ultCost>0:sk&&sk.ultCost===0;
      return legal&&available.has(id)?id:defaults[idx];
    });
    if(JSON.stringify(current)!==JSON.stringify(next))cat.loadout=next;
    return cat.loadout||next;
  }

  // ==========================================================================
  // 4c. BUILD TYPES (按品种 + 流派自动配装) — DotA/LoL role taxonomy, cat-flavored
  // ==========================================================================
  // Six roles, each a lens on what the Q/E slots should prioritise. A build does
  // NOT invent skills the cat can't learn — it re-ranks the cat's OWN learnable
  // pool toward a playstyle, then fills Q/E/ult with the best fit. The ult slot
  // stays the cat's element/ signature ult regardless of build (that's identity).
  //   tank     坦克 — survive + peel: shield/heal first, then a sticky melee
  //   fighter  斗士 — bruiser: heavy melee + a gap-closer, self-buff tiebreak
  //   dps      输出 — sustained ranged: projectile/beam poke, kite-friendly
  //   assassin 收割 — burst: biggest single-hit melee/dash/pounce, expose/bleed
  //   control  控制 — lockdown: bind/dizzy/blind/chill appliers, field/leap CC
  //   support  辅助 — enable team: heal + buff first, safe ranged poke second
  const BUILD_TYPES = {
    tank:     { zh: '坦克', en: 'Tank',     icon: '🛡️' },
    fighter:  { zh: '斗士', en: 'Fighter',  icon: '⚔️' },
    dps:      { zh: '输出', en: 'DPS',      icon: '🎯' },
    assassin: { zh: '收割', en: 'Assassin', icon: '🗡️' },
    control:  { zh: '控制', en: 'Control',  icon: '🌀' },
    support:  { zh: '辅助', en: 'Support',  icon: '💚' },
  };
  const BUILD_ORDER = ['tank','fighter','dps','assassin','control','support'];
  // CC tags a skill can apply (used to score the control build + as a tiebreak).
  const CC_TAGS = ['bind','dizzy','blind','chill','expose','weaken'];
  function skillCCScore(sk){
    const t=[].concat(sk.appliesTag||[], sk.tags||[]);
    return CC_TAGS.reduce((n,c)=>n+(t.includes(c)?1:0),0);
  }
  function isShieldSkill(sk){ return sk.kind==='buff'&&(sk.shieldType||(sk.tags||[]).includes('shield')); }
  // Per-role score for a single (non-ult) skill. Higher = better fit for the role.
  function buildScore(role, sk){
    if(!sk||sk.ultCost>0)return -1;
    const k=sk.kind, p=sk.power||0, cc=skillCCScore(sk), heavy=!!sk.heavy;
    const ranged=['projectile','beam','chain'].includes(k);
    const melee=['melee','dash','pounce','leap'].includes(k);
    switch(role){
      case 'tank':     return (isShieldSkill(sk)?6:0)+(k==='heal'?4:0)+(melee&&!heavy?2:0)+cc*1.2;
      case 'fighter':  return (melee?4:0)+(heavy?2.5:0)+p*1.6+(k==='dash'||k==='pounce'?1.5:0)+(sk.tags?.includes('buff')?1:0);
      case 'dps':      return (ranged?4:0)+p*1.8+(k==='beam'?1.5:0)-(heavy?1:0)-(isShieldSkill(sk)?3:0);
      case 'assassin': return (melee?3:0)+(k==='dash'||k==='pounce'||k==='leap'?2.5:0)+p*2.2+(heavy?2:0)+(cc?0.8:0)-(isShieldSkill(sk)||k==='heal'?4:0);
      case 'control':  return cc*3+(k==='leap'||sk.field?2:0)+(ranged?1:0)+(isShieldSkill(sk)?1:0)+p*0.4;
      case 'support':  return (k==='heal'?6:0)+(isShieldSkill(sk)?4:0)+((sk.tags||[]).includes('buff')?4:0)+(ranged?1.5:0)-(heavy?1:0);
    }
    return 0;
  }
  // Recommend a build from a breed's PRIMARY × SECONDARY stat — a deterministic
  // matrix, NOT weighted magic numbers (the old weight-salad collapsed ~60% of breeds
  // into tank/support and made dps/control unreachable). Each stat "owns" roles:
  //   POW → fighter(+vit) / assassin(+agi)   VIT → tank
  //   AGI → dps(+pow) / assassin(+pow)        CHA → support(+vit) / control(+agi)
  // The runner-up stat breaks ties so the full 6-role spread is reachable and every
  // breed's identity reads from its own numbers. Deterministic (no RNG).
  function buildTypeForBreed(cat){
    const sp=speciesOf(cat), b=(sp&&sp.base)||{pow:6,agi:6,vit:6,cha:6};
    // Authored breed roles take priority over statistical inference.
    // This allows fluffy Maine Coons to tank and stocky orange cats to fight,
    // without changing saved, explicitly selected buildType values.
    // Authored roles (identity beats stat-inference). Owner-approved role rebalance 2026-11-22:
    // 汤圆橘猫=tank, 芝士起司橘=fighter(stocky bruiser), 松松缅因=fighter(pow13 frontline, not wall),
    // 圆宝加菲=tank, 幽幽紫雾=dps, 夜夜孟买=control, 绅绅燕尾服=fighter — to break up the all-assassin
    // dark element and give each element a varied role spread. (蓝莓/豆豆/杏仁 reach their new roles
    // via base-stat tweaks in data.js, so they are NOT listed here.)
    const BREED_ROLES={tangyuan:'tank',qisi:'fighter',senlin:'fighter',jiafei:'tank',
      youling:'dps',mengmai:'control',xingchen:'control',lixiao:'fighter',meidu:'control', // 星星: SSR spatial-control identity
      sanhua:'fighter'};   // v2: light needs ONE frontline (support×5/control×1/dps×1 had zero); 三花 7/7/7/9 balanced → bruiser
    if(BREED_ROLES[cat.species])return BREED_ROLES[cat.species];
    // rank the four stats; primary = biggest, secondary = next (ties: pow>agi>vit>cha)
    const order=['pow','agi','vit','cha'];
    const ranked=order.slice().sort((a,b2)=> (b[b2]-b[a]) || (order.indexOf(a)-order.indexOf(b2)));
    const p=ranked[0], s=ranked[1];
    const MATRIX={
      pow:{ agi:'assassin', vit:'fighter', cha:'fighter', pow:'fighter' },
      agi:{ pow:'assassin', vit:'dps',      cha:'dps',      agi:'dps' },
      vit:{ pow:'tank',     agi:'tank',     cha:'tank',     vit:'tank' },
      cha:{ agi:'control',  pow:'support',  vit:'support',  cha:'support' },
    };
    // Close VIT/POW breeds are bruisers rather than static frontline walls.
    // This shifts high-attack Norwegian and American Shorthair to fighter,
    // leaving low-POW VIT cats as tanks and preserving every saved explicit BD.
    if(p==='vit'&&b.pow>=7&&b.agi>=7&&b.vit-b.pow<=2)return 'fighter';
    return (MATRIX[p] && MATRIX[p][s]) || 'fighter';
  }
  // ---- ENEMY / WILD-CAT KIT (shared gate with players) -------------------------------
  // A wild cat fights with the SAME skills.js library and the SAME role×category gate as a
  // player cat — no parallel enemy-only skill table. Given a species + level, return the set of
  // skills this breed could LEGALLY use (its element + splash element, role-gated, NO ults in the
  // normal rotation), plus the breed's build role and a chosen primary offensive skill + a legal
  // ward (only if the role may shield). This is the single source of truth battle.js reads so
  // 桃桃(elec SR) can never wield the 雷鸣啸 ult as a normal attack and 露露(暹罗 dps/control) can
  // never open the tank-only 炸毛墙 reflect wall — exactly the gates the player is held to.
  function enemyKitFor(speciesId, level){
    const pseudo={ species: speciesId, level: level||1, affinity: 50 };
    const role=buildTypeForBreed(pseudo);
    const own=elementOf(speciesId), splash=secondaryOf(speciesId);
    // Element pool: own + splash element skills, LEVEL/ELEMENT/ROLE gated via the player gate.
    // Ults are excluded from the normal rotation (enemy ults, if ever added, must charge — see spec).
    const legal=SKILLS.filter(sk=>
      (sk.element===own||sk.element===splash) &&
      (sk.ultCost||0)===0 &&
      gateMet(pseudo, sk));
    const atk=k=>['melee','projectile','beam','chain','dash','pounce','leap','aoe'].includes(k);
    const ranged=k=>['projectile','beam','chain','aoe'].includes(k);
    const attacks=legal.filter(sk=>atk(sk.kind));
    // Primary offensive skill: the enemy delivers it as a telegraphed barrage/nova (ranged darts),
    // so prefer a RANGED own-element skill (matches the delivery), then any ranged, then own-element
    // melee, then any attack. Falls back to null (battle.js then uses its generic dart barrage with
    // the enemy's element — still gate-clean, never an ult).
    const primary=
      attacks.find(sk=>sk.element===own&&ranged(sk.kind))||
      attacks.find(sk=>ranged(sk.kind))||
      attacks.find(sk=>sk.element===own)||
      attacks[0]||null;
    // Ward (shield/reflect/protect) ONLY if the breed's role may legally learn a shield. This is
    // the SAME roleAllowsSkill test the player uses — a dps/control/assassin wild cat gets none.
    const wardOk=sk=>sk&&roleAllowsSkill(role,{kind:'buff',shieldType:sk,tags:['shield']});
    // Signature ULT for this breed's element — surfaced so a tough wild cat can CHARGE and fire it
    // ONCE as a telegraphed heavy (battle.js gates charge on rarity + reduces power). Prefer a
    // breed-locked signature, else the element's generic ult. NOT in the normal rotation (above).
    // A wild cat's charged ult must be an OFFENSIVE one — skip healUlt (team-heal) skills like
    // 月华环, which make no sense as an enemy nuke (and whose power:0 would fall back to a generic
    // burst). A light wild cat with only a heal ult simply charges no ult (battle.js gates on e.ultSkill).
    const ult=SKILLS.find(sk=>sk.ultCost>0 && !sk.healUlt && SIGNATURE_SKILL[speciesId]===sk.id && (!sk.unlock?.species||sk.unlock.species.includes(speciesId)))
      ||SKILLS.find(sk=>sk.ultCost>0 && !sk.healUlt && sk.element===own && (!sk.unlock?.species||sk.unlock.species.includes(speciesId)))
      ||null;
    // ROTATION: up to 2 DISTINCT real skills the wild cat casts on cooldown, mirroring a player's Q/E
    // (battle.js delivers each BY ITS OWN KIND — a beam as a beam, aoe as a lob, melee as a lunge —
    // instead of only ever reshaping `primary` into a generic barrage/nova). Prefer primary + one more
    // of a DIFFERENT kind so the wild cat shows two real moves, not two identical pokes. Ults excluded
    // (they remain the separate charged event). Fixes owner: "敌人全程还是在发射 projectile，没有使用我们的技能".
    // Prefer HAND-AUTHORED signature skills over generic templates so a wild cat shows its breed's
    // real moves (咳毛球/烈焰罩/彗星爪), not a generic barrage. Lead with an authored own-element
    // attack; add a second of a DIFFERENT kind (also authored-first) for variety.
    const authored = attacks.filter(sk => !sk.generic);
    const rotLead = (['control','dps'].includes(role)?authored.find(sk=>sk.element===own&&sk.allowRoles?.length===1&&sk.allowRoles[0]===role):null)
      ||authored.find(sk => sk.element === own) || authored[0] || primary;
    const rotation = [];
    if (rotLead) rotation.push(rotLead);
    const second = authored.find(sk => sk.id !== (rotLead && rotLead.id) && sk.kind !== (rotLead && rotLead.kind))
                || attacks.find(sk => sk.id !== (rotLead && rotLead.id) && sk.kind !== (rotLead && rotLead.kind))
                || attacks.find(sk => sk.id !== (rotLead && rotLead.id));
    if (second) rotation.push(second);
    return {
      role, element: own,
      skills: legal,
      attacks,
      primary,
      rotation,                                                    // real Q/E-style skills cast on cooldown by kind
      ult,                                                         // element signature ult (charged event, reduced power)
      // which ward verbs this breed may cast (battle.js enemyMaybeWard consults this)
      canReflect: role==='tank',                                   // mirrorWall 炸毛墙 is tank-only
      canShield: wardOk('barrier'),                                // barrier/protect: tank/support/fighter-small
    };
  }

  // Build a [basic,Q,E,ult] loadout for a role from the cat's learnable pool.
  // Basic stays the innate toy toss (null). Ult stays the cat's element/signature
  // ult. Q/E are the two highest-scoring distinct non-ult skills for the role,
  // with a guaranteed defensive E for tank/support when one is available.
  function recommendLoadout(cat, role){
    role=BUILD_TYPES[role]?role:buildTypeForBreed(cat);
    const own=elementOf(cat.species);
    const splash=secondaryOf(cat);
    // Auto-recommend respects the role identity gate.
    const allUnlocked=roleFilterForAutoEquip(cat,(learnableSkills(cat)||[]).filter(sk=>sk.ultCost===0));
    const unlockedIds=new Set(allUnlocked.map(sk=>sk.id));
    const pool=allUnlocked.filter(sk=>!upgradeTargetOf(sk.id)||
      !unlockedIds.has(upgradeTargetOf(sk.id)));
    // Role must dominate the recommendation: the old +6 same-element bonus
    // outweighed most tank / DPS / control distinctions, producing nearly
    // identical Q/E kits for different builds. Prefer own-element skills only
    // as a moderate tie-breaker, never at the expense of the selected role.
    // Only skills the cat has actually unlocked are eligible.
    const OWN_BONUS=3, SPLASH_PENALTY=2;
    // ELEMENT-NEUTRAL skills (e.g. 炸毛墙 reflect wall) carry no element identity — they're build
    // utilities, so they get the SAME treatment as an own-element skill (no cross-element penalty).
    // Without this a neutral tank-signature wall scored −6 and lost auto-equip to a generic
    // same-element shield on, e.g., an elec tank (owner wanted the wall element-free, not demoted).
    const elemAdj=sk=>(sk.element===own||sk.element==='neutral'||sk.element==null)?OWN_BONUS:
      sk.element===splash?-SPLASH_PENALTY:-6;
    const scored=pool.map(sk=>({sk,s:buildScore(role,sk)+elemAdj(sk)}))
      .filter(x=>x.s>-99).sort((a,b)=>b.s-a.s).map(x=>x.sk);
    // Role-constrained Q/E composition, not just two high-scoring neighbors:
    // each build needs a recognisable active combat loop, with a sensible
    // fallback only when the cat has not yet unlocked that skill type.
    const attack=sk=>sk&&['melee','projectile','beam','chain','dash','pounce','leap','aoe'].includes(sk.kind);
    const ranged=sk=>sk&&['projectile','beam','chain'].includes(sk.kind);
    const melee=sk=>sk&&['melee','dash','pounce','leap'].includes(sk.kind);
    const cc=sk=>sk&&(skillCCScore(sk)>0||sk.tags?.includes('stagger'));
    const pick=(predicate,except)=>scored.find(sk=>sk!==except&&predicate(sk))||null;
    let q=null,e=null;
    if(role==='tank'){
      q=pick(sk=>isShieldSkill(sk))||pick(sk=>sk.kind==='heal');
      e=pick(attack,q)||pick(sk=>sk.kind==='buff',q);
    }else if(role==='support'){
      q=pick(sk=>sk.kind==='heal')||pick(isShieldSkill);
      e=pick(attack,q)||pick(sk=>sk.kind==='buff',q);
    }else if(role==='dps'){
      q=pick(sk=>sk.allowRoles?.length===1&&sk.allowRoles[0]==='dps'&&attack(sk))||pick(ranged)||pick(attack);
      e=pick(sk=>attack(sk)&&sk.kind!==q?.kind,q)||pick(attack,q);
    }else if(role==='assassin'){
      // Assassin should prioritize a genuine gap closer over fighter's
      // sustained melee/leap choice when both are unlocked.
      q=pick(sk=>['dash','pounce'].includes(sk.kind))||
        pick(sk=>melee(sk)&&sk.heavy)||pick(melee);
      e=pick(sk=>cc(sk)&&attack(sk),q)||pick(attack,q);
    }else if(role==='control'){
      q=pick(sk=>sk.allowRoles?.length===1&&sk.allowRoles[0]==='control'&&attack(sk))||pick(cc)||pick(attack);
      e=pick(sk=>attack(sk)&&sk!==q,q)||pick(isShieldSkill,q);
    }else {
      q=pick(melee)||pick(attack);
      e=pick(sk=>attack(sk)&&sk!==q,q)||pick(sk=>sk.kind==='buff',q);
    }
    q=q||scored[0]||null;
    e=e||scored.find(sk=>sk!==q)||null;
    const full=defaultLoadout(cat);                 // reuse its ult-slot resolution (own-element ult)
    return [null, q?.id||full[1]||null, e?.id||full[2]||null, full[3]||null];
  }
  // Apply a recommended build to the cat (marks it edited so growth won't override).
  function applyBuild(cat, role){
    // Set the build FIRST; build-specific eligibility must be evaluated
    // against the selected role, not the previously equipped role.
    cat.buildType=BUILD_TYPES[role]?role:buildTypeForBreed(cat);
    const next=recommendLoadout(cat,cat.buildType);
    cat.loadout=next.slice();
    cat.autoSkillLoadout=next.slice();
    cat.skillEdited=true;                            // respect the player's explicit choice
    return cat.loadout;
  }

  // One intentional discovery moment after the first successful capture.
  // Existing custom equipment is respected; new players get the fresh skill
  // automatically in the E slot. This returns the actual unlocked ability.
  function awakenFirstSkill(cat){
    if(!cat||cat.skillAwakened)return null;
    const previous=ensureLoadout(cat).slice();
    const prevDefault=defaultLoadout(cat);
    const known=new Set(learnableSkills(cat).map(sk=>sk.id));
    cat.skillAwakened=true;
    const secondary=secondaryOf(cat);
    const candidates=(secondary
      ?secondaryChoices(cat).filter(sk=>!known.has(sk.id))
      :SKILLS.filter(sk=>sk.element===elementOf(cat.species)&&
         !sk.unlock&&!sk.ultCost&&!known.has(sk.id)))
      .filter(sk=>roleAllowsSkill(cat.buildType||buildTypeForBreed(cat),sk));
    const selected=candidates.find(sk=>SECONDARY_ATTACK_KINDS.has(sk.kind))
      ||candidates.find(sk=>sk.kind==='buff'||sk.kind==='heal')
      ||candidates[0]||null;
    if(selected)cat.awakenedSkill=selected.id;
    if(!cat.skillEdited&&(previous[2]===prevDefault[2]||previous[2]==null)){
      cat.loadout=previous;
      if(selected)cat.loadout[2]=selected.id;
      cat.autoSkillLoadout=cat.loadout.slice();
    }
    return selected;
  }

  // learnSkill(cat, skillId) — attempt to learn a gated skill. PURE on the skills
  // side except it mutates cat.learned and the global currency wallet (the game's
  // single source of truth). Returns {ok, reason?, via}. The UI handles save/toast/
  // metric. `via` tags HOW it was learned for analytics: 'cost' | gate name.
  function learnSkill(cat, skillId) {
    const sk = skillById(skillId);
    if (!sk || !isGated(sk)) return { ok: false, reason: 'notLearnable' };
    if (hasLearned(cat, skillId)) return { ok: false, reason: 'already' };
    if (!gateMet(cat, sk)||!gatedElementEligible(cat,sk))
      return { ok: false, reason: 'locked' };
    const cost = sk.unlock.cost;
    if (cost) {
      const S = window.State && State.S;
      if (!S) return { ok: false, reason: 'noState' };
      // Only 🪙 coins + 🐠 fish costs exist now (yarn costs were converted to coins).
      if ((cost.coins || 0) > (S.coins || 0)) return { ok: false, reason: 'coins' };
      if ((cost.fish || 0) > (S.fish || 0)) return { ok: false, reason: 'fish' };
      if (cost.coins) S.coins -= cost.coins;
      if (cost.fish) S.fish -= cost.fish;
    }
    if (!Array.isArray(cat.learned)) cat.learned = [];
    cat.learned.push(skillId);
    const via = cost ? 'cost' : (sk.unlock.quest ? 'quest'
      : sk.unlock.species ? 'species' : sk.unlock.affinity ? 'affinity' : 'level');
    return { ok: true, via };
  }

  function progressionHint(cat){
    const sp=speciesOf(cat),rare=rarityIdx(sp?.rarity||'N');
    const lv=cat.level||1,bond=cat.affinity||0;
    const en=window.MorrowwishI18n?.get?.()!=='zh';
    if(rare===0&&!cat.skillAwakened&&lv<4&&bond<40)
      return secondaryOf(cat)
        ?(en?'First capture unlocks one secondary-element move':'首次收服伙伴解锁一招副属性技能')
        :(en?'First capture awakens another native-element move':'首次收服伙伴领悟另一招本系技能');
    if(rare===0&&(lv<8||bond<40))
      return en?'Next: Lv.8 + affection 40 to unlock an elemental ultimate'
        :'下一阶段：Lv.8 + 好感40 → 元素必杀技';
    if(rare===1&&(lv<3||bond<20))
      return en?'Next: Lv.3 + affection 20 to unlock an elemental ultimate'
        :'下一阶段：Lv.3 + 好感20 → 元素必杀技';
    if(lv<12)
      return en?'Learn more attacks one at a time; advanced moves are at the trainer'
        :'攻击技能逐级学会；高阶招式需到训练师处主动学习';
    return secondaryOf(cat)
      ?(en?'Develop primary moves; study up to two secondary techniques':'主属性为核心；副属性最多两招，高阶技能到训练师学习')
      :(en?'Develop your native-element skills at the trainer':'专精本系技能，高阶招式到训练师处学习');
  }

  // ==========================================================================
  // 6. BOND (纽带 / affinity 0..100) SCALING — qualitative unlocks
  // ==========================================================================
  // Tiers are breakpoints; each tier adds new verbs, not just +stat.
  function bondTier(affinity) {
    const a = clamp(affinity || 0, 0, 100);
    if (a >= 100) return 5;
    if (a >= 80) return 4;
    if (a >= 60) return 3;
    if (a >= 40) return 2;
    if (a >= 20) return 1;
    return 0;
  }
  // bondBonuses(tier) -> qualitative + quantitative perks.
  //  0 陌生 / 1 熟悉 / 2 信赖 / 3 默契 / 4 羁绊 / 5 生死与共
  const BOND_BONUSES = [
    { tier: 0, name: '陌生',     dmgMult: 1.00, cdReduction: 1.00, extraGambitSlots: 0, reviveOnce: false, unlockSignature: false },
    { tier: 1, name: '熟悉',     dmgMult: 1.05, cdReduction: 0.96, extraGambitSlots: 0, reviveOnce: false, unlockSignature: false },
    { tier: 2, name: '信赖',     dmgMult: 1.12, cdReduction: 0.92, extraGambitSlots: 1, reviveOnce: false, unlockSignature: false },
    { tier: 3, name: '默契',     dmgMult: 1.20, cdReduction: 0.88, extraGambitSlots: 1, reviveOnce: false, unlockSignature: false },
    { tier: 4, name: '羁绊',     dmgMult: 1.30, cdReduction: 0.84, extraGambitSlots: 2, reviveOnce: true,  unlockSignature: false },
    { tier: 5, name: '生死与共', dmgMult: 1.45, cdReduction: 0.80, extraGambitSlots: 3, reviveOnce: true,  unlockSignature: true },
  ];
  function bondBonuses(tier) { return BOND_BONUSES[clamp(tier, 0, 5)]; }

  // ==========================================================================
  // 7. EVOLUTION CHAINS
  // ==========================================================================
  // {evolvesTo, req:{level?,bond?,item?}}. Pure data; integrator swaps species.
  const EVOLUTION = {
    tangyuan: { evolvesTo: 'senlin',  req: { level: 16, bond: 40 } },               // 橘猫 -> 缅因巨猫
    doudou:   { evolvesTo: 'youling', req: { level: 18, bond: 50, item: '夜影石' } },// 狸花 -> 幽灵
    lanbao:   { evolvesTo: 'yuelian', req: { level: 22, bond: 80, item: '月华露' } },// 蓝猫 -> 月莲
    xianluo:  { evolvesTo: 'jinwu',   req: { level: 24, bond: 80, item: '赤焰晶' } },// 暹罗 -> 金乌
    xiaohui:  { evolvesTo: 'dundun',  req: { level: 10, bond: 20 } },               // 小灰 -> 墩墩
    yunduo:   { evolvesTo: 'yuelian', req: { level: 20, bond: 70 } },               // 云朵 -> 月莲
  };
  function evolutionOf(speciesId) { return EVOLUTION[speciesId] || null; }
  // canEvolve(cat) -> bool (item requirement reported but NOT auto-consumed here;
  // integrator checks inventory. We treat missing item as "needs item" -> false
  // unless cat.items includes it).
  function canEvolve(cat) {
    const evo = EVOLUTION[cat.species];
    if (!evo) return false;
    const r = evo.req || {};
    if (r.level && (cat.level || 1) < r.level) return false;
    if (r.bond && (cat.affinity || 0) < r.bond) return false;
    if (r.item) {
      const inv = cat.items || (window.GameState && window.GameState.items) || [];
      if (!Array.isArray(inv) || !inv.includes(r.item)) return false;
    }
    return true;
  }
  // evolveResult(cat) -> {to, toSpecies, req} or null. No mutation.
  function evolveResult(cat) {
    const evo = EVOLUTION[cat.species];
    if (!evo) return null;
    const toSpecies = (window.GameData && window.GameData.speciesById)
      ? window.GameData.speciesById(evo.evolvesTo) : null;
    return { to: evo.evolvesTo, toSpecies, req: evo.req || {} };
  }

  // ==========================================================================
  // 8. GAMBIT PRESETS (auto-battle / commander AI)
  // ==========================================================================
  // Conditions are KEYS battle.js evaluates against live state each tick, top to
  // bottom; first true fires its action. Documented meanings below.
  const GAMBIT_CONDITIONS = [
    { key: 'always',         label: '总是' },                       // fallback catch-all
    { key: 'enemyHpBelow30', label: '敌斗志<30%' },                 // wild_hp/maxhp < 0.30
    { key: 'enemyHpBelow50', label: '敌斗志<50%' },
    { key: 'selfHpBelow40',  label: '我方斗志<40%' },               // active fighter hp frac < 0.40
    { key: 'selfHpBelow25',  label: '我方斗志<25%' },
    { key: 'ultReady',       label: '必杀能量满' },                 // this.ult >= 100 (or skill.ultCost met)
    { key: 'comboPrimed',    label: '连携已就绪' },                 // target.tags has a tag that checkCombo would trigger w/ a loadout skill
    { key: 'enemyHasTag',    label: '敌身中异常' },                 // target.tags.length > 0
    { key: 'enemyClose',     label: '敌在近身' },                   // dist(me, wild) < 120
    { key: 'enemyFar',       label: '敌在远处' },                   // dist(me, wild) > 260
    { key: 'incomingProj',   label: '有弹幕来袭' },                 // a 'wild' projectile heading at me within ~0.3s
    { key: 'bondHigh',       label: '高羁绊' },                     // bondTier(cat.affinity) >= 4
  ];
  const GAMBIT_ACTIONS = [
    { key: 'ult',       label: '放必杀' },        // cast the loadout ult if affordable
    { key: 'finisher',  label: '连携终结' },      // start/continue the risky combo-chain
    { key: 'combo',     label: '打连携' },        // cast the loadout skill that triggers checkCombo
    { key: 'heal',      label: '治疗' },          // cast a heal/buff skill from loadout
    { key: 'retreat',   label: '拉开距离' },      // kite: move away from wild, dodge if able
    { key: 'dodge',     label: '闪避' },          // spend dodge i-frames
    { key: 'approach',  label: '贴近突进' },      // dash/dash-skill toward wild
    { key: 'basic',     label: '普攻' },          // default poke
    { key: 'skillQ',    label: '技能1' },         // fire loadout[1]
    { key: 'skillE',    label: '技能2' },         // fire loadout[2]
  ];

  // Editable starter preset. The adaptive AI interprets this preset using
  // actual HP, range, projectiles and cooldowns; user-edited rules are executed
  // strictly in their own chosen order.
  function defaultGambits(cat) {
    return [
      { cond: 'selfHpBelow40', act: 'heal' },
      { cond: 'incomingProj', act: 'dodge' },
      { cond: 'ultReady', act: 'ult' },
      { cond: 'enemyHasTag', act: 'combo' },
      { cond: 'enemyClose', act: 'skillQ' },
      { cond: 'enemyFar', act: 'skillE' },
      { cond: 'always', act: 'basic' },
    ];
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================
  window.Skills = {
    // --- elements ---
    ELEMENTS, ELEMENT_ORDER, EFFECT, STAB, SPECIES_ELEMENT,
    elementOf, effectiveness, effectivenessLabel, stabBonus,
    // --- skills & status ---
    SKILLS, TAG_INFO, skillById, skillsByElement,
    // --- upgrade chains (升级链) ---
    upgradeTargetOf, upgradeBaseOf, upgradeChainFor,
    // --- combos ---
    COMBO, checkCombo,
    // --- risky combo-chain ---
    CHAIN, chainMultiplier, chainVulnerability, backfireDamage, chainState, advanceChain,
    // --- learning / loadouts ---
    SIGNATURE_SKILL, SPECIES_SECONDARY, secondaryOf, secondaryChoices, secondaryLimit,
    learnableSkills, defaultLoadout, ensureLoadout,
    basicEligible, basicChoices,
    // --- build types (按品种 + 流派自动配装) ---
    BUILD_TYPES, BUILD_ORDER, buildTypeForBreed, enemyKitFor, recommendLoadout, applyBuild, roleAllowsSkill,
    awakenFirstSkill, progressionHint,
    // --- gated skill-learning (付费/等级/亲密/品种/领悟) ---
    QUEST_CHECKS, questProgress, questMet, gateMet, hasLearned, isGated,
    canLearn, isAutoLearn, autoLearn, trainerSkills, learnSkill,
    // --- bond ---
    BOND_BONUSES, bondTier, bondBonuses,
    // --- evolution ---
    EVOLUTION, evolutionOf, canEvolve, evolveResult,
    // --- gambits ---
    GAMBIT_CONDITIONS, GAMBIT_ACTIONS, defaultGambits,
  };
})();
