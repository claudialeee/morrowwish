/* Headless Cat Bond PLAYTEST simulator — ground truth for the multi-agent
 * playtest workflow. Boots the real game in a fake DOM, then drives capture
 * battles with different *human-behavior policies* (personas) that write
 * game.keys / game.mouse each frame exactly like a real player. Emits real
 * per-battle metrics (win/loss, time, HP left, which skills were used, dodges,
 * idle time, faints) as JSON so agents reason about REAL play, not guesses.
 *
 * Usage:  node scripts/playtest-sim.mjs <persona> [battles] [seed]
 *         node scripts/playtest-sim.mjs --list
 * Personas: masher cautious explorer panicky lazy impatient balanced
 * Output: a JSON object on stdout: { persona, battles:[...], summary:{...} }
 */
import fs from 'node:fs';
import vm from 'node:vm';

const DIR = 'public/cat-bond/';
const ORDER = ['vfx','catart','data','running-cats','skills','growth','state','raising','painted-regions','world','worldmap','battle','ui','game','main'];

// ---------- deterministic RNG (seedable) so runs are reproducible ----------
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

// ---------- minimal DOM / canvas (mirrors check-cat-bond.mjs) ----------
function buildEnv(rng){
  const listeners={}, nodes=new Map(), nop=()=>{};
  const classList=()=>{const s=new Set();return{add:c=>s.add(c),remove:c=>s.delete(c),toggle:(c,on)=>{on?s.add(c):s.delete(c);},contains:c=>s.has(c)};};
  const ctx=new Proxy({createLinearGradient:()=>({addColorStop:nop}),createRadialGradient:()=>({addColorStop:nop}),getImageData:()=>({data:[]}),measureText:()=>({width:10})},{get(o,k){return k in o?o[k]:nop;},set(){return true;}});
  function makeEl(id){const el={id,tagName:'DIV',nodeName:'DIV',nodeType:1,style:{setProperty:nop},dataset:{},classList:classList(),children:[],childNodes:[],attributes:{},parentNode:null,_text:'',_html:'',
    get textContent(){return this._text;},set textContent(v){this._text=String(v);},
    get innerHTML(){return this._html;},set innerHTML(v){this._html=String(v);this.children=[];},
    appendChild(c){this.children.push(c);this.childNodes.push(c);if(c&&typeof c==='object')c.parentNode=this;return c;},
    removeChild:nop,remove:nop,insertBefore:c=>c,prepend:nop,replaceChildren(){this.children=[];this.childNodes=[];},
    setAttribute(k,v){this.attributes[k]=String(v);},getAttribute(k){return this.attributes[k]??null;},
    hasAttribute(k){return k in this.attributes;},removeAttribute(k){delete this.attributes[k];},
    addEventListener(t,cb){listeners[id+':'+t]=cb;},removeEventListener:nop,
    getContext:()=>ctx,getBoundingClientRect:()=>({left:0,top:0,width:1000,height:700}),
    querySelector:sel=>(/canvas/i.test(sel)?makeEl('qs-canvas'):makeEl('qs-'+sel)),
    querySelectorAll:()=>[],closest:()=>null,focus:nop,width:1000,height:700};
    return el;}
  const document={readyState:'complete',documentElement:makeEl('html'),body:makeEl('body'),title:'Cat Bond',
    getElementById(id){if(!nodes.has(id))nodes.set(id,makeEl(id));return nodes.get(id);},
    querySelector:()=>null,querySelectorAll:()=>[],
    createElement(tag){const e=makeEl('new-'+tag);e.tagName=String(tag).toUpperCase();return e;},
    createTextNode(t){return{nodeType:3,nodeValue:String(t),parentNode:null};},
    addEventListener(t,cb){listeners['doc:'+t]=cb;},removeEventListener:nop,
    createTreeWalker(root){const out=[];(function visit(n){for(const c of(n.childNodes||[])){out.push(c);visit(c);}})(root);let i=-1;return{nextNode(){i++;return i<out.length?out[i]:null;}};}};
  const events=[];
  const windowObj={document,addEventListener(t,cb){listeners['win:'+t]=cb;},removeEventListener:nop,dispatchEvent:()=>true,
    arcadeMetric(name,payload){events.push({name,payload});},devicePixelRatio:1,
    location:{pathname:'/cat-bond/',search:'',href:'https://x/cat-bond/'},navigator:{language:'en',userAgent:'node'},
    requestAnimationFrame:nop,cancelAnimationFrame:nop,setTimeout:fn=>{try{fn();}catch(e){}return 1;},clearTimeout:nop,setInterval:()=>1,clearInterval:nop,
    CanvasRenderingContext2D:function(){},Image:function(){return{width:0,height:0,set src(v){},get src(){return'';},onload:null,onerror:null};},
    MutationObserver:function(){return{observe:nop,disconnect:nop};},NodeFilter:{SHOW_TEXT:4,SHOW_ELEMENT:1},
    MorrowwishI18n:{get:()=>'zh'},MorrowwishAudio:{effect:nop,play:nop},
    localStorage:(()=>{const m={};return{getItem:k=>(k in m?m[k]:null),setItem:(k,v)=>{m[k]=String(v);},removeItem:k=>{delete m[k];},clear:()=>{for(const k in m)delete m[k];}};})(),
    performance:{now:()=>1000},console,Math:Object.assign(Object.create(Math),{random:rng})};
  windowObj.CanvasRenderingContext2D.prototype={};
  const sandbox={document,console,Math:windowObj.Math,Date,JSON,Object,Array,String,Number,Boolean,Set,Map,WeakMap,Symbol,isNaN,isFinite,parseInt,parseFloat,
    requestAnimationFrame:nop,cancelAnimationFrame:nop,setTimeout:windowObj.setTimeout,clearTimeout:nop,setInterval:()=>1,clearInterval:nop,
    localStorage:windowObj.localStorage,navigator:windowObj.navigator,location:windowObj.location,performance:windowObj.performance,
    CanvasRenderingContext2D:windowObj.CanvasRenderingContext2D,MutationObserver:windowObj.MutationObserver,NodeFilter:windowObj.NodeFilter,Image:windowObj.Image};
  vm.createContext(sandbox);
  windowObj.window=windowObj;
  const winProxy=new Proxy(windowObj,{set(t,k,v){t[k]=v;try{sandbox[k]=v;}catch(e){}return true;},get(t,k){return k in t?t[k]:sandbox[k];},has(t,k){return(k in t)||(k in sandbox);}});
  sandbox.window=winProxy;windowObj.window=winProxy;
  // Silence the game's own stdout banner so our JSON output stays clean.
  const realLog=console.log; console.log=()=>{};
  for(const name of ORDER){const src=fs.readFileSync(DIR+'js/'+name+'.js','utf8');vm.runInContext(src,sandbox,{filename:name+'.js'});}
  const boot=listeners['win:DOMContentLoaded'];boot&&boot();
  const game=sandbox.window.__game;game.start();
  console.log=realLog;
  return {sandbox,game,events,listeners};
}

