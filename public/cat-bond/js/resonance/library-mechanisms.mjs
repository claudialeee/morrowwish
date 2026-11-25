// Moonmirror Library: three physical archive stations, verified Catdex records,
// and independent reconstruction of the hidden inward-route ledger.
export const libraryPoints=Object.freeze({
 "explore:sealed-archive":[.17,.73,"封存档案 · 审阅记录","Sealed archive · Review records"],
 "puzzle:library-reflections":[.29,.60,"一层 · 镜光回廊","Ground floor · Reflection gallery"],
 "puzzle:mirror-records":[.51,.48,"二层 · 封存壁画","Upper floor · Sealed mural"],
 "puzzle:library-echo":[.67,.40,"暗室 · 记忆核验","Hidden room · Verify memories"],
 "battle:library-echo":[.76,.40,"镜影 · 守档幻象","Archive echo · Guardian illusion"],
 "explore:routing-record":[.82,.36,"密档 · 共鸣路径","Hidden ledger · Resonance routes"],
 "repair:library":[.89,.29,"月镜圣所","Moonmirror sanctuary"],
 "melody:library":[.89,.29,"照影调","Reflections"]
});
export const libraryOrder=["puzzle:library-reflections","puzzle:mirror-records","puzzle:library-echo","battle:library-echo"];
export const libraryInvitations={moye:[.22,.60],baikan:[.46,.58]};
export function libraryBlocked(op,objective){if(op==="explore:sealed-archive"&&objective.includes("npc:archive-dispute"))return true;if(op==="repair:library"&&objective.includes("npc:two-routes"))return true;const i=libraryOrder.indexOf(op);return i>0&&libraryOrder.slice(0,i).some(k=>objective.includes(k))}
export function catdexRecord(root){
 const cat=(root?.cats||[]).find(c=>root.dex?.[c.species]>0);
 if(!cat)return null;
 const habits={clever:[1.08,"机敏","Clever"],mischievous:[1.16,"淘气","Mischievous"],glutton:[1.24,"贪吃","Food-loving"],diligent:[1.32,"勤勉","Diligent"],gentle:[1.40,"温柔","Gentle"],shy:[1.48,"害羞","Shy"],lazy:[1.56,"慵懒","Lazy"]};
 const h=habits[cat.personality]||[1.28,"好奇","Curious"];
 return {uid:cat.uid,species:cat.species,name:cat.name||cat.species,habit:h[0],trait:h.slice(1),correct:(Math.round(h[0]*100)+String(cat.species).length)%3};
}
export function libraryPuzzle(op,record){
 const types={"explore:sealed-archive":"librarySeal","puzzle:library-reflections":"libraryMirrors","puzzle:mirror-records":"libraryMural","puzzle:library-echo":"libraryEcho","explore:routing-record":"libraryLedger","repair:library":"libraryRestore"};
 const type=types[op];if(!type)return null;
 const goals={librarySeal:[0,2,1],libraryMirrors:[1,3,2],libraryMural:[2,0,1],libraryEcho:[record?.correct??1],libraryLedger:[2,0,1],libraryRestore:[1,0,2]};
 return {type,operation:op,initial:type==="libraryMirrors"?[0,0,0]:[],values:type==="libraryMirrors"?[0,0,0]:[],goal:goals[type],record:record||null,mistakes:0,solved:false,response:[]};
}
export function advanceLibrary(p,i){
 if(!p||!p.type?.startsWith("library")||p.solved||!Number.isInteger(i)||i<0||i>2)return false;
 if(p.type==="libraryMirrors")p.values[i]=(p.values[i]+1)%4;
 else if(i===p.goal[p.values.length])p.values.push(i);
 else{p.mistakes++;p.values=[];}
 p.solved=p.values.length===p.goal.length&&p.values.every((n,k)=>n===p.goal[k]);return p.solved;
}
const words={
 librarySeal:[["档案封存原因","Why the archive was sealed"],["先审阅公开历史，再核对仍在世的当事猫，最后查看封存说明。","Review the public history, identify living subjects, then read why their records were sealed."],[["公开历史","Public history"],["封存说明","Seal notice"],["在世当事猫","Living subjects"]]],
 libraryMirrors:[["镜光回廊","Reflection gallery"],["旋转三面镜子，使光从左侧月窗折向隐藏的门。","Rotate the three mirrors to carry moonlight into the hidden doorway."],[["西镜","West mirror"],["中镜","Middle mirror"],["东镜","East mirror"]]],
 libraryMural:[["封存壁画","The sealed mural"],["按历史先后接合碎片：坠星、断裂的铃舌、应急锚室。","Reassemble the fragments in historical order: fallen star, broken tongue, emergency anchor."],[["断裂的铃舌","Broken tongue"],["应急锚室","Emergency anchor"],["坠落的星","Fallen star"]]],
 libraryEcho:[["识别复制记忆","Recognize the copied memory"],["打开 Catdex 核验个体记录；选择习惯间隔一致的真实回响。","Compare the individual Catdex record with the echo intervals; select the matching memory."],[["回响甲","Echo A"],["回响乙","Echo B"],["回响丙","Echo C"]]],
 libraryLedger:[["复原隐藏路由","Restore the hidden routing ledger"],["按修改记录的时间顺序核对：原始路径、封印松动、圣所转向中央。","Verify in chronological order: original routes, loosened seal, inward sanctuary routing."],[["封印松动","Seal loosened"],["转向中央","Inward routing"],["原始路径","Original routes"]]],
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
 const t=(str,x,y,size=20,col="#eee7d5")=>{c.font="600 "+size*s+"px system-ui,sans-serif";c.fillStyle=col;c.textAlign="center";c.textBaseline="middle";c.fillText(str,X(x),Y(y),W*.88)};
 const frame=(x,y,width,height)=>{c.beginPath();c.roundRect(X(x),Y(y),X(width),Y(height),12*s);c.fillStyle="#121f36c9";c.fill();c.strokeStyle="#b6a3cf";c.lineWidth=1.5*s;c.stroke()};
 c.save();cover(c,image("resonance-world-v2/library.webp"),0,0,W,H);c.fillStyle="#081322d9";c.fillRect(0,0,W,H);frame(.08,.08,.84,.83);
 t(w[0][l],.5,.15,27,"#f0dba9");t(w[1][l],.5,.23,16);
 const xs=[.3,.5,.7],Yc=Y(.53);
 if(p.type==="libraryMirrors"){
  // The etched target angles correspond to three distinct optical junctions.
  c.lineCap="round";c.lineWidth=3*s;c.strokeStyle="#658da6";c.beginPath();c.moveTo(X(.17),Yc);xs.forEach(x=>c.lineTo(X(x),Yc));c.lineTo(X(.83),Yc);c.stroke();
  xs.forEach((x,i)=>{const cx=X(x),a=p.values[i]*Math.PI/2-Math.PI/2,g=p.goal[i]*Math.PI/2-Math.PI/2,R=43*s,ok=p.values[i]===p.goal[i];
   c.beginPath();c.arc(cx,Yc,R,0,Math.PI*2);c.fillStyle="#304e6b";c.fill();c.strokeStyle=ok?"#b5f3e5":"#b6a3cf";c.stroke();c.lineWidth=4*s;
   c.beginPath();c.moveTo(cx+Math.cos(g)*R*.76,Yc+Math.sin(g)*R*.76);c.lineTo(cx+Math.cos(g)*R,Yc+Math.sin(g)*R);c.strokeStyle="#f5dca5";c.stroke();
   c.beginPath();c.moveTo(cx,Yc);c.lineTo(cx+Math.cos(a)*R*.8,Yc+Math.sin(a)*R*.8);c.strokeStyle=ok?"#a8efe0":"#d4b8ed";c.stroke();
   t(w[2][i][l],x,.68,16);if(ok)t(l?"Aligned":"已校准",x,.36,14,"#a8efe0");
  });
 }else{
  const paths=p.type==="librarySeal"?["resonance-world-v2/atlas.webp","resonance-world-v2/library.webp","resonance-world-v2/harbor.webp"]:p.type==="libraryMural"?["cinematics/prologue/broken-bell-tongue.webp","cinematics/prologue/keepers-choice.webp","cinematics/prologue/star-bell.webp"]:p.type==="libraryLedger"?["cinematics/prologue/broken-bell-tongue.webp","cinematics/prologue/star-bell.webp","resonance-world-v2/atlas.webp"]:["resonance-world-v2/library.webp","resonance-world-v2/sky.webp","resonance-world-v2/starfall.webp"];
  xs.forEach((x,i)=>{frame(x-.084,.40,.168,.22);
   if(p.type==="libraryEcho"){const h=echoInterval(p,i);c.strokeStyle="#b7cce4";c.lineWidth=2*s;c.beginPath();c.moveTo(X(x-.065),Y(.52));c.lineTo(X(x-.035),Y(.52));c.lineTo(X(x-.035),Y(.45));c.lineTo(X(x-.035),Y(.52));const end=x-.035+h*.063;c.lineTo(X(end),Y(.52));c.lineTo(X(end),Y(.45));c.lineTo(X(end),Y(.52));c.lineTo(X(x+.065),Y(.52));c.stroke();t(h.toFixed(2)+"s",x,.58,16);
   }else cover(c,image(paths[i]),X(x-.079),Y(.409),X(.158),Y(.202));t(w[2][i][l],x,.68,15);
  });
  if(p.type==="libraryEcho"){const rec=p.record;t(rec?(l?"Catdex · "+rec.name+" · "+rec.trait[l]+" · verified interval ":"Catdex · "+rec.name+" · "+rec.trait[l]+" · 已记录间隔 ")+rec.habit.toFixed(2)+"s":(l?"No collected Catdex record":"缺少已收集猫咪的 Catdex 记录"),.5,.32,17,"#b5f3e5");}
  else if(p.type==="librarySeal"){const notes=[["公开记录：旧灾难与星铃封印","Public record: catastrophe and the Star Bell seal"],["个人档案包含仍在世的猫咪身份","Personal files identify cats still living"],["封存保护当事猫，但不能抹去历史","Sealing protects subjects, but must not erase history"]];t(notes[Math.min(p.values.length,2)][l],.5,.32,16,"#b5f3e5");}else t((l?"Reconstructed ":"已复原 ")+p.values.length+" / "+p.goal.length,.5,.32,16,"#b5f3e5");
 }
 t(p.mistakes?(l?"Incorrect reflection · try again":"倒影不符 · 可以重试"):(l?"Compare the evidence before selecting":"观察证据后再选择"),.5,.80,16,p.mistakes?"#f1b6a6":"#c5d7eb");c.restore();return true;
}
export function paintLibraryEnvironment(c,v,frame,W=960,H=540,pos=[.1,.83]){
 const t=frame/60;c.save();const g=c.createRadialGradient(W*.63,H*.12,0,W*.63,H*.12,W*.55);g.addColorStop(0,"#b0b9ff22");g.addColorStop(1,"#25325100");c.fillStyle=g;c.fillRect(0,0,W,H);
 for(let i=0;i<20;i++){let x=(i*137.31%W),y=(i*47.3+Math.sin(t*.35+i)*18)%H;c.globalAlpha=.15+.15*Math.sin(t*.6+i)**2;c.fillStyle="#c9d9ff";c.beginPath();c.ellipse(x,y,2.5,1.2,t*.4+i,0,Math.PI*2);c.fill();}
 c.restore();
}
