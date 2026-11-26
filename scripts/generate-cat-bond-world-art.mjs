import fs from "node:fs";
const generateArt=function generateArt(){
const W=1440,H=810;
const palettes={
 harbor:{sky:["#243e66","#edb48a","#d8b18d"],far:"#456b7b",mid:"#769394",ground:"#537d83",path:"#c3ad92",edge:"#5d666a",light:"#ffdca1"},
 forest:{sky:["#142f3c","#487a70","#aac39b"],far:"#314f50",mid:"#426954",ground:"#435d43",path:"#b5a180",edge:"#554e40",light:"#e6eeb0"},
 forge:{sky:["#251f34","#905449","#d69b60"],far:"#4b3c47",mid:"#6e5351",ground:"#534b50",path:"#ad967f",edge:"#332e37",light:"#ffcf85"},
 sky:{sky:["#2f587e","#9dbbc9","#f1d8b9"],far:"#647d9b",mid:"#a0b5bc",ground:"#648e81",path:"#d3c3a0",edge:"#526c79",light:"#fff3cc"},
 library:{sky:["#161f3d","#566383","#b2a8bd"],far:"#2a3554",mid:"#51566d",ground:"#343e57",path:"#9e9cae",edge:"#32354b",light:"#e8d2a1"},
 starfall:{sky:["#121932","#3b365b","#917d9c"],far:"#303a58",mid:"#4c4e69",ground:"#4a4565",path:"#a09aa8",edge:"#37324f",light:"#e1ceff"}
};
const paths={harbor:[[.1,.86],[.23,.71],[.47,.71],[.47,.44],[.74,.44],[.88,.22]],forest:[[.1,.86],[.29,.73],[.29,.4],[.53,.36],[.75,.61],[.88,.23]],forge:[[.1,.86],[.35,.76],[.35,.47],[.65,.47],[.65,.23],[.88,.23]],sky:[[.1,.86],[.23,.66],[.47,.66],[.59,.42],[.78,.42],[.88,.19]],library:[[.1,.86],[.22,.68],[.48,.68],[.48,.42],[.76,.42],[.88,.2]],starfall:[[.1,.86],[.31,.72],[.41,.46],[.66,.59],[.77,.35],[.88,.2]]};
const rnd=(seed)=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const f=n=>Math.round(n*10)/10;
const P=(d,fill,more="")=>`<path d="${d}" fill="${fill}" ${more}/>`;
const E=(x,y,rx,ry,fill,more="")=>`<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="${fill}" ${more}/>`;
const R=(x,y,w,h,fill,more="")=>`<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${fill}" ${more}/>`;
const G=(s,body)=>`<g transform="${s}">${body}</g>`;
const L=(d,c,width=2,opacity=1)=>P(d,"none",`stroke="${c}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round" opacity="${opacity}"`);
function grad(id,colors){return `<linearGradient id="${id}" x2="0" y2="1">${colors.map((c,i)=>`<stop offset="${i/(colors.length-1)}" stop-color="${c}"/>`).join("")}</linearGradient>`;}
function mountain(r,y,amp,col){let d=`M-40 ${y+100}`;for(let x=-40;x<=W+60;x+=28)d+=` L${x} ${f(y-Math.sin(x*.006)*amp*.45-r()*amp)}`;return P(d+` L${W+70} ${H+50} L-40 ${H+50}Z`,col);}
function clouds(r,c,opacity=.35,count=40){return `<g filter="url(#mist)" opacity="${opacity}">${Array.from({length:count},()=>E(r()*W,r()*400,35+r()*180,6+r()*32,c)).join("")}</g>`;}
function tree(x,y,scale,r,kind="pine"){
 let b="";
 if(kind==="pine"){
 b=P("M-5 0L-3 -130 3 -130 8 0Z","#544b42");
 for(let j=0;j<7;j++){let yy=-130+j*15,w=15+j*10;b+=P(`M0 ${yy-16}Q${-w*.5} ${yy+3} ${-w} ${yy+30}Q${-w*.25} ${yy+25} 0 ${yy+14}Q${w*.4} ${yy+32} ${w} ${yy+25}Z`,["#254c4d","#416b5c","#60836a","#31564e"][j%4]);}
 }else{
 b=P("M-22 0Q-8 -51 -12 -86Q-18 -119 -5 -165L16 -174Q5 -110 17 -77Q27 -38 27 0Z","#514c3c");
 b+=P("M-10 -65Q-36 -110 -86 -136L-95 -126Q-41 -88 -17 -49Z","#5b5540")+P("M11 -79Q52 -116 83 -142L93 -132Q43 -87 15 -53Z","#5b5540");
 b+=L("M-9 -3Q4 -75 -4 -133","#a38f68",4,.65)+L("M12 -8Q9 -70 11 -116","#2d3c34",3,.7);
 for(let j=0;j<42;j++){const a=r()*Math.PI*2,rr=Math.sqrt(r())*75,cx=Math.cos(a)*rr,cy=-145+Math.sin(a)*rr*.62;b+=E(cx,cy,20+r()*24,13+r()*21,["#2f5c48","#3e7456","#52845f","#6e9b68","#779969","#235745"][j%6],`opacity="${.65+r()*.35}"`);}
 for(let j=0;j<45;j++){const xx=(r()-.5)*150,yy=-178+r()*62;b+=L(`M${f(xx)} ${f(yy)}q${f(r()*12)} -5 ${f(12+r()*8)} 2`,"#c6cb83",1.5,.35);}
 }
 return G(`translate(${f(x)} ${f(y)}) scale(${f(scale)})`,b);
}
function house(x,y,s,r,t="harbor"){
 const wall=t==="forge"?"#867365":"#c8b89e",roof=t==="forge"?"#624b47":"#a56958",shade=t==="forge"?"#443a40":"#897d76";
 let b=P("M-49 0V-71L0 -98 49 -71V0Z",wall,`stroke="${shade}" stroke-width="2"`)+P("M-49 -71L0 -98 0 -16 -49 0Z",shade,`opacity=".24"`)+P("M-57 -69L0 -115 59 -69 48 -62 0 -97 -46 -62Z",roof,`stroke="#6c5a55" stroke-width="2"`)+L("M-51 -71L0 -111 53 -71","#e5bd93",2,.65);
 b+=P("M-10 0V-25Q0 -41 10 -25V0Z","#514d4b");for(let j=0;j<3;j++){const xx=-35+j*28;b+=R(xx,-59,14,22,"#435667",`rx="3" stroke="#dfc9a8" stroke-width="2"`)+R(xx+3,-56,8,15,j===1?"#edbc77":"#a4c6c3",`opacity=".72"`)+L(`M${xx+7} -58v20M${xx} -48h14`,"#5c5d62",1.4);}
 for(let j=0;j<18;j++){const xx=-45+r()*85,yy=-65+r()*60;b+=L(`M${f(xx)} ${f(yy)}l${f(6+r()*8)} 0`,"#655b52",1,.2);}
 b+=R(23,-106,11,34,shade)+R(21,-109,15,5,"#a99b85");
 return G(`translate(${f(x)} ${f(y)}) scale(${f(s)})`,b);
}
function tower(x,y,s,kind="light"){
 let b="";
 if(kind==="light"){
 b=P("M-44 0L-24 -216 24 -216 43 0Z","url(#stone)",`stroke="#8d9caa" stroke-width="3"`)+P("M-26 -215L26 -215 29 -181 -29 -181Z","#b57568")+P("M-37 -102L37 -102 40 -69 -40 -69Z","#b57568");
 for(let j=0;j<5;j++)b+=R(-7,-33-j*34,14,22,"#43576a",`rx="3" stroke="#dbcab4" stroke-width="2"`);
 b+=P("M-34 -217V-260L-19 -272H19L34 -260V-217Z","#59707a",`stroke="#e8c596" stroke-width="3"`)+R(-23,-257,46,35,"#f4d79e",`rx="4"`)+L("M-12 -256v34M12 -256v34M-24 -241h48","#8c6e58",3)+P("M-43 -263L0 -301 43 -263Z","#b87968",`stroke="#f3d3a4" stroke-width="2"`)+E(0,-240,100,75,"url(#glow)",`opacity=".65"`);
 for(let i=0;i<12;i++)b+=L(`M${-33+i*.8} ${-i*17}h${65-i*1.6}`,"#6b7d86",1,.25);
 }else{
 b=P("M-43 0L-37 -180 -25 -211 25 -211 37 -180 43 0Z","url(#stone)",`stroke="#989093" stroke-width="3"`)+P("M-48 -185L0 -238 48 -185Z",kind==="forge"?"#8e684e":"#62647e",`stroke="#d3b580" stroke-width="3"`)+P("M-18 -20V-55Q0 -85 18 -55V-20Z",kind==="forge"?"#f4a35f":"#9fafd3",`stroke="#d8b88b" stroke-width="3"`)+L("M-26 -172v130M26 -172v130","#d3ba90",3,.55);
 for(let i=0;i<4;i++)b+=R(-11,-168+i*28,22,14,"#344357",`rx="5" stroke="#b7a68a" stroke-width="1.5"`);
 }
 return G(`translate(${x} ${y}) scale(${s})`,b);
}
function arch(x,y,s,kind="library"){
 const wall=kind==="starfall"?"#71758b":"#a9a8bd",inside=kind==="starfall"?"#433c66":"#343d59";
 let b=P("M-91 0V-133Q-91 -232 0 -267Q91 -232 91 -133V0H54V-130Q54 -197 0 -222Q-54 -197 -54 -130V0Z",wall,`stroke="#464d68" stroke-width="4"`)+L("M-82 0V-135Q-82 -221 0 -257Q82 -221 82 -135V0","#e2c7a2",3,.85)+L("M-66 0V-133Q-66 -204 0 -237Q66 -204 66 -133V0","#bba9a3",2,.65)+P("M-54 -4V-130Q-54 -197 0 -222Q54 -197 54 -130V-4Z",inside,`opacity=".66"`)+L("M-92 -8h184M-94 -29h188","#d5c3b4",4,.7);
 for(let j=0;j<8;j++){const yy=-25-j*18;b+=L(`M-91 ${yy}h36M55 ${yy}h36`,"#494f62",1.3,.7);}
 b+=E(0,-231,16,16,"url(#glow)") + P("M0 -247l9 15-9 15-9-15Z","#e4cbab",`stroke="#fff2cb" stroke-width="1.3"`);
 return G(`translate(${x} ${y}) scale(${s})`,b);
}
function gear(x,y,r,fill="#bd8f62"){let d="";for(let i=0;i<48;i++){const a=i*Math.PI/24,rr=(i%4<2?r:r*.83);d+=(i?"L":"M")+f(Math.cos(a)*rr)+" "+f(Math.sin(a)*rr)+" ";}return G(`translate(${x} ${y})`,P(d+"Z",fill,`stroke="#6a5149" stroke-width="2"`)+E(0,0,r*.65,r*.65,"#3d3940",`stroke="#e5bf8a" stroke-width="3"`)+Array.from({length:8},(_,i)=>G(`rotate(${i*45})`,R(-4,-r*.62,8,r*.51,fill))).join("")+E(0,0,r*.23,r*.23,fill,`stroke="#ebc89a" stroke-width="2"`));}
function crystal(x,y,s,r){let h=32+r()*62,w=12+r()*18;return G(`translate(${x} ${y}) scale(${s})`,P(`M${-w} 0L${-w*.7} ${-h*.7} 0 ${-h} ${w*.8} ${-h*.5} ${w} 0Z`,"#6e72ad",`stroke="#c0bbef" stroke-width="1.6"`)+P(`M0 ${-h}L0 0 ${w} 0 ${w*.8} ${-h*.5}Z`,"#b9a3df",`opacity=".8"`)+L(`M0 ${-h}l${-w*.42} ${h*.48}`,"#e8e4ff",1.5,.8));}
function lantern(x,y,s,col="#ffdd9d"){return G(`translate(${x} ${y}) scale(${s})`,E(0,-25,35,38,"url(#glow)",`opacity=".6"`)+L("M0 0V-46M-12 -46h24","#685e51",3)+P("M-9 -40L-12 -28 -7 -18H7L12 -28 9 -40Z",col,`stroke="#856b4d" stroke-width="2"`)+L("M-10 -30h20M0 -40v22","#8b734e",1.4));}
function ridge(id,p,r){
 let b=R(0,0,W,H,"url(#sky)")+clouds(r,p.light,.20,46);
 b+=mountain(r,255,110,p.far)+mountain(r,370,93,p.mid);
 if(id==="harbor"){b+=R(0,390,W,420,"url(#sea)");for(let i=0;i<130;i++){const yy=390+r()*400,xx=r()*W;b+=L(`M${f(xx)} ${f(yy)}q${f(10+r()*20)} -3 ${f(30+r()*90)} 0`,i%4===0?"#f7cf9a":"#c8dde0",1+r()*2,.13+r()*.26);}b+=P("M-40 620Q130 540 260 535L545 560Q708 492 810 320Q1010 222 1480 240V850H-40Z","url(#ground)")+P("M-40 622Q130 560 260 551L545 575Q710 510 814 339Q1010 244 1480 258","none",`stroke="#d1b5a1" stroke-width="13" opacity=".72"`);for(let i=0;i<11;i++)b+=house(65+i*119,365+(i%3)*39,.75+r()*.22,r);b+=tower(1267,201,.7);for(let i=0;i<6;i++){const x=110+i*105,y=465+(i%2)*22;b+=P(`M${x-28} ${y}h65l-17 13h-32Z`,"#514b48")+L(`M${x} ${y}v-65`,"#c1ad91",2)+P(`M${x+3} ${y-60}v54h34Z`,"#e9d6b3");}}
 else if(id==="forest"){b+=P("M0 440Q250 320 460 398T900 370T1440 290V810H0Z","url(#ground)");b+=P("M-10 485Q250 400 570 512T1000 481T1460 541V640Q1200 574 1000 563T570 591T-10 571Z","url(#sea)",`opacity=".84"`);for(let i=0;i<24;i++)b+=tree(i*65+((r()-.5)*45),310+r()*90,.7+r()*.65,r,"oak");b+=tree(1085,385,2.25,r,"oak");b+=L("M1100 390Q1040 445 910 463M1100 400Q1250 426 1380 410","#826c4e",24,.8)+L("M1100 390Q1040 445 910 463M1100 400Q1250 426 1380 410","#c0a578",5,.35);for(let i=0;i<22;i++){let x=r()*W,y=450+r()*250;b+=E(x,y,3+r()*5,3+r()*5,"#e6efb7",`opacity="${.35+r()*.6}"`);}}
 else if(id==="forge"){b+=P("M-30 520Q220 380 520 360T1010 292L1470 350V850H-30Z","url(#ground)");b+=P("M0 600Q250 556 560 610T1000 557T1450 631","none",`stroke="#9f593d" stroke-width="68"`)+L("M0 600Q250 556 560 610T1000 557T1450 631","#f0a25b",15,.85);for(let i=0;i<9;i++){const x=60+i*162,y=346+(i%3)*44;b+=house(x,y,1.05,r,"forge");if(i%2===0){b+=tower(x+50,y-35,.65,"forge");b+=L(`M${x+42} ${y-154}q-5 -50 20 -77`,"#b0a39f",20,.22);}}b+=gear(1195,225,80)+gear(1278,280,46)+gear(1090,289,39);b+=L("M75 400H1325M95 425H1360","#a47e62",15,.55);for(let i=0;i<10;i++)b+=R(90+i*125,406,11,124,"#49434c",`stroke="#b7a18c" stroke-width="2"`);}
 else if(id==="sky"){b=R(0,0,W,H,"url(#sky)")+clouds(r,"#f6ead9",.66,72);for(let i=0;i<13;i++){let x=r()*W,y=140+r()*250,ww=65+r()*100;b+=P(`M${f(x-ww)} ${f(y)}Q${f(x)} ${f(y-38)} ${f(x+ww)} ${f(y)}L${f(x+ww*.4)} ${f(y+45)} ${f(x)} ${f(y+104)} ${f(x-ww*.6)} ${f(y+38)}Z`,"#6c8294",`opacity=".62"`)+E(x,y-4,ww,17,"#92b3a0");}b+=P("M0 610Q160 534 312 493Q510 454 680 390Q950 320 1440 160L1440 810H0Z","url(#ground)")+P("M0 700Q150 650 315 650Q520 614 710 551Q990 510 1440 300V810H0Z","#485f71",`opacity=".62"`);for(let i=0;i<5;i++)b+=tower(685+i*135,380-i*34,.45+i*.045,"sky");b+=G("translate(245 220)",E(0,0,134,42,"#e5cead",`stroke="#a28d7c" stroke-width="3"`)+Array.from({length:8},(_,i)=>L(`M${-100+i*28} -31q20 30 0 62`,"#b29e8d",1.8,.8)).join("")+P("M-60 48H68L49 67H-43Z","#675c50")+L("M-59 26L-42 51M60 26L48 51","#756652",2));}
 else if(id==="library"){b=R(0,0,W,H,"url(#sky)");b+=P("M0 0H1440V620Q720 450 0 620Z","#282e4e");for(let i=0;i<10;i++){const x=65+i*150;b+=arch(x,470,.95);for(let j=0;j<4;j++){b+=R(x-44,275+j*38,88,5,"#b09b87");for(let k=0;k<11;k++)b+=R(x-42+k*7.7,253+j*38+(k%3)*3,5.5,21-(k%3)*3,["#8e655d","#6b7d8a","#b49b76","#8d86a3","#56706d"][k%5]);}}b+=P("M0 480Q720 340 1440 480V810H0Z","url(#ground)");for(let i=0;i<13;i++)b+=L(`M${i*120-30} 810L720 385`,"#a2a0ae",1.6,.5);for(let i=0;i<8;i++)b+=L(`M0 ${480+i*47}H1440`,"#9697ab",2,.45);b+=arch(1250,320,1.05)+E(1250,170,118,118,"url(#glow)",`opacity=".75"`)+E(1250,177,53,53,"#d8d3ed",`stroke="#f2d9b1" stroke-width="5"`);b+=L("M0 89Q720 -50 1440 89M0 126Q720 0 1440 126","#ceb898",4,.55);}
 else {b=R(0,0,W,H,"url(#sky)");for(let i=0;i<180;i++){const x=r()*W,y=r()*340;b+=E(x,y,.5+r()*1.6,.5+r()*1.6,"#f0deff",`opacity="${.2+r()*.75}"`);}b+=mountain(r,315,125,p.far)+mountain(r,420,110,p.mid)+P("M0 545Q260 398 570 480T1050 360T1440 290V810H0Z","url(#ground)");b+=arch(1150,288,1.02,"starfall")+arch(1070,353,.73,"starfall")+arch(1370,381,.7,"starfall");for(let i=0;i<38;i++){let x=r()*W,y=370+r()*370;b+=crystal(f(x),f(y),.55+r()*.8,r);}b+=L("M330 80l-142 66M920 48l-128 70M1320 135l-95 42","#d5c9ff",4,.8)+L("M330 80l-55 25M920 48l-44 25M1320 135l-35 16","#fff4ff",2,1);}
 return b;
}
function trail(id,p,r){
 const points=paths[id].map(([x,y])=>[x*W,y*H]);let d=`M${f(points[0][0])} ${f(points[0][1])}`;for(let i=1;i<points.length;i++)d+=` L${f(points[i][0])} ${f(points[i][1])}`;
 let b=L(d,p.edge,87,.85)+L(d,p.path,70,.95)+L(d,p.light,54,.18);
 // Distinct flagstones, cracks, erosion and path-edge details are authored into the environment.
 for(let i=1;i<points.length;i++){
 let a=points[i-1],c=points[i],dx=c[0]-a[0],dy=c[1]-a[1],len=Math.hypot(dx,dy),nx=-dy/len,ny=dx/len;
 for(let j=0;j<len;j+=19){let t=j/len,xx=a[0]+dx*t,yy=a[1]+dy*t;for(let k=-1;k<=1;k++){const off=k*17+(r()-.5)*6,x=xx+nx*off,y=yy+ny*off;b+=G(`translate(${f(x)} ${f(y)}) rotate(${f(Math.atan2(dy,dx)*180/Math.PI)})`,P("M-9 -8L8 -8 11 -2 8 8 -8 7 -11 0Z",r()<.5?p.path:p.light,`opacity="${.15+r()*.20}" stroke="${p.edge}" stroke-width=".7"`));}if(j%76===0)b+=E(xx+nx*43,yy+ny*43,7+r()*8,4+r()*5,p.mid,`opacity=".8"`);}
 }
 for(let j=0;j<points.length;j++){const [x,y]=points[j];b+=lantern(f(x+35),f(y-15),.75,id==="starfall"?"#e0c7ff":id==="forest"?"#d7ebb2":"#ffdb96");}
 return b;
}
function detail(id,p,r){
 let b="";
 // Foreground foliage and stone dressing, clear of the navigable track.
 for(let i=0;i<155;i++){const x=r()*W,y=415+r()*395;let near=paths[id].some(([a,b])=>Math.hypot(a*W-x,b*H-y)<82);if(near)continue;
 if(id==="forest"||id==="sky"){const h=7+r()*18;b+=L(`M${f(x)} ${f(y)}q-8 -${f(h*.5)} -5 -${f(h)}M${f(x)} ${f(y)}q7 -${f(h*.6)} 12 -${f(h)}`,"#b4b686",1.1,.45);}
 else b+=L(`M${f(x)} ${f(y)}l${f(5+r()*16)} ${f((r()-.5)*6)}`,p.light,1.2,.21);
 }
 // Distinct scenic vignette + paint grain: actual asset, not CSS decoration.
 b+=R(0,0,W,H,"url(#vignette)");b+=R(0,0,W,H,"#a6a2a3",`filter="url(#grain)" opacity=".10"`);
 return b;
}
function scene(id,index){
 const p=palettes[id],r=rnd(7217+index*1373);
 const defs=`<defs>${grad("sky",p.sky)}${grad("ground",[p.mid,p.ground,p.edge])}${grad("sea",["#a3b9bc","#577f92","#344e69"])}${grad("stone",["#e2d3bb","#a9aaa7","#7b858b"])}<radialGradient id="glow"><stop stop-color="${p.light}" stop-opacity=".9"/><stop offset="1" stop-color="${p.light}" stop-opacity="0"/></radialGradient><radialGradient id="vignette" cx=".5" cy=".4" r=".77"><stop offset=".5" stop-color="#091522" stop-opacity="0"/><stop offset="1" stop-color="#091522" stop-opacity=".48"/></radialGradient><filter id="mist"><feGaussianBlur stdDeviation="14"/></filter><filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".34" numOctaves="3" seed="${19+index}"/><feColorMatrix type="saturate" values="0"/></filter></defs>`;
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${defs}${ridge(id,p,r)}${trail(id,p,r)}${detail(id,p,r)}</svg>`;
}
function atlas(){
 let r=rnd(4512);const colors=["#537d83","#435d43","#6e5351","#84a695","#51566d","#68658b"];
 const positions=[[720,146],[1138,267],[1138,551],[720,687],[302,551],[302,267]];
 const defs=`<defs>${grad("ocean",["#18324b","#405f78","#243d54"])}${grad("island",["#adb9a7","#687f7c","#435b6b"])}${grad("stone",["#e2d3bb","#a9aaa7","#7b858b"])}<radialGradient id="glow"><stop stop-color="#ffdfa3" stop-opacity=".9"/><stop offset="1" stop-color="#ffdfa3" stop-opacity="0"/></radialGradient><filter id="mist"><feGaussianBlur stdDeviation="15"/></filter><filter id="grain"><feTurbulence baseFrequency=".28" numOctaves="2" type="fractalNoise"/><feColorMatrix type="saturate" values="0"/></filter></defs>`;
 let b=R(0,0,W,H,"url(#ocean)");
 for(let i=0;i<135;i++){let x=r()*W,y=r()*H;b+=L(`M${f(x)} ${f(y)}q30 -12 66 0`,"#afccd0",1.4,.1+r()*.2);}
 for(let i=0;i<positions.length;i++){const [x,y]=positions[i];let d="";for(let j=0;j<48;j++){let a=j*Math.PI/24,rr=.83+r()*.17;d+=(j?"L":"M")+f(x+Math.cos(a)*166*rr)+" "+f(y+Math.sin(a)*87*rr)+" ";}d+="Z";b+=P(d,colors[i],`stroke="#bfd3be" stroke-width="4"`)+P(d,"none",`stroke="#b3e1dc" stroke-width="15" opacity=".10"`);for(let j=0;j<38;j++){const xx=x+(r()-.5)*250,yy=y+(r()-.5)*95;b+=P(`M${f(xx-8)} ${f(yy+7)}l${f(8+r()*8)} -${f(9+r()*22)} ${f(8+r()*12)} ${f(8+r()*13)}Z`,j%2===0?"#83928a":"#b0b4a0",`opacity=".5"`);}
 if(i===0){for(let j=0;j<5;j++)b+=house(x-88+j*35,y+22,.36,r);b+=tower(x+66,y+8,.29);}
 else if(i===1){for(let j=0;j<8;j++)b+=tree(x-88+j*25,y+18,.34+r()*.13,r,"oak");}
 else if(i===2){for(let j=0;j<5;j++)b+=house(x-80+j*35,y+16,.43,r,"forge");b+=gear(x+70,y-13,26);}
 else if(i===3){for(let j=0;j<4;j++)b+=tower(x-85+j*55,y+10,.26,"sky");b+=E(x+100,y-44,46,15,"#e3c9aa",`stroke="#a18c7b" stroke-width="2"`);}
 else if(i===4){for(let j=0;j<4;j++)b+=arch(x-82+j*55,y+20,.27);}
 else{for(let j=0;j<6;j++)b+=crystal(x-95+j*35,y+16,.60,r);b+=arch(x+20,y+5,.26,"starfall");}
 }
 b+=E(720,405,156,118,"url(#glow)",`opacity=".75"`)+P("M593 439Q720 352 847 439L810 486 720 512 630 486Z","url(#island)",`stroke="#d5c3a2" stroke-width="4"`)+G("translate(720 393)",E(0,0,82,82,"none",`stroke="#e9c98e" stroke-width="4"`)+E(0,0,67,67,"none",`stroke="#fce3ad" stroke-width="1.5" stroke-dasharray="4 8"`)+P("M-57 32Q-46 9 -40 -17Q-34 -49 0 -60Q34 -49 40 -17Q46 9 57 32L48 45H-48Z","#d4a96d",`stroke="#ffe2a3" stroke-width="3"`)+L("M-36 28Q0 46 36 28","#885f43",3)+E(0,52,12,12,"#ebcc90")+L("M-11 -61Q0 -78 11 -61","#f4d59c",5));
 b+=clouds(r,"#c4d6d6",.12,32)+R(0,0,W,H,"#a9a5a0",`filter="url(#grain)" opacity=".08"`);
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs}${b}</svg>`;
}
return {...Object.fromEntries(Object.keys(palettes).map((id,i)=>[id,scene(id,i)])),atlas:atlas()};
};
const dir=new URL("../artifacts/retired-cat-bond-world-art/",import.meta.url);fs.mkdirSync(dir,{recursive:true});for(const [id,svg] of Object.entries(generateArt()))fs.writeFileSync(new URL(id+".svg",dir),svg);
