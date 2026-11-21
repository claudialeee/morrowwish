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

class CaptureBattle {
  constructor(game, teamOrCat, wildSpecies) {
    this.game = game;
    this.W = game.W; this.H = game.H;
    this.topMargin = this.H<540&&this.W>this.H ? Math.max(58,Math.min(105,this.H*.26)) : Math.max(85,Math.min(238,this.H*.40));
    this.bottomMargin = this.H<540&&this.W>this.H ? Math.max(38,Math.min(64,this.H*.15)) : Math.max(54,Math.min(112,this.H*.16));
    this.wild = wildSpecies;
    this.rar = GameData.RARITY[wildSpecies.rarity];
    this.rarIdx = ['N', 'R', 'SR', 'SSR'].indexOf(wildSpecies.rarity);
    // enemy level scales with the player's progress: average team level +
    // how far they've come (catchCount), nudged by rarity. So early wilds are
    // Lv.1-3 and late-game packs scale to match a strong roster.
    this.wildLevel = this.computeWildLevel(teamOrCat);

    // --- build the player team (array of up to 3 fighters) ---
    const cats = Array.isArray(teamOrCat) ? teamOrCat : [teamOrCat];
    this.team = cats.slice(0, 3).map((c, i) => this.makeFighter(c, i));
    this.active = 0;
    this.partner = cats[0];              // for reward bookkeeping in game.js
    this.duo=window.CatRelations?.active(cats)||null;
    this.duoCharge=this.duo?22:0;this.duoCd=0;this.duoUses=0;

    // --- player runtime state: spread the whole team on the LEFT so all fight ---
    this.team.forEach((f,i)=>{f.x=this.W*(.18+(i%2)*.1);f.y=this.H*(.55+i*.085);});
    const f = this.me();
    this.aim = 0;                         // radians toward mouse
    this.ult = 0;                         // 0..100 ultimate meter
    // --- COMBO system: hits chain a multiplier; drops after a gap (需要操作维持) ---
    this.combo = 0;                       // current chain count
    this.comboT = 0;                      // seconds until the chain drops
    this.comboBest = 0;                   // best this battle
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
    this._obs = { dodgeSignSum: 0, dodgeN: 0, rangeSum: 0, rangeN: 0, rangeT: 0, threats: 0, dodgedThreats: 0, fires: 0, frames: 0 };
    if (this.aiP.adapt) {                                   // optional adaptive difficulty (timing/accuracy ONLY)
      const sk = this.aiP.skill;
      this.aiReact = clamp(1.15 - 0.3 * sk, 0.90, 1.15);    // ×windup / dodge timers
      this.aiJitter = clamp(0.18 - 0.16 * sk, 0.02, 0.18);  // aim slop (never 0)
      this.aiLeadConf = clamp(0.4 + 0.6 * sk, 0.40, 1.00);  // how much predicted lead to apply
    } else { this.aiReact = 1; this.aiJitter = 0.06; this.aiLeadConf = 1; }

    // --- wild cat PACK: 1~3 enemies (rarer / commander-seeded = bigger packs) ---
    // The pack can be passed in via opts.pack (array of species); otherwise we
    // roll a size based on rarity and fill with the lead species + weaker friends.
    this.enemies = this.buildPack(wildSpecies);
    this.captureReady = false;

    // --- control mode: 'manual' | 'auto' (commander). Toggle in-battle. ---
    this.autoMode = !!(window.State?.S?.battlePrefs?.autoBattle);
    this.commandTarget = null;    // commander focus-fire marker {x,y}

    // --- shared ---
    this.projectiles = [];               // {x,y,vx,vy,r,dmg,owner,life,color,kind}
    this.skillStrokes=[]; // Short-lived authored 2D spell shapes (not recolored bullets)
    this.duoField=null; // Elemental field lasting through several combat seconds
    this.particles = [];
    this.floaters = [];                  // damage numbers
    this.vfx = new VFX();                // juicy skill effects
    this.t = 0;
    this.done = false; this.result = null;
    this.shakeT = 0; this.flash = 0;
    this.hint = '鼠标瞄准 · 左键猫爪 · 空格闪避 · 斗志清零即收服';
    this.captureReady = false;
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
    if (S.tutorialDone || (S.catchCount || 0) > 0) return null;   // only the FIRST fight, once
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
      if (window.State && State.S && !State.S.tutorialDone) { State.S.tutorialDone = true; State.save(); }
      return;
    }
    const step = c.steps[c.i];
    if (!step) return;
    if (step.key === 'finish' && !c._finishStamped) { this._coachFinishAt = this.t; c._finishStamped = true; }
    // show the coaching line + highlight the relevant control
    const en = window.MorrowwishI18n?.get?.() !== 'zh';
    this.hint = en ? step.en : step.zh;
    this._coachHighlight = step.hl;
    // advance when the player completes the step
    if (step.done(this)) {
      c.i++;
      if (c.i >= c.steps.length) {               // tutorial complete
        this._coachHighlight = null;
        if (window.State && State.S) { State.S.tutorialDone = true; State.save(); }
        this.coach = null;
        window.arcadeMetric?.('bond_tutorial_complete', {});
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
      support:art.support||'shield',tier:d.tier};
    this.duoCinematic={t:2.75,max:2.75,name:d.name,x,y,first:firstColor,second:secondColor,elements:mix};
    // Two actual fighters sprint toward the enemy, cross paths and sprint home.
    // Positions are visual only, leaving actual combat collision and saves intact.
    const target=this.liveEnemies()[0]||{x,y};
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
    this.vfx.burst(target.x,target.y,{count:16,color:firstColor,speed:200,life:.45,r:3});
    this.vfx.burst(target.x,target.y,{count:12,color:secondColor,speed:240,life:.47,r:2});
    let hits=0;
    for(const e of this.liveEnemies().slice()){
      const raw=Math.min(e.maxhp*(.18+(d.tier-1)*.035),
        (fs[0].dmg+fs[1].dmg)*(1.2+.2*d.tier));
      const damage=raw*Math.max(.8,Math.min(1.2,art.mult||1));
      this.hurtEnemy(e,damage,e.x,e.y,true);
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
    const support=art.support||'shield';
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
    window.MorrowwishAudio?.effect?.('capture');
    // The unique lingering field and restrained title make the special visible; avoid a second toast.
    window.arcadeMetric?.('bond_duo_attack',{elementPair:mix,tier:d.tier,hits,style:support});
    return true;
  }
  // Five-plus seconds of distinct elemental resonance. The opening duo
  // strike is strongest; follow-up pulses are restrained and readable.
  tickDuoField(dt){
    const v=this.duoField;
    if(!v||this.done)return;
    v.age+=dt;v.remaining=Math.max(0,v.duration-v.age);
    // The resonance follows the nearest living opponent, rather than becoming
    // useless if the wild cat leaves its starting position.
    const marked=this.liveEnemies().reduce((best,e)=>!best||Math.hypot(e.x-v.x,e.y-v.y)<Math.hypot(best.x-v.x,best.y-v.y)?e:best,null);
    if(marked){v.x+=(marked.x-v.x)*Math.min(1,dt*.55);v.y+=(marked.y-v.y)*Math.min(1,dt*.55);}
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
    for(const e of this.liveEnemies()){
      if(Math.hypot(e.x-v.x,e.y-v.y)>v.radius*1.3)continue;
      const damage=Math.min(e.maxhp*(.019+.003*v.tier),
        Math.max(1,(this.team[0]?.dmg||15)*(.2+.035*v.tier)));
      this.hurtEnemy(e,damage,e.x,e.y,true);
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
    if(this.commandTarget){this.commandTarget.x*=W/oldW;this.commandTarget.y*=H/oldH;}
    this._stars=null;this._motes=null;
  }

  // Wild level tracks player strength so fights stay meaningful, never trivial.
  computeWildLevel(teamOrCat) {
    const cats = Array.isArray(teamOrCat) ? teamOrCat : [teamOrCat];
    const avg = cats.length ? cats.reduce((s, c) => s + (c.level || 1), 0) / cats.length : 1;
    const caught = (window.State && State.S.catchCount) || 0;
    // base = team average, +1 per 3 catches (world progress), +rarity bump, ±1 jitter
    const lvl = Math.round(avg + caught / 3 + this.rarIdx * 2 + (Math.random() * 2 - 1));
    return Math.max(1, lvl);
  }

  // Build a wild pack of 1~3 enemies. Lead = the encountered species; rarer
  // encounters bring more/tougher friends.
  buildPack(lead) {
    const packSize = 1 + (Math.random() < 0.35 + this.rarIdx * 0.12 ? 1 : 0) + (Math.random() < 0.12 + this.rarIdx * 0.1 ? 1 : 0);
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
    const maxhp = Math.round((140 + wv.vit * 7) * (1 + rIdx * 0.6) * lvScale * eliteFactor);
    // First two battles teach controls; later battles ask for dodging and team skill timing.
    const captures=State.S.catchCount||0;
    const challenge=captures<2?0:Math.min(1.8,(captures-1)*.11);
    const col = total === 1 ? 0.7 : 0.58 + (i / Math.max(1, total - 1)) * 0.26;
    const element = (window.Skills && Skills.elementOf) ? Skills.elementOf(sp.id) : null;
    return {
      sp, i, element, rIdx, level,
      role:rIdx>=2?'elite':(i%3===0?'ambusher':i%3===1?'sharpshooter':'skirmisher'),
      phase:0,challenge,
      maxhp, hp: maxhp,
      x: this.W * col, y: this.H * (0.52 + (i % 2) * 0.13), vx: 0, vy: 0,
      face: -1, t: Math.random() * 3, pose: 'idle',
      shieldT:0,protectT:0,reflectT:0,rootT:0,vulnerableT:0,wardCd:3+Math.random()*3,
      fireCd: 0.6 + Math.random() * 0.8, dodgeCd: 0, special: 2 + Math.random() * 2,
      specialCd:Math.max(2.4,5-rIdx*.6-challenge*.55),telegraph:0,telegraphKind:null,inv:0,
      flash: 0, aggro: 0, heading: Math.PI, bolt: 0,
      dmg:(5+rIdx*2.2)*lvScale*(rIdx===3?1.10:rIdx===2?1.06:1)*(1+challenge*.12),
      speed:92+rIdx*22+challenge*14,fireRate:Math.max(.43,1.1-rIdx*.18-challenge*.12),
      skill: this.pickWildSkillFor(element, rIdx),
      tags: [], alive: true,
    };
  }
  // alive enemies helper
  liveEnemies() { return this.enemies.filter(e => e.alive); }

  makeFighter(cat, i) {
    const s = cat.stats;
    const maxhp = Math.round(45 + s.vit * 5 + cat.level * 3);
    // element + a learned loadout from the skill library (Q / E slots)
    const element = (window.Skills && Skills.elementOf) ? Skills.elementOf(cat.species) : null;
    let loadout = null;
    if (window.Skills && Skills.ensureLoadout) { Skills.ensureLoadout(cat); loadout = cat.loadout; }
    const skillOf = id => (window.Skills && Skills.skillById) ? Skills.skillById(id) : null;
    // bond(纽带) bonuses — higher affinity = more damage, shorter cd, revive
    const bond = (window.Skills && Skills.bondBonuses) ? Skills.bondBonuses(Skills.bondTier(cat.affinity || 0)) : { dmgMult: 1, cdReduction: 1, reviveOnce: false };
    return {
      cat, i, element, bond,
      hp: maxhp, maxhp,
      x: this.W * 0.3, y: this.H * 0.6, vx: 0, vy: 0,
      r: 20, inv: 0, dashT: 0,
      speed: 150 + s.agi * 3.5,
      dmg: (6 + s.pow * 0.7 + cat.level * 0.3) * (bond.dmgMult || 1),
      shieldT:0,damageBoostT:0,protectT:0,reflectT:0,rootT:0,vulnerableT:0,
      tags: [], status: {}, slowed: false,
      projSpeed: 300 + s.agi * 5,
      cd: { basic: 0, q: 0, e: 0 },
      // the two active skills this cat actually knows (from its element loadout)
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
    if(this.game.isTouch&&!this.autoMode)this.game.touchAutoFire=true;
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
    const threat=this.incomingThreat(f);
    const basicRange=Math.min(170,f.projSpeed*.45+20);
    const ideal=Math.min(115,basicRange-22);
    const danger=f.hp/f.maxhp<.34;
    let mx=0,my=0;
    if(threat){
      const p=threat.p,sp=Math.hypot(p.vx,p.vy)||1;
      const side=f.i%2?-1:1;
      mx=-p.vy/sp*side;my=p.vx/sp*side;
    }else if(danger&&dist<165){
      mx=-dx/dist;my=-dy/dist;
    }else if(this.commandTarget){
      const gx=this.commandTarget.x-f.x,gy=this.commandTarget.y-f.y;
      const gd=Math.hypot(gx,gy);
      if(gd>35){mx=gx/gd;my=gy/gd;}
      else if(dist>ideal+25){mx=dx/dist;my=dy/dist;}
    }else if(dist>ideal+18){mx=dx/dist;my=dy/dist;}
    else if(dist<Math.max(62,ideal-45)){mx=-dx/dist;my=-dy/dist;}
    else{
      mx=-dy/dist*.24;my=dx/dist*.24;
    }
    const mag=Math.hypot(mx,my);
    if(mag>0.04 && !(f.dashT>0&&f.pounce) && f.rootT<=0){
      const spd=(f.dashT>0?f.speed*3:f.speed)*(f.slowed?0.55:1);
      f.x=clamp(f.x+mx/mag*spd*dt,BATTLE_MARGIN.side,this.W-BATTLE_MARGIN.side);
      f.y=clamp(f.y+my/mag*spd*dt,this.topMargin,this.H-this.bottomMargin);
      f.face=mx<0?-1:mx>0?1:f.face;
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
    const aim=Math.atan2(tgt.y-f.y,tgt.x-f.x);
    f._aim=aim;
    if(threat&&f.dodgeCd<=0){
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
    if(f===this.me()&&this.ult>=100&&dist<370){
      if(this.ultimate()!==false){this.markAutoAction(f,'释放必杀技');return;}
    }
    const offensive=(sk,slot)=>{
      if(!sk)return slot==='q'&&dist<310;
      if(sk.kind==='heal'||sk.kind==='buff')return false;
      if(sk.kind==='melee')return dist<=106;
      if(sk.kind==='dash')return dist>55&&dist<f.speed*3*.26+42;
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
    if(f.cd.basic<=0&&dist<Math.min(175,f.projSpeed*.45+25)){
      this.fireBasic(f,aim);
      // Basic attack intentionally does not overwrite the last skill label.
    }
  }

  // Custom gambits are strictly top-down; default and legacy presets use the
  // smarter contextual planner. Custom conditions do not silently change.
  evalGambits(f,tgt,dist,nearProj,nd) {
    if(!tgt)return;
    const threat=this.incomingThreat(f);
    if(this.isDefaultGambit(f.cat)){
      this.smartAutoAction(f,tgt,dist,threat);
      return;
    }
    const rules=f.cat.gambits;
    const tags=tgt.tags||[];
    const aim=Math.atan2(tgt.y-f.y,tgt.x-f.x);
    f._aim=aim;
    const condition=k=>{
      switch(k){
        case 'always':return true;
        case 'enemyHpBelow30':return tgt.hp/tgt.maxhp<.30;
        case 'enemyHpBelow50':return tgt.hp/tgt.maxhp<.50;
        case 'selfHpBelow40':return f.hp/f.maxhp<.40;
        case 'selfHpBelow25':return f.hp/f.maxhp<.25;
        case 'ultReady':return this.ult>=100;
        case 'comboPrimed':case 'enemyHasTag':return tags.length>0;
        case 'enemyClose':return dist<145;
        case 'enemyFar':return dist>260;
        case 'incomingProj':return !!threat;
        case 'bondHigh':return (f.cat.affinity||0)>=60;
        default:return false;
      }
    };
    const action=act=>{
      switch(act){
        case 'ult':return f===this.me()&&this.ult>=100?this.ultimate():false;
        case 'heal':{
          const slot=this.supportSlot(f,'heal')||this.supportSlot(f,'shield');
          return slot?this.castSlot(f,slot,aim):false;
        }
        case 'dodge':return this.dodge(f);
        case 'skillQ':case 'combo':case 'finisher':
          if(f.cd.q>0||f.qSkill?.kind==='melee'&&dist>106)return false;
          return this.skillQ(f,aim);
        case 'skillE':case 'approach':
          if(f.cd.e>0)return false;
          if(f.eSkill?.kind==='dash'&&(dist<60||dist>260))return false;
          return this.skillE(f,aim);
        case 'retreat':return f.hp/f.maxhp<.4?true:false; // spacing owned by movement AI
        case 'basic':
          if(dist>Math.min(175,f.projSpeed*.45+25)||f.cd.basic>0)return false;
          this.fireBasic(f,aim);return true;
        default:return false;
      }
    };
    for(const r of rules){
      if(condition(r.cond)&&action(r.act)!==false)return;
    }
    if(f.cd.basic<=0&&dist<Math.min(175,f.projSpeed*.45+25))this.fireBasic(f,aim);
  }

  // The commander's click order: the enemy nearest the focus marker. When set, the
  // WHOLE squad (active cat + allies) prioritizes it, so commanding actually means
  // "focus-fire THAT one". Falls back to each cat's nearest enemy when no order.
  commandedTarget(fromX, fromY) {
    if (this.commandTarget) { const t = this.nearestEnemy(this.commandTarget.x, this.commandTarget.y); if (t) return t; }
    return this.nearestEnemy(fromX, fromY);
  }

  // Ally AI: a non-active team cat fights on its own — flanks near the player,
  // dodges incoming fire, and focus-fires the commander's target when one is set.
  updateAllyAI(dt, f) {
    const tgt = this.commandedTarget(f.x, f.y);
    if (!tgt) return;
    const dx = tgt.x - f.x, dy = tgt.y - f.y, dist = Math.hypot(dx, dy) || 1;
    // flee nearest enemy projectile
    let near = null, nd = 1e9;
    for (const p of this.projectiles) { if (p.owner !== 'wild') continue; const d = Math.hypot(p.x - f.x, p.y - f.y); if (d < nd) { nd = d; near = p; } }
    let mx = 0, my = 0;
    if (near && nd < 100) { const pv = Math.hypot(near.vx, near.vy) || 1; mx = -near.vy / pv; my = near.vx / pv; }
    else {
      // keep a mid range, orbit a bit so allies spread out
      const want = 125;
      if (dist > want + 30) { mx = dx / dist; my = dy / dist; }
      else if (dist < want - 30) { mx = -dx / dist; my = -dy / dist; }
      mx += -dy / dist * 0.4 * (f.i % 2 ? 1 : -1); my += dx / dist * 0.4 * (f.i % 2 ? 1 : -1);
      // separation from the active cat & other allies
      for (const o of this.team) { if (o === f || !o.alive) continue; const sx = f.x - o.x, sy = f.y - o.y, sd = Math.hypot(sx, sy) || 1; if (sd < 60) { mx += sx / sd * 0.6; my += sy / sd * 0.6; } }
    }
    if (f.dashT <= 0 && f.rootT <= 0) {
      const spd = f.speed * 0.9 * (f.slowed ? 0.55 : 1);   // same soft-CC slow as the active cat
      f.x = clamp(f.x + mx * spd * dt, BATTLE_MARGIN.side, this.W - BATTLE_MARGIN.side);
      f.y = clamp(f.y + my * spd * dt, this.topMargin, this.H - this.bottomMargin);
      f.face = dx < 0 ? -1 : 1; f.moving = (mx || my) ? true : false;
    }
    if(near && this.incomingThreat(f) && f.dodgeCd<=0) this.dodge(f);
    this.evalGambits(f, tgt, dist, near, nd);
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
      // commander: you don't move/aim. Hotkeys still let you fire skills & switch.
      this.autoDrive(dt);
      const pressedC = k => K[k] && !this._prevKeys[k];
      if (pressedC('r')) this.ultimate();
      if (pressedC('f')) this.castDuo();
      if (pressedC('1')) this.switchTo(0);
      if (pressedC('2')) this.switchTo(1);
      if (pressedC('3')) this.switchTo(2);
      if (pressedC('q')) this.skillQ();
      if (pressedC('e')) this.skillE();
      // click sets a focus/move marker for the squad
      if (m.down) this.commandTarget = { x: m.x, y: m.y };
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

    // movement: WASD/arrows OR the virtual joystick
    let mx = 0, my = 0;
    if (K['w'] || K['arrowup']) my -= 1;
    if (K['s'] || K['arrowdown']) my += 1;
    if (K['a'] || K['arrowleft']) mx -= 1;
    if (K['d'] || K['arrowright']) mx += 1;
    if (joy && joy.active && (Math.abs(joy.dx) > 0.15 || Math.abs(joy.dy) > 0.15)) { mx += joy.dx; my += joy.dy; }
    if (f.rootT > 0) { mx = 0; my = 0; }                 // Reflect wall roots the caster
    f._mvx = mx; f._mvy = my;                            // remember input so dodge can flee the right way
    if (mx || my) {
      const l = Math.hypot(mx, my);
      const spd = (f.dashT > 0 ? f.speed * 3 : f.speed) * (f.slowed ? 0.55 : 1);   // 冰冻/束缚/感电 减速
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

  // actions accept an optional fighter + aim so ALLIES can use them too.
  fireBasic(f, aim) {
    f = f || this.me(); if (f.cd.basic > 0) return;
    if (aim == null) aim = (f === this.me()) ? this.aim : f._aim || 0;
    if (f === this.me() && this._obs) this._obs.fires++;    // aggression signal
    if (f === this.me()) this._coachAttacked = (this._coachAttacked || 0) + 1;   // coach: step 2
    f.cd.basic = this.moves[0].cd * (f.bond.cdReduction || 1);
    const col = this.elemColor(f.element);
    const mx = f.x + Math.cos(aim) * 22, my = f.y + Math.sin(aim) * 22;
    // 猫爪=近身快攻: short-lived projectile so it only reaches ~short range
    this.spawnProj(mx, my, aim, f.projSpeed, f.dmg*(f.damageBoostT>0?1.25:1)*(f.weakened?0.5:1), 'me', col, 5, 'claw', { element: f.element }, 0.45);
    this.vfx.muzzle(mx, my, aim, col);
    if(f===this.me()&&(this.t-(this._lastPawSfx||-3)>.45)){
      window.MorrowwishAudio?.effect?.('paw');this._lastPawSfx=this.t;
    }
    this.gainUlt(2);
  }
  // Native skill semantics for heal/buff (formerly mis-cast as damage or dash).
  // Returns whether anything was actually used, for smart AI priorities.
  castSupportSkill(f,sk){
    if(!sk)return false;
    if(sk.kind==='heal'){
      if(f.hp>=f.maxhp-.5)return false;
      const amount=Math.min(f.maxhp-f.hp,Math.max(14,f.maxhp*.34));
      f.hp=Math.min(f.maxhp,f.hp+amount);
      this.vfx.ring(f.x,f.y,{r0:5,vr:225,life:.42,color:'#a8e9b4',width:4});
      this.vfx.text(f.x,f.y-33,'+'+Math.round(amount),'#93dca1',15);
    }else if(sk.kind==='buff'){
      const shield=sk.tags?.includes('shield');
      if(shield){
        return this.castWard(f, sk.shieldType || 'barrier');   // three shield verbs
      }else{
        if(f.damageBoostT>.3)return false;
        f.damageBoostT=6;
        this.vfx.ring(f.x,f.y,{r0:10,vr:190,life:.55,color:'#ffd9a0',width:4});
        this.vfx.text(f.x,f.y-34,'强化','#f8eab8',14);
      }
    }else return false;
    this.gainUlt(6);
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
    if(id==='waterLash'||id==='prismBeam'){
      const water=id==='waterLash',range=water?430:525,width=water?38:21;
      const endX=ex+Math.cos(aim)*range,endY=ey+Math.sin(aim)*range;
      this.skillStrokes.push({kind:water?'water':'prism',x:ex,y:ey,x2:endX,y2:endY,
        color:col,life:.45,max:.45});
      for(let i=0;i<(water?5:4);i++){
        const r=60+i*(water?75:125);
        this.vfx.ring(ex+Math.cos(aim)*r,ey+Math.sin(aim)*r,
          {r0:4,vr:80,life:.26,color:water?'#a5edfc':'#fefcbb',width:2});
      }
      let hits=0;
      for(const e of enemies){
        const dx=e.x-ex,dy=e.y-ey,along=dx*Math.cos(aim)+dy*Math.sin(aim);
        const side=Math.abs(-dx*Math.sin(aim)+dy*Math.cos(aim));
        if(along<0||along>range||side>width+e.r*.5)continue;
        const dd=this.applyHitEffects(e,sk,baseDmg*(water?.9:1.18),e.x,e.y);
        this.hurtEnemy(e,dd,e.x,e.y,true);
        this.vfx.impact(e.x,e.y,col);hits++;
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
        const dmg=this.applyHitEffects(target,sk,baseDmg*(1-i*.23),target.x,target.y);
        this.hurtEnemy(target,dmg,target.x,target.y,true);
        this.vfx.burst(target.x,target.y,{count:9,color:col,speed:160,life:.3});
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
  castWard(f, type) {
    if ((f.protectT||0)>0 || (f.reflectT||0)>0 || (f.shieldT||0)>.25) return false;  // one ward at a time
    if (type === 'protect') {
      // Protect 守护: full block, tiny window, then a vulnerable 后遗症.
      f.protectT = 0.8; f._protectVuln = 1.2;        // after it drops → vulnerableT
      this.vfx.ring(f.x,f.y,{r0:14,vr:120,life:.5,color:'#9be7c4',width:6});
      this.vfx.text(f.x,f.y-34,'守护','#9be7c4',14);
    } else if (type === 'reflect') {
      // Reflect 反弹壁: bounces projectiles; caster is rooted/slowed while up.
      f.reflectT = 2.2; f.rootT = 2.2;
      this.vfx.ring(f.x,f.y,{r0:18,vr:70,life:.5,color:'#b8e0ff',width:5});
      this.vfx.text(f.x,f.y-34,'反弹壁','#b8e0ff',14);
    } else {
      // Barrier 护盾: % reduction for a duration (the classic bubble).
      f.shieldT = 4.8;
      this.vfx.ring(f.x,f.y,{r0:10,vr:190,life:.55,color:'#9dd8ff',width:4});
      this.vfx.text(f.x,f.y-34,'护盾','#9dd8ff',14);
    }
    return true;
  }
  // ---- adaptive AI profile (tiny online statistics, all clamped) ----
  normalizeAiProfile(p) {
    const d = { v: 1, battles: 0, dodgeDir: 0, favRange: 0.5, evasive: 0.4, aggression: 0.5, elemLead: {}, skill: 0.5, adapt: true };
    p = Object.assign({}, d, p || {});
    p.elemLead = Object.assign({}, p.elemLead);
    p.dodgeDir = clamp(p.dodgeDir, -1, 1); p.favRange = clamp(p.favRange, 0, 1);
    p.evasive = clamp(p.evasive, 0.05, 0.95); p.aggression = clamp(p.aggression, 0, 1);
    p.skill = clamp(p.skill, 0, 1); p.battles = clamp(p.battles | 0, 0, 9999);
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
    State.S.aiProfile = p;
  }

  // Tick ward timers for any fighter/enemy; Protect leaves a vulnerable window.
  tickWards(f, dt) {
    if (f.protectT > 0) { f.protectT = Math.max(0, f.protectT - dt); if (f.protectT === 0 && f._protectVuln) { f.vulnerableT = f._protectVuln; f._protectVuln = 0; } }
    if (f.reflectT > 0) f.reflectT = Math.max(0, f.reflectT - dt);
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
      if(!this.castSupportSkill(f,sk))return false;
      f.cd.q=sk.cd*(f.bond.cdReduction||1);
      this.markMoveSeen(f,sk);
      return true;
    }
    f.cd.q = (sk ? sk.cd : this.moves[1].cd) * (f.bond.cdReduction || 1);
    const col = this.elemColor(sk ? sk.element : f.element);
    const pow = (sk ? sk.power : 0.8)*(f.damageBoostT>0?1.25:1)*(f.weakened?0.5:1);
    this.castOffensiveSkill(f, aim, sk, pow, col);
    this.gainUlt(8);
    this.markMoveSeen(f,sk);
    // Suppress repeated action labels; they used to cover the health bars.
    return true;
  }

  // smallest signed angle between two headings
  angleDiff(a, b) { let d = a - b; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; }
  // 近战范围攻击: an instant arc in front of the caster, hitting enemies within range
  meleeStrike(f, aim, skill, dmg, col) {
    const RANGE = 90, ARC = 1.1;
    // signature melee VFX: owner's authored claw-slash stroke + my sweeping blade.
    this.skillStrokes.push({kind:'clawSlash',x:f.x,y:f.y,angle:aim,color:col,life:.37,max:.37});
    this.vfx.slash(f.x, f.y, aim, col, RANGE * 0.9, ARC * 0.92);
    this.vfx.burst(f.x + Math.cos(aim) * RANGE * 0.6, f.y + Math.sin(aim) * RANGE * 0.6, { count: this.game.isTouch ? 4 : 8, color: col, angle: aim, spread: ARC, speed: 220, life: 0.28, r: 2.5, drag: 3 });
    let hit = false;
    for (const e of this.liveEnemies()) {
      const d = Math.hypot(e.x - f.x, e.y - f.y);
      if (d > RANGE + 22) continue;
      const ang = Math.atan2(e.y - f.y, e.x - f.x);
      if (Math.abs(this.angleDiff(ang, aim)) > ARC) continue;   // must be in the frontal arc
      const r = this.resolveHit(e, 'me', skill, dmg, e.x, e.y);  // melee can't be reflected (no proj)
      if (r.dealt > 0) hit = true;
    }
    if (hit) this.shakeT = Math.max(this.shakeT, 0.1);
  }

  // ---------------- offensive skill dispatch by KIND ----------------
  // Shared by skillQ/skillE (and reusable by enemy AI). Each kind has honest hit
  // geometry: projectile=flying fan, melee=arc, aoe=slow placed lob, dash=lunge,
  // chain=jump. Support kinds (heal/buff) are handled by the callers before this.
  castOffensiveSkill(f, aim, sk, pow, col) {
    const kind = sk ? sk.kind : 'projectile';
    if (kind === 'melee') {
      this.meleeStrike(f, aim, sk, f.dmg * pow * 1.4, col);
    } else if (kind === 'aoe') {
      this.lobAoe(f, aim, sk, f.dmg * pow, col);
    } else if (kind === 'dash') {
      this.dashLunge(f, aim, sk, f.dmg * pow * 1.5, col);
    } else if (kind === 'chain') {
      this.chainBolt(f, aim, sk, f.dmg * pow, col);
    } else if (!this.castDistinctProjectile(f, sk, aim, col, f.dmg * pow)) {
      // Owner's per-skill elemental geometry (lances/fireball/hex/etc.) takes
      // priority; fall back to a directional projectile fan for plain skills.
      for (let i = -2; i <= 2; i++) this.spawnProj(f.x, f.y, aim + i * 0.18, f.projSpeed * 0.8, f.dmg * pow, 'me', col, 7, 'fur', sk);
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
  }
  // Dash lunge: the caster leaps along aim; enemies crossed along the lunge line
  // are struck once. A gap-closer, not a ranged poke.
  dashLunge(f, aim, sk, dmg, col) {
    f.dashT = 0.24; f.inv = 0.28; f._dashAim = aim;
    const x2 = f.x + Math.cos(aim) * 190, y2 = f.y + Math.sin(aim) * 190;
    this.vfx.trail(f.x, f.y, col, 10); this.vfx.beam(f.x, f.y, x2, y2, col);
    const hitThisLunge = new Set();
    for (const e of this.liveEnemies()) {
      // distance from the enemy to the lunge segment
      const d = this.pointToSeg(e.x, e.y, f.x, f.y, x2, y2);
      if (d <= 34 && !hitThisLunge.has(e.i)) { hitThisLunge.add(e.i); this.resolveHit(e, 'me', sk, dmg, e.x, e.y); }
    }
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
      if(!this.castSupportSkill(f,sk))return false;
      f.cd.e=sk.cd*(f.bond.cdReduction||1);
      this.markMoveSeen(f,sk);
      return true;
    }
    f.cd.e = (sk ? sk.cd : this.moves[2].cd) * (f.bond.cdReduction || 1);
    const col = this.elemColor(sk ? sk.element : f.element);
    const pow = (sk ? sk.power : 1) * (f.damageBoostT>0?1.25:1)*(f.weakened?0.5:1);
    if (sk) {
      this.castOffensiveSkill(f, aim, sk, pow, col);
    } else {
      // no learned E skill → the classic pounce (contact-damage lunge)
      f.dashT=.26;f.inv=.3;
      f.pounce=true;f._dashAim=aim;f._pounceSkill=null;
      this.vfx.shockwave(f.x,f.y,col);
      this.vfx.burst(f.x,f.y,{count:12,color:col,angle:aim+Math.PI,spread:1.2,speed:220});
    }
    this.gainUlt(6);
    this.markMoveSeen(f,sk);
    // The dash animation is the feedback: no blocking combat toast.
    return true;
  }
  dodge(f) {
    f = f || this.me(); if (f.dodgeCd > 0) return false;
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
  ultimate(){
    if(this.ult<100){this.game.toast('必杀能量不足');return false;}
    const f=this.me(),skill=f.ultSkill;
    this.ult=0;
    f.inv=2.2;                                   // invulnerable through the whole cinematic
    // FULL-SCREEN ULTIMATE CINEMATIC: freeze the arena, play a 3s element-themed
    // sequence, and detonate at the climax. The heavy lifting (damage) still runs
    // through the same code below, deferred to the impact beat so it reads as one
    // big synchronized hit instead of a quiet poke.
    const color = skill && skill.ultCost>0 ? this.elemColor(skill.element) : '#ffd36b';
    this.ultCinematic = {
      t: 3.0, max: 3.0, impactAt: 1.15, impacted: false,
      name: skill && skill.ultCost>0 ? skill.name : '喵爪旋风',
      element: skill && skill.ultCost>0 ? skill.element : 'neutral',
      color, x: f.x, y: f.y, uid: f.cat.uid,
    };
    this.slowmo = Math.max(this.slowmo, 0.5);     // world crawls as it winds up
    window.MorrowwishAudio?.effect?.('ultimate');
    this._pendingUlt = { f, skill };              // fired by tickUltCinematic at impactAt
    return true;
  }
  // Deferred ultimate payload — the real damage/VFX, run at the cinematic's climax.
  fireUltimatePayload(){
    const p=this._pendingUlt; if(!p)return; this._pendingUlt=null;
    const f=p.f, skill=p.skill;
    if(!f||!f.alive)return;
    this.shakeT=.6;this.flash=.5;
    if(skill&&skill.ultCost>0){
      // A learned elemental ultimate is an actual different attack, not just
      // a renamed purple projectile. Hit nearby enemies, apply its status and
      // element strengths, then draw its own colored burst.
      const color=this.elemColor(skill.element);
      const radius=skill.element==='dark'?340:skill.element==='water'?310:290;
      let hits=0;
      for(const e of this.liveEnemies().slice()){
        if(Math.hypot(e.x-f.x,e.y-f.y)>radius)continue;
        const r=this.resolveHit(e,'me',skill,f.dmg*skill.power*.62,e.x,e.y);
        if(r.dealt>0)hits++;
      }
      this.vfx.shockwave(f.x,f.y,color);
      this.skillStrokes.push({kind:'ultimate',x:f.x,y:f.y,element:skill.element,
        color,life:.92,max:.92});
      this.vfx.ring(f.x,f.y,{r0:18,vr:Math.max(450,radius*2),life:.65,color,width:9});
      this.vfx.burst(f.x,f.y,{count:14,color,speed:245,life:.55,r:3});
      // Distinct attack animation already communicates the move; avoid a giant skill-name label.
      this.vfx.text(f.x,f.y-48,this.elemSymbol(skill.element),color,11);
      this.game.toast(this.elemSymbol(skill.element)+' 必杀 · '+skill.name+'！');
      this.lastUltimate={skill:skill.id,element:skill.element,hits};
      this.markMoveSeen(f,skill);
      window.arcadeMetric?.('bond_signature_ultimate',{skill:skill.id,rarity:GameData.speciesById(f.cat.species).rarity});
    }else{
      // The ordinary ultimate is an actual screen-space claw cyclone,
      // not sixteen low-quality purple balls emitted in a circle.
      const range=215;
      const targets=this.liveEnemies().filter(e=>Math.hypot(e.x-f.x,e.y-f.y)<=range);
      for(const e of targets.slice()){
        this.hurtEnemy(e,f.dmg*1.25,e.x,e.y,true);
        this.vfx.impact(e.x,e.y,'#e7c7a7');
      }
      this.skillStrokes.push({kind:'furStorm',x:f.x,y:f.y,
        color:'#f7d6a2',life:.7,max:.7});
      this.vfx.burst(f.x,f.y,{count:9,color:'#ffedca',speed:185,life:.35,r:2});
      this.game.toast('必杀 · 喵爪旋风！');
      this.lastUltimate={skill:'basicCatStorm',element:'neutral',hits:targets.length};
    }
  }
  // Advance the ultimate cinematic; detonate at the impact beat, end after 3s.
  tickUltCinematic(dt){
    const c=this.ultCinematic; if(!c)return;
    c.t=Math.max(0,c.t-dt);
    const elapsed=c.max-c.t;
    if(!c.impacted && elapsed>=c.impactAt){ c.impacted=true; this.fireUltimatePayload(); }
    if(c.t<=0) this.ultCinematic=null;
  }
  switchTo(i) {
    if (i === this.active || !this.team[i] || !this.team[i].alive) return;
    const old = this.me();
    this.team[i].x = old.x; this.team[i].y = old.y; this.team[i].inv = 0.6;
    this.active = i;
    this.vfx.ring(old.x, old.y, { r0: 8, vr: 280, life: 0.35, color: '#9be7c4', width: 3 });
    this.vfx.burst(old.x, old.y, { count: 10, color: '#9be7c4', speed: 180, life: 0.4 });
    this.game.toast(`切换到 ${State.catName(this.team[i].cat)}！`);
  }

  gainUlt(n) { this.ult = Math.min(100, this.ult + n); }

  // ---- COMBO: every hit extends the chain; higher chain = more dmg + ult ----
  // Combo bonus with DIMINISHING returns so it can't stack multiplicatively with
  // element-effectiveness + STAB into a one-shot. Square-root curve: ~×1.35 at 10
  // combo, ~×1.55 at 25, caps ~×1.7 at 50 (was a runaway linear ×2.5).
  comboMult() { return 1 + Math.sqrt(Math.min(this.combo, 50)) * 0.1; }
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
    this.projectiles.push({ x, y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, dmg, owner, color, r, kind, life: life || 2.2, ang, skill: skill || null });
  }
  spawnBurst(x,y,_symbol,color,n){
    // Energy dissipates as physical impact sparks, never floating emoji stickers.
    this.vfx.burst(x,y,{count:n||12,color:color||'#ffd36b',speed:150,life:.45,r:3});
  }
  floater(x,y,text,color,size){
    // Keep at most five damage/heal numerals on screen at once.
    if(this.floaters.length>=5)this.floaters.shift();
    this.floaters.push({x,y,text,color,life:.62,size:Math.min(13,size||12)});
  }

  // Persistent animated strokes make each elemental spell recognizable in motion.
  drawSkillStrokes(ctx){
    for(const v of this.skillStrokes){
      const k=Math.max(0,v.life/v.max),p=1-k;
      ctx.save();ctx.globalAlpha=Math.min(1,k*.95);
      ctx.lineCap='round';ctx.lineJoin='round';
      if(v.kind==='water'||v.kind==='prism'||v.kind==='lightning'){
        const dx=v.x2-v.x,dy=v.y2-v.y,len=Math.hypot(dx,dy)||1;
        const nx=-dy/len,ny=dx/len;
        const colors=v.kind==='water'?['#d4fdff','#61d3f7','#f4ffff']:
          v.kind==='prism'?['#fef3b1','#eab1ff','#bff9ff']:['#e9d6ff','#fbecb1','#b1dfff'];
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
      }else if(v.kind==='duoImpact'){
        ctx.translate(v.x,v.y);
        const element=v.elements||'',rad=24+p*96;
        ctx.rotate(p*.6);
        for(let layer=0;layer<2;layer++){
          ctx.strokeStyle=layer?v.secondColor:v.firstColor;
          ctx.lineWidth=(layer?5:8)*k;
          ctx.beginPath();
          ctx.arc(0,0,rad+layer*17,-2.5+p*.6,1.6+p*.6);
          ctx.stroke();
        }
        for(let i=0;i<3;i++){
          const yy=(i-1)*13,dir=i%2?-1:1;
          ctx.strokeStyle=i===1?'#fff9e5':(i===0?v.firstColor:v.secondColor);
          ctx.lineWidth=4.5*k;ctx.beginPath();
          ctx.moveTo(-61+p*10,yy-12);
          ctx.quadraticCurveTo(-4,-16+yy*dir,63-p*14,yy+12);
          ctx.stroke();
        }
        if(element.includes('elec')){
          ctx.strokeStyle='#ffedaa';ctx.lineWidth=3*k;
          for(let i=0;i<3;i++){
            const a=i*Math.PI*2/3+p*2;
            ctx.save();ctx.rotate(a);
            ctx.beginPath();ctx.moveTo(15,-8);ctx.lineTo(27,3);ctx.lineTo(21,8);ctx.lineTo(48,24);ctx.stroke();
            ctx.restore();
          }
        }else if(element.includes('grass')){
          ctx.fillStyle='#c6f4b2';
          for(let i=0;i<7;i++){
            const a=i*Math.PI*2/7+p;
            ctx.save();ctx.rotate(a);ctx.translate(39+p*48,0);
            ctx.beginPath();ctx.ellipse(0,0,10*k,3.5*k,a,0,Math.PI*2);ctx.fill();
            ctx.restore();
          }
        }
      }else if(v.kind==='furStorm'){
        const spins=7;
        ctx.save();ctx.translate(v.x,v.y);ctx.rotate(p*1.5);
        for(let i=0;i<spins;i++){
          const ang=i*Math.PI*2/spins+this.t*3,rad=24+p*180;
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
        const el=v.element,count=el==='grass'?18:el==='water'?14:el==='elec'?20:12;
        for(let i=0;i<count;i++){
          const ang=i*Math.PI*2/count+this.t*(el==='elec'?5:2);
          const rad=45+p*(el==='water'?225:165);
          const x=v.x+Math.cos(ang)*rad,y=v.y+Math.sin(ang)*rad;
          ctx.save();ctx.translate(x,y);ctx.rotate(ang+this.t*2);
          if(el==='grass'){
            ctx.fillStyle='#b9ec9f';ctx.beginPath();ctx.ellipse(0,0,13,5,0,0,Math.PI*2);ctx.fill();
          }else if(el==='water'){
            ctx.strokeStyle='#adf3ff';ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,14,-2.7,.8);ctx.stroke();
          }else if(el==='elec'){
            ctx.strokeStyle='#f8e985';ctx.lineWidth=4;ctx.beginPath();
            ctx.moveTo(-7,-13);ctx.lineTo(1,-2);ctx.lineTo(-4,3);ctx.lineTo(9,13);ctx.stroke();
          }else if(el==='fire'){
            ctx.fillStyle='#ffb46d';ctx.beginPath();
            ctx.moveTo(-8,7);ctx.quadraticCurveTo(-15,-5,1,-20);
            ctx.quadraticCurveTo(6,-7,10,-9);ctx.quadraticCurveTo(17,9,-8,7);ctx.fill();
          }else if(el==='dark'){
            ctx.strokeStyle='#d6bce9';ctx.lineWidth=3;ctx.beginPath();
            for(let j=0;j<6;j++){
              const a=j*Math.PI/3;
              j?ctx.lineTo(Math.cos(a)*11,Math.sin(a)*11):ctx.moveTo(Math.cos(a)*11,Math.sin(a)*11);
            }ctx.closePath();ctx.stroke();
          }else{
            ctx.fillStyle='#fff0bd';ctx.beginPath();ctx.moveTo(0,-13);
            ctx.lineTo(8,0);ctx.lineTo(0,13);ctx.lineTo(-8,0);ctx.closePath();ctx.fill();
          }ctx.restore();
        }
      }
      ctx.restore();
    }
  }

  // ---------------- update ----------------
  update(dt) {
    if (this.done) return;
    // Global combat tempo: scale the whole simulation (movement, projectiles, enemy
    // AI, cooldowns) so fights read calmer and the cat isn't twitchy-fast. One knob,
    // everything stays proportional/balanced. 1 = old speed; 0.8 = 20% slower.
    dt *= 0.8;
    // Ultimate cinematic: the arena nearly freezes so the full-screen sequence
    // reads as a dramatic beat. Ticks on REAL dt (pre-freeze) so it always lasts 3s.
    if (this.ultCinematic) { this.tickUltCinematic(dt); dt *= 0.06; }
    // perfect-dodge bullet-time: slow the WORLD but keep input responsive
    if (this.slowmo > 0) { this.slowmo -= dt; dt *= 0.35; }
    // hitstop: a few frames of near-freeze on a solid hit makes impacts feel weighty.
    // It scales the SIMULATION dt only (input was already polled by the loop), and
    // never stacks on top of bullet-time. Mobile uses a shorter freeze to avoid jank.
    if (this.hitstop > 0 && this.slowmo <= 0) { this.hitstop = Math.max(0, this.hitstop - dt); dt *= 0.12; }
    this.t += dt;
    if (this.coach) this.tickCoach(dt);                 // first-fight guided tutorial
    if (this.shakeT > 0) this.shakeT -= dt;
    if (this.flash > 0) this.flash -= dt;
    if (this.comboFlash > 0) this.comboFlash -= dt;
    if(this.duoCinematic){this.duoCinematic.t=Math.max(0,this.duoCinematic.t-dt);if(this.duoCinematic.t===0)this.duoCinematic=null;}
    this.tickDuoField(dt);
    if(this.duoRun){
      this.duoRun.age+=dt;
      if(this.duoRun.age>=this.duoRun.duration)this.duoRun=null;
    }
    for(const v of this.skillStrokes)v.life-=dt;
    this.skillStrokes=this.skillStrokes.filter(v=>v.life>0);
    if(this.duo){
      this.duoCd=Math.max(0,this.duoCd-dt);
      if([this.duo.a.uid,this.duo.b.uid].every(uid=>this.team.some(f=>f.alive&&f.cat.uid===uid)))
        this.duoCharge=Math.min(100,this.duoCharge+dt*6);
    }
    // combo chain decays if you stop landing hits (需持续操作维持)
    if (this.comboT > 0) { this.comboT -= dt; if (this.comboT <= 0 && this.combo > 0) this.breakCombo(); }
    this.gainUlt(12 * dt);                 // ult builds over time

    this.readInput(dt);
    if(this.autoMode&&this.duoReady())this.castDuo();

    // tick player cooldowns & timers
    for (const f of this.team) {
      f.t = (f.t || 0) + dt;
      for (const k in f.cd) if (f.cd[k] > 0) f.cd[k] -= dt;
      if (f.inv > 0) f.inv -= dt;
      if (f.dashT > 0) f.dashT -= dt; else f.pounce = false;
      if (f.dodgeCd > 0) f.dodgeCd -= dt;
      if (f.shieldT > 0) f.shieldT=Math.max(0,f.shieldT-dt);
      if (f.damageBoostT > 0) f.damageBoostT=Math.max(0,f.damageBoostT-dt);
      this.tickWards(f, dt);
      this.tickCatStatus(f, dt);              // DoT + soft-CC (slow) the enemy inflicted
      if (f.hitFlash > 0) f.hitFlash -= dt;
    }
    const me = this.me();

    // ALL your cats are on the field: you control the active one, allies auto-fight.
    for (const f of this.team) {
      if (!f.alive) continue;
      // dash-pounce travel (active or ally)
      if (f.dashT > 0 && f.pounce) {
        const aim = (f === me) ? (f._dashAim != null ? f._dashAim : this.aim) : (f._dashAim || f._aim || 0);
        f.x = clamp(f.x + Math.cos(aim) * f.speed * 3 * dt, BATTLE_MARGIN.side, this.W - BATTLE_MARGIN.side);
        f.y = clamp(f.y + Math.sin(aim) * f.speed * 3 * dt, this.topMargin, this.H - this.bottomMargin);
      }
      // pounce contact damage on nearest enemy
      if (f.pounce) {
        const e = this.nearestEnemy(f.x, f.y);
        if (e && e.flash <= 0 && e.inv <= 0 && Math.hypot(f.x - e.x, f.y - e.y) < f.r + 22) {
          this.resolveHit(e, 'me', f._pounceSkill || { element: f.element }, f.dmg * 1.6 * (f.damageBoostT>0?1.25:1)*(f.weakened?0.5:1), e.x, e.y);
          f.pounce = false;
        }
      }
      // non-active alive cats fight autonomously via their gambits
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
    // First-fight coach: while teaching move/attack/skill, enemies stand down so a
    // brand-new player can learn the controls without taking damage.
    const coachHold = this.coachHoldsEnemies();
    for (const e of this.enemies) { if (e.flash > 0) e.flash -= dt; }
    for (const e of this.liveEnemies()) {
      this.tickWards(e, dt);                           // protect/reflect/barrier timers
      if (e.wardCd > 0) e.wardCd -= dt;
      // apply + decay hit knockback (independent of AI so even a frozen/casting enemy flies back)
      if (e.kbx || e.kby) {
        e.x = clamp(e.x + e.kbx * dt, BATTLE_MARGIN.side, this.W - BATTLE_MARGIN.side);
        e.y = clamp(e.y + e.kby * dt, this.topMargin, this.H - this.bottomMargin);
        const decay = Math.exp(-9 * dt); e.kbx *= decay; e.kby *= decay;
        if (Math.abs(e.kbx) < 4 && Math.abs(e.kby) < 4) { e.kbx = 0; e.kby = 0; }
      }
      const canAct = this.tickStatus(e, dt);          // DoT + CC; false = frozen this frame
      if (coachHold) { e.pose = 'idle'; e.telegraph = 0; }   // tutorial: hold fire
      else if (e.alive && canAct) this.updateEnemyAI(dt, e, me);
      else if (e.alive) { e.pose = 'idle'; e.telegraph = 0; }  // frozen: drop any windup, stand still
    }

    // ---- projectiles ----
    for (const p of this.projectiles) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      p._tc = (p._tc || 0) + dt;
      if (p._tc > 0.02) { p._tc = 0; this.vfx.trail(p.x, p.y, p.color, p.r * 0.8); }
      // A lobbed AOE flies OVER enemies to its landing point, then bursts (it does
      // not collide on contact). Show its target ring; detonate on arrival/expiry.
      if (p.burst) {
        this.vfx.ring(p.burst.tx, p.burst.ty, { r0: p.burst.r, vr: 0, life: 0.08, color: p.burst.col, width: 2 });
        if (p.life <= 0 || Math.hypot(p.x - p.burst.tx, p.y - p.burst.ty) < 16) { this.burstAt(p); p.life = 0; }
        continue;
      }
      if (p.owner === 'me') {
        for (const e of this.liveEnemies()) {
          if (e.flash <= 0 && e.inv <= 0 && Math.hypot(p.x - e.x, p.y - e.y) < p.r + 22) {
            const r = this.resolveHit(e, 'me', p.skill || { element: p.element }, p.dmg, p.x, p.y, p);
            if (r.reflected) break;            // bounced back — projectile lives, now enemy-owned
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

    this.vfx.update(dt);
    for (const q of this.particles) { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 60 * dt; q.life -= dt; }
    this.particles = this.particles.filter(q => q.life > 0);
    for (const fl of this.floaters) { fl.y -= 40 * dt; fl.life -= dt; }
    this.floaters = this.floaters.filter(fl => fl.life > 0);

    // win when the whole pack is down; "captureReady" when any enemy is low
    const live = this.liveEnemies();
    this.captureReady = live.some(e => e.hp / e.maxhp < 0.28);
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


    if (live.length === 0) this.finish(true);
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
    if(!best||dist>Math.max(36,best.r?best.r+20:45))return false;
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

  // ---- per-enemy AI with PACK COORDINATION ----
  // Coordination: enemies spread out (separation), surround the player from
  // different angles, and stagger their telegraphed specials so the player
  // always has a gap to dodge into (no simultaneous novas).
  updateEnemyAI(dt, e, meIgnored) {
    // target the nearest ALIVE team cat (so the enemy engages whoever's closest)
    let me = null, md = 1e9;
    for (const tf of this.team) { if (!tf.alive) continue; const d = Math.hypot(tf.x - e.x, tf.y - e.y); if (d < md) { md = d; me = tf; } }
    if (!me) return;
    const dx = me.x - e.x, dy = me.y - e.y;
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
    if (threat && e.dodgeCd <= 0) {
      const pv = Math.hypot(threat.vx, threat.vy) || 1;
      let nx = -threat.vy / pv, ny = threat.vx / pv;
      if ((e.x < this.W / 2) === (nx < 0)) { nx = -nx; ny = -ny; }
      ax = nx; ay = ny; e.dodgeCd = 0.5 - e.rIdx * 0.07; e.pose = 'play';
      if (e.rIdx >= 1) this.vfx.burst(e.x, e.y, { count: 3, color: '#cfe', speed: 120, life: 0.2 });
    } else {
      // surround: each enemy picks a slot angle around the player so they don't stack
      const slot = (e.i / Math.max(1, this.enemies.length)) * Math.PI * 2;
      // LEARNED: crowd a kiter / kite a brawler — attack the player's comfort zone.
      let want = 200 - e.aggro * 80;
      if (this.aiP && this._aiConf) want = clamp(want + (0.5 - this.aiP.favRange) * 60 * this._aiConf, 90, 230);
      const desiredX = me.x + Math.cos(slot + this.t * 0.4) * want;
      const desiredY = me.y + Math.sin(slot + this.t * 0.4) * want;
      const gx = desiredX - e.x, gy = desiredY - e.y, gl = Math.hypot(gx, gy) || 1;
      ax = gx / gl; ay = gy / gl;
      // separation from packmates (don't clump)
      for (const o of this.liveEnemies()) {
        if (o === e) continue;
        const sx = e.x - o.x, sy = e.y - o.y, sd = Math.hypot(sx, sy) || 1;
        if (sd < 70) { ax += (sx / sd) * 0.8; ay += (sy / sd) * 0.8; }
      }
    }
    const spd=e.speed*(1+e.aggro*.4+e.phase*.16)*(e.slowed?.5:1);   // 感电减速
    e.x = clamp(e.x + ax * spd * dt, BATTLE_MARGIN.side, this.W - BATTLE_MARGIN.side);
    e.y = clamp(e.y + ay * spd * dt, this.topMargin, this.H - this.bottomMargin);
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
    if (e.special <= 0 && (this._novaLock || 0) === 0) {
      let kind = null;
      if (dist < 150 && (me.rootT > 0 || me.frozen || e.aggro > 0.4)) kind = 'nova';     // close + punish window
      else if (dist < 220 && e.role === 'ambusher' && (e.challenge || 0) > 0) kind = 'pounce';  // ambusher leap
      else if (dist >= 130 && dist < 340) kind = (e.rIdx >= 1 && Math.random() < 0.5) ? 'lob' : 'barrage';
      else if (dist < 320) kind = 'barrage';
      if (kind) {
        e.special = Math.max(2.6, e.specialCd - e.aggro * 1.5) + Math.random();          // +recovery floor
        e.telegraphKind = kind;
        this._novaLock = 1;                                   // pack cast-lock: others keep basic-firing
        e.telegraph = Math.min(1.2, 0.8 + e.rIdx * 0.1) * (this.aiReact || 1);
        e.telegraphMax = e.telegraph;
        e.telegraphAim = this.leadAngle(e, me, 300);          // predictive lead (see leadAngle)
        if (kind === 'nova') this.game.toast('⚠️ 野猫在蓄力大招！');
        return;
      }
    }

    // normal aimed fire — only within effective range, with a cadence floor so a
    // wounded enemy can't machine-gun. Predictively led.
    e.fireCd -= dt;
    if (e.fireCd <= 0 && dist < 340) {
      // Manual play is harder than letting the AI dodge for you, so give a human
      // pilot ~25% more breathing room between enemy shots (auto mode stays brisk).
      const manualEase = this.autoMode ? 1 : 1.25;
      e.fireCd = Math.max(0.5, e.fireRate * (1 - e.aggro * 0.35)) * (e.slowed ? 1.8 : 1) * manualEase;   // +floor; 感电降攻速
      let lead = this.leadAngle(e, me, 240 + e.rIdx * 40);
      if (e.blinded) lead += (Math.random() - 0.5) * 1.2;                    // 失明→乱射
      const wc = this.elemColor(e.element);
      const dd = e.dmg * (e.status && e.status.weaken ? 0.5 : 1);            // 虚弱→伤害减半
      this.spawnProj(e.x, e.y, lead, 240 + e.rIdx * 40, dd, 'wild', wc, 7, 'ball');
      if (e.rIdx >= 2) {
        this.spawnProj(e.x, e.y, lead + 0.22, 230, dd * 0.8, 'wild', wc, 6, 'ball');
        this.spawnProj(e.x, e.y, lead - 0.22, 230, dd * 0.8, 'wild', wc, 6, 'ball');
      }
    }
  }

  // Predictive aim: lead the target by its SMOOTHED velocity (see the velocity
  // sampler in update), capped so a strafer about to reverse isn't wildly over-led.
  // aiLeadConf / aiJitter / learned strafe bias come from the adaptive layer.
  leadAngle(s, me, projSpeed) {
    const dx = me.x - s.x, dy = me.y - s.y, dist = Math.hypot(dx, dy) || 1;
    const t = dist / projSpeed, vmax = (me.speed || 150) * 0.6;
    const lead = this.aiLeadConf != null ? this.aiLeadConf : 1;
    let px = dx + clamp((me._vx || 0) * t, -vmax, vmax) * lead;
    let py = dy + clamp((me._vy || 0) * t, -vmax, vmax) * lead;
    if (this.aiP && this._aiConf) {                       // learned: bias toward the side they habitually strafe
      const perp = Math.atan2(dy, dx) + Math.PI / 2, k = this.aiP.dodgeDir * this._aiConf * vmax * 0.5;
      px += Math.cos(perp) * k; py += Math.sin(perp) * k;
    }
    let ang = Math.atan2(py, px);
    if (this.aiJitter) ang += (Math.random() * 2 - 1) * this.aiJitter;  // human slop / difficulty
    return ang;
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
    if (e.telegraphKind === 'nova') {
      const n = 12 + e.rIdx * 4;
      const off = Math.random() * Math.PI;
      for (let i = 0; i < n; i++) this.spawnProj(e.x, e.y, off + (i / n) * Math.PI * 2, 200, e.dmg * pow, 'wild', col, 7, 'ball', sk);
      this.vfx.shockwave(e.x, e.y, col);
      this.vfx.ring(e.x, e.y, { r0: 10, vr: 520, life: 0.45, color: col, width: 6 });
      e.inv = 0.25;
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
    const playerUltSoon = this.ult >= 95;
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
    // combo: existing tag + this skill → amplified burst
    const combo = Skills.checkCombo ? Skills.checkCombo(e.tags, skill) : null;
    if (combo) {
      dmg *= combo.bonusMult || 1;
      this.vfx.ring(e.x, e.y, { r0: 8, vr: 460, life: 0.45, color: this.elemColor(skill.element), width: 6 });
      this.vfx.text(e.x, e.y - 50, '✦', '#ffd36b', 12);
      // The paired-element strike and status effect carry the feedback.
      if (combo.consumes && e.tags.includes(combo.tag)) { e.tags = e.tags.filter(t => t !== combo.tag); delete e.status[combo.tag]; }
    }
    // element effectiveness
    const mult = this.elemMult(skill.element, e.sp.id);
    if (mult > 1) { dmg *= mult; this.vfx.text(x, y - 14, '↑', '#ff7b9c', 12); }
    else if (mult < 1) { dmg *= mult; this.vfx.text(x, y - 14, '↓', '#9aa8ba', 11); }
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
    return dmg;
  }

  // A distinct cast flourish per status so a control landing READS as control,
  // not a plain poke. Pairs with the persistent on-body overlay in draw().
  controlFx(e, tag, color) {
    switch (tag) {
      case 'dizzy':   // spinning stars ring overhead
        this.vfx.ring(e.x, e.y - 30, { r0: 4, vr: 120, life: 0.5, color, width: 3 });
        this.vfx.text(e.x, e.y - 52, '✦ ✦ ✦', color, 14); break;
      case 'blind':   // dark wash + shrinking veil
        this.vfx.ring(e.x, e.y, { r0: 34, vr: -60, life: 0.45, color: '#5a4a6a', width: 10 });
        this.vfx.burst(e.x, e.y, { count: 8, color: '#2a2030', speed: 90, life: 0.4, r: 4 }); break;
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
        if (lo < e.hp) { const d = e.hp - lo; e.hp = lo; this.vfx.text(e.x, e.y - 40, '⏪ 回溯 -' + Math.round(d), info.color, 16); this.vfx.ring(e.x, e.y, { r0: 10, vr: 480, life: 0.5, color: info.color, width: 5 }); if (e.hp <= 0 && e.alive) { e.alive = false; this.spawnBurst(e.x, e.y, '💫', info.color, 12); } }
        delete e.status[tg]; e.tags = (e.tags || []).filter(t => t !== tg); continue;
      }
      // damage-over-time
      if (info.dps) {
        const d = e.maxhp * info.dps * dt;
        e.hp = Math.max(0, e.hp - d);
        if (Math.random() < dt * 3) this.vfx.text(e.x + (Math.random() * 16 - 8), e.y - 18, '-' + Math.max(1, Math.round(e.maxhp * info.dps)), info.color, 10);
        if (e.hp <= 0 && e.alive) { e.alive = false; this.spawnBurst(e.x, e.y, '💫', info.color, 10); this.game.toast(e.sp.name + ' 倒下了！'); }
      }
      // crowd control: chill/bind/dizzy stop the enemy acting/moving
      if (tg === 'chill' || tg === 'bind' || tg === 'dizzy') frozen = true;
    }
    e.frozen = frozen;
    // shock/blind flags for the AI to read
    e.slowed = !!(e.status.shock);
    e.blinded = !!(e.status.blind);
    return !frozen;
  }

  hurtEnemy(e, dmg, fx, fy, isDot) {
    // a direct player hit extends the combo and gets the combo damage multiplier
    if (!isDot) {
      dmg *= this.comboMult(); this.addCombo(1);
      if(this.duo)this.duoCharge=Math.min(100,this.duoCharge+11);
    }
    // vulnerability debuffs amplify incoming damage (破绽/破甲)
    const TAG = (window.Skills && Skills.TAG_INFO) || {};
    if (e.status) for (const tg in e.status) { const info = TAG[tg]; if (info && info.dmgTaken) dmg *= info.dmgTaken; }
    const scaled = dmg;
    e.hp = Math.max(0, e.hp - scaled);
    e.flash = 0.16;
    // Weighty impact on DIRECT hits only (DoT ticks stay quiet to avoid noise):
    // a short damage-scaled hitstop + a micro screen-shake that grows with combo heat.
    if (!isDot) {
      const touch = !!this.game.isTouch;
      const frac = e.maxhp ? Math.min(1, scaled / e.maxhp) : 0.2;
      const stop = (touch ? 0.03 : 0.045 + frac * 0.06);          // ~30ms mobile, 45-105ms desktop
      this.hitstop = Math.max(this.hitstop, stop);
      const heat = Math.min(1, this.combo / 20);
      this.shakeT = Math.max(this.shakeT, (touch ? 0.04 : 0.06) + 0.05 * heat);
      // KNOCKBACK (Hades-style punch): shove the enemy away from the hit point,
      // scaled by how big the hit was. Heavier enemies (SR/SSR) resist more.
      const kx = e.x - fx, ky = e.y - fy, kl = Math.hypot(kx, ky) || 1;
      const power = (90 + 240 * frac) / (1 + e.rIdx * 0.6);
      e.kbx = (e.kbx || 0) + (kx / kl) * power;
      e.kby = (e.kby || 0) + (ky / kl) * power;
    }
    // bigger, brighter number as the combo climbs (crescendo feel)
    const big = this.combo >= 15 ? 18 : this.combo >= 6 ? 15 : 13;
    this.floater(e.x, e.y - 24, '-' + Math.round(scaled), this.combo >= 15 ? '#ffd36b' : '#fff', big);
    this.spawnBurst(fx, fy, '✦', '#ffd36b', 3);
    this.gainUlt(3);
    if (e.hp <= 0 && e.alive) { e.alive = false; this.spawnBurst(e.x, e.y, '💫', '#ffd36b', 12); this.game.toast(e.sp.name + ' 斗志耗尽！'); }
  }
  hurtMe(dmg, fx, fy, f) {
    f = f || this.me();
    if (!f.alive) return;
    // First-fight coach: a beginner can take hits to learn, but never dies during
    // the tutorial — damage is gentled and HP floored so the first fight is safe.
    if (this.coach) dmg *= 0.35;
    // Barrier (shieldT) reduction now lives in resolveHit, which every enemy hit
    // routes through. hurtMe lands the (already shield-adjusted) damage.
    f.hp = Math.max(this.coach ? 1 : 0, f.hp - dmg);
    f.hitFlash = 0.14; f.inv = 0.3;
    if (f === this.me()) this.shakeT = 0.18;
    this.floater(f.x, f.y - 24, '-' + Math.round(dmg), '#ff6b8a');
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
      this.vfx.ring(target.x, target.y, { r0: 10, vr: 300, life: 0.3, color: '#9be7c4', width: 5 });
      this.vfx.text(target.x, target.y - 40, '格挡', '#9be7c4', 15);
      return { blocked: true, reflected: false, dealt: 0 };
    }
    // 2) REFLECT (反弹壁): flip a flying projectile back at its owner (capped so
    //    it can't ping-pong forever). Instant melee/aoe/chain are NOT reflected.
    if ((target.reflectT || 0) > 0 && proj && (proj._reflects || 0) < 1) {
      proj._reflects = (proj._reflects || 0) + 1;
      proj.owner = side === 'me' ? 'wild' : 'me';
      proj.vx = -proj.vx; proj.vy = -proj.vy; proj.life = Math.max(proj.life, 1.2);
      this.vfx.ring(target.x, target.y, { r0: 8, vr: 260, life: 0.25, color: '#b8e0ff', width: 4 });
      this.vfx.text(target.x, target.y - 40, '反弹', '#b8e0ff', 15);
      return { blocked: false, reflected: true, dealt: 0 };
    }
    // 3) BARRIER (护盾): percentage damage reduction (keeps the existing 55%).
    if ((target.shieldT || 0) > 0) dmg *= 0.55;
    // VULNERABLE after a Protect drops (后遗症): takes extra damage briefly.
    if ((target.vulnerableT || 0) > 0) dmg *= 1.3;
    // land it
    if (side === 'me') {
      const dealt = this.applyHitEffects(target, skill || { element: null }, dmg, x, y);
      this.hurtEnemy(target, dealt, x, y);
      this.vfx.impact(x, y, col);
      return { blocked: false, reflected: false, dealt };
    } else {
      // Enemy hit on a cat: type matchup matters defensively too, and an enemy
      // special can leave a DoT/soft-CC on the cat (mirror of applyHitEffects).
      const dealt = this.applyEnemyHitEffects(target, skill || { element: null }, dmg, x, y);
      this.hurtMe(dealt, x, y, target);
      this.vfx.impact(x, y, col);
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
    for (const tg in f.status) { const info = TAG[tg]; if (info && info.dmgTaken) dmg *= info.dmgTaken; }
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
    this.spawnBurst(f.x, f.y, '💫', '#c9b6ff', 10);
    const anyAlive = this.team.some(t => t.alive);
    if (!anyAlive) { this.finish(false); return; }
    this.game.toast(`${State.catName(f.cat)} 累瘫了！`);
    // if the ACTIVE cat fainted, hand control to another living cat
    if (f === this.me()) {
      const next = this.team.findIndex(t => t.alive);
      if (next >= 0) this.active = next;
    }
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
    let sx = 0, sy = 0;
    // Screen shake — gentler on phones (thumb occludes the view; big shake nauseates).
    if (this.shakeT > 0) { const amp = this.game.isTouch ? 4 : 9; sx = (Math.random() - 0.5) * amp; sy = (Math.random() - 0.5) * amp; }
    ctx.save(); ctx.translate(sx, sy);

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
      if(elapsed<1.75)// Duo name is visible on its single compact HUD button, not across the arena.
      ctx.restore();
    }

    if (this.flash > 0) { ctx.fillStyle = `rgba(157,123,255,${this.flash})`; ctx.fillRect(0, 0, W, H); }

    this.drawUltCinematic(ctx, W, H);

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

    // vfx under-layer (trails, rings, muzzle)
    this.vfx.draw(ctx);
    this.drawSkillStrokes(ctx);

    // projectiles with glow
    for (const p of this.projectiles) {
      ctx.save(); ctx.translate(p.x, p.y);
      // Keep the silhouettes crisp: no generic circular glow halo around
      // every projectile. A hit gets a brief impact effect instead.
      ctx.globalAlpha=1;ctx.fillStyle=p.color;
      if(p.kind==='star'){ctx.rotate(this.t*8);star(ctx,0,0,p.r,p.r*.5,5);}
      else if(p.kind==='claw'){
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
      if(!['claw','leaf','fireball','hex','fur','ball'].includes(p.kind)){
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
        if (e.telegraphKind === 'nova') {
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
      ctx.save();
      if (e.flash > 0) ctx.globalAlpha = 0.6;
      if(e.phase>0){
        ctx.strokeStyle=e.phase>1?'#ff794f':'#ffc16e';ctx.lineWidth=3;
        ctx.beginPath();ctx.arc(e.x,e.y,31+Math.sin(this.t*4)*3,0,Math.PI*2);ctx.stroke();
      }
      // status color wash (frozen=blue tint, burn=orange, etc.) via a soft overlay ring
      if (e.status) { const k = Object.keys(e.status); if (k.length) { const info = (Skills.TAG_INFO || {})[k[0]]; if (info) { ctx.save(); ctx.globalAlpha = 0.25 + 0.15 * Math.sin(this.t * 6); ctx.fillStyle = info.color; ctx.beginPath(); ctx.ellipse(e.x, e.y + 6, 24, 30, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); } } }
      (window.CatMotion?.draw||CatArt.drawCat)(ctx,e.x,e.y,{
        species:e.sp,scale:1.05,face:e.face,t:e.t,
        stride:e.stride,motion:e.motion||0,
        pose:e.frozen?'idle':e.pose,
        mood:e.frozen?'sleepy':((e.hp/e.maxhp<.28)?'sleepy':'alert')
      });
      this.drawControlOverlay(ctx, e);                     // persistent CC markers over the body
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
      if (this.autoMode && this.commandTarget && e === this.commandedTarget(this.commandTarget.x, this.commandTarget.y)) {
        ctx.save();
        const pulse = 0.5 + 0.4 * Math.abs(Math.sin(this.t * 5));
        ctx.globalAlpha = pulse; ctx.strokeStyle = '#ff5a7a'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(e.x, e.y, 34 + 3 * Math.sin(this.t * 5), 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = pulse; ctx.fillStyle = '#ff5a7a'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('🎯 集火', e.x, e.y - 58);
        ctx.restore();
      }
      const elemSym = this.elemSymbol(e.element);
      this.hpTag(ctx, e.x, e.y - 42, e.hp / e.maxhp, GameData.RARITY[e.sp.rarity].color, `${elemSym} ${e.sp.name} Lv.${e.level}`);
      // status icons row under the HP tag
      if (e.status) {
        const keys = Object.keys(e.status); const TAG = Skills.TAG_INFO || {};
        const icons = { burn: '🔥', soak: '💧', shock: '⚡', oil: '🛢️', chill: '❄️', dizzy: '💫', bleed: '🩸', blind: '🌀', bind: '🌿', expose: '❗', weaken: '🔻', rust: '🪓' };
        ctx.save(); ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
        const shown = keys.slice(0, 5);
        shown.forEach((tg, i) => {
          const ix = e.x - (shown.length - 1) * 8 + i * 16, iy = e.y - 50;
          ctx.fillText(icons[tg] || '●', ix, iy);
          // thin countdown arc under the icon (remaining / ttl) so duration is legible
          const info = TAG[tg]; const frac = info && info.ttl ? Math.max(0, Math.min(1, e.status[tg] / info.ttl)) : 0;
          if (frac > 0) { ctx.strokeStyle = info ? info.color : '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ix, iy + 4, 7, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.stroke(); }
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
      let visualX=tf.x,visualY=tf.y,visualPose=tf.pounce?'play':(tf.moving?'walk':'idle');
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
      ctx.save();
      if (!isMe) ctx.globalAlpha = 0.9;
      if (tf.inv > 0 && Math.floor(this.t * 20) % 2 === 0) ctx.globalAlpha = 0.5;
      if (tf.hitFlash > 0) ctx.globalAlpha = 0.5;
      // active cat gets a soft golden ground ring so you know who you control
      if (isMe) { ctx.fillStyle = 'rgba(255,211,107,0.13)'; ctx.beginPath(); ctx.ellipse(visualX,visualY+3,27,7,0,0,Math.PI*2);ctx.fill(); }
      const visualFace=route?(route.toX-route.fromX)*(this.duoRun.age/this.duoRun.duration<.70?1:-1)<0?-1:1
        :(tf.face||(Math.cos(fAim)<0?-1:1));
      (window.CatMotion?.draw||CatArt.drawCat)(ctx,visualX,visualY,{
        species:sp2,scale:1.04,face:visualFace,t:tf.t||this.t,
        pose:visualPose,motion:route?1:(tf.moving?.86:0),
        stride:route?this.duoRun.age*26:tf.t*13,mood:'happy'
      });
      ctx.restore();
      const sym = this.elemSymbol(tf.element);
      this.hpTag(ctx, tf.x, tf.y - 42, tf.hp / tf.maxhp, isMe ? '#ffd36b' : '#9be7c4', `${sym} ${State.catName(tf.cat)}${isMe ? ' ◀' : ''}`);
    }

    // particles & floaters
    for (const q of this.particles) { ctx.save(); ctx.globalAlpha = Math.max(0, q.life); ctx.fillStyle = q.color; ctx.font = `${q.size}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText(q.ch, q.x, q.y); ctx.restore(); }
    for (const fl of this.floaters) { ctx.save(); ctx.globalAlpha = Math.max(0, fl.life); ctx.fillStyle = fl.color; ctx.font = 'bold ' + (fl.size || 15) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.strokeText(fl.text, fl.x, fl.y); ctx.fillText(fl.text, fl.x, fl.y); ctx.restore(); }

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

    ctx.restore();
  }

  // Persistent, distinct markers drawn over a controlled enemy's body so a
  // crowd-control state reads at a glance for its whole (now-longer) duration.
  drawControlOverlay(ctx, e) {
    if (!e.status) return;
    const s = e.status, T = this.t;
    ctx.save();
    if (s.dizzy != null) {                 // orbiting stars overhead
      ctx.fillStyle = '#ffe08a';
      for (let i = 0; i < 3; i++) { const a = T * 4 + i * (Math.PI * 2 / 3); ctx.globalAlpha = 0.9; ctx.font = '12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('✦', e.x + Math.cos(a) * 16, e.y - 34 + Math.sin(a) * 5); }
    }
    if (s.chill != null) {                 // pale ice shell
      ctx.globalAlpha = 0.35 + 0.1 * Math.sin(T * 3); ctx.strokeStyle = '#bfe6ff'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(e.x, e.y + 2, 26, 32, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 0.9; ctx.fillStyle = '#eaf7ff'; for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.4; ctx.fillText('❄', e.x + Math.cos(a) * 24, e.y + 2 + Math.sin(a) * 28); }
    }
    if (s.bind != null) {                  // green vines wrapping
      ctx.globalAlpha = 0.8; ctx.strokeStyle = '#6fcf5f'; ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(e.x, e.y + 4 + i * 8 - 8, 22 - i * 2, 7, 0.2 * Math.sin(T * 2 + i), 0, Math.PI * 2); ctx.stroke(); }
    }
    if (s.blind != null) {                 // dark veil over the eyes
      ctx.globalAlpha = 0.5; ctx.fillStyle = '#2a2036';
      ctx.beginPath(); ctx.ellipse(e.x, e.y - 8, 24, 12, 0, 0, Math.PI * 2); ctx.fill();
    }
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

  hpTag(ctx, x, y, frac, color, label) {
    // Cream game-card label: more legible over the illustrated garden.
    const w=86,h=6;
    ctx.save();
    ctx.fillStyle='rgba(255,250,239,.92)';
    ctx.strokeStyle='rgba(114,124,101,.28)';
    ctx.lineWidth=1;
    rr(ctx,x-w/2-7,y-23,w+14,36,12);ctx.fill();ctx.stroke();
    ctx.textAlign='center';ctx.font='700 11px system-ui, sans-serif';
    ctx.fillStyle='#4d5b49';ctx.fillText(label,x,y-9);
    ctx.fillStyle='rgba(112,132,110,.16)';
    rr(ctx,x-w/2,y-3,w,h,3);ctx.fill();
    const health=Math.max(0,Math.min(1,frac));
    if(health>0){
      ctx.fillStyle=health>.3?'#8fbb9d':'#e7a38d';
      rr(ctx,x-w/2,y-3,w*health,h,3);ctx.fill();
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

window.Battle = { CaptureBattle };
