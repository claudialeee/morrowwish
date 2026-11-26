// growth.js — universal "Growth Forms" evolution (window.Growth).
// Every cat advances through stages on its OWN instance (no species swap, no
// dead-ends): 幼 → 成 → 灵(觉醒). The final stage BRANCHES by playstyle
// (力/速/心), giving the same cat different auras + bonuses → replayability.
// AFK-shaped: stage requirements are met by the leveling station-cats do while away.

(function () {
  // stage display
  var STAGES = [
    { key: 0, name: '幼', tag: '' },
    { key: 1, name: '成', tag: '◆' },
    { key: 2, name: '灵', tag: '★' },
  ];

  // requirement to advance to the NEXT stage (index = current stage)
  // stage0→1 cheap & early (quick first payoff); stage1→2 a long AFK goal.
  function req(stage, cat) {
    if (stage === 0) return { level: 8, bond: 20 };
    if (stage === 1) return { level: 20, bond: 60, shards: 30 };
    return null;
  }

  // awakening branches (chosen at stage 1→2). Each = aura color + a combat bonus.
  var AWAKEN = {
    pow: { name: '力之灵', color: '#ff7a3c', desc: '攻击力大幅提升', mult: { pow: 1.5, agi: 1.1, vit: 1.2, cha: 1.1 } },
    agi: { name: '速之灵', color: '#56ccf2', desc: '敏捷与冷却缩减', mult: { pow: 1.15, agi: 1.5, vit: 1.1, cha: 1.15 } },
    cha: { name: '心之灵', color: '#ff9db0', desc: '魅力与纽带增益', mult: { pow: 1.1, agi: 1.15, vit: 1.2, cha: 1.5 } },
  };

  function stageName(cat) {
    var s = STAGES[cat.stage || 0];
    if ((cat.stage || 0) >= 2 && cat.awaken && AWAKEN[cat.awaken]) return AWAKEN[cat.awaken].name;
    return s ? s.name + '形态' : '幼';
  }
  function stageTag(cat) { var s = STAGES[cat.stage || 0]; return s ? s.tag : ''; }

  // can this cat advance now? returns {ok, req, missing:[..]}
  // Growth progression has been retired. Keep visual helpers below solely
  // for backwards compatibility with existing player saves.
  function canAdvance() { return { ok: false, disabled: true }; }
  function advance() { return { ok: false, disabled: true, msg: '成长功能已移除' }; }

  // visual descriptor consumed by catart to render the glow-up
  function visual(cat) {
    var st = cat.stage || 0;
    if (st <= 0) return null;
    return {
      stage: st,
      // Retired progression has no approved independent mature paintings.
      // Keep the original breed identity and visual footprint for legacy saves.
      // Stage data and powerMult remain intact; no synthetic transformation.
      scale: 1,
      aura: null,
      sparkle: false,
      gem: false,
      gemColor: null,
    };
  }

  // combat power multiplier from stage (battle reads this)
  function powerMult(cat) {
    var st = cat.stage || 0;
    return 1 + st * 0.12;
  }

  window.Growth = {
    STAGES: STAGES, AWAKEN: AWAKEN,
    req: req, canAdvance: canAdvance, advance: advance,
    stageName: stageName, stageTag: stageTag, visual: visual, powerMult: powerMult,
  };
})();
