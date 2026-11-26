// Moonmirror Library: three physical archive stations, verified Catdex records,
// and independent reconstruction of the hidden inward-route ledger.
import {newMirror,advanceMirror} from "./canon22-mirror.mjs";
export const libraryPoints=Object.freeze({
 "explore:sealed-archive":[.17,.73,"封存档案 · 审阅记录","Sealed archive · Review records"],
 "puzzle:library-reflections":[.29,.60,"一层 · 镜光回廊","Ground floor · Reflection gallery"],
 "puzzle:mirror-records":[.51,.48,"二层 · 封存壁画","Upper floor · Sealed mural"],
 "puzzle:library-echo":[.67,.40,"镜中的两只暮铃","Two Mulings in the mirror"],
 "battle:library-echo":[.76,.40,"镜影 · 守档幻象","Archive echo · Guardian illusion"],
 "explore:routing-record":[.82,.36,"公开记录 · 调查","Public records · Investigation"],
 "puzzle:two-route-model":[.82,.36,"六地桌上模型 · 验证两条路线","Six-region model · Compare the two routes"],
 "repair:library":[.89,.29,"月镜圣所","Moonmirror sanctuary"],
 "melody:library":[.89,.29,"照影调","Reflections"]
});
export const libraryOrder=["puzzle:library-reflections","puzzle:mirror-records","puzzle:library-echo","battle:library-echo"];
export const libraryInvitations={moye:[.22,.60],baikan:[.46,.58]};
export function libraryBlocked(op,objective,view){if(op==="explore:sealed-archive"&&objective.includes("npc:archive-dispute"))return true;if(op==="puzzle:two-route-model"&&objective.includes("npc:two-routes"))return true;if(["repair:library","melody:library"].includes(op)&&(objective.includes("npc:two-routes")||objective.includes("puzzle:two-route-model")||(view?.current?.id==="library:M-05"&&view.cursor<view.current.lines.length)))return true;const i=libraryOrder.indexOf(op);return i>0&&libraryOrder.slice(0,i).some(k=>objective.includes(k))}
export function catdexRecord(root){
 const cat=(root?.cats||[]).find(c=>c.species==="jinjc")||(root?.cats||[]).find(c=>root.dex?.[c.species]>0)||(root?.cats||[])[0];
 if(!cat)return null;
 const habits={clever:[1.08,"机敏","Clever"],mischievous:[1.16,"淘气","Mischievous"],glutton:[1.24,"贪吃","Food-loving"],diligent:[1.32,"勤勉","Diligent"],gentle:[1.40,"温柔","Gentle"],shy:[1.48,"害羞","Shy"],lazy:[1.56,"慵懒","Lazy"]};
 const h=habits[cat.personality?.id||cat.personality]||[1.28,"好奇","Curious"];
 const wins=Math.max(0,Math.floor(cat.battlesWon||0)),habit=Number((h[0]+(wins%5)*.04).toFixed(2));
 return {uid:cat.uid,species:cat.species,name:cat.nickname||cat.name||cat.species,habit,trait:h.slice(1),wins,correct:(Math.round(habit*100)+String(cat.species).length)%3};
}
export function libraryPuzzle(op,record){
 const types={"explore:sealed-archive":"librarySeal","puzzle:library-reflections":"libraryMirrors","puzzle:mirror-records":"libraryMural","puzzle:library-echo":"libraryEcho","explore:routing-record":"libraryLedger","repair:library":"libraryRestore","puzzle:two-route-model":"libraryRoutes"};
 if(op==="puzzle:library-echo")return {type:"libraryCompanion",operation:op,values:[],goal:[],record:null,mirror:newMirror(record?.uid),mistakes:0,solved:false};
 const type=types[op];if(!type)return null;
 const goals={librarySeal:[0,2,1],libraryMirrors:[1,3,2],libraryMural:[2,0,1],libraryEcho:[record?.correct??1],libraryLedger:[0],libraryRestore:[1,0,2],libraryRoutes:[0,1,2]};
 return {type,operation:op,initial:type==="libraryMirrors"?[0,0,0]:[],values:type==="libraryMirrors"?[0,0,0]:[],goal:goals[type],record:record||null,mistakes:0,solved:false,response:[]};
}
export function advanceLibrary(p,i){
 if(!p||!p.type?.startsWith("library")||p.solved||!Number.isInteger(i)||i<0||i>(p.type==="libraryCompanion"?4:2))return false;
 if(p.type==="libraryCompanion"){p.solved=advanceMirror(p.mirror,i);p.mistakes=p.mirror.mistakes;return p.solved;}
 if(p.type==="libraryLedger"){p.question=i;p.values=[0];p.solved=true;return true;}
 if(p.type==="libraryRoutes"){p.routeSeen||=[];if(i<2){if(!p.routeSeen.includes(i))p.routeSeen.push(i);p.routeMode=i;p.values=p.routeSeen.includes(0)?[0]:[];if(p.routeSeen.length===2)p.values=[0,1];return false;}if(p.routeSeen.length!==2){p.mistakes++;return false;}p.values=[0,1,2];p.routeMode=2;p.solved=true;return true;}
 if(p.type==="libraryMirrors")p.values[i]=(p.values[i]+1)%4;
 else if(i===p.goal[p.values.length])p.values.push(i);
 else{p.mistakes++;p.values=[];}
 p.solved=p.values.length===p.goal.length&&p.values.every((n,k)=>n===p.goal[k]);return p.solved;
}
const words={
 libraryCompanion:[["镜中的两只暮铃","Two Mulings in the mirror"],["它们都摇了两下铃。先换个位置，再用老办法叫暮铃。","They both rang twice. Move to another spot, then call Muling with your usual signal."],[["选左边的猫","Choose the left cat"],["走到右边","Move right"],["选右边的猫","Choose the right cat"],["摇两下铃","Ring twice"],["走到左边","Move left"]]],
 libraryRoutes:[["六地模型 · 两条回家的路","Six-region model · Two ways home"],["试试两种办法，看看记忆会发生什么变化，再听各地回应。这里只是模型。","Try both routes and see what happens to memories, then listen to the replies. This is only a model."],[["中央汇集","Converge inward"],["接通邻路","Connect neighbors"],["各地回应","Receive distinct replies"]]],
 librarySeal:[["档案封存原因","Why the archive was sealed"],["先审阅公开历史，再核对仍在世的当事猫，最后查看封存说明。","Review the public history, identify living subjects, then read why their records were sealed."],[["公开历史","Public history"],["封存说明","Seal notice"],["在世当事猫","Living subjects"]]],
 libraryMirrors:[["镜光回廊","Reflection gallery"],["旋转三面镜子，使光从左侧月窗折向隐藏的门。","Rotate the three mirrors to carry moonlight into the hidden doorway."],[["西镜","West mirror"],["中镜","Middle mirror"],["东镜","East mirror"]]],
 libraryMural:[["封存壁画","The sealed mural"],["按历史先后接合碎片：坠星、断裂的铃舌、应急锚室。","Reassemble the fragments in historical order: fallen star, broken tongue, emergency anchor."],[["断裂的铃舌","Broken tongue"],["应急锚室","Emergency anchor"],["坠落的星","Fallen star"]]],
 libraryEcho:[["识别复制记忆","Recognize the copied memory"],["打开 Catdex 核对个体记忆记录，再选出匹配的回响。","Inspect the individual memory record in Catdex, then match its echo."],[["回响甲","Echo A"],["回响乙","Echo B"],["回响丙","Echo C"]]],
 libraryLedger:[["公开记录 · 调查","Public records · Investigation"],["这三份记录提供线索，不证明是谁修改了线路。","These records are clues, not proof of who redirected the routes."],[["问借图的事","Ask about the borrowed map"],["问失忆的事","Ask about the memory loss"],["直接问暮铃","Ask Muling directly"]]],
 libraryRestore:[["圣所 · 邻地回应","Sanctuary · Neighboring replies"],["先对准月窗，再接通邻地镜桥，最后让两地共同回应。","Align the moon window, reconnect the neighboring mirror bridge, then let both regions answer."],[["邻地镜桥","Neighbor bridge"],["月窗","Moon window"],["相互回应","Reciprocal reply"]]]
};
export function libraryWords(p){const w=words[p.type];if(!w)return null;if(p.type!=="libraryEcho")return w;return [w[0],w[1],w[2].map((v,i)=>v.map(t=>t+" · "+echoInterval(p,i).toFixed(2)+"s"))]}
export function echoInterval(p,i){const h=p.record?.habit??1.28,k=p.record?.correct??1;return i===k?h:h+((i-k+3)%3===1?-.32:.32)}
const artRoot=new URL("../../assets/",import.meta.url);
const images=new Map();
const image=path=>{if(typeof Image==="undefined")return null;if(!images.has(path)){const i=new Image();i.src=new URL(path,artRoot).href;images.set(path,i)}return images.get(path)};
const ready=i=>i?.complete&&i.naturalWidth;
function cover(c,i,x,y,w,h){if(!ready(i))return;let k=Math.max(w/i.naturalWidth,h/i.naturalHeight),dw=i.naturalWidth*k,dh=i.naturalHeight*k;c.save();c.beginPath();c.rect(x,y,w,h);c.clip();c.drawImage(i,x+(w-dw)/2,y+(h-dh)/2,dw,dh);c.restore()}
export function paintLibraryPuzzle(c,p,lang,W,H){
 const w=libraryWords(p);if(!w)return false;const l=lang==="zh"?0:1,s=W/960,X=n=>n*W,Y=n=>n*H;
 const t=(str,x,y,size=20,col="#4d3b52")=>{c.font="600 "+size*s+"px Cat Bond Nunito, Cat Bond WenKai GB, Yuanti SC, PingFang SC, Microsoft YaHei, Noto Sans CJK SC, sans-serif";c.fillStyle=col;c.textAlign="center";c.textBaseline="middle";c.fillText(str,X(x),Y(y),W*.88)};
 const frame=(x,y,width,height)=>{c.beginPath();c.roundRect(X(x),Y(y),X(width),Y(height),12*s);c.fillStyle="#fff5e9ee";c.fill();c.strokeStyle="#b6a3cf";c.lineWidth=1.5*s;c.stroke()};
 c.save();cover(c,image("resonance-world-v2/library.webp"),0,0,W,H);c.fillStyle="#99759033";c.fillRect(0,0,W,H);frame(.08,.08,.84,.83);
 t(w[0][l],.5,.15,27,"#543b55");t(w[1][l],.5,.23,16);
 const xs=[.3,.5,.7],Yc=Y(.53);
 if(p.type==="libraryCompanion"){const m=p.mirror;const art=image("core-art-remaster/leads/muling.webp");[.30,.70].forEach((x,i)=>{frame(x-.13,.32,.26,.36);if(ready(art)){c.save();c.translate(X(x),Y(.49));if(m.faces[i]<0)c.scale(-1,1);let k=Math.min(W*.16/art.naturalWidth,H*.29/art.naturalHeight);c.drawImage(art,-art.naturalWidth*k/2,-art.naturalHeight*k/2,art.naturalWidth*k,art.naturalHeight*k);c.restore();}t(m.faces[i]===0?(l?"Facing the old spot":"朝着原来的位置"):m.faces[i]===1?(l?"Turns right · replies":"转向右侧 · 摇铃"):(l?"Turns left · replies":"转向左侧 · 摇铃"),x,.64,15);});const px=.5+m.position*.32;t(l?"You":"你",px,.75,18,"#27685b");const player=image("core-art-remaster/leads/player.webp");if(ready(player)){const k=Math.min(W*.095/player.naturalWidth,H*.17/player.naturalHeight);c.drawImage(player,X(px)-player.naturalWidth*k/2,Y(.72)-player.naturalHeight*k,player.naturalWidth*k,player.naturalHeight*k);}else{c.fillStyle="#d3a360";c.beginPath();c.arc(X(px),Y(.70),8*s,0,2*Math.PI);c.fill();}for(const x of [.18,.82]){c.strokeStyle="#d3a360";c.lineWidth=2*s;c.beginPath();c.ellipse(X(x),Y(.70),20*s,7*s,0,0,2*Math.PI);c.stroke();}t(l?"Move to a mark, then ring":"走到另一侧，再摇铃",.5,.91,16);t(m.mistakes?(l?"Try a new signal before choosing":"先换位置，再观察回应"):(l?"The two look identical. Watch their actions.":"外表一样，注意它们的动作。"),.5,.81,16);c.restore();return true;}

 if(p.type==="libraryLedger"){
 const cards=[["借阅簿","Borrowing ledger","暮铃借过旧地图","Muling borrowed the old map"],["公开日志","Public log","失忆复发与封印松动同日","Memory loss and seal breach: same day"],["线路图","Route map","近期线路指向中央","Recent routes point inward"]];
 [.23,.50,.77].forEach((x,i)=>{frame(x-.12,.34,.24,.33);const q=cards[i];t(q[l],x,.41,18,"#543b55");t(q[2+l],x,.53,12,"#356b68");});t(l?"Ask a question. There is no correct order.":"任选一个问题，不需要排序。",.5,.74,18);c.restore();return true;
 }
 if(p.type==="libraryRoutes"){
  const n=p.routeMode===0?1:p.routeMode===1?2:p.routeMode===2?3:0,colors=["#57a0b8","#6baf83","#d69464","#c3a2de","#8f92bd","#d6bc6b"],names=l?["Windchime","Forest","Lantern","Sky","Library","Starfall"]:["风铃镇","森林","千灯城","云岛","书库","星原"],pts=names.map((_,i)=>[.5+.22*Math.cos(i*Math.PI/3-Math.PI/2),.47+.16*Math.sin(i*Math.PI/3-Math.PI/2)]);c.lineWidth=3*s;for(let i=0;i<6;i++){const a=pts[i],b=n===1?[.5,.47]:pts[(i+1)%6];c.strokeStyle=n===1?"#b18192":n===3?colors[i]:"#b2a7b8";c.setLineDash(n===2?[5*s,6*s]:[]);c.beginPath();c.moveTo(X(a[0]),Y(a[1]));c.lineTo(X(b[0]),Y(b[1]));c.stroke();}c.setLineDash([]);pts.forEach((q,i)=>{c.fillStyle=n===1?"#b18192":colors[i];c.beginPath();c.arc(X(q[0]),Y(q[1]),18*s,0,2*Math.PI);c.fill();t(names[i],q[0],q[1]+.052,13);});c.fillStyle="#dac4ab";c.beginPath();c.arc(X(.5),Y(.47),24*s,0,2*Math.PI);c.fill();t(n===1?(l?"Home":"旧花园"):(l?"Bell":"星铃"),.5,.47,13);const memory=["resonance-world-v2/harbor.webp","resonance-world-v2/forge.webp","core-art-remaster/story/e03-garden.webp"];for(const [i,path] of memory.entries()){const x=.18+i*.32,y=.25,fade=n===1&&i<2;c.save();c.globalAlpha=fade?.23:1;cover(c,image(path),X(x-.10),Y(y-.05),X(.20),Y(.10));c.restore();}t((l?["Choose either route","One home brightens; other memories fade","Each neighbor keeps their memories","Six distinct replies"]:["任选一种办法","旧花园亮起，别猫的记忆褪色","各地的记忆都还在","六个不同的回应"])[n],.5,.73,19);xs.forEach((x,i)=>t(w[2][i][l],x,.82,13));c.restore();return true;
 }else if(p.type==="libraryMirrors"){
  // Optical ray is actually reflected at each junction; wrong orientation sends it away from the next mirror.
  const pts=[[.15,.53],[.3,.53],[.5,.43],[.7,.53],[.85,.53]].map(([x,y])=>[X(x),Y(y)]);
  const angle=(a,b)=>Math.atan2(b[1]-a[1],b[0]-a[0]);
  const mirrorAngles=p.goal.map((g,i)=>(angle(pts[i],pts[i+1])+angle(pts[i+1],pts[i+2]))/2+(p.values[i]-g)*Math.PI/4);
  c.lineCap="round";c.lineWidth=2*s;c.strokeStyle="#658da680";c.setLineDash([4*s,7*s]);c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();c.setLineDash([]);
  const beam=[pts[0],pts[1]];for(let i=0;i<3;i++){const at=pts[i+1],a=2*mirrorAngles[i]-angle(pts[i],at);if(p.values[i]===p.goal[i])beam.push(pts[i+2]);else{beam.push([at[0]+Math.cos(a)*W*.145,at[1]+Math.sin(a)*W*.145]);break;}}
  c.save();c.shadowBlur=16*s;c.shadowColor="#c7fff0";c.strokeStyle="#c7fff0";c.lineWidth=4*s;c.beginPath();beam.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();c.restore();
  t(l?"Moon window":"月窗",.15,.42,13);t(l?"Hidden door":"隐藏门",.85,.42,13);
  xs.forEach((x,i)=>{const [cx,cy]=pts[i+1],a=mirrorAngles[i],R=36*s,ok=p.values[i]===p.goal[i];c.save();c.translate(cx,cy);c.rotate(a);c.fillStyle="#9ec4d8";c.strokeStyle="#ead4a8";c.lineWidth=2*s;c.beginPath();c.roundRect(-R,-5*s,R*2,10*s,4*s);c.fill();c.stroke();c.restore();t(w[2][i][l],x,.68,16);if(ok)t(l?"Aligned":"已校准",x,.35,13,"#356b68");});
 }else{
  const paths=p.type==="librarySeal"?["resonance-world-v2/atlas.webp","resonance-world-v2/library.webp","resonance-world-v2/harbor.webp"]:p.type==="libraryMural"?["cinematics/prologue/broken-bell-tongue.webp","cinematics/prologue/keepers-choice.webp","cinematics/prologue/star-bell.webp"]:p.type==="libraryLedger"?["cinematics/prologue/broken-bell-tongue.webp","cinematics/prologue/star-bell.webp","resonance-world-v2/atlas.webp"]:["resonance-world-v2/library.webp","resonance-world-v2/sky.webp","resonance-world-v2/starfall.webp"];
  xs.forEach((x,i)=>{frame(x-.084,.40,.168,.22);
   if(p.type==="libraryEcho"){const h=echoInterval(p,i);c.strokeStyle="#b7cce4";c.lineWidth=2*s;c.beginPath();c.moveTo(X(x-.065),Y(.52));c.lineTo(X(x-.035),Y(.52));c.lineTo(X(x-.035),Y(.45));c.lineTo(X(x-.035),Y(.52));const end=x-.035+h*.045;c.lineTo(X(end),Y(.52));c.lineTo(X(end),Y(.45));c.lineTo(X(end),Y(.52));c.lineTo(X(x+.065),Y(.52));c.stroke();t(h.toFixed(2)+"s",x,.58,16);
   }else cover(c,image(paths[i]),X(x-.079),Y(.409),X(.158),Y(.202));t(w[2][i][l],x,.68,15);
  });
  if(p.type==="libraryEcho"){const rec=p.record;const name=rec&&(typeof window!=="undefined"?(window.State?.S?.cats?.find(c=>c.uid===rec.uid)?window.State.catName(window.State.S.cats.find(c=>c.uid===rec.uid)):window.GameData?.speciesName?.(rec.species)||rec.name):rec.name);t(rec?(l?"Catdex · "+name+" · "+rec.trait[l]+" · "+rec.wins+" wins":"Catdex · "+name+" · "+rec.trait[l]+" · "+rec.wins+" 次胜利"):(l?"No collected Catdex record":"缺少已收集猫咪的 Catdex 记录"),.5,.32,17,"#356b68");}
  else if(p.type==="librarySeal"){const notes=[["公开记录：旧灾难与星铃封印","Public record: catastrophe and the Star Bell seal"],["个人档案包含仍在世的猫咪身份","Personal files identify cats still living"],["封存保护当事猫，但不能抹去历史","Sealing protects subjects, but must not erase history"]];t(notes[Math.min(p.values.length,2)][l],.5,.32,16,"#356b68");}else t((l?"Reconstructed ":"已复原 ")+p.values.length+" / "+p.goal.length,.5,.32,16,"#356b68");
 }
 t(p.mistakes?(l?"Incorrect reflection · try again":"倒影不符 · 可以重试"):(l?"Compare the evidence before selecting":"观察证据后再选择"),.5,.80,16,p.mistakes?"#8f4639":"#564968");c.restore();return true;
}
export function paintLibraryEnvironment(c,v,frame,W=960,H=540,pos=[.1,.83]){
 const t=frame/60;c.save();const g=c.createRadialGradient(W*.63,H*.12,0,W*.63,H*.12,W*.55);g.addColorStop(0,"#b0b9ff22");g.addColorStop(1,"#25325100");c.fillStyle=g;c.fillRect(0,0,W,H);
 for(let i=0;i<20;i++){let x=(i*137.31%W),y=(i*47.3+Math.sin(t*.35+i)*18)%H;c.globalAlpha=.15+.15*Math.sin(t*.6+i)**2;c.fillStyle="#c9d9ff";c.beginPath();c.ellipse(x,y,2.5,1.2,t*.4+i,0,Math.PI*2);c.fill();}
 c.restore();
}
