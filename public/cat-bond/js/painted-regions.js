/* Cat Bond: five individually painted, camera-anchored exploration regions.
   Real terrain textures/landmarks per region; no single-tinted garden bitmap.
   Cached on a world canvas to keep desktop and phone animation fast. */
(()=>{
'use strict';
const colors={
 home:['#e7edca','#9fb78a','#608a68','#fbedd4','#d1b292'],
 sakura:['#f3dfdb','#bbb7ab','#798e7b','#ffe0ec','#e4c5b9'],
 creek:['#d7e9dc','#8bb8a5','#4d807a','#a6deed','#eee2c3'],
 volcano:['#dfbca7','#98736b','#584c53','#ecad6c','#bd8c72'],
 ruins:['#bbc5df','#899bb5','#535d84','#e1d6e7','#9d9fbb']
};
const IDS=['home','sakura','creek','volcano','ruins'];
let cached=null,currentId=null,generation=0;
function random(seed){let s=seed>>>0;return()=>{s=(Math.imul(1664525,s)+1013904223)>>>0;return s/4294967296;};}
function oval(c,x,y,rx,ry,color,rot=0){c.beginPath();c.ellipse(x,y,Math.max(.2,rx),Math.max(.2,ry),rot,0,Math.PI*2);c.fillStyle=color;c.fill();}
function path(c,pts,width,color){
 c.save();c.lineCap='round';c.lineJoin='round';c.lineWidth=width;c.strokeStyle=color;
 c.beginPath();c.moveTo(pts[0][0],pts[0][1]);
 for(let i=1;i<pts.length-1;i++)c.quadraticCurveTo(pts[i][0],pts[i][1],(pts[i][0]+pts[i+1][0])/2,(pts[i][1]+pts[i+1][1])/2);
 c.lineTo(...pts.at(-1));c.stroke();c.restore();
}
function polygon(c,pts,fill,stroke){c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
function bloom(c,x,y,size,pink,seed){
 const r=random(seed);for(let i=0;i<5;i++){let a=i*Math.PI*2/5;oval(c,x+Math.cos(a)*size*.48,y+Math.sin(a)*size*.48,size*.58,size*.38,pink,a);}
 oval(c,x,y,size*.22,size*.22,'#fff4b5');oval(c,x-size*.05,y-size*.1,size*.08,size*.08,'#fff');
}
function foliage(c,x,y,size,cols,seed){
 const r=random(seed);for(let i=0;i<22;i++){
  const a=i*2.3999,dist=size*Math.sqrt(r()),xx=x+Math.cos(a)*dist,yy=y+Math.sin(a)*dist*.69;
  oval(c,xx,yy,size*(.18+r()*.12),size*(.12+r()*.1),cols[i%cols.length],a*.14);
 }
}
function bush(c,x,y,size,seed,flowers=false){
 oval(c,x+9,y+10,size*1.04,size*.41,'rgba(45,59,44,.16)');
 foliage(c,x,y,size,['#487959','#6f9673','#97b99b','#54755c'],seed);
 if(flowers){const r=random(seed);for(let i=0;i<11;i++){const xx=x+(r()-.5)*size*1.3,yy=y+(r()-.5)*size*.75;bloom(c,xx,yy,3+r()*3,i%2?'#f9c3d5':'#f5dfab',seed+i);}}
}
function stone(c,x,y,w,h,col){
 oval(c,x+5,y+6,w,h,'rgba(39,48,49,.18)');
 oval(c,x,y,w,h,col);
 c.strokeStyle='rgba(255,255,255,.53)';c.lineWidth=2;c.beginPath();
 c.moveTo(x-w*.65,y-h*.25);c.quadraticCurveTo(x-w*.1,y-h*.72,x+w*.3,y-h*.4);c.stroke();
}
function tree(c,x,y,scale,cols,seed,blossom=false){
 c.save();c.shadowColor='rgba(44,68,48,.21)';c.shadowBlur=20;c.shadowOffsetY=16;
 oval(c,x+14,y+9,68*scale,21*scale,'rgba(48,61,38,.2)');c.restore();
 path(c,[[x,y],[x-5*scale,y-86*scale],[x-22*scale,y-139*scale]],18*scale,'#765c50');
 path(c,[[x-5*scale,y-85*scale],[x+38*scale,y-132*scale],[x+64*scale,y-141*scale]],10*scale,'#8f7060');
 for(let i=0;i<8;i++){
  const xx=x+(Math.sin(i*2.4)*87-22)*scale,yy=y+(-155+Math.cos(i*2.1)*54)*scale;
  foliage(c,xx,yy,41*scale,cols,seed+i*31);
  if(blossom){for(let k=0;k<6;k++){const r=random(seed+i*83+k);bloom(c,xx+(r()-.5)*63*scale,yy+(r()-.5)*38*scale,4.5*scale,k%2?'#f8c2d4':'#ffefeb',seed+i+k);}}
 }
}
function flagstones(c,points,rand,pal){
 // Hand-placed offset flagstones follow the full meandering path; not a straight stripe.
 path(c,points,100,'rgba(70,67,48,.15)');
 path(c,points,88,pal[4]);
 path(c,points,74,pal[3]);
 for(let i=0;i<59;i++){
  const t=i/58,segment=t*(points.length-1),k=Math.min(points.length-2,Math.floor(segment)),f=segment-k;
  const x=points[k][0]*(1-f)+points[k+1][0]*f,y=points[k][1]*(1-f)+points[k+1][1]*f;
  const off=(rand()-.5)*52;
  stone(c,x+off,y+(rand()-.5)*15,12+rand()*7,6+rand()*3,i%5?'rgba(249,239,217,.36)':'rgba(197,174,151,.3)');
 }
}
function base(c,w,h,id){
 const p=colors[id],r=random(id.split('').reduce((a,c)=>a+c.charCodeAt(0),43));
 const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,p[0]);g.addColorStop(.65,p[1]);g.addColorStop(1,p[2]);c.fillStyle=g;c.fillRect(0,0,w,h);
 for(let i=0;i<270;i++){
  const x=r()*w,y=r()*h;
  oval(c,x,y,18+r()*125,8+r()*44,i%4?'rgba(255,255,255,.075)':'rgba(33,74,53,.06)',r()*Math.PI);
 }
 // Grainless illustrated meadow texture with fine grass clusters, not noisy dots.
 for(let i=0;i<1200;i++){
  const x=r()*w,y=r()*h,alpha=.1+r()*.21;
  c.strokeStyle=i%4?'rgba(255,253,224,'+alpha+')':'rgba(41,91,53,'+alpha+')';
  c.lineWidth=.8+r()*.9;c.beginPath();c.moveTo(x,y);
  c.quadraticCurveTo(x+(r()-.5)*8,y-4-r()*8,x+(r()-.5)*9,y-7-r()*9);c.stroke();
 }
 return r;
}
function home(c,w,h,p,r){
 flagstones(c,[[850,1260],[910,1020],[730,790],[870,570],[1130,370],[1310,85]],r,p);
 // Real courtyard structure: cottage, timber fence, covered garden arch,
 // flower beds, wicker bench and distinct living zones.
 polygon(c,[[105,130],[487,125],[510,458],[113,467]],'#f5e9d4','#cebda5');
 polygon(c,[[87,135],[306,-26],[520,129]],'#936e66','#674e4a');
 for(let i=0;i<8;i++)path(c,[[97+i*52,154],[97+i*52,438]],3,'rgba(168,139,111,.17)');
 c.fillStyle='#9a7460';c.fillRect(203,210,102,154);c.fillStyle='#d6edec';c.fillRect(214,222,79,120);
 path(c,[[252,220],[252,340]],6,'#775f57');path(c,[[211,280],[296,280]],6,'#775f57');
 c.fillStyle='#80624c';c.fillRect(346,252,102,209);
 c.fillStyle='#a7836d';c.fillRect(364,307,8,70);oval(c,431,365,5,5,'#f2d88c');
 for(let x=30;x<1700;x+=64){c.fillStyle='#b59772';c.fillRect(x,495,13,92);}
 path(c,[[28,519],[1692,519]],16,'#a0805d');path(c,[[28,558],[1692,558]],12,'#b79a78');
 tree(c,1520,670,1.25,['#669275','#86a98a','#9ec5a0','#5d856c'],321);
 tree(c,1250,260,.85,['#668b69','#87a88a','#adc4a0','#608469'],169);
 bush(c,540,645,90,202,true);bush(c,139,825,105,203,true);
 bush(c,1530,1010,94,303,true);bush(c,1160,870,78,404,true);
 for(let i=0;i<11;i++){let x=150+i*135,y=690+(i%3)*145;
   bloom(c,x,y,7+i%4,i%3?'#f4bfcb':'#ffe2a9',510+i);}
 // Timber planter with herbs, inviting readable interactive staging.
 polygon(c,[[223,947],[456,932],[468,1044],[209,1052]],'#ad8567','#6c674e');
 for(let i=0;i<7;i++)foliage(c,237+i*30,934,22,['#689470','#7daa85','#9bc8a0'],500+i);
}
function sakura(c,w,h,p,r){
 flagstones(c,[[102,1240],[300,1090],[610,980],[760,720],[1060,590],[1460,340],[1670,140]],r,p);
 for(const [x,y,s] of [[190,540,1.18],[640,280,1.28],[1230,770,1.15],[1530,400,.94]])
  tree(c,x,y,s,['#f3c9d9','#ebacc5','#f8ddea','#fff1e7'],x+y,true);
 for(let i=0;i<12;i++){const x=r()*w,y=r()*h;
  bush(c,x,y,37+r()*38,100+i,true);}
 // Shrine torii and spring lanterns.
 polygon(c,[[1040,272],[1058,272],[1058,501],[1040,501]],'#986c70');
 polygon(c,[[1300,272],[1317,272],[1317,501],[1300,501]],'#986c70');
 path(c,[[1025,285],[1329,285]],24,'#bb8490');path(c,[[1009,256],[1346,256]],13,'#7d6671');
 for(const [x,y] of [[934,460],[1395,580],[480,750]]){
  c.fillStyle='#7b746f';c.fillRect(x-6,y-17,12,48);
  oval(c,x,y-23,17,12,'#fbebc8');oval(c,x,y-23,11,7,'#ffd4a4');}
}
function creek(c,w,h,p,r){
 flagstones(c,[[140,1170],[480,970],[680,830],[900,570],[1280,310],[1620,110]],r,p);
 const river=[[0,370],[370,490],[700,570],[850,780],[1100,900],[1510,1010],[1800,1120]];
 path(c,river,228,'#58887d');path(c,river,210,'#b0dbd0');path(c,river,190,'#6fbbba');
 path(c,river,148,'#7dc6c9');path(c,river,9,'rgba(246,255,248,.54)');
 for(let i=0;i<31;i++){let x=r()*w,y=480+x*.34+Math.sin(x*.005)*140; // highlights along stream
   path(c,[[x,y],[x+20+r()*40,y-5]],2,'rgba(255,255,248,.4)');}
 // Solid wooden foot bridge across the actual curved water channel.
 c.save();c.translate(850,690);c.rotate(.62);
 c.fillStyle='#826a58';c.fillRect(-142,-42,284,84);
 for(let i=0;i<12;i++){c.fillStyle=i%2?'#b59a7b':'#c4ad8b';c.fillRect(-137+i*23,-38,20,77);}
 path(c,[[-145,-48],[-145,47]],9,'#644e42');path(c,[[144,-48],[144,47]],9,'#644e42');c.restore();
 for(const [x,y] of [[200,180],[490,1080],[1320,810],[1580,450]])
  tree(c,x,y,.9,['#547d75','#75a68a','#a4c7a5','#6b9e86'],x+y);
 for(let i=0;i<32;i++)stone(c,r()*w,r()*h,8+r()*27,5+r()*13,i%2?'#c9c7b1':'#e6e4cf');
}
function volcano(c,w,h,p,r){
 flagstones(c,[[160,1170],[520,1010],[650,760],[930,605],[1180,350],[1690,110]],r,p);
 polygon(c,[[0,235],[250,85],[420,245],[590,120],[820,300],[980,0],[1260,230],[1490,65],[1800,280],[1800,0],[0,0]],'#665b60');
 polygon(c,[[770,286],[980,30],[1220,280]],'#94716c');
 polygon(c,[[922,75],[980,30],[1042,72]],'#e7cab4');
 // Winding amber lava channels — glow embedded in the actual ground.
 const lava=[[1770,820],[1510,680],[1270,850],[1100,1050],[850,1180],[690,1290]];
 path(c,lava,100,'rgba(69,42,52,.67)');path(c,lava,58,'#b5583a');
 path(c,lava,36,'#efaa59');path(c,lava,10,'#ffe0a1');
 for(let i=0;i<31;i++){
  const x=r()*w,y=r()*h;
  stone(c,x,y,13+r()*34,7+r()*19,i%2?'#5d5152':'#816b67');
 }
 for(const [x,y] of [[310,470],[1020,350],[1410,900]]){
  // Basalt prismatic clusters, no candy-color sparkles.
  for(let j=0;j<6;j++){
   const dx=j*15-48,ht=34+(j%3)*28;
   polygon(c,[[x+dx-12,y],[x+dx-14,y-ht],[x+dx,y-ht-13],[x+dx+13,y-ht],[x+dx+13,y]],
    j%2?'#514b52':'#76636a','#a68f8b');
  }
 }
}
function ruins(c,w,h,p,r){
 flagstones(c,[[110,1190],[340,970],[610,840],[880,680],[1220,470],[1630,190]],r,p);
 // Astral stone observatory, complex concentric paving, ruined arches and
 // moonlit overgrowth — visually and spatially unlike the other four maps.
 for(let rad=270;rad>=180;rad-=43){c.strokeStyle=rad%2?'rgba(239,226,234,.3)':'rgba(68,76,113,.46)';
  c.lineWidth=10;c.beginPath();c.arc(990,580,rad,0,Math.PI*2);c.stroke();}
 for(let i=0;i<8;i++){
  const a=i*Math.PI/4,x=990+Math.cos(a)*232,y=580+Math.sin(a)*232;
  stone(c,x,y,27,22,'#b8b3c7');
 }
 for(const [x,y] of [[690,420],[1170,270],[1470,720],[470,930]]){
  c.fillStyle='#797e9b';c.fillRect(x-21,y-185,42,185);
  c.fillStyle='#a8abc7';c.fillRect(x-31,y-188,62,16);
  c.fillRect(x-28,y-10,56,16);
  path(c,[[x-29,y-190],[x+9,y-218],[x+31,y-190]],10,'#b8b9d0');
  bush(c,x+50,y+8,42,x+y,true);
 }
 // The observatory astrolabe, with delicate inlaid rings.
 c.save();c.translate(1000,575);c.rotate(-.13);
 for(const rad of [127,92,62]){c.strokeStyle=rad===62?'#e4d5d0':'#b7b8d0';
 c.lineWidth=rad===62?5:7;c.beginPath();c.ellipse(0,0,rad,rad*.69,.27,0,Math.PI*2);c.stroke();}
 for(let i=0;i<9;i++){const a=i*2.4;oval(c,Math.cos(a)*113,Math.sin(a)*76,3,3,'#f5e8c7');}c.restore();
 for(let i=0;i<20;i++)stone(c,r()*w,r()*h,10+r()*17,4+r()*10,'#a2a6b9');
}
function paint(id,w,h){
 if(!colors[id]||typeof document==='undefined')return null;
 const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
 const c=canvas.getContext('2d');
 if(!c)return null;
 const p=colors[id],r=base(c,w,h,id);
 ({home,sakura,creek,volcano,ruins})[id](c,w,h,p,r);
 // Plant some fine foreground accents after paths and structures.
 for(let i=0;i<140;i++){
  const x=r()*w,y=r()*h;
  if(id==='volcano'){if(i%4===0)stone(c,x,y,4+r()*7,2+r()*4,'rgba(218,191,171,.46)');}
  else if(id==='ruins'){if(i%5===0)oval(c,x,y,2,1,'rgba(243,233,250,.65)');}
  else if(i%3===0)bloom(c,x,y,3+r()*3,
    id==='sakura'?'#f6c7d2':id==='creek'?'#faf3c0':'#fff0c4',1200+i);
 }
 return canvas;
}
function draw(ctx,W,H,_t,theme,cam,worldSize){
 const id=theme?.region;
 if(!colors[id]||!cam||!worldSize||typeof document==='undefined')return false;
 const w=worldSize.width,h=worldSize.height;
 if(!cached||currentId!==id||cached.width!==w||cached.height!==h){
  cached=paint(id,w,h);currentId=id;generation++;
 }
 if(!cached)return false;
 ctx.drawImage(cached,-cam.x,-cam.y,w,h);
 return true;
}
function drawBattle(ctx,W,H,_t,theme){
 const id=theme?.region||'home';
 if(!colors[id])return false;
 if(!cached||currentId!==id){cached=paint(id,1800,1300);currentId=id;generation++;}
 if(!cached)return false;
 // Showcase the heart of the SAME region instead of the shared battle garden.
 // Slightly wider crop, with contact plane and legibility for fighting cats.
 const srcH=1050,srcW=srcH*W/Math.max(H,1);
 const x=Math.max(0,Math.min(cached.width-srcW,(cached.width-srcW)/2));
 const y=180;
 ctx.drawImage(cached,x,y,Math.min(srcW,cached.width),srcH,0,0,W,H);
 return true;
}
window.CatBondPaintedRegions={draw,drawBattle,build:paint,get region(){return currentId},get generation(){return generation},ids:IDS};
})();