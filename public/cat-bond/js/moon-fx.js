/* Moon VFX: luminous energy crescent, feathered light trail, localized contact. */
(()=>{'use strict';
const PI=Math.PI,TAU=PI*2,cl=x=>Math.max(0,Math.min(1,x));
const hash=i=>{const n=Math.sin(i*127.1+17.3)*43758.5453;return n-Math.floor(n)};
function bladePath(c,r,w){c.beginPath();c.moveTo(-r*1.48,-r);c.bezierCurveTo(r*.62,-r*.88,r*1.05,r*.40,-r*1.30,r*1.08);c.bezierCurveTo(r*.60-w,r*.45,r*.47-w,-r*.67,-r*1.48,-r);c.closePath()}
function edge(c,r){c.beginPath();c.moveTo(-r*1.48,-r);c.bezierCurveTo(r*.62,-r*.88,r*1.05,r*.40,-r*1.30,r*1.08)}
function blade(c,r,a){
 // Narrow, tapered light sheet: white core and a translucent lilac energy edge.
 // The original radius and direction stay unchanged. No metal surface/veins.
 a=cl(a);if(!a)return;
 c.save();c.lineJoin='round';c.lineCap='round';
 // A restrained violet outline remains legible over pale watercolor terrain.
 c.globalCompositeOperation='source-over';
 for(const [col,w,opacity] of [['#6259bd',r*.32,.12],['#a28df6',r*.22,.27],['#bce4ff',r*.12,.65]]){
   c.globalAlpha=a*opacity;c.strokeStyle=col;c.lineWidth=Math.max(1,w);edge(c,r);c.stroke();
 }
 const g=c.createLinearGradient(-r*1.48,0,r*.64,0);
 g.addColorStop(0,'rgba(224,223,255,0.14)');g.addColorStop(.27,'rgba(186,175,255,0.65)');
 g.addColorStop(.58,'#e6efff');g.addColorStop(.83,'#ffffff');g.addColorStop(1,'#ffffff');
 c.globalAlpha=a*.98;c.fillStyle=g;bladePath(c,r,r*.40);c.fill();
 c.globalCompositeOperation='lighter';
 c.globalAlpha=a*.65;c.fillStyle='#dfefff';bladePath(c,r,r*.22);c.fill();
 c.strokeStyle='#d5dcff';c.lineWidth=Math.max(1.5,r*.12);c.globalAlpha=a*.63;edge(c,r);c.stroke();
 c.strokeStyle='#ffffff';c.lineWidth=Math.max(1.2,r*.055);c.globalAlpha=a;edge(c,r);c.stroke();
 c.restore();
}
function spark(c,x,y,r,a){c.globalAlpha=cl(a);c.fillStyle='#f9f6e8';c.beginPath();c.moveTo(x-r,y);c.lineTo(x-r*.18,y-r*.18);c.lineTo(x,y-r);c.lineTo(x+r*.18,y-r*.18);c.lineTo(x+r,y);c.lineTo(x+r*.18,y+r*.18);c.lineTo(x,y+r);c.lineTo(x-r*.18,y+r*.18);c.closePath();c.fill()}
function drawProjectile(c,p,t){if(p.kind!=='crescent')return false;const r=Math.max(5,(p.r||14)*1.65),ang=Math.hypot(p.vx||0,p.vy||0)>0?Math.atan2(p.vy,p.vx):(p.ang||0);c.save();c.translate(p.x,p.y);c.rotate(ang);
 const g=c.createLinearGradient(-r*2.3,0,r*.3,0);g.addColorStop(0,'rgba(168,147,245,0)');g.addColorStop(.58,'rgba(197,190,255,.44)');g.addColorStop(1,'rgba(242,250,255,.88)');
 c.globalCompositeOperation='source-over';c.globalAlpha=.68;c.fillStyle=g;for(const sign of [-1,1]){c.beginPath();c.moveTo(-r*2.3,sign*r*.73);c.bezierCurveTo(-r*1.05,sign*r*.84,-r*.55,sign*r*.95,-r*.20,sign*r*.68);c.quadraticCurveTo(-r*.75,sign*r*.50,-r*2.3,sign*r*.73);c.fill()}
 for(let j=2;j>=1;j--){c.save();c.translate(-r*j*.43,0);blade(c,r*(1-j*.095),.15/j);c.restore()}
 blade(c,r,1);c.globalCompositeOperation='lighter';for(let j=0;j<7;j++){const u=(t*5.4+hash(j))%1;spark(c,-r*(.48+u*1.95),(hash(j+17)-.5)*r*1.75,1.2+hash(j+9)*2,(1-u)*.8)}c.restore();return true;
}
function drawImpact(c,v,t){const p=cl(1-v.life/Math.max(.001,v.max)),a=1-p,r=v.radius||32,ang=v.angle||0; if(a<=0)return;c.save();c.translate(v.x,v.y);c.rotate(ang);
 const flash=c.createRadialGradient(0,0,0,0,0,r*.78);flash.addColorStop(0,'rgba(255,255,255,1)');flash.addColorStop(.28,'rgba(226,231,255,.85)');flash.addColorStop(1,'rgba(176,151,252,0)');c.globalAlpha=Math.max(0,1-p*4);c.fillStyle=flash;c.beginPath();c.arc(0,0,r*.78,0,TAU);c.fill();
 c.save();c.rotate(-.30+p*.24);c.translate(r*.12*p,0);blade(c,r*(.60+.40*p),a*.9);c.restore();
 for(let j=0;j<10;j++){const th=(j%2?1:-1)*(PI*.36+hash(j)*.9),d=r*(.12+.85*p)*(.55+hash(j+20)*.55),x=Math.cos(th)*d,y=Math.sin(th)*d;c.globalAlpha=a*.8;c.strokeStyle=j%2?'#c4dfff':'#fff6dc';c.lineWidth=1.5;c.beginPath();c.moveTo(x*.5,y*.5);c.lineTo(x,y);c.stroke();spark(c,x,y,2+hash(j+1)*1.8,a*.85)}c.restore();
}
function drawPassive(c,v,t,p,a){const ang=Math.atan2(v.y-v.oy,v.x-v.ox);drawImpact(c,{x:v.x,y:v.y-7,angle:ang,life:1-p,max:1,radius:43},t);}
// HOVER: a charging moon-arc that bobs at a position around the caster during the
// 2.5s pre-release window. Uses the same authored blade() shape as the projectile +
// impact so the three phases share visual identity. v: {caster,offAng,offRad,wobble,spawnT,color}
function drawHover(c,v,t){
  if(!v.caster||!v.caster.alive)return;
  const age=t-(v.spawnT||t);
  const bob=Math.sin(age*3.3+(v.wobble||0))*4;
  // Owner 2026-11-26 "方向应该指向目标位置": if castAng was captured at spawn
  // (crescentFan fan-at-target), orient the blade along it with a small sway so
  // every hover-arc clearly reads as "aimed at the enemy". Fallback = free spin.
  const sway=Math.sin(age*1.3+(v.wobble||0))*0.14;
  const rot=(v.castAng!=null)?(v.castAng+sway):(age*0.8+Math.sin(age*1.7+(v.wobble||0))*0.35+(v.wobble||0));
  // Owner 2026-11-26 final: hover arc sits directly above the caster
  // (overheadOff = vertical offset, usually -48). Falls back to absX/absY
  // (legacy scatter), then caster-relative polar.
  let x, y;
  if(v.overheadOff!=null){ x=v.caster.x; y=v.caster.y+v.overheadOff+bob; }
  else if(v.absX!=null){ x=v.absX; y=v.absY+bob; }
  else { x=v.caster.x+Math.cos(v.offAng)*v.offRad; y=v.caster.y+Math.sin(v.offAng)*v.offRad+bob; }
  const r=12;
  c.save();c.translate(x,y);c.rotate(rot);
  // soft back halo (brightens as charge nears release)
  const chargeK=cl(age/2.5);
  const halo=c.createRadialGradient(0,0,0,0,0,r*2.4);
  halo.addColorStop(0,'rgba(220,235,255,'+(.22+.25*chargeK).toFixed(2)+')');
  halo.addColorStop(1,'rgba(130,148,232,0)');
  c.globalAlpha=1;c.fillStyle=halo;c.beginPath();c.arc(0,0,r*2.4,0,TAU);c.fill();
  blade(c,r*(0.85+0.25*chargeK),0.85);
  // charging sparks swarm inward
  for(let j=0;j<6;j++){
    const u=((t*2.3+hash(j+3*(v.wobble||1)))%1);
    const rad=r*(2.0-1.4*u);
    const th=j*TAU/6+t*1.1;
    spark(c,Math.cos(th)*rad,Math.sin(th)*rad*.5,1.0+hash(j)*1.4,(1-u)*0.75);
  }
  c.restore();
}
window.CatBondMoonFX={drawProjectile,drawImpact,drawPassive,drawHover};
})();
