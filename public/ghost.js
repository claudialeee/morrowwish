"use strict";
(()=>{
if(GAME!=="flip-dash")return;
const seed=new URLSearchParams(location.search).get("seed")||new Date().toISOString().slice(0,10),key="lab-ghost-"+seed;
let best=null,active=false,startAt=0,flips=[];
try{best=JSON.parse(localStorage.getItem(key)||"null");}catch{}
function begin(){active=true;startAt=performance.now();flips=[];}
const oldStart=window.start;window.start=function(){oldStart();begin();};goBtn.onclick=start;
const oldFinish=window.finish;window.finish=function(w,msg,next){if(running&&active){const seconds=(performance.now()-startAt)/1000;if(!best||score>best.score){best={score:Math.floor(score),seconds,flips:flips.slice(0,200)};localStorage.setItem(key,JSON.stringify(best));}}active=false;oldFinish(w,msg,next);};
const oldDown=mode.down;mode.down=function(x,y){if(running&&active)flips.push((performance.now()-startAt)/1000);oldDown?.(x,y);};
const oldKey=mode.key;mode.key=function(k){if(running&&active&&[" ","ArrowUp","ArrowDown"].includes(k))flips.push((performance.now()-startAt)/1000);oldKey?.(k);};
const oldDraw=mode.draw;mode.draw=function(){oldDraw();if(!running||!best||!active)return;const t=(performance.now()-startAt)/1000;if(t>best.seconds)return;let n=0;for(const x of best.flips){if(x<=t)n++;else break;}const y=n%2?126:410;c.save();c.globalAlpha=.33;circ(171,y,18,"#d9e6ff");circ(176,y-5,4,"#192b55");c.globalAlpha=.8;txt(170,37,"BEST GHOST",13,"#b4d1ff");c.restore();};
if(running)begin();
})();