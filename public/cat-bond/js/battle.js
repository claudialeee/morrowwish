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

    // --- player runtime state: spread the whole team on the LEFT so all fight ---
    this.team.forEach((f,i)=>{f.x=this.W*(.18+(i%2)*.1);f.y=this.H*(.55+i*.085);});
    const f = this.me();
    this.aim = 0;                         // radians toward mouse
    this.ult = 0;                         // 0..100 ultimate meter
    // --- COMBO system: hits chain a multiplier; drops after a gap (需要操作维持) ---
    this.combo = 0;                       // current chain count
    this.comboT = 0;                      // seconds until the chain drops
    this.comboBest = 0;                   // best this battle
    this.comboFlash = 0;                  // milestone pop timer
    this.slowmo = 0;                      // perfect-dodge bullet-time timer

    // --- wild cat PACK: 1~3 enemies (rarer / commander-seeded = bigger packs) ---
    // The pack can be passed in via opts.pack (array of species); otherwise we
    // roll a size based on rarity and fill with the lead species + weaker friends.
    this.enemies = this.buildPack(wildSpecies);
    this.captureReady = false;

    // --- control mode: 'manual' | 'auto' (commander). Toggle in-battle. ---
    this.autoMode = false;
    this.commandTarget = null;    // commander focus-fire marker {x,y}

    // --- shared ---
    this.projectiles = [];               // {x,y,vx,vy,r,dmg,owner,life,color,kind}
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
    // spread the pack across the right half of the arena
    const col = total === 1 ? 0.7 : 0.58 + (i / Math.max(1, total - 1)) * 0.26;
    const element = (window.Skills && Skills.elementOf) ? Skills.elementOf(sp.id) : null;
    return {
      sp, i, element, rIdx, level,
      maxhp, hp: maxhp,
      x: this.W * col, y: this.H * (0.52 + (i % 2) * 0.13), vx: 0, vy: 0,
      face: -1, t: Math.random() * 3, pose: 'idle',
      fireCd: 0.6 + Math.random() * 0.8, dodgeCd: 0, special: 2 + Math.random() * 2,
      specialCd: 5 - rIdx * 0.6, telegraph: 0, telegraphKind: null, inv: 0,
      flash: 0, aggro: 0, heading: Math.PI, bolt: 0,
      dmg: (5 + rIdx * 2.2) * lvScale * (rIdx === 3 ? 1.10 : rIdx === 2 ? 1.06 : 1), speed: 92 + rIdx * 22, fireRate: Math.max(0.4, 1.1 - rIdx * 0.18),
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
      shieldT:0,damageBoostT:0,
      projSpeed: 300 + s.agi * 5,
      cd: { basic: 0, q: 0, e: 0 },
      // the two active skills this cat actually knows (from its element loadout)
      qSkill: loadout ? skillOf(loadout[1]) : null,
      eSkill: loadout ? skillOf(loadout[2]) : null,
      revived: false,
      alive: true,
      hitFlash: 0,
      t: Math.random() * 3, moving: false, _aim: 0,
    };
  }
  me() { return this.team[this.active]; }

  toggleAuto() {
    this.autoMode = !this.autoMode;
    this._autoLastAction=null;
    this.commandTarget=null;
    this.game.toast(this.autoMode ? '🤖 自动战斗 开启（你当指挥官）' : '🎮 手动操控 开启');
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
    const tgt=this.commandTarget
      ?this.nearestEnemy(this.commandTarget.x,this.commandTarget.y)
      :this.nearestEnemy(f.x,f.y);
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
    if(mag>0.04 && !(f.dashT>0&&f.pounce)){
      const spd=f.dashT>0?f.speed*3:f.speed;
      f.x=clamp(f.x+mx/mag*spd*dt,BATTLE_MARGIN.side,this.W-BATTLE_MARGIN.side);
      f.y=clamp(f.y+my/mag*spd*dt,this.topMargin,this.H-this.bottomMargin);
      f.face=mx<0?-1:mx>0?1:f.face;
      f.moving=true;
    }else f.moving=false;
    const near=threat?.p||null;
    this.evalGambits(f,tgt,Math.hypot(tgt.x-f.x,tgt.y-f.y),near,threat?.d??Infinity);
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

  // Ally AI: a non-active team cat fights on its own — flanks near the player,
  // dodges incoming fire, and runs its gambit rules against the nearest enemy.
  updateAllyAI(dt, f) {
    const tgt = this.nearestEnemy(f.x, f.y);
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
    if (f.dashT <= 0) {
      const spd = f.speed * 0.9;
      f.x = clamp(f.x + mx * spd * dt, BATTLE_MARGIN.side, this.W - BATTLE_MARGIN.side);
      f.y = clamp(f.y + my * spd * dt, this.topMargin, this.H - this.bottomMargin);
      f.face = dx < 0 ? -1 : 1; f.moving = (mx || my) ? true : false;
    }
    if(near && this.incomingThreat(f) && f.dodgeCd<=0) this.dodge(f);
    this.evalGambits(f, tgt, dist, near, nd);
  }

  // ---------------- input (polled from game.keys / game.mouse) ----------------
  readInput(dt) {
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

    // aim: toward mouse on desktop; on touch, auto-aim the nearest enemy
    const joy = this.game.joystick;
    if (this.game.isTouch) {
      const tgt = this.nearestEnemy ? this.nearestEnemy(f.x, f.y) : null;
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
    if (mx || my) {
      const l = Math.hypot(mx, my);
      const spd = f.dashT > 0 ? f.speed * 3 : f.speed;
      f.x += (mx / l) * spd * dt;
      f.y += (my / l) * spd * dt;
      f.face = mx < 0 ? -1 : (mx > 0 ? 1 : f.face);
      f.moving = true;
    } else { f.moving = false; }
    // if dashing without input, continue dash in aim dir
    if (f.dashT > 0 && !mx && !my) { f.x += Math.cos(this.aim) * f.speed * 3 * dt; f.y += Math.sin(this.aim) * f.speed * 3 * dt; }
    f.x = clamp(f.x, BATTLE_MARGIN.side, this.W - BATTLE_MARGIN.side);
    f.y = clamp(f.y, this.topMargin, this.H - this.bottomMargin);

    // edge-triggered actions
    const pressed = k => K[k] && !this._prevKeys[k];
    // basic attack: left mouse held OR J
    if (m.down || K['j']) this.fireBasic();
    if (pressed('q')) this.skillQ();
    if (pressed('e')) this.skillE();
    if (pressed(' ')) this.dodge();
    if (pressed('r')) this.ultimate();
    if (pressed('1')) this.switchTo(0);
    if (pressed('2')) this.switchTo(1);
    if (pressed('3')) this.switchTo(2);

    this._prevKeys = Object.assign({}, K);
  }

  // mouse-only / on-screen button casts (aim auto toward nearest enemy)
  castMove(key) {
    const f = this.me();
    const e = this.nearestEnemy(f.x, f.y);
    if (e) this.aim = Math.atan2(e.y - f.y, e.x - f.x);
    if (key === 'basic') this.fireBasic();
    else if (key === 'q') this.skillQ();
    else if (key === 'e') this.skillE();
    else if (key === 'ult') this.ultimate();
  }

  // actions accept an optional fighter + aim so ALLIES can use them too.
  fireBasic(f, aim) {
    f = f || this.me(); if (f.cd.basic > 0) return;
    if (aim == null) aim = (f === this.me()) ? this.aim : f._aim || 0;
    f.cd.basic = this.moves[0].cd * (f.bond.cdReduction || 1);
    const col = this.elemColor(f.element);
    const mx = f.x + Math.cos(aim) * 22, my = f.y + Math.sin(aim) * 22;
    // 猫爪=近身快攻: short-lived projectile so it only reaches ~short range
    this.spawnProj(mx, my, aim, f.projSpeed, f.dmg*(f.damageBoostT>0?1.25:1), 'me', col, 5, 'claw', { element: f.element }, 0.45);
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
        if(f.shieldT>.25)return false;
        f.shieldT=4.8;
      }else{
        if(f.damageBoostT>.3)return false;
        f.damageBoostT=6;
      }
      this.vfx.ring(f.x,f.y,{r0:10,vr:190,life:.55,color:shield?'#9dd8ff':'#ffd9a0',width:4});
      this.vfx.text(f.x,f.y-34,shield?'护盾':'强化','#f8eab8',14);
    }else return false;
    this.gainUlt(6);
    if(f===this.me())this.game.toast('✨ '+sk.name+'！');
    return true;
  }

  skillQ(f, aim) {
    f = f || this.me(); if (f.cd.q > 0) return false;
    if (aim == null) aim = (f === this.me()) ? this.aim : f._aim || 0;
    const sk = f.qSkill;
    if(sk&&(sk.kind==='heal'||sk.kind==='buff')){
      if(!this.castSupportSkill(f,sk))return false;
      f.cd.q=sk.cd*(f.bond.cdReduction||1);
      return true;
    }
    f.cd.q = (sk ? sk.cd : this.moves[1].cd) * (f.bond.cdReduction || 1);
    const col = this.elemColor(sk ? sk.element : f.element);
    const pow = (sk ? sk.power : 0.8)*(f.damageBoostT>0?1.25:1);
    const kind = sk ? sk.kind : 'projectile';
    if (kind === 'melee') {
      // 近战: short-range arc slash — only hits enemies within MELEE_RANGE, big damage
      this.meleeStrike(f, aim, sk, f.dmg * pow * 1.4, col);
    } else {
      // 远程: projectile fan that flies the full arena
      for (let i = -2; i <= 2; i++) this.spawnProj(f.x, f.y, aim + i * 0.18, f.projSpeed * 0.8, f.dmg * pow, 'me', col, 7, 'fur', sk);
      this.vfx.muzzle(f.x, f.y, aim, col);
      this.vfx.burst(f.x, f.y, { count: 10, color: col, angle: aim, spread: 1.4, speed: 160, life: 0.35 });
    }
    this.gainUlt(8);
    if (f === this.me()) this.game.toast('🧶 ' + (sk ? sk.name : '毛球散射') + '！');
    return true;
  }

  // smallest signed angle between two headings
  angleDiff(a, b) { let d = a - b; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; }
  // 近战范围攻击: an instant arc in front of the caster, hitting enemies within range
  meleeStrike(f, aim, skill, dmg, col) {
    const RANGE = 90, ARC = 1.1;
    this.vfx.ring(f.x, f.y, { r0: RANGE * 0.4, vr: 520, life: 0.22, color: col, width: 7 });
    // slash arc VFX
    for (let i = -2; i <= 2; i++) this.vfx.burst(f.x + Math.cos(aim) * 40, f.y + Math.sin(aim) * 40, { count: 2, color: col, angle: aim + i * 0.3, spread: 0.3, speed: 180, life: 0.25 });
    let hit = false;
    for (const e of this.liveEnemies()) {
      const d = Math.hypot(e.x - f.x, e.y - f.y);
      if (d > RANGE + 22) continue;
      const ang = Math.atan2(e.y - f.y, e.x - f.x);
      if (Math.abs(this.angleDiff(ang, aim)) > ARC) continue;   // must be in the frontal arc
      const dd = this.applyHitEffects(e, skill, dmg, e.x, e.y);
      this.hurtEnemy(e, dd, e.x, e.y); this.vfx.impact(e.x, e.y, col); hit = true;
    }
    if (hit) this.shakeT = Math.max(this.shakeT, 0.1);
  }
  skillE(f, aim) {
    f = f || this.me(); if (f.cd.e > 0) return false;
    if (aim == null) aim = (f === this.me()) ? this.aim : f._aim || 0;
    const sk = f.eSkill;
    if(sk&&(sk.kind==='heal'||sk.kind==='buff')){
      if(!this.castSupportSkill(f,sk))return false;
      f.cd.e=sk.cd*(f.bond.cdReduction||1);
      return true;
    }
    f.cd.e = (sk ? sk.cd : this.moves[2].cd) * (f.bond.cdReduction || 1);
    const col = this.elemColor(sk ? sk.element : f.element);
    if(sk&&sk.kind==='projectile'){
      for(let i=-1;i<=1;i++)
        this.spawnProj(f.x,f.y,aim+i*.12,f.projSpeed*.93,f.dmg*sk.power*(f.damageBoostT>0?1.25:1),'me',col,7,'fur',sk);
      this.vfx.burst(f.x,f.y,{count:8,color:col,angle:aim,spread:.8,speed:155,life:.3});
    }else if(sk&&sk.kind==='melee'){
      this.meleeStrike(f,aim,sk,f.dmg*sk.power*(f.damageBoostT>0?1.25:1),col);
    }else{
      f.dashT=.26;f.inv=.3;
      f.pounce=true;f._dashAim=aim;f._pounceSkill=sk;
      this.vfx.shockwave(f.x,f.y,col);
      this.vfx.burst(f.x,f.y,{count:12,color:col,angle:aim+Math.PI,spread:1.2,speed:220});
    }
    this.gainUlt(6);
    if(f===this.me())this.game.toast('💨 '+(sk?sk.name:'疾扑冲刺')+'！');
    return true;
  }
  dodge(f) {
    f = f || this.me(); if (f.dodgeCd > 0) return false;
    f.dodgeCd = 1.1; f.dashT = 0.2; f.inv = 0.38;
    // PERFECT DODGE: an enemy shot within ~36px when you dodge → bullet-time reward
    let perfect = false;
    for (const p of this.projectiles) {
      if (p.owner !== 'wild') continue;
      if (Math.hypot(p.x - f.x, p.y - f.y) < 40) { perfect = true; break; }
    }
    if (perfect && f === this.me()) {
      this.slowmo = 0.9; this.flash = 0.25; f.inv = 0.7;
      this.gainUlt(18);
      this.addCombo(3);                                  // reward precise timing with chain
      this.vfx.ring(f.x, f.y, { r0: 8, vr: 520, life: 0.5, color: '#9d7bff', width: 6 });
      this.vfx.text(f.x, f.y - 46, '完美闪避!', '#9d7bff', 18);
      this.game.toast('✨ 完美闪避！子弹时间 + 充能');
    } else {
      this.vfx.ring(f.x, f.y, { r0: 6, vr: 240, life: 0.3, color: '#ffffff', width: 2 });
      this.vfx.burst(f.x, f.y, { count: 6, color: '#ffffff', speed: 150, life: 0.3, r: 2 });
    }
    return true;
  }
  ultimate() {
    if (this.ult < 100) { this.game.toast('必杀能量不足'); return false; }
    const f = this.me(); this.ult = 0;
    for (let i = 0; i < 16; i++) this.spawnProj(f.x, f.y, (i / 16) * Math.PI * 2, f.projSpeed * 0.9, f.dmg * 1.3, 'me', '#9d7bff', 8, 'star');
    f.inv = 0.6; this.shakeT = 0.5; this.flash = 0.4;
    // big layered VFX
    this.vfx.shockwave(f.x, f.y, '#ffd36b');
    this.vfx.ring(f.x, f.y, { r0: 10, vr: 620, life: 0.5, color: '#9d7bff', width: 8 });
    this.vfx.burst(f.x, f.y, { count: 30, color: '#9d7bff', speed: 300, life: 0.6, r: 4 });
    this.vfx.burst(f.x, f.y, { count: 18, color: '#ffd36b', speed: 220, life: 0.5, r: 3 });
    this.vfx.text(f.x, f.y - 40, '喵之怒涛!', '#ffd36b', 22);
    this.game.toast('🌪️ 必杀·喵之怒涛！');
    return true;
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
  comboMult() { return 1 + Math.min(this.combo, 50) * 0.03; }   // up to ×2.5 at 50 hits
  addCombo(n) {
    this.combo += (n || 1);
    this.comboT = 1.3;                                          // drop window (需持续命中)
    if (this.combo > this.comboBest) this.comboBest = this.combo;
    // milestones: juice ramps with the chain (Balatro-style crescendo)
    if (this.combo > 0 && this.combo % 10 === 0) {
      this.comboFlash = 0.5; this.shakeT = Math.max(this.shakeT, 0.15);
      this.gainUlt(6);                                          // chains feed the ult
      const me = this.me();
      this.vfx.text(me.x, me.y - 60, this.combo + ' 连击!', '#ffd36b', 20);
      this.vfx.ring(me.x, me.y, { r0: 10, vr: 420, life: 0.4, color: '#ffd36b', width: 4 });
      this.game.toast('🔥 ' + this.combo + ' 连击！伤害 ×' + this.comboMult().toFixed(2));
    }
  }
  breakCombo() {
    if (this.combo >= 10) { const me = this.me(); this.vfx.text(me.x, me.y - 40, '连击中断…', '#9aa8ba', 13); }
    this.combo = 0; this.comboT = 0;
  }

  spawnProj(x, y, ang, spd, dmg, owner, color, r, kind, skill, life) {
    this.projectiles.push({ x, y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, dmg, owner, color, r, kind, life: life || 2.2, ang, skill: skill || null });
  }
  spawnBurst(x, y, ch, color, n) {
    for (let i = 0; i < n; i++) this.particles.push({ x, y, vx: Math.random() * 120 - 60, vy: -40 - Math.random() * 70, life: 0.7, ch, color, size: 11 + Math.random() * 8 });
  }
  floater(x, y, text, color, size) { this.floaters.push({ x, y, text, color, life: 0.9, size: size || 15 }); }

  // ---------------- update ----------------
  update(dt) {
    if (this.done) return;
    // perfect-dodge bullet-time: slow the WORLD but keep input responsive
    if (this.slowmo > 0) { this.slowmo -= dt; dt *= 0.35; }
    this.t += dt;
    if (this.shakeT > 0) this.shakeT -= dt;
    if (this.flash > 0) this.flash -= dt;
    if (this.comboFlash > 0) this.comboFlash -= dt;
    // combo chain decays if you stop landing hits (需持续操作维持)
    if (this.comboT > 0) { this.comboT -= dt; if (this.comboT <= 0 && this.combo > 0) this.breakCombo(); }
    this.gainUlt(12 * dt);                 // ult builds over time

    this.readInput(dt);

    // tick player cooldowns & timers
    for (const f of this.team) {
      f.t = (f.t || 0) + dt;
      for (const k in f.cd) if (f.cd[k] > 0) f.cd[k] -= dt;
      if (f.inv > 0) f.inv -= dt;
      if (f.dashT > 0) f.dashT -= dt; else f.pounce = false;
      if (f.dodgeCd > 0) f.dodgeCd -= dt;
      if (f.shieldT > 0) f.shieldT=Math.max(0,f.shieldT-dt);
      if (f.damageBoostT > 0) f.damageBoostT=Math.max(0,f.damageBoostT-dt);
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
          const dmg = this.applyHitEffects(e, f._pounceSkill, f.dmg * 1.6 * (f.damageBoostT>0?1.25:1), e.x, e.y);
          this.hurtEnemy(e, dmg, f.x, f.y);
          this.vfx.impact(e.x, e.y, this.elemColor(f.element));
          f.pounce = false;
        }
      }
      // non-active alive cats fight autonomously via their gambits
      if (f !== me) this.updateAllyAI(dt, f);
    }

    // ---- each enemy in the pack runs its own AI (they coordinate; see updateEnemyAI) ----
    for (const e of this.enemies) { if (e.flash > 0) e.flash -= dt; }
    for (const e of this.liveEnemies()) {
      const canAct = this.tickStatus(e, dt);          // DoT + CC; false = frozen this frame
      if (e.alive && canAct) this.updateEnemyAI(dt, e, me);
      else if (e.alive) { e.pose = 'idle'; }           // frozen: stand still, no attacks
    }

    // ---- projectiles ----
    for (const p of this.projectiles) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      p._tc = (p._tc || 0) + dt;
      if (p._tc > 0.02) { p._tc = 0; this.vfx.trail(p.x, p.y, p.color, p.r * 0.8); }
      if (p.owner === 'me') {
        for (const e of this.liveEnemies()) {
          if (e.flash <= 0 && e.inv <= 0 && Math.hypot(p.x - e.x, p.y - e.y) < p.r + 22) {
            const dmg = this.applyHitEffects(e, p.skill, p.dmg, p.x, p.y);
            this.hurtEnemy(e, dmg, p.x, p.y); this.vfx.impact(p.x, p.y, p.color); p.life = 0;
            break;
          }
        }
      } else {
        // enemy shot hits ANY alive team cat it overlaps
        for (const tf of this.team) {
          if (!tf.alive || tf.inv > 0) continue;
          if (Math.hypot(p.x - tf.x, p.y - tf.y) < p.r + tf.r * 0.7) { this.hurtMe(p.dmg, p.x, p.y, tf); this.vfx.impact(p.x, p.y, p.color); p.life = 0; break; }
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
    this.hint = this.autoMode ? (this._autoLastAction&&this.t-(this._autoLastAt||0)<2.5 ? '🤖 智能自动 · '+this._autoLastAction : '🤖 智能自动 · 自动放技能、闪避、必杀 · 点击集火')
      : (this.captureReady ? '野猫斗志快耗尽了，收服它！'
      : (this.ult >= 100 ? '必杀能量已满！按 R 释放'
      : (packN > 1 ? `野猫群 ${live.length}/${packN} 只 · 鼠标瞄准 · Q/E 技能` : '鼠标瞄准 · 左键猫爪 · Q/E 技能 · 空格闪避')));

    if (live.length === 0) this.finish(true);
  }

  nearestEnemy(x, y) {
    let best = null, bd = 1e9;
    for (const e of this.liveEnemies()) { const d = Math.hypot(e.x - x, e.y - y); if (d < bd) { bd = d; best = e; } }
    return best;
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
    const hpFrac = e.hp / e.maxhp;

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
      const want = 200 - e.aggro * 80;
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
    const spd = e.speed * (1 + e.aggro * 0.4) * (e.slowed ? 0.5 : 1);   // 感电减速
    e.x = clamp(e.x + ax * spd * dt, BATTLE_MARGIN.side, this.W - BATTLE_MARGIN.side);
    e.y = clamp(e.y + ay * spd * dt, this.topMargin, this.H - this.bottomMargin);
    if (e.pose !== 'play') e.pose = (ax || ay) ? 'walk' : 'idle';

    // telegraphed special (staggered: only one enemy charges a nova at a time)
    if (e.telegraph > 0) {
      e.telegraph -= dt;
      if (Math.random() < 0.5) this.vfx.burst(e.x, e.y, { count: 1, color: '#ff4d6d', speed: 40, life: 0.3 });
      if (e.telegraph <= 0) { this.unleashEnemySpecial(e, me); this._novaLock = Math.max(0, (this._novaLock || 0) - 1); }
      return;
    }
    e.special -= dt;
    if (e.special <= 0 && dist < 440) {
      e.special = Math.max(2.2, e.specialCd - e.aggro * 2) + Math.random();
      const wantNova = hpFrac < 0.5 && e.rIdx >= 1 && (this._novaLock || 0) === 0;
      e.telegraphKind = wantNova ? 'nova' : 'barrage';
      if (wantNova) this._novaLock = 1;                      // reserve nova slot; others barrage
      e.telegraph = Math.max(0.4, 0.75 - e.rIdx * 0.08);
      if (wantNova) this.game.toast('⚠️ 野猫在蓄力大招！');
      return;
    }

    // normal aimed fire (leads the player)
    e.fireCd -= dt;
    if (e.fireCd <= 0) {
      e.fireCd = e.fireRate * (1 - e.aggro * 0.35) * (e.slowed ? 1.8 : 1);   // 感电降攻速
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

  // aim that leads a moving target (from source s to target me)
  leadAngle(s, me, projSpeed) {
    const dx = me.x - s.x, dy = me.y - s.y;
    const t = Math.hypot(dx, dy) / projSpeed;
    return Math.atan2(dy + (me.vy || 0) * t, dx + (me.vx || 0) * t);
  }

  unleashEnemySpecial(e, me) {
    const sk = e.skill;
    const col = sk ? this.elemColor(sk.element) : '#ff4d6d';
    const pow = sk ? sk.power : 0.9;
    const skillName = sk ? sk.name : (e.telegraphKind === 'nova' ? '猫猫怒涛' : '连射');
    this.game.toast('💢 ' + e.sp.name + ' 施放 ' + skillName + '！');
    if (e.telegraphKind === 'nova') {
      const n = 12 + e.rIdx * 4;
      const off = Math.random() * Math.PI;
      for (let i = 0; i < n; i++) this.spawnProj(e.x, e.y, off + (i / n) * Math.PI * 2, 200, e.dmg * pow, 'wild', col, 7, 'ball');
      this.vfx.shockwave(e.x, e.y, col);
      this.vfx.ring(e.x, e.y, { r0: 10, vr: 520, life: 0.45, color: col, width: 6 });
      e.inv = 0.25;
    } else {
      // rapid aimed barrage tinted to its element
      const base = this.leadAngle(e, me, 300);
      for (let i = 0; i < 5; i++) this.spawnProj(e.x, e.y, base + (i - 2) * 0.12, 300, e.dmg * 0.85, 'wild', col, 6, 'ball');
      this.vfx.muzzle(e.x, e.y, base, col);
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
      this.vfx.text(e.x, e.y - 50, combo.name || '连携!', '#ffd36b', 18);
      this.game.toast('✨ 连携 ' + (combo.name || '') + '！');
      if (combo.consumes && e.tags.includes(combo.tag)) { e.tags = e.tags.filter(t => t !== combo.tag); delete e.status[combo.tag]; }
    }
    // element effectiveness
    const mult = this.elemMult(skill.element, e.sp.id);
    if (mult > 1) { dmg *= mult; this.vfx.text(x, y - 14, '效果拔群!', '#ff7b9c', 13); }
    else if (mult < 1) { dmg *= mult; this.vfx.text(x, y - 14, '效果一般', '#9aa8ba', 11); }
    // apply status tag(s) with their TTL → real ongoing effects (see tickStatus)
    if (skill.appliesTag) {
      const tags = Array.isArray(skill.appliesTag) ? skill.appliesTag : [skill.appliesTag];
      for (const tg of tags) {
        if (!e.tags.includes(tg)) e.tags.push(tg);
        const info = TAG[tg];
        e.status[tg] = info ? info.ttl : 3;
        const nm = info ? info.name : tg;
        this.vfx.text(e.x + (Math.random() * 20 - 10), e.y - 30, nm, info ? info.color : '#fff', 12);
      }
    }
    return dmg;
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
    if (!isDot) { dmg *= this.comboMult(); this.addCombo(1); }
    // vulnerability debuffs amplify incoming damage (破绽/破甲)
    const TAG = (window.Skills && Skills.TAG_INFO) || {};
    if (e.status) for (const tg in e.status) { const info = TAG[tg]; if (info && info.dmgTaken) dmg *= info.dmgTaken; }
    const scaled = dmg;
    e.hp = Math.max(0, e.hp - scaled);
    e.flash = 0.08;
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
    dmg*=f.shieldT>0?.55:1;
    f.hp = Math.max(0, f.hp - dmg);
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
    if (this.shakeT > 0) { sx = (Math.random() - 0.5) * 9; sy = (Math.random() - 0.5) * 9; }
    ctx.save(); ctx.translate(sx, sy);

    this.drawArenaBackground(ctx, W, H);

    if (this.flash > 0) { ctx.fillStyle = `rgba(157,123,255,${this.flash})`; ctx.fillRect(0, 0, W, H); }

    // aim reticle
    const m = this.game.mouse;
    if (m) { ctx.strokeStyle = 'rgba(255,211,107,0.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(m.x, m.y, 9, 0, Math.PI * 2); ctx.moveTo(m.x - 13, m.y); ctx.lineTo(m.x + 13, m.y); ctx.moveTo(m.x, m.y - 13); ctx.lineTo(m.x, m.y + 13); ctx.stroke(); }

    // vfx under-layer (trails, rings, muzzle)
    this.vfx.draw(ctx);

    // projectiles with glow
    for (const p of this.projectiles) {
      ctx.save(); ctx.translate(p.x, p.y);
      // outer glow
      ctx.globalAlpha = 0.35; ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(0, 0, p.r * 2.1, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1; ctx.fillStyle = p.color;
      if (p.kind === 'star') { ctx.rotate(this.t * 8); star(ctx, 0, 0, p.r, p.r * 0.5, 5); }
      else { ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.fill(); }
      // white-hot core
      ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(0, 0, p.r * 0.45, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // wild pack — draw every live enemy (back-to-front by y)
    const sorted = this.liveEnemies().slice().sort((a, b) => a.y - b.y);
    for (const e of sorted) {
      // telegraph warning ring while charging a special
      if (e.telegraph > 0) {
        const k = 1 - e.telegraph / Math.max(0.4, 0.75 - e.rIdx * 0.08);
        ctx.save();
        ctx.globalAlpha = 0.4 + 0.4 * Math.abs(Math.sin(this.t * 18));
        ctx.strokeStyle = e.telegraphKind === 'nova' ? '#ff4d6d' : '#ff7b9c';
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(e.x, e.y, 30 + k * 26, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }
      ctx.save();
      if (e.flash > 0) ctx.globalAlpha = 0.6;
      // status color wash (frozen=blue tint, burn=orange, etc.) via a soft overlay ring
      if (e.status) { const k = Object.keys(e.status); if (k.length) { const info = (Skills.TAG_INFO || {})[k[0]]; if (info) { ctx.save(); ctx.globalAlpha = 0.25 + 0.15 * Math.sin(this.t * 6); ctx.fillStyle = info.color; ctx.beginPath(); ctx.ellipse(e.x, e.y + 6, 24, 30, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); } } }
      CatArt.drawCat(ctx, e.x, e.y, { species: e.sp, scale: 1.1, face: e.face, t: e.t, pose: e.frozen ? 'idle' : e.pose, mood: e.frozen ? 'sleepy' : ((e.hp / e.maxhp < 0.28) ? 'sleepy' : 'alert') });
      ctx.restore();
      const elemSym = this.elemSymbol(e.element);
      this.hpTag(ctx, e.x, e.y - 42, e.hp / e.maxhp, GameData.RARITY[e.sp.rarity].color, `${elemSym} ${e.sp.name} Lv.${e.level}`);
      // status icons row under the HP tag
      if (e.status) {
        const keys = Object.keys(e.status); const TAG = Skills.TAG_INFO || {};
        const icons = { burn: '🔥', soak: '💧', shock: '⚡', oil: '🛢️', chill: '❄️', dizzy: '💫', bleed: '🩸', blind: '🌀', bind: '🌿' };
        ctx.save(); ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
        keys.slice(0, 5).forEach((tg, i) => { ctx.fillText(icons[tg] || '●', e.x - (keys.length - 1) * 7 + i * 14, e.y - 50); });
        ctx.restore();
      }
    }

    // ALL alive team cats on the field (active highlighted, allies slightly dimmer)
    const teamSorted = this.team.filter(t => t.alive).slice().sort((a, b) => a.y - b.y);
    for (const tf of teamSorted) {
      const isMe = tf === this.me();
      const sp2 = GameData.speciesById(tf.cat.species);
      const fAim = isMe ? this.aim : (tf._aim || 0);
      ctx.save();
      if (!isMe) ctx.globalAlpha = 0.9;
      if (tf.inv > 0 && Math.floor(this.t * 20) % 2 === 0) ctx.globalAlpha = 0.5;
      if (tf.hitFlash > 0) ctx.globalAlpha = 0.5;
      // active cat gets a soft golden ground ring so you know who you control
      if (isMe) { ctx.fillStyle = 'rgba(255,211,107,0.22)'; ctx.beginPath(); ctx.ellipse(tf.x, tf.y + 30, 26, 9, 0, 0, Math.PI * 2); ctx.fill(); }
      CatArt.drawCat(ctx, tf.x, tf.y, { species: sp2, scale: 1.1, face: (Math.cos(fAim) < 0 ? -1 : 1), t: tf.t != null ? tf.t : this.t, pose: tf.pounce ? 'play' : (tf.moving ? 'walk' : 'idle'), mood: 'happy' });
      ctx.restore();
      const sym = this.elemSymbol(tf.element);
      this.hpTag(ctx, tf.x, tf.y - 42, tf.hp / tf.maxhp, isMe ? '#ffd36b' : '#9be7c4', `${sym} ${State.catName(tf.cat)}${isMe ? ' ◀' : ''}`);
    }

    // particles & floaters
    for (const q of this.particles) { ctx.save(); ctx.globalAlpha = Math.max(0, q.life); ctx.fillStyle = q.color; ctx.font = `${q.size}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText(q.ch, q.x, q.y); ctx.restore(); }
    for (const fl of this.floaters) { ctx.save(); ctx.globalAlpha = Math.max(0, fl.life); ctx.fillStyle = fl.color; ctx.font = 'bold ' + (fl.size || 15) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.strokeText(fl.text, fl.x, fl.y); ctx.fillText(fl.text, fl.x, fl.y); ctx.restore(); }

    // ---- COMBO counter (top-center, grows & heats up with the chain) ----
    if (this.combo >= 2) {
      ctx.save();
      const cx = W / 2, cy = 128;
      const heat = Math.min(1, this.combo / 40);
      const pop = 1 + (this.comboFlash > 0 ? this.comboFlash * 0.6 : 0);
      const col = heat > 0.6 ? '#ff6b3c' : heat > 0.3 ? '#ffd36b' : '#fff1a8';
      ctx.textAlign = 'center';
      ctx.globalAlpha = 0.5 + 0.5 * Math.min(1, this.comboT / 1.3);  // dim as it's about to drop
      ctx.font = `900 ${Math.round((34 + heat * 20) * pop)}px system-ui, sans-serif`;
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(20,10,30,0.6)';
      ctx.strokeText(this.combo + '', cx, cy); ctx.fillStyle = col; ctx.fillText(this.combo + '', cx, cy);
      ctx.font = '700 14px system-ui, sans-serif'; ctx.fillStyle = col;
      ctx.fillText('连击 ×' + this.comboMult().toFixed(2), cx, cy + 20);
      // drop timer bar
      ctx.globalAlpha = 0.8; ctx.fillStyle = col;
      const bw = 70 * Math.max(0, this.comboT / 1.3);
      ctx.fillRect(cx - bw / 2, cy + 28, bw, 3);
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
      ctx.fillText('← 左侧拖动移动  ·  右侧按住攻击 →', W / 2, H - 76);
      ctx.restore();
    }

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
