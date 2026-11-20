// world.js — the yard scene: your cats wander & play, plus hide-and-seek with a wild cat.

class CatEntity {
  constructor(cat, W, H) {
    this.cat = cat;                 // reference to state cat instance
    this.x = 80 + Math.random() * (W - 160);
    this.y = 140 + Math.random() * (H - 300);
    this.W = W; this.H = H;
    this.face = Math.random() < 0.5 ? -1 : 1;
    this.pose = 'idle';
    this.vx = 0; this.vy = 0;
    this.timer = 1 + Math.random() * 2;
    this.t = Math.random() * 10;
    this.target = null;
    this.pettedGlow = 0;
    // emote bubble state
    this.bubble = null;        // current emoji string
    this.bubbleT = 0;          // remaining time
    this.bubbleCd = 2 + Math.random() * 5;  // time until next spontaneous emote
    this.groomT = 0;           // grooming micro-animation timer
    this.pounceT = 0;          // play-pounce micro-animation
  }
  // pop a thought/emote bubble above the cat
  emote(ch, dur) { this.bubble = ch; this.bubbleT = dur || 2.2; this.bubbleDur = this.bubbleT; }
  pickBehavior() {
    const r = Math.random();
    const sleepy = this.cat.joy < 28;
    const happy = this.cat.joy > 65;
    const hungry = this.cat.hunger < 35;
    // sleepy cats nap / loaf more
    if (sleepy) {
      if (r < 0.35) { this.emote('💤', 4); return this.setPose('sleep', 4 + Math.random() * 5); }
      if (r < 0.6) return this.setPose('loaf', 3 + Math.random() * 3);
    }
    // happy cats roll on their belly sometimes
    if (happy && r < 0.14) { this.emote('🎵', 2.5); return this.setPose('belly', 2.5 + Math.random() * 2.5); }
    // hungry cats think about fish
    if (hungry && r < 0.18) { this.emote('🐟', 2.5); return this.setPose('sit', 2 + Math.random() * 2); }
    // cats mostly roam around the yard
    if (r < 0.46) {
      this.pose = 'walk';
      const ang = Math.random() * Math.PI * 2;
      const spd = 26 + Math.random() * 34;
      this.vx = Math.cos(ang) * spd; this.vy = Math.sin(ang) * spd * 0.55;
      this.face = this.vx < 0 ? -1 : 1;
      this.timer = 1.8 + Math.random() * 3;
    } else if (r < 0.58) { this.pounceT = 1.2 + Math.random() * 0.8; this.setPose('play', this.pounceT); }
    else if (r < 0.72) { this.setPose('sit', 1.6 + Math.random() * 2.5); }
    else if (r < 0.82) { this.groomT = 2 + Math.random() * 2; this.setPose('sit', this.groomT); this.emote('✨', 1.6); } // grooming
    else if (r < 0.92) { this.setPose('loaf', 2 + Math.random() * 3); }
    else { this.setPose('idle', 1.2 + Math.random() * 1.8); }
  }
  setPose(pose, dur) { this.pose = pose; this.timer = dur; this.vx = this.vy = 0; }
  update(dt, mouse) {
    this.t += dt;
    if (this.pettedGlow > 0) this.pettedGlow -= dt;
    if (this.groomT > 0) this.groomT -= dt;
    if (this.pounceT > 0) this.pounceT -= dt;
    this.timer -= dt;
    if (this.timer <= 0) this.pickBehavior();

    // bubble lifetime + spontaneous idle emotes
    if (this.bubbleT > 0) this.bubbleT -= dt; else this.bubble = null;
    this.bubbleCd -= dt;
    if (this.bubbleCd <= 0 && !this.bubble) {
      this.bubbleCd = 4 + Math.random() * 7;
      // emote reflects mood/personality
      const m = this.mood();
      const pers = this.cat.personality;
      let pool;
      if (m === 'sleepy') pool = ['💤', '😴'];
      else if (m === 'happy' || m === 'love') pool = ['❤️', '🎵', '😸', '✨'];
      else pool = ['🐾', '🦋', '？', '🌼', '🎵'];
      if (pers === 'glutton' || pers === '贪吃') pool = pool.concat(['🐟', '🍖']);
      if (pers === 'playful' || pers === '机敏') pool = pool.concat(['🧶', '🦋']);
      if (Math.random() < 0.7) this.emote(pool[Math.floor(Math.random() * pool.length)], 2 + Math.random() * 1.5);
    }

    // curiosity: when the cursor is nearby & moving, perk up and drift toward it
    this.curious = false;
    if (mouse && mouse.active) {
      const dmx = mouse.x - this.x, dmy = mouse.y - this.y;
      const md = Math.hypot(dmx, dmy);
      if (md < 170 && (this.pose === 'walk' || this.pose === 'idle' || this.pose === 'sit')) {
        this.curious = true;
        this.face = dmx < 0 ? -1 : 1;
        if (md > 46) {
          // saunter toward cursor
          this.pose = 'walk';
          this.x += (dmx / md) * 42 * dt;
          this.y += (dmy / md) * 24 * dt;
        } else {
          this.pose = 'play'; // pawing at the cursor
          if (!this.bubble || this.bubble === '❓') this.emote('❗', 1);
        }
      }
    }

    if (this.pose === 'walk' && !this.curious) {
      this.x += this.vx * dt; this.y += this.vy * dt;
      if (this.x < 56 || this.x > this.W - 56) { this.vx *= -1; this.face *= -1; }
      if (this.y < 128 || this.y > this.H - 150) this.vy *= -1;
    }
    this.x = Math.max(56, Math.min(this.W - 56, this.x));
    this.y = Math.max(128, Math.min(this.H - 150, this.y));
  }
  mood() {
    if (this.pettedGlow > 0) return 'love';
    if (this.pose === 'sleep') return 'sleepy';
    if (this.curious || this.pose === 'play' || this.pose === 'belly') return 'happy';
    if (this.cat.joy > 68) return 'happy';
    if (this.cat.joy < 28) return 'sleepy';
    return 'neutral';
  }
  draw(ctx) {
    const sp = GameData.speciesById(this.cat.species);
    const depth = 0.8 + (this.y / this.H) * 0.5;
    if (this.pettedGlow > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.5, this.pettedGlow);
      ctx.fillStyle = '#ffd36b';
      ctx.beginPath(); ctx.arc(this.x, this.y, 36, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    CatArt.drawCat(ctx, this.x, this.y, {
      species: sp, scale: depth, face: this.face, t: this.t,
      pose: this.pose, mood: this.mood(),
    });
    // name + level tag
    ctx.save();
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    roundTag(ctx, this.x, this.y - 34 * depth, `${sp.name} Lv.${this.cat.level}`);
    ctx.restore();
    // emote thought-bubble
    if (this.bubble && this.bubbleT > 0) this.drawBubble(ctx, depth);
  }
  drawBubble(ctx, depth) {
    const dur = this.bubbleDur || 2.2;
    const elapsed = dur - this.bubbleT;
    const fadeIn = Math.min(1, elapsed / 0.2);        // 0.2s pop-in
    const fadeOut = Math.min(1, this.bubbleT / 0.3);  // 0.3s fade-out
    const k = Math.max(0, Math.min(1, fadeIn * fadeOut));
    const bx = this.x + 22 * depth, by = this.y - 52 * depth - Math.sin(this.t * 3) * 2;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, k));
    // bubble body
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.strokeStyle = 'rgba(120,100,150,0.25)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(bx, by, 15, 13, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // little tail dots pointing to the cat
    ctx.beginPath(); ctx.arc(bx - 9, by + 12, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(bx - 13, by + 18, 2, 0, Math.PI * 2); ctx.fill();
    // emoji
    ctx.globalAlpha = Math.max(0, Math.min(1, k));
    ctx.font = '16px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(this.bubble, bx, by + 1);
    ctx.restore();
  }
  hit(px, py) {
    const d = Math.hypot(px - this.x, py - this.y);
    return d < 40;
  }
}

