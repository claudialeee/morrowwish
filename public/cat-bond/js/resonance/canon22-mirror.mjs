// Canon 2.2: the true companion responds to a new position; the copy only repeats its old action.
function newMirror(seed){const key=String(seed||"starbell");let h=0;for(const ch of key)h=(Math.imul(h,31)+ch.charCodeAt(0))|0;return {trueSide:Math.abs(h)%2,position:0,faces:[0,0],trace:[],changes:0,mistakes:0,solved:false,choice:null};}

function advanceMirror(m,input){if(!m||m.solved||![0,1,2].includes(input))return false;if(input===1){if(m.trace.length>=32){m.trace=[];m.changes=0;m.position=0;m.faces=[0,0];}m.position=m.position===0?1:-m.position;m.faces[m.trueSide]=m.position;m.trace.push(1);m.changes++;return false;}const side=input===0?0:1;if(m.changes<1||m.faces[side]!==m.position||side!==m.trueSide){m.mistakes++;m.trace=[];m.changes=0;m.position=0;m.faces=[0,0];return false;}m.trace.push(input);m.choice=side;m.solved=true;return true;}

function mirrorProof(m){return m?.solved?{trace:[...m.trace],choice:m.choice}:null;}

function validMirrorProof(seed,p){if(!p||!Array.isArray(p.trace)||p.trace.length<2||p.trace.length>33||!p.trace.slice(0,-1).every(x=>x===1)||![0,2].includes(p.trace.at(-1)))return false;const m=newMirror(seed);for(const x of p.trace)advanceMirror(m,x);return m.solved&&m.choice===p.choice;}
export {newMirror,advanceMirror,mirrorProof,validMirrorProof};
