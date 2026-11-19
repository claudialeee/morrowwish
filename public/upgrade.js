
"use strict";
(()=>{
const params=new URLSearchParams(location.search),id=GAME,dt=new Date().toISOString().slice(0,10),seed=(params.get("seed")||dt).slice(0,32),beat=Math.max(0,parseInt(params.get("beat")||0)||0),names={"flip-dash":"Flip Dash","parcel-panic":"Parcel Panic","tiny-town":"No More Mondays: Tiny Town","echo-heist":"Echo Heist","orbit-escape":"Orbit Escape","tower-tuck":"Tower Tuck","traffic-tangle":"Traffic Tangle","color-current":"Color Current","perfect-pour":"Perfect Pour","grid-glider":"Grid Glider","mirror-mosaic":"Mirror Mosaic","pocket-aquarium":"Pocket Aquarium"},ids=Object.keys(names),next=ids[(ids.indexOf(id)+1)%ids.length],dailyKey="lab-daily-"+id+"-"+seed,reduce=matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
let attempts=0,runAt=0,combo=0,particles=[],flash=0,shake=0,muted=localStorage.getItem("lab-muted")==="1",audio=null,first=localStorage.getItem("lab-first-"+id);
function seeded(s){let n=2166136261;for(const ch of s)n=Math.imul(n^ch.charCodeAt(0),16777619);return()=>{n+=0x6d2b79f5;let t=n;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
function event(name,fields={}){window.arcadeMetric?.(name,fields);try{window.va?.("event",{name:"lab_"+name,game:id,...fields});}catch{}}
function tone(freq=400){if(window.MorrowwishAudio){window.MorrowwishAudio.note(freq);return;}if(muted)return;try{audio=audio||new (window.AudioContext||window.webkitAudioContext)();audio.resume?.();const o=audio.createOscillator(),g=audio.createGain();o.frequency.value=freq;o.type="sine";g.gain.setValueAtTime(.042,audio.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+.12);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+.14);}catch{}}
function vibrate(ms){if(!reduce)try{navigator.vibrate?.(ms);}catch{}}
function burst(x,y,col="#93f8ea",n=14){if(reduce)return;for(let i=0;i<n;i++){let a=Math.random()*6.283,v=75+Math.random()*175;particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:.5+Math.random()*.3,color:col});}}
function fxTick(dt){flash=Math.max(0,flash-dt*2);shake=Math.max(0,shake-dt*17);for(const p of particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=210*dt;}particles=particles.filter(p=>p.life>0).slice(-190);}
function fxDraw(){for(const p of particles){c.globalAlpha=Math.min(1,p.life*2);circ(p.x,p.y,3,p.color);}c.globalAlpha=1;if(flash){c.fillStyle="rgba(255,247,255,"+(flash*.09)+")";c.fillRect(0,0,W,H);}}
function winEffect(x,y){combo++;burst(x,y,colors[combo%6],15);tone(350+Math.min(12,combo)*52);vibrate(10);if(combo%4===0){flash=.7;event("combo",{combo});}}
const previousStart=window.start,previousFinish=window.finish,previousTrack=window.track,overPanel=over.querySelector(".overlay-panel");
let extras=document.createElement("div");extras.className="lab-extra";extras.hidden=true;extras.innerHTML='<div class="lab-meta" id="lab-meta"></div><div class="lab-buttons"><button class="lab-primary" id="lab-again">↻ INSTANT REPLAY</button><button class="lab-secondary" id="lab-share">SHARE CHALLENGE</button></div><div id="lab-next"></div><div id="lab-copy" role="status"></div>';overPanel.appendChild(extras);
const replay=extras.querySelector("#lab-again");
const goal=document.createElement("div");goal.className="lab-daily";goal.innerHTML='<span>DAILY UTC SEED: <strong>'+seed+'</strong></span><span>'+((beat)?"BEAT "+beat+" POINTS":"BEAT YOUR PERSONAL BEST")+'</span>';document.querySelector(".game-frame").before(goal);if(!["flip-dash","parcel-panic"].includes(id)){goal.innerHTML="<span>EXPERIMENTAL GAME</span><span>SHARE YOUR SCORE</span>";}
const shareTop=document.createElement("button");shareTop.className="icon-btn lab-top-share";shareTop.textContent="SHARE";document.getElementById("help").before(shareTop);
const mute=document.createElement("button");mute.className="icon-btn lab-mute";mute.textContent=muted?"🔇":"🔊";mute.title="Toggle sound effects";document.getElementById("help").before(mute);mute.onclick=()=>{muted=!muted;localStorage.setItem("lab-muted",muted?"1":"0");mute.textContent=muted?"🔇":"♫";if(!muted)tone(650);};
function getLink(){const u=new URL(location.href);u.search="";if(["flip-dash","parcel-panic"].includes(id))u.searchParams.set("seed",seed);u.searchParams.set("beat",String(Math.floor(score)));return u.toString();}
async function share(){event("share_click",{score:Math.floor(score)});const text="🏆 "+names[id]+"\n"+Math.floor(score)+" points"+(["flip-dash","parcel-panic"].includes(id)?" • Daily seed "+seed:"")+"\n🟩".repeat(Math.min(5,Math.floor(score/25)))+"\nBeat me: "+getLink();try{if(navigator.share){await navigator.share({title:"Beat my score",text,url:getLink()});event("share_success");}else{await navigator.clipboard.writeText(text);extras.querySelector("#lab-copy").textContent="Challenge copied!";event("share_copy");}}catch{extras.querySelector("#lab-copy").textContent=getLink();}}
extras.querySelector("#lab-share").onclick=share;shareTop.onclick=share;
if(self===top){extras.querySelector("#lab-next").innerHTML='<a href="/'+next+'/" class="lab-next">TRY NEXT: '+names[next].toUpperCase()+' →</a>';extras.querySelector(".lab-next").onclick=()=>event("next_game_click");}
const prevAdd=window.add;window.add=function(n){prevAdd(n);document.getElementById("best").textContent=Math.max(+(localStorage.getItem("arcade-high-"+id)||0),Math.floor(score));};window.track=function(name,props){previousTrack(name,props);if(name==="restart")event("restart_button");};
function enter(){attempts++;runAt=performance.now();particles=[];flash=0;shake=0;combo=0;extras.hidden=true;goBtn.style.display="";localStorage.setItem("lab-seen-"+id,"1");event("run_start",{attempt:attempts});}
window.start=function(){previousStart();enter();};goBtn.onclick=start;
function best(){const old=+(localStorage.getItem(dailyKey)||0),curr=Math.floor(score);if(curr>old)localStorage.setItem(dailyKey,String(curr));document.getElementById("best").textContent=Math.max(+(localStorage.getItem("arcade-high-"+id)||0),old,curr);if(curr>old)event("daily_best",{score:curr});}
window.finish=function(w,msg,nextLevel){if(!running)return;const seconds=Math.round((performance.now()-runAt)/1000);event("run_end",{duration:seconds,score:Math.floor(score),won:w?1:0,retries:attempts-1,delivered:id==="parcel-panic"?(window.mwMiniDelivered||0):0});if(seconds>=60)event("over_60s");const k="lab-summary-"+id,prev=JSON.parse(localStorage.getItem(k)||"{}");prev.runs=(prev.runs||0)+1;prev.seconds=(prev.seconds||0)+seconds;prev.retries=(prev.retries||0)+(attempts>1?1:0);localStorage.setItem(k,JSON.stringify(prev));best();previousFinish(w,msg,nextLevel);extras.hidden=false;overPanel.classList.add("lab-completed");goBtn.style.display="none";extras.querySelector("#lab-meta").textContent=seconds+"s PLAYED  •  "+Math.floor(score)+" POINTS  •  "+(beat?(score>=beat?"FRIEND BEATEN!":"TARGET "+beat):"TODAY'S CHALLENGE");replay.textContent=w&&nextLevel?"NEXT LEVEL":"↻ RETRY INSTANTLY";replay.onclick=()=>{event("instant_replay");if(w&&nextLevel){goBtn.onclick?.();enter();}else start();};burst(480,225,w?"#a4ffde":"#ff8cac",30);vibrate(w?20:40);if(!window.MorrowwishAudio)tone(w?710:230);};
window.addEventListener("keydown",e=>{if(!running&&!extras.hidden&&(e.key===" "||e.key==="Enter")&&e.target?.tagName!=="BUTTON"){e.preventDefault();replay.click();}});
over.addEventListener("pointerdown",e=>{if(!running&&!extras.hidden&&e.target===over)replay.click();});
if(!first)localStorage.setItem("lab-first-"+id,dt);else if(first!==dt){const days=Math.round((Date.parse(dt)-Date.parse(first))/86400000);if(days===1&&!localStorage.getItem("lab-day1-"+id)){localStorage.setItem("lab-day1-"+id,"yes");event("day1_return");}event("return_visit");}
if(beat)event("friend_challenge_open");
G["flip-dash"]=()=>{
let rnd=seeded(seed+"gravity");const tutorial=[0,1,0,1,1,0,0,1,0,1,1,0];let sec=0,side=0,py=410,haz=[],stars=[],sp=1.5,k=0;
function switchLane(){side=1-side;burst(223,py,"#76eaff",8);shake=4;vibrate(9);tone(side?590:465);}
return{init(){rnd=seeded(seed+"gravity");sec=0;side=0;py=410;haz=[];stars=[];sp=1.6;k=0;combo=0;info("TAP OR SPACE TO FLIP");},
tick(dt){sec+=dt;const speed=248+Math.min(330,Math.max(0,sec-7)*5.5);sp-=dt;py+=(side?126-py:410-py)*Math.min(1,dt*16);if(sp<=0){const which=k<tutorial.length?tutorial[k]:Math.floor(rnd()*2);haz.push({x:1040,side:which,passed:false});if(k%2===0)stars.push({x:1145,side:1-which,got:false});k++;sp=Math.max(.62,1.68-Math.max(0,sec-8)*.029)+(rnd()-.5)*.1;}for(const p of haz){p.x-=speed*dt;if(!p.passed&&p.x<225){p.passed=true;if(Math.abs(py-(p.side?126:410))<78){shake=11;flash=1;finish(false,"You reached "+Math.floor(sec)+" seconds. Learn the pattern, then beat it.");return;}add(4);combo++;if(combo%4===0)winEffect(225,py);}}for(const g of stars){g.x-=speed*dt;if(!g.got&&Math.abs(g.x-225)<30&&Math.abs(py-(g.side?126:410))<50){g.got=true;add(22);winEffect(225,py);}}haz=haz.filter(v=>v.x>-60);stars=stars.filter(v=>v.x>-50&&!v.got);if(Math.floor(sec*3)>Math.floor((sec-dt)*3))add(1);info(Math.floor(sec)+"s  ·  STREAK "+combo+"  ·  SPEED "+Math.floor(speed));},
down(){switchLane();},key(key){if([" ","ArrowUp","ArrowDown"].includes(key))switchLane();},
draw(){bg("#101137","#202d5b");glow(490,265,320,"#676eff22");box(0,77,960,15,"#79ecff",6);box(0,455,960,15,"#79ecff",6);for(let i=0;i<17;i++){const x=(i*88-sec*140%1000+1000)%1000;line(x,97,x+40,97,"#85e9ff35",4);line(x,450,x+40,450,"#85e9ff35",4);}for(const o of haz){const y=o.side?126:410;glow(o.x,y,61,"#fb648850");box(o.x-27,y-43,54,86,"#fe7297",12,"#ffb6c8");txt(o.x,y,"✦",24,"#4c163d");}for(const g of stars){const y=g.side?126:410;glow(g.x,y,34,"#ffe88a44");circ(g.x,y,14,"#ffce65");txt(g.x,y,"✧",24,"#fff");}glow(225,py,78,"#4ce8fd66");circ(225,py,22,"#70fff0");circ(232,py-6,5,"#142c51");for(let i=0;i<4;i++)circ(180-i*14,py+(i%2?5:-5),5-i,"#65d9ff");txt(480,36,sec<6?"TAP TO FLIP GRAVITY":combo>3?"STREAK x"+combo:"KEEP MOVING",20,"#e0faff");if(sec<6)txt(480,268,"AVOID PINK BLOCKS",23,"#ffffff88");}
};};
G["parcel-panic"]=()=>{
let rnd=seeded(seed+"parcels");
const docks=[190,480,770],labels=["CYAN","GOLD","PINK"],zhLabels=["青色","黄色","粉色"];
let time=0,boxes=[],spawn=.42,life=5,count=0,delivered=0,press=null,drag=null,feedback=null;
const zh=()=>window.MorrowwishI18n?.get?.()==="zh"||document.documentElement.lang.startsWith("zh");
const L=(en,cn)=>zh()?cn:en;
const lane=x=>docks.findIndex(X=>Math.abs(x-X)<=104);
const speed=()=>Math.min(248,98+delivered*6.4+time*.38);
function next(){if(boxes.length||spawn>0)return;const color=count<6?[0,1,2,0,2,1][count]:Math.floor(rnd()*3);boxes.push({x:480,y:108,color});count++;event("parcel_spawned");}
function miss(p,wrong=false){
 const i=boxes.indexOf(p);if(i<0)return;
 boxes.splice(i,1);press=null;drag=null;spawn=.38;life--;combo=0;shake=8;
 event("parcel_missed",{cause:wrong?"wrong_lane":"timeout",color:p.color});
 burst(p.x,p.y,"#f67f97",13);tone(190);vibrate(22);
 feedback={x:480,y:286,text:wrong?L("TRY ANOTHER COLOR","颜色不对"):L("PACKAGE MISSED","超时未投递"),life:.9,good:false};
 if(!life)finish(false,L("You sorted "+delivered+" parcels. Try for a longer streak!","送达 "+delivered+" 件，下一局冲击更高连击！"));
}
function send(target){
 const b=boxes[0];if(!b||target<0)return false;
 if(target!==b.color){miss(b,true);return false}
 boxes.shift();press=null;drag=null;spawn=.18;delivered++;window.mwMiniDelivered=delivered;
 event("parcel_sorted",{input:"lane_click",color:target,delivered});
 if(delivered===10)event("parcel_ten_sorted");
 const gain=14+Math.min(combo,12)*3;add(gain);winEffect(docks[target],449);
 feedback={x:docks[target],y:354,text:"+"+gain,life:.85,good:true};
 return true;
}
function release(x,y,gesture){
 if(!gesture)return;
 const target=lane(x);
 if(gesture.dragged){
  // Drag-to-sort remains available for touch users.
  if(target>=0&&y>=95&&y<=520)send(target);
  else if(boxes[0]){boxes[0].x=480;boxes[0].y=Math.min(boxes[0].y,380)}
 }else if(gesture.fromParcel){
  info(L("No need to grab it — just click a color lane!","不需要拿起包裹，直接点击颜色通道即可！"));
 }else if(target>=0&&y>=85&&y<=520)send(target);
}
return{
 init(){
  rnd=seeded(seed+"parcels");time=0;boxes=[];spawn=.42;life=5;count=0;delivered=0;window.mwMiniDelivered=0;
  press=null;drag=null;feedback=null;combo=0;
  info(L("Just click the matching color lane, or press 1 / 2 / 3.","看颜色，直接点击对应通道，或按 1 / 2 / 3。"));
 },
 tick(dt){
  time+=dt;spawn-=dt;
  if(feedback){feedback.life-=dt;if(feedback.life<=0)feedback=null}
  next();
  if(boxes[0]&&!drag){
   boxes[0].y+=speed()*dt;
   if(boxes[0].y>433)miss(boxes[0]);
  }
  info(L(life+" LIVES · "+delivered+" DELIVERED · STREAK "+combo,life+" 次机会 · 已送达 "+delivered+" 件 · 连击 "+combo));
 },
 down(x,y){
  const b=boxes[0];press={x,y,fromParcel:!!b&&Math.abs(x-b.x)<52&&Math.abs(y-b.y)<42,dragged:false};
 },
 move(x,y){
  if(!press||!press.fromParcel||!boxes[0])return;
  if(Math.hypot(x-press.x,y-press.y)>15)press.dragged=true;
  if(press.dragged){drag=boxes[0];drag.x=clamp(x,95,865);drag.y=clamp(y,90,508)}
 },
 up(x,y){const gesture=press;press=null;release(x,y,gesture);drag=null},
 key(k){
  if(k==="1"||k==="2"||k==="3"){send(Number(k)-1);return}
  if(k==="ArrowLeft")send(0);else if(k==="ArrowDown")send(1);else if(k==="ArrowRight")send(2);
 },
 draw(){
  bg("#182b49","#283f61");
  for(let i=0;i<3;i++){
   const x=docks[i],selected=press&&lane(press.x)===i,hover=drag&&lane(drag.x)===i;
   box(x-108,111,216,403,hover||selected?colors[i]+"56":colors[i]+"19",20,hover||selected?colors[i]:colors[i]+"79");
   box(x-99,399,198,110,colors[i]+"46",15,colors[i]);
   for(let yy=143;yy<369;yy+=43)line(x-88,yy,x+88,yy,colors[i]+"24",2);
   txt(x,442,"123"[i],29,"#ffffff");
   txt(x,472,zh()?zhLabels[i]:labels[i],20,colors[i]);
   txt(x,497,L("CLICK","点击"),13,"#e8efff");
  }
  box(206,12,548,60,"#213c63",15,"#557497");
  txt(480,35,L("NEXT PARCEL → CLICK ITS COLOR","看包裹颜色 → 点击对应通道"),18,"#f2f5ff");
  txt(480,55,L("Also: keyboard 1 / 2 / 3","也可按键盘 1 / 2 / 3"),12,"#cadcf3");
  for(let i=0;i<5;i++)circ(34+i*22,38,7,i<life?"#ff859c":"#59718d");
  const b=boxes[0];
  if(b){
   glow(b.x,b.y,64,colors[b.color]+"4e");box(b.x-52,b.y-39,104,78,colors[b.color],15,"#ffffffa0");
   box(b.x-30,b.y-20,60,40,"#ffffff55",7);
   txt(b.x,b.y-2,L("NEXT","下一件"),13,"#223652");
   txt(b.x,b.y+18,zh()?zhLabels[b.color]:labels[b.color],20,"#243755");
   // Time pressure increases gradually, not through complicated gestures.
   const ratio=Math.max(0,Math.min(1,(433-b.y)/(433-108)));
   box(323,81,314,9,"#54708c",5);
   box(323,81,314*ratio,9,colors[b.color],5);
  }else{
   txt(480,251,L("Next parcel incoming…","下一件快递马上到！"),19,"#e6f0ff");
  }
  if(feedback)txt(feedback.x,feedback.y-(.9-feedback.life)*27,feedback.text,26,feedback.good?"#a6f5c5":"#ff9aad");
 }
};};
const factory=G[id];G[id]=()=>{const m=factory();return{init(l){m.init(l);},tick(d){fxTick(d);m.tick(d);},draw(){if(shake){c.save();c.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);}m.draw();fxDraw();if(shake)c.restore();},down(x,y){m.down?.(x,y);},up(x,y){m.up?.(x,y);},move(x,y){m.move?.(x,y);},key(k){m.key?.(k);}};};
mode=G[id]();mode.init(1);document.getElementById("best").textContent=localStorage.getItem("arcade-high-"+id)||"0";document.querySelector(".score-chip:last-of-type span")?.textContent;
if(localStorage.getItem("lab-seen-"+id)==="1"){start();event("auto_start");}else{document.getElementById("overlay-kicker").textContent="TODAY'S CHALLENGE";goBtn.textContent="PLAY NOW";}
})();
