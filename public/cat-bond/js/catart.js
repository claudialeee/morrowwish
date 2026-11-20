// catart.js — 2.5D soft-body "plush / game-CG" cats. Pure Canvas 2D.
// Volume via radial gradients, layered rim-light + core highlight, soft ambient
// occlusion where head/body meet, and a soft blurred ground shadow.
// Poses: idle, walk, play, sit, sleep, belly(翻肚皮), loaf. Breeds via pattern/traits.

const CAT_PALETTES = {
  orange:      { body: '#f5a94e', belly: '#ffe4c2', mark: '#dd7a28', ear: '#ffcfa0', point: '#d87324' },
  brownTabby:  { body: '#c09266', belly: '#ecd6b4', mark: '#7a5334', ear: '#d8b394', point: '#6b4a2e' },
  silver:      { body: '#c3ccd8', belly: '#eef2f8', mark: '#8a97a8', ear: '#d7dde8', point: '#6f7d92' },
  tux:         { body: '#423b4a', belly: '#f6f2fa', mark: '#2a2531', ear: '#f2b6cb', point: '#201c25' },
  white:       { body: '#f1ebf6', belly: '#ffffff', mark: '#ded5e8', ear: '#ffd6e8', point: '#d8cfe4' },
  black:       { body: '#4a4254', belly: '#5e5468', mark: '#352e3d', ear: '#8a76a0', point: '#2a2432' },
  cream:       { body: '#f1d9b4', belly: '#fff6e6', mark: '#d8b081', ear: '#ffd3b2', point: '#cfa877' },
  calico:      { body: '#f6ecd9', belly: '#fff8ee', mark: '#e08a44', ear: '#f3b0b0', point: '#3a3138' },
  blue:        { body: '#9aa8ba', belly: '#cdd6e2', mark: '#75849a', ear: '#b7c1cf', point: '#5c6a7e' },
  ragdoll:     { body: '#ede2d0', belly: '#fff9f0', mark: '#cbb09a', ear: '#ecd1c0', point: '#7a5f4f' },
  siamese:     { body: '#eadcc0', belly: '#fff7e6', mark: '#c9ab84', ear: '#6b5244', point: '#4a3a2b' },
  maine:       { body: '#a07c54', belly: '#dcc5a3', mark: '#634426', ear: '#bb9674', point: '#4a3220' },
  flame:       { body: '#ff9a38', belly: '#ffe08a', mark: '#ea5a22', ear: '#ffc766', point: '#ff6a1f' },
  cloud:       { body: '#eef1ff', belly: '#ffffff', mark: '#cdd6ff', ear: '#ffdaf2', point: '#b9c6ff' },
  mystic:      { body: '#6a589a', belly: '#9a88cc', mark: '#45386b', ear: '#cbb8ff', point: '#2f2650' },
  goldShaded:  { body: '#f3d89a', belly: '#fff6dd', mark: '#d9a84e', ear: '#ffe6ac', point: '#c8902f' },  // 金渐层
  apricot:     { body: '#f6c98a', belly: '#fff2d9', mark: '#e0a258', ear: '#ffdca8', point: '#cf9348' },  // 矮脚猫
  cheese:      { body: '#f6a93e', belly: '#fff6ea', mark: '#e07f22', ear: '#ffd09a', point: '#ffffff' },  // 起司猫(橘白)
  norwegian:   { body: '#b89066', belly: '#e9d6b8', mark: '#6f4a2a', ear: '#d6b48c', point: '#4f3620' },  // 挪威森林
  bengal:      { body: '#e0a24e', belly: '#f5e2bc', mark: '#4a3320', ear: '#f0c488', point: '#2e2114' },  // 豹猫
};

function look(o) {
  const sp = o.species || {};
  const palKey = o.palette || sp.palette || 'orange';
  return {
    pal: CAT_PALETTES[palKey] || CAT_PALETTES.orange,
    pattern: o.pattern || sp.pattern || 'solid',
    eyeColor: o.eyeColor || sp.eyeColor || '#3a3442',
    fluffy: (o.fluffy !== undefined ? o.fluffy : sp.fluffy) || false,
    ears: o.ears || sp.ears || 'normal',
    point: o.point || sp.point || null,
    short: (o.short !== undefined ? o.short : sp.short) || false,   // 矮脚/曼基康: stubby legs
  };
}

