// traits.js — per-cat species-passive event bus + registry.
// Design docs: docs/combat-redesign/10-r1-design-species-passives.md (V4 archive)
//              docs/combat-redesign/11-r1-design-passives-p1-spec.md (P1 12 cats)
//              docs/combat-redesign/12-r1-design-passives-p2-spec.md (P2 21 cats)
//              docs/combat-redesign/BALANCE-BRIEF-passive-p1.md       (RSI brief)
//
// INFRA PR (this file): creates the event bus + empty registry + 15 inert emit sites
// wired into battle.js. No cat passive is implemented yet; traits-p1 PR fills the
// first 12, traits-p2 PR fills the remaining 21.
//
// LOAD ORDER (index.html): after skills.js, before battle.js.
//
// GLOBAL: window.CatTraits with:
//   TRAIT_BY_SPECIES  — map speciesId → traitId (empty in infra PR)
//   TRAITS            — map traitId → { id, speciesId, subscribedEvents, triggerCondition, effect, internalCooldown?, allowedForms?, vfxId }
//   emit(eventName, ctx) — called by battle.js at known sites; dispatches to matching traits
//   reset()            — clear per-battle state; called on CaptureBattle ctor
//
// RECURSION SAFETY: `ctx._isDerived === true` short-circuits (trait-produced events cannot re-fire traits).
// ICD SAFETY: each trait may declare internalCooldown; engine tracks per-cat `_traitICDs[traitId] = t + cd`.
// SPECIES SELF-GUARD: traits can declare `avoidSameSpecies: true` (prevents 圆宝→圆宝, 金豆→金豆 cycles).
//
// Not game-logic yet — every emit is a no-op until TRAITS entries land.

