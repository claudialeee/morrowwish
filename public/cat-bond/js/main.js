// main.js — boot sequence, intro screen, first-run starter, idle report.

window.addEventListener('DOMContentLoaded', () => {
  console.log('%cCat Bond · 猫猫纽带 build v27 — if cats/battles glitch, tap "Reset save" on the intro screen', 'color:#ffb3c7;font-weight:bold');
  const game = new Game();
  window.__game = game;
  UI.init(game);

  // Reset button: wipe save + reload. The escape hatch for any stuck state.
  const resetBtn = document.getElementById('intro-reset');
  if (resetBtn) resetBtn.addEventListener('click', () => {
    try { localStorage.clear(); } catch (e) {}
    location.reload();
  });

  // Intro starfield + floating paw motes (Morrow Wish ambience)
  startIntroStars();

  const startGame = () => {
    document.getElementById('intro').classList.add('hide');
    game.start();
    if (window.Raising) Raising.init();

    // Any time the player has no cats (fresh start OR a save that ended up empty),
    // offer the starter picker — otherwise the yard stays empty and battles are impossible.
    if (State.S.cats.length === 0) {
      UI.openStarter(id => {
        const starter = State.makeCat(id, { affinity: 20 });
        if (window.Raising) Raising.decorateNewCat(starter);
        State.S.cats.push(starter);
        State.S.dex[id] = (State.S.dex[id] || 0) + 1;
        State.S.tutorialDone = true;
        State.save();
        game.rebuildYard();
        game.refreshHUD();
        game.toast('👋 点击猫猫撸它，点右下🌿开始捉迷藏！');
      });
    } else {
      // returning player: offline raising report (replaces State.applyIdle)
      const report = window.Raising ? Raising.applyOffline(Date.now()) : State.applyIdle();
      game.rebuildYard();
      game.refreshHUD();
      if (report && (report.minutes >= 1)) {
        setTimeout(() => UI.openWelcomeBack(report), 400);
      }
    }
  };

  document.getElementById('intro-start').addEventListener('click', startGame);

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