// ---------- personas: each returns an input policy for a battle ----------
// A policy(fn) is called every tick with (battle, game, obs) and sets
// game.keys / game.mouse to emulate a specific kind of human.
// obs carries per-battle memory (press edges, timers, mood).
const PERSONAS = {
  // Button masher: holds attack, never dodges, barely moves, ignores skills.
  masher: {
    label: '狂按型 (button masher)', desc: 'Holds attack, never dodges, ignores skills/shields.',
    tick(b,g,o){ const me=b.me(); const e=b.nearestEnemy(me.x,me.y);
      g.mouse.down=true; g.keys={}; // left-click attack held
      if(e){ g.mouse.x=e.x; g.mouse.y=e.y; }
      // occasionally mash Q when off cooldown, but mostly just basic
      if(me.cd.q<=0 && o.rng()<0.08) o.tap(g,'q');
    }},
  // Cautious kiter: keeps distance, rarely commits, uses ranged pokes only.
  cautious: {
    label: '谨慎型 (cautious kiter)', desc: 'Runs away, pokes rarely, long boring fights.',
    tick(b,g,o){ const me=b.me(); const e=b.nearestEnemy(me.x,me.y); g.keys={};
      if(e){ g.mouse.x=e.x; g.mouse.y=e.y;
        const d=Math.hypot(e.x-me.x,e.y-me.y);
        // flee if enemy within 260px
        if(d<260){ if(e.x>me.x)g.keys['a']=true;else g.keys['d']=true; if(e.y>me.y)g.keys['w']=true;else g.keys['s']=true; }
        g.mouse.down = d<320 && o.rng()<0.3; // timid, intermittent fire
        if(me.cd.q<=0 && d<300 && o.rng()<0.05) o.tap(g,'q');
      }
    }},
  // Explorer: tries every button — Q, E, dodge, ult — fairly competently.
  explorer: {
    label: '探索型 (tries everything)', desc: 'Uses Q/E/dodge/ult, moves around, engaged.',
    tick(b,g,o){ const me=b.me(); const e=b.nearestEnemy(me.x,me.y); g.keys={};
      if(e){ g.mouse.x=e.x; g.mouse.y=e.y; const d=Math.hypot(e.x-me.x,e.y-me.y);
        // keep mid-range
        if(d>170){ if(e.x>me.x)g.keys['d']=true;else g.keys['a']=true; if(e.y>me.y)g.keys['s']=true;else g.keys['w']=true; }
        else if(d<90){ if(e.x>me.x)g.keys['a']=true;else g.keys['d']=true; }
        g.mouse.down = d<180;
        if(me.cd.q<=0) o.tap(g,'q');
        if(me.cd.e<=0 && o.rng()<0.6) o.tap(g,'e');       // tries the E (shield/defensive) slot
        if(b.ult>=100 && o.rng()<0.5) o.tap(g,'r');
        // dodge when a shot is near
        if(me.dodgeCd<=0 && b.incomingThreat && b.incomingThreat(me) && o.rng()<0.7) o.tap(g,' ');
      }
    }},
  // Panicky: erratic movement, random taps, poor aim, often takes hits.
  panicky: {
    label: '手忙脚乱型 (panicky)', desc: 'Erratic WASD, random skill taps, bad aim, gets hit.',
    tick(b,g,o){ const me=b.me(); g.keys={};
      const dirs=['w','a','s','d']; if(o.rng()<0.6)g.keys[dirs[(o.rng()*4)|0]]=true;
      g.mouse.x=me.x+(o.rng()*400-200); g.mouse.y=me.y+(o.rng()*400-200); // flailing aim
      g.mouse.down=o.rng()<0.5;
      if(o.rng()<0.1)o.tap(g,'q'); if(o.rng()<0.08)o.tap(g,'e'); if(o.rng()<0.12)o.tap(g,' ');
    }},
  // Lazy: flips on auto-battle immediately and just watches.
  lazy: {
    label: '懒人型 (auto-battler)', desc: 'Turns on auto mode and lets the AI play.',
    tick(b,g,o){ g.keys={}; if(!b.autoMode && o.i===2){ o.tap(g,'p'); } // toggle auto early
      // occasionally click to focus-fire (commander)
      const e=b.nearestEnemy(b.me().x,b.me().y); if(e&&o.rng()<0.02){g.mouse.x=e.x;g.mouse.y=e.y;g.mouse.down=true;}else g.mouse.down=false;
    }},
  // Impatient: plays a bit, then flees (quits) if the fight drags past ~18s.
  impatient: {
    label: '没耐心型 (impatient)', desc: 'Engages, but FLEES/quits if the fight drags on.',
    tick(b,g,o){ const me=b.me(); const e=b.nearestEnemy(me.x,me.y); g.keys={};
      if(e){ g.mouse.x=e.x; g.mouse.y=e.y; const d=Math.hypot(e.x-me.x,e.y-me.y);
        if(d>160){ if(e.x>me.x)g.keys['d']=true;else g.keys['a']=true; }
        g.mouse.down=d<190; if(me.cd.q<=0&&o.rng()<0.4)o.tap(g,'q');
      }
      if(b.t>18 && !o.fled){ o.fled=true; o.wantFlee=true; }   // boredom → bail
    }},
  // Balanced: a reasonably skilled player as a control baseline.
  balanced: {
    label: '熟练型 (balanced control)', desc: 'Competent baseline player.',
    tick(b,g,o){ const me=b.me(); const e=b.nearestEnemy(me.x,me.y); g.keys={};
      if(e){ g.mouse.x=e.x; g.mouse.y=e.y; const d=Math.hypot(e.x-me.x,e.y-me.y);
        if(d>150){ if(e.x>me.x)g.keys['d']=true;else g.keys['a']=true; if(e.y>me.y)g.keys['s']=true;else g.keys['w']=true; }
        else if(d<80){ if(e.x>me.x)g.keys['a']=true;else g.keys['d']=true; }
        g.mouse.down=d<175;
        if(me.cd.q<=0)o.tap(g,'q');
        if(me.cd.e<=0&&o.rng()<0.4)o.tap(g,'e');
        if(b.ult>=100)o.tap(g,'r');
        if(me.dodgeCd<=0&&b.incomingThreat&&b.incomingThreat(me)&&o.rng()<0.85)o.tap(g,' ');
      }
    }},
};