// a reusable chunky "plush/claymation" volume (Party Animals vibe):
// soft dark contour + strong top-left key light + bottom rim light.
function sphere(ctx, cx, cy, rx, ry, base) {
  // soft contour outline (gives the clay/plush read)
  ctx.save();
  ctx.fillStyle = shade(base, 0.32);
  el(ctx, cx, cy + 0.6, rx + 1.6, ry + 1.6); ctx.fill();
  ctx.restore();
  // main volume: bright key light upper-left → deep shade lower-right
  const g = ctx.createRadialGradient(cx - rx * 0.42, cy - ry * 0.5, rx * 0.1, cx + rx * 0.1, cy + ry * 0.2, rx * 1.25);
  g.addColorStop(0, lighten(base, 0.34));
  g.addColorStop(0.4, lighten(base, 0.1));
  g.addColorStop(0.8, base);
  g.addColorStop(1, shade(base, 0.22));
  ctx.fillStyle = g;
  el(ctx, cx, cy, rx, ry); ctx.fill();
  // glossy key-light hotspot (claymation sheen)
  ctx.save(); el(ctx, cx, cy, rx, ry); ctx.clip();
  const hot = ctx.createRadialGradient(cx - rx * 0.4, cy - ry * 0.52, 0, cx - rx * 0.4, cy - ry * 0.52, rx * 0.7);
  hot.addColorStop(0, withA(lighten(base, 0.5), 0.55));
  hot.addColorStop(1, withA(lighten(base, 0.5), 0));
  ctx.fillStyle = hot; el(ctx, cx, cy, rx, ry); ctx.fill();
  // cool bottom rim light
  const rim = ctx.createRadialGradient(cx + rx * 0.45, cy + ry * 0.6, rx * 0.2, cx + rx * 0.45, cy + ry * 0.6, rx);
  rim.addColorStop(0, withA(lighten(base, 0.3), 0));
  rim.addColorStop(0.72, withA(lighten(base, 0.3), 0));
  rim.addColorStop(1, withA('#cde6ff', 0.4));
  ctx.fillStyle = rim; el(ctx, cx, cy, rx, ry); ctx.fill();
  ctx.restore();
}

