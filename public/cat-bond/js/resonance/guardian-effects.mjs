// Each motif is clipped to the real hit area. The white fuse empties at impact.
const palettes={
 surge:["#375875","#ffe5a0"],roots:["#304731","#e0f0a4"],
 embers:["#8f372c","#ffd39a"],gale:["#24586b","#cdf6ff"],
 mirror:["#523b75","#e7d8ff"],orbit:["#695128","#ffe8a6"],
 eclipse:["#44234f","#f2baff"]
};

export function guardianColors(kind,element){
 return palettes[kind==="orbit"&&element==="dark"?"eclipse":kind];
}

function motif(ctx,kind,r,phase){
 switch(kind){
  case "gale":
   for(let row=-1;row<=1;row++){
    ctx.moveTo(-r,row*7-4);ctx.lineTo(r*.75,row*7);ctx.lineTo(-r,row*7+4);
   }
   break;
  case "surge":
   for(let row=-1;row<=1;row++){
    ctx.moveTo(-r,row*7);
    ctx.bezierCurveTo(-r/2,row*7+7,0,row*7-7,r,row*7);
   }
   break;
  case "roots":
   for(let i=0;i<5;i++){
    ctx.rotate(Math.PI*2/5);
    ctx.moveTo(0,0);ctx.quadraticCurveTo(r*.53,-r*.25,r*.92,0);
    ctx.moveTo(r*.38,-r*.08);ctx.lineTo(r*.67,r*.18);
   }
   break;
  case "embers":
   for(let i=0;i<5;i++){
    ctx.rotate(Math.PI*2/5);
    ctx.moveTo(r*.27,0);ctx.lineTo(r*.68,-r*.10);ctx.lineTo(r*.92,0);ctx.lineTo(r*.68,r*.10);ctx.closePath();
   }
   break;
  case "mirror":
   ctx.rotate(Math.PI/4);
   ctx.rect(-r*.49,-r*.49,r*.98,r*.98);
   ctx.moveTo(-r*.49,-r*.15);ctx.lineTo(r*.49,-r*.15);
   ctx.moveTo(-r*.49,r*.15);ctx.lineTo(r*.49,r*.15);
   break;
  case "orbit":
   for(let i=0;i<3;i++){
    ctx.rotate(Math.PI/3);
    ctx.ellipse(0,0,r*.81,r*.28,phase*.45,0,Math.PI*2);
   }
   break;
 }
}

export function drawGuardianCast(ctx,kind,cast,elapsed){
 const impact=elapsed!==undefined;
 const phase=impact?Math.min(1,elapsed/.38):1-cast.remaining/cast.max;
 const [wash,ink]=guardianColors(kind,cast.element);
 for(const p of cast.patterns){
  const lane=p.shape==="line";
  const length=lane?Math.hypot(p.x2-p.x1,p.y2-p.y1):0;
  const r=lane?p.w/2:p.r;
  ctx.save();
  if(lane){
   ctx.translate((p.x1+p.x2)/2,(p.y1+p.y2)/2);
   ctx.rotate(Math.atan2(p.y2-p.y1,p.x2-p.x1));
  }else ctx.translate(p.x,p.y);
  ctx.beginPath();
  if(lane)ctx.roundRect(-length/2-r,-r,length+2*r,2*r,r);
  else ctx.arc(0,0,r,0,Math.PI*2);
  ctx.globalAlpha=impact?.52*(1-phase):.20+.16*phase;
  ctx.fillStyle=wash;ctx.fill();
  if(!impact){
   ctx.strokeStyle=wash;ctx.globalAlpha=.70;ctx.lineWidth=4;ctx.stroke();
  }
  ctx.strokeStyle=ink;ctx.globalAlpha=impact?1-phase:.95;
  ctx.lineWidth=impact?4:1.8;ctx.stroke();ctx.clip();
  ctx.globalAlpha*=.70;
  ctx.lineWidth=1.5;
  const repeats=lane?Math.ceil(length/68):0;
  for(let i=-repeats;i<=repeats;i++){
   ctx.save();ctx.translate(i*34,0);ctx.beginPath();
   motif(ctx,kind,lane?19:r,phase);ctx.stroke();ctx.restore();
  }
  if(!impact){
   ctx.globalAlpha=.95;ctx.lineWidth=3;
   ctx.beginPath();
   if(lane){ctx.moveTo(-length/2,-r+2);ctx.lineTo(length/2-phase*length,-r+2);}
   else ctx.arc(0,0,r-2,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-phase));
   ctx.stroke();
  }
  ctx.restore();
 }
}
