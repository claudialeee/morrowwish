/* Moon VFX: directional silver blade, layered edge, and localized impact. */
(()=>{'use strict';
const PI=Math.PI,TAU=PI*2,cl=x=>Math.max(0,Math.min(1,x));
const hash=i=>{const n=Math.sin(i*127.1+17.3)*43758.5453;return n-Math.floor(n)};
function bladePath(c,r,w){c.beginPath();c.moveTo(-r*1.48,-r);c.bezierCurveTo(r*.62,-r*.88,r*1.05,r*.40,-r*1.30,r*1.08);c.bezierCurveTo(r*.60-w,r*.45,r*.47-w,-r*.67,-r*1.48,-r);c.closePath()}
function edge(c,r){c.beginPath();c.moveTo(-r*1.48,-r);c.bezierCurveTo(r*.62,-r*.88,r*1.05,r*.40,-r*1.30,r*1.08)}
function blade(c,r,a){
 const g=c.createLinearGradient(-r*1.48,0,r*.64,0);g.addColorStop(0,'rgba(70,90,190,0.08)');g.addColorStop(.39,'#617cca');g.addColorStop(.74,'#afd5ff');g.addColorStop(1,'#fffef5');
 c.globalAlpha=a*.20;c.fillStyle='#657fdf';bladePath(c,r*1.07,r*.48);c.fill();
 c.globalAlpha=a;c.fillStyle=g;bladePath(c,r,r*.45);c.fill();
 // Lunar veins clipped to the actual curved energy sheet, not a texture rectangle.
 c.save();bladePath(c,r,r*.45);c.clip();
 for(let j=0;j<7;j++){const u=j/7;c.strokeStyle=j%2?'#d6e7ff':'#7895df';c.lineWidth=.7+r*.04*(1-u);c.globalAlpha=a*(.14+.16*u);c.beginPath();c.moveTo(-r*1.5,-r+u*r*2);c.bezierCurveTo(r*.04,-r*.62+u*r*.8,r*.43,-r*.12+u*r*.65,-r*.85,r*.98);c.stroke();}
 c.restore();
 c.strokeStyle='#8ab6ff';c.lineWidth=3.1;c.globalAlpha=a*.35;edge(c,r);c.stroke();
 c.strokeStyle='#fffef0';c.lineWidth=1.5;c.globalAlpha=a*.96;edge(c,r);c.stroke();
}
function spark(c,x,y,r,a){c.globalAlpha=cl(a);c.fillStyle='#f9f6e8';c.beginPath();c.moveTo(x-r,y);c.lineTo(x-r*.18,y-r*.18);c.lineTo(x,y-r);c.lineTo(x+r*.18,y-r*.18);c.lineTo(x+r,y);c.lineTo(x+r*.18,y+r*.18);c.lineTo(x,y+r);c.lineTo(x-r*.18,y+r*.18);c.closePath();c.fill()}
function drawProjectile(c,p,t){if(p.kind!=='crescent')return false;const r=Math.max(5,(p.r||14)*1.65),ang=Math.hypot(p.vx||0,p.vy||0)>0?Math.atan2(p.vy,p.vx):(p.ang||0);c.save();c.translate(p.x,p.y);c.rotate(ang);
 const g=c.createLinearGradient(-r*2.3,0,r*.3,0);g.addColorStop(0,'rgba(106,123,206,0)');g.addColorStop(.58,'rgba(142,167,239,.42)');g.addColorStop(1,'rgba(224,241,255,.68)');
 c.globalAlpha=.75;c.fillStyle=g;for(const sign of [-1,1]){c.beginPath();c.moveTo(-r*2.3,sign*r*.73);c.bezierCurveTo(-r*1.05,sign*r*.84,-r*.55,sign*r*.95,-r*.20,sign*r*.68);c.quadraticCurveTo(-r*.75,sign*r*.50,-r*2.3,sign*r*.73);c.fill()}
 for(let j=2;j>=1;j--){c.save();c.translate(-r*j*.43,0);blade(c,r*(1-j*.095),.15/j);c.restore()}
 blade(c,r,1);for(let j=0;j<7;j++){const u=(t*5.4+hash(j))%1;spark(c,-r*(.48+u*1.95),(hash(j+17)-.5)*r*1.75,1.2+hash(j+9)*2,(1-u)*.8)}c.restore();return true;
}
function drawImpact(c,v,t){const p=cl(1-v.life/Math.max(.001,v.max)),a=1-p,r=v.radius||32,ang=v.angle||0; if(a<=0)return;c.save();c.translate(v.x,v.y);c.rotate(ang);
 const flash=c.createRadialGradient(0,0,0,0,0,r*.78);flash.addColorStop(0,'rgba(255,255,240,.95)');flash.addColorStop(.28,'rgba(194,226,255,.58)');flash.addColorStop(1,'rgba(130,148,232,0)');c.globalAlpha=Math.max(0,1-p*4);c.fillStyle=flash;c.beginPath();c.arc(0,0,r*.78,0,TAU);c.fill();
 c.save();c.rotate(-.30+p*.24);c.translate(r*.12*p,0);blade(c,r*(.60+.40*p),a*.9);c.restore();
 for(let j=0;j<10;j++){const th=(j%2?1:-1)*(PI*.36+hash(j)*.9),d=r*(.12+.85*p)*(.55+hash(j+20)*.55),x=Math.cos(th)*d,y=Math.sin(th)*d;c.globalAlpha=a*.8;c.strokeStyle=j%2?'#c4dfff':'#fff6dc';c.lineWidth=1.5;c.beginPath();c.moveTo(x*.5,y*.5);c.lineTo(x,y);c.stroke();spark(c,x,y,2+hash(j+1)*1.8,a*.85)}c.restore();
}
function drawPassive(c,v,t,p,a){const ang=Math.atan2(v.y-v.oy,v.x-v.ox);drawImpact(c,{x:v.x,y:v.y-7,angle:ang,life:1-p,max:1,radius:43},t);}
window.CatBondMoonFX={drawProjectile,drawImpact,drawPassive};
})();
