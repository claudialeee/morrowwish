// game.js — main controller: loop, scene management, input, UI panels, economy hooks.

// Unified Morrow Wish analytics shim. window.arcadeMetric is installed by
// /telemetry.js (and wrapped by /studio-audio.js); this is a no-op if either is
// absent, so the game still runs standalone. See public/telemetry.js for the
// canonical event names (game_start / game_complete / game_over / game_retry).
function metric(name, payload) {
  try { if (typeof window.arcadeMetric === 'function') window.arcadeMetric(name, payload || {}); } catch (e) {}
}

class Game {
  constructor() {
    this.canvas = document.getElementById('scene');
    this.ctx = this.canvas.getContext('2d');
    this.W = 0; this.H = 0;
    this.t = 0;
    this.scene = 'yard';     // yard | battle
    this.yard = null;
    this.battle = null;
    this.selectedPartner = null;   // uid for battle
    this._lastTs = 0;
    this._toastTimer = null;
    this.mouse = { x: 0, y: 0, active: false, idle: 0, down: false };
    this.keys = {};
    this.isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    // virtual joystick (battle movement on touch): {active, ox,oy, dx,dy}
    this.joystick = { active: false, ox: 0, oy: 0, dx: 0, dy: 0, id: null };
    this._worldTouch = null; // map: tap to walk / drag to pan
    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 100));
  }

  resize() {
    const oldW=this.W,oldH=this.H;
    const rect = this.canvas.getBoundingClientRect();
    // Retina phones need three physical pixels per CSS pixel to show
    // the 220×330 kitten illustrations sharply. Cap total canvas pixels
    // to avoid stuttering on older devices and large desktop windows.
    const pixels=Math.max(1,rect.width*rect.height);
    const dpr=Math.min(window.devicePixelRatio||1,3,Math.sqrt(4400000/pixels));
    this.W=rect.width;this.H=rect.height;
    this.canvas.width=Math.max(1,Math.round(this.W*dpr));
    this.canvas.height=Math.max(1,Math.round(this.H*dpr));
    this.ctx.setTransform(this.canvas.width/Math.max(1,this.W),0,0,this.canvas.height/Math.max(1,this.H),0,0);
    this.ctx.imageSmoothingEnabled=true;
    this.ctx.imageSmoothingQuality='high';
    if(oldW>0&&oldH>0&&(Math.abs(oldW-this.W)>2||Math.abs(oldH-this.H)>2)){
      this.yard?.onResize?.(oldW,oldH,this.W,this.H);
      this.battle?.onResize?.(this.W,this.H);
      this.joystick={active:false,ox:0,oy:0,dx:0,dy:0,id:null};
      this._worldTapCandidate=null;
      this._worldTouch=null;
    }
  }

  start() {
    State.load();
    // ensure first-time player gets a starter choice handled by main.js
    this.yard = new World.YardScene(this);
    const switchCats=document.getElementById('yard-cat-switch');
    if(switchCats)switchCats.addEventListener('click',()=>{
      if(this.scene!=='yard')return;
      if(this.yard.pageCount>1)this.yard.nextPage();
      else UI.openRoster();
    });
    this.bindInput();
    this.refreshHUD();
    this.initWorldMap();
    requestAnimationFrame(ts => this.loop(ts));
  }

  // wire the semi-open-world module (worldmap.js) to the capture battle + economy
  initWorldMap() {
    if (!window.WorldMap) return;
    WorldMap.init(this);
    WorldMap.onEncounter((species, regionId) => {
      const team = State.S.cats.slice(0, 3);
      if (!team.length) { this.toast('没有可出战的猫'); return; }
      this._returnScene = 'map';           // after battle, go back to the region
      const region = WorldMap.REGIONS.find(r => r.id === regionId);
      this._battleTheme = region ? region.theme : null;
      this.startBattle(team, species);
    });
    WorldMap.onCollect((reward) => {
      if (reward.coins) State.S.coins += reward.coins;
      if (reward.treats) State.S.treats += reward.treats;
      if (reward.fish) State.S.fish += reward.fish;
      State.save(); this.refreshHUD();
      this.toast('📦 ' + (reward.label || '拾获补给'));
    });
    WorldMap.onExit(() => { this.scene = 'yard'; this.showYardChrome(); });
  }

  openWorldMap() {
    this.scene = 'map';
    document.body.classList.add('cb-exploring');
    document.getElementById('tabbar').classList.add('hidden');
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('yard-actions').classList.add('hidden');
    this.yard?.refreshYardSwitch();
    WorldMap.enterMap();
  }
  showYardChrome() {
    document.body.classList.remove('cb-exploring');
    document.getElementById('yard-actions').classList.remove('hidden');
    document.getElementById('tabbar').classList.remove('hidden');
    document.getElementById('hud').classList.remove('hidden');
    this.yard?.refreshYardSwitch();
  }

  rebuildYard() {
    this.yard.page=0; // Newly caught breeds become visible immediately.
    this.yard.rebuild();
  }
  gradeTimeLimit(rarity){
    // Rarer cats have substantially higher defense and often arrive in packs.
    // A fixed 40s S requirement was unfair to players who found a legend.
    return ({N:40,R:55,SR:75,SSR:100})[rarity]||40;
  }
  gradeBattle(b){
    // Reward three understandable goals: finish quickly, protect the cats,
    // and land a combo or perfect dodge. Auto-battle remains eligible.
    const fighters=b.team||[];
    const maxHP=fighters.reduce((n,f)=>n+(f.maxhp||0),0);
    const remaining=fighters.reduce((n,f)=>n+Math.max(0,f.hp||0),0);
    const healthy=maxHP>0&&remaining/maxHP>=.7;
    const timeLimit=this.gradeTimeLimit(b.wild?.rarity);
    const swift=(b.t||0)<=timeLimit;
    const clever=(b.comboBest||0)>=6||(b.perfectDodges||0)>=1;
    const points=Number(healthy)+Number(swift)+Number(clever);
    const grade=points===3?'S':points===2?'A':points===1?'B':'C';
    const bonuses={S:[42,2],A:[24,1],B:[14,0],C:[8,0]};
    const [bonusCoins,bonusTreats]=bonuses[grade];
    return {grade,bonusCoins,bonusTreats,seconds:Math.round(b.t||0),
      combo:b.comboBest||0,perfectDodges:b.perfectDodges||0,
      healthy,swift,clever,timeLimit};
  }
  masteryStatus(){
    const badges=State.S.masteryBadges||{};
    const medals=Object.values(badges).filter(Boolean).length;
    // Each three distinct S-ranked breeds raises the *rarity weight*, not
    // a guaranteed rare roll. Cap it to keep SSR genuinely collectible.
    const luckBonus=Math.min(.48,Math.floor(medals/3)*.12);
    return {medals,total:GameData.SPECIES.length,next:medals>=GameData.SPECIES.length
      ?null:Math.min(GameData.SPECIES.length,(Math.floor(medals/3)+1)*3),luckBonus};
  }
  recordBattleMastery(wild,performance,newCat){
    const S=State.S;
    if(!S.bestGrades||typeof S.bestGrades!=='object')S.bestGrades={};
    if(!S.masteryBadges||typeof S.masteryBadges!=='object')S.masteryBadges={};
    const order={C:0,B:1,A:2,S:3};
    const previous=S.bestGrades[wild.id];
    performance.newRecord=order[performance.grade]>=(previous==null?0:order[previous]+.5);
    if(performance.newRecord)S.bestGrades[wild.id]=performance.grade;
    if(performance.grade!=='S'||S.masteryBadges[wild.id])return null;
    // Once per *breed*, not once per battle or per duplicate cat.
    S.masteryBadges[wild.id]=true;
    S.luckLure=(S.luckLure||0)+1; // one enhanced encounter right away
    newCat.affinity=Math.min(100,(newCat.affinity||0)+15);
    const status=this.masteryStatus();
    metric('bond_mastery_unlocked',{breed:wild.id,medals:status.medals,luckBonus:status.luckBonus});
    return {breed:wild.id,status,lure:1,affinity:15};
  }
  collectionStatus(){
    const count=Object.values(State.S.dex||{}).filter(v=>Number(v)>0).length;
    const total=GameData.SPECIES.length;
    const thresholds=[3,5,10,15,20,total];
    return {count,total,next:thresholds.find(n=>count<n)??null};
  }
  grantCollectionMilestones(){
    const milestones=[
      {count:3,coins:60,treats:2},
      {count:5,coins:100,treats:3},
      {count:10,coins:180,treats:5},
      {count:15,coins:260,treats:6},
      {count:20,coins:350,treats:8},
      {count:GameData.SPECIES.length,coins:500,treats:12},
    ];
    const S=State.S;
    if(!Array.isArray(S.collectionMilestones))S.collectionMilestones=[];
    const collected=this.collectionStatus().count;
    const granted=[];
    for(const m of milestones){
      if(collected>=m.count&&!S.collectionMilestones.includes(m.count)){
        S.collectionMilestones.push(m.count);
        S.coins+=m.coins;S.treats+=m.treats;
        granted.push(m);
        metric('bond_collection_milestone',{species:collected,target:m.count});
      }
    }
    return granted;
  }
  refreshCollectionGoal(){
    const hint=document.getElementById('collection-goal');
    if(!hint)return;
    const status=this.collectionStatus();
    const panelOpen=document.getElementById('panel')?.classList.contains('open');
    hint.hidden=this.scene!=='yard'||status.count<2||!!panelOpen;
    if(hint.hidden)return;
    const english=window.MorrowwishI18n?.get?.()!=='zh';
    const label=status.next===null
      ?(english?'🏆 Cat Adventure · All 25 breeds! ›':'🏆 猫猫冒险 · 25 种全部收集 ›')
      :(english?'🧭 Cat Adventure · '+status.count+'/'+status.next+' breeds · Goals ›'
        :'🧭 猫猫冒险 · 图鉴 '+status.count+'/'+status.next+' · 查看目标 ›');
    if(hint.textContent!==label)hint.textContent=label;
  }

  adventureStatus(){
    const regions=window.WorldMap?.REGIONS||[];
    const unlocked=regions.filter(r=>WorldMap.isUnlocked(r.id)).length;
    const homeExplored=Math.round((State.S.worldmap?.regions?.home?.explored||0)*100);
    return {pets:State.S.petCount||0,unlocked,totalRegions:regions.length,homeExplored};
  }
  grantBondingRewards(){
    const S=State.S;
    if(!Array.isArray(S.bondingRewards))S.bondingRewards=[];
    const goals=[{n:3,coins:35,treats:2},{n:10,coins:100,treats:3},{n:25,coins:250,treats:5}];
    const rewards=[];
    for(const g of goals){
      if((S.petCount||0)>=g.n&&!S.bondingRewards.includes(g.n)){
        S.bondingRewards.push(g.n);
        S.coins+=g.coins;S.treats+=g.treats;
        metric('bond_bonding_milestone',{pets:S.petCount,target:g.n});
        rewards.push(g);
      }
    }
    return rewards;
  }

  refreshFirstQuest(){
    const hint=document.getElementById('first-quest');
    if(!hint)return;
    const first=State.S.cats.length>0&&(State.S.catchCount||0)===0;
    const panelOpen=document.getElementById('panel')?.classList.contains('open');
    hint.hidden=!first||this.scene!=='yard'||!!panelOpen;
    if(hint.hidden)return;
    const english=window.MorrowwishI18n?.get?.()!=='zh';
    const label=this.yard?.hide
      ? (english?'🌿 First capture: tap the glowing bush!':'🌿 第一次收集：点击发光的草丛，找到新伙伴')
      : (english?'🌿 First capture: tap the grass button to find a wild cat':'🌿 第一次收集：点击右下角的草丛按钮寻找野猫');
    if(hint.textContent!==label)hint.textContent=label;
  }

  loop(ts) {
    // Schedule the NEXT frame first, so a thrown error in update/draw can never
    // permanently freeze the game (the cats-don't-move failure mode).
    requestAnimationFrame(t => this.loop(t));
    const dt = Math.min(0.05, (ts - this._lastTs) / 1000 || 0);
    this._lastTs = ts; this.t += dt;
    // decay cursor "activity" so cats lose interest when the mouse stops
    if (this.mouse.active) { this.mouse.idle += dt; if (this.mouse.idle > 1.2) this.mouse.active = false; }
    // idle/placement economy tick (online == offline). butterfly flag → yard event
    if (window.Raising) { try { const rush = (State.S.rushUntil && Date.now() < State.S.rushUntil) ? 2 : 1; const d = Raising.tick(dt * rush); if (d && d.butterfly) this._butterflyOut = true; } catch (e) {} }
    try { this.update(dt); } catch (e) { console.error('update error', e); }
    try { this.draw(); } catch (e) { console.error('draw error', e); }
  }

  update(dt) {
    if(this.scene==='yard'){
      this.yard.update(dt);
      if(this.t>=(this._nextQuestTick||0)){
        this._nextQuestTick=this.t+0.3;
        this.refreshFirstQuest();
        this.refreshCollectionGoal();
      }
    }
    else if (this.scene === 'map' && window.WorldMap) WorldMap.update(dt);
    else if (this.scene === 'battle' && this.battle) {
      this.battle.update(dt);
      this.updateBattleUI();
      if (this.battle.done) this.endBattle();
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.W, this.H);
    if (this.scene === 'yard') this.yard.draw(ctx);
    else if (this.scene === 'map' && window.WorldMap) WorldMap.draw(ctx);
    else if (this.scene === 'battle' && this.battle) this.battle.draw(ctx);
  }

  // ---------- input ----------
  bindInput() {
    const c = this.canvas;
    const pos = e => {
      const r = c.getBoundingClientRect();
      const p = e.touches ? e.touches[0] : e;
      return { x: p.clientX - r.left, y: p.clientY - r.top };
    };
    const down = e => {
      const { x, y } = pos(e);
      this.mouse.x = x; this.mouse.y = y;
      if (this.scene === 'yard') this.yardTap(x, y);
      else if (this.scene === 'map' && window.WorldMap) {
        const wasRegion=WorldMap.mode==='region';
        const handled=WorldMap.handleTap(x,y);
        if(wasRegion&&!handled)WorldMap.setDestination(x,y);
      }
      else if (this.scene === 'battle') { this.mouse.down = true; e.preventDefault(); }
    };
    const move = e => {
      const { x, y } = pos(e);
      // always track the cursor (yard reactions + battle aim)
      this.mouse.x = x; this.mouse.y = y; this.mouse.active = true; this.mouse.idle = 0;
      if (this.scene === 'yard') this.maybeRevealWild(x, y);
      if (this.scene === 'battle') e.preventDefault();
    };
    const up = () => { this.mouse.down = false; };
    c.addEventListener('mousedown', down);
    c.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);

    // ---- touch: multi-touch aware. In battle, LEFT half = virtual joystick (move),
    //      RIGHT half = hold-to-fire (auto-aims nearest enemy). Elsewhere = tap. ----
    const touchPos = t => { const r = c.getBoundingClientRect(); return { x: t.clientX - r.left, y: t.clientY - r.top }; };
    c.addEventListener('touchstart', e => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        const p = touchPos(t);
        if (this.scene === 'battle') {
          if (p.x < this.W * 0.5 && !this.joystick.active) {
            this.joystick = { active: true, ox: p.x, oy: p.y, dx: 0, dy: 0, id: t.identifier };
          } else {
            this.mouse.x = p.x; this.mouse.y = p.y; this.mouse.active = true;
            this.mouse.down = true; this._fireTouchId = t.identifier;
          }
        } else {
          this.mouse.x = p.x; this.mouse.y = p.y; this.mouse.active = true;
          if (this.scene === 'yard') this.yardTap(p.x, p.y);
          else if (this.scene === 'map' && window.WorldMap) {
            if(WorldMap.mode==='region'){
              // Handle taps on release so dragging near the portal does not exit.
              if(!this._worldTouch)
                this._worldTouch={id:t.identifier,x:p.x,y:p.y,lastX:p.x,lastY:p.y,moved:false};
            }else WorldMap.handleTap(p.x,p.y);
          }
        }
      }
    }, { passive: false });
    c.addEventListener('touchmove', e => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        const p = touchPos(t);
        if(this.scene==='map'&&this._worldTouch?.id===t.identifier){
          const touch=this._worldTouch;
          if(Math.hypot(p.x-touch.x,p.y-touch.y)>10)touch.moved=true;
          if(touch.moved&&window.WorldMap?.mode==='region')
            WorldMap.panBy(p.x-touch.lastX,p.y-touch.lastY);
          touch.lastX=p.x;touch.lastY=p.y;
          this.mouse.x=p.x;this.mouse.y=p.y;this.mouse.active=true;
        }else if (this.joystick.active && t.identifier === this.joystick.id) {
          let dx = p.x - this.joystick.ox, dy = p.y - this.joystick.oy;
          const len = Math.hypot(dx, dy), max = 46;
          if (len > max) { dx = dx / len * max; dy = dy / len * max; }
          this.joystick.dx = dx / max; this.joystick.dy = dy / max;   // -1..1
          if(this._worldTapCandidate?.id===t.identifier&&len>12)this._worldTapCandidate.moved=true;
        } else if (t.identifier === this._fireTouchId) {
          this.mouse.x = p.x; this.mouse.y = p.y; this.mouse.active = true;
        } else if (this.scene !== 'battle') {
          this.mouse.x = p.x; this.mouse.y = p.y; this.mouse.active = true;
          if (this.scene === 'yard') this.maybeRevealWild(p.x, p.y);
        }
      }
    }, { passive: false });
    const endTouch = e => {
      for (const t of e.changedTouches) {
        if(this._worldTouch?.id===t.identifier){
          if(e.type==='touchend'&&this.scene==='map'&&window.WorldMap?.mode==='region'&&!this._worldTouch.moved){
            const p=touchPos(t);
            if(!WorldMap.handleTap(p.x,p.y)&&WorldMap.mode==='region')
              WorldMap.setDestination(p.x,p.y);
          }
          this._worldTouch=null;
        }
        if(t.identifier===this.joystick.id){
          if(e.type==='touchend'&&this.joystick.context==='region'&&!this._worldTapCandidate?.moved&&this.scene==='map'&&window.WorldMap?.mode==='region'){
            const p=touchPos(t);WorldMap.setDestination(p.x,p.y);
          }
          this.joystick={active:false,ox:0,oy:0,dx:0,dy:0,id:null};this._worldTapCandidate=null;
        }
        if (t.identifier === this._fireTouchId) { this.mouse.down = false; this._fireTouchId = null; }
      }
    };
    c.addEventListener('touchend', endTouch);
    c.addEventListener('touchcancel', endTouch);

    // real-time key polling for the action battle (held keys stay down)
    const keyName = e => (e.key.length === 1 ? e.key.toLowerCase() : e.key.toLowerCase());
    window.addEventListener('keydown', e => {
      this.keys[keyName(e)] = true;
      if (this.scene === 'battle' && ['w', 'a', 's', 'd', ' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(keyName(e))) e.preventDefault();
    });
    window.addEventListener('keyup', e => { this.keys[keyName(e)] = false; });
    // prevent right-click menu over the arena
    c.addEventListener('contextmenu', e => { if (this.scene === 'battle') e.preventDefault(); });
  }

  // As the player sweeps the cursor over the yard, a wild cat gets curious and peeks
  // from the nearest bush. Keep moving near it and it reveals; tap it to start capture.
  maybeRevealWild(x, y) {
    if (this.scene !== 'yard' || !this.yard) return;
    const panelOpen = document.getElementById('panel').classList.contains('open');
    if (panelOpen) return;
    // if a wild cat is already hiding, nudge it to peek when cursor is close
    if (this.yard.hide && !this.yard.hide.found) {
      const h = this.yard.hide;
      if (Math.hypot(x - h.spot.x, y - h.spot.y) < 120) { h.peeking = true; h.peekT = 0.6; }
      return;
    }
    // throttle spawns; small chance per move once off cooldown
    this._wildCd = (this._wildCd || 0);
    const now = this.t;
    if (now < this._wildCd) return;
    if (Math.random() < 0.05) {
      this._wildCd = now + 6;              // at most ~1 spawn / 6s from cursor
      this.yard.startHideAndSeekNear(x, y);
    }
  }

  yardTap(x, y) {
    const hit = this.yard.handleTap(x, y);
    if (!hit) return;
    if (hit.type === 'loot') {
      const r = this.yard.collectLoot(hit.bubble, hit.idx);
      if (r.amount > 0) {
        // combo: quick successive collects stack a multiplier readout
        const now = this.t;
        if (now - (this._lootComboT || -9) < 2) this._lootCombo = (this._lootCombo || 1) + 1; else this._lootCombo = 1;
        this._lootComboT = now;
        this.yard.spawnFloat(hit.bubble.x, hit.bubble.y, `${r.icon || ''}+${r.amount}`, '#ffe08a');
        if (this._lootCombo >= 3) this.yard.spawnFloat(hit.bubble.x, hit.bubble.y - 22, `连击 ×${this._lootCombo}!`, '#ff9db0');
        State.save(); this.refreshHUD();
      }
      return;
    }
    if (hit.type === 'golden') {
      this.yard.collectGolden();
      State.S.rushUntil = Date.now() + 15 * 60 * 1000;   // 15-min 2x production
      State.save();
      this.toast('🌟 金运喵眷顾！双倍产出 15 分钟');
      return;
    }
    if (hit.type === 'hide') {
      // found the hiding wild cat → open capture prep
      const sp = this.yard.hide.species;
      this.yard.hide.found = true;
      window.MorrowwishAudio?.effect?.('discover');
      this.spawnFoundFx(this.yard.hide.spot);
      this.yard.hide = null;
      window.arcadeMetric?.('bond_first_wild_found',{rarity:sp.rarity});
      UI.openCapturePrep(sp);
    } else if (hit.type === 'cat') {
      this.petCat(hit.entity);
    }
  }

  spawnFoundFx(spot) {
    for (let i = 0; i < 10; i++) {
      this.yard.petParticles.push({
        x: spot.x, y: spot.y - 10, vx: Math.random() * 120 - 60, vy: -60 - Math.random() * 60,
        life: 1, ch: '✨', color: '#ffd36b', size: 14 + Math.random() * 8,
      });
    }
    this.toast('✨ 找到了一只野生猫猫！');
  }

  petCat(entity) {
    window.MorrowwishAudio?.effect?.('pet');
    this.yard.petEntity(entity);
    const cat = entity.cat;
    cat.affinity = Math.min(100, cat.affinity + 2);
    cat.joy = Math.min(100, cat.joy + 5);
    const lv = State.addXp(cat, 3);
    State.S.petCount=(State.S.petCount||0)+1;
    const rewards=this.grantBondingRewards();
    if(lv)this.toast(`${GameData.speciesById(cat.species).name} 升到 Lv.${cat.level}！`);
    if(rewards.length){
      const coins=rewards.reduce((n,r)=>n+r.coins,0);
      this.toast((window.MorrowwishI18n?.get?.()==='zh'
        ?'💞 亲密互动奖励：+':'💞 Bonding reward: +')+coins+' 🪙');
      this.refreshHUD();
    }
    State.save();
    // if a detail panel is open for this cat, refresh it
    if (UI.openCatUid === cat.uid) UI.renderCatDetail(cat);
  }

  // ---------- battle flow ----------
  startMasteryChallenge(species){
    // A targeted S-rank rematch is a training challenge, NOT another capture.
    // Replaying cannot duplicate cats, grow the dex or farm capture currency.
    const owned=State.S.cats.filter(cat=>cat.species===species.id);
    if(!owned.length){
      this.toast('先收服这个品种，才能挑战金爪评级。');return false;
    }
    const team=State.S.cats.slice().sort((a,b)=>State.catPower(b)-State.catPower(a)).slice(0,3);
    this.startBattle(team,species);
    this.battle.masteryChallenge=true;
    metric('bond_mastery_rematch_start',{breed:species.id,rarity:species.rarity});
    return true;
  }

  // team = array of up to 3 cat instances (or a single cat for back-compat)
  startBattle(team, wildSpecies) {
    this.keys = {}; this.mouse.down = false;
    this.joystick={active:false,ox:0,oy:0,dx:0,dy:0,id:null};this._worldTapCandidate=null;
    this.battle = new Battle.CaptureBattle(this, team, wildSpecies);
    this.battle.theme = this._battleTheme || null;   // region palette for the arena bg
    this._battleTheme = null;
    this.scene = 'battle';
    this.yard?.refreshYardSwitch();
    window.MorrowwishAudio?.effect?.('discover');
    document.body.classList.remove('cb-exploring');
    // Unified Morrow Wish analytics: a capture battle is a game "run". If the
    // previous run ended in a loss, count this fresh attempt as a retry too.
    if (this._lastBattleLost) { metric('game_retry', { rarity: wildSpecies.rarity }); this._lastBattleLost = false; }
    metric('game_start', { level: (State.S.catchCount || 0) + 1, rarity: wildSpecies.rarity });
    document.getElementById('battle-ui').classList.add('on');
    document.getElementById('yard-actions').classList.add('hidden');
    document.getElementById('tabbar').classList.add('hidden');
    document.getElementById('hud').classList.add('hidden');
    // clear any lingering yard toasts
    document.getElementById('toasts').innerHTML = '';
    document.getElementById('wild-name').textContent = `野生 ${wildSpecies.name} · ${GameData.RARITY[wildSpecies.rarity].name}`;
    this.buildTeamSlots();
    this.updateSkillLabels();
    this.updateBattleUI();
    // Display current battle state, including keyboard P toggles.
    this.syncBattleModeUI();
    this.syncBattleControlHelp();
  }

  updateSkillLabels() {
    const b = this.battle; if (!b) return;
    const f = b.me();
    const qBtn = document.getElementById('mv-q');
    const eBtn = document.getElementById('mv-e');
    if (qBtn) {
      const sk = f.qSkill;
      qBtn.querySelector('.mv-icon').textContent = sk ? this.skillIcon(sk) : '🧶';
      qBtn.querySelector('.mv-k').textContent = sk ? sk.name : 'Q';
    }
    if (eBtn) {
      const sk = f.eSkill;
      eBtn.querySelector('.mv-icon').textContent = sk ? this.skillIcon(sk) : '💨';
      eBtn.querySelector('.mv-k').textContent = sk ? sk.name : 'E';
    }
  }

  elemIcon(el) {
    return ({ fire: '🔥', water: '💧', grass: '🌿', elec: '⚡', dark: '🌑', light: '✨' })[el] || '🐾';
  }
  // distinct icon per skill id (so two fire skills don't both show 🔥)
  skillIcon(sk) {
    const byId = {
      emberClaw: '🐾', fireballMeow: '🔥', sunflare: '☀️',
      waterLash: '🌊', bubbleVeil: '🫧', tsunamiPaw: '💧',
      leafDart: '🍃', thornCoil: '🌿', photosynth: '🌱',
      staticPounce: '⚡', boltArc: '🔌', thunderYowl: '🌩️',
      shadowSwipe: '🌑', hex: '🔮', voidMaw: '🕳️',
      prismBeam: '🌈', blessFur: '✨', dawnHeal: '💖', moonlitHalo: '🌙',
    };
    return byId[sk.id] || this.elemIcon(sk.element);
  }

  buildTeamSlots() {
    const b = this.battle;
    const host = document.getElementById('team-slots');
    if (!host) return;
    host.innerHTML = '';
    b.team.forEach((f, i) => {
      const sp = GameData.speciesById(f.cat.species);
      const el = document.createElement('div');
      el.className = 'team-slot';
      el.innerHTML = `<canvas width="46" height="40"></canvas><span class="slot-key">${i + 1}</span><div class="slot-hp"><span></span></div>`;
      host.appendChild(el);
      CatArt.renderCatThumb(el.querySelector('canvas'), sp);
      el.addEventListener('click', () => b.switchTo(i));
    });
  }

  syncBattleControlHelp(){
    const english=window.MorrowwishI18n?.get?.()!=='zh';
    const dodge=document.getElementById('mv-dodge');
    const hint=dodge?.querySelector('.mv-k');
    if(hint)hint.textContent=this.isTouch?(english?'Tap':'点击'):'Space';
    const dodgeTip=this.isTouch
      ?(english?'Tap to dodge attacks (brief invincibility)':'点击闪避攻击（短暂无敌）')
      :(english?'Dodge attacks (Space; brief invincibility)':'闪避攻击（空格键；短暂无敌）');
    if(dodge){dodge.title=dodgeTip;dodge.setAttribute('aria-label',dodgeTip);}
    const basic=document.getElementById('mv-basic')?.querySelector('.mv-k');
    if(basic&&this.isTouch)basic.textContent=english?'Tap':'点击';
  }

  syncBattleModeUI(){
    const btn=document.getElementById('btn-auto');
    if(!btn||!this.battle)return;
    const on=!!this.battle.autoMode;
    const en=window.MorrowwishI18n?.get?.()!=='zh';
    const label=en?(on?'🤖 Auto Battle: ON':'🤖 Auto Battle: OFF')
      :(on?'🤖 自动战斗：开':'🤖 自动战斗：关');
    if(btn.textContent!==label)btn.textContent=label;
    btn.setAttribute('aria-pressed',String(on));
    btn.setAttribute('aria-label',en?(on?'Disable automatic battle':'Enable automatic battle')
      :(on?'关闭自动战斗':'开启自动战斗'));
    btn.classList.toggle('is-auto',on);
    btn.classList.toggle('gold',on);
    document.getElementById('battle-hint')?.classList.toggle('auto-active',on);
  }

  updateBattleUI() {
    const b = this.battle; if (!b) return;
    this.syncBattleModeUI();
    // wild HP + player active HP shown on canvas; here we update the control bar
    document.getElementById('ult-bar').style.width = b.ult + '%';
    document.getElementById('ult-btn').classList.toggle('ready', b.ult >= 100);
    const hint = document.getElementById('battle-hint');
    if (hint && hint.textContent !== b.hint) hint.textContent = b.hint;
    // move cooldowns; refresh labels if active cat changed
    const f = b.me();
    if (this._lastActiveIdx !== b.active) { this._lastActiveIdx = b.active; this.updateSkillLabels(); }
    this.renderCd('mv-basic', f.cd.basic);
    this.renderCd('mv-q', f.cd.q);
    this.renderCd('mv-e', f.cd.e);
    this.renderCd('mv-dodge', f.dodgeCd);
    // team slots: hp + active highlight
    const host = document.getElementById('team-slots');
    if (host) [...host.children].forEach((el, i) => {
      const fi = b.team[i];
      el.classList.toggle('active', i === b.active);
      el.classList.toggle('fainted', !fi.alive);
      const hp = el.querySelector('.slot-hp > span');
      if (hp) hp.style.width = (fi.hp / fi.maxhp * 100) + '%';
    });
  }

  // show/clear a cooldown overlay on a move button
  renderCd(id, cd) {
    const el = document.getElementById(id); if (!el) return;
    let ov = el.querySelector('.cd');
    if (cd > 0.05) {
      el.classList.add('cooling');
      if (!ov) { ov = document.createElement('span'); ov.className = 'cd'; el.appendChild(ov); }
      ov.textContent = cd.toFixed(1);
    } else {
      el.classList.remove('cooling');
      if (ov) ov.remove();
    }
  }

  endBattle() {
    const b = this.battle;
    if (!b) return;                 // already ended (loop may call this once on finish)
    const win = b.result === 'win';
    document.getElementById('battle-ui').classList.remove('on');
    // return to wherever we came from (yard normally, overworld region if exploring)
    const backToMap = this._returnScene === 'map' && window.WorldMap;
    this._returnScene = null;
    if (backToMap) {
      this.scene = 'map';
      document.body.classList.add('cb-exploring');
      WorldMap.enterRegion(WorldMap.currentRegion);
    } else {
      document.getElementById('tabbar').classList.remove('hidden');
      document.getElementById('hud').classList.remove('hidden');
      this.scene = 'yard';
    }
    this.yard?.refreshYardSwitch();
    if(b.masteryChallenge){
      // Challenge rewards are *only* personal-best improvement and a first S
      // medal. Never add another cat or pay repeat capture resources here.
      const performance=win?this.gradeBattle(b):null;
      const ownedCat=State.S.cats.find(cat=>cat.species===b.wild.id)||b.partner;
      const reward=win?this.recordBattleMastery(b.wild,performance,ownedCat):null;
      if(win){
        metric('game_complete',{practice:true,rarity:b.wild.rarity,grade:performance.grade});
        metric('bond_mastery_rematch_complete',{breed:b.wild.id,grade:performance.grade});
      }else{
        metric('game_over',{practice:true,rarity:b.wild.rarity});
        this._lastBattleLost=true;
      }
      State.save();this.refreshHUD();
      if(!backToMap)document.getElementById('yard-actions').classList.remove('hidden');
      this.battle=null;
      UI.openMasteryChallengeResult(b.wild,performance,reward,win);
      return;
    }
    if (win) {
      const newCat = State.makeCat(b.wild.id);
      if (window.Raising && Raising.decorateNewCat) Raising.decorateNewCat(newCat);
      State.S.cats.push(newCat);
      State.S.dex[b.wild.id] = (State.S.dex[b.wild.id] || 0) + 1;
      State.S.catchCount++;
      const milestoneRewards=this.grantCollectionMilestones();
      const performance=this.gradeBattle(b);
      const masteryReward=this.recordBattleMastery(b.wild,performance,newCat);
      State.S.coins+=performance.bonusCoins;
      State.S.treats+=performance.bonusTreats;
      // reward: partner gains affinity + xp, coins
      b.partner.affinity = Math.min(100, b.partner.affinity + 6);
      State.addXp(b.partner, 25);
      State.S.coins += 20 + (['N', 'R', 'SR', 'SSR'].indexOf(b.wild.rarity)) * 25;
      this.rebuildYard();
      State.save();
      this.refreshHUD();
      // Unified analytics: a won capture completes the run; also a capture event.
      metric('game_complete', { level: State.S.catchCount, rarity: b.wild.rarity, score: State.S.catchCount });
      window.MorrowwishAudio?.effect?.('capture');
      metric('cat_capture', { species: b.wild.id, rarity: b.wild.rarity });
      if(State.S.catchCount===1)metric('bond_first_capture',{rarity:b.wild.rarity});
      metric('bond_battle_grade',{grade:performance.grade,seconds:performance.seconds,
        combo:performance.combo,rarity:b.wild.rarity});
      UI.openCatchResult(b.wild, newCat, milestoneRewards, performance, masteryReward);
    } else {
      // Unified analytics: fleeing/wiping ends the run as a loss.
      window.MorrowwishAudio?.effect?.('end_fail');
      metric('game_over', { level: (State.S.catchCount || 0) + 1, rarity: b.wild.rarity });
      this._lastBattleLost = true;   // a subsequent battle counts as a retry
      this.toast('💨 野生猫猫跑掉了…下次再来！');
      if (!backToMap) document.getElementById('yard-actions').classList.remove('hidden');
    }
    this.battle = null;
  }

  // ---------- helpers ----------
  refreshHUD() {
    document.getElementById('coins').textContent = State.S.coins;
    document.getElementById('treats').textContent = State.S.treats;
    document.getElementById('fish').textContent = State.S.fish;
    const yarnEl = document.getElementById('yarn');
    if (yarnEl) yarnEl.textContent = (State.S.raising && State.S.raising.yarn) || 0;
    const dailyBtn = document.getElementById('daily-dot');
    if (dailyBtn) dailyBtn.classList.toggle('hidden', !State.dailyAvailable());
    this.refreshCollectionGoal();
  }

  toast(msg) {
    const wrap = document.getElementById('toasts');
    const el = document.createElement('div');
    el.className = 'toast'; el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .4s'; }, 1600);
    setTimeout(() => el.remove(), 2100);
  }
}

window.Game = Game;
