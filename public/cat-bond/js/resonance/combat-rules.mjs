// The Last Resonance — isolated objective rules; no storage, DOM or legacy combat changes.
export const buildCombatRules = function buildCombatRules(){
  const regions=[
    {id:"harbor",scene:"harbor:H-04",name:["潮汐救援","Storm rescue"],enemy:["潮壳巡猎者","Tide-shell prowler"],behavior:"intercept-rescue",mechanic:"beacon",support:"lighthouse-signal",npcs:["jiedeng","qilan"],reward:"rescue-support"},
    {id:"forest",scene:"forest:R-03",name:["根系协防","Root defense"],enemy:["缠根回响","Rootbound echo"],behavior:"entangle",mechanic:"paired-root",support:"paired-root-channel",npcs:["yahe","yuchuan"],reward:"water-route-support"},
    {id:"forge",scene:"forge:E-03",name:["熔炉试验","Furnace test"],enemy:["熔炉机械守卫","Furnace guardian"],behavior:"pressure-burst",mechanic:"heat-pressure",support:"sound-gate-repair",npcs:["jinpo","xiaomao"],reward:"forge-support",operation:"battle:forge-guardian"},
    {id:"sky",scene:"sky:S-03",name:["并肩飞行","Joint flight"],enemy:["断风回响","Windbreak echo"],behavior:"wind-shear",mechanic:"wind-route",support:"aerial-melody",npcs:["lingyu","yuanfan"],reward:"courier-support"},
    {id:"library",scene:"library:M-02",name:["镜室辨影","Mirror verification"],enemy:["伪录回响","False-record echo"],behavior:"copy-pattern",mechanic:"authentic-record",support:"authentic-melody-order",npcs:["moye","baikan"],reward:"archive-support"},
    {id:"starfall",scene:"starfall:F-02",name:["观测台协防","Observatory defense"],enemy:["星轨回响","Orbit echo"],behavior:"shifting-orbit",mechanic:"star-alignment",support:"star-map-alignment",npcs:["xingya","lichuan"],reward:"navigation-support"}
  ];
  const ids=regions.map(r=>r.id), clone=x=>JSON.parse(JSON.stringify(x));
  const requireId=(s)=>typeof s==="string"&&s.length>0;
  const fresh=()=>({version:1,phase:1,gates:[],identified:[],support:[],centralDefeated:false,mulingUnlocked:false,resolved:false});
  // Host must derive evidence from the live arena / canonical narrative, never from a UI button.
  function finale(saved,context){
    if(!context||!["slot1","slot2","slot3"].includes(context.slotId)||!requireId(context.attemptId))throw Error("slot and encounter identity required");
    if(!ids.every(id=>context.regions?.[id]?.sanctuary===true&&context.regions?.[id]?.melody===true&&context.regions?.[id]?.reciprocal===true))throw Error("canonical ring prerequisites missing");
    const s=saved?clone(saved):fresh();
    if(s.version!==1||![1,2,3,4].includes(s.phase)||!Array.isArray(s.gates)||!Array.isArray(s.identified)||!Array.isArray(s.support))throw Error("invalid checkpoint");
    const expected=Array.isArray(context.echoes)?context.echoes.map(x=>clone(x)):[];
    if(expected.length<2||expected.some(x=>!requireId(x.id)||!requireId(x.identity)||!requireId(x.habit)||!requireId(x.observed)||x.habit===x.observed)||new Set(expected.map(x=>x.id)).size!==expected.length)throw Error("authored echo observations required");
    if(s.gates.some(x=>!ids.includes(x))||s.support.some(x=>!ids.includes(x))||s.identified.some(x=>!expected.some(e=>e.id===x))||[s.gates,s.identified,s.support].some(x=>new Set(x).size!==x.length)||(s.phase>=2&&s.gates.length!==6)||(s.phase>=3&&s.identified.length!==expected.length)||(s.centralDefeated&&s.support.length!==6)||(s.mulingUnlocked&&!s.centralDefeated)||(s.resolved&&!s.mulingUnlocked)||(s.phase===4)!==s.resolved)throw Error("inconsistent checkpoint");
    const result=(ok,reason,operations=[])=>({ok,reason,operations,state:clone(s)});
    const supportProfile=id=>{const r=regions.find(x=>x.id===id);return r?{action:r.support,npcs:[...r.npcs],method:context.supportMethods?.[id]||"standard"}:null;};
    function accept(e){
      if(!e||e.slotId!==context.slotId||e.attemptId!==context.attemptId)return result(false,"stale-encounter");
      if(s.resolved)return result(false,"already-resolved");
      if(e.type==="loss"||e.type==="exit")return result(false,e.type);
      if(s.phase===1&&e.type==="gate-disabled"){
        if(!ids.includes(e.region)||s.gates.includes(e.region)||e.interrupted!==true||e.npcsProtected!==true)return result(false,"gate-evidence");
        s.gates.push(e.region);
        if(s.gates.length===6){s.phase=2;return result(true,null,[{scene:"finale:B-01",operation:"battle:inward-gates"}]);}
        return result(true,null);
      }
      if(s.phase===2&&e.type==="echo-interrupted"){
        const x=expected.find(x=>x.id===e.echoId);
        if(!x||s.identified.includes(x.id)||e.identity!==x.identity||e.observed!==x.observed||e.verifiedHabit!==x.habit||e.interrupted!==true)return result(false,"echo-evidence");
        if(e.method==="catdex"&&(!context.catdex?.[x.identity]||!context.catdex[x.identity].includes(x.habit)))return result(false,"unverified-habit");
        if(e.method==="duo"&&(!(context.duo?.bond>=20)||!context.duo?.matchedBehavior?.includes(x.habit)))return result(false,"duo-evidence");
        if(e.method==="promise"&&(!context.duo?.promiseIds?.includes(e.promiseId)||!context.duo?.matchedBehavior?.includes(x.habit)))return result(false,"promise-evidence");
        if(!["observe","catdex","duo","promise"].includes(e.method))return result(false,"method");
        s.identified.push(x.id);
        if(s.identified.length===expected.length){s.phase=3;return result(true,null,[{scene:"finale:B-02",operation:"battle:identify-echo"}]);}
        return result(true,null);
      }
      if(s.phase===3&&e.type==="support-complete"){
        const p=supportProfile(e.region);
        if(!p||s.support.includes(e.region)||e.action!==p.action||e.method!==p.method||e.protected!==true||e.melodyActivated!==true||!Array.isArray(e.actors)||!p.npcs.every(x=>e.actors.includes(x)))return result(false,"support-evidence");
        s.support.push(e.region);return result(true,null,[{scene:"finale:B-03",region:e.region,supportAction:p.action}]);
      }
      if(s.phase===3&&e.type==="central-victory"){
        if(s.support.length!==6||s.centralDefeated||e.result!=="win")return result(false,"central-gate");
        s.centralDefeated=true;return result(true,null,[{scene:"finale:B-03",operation:"battle:central-echo"}]);
      }
      if(s.phase===3&&e.type==="muling-unlock"){
        if(!s.centralDefeated||s.mulingUnlocked||e.actor!=="muling"||e.route!=="neighbor"||e.dialogueComplete!==true)return result(false,"unlock-gate");
        s.mulingUnlocked=true;return result(true,null,[{scene:"finale:B-03",operation:"mechanism:muling-unlock"}]);
      }
      if(s.phase===3&&e.type==="ring-confirmed"){
        if(!s.mulingUnlocked||!ids.every(id=>e.neighborPaths?.[id]===true)||e.canonicalReplyVerified!==true)return result(false,"ring-gate");
        s.phase=4;s.resolved=true;return result(true,null); // B-04 belongs to narrative/cinematic, not combat.
      }
      return result(false,"phase-or-event");
    }
    return {accept,snapshot:()=>clone(s),supportProfile};
  }
  return {regions:clone(regions),finale};
};