function drawCat(ctx, x, y, opts) {
  const o = opts || {};
  const L = look(o);
  const pal = L.pal, pattern = L.pattern, fluffy = L.fluffy, ears = L.ears, short = L.short;
  const point = L.point || pal.point;
  const s = o.scale || 1, face = o.face || 1, t = o.t || 0;
  const pose = o.pose || 'idle', mood = o.mood || 'neutral';

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(face * s, s);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';

  // strong soft contact shadow (Party-Animals grounding)
  const wide = (pose === 'belly' || pose === 'sleep');
  const lift = (pose === 'play') ? Math.abs(Math.sin(t * 9)) * 7 : 0;    // shadow shrinks when hopping
  for (let i = 4; i >= 1; i--) {
    ctx.fillStyle = `rgba(20,10,30,${0.06 * i})`;
    el(ctx, 0, 34, (wide ? 28 : 19) * (i / 2.6 + 0.42) * (1 - lift * 0.015), 6.5 * (i / 2.6 + 0.3) * (1 - lift * 0.02)); ctx.fill();
  }

  if (pose === 'sleep') { drawSleep(ctx, pal, pattern, point, fluffy, t); ctx.restore(); return; }
  if (pose === 'belly')  { drawBelly(ctx, pal, pattern, point, fluffy, L.eyeColor, t); ctx.restore(); return; }
  if (pose === 'loaf')   { drawLoaf(ctx, pal, pattern, point, fluffy, L.eyeColor, t, mood); ctx.restore(); return; }

  const bob = pose === 'walk' ? Math.abs(Math.sin(t * 8)) * 1.6 : Math.sin(t * 2) * 0.6;
  const hop = pose === 'play' ? Math.abs(Math.sin(t * 9)) * 7 : 0;
  const by = -bob - hop;
  const sit = pose === 'sit';

  drawTail(ctx, pal, point, pattern, fluffy, t, pose, by);

  // ---- body (smaller egg BELOW the head, clear silhouette; 矮脚=lower & wider) ----
  const bcx = 0;
  const bcy = (sit ? 22 : 21) + by + (short ? 3 : 0);
  const brx = (sit ? 13 : 14) + (short ? 3 : 0);
  const bry = (sit ? 14 : 12) + (short ? -1 : 0);
  if (fluffy) { ctx.fillStyle = shade(pal.body, 0.05); fluff(ctx, bcx, bcy, brx + 3, bry + 2, 1.13, 15); }
  sphere(ctx, bcx, bcy, brx, bry, pal.body);

  // belly light patch (soft)
  const bellyG = ctx.createRadialGradient(bcx, bcy + 3, 2, bcx, bcy + 4, brx * 0.75);
  bellyG.addColorStop(0, withA(lighten(pal.belly, 0.08), 0.95));
  bellyG.addColorStop(1, withA(pal.belly, 0));
  ctx.fillStyle = bellyG;
  const bw = (pattern === 'tuxedo' || pattern === 'bicolor') ? 0.75 : 0.55;
  el(ctx, bcx, bcy + 3, brx * bw, bry * 0.72); ctx.fill();

  ctx.save(); el(ctx, bcx, bcy, brx, bry); ctx.clip();
  bodyMarks(ctx, pattern, pal, point, bcx, bcy, brx, bry);
  ctx.restore();

  // ---- hind feet (two little mitts peeking at the very bottom) ----
  const footC = (pattern === 'tuxedo' || pattern === 'bicolor' || pattern === 'pointed') ? pal.belly : pal.body;
  softBlob(ctx, bcx - brx * 0.52, bcy + bry - 1, 5, 3.6, footC);
  softBlob(ctx, bcx + brx * 0.52, bcy + bry - 1, 5, 3.6, footC);

  // ---- front ARMS: two stubby limbs hanging down the chest (so it has "hands") ----
  const armSwing = pose === 'walk' ? Math.sin(t * 8) * 3 : (pose === 'play' ? Math.sin(t * 9) * 5 : Math.sin(t * 2) * 1);
  const armC = footC;
  for (const side of [-1, 1]) {
    const ax0 = bcx + side * (brx * 0.5), ay0 = bcy - bry * 0.3;
    const ax1 = ax0 + side * 1.5, ay1 = bcy + bry * 0.55 + (side * armSwing);
    ctx.strokeStyle = shade(pal.body, 0.08); ctx.lineWidth = 6.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(ax0, ay0); ctx.quadraticCurveTo(ax0 + side * 2, (ay0 + ay1) / 2, ax1, ay1); ctx.stroke();
    softBlob(ctx, ax1, ay1 + 1, 4.2, 4, armC);       // paw/hand at the end
  }

  // ---- head (oversized round — the Party-Animals signature, clearly ON TOP) ----
  const hcx = 0, hcy = (sit ? -8 : -7) + by, hr = 18;
  // little neck connector so head & body read as attached, not merged
  ctx.fillStyle = shade(pal.body, 0.06);
  el(ctx, bcx, hcy + hr * 0.72, brx * 0.6, bry * 0.5); ctx.fill();
  drawEars(ctx, hcx, hcy, hr, pal, point, pattern, ears);
  sphere(ctx, hcx, hcy, hr, hr * 0.94, pal.body);

  ctx.save(); el(ctx, hcx, hcy, hr, hr * 0.94); ctx.clip();
  headMarks(ctx, pattern, pal, point, hcx, hcy, hr);
  ctx.restore();

  drawFace(ctx, hcx, hcy, mood, t, L.eyeColor);

  if (mood === 'love') { ctx.fillStyle = '#ff7b9c'; heart(ctx, hcx + 18, hcy - 15 - Math.sin(t * 3) * 2, 4.5); }
  else if (mood === 'sleepy') { ctx.fillStyle = 'rgba(150,170,210,0.85)'; ctx.font = 'bold 10px sans-serif'; ctx.save(); ctx.scale(face, 1); ctx.fillText('z', face * (hcx + 14), hcy - 15); ctx.restore(); }

  ctx.restore();
}

