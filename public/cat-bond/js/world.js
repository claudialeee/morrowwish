// world.js — the yard scene: your cats wander & play, plus hide-and-seek with a wild cat.

// Layered pastel storybook garden: blossoms, pond and cottage are behind live
// interactive cats, bushes, buildings and pointer hit targets. No game logic changes.
const YARD_BG = new Image();
YARD_BG.src = 'assets/yard-storybook.svg?v=20261121-cute-garden-1';
let YARD_BG_READY = false;
YARD_BG.onload = () => { YARD_BG_READY = true; };
// draw an image to fully cover (w,h), centered, preserving aspect ratio
function drawCover(ctx, img, w, h) {
  const ir = img.width / img.height, cr = w / h;
  let dw, dh;
  if (cr > ir) { dw = w; dh = w / ir; } else { dh = h; dw = h * ir; }
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

class CatEntity {
  constructor(cat, W, H) {
    this.cat = cat;                 // reference to state cat instance
    this.x = 80 + Math.random() * (W - 160);
    // spawn in the painted meadow (below the horizon), not floating in the sky
    const top=Math.min(H*.56,H-88),bottom=Math.max(top+10,H-72);
    this.y = top + Math.random() * (bottom-top);
    this.W = W; this.H = H;
    this.face = Math.random() < 0.5 ? -1 : 1;
    this.pose = 'idle';
    this.vx = 0; this.vy = 0;
    this.walkVX = 0; this.walkVY = 0; // animated velocity eases into directions
    this.motion = 0; this.stride = this.x * 0.03;
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

    // Curious cats gradually turn and follow you rather than snapping or sliding.
    this.curious = false;
    let desiredVX = this.pose === 'walk' ? this.vx : 0;
    let desiredVY = this.pose === 'walk' ? this.vy : 0;
    if (mouse && mouse.active) {
      const dx = mouse.x - this.x, dy = mouse.y - this.y;
      const dist = Math.hypot(dx,dy);
      if (dist < 165 && ['walk','idle','sit'].includes(this.pose)) {
        this.curious = true;
        if (dist > 55) {
          this.pose = 'walk';
          desiredVX = (dx/dist)*43;
          desiredVY = (dy/dist)*24;
        } else {
          this.pose = 'play';
          desiredVX = desiredVY = 0;
          if (!this.bubble || this.bubble === '❓') this.emote('❗',1);
        }
      }
    }
    // Damped velocity gives a real ease-in/ease-out and curved turns.
    // Clamp dt so background tabs do not make characters jump.
    const step = Math.min(dt,.05);
    const follow = 1-Math.exp(-(this.pose === 'walk' ? 5.3 : 9)*step);
    this.walkVX += (desiredVX-this.walkVX)*follow;
    this.walkVY += (desiredVY-this.walkVY)*follow;
    this.x += this.walkVX*step;
    this.y += this.walkVY*step;

    const leftBound=Math.min(56,this.W*.22),rightBound=this.W-leftBound;
    const groundTop=Math.min(this.H*.54,this.H-88),groundBottom=Math.max(groundTop+20,this.H-72);
    if(this.x<leftBound){this.x=leftBound;this.vx=Math.abs(this.vx);this.walkVX=Math.max(0,this.walkVX);}
    if(this.x>rightBound){this.x=rightBound;this.vx=-Math.abs(this.vx);this.walkVX=Math.min(0,this.walkVX);}
    if(this.y<groundTop){this.y=groundTop;this.vy=Math.abs(this.vy);this.walkVY=Math.max(0,this.walkVY);}
    if(this.y>groundBottom){this.y=groundBottom;this.vy=-Math.abs(this.vy);this.walkVY=Math.min(0,this.walkVY);}
    if(Math.abs(this.walkVX)>5)this.face=this.walkVX<0?-1:1;
    const walkSpeed=Math.hypot(this.walkVX,this.walkVY);
    this.motion+=(Math.min(1,walkSpeed/38)-this.motion)*(1-Math.exp(-8*step));
    this.stride+=step*(2.6+walkSpeed*.11);

  }
  mood() {
    if(this.bubble==='💢'||this.bubble==='😾')return 'sulky';
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
    const atPlay=!!(this._playBuildT>0&&this._playBuilding);
    const sleepy=atPlay&&this._playBuildDef?.pose==='sleep';
    // The CAT itself hops and lifts its forepaws at a real structure.
    // No floating cat heads or limb stickers are substituted.
    const bob=atPlay&&!sleepy?2+Math.sin(this.t*9)*3:0;
    (window.CatMotion?.draw||CatArt.drawCat)(ctx, this.x, this.y-bob, {
      species: sp, scale: depth, face: this.face, t: this.t,
      motion: atPlay&&!sleepy?.98:this.motion,
      stride: atPlay&&!sleepy?this.stride+this.t*4:this.stride,
      pose: atPlay?(sleepy?'sleep':'play'):this.pose,
      mood: atPlay?'happy':this.mood(),
      growth: window.Growth ? Growth.visual(this.cat) : null,
    });
    // name + level tag
    ctx.save();
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    roundTag(ctx, this.x, this.y - 34 * depth, `${State.catName(this.cat)} Lv.${this.cat.level}`);
    ctx.restore();
    // No detached emoji bubbles above moving kittens.
    // Mood is conveyed through ears, eyes, posture and tail, all attached to the cat.
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

// ---- Buildable yard play-structures (庭院游乐设施) ----
// Each entry: id, 中文 name, icon, coin cost, short 中文 desc, the cat
// interaction (pose + emote played when a cat walks over), and a Canvas2D
// vector draw fn in the soft watercolor style of the yard scenery. All art is
// vector (no images); draw(ctx,x,y,s,t) plants its base at (x,y), s≈depth.
const BUILDINGS = [
  {
    id: 'scratcher', name: '猫抓板', icon: '🪵', cost: 60,
    desc: '磨爪解压的小柱子，猫咪路过就想挠两下。',
    pose: 'sit', emote: '🐾', joy: 6,
    draw(ctx, x, y, s, t) {
      ctx.save();
      // contact shadow
      ctx.globalAlpha = 0.14; ctx.fillStyle = '#3a5a30';
      ctx.beginPath(); ctx.ellipse(x, y, 24 * s, 7 * s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      // base board
      ctx.fillStyle = '#caa978';
      roundRectPath(ctx, x - 20 * s, y - 7 * s, 40 * s, 10 * s, 4 * s); ctx.fill();
      // sisal-wrapped post (soft tan with coil lines)
      ctx.fillStyle = '#e4cf9f';
      roundRectPath(ctx, x - 9 * s, y - 52 * s, 18 * s, 46 * s, 5 * s); ctx.fill();
      ctx.strokeStyle = 'rgba(176,146,96,0.5)'; ctx.lineWidth = 1.4 * s;
      for (let i = 1; i < 9; i++) { const yy = y - 6 * s - i * 5 * s; ctx.beginPath(); ctx.moveTo(x - 9 * s, yy); ctx.lineTo(x + 9 * s, yy); ctx.stroke(); }
      // little dangling pom-pom on a string (gentle sway)
      const sway = Math.sin(t * 2) * 3 * s;
      ctx.strokeStyle = '#b5a6cf'; ctx.lineWidth = 1.5 * s;
      ctx.beginPath(); ctx.moveTo(x, y - 52 * s); ctx.lineTo(x + sway, y - 40 * s); ctx.stroke();
      ctx.fillStyle = '#ff9db0';
      ctx.beginPath(); ctx.arc(x + sway, y - 38 * s, 4 * s, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    },
  },
  {
    id: 'cave', name: '猫猫洞', icon: '🏠', cost: 90,
    desc: '圆滚滚的猫窝洞，钻进去就能安心打盹。',
    pose: 'sleep', emote: '💤', joy: 8,
    draw(ctx, x, y, s, t) {
      ctx.save();
      ctx.globalAlpha = 0.14; ctx.fillStyle = '#3a5a30';
      ctx.beginPath(); ctx.ellipse(x, y, 34 * s, 9 * s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      // dome body — layered soft washes
      ctx.fillStyle = '#9fb6d8';
      ctx.beginPath(); ctx.ellipse(x, y - 4 * s, 32 * s, 30 * s, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#b6c8e4';
      ctx.beginPath(); ctx.ellipse(x - 6 * s, y - 10 * s, 20 * s, 18 * s, 0, Math.PI, 0); ctx.fill();
      // sun-caught highlight
      ctx.fillStyle = 'rgba(234,242,255,0.6)';
      ctx.beginPath(); ctx.ellipse(x - 10 * s, y - 20 * s, 8 * s, 6 * s, 0, 0, Math.PI * 2); ctx.fill();
      // dark round entrance
      ctx.fillStyle = '#394a63';
      ctx.beginPath(); ctx.ellipse(x, y - 2 * s, 13 * s, 15 * s, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = 'rgba(20,28,42,0.9)';
      ctx.beginPath(); ctx.ellipse(x, y - 3 * s, 9 * s, 11 * s, 0, Math.PI, 0); ctx.fill();
      // tiny flag on top
      ctx.strokeStyle = '#8a97ad'; ctx.lineWidth = 1.5 * s;
      ctx.beginPath(); ctx.moveTo(x + 16 * s, y - 24 * s); ctx.lineTo(x + 16 * s, y - 34 * s); ctx.stroke();
      ctx.fillStyle = '#ffd36b';
      ctx.beginPath(); ctx.moveTo(x + 16 * s, y - 34 * s); ctx.lineTo(x + 24 * s, y - 31 * s); ctx.lineTo(x + 16 * s, y - 28 * s); ctx.fill();
      ctx.restore();
    },
  },
  {
    id: 'cattree', name: '猫爬架', icon: '🗼', cost: 120,
    desc: '多层猫爬架，登高望远是猫咪最爱的运动。',
    pose: 'play', emote: '😸', joy: 10,
    draw(ctx, x, y, s, t) {
      ctx.save();
      ctx.globalAlpha = 0.14; ctx.fillStyle = '#3a5a30';
      ctx.beginPath(); ctx.ellipse(x, y, 30 * s, 8 * s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      // base
      ctx.fillStyle = '#c9a877';
      roundRectPath(ctx, x - 24 * s, y - 8 * s, 48 * s, 11 * s, 5 * s); ctx.fill();
      // carpet-wrapped trunk
      ctx.fillStyle = '#d9c29a';
      roundRectPath(ctx, x - 7 * s, y - 78 * s, 14 * s, 72 * s, 5 * s); ctx.fill();
      ctx.strokeStyle = 'rgba(176,146,96,0.4)'; ctx.lineWidth = 1.2 * s;
      for (let i = 1; i < 14; i++) { const yy = y - 7 * s - i * 5 * s; ctx.beginPath(); ctx.moveTo(x - 7 * s, yy); ctx.lineTo(x + 7 * s, yy); ctx.stroke(); }
      // two platforms + a cup perch on top
      const plat = (px, py, w) => {
        ctx.fillStyle = '#8fc0a0';
        roundRectPath(ctx, px - w, py - 5 * s, w * 2, 10 * s, 5 * s); ctx.fill();
        ctx.fillStyle = 'rgba(190,220,150,0.5)';
        roundRectPath(ctx, px - w, py - 5 * s, w * 2, 4 * s, 4 * s); ctx.fill();
      };
      plat(x - 2 * s, y - 40 * s, 22 * s);
      plat(x + 2 * s, y - 62 * s, 16 * s);
      // cozy top cup
      ctx.fillStyle = '#ff9db0';
      ctx.beginPath(); ctx.ellipse(x, y - 80 * s, 15 * s, 8 * s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffc2d0';
      ctx.beginPath(); ctx.ellipse(x, y - 82 * s, 11 * s, 5 * s, 0, 0, Math.PI * 2); ctx.fill();
      // dangling toy from lower platform
      const sway = Math.sin(t * 2.2) * 3 * s;
      ctx.strokeStyle = '#b5a6cf'; ctx.lineWidth = 1.4 * s;
      ctx.beginPath(); ctx.moveTo(x + 18 * s, y - 40 * s); ctx.lineTo(x + 18 * s + sway, y - 26 * s); ctx.stroke();
      ctx.fillStyle = '#ffd36b';
      ctx.beginPath(); ctx.arc(x + 18 * s + sway, y - 24 * s, 4 * s, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    },
  },
  {
    id: 'catnip', name: '猫薄荷花坛', icon: '🌿', cost: 80,
    desc: '一小畦猫薄荷，香气让猫咪开心打滚。',
    pose: 'belly', emote: '🎵', joy: 8,
    draw(ctx, x, y, s, t) {
      ctx.save();
      ctx.globalAlpha = 0.14; ctx.fillStyle = '#3a5a30';
      ctx.beginPath(); ctx.ellipse(x, y, 30 * s, 8 * s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      // wooden planter box
      ctx.fillStyle = '#c9a877';
      roundRectPath(ctx, x - 28 * s, y - 16 * s, 56 * s, 18 * s, 5 * s); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      roundRectPath(ctx, x - 28 * s, y - 16 * s, 56 * s, 5 * s, 4 * s); ctx.fill();
      // catnip sprigs swaying softly
      for (let i = 0; i < 7; i++) {
        const sx = x - 22 * s + i * 7 * s;
        const h = (16 + (i % 3) * 5) * s;
        const bend = Math.sin(t * 1.6 + i) * 2.5 * s;
        ctx.strokeStyle = '#6a9f58'; ctx.lineWidth = 2 * s;
        ctx.beginPath(); ctx.moveTo(sx, y - 14 * s); ctx.quadraticCurveTo(sx + bend, y - 14 * s - h * 0.6, sx + bend, y - 14 * s - h); ctx.stroke();
        ctx.fillStyle = i % 2 ? '#7fb268' : '#8fc0a0';
        ctx.beginPath(); ctx.ellipse(sx + bend, y - 14 * s - h, 3.5 * s, 5 * s, 0, 0, Math.PI * 2); ctx.fill();
        if (i % 2) { ctx.fillStyle = '#b59bff'; ctx.beginPath(); ctx.arc(sx + bend, y - 14 * s - h - 3 * s, 2.2 * s, 0, Math.PI * 2); ctx.fill(); }
      }
      ctx.restore();
    },
  },
  {
    id: 'hammock', name: '吊床', icon: '🛖', cost: 100,
    desc: '两根小柱撑起的吊床，午后晒着太阳最惬意。',
    pose: 'sleep', emote: '💤', joy: 9,
    draw(ctx, x, y, s, t) {
      ctx.save();
      ctx.globalAlpha = 0.14; ctx.fillStyle = '#3a5a30';
      ctx.beginPath(); ctx.ellipse(x, y, 36 * s, 8 * s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      const px = 30 * s;        // pole half-span
      // two posts
      ctx.fillStyle = '#caa978';
      roundRectPath(ctx, x - px - 3 * s, y - 40 * s, 6 * s, 40 * s, 3 * s); ctx.fill();
      roundRectPath(ctx, x + px - 3 * s, y - 40 * s, 6 * s, 40 * s, 3 * s); ctx.fill();
      // slung cloth (soft sag that breathes a little)
      const sag = 22 * s + Math.sin(t * 1.4) * 1.5 * s;
      ctx.fillStyle = '#ff9db0';
      ctx.beginPath();
      ctx.moveTo(x - px, y - 38 * s);
      ctx.quadraticCurveTo(x, y - 38 * s + sag, x + px, y - 38 * s);
      ctx.quadraticCurveTo(x, y - 30 * s + sag, x - px, y - 38 * s);
      ctx.fill();
      // stripes along the sling
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1.5 * s;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(x + i * 10 * s, y - 38 * s + Math.abs(i) * 1.5 * s);
        ctx.quadraticCurveTo(x + i * 10 * s, y - 38 * s + sag * 0.8, x + i * 10 * s, y - 34 * s + sag * 0.4);
        ctx.stroke();
      }
      ctx.restore();
    },
  },
];
const BUILDINGS_BY_ID = Object.fromEntries(BUILDINGS.map(b => [b.id, b]));
// Localized facility purpose and real, limited production. Building a toy
// is now a growth choice, not just permanently adding a small emoji prop.
// Only 🪙 coins and 🐠 fish are produced now: the old yarn facility earns coins
// (×10 scale) and the old treats facility earns fish.
const BUILDING_PRODUCTION={
  scratcher:{kind:'coins',base:10,nameEn:'Scratching Post',purposeEn:'Scratch and unwind; earn a few coins while cats play.',name:'金币'},
  cave:{kind:'fish',base:1,nameEn:'Cozy Cat Cave',purposeEn:'A quiet hideaway; collect fish after a visit.',name:'小鱼'},
  cattree:{kind:'coins',base:3,nameEn:'Climbing Tower',purposeEn:'Play high above the garden; earn a little extra income.',name:'金币'},
  catnip:{kind:'fish',base:1,nameEn:'Catnip Garden',purposeEn:'Fresh catnip and happy naps; earn fish.',name:'小鱼'},
  hammock:{kind:'coins',base:2,nameEn:'Sunny Hammock',purposeEn:'A lazy sunny rest; earn coins as cats relax.',name:'金币'}
};
function buildingLevel(b){return Math.max(1,Math.min(3,Math.round(Number(b?.level)||1)));}
function upgradeCost(b){
 const def=BUILDINGS_BY_ID[b?.type];if(!def||buildingLevel(b)>=3)return null;
 return Math.ceil(def.cost*(.65+buildingLevel(b)*.35)/5)*5;
}


function eNotification(game,cat,kind,amount){
 // Once per payout, very short text; do not block the yard canvas.
 const english=window.MorrowwishI18n?.get?.()!=='zh';
 const names=english?{coins:'coins',fish:'fish'}
   :{coins:'金币',fish:'小鱼'};
 game.toast?.((english?'Facility reward +':'设施收获 +')+amount+' '+(names[kind]||kind));
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
    // keep bushes down in the painted meadow (below the horizon) so they never
    // float in the sky or sit on the lake — y from ~58% down to the foreground.
    const bushTop = Math.min(H*.58,H-90), bushBot = Math.max(bushTop+10,H-74);
    for (let i = 0; i < spots; i++) {
      this.bushes.push({
        x: 70 + (W - 140) * (i / (spots - 1)) + (Math.random() * 40 - 20),
        y: bushTop + Math.random() * (bushBot - bushTop),
        r: 24 + Math.random() * 10,
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
  // Rotate/reflow in place, preserving the active hidden cat's bush reference.
  onResize(oldW,oldH,W,H){
    const fx=W/Math.max(1,oldW),fy=H/Math.max(1,oldH);
    const move=(items)=>{for(const v of items||[]){v.x*=fx;v.y*=fy;}};
    move(this.bushes);move(this.butterflies);move(this.clouds);
    move(this.flowers);move(this.petals);move(this.fireflies);
    move(this.lootBubbles);move(this.petParticles);move(this.floatTexts);
    move(State.S.yardBuildings);   // placed structures scale with the canvas like bushes
    if(this.golden){this.golden.x*=fx;this.golden.y*=fy;}
    for(const e of this.entities){
      e.W=W;e.H=H;e.x=Math.min(W-40,Math.max(40,e.x*fx));
      const top=Math.min(H*.54,H-88),bottom=Math.max(top+20,H-72);
      e.y=Math.max(top,Math.min(bottom,e.y*fy));
    }
    for(const b of this.bushes){
      const top=Math.min(H*.58,H-90),bottom=Math.max(top+10,H-74);
      b.y=Math.max(top,Math.min(bottom,b.y));
    }
    for(const b of (State.S.yardBuildings||[])){
      const top=Math.min(H*.6,H-90),bottom=Math.max(top+10,H-70);
      b.x=Math.min(W-40,Math.max(40,b.x));
      b.y=Math.max(top,Math.min(bottom,b.y));
    }
    // Portrait/landscape rotation changes how many cats fit in the yard.
    this.rebuild();
  }
  // Display a small, species-diverse visiting group, not all captured cats.
  // ALL cat instances remain available in the roster, workshop and save.
  yardCapacity(){
    const {W,H}=this.game;
    return H>W*1.1||W<=480?4:6;
  }
  rebuild() {
    const {W,H}=this.game;
    if(!this.bushes||this.bushes.length===0)this.buildScenery();
    const roster=State.S.cats||[];
    const representatives=new Map();
    // Recently captured breed first; one portrait per species in the yard.
    for(let i=roster.length-1;i>=0;i--){
      const cat=roster[i];
      if(!representatives.has(cat.species))representatives.set(cat.species,cat);
    }
    this.uniqueBreeds=representatives.size;
    this.totalCats=roster.length;
    this.capacity=this.yardCapacity();
    const candidates=[...representatives.values()];
    this.pageCount=Math.max(1,Math.ceil(candidates.length/this.capacity));
    this.page=Math.min(this.page||0,this.pageCount-1);
    const selection=candidates.slice(this.page*this.capacity,(this.page+1)*this.capacity);
    this.entities=selection.map(cat=>new CatEntity(cat,W,H));
    // Place resident visitors in two roomy rows (one on short landscape
    // screens) so first render never forms a pile of overlapping portraits.
    const rows=H<435?1:2;
    const cols=Math.max(1,Math.ceil(selection.length/rows));
    const top=Math.min(H*.54,H-88),bottom=Math.max(top+20,H-72);
    const minX=Math.max(40,Math.min(88,W*.14));
    const usableX=Math.max(0,W-minX*2);
    this.entities.forEach((entity,i)=>{
      const col=i%cols,row=Math.floor(i/cols);
      const rowCount=Math.min(cols,selection.length-row*cols);
      entity.x=minX+usableX*(col+1)/(rowCount+1);
      entity.y=top+(bottom-top)*(rows===1?.52:(row===0?.28:.72));
      entity.face=col%2===0?1:-1;
    });
    this.refreshYardSwitch();
  }
  nextPage(){
    if(this.pageCount<=1)return;
    this.page=(this.page+1)%this.pageCount;
    this.rebuild();
    window.arcadeMetric?.('bond_yard_page',{page:this.page+1,pages:this.pageCount});
  }
  refreshYardSwitch(){
    const button=document.getElementById('yard-cat-switch');
    if(!button)return;
    const total=this.totalCats||0,shown=this.entities.length;
    const extra=total>shown;
    button.hidden=!extra||this.game.scene!=='yard';
    if(button.hidden)return;
    const en=window.MorrowwishI18n?.get?.()!=='zh';
    const rotate=this.pageCount>1;
    const text=en
      ?('🐈 '+shown+'/'+total+' · '+(rotate?'Next visitors '+(this.page+1)+'/'+this.pageCount:'Open roster'))
      :('🐈 庭院 '+shown+'/'+total+' · '+(rotate?'换一批 '+(this.page+1)+'/'+this.pageCount:'查看猫猫'));
    button.textContent=text;
    button.title=en?'Only one cat per breed visits the yard; all cats remain in your roster.'
      :'庭院每个品种只展示一只，其余猫咪都保留在「我的猫猫」';
  }
  hillBand(ctx, W, baseY, amp, freq) {
    ctx.beginPath(); ctx.moveTo(0, baseY);
    for (let x = 0; x <= W; x += 16) ctx.lineTo(x, baseY - Math.abs(Math.sin(x / W * Math.PI * freq * 3)) * amp);
    ctx.lineTo(W, baseY + 300); ctx.lineTo(0, baseY + 300); ctx.closePath(); ctx.fill();
  }
  startHideAndSeek(spot) {
    if (this.hide) return false;
    const first=(State.S.catchCount||0)===0;
    // A Golden Paw medal is a permanent exploration upgrade. Three unique
    // S-ranked breeds add one modest rarity-weight tier, even without lures.
    const masteryLuck=this.game.masteryStatus?.().luckBonus||0;
    const luck=Math.min(0.9,(State.S.luckLure||0)*0.25+masteryLuck);
    const beginnerPool=GameData.SPECIES.filter(sp=>sp.rarity==='N' && sp.id!==State.S.cats[0]?.species);
    let sp=first&&beginnerPool.length
      ? beginnerPool[Math.floor(Math.random()*beginnerPool.length)]
      : GameData.rollSpecies(luck);
    // Onboarding: the first three captures should introduce variety.
    // Late game: three repeated sightings unlock an unseen common clue.
    // Do NOT tamper with any R/SR/SSR roll; rarity odds remain unchanged.
    const unseenCommon=beginnerPool.filter(cat=>!State.S.dex[cat.id]);
    const repeatedCommon=sp.rarity==='N'&&!!State.S.dex[sp.id];
    const streak=State.S.repeatSightings||0;
    if(!first&&repeatedCommon&&unseenCommon.length&&
      (State.S.catchCount<3||streak>=3)){
      sp=unseenCommon[Math.floor(Math.random()*unseenCommon.length)];
    }
    State.S.repeatSightings=State.S.dex[sp.id]?(streak+1):0;
    if(!first&&State.S.luckLure>0)State.S.luckLure--;
    spot=spot||(first?this.bushes[Math.floor(this.bushes.length/2)]
      :this.bushes[Math.floor(Math.random()*this.bushes.length)]);
    const roster=State.S.cats||[];
    const preferred=(State.S.battlePrefs?.teamUids||[])
      .map(uid=>roster.find(c=>c.uid===uid)).filter(Boolean);
    const level=window.Battle?.CaptureBattle?.previewWildLevel
      ?Battle.CaptureBattle.previewWildLevel(sp,'yard',preferred.length?preferred:roster.slice(0,5)):1;
    this.hide={
      species:sp,spot,level,found:false,revealT:0,
      tutorial:first,peekT:first?999:0.4+Math.random()*1.2,peeking:true,
    };
    window.arcadeMetric?.('bond_wild_spawned',{rarity:sp.rarity,newBreed:!State.S.dex[sp.id]});
    if(!first)State.save();
    window.MorrowwishAudio?.effect?.('rustle');
    const sighting=sp.rarity==='SSR'?'👑 传说气息！草丛里出现了极罕见的猫！'
      :sp.rarity==='SR'?'🌟 不寻常的闪光！有史诗猫咪藏在草丛里！'
      :sp.rarity==='R'?'✨ 草丛里传来稀有猫咪的脚步声！'
      :'🌿 草丛里有只野猫在探头…点它！';
    this.game.toast(sighting);
    return true;
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
    // A cat heading to a structure steers itself first, then runs normal motion.
    for(const e of this.entities){
      if(e._buildTarget)this.stepBuildTarget(e,dt);
      // Cursor-following must never steal a cat from the structure it is
      // walking toward or playing at. Regular petting still works normally.
      e.update(dt,(e._buildTarget||e._playBuildT>0)?null:mouse);
    }
    this.updateBuildingPlay(dt);
    const duo=window.CatRelations?.chosen?.()||[];
    if(duo.length===2){
      const a=this.entities.find(e=>e.cat.uid===duo[0].uid);
      const b=this.entities.find(e=>e.cat.uid===duo[1].uid);
      if(a&&b){
        const sulky=CatRelations.mood(duo[0],duo[1])==='sulky';
        const dist=Math.hypot(a.x-b.x,a.y-b.y);
        if(this.game.t>(this._nextDuoEmote||0)){
          this._nextDuoEmote=this.game.t+10+Math.random()*9;
          // Together they chase, apart they turn and walk away; no floating icons.
          const dx=a.x-b.x,dy=a.y-b.y,den=Math.max(1,dist);
          const dir=sulky?-1:1;
          b.pose='walk';b.timer=sulky?1.4:2.5;
          b.vx=dir*(dx/den)*62;b.vy=dir*(dy/den)*35;
          a.pose=sulky?'idle':'walk';a.timer=sulky?1.5:1.4;
          if(!sulky&&dist>60){a.vx=-(dx/den)*26;a.vy=-(dy/den)*15;}
          b.emote(sulky?'😾':'💞',2.1);
        }
        if(!sulky&&dist>100&&dist<260&&b.pose==='walk'){
          b.vx+=(a.x-b.x)/dist*15*dt;b.vy+=(a.y-b.y)/dist*9*dt;
        }
      }
    }
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

    // --- hand-painted watercolor backdrop (sky/hills/lake/meadow/tree baked in) ---
    if (YARD_BG_READY) {
      drawCover(ctx, YARD_BG, W, H);
    } else {
      // fallback: procedural soft dawn until the painting loads
      const sky = ctx.createLinearGradient(0, 0, 0, horizon);
      sky.addColorStop(0, '#aee0f5'); sky.addColorStop(0.5, '#d9ecf2'); sky.addColorStop(1, '#fbf0d8');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, horizon + 10);
      const lawn = ctx.createLinearGradient(0, horizon, 0, H);
      lawn.addColorStop(0, '#96c464'); lawn.addColorStop(1, '#6fae4f');
      ctx.fillStyle = lawn; ctx.fillRect(0, horizon, W, H - horizon);
    }

    // Illustrated edge flowerbeds, light pools and meadow details.
    if(window.CatBondScenery)CatBondScenery.accentYard(ctx,W,H,t);

    // --- drifting clouds (gentle parallax over the painted sky) ---
    for (const c of this.clouds) {
      c.x += c.spd; if (c.x > W + 80) c.x = -80;
      ctx.save(); ctx.globalAlpha = 0.5; ctx.fillStyle = 'rgba(255,255,255,0.85)';
      for (const [dx, dy, r] of [[0, 0, 18], [18, 4, 14], [-16, 4, 13], [4, -8, 13]])
        { ctx.beginPath(); ctx.arc(c.x + dx * c.s, c.y + dy, r * c.s, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }

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

    // draw bushes + placed buildings + cats, all y-sorted so cats can stand in
    // front of / behind their play-structures
    const drawables = [];
    for (const b of this.bushes) drawables.push({ y: b.y, kind: 'bush', ref: b });
    for (const b of (State.S.yardBuildings || [])) drawables.push({ y: b.y, kind: 'building', ref: b });
    // While visibly using a structure, render the whole kitten in front of
    // its object (not hidden behind the post it is scratching).
    for(const e of this.entities)drawables.push({
      y:e.y+(e._playBuilding&&e._playBuildT>0?20:0),kind:'cat',ref:e
    });
    if (this.hide && !this.hide.found) drawables.push({ y: this.hide.spot.y + 0.1, kind: 'hide', ref: this.hide });
    drawables.sort((a, b) => a.y - b.y);
    for (const d of drawables) {
      if (d.kind === 'bush') this.drawBush(ctx, d.ref);
      else if (d.kind === 'building') this.drawBuilding(ctx, d.ref);
      else if (d.kind === 'cat') d.ref.draw(ctx);
      else if (d.kind === 'hide') this.drawHide(ctx, d.ref);
    }

    // Preview is drawn on the actual yard canvas, not as a separate menu image.
    if(this.placement)this.drawPlacement(ctx);
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

    // --- 金运喵 golden cat (rare rush event) ---
    if (this.golden) {
      const g = this.golden;
      ctx.save();
      // golden aura
      const ga = ctx.createRadialGradient(g.x, g.y, 4, g.x, g.y, 42);
      ga.addColorStop(0, 'rgba(255,215,100,0.5)'); ga.addColorStop(1, 'rgba(255,215,100,0)');
      ctx.fillStyle = ga; ctx.beginPath(); ctx.arc(g.x, g.y, 42, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      (window.CatMotion?.draw||CatArt.drawCat)(ctx, g.x, g.y, { palette: 'flame', pattern: 'solid', eyeColor: '#fff6c0', scale: 1.0, face: g.vx < 0 ? -1 : 1, t: g.t, pose: 'walk', mood: 'happy', growth: { stage: 2, scale: 1.1, aura: '#ffd36b', sparkle: true, gem: true, gemColor: '#ffd36b' } });
      ctx.save(); ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#ffd36b';
      ctx.fillText('🌟金运喵·点我!', g.x, g.y - 44);
      ctx.restore();
    }

    // --- rising float texts (+N, 连击) ---
    if (this.floatTexts) for (const f of this.floatTexts) {
      ctx.save(); ctx.globalAlpha = Math.max(0, 1 - f.t);
      ctx.fillStyle = f.color; ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center';
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.strokeText(f.text, f.x, f.y); ctx.fillText(f.text, f.x, f.y);
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

    // --- soft warm vignette for depth/polish (keeps the watercolor palette warm) ---
    const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.48, W / 2, H / 2, Math.max(W, H) * 0.78);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(90,60,30,0.22)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  }
  drawBush(ctx, b) {
    ctx.save();
    // soft contact shadow
    ctx.globalAlpha = 0.14; ctx.fillStyle = '#3a5a30';
    ctx.beginPath(); ctx.ellipse(b.x, b.y + b.r * 0.5, b.r * 0.95, b.r * 0.28, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    // soft watercolor foliage — muted greens that sit inside the painting's palette,
    // layered low-alpha clumps so the edges read as soft wash, not hard circles.
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = '#6a9f58';
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(b.x + Math.cos(a) * b.r * 0.5, b.y + Math.sin(a) * b.r * 0.28, b.r * 0.68, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#7fb268';
    ctx.beginPath(); ctx.arc(b.x - b.r * 0.2, b.y - 4, b.r * 0.66, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(b.x + b.r * 0.35, b.y - 2, b.r * 0.5, 0, Math.PI * 2); ctx.fill();
    // soft top highlight (sun-caught leaves)
    ctx.fillStyle = 'rgba(190,220,150,0.55)';
    ctx.beginPath(); ctx.arc(b.x - b.r * 0.28, b.y - b.r * 0.38, b.r * 0.32, 0, Math.PI * 2); ctx.fill();
    // a few tiny pale blossoms, soft not neon
    ctx.globalAlpha = 0.85; ctx.fillStyle = '#fbf4e6';
    ctx.beginPath(); ctx.arc(b.x - b.r * 0.4, b.y + 2, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(b.x + b.r * 0.42, b.y - 6, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffdca0';
    ctx.beginPath(); ctx.arc(b.x + b.r * 0.1, b.y + 4, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  // Render one placed play-structure. Depth scales with y like the cats/bushes.
  drawBuilding(ctx, b) {
    const def = BUILDINGS_BY_ID[b.type];
    if (!def) return;
    const depth = 0.8 + (b.y / this.game.H) * 0.5;
    def.draw(ctx, b.x, b.y, depth, this.game.t);
    const lvl=buildingLevel(b);
    const playing=this.entities.filter(e=>e._playBuilding===b&&e._playBuildT>0);
    if(playing.length){
      // Visible, attached paw-to-facility action. Paw sparks are emitted
      // at the cat's position and move toward the structure it is using.
      const tick=this.game.t,shine=.55+.45*Math.sin(tick*6);
      ctx.save();ctx.strokeStyle='#ffe6a2';ctx.lineWidth=2.4;
      ctx.shadowColor='#f6d9a5';ctx.shadowBlur=11;
      for(const e of playing){
        const pawX=e.x+e.face*13,pawY=e.y-18*depth;
        ctx.globalAlpha=.5+shine*.48;
        for(let i=0;i<3;i++){
          const a=tick*2.7+i*2.09,px=pawX+Math.cos(a)*13,py=pawY+Math.sin(a)*9;
          ctx.beginPath();ctx.moveTo(px-4,py);ctx.lineTo(px+4,py);
          ctx.moveTo(px,py-4);ctx.lineTo(px,py+4);ctx.stroke();
        }
        ctx.globalAlpha=.78;
        ctx.beginPath();ctx.ellipse(b.x,b.y-26*depth,23*depth,9*depth,0,0,Math.PI*2);ctx.stroke();
      }
      ctx.restore();
    }
    if(lvl>1){
      ctx.save();ctx.fillStyle='#fff5d9eb';ctx.strokeStyle='#ba965f';ctx.lineWidth=1.1;
      ctx.beginPath();ctx.roundRect(b.x-15,b.y-96*depth,30,18,7);ctx.fill();ctx.stroke();
      ctx.fillStyle='#785931';ctx.font='800 11px system-ui';ctx.textAlign='center';
      ctx.fillText('Lv.'+lvl,b.x,b.y-83*depth);ctx.restore();
    }
  }
  drawHide(ctx, hide) {
    // First find is a highlighted target; later encounters keep the mystery.
    if(!hide.tutorial){
      const rarity=hide.species.rarity;
      const hue=rarity==='SSR'?'#ffbe5e':rarity==='SR'?'#bd92fa':rarity==='R'?'#ffd38f':'#e5fbdd';
      const pulse=Math.sin(this.game.t*4.5)*6;
      ctx.save();ctx.fillStyle='rgba(255,249,222,.34)';
      ctx.beginPath();ctx.arc(hide.spot.x,hide.spot.y,49+pulse,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=hue;ctx.lineWidth=4.5;ctx.shadowColor=hue;ctx.shadowBlur=17;
      ctx.beginPath();ctx.arc(hide.spot.x,hide.spot.y,44+pulse,0,Math.PI*2);ctx.stroke();
      ctx.shadowBlur=0;
      ctx.fillStyle='#fff9e4';ctx.beginPath();
      ctx.roundRect(hide.spot.x-45,hide.spot.y-79,90,28,12);ctx.fill();
      ctx.font='800 12px system-ui';ctx.fillStyle='#40553d';ctx.textAlign='center';
      ctx.fillText('Lv.'+(hide.level||1)+' · '+hide.species.rarity,
        hide.spot.x,hide.spot.y-61);
      ctx.restore();
    }
    if(hide.tutorial){
      const pulse=Math.sin(this.game.t*5)*4;
      ctx.save();
      ctx.strokeStyle='#fff9d7';ctx.lineWidth=5;
      ctx.beginPath();ctx.arc(hide.spot.x,hide.spot.y,40+pulse,0,Math.PI*2);ctx.stroke();
      ctx.strokeStyle='#dba85e';ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(hide.spot.x,hide.spot.y,49+pulse,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle='#fff8e8';ctx.beginPath();ctx.arc(hide.spot.x,hide.spot.y-55,17,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#84624d';ctx.font='bold 20px system-ui';ctx.textAlign='center';
      ctx.fillText('↓',hide.spot.x,hide.spot.y-47);
      ctx.font='800 12px system-ui';
      ctx.fillStyle='#40553d';
      ctx.fillText('Lv.'+(hide.level||1)+' · '+hide.species.rarity,
        hide.spot.x,hide.spot.y-83);
      ctx.restore();
    }
    // The whole kitten creeps out of the bush, rather than disembodied
    // ears or a floating cat-head sticker. The player can still tap the bush.
    const peeking=hide.peeking||hide.tutorial;
    const face=Math.sin(this.game.t*1.2)>=0?1:-1;
    const offset=peeking?21:8;
    (window.CatMotion?.draw||CatArt.drawCat)(ctx,hide.spot.x+face*offset,hide.spot.y+6,{
      species:hide.species,scale:peeking?.78:.55,face,t:this.game.t,
      pose:peeking?'walk':'idle',motion:peeking?.75:0,mood:'alert'
    });
  }
  // Invite an actual visible kitten to a specific facility immediately.
  inviteCatToBuilding(b){
    if(!(State.S.yardBuildings||[]).includes(b)||!this.entities?.length)return false;
    const available=this.entities.filter(e=>!(e._playBuildT>0));
    if(!available.length)return false;
    const nearest=available.sort((a,c)=>
      Math.hypot(a.x-b.x,a.y-b.y)-Math.hypot(c.x-b.x,c.y-b.y))[0];
    nearest._buildTarget=b;nearest._playBuildT=0;
    nearest.setPose('walk',1.4);
    nearest.emote('🐾',1.6);
    return true;
  }
  // ---- resident cats visit their play-structures and PLAY ----
  // Cheap, subtle pathing: on a slow timer, send one idle cat toward a nearby
  // structure. When it arrives, it strikes the structure's pose + emote and its
  // joy/mood nudges upward. Reuses the normal CatEntity motion/behaviour timers.
  updateBuildingPlay(dt) {
    const builds = State.S.yardBuildings || [];
    if (!builds.length || !this.entities.length) return;
    // advance any in-progress "playing at a structure" timers first
    for (const e of this.entities) {
      if (e._playBuildT > 0) {
        e._playBuildT -= dt;
        // steady, gentle joy gain while playing (capped)
        const def = e._playBuildDef;
        if (def) e.cat.joy = Math.min(100, e.cat.joy +
          def.joy*(1+.30*(buildingLevel(e._playBuilding)-1))*dt*.5);
        if (e._playBuildT <= 0) { e._playBuildDef = null; }
      }
    }
    this._buildScan = (this._buildScan == null ? 2 : this._buildScan) - dt;
    if (this._buildScan > 0) return;
    this._buildScan = 4 + Math.random() * 4;   // next look ~4-8s; don't thrash pathing
    // pick an idle, not-already-busy cat and a free-ish structure to visit
    const idle = this.entities.filter(e => !(e._playBuildT > 0) && !e._buildTarget &&
      ['idle', 'sit', 'walk', 'loaf'].includes(e.pose));
    if (!idle.length) return;
    // Prefer the nearest idle cat and the newest available structure so a
    // freshly placed building produces an observable visit without waiting.
    const b = this._newBuildToVisit && builds.includes(this._newBuildToVisit)
      ? this._newBuildToVisit : builds[Math.floor(Math.random()*builds.length)];
    this._newBuildToVisit=null;
    const cat=idle.sort((a,b2)=>Math.hypot(a.x-b.x,a.y-b.y)-Math.hypot(b2.x-b.x,b2.y-b.y))[0];
    this.inviteCatToBuilding(b);
  }
  // called from each cat's effective motion: nudge a cat toward its chosen
  // structure, then trigger play on arrival. Invoked from YardScene.update via
  // the per-cat hook below (kept here so all building logic lives together).
  stepBuildTarget(e, dt) {
    const b = e._buildTarget; if (!b) return;
    const def = BUILDINGS_BY_ID[b.type];
    const dx = b.x - e.x, dy = (b.y + 16) - e.y, dist = Math.hypot(dx, dy);
    if (dist > 20) {
      e.pose = 'walk'; e.timer = 1;
      e.vx = (dx / dist) * 34; e.vy = (dy / dist) * 20;
    } else {
      // arrived: play!
      e.vx = e.vy = 0;
      e.setPose(def?.pose==='sleep'?'sleep':'play', 3.0 + Math.random() * 1.2);
      e.emote(def ? def.emote : '🐾', 2.2);
      e.cat.joy = Math.min(100,e.cat.joy+
        (def?def.joy*(1+.35*(buildingLevel(b)-1)):5));
      e._playBuildT=e.timer;e._playBuildMax=e.timer;e._playBuildDef=def;e._playBuilding=b;
      e._buildTarget=null;
      this.rewardBuildingVisit(e.cat,b,def);
      this.spawnFloat(b.x,b.y-66,
        window.MorrowwishI18n?.get?.()==='zh'
          ?State.catName(e.cat)+' 在玩 '+(def?.name||'设施')+'！'
          :State.catName(e.cat)+' is playing!', '#fff5cd');
    }
  }
  // Cat visits now have real income and relationship consequences, but a
  // per-structure payout timer prevents AFK coin farming or save bloating.
  rewardBuildingVisit(cat,b,def){
    const now=Date.now(),up=BUILDING_PRODUCTION[b.type];
    if(!up)return;
    const level=buildingLevel(b);
    const lastUid=b.lastVisitorUid;
    if(lastUid&&lastUid!==cat.uid&&now-(b.lastVisitorAt||0)<90000&&
       now-(b.lastBondAt||0)>75000){
      const prev=State.S.cats.find(c=>c.uid===lastUid);
      if(prev&&window.CatRelations){
        CatRelations.grow(prev,cat,level>=3?2:1);
        b.lastBondAt=now;
        this.game.toast(window.MorrowwishI18n?.get?.()==='zh'
          ?'💞 '+State.catName(prev)+' 和 '+State.catName(cat)+' 一起玩，默契提升！'
          :State.catName(prev)+' & '+State.catName(cat)+' played together! Trust grew.');
      }
    }
    b.lastVisitorUid=cat.uid;b.lastVisitorAt=now;
    const interval=Math.max(12000,38000-level*6500);
    if(now-(b.lastRewardAt||0)<interval)return;
    b.lastRewardAt=now;
    const n=up.base*level;
    // Yard facilities only pay 🪙 coins or 🐠 fish now (legacy yarn→coins, treats→fish).
    if(up.kind==='coins'||up.kind==='yarn')State.S.coins=(State.S.coins||0)+n;
    else if(up.kind==='fish'||up.kind==='treats')State.S.fish=(State.S.fish||0)+n;
    State.save();
    this.game.refreshHUD?.();
    eNotification(this.game,cat,up.kind,n);
    window.arcadeMetric?.('bond_yard_production',{type:b.type,kind:up.kind,level,amount:n});
  }
  // Upgrade an existing placed facility; old saves silently start at level 1.
  upgradeStructure(index){
    const b=(State.S.yardBuildings||[])[index];
    const cost=upgradeCost(b);if(!b||cost===null)return {ok:false,msg:'Max level'};
    if((State.S.coins||0)<cost)return {ok:false,msg:'Not enough coins'};
    State.S.coins-=cost;b.level=buildingLevel(b)+1;
    b.upgradeSpend=(b.upgradeSpend||0)+cost;
    State.save();
    window.arcadeMetric?.('bond_yard_upgrade',{type:b.type,level:b.level,cost});
    return {ok:true,level:b.level,cost};
  }
  // Find a free yard spot for a new structure (spread out, below the horizon,
  // away from existing buildings/bushes). Returns {x,y} in current canvas space.
  freeBuildingSpot() {
    const { W, H } = this.game;
    const top = Math.min(H * 0.6, H - 90), bot = Math.max(top + 10, H - 70);
    const builds = State.S.yardBuildings || [];
    let best = null, bestGap = -1;
    for (let i = 0; i < 24; i++) {
      const x = 70 + Math.random() * Math.max(1, W - 140);
      const y = top + Math.random() * (bot - top);
      let gap = Infinity;
      for (const o of builds) gap = Math.min(gap, Math.hypot(o.x - x, o.y - y));
      for (const o of this.bushes) gap = Math.min(gap, Math.hypot(o.x - x, o.y - y) * 0.8);
      if (gap > bestGap) { bestGap = gap; best = { x, y }; }
      if (gap > 72) break;   // good enough
    }
    return best || { x: W / 2, y: (top + bot) / 2 };
  }
  // Physical, player-controlled placement. Nothing is charged before
  // confirm. Bounds and overlap are the same on phone, desktop and resize.
  buildingSpotValid(x,y) {
    const {W,H}=this.game;
    const top=Math.min(H*.6,H-90),bottom=Math.max(top+10,H-70);
    const side=Math.min(56,Math.max(30,W*.10));
    if(!Number.isFinite(x)||!Number.isFinite(y)||
        x<side||x>W-side||y<top||y>bottom)return false;
    if((State.S.yardBuildings||[]).some(b=>Math.hypot((b.x-x)*1.0,(b.y-y)*1.6)<57))return false;
    if(this.bushes.some(b=>Math.hypot((b.x-x)*1.0,(b.y-y)*1.6)<32))return false;
    return true;
  }
  beginPlacement(type){
    const def=BUILDINGS_BY_ID[type];
    if(!def||(State.S.coins||0)<def.cost)return false;
    const spot=this.freeBuildingSpot();
    this.placement={type,x:spot.x,y:spot.y,valid:false};
    this.movePlacement(spot.x,spot.y);
    return true;
  }
  movePlacement(x,y){
    if(!this.placement)return false;
    const {W,H}=this.game;
    const top=Math.min(H*.6,H-90),bottom=Math.max(top+10,H-70);
    this.placement.x=Math.max(0,Math.min(W,x));
    this.placement.y=Math.max(top,Math.min(bottom,y));
    this.placement.valid=this.buildingSpotValid(this.placement.x,this.placement.y);
    return this.placement.valid;
  }
  cancelPlacement(){this.placement=null;}
  confirmPlacement(){
    const p=this.placement;
    if(!p||!p.valid)return false;
    const success=this.buildStructure(p.type,{x:p.x,y:p.y});
    if(success)this.placement=null;
    return success;
  }
  drawPlacement(ctx){
    const p=this.placement,def=BUILDINGS_BY_ID[p?.type];
    if(!p||!def)return;
    ctx.save();
    ctx.strokeStyle=p.valid?'rgba(137,213,163,.78)':'rgba(239,128,133,.76)';
    ctx.fillStyle=p.valid?'rgba(139,230,160,.18)':'rgba(255,132,139,.17)';
    const cell=Math.max(26,Math.min(38,this.game.W/12));
    const X=Math.floor(p.x/cell)*cell,Y=Math.floor(p.y/cell)*cell;
    ctx.lineWidth=2;ctx.setLineDash([6,5]);
    for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){
      ctx.fillRect(X+a*cell,Y+b*cell,cell,cell);
      ctx.strokeRect(X+a*cell,Y+b*cell,cell,cell);
    }
    ctx.setLineDash([]);
    ctx.globalAlpha=.86;
    def.draw(ctx,p.x,p.y,.8+(p.y/this.game.H)*.5,this.game.t);
    ctx.globalAlpha=1;
    ctx.fillStyle=p.valid?'#f5ffed':'#fff2ee';
    ctx.strokeStyle=p.valid?'#3a826a':'#ae535d';ctx.lineWidth=2;
    ctx.beginPath();ctx.roundRect(p.x-40,p.y-106,80,24,10);ctx.fill();ctx.stroke();
    ctx.font='800 12px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#365943';
    ctx.fillText(p.valid?'✓ 可建造':'× 有遮挡',p.x,p.y-94);
    ctx.restore();
  }
  buildStructure(type,spot=null){
    const def=BUILDINGS_BY_ID[type];if(!def||(State.S.coins||0)<def.cost)return false;
    const chosen=spot||this.freeBuildingSpot();
    if(!this.buildingSpotValid(chosen.x,chosen.y))return false;
    State.S.coins-=def.cost;
    const b={type,x:chosen.x,y:chosen.y,level:1,lastRewardAt:0};
    (State.S.yardBuildings=State.S.yardBuildings||[]).push(b);
    this._newBuildToVisit=b;this._buildScan=.12;
    this.inviteCatToBuilding(b);
    // Return the nearest available cat to this facility quickly, instead of
    // forcing a several-second random wait.
    State.save();
    window.arcadeMetric?.('bond_yard_build',{type,cost:def.cost,manual:!!spot});
    return true;
  }
  // Remove a placed structure by index, refunding half its cost.
  removeStructure(index) {
    const builds = State.S.yardBuildings || [];
    const b = builds[index]; if (!b) return 0;
    const def = BUILDINGS_BY_ID[b.type];
    const refund=def?Math.floor((def.cost+(b.upgradeSpend||0)*.5)/2):0;
    builds.splice(index, 1);
    for (const e of this.entities) {
      if(e._buildTarget===b)e._buildTarget=null;
      if(e._playBuilding===b){e._playBuilding=null;e._playBuildT=0;}
    }
    State.S.coins = (State.S.coins || 0) + refund;
    State.save();
    window.arcadeMetric?.('bond_yard_remove', { type: b.type, refund });
    return refund;
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
    // rising float texts (+N, 连击)
    if (this.floatTexts) { for (const f of this.floatTexts) { f.t += dt; f.y -= 34 * dt; } this.floatTexts = this.floatTexts.filter(f => f.t < 1.1); }
    // 金运喵 golden-cat: rare roaming rush event (variable schedule, ~every 4-7 min)
    this._goldCd = (this._goldCd == null) ? 60 + Math.random() * 120 : this._goldCd - dt;
    if (!this.golden && this._goldCd <= 0 && this.entities.length) {
      this._goldCd = 240 + Math.random() * 180;
      const { W, H } = this.game;
      this.golden = { x: -40, y: H * 0.45 + Math.random() * (H * 0.3), t: 0, life: 40, dir: 1, vx: 40 };
    }
    if (this.golden) {
      const g = this.golden; g.t += dt; g.life -= dt;
      g.x += g.vx * dt; g.y += Math.sin(g.t * 2) * 0.4;
      if (g.x > this.game.W + 40 || g.x < -40 || g.life <= 0) this.golden = null;
    }
  }
  spawnFloat(x, y, text, color) { if (!this.floatTexts) this.floatTexts = []; this.floatTexts.push({ x, y, text, color: color || '#fff', t: 0 }); }
  collectGolden() {
    if (!this.golden) return;
    const gx = this.golden.x, gy = this.golden.y;
    this.golden = null;
    this.spawnFloat(gx, gy - 10, '🌟 双倍产出!', '#ffd36b');
    for (let k = 0; k < 24; k++) this.petParticles.push({ x: gx, y: gy, vx: Math.random() * 180 - 90, vy: -60 - Math.random() * 90, life: 1.1, ch: Math.random() < 0.6 ? '🪙' : '✨', color: '#ffd36b', size: 13 + Math.random() * 8 });
  }
  handleTap(px, py) {
    // golden cat first (rare, high value)
    if (this.golden && Math.hypot(px - this.golden.x, py - this.golden.y) < 44) return { type: 'golden' };
    // 1) tap an idle loot bubble to collect it (biggest AFK payoff on the main screen)
    if (this.lootBubbles) {
      for (let i = this.lootBubbles.length - 1; i >= 0; i--) {
        const b = this.lootBubbles[i];
        if (Math.hypot(px - b.x, py - b.y) < 26) { return { type: 'loot', bubble: b, idx: i }; }
      }
    }
    if (this.hide && !this.hide.found) {
      const d = Math.hypot(px - this.hide.spot.x, py - this.hide.spot.y);
      if (d < 58) { return { type: 'hide' }; }
    }
    // topmost cat (largest y first)
    const sorted = [...this.entities].sort((a, b) => b.y - a.y);
    for (const e of sorted) { if (e.hit(px, py)) return { type: 'cat', entity: e }; }
    // Tapping the structure itself directly invites a kitten to play.
    const buildings=[...(State.S.yardBuildings||[])].sort((a,b)=>b.y-a.y);
    for(const b of buildings){
      if(Math.abs(px-b.x)<39 && py<b.y+16 && py>b.y-75)return {type:'building',building:b};
    }
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

window.World = { YardScene, CatEntity, BUILDINGS, BUILDINGS_BY_ID, BUILDING_PRODUCTION, buildingLevel, upgradeCost };
