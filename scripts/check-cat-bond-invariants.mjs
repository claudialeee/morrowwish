/* Invariant-based combat tests for Cat Bond (public/cat-bond/js/battle.js).
 *
 * These assert PROPERTIES THAT MUST ALWAYS HOLD, not specific scripted outcomes —
 * the kind of test that catches whole CLASSES of regressions (a stuck ward, a lazy
 * gap-closer that never commits, a status that never expires) instead of one case.
 * Each invariant below corresponds to a real player-reported bug:
 *   INV-1  every timed ward (shield/protect/reflect) on EITHER side reaches 0 after
 *          its duration — enemy barriers must not stick on forever.
 *   INV-2  a dash/pounce/melee cat with a ready gap-closer and a reachable target
 *          actually CLOSES and deals damage within a few seconds (no "waits nearby").
 *   INV-3  no timer runs negative; no HP exceeds maxhp; knead stacks stay in [0,4].
 *   INV-4  a 15s auto-battle never throws and never leaves a live cat permanently
 *          root-locked with no backing cast/beam (the "卡在原地" freeze).
 * Boot scaffold mirrors scripts/check-cat-bond-ai.mjs (known-good fake DOM + vm). */
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const DIR = 'public/cat-bond/';
const ORDER = ['vfx','catart','data','running-cats','skills','growth','state','raising','painted-regions','world','worldmap','battle','ui','game','main'];

