// SKILL_RUNTIME — shadow source for per-skill runtime metadata currently scattered as
// `if(sk.id==='x')` branches across public/cat-bond/js/battle.js. Phase 1 of the Combat
// Assessment 2026-11-26 refactor (docs/combat-redesign/COMBAT-ASSESSMENT-20261126.md): this
// registry is READ-ONLY and NOT YET WIRED into battle.js. It exists so a drift checker can
// catch the day someone adds a new `sk.id==='…'` branch without a registry entry, or edits
// a registered branch without updating the shadow.
//
// FIELD SCHEMA ---------------------------------------------------------------------------
//   kind                 Semantic family (not the Skills.js `kind`, which is the dispatcher
//                        bucket). May be 'aoe-lob' | 'aoe-lob-salvo' | 'beam' |
//                        'projectile-direct' | 'projectile-homing' | 'projectile-lance' |
//                        'projectile-salvo-charge' | 'chain' | 'field-aoe' | 'melee' |
//                        'dash' | 'pounce' | 'heal'.
//   windup               Seconds of cast-time before the skill fires (meteor telegraph window).
//   channel              Seconds of sustained beam / field.
//   reach                Hit-range cap in pixels (matches `sk.reach`).
//   radius / width       AoE burst radius, beam lane width.
//   speed / projR        Projectile velocity and radius (where branch set them explicitly).
//   projLife             Max flight life (seconds) of the projectile.
//   projKind             Canvas sprite key used by battle.js draw loop (p.kind).
//   lobCount / lobGap / lobFlight / lobRadius / lobSpread   Salvo lobs (arcanePulse).
//   pulseCount / pulseGap / chargeT / chargeLock            Charge-salvo pulses (crescentFan).
//   homing               Homing turn-rate (lightningOrb).
//   targetMode           How the destination is chosen:
//                        'cast-mouse-snapshot'  snapshot of mouse at cast (meteor/lobAoe)
//                        'ai-nearest'           nearestEnemy / lockedEnemy
//   vfx                  Human-friendly label for the special visual path.
//   specialHandler       Dispatcher method on CaptureBattle that owns this skill.
//   skipCastAccent       If true, battle.js suppresses the generic cast accent (L2735).
//   fullReachDraw        If true, drawCombatBeam uses raw _ex/_ey (not clipped at first hit).
//   customBeamDraw       If true, battle.js replaces the default beam renderer.
//   pierce               Beam / lance hits every enemy along its axis.
//   multiPass            Beam has per-pass hit budget (flameSweep's _flameHits WeakMap).
//   fireGateDist         Explicit override of the AI "within fire range" distance (prismBeam).
//   handlers             Secondary call-sites: ordered list of {where, note} for the day we
//                        flatten multi-site behavior into a single resolver.
//   inferred             true => no explicit `sk.id===` branch in battle.js; this entry only
//                        documents the kind-based routing. drift checker DOES NOT regex-verify
//                        inferred entries, since there is no branch to detect.
//   _sources             Array of {file, line, regex} — regex is a string the drift checker
//                        feeds through `new RegExp(…)` and asserts STILL MATCHES battle.js
//                        source. One mismatch = drift. Line numbers are at Phase 1 freeze.
//
// Last synced against public/cat-bond/js/battle.js on 2026-11-26.
// If you touch a registered skill in battle.js, re-run `node scripts/check-skill-registry-drift.mjs`.

