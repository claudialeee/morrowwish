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
['knead','knead','#f7d4b4',49,39]
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
 if(!b||!target||!REG[sk?.id]||!(dealt>0)||sk?.ultCost)return false;
 if(continuous){
  const key=sk.id+':'+(target.i??target.cat?.uid??'target');
  b._sigHitAt??=new Map();
  if(b.t-(b._sigHitAt.get(key)??-99)<.22)return false;
  b._sigHitAt.set(key,b.t);
 }
 const g=REG[sk.id],big=(sk.heavy||['melee','dash','leap','pounce'].includes(sk.kind));
 const dur=sk.kind==='melee'?(sk.heavy?.26:.22):(big?.36:.25);
 push(b,{kind:'signatureHit',skillId:sk.id,x:target.x,y:target.y,
  angle:Math.atan2(target.y-b.me().y,target.x-b.me().x),
  life:dur,max:dur,seed:g.seed,heavy:!!big});
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
const MELEE_IDS=new Set(['emberClaw','shadowSwipe','batAround','thornCoil',
 'cometClaw','tidalBite','thornLash','veteranStrike']);
function isMeleeId(id){
 return MELEE_IDS.has(id)||/^gen_(fire|water|grass|elec|dark|light)_melee$/.test(id);
}
function drawMeleeContact(ctx,v,spec){
 if(v.kind==='signatureCast')return true; // the moving claw brush owns this phase
 const k=clip(v.life/v.max),p=1-k,R=Math.min(32,spec.r*.54);
 const sk=window.Skills?.skillById?.(v.skillId);
 const el=sk?.element||(/^gen_([^_]+)_melee$/.exec(v.skillId)||[])[1]||'fire';
 const heavy=!!v.heavy,spin=(v.seed||0)*.71;
 ctx.save();ctx.translate(v.x,v.y);ctx.rotate(v.angle||0);
 ctx.lineCap='round';ctx.lineJoin='round';
 const strength=k*(heavy?.96:.8);
 // Three tiny directional contact splinters, not a second full claw sweep.
 for(let j=-1;j<=1;j++){
  const y=j*R*.29,reach=R*(.40+.08*(j+1))*(1+.18*p);
  stroke(ctx,j===0?'#fff8ea':spec.color,heavy?2.6:1.7,strength*(j===0?.9:.62));
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
function draw(ctx,v,time=0){
 const spec=REG[v?.skillId];if(!spec||!ctx)return false;
 if(isMeleeId(v.skillId))return drawMeleeContact(ctx,v,spec);
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
 cast,support,hit,draw,drawStatus,drawDizzyStars};
})();