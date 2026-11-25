// Misttide Harbor staging. Reuses the painted harbor and canonical puzzle state.
import {symbol,puzzleWords} from "./world-mechanisms.mjs";
const ink="#112a37", cream="#f5e8cb", amber="#f1d198", teal="#a4e0d4";
const TAU=Math.PI*2, clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const reduced=()=>typeof matchMedia==="function"&&matchMedia("(prefers-reduced-motion: reduce)").matches;
function path(c,p){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));}
function shape(c,p,fill){path(c,p);c.closePath();c.fillStyle=fill;c.fill();}
function stroke(c,p,color,w=2){path(c,p);c.strokeStyle=color;c.lineWidth=w;c.lineCap="round";c.lineJoin="round";c.stroke();}
function circle(c,x,y,r,color){c.beginPath();c.arc(x,y,r,0,TAU);c.fillStyle=color;c.fill();}
function text(c,s,x,y,n=16,color=cream,align="center",max=undefined){c.font="600 "+n+"px system-ui,sans-serif";c.fillStyle=color;c.textAlign=align;c.textBaseline="middle";max?c.fillText(s,x,y,max):c.fillText(s,x,y);}
function box(c,x,y,w,h,fill,edge){c.beginPath();c.roundRect(x,y,w,h,9);c.fillStyle=fill;c.fill();if(edge){c.strokeStyle=edge;c.lineWidth=1.4;c.stroke();}}
function glow(c,x,y,r,color){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,"transparent");circle(c,x,y,r,g);}
const water=[[.365,.535],[.75,.49],[.79,.54],[.68,.69],[.51,.94],[.47,.98],[.38,.77],[.37,.68]];
function waterShimmer(c,t,storm){
 c.save();path(c,water.map(([x,y])=>[x*960,y*540]));c.closePath();c.clip();
 for(let i=0;i<29;i++){const y=283+i*8,x=370+((i*83)%390)+Math.sin(t*(storm?1.6:.55)+i)*11;const w=12+(i*17)%43;
  const g=c.createLinearGradient(x-w,y,x+w,y);g.addColorStop(0,"transparent");g.addColorStop(.5,storm?"rgba(196,226,233,.32)":"rgba(233,222,183,.24)");g.addColorStop(1,"transparent");stroke(c,[[x-w,y],[x+w,y]],g,1.1);}
 c.restore();
}
function fog(c,t,storm,restored){
 c.save();for(let i=0;i<4;i++){const x=280+i*190+Math.sin(t*.19+i)*60,y=138+i*22;
 c.save();c.translate(x,y);c.scale(1,.26);const f=c.createRadialGradient(0,0,0,0,0,155);f.addColorStop(0,"rgba(210,225,225,"+(restored ? .035 : storm ? .16 : .10)+")");f.addColorStop(1,"transparent");circle(c,0,0,155,f);c.restore();}
 c.restore();
}
export function paintHarborEnvironment(c,view,frame){
 const t=reduced()?0:frame/60, storm=view.current?.id==="harbor:H-04", repaired=view.sanctuaries.includes("harbor"), sung=view.melodies.includes("harbor");
 c.save();c.scale(c.canvas.width/960,c.canvas.height/540);
 if(storm){c.fillStyle="rgba(20,37,57,.24)";c.fillRect(0,0,960,540);}
 waterShimmer(c,t,storm);fog(c,t,storm,sung);
 if(repaired||storm&&!view.objective.includes("puzzle:beam-mirrors")){
  const a=.12+Math.sin(t*.38)*.075, x=137,y=47,dx=Math.cos(a)*730,dy=Math.sin(a)*730;
  const beam=c.createLinearGradient(x,y,x+dx,y+dy);beam.addColorStop(0,"rgba(255,226,156,.40)");beam.addColorStop(.48,"rgba(255,229,172,.16)");beam.addColorStop(1,"transparent");
  shape(c,[[x,y],[x+dx,y+dy-55],[x+dx,y+dy+55]],beam);glow(c,x,y,34,"rgba(255,221,148,.5)");
 }
 if(storm&&!reduced()){c.save();c.strokeStyle="rgba(198,223,235,.28)";c.lineWidth=1;c.beginPath();for(let i=0;i<45;i++){const x=(i*137+t*135)%990,y=(i*83+t*280)%560;c.moveTo(x,y);c.lineTo(x-13,y+23);}c.stroke();c.restore();}
 if(sung){for(const [x,y] of [[137,47],[97,226],[372,213],[543,222],[822,210],[828,474]])glow(c,x,y,28,"rgba(255,211,128,.22)");}
 c.restore();
}
export function harborObjective(v,lang){
 const zh=lang==="zh",s=v.current?.id, has=x=>v.objective.includes(x);
 const line=s==="harbor:H-01"?["沿石径找到领航员栖蓝。","Follow the stone path to Qilan."]:
 s==="harbor:H-02"?["前往灯塔，与岬灯谈谈旧风暴。","Visit the lighthouse and ask Jiedeng about the old storm."]:
 s==="harbor:H-03"?["沿东岸追踪退潮刻痕，取回救援日志。","Follow the ebb marks on the eastern shore and recover the rescue log."]:
 s==="harbor:H-04"?v.choice==="rescue"&&has("rescue:storm-boat")?["先打开潮汐闸门，协助栖蓝救援。","Open the tide gate and help Qilan with the rescue first."]:has("puzzle:beam-mirrors")?["前往灯塔校准镜面，照亮航路。","Align the lighthouse mirrors to light the channel."]:["返回码头，引导救援船入港。","Return to the quay and guide the rescue boat to safety."]:
 s==="harbor:H-05"?has("repair:harbor")?["修复灯塔圣所。","Restore the lighthouse sanctuary."]:has("melody:harbor")?["邀请栖蓝和岬灯，与港口居民合奏归潮调。","Invite Qilan and Jiedeng to perform Returning Tides together."]:["聆听暮铃的话。","Listen to Muling."]:
 v.melodies.includes("harbor")?["灯塔复明 · 补给航线已开放，可前往眠根林。","Beacon restored · Supply route open; travel to Rootsleep Forest."]:null;
 return line?.[zh?0:1]||"";
}
export function harborAssist(p,v){
 if(!p)return;
 const methods=v.support.find(x=>x.region==="harbor")?.methods||[];
 if(p.operation==="rescue:storm-boat"&&methods.includes("navigator-trust"))p.assist="qilan";
 if(p.operation==="puzzle:beam-mirrors"&&methods.includes("keeper-trust"))p.assist="jiedeng";
}
export function harborPuzzleHint(p,lang){
 const l=lang==="zh"?0:1;
 if(p.type==="rescue"){
  const step=p.values.length;
  if(p.assisted&&p.mistakes===0)return ["栖蓝稳住了船，按当前航标继续。","Qilan steadied the boat. Continue at the current marker."][l];
  return [["退潮后打开闸门并固定救援缆绳。","Open the tide gate at ebb and secure the rescue line."],["闸门已开，向栖蓝发出通航信号。","The gate is open. Signal Qilan to enter the channel."],["信号已收到，引导救援船驶入安全水域。","Signal received. Guide the boat into safe water."]][Math.min(step,2)][l];
 }
 if(p.assist==="jiedeng"){const i=p.values.findIndex((n,j)=>n!==p.goal[j]);if(i>=0)return ["岬灯：先校准","Jiedeng: align "][l]+puzzleWords.mirrors[2][i][l];}
 if(p.type==="tide")return ["顺着刻痕和石阶找到日志匣。","Trace the marks and steps to the logbook chest."][l];
 if(p.type==="melody")return ["听见归潮调的第一音，让两位居民回应。","Sound the first notes and let both residents answer."][l];
 return puzzleWords[p.type][1][l];
}
function button(c,x,y,i,word,icon,active,drawIcon){
 box(c,x-62,y-30,124,86,active?"#2d555e":"#1a3646",active?teal:"#8c9fa1");if(drawIcon)drawIcon();else symbol(c,icon,x,y+1,1.15,active?teal:amber);
 text(c,word,x,y+42,15,cream,"center",115);
}
function mirrors(c,p,l){
 const centers=[288,480,672],y=273;
 // A physical beam and target notch for each rotatable reflector.
 for(let i=0;i<3;i++){
  const x=centers[i],a=p.values[i]*Math.PI/2-Math.PI/2,g=p.goal[i]*Math.PI/2-Math.PI/2,match=p.values[i]===p.goal[i];
  glow(c,x,y,67,match?"rgba(133,230,215,.20)":"rgba(244,211,144,.09)");
  button(c,x,y,i,puzzleWords.mirrors[2][i][l],"mirror",match,()=>{
   circle(c,x,y,29,"#304e60");c.beginPath();c.arc(x,y,29,0,TAU);c.strokeStyle=amber;c.lineWidth=2;c.stroke();
   stroke(c,[[x+Math.cos(g)*22,y+Math.sin(g)*22],[x+Math.cos(g)*36,y+Math.sin(g)*36]],teal,5);
   stroke(c,[[x,y],[x+Math.cos(a)*39,y+Math.sin(a)*39]],match?teal:amber,4);
   stroke(c,[[x-47,y],[x,y]],match?teal:"#b89865",2);circle(c,x,y,4,cream);
  });
 }
}
function rescue(c,p,l,t){
 const step=p.values.length, x=280+step*132, y=191-Math.sin(t*1.8)*2;
 // A navigation cross-section, not another quest state: tide gate, signal and boat respond to input.
 box(c,174,134,612,83,"#122b3a","#688a96");
 for(let i=0;i<5;i++)stroke(c,[[193,169+i*9],[766,169+i*9]],"rgba(132,206,209,.17)",1);
 const gx=416;stroke(c,[[gx-10,153],[gx-10,203],[gx+10,203],[gx+10,153]],"#bba785",4);
 const gy=step?150:181;for(let i=0;i<3;i++)stroke(c,[[gx-9,gy+i*7],[gx+9,gy+i*7]],amber,4);
 const lamp=step>=2?teal:"#6b7a83";circle(c,590,149,5,lamp);if(step>=2){glow(c,590,149,25,"rgba(164,224,212,.6)");stroke(c,[[590,153],[694,178]],teal,2);}
 stroke(c,[[x-55,y+7],[x-21,y+7]],"rgba(185,224,222,.52)",2);
 shape(c,[[x-19,y-2],[x+22,y-2],[x+11,y+10],[x-11,y+10]],"#a98863");stroke(c,[[x,y-3],[x,y-28]],cream,2);shape(c,[[x+2,y-27],[x+18,y-5],[x+2,y-5]],"#e5d4ac");
 for(let i=0;i<3;i++){const w=puzzleWords.rescue[2][i][l];button(c,[288,480,672][i],291,i,w,["gate","wing","bell"][i],p.goal[step]===i);}
}
function sequence(c,p,l,t,cast){
 const words=puzzleWords[p.type],icons=p.type==="tide"?["gate","chest","book"]:["bell","bell","bell"];
 p.goal.forEach((n,i)=>{const x=400+80*i,y=180;const lit=i<p.values.length;glow(c,x,y,34,lit?"rgba(164,224,212,.30)":"rgba(240,210,148,.10)");circle(c,x,y,18,lit?"#34716d":"#284658");symbol(c,icons[n],x,y,.65,lit?teal:amber);});
 for(let i=0;i<3;i++)button(c,[288,480,672][i],286,i,words[2][i][l],icons[i],p.goal[p.values.length]===i);
 if(p.type==="melody"&&p.response.length){const a=p.response.at(-1),name=cast[a.actor]?.name?.[l?"en":"zh"]||"";text(c,name+(l?" answers":" · 回应")+"  "+["♪","♫","♬"][a.reply],480,392,20,teal);}
}
export function paintHarborPuzzle(c,p,lang,cast,frame){
 if(!["tide","mirrors","rescue","melody"].includes(p.type))return false;
 const l=lang==="zh"?0:1,t=reduced()?0:frame/60,words=puzzleWords[p.type];
 c.save();c.fillStyle="rgba(8,23,35,.67)";c.fillRect(0,0,960,540);
 box(c,118,63,724,414,"rgba(17,42,55,.92)","#bfa575");
 text(c,words[0][l],480,98,26,cream);text(c,harborPuzzleHint(p,lang),480,119,15,teal,"center",675);
 if(p.type==="mirrors")mirrors(c,p,l);else if(p.type==="rescue")rescue(c,p,l,t);else sequence(c,p,l,t,cast);
 if(p.type==="rescue")text(c,(l?"Rescue stage ":"救援阶段 ")+(p.values.length+1)+"/3",480,398,17,teal);
 if(p.mistakes)text(c,(l?"Try again · ":"重新尝试 · ")+p.mistakes,480,449,14,"#edbb9e");
 c.restore();return true;
}
