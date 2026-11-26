// Skyspine flight simulation. Ephemeral controls; only canonical world evidence is saved.
import {newGlide,steerGlide,tickGlide,glideProof,validGlideProof,landableGlide,holdGlide} from "./canon22-glide.mjs";
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const routes={
 "puzzle:sky-pouch":[.65,.34,.64],
 "explore:flight-recorder":[.68,.29,.66],
 "puzzle:joint-flight":[.29,.72,.31],
 "repair:sky":[.67,.30,.64],
 "survey:outbound":[.72,.27,.67],
 "survey:return":[.28,.73,.29]
};
// Xiaomao brings flight parts after the forge chapter; manual cargo is optional.
export const skyPartsReady=v=>!!(v.completed?.includes("forge:E-04")||v.links?.["forge:sky"]?.includes("receiveB"));
// A separate painted island is reachable by flight only, never by the main walking path.
export const skySurveyPath=[[.27,.235],[.30,.22],[.34,.218],[.39,.20]];
export const skySurveyCache=skySurveyPath.at(-1);
export const skySurvey={
 "survey:outbound":{from:[.67,.50],to:skySurveyPath[0],name:["飞往远风岛","Fly to Farwind Isle"]},
 "survey:return":{from:skySurveyPath[0],to:[.67,.50],name:["返回信使码头","Return to Courier Dock"]}
};
export const skyLaunch={ "puzzle:sky-pouch":[.10,.70],"explore:flight-recorder":[.18,.55],"puzzle:joint-flight":[.41,.51],"repair:sky":[.67,.50] };
export const skyLanding={ "puzzle:sky-pouch":[.18,.55],"explore:flight-recorder":[.41,.51],"puzzle:joint-flight":[.58,.55],"repair:sky":[.89,.24] };
export function newSkyFlight(operation,choice){
 if(["puzzle:joint-flight","puzzle:sky-pouch","explore:flight-recorder"].includes(operation))return newGlide(operation,choice);
 const route=routes[operation];if(!route)return null;
 const training=operation==="puzzle:sky-pouch"||operation==="puzzle:joint-flight"&&choice==="train";
 return {operation,choice,training,route:[...route],x:0,y:.5,target:.5,velocity:0,gate:0,passed:[],elapsed:0,attempts:0,started:false,solved:false,notice:"ready",lastSteer:0,steerTravel:0};
}
export const canLandSkyFlight=landableGlide;
export const landSkyFlight=holdGlide;
export function steerSkyFlight(f,y){
 if(f?.openGlide)return steerGlide(f,y);
 if(!f||f.solved||!Number.isFinite(y))return false;
 const target=clamp(y,.15,.85),change=Math.abs(target-f.target);if(change>.015){f.lastSteer++;f.steerTravel+=change;}f.target=target;f.started=true;f.notice="flying";return true;
}
export const skyWind=f=>Math.sin(f.x*13+1.1)*.13+Math.sin(f.x*27)*.04;
const gateX=[.24,.49,.74];
function reset(f,notice){
 Object.assign(f,{x:0,y:.5,target:.5,velocity:0,gate:0,passed:[],elapsed:0,started:false,notice,lastSteer:0,steerTravel:0,attempts:f.attempts+1});
}
export function tickSkyFlight(f,dt){
 if(f?.openGlide)return tickGlide(f,dt);
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
  if(f.gate!==3||Math.abs(f.y-.5)>.13||(f.lastSteer<3||f.steerTravel<.4)){reset(f,"landing");return false;}
  f.solved=true;f.notice="landed";return true;
 }
 return false;
}
export function skyFlightProof(f){
 if(f?.openGlide)return glideProof(f);
 if(!f?.solved)return null;
 return {operation:f.operation,choice:f.choice,attempts:f.attempts,elapsed:f.elapsed,passed:f.passed.map(p=>({...p})),landing:f.y,steers:f.lastSteer,steerTravel:f.steerTravel};
}
export function validSkyFlightProof(operation,choice,proof){
 if(["puzzle:joint-flight","puzzle:sky-pouch","explore:flight-recorder"].includes(operation))return validGlideProof(operation,choice,proof);
 const f=newSkyFlight(operation,choice);
 if(!f||proof?.operation!==operation||proof.choice!==choice||!Number.isInteger(proof.attempts)||proof.attempts<0||!Number.isFinite(proof.elapsed)||proof.elapsed<(f.training?11.6:9.8)||!Number.isInteger(proof.steers)||proof.steers<3||!Number.isFinite(proof.steerTravel)||proof.steerTravel<.4||!Number.isFinite(proof.landing)||Math.abs(proof.landing-.5)>.13||proof.passed?.length!==3)return false;
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
 const reverse=f.operation==="survey:return",track=n=>reverse?.88-n*.76:.12+n*.76,x=track(f.x),y=f.y;
 ctx.save();
 ctx.drawImage(img,-(reverse?1-f.x:f.x)*W*.08,-H*.03,W*1.08,H*1.06);cloudLayers(ctx,img,f.elapsed,W,H);
 const veil=ctx.createLinearGradient(0,0,0,H);veil.addColorStop(0,"#102a44b8");veil.addColorStop(.28,"#183d6320");veil.addColorStop(.72,"#183d6320");veil.addColorStop(1,"#102a44d9");ctx.fillStyle=veil;ctx.fillRect(0,0,W,H);
 const wind=skyWind(f);
 for(let i=0;i<22;i++){const px=((i*.173+f.elapsed*.11)%1)*W,py=(.12+(i*.239)% .76)*H;ctx.strokeStyle=i%3===0?"#e6f7f86b":"#e6f7f82b";ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(px,py);ctx.quadraticCurveTo(px+22,py+wind*100,px+58,py+wind*180);ctx.stroke();}
 // Three distinct air corridors; the rest of each cross-section is a hazardous gust.
 if(f.practice){const x=track(.13)*W,w=(track(.39)-track(.13))*W;ctx.fillStyle="#b9e6de66";ctx.fillRect(x,H*.15,w,H*.28);ctx.fillStyle="#fff2d1";ctx.font="600 16px sans-serif";ctx.textAlign="center";ctx.fillText(t("借上升气流","Catch the updraft"),x+w/2,H*.20);ctx.fillStyle="#e4d2a5";ctx.beginPath();ctx.ellipse(track(1)*W,H*.62,36,9,0,Math.PI*2);ctx.fill();}
 else if(f.openGlide){
 const start=track(.39)*W,end=track(.72)*W;ctx.fillStyle="#b8d6ef55";ctx.fillRect(start,H*.48,end-start,H*.07);ctx.strokeStyle="#e0f5df";ctx.lineWidth=3;ctx.setLineDash([9,8]);ctx.beginPath();ctx.moveTo(track(.12)*W,H*.36);ctx.lineTo(start,H*.30);ctx.lineTo(end,H*.30);ctx.stroke();ctx.beginPath();ctx.moveTo(track(.12)*W,H*.65);ctx.lineTo(start,H*.70);ctx.lineTo(end,H*.70);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle="#b9e6de66";ctx.fillRect(track(.13)*W,H*.15,(track(.39)-track(.13))*W,H*.28);ctx.fillStyle="#e4d2a5";ctx.beginPath();ctx.ellipse(track(.61)*W,H*.76,36,9,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(track(.79)*W,H*.76,28,8,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="#fff2d1";ctx.font="600 16px sans-serif";ctx.textAlign="center";ctx.fillText(t("上升气流 · 云瀑捷径","Updraft · Shortcut"),track(.32)*W,H*.20);ctx.fillText(t("外侧风路 · 安全岛","Outer route · Safe isle"),track(.57)*W,H*.83);if(f.paused){ctx.fillStyle="#fff2d1";ctx.fillText(t("安全岛 · 休息好了就继续起飞","Safe isle · Relaunch when ready"),W*.5,H*.92);}if(f.platform){ctx.fillStyle="#e8ffdb";ctx.fillText(t("看见云海下的灯火！","Lanterns glow below the clouds!"),track(.61)*W,H*.88);}if(f.routeUsed==="upper"){ctx.fillStyle="#e8ffdb";ctx.fillText(t("月牙岩就在前面","Crescent rock ahead"),track(.58)*W,H*.25);}
 }else for(let i=0;i<3;i++){const gx=track(gateX[i])*W,gy=f.route[i]*H,r=(f.training?.19:.14)*H+Math.min(f.attempts,3)*.02*H;
 ctx.fillStyle=i<f.gate?"#71cfc328":"#da956e28";ctx.fillRect(gx-11,H*.10,22,Math.max(0,gy-r-H*.10));ctx.fillRect(gx-11,gy+r,22,Math.max(0,H*.90-gy-r));
 ctx.strokeStyle=i<f.gate?"#8cebd3":"#ffe4ad";ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(gx,gy,19,r,0,0,Math.PI*2);ctx.stroke();}
 ctx.strokeStyle="#bff5e1";ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(W*track(1),H*.5,25,H*.13,0,0,Math.PI*2);ctx.stroke();
 const g=ctx.createRadialGradient(x*W,y*H,2,x*W,y*H,65);g.addColorStop(0,"#d1f4e75c");g.addColorStop(1,"#d1f4e700");ctx.fillStyle=g;ctx.fillRect(x*W-65,y*H-65,130,130);
 if(f.operation==="puzzle:joint-flight"){const lead=f.choice==="lead";drawGlider(ctx,img,x+.045,y-.035,W,H,f.velocity);drawNpc(lead?"yuanfan":"lingyu",x+.045,y-.035,.64);drawGlider(ctx,img,x-.055,y+.07,W,H,f.velocity);drawNpc(lead?"lingyu":"yuanfan",x-.055,y+.07,.61);}
 drawGlider(ctx,img,x,y,W,H,f.velocity);drawCat(x,y);cloudLayers(ctx,img,f.elapsed,W,H,true);
 ctx.font="600 22px Cat Bond Nunito, Cat Bond WenKai GB, Yuanti SC, PingFang SC, Microsoft YaHei, Noto Sans CJK SC, sans-serif";ctx.textAlign="center";ctx.fillStyle="#fff2d1";ctx.fillText(f.practice?t("第一次滑翔 · 借风再落地","First glide · catch the wind and land"):f.openGlide?t("借风越过云瀑，选择自己的路线","Ride the wind around the waterfall"):t("穿过风圈，抵达安全降落区","Cross the wind gates and land safely"),W/2,34);
 ctx.font="600 17px Cat Bond Nunito, Cat Bond WenKai GB, Yuanti SC, PingFang SC, Microsoft YaHei, Noto Sans CJK SC, sans-serif";ctx.fillText(t("风向仪 ","Wind gauge ")+(wind>0?"↓":"↑")+" "+Math.round(Math.abs(wind)*100)+"   "+(f.x>.42&&f.x<.57?t("上升气流 · ","Updraft · "):"")+(f.practice?t("安全落地","Land safely"):f.openGlide?(f.routeUsed==="upper"?t("云瀑捷径","Shortcut"):f.routeUsed==="lower"?t("外侧风路","Outer route"):t("选择高处或低处","Choose high or low")):t("航标 ","Gates ")+f.gate+"/3"),W/2,62);
 const notices={ready:t("点击或拖动选择飞行高度；方向键 ↑ ↓","Tap or drag to steer altitude; ↑ ↓ keys"),miss:t("错过风圈，重新起飞 · 风圈已放宽","Missed a gate. Relaunch · wider gates"),edge:t("遇到强气流，重新起飞","Strong gust. Relaunch"),landing:t("降落高度不安全，重新起飞","Unsafe landing. Relaunch"),flying:t("保持在下一个风圈内，最后回到中央","Aim for the next gate, then return to center"),landed:t("安全降落","Safe landing")};
 const logs=zh?["旧风标：事故前，翎羽误判侧风。","断裂货索：远帆主动切断货物绳索。","记录仪：两只猫因此幸存。"]:["Old wind gauge: Lingyu misread the crosswind.","Severed cargo line: Yuanfan cut it deliberately.","Recorder: both siblings survived because of it."];
 if(f.operation==="explore:flight-recorder"&&f.gate>0&&f.notice==="flying"){ctx.fillStyle="#172d45e5";ctx.fillRect(0,H-74,W,28);ctx.fillStyle="#fff2d1";ctx.fillText(logs[f.gate-1],W/2,H-54,W-24);}
 ctx.fillText(f.practice?({ready:t("升高借风，随后回到中央","Climb into the updraft, then return to middle altitude"),flying:t("借风后回到中央高度落地","Catch the wind, then descend to the landing"),landing:t("落地不稳，再飞一次","Unsteady landing. Try again"),edge:t("偏离安全范围，重新起飞","Outside safe airspace. Relaunch")}[f.notice]||""):f.openGlide?({ready:t("选高处借风或沿低处绕行","Climb into the updraft or glide low"),miss:t("撞入回卷风带，换条路线再试","Caught in the gust. Try another route"),edge:t("偏离安全范围，重新起飞","Outside safe airspace. Relaunch"),landing:t("降落不稳，重新起飞","Unsafe landing. Relaunch"),flying:t("绕过云瀑后再回到中央高度","Return to middle altitude beyond the waterfall"),landed:t("安全降落","Safe landing")}[f.notice]||""):(notices[f.notice]||""),W/2,H-24,W-24);ctx.restore();
}
export function paintSkyWeather(ctx,v,frame,W,H,img){
 const t=frame/60,restored=v.melodies.includes("sky");ctx.save();if(img)cloudLayers(ctx,img,t,W,H);
 for(let i=0;i<8;i++){const x=((i*.231+t*.012)%1)*W,y=(.13+(i*.173)% .64)*H;const g=ctx.createRadialGradient(x,y,0,x,y,100);g.addColorStop(0,"#f1f9ff36");g.addColorStop(1,"#f1f9ff00");ctx.fillStyle=g;ctx.fillRect(x-100,y-100,200,200);}
 const op=v.objective.find(o=>skyLaunch[o]);if(op){const a=skyLaunch[op],b=skyLanding[op];ctx.strokeStyle=skyPartsReady(v)?"#fff2b3d9":"#b1bdc9a0";ctx.lineWidth=2.5;ctx.setLineDash([7,10]);ctx.lineDashOffset=-t*28;ctx.beginPath();ctx.moveTo(a[0]*W,a[1]*H);ctx.quadraticCurveTo((a[0]+b[0])*.5*W,Math.min(a[1],b[1])*H-32,b[0]*W,b[1]*H);ctx.stroke();ctx.setLineDash([]);}
 if(restored){const layers=img&&getLayers(ctx,img);if(layers){const x=((t*.015)%1.1)-.1;ctx.globalAlpha=.78;ctx.drawImage(layers.airship,x*W,.13*H+Math.sin(t*.7)*5,W*.11,H*.11);ctx.globalAlpha=1;}ctx.strokeStyle="#c6fae0b0";ctx.lineWidth=2;ctx.setLineDash([8,12]);ctx.lineDashOffset=-t*23;ctx.beginPath();ctx.moveTo(.18*W,.55*H);ctx.quadraticCurveTo(.52*W,.24*H,.89*W,.24*H);ctx.stroke();ctx.setLineDash([]);}
 ctx.restore();
}
