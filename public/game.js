
"use strict";
const cv=document.getElementById("game"),c=cv.getContext("2d"),GAME=document.body.dataset.game;
const W=960,H=540,TAU=Math.PI*2,colors=["#47ddfc","#ffcb68","#fd79a8","#91efae","#ad95ff","#ff965a"];
const rand=(a,b)=>a+Math.random()*(b-a),rnd=n=>Math.floor(Math.random()*n),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const dist=(x,y,X,Y)=>Math.hypot(x-X,y-Y);
function box(x,y,w,h,color,r=12,stroke){c.fillStyle=color;c.beginPath();c.roundRect(x,y,Math.max(0,w),Math.max(0,h),r);c.fill();if(stroke){c.lineWidth=2;c.strokeStyle=stroke;c.stroke();}}
function circ(x,y,r,color){c.beginPath();c.arc(x,y,r,0,TAU);c.fillStyle=color;c.fill();}
function line(x,y,X,Y,color="#fff",wid=3){c.strokeStyle=color;c.lineWidth=wid;c.lineCap="round";c.beginPath();c.moveTo(x,y);c.lineTo(X,Y);c.stroke();}
function txt(x,y,str,size=20,color="#eff7ff",align="center",weight=800){c.fillStyle=color;c.textAlign=align;c.textBaseline="middle";c.font=weight+" "+size+"px system-ui,Segoe UI,sans-serif";c.fillText(str,x,y);}
function bg(a="#09172d",b="#112b4d"){const palette=({["flip-dash"]:["#3e3157","#7b4e79"],["parcel-panic"]:["#4d355c","#805565"],["tower-tuck"]:["#403653","#765779"],["traffic-tangle"]:["#344e57","#61766a"]})[GAME];if(palette){a=palette[0];b=palette[1];}const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,a);g.addColorStop(1,b);c.fillStyle=g;c.fillRect(0,0,W,H);for(let i=0;i<25;i++){circ((i*167+53)%960,(i*131+27)%540,1+(i%3), "#ffffff12");}}
function glow(x,y,r,color){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,"transparent");c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
let score=0,level=1,running=false,mode=null,last=performance.now(),elapsed=0;
const over=document.getElementById("overlay"),overTitle=document.getElementById("overlay-title"),overDesc=document.getElementById("overlay-desc"),goBtn=document.getElementById("play-btn");
function track(name,data){try{const k="arcade-metrics-"+GAME,m=JSON.parse(localStorage.getItem(k)||"{}");m[name]=(m[name]||0)+1;m.last=Date.now();localStorage.setItem(k,JSON.stringify(m));if(typeof window.va==="function")window.va("event",{name:"arcade_"+name,game:GAME,...(data||{})});}catch(e){}}
function add(n){score+=n;document.getElementById("score").textContent=Math.floor(score);const k="arcade-high-"+GAME,h=+(localStorage.getItem(k)||0);if(score>h){localStorage.setItem(k,String(Math.floor(score)));document.getElementById("best").textContent=Math.floor(score);}}
function info(s){document.getElementById("status").textContent=s;}
function start(){score=0;level=1;elapsed=0;document.getElementById("score").textContent="0";mode.init(level);running=true;over.hidden=true;track("start");}
function finish(w,msg,next=false){if(!running)return;running=false;track(w?"level_complete":"game_over",{level});over.hidden=false;document.getElementById("overlay-kicker").textContent=w?"LEVEL COMPLETE":"GAME OVER";overTitle.textContent=w?"Nice work!":"One more try?";overDesc.textContent=msg+"  •  Score: "+Math.floor(score);goBtn.textContent=next?"NEXT LEVEL":"PLAY AGAIN";goBtn.onclick=()=>{if(next){level++;elapsed=0;mode.init(level);running=true;over.hidden=true;track("level_start",{level});}else start();};}
function showInfo(){over.hidden=false;document.getElementById("overlay-kicker").textContent="HOW TO PLAY";overTitle.textContent=document.querySelector(".game-title").textContent;overDesc.textContent=document.body.dataset.instructions;goBtn.textContent=running?"RESUME":"PLAY NOW";const was=running;running=false;goBtn.onclick=()=>{if(was){running=true;over.hidden=true;}else start();};}
const G={};
// 01 PARCEL PANIC: drag packages to color-coded chutes.
G["parcel-panic"]=()=>{
let parcels=[],t=0,spawn=0,lives=5,chain=0,sel=null,delivered=0;
const bins=[205,480,755];
return {init(){parcels=[];t=0;spawn=.6;lives=5;chain=0;sel=null;delivered=0;info("5 chances • drag boxes to the same color dock");},
tick(dt){t+=dt;spawn-=dt;if(spawn<=0){const color=rnd(3),lane=rnd(3);parcels.push({x:bins[lane],y:45,color,vel:92+Math.min(130,t*1.35),seed:Math.random()});spawn=Math.max(.64,1.85-t*.008);}
for(let i=parcels.length-1;i>=0;i--){let p=parcels[i];p.y+=p.vel*dt;if(p.y>436){const nearest=bins.findIndex(b=>Math.abs(p.x-b)<84);if(nearest===p.color){chain++;delivered++;add(12+Math.min(50,chain*3));}else{chain=0;lives--;if(lives<=0){finish(false,"The delivery docks overflowed. Deliveries: "+delivered);return;}}parcels.splice(i,1);}}info("Lives: "+lives+"  |  Streak: "+chain+"  |  Delivered: "+delivered);},
down(x,y){for(let i=parcels.length-1;i>=0;i--){const p=parcels[i];if(Math.abs(x-p.x)<50&&Math.abs(y-p.y)<42){sel=p;break;}}},move(x,y){if(sel)sel.x=clamp(x,145,815);},up(){sel=null;},
draw(){bg("#0b1830","#18264c");for(let i=0;i<3;i++){const x=bins[i];box(x-79,80,158,390,"#142544",15,"#284366");for(let y=96;y<435;y+=45)line(x-68,y,x+68,y,"#ffffff08",2);box(x-84,433,168,76,colors[i]+"33",17,colors[i]);txt(x,465,["CYAN","GOLD","PINK"][i],19,colors[i]);txt(x,490,"DOCK "+(i+1),11,"#a9c0df");}for(let p of parcels){const col=colors[p.color];box(p.x-39,p.y-29,78,58,col,11,"#ffffff99");box(p.x-23,p.y-19,46,38,"#ffffff28",6);txt(p.x,p.y,["C","G","P"][p.color],22,"#10263a");}box(308,12,344,33,"#1d3354",14);txt(480,30,"DRAG PACKAGES INTO MATCHING DOCKS",13,"#d5e4fa");},
hud(){return "Sort accurately to build a score multiplier";}};
};
// 02 FLIP DASH: endless one-button side switch.
G["flip-dash"]=()=>{
let y=420,top=false,obs=[],gems=[],time=0,spawn=0,inv=0;
return {init(){y=420;top=false;obs=[];gems=[];time=0;spawn=.30;inv=0;info("Tap / Space to flip gravity");},
tick(dt){time+=dt;spawn-=dt;inv-=dt;const speed=310+Math.min(195,time*8);y+=( (top?125:415)-y)*Math.min(1,dt*10);if(spawn<=0){const side=rnd(2);obs.push({x:895,side,hit:false});if(Math.random()<.85)gems.push({x:980,y:side?125:415,got:false});spawn=Math.max(.65,1.04-time*.018);}for(let o of obs){o.x-=dt*speed;if(!o.hit&&Math.abs(o.x-210)<38&&Math.abs(y-(o.side?125:415))<70){o.hit=true;if(inv<=0){finish(false,"You survived "+Math.floor(time)+" seconds.");return;}}}for(let p of gems){p.x-=dt*speed;if(!p.got&&Math.abs(p.x-210)<31&&Math.abs(y-p.y)<43){p.got=true;add(20);}}obs=obs.filter(o=>o.x>-65);gems=gems.filter(o=>o.x>-30&&!o.got);if(Math.floor(time*2)>Math.floor((time-dt)*2))add(1);info(Math.floor(time)+" seconds alive  •  Speed "+Math.floor(speed));},
down(){top=!top;},key(k){if(k===" "||k==="ArrowUp"||k==="ArrowDown")top=!top;},
draw(){bg("#0e1036","#1e2865");glow(480,270,360,"#6640ec22");box(0,80,960,13,"#56cfff");box(0,450,960,13,"#56cfff");for(let i=0;i<20;i++){const x=((i*80-time*150)%1040+1040)%1040;line(x,92,x+30,92,"#7deaff33",5);line(x,454,x+30,454,"#7deaff33",5);}for(let o of obs){const yy=o.side?95:374;box(o.x-26,yy,52,66,"#fd6486",8);txt(o.x,yy+32,"✦",29,"#681e3a");glow(o.x,yy+30,60,"#fb2c6922");}for(let p of gems)if(!p.got){circ(p.x,p.y,13,"#ffcf6e");txt(p.x,p.y,"✧",25,"#fff");}glow(210,y,65,"#53e2ff44");circ(210,y,21,"#69eaff");circ(220,y-5,5,"#142b50");txt(480,260,"TAP TO FLIP",32,"#ffffff20");},
hud(){return "Every extra second increases the speed";}};
};
// 03 ORBIT ESCAPE: three linked orbital tracks.
G["orbit-escape"]=()=>{
let a=0,ring=1,rad=145,stars=[],hazards=[],sec=0,hp=3,inv=0,spawn=0;
const radii=[87,149,210],cx=480,cy=275;const dif=(p,q)=>Math.abs(Math.atan2(Math.sin(p-q),Math.cos(p-q)));
function makeStar(){stars.push({r:rnd(3),a:rand(0,TAU)});}
return{init(){a=0;ring=1;rad=radii[ring];stars=[];hazards=[];sec=0;hp=3;inv=0;spawn=1.3;for(let i=0;i<5;i++)makeStar();info("Tap to hop ring • 3 shields");},
tick(dt){sec+=dt;inv-=dt;spawn-=dt;a=(a+dt*(.8+Math.min(.7,sec*.006)))%TAU;rad+=(radii[ring]-rad)*Math.min(1,dt*12);if(spawn<=0){hazards.push({r:rnd(3),a:rand(0,TAU),spin:rand(-.5,-.17)});spawn=Math.max(.75,1.9-sec*.01);}for(let s of stars){if(s.r===ring&&dif(s.a,a)<.11){s.a=rand(0,TAU);s.r=rnd(3);add(15);}}for(let i=hazards.length-1;i>=0;i--){let o=hazards[i];o.a=(o.a+o.spin*dt+TAU)%TAU;if(o.r===ring&&dif(o.a,a)<.13&&inv<=0){inv=1.5;hp--;hazards.splice(i,1);if(hp<=0){finish(false,"Your orbit lasted "+Math.floor(sec)+" seconds.");return;}}}if(hazards.length>10)hazards.shift();if(Math.floor(sec)>Math.floor(sec-dt))add(2);info("Shields: "+hp+"  •  "+Math.floor(sec)+" seconds");},
down(){ring=(ring+1)%3;},key(k){if(k===" "||k==="ArrowUp")ring=(ring+1)%3;},
draw(){bg("#080f2c","#1a285b");glow(cx,cy,260,"#366cdb2b");for(let r of radii){c.beginPath();c.arc(cx,cy,r,0,TAU);c.strokeStyle="#79aafc55";c.lineWidth=3;c.stroke();}circ(cx,cy,34,"#ffc47a");glow(cx,cy,84,"#ed946c4d");for(let s of stars){let x=cx+Math.cos(s.a)*radii[s.r],y=cy+Math.sin(s.a)*radii[s.r];circ(x,y,11,"#ffe385");txt(x,y,"✦",23,"#fff");}for(let o of hazards){let x=cx+Math.cos(o.a)*radii[o.r],y=cy+Math.sin(o.a)*radii[o.r];glow(x,y,32,"#ff456d66");circ(x,y,14,"#f95d80");}let px=cx+Math.cos(a)*rad,py=cy+Math.sin(a)*rad;glow(px,py,47,inv>0?"#ffffff55":"#77fbe477");circ(px,py,16,"#6eefd9");circ(px+5,py-4,5,"#0b1d3a");txt(480,34,"TAP TO JUMP ORBITS",16,"#a8d2f9");},
hud(){return "Collect stars as long as you can survive";}};
};
// 04 TOWER TUCK: precision alignment.
G["tower-tuck"]=()=>{
let stack=[],x=50,v=200,w=240,baseX=360,movingY=0,perfect=0;
function drop(){const last=stack[stack.length-1],L=Math.max(x,last.x),Rt=Math.min(x+w,last.x+last.w),ov=Rt-L;if(ov<19){finish(false,"The tower slipped at height "+(stack.length-1));return;}let nx=L,nw=ov;if(Math.abs(x-last.x)<7){nx=last.x;nw=last.w;perfect++;add(35);}else{perfect=0;add(15);}stack.push({x:nx,w:nw});x=rnd(2)?30:930-nw;w=nw;v=(v>0?-1:1)*(210+Math.min(280,stack.length*18));if(stack.length>=15){finish(true,"You stacked 14 perfectly balanced floors!",true);}}
return{init(){stack=[{x:360,w:240}];x=25;w=240;v=200;perfect=0;info("Tap or Space to drop the block");},
tick(dt){x+=v*dt;if(x<16){x=16;v=Math.abs(v);}if(x+w>944){x=944-w;v=-Math.abs(v);}info("Floors: "+(stack.length-1)+" / 14  |  Perfects: "+perfect);},
down(){drop();},key(k){if(k===" "||k==="Enter")drop();},
draw(){bg("#131331","#363078");glow(480,430,400,"#ae8efd18");for(let i=0;i<25;i++){line(i*40,465,i*40,540,"#ffffff09",1);}box(240,469,480,18,"#cfd5fd",8);for(let i=0;i<stack.length;i++){const b=stack[i],y=432-i*24;box(b.x,y,b.w,23,colors[i%6],5,"#ffffff55");}let y=432-stack.length*24;box(x,y,w,23,"#ffffff",6,"#f9d08f");line(x+w/2,y-28,x+w/2,y-8,"#ffffff50",2);txt(480,40,"STACK CLEANLY • KEEP YOUR OVERLAP",16,"#d5ddff");},
hud(){return "Perfect alignment rewards extra points";}};
};
// 05 TRAFFIC TANGLE: sliding block logic board.
G["traffic-tangle"]=()=>{
let cars=[],moves=0,pick=null,startX=0,startY=0,selected=-1;
const bx=288,by=77,s=64;
function occupied(x,y,skip){return cars.some((v,i)=>i!==skip&&x>=v.x&&x<v.x+(v.h?1:v.l)&&y>=v.y&&y<v.y+(v.h?v.l:1));}
function slide(i,delta){if(!delta)return;let a=cars[i],step=Math.sign(delta),n=Math.abs(delta);for(let k=0;k<n;k++){let nx=a.x+(a.h?0:step),ny=a.y+(a.h?step:0);let clear=true;for(let j=0;j<a.l;j++){let X=nx+(a.h?0:j),Y=ny+(a.h?j:0);if(X<0||X>5||Y<0||Y>5||occupied(X,Y,i)){clear=false;break;}}if(!clear)break;a.x=nx;a.y=ny;moves++;}if(cars[0].x+cars[0].l===6){add(Math.max(40,160-moves*4));finish(true,"You escaped in "+moves+" moves.",true);}info("Moves: "+moves+"  •  Slide the red car right");}
return{init(L){cars=[{x:0,y:2,l:2,h:false,color:"#fb6488"}];const count=Math.min(4,2+Math.floor(L/2));for(let i=0;i<count;i++)cars.push({x:2+i,y:i%2?2:1,l:2,h:true,color:colors[(i+1)%colors.length]});if(L>=3)cars.push({x:0,y:4,l:2,h:false,color:"#8a9ddd"});moves=0;pick=null;selected=-1;info("Drag cars to clear a path for the red car");},
down(x,y){const gx=Math.floor((x-bx)/s),gy=Math.floor((y-by)/s);pick=cars.findIndex(v=>gx>=v.x&&gx<v.x+(v.h?1:v.l)&&gy>=v.y&&gy<v.y+(v.h?v.l:1));if(pick<0)pick=null;selected=pick===null?-1:pick;startX=x;startY=y;},
up(x,y){if(pick===null)return;const v=cars[pick],delta=Math.round((v.h?y-startY:x-startX)/s);slide(pick,delta);pick=null;},
key(k){if(selected<0)return;const v=cars[selected];if(k==="ArrowLeft"&&!v.h)slide(selected,-1);if(k==="ArrowRight"&&!v.h)slide(selected,1);if(k==="ArrowUp"&&v.h)slide(selected,-1);if(k==="ArrowDown"&&v.h)slide(selected,1);},
draw(){bg("#0d1732","#1b3158");box(bx-12,by-12,408,408,"#294368",20,"#7d98ba");for(let y=0;y<6;y++)for(let x=0;x<6;x++)box(bx+x*s+2,by+y*s+2,s-4,s-4,(x+y)%2?"#182946":"#1d3150",7);box(bx+6*s-1,by+2*s+9,61,46,"#6dffe433",12,"#69f8dc");txt(899,by+2*s+32,"EXIT",15,"#a0ffdd");cars.forEach((v,i)=>{let X=bx+v.x*s+5,Y=by+v.y*s+5,ww=(v.h?1:v.l)*s-10,hh=(v.h?v.l:1)*s-10;box(X,Y,ww,hh,v.color,14,i===selected?"#fff":"#ffffff66");const cx=X+ww/2,cy=Y+hh/2;txt(cx,cy,i===0?"➜":v.h?"↕":"↔",25,"#19233d");});txt(166,181,"MOVE THE",23,"#b8d3ff");txt(166,211,"RED CAR",28,"#ff91a7");txt(166,242,"TO THE EXIT",20,"#b8d3ff");},
hud(){return "Swipes move cars; arrows move selected car";}};
};
// 06 COLOR CURRENT: rotatable pipe network, always solvable.
G["color-current"]=()=>{
let tiles=[],path=[],puls=0,turns=0;
const bx=288,by=70,s=66,nx=6,ny=6,dirs=[[0,-1],[1,0],[0,1],[-1,0]];
const rot=m=>((m<<1)&15)|((m>>3)&1);
function dir(a,b){if(b[0]>a[0])return 1;if(b[0]<a[0])return 3;if(b[1]>a[1])return 2;return 0;}
function connected(){const q=[[0,2]],seen=new Set(["0,2"]);while(q.length){const [x,y]=q.shift(),m=tiles[y][x].mask;if(x===5&&y===2&&(m&2))return true;for(let d=0;d<4;d++){if(!(m&(1<<d)))continue;let X=x+dirs[d][0],Y=y+dirs[d][1];if(X<0||X>=nx||Y<0||Y>=ny)continue;let key=X+","+Y;if(!seen.has(key)&&(tiles[Y][X].mask&(1<<((d+2)%4)))){seen.add(key);q.push([X,Y]);}}}return false;}
return{init(L){turns=0;path=[[0,2]];let y=2;for(let x=1;x<6;x++){path.push([x,y]);if(x===5){while(y!==2){y+=Math.sign(2-y);path.push([x,y]);}}else if(Math.random()<.8){let dy=(rnd(2)?1:-1);if(y+dy<1||y+dy>4)dy=-dy;y+=dy;path.push([x,y]);}}tiles=Array.from({length:ny},()=>Array.from({length:nx},()=>({mask:Math.random()<.6?5:3,real:false})));for(let i=0;i<path.length;i++){const [x,y]=path[i];const prev=path[i-1]||[-1,2],next=path[i+1]||[6,2];let m=(1<<dir([x,y],prev))|(1<<dir([x,y],next));const turns=rnd(4);for(let j=0;j<turns;j++)m=rot(m);tiles[y][x]={mask:m,real:true};}if(connected())tiles[2][0].mask=rot(tiles[2][0].mask);info("Rotate pipes until the current reaches the exit");},
tick(dt){puls+=dt;},down(x,y){let X=Math.floor((x-bx)/s),Y=Math.floor((y-by)/s);if(X<0||Y<0||X>=nx||Y>=ny)return;tiles[Y][X].mask=rot(tiles[Y][X].mask);turns++;if(connected()){add(Math.max(50,200-turns*4));finish(true,"Circuit complete in "+turns+" rotations.",true);}else info("Rotations: "+turns+"  |  Connect left to right");},
draw(){bg("#071f34","#0f3557");box(bx-10,by-10,416,416,"#1a3c59",20,"#3f7592");for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){const xx=bx+x*s,yy=by+y*s,t=tiles[y][x];box(xx+3,yy+3,s-6,s-6,"#112c46",9,"#23516c");circ(xx+s/2,yy+s/2,9,"#4ce9df");for(let d=0;d<4;d++)if(t.mask&(1<<d))line(xx+s/2,yy+s/2,xx+s/2+dirs[d][0]*24,yy+s/2+dirs[d][1]*24,"#50ded9",11);}glow(bx,by+2*s+33,55,"#58ffff99");txt(225,by+2*s+32,"SOURCE",15,"#78f7f3");txt(772,by+2*s+32,"GOAL",16,"#86ffd5");line(262,by+2*s+33,bx+25,by+2*s+33,"#61faed",8);line(bx+6*s-26,by+2*s+33,728,by+2*s+33,"#87f8c4",8);},
hud(){return "Every puzzle starts from a solvable circuit";}};
};
// 07 PERFECT POUR: color-sort puzzle with undo.
G["perfect-pour"]=()=>{
let bottles=[],selected=-1,moves=0,history=[],n=4;
const xx=i=>480+(i-(bottles.length-1)/2)*112;
function full(){return bottles.every(b=>!b.length||(b.length===4&&b.every(v=>v===b[0])));}
return{init(L){n=Math.min(6,3+Math.ceil(L/2));let arr=[];for(let i=0;i<n;i++)for(let j=0;j<4;j++)arr.push(i);do{arr.sort(()=>Math.random()-.5);bottles=Array.from({length:n},(_,i)=>arr.slice(i*4,i*4+4));}while(full()||bottles.some(b=>b.every(x=>x===b[0])));bottles.push([],[]);selected=-1;moves=0;history=[];info("Tap a bottle, then a destination. Match top layers.");},
down(x,y){if(y<120||y>455)return;let i=bottles.findIndex((b,j)=>Math.abs(x-xx(j))<44);if(i<0)return;if(selected<0){if(bottles[i].length)selected=i;return;}if(selected===i){selected=-1;return;}const from=bottles[selected],to=bottles[i];if(from.length&&to.length<4&&(!to.length||to[to.length-1]===from[from.length-1])){history.push(bottles.map(b=>b.slice()));let val=from[from.length-1];while(from.length&&to.length<4&&from[from.length-1]===val)to.push(from.pop());moves++;add(3);if(full()){add(Math.max(0,120-moves*2));finish(true,"Every color has found its bottle.",true);}}selected=-1;info("Moves: "+moves+"  |  Colors: "+n);},
key(k){if(k.toLowerCase()==="u"&&history.length){bottles=history.pop();moves=Math.max(0,moves-1);selected=-1;}},
draw(){bg("#231b39","#3f2c64");glow(480,260,380,"#d987f51b");txt(480,61,"ONE COLOR PER BOTTLE",22,"#e8d6fa");for(let i=0;i<bottles.length;i++){const x=xx(i);if(i===selected)glow(x,275,100,"#ffffff55");box(x-43,163,86,244,"#ffffff13",18,i===selected?"#ffffff":"#ffffff70");box(x-28,145,56,22,"#ffffff33",8);for(let j=0;j<bottles[i].length;j++){const yy=399-j*55;box(x-36,yy-47,72,52,colors[bottles[i][j]],8,"#ffffff44");}txt(x,440,String(i+1),14,"#d3bcf9");}txt(480,493,"CLICK BOTTLE → CLICK DESTINATION  •  U = UNDO",15,"#c6bee9");},
hud(){return "Use U to undo your last pour";}};
};
// 08 GRID GLIDER: maze puzzle.
G["grid-glider"]=()=>{
let walls=new Set(),stars=new Set(),px=0,py=0,steps=0,sec=0,initial=null;
const N=7,S=55,bx=288,by=68;
function key(x,y){return x+","+y;}
function move(dx,dy){let X=px+dx,Y=py+dy;if(X<0||X>=N||Y<0||Y>=N||walls.has(key(X,Y)))return;px=X;py=Y;steps++;if(stars.delete(key(px,py)))add(20);if(px===6&&py===6&&stars.size===0){add(Math.max(30,190-steps));finish(true,"Maze escaped in "+steps+" steps.",true);}}
return{init(L){px=0;py=0;steps=0;sec=0;walls=new Set();stars=new Set();let safe=new Set();for(let x=0;x<N;x++)safe.add(key(x,0));for(let y=0;y<N;y++)safe.add(key(6,y));for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(!safe.has(key(x,y))&&Math.random()<Math.min(.22,.08+L*.015))walls.add(key(x,y));let reach=new Set([key(0,0)]),queue=[[0,0]];for(let i=0;i<queue.length;i++){const [x,y]=queue[i];for(let [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){let X=x+dx,Y=y+dy,k=key(X,Y);if(X>=0&&X<N&&Y>=0&&Y<N&&!walls.has(k)&&!reach.has(k)){reach.add(k);queue.push([X,Y]);}}}let options=[...reach].filter(v=>v!=="0,0"&&v!=="6,6");for(let i=0;i<Math.min(5,options.length);i++){let j=rnd(options.length);stars.add(options.splice(j,1)[0]);}info("Collect "+stars.size+" stars, then reach the portal");},
tick(dt){sec+=dt;if(sec>95){finish(false,"Time ran out. Steps taken: "+steps);return;}info(stars.size+" stars left  •  "+Math.ceil(95-sec)+"s  •  "+steps+" steps");},
down(x,y){initial={x,y};let X=Math.floor((x-bx)/S),Y=Math.floor((y-by)/S);if(Math.abs(X-px)+Math.abs(Y-py)===1)move(X-px,Y-py);},
up(x,y){if(!initial)return;let dx=x-initial.x,dy=y-initial.y;initial=null;if(Math.max(Math.abs(dx),Math.abs(dy))<20)return;if(Math.abs(dx)>Math.abs(dy))move(Math.sign(dx),0);else move(0,Math.sign(dy));},
key(k){const d={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],a:[-1,0],s:[0,1],d:[1,0]}[k];if(d)move(...d);},
draw(){bg("#0b2442","#17506d");box(bx-9,by-9,403,403,"#294c69",15,"#7aa0bd");for(let y=0;y<N;y++)for(let x=0;x<N;x++){const X=bx+x*S,Y=by+y*S,k=key(x,y);box(X+2,Y+2,S-4,S-4,walls.has(k)?"#13253a":"#1d3f56",8);if(stars.has(k))txt(X+S/2,Y+S/2,"✦",32,"#ffe58c");if(x===6&&y===6){circ(X+S/2,Y+S/2,18,"#ab9eff");circ(X+S/2,Y+S/2,9,"#283b67");}}glow(bx+px*S+S/2,by+py*S+S/2,44,"#73fada66");circ(bx+px*S+S/2,by+py*S+S/2,16,"#78f8d5");txt(146,205,"COLLECT",21,"#caeaff");txt(146,237,"ALL STARS",23,"#ffe58c");txt(146,276,"FIND EXIT",20,"#caeaff");},
hud(){return "Use arrow keys, WASD, or swipe";}};
};
// 09 MIRROR MOSAIC: speed pattern reproduction.
G["mirror-mosaic"]=()=>{
let n=8,goal=[],placed=[],secs=0,completed=0;
const s=45,bx=300,by=70;
function win(){return goal.every((v,i)=>v===placed[i]);}
return{init(L){goal=[];placed=[];secs=60;for(let i=0;i<n*n/2;i++){goal.push(Math.random()<(L>3?.52:.40));placed.push(false);}completed=0;info("Paint the left half to match the small preview");},
tick(dt){secs-=dt;if(secs<=0){finish(false,"Time is up. Keep practicing your patterns.");return;}info(Math.ceil(secs)+" seconds  •  Mirror each target pixel");},
down(x,y){let X=Math.floor((x-bx)/s),Y=Math.floor((y-by)/s);if(X<0||Y<0||X>=n||Y>=n)return;if(X>=n/2)X=n-1-X;let i=Y*(n/2)+X;placed[i]=!placed[i];if(win()){add(100+Math.ceil(secs));finish(true,"Perfectly mirrored!",true);}},
draw(){bg("#231a3f","#312765");txt(144,128,"TARGET",20,"#f7d5ff");box(47,148,196,196,"#3b355b",15);let ps=19;for(let y=0;y<n;y++)for(let x=0;x<n;x++){const i=y*(n/2)+(x<n/2?x:n-1-x);box(70+x*ps,172+y*ps,ps-2,ps-2,goal[i]?"#ffb1dd":"#463d68",2);}txt(480,35,"PAINT ONE SIDE • THE OTHER MIRRORS",19,"#f0dafe");for(let y=0;y<n;y++)for(let x=0;x<n;x++){const i=y*(n/2)+(x<n/2?x:n-1-x),v=placed[i];box(bx+x*s+2,by+y*s+2,s-4,s-4,v?"#ef8fe2":"#39335c",5,"#ffffff24");if(x===3||x===4)line(bx+4*s,by+y*s,bx+4*s,by+(y+1)*s,"#ffffff80",2);}txt(480,476,"TAP SQUARES TO PAINT OR ERASE",16,"#e1c7fa");},
hud(){return "Build the shape using both sides of the mirror";}};
};
// 10 POCKET AQUARIUM: persistent incremental.
G["pocket-aquarium"]=()=>{
let pearls=0,fish=1,filter=0,decor=0,swimmers=[],saveT=0,sec=0,feedFx=[];
function fishCost(){return Math.floor(12*Math.pow(1.32,fish-1));}function filterCost(){return 35*(filter+1)*(filter+1);}function decorCost(){return 28*(decor+1)*2;}
function spawn(){swimmers=[];for(let i=0;i<Math.min(45,fish);i++)swimmers.push({x:rand(100,850),y:rand(120,395),v:rand(.35,1.2)*(Math.random()<.5?-1:1),t:rand(0,TAU),color:colors[i%6],size:rand(12,24)});}
function save(){try{localStorage.setItem("arcade-aquarium",JSON.stringify({pearls,fish,filter,decor}))}catch(e){}}
return{init(){try{const v=JSON.parse(localStorage.getItem("arcade-aquarium")||"{}");pearls=v.pearls||0;fish=v.fish||1;filter=v.filter||0;decor=v.decor||0;}catch(e){pearls=0;fish=1;filter=0;decor=0;}spawn();saveT=0;sec=0;feedFx=[];info("Click the water to earn pearls; buy upgrades below.");},
tick(dt){sec+=dt;saveT+=dt;pearls+=(fish*.22+filter*.65)*dt;for(let f of swimmers){f.x+=f.v*24*dt;f.y+=Math.sin(sec*2+f.t)*.14;if(f.x>890)f.v=-Math.abs(f.v);if(f.x<70)f.v=Math.abs(f.v);}for(let p of feedFx)p.life-=dt;feedFx=feedFx.filter(p=>p.life>0);if(saveT>5){save();saveT=0;}info("Pearls: "+Math.floor(pearls)+"  •  Fish: "+fish+"  •  Income: "+(fish*.22+filter*.65).toFixed(1)+"/s");},
down(x,y){if(y>443){if(x<340&&pearls>=fishCost()){pearls-=fishCost();fish++;spawn();add(30);track("upgrade",{type:"fish"});}else if(x>=340&&x<620&&pearls>=filterCost()){pearls-=filterCost();filter++;add(50);track("upgrade",{type:"filter"});}else if(x>=620&&pearls>=decorCost()){pearls-=decorCost();decor++;add(60);track("upgrade",{type:"coral"});}save();return;}pearls+=1+decor*.5;add(1);feedFx.push({x,y,life:.7});},
draw(){bg("#052a46","#086080");glow(500,140,380,"#15ffe516");for(let i=0;i<20;i++){const x=i*59+22,y=(((i*61-sec*(10+i%4*9))%390)+390)%390+32;circ(x,y,3+i%4,"#b9f9ff33");}box(0,405,960,40,"#225f64");for(let i=0;i<22;i++)circ((i*83+17)%960,420+rnd(0),rand(1,1)+10+i%5,colors[(i+decor)%6]+"77");for(let i=0;i<Math.min(decor,7);i++){const x=85+i*140;line(x,410,x-14,370,"#ffa6c8",7);line(x,410,x+18,359,"#ec7eab",6);}for(let f of swimmers){c.save();c.translate(f.x,f.y);c.scale(Math.sign(f.v),1);c.fillStyle=f.color;c.beginPath();c.ellipse(0,0,f.size*1.5,f.size,0,0,TAU);c.fill();c.beginPath();c.moveTo(-f.size,0);c.lineTo(-f.size*2,-f.size);c.lineTo(-f.size*2,f.size);c.fill();circ(f.size*.65,-f.size*.2,3,"#153958");c.restore();}for(let p of feedFx){glow(p.x,p.y,27*p.life,"#ffee9577");txt(p.x,p.y-p.life*30,"+1",21,"#fbed92");}box(12,450,290,73,"#19465c",14,"#578c99");box(335,450,290,73,"#19465c",14,"#578c99");box(658,450,290,73,"#19465c",14,"#578c99");txt(157,475,"NEW FISH",20,"#acfcf6");txt(157,502,fishCost()+" pearls",14,"#f9ec9b");txt(480,475,"BETTER FILTER",20,"#acfcf6");txt(480,502,filterCost()+" pearls",14,"#f9ec9b");txt(803,475,"GLOWING CORAL",20,"#acfcf6");txt(803,502,decorCost()+" pearls",14,"#f9ec9b");txt(480,33,"CLICK WATER TO FEED • BUILD YOUR REEF",17,"#aff7f6");},
hud(){return "Your aquarium progress is saved in this browser";}};
};
function point(e){const a=cv.getBoundingClientRect();return{x:clamp((e.clientX-a.left)*W/a.width,0,W),y:clamp((e.clientY-a.top)*H/a.height,0,H)};}
let held=false;cv.addEventListener("pointerdown",e=>{if(!running)return;held=true;cv.setPointerCapture(e.pointerId);const p=point(e);mode.down?.(p.x,p.y);});
cv.addEventListener("pointermove",e=>{if(!running||!held)return;const p=point(e);mode.move?.(p.x,p.y);});
cv.addEventListener("pointerup",e=>{if(!running)return;held=false;const p=point(e);mode.up?.(p.x,p.y);});
window.addEventListener("keydown",e=>{if(!running)return;if([" ","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key))e.preventDefault();mode.key?.(e.key);});
mode=(G[GAME]||G["parcel-panic"])();mode.init(1);
document.getElementById("best").textContent=localStorage.getItem("arcade-high-"+GAME)||"0";
document.getElementById("restart").onclick=()=>{track("restart");start();};
document.getElementById("help").onclick=()=>showInfo();
goBtn.onclick=start;track("page_view");
function frame(t){const dt=clamp((t-last)/1000,0,.033);last=t;if(running){elapsed+=dt;mode.tick(dt);}mode.draw();requestAnimationFrame(frame);}requestAnimationFrame(frame);