// ---- face (soft, with glossy-but-small eyes to read as 3D) ----
function drawFace(ctx, cx, cy, mood, t, eyeColor) {
  const blink = ((t * 0.5) % 4) > 3.86;
  const ex = 5.5, ey = cy - 1;
  // soft cheeks
  const ch = ctx.createRadialGradient(cx - 9, cy + 3, 0, cx - 9, cy + 3, 4);
  ch.addColorStop(0, 'rgba(255,150,170,0.4)'); ch.addColorStop(1, 'rgba(255,150,170,0)');
  ctx.fillStyle = ch; el(ctx, cx - 9, cy + 3, 4, 3); ctx.fill();
  const ch2 = ctx.createRadialGradient(cx + 9, cy + 3, 0, cx + 9, cy + 3, 4);
  ch2.addColorStop(0, 'rgba(255,150,170,0.4)'); ch2.addColorStop(1, 'rgba(255,150,170,0)');
  ctx.fillStyle = ch2; el(ctx, cx + 9, cy + 3, 4, 3); ctx.fill();

  if (mood === 'happy' || mood === 'love') {
    ctx.strokeStyle = '#3b3340'; ctx.lineWidth = 2.2;
    arc(ctx, cx - ex, ey + 1, 2.8, Math.PI * 1.08, Math.PI * 1.92);
    arc(ctx, cx + ex, ey + 1, 2.8, Math.PI * 1.08, Math.PI * 1.92);
  } else if (blink) {
    ctx.strokeStyle = '#3b3340'; ctx.lineWidth = 2;
    line(ctx, cx - ex - 2.4, ey, cx - ex + 2.4, ey);
    line(ctx, cx + ex - 2.4, ey, cx + ex + 2.4, ey);
  } else {
    // rounded shiny eyes (give a little 3D bead feel but small & cute)
    const r = mood === 'alert' ? 3.6 : 3.2;
    for (const px of [cx - ex, cx + ex]) {
      const eg = ctx.createRadialGradient(px - 0.8, ey - 1, 0.4, px, ey, r);
      eg.addColorStop(0, '#5a5262'); eg.addColorStop(0.6, '#2f2a36'); eg.addColorStop(1, '#17131d');
      ctx.fillStyle = eg; dot(ctx, px, ey, r);
      ctx.fillStyle = 'rgba(255,255,255,0.95)'; dot(ctx, px - 1, ey - 1.1, 1.1);
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; dot(ctx, px + 1, ey + 0.9, 0.6);
    }
  }
  // nose
  ctx.fillStyle = '#e88aa0';
  tri(ctx, cx - 1.8, cy + 3.3, cx + 1.8, cy + 3.3, cx, cy + 5.2);
  ctx.fillStyle = 'rgba(255,255,255,0.4)'; dot(ctx, cx - 0.4, cy + 3.8, 0.5);
  // mouth
  ctx.strokeStyle = 'rgba(70,55,70,0.55)'; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, cy + 5.2); ctx.quadraticCurveTo(cx - 2.5, cy + 7, cx - 4, cy + 6);
  ctx.moveTo(cx, cy + 5.2); ctx.quadraticCurveTo(cx + 2.5, cy + 7, cx + 4, cy + 6);
  ctx.stroke();
  // whiskers
  ctx.strokeStyle = 'rgba(120,110,120,0.35)'; ctx.lineWidth = 0.8;
  for (let i = -1; i <= 1; i += 2) {
    line(ctx, cx - 5, cy + 3 + i, cx - 13, cy + 2 + i * 2.5);
    line(ctx, cx + 5, cy + 3 + i, cx + 13, cy + 2 + i * 2.5);
  }
}