// ---- minimal DOM (mirrors scripts/check-cat-bond.mjs) ----
const listeners = {};
const nodes = new Map();
const nop = () => {};
function classList() { const set = new Set(); return { add: c => set.add(c), remove: c => set.delete(c), toggle: (c, on) => { on ? set.add(c) : set.delete(c); }, contains: c => set.has(c) }; }
const canvasCtx = new Proxy({ createLinearGradient: () => ({ addColorStop: nop }), createRadialGradient: () => ({ addColorStop: nop }), getImageData: () => ({ data: [] }), measureText: () => ({ width: 10 }) }, { get(o, k) { return k in o ? o[k] : nop; }, set() { return true; } });
function makeEl(id) {
  const el = {
    id, tagName: 'DIV', nodeName: 'DIV', nodeType: 1, style: { setProperty: nop }, dataset: {},
    classList: classList(), children: [], childNodes: [], attributes: {}, parentNode: null, _text: '', _html: '',
    get textContent() { return this._text; }, set textContent(v) { this._text = String(v); },
    get innerHTML() { return this._html; }, set innerHTML(v) { this._html = String(v); this.children = []; },
    appendChild(c) { this.children.push(c); this.childNodes.push(c); if (c && typeof c === 'object') c.parentNode = this; return c; },
    removeChild: nop, remove: nop, insertBefore: (c) => c, prepend: nop,
    replaceChildren() { this.children = []; this.childNodes = []; },
    setAttribute(k, v) { this.attributes[k] = String(v); }, getAttribute(k) { return this.attributes[k] ?? null; },
    hasAttribute(k) { return k in this.attributes; }, removeAttribute(k) { delete this.attributes[k]; },
    addEventListener(t, cb) { listeners[id + ':' + t] = cb; }, removeEventListener: nop,
    getContext: () => canvasCtx, getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 700 }),
    querySelector: (sel) => (/canvas/i.test(sel) ? makeEl('qs-canvas') : makeEl('qs-' + sel)),
    querySelectorAll: () => [], closest: () => null, focus: nop,
    onclick: null, click() { if (typeof this.onclick === 'function') this.onclick({ target: this, preventDefault: nop, stopPropagation: nop }); },
    width: 1000, height: 700,
  };
  return el;
}
const document = {
  readyState: 'complete', documentElement: makeEl('html'), body: makeEl('body'), title: 'Cat Bond',
  getElementById(id) { if (!nodes.has(id)) nodes.set(id, makeEl(id)); return nodes.get(id); },
  querySelector(sel) { const m = /#([\w-]+)\s*$/.exec(sel || ''); return m ? this.getElementById(m[1]) : null; },
  querySelectorAll() { return []; },
  createElement(tag) { const e = makeEl('new-' + tag); e.tagName = String(tag).toUpperCase(); return e; },
  createTextNode(t) { return { nodeType: 3, nodeValue: String(t), parentNode: null }; },
  addEventListener(t, cb) { listeners['doc:' + t] = cb; }, removeEventListener: nop,
  createTreeWalker(root) { const out = []; (function visit(n) { for (const c of (n.childNodes || [])) { out.push(c); visit(c); } })(root); let i = -1; return { nextNode() { i++; return i < out.length ? out[i] : null; } }; },
};
const events = [];
const rafQueue = [];
const windowObj = {
  document,
  addEventListener(t, cb) { listeners['win:' + t] = cb; }, removeEventListener: nop,
  dispatchEvent: () => true, arcadeMetric(name, payload) { events.push({ name, payload }); },
  devicePixelRatio: 1, location: { pathname: '/cat-bond/', search: '', href: 'https://x/cat-bond/' },
  navigator: { language: 'en', userAgent: 'node' },
  requestAnimationFrame(fn) { rafQueue.push(fn); return rafQueue.length; }, cancelAnimationFrame: nop,
  setTimeout: (fn) => { try { fn(); } catch (e) {} return 1; }, clearTimeout: nop, setInterval: () => 1, clearInterval: nop,
  CanvasRenderingContext2D: function () {},
  Image: function () { return { width: 0, height: 0, set src(v) {}, get src() { return ''; }, onload: null, onerror: null }; },
  MutationObserver: function () { return { observe: nop, disconnect: nop }; },
  NodeFilter: { SHOW_TEXT: 4, SHOW_ELEMENT: 1 }, MorrowwishI18n: { get: () => 'en' },
  localStorage: (() => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; }, clear: () => { for (const k in m) delete m[k]; } }; })(),
  performance: { now: () => 1000 }, console,
};
windowObj.CanvasRenderingContext2D.prototype = {};
const sandbox = {
  document, console, Math, Date, JSON, Object, Array, String, Number, Boolean, Set, Map, WeakMap, Symbol, isNaN, isFinite, parseInt, parseFloat,
  requestAnimationFrame: windowObj.requestAnimationFrame, cancelAnimationFrame: nop,
  setTimeout: windowObj.setTimeout, clearTimeout: nop, setInterval: () => 1, clearInterval: nop,
  localStorage: windowObj.localStorage, navigator: windowObj.navigator, location: windowObj.location,
  performance: windowObj.performance, CanvasRenderingContext2D: windowObj.CanvasRenderingContext2D,
  MutationObserver: windowObj.MutationObserver, NodeFilter: windowObj.NodeFilter, Image: windowObj.Image,
};
vm.createContext(sandbox);
windowObj.window = windowObj;
const winProxy = new Proxy(windowObj, {
  set(target, key, value) { target[key] = value; try { sandbox[key] = value; } catch (e) {} return true; },
  get(target, key) { return key in target ? target[key] : sandbox[key]; },
  has(target, key) { return (key in target) || (key in sandbox); },
});
sandbox.window = winProxy; windowObj.window = winProxy;

for (const name of ORDER) {
  const src = fs.readFileSync(DIR + 'js/' + name + '.js', 'utf8');
  new vm.Script(src, { filename: name + '.js' });
  vm.runInContext(src, sandbox, { filename: name + '.js' });
}
const duoSrc = fs.readFileSync(DIR + 'js/cat-relationships.js', 'utf8');
vm.runInContext(duoSrc, sandbox, { filename: 'cat-relationships.js' });

