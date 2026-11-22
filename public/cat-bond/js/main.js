// main.js — boot sequence, intro screen, first-run starter, idle report.

window.addEventListener('DOMContentLoaded', () => {
  console.log('%cCat Bond · 猫猫纽带 build v36 — if cats/battles glitch, tap "Reset save" on the intro screen', 'color:#ffb3c7;font-weight:bold');
  const game = new Game();
  window.__game = game;
  UI.init(game);

  // Reset must never erase the player's progress in other Morrow Wish games.
  const resetBtn = document.getElementById('intro-reset');
  if(resetBtn){
    let resetArmed=false,resetTimer=null;
    const originalResetLabel=resetBtn.textContent;
    resetBtn.addEventListener('click',()=>{
      if(!resetArmed){
        resetArmed=true;
        resetBtn.classList.add('cb-reset-armed');
        resetBtn.setAttribute('aria-live','polite');
        resetBtn.textContent=window.MorrowwishI18n?.get?.()==='zh'
          ?'⚠ 确认删除全部猫猫存档？再点一次'
          :'⚠ Erase all Cat Bond progress? Tap again';
        resetTimer=setTimeout(()=>{
          resetArmed=false;resetBtn.classList.remove('cb-reset-armed');
          resetBtn.textContent=originalResetLabel;
        },5000);
        return;
      }
      clearTimeout(resetTimer);
      try{localStorage.removeItem('catbond_save_v1');}catch(e){}
      location.reload();
    });
  }

  // Bind Start before any optional decorations, so mobile GPU issues cannot block play.
  let starting=false;
  const startGame = () => {
    if(starting)return;
    starting=true;
    try {
      game.start();
      document.getElementById('intro').classList.add('hide');
      window.__CAT_BOND_STARTED__=true;
      window.arcadeMetric?.('bond_entered');
    } catch(error) {
      starting=false;
      console.error('Cat Bond start failed',error);
      const hint=document.getElementById('start-error');
      if(hint){hint.hidden=false;hint.textContent='游戏启动失败，请刷新页面重试：'+(error?.message||'');}
      return;
    }
    if (window.Raising) Raising.init();

    // Any time the player has no cats (fresh start OR a save that ended up empty),
    // offer the starter picker — otherwise the yard stays empty and battles are impossible.
    if (State.S.cats.length === 0) {
      UI.openStarter(id => {
        const starter = State.makeCat(id, { affinity: 20 });
        if (window.Raising) Raising.decorateNewCat(starter);
        State.S.cats.push(starter);
        State.S.dex[id] = (State.S.dex[id] || 0) + 1;
        State.save();
        game.rebuildYard();
        game.refreshHUD();
        window.arcadeMetric?.('bond_starter_chosen',{starter:id});
        // Immediate discovery after selecting a first cat: no six-tab tutorial detour.
        game.yard.startHideAndSeek();
        game.refreshFirstQuest?.();
        game.toast(window.MorrowwishI18n?.get?.()==='zh'?'🌿 院子里藏着一只野猫！点击发光的草丛找到它。':'🌿 A wild cat is hiding! Tap the glowing grass to find it.');
      });
    } else {
      // returning player: offline raising report (replaces State.applyIdle)
      const report = window.Raising ? Raising.applyOffline(Date.now()) : State.applyIdle();
      game.rebuildYard();
      game.refreshHUD();
      // Only greet with the welcome-back report if something actually accumulated
      // (workshop output, auto-gains, or a visitor). Don't pop an empty "collect"
      // modal when there's nothing to collect.
      const has = o => o && Object.values(o).some(v => v > 0);
      const worthShowing = report && report.minutes >= 1 &&
        (has(report.produced) || has(report.gains) || (report.visitors && report.visitors.length));
      if (worthShowing) {
        setTimeout(() => UI.openWelcomeBack(report), 400);
      }
    }
  };

  document.getElementById('intro-start').addEventListener('click', startGame);
  // CrazyGames asks users to reach real gameplay immediately; skip the full
  // studio intro and present the starter choice as the first interactive action.
  if(window.CatBondPlatform?.crazygames){
    document.getElementById('cb-home')?.remove();
    startGame();
  }
  try { startIntroStars(); } catch(error) { console.warn('Intro decoration unavailable',error); }
  try { paintIntroCatGallery(); } catch(error) { console.warn('Cat gallery unavailable',error); }
  window.__CAT_BOND_READY__=true;

  // dev screenshot harness: ?autodev seeds a lively yard & skips the intro
  if (location.search.includes('autodev')) {
    try { localStorage.clear(); } catch (e) {}
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
  window.addEventListener('beforeunload', () => State.save());
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
  const canvas = document.getElementById('intro-cats');
  if (!canvas || !window.CatArt || !window.GameData) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // A few hand-drawn meadow accents; never hide the cats behind UI.
  const leaves = [
    [38,132,16,-.35],[65,146,11,.35],[180,151,14,-.45],
    [337,154,10,.3],[385,140,13,-.4],[523,151,12,.45],
    [658,141,16,-.3],[699,150,9,.25]
  ];
  for (const [x,y,r,tilt] of leaves) {
    ctx.save();ctx.translate(x,y);ctx.rotate(tilt);
    ctx.fillStyle='rgba(124,166,119,.27)';
    ctx.beginPath();ctx.ellipse(0,0,r,r*.3,0,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
  for (const [x,y,r] of [[73,67,3],[195,50,2.5],[352,68,3],[527,45,2],[653,74,3]]) {
    ctx.fillStyle='rgba(223,165,121,.52)';
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
  }
  const ids=['tangyuan','dundun','niuniu','yunduo'];
  const xs=[114,278,442,606];
  const poses=['sit','loaf','sit','sit'];
  ids.forEach((id,i)=>{
    const species=GameData.speciesById(id);
    if (!species) return;
    ctx.save();
    // Match the art bounds: raise and enlarge the cats so the frame is not
    // mostly empty sky. Reserve six pixels below the paws; never crop ears.
    const scale=i===1?1.65:1.78;
    const feetY=h-43*scale-6;
    CatArt.drawCat(ctx,xs[i],feetY,{
      species,scale,face:i%2===0?1:-1,
      pose:poses[i],mood:'happy',t:.5+i*.6
    });
    ctx.restore();
  });
}
