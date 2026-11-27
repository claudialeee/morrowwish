// Shared screen-aware map affordances. Geometry stays in the 960 x 540 world.
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(Math.max(lo,hi),v));
export function markerMetrics(width,zoom=1,W=960){
 const scale=Math.max(.1,width/W*zoom);
 const r=clamp(19/scale,17,34),hit=clamp(22/scale,r,58),font=clamp(14/scale,16,32);
 return {r,hit,font,h:font+12,scale};
}
const overlaps=(a,b,p=3)=>a.x<b.x+b.w+p&&a.x+a.w+p>b.x&&a.y<b.y+b.h+p&&a.y+a.h+p>b.y;
export function layoutMarkerLabels(items,metrics,measure,W=960,H=540,avoid=[]){
 const {r:baseR,font:baseFont,scale}=metrics,icons=[],placed=[];
 const size=m=>({r:m.main?baseR*1.18:m.secondary?baseR*.75:baseR,font:m.main?baseFont*1.18:m.secondary?baseFont*.86:baseFont});
 const iconRect=(x,y,r)=>({x:x-r,y:y-r,w:2*r,h:2*r});
 // Keep interactive art off painted faces. A moved marker retains its true
 // interaction target and a short visual tether to the original location.
 const positioned=items.map(m=>{
  const {r}=size(m);
  if(m.k==="npc"){
   // Match the opening Muling speech marker: one 44 CSS-pixel cream bubble,
   // not a separate icon and label. Reserve the full pill plus its tail.
   const compact=scale<.5,unit=1/scale,bh=(m.main?48:m.secondary?36:44)*unit,fs=(m.main?(compact?15:17):m.secondary?(compact?11:12):(compact?12:14))*unit;
   const bw=Math.min(W-8,Math.max((compact?64:72)*unit,measure(m.t,fs)+(compact?38:46)*unit));
   const tail=5*unit, step=bh+tail+6*unit;
   const rectAt=(x,y)=>({x:clamp(x-bw/2,4,W-bw-4),y:clamp(y-bh/2,4,H-bh-tail-4),w:bw,h:bh});
   const candidates=[];
   for(let i=0;i<5;i++){const d=i*step;for(const dx of [0,bw/2+8*unit,-bw/2-8*unit,bw+8*unit,-bw-8*unit])candidates.push(rectAt(m.x+dx,m.y-d),rectAt(m.x+dx,m.y+d));}
   for(let y=bh/2+4;y<H;y+=step)for(let x=bw/2+4;x<W;x+=bw+6*unit)candidates.push(rectAt(x,y));
   const occupied=[...avoid,...icons],withTail=q=>m.main?{x:q.x-4*unit,y:q.y-21*unit,w:q.w+8*unit,h:q.h+tail+25*unit}:({...q,h:q.h+tail});
   const rect=candidates.find(q=>!occupied.some(b=>overlaps(withTail(q),b,1)))||candidates.reduce((best,q)=>{const score=a=>occupied.reduce((n,b)=>n+Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.h+tail,b.y+b.h)-Math.max(a.y,b.y)),0);return score(q)<score(best)?q:best;});
   icons.push(withTail(rect));
   return {...m,x:rect.x+rect.w/2,y:rect.y+rect.h/2,origin:[m.x,m.y],bubble:rect,bubbleFont:fs};
  }
  const offsets=[[0,0],[0,-2*r-6],[2*r+6,0],[-2*r-6,0],[0,2*r+6],[2*r+6,-2*r-6],[-2*r-6,-2*r-6],[2*r+6,2*r+6],[-2*r-6,2*r+6]];
  const points=offsets.map(([dx,dy])=>[clamp(m.x+dx,r+3,W-r-3),clamp(m.y+dy,r+3,H-r-3)]);
  const p=points.find(([x,y])=>![...avoid,...icons].some(b=>overlaps(iconRect(x,y,r),b,1)))||points[0];
  icons.push(iconRect(...p,r));
  return {...m,x:p[0],y:p[1],origin:[m.x,m.y]};
 });
 return positioned.map(m=>{
  const {r,font}=size(m),h=font+12;
  if(m.bubble)return {...m,rect:m.bubble,r:Math.min(r,m.bubble.h/2),hit:metrics.hit};
  const w=Math.min(330,Math.max(46,measure(m.t,font)+16)),cx=clamp(m.x-w/2,4,W-w-4),c=[];
  for(let i=0;i<5;i++){const d=r+7+i*(h+5);c.push([cx,m.y-d-h],[cx,m.y+d+(m.labelDy||0)],[clamp(m.x+r+8+i*18,4,W-w-4),m.y-h/2+i*(h+4)],[clamp(m.x-r-8-w-i*18,4,W-w-4),m.y-h/2-i*(h+4)]);}
  const rect=c.map(([x,y])=>({x,y,w,h})).find(q=>q.y>=4&&q.y+h<=H-4&&![...icons,...avoid,...placed].some(b=>overlaps(q,b)));
  if(rect)placed.push(rect);
  return {...m,rect:rect||null,r,hit:Math.max(r,metrics.hit),labelFont:font};
 });
}
export function pickMarker(items,x,y){
 // A visible icon always wins; then a visible label; finally the nearest
 // enlarged touch region. Blank space remains ordinary movement input.
 const nearby=items.map(m=>({m,d:Math.hypot(x-m.x,y-m.y)})).sort((a,b)=>a.d-b.d);
 const icon=nearby.find(({m,d})=>!m.bubble&&d<=m.r);
 if(icon)return icon.m;
 const label=items.find(m=>m.rect&&x>=m.rect.x&&x<=m.rect.x+m.rect.w&&y>=m.rect.y&&y<=m.rect.y+m.rect.h);
 if(label)return label;
 return nearby.find(({m,d})=>!m.bubble&&d<=m.hit)?.m||null;
}
export const discoveryNames={shell:["贝壳","Shell"],crab:["小螃蟹","Crab"],flag:["小旗","Pennant"],leaf:["叶子","Leaves"],thorn:["尖叶","Pointed leaves"],paper:["彩纸","Paper"],spark:["灯芯","Wick"],lantern:["提灯","Lantern"],feather:["羽毛","Feather"],cloud:["云端风景","Cloud view"],book:["书页","Book"],star:["星纹","Star pattern"],stone:["石片","Stone"]};
