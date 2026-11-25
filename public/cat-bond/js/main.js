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
  const canonicalBuild=document.querySelector('meta[name="cat-bond-campaign"][content="last-resonance"]')!==null;
  if(canonicalBuild)window.__CAT_BOND_CANONICAL_ACTIVE__=true;
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
          ?'⚠ 再点一次：安全重启（保留三个存档）'
          :'⚠ Click again: safe restart (keep all saves)';
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

  // The title gateway offers two equal entry points into three isolated saves.
  let starting=false;
  const slotPanel=document.getElementById('intro-slot-panel');
  const slotList=document.getElementById('intro-slot-list');
  const slotHeading=document.getElementById('intro-slot-heading');
  let slotMode='continue';
  const closeSlots=()=>{slotPanel?.classList.remove('is-open');slotPanel?.setAttribute('aria-hidden','true');document.getElementById(slotMode==='new'?'intro-start':'intro-continue')?.focus();};
  const escapeText=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const openSlots=mode=>{
    slotMode=mode;
    if(!slotPanel||!slotList)return;
    const en=window.MorrowwishI18n?.get?.()!=='zh';
    slotHeading.textContent=mode==='new'?(en?'Choose a slot for a new adventure':'选择一个存档位，开始新的冒险'):(en?'Choose a story to continue':'选择要继续的故事');
    const slotDesc=document.querySelector('.cb-save-picker-desc');
    if(slotDesc)slotDesc.textContent=mode==='new'?(en?'Select an empty slot, or confirm an overwrite.':'选择空存档位，或确认覆盖已有存档。'):(en?'Select an existing adventure.':'选择要读取的存档。');
    const slots=State.listSaveSlots();
    slotList.innerHTML=slots.map(slot=>{
      const date=slot.lastSavedAt?new Date(slot.lastSavedAt).toLocaleString(en?'en-US':'zh-CN'):'';
      const chapter=slot.corrupt
        ?(en?'Damaged save':'存档损坏')
        :slot.exists
          ?(en?slot.chapterLabelEn:slot.chapterLabelZh)
          :(en?'Empty slot':'空存档位');
      const region=en?slot.regionLabelEn:slot.regionLabelZh;
      const mins=Math.floor((slot.playTimeMs||0)/60000);
      const played=en?'Played '+Math.floor(mins/60)+'h '+(mins%60)+'m':'游戏时间 '+Math.floor(mins/60)+'小时 '+(mins%60)+'分钟';
      const progress=en?slot.regionCount+'/6 sanctuaries · '+slot.cats+' cats':slot.regionCount+'/6 圣所 · '+slot.cats+' 只猫';
      const detail=slot.corrupt
        ?(en?'This save cannot be read. Start a new adventure here to replace it.':'无法读取此存档。可以在二次确认后重新开始并覆盖。')
        :slot.exists
          ?region+' · '+played+' · '+progress
          :(en?'No adventure has been started in this slot.':'这个存档位尚未开始冒险。');
      const saved=slot.exists&&!slot.corrupt
        ?(en?'Last saved: ':'最后保存：')+date
        :slot.corrupt?(en?'Recovery unavailable':'无法恢复'):'';
      const action=mode==='new'
        ?(slot.exists?(en?'Overwrite slot':'覆盖存档'):(en?'Start here':'在此开始'))
        :(slot.readable?(en?'Continue':'继续故事'):(en?'Empty':'空存档'));
      const disabled=mode==='continue'&&!slot.readable;
      return '<article class="cb-save-slot '+(slot.exists?'has-save':'empty-slot')+(slot.corrupt?' damaged-save':'')+'">'+
        '<div class="cb-save-slot-top"><span class="cb-save-slot-number">'+(en?'SLOT ':'存档位 ')+slot.number+'</span>'+
        '<span class="cb-save-slot-status">'+(slot.corrupt?(en?'DAMAGED':'损坏'):slot.exists?(en?'SAVED':'已有进度'):(en?'EMPTY':'空位'))+'</span></div>'+
        '<strong class="cb-save-slot-chapter">'+escapeText(chapter)+'</strong>'+
        '<small class="cb-save-slot-meta">'+escapeText(detail)+'</small>'+
        '<small class="cb-save-slot-saved-at">'+escapeText(saved)+'</small>'+
        '<div class="cb-save-slot-actions"><button type="button" data-slot="'+slot.id+'" '+(disabled?'disabled':'')+'>'+action+'</button>'+(slot.exists?'<button class="cb-title-delete" type="button" data-title-delete="'+slot.id+'">'+(en?'Delete':'删除')+'</button>':'')+'</div></article>';
    }).join('');
    slotPanel.classList.add('is-open');slotPanel.setAttribute('aria-hidden','false');
    const language=slotPanel.querySelector('[data-slot-language]');
    if(language){language.textContent=en?'中文':'English';language.setAttribute('aria-label',en?'Switch to Chinese':'切换到英文');}
    slotList.querySelectorAll('[data-title-delete]').forEach(button=>button.onclick=()=>{
      const id=button.dataset.titleDelete;
      const selected=State.listSaveSlots().find(s=>s.id===id);
      if(!selected?.exists||!confirm(en?'Permanently delete Slot '+selected.number+'?':'永久删除存档位 '+selected.number+'？'))return;
      const result=State.deleteSaveSlot(id,{confirmed:true});
      if(!result.ok){alert(en?'Could not delete this save.':'无法删除此存档。');return;}
      openSlots(slotMode);
    });
    slotList.querySelectorAll('[data-slot]').forEach(button=>button.addEventListener('click',()=>{
      const id=button.dataset.slot;
      if(slotMode==='new'){
        const selected=State.listSaveSlots().find(s=>s.id===id);
        const occupied=!!selected?.exists;
        if(occupied&&!window.confirm(en
          ?'Overwrite Save Slot '+selected.number+'? Its existing adventure will be replaced. The other two slots will remain untouched.'
          :'确定覆盖存档位 '+selected.number+'？原有冒险将被替换，另外两个存档位不会受到影响。'))return;
        beginGame('new',id,occupied);
      }else beginGame('continue',id);
    }));
  };
  const enterAdventure=done=>{
    if(window.CatBondTitlePrologue?.available?.()){
      window.CatBondTitlePrologue.start(game,{onWorld:done});return;
    }
    // The isolated legacy build remains a test baseline only. When formal
    // modules are present the canonical entry is exclusive, even on error.
    if(!State.S.story?.introSeen&&window.CatBondStory?.startPrologue)window.CatBondStory.startPrologue(done);
    else done();
  };
  const beginGame=(mode,slotId,overwriteConfirmed=false)=>{
    if(starting)return;
    starting=true;
    try{
      if(canonicalBuild&&(!window.CatBondTitlePrologue?.available?.()||!window.CatBondResonance||!window.CatBondCanonicalWorld))throw Error(window.MorrowwishI18n?.get?.()==='zh'?'正式剧情模块未加载，请刷新重试。':'The story modules did not load. Refresh and try again.');
      if(mode==='new'){
        if(!State.startNewGame(slotId,{overwriteConfirmed}))throw new Error(window.MorrowwishI18n?.get?.()==='zh'?'无法创建存档，请检查存储空间或覆盖确认。':'Could not create the save. Check storage space or overwrite confirmation.');
      }else if(!State.loadSlot(slotId))throw new Error(window.MorrowwishI18n?.get?.()==='zh'?'存档为空或已损坏，无法读取。':'The selected save is empty or damaged');
      window.__CAT_BOND_CANONICAL_ACTIVE__=!!window.CatBondTitlePrologue?.available?.();
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
    if(window.__CAT_BOND_CANONICAL_ACTIVE__&&(mode==='new'||State.S.cats.length===0)){
      enterAdventure(()=>{State.save();game.openWorldMap();});
    }else if(mode==='new'||State.S.cats.length===0){
      UI.openStarter(id=>{
        const starter=State.makeCat(id,{affinity:20});
        if(window.Raising)Raising.decorateNewCat(starter);
        State.S.cats.push(starter);State.S.dex[id]=(State.S.dex[id]||0)+1;
        State.save();
        const enterWorld=()=>{
          State.save();game.rebuildYard();game.refreshHUD();game.openWorldMap();game.refreshFirstQuest?.();
        };
        // Let the player choose their actual companion first; the cinematic
        // then stages that cat waking beneath the garden bench.
        enterAdventure(enterWorld);
        window.arcadeMetric?.('bond_starter_chosen',{starter:id});
      });
    }else{
      const report=window.Raising?Raising.applyOffline(Date.now()):State.applyIdle();
      game.rebuildYard();game.refreshHUD();
      enterAdventure(()=>{State.save();game.openWorldMap();});
      const has=o=>o&&Object.values(o).some(v=>v>0);
      const worthShowing=report&&report.minutes>=1&&(has(report.produced)||has(report.gains)||(report.visitors&&report.visitors.length));
      if(worthShowing&&!window.__CAT_BOND_CANONICAL_ACTIVE__)setTimeout(()=>UI.openWelcomeBack(report),400);
    }
  };
  const renderIntroLocale=()=>{
    const en=window.MorrowwishI18n?.get?.()!=='zh';
    const set=(id,zh,enText)=>{const el=document.getElementById(id);if(el)el.textContent=en?enText:zh;};
    set('cb-title-name','猫猫纽带','Cat Bond');
    set('cb-title-subtitle','最后的回响','The Last Resonance');
    const start=document.querySelector('#intro-start strong');
    const next=document.querySelector('#intro-continue strong');
    if(start)start.textContent=en?'New Adventure':'开始新的冒险';
    if(next)next.textContent=en?'Continue Story':'继续故事';
    const tagline=document.querySelector('.cb-intro-tagline');
    if(tagline)tagline.textContent=en?'When the world forgets, bonds will guide you home.':'当世界忘记彼此，羁绊仍能引你归来。';
    const kicker=document.querySelector('.cb-save-picker-kicker');
    if(kicker)kicker.textContent=en?'Save Archive':'存档';
    document.getElementById('intro-slot-close')?.setAttribute('aria-label',en?'Close':'关闭');
  };
  renderIntroLocale();
  window.addEventListener('morrowwish-language-change',renderIntroLocale);
  document.getElementById('intro-start')?.addEventListener('click',()=>openSlots('new'));
  document.getElementById('intro-continue')?.addEventListener('click',()=>openSlots('continue'));
  document.getElementById('intro-slot-close')?.addEventListener('click',closeSlots);
  slotPanel?.querySelector('[data-slot-language]')?.addEventListener('click',()=>{
    const i18n=window.MorrowwishI18n;
    i18n?.set?.(i18n.get?.()==='zh'?'en':'zh');
  });
  window.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&slotPanel?.classList.contains('is-open')){event.preventDefault();closeSlots();}
  });
  // In-game Load Game returns to the selected slot after a clean page restart.
  const resumeKey='catbond_resume_slot_v1';
  let resumeSlot=null;
  try{resumeSlot=sessionStorage.getItem(resumeKey);sessionStorage.removeItem(resumeKey);}catch(e){}
  if(State.SAVE_SLOT_IDS.includes(resumeSlot))setTimeout(()=>beginGame('continue',resumeSlot),0);
  slotPanel?.addEventListener('click',event=>{if(event.target===slotPanel)closeSlots();});
  window.addEventListener('morrowwish-language-change',()=>{
    if(slotPanel?.classList.contains('is-open'))openSlots(slotMode);
  });
  try { startIntroStars(); } catch(error) { console.warn('Intro decoration unavailable',error); }
  installCatBondSystemMenu();
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
  setInterval(() => { if (game._lastTs&&window.__CAT_BOND_STARTED__) State.save(); }, 8000);
  // A native app or Steam wrapper can suspend the WebView without unloading.
  // Persist on both pagehide and backgrounding; keep the save key compatible
  // with existing browser players for eventual cloud-save migration.
  window.addEventListener('beforeunload', () => {if(window.__CAT_BOND_STARTED__) State.save();});
  window.addEventListener('pagehide', () => {if(window.__CAT_BOND_STARTED__) State.save();});
  document.addEventListener('visibilitychange', () => {
    if(document.visibilityState === 'hidden' && window.__CAT_BOND_STARTED__) State.save();
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
  if(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)return;
  const stars = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.6 + 0.4, ph: Math.random() * 6, sp: 0.2 + Math.random() * 0.5 }));
  const motes = Array.from({ length: 9 }, () => ({ x: Math.random(), y: Math.random(), r: 2 + Math.random() * 3, vy: 0.00008 + Math.random() * 0.00012, vx: (Math.random() - 0.5) * 0.00008, c: ['#f3d9a3', '#e9d6b4', '#adc8cb', '#c9e1dc'][Math.floor(Math.random() * 4)], ph: Math.random() * 6 }));
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