// ---------- run one battle under a persona policy, record metrics ----------
function runBattle(env, persona, rng){
  const {sandbox,game,events}=env;
  const State=sandbox.window.State, GameData=sandbox.window.GameData;
  // a modest mid-game team so personas have real tools (Q/E/ult available) but
  // are NOT overpowered — fights must last long enough for behavior to matter.
  const starter=State.makeCat('tangyuan',{affinity:60}); starter.level=10;
  starter.stats={pow:34,agi:40,vit:42,cha:30};
  sandbox.window.Skills.ensureLoadout(starter);
  State.S.cats=[starter];
  // A genuine threat: a rarer wild pack that hits back, so a careless persona
  // actually loses / takes damage and a skilled one is rewarded.
  const wild=GameData.speciesById('lanbao');  // R-rarity water cat, real pack + specials
  events.length=0;
  game.startBattle([starter],wild);
  const b=game.battle;
  const obs={i:0,rng,fled:false,wantFlee:false,_prev:{},
    tap(g,k){ g.keys[k]=true; } }; // held for this tick → readInput sees a fresh press vs its own _prevKeys
  const m={skillsUsed:{basic:0,q:0,e:0,ult:0,dodge:0},shieldFired:0,dmgTaken:0,faints:0,idleTicks:0,usedAuto:false,fled:false};
  // instrument: count shield activations + dmg taken via wrapping
  const startHp=b.team.reduce((s,f)=>s+f.maxhp,0);
  let lastHp=b.team.reduce((s,f)=>s+Math.max(0,f.hp),0);
  const origCastWard=b.castWard.bind(b); b.castWard=(f,t)=>{const r=origCastWard(f,t);if(r&&f===b.me())m.shieldFired++;return r;};
  // Playtest cycle wupz2ckhy P0-1 (auto-fix): instrument CAST successes, not key taps.
  // The key-tap count at line ~187 increments whenever the persona HELDS a key, even if
  // the skill's cd gates the cast — so masher's "ult=0 at 2700 basics" was a telemetry
  // lie, driving adversary P0s that didn't match reality. Wrap b.skillQ / b.skillE /
  // b.ultimate / b.dodge the same way origCastWard is wrapped; count only successful returns.
  // Keep the key-tap count as skillsAttempted (tracked separately) for future delta analysis.
  m.skillsAttempted = m.skillsAttempted || {basic:0,q:0,e:0,ult:0,dodge:0};
  const wrapCast = (name, slot) => {
    if (typeof b[name] !== 'function') return;
    const orig = b[name].bind(b);
    b[name] = (...args) => {
      const r = orig(...args);
      // Playtest cycle woxkxnyqr P0: prior wrapCast predicate `args[0] === b.me()` was too strict —
      // several keyboard-call paths invoke b.skillQ() / b.ultimate() with no first-arg (which the
      // function then internally defaults to b.me()). Null-check first so those count too.
      const caster = (args[0] == null) ? b.me() : args[0];
      if (r !== false && caster === b.me()) m.skillsUsed[slot]++;
      return r;
    };
  };
  wrapCast('skillQ', 'q');
  wrapCast('skillE', 'e');
  wrapCast('ultimate', 'ult');
  wrapCast('dodge', 'dodge');
  const dt=1/60; let tick=0; const MAXT=60; // sim up to 60s game-time
  while(!b.done && tick<MAXT/dt){
    obs.i=tick;
    persona.tick(b,game,obs);
    // count INTENTIONS (presses) — may or may not become casts (cd gates can discard).
    // Actual successful casts are tracked in m.skillsUsed via the wrapCast wrappers above.
    const K=game.keys||{};
    for(const [key,slot] of [['q','q'],['e','e'],['r','ult'],[' ','dodge']]) if(K[key]&&!obs._prev[key])m.skillsAttempted[slot]++;
    if(game.mouse&&game.mouse.down){m.skillsAttempted.basic++;m.skillsUsed.basic++;}
    if(K['p']&&!obs._prev['p'])m.usedAuto=true;
    obs._prev=Object.assign({},K);
    // impatient flee
    if(obs.wantFlee && !m.fled){ m.fled=true; obs.wantFlee=false; try{b.done=true;b.result='flee';}catch(e){} break; }
    const anyInput=(game.mouse&&game.mouse.down)||Object.keys(K).length>0;
    if(!anyInput && !b.autoMode) m.idleTicks++;
    b.update(dt);
    if(b.autoMode)m.usedAuto=true;
    const hp=b.team.reduce((s,f)=>s+Math.max(0,f.hp),0);
    if(hp<lastHp)m.dmgTaken+=lastHp-hp;
    lastHp=hp;
    m.faints=b.team.filter(f=>!f.alive).length;
    tick++;
  }
  const timedOut = !b.done && tick>=MAXT/dt;
  const hpLeft=b.team.reduce((s,f)=>s+Math.max(0,f.hp),0);
  return {
    result: m.fled?'fled':timedOut?'timeout':(b.result||'unknown'),
    seconds: Math.round(b.t*10)/10,
    hpFracLeft: Math.round(hpLeft/startHp*100)/100,
    dmgTaken: Math.round(m.dmgTaken),
    faints: m.faints,
    usedAuto: m.usedAuto,
    shieldFired: m.shieldFired,
    skillsUsed: m.skillsUsed,
    skillsAttempted: m.skillsAttempted,
    idlePct: Math.round(m.idleTicks/Math.max(1,tick)*100),
  };
}