export const SKILL_RUNTIME = {
  // -- AoE lobs ------------------------------------------------------------------------
  meteor: {
    kind: 'aoe-lob',
    windup: 1.5,
    targetMode: 'cast-mouse-snapshot',
    reach: 240,
    radius: 86,
    projKind: 'fireball',
    vfx: 'meteor-descent',
    specialHandler: 'meteorImpact',
    telegraph: 'red-pulsing-ring',
    handlers: [
      { where: 'lobAoe landing freeze', note: 'L2870-2872: force ≥0.72s flight, snap to tx/ty, zero velocity' },
      { where: 'projectile burst gate', note: 'L5131: meteor skips mid-flight proximity detonation' },
      { where: 'pendingCast telegraph', note: 'L3261-3291: red ring + crosshair on cast-mouse snapshot' },
      { where: 'burstAt specialFX', note: 'L2940: window.CatBondSkillFX?.meteorImpact' },
    ],
    _sources: [
      { file: 'public/cat-bond/js/battle.js', regex: "if\\s*\\(c\\.sk\\s*&&\\s*c\\.sk\\.id\\s*===\\s*'meteor'\\s*\\)" },
      { file: 'public/cat-bond/js/battle.js', regex: "if\\s*\\(sk\\?\\.id\\s*===\\s*'meteor'\\s*\\)" },
      { file: 'public/cat-bond/js/battle.js', regex: "p\\.burst\\.skill\\?\\.id\\s*!==\\s*'meteor'" },
      { file: 'public/cat-bond/js/battle.js', regex: "b\\.skill\\?\\.id\\s*===\\s*'meteor'" },
    ],
  },

  // -- Direct projectiles --------------------------------------------------------------
  fireballMeow: {
    kind: 'projectile-direct',
    windup: 0.18,
    speed: 420,       // player
    enemySpeed: 225,
    projR: 15,
    projLife: 0.76,
    enemyProjLife: 1.8,
    projKind: 'fireball',
    vfx: 'fireball-tapered',
    handlers: [
      { where: 'castDistinctProjectile', note: 'L2173: player spawn + muzzle burst' },
      { where: 'castEnemySkill', note: 'L5950,5960-5962: enemy spawn uses slower speed/longer life' },
    ],
    _sources: [
      { file: 'public/cat-bond/js/battle.js', regex: "sk\\.id\\s*===\\s*'fireballMeow'" },
      { file: 'public/cat-bond/js/battle.js', regex: "sid\\s*===\\s*'fireballMeow'" },
    ],
  },

  lightningOrb: {
    kind: 'projectile-homing',
    speed: 108,                       // deliberately slow drift
    projR: 13,
    projRMax: 20,
    projLife: 6.5,
    enemyProjLife: 3.3,
    homing: 3.4,
    projKind: 'lightningOrb',
    vfx: 'lightningOrb-crackle',
    specialHandler: 'lightningOrbSplit',
    splitAfter: { time: 1.0, dist: 180, count: 3, dmgMul: 0.33 },
    handlers: [
      { where: 'castDistinctProjectile', note: 'L2160-2171: spawnProj with growth markers _lioBorn/_lioRMax' },
      { where: 'projectile tick split', note: 'L5096-5109: discharges into 3 homing orblets if miss-insurance fires' },
      { where: 'on-hit sparkle', note: 'L5148-5152: wide burst feedback when any orb connects' },
      { where: 'draw sprite', note: 'L7014-7027: crackling orb silhouette (p.kind==="lightningOrb")' },
    ],
    _sources: [
      { file: 'public/cat-bond/js/battle.js', regex: "if\\s*\\(id\\s*===\\s*'lightningOrb'\\s*\\)" },
      { file: 'public/cat-bond/js/battle.js', regex: "if\\s*\\(p\\.kind\\s*===\\s*'lightningOrb'\\s*&&\\s*!p\\._lioSplit\\s*\\)" },
      { file: 'public/cat-bond/js/battle.js', regex: "sk\\.id\\s*===\\s*'lightningOrb'" },
    ],
  },

  prismBeam: {
    kind: 'projectile-lance',
    reach: 525,                        // actual lance reach
    bandReach: 520,                    // skillEngageReach override
    width: 21,
    fireGateDist: 525,
    projKind: 'prism',
    vfx: 'prism-lance',
    handlers: [
      { where: 'skillEngageReach override', note: 'L1111: projectile case bumps to 520 for this id' },
      { where: 'fire-gate override', note: 'L1532: accept fires if dist<525 (ignores default projectile band)' },
      { where: 'lance geometry', note: 'L2111-2130: shared frostLance/prismBeam ray with 4 ring markers' },
    ],
    _sources: [
      { file: 'public/cat-bond/js/battle.js', regex: "sk\\.id\\s*===\\s*'prismBeam'\\s*\\?\\s*520" },
      { file: 'public/cat-bond/js/battle.js', regex: "if\\s*\\(sk\\.id\\s*===\\s*'prismBeam'\\s*\\)\\s*return\\s+dist\\s*<\\s*525" },
      { file: 'public/cat-bond/js/battle.js', regex: "if\\s*\\(id\\s*===\\s*'frostLance'\\s*\\|\\|\\s*id\\s*===\\s*'prismBeam'\\s*\\)" },
    ],
  },

  crescentFan: {
    kind: 'projectile-salvo-charge',
    pulseCount: 3,
    pulseGap: 0.45,
    chargeT: 2.5,
    chargeLock: true,
    projKind: 'crescent',
    projR: 22,
    overheadOff: -48,
    accelProfile: { startSpdMul: 1.0, accel: 1600 },
    vfx: 'moonHover + moonImpact',
    skipImpactType: true,
    handlers: [
      { where: 'castDistinctProjectile', note: 'L2197-2260: queue 3 waves w/ chargeLock + moonHover stroke' },
      { where: 'projectile on-hit', note: 'L5147: crescent spawns moonImpact stroke on hit' },
      { where: 'impact gate', note: 'L6340: skip generic impactType unless crit (moon-fx owns the hit)' },
    ],
    _sources: [
      { file: 'public/cat-bond/js/battle.js', regex: "if\\s*\\(sk\\.id\\s*===\\s*'crescentFan'\\s*\\)" },
      { file: 'public/cat-bond/js/battle.js', regex: "skill\\?\\.id\\s*!==\\s*'crescentFan'" },
      { file: 'public/cat-bond/js/battle.js', regex: "p\\.kind\\s*===\\s*'crescent'\\s*&&\\s*r\\.dealt\\s*>\\s*0" },
    ],
  },

  // -- Chain ----------------------------------------------------------------------------
  boltArc: {
    kind: 'chain',
    chainCount: 3,
    chainRanges: [440, 205, 205],
    damageDecay: 0.23,
    projKind: 'lightningOrb',          // enemy fallback sprite
    vfx: 'lightning-beam',
    handlers: [
      { where: 'castDistinctProjectile', note: 'L2132-2150: 3-hop chain, 23% damage decay per hop' },
      { where: 'castVolley sprite map', note: 'L2819: boltArc → lightningOrb sprite kind' },
      { where: 'castEnemySkill sprite map', note: 'L5953: enemy boltArc → lightningOrb sprite' },
    ],
    _sources: [
      { file: 'public/cat-bond/js/battle.js', regex: "if\\s*\\(id\\s*===\\s*'boltArc'\\s*\\)" },
      { file: 'public/cat-bond/js/battle.js', regex: "sk\\.id\\s*===\\s*'boltArc'" },
      { file: 'public/cat-bond/js/battle.js', regex: "sid\\s*===\\s*'boltArc'" },
    ],
  },

  // -- Beams ----------------------------------------------------------------------------
  waterJet: {
    kind: 'beam',
    channel: 1.2,
    reach: 300,
    width: 12,
    pierce: true,
    skipCastAccent: true,
    fullReachDraw: true,
    vfx: 'waterPierce',
    handlers: [
      { where: 'regularSkillAccent skip', note: 'L2735: waterJet listed in accent-exception array' },
      { where: 'tickBeams pierce path', note: 'L3371,3374: pierce lane, candidates filtered by projection' },
      { where: 'beamHitFeedback stroke', note: 'L3432-3433: waterPierce skill stroke on hit' },
      { where: 'drawCombatBeam full-reach', note: 'L4375: full _ex/_ey used instead of visual-end clip' },
    ],
    _sources: [
      { file: 'public/cat-bond/js/battle.js', regex: "'waterJet'" },
      { file: 'public/cat-bond/js/battle.js', regex: "b\\.sk\\?\\.id\\s*===\\s*'waterJet'" },
      { file: 'public/cat-bond/js/battle.js', regex: "\\['waterJet','shadowTendrils'\\]" },
    ],
  },

  shadowTendrils: {
    kind: 'beam',
    windup: 0.22,
    channel: 1.6,
    castSlow: 0.4,
    reach: 240,
    width: 30,
    pierce: true,
    skipCastAccent: true,
    fullReachDraw: true,
    vfx: 'shadowBindHit',
    applyStatus: 'bind',
    statusDuration: 0.65,
    handlers: [
      { where: 'regularSkillAccent skip', note: 'L2735: shadowTendrils in accent-exception array' },
      { where: 'tickBeams pierce', note: 'L3371,3374: shadow is pierce beam' },
      { where: 'beamHitFeedback stroke', note: 'L3430-3431: shadowBindHit stroke on hit' },
      { where: 'drawCombatBeam full-reach', note: 'L4375: full _ex/_ey used instead of clip' },
    ],
    _sources: [
      { file: 'public/cat-bond/js/battle.js', regex: "'shadowTendrils'" },
      { file: 'public/cat-bond/js/battle.js', regex: "b\\.sk\\?\\.id\\s*===\\s*'shadowTendrils'" },
    ],
  },

  flameSweep: {
    kind: 'beam',
    channel: 2.7,
    reach: 156,
    width: 22,
    sweep: 0.72,
    sweepPasses: 3,
    multiPass: true,
    fullReachDraw: true,
    customBeamDraw: true,
    vfx: 'flameSweep-fan',
    handlers: [
      { where: 'tickBeams per-pass hit budget', note: 'L3371,3389-3399: _flameHits WeakMap gates per-pass damage' },
      { where: 'drawCombatBeam full-reach', note: 'L4375: full _ex/_ey (flame is listed alongside waterJet/shadowTendrils)' },
      { where: 'custom fan renderer', note: 'L4407+: authored fan geometry + gradient' },
    ],
    _sources: [
      { file: 'public/cat-bond/js/battle-draw.js', regex: "b\\.sk\\?\\.id\\s*===\\s*'flameSweep'" },
      { file: 'public/cat-bond/js/battle-draw.js', regex: "\\['flameSweep','waterJet','shadowTendrils'\\]" },
    ],
  },

  thunderStream: {
    kind: 'beam',
    channel: 1.22,
    reach: 270,
    width: 13,
    customBeamDraw: true,
    projKind: 'lightningOrb',          // sprite kind for castVolley fallback
    vfx: 'thunderStream-lightning',
    handlers: [
      { where: 'castVolley sprite map', note: 'L2819-2820: thunderStream → lightningOrb sprite kind' },
      { where: 'drawCombatBeam custom', note: 'L4378-4405: jagged forked lightning trunk + side forks' },
    ],
    _sources: [
      { file: 'public/cat-bond/js/battle.js', regex: "sk\\.id\\s*===\\s*'thunderStream'" },
      { file: 'public/cat-bond/js/battle-draw.js', regex: "b\\.sk\\?\\.id\\s*===\\s*'thunderStream'" },
    ],
  },

  // -- AoE / field salvo ----------------------------------------------------------------
  arcanePulse: {
    kind: 'aoe-lob-salvo',
    lobCount: 3,
    lobGap: 0.42,
    lobFlight: 0.76,
    lobRadius: 46,
    lobSpread: 24,
    reach: 340,
    skipCastAccent: true,
    vfx: 'umbralLob + umbralGround',
    specialHandler: 'castUmbralBarrage',
    handlers: [
      { where: 'regularSkillAccent skip', note: 'L2735: arcanePulse in accent-exception array' },
      { where: 'player dispatch', note: 'L2762: route player cast to castUmbralBarrage' },
      { where: 'enemy dispatch', note: 'L5900: route enemy cast to castUmbralBarrage (owner=wild)' },
      { where: 'ground stroke on impact', note: 'L2927: skillStrokes push signatureHit/umbralGround at impact' },
    ],
    _sources: [
      { file: 'public/cat-bond/js/battle.js', regex: "sk\\.id\\s*===\\s*'arcanePulse'" },
      { file: 'public/cat-bond/js/battle.js', regex: "'arcanePulse'" },
      { file: 'public/cat-bond/js/battle.js', regex: "skillId:'arcanePulse'" },
    ],
  },

  magneticField: {
    kind: 'field-aoe',
    reach: 180,
    skipCastAccent: true,
    specialHandler: 'castMagneticField',
    fieldKind: 'magneticField',
    vfx: 'magnetic-twin-pole',
    handlers: [
      { where: 'regularSkillAccent skip', note: 'L2735: magneticField in accent-exception array' },
      { where: 'player dispatch', note: 'L2760: route player cast to castMagneticField' },
      { where: 'enemy dispatch', note: 'L5901: route enemy cast to castMagneticField (owner=wild)' },
      { where: 'field tick', note: 'L3009: tickMagneticField owns pole attract + shock tick' },
      { where: 'field draw', note: 'L4282: CatBondMagneticFX.draw hook' },
    ],
    _sources: [
      { file: 'public/cat-bond/js/battle.js', regex: "sk\\.id\\s*===\\s*'magneticField'" },
      { file: 'public/cat-bond/js/battle.js', regex: "'magneticField'" },
      { file: 'public/cat-bond/js/battle.js', regex: "fld\\.kind\\s*===\\s*'magneticField'" },
    ],
  },

  // -- Direct projectiles (secondary — covered only by sprite/tuning branches) ---------
  hex: {
    kind: 'projectile-direct',
    speed: 204,
    projR: 13,
    projLife: 1.85,
    projKind: 'hex',
    vfx: 'hex-orb',
    handlers: [
      { where: 'castDistinctProjectile', note: 'L2178-2181: hex spawnProj + orb VFX' },
      { where: 'castVolley sprite map', note: 'L2817: hex → hex sprite kind' },
      { where: 'castEnemySkill tuning', note: 'L5951/5960-5962: slower speed + longer life than default' },
    ],
    _sources: [
      { file: 'public/cat-bond/js/battle.js', regex: "if\\s*\\(id\\s*===\\s*'hex'\\s*\\)" },
      { file: 'public/cat-bond/js/battle.js', regex: "sk\\.id\\s*===\\s*'hex'" },
      { file: 'public/cat-bond/js/battle.js', regex: "sid\\s*===\\s*'hex'" },
    ],
  },

  leafDart: {
    kind: 'projectile-fan',
    projKind: 'leaf',
    spreadAng: 0.16,
    fanCount: 3,
    vfx: 'leaf-dart-fan',
    handlers: [
      { where: 'castDistinctProjectile', note: 'L2152-2158: 3-dart spread at ±0.16 rad, projSpeed*1.28' },
      { where: 'castVolley sprite map', note: 'L2818: leafDart → leaf sprite kind' },
    ],
    _sources: [
      { file: 'public/cat-bond/js/battle.js', regex: "if\\s*\\(id\\s*===\\s*'leafDart'\\s*\\)" },
      { file: 'public/cat-bond/js/battle.js', regex: "sk\\.id\\s*===\\s*'leafDart'" },
      { file: 'public/cat-bond/js/battle.js', regex: "sid\\s*===\\s*'leafDart'" },
    ],
  },

  frostLance: {
    kind: 'projectile-lance',
    reach: 480,
    width: 19,
    projKind: 'ice',
    vfx: 'frost-lance',
    handlers: [
      { where: 'lance geometry', note: 'L2111-2130: shared frostLance/prismBeam ray; ice kind + damage mul 1.12' },
    ],
    _sources: [
      { file: 'public/cat-bond/js/battle.js', regex: "if\\s*\\(id\\s*===\\s*'frostLance'\\s*\\|\\|\\s*id\\s*===\\s*'prismBeam'\\s*\\)" },
    ],
  },

  voidMaw: {
    kind: 'projectile-direct',
    projKind: 'hex',
    vfx: 'hex-orb',
    inferred: false,
    handlers: [
      { where: 'castVolley sprite map', note: 'L2817: voidMaw → hex sprite kind' },
      { where: 'castEnemySkill sprite map', note: 'L5951: enemy voidMaw → hex sprite' },
    ],
    _sources: [
      { file: 'public/cat-bond/js/battle.js', regex: "sk\\.id\\s*===\\s*'voidMaw'" },
      { file: 'public/cat-bond/js/battle.js', regex: "sid\\s*===\\s*'voidMaw'" },
    ],
  },

  homingSeed: {
    kind: 'projectile-homing',
    projKind: 'leaf',
    vfx: 'leaf-homing',
    handlers: [
      { where: 'castVolley sprite map', note: 'L2818: homingSeed → leaf sprite kind' },
      { where: 'castEnemySkill sprite map', note: 'L5952: enemy homingSeed → leaf sprite' },
    ],
    _sources: [
      { file: 'public/cat-bond/js/battle.js', regex: "sk\\.id\\s*===\\s*'homingSeed'" },
      { file: 'public/cat-bond/js/battle.js', regex: "sid\\s*===\\s*'homingSeed'" },
    ],
  },

  thunderYowl: {
    kind: 'projectile-direct',
    projKind: 'lightningOrb',
    vfx: 'lightningOrb-sprite',
    handlers: [
      { where: 'castVolley sprite map', note: 'L2819: thunderYowl → lightningOrb sprite kind' },
      { where: 'castEnemySkill sprite map', note: 'L5953: enemy thunderYowl → lightningOrb sprite' },
    ],
    _sources: [
      { file: 'public/cat-bond/js/battle.js', regex: "sk\\.id\\s*===\\s*'thunderYowl'" },
      { file: 'public/cat-bond/js/battle.js', regex: "sid\\s*===\\s*'thunderYowl'" },
    ],
  },

  // -- Ultimate-id branches (ultCost>0 archetype overrides) ----------------------------
  sunbloom: {
    kind: 'ult-beam',
    reach: 'solarGeometry',           // reach pulled from this.solarGeometry(f,aim)
    width: 36,
    ultDuration: 1.1,
    ultChargeT: 0.85,
    rootCaster: true,
    specialHandler: 'solarGeometry + solarHits',
    vfx: 'solar-beam',
    handlers: [
      { where: 'reach-check predicate', note: 'L3663: use solarGeometry to decide "any enemy in reach"' },
      { where: 'ultimate charge branch', note: 'L3712-3716: _solarUlt commits aim + roots caster for 0.85s' },
      { where: 'ultArchetype override', note: 'L3771-3773: solar geometry damage pass, replaces per-element archetype' },
      { where: 'skillStroke duration', note: 'L3842-3848: sunbloom = 1.1s duration + reach/width from solarGeometry' },
    ],
    _sources: [
      { file: 'public/cat-bond/js/battle.js', regex: "skill\\?\\.id\\s*===\\s*'sunbloom'" },
      { file: 'public/cat-bond/js/battle.js', regex: "skill\\.id\\s*===\\s*'sunbloom'" },
    ],
  },

  moonfang: {
    kind: 'ult-dual-slash',
    specialHandler: 'moonfang-fang-slash',
    vfx: 'moonfang-burst + shockwave',
    handlers: [
      { where: 'ultArchetype branch', note: 'L3740-3749: two-fang strike at target, 1.08 mult in radius diag*0.25' },
    ],
    _sources: [
      { file: 'public/cat-bond/js/battle.js', regex: "skill\\.id\\s*===\\s*'moonfang'" },
    ],
  },

  tsunamiPaw: {
    kind: 'ult-wave',
    ultDuration: 1.5,
    vfx: 'tsunami-wave',
    handlers: [
      { where: 'skillStroke duration', note: 'L3842-3843: tsunamiPaw = 1.5s ultimate stroke duration' },
    ],
    _sources: [
      { file: 'public/cat-bond/js/battle.js', regex: "skill\\.id\\s*===\\s*'tsunamiPaw'" },
    ],
  },

  quakeStomp: {
    kind: 'melee',
    applyStatus: 'stagger',
    specialHandler: 'triggerStagger',
    vfx: 'stagger',
    handlers: [
      { where: 'leap-slam stagger tag', note: 'L3183: leapSkill.id===quakeStomp triggers stagger follow-up' },
      { where: 'poise shatter', note: 'L6141-6143: quakeStomp (or stagger-tagged) always triggerStagger on hit' },
    ],
    _sources: [
      { file: 'public/cat-bond/js/battle.js', regex: "f\\._leapSkill\\?\\.id\\s*===\\s*'quakeStomp'" },
      { file: 'public/cat-bond/js/battle.js', regex: "skill\\.id\\s*===\\s*'quakeStomp'" },
    ],
  },

  // -- Pure kind-driven (NO explicit sk.id=== branch in battle.js) ---------------------
  // These are included to document the full skill surface the refactor will absorb, but
  // the drift checker does NOT regex-verify them because there is no branch to detect.
  // If future owner tweaks ADD an id branch, flip `inferred:false` and populate _sources.

  voltRush: {
    kind: 'dash',
    inferred: true,
    power: 2.3,
    heavy: true,
    applyStatus: 'shock',
    note: 'Routed via dispatcher kind="dash" → dashLunge; no id-branch in battle.js today.',
    _sources: [],
  },

  apexPounce: {
    kind: 'pounce',
    inferred: true,
    power: 2.3,
    heavy: true,
    note: 'Routed via dispatcher kind="pounce" → flyingPounce; no id-branch today.',
    _sources: [],
  },

  thornCoil: {
    kind: 'melee',
    inferred: true,
    power: 1.55,
    applyStatus: 'bleed',
    note: 'Routed via dispatcher kind="melee" → meleeStrike; no id-branch today.',
    _sources: [],
  },

  grooming: {
    kind: 'heal',
    inferred: true,
    healMode: 'area',
    note: 'Routed via castSupportSkill kind="heal"; no id-branch in battle.js.',
    _sources: [],
  },
};

// Convenience: all registered ids (stable order = iteration order).
export const SKILL_RUNTIME_IDS = Object.keys(SKILL_RUNTIME);

// Ids that the drift checker SHOULD regex-verify against battle.js source.
export const SKILL_RUNTIME_VERIFIED_IDS = SKILL_RUNTIME_IDS.filter(id => !SKILL_RUNTIME[id].inferred);
