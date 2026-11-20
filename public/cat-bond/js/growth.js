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
  function canAdvance(cat) {
    var st = cat.stage || 0;
    if (st >= 2) return { ok: false, maxed: true };
    var r = req(st, cat); if (!r) return { ok: false, maxed: true };
    var shards = (window.State && State.S.raising && State.S.raising.starShards) || 0;
    var missing = [];
    if (cat.level < r.level) missing.push('Lv.' + r.level);
    if ((cat.affinity || 0) < (r.bond || 0)) missing.push('好感' + r.bond);
    if (r.shards && shards < r.shards) missing.push('星魂×' + r.shards);
    return { ok: missing.length === 0, req: r, missing: missing };
  }

  // advance stage. For stage1→2 you MUST pass an awaken branch key.
  function advance(cat, awakenKey) {
    var chk = canAdvance(cat); if (!chk.ok) return { ok: false, msg: '条件不足' };
    var r = chk.req;
    if (r.shards && window.State) State.S.raising.starShards = Math.max(0, (State.S.raising.starShards || 0) - r.shards);
    cat.stage = (cat.stage || 0) + 1;
    // stat growth on每 stage
    var boost = cat.stage === 2 ? 1.0 : 0.5;  // the 灵 form is the big glow-up
    ['pow', 'agi', 'vit', 'cha'].forEach(function (k) { cat.stats[k] = Math.round(cat.stats[k] * (1 + boost * 0.3) + (cat.stage === 2 ? 6 : 3)); });
    if (cat.stage === 2) {
      cat.awaken = (awakenKey && AWAKEN[awakenKey]) ? awakenKey : 'pow';
      var m = AWAKEN[cat.awaken].mult;
      ['pow', 'agi', 'vit', 'cha'].forEach(function (k) { cat.stats[k] = Math.round(cat.stats[k] * m[k]); });
    }
    return { ok: true, stage: cat.stage, awaken: cat.awaken };
  }

  // visual descriptor consumed by catart to render the glow-up
  function visual(cat) {
    var st = cat.stage || 0;
    if (st <= 0) return null;
    return {
      stage: st,
      scale: st === 2 ? 1.18 : 1.07,      // bigger forms
      aura: st === 2 ? (AWAKEN[cat.awaken] ? AWAKEN[cat.awaken].color : '#ffd36b') : null,
      sparkle: st === 2,
      gem: st >= 1,                        // a floating gem badge
      gemColor: st === 2 && AWAKEN[cat.awaken] ? AWAKEN[cat.awaken].color : '#cbd4ff',
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
