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
['tenderPaw','heart','#ffc6d5',44,38]
];
const REG=Object.fromEntries(LIST.map(([id,style,color,r,seed])=>[id,{style,color,r,seed}]));
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
 const g=REG[sk.id],dur=['beam','aoe','pounce','dash'].includes(sk.kind)?.51:.36;
 push(b,{kind:'signatureCast',skillId:sk.id,x:f.x,y:f.y,angle:aim||0,
  life:dur,max:dur,seed:g.seed});
 return true;
}
function support(b,recipient,sk){
 if(!b||!recipient||!REG[sk?.id])return false;
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
 const dur=big?.36:.25;
 push(b,{kind:'signatureHit',skillId:sk.id,x:target.x,y:target.y,
  angle:Math.atan2(target.y-b.me().y,target.x-b.me().x),
  life:dur,max:dur,seed:g.seed,heavy:!!big});
 return true;
}
function draw(ctx,v,time=0){
 const spec=REG[v?.skillId];if(!spec||!ctx)return false;
 const p=1-clip(v.life/Math.max(.001,v.max)),k=clip(v.life/v.max),r=spec.r;
 const cast=v.kind==='signatureCast',angle=v.angle||0;
 ctx.save();ctx.translate(v.x,v.y);ctx.rotate(angle);
 ctx.globalAlpha=clip(k*(cast?.72:.90));ctx.globalCompositeOperation='source-over';
 const g=spec.seed,style=spec.style,color=spec.color,R=cast?r:Math.min(35,r*.62);
 const spin=(time||0)*2.7+g*.91;
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
  if(style==='flame')for(let j=0;j<5;j++){
   ctx.globalAlpha=k*.34;point(ctx,R*(.2+j*.13),(j-2)*7,6+j%3*2,j%2?'#ffb160':'#ffdf96');
  }
 }else if(style==='ball'||style==='orb'||style==='bubble'||style==='seed'||style==='spores'){
  for(let j=0;j<5;j++){
   const th=j*TAU/5+spin*.21,rr=R*(.40+.18*p);
   const x=Math.cos(th)*rr,y=Math.sin(th)*rr*.62;
   stroke(ctx,color,2.4,k*.75);ctx.beginPath();ctx.arc(x,y,style==='spores'?3.5:6.5,0,TAU);ctx.stroke();
  }
  ctx.globalAlpha=k*.5;point(ctx,R*.22,0,style==='ball'?14:10,color);
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
 // Two small distinct glints mark contact; never obscure a kitten's face.
 if(!cast){
  for(let j=0;j<3;j++){
   const a=j*TAU/3+g*.37,xx=Math.cos(a)*R*.55,yy=Math.sin(a)*R*.55;
   stroke(ctx,'#fffdf3',1.8,k*.92);path(ctx,[[xx-4,yy],[xx+4,yy],[xx,yy-4],[xx,yy+4]]);
  }
 }
 ctx.restore();return true;
}
const ACTIVE={burn:'#f5a060',shock:'#ffe196',bleed:'#e77c89',expose:'#eab0ec',
 weaken:'#beb4d9',rust:'#e5b67b',soak:'#9dd8f0',oil:'#c6b5a8'};
function drawStatus(ctx,unit,time=0){
 if(!ctx||!unit?.status)return false;
 const tags=Object.keys(unit.status).filter(tag=>unit.status[tag]>0&&ACTIVE[tag]).slice(0,3);
 if(!tags.length)return false;
 ctx.save();
 tags.forEach((tag,i)=>{
  const col=ACTIVE[tag],phase=time*(tag==='shock'?16:3.6)+i*1.7;
  const x=unit.x+Math.cos(phase+i*3)*19,y=unit.y+11+Math.sin(phase+i*2)*9;
  ctx.globalAlpha=tag==='shock'?.75:.52;
  if(tag==='shock'){
   stroke(ctx,col,2,ctx.globalAlpha);path(ctx,[[x-6,y-8],[x+2,y-3],[x-2,y+4],[x+6,y+7]]);
  }else if(tag==='burn'||tag==='bleed'){
   point(ctx,x,y,tag==='burn'?3.5:2.5,col);
   stroke(ctx,col,1.8,ctx.globalAlpha);path(ctx,[[x,y],[x-1.5,y+9]]);
  }else if(tag==='expose'){
   stroke(ctx,col,1.7,ctx.globalAlpha);
   ctx.beginPath();ctx.arc(unit.x,unit.y,26,0,TAU);ctx.stroke();
   path(ctx,[[unit.x-32,unit.y],[unit.x-23,unit.y]]);
  }else{
   stroke(ctx,col,2.1,ctx.globalAlpha);ctx.beginPath();
   ctx.ellipse(unit.x,unit.y+14,20+i*4,6,0,0,TAU);ctx.stroke();
  }
 });
 ctx.restore();return true;
}
window.CatBondSkillFX={ids:Object.freeze(LIST.map(row=>row[0])),has:id=>!!REG[id],
 cast,support,hit,draw,drawStatus};
})();