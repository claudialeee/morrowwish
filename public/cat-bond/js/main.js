// main.js — boot sequence, intro screen, first-run starter, idle report.

window.addEventListener('DOMContentLoaded', () => {
  console.log('Cat Bond build v36 — reset save from the intro if a battle cannot start');
  // The published intro must follow the canonical playable species catalogue.
  // Keep Chinese as the source: the Cat Bond i18n layer translates it on mount
  // and on all later language changes without diverging the two labels.
  const introBreedCount=document.getElementById('intro-breed-count');
  const totalBreeds=window.GameData?.SPECIES?.length;
  if(introBreedCount && Number.isInteger(totalBreeds) && totalBreeds>0){
    introBreedCount.textContent=`🐾 收集 ${totalBreeds} 种猫`;
  }
  const game = new Game();
  window.__game = game;
  UI.init(game);

  // Emergency reset remains available only in the in-game Menu.
  // Reset State BEFORE reloading: pagehide/beforeunload auto-save otherwise
  // recreates the old save immediately after localStorage.removeItem().
  // Other Morrow Wish game saves and the language preference are untouched.
  const bindResetButton = button => {
    if(!button || button.dataset.cbResetBound==='1')return;
    button.dataset.cbResetBound='1';
    let armed=false,restoreTimer=null,originalLabel='';
    button.addEventListener('click',()=>{
      if(!armed){
        armed=true;
        originalLabel=button.textContent;
        button.classList.add('cb-reset-armed');
        button.setAttribute('aria-live','polite');
        button.textContent=window.MorrowwishI18n?.get?.()==='zh'
          ?'⚠ 确认清空猫猫存档？再点一次'
          :'⚠ Erase Cat Bond progress? Click again';
        restoreTimer=setTimeout(()=>{
          armed=false;
          button.classList.remove('cb-reset-armed');
          button.textContent=originalLabel;
        },5000);
        return;
      }
      clearTimeout(restoreTimer);
      State.hardReset();
      location.reload();
    });
  };
  window.CatBondBindResetButton=bindResetButton;

  // The intro is a real save-slot gateway: new adventure and continue are separate actions.
  let starting=false;
  const slotPanel=document.getElementById('intro-slot-panel');
  const slotList=document.getElementById('intro-slot-list');
  const slotHeading=document.getElementById('intro-slot-heading');
  let slotMode='continue';
  const closeSlots=()=>{slotPanel?.classList.remove('is-open');slotPanel?.setAttribute('aria-hidden','true');};
  const openSlots=mode=>{
    slotMode=mode;
    if(!slotPanel||!slotList)return;
    const en=window.MorrowwishI18n?.get?.()!=='zh';
    slotHeading.textContent=mode==='new'?(en?'Choose a slot for a new adventure':'选择一个存档位，开始新的冒险'):(en?'Choose a story to continue':'选择要继续的故事');
    const slotDesc=document.querySelector('.cb-save-picker-desc');
    if(slotDesc)slotDesc.textContent=en?'Three independent adventures. Choose a slot to continue or begin a new journey.':'三个独立旅程。选择一个位置继续，或开启新的冒险。';
    const slots=State.listSaveSlots();
    slotList.innerHTML=slots.map(slot=>{
      const date=slot.exists&&slot.savedAt?new Date(slot.savedAt).toLocaleString():'';
      const label=slot.exists
        ?(en?'Chapter: '+({ '第一章 · 空白页':'I · The Blank Page','第二章 · 旧约':'II · The Old Promise','第三章 · 失去的名字':'III · The Lost Name','第四章 · 最后的守铃者':'IV · The Last Bellkeeper','第五章 · 逆响':'V · The Reversed Bell','终章 · 最后一页':'Final Chapter · The Last Page','序章 · 倒着响的铃':'Prologue · A Bell in Reverse'}[slot.chapter]||slot.chapter):'章节：'+slot.chapter)
        :(en?'Empty slot':'空存档位');
      const meta=slot.exists
        ?(en?slot.cats+' cats · '+slot.fragments+'/6 memories · '+date:slot.cats+' 只猫 · '+slot.fragments+'/6 段记忆 · '+date)
        :(en?'Start a separate journey here':'在这里开启独立冒险');
      const action=mode==='new'?(slot.exists?(en?'Overwrite':'覆盖存档'):(en?'Start here':'在此开始')):(en?'Continue':'继续故事');
      const disabled=mode==='continue'&&!slot.exists;
      return '<article class="cb-save-slot '+(slot.exists?'has-save':'empty-slot')+'"><div class="cb-save-slot-top"><span class="cb-save-slot-number">'+(en?'SLOT ':'存档位 ')+slot.number+'</span><span class="cb-save-slot-status">'+(slot.exists?(en?'SAVED':'已有进度'):(en?'EMPTY':'空位'))+'</span></div><strong class="cb-save-slot-chapter">'+label+'</strong><small class="cb-save-slot-meta">'+meta+'</small><div class="cb-save-slot-actions"><button type="button" data-slot="'+slot.id+'" '+(disabled?'disabled':'')+'>'+action+'</button>'+(slot.exists?'<button type="button" data-delete-slot="'+slot.id+'">'+(en?'Delete':'删除')+'</button>':'')+'</div></article>';
    }).join('');
    slotPanel.classList.add('is-open');slotPanel.setAttribute('aria-hidden','false');
    slotList.querySelectorAll('[data-slot]').forEach(button=>button.addEventListener('click',()=>{
      const id=button.dataset.slot;
      if(slotMode==='new'){
        const occupied=State.listSaveSlots().find(s=>s.id===id)?.exists;
        if(occupied&&!window.confirm(en?'This will replace this slot’s adventure. Continue?':'这会覆盖该存档位的原有冒险。确定继续吗？'))return;
        beginGame('new',id);
      }else beginGame('continue',id);
    }));
    slotList.querySelectorAll('[data-delete-slot]').forEach(button=>button.addEventListener('click',()=>{
      const id=button.dataset.deleteSlot;
      if(!window.confirm(en?'Delete this saved adventure permanently?':'确定永久删除这个存档吗？'))return;
      State.deleteSlot(id);
      window.CatBondCloudSave?.queue?.();
      if(id===State.activeSlot()){closeSlots();location.reload();return;}
      openSlots(slotMode);
    }));
  };
  const beginGame=(mode,slotId,afterPrologue=false)=>{
    if(starting)return;
    starting=true;
    if(mode==='new'&&!afterPrologue){
      State.startNewGame(slotId);
      if(!State.S.story?.introSeen&&window.CatBondStory?.startPrologue){
        starting=false;
        window.CatBondStory.startPrologue(()=>{State.save();beginGame('new',slotId,true);});
        return;
      }
    }
    try{
      if(mode==='new'&&!afterPrologue)State.startNewGame(slotId);
      else if(mode==='continue'&&!State.loadSlot(slotId))throw new Error('Save slot is empty');
      game.start();
      closeSlots();
      document.getElementById('intro').classList.add('hide');
      window.__CAT_BOND_STARTED__=true;
      window.arcadeMetric?.('bond_entered',{mode,slot:slotId});
    }catch(error){
      starting=false;
      console.error('Cat Bond start failed',error);
      const hint=document.getElementById('start-error');
      if(hint){hint.hidden=false;hint.textContent=(window.MorrowwishI18n?.get?.()==='zh'?'游戏启动失败，请刷新页面重试：':'Game failed to start. Please refresh: ')+(error?.message||'');}
      return;
    }
    if(window.Raising)Raising.init();
    if(mode==='new'||State.S.cats.length===0){
      UI.openStarter(id=>{
        const starter=State.makeCat(id,{affinity:20});
        if(window.Raising)Raising.decorateNewCat(starter);
        State.S.cats.push(starter);State.S.dex[id]=(State.S.dex[id]||0)+1;
        State.save();game.rebuildYard();game.refreshHUD();game.openWorldMap();game.refreshFirstQuest?.();
        window.arcadeMetric?.('bond_starter_chosen',{starter:id});
      });
    }else{
      const report=window.Raising?Raising.applyOffline(Date.now()):State.applyIdle();
      game.rebuildYard();game.refreshHUD();game.openWorldMap();
      const has=o=>o&&Object.values(o).some(v=>v>0);
      const worthShowing=report&&report.minutes>=1&&(has(report.produced)||has(report.gains)||(report.visitors&&report.visitors.length));
      if(worthShowing)setTimeout(()=>UI.openWelcomeBack(report),400);
    }
  };
  const renderIntroLocale=()=>{
    const en=window.MorrowwishI18n?.get?.()!=='zh';
    const set=(id,zh,enText)=>{const el=document.getElementById(id);if(el)el.innerHTML=en?enText:zh;};
    set('intro-start','<span>✦</span><strong>开始新的冒险</strong><small>NEW ADVENTURE</small>','<span>✦</span><strong>New Adventure</strong><small>NEW ADVENTURE</small>');
    set('intro-continue','<span>◈</span><strong>继续故事</strong><small>CONTINUE STORY</small>','<span>◈</span><strong>Continue Story</strong><small>CONTINUE STORY</small>');
    set('intro-cloud-save','☁️ 云端存档管理','☁️ Cloud Save Manager');
    const slotDesc=document.querySelector('.cb-save-picker-desc');
    if(slotDesc)slotDesc.textContent=en
      ?'Three independent adventures. Choose a slot to continue or begin a new journey.'
      :'三个独立旅程。选择一个位置继续，或开启新的冒险。';
    const tagline=document.querySelector('.cb-intro-tagline');
    if(tagline)tagline.textContent=en?'Before the final bell, whose name will you remember?':'最后一声铃响之前，你还记得谁？';
    const footer=document.querySelector('.cb-intro-footer>span');
    if(footer)footer.innerHTML=en?'Five chapters · Five lost lands · One unfinished promise · <span id="intro-breed-count">🐾 Collect 33 cat breeds</span>':'五章主线 · 五片失落之地 · 一段未完成的约定 · <span id="intro-breed-count">🐾 收集 33 种猫</span>';
  };
  renderIntroLocale();
  window.addEventListener('morrowwish-language-change',renderIntroLocale);
  document.getElementById('intro-start')?.addEventListener('click',()=>openSlots('new'));
  document.getElementById('intro-continue')?.addEventListener('click',()=>openSlots('continue'));
  document.getElementById('intro-slot-close')?.addEventListener('click',closeSlots);
  slotPanel?.addEventListener('click',event=>{if(event.target===slotPanel)closeSlots();});
  window.addEventListener('morrowwish-language-change',()=>{
    if(slotPanel?.classList.contains('is-open'))openSlots(slotMode);
  });
  try { startIntroStars(); } catch(error) { console.warn('Intro decoration unavailable',error); }
  try { paintIntroCatGallery(); } catch(error) { console.warn('Cat gallery unavailable',error); }
  window.__CAT_BOND_READY__=true;

  // dev screenshot harness: ?autodev seeds a lively yard & skips the intro
  if (location.search.includes('autodev') && /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
    // Development fixture must never erase progress from unrelated games.
    try { localStorage.removeItem('catbond_save_v1'); } catch (e) {}
    setTimeout(() => {
      document.getElementById('intro').classList.add('hide');
      game.start(); if (window.Raising) Raising.init();
      const ids = (GameData.SPECIES || []).slice(0, 4).map(s => s.id);
      ids.forEach(id => { const c = State.makeCat(id, { affinity: 30 }); if (window.Raising) Raising.decorateNewCat(c); State.S.cats.push(c); State.S.dex[id] = 1; });
      State.S.tutorialDone = true; State.save();
      game.rebuildYard(); game.refreshHUD();
    }, 300);
  }

  // auto-save periodically
  setInterval(() => { if (game._lastTs) State.save(); }, 8000);
  // A native app or Steam wrapper can suspend the WebView without unloading.
  // Persist on both pagehide and backgrounding; keep the save key compatible
  // with existing browser players for eventual cloud-save migration.
  window.addEventListener('beforeunload', () => State.save());
  window.addEventListener('pagehide', () => State.save());
  document.addEventListener('visibilitychange', () => {
    if(document.visibilityState === 'hidden') State.save();
  });
});

