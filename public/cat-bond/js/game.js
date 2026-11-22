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
    // Cap total backing-store pixels so the larger desktop stage doesn't tank the
    // frame rate (a slow frame makes the dt-clamped sim crawl → enemies look frozen).
    const dpr=Math.min(window.devicePixelRatio||1,2.5,Math.sqrt(2800000/pixels));
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
      const team=UI.getPreferredBattleTeam();
      if (!team.length) { this.toast('没有可出战的猫'); return; }
      const region = WorldMap.REGIONS.find(r => r.id === regionId);
      UI.openBattleModePrompt(team,species,{origin:'map',theme:region?.theme||null});
    });
    WorldMap.onCollect((reward) => {
      // Two currencies only: retired treats fold into 🐠 fish, retired yarn into 🪙 coins.
      if (reward.coins) State.S.coins += reward.coins;
      if (reward.yarn) State.S.coins += reward.yarn;
      if (reward.fish) State.S.fish += reward.fish;
      if (reward.treats) State.S.fish += reward.treats;
      if(reward.luck)State.S.luckLure=(State.S.luckLure||0)+reward.luck;
      if(reward.discovery){
        const pair=window.CatRelations?.chosen?.()||[];
        if(reward.duoMemory){
          if(pair.length===2)CatRelations.remember(pair[0],pair[1],reward.duoMemoryId||WorldMap.currentRegion);
        }else if(pair.length===2)CatRelations.grow(pair[0],pair[1],5);
        metric('bond_region_secret_found',{region:reward.discovery.id,duo:!!reward.duoMemory});
      }
      State.save(); this.refreshHUD();
      if(reward.discovery)UI.openRegionSecret(reward);
      else{
        const en=window.MorrowwishI18n?.get?.()!=='zh';
        // Collapse to the two surviving currencies: yarn adds to 🪙 coins, treats to 🐠 fish.
        const coinAmt=(reward.coins||0)+(reward.yarn||0);
        const fishAmt=(reward.fish||0)+(reward.treats||0);
        const amounts=[['🪙',coinAmt],['🐠',fishAmt],['✨',reward.luck||0]]
          .filter(([,n])=>n).map(([icon,n])=>icon+'+'+n).join(' ');
        this.toast((reward.label||(en?'Treasure found!':'发现宝贝'))+' '+amounts);
      }
    });
    WorldMap.onExit(() => { this.scene = 'yard'; this.showYardChrome(); });
  }

  openWorldMap() {
    // Clear messages from the garden encounter tutorial before navigating.
    // The global toast queue otherwise covers the exploration map and cats
    // for two seconds, despite the garden UI correctly being hidden.
    document.getElementById('toasts')?.replaceChildren();
    this.scene = 'map';
    if(this.yard?.placement){this.yard.cancelPlacement();window.UI?.updateBuildingPlacement?.();}
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
  sRankRequirements(rarity){
    const novice=(window.State?.S?.catchCount||0)<=3;
    const limit=this.gradeTimeLimit(rarity);
    return {novice,
      manual:{hp:novice?.82:.88,seconds:Math.floor(limit*(novice?1:.90)),
        combo:novice?5:9,dodgeCombo:novice?2:5},
      auto:{hp:novice?.88:.90,seconds:Math.floor(limit*(novice?1:.87)),
        combo:novice?6:10}
    };
  }
  gradeBattle(b){
    // S is attainable but a routine win should generally earn A/B.
    const fighters=b.team||[];
    const maxHP=fighters.reduce((n,f)=>n+(f.maxhp||0),0);
    const remaining=fighters.reduce((n,f)=>n+Math.max(0,f.hp||0),0);
    const hpRatio=maxHP>0?remaining/maxHP:0;
    const seconds=b.t||0,combo=b.comboBest||0;
    const ratedSeconds=Math.max(0,seconds-Math.max(0,b.coachSeconds||0));
    const timeLimit=this.gradeTimeLimit(b.wild?.rarity);
    const criteria=this.sRankRequirements(b.wild?.rarity);
    const squadIntact=fighters.length>0&&fighters.every(f=>f.alive!==false&&f.hp>0);
    const autoUsed=!!(b.autoUsed||b.autoMode);
    const healthy=hpRatio>=.8,swift=ratedSeconds<=timeLimit;
    const clever=combo>=8||(b.perfectDodges||0)>=1;
    const points=Number(healthy)+Number(swift)+Number(clever);
    // All S ranks need speed, HP and actual skill. Early catches have a
    // forgiving threshold; an idle high-HP automatic run never earns S.
    const manualExceptional=squadIntact&&hpRatio>=criteria.manual.hp
      &&ratedSeconds<=criteria.manual.seconds
      &&(combo>=criteria.manual.combo||
        ((b.perfectDodges||0)>=1&&combo>=criteria.manual.dodgeCombo));
    const autoExceptional=squadIntact&&hpRatio>=criteria.auto.hp
      &&ratedSeconds<=criteria.auto.seconds&&combo>=criteria.auto.combo;
    const grade=autoUsed
      ?(autoExceptional?'S':points>=2?'A':points===1?'B':'C')
      :(manualExceptional?'S':points>=2?'A':points===1?'B':'C');
    // [coins, fish] bonus per grade; the old treats bonus now pays out as 🐠 fish.
    const bonuses={S:[42,2],A:[24,1],B:[14,0],C:[8,0]};
    const [bonusCoins,bonusFish]=bonuses[grade];
    return {grade,bonusCoins,bonusFish,seconds:Math.round(b.t||0),
      combo:b.comboBest||0,perfectDodges:b.perfectDodges||0,
      healthy,swift,clever,timeLimit,autoUsed,autoExceptional,manualExceptional,hpRatio,
      ratedSeconds:Math.round(ratedSeconds),novice:criteria.novice,
      sRankCriteria:criteria[autoUsed?'auto':'manual']};
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
    // Milestone rewards now pay 🪙 coins + 🐠 fish (old treats folded into fish).
    const milestones=[
      {count:3,coins:60,fish:2},
      {count:5,coins:100,fish:3},
      {count:10,coins:180,fish:5},
      {count:15,coins:260,fish:6},
      {count:20,coins:350,fish:8},
      {count:GameData.SPECIES.length,coins:500,fish:12},
    ];
    const S=State.S;
    if(!Array.isArray(S.collectionMilestones))S.collectionMilestones=[];
    const collected=this.collectionStatus().count;
    const granted=[];
    for(const m of milestones){
      if(collected>=m.count&&!S.collectionMilestones.includes(m.count)){
        S.collectionMilestones.push(m.count);
        S.coins+=m.coins;S.fish+=m.fish;
        granted.push(m);
        metric('bond_collection_milestone',{species:collected,target:m.count});
      }
    }
    return granted;
  }
  refreshCollectionGoal(){
    const hint=document.getElementById('collection-goal');
    if(!hint)return;
    // Replaced by explicit bottom/right skill, workshop and duo controls.
    hint.hidden=true;return;
    const status=this.collectionStatus();
    const panelOpen=document.getElementById('panel')?.classList.contains('open');
    hint.hidden=this.scene!=='yard'||status.count<2||!!panelOpen;
    if(hint.hidden)return;
    const english=window.MorrowwishI18n?.get?.()!=='zh';
    const justLearned=(State.S.catchCount||0)<=2;
    const label=justLearned
      ?(english?'✨ New skills · Workshop · Explore ›':'✨ 新技能 · 工坊赚钱 · 地图探索 ›')
      :status.next===null
        ?(english?'🏆 Cat Adventure · All '+status.total+' breeds! ›':'🏆 猫猫冒险 · '+status.total+' 种全部收集 ›')
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
    const goals=[{n:3,coins:35,fish:2},{n:10,coins:100,fish:3},{n:25,coins:250,fish:5}];
    const rewards=[];
    for(const g of goals){
      if((S.petCount||0)>=g.n&&!S.bondingRewards.includes(g.n)){
        S.bondingRewards.push(g.n);
        S.coins+=g.coins;S.fish+=g.fish;
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
      const pending=window.CatRelations?.unresolved?.()[0]||null;
      // After the player befriends a second cat, surface the defining game
      // mechanic immediately instead of hiding the duo entry until THEY
      // somehow discover the otherwise buried pairing menu.
      const canPair=(State.S.cats||[]).length>=1;
      // The Duo screen now lives in Cats > Duo, not in the right action rail.
      duoEl.hidden=true;
    }
    // Alert the player to a relationship disagreement in the bottom Cat tab.
    const pending=window.CatRelations?.unresolved?.()[0]||null;
    const dot=document.getElementById('cat-duo-dot');
    if(dot)dot.hidden=!pending;
    const catTab=document.querySelector('[data-tab="cats"]');
    if(catTab)catTab.setAttribute('aria-label',pending
      ?(window.MorrowwishI18n?.get?.()==='zh'?'猫咪：双猫闹别扭待处理':'Cats: a duo needs your attention')
      :(window.MorrowwishI18n?.get?.()==='zh'?'猫咪':'Cats'));
    const el=document.getElementById('yard-surprise');if(!el)return;
    el.hidden=this.scene!=='yard'||!State.S.yardStory?.pending||!!document.getElementById('panel')?.classList.contains('open');
    if(!el.hidden)el.textContent=window.MorrowwishI18n?.get?.()==='zh'?'✨ 猫咪小秘密 · 点击发现':'✨ Cat surprise · Open';
  }
  claimYardSurprise(choice){
    const d=State.S.yardStory;if(!d?.pending||![0,1].includes(choice))return false;
    const kind=d.pending.kind;d.pending=null;
    // Rewards use only 🪙 coins + 🐠 fish now (old treats → fish, old yarn → coins).
    const rewards=[
      [{coins:24},{fish:2}],
      [{fish:2},{coins:28}],
      [{coins:30},{fish:3}],
      [{coins:18,duo:6},{fish:1,duo:10}],
      [{fish:2,duo:4},{coins:16,duo:8}],
      [{fish:3},{coins:20,duo:5}],
      [{coins:30},{fish:2,duo:6}]
    ][kind]||[{coins:12},{fish:1}];
    const r=rewards[choice];
    State.S.coins+=(r.coins||0);State.S.fish+=(r.fish||0);
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
    const firstCapture=State.S.cats.length>0&&(State.S.catchCount||0)===0;
    const firstPet=State.S.cats.length>0&&(State.S.catchCount||0)>0&&(State.S.petCount||0)===0;
    const panelOpen=document.getElementById('panel')?.classList.contains('open');
    hint.hidden=!(firstCapture||firstPet)||this.scene!=='yard'||!!panelOpen;
    if(hint.hidden)return;
    const english=window.MorrowwishI18n?.get?.()!=='zh';
    // Teach one delightful action at a time. Never force a separate tutorial modal.
    const label=firstPet
      ? (english?'🐾 Your next step: tap a cat to pet it and grow your bond!':'🐾 下一步：点击庭院里的小猫，摸摸它，培养感情！')
      : this.yard?.hide
        ? (english?'🌿 First adventure: tap the glowing bush to meet a new cat!':'🌿 第一次冒险：点击发光的草丛，遇见新伙伴！')
        : (english?'🌿 First adventure: tap the grass button to find a cat':'🌿 第一次冒险：点击草丛按钮寻找野猫');
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
    const squadBtn=document.getElementById('map-squad');
    if(squadBtn){
      squadBtn.hidden=this.scene!=='map';
      const en=window.MorrowwishI18n?.get?.()!=='zh';
      const label=en?'🐾 Battle team':'🐾 出战猫咪';
      if(squadBtn.textContent!==label)squadBtn.textContent=label;
      squadBtn.setAttribute('aria-label',en?'Choose battle cats':'选择出战猫咪');
    }
    if(this.scene==='yard'){
      this.yard.update(dt);
      if(this.t>=(this._nextQuestTick||0)){
        this._nextQuestTick=this.t+0.3;
        this.refreshFirstQuest();
        this.refreshCollectionGoal();
      }
    }
    else if (this.scene === 'map' && window.WorldMap) {
      // Freeze the whole overworld while a panel is open (e.g. the pre-battle mode
      // prompt that pops the instant you touch a wild cat): the scene is still 'map'
      // until the player taps Start, so without this the roamers keep wandering
      // behind the dialog. A full-screen lock on encounter is the intended feel.
      const panelOpen = document.getElementById('panel')?.classList.contains('open');
      if (!panelOpen) WorldMap.update(dt);
    }
    else if (this.scene === 'battle' && this.battle) {
      if(this.battleHelpOpen)return; // Pause while the player reads controls.
      this.battle.update(dt);
      this.updateBattleUI();
      if (this.battle.done) this.endBattle();
    }
  }

  draw() {
    const ctx = this.ctx;
    // Battle cut-ins use additive blending, flashes, canvas filters and alpha.
    // ClearRect does NOT reset any of those drawing-state properties. Every
    // scene starts from an opaque source-over layer to prevent a washed-out
    // courtyard or ghost cats after returning from a finished battle.
    ctx.save();
    ctx.globalAlpha=1;
    ctx.globalCompositeOperation='source-over';
    ctx.filter='none';
    ctx.shadowBlur=0;
    ctx.setLineDash([]);
    ctx.clearRect(0,0,this.W,this.H);
    try {
      if (this.scene === 'yard') this.yard.draw(ctx);
      else if (this.scene === 'map' && window.WorldMap) WorldMap.draw(ctx);
      else if (this.scene === 'battle' && this.battle) this.battle.draw(ctx);
    } finally { ctx.restore(); }
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
      if (this.scene === 'yard') {
        if(this.yard?.placement){
          this.yard.movePlacement(x,y);
          window.UI?.updateBuildingPlacement?.();
          e.preventDefault();
        }else this.maybeRevealWild(x, y);
      }
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
          if(this.battle&&!this.battle.autoMode&&this.battle.lockAt?.(p.x,p.y)){
            this.syncTouchBattleUI();
            continue;
          }
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
          if (this.scene === 'yard') {
            if(this.yard?.placement){
              this.yard.movePlacement(p.x,p.y);
              window.UI?.updateBuildingPlacement?.();
            }else this.maybeRevealWild(p.x,p.y);
          }
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
    if(this.yard?.placement){
      this.yard.movePlacement(x,y);
      window.UI?.updateBuildingPlacement?.();
      return;
    }
    const hit = this.yard.handleTap(x, y);
    if (!hit) return;
    if (hit.type === 'building') {
      const started=this.yard.inviteCatToBuilding(hit.building);
      this.toast(started
        ?(window.MorrowwishI18n?.get?.()==='zh'
            ?'猫猫正在过来使用设施！':'A kitten is on its way to play!')
        :(window.MorrowwishI18n?.get?.()==='zh'
            ?'猫猫正在忙，稍后再试':'The cats are busy right now'));
      return;
    }
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
      const sp = {...this.yard.hide.species,
        encounterLevel:this.yard.hide.level||1};
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
    // 撸猫 only raises 亲密(affinity) + joy — NEVER XP/level. Levels come from winning
    // battles; affinity gives a temporary % stat buff (see State.affinityStatMult).
    cat.affinity = Math.min(100, cat.affinity + 2);
    cat.joy = Math.min(100, cat.joy + 5);
    const newSkill=UI.announceSkillMilestone?.(cat,previous);
    if(newSkill)this.toast('✨ '+State.catName(cat)+' 学会 '+newSkill.name+'！');
    State.S.petCount=(State.S.petCount||0)+1;
    const closer=window.CatRelations?.pet(cat);
    if(closer?.levelUp)this.toast(window.MorrowwishI18n?.get?.()==='zh'?'💞 双猫关系升级！':'💞 Your duo grew closer!');
    const quarrelPair=closer?.quirk==='sulky' ? (CatRelations.chosen()||[]) : null;
    if(quarrelPair?.length===2){
      quarrelPair.forEach(c=>this.yard.entities.find(e=>e.cat.uid===c.uid)?.emote('💢',2.5));
      // Resolve all underlying state and cat-detail redraws FIRST, then
      // present the actionable disagreement panel, not a fading toast.
      this.refreshYardSurprise();
    }
    this.tryYardSurprise(cat);
    const rewards=this.grantBondingRewards();
    if(rewards.length){
      const coins=rewards.reduce((n,r)=>n+r.coins,0);
      this.toast((window.MorrowwishI18n?.get?.()==='zh'
        ?'💞 亲密互动奖励：+':'💞 Bonding reward: +')+coins+' 🪙');
      this.refreshHUD();
    }
    State.save();
    this.refreshYardSurprise();
    this.refreshFirstQuest(); // The first-pet prompt disappears immediately after the interaction.
    // If a cat detail panel is open, refresh BEFORE any important modal.
    // Previously this refresh replaced the quarrel story immediately after
    // showing it (an apparent one-frame flash).
    if (UI.openCatUid === cat.uid) UI.renderCatDetail(cat);
    if(quarrelPair?.length===2){
      UI.openDuoQuarrel(quarrelPair[0],quarrelPair[1]);
      this.refreshYardSurprise();
    }
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
    if(this.yard?.placement){this.yard.cancelPlacement();window.UI?.updateBuildingPlacement?.();}
    window.MorrowwishMusic?.switchScene?.('battle');
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
    document.getElementById('wild-name').textContent =
      `野生 ${GameData.speciesName(wildSpecies)} · Lv.${this.battle.wildLevel} · ${wildSpecies.rarity}`;
    this.buildTeamSlots();
    this.updateSkillLabels();
    this.updateBattleUI();
    // Display current battle state, including keyboard P toggles.
    this.touchAutoFire=this.isTouch&&!this.battle.autoMode&&!this.battle.coach;
    this.syncBattleModeUI();
    this.syncBattleControlHelp();
    // The first-ever encounter begins paused with a short guided tour.
    // No damage, movement, or timer runs until the player starts or skips.
    if(!this.battle.autoMode&&this.battle.coach)this.showFirstManualTutorial();
    else if(this.battle.autoMode&&!State.S.battlePrefs?.tutorialSeen&&(State.S.catchCount||0)===0){
      this.battleTutorial={step:0,auto:true};
      this.setBattleHelpVisible(true);
    }
  }

  updateSkillLabels() {
    const b=this.battle;if(!b)return;
    const active=b.me(),en=window.MorrowwishI18n?.get?.()!=='zh';
    for(const [id,skill,fallback,key] of [
      ['mv-basic',null,en?'Toss':'丢猫玩具',this.isTouch?(en?'Tap':'点击'):'J'],
      ['mv-q',active.qSkill,en?'Skill Q':'技能一','Q'],
      ['mv-e',active.eSkill,en?'Skill E':'技能二','E'],
      ['ult-btn',active.ultSkill,en?'Cat Storm':'喵之怒涛','R']
    ]){
      const btn=document.getElementById(id);if(!btn)continue;
      if(skill&&btn.querySelector('.mv-icon'))btn.querySelector('.mv-icon').textContent=this.skillIcon(skill);
      const displayName=skill?(en?(window.CatBondI18n?.translate?.(skill.name)||skill.name):skill.name):fallback;
      const displayDesc=skill?(en?(window.CatBondI18n?.translate?.(skill.desc||'')||skill.desc||''):(skill.desc||'')):'';
      if(btn.querySelector('.mv-name'))btn.querySelector('.mv-name').textContent=displayName;
      if(btn.querySelector('.mv-k'))btn.querySelector('.mv-k').textContent=key;
      btn.title=skill?(displayName+' · '+displayDesc):fallback;
      btn.setAttribute('aria-label',displayName+' · '+key);
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
      // gated / learned skills
      cometClaw: '☄️', tidalBite: '🦷', thornLash: '🌵', frostLance: '❄️',
      voltRush: '🏃', apexPounce: '🐆', moonfang: '🌝', veteranStrike: '⚔️',
      purrNova: '💥', tenderPaw: '🫶',
    };
    return byId[sk.id] || this.elemIcon(sk.element);
  }

  buildTeamSlots() {
    const b=this.battle,host=document.getElementById('team-slots');
    const bench=document.getElementById('bench-slots');
    if(!b||!host)return;
    const en=window.MorrowwishI18n?.get?.()!=='zh';
    host.innerHTML='';
    b.team.forEach((f,i)=>{
      const el=document.createElement('button');
      el.type='button';el.className='team-slot';
      el.innerHTML='<span class="slot-key"></span><canvas width="140" height="116" aria-hidden="true"></canvas><span class="slot-name"></span><div class="slot-hp"><span></span></div><span class="slot-hp-value"></span><div class="slot-ult"><span></span></div>';
      el.querySelector('.slot-key').textContent=f._reinforcement?'★':String(i+1);
      el.querySelector('.slot-name').textContent=State.catName(f.cat);
      el.title=en?'Tap to control '+State.catName(f.cat):'点击控制 '+State.catName(f.cat);
      el.setAttribute('aria-label',el.title);
      host.appendChild(el);
      CatArt.renderCatThumb(el.querySelector('canvas'),GameData.speciesById(f.cat.species));
      el.addEventListener('click',()=>{b.switchTo(i);this.updateBattleUI();});
    });
    if(!bench)return;
    bench.innerHTML='';
    if(!b.reserve.length){bench.hidden=true;return;}
    bench.hidden=false;
    const label=document.createElement('button');label.className='bench-caption';
    label.type='button';label.textContent=en?'SWAP':'替补';
    label.title=en?'Show or hide reserve cats':'展开或收起替补猫咪';
    label.setAttribute('aria-label',label.title);
    // In short landscape, showing all three reserves permanently covers the
    // fighter at its normal left-side spawn point. The toggle remains visible.
    const compact=this.isTouch&&this.H<470&&this.W>this.H;
    bench.classList.toggle('is-open',!compact);
    label.setAttribute('aria-expanded',String(!compact));
    label.addEventListener('click',()=>{
      const expanded=bench.classList.toggle('is-open');
      label.setAttribute('aria-expanded',String(expanded));
    });
    bench.appendChild(label);
    b.reserve.forEach((cat,i)=>{
      const btn=document.createElement('button');btn.type='button';
      btn.className='bench-slot';btn.title=(en?'Swap active cat with ':'替换当前出战猫：')+State.catName(cat);
      btn.setAttribute('aria-label',btn.title);
      btn.innerHTML='<span class="bench-number"></span><canvas width="88" height="78" aria-hidden="true"></canvas><span class="bench-health"></span>';
      btn.querySelector('.bench-number').textContent=String(i+1);
      btn.dataset.benchIndex=String(i);
      CatArt.renderCatThumb(btn.querySelector('canvas'),GameData.speciesById(cat.species));
      bench.appendChild(btn);
      btn.addEventListener('click',()=>b.rotateReserve(i));
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
    const lock=document.getElementById('mv-lock');
    if(lock){
      const en=window.MorrowwishI18n?.get?.()!=='zh';
      const chosen=this.battle?.lockedEnemy?.();
      lock.classList.toggle('locked',manual&&!!chosen);
      lock.setAttribute('aria-pressed',String(manual&&!!chosen));
      lock.setAttribute('aria-label',en?'Lock next wild cat':'切换锁定的野猫');
      const name=lock.querySelector('.mv-name');if(name)name.textContent=en?'Lock':'锁定';
      const hint=lock.querySelector('.mv-k');if(hint)hint.textContent=en?'Next':'切换';
    }
    const pad=document.getElementById('battle-touch-joystick');
    if(pad){
      const label=pad.querySelector('.battle-touch-label');
      if(label)label.textContent=window.MorrowwishI18n?.get?.()==='zh'?'移动':'Move';
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

  showFirstManualTutorial(){
    if(!this.battle||this.battle.autoMode||!this.battle.coach||State.S.battlePrefs?.manualTutorialSeen)return;
    this.battleTutorial={step:0,auto:false};this.setBattleHelpVisible(true);
  }
  renderBattleHelp(){
    const host=document.getElementById('battle-help-body');
    if(!host)return;
    const en=window.MorrowwishI18n?.get?.()!=='zh';
    if(this.battleTutorial){
      const flow=this.battleTutorial;
      const stages=flow.auto
        ?(en?[
          ['Auto battle','The cats move, aim, attack, use skills, and dodge for you.'],
          ['You can still command','Tap a cat portrait to switch; tap Auto at the top to take manual control.']
        ]:[
          ['自动战斗','小猫会自动移动、瞄准、攻击、释放技能并闪避。'],
          ['随时可以接管','点猫咪头像切换操控对象；点顶部的「自动战斗」可切换手动。']
        ])
        :(en?[
          ['1 · Meet your team','Two cats fight together. Empty the wild cats’ spirit bars to befriend them. Set the starting pair and reserve order before battle.',
            'Tap a cat portrait to control it; tap a reserve to swap in (6s cooldown).',
            'Click a cat portrait or press 1 / 2 to switch. Reserves can be tapped too.'],
          ['2 · Move and aim','You directly control one cat; the partner helps with attacks.',
            'Drag on the LEFT side to move. Tap a wild cat to lock on, or press Lock to cycle targets.',
            'Move with WASD / arrow keys. Aim with your mouse; Tab locks the next target.'],
          ['3 · Attack, skill, dodge','Every action below is available immediately in manual combat.',
            'Hold the RIGHT half to attack. The paw button toggles continuous claws. Tap Skill 1 / 2, Dodge and Ultimate on the right.',
            'Hold left mouse / J to attack; Q / E use skills; Space dodges; R casts Ultimate.'],
          ['4 · Unleash your duo','At 20 trust your pair unlocks a duo move. 60 brings crossed claws, and 90 unlocks a finishing frenzy.',
            'When the Duo button lights up, tap it. Auto mode can be toggled at the top anytime.',
            'Press F for Duo when ready, P to toggle auto, 1 / 2 to switch active cats.']
        ]:[
          ['1 · 认识双猫队伍','两只猫并肩出战，把野猫的斗志打空即可收服；开战前可以指定首发与替补顺序。',
            '点击猫咪头像切换操控对象；点替补头像换猫（冷却 6 秒）。',
            '点击猫咪头像或按 1 / 2 换猫，也可点替补头像换上场。'],
          ['2 · 移动和锁定','你亲自操控一只猫，另一只会协助战斗。',
            '在画面左侧按住拖动移动；点野猫即可锁定目标，或按「锁定」切换。',
            'WASD / 方向键移动；鼠标瞄准；Tab 切换锁定目标。'],
          ['3 · 普攻、技能与闪避','所有操作都在同一个战斗界面中，不需要切换页面。',
            '按住右半边攻击；点猫爪按钮可开启/暂停持续攻击。点右侧技能一、技能二、闪避和必杀。',
            '按住鼠标左键或 J 攻击；Q / E 放技能；空格闪避；R 放必杀。'],
          ['4 · 双猫合击','默契达到 20 解锁合击，60 解锁交叉挥爪，90 解锁终结连斩。',
            '合击按钮亮起后点击释放；顶部可随时切换自动战斗。',
            '合击蓄满后按 F；P 切换自动模式；1 / 2 换操控猫咪。']
        ]);
      const step=Math.min(flow.step,stages.length-1);
      const title=document.getElementById('battle-help-title');
      if(title)title.textContent=en?'Your first battle · '+(step+1)+'/'+stages.length
        :'第一次战斗 · '+(step+1)+'/'+stages.length;
      const [heading,desc,phone,computer]=stages[step];
      const deviceInfo=phone?'<div class="battle-device-guide">'+
        '<div class="battle-device-item '+(this.isTouch?'preferred':'')+'"><strong>'+(en?'Phone / touch':'手机 / 触屏')+'</strong><p>'+phone+'</p></div>'+
        '<div class="battle-device-item '+(!this.isTouch?'preferred':'')+'"><strong>'+(en?'Computer / keyboard':'电脑 / 键鼠')+'</strong><p>'+computer+'</p></div></div>':'';
      host.innerHTML='<div class="battle-tutorial-progress" aria-hidden="true">'+
        stages.map((_,i)=>'<span class="'+(i<=step?'filled':'')+'"></span>').join('')+
        '</div><section class="battle-help-section preferred battle-tutorial-step"><b>'+
        heading+'</b><p>'+desc+'</p></section>'+deviceInfo+'<p class="battle-help-note">'+
        (en?'The battle is paused while you learn.':'教学期间战斗暂停，不会突然受到攻击。')+
        '</p><button id="battle-tutorial-skip" type="button" class="battle-tutorial-skip">'+
        (en?'Skip tutorial':'跳过教学')+'</button>';
      host.querySelector('#battle-tutorial-skip').onclick=()=>this.completeBattleTutorial(true);
      const btn=document.getElementById('battle-help-start');
      if(btn)btn.textContent=step===stages.length-1?(en?(flow.auto?'Start fighting!':'Start practice'):(flow.auto?'开始战斗！':'开始练习'))
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
    const count=this.battleTutorial.auto?2:4;
    if(this.battleTutorial.step+1>=count){this.completeBattleTutorial();return;}
    this.battleTutorial.step++;
    this.renderBattleHelp();
  }
  completeBattleTutorial(skipCoach=false){
    if(!this.battleTutorial)return;
    const manual=!this.battleTutorial.auto;
    this.battleTutorial=null;
    State.S.battlePrefs=State.S.battlePrefs||{};
    if(!manual||skipCoach){
      State.S.battlePrefs.tutorialSeen=true;
      if(manual){
        State.S.battlePrefs.manualTutorialSeen=true;
        if(this.battle){this.battle.coach=null;this.battle._coachHighlight=null;}
        window.arcadeMetric?.('bond_tutorial_skip',{mode:'manual'});
      }
      State.save();
    }
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
    document.getElementById('ult-btn').classList.toggle('ready',b.canUltimate());
    const ultLabel=document.querySelector('#ult-wrap .ult-label');
    if(ultLabel){
      const en=window.MorrowwishI18n?.get?.()!=='zh';
      const label=b.ultCd>0?(en?'Cooldown '+Math.ceil(b.ultCd)+'s':'冷却 '+Math.ceil(b.ultCd)+'秒'):(en?'Ultimate':'必杀');
      if(ultLabel.textContent!==label)ultLabel.textContent=label;
    }
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
        const zh=window.MorrowwishI18n?.get?.()==='zh';
        const channeling=(b.duoField?.remaining||0)>0;
        duoButton.disabled=channeling||!b.duoReady();
        duoButton.classList.toggle('ready',!channeling&&b.duoReady());
        duoButton.classList.toggle('duo-channeling',channeling);
        const duoLabel=duoButton.querySelector('.duo-burst-label')||duoButton;
        duoButton.style.setProperty('--duo-charge',Math.max(0,Math.min(100,b.duoCharge))+'%');
        if(channeling){
          // One compact in-world ultimate button, not a new obstruction.
          duoLabel.textContent='✦ '+(zh?'共鸣持续 ':'Resonance ')+
            b.duoField.remaining.toFixed(1)+(zh?'秒':'s');
        }else{
          duoLabel.textContent=b.duoReady()
            ?'💞 '+(zh?'双猫合击 · ':'Duo Ultimate · ')+b.duo.name+'！'
            :'💞 '+(zh?'双猫合击 · ':'Duo Ultimate · ')+Math.floor(b.duoCharge)+'%';
          duoButton.setAttribute('aria-label',
            zh?'双猫合击，当前充能'+Math.floor(b.duoCharge)+'%，快捷键 F'
              :'Duo ultimate, '+Math.floor(b.duoCharge)+'% charged, shortcut F');
          duoButton.title=zh?'双猫合击 · 充能达到100%后释放（电脑F键）'
            :'Duo Ultimate · Cast at 100% charge (F on desktop)';
        }
      }
    }
    // move cooldowns; refresh labels if active cat changed
    const f = b.me();
    if (this._lastActiveIdx !== b.active) { this._lastActiveIdx = b.active; this.updateSkillLabels(); }
    this.renderCd('mv-basic', f.cd.basic);
    this.renderCd('mv-q', f.cd.q);
    this.renderCd('mv-e', f.cd.e);
    this.renderCd('mv-dodge', f.dodgeCd);
    this.renderCd('ult-btn', b.ultCd);
    // Keep the coached controls visible in-game AFTER the paused preflight lesson.
    const coachCard=document.getElementById('battle-coach-card');
    if(coachCard){
      const coach=b.coach,step=coach?.steps?.[coach.i];
      coachCard.hidden=!step||this.battleHelpOpen;
      if(step){
        const chinese=window.MorrowwishI18n?.get?.()==='zh';
        coachCard.textContent=(chinese?'操作练习 ':'Practice ')+(coach.i+1)+'/'+coach.steps.length+' · '+(chinese?step.zh:step.en);
      }
    }
    // team slots: hp + active highlight
    const host = document.getElementById('team-slots');
    if (host) [...host.children].forEach((el, i) => {
      const fi = b.team[i];
      el.classList.toggle('active', i === b.active);
      el.classList.toggle('fainted', !fi.alive);
      const frac = fi.hp / fi.maxhp;
      const hp = el.querySelector('.slot-hp > span');
      if (hp) {
        hp.style.width = (frac * 100) + '%';
        // HP colour shifts green→amber→red; low HP pulses so danger reads instantly.
        hp.style.background = frac > 0.5 ? '#7ee787' : frac > 0.25 ? '#ffd36b' : '#ff6b6b';
      }
      el.classList.toggle('low-hp', fi.alive && frac <= 0.25);
      const value=el.querySelector('.slot-hp-value');
      if(value)value.textContent=Math.ceil(fi.hp)+' / '+fi.maxhp;
      // the ult meter is a SHARED team resource — show the same fill on every
      // slot so it's clear any cat can spend it, not just the active one.
      const ult = el.querySelector('.slot-ult > span');
      if (ult) ult.style.width = (fi.alive ? b.ult : 0) + '%';
      el.classList.toggle('ult-ready', fi.alive && b.ult >= 100);
    });
    const bench=document.getElementById('bench-slots');
    if(bench)bench.querySelectorAll('.bench-slot').forEach((el,i)=>{
      const cat=b.reserve[i],f=cat&&b._benchFighters?.get(cat.uid);
      const hp=f?Math.max(0,Math.round(f.hp/f.maxhp*100)):(cat?Math.round((cat._hpFrac??1)*100):100);
      const label=el.querySelector('.bench-health');if(label)label.textContent=hp+'%';
      el.classList.toggle('cooling',Date.now()<(b.reserveSwapReadyAt||0));
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
    if (!b) return;
    window.MorrowwishMusic?.switchScene?.('yard');                 // already ended (loop may call this once on finish)
    const win = b.result === 'win';
    const fromMap = this._returnScene === 'map';
    // Fold this battle's observations into the persistent adaptive-AI profile so
    // enemies evolve to the player's habits over time. (Save happens below.)
    try { b.commitAiProfile(win); } catch (e) {}
    // ROGUELIKE ATTRITION: on an EXPLORE win, each field cat carries its wounds to
    // the next battle, healing only HALF the HP it lost (not a full refill). Stored
    // as cat._hpFrac, read by makeFighter next fight. Any other exit (yard fight,
    // loss, flee) clears it so those start fresh.
    try {
      if (win && fromMap && Array.isArray(b.team)) {
        for (const f of [...b.team,...(b._benchFighters?.values()||[])]) {
          if (!f || !f.cat || f._reinforcement) continue;   // temp reinforcements don't persist
          const frac = f.alive ? Math.max(0, Math.min(1, f.hp / f.maxhp)) : 0.15;
          f.cat._hpFrac = frac + (1 - frac) * 0.5;           // heal half the lost HP
        }
      } else {
        for (const c of State.S.cats) if (c && c._hpFrac != null) delete c._hpFrac;
      }
    } catch (e) {}
    document.getElementById('battle-ui').classList.remove('on');
    const duoButton=document.getElementById('duo-burst');if(duoButton)duoButton.hidden=true;
    this.setBattleHelpVisible(false);
    // return to wherever we came from (yard normally, overworld region if exploring)
    const backToMap = this._returnScene === 'map' && window.WorldMap;
    this._returnScene = null;
    if (backToMap) {
      this.scene = 'map';
      document.body.classList.add('cb-exploring');
      // Resume the region at the exact spot the player left for the fight, instead
      // of rebuilding it and snapping back to the portal entry. Pass the outcome so
      // a captured (won) cat is removed from the map; a fled/lost one resumes roaming.
      if (WorldMap.resumeRegion) WorldMap.resumeRegion(win);
      else WorldMap.enterRegion(WorldMap.currentRegion);
    } else {
      this.scene = 'yard';
      // Reset transient battlefield paint state before the very next yard frame.
      this.ctx.globalAlpha=1;
      this.ctx.globalCompositeOperation='source-over';
      this.ctx.filter='none';
      this.ctx.shadowBlur=0;
      this.ctx.setLineDash([]);
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
        State.S.fish+=2;
        metric('bond_repeat_reunion',{species:b.wild.id,owned:sameBreed.length});
      }
      State.S.dex[b.wild.id] = (State.S.dex[b.wild.id] || 0) + 1;
      State.S.catchCount++;
      const milestoneRewards=this.grantCollectionMilestones();
      const performance=this.gradeBattle(b);
      const masteryReward=this.recordBattleMastery(b.wild,performance,newCat);
      State.S.coins+=performance.bonusCoins;
      State.S.fish+=performance.bonusFish;
      // reward: partner gains affinity, coins
      const skillsBefore=new Set(window.Skills?.learnableSkills(b.partner).map(sk=>sk.id)||[]);
      b.partner.affinity = Math.min(100, b.partner.affinity + 6);
      // BATTLE XP: winning grants level-scaled XP (by enemy difficulty: rarity +
      // wild level), SPLIT among the cats that actually fought (the field squad).
      // This is the ONLY XP source now — 撸猫 no longer levels cats.
      {
        const rIdx = ['N','R','SR','SSR'].indexOf(b.wild.rarity);
        const base = 30 + (b.wildLevel||1) * 6 + rIdx * 20;   // tougher/higher = more XP
        // Record every cat that ACTUALLY entered battle, including reserves
        // that were swapped out. Unused bench cats do not get phantom XP.
        const participants=[...(b.team||[]),...(b._benchFighters?.values?.()||[])];
        const squad=participants.filter(f=>f&&f.cat).map(f=>f.cat);
        const uniq=[...new Map(squad.map(c=>[c.uid,c])).values()];
        const share=Math.max(10,Math.round(base/Math.max(1,uniq.length)));
        const leveled=[];
        for(const c of uniq){
          const before=c.level;
          State.addXp(c,share);
          if(c.level>before)leveled.push({name:State.catName(c),level:c.level});
        }
        this._battleXp={total:share*uniq.length,each:share,n:uniq.length,leveled};
        // A win on the field advances each squad cat's personal 战斗 counter, which
        // feeds the "百战斩" 领悟 skill-learning quest. Auto-learn any newly met
        // pure-gate (level/affinity/species/quest) skills so the loadout stays legal.
        for (const c of uniq) {
          c.battlesWon = (c.battlesWon || 0) + 1;
          const fresh = window.Skills?.autoLearn?.(c) || [];
          for (const sk of fresh) {
            metric('bond_skill_learned', { skill: sk.id, via: 'quest', breed: c.species });
          }
        }
      }
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
    // Only two currencies remain: 🪙 coins and 🐠 fish. The old 🐟 treats / 🧶 yarn
    // pills were removed from the HUD, so guard those lookups defensively.
    const coinsEl = document.getElementById('coins');
    if (coinsEl) coinsEl.textContent = State.S.coins;
    const fishEl = document.getElementById('fish');
    if (fishEl) fishEl.textContent = State.S.fish;
    const dailyBtn = document.getElementById('daily-dot');
    if (dailyBtn) dailyBtn.classList.toggle('hidden', !State.dailyAvailable());
    this.refreshCollectionGoal();
    this.refreshYardSurprise();
  }

  toast(msg) {
    const wrap = document.getElementById('toasts');if(!wrap)return;
    const battle=this.scene==='battle',message=String(msg);
    if(battle){
      // Ordinary attack/skill/chain messages have their own animations and
      // counters. Repeating each name as a toast hid the cats and hit points.
      const routine=/技能[:：]|[Ss]kill[:：]|毛球散射|疾扑冲刺|连击|[Cc]ombo|连携|[Cc]hain|效果一般|效果拔群|Skill activated/i.test(message);
      const important=/⚠|[Dd]anger|危险|必杀|[Uu]ltimate|切换|[Ss]witch|自动战斗|智能自动|[Mm]anual|[Aa]uto battle|斗志耗尽|倒下/.test(message);
      if(routine&&!important)return;
      const now=performance.now();
      if(!important&&now-(this._lastCombatNoticeAt||0)<950)return;
      this._lastCombatNoticeAt=now;
      wrap.replaceChildren(); // never stack battle text across the battlefield
    }
    const el=document.createElement('div');
    el.className=battle?'toast toast-battle':'toast';
    el.textContent=message;wrap.appendChild(el);
    setTimeout(()=>{if(el.isConnected){el.style.opacity='0';el.style.transition='opacity .35s';}},battle?850:1600);
    setTimeout(()=>el.remove(),battle?1250:2100);
  }
}

window.Game = Game;
