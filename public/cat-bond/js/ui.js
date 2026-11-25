// ui.js — all overlay panels & menus. Talks to State + Game.

const UI = {
  game: null,
  openCatUid: null,
  _navStack: [],
  _navCurrent: null,
  levelText(level){return (window.MorrowwishI18n?.get?.()==='zh'?'等级 ':'Lv.')+level;},

  init(game) {
    this.game = game;
    document.getElementById('guide-help')?.addEventListener('click',()=>this.game?.replayFirstAdventureTour?.());
    // tab bar
    document.querySelectorAll('.tab').forEach(btn => {
      btn.addEventListener('click', () => this.onTab(btn.dataset.tab));
    });
    // yard FABs
    document.getElementById('fab-seek').addEventListener('click', () => {
      if(this.game.scene!=='yard')return;
      if(this.game.yard.hide){
        this.game.toast(window.MorrowwishI18n?.get?.()==='zh'
          ?'野猫已经藏在草丛里了，慢慢找吧！':'A wild cat is already hiding in the grass!');
        return;
      }
      this.game.yard.startHideAndSeek();
      window.arcadeMetric?.('bond_manual_seek');
    });
    document.getElementById('fab-feed').addEventListener('click', () => this.openFeed());
    document.getElementById('fab-play').addEventListener('click', () => this.openTease());
    document.getElementById('fab-build')?.addEventListener('click', () => { if (this.game.scene === 'yard') this.openBuild(); });
    const fabMap = document.getElementById('fab-map');
    if (fabMap) fabMap.addEventListener('click', () => { if (this.game.scene === 'yard') this.game.openWorldMap(); });
    // battle buttons
    document.getElementById('btn-flee').addEventListener('click', () => {
      if (this.game.battle) { this.game.battle.finish(false); }
    });
    const helpButton=document.getElementById('battle-help-toggle');
    if(helpButton)helpButton.addEventListener('click',()=>{
      this.game.setBattleHelpVisible(!this.game.battleHelpOpen);
    });
    document.getElementById('battle-help-close')?.addEventListener('click',()=>{
      if(this.game.battleTutorial)this.game.completeBattleTutorial(true);
      else this.game.setBattleHelpVisible(false);
    });
    document.getElementById('battle-help-start')?.addEventListener('click',()=>{
      if(this.game.battleTutorial)this.game.advanceBattleTutorial();
      else this.game.setBattleHelpVisible(false);
    });
    document.getElementById('btn-auto').addEventListener('click', () => {
      if (!this.game.battle) return;
      const on = this.game.battle.toggleAuto();
      if(this.game.isTouch&&!on)this.game.touchAutoFire=true;
      this.game.syncBattleModeUI();
      window.arcadeMetric?.('bond_auto_mode',{enabled:on});
    });
    // DEBUG 🐛 record button — only functional/visible when ?debug=1. First click: start recording
    // this fight's damage breakdown. Click again while a log exists (same or ended fight): copy it
    // to the clipboard (+ console) for export. Never shown to normal players (stays hidden).
    const dbgBtn=document.getElementById('btn-debug');
    if(dbgBtn)dbgBtn.addEventListener('click',()=>{
      const b=this.game.battle; if(!b||!b._debugAvailable)return;
      // If we already have a captured log (recording was on and/or fight ended), this click EXPORTS it.
      if(b._dbgLog&&b._dbgLog.length&&(!b._debug||b.done)){
        if(b.copyDebugLog())this.game.toast?.('🐛 战斗日志已复制到剪贴板');
        return;
      }
      const on=b.toggleDebugRecord();
      dbgBtn.setAttribute('aria-pressed',String(on));
      dbgBtn.classList.toggle('is-active',on);
      this.game.toast?.(on?'🐛 开始记录本场伤害明细':'🐛 停止记录');
    });
    const placementCancel=document.getElementById('yard-placement-cancel');
    if(placementCancel)placementCancel.addEventListener('click',()=>this.cancelBuildingPlacement());
    this.syncYardNav();
    window.addEventListener('morrowwish-language-change',()=>{
      this.syncYardNav();
      this.updateBuildingPlacement();
      // Many panel headings are generated from en?zh:en branches, not
      // dictionary-backed Chinese originals. The DOM translator can reverse
      // existing Chinese text, but it cannot know how to translate native
      // English UI labels into Chinese. Rebuild safe, open panels in place.
      setTimeout(()=>this.refreshOpenPanelLocale(),0);
    });
    const journey=document.getElementById('collection-goal');
    if(journey)journey.addEventListener('click',()=>this.openJourney());
    document.getElementById('yard-surprise')?.addEventListener('click',()=>this.openYardSurprise());
    document.getElementById('yard-duo-status')?.addEventListener('click',()=>{
      const pending=window.CatRelations?.unresolved?.()[0];
      if(pending)this.openDuoQuarrel(pending.a,pending.b);
      else this.openBondPanel();
    });
    document.getElementById('map-index')?.addEventListener('click',()=>this.openMapChooser());
    document.getElementById('map-squad')?.addEventListener('click',()=>this.openMapSquad());
    document.getElementById('map-menu')?.addEventListener('click',()=>this.openExploreMenu());
    document.getElementById('duo-burst')?.addEventListener('click',()=>this.game.battle?.castDuo());
    // Hover/focus explains the exact active cat's move. On touch, the
    // standalone info control displays descriptions without casting.
    document.querySelectorAll('.move-bar .move').forEach(btn=>{
      const slot=btn.dataset.move==='ult'?'ult':btn.dataset.move;
      btn.addEventListener('mouseenter',()=>this.game.showBattleSkillTooltip(slot));
      btn.addEventListener('mouseleave',()=>this.game.hideBattleSkillTooltip(slot));
      btn.addEventListener('focus',()=>this.game.showBattleSkillTooltip(slot));
      btn.addEventListener('blur',()=>this.game.hideBattleSkillTooltip(slot));
    });
    document.getElementById('battle-skill-info-toggle')?.addEventListener('click',()=>this.game.toggleBattleSkillGuide());
    document.getElementById('battle-skill-guide-close')?.addEventListener('click',()=>this.game.toggleBattleSkillGuide(false));
    // move-bar buttons (also usable by touch / clicking)
    document.querySelectorAll('.move-bar .move').forEach(btn => {
      btn.addEventListener('click', () => {
        const b = this.game.battle; if (!b || this.game.battleHelpOpen) return;
        const m = btn.dataset.move;
        if(m==='lock'){
          b.cycleTarget();
          this.game.syncTouchBattleUI();
          return;
        }
        if(m==='basic'&&this.game.isTouch&&!b.autoMode){
          this.game.touchAutoFire=!this.game.touchAutoFire;
          this.game.syncTouchBattleUI();
          return;
        }
        if (m === 'dodge') b.dodge(); else b.castMove(m);
      });
    });
    if(!document.getElementById('battle-touch-joystick')){
      const pad=document.createElement('div');
      pad.id='battle-touch-joystick';
      pad.setAttribute('aria-hidden','true');
      pad.innerHTML='<div class="battle-touch-nub"></div><span class="battle-touch-label">移动</span>';
      document.getElementById('battle-ui')?.append(pad);
    }
    // Generic close and keyboard fallback. The mobile close button is OUTSIDE
    // the scrollable card so it never disappears when the player scrolls.
    document.body.addEventListener('click', e => {
      if (e.target.closest?.('.card-close,.panel-bg,.panel-dismiss')) {
        if(document.getElementById('panel')?.dataset.mandatory!=='true')this.closeAll();
      }
    });
    document.addEventListener('keydown', e => {
      if(e.key==='Escape' && document.getElementById('panel')?.classList.contains('open') &&
        document.getElementById('panel')?.dataset.mandatory!=='true'){
        this.closeAll();
      }
    });
  },

  isEnglish(){return window.MorrowwishI18n?.get?.()!=='zh';},
  syncYardNav(){
    const en=this.isEnglish();
    const tabCats=document.querySelector('[data-tab="cats"] .nav-caption');
    const tabWork=document.querySelector('[data-tab="work"] .nav-caption');
    if(tabCats)tabCats.textContent=en?'Cats':'猫咪';
    if(tabWork)tabWork.textContent=en?'Workshop':'工坊';
  },
  refreshOpenPanelLocale(){
    const panel=document.getElementById('panel');
    const route=this._localePanelRoute;
    if(!panel?.classList.contains('open')||!route||this._localePanelRerendering)return;
    if(typeof this[route.method]!=='function')return;
    // Don't restart a running feather-catch minigame just to relabel it.
    if(route.method==='openTease'){
      const en=this.isEnglish();
      const cat=route.args[0]||State.S.cats[0];
      const title=panel.querySelector('.card h2');
      const desc=panel.querySelector('.card p.sub');
      const score=panel.querySelector('#tz-score')?.parentElement;
      const finish=panel.querySelector('#tz-done');
      if(title)title.textContent=en?'Cat Teaser 🪶':'逗猫 🪶';
      if(desc&&cat){
        const name=GameData.speciesName(cat.species);
        desc.textContent=en
          ?'Tap the feather toy and help '+name+' catch it. More catches improve affection and mood.'
          :'点击逗猫棒，让 '+name+' 扑抓！抓中越多，好感与心情涨得越快。';
      }
      if(score?.firstChild)score.firstChild.textContent=en?'Score ':'得分 ';
      if(finish)finish.textContent=en?'Finish':'结束';
      return;
    }
    // Preserve UNSAVED battle choices across language toggles. Rebuilding
    // pre-battle cards from persisted preferences otherwise drops the squad,
    // order and auto/manual choice the player just selected.
    this._localePanelRerenderTeam=panel.querySelector('.map-squad-roster')
      ?[...(this._localeLiveTeamSelection||[])]:panel.querySelector('#cp-roster')
        ?[...(this.teamUids||[])]:null;
    const activeMode=panel.querySelector('.capture-mode-option[data-battle-auto][aria-checked="true"]');
    this._localePanelRerenderAuto=activeMode
      ?activeMode.dataset.battleAuto==='true':null;
    const scrollTop=panel.scrollTop;
    const card=panel.querySelector(':scope > .card');
    const cardTop=card?.scrollTop||0;
    const details=[...panel.querySelectorAll('details')].map((d,i)=>({
      id:d.id,index:i,open:d.open
    }));
    const stack=this._navStack.slice(),current=this._navCurrent;
    this._localePanelRerendering=true;
    try{
      this[route.method](...route.args);
      this._navStack=stack;this._navCurrent=current;
      const next=document.getElementById('panel');
      details.forEach(({id,index,open})=>{
        const item=(id?next.querySelector('#'+CSS.escape(id)):null)
          ||next.querySelectorAll('details')[index];
        if(item)item.open=open;
      });
      const nextCard=next.querySelector(':scope > .card');
      if(nextCard)nextCard.scrollTop=cardTop;
      next.scrollTop=scrollTop;
    }catch(error){console.warn('Cat Bond locale panel refresh failed',error)}
    finally{
      this._navStack=stack;this._navCurrent=current;
      this._localePanelRerendering=false;
      this._localePanelRerenderTeam=null;
      this._localePanelRerenderAuto=null;
    }
  },
  startBuildingPlacement(type){
    const en=this.isEnglish();
    if(!this.game?.yard?.beginPlacement?.(type)){
      this.game.toast(en?'Not enough coins or no free spot':'金币不足或暂无空地');
      return false;
    }
    // Close the build list; player chooses the actual garden ground.
    this.closeAll();
    this.game._yardPlacementTouchId=null;
    document.getElementById('yard-placement-dock').hidden=false;
    document.body.classList.add('cb-placing-building');
    this.updateBuildingPlacement();
    window.arcadeMetric?.('bond_yard_placement_preview',{type});
    return true;
  },
  updateBuildingPlacement(){
    const p=this.game?.yard?.placement;
    const status=document.getElementById('yard-placement-status');
    if(!status)return;
    if(!p){
      document.getElementById('yard-placement-dock').hidden=true;
      document.body.classList.remove('cb-placing-building');
      return;
    }
    const en=this.isEnglish(),def=World.BUILDINGS_BY_ID[p.type];
    const name=en?(World.BUILDING_PRODUCTION?.[p.type]?.nameEn||def?.name||'Structure'):(def?.name||'设施');
    const compact=window.matchMedia?.('(max-width:700px), (pointer:coarse)')?.matches;
    // One tap/click builds immediately; a touch drag can adjust until release.
    status.textContent=compact
      ?(name+(en?' · Tap to build / drag to move':' · 轻触即建造／拖动选位置')+
        (p.valid?(en?' · ✓ Free spot':' · ✓ 可建造'):(en?' · × Blocked':' · × 有遮挡')))
      :(name+(en?' · Click grass to build':' · 点击草坪直接建造')+
        (p.valid?(en?' · ✓ Ready':' · ✓ 可建造'):(en?' · × Blocked':' · × 有遮挡')));
    document.getElementById('yard-placement-cancel').textContent=en?'Cancel':'取消';
  },
  confirmBuildingPlacement(){
    const en=this.isEnglish(),p=this.game?.yard?.placement;
    if(!p||!p.valid)return false;
    const name=World.BUILDINGS_BY_ID[p.type]?.name||p.type;
    if(!this.game.yard.confirmPlacement()){
      this.updateBuildingPlacement();
      this.game.toast(en?'Cannot build here':'此处无法建造');
      return false;
    }
    this.updateBuildingPlacement();
    this.game.refreshHUD();
    this.game.toast(en?'Placed '+name+' · watch your cats play!':'已建造 '+name+' · 看猫猫过来玩！');
    window.MorrowwishAudio?.effect?.('discover');
    return true;
  },
  cancelBuildingPlacement(){
    if(this.game)this.game._yardPlacementTouchId=null;
    this.game?.yard?.cancelPlacement?.();
    this.updateBuildingPlacement();
  },

  onTab(tab) {
    this.resetNavigation();
    // if we're out in the overworld map, any tab click returns to the yard first
    if (this.game.scene === 'map') {
      this.game.scene = 'yard';
      this.game.showYardChrome();
    }
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    if (tab === 'yard') { this.closeAll(); }
    else if (tab === 'cats') {
      const tour=this.game?.firstAdventureTour?.();
      this.openCatHub(tour&&!tour.done&&!tour.skipped&&tour.step===1?'duo':'solo');
    }
    else if (tab === 'work') this.openWorkshop();
    else if (tab === 'dex') this.openDex();
    else if (tab === 'daily') this.openDaily();
    else if (tab === 'shop') this.openShop();
    if(tab!=='yard')this._navCurrent=()=>this.onTab(tab);
  },


  openCatHub(view='solo'){
    if(view==='duo'){
      const pending=window.CatRelations?.unresolved?.()[0];
      this.openBondPanel(!!pending);
    }else this.openRoster();
    document.querySelectorAll('#tabbar .tab').forEach(t=>t.classList.toggle('active',t.dataset.tab==='cats'));
  },
  catHubTabs(view){
    const card=document.querySelector('#panel>.card');
    if(!card||card.querySelector('.cat-hub-tabs'))return;
    const en=this.isEnglish();
    card.insertAdjacentHTML('afterbegin',
      '<nav class="cat-hub-tabs" role="tablist" aria-label="'+(en?'Cat collection':'猫咪管理')+'">'+
      '<button type="button" role="tab" data-cat-view="solo" aria-selected="'+(view==='solo')+'">'+(en?'Single Cats':'单猫')+'</button>'+
      '<button type="button" role="tab" data-cat-view="duo" aria-selected="'+(view==='duo')+'">'+(en?'Cat Duos':'双猫')+'</button></nav>');
    card.querySelectorAll('[data-cat-view]').forEach(b=>b.onclick=()=>this.openCatHub(b.dataset.catView));
  },

  // Always fill the five expedition slots when enough cats are available.
  // Saved player choices keep their exact order and cat identities, including
  // Collapse a roster to ONE entry per species — the strongest (by catPower) of each breed — so the
  // battle-team picker + duo chooser don't list five copies of the same cat (owner: "战斗界面里每一种猫
  // 默认只显示战力最高的；选双猫羁绊也是"). `keepUids` (e.g. already-selected cats) are ALWAYS kept even
  // if a stronger same-breed sibling exists, so the player can still see/deselect a benched pick.
  // Preserves input order (input should already be power-sorted where ordering matters).
  strongestPerSpecies(cats, keepUids){
    const keep = keepUids instanceof Set ? keepUids : new Set(keepUids || []);
    const bestOf = new Map();                       // species -> strongest cat
    for (const c of cats) {
      const cur = bestOf.get(c.species);
      if (!cur || State.catPower(c) > State.catPower(cur)) bestOf.set(c.species, c);
    }
    const keptBest = new Set([...bestOf.values()].map(c => c.uid));
    return cats.filter(c => keptBest.has(c.uid) || keep.has(c.uid));
  },
  // two cats of the same breed. Both map and yard battles use this same roster;
  // unsaved/unselected cats may only fill genuinely empty expedition slots.
  getPreferredBattleTeam(eligibleCats=State.S.cats){
    if(this._localePanelRerendering&&Array.isArray(this._localePanelRerenderTeam)){
      const allowed=new Map((eligibleCats||[]).map(cat=>[cat.uid,cat]));
      const chosen=this._localePanelRerenderTeam.map(uid=>allowed.get(uid)).filter(Boolean);
      if(chosen.length)return chosen;
    }
    const cats=eligibleCats||[],byUid=new Map(cats.map(c=>[c.uid,c]));
    const savedIds=State.S.battlePrefs?.teamUids;
    const saved=(Array.isArray(savedIds)?savedIds:[]).map(uid=>byUid.get(uid)).filter(Boolean);
    const duo=window.CatRelations?.chosen?.()||[];
    const rest=[...cats].sort((a,b)=>State.catPower(b)-State.catPower(a));
    const seen=new Set();
    return [...saved,...duo,...rest].filter(c=>{
      if(!c||!byUid.has(c.uid)||seen.has(c.uid))return false;
      seen.add(c.uid);return true;
    }).slice(0,5);
  },
  // Explicit one-tap best team: strongest first, exactly two starters when
  // available, up to three reserves. Unlike the saved preferred lineup, this
  // intentionally ignores old picks and never silently replaces them.
  getStrongestBattleTeam(eligibleCats=State.S.cats){
    return [...(eligibleCats||[])].sort((a,b)=>
      State.catPower(b)-State.catPower(a)||
      (b.level||1)-(a.level||1)||
      String(a.uid).localeCompare(String(b.uid))).slice(0,5);
  },
  // Visible battle stats match CaptureBattle.makeFighter: a level raises stats,
  // and map attrition carries wounded HP into the NEXT fight. Do not show a
  // misleading full health bar for a tired survivor.
  battleCatFacts(cat){
    const sp=GameData.speciesById(cat.species)||{},s=cat.stats||{};
    const en=window.MorrowwishI18n?.get?.()!=='zh';
    const aff=Math.max(0,Math.min(100,cat.affinity||0));
    let mult=1+.15*((aff-50)/50);
    if(cat._deathPenaltyUntil&&Date.now()<cat._deathPenaltyUntil)mult*=.88;
    mult=Math.max(.80,Math.min(1.15,mult));
    // Keep this in sync with Battle.makeFighter (80 + VIT*8).
    const maxHp=Math.round((80+(s.vit||0)*8)*mult);
    const carried=State.catHpFraction?.(cat)??1;
    const hp=Math.round(maxHp*carried);
    const rarity=sp.rarity||'N';
    const r={N:en?'Common':'普通',R:en?'Rare':'稀有',
      SR:en?'Epic':'史诗',SSR:en?'Legendary':'传说'};
    const element=window.Skills?.elementOf?.(cat.species)||'light';
    const elements={
      fire:['🔥',en?'Fire':'火'],water:['💧',en?'Water':'水'],
      grass:['🌿',en?'Nature':'草'],elec:['⚡',en?'Lightning':'雷'],
      dark:['🌙',en?'Shadow':'暗'],light:['✨',en?'Light':'光']
    };
    const bond=window.Skills?.bondBonuses?.(
      window.Skills.bondTier?.(aff))||{dmgMult:1};
    // The battle's base damage and movement formulas, not invented
    // "defense" numbers (VIT affects max HP; there is no defense stat).
    const damage=(6+(s.pow||0)*.7)*(bond.dmgMult||1)*.62;
    const speed=120*(1+Math.min(.2,Math.max(0,s.agi||0)*.0035));
    return {level:cat.level||1,rarity,rarityName:r[rarity]||rarity,
      element,elementLabel:(elements[element]||['✨',''])[0]+' '+(elements[element]||['',''])[1],
      power:State.catPower(cat),pow:s.pow||0,agi:s.agi||0,vit:s.vit||0,cha:s.cha||0,
      damage:Math.round(damage*10)/10,speed:Math.round(speed*10)/10,
      hp,maxHp,hpPercent:maxHp?Math.round(hp/maxHp*100):100,
      affinity:Math.round(aff),wounded:carried<.99};
  },
  battleCatStatsMarkup(cat){
    const en=window.MorrowwishI18n?.get?.()!=='zh';
    const f=this.battleCatFacts(cat);
    return '<span class="squad-statline squad-statline-primary">'
      +'<span class="squad-level">Lv.'+f.level+'</span>'
      +'<span class="squad-rarity rarity-'+f.rarity+'">'+f.rarity+' · '+f.rarityName+'</span>'
      +'<span class="squad-element">'+f.elementLabel+'</span></span>'
      +'<span class="squad-statline squad-statline-secondary">'
      +'<span>'+(en?'Power ':'战力 ')+f.power+'</span>'
      +'<span>⚔ '+(en?'ATK ':'攻击 ')+f.pow+'</span>'
      +'<span>⚡ '+(en?'AGI ':'敏捷 ')+f.agi+'</span>'
      +'<span>❤ '+(en?'HP ':'生命 ')+f.hp+'/'+f.maxHp+'</span>'
      +'<span>'+(en?'Bond ':'亲密 ')+f.affinity+'</span></span>'
      +(f.wounded?'<span class="squad-health-warning">'+(en?'Injured · recovery recommended':'负伤 · 建议先恢复')+'</span>':'');
  },
  // Chosen first two start together; remaining chosen cats form an ordered bench.
  squadOrderMarkup(){
    return '<div class="battle-order" role="group"></div>';
  },
  refreshSquadOrder(selected,onReorder){
    const host=document.querySelector('#panel .battle-order');
    if(!host)return;
    const en=window.MorrowwishI18n?.get?.()!=='zh';
    const cats=new Map((State.S.cats||[]).map(c=>[c.uid,c]));
    const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const role=i=>i<2?(en?'START '+(i+1):'首发 '+(i+1)):(en?'BENCH '+(i-1):'替补 '+(i-1));
    host.innerHTML='<strong>'+(en?'Your lineup · reorder with arrows':'双猫首发与替补顺序')+'</strong>'
      +'<p>'+(en?'Use ↑ ↓ to change starting cats and reserves. Tap a cat below to add or remove it.':'用 ↑ ↓ 调整首发和替补顺序，点击下方猫咪可更换队员。')+'</p>'
      +'<div class="battle-order-items">'+selected.map((uid,i)=>{
        const cat=cats.get(uid),name=cat?State.catName(cat):uid;
        const facts=cat?this.battleCatFacts(cat):null;
        return '<div class="battle-order-item '+(i<2?'field':'bench')+'"><span class="battle-order-role">'+role(i)+'</span>'
          +'<span class="battle-order-name">'+esc(name)
          +(facts?'<small>Lv.'+facts.level+' · '+(en?'Power ':'战力 ')+facts.power+'</small>':'')+'</span>'
          +'<button type="button" data-order-shift="-1" data-order-index="'+i+'" '+(i===0?'disabled':'')+' aria-label="'+(en?'Move up':'上移')+'">↑</button>'
          +'<button type="button" data-order-shift="1" data-order-index="'+i+'" '+(i===selected.length-1?'disabled':'')+' aria-label="'+(en?'Move down':'下移')+'">↓</button></div>';
      }).join('')+'</div>';
    host.querySelectorAll('[data-order-shift]').forEach(btn=>{
      btn.onclick=()=>{
        const i=Number(btn.dataset.orderIndex),j=i+Number(btn.dataset.orderShift);
        if(j<0||j>=selected.length)return;
        [selected[i],selected[j]]=[selected[j],selected[i]];
        if(onReorder)onReorder();
        else this.refreshSquadOrder(selected,onReorder);
      };
    });
  },
  squadPickerMarkup(selected){
    const en=window.MorrowwishI18n?.get?.()!=='zh';
    const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    // One chip per breed — the strongest — plus any already-selected cat (so a benched same-breed pick
    // stays visible/deselectable). Power-sorted first so "strongest" + display order are consistent.
    const cats=this.strongestPerSpecies(
      [...(State.S.cats||[])].sort((a,b)=>State.catPower(b)-State.catPower(a)), selected);
    return this.squadOrderMarkup()
      +'<p class="map-squad-count" role="status">'+(en?'Selected ':'已选 ')+selected.length+' / 5'+(en?'':' 只')+'</p>'
      +'<div class="map-squad-roster" role="group" aria-label="'+(en?'Choose up to five cats':'选择最多五只猫咪')+'">'
      +cats.map(c=>'<button type="button" class="map-squad-choice '+(selected.includes(c.uid)?'sel':'')+'" data-uid="'+esc(c.uid)+'" aria-pressed="'+selected.includes(c.uid)+'">'
        +'<canvas width="58" height="50" aria-hidden="true"></canvas>'
        +'<span class="squad-cat-info"><strong>'+esc(State.catName(c))+'</strong>'
        +this.battleCatStatsMarkup(c)+'</span></button>').join('')
      +'</div>';
  },
  bindSquadPicker(selected){
    const en=window.MorrowwishI18n?.get?.()!=='zh',cats=State.S.cats||[];
    const host=document.querySelector('#panel .map-squad-roster');if(!host)return;
    const buttons=[...host.querySelectorAll('.map-squad-choice')];
    const refresh=()=>{
      this._localeLiveTeamSelection=[...selected];
      buttons.forEach(btn=>{
        const yes=selected.includes(btn.dataset.uid);
        btn.classList.toggle('sel',yes);btn.setAttribute('aria-pressed',String(yes));
        const order=selected.indexOf(btn.dataset.uid);
        btn.dataset.orderRole=order<0?'':(order<2?(en?'START '+(order+1):'首发 '+(order+1)):(en?'BENCH '+(order-1):'替补 '+(order-1)));
      });
      const count=document.querySelector('#panel .map-squad-count');
      if(count)count.textContent=(en?'Selected ':'已选 ')+selected.length+' / 5'+(en?'':' 只');
      this.refreshSquadOrder(selected,refresh);
      this.refreshBattlePrepSkills(selected.map(uid=>cats.find(c=>c.uid===uid)).filter(Boolean),en);
    };
    buttons.forEach(btn=>{
      const cat=cats.find(c=>c.uid===btn.dataset.uid);
      if(cat)CatArt.renderCatThumb(btn.querySelector('canvas'),GameData.speciesById(cat.species),cat);
      btn.onclick=()=>{
        const i=selected.indexOf(btn.dataset.uid);
        if(i>=0){if(selected.length>1)selected.splice(i,1);}
        else{if(selected.length>=5)selected[selected.length-1]=btn.dataset.uid;else selected.push(btn.dataset.uid);}
        refresh();
      };
    });refresh();
  },
  // An expedition never needs to return to the yard to inspect, train,
  // equip, feed, or shop. Reuse the same panels and the same saved cat objects.
  openExploreMenu(){
    if(this.game?.scene!=='map'&&this.game?.scene!=='yard')return;
    this.resetNavigation();
    this._navCurrent=()=>this.openExploreMenu();
    const en=this.isEnglish();
    const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'
    })[char]);
    const team=this.getPreferredBattleTeam().slice(0,2);
    const woundedCount=this.getPreferredBattleTeam()
      .filter(cat=>State.catHpFraction(cat)<.999).length;
    const isYard=this.game.scene==='yard';
    const region=isYard?null:window.WorldMap?.REGIONS?.find(r=>r.id===WorldMap.currentRegion);
    const regionName=isYard?(en?'Yard':'庭院'):(region?(en?region.sub:region.name):(en?'World map':'世界地图'));
    const summary=team.map((cat,i)=>{
      const sp=GameData.speciesById(cat.species);
      if(!sp)return '';
      const f=this.battleCatFacts(cat);
      const slotNames=Array.isArray(cat.loadout)?cat.loadout.slice(1,4):[];
      const moves=slotNames.map(id=>window.Skills?.skillById?.(id)?.name).filter(Boolean);
      const skills=moves.length?moves.map(name=>'<span>'+esc(name)+'</span>').join('')
        :'<span>'+(en?'Train to unlock moves':'培养后解锁新技能')+'</span>';
      return '<article class="explore-cat" data-menu-cat="'+esc(cat.uid)+'">'+
        '<canvas width="72" height="68" aria-hidden="true"></canvas>'+
        '<div class="explore-cat-summary"><strong>'+esc(State.catName(cat))+'</strong>'+
        '<small>'+(i===0?(en?'Leader':'领队'):(en?'Partner':'搭档'))+
        ' · Lv.'+f.level+' · '+esc(f.rarity)+' · '+(en?'Power ':'战力 ')+f.power+'</small>'+
        '<small>❤ <span data-menu-hp="'+esc(cat.uid)+'">'+f.hp+'/'+f.maxHp+'</span> · '+(en?'Bond ':'好感 ')+f.affinity+
        ' · '+(en?'Full ':'饱食 ')+Math.round(cat.hunger||0)+'%</small>'+
        '<div class="explore-cat-skills">'+skills+'</div>'+
        '<div class="explore-cat-buttons">'+
        '<button type="button" data-menu-cat-action="detail" data-uid="'+esc(cat.uid)+'">'+(en?'Status / Raise':'状态 / 养成')+'</button>'+
        '<button type="button" data-menu-cat-action="skills" data-uid="'+esc(cat.uid)+'">'+(en?'Skills':'技能搭配')+'</button>'+
        '<button type="button" class="explore-fish-heal" data-menu-cat-action="heal" data-uid="'+esc(cat.uid)+'" '+(f.hpPercent>=100||(State.S.medkits||0)<1?'disabled':'')+'>'+
        (en?'🧰 First-aid kit · +35% HP':'🧰 急救包 · 补血 +35%')+'</button>'+
        '</div></div></article>';
    }).join('')||'<p class="sub">'+(en?'Adopt a kitten to begin exploring.':'先收集一只猫咪，开始探险吧。')+'</p>';
    const action=(id,icon,zh,enLabel)=>'<button type="button" data-explore-action="'+id+'">'+
      '<span aria-hidden="true">'+icon+'</span><span>'+(en?enLabel:zh)+'</span></button>';
    this.panel('<span class="card-close">×</span><section class="explore-menu" aria-label="'+
      (en?'Expedition management':'探险管理')+'">'+
      '<h2>'+(isYard?(en?'☰ Yard menu':'☰ 庭院菜单'):(en?'☰ Expedition menu':'☰ 探险菜单'))+'</h2>'+
      '<p class="explore-menu-location">'+(isYard?(en?'At ':'当前位置：'):(en?'Exploring ':'正在探索：'))+esc(regionName)+
      ' <span>🪙 '+Math.floor(State.S.coins||0)+' · 🐠 '+Math.floor(State.S.fish||0)+' · 🧰 '+Math.floor(State.S.medkits||0)+'</span></p>'+
      '<p class="explore-health-rule">'+(State.difficulty()==='casual'
        ?(en?'🌿 Casual: HP refills after each battle.':'🌿 休闲模式：战后自动回满血。')
        :(en?'🔥 Hardcore: HP regenerates automatically (20% per minute). Returning to the yard heals all cats.':'🔥 硬核模式：每分钟自动恢复 20% 血量；回庭院立即满血。'))+'</p>'+
      '<h3>'+(en?'Battle team · tap to manage':'出战队伍 · 直接管理')+'</h3>'+
      '<div class="explore-cat-list">'+summary+'</div>'+
      '<h3>'+(en?'More to do':'其他功能')+'</h3>'+
      '<div class="explore-menu-actions">'+
      action('cats','🐾','全部猫咪','All cats')+
      action('squad','⚔️','出战队伍','Battle team')+
      action('duo','💞','双猫纽带','Cat duos')+
      action('workshop','🧶','工坊收益','Workshop')+
      action('shop','🛒','小卖部','Shop')+
      action('healteam','🧰','急救包补血 +35% · 需要 '+woundedCount+' 个','First-aid kits +35% · '+woundedCount+' needed')+
      action('feed','🍖','喂食全员','Feed all')+
      action('regions','🗺️','世界目录','World directory')+
      '</div><p class="explore-menu-tip">'+(en
        ?'Close × to resume exploring exactly where you left off.'
        :'点击 × 就能回到刚才的位置，继续探索。')+'</p>'+
      '<button type="button" class="cb-menu-reset" id="cb-menu-reset">'+
      (en?'Reset game':'重置游戏')+'</button></section>');
    document.getElementById('map-menu')?.setAttribute('aria-expanded','true');
    const host=document.querySelector('#panel .explore-menu');
    window.CatBondBindResetButton?.(host?.querySelector('#cb-menu-reset'));
    host?.querySelectorAll('.explore-cat').forEach(card=>{
      const cat=team.find(c=>c.uid===card.dataset.menuCat);
      if(cat)CatArt.renderCatThumb(card.querySelector('canvas'),
        GameData.speciesById(cat.species),cat);
    });
    host?.querySelectorAll('[data-menu-cat-action]').forEach(button=>{
      button.onclick=()=>{
        const cat=(State.S.cats||[]).find(c=>c.uid===button.dataset.uid);
        if(!cat)return;
        if(button.dataset.menuCatAction==='heal'){
          const result=State.useMedkitForHealth(cat);
          const message=result.ok
            ?(en?'🧰 '+State.catName(cat)+': '+Math.round(result.before*100)+'% → '+Math.round(result.after*100)+'% HP'
              :'🧰 '+State.catName(cat)+'：'+Math.round(result.before*100)+'% → '+Math.round(result.after*100)+'% 血量')
            :this.medkitFailureText(result,en);
          if(result.ok){this.openExploreMenu();this.game.refreshHUD();}
          this.game.toast(message);
        }else if(button.dataset.menuCatAction==='skills')this.navigateTo(()=>this.openSkillEditor(cat));
        else this.navigateTo(()=>this.openCatDetail(cat));
      };
    });
    const actions={
      cats:()=>this.openCatHub('solo'),squad:()=>this.openMapSquad(),
      duo:()=>this.openCatHub('duo'),workshop:()=>this.openWorkshop(),
      shop:()=>this.openShop(),feed:()=>this.openFeed(),
      healteam:()=>{
        const r=State.useMedkitForTeam(this.getPreferredBattleTeam());
        const msg=r.ok?(en?'🧰 Healed '+r.count+' cats using '+r.cost+' kits.':'🧰 已给 '+r.count+' 只猫补血，消耗 '+r.cost+' 个急救包。')
          :this.medkitFailureText(r,en);
        if(r.ok){this.openExploreMenu();this.game.refreshHUD();}
        this.game.toast(msg);
      },
      regions:()=>this.game.scene==='yard'?this.game.openWorldMap():this.openMapChooser()
    };
    host?.querySelectorAll('[data-explore-action]').forEach(button=>{
      button.onclick=()=>{const open=actions[button.dataset.exploreAction];if(open)this.navigateTo(open);};
    });
  },

  // Live HP readout while the expedition menu stays open. No tapping required.
  refreshExploreHealth(){
    const host=document.querySelector('#panel .explore-menu');
    if(!host)return;
    const squad=this.getPreferredBattleTeam();
    const cats=new Map((State.S.cats||[]).map(c=>[c.uid,c]));
    for(const card of host.querySelectorAll('[data-menu-cat]')){
      const cat=cats.get(card.dataset.menuCat);
      if(!cat)continue;
      const f=this.battleCatFacts(cat);
      const label=card.querySelector('[data-menu-hp]');
      if(label)label.textContent=f.hp+'/'+f.maxHp;
      const button=card.querySelector('[data-menu-cat-action="heal"]');
      if(button)button.disabled=f.hpPercent>=100||(State.S.medkits||0)<1;
    }
    const injured=squad.filter(cat=>State.catHpFraction(cat)<.999).length;
    const allLabel=host.querySelector('[data-explore-action="healteam"] span:last-child');
    if(allLabel)allLabel.textContent=this.isEnglish()
      ?'First-aid kits +35% · '+injured+' needed':'急救包补血 +35% · 需要 '+injured+' 个';
  },

  medkitFailureText(result,en){
    return result?.reason==='medkit'
      ?(en?'Need '+(result.cost||1)+' first-aid kits. Buy them in the shop.':'急救包不足（需要 '+(result.cost||1)+' 个），可去小卖部购买。')
      :(en?'All cats are at full HP.':'猫猫血量已经满啦！');
  },

  openMapSquad(){
    const en=window.MorrowwishI18n?.get?.()!=='zh';
    const selected=this.getPreferredBattleTeam().map(c=>c.uid);
    if(!selected.length){this.game.toast(en?'Adopt a kitten first':'请先领养一只小猫');return;}
    this.panel('<span class="card-close">×</span><h2>'+(en?'🐾 Battle team':'🐾 出战队伍')+'</h2>'
      +'<p class="sub">'+(en?'Pick up to 5; 2 fight on the field, the rest are bench subs that tag in when a cat faints (a bond ult can also call one in). The first is your leader.':'最多挑 5 只：场上出战 2 只，其余在后备席，场上猫倒下时自动替补上场（羁绊必杀也能临时召唤一只）。第一只是领队。')+'</p>'
      +'<div class="prebattle-quick-select"><button id="map-squad-best" type="button" class="btn ghost">'+(en?'⚡ Auto-pick strongest':'⚡ 一键最强上阵')+'</button></div>'
      +this.squadPickerMarkup(selected)
      +'<div class="btn-row"><button id="map-squad-save" type="button" class="btn gold">'+(en?'Save team':'保存队伍')+'</button>'
      +'<button id="map-squad-cancel" type="button" class="btn ghost">'+(en?'Cancel':'取消')+'</button></div>');
    this.bindSquadPicker(selected);
    document.getElementById('map-squad-best').onclick=()=>{
      selected.splice(0,selected.length,...this.getStrongestBattleTeam().map(cat=>cat.uid));
      this.bindSquadPicker(selected);
    };
    document.getElementById('map-squad-save').onclick=()=>{
      State.S.battlePrefs={...(State.S.battlePrefs||{}),teamUids:[...selected]};
      State.save();this.closeAll();this.game.toast(en?'Battle team saved!':'出战队伍已保存！');
      window.arcadeMetric?.('bond_squad_changed',{size:selected.length});
    };
    document.getElementById('map-squad-cancel').onclick=()=>this._navStack.length?this.navigateBack():this.closeAll();
  },

  // Five real playable locations, with their exact unlocking conditions.
  openMapChooser(){
    if(!window.WorldMap)return;
    this.game?.completeFirstAdventureStep?.('map');
    const en=window.MorrowwishI18n?.get?.()!=='zh';
    const rows=WorldMap.REGIONS.map(r=>{
      const open=WorldMap.isUnlocked(r.id);
      const pct=Math.round(100*(State.S.worldmap?.regions?.[r.id]?.explored||0));
      const prev=WorldMap.REGIONS.find(x=>x.id===r.unlock?.after);
      const own=r.unlock?.own?GameData.speciesById(r.unlock.own):null;
      const requirement=!r.unlock?(en?'Ready to explore':'开局即可探索')
        :en?'Explore '+prev.sub+' '+Math.round(r.unlock.explore*100)+'%'+(own?' · Befriend '+own.name:'')
        :'探索「'+prev.name+'」'+Math.round(r.unlock.explore*100)+'%'+(own?' · 拥有「'+own.name+'」':'');
      const icon=({home:'🏡',sakura:'🌸',creek:'💧',volcano:'🔥',ruins:'🌙'})[r.id]||'🐾';
      return `<button type="button" class="map-destination ${open?'available':'locked'}" data-region="${r.id}" ${open?'':'disabled'}>
        <span class="map-destination-icon">${icon}</span>
        <span class="map-destination-info"><strong>${en?r.sub:r.name}</strong>
          <small>${open?(en?'Explored '+pct+'%':'探索度 '+pct+'%'):'🔒 '+requirement}</small></span>
        <span class="map-destination-enter">${open?(en?'Enter':'进入'):'🔒'}</span>
      </button>`;
    }).join('');
    this.panel(`<span class="card-close">×</span><div class="map-chooser">
      <h2>${en?'🗺️ Explore five regions':'🗺️ 探索五个地区'}</h2>
      <p>${en?'Each region has its own scenery, wild cats and treasures. Unlock the next by exploring.'
        :'每个地区都有独立场景、野猫与宝藏。提高探索度，逐步解锁新地图。'}</p>
      <div class="map-destination-list">${rows}</div>
      <p class="map-instructions">${en
        ?'PC: click to walk or mouse-drag to pan; WASD also works. Phone: tap to walk, drag to look around. Approach cats and treasure.'
        :'电脑：点击草坪行走、按住鼠标拖拽查看四周，也支持 WASD；手机：轻点行走、拖动草坪平移视角。接近野猫和宝藏自动互动。'}</p>
      <div class="btn-row"><button class="btn gold" id="map-pick-team">${en?'🐾 Choose cats':'🐾 选择出战猫咪'}</button>
        <button class="btn" id="map-world-view">${en?'View world map':'查看世界地图'}</button>
        <button class="btn ghost" id="map-back-yard">${en?'Back to yard':'返回庭院'}</button></div></div>`);
    document.querySelectorAll('#panel .map-destination.available').forEach(btn=>{
      btn.onclick=()=>{
        if(WorldMap.enterRegion(btn.dataset.region)){
          this.closeAll();
          const r=WorldMap.REGIONS.find(r=>r.id===btn.dataset.region);
          this.game.toast(en?'Now exploring '+r.sub:'开始探索「'+r.name+'」');
          window.arcadeMetric?.('bond_region_enter',{region:r.id});
        }
      };
    });
    document.getElementById('map-pick-team').onclick=()=>this.navigateTo(()=>this.openMapSquad());
    document.getElementById('map-world-view').onclick=()=>{WorldMap.enterMap();this.closeAll();};
    document.getElementById('map-back-yard').onclick=()=>{this.closeAll();this.game.scene='yard';this.game.showYardChrome();};
  },

  // An actual choice, not a random reward notification.
  openYardSurprise(){
    const d=State.S.yardStory?.pending;if(!d)return;
    const en=window.MorrowwishI18n?.get?.()!=='zh';
    const events=[
      ['🔔','草丛的小铃铛','A bell in the grass','带走铃铛','Take the bell','一起玩铃铛','Play with the bell'],
      ['🦋','蝴蝶的秘密路线','Follow the butterfly','寻找鱼干','Find fish','在花丛打滚','Play in the flowers'],
      ['🧶','猫咪的宝藏','A kitten treasure','换成金币','Keep the coins','换成小鱼','Trade for fish'],
      ['🐾','两只猫争夺毛线球','A yarn-ball disagreement','两只都安慰','Comfort them both','帮助它们一起玩','Help them share'],
      ['📦','神秘纸箱大探险','The mysterious cardboard box','打开纸箱','Open the box','一起钻进去','Explore together'],
      ['🐠','小鱼不翼而飞','The disappearing fish','揭开秘密','Find the culprit','悄悄补充小鱼','Refill the fish'],
      ['🌠','流星落在屋顶上','A shooting star over the roof','收下星光','Collect starlight','许一个伙伴愿望','Wish for friendship']
    ];
    const e=events[d.kind]||events[0];
    this.panel(`<span class="card-close">×</span><div class="yard-surprise-story">
      <div class="yard-surprise-icon">${e[0]}</div><h2>${en?e[2]:e[1]}</h2>
      <p>${en?(d.kind===3?'Two kittens want the same yarn ball. Can you help them share?':
        d.kind===5?'Someone stole the fish. Tiny pawprints lead into the flowers!':
        'Your cat found something unexpected. What should you do?')
        :(d.kind===3?'两只猫抢同一个毛线球，谁也不肯松爪。你准备怎么办？':
          d.kind===5?'小鱼桶空了，地上却留着两串神秘脚印！':'猫猫意外发现了一件小宝贝，你想怎么做？')}</p>
      <div class="btn-row"><button class="btn gold" id="surprise-a">${en?e[4]:e[3]}</button>
      <button class="btn" id="surprise-b">${en?e[6]:e[5]}</button></div></div>`);
    for(const [id,choice] of [['surprise-a',0],['surprise-b',1]])document.getElementById(id).onclick=()=>{
      if(this.game.claimYardSurprise(choice)){this.closeAll();this.game.toast(en?'🎁 Surprise claimed!':'🎁 收下猫猫的礼物！');}
    };
  },
  openRegionSecret(reward){
    const d=reward.discovery,en=window.MorrowwishI18n?.get?.()!=='zh';
    const duoNames=reward.duoNames||[];
    const duoLabel=reward.duoMemory
      ?'<p class="duo-discovery-names">'+duoNames.map(n=>String(n).replace(/[&<>"']/g,'')).join(' + ')+
        ' · '+(en?'Trust +12':'默契 +12')+'</p>':'';
    // Only 🪙 coins + 🐠 fish (+ ✨ luck) remain; fold any legacy yarn→coins, treats→fish.
    const coinAmt=(reward.coins||0)+(reward.yarn||0),fishAmt=(reward.fish||0)+(reward.treats||0);
    const items=[['coins','🪙',coinAmt],['fish','🐠',fishAmt],['luck','✨',reward.luck||0]]
      .filter(([,,n])=>n).map(([,icon,n])=>'+'+n+' '+icon).join(' · ');
    this.panel(`<span class="card-close">×</span><div class="yard-surprise-story">
      <div class="yard-surprise-icon">${d.icon}</div><h2>${en?d.en:d.name}</h2>
      <p>${en?d.storyEn:d.story}</p>${duoLabel}<p class="secret-reward">${reward.duoMemory?(en?'Duo expedition memory':'双猫旅行回忆'):(en?'Unique discovery':'地区专属发现')} · ${items}</p>
      <div class="btn-row"><button class="btn gold" id="secret-close">${en?'Explore more':'继续探索'}</button></div></div>`);
    document.getElementById('secret-close').onclick=()=>this.closeAll();
  },
  openDuoQuarrel(a,b){
    if(!a||!b)return this.openBondPanel();
    const en=window.MorrowwishI18n?.get?.()!=='zh';
    const esc=x=>String(x).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[ch]));
    this.panel(`<span class="card-close">×</span><section class="duo-quarrel-story" aria-label="${en?'A little cat story':'双猫小故事'}">
      <span class="duo-quarrel-eyebrow">${en?'A LITTLE STORY FROM THE GARDEN':'庭院里的双猫小故事'}</span>
      <h2>${en?'The Great Yarn-Ball Dispute':'一颗毛线球引发的小别扭'}</h2>
      <div class="duo-quarrel-cats" aria-label="${en?'The two cats':'两只小猫'}">
        <figure><canvas data-duo-quarrel-cat="a" width="116" height="116" aria-hidden="true"></canvas><figcaption>${esc(State.catName(a))}</figcaption></figure>
        <span class="duo-quarrel-heart" aria-hidden="true">↯</span>
        <figure><canvas data-duo-quarrel-cat="b" width="116" height="116" aria-hidden="true"></canvas><figcaption>${esc(State.catName(b))}</figcaption></figure>
      </div>
      <div class="duo-quarrel-vignette">
        <p>${en?'A yarn ball rolls between them. Both pounce at once, neither wants to share—and now they sit back-to-back.':'毛线球滚到两只小猫中间，它们同时扑了过去。谁也不肯让步，最后竟背对背生起了闷气。'}</p>
      </div>
      <p class="duo-quarrel-help">${en?'Can you help these two make up? +6 bond when they reconcile.':'去哄哄它们吧！和好后，默契还能提升 6 点。'}</p>
      <div class="btn-row duo-quarrel-actions">
        <button type="button" id="quarrel-fix" class="btn gold">${en?'Help them make up':'去哄一哄'}</button>
        <button type="button" id="quarrel-later" class="btn ghost">${en?'Later':'稍后再说'}</button>
      </div>
      <p class="duo-quarrel-footnote">${en?'The pink garden notice will bring you back to this story.':'庭院里的粉色搭档提示会保留这件小事。'}</p>
    </section>`);
    // Portraits must use the player's actual cats, not generic emoji or map art.
    for(const [i,cat] of [a,b].entries()){
      const canvas=document.querySelectorAll('#panel.open [data-duo-quarrel-cat]')[i];
      if(canvas)CatArt.renderCatThumb(canvas,GameData.speciesById(cat.species),cat);
    }
    document.getElementById('quarrel-fix').onclick=()=>{
      this._duoPicked=[a.uid,b.uid];
      this.openBondPanel();
    };
    document.getElementById('quarrel-later').onclick=()=>this.closeAll();
  },
  // A real in-panel cut-in is shown BEFORE duo selection, with the actual
  // two selected breeds. Preview availability never changes skill unlocks.
  showPairSkillAnimation(a,b,name,elementPair,tier=1){
    const canvas=document.getElementById('duo-skill-canvas');
    if(!canvas||!window.CatBondDuoHero)return;
    const lookup=uid=>uid===a.uid?a:uid===b.uid?b:null;
    const start=performance.now();
    let lastPaint=0;
    const draw=now=>{
      if(!canvas.isConnected)return; // panels are rebuilt when either cat changes
      requestAnimationFrame(draw);
      if(now-lastPaint<45||document.hidden)return;
      lastPaint=now;
      const rect=canvas.getBoundingClientRect();
      const w=rect.width,h=rect.height;if(w<10||h<10)return;
      const scale=Math.min(2,window.devicePixelRatio||1);
      const pw=Math.round(w*scale),ph=Math.round(h*scale);
      if(canvas.width!==pw||canvas.height!==ph){canvas.width=pw;canvas.height=ph;}
      const ctx=canvas.getContext('2d');
      ctx.setTransform(scale,0,0,scale,0,0);ctx.clearRect(0,0,w,h);
      if(!window.CatBondDuoHero.assetReady)return;
      const len=2.75,elapsed=((now-start)/1000)%len;
      window.CatBondDuoHero.draw(ctx,w,h,{
        max:len,t:len-Math.max(.01,elapsed),strikeAt:.78,
        catUids:[a.uid,b.uid],name,elements:elementPair,tier
      },lookup);
    };
    requestAnimationFrame(draw);
  },
  // Open an earned duo technique inside the game. The animation viewer
  // verifies saved trust again, so locked pairs cannot be opened by URL alone.
  openUnlockedDuoViewer(a,b){
    if(!a||!b||a.uid===b.uid)return false;
    const key=[a.uid,b.uid].sort().join(':');
    const rel=State.S.duoRelations?.pairs?.[key];
    if(Number(rel?.value)<20)return false;
    const english=window.MorrowwishI18n?.get?.()!=='zh';
    const art=CatRelations.title(a,b);
    const url=new URL('duo-preview.html',window.location.href);
    url.searchParams.set('a',a.uid);
    url.searchParams.set('b',b.uid);
    url.searchParams.set('lang',english?'en':'zh');
    url.searchParams.set('embedded','1');
    url.searchParams.set('preview','original-three-tier-20261123-v4');
    document.getElementById('cb-duo-viewer')?.remove();
    const previousFocus=document.activeElement;
    const overlay=document.createElement('div');
    overlay.id='cb-duo-viewer';
    overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-modal','true');
    overlay.setAttribute('aria-label',english?'Watch unlocked duo move':'观看已解锁双猫合击');
    const shell=document.createElement('div');
    shell.className='cb-duo-viewer-shell';
    const heading=document.createElement('strong');
    heading.className='cb-duo-viewer-title';
    heading.textContent=(art?.name|| (english?'Duo move':'双猫合击'))+' · '+
      State.catName(a)+' × '+State.catName(b);
    const closeButton=document.createElement('button');
    closeButton.type='button';
    closeButton.className='cb-duo-viewer-close';
    closeButton.setAttribute('aria-label',english?'Close animation':'关闭合击演出');
    closeButton.textContent='×';
    const player=document.createElement('iframe');
    player.title=english?'Unlocked duo animation':'已解锁双猫合击演出';
    player.src=url.href;
    player.setAttribute('allow','autoplay');
    shell.append(heading,closeButton,player);
    overlay.appendChild(shell);
    const keydown=e=>{
      if(e.key==='Escape'){e.preventDefault();e.stopPropagation();dismiss();}
      // Keep keyboard focus within the modal; the iframe still handles its
      // own playback shortcuts when focused.
      if(e.key==='Tab'&&document.activeElement===closeButton){
        e.preventDefault();player.focus();
      }
    };
    const dismiss=()=>{
      document.removeEventListener('keydown',keydown,true);
      overlay.remove();previousFocus?.focus?.();
    };
    closeButton.addEventListener('click',dismiss);
    overlay.addEventListener('click',e=>{if(e.target===overlay)dismiss()});
    document.addEventListener('keydown',keydown,true);
    document.body.appendChild(overlay);
    closeButton.focus();
    return true;
  },
  // Paint each unlocked pair ONCE with the same full-illustration renderer
  // as combat. Locked records never create canvases or preview requests.
  renderUnlockedDuoCards(entries){
    const paint=()=>{
      if(!window.CatBondDuoHero?.assetReady)return;
      document.querySelectorAll('#panel canvas[data-duo-thumb]').forEach(canvas=>{
        const entry=entries[Number(canvas.dataset.duoThumb)];
        if(!entry||entry.trust<20||!canvas.isConnected)return;
        const art=CatRelations.title(entry.a,entry.b);
        const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
        ctx.clearRect(0,0,w,h);
        window.CatBondDuoHero.draw(ctx,w,h,{
          max:2.75,t:1.62,catUids:[entry.a.uid,entry.b.uid],hideCaptions:true,
          thumbnail:true, // static card view: no foreground vines, slashes or bloom
          elements:art.elementPair,name:art.name,
          tier:entry.trust>=90?3:entry.trust>=60?2:1
        },uid=>uid===entry.a.uid?entry.a:uid===entry.b.uid?entry.b:null);
      });
    };
    if(window.CatBondDuoHero?.assetReady)requestAnimationFrame(paint);
    else window.addEventListener('cat-bond-premium-art-ready',paint,{once:true});
  },
  openBondPanel(preferUnresolved=false,preserveScroll=false){
    const en=window.MorrowwishI18n?.get?.()!=='zh',cats=State.S.cats;
    if(cats.length>=2)this.game?.completeFirstAdventureStep?.('duo');
    if(cats.length<2){this.panel('<span class="card-close">×</span><h2>'+(en?'Cat Duos':'双猫搭档')+'</h2><p>'+(en?'Befriend a second cat first!':'先收服第二只猫，就能建立纽带！')+'</p>');this.catHubTabs('duo');return;}
    const pendingPair=preferUnresolved?CatRelations.unresolved?.()[0]:null;
    // Build the visible gallery from EARNED relationship records only.
    // Simply owning two cats does not reveal their ability or cinematics.
    const unlockedPairs=Object.entries(State.S.duoRelations?.pairs||{})
      .filter(([,rel])=>Number(rel?.value)>=20)
      .map(([key,rel])=>{
        const [uidA,uidB]=key.split(':');
        const a=cats.find(c=>c.uid===uidA),b=cats.find(c=>c.uid===uidB);
        return a&&b?{a,b,trust:rel.value}:null;
      }).filter(Boolean)
      .sort((x,y)=>y.trust-x.trust);
    let picked=pendingPair?[pendingPair.a.uid,pendingPair.b.uid]:
      (this._duoPicked?.slice()||CatRelations.chosen().map(c=>c.uid));
    if(picked.length!==2||!picked.every(id=>cats.some(c=>c.uid===id))){
      const pending=CatRelations.unresolved?.()[0];
      picked=pending?[pending.a.uid,pending.b.uid]:[cats[0].uid,cats[1].uid];
    }
    if(unlockedPairs.length&&!this._duoChangeOpen&&!preferUnresolved){
      const saved=[picked[0],picked[1]].sort().join(':');
      if(!unlockedPairs.some(entry=>[entry.a.uid,entry.b.uid].sort().join(':')===saved)){
        picked=[unlockedPairs[0].a.uid,unlockedPairs[0].b.uid];
        this._duoPicked=picked.slice();
      }
    }
    const [a,b]=picked.map(id=>cats.find(c=>c.uid===id)),ok=a.uid!==b.uid;
    const rel=ok?CatRelations.pair(a,b):null,p=rel?.value||0;
    const duoArt=ok?CatRelations.title(a,b):null;
    // Locked duo moves remain secret: no name, description, rendered cut-in
    // or full-screen route before the actual trust threshold is reached.
    const unlocked=ok&&p>=20;
    const personalityNotes=[a,b].map(c=>{
      const notes=en?{
        gentle:'Protector · shields a vulnerable partner',
        diligent:'Reliable protector · guards friends under pressure',
        shy:'Courage · counterattacks when rescued',
        mischievous:'Trickster · distracts enemies for partner ambushes',
        clever:'Clever decoy · baits enemies for a surprise attack',
        lazy:'Sleepy guardian · awakens to protect a weakened friend',
        glutton:'Snack power · well-fed cats charge the duo meter'
      }:{
        gentle:'温柔守护 · 挺身减轻伙伴受到的伤害',
        diligent:'可靠守护 · 危急时为伙伴挡伤害',
        shy:'勇气反击 · 被保护后主动挥爪还击',
        mischievous:'调皮诱敌 · 吸引野猫，为伙伴制造偷袭机会',
        clever:'机敏声东击西 · 诱敌之后由搭档偷袭',
        lazy:'慵懒守护 · 伙伴受伤时惊醒并展开护盾',
        glutton:'吃饱发力 · 饱腹时额外积攒合击能量'
      };
      return State.catName(c)+' · '+(notes[c.personality]||(en?'Curious companion':'好奇的伙伴'));
    });
    const selected=ok&&CatRelations.chosen().map(c=>c.uid).join('|')===picked.join('|');
    const mood=ok?CatRelations.mood(a,b):'unknown';
    const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
    const unlockedCards=unlockedPairs.map((entry,i)=>{
      const art=CatRelations.title(entry.a,entry.b);
      const active=CatRelations.chosen().map(c=>c.uid).sort().join(':')===
        [entry.a.uid,entry.b.uid].sort().join(':');
      const selected=[entry.a.uid,entry.b.uid].sort().join(':')===
        picked.slice().sort().join(':');
      return '<button type="button" class="duo-unlocked-card '+(selected?'chosen':'')+
        '" data-duo-index="'+i+'" aria-label="'+esc((en?'Watch ':'观看 ')+art.name+
          ' · '+State.catName(entry.a)+' × '+State.catName(entry.b))+'">'+
        '<canvas class="duo-gallery-thumb" data-duo-thumb="'+i+'" width="300" height="169" aria-hidden="true"></canvas>'+
        '<span class="duo-card-body"><strong>'+esc(State.catName(entry.a))+' × '+esc(State.catName(entry.b))+'</strong>'+
        '<b>'+esc(art.name)+'</b><small>'+esc(art.description)+'</small>'+
        '<span class="duo-card-trust">'+(active?'✓ '+(en?'Active · ':'出战中 · '):'')+
        (en?'Trust ':'默契 ')+Math.floor(entry.trust)+'/100</span>'+
        '<span class="duo-card-watch">'+(en?'▶ Watch animation':'▶ 点击观看合击')+'</span></span></button>';
    }).join('');
    // One chip per breed — the strongest — so the duo chooser isn't cluttered with same-breed dupes
    // (owner: "选双猫羁绊也是"). Keep whichever cats are already picked for the pairing, power-sorted.
    const duoCats=this.strongestPerSpecies(
      [...cats].sort((a,b)=>State.catPower(b)-State.catPower(a)), picked.filter(Boolean));
    const catButtons=side=>duoCats.map(c=>
      '<button class="duo-cat-chip '+(picked[side]===c.uid?'selected':'')+
      '" type="button" data-duo-cat="'+side+'" data-cat-uid="'+esc(c.uid)+
      '" aria-pressed="'+String(picked[side]===c.uid)+'">'+esc(State.catName(c))+'</button>'
    ).join('');
    const showPairChooser=!unlockedPairs.length||this._duoChangeOpen;
    const pairChooser='<div class="duo-direct-chooser" id="duo-direct-chooser">'+
      '<p class="tiny">'+(en?'Tap two cats to raise another pairing (skills remain secret until unlocked).':
        '直接点选两只猫培养新的搭档；未解锁的技能不会提前显示。')+'</p>'+
      '<strong>'+(en?'First cat':'第一只猫')+'</strong><div class="duo-cat-chip-list">'+catButtons(0)+'</div>'+
      '<strong>'+(en?'Second cat':'第二只猫')+'</strong><div class="duo-cat-chip-list">'+catButtons(1)+'</div>'+ 
      '<p class="duo-chooser-selection">'+esc(State.catName(cats.find(c=>c.uid===picked[0])))+' × '+esc(State.catName(cats.find(c=>c.uid===picked[1])))+'</p>'+ 
      '<button type="button" class="btn gold duo-chooser-confirm" id="duo-choose">'+(en?'✓ Form my battle duo':'✓ 组成出战搭档')+'</button></div>';
    const sec=rel?Math.max(0,Math.ceil((60000-(Date.now()-rel.lastPlay))/1000)):0;
    const memories=ok?CatRelations.memoryList(a,b):[];
    const memoryCount=CatRelations.MEMORY_CATALOG.filter(m=>memories.includes(m.id)).length;
    const memoryTiles=kind=>CatRelations.MEMORY_CATALOG.filter(m=>m.kind===kind).map(m=>{
      const found=memories.includes(m.id),info=CatRelations.memoryInfo(a,b,m.id);
      return '<button type="button" class="duo-memory-stamp '+(found?'found':'missing')+
        '" '+(found?'data-duo-memory="'+esc(m.id)+'"':'disabled')+
        ' aria-label="'+esc(found?info.title:info.hint)+'">'+
        '<span class="duo-memory-icon">'+(found?info.icon:'?')+'</span>'+
        '<small>'+esc(found?info.title:info.hint)+'</small></button>';
    }).join('');
    const album=memoryTiles('map'),specialAlbum=memoryTiles('moment');
    this.panel(`<span class="card-close">×</span><div class="duo-panel">
      <h2>💞 ${en?'Your Cat Duo':'双猫纽带'}</h2>
      <p>${en?'Raise two best friends: explore together, collect shared memories and unlock powerful duo moves.':'让两只小猫从陌生到形影不离：一起探索、收集专属回忆、解锁强力合击。'}</p>
      ${mood==='sulky'?'<section class="duo-quarrel-alert" role="status"><strong>💢 '+(en?'Time to make up':'闹别扭啦')+'</strong><p>'+
        (en?State.catName(a)+' and '+State.catName(b)+' are upset. Make up for free to gain +6 trust.':
          State.catName(a)+' 和 '+State.catName(b)+' 闹别扭了，点下面的按钮免费和好，还能增加 6 点默契。')+
        '</p><button type="button" class="btn gold" id="duo-soothe">'+(en?'Make up · Free':'哄一哄 · 免费')+'</button></section>':''}
      ${unlockedPairs.length?'<button id="duo-change-cats" type="button" class="btn ghost duo-new-pair-toggle">'+
         (this._duoChangeOpen?(en?'Hide new pairing':'收起新搭档'):
           (en?'Raise another pairing':'培养其他搭档'))+'</button>':''}
      ${showPairChooser?pairChooser:''}
      <section class="duo-unlocked-section">
        <h3>${en?'Unlocked cat duos':'已解锁的双猫合击'} <small>${unlockedPairs.length}</small></h3>
        ${unlockedPairs.length?'<div class="duo-unlocked-grid">'+unlockedCards+'</div>':
          '<p class="duo-empty">'+(en?'No duo moves unlocked yet. Play together to reach 20 trust.':
            '暂时还没有解锁合击。选好搭档后一起玩、撸猫，默契达到 20 才会揭晓技能。')+'</p>'}
      </section>

      <div class="duo-relation">
        <h3 class="duo-relation-heading">${en?'Pair bonding':'双猫相处'}</h3>
        <strong class="duo-current-pair">${esc(State.catName(a))} × ${esc(State.catName(b))}</strong>
        ${unlocked?'':('<span class="duo-skill-unlock locked">'+
          (en?'🔒 Duo ability hidden until trust reaches 20':'🔒 默契达到 20 才会揭晓专属合击')+'</span>')}
        <span class="duo-active-status">${selected?(en?'✓ Current battle duo':'✓ 已组成出战搭档'):(en?'Not yet assigned':'尚未设为出战搭档')}</span>
        <span>${en?'Trust':'默契'} ${p}/100 · ${ok?CatRelations.moodLabel(a,b):''}</span>
        <small>${CatRelations.personality(a)} + ${CatRelations.personality(b)}</small>
        <div class="duo-personality-list">${personalityNotes.map(note=>'<p>'+esc(note)+'</p>').join('')}</div>
        <div class="duo-meter"><span style="width:${p}%"></span></div>
        <div class="duo-move-evolution" aria-label="${en?'Duo move upgrades':'双猫合击升级'}">
          <div class="${p>=20?'unlocked':''}"><b>20 · ${p>=20?(en?'Twin Pounce':'联手飞扑'):'🔒 ???'}</b><span>${p>=20?(en?'New duo action unlocked':'已解锁新合击动作'):(en?'Unlock at Trust 20':'默契20解锁')}</span></div>
          <div class="${p>=60?'unlocked':''}"><b>60 · ${p>=60?(en?'Cross Claws':'交叉爪击'):'🔒 ???'}</b><span>${p>=60?(en?'New duo action unlocked':'已解锁新合击动作'):(en?'Unlock at Trust 60':'默契60解锁')}</span></div>
          <div class="${p>=90?'unlocked':''}"><b>90 · ${p>=90?(en?'Soulbound Finale':'终极连斩'):'🔒 ???'}</b><span>${p>=90?(en?'New duo action unlocked':'已解锁新合击动作'):(en?'Unlock at Trust 90':'默契90解锁')}</span></div>
        </div>
        ${p>=60?'<p class="duo-secret-story">🌟 '+(en?'SECRET DUO STORY':'搭档秘密故事')+'<span>'
          +CatRelations.secretStory(a,b)+'</span></p>':''}
        ${p>=90?'<p class="duo-secret-story">🌙 '+(en?'SECRET PROMISE':'最终的约定')+'<span>'
          +(en?'Even in the fullest garden, these two will always find each other. Their team move has reached its final form.'
            :'即使庭院住满了小猫，它们也能一眼找到彼此。双猫合击终于达到最终形态。')
          +'</span></p>':''}
        <section class="duo-memory-album" aria-label="${en?'Duo memory album':'双猫回忆册'}">
          <strong>${en?'🐾 Our memories':'🐾 双猫回忆册'} · ${memoryCount}/${CatRelations.MEMORY_CATALOG.length}</strong>
          <p class="tiny">${en?'Explore together, play, reconcile after a quarrel, and use a real duo move to collect moments.':'一起探索地图、玩耍、闹别扭后和好，以及在战斗中合击，都能留下不同的回忆。'}</p>
          <span class="duo-memory-group-title">${en?'Journey · 5':'旅行回忆 · 5'}</span>
          <div class="duo-memory-grid">${album}</div>
          <span class="duo-memory-group-title">${en?'Little moments · 3':'相处回忆 · 3'}</span>
          <div class="duo-memory-grid duo-memory-moments">${specialAlbum}</div>
          <div class="duo-memory-note" id="duo-memory-note" aria-live="polite">${en?'Tap an unlocked memory to read its story.':'点击已解锁的回忆，可以重温两只猫的故事。'}</div>
        </section></div>
      <div class="btn-row">
        ${showPairChooser?'':('<button class="btn gold" id="duo-choose" '+(!ok?'disabled':'')+'>'+(selected?(en?'✓ Current duo':'✓ 当前搭档'):(en?'Form my battle duo':'组成出战搭档'))+'</button>')}
        <button class="btn" id="duo-play" ${!ok||sec>0||(State.S.medkits||0)<1?'disabled':''}>${en?'Play (1 fish)':'一起玩（1小鱼）'}</button>
        ${unlocked?'<button class="btn ghost" id="duo-preview">'+(en?'Watch unlocked animation':'观看已解锁合体技')+'</button>':''}</div>
      <p class="tiny">${sec?(en?'Play again in '+sec+'s':'下次一起玩需 '+sec+' 秒'):(en?'Petting also builds friendship.':'在庭院撸猫也能提升默契。')}</p>
      <button class="btn ghost" id="duo-return">${en?'Back':'返回冒险'}</button></div>`,preserveScroll);
    this.catHubTabs('duo');
    document.querySelectorAll('#panel [data-duo-index]').forEach(btn=>btn.onclick=()=>{
      const entry=unlockedPairs[Number(btn.dataset.duoIndex)];
      if(!entry||entry.trust<20)return;
      // Selecting a gallery card should update the highlighted duo and
      // detailed relationship panel, without changing the battle lineup.
      this._duoPicked=[entry.a.uid,entry.b.uid];
      this.openBondPanel();
      this.openUnlockedDuoViewer(entry.a,entry.b);
    });
    document.getElementById('duo-change-cats')?.addEventListener('click',()=>{
      this._duoChangeOpen=!this._duoChangeOpen;
      this.openBondPanel(false,true);
    });
    document.querySelectorAll('#panel [data-duo-cat]').forEach(btn=>btn.onclick=()=>{
      const side=Number(btn.dataset.duoCat),uid=btn.dataset.catUid;
      if(!cats.some(c=>c.uid===uid)||![0,1].includes(side))return;
      this._duoPicked=picked.slice();this._duoPicked[side]=uid;
      if(this._duoPicked[0]===this._duoPicked[1]){
        const other=cats.find(c=>c.uid!==uid);
        if(other)this._duoPicked[1-side]=other.uid;
      }
      this._duoChangeOpen=true;
      this.openBondPanel(false,true);
    });
    this.renderUnlockedDuoCards(unlockedPairs);
    document.querySelectorAll('#panel [data-duo-memory]').forEach(btn=>btn.onclick=()=>{
      const info=CatRelations.memoryInfo(a,b,btn.dataset.duoMemory);
      if(!info||!CatRelations.memoryList(a,b).includes(info.id))return;
      document.querySelectorAll('#panel [data-duo-memory]').forEach(item=>
        item.setAttribute('aria-pressed',String(item===btn)));
      const note=document.getElementById('duo-memory-note');
      if(note)note.textContent=info.icon+' '+info.title+' — '+info.story;
    });
    document.getElementById('duo-choose').onclick=()=>{
      if(!ok)return;
      CatRelations.choose(a,b);this._duoPicked=[a.uid,b.uid];
      this.game.yard?.entities?.filter(e=>[a.uid,b.uid].includes(e.cat.uid))
        .forEach(e=>{e.emote('💞',3);e.pettedGlow=1.5;});
      this.game.refreshHUD();
      this.game.toast(en?'💞 Duo formed! Both cats will join the next fight.':'💞 搭档组成成功！下次战斗两只会一起上场。');
      window.arcadeMetric?.('bond_duo_selected',{elementPair:CatRelations.title(a,b).elementPair});
      this.openBondPanel(false,true);
    };
    const previewButton=document.getElementById('duo-preview');
    if(previewButton)previewButton.onclick=()=>{
      if(unlocked)this.openUnlockedDuoViewer(a,b);
    };
    const soothe=document.getElementById('duo-soothe');
    if(soothe)soothe.onclick=()=>{
      const already=CatRelations.memoryList(a,b).includes('make-up');
      if(CatRelations.soothe(a,b)){
        this.game.toast(!already?(en?'💗 Made up! New memory unlocked':'💗 和好啦！解锁双猫回忆'):
          (en?'💗 Made up! Trust +6':'💗 和好啦！默契 +6'));
        this.game.refreshYardSurprise();this.openBondPanel();
      }
    };
    document.getElementById('duo-play').onclick=()=>{CatRelations.choose(a,b);const v=CatRelations.play(a,b);
      if(v.ok){
        this.game.toast(v.memoryUnlocked?(en?'🧶 A new duo memory!':'🧶 解锁双猫回忆：毛线团的秘密'):
          (en?'💞 Friendship +13!':'💞 双猫默契 +13！'));
        this.game.refreshHUD();
      }
      else if(v.reason==='cooldown')this.game.toast(en?'Let them rest a moment':'猫猫想休息一会儿');
      else if(v.reason==='fish')this.game.toast(en?'Not enough fish':'小鱼不够啦');
      this._duoPicked=[a.uid,b.uid];this.game.refreshYardSurprise();this.openBondPanel();
    };
    // The duo page is reachable directly from the adventure guide without a
    // navigation-stack entry. Its visible “Back to adventure” control must
    // return to that guide, not silently jump to the unrelated solo cat hub.
    document.getElementById('duo-return').onclick=()=>this._navStack.length?this.navigateBack():this.openJourney();
  },

  // ---- 欢迎回来 (offline raising report) ----
  openWelcomeBack(r) {
    const prod = r.produced || {};
    const gains = r.gains || {};
    const prodStr = Object.entries(prod).filter(([, v]) => v > 0).map(([k, v]) => `${this.resIcon(k)}+${v}`).join(' ');
    const gainStr = Object.entries(gains).filter(([, v]) => v > 0).map(([k, v]) => `${this.resIcon(k)}+${v}`).join(' ');
    const visitors = (r.visitors || []).map(v => {
      const giftText = this.formatVisitorGift(v.gift);
      return `<div class="wb-visitor ${v.rare ? 'rare' : ''}"><b>${v.name}</b> 来访${giftText ? ' · 留下 ' + giftText : ''}${v.rare ? ' ✨稀客!' : ''}</div>`;
    }).join('');
    this.panel(`<span class="card-close">×</span>
      <h2 class="center">😺 欢迎回来</h2>
      <p class="sub center">你离开了约 ${r.minutes} 分钟${r.capped ? '（已达上限）' : ''}</p>
      ${prodStr ? `<p class="center">工坊产出待收取：<b>${prodStr}</b></p>` : ''}
      ${gainStr ? `<p class="center">猫猫带回：<b>${gainStr}</b></p>` : ''}
      ${visitors ? `<div class="wb-list">${visitors}</div>` : ''}
      <div class="btn-row" style="justify-content:center">
        <button class="btn gold" id="wb-collect">${prodStr ? '全部收取' : '收下'}</button>
      </div>`);
    document.getElementById('wb-collect').onclick = () => {
      if (window.Raising && prodStr) Raising.collectAll();
      State.save(); this.game.refreshHUD(); this.closeAll();
    };
  },
  // Visitor gifts are resource dictionaries (e.g. {coins: 12, fish: 1}), not printable strings.
  formatVisitorGift(gift) {
    if (!gift || typeof gift !== 'object' || Array.isArray(gift)) return '';
    // Current currencies are only coins and fish. Convert retired yarn/treats
    // before displaying gifts: two legacy keys must not show as duplicate coins.
    const sums=new Map();
    for(const [key,amount] of Object.entries(gift)){
      if(!Number.isFinite(amount)||amount<=0)continue;
      const currency=key==='yarn'?'coins':key==='treats'?'fish':key;
      sums.set(currency,(sums.get(currency)||0)+amount);
    }
    return [...sums].map(([currency,amount])=>
      `${this.resIcon(currency) || currency}+${amount}`).join(' ');
  },
  // Two currencies remain (🪙 coins, 🐠 fish); legacy yarn→coins icon, treats→fish icon
  // keep old in-flight reward dicts rendering sensibly.
  resIcon(k) { return ({ coins: '🪙', fish: '🐠', yarn: '🪙', luck: '🍀', xp: '✨', treats: '🐠' })[k] || ''; },

  resetNavigation(){
    this._navStack=[];
    this._navCurrent=null;
  },
  navigateTo(open){
    if(typeof open!=='function')return;
    if(typeof this._navCurrent==='function')this._navStack.push(this._navCurrent);
    this._navCurrent=open;
    open();
  },
  navigateBack(){
    const prev=this._navStack.pop();
    if(!prev){this.closeAll();return;}
    this._navCurrent=prev;
    prev();
  },
  // An encounter is a bounded dialog with ONE scroll surface. Move the
  // action row OUTSIDE the scroll area so it never obscures the lineup arrows.
  setupPrebattleDialog(){
    const card=document.querySelector('#panel > .card');
    const actions=card?.querySelector('.prebattle-actions');
    if(!card||!actions)return;
    const scroll=document.createElement('div');
    scroll.className='prebattle-scroll';
    scroll.tabIndex=0;
    scroll.setAttribute('role','region');
    scroll.setAttribute('aria-label',this.isEnglish()?'Battle preparation':'开战前设置');
    for(const node of [...card.childNodes]){
      if(node===actions||node.nodeType===1&&node.classList.contains('card-close'))continue;
      scroll.appendChild(node);
    }
    card.classList.add('prebattle-dialog');
    card.insertBefore(scroll,actions);
  },
  // Preserve the card's scroll position when a choice only rerenders that
  // SAME form (skill selection / duo pairing). Full navigation still starts
  // at the top; never force the whole window to scroll on a button tap.
  panel(html,preserveScroll=false) {
    // An untracked/interactive modal replaces any stale saved locale route.
    if(!this._localePanelDepth&&!this._localePanelRerendering)
      this._localePanelRoute=null;
    this._teaseStop?.();
    const p = document.getElementById('panel');
    const before=p.querySelector(':scope > .card');
    const cardTop=preserveScroll?before?.scrollTop||0:0;
    const panelTop=preserveScroll?p.scrollTop:0;
    // Cat chips use their own scroll containers: preserving only the card
    // would still jump a 30-cat picker back to the first row on every tap.
    const nestedScroll=preserveScroll?[...p.querySelectorAll('.duo-cat-chip-list')]
      .map(list=>list.scrollTop):[];
    const expandedSkillGroups=preserveScroll?[...(before?.querySelectorAll('details.skill-extra-options')||[])]
      .map(group=>group.open):[];
    p.innerHTML = `<div class="card">${html}</div><button type="button" class="panel-dismiss" aria-label="关闭面板 / Close panel" title="关闭 / Close">×</button>`;
    if(preserveScroll){
      const after=p.querySelector(':scope > .card');
      // Keep an expanded "more unlocked skills" group open after equipping a
      // move from it. Otherwise the panel shrinks and scrollTop is clamped,
      // which looks exactly like an unexpected jump to the first screen.
      [...(after?.querySelectorAll('details.skill-extra-options')||[])].forEach((group,i)=>{
        if(i<expandedSkillGroups.length)group.open=expandedSkillGroups[i];
      });
      const restoreLists=()=>p.querySelectorAll('.duo-cat-chip-list').forEach((list,i)=>{
        list.scrollTop=nestedScroll[i]||0;
      });
      if(after)after.scrollTop=cardTop;
      p.scrollTop=panelTop;
      restoreLists();
      // iOS may apply layout after the initial DOM replacement.
      requestAnimationFrame(()=>{
        if(!p.classList.contains('open')||p.querySelector(':scope > .card')!==after)return;
        if(after)after.scrollTop=cardTop;
        p.scrollTop=panelTop;
        restoreLists();
      });
    }
    // A child page retains an explicit way home without closing the map or yard.
    if(this._navStack.length){
      const nav=document.createElement('nav');
      nav.className='panel-nav';
      nav.setAttribute('aria-label',this.isEnglish()?'Panel navigation':'页面导航');
      const back=document.createElement('button');
      back.type='button';
      back.className='panel-back';
      back.textContent=this.isEnglish()?'← Back':'← 返回上一页';
      back.setAttribute('aria-label',this.isEnglish()?'Back to previous page':'返回上一页');
      back.onclick=e=>{e.stopPropagation();this.navigateBack();};
      nav.appendChild(back);
      const card=p.querySelector('.card'),close=card.querySelector('.card-close');
      if(close)close.after(nav);else card.prepend(nav);
    }
    if(!p.querySelector('#cat-detail'))this.openCatUid=null;
    p.dataset.mandatory = 'false';
    p.classList.add('open');
    document.getElementById('map-menu')?.setAttribute('aria-expanded','false');
    // The × remains accessible regardless of card scroll position.
    p.querySelector('.panel-dismiss').onclick = e => {e.stopPropagation();this.closeAll();};
    p.onclick = e => { if (e.target === p) this.closeAll(); };
  },
  closeAll() {
    this._localePanelRoute=null;
    this.resetNavigation();
    this._teaseFromCatDetail=false;
    this._teaseStop?.();
    const panel=document.getElementById('panel');
    panel.classList.remove('open');
    delete panel.dataset.mandatory;
    this.openCatUid = null;
    document.getElementById('map-menu')?.setAttribute('aria-expanded','false');
    // Dismissing any optional overlay must never leave the yard action strip
    // hidden after a previous encounter or canceled pre-battle choice.
    if(this.game?.scene==='yard'&&!this.game.battle)this.game.showYardChrome();
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === 'yard'));
    // A pending disagreement must reappear in the yard after *any* panel is
    // dismissed. Previously refreshing while the panel was open set
    // yard-duo-status.hidden=true and never restored it after closing.
    this.game?.refreshYardSurprise?.();
    this.game?.refreshFirstQuest?.();
  },

  // ---------- roster ----------
  // ---- 工坊: 派工生产 + 繁育 (idle/placement economy) ----
  // Explain economy on its first screen: passive money is earned by the
  // staffed Sun station, stored locally, then manually collected to the wallet.
  openWorkshop() {
    if(!window.Raising){this.panel('<span class="card-close">×</span><h2>工坊</h2><p>加载中…</p>');return;}
    this.game?.completeFirstAdventureStep?.('workshop');
    const en=window.MorrowwishI18n?.get?.()!=='zh';
    const stations=Raising.stationsView().filter(st=>st.res)
      .sort((a,b)=>['sun','fishing','yarn','watch'].indexOf(a.type)-['sun','fishing','yarn','watch'].indexOf(b.type));
    const sun=stations.find(st=>st.type==='sun');
    const rate=Number(sun?.ratePerHour||0);
    const pending=stations.reduce((n,st)=>n+st.stored,0);
    const firstPay=!!(State.S.raising?.firstSunPay&&!State.S.raising?.firstSunCollected&&sun?.stored>0);
    const descriptions={
      sun:[en?'Earn coins':'晒太阳赚金币',en?'Spend coins on feeding, buildings and upgrades':'金币用于喂猫、建造、升级工坊'],
      fishing:[en?'Catch fish':'钓小鱼',en?'Fish feed cats, train levels and buy rare-cat lures':'小鱼用于喂猫、练级、买稀有诱饵'],
      yarn:[en?'Earn coins':'织物赚金币',en?'More coins for upgrades and stat training':'金币用于升级与属性特训'],
      watch:[en?'Collect luck':'瞭望好运',en?'Boost the next rare-cat sighting':'好运用于提高下一次野猫的稀有机会'],
    };
    const cards=stations.map(st=>{
      const cost=Raising.upgradeCost(st.id);
      const [name,usage]=descriptions[st.type]||[st.name,st.desc];
      const unit=st.res==='coins'?'🪙':this.resIcon(st.res);
      const wait=st.active&&st.stored<1&&st.ratePerHour>0
        ?(en?' · First unit in ~':' · 约')+Math.ceil(60/st.ratePerHour)+(en?' min':' 分钟得到首份资源'):'';
      return `<div class="st-row workshop-row ${st.type==='sun'?'work-money':''}" data-id="${st.id}">
        <div class="st-ico">${st.icon}</div>
        <div class="st-main">
          <div class="st-name">${name} <span class="tiny">${this.levelText(st.level)}</span></div>
          <p class="work-usage">${usage}</p>
          <div class="work-income">${en?'Production':'产出'}：<b>${Number(st.ratePerHour||0).toFixed(1)} ${unit}/${en?'hour':'小时'}</b></div>
          <div class="work-employee">${st.active
            ?(en?'Working cat: ':'上班猫咪：')+st.catName
            :(en?'No cat assigned — Assign one to start':'还没派猫上岗，点击「派猫」才会开始赚钱')}
            ${wait}</div>
          <div class="st-bar"><span style="width:${Math.round(st.pct*100)}%"></span></div>
          <div class="work-pending">${en?'Uncollected':'待收取'}：<b>${st.stored} ${unit}</b> / ${st.cap}</div>
        </div>
        <div class="st-btns">
          <button class="btn gold tiny-btn" data-act="collect" data-id="${st.id}" ${st.stored<1?'disabled':''}>${en?'Collect':'收取'}</button>
          <button class="btn ghost tiny-btn" data-act="assign" data-id="${st.id}">${en?'Assign':'派猫'}</button>
          <button class="btn ghost tiny-btn" data-act="upgrade" data-id="${st.id}">${en?'Upgrade':'升级'}<small>${cost.coins}🪙</small></button>
          <button class="btn ghost tiny-btn" data-act="upgrade5" data-id="${st.id}"
            ${State.S.coins<cost.coins?'disabled':''}>
            ${en?'Upgrade up to 5':'一键连升 5 级'}</button>
        </div>
      </div>`;
    }).join('');
    const breeding=Raising.breedingView?.()||{active:false};
    const breedBox=breeding.active
      ?`<div class="st-row"><div class="st-ico">🥚</div><div class="st-main"><div class="st-name">${en?'Kitten nursery':'暖窝孵化中'}</div>
       <p class="work-usage">${(breeding.parents||[]).join(' + ')} · ${Math.round((breeding.pct||0)*100)}%</p>
       <div class="st-bar"><span style="width:${Math.round((breeding.pct||0)*100)}%"></span></div></div>
       <div class="st-btns">${breeding.ready?'<button class="btn gold tiny-btn" data-act="egg">'+(en?'Welcome kitten':'抱回小猫')+'</button>':''}</div></div>`
      :`<div class="st-row"><div class="st-ico">🥚</div><div class="st-main"><div class="st-name">${en?'Kitten nursery':'暖窝繁育'}</div>
       <p class="work-usage">${en?'Breed kittens here; this station does not earn coins.':'让两只猫繁育小猫；暖窝不产金币。'}</p></div>
       <div class="st-btns"><button class="btn ghost tiny-btn" data-act="breed">${en?'Breed':'繁育'}</button></div></div>`;
    this.panel(`<span class="card-close">×</span>
      <h2>☀️ ${en?'Kitten Workshop':'猫猫工坊'}</h2>
      ${firstPay?'<div class="work-first-pay"><b>'+(en?'🎉 First shift earnings ready!':'🎉 首班工资到账！')
        +'</b><p>'+(en?'Coins are waiting at the Sun station. Collect them now!':'晒太阳位已有金币，可以马上收取。')+'</p>'
        +'<button class="btn gold" data-act="collect" data-id="st_sun">'+(en?'Collect':'领取金币')+'</button></div>':''}
      <div class="work-earn-header">
        <strong>${en?'How do I earn coins?':'工坊怎么赚钱？'}</strong>
        <p>${en
          ?'1. Assign a cat to the Sun station. 2. Coins grow online or offline. 3. Collect to move them into your wallet.'
          :'① 派猫去「晒太阳位」上班 → ② 在线、离线都积攒金币 → ③ 点击「收取」，金币才进入钱包。'}</p>
        <div class="work-earn-stats">
          <span>${en?'Income':'金币速度'} <b>${rate.toFixed(1)} 🪙/${en?'hour':'小时'}</b></span>
          <span>${en?'Wallet':'钱包'} <b>${State.S.coins} 🪙</b></span>
          <span>${en?'Uncollected':'待收'} <b>${sun?.stored||0} 🪙</b></span>
        </div>
        ${sun&&!sun.active&&State.S.cats.length?'<button class="btn gold" id="work-quick-start">'
          +(en?'Assign a cat and start earning':'一键派猫，开始赚钱')+'</button>':''}
        <button class="btn gold" data-act="collect-all" ${pending<1?'disabled':''}>${en?'Collect all ready resources':'一键收取全部收益'}</button>
      </div>
      <p class="work-section-intro">${en
        ?'The other stations produce training supplies — not coins. Every station needs its own working cat.'
        :'其他工位产出培养材料，不是金币；每个生产工位都需要一只上班猫。'}</p>
      <div class="st-list">${cards}<h3 class="work-nursery-title">${en?'Kitten nursery':'繁育暖窝'}</h3>${breedBox}</div>`);
    const host=document.getElementById('panel');
    host.querySelectorAll('[data-act]').forEach(btn=>btn.onclick=()=>this.workshopAct(btn.dataset.act,btn.dataset.id));
    const quick=document.getElementById('work-quick-start');
    if(quick)quick.onclick=()=>this.workshopAct('quick-start');
  },
  workshopAct(act,id){
    const R=window.Raising;if(!R)return;
    const en=window.MorrowwishI18n?.get?.()!=='zh';
    if(act==='collect'||act==='collect-all'){
      const got=act==='collect-all'?R.collectAll():R.collect(id);
      const total=act==='collect-all'?Object.values(got).reduce((n,v)=>n+v,0):(got?.amount||0);
      this.game.toast(total>0?(en?'Collected '+total+' resources':'已收取 '+total+' 份资源')
        :(en?'Nothing ready to collect yet':'还没产出整份资源，可以先去探索。'));
      State.save();this.game.refreshHUD();this.openWorkshop();
    }else if(act==='quick-start'){
      const sun=R.stationsView().find(st=>st.type==='sun');
      const free=State.S.cats.find(cat=>!R.isBusy(cat.uid));
      if(!sun||!free){this.game.toast(en?'No free cat available':'没有空闲猫咪，先从其他工位调出一只。');return;}
      const outcome=R.assignCat(sun.id,free.uid);
      this.game.toast(outcome?.ok
        ?(outcome.firstPay?(en?'First wages: +12 coins ready!':'首班工资 +12 金币！现在就能领取！')
          :(en?'Your cat is earning coins!':'派工成功，金币正在积攒！'))
        :(outcome?.msg||'派工失败'));
      State.save();this.openWorkshop();
    }else if(act==='upgrade'){
      const x=R.upgrade(id);
      this.game.toast(x?.ok?(en?'Upgrade complete!':'升级成功！'):(x?.msg||'资源不足'));
      State.save();this.game.refreshHUD();this.openWorkshop();
    }else if(act==='upgrade5'){
      let upgraded=0;
      for(let i=0;i<5;i++){
        const cost=R.upgradeCost(id);
        if(!cost||State.S.coins<cost.coins)break;
        const done=R.upgrade(id);
        if(!done?.ok)break;
        upgraded++;
      }
      this.game.toast(upgraded?(en?'Upgraded '+upgraded+' levels':'工坊连升 '+upgraded+' 级'):
        (en?'Not enough materials':'升级材料不足'));
      if(upgraded)State.save();
      this.game.refreshHUD();this.openWorkshop();
    }else if(act==='assign'){
      this.navigateTo(()=>this.openCatPicker(en?'Choose a working cat':'选择上工的猫',uid=>{
        const x=R.assignCat(id,uid);
        this.game.toast(x?.ok
          ?(x.firstPay?(en?'First wages +12 coins!':'首班工资 +12 金币！'):(en?'Assigned!':'派工成功！'))
          :(x?.msg||'派工失败'));
        State.save();this._navStack.pop();this._navCurrent=()=>this.openWorkshop();this.openWorkshop();
      }));
    }else if(act==='breed')this.navigateTo(()=>this.openBreedPicker());
    else if(act==='egg'){
      const x=R.collectEgg();
      if(x?.ok){
        if(x.cat){State.S.cats.push(x.cat);State.S.dex[x.cat.species]=(State.S.dex[x.cat.species]||0)+1;}
        State.save();this.game.rebuildYard();
        this.game.toast('🐱 '+(x.parents?x.parents.join('+'):'')+' 的小猫诞生了！'+(x.shiny?' ✨闪光!':''));
      }
      this.openWorkshop();
    }
  },
  openCatPicker(title, onPick) {
    const cats = State.S.cats;
    const chips = cats.map(c => { const sp = GameData.speciesById(c.species); const busy = window.Raising && Raising.isBusy && Raising.isBusy(c.uid); return `<div class="chip ${busy ? 'busy' : ''}" data-uid="${c.uid}"><canvas width="44" height="38"></canvas><div><div style="font-weight:700">${State.catName(c)}</div><div class="tiny">${busy ? '工作中' : this.levelText(c.level)}</div></div></div>`; }).join('');
    this.panel(`<span class="card-close">×</span><h2>${title}</h2><div class="roster">${chips}</div>`);
    document.querySelectorAll('#panel .chip').forEach(chip => {
      const c = cats.find(x => x.uid === chip.dataset.uid);
      CatArt.renderCatThumb(chip.querySelector('canvas'), GameData.speciesById(c.species),c);
      chip.onclick = () => onPick(chip.dataset.uid);
    });
  },
  openBreedPicker() {
    const cats = State.S.cats; this._breedSel = [];
    const render = () => {
      const chips = cats.map(c => { const sp = GameData.speciesById(c.species); const sel = this._breedSel.includes(c.uid); return `<div class="chip ${sel ? 'sel' : ''}" data-uid="${c.uid}"><canvas width="44" height="38"></canvas><div><div style="font-weight:700">${GameData.speciesName(sp)}</div><div class="tiny">${GameData.RARITY[sp.rarity].name}</div></div></div>`; }).join('');
      this.panel(`<span class="card-close">×</span><h2>🥚 选两只猫繁育</h2><p class="sub">已选 ${this._breedSel.length}/2</p><div class="roster">${chips}</div><div class="btn-row"><button class="btn gold" id="bp-go" ${this._breedSel.length === 2 ? '' : 'disabled'}>开始孵化</button></div>`);
      document.querySelectorAll('#panel .chip').forEach(chip => {
        const c = cats.find(x => x.uid === chip.dataset.uid);
        CatArt.renderCatThumb(chip.querySelector('canvas'), GameData.speciesById(c.species),c);
        chip.onclick = () => { const u = chip.dataset.uid; const i = this._breedSel.indexOf(u); if (i >= 0) this._breedSel.splice(i, 1); else if (this._breedSel.length < 2) this._breedSel.push(u); render(); };
      });
      const go = document.getElementById('bp-go'); if (go) go.onclick = () => { const r = Raising.startBreeding(this._breedSel[0], this._breedSel[1]); this.game.toast(r && r.ok ? '🥚 开始孵化！' : (r && r.msg) || '无法繁育'); State.save(); if(this._navStack.length)this._navStack.pop();this._navCurrent=()=>this.openWorkshop();this.openWorkshop(); };
    };
    render();
  },

  // ---- 🏗️ 庭院游乐设施 (buildable yard play-structures) ----
  // Spend coins to place cat trees / scratchers / caves etc. Resident cats walk
  // over and play with them, lifting their mood. Reuses the panel() + st-row UI.
  openBuild() {
    const B = window.World?.BUILDINGS || [];
    const en = window.MorrowwishI18n?.get?.() !== 'zh';
    const placed = State.S.yardBuildings || [];
    const coins = State.S.coins || 0;
    const counts = {};
    for (const p of placed) counts[p.type] = (counts[p.type] || 0) + 1;
    const cards = B.map(def => {
      const afford = coins >= def.cost;
      const owned = counts[def.id] || 0;
      const prod=window.World?.BUILDING_PRODUCTION?.[def.id];
      const title=en?(prod?.nameEn||def.name):def.name;
      const desc=en?(prod?.purposeEn||def.desc):def.desc;
      const res=prod?(' · '+(en?'Produces':'产出')+' '+(prod.kind==='fish'?'🐠':'🪙')+' ×'+prod.base+' / '+(en?'visit':'次互动')):'';
      return `<div class="st-row cb-build-blueprint-card" data-type="${def.id}">
        <canvas class="cb-build-thumb" data-building-thumb="${def.id}" width="144" height="110" aria-hidden="true"></canvas>
        <div class="st-ico">${def.icon}</div>
        <div class="st-main">
          <div class="st-name">${title}${owned ? ' <span class="tiny">×' + owned + '</span>' : ''}</div>
          <p class="work-usage">${desc}</p><div class="tiny">${res}</div>
          <div class="work-income">${en ? 'Cost' : '花费'}：<b>${def.cost} 🪙</b></div>
        </div>
        <div class="st-btns">
          <button class="btn gold tiny-btn" data-build="${def.id}" ${afford ? '' : 'disabled'}>${en ? 'Choose spot' : '选位置建造'}</button>
        </div>
      </div>`;
    }).join('');
    const placedRows = placed.map((p, i) => {
      const def = window.World?.BUILDINGS_BY_ID?.[p.type];
      if (!def) return '';
      const up=window.World?.BUILDING_PRODUCTION?.[p.type];
      const lvl=window.World?.buildingLevel?.(p)||1;
      const next=window.World?.upgradeCost?.(p);
      const benefit=up?.base*lvl||0;
      return `<div class="st-row" data-placed="${i}">
        <div class="st-ico">${def.icon}</div>
        <div class="st-main"><div class="st-name">${en?(up?.nameEn||def.name):def.name}
          <span class="tiny">Lv.${lvl}/3</span></div>
          <p class="work-usage">${en?'When cats visit, produces':'猫咪使用时产出'} ×${benefit}
          ${en?(up?.kind||'items'):(up?.name||'资源')} · ${en?'More joy at higher levels':'升级提高心情奖励'}
          · ${en?'Two cats playing builds trust':'两猫轮流玩会提升默契'}</p></div>
        <div class="st-btns">
          <button class="btn ghost tiny-btn" data-visit="${i}">${en?'Let cats play':'叫猫来玩'}</button>
          <button class="btn ghost tiny-btn" data-duo-visit="${i}" ${(window.CatRelations?.chosen?.()||[]).length===2?'':'disabled'}>${en?'Invite duo':'邀请双猫'}</button>
          <button class="btn gold tiny-btn" data-upgrade="${i}"
            ${next===null||coins<next?'disabled':''}>${next===null?(en?'Max Lv.':'已满级'):(en?'Upgrade':'升级')+' '+next+'🪙'}</button>
          <button class="btn ghost tiny-btn" data-remove="${i}">${en?'Remove':'拆除'}</button>
        </div>
      </div>`;
    }).join('');
    this.panel(`<span class="card-close">×</span>
      <div class="cb-blueprint-heading"><span aria-hidden="true">✿</span>
        <div><h2>${en ? 'My Cat Garden' : '我的猫咪庭院'}</h2>
        <small>${en?'Cozy workshop · Plan your world':'猫咪生活工坊 · 自由布置'}</small></div></div>
      <p class="sub">${en?'Choose a facility, then tap a free spot in your yard to place it. Cats physically walk over, play and earn resources.'
        :'先选设施，再点击草坪直接建造；手机可拖动调整位置。猫咪会走过去玩，产出资源和默契奖励。'}</p>
      <p class="work-income" style="margin:4px 0">${en ? 'Coins' : '金币'}：<b>${coins} 🪙</b></p>
      <div class="st-list">${cards}</div>
      ${placed.length ? '<h3 class="work-nursery-title">' + (en ? 'Placed structures' : '已建造') + '</h3>' + placedRows : ''}`);
    const host = document.getElementById('panel');
    // Render REAL facility artwork into a scene-style blueprint preview. It
    // matches what players will place in the yard instead of a misleading
    // stock picture, while the tactile card follows the cozy concept panel.
    host.querySelectorAll('canvas[data-building-thumb]').forEach(canvas=>{
      const def=World.BUILDINGS_BY_ID?.[canvas.dataset.buildingThumb];
      if(!def?.draw)return;
      const cx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
      const sky=cx.createLinearGradient(0,0,0,h);
      sky.addColorStop(0,'#f8f5e6');sky.addColorStop(.60,'#e7f2e1');sky.addColorStop(1,'#c9e0bf');
      cx.fillStyle=sky;cx.fillRect(0,0,w,h);
      cx.fillStyle='#a9cda8';cx.beginPath();cx.ellipse(w*.50,h*.94,w*.47,h*.17,0,0,Math.PI*2);cx.fill();
      def.draw(cx,w*.5,h*.89,1.15,1.3);
    });
    host.querySelectorAll('[data-build]').forEach(btn => btn.onclick = () => {
      const def = window.World?.BUILDINGS_BY_ID?.[btn.dataset.build];
      this.startBuildingPlacement(btn.dataset.build);
    });
    host.querySelectorAll('[data-visit]').forEach(btn => btn.onclick = () => {
      const b=State.S.yardBuildings?.[Number(btn.dataset.visit)];
      if(!b)return;
      const ok=this.game.yard.inviteCatToBuilding(b);
      this.closeAll();
      if(!ok)this.game.toast(en?'Catch a cat first!':'先收集猫咪，它才会过来玩！');
      else this.game.toast(en?'Look! A kitten is coming to play':'看！有猫咪跑来玩啦！');
    });
    host.querySelectorAll('[data-duo-visit]').forEach(btn=>btn.onclick=()=>{
      const b=State.S.yardBuildings?.[Number(btn.dataset.duoVisit)];
      if(!b)return;
      const ok=this.game.yard.inviteDuoToBuilding(b);
      this.closeAll();
      this.game.toast(ok?(en?'Your chosen duo is on its way.':'选中的双猫正在过来！'):
        (en?'Choose a duo that is not working or sulking.':'请选择未工作、未闹别扭的双猫。'));
    });
    host.querySelectorAll('[data-upgrade]').forEach(btn => btn.onclick = () => {
      const result=this.game.yard.upgradeStructure(+btn.dataset.upgrade);
      this.game.refreshHUD();
      this.game.toast(result.ok?(en?'Facility upgraded to Lv.':'设施升级到 Lv.')+result.level:
        (en?'Not enough coins / max level':'金币不足或已满级'));
      this.openBuild();
    });
    host.querySelectorAll('[data-remove]').forEach(btn => btn.onclick = () => {
      const refund = this.game.yard.removeStructure(+btn.dataset.remove);
      this.game.refreshHUD();
      this.game.toast((en ? '♻️ Removed · +' : '♻️ 已拆除 · 返还 ') + refund + ' 🪙');
      this.openBuild();
    });
  },

  openRoster() {
    const cats=State.S.cats||[];
    const english=window.MorrowwishI18n?.get?.()!=='zh';
    if(cats.length===0){
      this.panel(`<span class="card-close">×</span><h2>${english?'My Cats':'我的猫猫'}</h2>
        <p class="sub">${english?'Find your first cat in the yard!':'还没有猫猫，去庭院捉迷藏吧！'}</p>`);
      this.catHubTabs('solo');
      return;
    }
    // Group duplicate *individuals* under one illustrated breed card; no saved
    // cat is removed, and the group can still expose all individuals on demand.
    const speciesGroups=new Map();
    for(const cat of cats){
      if(!speciesGroups.has(cat.species))speciesGroups.set(cat.species,[]);
      speciesGroups.get(cat.species).push(cat);
    }
    const cards=[...speciesGroups.entries()].sort((a,b)=>{
      const latest=group=>Math.max(...group.map(cat=>cats.indexOf(cat)));
      return latest(b[1])-latest(a[1]);
    }).map(([id,group])=>{
      const sp=GameData.speciesById(id);
      if(!sp)return '';
      const strongest=group.reduce((best,cat)=>!best||State.catPower(cat)>State.catPower(best)?cat:best,null);
      const mastered=!!State.S.masteryBadges?.[id];
      const fresh=group.some(cat=>Array.isArray(cat.unseenSkills)&&cat.unseenSkills.length>0);
      return `<button type="button" class="dex-cell breed-group ${mastered?'golden-paw':''}" data-breed="${id}"
        aria-label="${english?'Open':'查看'} ${GameData.speciesName(sp)} ${group.length}">
        ${mastered?'<span class="golden-paw-stamp">🏅 S</span>':''}
        ${fresh?'<span class="cat-new-skill">✨ '+(english?'New skill':'新技能')+'</span>':''}
        ${group.length>1?'<span class="breed-group-count">×'+group.length+'</span>':''}
        <canvas width="90" height="76"></canvas>
        <div class="name">${GameData.speciesName(sp)}</div>
        <div class="rarity rarity-${sp.rarity}">${GameData.RARITY[sp.rarity].name}</div>
        <div class="tiny">${english?'Top Lv.':'最高等级 '}${strongest.level}</div>
      </button>`;
    }).join('');
    this.panel(`<span class="card-close">×</span>
      <h2>${english?'My Cats':'我的猫猫'} <span class="tiny">(${cats.length})</span></h2>
      <p class="sub">${english
        ?speciesGroups.size+' breeds · Duplicate cats are grouped; tap a breed to manage them.'
        :'已收集 '+speciesGroups.size+' 个品种 · 同品种合并展示，点开可管理每一只。'}</p>
      <div class="dex-grid">${cards}</div>`);
    this.catHubTabs('solo');
    document.querySelector('#panel .card')?.classList.add('cat-highlight-card');
    document.querySelectorAll('#panel [data-breed]').forEach(cell=>{
      const sp=GameData.speciesById(cell.dataset.breed);
      const group=speciesGroups.get(sp.id)||[];
      const showCat=group.reduce((best,cat)=>!best||State.catPower(cat)>State.catPower(best)?cat:best,null);
      CatArt.renderCatThumb(cell.querySelector('canvas'),sp,showCat);
      cell.addEventListener('click',()=>{
        const group=speciesGroups.get(sp.id);
        if(group.length===1)this.navigateTo(()=>this.openCatDetail(group[0]));
        else this.navigateTo(()=>this.openBreedRoster(sp,0));
      });
    });
  },

  openBreedRoster(species,page=0) {
    const english=window.MorrowwishI18n?.get?.()!=='zh';
    const all=State.S.cats.filter(cat=>cat.species===species.id)
      .sort((a,b)=>State.catPower(b)-State.catPower(a));
    const perPage=8,totalPages=Math.max(1,Math.ceil(all.length/perPage));
    const current=Math.min(Math.max(0,page),totalPages-1);
    const safe=str=>String(str??'').replace(/[&<>"']/g,ch=>({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    })[ch]);
    const rows=all.slice(current*perPage,(current+1)*perPage).map(cat=>
      `<button type="button" class="breed-member" data-cat-uid="${safe(cat.uid)}">
        <canvas width="68" height="56"></canvas>
        <span><strong>${safe(State.catName(cat))}</strong><small>${this.levelText(cat.level)} · ❤ ${Math.round(cat.affinity)}
          · ⚔ ${State.catPower(cat)}${cat.shiny?' · ✨':''}</small></span>
        <span aria-hidden="true">›</span>
      </button>`).join('');
    this.panel(`<span class="card-close">×</span>
      <h2>${GameData.speciesName(species)} <span class="tiny">×${all.length}</span></h2>
      <p class="sub">${english?'Every individual is kept. Choose one to train or bond.'
        :'所有猫猫均已保留，选择其中一只进行培养和互动。'}</p>
      <div class="breed-member-list">${rows}</div>
      <div class="btn-row" style="justify-content:center">
        <button class="btn" id="breed-prev" ${current===0?'disabled':''}>‹</button>
        <span class="tiny">${current+1}/${totalPages}</span>
        <button class="btn" id="breed-next" ${current===totalPages-1?'disabled':''}>›</button>
        <button class="btn ghost" id="breed-back">${english?'All breeds':'返回品种'}</button>
      </div>`);
    document.querySelector('#panel .card')?.classList.add('cat-highlight-card');
    document.querySelectorAll('#panel [data-cat-uid]').forEach(button=>{
      const cat=all.find(v=>v.uid===button.dataset.catUid);
      if(!cat)return;
      CatArt.renderCatThumb(button.querySelector('canvas'),species,cat);
      button.onclick=()=>this.navigateTo(()=>this.openCatDetail(cat));
    });
    document.getElementById('breed-prev').onclick=()=>this.openBreedRoster(species,current-1);
    document.getElementById('breed-next').onclick=()=>this.openBreedRoster(species,current+1);
    document.getElementById('breed-back').onclick=()=>this._navStack.length?this.navigateBack():this.openRoster();
  },

  openCatDetail(cat) {
    this.openCatUid = cat.uid;
    this.panel(`<span class="card-close">×</span><div id="cat-detail"></div>`);
    this.renderCatDetail(cat);
  },

  renderCatDetail(cat) {
    const host = document.getElementById('cat-detail');
    if (!host) return;
    const sp = GameData.speciesById(cat.species);
    const rar = GameData.RARITY[sp.rarity];
    const need = State.xpToNext(cat.level);
    const tier = State.bondTier(cat);
    const tierText = ['路人', '熟悉', '亲密', '灵魂纽带'][tier];
    const feedCost = 1, playCost = 0;
    const dispName = State.catName(cat);
    const xpPerFeed = 20 + cat.level * 12;
    const fishToNext = Math.max(1, Math.ceil(Math.max(0, need - (cat.xp || 0)) / xpPerFeed)) * 3;
    const sub = cat.nickname ? ` <span class="tiny" style="font-weight:400">· ${GameData.speciesName(sp)}</span>` : '';
    const en=window.MorrowwishI18n?.get?.()!=='zh';
    // Never expose internal English save IDs (clever, diligent, fortune,
    // none...) as player-facing prose. Hidden traits must remain secret
    // until discovery rather than leaking through this stats summary.
    const personalityNamesEn={
      glutton:'Food-loving',diligent:'Diligent',lazy:'Laid-back',
      clever:'Clever',gentle:'Gentle',shy:'Shy',mischievous:'Mischievous'
    };
    const traitNamesEn={
      none:'None',goldpaw:'Golden Paw',angler:'Angler',weaver:'Weaver',
      charm:'Charmer',warrior:'Warrior',fortune:'Lucky Star'
    };
    const personalityLabel=cat.personality
      ?(en?(personalityNamesEn[cat.personality]||'Unknown')
        :(window.Raising?.PERSONALITIES?.[cat.personality]?.name||'未知'))
      :null;
    const traitLabel=cat.trait
      ?(cat.trait==='none'?(en?'None':'—')
        :!cat.traitRevealed?(en?'Undiscovered':'未揭晓')
        :en?(traitNamesEn[cat.trait]||'Unknown')
        :(window.Raising?.TRAITS?.[cat.trait]?.name||'未知'))
      :null;
    const facts=this.battleCatFacts(cat);
    const primary=window.Skills?.elementOf?.(cat.species)||'light';
    const secondary=window.Skills?.secondaryOf?.(cat)||null;
    // Use the combat system's actual element names, not independently
    // authored Chinese labels which can diverge from the skill rules.
    const namesEn={fire:'Fire',water:'Water',grass:'Nature',
      elec:'Lightning',dark:'Shadow',light:'Light'};
    const glyphs={fire:'🔥',water:'💧',grass:'🌿',
      elec:'⚡',dark:'🌙',light:'✨'};
    const elLabel=id=>(glyphs[id]||'✨')+' '+(en
      ?(namesEn[id]||id)
      :(window.Skills?.ELEMENTS?.[id]?.name||id));
    const sideCap=window.Skills?.secondaryLimit?.(cat)||0;
    const sideChoices=window.Skills?.secondaryChoices?.(cat)||[];
    const sideUnlocked=sideChoices.slice(0,sideCap);
    const battleMetric=(name,value)=>'<div class="cat-detail-metric"><span>'+name+
      '</span><strong>'+value+'</strong></div>';
    host.innerHTML = `
      <h2>${dispName}${sub} <span class="rarity-${sp.rarity}">◆${rar.name}</span> <span id="cd-rename" style="cursor:pointer;font-size:0.9rem" title="起名">✏️</span></h2>
      <p class="sub">${sp.desc}</p>
      ${window.Skills?'<p class="cat-skill-roadmap">✨ '+Skills.progressionHint(cat)+'</p>':''}
      ${State.S.masteryBadges?.[sp.id]
        ?'<p class="mastery-detail">🏅 '+(window.MorrowwishI18n?.get?.()==='zh'
          ?'金爪徽章已解锁 · 每三枚提高永久寻猫运气':'Golden Paw earned · Every 3 improve rare-cat odds')+'</p>':''}
      <div style="display:flex;gap:16px;align-items:center;">
        <canvas id="cd-canvas" width="120" height="100" style="background:rgba(255,255,255,0.04);border-radius:12px;"></canvas>
        <div style="flex:1">
          <div class="stat-row"><span class="label">等级</span><span class="val" style="width:auto">${this.levelText(cat.level)}</span></div>
          <div class="stat-row"><span class="label">经验</span><div class="bar xp"><span style="width:${Math.round(cat.xp / need * 100)}%"></span></div><span class="val">${Math.round(cat.xp)}/${need}</span></div>
          <div class="stat-row"><span class="label">好感 (${tierText})</span><div class="bar aff"><span style="width:${cat.affinity}%"></span></div><span class="val">${Math.round(cat.affinity)}</span></div>
        </div>
      </div>
      <section class="cat-detail-combat-stats" aria-label="${en?'Cat attributes and battle statistics':'猫猫属性与战斗数值'}">
        <h3>${en?'Cat attributes':'猫猫属性'}</h3>
        <div class="cat-detail-element-row">
          <span><strong>${en?'Primary':'主属性'}：</strong>${elLabel(primary)}</span>
          <span><strong>${en?'Secondary':'副属性'}：</strong>${secondary?elLabel(secondary):(en?'None':'—')}</span>
        </div>
        <p class="tiny cat-detail-side-hint">
          ${secondary
            ?(en?'Secondary moves':'副属性技能')+'：'+sideCap+'/'+sideChoices.length+
              (sideCap===0?(en?' · First move: capture a friend or Lv.4':' · 首次收服伙伴或 Lv.4 解锁第一招'):
               sideCap<2?(en?' · Second move: Lv.12 + affinity 60':' · 第二招需 Lv.12 且好感达到 60'):'')+
              (sideUnlocked.length?' · '+sideUnlocked.map(s=>s.name).join(' / '):'')
            :(en?'Single-element specialist · no cross-element abilities':
              '单属性专精 · 不会学习其他元素技能')}
        </p>
        <div class="cat-detail-stat-grid">
          ${statLine(en?'Power':'力量',cat.stats.pow)}
          ${statLine(en?'Agility':'敏捷',cat.stats.agi)}
          ${statLine(en?'Vitality':'体力',cat.stats.vit)}
          ${statLine(en?'Charm':'魅力',cat.stats.cha)}
        </div>
        <h3>${en?'Battle stats':'战斗数值'}</h3>
        <div class="cat-detail-stat-grid">
          ${battleMetric(en?'HP':'生命',facts.hp+'/'+facts.maxHp)}
          ${battleMetric(en?'Base damage':'基础伤害',facts.damage)}
          ${battleMetric(en?'Move speed':'移动速度',facts.speed)}
          ${battleMetric(en?'Battle power':'战力',facts.power)}
        </div>
        ${facts.wounded?'<p class="squad-health-warning">'+(en?'Injured; recover before battle':'负伤中，建议战前恢复')+'</p>':''}
      </section>
      <div class="stat-row" style="margin-top:12px"><span class="label">饱食</span><div class="bar hp"><span style="width:${cat.hunger}%"></span></div><span class="val">${Math.round(cat.hunger)}</span></div>
      <div class="stat-row"><span class="label">心情</span><div class="bar aff"><span style="width:${cat.joy}%"></span></div><span class="val">${Math.round(cat.joy)}</span></div>
      <p class="tiny cat-traits-summary" style="margin-top:8px">${en?'Power':'战力'} ⚔ ${State.catPower(cat)}${personalityLabel ? ' · '+(en?'Personality':'性格')+': '+personalityLabel : ''}${traitLabel ? ' · '+(en?'Trait':'特性')+': '+traitLabel : ''}</p>
      ${this.speciesEvoRowHtml(cat)}
      <div class="cb-grow" aria-label="猫咪养成">
        <div class="cb-grow-grid">
          <section class="cb-grow-section" aria-labelledby="cb-grow-level-title">
            <h3 id="cb-grow-level-title">⬆ 升级</h3>
            <p class="cb-grow-help">增加等级，解锁技能</p>
            <button type="button" class="btn gold cb-grow-action" id="cd-trainnext"><strong>⬆ 一键升级</strong><small>直升下一级 · 消耗 🐠${fishToNext}</small></button>
          </section>
          <section class="cb-grow-section" aria-labelledby="cb-grow-stat-title">
            <h3 id="cb-grow-stat-title">✨ 特训</h3>
            <p class="cb-grow-help">四项属性永久 +1</p>
            <button type="button" class="btn cb-grow-action" id="cd-trainstat"><strong>特训 1 次</strong><small>消耗 🪙80</small></button>
          </section>
          <section class="cb-grow-section cb-grow-interact" aria-labelledby="cb-grow-bond-title">
            <h3 id="cb-grow-bond-title">🐾 互动</h3>
            <p class="cb-grow-help">陪伴猫猫，提升好感和心情</p>
            <div class="cb-grow-interactions">
              <button type="button" class="btn ghost cb-grow-action" id="cd-pet"><strong>🤲 摸摸</strong><small>好感 +3</small></button>
              <button type="button" class="btn ghost cb-grow-action" id="cd-feed"><strong>🐟 喂小鱼干</strong><small>1🐠 · 好感 +8</small></button>
              <button type="button" class="btn ghost cb-grow-action" id="cd-tease"><strong>🪶 逗猫</strong><small>玩小游戏</small></button>
            </div>
          </section>
        </div>
        <details class="cb-grow-more" id="cd-grow-more" ${this._catGrowMore===cat.uid?'open':''}>
          <summary>更多培养方式</summary>
          <div class="cb-grow-advanced">
            <button type="button" class="btn ghost cb-grow-action" id="cd-trainxp"><strong>🐠 补充经验</strong><small>3🐠 · +${xpPerFeed}经验</small></button>
            <button type="button" class="btn ghost cb-grow-action" id="cd-stat-ten"><strong>✨ 连续特训</strong><small>最多 10 次 · 每次 80🪙</small></button>
          </div>
        </details>
      </div>
      <button type="button" class="cb-grow-skills" id="cd-skills">📖 查看与搭配技能 <span aria-hidden="true">›</span></button>`;
    // animated preview
    const cv = document.getElementById('cd-canvas');
    const cx = cv.getContext('2d');
    let tt = 0;
    const anim = () => {
      if (this.openCatUid !== cat.uid) return;
      tt += 0.03; cx.clearRect(0, 0, 120, 100);
      (window.CatMotion?.draw||CatArt.drawCat)(cx,60,70,{
        species:sp,scale:1.05,face:1,t:tt,pose:'play',
        mood:cat.joy>60?'happy':'neutral',
        growth:window.Growth?Growth.visual(cat):null
      });
      requestAnimationFrame(anim);
    };
    anim();
    document.getElementById('cd-pet').onclick = () => {
      const old=new Set(window.Skills?.learnableSkills(cat).map(sk=>sk.id)||[]);
      cat.affinity = Math.min(100, cat.affinity + 3); cat.joy = Math.min(100, cat.joy + 4);
      window.MorrowwishAudio?.effect?.('pet');
      State.addXp(cat, 4);
      const unlocked=this.announceSkillMilestone(cat,old);
      State.save();this.renderCatDetail(cat);
      this.game.toast(unlocked?'✨ 学会新技能：'+unlocked.name+'！':'❤ 好感提升');
    };
    document.getElementById('cd-feed').onclick = () => {
      if (State.S.fish < feedCost) { this.game.toast('小鱼干不足'); return; }
      State.S.fish -= feedCost; cat.hunger = Math.min(100, cat.hunger + 35); cat.joy = Math.min(100, cat.joy + 8);
      const old=new Set(window.Skills?.learnableSkills(cat).map(sk=>sk.id)||[]);
      cat.affinity = Math.min(100, cat.affinity + 8); State.addXp(cat, 6);
      window.MorrowwishAudio?.effect?.('feed');
      const unlocked=this.announceSkillMilestone(cat,old);
      State.save();this.game.refreshHUD();this.renderCatDetail(cat);
      this.game.toast(unlocked?'✨ 学会新技能：'+unlocked.name+'！':'🍖 吃得好开心');
    };
    document.getElementById('cd-tease').onclick = () => this.navigateTo(()=>this.openTease(cat));
    document.getElementById('cd-skills').onclick = () => this.navigateTo(()=>this.openSkillEditor(cat));
    // 培养: fish → XP (scaled to level so it stays useful), coins → permanent stats
    document.getElementById('cd-trainxp').onclick = () => {
      if (State.S.fish < 3) { this.game.toast('小鱼不足（去钓鱼位产出）'); return; }
      const old=new Set(window.Skills?.learnableSkills(cat).map(sk=>sk.id)||[]);
      State.S.fish -= 3;
      const gain = 20 + cat.level * 12;        // scales so high-level cats still progress
      const lv = State.addXp(cat, gain);
      cat.hunger = Math.min(100, cat.hunger + 20);
      const unlocked=this.announceSkillMilestone(cat,old);
      State.save();this.game.refreshHUD();this.renderCatDetail(cat);
      this.game.toast(unlocked?'✨ '+State.catName(cat)+' 学会 '+unlocked.name+'！'
        :(lv?`🎉 ${this.levelText(cat.level)}！(+${gain}经验)`:`🐠 +${gain} 经验`));
    };
    document.getElementById('cd-trainstat').onclick = () => {
      // Stat training now costs 🪙 coins (old yarn cost ×10 scale).
      if ((State.S.coins || 0) < 80) { this.game.toast('金币不足（去工坊赚金币）'); return; }
      State.S.coins -= 80;
      cat.stats.pow += 1; cat.stats.agi += 1; cat.stats.vit += 1; cat.stats.cha += 1;
      State.save(); this.game.refreshHUD(); this.renderCatDetail(cat);
      this.game.toast(this.isEnglish()?'🪙 Training complete! All four stats +1':'🪙 特训完成！全属性 +1');
    };
    document.getElementById('cd-grow-more')?.addEventListener('toggle',e=>{
      if(e.currentTarget===document.getElementById('cd-grow-more'))this._catGrowMore=e.currentTarget.open?cat.uid:null;
    });
    document.getElementById('cd-trainnext').onclick=()=>this.quickTrainCat(cat);
    document.getElementById('cd-stat-ten').onclick=()=>this.quickStatCat(cat,10);
    const renameBtn = document.getElementById('cd-rename');
    if (renameBtn) renameBtn.onclick = () => {
      const cur = cat.nickname || '';
      const name = (window.prompt('给它起个名字吧（最多6字）', cur) || '').trim().slice(0, 6);
      if (name !== null && name !== cur) { cat.nickname = name; State.save(); this.renderCatDetail(cat); this.game.toast(name ? '💛 ' + name + '，就是你啦！' : '已还原名字'); }
    };
    const evoBtn = document.getElementById('cd-evolve');
    if (evoBtn) evoBtn.onclick = () => this.doEvolve(cat);
  },
  // One-tap upgrade advances exactly one level, spending the required fish.
  quickTrainCat(cat){
    const limit=1;
    const was=cat.level;
    const old=new Set(window.Skills?.learnableSkills(cat).map(sk=>sk.id)||[]);
    let paid=0;
    for(let i=0;i<limit;i++){
      const needed=Math.max(0,State.xpToNext(cat.level)-(cat.xp||0));
      const per=20+cat.level*12;
      const sets=Math.max(1,Math.ceil(needed/per));
      const fishCost=sets*3;
      if(!Number.isSafeInteger(fishCost)||State.S.fish<fishCost)break;
      State.S.fish-=fishCost;paid+=fishCost;
      State.addXp(cat,sets*per);
      cat.hunger=Math.min(100,(cat.hunger||0)+20);
    }
    if(cat.level===was){
      this.game.toast(this.isEnglish()?'🐟 Not enough fish to reach the next level':'🐟 小鱼干不足以升满下一级');return 0;
    }
    const learned=this.announceSkillMilestone(cat,old);
    State.save();this.game.refreshHUD();this.renderCatDetail(cat);
    this.game.toast(this.isEnglish()?
      ('⬆ '+State.catName(cat)+' Lv.'+was+' → Lv.'+cat.level+' · Cost '+paid+'🐟'+(learned?' · Unlocked '+learned.name:'')):
      ('⬆ '+State.catName(cat)+' '+was+' → '+cat.level+'级 · 消耗'+paid+'🐟'+(learned?' · 解锁'+learned.name:'')));
    return cat.level-was;
  },
  quickStatCat(cat,batches=10){
    // 2-currency: stat-training now costs 🪙 coins (毛线 folded into coins, ×80/batch).
    const coins=State.S.coins||0, per=80;
    const times=Math.min(10,Math.max(0,Math.floor(coins/per)),Math.max(0,Math.floor(batches)));
    if(!times){this.game.toast('🪙 金币不足');return 0;}
    State.S.coins-=per*times;
    for(const k of ['pow','agi','vit','cha'])cat.stats[k]+=times;
    State.save();this.game.refreshHUD();this.renderCatDetail(cat);
    this.game.toast(this.isEnglish()?'🪙 Training ×'+times+' · All four stats +'+times:'🪙 特训 ×'+times+' · 四项属性均 +'+times);
    return times;
  },
  // species 蜕变 (the rarer, flavor evolution that swaps species)
  speciesEvoRowHtml(cat) {
    const S = window.Skills; if (!S || !S.evolutionOf) return '';
    const evo = S.evolutionOf(cat.species); if (!evo) return '';
    const toSp = GameData.speciesById(evo.evolvesTo);
    const req = evo.req || {};
    const lvlOk = cat.level >= (req.level || 0);
    const bondOk = (cat.affinity || 0) >= (req.bond || 0);
    const itemOk = !req.item || ((State.S.evoStones && State.S.evoStones[req.item]) > 0);
    const ready = lvlOk && bondOk && itemOk;
    const reqStr = [
      `${this.levelText(req.level)}${lvlOk ? '✓' : `(当前${cat.level})`}`,
      `好感${req.bond}${bondOk ? '✓' : ''}`,
      req.item ? `${req.item}×1${itemOk ? '✓' : '(缺)'}` : null,
    ].filter(Boolean).join(' · ');
    return `<div class="evo-row ${ready ? 'ready' : ''}">
      <div class="evo-info">🦋 可蜕变为 <b>${GameData.speciesName(toSp)}</b><div class="tiny">特殊变身 · ${reqStr}</div></div>
      <button class="btn ${ready ? 'gold' : ''}" id="cd-evolve" ${ready ? '' : 'disabled'}>蜕变</button>
    </div>`;
  },
  // ---- 技能搭配: learn & swap each loadout slot ----
  // Reveal only actual NEW unlocks; regular XP and affection taps stay quiet.
  // Automatic loadouts update when the player crosses a milestone, but
  // custom player selections are never replaced.
  announceSkillMilestone(cat,previous){
    if(!window.Skills||!previous)return null;
    const available=Skills.learnableSkills(cat);
    const unlocked=available.filter(sk=>!previous.has(sk.id));
    if(!unlocked.length)return null;
    Skills.ensureLoadout(cat);
    const chosen=unlocked.find(sk=>sk.ultCost>0)
      ||unlocked.find(sk=>['dash','heal','buff'].includes(sk.kind))||unlocked[0];
    if(!Array.isArray(cat.unseenSkills))cat.unseenSkills=[];
    if(!cat.unseenSkills.includes(chosen.id))cat.unseenSkills.push(chosen.id);
    window.arcadeMetric?.('bond_skill_unlocked',{breed:cat.species,skill:chosen.id,source:'growth'});
    return chosen;
  },

  openSkillEditor(cat,preserveScroll=false) {
    const S = window.Skills; if (!S) { this.openCatDetail(cat); return; }
    S.ensureLoadout(cat);
    const learn = S.learnableSkills(cat) || [];          // skills actually unlocked
    // Slot 0 (普攻) defaults to the innate cat-toy toss, but the player MAY slot a
    // low-power attack skill (incl. 烈焰猫爪) as their left-click basic. Only
    // basic-eligible skills show up as options; the toy toss is always available.
    const en0 = window.MorrowwishI18n?.get?.() !== 'zh';
    const icon0 = sk => this.game.skillIcon ? this.game.skillIcon(sk) : '🐾';
    const kindName0 = { melee: '近战', projectile: '远程', dash: '突进', pounce: '飞扑', chain: '连锁' };
    const basicOpts = (S.basicChoices ? S.basicChoices(cat) : []);
    const curBasic = cat.loadout[0] ? S.skillById(cat.loadout[0]) : null;
    const toyOn = !curBasic ? 'on' : '';
    const toyChip = `<button class="sk-chip ${toyOn}" data-slot="0" data-sk="__toy__" title="${en0?'Innate fluff attack':'固有毛球攻击'}">🧶 ${en0?'Fluff Attack':'毛球出击'}<span class="tiny">${en0?'innate':'固有'}</span></button>`;
    const basicChips = toyChip + basicOpts.map(s => {
      const on = curBasic && s.id === curBasic.id ? 'on' : '';
      return `<button class="sk-chip ${on}" data-slot="0" data-sk="${s.id}" title="${s.desc || ''}">${icon0(s)} ${s.name}<span class="tiny">${kindName0[s.kind] || ''}·${this.game.elemIcon(s.element)}</span></button>`;
    }).join('');
    const basicRow = `<div class="sk-slot"><div class="sk-slot-label">${en0?'Basic':'普攻'}<div class="tiny">${curBasic ? curBasic.name : (en0?'Fluff Attack':'毛球出击')}</div></div><div class="sk-opts">${basicChips}</div></div>`;
    const slots = [
      { i: 1, label: '技能1', kinds: ['melee', 'projectile', 'dash', 'leap', 'pounce', 'chain', 'buff', 'heal', 'aoe', 'beam'] },
      { i: 2, label: '技能2', kinds: ['melee', 'projectile', 'dash', 'leap', 'pounce', 'chain', 'buff', 'heal', 'aoe', 'beam'] },
      { i: 3, label: '必杀', kinds: ['aoe'], ult: true },
    ];
    const icon = sk => this.game.skillIcon ? this.game.skillIcon(sk) : '🐾';
    const kindName = { melee: '近战', projectile: '远程', dash: '突进', leap: '跃击', pounce: '飞扑', chain: '连锁', beam: '持续', buff: '增益', heal: '治疗', aoe: '范围' };
    const rows = basicRow + slots.map(slot => {
      const cur = S.skillById(cat.loadout[slot.i]);
      // candidates: learnable, matching the slot's allowed kinds, ult-slot only ults
      const opts = learn.filter(s => (slot.ult ? s.ultCost > 0 : s.ultCost === 0) && slot.kinds.indexOf(s.kind) >= 0);
      // Keep the entire unlocked library, but make the default view usable on phones.
      // Prioritize the equipped skill, an option matching the selected build,
      // and distinctive hand-authored skills over the generic fallback templates.
      const role=cat.buildType||S.buildTypeForBreed?.(cat)||'dps';
      const recommended=S.recommendLoadout?.(cat,role)||[];
      const score=sk=>{
        if(sk.id===cat.loadout[slot.i])return 100;
        if(sk.id===recommended[slot.i])return 90;
        let val=sk.generic?0:12;
        if(S.upgradeBaseOf?.(sk.id))val+=5;
        if(sk.element===S.elementOf(cat.species))val+=2;
        if(role==='dps'&&['projectile','chain','beam'].includes(sk.kind))val+=4;
        if(role==='tank'&&(sk.shieldType||sk.kind==='heal'))val+=5;
        if(role==='support'&&['buff','heal'].includes(sk.kind))val+=5;
        if(['assassin','fighter'].includes(role)&&['melee','pounce','dash','leap'].includes(sk.kind))val+=4;
        if(role==='control'&&['bind','dizzy','blind','chill'].some(t=>[sk.appliesTag].flat().includes(t)))val+=5;
        return val;
      };
      const ordered=opts.slice().sort((a,b)=>score(b)-score(a));
      const featured=ordered.slice(0,slot.ult?4:6);
      const extra=ordered.filter(sk=>!featured.includes(sk));
      const chip=sk=>{
        const on=cur&&sk.id===cur.id;
        const base=S.upgradeBaseOf?.(sk.id);
        const baseSk=base?S.skillById(base):null;
        const upgrade=baseSk?`<span class="tiny sk-up">⬆${baseSk.name}</span>`:'';
        // Mobile can't hover tooltips: show distinct elemental ward strengths
        // and utility directly on the equipment chip.
        const wardInfo=sk.shieldType==='barrier'
          ?`${Math.round((sk.wardReduction??.45)*100)}%${en0?' DR':'减伤'} · ${sk.wardDuration||4.8}s${sk.wardRetaliateBurn?(en0?' · Burn':' · 反灼'):sk.wardRegenPct?(en0?' · Regen':' · 回血'):''}`
          :'';
        return `<button class="sk-chip ${on?'on':''}" data-slot="${slot.i}" data-sk="${sk.id}" title="${sk.desc||''}">${icon(sk)} ${sk.name}<span class="tiny">${kindName[sk.kind]||''}·${this.game.elemIcon(sk.element)}${wardInfo?' · '+wardInfo:''}</span>${upgrade}</button>`;
      };
      const chips=featured.map(chip).join('')||
        '<span class="tiny">暂无可选（提升等级/好感解锁）</span>';
      const more=extra.length
        ?`<details class="skill-extra-options"><summary class="tiny">${en0?'More unlocked skills':'展开其他已解锁技能'} (${extra.length})</summary><div class="sk-opts">${extra.map(chip).join('')}</div></details>`
        :'';
      return `<div class="sk-slot"><div class="sk-slot-label">${slot.label}<div class="tiny">${cur?cur.name:'空'}</div></div><div class="sk-opts">${chips}</div>${more}</div>`;
    }).join('');
    // ---- 一键配装 (按品种 + 流派自动推荐) ----
    // Six build types; the one that best fits this breed's stats is marked 推荐.
    // Clicking a build re-equips Q/E (and keeps the element ult) for that role.
    const suggested = S.buildTypeForBreed ? S.buildTypeForBreed(cat) : null;
    const curBuild = cat.buildType || null;
    const buildChips = (S.BUILD_ORDER || []).map(role => {
      const b = S.BUILD_TYPES[role];
      const on = curBuild === role ? 'on' : '';
      const rec = role === suggested ? `<span class="tiny">${en0?'suggested':'推荐'}</span>` : '';
      const proposal=S.recommendLoadout(cat,role);
      const unchanged=proposal[1]===cat.loadout[1]&&proposal[2]===cat.loadout[2];
      const qName=S.skillById(proposal[1])?.name||(en0?'Empty':'空');
      const eName=S.skillById(proposal[2])?.name||(en0?'Empty':'空');
      const preview=`${qName} / ${eName}`;
      const same=unchanged?`<span class="tiny">${en0?'Same skills':'技能不变'}</span>`:'';
      return `<button class="sk-chip build-chip ${on}" data-build="${role}" title="${en0?b.en:b.zh} · ${preview}">${b.icon} ${en0?b.en:b.zh}${rec}<span class="tiny">${preview}</span>${same}</button>`;
    }).join('');
    const buildRow = `<div class="sk-slot build-row"><div class="sk-slot-label">${en0?'Auto build':'一键配装'}<div class="tiny">${en0?'by breed + role':'按品种 + 流派'}</div></div><div class="sk-opts">${buildChips}</div></div>`;
    this.panel(`<span class="card-close">×</span>
      <h2>📖 ${State.catName(cat)} · 技能搭配</h2>
      <p class="sub">已解锁 ${learn.length} 种技能 · 点击替换 Q / E / 必杀。每只猫拥有不同的元素技能与解锁路线。</p>
      <p class="skill-roadmap">✨ ${S.progressionHint(cat)}</p>
      <p class="skill-progression-note">普通猫通过升级与好感解锁元素必杀；SR / SSR 更早解锁专属必杀。能量充满后按 R 或点击右下角释放。</p>
      <div class="sk-list">${buildRow}${rows}</div>
      <div class="btn-row"><button class="btn" id="sk-trainer">🎓 ${en0?'Learn new skills':'学习新技能'}</button><button class="btn gold" id="sk-back">← 返回</button></div>`,preserveScroll);
    document.querySelectorAll('#panel .build-chip').forEach(b => b.onclick = () => {
      const role = b.dataset.build;
      const before=(cat.loadout||[]).slice();
      if (S.applyBuild) S.applyBuild(cat, role);
      const changed=before[1]!==cat.loadout?.[1]||before[2]!==cat.loadout?.[2];
      State.save(); this.openSkillEditor(cat,true);
      const bt = S.BUILD_TYPES[role];
      this.game.toast(changed
        ?((en0?'Equipped ':'已切换')+(en0?bt.en:bt.zh)+' · '+['Q','E'].map((slot,i)=>slot+': '+(S.skillById(cat.loadout[i+1])?.name||(en0?'Empty':'空'))).join(' / '))
        :(en0?'This build uses the same unlocked Q/E skills; learn more skills to diversify.'
          :'当前已解锁技能不足，这个流派的 Q/E 配装与原来相同；可先学习更多技能。'));
      window.arcadeMetric?.('bond_build_applied', { breed: cat.species, build: role, changed });
    });
    // Build chips have their own click handler; never overwrite it with the
    // ordinary slot handler when binding choices below.
    document.querySelectorAll('#panel .sk-chip:not(.build-chip)').forEach(b => b.onclick = () => {
      // Only real skill choices carry data-sk.
      if (b.dataset.build != null || b.dataset.sk == null) return;
      const slotI = +b.dataset.slot, skId = b.dataset.sk;
      cat.loadout = cat.loadout.slice();
      // Slot 0 basic: "__toy__" = revert to the innate toy toss (null).
      if (slotI === 0 && skId === '__toy__') {
        cat.loadout[0] = null;
        cat.skillEdited = true;
        State.save(); this.openSkillEditor(cat,true);
        this.game.toast(en0 ? 'Basic: toy toss' : '普攻：扔玩具');
        return;
      }
      cat.loadout[slotI] = skId;
      cat.skillEdited=true;
      State.save(); this.openSkillEditor(cat,true);
      this.game.toast('已装备 ' + (S.skillById(skId) || {}).name);
    });
    document.getElementById('sk-trainer').onclick = () => this.navigateTo(()=>this.openTrainer(cat));
    document.getElementById('sk-back').onclick = () => this._navStack.length?this.navigateBack():this.openCatDetail(cat);
  },
  // ---- 技能训练师: learn GATED skills (付费 / 等级 / 亲密 / 品种 / 领悟) ----
  // Shows every gated skill the cat hasn't learned yet, split into "ready to
  // learn" (its non-cost gate is met) and "still locked" (shows the condition).
  // Paying deducts the right currency; pure non-cost gates auto-learn on meeting
  // their condition elsewhere, but remain here as a visible Learn action too.
  openTrainer(cat) {
    const S = window.Skills; if (!S) { this.openCatDetail(cat); return; }
    const en = window.MorrowwishI18n?.get?.() !== 'zh';
    S.autoLearn(cat);
    const { ready, locked } = S.trainerSkills(cat);
    const icon = sk => this.game.skillIcon ? this.game.skillIcon(sk) : '🐾';
    const kindName = en
      ? { melee:'Melee', projectile:'Ranged', dash:'Dash', leap:'Leap', pounce:'Pounce', chain:'Chain', beam:'Beam', buff:'Buff', heal:'Heal', aoe:'AoE' }
      : { melee:'近战', projectile:'远程', dash:'突进', leap:'跃击', pounce:'飞扑', chain:'连锁', beam:'持续', buff:'增益', heal:'治疗', aoe:'范围' };
    // Describe a skill's unlock condition as a short bilingual line + status.
    const condLine = (sk) => this.skillUnlockText(cat, sk);
    const costLabel = (cost) => {
      if (!cost) return '';
      const parts = [];
      if (cost.coins) parts.push('🪙' + cost.coins);
      if (cost.fish) parts.push('🐠' + cost.fish);
      return parts.join(' ');
    };
    const card = (sk, canBuy) => {
      const cost = sk.unlock.cost;
      const btn = cost
        ? `<button class="btn ${canBuy?'gold':''}" data-learn="${sk.id}" ${canBuy?'':'disabled'}>${en?'Learn':'学习'} ${costLabel(cost)}</button>`
        : `<button class="btn gold" data-learn="${sk.id}">${en?'Learn now':'立即领悟'}</button>`;
      return `<div class="sk-slot trainer-skill"><div class="sk-slot-label">${icon(sk)} ${sk.name}
        <div class="tiny">${kindName[sk.kind]||''} · ${this.game.elemIcon(sk.element)}${sk.ultCost>0?(en?' · Ultimate':' · 必杀'):''}</div></div>
        <div class="sk-opts"><div class="tiny trainer-cond">${condLine(sk)}</div>${sk.desc?`<div class="tiny">${sk.desc}</div>`:''}${btn}</div></div>`;
    };
    const readyHtml = ready.length
      ? ready.map(sk => card(sk, this.canAffordSkill(sk))).join('')
      : `<p class="tiny">${en?'No skills ready to learn right now.':'暂时没有可学习的技能。'}</p>`;
    const lockedHtml = locked.length
      ? `<h3 class="tiny" style="margin:10px 0 4px">${en?'Still locked':'尚未满足条件'}</h3>` +
        locked.map(sk => `<div class="sk-slot trainer-skill locked"><div class="sk-slot-label">${icon(sk)} ${sk.name}
          <div class="tiny">${kindName[sk.kind]||''} · ${this.game.elemIcon(sk.element)}</div></div>
          <div class="sk-opts"><div class="tiny trainer-cond">🔒 ${condLine(sk)}</div></div></div>`).join('')
      : '';
    this.panel(`<span class="card-close">×</span>
      <h2>🎓 ${State.catName(cat)} · ${en?'Skill Trainer':'技能训练师'}</h2>
      <p class="sub">${en?'Powerful skills must be learned — pay a trainer, reach a level or affinity, match a breed, or fulfil a 领悟 condition.':'强力技能需要习得：付费学习、达到等级或亲密、成为特定品种，或完成领悟条件。'}</p>
      <div class="sk-list">${readyHtml}${lockedHtml}</div>
      <div class="btn-row"><button class="btn gold" id="tr-back">← ${en?'Back':'返回'}</button></div>`);
    document.querySelectorAll('#panel [data-learn]').forEach(b => b.onclick = () => {
      this.learnSkillFromTrainer(cat, b.dataset.learn);
    });
    document.getElementById('tr-back').onclick = () => this._navStack.length?this.navigateBack():this.openSkillEditor(cat);
  },
  canAffordSkill(sk) {
    const cost = sk.unlock && sk.unlock.cost; if (!cost) return true;
    const S = State.S;
    return (cost.coins||0) <= (S.coins||0) && (cost.fish||0) <= (S.fish||0);
  },
  // Bilingual unlock-condition + live status for a gated skill.
  skillUnlockText(cat, sk) {
    const S = window.Skills, u = sk.unlock || {}, en = window.MorrowwishI18n?.get?.() !== 'zh';
    const bits = [];
    if (u.cost) {
      const c = u.cost, p = [];
      if (c.coins) p.push('🪙' + c.coins); if (c.fish) p.push('🐠' + c.fish);
      bits.push((en?'Pay ':'付费 ') + p.join(' '));
    }
    if (u.level) bits.push((en?'Lv.':'Lv.') + u.level + (cat.level>=u.level?' ✓':` (${en?'now':'当前'} ${cat.level||1})`));
    if (u.affinity) bits.push((en?'Affinity ':'亲密 ') + u.affinity + ((cat.affinity||0)>=u.affinity?' ✓':` (${cat.affinity||0})`));
    if (u.species) {
      const names = u.species.map(id => GameData.speciesName?.(id) || id).join('/');
      bits.push((en?'Breed: ':'品种专属：') + names + (u.species.indexOf(cat.species)>=0?' ✓':''));
    }
    if (u.quest) {
      const q = S.QUEST_CHECKS[u.quest];
      if (q) {
        const cur = q.get(cat), tmpl = en ? q.label.en : q.label.zh;
        bits.push(tmpl.replace('{cur}', Math.min(cur, q.need)).replace('{need}', q.need) + (cur>=q.need?' ✓':''));
      }
    }
    return bits.join(' · ');
  },
  learnSkillFromTrainer(cat, skillId) {
    const S = window.Skills, en = window.MorrowwishI18n?.get?.() !== 'zh';
    const sk = S.skillById(skillId);
    const r = S.learnSkill(cat, skillId);
    if (!r.ok) {
      const msg = r.reason==='coins' ? (en?'Not enough coins':'金币不足')
        : r.reason==='fish' ? (en?'Not enough fish':'小鱼不足')
        : r.reason==='locked' ? (en?'Condition not met yet':'条件尚未满足')
        : (en?'Cannot learn this skill':'无法学习该技能');
      this.game.toast(msg); return;
    }
    window.arcadeMetric?.('bond_skill_learned', { skill: skillId, via: r.via, breed: cat.species });
    State.save(); this.game.refreshHUD();
    this.game.toast('✨ ' + (en?'Learned ':'学会了 ') + (sk?sk.name:skillId) + (en?'!':'！'));
    this.openTrainer(cat);
  },
  doEvolve(cat) {
    const S = window.Skills;
    const evo = S.evolutionOf(cat.species); if (!evo) return;
    const req = evo.req || {};
    if (cat.level < (req.level || 0) || (cat.affinity || 0) < (req.bond || 0)) { this.game.toast('条件不满足'); return; }
    if (req.item) {
      if (!State.S.evoStones || !(State.S.evoStones[req.item] > 0)) { this.game.toast('缺少 ' + req.item + '（商店购买）'); return; }
      State.S.evoStones[req.item]--;
    }
    const toSp = GameData.speciesById(evo.evolvesTo);
    const oldName = GameData.speciesName(cat.species);
    const fromSpecies = cat.species;
    // evolve: change species, keep level/bond/xp, boost stats, re-roll loadout, log dex
    cat.species = evo.evolvesTo;
    cat.stats.pow = Math.round(cat.stats.pow * 1.35 + 4);
    cat.stats.agi = Math.round(cat.stats.agi * 1.35 + 4);
    cat.stats.vit = Math.round(cat.stats.vit * 1.35 + 4);
    cat.stats.cha = Math.round(cat.stats.cha * 1.35 + 4);
    cat.loadout = null; if (S.ensureLoadout) S.ensureLoadout(cat);
    cat.evolved = true;
    State.S.dex[evo.evolvesTo] = (State.S.dex[evo.evolvesTo] || 0) + 1;
    State.save(); this.game.rebuildYard(); this.game.refreshHUD();
    if (typeof metric === 'function') metric('cat_evolve', { from: fromSpecies, to: evo.evolvesTo });
    this.openEvolveAnim(oldName, toSp);
  },
  openEvolveAnim(oldName, toSp) {
    this.panel(`<span class="card-close">×</span>
      <h2 class="center">✨ 进化成功！</h2>
      <canvas id="evo-cv" width="200" height="160" style="display:block;margin:10px auto"></canvas>
      <p class="center"><b>${oldName}</b> 进化为 <b class="rarity-${toSp.rarity}">${GameData.speciesName(toSp)}</b>！</p>
      <p class="sub center">${toSp.desc}</p>
      <div class="btn-row" style="justify-content:center"><button class="btn gold" onclick="UI.closeAll()">太棒了</button></div>`);
    const cv = document.getElementById('evo-cv'); const cx = cv.getContext('2d'); let tt = 0;
    const anim = () => {
      if (!document.getElementById('evo-cv')) return;
      tt += 0.04; cx.clearRect(0, 0, 200, 160);
      // burst rays
      cx.save(); cx.translate(100, 85); cx.globalAlpha = 0.5;
      for (let i = 0; i < 12; i++) { cx.rotate(Math.PI / 6 + tt * 0.5); cx.fillStyle = 'rgba(255,211,107,0.3)'; cx.fillRect(0, -3, 110, 6); }
      cx.restore();
      CatArt.drawCat(cx, 100, 95, { species: toSp, scale: 1.5, face: 1, t: tt, pose: 'sit', mood: 'happy' });
      requestAnimationFrame(anim);
    };
    anim();
  },

  // ---------- collection / dex ----------
  // ELEMENT REACTION CODEX (元素反应图鉴): a readable list of every status×element
  // reaction, generated straight from Skills.COMBO so it always matches the live table.
  // Each row: [status tag] + [element] → reaction name · multiplier. Grouped by the
  // status being detonated; amplifiers vs counters (×<1) visually separated.
  reactionCodexHtml(en) {
    const S = window.Skills; if (!S || !S.COMBO) return '';
    const TAG = S.TAG_INFO || {}, EL = S.ELEMENTS || {};
    const elIcon = el => this.game.elemIcon ? this.game.elemIcon(el) : '';
    const tagName = tg => (TAG[tg]?.name) || tg;
    const tagColor = tg => (TAG[tg]?.color) || '#ccc';
    // collect rows; skill-specific keys (tag|@skillId) show the skill name instead of an element
    const rows = [];
    for (const key in S.COMBO) {
      const c = S.COMBO[key];
      const [tag, rhs] = key.split('|');
      let trigger, tcolor;
      if (rhs.startsWith('@')) {
        const sk = S.skillById(rhs.slice(1));
        trigger = (sk ? sk.name : rhs.slice(1)); tcolor = '#ffd36b';
      } else {
        trigger = elIcon(rhs) + (EL[rhs]?.name || rhs); tcolor = EL[rhs]?.color || '#ccc';
      }
      const mult = c.bonusMult || 1;
      const counter = mult < 1;
      rows.push({ tag, trigger, tcolor, name: c.name, mult, counter });
    }
    rows.sort((a, b) => (a.counter - b.counter) || (b.mult - a.mult));
    const rowHtml = r => `<div class="rx-row ${r.counter?'rx-counter':''}">
      <span class="rx-tag" style="color:${r.tcolor}">
        <span class="rx-chip" style="background:${tagColor(r.tag)}22;border-color:${tagColor(r.tag)}">${tagName(r.tag)}</span>
        <span class="rx-plus">+</span><span style="color:${r.tcolor}">${r.trigger}</span></span>
      <span class="rx-arrow">→</span>
      <span class="rx-name">${r.name}</span>
      <span class="rx-mult ${r.counter?'down':'up'}">×${r.mult}</span>
    </div>`;
    return `<details class="reaction-codex"><summary><strong>⚗️ ${en?'Elemental Reactions':'元素反应图鉴'}</strong>
        <span class="tiny">${rows.length} ${en?'reactions':'种反应'}</span></summary>
      <p class="tiny rx-hint">${en
        ? 'Apply a status (burn, soak, shock…), then hit with a matching element to trigger a reaction. Reaction and type-effectiveness bonuses ADD together.'
        : '先用技能附加状态（灼烧/淋湿/感电…），再用相克元素攻击即可触发反应。反应加成与属性克制加成「独立相加」。'}</p>
      <div class="reaction-list">${rows.map(rowHtml).join('')}</div>
    </details>`;
  },
  openDex() {
    const en=window.MorrowwishI18n?.get?.()!=='zh';
    const mastery=this.game.masteryStatus();
    const cells = GameData.SPECIES.map(sp => {
      const count = State.S.dex[sp.id] || 0;
      const locked = count === 0;
      const mastered=!!State.S.masteryBadges?.[sp.id];
      const best=State.S.bestGrades?.[sp.id];
      return `<div class="dex-cell ${locked ? 'locked' : ''} ${mastered?'golden-paw':''}" data-id="${sp.id}">
        ${mastered?'<span class="golden-paw-stamp" title="Golden Paw · S rank">🏅 S</span>'
          :best?'<span class="battle-best-stamp">'+best+'</span>':''}
        ${count > 1 ? `<div class="badge-count">×${count}</div>` : ''}
        <canvas width="90" height="76"></canvas>
        <div class="name">${locked ? '？？？' : GameData.speciesName(sp)}</div>
        <div class="rarity rarity-${sp.rarity}">${GameData.RARITY[sp.rarity].name}</div>
      </div>`;
    }).join('');
    const total = GameData.SPECIES.length;
    const owned = GameData.SPECIES.filter(s => State.S.dex[s.id]).length;
    const story=State.S.story;
    const recordCat=story?.playerRecorded
      ?State.S.cats.find(cat=>cat.uid===story.recordedUid):null;
    const recordName=String(recordCat?State.catName(recordCat):(en?'The Bellkeeper':'守铃者'))
      .replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
    const storyRecord=story?.playerRecorded
      ?`<section class="cb-dex-story-record"><span class="cb-dex-story-mark">✦</span><span><strong>${en?'The Last Page':'最后一页'}</strong><small>${en?'The Bellkeeper: ':'守铃者：'}${recordName}</small></span><b>${en?'Complete':'已完成'}</b></section>`:'';
    this.panel(`<span class="card-close">×</span>
      <h2>图鉴 <span class="tiny">${owned}/${total}</span></h2>
      <p class="sub">${en?'Discover breeds and earn an S-rank Golden Paw for each one.'
        :'发现不同猫咪，为每个品种挑战 S 级「金爪徽章」。'}</p>
      <div class="mastery-summary">
        <b>🏅 ${en?'Golden Paws':'金爪徽章'} ${mastery.medals}/${mastery.total}</b>
        <span>${en?'Every 3 medals permanently improve rare-encounter odds.'
          :'每获得 3 枚徽章，永久增加稀有猫的遭遇机会。'}</span>
        <small>${en?'Permanent rarity-weight boost':'当前永久稀有权重加成'}：+${Math.round(mastery.luckBonus*100)}%</small>
      </div>
      <div class="dex-grid">${cells}</div>
      ${storyRecord}
      ${this.reactionCodexHtml(en)}`);
    document.querySelector('#panel .card')?.classList.add('cat-highlight-card');
    document.querySelectorAll('#panel .dex-cell').forEach(cell => {
      const sp = GameData.speciesById(cell.dataset.id);
      if (!cell.classList.contains('locked')) {
        const featured=State.S.cats.filter(c=>c.species===sp.id).sort((a,b)=>State.catPower(b)-State.catPower(a))[0];
        CatArt.renderCatThumb(cell.querySelector('canvas'), sp,featured);
        cell.tabIndex=0;cell.setAttribute('role','button');
        cell.addEventListener('keydown',e=>{
          if(e.key==='Enter'||e.key===' '){e.preventDefault();cell.click();}
        });
      }
      cell.addEventListener('click', () => {
        if(!State.S.dex[sp.id])return;
        const canRematch=State.S.cats.some(cat=>cat.species===sp.id);
        const best=State.S.bestGrades?.[sp.id]||'—';
        const rareLore={
          jinwu:[en?'The legendary sun-cat keeps a flame alive to guide lost kittens home.'
            :'传说金乌把火种藏在山顶，不是为了守护宝藏，而是给迷路的猫咪照亮归途。',
            en?'A Golden Paw reveals its secret: the flame is a promise to every kitten still searching for home.'
              :'金爪秘密：那团不灭的火焰，是它对每只流浪小猫许下的约定。'],
          youling:[en?'At night, a shy silhouette follows the moonlight between abandoned doors.'
            :'深夜里，总有一只幽灵般的小猫替别人守住没关好的门。',
            en?'Its Golden Paw secret: it waited for one friend for years, and still believes in reunions.'
              :'金爪秘密：它曾等一位朋友很多年，至今仍相信总有一天能再相见。'],
          xingchen:[en?'It collects every falling star as if each were someone\'s forgotten wish.'
            :'星尘把每一颗流星收藏起来，因为它觉得每一颗都是谁遗失的愿望。',
            en?'The final star belongs to the player who kept all their companions close.'
              :'金爪秘密：最后一颗星星，留给始终没有放弃伙伴的你。']
        };
        const lore=rareLore[sp.id]||(sp.rarity==='SR'||sp.rarity==='SSR'
          ?[en?'An unusual cat with an unfinished tale. Every meeting is another clue.'
              :'这只猫的过去还藏着秘密。每一次相遇，都会留下一点线索。',
            en?'The Golden Paw tells a secret: this cat trusts you enough to share its true story.'
              :'金爪秘密：当它相信你时，才终于肯讲出自己的经历。']:null);
        this.panel(`<span class="card-close">×</span>
          <h2>${GameData.speciesName(sp)} <span class="rarity-${sp.rarity}">◆${GameData.RARITY[sp.rarity].name}</span></h2>
          <p class="sub">${sp.desc}</p>
          ${lore?'<p class="rare-lore">'+(en?'📖 Lost cat tale':'📖 猫咪往事')+' · '+lore[0]+'</p>'
             +(State.S.masteryBadges?.[sp.id]?'<p class="rare-lore unlocked">'+lore[1]+'</p>':
                '<p class="rare-lore locked">'+(en?'🏅 Earn an S rank to reveal the rest of the story.'
                  :'🏅 获得 S 评级才能解锁隐藏结局。')+'</p>'):''}
          <p class="mastery-detail">${State.S.masteryBadges?.[sp.id]
            ?(en?'🏅 Golden Paw earned · S rank':'🏅 金爪徽章已解锁 · S 评级')
            :(en?'Best grade '+best+' · Earn S to win the Golden Paw'
              :'历史最佳 '+best+' 级 · 挑战 S 级可解锁金爪徽章')}</p>
          <canvas id="dx" width="160" height="130" style="display:block;margin:10px auto;border-radius:12px"></canvas>
          <p class="tiny center">${en?'Successful encounters':'累计成功收服'} ${State.S.dex[sp.id]} ·
             ${this.rankSHelp(sp.rarity)} ·
             ${this.rankSHelp(sp.rarity,true)}</p>
          <div class="btn-row" style="justify-content:center">
            <button class="btn gold" id="dx-rematch" ${canRematch?'':'disabled'}>${en?'⚔️ Try for S rank':'⚔️ 重战挑战 S 级'}</button>
            <button class="btn ghost" id="dx-back">${en?'Back to codex':'返回图鉴'}</button>
          </div>
          <p class="tiny center">${en?'Rank challenge: no duplicate cats or repeat capture rewards.'
            :'评级挑战不会重复捕捉猫咪，也不会重复领取金币。'}</p>`);
        document.querySelector('#panel .card')?.classList.add('cat-highlight-card');
        const featured=State.S.cats.filter(c=>c.species===sp.id).sort((a,b)=>State.catPower(b)-State.catPower(a))[0];
        CatArt.renderCatThumb(document.getElementById('dx'),sp,featured);
        document.getElementById('dx-back').onclick=()=>this.openDex();
        const fight=document.getElementById('dx-rematch');
        if(fight&&canRematch)fight.onclick=()=>{
          this.closeAll();this.game.startMasteryChallenge(sp);
        };
      });
    });
  },

  // ---------- daily ----------
  openDaily() {
    const avail = State.dailyAvailable();
    this.panel(`<span class="card-close">×</span>
      <h2>每日签到</h2>
      <p class="sub">连续登录领更多奖励，第7天必得额外小鱼！</p>
      <p class="center" style="font-size:1.1rem;margin:14px 0">🔥 连续签到 <b>${State.S.streak}</b> 天</p>
      <div class="btn-row" style="justify-content:center">
        <button class="btn gold" id="claim" ${avail ? '' : 'disabled'}>${avail ? '🎁 领取今日奖励' : '✅ 今日已领取'}</button>
      </div>
      <p class="tiny center" style="margin-top:10px">奖励随连签天数增长</p>`);
    const btn = document.getElementById('claim');
    if (btn && avail) btn.onclick = () => {
      const { reward, streak } = State.claimDaily();
      State.save(); this.game.refreshHUD();
      const msg = `+${reward.coins}🪙 +${reward.fish}🐠小鱼`;
      this.game.toast(`签到成功！${msg}`);
      this.openDaily();
    };
  },

  // ---------- shop: atomic lazy purchasing (bulk ×1/×10/×50/max) ----------
  shopItem(what){
    // 2-currency economy: treat packs now grant 🐠 fish (小鱼干 folded into fish).
    const items={
      medkit:{icon:'🧰',zh:'猫猫急救包',en:'Kitten First-Aid Kit',coins:30,fish:0,medkitsGain:1},
      treat5:{icon:'🐠',zh:'小鱼 ×5',en:'Fish ×5',coins:30,fish:0,fishGain:5},
      treat15:{icon:'🐠',zh:'小鱼 ×15',en:'Fish ×15',coins:75,fish:0,fishGain:15},
      lure:{icon:'🍀',zh:'幸运诱饵',en:'Lucky lure',coins:0,fish:2,luckLure:1},
      fish:{icon:'🐠',zh:'小鱼',en:'Fish',coins:60,fish:0,fishGain:1},
      'stone:夜影石':{icon:'🌑',zh:'夜影石',en:'Shadow Stone',coins:0,fish:3,stone:'夜影石'},
      'stone:月华露':{icon:'🌙',zh:'月华露',en:'Moon Dew',coins:0,fish:4,stone:'月华露'},
      'stone:赤焰晶':{icon:'🔥',zh:'赤焰晶',en:'Flame Crystal',coins:0,fish:4,stone:'赤焰晶'},
      'stone:翠藤芽':{icon:'🌿',zh:'翠藤芽',en:'Jade Sprout',coins:0,fish:4,stone:'翠藤芽'},
      'stone:流光珠':{icon:'⚡',zh:'流光珠',en:'Voltlight Pearl',coins:0,fish:4,stone:'流光珠'}
    };
    return items[what]||null;
  },
  shopMaxAffordable(what){
    const item=this.shopItem(what);
    if(!item)return 0;
    return Math.min(1000,item.coins?Math.floor((State.S.coins||0)/item.coins):Infinity,
      item.fish?Math.floor((State.S.fish||0)/item.fish):Infinity);
  },
  openShop(){
    const en=window.MorrowwishI18n?.get?.()!=='zh';
    const quantity=this._shopQuantity=== 'max'?'max':
      [1,10,50].includes(this._shopQuantity)?this._shopQuantity:1;
    const qtyButton=(n,txt)=>'<button type="button" class="btn '+(n===quantity?'gold':'ghost')+
      '" data-shop-qty="'+n+'" aria-pressed="'+String(n===quantity)+'">'+txt+'</button>';
    const shopKeys=['medkit','treat5','treat15','lure','fish','stone:夜影石','stone:月华露','stone:赤焰晶','stone:翠藤芽','stone:流光珠'];
    const rows=shopKeys.map(key=>{
      const item=this.shopItem(key),max=this.shopMaxAffordable(key);
      const count=quantity==='max'?max:quantity;
      const totalCoins=item.coins*count,totalFish=item.fish*count;
      const price=(totalCoins?totalCoins+'🪙':'')+(totalCoins&&totalFish?' + ':'')+
        (totalFish?totalFish+'🐠':'');
      const section=key.startsWith('stone:')?'stone':'supplies';
      return '<button type="button" class="btn shop-bulk-item" data-buy="'+key+
        '" data-shop-group="'+section+'" '+(max<count||!count?'disabled':'')+'>'+
        '<span>'+item.icon+' '+(en?item.en:item.zh)+' ×'+count+'</span>'+
        '<small>'+price+(quantity==='max'?' · '+(en?'affordable max':'可买最多'):'')+'</small></button>';
    }).join('');
    this.panel('<span class="card-close">×</span><h2>'+(en?'Cat Corner Shop':'小卖部')+
      '</h2><p class="sub">'+(en?'Choose a batch size, then buy once. Costs are shown before checkout.':
        '先选择购买数量，再点商品一次买齐。扣费前显示合计价格。')+'</p>'+
      '<div class="shop-qty-options" role="group" aria-label="'+(en?'Quantity':'购买数量')+'">'+
      qtyButton(1,'×1')+qtyButton(10,'×10')+qtyButton(50,'×50')+
      qtyButton('max',en?'Max affordable':'一键买满')+'</div>'+
      '<div class="shop-bulk-list">'+rows+'</div>'+
      '<p class="tiny center">'+(en?'Max 1,000 packs per transaction. Existing items and prices are unchanged.':
        '一次最多购买 1000 份；原有商品价格不变，不会透支资源。')+'</p>');
    document.querySelectorAll('#panel [data-shop-qty]').forEach(b=>b.onclick=()=>{
      const v=b.dataset.shopQty;this._shopQuantity=v==='max'?'max':Number(v);
      this.openShop();
    });
    document.querySelectorAll('#panel [data-buy]').forEach(b=>
      b.onclick=()=>this.buy(b.dataset.buy,quantity));
  },
  buy(what,quantity=1){
    const item=this.shopItem(what),S=State.S;
    if(!item){this.game.toast('未找到商品');return {ok:false};}
    const max=this.shopMaxAffordable(what);
    const requested=quantity==='max'?max:Math.floor(Number(quantity));
    const count=Math.min(1000,requested);
    if(!Number.isSafeInteger(count)||count<1||count>max){
      this.game.toast('资源不足，无法完成这批购买');
      return {ok:false};
    }
    const costCoins=item.coins*count,costFish=item.fish*count;
    if(S.coins<costCoins||S.fish<costFish)return {ok:false};
    S.coins-=costCoins;S.fish-=costFish;
    if(item.luckLure)S.luckLure=(S.luckLure||0)+item.luckLure*count;
    if(item.fishGain)S.fish+=item.fishGain*count;
    if(item.medkitsGain)S.medkits=(S.medkits||0)+item.medkitsGain*count;
    if(item.stone){
      S.evoStones=S.evoStones||{};
      S.evoStones[item.stone]=(S.evoStones[item.stone]||0)+count;
    }
    State.save();this.game.refreshHUD();
    const en=window.MorrowwishI18n?.get?.()!=='zh';
    this.game.toast(item.icon+' '+(en?item.en:item.zh)+' ×'+count+
      (en?' purchased':' 购买成功'));
    // Refresh quantities/prices so the next purchase can never use a stale
    // total after spending resources.
    if(document.querySelector('#panel [data-shop-qty]'))this.openShop();
    return {ok:true,count,coins:costCoins,fish:costFish};
  },

  // ---------- feed (quick) ----------
  openFeed() {
    const cats = State.S.cats;
    if (!cats.length) { this.game.toast('还没有猫猫'); return; }
    this.panel(`<span class="card-close">×</span>
      <h2>喂食全员</h2>
      <p class="sub">消耗 ${cats.length}🐠 小鱼干，提升好感和饱食</p>
      <div class="btn-row" style="justify-content:center">
        <button class="btn gold" id="feedall">🍖 全部喂食</button>
      </div>`);
    document.getElementById('feedall').onclick = () => {
      const cost = cats.length;
      if (State.S.fish < cost) { this.game.toast('小鱼干不足'); return; }
      State.S.fish -= cost;
      cats.forEach(c => { c.hunger = Math.min(100, c.hunger + 35); c.joy = Math.min(100, c.joy + 6); c.affinity = Math.min(100, c.affinity + 5); State.addXp(c, 4); });
      window.MorrowwishAudio?.effect?.('feed');
      State.save(); this.game.refreshHUD(); this.game.toast('🍖 全员吃饱啦'); this.closeAll();
    };
  },

  rankSHelp(rarity,auto=false){
    const en=window.MorrowwishI18n?.get?.()!=='zh';
    const r=this.game.sRankRequirements(rarity),c=auto?r.auto:r.manual;
    const hp=Math.round(c.hp*100);
    const skill=auto?(en?c.combo+'-hit combo':c.combo+'连击')
      :(en?c.combo+'-hit combo or perfect dodge + '+c.dodgeCombo+' hits'
         :c.combo+'连击，或完美闪避加'+c.dodgeCombo+'连击');
    return en?(r.novice?'Beginner ':'')+(auto?'Auto':'Manual')+' S: all survive · '+hp+'%+ HP · '+c.seconds+'s · '+skill
      :(r.novice?'新手':'')+(auto?'自动':'手动')+' S：全员存活 · '+hp+'%血量 · '+c.seconds+'秒内 · '+skill;
  },
  // ---------- tease mini-game (逗猫) ----------
  openTease(cat) {
    const cats = State.S.cats;
    if (!cats.length) { this.game.toast('还没有猫猫'); return; }
    const target = cat || cats[0];
    this._teaseFromCatDetail=this.openCatUid===target.uid;
    const en=window.MorrowwishI18n?.get?.()!=='zh';
    this.panel(`<span class="card-close">×</span>
      <h2>${en?'Cat Teaser 🪶':'逗猫 🪶'}</h2>
      <p class="sub">${en?'Tap the feather toy and help '+GameData.speciesName(target.species)+' catch it. More catches improve affection and mood.':'点击逗猫棒，让 '+GameData.speciesName(target.species)+' 扑抓！抓中越多，好感与心情涨得越快。'}</p>
      <div style="position:relative;height:220px;background:rgba(255,255,255,0.04);border-radius:12px;overflow:hidden;touch-action:manipulation" id="tease-area">
        <canvas id="tz" width="500" height="220" style="width:100%;height:100%;display:block"></canvas>
      </div>
      <p class="center" style="margin-top:8px">${en?"Score":"得分"} <b id="tz-score">0</b> / 10</p>
      <div class="btn-row" style="justify-content:center"><button class="btn ghost" id="tz-done" type="button">${en?"Finish":"结束"}</button></div>`);
    this.game?.completeFirstAdventureStep?.('play');
    this.runTease(target);
  },

  runTease(cat) {
    const sp = GameData.speciesById(cat.species);
    const cv = document.getElementById('tz');
    const ctx = cv.getContext('2d');
    const area=document.getElementById('tease-area');
    // Logical coordinates match actual CSS pixels, preserving kitten proportions.
    let W=Math.max(1,area.clientWidth||500),H=Math.max(1,area.clientHeight||220);
    const dpr=Math.min(3,window.devicePixelRatio||1);
    let score = 0, misses = 0, tt = 0, active = true;
    // feather toy position
    let fx = W / 2, fy = H / 2, tx = fx, ty = fy, moveTimer = 0;
    // cat position chases toy
    let cx = W / 2, cy = H - 40, pounce = 0;
    const scoreEl = document.getElementById('tz-score');

    const syncCanvasSize=()=>{
      const rect=area.getBoundingClientRect();
      const nextW=Math.max(1,Math.round(rect.width)),nextH=Math.max(1,Math.round(rect.height));
      const bw=Math.max(1,Math.round(nextW*dpr)),bh=Math.max(1,Math.round(nextH*dpr));
      if(nextW===W&&nextH===H&&cv.width===bw&&cv.height===bh)return;
      const sx=nextW/W,sy=nextH/H;
      fx*=sx;tx*=sx;cx*=sx;fy*=sy;ty*=sy;cy*=sy;
      W=nextW;H=nextH;cv.width=bw;cv.height=bh;
      ctx.setTransform(dpr,0,0,dpr,0,0);
    };
    syncCanvasSize();
    const sizeObserver=typeof ResizeObserver!=='undefined'?new ResizeObserver(syncCanvasSize):null;
    sizeObserver?.observe(area);
    let frameId=0;
    const stop=()=>{
      active=false;
      if(frameId)cancelAnimationFrame(frameId);
      sizeObserver?.disconnect();
      area.removeEventListener('pointerdown',tap);
      if(this._teaseStop===stop)this._teaseStop=null;
    };
    this._teaseStop=stop;
    const tap = e => {
      if (!active) return;
      const r = cv.getBoundingClientRect();
      const p = e.touches ? e.touches[0] : e;
      const mx=p.clientX-r.left;
      const my=p.clientY-r.top;
      // if clicking near toy AND cat is close → score
      const toCatp = Math.hypot(mx - cx, my - cy);
      if (toCatp < 60) {
        score++; pounce = 0.4; scoreEl.textContent = score;
        this.game.toast('🐾 抓到啦！');
        if (score >= 10) finish();
      }
      // move toy to tap
      tx = Math.max(20, Math.min(W - 20, mx));
      ty = Math.max(20, Math.min(H - 60, my));
    };
    // One pointer event per gesture on mobile and desktop, never duplicate
    // mouse+touch events that can award two scores for a single tap.
    area.addEventListener('pointerdown',tap);

    const finish = () => {
      if (!active) return;
      const fromCatDetail=!!this._teaseFromCatDetail;
      this._teaseFromCatDetail=false;
      stop();
      const gain=3+score;
      cat.affinity=Math.min(100,cat.affinity+gain*.8);
      cat.joy=Math.min(100,cat.joy+gain);
      State.addXp(cat,gain*2);
      State.save();this.game.refreshHUD();
      // An explicit 'Finish' must always dismiss the teaser. Previously it
      // only refreshed a cat-detail view if one had opened the mini-game;
      // entering from the garden left the same inert screen visible.
      if(fromCatDetail&&this._navStack.length)this.navigateBack();
      else{this.closeAll();if(fromCatDetail)this.openCatDetail(cat);}
      const en=window.MorrowwishI18n?.get?.()!=='zh';
      this.game.toast(en?'Teasing finished! Affection +'+Math.round(gain*.8):
        '逗猫结束！好感 +'+Math.round(gain*.8));
      window.arcadeMetric?.('bond_tease_complete',{score,cat:cat.species});
    };
    document.getElementById('tz-done').addEventListener('click', e=>{
      e.preventDefault();e.stopPropagation();finish();
    });

    const anim = () => {
      if (!active||document.getElementById('tz')!==cv){stop();return;}
      syncCanvasSize();
      tt += 0.03;
      // toy drifts a little + auto-wanders if not moved
      moveTimer -= 0.03;
      if (moveTimer <= 0) { tx = 30 + Math.random() * (W - 60); ty = 30 + Math.random() * (H - 80); moveTimer = 1.4; }
      fx += (tx - fx) * 0.12; fy += (ty - fy) * 0.12;
      // cat chases toy
      cx += (fx - cx) * 0.06; cy += (fy + 20 - cy) * 0.06;
      if (pounce > 0) pounce -= 0.03;
      ctx.clearRect(0, 0, W, H);
      // cat
      (window.CatMotion?.draw||CatArt.drawCat)(ctx,cx,cy,{
        species:sp,scale:1.2,face:fx<cx?-1:1,t:tt,
        pose:pounce>0?'play':'walk',motion:1,mood:'alert',
        growth:window.Growth?.visual(cat)||null
      });
      // feather toy
      ctx.save(); ctx.translate(fx, fy);
      ctx.strokeStyle = '#b5a6cf'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(10, 18); ctx.stroke();
      ctx.fillStyle = '#ff7b9c'; ctx.font = '20px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('🪶', 0, 0);
      ctx.restore();
      if(active)frameId=requestAnimationFrame(anim);
    };
    anim();
  },

  // Compact controls glossary: actual HUD buttons, never one list per kitten.
  battlePrepEsc(value){
    return String(value??'').replace(/[&<>"']/g,ch=>
      ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  },
  battleTeamSummary(cats,en){
    const team=(cats||[]).filter(Boolean);
    if(!team.length)return en?'No cats selected':'尚未选择猫咪';
    const starters=team.slice(0,2).map(cat=>State.catName(cat)).join(' + ');
    const bench=team.length>2?' · '+(en?team.length-2+' reserve':team.length-2+' 只替补'):'';
    return (en?'Starting: ':'首发：')+starters+bench;
  },
  battlePrepSkillMarkup(team,en){
    const controls=[
      ['🧶',en?'Basic · click/J':'普攻 · 左键/J',
        en?'Fluffy yarn balls build ultimate charge.':'投掷毛线球攻击，积攒必杀能量。'],
      ['🧶',en?'Q · Skill 1':'Q · 技能一',
        en?'Use the active cat’s first equipped skill.':'使用当前猫咪装备的第一个技能。'],
      ['💨',en?'E · Skill 2':'E · 技能二',
        en?'Use the active cat’s second equipped skill.':'使用当前猫咪装备的第二个技能。'],
      ['◎',en?'Lock target':'锁定目标',
        en?'Lock onto or switch the wild-cat target.':'锁定或切换要攻击的野猫。'],
      ['🌀',en?'Dodge · Space':'闪避 · 空格',
        en?'Quickly evade a hit; briefly invulnerable.':'快速躲开攻击，获得短暂的无敌时间。'],
      ['🌪️',en?'R · Ultimate':'R · 必杀技',
        en?'Cast when the ultimate meter is charged.':'必杀能量攒满后释放强力技能。']
    ];
    const duo=window.CatRelations?.chosen?.()||[];
    if(duo.length===2&&duo.every(partner=>(team||[]).slice(0,2).some(cat=>cat?.uid===partner.uid))){
      controls.push(['✦',en?'Duo combo':'双猫合击',
        en?'Tap when the bond meter is ready.':'默契能量攒满后点击，发动双猫合击。']);
    }
    return '<div class="prebattle-control-grid">'+controls.map(([icon,key,desc])=>
      '<div class="prebattle-control-item"><b>'+icon+' '+key+'</b><span>'+desc+'</span></div>').join('')+'</div>';
  },
  battlePrepSkillCard(team,en){
    return '<details id="battle-prep-skills" class="prebattle-skills">'+
      '<summary><span>ⓘ '+(en?'Battle buttons · Basic / Q / E / R / Dodge':'战斗按钮说明 · 普攻 / Q / E / R / 闪避')+'</span>'+
      '<small>'+(en?'Expand':'展开')+'</small></summary>'+
      '<div id="battle-prep-skills-body" class="prebattle-skills-body">'+
      this.battlePrepSkillMarkup(team,en)+'</div></details>';
  },
  refreshBattlePrepSkills(team,en){
    const summary=document.getElementById('battle-team-summary');
    if(summary)summary.textContent=this.battleTeamSummary(team,en);
    const help=document.getElementById('battle-prep-skills-body');
    if(help)help.innerHTML=this.battlePrepSkillMarkup(team,en);
  },
  // Region encounters and grade rematches do not use the capture roster.
  // They must still ask BEFORE launching the real-time encounter.
  // 克制预警: a one-line, bilingual matchup read for the pre-battle prompt. Purely informational —
  // no gameplay effect — so a 逆风 (bad-matchup) fight is VISIBLE before the player commits, and a
  // player who OWNS a counter (just hasn't fielded it) is told to swap it in. Addresses owner:
  // "玩家可能不能获得对应属性克制的猫咪来打 ssr/sr，比如露露很难打" + the playtest "danger is invisible".
  matchupWarning(selectedCats, wildSp, en){
    const S=window.Skills; if(!S||!S.effectiveness||!S.elementOf) return '';
    const wildEl=S.elementOf(wildSp.id);
    const elName={fire:en?'Fire':'火',water:en?'Water':'水',grass:en?'Grass':'草',elec:en?'Elec':'电',dark:en?'Dark':'暗',light:en?'Light':'光'};
    const icon=el=>this.game.elemIcon?this.game.elemIcon(el):'';
    // does a given cat counter / get countered by the wild? effectiveness() returns ~1.5 (advantage)
    // or ~2 (hard counter) for super-effective and ~0.5 for resisted, so threshold on >1 / <1, not ==2.
    const counters=c=>S.effectiveness(S.elementOf(c.species),wildEl)>1;       // my cat is strong vs wild
    const counteredBy=c=>S.effectiveness(wildEl,S.elementOf(c.species))>1;    // wild is strong vs my cat
    const field=(selectedCats||[]).filter(Boolean);
    const haveCounter=field.find(counters);
    const weak=field.find(counteredBy);
    // a counter the player OWNS but hasn't fielded (bench)
    const fieldUids=new Set(field.map(c=>c.uid));
    const benchCounter=(State.S.cats||[]).find(c=>!fieldUids.has(c.uid)&&counters(c));
    // what element beats the wild (for the "go find one" hint)
    const needEls=['fire','water','grass','elec','dark','light'].filter(a=>S.effectiveness(a,wildEl)>1);
    const needStr=needEls.map(e=>elName[e]).join('/')+(en?'':' 系');
    let cls,msg;
    if(haveCounter){
      cls='mu-good';
      msg=(en?`✓ Your `:`✓ 队伍中 `)+State.catName(haveCounter)+(en?` counters ${elName[wildEl]}`:` 克制 ${elName[wildEl]}系`);
    } else if(benchCounter){
      cls='mu-hint';
      msg=(en?`💡 Bench ${State.catName(benchCounter)} (${elName[S.elementOf(benchCounter.species)]}) counters this — field it`
             :`💡 替补 ${State.catName(benchCounter)}（${elName[S.elementOf(benchCounter.species)]}系）能克制，建议上场`);
    } else if(weak){
      cls='mu-warn';
      msg=(en?`⚠ It resists/counters your ${State.catName(weak)} — ${needStr} counters it`
             :`⚠ 对方克制你的 ${State.catName(weak)} — 用 ${needStr}克制它`);
    } else {
      cls='mu-neutral';
      msg=(en?`No counter on your team — ${needStr} is strong vs ${elName[wildEl]}`
             :`队伍暂无克制 — ${needStr}克制 ${elName[wildEl]}系`);
    }
    return `<p class="sub matchup-read ${cls}">${icon(wildEl)} ${msg}</p>`;
  },
  openBattleModePrompt(team,wildSp,opts={}){
    const en=window.MorrowwishI18n?.get?.()!=='zh';
    const prefs=State.S.battlePrefs||{};
    let auto=prefs.modeChosen?!!prefs.autoBattle:
      ((State.S.catchCount||0)===0?true:!!prefs.autoBattle);
    if(this._localePanelRerendering&&this._localePanelRerenderAuto!==null)
      auto=!!this._localePanelRerenderAuto;
    const selected=this.getPreferredBattleTeam().map(c=>c.uid);
    const squadMarkup=
      '<details class="prep-advanced prep-team-details" id="battle-team-details">'+
      '<summary><strong>'+(en?'Battle team · edit':'出战队伍 · 点击调整')+'</strong>'+
      '<span id="battle-team-summary">'+this.battlePrepEsc(
        this.battleTeamSummary(selected.map(uid=>State.S.cats.find(c=>c.uid===uid)).filter(Boolean),en))+'</span></summary>'+
      '<p class="sub">'+(en?'2 cats start; up to 3 reserves. Tap cats to change the team or reorder below.':'2 只首发，最多 3 只替补。点击猫咪更换队伍，也可调整顺序。')+'</p>'+
      this.squadPickerMarkup(selected)+'</details>';
    const label=opts.mastery?(en?'Golden Paw rematch':'金爪评级挑战')
      :(en?'Wild cat encounter':'发现野生猫咪');
    const encounterLvl=wildSp.encounterLevel||
      window.Battle?.CaptureBattle?.previewWildLevel?.(
        wildSp,opts.origin==='map'?(window.WorldMap?.currentRegion||'home'):'yard',team)||1;
    this.panel(`<span class="card-close">×</span>
      <h2>${label}</h2>
      <p class="sub" style="font-weight:750;color:#765e85">
        ${en?'Wild cat':'野生猫咪'} · Lv.${encounterLvl} ·
        <span class="rarity-${wildSp.rarity}">${wildSp.rarity} · ${en?({N:'Common',R:'Rare',SR:'Epic',SSR:'Legendary'}[wildSp.rarity]):GameData.RARITY[wildSp.rarity].name}</span>
      </p>
      ${this.matchupWarning(selected.map(uid=>State.S.cats.find(c=>c.uid===uid)).filter(Boolean),wildSp,en)}
      <p class="sub">${en?'Pick a control mode, then start.':'选好战斗方式就能开战。'}</p>
      ${squadMarkup}
      <div class="prebattle-quick-select"><button id="bp-best-team" type="button" class="btn ghost">${en?'⚡ Auto-pick strongest':'⚡ 一键最强上阵'}</button></div>
      ${this.battlePrepSkillCard(selected.map(uid=>State.S.cats.find(c=>c.uid===uid)).filter(Boolean),en)}
      <fieldset class="capture-mode-picker">
        <legend>${en?'Control mode':'战斗方式'}</legend>
        <div class="capture-mode-options" role="radiogroup" aria-label="${en?'Battle mode':'战斗模式'}">
          <button type="button" class="capture-mode-option ${auto?'selected':''}" role="radio" data-battle-auto="true" aria-checked="${auto}">
            <strong>${en?'🤖 Auto battle':'🤖 自动战斗'}</strong>
            <span>${en?'Cats move, attack, use skills and dodge for you.':'猫咪自动移动、攻击、释放技能和闪避。'}</span>
          </button>
          <button type="button" class="capture-mode-option ${auto?'':'selected'}" role="radio" data-battle-auto="false" aria-checked="${!auto}">
            <strong>${en?'🎮 Manual control':'🎮 手动操作'}</strong>
            <span>${en?'Phone: drag, tap skills. PC: WASD + mouse. A short tutorial comes first.':'自己操控；手机可拖动移动、点技能，电脑使用 WASD / 鼠标。开战前先看教程。'}</span>
          </button>
        </div>
        <p class="capture-mode-note">${(State.S.catchCount||0)===0&&!prefs.tutorialSeen?
          (en?'First encounter includes a skippable tutorial.':'首次战斗附带可跳过的新手教学。'):
          (en?'The game remembers your last selection.':'系统会记住上一次选择。')}</p>
      </fieldset>
      <details class="prep-advanced prep-difficulty" id="battle-difficulty-details">
        <summary><strong>${en?'Difficulty · change':'难度 · 点击调整'}</strong>
        <span id="battle-difficulty-summary">${State.difficulty()==='casual'?(en?'Casual':'休闲'):(en?'Hardcore':'硬核')}</span></summary>
      <fieldset class="capture-mode-picker">
        <legend>${en?'Difficulty':'难度'}</legend>
        <div class="capture-mode-options" role="radiogroup" aria-label="${en?'Difficulty':'难度'}">
          <button type="button" class="capture-mode-option ${State.difficulty()==='casual'?'selected':''}" role="radio" data-diff="casual" aria-checked="${State.difficulty()==='casual'}">
            <strong>${en?'🌿 Casual':'🌿 休闲'}</strong>
            <span>${en?'Relaxed fights — your cats hit harder, wild cats are gentle, almost no level pressure.':'轻松战斗 — 你的猫更强、野猫更温和，几乎没有等级压制。'}</span>
          </button>
          <button type="button" class="capture-mode-option ${State.difficulty()==='hardcore'?'selected':''}" role="radio" data-diff="hardcore" aria-checked="${State.difficulty()==='hardcore'}">
            <strong>${en?'🔥 Hardcore':'🔥 硬核'}</strong>
            <span>${en?'Full lethality and strong level suppression — fighting above your level really bites.':'完整难度 + 较强等级压制 — 越级挑战非常危险。'}</span>
          </button>
        </div>
      </fieldset></details>
      <div class="btn-row prebattle-actions"><button class="btn gold" id="bp-go">${en?'Start battle':'开始战斗'}</button>
      <button class="btn ghost" id="bp-cancel">${en?'Not now':'暂不出战'}</button></div>`);
    this.setupPrebattleDialog();
    this.bindSquadPicker(selected);
    this.refreshBattlePrepSkills(selected.map(uid=>State.S.cats.find(c=>c.uid===uid)).filter(Boolean),en);
    document.getElementById('bp-best-team').onclick=()=>{
      selected.splice(0,selected.length,...this.getStrongestBattleTeam().map(cat=>cat.uid));
      this.bindSquadPicker(selected);
    };
    const options=[...document.querySelectorAll('#panel .capture-mode-option[data-battle-auto]')];
    for(const button of options){
      button.onclick=()=>{
        auto=button.dataset.battleAuto==='true';
        for(const opt of options){
          const selected=(opt.dataset.battleAuto==='true')===auto;
          opt.classList.toggle('selected',selected);
          opt.setAttribute('aria-checked',String(selected));
        }
      };
    }
    // Difficulty radio: persist immediately so it applies to THIS fight (battle.js
    // reads State.difficulty() at construction, which happens after Start below).
    const diffOptions=[...document.querySelectorAll('#panel .capture-mode-option[data-diff]')];
    for(const button of diffOptions){
      button.onclick=()=>{
        State.setDifficulty(button.dataset.diff);
        for(const opt of diffOptions){
          const on=opt.dataset.diff===button.dataset.diff;
          opt.classList.toggle('selected',on);
          opt.setAttribute('aria-checked',String(on));
        }
        const summary=document.getElementById('battle-difficulty-summary');
        if(summary)summary.textContent=State.difficulty()==='casual'?(en?'Casual':'休闲'):(en?'Hardcore':'硬核');
      };
    }
    document.getElementById('bp-cancel').onclick=()=>{
      this.closeAll();
      // Letting the wild cat go (暂不出战) from a MAP encounter never enters battle, so
      // endBattle's resume never runs — the cat was frozen at cd=9999 by triggerEncounter
      // and would stay stuck forever. Resume it here (flee path: short cooldown, then it
      // roams again).
      if(opts.origin==='map'&&window.WorldMap?.resumeRegion)WorldMap.resumeRegion(false);
      if(opts.mastery)this.openDex();
      else if(this.game.scene==='yard')this.game.showYardChrome();
    };
    document.getElementById('bp-go').onclick=()=>{
      const fighters=selected.map(uid=>State.S.cats.find(c=>c.uid===uid)).filter(Boolean);
      State.S.battlePrefs={...State.S.battlePrefs,autoBattle:auto,modeChosen:true,
        skillsIntroSeen:true,teamUids:[...selected]};
      State.save();this.closeAll();
      if(opts.mastery){this.game.startMasteryChallenge(wildSp,true,fighters);return;}
      if(opts.origin==='map'){
        this.game._returnScene='map';this.game._battleTheme=opts.theme||null;
      }
      this.game.startBattle(fighters.length?fighters:team,wildSp);
    };
  },

  // ---------- capture prep ----------
  openCapturePrep(wildSp) {
    const cats = State.S.cats;
    const rar = GameData.RARITY[wildSp.rarity];
    const firstCapture=(State.S.catchCount||0)===0;
    const english=window.MorrowwishI18n?.get?.()!=='zh';
    // First visit starts with the friendly auto recommendation; subsequent
    // battles honor the last explicit auto/manual choice from the save.
    const prefs=State.S.battlePrefs||{};
    let initialAuto=prefs.modeChosen?!!prefs.autoBattle
      :(firstCapture?true:!!prefs.autoBattle);
    if(this._localePanelRerendering&&this._localePanelRerenderAuto!==null)
      initialAuto=!!this._localePanelRerenderAuto;
    this.prepAutoBattle=initialAuto;
    const hasMedal=!!State.S.masteryBadges?.[wildSp.id];
    const masteryChallenge='🏅 '+this.rankSHelp(wildSp.rarity)+'. '+this.rankSHelp(wildSp.rarity,true)+'. '
      +(hasMedal?(english?'Golden Paw already earned.':'该品种已有金爪徽章。')
        :(english?'First S unlocks a Golden Paw and a rare-cat lure.':'首次 S 解锁金爪徽章和稀有猫诱饵。'));
    if (!cats.length) {
      this.panel(`<span class="card-close">×</span><h2>发现野生猫猫</h2><p class="sub">你还没有伙伴猫，无法发起捕捉。</p>`);
      return;
    }
    // The player's saved expedition stores individual cat UIDs, not breed IDs.
    // Deduplicating by breed here silently discarded chosen cats before a yard
    // battle and replaced them with stronger cats of the same breed.
    const sorted = [...cats].sort((a, b) => State.catPower(b) - State.catPower(a));
    const breedCounts = new Map();
    for(const cat of sorted)
      breedCounts.set(cat.species,(breedCounts.get(cat.species)||0)+1);
    const preferred=window.CatRelations?.chosen?.()||[];
    const duo=preferred.length===2?preferred.filter(c=>sorted.some(t=>t.uid===c.uid)):[];
    this.teamUids=this.getPreferredBattleTeam(sorted).map(c=>c.uid);
    const chips = sorted.map(c => {
      const sp = GameData.speciesById(c.species);
      const sel = this.teamUids.includes(c.uid);
      const inDuo=duo.some(d=>d.uid===c.uid);
      const escName=String(State.catName(c)).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
      return `<button type="button" class="chip ${sel ? 'sel' : ''} ${inDuo?'duo-member':''}" data-uid="${c.uid}" aria-pressed="${sel}">
        <canvas width="58" height="50" aria-hidden="true"></canvas>
        <span class="squad-cat-info"><strong>${escName} ${inDuo?'💞':''}</strong>
        ${this.battleCatStatsMarkup(c)}
        ${breedCounts.get(c.species)>1?'<small class="squad-duplicate">'+
          (english?'Owned: ':'拥有：')+breedCounts.get(c.species)+'</small>':''}</span>
      </button>`;
    }).join('');
    const newBreed=!State.S.dex[wildSp.id];
    const skillPreview=window.Skills?Skills.skillsByElement(Skills.elementOf(wildSp.id))
      .filter(sk=>sk.ultCost>0).map(sk=>sk.name).join(' / '):'';
    const rareText=wildSp.rarity==='SSR'?'👑 传说邂逅'
      :wildSp.rarity==='SR'?'🌟 史诗邂逅'
      :wildSp.rarity==='R'?'✨ 稀有邂逅'
      :newBreed?'🐾 新品种发现':'🐾 熟悉的朋友';
    this.panel(`<span class="card-close">×</span>
      <div class="sighting-badge rarity-${wildSp.rarity}">${rareText}</div>
      <h2>${english?'Wild ':'发现野生 '}<span class="rarity-${wildSp.rarity}">${GameData.speciesName(wildSp)}</span></h2>
      <p class="sub">${wildSp.desc}</p>
      <canvas id="cp-wild" width="160" height="120" style="display:block;width:128px;height:96px;margin:2px auto;background:rgba(255,255,255,0.04);border-radius:12px"></canvas>
      <p class="center tiny">${english?'Wild level':'野猫等级'} <b>Lv.${wildSp.encounterLevel||
          window.Battle?.CaptureBattle?.previewWildLevel?.(wildSp,'yard',cats.slice(0,5))||1}</b>
          · ${english?'Rarity':'稀有度'} <span class="rarity-${wildSp.rarity}">◆${wildSp.rarity} · ${english?({N:'Common',R:'Rare',SR:'Epic',SSR:'Legendary'}[wildSp.rarity]):rar.name}</span></p>
      ${skillPreview||!firstCapture?'<details class="prep-advanced prep-rewards"><summary><strong>'+(english?'Rewards & challenges':'奖励与挑战')+'</strong><span>'+(english?'Details':'展开')+'</span></summary>'+
        (skillPreview?'<p class="center tiny skill-discovery">'+(english?'Elemental ultimate to unlock: ':'可培养解锁元素必杀：')+skillPreview+'</p>':'')+
        (!firstCapture?'<p class="center tiny capture-challenge">'+masteryChallenge+'</p>':'')+'</details>':''}
      <details class="prep-advanced prep-team-details" id="battle-team-details">
        <summary><strong>${english?'Battle team · edit':'出战队伍 · 点击调整'}</strong>
          <span id="battle-team-summary">${this.battlePrepEsc(this.battleTeamSummary(this.teamUids.map(uid=>cats.find(c=>c.uid===uid)).filter(Boolean),english))}</span>
        </summary>
        ${duo.length===2&&duo.every(c=>this.teamUids.includes(c.uid))&&!firstCapture?'<p class="duo-team-hint">'+(english?'💞 Your chosen duo is on this team.':'💞 当前双猫搭档已在出战队伍中。')+'</p>':''}
        ${this.squadOrderMarkup()}
        <div class="roster" id="cp-roster" style="${firstCapture?'display:none':''}">${chips}</div>
      </details>
      <div class="prebattle-quick-select"><button id="cp-best-team" type="button" class="btn ghost">${english?'⚡ Auto-pick strongest':'⚡ 一键最强上阵'}</button></div>
      ${this.battlePrepSkillCard(this.teamUids.map(uid=>cats.find(c=>c.uid===uid)).filter(Boolean),english)}
      <fieldset class="capture-mode-picker" aria-label="${english?'Battle control':'选择战斗方式'}">
        <legend>${english?'How would you like to fight?':'这场战斗怎么打？'}</legend>
        <div class="capture-mode-options" role="radiogroup" aria-label="${english?'Battle control':'战斗方式'}">
          <button type="button" role="radio" class="capture-mode-option ${initialAuto?'selected':''}" data-battle-auto="true" aria-checked="${initialAuto}">
            <strong>${english?'🤖 Auto battle':'🤖 自动战斗'} <small>${firstCapture?(english?'Recommended':'推荐'):''}</small></strong>
            <span>${english?'Cats move, attack and dodge for you.':'猫咪自动移动、攻击、放技能和闪避。'}</span>
          </button>
          <button type="button" role="radio" class="capture-mode-option ${initialAuto?'':'selected'}" data-battle-auto="false" aria-checked="${!initialAuto}">
            <strong>${english?'🎮 Manual control':'🎮 手动操作'}</strong>
            <span>${english?(this.game.isTouch?'Drag left to move; tap Claw to toggle continuous attacks.':'WASD to move, mouse/J to attack.'):(this.game.isTouch?'左侧滑动控制移动，右下猫爪可开启持续攻击。':'WASD 移动，鼠标或 J 键攻击。')}</span>
          </button>
        </div>
        <p class="capture-mode-note">${firstCapture
          ?(english?'Your first fight starts with a short, skippable tutorial.':'第一次战斗会有简短教学，可以跳过。')
          :(english?'Your previous choice is remembered; switch anytime during battle.':'记住你上次的选择，战斗中也能随时切换。')}</p>
      </fieldset>
      <div class="btn-row prebattle-actions">
        <button class="btn gold" id="cp-go">${firstCapture?'出发！收服这只猫':'开始战斗'}</button>

        <button class="btn ghost" id="cp-cancel">放它走</button>
      </div>`);
    this.setupPrebattleDialog();
    document.querySelector('#panel .card')?.classList.add('cat-highlight-card');
    CatArt.renderCatThumb(document.getElementById('cp-wild'), wildSp);
    const roster = document.getElementById('cp-roster');
    const refreshSel = () => {
      roster.querySelectorAll('.chip').forEach(ch => {
        const order=this.teamUids.indexOf(ch.dataset.uid);
        ch.classList.toggle('sel',order>=0);
        ch.setAttribute('aria-pressed',String(order>=0));
        ch.dataset.orderRole=order<0?'':(order<2?(english?'START '+(order+1):'首发 '+(order+1)):(english?'BENCH '+(order-1):'替补 '+(order-1)));
      });
      this.refreshSquadOrder(this.teamUids,refreshSel);
      this.refreshBattlePrepSkills(this.teamUids.map(uid=>cats.find(c=>c.uid===uid)).filter(Boolean),english);
    };
    roster.querySelectorAll('.chip').forEach(chip => {
      const c = cats.find(x => x.uid === chip.dataset.uid);
      CatArt.renderCatThumb(chip.querySelector('canvas'), GameData.speciesById(c.species),c);
      chip.onclick = () => {
        const uid = chip.dataset.uid;
        const idx = this.teamUids.indexOf(uid);
        if (idx >= 0) { if (this.teamUids.length > 1) this.teamUids.splice(idx, 1); }  // keep at least 1
        else { if (this.teamUids.length >= 5) this.teamUids[this.teamUids.length-1]=uid; else this.teamUids.push(uid); }
        refreshSel();
      };
    });
    refreshSel();
    document.getElementById('cp-best-team').onclick=()=>{
      this.teamUids=this.getStrongestBattleTeam(sorted).map(cat=>cat.uid);
      refreshSel();
    };
    const changeBattleMode=auto=>{
      this.prepAutoBattle=auto;
      document.querySelectorAll('#panel .capture-mode-option').forEach(btn=>{
        const selected=(btn.dataset.battleAuto==='true')===auto;
        btn.classList.toggle('selected',selected);
        btn.setAttribute('aria-checked',String(selected));
      });
      State.S.battlePrefs={...(State.S.battlePrefs||{}),autoBattle:auto,modeChosen:true};
      State.save();
    };
    document.querySelectorAll('#panel .capture-mode-option').forEach(btn=>{
      btn.onclick=()=>changeBattleMode(btn.dataset.battleAuto==='true');
      btn.onkeydown=e=>{
        if(e.key==='ArrowRight'||e.key==='ArrowLeft'){
          e.preventDefault();const other=btn.parentElement.querySelector('[data-battle-auto="'+(btn.dataset.battleAuto!=='true')+'"]');
          other?.focus();other?.click();
        }
      };
    });
    document.getElementById('cp-cancel').onclick = () => { this.closeAll(); document.getElementById('yard-actions').classList.remove('hidden'); };
    document.getElementById('cp-go').onclick = () => {
      // preserve the selection order; fall back to strongest if somehow empty
      const team = this.teamUids.map(uid => cats.find(x => x.uid === uid)).filter(Boolean);
      changeBattleMode(this.prepAutoBattle);
      State.S.battlePrefs.teamUids=[...this.teamUids];
      State.S.battlePrefs.skillsIntroSeen=true;
      State.save();
      this.closeAll();
      this.game.startBattle(team.length ? team : [sorted[0]], wildSp);
    };
  },

  // ---- Gambit editor: configure each team cat's auto-battle rule list ----
  openGambitEditor(wildSp) {
    const en=window.MorrowwishI18n?.get?.()!=='zh';
    const cats = State.S.cats;
    const team = this.teamUids.map(uid => cats.find(x => x.uid === uid)).filter(Boolean);
    const S = window.Skills;
    if (!S || !team.length) { this.openCapturePrep(wildSp); return; }
    this._gbIdx = this._gbIdx || 0;
    if (this._gbIdx >= team.length) this._gbIdx = 0;
    const cat = team[this._gbIdx];
    const sp = GameData.speciesById(cat.species);
    if (!cat.gambits || !cat.gambits.length) cat.gambits = S.defaultGambits(cat).slice();

    const condOpts = S.GAMBIT_CONDITIONS.map(c => `<option value="${c.key}">${c.label}</option>`).join('');
    const actOpts = S.GAMBIT_ACTIONS.map(a => `<option value="${a.key}">${a.label}</option>`).join('');
    const tabs = team.map((c, i) => {
      const s = GameData.speciesById(c.species);
      return `<button class="gb-tab ${i === this._gbIdx ? 'sel' : ''}" data-i="${i}">${GameData.speciesName(s)}</button>`;
    }).join('');
    const rows = cat.gambits.map((r, i) => `
      <div class="gb-row" data-i="${i}">
        <span class="gb-num">${i + 1}</span>
        <span class="gb-if">若</span>
        <select class="gb-cond" data-i="${i}">${condOpts}</select>
        <span class="gb-then">→</span>
        <select class="gb-act" data-i="${i}">${actOpts}</select>
        <button class="gb-del" data-i="${i}">✕</button>
      </div>`).join('');

    this.panel(`<span class="card-close">×</span>
      <h2>${en?'⚙️ Auto tactics':'⚙️ 智能战斗策略'} <span class="tiny">${en?'Rules checked top to bottom':'自上而下逐条判定'}</span></h2>
      <p class="sub">给每只猫配置自动战斗规则：满足「条件」就执行「动作」，最先命中的生效。</p>
      <div class="gb-tabs">${tabs}</div>
      <p class="tiny" style="margin:6px 0"><b>${GameData.speciesName(sp)}</b> · ${S.elementOf ? this.game.elemIcon(S.elementOf(cat.species)) : ''} 元素 · 技能：${(cat.loadout || []).map(id => { const sk = S.skillById(id); return sk ? sk.name : ''; }).filter(Boolean).join(' / ') || '默认'}</p>
      <div id="gb-list">${rows}</div>
      <div class="btn-row" style="margin-top:8px">
        <button class="btn ghost" id="gb-add">＋ 加一条</button>
        <button class="btn ghost" id="gb-reset">恢复默认</button>
      </div>
      <div class="btn-row">
        <button class="btn gold" id="gb-back">← 返回出战</button>
      </div>`);

    // set current values
    document.querySelectorAll('#gb-list .gb-cond').forEach(sel => { sel.value = cat.gambits[+sel.dataset.i].cond; });
    document.querySelectorAll('#gb-list .gb-act').forEach(sel => { sel.value = cat.gambits[+sel.dataset.i].act; });
    // wire changes
    document.querySelectorAll('#gb-list .gb-cond').forEach(sel => sel.onchange = () => { cat.gambits[+sel.dataset.i].cond = sel.value; State.save(); });
    document.querySelectorAll('#gb-list .gb-act').forEach(sel => sel.onchange = () => { cat.gambits[+sel.dataset.i].act = sel.value; State.save(); });
    document.querySelectorAll('#gb-list .gb-del').forEach(b => b.onclick = () => { if (cat.gambits.length > 1) { cat.gambits.splice(+b.dataset.i, 1); State.save(); this.openGambitEditor(wildSp); } });
    document.querySelectorAll('.gb-tab').forEach(b => b.onclick = () => { this._gbIdx = +b.dataset.i; this.openGambitEditor(wildSp); });
    document.getElementById('gb-add').onclick = () => { cat.gambits.push({ cond: 'always', act: 'basic' }); State.save(); this.openGambitEditor(wildSp); };
    document.getElementById('gb-reset').onclick = () => { cat.gambits = S.defaultGambits(cat).slice(); State.save(); this.openGambitEditor(wildSp); };
    document.getElementById('gb-back').onclick = () => this.openCapturePrep(wildSp);
  },

  // Persistent, readable recovery notice in EVERY battle result, not a fading toast.
  battleRecoveryMarkup(recovery=this.game?._battleRecovery){
    if(!recovery)return '';
    const en=this.isEnglish(),casual=recovery.mode==='casual';
    const heading=casual?(en?'🌿 Casual · Fully healed':'🌿 休闲模式 · 战后满血')
      :(en?'🔥 Hardcore · Recovering automatically':'🔥 硬核模式 · 自动恢复中');
    const detail=casual
      ?(en?'All cats return to full health after battle.':'战斗结束后，所有猫咪立即恢复满血。')
      :recovery.fromMap
        ?(en?'Health regenerates 20% per minute without tapping. Back at the yard: full HP. On the map: feed fish to heal +35% per fish.'
          :'血量每分钟自动恢复 20%，无需点击。返回庭院立即满血；地图菜单可喂小鱼，每条恢复 35%。')
        :(en?'Returning to the yard restores all HP.':'已返回庭院，所有猫咪恢复满血。');
    const rows=(recovery.team||[]).map(c=>'<span class="battle-recovery-cat"><strong>'+
      this.battlePrepEsc(c.name)+'</strong> '+c.before+'% → <b>'+c.after+'%</b></span>').join('');
    return '<section class="battle-recovery" aria-label="'+(en?'Post-battle recovery':'战后回血')+'">'+
      '<strong class="battle-recovery-title">'+heading+'</strong>'+
      '<p>'+detail+'</p>'+(rows?'<div class="battle-recovery-team">'+rows+'</div>':'')+'</section>';
  },
  openBattleRecoveryResult(recovery){
    const en=this.isEnglish(),exploring=this.game?.scene==='map';
    this.panel('<span class="card-close">×</span><h2 class="center">'+
      (en?'The wild cat got away':'野生猫猫跑掉了')+'</h2>'+
      this.battleRecoveryMarkup(recovery)+
      '<div class="btn-row" style="justify-content:center"><button type="button" class="btn gold" id="battle-recovery-ok">'+
      (en?(exploring?'Continue exploring':'Back to yard'):(exploring?'继续探索':'回庭院'))+
      '</button></div>');
    document.getElementById('battle-recovery-ok').onclick=()=>this.closeAll();
  },

  // Repeatable *skill* challenge, deliberately separate from capturing cats.
  openMasteryChallengeResult(wildSp,performance,reward,won){
    const en=window.MorrowwishI18n?.get?.()!=='zh';
    const grade=performance?.grade||'—';
    const best=State.S.bestGrades?.[wildSp.id]||'—';
    const note=!won?(en?'Challenge lost · your medal progress is safe.':'本次挑战失败 · 已获得的徽章不会丢失。')
      :reward?(en?'🏅 First S! Golden Paw earned · +1 rare lure · +15 affinity'
        :'🏅 首次 S！解锁金爪徽章 · +1 稀有诱饵 · 好感 +15')
      :(en?'Best rank saved. Earn S once per breed for a Golden Paw. No repeat rewards.'
        :'已记录最佳评级。每个品种首次 S 可得金爪徽章，不重复发奖。');
    this.panel(`<span class="card-close">×</span>
      <h2 class="center">${en?'Golden Paw Challenge':'金爪评级挑战'} · ${GameData.speciesName(wildSp)}</h2>
      <canvas id="mc-cat" width="180" height="140" style="display:block;margin:6px auto"></canvas>
      <div class="battle-grade grade-${grade}"><b>${grade}</b>
        <div><strong>${en?'Battle result':'挑战结果'}</strong><small>${en?'Best record':'历史最佳'} ${best}
          · ${en?'Medals':'金爪徽章'} ${this.game.masteryStatus().medals}/${GameData.SPECIES.length}</small></div>
      </div>
      ${this.battleRecoveryMarkup()}
      <p class="center mastery-challenge-note">${note}</p>
      ${won&&performance?.autoUsed?'<p class="center mastery-grade-hint">'+(performance.autoExceptional
        ?(en?'Exceptional auto run!':'自动战斗发挥出色！')
        :this.rankSHelp(wildSp.rarity,true))+'</p>':''}
      <div class="btn-row" style="justify-content:center">
        <button class="btn gold" id="mc-retry">${en?'Challenge again':'再次挑战'}</button>
        <button class="btn" id="mc-dex">${en?'View medals':'查看图鉴'}</button>
        <button class="btn ghost" id="mc-exit">${en?'Back to yard':'回庭院'}</button>
      </div>`);
    document.querySelector('#panel .card')?.classList.add('cat-highlight-card');
    CatArt.renderCatThumb(document.getElementById('mc-cat'),wildSp);
    document.getElementById('mc-retry').onclick=()=>{this.closeAll();this.game.startMasteryChallenge(wildSp);};
    document.getElementById('mc-dex').onclick=()=>this.openDex();
    document.getElementById('mc-exit').onclick=()=>{
      this.closeAll();document.getElementById('yard-actions').classList.remove('hidden');
    };
  },

  openCatchResult(wildSp, newCat, rewards=[], performance=null, masteryReward=null, reunion=false, skillUnlock=null, duoUnlock=null) {
    const status=this.game.collectionStatus();
    const exploring=this.game.scene==='map';
    const english=window.MorrowwishI18n?.get?.()!=='zh';
    const firstAdventure=(State.S.catchCount||0)===1;
    const name=GameData.speciesName(wildSp);
    const headline=reunion
      ?(english?'A familiar friend returns!':'老朋友又来啦！')
      :(english?'A new friend joined!':'新伙伴加入啦！');
    const totalText=english
      ?'Cat collection '+status.count+'/'+status.total
      :'猫咪图鉴 '+status.count+'/'+status.total;
    const goalText=status.next===null
      ?(english?'Every breed discovered!':'全部品种已收集！')
      :(english?'Next goal: '+status.next+' breeds':'下一目标：收集 '+status.next+' 种猫咪');
    const grade=performance?.grade||'C';
    const mastery=this.game.masteryStatus();
    const medalMessage=masteryReward
      ?(english?'First S on this breed! +1 rare-cat lure · +15 new cat affection'
        :'该品种首次达成 S 级！+1 幸运诱饵 · 新猫好感 +15')
      :'';
    const gradeLabel=english?'Battle grade':'战斗评级';
    const battleResult=performance
      ?(english?'Bonus: +'+performance.bonusCoins+' coins'+(performance.bonusFish?' · +'+performance.bonusFish+' fish':'')
        :'战斗奖励：+'+performance.bonusCoins+' 金币'+(performance.bonusFish?' · +'+performance.bonusFish+' 小鱼':''))
      :'';
    const earnedXp=this.game._battleXp;
    const xpMessage=earnedXp&&earnedXp.n
      ?(english?'Training EXP +'+earnedXp.each+' per cat · '+earnedXp.n+' participating cats'
        :'战斗经验：参战猫咪每只 +'+earnedXp.each+' XP · 共 '+earnedXp.n+' 只')
      :'';
    const levelMessage=earnedXp?.leveled?.length
      ?earnedXp.leveled.map(c=>c.name+' Lv.'+c.level).join(' · ') :'';
    const rewardText=rewards.length
      ?rewards.map(r=>english
        ?('Collection bonus: +'+r.coins+' coins, +'+r.fish+' fish')
        :('图鉴奖励：+'+r.coins+' 金币，+'+r.fish+' 小鱼')).join(' · ')
      :'';
    this.panel(`<span class="card-close">×</span>
      <h2 class="center">🎉 ${headline}</h2>
      <canvas id="cr" width="180" height="140" style="display:block;margin:8px auto"></canvas>
      <p class="center"><b class="rarity-${wildSp.rarity}">${name}</b> ${reunion
        ?(english?'made your bond stronger':'让你们的纽带更深了')
        :(english?'joined your yard':'已加入庭院')}</p>
      ${reunion?'<p class="center reunion-reward">'
        +(english?'💞 This breed already has 2 resident cats. Strongest cat: +8 affection, +45 XP, plus 2 fish.'
          :'💞 同品种已有两只：最强的猫获得 +8 好感、+45 经验及 2 小鱼，不再增加重复个体。')
        +'</p>':''}
      <p class="sub center">${totalText} · ${goalText}</p>
      ${firstAdventure?'<details class="prep-advanced first-capture-rewards"><summary><strong>'+(english?'Battle rewards & stats':'战斗奖励与详情')+'</strong><span>'+(english?'Expand':'展开')+'</span></summary>':''}
      ${performance?'<div class="battle-grade grade-'+grade+'"><b>'+grade+'</b><div><strong>'+gradeLabel+'</strong><small>'+battleResult+' · '+performance.combo+' '+(english?'best combo':'最高连击')+'</small>'
         +(performance.autoUsed?'<small class="grade-explain">'+(performance.autoExceptional
           ?(english?'Exceptional automatic performance!':'自动战斗发挥出色！')
           :this.rankSHelp(wildSp.rarity,true))+'</small>':'')+'</div></div>':''}
      ${this.battleRecoveryMarkup()}
      ${xpMessage?'<p class="center collection-reward">⭐ '+xpMessage+'</p>':''}
      ${levelMessage?'<p class="center collection-reward">⬆ '+(english?'LEVEL UP! ':'升级！')+levelMessage+'</p>':''}
      ${rewardText?'<p class="center collection-reward">🎁 '+rewardText+'</p>':''}
      ${firstAdventure?'</details>':''}
      ${skillUnlock?'<div class="skill-reveal-card"><b>✨ '+(english?'NEW SKILL UNLOCKED':'新技能觉醒！')
        +'</b><span>'+this.game.skillIcon(skillUnlock.skill)+' '+skillUnlock.skill.name
        +' · '+(english?'A new move for future battles':skillUnlock.skill.desc)+'</span><small>'
        +(skillUnlock.skill.ultCost
          ?(english?'Elemental ultimate unlocked — use R when the meter is full!':'元素必杀已解锁！能量满后按 R 释放。')
          :(english?'A new E skill is ready. Open skill loadout to customize.':'新技能已可在 E 位使用；可打开技能搭配自由调整。'))
        +'</small></div>':''}
      ${masteryReward?'<div class="golden-paw-unlock"><strong>🏅 '+(english?'GOLDEN PAW UNLOCKED!':'金爪徽章解锁！')+'</strong><p>'+medalMessage+'</p><small>'
        +(english?'Medals':'已获徽章')+' '+mastery.medals+'/'+mastery.total+' · '
        +(english?'Permanent rare-weight boost':'永久稀有权重加成')+' +'+Math.round(mastery.luckBonus*100)+'%</small></div>':''}
      ${duoUnlock?'<div class="duo-unlock"><b>💞 '+(english?'FIRST DUO UNLOCKED!':'第一对双猫搭档！')+'</b><p>'
        +(english?('Your cats unlocked '+duoUnlock.name+'! Bring them both into the next battle.')
          :('两只猫建立了纽带，解锁「'+duoUnlock.name+'」！下一场组队战斗就能使用合击。'))+'</p></div>':''}
      ${firstAdventure?'<p class="first-adventure-tip">'+(english
        ?'Your duo is ready! Bring both cats to the next hunt to build Duo energy and unleash a special team move.'
        :'双猫搭档已经准备好！下一场带上两只猫一起战斗，积攒合击能量，释放它们的专属合击。')+'</p>':''}
      <div class="btn-row" style="justify-content:center">
        ${duoUnlock&&!firstAdventure?'<button class="btn gold" id="cr-duo">'+(english?'See duo skills':'查看双猫纽带')+'</button>':''}
        <button class="btn gold" id="cr-next">${firstAdventure
          ?(english?(exploring?'Explore with your duo':'Try your duo · Find another cat')
            :(exploring?'双猫搭档继续探索':'双猫出战 · 再找一只伙伴'))
          :(english?(exploring?'Keep exploring':'Find another wild cat'):(exploring?'继续探索':'再找一只野猫'))}</button>
        <button class="btn ghost" id="cr-journey">${firstAdventure?(english?'Explore other activities':'探索其他玩法'):(english?'Explore · Bond · Workshop':'探索 · 养成 · 工坊')}</button>
        <button class="btn" id="cr-ok">${english?(exploring?'Back to map':'Back to yard'):(exploring?'返回地图':'回庭院')}</button>
        ${!firstAdventure&&skillUnlock?'<button class="btn gold" id="cr-newskill">'+(english?'Try the new skill':'查看新技能')+'</button>':''}
        ${masteryReward&&!firstAdventure?'<button class="btn gold" id="cr-medal">'+(english?'View medal collection':'查看金爪徽章')+'</button>':''}
      </div>`);
    document.querySelector('#panel .card')?.classList.add('cat-highlight-card');
    CatArt.renderCatThumb(document.getElementById('cr'),wildSp);
    const dismiss=()=>{
      this.closeAll();
      if(this.game.scene==='yard')document.getElementById('yard-actions').classList.remove('hidden');
      this.game.refreshCollectionGoal();
    };
    document.getElementById('cr-ok').onclick=dismiss;
    document.getElementById('cr-journey').onclick=()=>this.openJourney();
    if(document.getElementById('cr-duo'))document.getElementById('cr-duo').onclick=()=>this.openBondPanel();
    const newSkillBtn=document.getElementById('cr-newskill');
    if(newSkillBtn&&skillUnlock)newSkillBtn.onclick=()=>this.openSkillEditor(skillUnlock.cat);
    const medalButton=document.getElementById('cr-medal');
    if(medalButton)medalButton.onclick=()=>this.openDex();
    document.getElementById('cr-next').onclick=()=>{
      // If adding the captured cat exceeds five expedition slots, offer an
      // explicit choice. Otherwise the saved lineup must stay untouched.
      if(exploring&&!reunion&&this._chooseRunSquad(newCat)){return;}  // chooser took over
      dismiss();
      if(this.game.scene==='yard'&&!this.game.yard.hide)this.game.yard.startHideAndSeek();
      window.arcadeMetric?.('bond_continue_search');
    };
  },

  // After an explore capture, only ask for a new five-cat roster when the
  // previous team plus the captured cat exceeds the expedition capacity.
  // Otherwise keep the player's saved lineup unchanged.
  _chooseRunSquad(newCat){
    const FIELD_CAP=5;   // two active field cats + up to three chosen bench cats
    const byUid=new Map((State.S.cats||[]).map(c=>[c.uid,c]));
    // run roster = prior expedition team + the freshly caught cat
    const prior=(State.S.battlePrefs?.teamUids||[]).map(uid=>byUid.get(uid)).filter(Boolean);
    const roster=[];const seen=new Set();
    for(const c of [...prior,newCat]){ if(c&&!seen.has(c.uid)){seen.add(c.uid);roster.push(c);} }
    if(roster.length<=FIELD_CAP){
      // A new capture enters the collection, not the player's saved lineup.
      // Never silently rewrite the chosen starters or bench on Continue.
      return false;
    }
    const en=window.MorrowwishI18n?.get?.()!=='zh';
    const keep=new Set(roster.slice(0,FIELD_CAP).map(c=>c.uid));   // default: drop the oldest extra
    const cardFor=c=>{
      const hpPct=c._hpFrac!=null?Math.round(c._hpFrac*100):100;
      const nm=State.catName?State.catName(c):(c.species||'');
      return `<button type="button" class="keep-cat" data-uid="${c.uid}" aria-pressed="${keep.has(c.uid)}">
        <canvas width="54" height="46" data-sp="${c.species}"></canvas>
        <span class="keep-name">${nm}${c.uid===newCat.uid?' ✨':''}</span>
        <span class="keep-hp">HP ${hpPct}%</span></button>`;
    };
    this.panel(`<span class="card-close">×</span>
      <h2 class="center">${en?'Keep which cats?':'留下哪些猫？'}</h2>
      <p class="sub center">${en?`Your expedition takes up to ${FIELD_CAP} cats: 2 active and 3 bench. Choose who continues; the rest head home (still yours).`
        :`探索队伍最多带 ${FIELD_CAP} 只：2 只首发、3 只替补。选好继续冒险的猫，其余回家（仍归你所有）。`}</p>
      <div class="keep-grid">${roster.map(cardFor).join('')}</div>
      <div class="btn-row" style="justify-content:center">
        <button class="btn gold" id="keep-go" disabled>${en?'Keep exploring':'继续探索'}</button>
        <button class="btn ghost" id="keep-home">${en?'Send all home · back to map':'全部送回家 · 返回地图'}</button>
      </div>`);
    // render thumbnails
    document.querySelectorAll('.keep-cat canvas').forEach(cv=>{
      const sp=window.GameData?.speciesById?.(cv.dataset.sp); if(sp&&window.CatArt?.renderCatThumb)CatArt.renderCatThumb(cv,sp);
    });
    const goBtn=document.getElementById('keep-go');
    const sync=()=>{
      document.querySelectorAll('.keep-cat').forEach(btn=>{
        const on=keep.has(btn.dataset.uid);btn.setAttribute('aria-pressed',String(on));btn.classList.toggle('on',on);
      });
      if(goBtn){goBtn.disabled=keep.size!==FIELD_CAP;}
    };
    document.querySelectorAll('.keep-cat').forEach(btn=>{
      btn.onclick=()=>{
        const uid=btn.dataset.uid;
        if(keep.has(uid))keep.delete(uid);
        else{ if(keep.size>=FIELD_CAP){const first=keep.values().next().value;keep.delete(first);} keep.add(uid); }
        sync();
      };
    });
    sync();
    const resume=(uids)=>{
      State.S.battlePrefs={...(State.S.battlePrefs||{}),teamUids:uids};State.save();
      this.closeAll();
      window.arcadeMetric?.('bond_run_squad_kept',{kept:uids.length,roster:roster.length});
    };
    if(goBtn)goBtn.onclick=()=>resume([...keep]);
    document.getElementById('keep-home').onclick=()=>{
      // keep the default top-2 but go back to the map rather than chaining a search
      resume(roster.slice(0,FIELD_CAP).map(c=>c.uid));
    };
    return true;
  },

  // Show meaningful next activities instead of keeping players in a catch-only loop.
  openJourney(){
    const status=this.game.collectionStatus();
    const mastery=this.game.masteryStatus();
    const adv=this.game.adventureStatus();
    const en=window.MorrowwishI18n?.get?.()!=='zh';
    const target=status.next||status.total;
    const petTarget=[3,10,25].find(n=>adv.pets<n)||25;
    const starter=State.S.cats[0]||null;
    const skillHint=starter&&window.Skills?.progressionHint?.(starter)||'';
    const exploreText=en
      ?(adv.unlocked<=1?'Explore 40% of Sunlit Garden to unlock Sakura Woods'
        :adv.unlocked+'/'+adv.totalRegions+' regions unlocked')
      :(adv.unlocked<=1?'探索阳光花园 40%，解锁樱花林'
        :'已解锁 '+adv.unlocked+'/'+adv.totalRegions+' 个探索区域');
    this.panel(`<span class="card-close">×</span>
      <h2 class="center">${en?'🧭 Your Cat Adventure':'🧭 猫猫冒险手册'}</h2>
      <p class="sub center">${en?'Collect friends, unlock skills, earn workshop coins and explore new places.'
        :'收集新伙伴、觉醒技能、经营工坊、探索新地区——每条路线都有成长目标。'}</p>
      <div class="duo-adventure">💞 <b>${en?'Cat Duos · Unique Team Attacks':'双猫纽带 · 专属合击'}</b>
        <button class="btn gold" id="journey-duo">${en?'Meet duos':'查看搭档'}</button></div>
      <div class="journey-paths">
        <article class="journey-path">
          <div class="journey-icon">🐾</div>
          <div class="journey-copy"><b>${en?'Collect cats':'猫咪图鉴'}</b>
            <p>${en?'Discovered '+status.count+'/'+status.total+' · Next bonus at '+target
              :'已发现 '+status.count+'/'+status.total+' 种 · '+target+' 种时可领取奖励'}</p>
            <div class="journey-progress"><span style="width:${Math.min(100,status.count/target*100)}%"></span></div>
          </div><button class="btn gold" id="journey-collect">${en?'Find':'寻找'}</button>
        </article>
        <article class="journey-path">
          <div class="journey-icon">💞</div>
          <div class="journey-copy"><b>${en?'Bond with your cats':'和猫咪培养感情'}</b>
            <p>${en?'Pet your cats '+adv.pets+'/'+petTarget+' times to earn rewards'
              :'撸猫 '+adv.pets+'/'+petTarget+' 次可获得亲密奖励'}</p>
            <div class="journey-progress"><span style="width:${Math.min(100,adv.pets/petTarget*100)}%"></span></div>
          </div><button class="btn gold" id="journey-bond">${en?'Pet':'撸猫'}</button>
        </article>
        ${starter?'<article class="journey-path">'
          +'<div class="journey-icon">✨</div><div class="journey-copy"><b>'
          +(en?'Learn new battle skills':'技能成长 · 学会新招式')
          +'</b><p>'+skillHint+'</p></div>'
          +'<button class="btn gold" id="journey-skills">'
          +(en?'Skills':'看技能')+'</button></article>':''}
        <article class="journey-path">
          <div class="journey-icon">☀️</div>
          <div class="journey-copy"><b>${en?'Earn coins in the workshop':'让猫咪经营工坊赚钱'}</b>
            <p>${en?'Assign a kitten to the Sun station, earn coins offline, and collect when ready.'
              :'派猫去晒太阳位上岗，离线也赚金币；回来一键收取。'}</p>
          </div><button class="btn gold" id="journey-workshop">${en?'Workshop':'工坊'}</button>
        </article>
        <article class="journey-path">
          <div class="journey-icon">🗺️</div>
          <div class="journey-copy"><b>${en?'Explore new places':'探索新区域'}</b>
            <p>${exploreText}</p>
            <div class="journey-progress"><span style="width:${Math.min(100,adv.unlocked<=1?adv.homeExplored/40*100:adv.unlocked/adv.totalRegions*100)}%"></span></div>
          </div><button class="btn gold" id="journey-explore">${en?'Explore':'探索'}</button>
        </article>
      <div class="journey-master-row">
        <div><b>🏅 ${en?'Golden Paw challenge':'金爪评级挑战'} ${mastery.medals}/${mastery.total}</b>
          <p>${en?'Earn 3 S medals to permanently improve rare-cat odds. Boost: +'
            :'每 3 枚 S 级徽章永久提升遇稀有猫机会 · 当前稀有权重 +'}${Math.round(mastery.luckBonus*100)}%${en?' rare weight':''}</p>
        </div>
        <button class="btn gold" id="journey-mastery">${en?'Medals':'看徽章'}</button>
      </div>
      </div>`);
    document.querySelector('#panel .card')?.classList.add('cat-highlight-card');
    document.getElementById('journey-mastery').onclick=()=>this.openDex();
    document.getElementById('journey-duo').onclick=()=>this.openBondPanel();
    document.getElementById('journey-collect').onclick=()=>{
      this.closeAll();
      if(this.game.scene==='map'){this.game.scene='yard';this.game.showYardChrome();}
      if(!this.game.yard.hide)this.game.yard.startHideAndSeek();
    };
    document.getElementById('journey-bond').onclick=()=>{
      this.closeAll();
      if(this.game.scene==='map'){this.game.scene='yard';this.game.showYardChrome();}
      this.game.toast(en?'Tap a cat in the yard to earn affection!':'点击庭院里的猫咪，提高好感并领取奖励！');
    };
    const skillRoute=document.getElementById('journey-skills');
    if(skillRoute&&starter)skillRoute.onclick=()=>this.openSkillEditor(starter);
    document.getElementById('journey-workshop').onclick=()=>this.openWorkshop();
    document.getElementById('journey-explore').onclick=()=>{this.closeAll();this.game.openWorldMap();};
  },

  // ---------- starter picker (first run) ----------
  openStarter(onPick) {
    const options = GameData.SPECIES.filter(s => s.rarity === 'N').slice(0, 3);
    const english=window.MorrowwishI18n?.get?.()!=='zh';
    const chips = options.map(sp => `<button type="button" class="dex-cell" data-id="${sp.id}" aria-label="选择 ${GameData.speciesName(sp)}">
      <canvas width="90" height="76"></canvas>
      <div class="tiny starter-element">${this.game.elemIcon(Skills.elementOf(sp.id))} ${english
        ?({fire:'Fire',grass:'Nature',water:'Water'}[Skills.elementOf(sp.id)]||'Element')
        :({fire:'火系',grass:'草系',water:'水系'}[Skills.elementOf(sp.id)]||'元素')}</div>
      <div class="name">${GameData.speciesName(sp)}</div>
      <div class="rarity rarity-N">普通</div>
      <div class="tiny">${sp.desc}</div>
    </button>`).join('');
    const p = document.getElementById('panel');
    p.innerHTML = `<div class="card cat-highlight-card cat-starter-card"><h2 class="center">选择你的第一只猫猫</h2>
      <p class="sub center">每只猫有自己的元素技能。收服第一位伙伴后，还会觉醒新招式！</p>
      <div class="dex-grid">${chips}</div></div>`;
    p.dataset.mandatory = 'true';
    p.classList.add('open');
    p.onclick = null;
    p.querySelectorAll('.dex-cell').forEach(cell => {
      const sp = GameData.speciesById(cell.dataset.id);
      CatArt.renderCatThumb(cell.querySelector('canvas'), sp);
      cell.onclick = () => { this.closeAll(); onPick(sp.id); };
    });
  },
};

function statLine(label, val) {
  const pct = Math.min(100, val * 3);
  return `<div class="stat-row"><span class="label">${label}</span><div class="bar xp"><span style="width:${pct}%"></span></div><span class="val">${val}</span></div>`;
}
function withA2(h, a) { if (!h || h[0] !== '#') return h || '#fff'; const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; }

// Keep every safely repeatable panel in sync when players switch EN ↔ ZH.
// Store its latest route even when it was opened by another panel or navigation.
const LOCALIZED_PANEL_ROUTES=[
  'openCatHub','openRoster','openBreedRoster','openCatDetail',
  'openWorkshop','openBuild','openDex','openDaily','openShop',
  'openFeed','openSkillEditor','openTrainer','openMapChooser',
  'openMapSquad','openExploreMenu','openJourney','openCapturePrep',
  'openBattleModePrompt','openCatPicker','openBondPanel','openTease','openGambitEditor',
  'openWelcomeBack','openBattleRecoveryResult','openMasteryChallengeResult',
  'openCatchResult','openRegionSecret','openYardSurprise','openDuoQuarrel'
];
for(const method of LOCALIZED_PANEL_ROUTES){
  const original=UI[method];
  if(typeof original!=='function')continue;
  UI[method]=function(...args){
    this._localePanelDepth=(this._localePanelDepth||0)+1;
    try{
      const result=original.apply(this,args);
      if(!this._localePanelRerendering &&
        document.getElementById('panel')?.classList.contains('open')){
        this._localePanelRoute={method,args};
      }
      return result;
    }finally{this._localePanelDepth--}
  };
}

window.UI = UI;
