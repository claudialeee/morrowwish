// ui.js — all overlay panels & menus. Talks to State + Game.

const UI = {
  game: null,
  openCatUid: null,

  init(game) {
    this.game = game;
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
      if(this.game.battleTutorial)this.game.completeBattleTutorial();
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
    const journey=document.getElementById('collection-goal');
    if(journey)journey.addEventListener('click',()=>this.openJourney());
    document.getElementById('yard-surprise')?.addEventListener('click',()=>this.openYardSurprise());
    document.getElementById('yard-duo-status')?.addEventListener('click',()=>this.openBondPanel());
    document.getElementById('map-index')?.addEventListener('click',()=>this.openMapChooser());
    document.getElementById('duo-burst')?.addEventListener('click',()=>this.game.battle?.castDuo());
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

  onTab(tab) {
    // if we're out in the overworld map, any tab click returns to the yard first
    if (this.game.scene === 'map') {
      this.game.scene = 'yard';
      this.game.showYardChrome();
    }
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    if (tab === 'yard') { this.closeAll(); }
    else if (tab === 'cats') this.openRoster();
    else if (tab === 'work') this.openWorkshop();
    else if (tab === 'dex') this.openDex();
    else if (tab === 'daily') this.openDaily();
    else if (tab === 'shop') this.openShop();
  },

  // Five real playable locations, with their exact unlocking conditions.
  openMapChooser(){
    if(!window.WorldMap)return;
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
      <div class="btn-row"><button class="btn" id="map-world-view">${en?'View world map':'查看世界地图'}</button>
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
      ['🧶','猫咪的宝藏','A kitten treasure','保存毛线','Keep yarn','交换零食','Trade for treats'],
      ['🐾','两只猫争夺毛线球','A yarn-ball disagreement','两只都安慰','Comfort them both','帮助它们一起玩','Help them share'],
      ['📦','神秘纸箱大探险','The mysterious cardboard box','打开纸箱','Open the box','一起钻进去','Explore together'],
      ['🐟','小鱼干不翼而飞','The disappearing fish','揭开秘密','Find the culprit','悄悄补充零食','Refill the treats'],
      ['🌠','流星落在屋顶上','A shooting star over the roof','收下星光','Collect starlight','许一个伙伴愿望','Wish for friendship']
    ];
    const e=events[d.kind]||events[0];
    this.panel(`<span class="card-close">×</span><div class="yard-surprise-story">
      <div class="yard-surprise-icon">${e[0]}</div><h2>${en?e[2]:e[1]}</h2>
      <p>${en?(d.kind===3?'Two kittens want the same yarn ball. Can you help them share?':
        d.kind===5?'Someone stole the fish. Tiny pawprints lead into the flowers!':
        'Your cat found something unexpected. What should you do?')
        :(d.kind===3?'两只猫抢同一个毛线球，谁也不肯松爪。你准备怎么办？':
          d.kind===5?'小鱼干桶空了，地上却留着两串神秘脚印！':'猫猫意外发现了一件小宝贝，你想怎么做？')}</p>
      <div class="btn-row"><button class="btn gold" id="surprise-a">${en?e[4]:e[3]}</button>
      <button class="btn" id="surprise-b">${en?e[6]:e[5]}</button></div></div>`);
    for(const [id,choice] of [['surprise-a',0],['surprise-b',1]])document.getElementById(id).onclick=()=>{
      if(this.game.claimYardSurprise(choice)){this.closeAll();this.game.toast(en?'🎁 Surprise claimed!':'🎁 收下猫猫的礼物！');}
    };
  },
  openRegionSecret(reward){
    const d=reward.discovery,en=window.MorrowwishI18n?.get?.()!=='zh';
    const items=['coins','fish','treats','yarn','luck'].filter(k=>reward[k]).map(k=>'+'+reward[k]+' '+({coins:'🪙',fish:'🐠',treats:'🐟',yarn:'🧶',luck:'✨'}[k])).join(' · ');
    this.panel(`<span class="card-close">×</span><div class="yard-surprise-story">
      <div class="yard-surprise-icon">${d.icon}</div><h2>${en?d.en:d.name}</h2>
      <p>${en?d.storyEn:d.story}</p><p class="secret-reward">${en?'Unique discovery':'地区专属发现'} · ${items}</p>
      <div class="btn-row"><button class="btn gold" id="secret-close">${en?'Explore more':'继续探索'}</button></div></div>`);
    document.getElementById('secret-close').onclick=()=>this.closeAll();
  },
  openDuoQuarrel(a,b){
    if(!a||!b)return this.openBondPanel();
    const en=window.MorrowwishI18n?.get?.()!=='zh';
    const esc=x=>String(x).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[ch]));
    this.panel(`<span class="card-close">×</span><div class="duo-quarrel-story">
      <div class="duo-quarrel-icon" aria-hidden="true">💢</div>
      <h2>${en?'Two little cats had a disagreement':'两只小猫闹别扭了'}</h2>
      <p><strong>${esc(State.catName(a))}</strong> ${en?'and':'和'} <strong>${esc(State.catName(b))}</strong>
       ${en?'are giving each other the cold shoulder.':'现在正互相不理睬。'}</p>
      <p>${en?'They need a little attention. You can help them make up for free and earn +6 trust.':
        '别担心，在「双猫搭档」里点「哄一哄」，就能免费让它们和好，并增加 6 点默契。'}</p>
      <div class="btn-row">
        <button type="button" id="quarrel-fix" class="btn gold">${en?'Help them make up':'去哄一哄'}</button>
        <button type="button" id="quarrel-later" class="btn ghost">${en?'Later':'稍后处理'}</button>
      </div>
      <p class="tiny">${en?'You can return using the pink duo notice in the garden.':
        '稍后还可以点击庭院里的粉色搭档提示，随时回来处理。'}</p>
    </div>`);
    document.getElementById('quarrel-fix').onclick=()=>{
      this._duoPicked=[a.uid,b.uid];
      this.openBondPanel();
    };
    document.getElementById('quarrel-later').onclick=()=>this.closeAll();
  },
  openBondPanel(){
    const en=window.MorrowwishI18n?.get?.()!=='zh',cats=State.S.cats;
    if(cats.length<2){this.panel('<span class="card-close">×</span><h2>'+(en?'Cat Duos':'双猫搭档')+'</h2><p>'+(en?'Befriend a second cat first!':'先收服第二只猫，就能建立纽带！')+'</p>');return;}
    let picked=this._duoPicked?.slice()||CatRelations.chosen().map(c=>c.uid);
    if(picked.length!==2||!picked.every(id=>cats.some(c=>c.uid===id))){
      const pending=CatRelations.unresolved?.()[0];
      picked=pending?[pending.a.uid,pending.b.uid]:[cats[0].uid,cats[1].uid];
    }
    const [a,b]=picked.map(id=>cats.find(c=>c.uid===id)),ok=a.uid!==b.uid;
    const rel=ok?CatRelations.pair(a,b):null,p=rel?.value||0;
    const duoArt=ok?CatRelations.title(a,b):null;
    const name=duoArt?.name||'—';
    const selected=ok&&CatRelations.chosen().map(c=>c.uid).join('|')===picked.join('|');
    const mood=ok?CatRelations.mood(a,b):'unknown';
    const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
    const select=which=>cats.map(c=>'<option value="'+esc(c.uid)+'" '+(c.uid===which?'selected':'')+'>'+esc(State.catName(c))+'</option>').join('');
    const sec=rel?Math.max(0,Math.ceil((60000-(Date.now()-rel.lastPlay))/1000)):0;
    this.panel(`<span class="card-close">×</span><div class="duo-panel">
      <h2>💞 ${en?'Your Cat Duo':'双猫纽带'}</h2>
      <p>${en?'Pair two cats. Pet and play to raise trust, then take both into battle for a team attack.':'选择两只搭档，撸猫和一起玩耍提升默契，组队出战释放元素合击。'}</p>
      ${mood==='sulky'?'<section class="duo-quarrel-alert" role="status"><strong>💢 '+(en?'Time to make up':'闹别扭啦')+'</strong><p>'+
        (en?State.catName(a)+' and '+State.catName(b)+' are upset. Make up for free to gain +6 trust.':
          State.catName(a)+' 和 '+State.catName(b)+' 闹别扭了，点下面的按钮免费和好，还能增加 6 点默契。')+
        '</p><button type="button" class="btn gold" id="duo-soothe">'+(en?'Make up · Free':'哄一哄 · 免费')+'</button></section>':''}
      <div class="duo-picker"><label>${en?'Cat 1':'第一只'}<select id="duo-a">${select(picked[0])}</select></label>
      <label>${en?'Cat 2':'第二只'}<select id="duo-b">${select(picked[1])}</select></label></div>
      <div class="duo-relation"><strong>${name}</strong>
        <p class="duo-art-description">✨ ${esc(duoArt?.description||'')}${p>=60?' · '+(en?'Enhanced synergy unlocked':'进阶合击已觉醒'):''}</p>
        <span class="duo-active-status">${selected?(en?'✓ Current battle duo':'✓ 已组成出战搭档'):(en?'Not yet assigned':'尚未设为出战搭档')}</span>
        <span>${en?'Trust':'默契'} ${p}/100 · ${ok?CatRelations.moodLabel(a,b):''}</span>
        <small>${CatRelations.personality(a)} + ${CatRelations.personality(b)}</small>
        <div class="duo-meter"><span style="width:${p}%"></span></div>
        <small>${en?'20 unlocks · 60 adds a second effect · 90 strengthens the move':'20解锁合击 · 60新增元素效果 · 90强化威力'}</small>
        ${p>=60?'<p class="duo-secret-story">🌟 '+(en?'SECRET DUO STORY':'搭档秘密故事')+'<span>'
          +CatRelations.secretStory(a,b)+'</span></p>':''}
        ${p>=90?'<p class="duo-secret-story">🌙 '+(en?'SECRET PROMISE':'最终的约定')+'<span>'
          +(en?'Even in the fullest garden, these two will always find each other. Their team move has reached its final form.'
            :'即使庭院住满了小猫，它们也能一眼找到彼此。双猫合击终于达到最终形态。')
          +'</span></p>':''}</div>
      <div class="btn-row">
        <button class="btn gold" id="duo-choose" ${!ok?'disabled':''}>${selected?(en?'✓ Current duo':'✓ 当前搭档'):(en?'Form my battle duo':'组成出战搭档')}</button>
        <button class="btn" id="duo-play" ${!ok||sec>0||State.S.treats<1?'disabled':''}>${en?'Play (1 treat)':'一起玩（1零食）'}</button></div>
      <p class="tiny">${sec?(en?'Play again in '+sec+'s':'下次一起玩需 '+sec+' 秒'):(en?'Petting also builds friendship.':'在庭院撸猫也能提升默契。')}</p>
      <button class="btn ghost" id="duo-return">${en?'Back':'返回冒险'}</button></div>`);
    for(const [id,i] of [['duo-a',0],['duo-b',1]])document.getElementById(id).onchange=e=>{
      const ids=picked.slice();ids[i]=e.target.value;this._duoPicked=ids;this.openBondPanel();
    };
    document.getElementById('duo-choose').onclick=()=>{
      if(!ok)return;
      CatRelations.choose(a,b);this._duoPicked=[a.uid,b.uid];
      this.game.yard?.entities?.filter(e=>[a.uid,b.uid].includes(e.cat.uid))
        .forEach(e=>{e.emote('💞',3);e.pettedGlow=1.5;});
      this.game.refreshHUD();
      this.game.toast(en?'💞 Duo formed! Both cats will join the next fight.':'💞 搭档组成成功！下次战斗两只会一起上场。');
      window.arcadeMetric?.('bond_duo_selected',{elementPair:CatRelations.title(a,b).elementPair});
      this.openBondPanel();
    };
    const soothe=document.getElementById('duo-soothe');
    if(soothe)soothe.onclick=()=>{
      if(CatRelations.soothe(a,b)){this.game.toast(en?'💗 Made up! Trust +6':'💗 和好啦！默契 +6');this.game.refreshYardSurprise();this.openBondPanel();}
    };
    document.getElementById('duo-play').onclick=()=>{CatRelations.choose(a,b);const v=CatRelations.play(a,b);
      if(v.ok){this.game.toast(en?'💞 Friendship +13!':'💞 双猫默契 +13！');this.game.refreshHUD();}
      else if(v.reason==='cooldown')this.game.toast(en?'Let them rest a moment':'猫猫想休息一会儿');
      else if(v.reason==='treats')this.game.toast(en?'Not enough treats':'零食不够啦');
      this._duoPicked=[a.uid,b.uid];this.game.refreshYardSurprise();this.openBondPanel();
    };
    document.getElementById('duo-return').onclick=()=>this.openJourney();
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
    return Object.entries(gift)
      .filter(([, amount]) => Number.isFinite(amount) && amount > 0)
      .map(([resource, amount]) => `${this.resIcon(resource) || resource}+${amount}`)
      .join(' ');
  },
  resIcon(k) { return ({ coins: '🪙', fish: '🐟', yarn: '🧶', luck: '🍀', xp: '✨', treats: '🍖' })[k] || ''; },

  panel(html) {
    const p = document.getElementById('panel');
    p.innerHTML = `<div class="card">${html}</div><button type="button" class="panel-dismiss" aria-label="关闭面板 / Close panel" title="关闭 / Close">×</button>`;
    p.dataset.mandatory = 'false';
    p.classList.add('open');
    // The × remains accessible regardless of card scroll position.
    p.querySelector('.panel-dismiss').onclick = e => {e.stopPropagation();this.closeAll();};
    p.onclick = e => { if (e.target === p) this.closeAll(); };
  },
  closeAll() {
    const panel=document.getElementById('panel');
    panel.classList.remove('open');
    delete panel.dataset.mandatory;
    this.openCatUid = null;
    // Dismissing any optional overlay must never leave the yard action strip
    // hidden after a previous encounter or canceled pre-battle choice.
    if(this.game?.scene==='yard'&&!this.game.battle)this.game.showYardChrome();
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === 'yard'));
  },

  // ---------- roster ----------
  // ---- 工坊: 派工生产 + 繁育 (idle/placement economy) ----
  // Explain economy on its first screen: passive money is earned by the
  // staffed Sun station, stored locally, then manually collected to the wallet.
  openWorkshop() {
    if(!window.Raising){this.panel('<span class="card-close">×</span><h2>工坊</h2><p>加载中…</p>');return;}
    const en=window.MorrowwishI18n?.get?.()!=='zh';
    const stations=Raising.stationsView().filter(st=>st.res)
      .sort((a,b)=>['sun','fishing','yarn','watch'].indexOf(a.type)-['sun','fishing','yarn','watch'].indexOf(b.type));
    const sun=stations.find(st=>st.type==='sun');
    const rate=Number(sun?.ratePerHour||0);
    const pending=stations.reduce((n,st)=>n+st.stored,0);
    const firstPay=!!(State.S.raising?.firstSunPay&&!State.S.raising?.firstSunCollected&&sun?.stored>0);
    const descriptions={
      sun:[en?'Earn coins':'晒太阳赚金币',en?'Spend coins on food, treats and upgrades':'金币用于喂猫、买零食、升级工坊'],
      fishing:[en?'Catch fish':'钓小鱼干',en?'Train cat levels and buy rare-cat lures':'小鱼干用于练级、买稀有诱饵'],
      yarn:[en?'Make yarn':'织毛线',en?'Increase stats and upgrade stations':'毛线用于猫咪属性特训与升级'],
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
          <div class="st-name">${name} <span class="tiny">Lv.${st.level}</span></div>
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
          <button class="btn ghost tiny-btn" data-act="upgrade" data-id="${st.id}">${en?'Upgrade':'升级'}<small>${cost.coins}🪙+${cost.yarn}🧶</small></button>
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
    }else if(act==='assign'){
      this.openCatPicker(en?'Choose a working cat':'选择上工的猫',uid=>{
        const x=R.assignCat(id,uid);
        this.game.toast(x?.ok
          ?(x.firstPay?(en?'First wages +12 coins!':'首班工资 +12 金币！'):(en?'Assigned!':'派工成功！'))
          :(x?.msg||'派工失败'));
        State.save();this.openWorkshop();
      });
    }else if(act==='breed')this.openBreedPicker();
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
    const chips = cats.map(c => { const sp = GameData.speciesById(c.species); const busy = window.Raising && Raising.isBusy && Raising.isBusy(c.uid); return `<div class="chip ${busy ? 'busy' : ''}" data-uid="${c.uid}"><canvas width="44" height="38"></canvas><div><div style="font-weight:700">${State.catName(c)}</div><div class="tiny">${busy ? '工作中' : 'Lv.' + c.level}</div></div></div>`; }).join('');
    this.panel(`<span class="card-close">×</span><h2>${title}</h2><div class="roster">${chips}</div>`);
    document.querySelectorAll('#panel .chip').forEach(chip => {
      const c = cats.find(x => x.uid === chip.dataset.uid);
      CatArt.renderCatThumb(chip.querySelector('canvas'), GameData.speciesById(c.species));
      chip.onclick = () => onPick(chip.dataset.uid);
    });
  },
  openBreedPicker() {
    const cats = State.S.cats; this._breedSel = [];
    const render = () => {
      const chips = cats.map(c => { const sp = GameData.speciesById(c.species); const sel = this._breedSel.includes(c.uid); return `<div class="chip ${sel ? 'sel' : ''}" data-uid="${c.uid}"><canvas width="44" height="38"></canvas><div><div style="font-weight:700">${sp.name}</div><div class="tiny">${GameData.RARITY[sp.rarity].name}</div></div></div>`; }).join('');
      this.panel(`<span class="card-close">×</span><h2>🥚 选两只猫繁育</h2><p class="sub">已选 ${this._breedSel.length}/2</p><div class="roster">${chips}</div><div class="btn-row"><button class="btn gold" id="bp-go" ${this._breedSel.length === 2 ? '' : 'disabled'}>开始孵化</button></div>`);
      document.querySelectorAll('#panel .chip').forEach(chip => {
        const c = cats.find(x => x.uid === chip.dataset.uid);
        CatArt.renderCatThumb(chip.querySelector('canvas'), GameData.speciesById(c.species));
        chip.onclick = () => { const u = chip.dataset.uid; const i = this._breedSel.indexOf(u); if (i >= 0) this._breedSel.splice(i, 1); else if (this._breedSel.length < 2) this._breedSel.push(u); render(); };
      });
      const go = document.getElementById('bp-go'); if (go) go.onclick = () => { const r = Raising.startBreeding(this._breedSel[0], this._breedSel[1]); this.game.toast(r && r.ok ? '🥚 开始孵化！' : (r && r.msg) || '无法繁育'); State.save(); this.openWorkshop(); };
    };
    render();
  },

  openRoster() {
    const cats=State.S.cats||[];
    const english=window.MorrowwishI18n?.get?.()!=='zh';
    if(cats.length===0){
      this.panel(`<span class="card-close">×</span><h2>${english?'My Cats':'我的猫猫'}</h2>
        <p class="sub">${english?'Find your first cat in the yard!':'还没有猫猫，去庭院捉迷藏吧！'}</p>`);
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
      return `<button type="button" class="dex-cell breed-group ${mastered?'golden-paw':''}" data-breed="${id}"
        aria-label="${english?'Open':'查看'} ${sp.name} ${group.length}">
        ${mastered?'<span class="golden-paw-stamp">🏅 S</span>':''}
        ${group.length>1?'<span class="breed-group-count">×'+group.length+'</span>':''}
        <canvas width="90" height="76"></canvas>
        <div class="name">${sp.name}</div>
        <div class="rarity rarity-${sp.rarity}">${GameData.RARITY[sp.rarity].name}</div>
        <div class="tiny">${english?'Top Lv.':'最高等级 Lv.'}${strongest.level}</div>
      </button>`;
    }).join('');
    this.panel(`<span class="card-close">×</span>
      <h2>${english?'My Cats':'我的猫猫'} <span class="tiny">(${cats.length})</span></h2>
      <p class="sub">${english
        ?speciesGroups.size+' breeds · Duplicate cats are grouped; tap a breed to manage them.'
        :'已收集 '+speciesGroups.size+' 个品种 · 同品种合并展示，点开可管理每一只。'}</p>
      <div class="dex-grid">${cards}</div>`);
    document.querySelector('#panel .card')?.classList.add('cat-highlight-card');
    document.querySelectorAll('#panel [data-breed]').forEach(cell=>{
      const sp=GameData.speciesById(cell.dataset.breed);
      CatArt.renderCatThumb(cell.querySelector('canvas'),sp);
      cell.addEventListener('click',()=>{
        const group=speciesGroups.get(sp.id);
        if(group.length===1)this.openCatDetail(group[0]);
        else this.openBreedRoster(sp,0);
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
        <span><strong>${safe(State.catName(cat))}</strong><small>Lv.${cat.level} · ❤ ${Math.round(cat.affinity)}
          · ⚔ ${State.catPower(cat)}${cat.shiny?' · ✨':''}</small></span>
        <span aria-hidden="true">›</span>
      </button>`).join('');
    this.panel(`<span class="card-close">×</span>
      <h2>${species.name} <span class="tiny">×${all.length}</span></h2>
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
      CatArt.renderCatThumb(button.querySelector('canvas'),species);
      button.onclick=()=>this.openCatDetail(cat);
    });
    document.getElementById('breed-prev').onclick=()=>this.openBreedRoster(species,current-1);
    document.getElementById('breed-next').onclick=()=>this.openBreedRoster(species,current+1);
    document.getElementById('breed-back').onclick=()=>this.openRoster();
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
    const feedCost = 5, playCost = 0;
    const dispName = State.catName(cat);
    const sub = cat.nickname ? ` <span class="tiny" style="font-weight:400">· ${sp.name}</span>` : '';
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
          <div class="stat-row"><span class="label">等级</span><span class="val" style="width:auto">Lv.${cat.level}</span></div>
          <div class="stat-row"><span class="label">经验</span><div class="bar xp"><span style="width:${Math.round(cat.xp / need * 100)}%"></span></div><span class="val">${Math.round(cat.xp)}/${need}</span></div>
          <div class="stat-row"><span class="label">好感 (${tierText})</span><div class="bar aff"><span style="width:${cat.affinity}%"></span></div><span class="val">${Math.round(cat.affinity)}</span></div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 18px;margin-top:12px">
        ${statLine('力量', cat.stats.pow)}${statLine('敏捷', cat.stats.agi)}
        ${statLine('体力', cat.stats.vit)}${statLine('魅力', cat.stats.cha)}
      </div>
      <div class="stat-row" style="margin-top:12px"><span class="label">饱食</span><div class="bar hp"><span style="width:${cat.hunger}%"></span></div><span class="val">${Math.round(cat.hunger)}</span></div>
      <div class="stat-row"><span class="label">心情</span><div class="bar aff"><span style="width:${cat.joy}%"></span></div><span class="val">${Math.round(cat.joy)}</span></div>
      <p class="tiny" style="margin-top:8px">战力 ⚔ ${State.catPower(cat)}${cat.personality ? ' · 性格: ' + cat.personality : ''}${cat.trait ? ' · 特性: ' + cat.trait : ''}</p>
      ${this.evoRowHtml(cat)}
      <p class="sub" style="margin:12px 0 4px">🎣 用挂机产出培养它变强</p>
      <div class="btn-row">
        <button class="btn gold" id="cd-trainxp">🐟 喂鱼练级 (×3🐟 → +经验)</button>
        <button class="btn" id="cd-trainstat">🧶 毛线特训 (×8🧶 → 全属性+)</button>
      </div>
      <div class="btn-row">
        <button class="btn" id="cd-skills">📖 技能搭配</button>
        <button class="btn ghost" id="cd-pet">🤲 撸猫</button>
        <button class="btn ghost" id="cd-feed">🍖 喂食 (${feedCost}🪙)</button>
        <button class="btn ghost" id="cd-tease">🪶 逗猫</button>
      </div>`;
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
      if (State.S.coins < feedCost) { this.game.toast('金币不足'); return; }
      State.S.coins -= feedCost; cat.hunger = Math.min(100, cat.hunger + 35); cat.joy = Math.min(100, cat.joy + 8);
      const old=new Set(window.Skills?.learnableSkills(cat).map(sk=>sk.id)||[]);
      cat.affinity = Math.min(100, cat.affinity + 1); State.addXp(cat, 6);
      window.MorrowwishAudio?.effect?.('feed');
      const unlocked=this.announceSkillMilestone(cat,old);
      State.save();this.game.refreshHUD();this.renderCatDetail(cat);
      this.game.toast(unlocked?'✨ 学会新技能：'+unlocked.name+'！':'🍖 吃得好开心');
    };
    document.getElementById('cd-tease').onclick = () => this.openTease(cat);
    document.getElementById('cd-skills').onclick = () => this.openSkillEditor(cat);
    // 培养: fish → XP (scaled to level so it stays useful), yarn → permanent stats
    document.getElementById('cd-trainxp').onclick = () => {
      if (State.S.fish < 3) { this.game.toast('小鱼干不足（去钓鱼位产出）'); return; }
      const old=new Set(window.Skills?.learnableSkills(cat).map(sk=>sk.id)||[]);
      State.S.fish -= 3;
      const gain = 20 + cat.level * 12;        // scales so high-level cats still progress
      const lv = State.addXp(cat, gain);
      cat.hunger = Math.min(100, cat.hunger + 20);
      const unlocked=this.announceSkillMilestone(cat,old);
      State.save();this.game.refreshHUD();this.renderCatDetail(cat);
      this.game.toast(unlocked?'✨ '+State.catName(cat)+' 学会 '+unlocked.name+'！'
        :(lv?`🎉 升到 Lv.${cat.level}！(+${gain}经验)`:`🐟 +${gain} 经验`));
    };
    document.getElementById('cd-trainstat').onclick = () => {
      const yarn = (State.S.raising && State.S.raising.yarn) || 0;
      if (yarn < 8) { this.game.toast('毛线不足（去毛线坊产出）'); return; }
      State.S.raising.yarn -= 8;
      cat.stats.pow += 1; cat.stats.agi += 1; cat.stats.vit += 1; cat.stats.cha += 1;
      State.save(); this.game.refreshHUD(); this.renderCatDetail(cat);
      this.game.toast('🧶 特训完成！全属性 +1');
    };
    const renameBtn = document.getElementById('cd-rename');
    if (renameBtn) renameBtn.onclick = () => {
      const cur = cat.nickname || '';
      const name = (window.prompt('给它起个名字吧（最多6字）', cur) || '').trim().slice(0, 6);
      if (name !== null && name !== cur) { cat.nickname = name; State.save(); this.renderCatDetail(cat); this.game.toast(name ? '💛 ' + name + '，就是你啦！' : '已还原名字'); }
    };
    const evoBtn = document.getElementById('cd-evolve');
    if (evoBtn) evoBtn.onclick = () => this.doEvolve(cat);
    const growBtn = document.getElementById('cd-grow');
    if (growBtn) growBtn.onclick = () => this.doGrow(cat, null);
    document.querySelectorAll('#cat-detail [data-awaken]').forEach(b => b.onclick = () => this.doGrow(cat, b.dataset.awaken));
  },
  doGrow(cat, awakenKey) {
    const G = window.Growth; if (!G) return;
    const before = cat.stage || 0;
    const r = G.advance(cat, awakenKey);
    if (!r.ok) { this.game.toast('条件不足'); return; }
    State.save(); this.game.rebuildYard(); this.game.refreshHUD();
    const name = G.stageName(cat);
    if (cat.stage >= 2) this.openGrowthAnim(cat, name);
    else { this.renderCatDetail(cat); this.game.toast('🌟 成长为 ' + name + '！'); }
  },
  openGrowthAnim(cat, name) {
    const sp = GameData.speciesById(cat.species);
    const aw = window.Growth.AWAKEN[cat.awaken];
    const col = aw ? aw.color : '#ffd36b';
    this.panel(`<span class="card-close">×</span>
      <h2 class="center">★ 觉醒！</h2>
      <canvas id="evo-cv" width="200" height="170" style="display:block;margin:10px auto"></canvas>
      <p class="center">${sp.name} 觉醒为 <b style="color:${col}">${name}</b>！</p>
      <p class="sub center">${aw ? aw.desc : ''}</p>
      <div class="btn-row" style="justify-content:center"><button class="btn gold" onclick="UI.closeAll()">太棒了</button></div>`);
    const cv = document.getElementById('evo-cv'); const cx = cv.getContext('2d'); let tt = 0;
    const anim = () => {
      if (!document.getElementById('evo-cv')) return;
      tt += 0.04; cx.clearRect(0, 0, 200, 170);
      cx.save(); cx.translate(100, 95); cx.globalAlpha = 0.5;
      for (let i = 0; i < 14; i++) { cx.rotate(Math.PI / 7 + tt * 0.6); cx.fillStyle = withA2(col, 0.3); cx.fillRect(0, -3, 120, 6); }
      cx.restore();
      CatArt.drawCat(cx, 100, 105, { species: sp, scale: 1.3, face: 1, t: tt, pose: 'sit', mood: 'happy', growth: window.Growth.visual(cat) });
      requestAnimationFrame(anim);
    };
    anim();
  },

  // growth-form (成长形态) row + optional species 蜕变 row
  evoRowHtml(cat) {
    let html = this.growthRowHtml(cat);
    html += this.speciesEvoRowHtml(cat);
    return html;
  },
  // universal growth-form advancement (幼→成→灵觉醒)
  growthRowHtml(cat) {
    const G = window.Growth; if (!G) return '';
    const st = cat.stage || 0;
    const stageName = G.stageName(cat);
    if (st >= 2) {
      const aw = G.AWAKEN[cat.awaken];
      return `<div class="evo-row ready"><div class="evo-info">★ 已觉醒 <b style="color:${aw ? aw.color : '#ffd36b'}">${stageName}</b><div class="tiny">${aw ? aw.desc : ''} · 最终形态</div></div></div>`;
    }
    const chk = G.canAdvance(cat);
    const nextName = st === 0 ? '成形态' : '灵·觉醒';
    const reqStr = chk.ok ? '条件已满足！' : ('还需 ' + chk.missing.join(' · '));
    if (st === 1) {
      // awakening choice buttons
      return `<div class="evo-row ${chk.ok ? 'ready' : ''}">
        <div class="evo-info">★ 可觉醒为 <b>灵形态</b><div class="tiny">${reqStr}${chk.ok ? ' · 选择觉醒之路：' : ''}</div></div>
        ${chk.ok ? `<div class="awaken-pick">
          <button class="btn gold tiny-btn" data-awaken="pow">💪力</button>
          <button class="btn gold tiny-btn" data-awaken="agi">⚡速</button>
          <button class="btn gold tiny-btn" data-awaken="cha">💖心</button>
        </div>` : ''}
      </div>`;
    }
    return `<div class="evo-row ${chk.ok ? 'ready' : ''}">
      <div class="evo-info">${G.stageTag(cat) || '🐣'} 当前 <b>${stageName}</b> · 可成长为 <b>${nextName}</b><div class="tiny">${reqStr}</div></div>
      <button class="btn ${chk.ok ? 'gold' : ''}" id="cd-grow" ${chk.ok ? '' : 'disabled'}>成长</button>
    </div>`;
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
      `Lv.${req.level}${lvlOk ? '✓' : `(当前${cat.level})`}`,
      `好感${req.bond}${bondOk ? '✓' : ''}`,
      req.item ? `${req.item}×1${itemOk ? '✓' : '(缺)'}` : null,
    ].filter(Boolean).join(' · ');
    return `<div class="evo-row ${ready ? 'ready' : ''}">
      <div class="evo-info">🦋 可蜕变为 <b>${toSp.name}</b><div class="tiny">特殊变身 · ${reqStr}</div></div>
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

  openSkillEditor(cat) {
    const S = window.Skills; if (!S) { this.openCatDetail(cat); return; }
    S.ensureLoadout(cat);
    const learn = S.learnableSkills(cat) || [];          // skills actually unlocked
    const slots = [
      { i: 0, label: '普攻', kinds: ['melee', 'projectile'] },
      { i: 1, label: '技能1', kinds: ['melee', 'projectile', 'dash', 'buff', 'heal', 'aoe'] },
      { i: 2, label: '技能2', kinds: ['melee', 'projectile', 'dash', 'buff', 'heal', 'aoe'] },
      { i: 3, label: '必杀', kinds: ['aoe'], ult: true },
    ];
    const icon = sk => this.game.skillIcon ? this.game.skillIcon(sk) : '🐾';
    const kindName = { melee: '近战', projectile: '远程', dash: '突进', buff: '增益', heal: '治疗', aoe: '范围' };
    const rows = slots.map(slot => {
      const cur = S.skillById(cat.loadout[slot.i]);
      // candidates: learnable, matching the slot's allowed kinds, ult-slot only ults
      const opts = learn.filter(s => (slot.ult ? s.ultCost > 0 : s.ultCost === 0) && slot.kinds.indexOf(s.kind) >= 0);
      const chips = opts.map(s => {
        const on = cur && s.id === cur.id;
        return `<button class="sk-chip ${on ? 'on' : ''}" data-slot="${slot.i}" data-sk="${s.id}" title="${s.desc || ''}">${icon(s)} ${s.name}<span class="tiny">${kindName[s.kind] || ''}·${this.game.elemIcon(s.element)}</span></button>`;
      }).join('') || '<span class="tiny">暂无可选（提升等级/好感解锁）</span>';
      return `<div class="sk-slot"><div class="sk-slot-label">${slot.label}<div class="tiny">${cur ? cur.name : '空'}</div></div><div class="sk-opts">${chips}</div></div>`;
    }).join('');
    this.panel(`<span class="card-close">×</span>
      <h2>📖 ${State.catName(cat)} · 技能搭配</h2>
      <p class="sub">已解锁 ${learn.length} 种技能 · 点击替换 Q / E / 必杀。每只猫的元素与成长路线不同。</p>
      <p class="skill-roadmap">✨ ${S.progressionHint(cat)}</p>
      <p class="skill-progression-note">普通猫通过升级与好感解锁元素必杀；SR / SSR 更早解锁专属必杀。能量充满后按 R 或点击右下角释放。</p>
      <div class="sk-list">${rows}</div>
      <div class="btn-row"><button class="btn gold" id="sk-back">← 返回</button></div>`);
    this.panel && document.querySelectorAll('#panel .sk-chip').forEach(b => b.onclick = () => {
      const slotI = +b.dataset.slot, skId = b.dataset.sk;
      cat.loadout = cat.loadout.slice(); cat.loadout[slotI] = skId;
      cat.skillEdited=true;
      State.save(); this.openSkillEditor(cat);
      this.game.toast('已装备 ' + (S.skillById(skId) || {}).name);
    });
    document.getElementById('sk-back').onclick = () => this.openCatDetail(cat);
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
    const oldName = GameData.speciesById(cat.species).name;
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
      <p class="center"><b>${oldName}</b> 进化为 <b class="rarity-${toSp.rarity}">${toSp.name}</b>！</p>
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
        <div class="name">${locked ? '？？？' : sp.name}</div>
        <div class="rarity rarity-${sp.rarity}">${GameData.RARITY[sp.rarity].name}</div>
      </div>`;
    }).join('');
    const total = GameData.SPECIES.length;
    const owned = GameData.SPECIES.filter(s => State.S.dex[s.id]).length;
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
      <div class="dex-grid">${cells}</div>`);
    document.querySelector('#panel .card')?.classList.add('cat-highlight-card');
    document.querySelectorAll('#panel .dex-cell').forEach(cell => {
      const sp = GameData.speciesById(cell.dataset.id);
      if (!cell.classList.contains('locked')) {
        CatArt.renderCatThumb(cell.querySelector('canvas'), sp);
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
          <h2>${sp.name} <span class="rarity-${sp.rarity}">◆${GameData.RARITY[sp.rarity].name}</span></h2>
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
             ${en?'S: 80% HP, 8 hits or perfect dodge':'S：80%血量、8连击或完美闪避'} ·
             ${en?'Auto S: 95% HP, 16 hits, 60% time':'自动 S：95%血量、16连击、60%限时'}</p>
          <div class="btn-row" style="justify-content:center">
            <button class="btn gold" id="dx-rematch" ${canRematch?'':'disabled'}>${en?'⚔️ Try for S rank':'⚔️ 重战挑战 S 级'}</button>
            <button class="btn ghost" id="dx-back">${en?'Back to codex':'返回图鉴'}</button>
          </div>
          <p class="tiny center">${en?'Rank challenge: no duplicate cats or repeat capture rewards.'
            :'评级挑战不会重复捕捉猫咪，也不会重复领取金币。'}</p>`);
        document.querySelector('#panel .card')?.classList.add('cat-highlight-card');
        CatArt.renderCatThumb(document.getElementById('dx'),sp);
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
      <p class="sub">连续登录领更多奖励，第7天必得小鱼干！</p>
      <p class="center" style="font-size:1.1rem;margin:14px 0">🔥 连续签到 <b>${State.S.streak}</b> 天</p>
      <div class="btn-row" style="justify-content:center">
        <button class="btn gold" id="claim" ${avail ? '' : 'disabled'}>${avail ? '🎁 领取今日奖励' : '✅ 今日已领取'}</button>
      </div>
      <p class="tiny center" style="margin-top:10px">奖励随连签天数增长</p>`);
    const btn = document.getElementById('claim');
    if (btn && avail) btn.onclick = () => {
      const { reward, streak } = State.claimDaily();
      State.save(); this.game.refreshHUD();
      let msg = `+${reward.coins}🪙 +${reward.treats}🐟零食`;
      if (reward.fish) msg += ` +${reward.fish}🐠`;
      this.game.toast(`签到成功！${msg}`);
      this.openDaily();
    };
  },

  // ---------- shop ----------
  openShop() {
    this.panel(`<span class="card-close">×</span>
      <h2>小卖部</h2>
      <p class="sub">用金币与小鱼干换补给与运气</p>
      <div class="btn-row" style="flex-direction:column;align-items:stretch">
        <button class="btn gold" data-buy="treat5">🐟 零食 ×5 — 30🪙</button>
        <button class="btn gold" data-buy="treat15">🐟 零食 ×15 — 75🪙</button>
        <button class="btn" data-buy="lure">🍀 幸运诱饵 ×1 (下次捉迷藏更易遇稀有) — 2🐠</button>
        <button class="btn ghost" data-buy="fish">🐠 用 60🪙 兑换 1 小鱼干</button>
      </div>
      <p class="sub" style="margin-top:14px">💎 进化石（猫咪进化所需）</p>
      <div class="btn-row" style="flex-direction:column;align-items:stretch">
        <button class="btn" data-buy="stone:夜影石">🌑 夜影石 ×1 — 3🐠</button>
        <button class="btn" data-buy="stone:月华露">🌙 月华露 ×1 — 4🐠</button>
        <button class="btn" data-buy="stone:赤焰晶">🔥 赤焰晶 ×1 — 4🐠</button>
      </div>
      <p class="tiny center" style="margin-top:12px">小鱼干也可每日签到获得</p>`);
    document.querySelectorAll('#panel [data-buy]').forEach(b => {
      b.onclick = () => this.buy(b.dataset.buy);
    });
  },
  buy(what) {
    const S = State.S;
    const spend = (coins = 0, fish = 0) => {
      if (S.coins < coins || S.fish < fish) { this.game.toast('资源不足'); return false; }
      S.coins -= coins; S.fish -= fish; return true;
    };
    if (what === 'treat5' && spend(30)) { S.treats += 5; this.game.toast('+5 零食'); }
    else if (what === 'treat15' && spend(75)) { S.treats += 15; this.game.toast('+15 零食'); }
    else if (what === 'lure' && spend(0, 2)) { S.luckLure += 1; this.game.toast('🍀 幸运诱饵就绪'); }
    else if (what === 'fish' && spend(60)) { S.fish += 1; this.game.toast('+1 小鱼干'); }
    else if (what && what.indexOf('stone:') === 0) {
      const name = what.slice(6);
      const cost = name === '夜影石' ? 3 : 4;
      if (spend(0, cost)) { S.evoStones = S.evoStones || {}; S.evoStones[name] = (S.evoStones[name] || 0) + 1; this.game.toast('获得 ' + name); }
    }
    State.save(); this.game.refreshHUD();
  },

  // ---------- feed (quick) ----------
  openFeed() {
    const cats = State.S.cats;
    if (!cats.length) { this.game.toast('还没有猫猫'); return; }
    this.panel(`<span class="card-close">×</span>
      <h2>喂食全员</h2>
      <p class="sub">花 ${cats.length * 4}🪙 给所有猫猫加餐</p>
      <div class="btn-row" style="justify-content:center">
        <button class="btn gold" id="feedall">🍖 全部喂食</button>
      </div>`);
    document.getElementById('feedall').onclick = () => {
      const cost = cats.length * 4;
      if (State.S.coins < cost) { this.game.toast('金币不足'); return; }
      State.S.coins -= cost;
      cats.forEach(c => { c.hunger = Math.min(100, c.hunger + 35); c.joy = Math.min(100, c.joy + 6); State.addXp(c, 4); });
      window.MorrowwishAudio?.effect?.('feed');
      State.save(); this.game.refreshHUD(); this.game.toast('🍖 全员吃饱啦'); this.closeAll();
    };
  },

  // ---------- tease mini-game (逗猫) ----------
  openTease(cat) {
    const cats = State.S.cats;
    if (!cats.length) { this.game.toast('还没有猫猫'); return; }
    const target = cat || cats[0];
    this.panel(`<span class="card-close">×</span>
      <h2>逗猫 🪶</h2>
      <p class="sub">点击逗猫棒，让 ${GameData.speciesById(target.species).name} 扑抓！抓中越多，好感与心情涨得越快。</p>
      <div style="position:relative;height:220px;background:rgba(255,255,255,0.04);border-radius:12px;overflow:hidden" id="tease-area">
        <canvas id="tz" width="500" height="220" style="width:100%;height:100%"></canvas>
      </div>
      <p class="center" style="margin-top:8px">得分 <b id="tz-score">0</b> / 10</p>
      <div class="btn-row" style="justify-content:center"><button class="btn ghost" id="tz-done">结束</button></div>`);
    this.runTease(target);
  },

  runTease(cat) {
    const sp = GameData.speciesById(cat.species);
    const cv = document.getElementById('tz');
    const ctx = cv.getContext('2d');
    const W = 500, H = 220;
    let score = 0, misses = 0, tt = 0, active = true;
    // feather toy position
    let fx = W / 2, fy = H / 2, tx = fx, ty = fy, moveTimer = 0;
    // cat position chases toy
    let cx = W / 2, cy = H - 40, pounce = 0;
    const scoreEl = document.getElementById('tz-score');

    const area = document.getElementById('tease-area');
    const tap = e => {
      if (!active) return;
      const r = cv.getBoundingClientRect();
      const p = e.touches ? e.touches[0] : e;
      const mx = (p.clientX - r.left) * (W / r.width);
      const my = (p.clientY - r.top) * (H / r.height);
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
    area.addEventListener('mousedown', tap);
    area.addEventListener('touchstart', e => { tap(e); e.preventDefault(); }, { passive: false });

    const finish = () => {
      if (!active) return;
      active = false;
      const gain = 3 + score;
      cat.affinity = Math.min(100, cat.affinity + gain * 0.8);
      cat.joy = Math.min(100, cat.joy + gain);
      State.addXp(cat, gain * 2);
      State.save(); this.game.refreshHUD();
      this.game.toast(`逗猫结束！好感 +${Math.round(gain * 0.8)}`);
      if (this.openCatUid === cat.uid) this.renderCatDetail(cat);
    };
    document.getElementById('tz-done').onclick = finish;

    const anim = () => {
      if (!document.getElementById('tz')) { active = false; return; }
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
        pose:pounce>0?'play':'walk',motion:1,mood:'alert'
      });
      // feather toy
      ctx.save(); ctx.translate(fx, fy);
      ctx.strokeStyle = '#b5a6cf'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(10, 18); ctx.stroke();
      ctx.fillStyle = '#ff7b9c'; ctx.font = '20px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('🪶', 0, 0);
      ctx.restore();
      if (active) requestAnimationFrame(anim);
    };
    anim();
  },

  // Region encounters and grade rematches do not use the capture roster.
  // They must still ask BEFORE launching the real-time encounter.
  openBattleModePrompt(team,wildSp,opts={}){
    const en=window.MorrowwishI18n?.get?.()!=='zh';
    const prefs=State.S.battlePrefs||{};
    let auto=prefs.modeChosen?!!prefs.autoBattle:
      ((State.S.catchCount||0)===0?true:!!prefs.autoBattle);
    const label=opts.mastery?(en?'Golden Paw rematch':'金爪评级挑战')
      :(en?'Wild cat encounter':'发现野生猫咪');
    this.panel(`<span class="card-close">×</span>
      <h2>${label}</h2><p class="sub">${en?'Choose how your team will fight before entering the arena.':'进入战场前，先决定让猫咪自动作战，还是亲自操作。'}</p>
      <fieldset class="capture-mode-picker">
        <legend>${en?'Control mode':'战斗方式'}</legend>
        <div class="capture-mode-options" role="radiogroup" aria-label="${en?'Battle mode':'战斗模式'}">
          <button type="button" class="capture-mode-option ${auto?'selected':''}" role="radio" data-battle-auto="true" aria-checked="${auto}">
            <strong>${en?'🤖 Auto battle':'🤖 自动战斗'}</strong>
            <span>${en?'Cats move, attack, use skills and dodge for you.':'猫咪自动移动、攻击、释放技能和闪避。'}</span>
          </button>
          <button type="button" class="capture-mode-option ${auto?'':'selected'}" role="radio" data-battle-auto="false" aria-checked="${!auto}">
            <strong>${en?'🎮 Manual control':'🎮 手动操作'}</strong>
            <span>${en?'Control the cat yourself; switch to auto whenever needed.':'自己控制小猫，也可以随时改成自动。'}</span>
          </button>
        </div>
        <p class="capture-mode-note">${(State.S.catchCount||0)===0&&!prefs.tutorialSeen?
          (en?'First encounter includes a skippable tutorial.':'首次战斗附带可跳过的新手教学。'):
          (en?'The game remembers your last selection.':'系统会记住上一次选择。')}</p>
      </fieldset>
      <div class="btn-row"><button class="btn gold" id="bp-go">${en?'Start battle':'开始战斗'}</button>
      <button class="btn ghost" id="bp-cancel">${en?'Not now':'暂不出战'}</button></div>`);
    const options=[...document.querySelectorAll('#panel .capture-mode-option')];
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
    document.getElementById('bp-cancel').onclick=()=>{
      this.closeAll();
      if(opts.mastery)this.openDex();
      else if(this.game.scene==='yard')this.game.showYardChrome();
    };
    document.getElementById('bp-go').onclick=()=>{
      State.S.battlePrefs={...State.S.battlePrefs,autoBattle:auto,modeChosen:true};
      State.save();this.closeAll();
      if(opts.mastery){this.game.startMasteryChallenge(wildSp,true);return;}
      if(opts.origin==='map'){
        this.game._returnScene='map';this.game._battleTheme=opts.theme||null;
      }
      this.game.startBattle(team,wildSp);
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
    const initialAuto=prefs.modeChosen?!!prefs.autoBattle
      :(firstCapture?true:!!prefs.autoBattle);
    this.prepAutoBattle=initialAuto;
    const hasMedal=!!State.S.masteryBadges?.[wildSp.id];
    const deadline=this.game.gradeTimeLimit(wildSp.rarity);
    const masteryChallenge=english
      ?('🏅 S: Win in '+deadline+'s · Keep 80% HP · 8-hit combo or perfect dodge. Auto S: 95% HP · 16 hits · 60% time limit. '
        +(hasMedal?'Golden Paw already earned.':'First S unlocks a permanent Golden Paw and a rare-cat lure.'))
      :('🏅 S：'+deadline+'秒内获胜 · 保留80%血量 · 8连击或完美闪避。自动 S 还需95%血量、16连击、耗时不超过标准的60%。'
        +(hasMedal?'该品种已有金爪徽章。':'首次 S 解锁永久金爪徽章和稀有猫诱饵。'));
    if (!cats.length) {
      this.panel(`<span class="card-close">×</span><h2>发现野生猫猫</h2><p class="sub">你还没有伙伴猫，无法发起捕捉。</p>`);
      return;
    }
    // "My Cats" groups by breed; battle selection must use the same
    // representation. A duplicate breed is not a second battle character.
    // Keep all owned instances intact; choose the strongest for each breed.
    const sortedAll = [...cats].sort((a, b) => State.catPower(b) - State.catPower(a));
    const breedCounts = new Map();
    const sorted = sortedAll.filter(c => {
      breedCounts.set(c.species,(breedCounts.get(c.species)||0)+1);
      return true;
    }).filter((c, i, arr) => arr.findIndex(x=>x.species===c.species)===i);
    const preferred=window.CatRelations?.chosen?.()||[];
    const duo=preferred.length===2?preferred.filter(c=>sorted.some(t=>t.uid===c.uid)):[];
    this.teamUids=[...duo,...sorted.filter(c=>!duo.some(d=>d.uid===c.uid))].slice(0,3).map(c=>c.uid);
    const chips = sorted.map(c => {
      const sp = GameData.speciesById(c.species);
      const sel = this.teamUids.includes(c.uid);
      const inDuo=duo.some(d=>d.uid===c.uid);
      return `<div class="chip ${sel ? 'sel' : ''} ${inDuo?'duo-member':''}" data-uid="${c.uid}">
        <canvas width="44" height="38"></canvas>
        <div><div style="font-weight:700">${State.catName(c)} ${inDuo?'💞':''}</div><div class="tiny">⚔${State.catPower(c)} ❤${Math.round(c.affinity)}${breedCounts.get(c.species)>1?(english?' · '+breedCounts.get(c.species)+' owned':' · 拥有'+breedCounts.get(c.species)+'只'):''}</div></div>
      </div>`;
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
      <h2>发现野生 <span class="rarity-${wildSp.rarity}">${wildSp.name}</span></h2>
      <p class="sub">${wildSp.desc}</p>
      <canvas id="cp-wild" width="160" height="120" style="display:block;margin:4px auto;background:rgba(255,255,255,0.04);border-radius:12px"></canvas>
      <p class="center tiny">稀有度 <span class="rarity-${wildSp.rarity}">◆${rar.name}</span> · 越稀有斗志越强</p>
      ${skillPreview?'<p class="center tiny skill-discovery">'+(english?'Elemental ultimate to unlock: ':'可培养解锁元素必杀：')+skillPreview+'</p>':''}
      ${firstCapture?'':'<p class="center tiny capture-challenge">'+masteryChallenge+'</p>'}
      <h3 style="margin:14px 0 6px;font-size:0.95rem">${firstCapture?'你的猫咪准备好出战啦！':'组建出战队伍（最多 3 只，点击选择）'}</h3>
      ${duo.length===2&&!firstCapture?'<p class="duo-team-hint">'+(english?'💞 Your chosen duo has joined this battle team.':'💞 已自动选中当前双猫搭档，一起出战。')+'</p>':''}
      <div class="roster" id="cp-roster" style="${firstCapture?'display:none':''}">${chips}</div>
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
      <div class="btn-row">
        <button class="btn gold" id="cp-go">${firstCapture?'出发！收服这只猫':'开始战斗'}</button>
        <button class="btn" id="cp-ai" style="${firstCapture?'display:none':''}">⚙️ AI策略</button>
        <button class="btn ghost" id="cp-cancel">放它走</button>
      </div>`);
    document.querySelector('#panel .card')?.classList.add('cat-highlight-card');
    CatArt.renderCatThumb(document.getElementById('cp-wild'), wildSp);
    const roster = document.getElementById('cp-roster');
    const refreshSel = () => roster.querySelectorAll('.chip').forEach(ch => ch.classList.toggle('sel', this.teamUids.includes(ch.dataset.uid)));
    roster.querySelectorAll('.chip').forEach(chip => {
      const c = cats.find(x => x.uid === chip.dataset.uid);
      CatArt.renderCatThumb(chip.querySelector('canvas'), GameData.speciesById(c.species));
      chip.onclick = () => {
        const uid = chip.dataset.uid;
        const idx = this.teamUids.indexOf(uid);
        if (idx >= 0) { if (this.teamUids.length > 1) this.teamUids.splice(idx, 1); }  // keep at least 1
        else { if (this.teamUids.length >= 3) this.teamUids.shift(); this.teamUids.push(uid); }
        refreshSel();
      };
    });
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
    document.getElementById('cp-ai').onclick = () => this.openGambitEditor(wildSp);
    document.getElementById('cp-go').onclick = () => {
      // preserve the selection order; fall back to strongest if somehow empty
      const team = this.teamUids.map(uid => cats.find(x => x.uid === uid)).filter(Boolean);
      changeBattleMode(this.prepAutoBattle);
      this.closeAll();
      this.game.startBattle(team.length ? team : [sorted[0]], wildSp);
    };
  },

  // ---- Gambit editor: configure each team cat's auto-battle rule list ----
  openGambitEditor(wildSp) {
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
      return `<button class="gb-tab ${i === this._gbIdx ? 'sel' : ''}" data-i="${i}">${s.name}</button>`;
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
      <h2>⚙️ AI 策略 <span class="tiny">自上而下逐条判定</span></h2>
      <p class="sub">给每只猫配置自动战斗规则：满足「条件」就执行「动作」，最先命中的生效。</p>
      <div class="gb-tabs">${tabs}</div>
      <p class="tiny" style="margin:6px 0"><b>${sp.name}</b> · ${S.elementOf ? this.game.elemIcon(S.elementOf(cat.species)) : ''} 元素 · 技能：${(cat.loadout || []).map(id => { const sk = S.skillById(id); return sk ? sk.name : ''; }).filter(Boolean).join(' / ') || '默认'}</p>
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
      <h2 class="center">${en?'Golden Paw Challenge':'金爪评级挑战'} · ${wildSp.name}</h2>
      <canvas id="mc-cat" width="180" height="140" style="display:block;margin:6px auto"></canvas>
      <div class="battle-grade grade-${grade}"><b>${grade}</b>
        <div><strong>${en?'Battle result':'挑战结果'}</strong><small>${en?'Best record':'历史最佳'} ${best}
          · ${en?'Medals':'金爪徽章'} ${this.game.masteryStatus().medals}/${GameData.SPECIES.length}</small></div>
      </div>
      <p class="center mastery-challenge-note">${note}</p>
      ${won&&performance?.autoUsed?'<p class="center mastery-grade-hint">'+(performance.autoExceptional
        ?(en?'Exceptional auto run!':'自动战斗发挥出色！')
        :(en?'Auto S requires 95% HP, 16 hits and 60% of the time limit.'
          :'自动 S 需要95%血量、16连击、耗时不超过标准的60%。'))+'</p>':''}
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
    const name=wildSp.name;
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
      ?(english?'Bonus: +'+performance.bonusCoins+' coins'+(performance.bonusTreats?' · +'+performance.bonusTreats+' treats':'')
        :'战斗奖励：+'+performance.bonusCoins+' 金币'+(performance.bonusTreats?' · +'+performance.bonusTreats+' 零食':''))
      :'';
    const rewardText=rewards.length
      ?rewards.map(r=>english
        ?('Collection bonus: +'+r.coins+' coins, +'+r.treats+' treats')
        :('图鉴奖励：+'+r.coins+' 金币，+'+r.treats+' 零食')).join(' · ')
      :'';
    this.panel(`<span class="card-close">×</span>
      <h2 class="center">🎉 ${headline}</h2>
      <canvas id="cr" width="180" height="140" style="display:block;margin:8px auto"></canvas>
      <p class="center"><b class="rarity-${wildSp.rarity}">${name}</b> ${reunion
        ?(english?'made your bond stronger':'让你们的纽带更深了')
        :(english?'joined your yard':'已加入庭院')}</p>
      ${reunion?'<p class="center reunion-reward">'
        +(english?'💞 This breed already has 2 resident cats. Strongest cat: +8 affection, +45 XP, plus 2 treats.'
          :'💞 同品种已有两只：最强的猫获得 +8 好感、+45 经验及 2 零食，不再增加重复个体。')
        +'</p>':''}
      <p class="sub center">${totalText} · ${goalText}</p>
      ${performance?'<div class="battle-grade grade-'+grade+'"><b>'+grade+'</b><div><strong>'+gradeLabel+'</strong><small>'+battleResult+' · '+performance.combo+' '+(english?'best combo':'最高连击')+'</small>'
         +(performance.autoUsed?'<small class="grade-explain">'+(performance.autoExceptional
           ?(english?'Exceptional automatic performance!':'自动战斗发挥出色！')
           :(english?'Auto S requires 95% HP · 16-hit combo · 60% time limit'
              :'自动 S 需要95%血量 · 16连击 · 60%时间限制'))+'</small>':'')+'</div></div>':''}
      ${rewardText?'<p class="center collection-reward">🎁 '+rewardText+'</p>':''}
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
        ?'Your new skill is ready! Try a different move, earn workshop coins, or explore a new region before your next capture.'
        :'新招式已经就绪！下一步可以试技能、经营工坊赚金币，或者去地图探索，不必一直抓猫。')+'</p>':''}
      <div class="btn-row" style="justify-content:center">
        ${duoUnlock?'<button class="btn gold" id="cr-duo">'+(english?'See duo skills':'查看双猫纽带')+'</button>':''}
        ${firstAdventure&&skillUnlock?'<button class="btn gold" id="cr-newskill">'+(english?'See my new skill':'查看刚解锁的新技能')+'</button>':''}
        <button class="btn ${firstAdventure&&!skillUnlock?'gold':firstAdventure?'':'ghost'}" id="cr-journey">${firstAdventure?(english?'Choose my next adventure':'看看接下来能玩什么'):(english?'Explore · Bond · Workshop':'探索 · 养成 · 工坊')}</button>
        <button class="btn ${firstAdventure?'':'gold'}" id="cr-next">${english?(exploring?'Keep exploring':'Find another wild cat'):(exploring?'继续探索':'再找一只野猫')}</button>
        <button class="btn" id="cr-ok">${english?(exploring?'Back to map':'Back to yard'):(exploring?'返回地图':'回庭院')}</button>
        ${!firstAdventure&&skillUnlock?'<button class="btn gold" id="cr-newskill">'+(english?'Try the new skill':'查看新技能')+'</button>':''}
        ${masteryReward?'<button class="btn gold" id="cr-medal">'+(english?'View medal collection':'查看金爪徽章')+'</button>':''}
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
      dismiss();
      if(this.game.scene==='yard'&&!this.game.yard.hide)this.game.yard.startHideAndSeek();
      window.arcadeMetric?.('bond_continue_search');
    };
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
      ?(adv.unlocked<=1?'Explore 40% of Home to unlock Sakura Woods'
        :adv.unlocked+'/'+adv.totalRegions+' regions unlocked')
      :(adv.unlocked<=1?'探索庭院地区 40%，解锁樱花林'
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
    const chips = options.map(sp => `<button type="button" class="dex-cell" data-id="${sp.id}" aria-label="选择 ${sp.name}">
      <canvas width="90" height="76"></canvas>
      <div class="tiny starter-element">${this.game.elemIcon(Skills.elementOf(sp.id))} ${english
        ?({fire:'Fire',grass:'Nature',water:'Water'}[Skills.elementOf(sp.id)]||'Element')
        :({fire:'火系',grass:'草系',water:'水系'}[Skills.elementOf(sp.id)]||'元素')}</div>
      <div class="name">${sp.name}</div>
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

window.UI = UI;
