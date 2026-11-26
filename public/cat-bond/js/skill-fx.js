/* Every normal Cat Bond skill gets a distinct localized Canvas silhouette.
 * Phase: cast wind-up/launch → impact accent → lingering status. No whole-stage
 * wash and no fake projectile/hit. Physics + damage remain battle.js-owned.
 */
(()=>{'use strict';
const PI=Math.PI,TAU=2*PI;
const LIST=[
['emberClaw','claw','#ff9650',42,0],['fireballMeow','ball','#f9a45b',38,1],
['puffHiss','fur','#ffd19b',54,2],['flameSweep','flame','#fe8e40',72,3],
['waterLash','whip','#74d6ec',64,4],['knockOff','paw','#92dcf6',48,5],
['grooming','heal','#aee8db',44,6],['waterJet','stream','#69ccec',66,7],
['bubbleVeil','bubble','#97e4e8',56,8],['tidePool','pool','#88caee',68,9],
['guardStance','shield','#ffddaa',60,10],['mirrorWall','wall','#b9e6f9',53,11],
['leafDart','leaf','#91cf8f',55,12],['sporeBloom','spores','#d2d6a4',62,13],
['homingSeed','seed','#b8dca2',51,14],['thornCoil','vine','#83bc8a',57,15],
['boxAmbush','box','#c3a37f',55,16],['quakeStomp','stomp','#a6c48b',61,17],
['photosynth','sun','#c0eeab',55,18],['staticPounce','dash','#ffe9a1',66,19],
['boltArc','chain','#fbdb8c',71,20],['lightningOrb','orb','#dce8fe',54,21],
['thunderStream','thunder','#fff1b0',69,22],['shadowSwipe','shadow','#ad91db',57,23],
['shadeLeap','mist','#a78ac9',61,24],['batAround','claw','#b99bdd',42,25],
['hex','hex','#b298d4',51,26],['prismBeam','prism','#fff0c7',64,27],
['highGround','comet','#ffe6ae',62,28],['blessFur','halo','#f9e8b9',57,29],
['dawnHeal','heal','#ffd7d5',58,30],['cometClaw','comet','#ffb16d',61,31],
['tidalBite','fang','#8fcde9',47,32],['thornLash','thorn','#b6d889',69,33],
['frostLance','ice','#c6e9fd',66,34],['voltRush','dash','#b6c5ef',79,35],
['apexPounce','paw','#b59dca',69,36],['veteranStrike','slash','#d0c3f0',54,37],
['tenderPaw','heart','#ffc6d5',44,38],
['knead','knead','#f7d4b4',49,39],
['frostClaw','ice','#a5e0f5',40,40],
['boltSwarm','orb','#dce8fe',48,41],['prismSwarm','orb','#fff0c7',48,42],
['vineMire','pool','#8fcf86',68,43],['meteor','shockwave','#ff7a3c',74,44],
['glareField','ring','#fff1a8',70,45],
// 舔伤口 tank self-heal (owner call 2026-11-25). Warm cream color distinct from
// 舔毛理顺 (teal aqua for support) and from 慢眨眼 (pink light burst).
['lickWound','heal','#f6d6a8',52,46],
// Salvo/pulse skills (owner 2026-11-25 "多次发出能量波"): one cast releases 3 waves ~0.3s apart.
// Dark & water flavors, so each gets a distinct hex/orb style with element-tinted trail.
['arcanePulse','hex','#b89cff',55,47],
['tidalPulse','orb','#a0e6ff',54,48],
['crescentFan','fang','#e8e2ff',66,49]
];
const REG=Object.fromEntries(LIST.map(([id,style,color,r,seed])=>[id,{style,color,r,seed}]));
// AUTO-REGISTER generic template skills (#56): the factory in skills.js generates one
// basic skill per (element × archetype) gap. Rather than hand-author a bespoke signature
// for each, map its kind → an existing style and element → color so every generic skill
// still renders a real cast/hit VFX and the registry stays in lockstep with the roster.
// Run LAZILY (on first access): skill-fx.js may load BEFORE skills.js (it does in the
// test harness), so window.Skills isn't available at module-eval time.
function syncGenerics(){
  const S=window.Skills; if(!S||!Array.isArray(S.SKILLS))return;
  const EL=S.ELEMENTS||{};
  const styleFor={melee:'claw',projectile:'ball',dash:'dash',buff:'shield',heal:'heal'};
  for(const sk of S.SKILLS){
    if(!sk.generic||REG[sk.id])continue;
    const style=styleFor[sk.kind]||'ball';
    const color=(EL[sk.element]&&EL[sk.element].color)||'#cccccc';
    REG[sk.id]={style,color,r:52,seed:LIST.length};
    LIST.push([sk.id,style,color,52,LIST.length]);
  }
}
const clip=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const ease=x=>{x=clip(x);return x*x*(3-2*x)};
function point(ctx,x,y,r,fill){
 ctx.fillStyle=fill;ctx.beginPath();ctx.arc(x,y,Math.max(.5,r),0,TAU);ctx.fill();
}
function stroke(ctx,col,w,a){ctx.strokeStyle=col;ctx.lineWidth=w;ctx.globalAlpha=a;ctx.lineCap='round';ctx.lineJoin='round'}
function path(ctx,pts){ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();}
function push(b,v){
 if(!Array.isArray(b.skillStrokes))b.skillStrokes=[];
 if(b.skillStrokes.length>80){
  const i=b.skillStrokes.findIndex(q=>q.kind==='signatureCast'||q.kind==='signatureHit');
  if(i>=0)b.skillStrokes.splice(i,1);
 }
 b.skillStrokes.push(v);
}
function cast(b,f,sk,aim){
 if(sk?.id&&!REG[sk.id])syncGenerics();
 if(!b||!f||!REG[sk?.id]||sk?.ultCost||sk?.isBasic)return false;
 // Melee casts already have a physical three-claw VFX in battle.js.
 // A second circular skill glyph used to bury both the paws and the target.
 // Keep the per-skill HIT accent, which spawns only after genuine contact.
 if(sk.kind==='melee')return true;
 if(sk.id==='mirrorWall')return true; // the physical 220px panel owns all visual feedback
 const g=REG[sk.id],dur=['beam','aoe','pounce','dash'].includes(sk.kind)?.51:.36;
 push(b,{kind:'signatureCast',skillId:sk.id,x:f.x,y:f.y,angle:aim||0,
  life:dur,max:dur,seed:g.seed});
 return true;
}
function support(b,recipient,sk){
 if(!b||!recipient||!REG[sk?.id])return false;
 // The deployed mirror wall has its own world-space effect; no circular burst.
 if(sk.id==='mirrorWall')return true;
 const g=REG[sk.id],dur=.63;
 push(b,{kind:'signatureCast',skillId:sk.id,x:recipient.x,y:recipient.y,
  angle:0,life:dur,max:dur,seed:g.seed});
 return true;
}
function hit(b,target,sk,dealt,continuous=false){
 if(sk?.id&&!REG[sk.id])syncGenerics();
 if(!b||!target||!REG[sk?.id]||!(dealt>0)||sk?.ultCost)return false;
 if(continuous){
  const key=sk.id+':'+(target.i??target.cat?.uid??'target');
  b._sigHitAt??=new Map();
  if(b.t-(b._sigHitAt.get(key)??-99)<.22)return false;
  b._sigHitAt.set(key,b.t);
 }
 const g=REG[sk.id],big=(sk.heavy||['melee','dash','leap','pounce'].includes(sk.kind));
 const dur=sk.kind==='melee'?(sk.heavy?.37:.30):(big?.40:.25);
 push(b,{kind:'signatureHit',skillId:sk.id,x:target.x,y:target.y,
  angle:Math.atan2(target.y-b.me().y,target.x-b.me().x),
  life:dur,max:dur,seed:g.seed,heavy:!!sk.heavy||['dash','leap','pounce'].includes(sk.kind)});
 return true;
}
// Certain move families share a grammar (claw, dash, heal, pounce), but an
// individual skill should still read correctly without color or name labels.
// These SHORT secondary silhouettes are tied to skill.id, not element.
function identityDetail(ctx,id,R,k,p,spin,cast){
 const a=k*(cast?.63:.83);
 ctx.save();ctx.globalAlpha=a;ctx.lineCap='round';ctx.lineJoin='round';
 if(id==='emberClaw'){
   // Two molten claw-tip teardrops, separate from the longer comet claw.
   for(let i=0;i<3;i++){
     const x=R*(.17+i*.14),y=-R*.2+i*6;
     ctx.fillStyle=i%2?'#ffd789':'#ff7946';ctx.beginPath();
     ctx.moveTo(x-3,y+6);ctx.quadraticCurveTo(x-6,y-5,x+1,y-13);
     ctx.quadraticCurveTo(x+9,y-3,x+3,y+7);ctx.fill();
   }
 }else if(id==='cometClaw'){
   ctx.strokeStyle='#fff5cb';ctx.lineWidth=5;ctx.beginPath();
   ctx.moveTo(-R*.65,R*.32);ctx.quadraticCurveTo(R*.2,-R*.60,R*.7,-R*.36);ctx.stroke();
   ctx.fillStyle='#ffd28c';ctx.beginPath();ctx.arc(R*.63,-R*.39,6,0,TAU);ctx.fill();
 }else if(id==='batAround'){
   // A single dark rotating paw orbit — different from fire claws.
   ctx.strokeStyle='#745898';ctx.lineWidth=4;ctx.beginPath();
   ctx.arc(0,0,R*.58,spin*.42,spin*.42+PI*1.25);ctx.stroke();
   point(ctx,R*.53*Math.cos(spin*.42),R*.53*Math.sin(spin*.42),5,'#d9bde9');
 }else if(id==='staticPounce'){
   // The cat's SHAPE moves; arrows follow its body, no lightning projectile.
   for(let i=-1;i<=1;i++){
     ctx.strokeStyle=i===0?'#fff5b7':'#8b92c9';ctx.lineWidth=i===0?3.5:2.3;
     path(ctx,[[-R*.68,i*10],[-R*.33,i*10-6],[-R*.05,i*10-6]]);
   }
 }else if(id==='voltRush'){
   // Up-close electric shoulder-check, with snapping forks.
   ctx.strokeStyle='#fff1aa';ctx.lineWidth=3.5;
   for(let i=0;i<3;i++)path(ctx,[[0,i*12-13],[R*.23,i*12-19],[R*.33,i*12-8],[R*.54,i*12-13]]);
 }else if(id==='highGround'){
   // Diving comet: downward strike marker, distinct from comet claw.
   ctx.strokeStyle='#fff4c9';ctx.lineWidth=4;
   path(ctx,[[0,-R*.66],[0,R*.1],[-R*.16,-R*.03]]);
   path(ctx,[[0,R*.1],[R*.16,-R*.03]]);
 }else if(id==='apexPounce'){
   // Heaviest leap ends in a compressed paw-wave at ground level.
   ctx.strokeStyle='#c8a9ec';ctx.lineWidth=4;ctx.beginPath();
   ctx.ellipse(0,R*.31,R*.67,R*.18,0,0,TAU);ctx.stroke();
   for(let i=-1;i<=1;i++)point(ctx,i*10,R*.2,2.7,'#fff6db');
 }else if(id==='grooming'){
   // Lick/cleanse has aqua droplets, not a generic healing halo.
   for(let i=0;i<3;i++){
     ctx.fillStyle=i%2?'#cdf8ee':'#7bcddd';ctx.beginPath();
     const x=(i-1)*13,y=-R*.32+Math.sin(spin+i)*5;
     ctx.moveTo(x,y-6);ctx.quadraticCurveTo(x-9,y+5,x,y+9);
     ctx.quadraticCurveTo(x+9,y+5,x,y-6);ctx.fill();
   }
 }else if(id==='dawnHeal'){
   // Slow blink: two mirrored eyelid crescents.
   ctx.strokeStyle='#fff8e4';ctx.lineWidth=3.2;
   for(const side of [-1,1]){ctx.beginPath();ctx.arc(side*R*.18,-R*.15,R*.22,0,PI);ctx.stroke();}
 }else if(id==='tenderPaw'){
   // A supportive open paw with a separate rising heart.
   ctx.fillStyle='#fff0eb';point(ctx,0,R*.16,8,'#ffe3d8');
   for(let i=0;i<3;i++)point(ctx,(i-1)*10,-R*.14,3.5,'#f9b6c5');
 }else if(id==='veteranStrike'){
   // A compressed, precise veteran X slash, no wide generic arc.
   ctx.strokeStyle='#f7eaff';ctx.lineWidth=3.5;
   path(ctx,[[-R*.43,-R*.35],[R*.46,R*.36]]);
   path(ctx,[[-R*.32,R*.39],[R*.35,-R*.42]]);
 }else if(id==='tidalBite'){
   // Fang tips with a water-droplet between them.
   ctx.strokeStyle='#e3faff';ctx.lineWidth=4;
   path(ctx,[[-R*.27,-R*.24],[-R*.15,R*.12],[-R*.02,-R*.09]]);
   path(ctx,[[R*.27,-R*.24],[R*.15,R*.12],[R*.02,-R*.09]]);
   point(ctx,0,R*.13,3.3,'#83daf4');
 }
 ctx.restore();
}
// Melee contacts should read as one precise strike, not the generic magic
// halo + radial wash + six-point fireworks used by ranged spells.
const MELEE_IDS=new Set(['frostClaw','emberClaw','shadowSwipe','batAround','thornCoil',
 'cometClaw','tidalBite','thornLash','veteranStrike']);
function isMeleeId(id){
 return MELEE_IDS.has(id)||/^gen_(fire|water|grass|elec|dark|light)_melee$/.test(id);
}
function drawMeleeContact(ctx,v,spec){
 if(v.kind==='signatureCast')return true; // the moving claw brush owns this phase
 const k=clip(v.life/v.max),p=1-k,R=Math.min(v.heavy?64:49,spec.r*.95+12);
 drawHeavyImpact(ctx,v,spec);
 const sk=window.Skills?.skillById?.(v.skillId);
 const el=sk?.element||(/^gen_([^_]+)_melee$/.exec(v.skillId)||[])[1]||'fire';
 const heavy=!!v.heavy,spin=(v.seed||0)*.71;
 ctx.save();ctx.translate(v.x,v.y);ctx.rotate(v.angle||0);
 ctx.lineCap='round';ctx.lineJoin='round';
 const strength=k*(heavy?.96:.8);
 // Three tiny directional contact splinters, not a second full claw sweep.
 for(let j=-1;j<=1;j++){
  const y=j*R*.29,reach=R*(.40+.08*(j+1))*(1+.18*p);
  stroke(ctx,j===0?'#fff8ea':spec.color,heavy?5.2:3.6,strength*(j===0?.9:.62));
  ctx.beginPath();ctx.moveTo(-reach*.36,y+R*.13);
  ctx.quadraticCurveTo(reach*.16,y-R*.13,reach,y-R*.21);
  ctx.stroke();
 }
 // Each element has an authored contact silhouette of its own, confined to
 // 34px around the TARGET; no large circular pulse or occluding aura.
 if(el==='fire'){
  for(let j=0;j<(heavy?3:2);j++){
   const x=(j-1)*R*.34,y=-R*.21-j*3;
   ctx.globalAlpha=strength*.75;ctx.fillStyle=j===1?'#fff1b8':'#ff9859';
   ctx.beginPath();ctx.moveTo(x-3,y+8);ctx.quadraticCurveTo(x-9,y+1,x+2,y-12-(heavy?4:0));
   ctx.quadraticCurveTo(x+10,y+2,x+4,y+8);ctx.closePath();ctx.fill();
  }
 }else if(v.skillId==='frostClaw'){
  // Frost Claw is a Water-school melee swipe, with tiny icy crystal splinters,
  // visually distinct from Electric's sharp zigzags or a watery splash.
  for(let j=-1;j<=1;j++){
   const x=R*(.13+j*.27),y=-R*(.21+j*.12);
   ctx.globalAlpha=strength*.85;
   ctx.fillStyle=j===0?'#f4feff':'#9fdbec';
   ctx.beginPath();ctx.moveTo(x,y-7);ctx.lineTo(x+3,y-1);
   ctx.lineTo(x,y+6);ctx.lineTo(x-3,y);ctx.closePath();ctx.fill();
   stroke(ctx,'#e9fcff',1.1,strength*.7);
   path(ctx,[[x,y-7],[x,y+6]]);
  }
 }else if(el==='water'){
  for(let j=-1;j<=1;j+=2){
   const x=R*.08+j*R*.34,y=j*R*.22;
   ctx.globalAlpha=strength*.72;ctx.fillStyle=j<0?'#d4f9ff':'#7dcce9';
   ctx.beginPath();ctx.moveTo(x,y-8);
   ctx.quadraticCurveTo(x+j*7,y+4,x,y+8);
   ctx.quadraticCurveTo(x-j*7,y+4,x,y-8);ctx.fill();
  }
 }else if(el==='grass'){
  for(let j=-1;j<=1;j+=2){
   const x=j*R*.38,y=-R*.18;
   ctx.globalAlpha=strength*.72;ctx.fillStyle=j<0?'#dff4b4':'#83b989';
   ctx.beginPath();ctx.moveTo(x-7,y+5);ctx.quadraticCurveTo(x-4,y-9,x+10,y-10);
   ctx.quadraticCurveTo(x+7,y+7,x-7,y+5);ctx.fill();
   stroke(ctx,'#fff3c8',1,strength*.6);
   path(ctx,[[x-6,y+4],[x+8,y-9]]);
  }
 }else if(el==='elec'){
  for(let j=-1;j<=1;j+=2){
   const y=j*R*.32;
   stroke(ctx,j>0?'#fff6bf':'#9facf5',2.4,strength*.9);
   path(ctx,[[-R*.31,y],[0,y-R*.22],[R*.12,y+R*.05],[R*.43,y-R*.17]]);
  }
 }else if(el==='dark'){
  for(let j=-1;j<=1;j+=2){
   stroke(ctx,j<0?'#9f85d1':'#f1d8ff',heavy?3:2.1,strength*.73);
   ctx.beginPath();ctx.moveTo(-R*.42,j*R*.19);
   ctx.quadraticCurveTo(R*.12,j*R*.38,R*.48,j*R*.08);ctx.stroke();
  }
 }else if(el==='light'){
  for(let j=-1;j<=1;j+=2){
   const x=j*R*.33;
   stroke(ctx,'#fff5ca',1.9,strength*.85);
   path(ctx,[[x-6,-R*.25],[x+5,R*.26]]);
   path(ctx,[[x+6,-R*.24],[x-5,R*.23]]);
  }
 }
 // The distinctive advanced move gets a small, readable extra mark.
 if(v.skillId==='veteranStrike'||v.skillId==='batAround'){
  stroke(ctx,v.skillId==='veteranStrike'?'#f3defd':'#c7a7e2',2.1,strength*.8);
  ctx.beginPath();ctx.moveTo(-R*.36,-R*.27);
  ctx.lineTo(R*.34,R*.25);ctx.moveTo(-R*.27,R*.29);
  ctx.lineTo(R*.30,-R*.28);ctx.stroke();
 }else if(v.skillId==='tidalBite'){
  stroke(ctx,'#effcff',2.3,strength*.87);
  path(ctx,[[-R*.33,-R*.29],[-R*.18,R*.20],[0,-R*.06]]);
  path(ctx,[[R*.33,-R*.29],[R*.18,R*.20],[0,-R*.06]]);
 }
 ctx.restore();return true;
}

 // Production combat visual pass: deterministic geometry, visual-only debris.
 const hash=n=>{const q=Math.sin(n*127.1+311.7)*43758.5453;return q-Math.floor(q)};
 function poly(c,pts,col){c.fillStyle=col;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
 function flare(c,x,y,r,col,alpha=1){
   if(r<=0)return;const g=c.createRadialGradient(x,y,0,x,y,r);
   g.addColorStop(0,'#fffdf4');g.addColorStop(.19,col);g.addColorStop(1,'rgba(0,0,0,0)');
   c.globalAlpha=alpha;c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();
 }
 function rock(c,x,y,r,seed,turn){
   c.save();c.translate(x,y);c.rotate(turn);
   const pts=Array.from({length:7},(_,i)=>{const a=i*TAU/7,rr=r*(.79+.23*hash(seed+i));return [Math.cos(a)*rr,Math.sin(a)*rr]});
   poly(c,pts,'#422d35');
   for(let i=0;i<7;i++)poly(c,[pts[i],pts[(i+1)%7],[-r*.13,-r*.20]],['#a36a45','#734539','#51353c','#48323b','#85553d','#c17c4c','#a36a45'][i]);
   stroke(c,'#ff983d',Math.max(1,r*.11),Math.min(1,c.globalAlpha*.95));path(c,[pts[1],[-r*.13,-r*.2],pts[4]]);path(c,[[-r*.13,-r*.2],pts[6]]);
   c.restore();
 }
 function meteorPoints(b){
   return Array.from({length:6},(_,i)=>{const a=i*2.399,rr=i?b.r*(.32+.28*hash(i+8)):0;
     return {x:b.tx+Math.cos(a)*rr,y:b.ty+Math.sin(a)*rr,r:i?8+hash(i+31)*7:20,lag:i?(.035+i*.055):0};});
 }
 function drawMeteorFlight(c,p,time=0){
   const b=p.burst;if(b?.skill?.id!=='meteor')return false;
   // The existing lob remains the authoritative damage clock. All rocks
   // converge on its landing beat; smaller arrivals are decorative only.
   const remaining=Math.max(0,p.life);
   c.save();
   for(const [i,m] of meteorPoints(b).entries()){
     const q=clip((remaining-m.lag)/(.62+i*.035));
     c.globalAlpha=.20+.28*(1-q);c.fillStyle='#2e2024';c.beginPath();c.ellipse(m.x,m.y,m.r*(1.2+q),m.r*.46,0,0,TAU);c.fill();
     if(remaining>m.lag+.62+i*.035)continue;
     if(q<=0&&i>0){const pop=clip(1-(m.lag-remaining)/.15);flare(c,m.x,m.y,m.r*1.6,'#ff9d42',.42*pop);continue;}
     const x=m.x-q*116,y=m.y-q*190,r=m.r*(.85+.15*(1-q));
     c.globalAlpha=.92;
     const dx=-.52,dy=-.85,tail=50+r*2.4;
     const g=c.createLinearGradient(x,y,x+dx*tail,y+dy*tail);
     g.addColorStop(0,'#fff1a4');g.addColorStop(.27,'#ff922e');g.addColorStop(.68,'rgba(224,68,24,.65)');g.addColorStop(1,'rgba(112,43,35,0)');
     c.fillStyle=g;c.beginPath();c.moveTo(x- r*.85,y+r*.35);
     c.quadraticCurveTo(x+dx*tail*.52-r,y+dy*tail*.52,x+dx*tail,y+dy*tail);
     c.quadraticCurveTo(x+dx*tail*.6+r,y+dy*tail*.6,x+r*.85,y-r*.35);c.closePath();c.fill();
     for(let j=0;j<5;j++){const u=hash(i*17+j+Math.floor(time*14))*.85;point(c,x+dx*tail*u+(hash(j+i)-.5)*r,y+dy*tail*u,1.4+hash(j+9)*2,'#ffb34e');}
     rock(c,x,y,r,i*11,time*(1+i*.12));
   }
   c.restore();return true;
 }
 function meteorImpact(b,burst){
   push(b,{kind:'signatureHit',skillId:'meteor',x:burst.tx,y:burst.ty,r:burst.r,life:1.1,max:1.1,seed:44,meteorGround:true});
 }
 function drawMeteorGround(c,v){
   const age=v.max-v.life,R=v.r||86;
   c.save();c.translate(v.x,v.y);
   for(const [i,m] of meteorPoints({tx:0,ty:0,r:R}).entries()){
     const a=age-(i?i*.035:0);if(a<0)continue;
     const p=clip(a/.65),fade=clip(v.life/.45),r=m.r;
     c.globalAlpha=.60*fade;c.fillStyle='#493431';c.beginPath();c.ellipse(m.x,m.y,r*1.65,r*.75,0,0,TAU);c.fill();
     for(let j=0;j<5;j++){const th=j*TAU/5+hash(i*13+j);const len=r*(1.4+hash(j+7));
       stroke(c,'#332725',2,fade*.8);path(c,[[m.x,m.y],[m.x+Math.cos(th)*len*.55,m.y+Math.sin(th)*len*.35],[m.x+Math.cos(th+.3)*len,m.y+Math.sin(th+.3)*len*.64]]);}
     if(a<.34){flare(c,m.x,m.y,r*(1.3+3*p),'#ff9836',clip(1-a/.34)*.9);
       stroke(c,'#ffd18c',3,clip(1-a/.34));c.beginPath();c.ellipse(m.x,m.y,r*(1+3*p),r*(.4+1.4*p),0,0,TAU);c.stroke();}
     for(let j=0;j<6;j++){const th=j*TAU/6+hash(i+j),d=r*(.5+p*2.8),x=m.x+Math.cos(th)*d,y=m.y+Math.sin(th)*d*.6-Math.sin(p*PI)*r*1.4;
       c.globalAlpha=fade*(1-p*.35);rock(c,x,y,2+hash(i*7+j)*3,i*7+j,p*5);}
     c.globalAlpha=.16*fade;point(c,m.x-7*p,m.y-r*.9-p*15,r*(.7+p),'#b7a29a');
   }c.restore();return true;
 }
 
// V5: authored geometry for actual projectiles; positions/radii remain battle-owned.
// No independent hit or damage event is created by these renderers.

/* Actual travel renderer for remaining projectile families. Art is centered on
 * simulation positions. Basic toy attacks and hostile warning darts stay small. */
function drawMaterialProjectile(c,p,time=0){
 if(p.burst||p.owner!=='me'||p.skill?.isBasic||!p.skill||['fish','yarn','fur','claw','crescent','fireball','lightningOrb','hex'].includes(p.kind))return false;
 const sk=p.skill,id=sk.id||'',el=sk.element;
 if(!['water','fire','grass','elec','dark','light'].includes(el))return false;
 const r=Math.max(5,Math.min(20,p.r||8)),ang=Math.hypot(p.vx||0,p.vy||0)>0?Math.atan2(p.vy,p.vx):(p.ang||0);
 const colors={water:['#246f9f','#71d7f2','#f2ffff'],grass:['#416c42','#a6d779','#f2f9cc'],elec:['#5650a7','#baacff','#fff4b7'],dark:['#403056','#a786dc','#f2dbff'],light:['#8792ca','#d9e6ff','#ffffeb'],fire:['#9c3c21','#ff9a43','#fff4b8']}[el];
 c.save();c.translate(p.x,p.y);c.rotate(ang);
 const [dark,col,white]=colors,tail=r*(id==='frostLance'?4:2.8);
 const grad=c.createLinearGradient(-tail,0,r,0);grad.addColorStop(0,'rgba(0,0,0,0)');grad.addColorStop(.6,col);grad.addColorStop(1,white);
 c.globalAlpha=.68;c.fillStyle=grad;
 c.beginPath();c.moveTo(-tail,0);c.quadraticCurveTo(-r,-r*.72,r*.8,-r*.24);c.quadraticCurveTo(r,-r*.0,r*.8,r*.24);c.quadraticCurveTo(-r,r*.72,-tail,0);c.fill();
 c.globalAlpha=1;
 if(id==='frostLance'){
   poly(c,[[-r*1.8,0],[-r*.4,-r*.62],[r*1.8,0],[-r*.4,r*.62]],dark);
   poly(c,[[-r*1.8,0],[-r*.4,-r*.62],[r*1.8,0]],white);
   poly(c,[[-r*1.8,0],[r*1.8,0],[-r*.4,r*.62]],col);
 }else if(el==='water'){
   const length=id==='waterLash'?r*2.1:r*1.25;
   for(let j=0;j<3;j++){
     c.globalAlpha=1-j*.13;c.fillStyle=j===0?dark:j===1?col:white;
     const rr=r*(1-j*.28);c.beginPath();c.moveTo(length-j*2,0);c.bezierCurveTo(r,-rr,-r,-rr*.8,-r*1.3,0);c.bezierCurveTo(-r,rr*.8,r,rr,length-j*2,0);c.fill();
   }
   for(let j=0;j<5;j++){const u=(time*3+j/5)%1;c.globalAlpha=(1-u)*.8;point(c,-r-u*tail,(hash(j)-.5)*r*2,1+hash(j+2)*1.4,col);}
 }else if(el==='grass'){
   if(id==='leafDart'||p.kind==='leaf'){
     c.globalAlpha=1;c.fillStyle=dark;c.beginPath();c.moveTo(-r*1.4,0);c.quadraticCurveTo(-r,-r*1.05,r*1.6,0);c.quadraticCurveTo(0,r*1.05,-r*1.4,0);c.fill();
     c.fillStyle=col;c.beginPath();c.moveTo(-r*1.2,0);c.quadraticCurveTo(0,-r*.9,r*1.4,0);c.quadraticCurveTo(0,r*.6,-r*1.2,0);c.fill();stroke(c,white,1.3,.85);path(c,[[-r,0],[r*1.4,0]]);
   }else{
     c.save();c.rotate(time*5);const bloom=id==='sporeBloom';
     const g=c.createRadialGradient(-r*.25,-r*.28,0,0,0,r);g.addColorStop(0,white);g.addColorStop(.5,col);g.addColorStop(1,dark);point(c,0,0,r*.9,g);
     for(let j=0;j<(bloom?7:3);j++){const th=j*TAU/(bloom?7:3);c.save();c.rotate(th);c.globalAlpha=.82;poly(c,[[r*.2,0],[r*.9,-r*.45],[r*1.15,0],[r*.9,r*.35]],col);c.restore()}c.restore();
   }
 }else if(el==='elec'){
   flare(c,0,0,r*1.55,col,.35);point(c,0,0,r*.72,dark);point(c,0,0,r*.42,white);
   for(let j=0;j<4;j++){const th=j*TAU/4+time*8;stroke(c,j%2?white:col,1.8,.93);path(c,[[0,0],[Math.cos(th)*r*.6,Math.sin(th)*r*.6],[Math.cos(th+.43)*r*.95,Math.sin(th+.43)*r*.95],[Math.cos(th)*r*1.2,Math.sin(th)*r*1.2]])}
 }else if(el==='dark'){
   c.save();c.rotate(time*4);for(let j=0;j<3;j++){c.rotate(TAU/3);c.globalAlpha=.8;c.fillStyle=j?col:dark;c.beginPath();c.moveTo(r,0);c.quadraticCurveTo(0,-r*1.25,-r,0);c.quadraticCurveTo(-r*.1,-r*.35,r,0);c.fill()}point(c,0,0,r*.38,white);c.restore();
 }else if(el==='light'){
   poly(c,[[-r*1.6,0],[0,-r*.62],[r*1.6,0],[0,r*.62]],dark);
   poly(c,[[-r*1.2,0],[0,-r*.5],[r*1.6,0],[0,r*.5]],col);
   poly(c,[[0,-r*.4],[r*1.5,0],[0,r*.4]],white);
 }else{
   point(c,0,0,r*.9,dark);point(c,r*.18,0,r*.68,col);point(c,r*.28,-r*.15,r*.36,white);
 }
 c.restore();return true;
}
function drawTravel(c,segments,t){
 for(const v of segments){
   const fade=clip(1-(t-v.start)/.32),dx=v.x2-v.x,dy=v.y2-v.y,L=Math.hypot(dx,dy);
   if(fade<=0||L<.1)continue;
   const el=v.element,palette={elec:['#6655bd','#c1baff','#fff1b9'],dark:['#3e2c59','#9a70d4','#dfbcff'],water:['#267da5','#74d8ed','#e7ffff'],fire:['#9c4828','#ff9a42','#fff0a4'],grass:['#507443','#9bc66e','#edf2b1'],light:['#8698c9','#c2dcff','#fffdeb']}[el]||['#997a5b','#e0bb90','#fff1d0'];
   c.save();c.translate(v.x2,v.y2);c.rotate(Math.atan2(dy,dx));
   const len=Math.min(75,L+26),w=el==='elec'?8:el==='dark'?12:9;
   const g=c.createLinearGradient(-len,0,0,0);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(.65,palette[0]);g.addColorStop(1,palette[1]);
   c.globalAlpha=fade*.52;c.fillStyle=g;c.beginPath();c.moveTo(-len,0);c.bezierCurveTo(-len*.5,-w*1.6,-len*.16,-w,0,-w*.4);c.lineTo(0,w*.4);c.bezierCurveTo(-len*.16,w,-len*.5,w*1.6,-len,0);c.fill();
   for(let j=0;j<3;j++){
     const yy=(j-1)*w*.8;stroke(c,j===1?palette[2]:palette[1],j===1?1.8:2.8,fade*.74);
     c.beginPath();c.moveTo(-len,yy*.45);
     if(el==='elec'){for(let k=1;k<=6;k++){const u=k/6;c.lineTo(-len*(1-u),yy+Math.sin(k*2.9+j*5)*w*.55*Math.sin(PI*u));}}
     else c.bezierCurveTo(-len*.7,yy-w*.4,-len*.3,yy+w*.3,0,yy*.65);
     c.stroke();
   }
   c.restore();
 }
}
function drawMaterialField(c,f,t){
 const el=f.element,R=f.r;if(!(R>0)||!['water','grass','light','elec','dark'].includes(el))return false;
 const a=clip(f.t/.35),col=({water:'#83d7ee',grass:'#a4c878',light:'#fff0b7',elec:'#bab0f9',dark:'#a589ce'})[el];
 c.save();c.translate(f.x,f.y);
 // Draw the exact gameplay boundary, while keeping the luminous material inside.
 const g=c.createRadialGradient(0,0,0,0,0,R);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(.78,col);g.addColorStop(1,'rgba(0,0,0,0)');
 c.globalAlpha=.12*a;c.fillStyle=g;c.beginPath();c.arc(0,0,R,0,TAU);c.fill();
 stroke(c,col,1.4,.66*a);c.beginPath();c.arc(0,0,R,0,TAU);c.stroke();
 if(el==='water'){for(let j=0;j<5;j++){const th=j*TAU/5+t*.7;stroke(c,j%2?'#d5faff':'#3d91b4',j%2?1.5:3.4,.64*a);c.beginPath();c.ellipse(0,0,R*(.76-.07*j),R*(.76-.07*j),0,th,th+.91);c.stroke();}}
 else if(el==='grass'){for(let j=0;j<9;j++){const th=j*TAU/9,rr=R*(.64+.15*hash(j)),x=Math.cos(th)*rr,y=Math.sin(th)*rr;c.save();c.translate(x,y);c.rotate(th+PI/2);stroke(c,'#4b713e',3.5,.85*a);c.beginPath();c.moveTo(-12,5);c.quadraticCurveTo(0,-15,13,-4);c.stroke();c.globalAlpha=.85*a;poly(c,[[0,-4],[-8,-12],[0,-15],[7,-8]],col);c.restore();}}
 else if(el==='light'){for(let j=0;j<8;j++){const th=j*TAU/8+t*.2,rr=R*.68,x=Math.cos(th)*rr,y=Math.sin(th)*rr;c.globalAlpha=.65*a;poly(c,[[x-3,y],[x,y-11],[x+3,y],[x,y+6]],col);}}
 else{for(let j=0;j<5;j++){const th=j*TAU/5+t*.6,rr=R*.83;stroke(c,col,2,.65*a);path(c,[[Math.cos(th)*rr,Math.sin(th)*rr],[Math.cos(th+.12)*rr*.82,Math.sin(th+.12)*rr*.82],[Math.cos(th+.3)*rr,Math.sin(th+.3)*rr]]);}}
 c.restore();return true;
}

function drawIdentityProjectile(c,p,time=0){
 const kind=p.kind;
 if(!['fireball','lightningOrb','hex'].includes(kind))return drawMaterialProjectile(c,p,time);
 const r=Math.max(2,p.r||12),angle=Number.isFinite(p.ang)?p.ang:0;
 c.save();c.translate(p.x,p.y);c.rotate(angle);c.globalAlpha=1;
 if(kind==='fireball'){
   // Compressed plasma, NOT a rocky meteor. Long narrow wake; incandescent core.
   const tail=r*4.8,g=c.createLinearGradient(-tail,0,r,0);
   g.addColorStop(0,'rgba(140,34,20,0)');g.addColorStop(.36,'rgba(221,61,23,.72)');
   g.addColorStop(.78,'#ff8b36');g.addColorStop(1,'#ffdc76');
   c.fillStyle=g;c.beginPath();c.moveTo(r*.66,0);
   c.bezierCurveTo(r*.8,-r*.92,-r*.55,-r*.97,-tail,-r*.07);
   c.bezierCurveTo(-r*1.35,r*.30,-r*.37,r*1.01,r*.66,0);c.fill();
   for(let i=0;i<5;i++){
     const a=time*15+i*TAU/5,yy=Math.sin(a)*r*.65;
     stroke(c,i%2?'#ffe6a0':'#ff9c42',r*(i%2?.12:.22),.88);
     c.beginPath();c.moveTo(-r*2.9,yy*.35);c.bezierCurveTo(-r*1.35,yy,-r*.15,-yy,r*.58,yy*.3);c.stroke();
   }
   const core=c.createRadialGradient(r*.22,-r*.17,0,0,0,r);
   core.addColorStop(0,'#ffffe9');core.addColorStop(.34,'#fff0a2');
   core.addColorStop(.66,'#ffad39');core.addColorStop(1,'#df4a1c');
   c.globalAlpha=1;point(c,0,0,r*.85,core);
   for(let j=0;j<9;j++){
     const u=(time*4+j/9)%1,yy=(hash(j+5)-.5)*r*(1+u);
     c.globalAlpha=(1-u)*.84;point(c,-r*(1+u*3.8),yy,1+hash(j)*1.7,'#ffd078');
   }
 }else if(kind==='lightningOrb'){
   // Slow spherical electrical volume, with rotating internal arcs and surface forks.
   flare(c,0,0,r*2.35,'#8da4ff',.28);
   const g=c.createRadialGradient(-r*.22,-r*.28,0,0,0,r);
   g.addColorStop(0,'#ffffeb');g.addColorStop(.36,'#f7db88');g.addColorStop(.73,'#a49de8');g.addColorStop(1,'#394283');
   c.globalAlpha=.96;point(c,0,0,r,g);
   for(let j=0;j<6;j++){
     const a=time*5+j*TAU/6,pts=[];
     for(let i=0;i<=8;i++){const t=i/8,rr=r*(.46+.75*t),th=a+Math.sin(i*2.4+j+time*21)*.24;pts.push([Math.cos(th)*rr,Math.sin(th)*rr]);}
     stroke(c,'#5767cf',4.5,.60);path(c,pts);stroke(c,'#fff5c7',1.65,.95);path(c,pts);
   }
   for(let j=0;j<3;j++){stroke(c,'#d8e2ff',1.2,.85);c.beginPath();c.ellipse(0,0,r*.96,r*.36,time*4+j*PI/3,0,TAU);c.stroke();}
 }else{
   // Curse is a readable hollow sigil, not another damage orb.
   c.rotate(time*2.4);for(let j=0;j<3;j++){stroke(c,j===0?'#492961':'#d9a9f8',j===0?5:1.8,.86);
   c.beginPath();for(let i=0;i<=6;i++){let a=i*TAU/6+j*.36,rr=r*(1-j*.21);i?c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):c.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);}c.stroke();}
   flare(c,0,0,r*.75,'#a167d1',.38);
 }
 c.restore();return true;
}
function drawIdentityMotion(c,v,time=0){
 const id=v.skillId,water=id==='gen_water_dash'||id==='knockOff',
 dark=id==='gen_dark_dash'||id==='shadeLeap'||id==='apexPounce',
 elec=id==='staticPounce'||id==='voltRush',grass=id==='quakeStomp',
 light=id==='highGround',fire=id==='gen_fire_dash';
 if(!(water||dark||elec||grass||light||fire))return false;
 const k=clip(v.life/Math.max(.001,v.max)),p=1-k,cast=v.kind==='signatureCast';
 const col=water?'#75dff9':dark?'#c39df1':elec?'#f5dd79':grass?'#b8c18b':light?'#fff0bb':'#ff9750';
 c.save();c.translate(v.x,v.y);c.rotate(v.angle||0);
 if(cast){
   // Local movement accent: never fake a distant hit or second actor.
   if(elec){
     for(let i=-2;i<=2;i++){const y=i*9;stroke(c,i%2?'#a9b7ff':'#fff5b5',i===0?3.4:1.8,k*.88);
       path(c,[[-48,y],[-29,y-7],[-19,y+3],[-5,y-4],[14,y]]);}
   }else if(water){
     for(let j=0;j<4;j++){stroke(c,j%2?'#d8faff':'#369abf',4-j*.5,k*.85);
       c.beginPath();c.moveTo(-48,j*9-14);c.bezierCurveTo(-32,-27+j*9,-13,12+j*6,19,j*5-8);c.stroke();}
   }else if(dark){
     for(let j=0;j<4;j++){c.globalAlpha=k*(.19+j*.1);c.fillStyle=j%2?'#634182':'#30243e';c.beginPath();c.moveTo(12,0);c.quadraticCurveTo(-8,-24+j*6,-61+j*7,-15+j*10);c.quadraticCurveTo(-23,28-j*4,12,0);c.fill();}
   }else if(grass||light){
     for(let j=0;j<5;j++){const x=-28+j*13;stroke(c,col,2.2,k*.85);path(c,[[x,18],[x+Math.sin(j)*6,-12-j%2*7]]);}
   }else{
     for(let j=0;j<5;j++){stroke(c,j%2?'#fff1b7':col,4,k*.8);path(c,[[-48,j*8-20],[-18,j*5-12],[10,j*4-8]]);}
   }
 }else if(grass){
   c.globalAlpha=k*.65;c.fillStyle='#4d4539';c.beginPath();c.ellipse(0,0,30+18*p,12+9*p,0,0,TAU);c.fill();
   for(let j=0;j<8;j++){const a=j*TAU/8,rr=12+36*p;stroke(c,'#49372d',2,k);path(c,[[0,0],[Math.cos(a)*rr*.6,Math.sin(a)*rr*.35],[Math.cos(a+.17)*rr,Math.sin(a+.17)*rr*.63]]);c.globalAlpha=k;rock(c,Math.cos(a)*rr,Math.sin(a)*rr*.65-10*Math.sin(p*PI),3+hash(j)*3,j,p*5);}
 }else if(water){
   for(let j=0;j<11;j++){const a=j*TAU/11,rr=(12+28*p);stroke(c,j%2?'#e6fcff':'#65c9ec',2.5,k);path(c,[[Math.cos(a)*rr*.42,Math.sin(a)*rr*.42],[Math.cos(a)*rr,Math.sin(a)*rr]]);}
 }else if(dark){
   for(let j=0;j<3;j++){stroke(c,j===1?'#f6dcff':'#71469c',j===1?2.8:5,k*.9);c.beginPath();c.moveTo(-24,-16+j*9);c.quadraticCurveTo(15,-25+j*10,31,5+j*7);c.stroke();}
 }else{
   flare(c,0,0,22+11*p,col,k*.6);
   for(let j=0;j<7;j++){const a=j*TAU/7,rr=12+28*p;stroke(c,j%2?col:'#fff9db',2,k);path(c,[[Math.cos(a)*rr*.5,Math.sin(a)*rr*.5],[Math.cos(a)*rr,Math.sin(a)*rr]]);}
 }
 c.restore();return true;
}
function drawElectricStream(c,b,time,ex,ey){
 const x=b._ox,y=b._oy,L=Math.hypot(ex-x,ey-y);if(L<1)return true;
 const w=Math.max(5,(b.width||26)*.46),alpha=clip(Math.min((b.max-b.t)/.07,b.t/.12));
 c.save();c.translate(x,y);c.rotate(Math.atan2(ey-y,ex-x));
 // One continuously connected trunk with several independent, narrower branches.
 for(let strand=0;strand<4;strand++){
   const pts=[[0,0]],step=Math.floor(time*24);
   for(let j=1;j<=24;j++){let u=j/24,edge=Math.sin(PI*u),off=(hash(step*61+j*19+strand*181)-.5)*w*(strand?2.4:1.35)*edge;pts.push([u*L,off]);}
   stroke(c,'#5446a5',strand===0?w*1.65:5,alpha*.28);path(c,pts);
   stroke(c,strand===0?'#d1ceff':'#9d9bff',strand===0?6:2.5,alpha*.85);path(c,pts);
   stroke(c,'#fff8d2',strand===0?2.7:1.2,alpha);path(c,pts);
   if(strand===0)for(let j=4;j<23;j+=4){const [xx,yy]=pts[j],side=j%3===0?1:-1;stroke(c,'#c8c0ff',1.5,alpha*.72);path(c,[[xx,yy],[xx+L*.026,yy+side*w*.85],[xx+L*.055,yy+side*w*.55],[Math.min(L,xx+L*.075),yy+side*w*1.3]]);}
 }
 flare(c,0,0,w*1.15,'#bcb4ff',alpha*.64);flare(c,L,0,w*1.05,'#fff1b0',alpha*.52);
 c.restore();return true;
}

 function drawCombatBeam(c,b,time,ex,ey){
   if(b.sk?.id==='thunderStream')return drawElectricStream(c,b,time,ex,ey);
   const fire=b.sk?.id==='flameSweep',water=b.sk?.id==='waterJet';
   if(!fire&&!water)return false;
   const x=b._ox,y=b._oy,L=Math.hypot(ex-x,ey-y);if(L<1)return true;
   const angle=Math.atan2(ey-y,ex-x),age=b.max-b.t,alpha=Math.min(1,age/.09,b.t/.12);
   const w=(b.width||26)*(fire?.72:.43);
   c.save();c.translate(x,y);c.rotate(angle);c.lineCap='round';c.lineJoin='round';
   // Separate physical materials: turbulent combustion vs dense moving liquid.
   // The hit box is untouched. Core width stays inside the real damage corridor.
   const A=clip(alpha),N=36;
   for(const [layer,mul,colors,opacity] of (fire?
     [[0,1.55,['#7c2c26','#d34923','#7d2e20'],.45],[1,1.03,['#ff9d30','#f56923','#fca23c'],.95],[2,.63,['#fff2a4','#ffcf4d','#fff0ae'],1],[3,.25,['#ffffeb','#fff4b8','#ffffe2'],1]]:
     [[0,1.63,['#1a658c','#48a5ce','#247bac'],.35],[1,1.12,['#1f8bb8','#41c4e7','#227ca4'],.95],[2,.70,['#a8f3ff','#68daf3','#c4f8ff'],.95],[3,.25,['#efffff','#ddfcff','#fff'],.97]])){
     c.globalAlpha=A*opacity;
     const grad=c.createLinearGradient(0,-w*mul,0,w*mul);
     grad.addColorStop(0,colors[0]);grad.addColorStop(.48,colors[1]);grad.addColorStop(1,colors[2]);c.fillStyle=grad;c.beginPath();
     for(const side of [-1,1])for(let j=0;j<=N;j++){
       const u=(side===-1?j:N-j)/N,edge=(.35+.65*Math.min(1,u*9))*(1-(fire?.18:.04)*u);
       const phase=u*(fire?31:22)-time*(fire?28:34);
       const turbulence=fire?Math.sin(phase+side+layer)*.19+Math.sin(phase*2.31-layer*1.7)*.09:Math.sin(phase+layer)*.12+Math.cos(phase*1.6+side)*.065;
       const yy=side*w*mul*edge*(1+turbulence*(layer===3?.24:1));
       if(side===-1&&j===0)c.moveTo(u*L,yy);else c.lineTo(u*L,yy);
     }c.closePath();c.fill();
   }
   for(let j=0;j<(fire?32:26);j++){
     const u=((j/32+time*(fire?1.25:1.9))%1+1)%1,side=hash(j+3)>.5?1:-1;
     const yy=side*w*(.15+.76*hash(j+20)),xx=u*L,span=Math.min(L-xx,12+hash(j+6)*33);
     stroke(c,fire?(j%3?'#ffce66':'#fff5d2'):(j%3?'#d5fcff':'#227eae'),1+hash(j)*2,A*(.35+hash(j+7)*.45));
     c.beginPath();c.moveTo(xx,yy);c.quadraticCurveTo(xx+span*.48,yy+Math.sin(time*20+j)*w*.25,xx+span,yy*.76);c.stroke();
     if(fire&&j%3===0){
       c.globalAlpha=A*.78;point(c,xx,yy*1.35,1.2+hash(j)*1.5,'#ffd18b');
     }
   }
   flare(c,0,0,w*1.08,fire?'#ffc758':'#b9f5ff',A*.70);
   if(water){
     // Pressurized white foam, directional spray; do not create a second damage area.
     flare(c,L,0,w*1.85,'#91edff',A*.64);
     for(let j=0;j<19;j++){
       const u=(time*3+j/19)%1,th=(hash(j+18)-.5)*PI*1.8;
       const xx=L+Math.cos(th)*u*w*2.5,yy=Math.sin(th)*u*w*3.3;
       stroke(c,j%3?'#d7faff':'#55c9ed',1.5+hash(j)*2,A*(1-u)*.82);
       path(c,[[xx,yy],[xx-Math.cos(th)*w*.48,yy-Math.sin(th)*w*.5]]);
     }
   }
   c.restore();return true;
 }
 function drawHeavyImpact(c,v,spec){
   const p=1-clip(v.life/v.max),a=clip(v.life/.24),r=36+(v.heavy?14:0);
   c.save();c.translate(v.x,v.y);c.rotate(v.angle||0);
   if(p<.5)flare(c,0,0,r*.9,spec.color,a*(1-p*2)*.8);
   for(let i=0;i<9;i++){const th=i*2.399,dist=r*(.18+p*.98),x=Math.cos(th)*dist,y=Math.sin(th)*dist*.72;
     stroke(c,i%3===0?'#fff9e7':spec.color,2.5*(1-p)+.6,a*.85);
     path(c,[[x,y],[x+Math.cos(th)*r*.26,y+Math.sin(th)*r*.22]]);}
   c.restore();
 }


// Support effects use separate material silhouettes rather than generic rings.
function drawIdentitySupport(c,v,time=0){
 const id=v.skillId,shield=id==='bubbleVeil'||id==='guardStance',heal=id==='grooming'||id==='dawnHeal'||id==='tenderPaw',plant=id==='photosynth',aura=id==='blessFur',counter=id==='puffHiss';
 if(!(shield||heal||plant||aura||counter)||v.kind!=='signatureCast')return false;
 const k=clip(v.life/Math.max(.001,v.max)),p=1-k;
 c.save();c.translate(v.x,v.y);
 if(shield){
   const r=27+6*ease(p),g=c.createRadialGradient(-r*.25,-r*.32,0,0,0,r);
   g.addColorStop(0,'rgba(220,252,255,.02)');g.addColorStop(.72,'rgba(98,199,230,.12)');g.addColorStop(1,'rgba(209,251,255,.65)');
   c.globalAlpha=k;point(c,0,0,r,g);
   for(let j=0;j<3;j++){stroke(c,j===0?'#f4ffff':'#6ebad9',j===0?2.7:1.6,k*.95);c.beginPath();c.arc(0,0,r-j*2,-2.7+j*.35,.08+j*.45);c.stroke();}
   if(id==='guardStance'){stroke(c,'#f5d28d',3,k);path(c,[[-17,6],[0,-19],[17,6],[0,23],[-17,6]]);}
 }else if(plant){
   for(let j=0;j<6;j++){
     const a=j*TAU/6,x=Math.cos(a)*29,y=Math.sin(a)*13,stem=18*ease(p);
     stroke(c,'#649e4a',2.4,k);c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x-5,y-stem*.5,x,y-stem);c.stroke();
     c.globalAlpha=k*.9;poly(c,[[x,y-stem],[x-12,y-stem-5],[x-7,y-stem+5]],'#a9d875');poly(c,[[x,y-stem],[x+12,y-stem-5],[x+7,y-stem+5]],'#e1eca2');
   }
 }else if(counter){
   for(let j=0;j<12;j++){const a=j*TAU/12,r=23+4*ease(p),x=Math.cos(a)*r,y=Math.sin(a)*r*.75; c.globalAlpha=k*.8;poly(c,[[x-3,y+3],[x+Math.cos(a)*15,y+Math.sin(a)*12],[x+5,y+1]],j%2?'#ffe0a7':'#bd5b32');}
 }else{
   const color=aura?'#f9cf7c':id==='grooming'?'#aee8db':'#ffd6d5';
   for(let j=0;j<(aura?8:6);j++){const a=j*TAU/8+time*.9,phase=(p+j/8)%1,x=Math.cos(a)*(aura?40:24),y=15+Math.sin(a)*8-phase*36;
     c.globalAlpha=k*Math.sin(PI*phase);if(aura){poly(c,[[x-3,y],[x,y-8],[x+3,y],[x,y+8]],color);}else{stroke(c,color,2.8,k*Math.sin(PI*phase));path(c,[[x-4,y],[x+4,y]]);path(c,[[x,y-4],[x,y+4]]);}}
 }
 c.restore();return true;
}

