// Misttide Harbor staging. Reuses the painted harbor and canonical puzzle state.
import {symbol,puzzleWords} from "./world-mechanisms.mjs";
const cream="#f5e8cb", amber="#f1d198", teal="#a4e0d4";
const TAU=Math.PI*2;
const reduced=()=>typeof matchMedia==="function"&&matchMedia("(prefers-reduced-motion: reduce)").matches;
function path(c,p){c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));}
function shape(c,p,fill){path(c,p);c.closePath();c.fillStyle=fill;c.fill();}
function stroke(c,p,color,w=2){path(c,p);c.strokeStyle=color;c.lineWidth=w;c.lineCap="round";c.lineJoin="round";c.stroke();}
function circle(c,x,y,r,color){c.beginPath();c.arc(x,y,r,0,TAU);c.fillStyle=color;c.fill();}
function text(c,s,x,y,n=16,color=cream,align="center",max=undefined){c.font="600 "+n+"px Cat Bond Nunito, Cat Bond WenKai GB, Yuanti SC, PingFang SC, Microsoft YaHei, sans-serif";c.fillStyle=color;c.textAlign=align;c.textBaseline="middle";max?c.fillText(s,x,y,max):c.fillText(s,x,y);}
function box(c,x,y,w,h,fill,edge){c.beginPath();c.roundRect(x,y,w,h,9);c.fillStyle=fill;c.fill();if(edge){c.strokeStyle=edge;c.lineWidth=1.4;c.stroke();}}
function glow(c,x,y,r,color){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,"transparent");circle(c,x,y,r,g);}
// Local bell glow replaces retired water, rain and lighthouse effects.
export function paintHarborEnvironment(c,view,frame){
 const t=reduced()?0:frame/60,challenge=view.current?.id==="harbor:H-04",repaired=view.sanctuaries.includes("harbor"),sung=view.melodies.includes("harbor");
 c.save();c.scale((Number(c.canvas.dataset?.logicalWidth)||c.canvas.width)/960,(Number(c.canvas.dataset?.logicalHeight)||c.canvas.height)/540);
 for(const [i,[x,y]] of [[126,184],[345,244],[575,260],[805,405]].entries()){
  const pulse=.5+.5*Math.sin(t*2+i*1.8),alpha=(sung?.24:repaired?.17:challenge?.13:.075)*(.7+.3*pulse);
  glow(c,x,y,sung?44:30,"rgba(255,212,122,"+alpha+")");
  if(sung||challenge)circle(c,x+Math.sin(t+i)*6,y-8-pulse*8,2,"rgba(255,239,178,.72)");
 }
 c.restore();
}
export function harborObjective(v,lang){
 const zh=lang==="zh",s=v.current?.id,has=x=>v.objective.includes(x);
 const line=s==="harbor:H-01"?["沿石径找到栖蓝。","Follow the stone path to Qilan."]:s==="harbor:H-02"?["穿过风铃巷，从两条路中选择一条追上铃光。","Catch the moving chime along either of the two paths."]:s==="harbor:H-03"?["去旧铃房找檐灯。","Find Yandeng at the old bell house."]:s==="harbor:H-04"?["与伙伴一起击退铃光兽。","Defeat the belllight beast with your companion."]:s==="harbor:H-05"?has("repair:harbor")?["修复古铃圣所。","Restore the town bell sanctuary."]:has("melody:harbor")?["邀请栖蓝和檐灯，让古铃各自回应。","Invite Qilan and Yandeng to ring the bells together."]:["看看旧巡铃图。","Look at the old bellkeepers' map."]:v.melodies.includes("harbor")?["古铃已恢复 · 可前往眠根林。","Town bell restored · Travel to Rootsleep Forest."]:null;
 return line?.[zh?0:1]||"";
}
export function harborPuzzleHint(p,lang){
 const l=lang==="zh"?0:1;
 if(p.type==="rescue"){
  const step=p.values.length;
  const gateTurns=p.goal.indexOf(2),remaining=Math.max(0,gateTurns-step);
  const hint=remaining?[ "转动闸门绞盘，剩余 "+remaining+" 格。","Turn the tide-gate winch: "+remaining+" notch(es) remaining."]:step===gateTurns?["闸门已完全打开。发出通航信号。","The gate is fully open. Signal the channel."]:step===gateTurns+1?["引导栖蓝穿过狭窄闸口。","Guide Qilan through the narrow gate."]:step===gateTurns+2?["继续引导，避开浅滩，靠近安全码头。","Guide past the shoal toward the safe quay."]:["发出靠岸确认信号。","Signal to confirm docking."];
  return (p.assistedAt===step?(l?"Qilan steadies the boat. ":"栖蓝稳住了船。"):"")+hint[l];
 }
 if(p.assist==="jiedeng"){const i=p.values.findIndex((n,j)=>n!==p.goal[j]);if(i>=0)return ["岬灯：先校准","Jiedeng: align "][l]+puzzleWords.mirrors[2][i][l];}
 if(p.type==="tide")return ["顺着刻痕和石阶找到日志匣。","Trace the marks and steps to the logbook chest."][l];
 if(p.type==="melody")return ["按上方音符的顺序敲响铃音，聆听居民回应。","Play the notes in the displayed order and hear the residents answer."][l];
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
 const step=p.values.length, gateTurns=p.goal.indexOf(2),open=Math.min(1,step/gateTurns),guided=p.values.filter(n=>n===1).length,x=260+guided*204,y=191-Math.sin(t*1.8)*2;
 // Tide-gate opening, channel clearance and vessel position are controlled by the player's actual inputs.
 box(c,174,134,612,83,"#122b3a","#688a96");
 for(let i=0;i<5;i++)stroke(c,[[193,169+i*9],[766,169+i*9]],"rgba(132,206,209,.17)",1);
 const gx=416;stroke(c,[[gx-10,151],[gx-10,205],[gx+10,205],[gx+10,151]],"#bba785",4);
 const gy=180-open*31;for(let i=0;i<3;i++)stroke(c,[[gx-9,gy+i*7],[gx+9,gy+i*7]],amber,4);
 const lamp=step>gateTurns?teal:"#6b7a83";circle(c,590,149,5,lamp);if(step>gateTurns){glow(c,590,149,25,"rgba(164,224,212,.6)");stroke(c,[[590,153],[694,178]],teal,2);}
 // Mark the shoal and final safe quay.
 shape(c,[[555,205],[571,186],[590,205]],"#728582");stroke(c,[[707,170],[746,170],[746,207]],"#c5aa80",5);
 stroke(c,[[x-55,y+7],[x-21,y+7]],"rgba(185,224,222,.52)",2);
 shape(c,[[x-19,y-2],[x+22,y-2],[x+11,y+10],[x-11,y+10]],"#a98863");stroke(c,[[x,y-3],[x,y-28]],cream,2);shape(c,[[x+2,y-27],[x+18,y-5],[x+2,y-5]],"#e5d4ac");
 for(let i=0;i<3;i++){const w=puzzleWords.rescue[2][i][l];button(c,[288,480,672][i],291,i,w,["gate","wing","bell"][i],false);}
 text(c,(l?"Gate ":"闸门 ")+Math.round(open*100)+"%  ·  "+(l?"Channel ":"航道 ")+(guided)+"/2",480,373,16,teal);
}
function sequence(c,p,l,t,cast){
 const words=puzzleWords[p.type],melody=p.type==="melody",icons=melody?["bell","bell","bell"]:["gate","chest","book"],notes=["♪","♫","♬"],colors=["#a8ded7","#e7c48b","#c6bbe6"];
 if(melody){
  const actors=p.participants||[],last=p.response.at(-1);
  // Both characters are the actual invited residents, using their existing painted art.
  for(let k=0;k<actors.length;k++){const id=actors[k],x=k?774:186;const active=last?.actor===id;glow(c,x,205,48,active?"rgba(240,211,153,.25)":"rgba(160,219,210,.08)");
   if(typeof window!=="undefined")window.CatBondResonanceNPC?.drawResident?.(c,id,{x,y:237,scale:1.12,time:t});
   text(c,cast[id]?.name?.[l?"en":"zh"]||"",x,248,13,active?amber:cream);
  }
  const wave=p.values.length?0.5+0.5*Math.sin(t*3):0;
  for(let k=0;k<p.values.length;k++){const y=209+k*7;c.beginPath();c.ellipse(480,y,75+k*23+wave*9,10+k*4,0,0,TAU);c.strokeStyle="rgba(178,226,205,.25)";c.lineWidth=1.5;c.stroke();}
 }
 p.goal.forEach((n,i)=>{const x=400+80*i,y=180,lit=i<p.values.length;glow(c,x,y,34,lit?"rgba(164,224,212,.30)":"rgba(240,210,148,.10)");circle(c,x,y,18,lit?"#34716d":"#284658");if(melody)text(c,notes[n],x,y,21,colors[n]);else symbol(c,icons[n],x,y,.65,lit?teal:amber);});
 for(let i=0;i<3;i++){const x=[288,480,672][i],y=286;button(c,x,y,i,words[2][i][l],icons[i],!melody&&p.goal[p.values.length]===i,melody?()=>{symbol(c,"bell",x,y,1.05,colors[i]);text(c,notes[i],x+25,y-15,17,colors[i]);}:null);}
 if(melody&&p.response.length){const a=p.response.at(-1),name=cast[a.actor]?.name?.[l?"en":"zh"]||"";text(c,name+(l?" answers":" · 回应")+"  "+notes[a.reply],480,392,20,teal);}
}
export function paintHarborPuzzle(c,p,lang,cast,frame){
 if(!["tide","mirrors","rescue","melody"].includes(p.type))return false;
 const l=lang==="zh"?0:1,t=reduced()?0:frame/60,words=puzzleWords[p.type];
 c.save();c.fillStyle="rgba(94,65,68,.12)";c.fillRect(0,0,960,540);
 box(c,118,63,724,414,"rgba(73,61,70,.88)","#d0b9a1");
 text(c,words[0][l],480,98,26,cream);text(c,harborPuzzleHint(p,lang),480,119,15,teal,"center",675);
 if(p.type==="mirrors")mirrors(c,p,l);else if(p.type==="rescue")rescue(c,p,l,t);else sequence(c,p,l,t,cast);
 if(p.type==="rescue")text(c,(l?"Rescue stage ":"救援阶段 ")+(p.values.length+1)+"/"+p.goal.length,480,398,17,teal);
 if(p.mistakes)text(c,(l?"Try again · ":"重新尝试 · ")+p.mistakes,480,449,14,"#edbb9e");
 c.restore();return true;
}