const boot = listeners['win:DOMContentLoaded'];
assert.ok(typeof boot === 'function', 'main.js registered DOMContentLoaded');
boot();
const game = sandbox.window.__game, State = sandbox.window.State, GameData = sandbox.window.GameData, Skills = sandbox.window.Skills;
game.start();

// ---- helper: build a battle with a known starter + wild cat ----
function newBattle(starterId='tangyuan', wildId='doudou', opts={}){
  const starter=State.makeCat(starterId,{affinity:opts.aff??40});
  starter.level=opts.lvl??16; starter.stats={pow:70,agi:80,vit:110,cha:60};
  const wild=GameData.speciesById(wildId);
  const b=new sandbox.window.Battle.CaptureBattle(game,[starter],wild);
  b.coach=null;                    // skip the tutorial hold
  return b;
}
// step a battle for `secs` at 60fps, keeping cats alive so steering/AI keeps running.
function run(b,secs,keepAlive=true){
  const steps=Math.round(secs/0.016);
  for(let i=0;i<steps;i++){
    if(keepAlive)for(const f of b.team)if(f.hp<f.maxhp*0.5)f.hp=f.maxhp*0.6;
    b.update(0.016);
    if(b.done)break;
  }
}

// ===========================================================================
// INV-1: every timed ward reaches 0 after its duration — ON BOTH SIDES.
// (Regression: enemy shieldT was never ticked, so barriers stuck on forever.)
// ===========================================================================
{
  const b=newBattle();
  const me=b.me(), foe=b.enemies[0];
  // Suppress the enemy's REACTIVE re-warding so we measure pure timer decay, not the
  // AI legitimately raising a fresh barrier (reactive ward needs rIdx>=1 & wardCd<=0).
  for(const e of b.enemies){ e.rIdx=0; e.wardCd=999; }
  // Force a barrier on an ENEMY (the bug path) and on the PLAYER cat.
  assert.equal(b.castWard(foe,'barrier'),true,'enemy can raise a barrier');
  assert.equal(b.castWard(me,'barrier'),true,'player can raise a barrier');
  assert.ok(foe.shieldT>0 && me.shieldT>0,'barriers start > 0');
  // Barrier duration is 4.8s; after 6s of sim BOTH must be fully gone.
  run(b,8.0);
  assert.equal(foe.shieldT>0.001?foe.shieldT:0,0,'INV-1 enemy barrier EXPIRES (was stuck-on bug): shieldT='+foe.shieldT.toFixed(3));
  assert.equal(me.alive?(me.shieldT>0.001?me.shieldT:0):0,0,'INV-1 player barrier expires: shieldT='+(me.shieldT||0).toFixed(3));
  // protect + reflect also expire for an enemy
  const foe2=b.enemies[1]||b.enemies[0];
  foe2.shieldT=0;foe2.protectT=0;foe2.reflectT=0;foe2.rootT=0;
  b.castWard(foe2,'protect'); run(b,2.0);
  assert.equal(foe2.protectT>0.001?foe2.protectT:0,0,'INV-1 enemy protect expires');
  foe2.protectT=0;foe2.reflectT=0;foe2.rootT=0;foe2._protectVuln=0;
  b.castWard(foe2,'reflect'); run(b,3.0);
  assert.equal(foe2.reflectT>0.001?foe2.reflectT:0,0,'INV-1 enemy reflect expires');
}

