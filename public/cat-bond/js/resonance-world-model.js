// The Last Resonance: slot-owned campaign domain model. Runtime scene controllers must validate physical gameplay before emitting events.
(function(root){ const build = function buildResonanceWorld(){
  "use strict";
  const region=(id,zh,en,chapter,melodyZh,melodyEn,npcs,scenes,choices)=>({id,zh,en,chapter,melodyZh,melodyEn,npcs,scenes,choices});
  const REGIONS=[
    region("harbor","霁潮港","Misttide Harbor",1,"归潮调","The Song of Returning Tides",["cape-lantern","qilan"],[
      ["H-01",["meet:qilan"]],["H-02",["meet:cape-lantern"]],["H-03",["tide-cave","logbook","reflect-beam"]],["H-04",["choice","rescue-navigator","guide-beacon"]],["H-05",["local-response","restore-sanctuary","recover-melody"]]],["rescue-first","calibrate-first"]),
    region("forest","眠根林","Rootsleep Forest",2,"相枝调","The Song of Living Roots",["yahe","yuchuan"],[
      ["R-01",["meet:yahe","meet:yuchuan"]],["R-02",["canopy","scent-trail","root-tunnel"]],["R-03",["choice","paired-traversal","water-routing","community-agreement"]],["R-04",["local-response","restore-sanctuary","recover-melody"]]],["upper-gardens","underground-roots"]),
    region("forge","赤炉环城","Emberforge City",3,"承火调","The Song of Ember",["jinpo","xiaomao"],[
      ["E-01",["meet:jinpo","meet:xiaomao"]],["E-02",["collect-parts","temperature","blueprint"]],["E-03",["choice","rhythm-forge","assemble","furnace-test","public-accountability"]],["E-04",["local-response","restore-sanctuary","recover-melody"]]],["publish-now","workers-first"]),
    region("sky","云脊群岛","Skyspine Isles",4,"逐风调","The Song of the Open Sky",["lingyu","yuanfan"],[
      ["S-01",["meet:lingyu","meet:yuanfan"]],["S-02",["read-wind","glide","flight-recorder"]],["S-03",["choice","joint-flight","courier-delivery"]],["S-04",["muling-conversation"]],["S-05",["local-response","restore-sanctuary","recover-melody"]]],["lead-flight","joint-training"]),
    region("library","月镜书库","Moonmirror Library",5,"照影调","The Song of Reflections",["moye","baikan"],[
      ["M-01",["meet:moye","meet:baikan"]],["M-02",["mirror-navigation","reconstruct-record","verify-memory"]],["M-03",["identity-reveal"]],["M-04",["betrayal-reveal"]],["M-05",["choice","local-response","restore-sanctuary","recover-melody"]]],["release-all","family-review"]),
    region("starfall","星坠原","Starfall Expanse",6,"续星调","The Song Beyond Stars",["xingya","lichuan"],[
      ["F-01",["meet:xingya","meet:lichuan","choice"]],["F-02",["align-stars","shift-ruins","reject-illusion","observatory"]],["F-03",["reverse-plan-reveal"]],["F-04",["distributed-control","local-response","restore-sanctuary","recover-melody","ring-ready"]],["F-05",["inward-call"]]],["mechanic-coordinates","shared-decisions"])
  ];
  const LINKS=[
    ["harbor","forest","beacon-guided-supplies","herbs-and-waterway-map"],
    ["forest","forge","water-cooling-plans-and-herbs","irrigation-pumps-and-tools"],
    ["forge","sky","wind-vanes-and-flight-parts","wind-data-and-airship-access"],
    ["sky","library","courier-route","archived-flight-maps"],
    ["library","starfall","star-charts-and-coordinates","astronomical-observations"],
    ["starfall","harbor","navigation-bell-and-star-compass","coastal-response"]
  ].map(([a,b,ab,ba])=>({id:a+"-"+b,a,b,ab,ba}));
  const clone=x=>JSON.parse(JSON.stringify(x));
  const getRegion=id=>REGIONS.find(r=>r.id===id);
  const fresh=()=>({version:1,chapter:1,scene:"H-01",location:"harbor",regions:Object.fromEntries(REGIONS.map(r=>[r.id,{visited:false,sanctuary:false,melody:false,events:{},choice:null}])),links:Object.fromEntries(LINKS.map(l=>[l.id,{abSent:false,abReceived:false,baSent:false,baReceived:false}])),relationships:Object.fromEntries([...REGIONS.flatMap(r=>r.npcs),"muling"].map(id=>[id,0])),reveals:{identity:false,betrayal:false,reversePlan:false},position:null,finale:{phase:0,completed:false}});
  const ringReady=s=>LINKS.every(l=>{const x=s.links[l.id];return x.abSent&&x.abReceived&&x.baSent&&x.baReceived;})&&REGIONS.every(r=>s.regions[r.id].sanctuary&&s.regions[r.id].melody);
  const available=(s,id)=>!!getRegion(id)&&getRegion(id).chapter<=s.chapter;
  const next=(s)=>{const r=REGIONS[s.chapter-1];if(!r)return null;const scene=r.scenes.find(x=>x[0]===s.scene);return scene?{region:r.id,scene:scene[0],pending:scene[1].filter(a=>!s.regions[r.id].events[a])}:null;};
  function visit(s,id,position=null){
    if(!available(s,id))return false;
    if(position&&(!Number.isFinite(position.x)||!Number.isFinite(position.y)))return false;
    s.location=id;s.position=position?{x:position.x,y:position.y}:null;s.regions[id].visited=true;return true;
  }
  function record(s,action,details={}){
    const n=next(s);if(!n||s.location!==n.region||!n.pending.includes(action))return false;
    const p=s.regions[n.region],r=getRegion(n.region);
    // Actions are trusted scene-controller events, not public UI buttons.
    if(action==="choice"){
      if(!r.choices.includes(details.choice))return false;
      p.choice=details.choice;
    }
    if(action.startsWith("meet:"))s.relationships[action.slice(5)]+=1;
    if(action==="local-response"&&(!Array.isArray(details.participants)||!r.npcs.every(id=>details.participants.includes(id))))return false;
    if(action==="restore-sanctuary"&&!p.events["local-response"])return false;
    if(action==="recover-melody"&&!p.sanctuary)return false;
    if(action==="ring-ready"&&!ringReady(s))return false;
    if(action==="identity-reveal")s.reveals.identity=true;
    if(action==="betrayal-reveal"){if(!s.reveals.identity)return false;s.reveals.betrayal=true;}
    if(action==="reverse-plan-reveal"){if(!s.reveals.betrayal)return false;s.reveals.reversePlan=true;}
    if(action==="restore-sanctuary")p.sanctuary=true;
    if(action==="recover-melody")p.melody=true;
    p.events[action]=true;
    if(n.pending.every(a=>p.events[a])){
      const i=r.scenes.findIndex(x=>x[0]===s.scene);
      if(i<r.scenes.length-1)s.scene=r.scenes[i+1][0];
      else if(s.chapter<6){s.chapter++;s.scene=REGIONS[s.chapter-1].scenes[0][0];}
      else {s.scene="B-01";s.finale.phase=1;}
    }
    return true;
  }
  function exchange(s,linkId,kind,actor){
    const l=LINKS.find(x=>x.id===linkId);if(!l||actor!==s.location||!available(s,l.a)||!available(s,l.b))return false;
    const x=s.links[linkId];
    // Sender's sanctuary must be operational; receiving NPC must actually accept the delivery.
    const rules={abSent:[l.a,()=>s.regions[l.a].melody],abReceived:[l.b,()=>x.abSent],baSent:[l.b,()=>x.abReceived&&s.regions[l.b].melody],baReceived:[l.a,()=>x.baSent]};
    if(!Object.prototype.hasOwnProperty.call(rules,kind))return false;
    const [expected,check]=rules[kind];
    if(actor!==expected||x[kind]||!check())return false;
    x[kind]=true;return true;
  }
  function publicView(s){
    // No future secrets or hidden routing flags are returned to map/HUD.
    return {chapter:s.chapter,scene:s.scene,location:s.location,regions:REGIONS.map(r=>({id:r.id,zh:r.zh,en:r.en,unlocked:available(s,r.id),visited:s.regions[r.id].visited,sanctuary:s.regions[r.id].sanctuary,melody:s.regions[r.id].melody})),links:LINKS.map(l=>({id:l.id,a:l.a,b:l.b,...s.links[l.id],complete:Object.values(s.links[l.id]).every(Boolean)})),objective:next(s),finale:{phase:s.finale.phase,completed:s.finale.completed}};
  }
  function attach(State){
    // State.S is a getter replaced on load; never retain an object across slots.
    const get=()=>{const root=State.S;if(!root.lastResonanceWorld||root.lastResonanceWorld.version!==1)root.lastResonanceWorld=fresh();return root.lastResonanceWorld;};
    const mutate=(fn,...args)=>{const root=State.S,old=clone(get());if(!fn(get(),...args))return false;const result=State.save();if(result?.ok!==true){root.lastResonanceWorld=old;return false;}return true;};
    return Object.freeze({view:()=>publicView(get()),visit:(...a)=>mutate(visit,...a),record:(...a)=>mutate(record,...a),exchange:(...a)=>mutate(exchange,...a)});
  }
  return {REGIONS,LINKS,fresh,available,next,visit,record,exchange,ringReady,publicView,attach};
}; const api=build(); if(typeof module==='object'&&module.exports)module.exports=api; else root.CatBondResonanceModel=api; })(typeof window!=='undefined'?window:globalThis);