// Final harbor ceremony: authored twilight illustration, resident portraits and a moving beacon.
export function paintHarborCeremony(c,img,elapsed,lang,drawResident){
 const t=reduced()?2.4:elapsed,u=Math.min(1,t/3),ease=u*u*(3-2*u),w=960,h=540,zh=lang==="zh";
 c.save();c.scale((Number(c.canvas.dataset?.logicalWidth)||c.canvas.width)/w,(Number(c.canvas.dataset?.logicalHeight)||c.canvas.height)/h);
 const z=.97+.03*ease;c.save();c.translate(w*(1-z)/2,h*(1-z)/2);c.scale(z,z);
 window.CatBondSceneFit.draw(c,img,w,h,{top:"#142536",bottom:"#142c38"});c.restore();
 const night=c.createLinearGradient(0,h*.34,0,h);night.addColorStop(0,"rgba(10,24,36,0)");night.addColorStop(.65,"rgba(10,24,36,.4)");night.addColorStop(1,"rgba(8,19,30,.96)");c.fillStyle=night;c.fillRect(0,0,w,h);
 for(let i=0;i<4;i++){const q=(t*.36+i*.25)%1; c.beginPath();c.ellipse(480,290,28+q*150,9+q*46,0,0,TAU);c.strokeStyle="rgba(201,231,205,"+(.52*(1-q))+")";c.lineWidth=2.2;c.stroke();}
 glow(c,480,284,125,"rgba(255,219,157,.22)");
 for(const [id,x,y,s] of [["jiedeng",330,389,1.55],["qilan",630,389,1.55],["muling",480,383,1.12]])drawResident?.(c,id,{x,y,scale:s,time:t});
 for(let i=0;i<30;i++){const a=i*2.399+t*.23,rad=35+(i%10)*14+t*6;circle(c,480+Math.cos(a)*rad,285+Math.sin(a)*rad*.43-t*12,1.4+i%3*.5,"rgba(248,228,170,"+(.25+.25*Math.sin(t*2+i))+")");}
 text(c,zh?"归家调":"The Song of Coming Home",480,439,32,cream);text(c,zh?"风铃重新响起 · 镇上的猫记起了伙伴与家":"The chimes ring again. The townsfolk remember their companions and homes.",480,479,17,teal,"center",850);
 c.restore();
}
