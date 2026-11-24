// Slot-local story core. No DOM, storage, map or combat ownership.
export function makeEngine(data,initial){
 const copy=x=>JSON.parse(JSON.stringify(x)), add=(a,x)=>{if(!a.includes(x))a.push(x)};
 const index=Object.fromEntries(data.scenes.map((x,i)=>[x.id,i])), byId=Object.fromEntries(data.scenes.map(x=>[x.id,x]));
 const fresh=()=>({schema:1,scene:data.scenes[0].id,completed:[],evidence:{},choices:{},trust:Object.fromEntries(Object.keys(data.cast).map(k=>[k,0])),links:Object.fromEntries(data.links.map(([a,b])=>[a+":"+b,[]])),sanctuaries:[],melodies:[],support:[],returned:[],postgame:[],ambientDone:[],cursor:0,revision:0});
 let s=initial==null?fresh():copy(initial);if(!s.ambientDone)s.ambientDone=[];
 const fail=reason=>({ok:false,reason}), commit=()=>({ok:true,state:copy({...s,revision:++s.revision})});
 const ring=()=>data.links.every(([a,b])=>s.links[a+":"+b].length===4);
 const ended=()=>s.completed.length===data.scenes.length;
 const current=()=>byId[s.scene];
 const regionOpen=r=>data.regions.includes(r)&&index[s.scene]>=index[data.scenes.find(x=>x.chapter===r).id];
 const stages=["sendA","receiveB","sendB","receiveA"];
 function validate(){
  if(s.schema!==1||!current()||!Array.isArray(s.completed)||s.completed.some((id,i)=>data.scenes[i]?.id!==id)||s.scene!==data.scenes[Math.min(s.completed.length,data.scenes.length-1)].id||!Number.isInteger(s.cursor)||s.cursor<0||s.cursor>current().lines.length)throw Error("Invalid campaign sequence");
  for(const [a,b] of data.links){const l=s.links[a+":"+b];if(!Array.isArray(l)||l.length>4||l.some((v,i)=>v!==stages[i]))throw Error("Invalid reciprocal link")}
  for(const k of ["sanctuaries","melodies","support","returned","postgame"])if(!Array.isArray(s[k])||new Set(s[k]).size!==s[k].length)throw Error("Invalid "+k);
  if(s.sanctuaries.some(r=>!data.regions.includes(r))||s.melodies.some(r=>!s.sanctuaries.includes(r))||s.support.some(r=>!data.regions.includes(r)))throw Error("Invalid region progress");
  if(s.completed.includes("starfall:F-04")&&(!ring()||s.melodies.length!==6))throw Error("Invalid ring");
  if(s.completed.includes("finale:B-03")&&s.support.length!==6)throw Error("Invalid support");
 }
 function choose(id){const c=current().choices.find(x=>x.id===id);if(ended()||!c||s.choices[s.scene]||(current().choiceTiming==="afterDialogue"&&s.cursor!==current().lines.length))return fail("choice-unavailable");s.choices[s.scene]=id;s.trust[c.npc]+=c.method==="anger"?-2:c.method==="distance"?-1:2;return commit()}
 function lineReady(){const x=current();return (!x.choices.length||x.choiceTiming!=="beforeAction"||!!s.choices[x.id])&&x.lineGate.every(op=>s.evidence[x.id]?.includes(op))&&(x.id!=="starfall:F-04"||ring())&&(x.id!=="finale:B-03"||s.support.length===6)}
 function nextLine(){if(ended()||s.cursor>=current().lines.length)return fail("dialogue-ended");if(!lineReady())return fail("dialogue-awaits-action");s.cursor++;return commit()}
 // Trusted game adapters only: never expose this operation to a generic completion button.
 function record(sceneId,operation){if(ended()||sceneId!==s.scene||!current().requires.includes(operation))return fail("unexpected-operation");if(current().choices.length&&current().choiceTiming==="beforeAction"&&!s.choices[s.scene])return fail("choice-pending");const e=s.evidence[s.scene]||[];
  if(e.includes(operation))return fail("duplicate-operation");
  if(operation.startsWith("melody:")&&!s.sanctuaries.includes(operation.split(":")[1]))return fail("sanctuary-not-repaired");
  if(operation==="mechanism:muling-unlock"&&(!ring()||s.support.length!==6||!e.includes("battle:central-echo")||s.cursor!==current().lines.length))return fail("support-incomplete");
  s.evidence[s.scene]=e;add(e,operation);if(operation.startsWith("repair:"))add(s.sanctuaries,operation.split(":")[1]);if(operation.startsWith("melody:"))add(s.melodies,operation.split(":")[1]);return commit()}
 function exchange({a,b,stage,actor,action}){const link=data.links.find(l=>l[0]===a&&l[1]===b);if(!link||!regionOpen(a)||!regionOpen(b))return fail("region-locked");const seq=s.links[a+":"+b],i=seq.length;if(i>=4||stage!==stages[i]||actor!==[a,b,b,a][i]||action!==[link[2],link[2],link[3],link[3]][i])return fail("invalid-reciprocal-step");
  const minimum=a==="starfall"?"starfall:F-02":data.scenes.filter(x=>x.chapter===a).at(-1).id;if(!s.completed.includes(minimum))return fail("local-crisis-unresolved");
  seq.push(stage);return commit()}
 function supportAction(region,action){if(s.scene!=="finale:B-03"||!ring()||!s.melodies.includes(region)||data.support[data.regions.indexOf(region)]!==action||s.support.includes(region))return fail("invalid-support");s.support.push(region);return commit()}
 function finish(){const x=current();if(ended())return fail("already-completed");if(s.cursor!==x.lines.length)return fail("dialogue-pending");if(x.choices.length&&!s.choices[x.id])return fail("choice-pending");if(x.requires.some(op=>!s.evidence[x.id]?.includes(op)))return fail("gameplay-pending");if(x.id==="starfall:F-04"&&(!ring()||s.melodies.length!==6))return fail("reciprocity-pending");if(x.id==="finale:B-03"&&s.support.length!==6)return fail("support-pending");s.completed.push(x.id);s.scene=data.scenes[s.completed.length]?.id||s.scene;s.cursor=0;return commit()}
 function postgame(id,operation){const q=data.side.find(x=>x.id===id);if(!ended()||!q||s.postgame.includes(id)||q.operation!==operation)return fail("postgame-unavailable");s.postgame.push(id);if(id.startsWith("postgame:reunion-"))for(const n of Object.values(data.cast).filter(n=>n.region===q.region))add(s.returned,n.id);return commit()}
 function supportProfile(region){return {region,methods:data.scenes.filter(x=>x.chapter===region).flatMap(x=>x.choices.filter(c=>c.id===s.choices[x.id]).map(c=>c.method)),trust:Object.fromEntries(Object.values(data.cast).filter(n=>n.region===region).map(n=>[n.id,s.trust[n.id]]))}}
 function ambientAvailable(region){return copy(data.ambient.filter(a=>a.region===region&&s.completed.includes(a.after)&&(!a.before||!s.completed.includes(a.before))&&!s.ambientDone.includes(a.id)))}
 function ambient(id,operation){const a=data.ambient.find(x=>x.id===id);if(!a||!ambientAvailable(a.region).some(x=>x.id===id)||a.operation!==operation)return fail("ambient-unavailable");s.ambientDone.push(id);s.trust[a.npc]++;return commit()}
 function view(){return {current:ended()?null:copy(current()),lineReady:!ended()&&lineReady(),cursor:s.cursor,choice:s.choices[s.scene]||null,regions:data.regions.filter(regionOpen),ring:ring(),ending:ended(),muling:s.completed.includes("finale:B-04")?"reconciled":s.completed.includes("starfall:F-05")?"finale":s.completed.includes("library:M-05")?"departed":s.completed.includes("library:M-04")?"betrayal-revealed":s.completed.includes("library:M-03")?"identity-revealed":s.completed.includes("prologue:P-04")?"companion":"unmet",objective:ended()?[]:current().requires.filter(x=>!s.evidence[s.scene]?.includes(x)),support:data.regions.map(supportProfile)}}
 validate();return {snapshot:()=>copy(s),view,choose,nextLine,record,exchange,supportAction,finish,postgame,supportProfile,ambientAvailable,ambient}
}