// Animated starfield + drifting moons behind the intro title.
function startIntroStars() {
  const cv = document.getElementById('intro-stars');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
  const resize = () => {
    const r = cv.getBoundingClientRect(); W = r.width; H = r.height;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize(); window.addEventListener('resize', resize);
  const stars = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.6 + 0.4, ph: Math.random() * 6, sp: 0.2 + Math.random() * 0.5 }));
  const motes = Array.from({ length: 14 }, () => ({ x: Math.random(), y: Math.random(), r: 2 + Math.random() * 3, vy: 0.00008 + Math.random() * 0.00012, vx: (Math.random() - 0.5) * 0.00008, c: ['#ffd36b', '#ff9db0', '#9d7bff', '#9be7c4'][Math.floor(Math.random() * 4)], ph: Math.random() * 6 }));
  let t = 0;
  const frame = () => {
    const intro = document.getElementById('intro');
    if (!intro || intro.classList.contains('hide')) return; // stop when game starts
    t += 0.016;
    ctx.clearRect(0, 0, W, H);
    for (const s of stars) {
      ctx.globalAlpha = 0.3 + 0.6 * Math.abs(Math.sin(t * s.sp + s.ph));
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2); ctx.fill();
    }
    for (const m of motes) {
      m.y -= m.vy; m.x += m.vx; if (m.y < -0.05) { m.y = 1.05; m.x = Math.random(); }
      ctx.globalAlpha = 0.5 + 0.4 * Math.sin(t + m.ph);
      const px = m.x * W, py = m.y * H;
      const g = ctx.createRadialGradient(px, py, 0, px, py, m.r * 3);
      g.addColorStop(0, m.c); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, m.r * 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  };
  frame();
}