// Cat Bond's system menu exposes the real existing game controls, not copies
// of their persisted state. Shared controls are kept mounted but not displayed.
function installCatBondSystemMenu(){
 const toggle=document.getElementById('cb-system-toggle'),menu=document.getElementById('cb-system-menu');
 if(!toggle||!menu)return;
 const zh=()=>window.MorrowwishI18n?.get?.()==='zh';
 const t=(a,b)=>zh()?a:b;
 const close=()=>{menu.hidden=true;toggle.setAttribute('aria-expanded','false');};
 const open=()=>{menu.hidden=false;toggle.setAttribute('aria-expanded','true');render();menu.querySelector('button')?.focus();};
 const native=sel=>document.querySelector(sel);
 function render(){
  toggle.textContent=t('菜单','Menu');
  toggle.setAttribute('aria-label',t('打开系统菜单','Open system menu'));
  menu.setAttribute('aria-label',t('系统菜单','System menu'));
  if(menu.hidden)return;
  const title=!window.__CAT_BOND_STARTED__;
  const active=sel=>native(sel)?.getAttribute('aria-pressed')==='true';
  const rows=[
    ['language',t('语言','Language'),t('中文','English')],
    ['music',t('音乐','Music'),window.MorrowwishMusic?.status?.().enabled?t('开启','On'):t('关闭','Off')],
    ['effects',t('音效','Sound effects'),(window.MorrowwishAudio?.isEnabled?.()??active('.mw-settings-sfx'))?t('开启','On'):t('关闭','Off')],
    ...(native('#mw-fullscreen-toggle')?[['fullscreen',t('全屏','Fullscreen'),active('#mw-fullscreen-toggle')?t('退出','Exit'):t('进入','Enter')]]:[]),
    ['share',t('分享游戏','Share game'),''],
    ['slots',title?t('管理存档','Manage saves'):t('保存 / 读取游戏','Save / Load game'),''],
    ...(!title?[['title',t('返回标题画面','Return to title'),'']]:[])
  ];
  menu.innerHTML='<div class="cb-system-card"><header><h2>'+t('系统菜单','System menu')+'</h2><button type="button" data-system="close" aria-label="'+t('关闭','Close')+'">×</button></header><div class="cb-system-rows">'+rows.map(([id,label,value])=>'<button type="button" data-system="'+id+'"><span>'+label+'</span><small>'+value+'</small></button>').join('')+'</div></div>';
  const sound=window.MorrowwishMusic?.status?.();
  if(sound){
   const levels=document.createElement('div');levels.style.cssText='display:grid;gap:6px;padding:8px 12px';
   for(const [name,value,fn] of [[t('音乐音量','Music volume'),sound.volume,'setVolume'],[t('音效音量','Effects volume'),sound.effectsVolume,'setEffectsVolume']]){
    const label=document.createElement('label'),slider=document.createElement('input');label.textContent=name;label.style.cssText='display:flex;align-items:center;gap:8px;justify-content:space-between';slider.type='range';slider.min='0';slider.max='100';slider.value=String(Math.round(value*100));slider.setAttribute('aria-label',name);slider.dataset.audioVolume=fn==='setVolume'?'music':'effects';slider.style.cssText='width:min(45%,130px);min-width:72px;accent-color:#dfc391';const valueText=document.createElement('output');valueText.textContent=slider.value+'%';valueText.style.cssText='min-width:36px;text-align:right;font-size:12px;color:#dfc391';slider.oninput=()=>{window.MorrowwishMusic[fn](Number(slider.value)/100);valueText.textContent=slider.value+'%';};label.append(slider,valueText);levels.append(label);
   }
   menu.querySelector('.cb-system-rows').append(levels);
  }
  menu.querySelectorAll('[data-system]').forEach(btn=>btn.onclick=()=>{
   const id=btn.dataset.system,selectors={language:'.mw-settings-language',effects:'.mw-settings-sfx',music:'.mw-settings-music',fullscreen:'#mw-fullscreen-toggle',share:'.mw-settings-share'};
   if(id==='close'){close();toggle.focus();return;}
   if(id==='slots'){close();window.CatBondCloudSave?.openSlots?.();return;}
   if(id==='title'){
    if(!confirm(t('保存当前进度并返回标题画面？','Save current progress and return to title?')))return;
    const result=State.save();
    if(!result?.ok){alert(t('保存失败，未返回标题。','Save failed. The game remains open.'));return;}
    State.hardReset();location.reload();return;
   }
   if(id==='language'&&!native(selectors.language)){window.MorrowwishI18n?.set?.(zh()?'en':'zh');render();return;}
   if(id==='music'&&window.MorrowwishMusic){window.MorrowwishMusic.toggle();render();return;}
   if(id==='effects'&&window.MorrowwishAudio){window.MorrowwishAudio.toggle();render();return;}
   native(selectors[id])?.click();
   if(id==='share')close();else setTimeout(render,120);
  });
 }
 toggle.onclick=()=>menu.hidden?open():close();
 menu.onclick=e=>{if(e.target===menu)close();};
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden){e.preventDefault();close();}});
 window.addEventListener('morrowwish-language-change',render);
 window.addEventListener('morrowwish-fullscreen-change',render);
 window.CatBondSystemMenu={open,close};
 render();
}
