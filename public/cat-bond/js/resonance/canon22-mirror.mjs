// Canon 2.2: moving and ringing are separate actions. Only the real companion answers a newly issued signal.
function newMirror(seed){const key=String(seed||"starbell");let h=0;for(const ch of key)h=(Math.imul(h,31)+ch.charCodeAt(0))|0;return {trueSide:Math.abs(h)%2,position:0,faces:[0,0],trace:[],changes:0,answeredPosition:null,mistakes:0,solved:false,choice:null};}
function resetMirror(m){m.trace=[];m.changes=0;m.position=0;m.faces=[0,0];m.answeredPosition=null;}
function advanceMirror(m,input){
 if(!m||m.solved||![0,1,2,3,4].includes(input))return false;
 if(m.trace.length>=64)resetMirror(m);
 if(input===1||input===4){
  const position=input===1?1:-1;
  if(position===m.position)return false;
  m.position=position;m.changes++;m.answeredPosition=null;m.trace.push(input);return false;
 }
 if(input===3){
  if(!m.changes||m.answeredPosition===m.position)return false;
  m.faces[m.trueSide]=m.position;m.answeredPosition=m.position;m.trace.push(3);return false;
 }
 const side=input===0?0:1;
 if(!m.changes||m.answeredPosition!==m.position||m.faces[side]!==m.position||side!==m.trueSide){m.mistakes++;resetMirror(m);return false;}
 m.trace.push(input);m.choice=side;m.solved=true;return true;
}
function mirrorProof(m){return m?.solved?{trace:[...m.trace],choice:m.choice}:null;}
function validMirrorProof(seed,p){
 if(!p||!Array.isArray(p.trace)||p.trace.length<3||p.trace.length>64||!p.trace.slice(0,-1).every(x=>[1,3,4].includes(x))||![0,2].includes(p.trace.at(-1)))return false;
 const m=newMirror(seed);for(const x of p.trace){const n=m.trace.length;advanceMirror(m,x);if(m.trace.length!==n+1)return false;}return m.solved&&m.choice===p.choice;
}
export {newMirror,advanceMirror,mirrorProof,validMirrorProof};
