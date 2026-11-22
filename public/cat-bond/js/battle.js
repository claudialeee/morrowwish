// battle.js — real-time 2D action ARENA (Poke2D-Arena style), cat-themed.
//
// You DIRECTLY control your active cat:
//   移动: WASD / 方向键   瞄准: 鼠标    普攻: 左键 / J (猫爪光弹)
//   技能1: Q (毛球散射)   技能2: E (疾扑冲刺)   闪避: 空格 (翻滚无敌帧)
//   必杀: R (喵之怒涛, 能量满时)   切换猫: 1 / 2 / 3
//
// You whittle the wild cat's 斗志 (HP) to 0 → 成功收服 (win).
// Your whole队伍 fainting → 野猫逃走 (flee). Up to 3 cats per team; a fainted
// active cat auto-swaps to the next alive one.

const BATTLE_MARGIN = { side: 46 }; // vertical bounds follow the visible paved stage
// Real seconds: unaffected by combat slow-motion and cinematic hitstop.
const ULT_COOLDOWN_SECONDS = 18;
// Global skill-cadence knob: >1 lengthens every Q/E cooldown so skills can't be
// spammed back-to-back (they were firing a touch too fast). One place to tune.
const SKILL_CD_MULT = 1.3;
// A skill equipped in the BASIC (left-click) slot deals this fraction of the power it
// would as a Q/E skill — basics are short-cooldown + spammable, so the SAME skill must
// hit for clearly less when used as a basic than when slotted as a real skill.
const BASIC_SKILL_DMG_MULT = 0.5;

class CaptureBattle {
  constructor(game, teamOrCat, wildSpecies) {
    this.game = game;
    this.W = game.W; this.H = game.H;
    this.topMargin = this.H<540&&this.W>this.H ? Math.max(58,Math.min(105,this.H*.26)) : Math.max(85,Math.min(238,this.H*.40));
    this.bottomMargin = this.H<540&&this.W>this.H ? Math.max(38,Math.min(64,this.H*.15)) : Math.max(54,Math.min(112,this.H*.16));
    this.wild = wildSpecies;
    this.rar = GameData.RARITY[wildSpecies.rarity];
    this.rarIdx = ['N', 'R', 'SR', 'SSR'].indexOf(wildSpecies.rarity);
    // The encounter's region is still available here (game.scene changes to
    // battle AFTER this constructor). The first map is a safe starter area,
    // not an endlessly scaling arena as the player's collection grows.
    this.encounterRegion=game._battleTheme?.region||
      (game.scene==='yard'?'yard':window.WorldMap?.currentRegion||null);
    this.starterRegion=['sakura','yard'].includes(this.encounterRegion);
    // enemy level scales with the player's progress: average team level +
    // how far they've come (catchCount), nudged by rarity. So early wilds are
    // Lv.1-3 and late-game packs scale to match a strong roster.
    // Encounter level is rolled when the wild cat appears, not after the
    // player taps Start. The visible Lv. tag is exactly the battle's level.
    this.wildLevel = Math.max(1,Math.round(wildSpecies.encounterLevel||
      this.computeWildLevel(teamOrCat)));

    // --- LEVEL GAP (bidirectional: suppression when over-leveled, threat when under) ---
    // The level difference between your squad and the wild pack must MATTER. Two
    // factors derived from (avgLv - wildLevel):
    //   levelSuppression — multiplies YOUR outgoing damage
    //   enemyLevelMult   — multiplies the ENEMY's outgoing damage
    // Over-leveled (羁绊之旅 等级压制限制): your damage is softly capped so skill, not
    // raw stats, wins. Under-leveled: the stronger wild cat genuinely hits harder
    // and shrugs off more of your damage — fighting up a level should be dangerous.
    {
      const cats0 = Array.isArray(teamOrCat) ? teamOrCat : [teamOrCat];
      const avgLv = cats0.length ? cats0.reduce((s, c) => s + (c.level || 1), 0) / cats0.length : 1;
      const gap = avgLv - this.wildLevel;                  // + = you out-level; − = wild out-levels you
      // LOGISTIC level-gap scaling (researched): smooth S-curves, no piecewise cliffs.
      // ±1 level barely matters; gaps of 3–7 do the real work; huge gaps asymptote.
      // Advantage lives mostly in DAMAGE RATE (Pokémon/WoW lesson), a little in enemy
      // HP, so a big gap is slow+dangerous but never a hopeless stat wall (等级压制限制).
      {
        const L  = 1 / (1 + Math.exp(-0.5 * (gap + 0.94)));   // player advantage
        this.playerDmgMult = 0.60 + 0.65 * L;                 // ∈ [0.60, 1.25]
        const Le = 1 / (1 + Math.exp( 0.5 * (gap + 4.39)));   // enemy threat (rises as gap↓)
        this.enemyDmgMult  = 0.90 + 1.00 * Le;                // ∈ [0.90, 1.90]
        const Lh = 1 / (1 + Math.exp( 0.5 * (gap + 1.69)));   // enemy tankiness
        this.enemyHpScaleGap = 0.85 + 0.50 * Lh;              // ∈ [0.85, 1.35]
        // DIFFICULTY (休闲/硬核): gapScale bends each level-gap factor toward its
        // neutral (1.0) — casual (gapScale≈0.25) nearly flattens 等级压制 so being
        // under-levelled barely stings; hardcore (≈1.4) steepens it. Flat mults then
        // make casual fights stress-free (player hits harder, wild softer + squishier)
        // and keep hardcore at today's lethality. Read once from State at battle start.
        const diff = (window.State && State.difficultyMult) ? State.difficultyMult()
          : { playerDmg: 1, enemyDmg: 1, enemyHp: 1, gapScale: 1,
              duoDmg: 1, duoHpBudget: .48 };
        // Fix these coefficients at battle start so a setting change halfway
        // through a duo cinematic cannot modify its damage unexpectedly.
        this.duoDamageMult = diff.duoDmg ?? 1;
        this.duoHpBudget = diff.duoHpBudget ?? .48;
        const bend = (v, g) => 1 + (v - 1) * g;               // g=0 → neutral 1.0; g=1 → unchanged; g>1 → steeper
        this.playerDmgMult   = bend(this.playerDmgMult,   diff.gapScale) * diff.playerDmg;
        this.enemyDmgMult    = bend(this.enemyDmgMult,    diff.gapScale) * diff.enemyDmg;
        this.enemyHpScaleGap = bend(this.enemyHpScaleGap, diff.gapScale) * diff.enemyHp;
        this.difficultyMode  = (window.State && State.difficulty) ? State.difficulty() : 'casual';
        if(this.starterRegion){
          // In the starter map, the player's FIRST TWO cats should be able to
          // beat one ordinary wild cat without perfect skill timing.
          this.playerDmgMult=Math.max(.94,this.playerDmgMult);
          this.enemyDmgMult=Math.min(1.08,this.enemyDmgMult);
          this.enemyHpScaleGap=Math.min(1.08,this.enemyHpScaleGap);
        }
        // aliases for the existing hit sites (player-out / enemy-out damage)
        this.levelSuppression = this.playerDmgMult;
        this.enemyLevelMult = this.enemyDmgMult;
      }
    }

    // --- build the player team — up to 2 cats ON FIELD (roguelike squad cap). A
    // only the dedicated summon resonance can briefly call a 3rd cat. ---
    const cats = Array.isArray(teamOrCat) ? teamOrCat : [teamOrCat];
    this.FIELD_CAP = 2;                          // only 2 cats fight on the field at once
    this.team = cats.slice(0, this.FIELD_CAP).map((c, i) => this.makeFighter(c, i));
    this.reserve = cats.slice(this.FIELD_CAP);   // ordered bench chosen explicitly by the player
    this._benchFighters = new Map();             // preserve HP, skills and cooldowns across tactical swaps
    this.reserveSwapReadyAt = 0;                 // real-time tactical swap cooldown
    this._cinematicPortraits = new Map();
    this.reinforceT = 0;                         // >0 while a temp 3rd cat is on the field
    this.active = 0;
    this.partner = cats[0];              // for reward bookkeeping in game.js
    // Only the two explicitly selected STARTERS can trigger a duo. Previously
    // a favorite pair anywhere in the five-cat roster could silently be used
    // even while one favorite was on the bench, disabling the Duo button.
    this.duo=window.CatRelations?.active(this.team.map(f=>f.cat))||null;
    this.duoCharge=this.duo?12:0;this.duoCd=0;this.duoUses=0;   // bond support starts low + fills slow (bigger payoff than the ult)

    // --- player runtime state: spread the team on the LEFT, INSIDE the playable band
    // [topMargin, H-bottomMargin] so cats are never hidden under the bottom control
    // cluster on tall phones ---
    this.team.forEach((f,i)=>{const top=this.topMargin,bot=this.H-this.bottomMargin;
      f.x=this.W*(.18+(i%2)*.1);f.y=top+(bot-top)*(0.45+i*0.12);});
    const f = this.me();
    this.aim = 0;                         // radians toward mouse
    this.ult = 0;                         // 0..100 ultimate meter
    this.ultCd = 0;                       // shared across fighter swaps
    // --- COMBO system: hits chain a multiplier; drops after a gap (需要操作维持) ---
    this.combo = 0;                       // current chain count
    this.comboT = 0;                      // seconds until the chain drops
    this.comboBest = 0;                   // best this battle
    this.coachSeconds=0;                  // first tutorial time excluded from rank
    this.perfectDodges = 0;
    // Auto-assisted runs have different mastery ranking requirements even
    // when the player selected auto in a previous encounter.
    this.autoUsed=!!(window.State?.S?.battlePrefs?.autoBattle);
    this.comboFlash = 0;                  // milestone pop timer
    this.slowmo = 0;                      // perfect-dodge bullet-time timer
    this.hitstop = 0;                     // brief freeze-on-hit for weighty impacts

    // --- adaptive AI: read the learned player profile, derive this battle's knobs ---
    this.aiP = this.normalizeAiProfile(window.State && State.S && State.S.aiProfile);
    this._aiConf = clamp(this.aiP.battles / 8, 0, 1);       // ramps in over ~8 fights
    this._obs = { dodgeSignSum: 0, dodgeN: 0, rangeSum: 0, rangeN: 0, rangeT: 0, threats: 0, dodgedThreats: 0, fires: 0, frames: 0, dmgTaken: 0 };
    // stompStreak (flawless-win count) tightens the knobs: snappier windups, less
    // aim slop, fuller lead — so a player who keeps stomping faces a sharper foe.
    this._stomp = clamp((this.aiP.stompStreak || 0) / 5, 0, 1);
    if (this.aiP.adapt) {                                   // optional adaptive difficulty (timing/accuracy ONLY)
      const sk = clamp(this.aiP.skill + this._stomp * 0.5, 0, 1);   // stomps read as higher effective skill
      this.aiReact = clamp(1.15 - 0.3 * sk - 0.1 * this._stomp, 0.78, 1.15);   // ×windup / dodge timers
      this.aiJitter = clamp(0.18 - 0.16 * sk - 0.04 * this._stomp, 0.015, 0.18);// aim slop (never 0)
      this.aiLeadConf = clamp(0.4 + 0.6 * sk, 0.40, 1.00);  // how much predicted lead to apply
    } else { this.aiReact = 1; this.aiJitter = 0.06; this.aiLeadConf = 1; }

    // --- wild cat PACK: 1~3 enemies (rarer / commander-seeded = bigger packs) ---
    // The pack can be passed in via opts.pack (array of species); otherwise we
    // roll a size based on rarity and fill with the lead species + weaker friends.
    this.enemies = this.buildPack(wildSpecies);
    this.captureReady = false;

    // --- control mode: 'manual' | 'auto' (commander). Toggle in-battle. ---
    this.autoMode = !!(window.State?.S?.battlePrefs?.autoBattle);
    this.commandTarget = null;    // commander focus-fire locked enemy {id}

    // --- shared ---
    this.projectiles = [];               // {x,y,vx,vy,r,dmg,owner,life,color,kind}
    this.barrierWalls = [];              // mobile directional walls; cover allies behind their span
    this.beams = [];                     // channeled beam skills (水枪/flamethrower): continuous line damage
    this.fields = [];                    // lingering elemental ground zones (Terraformer): apply tags, can be detonated
    this.skillStrokes=[]; // Short-lived authored 2D spell shapes (not recolored bullets)
    this.duoField=null; // Elemental field lasting through several combat seconds
    this.particles = [];
    this.floaters = [];                  // damage numbers
    this.vfx = new VFX();                // juicy skill effects
    this.t = 0;
    this.done = false; this.result = null;
    this.shakeT = 0; this.flash = 0;
    // HIT-FEEL: trauma-based camera shake (Nijman). On a hit we add trauma (0..1);
    // the camera offset in draw() = maxShake * trauma² (squared falloff), decaying
    // ~1.8/s. shakeTrauma replaces the old shakeT-that-never-moved-the-camera.
    this.shakeTrauma = 0; this.shakeDirX = 0; this.shakeDirY = 0;
    this.hint = '鼠标瞄准 · 左键猫爪 · 空格闪避 · 斗志清零即收服';
    this.captureReady = false;
    this._ultAnnounced = false; this._ultReadyBanner = 0; this._captureBanner = 0;
    this._ultResultBanner = 0; this._ultResultText = ''; this._ultResultColor = '#ffd36b';
    this.pendingCasts = [];              // heavy-skill wind-ups in progress
    this._pressure = 0;                  // within-fight escalation rubber-band (0..1)
    this._stallT = 0; this._stalled = false; this._lastSkillT = 0;   // mash-stall teach/resolve
    this._prevKeys = {};

    // move definitions (cooldowns live on the active fighter)
    this.moves = [
      { key: 'basic', name: '猫爪', hot: '左键/J', cd: 0.6 },
      { key: 'q',     name: '毛球散射', hot: 'Q', cd: 4.5 },
      { key: 'e',     name: '疾扑冲刺', hot: 'E', cd: 5.5 },
      { key: 'ult',   name: '喵之怒涛', hot: 'R', cd: 0, ult: true },
    ];

    // --- FIRST-FIGHT COACH: a gentle, action-gated tutorial shown only on the
    // player's very first battle (never again). Each step waits until the player
    // actually performs the action, so they LEARN by doing. While coaching the
    // early steps, enemies hold fire so a beginner isn't overwhelmed. ---
    this.coach = this.initCoach();
  }

  // Build the tutorial state, or null if this isn't the first battle.
  initCoach() {
    const S = window.State && State.S;
    if (!S) return null;
    if (S.battlePrefs?.manualTutorialSeen || this.autoMode) return null; // first manual battle, even after auto battles
    const touch = !!this.game.isTouch;
    // Each step: {key, zh, en, done(battle)} — advances when done() is true.
    const steps = [
      { key: 'move', hl: null,
        zh: touch ? '👋 欢迎！先在左半边滑动，让猫咪走两步' : '👋 欢迎！按 W A S D 移动你的猫咪',
        en: touch ? '👋 Welcome! Slide on the left side to move your cat' : '👋 Welcome! Press W A S D to move your cat',
        done: b => b._coachMoved },
      { key: 'attack', hl: 'mv-basic',
        zh: touch ? '👍 很好！现在按住右半边攻击野猫' : '👍 很好！按住鼠标左键（或 J）攻击野猫',
        en: touch ? 'Nice! Now hold the right side to attack the wild cat' : 'Nice! Hold left-click (or J) to attack the wild cat',
        done: b => b._coachAttacked >= 6 },
      { key: 'skill', hl: 'mv-q',
        zh: '✨ 试试技能：点一下「技能一」(Q)',
        en: '✨ Try a skill: tap "Skill 1" (Q)',
        done: b => b._coachUsedSkill },
      { key: 'dodge', hl: 'mv-dodge',
        zh: touch ? '🌀 危险时点「闪避」躲开攻击（短暂无敌）' : '🌀 按空格键「闪避」躲开攻击（短暂无敌）',
        en: touch ? '🌀 Tap "Dodge" to avoid hits (brief invincibility)' : '🌀 Press Space to "Dodge" hits (brief invincibility)',
        done: b => b._coachDodged },
      { key: 'finish', hl: null,
        zh: '🎉 就是这样！打空野猫的斗志就能收服它。加油！',
        en: '🎉 That\'s it! Empty the wild cat\'s spirit to tame it. Good luck!',
        done: b => b.t > (b._coachFinishAt || 0) + 2.6 },
    ];
    return { steps, i: 0, _finishStamped: false };
  }

  // Advance the coach based on real battle signals; returns the current line.
  tickCoach(dt) {
    const c = this.coach; if (!c) return;
    // The coach teaches MANUAL controls. If the player is in auto-battle (the
    // first-fight default some flows pick), it can't gate on their inputs — so
    // stand down silently and mark the tutorial seen rather than stalling.
    if (this.autoMode) {
      this._coachHighlight = null; this.coach = null;
      return;
    }
    const step = c.steps[c.i];
    if (!step) return;
    // Anti-stall: never let a gated step hold the fight hostage. If the player
    // hasn't satisfied a step within ~12s, auto-advance it so enemies (which are
    // held during move/attack/skill) resume instead of standing frozen forever.
    c._stepT = (c._stepStarted === c.i) ? (c._stepT || 0) + dt : 0;
    c._stepStarted = c.i;
    if (step.key !== 'finish' && c._stepT > 12) { c.i++; c._stepStarted = -1; return; }
    if (step.key === 'finish' && !c._finishStamped) { this._coachFinishAt = this.t; c._finishStamped = true; }
    // show the coaching line + highlight the relevant control
    const en = window.MorrowwishI18n?.get?.() !== 'zh';
    this.hint = en ? step.en : step.zh;
    this._coachHighlight = step.hl;
    // advance when the player completes the step
    if(step.done(this)){
      if(step.key==='move')this._coachAttacked=0;
      if(step.key==='attack')this._coachUsedSkill=false;
      if(step.key==='skill')this._coachDodged=false;
      c.i++;
      if(c.i>=c.steps.length){
        this._coachHighlight=null;this.coach=null;
        if(window.State&&State.S){
          State.S.tutorialDone=true;
          State.S.battlePrefs={...(State.S.battlePrefs||{}),manualTutorialSeen:true,tutorialSeen:true};
          State.save();
        }
        window.arcadeMetric?.('bond_tutorial_complete',{mode:'manual'});
      }
    }
  }

  // Early coach steps (move/attack/skill) keep enemies from firing so a first-
  // timer can learn the controls unpressured. Returns true while enemies hold.
  coachHoldsEnemies() {
    const c = this.coach; if (!c) return false;
    const k = c.steps[c.i]?.key;
    return k === 'move' || k === 'attack' || k === 'skill';
  }

  duoReady(){
    return !!(this.duo&&this.duoCharge>=100&&this.duoCd<=0&&
      [this.duo.a.uid,this.duo.b.uid].every(uid=>this.team.some(f=>f.alive&&f.cat.uid===uid)));
  }
  castDuo(){
    if(!this.duoReady())return false;
    const d=this.duo,fs=this.team.filter(f=>f.alive&&[d.a.uid,d.b.uid].includes(f.cat.uid));
    this.duoCharge=0;this.duoCd=17;this.duoUses++;
    const x=(fs[0].x+fs[1].x)/2,y=(fs[0].y+fs[1].y)/2;
    const firstColor=this.elemColor(fs[0].element),secondColor=this.elemColor(fs[1].element);
    const mix=d.elementPair;
    const art=d.effect||{status:'expose',support:'shield',mult:1};
    const fieldDuration=8.2+1.15*(d.tier-1);
    this.duoField={x,y,age:0,duration:fieldDuration,remaining:fieldDuration,
      pulse:1.65,radius:Math.min(134,96+8*d.tier),
      elements:mix.split('+'),pair:mix,first:firstColor,second:secondColor,
      status:art.status,secondStatus:d.tier>=2?art.secondStatus:null,
      support:art.support||'shield',tier:d.tier,
      // One shared per-enemy damage budget for the entire resonance cast.
      damageByEnemy:new Map()};
    // max ≈ 3.0s splash + a short un-frozen aftermath tail. strikeAt sits at the END of the
    // splash, so the arena stays HARD-FROZEN (dt=0, nobody moves) for essentially the WHOLE
    // cut-in. The splash art plays and fades out, THEN at strikeAt the deferred payload LANDS
    // and the arena un-freezes so the skill's hit VFX animate in the revealed arena —
    // "先显示合体大图，然后消失，然后发出技能". duo-bond.js's crossed-claw paw-impact is gated to this
    // same strikeAt beat so the big hit + slashes read as ONE connect once the art clears.
    this.duoCinematic={t:3.2,max:3.2,strikeAt:3.0,name:d.name,x,y,first:firstColor,second:secondColor,elements:mix};
    // Two actual fighters sprint toward the enemy, cross paths and sprint home.
    // Positions are visual only, leaving actual combat collision and saves intact.
    const target=this.lockedEnemy()||this.nearestEnemy(x,y)||{x,y};
    if(target.i!=null)this._lockIdx=target.i; // lock the pair's focus through the opening strike
    this.duoCinematic.targetUid=target.i;
    this.duoCinematic.catUids=fs.map(f=>f.cat.uid);
    this.duoCinematic.x=target.x;this.duoCinematic.y=target.y;
    // The resonance should surround enemies, not the point where the two cats stood.
    this.duoField.x=target.x;this.duoField.y=target.y;
    this.duoRun={age:0,duration:2.40,runners:fs.map((f,i)=>({
      uid:f.cat.uid,fromX:f.x,fromY:f.y,
      toX:target.x+(i?21:-21),toY:target.y+(i?-11:11)
    }))};
    this.flash=.10;this.shakeT=.24;this.slowmo=.11;
    // Composition uses *two running bodies*, sharp impact marks and a restrained
    // elemental afterimage — not dozens of floating globes or kitten stickers.
    this.vfx.beam(fs[0].x,fs[0].y,target.x,target.y,firstColor);
    this.vfx.beam(fs[1].x,fs[1].y,target.x,target.y,secondColor);
    for(const f of fs){
      f.inv=Math.max(f.inv,2.7);
      this.vfx.burst(f.x,f.y,{count:6,color:this.elemColor(f.element),speed:130,life:.3,r:2});
    }
    this.skillStrokes.push({kind:'duoImpact',x:target.x,y:target.y,
      firstColor,secondColor,elements:mix,life:2.55,max:2.55});
    // The arena follow-through is tailored to the actual element pair.
    // No unrelated boulder drop duplicated across every ultimate.
    const support=art.support||'shield';
    // DEFERRED PAYLOAD — runs at the splash's strike beat (see duoCinematic tick),
    // so the big art shows first and the hit only lands once it clears.
    this.duoCinematic.payload=()=>{
      if(!window.MorrowwishAudio?.duoSignature?.(mix,d.tier,'impact'))window.MorrowwishAudio?.effect?.('combat_duo_impact');
      this.vfx.burst(target.x,target.y,{count:16,color:firstColor,speed:200,life:.45,r:3});
      this.vfx.burst(target.x,target.y,{count:12,color:secondColor,speed:240,life:.47,r:2});
      this.flash=Math.max(this.flash,.22);this.shakeT=Math.max(this.shakeT,.3);
      let hits=0;
      for(const e of this.liveEnemies().slice()){
        const raw=Math.min(e.maxhp*(.18+(d.tier-1)*.035),
          (fs[0].dmg+fs[1].dmg)*(1.2+.2*d.tier));
        const damage=raw*Math.max(.8,Math.min(1.2,art.mult||1));
        this.hurtEnemy(e,damage,e.x,e.y,true,true);
        this.vfx.impact(e.x,e.y,hits%2?firstColor:secondColor);hits++;
        e.status=e.status||{};e.tags=e.tags||[];
        // All 21 element pairs use authored statuses; at 60+ trust a
        // SECOND synergy becomes available. Crowd control stays time-limited.
        const tags=[art.status,...(d.tier>=2&&art.secondStatus?[art.secondStatus]:[])];
        for(const tag of tags){
          if(!Skills.TAG_INFO[tag])continue;
          const cc=['bind','chill','dizzy'].includes(tag);
          const secs=cc?1.9+.35*d.tier:4.7+.95*d.tier;
          e.status[tag]=Math.max(e.status[tag]||0,secs);
          if(!e.tags.includes(tag))e.tags.push(tag);
        }
      }
      // Different duos alter what the player can do AFTER the cinematic:
      // healing, guarding, haste, power, evasion, regeneration or extra energy.
      const allies=this.team.filter(f=>f.alive);
      for(const f of allies){
        if(support==='heal'||support==='regen'){
          const pct=(support==='regen'?.07:.11)+d.tier*.027;
          const heal=Math.min(f.maxhp-f.hp,f.maxhp*pct);
          f.hp=Math.min(f.maxhp,f.hp+heal);
          if(heal>1)this.vfx.text(f.x,f.y-48,'+'+Math.round(heal),'#8be7ac',15);
          if(support==='regen')f.shieldT=Math.max(f.shieldT||0,3.2+.45*d.tier);
        }else if(support==='shield'){
          f.shieldT=Math.max(f.shieldT||0,5.8+.95*d.tier);
        }else if(support==='boost'){
          f.damageBoostT=Math.max(f.damageBoostT||0,6.4+.7*d.tier);
        }else if(support==='haste'){
          const seconds=1.6+.45*d.tier;
          for(const key of ['basic','q','e'])f.cd[key]=Math.max(0,(f.cd[key]||0)-seconds);
          f.dodgeCd=Math.max(0,(f.dodgeCd||0)-seconds);
        }else if(support==='evade'){
          f.inv=Math.max(f.inv||0,2.5+.18*d.tier);
        }else if(support==='protect'){
          f.protectT=Math.max(f.protectT||0,1.45+.24*d.tier);
        }
      }
      if(support==='charge')this.gainUlt(11+8*d.tier);
      this.gainUlt(16);
      // Only the dedicated 召唤队友 resonance brings in a third cat.
      // All other duo resonances keep the usual two-cat field composition.
      if(support==='summon')this.summonReinforcement(12 + d.tier * 1.5);
      window.arcadeMetric?.('bond_duo_attack',{elementPair:mix,tier:d.tier,hits,style:support});
    };
    window.MorrowwishMusic?.duckFor?.(2500);
    if(!window.MorrowwishAudio?.duoSignature?.(mix,d.tier,'cast'))window.MorrowwishAudio?.effect?.('combat_duo');
    // The unique lingering field and restrained title make the special visible; avoid a second toast.
    return true;
  }
  // Bring a benched reserve cat onto the field as a timed reinforcement. It fights
  // as a normal ally for `secs`, then withdraws. No-op if there's no reserve or one
  // is already in. Flagged _reinforcement so tick/cleanup can retire it.
  summonReinforcement(secs){
    if(this.reinforceT>0)return false;                 // one at a time
    const already=new Set(this.team.map(f=>f.cat.uid));
    const pick=(this.reserve||[]).find(c=>c&&!already.has(c.uid));
    if(!pick)return false;
    const r=this._benchFighters.get(pick.uid)||this.makeFighter(pick,this.team.length);
    this._benchFighters.delete(pick.uid);
    r.i=this.team.length;
    r._reinforcement=true;
    const me=this.me();
    r.x=clamp((me?me.x:this.W*0.3)+40,BATTLE_MARGIN.side,this.W-BATTLE_MARGIN.side);
    r.y=clamp((me?me.y:this.H*0.6)+30,this.topMargin,this.H-this.bottomMargin);
    r.inv=1.0;
    this.team.push(r);
    this.reinforceT=secs;
    this.game.buildTeamSlots?.();                  // show the temp 3rd slot
    this.vfx.ring(r.x,r.y,{r0:8,vr:320,life:.5,color:'#ffd36b',width:5});
    this.vfx.burst(r.x,r.y,{count:14,color:'#ffd36b',speed:200,life:.45,r:3});
    const en=window.MorrowwishI18n?.get?.()!=='zh';
    this.vfx.text(r.x,r.y-46,en?'REINFORCEMENT!':'羁绊支援!','#ffd36b',16);
    this.game.toast(en?(State.catName?State.catName(pick):'A friend')+' joins the fight!':(State.catName?State.catName(pick):'伙伴')+' 加入战斗！');
    return true;
  }
  // The timed reinforcement withdraws: fade it out and drop it from the field. If
  // the player was controlling it (edge case), hand control back to a core cat.
  retireReinforcement(){
    this.reinforceT=0;
    const idx=this.team.findIndex(f=>f._reinforcement);
    if(idx<0)return;
    const r=this.team[idx];
    if(r.alive&&this.reserve.some(c=>c.uid===r.cat.uid))this._benchFighters.set(r.cat.uid,r);
    this.vfx.ring(r.x,r.y,{r0:6,vr:260,life:.4,color:'#ffd36b',width:4});
    this.vfx.burst(r.x,r.y,{count:10,color:'#ffd36b',speed:150,life:.4,r:2});
    this.team.splice(idx,1);
    if(this.active>=this.team.length)this.active=0;      // never point at a removed slot
    this.game.buildTeamSlots?.();                        // drop the temp slot
  }
  // Five-plus seconds of distinct elemental resonance. The opening duo
  // strike is strongest; follow-up pulses are restrained and readable.
  tickDuoField(dt){
    const v=this.duoField;
    if(!v||this.done)return;
    v.age+=dt;v.remaining=Math.max(0,v.duration-v.age);
    if(!v.finisher&&v.remaining<1.15){v.finisher=true;
      this.skillStrokes.push({kind:'duoImpact',x:v.x,y:v.y,firstColor:v.first,secondColor:v.second,elements:v.pair,life:.8,max:.8});}
    // Let the paired-element field drift after the wild pack as it moves.
    // It is ground-level and never becomes a large foreground overlay.
    const moving=this.liveEnemies();
    if(moving.length){
      const x=moving.reduce((sum,e)=>sum+e.x,0)/moving.length;
      const y=moving.reduce((sum,e)=>sum+e.y,0)/moving.length;
      const follow=Math.min(1,dt*2.5);
      v.x+=(x-v.x)*follow;v.y+=(y-v.y)*follow;
    }
    if(!v.remaining){
      // A restrained final echo, so the special has a clear ending.
      this.skillStrokes.push({kind:'duoImpact',x:v.x,y:v.y,
        firstColor:v.first,secondColor:v.second,elements:v.pair,
        life:.65,max:.65});
      this.duoField=null;return;
    }
    v.pulse-=dt;
    if(v.pulse>0)return;
    v.pulse+=1.22;
    // Each pulse visibly propagates from the field rather than only creating
    // disconnected impact rings on enemies.
    this.vfx.ring(v.x,v.y,{r0:12,vr:v.radius/0.32,life:.32,color:v.first,width:3});
    for(const e of this.liveEnemies()){
      if(Math.hypot(e.x-v.x,e.y-v.y)>v.radius*1.3)continue;
      const damage=Math.min(e.maxhp*(.019+.003*v.tier),
        Math.max(1,(this.team[0]?.dmg||15)*(.2+.035*v.tier)));
      this.hurtEnemy(e,damage,e.x,e.y,true,true);
      e.status=e.status||{};e.tags=e.tags||[];
      const tag=v.secondStatus&&v.age>=2.5?v.secondStatus:v.status;
      if(Skills.TAG_INFO?.[tag]){
        const controlling=['bind','chill','dizzy'].includes(tag);
        e.status[tag]=Math.max(e.status[tag]||0,controlling?.6:2.1);
        if(!e.tags.includes(tag))e.tags.push(tag);
      }
      this.vfx.ring(e.x,e.y,{r0:8,vr:65,life:.3,color:v.first,width:2});
    }
    for(const ally of this.team.filter(f=>f.alive)){
      if(v.support==='heal'||v.support==='regen'){
        ally.hp=Math.min(ally.maxhp,ally.hp+ally.maxhp*(v.support==='regen'?.025:.018));
      }else if(v.support==='shield')ally.shieldT=Math.max(ally.shieldT||0,1.45);
      else if(v.support==='boost')ally.damageBoostT=Math.max(ally.damageBoostT||0,1.9);
      else if(v.support==='haste'){
        for(const k of ['basic','q','e'])ally.cd[k]=Math.max(0,(ally.cd[k]||0)-.35);
      }else if(v.support==='evade')ally.inv=Math.max(ally.inv||0,.33);
      else if(v.support==='protect')ally.protectT=Math.max(ally.protectT||0,.33);
    }
    if(v.support==='charge')this.gainUlt(3);
  }

  // Painterly ground-level elements: two intertwined moving rings, with
  // flames / ripples / leaves / lightning / moons / stars according to pair.
  // All ornament stays BELOW the cats and the combat button HUD.
  drawDuoField(ctx){
    const v=this.duoField;if(!v||v.remaining<=0)return;
    const opacity=Math.min(1,v.age/.45,v.remaining/.8)*.5;
    const rad=v.radius+4*Math.sin(v.age*2.3);
    ctx.save();ctx.translate(v.x,v.y);ctx.globalAlpha=opacity;
    for(let side=0;side<2;side++){
      const c=side?v.second:v.first;
      const a=side?.19:-.24;
      ctx.save();ctx.rotate(v.age*a);
      ctx.strokeStyle=c;ctx.lineWidth=side?2.4:3.3;ctx.setLineDash(side?[6,12]:[16,12]);
      ctx.beginPath();ctx.ellipse(0,0,rad-side*17,(rad-side*17)*.64,0,0,Math.PI*2);ctx.stroke();ctx.restore();
      ctx.setLineDash([]);
      for(let i=0;i<6;i++){
        const ang=i*Math.PI/3+v.age*(side?.38:-.32);
        const rr=rad*(side?.7:.94);
        ctx.save();ctx.translate(Math.cos(ang)*rr,Math.sin(ang)*rr*.64);ctx.rotate(ang);
        ctx.strokeStyle=c;ctx.fillStyle=c;ctx.lineWidth=2;ctx.beginPath();
        const el=v.elements[side];
        if(el==='grass'){ctx.ellipse(0,0,9,3.5,Math.PI/4,0,Math.PI*2);ctx.stroke();}
        else if(el==='water'){ctx.moveTo(-10,2);ctx.bezierCurveTo(-5,-7,0,8,10,-2);ctx.stroke();}
        else if(el==='elec'){ctx.moveTo(-5,-9);ctx.lineTo(2,-2);ctx.lineTo(-2,3);ctx.lineTo(6,8);ctx.stroke();}
        else if(el==='fire'){ctx.moveTo(-5,6);ctx.quadraticCurveTo(-9,-3,2,-10);ctx.quadraticCurveTo(1,-2,7,5);ctx.stroke();}
        else if(el==='dark'){ctx.arc(0,0,7,-1.2,1.2);ctx.stroke();}
        else{ctx.moveTo(0,-9);ctx.lineTo(3,0);ctx.lineTo(0,9);ctx.lineTo(-3,0);ctx.closePath();ctx.stroke();}
        ctx.restore();
      }
    }
    ctx.globalAlpha=opacity*.65;ctx.strokeStyle='#fff4d1';ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(0,0,rad+6,(rad+6)*.64,0,-Math.PI/2,
      -Math.PI/2+2*Math.PI*v.remaining/v.duration);ctx.stroke();
    ctx.restore();
    // Readable battlefield HUD for what the field actually DOES. This stays
    // anchored to the moving resonance, below the ground-ring silhouette.
    const zh=window.MorrowwishI18n?.get?.()==='zh';
    const statusNames={burn:'灼烧',soak:'湿润',shock:'感电',oil:'浸油',
      chill:'冰冻',dizzy:'眩晕',bleed:'流血',blind:'致盲',bind:'束缚',
      expose:'破绽',weaken:'削弱',rust:'破甲'};
    const enStatus={burn:'Burn',soak:'Soak',shock:'Shock',oil:'Oil',
      chill:'Chill',dizzy:'Dizzy',bleed:'Bleed',blind:'Blind',bind:'Bind',
      expose:'Expose',weaken:'Weaken',rust:'Armor break'};
    const effect=zh?{
      heal:'治疗',regen:'持续治疗',shield:'护盾',boost:'增伤',
      haste:'冷却加速',evade:'闪避',protect:'格挡',charge:'必杀充能',
      summon:'召唤队友'
    }:{
      heal:'Heal',regen:'Regeneration',shield:'Shield',boost:'Attack up',
      haste:'Cooldown',evade:'Evade',protect:'Guard',charge:'Ult charge',
      summon:'Summon ally'
    };
    const name=zh?(statusNames[v.status]||'异常'):(enStatus[v.status]||'Status');
    const assist=effect[v.support]||v.support;
    const summary=zh?('脉冲伤害 · '+name+' · '+assist):('Pulse damage · '+name+' · '+assist);
    const by=Math.min(this.H-this.bottomMargin-8,Math.max(this.topMargin+12,v.y+rad*.64+18));
    ctx.save();
    ctx.globalAlpha=Math.min(1,v.age/.35,v.remaining/.6);
    ctx.font='700 10px system-ui,sans-serif';
    ctx.textAlign='center';ctx.textBaseline='middle';
    const label=summary+'  '+Math.ceil(v.remaining)+'s';
    const width=Math.min(this.W-18,ctx.measureText(label).width+18);
    const bx=clamp(v.x,width/2+5,this.W-width/2-5);
    ctx.fillStyle='rgba(32,42,55,.82)';
    rr(ctx,bx-width/2,by-10,width,20,9);ctx.fill();
    ctx.fillStyle='#fff5dd';ctx.fillText(label,bx,by,width-12);
    ctx.restore();
  }

  // Keep the combat field available when a phone is rotated mid-encounter.
  onResize(W,H){
    const oldW=this.W||W,oldH=this.H||H;this.W=W;this.H=H;
    const shortLandscape=H<540&&W>H;
    this.topMargin=shortLandscape?Math.max(58,Math.min(105,H*.26)):Math.max(85,Math.min(238,H*.40));
    this.bottomMargin=shortLandscape?Math.max(38,Math.min(64,H*.15)):Math.max(54,Math.min(112,H*.16));
    if(this.topMargin+this.bottomMargin>H-96)this.topMargin=Math.max(36,H-this.bottomMargin-96);
    const minX=Math.min(BATTLE_MARGIN.side,W*.15),maxX=Math.max(minX,W-minX);
    for(const f of [...this.team,...this.enemies]){
      f.x=clamp(f.x*W/oldW,minX,maxX);
      f.y=clamp(f.y*H/oldH,this.topMargin,Math.max(this.topMargin,H-this.bottomMargin));
    }
    for(const p of this.projectiles){p.x*=W/oldW;p.y*=H/oldH;}
    for(const w of this.barrierWalls||[]){w.x*=W/oldW;w.y*=H/oldH;}
    // Commander focus stores enemy identity, not screen coordinates.
    this._stars=null;this._motes=null;
  }

  // Wild level tracks player strength so fights stay meaningful, never trivial.
  computeWildLevel(teamOrCat) {
    const cats = Array.isArray(teamOrCat) ? teamOrCat : [teamOrCat];
    const avg = cats.length ? cats.reduce((s, c) => s + (c.level || 1), 0) / cats.length : 1;
    const caught = (window.State && State.S.catchCount) || 0;
    // Regional tiers, not a hidden '+1 level every 3 captures' treadmill.
    // First map is ALWAYS Lv1-3, even after a player catches 15+ cats.
    const caps={sakura:3,yard:3,home:5,creek:7,volcano:9,ruins:12};
    const region=this.encounterRegion;
    const cap=caps[region]??Math.max(3,Math.ceil(avg)+2);
    // Advanced locations are intentionally tougher than the starter meadow,
    // even if a player explores ahead with an under-leveled team.
    const floors={sakura:1,yard:1,home:2,creek:3,volcano:4,ruins:5};
    const minLv=floors[region]??1;
    const progress=Math.min(1.5,caught*.12);
    const rarityBonus=Math.min(1.5,this.rarIdx*.65);
    const noise=(Math.random()-.5)*1.2;
    const lvl=Math.round(avg+progress+rarityBonus+noise);
    return Math.max(minLv,Math.min(cap,lvl));
  }

  // Build a wild pack of 1~3 enemies. Lead = the encountered species; rarer
  // encounters bring more/tougher friends.
  buildPack(lead) {
    // Fewer wild cats on screen: with a 3-cat player team, big packs overcrowd the
    // arena. Solo is the norm; a 2nd joins sometimes, a 3rd only for rare encounters.
    const packSize = this.starterRegion ? 1 :
      1 + (Math.random() < 0.22 + this.rarIdx * 0.1 ? 1 : 0) +
      (Math.random() < 0.05 + this.rarIdx * 0.08 ? 1 : 0);
    const species = [lead];
    // fill remaining slots with same-or-lower rarity companions from the catalogue
    const order = ['N', 'R', 'SR', 'SSR'];
    const pool = GameData.SPECIES.filter(s => order.indexOf(s.rarity) <= this.rarIdx);
    for (let i = 1; i < packSize; i++) {
      species.push(pool.length ? pool[Math.floor(Math.random() * pool.length)] : lead);
    }
    const enemies = species.map((sp, i) => this.makeEnemy(sp, i, species.length));
    return enemies;
  }

  makeEnemy(sp, i, total) {
    const wv = sp.base;
    const rIdx = ['N', 'R', 'SR', 'SSR'].indexOf(sp.rarity);
    // this enemy's level = pack level, companions a touch lower than the lead
    const level = Math.max(1, this.wildLevel - (i === 0 ? 0 : 1 + Math.floor(Math.random() * 2)));
    const lvScale = 1 + (level - 1) * 0.08;               // +8% stats per level
    // Only SR/SSR receive an extra challenge: normal and R encounters remain
    // accessible early. Existing roster levels and cat stats are untouched.
    const eliteFactor = rIdx === 3 ? 1.22 : rIdx === 2 ? 1.12 : 1;
    // EARLY-GAME onboarding damp: a fresh-save opener drags because the ~196 HP floor
    // sits in front of a ~12-DPS Lv1 cat. Low-level enemies start with much less HP
    // (Lv1 ~55%), ramping to full by Lv6, so the first fight is short + winnable.
    const earlyDamp = (this.starterRegion ? .48 : .55) +
      (this.starterRegion ? .32 : .45) * Math.min(1, (level - 1) / 5);
    // enemyHpScaleGap (logistic, from the constructor): a little extra HP when the
    // wild out-levels you, gentle so a gap feels tankier without being spongy.
    const maxhp = Math.round((140 + wv.vit * 7) * (1 + rIdx * 0.6) * lvScale * eliteFactor
                             * earlyDamp * (this.enemyHpScaleGap || 1));
    // First two battles teach controls; later battles ask for dodging and team skill timing.
    const captures=State.S.catchCount||0;
    // Base challenge ramps with collection progress; flawless-win streak (_stomp,
    // 0..1) adds up to +0.8 so dominators face tougher wild cats (anti-stomp).
    const challenge=(captures<2?0:Math.min(1.8,(captures-1)*.11))+(this._stomp||0)*0.8;
    const col = total === 1 ? 0.7 : 0.58 + (i / Math.max(1, total - 1)) * 0.26;
    const element = (window.Skills && Skills.elementOf) ? Skills.elementOf(sp.id) : null;
    return {
      sp, i, element, rIdx, level,
      role:rIdx>=2?'elite':(i%3===0?'ambusher':i%3===1?'sharpshooter':'skirmisher'),
      phase:0,challenge,
      maxhp, hp: maxhp,
      // place enemies inside the PLAYABLE band (above the control cluster), upper-right
      x: this.W * col, y: (()=>{const top=this.topMargin,bot=this.H-this.bottomMargin;return top+(bot-top)*(0.30+(i%2)*0.22);})(), vx: 0, vy: 0,
      face: -1, t: Math.random() * 3, pose: 'idle',
      shieldT:0,protectT:0,reflectT:0,rootT:0,vulnerableT:0,wardCd:3+Math.random()*3,swipeCd:1,
      fireCd: 0.6 + Math.random() * 0.8, dodgeCd: 0, special: 2 + Math.random() * 2,
      specialCd:Math.max(2.4,5-rIdx*.6-challenge*.55),telegraph:0,telegraphKind:null,inv:0,
      flash: 0, aggro: 0, heading: Math.PI, bolt: 0,
      dmg:(9+rIdx*3.2)*lvScale*(rIdx===3?1.10:rIdx===2?1.06:1)*
        (1+challenge*.12)*(this.starterRegion?.70:1),
      speed:92+rIdx*22+challenge*14,
      fireRate:this.starterRegion?Math.max(.85,1.08-rIdx*.06):
        Math.max(.38,0.8-rIdx*.14-challenge*.1),
      skill: this.pickWildSkillFor(element, rIdx),
      // POISE/韧性: only authored stagger actions (泰山压顶, 纸箱埋伏,
      // cast interrupts) break poise. Ordinary hits cause armor break instead.
      // Partial poise losses persist. Only reaching ZERO unlocks recovery:
      // after the stagger window, refill the gauge during a separate recovery phase.
      poise: Math.round(maxhp * 0.6), poiseMax: Math.round(maxhp * 0.6), staggerT: 0,
      poiseRecovering: false, poiseComboHits: 0, poiseLastHitAt: -99,
      tags: [], alive: true,
    };
  }
  // alive enemies helper
  liveEnemies() { return this.enemies.filter(e => e.alive); }

  makeFighter(cat, i) {
    const s = cat.stats;
    // HP/dmg derive purely from the cat's STATS (single source of truth). Level is
    // expressed THROUGH the stats, which grow along the breed's identity (see
    // State.addXp): a Lv.9 cat has genuinely bigger stats than a Lv.3 one.
    // AFFINITY (亲密) → temporary % stat modifier, capped ±15%. High bond buffs stats
    // up to +15%; low bond or a RECENT DEATH (cat._deathPenaltyUntil set on faint)
    // temporarily DROPS them. Multiplies hp + dmg; never permanent (recomputed each
    // battle from live affinity). 撸猫 raises affinity → this is how petting helps.
    const aff = Math.max(0, Math.min(100, cat.affinity || 0));
    let affMult = 1 + 0.15 * ((aff - 50) / 50);          // aff 50 → 1.0, 100 → 1.15, 0 → 0.85
    if (cat._deathPenaltyUntil && Date.now() < cat._deathPenaltyUntil) affMult *= 0.88;  // recent faint: shaken
    affMult = Math.max(0.80, Math.min(1.15, affMult));
    // HP is BREED-EXPRESSED: a bigger base pool + a stronger VIT weight so cats are
    // beefier overall AND a tanky breed (森林/缅因 vit12, 蓝宝 vit9) is visibly more
    // durable than a lean one (暹罗/樱花 lean on dodge, not HP). VIT also grows with
    // level, so the spread widens over a run. Base 55→80, VIT ×5→×8 lifts everyone
    // off the old flat ~95-115 band (e.g. 汤圆 95→144, 森林 115→176).
    const maxhp = Math.round((80 + s.vit * 8) * affMult);
    // element + a learned loadout from the skill library (Q / E slots)
    const element = (window.Skills && Skills.elementOf) ? Skills.elementOf(cat.species) : null;
    let loadout = null;
    if (window.Skills && Skills.ensureLoadout) { Skills.ensureLoadout(cat); loadout = cat.loadout; }
    const skillOf = id => (window.Skills && Skills.skillById) ? Skills.skillById(id) : null;
    // bond(纽带) bonuses — higher affinity = more damage, shorter cd, revive
    const bond = (window.Skills && Skills.bondBonuses) ? Skills.bondBonuses(Skills.bondTier(cat.affinity || 0)) : { dmgMult: 1, cdReduction: 1, reviveOnce: false };
    // Roguelike attrition: a cat carries its wounded HP between field battles via
    // cat._hpFrac (set by game.js after each explore win). Full HP if unset (yard
    // fights, fresh runs). Dead-on-arrival is avoided with a small floor.
    const carried = window.State?.catHpFraction?.(cat) ?? 1;
    return {
      cat, i, element, bond,
      hp: Math.round(maxhp * carried), maxhp,
      x: this.W * 0.3, y: this.H * 0.6, vx: 0, vy: 0,
      r: 20, inv: 0, dashT: 0,
      // Base movement reduced to 120. AGI grants +0.35% per point,
      // capped at +20% (maximum normal run speed 144).
      speed: 120 * (1 + Math.min(0.20, Math.max(0, s.agi || 0) * 0.0035)),
      dmg: (6 + s.pow * 0.7) * (bond.dmgMult || 1) * 0.62,   // lower player base damage ~14%; keep skill ratios and enemy damage unchanged
      shieldT:0,damageBoostT:0,protectT:0,reflectT:0,rootT:0,vulnerableT:0,kneadStacks:0,kneadT:0,
      tags: [], status: {}, slowed: false,
      // Projectile speed is decoupled from AGI (flat): the shot's speed belongs to the
      // SHOT, not the cat's legs — AGI should move the cat, not make its toys hypersonic.
      projSpeed: 300,
      // Opening cooldowns: skills start on cooldown so a fight can't open with an
      // instant alpha-strike of every ability. Basic (poke) is ready; Q/E wind up.
      cd: { basic: 0, q: 1.6, e: 2.4 },
      // the two active skills this cat actually knows (from its element loadout)
      // basicSkill: slot 0 may hold a low-power attack skill chosen as the basic
      // (incl. 烈焰猫爪); null = the innate cat-toy toss. Only accept basic-eligible.
      basicSkill: (loadout && loadout[0] && Skills.basicEligible?.(skillOf(loadout[0]))) ? skillOf(loadout[0]) : null,
      qSkill: loadout ? skillOf(loadout[1]) : null,
      eSkill: loadout ? skillOf(loadout[2]) : null,
      ultSkill: loadout ? skillOf(loadout[3]) : null,
      revived: false,
      alive: true,
      hitFlash: 0,
      t: Math.random() * 3, moving: false, _aim: 0,
    };
  }
  me() { return this.team[this.active]; }

  // Combat cat draw scale, relative to the ARENA size so cats look consistent
  // whether the stage is a small window or a big desktop canvas. Baseline is the
  // old fixed 0.62 at the reference 1100x720 stage; it grows/shrinks with the
  // arena diagonal, clamped so cats never get tiny or cartoonishly huge.
  catScale(role='ally') {
    // The old 0.50 floor made cats markedly smaller than their map versions.
    // Boost whole-body readability while keeping room for dodge telegraphs.
    const diag=Math.hypot(this.W||1100,this.H||720);
    const ratio=Math.sqrt(diag/Math.hypot(1100,720));
    // CatMotion.draw applies a further 0.70 watercolor-art scale. Compare
    // the VISIBLE cat against the exploration lead (1.0 * .70), not against
    // the input number here: combat hero should be ~0.98 of map hero.
    const readable=clamp(.93*ratio,.87,1.04);
    if(role==='active')return Math.min(1.10,readable*1.12);
    if(role==='enemy')return readable*.95;
    return readable;
  }

  toggleAuto() {
    this.autoMode = !this.autoMode;
    if(this.autoMode)this.autoUsed=true;
    // Store the choice once. Every future encounter defaults to the player's
    // last mode; players may still switch manually at any time.
    if(window.State?.S){
      State.S.battlePrefs=State.S.battlePrefs||{};
      State.S.battlePrefs.autoBattle=this.autoMode;
      State.save();
    }
    this._autoLastAction=null;
    this.commandTarget=null;
    if(!this.autoMode&&!State.S.battlePrefs?.manualTutorialSeen){
      this.coach=this.initCoach();this.game.touchAutoFire=false;this.game.showFirstManualTutorial();
    }else if(this.autoMode){this.coach=null;this._coachHighlight=null;}
    else if(this.game.isTouch)this.game.touchAutoFire=true;
    const en=window.MorrowwishI18n?.get?.()!=='zh';
    this.game.toast(this.autoMode?(en?'🤖 Auto battle · command your cats':'🤖 自动战斗 · 指挥猫咪')
      :(en?'🎮 Manual · move and use skills':'🎮 手动战斗 · 移动与释放技能'));
    return this.autoMode;
  }

  // ---------------- TACTICAL AUTO BATTLE ----------------
  // Default preset is adaptive. Hand-edited gambits remain respected, so a
  // player's saved custom priorities are not overwritten by game upgrades.
  isDefaultGambit(cat) {
    const rules=cat?.gambits;
    if(!Array.isArray(rules)||!rules.length)return true;
    const sig=a=>a.map(r=>r.cond+':'+r.act).join('|');
    const current=window.Skills?.defaultGambits?.(cat)||[];
    if(sig(rules)===sig(current))return true;
    // Early versions accidentally saved a truncated preset with no Q/E skills.
    const old=[
      ['selfHpBelow25','heal'],['selfHpBelow40','retreat'],['incomingProj','dodge'],
      ['enemyHpBelow30','ult'],['comboPrimed','finisher'],['enemyHasTag','combo'],
      ['enemyFar','skillQ'],['enemyClose','basic'],['always','basic']
    ];
    for(let n=4;n<=8;n++){
      const legacy=old.slice(0,n).concat([old[8]]);
      if(sig(rules)===legacy.map(v=>v.join(':')).join('|'))return true;
    }
    return false;
  }

  // Predict projectile collision, not merely projectile proximity. A shot
  // traveling away does not waste an evasive cooldown.
  incomingThreat(f) {
    let nearest=null, best=Infinity;
    for(const p of this.projectiles){
      if(p.owner!=='wild'||p.life<=0)continue;
      const speed2=p.vx*p.vx+p.vy*p.vy;
      const dx=f.x-p.x,dy=f.y-p.y;
      const eta=speed2>1?(dx*p.vx+dy*p.vy)/speed2:0;
      if(eta<-.04||eta>.45)continue;
      const t=Math.max(0,eta);
      const miss=Math.hypot(p.x+p.vx*t-f.x,p.y+p.vy*t-f.y);
      if(miss<(p.r||7)+f.r*.8+13 && eta<best){nearest={p,d:Math.hypot(dx,dy),eta};best=eta;}
    }
    return nearest;
  }

  // Is this cat standing inside (or near the edge of) a telegraphed must-dodge
  // smash disc that hasn't gone off yet? Returns the disc center so the auto-AI
  // can flee straight out, same as a human reading the red circle.
  incomingSmash(f) {
    const R = 86;
    for (const e of this.liveEnemies()) {
      if (e.telegraphKind !== 'smash' || e.telegraph <= 0 || !e.smashTarget) continue;
      if (Math.hypot(f.x - e.smashTarget.x, f.y - e.smashTarget.y) <= R + 18) return e.smashTarget;
    }
    return null;
  }

  // Only a support skill can actually heal or buff. "Heal" gambits never
  // blindly cast an offensive skill just because its cooldown is ready.
  supportSlot(f,kind) {
    for(const [slot,sk,cd] of [['e',f.eSkill,f.cd.e],['q',f.qSkill,f.cd.q]]){
      if(!sk||cd>0)continue;
      if(kind==='heal'&&sk.kind==='heal')return slot;
      if(kind==='shield'&&sk.kind==='buff'&&(!f.shieldT||f.shieldT<.25))return slot;
      if(kind==='buff'&&sk.kind==='buff'&&(!f.damageBoostT||f.damageBoostT<.3))return slot;
    }
    return null;
  }

  castSlot(f,slot,aim) {
    return slot==='q'?this.skillQ(f,aim):slot==='e'?this.skillE(f,aim):false;
  }

  markAutoAction(f,what) {
    if(f!==this.me())return;
    this._autoLastAction=what;
    this._autoLastAt=this.t;
  }

  // BASIC attacks are independent of the Q/E planner. An equipped melee basic
  // must close into claw contact; the fallback toy projectile expires after 0.5s.
  basicAttackRange(f,target=null) {
    const sk=f.basicSkill, r=target?.r||18;
    if(sk?.kind==='melee')return 64+r*.6-2;
    if(sk?.kind==='dash')return 112;
    if(sk?.kind==='pounce')return 135;
    if(sk?.kind==='chain')return 200;
    // Toy toss spawns 22px ahead and travels at projSpeed for 0.5s.
    // Leave a small margin for moving targets and lead-angle error.
    return Math.min(175,22+(f.projSpeed||300)*.5+r*.35-9);
  }

  autoBasicAttack(f,tgt) {
    if(!f?.alive||!tgt?.alive||f.cd.basic>0||f._castRoot>0||f._beamRoot>0)return false;
    const target=this.commandTarget?tgt:this.unwardedTarget(f,tgt);
    if(!target?.alive)return false;
    const dist=Math.hypot(target.x-f.x,target.y-f.y);
    if(dist>this.basicAttackRange(f,target))return false;
    // Only projectile-based basics can bounce off the enemy's reflect wall.
    const kind=f.basicSkill?.kind||'projectile';
    if(['projectile','beam'].includes(kind) &&
       (this.reflectCovers(target,f.x,f.y)||this.wallBlockingLine(f.x,f.y,target.x,target.y,'me')))
      return false;
    const aim=this.autoAim(f,target,f.projSpeed||300);
    f._aim=aim;
    this.fireBasic(f,aim);
    return true;
  }

  // ---- KIT-BASED RANGE BAND ---------------------------------------------------
  // A fighter's preferred engagement distance should come from the TOOLS it carries,
  // not one fixed number. A brawler (melee/dash/leap/pounce kit) wants to be on top
  // of the target; a ranged/projectile/beam kit wants to kite at a comfortable band;
  // a support kit (heal/buff only) hangs well back. Returns {min,max,rush} (px) plus
  // a 'role' tag the steering + action layers read. HP-gate: when badly hurt the
  // whole band shifts outward (retreat) so a dying cat backs off like a human would.
  //   rush  : below min → close the gap hard (seek)
  //   min..max : hold the band → strafe
  //   above max : too far → re-approach (seek)
  kitRangeBand(f) {
    const skills=[f.qSkill,f.eSkill].filter(Boolean);
    const isMelee=sk=>sk&&(sk.kind==='melee'||sk.kind==='dash'||sk.kind==='leap'||sk.kind==='pounce');
    const isRanged=sk=>sk&&(sk.kind==='projectile'||sk.kind==='beam'||sk.kind==='aoe');
    const isSupport=sk=>sk&&(sk.kind==='heal'||sk.kind==='buff');
    const basicRange=this.basicAttackRange(f);           // keep movement inside the actual basic's hit reach
    let role,min,max;
    const meleeReach=Math.max(...skills.filter(isMelee).map(sk=>(
      sk.kind==='melee'?76:sk.kind==='dash'?122:sk.kind==='leap'?165:152)),0);
    const hasMelee=skills.some(isMelee), hasRanged=skills.some(isRanged);
    // Combat positioning is owned by the CAT'S BUILD, not by whichever skill
    // happens to be slotted in Q/E. A tank/fighter/assassin may equip a ranged
    // poke without turning into a backline kiter.
    const build=f.cat?.buildType||window.Skills?.buildTypeForBreed?.(f.cat);
    const frontliner=build==='tank'||build==='fighter'||build==='assassin';
    // Is a melee/gap-closer skill READY right now? (drives hit-and-run: commit when the
    // skill is up, kite out while it recharges instead of hugging and eating free hits).
    const meleeReady=['q','e'].some(slot=>{
      const sk=slot==='q'?f.qSkill:f.eSkill;
      return isMelee(sk) && (f.cd?.[slot]||0)<=0;
    });
    if(frontliner){
      // Keep frontline breeds at contact range even with ranged Q/E or a
      // defensive-only kit. Ranged skills are opportunistic pokes WHILE closing.
      // When a melee special is on cooldown, allow a little breathing room but
      // NEVER fall back to a 190–230px ranged orbit.
      role=build==='tank'?'tank':build==='assassin'?'assassin':'melee';
      const readyReach=hasMelee&&meleeReady
        ?Math.min(96,Math.max(70,meleeReach*.77))
        :build==='tank'?96:build==='assassin'?82:90;
      min=build==='tank'?45:build==='assassin'?32:38;
      max=readyReach;
      if(hasMelee&&!meleeReady){min+=22;max+=20;}
    }else if(hasMelee&&!hasRanged){
      // Explicit backline builds with a melee-only loadout still need to close
      // enough to land those skills. Reposition briefly between skill casts.
      role='melee';
      if(meleeReady){min=38;max=Math.max(68,Math.min(110,meleeReach*.89));}
      else {min=96;max=150;}
    }else if(hasRanged&&!hasMelee){
      // kiter: sit at 0.55–0.85 of the projectile reach, flee if closer, seek if farther
      role='ranged';
      // Ranged Q/E attacks reach farther than the basic toy. Holding the old
      // 150–230px Q/E-only band left the cat forever outside basic range.
      // Keep a real minimum standoff (>120 px) but remain inside basic attack reach.
      min=Math.min(Math.max(124,basicRange*.66),Math.max(40,basicRange-28));
      max=Math.max(min+18,basicRange*.94);
    }else if(skills.length&&skills.every(isSupport)){
      // SUPPORT cats must still be able to use their only offensive action.
      // Their old 230–320px ally band exceeded their ~170px basic shot lifetime,
      // so teammates literally never fired a basic. Stay behind melee fighters
      // but inside basic reach, regardless of who the active cat is.
      role='support'; min=Math.max(90,basicRange*.7); max=Math.max(min+18,basicRange*.94);
    }else if(hasMelee&&hasRanged){
      // hybrid: a brawler who can also poke — favour the aggressive band but keep poke
      role='bruiser'; min=Math.max(55,meleeReach*0.4); max=Math.max(130,meleeReach*0.95);
    }else{
      // no offensive kit yet → fight at basic-toy range
      role='basic'; min=Math.max(35,basicRange*.68); max=Math.max(min+12,basicRange-10);
    }
    // HP-gated retreat: shift the band outward + widen as HP drops below 30%.
    const hp=f.hp/f.maxhp;
    if(hp<0.3){const push=(0.3-hp)/0.3*120;min+=push;max+=push;}
    const rush=min; // alias for readability at the call site
    return {min,max,rush,role,hp};
  }

  // Per-fighter orbit sign (±1) that flips on a random 0.8–2.5s cadence, with the
  // OCCASIONAL feint (a quick extra reversal) so a human can't just pre-aim the
  // strafe. Shared by the active cat and allies/enemies (keyed by a prefix so each
  // entity keeps its own timer/phase without colliding).
  orbitSign(e,key,dt){
    const kT=key+'FlipT',kS=key+'Sign',kF=key+'Feint';
    if(e[kS]==null)e[kS]=Math.random()<0.5?-1:1;
    e[kT]=(e[kT]||0)-(dt||0);
    if(e[kT]<=0){
      e[kS]=-e[kS];
      e[kT]=1.6+Math.random()*1.8;                   // next scheduled flip (1.6–3.4s: a deliberate direction change, not a vibration)
      // ~10% of flips are a "feint": reverse again almost immediately (rare, so it reads as a juke not jitter)
      e[kF]=Math.random()<0.10?0.14+Math.random()*0.12:0;
    }
    if(e[kF]>0){e[kF]-=(dt||0);if(e[kF]<=0){e[kS]=-e[kS];}}
    return e[kS];
  }

  // Persistent WANDER: a slowly random-walking heading projected onto a small circle
  // ahead of the fighter. Cheap, bounded, and gives movement organic drift so two
  // cats with the same band don't trace identical arcs. Returns a unit-ish vector.
  wanderVec(e,key,dt){
    const k=key+'Theta',kr=key+'WRate';
    // Low-frequency drift: theta advances at a per-fighter rate that itself slews only
    // gently, so the heading sweeps smoothly instead of jumping every frame. (The old
    // version re-rolled a full ±2.5 rad/s step each frame → that read as jitter.)
    if(e[k]==null){e[k]=Math.random()*Math.PI*2;e[kr]=(Math.random()*2-1)*0.9;}
    // nudge the drift rate slowly (bounded) so the wander isn't perfectly periodic
    e[kr]=clamp(e[kr]+(Math.random()*2-1)*0.4*(dt||0.016),-1.1,1.1);
    e[k]+=e[kr]*(dt||0.016);
    return {x:Math.cos(e[k]),y:Math.sin(e[k])};
  }

  // Blend a kit band into a movement vector: seek when outside the band, flee when
  // inside its inner edge, strafe (randomized flipping orbit) while holding it, plus
  // a light wander. nx,ny = unit vector toward the target; dist = current distance.
  bandSteer(f,nx,ny,dist,band,dt){
    const d=dt!=null?dt:(this._lastDt||0.016);
    // HYSTERESIS: switch mode only when CLEARLY past a threshold, and switch back only
    // when clearly returned — so a cat sitting right on band.min/band.max doesn't flip
    // between rush and strafe every frame (that boundary chatter was a big twitch source).
    const BUF=22;
    let mode=f._steerMode||'hold';
    if(mode==='hold'){
      if(dist<band.min-BUF)mode='retreat';
      else if(dist>band.max+BUF)mode='rush';
    }else if(mode==='retreat'){
      if(dist>band.min+BUF)mode='hold';           // re-entered the band comfortably
    }else if(mode==='rush'){
      if(dist<band.max-BUF)mode='hold';
    }
    f._steerMode=mode;
    let mx,my;
    if(mode==='retreat'){           // too close → back off (kite / keep melee from overshooting)
      mx=-nx;my=-ny;
    }else if(mode==='rush'){        // too far → close in
      mx=nx;my=ny;
    }else{                          // in the band → orbit with a slight range-correction
      const dir=this.orbitSign(f,'_orbit',d);
      mx=-ny*dir;my=nx*dir;
      // nudge toward band centre (too far = inward, too close = outward)
      const mid=(band.min+band.max)*0.5, corr=clamp((dist-mid)/120,-0.5,0.5);
      mx+=nx*corr;my+=ny*corr;
    }
    const w=this.wanderVec(f,'_wander',d);
    mx+=w.x*0.2;my+=w.y*0.2;
    return {x:mx,y:my};
  }

  // STEERING INERTIA: the raw per-frame desired direction (mx,my) can swing wildly
  // frame-to-frame (orbit flip, wander, rush↔strafe transitions, separation). Applying
  // it straight to position makes the cat snap/vibrate. Instead keep a per-fighter
  // smoothed steering velocity and ease it toward the desired unit heading each frame,
  // then move by the SMOOTHED heading. This removes the twitch while staying responsive
  // (K≈8 → it re-aims in ~1/8s, fast enough to still kite/dodge). Returns the moved-by
  // unit vector (or null if effectively idle). Does NOT change top speed.
  smoothSteer(f,mx,my,K){
    const mag=Math.hypot(mx,my);
    const dx=mag>1e-4?mx/mag:0, dy=mag>1e-4?my/mag:0;   // desired unit heading
    const a=Math.min(1,(this._lastDt||0.016)*(K||8));
    f._svx=(f._svx||0)+(dx-(f._svx||0))*a;
    f._svy=(f._svy||0)+(dy-(f._svy||0))*a;
    const sm=Math.hypot(f._svx,f._svy);
    if(sm<0.04)return null;
    return {x:f._svx/sm,y:f._svy/sm,raw:mag};
  }

  // A held reflect wall is a directional defensive stance, not a kiting buff.
  // Move *toward* an approaching shot to keep the front hemisphere covered.
  // Without an incoming shot, guard toward the selected enemy. The movement
  // heading is also the actual wall heading; no free 360-degree rotation.
  reflectGuardDirection(f, target, owner) {
    if (!(f.reflectT > 0)) return null;
    let best=null, bestTime=Infinity;
    for(const p of this.projectiles) {
      if(p.owner!==owner || p.burst)continue;
      const vx=p.vx||0,vy=p.vy||0,v2=vx*vx+vy*vy;
      if(v2<1)continue;
      const rx=f.x-p.x,ry=f.y-p.y;
      const t=(rx*vx+ry*vy)/v2;
      if(t<0||t>0.8)continue;
      if(Math.hypot(rx-vx*t,ry-vy*t)>Math.max(48,(f.r||18)+22))continue;
      if(t<bestTime){best=p;bestTime=t;}
    }
    const source=best||target;
    if(!source)return null;
    const dx=source.x-f.x,dy=source.y-f.y,mag=Math.hypot(dx,dy);
    if(mag<2)return null;
    return {x:dx/mag,y:dy/mag};
  }

  // Movement and action selection share the same engagement distance, so an
  // autopilot won't stand outside the range of its own basic attack.
  autoDrive(dt) {
    if(!this.me()?.alive)return;
    if(this.t-(this._autoLastSwitch||-20)>5){
      const f=this.me();
      const replacement=this.team
        .map((cat,i)=>({cat,i}))
        .filter(({cat,i})=>i!==this.active&&cat.alive&&cat.hp/cat.maxhp>.52)
        .sort((a,b)=>b.cat.hp/b.cat.maxhp-a.cat.hp/a.cat.maxhp)[0];
      if(replacement&&f.hp/f.maxhp<.24){
        this.switchTo(replacement.i);
        this._autoLastSwitch=this.t;
        this.markAutoAction(this.me(),'低血量换猫');
      }
    }
    const f=this.me();
    const tgt=this.commandedTarget(f.x,f.y);
    if(!tgt)return;
    const dx=tgt.x-f.x,dy=tgt.y-f.y,dist=Math.hypot(dx,dy)||1;
    const aim=Math.atan2(dy,dx);this.aim=aim;f._aim=aim;
    let threat=this.incomingThreat(f);
    // Don't juke away from EVERY shot — a per-threat roll (sticky for the threat's
    // life) so the squad eats some hits instead of ping-ponging untouchably.
    if(threat){
      if(this._sidestepUntil==null||this.t>this._sidestepUntil){
        this._sidestep=Math.random()<this.autoDodgeChance(f); this._sidestepUntil=this.t+0.35;
      }
      if(!this._sidestep)threat=null;
    }
    let mx=0,my=0,evasive=false;
    // TOP PRIORITY: get out of a telegraphed must-dodge smash disc (auto-mode must
    // respect the same forcing function the player does) — flee straight out of it.
    const smash=this.incomingSmash(f);
    if(smash){
      const ddx=f.x-smash.x,ddy=f.y-smash.y,dd=Math.hypot(ddx,ddy)||1;
      mx=ddx/dd;my=ddy/dd;evasive=true;         // snap: evasion must stay crisp
    }else if(f.reflectT>0 && this.reflectGuardDirection(f,tgt,'wild')){
      const guard=this.reflectGuardDirection(f,tgt,'wild');
      mx=guard.x;my=guard.y;  // face incoming shot; half-speed stance
    }else if(threat){
      const p=threat.p,sp=Math.hypot(p.vx,p.vy)||1;
      const side=f.i%2?-1:1;
      mx=-p.vy/sp*side;my=p.vx/sp*side;evasive=true;
    }else{
      // KIT-BASED engagement: a melee/dash cat RUSHES in, a ranged/beam cat KITES at
      // its band, a support cat HANGS BACK. The band comes from the equipped skills
      // (+ an HP-gated retreat). Within the band we STRAFE on a randomized orbit that
      // periodically flips, plus a persistent wander, so the path never reads as a
      // fixed circle. (A focus-fire command just picks which enemy; the band is kept.)
      const band=this.kitRangeBand(f);
      const nx=dx/dist,ny=dy/dist;
      const steer=this.bandSteer(f,nx,ny,dist,band,dt);
      mx=steer.x;my=steer.y;
      // separation so the active cat doesn't stack on an ally (sq-dist early-out)
      for(const o of this.team){
        if(o===f||!o.alive)continue;
        const sx=f.x-o.x,sy=f.y-o.y,sd2=sx*sx+sy*sy;
        if(sd2<3600&&sd2>1){const sd=Math.sqrt(sd2);mx+=sx/sd*0.45;my+=sy/sd*0.45;}
      }
    }
    // Ease the desired heading through the per-fighter smoothed velocity so the cat
    // doesn't snap when the desired direction jumps. Evasion (smash/threat) re-aims
    // much faster (K≈22, near-instant) so dodging stays crisp; cruising uses K≈8.
    const dir=this.smoothSteer(f,mx,my,evasive?22:8);
    if (dir) { f._moveFacing = Math.atan2(dir.y,dir.x); if(f.reflectT>0)f._wallDesiredAngle=Math.atan2(tgt.y-f.y,tgt.x-f.x); }
    if(dir && !(f.dashT>0&&f.pounce) && !(f._leapT>0) && f.rootT<=0 && !(f._beamRoot>0) && !(f._castRoot>0)){
      const spd=(f.dashT>0?f.speed*3:f.speed)*this.moveMul(f);
      f.x=clamp(f.x+dir.x*spd*dt,BATTLE_MARGIN.side,this.W-BATTLE_MARGIN.side);
      f.y=clamp(f.y+dir.y*spd*dt,this.topMargin,this.H-this.bottomMargin);
      // facing follows the smoothed heading, and only flips on a meaningful horizontal
      // component so micro dx doesn't strobe the sprite left/right every frame.
      if(dir.x<-0.25)f.face=-1;else if(dir.x>0.25)f.face=1;
      f.moving=true;
    }else f.moving=false;
    const near=threat?.p||null;
    // HUMAN-LIKE CADENCE: a person doesn't re-decide and fire skills every frame.
    // Gate skill decisions to a ~0.28s reaction interval (jittered), so auto-battle
    // reads like a competent player, not a frame-perfect robot. Dodging a genuine
    // incoming threat is allowed to react faster (people flinch at danger).
    this._autoDecCd = (this._autoDecCd || 0) - dt;
    if (this._autoDecCd <= 0 || (threat && this._autoDecCd < 0.12)) {
      this._autoDecCd = 0.24 + Math.random() * 0.18;     // 0.24–0.42s between decisions
      this.evalGambits(f,tgt,Math.hypot(tgt.x-f.x,tgt.y-f.y),near,threat?.d??Infinity);
    }
  }

  // Context-sensitive default planner: defence, sustain, burst, elemental
  // skills, pounce and basic attacks. Never spend heals at full HP or melee
  // skills outside their hit radius.
  smartAutoAction(f,tgt,dist,threat) {
    if(!tgt||!f.alive)return;
    // WARD-AWARE TARGETING: if the chosen enemy is warded (barrier/reflect/protect) and a
    // live un-warded enemy exists, switch to it (sticky, so wards flickering don't cause
    // ping-pong). Re-derive distance/aim for the possibly-new target.
    const picked=this.commandTarget ? tgt : this.unwardedTarget(f,tgt);
    if(picked&&picked!==tgt){ tgt=picked; dist=Math.hypot(tgt.x-f.x,tgt.y-f.y)||1; }
    const tgtWarded=this.enemyWarded(tgt,f);
    const tgtReflect=this.reflectCovers(tgt,f.x,f.y) ||
      !!this.wallBlockingLine(f.x,f.y,tgt.x,tgt.y,'me');
    // Auto fire LEADS the target (true intercept), so basics/projectile skills hit a
    // moving enemy instead of trailing it. Facing uses the same lead so the cat looks
    // where it shoots. Melee/close casts resolve to ~current pos (tiny lead time).
    const aim=this.autoAim(f,tgt,f.projSpeed);
    f._aim=aim;
    // Auto-battle dodges like a competent human, NOT a frame-perfect robot: it only
    // reacts to ~55% of threats (less when it's cruising unhurt), so the player still
    // takes hits and the fight has stakes. (Playtest: auto evasion was too strong.)
    if(threat && !(f.reflectT>0 && threat.p && this.reflectCovers(f,threat.p.x,threat.p.y)) &&
       f.dodgeCd<=0&&Math.random()<this.autoDodgeChance(f)){
      if(this.dodge(f)!==false){this.markAutoAction(f,'闪避危险弹幕');return;}
    }
    const hp=f.hp/f.maxhp;
    const heal=this.supportSlot(f,'heal');
    if(hp<.62&&heal){
      if(this.castSlot(f,heal,aim)!==false){this.markAutoAction(f,'恢复斗志');return;}
    }
    const shield=this.supportSlot(f,'shield');
    if(shield&&(hp<.70||dist<145)){
      if(this.castSlot(f,shield,aim)!==false){this.markAutoAction(f,'展开护盾');return;}
    }
    if(f===this.me()&&this.canUltimate()&&this.ultWillConnect(f)){
      if(this.ultimate()!==false){this.markAutoAction(f,'释放必杀技');return;}
    }
    const rangedKind=k=>k==='projectile'||k==='beam';   // reflectable shots
    const offensive=(sk,slot)=>{
      if(!sk)return slot==='q'&&dist<310&&!tgtReflect;    // default poke is a projectile → not into a reflect wall
      if(sk.kind==='heal'||sk.kind==='buff')return false;
      // HARD RULE: never fire a reflectable shot (projectile/beam) at a reflect wall —
      // it bounces straight back as self-damage. Melee/aoe/dash still allowed (not reflected).
      if(tgtReflect&&rangedKind(sk.kind))return false;
      // Physical claw sweep reaches 64px plus part of the target body radius.
      // The previous <=106 decision gate spent melee skills outside that geometry.
      if(sk.kind==='melee')return dist<=64+(tgt.r||18)*.65-2;
      if(sk.kind==='dash')return dist>55&&dist<f.speed*3*.26+42;
      if(sk.kind==='leap')return dist>70&&dist<240;         // 泰山压顶 reach band
      if(sk.kind==='pounce')return dist>60&&dist<300;       // 飞扑 gap-closer band
      if(sk.id==='prismBeam')return dist<525;                // actual piercing ray reach
      return dist<460;
    };
    if(f.cd.q<=0&&offensive(f.qSkill,'q')){
      if(this.skillQ(f,aim)!==false){this.markAutoAction(f,'技能：'+(f.qSkill?.name||'毛球散射'));return;}
    }
    if(f.cd.e<=0&&offensive(f.eSkill,'e')){
      if(this.skillE(f,aim)!==false){this.markAutoAction(f,'技能：'+(f.eSkill?.name||'疾扑'));return;}
    }
    const buff=this.supportSlot(f,'buff');
    if(buff&&dist<290){
      if(this.castSlot(f,buff,aim)!==false){this.markAutoAction(f,'强化自身');return;}
    }
    // Basic runs on its OWN cooldown from updateAllyAI every frame.
    // Never gate it behind successful Q/E/heal/ultimate decision returns.
  }

  // All auto-controlled cats use the same adaptive, kit-aware planner.
  // Legacy saved gambit arrays remain in save data but do not affect behavior.
  evalGambits(f,tgt,dist,nearProj,nd) {
    if (!tgt || !f?.alive) return;
    this.smartAutoAction(f,tgt,dist,this.incomingThreat(f));
  }

  // Lock by enemy ID, not a stale tap coordinate: a moving pack must not
  // silently move the entire squad's focus to a different cat.
  commandFocusAt(x, y) {
    if (!this.autoMode) return false;
    const target = this.nearestEnemy(x, y);
    if (!target) return false;
    const radius = Math.max(this.game.isTouch ? 51 : 36,
      (target.r || 18) + (this.game.isTouch ? 27 : 20));
    if (Math.hypot(target.x - x, target.y - y) > radius) return false;
    this.commandTarget = { id: target.i };
    this._lockIdx = target.i;
    this.vfx.ring(target.x, target.y,
      { r0: 12, vr: 180, life: .4, color: '#ff5a7a', width: 3 });
    return true;
  }
  commandedTarget(fromX, fromY) {
    if (this.commandTarget) {
      const target = this.liveEnemies().find(e => e.i === this.commandTarget.id);
      if (target) return target;
      this.commandTarget = null; // target defeated: resume nearest-enemy AI
    }
    return this.nearestEnemy(fromX, fromY);
  }
  // An enemy is "warded" while it has a damage-reducing barrier, a reflect wall, or a
  // full protect up — attacking it is wasteful (and firing a projectile into a reflect
  // wall bounces back as SELF-damage). Auto-battle uses this to retarget / hold fire.
  // Front-facing reflection is dangerous only to attackers in front of the wall.
  reflectCovers(target, fromX, fromY) {
    if (!target || !(target.reflectT > 0) || target._flatWall) return false;
    const angle=target._reflectFacing ?? target._moveFacing ?? (target.face<0?Math.PI:0);
    return (fromX-target.x)*Math.cos(angle)+(fromY-target.y)*Math.sin(angle)>=0;
  }
  enemyWarded(e, attacker) {
    return !!e && ((e.shieldT > 0.25) || (e.protectT > 0) ||
      (e.reflectT > 0 && (!attacker || this.reflectCovers(e,attacker.x,attacker.y))));
  }
  // Prefer a live UN-warded enemy when the current pick is warded and another is free.
  // Sticky: once we retarget, keep the new one for ≥0.3s so flickering wards don't cause
  // target ping-pong (which would spread damage and look indecisive).
  unwardedTarget(f, cur) {
    if (!this.enemyWarded(cur,f)) return cur;
    if (f._wardSwitchUntil && this.t < f._wardSwitchUntil && f._wardSwitchTgt &&
        f._wardSwitchTgt.alive && !this.enemyWarded(f._wardSwitchTgt,f)) return f._wardSwitchTgt;
    let best = null, bd = 1e9;
    for (const e of this.liveEnemies()) {
      if (this.enemyWarded(e,f)) continue;
      const d = Math.hypot(e.x - f.x, e.y - f.y);
      if (d < bd) { bd = d; best = e; }
    }
    if (best) { f._wardSwitchTgt = best; f._wardSwitchUntil = this.t + 0.3; return best; }
    return cur;   // everyone is warded → caller repositions instead of feeding the ward
  }

  // Ally AI: a non-active team cat fights on its own — flanks near the player,
  // dodges incoming fire, and focus-fires the commander's target when one is set.
  updateAllyAI(dt, f) {
    const tgt = this.commandedTarget(f.x, f.y);
    if (!tgt) return;
    const dx = tgt.x - f.x, dy = tgt.y - f.y, dist = Math.hypot(dx, dy) || 1;
    if(f.reflectT>0)f._wallDesiredAngle=Math.atan2(dy,dx);
    // flee nearest enemy projectile
    let near = null, nd = 1e9;
    for (const p of this.projectiles) { if (p.owner !== 'wild') continue; const d = Math.hypot(p.x - f.x, p.y - f.y); if (d < nd) { nd = d; near = p; } }
    let mx = 0, my = 0, evasive = false;
    // allies also only juke SOME incoming shots (per-ally sticky roll), not all.
    if (near && (f._allyStepUntil == null || this.t > f._allyStepUntil)) { f._allyStep = Math.random() < this.autoDodgeChance(f); f._allyStepUntil = this.t + 0.35; }
    const allySmash = this.incomingSmash(f);
    if (allySmash) { const ax = f.x - allySmash.x, ay = f.y - allySmash.y, ad = Math.hypot(ax, ay) || 1; mx = ax / ad; my = ay / ad; evasive = true; }  // flee the smash disc first
    else if(f.reflectT>0 && this.reflectGuardDirection(f,tgt,'wild')) {
      const guard=this.reflectGuardDirection(f,tgt,'wild');mx=guard.x;my=guard.y;
    }
    else if (near && nd < 100 && f._allyStep) { const pv = Math.hypot(near.vx, near.vy) || 1; mx = -near.vy / pv; my = near.vx / pv; evasive = true; }
    else if((f.cat.buildType||Skills.buildTypeForBreed(f.cat))==='dps' &&
        this.wallFlankVector(f,tgt,'me')){
      const flank=this.wallFlankVector(f,tgt,'me');
      mx=flank.x;my=flank.y;
    }
    else {
      // same KIT-BASED band as the active cat: brawler allies rush, ranged allies
      // kite, support allies hang back — each on its own flipping orbit + wander.
      const band = this.kitRangeBand(f);
      const nx = dx / dist, ny = dy / dist;
      const steer = this.bandSteer(f, nx, ny, dist, band, dt);
      mx = steer.x; my = steer.y;
      // separation from the active cat & other allies (sq-dist early-out)
      for (const o of this.team) { if (o === f || !o.alive) continue; const sx = f.x - o.x, sy = f.y - o.y, sd2 = sx * sx + sy * sy; if (sd2 < 3600 && sd2 > 1) { const sd = Math.sqrt(sd2); mx += sx / sd * 0.6; my += sy / sd * 0.6; } }
    }
    // Same steering inertia as the active cat: ease the desired heading through the
    // fighter's smoothed velocity so allies glide instead of twitching. Note the old
    // code moved by the RAW (unnormalized) mx/my — magnitude varied wildly frame to
    // frame; smoothSteer normalizes to a unit heading, so speed is now steady too.
    const dir = this.smoothSteer(f, mx, my, evasive ? 22 : 8);
    if (dir) { f._moveFacing = Math.atan2(dir.y,dir.x); if(f.reflectT>0)f._wallDesiredAngle=Math.atan2(tgt.y-f.y,tgt.x-f.x); }
    if (dir && f.dashT <= 0 && f.rootT <= 0 &&
        !(f._beamRoot>0) && !(f._castRoot>0)) {
      const spd = f.speed * this.moveMul(f);   // equal auto-speed for every team cat
      f.x = clamp(f.x + dir.x * spd * dt, BATTLE_MARGIN.side, this.W - BATTLE_MARGIN.side);
      f.y = clamp(f.y + dir.y * spd * dt, this.topMargin, this.H - this.bottomMargin);
      if (dir.x < -0.25) f.face = -1; else if (dir.x > 0.25) f.face = 1;
      f.moving = true;
    } else if (f.dashT <= 0 && f.rootT <= 0) f.moving = false;
    if(near && !(f.reflectT>0 && this.reflectCovers(f,near.x,near.y)) &&
       this.incomingThreat(f) && f.dodgeCd<=0 && Math.random()<this.autoDodgeChance(f)) this.dodge(f);
    // Shared decision loop for active and allied cats. Only the current active cat
    // owns the manual aim/UI; its autonomous movement/combat does not differ.
    if(f===this.me()) this.aim=f._aim=Math.atan2(tgt.y-f.y,tgt.x-f.x);
    // Fire independent of the skill decision cadence, for active-auto and ALL
    // allied cats alike. Range is evaluated AFTER movement this frame.
    this.autoBasicAttack(f,tgt);
    this.evalGambits(f, tgt, Math.hypot(tgt.x-f.x,tgt.y-f.y), near, nd);
  }

  // ---------------- input (polled from game.keys / game.mouse) ----------------
  readInput(dt) {
    // During the ultimate cinematic the player is locked out (it's a scripted beat).
    if (this.ultCinematic) { this._prevKeys = Object.assign({}, this.game.keys || {}); return; }
    const K = this.game.keys || {};
    const m = this.game.mouse || { x: this.W / 2, y: this.H / 2 };
    const f = this.me();

    // 'p' toggles auto/commander mode (edge-triggered)
    if (K['p'] && !this._prevKeys['p']) this.toggleAuto();

    if (this.autoMode) {
      // Commander mode: the AI moves, but the PLAYER can still manually fire aimed
      // skills. autoDrive runs first (and sets this.aim at the AI's target); when the
      // human presses a skill we override aim toward THEIR cursor/locked target so a
      // directional/AOE/heal cast goes where they intend, not where the AI was facing.
      // The selected cat uses the same autonomy, range bands and speed as teammates.
      this.updateAllyAI(dt, this.me());
      const pressedC = k => K[k] && !this._prevKeys[k];
      const me = this.me();
      const playerAim = () => {
        if (!me) return this.aim;
        if (!this.game.isTouch && m) return Math.atan2(m.y - me.y, m.x - me.x);
        const t = this.lockedEnemy() || this.nearestEnemy(me.x, me.y);
        return t ? Math.atan2(t.y - me.y, t.x - me.x) : this.aim;
      };
      if (pressedC('r')) this.ultimate();
      if (pressedC('f')) this.castDuo();
      if (pressedC('1')) this.switchTo(0);
      if (pressedC('2')) this.switchTo(1);
      if (pressedC('3')) this.switchTo(2);
      if (pressedC('q')) { const a = playerAim(); this.aim = a; if (me) me._aim = a; this.skillQ(me, a); }
      if (pressedC('e')) { const a = playerAim(); this.aim = a; if (me) me._aim = a; this.skillE(me, a); }
      if (pressedC(' ')) this.dodge();                             // manual dodge in auto too
      // Focus is set on pointer-down by game.js, once per click/tap.
      // Holding or dragging must not silently retarget the squad.
      this._prevKeys = Object.assign({}, K);
      return;
    }

    // aim: toward mouse on desktop; on touch, auto-aim the locked/nearest enemy.
    // The soft lock lets a phone player focus-fire one cat instead of the game
    // thrashing to whichever happens to be nearest as the pack orbits.
    const joy = this.game.joystick;
    if (this.game.isTouch) {
      let tgt = this.lockedEnemy();
      if (!tgt) { tgt = this.nearestEnemy(f.x, f.y); if (tgt) this._lockIdx = tgt.i; }  // auto-lock nearest
      if (tgt) this.aim = Math.atan2(tgt.y - f.y, tgt.x - f.x);
    } else {
      this.aim = Math.atan2(m.y - f.y, m.x - f.x);
    }

    if(f.reflectT>0)f._wallDesiredAngle=this.aim; // stationary cats turn too (slowly)

    // movement: WASD/arrows OR the virtual joystick
    let mx = 0, my = 0;
    if (K['w'] || K['arrowup']) my -= 1;
    if (K['s'] || K['arrowdown']) my += 1;
    if (K['a'] || K['arrowleft']) mx -= 1;
    if (K['d'] || K['arrowright']) mx += 1;
    if (joy && joy.active && (Math.abs(joy.dx) > 0.15 || Math.abs(joy.dy) > 0.15)) { mx += joy.dx; my += joy.dy; }
    if (f.rootT > 0 || (f._beamRoot > 0) || (f._castRoot > 0) ||
        (f.dashT > 0 && f.pounce)) { mx = 0; my = 0; }
    // Dash is moved in tick by its locked direction; manual movement must not
    // add a second displacement or stretch a contact attack into ranged travel.
    f._mvx = mx; f._mvy = my;                            // remember input so dodge can flee the right way
    if (mx || my) {
      const l = Math.hypot(mx, my);
      f._moveFacing = Math.atan2(my, mx);
      if(f.reflectT>0)f._wallDesiredAngle=this.aim;
      const spd = (f.dashT > 0 ? f.speed * 3 : f.speed) * this.moveMul(f);   // 冰冻/束缚/感电 减速
      f.x += (mx / l) * spd * dt;
      f.y += (my / l) * spd * dt;
      f.face = mx < 0 ? -1 : (mx > 0 ? 1 : f.face);
      f.moving = true;
      if (f === this.me()) this._coachMoved = true;      // first-fight coach: step 1 done
    } else { f.moving = false; }
    // Dashing without a held direction travels along the dodge's chosen flee heading
    // (_dashAim), NOT the aim reticle — so a standing dodge never lurches into the enemy.
    if (f.dashT > 0 && !mx && !my) { const a = f._dashAim != null ? f._dashAim : this.aim; f.x += Math.cos(a) * f.speed * 3 * dt; f.y += Math.sin(a) * f.speed * 3 * dt; }
    f.x = clamp(f.x, BATTLE_MARGIN.side, this.W - BATTLE_MARGIN.side);
    f.y = clamp(f.y, this.topMargin, this.H - this.bottomMargin);

    // edge-triggered actions
    const pressed = k => K[k] && !this._prevKeys[k];
    // basic attack: left mouse held OR J
    if (m.down || K['j'] || (this.game.isTouch&&this.game.touchAutoFire)) this.fireBasic();
    if (pressed('q')) this.skillQ();
    if (pressed('e')) this.skillE();
    if (pressed(' ')) this.dodge();
    if (pressed('r')) this.ultimate();
    if (pressed('f')) this.castDuo();
    if (pressed('tab')) this.cycleTarget();   // focus-fire: cycle the locked enemy
    if (pressed('1')) this.switchTo(0);
    if (pressed('2')) this.switchTo(1);
    if (pressed('3')) this.switchTo(2);

    this._prevKeys = Object.assign({}, K);
  }

  // mouse-only / on-screen button casts (aim auto toward nearest enemy)
  castMove(key) {
    const f = this.me();
    const e = this.lockedEnemy()||this.nearestEnemy(f.x, f.y);
    if (e) this.aim = Math.atan2(e.y - f.y, e.x - f.x);
    if(key==='duo')return this.castDuo();
    if (key === 'basic') this.fireBasic();
    else if (key === 'q') this.skillQ();
    else if (key === 'e') this.skillE();
    else if (key === 'ult') this.ultimate();
  }

  // Compact cast/hit flourishes for regular skills. Visual only: this does
  // NOT change damage, radius, cooldown, projectile speed or target selection.
  regularSkillAccent(f,element,angle=0,isBasic=false,hit=false){
    if(!f||this.skillStrokes.length>55)return;
    const e=['fire','water','grass','elec','dark','light'].includes(element)?element:'light';
    const time=hit?.29:isBasic?.23:.39;
    const reach=hit?0:isBasic?17:23;
    this.skillStrokes.push({
      kind:'regularAccent',element:e,hit:!!hit,isBasic:!!isBasic,
      x:f.x+Math.cos(angle)*reach,
      y:f.y+(hit?0:9)+Math.sin(angle)*reach*.55,
      angle,life:time,max:time
    });
  }

  // actions accept an optional fighter + aim so ALLIES can use them too.
  fireBasic(f, aim) {
    f = f || this.me(); if (f.cd.basic > 0) return;
    if (aim == null) aim = (f === this.me()) ? this.aim : f._aim || 0;
    if (f === this.me() && this._obs) this._obs.fires++;    // aggression signal
    if (f === this.me()) this._coachAttacked = (this._coachAttacked || 0) + 1;   // coach: step 2
    // CHOSEN BASIC SKILL: if the player slotted a low-power attack as their basic
    // (incl. 烈焰猫爪), fire THAT as the left-click attack instead of the toy toss.
    // It keeps a short, basic-like cadence (floored CD) and still marks itself isBasic
    // so the finisher-on-marked / weaker-on-unmarked basic economy is preserved.
    if (f.basicSkill) {
      const sk = f.basicSkill;
      f.cd.basic = Math.max(this.moves[0].cd, sk.cd * 0.6) * (f.bond.cdReduction || 1);
      const col = this.elemColor(sk.element || f.element);
      // A skill fired from the BASIC slot hits for notably LESS than the same skill in a
      // Q/E slot: it's a short-cooldown, spammable left-click, so per-hit power is scaled
      // down (BASIC_SKILL_DMG_MULT). The identical skill in Q/E still pays full power.
      const pow = (sk.power || 1) * BASIC_SKILL_DMG_MULT * this.outgoingBuffMult(f);
      this.castOffensiveSkill(f, aim, { ...sk, isBasic: true }, pow, col, true);   // _nowind: no wind-up on a basic
      if (f === this.me() && (this.t - (this._lastPawSfx || -3) > .45)) {
        window.MorrowwishAudio?.effect?.('combat_swing'); this._lastPawSfx = this.t;
      }
      this.gainUlt(2);
      return;
    }
    f.cd.basic = this.moves[0].cd * (f.bond.cdReduction || 1);
    const col = this.elemColor(f.element);
    const mx = f.x + Math.cos(aim) * 22, my = f.y + Math.sin(aim) * 22;
    // CAT-THEMED BASIC: the猫 lobs its own stuff — 小鱼干 (dried fish) and 毛线团
    // (yarn ball) alternating — instead of a generic claw shot. Still marks itself
    // (isBasic) so it's a FINISHER on status-marked targets and weaker on un-marked
    // ones, pushing Q/E priming. (Playtest P1: basic was a self-sufficient win cond.)
    f._basicTick = (f._basicTick || 0) + 1;
    const toy = 'yarn';
    this.spawnProj(mx, my, aim, f.projSpeed, f.dmg*this.outgoingBuffMult(f), 'me', col, 7, toy, { element: f.element, isBasic: true }, 0.5);
    this.vfx.muzzle(mx, my, aim, col);
    this.regularSkillAccent(f,f.element,aim,true);
    if(f===this.me()&&(this.t-(this._lastPawSfx||-3)>.45)){
      window.MorrowwishAudio?.effect?.('combat_swing');this._lastPawSfx=this.t;
    }
    this.gainUlt(2);
  }
  // Native skill semantics for heal/buff (formerly mis-cast as damage or dash).
  // Returns whether anything was actually used, for smart AI priorities.
  // Support skills can target a FRIEND, not just the caster. If the player is
  // aiming at an ally (or an ally needs it far more), the heal/buff lands on them.
  supportBeneficiary(f, sk, aim){
    // explicit aim at an ally (manual intent) wins
    if (aim != null && f === this.me() && !this.game.isTouch) {
      const ax = f.x + Math.cos(aim), ay = f.y + Math.sin(aim);
      let best = null, bd = 60;
      for (const tf of this.team) { if (!tf.alive || tf === f) continue; const d = Math.hypot(tf.x - (this.game.mouse?.x ?? ax), tf.y - (this.game.mouse?.y ?? ay)); if (d < bd) { bd = d; best = tf; } }
      if (best) return best;
    }
    // heals auto-prioritise the most-hurt living teammate (incl. caster)
    if (sk.kind === 'heal') {
      let best = f, worst = f.hp / f.maxhp;
      for (const tf of this.team) { if (!tf.alive) continue; const r = tf.hp / tf.maxhp; if (r < worst) { worst = r; best = tf; } }
      return best;
    }
    return f;
  }
  // Positive outgoing buffs share one additive bucket; weakness is a penalty.
  outgoingBuffMult(f){ return (1 + (f.damageBoostT > 0 ? 0.25 : 0) + 0.12 * (f.kneadStacks || 0)) * (f.weakened ? 0.5 : 1); }
  kneadMult(f){ return 1 + 0.12 * (f && f.kneadStacks || 0); }
  castSupportSkill(f,sk,aim){
    if(!sk)return false;
    // A flat mirror wall belongs to its caster, but physically protects the team.
    const t = sk?.shieldType==='reflect' ? f : this.supportBeneficiary(f, sk, aim);
    if(sk.kind==='heal'){
      // ELEMENT HEAL IDENTITY (#56):
      //   water  healMode:'area'  — a lingering area HoT: every teammate within radius
      //                             gets a regen-over-time (breadth, for multi-cat fights)
      //   light  healMode:'single'— lock the most-hurt ally, one big burst (raw量)
      //   grass  healMode:'cleanse'— medium heal + strip one debuff / CC (resilience)
      //   fire/elec/dark — selfish self-heal (selfBuff/haste/leech, handled below)
      if(sk.healMode==='area'){
        const R=160, hpBack=f.maxhp; let any=false;
        for(const tf of this.team){ if(!tf.alive)continue;
          if(Math.hypot(tf.x-f.x,tf.y-f.y)>R && tf!==f)continue;   // caster + nearby allies
          tf.hotT=Math.max(tf.hotT||0,5.0); tf.hotRate=tf.maxhp*0.03;   // ~3%/s for 5s
          any=true;
        }
        this.vfx.ring(f.x,f.y,{r0:R*0.3,vr:R*2,life:.6,color:'#8fe0ff',width:5});
        this.vfx.text(f.x,f.y-34,window.MorrowwishI18n?.get?.()!=='zh'?'regen field':'回复领域','#a8e9f0',14);
        this.gainUlt(6); window.CatBondSkillFX?.support(this,f,sk);
        return any;
      }
      const canCleanse = (sk.healMode==='cleanse'||sk.tags?.includes('cleanse')) && t.status && Object.keys(t.status).length;
      // 元素愈合微调 (generic template tweaks): `big`/single heals more (light), `hot`
      // leaves a regen-over-time. An un-wounded target still accepts a hot/cleanse refresh.
      const hasHot = !!sk.hot;
      if(t.hp>=t.maxhp-.5 && !canCleanse && !hasHot)return false;
      const pct = sk.healPct ?? ((sk.healMode==='single'||sk.big) ? 0.46 : 0.34); // learned heal upgrade matters
      const amount=Math.min(t.maxhp-t.hp,Math.max(14,t.maxhp*pct));
      t.hp=Math.min(t.maxhp,t.hp+amount);
      if(hasHot){ t.hotT=Math.max(t.hotT||0,4.0); t.hotRate=t.maxhp*0.035; }   // ~3.5%/s for 4s (water)
      if(sk.selfBuff){ f.damageBoostT=Math.max(f.damageBoostT||0,3.0); }       // fire self-heal also buffs
      if(sk.haste){ t.hasteT=Math.max(t.hasteT||0,4.0); }                      // elec heal → brief speed-up
      if(sk.leech){ f.hp=Math.min(f.maxhp,f.hp+amount*0.5); }                  // dark heal also siphons for the caster
      // 舔毛理顺 Grooming: wash off the worst debuff as well as healing.
      if(canCleanse){
        const worst=Object.keys(t.status)[0];
        delete t.status[worst]; t.tags=(t.tags||[]).filter(x=>x!==worst);
        this.vfx.text(t.x,t.y-50,'✦ '+(window.MorrowwishI18n?.get?.()!=='zh'?'cleansed':'净化'),'#cfeed8',13);
        this.vfx.impactType?.(t.x,t.y,'cleanse',{color:'#bcebd0'});
      }
      this.vfx.impactType?.(t.x,t.y,'heal',{color:'#a8e9b4'});
      this.vfx.text(t.x,t.y-33,'+'+Math.round(amount),'#93dca1',15);
      if(t!==f)this.vfx.beam(f.x,f.y,t.x,t.y,'#a8e9b4');   // show the aid link
    }else if(sk.kind==='buff'){
      const shield=sk.tags?.includes('shield');
      if(shield){
        const wardPlaced=this.castWard(t, sk.shieldType || 'barrier', sk, aim);
        if(wardPlaced)window.CatBondSkillFX?.support(this,t,sk);
        return wardPlaced;  // three shield verbs (on friend or self)
      }else if(sk.tags?.includes('camo')){
        // 纸箱埋伏 Box Ambush: brief untargetable (i-frames) + prime the next hit to stagger.
        t.inv=Math.max(t.inv||0,1.2); t._ambush=true;
        this.vfx.ring(t.x,t.y,{r0:14,vr:120,life:.5,color:'#b9e6a0',width:3});
        this.vfx.text(t.x,t.y-34,window.MorrowwishI18n?.get?.()!=='zh'?'ambush!':'埋伏!','#cdeeb4',14);
      }else if(sk.tags?.includes('knead')){
        // 踩奶 Knead: a RHYTHM self-buff. Each cast adds a stack (max 4); stacks ramp
        // outgoing damage via kneadT/kneadStacks (consumed in the damage pow calc) and
        // refresh a long window, plus a tiny morale (斗志) heal so it rewards cadence.
        const KMAX=4;
        t.kneadStacks=Math.min(KMAX,(t.kneadStacks||0)+1);
        t.kneadT=5.0;                                         // refreshes while you keep kneading
        t.damageBoostT=Math.max(t.damageBoostT||0,0.01);      // marks "buffed" for AI/label only
        t.hp=Math.min(t.maxhp,t.hp+Math.max(6,t.maxhp*0.03)); // small morale back per knead
        const en=window.MorrowwishI18n?.get?.()!=='zh';
        this.vfx.ring(t.x,t.y,{r0:8,vr:70+t.kneadStacks*22,life:.4,color:'#ffe3c2',width:3});
        this.vfx.text(t.x,t.y-34,(en?'knead ×':'踩奶 ×')+t.kneadStacks,'#ffe8c8',14);
      }else{
        if(t.damageBoostT>.3)return false;
        t.damageBoostT=6;
        // 弓背炸毛 Puff & Hiss: a threat display also shoves nearby enemies back.
        if(sk.tags?.includes('threat')){
          for(const e of this.liveEnemies()){
            const dx=e.x-t.x,dy=e.y-t.y,d=Math.hypot(dx,dy)||1; if(d>150)continue;
            e.kbx=(e.kbx||0)+dx/d*280; e.kby=(e.kby||0)+dy/d*280;
          }
        }
        this.vfx.ring(t.x,t.y,{r0:10,vr:190,life:.55,color:'#ffd9a0',width:4});
        this.vfx.text(t.x,t.y-34,'强化','#f8eab8',14);
        if(t!==f)this.vfx.beam(f.x,f.y,t.x,t.y,'#ffd9a0');
      }
    }else return false;
    this.gainUlt(6);
    window.CatBondSkillFX?.support(this,t,sk);
    // Skill impact visual and icon communicate the attack; no repeated toast.
    return true;
  }

  markMoveSeen(f,sk){
    if(!f||!sk||!Array.isArray(f.cat.unseenSkills))return;
    const idx=f.cat.unseenSkills.indexOf(sk.id);
    if(idx<0)return;
    f.cat.unseenSkills.splice(idx,1);State.save();this.game.updateSkillLabels?.();
  }
  // Elemental spell shapes have distinct geometry AND hit rules.
  // Water/light: piercing lances; lightning: chain; fire: area blast; grass: cutting leaves.
  castDistinctProjectile(f,sk,aim,col,baseDmg){
    if(!sk)return false;
    const id=sk.id,ex=f.x+Math.cos(aim)*23,ey=f.y+Math.sin(aim)*23;
    const enemies=this.liveEnemies();
    if(id==='waterLash'||id==='frostLance'||id==='prismBeam'){
      const water=id==='waterLash',frost=id==='frostLance',range=water?430:frost?480:525,width=water?38:frost?19:21;
      const endX=ex+Math.cos(aim)*range,endY=ey+Math.sin(aim)*range;
      this.skillStrokes.push({kind:water?'water':frost?'ice':'prism',x:ex,y:ey,x2:endX,y2:endY,
        color:col,life:.45,max:.45});
      for(let i=0;i<(water?5:4);i++){
        const r=60+i*(water?75:125);
        this.vfx.ring(ex+Math.cos(aim)*r,ey+Math.sin(aim)*r,
          {r0:4,vr:80,life:.26,color:frost?'#b8eaff':water?'#a5edfc':'#fefcbb',width:2});
      }
      let hits=0;
      for(const e of enemies){
        const dx=e.x-ex,dy=e.y-ey,along=dx*Math.cos(aim)+dy*Math.sin(aim);
        const side=Math.abs(-dx*Math.sin(aim)+dy*Math.cos(aim));
        if(along<0||along>range||side>width+e.r*.5)continue;
        const hit=this.resolveHit(e,'me',sk,baseDmg*(water?.9:frost?1.12:1.18),e.x,e.y);
        if(hit.dealt>0){this.vfx.impact(e.x,e.y,col);hits++;}
      }
      if(hits)this.shakeT=Math.max(this.shakeT,.13);
      return true;
    }
    if(id==='boltArc'){
      const available=enemies.slice(),chain=[];
      let sx=ex,sy=ey;
      for(let i=0;i<3;i++){
        const candidates=available.map(e=>({e,dist:Math.hypot(e.x-sx,e.y-sy)}))
          .filter(v=>v.dist<(i===0?440:205)).sort((a,b)=>a.dist-b.dist);
        if(!candidates.length)break;
        const target=candidates[0].e;
        this.vfx.beam(sx,sy,target.x,target.y,i?'#e2d6ff':'#ffeeb0');
        this.skillStrokes.push({kind:'lightning',x:sx,y:sy,x2:target.x,y2:target.y,
          color:col,life:.4,max:.4});
        const hit=this.resolveHit(target,'me',sk,baseDmg*(1-i*.23),target.x,target.y);
        if(hit.dealt>0)this.vfx.burst(target.x,target.y,{count:9,color:col,speed:160,life:.3});
        available.splice(available.indexOf(target),1);
        chain.push(target);sx=target.x;sy=target.y;
      }
      if(!chain.length){this.skillStrokes.push({kind:'lightning',x:ex,y:ey,
        x2:ex+Math.cos(aim)*350,y2:ey+Math.sin(aim)*350,color:col,life:.28,max:.28});}
      return true;
    }
    if(id==='leafDart'){
      for(let i=-1;i<=1;i++){
        const ang=aim+i*.16;
        this.spawnProj(ex,ey,ang,f.projSpeed*1.28,baseDmg*.92,'me','#94e6a4',9,'leaf',sk,1.25);
      }
      this.vfx.burst(ex,ey,{count:9,color:'#c0f4ab',angle:aim,spread:.6,speed:170,life:.32});
      return true;
    }
    if(id==='lightningOrb'){
      // Slow, turning ball lightning — NOT instant chain lightning.
      this.spawnProj(ex,ey,aim,108,baseDmg,'me','#ffe5a0',
        13,'lightningOrb',sk,3.3);
      this.vfx.burst(ex,ey,{count:7,color:'#e1f3ff',
        speed:70,life:.25,r:2});
      return true;
    }
    if(id==='fireballMeow'){
      this.spawnProj(ex,ey,aim,f.projSpeed*.75,baseDmg*1.5,'me','#ff9752',15,'fireball',sk,1.8);
      this.vfx.burst(ex,ey,{count:16,color:'#ffdb84',angle:aim,spread:.65,speed:175,life:.38});
      return true;
    }
    if(id==='hex'){
      this.spawnProj(ex,ey,aim,f.projSpeed*.68,baseDmg*1.25,'me','#bca4ec',13,'hex',sk,1.85);
      this.vfx.orb(ex,ey,'#b397ec',7);return true;
    }
    return false;
  }
  // ---- the three shield verbs (players AND enemies) ----
  // Each sets a short-lived field resolveHit() consults, with its own limit and
  // after-effect. Shared so enemy AI can cast the exact same wards.
  castWard(f, type, sk=null, aim=null) {
    if ((f.protectT||0)>0 || (f.reflectT||0)>0 || (f.shieldT||0)>.25) return false;  // one ward at a time
    if (type === 'protect') {
      // Protect 守护: full block, tiny window, then a vulnerable 后遗症.
      f.protectT = 0.8; f._protectVuln = 1.2;        // after it drops → vulnerableT
      this.vfx.ring(f.x,f.y,{r0:14,vr:120,life:.5,color:'#9be7c4',width:6});
      this.vfx.text(f.x,f.y-34,'守护','#9be7c4',14);
    } else if (type === 'reflect') {
      // Reflect 反弹壁: bounces projectiles; caster is rooted/slowed while up.
      if(f._flatWall)f._flatWall.remaining=0;
      f.reflectT=2.2;
      // Hold a 220px flat barrier 42px in front of the caster. It follows the
      // caster at reduced speed, with capped turn rate instead of instant flips.
      const heading=Number.isFinite(aim)?aim:
        (f._moveFacing??f._reflectFacing??(f.face<0?Math.PI:0));
      f._reflectFacing=heading;f._wallDesiredAngle=heading;
      const nx=Math.cos(heading),ny=Math.sin(heading);
      const wall={owner:f,side:this.team.includes(f)?'me':'wild',
        x:f.x+nx*42,y:f.y+ny*42,angle:heading,nx,ny,
        halfLength:110,remaining:f.reflectT,age:0,hitAge:0,
        hitOffset:0,hits:0};
      this.barrierWalls=this.barrierWalls||[];
      this.barrierWalls.push(wall);
      f._flatWall=wall;
      this.vfx.ring(f.x,f.y,{r0:14,vr:110,life:.25,color:'#b8e0ff',width:3});
      this.vfx.text(f.x,f.y-34,'炸毛墙','#b8e0ff',14);
    } else {
      // Barrier 护盾: % reduction for a duration (the classic bubble).
      f.shieldT=sk?.wardDuration||4.8;
      f._wardReduction=Math.max(0,Math.min(.8,sk?.wardReduction??.45));
      f._wardRegenPct=sk?.wardRegenPct||0;
      f._wardRetaliateBurn=!!sk?.wardRetaliateBurn;
      this.vfx.ring(f.x,f.y,{r0:10,vr:190,life:.55,color:'#9dd8ff',width:4});
      this.vfx.text(f.x,f.y-34,'护盾','#9dd8ff',14);
    }
    return true;
  }
  // Segment/plane interception: p's previous/current positions must cross
  // from the incoming (front) half-space through the panel, within its length.
  // This is checked before target collision and works for ANY ally behind it.
  interceptWallProjectile(p,oldX,oldY){
    if(!p||p.burst||p.life<=0||!['me','wild'].includes(p.owner))return false;
    if((p._wallIgnoreUntil||0)>this.t)return false;
    for(const wall of this.barrierWalls||[]){
      if(wall.remaining<=0||!wall.owner?.alive||wall.side===p.owner)continue;
      const start=(oldX-wall.x)*wall.nx+(oldY-wall.y)*wall.ny;
      const end=(p.x-wall.x)*wall.nx+(p.y-wall.y)*wall.ny;
      // Only block attacks arriving from the face of the barrier, not the rear.
      if(start<=0||end>0)continue;
      const frac=start/(start-end);
      if(frac<0||frac>1)continue;
      const hitX=oldX+(p.x-oldX)*frac,hitY=oldY+(p.y-oldY)*frac;
      const along=(hitX-wall.x)*(-wall.ny)+(hitY-wall.y)*wall.nx;
      if(Math.abs(along)>wall.halfLength+(p.r||0))continue;
      wall.hitAge=.28;wall.hitOffset=Math.max(-wall.halfLength,Math.min(wall.halfLength,along));
      wall.hits=(wall.hits||0)+1;
      p.x=hitX;p.y=hitY;
      this.vfx.ring(hitX,hitY,{r0:5,vr:100,life:.24,color:'#d6faff',width:3});
      this.vfx.burst(hitX,hitY,{count:this.game.isTouch?5:9,
        color:'#c4f8ff',speed:90,life:.2,r:2});
      // Every other shot reflects at reduced power; the rest are absorbed.
      // A single shot may reflect only once, preventing infinite ping-pong.
      const reflect=wall.hits%2===1&&(p._reflects||0)<1;
      if(reflect){
        const incoming=p.vx*wall.nx+p.vy*wall.ny;
        p.vx-=2*incoming*wall.nx;p.vy-=2*incoming*wall.ny;
        p.ang=Math.atan2(p.vy,p.vx);p.spd=Math.hypot(p.vx,p.vy);
        p.owner=wall.side;p.dmg*=.55;p._reflects=(p._reflects||0)+1;
        p.life=Math.max(p.life,1.15);
        p._wallIgnoreUntil=this.t+.12;
        p.x+=wall.nx*4;p.y+=wall.ny*4;
      }else p.life=0;
      return true;
    }
    return false;
  }

  // Returns the enemy flat wall physically BETWEEN a shooter and target,
  // provided the shot is approaching from its protected front side.
  wallBlockingLine(x1,y1,x2,y2,attackerSide){
    for(const w of this.barrierWalls||[]){
      if(w.remaining<=0||!w.owner?.alive||w.side===attackerSide)continue;
      const d1=(x1-w.x)*w.nx+(y1-w.y)*w.ny;
      const d2=(x2-w.x)*w.nx+(y2-w.y)*w.ny;
      if(d1<=0||d2>=0)continue;
      const t=d1/(d1-d2);
      const px=x1+(x2-x1)*t,py=y1+(y2-y1)*t;
      const lateral=(px-w.x)*(-w.ny)+(py-w.y)*w.nx;
      if(Math.abs(lateral)<=w.halfLength+4)return w;
    }
    return null;
  }
  // Ranged attackers flank the END of a mirror wall rather than firing futile
  // shots into its center. Melee/assassin cats retain their ordinary approach.
  wallFlankVector(actor,target,side){
    const w=this.wallBlockingLine(actor.x,actor.y,target.x,target.y,side);
    if(!w)return null;
    const tx=-w.ny,ty=w.nx;
    const near=(actor.x-w.x)*tx+(actor.y-w.y)*ty;
    const sign=Math.abs(near)>12?Math.sign(near):
      (Math.hypot(actor.x-(w.x+tx*w.halfLength),actor.y-(w.y+ty*w.halfLength))<=
       Math.hypot(actor.x-(w.x-tx*w.halfLength),actor.y-(w.y-ty*w.halfLength))?1:-1);
    // A stable side avoids flip-flopping as the caster turns.
    const choice=actor._wallFlankRef===w?actor._wallFlankSign:sign;
    actor._wallFlankRef=w;actor._wallFlankSign=choice;
    const wx=clamp(w.x+tx*choice*(w.halfLength+38)-w.nx*30,
      BATTLE_MARGIN.side,this.W-BATTLE_MARGIN.side);
    const wy=clamp(w.y+ty*choice*(w.halfLength+38)-w.ny*30,
      this.topMargin,this.H-this.bottomMargin);
    const dx=wx-actor.x,dy=wy-actor.y,dist=Math.hypot(dx,dy);
    if(dist<4)return null;
    return {x:dx/dist,y:dy/dist};
  }
  // Turn the carried barrier at only 1.25 rad/sec. The caster can reposition
  // at half speed, but cannot instantly whip a 220px wall across the arena.
  updateFlatWallPose(f,dt){
    const w=f?._flatWall;
    if(!w||f.reflectT<=0)return;
    const desired=Number.isFinite(f._wallDesiredAngle)?f._wallDesiredAngle:
      (f._moveFacing??f._reflectFacing??w.angle);
    let delta=desired-(f._reflectFacing??w.angle);
    while(delta>Math.PI)delta-=Math.PI*2;
    while(delta<-Math.PI)delta+=Math.PI*2;
    const maxTurn=1.25*Math.max(0,dt);
    f._reflectFacing=(f._reflectFacing??w.angle)+clamp(delta,-maxTurn,maxTurn);
    w.angle=f._reflectFacing;
    w.nx=Math.cos(w.angle);w.ny=Math.sin(w.angle);
    w.x=f.x+w.nx*42;w.y=f.y+w.ny*42;
  }

  // ---- adaptive AI profile (tiny online statistics, all clamped) ----
  normalizeAiProfile(p) {
    const d = { v: 1, battles: 0, dodgeDir: 0, favRange: 0.5, evasive: 0.4, aggression: 0.5, elemLead: {}, skill: 0.5, adapt: true, stompStreak: 0 };
    p = Object.assign({}, d, p || {});
    p.elemLead = Object.assign({}, p.elemLead);
    p.dodgeDir = clamp(p.dodgeDir, -1, 1); p.favRange = clamp(p.favRange, 0, 1);
    p.evasive = clamp(p.evasive, 0.05, 0.95); p.aggression = clamp(p.aggression, 0, 1);
    p.skill = clamp(p.skill, 0, 1); p.battles = clamp(p.battles | 0, 0, 9999);
    p.stompStreak = clamp(p.stompStreak | 0, 0, 5);    // consecutive flawless wins → tougher enemies
    return p;
  }
  // Fold this battle's observations into the persisted EMAs. Called at battle end.
  commitAiProfile(won) {
    if (!(window.State && State.S)) return;
    const p = this.normalizeAiProfile(State.S.aiProfile), o = this._obs;
    p.battles = Math.min(p.battles + 1, 9999);
    if (o.dodgeN) p.dodgeDir = clamp(lerp(p.dodgeDir, o.dodgeSignSum / o.dodgeN, 0.2), -1, 1);
    if (o.rangeN) p.favRange = clamp(lerp(p.favRange, (o.rangeSum / o.rangeN) / Math.hypot(this.W, this.H), 0.15), 0, 1);
    if (o.threats) p.evasive = clamp(lerp(p.evasive, o.dodgedThreats / o.threats, 0.2), 0.05, 0.95);
    if (o.frames) p.aggression = clamp(lerp(p.aggression, Math.min(1, (o.fires / Math.max(1, o.frames / 60)) / 3), 0.2), 0, 1);
    const el = this.me() && this.me().element; if (el) { for (const k in p.elemLead) p.elemLead[k] *= 0.9; p.elemLead[el] = Math.min((p.elemLead[el] || 0) + 1, 50); }
    // adaptive-difficulty skill estimate from this battle's outcome signals
    const hpFrac = this.team.reduce((n, f) => n + Math.max(0, f.hp), 0) / Math.max(1, this.team.reduce((n, f) => n + f.maxhp, 0));
    const perf = clamp(0.3 * (won ? 1 : 0) + 0.25 * (hpFrac >= 0.6 ? 1 : 0) + 0.25 * Math.min(1, (this.perfectDodges + this.comboBest / 10) / 2) + 0.2 * (this.t <= 60 ? 1 : 0), 0, 1);
    p.skill = clamp(lerp(p.skill, perf, 0.25), 0, 1);
    // Anti-stomp: a flawless win (won, took ZERO damage) ramps the challenge next
    // time; getting touched at all resets it. Keeps dominators honest instead of
    // the old backwards contract that made enemies EASIER against them.
    if (won && (o.dmgTaken || 0) <= 0) p.stompStreak = clamp((p.stompStreak | 0) + 1, 0, 5);
    else p.stompStreak = 0;
    State.S.aiProfile = p;
  }

  // Tick ward timers for any fighter/enemy; Protect leaves a vulnerable window.
  // NOTE: shieldT (barrier) is ticked HERE too — it used to be decremented only in
  // the player-team loop, so ENEMY barriers never expired and stuck on forever
  // ("有些猫身上的防护罩一直都在"). Ticking it in the shared ward tick fixes both sides.
  tickWards(f, dt) {
    const oldShield=f.shieldT||0,oldProtect=f.protectT||0,oldReflect=f.reflectT||0;
    if(f.shieldT>0){
      f.shieldT=Math.max(0,f.shieldT-dt);
      if(f._wardRegenPct&&f.alive&&f.hp<f.maxhp)
        f.hp=Math.min(f.maxhp,f.hp+f.maxhp*f._wardRegenPct*dt);
    }
    if(f.shieldT<=0){
      f._wardReduction=null;f._wardRegenPct=0;f._wardRetaliateBurn=false;
    }
    if (f.protectT > 0) { f.protectT = Math.max(0, f.protectT - dt); if (f.protectT === 0 && f._protectVuln) { f.vulnerableT = f._protectVuln; f._protectVuln = 0; } }
    if(f.reflectT>0)f.reflectT=Math.max(0,f.reflectT-dt);
    if(f._flatWall){
      this.updateFlatWallPose(f,dt);
      f._flatWall.remaining=f.reflectT;
      f._flatWall.age+=dt;
      f._flatWall.hitAge=Math.max(0,(f._flatWall.hitAge||0)-dt);
      if(f.reflectT<=0||!f.alive)f._flatWall=null;
    }
    if(this.barrierWalls?.length)
      this.barrierWalls=this.barrierWalls.filter(w=>w.remaining>0&&w.owner?.alive);
    // One-time local dissolve on shield expiry; never spawn every frame.
    if(Number.isFinite(f.x)&&Number.isFinite(f.y)){
      if(oldShield>0&&f.shieldT===0)
        this.vfx.impactType?.(f.x,f.y+12,'wardFade',{color:'#a5d9ef'});
      if(oldProtect>0&&f.protectT===0)
        this.vfx.impactType?.(f.x,f.y+12,'wardFade',{color:'#9ccbb6'});
      if(oldReflect>0&&f.reflectT===0)
        this.vfx.impactType?.(f.x,f.y+12,'wardFade',{color:'#b4b9fb'});
    }
    if (f.rootT > 0) f.rootT = Math.max(0, f.rootT - dt);
    if (f.vulnerableT > 0) f.vulnerableT = Math.max(0, f.vulnerableT - dt);
  }

  // Tick DoT + soft-CC the ENEMY inflicted on a cat. Fair by design: damage-over-
  // time ticks, control tags only SLOW the cat (sets f.slowed) and weaken reduces
  // its damage — a cat is never fully locked out of acting.
  tickCatStatus(f, dt) {
    if (!f.status) { f.slowed = false; return; }
    const TAG = (window.Skills && Skills.TAG_INFO) || {};
    let slow = false, weak = false;
    for (const tg in f.status) {
      f.status[tg] -= dt;
      if (f.status[tg] <= 0) { delete f.status[tg]; f.tags = (f.tags || []).filter(t => t !== tg); continue; }
      const info = TAG[tg];
      if (!info) continue;
      if (info.dps) {
        const d = f.maxhp * info.dps * dt;
        f.hp = Math.max(0, f.hp - d);
        if (Math.random() < dt * 3) this.vfx.text(f.x + (Math.random() * 16 - 8), f.y - 18, '-' + Math.max(1, Math.round(f.maxhp * info.dps)), info.color, 10);
        if (f.hp <= 0 && f.alive) this.onFaint(f);
      }
      if (tg === 'chill' || tg === 'bind' || tg === 'dizzy' || tg === 'shock') slow = true;  // soft-CC → slow
      if (info.dmgDealt) weak = true;                                                         // 虚弱 → 伤害减半
    }
    f.slowed = slow;
    f.weakened = weak;
  }

  skillQ(f, aim) {
    f = f || this.me(); if (f.cd.q > 0) return false;
    if (aim == null) aim = (f === this.me()) ? this.aim : f._aim || 0;
    if (f === this.me()) this._coachUsedSkill = true;      // coach: step 3
    const sk = f.qSkill;
    if(sk&&(sk.kind==='heal'||sk.kind==='buff')){
      if(!this.castSupportSkill(f,sk,aim))return false;
      f.cd.q=sk.cd*(f.bond.cdReduction||1)*SKILL_CD_MULT;
      this.regularSkillAccent(f,sk.element||f.element,aim);
      this.markMoveSeen(f,sk);
      return true;
    }
    f.cd.q = (sk ? sk.cd : this.moves[1].cd) * (f.bond.cdReduction || 1) * SKILL_CD_MULT;
    const col = this.elemColor(sk ? sk.element : f.element);
    const pow = (sk ? sk.power : 0.8)*this.outgoingBuffMult(f);
    // The starter Q fan is an actual damaging skill even before a named Q unlock.
    // Give it an ID so a successful hit participates in skill-driven poise break.
    const attack=sk||{id:'starterQFan',kind:'projectile',element:f.element,power:.8,ultCost:0};
    this.castOffensiveSkill(f, aim, attack, pow, col);
    this.gainUlt(8);
    this.markMoveSeen(f,sk);
    // Suppress repeated action labels; they used to cover the health bars.
    return true;
  }

  // smallest signed angle between two headings
  angleDiff(a, b) { let d = a - b; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; }
  // 近战范围攻击: an instant arc in front of the caster, hitting enemies within range
  meleeStrike(f, aim, skill, dmg, col) {
    // Compact close-contact claw arc; no more long-range invisible slashes.
    const RANGE = 64, ARC = .74;
    // signature melee VFX: owner's authored claw-slash stroke + my sweeping blade.
    this.skillStrokes.push({kind:'clawSlash',x:f.x,y:f.y,angle:aim,color:col,life:.37,max:.37});
    this.vfx.slash(f.x, f.y, aim, col, RANGE * 0.9, ARC * 0.92);
    this.vfx.burst(f.x + Math.cos(aim) * RANGE * 0.6, f.y + Math.sin(aim) * RANGE * 0.6, { count: this.game.isTouch ? 4 : 8, color: col, angle: aim, spread: ARC, speed: 220, life: 0.28, r: 2.5, drag: 3 });
    let hit = false, dealtTotal = 0;
    for (const e of this.liveEnemies()) {
      const d = Math.hypot(e.x - f.x, e.y - f.y);
      if (d > RANGE + (e.r||18)*.65) continue;
      const ang = Math.atan2(e.y - f.y, e.x - f.x);
      if (Math.abs(this.angleDiff(ang, aim)) > ARC) continue;   // must be in the frontal arc
      const r = this.resolveHit(e, 'me', skill, dmg, e.x, e.y);  // melee can't be reflected (no proj)
      if (r.dealt > 0) { hit = true; dealtTotal += r.dealt; }
    }
    if (hit) this.shakeT = Math.max(this.shakeT, 0.1);
    // 藤蔓爪微调 lifesteal: a grass melee heals the caster a cut of damage it landed.
    const steal = skill && skill.lifesteal;
    if (steal && dealtTotal > 0 && f.alive) f.hp = Math.min(f.maxhp, f.hp + dealtTotal * steal);
  }

  // ---------------- offensive skill dispatch by KIND ----------------
  // Shared by skillQ/skillE (and reusable by enemy AI). Each kind has honest hit
  // geometry: projectile=flying fan, melee=arc, aoe=slow placed lob, dash=lunge,
  // chain=jump. Support kinds (heal/buff) are handled by the callers before this.
  castOffensiveSkill(f, aim, sk, pow, col, _nowind) {
    this._lastSkillT = this.t;                 // stall-detector: player engaged a skill
    // WIND-UP (前摇): heavy skills charge for sk.windup seconds before firing — a
    // brief commit that roots the caster and shows a growing charge ring, so big
    // moves have weight and can be read/punished (mirrors enemy telegraph).
    if (sk && sk.windup && !_nowind) {
      this.pendingCasts = this.pendingCasts || [];
      f._castRoot = sk.windup;
      this.pendingCasts.push({ f, aim, sk, pow, col, t: sk.windup, max: sk.windup });
      window.MorrowwishAudio?.effect?.('charge');
      return;
    }
    // 后遗症 (post-cast recovery): heavy skills leave the caster briefly sluggish.
    if (sk && sk.castSlow) f._castSlow = sk.castSlow;
    const kind = sk ? sk.kind : 'projectile';
    if((sk?.ultCost||0)===0)this.regularSkillAccent(f,sk?.element||f.element,aim,!!sk?.isBasic);
    // Skill IDs select 39 different local silhouettes; generic element accents
    // remain as a subtle baseline and projectile mechanics are untouched.
    window.CatBondSkillFX?.cast(this,f,sk,aim);
    // Unique elemental timbre and skill-ID cadence. Strong AoE/dash skills
    // gain a low impact layer; actual ultimates get the heaviest accent.
    const soundPower=sk?.ultCost>0?3:(sk?.windup>=.35||Number(pow)>1.6?2:1);
    const played=window.MorrowwishAudio?.skillSignature?.(
      sk?.id||sk?.name,f.element||sk?.element,soundPower);
    if(!played)window.MorrowwishAudio?.effect?.(
      kind==='melee'?'combat_claw':
      kind==='projectile'?'combat_projectile':
      ['dash','leap'].includes(kind)?'combat_dash':
      ['beam','chain'].includes(kind)?'combat_beam':'combat_magic'
    );
    if (kind === 'melee') {
      this.meleeStrike(f, aim, sk, f.dmg * pow * 1.4, col);
    } else if (kind === 'aoe') {
      this.lobAoe(f, aim, sk, f.dmg * pow, col);
    } else if (kind === 'dash') {
      this.dashLunge(f, aim, sk, f.dmg * pow * 1.5, col);
    } else if (kind === 'leap') {
      this.leapSlam(f, aim, sk, f.dmg * pow * 1.7, col);
    } else if (kind === 'pounce') {
      this.flyingPounce(f, aim, sk, f.dmg * pow * 1.5, col);
    } else if (kind === 'chain') {
      this.chainBolt(f, aim, sk, f.dmg * pow, col);
    } else if (kind === 'beam') {
      this.castBeam(f, aim, sk, f.dmg * pow, col);
    } else if (!this.castDistinctProjectile(f, sk, aim, col, f.dmg * pow)) {
      // Owner's per-skill elemental geometry (lances/fireball/hex/etc.) takes
      // priority; fall back to a directional projectile fan for plain skills.
      // Shared per-cast single-target budget: a five-pellet fan must not
      // accidentally deal 5x power to a wide/hugging enemy.
      const volley={hitsByEnemy:new Map(),maxHitsPerEnemy:1};
      for(let i=-2;i<=2;i++){
        const pellet=this.spawnProj(f.x,f.y,aim+i*.18,f.projSpeed*.8,
          f.dmg*pow,'me',col,7,'fur',sk);
        pellet._volley=volley;
      }
      this.vfx.muzzle(f.x, f.y, aim, col);
      this.vfx.burst(f.x, f.y, { count: 10, color: col, angle: aim, spread: 1.4, speed: 160, life: 0.35 });
    }
  }

  // Placed AOE: a slow projectile lobbed toward a target POINT; on arrival it
  // bursts into a circle and only enemies inside the circle are hit. Desktop aims
  // at the cursor; mobile/AI at the locked/nearest enemy. Telegraphed by a ground
  // ring that travels with it, so it stays dodgeable (leave the circle).
  lobAoe(f, aim, sk, dmg, col) {
    const R = 86;                                   // burst radius
    // destination point
    let tx, ty;
    if (f === this.me() && !this.game.isTouch) {
      const m = this.game.mouse || {}; tx = m.x; ty = m.y;             // desktop: cursor
    } else {
      const tgt = this.lockedEnemy() || this.nearestEnemy(f.x, f.y);   // mobile/AI/ally: target
      if (tgt) { tx = tgt.x; ty = tgt.y; } else { tx = f.x + Math.cos(aim) * 240; ty = f.y + Math.sin(aim) * 240; }
    }
    const ang = Math.atan2(ty - f.y, tx - f.x), dist = Math.hypot(tx - f.x, ty - f.y);
    const speed = 300;                              // deliberately slow → readable/dodgeable
    this.spawnProj(f.x, f.y, ang, speed, dmg, 'me', col, 9, 'orb', sk, dist / speed + 0.02);
    const p = this.projectiles[this.projectiles.length - 1];
    p.burst = { r: R, dmg, skill: sk, col, tx, ty };  // consumed by burstAt() on expiry
    this.vfx.muzzle(f.x, f.y, ang, col);
  }
  // Detonate a lobbed AOE at its landing point: everyone inside R takes the hit.
  burstAt(p) {
    const b = p.burst; if (!b) return;
    const side = p.owner === 'wild' ? 'wild' : 'me';
    this.vfx.shockwave(b.tx, b.ty, b.col);
    this.vfx.ring(b.tx, b.ty, { r0: 12, vr: b.r * 6, life: 0.4, color: b.col, width: 7 });
    this.vfx.burst(b.tx, b.ty, { count: this.game.isTouch ? 12 : 22, color: b.col, speed: 240, life: 0.5, r: 4 });
    if (side === 'me') {
      for (const e of this.liveEnemies()) if (Math.hypot(e.x - b.tx, e.y - b.ty) <= b.r) this.resolveHit(e, 'me', b.skill, b.dmg, e.x, e.y);
    } else {
      for (const tf of this.team) if (tf.alive && Math.hypot(tf.x - b.tx, tf.y - b.ty) <= b.r) this.resolveHit(tf, 'wild', b.skill, b.dmg, tf.x, tf.y);
    }
    this.shakeT = Math.max(this.shakeT, this.game.isTouch ? 0.08 : 0.14);
    // TERRAFORMER: a lob skill flagged with `field` leaves a lingering elemental
    // ground zone where it landed — anyone standing in it keeps getting its tag,
    // and the zone can be DETONATED by a reacting element for a big combo.
    const sk = b.skill;
    if (sk && sk.field) this.spawnField(b.tx, b.ty, b.r * 0.95, sk.field, this.elemColor(sk.element), side, sk);
  }
  // Create / refresh a lingering elemental field. element = the field's reaction
  // element (what it reacts WITH); tag = the status it drips onto units inside.
  spawnField(x, y, r, spec, col, side, sk) {
    this.fields.push({
      x, y, r, side: side || 'me', col,
      element: spec.element || sk?.element,      // what this field IS (fire/water/elec…)
      tag: spec.tag,                             // status it drips to units standing inside
      dps: spec.dps || 0,                        // optional small ground damage
      t: spec.life || 5, max: spec.life || 5, _drip: 0, skill: sk || null,
    });
  }
  // Tick fields: drip tags/damage to units inside; check for a reacting projectile
  // passing through to DETONATE (field element + reactor element → combo over all inside).
  tickFields(dt) {
    if (!this.fields.length) return;
    const REACT = { water: 'elec', elec: 'water', fire: 'grass', grass: 'fire', dark: 'light', light: 'dark' };
    for (const fld of this.fields) {
      fld.t -= dt; fld._drip += dt;
      const targets = fld.side === 'me' ? this.liveEnemies() : this.team.filter(t => t.alive);
      // drip the field's status + tiny damage ~3x/sec to anyone standing inside
      if (fld._drip >= 0.33) {
        fld._drip = 0;
        for (const u of targets) {
          if (Math.hypot(u.x - fld.x, u.y - fld.y) > fld.r) continue;
          if (fld.tag) { u.tags = u.tags || []; u.status = u.status || {}; if (!u.tags.includes(fld.tag)) u.tags.push(fld.tag); const info = (window.Skills?.TAG_INFO || {})[fld.tag]; u.status[fld.tag] = info ? info.ttl : 2; }
          if (fld.dps && fld.side === 'me') this.hurtEnemy(u, u.maxhp * fld.dps * 0.33, u.x, u.y, true);
        }
      }
      // DETONATION: a friendly projectile of the reacting element flying through the
      // field ignites it — every unit inside takes a combo burst, field consumed.
      if (fld.side === 'me') {
        const want = REACT[fld.element];
        for (const p of this.projectiles) {
          if (p.owner !== 'me' || p.burst) continue;
          const pel = (p.skill && p.skill.element) || p.element;
          if (pel !== want) continue;
          if (Math.hypot(p.x - fld.x, p.y - fld.y) > fld.r) continue;
          this.detonateField(fld, p); fld.t = 0; break;
        }
      }
    }
    this.fields = this.fields.filter(f => f.t > 0);
  }
  detonateField(fld, proj) {
    const col = '#fff';
    this.vfx.shockwave(fld.x, fld.y, fld.col);
    this.vfx.ring(fld.x, fld.y, { r0: 10, vr: fld.r * 7, life: 0.5, color: fld.col, width: 8 });
    this.vfx.ring(fld.x, fld.y, { r0: 20, vr: fld.r * 5, life: 0.4, color: col, width: 3 });
    this.shakeT = Math.max(this.shakeT, 0.25); this.hitstop = Math.max(this.hitstop, 0.07);
    const en = window.MorrowwishI18n?.get?.() !== 'zh';
    this.vfx.text(fld.x, fld.y - 40, en ? 'REACTION!' : '元素反应!', '#ffd36b', 16);
    window.MorrowwishAudio?.effect?.('crash');
    const dmg = (proj?.dmg || 20) * 2.2;                 // big reaction payoff
    for (const e of this.liveEnemies()) {
      if (Math.hypot(e.x - fld.x, e.y - fld.y) > fld.r) continue;
      this.resolveHit(e, 'me', { element: fld.element }, dmg, e.x, e.y);
      // chain-lightning look when the reaction is electric
      if (fld.element === 'elec' || (proj?.skill?.element) === 'elec') this.vfx.beam(fld.x, fld.y, e.x, e.y, fld.col);
    }
  }
  // Dash lunge: the caster leaps along aim; enemies crossed along the lunge line
  // are struck once. A gap-closer, not a ranged poke.
  dashLunge(f, aim, sk, dmg, col) {
    // A DASH IS PHYSICAL MOVEMENT. Damage only on real contact during tick.
    // Never draw the old 190px laser or pre-hit every enemy on its segment.
    // 元素冲刺微调: stealthFrames (dark) = longer i-frames through the dash; knockMul
    // (water) = heavier shove on contact (read in the contact-knockback at tick time).
    f.dashT=.24;f.inv=sk&&sk.stealthFrames?.5:.28;f.pounce=true;f._dashAim=aim;
    f._dashReach=120;f._dashTravel=0;f._pounceSkill=sk;f._pounceDmg=dmg;f._dashKnockMul=(sk&&sk.knockMul)||1;
    this.vfx.trail(f.x,f.y,col,9);
    this.vfx.burst(f.x,f.y,{count:8,color:col,angle:aim+Math.PI,
      spread:.7,speed:110,life:.24,r:2});
  }
  // 泰山压顶 — LEAP SLAM: the cat springs into the air (brief i-frames, rooted-in-
  // flight) and crashes down on a target point for a punchy small-radius AOE that
  // staggers everyone caught under it. A committed, readable mid-range gap-closer:
  // the arc telegraphs where it lands, so it rewards good spacing, not spam.
  leapSlam(f, aim, sk, dmg, col) {
    let tx, ty;
    if (f === this.me() && !this.game.isTouch) { const m = this.game.mouse || {}; tx = m.x; ty = m.y; }
    else { const t = this.lockedEnemy() || this.nearestEnemy(f.x, f.y); if (t) { tx = t.x; ty = t.y; } else { tx = f.x + Math.cos(aim) * 190; ty = f.y + Math.sin(aim) * 190; } }
    // cap leap range so it stays a reach, not a teleport
    const d = Math.hypot(tx - f.x, ty - f.y), max = 170;
    if (d > max) { const a = Math.atan2(ty - f.y, tx - f.x); tx = f.x + Math.cos(a) * max; ty = f.y + Math.sin(a) * max; }
    f._leapT = 0.44; f._leapMax = 0.44; f._leapFrom = { x: f.x, y: f.y }; f._leapTo = { x: tx, y: ty };
    f._leapSkill = sk; f._leapDmg = dmg; f._leapCol = col; f.inv = 0.46; f._leapR = 54;
    this.vfx.ring(tx, ty, { r0: f._leapR, vr: -120, life: 0.44, color: col, width: 3 });   // shrinking target reticle
    window.MorrowwishAudio?.effect?.('charge');
  }
  // Zero poise is the sole recovery trigger. Vulnerability lasts for the
  // stagger window; only then does gradual refilling begin.
  // A partially depleted gauge never regenerates automatically.
  triggerStagger(e,seconds=3) {
    if (!e || !e.alive) return;
    e.poise=0;
    e.poiseRecovering=true;
    e.poiseComboHits=0;e.poiseLastHitAt=-99;
    e.staggerT=Math.max(e.staggerT||0,seconds);
  }
  // land the leap: AOE slam + stagger under the impact point
  leapLand(f) {
    const tx = f._leapTo.x, ty = f._leapTo.y, R = f._leapR || 78, col = f._leapCol || '#fff';
    f.x = clamp(tx, BATTLE_MARGIN.side, this.W - BATTLE_MARGIN.side);
    f.y = clamp(ty, this.topMargin, this.H - this.bottomMargin);
    f._hop = 0;
    this.vfx.shockwave(tx, ty, col);
    this.vfx.ring(tx, ty, { r0: 8, vr: R * 7, life: 0.34, color: col, width: 6 });
    this.vfx.burst(tx, ty, { count: this.game.isTouch ? 10 : 16, color: col, speed: 230, life: 0.42, r: 4, grav: 260 });
    this.shakeT = Math.max(this.shakeT, 0.2); this.hitstop = Math.max(this.hitstop, 0.05);
    for (const e of this.liveEnemies()) {
      if (Math.hypot(e.x - tx, e.y - ty) > R) continue;
      const result=this.resolveHit(e, 'me', f._leapSkill || { element: f.element }, f._leapDmg, e.x, e.y);
      // Only 泰山压顶 has the dedicated stagger trait. Other leap skills
      // apply armor break through resolveHit and cannot skip the poise rules.
      if (result.dealt>0 && (f._leapSkill?.id==='quakeStomp' || f._leapSkill?.tags?.includes('stagger')))
        this.triggerStagger(e);
    }
    window.MorrowwishAudio?.effect?.('crash');
    f._leapT = 0; f._leapSkill = null;
  }
  // 飞扑 — FLYING POUNCE: a fast, flat lunge toward the aim; first enemy contacted
  // takes a hard hit + knockback. Shares the pounce travel/contact machinery but
  // reaches farther and hits harder than the default dash leap.
  flyingPounce(f, aim, sk, dmg, col) {
    f.dashT = 0.29; f.inv = 0.32; f.pounce = true; f._dashAim = aim; f._pounceSkill = sk;
    f._pounceDmg=dmg;f._dashReach=155;f._dashTravel=0;
    this.vfx.trail(f.x, f.y, col, 11);
    // A physical lunge is not a 150-unit glowing ranged laser.
    this.vfx.burst(f.x, f.y, { count: 10, color: col, angle: aim + Math.PI, spread: 1.0, speed: 230 });
  }
  // Chain lightning: hit the aimed/nearest enemy, then jump to the nearest
  // not-yet-hit enemy within jumpR, up to N jumps. Only chain nodes are hit.
  chainBolt(f, aim, sk, dmg, col) {
    const JUMP_R = 240, MAX = 4;
    let from = { x: f.x, y: f.y };
    const hit = new Set();
    let node = this.targetEnemy ? this.targetEnemy() : this.nearestEnemy(f.x, f.y);
    let n = 0, power = dmg;
    while (node && n < MAX) {
      hit.add(node.i);
      this.vfx.beam(from.x, from.y, node.x, node.y, col);
      this.vfx.impact(node.x, node.y, col);
      this.resolveHit(node, 'me', sk, power, node.x, node.y);
      from = { x: node.x, y: node.y };
      power *= 0.82;                                 // each jump a little weaker
      // next nearest live, unhit enemy within jump range
      let best = null, bd = JUMP_R;
      for (const e of this.liveEnemies()) { if (hit.has(e.i)) continue; const dd = Math.hypot(e.x - from.x, e.y - from.y); if (dd < bd) { bd = dd; best = e; } }
      node = best; n++;
    }
  }
  // Channeled BEAM (水枪 / flamethrower): a sustained line from the caster that
  // ticks continuous damage to everything along it for a short channel. The caster
  // is anchored (can't move) while channeling, so it's a commit. One beam per caster.
  castBeam(f, aim, sk, dmgPerSec, col) {
    if (this.beams.some(b => b.uid === f.cat.uid)) return;      // already channeling
    const dur = sk?.channel || 1.1, len = sk?.reach || 300, width = sk?.width || 26;
    f._beamRoot = dur;                                          // anchors movement (see readInput/autoDrive)
    this.beams.push({
      uid: f.cat.uid, owner: 'me', f, sk, col,
      aim,baseAim:aim,len,width,
      // Longer repeated flame swings must NOT multiply total damage.
      dps:Math.max(1,dmgPerSec)*Math.min(1,(sk?.damageChannel||dur)/dur),
      t:dur,max:dur,
      tickAcc: 0, element: sk?.element,
      // Use per-beam elapsed seconds rather than wall time to throttle feedback.
      _impactAt:new Map(), _impactCount:0, _lastPulseAt:-99,
    });
    window.MorrowwishAudio?.effect?.('beam');
  }
  // Tick all active beams: damage ~8×/sec along the line, decay the channel.
  // Advance heavy-skill wind-ups; fire the skill when the charge completes.
  tickPendingCasts(dt) {
    if (!this.pendingCasts || !this.pendingCasts.length) return;
    for (const c of this.pendingCasts) {
      const f = c.f;
      if (!f || !f.alive) { c.t = 0; continue; }
      c.t -= dt;
      if (f._castRoot != null) f._castRoot = Math.max(0, c.t);   // stay rooted while charging
      // the cast follows the live aim of the active cat (you can steer during windup)
      const aim = (f === this.me()) ? this.aim : (f._aim ?? c.aim);
      c.aim = aim;
      // growing charge ring at the caster
      const k = 1 - Math.max(0, c.t) / c.max;
      this.vfx.ring(f.x, f.y, { r0: 34 * (1 - k) + 6, vr: 0, life: 0.06, color: c.col, width: 3 });
      if (c.t <= 0) { f._castRoot = 0; this.castOffensiveSkill(f, aim, c.sk, c.pow, c.col, true); }
    }
    // Drop finished/aborted casts AND always clear the caster's root flag as they leave,
    // so a cast removed via the dead/invalid path (c.t=0 + continue above) or any early
    // abort can never leave a cat permanently rooted ("卡在原地没动" in auto-battle).
    const dropped = this.pendingCasts.filter(c => c.t <= 0);
    for (const c of dropped) if (c.f && c.f._castRoot) c.f._castRoot = 0;
    this.pendingCasts = this.pendingCasts.filter(c => c.t > 0);
  }
  tickBeams(dt) {
    if (!this.beams.length) return;
    for (const b of this.beams) {
      b.t -= dt;
      const f = b.f;
      if (!f || !f.alive) { b.t = 0; continue; }
      // Water and lightning follow live aim. Fire now completes 3 FULL
      // left-right-left oscillations rather than just one wobble.
      if(b.sk?.sweep){
        const progress=1-Math.max(0,b.t)/b.max;
        const passes=Math.max(1,Math.round(b.sk.sweepPasses||2));
        // 3 half-cycles: left → right → left → right.
        b.aim=b.baseAim-Math.cos(progress*Math.PI*passes)*b.sk.sweep;
      }else if(f===this.me())b.aim=this.aim;
      if (f._beamRoot != null) f._beamRoot = Math.max(0, b.t);  // stay anchored while it lasts
      const ox = f.x + Math.cos(b.aim) * 22, oy = f.y + Math.sin(b.aim) * 22;
      const ex = ox + Math.cos(b.aim) * b.len, ey = oy + Math.sin(b.aim) * b.len;
      b._ox = ox; b._oy = oy; b._ex = ex; b._ey = ey;
      b.tickAcc += dt;
      const STEP = 1 / 8;                                        // 8 damage ticks/sec
      while (b.tickAcc >= STEP) {
        b.tickAcc -= STEP;
        const hitDmg = b.dps * STEP;
        const list = b.owner === 'me' ? this.liveEnemies() : this.team.filter(t => t.alive);
        for (const e of list) {
          if (this.pointToSeg(e.x, e.y, ox, oy, ex, ey) <= b.width + (e.r || 18) * 0.5) {
            // A sustained stream makes small damage ticks, not four huge
            // hit-stops/shakes per second. Contact feedback remains localized.
            const flame=b.sk?.id==='flameSweep',passes=Math.max(1,Math.round(b.sk?.sweepPasses||1));
            const elapsed=Math.max(0,Math.min(b.max,b.max-b.t));
            const pass=Math.min(passes-1,Math.floor(elapsed/b.max*passes));
            if(flame){
              b._flameHits??=new WeakMap();
              if(b._flameHits.get(e)===pass)continue;
            }
            // Total three-pass power stays near the OLD fire channel budget.
            // Other sustained beams retain their damage-over-time tick rate.
            const damage=flame?b.dps*b.max/passes:hitDmg;
            const contact=this.resolveHit(e,b.owner,
              {...(b.sk||{element:b.element}),isChanneledTick:!flame,
                _poiseSource:b,_poisePass:flame?pass:undefined},
              damage,e.x,e.y);
            if(contact?.dealt>0){
              if(flame)b._flameHits.set(e,pass);
              this.beamHitFeedback(b,e);
            }
          }
        }
        // sparks along the beam so it reads as a continuous stream
        const sx = ox + (ex - ox) * Math.random(), sy = oy + (ey - oy) * Math.random();
        this.vfx.trail(sx, sy, b.col, 3);
      }
    }
    // Clear the anchor flag as a beam ends so the channeler is never left stuck in
    // place (same permanent-root guard as pending casts).
    const endedBeams = this.beams.filter(b => b.t <= 0);
    for (const b of endedBeams) if (b.f && b.f._beamRoot) b.f._beamRoot = 0;
    this.beams = this.beams.filter(b => b.t > 0);
  }
  // Contact feedback for channeling: an initial connect pop and short pulses,
  // not a global flash, large knockback or hitstop on every damage tick.
  beamHitFeedback(b,target){
    if(!b||!target)return false;
    const elapsed=b.max-b.t;
    b._impactAt??=new Map();
    const last=b._impactAt.get(target);
    if(last!=null&&elapsed-last<.23)return false;
    b._impactAt.set(target,elapsed);
    b._impactCount=(b._impactCount||0)+1;
    const first=last==null,color=b.col||'#cde9ff';
    target.hitWhite=Math.max(target.hitWhite||0,first?.085:.055);
    target.hitSquash=Math.max(target.hitSquash||0,first?.14:.075);
    // Draw-only micro recoil: the target never leaves the beam's collision area.
    target._recoilX=(target._recoilX||0)+Math.cos(b.aim)*(first?3:1.4);
    target._recoilY=(target._recoilY||0)+Math.sin(b.aim)*(first?3:1.4);
    this.vfx.impactType?.(target.x,target.y,'light',{color,angle:b.aim});
    this.vfx.ring(target.x,target.y,{r0:first?9:5,
      vr:first?105:74,life:first?.26:.19,color,width:first?2.8:1.8});
    if(first)this.vfx.burst(target.x,target.y,
      {count:this.game?.isTouch?4:6,color:'#fff5dc',speed:80,life:.2,r:2});
    // Gate camera and sound across all simultaneous beam targets.
    if(elapsed-(b._lastPulseAt??-99)>.33){
      b._lastPulseAt=elapsed;
      this.addShake(first?.065:.035,b.aim);
      if(first)this.hitstop=Math.max(this.hitstop,.016);
      if(this.t-(this._lastBeamHitAudioAt??-99)>.3){
        this._lastBeamHitAudioAt=this.t;
        window.MorrowwishAudio?.effect?.('combat_hit');
      }
    }
    return true;
  }

  // perpendicular distance from point (px,py) to segment (ax,ay)-(bx,by)
  pointToSeg(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1;
    let t = ((px - ax) * dx + (py - ay) * dy) / L2; t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
  }

  skillE(f, aim) {
    f = f || this.me(); if (f.cd.e > 0) return false;
    if (aim == null) aim = (f === this.me()) ? this.aim : f._aim || 0;
    const sk = f.eSkill;
    if(sk&&(sk.kind==='heal'||sk.kind==='buff')){
      if(!this.castSupportSkill(f,sk,aim))return false;
      f.cd.e=sk.cd*(f.bond.cdReduction||1)*SKILL_CD_MULT;
      this.regularSkillAccent(f,sk.element||f.element,aim);
      this.markMoveSeen(f,sk);
      return true;
    }
    f.cd.e = (sk ? sk.cd : this.moves[2].cd) * (f.bond.cdReduction || 1) * SKILL_CD_MULT;
    const col = this.elemColor(sk ? sk.element : f.element);
    const pow = (sk ? sk.power : 1) * this.outgoingBuffMult(f);
    if (sk) {
      this.castOffensiveSkill(f, aim, sk, pow, col);
    } else {
      // no learned E skill → the classic pounce (contact-damage lunge)
      f.dashT=.26;f.inv=.3;
      f.pounce=true;f._dashAim=aim;
      f._pounceSkill={id:'starterEPounce',kind:'pounce',element:f.element,power:1,ultCost:0};
      f._dashReach=135;f._dashTravel=0;f._pounceDmg=null;
      this.vfx.shockwave(f.x,f.y,col);
      this.vfx.burst(f.x,f.y,{count:12,color:col,angle:aim+Math.PI,spread:1.2,speed:220});
      this.regularSkillAccent(f,f.element,aim);
    }
    this.gainUlt(6);
    this.markMoveSeen(f,sk);
    // The dash animation is the feedback: no blocking combat toast.
    return true;
  }
  dodge(f) {
    f = f || this.me(); if (f.dodgeCd > 0) return false;
    if(f===this.me())window.MorrowwishAudio?.effect?.('combat_dodge');
    if (f === this.me()) this._coachDodged = true;         // coach: step 4
    // A real escape tool now: a LONG i-frame dash that travels AWAY from danger,
    // plus a short bullet-time on every use so it actually buys breathing room.
    f.dodgeCd = 1.2; f.dashT = 0.32; f.inv = 0.5;
    // Pick the dash direction: honor the player's held movement if any; otherwise
    // flee the nearest incoming shot (or the nearest enemy) instead of lurching
    // toward the aim reticle (which points AT the enemy — the old useless behavior).
    let dir = null;
    const mvx = f._mvx || 0, mvy = f._mvy || 0;        // last movement input (set in readInput)
    if (f === this.me() && (Math.abs(mvx) + Math.abs(mvy)) > 0.01) {
      dir = Math.atan2(mvy, mvx);
    } else {
      let threat = null, td = 1e9;
      for (const p of this.projectiles) { if (p.owner !== 'wild') continue; const d = Math.hypot(p.x - f.x, p.y - f.y); if (d < td) { td = d; threat = p; } }
      if (threat && td < 140) dir = Math.atan2(f.y - threat.y, f.x - threat.x);   // away from the shot
      else { const ne = this.nearestEnemy(f.x, f.y); if (ne) dir = Math.atan2(f.y - ne.y, f.x - ne.x); }  // away from enemy
    }
    if (dir != null) f._dashAim = dir;
    // LEARN the player's habits: which way they strafe when dodging, and whether a
    // threat was actually present (dodge-vs-panic). Only observe the active cat.
    if (f === this.me() && this._obs) {
      const vx = f._vx || 0, vy = f._vy || 0, ne = this.nearestEnemy(f.x, f.y);
      if (ne && (Math.abs(vx) + Math.abs(vy) > 10)) {
        const toE = Math.atan2(ne.y - f.y, ne.x - f.x);
        const sign = Math.sign(Math.cos(toE) * vy - Math.sin(toE) * vx);  // CW(+)/CCW(-) relative to enemy
        this._obs.dodgeSignSum += sign; this._obs.dodgeN++;
      }
    }
    // PERFECT DODGE: an enemy shot within ~40px when you dodge → big bullet-time reward
    let perfect = false;
    for (const p of this.projectiles) {
      if (p.owner !== 'wild') continue;
      if (Math.hypot(p.x - f.x, p.y - f.y) < 40) { perfect = true; break; }
    }
    if (f === this.me() && this._obs) { this._obs.threats++; if (perfect) this._obs.dodgedThreats++; }
    if (perfect && f === this.me()) {
      this.perfectDodges++;
      this.slowmo = 0.9; this.flash = 0.25; f.inv = 0.7;
      this.gainUlt(18);
      this.addCombo(3);                                  // reward precise timing with chain
      this.vfx.ring(f.x, f.y, { r0: 8, vr: 520, life: 0.5, color: '#9d7bff', width: 6 });
      this.vfx.text(f.x, f.y - 46, '完美闪避!', '#9d7bff', 18);
      this.game.toast('✨ 完美闪避！子弹时间 + 充能');
    } else {
      // Even an ordinary dodge briefly slows the world (enemies + their shots), so
      // it reliably creates space to reposition — the "freeze time" the dash needs.
      if (f === this.me()) this.slowmo = Math.max(this.slowmo, 0.35);
      this.vfx.ring(f.x, f.y, { r0: 6, vr: 300, life: 0.35, color: '#bfe9ff', width: 3 });
      this.vfx.burst(f.x, f.y, { count: 8, color: '#bfe9ff', speed: 170, life: 0.32, r: 2 });
    }
    return true;
  }
  // How likely auto-battle is to evade a given incoming threat. Deliberately NOT
  // 100%: a cruising, unhurt squad dodges LESS (so flawless runs still take hits and
  // the fight has stakes); a hurt squad defends harder. Keeps auto play from being
  // an untouchable robot that strafes every shot. (Playtest + owner feedback.)
  autoDodgeChance(f){
    const hp = f && f.maxhp ? f.hp / f.maxhp : 1;
    // 0.45 while healthy → up to ~0.8 when badly hurt
    return hp > 0.6 ? 0.45 : hp > 0.3 ? 0.62 : 0.8;
  }
  // Combined movement multiplier: soft-CC slow (冰冻/束缚/感电) AND the post-cast
  // 后遗症 recovery slow left after a heavy skill. Shared by player + enemy movement.
  moveMul(f){
    let m = f.slowed ? 0.55 : 1;
    if (f._castSlow > 0) m *= 0.5;          // sluggish recovery after a heavy cast
    if ((f.reflectT || 0) > 0) m *= 0.5; // directional reflect wall: half movement speed
    if ((f.hasteT || 0) > 0) m *= 1.25;  // 静电舔毛 haste: brief move speed-up (elec heal tweak)
    return m;
  }
  canUltimate(){ return this.ult>=100 && this.ultCd<=0 && !this.ultCinematic; }
  // Would the ult actually HIT something if cast now? Mirrors each archetype's real
  // geometry (fire = forward cone so the target must be roughly ahead; everything
  // else = a radius around the caster). Used to gate AUTO-cast so the AI doesn't
  // blow the ult into empty space; manual R still fires on demand.
  ultWillConnect(f){
    f = f || this.me(); if(!f) return false;
    const skill=f.ultSkill, el=skill&&skill.ultCost>0?skill.element:null;
    const diag=Math.hypot(this.W,this.H);
    const live=this.liveEnemies(); if(!live.length) return false;
    if(el==='fire'&&skill.id!=='purrNova'){
      const aim=(f===this.me())?this.aim:(f._aim||0), half=0.6, reach=diag*0.5;
      return live.some(e=>{
        if(Math.hypot(e.x-f.x,e.y-f.y)>reach) return false;
        let da=Math.atan2(e.y-f.y,e.x-f.x)-aim; while(da>Math.PI)da-=Math.PI*2; while(da<-Math.PI)da+=Math.PI*2;
        return Math.abs(da)<=half;
      });
    }
    const R = el==='water'?diag*0.55:el==='dark'?diag*0.52:el==='light'?diag*0.42:el==='grass'?diag*0.4:el==='elec'?diag*1.4:diag*0.32;
    return live.some(e=>Math.hypot(e.x-f.x,e.y-f.y)<=R);
  }
  ultimate(){
    if(this.ultCd>0||this.ultCinematic){
      if(!this.autoMode&&this.ultCd>0&&this.t-(this._ultWarnAt??-999)>2.5){
        const en=window.MorrowwishI18n?.get?.()!=='zh';
        this.game.toast(en?'Ultimate cooldown: '+Math.ceil(this.ultCd)+'s':'必杀冷却中：'+Math.ceil(this.ultCd)+'秒');
        this._ultWarnAt=this.t;
      }
      return false;
    }
    if(this.ult<100){
      this.game.toast(window.MorrowwishI18n?.get?.()==='zh'?'必杀能量不足':'Not enough ultimate energy');
      return false;
    }
    const f=this.me(),skill=f.ultSkill;
    const locked=this.lockedEnemy()||this.nearestEnemy(f.x,f.y);
    if(locked){
      this._lockIdx=locked.i;
      this.aim=Math.atan2(locked.y-f.y,locked.x-f.x);
      f._aim=this.aim;
    }
    this.ult=0;
    this._ultAnnounced=false; this._ultReadyT=0; this._ultRemindT=0; this._ultAutoFired=false;   // re-arm reminder for the next charge
    this.ultCd=ULT_COOLDOWN_SECONDS;
    // 虚吞 now uses its intended gravity-vortex/rewind archetype.
    // castDeathRay remains available for a future dedicated laser spell.
    // SINGLE-CAT ult: fires IN PLACE immediately — NO arena-freeze, NO full-screen
    // cinematic (only the 合体技/duo combo does that). Keep a short i-frame + a punchy
    // flash/shake so it still feels big, then run the elemental payload right now.
    f.inv = 1.0;
    // Solo ULT never washes the whole arena with a flash.
    this.slowmo = Math.max(this.slowmo, 0.18);     // a brief hit-stop beat, not a lockout
    if(!window.MorrowwishAudio?.skillSignature?.(skill?.id||skill?.name,f.element||skill?.element,3))
      window.MorrowwishAudio?.effect?.('combat_ultimate');
    const ordered=this.liveEnemies();
    this._ultCastTargets=(locked?[locked,...ordered.filter(e=>e!==locked)]:ordered)
      .slice(0,7).map(e=>({x:e.x,y:e.y}));
    this.addShake?.(.55,this.aim);
    this._pendingUlt = { f, skill };
    this.fireUltimatePayload();                    // detonate immediately, in place
    return true;
  }
  // Deferred ultimate payload — the real damage/VFX, run at the cinematic's climax.
  // Per-ELEMENT ultimate archetypes. Each is a distinct attack shape so different
  // cats' ultimates look and play differently; all funnel damage through resolveHit
  // and return {total,kos,hits} for the shared consequence/banner logic.
  ultArchetype(f, skill, color, dmg) {
    let total = 0, kos = 0, hits = 0;
    const strike = (e, mult, px, py) => {
      if (!e.alive) return;
      const before = e.alive;
      const r = this.resolveHit(e, 'me', skill, dmg * (mult || 1), px != null ? px : e.x, py != null ? py : e.y);
      if (r.dealt > 0) { hits++; total += r.dealt; }
      if (before && !e.alive) kos++;
      this.vfx.impact(e.x, e.y, color);
    };
    const diag = Math.hypot(this.W, this.H);
    const el = skill.element;
    const aim = (f === this.me()) ? this.aim : (f._aim || 0);
    if(skill.id==='purrNova'){
      // 呼噜新星: a genuine 360-degree fire explosion (not sunflare's cone).
      const R=diag*.4;
      for(const e of this.liveEnemies().slice()){
        if(Math.hypot(e.x-f.x,e.y-f.y)<=R)strike(e,1.05);
      }
      this.vfx.ring(f.x,f.y,{r0:20,vr:R*2.4,life:.5,color:'#ffb66d',width:9});
      for(let i=0;i<22;i++){
        const a=i*2*Math.PI/22,r=28+Math.random()*R;
        this.vfx.burst(f.x+Math.cos(a)*r,f.y+Math.sin(a)*r,
          {count:2,color,speed:95,life:.55,r:3,grav:-34});
      }
    }else if(skill.id==='moonfang'){
      // 月噬牙: slash the target with two moon fangs, not a self-centered halo.
      const target=this.lockedEnemy()||this.nearestEnemy(f.x,f.y);
      const px=target?.x??(f.x+Math.cos(aim)*170);
      const py=target?.y??(f.y+Math.sin(aim)*170);
      const R=diag*.25;
      for(const e of this.liveEnemies().slice()){
        if(Math.hypot(e.x-px,e.y-py)<=R)strike(e,1.08);
      }
      this.vfx.burst(px,py,{count:16,color:'#d0d9ff',speed:170,life:.4,r:3});
      this.vfx.shockwave(px,py,'#f5e4d4');
    }else if (el === 'fire') {
      // 烈焰喷涌: a forward blaze CONE — hits enemies in a wide arc ahead, big on-aim.
      const half = 0.6, reach = diag * 0.5;
      for (const e of this.liveEnemies().slice()) {
        const d = Math.hypot(e.x - f.x, e.y - f.y); if (d > reach) continue;
        let da = Math.atan2(e.y - f.y, e.x - f.x) - aim; while (da > Math.PI) da -= Math.PI * 2; while (da < -Math.PI) da += Math.PI * 2;
        if (Math.abs(da) > half) continue;
        strike(e, 1.15);
      }
      for (let i = 0; i < 26; i++) { const a = aim + (Math.random() - 0.5) * half * 2, r = 40 + Math.random() * reach; this.vfx.burst(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r, { count: 2, color, speed: 120, life: 0.5, r: 4, grav: -40 }); }
      this.vfx.shockwave(f.x, f.y, color);
    } else if (el === 'water') {
      // 汹涌怒涛: a giant expanding tidal RING — everyone on the field is swept, soaked.
      const R = diag * 0.55;
      for (const e of this.liveEnemies().slice()) { if (Math.hypot(e.x - f.x, e.y - f.y) <= R) strike(e, 1.0); }
      this.vfx.ring(f.x, f.y, { r0: 20, vr: R * 2.6, life: 0.7, color, width: 14 });
      this.vfx.ring(f.x, f.y, { r0: 40, vr: R * 2.2, life: 0.6, color: '#fff', width: 4 });
      this.vfx.burst(f.x, f.y, { count: 26, color, speed: 340, life: 0.6, r: 3 });
    } else if (el === 'elec') {
      // 雷霆万钧: chain LIGHTNING that forks to every enemy on the field.
      for (const e of this.liveEnemies().slice()) { this.vfx.beam(f.x, f.y, e.x, e.y, color); strike(e, 1.1); }
      this.vfx.ring(f.x, f.y, { r0: 14, vr: diag * 1.4, life: 0.4, color, width: 6 });
      this.shakeT = Math.max(this.shakeT, 0.5);
    } else if (el === 'grass') {
      // 万木丛生: a huge lingering OVERGROWTH field — hits now + leaves a bind zone.
      const R = diag * 0.4;
      for (const e of this.liveEnemies().slice()) { if (Math.hypot(e.x - f.x, e.y - f.y) <= R) strike(e, 0.9); }
      if (this.spawnField) this.spawnField(f.x, f.y, R, { element: 'grass', tag: 'bind', life: 5 }, color, 'me', skill);
      this.vfx.ring(f.x, f.y, { r0: 16, vr: R * 2.2, life: 0.6, color, width: 10 });
      for (let i = 0; i < 20; i++) { const a = Math.random() * Math.PI * 2, r = Math.random() * R; this.vfx.burst(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r, { count: 2, color, speed: 60, life: 0.7, r: 3, grav: -30 }); }
    } else if (el === 'dark') {
      // 噬影漩涡: a VORTEX that drags enemies inward, then detonates (big single pull).
      const R = diag * 0.52;
      for (const e of this.liveEnemies().slice()) {
        const d = Math.hypot(e.x - f.x, e.y - f.y); if (d > R) continue;
        // pull toward the caster for a brief gather before the hit
        if (d > 30) { const a = Math.atan2(f.y - e.y, f.x - e.x); e.kbx = (e.kbx || 0) + Math.cos(a) * 320; e.kby = (e.kby || 0) + Math.sin(a) * 320; }
        strike(e, 1.2);
      }
      // Keep implosion inside the local fight, never a screen-spanning arc.
      this.vfx.ring(f.x, f.y, { r0: Math.min(170,R*.34), vr: -240,
        life: .42, color: '#8a55bb', width: 4 });
      this.vfx.burst(f.x, f.y, { count: 28, color, speed: 300, life: 0.55, r: 3 });
    } else {
      // light (and any fallback): 圣耀爆发: radiant NOVA around the caster.
      const R = diag * 0.42;
      for (const e of this.liveEnemies().slice()) { if (Math.hypot(e.x - f.x, e.y - f.y) <= R) strike(e, 1.05); }
      this.vfx.ring(f.x, f.y, { r0: 18, vr: R * 2.6, life: 0.6, color, width: 12 });
      this.vfx.ring(f.x, f.y, { r0: 30, vr: R * 2.2, life: 0.5, color: '#fff', width: 4 });
      this.vfx.burst(f.x, f.y, { count: 24, color, speed: 320, life: 0.55, r: 3 });
    }
    return { total, kos, hits };
  }

  fireUltimatePayload(){
    const p=this._pendingUlt; if(!p)return; this._pendingUlt=null;
    const f=p.f, skill=p.skill;
    if(!f||!f.alive)return;
    this.shakeT=.6; // impact stays in arena; no full-screen flash
    if(skill&&skill.ultCost>0){
      // Each ELEMENT's ultimate is a genuinely different attack shape (not one AOE
      // recolored): fire = forward blaze cone, water = giant tidal wave ring, elec =
      // chain lightning to all, grass = lingering overgrowth field, dark = pull
      // vortex, light = radiant nova. Damage/tally/consequence/toast are shared.
      const color=this.elemColor(skill.element);
      const dmg=f.dmg*skill.power*.42;                    // shared per-target base
      const {total,kos,hits}=this.ultArchetype(f,skill,color,dmg);
      this._ultConsequence(f,skill,color,total,kos,hits);
      const duration=skill.id==='sunbloom'?1.9:skill.id==='voidMaw'?1.65:
        skill.id==='tsunamiPaw'?1.5:1.36;
      this.skillStrokes.push({kind:'ultimate',skillId:skill.id,
        x:f.x,y:f.y,element:skill.element,color,
        angle:f===this.me()?this.aim:(f._aim||0),targets:this._ultCastTargets||[],
        life:duration,max:duration});
      this.vfx.text(f.x,f.y-48,this.elemSymbol(skill.element),color,11);
      this.game.toast(this.elemSymbol(skill.element)+' '+(window.MorrowwishI18n?.get?.()==='zh'?'必杀 · ':'Ultimate · ')+(window.CatBondI18n?.translate?.(skill.name)||skill.name)+(window.MorrowwishI18n?.get?.()==='zh'?'！':'!'));
      this.lastUltimate={skill:skill.id,element:skill.element,hits};
      this.markMoveSeen(f,skill);
      window.arcadeMetric?.('bond_signature_ultimate',{skill:skill.id,rarity:GameData.speciesById(f.cat.species).rarity});
    }else{
      // The ordinary ultimate is a large claw cyclone (~32% arena) around the caster.
      const ultR=Math.hypot(this.W,this.H)*0.32;
      const targets=this.liveEnemies().filter(e=>Math.hypot(e.x-f.x,e.y-f.y)<=ultR);
      let total=0,kos=0;
      for(const e of targets){
        const before=e.hp,aliveBefore=e.alive;
        this.hurtEnemy(e,f.dmg*0.85,e.x,e.y,true);   // basic ult dmg trimmed (was 1.25)
        total+=Math.max(0,before-e.hp);
        if(aliveBefore&&!e.alive)kos++;
        this.vfx.impact(e.x,e.y,'#e7c7a7');
      }
      this.skillStrokes.push({kind:'furStorm',x:f.x,y:f.y,
        color:'#f7d6a2',life:.7,max:.7});
      this.vfx.burst(f.x,f.y,{count:9,color:'#ffedca',speed:185,life:.35,r:2});
      this.game.toast(window.MorrowwishI18n?.get?.()==='zh'?'必杀 · 喵爪旋风！':'Ultimate · Claw Cyclone!');
      this._ultConsequence(f,{name:'喵爪旋风'},'#f7d6a2',total,kos,targets.length);
      this.lastUltimate={skill:'basicCatStorm',element:'neutral',hits:targets.length};
    }
  }
  // Scale the ultimate's PAYOFF to what it actually did: a bold element-colored
  // result banner ("技能名 -总伤 · 收服×N"), and reshape shake/flash + the
  // remaining cinematic length by consequence — a crisp hard cut on an overkill
  // of one chip-tickled enemy, a lingering kill-cam when it deletes the pack.
  // (Playtest: the ult felt identical whether it wiped the field or did nothing.)
  _ultConsequence(f,skill,color,total,kos,hits){
    const en=window.MorrowwishI18n?.get?.()!=='zh';
    const nm=window.CatBondI18n?.translate?.(skill.name)||skill.name;
    let txt=(skill.name?nm+'  ':'')+'-'+Math.round(total);
    if(kos>0) txt+=(en?'   KO ×':'   收服×')+kos;
    this._ultResultBanner=kos>0?2.0:1.4; this._ultResultText=txt; this._ultResultColor=color;
    // Consequence-scaled juice + cinematic pacing.
    const big=kos>=2|| (hits>=3);
    this.shakeT=Math.max(this.shakeT, big?0.75:hits>0?0.5:0.3);
    // No full-screen color wash for solo ultimate consequences.
    if(this.ultCinematic){
      if(kos>0){ this.ultCinematic.t=Math.max(this.ultCinematic.t, kos>=2?1.9:1.4); } // lingering kill-cam
      else { this.ultCinematic.t=Math.min(this.ultCinematic.t, 1.0); }                // snappy cut when it fizzled
    }
    if(kos>0) window.MorrowwishAudio?.effect?.('crash');
  }
  // Advance the ultimate cinematic; detonate at the impact beat, end after 3s.
  tickUltCinematic(dt){
    const c=this.ultCinematic; if(!c)return;
    c.t=Math.max(0,c.t-dt);
    const elapsed=c.max-c.t;
    if(!c.impacted && elapsed>=c.impactAt){ c.impacted=true; this.fireUltimatePayload(); }
    if(c.t<=0) this.ultCinematic=null;
  }

  // ---------------- 破坏死光 · DESTRUCTION DEATH-RAY (signature ULT VFX) ----------------
  // A wide charged beam that fires from the caster and SWEEPS a ~120° arc. Runs on
  // its OWN timeline (no arena-freeze cinematic): charge-up tell (~0.5s) → fire snap
  // (flash + shake) → ease-in-out sweep (~1.2s) → cut-off collapse (~0.3s). Enemies
  // the beam crosses take damage over the sweep, throttled per-enemy so it reads as a
  // continuous ray rather than a 60Hz one-shot. Element-tinted; scorch lingers on a
  // persistent accumulation canvas composited under the beam.
  castDeathRay(f, skill){
    if(!f||!f.alive)return false;
    const color=this.elemColor(skill?skill.element:'dark');
    // Aim the SWEEP so it rakes across the pack: centre on the live-enemy centroid
    // (fallback to the nearest enemy, then current aim) and swing ±60° around it.
    const live=this.liveEnemies();
    let cx=f.x+Math.cos(this.aim)*200, cy=f.y+Math.sin(this.aim)*200;
    if(live.length){
      cx=live.reduce((s,e)=>s+e.x,0)/live.length;
      cy=live.reduce((s,e)=>s+e.y,0)/live.length;
    }
    const centre=Math.atan2(cy-f.y,cx-f.x);
    const half=Math.PI*120/360/2;                 // half of a 120° arc
    // Sweep from the side the pack is NOT weighted toward, so the beam ends ON them.
    const start=centre-half, end=centre+half;
    const chargeDur=0.5, sweepDur=1.2, cutoffDur=0.3;
    this.deathRay={
      ox:f.x, oy:f.y, color, element:skill?skill.element:'dark', skill:skill||{element:'dark'},
      dmg:f.dmg*((skill&&skill.power)||2.4),       // per-hit base (throttled, so NOT a one-shot)
      caster:f, start, end, age:0,
      chargeDur, sweepDur, cutoffDur, total:chargeDur+sweepDur+cutoffDur,
      ang:start, L:0, w1:0, scorch:null, sctx:null,
    };
    f.inv=Math.max(f.inv, this.deathRay.total+0.1);   // safe through the whole beam
    this.shakeT=Math.max(this.shakeT,0.5);            // fire snap shake (decays in update)
    this.flash=Math.max(this.flash,0.35);
    this.slowmo=Math.max(this.slowmo,0.25);
    this.vfx.ring(f.x,f.y,{r0:10,vr:340,life:.5,color,width:7});
    this.vfx.burst(f.x,f.y,{count:14,color,speed:200,life:.5,r:3});
    window.MorrowwishAudio?.effect?.('ultimate');
    this.markMoveSeen(f,skill);
    this.lastUltimate={skill:(skill&&skill.id)||'deathray',element:this.deathRay.element,hits:0};
    window.arcadeMetric?.('bond_signature_ultimate',{skill:(skill&&skill.id)||'deathray',rarity:GameData.speciesById(f.cat.species).rarity,shape:'deathray'});
    return true;
  }
  // Signed ray→arena-box distance (so the beam tip / impact blob sits at the edge).
  _rayToBounds(ox,oy,ang){
    const x0=BATTLE_MARGIN.side, x1=this.W-BATTLE_MARGIN.side;
    const y0=this.topMargin, y1=this.H-this.bottomMargin;
    const cx=Math.cos(ang), cy=Math.sin(ang); let best=Infinity;
    if(Math.abs(cx)>1e-4){ for(const bx of [x0,x1]){ const t=(bx-ox)/cx; if(t>1){ const y=oy+cy*t; if(y>=y0-40&&y<=y1+40)best=Math.min(best,t); } } }
    if(Math.abs(cy)>1e-4){ for(const by of [y0,y1]){ const t=(by-oy)/cy; if(t>1){ const x=ox+cx*t; if(x>=x0-40&&x<=x1+40)best=Math.min(best,t); } } }
    return Number.isFinite(best)?best:Math.hypot(this.W,this.H);
  }
  // Current beam geometry for THIS frame (shared by damage + render). Returns null
  // outside the active phases so nothing draws/hurts during pure charge/after cutoff.
  _deathRayFrame(){
    const r=this.deathRay; if(!r)return null;
    const a=r.age;
    let phase, firing=false, intensity=0, sweepT=0;
    if(a<r.chargeDur){ phase='charge'; intensity=a/r.chargeDur; }
    else if(a<r.chargeDur+r.sweepDur){ phase='sweep'; firing=true; intensity=1; sweepT=(a-r.chargeDur)/r.sweepDur; }
    else if(a<r.total){ phase='cutoff'; intensity=1-(a-r.chargeDur-r.sweepDur)/r.cutoffDur; }
    else { phase='done'; }
    const ease=sweepT<0.5?2*sweepT*sweepT:1-Math.pow(-2*sweepT+2,2)/2;   // ease-in-out
    const ang=r.start+(r.end-r.start)*ease;
    const L=firing||phase==='cutoff'?this._rayToBounds(r.ox,r.oy,ang):this._rayToBounds(r.ox,r.oy,ang)*0.5;
    // Far half-width swells over the charge, holds through the sweep, snaps to the
    // core on cut-off. Near width stays slim so the beam reads as a tapered lance.
    const w1=(26*Math.min(1,intensity))*(phase==='cutoff'?Math.max(0.12,intensity):1);
    r.ang=ang; r.L=L; r.w1=w1;
    return {phase,firing,intensity,sweepT,ang,L,w1,w0:Math.max(3,w1*0.4)};
  }
  // Advance the death-ray: sweep damage (throttled per enemy) + lifetime.
  tickDeathRay(dt){
    const r=this.deathRay; if(!r||this.done)return;
    r.age+=dt;
    const fr=this._deathRayFrame();
    if(fr&&fr.firing){
      const cosA=Math.cos(fr.ang), sinA=Math.sin(fr.ang);
      for(const e of this.liveEnemies()){
        e._drayCd=Math.max(0,(e._drayCd||0)-dt);
        const dx=e.x-r.ox, dy=e.y-r.oy;
        const along=dx*cosA+dy*sinA;                       // projection onto beam axis
        const perp=Math.abs(-dx*sinA+dy*cosA);             // distance from centreline
        if(along<0||along>fr.L)continue;
        if(perp>fr.w1+(e.r||18)*0.55+10)continue;          // inside the beam body
        if(e._drayCd>0)continue;
        e._drayCd=0.14;                                    // ~7 ticks/sec per enemy, never 60×
        this.resolveHit(e,'me',r.skill,r.dmg*0.3,e.x,e.y); // status + rewind still apply via skill
        if(this.lastUltimate)this.lastUltimate.hits++;
      }
    }
    if(!fr||fr.phase==='done')this.deathRay=null;
  }
  // Render the death-ray: lingering scorch (under) + layered additive beam (over).
  // NO shadowBlur anywhere — the stacked 'lighter' quads ARE the glow.
  drawDeathRay(ctx){
    const r=this.deathRay; if(!r)return;
    const fr=this._deathRayFrame(); if(!fr)return;
    const { W, H }=this, hue=_hex(r.color), light=mix(r.color,'#ffffff',0.5);
    const rgb=`${hue[0]},${hue[1]},${hue[2]}`;
    const ox=r.ox, oy=r.oy;

    // ---- 1) lingering SCORCH ARC on a persistent accumulation canvas ----
    if(typeof document!=='undefined'&&document.createElement){
      if(!r.scorch){ try{ const c=document.createElement('canvas'); c.width=W; c.height=H; r.scorch=c; r.sctx=c.getContext('2d'); }catch(e){ r.scorch=null; } }
      if(r.sctx){
        const s=r.sctx;
        s.globalCompositeOperation='destination-out';       // slow fade of old wedges
        s.fillStyle='rgba(0,0,0,0.035)'; s.fillRect(0,0,W,H);
        if(fr.firing){                                       // ONE wedge per frame at current angle
          s.globalCompositeOperation='source-over';
          s.fillStyle='rgba(34,10,46,0.5)';
          s.beginPath(); s.moveTo(ox,oy);
          s.arc(ox,oy,fr.L,fr.ang-0.05,fr.ang+0.05); s.closePath(); s.fill();
        }
        s.globalCompositeOperation='source-over';
        ctx.save(); ctx.globalAlpha=0.55; ctx.drawImage(r.scorch,0,0); ctx.restore();
      }
    }

    ctx.save();
    ctx.translate(ox,oy); ctx.rotate(fr.ang);
    const L=fr.L, w0=fr.w0, w1=fr.w1;
    const quad=(a,b)=>{ ctx.beginPath(); ctx.moveTo(0,-a); ctx.lineTo(L,-b); ctx.lineTo(L,b); ctx.lineTo(0,a); ctx.closePath(); ctx.fill(); };
    // cross gradient across local Y: transparent edge → bright spine → transparent edge
    const crossGrad=(span,edge,spine)=>{ const g=ctx.createLinearGradient(0,-span,0,span); g.addColorStop(0,edge); g.addColorStop(0.5,spine); g.addColorStop(1,edge); return g; };
    ctx.globalCompositeOperation='lighter';
    // ---- 2a) outer aura (~1.6× wide, hue, low alpha) ----
    ctx.globalAlpha=0.2*fr.intensity;
    ctx.fillStyle=crossGrad(w1*1.6+4,`rgba(${rgb},0)`,`rgba(${rgb},0.55)`);
    quad(w0*1.6+3,w1*1.6+4);
    // ---- 2b) body glow (~1.2× wide, lighter hue) ----
    ctx.globalAlpha=0.5*fr.intensity;
    ctx.fillStyle=crossGrad(w1*1.2+2,`rgba(${rgb},0)`,light);
    quad(w0*1.2+2,w1*1.2+2);
    // ---- 2c) CORE: thin tapered white spine ----
    ctx.globalAlpha=fr.intensity;
    ctx.fillStyle=crossGrad(Math.max(2,w1*0.5),'rgba(223,240,255,0)','#ffffff');
    quad(Math.max(2,w0*0.5),Math.max(2,w1*0.5));
    // ---- 3) wobbling plasma edges (scrolling sin-sum noise), capped step ----
    if(fr.firing){
      const t=this.t;
      for(const sgn of [-1,1]){
        ctx.beginPath();
        for(let x=0;x<=L;x+=12){
          const p=x/Math.max(1,L);
          const hw=(w0+(w1-w0)*p);
          const wob=Math.sin(x*0.05-t*18)*2.4+Math.sin(x*0.013+t*9)*1.6;
          const y=sgn*(hw+wob);
          x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
        }
        ctx.globalAlpha=0.5*fr.intensity; ctx.strokeStyle=`rgba(${rgb},0.9)`; ctx.lineWidth=3; ctx.stroke();
        ctx.globalAlpha=0.9*fr.intensity; ctx.strokeStyle='#ffffff'; ctx.lineWidth=1.2; ctx.stroke();
      }
    }
    // ---- 4) bright moving IMPACT blob at the beam tip (L,0) ----
    const pulse=1+0.18*Math.sin(this.t*30);
    const blobR=(w1*1.7+10)*pulse*fr.intensity;
    if(blobR>1){
      const g=ctx.createRadialGradient(L,0,0,L,0,blobR);
      g.addColorStop(0,'#ffffff'); g.addColorStop(0.35,`rgba(${rgb},0.9)`); g.addColorStop(1,`rgba(${rgb},0)`);
      ctx.globalAlpha=fr.intensity; ctx.fillStyle=g;
      ctx.beginPath(); ctx.arc(L,0,blobR,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
    // origin muzzle glow
    ctx.save(); ctx.globalCompositeOperation='lighter';
    const og=ctx.createRadialGradient(ox,oy,0,ox,oy,34*fr.intensity+6);
    og.addColorStop(0,'#ffffff'); og.addColorStop(0.5,`rgba(${rgb},0.8)`); og.addColorStop(1,`rgba(${rgb},0)`);
    ctx.globalAlpha=fr.intensity; ctx.fillStyle=og;
    ctx.beginPath(); ctx.arc(ox,oy,34*fr.intensity+6,0,Math.PI*2); ctx.fill();
    ctx.restore();
    // charge-up tell: a faint aim line sweeping to the start angle before the fire snap
    if(fr.phase==='charge'){
      ctx.save(); ctx.globalAlpha=0.3*fr.intensity; ctx.strokeStyle=r.color; ctx.lineWidth=1.5; ctx.setLineDash([6,10]);
      ctx.beginPath(); ctx.moveTo(ox,oy); ctx.lineTo(ox+Math.cos(fr.ang)*fr.L,oy+Math.sin(fr.ang)*fr.L); ctx.stroke(); ctx.restore();
    }
  }
  // Two active cats + an explicitly ordered bench. Trading places preserves
  // that cat's real battle HP, skills and cooldowns (no free healing).
  rotateReserve(index) {
    if(this.done||this.ultCinematic||this.duoCinematic?.t>0)return false;
    if(this.active>=this.FIELD_CAP)return false; // temporary reinforcement stays temporary
    const pick=this.reserve[index],out=this.me();
    if(!pick||!out||!out.alive)return false;
    const english=window.MorrowwishI18n?.get?.()!=='zh';
    const wait=(this.reserveSwapReadyAt-Date.now())/1000;
    if(wait>0){
      this.game.toast(english?'Switch ready in '+Math.ceil(wait)+'s':'换猫还需 '+Math.ceil(wait)+' 秒');
      return false;
    }
    const incoming=this._benchFighters.get(pick.uid)||this.makeFighter(pick,this.active);
    if(!incoming.alive)return false;
    this._benchFighters.delete(pick.uid);
    out._reinforcement=false;
    this._benchFighters.set(out.cat.uid,out);
    this.reserve[index]=out.cat;
    incoming.i=this.active;incoming._reinforcement=false;
    incoming.x=out.x;incoming.y=out.y;incoming.moving=false;
    incoming.inv=Math.max(incoming.inv||0,0.8);
    this.team[this.active]=incoming;
    this.reserveSwapReadyAt=Date.now()+6000;
    this.vfx.ring(incoming.x,incoming.y,{r0:9,vr:270,life:.38,color:'#b6e3bf',width:4});
    this.game.buildTeamSlots?.();
    this.game.updateSkillLabels?.();
    this.game.toast(english?State.catName(incoming.cat)+' joins the duo!':State.catName(incoming.cat)+' 换上场！');
    window.arcadeMetric?.('bond_tactical_swap',{});
    return true;
  }

  switchTo(i) {
    if (i === this.active || !this.team[i] || !this.team[i].alive) return;
    // Take control of the chosen cat WHERE IT ALREADY STANDS — do not relocate its
    // body to the old cat's spot (that made the other cat visibly teleport across
    // the arena). A brief swap-in i-frame + a marker ring on the new controlled cat.
    const nf = this.team[i];
    nf.inv = Math.max(nf.inv || 0, 0.4);
    this.active = i;
    this.vfx.ring(nf.x, nf.y, { r0: 8, vr: 280, life: 0.35, color: '#9be7c4', width: 3 });
    this.vfx.burst(nf.x, nf.y, { count: 10, color: '#9be7c4', speed: 180, life: 0.4 });
    this.game.toast((window.MorrowwishI18n?.get?.()==='zh'?'切换到 ':'Switched to ')+State.catName(nf.cat)+'！');
  }

  gainUlt(n) {
    const before = this.ult;
    this.ult = Math.min(100, this.ult + n);
    // Rising edge: the instant the meter first fills, announce it (banner + sting +
    // button pulse) so players actually press R. (Playtest P2: 0 ults fired in 8
    // battles because reaching 100 was silent.) Once per battle.
    if (before < 100 && this.ult >= 100 && !this._ultAnnounced) {
      this._ultAnnounced = true; this._ultReadyBanner = 1.4;   // #ult-btn already pulses via .ready in updateBattleUI
      this._ultReadyT = 0;                                     // start the unused-timer for re-arm + failsafe
      window.MorrowwishAudio?.effect?.('ready');
    }
  }
  // Nudge players who fill the meter but never press R (the panicky/impatient
  // cohort fired 0 ults). While full & manual: re-flash the ready banner every
  // few seconds, and after a longer idle auto-cast it once so they SEE the payoff.
  tickUltReminder(dt){
    if(this.autoMode||this.ultCinematic){ this._ultReadyT=0; this._ultRemindT=0; return; }
    if(this.ult<100){ this._ultReadyT=0; this._ultRemindT=0; return; }
    this._ultReadyT=(this._ultReadyT||0)+dt;        // total idle-while-ready (drives the failsafe)
    this._ultRemindT=(this._ultRemindT||0)+dt;      // cadence counter for re-flashing the prompt
    if(this._ultRemindT>=3 && this._ultReadyBanner<=0){     // re-arm the prompt periodically
      this._ultReadyBanner=1.2; this._ultRemindT=0;
      window.MorrowwishAudio?.effect?.('ready');
    }
    if(this._ultReadyT>=9 && !this._ultAutoFired){          // failsafe auto-cast so the payoff is never missed
      this._ultAutoFired=true;
      const en=window.MorrowwishI18n?.get?.()!=='zh';
      this.game.toast(en?'Auto-unleashing your ultimate!':'自动释放必杀技！');
      this.ultimate();
    }
  }

  // ---- COMBO: every hit extends the chain; higher chain = more dmg + ult ----
  // Combo bonus with DIMINISHING returns so it can't stack multiplicatively with
  // element-effectiveness + STAB into a one-shot. Square-root curve: ~×1.35 at 10
  // combo, ~×1.55 at 25, caps ~×1.7 at 50 (was a runaway linear ×2.5).
  comboMult() { return 1 + Math.min(0.15, Math.sqrt(Math.min(this.combo, 50)) * 0.026); }
  addCombo(n) {
    this.combo += (n || 1);
    this.comboT = 1.3;                                          // drop window (需持续命中)
    if (this.combo > this.comboBest) this.comboBest = this.combo;
    // milestones: juice ramps with the chain (Balatro-style crescendo)
    if (this.combo > 0 && this.combo % 10 === 0) {
      this.comboFlash = 0.5; this.shakeT = Math.max(this.shakeT, 0.15);
      this.gainUlt(6);                                          // chains feed the ult
      const me = this.me();
      // The compact combo chip in the HUD replaces this mid-arena banner.
      this.vfx.ring(me.x, me.y, { r0: 10, vr: 420, life: 0.4, color: '#ffd36b', width: 4 });
      // Do not stack a toast over the battle for each combo milestone.
    }
  }
  breakCombo() {
    // Avoid an extra floating sentence every time a combo ends.
    this.combo = 0; this.comboT = 0;
  }

  spawnProj(x, y, ang, spd, dmg, owner, color, r, kind, skill, life) {
    const L = life || 2.2;
    const p = { x, y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, dmg, owner, color, r, r0: r, kind, life: L, maxLife: L, ang, skill: skill || null };
    // Optional projectile behaviours carried from the skill:
    //  grow  — radius expands over flight (bigger area the longer it travels)
    //  homing— turns toward the owner's target each frame, up to homingTurn rad/s
    //  maxLife— hard flight-time cap (homing shots expire so they can't orbit forever)
    if (skill) {
      if (skill.grow) p.grow = skill.grow;                 // radius multiplier at end of life
      if (skill.homing) { p.homing = skill.homing; p.spd = spd; }
    }
    this.projectiles.push(p);
    return p;
  }

  // 对波 — PROJECTILE CLASH. When a player shot and a wild shot overlap mid-air
  // they collide instead of flying through each other (the anime "wave clash").
  // Each shot's clash POWER = dmg × radius, and the attacker's element can win the
  // exchange: a water jet overpowers an electric bolt, etc. Outcomes:
  //   • power within ~30% → MUTUAL cancel (both pop)
  //   • clear winner → loser pops, winner survives but shrinks/weakens
  // Lobbed AOEs (p.burst), beams and already-dead shots never clash.
  tickProjectileClash(dt) {
    const E = window.Skills;
    const ps = this.projectiles;
    for (let i = 0; i < ps.length; i++) {
      const a = ps[i];
      if (a.life <= 0 || a.burst || a._clashImmune) continue;
      for (let j = i + 1; j < ps.length; j++) {
        const b = ps[j];
        if (b.life <= 0 || b.burst || b._clashImmune) continue;
        if (a.owner === b.owner) continue;                 // only cross-side shots clash
        if ((a.owner !== 'me' && a.owner !== 'wild') || (b.owner !== 'me' && b.owner !== 'wild')) continue;
        // BASICS DON'T CLASH: a held basic-attack shouldn't act as a free bullet-cancel
        // wall (playtest: that let a masher face zero incoming damage). Only real SKILL
        // shots wave-clash; basics fly through and must be dodged/out-spaced.
        if ((a.skill && a.skill.isBasic) || (b.skill && b.skill.isBasic)) continue;
        if (Math.hypot(a.x - b.x, a.y - b.y) > a.r + b.r + 4) continue;
        // clash power, tilted by element advantage of each shot over the other
        const ael = (a.skill && a.skill.element) || a.element || 'light';
        const bel = (b.skill && b.skill.element) || b.element || 'light';
        const aEff = E && E.effectiveness ? E.effectiveness(ael, bel) : 1;
        const bEff = E && E.effectiveness ? E.effectiveness(bel, ael) : 1;
        const aPow = a.dmg * a.r * aEff;
        const bPow = b.dmg * b.r * bEff;
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        this.vfx.shockwave(mx, my, '#fff');
        this.vfx.burst(mx, my, { count: 8, color: a.color, speed: 150, life: 0.3, r: 2 });
        this.vfx.burst(mx, my, { count: 8, color: b.color, speed: 150, life: 0.3, r: 2 });
        window.MorrowwishAudio?.note?.(520);
        const ratio = aPow / Math.max(1e-3, bPow);
        if (ratio > 1.3) {                                  // a overpowers b
          b.life = 0; a.dmg *= 0.6; a.r = Math.max(4, a.r * 0.8);
        } else if (ratio < 1 / 1.3) {                       // b overpowers a
          a.life = 0; b.dmg *= 0.6; b.r = Math.max(4, b.r * 0.8);
          break;                                            // a is gone; stop pairing it
        } else {                                            // even → mutual cancel
          a.life = 0; b.life = 0;
          break;
        }
      }
    }
  }
  spawnBurst(x,y,_symbol,color,n){
    // Energy dissipates as physical impact sparks, never floating emoji stickers.
    this.vfx.burst(x,y,{count:n||12,color:color||'#ffd36b',speed:150,life:.45,r:3});
  }
  floater(x,y,text,color,size,prio){
    // Cap on-screen numerals. When full, drop the oldest NON-priority entry first so
    // important numbers (damage taken on YOUR cats — incl. allies) are never shifted
    // out by the active cat's own outgoing-damage spam. (Ally hits showed no number.)
    const CAP=8;
    if(this.floaters.length>=CAP){
      let i=this.floaters.findIndex(fl=>!fl.prio);
      this.floaters.splice(i<0?0:i,1);
    }
    this.floaters.push({x,y,text,color,life:.62,max:.62,
      size:Math.min(22,size||12),prio:!!prio});
  }

  // Persistent animated strokes make each elemental spell recognizable in motion.
  // Draw channeled beams (水枪/flamethrower): a glowing tapered stream from the
  // caster to its reach, with a wavering core so it reads as a live spray.
  // Lingering elemental ground zones (Terraformer): a soft pulsing puddle/patch so
  // the player can see where a reaction can be set up and detonated.
  drawFields(ctx){
    for(const fld of this.fields){
      const k=Math.max(0,fld.t/fld.max), pulse=0.5+0.5*Math.sin(this.t*4);
      ctx.save();
      ctx.globalAlpha=0.16*k+0.06*pulse*k;
      ctx.fillStyle=fld.col;
      ctx.beginPath(); ctx.ellipse(fld.x,fld.y+6,fld.r,fld.r*0.5,0,0,Math.PI*2); ctx.fill();
      ctx.globalAlpha=0.4*k; ctx.strokeStyle=fld.col; ctx.lineWidth=2;
      ctx.setLineDash([6,6]); ctx.lineDashOffset=-(this.t*30)%12;
      ctx.beginPath(); ctx.ellipse(fld.x,fld.y+6,fld.r,fld.r*0.5,0,0,Math.PI*2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  }
  drawBeams(ctx){
    for(const b of this.beams){
      if(b._ox==null)continue;
      const k=Math.max(0,b.t/b.max);
      if(b.sk?.id==='thunderStream'){
        ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
        for(const [w,color,a] of [[12,'#4756ae',.37],[5,'#aecbff',.86],[2,'#fff1b4',.97]]){
          ctx.lineWidth=w;ctx.strokeStyle=color;ctx.globalAlpha=a*k;ctx.beginPath();
          ctx.moveTo(b._ox,b._oy);
          const nx=b._ey-b._oy,ny=-(b._ex-b._ox),len=Math.hypot(nx,ny)||1;
          for(let j=1;j<=13;j++){
            const u=j/13,off=(Math.sin(j*31.7+Math.floor(this.t*24)*7.1))*9*(1-u*.4);
            ctx.lineTo(b._ox+(b._ex-b._ox)*u+nx/len*off,
              b._oy+(b._ey-b._oy)*u+ny/len*off);
          }
          ctx.stroke();
        }
        // Small forks peel away from the main electrical trunk; they remain
        // subordinate to the actual attack line and never cover the screen.
        const vx=b._ex-b._ox,vy=b._ey-b._oy,mag=Math.hypot(vx,vy)||1;
        const px=-vy/mag,py=vx/mag;
        ctx.strokeStyle='#fff4c2';ctx.lineWidth=1.5;ctx.globalAlpha=.66*k;
        for(let j=2;j<=9;j+=3){
          const u=j/12,sign=j%2?1:-1,
            tx=b._ox+vx*u,ty=b._oy+vy*u;
          ctx.beginPath();ctx.moveTo(tx,ty);
          ctx.lineTo(tx+px*sign*12+vx/mag*5,ty+py*sign*12+vy/mag*5);
          ctx.lineTo(tx+px*sign*21+vx/mag*10,ty+py*sign*21+vy/mag*10);
          ctx.stroke();
        }
        ctx.restore();continue;
      }
      if(b.sk?.id==='flameSweep'){
        // A true SHORT-RANGE THREE-PASS FIRE FAN. Two warm outer flames, a
        // narrower white-hot core, travelling tongues and glowing embers;
        // follow b.aim so the cat visibly sweeps its head LEFT↔RIGHT.
        // Never fill the viewport or extend beyond the real 156px hit reach.
        const angle=b.aim,dx=Math.cos(angle),dy=Math.sin(angle),
          nx=-dy,ny=dx,originX=b._ox,originY=b._oy;
        const length=Math.min(160,Math.hypot(b._ex-originX,b._ey-originY));
        ctx.save();ctx.globalCompositeOperation='source-over';ctx.lineCap='round';
        const fan=ctx.createLinearGradient(originX,originY,b._ex,b._ey);
        fan.addColorStop(0,'rgba(211,66,38,.72)');
        fan.addColorStop(.5,'rgba(255,126,56,.64)');
        fan.addColorStop(1,'rgba(255,210,115,.08)');
        // Two shifting exterior contours read as a sheet of fire, rather
        // than eleven disconnected orange coins.
        ctx.fillStyle=fan;ctx.globalAlpha=.77*k;ctx.beginPath();
        const seg=16;
        // Trace nozzle→tip on one side, tip→nozzle on the other:
        // the old forward-forward edges formed a self-intersecting fan.
        for(let side of [-1,1]){
          for(let step=0;step<=seg;step++){
            const j=side===-1?step:seg-step,u=j/seg,
              w=(5+u*24)*(1-.25*u),
              wob=Math.sin(this.t*24+u*15+side)*5*u,
              x=originX+dx*length*u+nx*side*(w+wob),
              y=originY+dy*length*u+ny*side*(w+wob);
            if(side===-1&&step===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
          }
        }
        ctx.closePath();ctx.fill();
        ctx.globalCompositeOperation='lighter';
        for(let j=0;j<18;j++){
          const u=(j+.25)/18,dist=u*length,
            sway=Math.sin(this.t*26+j*2.3)*(.8+u*12),
            x=originX+dx*dist+nx*sway,
            y=originY+dy*dist+ny*sway,r=(5+u*21)*(1+.13*Math.sin(this.t*18+j));
          ctx.globalAlpha=k*(.34+.28*(1-u));
          ctx.fillStyle=j%4===0?'#fff5bc':j%3===0?'#ffcb71':'#f87335';
          ctx.beginPath();ctx.ellipse(x,y,r*1.05,r*.43,angle,0,Math.PI*2);ctx.fill();
          if(j%3===0){
            ctx.strokeStyle='#fff3c0';ctx.lineWidth=1.5;
            const bx=x+dx*r*.7,by=y+dy*r*.7;
            ctx.globalAlpha=.52*k;ctx.beginPath();ctx.moveTo(bx,by);
            ctx.lineTo(bx+dx*(11+u*9)+nx*6,by+dy*(11+u*9)+ny*6);ctx.stroke();
          }
        }
        // White-hot throat at the muzzle; helps follow the sweeping motion.
        ctx.globalAlpha=.77*k;ctx.fillStyle='#fff0b1';
        ctx.beginPath();ctx.ellipse(originX+dx*10,originY+dy*10,10,5,angle,0,Math.PI*2);ctx.fill();
        ctx.restore();continue;
      }
      // Additive gradient stream (VFX research): overlaps sum to white, a prism
      // gradient flows along the axis, a dashed inner core streams toward the target.
      const grad=ctx.createLinearGradient(b._ox,b._oy,b._ex,b._ey);
      grad.addColorStop(0,'#ffffff'); grad.addColorStop(0.35,b.col); grad.addColorStop(1,b.col);
      const nx=-(b._ey-b._oy), ny=(b._ex-b._ox), nl=Math.hypot(nx,ny)||1;
      ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.lineCap='round';
      for(const [w,a] of [[b.width*1.9,0.14*k],[b.width*1.0,0.3*k],[b.width*0.55,0.75*k]]){
        ctx.globalAlpha=a; ctx.lineWidth=w; ctx.strokeStyle=grad;
        ctx.beginPath(); ctx.moveTo(b._ox,b._oy);
        const seg=10;
        for(let i=1;i<=seg;i++){ const tt=i/seg; const mx=b._ox+(b._ex-b._ox)*tt, my=b._oy+(b._ey-b._oy)*tt;
          const wv=Math.sin(this.t*22+i)*4*(1-tt); ctx.lineTo(mx+nx/nl*wv,my+ny/nl*wv); }
        ctx.stroke();
      }
      // streaming dashed packets
      ctx.globalAlpha=0.85*k; ctx.lineWidth=b.width*0.3; ctx.strokeStyle='#fff';
      ctx.setLineDash([14,10]); ctx.lineDashOffset=-(this.t*180)%24;
      ctx.beginPath(); ctx.moveTo(b._ox,b._oy); ctx.lineTo(b._ex,b._ey); ctx.stroke(); ctx.setLineDash([]);
      // white-hot nozzle
      ctx.globalAlpha=k; ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(b._ox,b._oy,b.width*0.4,0,Math.PI*2); ctx.fill();
      ctx.restore();
    }
  }
  // Six distinct tiny motifs, drawn BELOW fighters so no face is covered.
  // Fire = warm flame, water = drop, grass = leaf, electric = zigzag,
  // shadow = crescent, light = four-point star. No generic full-screen flash.
  drawRegularSkillAccent(ctx,v,k,p){
    const scale=v.isBasic?.72:1,hit=!!v.hit;
    const color={
      fire:'#f9ad73',water:'#88d9f0',grass:'#a7d39b',
      elec:'#f4d676',dark:'#c5a8e8',light:'#ffe8a0'
    }[v.element]||'#f6d2dc';
    ctx.save();ctx.translate(v.x,v.y);if(!hit)ctx.rotate(v.angle);
    ctx.globalAlpha*=Math.min(1,k*1.6);
    const rad=(hit?10:8)+p*(hit?24:25)*scale;
    ctx.strokeStyle=color;ctx.lineWidth=(hit?3.4:2.4)*scale*k+0.5;
    ctx.beginPath();ctx.arc(0,0,rad,-.85,2.25);ctx.stroke();
    // Tiny neutral rim creates readability over any pastel map.
    ctx.strokeStyle='#fffdf5';ctx.lineWidth=1.4*scale*k;
    ctx.beginPath();ctx.arc(0,0,Math.max(3,rad-4),-.65,1.8);ctx.stroke();
    const n=v.isBasic?3:5;
    for(let i=0;i<n;i++){
      const a=i*Math.PI*2/n+p*(hit?1.15:.75);
      const dist=(hit?8:12)+p*(hit?21:24)*scale;
      ctx.save();ctx.translate(Math.cos(a)*dist,Math.sin(a)*dist);
      ctx.rotate(a+.25+p*.5);
      ctx.fillStyle=color;ctx.strokeStyle=color;ctx.lineWidth=2*scale;
      if(v.element==='fire'){
        ctx.beginPath();ctx.moveTo(0,-6*scale);
        ctx.quadraticCurveTo(6*scale,-1*scale,2*scale,4*scale);
        ctx.quadraticCurveTo(-6*scale,3*scale,0,-6*scale);ctx.fill();
        ctx.fillStyle='#fff0cb';ctx.beginPath();ctx.ellipse(0,1*scale,1.5*scale,2*scale,0,0,Math.PI*2);ctx.fill();
      }else if(v.element==='water'){
        ctx.beginPath();ctx.moveTo(0,-7*scale);
        ctx.bezierCurveTo(6*scale,-1*scale,6*scale,5*scale,0,5*scale);
        ctx.bezierCurveTo(-6*scale,5*scale,-6*scale,-1*scale,0,-7*scale);
        ctx.fill();ctx.fillStyle='#f6fdff';
        ctx.beginPath();ctx.arc(-1*scale,1*scale,1.3*scale,0,Math.PI*2);ctx.fill();
      }else if(v.element==='grass'){
        ctx.beginPath();ctx.ellipse(1*scale,-1*scale,6*scale,3.1*scale,-.65,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='#fff7dd';ctx.lineWidth=1*scale;
        ctx.beginPath();ctx.moveTo(-3*scale,3*scale);ctx.lineTo(5*scale,-5*scale);ctx.stroke();
      }else if(v.element==='elec'){
        ctx.beginPath();ctx.moveTo(-3*scale,-6*scale);ctx.lineTo(2*scale,-2*scale);
        ctx.lineTo(-1*scale,2*scale);ctx.lineTo(4*scale,6*scale);ctx.stroke();
        ctx.strokeStyle='#fff7ce';ctx.lineWidth=1*scale;ctx.beginPath();
        ctx.moveTo(-1*scale,-5*scale);ctx.lineTo(3*scale,-2*scale);ctx.stroke();
      }else if(v.element==='dark'){
        ctx.strokeStyle=color;ctx.lineWidth=3*scale;ctx.beginPath();
        ctx.arc(0,0,5.5*scale,-1.55,1.55);ctx.stroke();
        ctx.fillStyle='#f4dfed';ctx.beginPath();ctx.arc(2*scale,-4*scale,1*scale,0,Math.PI*2);ctx.fill();
      }else{
        ctx.beginPath();ctx.moveTo(0,-7*scale);ctx.lineTo(2.2*scale,-2.2*scale);
        ctx.lineTo(7*scale,0);ctx.lineTo(2.2*scale,2.2*scale);
        ctx.lineTo(0,7*scale);ctx.lineTo(-2.2*scale,2.2*scale);
        ctx.lineTo(-7*scale,0);ctx.lineTo(-2.2*scale,-2.2*scale);ctx.closePath();ctx.fill();
        ctx.fillStyle='#fffdf2';ctx.beginPath();ctx.arc(0,0,1.6*scale,0,Math.PI*2);ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  drawSkillStrokes(ctx){
    for(const v of this.skillStrokes){
      const k=Math.max(0,v.life/v.max),p=1-k;
      ctx.save();ctx.globalAlpha=Math.min(1,k*.95);
      ctx.lineCap='round';ctx.lineJoin='round';
      if(v.kind==='signatureCast'||v.kind==='signatureHit'){
        window.CatBondSkillFX?.draw(ctx,v,this.t);
      }else if(v.kind==='regularAccent'){
        this.drawRegularSkillAccent(ctx,v,k,p);
      }else if(v.kind==='water'||v.kind==='ice'||v.kind==='prism'||v.kind==='lightning'){
        const dx=v.x2-v.x,dy=v.y2-v.y,len=Math.hypot(dx,dy)||1;
        const nx=-dy/len,ny=dx/len;
        const colors=v.kind==='water'?['#d4fdff','#61d3f7','#f4ffff']:
          v.kind==='ice'?['#d7f7ff','#8dcced','#f7ffff']:v.kind==='prism'?['#fef3b1','#eab1ff','#bff9ff']:['#e9d6ff','#fbecb1','#b1dfff'];
        for(let layer=0;layer<3;layer++){
          ctx.strokeStyle=colors[layer];ctx.lineWidth=(v.kind==='water'?17:9)-layer*3;
          ctx.beginPath();ctx.moveTo(v.x,v.y);
          const seg=18;
          for(let i=1;i<=seg;i++){
            const t=i/seg,x=v.x+dx*t,y=v.y+dy*t;
            const amp=v.kind==='water'?8:v.kind==='lightning'?12:3;
            const wave=Math.sin(t*(v.kind==='lightning'?53:20)+this.t*22+layer*2)*amp*k;
            ctx.lineTo(x+nx*wave,y+ny*wave);
          }ctx.stroke();
        }
      }else if(v.kind==='clawSlash'){
        ctx.translate(v.x,v.y);ctx.rotate(v.angle);
        for(let i=-1;i<=1;i++){
          ctx.strokeStyle=i===0?'#fffbe6':v.color;ctx.lineWidth=8-i*i*1.5;
          ctx.beginPath();ctx.arc(24,0,56+i*6,-.95+p*.5,.9+p*.5);ctx.stroke();
        }
      }else if(v.kind==='fireBurst'){
        ctx.strokeStyle=v.color;ctx.lineWidth=11*k;
        ctx.beginPath();ctx.arc(v.x,v.y,15+p*112,0,Math.PI*2);ctx.stroke();
        for(let i=0;i<12;i++){
          const ang=i*Math.PI/6,rad=22+p*105;
          ctx.fillStyle=i%2?'#ff7f38':'#ffe29a';
          ctx.beginPath();ctx.arc(v.x+Math.cos(ang)*rad,v.y+Math.sin(ang)*rad,5*k+1,0,Math.PI*2);ctx.fill();
        }
      }else if(v.kind==='giantSlam'){
        // 泰山压顶 — MOUNTAIN-GIANT BOULDER THROW: a huge craggy rock is hurled in
        // from above-left, spins down along an arc, and SLAMS the target with a dust
        // shock + flying debris + a cracked crater. (No translucent cat.)
        const drop=p<0.5?(p/0.5):1;                      // 0→1 descent along the throw arc
        const landed=p>=0.5;
        // arc: comes from up-and-left, lands on the target
        const sx=v.x-230, sy=v.y-300;
        const bx=sx+(v.x-sx)*drop, by=sy+(v.y-sy)*drop - Math.sin(drop*Math.PI)*40; // slight lob
        const R=46;
        // motion streak behind the incoming rock
        if(!landed){
          ctx.save();ctx.globalAlpha=k*0.5;ctx.strokeStyle='#b7a893';ctx.lineWidth=R*1.1;ctx.lineCap='round';
          ctx.beginPath();ctx.moveTo(bx-(v.x-sx)*0.12,by-(v.y-sy)*0.12);ctx.lineTo(bx,by);ctx.stroke();ctx.restore();
        }
        if(!landed){
          // the boulder: a lumpy dark-rock polygon, spinning as it falls
          ctx.save();ctx.translate(bx,by);ctx.rotate(drop*5.5);
          ctx.globalAlpha=Math.min(1,k*1.3);
          const rock=ctx.createRadialGradient(-R*0.3,-R*0.3,R*0.2,0,0,R);
          rock.addColorStop(0,'#8d8275');rock.addColorStop(1,'#4b4038');
          ctx.fillStyle=rock;ctx.strokeStyle='#2f2823';ctx.lineWidth=3;
          ctx.beginPath();
          const facets=9;
          for(let i=0;i<facets;i++){const a=i/facets*Math.PI*2;const rr=R*(0.82+0.22*Math.sin(i*2.3));
            const px=Math.cos(a)*rr,py=Math.sin(a)*rr;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}
          ctx.closePath();ctx.fill();ctx.stroke();
          // a couple of cracks/facets for craggy read
          ctx.globalAlpha=k*0.5;ctx.strokeStyle='#2f2823';ctx.lineWidth=2;
          ctx.beginPath();ctx.moveTo(-R*0.4,-R*0.2);ctx.lineTo(R*0.1,R*0.1);ctx.lineTo(R*0.5,-R*0.1);ctx.stroke();
          ctx.restore();
        }else{
          // IMPACT: cracked crater + dust shock ring + flying rock debris
          const ip=(p-0.5)/0.5;                          // 0→1 after landing
          ctx.save();ctx.translate(v.x,v.y);
          // dust shock ring
          ctx.globalAlpha=k*0.9;ctx.strokeStyle='#d8c9b0';ctx.lineWidth=7*k;
          ctx.beginPath();ctx.arc(0,0,30+ip*150,0,Math.PI*2);ctx.stroke();
          ctx.globalAlpha=k*0.6;ctx.strokeStyle='#fff';ctx.lineWidth=3*k;
          ctx.beginPath();ctx.arc(0,0,20+ip*120,0,Math.PI*2);ctx.stroke();
          // cracked crater lines radiating out
          ctx.globalAlpha=k*0.7;ctx.strokeStyle='#3a322b';ctx.lineWidth=3;
          for(let i=0;i<8;i++){const a=i*Math.PI/4+0.3;const r0=12,r1=24+ip*34;
            ctx.beginPath();ctx.moveTo(Math.cos(a)*r0,Math.sin(a)*r0);ctx.lineTo(Math.cos(a)*r1,Math.sin(a)*r1);ctx.stroke();}
          // flying debris chunks
          ctx.globalAlpha=k;ctx.fillStyle='#6a5e4f';
          for(let i=0;i<10;i++){const a=i*0.63;const d=30+ip*120;const s=4*k+1.5;
            ctx.beginPath();ctx.arc(Math.cos(a)*d,Math.sin(a)*d-ip*30,s,0,Math.PI*2);ctx.fill();}
          ctx.restore();
        }
      }else if(v.kind==='duoImpact'){
        // Continue the same one-of-21 magical signature seen in the cut-in.
        // Previously every combo finished with the same three diagonal scratches.
        const key=v.elements||'fire+fire';
        ctx.save();ctx.translate(v.x,v.y);
        const radius=30+p*94;
        const glow=ctx.createRadialGradient(0,0,1,0,0,radius);
        glow.addColorStop(0,(v.firstColor||'#ffeaba')+'99');
        glow.addColorStop(1,(v.secondColor||'#bbe9ff')+'00');
        ctx.fillStyle=glow;ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.fill();
        if(window.CatBondDuoFinale?.draw){
          const size=Math.max(145,Math.min(215,160+p*80));
          ctx.save();ctx.translate(-size/2,-size*.37);
          ctx.globalAlpha=Math.max(.18,Math.min(.75,k*.65));
          window.CatBondDuoFinale.draw(ctx,size,size*.76,.17+.53*p,key,2);
          ctx.restore();
        }else{
          ctx.strokeStyle=v.firstColor||'#ffeabc';ctx.lineWidth=6*k;
          ctx.beginPath();ctx.arc(0,0,radius*.65,0,Math.PI*2);ctx.stroke();
        }
        ctx.restore();
      }else if(v.kind==='furStorm'){
        const spins=7;
        ctx.save();ctx.translate(v.x,v.y);ctx.rotate(p*2.4);
        // snappier expansion: ease-out so it bursts wide fast, then eases (was linear *180)
        const ease=1-(1-p)*(1-p);
        for(let i=0;i<spins;i++){
          const ang=i*Math.PI*2/spins+this.t*5,rad=24+ease*300;
          ctx.save();ctx.rotate(ang);ctx.translate(rad,0);ctx.rotate(ang);
          for(let claw=-1;claw<=1;claw++){
            ctx.strokeStyle=claw?'#d5a37d':'#fff9e4';ctx.lineWidth=(claw?3.7:5)*k;
            ctx.beginPath();ctx.moveTo(-17,-13+claw*9);
            ctx.quadraticCurveTo(0,0+claw*9,18,11+claw*9);ctx.stroke();
          }
          ctx.restore();
        }
        ctx.restore();
      }else if(v.kind==='ultimate'){
        window.CatBondUltVFX?.draw(ctx,v,this.W,this.H,this.t,'back');
      }
      ctx.restore();
    }
  }

  // Real contact often passes the TARGET's impact point as (fx,fy).
  // Deriving knockback from target - impact point then gives (0,0), so
  // recoil/shake look broken despite hitstop and burst VFX working.
  // Fall back to the nearest genuine attacker, never a random direction.
  hitNormal(target,fx,fy,attackerSide='me'){
    let dx=target.x-fx,dy=target.y-fy,dist=Math.hypot(dx,dy);
    if(dist<1){
      const pool=attackerSide==='wild'?this.liveEnemies():this.team;
      const attackers=(pool||[]).filter(c=>c&&c.alive&&c!==target);
      let nearest=null,nearDist=Infinity;
      for(const actor of attackers){
        const dd=Math.hypot(target.x-actor.x,target.y-actor.y);
        if(dd<nearDist){nearDist=dd;nearest=actor;}
      }
      if(nearest){dx=target.x-nearest.x;dy=target.y-nearest.y;dist=Math.hypot(dx,dy);}
    }
    if(dist<1){
      // Exact same center (spawn-overlap): follow the player's facing rather
      // than silently suppressing the contact force.
      const angle=attackerSide==='me'?(this.aim||0):Math.PI;
      dx=Math.cos(angle);dy=Math.sin(angle);dist=1;
    }
    return {x:dx/dist,y:dy/dist,angle:Math.atan2(dy,dx)};
  }

  // HIT-FEEL: add camera trauma (0..1 clamp) with an optional hit-normal direction
  // so the first shake frames kick along the blow. mag ~0.15 basic / 0.35 skill /
  // 0.7 stagger-ult. Also keeps shakeT alive for any legacy reader.
  addShake(mag, aim) {
    this.shakeTrauma = Math.min(1, this.shakeTrauma + mag);
    if (aim != null) { this.shakeDirX = -Math.cos(aim); this.shakeDirY = -Math.sin(aim); }
    this.shakeT = Math.max(this.shakeT, mag * 0.3);
  }

  // ---------------- update ----------------
  update(dt) {
    if (this.done) return;
    const realDt = dt;                 // unscaled frame time for cinematic timers
    if(this.coach)this.coachSeconds+=dt;
    this.ultCd=Math.max(0,this.ultCd-dt); // real frame time, before simulation slowdown
    // Global combat tempo: scale the whole simulation (movement, projectiles, enemy
    // AI, cooldowns) so fights read calmer and the cat isn't twitchy-fast. One knob,
    // everything stays proportional/balanced. 1 = old speed; 0.8 = 20% slower.
    dt *= 0.8;
    // Ultimate cinematic: the arena nearly freezes so the full-screen sequence
    // reads as a dramatic beat. Ticks on REAL dt (pre-freeze) so it always lasts 3s.
    if (this.ultCinematic) { this.tickUltCinematic(dt); dt *= 0.06; }
    else this.tickUltReminder(dt);     // re-arm "press R" + failsafe auto-cast (not during the cinematic)
    // perfect-dodge bullet-time: slow the WORLD but keep input responsive
    if (this.slowmo > 0) { this.slowmo -= dt; dt *= 0.35; }
    // HITSTOP: a true near-freeze of the SIMULATION (actors/projectiles/AI) on a solid
    // hit — the classic "weight" beat. Crucially the VFX layer keeps running at real
    // time (this._vfxDt below) so impact sparks SNAP outward *during* the freeze (the
    // freeze-then-pop that sells the punch). Never stacks on bullet-time.
    this._vfxDt = dt;                                   // real dt for the vfx layer
    // A short SLOW (not a dead freeze): 0.02 froze the player cat solid so it couldn't
    // nudge out of a follow-up during fast exchanges ("卡原地硬吃技能"). 0.12 keeps the
    // weighty beat but the cat can still inch/dodge; the per-hit `stop` is already brief.
    if (this.hitstop > 0 && this.slowmo <= 0) { this.hitstop = Math.max(0, this.hitstop - dt); dt *= 0.12; }
    this.t += dt;
    this._lastDt = dt;                                  // shared by steering helpers (orbit/wander timers)
    if (this.coach) this.tickCoach(dt);                 // first-fight guided tutorial
    if (this.shakeT > 0) this.shakeT -= dt;
    if (this.shakeTrauma > 0) this.shakeTrauma = Math.max(0, this.shakeTrauma - 1.8 * dt);
    if (this.flash > 0) this.flash -= dt;
    if (this.comboFlash > 0) this.comboFlash -= dt;
    // 合体技 cut-in: the whole arena is HARD-FROZEN (nobody moves) while the splash
    // art plays. Ticks on REAL dt so it always lasts its full length regardless of
    // hitstop/slowmo. The damage payload is DEFERRED — it only fires at the art's
    // impact beat (splash shows → clears → THEN the attack lands), per design.
    if(this.duoCinematic){
      const v=this.duoCinematic;
      v.t=Math.max(0,v.t-realDt);
      const age=v.max-v.t;
      // Before the strike beat the whole arena is HARD-FROZEN (dt=0, nobody moves)
      // while the splash art plays. At the strike beat the deferred payload fires and
      // the sim un-freezes so the hit's shake/bursts actually animate in the revealed
      // arena — "先显示合体大图，然后消失，然后发出技能".
      if(age<v.strikeAt){dt=0;}
      else if(v.payload){const p=v.payload;v.payload=null;p();}
      if(v.t===0)this.duoCinematic=null;
    }
    // Capture beat: freeze the sim (realDt timer) so the warm "收服" moment reads.
    if (this.captureSeq) { this.tickCaptureSeq(realDt); dt = 0; }
    this.tickDuoField(dt);
    this.tickDeathRay(dt);
    if(this.duoRun){
      this.duoRun.age+=dt;
      if(this.duoRun.age>=this.duoRun.duration)this.duoRun=null;
    }
    for(const v of this.skillStrokes)v.life-=dt;
    this.skillStrokes=this.skillStrokes.filter(v=>v.life>0);
    if(this.duo){
      this.duoCd=Math.max(0,this.duoCd-dt);
      if([this.duo.a.uid,this.duo.b.uid].every(uid=>this.team.some(f=>f.alive&&f.cat.uid===uid)))
        this.duoCharge=Math.min(100,this.duoCharge+dt*3.2);   // bond resonance charges more slowly than a regular ultimate
    }
    // combo chain decays if you stop landing hits (需持续操作维持)
    if (this.comboT > 0) { this.comboT -= dt; if (this.comboT <= 0 && this.combo > 0) this.breakCombo(); }
    this.gainUlt(8 * dt);                  // passive charge; active combat charges faster

    this.readInput(dt);
    if(this.autoMode&&this.duoReady())this.castDuo();

    // tick player cooldowns & timers
    for (const f of this.team) {
      f.t = (f.t || 0) + dt;
      // apply + decay hit knockback on player cats too (boop when struck)
      if (f.kbx || f.kby) {
        f.x = clamp(f.x + f.kbx * dt, BATTLE_MARGIN.side, this.W - BATTLE_MARGIN.side);
        f.y = clamp(f.y + f.kby * dt, this.topMargin, this.H - this.bottomMargin);
        const kd = Math.exp(-6 * dt); f.kbx *= kd; f.kby *= kd;
        if (Math.abs(f.kbx) < 4 && Math.abs(f.kby) < 4) { f.kbx = 0; f.kby = 0; }
      }
      for (const k in f.cd) if (f.cd[k] > 0) f.cd[k] -= dt;
      if (f.inv > 0) f.inv -= dt;
      if (f.dashT > 0) f.dashT -= dt;
      else if(f.pounce){
        f.pounce=false;f._pounceSkill=null;f._pounceDmg=null;
        f._dashReach=null;f._dashTravel=0;
      }
      if (f.dodgeCd > 0) f.dodgeCd -= dt;
      // shieldT (barrier) now ticks in tickWards() below — shared by player + enemy so
      // neither side's barrier sticks forever. (Was double-counted here previously.)
      if (f.damageBoostT > 0) f.damageBoostT=Math.max(0,f.damageBoostT-dt);
      // 踩奶 Knead stacks decay together when the rhythm window lapses.
      if (f.kneadT > 0) { f.kneadT=Math.max(0,f.kneadT-dt); if(f.kneadT===0) f.kneadStacks=0; }
      // HoT regen from a `hot` heal (water template tweak): drip until the window lapses.
      if (f.hotT > 0) { f.hotT=Math.max(0,f.hotT-dt); if(f.alive&&f.hp<f.maxhp) f.hp=Math.min(f.maxhp,f.hp+(f.hotRate||0)*dt); }
      if (f.hasteT > 0) f.hasteT=Math.max(0,f.hasteT-dt);   // 静电舔毛 haste window (elec heal tweak)
      if (f._castSlow > 0) f._castSlow=Math.max(0,f._castSlow-dt);   // 后遗症 recovery
      // SAFETY: a root flag with no live cast/beam backing it would freeze the cat
      // forever (the "卡在原地没动" auto-battle bug). Self-heal any orphaned root.
      if (f._castRoot > 0 && !(this.pendingCasts||[]).some(c=>c.f===f)) f._castRoot = 0;
      if (f._beamRoot > 0 && !(this.beams||[]).some(b=>b.f===f)) f._beamRoot = 0;
      this.tickWards(f, dt);
      this.tickCatStatus(f, dt);              // DoT + soft-CC (slow) the enemy inflicted
      if (f.hitFlash > 0) f.hitFlash -= dt;
      const vdt2 = this._vfxDt != null ? this._vfxDt : dt;
      if (f.hitWhite > 0) f.hitWhite -= vdt2;
      if (f.hitSquash > 0) f.hitSquash = Math.max(0, f.hitSquash - vdt2 * 2.2);
      if (f._recoilX) f._recoilX *= Math.exp(-10 * vdt2);
      if (f._recoilY) f._recoilY *= Math.exp(-10 * vdt2);
    }
    // Retire a timed bond reinforcement when its window ends.
    if (this.reinforceT > 0) {
      this.reinforceT -= dt;
      if (this.reinforceT <= 0) this.retireReinforcement();
    }
    const me = this.me();

    // ALL your cats are on the field: you control the active one, allies auto-fight.
    for (const f of this.team) {
      if (!f.alive) continue;
      // 泰山压顶 leap travel: follow the arc from launch to landing, then slam
      if (f._leapT > 0) {
        f._leapT -= dt;
        const k = 1 - Math.max(0, f._leapT) / f._leapMax;             // 0→1 flight progress
        f.x = f._leapFrom.x + (f._leapTo.x - f._leapFrom.x) * k;
        f.y = f._leapFrom.y + (f._leapTo.y - f._leapFrom.y) * k;
        f._hop = Math.sin(k * Math.PI) * 58;                          // visual arc height (drawn as y-offset)
        if (f._leapT <= 0) this.leapLand(f);
      }
      // dash-pounce travel (active or ally)
      if (f.dashT > 0 && f.pounce) {
        const aim=f._dashAim!=null?f._dashAim:(f._aim||this.aim);
        const spd=f.speed*(f._pounceSkill?.kind==='dash'?3.2:3.6);
        const step=f._dashReach!=null?Math.min(spd*dt,
          Math.max(0,f._dashReach-(f._dashTravel||0))):spd*dt;
        const x0=f.x,y0=f.y;
        f.x=clamp(f.x+Math.cos(aim)*step,BATTLE_MARGIN.side,this.W-BATTLE_MARGIN.side);
        f.y=clamp(f.y+Math.sin(aim)*step,this.topMargin,this.H-this.bottomMargin);
        f._dashTravel=(f._dashTravel||0)+Math.hypot(f.x-x0,f.y-y0);
        if(f._dashReach!=null&&f._dashTravel>=f._dashReach-.01)f.dashT=0;
        // Short moving spark tail, unlike a beam held fixed to the origin.
        if(f._pounceSkill?.element==='elec')
          this.vfx.trail(f.x,f.y,'#ffe6a1',3);
      }
      // pounce contact damage on nearest enemy
      if (f.pounce) {
        const e = this.nearestEnemy(f.x, f.y);
        if (e && e.flash <= 0 && e.inv <= 0 && Math.hypot(f.x - e.x, f.y - e.y) < f.r + (e.r||18)*.6) {
          let dmg = (f._pounceDmg != null) ? f._pounceDmg : f.dmg * 1.6 * this.outgoingBuffMult(f);
          const contact=f._pounceSkill;
          // 暗影微调 backstab: a dash/pounce landing from behind the target hits harder.
          if(contact?.backstab){
            const facing=Math.atan2((e._vy||0),(e._vx||0));
            const fromBehind=Math.abs(((f._dashAim||0)-facing+Math.PI)%(Math.PI*2))<1.1;
            if(fromBehind||Math.random()<0.5) dmg*=contact.backstab;
          }
          this.resolveHit(e, 'me', contact||{element:f.element},dmg,e.x,e.y);
          // lifesteal/leech (grass melee / dark heal-type tweak): caster recovers a cut of it.
          const steal=contact&&(contact.lifesteal||contact.leech);
          if(steal&&f.alive) f.hp=Math.min(f.maxhp,f.hp+dmg*steal);
          // Electric pounces are physical lightning impacts, not distant rays.
          if(contact?.element==='elec'){
            this.vfx.burst(e.x,e.y,{count:this.game.isTouch?9:15,
              color:'#ffe29a',speed:150,life:.34,r:3.2});
            this.vfx.ring(e.x,e.y,{r0:9,vr:120,
              life:.25,color:'#8da8ef',width:4});
          }
          { const kb=260*(f._dashKnockMul||1); e.kbx=(e.kbx||0)+Math.cos(f._dashAim||0)*kb; e.kby=(e.kby||0)+Math.sin(f._dashAim||0)*kb; }  // knockback (×knockMul: water dash shoves harder)
          f.pounce=false;f._pounceDmg=null;f._pounceSkill=null;
          f._dashReach=null;f._dashTravel=0;f.dashT=0;
        }
      }
      // non-active alive cats fight through the shared adaptive planner
      if (f !== me) this.updateAllyAI(dt, f);
    }

    // ---- velocity sampler: team positions are final for this frame, so record a
    // smoothed velocity (EMA) the enemy AI's predictive aim can lead. Player vx/vy
    // were previously never written, so leadAngle was a no-op; this fixes that. ----
    for (const f of this.team) {
      if (!f.alive) continue;
      const nvx = (f.x - (f._px != null ? f._px : f.x)) / Math.max(dt, 1e-3);
      const nvy = (f.y - (f._py != null ? f._py : f.y)) / Math.max(dt, 1e-3);
      f._vx = lerp(f._vx || 0, nvx, 0.2); f._vy = lerp(f._vy || 0, nvy, 0.2);
      f._px = f.x; f._py = f.y;
    }
    // Enemies also get a smoothed velocity sample (from last frame's displacement,
    // since their AI hasn't moved them yet this frame) so the PLAYER's auto-aim can
    // intercept-lead them the same way the enemy leads the player.
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const nvx = (e.x - (e._px != null ? e._px : e.x)) / Math.max(dt, 1e-3);
      const nvy = (e.y - (e._py != null ? e._py : e.y)) / Math.max(dt, 1e-3);
      e._vx = lerp(e._vx || 0, nvx, 0.2); e._vy = lerp(e._vy || 0, nvy, 0.2);
      e._px = e.x; e._py = e.y;
    }
    // observe the player's preferred range (~4 Hz) for cross-battle habit learning
    if (this._obs) {
      this._obs.frames++;
      this._obs.rangeT = (this._obs.rangeT || 0) + dt;
      if (this._obs.rangeT >= 0.25) {
        this._obs.rangeT = 0;
        const am = this.me(), ne = am && this.nearestEnemy(am.x, am.y);
        if (am && ne) { this._obs.rangeSum += Math.hypot(ne.x - am.x, ne.y - am.y); this._obs.rangeN++; }
      }
    }

    // ---- each enemy in the pack runs its own AI (they coordinate; see updateEnemyAI) ----
    // Self-healing pack cast-lock: recompute from who is ACTUALLY telegraphing right
    // now. (The old manual counter leaked — if a telegraphing enemy was frozen or
    // died mid-windup it never released the lock, permanently stalling pack specials.)
    this._novaLock = this.liveEnemies().some(e => e.telegraph > 0) ? 1 : 0;
    // WITHIN-FIGHT ESCALATION (live rubber-band): if the squad is cruising near-full
    // HP after a few seconds, the wild cats "grow desperate" THIS fight — faster
    // fire, two can telegraph at once, less manual breathing room. Threat you feel
    // now, not a +10% statline next run. 0 → 1 as the stomp drags on.
    const teamHpFrac = this.team.reduce((n,f)=>n+Math.max(0,f.hp),0)/Math.max(1,this.team.reduce((n,f)=>n+f.maxhp,0));
    this._pressure = (!this.coach && this.t > 5 && teamHpFrac > 0.88 && !this._stalled)
      ? Math.min(1, (this._pressure || 0) + dt * 0.45) : Math.max(0, (this._pressure || 0) - dt * 0.5);
    // MASH-STALL teach + resolve: if the player keeps throwing ONLY basics while an
    // enemy sits pinned near the un-skilled mash floor (~<20% HP, not staggered), the
    // fight can't end from basics alone. Detect it, pulse a "use a skill" teach beat,
    // suspend the rubber-band so a confused player isn't punished, and hard-resolve
    // after a generous cap so it can never soft-lock into an infinite stalemate.
    if (!this.coach) {
      const pinned = this.liveEnemies().some(e => e.hp / e.maxhp < 0.2 && (e.staggerT || 0) <= 0);
      const onlyBasics = (this.t - (this._lastSkillT || -99)) > 3.5;   // no skill in a while
      if (pinned && onlyBasics && !this.autoMode) {
        this._stallT = (this._stallT || 0) + dt;
      } else { this._stallT = Math.max(0, (this._stallT || 0) - dt * 2); }
      this._stalled = this._stallT > 5;
      if (this._stalled) this._stallBanner = 1.2;         // drawn + pulses the skill buttons
      // Hard resolution: never let a fight run forever. ~70s is well past any real win.
      if (this.t > 70 && !this.done) { this._timeCapLoss = true; this.finish(false); }
    }
    // First-fight coach: while teaching move/attack/skill, enemies stand down so a
    // brand-new player can learn the controls without taking damage.
    const coachHold = this.coachHoldsEnemies();
    const vdt = this._vfxDt != null ? this._vfxDt : dt;   // hit-feel visuals run real-time
    for (const e of this.enemies) {
      if (e.flash > 0) e.flash -= dt;
      if (e.hitWhite > 0) e.hitWhite -= vdt;
      if (e.hitSquash > 0) e.hitSquash = Math.max(0, e.hitSquash - vdt * 2.2);
      if (e._recoilX) e._recoilX *= Math.exp(-10 * vdt);
      if (e._recoilY) e._recoilY *= Math.exp(-10 * vdt);
    }
    for (const e of this.liveEnemies()) {
      this.tickWards(e, dt);                           // protect/reflect/barrier timers
      if (e.wardCd > 0) e.wardCd -= dt;
      if (e.lobCd > 0) e.lobCd -= dt;                  // per-enemy AOE throttle
      if (e.smashCd > 0) e.smashCd -= dt;              // per-enemy must-dodge-heavy throttle
      // apply + decay hit knockback (independent of AI so even a frozen/casting enemy flies back)
      if (e.kbx || e.kby) {
        e.x = clamp(e.x + e.kbx * dt, BATTLE_MARGIN.side, this.W - BATTLE_MARGIN.side);
        e.y = clamp(e.y + e.kby * dt, this.topMargin, this.H - this.bottomMargin);
        const decay = Math.exp(-6 * dt); e.kbx *= decay; e.kby *= decay;   // slower = knockback reads over ~5-6 frames
        if (Math.abs(e.kbx) < 4 && Math.abs(e.kby) < 4) { e.kbx = 0; e.kby = 0; }
      }
      // CONTACT SWIPE: a wild cat that gets right on top of a cat claws it (short
      // cd), routed through resolveHit so dodge i-frames and shields fully negate.
      // Makes melee range genuinely dangerous — you can't just stand in the pack.
      if (e.swipeCd > 0) e.swipeCd -= dt;
      if (!coachHold && e.swipeCd <= 0) {
        for (const tf of this.team) {
          if (!tf.alive || tf.inv > 0) continue;
          if (Math.hypot(tf.x - e.x, tf.y - e.y) < (e.r || 20) + (tf.r || 20) + 8) {
            this.resolveHit(tf, 'wild', { element: e.element }, e.dmg * 0.9, (e.x + tf.x) / 2, (e.y + tf.y) / 2);
            e.swipeCd = 0.8; this.vfx.slash(tf.x, tf.y, Math.atan2(tf.y - e.y, tf.x - e.x), '#ff6b8a', 40, 0.9);
            break;
          }
        }
      }
      if (e.staggerT > 0) e.staggerT = Math.max(0, e.staggerT - dt); // 3s break window
      if (e._castSlow > 0) e._castSlow = Math.max(0, e._castSlow - dt);
      // Never regenerate partially damaged poise. ONLY a full break unlocks
      // recovery, and the stagger vulnerability must finish before any refill.
      if(e.poiseRecovering && e.staggerT<=0){
        // At the end of the 3s stagger, instantly refill and unlock another break.
        e.poise=e.poiseMax;e.poiseRecovering=false;
        e.poiseComboHits=0;e.poiseLastHitAt=-99;
      }
      const canAct = this.tickStatus(e, dt);          // DoT + CC; false = frozen this frame
      if (coachHold) { e.pose = 'idle'; e.telegraph = 0; }   // tutorial: hold fire
      else if (e.alive && canAct) this.updateEnemyAI(dt, e, me);
      else if (e.alive) { e.pose = 'idle'; e.telegraph = 0; }  // frozen: drop any windup, stand still
    }

    // ---- 对波: opposing projectiles clash mid-field (signature 羁绊之旅 feel) ----
    this.tickProjectileClash(dt);
    // ---- projectiles ----
    for (const p of this.projectiles) {
      // HOMING: steer toward the nearest valid target, capped turn rate, keep speed.
      if (p.homing) {
        const tgt = p.owner === 'me' ? this.nearestEnemy(p.x, p.y) : this.nearestEnemyTeamCat({ x: p.x, y: p.y });
        if (tgt) {
          const want = Math.atan2(tgt.y - p.y, tgt.x - p.x);
          let d = want - p.ang; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
          const turn = Math.max(-p.homing * dt, Math.min(p.homing * dt, d));
          p.ang += turn; p.vx = Math.cos(p.ang) * p.spd; p.vy = Math.sin(p.ang) * p.spd;
        }
      }
      const previousX=p.x,previousY=p.y;
      p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      // GROW: radius swells over flight for a widening hitbox / bigger area coverage.
      if (p.grow) { const age = 1 - Math.max(0, p.life) / (p.maxLife || 2.2); p.r = p.r0 * (1 + (p.grow - 1) * age); }
      // RIBBON TRAIL: keep a short position history; drawProjectiles renders it as an
      // additive tapered streak (wide/bright head → transparent tail) instead of the
      // old fading-dot string. (VFX research: additive tapered ribbon.)
      if (!p.burst) {
        p._hist = p._hist || [];
        p._hist.push(p.x, p.y);
        const maxPts = 9;
        if (p._hist.length > maxPts * 2) p._hist.splice(0, p._hist.length - maxPts * 2);
      }
      // A lobbed AOE flies OVER enemies to its landing point, then bursts (it does
      // not collide on contact). Show its target ring; detonate on arrival/expiry.
      if (p.burst) {
        this.vfx.ring(p.burst.tx, p.burst.ty, { r0: p.burst.r, vr: 0, life: 0.08, color: p.burst.col, width: 2 });
        if (p.life <= 0 || Math.hypot(p.x - p.burst.tx, p.y - p.burst.ty) < 16) { this.burstAt(p); p.life = 0; }
        continue;
      }
      // Intercept at the physical wall plane BEFORE the projectile reaches a
      // teammate. One mirror wall shields all cats standing behind its span.
      if(this.interceptWallProjectile(p,previousX,previousY))continue;
      if (p.owner === 'me') {
        for (const e of this.liveEnemies()) {
          if (e.flash <= 0 && e.inv <= 0 && Math.hypot(p.x - e.x, p.y - e.y) < p.r + 22) {
            if(p._volley){
              const count=p._volley.hitsByEnemy.get(e.i)||0;
              if(count>=p._volley.maxHitsPerEnemy){p.life=0;continue;}
              p._volley.hitsByEnemy.set(e.i,count+1);
            }
            const r = this.resolveHit(e, 'me', p.skill || { element: p.element }, p.dmg, p.x, p.y, p);
            if (r.reflected) break;            // bounced back — projectile lives, now enemy-owned
            if(p.kind==='lightningOrb'&&r.dealt>0){
              this.vfx.impact(p.x,p.y,'#ffe1a1');
              this.vfx.burst(p.x,p.y,{count:15,color:'#b6d5ff',
                speed:130,life:.28,r:2.5});
            }
            // fireball keeps its owner-authored area splash (routed through resolveHit)
            if (p.kind === 'fireball' && r.dealt > 0) {
              this.vfx.shockwave(p.x, p.y, '#ffc16e');
              this.vfx.burst(p.x, p.y, { count: 32, color: '#ffbf71', speed: 240, life: .55, r: 5 });
              this.skillStrokes.push({ kind: 'fireBurst', x: p.x, y: p.y, color: '#ffbd76', life: .45, max: .45 });
              for (const other of this.liveEnemies().slice()) {
                if (other === e || Math.hypot(other.x - p.x, other.y - p.y) > 105) continue;
                this.resolveHit(other, 'me', p.skill || { element: p.element }, p.dmg * .36, other.x, other.y);
              }
            }
            p.life = 0;                         // landed or blocked: consume it
            break;
          }
        }
      } else {
        // enemy shot hits ANY alive team cat it overlaps
        for (const tf of this.team) {
          if (!tf.alive || tf.inv > 0) continue;
          if (Math.hypot(p.x - tf.x, p.y - tf.y) < p.r + tf.r * 0.7) {
            const r = this.resolveHit(tf, 'wild', p.skill || { element: p.element }, p.dmg, p.x, p.y, p);
            if (r.reflected) break;
            p.life = 0;
            break;
          }
        }
      }
    }
    this.projectiles = this.projectiles.filter(p => p.life > 0 && p.x > -20 && p.x < this.W + 20 && p.y > -20 && p.y < this.H + 20);

    this.tickPendingCasts(dt);           // heavy-skill wind-up (前摇) before the cast fires
    this.tickBeams(dt);                  // channeled 水枪/flamethrower continuous damage
    this.tickFields(dt);                 // Terraformer elemental ground zones (drip + detonate)

    this.vfx.update(this._vfxDt != null ? this._vfxDt : dt);   // VFX run real-time so sparks pop DURING hitstop
    for (const q of this.particles) { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 60 * dt; q.life -= dt; }
    this.particles = this.particles.filter(q => q.life > 0);
    // Damage numbers pop while combat is in hitstop; they use real clock time
    // like sparks instead of stretching strangely during simulation slowmo.
    const floaterDt=this._vfxDt!=null?this._vfxDt:dt;
    for(const fl of this.floaters){fl.y-=40*floaterDt;fl.life-=floaterDt;}
    this.floaters = this.floaters.filter(fl => fl.life > 0);

    // win when the whole pack is down; "captureReady" when any enemy is low
    const live = this.liveEnemies();
    const wasReady = this.captureReady;
    this.captureReady = live.some(e => e.hp / e.maxhp < 0.28);
    // Finisher beat: the first frame a wild cat drops into capture range, punch a
    // brief slowmo + flash + banner so the "收服它！" moment actually lands (it used
    // to be a silent toast). Fires once per ready-transition, not every frame.
    if (this.captureReady && !wasReady) {
      this.slowmo = Math.max(this.slowmo, 0.4); this.flash = Math.max(this.flash, 0.3);
      this.shakeT = Math.max(this.shakeT, 0.15);
      const low = live.find(e => e.hp / e.maxhp < 0.28);
      if (low) this.vfx.ring(low.x, low.y, { r0: 10, vr: 420, life: 0.5, color: '#ffd36b', width: 7 });
      this._captureBanner = 1.2;
      window.MorrowwishAudio?.effect?.('ready');
    }
    if (this._captureBanner > 0) this._captureBanner -= dt;
    if (this._ultReadyBanner > 0) this._ultReadyBanner -= dt;
    if (this._ultResultBanner > 0) this._ultResultBanner -= dt;
    if (this._stallBanner > 0) this._stallBanner -= dt;
    const packN = this.enemies.length;
    // Each control scheme gets its own legible instruction. Mobile users
    // should never be told to use a mouse or Space key.
    const touch=!!this.game.isTouch;
    const english=window.MorrowwishI18n?.get?.()!=='zh';
    this.hint=this.autoMode
      ?(this._autoLastAction&&this.t-(this._autoLastAt||0)<2.5
        ?'🤖 智能自动 · '+this._autoLastAction
        :'🤖 智能自动 · 自动放技能、闪避、必杀 · 点击集火')
      :touch
        ?(this.captureReady
          ?(english?'Wild cat almost tamed! Keep attacking!':'野猫快被收服了！继续攻击！')
          :this.ult>=100
            ?(english?'Ultimate ready! Tap the cyclone button':'必杀技已准备好，点击旋风按钮')
            :(english?'Slide left to move · Hold right to attack · Tap Dodge'
              :'左侧滑动移动 · 右侧按住攻击 · 点击闪避'))
        :(this.captureReady?'野猫斗志快耗尽了，收服它！'
          :(this.ult>=100?'必杀能量已满！按 R 释放'
            :(packN>1?`野猫群 ${live.length}/${packN} 只 · 鼠标瞄准 · Q/E 技能`
              :'鼠标瞄准 · 左键猫爪 · Q/E 技能 · 空格闪避')));


    if(this.coach&&!this.autoMode){
      const step=this.coach.steps[this.coach.i];
      if(step)this.hint=english?step.en:step.zh;
    }
    // CAPTURE-not-KO moment (你不是打死它，是收服它): when the last wild cat's 斗志
    // empties, don't just win — play a brief capture beat (the cat stops fighting, a
    // warm ring + hearts pull it in) before finishing. tickCaptureSeq() calls finish.
    if (live.length === 0 && !this.done) {
      if (!this.captureSeq) this.startCaptureSeq();
    }
  }
  // Begin the warm capture sequence over the last downed wild cat.
  startCaptureSeq() {
    const e = this._lastDropped || this.enemies[this.enemies.length - 1];
    this.captureSeq = { t: 1.35, max: 1.35, x: e ? e.x : this.W / 2, y: e ? e.y : this.H / 2,
      sp: e ? e.sp : null, cat: e };
    if (e) { e.pose = 'idle'; e.captured = true; }     // it sits down, no longer hostile
    this.slowmo = Math.max(this.slowmo, 0.5);
    this.flash = Math.max(this.flash, 0.25);
    this.enemyProjectiles = [];                         // clear any darts still in the air
    window.MorrowwishAudio?.effect?.('capture');
  }
  // Tick the capture beat; warm ring + rising hearts, then finish(true).
  tickCaptureSeq(dt) {
    const s = this.captureSeq; if (!s) return;
    s.t = Math.max(0, s.t - dt);
    const age = s.max - s.t, k = age / s.max;
    // converging warm ring pulling the cat "home"
    if (Math.random() < dt * 14) this.vfx.ring(s.x, s.y, { r0: 44 * (1 - k) + 8, vr: -120, life: 0.4, color: '#ffd36b', width: 3 });
    if (Math.random() < dt * 9) this.spawnBurst(s.x + (Math.random() * 40 - 20), s.y - 10, '❤', '#ff9bb4', 1);
    if (s.t === 0) { this.captureSeq = null; window.MorrowwishAudio?.effect?.('combat_win'); this.finish(true); }
  }

  nearestEnemy(x, y) {
    let best = null, bd = 1e9;
    for (const e of this.liveEnemies()) { const d = Math.hypot(e.x - x, e.y - y); if (d < bd) { bd = d; best = e; } }
    return best;
  }
  // ---- soft target lock: the enemy the player is focusing ----
  // Keeps the same target across frames (hysteresis) so auto-aim doesn't thrash
  // as the pack orbits. Falls back to nearest when the lock dies or is unset.
  lockedEnemy() {
    if (this._lockIdx != null) { const e = this.liveEnemies().find(x => x.i === this._lockIdx); if (e) return e; this._lockIdx = null; }
    return null;
  }
  lockAt(x,y){
    if(this.autoMode)return false;
    const live=this.liveEnemies();
    let best=null,dist=1e9;
    for(const e of live){
      const d=Math.hypot(e.x-x,e.y-y);
      if(d<dist){dist=d;best=e;}
    }
    if(!best)return false;
    // Touch targets must be larger than a fingertip, even for tiny breeds.
    const radius=this.game.isTouch?Math.max(51,best.r?best.r+27:51):
      Math.max(36,best.r?best.r+20:45);
    if(dist>radius)return false;
    this._lockIdx=best.i;
    this.vfx.ring(best.x,best.y,{r0:12,vr:90,life:.33,color:'#f6d781',width:2});
    return true;
  }
  // Cycle the lock to the next live enemy (Tab on desktop, button on mobile).
  cycleTarget() {
    const live = this.liveEnemies();
    if (!live.length) { this._lockIdx = null; return; }
    let i = live.findIndex(e => e.i === this._lockIdx);
    const next = live[(i + 1) % live.length];
    this._lockIdx = next.i;
    this.vfx.ring(next.x, next.y, { r0: 10, vr: 260, life: 0.3, color: '#ffd36b', width: 3 });
  }
  // the enemy the player's aim/attacks target (nearest to aim direction from active cat)
  targetEnemy() {
    const f = this.me();
    const ax = Math.cos(this.aim), ay = Math.sin(this.aim);
    let best = null, bs = -1e9;
    for (const e of this.liveEnemies()) {
      const dx = e.x - f.x, dy = e.y - f.y, d = Math.hypot(dx, dy) || 1;
      const dot = (dx / d) * ax + (dy / d) * ay;             // alignment with aim
      const score = dot * 2 - d / 400;                        // prefer aligned + near
      if (score > bs) { bs = score; best = e; }
    }
    return best || this.nearestEnemy(f.x, f.y);
  }

  // Enemy preferred engagement band, from its ROLE and equipped skill kind — the
  // mirror of kitRangeBand for wild cats. Ambusher/melee-skill cats rush into a
  // small band; sharpshooters and ranged/beam skills kite at a wider band; others
  // hold a mid band. The learned favRange knob still crowds a kiter / kites a brawler
  // by sliding the band, and aggro pulls it slightly inward as the fight heats up.
  enemyRangeBand(e) {
    const sk = e.skill;
    const melee = sk && (sk.kind === 'melee' || sk.kind === 'dash' || sk.kind === 'leap' || sk.kind === 'pounce');
    const ranged = sk && (sk.kind === 'projectile' || sk.kind === 'beam' || sk.kind === 'aoe');
    let min, max;
    if (e.role === 'ambusher' || melee) { min = 40; max = 120; }        // rush into claw range
    else if (e.role === 'sharpshooter' || ranged) { min = 170; max = 250; }  // kite at range
    else { min = 120; max = 200; }                                      // skirmisher / elite mid band
    // aggro (1 − hp) pulls the band slightly inward as it gets desperate
    const pull = (e.aggro || 0) * 40; min = Math.max(32, min - pull); max = Math.max(min + 40, max - pull);
    // LEARNED: slide the band to attack the player's comfort zone (crowd a kiter / kite a brawler)
    if (this.aiP && this._aiConf) { const s = (0.5 - this.aiP.favRange) * 60 * this._aiConf; min = clamp(min + s, 32, 260); max = clamp(max + s, min + 40, 320); }
    return { min, max };
  }

  // ---- per-enemy AI with PACK COORDINATION ----
  // Coordination: enemies spread out (separation), surround the player from
  // different angles, and stagger their telegraphed specials so the player
  // always has a gap to dodge into (no simultaneous novas).
  updateEnemyAI(dt, e, meIgnored) {
    // target the nearest ALIVE team cat (so the enemy engages whoever's closest)
    let me = null, md = 1e9;
    for (const tf of this.team) { if (!tf.alive) continue; const d = Math.hypot(tf.x - e.x, tf.y - e.y); if (d < md) { md = d; me = tf; } }
    if(e._bondLureUntil>this.t)
      me=this.team.find(f=>f.alive&&f.cat.uid===e._bondLureUid)||me;
    if (!me) return;
    const dx = me.x - e.x, dy = me.y - e.y;
    if(e.reflectT>0)e._wallDesiredAngle=Math.atan2(dy,dx);
    const dist = Math.hypot(dx, dy) || 1;
    e.t += dt;
    e.face = dx < 0 ? -1 : 1;
    if (e.inv > 0) e.inv -= dt;
    if (e.dodgeCd > 0) e.dodgeCd -= dt;
    e.aggro = 1 - e.hp / e.maxhp;
    const hpFrac=e.hp/e.maxhp;
    // Elites visibly change behavior at half HP; SSR have a second last stand.
    const nextPhase=e.rIdx>=3&&hpFrac<.24?2:e.rIdx>=2&&hpFrac<.52?1:0;
    if(nextPhase>e.phase){
      e.phase=nextPhase;e.special=Math.min(e.special,.45);e.dodgeCd=0;
      this.vfx.ring(e.x,e.y,{r0:18,vr:540,life:.65,color:'#ffb370',width:7});
      this.vfx.burst(e.x,e.y,{count:17,color:'#ff9c82',speed:220,life:.6});
      const en=window.MorrowwishI18n?.get?.()!=='zh';
      this.game.toast(en?(e.sp.name+(nextPhase===2?' makes a final stand!':' changes tactics!'))
        :('⚠️ '+e.sp.name+(nextPhase===2?'进入最后反击！':'改变战术，开始反击！')));
    }

    // reactive dodge of the nearest incoming player shot
    let threat = null, threatT = 1e9;
    for (const p of this.projectiles) {
      if (p.owner !== 'me') continue;
      const rx = e.x - p.x, ry = e.y - p.y;
      const pv = Math.hypot(p.vx, p.vy) || 1;
      const t = (rx * p.vx + ry * p.vy) / (pv * pv);
      if (t < 0 || t > 0.5) continue;
      const cx = p.x + p.vx * t, cy = p.y + p.vy * t;
      if (Math.hypot(e.x - cx, e.y - cy) < 34 && t < threatT) { threat = p; threatT = t; }
    }
    let ax = 0, ay = 0;
    const reflectGuard=e.reflectT>0?this.reflectGuardDirection(e,me,'me'):null;
    if (reflectGuard) {
      ax=reflectGuard.x;ay=reflectGuard.y; // shield faces toward the player shot
    } else if (threat && e.dodgeCd <= 0) {
      const pv = Math.hypot(threat.vx, threat.vy) || 1;
      let nx = -threat.vy / pv, ny = threat.vx / pv;
      if ((e.x < this.W / 2) === (nx < 0)) { nx = -nx; ny = -ny; }
      ax = nx; ay = ny; e.dodgeCd = 0.5 - e.rIdx * 0.07; e.pose = 'play';
      if (e.rIdx >= 1) this.vfx.burst(e.x, e.y, { count: 3, color: '#cfe', speed: 120, life: 0.2 });
    } else if((e.role==='sharpshooter'||
         ['projectile','beam','chain'].includes(e.skill?.kind)) &&
         this.wallFlankVector(e,me,'wild')){
      const flank=this.wallFlankVector(e,me,'wild');
      ax=flank.x;ay=flank.y;
    } else {
      // KIT-AWARE, LESS-PREDICTABLE engagement. Each enemy has a preferred band from
      // its role/skill kind: an ambusher RUSHES into melee, a sharpshooter KITES at
      // range, others hold a mid band. We PURSUE when past the band, EVADE when inside
      // it, and STRAFE within it on a randomized orbit that periodically flips (with
      // occasional feints) — never the old fixed `this.t*0.4` circle. A persistent
      // wander + a per-enemy slot offset keep packmates from tracing the same arc.
      const band = this.enemyRangeBand(e);
      const dxp = me.x - e.x, dyp = me.y - e.y, dp = Math.hypot(dxp, dyp) || 1;
      const nx = dxp / dp, ny = dyp / dp;
      if (dp > band.max + 6) {                 // PURSUE: lead the target a touch so it actually closes
        const ps = e.speed * (1 + e.aggro * .4) || 150, tl = Math.min(1.2, dp / (ps + 1));
        const aimX = me.x + (me._vx || 0) * tl, aimY = me.y + (me._vy || 0) * tl;
        const gl = Math.hypot(aimX - e.x, aimY - e.y) || 1;
        ax = (aimX - e.x) / gl; ay = (aimY - e.y) / gl;
      } else if (dp < band.min - 6) {          // EVADE: back off to the band (kite)
        ax = -nx; ay = -ny;
      } else {                                 // STRAFE: orbit on a flipping sign + range-correction
        const dir = this.orbitSign(e, '_eorbit', dt);
        ax = -ny * dir; ay = nx * dir;
        const mid = (band.min + band.max) * 0.5, corr = clamp((dp - mid) / 110, -0.5, 0.5);
        ax += -nx * corr; ay += -ny * corr;
      }
      // persistent wander (organic drift) + small per-enemy slot bias so a pack spreads
      const w = this.wanderVec(e, '_ewander', dt);
      ax += w.x * 0.22; ay += w.y * 0.22;
      // separation from packmates (don't clump; sq-dist early-out)
      for (const o of this.liveEnemies()) {
        if (o === e) continue;
        const sx = e.x - o.x, sy = e.y - o.y, sd2 = sx * sx + sy * sy;
        if (sd2 < 4900 && sd2 > 1) { const sd = Math.sqrt(sd2); ax += (sx / sd) * 0.8; ay += (sy / sd) * 0.8; }
      }
    }
    // 束缚 bind ROOTS the enemy (no movement) but it can still aim + fire below.
    const spd=e.rooted?0:e.speed*(1+e.aggro*.4+e.phase*.16)*this.moveMul(e); // all slows, including reflect wall
    e.x = clamp(e.x + ax * spd * dt, BATTLE_MARGIN.side, this.W - BATTLE_MARGIN.side);
    e.y = clamp(e.y + ay * spd * dt, this.topMargin, this.H - this.bottomMargin);
    if (spd>0.001 && Math.hypot(ax,ay)>0.07) {
      e._moveFacing=Math.atan2(ay,ax);
      if(e.reflectT>0)e._wallDesiredAngle=Math.atan2(me.y-e.y,me.x-e.x);
    }
    if(Math.abs(ax)>.07)e.face=ax<0?-1:1;
    e.motion=(ax||ay)?Math.min(1,Math.hypot(ax,ay)):.05;
    e.stride=(e.stride||0)+dt*(6+spd*.052)*e.motion;
    if (e.pose !== 'play') e.pose = (ax || ay) ? 'walk' : 'idle';

    // ---- reactive ward: an enemy that's thinking defends itself (SR/SSR more often) ----
    if (e.wardCd <= 0 && e.rIdx >= 1 && !e.protectT && !e.reflectT && !(e.shieldT > 0.25)) {
      this.enemyMaybeWard(e, me, dist);
    }
    // telegraphed special (staggered: only ONE enemy telegraphs at a time, pack-wide)
    if (e.telegraph > 0) {
      // INTERRUPT: enough burst damage during a heavy windup CANCELS the cast and
      // staggers the enemy — the payoff for reading the telegraph and committing.
      if (e.castInterruptible && (e.castDmgTaken || 0) >= (e.castDmgBudget || Infinity)) {
        this.interruptEnemyCast(e);
        return;
      }
      e.telegraph -= dt;
      if (Math.random() < 0.5) this.vfx.burst(e.x, e.y, { count: 1, color: '#ff4d6d', speed: 40, life: 0.3 });
      if (e.telegraph <= 0) { this.unleashEnemySpecial(e, me); }   // lock auto-clears next frame (recomputed)
      return;
    }
    e.special -= dt;
    // Per-kind engagement: nova is a point-blank punish, pounce is an ambusher's
    // close leap, barrage is mid-range, AoE-lob reaches out. Pick the kind that
    // fits the CURRENT distance instead of casting from across the arena. Only one
    // enemy telegraphs at a time.
    // Under high within-fight pressure a SECOND enemy may telegraph at once.
    const lockCap = (this._pressure || 0) > 0.6 ? 2 : 1;
    if (e.special <= 0 && (this._novaLock || 0) < lockCap) {
      let kind = null;
      // MUST-DODGE HEAVY (重击): when the player is dominating — either across fights
      // (stompStreak) or cruising untouched within THIS fight (_pressure) — a wild cat
      // winds up a big, slow, UNBLOCKABLE smash on a clearly-drawn danger disc. Shields
      // only chip it; the answer is to physically leave the circle (dodge/move). This is
      // the defensive forcing function the combat lacked. Generous windup = a reaction
      // test, not a reflex check. Own cooldown so it never spams.
      // Fire in ORDINARY fights too (not just SR/SSR or a flawless streak), so the
      // one unavoidable dodge test isn't invisible to the exact player who mashes.
      // Gate on collection progress (catchCount) instead of rarity so true beginners
      // in their first couple fights are still spared. Lower _pressure trigger +
      // faster accrual mean a cruising player meets a "leave the circle" test early.
      const pastTutorial = (State.S.catchCount || 0) >= 2;
      const dominating = (this._stomp || 0) >= 0.3 || (this._pressure || 0) >= 0.35;
      if (pastTutorial && dominating && dist < 300 && (e.smashCd || 0) <= 0) kind = 'smash';
      else if (dist < 150 && (me.rootT > 0 || me.frozen || e.aggro > 0.4)) kind = 'nova';     // close + punish window
      else if (dist < 220 && e.role === 'ambusher' && (e.challenge || 0) > 0) kind = 'pounce';  // ambusher leap
      // Big-AOE lob is now rarer (30%, SR+ only) and on its own cooldown so the
      // screen isn't constantly full of ground bursts; mostly a focused barrage.
      else if (dist >= 130 && dist < 340) kind = (e.rIdx >= 1 && (e.lobCd||0) <= 0 && Math.random() < 0.3) ? 'lob' : 'barrage';
      else if (dist < 320) kind = 'barrage';
      if (kind) {
        if (kind === 'lob') e.lobCd = 7 + Math.random() * 3;                             // per-enemy AOE throttle
        if (kind === 'smash') {
          e.smashCd = 9 + Math.random() * 3;                                             // per-enemy heavy throttle
          // land the smash where the player IS NOW (predictive but generous) so there's
          // time to walk out of the telegraphed disc.
          e.smashTarget = { x: me.x, y: me.y };
        }
        e.special = Math.max(2.6, e.specialCd - e.aggro * 1.5) + Math.random();          // +recovery floor
        e.telegraphKind = kind;
        this._novaLock = 1;                                   // pack cast-lock: others keep basic-firing
        // the heavy winds up longer (readable) than ordinary specials
        e.telegraph = (kind === 'smash' ? 1.4 : Math.min(1.2, 0.8 + e.rIdx * 0.1)) * (this.aiReact || 1);
        e.telegraphMax = e.telegraph;
        // INTERRUPT WINDOW: the heavy casts (nova + smash) can be CANCELLED if you
        // burst the enemy hard enough during the windup — a read-and-punish, not just
        // a dodge. Budget ~22% of max HP of raw damage during the telegraph.
        e.castInterruptible = (kind === 'nova' || kind === 'smash');
        e.castDmgBudget = e.maxhp * 0.22;
        e.castDmgTaken = 0;
        e.telegraphAim = this.leadAngle(e, me, 300);          // predictive lead (see leadAngle)
        if (kind === 'nova') this.game.toast('⚠️ 野猫在蓄力大招！');
        else if (kind === 'smash') this.game.toast(window.MorrowwishI18n?.get?.()==='zh'?'⚠️ 重击来袭 — 离开红圈！':'⚠️ Heavy smash — leave the red circle!');
        return;
      }
    }

    // normal aimed fire — only within effective range, with a cadence floor so a
    // wounded enemy can't machine-gun. Predictively led.
    e.fireCd -= dt;
    if (e.fireCd <= 0 && dist < 340) {
      // Manual play is harder than letting the AI dodge for you, so give a human
      // pilot ~25% more breathing room between enemy shots (auto mode stays brisk).
      // Within-fight pressure tapers that ease away and speeds fire as a stomp drags.
      const manualEase = (this.autoMode ? 1 : 1.12) - (this._pressure || 0) * 0.3;
      e.fireCd = Math.max(0.38, e.fireRate * (1 - e.aggro * 0.35)) * (e.slowed ? 1.8 : 1) * manualEase;   // +floor; 感电降攻速
      // Lead at the ACTUAL projectile speed so the intercept solution matches flight.
      const shotSpeed = 200 + e.rIdx * 34;
      let lead = this.leadAngle(e, me, shotSpeed);
      if (e.blinded) lead += (Math.random() - 0.5) * 1.2;                    // 失明→乱射
      const wc = this.elemColor(e.element);
      const dd = e.dmg * (e.status && e.status.weaken ? 0.5 : 1);            // 虚弱→伤害减半
      this.spawnProj(e.x, e.y, lead, shotSpeed, dd, 'wild', wc, 7, 'ball');
      if (e.rIdx >= 2) {
        this.spawnProj(e.x, e.y, lead + 0.22, 192, dd * 0.8, 'wild', wc, 6, 'ball');
        this.spawnProj(e.x, e.y, lead - 0.22, 192, dd * 0.8, 'wild', wc, 6, 'ball');
      }
    }
  }

  // ---- TRUE INTERCEPT (first-order lead) --------------------------------------
  // Solve for the time t a projectile of speed s (fired now from the shooter) takes
  // to meet a target moving at constant velocity, then return the world point to aim
  // at. This is the standard quadratic:  |delta + vr*t| = s*t  →  a t² + b t + c = 0
  // with a = vr·vr − s², b = 2 vr·delta, c = delta·delta. We pick the smallest
  // positive root. If there's no solution (target outrunning the shot) we fall back
  // to the current position; if a≈0 (relative speed ≈ projectile speed) we use the
  // linear form t = c / −b. Cheap: a handful of mults, only run when actually firing.
  interceptPoint(shooter, target, projSpeed) {
    const dxp = target.x - shooter.x, dyp = target.y - shooter.y;
    const tvx = target._vx || 0, tvy = target._vy || 0;
    const svx = shooter._vx || 0, svy = shooter._vy || 0;
    const vrx = tvx - svx, vry = tvy - svy;
    const s = projSpeed || 300;
    const a = vrx * vrx + vry * vry - s * s;
    const b = 2 * (vrx * dxp + vry * dyp);
    const c = dxp * dxp + dyp * dyp;
    let t = -1;
    if (Math.abs(a) < 1e-3) {
      if (Math.abs(b) > 1e-6) t = -c / b;                 // linear fallback
    } else {
      const disc = b * b - 4 * a * c;
      if (disc >= 0) {
        const sq = Math.sqrt(disc);
        const t1 = (-b - sq) / (2 * a), t2 = (-b + sq) / (2 * a);
        // smallest strictly-positive root
        t = Math.min(t1 > 1e-4 ? t1 : Infinity, t2 > 1e-4 ? t2 : Infinity);
        if (!isFinite(t)) t = -1;
      }
    }
    if (t < 0 || t > 2.5) {                               // NO_SOLUTION / absurd → aim at current pos
      return { x: target.x, y: target.y, t: Math.max(0, Math.hypot(dxp, dyp) / s) };
    }
    return { x: target.x + tvx * t, y: target.y + tvy * t, t };
  }

  // Predictive aim: a TRUE intercept solution (interceptPoint), tempered by the
  // adaptive layer. aiLeadConf scales how much of the predicted lead is applied
  // (sloppier foes under-lead); the learned strafe bias nudges toward the side the
  // player habitually dodges; aiJitter adds speed-scaled aim error so fights read
  // human, not frame-perfect. s = shooter, me = target, projSpeed = shot speed.
  leadAngle(s, me, projSpeed) {
    const dx = me.x - s.x, dy = me.y - s.y;
    const lead = this.aiLeadConf != null ? this.aiLeadConf : 1;
    const ip = this.interceptPoint(s, me, projSpeed);
    // blend current→intercept by confidence (under-lead when the foe is "sloppy")
    let px = dx + (ip.x - me.x) * lead;
    let py = dy + (ip.y - me.y) * lead;
    const vmax = (me.speed || 150) * 0.6;
    if (this.aiP && this._aiConf) {                       // learned: bias toward the side they habitually strafe
      const perp = Math.atan2(dy, dx) + Math.PI / 2, k = this.aiP.dodgeDir * this._aiConf * vmax * 0.5;
      px += Math.cos(perp) * k; py += Math.sin(perp) * k;
    }
    let ang = Math.atan2(py, px);
    // Aim slop scales with the TARGET's PERPENDICULAR speed (how hard it is to hit),
    // not the player's profiled skill. A cat standing still gets shot near-dead-on
    // (punishes passivity); a juking player keeps the evasion payoff. err = base +
    // k·perpSpeed (rad), from aiJitter (~0.02 skilled → ~0.08 sloppy) and k~0.0004.
    if (this.aiJitter) {
      const dist = Math.hypot(dx, dy) || 1;
      const perpSpeed = Math.abs((me._vx || 0) * (-dy / dist) + (me._vy || 0) * (dx / dist));
      const err = this.aiJitter * 0.45 + 0.0004 * perpSpeed;   // base slop + speed-scaled term
      ang += (Math.random() * 2 - 1) * err;
    }
    return ang;
  }

  // Player-side auto aim: a TRUE intercept lead toward the target, kept deliberately
  // TIGHTER than the enemy's (a friendly autopilot should feel competent). Falls back
  // to straight-at-target when the shot can't catch up. Small bounded jitter keeps it
  // from being pixel-perfect, but far less than the enemy's aim error.
  autoAim(f, tgt, projSpeed) {
    if (!tgt) return f._aim || 0;
    const ps = projSpeed || f.projSpeed || 300;
    const ip = this.interceptPoint(f, tgt, ps);
    let ang = Math.atan2(ip.y - f.y, ip.x - f.x);
    ang += (Math.random() * 2 - 1) * 0.02;              // tight human micro-jitter
    return ang;
  }

  // Cancel a heavy enemy cast mid-windup (the player bursted it in time) and leave
  // the enemy staggered/open — the reward for reading and punishing the telegraph.
  interruptEnemyCast(e) {
    e.telegraph = 0; e.telegraphKind = null; e.castInterruptible = false;
    e.smashTarget = null;
    this.triggerStagger(e);                             // break poise and open 3s window
    e.special = Math.max(e.special, 1.4);                // brief recovery before it can try again
    this._novaLock = 0;                                  // free the pack cast-lock
    const en = window.MorrowwishI18n?.get?.() !== 'zh';
    this.vfx.ring(e.x, e.y, { r0: 10, vr: 420, life: 0.5, color: '#ffd36b', width: 6 });
    this.vfx.burst(e.x, e.y, { count: 14, color: '#ffd36b', speed: 220, life: 0.45, r: 3 });
    this.vfx.text(e.x, e.y - 46, en ? 'INTERRUPTED!' : '打断!', '#ffd36b', 16);
    this.shakeT = Math.max(this.shakeT, 0.22); this.hitstop = Math.max(this.hitstop, 0.07);
    window.MorrowwishAudio?.effect?.('crash');
    this.game.toast(en ? 'Cast interrupted!' : '蓄力被打断！');
  }

  unleashEnemySpecial(e, me) {
    // RE-CHECK the target at release: if it died or walked out of range, retarget
    // the nearest cat, and downgrade a now-pointless nova to an aimed barrage
    // rather than firing into empty space.
    if (!me || !me.alive) me = this.nearestEnemyTeamCat(e);
    if (!me) return;
    const dist = Math.hypot(me.x - e.x, me.y - e.y);
    if (e.telegraphKind === 'nova' && dist > 180) e.telegraphKind = 'barrage';   // too far for a self-burst
    const sk = e.skill;
    const col = sk ? this.elemColor(sk.element) : '#ff4d6d';
    const pow = sk ? sk.power : 0.9;
    const kindName = { nova: '猫猫怒涛', barrage: '连射', lob: '落雷', pounce: '猛扑' };
    // Enemy windup ring and projectile trajectory are the warning; do not flood the HUD.
    if (e.telegraphKind === 'pounce') {
      // ambusher leap — routed through resolveHit so cat shields still apply
      const aim = Math.atan2(me.y - e.y, me.x - e.x);
      this.vfx.beam(e.x, e.y, me.x, me.y, '#fb7c65');
      this.vfx.burst(e.x, e.y, { count: 12, color: col, speed: 200, life: .4 });
      const leap = Math.min(95, Math.hypot(me.x - e.x, me.y - e.y) * .42);
      e.x = clamp(e.x + Math.cos(aim) * leap, BATTLE_MARGIN.side, this.W - BATTLE_MARGIN.side);
      e.y = clamp(e.y + Math.sin(aim) * leap, this.topMargin, this.H - this.bottomMargin);
      for (const f of this.team.filter(f => f.alive)) {
        if (Math.hypot(f.x - e.x, f.y - e.y) < 95) this.resolveHit(f, 'wild', sk || { element: e.element }, e.dmg * 1.25, e.x, e.y);
      }
      return;
    }
    if (e.telegraphKind === 'smash') {
      // MUST-DODGE HEAVY: a big hit on the telegraphed disc. UNBLOCKABLE (shields only
      // chip it) but fully escapable — anyone still inside the circle at release eats a
      // punishing % of max HP; anyone who walked out (or dodged for i-frames) is safe.
      const tx = (e.smashTarget && e.smashTarget.x) || me.x, ty = (e.smashTarget && e.smashTarget.y) || me.y;
      const R = 86;
      this.vfx.shockwave(tx, ty, col);
      this.vfx.ring(tx, ty, { r0: 12, vr: R * 7, life: 0.4, color: col, width: 8 });
      this.vfx.ring(tx, ty, { r0: 20, vr: R * 5, life: 0.33, color: '#fff', width: 3 });
      this.vfx.burst(tx, ty, { count: this.game.isTouch ? 12 : 20, color: col, speed: 260, life: 0.5, r: 4, grav: 220 });
      this.shakeT = Math.max(this.shakeT, 0.28); this.hitstop = Math.max(this.hitstop, 0.05);
      window.MorrowwishAudio?.effect?.('crash');
      for (const f of this.team.filter(f => f.alive)) {
        if (Math.hypot(f.x - tx, f.y - ty) > R) continue;      // walked out of the circle → safe
        const heavy = Math.max(e.dmg * 1.6, f.maxhp * 0.26);   // a real, punishing hit
        this.resolveHit(f, 'wild', { element: e.element, unblockable: true }, heavy, tx, ty);
      }
      e.inv = 0.3; e._castSlow = 1.3;                          // 后遗症: the heavy leaves the caster open
      return;
    }
    if (e.telegraphKind === 'nova') {
      const n = 12 + e.rIdx * 4;
      const off = Math.random() * Math.PI;
      for (let i = 0; i < n; i++) this.spawnProj(e.x, e.y, off + (i / n) * Math.PI * 2, 200, e.dmg * pow, 'wild', col, 7, 'ball', sk);
      this.vfx.shockwave(e.x, e.y, col);
      this.vfx.ring(e.x, e.y, { r0: 10, vr: 520, life: 0.45, color: col, width: 6 });
      e.inv = 0.25; e._castSlow = 1.2;                    // 后遗症: sluggish after the big nova — a punish window
    } else if (e.telegraphKind === 'lob') {
      this.enemyLobAoe(e, me, col);
    } else {
      // rapid aimed barrage, predictively led + element-tinted
      const base = this.leadAngle(e, me, 300);
      for (let i = 0; i < 5; i++) this.spawnProj(e.x, e.y, base + (i - 2) * 0.12, 300, e.dmg * 0.85, 'wild', col, 6, 'ball', sk);
      this.vfx.muzzle(e.x, e.y, base, col);
    }
  }
  // nearest alive team cat to an enemy (release-time retarget helper)
  nearestEnemyTeamCat(e) {
    let best = null, bd = 1e9;
    for (const tf of this.team) { if (!tf.alive) continue; const d = Math.hypot(tf.x - e.x, tf.y - e.y); if (d < bd) { bd = d; best = tf; } }
    return best;
  }
  // Enemy places a SLOW lobbed AoE where the target is heading (predictive lead),
  // telegraphed by its traveling ground ring. Mirrors the player lobAoe.
  enemyLobAoe(e, me, col) {
    const tLead = Math.hypot(me.x - e.x, me.y - e.y) / 300;
    let tx = clamp(me.x + (me._vx || 0) * tLead, BATTLE_MARGIN.side, this.W - BATTLE_MARGIN.side);
    let ty = clamp(me.y + (me._vy || 0) * tLead, this.topMargin, this.H - this.bottomMargin);
    const ang = Math.atan2(ty - e.y, tx - e.x), dist = Math.hypot(tx - e.x, ty - e.y), speed = 280;
    this.spawnProj(e.x, e.y, ang, speed, e.dmg * 1.1, 'wild', col, 9, 'orb', e.skill, dist / speed + 0.02);
    const p = this.projectiles[this.projectiles.length - 1];
    p.burst = { r: 80, dmg: e.dmg * 1.1, skill: e.skill, col, tx, ty };
    this.vfx.muzzle(e.x, e.y, ang, col);
  }
  // Enemy ward decision: Protect a big incoming hit, Reflect projectile spam,
  // Barrier under general pressure. Timing/decision only — no damage/HP change.
  enemyMaybeWard(e, me, dist) {
    let incoming = 0;
    for (const p of this.projectiles) { if (p.owner === 'me' && Math.hypot(p.x - e.x, p.y - e.y) < 220) incoming++; }
    const playerUltSoon = this.ult >= 95 && this.ultCd<=0 && !this.ultCinematic;
    let type = null;
    if (playerUltSoon && dist < 260) type = 'protect';     // eat the ultimate (not reflectable)
    else if (incoming >= 3) type = 'reflect';              // bounce a projectile spammer
    else if (e.hp / e.maxhp < 0.6 && incoming >= 1) type = 'barrier';
    if (type && this.castWard(e, type)) {
      e.wardCd = (e.rIdx >= 2 ? 6 : 9) + Math.random() * 2;
      // Ward visuals show protection without stacking language-specific combat toasts.
    }
  }

  // ---------------- SKILL LIBRARY INTEGRATION (skills.js) ----------------
  // element → projectile color
  elemColor(el) {
    return ({ fire: '#ff7a3c', water: '#56ccf2', grass: '#7ee787', elec: '#ffe08a', dark: '#b18cff', light: '#fff1a8' })[el] || '#ffd36b';
  }
  elemSymbol(el) {
    return ({ fire: '🔥', water: '💧', grass: '🌿', elec: '⚡', dark: '🌑', light: '✨' })[el] || '';
  }
  // pick a signature skill from an element pool for a given rarity
  pickWildSkillFor(element, rIdx) {
    if (!window.Skills) return null;
    const pool = Skills.skillsByElement ? Skills.skillsByElement(element) : null;
    if (!pool || !pool.length) return null;
    const castable = pool.filter(s => s.kind === 'projectile' || s.kind === 'aoe');
    const ults = pool.filter(s => s.ultCost > 0);
    if (rIdx >= 2 && ults.length && Math.random() < 0.5) return ults[0];
    return (castable[0] || pool[0]);
  }
  // effectiveness multiplier atk-element vs a target species' element
  elemMult(atkEl, targetSpeciesId) {
    if (!window.Skills || !atkEl) return 1;
    const defEl = Skills.elementOf(targetSpeciesId);
    return Skills.effectiveness(atkEl, defEl);
  }
  // apply status tag + combo check when a player hit lands on a specific enemy
  applyHitEffects(e, skill, baseDmg, x, y) {
    let dmg = baseDmg;
    if (!window.Skills || !skill) return dmg;
    e.tags = e.tags || [];        // live tag list (for combo checks)
    e.status = e.status || {};    // tag -> remaining seconds (timed effects)
    const TAG = Skills.TAG_INFO || {};
    // DAMAGE MULTIPLIERS ARE ADDITIVE, NOT MULTIPLICATIVE. The element-reaction combo
    // bonus and the element-effectiveness bonus each contribute their part ABOVE 1 to a
    // single shared multiplier: mult = 1 + (combo-1) + (elem-1). This keeps reactions
    // (now tuned to 1.2-1.5) and effectiveness (up to 2x) from COMPOUNDING into 3-5x
    // spikes — a 1.5 reaction on a 2x-effective hit is 2.5x, not 3.0x. Reductions
    // (combo<1 "steam/douse", elem<1 resist) subtract their shortfall the same way.
    const combo = Skills.checkCombo ? Skills.checkCombo(e.tags, skill) : null;
    const elem = this.elemMult(skill.element, e.sp.id);
    let bonus = 0;                                   // sum of (factor-1) contributions
    if (combo) bonus += (combo.bonusMult || 1) - 1;
    bonus += elem - 1;
    dmg *= Math.max(0.25, 1 + bonus);                // floor so stacked reductions never zero out
    if (combo) {
      if(combo.effect==='shatter')
        this.vfx.impactType?.(e.x,e.y,'crit',{color:'#dceeff'});
      this.vfx.ring(e.x, e.y, { r0: 8, vr: 460, life: 0.45, color: this.elemColor(skill.element), width: 6 });
      this.vfx.text(e.x, e.y - 50, '✦', '#ffd36b', 12);
      if (combo.consumes && e.tags.includes(combo.tag)) { e.tags = e.tags.filter(t => t !== combo.tag); delete e.status[combo.tag]; }
    }
    if (elem > 1) this.vfx.text(x, y - 14, '↑', '#ff7b9c', 12);
    else if (elem < 1) this.vfx.text(x, y - 14, '↓', '#9aa8ba', 11);
    // BASIC-ATTACK TENSION: the basic poke rewards SKILL SETUP. It applies no tags
    // itself, but roars on a target already afflicted (+45% per active status tag)
    // and lands softer on an un-marked target — so Q/E priming carries the fight.
    if (skill.isBasic) {
      const nTags = e.tags.filter(t => t !== 'rust' && e.status[t] > 0).length;
      if (nTags > 0) dmg *= 1 + Math.min(0.30, 0.10 * nTags);
      else dmg *= 0.7;
    }
    // apply status tag(s) with their TTL → real ongoing effects (see tickStatus)
    if (skill.appliesTag) {
      const tags = Array.isArray(skill.appliesTag) ? skill.appliesTag : [skill.appliesTag];
      for (const tg of tags) {
        const fresh = !e.tags.includes(tg);
        if (fresh) e.tags.push(tg);
        const info = TAG[tg];
        e.status[tg] = info ? info.ttl : 3;
        const nm = info ? info.name : tg;
        this.vfx.text(e.x + (Math.random() * 20 - 10), e.y - 30, nm, info ? info.color : '#fff', 12);
        if (fresh) this.controlFx(e, tg, info ? info.color : '#fff');   // distinct "it's controlled!" burst
      }
    }
    // Armor break remains a status applied by authored skills. Poise loss is
    // handled AFTER landed damage inside resolveHit(), not before contact.
    if (skill.id && !skill.isBasic && (e.staggerT||0) <= 0) {
      const fresh = !e.status.rust;
      e.status.rust = TAG.rust.ttl;
      if (!e.tags.includes('rust')) e.tags.push('rust');
      if (fresh) {
        this.vfx.text(e.x,e.y-38,TAG.rust.name,TAG.rust.color,12);
        this.controlFx(e,'rust',TAG.rust.color);
      }
    }
    return dmg;
  }

  // Per-enemy short-window poise combo: a basic hit removes 8%, an
  // offensive skill 16%, a heavy skill 24%. Every successful successive
  // hit within 1.6s boosts poise loss 20%, capped at 2x. Partial loss
  // never regenerates; missed/blocked contacts and DoT earn no combo.
  applyPoiseOnSkillHit(e,skill){
    if(!e?.alive||!skill||(!skill.id&&!skill.isBasic)||
       (e.staggerT||0)>0||!(e.poise>0)||!(e.poiseMax>0))return false;
    // Channeled HP ticks do NOT multiply combo stacks. A flame SWEEP pass
    // has its own pass key and may score once against the same enemy.
    if(skill.isChanneledTick&&skill._poiseSource){
      const source=skill._poiseSource;source._poiseTargets??=new WeakMap();
      const pass=skill._poisePass??'channel';
      if(source._poiseTargets.get(e)===pass)return false;
      source._poiseTargets.set(e,pass);
    }
    e.poiseRecovering=false;
    if(skill.id==='quakeStomp'||skill.tags?.includes('stagger')){
      this.triggerStagger(e);return true;
    }
    const now=Number.isFinite(this.t)?this.t:0;
    const last=Number.isFinite(e.poiseLastHitAt)?e.poiseLastHitAt:-99;
    const streak=now>=last&&now-last<=1.6?Math.min(5,e.poiseComboHits||0):0;
    const heavy=!!skill.heavy||['dash','pounce','leap'].includes(skill.kind);
    const base=skill.isBasic?.08:heavy?.24:.16;
    const fraction=Math.min(.48,base*(1+.20*streak));
    e.poise=Math.max(0,e.poise-e.poiseMax*fraction);
    e.poiseComboHits=Math.min(6,streak+1);e.poiseLastHitAt=now;
    if(e.poise<=0)this.triggerStagger(e);
    return true;
  }

  // A distinct cast flourish per status so a control landing READS as control,
  // not a plain poke. Pairs with the persistent on-body overlay in draw().
  controlFx(e, tag, color) {
    switch (tag) {
      case 'dizzy':   // spinning stars ring overhead
        this.vfx.ring(e.x, e.y - 30, { r0: 4, vr: 120, life: 0.5, color, width: 3 });
        this.vfx.text(e.x, e.y - 52, '✦ ✦ ✦', color, 14); break;
      case 'blind':   // Pale lavender floor effect, never darken the cat face.
        this.vfx.ring(e.x, e.y + 15, { r0: 32, vr: -32, life: 0.45, color: '#bba6db', width: 3 });
        this.vfx.burst(e.x, e.y + 17, { count: 7, color: '#d6c7f0', speed: 58, life: 0.4, r: 2.5 }); break;
      case 'chill':   // ice shards snapping inward
        this.vfx.ring(e.x, e.y, { r0: 40, vr: -140, life: 0.4, color: '#bfe6ff', width: 4 });
        this.vfx.burst(e.x, e.y, { count: 10, color: '#d6f2ff', speed: 70, life: 0.5, r: 3 }); break;
      case 'bind':    // vines clamp
        this.vfx.ring(e.x, e.y, { r0: 28, vr: -40, life: 0.5, color: '#6fcf5f', width: 6 }); break;
      case 'shock':   // electric jitter arcs
        for (let i = 0; i < 3; i++) this.vfx.beam(e.x, e.y - 24, e.x + (Math.random() * 40 - 20), e.y + (Math.random() * 30 - 10), color); break;
      case 'expose': case 'rust':  // cracked red vulnerability ring
        this.vfx.ring(e.x, e.y, { r0: 10, vr: 200, life: 0.4, color, width: 4 }); break;
      default:
        this.vfx.ring(e.x, e.y, { r0: 8, vr: 160, life: 0.3, color, width: 3 });
    }
  }

  // per-enemy status tick: DoT (burn/bleed/shock), crowd-control (chill/bind/dizzy),
  // and debuffs (blind lowers its accuracy). Returns false if the enemy is frozen.
  tickStatus(e, dt) {
    // record HP history (~3s ring) so 回溯 can roll the enemy BACK to its past HP
    e._hpHist = e._hpHist || [];
    e._hpHist.push({ t: this.t, hp: e.hp });
    while (e._hpHist.length && e._hpHist[0].t < this.t - 3) e._hpHist.shift();
    if (!e.status) return true;
    const TAG = (window.Skills && Skills.TAG_INFO) || {};
    let frozen = false;
    for (const tg in e.status) {
      e.status[tg] -= dt;
      if (e.status[tg] <= 0) { delete e.status[tg]; e.tags = (e.tags || []).filter(t => t !== tg); continue; }
      const info = TAG[tg]; if (!info) continue;
      // 回溯 time-rewind (offensive): snap enemy HP to the LOWEST it hit in the
      // last ~3s — re-applying its best recent damage like rewinding a clock.
      if (info.rewind) {
        let lo = e.hp; for (const h of e._hpHist) if (h.hp < lo) lo = h.hp;
        if (lo < e.hp) { const d = e.hp - lo; e.hp = lo; this.vfx.text(e.x, e.y - 40, '⏪ 回溯 -' + Math.round(d), info.color, 16); this.vfx.ring(e.x, e.y, { r0: 10, vr: 480, life: 0.5, color: info.color, width: 5 }); if (e.hp <= 0 && e.alive) { e.alive = false; this._lastDropped = e; this.spawnBurst(e.x, e.y, '💫', info.color, 12); } }
        delete e.status[tg]; e.tags = (e.tags || []).filter(t => t !== tg); continue;
      }
      // damage-over-time
      if (info.dps) {
        const d = e.maxhp * info.dps * dt;
        e.hp = Math.max(0, e.hp - d);
        if (Math.random() < dt * 3) this.vfx.text(e.x + (Math.random() * 16 - 8), e.y - 18, '-' + Math.max(1, Math.round(e.maxhp * info.dps)), info.color, 10);
        if (e.hp <= 0 && e.alive) { e.alive = false; this._lastDropped = e; this.spawnBurst(e.x, e.y, '💫', info.color, 10); this.game.toast(e.sp.name + ' 倒下了！'); }
      }
    }
    // TIERED crowd control — not every CC is a full freeze:
    //  • dizzy 眩晕  = FULL stun: can't move AND can't attack (true hard control)
    //  • chill 冰冻  = frozen solid: can't move AND can't attack (hard, but see ttls)
    //  • bind  束缚  = ROOTED: can't move, but CAN still attack (partial control)
    // So binds let the enemy keep shooting (just pinned), dizzy/chill lock it out.
    const hardStun = !!(e.status.dizzy || e.status.chill);   // no move, no attack
    const rooted   = !!(e.status.bind);                       // no move, attacks OK
    e.frozen = hardStun;                                      // legacy flag = full lock
    e.rooted = rooted && !hardStun;
    // shock/blind flags for the AI to read
    e.slowed = !!(e.status.shock);
    e.blinded = !!(e.status.blind);
    return !hardStun;                                         // false → updateEnemyAI skipped (full lock)
  }

  hurtEnemy(e, dmg, fx, fy, isDot, fromDuo = false, hitTier = null) {
    // Resonance gets a separate coefficient: standard attacks retain the
    // general difficulty curve, while duo is tuned for multi-wave fights.
    if (fromDuo) dmg *= this.duoDamageMult ?? 1;
    // LEVEL SUPPRESSION: an over-leveled squad's raw damage is softly capped so a
    // fight can't be won by stats alone (see constructor). Applied to ALL player
    // damage (direct + DoT) at this single chokepoint; 1 when near/under level.
    if (this.levelSuppression) dmg *= this.levelSuppression;   // logistic curve: <1 under-level, >1 over-level
    // Global player-only balance adjustment: applies once to basics, skills,
    // damage-over-time, ally attacks and duo hits. Enemy damage is untouched.
    dmg *= 0.9;
    // Snapshot combo before increment so the hit that earns a chain level
    // only benefits subsequent hits. DoT never gains the direct-hit combo bonus.
    const comboBonus = isDot ? 0 : this.comboMult() - 1;
    if (!isDot) {
      this.addCombo(1);
      if(this.duo)this.duoCharge=Math.min(100,this.duoCharge+7);
    }
    // Incoming vulnerability effects share an additive bucket.
    const TAG = (window.Skills && Skills.TAG_INFO) || {};
    // Multiple vulnerabilities should not compound into a runaway one-shot.
    let vulnerabilityBonus = 0;
    if (e.status) for (const tg in e.status) {
      const info = TAG[tg];
      if (info?.dmgTaken > 1) vulnerabilityBonus += info.dmgTaken - 1;
    }
    // Stagger is a unique 3s window, not a second multiplicative vulnerability.
    // Combined vulnerability cap allows stagger (+30%) and armor break (+12%)
    // while preventing status stacking from outgrowing intended skill damage.
    if ((e.staggerT || 0) > 0) vulnerabilityBonus += 0.30;
    const vulnBonus = Math.min(0.50, vulnerabilityBonus);
    const frac0 = e.maxhp ? e.hp / e.maxhp : 1;
    // Boss: immune to auto-execute. Elite SR/SSR: fixed +20% execute bonus.
    // Ordinary enemies retain the 20–55% low-HP ramp; all are additive.
    const boss = e.isBoss === true || e.boss === true || e.role === 'boss';
    const elite = e.role === 'elite' || (e.rIdx ?? -1) >= 2;
    const executeBonus = (boss || isDot || frac0 >= 0.28) ? 0
      : elite ? 0.20 : 0.2 + (1 - clamp(frac0 / 0.28, 0, 1)) * 0.35;
    dmg *= 1 + vulnBonus + comboBonus + executeBonus;
    let scaled = dmg;
    if (fromDuo && this.duoField) {
      // Apply cap AFTER level scaling and vulnerability multipliers; otherwise
      // status amplifiers can bypass the two-wave pacing guarantee.
      const field=this.duoField,used=field.damageByEnemy?.get(e.i)||0;
      const budget=e.maxhp*(this.duoHpBudget??.48);
      scaled=Math.max(0,Math.min(scaled,budget-used));
      if (scaled <= 0.00001) return; // no fake zero-damage pop/ult charge
      field.damageByEnemy?.set(e.i,used+scaled);
    }
    // Let the player finish movement/attack/skill/dodge practice before
    // an allied AI cat can accidentally end the only guided encounter.
    const lessonPending=this.coach&&this.coach.steps[this.coach.i]?.key!=='finish';
    e.hp = Math.max(lessonPending?1:0, e.hp - scaled);
    // CAST-INTERRUPT accumulator: damage dealt while an enemy is winding up a heavy
    // counts toward cancelling it (checked in the AI telegraph tick).
    if (e.castInterruptible && e.telegraph > 0) e.castDmgTaken = (e.castDmgTaken || 0) + scaled;
    e.flash = 0.16;                                   // i-frame timer (gates re-hits)
    // Weighty impact on DIRECT hits only (DoT ticks stay quiet to avoid noise).
    if (!isDot) {
      const touch = !!this.game.isTouch;
      const frac = e.maxhp ? Math.min(1, scaled / e.maxhp) : 0.2;
      // HIT-FEEL: true short hitstop (consumed as a hard freeze in update), strength-scaled.
      const strong=hitTier==='heavy'||hitTier==='crit'||hitTier==='stagger';
      const stop=(touch?.035:.05)+frac*.07+(strong?.010:0);          // ~35ms mobile, 50-120ms desktop
      this.hitstop = Math.max(this.hitstop, stop);
      // CAMERA SHAKE scaled by HIT STRENGTH (not just combo heat), kicked along the blow.
      const heat = Math.min(1, this.combo / 20);
      const normal=this.hitNormal(e,fx,fy,'me');
      this.addShake((touch ? 0.10 : 0.15) + 0.35 * frac + 0.06 * heat,
        normal.angle);
      // WHITE connect-flash on the body silhouette (separate from the i-frame fade).
      e.hitWhite = 0.09;
      // On-hit SQUASH: the struck cat compresses then springs back (draw-only).
      e.hitSquash = Math.min(.28,.12+.14*frac+(strong?.025:0));
      // KNOCKBACK (now VISIBLE): bigger base, softer rarity resist, slower decay so the
      // boop reads over ~5-6 frames. basic≈20-26px, heavy≈55px. Playful, not brutal.
      const power=(160+320*frac)/(1+e.rIdx*.3);
      e.kbx=(e.kbx||0)+normal.x*power;
      e.kby=(e.kby||0)+normal.y*power;
      // ATTACKER SELF-RECOIL: the striker rocks back a touch along -normal (draw-only
      // offset), selling the force exchange. me() for basics/melee; harmless if attacker
      // unknown.
      const atk = this.me && this.me();
      if(atk&&atk.alive){atk._recoilX=-normal.x*7;atk._recoilY=-normal.y*7;}
      // DIRECTIONAL impact sparks: spray along the hit normal (away from the attacker),
      // scaled by hit strength — reads as force, not a symmetric puff.
      const tier=hitTier||(frac>=.17?'heavy':'light');
      this.vfx.impactType?.(e.x,e.y,tier,
        {color:tier==='crit'?'#fff4cf':tier==='heavy'?'#ffdf9d':'#fff2c0',
          angle:normal.angle});
      // CONNECT TICK: a short, combo-pitched pop so every landed hit is audible
      // (previously only the swing had sound → players couldn't tell a hit landed).
      // Throttled ~70ms and pitch rises with the combo for a satisfying ladder.
      if ((this.t - (this._lastHitSfx || -1)) > 0.07) {
        this._lastHitSfx = this.t;
        window.MorrowwishAudio?.effect?.('combat_hit');
      }
    }
    // Skill-aware numbers: a POISE/stagger critical produces a gold snap
    // even if hardcore damage modifiers keep its numeric damage modest.
    const critNumber=hitTier==='crit',strongNumber=hitTier==='heavy';
    const big=critNumber?21:strongNumber?17:
      this.combo>=15?18:this.combo>=6?15:13;
    const numberColor=critNumber?'#ffe2a2':strongNumber?'#fff0cf':
      this.combo>=15?'#ffd36b':'#fff';
    this.floater(e.x,e.y-24,'-'+Math.round(scaled),numberColor,big);
    this.spawnBurst(fx, fy, '✦', '#ffd36b', 3);
    this.gainUlt(3);
    if(e.hp<=0&&e.alive){
      e.alive=false;this._lastDropped=e;
      this.vfx.impactType?.(e.x,e.y,'kill',{color:'#ffeca9'});
      this.spawnBurst(e.x,e.y,'💫','#ffd36b',12);
      this.game.toast(e.sp.name+' 斗志耗尽！');
    }
  }
  hurtMe(dmg, fx, fy, f) {
    f = f || this.me();
    if (!f.alive) return;
    // LEVEL GAP: a higher-level wild pack hits genuinely harder (see constructor).
    if (this.enemyLevelMult && this.enemyLevelMult !== 1) dmg *= this.enemyLevelMult;
    // First-fight coach: a beginner can take hits to learn, but never dies during
    // the tutorial — damage is gentled and HP floored so the first fight is safe.
    if (this.coach) dmg *= 0.35;
    // Barrier (shieldT) reduction now lives in resolveHit, which every enemy hit
    // routes through. hurtMe lands the (already shield-adjusted) damage.
    f.hp = Math.max(this.coach ? 1 : 0, f.hp - dmg);
    if(dmg>0&&this.t-(this._lastHurtSfx??-5)>.24){
      window.MorrowwishAudio?.effect?.('combat_hurt');
      this._lastHurtSfx=this.t;
    }
    if (this._obs) this._obs.dmgTaken += dmg;            // anti-stomp signal (see commitAiProfile)
    f.hitFlash = 0.14; f.inv = 0.3;
    // HIT-FEEL on the player's cat taking a hit: white connect-flash, squash, a short
    // hitstop + strength-scaled camera shake, and knockback away from the blow.
    if (dmg > 0) {
      const frac = f.maxhp ? Math.min(1, dmg / f.maxhp) : 0.2;
      f.hitWhite = 0.09;
      f.hitSquash = Math.min(0.28, 0.12 + 0.14 * frac);
      this.hitstop = Math.max(this.hitstop, (this.game.isTouch ? 0.03 : 0.04) + frac * 0.06);
      const normal=this.hitNormal(f,fx,fy,'wild');
      this.addShake((this.game.isTouch?.12:.18)+.3*frac,normal.angle);
      const power=120+220*frac;
      f.kbx=(f.kbx||0)+normal.x*power;
      f.kby=(f.kby||0)+normal.y*power;
    }
    // priority floater so damage taken on ANY of your cats (active or ally) is never
    // dropped by the active cat's own outgoing-number spam. Slightly larger + red.
    this.floater(f.x, f.y - 26, '-' + Math.round(dmg), '#ff5a7a', 15, true);
    this.gainUlt(4);
    if (f.hp <= 0) {
      if (f.bond && f.bond.reviveOnce && !f.revived) {
        f.revived = true; f.hp = 1; f.inv = 1.0;
        this.vfx.ring(f.x, f.y, { r0: 6, vr: 300, life: 0.4, color: '#ffd36b', width: 5 });
        this.vfx.text(f.x, f.y - 40, '纽带·不倒!', '#ffd36b', 16);
        this.game.toast('❤ 纽带之力！' + GameData.speciesById(f.cat.species).name + ' 绝境不倒！');
        return;
      }
      this.onFaint(f);
    }
  }

  // ---------------- UNIFIED HIT RESOLVER ----------------
  // One entry every attack (projectile / melee / aoe / dash / chain, player or
  // enemy) passes through, so shields are honored consistently and status/combo
  // run only on damage that actually lands. `side` is the ATTACKER's owner
  // ('me'|'wild'); `proj` (optional) is the flying body, needed for reflect.
  // Returns {blocked, reflected, dealt}.
  resolveHit(target, side, skill, dmg, x, y, proj) {
    if (!target || !target.alive) return { blocked: false, reflected: false, dealt: 0 };
    if ((target.inv || 0) > 0 || (target.flash || 0) > 0) return { blocked: false, reflected: false, dealt: 0 };
    const col = this.elemColor(skill && skill.element);
    // 1) PROTECT (守护): fully blocks the next hit of any kind for its window.
    if ((target.protectT || 0) > 0) {
      // Protect is a SINGLE-HIT guard; consuming it also starts the recovery.
      target.protectT=0;
      target.vulnerableT=Math.max(target.vulnerableT||0,target._protectVuln||1.2);
      target._protectVuln=0;
      this.vfx.impactType?.(target.x,target.y,'shieldBreak',{color:'#d4f5eb'});
      this.vfx.text(target.x,target.y-40,
        window.MorrowwishI18n?.get?.()==='zh'?'格挡!':'BLOCK!', '#cbefd8',14);
      this.hitstop=Math.max(this.hitstop,this.game?.isTouch?.035:.05);
      return { blocked: true, reflected: false, dealt: 0 };
    }
    // 2) REFLECT (反弹壁): flip a flying projectile back at its owner (capped so
    //    it can't ping-pong forever). Instant melee/aoe/chain are NOT reflected.
    // Only the FORWARD hemisphere catches shots. A shot from the flank/rear
    // passes through and hurts normally. Heading tracks actual movement.
    const frontShot = proj && this.reflectCovers(target, proj.x, proj.y);
    if ((target.reflectT || 0) > 0 && frontShot && (proj._reflects || 0) < 1) {
      proj._reflects = (proj._reflects || 0) + 1;
      proj.owner = side === 'me' ? 'wild' : 'me';
      proj.vx = -proj.vx; proj.vy = -proj.vy; proj.life = Math.max(proj.life, 1.2);
      this.vfx.impactType?.(target.x,target.y,'reflect',{color:'#b8e0ff'});
      this.vfx.text(target.x, target.y - 40, '反弹', '#b8e0ff', 15);
      return { blocked: false, reflected: true, dealt: 0 };
    }
    // 3) BARRIER (护盾): percentage damage reduction (keeps the existing 55%).
    //    An UNBLOCKABLE heavy (must-dodge smash) ignores the shield's big cut — a
    //    barrier only chips it (0.85) so standing in the circle behind a shield still
    //    hurts; the real answer is to leave the telegraphed disc / dodge for i-frames.
    if ((target.shieldT || 0) > 0) {
      dmg *= (skill && skill.unblockable)
        ? 0.85 : 1-Math.max(0,Math.min(.8,target._wardReduction??.45));
      // Fire barrier trades some prevention for a close-range burn counter.
      if(side==='wild'&&target._wardRetaliateBurn&&
         this.t-(target._lastWardRetaliateAt??-99)>=1){
        const attacker=this.nearestEnemy(target.x,target.y);
        if(attacker&&Math.hypot(attacker.x-target.x,attacker.y-target.y)<100){
          target._lastWardRetaliateAt=this.t;
          attacker.status=attacker.status||{};attacker.tags=attacker.tags||[];
          attacker.status.burn=Math.max(attacker.status.burn||0,Skills.TAG_INFO.burn.ttl);
          if(!attacker.tags.includes('burn'))attacker.tags.push('burn');
          this.vfx.ring(attacker.x,attacker.y,{r0:8,vr:95,life:.25,color:'#ff854f',width:2});
        }
      }
      // A contact ripple with channel-hit throttling; no global overlay.
      if(this.t-(target._lastBarrierFxAt??-99)>.24){
        target._lastBarrierFxAt=this.t;
        this.vfx.impactType?.(target.x,target.y,'barrier',{color:'#a2dffc'});
      }
    }
    // VULNERABLE after a Protect drops (后遗症): takes extra damage briefly.
    if ((target.vulnerableT || 0) > 0) dmg *= 1.3;
    // land it
    if (side === 'me') {
      // An authored skill drains poise only after its hit successfully lands;
      // toy basics, DoTs, blocked shots and pure support actions never do.
      const isBasic = skill && skill.isBasic;
      // Only a hit on an ALREADY staggered enemy is a critical contact.
      const alreadyStaggered=!!(target.staggerT>0);
      // 纸箱埋伏 Box Ambush: the primed cat's next non-basic skill forces stagger.
      const amb = this.me(); if (amb && amb._ambush && !isBasic) { amb._ambush = false; this.triggerStagger(target); }
      // Stagger (+30%) joins the incoming vulnerability bucket in hurtEnemy().
      const dealt = this.applyHitEffects(target, skill || { element: null }, dmg, x, y);
      // Channel damage is steady pressure, not a rapid sequence of hard
      // camera pauses. Normal melee/chain/projectiles retain their hitstop.
      const continuous=!!skill?.isChanneledTick;
      const heavyMove=!!skill?.heavy||['melee','dash','pounce','leap'].includes(skill?.kind);
      const hitTier=continuous?null:alreadyStaggered?'crit':heavyMove?'heavy':'light';
      this.hurtEnemy(target,dealt,x,y,continuous,false,hitTier);
      if(dealt>0){
        this._lastPoiseHitEnemy=target.i;
        this._lastPoiseHitAt=this.t;
        this.applyPoiseOnSkillHit(target,skill);
      }
      // Additional authored contact mark is strictly local. Continuous beams
      // are throttled per skill/target to avoid particle and audio overload.
      if(dealt>0)window.CatBondSkillFX?.hit(this,target,skill,dealt,continuous);
      if(continuous){
        this.vfx.trail(x,y,col,2.5);
      }else{
        // hurtEnemy() already created the white-hot connect spark and hitstop.
        // Do not double-spawn the same impact here; authored skill-id hit art
        // provides the distinct accent instead.
        // A small localized impact accent makes heavy physical hits feel
        // decisive without painting the whole screen or enlarging hitboxes.
        if(skill?.heavy||['dash','pounce','leap','melee'].includes(skill?.kind)){
          this.vfx.ring(x,y,{r0:5,vr:90,life:.26,color:col,width:3});
          this.vfx.burst(x,y,{count:this.game.isTouch?5:9,
            color:col,speed:110,life:.24,r:2.6});
        }
      }
      // One clean elemental impact mark per beat; suppress spam from beams.
      if(dealt>0&&skill?.element&&(skill.ultCost||0)===0&&
        this.t-(this._lastRegularHitFx??-99)>.12){
        this._lastRegularHitFx=this.t;
        this.regularSkillAccent({x,y},skill.element,0,!!skill.isBasic,true);
      }
      return { blocked: false, reflected: false, dealt };
    } else {
      // Enemy hit on a cat: type matchup matters defensively too, and an enemy
      // special can leave a DoT/soft-CC on the cat (mirror of applyHitEffects).
      const dealt = this.applyEnemyHitEffects(target, skill || { element: null }, dmg, x, y);
      this.hurtMe(dealt, x, y, target);
      this.vfx.impactType?.(x,y,'light',{color:col});
      return { blocked: false, reflected: false, dealt };
    }
  }

  // Enemy-side mirror of applyHitEffects: element effectiveness against the cat's
  // own element, plus any status tag the enemy's skill inflicts. Deliberately
  // simpler than the player's version — NO combo system on cats, and crowd-control
  // on a cat is a SLOW (handled in tickCatStatus), never a full input lockout.
  applyEnemyHitEffects(f, skill, baseDmg, x, y) {
    let dmg = baseDmg;
    if (!window.Skills || !skill) return dmg;
    f.tags = f.tags || [];
    f.status = f.status || {};
    const TAG = Skills.TAG_INFO || {};
    // element effectiveness: enemy skill element vs this cat's element
    if (skill.element && f.cat) {
      const mult = this.elemMult(skill.element, f.cat.species);
      if (mult > 1) { dmg *= mult; this.vfx.text(x, y - 14, '↑', '#ff7b9c', 12); }
      else if (mult < 1) { dmg *= mult; this.vfx.text(x, y - 14, '↓', '#9aa8ba', 11); }
    }
    // 破绽/破甲 on the cat amplify what it's about to take
    let incomingVulnerability=0;
    for (const tg in f.status) {
      const info=TAG[tg];
      if (info?.dmgTaken>1) incomingVulnerability+=info.dmgTaken-1;
    }
    dmg *= 1+Math.min(0.30,incomingVulnerability);
    // apply the skill's status tag to the cat (DoT or soft-CC)
    if (skill.appliesTag) {
      const tags = Array.isArray(skill.appliesTag) ? skill.appliesTag : [skill.appliesTag];
      for (const tg of tags) {
        if (tg === 'rewind') continue;                 // player-only mechanic
        const info = TAG[tg];
        if (!info) continue;
        const fresh = !f.tags.includes(tg);
        if (fresh) f.tags.push(tg);
        // cap pure crowd-control on a cat so it's a brief slow, not a long lockout
        const isCC = (info.dps || 0) === 0 && !info.dmgTaken && !info.dmgDealt;
        f.status[tg] = isCC ? Math.min(info.ttl, 1.4) : info.ttl;
        this.vfx.text(f.x + (Math.random() * 20 - 10), f.y - 30, info.name, info.color, 12);
        if (fresh) this.controlFx(f, tg, info.color);
      }
    }
    return dmg;
  }

  onFaint(f) {
    f = f || this.me();
    f.alive = false;
    // A faint shakes the cat: a temporary % stat penalty (via affinityStatMult) that
    // lingers ~3 min of real time into its NEXT battles, until it's comforted/bonds up.
    if (f.cat) f.cat._deathPenaltyUntil = Date.now() + 180000;
    this.spawnBurst(f.x, f.y, '💫', '#c9b6ff', 10);
    // RESERVE SUBSTITUTION: a fainted field cat is replaced by a benched reserve cat
    // (brought in at the fainted cat's spot), so bringing a 3rd cat means a backup
    // sub, not just a bond-ult call-in. Fill the active field slots first.
    if (this.substituteFromReserve(f)) {
      if (!this.team.some(t => t.alive && !t._reinforcement)) this.finish(false);
      return;
    }
    const anyAlive = this.team.some(t => t.alive);
    if (!anyAlive) { this.finish(false); return; }
    this.game.toast(`${State.catName(f.cat)} 累瘫了！`);
    // if the ACTIVE cat fainted, hand control to another living cat
    if (f === this.me()) {
      const next = this.team.findIndex(t => t.alive);
      if (next >= 0) this.active = next;
    }
  }
  // Bring a fresh reserve cat onto the field to replace a fainted one. Returns true
  // if a sub came in. The reserve fights as a normal field cat (not the temporary
  // bond reinforcement). If the fainted cat was the active one, control transfers.
  substituteFromReserve(f) {
    const onField = new Set(this.team.map(t => t.cat.uid));
    const pick = (this.reserve || []).find(c => c && !onField.has(c.uid) && (c._hpFrac == null || c._hpFrac > 0.1));
    if (!pick) return false;
    const idx = this.team.indexOf(f);
    const wasActive = idx === this.active;
    const sub = this._benchFighters.get(pick.uid)||this.makeFighter(pick, idx >= 0 ? idx : this.team.length);
    this._benchFighters.delete(pick.uid);
    sub.i=idx >= 0 ? idx : this.team.length;
    sub._reinforcement=false;
    sub.x = f.x; sub.y = f.y; sub.inv = 1.0;
    this.reserve = this.reserve.filter(c => c !== pick);
    if (idx >= 0) this.team[idx] = sub; else this.team.push(sub);
    this.game.buildTeamSlots?.();
    if (wasActive || !this.me()?.alive) this.active = this.team.indexOf(sub);
    this.vfx.ring(sub.x, sub.y, { r0: 8, vr: 320, life: 0.5, color: '#9be7c4', width: 5 });
    this.vfx.burst(sub.x, sub.y, { count: 12, color: '#9be7c4', speed: 190, life: 0.45, r: 3 });
    const en = window.MorrowwishI18n?.get?.() !== 'zh';
    this.vfx.text(sub.x, sub.y - 46, en ? 'SUB IN!' : '替补上场!', '#9be7c4', 15);
    this.game.toast(en ? (State.catName(pick)) + ' subs in for ' + State.catName(f.cat) + '!'
                       : State.catName(f.cat) + ' 倒下，' + State.catName(pick) + ' 替补上场！');
    window.arcadeMetric?.('bond_reserve_sub', {});
    return true;
  }

  finish(win) { this.done = true; this.result = win ? 'win' : 'flee'; this.shakeT = 0.5; }

  // themed battle backdrop; recolors per world-map region (this.theme)
  drawArenaBackground(ctx, W, H) {
    if(window.CatBondScenery && CatBondScenery.drawBattle(ctx,W,H,this.t,this.theme))return;
    const t = this.t, horizon = H * 0.34;
    const th = this.theme || {};
    const sky1 = th.sky1 || '#271a46', sky2 = th.sky2 || '#4a3570';
    const g1 = th.ground || '#2e6b46', g2 = th.ground2 || '#1b4a32';
    const accent = th.accent || '#9d7bff';
    // night sky (themed)
    const sky = ctx.createLinearGradient(0, 0, 0, horizon + 40);
    sky.addColorStop(0, sky1); sky.addColorStop(0.6, sky2); sky.addColorStop(1, mix(sky2, g1, 0.5));
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, horizon + 40);
    // stars
    if (!this._stars) this._stars = Array.from({ length: 40 }, (_, i) => ({ x: (i * 131) % W, y: (i * 71) % horizon, r: 0.6 + (i % 3) * 0.5, ph: i }));
    ctx.fillStyle = '#fff';
    for (const s of this._stars) { ctx.globalAlpha = 0.3 + 0.5 * Math.abs(Math.sin(t * 0.8 + s.ph)); ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
    // moon with glow
    const mx = W * 0.82, my = 72;
    const mg = ctx.createRadialGradient(mx, my, 6, mx, my, 70);
    mg.addColorStop(0, 'rgba(255,245,210,0.5)'); mg.addColorStop(1, 'rgba(255,245,210,0)');
    ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(mx, my, 70, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff6da'; ctx.beginPath(); ctx.arc(mx, my, 28, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(120,100,150,0.35)'; ctx.beginPath(); ctx.arc(mx + 10, my - 6, 24, 0, Math.PI * 2); ctx.fill();
    // layered hills (themed, derived from sky/ground mix)
    ctx.fillStyle = mix(sky2, g1, 0.55); this.hillBand(ctx, W, horizon, 34, 0.7);
    ctx.fillStyle = mix(sky2, g1, 0.75); this.hillBand(ctx, W, horizon + 14, 26, 1.1);
    // ground: perspective meadow (themed)
    const grd = ctx.createLinearGradient(0, horizon, 0, H);
    grd.addColorStop(0, g1); grd.addColorStop(1, g2);
    ctx.fillStyle = grd; ctx.fillRect(0, horizon, W, H - horizon);
    // perspective floor lines converging to horizon center (depth cue)
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
    const cx = W / 2;
    for (let i = -6; i <= 6; i++) { ctx.beginPath(); ctx.moveTo(cx + i * 30, horizon); ctx.lineTo(cx + i * 220, H); ctx.stroke(); }
    for (let j = 1; j <= 6; j++) { const yy = horizon + (H - horizon) * (j * j) / 49; ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke(); }
    // glowing arena disc on the ground where the fight happens
    const dcx = W / 2, dcy = H * 0.66;
    ctx.save();
    const disc = ctx.createRadialGradient(dcx, dcy, 20, dcx, dcy, W * 0.42);
    disc.addColorStop(0, withAlpha(accent, 0.16)); disc.addColorStop(0.7, withAlpha(accent, 0.06)); disc.addColorStop(1, withAlpha(accent, 0));
    ctx.fillStyle = disc; ctx.beginPath(); ctx.ellipse(dcx, dcy, W * 0.42, (H - horizon) * 0.52, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(200,180,255,0.18)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(dcx, dcy, W * 0.4, (H - horizon) * 0.5, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    // drifting ambient motes
    if (!this._motes) this._motes = Array.from({ length: 18 }, (_, i) => ({ x: (i * 97) % W, y: horizon + ((i * 53) % (H - horizon)), ph: i }));
    for (const mo of this._motes) {
      mo.y -= 8 * (1 / 60); if (mo.y < horizon) mo.y = H;
      ctx.globalAlpha = 0.25 + 0.3 * Math.abs(Math.sin(t + mo.ph));
      ctx.fillStyle = '#cbb8ff'; ctx.beginPath(); ctx.arc(mo.x + Math.sin(t + mo.ph) * 8, mo.y, 1.6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  hillBand(ctx, W, baseY, amp, freq) {
    ctx.beginPath(); ctx.moveTo(0, baseY);
    for (let x = 0; x <= W; x += 18) ctx.lineTo(x, baseY - Math.abs(Math.sin(x / W * Math.PI * freq * 2 + 1)) * amp);
    ctx.lineTo(W, baseY + 300); ctx.lineTo(0, baseY + 300); ctx.closePath(); ctx.fill();
  }

  // ---------------- draw ----------------
  draw(ctx) {
    const { W, H } = this;
    ctx.save();
    // HIT-FEEL camera shake (resurrected): offset the whole scene by maxShake*trauma²
    // with a directional kick along the last hit normal + decaying random jitter. The
    // old code deleted shake to avoid exposing letterbox strips on portrait; we instead
    // CLAMP the offset small and the background (drawArenaBackground) paints the full
    // canvas, so a few px of translate never reveals an undrawn edge.
    let _shx = 0, _shy = 0;
    // Cinematic paintings stay screen-anchored: shake the impact VFX after the
    // cut-in, never the full-screen artwork or its feathered perimeter.
    if (this.shakeTrauma > 0.001 && !this.ultCinematic && !(this.duoCinematic?.t > 0)) {
      const maxShake = this.game.isTouch ? 2.5 : 5;
      const amt = maxShake * this.shakeTrauma * this.shakeTrauma;
      const rnd = () => (Math.random() * 2 - 1);
      _shx = this.shakeDirX * amt * 0.6 + rnd() * amt;
      _shy = this.shakeDirY * amt * 0.6 + rnd() * amt;
      _shx = Math.max(-maxShake, Math.min(maxShake, _shx));
      _shy = Math.max(-maxShake, Math.min(maxShake, _shy));
      // Fill the untranslated canvas with the backdrop sky first, so the ≤maxShake
      // translate can never reveal an undrawn edge (the old letterbox bug).
      ctx.fillStyle = (this.theme && this.theme.sky2) || '#4a3570';
      ctx.fillRect(0, 0, W, H);
      ctx.translate(_shx, _shy);
    }

    this.drawArenaBackground(ctx, W, H);
    this.drawDuoField(ctx);
    if(this.duoCinematic?.t>0){
      const v=this.duoCinematic,k=Math.max(0,v.t/v.max),elapsed=v.max-v.t;
      ctx.save();
      // Battle-space focus rather than screen-wide spinning sticker graphics.
      ctx.fillStyle='rgba(30,26,45,'+(Math.min(.10,Math.sin(Math.PI*elapsed/v.max)*.10))+')';
      ctx.fillRect(0,0,W,H);
      ctx.textAlign='center';
      ctx.font='800 '+(this.game.isTouch?12:15)+'px system-ui';
      ctx.fillStyle='rgba(255,253,238,'+(k*.92)+')';
      ctx.shadowColor=v.first;ctx.shadowBlur=9;
      // Always balance the inner save. The previous conditional skipped
      // restore after 1.75s, leaking shadow/compositing state into every frame.
      ctx.restore();
    }

    if (this.flash > 0) { ctx.fillStyle = `rgba(157,123,255,${this.flash})`; ctx.fillRect(0, 0, W, H); }

    // Legacy full-screen ULT cinematic disabled; duo animations are separate.

    this.drawPackMorale(ctx, W);

    // aim reticle
    const m = this.game.mouse;
    if (m) { ctx.strokeStyle = 'rgba(255,211,107,0.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(m.x, m.y, 9, 0, Math.PI * 2); ctx.moveTo(m.x - 13, m.y); ctx.lineTo(m.x + 13, m.y); ctx.moveTo(m.x, m.y - 13); ctx.lineTo(m.x, m.y + 13); ctx.stroke(); }

    this.drawAimPreview(ctx);

    // Manual target guide stays below the cat bodies and is thin enough not
    // to clutter a small phone. Tapping a wild cat locks it until it leaves.
    if(!this.autoMode && (this.game.isTouch||this._lockIdx!=null)){
      const target=this.lockedEnemy();
      const actor=this.me();
      if(target&&actor){
        ctx.save();ctx.strokeStyle='rgba(247,215,130,.46)';
        ctx.lineWidth=1.7;ctx.setLineDash([5,8]);
        ctx.beginPath();ctx.moveTo(actor.x,actor.y-5);ctx.lineTo(target.x,target.y-5);ctx.stroke();
        ctx.setLineDash([]);
        ctx.strokeStyle='rgba(255,235,159,.85)';ctx.lineWidth=1.7;
        ctx.beginPath();ctx.arc(target.x,target.y,34+2*Math.sin(this.t*3),0,Math.PI*2);ctx.stroke();
        ctx.restore();
      }
    }

    this.drawFields(ctx);                // elemental ground zones, beneath the action
    for(const wall of this.barrierWalls||[])
      window.CatBondWardArt?.drawFlatWall?.(ctx,wall,this.t);
    // vfx under-layer (trails, rings, muzzle)
    this.vfx.draw(ctx);
    this.drawSkillStrokes(ctx);
    this.drawBeams(ctx);
    this.drawDeathRay(ctx);                        // 破坏死光 sweeping beam (additive + scorch)

    // projectiles with glow
    for (const p of this.projectiles) {
      // ADDITIVE TAPERED RIBBON trail from the position history (bright/wide head →
      // transparent tail), drawn under the body. Round caps hide the segment seams.
      const h = p._hist;
      if (h && h.length >= 4) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.strokeStyle = p.color;
        const segs = h.length / 2 - 1;
        for (let s = 0; s < segs; s++) {
          const t = (s + 1) / segs;                        // 0 tail → 1 head
          ctx.globalAlpha = 0.5 * t;
          ctx.lineWidth = Math.max(1, p.r * 1.3 * t);
          ctx.beginPath();
          ctx.moveTo(h[s * 2], h[s * 2 + 1]);
          ctx.lineTo(h[s * 2 + 2], h[s * 2 + 3]);
          ctx.stroke();
        }
        ctx.restore();
      }
      ctx.save(); ctx.translate(p.x, p.y);
      // Keep the silhouettes crisp: no generic circular glow halo around
      // every projectile. A hit gets a brief impact effect instead.
      ctx.globalAlpha=1;ctx.fillStyle=p.color;
      if(p.kind==='star'){ctx.rotate(this.t*8);star(ctx,0,0,p.r,p.r*.5,5);}
      else if(p.kind==='fish'){
        // 小鱼干: a little dried-fish, tumbling as it flies
        ctx.rotate(p.ang+this.t*9);
        const r=p.r;
        ctx.fillStyle='#e8b57a';ctx.strokeStyle='#b9823f';ctx.lineWidth=1.5;
        ctx.beginPath();ctx.ellipse(0,0,r,r*0.62,0,0,Math.PI*2);ctx.fill();ctx.stroke();  // body
        ctx.beginPath();ctx.moveTo(-r*0.9,0);ctx.lineTo(-r*1.5,-r*0.6);ctx.lineTo(-r*1.5,r*0.6);ctx.closePath();ctx.fill();ctx.stroke(); // tail
        ctx.fillStyle='#4a3524';ctx.beginPath();ctx.arc(r*0.5,-r*0.12,r*0.14,0,Math.PI*2);ctx.fill(); // eye
        // little cross-hatch "dried" marks
        ctx.strokeStyle='#c8914f';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-r*0.2,-r*0.4);ctx.lineTo(-r*0.2,r*0.4);ctx.moveTo(r*0.2,-r*0.35);ctx.lineTo(r*0.2,r*0.35);ctx.stroke();
      }else if(p.kind==='yarn'){
        // 毛线团: a wound yarn ball, spinning, in the cat's element tint
        ctx.rotate(p.ang+this.t*11);
        const r=p.r;
        ctx.fillStyle=p.color;ctx.strokeStyle='rgba(0,0,0,0.25)';ctx.lineWidth=1.5;
        ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();
        // wound strands: a few arcs across the ball
        ctx.strokeStyle='rgba(255,255,255,0.55)';ctx.lineWidth=1.4;
        for(let s=-2;s<=2;s++){ctx.beginPath();ctx.arc(0,0,r,s*0.5-0.6,s*0.5+0.6);ctx.stroke();}
        ctx.beginPath();ctx.ellipse(0,0,r,r*0.5,0.7,0,Math.PI*2);ctx.stroke();
        ctx.beginPath();ctx.ellipse(0,0,r*0.5,r,0.7,0,Math.PI*2);ctx.stroke();
      }else if(p.kind==='claw'){
        ctx.rotate(p.ang);
        ctx.strokeStyle='#fff5d5';ctx.lineWidth=3;ctx.lineCap='round';
        for(let k=-1;k<=1;k++){
          ctx.beginPath();ctx.moveTo(-p.r*1.2,k*4-4);ctx.quadraticCurveTo(0,k*4+1,p.r*1.5,k*4+7);ctx.stroke();
        }
      }else if(p.kind==='leaf'){
        ctx.rotate(p.ang+Math.sin(this.t*14)*.2);
        ctx.fillStyle='#96f1a9';ctx.beginPath();ctx.moveTo(-14,0);
        ctx.quadraticCurveTo(2,-9,16,0);ctx.quadraticCurveTo(2,9,-14,0);ctx.fill();
        ctx.strokeStyle='#efffd5';ctx.lineWidth=1.5;
        ctx.beginPath();ctx.moveTo(-11,0);ctx.lineTo(13,0);ctx.stroke();
      }else if(p.kind==='lightningOrb'){
        // Unmistakable slow, crackling ORB, not a yellow generic bullet.
        const pulse=.94+.10*Math.sin(this.t*21);
        ctx.globalAlpha=.58;ctx.strokeStyle='#5367bb';ctx.lineWidth=3;
        ctx.beginPath();ctx.arc(0,0,p.r*pulse+3,0,Math.PI*2);ctx.stroke();
        ctx.globalAlpha=.89;ctx.fillStyle='#ffdfa3';
        ctx.beginPath();ctx.arc(0,0,p.r*pulse,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#fffaf3';ctx.beginPath();ctx.arc(-2,-2,p.r*.51,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='#7489d2';ctx.lineWidth=2;ctx.globalAlpha=.85;
        for(let j=0;j<5;j++){
          const a=j*Math.PI*2/5+this.t*7;
          ctx.beginPath();ctx.moveTo(Math.cos(a)*p.r*.67,Math.sin(a)*p.r*.67);
          ctx.lineTo(Math.cos(a+.35)*(p.r+6),Math.sin(a+.35)*(p.r+6));ctx.stroke();
        }
      }else if(p.kind==='fireball'){
        ctx.rotate(p.ang);
        const flicker=Math.sin(this.t*26)*3;
        // A directional, tapered flame with a trailing fork, not an orange orb.
        ctx.fillStyle='#db603f';ctx.beginPath();ctx.moveTo(17,0);
        ctx.quadraticCurveTo(2,-13,-21,-9+flicker);
        ctx.quadraticCurveTo(-10,0,-23,9-flicker);
        ctx.quadraticCurveTo(3,14,17,0);ctx.fill();
        ctx.fillStyle='#fdb96d';ctx.beginPath();ctx.moveTo(18,0);
        ctx.quadraticCurveTo(0,-8,-13,-4);
        ctx.quadraticCurveTo(-5,0,-13,4);
        ctx.quadraticCurveTo(1,8,18,0);ctx.fill();
        ctx.fillStyle='#fff0bf';ctx.beginPath();ctx.moveTo(14,0);
        ctx.quadraticCurveTo(-1,-3,-5,0);ctx.quadraticCurveTo(-1,4,14,0);ctx.fill();
      }else if(p.kind==='fur'){
        // The basic yarn attack reads as a little thread bundle, not another light ball.
        ctx.rotate(this.t*7+p.ang);
        ctx.fillStyle='#e5c5a9';ctx.beginPath();ctx.ellipse(0,0,p.r*1.1,p.r*.85,0,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='#a6826f';ctx.lineWidth=1.5;
        for(let i=-1;i<=1;i++){
          ctx.beginPath();ctx.ellipse(0,i*2,p.r*.85,p.r*.48,i*.8,0,Math.PI*2);ctx.stroke();
        }
        ctx.beginPath();ctx.moveTo(-p.r,0);ctx.quadraticCurveTo(-p.r*2,5,-p.r*2.5,-3);ctx.stroke();
      }else if(p.kind==='ball'){
        // Wild enemy attacks are narrow warning darts with tails, not pastel pellets.
        ctx.rotate(p.ang);
        ctx.fillStyle=p.color;ctx.beginPath();ctx.moveTo(15,0);
        ctx.lineTo(-6,-7);ctx.lineTo(-3,0);ctx.lineTo(-6,7);ctx.closePath();ctx.fill();
        ctx.strokeStyle='rgba(255,255,255,.8)';ctx.lineWidth=2;
        ctx.beginPath();ctx.moveTo(-2,-10);ctx.lineTo(12,0);ctx.lineTo(-2,10);ctx.stroke();
      }else if(p.kind==='hex'){
        ctx.rotate(this.t*2.6);ctx.strokeStyle='#e8c5ff';ctx.lineWidth=3;
        ctx.beginPath();for(let i=0;i<=6;i++){const a=i*Math.PI/3;
          if(i===0)ctx.moveTo(Math.cos(a)*15,Math.sin(a)*15);
          else ctx.lineTo(Math.cos(a)*15,Math.sin(a)*15);}ctx.stroke();
        ctx.rotate(-this.t*5.2);ctx.beginPath();ctx.arc(0,0,9,0,Math.PI*2);ctx.stroke();
      }else{
        ctx.rotate(p.ang);
        ctx.beginPath();ctx.moveTo(p.r*1.7,0);ctx.lineTo(-p.r*.8,-p.r*.65);
        ctx.lineTo(-p.r*.5,0);ctx.lineTo(-p.r*.8,p.r*.65);ctx.closePath();ctx.fill();
      }
      if(!['claw','leaf','fireball','hex','fur','ball','fish','yarn'].includes(p.kind)){
        ctx.fillStyle='rgba(255,255,255,.9)';ctx.beginPath();ctx.arc(0,0,p.r*.45,0,Math.PI*2);ctx.fill();
      }
      ctx.restore();
    }

    // wild pack — draw every live enemy (back-to-front by y)
    const sorted = this.liveEnemies().slice().sort((a, b) => a.y - b.y);
    for (const e of sorted) {
      // Telegraph warning — distinct shapes so the player can read the threat:
      //   nova    = a RADIAL ring that fills as it charges (dodge outward / away)
      //   barrage = a DIRECTIONAL cone along the aim (dodge sideways out of the line)
      if (e.telegraph > 0) {
        const k = Math.max(0, Math.min(1, 1 - e.telegraph / (e.telegraphMax || 0.8)));  // 0→1 charge
        const pulse = 0.45 + 0.4 * Math.abs(Math.sin(this.t * 14));
        ctx.save();
        if (e.telegraphKind === 'smash') {
          // MUST-DODGE heavy: a fixed-radius red danger disc on the ground where the
          // hit will land, with a shrinking inner reticle that converges at release so
          // the timing is readable. Leave the circle before it closes.
          const tx = (e.smashTarget && e.smashTarget.x) || e.x, ty = (e.smashTarget && e.smashTarget.y) || e.y, R = 86;
          ctx.globalAlpha = pulse * 0.26; ctx.fillStyle = '#ff2d55';
          ctx.beginPath(); ctx.arc(tx, ty, R, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = Math.min(1, pulse + 0.3); ctx.strokeStyle = '#ff2d55'; ctx.lineWidth = 5;
          ctx.beginPath(); ctx.arc(tx, ty, R, 0, Math.PI * 2); ctx.stroke();
          ctx.globalAlpha = pulse; ctx.lineWidth = 3;          // converging inner reticle
          ctx.beginPath(); ctx.arc(tx, ty, R * (1 - k), 0, Math.PI * 2); ctx.stroke();
        } else if (e.telegraphKind === 'nova') {
          const R = 34 + k * 30;
          ctx.globalAlpha = pulse * 0.3;                       // filled danger disc
          ctx.fillStyle = '#ff4d6d';
          ctx.beginPath(); ctx.arc(e.x, e.y, R, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = pulse; ctx.strokeStyle = '#ff4d6d'; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.arc(e.x, e.y, R, 0, Math.PI * 2); ctx.stroke();
        } else if (e.telegraphKind === 'pounce') {
          // ambusher leap: pulsing ring + dashed line to the target it will jump
          ctx.globalAlpha = pulse; ctx.strokeStyle = '#fb745d'; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.arc(e.x, e.y, 30 + k * 26, 0, Math.PI * 2); ctx.stroke();
          ctx.setLineDash([7, 5]);
          const target = this.team.find(f => f.alive);
          if (target) { ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(target.x, target.y); ctx.stroke(); }
          ctx.setLineDash([]);
        } else {
          const aim = e.telegraphAim || 0, half = 0.42, reach = 150 + k * 120;
          ctx.globalAlpha = pulse * 0.28;                      // aimed warning cone
          ctx.fillStyle = e.element ? this.elemColor(e.element) : '#ff7b9c';
          ctx.beginPath(); ctx.moveTo(e.x, e.y);
          ctx.arc(e.x, e.y, reach, aim - half, aim + half); ctx.closePath(); ctx.fill();
          ctx.globalAlpha = pulse; ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 2.5;
          ctx.stroke();
        }
        ctx.restore();
      }
      // CHARGING-BODY tell: while an enemy winds up ANY special, its body glows and
      // trembles harder as release nears, so you can read WHICH cat is about to strike
      // (not just the ground danger zone). Mirrors the player's heavy-skill wind-up.
      if (e.telegraph > 0) {
        const k = Math.max(0, Math.min(1, 1 - e.telegraph / (e.telegraphMax || 0.8)));  // 0→1 charge
        const col = e.telegraphKind === 'smash' ? '#ff2d55'
          : e.telegraphKind === 'nova' ? '#ff4d6d'
          : (e.element ? this.elemColor(e.element) : '#ff7b9c');
        // converging ring that tightens onto the body as the cast completes
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const rad = 46 - 18 * k, puls = 0.35 + 0.45 * Math.abs(Math.sin(this.t * (9 + 12 * k)));
        ctx.globalAlpha = puls * (0.4 + 0.5 * k);
        ctx.strokeStyle = col; ctx.lineWidth = 2 + 3 * k;
        ctx.beginPath(); ctx.arc(e.x, e.y, rad, 0, Math.PI * 2); ctx.stroke();
        // brightening core halo as it nears release
        const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, 30 + 10 * k);
        g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = 0.18 + 0.32 * k; ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(e.x, e.y, 30 + 10 * k, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        // high-charge tremble: a DRAW-ONLY offset (never touches real coords) so the
        // body visibly shakes as release nears. Applied to the body save() below.
        if (k > 0.45) { const j = (k - 0.45) * 5; e._castShakeX = Math.sin(this.t * 55) * j * 0.4; e._castShakeY = Math.cos(this.t * 61) * j * 0.3; }
        else { e._castShakeX = 0; e._castShakeY = 0; }
      } else { e._castShakeX = 0; e._castShakeY = 0; }
      ctx.save();
      if (e._castShakeX || e._castShakeY) ctx.translate(e._castShakeX, e._castShakeY);
      // HIT-FEEL: self-recoil shove (draw-only) + on-hit squash (compress toward ground,
      // springs back). Applied as a transform around the body so the struck cat reacts.
      if (e._recoilX || e._recoilY) ctx.translate(e._recoilX || 0, e._recoilY || 0);
      if (e.hitSquash > 0) {
        const q = e.hitSquash;
        ctx.translate(e.x, e.y + 24 * q); ctx.scale(1 + q * 0.6, 1 - q); ctx.translate(-e.x, -(e.y + 24 * q));
      }
      if(e.phase>0){
        ctx.strokeStyle=e.phase>1?'#ff794f':'#ffc16e';ctx.lineWidth=3;
        ctx.beginPath();ctx.arc(e.x,e.y,31+Math.sin(this.t*4)*3,0,Math.PI*2);ctx.stroke();
      }
      // status color wash (frozen=blue tint, burn=orange, etc.) via a soft overlay ring
      if (e.status) { const k = Object.keys(e.status); if (k.length) { const info = (Skills.TAG_INFO || {})[k[0]]; if (info) { ctx.save(); ctx.globalAlpha = 0.25 + 0.15 * Math.sin(this.t * 6); ctx.fillStyle = info.color; ctx.beginPath(); ctx.ellipse(e.x, e.y + 6, 24, 30, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); } } }
      // CAT-POUNCE PREP (猫味预备动作): while winding up, the body reads like a real cat
      // about to pounce — it crouches (squashes down + widens), its hindquarters waggle
      // side-to-side faster as release nears, and it leans toward the target. Draw-only
      // (translate→squash/lean→translate back); never touches real coords.
      let _pouncePrep = false;
      if (e.telegraph > 0 && !e.frozen) {
        _pouncePrep = true;
        const k = Math.max(0, Math.min(1, 1 - e.telegraph / (e.telegraphMax || 0.8)));
        const crouch = 0.10 + 0.12 * k;                       // squash amount grows with charge
        const wig = Math.sin(this.t * (7 + 16 * k)) * (2 + 5 * k) * e.face;   // butt waggle, intensifies
        const aimLean = (e.telegraphAim != null ? Math.cos(e.telegraphAim) : e.face) * 3 * k;
        ctx.save();
        ctx.translate(e.x + aimLean + wig * 0.5, e.y + 33 * crouch);   // keep paws planted while squashing
        ctx.scale(1 + crouch * 0.5, 1 - crouch);              // wider + lower = coiled to spring
        ctx.translate(-e.x, -(e.y + 33 * crouch));
      }
      window.CatBondWardArt?.draw(ctx,e,e.x,e.y,this.t,this.catScale('enemy'),'back');
      (window.CatMotion?.draw||CatArt.drawCat)(ctx,e.x,e.y,{
        species:e.sp,scale:this.catScale('enemy'),face:e.face,t:e.t,
        stride:e.stride,motion:e.motion||0,
        pose:e.frozen?'idle':e.pose,
        mood:e.frozen?'sleepy':((e.hp/e.maxhp<.28)?'sleepy':'alert')
      });
      if (_pouncePrep) ctx.restore();
      // WHITE connect-flash: an additive white bloom over the body for 1-2 frames so a
      // landed hit POPS (replaces the old translucent fade that read as "vanish").
      if (e.hitWhite > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const a = Math.min(1, e.hitWhite / 0.09);
        const r = 30 * this.catScale('enemy') / 0.62;
        const g = ctx.createRadialGradient(e.x, e.y - 6, 0, e.x, e.y - 6, r);
        g.addColorStop(0, 'rgba(255,255,255,' + (0.9 * a) + ')');
        g.addColorStop(0.6, 'rgba(255,255,255,' + (0.35 * a) + ')');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(e.x, e.y - 6, r, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      window.CatBondWardArt?.draw(ctx,e,e.x,e.y,this.t,this.catScale('enemy'),'front');
      this.drawControlOverlay(ctx, e);                     // persistent CC markers over the body
      // 虚弱 stagger: a pulsing gold ring + dizzy mark so the open window reads clearly
      if (e.staggerT > 0) {
        ctx.save();
        ctx.globalAlpha = 0.5 + 0.4 * Math.abs(Math.sin(this.t * 10));
        ctx.strokeStyle = '#ffd36b'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(e.x, e.y, 30 + 3 * Math.sin(this.t * 10), 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#ffd36b'; ctx.font = '13px system-ui'; ctx.textAlign = 'center';
        ctx.fillText('💫', e.x, e.y - 48);
        ctx.restore();
      }
      ctx.restore();
      // locked-target reticle: show who you're focusing (rotates for life)
      if (this._lockIdx === e.i) {
        ctx.save();
        ctx.translate(e.x, e.y); ctx.rotate(this.t * 1.5);
        ctx.strokeStyle = '#ffd36b'; ctx.lineWidth = 2.5; ctx.globalAlpha = 0.9;
        const R = 30;
        for (let q = 0; q < 4; q++) {
          ctx.rotate(Math.PI / 2);
          ctx.beginPath(); ctx.arc(0, 0, R, -0.35, 0.35); ctx.stroke();
        }
        ctx.restore();
      }
      // commander focus-fire marker: the enemy the whole squad is ordered onto.
      if (this.autoMode && this.commandTarget?.id === e.i) {
        ctx.save();
        const pulse = 0.5 + 0.4 * Math.abs(Math.sin(this.t * 5));
        ctx.globalAlpha = pulse; ctx.strokeStyle = '#ff5a7a'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(e.x, e.y, 34 + 3 * Math.sin(this.t * 5), 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = pulse; ctx.fillStyle = '#ff5a7a'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('🎯 集火', e.x, e.y - 98);
        ctx.restore();
      }
      const elemSym = this.elemSymbol(e.element);
      this.hpTag(ctx, e.x, e.y - 78, e.hp / e.maxhp, GameData.RARITY[e.sp.rarity].color,
        `${elemSym} ${e.sp.name} Lv.${e.level}`, {current:e.poise,max:e.poiseMax,stagger:e.staggerT,recovering:e.poiseRecovering});
      // Compact status grid BELOW the HP + poise card. Lift the card to reserve
      // two rows between its bottom edge and the cat's head.
      if (e.status) {
        const TAG=Skills.TAG_INFO||{};
        const icons={burn:'🔥',soak:'💧',shock:'⚡',oil:'🛢️',chill:'❄️',
          bleed:'🩸',blind:'🌀',bind:'🌿',expose:'❗',
          weaken:'🔻',rust:'🪓'};
        const priority=['chill','bind','shock','expose','rust',
          'blind','weaken','burn','bleed','soak','oil'];
        const shown=Object.keys(e.status)
          .filter(tg=>e.status[tg]>0&&icons[tg])
          .sort((a,b)=>priority.indexOf(a)-priority.indexOf(b)).slice(0,8);
        ctx.save();ctx.font='11px sans-serif';ctx.textAlign='center';
        shown.forEach((tg,i)=>{
          const row=Math.floor(i/4), col=i%4;
          const inRow=Math.min(4,shown.length-row*4);
          const ix=e.x+(col-(inRow-1)/2)*19,iy=e.y-36+row*18;
          ctx.fillText(icons[tg],ix,iy);
          const info=TAG[tg];
          const frac=info?.ttl?Math.max(0,Math.min(1,e.status[tg]/info.ttl)):0;
          if(frac>0){
            ctx.strokeStyle=info?.color||'#fff';ctx.lineWidth=1.5;
            ctx.beginPath();ctx.arc(ix,iy+3,7,-Math.PI/2,-Math.PI/2+frac*Math.PI*2);ctx.stroke();
          }
        });
        ctx.restore();
      }
    }

    // ALL alive team cats on the field (active highlighted, allies slightly dimmer)
    const teamSorted = this.team.filter(t => t.alive).slice().sort((a, b) => a.y - b.y);
    for (const tf of teamSorted) {
      const isMe = tf === this.me();
      const sp2 = GameData.speciesById(tf.cat.species);
      const fAim = isMe ? this.aim : (tf._aim || 0);
      const route=this.duoRun?.runners.find(r=>r.uid===tf.cat.uid);
      let visualX=tf.x,visualY=tf.y,visualPose=(tf.pounce||tf._leapT>0)?'play':(tf.moving?'walk':'idle');
      const hop=tf._hop||0;                                   // 泰山压顶 arc lift (body rises, shadow stays)
      if(route){
        const pct=Math.min(1,this.duoRun.age/this.duoRun.duration);
        // Outbound full-speed sprint, a contact leap, then a planted return.
        const outbound=pct<.70;
        const alpha=pct<.15?0:pct<.51?(pct-.15)/.36:pct<.70?1:Math.max(0,1-(pct-.70)/.30);
        const eased=Math.sin(Math.max(0,Math.min(1,alpha))*Math.PI*.5);
        visualX=outbound?route.fromX+(route.toX-route.fromX)*eased
          :route.fromX+(route.toX-route.fromX)*eased;
        visualY=outbound?route.fromY+(route.toY-route.fromY)*eased
          :route.fromY+(route.toY-route.fromY)*eased;
        visualPose=pct>.51&&pct<.70?'play':pct<.15?'idle':'run';
      }
      // HIT-FEEL: self-recoil shove on the struck cat (draw-only).
      if (tf._recoilX) visualX += tf._recoilX;
      if (tf._recoilY) visualY += tf._recoilY;
      ctx.save();
      // Never fade the kitten itself for hit i-frames or for being a teammate:
      // half-transparent coats make faces look grey/black over battlefield VFX.
      // Keep hit feedback in a small ground-level marker below instead.
      ctx.globalAlpha = 1;
      // HIT-FEEL on-hit squash (compress + spring back), draw-only around the body.
      if (tf.hitSquash > 0) {
        const q = tf.hitSquash;
        ctx.translate(visualX, visualY + 22 * q); ctx.scale(1 + q * 0.6, 1 - q); ctx.translate(-visualX, -(visualY + 22 * q));
      }
      // active cat gets a soft golden ground ring so you know who you control
      if (isMe) {
        // A clear grounded control marker; never obscure the kitten face.
        ctx.fillStyle='rgba(255,210,102,.20)';
        ctx.strokeStyle='rgba(225,154,54,.78)';ctx.lineWidth=2.5;
        ctx.beginPath();ctx.ellipse(visualX,visualY+5,35,10,0,0,Math.PI*2);
        ctx.fill();ctx.stroke();
      }
      // airborne shadow for a leap: a shrinking blob under the rising cat
      if (hop>1) { const s=Math.max(0.3,1-hop/70); ctx.fillStyle='rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(visualX,visualY+5,20*s,5*s,0,0,Math.PI*2); ctx.fill(); }
      const visualFace=route?(route.toX-route.fromX)*(this.duoRun.age/this.duoRun.duration<.70?1:-1)<0?-1:1
        :(tf.face||(Math.cos(fAim)<0?-1:1));
      visualY-=hop;
      window.CatBondWardArt?.draw(ctx,tf,visualX,visualY,this.t,this.catScale(isMe?'active':'ally'),'back');
      (window.CatMotion?.draw||CatArt.drawCat)(ctx,visualX,visualY,{
        species:sp2,scale:this.catScale(isMe?'active':'ally'),face:visualFace,t:tf.t||this.t,
        pose:visualPose,motion:route?1:(tf.moving?.86:0),
        stride:route?this.duoRun.age*26:tf.t*13,mood:'happy',
        growth:window.Growth?.visual(tf.cat)||null
      });
      if (tf.inv > 0) {
        // Invulnerability cue is OUTSIDE the cat face: no ghosting/dark mask.
        ctx.save();
        ctx.globalAlpha = .55;
        ctx.strokeStyle = '#fff2c6';
        ctx.lineWidth = 1.7;
        ctx.setLineDash([3,5]);
        ctx.beginPath();
        ctx.ellipse(visualX,visualY+7,31,9,0,0,Math.PI*2);
        ctx.stroke();
        ctx.restore();
      }
      // WHITE connect-flash on a struck player cat (additive bloom, not a vanish-fade).
      if (tf.hitWhite > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const a = Math.min(1, tf.hitWhite / 0.09), r = 30 * this.catScale(isMe?'active':'ally') / 0.62;
        const g = ctx.createRadialGradient(visualX, visualY - 6, 0, visualX, visualY - 6, r);
        g.addColorStop(0, 'rgba(255,255,255,' + (0.9 * a) + ')');
        g.addColorStop(0.6, 'rgba(255,255,255,' + (0.35 * a) + ')');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(visualX, visualY - 6, r, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      window.CatBondWardArt?.draw(ctx,tf,visualX,visualY,this.t,this.catScale(isMe?'active':'ally'),'front');
      // Player cats also display persistent burn/shock/bleed/exposure instead
      // of an invisible debuff that only exists in damage numbers.
      window.CatBondSkillFX?.drawStatus(ctx,tf,this.t);
      ctx.restore();
      // Player HP/ult now live in the sleek top-left squad panel (drawSquadPanel),
      // not floating over the cat. Keep only a tiny active-cat chevron so you can
      // tell at a glance which kitten you're driving.
      if (isMe) {
        ctx.save(); ctx.globalAlpha = 0.9; ctx.fillStyle = '#ffd36b'; ctx.textAlign = 'center';
        ctx.font = '12px system-ui, sans-serif';
        const grownScale=window.Growth?.visual(tf.cat)?.scale||1;
        ctx.fillText('▾', tf.x, tf.y - Math.max(51,this.catScale('active')*72*grownScale) + 2 * Math.sin(this.t * 4));
        ctx.restore();
      }
    }

    // Distinct ULT glints above combatants, below damage floaters and HUD.
    for(const v of this.skillStrokes){
      if(v.kind==='ultimate')window.CatBondUltVFX?.draw(ctx,v,W,H,this.t,'front');
    }
    // particles & floaters
    for (const q of this.particles) { ctx.save(); ctx.globalAlpha = Math.max(0, q.life); ctx.fillStyle = q.color; ctx.font = `${q.size}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText(q.ch, q.x, q.y); ctx.restore(); }
    for(const fl of this.floaters){
      const age=1-Math.max(0,Math.min(1,fl.life/(fl.max||.62)));
      const kick=1+.21*Math.sin(Math.min(1,age*4)*Math.PI);
      ctx.save();ctx.globalAlpha=Math.min(1,Math.max(0,fl.life/.20));
      ctx.fillStyle=fl.color;
      ctx.font='900 '+Math.round((fl.size||15)*kick)+'px sans-serif';
      ctx.textAlign='center';ctx.lineWidth=3;
      ctx.strokeStyle='rgba(34,30,41,.55)';
      ctx.strokeText(fl.text,fl.x,fl.y);ctx.fillText(fl.text,fl.x,fl.y);
      ctx.restore();
    }

    // Capture-ready finisher banner (one-time pop when a wild cat enters subdue range).
    if(this._captureBanner>0){
      const k=Math.min(1,this._captureBanner/1.2),pop=1+0.2*Math.sin((1-k)*Math.PI);
      const en=window.MorrowwishI18n?.get?.()!=='zh';
      ctx.save(); ctx.globalAlpha=Math.min(1,k*1.3); ctx.textAlign='center';
      ctx.font='900 '+((this.game.isTouch?26:36)*pop)+'px system-ui, sans-serif';
      ctx.fillStyle='#ffd36b'; ctx.shadowColor='#ff9b3c'; ctx.shadowBlur=18;
      ctx.fillText(en?'FINISH IT!':'收服它！',W/2,this.topMargin+70);
      ctx.restore();
    }
    // CAPTURE sequence overlay (你不是打死它，是收服它): the subdued wild cat is no
    // longer in liveEnemies(), so draw it here — sitting calmly — while a warm glow
    // pulls it home. A soft vignette + bilingual "收服成功" banner seals the moment.
    if(this.captureSeq){
      const s=this.captureSeq,k=1-s.t/s.max,en=window.MorrowwishI18n?.get?.()!=='zh';
      ctx.save();
      // warm vignette
      ctx.fillStyle='rgba(40,30,16,'+(0.18*Math.sin(Math.PI*k))+')';ctx.fillRect(0,0,W,H);
      // the captured cat, sitting, with a gentle breathing bob
      if(s.sp){
        const bob=Math.sin(this.t*3)*2;
        ctx.save();ctx.globalAlpha=Math.max(0,1-k*0.15);
        (window.CatMotion?.draw||CatArt.drawCat)(ctx,s.x,s.y+bob,{
          species:s.sp,scale:this.catScale(),face:-1,t:this.t,
          stride:0,motion:0,pose:'idle',mood:'happy'});
        ctx.restore();
      }
      // converging halo of light around it
      ctx.globalCompositeOperation='lighter';
      const rr=70*(1-k)+20,puls=0.5+0.4*Math.abs(Math.sin(this.t*6));
      const g=ctx.createRadialGradient(s.x,s.y,0,s.x,s.y,rr);
      g.addColorStop(0,'rgba(255,211,107,'+(0.35*puls)+')');g.addColorStop(1,'rgba(255,211,107,0)');
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(s.x,s.y,rr,0,Math.PI*2);ctx.fill();
      ctx.globalCompositeOperation='source-over';
      // banner
      const pop=1+0.18*Math.sin(k*Math.PI);
      ctx.globalAlpha=Math.min(1,k*2);ctx.textAlign='center';
      ctx.font='900 '+((this.game.isTouch?24:34)*pop)+'px system-ui, sans-serif';
      ctx.fillStyle='#ffd36b';ctx.shadowColor='#ff9b3c';ctx.shadowBlur=18;
      ctx.fillText(en?'🏠 TAMED!':'🏠 收服成功！',W/2,this.topMargin+70);
      ctx.restore();
    }
    // Ult-ready announcement banner (one-time when the meter first fills).
    if(this._ultReadyBanner>0){
      const k=Math.min(1,this._ultReadyBanner/1.4);
      const en=window.MorrowwishI18n?.get?.()!=='zh';
      ctx.save(); ctx.globalAlpha=Math.min(1,k*1.4); ctx.textAlign='center';
      ctx.font='900 '+(this.game.isTouch?22:30)+'px system-ui, sans-serif';
      ctx.fillStyle='#9d7bff'; ctx.shadowColor='#c3a6ff'; ctx.shadowBlur=16;
      ctx.fillText(en?'⚡ ULTIMATE READY — press R':'⚡ 必杀就绪 — 按 R 释放',W/2,this.topMargin+44);
      ctx.restore();
    }
    // Ultimate RESULT banner — scaled to what the ult actually did (total dmg + KOs).
    if(this._ultResultBanner>0){
      const span=this._ultResultText.includes('×')||this._ultResultText.includes('KO')?2.0:1.4;
      const k=Math.min(1,this._ultResultBanner/span),pop=1+0.18*Math.sin((1-k)*Math.PI);
      ctx.save(); ctx.globalAlpha=Math.min(1,k*1.5); ctx.textAlign='center';
      ctx.font='900 '+((this.game.isTouch?24:34)*pop)+'px system-ui, sans-serif';
      ctx.fillStyle=this._ultResultColor; ctx.shadowColor=this._ultResultColor; ctx.shadowBlur=20;
      ctx.fillText(this._ultResultText,W/2,this.topMargin+104);
      ctx.restore();
    }
    // MASH-STALL teach banner: tell a basic-only player to use a skill to break guard.
    if(this._stallBanner>0){
      const k=Math.min(1,this._stallBanner/1.2),pulse=0.6+0.4*Math.abs(Math.sin(this.t*6));
      const en=window.MorrowwishI18n?.get?.()!=='zh';
      ctx.save();ctx.globalAlpha=Math.min(1,k*1.5)*pulse;ctx.textAlign='center';
      ctx.font='900 '+(this.game.isTouch?20:27)+'px system-ui, sans-serif';
      ctx.fillStyle='#ffd36b';ctx.shadowColor='#ff9b3c';ctx.shadowBlur=16;
      ctx.fillText(en?'Use a SKILL (Q/E) to break its guard!':'用技能 (Q/E) 破防才能收服！',W/2,this.topMargin+150);
      ctx.restore();
    }
    // Compact combo badge instead of huge layered text across the cats.
    if(this.combo>=2){
      ctx.save();
      const x=W-56,y=Math.max(this.topMargin+60,115);
      ctx.globalAlpha=.67+.25*Math.max(0,this.comboT)/1.3;
      ctx.fillStyle='rgba(45,58,64,.54)';
      ctx.beginPath();ctx.roundRect(x-32,y-17,65,29,12);ctx.fill();
      ctx.textAlign='center';ctx.font='800 15px system-ui';ctx.fillStyle='#ffe0a3';
      ctx.fillText('×'+this.combo,x,y+3);
      ctx.strokeStyle='#ffe0a3';ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(x,y,21,-Math.PI/2,-Math.PI/2+2*Math.PI*Math.max(0,this.comboT)/1.3);ctx.stroke();
      ctx.restore();
    }

    // ---- virtual joystick (touch) ----
    const joy = this.game.joystick;
    if (joy && joy.active) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(joy.ox, joy.oy, 46, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(255,211,107,0.55)';
      ctx.beginPath(); ctx.arc(joy.ox + joy.dx * 46, joy.oy + joy.dy * 46, 22, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    } else if (this.game.isTouch && this.combo < 2) {
      // hint on touch devices
      ctx.save(); ctx.globalAlpha = 0.4; ctx.fillStyle = '#fff'; ctx.font = '12px system-ui'; ctx.textAlign = 'center';
      // First-fight tutorial and the virtual joystick already explain touch controls.
      ctx.restore();
    }

    // The final cut-in is composited in screen coordinates, even when the
    // underlying combat scene has a small directional hit shake.
    ctx.save();
    ctx.translate(-_shx,-_shy);
    this.drawCatCutin(ctx,W,H);
    ctx.restore();
    ctx.restore();
  }

  // Persistent, distinct markers drawn over a controlled enemy's body so a
  // crowd-control state reads at a glance for its whole (now-longer) duration.
  drawControlOverlay(ctx, e) {
    if (!e.status) return;
    const s = e.status, T = this.t;
    ctx.save();
    // Controls must remain obvious without painting vines/snowflakes over
    // the original watercolor cat's EYES. The previous stacked full-body
    // vines and freeze shell visibly hid the breed-specific face on phones.
    if(s.chill!=null){
      ctx.globalAlpha=.49;ctx.strokeStyle='#a9daf0';ctx.lineWidth=2;
      ctx.beginPath();ctx.ellipse(e.x,e.y+21,25,7,0,0,Math.PI*2);ctx.stroke();
      ctx.globalAlpha=.72;ctx.fillStyle='#e7f8ff';ctx.font='12px system-ui';
      ctx.textAlign='center';ctx.fillText('❄',e.x-31,e.y+13);
      ctx.fillText('❄',e.x+31,e.y+13);
    }
    if(s.bind!=null){
      // Two thin ground-level roots, never three chest/face-wrapping hoops.
      ctx.globalAlpha=.48;ctx.strokeStyle='#6abb73';ctx.lineWidth=2;
      ctx.beginPath();ctx.ellipse(e.x,e.y+21,25,8,0,0,Math.PI*2);ctx.stroke();
      ctx.beginPath();ctx.arc(e.x-26,e.y+17,8,-1.1,.6);ctx.stroke();
      ctx.beginPath();ctx.arc(e.x+26,e.y+17,8,2.5,4.4);ctx.stroke();
    }
    if (s.blind != null) {                 // Blinded: visible ground ring instead of ugly black face.
      ctx.globalAlpha = .73;ctx.strokeStyle = '#b49bdb';ctx.lineWidth = 2.2;
      ctx.beginPath();ctx.ellipse(e.x,e.y + 14,29,9,0,0,Math.PI*2);ctx.stroke();
      ctx.globalAlpha = .88;ctx.fillStyle = '#dcc9f2';ctx.font = '13px system-ui,sans-serif';
      ctx.textAlign = 'center';ctx.fillText('✧',e.x-28,e.y+7);ctx.fillText('✧',e.x+28,e.y+7);
    }
    window.CatBondSkillFX?.drawStatus(ctx,e,this.t);
    ctx.restore();
  }

  // Aggregate pack 斗志 (morale/HP) bar at the top — makes the win condition
  // legible: the player always sees how close the whole pack is to being tamed.
  // Live AIM PREVIEW for the active cat: a trajectory line for directional skills
  // and a landing impact-zone circle for lob/placed AOE, so the player can see
  // where a skill will go/land BEFORE committing. Only on manual control.
  drawAimPreview(ctx) {
    if (this.autoMode || this.ultCinematic) return;
    const f = this.me(); if (!f || !f.alive) return;
    const aim = this.aim || 0;
    // which off-cooldown offensive skill is the player most likely about to fire?
    const q = f.qSkill, e = f.eSkill;
    const readyLob = (sk, cd) => sk && sk.kind === 'aoe' && cd <= 0;
    const readyDir = (sk, cd) => sk && (sk.kind === 'projectile' || sk.kind === 'chain') && cd <= 0;
    // landing-zone preview for a lob AOE (prefer Q, then E)
    const lob = readyLob(q, f.cd.q) ? q : readyLob(e, f.cd.e) ? e : null;
    if (lob) {
      const col = this.elemColor(lob.element);
      let tx, ty;
      if (!this.game.isTouch) { const mo = this.game.mouse || {}; tx = mo.x; ty = mo.y; }
      else { const tgt = this.lockedEnemy() || this.nearestEnemy(f.x, f.y); if (tgt) { tx = tgt.x; ty = tgt.y; } else { tx = f.x + Math.cos(aim) * 240; ty = f.y + Math.sin(aim) * 240; } }
      ctx.save();
      // dashed arc from caster to landing point
      ctx.strokeStyle = withAlpha(col, 0.5); ctx.lineWidth = 2; ctx.setLineDash([4, 6]);
      ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(tx, ty); ctx.stroke(); ctx.setLineDash([]);
      // impact zone (radius 86 matches lobAoe R)
      const pulse = 0.35 + 0.2 * Math.abs(Math.sin(this.t * 4));
      ctx.globalAlpha = pulse; ctx.fillStyle = withAlpha(col, 0.18); ctx.beginPath(); ctx.arc(tx, ty, 86, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.8; ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
      ctx.beginPath(); ctx.arc(tx, ty, 86, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      ctx.restore();
      return;
    }
    // trajectory line for a directional projectile/chain skill
    const dir = readyDir(q, f.cd.q) ? q : readyDir(e, f.cd.e) ? e : null;
    if (dir) {
      const col = this.elemColor(dir.element);
      const len = 300;
      ctx.save();
      ctx.strokeStyle = withAlpha(col, 0.45); ctx.lineWidth = 2.5; ctx.setLineDash([10, 8]);
      ctx.beginPath(); ctx.moveTo(f.x, f.y);
      ctx.lineTo(f.x + Math.cos(aim) * len, f.y + Math.sin(aim) * len); ctx.stroke();
      ctx.setLineDash([]);
      // arrowhead
      const ex = f.x + Math.cos(aim) * len, ey = f.y + Math.sin(aim) * len;
      ctx.fillStyle = withAlpha(col, 0.8); ctx.translate(ex, ey); ctx.rotate(aim);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-12, -6); ctx.lineTo(-12, 6); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }

  // Hero portraits reuse actual breed artwork; no floating stickers or generic globes.
  cinematicPortrait(uid) {
    if(!uid)return null;
    if(this._cinematicPortraits.has(uid))return this._cinematicPortraits.get(uid);
    const fighter=this.team.find(f=>f.cat.uid===uid)||this._benchFighters.get(uid);
    const cat=fighter?.cat||this.reserve.find(c=>c.uid===uid);
    const species=cat&&GameData.speciesById(cat.species);
    if(!species||!window.CatArt?.renderCatThumb)return null;
    const canvas=document.createElement('canvas');
    canvas.width=200;canvas.height=180;
    CatArt.renderCatThumb(canvas,species,cat);
    this._cinematicPortraits.set(uid,canvas);
    return canvas;
  }
  drawCatCutin(ctx,W,H){
    let c=this.ultCinematic,duo=false;
    if(!c&&this.duoCinematic?.t>0){c=this.duoCinematic;duo=true;}
    if(!c&&this.spotlightCinematic&&Date.now()<this.spotlightCinematic.endsAt)
      c={...this.spotlightCinematic,t:(this.spotlightCinematic.endsAt-Date.now())/1000};
    if(!c)return;
    const progress=Math.max(0,Math.min(1,1-c.t/c.max));
    const opacity=Math.min(1,progress*7,(1-progress)*3.5);
    if(opacity<=.02)return;
    const en=window.MorrowwishI18n?.get?.()!=='zh';
    const bandY=Math.max(this.topMargin*.65,H*.18),bandH=Math.min(H*.55,290);
    const artSize=Math.min(duo?W*.32:W*.43,bandH*.83,duo?188:236);
    ctx.save();ctx.globalAlpha=opacity;
    // Soft stage lighting instead of the legacy hard-edged rectangular card.
    // The portrait and skill title can still read over the live battlefield.
    const stageCenterY=bandY+bandH*.49;
    const grad=ctx.createRadialGradient(W*.5,stageCenterY,bandH*.12,
      W*.5,stageCenterY,Math.max(W*.63,bandH*.9));
    grad.addColorStop(0,'rgba(43,52,70,.75)');
    grad.addColorStop(.55,'rgba(54,61,83,.40)');
    grad.addColorStop(1,'rgba(43,52,70,0)');
    ctx.fillStyle=grad;
    ctx.fillRect(0,0,W,H);
    const drawPortrait=(uid,x,flip=false)=>{
      const art=this.cinematicPortrait(uid);if(!art)return;
      const centerY=bandY+bandH*.43;
      ctx.save();ctx.translate(x,centerY);
      if(flip)ctx.scale(-1,1);
      const radius=artSize*.58;
      ctx.fillStyle='rgba(248,242,222,.94)';
      ctx.beginPath();ctx.ellipse(0,0,radius,radius*.90,0,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=c.color||c.first||'#f7cfa5';ctx.lineWidth=4;
      ctx.beginPath();ctx.ellipse(0,0,radius,radius*.90,0,0,Math.PI*2);ctx.stroke();
      ctx.drawImage(art,-artSize*.5,-artSize*.48,artSize,artSize*.9);
      ctx.restore();
    };
    if(duo){
      drawPortrait(c.catUids?.[0],W*.27);
      drawPortrait(c.catUids?.[1],W*.73,true);
      // Two cats crouch, cross their paths, then pounce together.
      const leap=Math.max(0,Math.min(1,progress*2.5));
      ctx.strokeStyle=c.second||'#e7bafb';ctx.lineWidth=4;ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(W*.39,bandY+bandH*.53);
      ctx.quadraticCurveTo(W*.5,bandY+bandH*(.12+.1*leap),W*.61,bandY+bandH*.53);ctx.stroke();
      ctx.fillStyle='#fce9c6';ctx.font='900 '+Math.round(Math.min(32,W*.08))+'px system-ui';
      ctx.textAlign='center';ctx.fillText('×',W*.5,bandY+bandH*.49);
    }else{
      drawPortrait(c.uid,W*.32);
      const target=this.liveEnemies().find(e=>e.i===c.targetUid);
      const tx=W*.73,ty=bandY+bandH*.43,rad=Math.min(29,W*.08);
      ctx.strokeStyle='#ffe4a1';ctx.lineWidth=3;
      ctx.beginPath();ctx.arc(tx,ty,rad,0,Math.PI*2);ctx.stroke();
      ctx.beginPath();ctx.moveTo(tx-rad-10,ty);ctx.lineTo(tx-rad+8,ty);
      ctx.moveTo(tx+rad-8,ty);ctx.lineTo(tx+rad+10,ty);
      ctx.moveTo(tx,ty-rad-10);ctx.lineTo(tx,ty-rad+8);
      ctx.moveTo(tx,ty+rad-8);ctx.lineTo(tx,ty+rad+10);ctx.stroke();
      if(target){ctx.font='800 12px system-ui';ctx.textAlign='center';ctx.fillStyle='#fff2d4';
        ctx.fillText(en?'TARGET LOCK':'目标锁定',tx,ty+rad+22);}
    }
    const label=duo?(en?'DUO BOND · DOUBLE POUNCE':'双猫默契 · 合力飞扑')
      :(en?'ULTIMATE · PAW POWER':'必杀 · 猫爪出击');
    const title=c.name||label;
    ctx.textAlign='center';ctx.shadowColor=c.color||c.first||'#f9dba8';
    ctx.shadowBlur=12;ctx.fillStyle='#fff9ef';
    ctx.font='900 '+Math.round(Math.min(duo?22:28,W*.055))+'px system-ui';
    ctx.fillText(title,W*.5,bandY+bandH*.89,W*.82);
    ctx.shadowBlur=0;ctx.fillStyle='#edd6a5';
    ctx.font='800 '+Math.round(Math.min(13,W*.033))+'px system-ui';
    ctx.fillText(label,W*.5,bandY+bandH*.97,W*.82);
    ctx.restore();
  }

  // Full-screen ultimate cinematic: letterbox + radial zoom lines + element-themed
  // energy ring that charges to the impact beat, a white flash at detonation, then
  // the skill name. Three acts over ~3s: wind-up → impact → afterglow.
  drawUltCinematic(ctx, W, H) {
    const c = this.ultCinematic; if (!c) return;
    const elapsed = c.max - c.t, k = elapsed / c.max;
    const caster = this.team.find(f => f.cat.uid === c.uid) || this.me();
    const cx = caster ? caster.x : W / 2, cy = caster ? caster.y : H / 2;
    const col = c.color, en = window.MorrowwishI18n?.get?.() !== 'zh';
    ctx.save();
    // 1) vignette darken (eases in, holds, eases out)
    const dark = Math.sin(Math.min(1, k * 1.3) * Math.PI) * 0.62;
    ctx.fillStyle = `rgba(14,8,22,${dark})`; ctx.fillRect(0, 0, W, H);
    // 2) cinematic letterbox bars
    const bar = Math.min(1, elapsed / 0.4) * (c.t < 0.5 ? c.t / 0.5 : 1) * (H * 0.09);
    ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, W, bar); ctx.fillRect(0, H - bar, W, bar);
    // 3) speed lines rushing toward the caster during wind-up
    if (elapsed < c.impactAt) {
      const wind = elapsed / c.impactAt;
      ctx.globalAlpha = 0.5 * (1 - wind); ctx.strokeStyle = col; ctx.lineWidth = 2;
      for (let i = 0; i < 20; i++) {
        const a = (i / 20) * Math.PI * 2 + this.t * 0.8, r0 = 520 * (1 - wind) + 60, r1 = r0 - 120;
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
        ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.stroke();
      }
      // charging ring
      ctx.globalAlpha = 0.85; ctx.strokeStyle = col; ctx.lineWidth = 5 + 6 * wind;
      ctx.beginPath(); ctx.arc(cx, cy, 30 + 70 * wind, 0, Math.PI * 2 * wind); ctx.stroke();
    }
    // 4) detonation flash + expanding shock at the impact beat
    const sinceImpact = elapsed - c.impactAt;
    if (sinceImpact >= 0 && sinceImpact < 0.9) {
      const f = sinceImpact / 0.9;
      ctx.globalAlpha = (1 - f) * 0.85; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1 - f; ctx.strokeStyle = col; ctx.lineWidth = 14 * (1 - f) + 2;
      ctx.beginPath(); ctx.arc(cx, cy, 40 + f * Math.max(W, H), 0, Math.PI * 2); ctx.stroke();
    }
    // 5) skill name banner
    ctx.globalAlpha = Math.min(1, elapsed / 0.35) * (c.t < 0.6 ? c.t / 0.6 : 1);
    ctx.textAlign = 'center';
    ctx.font = `900 ${this.game.isTouch ? 30 : 42}px system-ui, sans-serif`;
    ctx.shadowColor = col; ctx.shadowBlur = 24;
    ctx.fillStyle = '#fff';
    ctx.fillText(c.name, W / 2, H * 0.5);
    ctx.shadowBlur = 0; ctx.globalAlpha = (ctx.globalAlpha) * 0.9;
    ctx.font = `700 ${this.game.isTouch ? 12 : 15}px system-ui, sans-serif`;
    ctx.fillStyle = col;
    ctx.fillText(en ? 'ULTIMATE' : '必 杀 技', W / 2, H * 0.5 + (this.game.isTouch ? 26 : 34));
    ctx.restore();
  }

  drawPackMorale(ctx, W) {
    // The always-visible DOM HP track sits below the global utility toolbar.
    // Suppress the old world-space copy, which rendered under that toolbar
    // and gave the impression that the enemy had no HP.
    if(document.querySelector?.('#battle-ui.on .battle-enemy-track'))return;
    const live = this.liveEnemies();
    if (!live.length) return;
    let hp = 0, max = 0;
    for (const e of this.enemies) { max += e.maxhp; if (e.alive) hp += e.hp; }
    const frac = max ? Math.max(0, Math.min(1, hp / max)) : 0;
    const zh = window.MorrowwishI18n?.get?.() === 'zh';
    const bw = Math.min(360, W - 120), bx = (W - bw) / 2, by = 16, bh = 12;
    const ready = this.captureReady;
    ctx.save();
    ctx.textAlign = 'center'; ctx.font = '700 11px system-ui, sans-serif';
    ctx.fillStyle = ready ? '#ffd36b' : 'rgba(255,250,239,.95)';
    ctx.fillText(ready ? (zh ? '斗志将尽 · 收服它！' : 'Almost tamed — capture it!') : (zh ? '野猫斗志' : 'Wild morale'), W / 2, by - 3);
    // track
    ctx.fillStyle = 'rgba(20,12,30,0.55)'; rr(ctx, bx - 2, by - 2, bw + 4, bh + 4, 8); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.14)'; rr(ctx, bx, by, bw, bh, 6); ctx.fill();
    // fill (turns gold when capture-ready)
    const col = ready ? '#ffd36b' : (frac > 0.5 ? '#ff6b8a' : '#ff9db0');
    ctx.fillStyle = col; rr(ctx, bx, by, bw * frac, bh, 6); ctx.fill();
    if (ready) { ctx.globalAlpha = 0.4 + 0.4 * Math.abs(Math.sin(this.t * 8)); ctx.strokeStyle = '#ffd36b'; ctx.lineWidth = 2; rr(ctx, bx - 2, by - 2, bw + 4, bh + 4, 8); ctx.stroke(); }
    ctx.restore();
  }

  hpTag(ctx, x, y, frac, color, label, poise=null) {
    // Enemy health cards show a WIDER, THICKER poise meter than HP.
    // Display-only: restored warm gold poise; red while staggered/broken.
    const w=86,h=6,poiseW=96,poiseH=5,cardW=poise?poiseW+10:w+14;
    ctx.save();
    ctx.fillStyle='rgba(255,250,239,.94)';
    ctx.strokeStyle='rgba(114,124,101,.28)';
    ctx.lineWidth=1;
    rr(ctx,x-cardW/2,y-23,cardW,poise?52:36,12);ctx.fill();ctx.stroke();
    ctx.textAlign='center';ctx.font='700 11px system-ui, sans-serif';
    ctx.fillStyle='#4d5b49';ctx.fillText(label,x,y-9);
    ctx.fillStyle='rgba(112,132,110,.16)';
    rr(ctx,x-w/2,y-3,w,h,3);ctx.fill();
    const health=Math.max(0,Math.min(1,frac));
    if(health>0){
      ctx.fillStyle=health>.3?'#8fbb9d':'#e7a38d';
      rr(ctx,x-w/2,y-3,w*health,h,3);ctx.fill();
    }
    if(poise && poise.max>0){
      const broken=(poise.stagger||0)>0;
      const shattered=(poise.current||0)<=0;
      const amount=shattered?0:Math.max(0,Math.min(1,poise.current/poise.max));
      const yy=y+5;
      ctx.fillStyle=(broken||shattered)?'rgba(210,95,90,.19)':'rgba(205,161,65,.24)';
      rr(ctx,x-poiseW/2,yy,poiseW,poiseH,5);ctx.fill();
      if(amount>0){
        ctx.fillStyle='#e3b84f';
        rr(ctx,x-poiseW/2,yy,poiseW*amount,poiseH,5);ctx.fill();
        ctx.fillStyle='rgba(255,248,202,.75)';
        rr(ctx,x-poiseW/2+2,yy+1,Math.max(0,poiseW*amount-4),1.5,1);ctx.fill();
      }
      if(broken||shattered){
        ctx.strokeStyle='#df847d';ctx.lineWidth=1.6;
        rr(ctx,x-poiseW/2,yy,poiseW,poiseH,5);ctx.stroke();
      }
      ctx.textAlign='center';ctx.font='800 10px system-ui, sans-serif';
      ctx.fillStyle=(broken||shattered)?'#ae534b':'#90641e';
      ctx.fillText(broken?('虚弱 '+poise.stagger.toFixed(1)+'s'):
        (shattered?'破防':(poise.recovering?'恢复中':'韧性')),x,y+29);
    }
    ctx.restore();
  }
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function _hex(h) { h = (h || '#000').replace('#', ''); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function mix(a, b, f) { const x = _hex(a), y = _hex(b); return `rgb(${(x[0] + (y[0] - x[0]) * f) | 0},${(x[1] + (y[1] - x[1]) * f) | 0},${(x[2] + (y[2] - x[2]) * f) | 0})`; }
function withAlpha(h, a) { const c = _hex(h); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function star(ctx, cx, cy, R, r, n) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2; const rad = i % 2 ? r : R; ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); }
  ctx.closePath(); ctx.fill();
}

// Compute one preview level at spawn and keep it on that encounter.
CaptureBattle.previewWildLevel=function(species,region,team){
  const rIdx=['N','R','SR','SSR'].indexOf(species?.rarity);
  const fields={rarIdx:Math.max(0,rIdx),encounterRegion:region||'yard'};
  const candidates=Array.isArray(team)&&team.length?team:
    (window.State?.S?.cats||[]).slice(0,5);
  return CaptureBattle.prototype.computeWildLevel.call(fields,candidates);
};
window.Battle = { CaptureBattle };
