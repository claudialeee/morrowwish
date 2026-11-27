// Native portrait chase: projection and hit testing share the same art-space geometry.
import {chasePoint} from "./canon22-spatial.mjs";
export const chaseCorners=[[.2,.27],[.8,.27],[.8,.73],[.2,.73]];
const clamp=n=>Math.max(0,Math.min(1,n));
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
export function projectChase([x,y]){
 const t=clamp((x-.2)/.6),side=clamp((y-.27)/.46);
 const left=mix([.23,.74],[.40,.35],t),right=mix([.79,.73],[.75,.36],t);
 return mix(left,right,side);
}
export function chaseFrame(w,h,iw=928,ih=1648){
 const k=Math.max(w/iw,h/ih),dw=iw*k,dh=ih*k;
 return {x:(w-dw)/2,y:(h-dh)/2,w:dw,h:dh};
}
export function chaseScreen(p,f){const q=projectChase(p);return [f.x+q[0]*f.w,f.y+q[1]*f.h];}
export function portraitChaseTap(p,x,y,w,h,iw,ih){
 if(p.direct||p.jumping)return null;
 const f=chaseFrame(w,h,iw,ih),dist=q=>Math.hypot(x*w-q[0],y*h-q[1]);
 const corner=chaseCorners.map(q=>({q,d:dist(chaseScreen(q,f))})).sort((a,b)=>a.d-b.d)[0];
 return corner.d<=30?{type:"target",x:corner.q[0],y:corner.q[1]}:null;
}
let art=null;
export function chaseArt(){if(!art){art=new Image();art.src=new URL("../../assets/mobile-portrait/harbor-chase.webp",import.meta.url).href;}return art;}
export function drawPortraitChase(c,p,w,h,lang,drawCat){
 const im=chaseArt(),ready=im.complete&&im.naturalWidth>0,f=chaseFrame(w,h,im.naturalWidth||928,im.naturalHeight||1648),at=q=>chaseScreen(q,f);
 c.fillStyle="#e6d7ba";c.fillRect(0,0,w,h);
 if(!ready){c.fillStyle="#624d30";c.font="600 15px sans-serif";c.textAlign="center";c.fillText(lang==="zh"?"正在载入追铃场景":"Loading chase artwork",w/2,h/2);return;}
 c.drawImage(im,f.x,f.y,f.w,f.h);
 c.save();c.strokeStyle="#fff2bdba";c.lineWidth=2;c.setLineDash([5,7]);c.beginPath();chaseCorners.forEach((q,i)=>{const a=at(q);i?c.lineTo(...a):c.moveTo(...a);});c.closePath();c.stroke();c.setLineDash([]);
 const a=at([.5,.27]),b=at([.5,.73]);c.strokeStyle="#ffe5a1";c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();
 const dot=(q,r,fill,stroke)=>{c.beginPath();c.arc(...q,r,0,Math.PI*2);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}};
 if(!p.direct)for(const q of chaseCorners){dot(at(q),13,"#654b28a8","#fff2b8");dot(at(q),7,"#f7ce66","#aa7928");}
 const bell=at(chasePoint(p));dot(bell,20,"#cceaff88");dot(bell,10,"#4696da","#f0faff");dot([bell[0]-3,bell[1]-3],3,"#ffffff");
 const pos=at(p.player);drawCat(pos[0],pos[1]-(p.jumping?18:0),!!p.moving||!!p.waypoints.length||p.jumping);
 if(p.jumping){c.font="700 15px sans-serif";c.textAlign="center";c.fillStyle="#fff7df";c.strokeStyle="#674e2c";c.lineWidth=3;c.strokeText(lang==="zh"?"跳！":"Jump!",pos[0],pos[1]-56);c.fillText(lang==="zh"?"跳！":"Jump!",pos[0],pos[1]-56);}
 c.restore();
}
