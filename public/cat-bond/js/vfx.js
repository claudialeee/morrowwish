// vfx.js — reusable juicy visual effects for skills & impacts. Pure Canvas 2D.
// A single VFX layer owns a pool of effect objects; battle.js spawns into it.

class VFX {
  constructor() { this.fx = []; this._t = 0; }
  clear() { this.fx.length = 0; }

  // Lighten a hex color toward white (for the mid glow pass of the charged bolt).
  _lighten(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return '#cfe0ff';
    const n = parseInt(m[1], 16);
    const r = Math.min(255, (n >> 16 & 255) + 90), g = Math.min(255, (n >> 8 & 255) + 90), b = Math.min(255, (n & 255) + 90);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }
  // Midpoint-displacement lightning path between two points. Seeded + time-quantized
  // so it re-rolls a few times per second (flicker) without being noisy every frame.
  _bolt(x1, y1, x2, y2, seed) {
    const step = Math.floor(this._t * 18);               // reseed ~18x/sec
    let rnd = (Math.sin((seed + step) * 12.9898) * 43758.5453) % 1; if (rnd < 0) rnd += 1;
    const rand = () => { rnd = (Math.sin(rnd * 78.233 + 1) * 43758.5453) % 1; return rnd < 0 ? rnd + 1 : rnd; };
    let pts = [{ x: x1, y: y1 }, { x: x2, y: y2 }];
    let offset = Math.hypot(x2 - x1, y2 - y1) * 0.18;
    for (let pass = 0; pass < 5 && offset > 3; pass++) {
      const out = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        const nx = -(b.y - a.y), ny = (b.x - a.x), nl = Math.hypot(nx, ny) || 1;
        const d = (rand() - 0.5) * offset;
        out.push(a, { x: mx + nx / nl * d, y: my + ny / nl * d });
      }
      out.push(pts[pts.length - 1]);
      pts = out; offset *= 0.55;
    }
    // branch forks: short dim child bolts peeling off a few interior vertices
    // (Drilian). Seeded off the same rnd stream so they boil in sync with the main.
    const branches = [];
    for (let i = 2; i < pts.length - 2; i++) {
      if (rand() > 0.22) continue;                       // ~1 in 5 vertices forks
      const a = pts[i - 1], b = pts[i];
      const dx = b.x - a.x, dy = b.y - a.y;
      const ang = Math.atan2(dy, dx) + (rand() - 0.5) * 1.0;   // ±0.5 rad off parent
      const len = Math.hypot(dx, dy) * (3 + rand() * 3);       // a few segments long
      const n = 3; const seg = [];
      for (let j = 0; j <= n; j++) {
        const t = j / n;
        seg.push({ x: b.x + Math.cos(ang) * len * t + (rand() - 0.5) * 6,
                   y: b.y + Math.sin(ang) * len * t + (rand() - 0.5) * 6 });
      }
      branches.push(seg);
    }
    pts.branches = branches;
    return pts;
  }

  // How many throwaway particles (sparks/fades) are live right now. Used to keep
  // the screen legible: once the field is busy, new bursts spawn fewer motes so a
  // flurry of skills never buries the cats under confetti. (Player clutter fix.)
  _noise() { let n = 0; for (const e of this.fx) if (e.type === 'spark' || e.type === 'fade') n++; return n; }

  // ---- spawners ----
  burst(x, y, opts = {}) {
    // Clarity budget: fade the requested particle count toward 0 as the screen
    // fills, and hard-stop once we're saturated. Rings/text/beams are unaffected.
    const noise = this._noise();
    if (noise > 150) return;
    const scale = noise > 80 ? Math.max(0.3, 1 - (noise - 80) / 100) : 1;
    const n = Math.max(3, Math.round((opts.count || 14) * scale));
    const color = opts.color || '#ffd36b';
    const spd = opts.speed || 180;
    for (let i = 0; i < n; i++) {
      const a = (opts.angle != null) ? opts.angle + (Math.random() - 0.5) * (opts.spread || Math.PI * 2) : Math.random() * Math.PI * 2;
      const s = spd * (0.4 + Math.random() * 0.8);
      this.fx.push({ type: 'spark', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        life: opts.life || 0.5, max: opts.life || 0.5, r: (opts.r || 3) * (0.6 + Math.random()), color, drag: opts.drag ?? 2.5, grav: opts.grav || 0 });
    }
  }
  ring(x, y, opts = {}) {
    this.fx.push({ type: 'ring', x, y, r: opts.r0 || 6, vr: opts.vr || 360, life: opts.life || 0.45, max: opts.life || 0.45,
      color: opts.color || '#9be7c4', width: opts.width || 4 });
  }
  shockwave(x, y, color) { this.ring(x, y, { r0: 10, vr: 520, life: 0.4, color: color || '#fff', width: 6 }); }
  // muzzle flash + small forward cone when a projectile is fired
  muzzle(x, y, angle, color) {
    this.fx.push({ type: 'muzzle', x, y, angle, life: 0.14, max: 0.14, color: color || '#ffd36b', len: 26 });
    this.burst(x, y, { count: 5, color, angle, spread: 0.7, speed: 220, life: 0.22, r: 2.5, drag: 4 });
  }
  // persistent-ish glowing trail dot (call each frame behind a projectile)
  trail(x, y, color, r) {
    if (this._noise() > 120) return;                 // don't pile trails onto a saturated screen
    this.fx.push({ type: 'fade', x, y, r: r || 4, life: 0.26, max: 0.26, color: color || '#ffd36b' });
  }
  // Standard visual grammar. Purely local: no fullscreen hit overlay.
  // Combat mechanics (HP, invulnerability, hitstop) remain battle-owned.
  impactType(x,y,type='light',options={}){
    const color=options.color||({
      light:'#fff1ce',heavy:'#ffe4a4',crit:'#fff3b4',stagger:'#ffd888',kill:'#fff1b3',
      heal:'#a6e9c5',guard:'#9ce5ce',reflect:'#addaff',
      barrier:'#a5e4fb',wardFade:'#c5dbe4',cleanse:'#c7f2d6',shieldBreak:'#d8f8ff'
    }[type]||'#fff1ce');
    const heavy=type==='heavy'||type==='crit'||type==='stagger'||type==='kill';
    const soft=['heal','guard','reflect','barrier','wardFade','cleanse'].includes(type);
    const shatter=type==='shieldBreak';
    const duration=soft?.34:.25;
    this.ring(x,y,{r0:heavy?10:4,vr:(heavy?72:shatter?58:soft?40:32)/duration,
      life:duration,color,width:heavy?4.5:shatter?3.6:2.4});
    this.burst(x,y,{count:type==='kill'?15:shatter?11:heavy?11:soft?7:5,
      color,speed:heavy?180:shatter?150:soft?85:130,life:soft?.38:.26,
      r:heavy?2.8:shatter?3.2:2.2,angle:options.angle,
      spread:options.angle==null?Math.PI*2:1.1,
      grav:type==='heal'?-35:0});
    if(!soft)this.fx.push({type:'flash',x,y,r:heavy?12:7,
      life:heavy?.11:.08,max:heavy?.11:.08});
    if(type==='crit')this.ring(x,y,{r0:7,vr:280,life:.27,color:'#fff5d4',width:2});
    if(type==='stagger')this.orb(x,y,'#fff0bf',4);
    if(type==='reflect')this.beam(x-8,y-4,x+21,y-16,'#a3d5ff');
    if(type==='heal')this.orb(x,y,'#ace9cd',4);
    if(type==='barrier')this.ring(x,y,{r0:11,vr:72,life:.18,color:'#e8fcff',width:2.5});
    if(type==='wardFade')this.ring(x,y,{r0:20,vr:62,life:.32,color,width:2});
    if(type==='cleanse')this.orb(x,y,'#f2ffec',3);
    if(shatter)this.fx.push({type:'guardShards',x,y,life:.31,max:.31,
      color,seed:Math.abs(x*71+y*19)%7});
  }
  // `angle` (optional) sprays sparks directionally along the hit normal — reads as
  // force far better than a symmetric puff. A brief white flash pop sells the connect.
  impact(x, y, color, angle) {
    if (angle != null) {
      this.burst(x, y, { count: 9, color, speed: 240, life: 0.34, r: 3, drag: 3.5, angle, spread: 1.0 });
    } else {
      this.burst(x, y, { count: 10, color, speed: 200, life: 0.4, r: 3, drag: 3 });
    }
    this.ring(x, y, { r0: 4, vr: 300, life: 0.3, color, width: 3 });
    // white-hot flash pop at the contact point (impact-frame feel)
    this.fx.push({ type: 'flash', x, y, r: 10, life: 0.12, max: 0.12 });
  }
  // rising text (damage / status)
  text(x, y, str, color, size) {
    // Max 5 readable callouts, never 30 overlapping skill names.
    // Nearby duplicate events coalesce instead of piling into a word cloud.
    const clean=String(str||'').trim();
    if(!clean)return;
    const alive=this.fx.filter(e=>e.type==='text'&&e.life>.16);
    if(alive.length>=5)return;
    const nearby=alive.find(e=>Math.hypot(e.x-x,e.y-y)<42&&e.life>.4);
    if(nearby)return;
    this.fx.push({type:'text',x,y,str:clean.slice(0,11),color:color||'#fff',
      size:Math.min(14,Math.max(10,size||12)),life:.52,max:.52});
  }
  // orbiting glyph for charge/buff
  orb(x, y, color, n) {
    for (let i = 0; i < (n || 6); i++) this.fx.push({ type: 'orb', x, y, baseA: (i / (n || 6)) * Math.PI * 2, rad: 34, life: 0.6, max: 0.6, color: color || '#9d7bff' });
  }
  // lightning-ish zigzag beam between two points (for combo / ult)
  beam(x1, y1, x2, y2, color) {
    this.fx.push({ type: 'beam', x1, y1, x2, y2, life: 0.28, max: 0.28, color: color || '#ffd36b', seed: (x1 * 13 + y2 * 7) % 100 });
  }
  // A compact three-claw brush stroke, not a giant circular sword arc. radius
  // is VISUAL reach and is capped below the melee hit geometry. Same primitive
  // serves enemy swipes; heavy player strikes get a longer, weighted follow-through.
  slash(x, y, aim, color, radius, arc, options = {}) {
    const reach = Math.max(24, Math.min(112, Number(radius) || 52));
    const life = options.heavy ? 0.34 : 0.26;
    this.fx.push({ type: 'slash', x, y, aim, color: color || '#f8ddbe',
      radius: reach, arc: Math.max(.35, Math.min(.95, Number(arc) || .7)),
      heavy: !!options.heavy, life, max: life });
  }

  update(dt) {
    this._t += dt;                        // drives lightning flicker/reseed
    for (const e of this.fx) {
      e.life -= dt;
      if (e.type === 'spark' || e.type === 'fade') {
        if (e.vx != null) { e.x += e.vx * dt; e.y += e.vy * dt; e.vx *= (1 - (e.drag || 0) * dt); e.vy = e.vy * (1 - (e.drag || 0) * dt) + (e.grav || 0) * dt; }
      } else if (e.type === 'ring') { e.r += e.vr * dt; }
      else if(e.type==='text'){ e.y-=34*dt; }
    }
    this.fx = this.fx.filter(e => e.life > 0);
  }

  draw(ctx) {
    for (const e of this.fx) {
      const k = Math.max(0, e.life / e.max);
      ctx.save();
      ctx.globalAlpha = k;
      if (e.type === 'spark') {
        // Fine directional impact streaks, not floating dots.
        const a=Math.atan2(e.vy||1,e.vx||1),size=(e.r+2)*k;
        ctx.strokeStyle=e.color;ctx.lineWidth=Math.max(.8,size*.6);
        ctx.lineCap='round';ctx.beginPath();
        ctx.moveTo(e.x-Math.cos(a)*size*1.7,e.y-Math.sin(a)*size*1.7);
        ctx.lineTo(e.x+Math.cos(a)*size*.6,e.y+Math.sin(a)*size*.6);ctx.stroke();
      } else if (e.type === 'fade') {
        // Narrow fading movement trail, never a screen of glowing dots.
        ctx.globalAlpha=k*.35;ctx.strokeStyle=e.color;ctx.lineWidth=Math.max(.5,e.r*.65);
        ctx.beginPath();ctx.moveTo(e.x-e.r,e.y-e.r*.3);
        ctx.lineTo(e.x+e.r,e.y+e.r*.3);ctx.stroke();
      } else if (e.type === 'ring') {
        ctx.globalAlpha = k; ctx.strokeStyle = e.color; ctx.lineWidth = e.width * k + 0.5;
        ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2); ctx.stroke();
      } else if (e.type === 'flash') {
        // additive white-hot contact pop (impact-frame feel); shrinks as it fades
        ctx.globalCompositeOperation = 'lighter';
        const rr = e.r * (0.6 + k);
        const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, rr);
        g.addColorStop(0, 'rgba(255,255,255,' + k + ')'); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(e.x, e.y, rr, 0, Math.PI * 2); ctx.fill();
      } else if (e.type === 'muzzle') {
        ctx.translate(e.x, e.y); ctx.rotate(e.angle);
        ctx.fillStyle = e.color; ctx.globalAlpha = k;
        ctx.beginPath(); ctx.moveTo(0, -6 * k); ctx.lineTo(e.len * (0.5 + k), 0); ctx.lineTo(0, 6 * k); ctx.closePath(); ctx.fill();
        // No circular muzzle stamp; the directional cone is the visual cue.
      } else if (e.type === 'text') {
        ctx.fillStyle = e.color; ctx.font = `bold ${e.size}px sans-serif`; ctx.textAlign = 'center';
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.strokeText(e.str, e.x, e.y); ctx.fillText(e.str, e.x, e.y);
      } else if (e.type === 'orb') {
        const a=e.baseA+(1-k)*6,rad=e.rad*k,x=e.x+Math.cos(a)*rad,y=e.y+Math.sin(a)*rad;
        ctx.strokeStyle=e.color;ctx.lineWidth=2*k+1;ctx.beginPath();
        ctx.moveTo(x,y-6);ctx.lineTo(x+4,y);ctx.lineTo(x,y+6);ctx.lineTo(x-4,y);ctx.closePath();ctx.stroke();
      } else if (e.type === 'beam') {
        // Forked lightning bolt: midpoint-displacement jagged path + additive
        // core/halo glow (wide-to-narrow) + per-frame flicker. Reads as live
        // electricity instead of a flat zig-zag. (VFX research.)
        const pts = this._bolt(e.x1, e.y1, e.x2, e.y2, e.seed);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';         // overlaps sum toward white = neon glow
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        const flick = 0.75 + 0.25 * Math.abs(Math.sin(e.seed + this._t * 40));
        const lite = this._lighten(e.color);
        // 4-pass charged stack: wide colored aura → lighter-hue mid → near-white inner
        // → pure-white hot core. Additive so overlaps clip to white = high-voltage look.
        const passes = [[14 * k + 4, 0.16, e.color], [8 * k + 2, 0.32, lite], [4 * k + 1, 0.6, '#dceaff'], [1.8, 1.0, '#ffffff']];
        const strokePath = (arr, scale) => {
          ctx.beginPath(); ctx.moveTo(arr[0].x, arr[0].y);
          for (let i = 1; i < arr.length; i++) ctx.lineTo(arr[i].x, arr[i].y);
          ctx.stroke();
        };
        for (const [w, a, col] of passes) {
          ctx.globalAlpha = k * a * flick; ctx.strokeStyle = col; ctx.lineWidth = w;
          strokePath(pts);
        }
        // branch forks: just the inner two passes, dimmer (Drilian branch dimming)
        if (pts.branches) for (const seg of pts.branches) {
          for (const [w, a, col] of [[3 * k + 1, 0.4, lite], [1.4, 0.8, '#ffffff']]) {
            ctx.globalAlpha = k * a * flick * 0.6; ctx.strokeStyle = col; ctx.lineWidth = w;
            strokePath(seg);
          }
        }
        ctx.restore();
      } else if (e.type === 'guardShards') {
        // A consumed protect ward breaks into seven small watercolor shards.
        ctx.translate(e.x,e.y);ctx.rotate(e.seed);
        ctx.lineCap='round';
        for(let i=0;i<7;i++){
          const a=i*Math.PI*2/7,rad=6+(1-k)*29;
          ctx.save();ctx.translate(Math.cos(a)*rad,Math.sin(a)*rad);
          ctx.rotate(a+Math.PI/4);ctx.globalAlpha=k*.86;
          ctx.strokeStyle=i%2?e.color:'#fffdf4';ctx.lineWidth=1.8;
          ctx.beginPath();ctx.moveTo(-5*k,-2*k);ctx.lineTo(0,-6*k);
          ctx.lineTo(5*k,-1*k);ctx.stroke();ctx.restore();
        }
      } else if (e.type === 'slash') {
        // Three hand-painted tapered claw marks: quick reveal, narrow follow-
        // through and empty space between the marks. Never a full crescent,
        // circular aura, giant flash or opaque stamp over the attacking cat.
        const age = 1 - k, lead = Math.min(1, age * (e.heavy ? 3.65 : 4.8));
        const tail = Math.max(0, lead - (e.heavy ? .70 : .59));
        const visibility = Math.min(1, age * 15) * Math.min(1, k * 3.7);
        const R = e.radius, bend = e.arc / .7;
        ctx.translate(e.x, e.y); ctx.rotate(e.aim);
        const pos = (t, row) => ({
          x: R * (.20 + .75 * t),
          y: R * (.47 - .94 * t * bend) + (row - 1) * R * .155 +
            Math.sin(t * Math.PI) * R * .23
        });
        // Each brush is a filled ribbon tapered at both ends. Three passes
        // give a restrained ink edge, element pigment and warm thin highlight.
        const ribbon = (row, width, fill, alpha) => {
          const upper = [], lower = [];
          for (let j = 0; j <= 12; j++) {
            const t = tail + (lead - tail) * j / 12;
            const q = pos(t, row), q2 = pos(Math.min(1, t + .006), row);
            const dx = q2.x - q.x, dy = q2.y - q.y, norm = Math.hypot(dx, dy) || 1;
            const edge = Math.pow(Math.max(0, Math.sin(Math.PI * (t * .91 + .045))), .66);
            const cut = Math.min(1, (t - tail) * 9 + .17,
              (lead - t) * 11 + .10);
            const w = width * edge * cut;
            const nx = -dy / norm, ny = dx / norm;
            upper.push([q.x + nx * w, q.y + ny * w]);
            lower.push([q.x - nx * w, q.y - ny * w]);
          }
          ctx.globalAlpha = visibility * alpha;
          ctx.fillStyle = fill; ctx.beginPath();
          upper.forEach(([x, y], j) => j ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
          for (let j = lower.length - 1; j >= 0; j--) ctx.lineTo(lower[j][0], lower[j][1]);
          ctx.closePath(); ctx.fill();
        };
        for (let row = 0; row < 3; row++) {
          const weight = (e.heavy ? 1.24 : 1) * (row === 1 ? 1.08 : .86);
          ribbon(row, 11.5 * weight, '#44354b', .30);
          ribbon(row, 8.5 * weight, e.color, .94);
          ribbon(row, 3.7 * weight, '#fff6df', .98);
        }
        // One short glint follows the leading claw (no detached glitter cloud).
        if (lead > .2 && lead < .98) {
          const tip = pos(lead, 1), glint = (e.heavy ? 3.5 : 2.5) * visibility;
          ctx.globalAlpha = visibility * .76;
          ctx.strokeStyle = '#fff9e8'; ctx.lineWidth = 1.15;
          ctx.beginPath(); ctx.moveTo(tip.x - glint, tip.y);
          ctx.lineTo(tip.x + glint, tip.y);
          ctx.moveTo(tip.x, tip.y - glint * .8);
          ctx.lineTo(tip.x, tip.y + glint * .8); ctx.stroke();
        }
      }
      ctx.restore();
    }
  }
}

window.VFX = VFX;