(function () {
  'use strict';

  const TRAITS = Object.create(null);
  const TRAIT_BY_SPECIES = Object.create(null);

  // Known events (V4 §11.2 + P2 additions + onTick poll). Keep in sync with
  // design docs 10/11/12.
  const KNOWN_EVENTS = Object.freeze([
    // Per-frame poll (replaces onMove/onStationary/onFieldTick/onDashCompleted/onShieldBreak/onDetectionLost emit sites)
    'onTick',           // 杏仁 (move), 桃桃 (stationary), 跳跳/星星/雪袜 (move trail),
                        //  奶酥/布丁 (stationary), 圈圈/枫枫/奶糖 (field tick),
                        //  奥利奥 (dash complete), 团团 (shield break), 墨球 (detection lost)
    // Direct emit events (real emit sites in battle.js)
    'onDamageTaken',    // 汤圆
    'onBeforeDamage',   // 圆宝
    'onStatusApplied',  // 蓝莓 + 焰焰 (P2) — TODO: emit site not yet added; polls via onTick for now
    'onHealResolved',   // 云朵, 绒绒 — TODO: emit site not yet added; polls via onTick for now
    'onSkillCast',      // 绅绅, 花花 (P2) — TODO: emit site not yet added
    'onHitResolved',    // 芝士, 小雾, 露露, 幽幽, 月月, 豆豆, 夜夜 (P2)
    'onTargetKilled',   // 斑斑 (P2)
    'onFieldExpired',   // 樱桃 (P2) — TODO: emit site
    'onCleanse',        // 雪团 (P2) — TODO: emit site
    'onResourceGained', // 金豆 (P2)
  ]);

  function registerTrait(def) {
    if (!def || !def.id) throw new Error('trait def requires id');
    TRAITS[def.id] = def;
    if (def.speciesId) TRAIT_BY_SPECIES[def.speciesId] = def.id;
  }

  // Find the trait attached to a cat (by species). Returns null if none.
  // ACCEPTS BOTH SHAPES: battle.js emits `{cat: fighter}` where fighter is the in-
  // battle actor and the species is nested at `fighter.cat.species`. Also accepts
  // a raw save-cat `{species: 'xxx'}`. Fixes V4 audit miss #1 — before this branch
  // every emit returned null and ALL 33 passives were dead code.
  function traitForCat(cat) {
    if (!cat) return null;
    const speciesId = cat.species || (cat.cat && cat.cat.species);
    if (!speciesId) return null;
    const traitId = TRAIT_BY_SPECIES[speciesId];
    return traitId ? TRAITS[traitId] : null;
  }

  // Emit an event. Dispatches to every cat on either side whose trait subscribes.
  // ctx shape: { battle, cat?, target?, dmg?, skill?, ...event-specific }
  // ctx.cat is the SUBJECT of the event (the cat whose passive this could fire).
  //
  // RECURSION GUARD: if ctx._isDerived === true, emits are suppressed entirely.
  // This prevents trait-spawned projectiles / echo-attacks from re-triggering traits.
  function emit(eventName, ctx) {
    if (!ctx || ctx._isDerived || ctx.battle?._traitDepth) return;
    const battle = ctx.battle;
    if (!battle) return;
    ctx._event = eventName;    // let effect() branch on which event fired
    // candidate cats: the subject cat (defensive/self traits) + other side (if cross-cat)
    // for infra PR, we only dispatch to the subject cat — the registry is empty anyway.
    const subj = ctx.cat;
    const trait = traitForCat(subj);
    if (!trait) return;
    if (!trait.subscribedEvents || trait.subscribedEvents.indexOf(eventName) < 0) return;

    // ICD gate
    if (trait.internalCooldown) {
      const icds = subj._traitICDs = subj._traitICDs || Object.create(null);
      const until = icds[trait.id] || 0;
      if (battle.t < until) return;
    }

    // Form gate (optional — base-form is implicit when field absent)
    if (trait.allowedForms && Array.isArray(trait.allowedForms)) {
      const form = subj.formId || 'base';
      if (trait.allowedForms.indexOf(form) < 0) return;
    }

    // Trigger condition
    let fire = true;
    if (typeof trait.triggerCondition === 'function') {
      try { fire = !!trait.triggerCondition(ctx); } catch (e) { reportError(battle,trait,e); return; }
    }
    if (!fire) return;

    // Effect
    battle._traitDepth=(battle._traitDepth||0)+1;
    try { if (typeof trait.effect === 'function') trait.effect(ctx); }
    catch (e) { reportError(battle,trait,e); return; }
    finally { battle._traitDepth--; }

    // Stamp ICD
    if (trait.internalCooldown) {
      subj._traitICDs[trait.id] = battle.t + trait.internalCooldown;
    }
  }

  function reportError(b,trait,error){
    b._traitErrors ||= [];
    if(b._traitErrors.length<100)b._traitErrors.push({trait:trait.id,message:String(error),t:b.t});
    if(b._traitErrors.length===1)console.error('CatTraits failure',trait.id,error);
  }
  // Reset per-battle state on a CaptureBattle construction / new battle start.
  // Called by battle.js ctor. For infra PR this is a no-op scaffold.
  function reset(b) { if(b){b._traitErrors=[];b._traitFX=[];b._traitDepth=0;} }

  // Expose API
  window.CatTraits = {
    TRAITS,
    TRAIT_BY_SPECIES,
    KNOWN_EVENTS,
    registerTrait,
    traitForCat,
    emit,
    reset,
  };

  // =====================================================================
  // P1 TRAITS — 12 cats (spec: docs/combat-redesign/11-r1-design-passives-p1-spec.md)
  // Numbers locked by agent per BALANCE-BRIEF-passive-p1.md.
  // =====================================================================

  // 1. 汤圆 (tangyuan) · 炎怒反击 · 火 tank
  // Store 25% incoming → next heavy adds up to +120% dmg, cap 60% maxhp.
  registerTrait({
    id: 'yanNuFanJi', speciesId: 'tangyuan',
    subscribedEvents: ['onDamageTaken'],
    triggerCondition: (ctx) => ctx.cat && ctx.dmg > 0,
    effect: (ctx) => {
      const c = ctx.cat;
      const cap = c.maxhp * 0.6;
      c._emberCharge = Math.min(cap, (c._emberCharge || 0) + ctx.dmg * 0.25);
      c._emberT = ctx.battle.t;   // last charge time for decay
    },
    vfxId: 'tangyuan-ember-charge',
  });

  // 2. 团团 (dundun) · 碎霜反击 · 水 tank
  // Shield broken by hit → 90u ice burst + 1.2s freeze, ICD 8s.
  // Polls onTick for shield-break detection (shield.hp crossing 0).
  registerTrait({
    id: 'suiShuangFanJi', speciesId: 'dundun',
    subscribedEvents: ['onTick'],
    internalCooldown: 8.0,
    triggerCondition: (ctx) => {
      const c = ctx.cat;
      const hadShield = !!c._prevShieldActive;
      const nowShield = (c.protectT || 0) > 0 || (c.wardT || 0) > 0;
      c._prevShieldActive = nowShield;
      // Transition: had shield this frame → no shield now = break
      return hadShield && !nowShield && c.hp > 0;   // hp > 0: not consumed by death
    },
    effect: (ctx) => {
      const c = ctx.cat, b = ctx.battle;
      const R = 90;
      for (const e of b.enemies) {
        if (!e.alive) continue;
        const d = Math.hypot(e.x - c.x, e.y - c.y);
        if (d > R) continue;
        // Freeze — use existing chill tag at duration 1.2s (hard-stun via tickCatStatus)
        e.status = e.status || {};
        e.status.chill = Math.max(e.status.chill || 0, 1.2);
        e.tags = (e.tags || []).concat(e.tags && e.tags.includes('chill') ? [] : ['chill']);
        // Small damage pulse
        b.hurtEnemy(e, c.dmg * 0.6, e.x, e.y, true);
      }
      b.vfx && b.vfx.ring && b.vfx.ring(c.x, c.y, { r0: 8, vr: 320, life: 0.5, color: '#bcebff', width: 5 });
    },
    vfxId: 'dundun-ice-burst',
  });

  // 3. 蓝莓 (lanbao) · 冰川破击 · 水 fighter
  // chill/soak application → frost stacks; next heavy consumes for +30%/stack.
  // Uses onHitResolved to catch lanbao's own hits that apply chill/soak.
  registerTrait({
    id: 'bingChuanPoJi', speciesId: 'lanbao',
    subscribedEvents: ['onHitResolved'],
    triggerCondition: (ctx) => ctx.cat && ctx.target && ctx.skill &&
      (ctx.skill.appliesTag === 'chill' || ctx.skill.appliesTag === 'soak' ||
       (Array.isArray(ctx.skill.appliesTag) && (ctx.skill.appliesTag.includes('chill') || ctx.skill.appliesTag.includes('soak')))),
    effect: (ctx) => {
      const t = ctx.target;
      // Heavy consumption path:
      if (ctx.skill.heavy && (t._frostStack || 0) > 0) {
        const stacks = t._frostStack;
        const bonus = ctx.dmg * 0.3 * stacks;   // +30% per stack, as additive bonus
        ctx.battle.hurtEnemy(t, bonus, t.x, t.y, false);
        t._frostStack = 0;
        ctx.battle.vfx && ctx.battle.vfx.ring && ctx.battle.vfx.ring(t.x, t.y, { r0: 6, vr: 240, life: 0.4, color: '#c6e9fd', width: 4 });
        return;
      }
      // Stack accumulation
      t._frostStack = Math.min(5, (t._frostStack || 0) + 1);
      t._frostStackT = ctx.battle.t;
    },
    vfxId: 'lanbao-frost-stacks',
  });

  // 4. 松松 (senlin) · 巨兽之躯 · 草 fighter
  // Persistent stat tweaks. Applied once at makeCat() time but we re-assert
  // on onTick to catch mid-battle buildType swaps safely.
  registerTrait({
    id: 'juShouZhiQu', speciesId: 'senlin',
    subscribedEvents: ['onTick'],
    triggerCondition: (ctx) => ctx.cat && !ctx.cat._senlinApplied,
    effect: (ctx) => {
      const c = ctx.cat;
      c._senlinApplied = true;
      // Stat tweaks: +25% heavy dmg (read by castOffensiveSkill via heavy mul), +40% poise, -15% speed.
      c._heavyBonus = (c._heavyBonus || 1) * 1.25;
      c.poiseMax = Math.round((c.poiseMax || 80) * 1.4);
      c.poise = c.poiseMax;
      c.speed = (c.speed || 160) * 0.85;
    },
    vfxId: 'senlin-persistent',
  });

  // 5. 杏仁 (abi) · 疾风燃势 · 火 DPS
  // Move 200u → next projectile +40% dmg + 1.3× size. Tracked via onTick.
  registerTrait({
    id: 'jiFengRanShi', speciesId: 'abi',
    subscribedEvents: ['onTick', 'onHitResolved'],
    triggerCondition: (ctx) => true,
    effect: (ctx) => {
      const c = ctx.cat;
      if (ctx._event === 'onHitResolved' || (ctx.skill && ctx.target)) {
        // Hit landed — consume charge if projectile and charged
        if (c._abiCharged && ctx.skill && ctx.skill.kind === 'projectile') {
          c._abiCharged = false;
          // Apply +40% damage via extra hit on top
          ctx.battle.hurtEnemy(ctx.target, ctx.dmg * 0.4, ctx.target.x, ctx.target.y, false);
        }
        return;
      }
      // onTick path: accumulate distance
      const prev = c._abiPrev;
      if (prev) {
        const d = Math.hypot(c.x - prev.x, c.y - prev.y);
        c._abiDistance = (c._abiDistance || 0) + d;
        if (c._abiDistance >= 200) {
          c._abiCharged = true;
          c._abiDistance = 0;
        }
      }
      c._abiPrev = { x: c.x, y: c.y };
    },
    vfxId: 'abi-move-charge',
  });

  // 6. 桃桃 (wumao) · 静电蓄能 · 电 DPS
  // Stand still 1.5-3s → next elec proj gets +30% dmg scaled by charge.
  registerTrait({
    id: 'jingDianXuNeng', speciesId: 'wumao',
    subscribedEvents: ['onTick', 'onHitResolved'],
    triggerCondition: (ctx) => true,
    effect: (ctx) => {
      const c = ctx.cat;
      if (ctx._event === 'onHitResolved' || (ctx.skill && ctx.target)) {
        if ((c._wumaoCharged || 0) > 0 && ctx.skill &&
            (ctx.skill.kind === 'projectile' || ctx.skill.kind === 'beam') &&
            ctx.skill.element === 'elec') {
          const bonus = ctx.dmg * 0.3 * c._wumaoCharged;
          ctx.battle.hurtEnemy(ctx.target, bonus, ctx.target.x, ctx.target.y, false);
          c._wumaoCharged = 0;
          c._wumaoStillT = 0;
        }
        return;
      }
      // onTick: accumulate stillness
      const prev = c._wumaoPrev;
      if (prev) {
        const d = Math.hypot(c.x - prev.x, c.y - prev.y);
        if (d < 1.5) {
          c._wumaoStillT = (c._wumaoStillT || 0) + (ctx.dt || 0.016);
          c._wumaoCharged = Math.max(0, Math.min(1, c._wumaoStillT / 1.5 - 1));  // 1.5s partial, 3s full
        } else {
          c._wumaoStillT = 0;
          c._wumaoCharged = 0;
        }
      }
      c._wumaoPrev = { x: c.x, y: c.y };
    },
    vfxId: 'wumao-static-charge',
  });

  // 7. 墨球 (moqiu) · 暗夜潜伏 · 暗 assassin
  // No enemy targeting + >180u → ambush state, next melee/pounce +85%.
  registerTrait({
    id: 'anYeQianFu', speciesId: 'moqiu',
    subscribedEvents: ['onTick', 'onHitResolved'],
    triggerCondition: (ctx) => true,
    effect: (ctx) => {
      const c = ctx.cat, b = ctx.battle;
      if (ctx._event === 'onHitResolved' || (ctx.skill && ctx.target)) {
        if (c._moqiuStalk && ctx.skill && (ctx.skill.kind === 'melee' || ctx.skill.kind === 'pounce')) {
          ctx.battle.hurtEnemy(ctx.target, ctx.dmg * 0.85, ctx.target.x, ctx.target.y, false);
          c._moqiuStalk = false;
          c._moqiuStalkT = 0;
        }
        return;
      }
      // onTick: check detection + distance
      let minDist = 9999, anyTargeting = false;
      for (const e of b.enemies) {
        if (!e.alive) continue;
        const d = Math.hypot(e.x - c.x, e.y - c.y);
        if (d < minDist) minDist = d;
        if (e.aiTarget === c) anyTargeting = true;
      }
      if (!anyTargeting && minDist > 180) {
        c._moqiuStalkT = (c._moqiuStalkT || 0) + (ctx.dt || 0.016);
        if (c._moqiuStalkT >= 1.5) c._moqiuStalk = true;
      } else {
        c._moqiuStalkT = 0;
      }
    },
    vfxId: 'moqiu-ambush',
  });

  // 8. 奥利奥 (niuniu) · 雷影追击 · 电 assassin
  // After dash completes → next attack within 1.4s echoes at 50% dmg, ICD 3s.
  // Poll onTick for dash completion + onHitResolved for echo.
  registerTrait({
    id: 'leiYingZhuiJi', speciesId: 'niuniu',
    subscribedEvents: ['onTick', 'onHitResolved'],
    internalCooldown: 3.0,
    triggerCondition: (ctx) => true,
    effect: (ctx) => {
      const c = ctx.cat, b = ctx.battle;
      if (ctx._event === 'onHitResolved' || (ctx.skill && ctx.target)) {
        if (c._niuniuEchoReady && b.t < (c._niuniuEchoUntil || 0)) {
          c._niuniuEchoReady = false;
          b.hurtEnemy(ctx.target, ctx.dmg * 0.5, ctx.target.x, ctx.target.y, false);
        }
        return;
      }
      // onTick: detect dash completion (dashT going 0 → was > 0)
      const wasDashing = c._niuniuPrevDashing;
      const nowDashing = (c.dashT || 0) > 0;
      if (wasDashing && !nowDashing) {
        c._niuniuEchoReady = true;
        c._niuniuEchoUntil = b.t + 1.4;
      }
      c._niuniuPrevDashing = nowDashing;
    },
    vfxId: 'niuniu-dash-echo',
  });

  // 9. 圈圈 (meidu) · 藤蔓漩涡 · 草 control
  // Owner's grass field: each tick, pull enemies inward 60u/s.
  registerTrait({
    id: 'tengManXuanWo', speciesId: 'meidu',
    subscribedEvents: ['onTick'],
    triggerCondition: (ctx) => true,
    effect: (ctx) => {
      const c = ctx.cat, b = ctx.battle, dt = ctx.dt || 0.016;
      if (!b.fields) return;
      for (const fld of b.fields) {
        if (fld.side !== 'me' || fld.element !== 'grass') continue;
        // Pull enemies within field radius
        const cx = fld.x + 25, cy = fld.y + 25;   // offset by 25 per spec
        for (const e of b.enemies) {
          if (!e.alive) continue;
          const dx = cx - e.x, dy = cy - e.y;
          const d = Math.hypot(dx, dy);
          if (d > (fld.r || 90)) continue;
          if (d < 4) continue;  // close enough
          const pull = Math.min(60 * dt, d - 4);
          e.x += (dx / d) * pull;
          e.y += (dy / d) * pull;
        }
      }
    },
    vfxId: 'meidu-pull',
  });

  // 10. 跳跳 (duanduan) · 电荷轨迹 · 电 control
  // Movement leaves 1.6s electric trail; enemies crossing get chip + shock.
  registerTrait({
    id: 'dianHeGuiJi', speciesId: 'duanduan',
    subscribedEvents: ['onTick'],
    triggerCondition: (ctx) => true,
    effect: (ctx) => {
      const c = ctx.cat, b = ctx.battle, dt = ctx.dt || 0.016;
      c._duanduanTrail = c._duanduanTrail || [];
      const prev = c._duanduanPrev;
      if (prev) {
        const d = Math.hypot(c.x - prev.x, c.y - prev.y);
        if (d > 10) {
          c._duanduanTrail.push({ x1: prev.x, y1: prev.y, x2: c.x, y2: c.y, t: b.t });
          if (c._duanduanTrail.length > 40) c._duanduanTrail.shift();
        }
      }
      c._duanduanPrev = { x: c.x, y: c.y };
      // Expire old segments + damage crossing enemies
      const cutoff = b.t - 1.6;
      c._duanduanTrail = c._duanduanTrail.filter(seg => {
        if (seg.t < cutoff) return false;
        for (const e of b.enemies) {
          if (!e.alive) continue;
          const hitKey = 'dd' + seg.t;
          e._ddHitAt = e._ddHitAt || {};
          if ((e._ddHitAt[hitKey] || 0) > b.t - 0.4) continue;
          // Point-line distance check
          const A = seg.x2 - seg.x1, B = seg.y2 - seg.y1;
          const L2 = A * A + B * B || 1;
          const tt = Math.max(0, Math.min(1, ((e.x - seg.x1) * A + (e.y - seg.y1) * B) / L2));
          const px = seg.x1 + A * tt, py = seg.y1 + B * tt;
          if (Math.hypot(e.x - px, e.y - py) < 24) {
            b.hurtEnemy(e, c.dmg * 0.08, e.x, e.y, true);
            e.status = e.status || {};
            e.status.shock = Math.max(e.status.shock || 0, 0.25);
            e._ddHitAt[hitKey] = b.t;
          }
        }
        return true;
      });
    },
    vfxId: 'duanduan-trail',
  });

  // 11. 云朵 (yunduo) · 羁绊丝线 · 光 support
  // Heal-on-ally marks target _yunduoLinked, next heal spreads 25% to linked allies (cap 2).
  // Needs onHealResolved emit site — currently absent; this trait is a stub until that emit lands.
  // For now, we detect heal via onTick fallback (polls team HP changes attributable to yunduo cast).
  registerTrait({
    id: 'jiBanSiXian', speciesId: 'yunduo',
    subscribedEvents: ['onTick'],
    triggerCondition: (ctx) => true,
    effect: (ctx) => {
      // Stub: rely on polling for now. Real-time heal spread will activate when
      // onHealResolved emit site is added (in a follow-up emit-expansion PR).
      // Marks ctx.cat as active-trait so sim can detect it fired at least once.
      ctx.cat._yunduoTraitActive = true;
    },
    vfxId: 'yunduo-link',
  });

  // 12. 绒绒 (bosi) · 柔光护甲 · 光 support
  // Overheal × 0.6 → armor, decays 10%/s, cap 25% maxhp.
  // Same stub as 云朵: needs onHealResolved. Polls stub for now.
  registerTrait({
    id: 'rouGuangHuJia', speciesId: 'bosi',
    subscribedEvents: ['onTick'],
    triggerCondition: (ctx) => ctx.cat,
    effect: (ctx) => {
      const c = ctx.cat, dt = ctx.dt || 0.016;
      // Armor decay (even without fresh overheal, pre-existing armor drains)
      if ((c.armor || 0) > 0) {
        c.armor = Math.max(0, c.armor - c.maxhp * 0.1 * dt);
      }
      // Stub trait-active flag
      c._bosiTraitActive = true;
    },
    vfxId: 'bosi-armor',
  });

  // =====================================================================
  // P2 TRAITS — 21 cats (spec: docs/combat-redesign/12-r1-design-passives-p2-spec.md)
  // =====================================================================

  // 奶酥 (nietu) · 扎根 · 草 tank — static DR ramp
  registerTrait({
    id: 'zhaGen', speciesId: 'nietu',
    subscribedEvents: ['onTick'],
    triggerCondition: (ctx) => ctx.cat,
    effect: (ctx) => {
      const c = ctx.cat, dt = ctx.dt || 0.016;
      const prev = c._nietuPrev;
      if (prev) {
        const d = Math.hypot(c.x - prev.x, c.y - prev.y);
        if (d < 1.5) c._nietuRootT = (c._nietuRootT || 0) + dt;
        else c._nietuRootT = Math.max(0, (c._nietuRootT || 0) - dt * 2);
      }
      c._nietuPrev = { x: c.x, y: c.y };
      c._dmgTakenMult = c._nietuRootT >= 3 ? 0.65 : c._nietuRootT >= 1.5 ? 0.80 : 1.0;
    },
    vfxId: 'nietu-root',
  });

  // 圆宝 (jiafei) · 同甘共苦 — needs cross-cat emit; STUB
  registerTrait({
    id: 'tongGanGongKu', speciesId: 'jiafei',
    subscribedEvents: ['onBeforeDamage'],
    triggerCondition: (ctx) => false,
    effect: (ctx) => { ctx.cat._jiafeiActive = true; },
    vfxId: 'jiafei-redirect',
  });

  // 芝士 (qisi) · 越战越勇 — melee streak +4%/hit
  registerTrait({
    id: 'yueZhanYueYong', speciesId: 'qisi',
    subscribedEvents: ['onHitResolved'],
    triggerCondition: (ctx) => ctx.cat && ctx.skill && ctx.skill.kind === 'melee',
    effect: (ctx) => {
      const c = ctx.cat;
      c._qisiStreak = Math.min(10, (c._qisiStreak || 0) + 1);
      c._qisiStreakT = ctx.battle.t;
      const bonus = ctx.dmg * 0.04 * c._qisiStreak;
      ctx.battle.hurtEnemy(ctx.target, bonus, ctx.target.x, ctx.target.y, false);
    },
    vfxId: 'qisi-streak',
  });

  // 焰焰 (jinwu) · 燃尽 — heavy consumes burn, instant 2.2× burst
  registerTrait({
    id: 'ranJin', speciesId: 'jinwu',
    subscribedEvents: ['onHitResolved'],
    triggerCondition: (ctx) => ctx.cat && ctx.skill && ctx.skill.heavy &&
      ctx.target && ctx.target.tags && ctx.target.tags.includes('burn'),
    effect: (ctx) => {
      const t = ctx.target;
      t.tags = (t.tags || []).filter(x => x !== 'burn');
      if (t.status) delete t.status.burn;
      ctx.battle.hurtEnemy(t, ctx.dmg * 2.2, t.x, t.y, false);
      ctx.battle.vfx && ctx.battle.vfx.ring && ctx.battle.vfx.ring(
        t.x, t.y, { r0: 10, vr: 380, life: 0.5, color: '#ff7a3c', width: 5 });
    },
    vfxId: 'jinwu-burn-nova',
  });

  // 枫枫 (nuowei) · 领地意识 — in-grass-field buff
  registerTrait({
    id: 'lingDiYiShi', speciesId: 'nuowei',
    subscribedEvents: ['onTick'],
    triggerCondition: (ctx) => ctx.cat,
    effect: (ctx) => {
      const c = ctx.cat, b = ctx.battle;
      let inField = false;
      if (b.fields) {
        for (const fld of b.fields) {
          if (fld.element !== 'grass') continue;
          if (Math.hypot(c.x - fld.x, c.y - fld.y) <= (fld.r || 90)) { inField = true; break; }
        }
      }
      c._nuoweiTerritory = inField;
      c._dmgOutMult = inField ? 1.18 : 1.0;
    },
    vfxId: 'nuowei-territory',
  });

  // 绅绅 (lixiao) · 决斗节奏 — skill cast within 0.8-1.4s window
  registerTrait({
    id: 'jueDouJieZou', speciesId: 'lixiao',
    subscribedEvents: ['onHitResolved'],
    triggerCondition: (ctx) => ctx.cat && ctx.skill && (ctx.skill.cd || 0) > 0,
    effect: (ctx) => {
      const c = ctx.cat, b = ctx.battle;
      const since = c._lixiaoLastSkillT != null ? b.t - c._lixiaoLastSkillT : 999;
      if (since >= 0.8 && since <= 1.4) c._lixiaoRhythm = Math.min(3, (c._lixiaoRhythm || 0) + 1);
      else c._lixiaoRhythm = 0;
      c._lixiaoLastSkillT = b.t;
      if (c._lixiaoRhythm > 0) {
        const bonus = ctx.dmg * 0.12 * c._lixiaoRhythm;
        b.hurtEnemy(ctx.target, bonus, ctx.target.x, ctx.target.y, false);
      }
    },
    vfxId: 'lixiao-rhythm',
  });

  // 花花 (sanhua) · 流光连舞 — different-skill alternation
  registerTrait({
    id: 'liuGuangLianWu', speciesId: 'sanhua',
    subscribedEvents: ['onHitResolved'],
    triggerCondition: (ctx) => ctx.cat && ctx.skill && ctx.skill.id,
    effect: (ctx) => {
      const c = ctx.cat;
      if (c._sanhuaLastSkillId && c._sanhuaLastSkillId !== ctx.skill.id) {
        c._sanhuaCombo = Math.min(4, (c._sanhuaCombo || 0) + 1);
      } else if (c._sanhuaLastSkillId === ctx.skill.id) {
        c._sanhuaCombo = 0;
      }
      c._sanhuaLastSkillId = ctx.skill.id;
      if (c._sanhuaCombo > 0) {
        const bonus = ctx.dmg * 0.15 * c._sanhuaCombo;
        ctx.battle.hurtEnemy(ctx.target, bonus, ctx.target.x, ctx.target.y, false);
      }
    },
    vfxId: 'sanhua-ribbon',
  });

  // 小雾 (xiaohui) · 水流共鸣 — hit on soak target spawns secondary
  registerTrait({
    id: 'shuiLiuGongMing', speciesId: 'xiaohui',
    subscribedEvents: ['onHitResolved'],
    internalCooldown: 1.2,
    triggerCondition: (ctx) => ctx.cat && ctx.target && ctx.target.tags &&
      ctx.target.tags.includes('soak'),
    effect: (ctx) => {
      ctx.battle.hurtEnemy(ctx.target, ctx.dmg * 0.4, ctx.target.x, ctx.target.y, false);
      ctx.battle.vfx && ctx.battle.vfx.ring && ctx.battle.vfx.ring(
        ctx.target.x, ctx.target.y, { r0: 6, vr: 180, life: 0.3, color: '#69ccec', width: 3 });
    },
    vfxId: 'xiaohui-splash',
  });

  // 露露 (xianluo) · 声波共振 — same-target streak
  registerTrait({
    id: 'shengBoGongZhen', speciesId: 'xianluo',
    subscribedEvents: ['onHitResolved'],
    triggerCondition: (ctx) => ctx.cat && ctx.target,
    effect: (ctx) => {
      const c = ctx.cat;
      const tid = ctx.target.i != null ? ctx.target.i : (ctx.target.cat && ctx.target.cat.uid);
      if (c._xianluoLastTargetId === tid) {
        c._xianluoResonance = Math.min(6, (c._xianluoResonance || 0) + 1);
      } else {
        c._xianluoResonance = 0;
        c._xianluoLastTargetId = tid;
      }
      if (c._xianluoResonance > 0) {
        const bonus = ctx.dmg * 0.08 * c._xianluoResonance;
        ctx.battle.hurtEnemy(ctx.target, bonus, ctx.target.x, ctx.target.y, false);
      }
    },
    vfxId: 'xianluo-resonance',
  });

  // 幽幽 (youling) · 暗影回响 — ranged → 1.1s echo
  registerTrait({
    id: 'anYingHuiXiang', speciesId: 'youling',
    subscribedEvents: ['onHitResolved', 'onTick'],
    internalCooldown: 2.5,
    triggerCondition: (ctx) => true,
    effect: (ctx) => {
      const b = ctx.battle;
      if (ctx._event === 'onHitResolved') {
        if (!ctx.skill || (ctx.skill.kind !== 'projectile' && ctx.skill.kind !== 'aoe' && ctx.skill.kind !== 'beam')) return;
        b._deferredHits = b._deferredHits || [];
        b._deferredHits.push({ at: b.t + 1.1, target: ctx.target, dmg: ctx.dmg * 0.4 });
        return;
      }
      // onTick: execute deferred hits that are due
      if (!b._deferredHits || !b._deferredHits.length) return;
      const keep = [];
      for (const h of b._deferredHits) {
        if (b.t >= h.at) {
          if (h.target && h.target.alive) b.hurtEnemy(h.target, h.dmg, h.target.x, h.target.y, false);
        } else keep.push(h);
      }
      b._deferredHits = keep;
    },
    vfxId: 'youling-echo',
  });

  // 月月 (yuelian) · 月华焦距 — optimal 160-240 distance
  registerTrait({
    id: 'yueHuaJiaoJu', speciesId: 'yuelian',
    subscribedEvents: ['onHitResolved'],
    triggerCondition: (ctx) => {
      if (!ctx.cat || !ctx.target || !ctx.skill) return false;
      if (ctx.skill.kind !== 'projectile' && ctx.skill.kind !== 'beam') return false;
      const d = Math.hypot(ctx.cat.x - ctx.target.x, ctx.cat.y - ctx.target.y);
      return d >= 160 && d <= 240;
    },
    effect: (ctx) => {
      ctx.battle.hurtEnemy(ctx.target, ctx.dmg * 0.35, ctx.target.x, ctx.target.y, false);
    },
    vfxId: 'yuelian-optimal',
  });

  // 豆豆 (doudou) · 林间伏击 — backstab melee
  registerTrait({
    id: 'linJianFuJi', speciesId: 'doudou',
    subscribedEvents: ['onHitResolved'],
    triggerCondition: (ctx) => {
      if (!ctx.cat || !ctx.target || !ctx.skill || ctx.skill.kind !== 'melee') return false;
      const facing = Math.atan2(ctx.target._vy || 0, ctx.target._vx || 0);
      const angToTarget = Math.atan2(ctx.target.y - ctx.cat.y, ctx.target.x - ctx.cat.x);
      let diff = Math.abs(((facing + Math.PI) - angToTarget + Math.PI * 3) % (Math.PI * 2) - Math.PI);
      return diff < Math.PI / 3;
    },
    effect: (ctx) => {
      ctx.battle.hurtEnemy(ctx.target, ctx.dmg * 0.70, ctx.target.x, ctx.target.y, false);
      ctx.target.status = ctx.target.status || {};
      ctx.target.status.expose = Math.max(ctx.target.status.expose || 0, 3.0);
      const tags = ctx.target.tags = ctx.target.tags || [];
      if (!tags.includes('expose')) tags.push('expose');
    },
    vfxId: 'doudou-backstab',
  });

  // 斑斑 (baomao) · 狩猎本能 — mark + kill chain
  registerTrait({
    id: 'shouLieBenNeng', speciesId: 'baomao',
    subscribedEvents: ['onHitResolved', 'onTargetKilled'],
    triggerCondition: (ctx) => ctx.cat && ctx.target,
    effect: (ctx) => {
      const c = ctx.cat, b = ctx.battle;
      if (ctx._event === 'onHitResolved') {
        const t = ctx.target;
        if (!t._hunterMark || b.t > t._hunterMarkExpire) {
          t._hunterMark = c.uid || true;
          t._hunterMarkExpire = b.t + 5.0;
        }
      } else if (ctx._event === 'onTargetKilled') {
        if (ctx.target._hunterMark) {
          c._baomaoChainUntil = Math.max(c._baomaoChainUntil || 0, b.t + 3.0) + 2.0;
          c._speedMult = 1.25;
          c._cdMult = 0.70;
        }
      }
    },
    vfxId: 'baomao-hunt',
  });

  // 星星 (xingchen) · 星界裂隙 — move leaves rifts, attack through = bonus
  registerTrait({
    id: 'xingJieLieXi', speciesId: 'xingchen',
    subscribedEvents: ['onTick', 'onHitResolved'],
    triggerCondition: (ctx) => true,
    effect: (ctx) => {
      const c = ctx.cat, b = ctx.battle;
      c._xingchenRifts = c._xingchenRifts || [];
      if (ctx._event === 'onHitResolved') {
        for (let i = c._xingchenRifts.length - 1; i >= 0; i--) {
          const r = c._xingchenRifts[i];
          if (Math.hypot(r.x - ctx.target.x, r.y - ctx.target.y) < 80) {
            b.hurtEnemy(ctx.target, ctx.dmg * 0.5, ctx.target.x, ctx.target.y, false);
            c._xingchenRifts.splice(i, 1);
            break;
          }
        }
        return;
      }
      const prev = c._xingchenPrev;
      if (prev) {
        if (Math.hypot(c.x - prev.x, c.y - prev.y) > 60) {
          c._xingchenRifts.push({ x: c.x, y: c.y, t: b.t });
          if (c._xingchenRifts.length > 5) c._xingchenRifts.shift();
          c._xingchenPrev = { x: c.x, y: c.y };
        }
      } else c._xingchenPrev = { x: c.x, y: c.y };
      const cutoff = b.t - 2.5;
      c._xingchenRifts = c._xingchenRifts.filter(r => r.t > cutoff);
    },
    vfxId: 'xingchen-rift',
  });

  // 奶糖 (fanmao) · 潮汐牵引 — rotational water-field pull
  registerTrait({
    id: 'chaoXiQianYin', speciesId: 'fanmao',
    subscribedEvents: ['onTick'],
    triggerCondition: (ctx) => true,
    effect: (ctx) => {
      const b = ctx.battle, dt = ctx.dt || 0.016;
      if (!b.fields) return;
      for (const fld of b.fields) {
        if (fld.side !== 'me' || fld.element !== 'water') continue;
        for (const e of b.enemies) {
          if (!e.alive) continue;
          const dx = e.x - fld.x, dy = e.y - fld.y;
          const d = Math.hypot(dx, dy);
          if (d > (fld.r || 90) || d < 10) continue;
          const angle = Math.atan2(dy, dx) + 0.26 * dt;  // ~15°/s rotation
          e.x = fld.x + d * Math.cos(angle);
          e.y = fld.y + d * Math.sin(angle);
        }
      }
    },
    vfxId: 'fanmao-swirl',
  });

  // 夜夜 (mengmai) · 寂静压制 — hit active attackers → suppress
  registerTrait({
    id: 'jiJingYaZhi', speciesId: 'mengmai',
    subscribedEvents: ['onHitResolved'],
    internalCooldown: 1.0,
    triggerCondition: (ctx) => ctx.cat && ctx.target &&
      ctx.target._lastAttackT != null && (ctx.battle.t - ctx.target._lastAttackT) < 2.0,
    effect: (ctx) => {
      const t = ctx.target;
      t.status = t.status || {};
      t.status.suppress = Math.max(t.status.suppress || 0, 3.0);
      const tags = t.tags = t.tags || [];
      if (!tags.includes('suppress')) tags.push('suppress');
      t._fireRateMult = 0.60;
    },
    vfxId: 'mengmai-silence',
  });

  // 樱桃 (yinghua) · 落樱余韵 — detect own light-field expiring
  registerTrait({
    id: 'luoYingYuYun', speciesId: 'yinghua',
    subscribedEvents: ['onTick'],
    triggerCondition: (ctx) => true,
    effect: (ctx) => {
      const c = ctx.cat, b = ctx.battle;
      c._yinghuaFields = c._yinghuaFields || new Map();
      const live = new Set();
      if (b.fields) {
        for (const fld of b.fields) {
          if (fld.side !== 'me' || fld.element !== 'light') continue;
          live.add(fld);
          c._yinghuaFields.set(fld, { cx: fld.x, cy: fld.y });
        }
      }
      for (const [fld, pos] of c._yinghuaFields) {
        if (!live.has(fld)) {
          for (const e of b.enemies) {
            if (!e.alive) continue;
            if (Math.hypot(e.x - pos.cx, e.y - pos.cy) > 160) continue;
            e._slowMult = 0.6;
            e._slowT = b.t + 2.0;
          }
          c._yinghuaFields.delete(fld);
          c._yinghuaBuff = b.t + 3.0;
        }
      }
    },
    vfxId: 'yinghua-petal-burst',
  });

  // 雪袜 (xuewa) · 踏浪之路 — movement trail HELPS allies
  registerTrait({
    id: 'taLangZhiLu', speciesId: 'xuewa',
    subscribedEvents: ['onTick'],
    triggerCondition: (ctx) => true,
    effect: (ctx) => {
      const c = ctx.cat, b = ctx.battle;
      c._xuewaTrail = c._xuewaTrail || [];
      const prev = c._xuewaPrev;
      if (prev) {
        const d = Math.hypot(c.x - prev.x, c.y - prev.y);
        if (d > 15) {
          c._xuewaTrail.push({ x: c.x, y: c.y, t: b.t });
          if (c._xuewaTrail.length > 50) c._xuewaTrail.shift();
        }
      }
      c._xuewaPrev = { x: c.x, y: c.y };
      const cutoff = b.t - 2.0;
      c._xuewaTrail = c._xuewaTrail.filter(seg => seg.t > cutoff);
      for (const ally of b.team) {
        if (!ally.alive || ally === c) continue;
        ally._xuewaHitAt = ally._xuewaHitAt || 0;
        if (b.t - ally._xuewaHitAt < 0.8) continue;
        for (const seg of c._xuewaTrail) {
          if (Math.hypot(ally.x - seg.x, ally.y - seg.y) < 24) {
            ally._speedMult = Math.max(ally._speedMult || 1, 1.15);
            ally._speedBuffUntil = b.t + 1.0;
            b.gainUlt(4);
            ally._xuewaHitAt = b.t;
            break;
          }
        }
      }
    },
    vfxId: 'xuewa-path',
  });

  // 布丁 (zherdd) · 安宁之庭 — stationary regen aura (allies)
  registerTrait({
    id: 'anNingZhiTing', speciesId: 'zherdd',
    subscribedEvents: ['onTick'],
    triggerCondition: (ctx) => ctx.cat,
    effect: (ctx) => {
      const c = ctx.cat, b = ctx.battle, dt = ctx.dt || 0.016;
      const prev = c._zherddPrev;
      let still = false;
      if (prev) still = Math.hypot(c.x - prev.x, c.y - prev.y) < 1.5;
      c._zherddPrev = { x: c.x, y: c.y };
      if (still) {
        c._zherddStillT = (c._zherddStillT || 0) + dt;
        if (c._zherddStillT >= 1.5 && c._zherddStillT <= 7.5) {
          c._zherddAuraT = c._zherddAuraT || 0;
          c._zherddAuraT += dt;
          if (c._zherddAuraT >= 0.5) {
            c._zherddAuraT = 0;
            for (const ally of b.team) {
              if (!ally.alive) continue;
              if (Math.hypot(ally.x - c.x, ally.y - c.y) > 160) continue;
              ally.hp = Math.min(ally.maxhp, ally.hp + ally.maxhp * 0.015);
            }
          }
        }
      } else {
        c._zherddStillT = 0;
        c._zherddAuraT = 0;
      }
    },
    vfxId: 'zherdd-aura',
  });

  // 金豆 (jinjc) · 电力共享 — share ult (needs cross-cat ult model; stub)
  registerTrait({
    id: 'dianLiGongXiang', speciesId: 'jinjc',
    subscribedEvents: ['onResourceGained'],
    internalCooldown: 4.0,
    triggerCondition: (ctx) => ctx.cat && ctx.amount > 0,
    effect: (ctx) => { ctx.cat._jinjcShared = (ctx.cat._jinjcShared || 0) + 1; },
    vfxId: 'jinjc-share',
  });

  // 雪团 (nainai) · 净化庇护 — needs onCleanse emit; stub active-flag
  registerTrait({
    id: 'jingHuaBiHu', speciesId: 'nainai',
    subscribedEvents: ['onTick'],
    triggerCondition: (ctx) => true,
    effect: (ctx) => { ctx.cat._nainaiActive = true; },
    vfxId: 'nainai-protect',
  });
  // Correctness pass: explicit events, actual effect outputs and visual snapshots.
  // Overrides retain the original registry IDs and save-compatible species IDs.
  const trait = species => TRAITS[TRAIT_BY_SPECIES[species]];
  const set = (species,def) => Object.assign(trait(species),def);
  const speciesOf=c=>c?.cat?.species||c?.species;
  const near=(a,b,r)=>Math.hypot(a.x-b.x,a.y-b.y)<=r;
  const heavy=sk=>!!sk?.heavy||['pounce','leap'].includes(sk?.kind);
  const mark=(c,b,target=c,phase='fire',data={})=>{
    if(!c||!target)return;
    b._traitFX ||= [];
    if(b._traitFX.length>=96)b._traitFX.shift();
    b._traitFX.push({species:speciesOf(c),phase,x:target.x,y:target.y,ox:c.x,oy:c.y,start:b.t,life:phase==='ready'?.65:.8,...data});
  };
  const bonus=(ctx,amount)=>{
    if(amount>0&&ctx.target?.alive){ctx.battle.hurtEnemy(ctx.target,amount,ctx.target.x,ctx.target.y,true);mark(ctx.cat,ctx.battle,ctx.target);}
  };
  set('tangyuan',{subscribedEvents:['onDamageTaken','onHitResolved','onTick'],triggerCondition:()=>true,effect(ctx){
    const c=ctx.cat,b=ctx.battle;
    if(ctx._event==='onDamageTaken'&&ctx.dmg>0){c._emberCharge=Math.min(c.maxhp*.6,(c._emberCharge||0)+ctx.dmg*.25);c._emberT=b.t;mark(c,b,c,'ready');}
    else if(ctx._event==='onHitResolved'&&heavy(ctx.skill)&&ctx.skill.kind==='melee'&&c._emberCharge>0){const n=Math.min(c._emberCharge,ctx.dmg*1.2);c._emberCharge=0;bonus(ctx,n);}
    else if(ctx._event==='onTick'&&b.t-(c._emberT??-99)>5)c._emberCharge=Math.max(0,(c._emberCharge||0)-c.maxhp*.05*(ctx.dt||0));
  }});
  set('dundun',{subscribedEvents:['onShieldBreak'],triggerCondition:ctx=>ctx.reason==='enemyHit'&&ctx.cat.alive,effect(ctx){
    const c=ctx.cat,b=ctx.battle;mark(c,b,c,'fire',{radius:90});
    for(const e of b.enemies){if(!e.alive||!near(c,e,90))continue;const boss=!!(e.boss||e.isBoss||e.rIdx>=3);
      e.status ||= {};const tag=boss?'soak':'chill';e.status[tag]=Math.max(e.status[tag]||0,boss?1.5:1.2);
      e.tags ||= [];if(!e.tags.includes(tag))e.tags.push(tag);
      if(boss){e._slowMult=.5;e._slowT=b.t+1.5;}
      if(boss&&Number.isFinite(e.poise))e.poise=Math.max(1,e.poise-(e.poiseMax||60)*.20);
      b.hurtEnemy(e,c.dmg*.6,e.x,e.y,true);
    }
  }});
  set('jiafei',{subscribedEvents:['onBeforeDamage'],triggerCondition:ctx=>ctx.target&&ctx.target!==ctx.cat&&ctx.cat.alive&&speciesOf(ctx.target)!=='jiafei'&&near(ctx.cat,ctx.target,220)&&ctx.dmg>0,effect(ctx){
    const c=ctx.cat,b=ctx.battle,n=Math.min(ctx.dmg*.30,Math.max(0,c.hp-1));
    if(n<=0)return;ctx.dmg-=n;b.hurtMe(n,c.x,c.y,c,{redirected:true});mark(c,b,ctx.target,'fire',{link:true});
  }});
  set('yunduo',{subscribedEvents:['onHealResolved'],triggerCondition:ctx=>ctx.amount>0&&ctx.target&&ctx.target!==ctx.cat,effect(ctx){
    const c=ctx.cat,b=ctx.battle;
    c._linkUntil ||= new WeakMap();c._linked ||= [];
    c._linked=c._linked.filter(a=>a!==ctx.target&&a.alive&&(c._linkUntil.get(a)||0)>b.t);
    for(const a of c._linked){if(speciesOf(a)==='yunduo'||!near(c,a,300))continue;const n=Math.min(a.maxhp-a.hp,ctx.amount*.25);if(n>0){a.hp+=n;mark(c,b,a,'fire',{link:true});}}
    if(speciesOf(ctx.target)!=='yunduo'){c._linked.unshift(ctx.target);c._linked.length=Math.min(2,c._linked.length);c._linkUntil.set(ctx.target,b.t+4);mark(c,b,ctx.target,'ready',{link:true});}
  }});
  set('bosi',{subscribedEvents:['onHealResolved','onTick'],triggerCondition:()=>true,effect(ctx){
    const c=ctx.cat,b=ctx.battle;if(ctx._event==='onHealResolved'){
      const a=ctx.target,n=Math.max(0,(ctx.requested||0)-ctx.amount)*.6;
      if(n>0){a._traitArmor=Math.min(a.maxhp*.25,(a._traitArmor||0)+n);mark(c,b,a);}
    }else{for(const a of b.team||[])if(a._traitArmor>0)a._traitArmor=Math.max(0,a._traitArmor-a.maxhp*.1*(ctx.dt||0)/Math.max(1,(b.team||[]).filter(x=>speciesOf(x)==='bosi'&&x.alive).length));}
  }});
  set('nainai',{subscribedEvents:['onCleanse'],triggerCondition:ctx=>!!ctx.target,effect(ctx){const a=ctx.target;a._cleanseGuardUntil=ctx.battle.t+2;mark(ctx.cat,ctx.battle,a,'fire',{link:true});}});
  // Shared team ult meter: a bounded bonus to actual team charge, not a fake per-cat counter.
  set('jinjc',{subscribedEvents:['onResourceGained'],internalCooldown:4,triggerCondition:ctx=>ctx.amount>0&&ctx.battle.ult<100&&(ctx.battle.team||[]).some(a=>a.alive&&a!==ctx.cat),effect(ctx){
    const c=ctx.cat,b=ctx.battle;const a=b.team.find(a=>a.alive&&a!==c);b.ult=Math.min(100,b.ult+Math.min(4,ctx.amount));mark(c,b,a,'fire',{link:true});
  }});
  const oldQ=trait('qisi').effect;
  set('qisi',{subscribedEvents:['onHitResolved','onTick'],triggerCondition:ctx=>ctx._event==='onTick'||ctx.skill?.kind==='melee',effect(ctx){const c=ctx.cat,b=ctx.battle;if(ctx._event==='onTick'){if(b.t-(c._qisiStreakT??-99)>3)c._qisiStreak=0;return;}if(b.t-(c._qisiStreakT??-99)>3)c._qisiStreak=0;oldQ(ctx);mark(c,b,ctx.target);}});
  set('lanbao',{triggerCondition:ctx=>!!ctx.target&&!!ctx.skill&&(heavy(ctx.skill)&&ctx.target._frostStack>0||['chill','soak'].includes(ctx.skill.appliesTag)),effect(ctx){
    const e=ctx.target,b=ctx.battle,c=ctx.cat;if(b.t-(e._frostStackT??-99)>5)e._frostStack=0;
    if(heavy(ctx.skill)&&e._frostStack>0){const n=e._frostStack;e._frostStack=0;bonus(ctx,ctx.dmg*.3*n);}
    else if(['chill','soak'].includes(ctx.skill.appliesTag)){e._frostStack=Math.min(5,(e._frostStack||0)+1);e._frostStackT=b.t;mark(c,b,e,'ready');}
  }});
  for(const species of ['lixiao','sanhua']){
    set(species,{subscribedEvents:['onSkillCast','onHitResolved'],triggerCondition:ctx=>!!ctx.skill?.id&&!ctx.skill.isBasic&&!ctx.skill.ultCost,effect(ctx){
      const c=ctx.cat,b=ctx.battle,sk=ctx.skill;
      if(ctx._event==='onSkillCast'){
        if(species==='lixiao'){const d=b.t-(c._lixiaoLastSkillT??-99);c._lixiaoRhythm=d>=.8&&d<=1.4?Math.min(3,(c._lixiaoRhythm||0)+1):0;c._lixiaoLastSkillT=b.t;sk._traitBonus=.12*c._lixiaoRhythm;}
        else {c._sanhuaCombo=c._sanhuaLastSkillId&&c._sanhuaLastSkillId!==sk.id?Math.min(4,(c._sanhuaCombo||0)+1):0;c._sanhuaLastSkillId=sk.id;sk._traitBonus=.15*c._sanhuaCombo;}
        if(sk._traitBonus>0)mark(c,b,c,'ready');
      }else if(sk._traitBonus>0&&!sk._traitBonusUsed){sk._traitBonusUsed=true;bonus(ctx,ctx.dmg*sk._traitBonus);}
    }});
  }
  // Movement paths use distance from the last emitted point, not per-frame delta.
  for(const [species,key,spacing,ttl] of [['duanduan','_duanduanTrail',12,1.6],['xuewa','_xuewaTrail',18,2]]){
    set(species,{effect(ctx){
      const c=ctx.cat,b=ctx.battle;let p=c._traitPathAnchor||{x:c.x,y:c.y};c[key] ||= [];
      let d=Math.hypot(c.x-p.x,c.y-p.y),count=0;
      while(d>=spacing&&count++<24){const x=p.x+(c.x-p.x)*spacing/d,y=p.y+(c.y-p.y)*spacing/d;
        c[key].push({x1:p.x,y1:p.y,x2:x,y2:y,x,y,t:b.t});p={x,y};d=Math.hypot(c.x-p.x,c.y-p.y);}
      c._traitPathAnchor=p;c[key]=c[key].filter(seg=>b.t-seg.t<ttl).slice(-64);
      const targets=species==='duanduan'?b.enemies:b.team;c._traitPathHits ||= new WeakMap();
      for(const a of targets||[]){if(!a.alive||a===c||b.t-(c._traitPathHits.get(a)??-99)<.8)continue;
        const crossed=c[key].some(seg=>{const dx=seg.x2-seg.x1,dy=seg.y2-seg.y1,dd=dx*dx+dy*dy||1,u=Math.max(0,Math.min(1,((a.x-seg.x1)*dx+(a.y-seg.y1)*dy)/dd));return Math.hypot(a.x-seg.x1-u*dx,a.y-seg.y1-u*dy)<24;});
        if(!crossed)continue;c._traitPathHits.set(a,b.t);
        if(species==='duanduan'){b.hurtEnemy(a,c.dmg*.12,a.x,a.y,true);a.status ||= {};a.status.shock=Math.max(a.status.shock||0,.5);}
        else{a._speedMult=1.15;a._speedBuffUntil=b.t+1;b.gainUlt(4);}
        mark(c,b,a);
      }
    }});
  }
  set('fanmao',{effect(ctx){const c=ctx.cat,b=ctx.battle,dt=ctx.dt||0;
    for(const fld of b.fields||[]){if(fld.side!=='me'||fld.element!=='water'||fld._traitCaster!==c)continue;
      for(const e of b.enemies||[]){if(!e.alive||!near(e,fld,fld.r))continue;
        const dx=e.x-fld.x,dy=e.y-fld.y,d=Math.hypot(dx,dy);if(d<5)continue;
        const r=Math.max(5,d-42*dt),a=Math.atan2(dy,dx)+.55*dt;e.x=fld.x+r*Math.cos(a);e.y=fld.y+r*Math.sin(a);
      }
    }
  }});
  // Restrict persistent fields to their true creator.
  const oldMeidu=trait('meidu').effect,oldNuowei=trait('nuowei').effect,oldYinghua=trait('yinghua').effect;
  for(const [species,fn] of [['meidu',oldMeidu],['nuowei',oldNuowei],['yinghua',oldYinghua]])set(species,{effect(ctx){
    const b=ctx.battle,fields=b.fields;b.fields=(fields||[]).filter(f=>f._traitCaster===ctx.cat);
    try{fn(ctx);}finally{b.fields=fields;}
  }});
  const oldB=trait('baomao').effect;
  set('baomao',{effect(ctx){
    const c=ctx.cat,e=ctx.target,b=ctx.battle;
    if(ctx._event==='onTargetKilled'&&(e._hunterMark!==c||e._hunterMarkExpire<b.t))return;
    oldB(ctx);if(ctx._event==='onHitResolved'){e._hunterMark=c;e._hunterMarkExpire=b.t+5;mark(c,b,e,'ready');}else{c._speedBuffUntil=b.t+3;c._baomaoChainUntil=b.t+3;mark(c,b,c);}
  }});
  set('doudou',{triggerCondition:ctx=>{
    const e=ctx.target,c=ctx.cat;if(!e||!c||ctx.skill?.kind!=='melee')return false;
    const face=e._moveFacing??(e.face<0?Math.PI:0),a=Math.atan2(c.y-e.y,c.x-e.x);
    return Math.cos(a-face)<-.5;
  }});
  // Actual damage output for previously dead flags is applied in battle.js.
  // All remaining original hit-based traits keep their behavior but emit a
  // localized cue on a real bonus, rather than on every onTick.
  for(const species of ['abi','wumao','moqiu','niuniu','xiaohui','xianluo','yuelian','doudou','jinwu','xingchen','mengmai']){
    const d=trait(species),fn=d.effect;d.effect=function(ctx){
      const b=ctx.battle,e=ctx.target,before=e?.hp;
      fn(ctx);
      if(ctx._event==='onHitResolved'&&e&&(e.hp<before||species==='mengmai'))mark(ctx.cat,b,e);
    };
  }

  // Echo scheduler: onTick must never consume the hit cooldown.
  set('youling',{internalCooldown:0,triggerCondition:()=>true,effect(ctx){
    const c=ctx.cat,b=ctx.battle;
    if(ctx._event==='onHitResolved'){
      if(!ctx.target?.alive||!['projectile','aoe','beam'].includes(ctx.skill?.kind)||b.t<(c._echoReadyAt||0))return;
      c._echoReadyAt=b.t+2.5;c._echoQueue ||= [];
      c._echoQueue.push({at:b.t+1.1,target:ctx.target,x:ctx.target.x,y:ctx.target.y,dmg:ctx.dmg*.4});
      mark(c,b,ctx.target,'ready');return;
    }
    const keep=[];
    for(const h of c._echoQueue||[]){
      if(b.t<h.at){keep.push(h);continue;}
      // A delayed attack lands at the original location, so moving away avoids it.
      if(h.target.alive&&Math.hypot(h.target.x-h.x,h.target.y-h.y)<=48){b.hurtEnemy(h.target,h.dmg,h.x,h.y,true);mark(c,b,h.target);}
    }
    c._echoQueue=keep;
  }});
  // Avoid treating a frame-poll as an ICD-triggering combat event.
  set('mengmai',{triggerCondition:ctx=>ctx.target?._lastAttackT!=null&&ctx.battle.t-ctx.target._lastAttackT<2});
  // Tag burning burst from remaining DoT, not 2.2x arbitrary heavy-hit damage.
  set('jinwu',{effect(ctx){
    const e=ctx.target,c=ctx.cat,b=ctx.battle,ttl=Math.max(0,e.status?.burn||0);
    if(!ttl)return;e.tags=(e.tags||[]).filter(t=>t!=='burn');delete e.status.burn;
    // Provisional coefficient bounded by attack power; tune against runtime DoT rules.
    bonus(ctx,Math.min(c.dmg*1.2,e.maxhp*.012*ttl));
  }});
  window.CatTraits.mark=mark;

})();