// ===========================================================================
// INV-2: a gap-closer cat with a ready dash/pounce/melee and a reachable target
// CLOSES and deals damage — it must not loiter out of range "waiting nearby".
// (Regression: dash/pounce AI parked at mid-range instead of committing.)
// ===========================================================================
for(const kind of ['dash','pounce','melee']){
  const b=newBattle();
  const f=b.me();
  // Force a pure gap-closer kit, ready to go.
  f.qSkill={id:'t_'+kind,name:'t_'+kind,kind,element:'fire',power:1.4,cd:3};
  f.eSkill=null; f.cd={basic:0,q:0,e:0}; f.dodgeCd=0;
  b.autoMode=true;
  // Park the single enemy far away; record its starting HP + the gap over time.
  const e=b.enemies[0];
  for(let k=1;k<b.enemies.length;k++)b.enemies[k].alive=false;   // isolate one target
  e.x=f.x+360; e.y=f.y; e.hp=e.maxhp; e.shieldT=0;e.protectT=0;e.reflectT=0;
  const startHp=e.hp;
  // A melee cast must not consume cooldown until the claw's physical arc can hit.
  if(kind==='melee'){
    const reach=64+(e.r||18)*.65;
    f.cd.q=0;
    b.smartAutoAction(f,e,reach+18,null);
    assert.equal(f.cd.q,0,'INV-2 melee does not waste Q outside the hit arc');
  }
  // Give it ~6s = enough for several gap-closer cycles (dash cd 3s, tempo 0.8).
  run(b,6.0);
  // The REAL invariant: a committed gap-closer must actually DEAL DAMAGE — not merely
  // drift close and loiter. The loiter bug = it parks just inside its own fire-floor
  // (dash needs dist>55 but the band let it hug at ~38) and never triggers its skill.
  const dealt = e.hp < startHp-0.5 || !e.alive;
  assert.ok(dealt,
    'INV-2 ['+kind+'] gap-closer actually lands a hit (no loiter): hpΔ='+(startHp-e.hp).toFixed(1)+' alive='+e.alive+' gap='+Math.hypot(e.x-f.x,e.y-f.y).toFixed(0));
}

// ===========================================================================
// INV-3 + INV-4: a 15s auto-battle never throws, timers never go negative, HP is
// bounded, knead stacks stay in range, and no cat is left permanently root-locked.
// ===========================================================================
{
  const b=newBattle();
  b.autoMode=true;
  let threw=null;
  try{
    for(let i=0;i<940;i++){                 // ~15s
      for(const f of b.team)if(f.hp<f.maxhp*0.5)f.hp=f.maxhp*0.6;
      b.update(0.016);
      // INV-3: bounded invariants checked EVERY frame.
      for(const f of b.team){
        assert.ok((f.shieldT||0)>=-1e-6&&(f.protectT||0)>=-1e-6&&(f.reflectT||0)>=-1e-6&&(f.rootT||0)>=-1e-6,'INV-3 player timers never negative');
        assert.ok(f.hp<=f.maxhp+1e-6,'INV-3 player hp bounded');
        assert.ok((f.kneadStacks||0)>=0&&(f.kneadStacks||0)<=4,'INV-3 knead stacks in [0,4]');
      }
      for(const e of b.enemies){
        assert.ok((e.shieldT||0)>=-1e-6&&(e.protectT||0)>=-1e-6&&(e.reflectT||0)>=-1e-6,'INV-3 enemy timers never negative');
        assert.ok(e.hp<=e.maxhp+1e-6,'INV-3 enemy hp bounded');
      }
      if(b.done)break;
    }
  }catch(e){threw=e;}
  assert.equal(threw,null,'INV-4 15s auto-battle threw nothing'+(threw?': '+threw.stack:''));
  // INV-4: no live cat is stuck with a root flag that has no backing cast/beam.
  for(const f of b.team){
    if(!f.alive)continue;
    const backedCast=(b.pendingCasts||[]).some(c=>c.f===f);
    const backedBeam=(b.beams||[]).some(x=>x.f===f);
    if((f._castRoot||0)>0)assert.ok(backedCast,'INV-4 castRoot only while a cast is pending');
    if((f._beamRoot||0)>0)assert.ok(backedBeam,'INV-4 beamRoot only while a beam is live');
  }
}

console.log('Cat Bond combat INVARIANTS: wards expire both sides (INV-1), gap-closers commit (INV-2), timers/HP/stacks bounded (INV-3), 15s sim clean + no orphan root (INV-4) — all PASS.');