// Intro artwork: show real, expressive in-game cat breeds rather than the
// empty decorative canvas. Kept static to minimize battery use on phones.
function paintIntroCatGallery() {
  const canvas=document.getElementById('intro-cats');
  if(!canvas||!window.CatArt||!window.GameData)return;
  const ctx=canvas.getContext('2d');if(!ctx)return;
  const w=canvas.width,h=canvas.height;
  ctx.clearRect(0,0,w,h);
  const species=GameData.speciesById('yunduo')||GameData.SPECIES?.[0];
  if(!species)return;
  const scratch=document.createElement('canvas');scratch.width=240;scratch.height=240;
  const sc=scratch.getContext('2d',{willReadFrequently:true});if(!sc)return;
  CatArt.drawCat(sc,120,142,{species,scale:1.42,face:1,pose:'sit',mood:'curious',t:.4});
  const pixels=sc.getImageData(0,0,240,240).data;
  let minX=240,minY=240,maxX=-1,maxY=-1;
  for(let y=0;y<240;y++)for(let x=0;x<240;x++){
    if(pixels[(y*240+x)*4+3]<40)continue;
    if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;
  }
  if(maxY<minY)return;
  const srcW=maxX-minX+1,srcH=maxY-minY+1;
  const catBottom=h-15,targetHeight=132,maxWidth=140;
  const ratio=Math.min(targetHeight/srcH,maxWidth/srcW);
  const drawW=srcW*ratio,drawH=srcH*ratio;
  const glow=ctx.createRadialGradient(w*.5,h*.65,4,w*.5,h*.65,h*.48);
  glow.addColorStop(0,'rgba(245,218,179,.28)');glow.addColorStop(1,'rgba(245,218,179,0)');
  ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
  ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  ctx.shadowColor='rgba(8,10,23,.55)';ctx.shadowBlur=22;ctx.shadowOffsetY=10;
  ctx.drawImage(scratch,minX,minY,srcW,srcH,w*.5-drawW*.5,catBottom-drawH,drawW,drawH);
  ctx.restore();
  ctx.globalAlpha=.75;ctx.fillStyle='#f3d8aa';ctx.font='16px Georgia';ctx.textAlign='center';
  ctx.fillText('✦',w*.18,h*.34);ctx.fillText('✧',w*.82,h*.22);ctx.fillText('✦',w*.72,h*.72);
}