function draw(ctx,v,time=0){
 if(v?.meteorGround)return drawMeteorGround(ctx,v);
 const spec=REG[v?.skillId];if(!spec||!ctx)return false;
 if(isMeleeId(v.skillId))return drawMeleeContact(ctx,v,spec);
 if(drawIdentityMotion(ctx,v,time))return true;
 if(drawIdentitySupport(ctx,v,time))return true;
 const p=1-clip(v.life/Math.max(.001,v.max)),k=clip(v.life/v.max),r=spec.r;
 const cast=v.kind==='signatureCast',angle=v.angle||0;
 ctx.save();ctx.translate(v.x,v.y);ctx.rotate(angle);
 ctx.globalAlpha=clip(k*(cast?.72:.90));ctx.globalCompositeOperation='source-over';
 const g=spec.seed,style=spec.style,color=spec.color,R=cast?r:Math.min(43,r*.76);
 const spin=(time||0)*2.7+g*.91;
 // Real-game review found some signatures nearly invisible against the pale
 // watercolor garden. Paint a LOCAL dark-edged watercolor wash behind each
 // shape, never an additive/full-screen bloom or giant covering disc.
 const dark=(
  ['thunder','chain','orb','dash','wall'].includes(style)?'#56659b':
  ['flame','ball','claw','comet'].includes(style)?'#9d5049':
  ['vine','leaf','seed','thorn','sun'].includes(style)?'#4f8158':
  ['stream','whip','pool','ice','bubble'].includes(style)?'#417e9d':
  ['shadow','mist','hex','slash'].includes(style)?'#665386':'#8b7883');
 const wash=ctx.createRadialGradient(0,0,R*.10,0,0,R*.90);
 wash.addColorStop(0,cast?'rgba(255,250,229,.32)':'rgba(255,252,238,.52)');
 wash.addColorStop(.38,cast?'rgba(94,72,107,.14)':'rgba(81,58,95,.18)');
 wash.addColorStop(1,'rgba(50,40,60,0)');
 ctx.globalAlpha=cast?k*.71:k*.87;
 ctx.fillStyle=wash;ctx.beginPath();ctx.arc(0,0,R*.9,0,TAU);ctx.fill();
 // A directional outer rim differentiates cast animation from contact.
 ctx.globalAlpha=k*(cast?.63:.78);ctx.strokeStyle=dark;
 ctx.lineWidth=cast?2.4:3.6;ctx.beginPath();
 ctx.arc(0,0,R*(cast?.57:.72),g*.21+p*.9,g*.21+p*.9+PI*(cast?.7:1.35));ctx.stroke();
 ctx.globalAlpha=k*(cast?.72:.90);
 if(style==='claw'||style==='slash'||style==='shadow'||style==='fang'){
  for(let j=0;j<(style==='fang'?2:3);j++){
   const yy=(j-1)*9;
   stroke(ctx,j%2?'#fff6dc':color,style==='slash'?5.2:3.9,k*.86);
   ctx.beginPath();ctx.moveTo(-R*.36,yy-R*.38);
   ctx.bezierCurveTo(R*.06,yy-R*.51,R*.5,yy-R*.12,R*.51,yy+R*.27);
   ctx.stroke();
  }
 }else if(style==='dash'||style==='comet'||style==='paw'){
  for(let j=0;j<4;j++){
   const y=(j-1.5)*10;
   stroke(ctx,j===1?'#fff9e7':color,3+j%2,k*.8);
   path(ctx,[[-R*.65,y+4],[-R*.33,y-3],[R*.03,y-7],[R*.48,y-2]]);
  }
  if(style==='paw'){
   point(ctx,R*.15,R*.09,8,color);
   for(let j=0;j<3;j++)point(ctx,R*.08+j*9,-R*.16-j%2*4,3,color);
  }
 }else if(style==='stream'||style==='whip'||style==='flame'||style==='thunder'||style==='chain'||style==='thorn'){
  for(let j=0;j<3;j++){
   stroke(ctx,j===0?color:j===1?'#fff8dc':'#9dceef',j===0?8:j===1?3:1.4,k*(j===0?.46:.9));
   const pts=[];for(let u=0;u<=12;u++){
    const x=12+u*R*.075,y=Math.sin(u*.75+spin+j)*R*.11*(1-u/18);
    pts.push([x,y+(j-1)*5]);
   }path(ctx,pts);
  }
  if(style==='chain'||style==='thunder')for(let j=0;j<2;j++){
   stroke(ctx,'#e9efff',2,k*.8);
   path(ctx,[[R*.23,0],[R*.40,j?21:-18],[R*.61,j?14:-23]]);
  }
  if(style==='flame')for(let j=0;j<7;j++){
   ctx.save();ctx.translate(R*(.16+j*.12),(j-3)*7);ctx.rotate(-.15+j*.09);
   ctx.globalAlpha=k*(.37+.24*(j%3===0));ctx.fillStyle=j%2?'#ffb160':'#fff0ac';
   ctx.beginPath();ctx.moveTo(-6,7);ctx.quadraticCurveTo(-9,-5,7,-17);
   ctx.quadraticCurveTo(3,-2,8,7);ctx.closePath();ctx.fill();ctx.restore();
  }
 }else if(style==='ball'||style==='orb'||style==='bubble'||style==='seed'||style==='spores'){
  for(let j=0;j<5;j++){
   const th=j*TAU/5+spin*.21,rr=R*(.40+.18*p);
   const x=Math.cos(th)*rr,y=Math.sin(th)*rr*.62;
   stroke(ctx,color,2.4,k*.75);ctx.beginPath();ctx.arc(x,y,style==='spores'?3.5:6.5,0,TAU);ctx.stroke();
  }
  ctx.globalAlpha=k*.78;point(ctx,R*.22,0,style==='ball'?17:14,color);
  ctx.globalAlpha=k*.85;point(ctx,R*.18,-3,style==='ball'?7:6,'#fff7e5');
  if(style==='orb'){
    for(let j=0;j<5;j++){
      const a=j*TAU/5+spin*.7,rad=R*.45;
      stroke(ctx,j%2?'#eef4ff':'#7c83d8',2,k*.85);
      path(ctx,[[Math.cos(a)*rad,Math.sin(a)*rad],
        [Math.cos(a+.21)*(rad+7),Math.sin(a+.21)*(rad+7)],
        [Math.cos(a-.12)*(rad+12),Math.sin(a-.12)*(rad+12)]]);
    }
  }
 }else if(style==='leaf'||style==='vine'||style==='ice'||style==='hex'||style==='box'||style==='wall'){
  for(let j=0;j<(style==='wall'?3:5);j++){
   const th=j*TAU/5+spin*.08;
   ctx.save();ctx.rotate(th);ctx.globalAlpha=k*.74;
   stroke(ctx,color,style==='vine'?4:2.5,ctx.globalAlpha);
   ctx.beginPath();
   if(style==='box'||style==='wall')ctx.rect(-R*.22,-R*.46,R*.44,R*.64);
   else if(style==='hex'){
    for(let z=0;z<6;z++){const a=z*TAU/6;
      const x=Math.cos(a)*R*.35,y=Math.sin(a)*R*.35;z?ctx.lineTo(x,y):ctx.moveTo(x,y);}
    ctx.closePath();
   }else{ctx.ellipse(0,-R*.35,R*.12,style==='ice'?R*.32:R*.23,-.2,0,TAU);}
   ctx.stroke();ctx.restore();
  }
 }else if(style==='knead'){
  // Knead (踩奶) has its own rhythmic, alternating PAW-PAD animation.
  // Four stacks are represented separately as in-combat progress feedback.
  const pulse=Math.sin(time*19+g*.31);
  for(let j=0;j<2;j++){
   const x=(j?1:-1)*R*.28,y=R*.13+(j?1:-1)*pulse*R*.15;
   ctx.save();ctx.translate(x,y);ctx.rotate((j?1:-1)*.21);
   ctx.fillStyle=j?'#e7b390':'#f8d7ba';ctx.globalAlpha=k*.8;
   ctx.beginPath();ctx.ellipse(0,5,9,6,0,0,TAU);ctx.fill();
   for(let q=0;q<3;q++){
    ctx.beginPath();ctx.ellipse((q-1)*7,-5,3,4,0,0,TAU);ctx.fill();
   }
   stroke(ctx,'#fff5e6',1.8,k*.83);
   ctx.beginPath();ctx.ellipse(0,5,9,6,0,0,TAU);ctx.stroke();
   ctx.restore();
  }
  stroke(ctx,'#f5c9a5',2,k*.49);ctx.beginPath();
  ctx.ellipse(0,R*.25,R*.7,R*.31,0,0,TAU);ctx.stroke();
 }else if(style==='heal'||style==='heart'||style==='sun'||style==='halo'||style==='shield'||style==='pool'||style==='stomp'||style==='fur'||style==='mist'||style==='prism'){
  for(let j=0;j<3;j++){
   const radius=R*(.24+.14*j+.14*p);
   stroke(ctx,j%2?color:'#fff9e6',j===0?5:2.5,k*(.78-j*.17));
   ctx.beginPath();ctx.ellipse(0,0,radius,radius*(style==='pool'||style==='stomp'?.46:.83),0,0,TAU);ctx.stroke();
  }
  if(style==='heart'){
   ctx.globalAlpha=k*.9;ctx.fillStyle='#ffd4de';ctx.font='18px sans-serif';ctx.textAlign='center';ctx.fillText('♥',0,-R*.18);
  }
  if(style==='fur')for(let j=0;j<7;j++)point(ctx,Math.cos(j*TAU/7)*R*.5,Math.sin(j*TAU/7)*R*.4,3,color);
 }
 // Every duplicated attack family gets its own recognizable secondary shape.
 identityDetail(ctx,v.skillId,R,k,p,spin,cast);
 // High-contrast contact kick: short directional starbursts, NEVER the giant
 // near-white disk from an ultimate or a second full-strength generic impact.
 if(!cast){
  for(let j=0;j<6;j++){
    const theta=j*TAU/6+g*.31;
    const r0=R*(.28+.08*(j%2)),r1=R*(.66+.12*(j%3));
    stroke(ctx,j%2?dark:'#fff7d8',j%2?2.1:3.6,k*(j%2?.68:.95));
    path(ctx,[[Math.cos(theta)*r0,Math.sin(theta)*r0],
      [Math.cos(theta)*r1,Math.sin(theta)*r1]]);
  }
  for(let j=0;j<3;j++){
   const a=j*TAU/3+g*.37,xx=Math.cos(a)*R*.55,yy=Math.sin(a)*R*.55;
   stroke(ctx,'#fffdf3',1.8,k*.92);path(ctx,[[xx-4,yy],[xx+4,yy],[xx,yy-4],[xx,yy+4]]);
  }
 }
 ctx.restore();return true;
}
// ALL combat TAG_INFO statuses deserve readable, localized, persistent shapes.
// This rendering is cosmetic only. No whole-screen flashes or large overlays.
const ACTIVE={
 burn:'#f58e5d',soak:'#80d7f2',shock:'#f6d776',oil:'#b8a3d2',
 chill:'#b8e9fc',dizzy:'#c6a9f5',bleed:'#e78086',
 blind:'#ffe5ab',bind:'#82ca84',expose:'#ed9ed5',
 weaken:'#aea0c8',rust:'#d1a06e',rewind:'#b9a5fa'
};
// Persistent, 3-star orbit for a real DIZZY/hard-stunned cat, including allies.
function drawDizzyStars(ctx,x,y,time=0,remaining=0){
 if(!ctx||!(remaining>0))return false;
 const alpha=Math.min(1,remaining/.24),angle0=time*3.8,top=y-41;
 ctx.save();ctx.lineJoin='round';
 for(let i=0;i<3;i++){
  const angle=angle0+i*TAU/3,depth=(1+Math.sin(angle))*.5;
  const cx=x+Math.cos(angle)*24,cy=top+Math.sin(angle)*6,rad=4.4+1.5*depth;
  ctx.save();ctx.globalAlpha=alpha*(.72+.27*depth);
  ctx.fillStyle=i===1?'#fff2bf':i===2?'#f5d18f':'#fffbea';
  ctx.strokeStyle='#9f8659';ctx.lineWidth=1.05;
  ctx.beginPath();
  for(let j=0;j<10;j++){
   const th=j*Math.PI/5-Math.PI/2,r=j%2?rad*.43:rad;
   const px=cx+Math.cos(th)*r,py=cy+Math.sin(th)*r;
   if(j)ctx.lineTo(px,py);else ctx.moveTo(px,py);
  }
  ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
 }
 ctx.restore();return true;
}
function drawStatus(ctx,unit,time=0){
 if(!ctx||!unit)return false;
 const tags=Object.keys(unit.status||{}).filter(
   tag=>(unit.status[tag]||0)>0&&ACTIVE[tag]).slice(0,3);
 const knead=unit.kneadT>0&&unit.kneadStacks>0;
 if(!tags.length&&!knead)return false;
 ctx.save();
 tags.forEach((tag,i)=>{
  // Keep the stun halo ABOVE the head, never duplicate the ear-side marks.
  if(tag==='dizzy'){drawDizzyStars(ctx,unit.x,unit.y,time,unit.status.dizzy);return;}
  const col=ACTIVE[tag],phase=time*(tag==='shock'?13:3.3)+i*1.6;
  const rad=31+i*4,a0=phase+i*2.1;
  const x=unit.x+Math.cos(a0)*rad;
  const y=unit.y+17+Math.sin(a0)*5;
  const a=Math.max(.4,Math.min(.83,(unit.status[tag]||0)*1.8));
  ctx.save();ctx.globalAlpha=a;ctx.strokeStyle=col;ctx.fillStyle=col;
  ctx.lineWidth=2.4;ctx.lineCap='round';ctx.lineJoin='round';
  if(tag==='burn'){
   ctx.beginPath();ctx.moveTo(x-5,y+7);
   ctx.quadraticCurveTo(x-9,y-2,x,y-12);
   ctx.quadraticCurveTo(x+2,y-3,x+8,y+1);
   ctx.quadraticCurveTo(x+8,y+8,x-5,y+7);ctx.fill();
  }else if(tag==='soak'||tag==='oil'||tag==='bleed'){
   ctx.beginPath();ctx.moveTo(x,y-10);
   ctx.bezierCurveTo(x-8,y,x-7,y+8,x,y+9);
   ctx.bezierCurveTo(x+7,y+8,x+8,y,x,y-10);ctx.fill();
   ctx.globalAlpha=a*.6;ctx.strokeStyle='#fff6e4';
   ctx.beginPath();ctx.moveTo(x-2,y+2);ctx.lineTo(x-1,y+5);ctx.stroke();
  }else if(tag==='shock'){
   ctx.lineWidth=3.2;ctx.beginPath();ctx.moveTo(x-6,y-12);
   ctx.lineTo(x+3,y-5);ctx.lineTo(x-4,y+2);
   ctx.lineTo(x+7,y+10);ctx.stroke();
   ctx.strokeStyle='#fff';ctx.lineWidth=1.1;ctx.stroke();
  }else if(tag==='chill'){
   for(let j=0;j<3;j++){
    const th=j*Math.PI/3,dx=Math.cos(th)*11,dy=Math.sin(th)*11;
    ctx.beginPath();ctx.moveTo(x-dx,y-dy);ctx.lineTo(x+dx,y+dy);ctx.stroke();
   }
   ctx.fillStyle='#f4ffff';ctx.beginPath();ctx.arc(x,y,2,0,TAU);ctx.fill();
  }else if(tag==='blind'){
   ctx.beginPath();ctx.ellipse(x,y,11,5,0,0,TAU);ctx.stroke();
   ctx.beginPath();ctx.moveTo(x-12,y+8);ctx.lineTo(x+12,y-9);ctx.stroke();
  }else if(tag==='bind'){
   ctx.beginPath();ctx.ellipse(unit.x,unit.y+18,23,7,0,0,TAU);ctx.stroke();
   ctx.beginPath();ctx.moveTo(x,y+7);
   ctx.bezierCurveTo(x-8,y,x+8,y-7,x,y-12);ctx.stroke();
   ctx.fillStyle='#b9e6a2';ctx.beginPath();ctx.ellipse(x+5,y-4,6,3,-.5,0,TAU);ctx.fill();
  }else if(tag==='expose'){
   ctx.beginPath();ctx.arc(x,y,9,0,TAU);ctx.stroke();
   for(const d of [-1,1]){
    ctx.beginPath();ctx.moveTo(x+d*9,y);ctx.lineTo(x+d*15,y);
    ctx.moveTo(x,y+d*9);ctx.lineTo(x,y+d*15);ctx.stroke();
   }
  }else if(tag==='weaken'){
   ctx.beginPath();ctx.moveTo(x-9,y-10);
   ctx.lineTo(x+1,y+1);ctx.lineTo(x+6,y-4);
   ctx.lineTo(x+6,y+10);ctx.stroke();
   ctx.beginPath();ctx.moveTo(x-4,y+6);ctx.lineTo(x+6,y+12);ctx.stroke();
  }else if(tag==='rust'){
   ctx.beginPath();
   for(let j=0;j<8;j++){
    const th=j*TAU/8,r=j%2?6:11;
    j?ctx.lineTo(x+Math.cos(th)*r,y+Math.sin(th)*r):
      ctx.moveTo(x+Math.cos(th)*r,y+Math.sin(th)*r);
   }ctx.closePath();ctx.stroke();
   ctx.beginPath();ctx.arc(x,y,3,0,TAU);ctx.fill();
  }else if(tag==='rewind'){
   ctx.beginPath();ctx.arc(x,y,10,.24,TAU*.9);ctx.stroke();
   ctx.beginPath();ctx.moveTo(x-12,y-7);
   ctx.lineTo(x-11,y+2);ctx.lineTo(x-3,y-2);ctx.stroke();
   ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-6);
   ctx.moveTo(x,y);ctx.lineTo(x+5,y+2);ctx.stroke();
  }
  ctx.restore();
 });
 if(knead){
  const n=Math.min(4,Math.max(1,unit.kneadStacks));
  for(let i=0;i<n;i++){
   const x=unit.x+(i-(n-1)/2)*9,y=unit.y+24+Math.sin(time*12+i*Math.PI)*2;
   ctx.globalAlpha=.6;ctx.fillStyle='#e9b9ad';
   ctx.beginPath();ctx.ellipse(x,y,4,2.8,0,0,TAU);ctx.fill();
   for(let j=0;j<3;j++){
    ctx.beginPath();ctx.arc(x+(j-1)*3,y-5,1.3,0,TAU);ctx.fill();
   }
  }
 }
 ctx.restore();return true;
}
window.CatBondSkillFX={
 // `ids` is a live getter (not frozen): it syncs the generic template skills on first
 // access, so it reflects the full roster however the modules were load-ordered.
 get ids(){ syncGenerics(); return LIST.map(row=>row[0]); },
 has:id=>{ if(!REG[id])syncGenerics(); return !!REG[id]; },
 cast,support,hit,draw,drawStatus,drawDizzyStars,drawMeteorFlight,meteorImpact,drawCombatBeam,drawIdentityProjectile,drawMaterialField,drawTravel};
})();