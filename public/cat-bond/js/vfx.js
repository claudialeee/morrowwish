// vfx.js — reusable juicy visual effects for skills & impacts. Pure Canvas 2D.
// A single VFX layer owns a pool of effect objects; battle.js spawns into it.

class VFX {
  constructor() { this.fx = []; }
  clear() { this.fx.length = 0; }

  // ---- spawners ----
  burst(x, y, opts = {}) {
    const n = opts.count || 14;
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
    this.fx.push({ type: 'fade', x, y, r: r || 4, life: 0.26, max: 0.26, color: color || '#ffd36b' });
  }
  impact(x, y, color) {
    this.burst(x, y, { count: 10, color, speed: 200, life: 0.4, r: 3, drag: 3 });
    this.ring(x, y, { r0: 4, vr: 300, life: 0.3, color, width: 3 });
  }
  // rising text (damage / status)
  text(x, y, str, color, size) { this.fx.push({ type: 'text', x, y, str, color: color || '#fff', size: size || 15, life: 0.9, max: 0.9 }); }
  // orbiting glyph for charge/buff
  orb(x, y, color, n) {
    for (let i = 0; i < (n || 6); i++) this.fx.push({ type: 'orb', x, y, baseA: (i / (n || 6)) * Math.PI * 2, rad: 34, life: 0.6, max: 0.6, color: color || '#9d7bff' });
  }
  // lightning-ish zigzag beam between two points (for combo / ult)
  beam(x1, y1, x2, y2, color) {
    this.fx.push({ type: 'beam', x1, y1, x2, y2, life: 0.2, max: 0.2, color: color || '#ffd36b', seed: (x1 * 13 + y2 * 7) % 100 });
  }
  // sweeping curved slash blade in front of the caster (melee signature VFX).
  // Draws a crescent along `radius` spanning ±arc around `aim`, that wipes from
  // one edge to the other over its short life.
  slash(x, y, aim, color, radius, arc) {
    this.fx.push({ type: 'slash', x, y, aim, color: color || '#fff', radius: radius || 92, arc: arc || 1.0, life: 0.26, max: 0.26 });
  }

  update(dt) {
    for (const e of this.fx) {
      e.life -= dt;
      if (e.type === 'spark' || e.type === 'fade') {
        if (e.vx != null) { e.x += e.vx * dt; e.y += e.vy * dt; e.vx *= (1 - (e.drag || 0) * dt); e.vy = e.vy * (1 - (e.drag || 0) * dt) + (e.grav || 0) * dt; }
      } else if (e.type === 'ring') { e.r += e.vr * dt; }
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
      } else if (e.type === 'muzzle') {
        ctx.translate(e.x, e.y); ctx.rotate(e.angle);
        ctx.fillStyle = e.color; ctx.globalAlpha = k;
        ctx.beginPath(); ctx.moveTo(0, -6 * k); ctx.lineTo(e.len * (0.5 + k), 0); ctx.lineTo(0, 6 * k); ctx.closePath(); ctx.fill();
        // No circular muzzle stamp; the directional cone is the visual cue.
      } else if (e.type === 'text') {
        e.y -= 34 * dtGuess; ctx.fillStyle = e.color; ctx.font = `bold ${e.size}px sans-serif`; ctx.textAlign = 'center';
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.strokeText(e.str, e.x, e.y); ctx.fillText(e.str, e.x, e.y);
      } else if (e.type === 'orb') {
        const a=e.baseA+(1-k)*6,rad=e.rad*k,x=e.x+Math.cos(a)*rad,y=e.y+Math.sin(a)*rad;
        ctx.strokeStyle=e.color;ctx.lineWidth=2*k+1;ctx.beginPath();
        ctx.moveTo(x,y-6);ctx.lineTo(x+4,y);ctx.lineTo(x,y+6);ctx.lineTo(x-4,y);ctx.closePath();ctx.stroke();
      } else if (e.type === 'beam') {
        ctx.strokeStyle = e.color; ctx.lineWidth = 3 * k + 1; ctx.globalAlpha = k;
        ctx.beginPath(); ctx.moveTo(e.x1, e.y1);
        const segs = 6;
        for (let i = 1; i < segs; i++) {
          const tt = i / segs;
          const mx = e.x1 + (e.x2 - e.x1) * tt, my = e.y1 + (e.y2 - e.y1) * tt;
          const off = Math.sin(e.seed + i * 2) * 10 * (1 - tt);
          const nx = -(e.y2 - e.y1), ny = (e.x2 - e.x1); const nl = Math.hypot(nx, ny) || 1;
          ctx.lineTo(mx + nx / nl * off, my + ny / nl * off);
        }
        ctx.lineTo(e.x2, e.y2); ctx.stroke();
      } else if (e.type === 'slash') {
        // a crescent blade that wipes across the frontal arc as it fades
        const sweep = 1 - k;                                   // 0→1 over life
        const a0 = e.aim - e.arc, a1 = e.aim + e.arc;
        const lead = a0 + (a1 - a0) * sweep;                   // leading edge angle
        ctx.translate(e.x, e.y);
        // soft wide crescent body
        ctx.globalAlpha = k * 0.5; ctx.strokeStyle = e.color;
        ctx.lineWidth = 10 * k + 2; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(0, 0, e.radius, a0, a1); ctx.stroke();
        // bright thin leading slash
        ctx.globalAlpha = k; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, 0, e.radius, Math.max(a0, lead - 0.5), lead); ctx.stroke();
        // white hot tip
        ctx.fillStyle = '#fff'; ctx.globalAlpha = k;
        ctx.beginPath(); ctx.arc(Math.cos(lead) * e.radius, Math.sin(lead) * e.radius, 3.5 * k + 1, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
  }
}

// text particles rise using a small fixed step (fine for the short lifetime)
const dtGuess = 1 / 60;

window.VFX = VFX;