function drawEars(ctx, cx, cy, hr, pal, point, pattern, ears) {
  const fill = (pattern === 'pointed') ? point : pal.body;
  if (ears === 'fold') {
    // folded ears: small flaps bent forward, still clearly visible on the crown
    ctx.fillStyle = shade(fill, 0.06);
    softBlob(ctx, cx - 11, cy - hr + 3, 7, 5.5, fill); softBlob(ctx, cx + 11, cy - hr + 3, 7, 5.5, fill);
    ctx.fillStyle = withA(pal.ear, 0.85); rblob(ctx, cx - 11, cy - hr + 5, 3.8, 3); rblob(ctx, cx + 11, cy - hr + 5, 3.8, 3);
    return;
  }
  // tall triangular ears poking well above the crown (base wider, tip higher)
  const baseY = cy - hr + 7, tipY = cy - hr - 16, dxOut = 15, dxIn = 3;
  ctx.fillStyle = shade(fill, 0.08);
  tri(ctx, cx - dxOut, baseY, cx - dxIn, baseY - 2, cx - 9, tipY);
  tri(ctx, cx + dxOut, baseY, cx + dxIn, baseY - 2, cx + 9, tipY);
  // soft key-light on the lit (left) ear
  ctx.fillStyle = lighten(fill, 0.12);
  tri(ctx, cx - dxOut + 1, baseY - 1, cx - dxIn, baseY - 2, cx - 9, tipY + 2);
  // inner ear (pink)
  ctx.fillStyle = (pattern === 'pointed') ? shade(point, 0.1) : pal.ear;
  tri(ctx, cx - 12, baseY - 1, cx - 5, baseY - 2, cx - 9, tipY + 5);
  tri(ctx, cx + 12, baseY - 1, cx + 5, baseY - 2, cx + 9, tipY + 5);
  if (ears === 'tufted') {
    ctx.strokeStyle = pal.belly; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
    line(ctx, cx - 9, tipY, cx - 12, tipY - 7);
    line(ctx, cx + 9, tipY, cx + 12, tipY - 7);
  }
}

function drawTail(ctx, pal, point, pattern, fluffy, t, pose, by) {
  const wag = Math.sin(t * (pose === 'play' ? 7 : 2.4)) * (pose === 'idle' ? 0.3 : 0.5);
  ctx.save(); ctx.translate(-13, 20 + by);
  // outline-ish shade under then body color on top for a little depth
  ctx.strokeStyle = shade(pal.body, 0.12); ctx.lineWidth = (fluffy ? 10 : 7) + 2;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-15, -2 + wag * 12, -6 + wag * 16, -24 - wag * 8); ctx.stroke();
  ctx.strokeStyle = pal.body; ctx.lineWidth = fluffy ? 10 : 7;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-15, -2 + wag * 12, -6 + wag * 16, -24 - wag * 8); ctx.stroke();
  softBlob(ctx, -6 + wag * 16, -24 - wag * 8, fluffy ? 6 : 4.5, fluffy ? 6 : 4.5, (pattern === 'pointed') ? point : pal.body);
  ctx.restore();
}

function drawLoaf(ctx, pal, pattern, point, fluffy, eyeColor, t, mood) {
  const br = Math.sin(t * 2) * 0.6;
  if (fluffy) { ctx.fillStyle = shade(pal.body, 0.05); fluff(ctx, 0, 16, 22, 13 + br, 1.12, 14); }
  sphere(ctx, 0, 16 + br, 20, 12, pal.body);
  ctx.fillStyle = withA(pal.belly, 0.6); el(ctx, 0, 24, 12, 4); ctx.fill();
  drawEars(ctx, 0, 2, 14, pal, point, pattern, 'normal');
  sphere(ctx, 0, 4, 14, 13, pal.body);
  ctx.save(); el(ctx, 0, 4, 14, 13); ctx.clip(); headMarks(ctx, pattern, pal, point, 0, 4, 14); ctx.restore();
  drawFace(ctx, 0, 4, mood, t, eyeColor);
}