// ---------- main ----------
const arg=process.argv.slice(2);
if(arg[0]==='--list'){ console.log(JSON.stringify(Object.fromEntries(Object.entries(PERSONAS).map(([k,v])=>[k,v.label+' — '+v.desc])),null,2)); process.exit(0); }
const personaKey=arg[0]||'balanced';
const battles=Math.max(1,Math.min(30,parseInt(arg[1]||'6',10)));
const seed=parseInt(arg[2]||'12345',10);
const persona=PERSONAS[personaKey];
if(!persona){ console.error('Unknown persona: '+personaKey+'. Use --list.'); process.exit(1); }
const rng=mulberry32(seed);
const env=buildEnv(rng);
const results=[];
for(let i=0;i<battles;i++){ results.push(runBattle(env,persona,mulberry32(seed+i*7919))); }
// summary
const n=results.length;
const wins=results.filter(r=>r.result==='win').length;
const avg=(f)=>Math.round(results.reduce((s,r)=>s+f(r),0)/n*100)/100;
const summary={
  persona:personaKey, label:persona.label, battles:n,
  winRate:Math.round(wins/n*100)/100,
  avgSeconds:avg(r=>r.seconds),
  avgHpFracLeft:avg(r=>r.hpFracLeft),
  avgDmgTaken:avg(r=>r.dmgTaken),
  fledCount:results.filter(r=>r.result==='fled').length,
  timeoutCount:results.filter(r=>r.result==='timeout').length,
  everUsedShield:results.some(r=>r.shieldFired>0),
  avgShieldFired:avg(r=>r.shieldFired),
  everUsedDodge:results.some(r=>r.skillsUsed.dodge>0),
  avgIdlePct:avg(r=>r.idlePct),
  usedAutoAny:results.some(r=>r.usedAuto),
};
console.log(JSON.stringify({persona:personaKey,label:persona.label,desc:persona.desc,summary,battles:results},null,2));
