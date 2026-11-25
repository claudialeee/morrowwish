// Skyspine flight simulation. Ephemeral controls; only canonical world evidence is saved.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const routes={
 "explore:flight-recorder":[.66,.32,.60],
 "puzzle:joint-flight":[.36,.65,.39],
 "repair:sky":[.62,.36,.55]
};
export const skyLaunch={ "explore:flight-recorder":[.18,.55],"puzzle:joint-flight":[.41,.51],"repair:sky":[.67,.50] };
export const skyLanding={ "explore:flight-recorder":[.41,.51],"puzzle:joint-flight":[.58,.55],"repair:sky":[.89,.24] };
export function newSkyFlight(operation,choice){
 const route=routes[operation];if(!route)return null;
 const training=operation==="puzzle:joint-flight"&&choice==="train";
 return {operation,choice,training,route:[...route],x:0,y:.5,target:.5,velocity:0,gate:0,passed:[],elapsed:0,attempts:0,started:false,solved:false,notice:"ready",lastSteer:0};
}
export function steerSkyFlight(f,y){
 if(!f||f.solved||!Number.isFinite(y))return false;
 f.target=clamp(y,.15,.85);f.started=true;f.notice="flying";f.lastSteer++;return true;
}
export const skyWind=f=>Math.sin(f.x*13+1.1)*.13+Math.sin(f.x*27)*.04;
const gateX=[.24,.49,.74];
function reset(f,notice){
 Object.assign(f,{x:0,y:.5,target:.5,velocity:0,gate:0,passed:[],elapsed:0,started:false,notice,lastSteer:0,attempts:f.attempts+1});
}
export function tickSkyFlight(f,dt){
 if(!f?.started||f.solved||!Number.isFinite(dt)||dt<=0)return false;
 dt=Math.min(dt,.05);f.elapsed+=dt;
 const lift=f.x>.42&&f.x<.57?-.05:0,wind=skyWind(f);
 f.velocity+=((f.target-f.y)*5+wind+lift-f.velocity*3)*dt;
 f.y+=f.velocity*dt;
 const speed=f.training?.085:.10;
 f.x=Math.min(1,f.x+speed*dt);
 if(f.y<.10||f.y>.90){reset(f,"edge");return false;}
 const tolerance=(f.training?.19:.14)+Math.min(f.attempts,3)*.02;
 while(f.gate<3&&f.x>=gateX[f.gate]){
  if(Math.abs(f.y-f.route[f.gate])>tolerance){reset(f,"miss");return false;}
  f.passed.push({index:f.gate,y:f.y});f.gate++;
 }
 if(f.x>=1){
  if(f.gate!==3||Math.abs(f.y-.5)>.13||f.lastSteer<2){reset(f,"landing");return false;}
  f.solved=true;f.notice="landed";return true;
 }
 return false;
}
export function skyFlightProof(f){
 if(!f?.solved)return null;
 return {operation:f.operation,choice:f.choice,attempts:f.attempts,elapsed:f.elapsed,passed:f.passed.map(p=>({...p})),landing:f.y,steers:f.lastSteer};
}
export function validSkyFlightProof(operation,choice,proof){
 const f=newSkyFlight(operation,choice);
 if(!f||proof?.operation!==operation||proof.choice!==choice||!Number.isInteger(proof.attempts)||proof.attempts<0||!Number.isFinite(proof.elapsed)||proof.elapsed<(f.training?11.6:9.8)||!Number.isInteger(proof.steers)||proof.steers<2||!Number.isFinite(proof.landing)||Math.abs(proof.landing-.5)>.13||proof.passed?.length!==3)return false;
 const tolerance=(f.training?.19:.14)+Math.min(proof.attempts,3)*.02;
 return proof.passed.every((p,i)=>p.index===i&&Number.isFinite(p.y)&&Math.abs(p.y-f.route[i])<=tolerance);
}
// Feathered crops from the existing Skyspine painting retain the artist's cloud and aircraft detail.
// Cache by decoded image. These layers are presentation only, never story state.
const paintedLayers=new WeakMap();
function getLayers(ctx,img){
 if(paintedLayers.has(img))return paintedLayers.get(img);
 const doc=ctx.canvas.ownerDocument||globalThis.document;
 if(!doc||!img.naturalWidth)return null;
 function crop(x,y,w,h){
  const c=doc.createElement("canvas");c.width=Math.max(8,Math.round(img.naturalWidth*w));c.height=Math.max(8,Math.round(img.naturalHeight*h));
  const p=c.getContext("2d");p.drawImage(img,img.naturalWidth*x,img.naturalHeight*y,img.naturalWidth*w,img.naturalHeight*h,0,0,c.width,c.height);
  p.globalCompositeOperation="destination-in";p.save();p.translate(c.width/2,c.height/2);p.scale(c.width/2,c.height/2);
  const mask=p.createRadialGradient(0,0,.46,0,0,1);mask.addColorStop(0,"#fff");mask.addColorStop(.78,"#ffffffd9");mask.addColorStop(1,"#ffffff00");p.fillStyle=mask;p.fillRect(-1,-1,2,2);p.restore();return c;
 }
 const result={cloud:crop(.48,.81,.20,.15),airship:crop(.531,.038,.11,.103),glider:crop(.422,.247,.060,.063)};
 paintedLayers.set(img,result);return result;
}
function cloudLayers(ctx,img,t,W,H,foreground=false){
 const layers=getLayers(ctx,img);if(!layers)return;
 ctx.save();const count=foreground?3:4;
 for(let i=0;i<count;i++){
  const speed=foreground?.045:.012,px=((i*.31+t*speed)%1.35)-.18,py=foreground?.78+i*.055:.18+i*.13,width=W*(foreground?.37:.23);
  ctx.globalAlpha=foreground?.22:.15;ctx.drawImage(layers.cloud,px*W,py*H,width,width*layers.cloud.height/layers.cloud.width);
 }ctx.restore();
}
function drawGlider(ctx,img,x,y,W,H,tilt){
 const layers=getLayers(ctx,img);if(!layers)return;
 ctx.save();ctx.translate(x*W,y*H-14);ctx.rotate(Math.max(-.18,Math.min(.18,tilt)));ctx.globalAlpha=.96;ctx.drawImage(layers.glider,-49,-33,98,62);ctx.restore();
}
// Draw on top of the approved environment painting. No replacement scenery or generic cat art.
export function paintSkyFlight(ctx,f,img,W,H,lang,drawCat,drawNpc){
 const zh=lang==="zh",t=(a,b)=>zh?a:b;
 const x=.12+f.x*.76,y=f.y;
 ctx.save();
 ctx.drawImage(img,-f.x*W*.08,-H*.03,W*1.08,H*1.06);cloudLayers(ctx,img,f.elapsed,W,H);
 const veil=ctx.createLinearGradient(0,0,0,H);veil.addColorStop(0,"#102a44b8");veil.addColorStop(.28,"#183d6320");veil.addColorStop(.72,"#183d6320");veil.addColorStop(1,"#102a44d9");ctx.fillStyle=veil;ctx.fillRect(0,0,W,H);
 const wind=skyWind(f);
 for(let i=0;i<22;i++){const px=((i*.173+f.elapsed*.11)%1)*W,py=(.12+(i*.239)% .76)*H;ctx.strokeStyle=i%3===0?"#e6f7f86b":"#e6f7f82b";ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(px,py);ctx.quadraticCurveTo(px+22,py+wind*100,px+58,py+wind*180);ctx.stroke();}
 // Three distinct air corridors; the rest of each cross-section is a hazardous gust.
 for(let i=0;i<3;i++){const gx=(.12+gateX[i]*.76)*W,gy=f.route[i]*H,r=(f.training?.19:.14)*H+Math.min(f.attempts,3)*.02*H;
 ctx.fillStyle=i<f.gate?"#71cfc328":"#da956e28";ctx.fillRect(gx-11,H*.10,22,Math.max(0,gy-r-H*.10));ctx.fillRect(gx-11,gy+r,22,Math.max(0,H*.90-gy-r));
 ctx.strokeStyle=i<f.gate?"#8cebd3":"#ffe4ad";ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(gx,gy,19,r,0,0,Math.PI*2);ctx.stroke();}
 ctx.strokeStyle="#bff5e1";ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(W*.88,H*.5,25,H*.13,0,0,Math.PI*2);ctx.stroke();
 const g=ctx.createRadialGradient(x*W,y*H,2,x*W,y*H,65);g.addColorStop(0,"#d1f4e75c");g.addColorStop(1,"#d1f4e700");ctx.fillStyle=g;ctx.fillRect(x*W-65,y*H-65,130,130);
 if(f.operation==="puzzle:joint-flight"){const lead=f.choice==="lead";drawGlider(ctx,img,x+.045,y-.035,W,H,f.velocity);drawNpc(lead?"yuanfan":"lingyu",x+.045,y-.035,.64);drawGlider(ctx,img,x-.055,y+.07,W,H,f.velocity);drawNpc(lead?"lingyu":"yuanfan",x-.055,y+.07,.61);}
 drawGlider(ctx,img,x,y,W,H,f.velocity);drawCat(x,y);cloudLayers(ctx,img,f.elapsed,W,H,true);
 ctx.font="600 22px system-ui";ctx.textAlign="center";ctx.fillStyle="#fff2d1";ctx.fillText(t("穿过风圈，抵达安全降落区","Cross the wind gates and land safely"),W/2,34);
 ctx.font="600 17px system-ui";ctx.fillText(t("风向 ","Wind ")+(wind>0?"↓":"↑")+" "+Math.round(Math.abs(wind)*100)+"   "+(f.x>.42&&f.x<.57?t("上升气流 · ","Updraft · "):"")+t("航标 ","Gates ")+f.gate+"/3",W/2,62);
 const notices={ready:t("点击或拖动选择飞行高度；方向键 ↑ ↓","Tap or drag to steer altitude; ↑ ↓ keys"),miss:t("错过风圈，重新起飞 · 风圈已放宽","Missed a gate. Relaunch · wider gates"),edge:t("遇到强气流，重新起飞","Strong gust. Relaunch"),landing:t("降落高度不安全，重新起飞","Unsafe landing. Relaunch"),flying:t("保持在下一个风圈内，最后回到中央","Aim for the next gate, then return to center"),landed:t("安全降落","Safe landing")};
 const logs=zh?["旧风标：事故前，翎羽误判侧风。","断裂货索：远帆主动切断货物绳索。","记录仪：两只猫因此幸存。"]:["Old wind gauge: Lingyu misread the crosswind.","Severed cargo line: Yuanfan cut it deliberately.","Recorder: both siblings survived because of it."];
 if(f.operation==="explore:flight-recorder"&&f.gate>0&&f.notice==="flying"){ctx.fillStyle="#172d45e5";ctx.fillRect(0,H-74,W,28);ctx.fillStyle="#fff2d1";ctx.fillText(logs[f.gate-1],W/2,H-54,W-24);}
 ctx.fillText(notices[f.notice]||"",W/2,H-24,W-24);ctx.restore();
}
export function paintSkyWeather(ctx,v,frame,W,H,img){
 const t=frame/60,restored=v.melodies.includes("sky");ctx.save();if(img)cloudLayers(ctx,img,t,W,H);
 for(let i=0;i<8;i++){const x=((i*.231+t*.012)%1)*W,y=(.13+(i*.173)% .64)*H;const g=ctx.createRadialGradient(x,y,0,x,y,100);g.addColorStop(0,"#f1f9ff36");g.addColorStop(1,"#f1f9ff00");ctx.fillStyle=g;ctx.fillRect(x-100,y-100,200,200);}
 if(restored){const layers=img&&getLayers(ctx,img);if(layers){const x=((t*.015)%1.1)-.1;ctx.globalAlpha=.78;ctx.drawImage(layers.airship,x*W,.13*H+Math.sin(t*.7)*5,W*.11,H*.11);ctx.globalAlpha=1;}ctx.strokeStyle="#c6fae0b0";ctx.lineWidth=2;ctx.setLineDash([8,12]);ctx.lineDashOffset=-t*23;ctx.beginPath();ctx.moveTo(.18*W,.55*H);ctx.quadraticCurveTo(.52*W,.24*H,.89*W,.24*H);ctx.stroke();ctx.setLineDash([]);}
 ctx.restore();
}