function drawBelly(ctx, pal, pattern, point, fluffy, eyeColor, t) {
  const wig = Math.sin(t * 4) * 0.08;
  ctx.rotate(wig);
  if (fluffy) { ctx.fillStyle = shade(pal.body, 0.05); fluff(ctx, 0, 14, 24, 15, 1.12, 15); }
  sphere(ctx, 0, 14, 22, 14, pal.body);
  // round belly highlight
  const bg = ctx.createRadialGradient(0, 14, 2, 0, 15, 15);
  bg.addColorStop(0, withA(lighten(pal.belly, 0.1), 0.95)); bg.addColorStop(1, withA(pal.belly, 0));
  ctx.fillStyle = bg; el(ctx, 0, 15, 15, 10); ctx.fill();
  const w = Math.sin(t * 6) * 2;
  const paws = [[-13, 2 + w], [-5, -2 - w], [6, -2 + w], [14, 2 - w]];
  for (const [px, py] of paws) softBlob(ctx, px, py, 4.5, 4, pal.body);
  ctx.fillStyle = '#f2a8ba';
  for (const [px, py] of paws) dot(ctx, px, py - 1, 1.6);
  sphere(ctx, 0, 26, 12, 10, pal.body);
  ctx.strokeStyle = '#3b3340'; ctx.lineWidth = 2;
  arc(ctx, -5, 25, 2.2, Math.PI * 0.1, Math.PI * 0.9);
  arc(ctx, 5, 25, 2.2, Math.PI * 0.1, Math.PI * 0.9);
  ctx.fillStyle = '#e88aa0'; dot(ctx, 0, 29, 1.4);
  ctx.fillStyle = 'rgba(255,211,107,0.9)'; ctx.font = 'bold 11px sans-serif';
  ctx.fillText('♪', 15, -6 - Math.sin(t * 3) * 2);
}

function drawSleep(ctx, pal, pattern, point, fluffy, t) {
  const br = Math.sin(t * 1.5) * 1.2;
  if (fluffy) { ctx.fillStyle = shade(pal.body, 0.05); fluff(ctx, 0, 14, 25, 13 + br, 1.12, 16); }
  sphere(ctx, 0, 14, 23, 12 + br, pal.body);
  ctx.fillStyle = withA(pal.belly, 0.6); el(ctx, -2, 17, 14, 6); ctx.fill();
  sphere(ctx, 16, 10, 11, 9, pal.body);
  ctx.fillStyle = pal.body; tri(ctx, 10, 3, 16, 1, 15, -7);
  ctx.strokeStyle = pal.body; ctx.lineWidth = fluffy ? 10 : 7;
  ctx.beginPath(); ctx.moveTo(-21, 15); ctx.quadraticCurveTo(-29, 3, -13, 3); ctx.stroke();
  ctx.strokeStyle = '#3b3340'; ctx.lineWidth = 1.6;
  arc(ctx, 17, 10, 2.4, 0.2, Math.PI - 0.2);
  ctx.fillStyle = 'rgba(255,150,170,0.3)'; el(ctx, 21, 13, 2.6, 1.8); ctx.fill();
  ctx.fillStyle = 'rgba(150,170,210,0.85)'; ctx.font = 'bold 11px sans-serif';
  const zp = (t % 3) / 3; ctx.globalAlpha = 1 - zp; ctx.fillText('z', 25 + zp * 8, -4 - zp * 13); ctx.globalAlpha = 1;
}

// ---- markings ----
function bodyMarks(ctx, pattern, pal, point, cx, cy, rx, ry) {
  if (pattern === 'tabby' || pattern === 'silver') {
    ctx.strokeStyle = withA(pal.mark, 0.55); ctx.lineWidth = 2.4;
    for (let i = -1; i <= 2; i++) arcStroke(ctx, cx, cy - 10 + i * 7, rx - 3, ry - 3, -0.4, 0.4);
  } else if (pattern === 'spotted') {
    ctx.fillStyle = withA(pal.mark, 0.6);
    for (const [dx, dy] of [[-8, -5], [3, -8], [9, 0], [-2, 3], [-9, 4], [6, 6]]) dot(ctx, cx + dx, cy + dy, 2.4);
  } else if (pattern === 'calico') {
    ctx.fillStyle = withA('#e08a44', 0.85); el(ctx, cx + 7, cy - 3, 8, 7); ctx.fill();
    ctx.fillStyle = withA('#3a3138', 0.85); el(ctx, cx - 8, cy - 6, 6, 5); ctx.fill();
  } else if (pattern === 'pointed') {
    ctx.fillStyle = withA(point, 0.4); el(ctx, cx, cy + ry - 2, rx * 0.5, 5); ctx.fill();
  }
}
function headMarks(ctx, pattern, pal, point, cx, cy, hr) {
  if (pattern === 'tabby' || pattern === 'silver') {
    ctx.strokeStyle = withA(pal.mark, 0.5); ctx.lineWidth = 1.8;
    line(ctx, cx - 4, cy - hr + 3, cx - 2.5, cy - 4);
    line(ctx, cx, cy - hr + 2, cx, cy - 5);
    line(ctx, cx + 4, cy - hr + 3, cx + 2.5, cy - 4);
  } else if (pattern === 'pointed') {
    ctx.fillStyle = withA(point, 0.38); el(ctx, cx, cy + 5, 9, 7); ctx.fill();
  } else if (pattern === 'calico') {
    ctx.fillStyle = withA('#3a3138', 0.75); el(ctx, cx - 7, cy - 3, 6, 6); ctx.fill();
    ctx.fillStyle = withA('#e08a44', 0.75); el(ctx, cx + 8, cy - 5, 4.5, 4.5); ctx.fill();
  } else if (pattern === 'tuxedo' || pattern === 'bicolor') {
    ctx.fillStyle = pal.belly; tri(ctx, cx, cy + 9, cx - 3.5, cy - 5, cx + 3.5, cy - 5);
  }
}