function roundTag(ctx, x, y, text) {
  ctx.font = 'bold 11px sans-serif';
  const w = ctx.measureText(text).width + 12;
  ctx.fillStyle = 'rgba(20,12,30,0.75)';
  roundRectPath(ctx, x - w / 2, y - 9, w, 16, 8); ctx.fill();
  ctx.fillStyle = '#ffe9f2';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y - 1);
}
function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ---- Yard scene ----
class YardScene {
  constructor(game) {
    this.game = game;
    this.entities = [];
    this.bushes = [];
    this.butterflies = [];
    this.hide = null;         // active hide-and-seek
    this.petParticles = [];
    this.buildScenery();      // bushes/flowers/clouds — built ONCE, never reshuffled
    this.rebuild();           // cat entities — rebuilt when the roster changes
  }
  // Static scenery. Only called once (or on resize) so bushes/flowers never jump around.
  buildScenery() {
    const { W, H } = this.game;
    this.bushes = [];
    const spots = 6;
    for (let i = 0; i < spots; i++) {
      this.bushes.push({
        x: 90 + (W - 180) * (i / (spots - 1)) + (Math.random() * 40 - 20),
        y: 170 + Math.random() * (H - 320),
        r: 26 + Math.random() * 10,
      });
    }
    this.butterflies = Array.from({ length: 3 }, () => ({
      x: Math.random() * W, y: 120 + Math.random() * 200, t: Math.random() * 10,
      bx: Math.random() * W, by: 120 + Math.random() * 200,
    }));
    this.clouds = Array.from({ length: 4 }, () => ({
      x: Math.random() * W, y: 40 + Math.random() * 90, s: 0.7 + Math.random() * 0.6,
      spd: 0.15 + Math.random() * 0.2,
    }));
    const palette = ['#ff8fb0', '#fff1a8', '#b59bff', '#ff9d6e', '#9be7c4'];
    this.flowers = Array.from({ length: 22 }, () => ({
      x: 30 + Math.random() * (W - 60), y: H * 0.42 + Math.random() * (H * 0.52),
      c: palette[Math.floor(Math.random() * palette.length)], ph: Math.random() * 6,
    }));
    // drifting petals (foreground parallax) for ambience
    this.petals = Array.from({ length: 16 }, () => ({
      x: Math.random() * W, y: Math.random() * H, vx: -14 - Math.random() * 20, vy: 10 + Math.random() * 16,
      r: 3 + Math.random() * 3, sp: 1 + Math.random() * 2, ph: Math.random() * 6,
      c: ['#ffb3c7', '#ffd6e6', '#fff1a8'][Math.floor(Math.random() * 3)],
    }));
    // fireflies that glow near the ground (soft bloom)
    this.fireflies = Array.from({ length: 14 }, () => ({
      x: Math.random() * W, y: H * 0.45 + Math.random() * (H * 0.5),
      bx: Math.random() * W, by: H * 0.45 + Math.random() * (H * 0.5), ph: Math.random() * 6,
    }));
  }
  // Rebuild ONLY the cat entities from the current roster; scenery is left intact.
  rebuild() {
    const { W, H } = this.game;
    if (!this.bushes || this.bushes.length === 0) this.buildScenery();
    this.entities = State.S.cats.map(c => new CatEntity(c, W, H));
  }
  hillBand(ctx, W, baseY, amp, freq) {
    ctx.beginPath(); ctx.moveTo(0, baseY);
    for (let x = 0; x <= W; x += 16) ctx.lineTo(x, baseY - Math.abs(Math.sin(x / W * Math.PI * freq * 3)) * amp);
    ctx.lineTo(W, baseY + 300); ctx.lineTo(0, baseY + 300); ctx.closePath(); ctx.fill();
  }
  startHideAndSeek(spot) {
    if (this.hide) return;
    const luck = Math.min(0.9, State.S.luckLure * 0.25);
    const sp = GameData.rollSpecies(luck);
    if (State.S.luckLure > 0) State.S.luckLure--;
    spot = spot || this.bushes[Math.floor(Math.random() * this.bushes.length)];
    this.hide = {
      species: sp, spot, found: false, revealT: 0,
      peekT: 0.4 + Math.random() * 1.2, peeking: true,
    };
    this.game.toast(`🌿 草丛里有只野猫在探头…点它！`);
  }
  // spawn the hiding wild cat at whichever bush is closest to (x,y)
  startHideAndSeekNear(x, y) {
    if (this.hide) return;
    let best = this.bushes[0], bd = Infinity;
    for (const b of this.bushes) { const d = Math.hypot(b.x - x, b.y - y); if (d < bd) { bd = d; best = b; } }
    this.startHideAndSeek(best);
  }
  update(dt) {
    const mouse = this.game.mouse;
    for (const e of this.entities) e.update(dt, mouse);
    this.updateLoot(dt);
    for (const b of this.butterflies) {
      b.t += dt;
      b.x += (b.bx - b.x) * dt * 0.8;
      b.y += (b.by - b.y) * dt * 0.8 + Math.sin(b.t * 6) * 0.6;
      if (Math.hypot(b.bx - b.x, b.by - b.y) < 10) {
        b.bx = Math.random() * this.game.W; b.by = 120 + Math.random() * 200;
      }
    }
    for (const p of this.petParticles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 60 * dt; p.life -= dt; }
    this.petParticles = this.petParticles.filter(p => p.life > 0);
    if (this.hide && !this.hide.found) {
      this.hide.peekT -= dt;
      if (this.hide.peekT <= 0) {
        this.hide.peeking = !this.hide.peeking;
        this.hide.peekT = this.hide.peeking ? 0.8 + Math.random() : 1.5 + Math.random() * 2.5;
      }
    }
  }
  draw(ctx) {
    const { W, H } = this.game;
    const horizon = H * 0.4;
    const t = this.game.t;
    const dt = 1 / 60;   // fixed step for draw-time ambient motion (petals/fireflies)

    // --- sky gradient (soft dawn) ---
    const sky = ctx.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, '#9a7be0'); sky.addColorStop(0.5, '#c79add'); sky.addColorStop(1, '#ffc2cf');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, horizon + 10);

    // --- sun with glow ---
    const sunX = W - 100, sunY = 78;
    const glow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 120);
    glow.addColorStop(0, 'rgba(255,236,170,0.9)'); glow.addColorStop(1, 'rgba(255,236,170,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(sunX, sunY, 120, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff2c6'; ctx.beginPath(); ctx.arc(sunX, sunY, 34, 0, Math.PI * 2); ctx.fill();

    // --- clouds ---
    for (const c of this.clouds) {
      c.x += c.spd; if (c.x > W + 80) c.x = -80;
      ctx.save(); ctx.globalAlpha = 0.85; ctx.fillStyle = 'rgba(255,255,255,0.9)';
      for (const [dx, dy, r] of [[0, 0, 18], [18, 4, 14], [-16, 4, 13], [4, -8, 13]])
        { ctx.beginPath(); ctx.arc(c.x + dx * c.s, c.y + dy, r * c.s, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }

    // --- rolling hills (parallax) ---
    ctx.fillStyle = '#8bc48a';
    this.hillBand(ctx, W, horizon - 6, 26, 0.6);
    ctx.fillStyle = '#6fb26e';
    this.hillBand(ctx, W, horizon + 4, 20, 1.1);

    // --- lawn ---
    const lawn = ctx.createLinearGradient(0, horizon, 0, H);
    lawn.addColorStop(0, '#5fae5b'); lawn.addColorStop(0.5, '#4c9a4e'); lawn.addColorStop(1, '#3c8140');
    ctx.fillStyle = lawn; ctx.fillRect(0, horizon, W, H - horizon);

    // --- wooden fence along horizon ---
    ctx.save();
    ctx.fillStyle = '#c99b6b'; ctx.strokeStyle = '#a97e52'; ctx.lineWidth = 1;
    const fy = horizon - 2;
    ctx.fillRect(0, fy + 8, W, 5); ctx.fillRect(0, fy + 18, W, 5);
    for (let x = 10; x < W; x += 46) { ctx.fillRect(x, fy - 6, 8, 30); ctx.strokeRect(x, fy - 6, 8, 30); }
    ctx.restore();

    // --- winding path ---
    ctx.fillStyle = 'rgba(224,197,150,0.5)';
    ctx.beginPath();
    ctx.moveTo(W / 2 - 46, H);
    ctx.quadraticCurveTo(W / 2 + 40, H * 0.75, W / 2 - 6, horizon + 6);
    ctx.lineTo(W / 2 + 10, horizon + 6);
    ctx.quadraticCurveTo(W / 2 + 70, H * 0.75, W / 2 + 46, H);
    ctx.closePath(); ctx.fill();
    // stepping stones
    ctx.fillStyle = 'rgba(200,190,175,0.55)';
    for (let i = 0; i < 5; i++) {
      const p = i / 4; const py = H - (H - horizon - 10) * p;
      const px = W / 2 + Math.sin(p * 3) * 30;
      ctx.beginPath(); ctx.ellipse(px, py, 16 - p * 7, 7 - p * 3, 0, 0, Math.PI * 2); ctx.fill();
    }

    // --- scattered flowers on lawn ---
    for (const f of this.flowers) {
      ctx.save(); ctx.translate(f.x, f.y);
      const sway = Math.sin(t * 1.5 + f.ph) * 1.5;
      ctx.strokeStyle = '#3c8140'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(sway, -8); ctx.stroke();
      ctx.translate(sway, -8);
      ctx.fillStyle = f.c;
      for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; ctx.beginPath(); ctx.arc(Math.cos(a) * 2.6, Math.sin(a) * 2.6, 2.2, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#ffd36b'; ctx.beginPath(); ctx.arc(0, 0, 1.8, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // soft god-rays from the sun (behind everything, additive glow)
    ctx.save();
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.05;
    const rayX = W - 100, rayY = 78;
    for (let i = 0; i < 6; i++) {
      const a = -1.0 + i * 0.28 + Math.sin(t * 0.3 + i) * 0.03;
      ctx.fillStyle = '#fff2c6'; ctx.beginPath(); ctx.moveTo(rayX, rayY);
      ctx.lineTo(rayX + Math.cos(a) * 900, rayY + Math.sin(a) * 900);
      ctx.lineTo(rayX + Math.cos(a + 0.12) * 900, rayY + Math.sin(a + 0.12) * 900);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();

    // fireflies: soft glowing motes drifting near the ground (bloom)
    for (const fl of this.fireflies) {
      fl.x += (fl.bx - fl.x) * dt * 0.5; fl.y += (fl.by - fl.y) * dt * 0.5 + Math.sin(t * 2 + fl.ph) * 0.3;
      if (Math.hypot(fl.bx - fl.x, fl.by - fl.y) < 12) { fl.bx = Math.random() * W; fl.by = H * 0.45 + Math.random() * (H * 0.5); }
      const glow = 0.4 + 0.5 * Math.abs(Math.sin(t * 2.5 + fl.ph));
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g2 = ctx.createRadialGradient(fl.x, fl.y, 0, fl.x, fl.y, 9);
      g2.addColorStop(0, `rgba(255,240,150,${glow})`); g2.addColorStop(1, 'rgba(255,240,150,0)');
      ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(fl.x, fl.y, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(255,255,220,${glow})`; ctx.beginPath(); ctx.arc(fl.x, fl.y, 1.6, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // butterflies behind
    for (const b of this.butterflies) {
      ctx.save(); ctx.translate(b.x, b.y);
      const flap = Math.sin(b.t * 10);
      ctx.fillStyle = '#ffd36b';
      ctx.beginPath(); ctx.ellipse(-3, 0, 3, 5 * Math.abs(flap) + 1, -0.4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(3, 0, 3, 5 * Math.abs(flap) + 1, 0.4, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // draw bushes + sort cats by y with bushes
    const drawables = [];
    for (const b of this.bushes) drawables.push({ y: b.y, kind: 'bush', ref: b });
    for (const e of this.entities) drawables.push({ y: e.y, kind: 'cat', ref: e });
    if (this.hide && !this.hide.found) drawables.push({ y: this.hide.spot.y + 0.1, kind: 'hide', ref: this.hide });
    drawables.sort((a, b) => a.y - b.y);
    for (const d of drawables) {
      if (d.kind === 'bush') this.drawBush(ctx, d.ref);
      else if (d.kind === 'cat') d.ref.draw(ctx);
      else if (d.kind === 'hide') this.drawHide(ctx, d.ref);
    }

    // --- idle loot bubbles (tap to collect; the AFK payoff on the main screen) ---
    if (this.lootBubbles) for (const b of this.lootBubbles) {
      const bob = Math.sin(b.t * 2.5) * 3;
      ctx.save();
      // glowing coin-like bubble
      const gg = ctx.createRadialGradient(b.x, b.y + bob, 2, b.x, b.y + bob, 22);
      gg.addColorStop(0, 'rgba(255,235,150,0.95)'); gg.addColorStop(1, 'rgba(255,211,107,0.15)');
      ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(b.x, b.y + bob, 20, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(b.x, b.y + bob, 17, 0, Math.PI * 2); ctx.stroke();
      ctx.font = '20px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(b.icon || '🪙', b.x, b.y + bob + 1);
      // little "!" pulse to draw the eye
      ctx.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(b.t * 5));
      ctx.fillStyle = '#fff'; ctx.font = 'bold 12px sans-serif'; ctx.fillText('✦', b.x + 15, b.y + bob - 14);
      ctx.restore();
    }

    // pet particles (hearts)
    for (const p of this.petParticles) {
      ctx.save(); ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color; ctx.font = `${p.size}px sans-serif`;
      ctx.fillText(p.ch, p.x, p.y); ctx.restore();
    }

    // --- foreground drifting petals (parallax, soft blur via low alpha) ---
    for (const pt of this.petals) {
      pt.x += pt.vx * dt; pt.y += pt.vy * dt;
      const wobble = Math.sin(t * pt.sp + pt.ph) * 10;
      if (pt.y > H + 10) { pt.y = -10; pt.x = Math.random() * W; }
      if (pt.x < -10) pt.x = W + 10;
      ctx.save(); ctx.globalAlpha = 0.7; ctx.fillStyle = pt.c;
      ctx.translate(pt.x + wobble, pt.y); ctx.rotate(t * pt.sp + pt.ph);
      ctx.beginPath(); ctx.ellipse(0, 0, pt.r, pt.r * 0.55, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // --- soft vignette for depth/polish ---
    const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.72);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(20,10,35,0.38)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  }
  drawBush(ctx, b) {
    ctx.save();
    // soft shadow
    ctx.globalAlpha = 0.18; ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(b.x, b.y + b.r * 0.5, b.r * 0.9, b.r * 0.3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    // dark base clumps
    ctx.fillStyle = '#227347';
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(b.x + Math.cos(a) * b.r * 0.55, b.y + Math.sin(a) * b.r * 0.3, b.r * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
    // mid tone
    ctx.fillStyle = '#2f9a5a';
    ctx.beginPath(); ctx.arc(b.x - b.r * 0.2, b.y - 4, b.r * 0.72, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(b.x + b.r * 0.35, b.y - 2, b.r * 0.55, 0, Math.PI * 2); ctx.fill();
    // highlight
    ctx.fillStyle = 'rgba(150,220,150,0.5)';
    ctx.beginPath(); ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.4, b.r * 0.35, 0, Math.PI * 2); ctx.fill();
    // berries / flowers
    ctx.fillStyle = '#ffd36b';
    ctx.beginPath(); ctx.arc(b.x - b.r * 0.4, b.y + 2, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff9db0';
    ctx.beginPath(); ctx.arc(b.x + b.r * 0.4, b.y - 6, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(b.x + b.r * 0.1, b.y + 4, 2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  drawHide(ctx, hide) {
    // peeking eyes / ear tips above the bush when peeking
    if (!hide.peeking) {
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('?', hide.spot.x, hide.spot.y - 30 + Math.sin(this.game.t * 3) * 2);
      return;
    }
    const sp = hide.species;
    const pal = CatArt.CAT_PALETTES[sp.palette];
    ctx.save();
    ctx.translate(hide.spot.x, hide.spot.y - 10);
    // two glowing eyes + ears poking
    ctx.fillStyle = pal.body;
    ctx.beginPath(); ctx.moveTo(-8, -6); ctx.lineTo(-5, -16); ctx.lineTo(-1, -6); ctx.fill();
    ctx.beginPath(); ctx.moveTo(1, -6); ctx.lineTo(5, -16); ctx.lineTo(8, -6); ctx.fill();
    ctx.fillStyle = sp.eyeColor;
    ctx.beginPath(); ctx.arc(-4, -2, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(4, -2, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a1420';
    ctx.beginPath(); ctx.ellipse(-4, -2, 0.9, 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(4, -2, 0.9, 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  // returns 'hide' | entity | null
  // ---- idle loot bubbles: visible, tappable resource rewards over the yard ----
  updateLoot(dt) {
    if (!this.lootBubbles) this.lootBubbles = [];
    this._lootScan = (this._lootScan || 0) - dt;
    // every ~2.5s, if a station has ≥1 stored resource and isn't already bubbled, pop a bubble
    if (this._lootScan <= 0 && window.Raising && this.entities.length) {
      this._lootScan = 2.5;
      const stations = Raising.stationsView();
      for (const s of stations) {
        if (s.stored >= 1 && !this.lootBubbles.some(b => b.stationId === s.id)) {
          const anchor = this.entities[Math.floor(Math.random() * this.entities.length)];
          this.lootBubbles.push({ stationId: s.id, res: s.res, icon: s.icon, x: anchor.x, y: anchor.y - 50, t: 0 });
        }
      }
      // cap bubbles
      if (this.lootBubbles.length > 6) this.lootBubbles.splice(0, this.lootBubbles.length - 6);
    }
    for (const b of this.lootBubbles) { b.t += dt; b.y += Math.sin(b.t * 2) * 0.2 - 3 * dt; }
  }
  handleTap(px, py) {
    // 1) tap an idle loot bubble to collect it (biggest AFK payoff on the main screen)
    if (this.lootBubbles) {
      for (let i = this.lootBubbles.length - 1; i >= 0; i--) {
        const b = this.lootBubbles[i];
        if (Math.hypot(px - b.x, py - b.y) < 26) { return { type: 'loot', bubble: b, idx: i }; }
      }
    }
    if (this.hide && !this.hide.found) {
      const d = Math.hypot(px - this.hide.spot.x, py - this.hide.spot.y);
      if (d < 42) { return { type: 'hide' }; }
    }
    // topmost cat (largest y first)
    const sorted = [...this.entities].sort((a, b) => b.y - a.y);
    for (const e of sorted) { if (e.hit(px, py)) return { type: 'cat', entity: e }; }
    return null;
  }
  collectLoot(bubble, idx) {
    const res = { icon: bubble.icon, res: bubble.res, amount: 0 };
    if (window.Raising) { const c = Raising.collect(bubble.stationId); if (c) res.amount = c.amount; }
    this.lootBubbles.splice(idx, 1);
    // sparkle burst where it was
    for (let k = 0; k < 8; k++) this.petParticles.push({ x: bubble.x, y: bubble.y, vx: Math.random() * 80 - 40, vy: -40 - Math.random() * 50, life: 0.8, ch: bubble.icon || '✨', color: '#ffd36b', size: 13 + Math.random() * 6 });
    return res;
  }
  petEntity(e) {
    e.pettedGlow = 1.2;
    e.pose = 'play'; e.timer = 1.2;
    e.emote('❤️', 1.6);
    for (let i = 0; i < 5; i++) {
      this.petParticles.push({
        x: e.x + (Math.random() * 20 - 10), y: e.y - 20,
        vx: Math.random() * 30 - 15, vy: -30 - Math.random() * 30,
        life: 0.9, ch: Math.random() < 0.6 ? '❤' : '✨',
        color: Math.random() < 0.6 ? '#ff7b9c' : '#ffd36b', size: 12 + Math.random() * 6,
      });
    }
  }
}

window.World = { YardScene, CatEntity };
