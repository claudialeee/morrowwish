// Slot-local story core. No DOM, storage, map or combat ownership.
export function makeEngine(data,initial){
 const copy=x=>JSON.parse(JSON.stringify(x)), add=(a,x)=>{if(!a.includes(x))a.push(x)};
 const restorationWins={"battle:chime-beast":["harbor","harbor:H-05","harbor:H-04"],"battle:root-guardian":["forest","forest:R-04","forest:R-04"],"battle:shadow-beast":["forge","forge:E-04","forge:E-03"],"battle:gale-guardian":["sky","sky:S-03","sky:S-03"],"battle:mirror-guardian":["library","library:M-02","library:M-02"],"battle:star-guardian":["starfall","starfall:F-04","starfall:F-04"]};
 const restoreFromVictory=(s,operation,sceneId)=>{if(data.storyRevision!==3)return;const rule=restorationWins[operation];if(!rule||rule[2]!==sceneId)return;const [region,destination]=rule,e=s.evidence[destination]||=[];for(const op of ["repair:"+region,"melody:"+region])add(e,op);add(s.sanctuaries,region);add(s.melodies,region);};
 const index=Object.fromEntries(data.scenes.map((x,i)=>[x.id,i])), byId=Object.fromEntries(data.scenes.map(x=>[x.id,x]));
 const fresh=()=>({schema:1,scene:data.scenes[0].id,completed:[],evidence:{},choices:{},trust:Object.fromEntries(Object.keys(data.cast).map(k=>[k,0])),links:Object.fromEntries(data.links.map(([a,b])=>[a+":"+b,[]])),sanctuaries:[],melodies:[],support:[],returned:[],postgame:[],ambientDone:[],cursor:0,revision:0});
 let s=initial==null?fresh():copy(initial);
 // Reset only legacy opening dialogue cursors; all other save fields are preserved.
 if(data.openingPresentationVersion===2&&s.openingPresentationVersion!==2){if(s.scene?.startsWith("prologue:"))s.cursor=0;s.openingPresentationVersion=2;}
 if(data.fullCampaignPresentationVersion===2&&s.fullCampaignPresentationVersion!==2){
  if(!s.scene?.startsWith("prologue:")&&!s.scene?.startsWith("harbor:")&&!s.scene?.startsWith("forest:")&&s.completed?.length<data.scenes.length)s.cursor=0;
  if(s.completed?.length===data.scenes.length)s.cursor=byId[s.scene]?.lines.length??s.cursor;
  for(const [from,to] of [["sky:S-03","sky:S-02"],["library:M-05","library:M-01"],["starfall:F-04","starfall:F-01"]])if(s.choices?.[from]&&!s.choices[to])s.choices[to]=s.choices[from];
  // Older saves may already have finished S-02 before the flight choice moved there.
  if(s.completed?.includes("sky:S-02")&&!s.choices["sky:S-02"])s.choices["sky:S-02"]="train";
  s.fullCampaignPresentationVersion=2;
 }
 // A completed legacy rescue remains completed; a partially played rescue restarts only R-03.
 if(byId["forest:R-03"]?.requires.includes("battle:root-echo")&&s.evidence?.["forest:R-03"]?.includes("puzzle:paired-water-gates")){
  const old=s.evidence["forest:R-03"];
  s.evidence["forest:R-03"]=old.filter(op=>op!=="puzzle:paired-water-gates");
  if(s.completed.includes("forest:R-03"))s.evidence["forest:R-03"]=[...byId["forest:R-03"].requires];
  else if(s.scene==="forest:R-03")s.cursor=0;
 }
 // E-01 no longer requires a regional revisit or cinematic. Preserve all existing completion evidence.
 if(s.scene==="epilogue:E-01")s.cursor=0;
 if(data.runtimeRevision&&s.runtimeRevision!==data.runtimeRevision){if(["harbor:H-01","harbor:H-02","harbor:H-03","harbor:H-04","harbor:H-05","forest:R-01","forest:R-02","forest:R-03","forest:R-04","forge:E-01","forge:E-02","forge:E-03","forge:E-04","starfall:F-01","starfall:F-03","starfall:F-04","finale:B-01","finale:B-02","finale:B-03"].includes(s.scene)&&s.completed.length<data.scenes.length)s.cursor=0;s.runtimeRevision=data.runtimeRevision;}
 if(data.storyRevision===3&&s.storyRevision!==3){if(s.completed.length<data.scenes.length)s.cursor=0;else s.cursor=byId[s.scene].lines.length;for(const [op,[region,dest,source]] of Object.entries(restorationWins))if(s.evidence[source]?.includes(op))restoreFromVictory(s,op,source);s.storyRevision=3;}
 // Move only previously earned operation evidence. Older partial playtest slots
 // replay the newly ordered scene rather than receiving a fabricated restoration.
 if(data.eventTimingRevision===1&&s.eventTimingRevision!==1){
  for(const [early,late,region] of [["sky:S-03","sky:S-05","sky"],["library:M-02","library:M-05","library"]]){
   const needed=["repair:"+region,"melody:"+region],old=s.evidence[late]||[];
   for(const op of needed)if(old.includes(op)){s.evidence[early]||=[];add(s.evidence[early],op);}
   if(index[s.scene]>index[early]&&index[s.scene]<=index[late]&&!needed.every(op=>s.evidence[early]?.includes(op))){
    s.completed=s.completed.slice(0,index[early]);s.scene=early;s.cursor=0;
   }else if(s.scene===early||s.scene===late)s.cursor=0;
  }
  delete s.choices["library:M-01"];s.eventTimingRevision=1;
 }
 if(data.regionalBossRevision===1&&s.regionalBossRevision!==1){
  const op={"library:M-02":"battle:mirror-guardian","starfall:F-04":"battle:star-guardian"}[s.scene];
  if(op&&!s.completed.includes(s.scene)&&!s.evidence[s.scene]?.includes(op))s.cursor=0;
  s.regionalBossRevision=1;
 }
 if(s.scene==="sky:S-04"&&!s.choices[s.scene]&&s.cursor>byId[s.scene].choiceAt)s.cursor=byId[s.scene].choiceAt;
 if(typeof s.openingMet!=="boolean")s.openingMet=false;if(!s.ambientDone)s.ambientDone=[];if(!s.ruins)s.ruins={clears:s.postgame.includes("postgame:ruins")?1:0,duoClears:0,attempts:[]};
 const fail=reason=>({ok:false,reason}), commit=()=>({ok:true,state:copy({...s,revision:++s.revision})});
 const cargoComplete=()=>data.links.every(([a,b])=>s.links[a+":"+b].length===4);
 // Story resonance is established by restored sanctuaries, not optional deliveries.
 const ring=()=>allRegionsRestored();
 // Restored melodies are accepted only from their authored story operation, not a
 // separately written sanctuary/melody flag. Region profiles use the same evidence.
 const hasRegionalEvidence=(region,kind)=>data.scenes.some(scene=>scene.chapter===region&&scene.requires.includes(kind+":"+region)&&s.evidence[scene.id]?.includes(kind+":"+region));
 const regionRestored=region=>s.sanctuaries.includes(region)&&s.melodies.includes(region)&&hasRegionalEvidence(region,"repair")&&hasRegionalEvidence(region,"melody");
 const allRegionsRestored=()=>data.regions.every(regionRestored);
 const ended=()=>s.completed.length===data.scenes.length;
 const current=()=>byId[s.scene];
 const regionOpen=r=>data.regions.includes(r)&&(r==="harbor"&&s.scene==="prologue:P-05"||index[s.scene]>=index[data.scenes.find(x=>x.chapter===r).id]);
 const stages=["sendA","receiveB","sendB","receiveA"];
 function validate(){
  if(s.schema!==1||!current()||!Array.isArray(s.completed)||s.completed.some((id,i)=>data.scenes[i]?.id!==id)||s.scene!==data.scenes[Math.min(s.completed.length,data.scenes.length-1)].id||!Number.isInteger(s.cursor)||s.cursor<0||s.cursor>current().lines.length)throw Error("Invalid campaign sequence");
  for(const [a,b] of data.links){const l=s.links[a+":"+b];if(!Array.isArray(l)||l.length>4||l.some((v,i)=>v!==stages[i]))throw Error("Invalid reciprocal link")}
  for(const k of ["sanctuaries","melodies","support","returned","postgame"])if(!Array.isArray(s[k])||new Set(s[k]).size!==s[k].length)throw Error("Invalid "+k);
  if(!Number.isSafeInteger(s.ruins.clears)||s.ruins.clears<0||!Number.isSafeInteger(s.ruins.duoClears)||s.ruins.duoClears<0||s.ruins.duoClears>s.ruins.clears||!Array.isArray(s.ruins.attempts)||new Set(s.ruins.attempts).size!==s.ruins.attempts.length)throw Error("Invalid ruins progress");
  if(s.sanctuaries.some(r=>!data.regions.includes(r))||s.melodies.some(r=>!s.sanctuaries.includes(r))||s.support.some(r=>!data.regions.includes(r)))throw Error("Invalid region progress");
  if(s.completed.includes("starfall:F-04")&&(!ring()||!allRegionsRestored()))throw Error("Invalid ring");
  if(s.completed.includes("finale:B-03")&&s.support.length!==6)throw Error("Invalid support");
 }
 function choose(id){const c=current().choices.find(x=>x.id===id);if(ended()||!c||s.choices[s.scene]||(current().choiceTiming==="afterDialogue"&&s.cursor!==(current().choiceAt??current().lines.length)))return fail("choice-unavailable");s.choices[s.scene]=id;s.trust[c.npc]+=c.method==="anger"?-2:c.method==="distance"?-1:2;return commit()}
 function lineReady(){const x=current();return (x.choiceAt==null||s.cursor<x.choiceAt||!!s.choices[x.id])&&(!x.choices.length||x.choiceTiming!=="beforeAction"||!!s.choices[x.id])&&x.lineGate.every(op=>s.evidence[x.id]?.includes(op))&&(x.lines[s.cursor]?.afterOperations||[]).every(op=>s.evidence[x.id]?.includes(op))&&(x.id!=="starfall:F-04"||(ring()&&allRegionsRestored()))&&(x.id!=="finale:B-03"||s.support.length===6)}
 function nextLine(){if(ended()||s.cursor>=current().lines.length)return fail("dialogue-ended");if(!lineReady())return fail("dialogue-awaits-action");s.cursor++;return commit()}
 // Trusted game adapters only: never expose this operation to a generic completion button.
 function record(sceneId,operation){if(ended()||sceneId!==s.scene||!current().requires.includes(operation))return fail("unexpected-operation");if(current().choices.length&&current().choiceTiming==="beforeAction"&&!s.choices[s.scene])return fail("choice-pending");const e=s.evidence[s.scene]||[];
  if(e.includes(operation))return fail("duplicate-operation");
  if((current().orderedRequires||["starfall:F-01","starfall:F-02","starfall:F-04"].includes(sceneId))&&current().requires.find(op=>!e.includes(op))!==operation)return fail("story-operation-order");
  if(["npc:public-accountability","npc:second-garden-key"].includes(operation)&&s.cursor!==current().lines.length)return fail("dialogue-pending");
  if(operation==="npc:public-accountability"&&current().choices.length&&!s.choices[s.scene])return fail("choice-pending");
  if(operation.startsWith("melody:")&&!s.sanctuaries.includes(operation.split(":")[1]))return fail("sanctuary-not-repaired");
  if(operation==="mechanism:muling-unlock"&&(!ring()||s.support.length!==6||!e.includes("battle:central-echo")||s.cursor!==current().lines.length))return fail("support-incomplete");
  s.evidence[s.scene]=e;add(e,operation);restoreFromVictory(s,operation,sceneId);if(sceneId==="starfall:F-01"&&operation==="npc:central-dispute")s.trust.xingya++;if(sceneId==="starfall:F-01"&&operation==="npc:central-dispute-lichuan")s.trust.lichuan++;if(sceneId==="starfall:F-04"&&operation==="melody:starfall"){s.trust.xingya++;s.trust.lichuan++;}if(operation.startsWith("repair:"))add(s.sanctuaries,operation.split(":")[1]);if(operation.startsWith("melody:"))add(s.melodies,operation.split(":")[1]);return commit()}
 function exchange({a,b,stage,actor,action}){const link=data.links.find(l=>l[0]===a&&l[1]===b);if(!link||!regionOpen(a)||!regionOpen(b))return fail("region-locked");const seq=s.links[a+":"+b],i=seq.length;if(i>=4||stage!==stages[i]||actor!==[a,b,b,a][i]||action!==[link[2],link[2],link[3],link[3]][i])return fail("invalid-reciprocal-step");
  const minimum=a==="starfall"?"starfall:F-02":data.scenes.filter(x=>x.chapter===a).at(-1).id;if(!s.completed.includes(minimum))return fail("local-crisis-unresolved");
  seq.push(stage);return commit()}
 function supportAction(region,action){if(s.scene!=="finale:B-03"||!ring()||!supportProfile(region).ready||data.support[data.regions.indexOf(region)]!==action||s.support.includes(region))return fail("invalid-support");s.support.push(region);return commit()}
 function finish(){const x=current();if(ended())return fail("already-completed");if(s.cursor!==x.lines.length)return fail("dialogue-pending");if(x.choices.length&&!s.choices[x.id])return fail("choice-pending");if(x.requires.some(op=>!s.evidence[x.id]?.includes(op)))return fail("gameplay-pending");if(x.id==="starfall:F-04"&&(!ring()||!allRegionsRestored()))return fail("reciprocity-pending");if(x.id==="finale:B-03"&&s.support.length!==6)return fail("support-pending");s.completed.push(x.id);s.scene=data.scenes[s.completed.length]?.id||s.scene;s.cursor=0;return commit()}
 function postgame(id,operation){const q=data.side.find(x=>x.id===id);if(!ended()||!q||s.postgame.includes(id)||q.operation!==operation)return fail("postgame-unavailable");if(id.startsWith("postgame:reunion-")&&!s.postgame.includes("postgame:letter-"+q.region))return fail("repair-before-reunion");s.postgame.push(id);if(id==="postgame:ruins")s.ruins.clears=Math.max(1,s.ruins.clears);if(id.startsWith("postgame:letter-"))for(const n of Object.values(data.cast).filter(n=>n.region===q.region))s.trust[n.id]+=1;if(id.startsWith("postgame:reunion-"))for(const n of Object.values(data.cast).filter(n=>n.region===q.region))add(s.returned,n.id);return commit()}
 function supportProfile(region){const received=data.links.flatMap(([a,b,forward,back])=>{const progress=s.links[a+":"+b];return [...(b===region&&progress.includes("receiveB")?[forward]:[]),...(a===region&&progress.includes("receiveA")?[back]:[])];});return {region,received,ready:regionRestored(region),methods:data.scenes.filter(x=>x.chapter===region).flatMap(x=>x.choices.filter(c=>c.id===s.choices[x.id]).map(c=>c.method)),trust:Object.fromEntries(Object.values(data.cast).filter(n=>n.region===region).map(n=>[n.id,s.trust[n.id]]))}}
 function ambientAvailable(region){return copy(data.ambient.filter(a=>a.region===region&&s.completed.includes(a.after)&&(!a.before||!s.completed.includes(a.before))&&!s.ambientDone.includes(a.id)))}
 function ambient(id,operation){const a=data.ambient.find(x=>x.id===id);if(!a||!ambientAvailable(a.region).some(x=>x.id===id)||a.operation!==operation)return fail("ambient-unavailable");s.ambientDone.push(id);s.trust[a.npc]++;return commit()}
 function ruinsClear(attemptId,duoPromise){if(!ended()||typeof attemptId!=="string"||!attemptId||attemptId.length>100||s.ruins.attempts.includes(attemptId))return fail("ruins-unavailable");s.ruins.attempts.push(attemptId);s.ruins.clears++;if(duoPromise===true)s.ruins.duoClears++;add(s.postgame,"postgame:ruins");return commit()}
 function meetTraveler(){if(ended()||s.scene!=="prologue:P-05"||s.evidence[s.scene]?.includes("travel:harbor")||s.openingMet)return fail("encounter-unavailable");s.openingMet=true;return commit()}
 function view(){const visible=ended()?null:copy(current());if(visible?.choiceResponses&&s.choices[s.scene])visible.lines.splice(visible.choiceAt,visible.lines.length-visible.choiceAt,...copy(visible.choiceResponses[s.choices[s.scene]]||visible.lines.slice(visible.choiceAt)));if(visible?.id==="library:M-04"&&s.choices["library:M-03"]==="space")visible.lines[0].text={zh:"慢慢看，不急。暮铃，借阅印记和你的铃坠一样。那天正是失忆重新出现的时候。",en:"Take your time. Luna, the borrower’s mark matches your pendant. The forgetting started again that very day."};if(visible?.id==="epilogue:E-03"){const accountability=s.choices["epilogue:E-02"],tea=s.choices["sky:S-04"];if(accountability==="help")visible.lines[0].text={zh:"阿婆的门铃已经修好了。谢谢你帮我递工具。以后……我还能来这里吗？",en:"Gran’s doorbell is mended. Thank you for passing me the tools. May I still come here?"};else if(accountability==="space")visible.lines[0].text={zh:"我会等阿婆愿意再听我解释。以后……我还能来这里吗？",en:"I’ll wait until Gran is ready to hear me out. May I still come here?"};if(tea==="joke")visible.lines[2].text={zh:"我去准备两杯茶。这次可不许全喝掉。",en:"I’ll make two cups of tea. This time, don’t drink both."};else if(tea==="search")visible.lines[2].text={zh:"原来你就是我一直等的朋友。我去准备两杯茶。",en:"You were the friend I was waiting for. I’ll make two cups of tea."};}if(visible?.id==="harbor:H-01"&&!s.openingMet)visible.lines[4].text={zh:"我叫暮铃。我们一起去看看古铃吧。",en:"I’m Luna. Let’s go see what happened to the bell."};return {openingMet:s.openingMet,current:visible,lineReady:!ended()&&lineReady(),cursor:s.cursor,choice:s.choices[s.scene]||s.choices[{"sky:S-03":"sky:S-02","starfall:F-04":"starfall:F-01"}[s.scene]]||null,regions:data.regions.filter(regionOpen),ring:ring(),cargoComplete:cargoComplete(),ending:ended(),muling:s.completed.includes("epilogue:E-03")?"reconciled":s.completed.includes("epilogue:E-02")?"accountable":s.completed.includes("finale:B-04")?"accountability-pending":s.completed.includes("starfall:F-05")?"finale":s.completed.includes("library:M-05")?"departed":s.completed.includes("library:M-04")?"betrayal-revealed":s.completed.includes("library:M-03")?"identity-revealed":s.completed.includes("harbor:H-04")?"companion":s.completed.includes("harbor:H-01")?"temporary":"unmet",objective:ended()?[]:current().requires.filter(x=>!s.evidence[s.scene]?.includes(x)),support:data.regions.map(supportProfile)}}
 validate();return {snapshot:()=>copy(s),view,choose,nextLine,record,meetTraveler,exchange,supportAction,finish,postgame,ruinsClear,supportProfile,ambientAvailable,ambient}
}