// ---- primitives ----
function softBlob(ctx, cx, cy, rx, ry, base) {
  const g = ctx.createRadialGradient(cx - rx * 0.3, cy - ry * 0.4, rx * 0.1, cx, cy, rx * 1.1);
  g.addColorStop(0, lighten(base, 0.18)); g.addColorStop(0.8, base); g.addColorStop(1, shade(base, 0.12));
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
}
function el(ctx, cx, cy, rx, ry) { ctx.beginPath(); ctx.ellipse(cx, cy, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2); }
function dot(ctx, cx, cy, r) { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); }
function rblob(ctx, cx, cy, rx, ry) { ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); }
function tri(ctx, x1, y1, x2, y2, x3, y3) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.closePath(); ctx.fill(); }
function line(ctx, x1, y1, x2, y2) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
function arc(ctx, cx, cy, r, a0, a1) { ctx.beginPath(); ctx.arc(cx, cy, r, a0, a1); ctx.stroke(); }
function arcStroke(ctx, cx, cy, rx, ry, a0, a1) { ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, Math.PI / 2 - a1, Math.PI / 2 - a0); ctx.stroke(); }
function fluff(ctx, cx, cy, rx, ry, spike, n) {
  ctx.beginPath();
  for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2; const r = (i % 2 === 0) ? 1 : spike; const px = cx + Math.cos(a) * rx * r, py = cy + Math.sin(a) * ry * r; i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); }
  ctx.closePath(); ctx.fill();
}
function heart(ctx, x, y, s) {
  ctx.beginPath(); ctx.moveTo(x, y + s * 0.3);
  ctx.bezierCurveTo(x, y - s * 0.3, x - s, y - s * 0.3, x - s, y + s * 0.3);
  ctx.bezierCurveTo(x - s, y + s, x, y + s * 1.2, x, y + s * 1.6);
  ctx.bezierCurveTo(x, y + s * 1.2, x + s, y + s, x + s, y + s * 0.3);
  ctx.bezierCurveTo(x + s, y - s * 0.3, x, y - s * 0.3, x, y + s * 0.3);
  ctx.fill();
}
function hex2rgb(h) { h = h.replace('#', '').trim(); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function lighten(h, f) { if (!h || h[0] !== '#') return h; const [r, g, b] = hex2rgb(h); return `rgb(${Math.min(255, r + 255 * f) | 0},${Math.min(255, g + 255 * f) | 0},${Math.min(255, b + 255 * f) | 0})`; }
function shade(h, f) { if (!h || h[0] !== '#') return h; const [r, g, b] = hex2rgb(h); return `rgb(${r * (1 - f) | 0},${g * (1 - f) | 0},${b * (1 - f) | 0})`; }
function withA(h, a) { if (!h || h[0] !== '#') return h || '#000'; const [r, g, b] = hex2rgb(h); return `rgba(${r},${g},${b},${a})`; }

function renderCatThumb(canvas, species) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawCat(ctx, canvas.width / 2, canvas.height / 2 + 8, { species, scale: (canvas.width / 90) * 0.92, face: 1, t: 0.6, pose: 'sit', mood: 'happy' });
}

window.CatArt = { drawCat, renderCatThumb, CAT_PALETTES };
