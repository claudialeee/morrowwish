/* Cat Bond: animated translucent ward artwork.
 * Three distinct readable in-arena silhouettes; no external bitmap downloads.
 * Layered before/after the whole kitten sprite so the cat stays recognizable.
 */
(()=>{
'use strict';
const TAU=Math.PI*2;
const cap=(v,a,b)=>Math.max(a,Math.min(b,v));
const dome=(g,rx,ry)=>{g.beginPath();g.moveTo(-rx,0);g.ellipse(0,0,rx,ry,0,Math.PI,TAU);g.closePath();};
const ellipse=(g,x,y,rx,ry)=>{g.beginPath();g.ellipse(x,y,rx,ry,0,0,TAU);};
function glint(g,x,y,r,color){
  g.strokeStyle=color;g.lineCap='round';g.lineWidth=Math.max(.7,r*.15);
  g.beginPath();g.moveTo(x-r,y);g.lineTo(x+r,y);
  g.moveTo(x,y-r);g.lineTo(x,y+r);g.stroke();
}
function bubble(g,rx,ry,t,layer){
  if(layer==='back'){
    const skin=g.createLinearGradient(0,-ry,0,12);
    skin.addColorStop(0,'rgba(178,232,255,.13)');
    skin.addColorStop(.44,'rgba(214,201,255,.075)');
    skin.addColorStop(1,'rgba(243,164,219,.045)');
    dome(g,rx,ry);g.fillStyle=skin;g.fill();
    const light=g.createRadialGradient(-rx*.25,-ry*.73,3,0,-ry*.35,rx);
    light.addColorStop(0,'rgba(255,255,255,.25)');light.addColorStop(1,'rgba(255,255,255,0)');
    g.fillStyle=light;dome(g,rx,ry);g.fill();
    return;
  }
  g.lineCap='round';g.globalCompositeOperation='lighter';
  const arc=(start,end,c,w,blur=0)=>{
    g.beginPath();g.ellipse(0,0,rx,ry,0,start,end);
    g.shadowBlur=blur;g.shadowColor=c;g.strokeStyle=c;g.lineWidth=w;g.stroke();
  };
  arc(Math.PI,TAU,'rgba(121,208,255,.30)',7,13);
  arc(Math.PI,Math.PI*1.52,'rgba(194,251,255,.88)',2.3,8);
  arc(Math.PI*1.51,TAU,'rgba(255,182,226,.83)',2.4,7);
  arc(Math.PI*1.09,Math.PI*1.47,'rgba(255,255,238,.70)',1,4);
  g.shadowBlur=9;g.shadowColor='#9aeeff';
  ellipse(g,0,0,rx,13);g.strokeStyle='rgba(161,237,255,.62)';g.lineWidth=2.2;g.stroke();
  g.shadowBlur=0;g.globalAlpha*=.52;
  g.beginPath();g.ellipse(-rx*.13,-ry*.40,rx*.74,ry*.35,-.42,Math.PI*1.09,Math.PI*1.72);
  g.strokeStyle='rgba(255,231,255,.9)';g.lineWidth=1.8;g.stroke();
  for(let i=0;i<5;i++){
    let a=t*.74+i*2.4,px=Math.cos(a)*rx*.79,py=-ry*.35+Math.sin(a)*ry*.39;
    glint(g,px,py,i%2?2.5:3.6,i%2?'#fff7e6':'#e2faff');
  }
}
function wall(g,rx,ry,t,layer){
  const top=-ry*.99, bottom=13;
  if(layer==='back'){
    const fog=g.createRadialGradient(0,-ry*.42,4,0,-ry*.42,rx*1.4);
    fog.addColorStop(0,'rgba(70,231,255,.15)');fog.addColorStop(1,'rgba(70,231,255,0)');
    g.fillStyle=fog;g.fillRect(-rx*1.6,top-15,rx*3.2,ry+65);
    return;
  }
  g.globalCompositeOperation='lighter';
  for(let j=0;j<3;j++){
    const w=rx*2/3,x=-rx+j*w;
    const grad=g.createLinearGradient(x,top,x+w,bottom);
    grad.addColorStop(0,'rgba(187,254,255,.16)');
    grad.addColorStop(.5,'rgba(68,195,246,.055)');
    grad.addColorStop(1,'rgba(176,244,255,.14)');
    g.fillStyle=grad;g.fillRect(x+2,top+3,w-4,bottom-top-6);
    g.shadowColor='#61e8ff';g.shadowBlur=12;g.lineWidth=1.9;
    g.strokeStyle='rgba(123,243,255,.89)';g.strokeRect(x+2,top+3,w-4,bottom-top-6);
    g.shadowBlur=0;g.strokeStyle='rgba(239,255,255,.35)';g.lineWidth=1;
    g.beginPath();g.moveTo(x+5,top+20);g.lineTo(x+w-6,bottom-23);g.stroke();
  }
  g.shadowColor='#6eeaff';g.shadowBlur=10;g.strokeStyle='#bffbff';g.lineWidth=2.3;
  g.beginPath();g.moveTo(-rx-3,top);g.lineTo(rx+3,top);g.moveTo(-rx-3,bottom);g.lineTo(rx+3,bottom);g.stroke();
  g.shadowBlur=0;
  for(let i=0;i<4;i++){
    let x=-rx+(i+.4)*rx*.52,y=top+10+((t*27+i*41)%(ry-7));
    glint(g,x,y,2.7,'#f4ffff');
  }
}
function protect(g,rx,ry,t,layer){
  if(layer==='back'){
    const gl=g.createRadialGradient(0,-ry*.36,1,0,-ry*.36,rx);
    gl.addColorStop(0,'rgba(255,240,168,.19)');
    gl.addColorStop(1,'rgba(255,242,190,.02)');
    g.fillStyle=gl;dome(g,rx,ry);g.fill();return;
  }
  g.globalCompositeOperation='lighter';g.shadowColor='#ffe39d';g.shadowBlur=17;
  g.lineWidth=5.2;g.strokeStyle='rgba(255,227,126,.53)';dome(g,rx,ry);g.stroke();
  g.lineWidth=2.1;g.strokeStyle='#fff5cf';dome(g,rx,ry);g.stroke();
  ellipse(g,0,0,rx,12);g.stroke();g.shadowBlur=0;
  for(let i=0;i<8;i++){
    const a=i*TAU/8+t*.6;
    glint(g,Math.cos(a)*rx*.85,-ry*.42+Math.sin(a)*ry*.44,3,'#fff9d9');
  }
}
function hexGrid(g,rx,ry,t){
  g.save();dome(g,rx,ry);g.clip();
  const side=12,dx=side*1.73,dy=side*1.5;
  g.strokeStyle='rgba(255,222,125,.22)';g.lineWidth=.85;
  for(let row=0;row<7;row++){
    const y=-ry+row*dy+4;
    for(let col=-3;col<4;col++){
      const x=col*dx+(row%2)*dx*.5;
      g.beginPath();
      for(let k=0;k<6;k++){let a=k*TAU/6;let xx=x+side*Math.cos(a),yy=y+side*Math.sin(a);if(!k)g.moveTo(xx,yy);else g.lineTo(xx,yy);}
      g.closePath();g.stroke();
    }
  }
  g.restore();
  g.save();g.globalCompositeOperation='lighter';g.shadowBlur=8;g.shadowColor='#ffe78f';
  for(let i=0;i<4;i++){
    const a=(i*2.31+t*.7),x=Math.sin(a)*rx*.79,y=-ry*.20-Math.abs(Math.cos(a))*ry*.68;
    g.strokeStyle='rgba(255,237,152,.78)';g.lineWidth=1.2;
    g.beginPath();g.moveTo(x-7,y-3);g.lineTo(x,y+4);g.lineTo(x+4,y-5);g.lineTo(x+9,y+1);g.stroke();
  }
  g.restore();
}
function draw(ctx,f,x,y,t,scale=1,layer='front'){
  if(!ctx||!f)return false;
  const type=(f.protectT||0)>0?'protect':(f.reflectT||0)>0?'reflect':(f.shieldT||0)>0?'barrier':null;
  if(!type)return false;
  // Both the CatMotion and original watercolor renderer draw the feet/shadow
  // at (worldY + 33 * sourceScale * growthScale). The old y+7*s anchor put
  // every ward rim near the cat's belly, leaving its paws OUTSIDE the shield.
  // Anchor to the actual planted paws instead, on both the back/front pass.
  const growthScale=f.cat?(window.Growth?.visual?.(f.cat)?.scale||1):1;
  const s=cap(scale||1,.8,1.2)*growthScale;
  const rx=(type==='reflect'?43:48)*s,ry=(type==='reflect'?80:70)*s;
  const pulse=1+.025*Math.sin(t*6);
  const groundY=y+33*s;
  ctx.save();ctx.translate(x,groundY);ctx.scale(pulse,pulse);
  // A reflect ward is a single forward-facing panel, not a surrounding dome.
  // Keep the panel upright while positioning its base in front of movement.
  if(type==='reflect'){
    const heading=f._reflectFacing ?? f._moveFacing ?? (f.face<0?Math.PI:0);
    const fx=Math.cos(heading),fy=Math.sin(heading);
    // A top-down floor ellipse identifies the one protected side and heading.
    if(layer==='front'){
      ctx.save();ctx.translate(fx*20*s,fy*13*s);
      ctx.rotate(heading-Math.PI/2);
      ctx.strokeStyle='rgba(107,236,255,.85)';ctx.lineWidth=3*s;
      ctx.beginPath();ctx.arc(0,0,24*s,Math.PI*.12,Math.PI*.88);ctx.stroke();
      ctx.restore();
    }
    ctx.translate(fx*22*s,fy*12*s);
    // Lean toward travel while retaining a readable vertical silhouette.
    ctx.transform(1,0,fx*.18,1,0,0);
    wall(ctx,rx*.73,ry*.86,t,layer);
    ctx.restore();return true;
  }
  // Keep most artwork on the outline rather than washing out the kitten face.
  else if(type==='protect')protect(ctx,rx,ry,t,layer);
  else {bubble(ctx,rx,ry,t,layer);if(layer==='front')hexGrid(ctx,rx,ry,t);}
  ctx.restore();return true;
}
window.CatBondWardArt={draw};
})();
