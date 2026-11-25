// Independent atlas geometry and pointer controller. Requires finished world art and runtime integration before release.
(function(root){ const build=function makeAtlasGeometry(){
 "use strict";
 // Coordinates are normalized to the original art's fixed 1600×1200 design grid.
 // The renderer receives finished art from the asset pipeline; no legacy landscape fallback.
 const W=1600,H=900;
 const regions=[
  {id:"harbor",x:800,y:162},{id:"forest",x:1250,y:316},
  {id:"forge",x:1250,y:645},{id:"sky",x:800,y:778},
  {id:"library",x:350,y:645},{id:"starfall",x:350,y:316}
 ];
 const bell={id:"star-bell",x:800,y:470};
 const roads=regions.map((a,i)=>{const b=regions[(i+1)%6];return {id:a.id+"-"+b.id,a,b};});
 const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
 function camera(width,height){
  let scale=Math.min(width/W,height/H), min=scale, max=scale*3.5,x=(width-W*scale)/2,y=(height-H*scale)/2;
  const contain=()=>{x=width>=W*scale?(width-W*scale)/2:clamp(x,width-W*scale,0);y=height>=H*scale?(height-H*scale)/2:clamp(y,height-H*scale,0);};
  function screen(p){return {x:x+p.x*scale,y:y+p.y*scale};}
  function world(p){return {x:(p.x-x)/scale,y:(p.y-y)/scale};}
  function zoom(f,at){if(!Number.isFinite(f)||f<=0)return;const p=world(at);scale=clamp(scale*f,min,max);x=at.x-p.x*scale;y=at.y-p.y*scale;contain();}
  function pan(dx,dy){if(!Number.isFinite(dx)||!Number.isFinite(dy))return;x+=dx;y+=dy;contain();}
  function resize(w,h){const center=world({x:width/2,y:height/2}),z=scale/min;width=w;height=h;min=Math.min(w/W,h/H);max=min*3.5;scale=clamp(z*min,min,max);x=w/2-center.x*scale;y=h/2-center.y*scale;contain();}
  function reset(){scale=min;x=(width-W*scale)/2;y=(height-H*scale)/2;}
  function hit(p){
   for(const n of [...regions,bell]){const q=screen(n);if(Math.hypot(q.x-p.x,q.y-p.y)<=Math.max(23,48*scale))return {type:n===bell?"landmark":"region",id:n.id};}
   for(const e of roads){const a=screen(e.a),b=screen(e.b),dx=b.x-a.x,dy=b.y-a.y;const t=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy),0,1);if(Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy)<=Math.max(12,14*scale))return {type:"route",id:e.id};}
   return null;
  }
  return {screen,world,zoom,pan,resize,reset,hit,get transform(){return {x,y,scale}},get zoomLevel(){return scale/min}};
 }
 function bind(canvas,cam,onSelect,onChange=()=>{}){
  const active=new Map();let dragged=false;
  const pos=e=>{const b=canvas.getBoundingClientRect();return {x:e.clientX-b.left,y:e.clientY-b.top};};
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const down=e=>{if(e.pointerType==="mouse"&&e.button!==0)return;if(active.size===0)dragged=false;const p=pos(e);active.set(e.pointerId,{...p,start:p});if(active.size>1)dragged=true;canvas.setPointerCapture?.(e.pointerId);};
  const move=e=>{if(!active.has(e.pointerId))return;const old=active.get(e.pointerId),p=pos(e);if(distance(p,old.start)>6)dragged=true;
   if(active.size===1&&dragged)cam.pan(p.x-old.x,p.y-old.y);
   else if(active.size===2){const other=[...active.entries()].find(([id])=>id!==e.pointerId)[1];const prev=distance(old,other),now=distance(p,other);if(prev>1){cam.pan((p.x-old.x)/2,(p.y-old.y)/2);cam.zoom(now/prev,{x:(p.x+other.x)/2,y:(p.y+other.y)/2});}}
   active.set(e.pointerId,{...p,start:old.start});onChange();
  };
  const up=e=>{if(!active.has(e.pointerId))return;const select=!dragged&&active.size===1&&e.type==="pointerup";active.delete(e.pointerId);if(select){const hit=cam.hit(pos(e));if(hit)onSelect(hit);}};
  const wheel=e=>{e.preventDefault();cam.zoom(Math.exp(-e.deltaY*.0015),pos(e));onChange();};
  const oldTouch=canvas.style.touchAction;canvas.style.touchAction="none";
  const events=[["pointerdown",down],["pointermove",move],["pointerup",up],["pointercancel",up],["lostpointercapture",up],["wheel",wheel]];
  for(const [event,fn] of events)canvas.addEventListener(event,fn,{passive:false});
  return ()=>{for(const [event,fn] of events)canvas.removeEventListener(event,fn);active.clear();canvas.style.touchAction=oldTouch;};
 }
 return {W,H,regions,bell,roads,camera,bind};
}; const api=build(); if(typeof module==='object'&&module.exports)module.exports=api; else root.CatBondResonanceAtlas=api; })(typeof window!=='undefined'?window:globalThis);
