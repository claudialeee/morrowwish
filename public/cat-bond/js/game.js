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
    this.touchAutoFire=false; // manual phone players can focus on moving and skill timing
    this._worldTouch = null; // map: tap to walk / drag to pan
    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 100));
    window.addEventListener('morrowwish-language-change',()=>{
      if(this.scene==='battle'){
        this.syncBattleControlHelp();this.syncBattleModeUI();
        if(this.battleHelpOpen)this.renderBattleHelp();
        this.syncTouchBattleUI();
      }
    });
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
      this.syncTouchBattleUI();
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
      const chosen=window.CatRelations?.chosen?.()||[];
      const team=[...chosen,...State.S.cats.filter(c=>!chosen.some(x=>x.uid===c.uid))].slice(0,3);
      if (!team.length) { this.toast('没有可出战的猫'); return; }
      const region = WorldMap.REGIONS.find(r => r.id === regionId);
      UI.openBattleModePrompt(team,species,{origin:'map',theme:region?.theme||null});
    });
    WorldMap.onCollect((reward) => {
      if (reward.coins) State.S.coins += reward.coins;
      if (reward.treats) State.S.treats += reward.treats;
      if (reward.fish) State.S.fish += reward.fish;
      if(reward.yarn){Raising.init();State.S.raising.yarn+=reward.yarn;}
      if(reward.luck)State.S.luckLure=(State.S.luckLure||0)+reward.luck;
      if(reward.discovery){const pair=window.CatRelations?.chosen?.()||[];
        if(pair.length===2)CatRelations.grow(pair[0],pair[1],5);
        metric('bond_region_secret_found',{region:reward.discovery.id});
      }
      State.save(); this.refreshHUD();
      if(reward.discovery)UI.openRegionSecret(reward);
      else this.toast('📦 ' + (reward.label || '拾获补给'));
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
    UI.openMapChooser();
  }
  showYardChrome() {
    if(this.scene!=='yard')return;
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
    // S is demanding but attainable on both manual and automatic runs.
    // Switching auto off at the end cannot hide the assist used earlier.
    const fighters=b.team||[];
    const maxHP=fighters.reduce((n,f)=>n+(f.maxhp||0),0);
    const remaining=fighters.reduce((n,f)=>n+Math.max(0,f.hp||0),0);
    const hpRatio=maxHP>0?remaining/maxHP:0;
    const seconds=b.t||0,combo=b.comboBest||0;
    const timeLimit=this.gradeTimeLimit(b.wild?.rarity);
    const healthy=hpRatio>=.8,swift=seconds<=timeLimit;
    const clever=combo>=8||(b.perfectDodges||0)>=1;
    const points=Number(healthy)+Number(swift)+Number(clever);
    const autoUsed=!!(b.autoUsed||b.autoMode);
    // Automatic battles are a legitimate play style, not a consolation
    // prize. A well-raised squad can earn S through speed and survivability.
    // No arbitrary 16-hit / 95%-HP / 60%-time triple gate.
    const squadIntact=fighters.length>0&&fighters.every(f=>f.alive!==false&&f.hp>0);
    const autoExceptional=squadIntact&&hpRatio>=.75&&seconds<=timeLimit*1.25
      &&(combo>=5||hpRatio>=.87);
    const grade=autoUsed
      ?(autoExceptional?'S':points>=2?'A':points===1?'B':'C')
      :(points===3?'S':points>=2?'A':points===1?'B':'C');
    const bonuses={S:[42,2],A:[24,1],B:[14,0],C:[8,0]};
    const [bonusCoins,bonusTreats]=bonuses[grade];
    return {grade,bonusCoins,bonusTreats,seconds:Math.round(b.t||0),
      combo:b.comboBest||0,perfectDodges:b.perfectDodges||0,
      healthy,swift,clever,timeLimit,autoUsed,autoExceptional,hpRatio};
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
    const justLearned=(State.S.catchCount||0)<=2;
    const label=justLearned
      ?(english?'✨ New skills · Workshop · Explore ›':'✨ 新技能 · 工坊赚钱 · 地图探索 ›')
      :status.next===null
        ?(english?'🏆 Cat Adventure · All 25 breeds! ›':'🏆 猫猫冒险 · 25 种全部收集 ›')
        :(english?'🧭 Adventure · '+status.count+'/'+status.next+' breeds · Goals ›'
          :'🧭 冒险手册 · 图鉴 '+status.count+'/'+status.next+' · 查看目标 ›');
    if(hint.textContent!==label)hint.textContent=label;
    hint.setAttribute('aria-label',label);
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

  tryYardSurprise(cat){
    const d=State.S.yardStory||(State.S.yardStory={taps:0,count:0,at:0,pending:null});
    if(d.pending)return;
    d.taps++;
    if(d.taps<(d.count?7:3)||(d.count&&Date.now()-d.at<90000))return;
    d.pending={kind:d.count%7,uid:cat.uid};
    d.at=Date.now();d.count++;d.taps=0;
    this.toast(window.MorrowwishI18n?.get?.()==='zh'?'✨ 猫咪有个小秘密！':'✨ Your kitten found a secret!');
    metric('bond_yard_surprise_found',{kind:d.pending.kind});
    this.refreshYardSurprise();
  }
  refreshYardSurprise(){
    const duoEl=document.getElementById('yard-duo-status');
    if(duoEl){
      const members=window.CatRelations?.chosen?.()||[];
      duoEl.hidden=this.scene!=='yard'||members.length!==2||!!document.getElementById('panel')?.classList.contains('open');
      if(!duoEl.hidden){
        const en=window.MorrowwishI18n?.get?.()!=='zh';
        const val=CatRelations.pair(members[0],members[1])?.value||0;
        duoEl.textContent='💞 '+members.map(c=>State.catName(c)).join(' + ')+' · '+(en?'Bond ':'默契 ')+val;
      }
    }
    const el=document.getElementById('yard-surprise');if(!el)return;
    el.hidden=this.scene!=='yard'||!State.S.yardStory?.pending||!!document.getElementById('panel')?.classList.contains('open');
    if(!el.hidden)el.textContent=window.MorrowwishI18n?.get?.()==='zh'?'✨ 猫咪小秘密 · 点击发现':'✨ Cat surprise · Open';
  }
  claimYardSurprise(choice){
    const d=State.S.yardStory;if(!d?.pending||![0,1].includes(choice))return false;
    const kind=d.pending.kind;d.pending=null;
    const rewards=[
      [{coins:24},{treats:2}],
      [{fish:2},{coins:28}],
      [{yarn:3},{treats:3}],
      [{coins:18,duo:6},{treats:1,duo:10}],
      [{fish:2,duo:4},{coins:16,duo:8}],
      [{treats:3},{yarn:2,duo:5}],
      [{coins:30},{fish:2,duo:6}]
    ][kind]||[{coins:12},{treats:1}];
    const r=rewards[choice];
    State.S.coins+=(r.coins||0);State.S.treats+=(r.treats||0);State.S.fish+=(r.fish||0);
    if(r.yarn){Raising.init();State.S.raising.yarn+=r.yarn;}
    if(r.duo&&window.CatRelations){
      const members=CatRelations.chosen();
      if(members.length===2)CatRelations.grow(members[0],members[1],r.duo);
    }
    State.save();this.refreshHUD();metric('bond_yard_surprise_claimed',{kind,choice});
    return true;
  }
  refreshFirstQuest(){
    this.refreshYardSurprise();
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
    const mapIndex=document.getElementById('map-index');
    if(mapIndex)mapIndex.hidden=this.scene!=='map';
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
      if(this.battleHelpOpen)return; // Pause while the player reads controls.
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
      else if(this.scene==='map'&&window.WorldMap){
        if(WorldMap.mode==='region'){
          this._mapMouseDrag={x,y,lastX:x,lastY:y,moved:false};
        }else WorldMap.handleTap(x,y);
        e.preventDefault();
      }
      else if (this.scene === 'battle') { this.mouse.down = true; e.preventDefault(); }
    };
    const move = e => {
      const { x, y } = pos(e);
      // always track the cursor (yard reactions + battle aim)
      this.mouse.x = x; this.mouse.y = y; this.mouse.active = true; this.mouse.idle = 0;
      if(this.scene==='map'&&this._mapMouseDrag&&WorldMap?.mode==='region'){
        const drag=this._mapMouseDrag;
        if(Math.hypot(x-drag.x,y-drag.y)>7)drag.moved=true;
        if(drag.moved)WorldMap.panBy(x-drag.lastX,y-drag.lastY);
        drag.lastX=x;drag.lastY=y;e.preventDefault();
      }
      if (this.scene === 'yard') this.maybeRevealWild(x, y);
      if (this.scene === 'battle') e.preventDefault();
    };
    const up = e => {
      this.mouse.down=false;
      if(this._mapMouseDrag){
        const drag=this._mapMouseDrag;this._mapMouseDrag=null;
        if(this.scene==='map'&&window.WorldMap?.mode==='region'&&!drag.moved&&e?.type==='mouseup'){
          if(!WorldMap.handleTap(drag.lastX,drag.lastY)&&WorldMap.mode==='region')
            WorldMap.setDestination(drag.lastX,drag.lastY);
        }
      }
    };
    c.addEventListener('mousedown', down);
    c.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    c.addEventListener('dragstart',e=>e.preventDefault());

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
            this.syncTouchBattleUI(p.x,p.y);
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
          this.syncTouchBattleUI();
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
          this.syncTouchBattleUI();
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
      if (this.scene === 'battle' && ['w', 'a', 's', 'd', ' ', 'tab', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(keyName(e))) e.preventDefault();
    });
    window.addEventListener('keyup', e => { this.keys[keyName(e)] = false; });
    // prevent right-click menu over the arena
    c.addEventListener('contextmenu', e => { if (this.scene === 'battle') e.preventDefault(); });
  }

  // Wild cats are opt-in. Mouse moves and yard touching must never surprise
  // a player with new encounters; only the first tutorial or the Seek button
  // creates one. An active wild cat has no timer and remains until discovered.
  maybeRevealWild(x,y){
    if(this.scene!=='yard'||!this.yard?.hide||this.yard.hide.found)return;
    const h=this.yard.hide;
    if(Math.hypot(x-h.spot.x,y-h.spot.y)<120){
      h.peeking=true;h.peekT=.6;
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
    const previous=new Set(window.Skills?.learnableSkills(cat).map(sk=>sk.id)||[]);
    cat.affinity = Math.min(100, cat.affinity + 2);
    cat.joy = Math.min(100, cat.joy + 5);
    const lv = State.addXp(cat, 3);
    const newSkill=UI.announceSkillMilestone?.(cat,previous);
    if(newSkill)this.toast('✨ '+State.catName(cat)+' 学会 '+newSkill.name+'！');
    State.S.petCount=(State.S.petCount||0)+1;
    const closer=window.CatRelations?.pet(cat);
    if(closer?.levelUp)this.toast(window.MorrowwishI18n?.get?.()==='zh'?'💞 双猫关系升级！':'💞 Your duo grew closer!');
    if(closer?.quirk==='sulky'){
      CatRelations.chosen().forEach(c=>this.yard.entities.find(e=>e.cat.uid===c.uid)?.emote('💢',2.5));
      this.toast(window.MorrowwishI18n?.get?.()==='zh'
        ?'💢 猫咪闹别扭了！去搭档面板哄一哄。':'💢 Your duo is sulking. Help them make up!');
    }
    this.tryYardSurprise(cat);
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
  startMasteryChallenge(species,modeConfirmed=false){
    // A targeted S-rank rematch is a training challenge, NOT another capture.
    // Replaying cannot duplicate cats, grow the dex or farm capture currency.
    const owned=State.S.cats.filter(cat=>cat.species===species.id);
    if(!owned.length){
      this.toast('先收服这个品种，才能挑战金爪评级。');return false;
    }
    const team=State.S.cats.slice().sort((a,b)=>State.catPower(b)-State.catPower(a)).slice(0,3);
    if(!modeConfirmed){UI.openBattleModePrompt(team,species,{mastery:true});return true;}
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
    this.battleHelpOpen=false;
    this.battleTutorial=null;
    this.setBattleHelpVisible(false);
    this.yard?.refreshYardSwitch();
    window.MorrowwishAudio?.effect?.('discover');
    document.body.classList.remove('cb-exploring');
    // Unified Morrow Wish analytics: a capture battle is a game "run". If the
    // previous run ended in a loss, count this fresh attempt as a retry too.
    if (this._lastBattleLost) { metric('game_retry', { rarity: wildSpecies.rarity }); this._lastBattleLost = false; }
    metric('game_start', { level: (State.S.catchCount || 0) + 1, rarity: wildSpecies.rarity });
    document.getElementById('battle-ui').classList.add('on');
    // Garden guidance has a higher z-index than the battle buttons. It must
    // be hidden immediately, not only on the next yard HUD refresh.
    const goal=document.getElementById('collection-goal');
    if(goal)goal.hidden=true;
    const firstQuest=document.getElementById('first-quest');
    if(firstQuest)firstQuest.hidden=true;
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
    this.touchAutoFire=this.isTouch&&!this.battle.autoMode;
    this.syncBattleModeUI();
    this.syncBattleControlHelp();
    // The first-ever encounter begins paused with a short guided tour.
    // No damage, movement, or timer runs until the player starts or skips.
    if(!State.S.battlePrefs?.tutorialSeen && (State.S.catchCount||0)===0){
      this.battleTutorial={step:0,auto:!!this.battle.autoMode};
      this.setBattleHelpVisible(true);
    }
  }

  updateSkillLabels() {
    const b=this.battle;if(!b)return;
    const active=b.me(),en=window.MorrowwishI18n?.get?.()!=='zh';
    for(const [id,skill,fallback,key] of [
      ['mv-basic',null,en?'Claw':'猫爪',this.isTouch?(en?'Tap':'点击'):'J'],
      ['mv-q',active.qSkill,en?'Skill Q':'技能一','Q'],
      ['mv-e',active.eSkill,en?'Skill E':'技能二','E'],
      ['ult-btn',active.ultSkill,en?'Cat Storm':'喵之怒涛','R']
    ]){
      const btn=document.getElementById(id);if(!btn)continue;
      if(skill&&btn.querySelector('.mv-icon'))btn.querySelector('.mv-icon').textContent=this.skillIcon(skill);
      if(btn.querySelector('.mv-name'))btn.querySelector('.mv-name').textContent=skill?.name||fallback;
      if(btn.querySelector('.mv-k'))btn.querySelector('.mv-k').textContent=key;
      btn.title=skill?(skill.name+' · '+(skill.desc||'')):fallback;
      btn.setAttribute('aria-label',(skill?.name||fallback)+' · '+key);
      const newMove=!!(skill&&active.cat.unseenSkills?.includes(skill.id));
      btn.classList.toggle('newly-learned',newMove);
      let tag=btn.querySelector('.move-new-tag');
      if(newMove&&!tag){tag=document.createElement('span');tag.className='move-new-tag';tag.textContent='NEW';btn.appendChild(tag);}
      if(!newMove&&tag)tag.remove();
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

  syncTouchBattleUI(x=null,y=null){
    if(!this.isTouch)return;
    const root=document.getElementById('battle-ui');
    if(!root)return;
    const manual=this.scene==='battle'&&!this.battle?.autoMode;
    root.classList.toggle('touch-manual',manual);
    const attack=document.getElementById('mv-basic');
    if(attack){
      attack.classList.toggle('auto-firing',manual&&this.touchAutoFire);
      attack.setAttribute('aria-pressed',String(manual&&this.touchAutoFire));
      const en=window.MorrowwishI18n?.get?.()!=='zh';
      const label=en?(this.touchAutoFire?'Auto claw ON · tap to pause':'Claw OFF · tap to attack'):
        (this.touchAutoFire?'猫爪连击中 · 点击暂停':'猫爪已暂停 · 点击开启');
      attack.title=label;attack.setAttribute('aria-label',label);
      const key=attack.querySelector('.mv-k');if(key&&manual)key.textContent=en?(this.touchAutoFire?'ON':'OFF'):(this.touchAutoFire?'攻击中':'已暂停');
    }
    const pad=document.getElementById('battle-touch-joystick');
    if(pad){
      pad.classList.toggle('active',manual&&this.joystick.active);
      if(this.joystick.active&&x!==null&&y!==null){
        pad.style.left=Math.max(45,Math.min(this.W*.49-45,x))+'px';
        pad.style.top=Math.max(72,Math.min(this.H-82,y))+'px';
      }else if(!this.joystick.active){pad.style.left='';pad.style.top='';}
      const nub=pad.querySelector('.battle-touch-nub');
      if(nub)nub.style.transform='translate('+(this.joystick.dx*33)+'px,'+(this.joystick.dy*33)+'px)';
    }
  }
    syncBattleControlHelp(){
    const english=window.MorrowwishI18n?.get?.()!=='zh';
    const dodge=document.getElementById('mv-dodge');
    const hint=dodge?.querySelector('.mv-k');
    const dodgeKey=this.isTouch?(english?'Tap':'点按'):(english?'Space':'空格键');
    if(hint&&hint.textContent!==dodgeKey)hint.textContent=dodgeKey;
    const dodgeTip=this.isTouch
      ?(english?'Tap to dodge attacks (brief invincibility)':'点击闪避攻击（短暂无敌）')
      :(english?'Dodge attacks (Space; brief invincibility)':'闪避攻击（空格键；短暂无敌）');
    if(dodge){dodge.title=dodgeTip;dodge.setAttribute('aria-label',dodgeTip);}
    const basic=document.getElementById('mv-basic')?.querySelector('.mv-k');
    if(basic&&this.isTouch)basic.textContent=english?'Tap':'点按';
    const helpBtn=document.getElementById('battle-help-toggle');
    if(helpBtn){
      const label=english?'? Controls':'? 操作';
      if(helpBtn.textContent!==label)helpBtn.textContent=label;
      helpBtn.setAttribute('aria-label',english?'Show battle controls':'查看手动战斗操作说明');
    }
    this.syncTouchBattleUI();
    this.renderBattleHelp();
  }

  renderBattleHelp(){
    const host=document.getElementById('battle-help-body');
    if(!host)return;
    const en=window.MorrowwishI18n?.get?.()!=='zh';
    if(this.battleTutorial){
      const flow=this.battleTutorial;
      const stages=flow.auto
        ?(en?[
          ['🤖 Let the cats take care of it','Your cats automatically move, aim, attack, use skills and dodge. You can watch the battle unfold.'],
          ['✨ You are still the commander','Tap a teammate portrait to change cats. The Auto Battle button at the top lets you take control whenever you want.']
        ]:[
          ['🤖 猫咪会替你战斗','自动模式下，猫咪会自己移动、瞄准、攻击、放技能与闪避。你可以轻松观战。'],
          ['✨ 你随时能接管','点击队友头像可以换猫。战斗顶部的「自动战斗」按钮可以随时切换成手动。']
        ])
        :(en?[
          ['🕹️ 1 · Move your kitten',this.isTouch?'Drag the left virtual joystick to move. Your claws keep attacking; tap Claw to pause.':'Use WASD or the arrow keys to move around the arena.'],
          ['🐾 2 · Attack the wild cat',this.isTouch?'Claws auto-aim at nearby foes. Tap Claw to start or pause continuous attacks; hold the right arena to shoot manually.':'Hold left mouse button or press J to attack. Aim with the mouse.'],
          ['✨ 3 · Skills and dodge',this.isTouch?'Tap the bottom skill buttons. Dodge to avoid a hit; unleash your ultimate once the meter fills.':'Press Q / E for skills, Space to dodge and R for an ultimate. You can turn on Auto Battle at any time.']
        ]:[
          ['🕹️ 1 · 移动小猫',this.isTouch?'滑动左侧摇杆移动。猫爪会持续攻击，点击猫爪按钮可暂停。':'使用 WASD 或方向键控制小猫移动。'],
          ['🐾 2 · 攻击野猫',this.isTouch?'猫爪自动瞄准附近野猫。点击猫爪按钮可开始或暂停持续攻击，也可以按住画面右侧射击。':'按住鼠标左键或按 J 攻击，用鼠标瞄准。'],
          ['✨ 3 · 技能与闪避',this.isTouch?'点下方技能键释放技能；点「闪避」躲开攻击，能量满时释放必杀。':'按 Q / E 放技能、空格闪避、R 放必杀。战斗中也可以随时切换自动。']
        ]);
      const step=Math.min(flow.step,stages.length-1);
      const title=document.getElementById('battle-help-title');
      if(title)title.textContent=en?'Your first battle · '+(step+1)+'/'+stages.length
        :'第一次战斗 · '+(step+1)+'/'+stages.length;
      const [heading,desc]=stages[step];
      host.innerHTML='<div class="battle-tutorial-progress" aria-hidden="true">'+
        stages.map((_,i)=>'<span class="'+(i<=step?'filled':'')+'"></span>').join('')+
        '</div><section class="battle-help-section preferred battle-tutorial-step"><b>'+
        heading+'</b><p>'+desc+'</p></section><p class="battle-help-note">'+
        (en?'The battle is paused while you learn.':'教学期间战斗暂停，不会突然受到攻击。')+
        '</p><button id="battle-tutorial-skip" type="button" class="battle-tutorial-skip">'+
        (en?'Skip tutorial':'跳过教学')+'</button>';
      host.querySelector('#battle-tutorial-skip').onclick=()=>this.completeBattleTutorial();
      const btn=document.getElementById('battle-help-start');
      if(btn)btn.textContent=step===stages.length-1?(en?'Start fighting!':'开始战斗！')
        :(en?'Next':'下一步');
      const close=document.getElementById('battle-help-close');
      if(close)close.setAttribute('aria-label',en?'Skip tutorial':'跳过教学');
      return;
    }
    const title=document.getElementById('battle-help-title');
    if(title)title.textContent=en?'How to fight':'手动战斗怎么玩？';
    const btn=document.getElementById('battle-help-start');
    if(btn)btn.textContent=en?'Resume battle':'明白了，继续战斗';
    host.innerHTML=en
      ? `<section class="battle-help-section ${this.isTouch?'preferred':''}">
        <b>Phone / touchscreen</b><p><strong>Move:</strong> drag anywhere on the left half.</p>
        <p><strong>Attack:</strong> press and hold the right half; aims at the nearest enemy.</p>
        <p><strong>Skills:</strong> tap the bottom skill buttons; tap Dodge to avoid a hit.</p>
        <p><strong>Ultimate:</strong> tap the cyclone once the meter is full. Tap a teammate portrait to switch.</p></section>
        <section class="battle-help-section ${!this.isTouch?'preferred':''}">
        <b>Computer / keyboard</b><p><strong>Move:</strong> WASD or arrow keys; aim with mouse.</p>
        <p><strong>Attack:</strong> hold left click or J; Q / E use skills; Space dodges.</p>
        <p><strong>Ultimate:</strong> R; 1 / 2 / 3 switch cats; P toggles auto-battle.</p></section>
        <p class="battle-help-note">Controls help pauses the fight. Auto mode moves, attacks and dodges for you.</p>`
      : `<section class="battle-help-section ${this.isTouch?'preferred':''}">
        <b>手机 / 触屏</b><p><strong>移动：</strong>在屏幕左半边按住滑动。</p>
        <p><strong>攻击：</strong>在右半边按住，自动瞄准最近的野猫。</p>
        <p><strong>技能：</strong>点击下方技能按钮；点击「闪避」躲攻击。</p>
        <p><strong>必杀：</strong>能量满后点旋风；点队友头像切换猫咪。</p></section>
        <section class="battle-help-section ${!this.isTouch?'preferred':''}">
        <b>电脑 / 键鼠</b><p><strong>移动：</strong>WASD 或方向键；鼠标瞄准。</p>
        <p><strong>攻击：</strong>按住鼠标左键或 J；Q / E 放技能；空格键闪避。</p>
        <p><strong>必杀：</strong>R；1 / 2 / 3 换猫；P 切换自动战斗。</p></section>
        <p class="battle-help-note">查看说明时战斗会暂停。自动模式会代替你移动、攻击和闪避。</p>`;
  }
  advanceBattleTutorial(){
    if(!this.battleTutorial){this.setBattleHelpVisible(false);return;}
    const count=this.battleTutorial.auto?2:3;
    if(this.battleTutorial.step+1>=count){this.completeBattleTutorial();return;}
    this.battleTutorial.step++;
    this.renderBattleHelp();
  }
  completeBattleTutorial(){
    if(!this.battleTutorial)return;
    this.battleTutorial=null;
    State.S.battlePrefs=State.S.battlePrefs||{};
    State.S.battlePrefs.tutorialSeen=true;
    State.save();
    this.mouse.down=false;this.keys={};
    this.setBattleHelpVisible(false);
  }
  setBattleHelpVisible(show){
    if(!show&&this.battleTutorial){this.completeBattleTutorial();return;}
    this.battleHelpOpen=!!show&&this.scene==='battle';
    const el=document.getElementById('battle-help');
    if(el)el.hidden=!this.battleHelpOpen;
    const toggle=document.getElementById('battle-help-toggle');
    if(toggle)toggle.setAttribute('aria-expanded',String(this.battleHelpOpen));
    if(this.battleHelpOpen)this.renderBattleHelp();
  }

  syncBattleModeUI(){
    const btn=document.getElementById('btn-auto');
    if(!btn||!this.battle)return;
    const on=!!this.battle.autoMode;
    this.syncTouchBattleUI();
    const en=window.MorrowwishI18n?.get?.()!=='zh';
    // The compact phone HUD names the ACTIVE mode. Full explanation remains
    // in the accessible label, and players can switch without opening a menu.
    const label=this.isTouch?(en?(on?'🤖 Auto':'🎮 Manual'):(on?'🤖 自动':'🎮 手动'))
      :(en?(on?'🤖 Auto Battle: ON':'🎮 Manual Battle')
      :(on?'🤖 自动战斗':'🎮 手动战斗'));
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
    // Always-visible, compact ENEMY health bar. Canvas world HP floats with
    // enemy position; on phones it can disappear behind the camera/controls.
    const hpbar=document.querySelector('.battle-enemy-track');
    const fill=document.getElementById('battle-enemy-hp-fill');
    if(hpbar&&fill){
      let total=0,max=0;
      for(const enemy of b.enemies||[]){
        max+=enemy.maxhp||0;
        total+=Math.max(0,enemy.hp||0);
      }
      const pct=max?Math.max(0,Math.min(100,100*total/max)):0;
      fill.style.width=pct.toFixed(1)+'%';
      const en=window.MorrowwishI18n?.get?.()!=='zh';
      hpbar.setAttribute('aria-label',en?'Enemy health':'野猫血量');
      hpbar.setAttribute('aria-valuenow',String(Math.round(pct)));
    }
    document.getElementById('ult-bar').style.width = b.ult + '%';
    document.getElementById('ult-btn').classList.toggle('ready', b.ult >= 100);
    const hint = document.getElementById('battle-hint');
    if (hint && hint.textContent !== b.hint) hint.textContent = b.hint;
    if (hint) hint.classList.toggle('coach-hint', !!b.coach);   // highlight the coaching line
    // First-fight coach: pulse the control the tutorial is currently teaching.
    const hl = b.coach ? b._coachHighlight : null;
    if (this._coachHlPrev !== hl) {
      for (const id of ['mv-basic','mv-q','mv-e','mv-dodge','ult-btn']) {
        const el = document.getElementById(id); if (el) el.classList.toggle('coach-pulse', id === hl);
      }
      this._coachHlPrev = hl;
    }
    const duoButton=document.getElementById('duo-burst');
    if(duoButton){
      duoButton.hidden=!b.duo;
      if(b.duo){
        duoButton.disabled=!b.duoReady();
        duoButton.classList.toggle('ready',b.duoReady());
        duoButton.textContent=b.duoReady()?'💞 '+b.duo.name+'！'
          :'💞 '+(window.MorrowwishI18n?.get?.()==='zh'?'双猫默契 ':'Duo charge ')+Math.floor(b.duoCharge)+'%';
      }
    }
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
    // Fold this battle's observations into the persistent adaptive-AI profile so
    // enemies evolve to the player's habits over time. (Save happens below.)
    try { b.commitAiProfile(win); } catch (e) {}
    document.getElementById('battle-ui').classList.remove('on');
    const duoButton=document.getElementById('duo-burst');if(duoButton)duoButton.hidden=true;
    this.setBattleHelpVisible(false);
    // return to wherever we came from (yard normally, overworld region if exploring)
    const backToMap = this._returnScene === 'map' && window.WorldMap;
    this._returnScene = null;
    if (backToMap) {
      this.scene = 'map';
      document.body.classList.add('cb-exploring');
      WorldMap.enterRegion(WorldMap.currentRegion);
    } else {
      this.scene = 'yard';
      // One canonical restore path: no exit (victory, defeat, flee, replay,
      // panel dismissal) may strand the leaf/seek, feed or map buttons hidden.
      this.showYardChrome();
    }
    this.yard?.refreshYardSwitch();
    this.refreshCollectionGoal();
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
      // Two resident individuals per breed allow different personalities
      // and breeding; further repeat captures nurture the existing breed.
      // Previously saved cats are NEVER removed or migrated.
      const sameBreed=State.S.cats.filter(cat=>cat.species===b.wild.id);
      const reunion=sameBreed.length>=2;
      const newCat=reunion
        ?sameBreed.reduce((best,cat)=>!best||State.catPower(cat)>State.catPower(best)?cat:best,null)
        :State.makeCat(b.wild.id);
      if(!reunion){
        if(window.Raising&&Raising.decorateNewCat)Raising.decorateNewCat(newCat);
        State.S.cats.push(newCat);
      }else{
        newCat.affinity=Math.min(100,(newCat.affinity||0)+8);
        State.addXp(newCat,45);
        State.S.treats+=2;
        metric('bond_repeat_reunion',{species:b.wild.id,owned:sameBreed.length});
      }
      State.S.dex[b.wild.id] = (State.S.dex[b.wild.id] || 0) + 1;
      State.S.catchCount++;
      const milestoneRewards=this.grantCollectionMilestones();
      const performance=this.gradeBattle(b);
      const masteryReward=this.recordBattleMastery(b.wild,performance,newCat);
      State.S.coins+=performance.bonusCoins;
      State.S.treats+=performance.bonusTreats;
      // reward: partner gains affinity + xp, coins
      const skillsBefore=new Set(window.Skills?.learnableSkills(b.partner).map(sk=>sk.id)||[]);
      b.partner.affinity = Math.min(100, b.partner.affinity + 6);
      State.addXp(b.partner, 25);
      const firstSkill=(State.S.catchCount===1&&window.Skills?.awakenFirstSkill)
        ?Skills.awakenFirstSkill(b.partner):null;
      if(firstSkill){
        if(!Array.isArray(b.partner.unseenSkills))b.partner.unseenSkills=[];
        if(!b.partner.unseenSkills.includes(firstSkill.id))b.partner.unseenSkills.push(firstSkill.id);
        metric('bond_skill_unlocked',{breed:b.partner.species,skill:firstSkill.id,source:'first_capture'});
      }
      const earnedSkill=firstSkill||UI.announceSkillMilestone?.(b.partner,skillsBefore)||null;
      let firstDuo=null;
      if(!reunion&&window.CatRelations&&b.partner.uid!==newCat.uid){
        CatRelations.grow(b.partner,newCat,State.S.catchCount===1?26:7);
        if(State.S.catchCount===1){CatRelations.choose(b.partner,newCat);
          firstDuo={...CatRelations.title(b.partner,newCat),value:26};
          metric('bond_duo_unlocked',{elementPair:firstDuo.elementPair});
        }
      }
      if(b.duo&&window.CatRelations)CatRelations.grow(b.duo.a,b.duo.b,4);
      State.S.coins += 20 + (['N', 'R', 'SR', 'SSR'].indexOf(b.wild.rarity)) * 25;
      this.rebuildYard();
      State.save();
      this.refreshHUD();
      // Unified analytics: a won capture completes the run; also a capture event.
      metric('game_complete', { level: State.S.catchCount, rarity: b.wild.rarity, score: State.S.catchCount });
      window.MorrowwishAudio?.effect?.('capture');
      metric('cat_capture', { species: b.wild.id, rarity: b.wild.rarity,addedToRoster:!reunion });
      if(State.S.catchCount===1)metric('bond_first_capture',{rarity:b.wild.rarity});
      metric('bond_battle_grade',{grade:performance.grade,seconds:performance.seconds,
        combo:performance.combo,rarity:b.wild.rarity});
      UI.openCatchResult(b.wild,newCat,milestoneRewards,performance,masteryReward,reunion,
        earnedSkill?{cat:b.partner,skill:earnedSkill}:null,firstDuo);
    } else {
      // Unified analytics: fleeing/wiping ends the run as a loss.
      window.MorrowwishAudio?.effect?.('end_fail');
      metric('game_over', { level: (State.S.catchCount || 0) + 1, rarity: b.wild.rarity });
      this._lastBattleLost = true;   // a subsequent battle counts as a retry
      this.toast('💨 野生猫猫跑掉了…下次再来！');
      if (!backToMap) document.getElementById('yard-actions').classList.remove('hidden');
      State.save();   // persist the adaptive-AI profile folded in above, even on a loss
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
    this.refreshYardSurprise();
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
