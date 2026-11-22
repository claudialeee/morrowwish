(()=>{"use strict";
const allowed=new Set(["flip-dash","parcel-panic","tower-tuck","traffic-tangle","tiny-town","echo-heist","elsewhere","pocket-aquarium","pawsibly-innocent","cat-bond"]);
const route=location.pathname.split("/").filter(Boolean)[0];
const game=window.ARCADE_GAME_ID||(allowed.has(route)?route:"hub");
const disabled=!!(route&&!allowed.has(route));
const site=window.ARCADE_GAME_ID?"legacy":"arcade";
const collector=window.ARCADE_COLLECTOR||"/api/session";
const ref=document.referrer;
const start=performance.now(),viewId=globalThis.crypto?.randomUUID?.()||Math.random().toString(16).slice(2)+Date.now().toString(16);
const day=new Date().toISOString().slice(0,10);
let source="direct",referrer="",utmSource="",utmMedium="",utmCampaign="";
try{if(ref){const u=new URL(ref),host=u.hostname.toLowerCase();referrer=host.slice(0,110);source=["morrowwish.vercel.app","tiny-arcade-lab.vercel.app","after-work-tiny-town.vercel.app",location.hostname].includes(host)?"internal":"external";}}catch{}
try{const q=new URLSearchParams(location.search);const clean=v=>(v||"").replace(/[^a-zA-Z0-9 _.-]/g,"").slice(0,45);utmSource=clean(q.get("utm_source"));utmMedium=clean(q.get("utm_medium"));utmCampaign=clean(q.get("utm_campaign"));}catch{}
// Attribute itch.io iframe launches even when the game wrapper has no UTM
// query parameters. Itch-hosted HTML5 frames can have an itch.zone referrer.
if(!utmSource&&/(^|\.)itch\.(io|zone)$/i.test(referrer)){
 utmSource="itch";utmMedium="portal";source="external";
}
// Preserve first campaign attribution on same-site hops (homepage -> game -> replay).
// Avoid carrying stale campaigns into a completely separate visit.
try{
 const key="morrowwish-session-campaign";
 if(ref&&source==="internal"&&!utmSource&&!utmCampaign){
  const saved=JSON.parse(sessionStorage.getItem(key)||"null");
  if(saved&&Date.now()-Number(saved.at)<30*60*1000){
   // Use the original acquisition source across homepage-to-game navigation.
   source=String(saved.entrySource||"direct").slice(0,30);
   referrer=String(saved.referrer||"").slice(0,110);
   utmSource=String(saved.utmSource||"").slice(0,45);
   utmMedium=String(saved.utmMedium||"").slice(0,45);
   utmCampaign=String(saved.utmCampaign||"").slice(0,45);
  }
 }else if(source!=="internal"||utmSource||utmCampaign){
  sessionStorage.setItem(key,JSON.stringify({entrySource:source,referrer,utmSource,utmMedium,utmCampaign,at:Date.now()}));
 }
}catch{}
let visitor="",firstSeen="",persistent=false;
try{if(navigator.globalPrivacyControl!==true&&navigator.doNotTrack!=="1"){
visitor=localStorage.getItem("arcade-visitor-v2")||"";
firstSeen=localStorage.getItem("arcade-visitor-day-v2")||"";
if(!/^[0-9a-f-]{20,64}$/i.test(visitor)){visitor=globalThis.crypto?.randomUUID?.()||"";firstSeen=day;localStorage.setItem("arcade-visitor-v2",visitor);localStorage.setItem("arcade-visitor-day-v2",firstSeen);}
persistent=!!visitor;
}}catch{}
const eventCounts={starts:0,ends:0,abandons:0,retries:0,shares:0,clicks:0,completion:0};
const lastSent={starts:0,ends:0,abandons:0,retries:0,shares:0,clicks:0,completion:0};
const signalCounts=Object.create(null),lastSignals=Object.create(null);
function signal(id){if(!/^[a-z0-9_-]{2,40}$/.test(id))return;signalCounts[id]=(signalCounts[id]||0)+1;}
let firstMs=-1,firstMsSent=false,level=0,score=0,lastClock=performance.now(),closed=false,flushSeq=0;
let bondEntryAwaitingFirstBattle=false,townFirstBuildSeen=false;
// Per-page new-player funnel (aggregate only; no individual click trail).
// Enter -> first run -> first finished attempt -> replay a finished attempt.
let firstRunStarted=false,firstRunFinished=false,firstReplaySeen=false;
function event(eventName,p={}){const n=String(eventName||"").toLowerCase();
const beginsRun=game==="cat-bond"?n==="bond_entered":
 game==="tiny-town"?["town_charter_wonder","town_charter_care","town_charter_dream","game_retry"].includes(n):
 n==="run_start"||n==="game_start";
const finishesRun=["run_end","game_complete","game_over","level_complete","town_completed-win","town_completed-lose"].includes(n);
if(beginsRun){
 if(!firstRunStarted){firstRunStarted=true;signal("funnel_first_run");}
 else if(firstRunFinished&&!firstReplaySeen){firstReplaySeen=true;signal("funnel_replay_after_finish");}
}
if(finishesRun&&firstRunStarted&&!firstRunFinished){firstRunFinished=true;signal("funnel_first_finish");}

// Count a deliberate entry into an interactive game as its start, not a later
// combat/building milestone. Battle attempts and fresh-town replays are still
// counted as further runs, without counting the first battle twice.
if(game==="cat-bond"&&n==="bond_entered"){
 eventCounts.starts++;
 bondEntryAwaitingFirstBattle=true;
}
if(game==="tiny-town"&&(n==="town_charter_wonder"||n==="town_charter_care"||n==="town_charter_dream"||n==="game_retry")){
 eventCounts.starts++;
 townFirstBuildSeen=false;
}
if(n==="run_start"||n==="game_start"||n==="town_started"||n==="town_started-game"){
 if(game==="cat-bond"&&n==="game_start"&&bondEntryAwaitingFirstBattle){
  bondEntryAwaitingFirstBattle=false; // The first battle belongs to the entered run.
 }else if(game==="tiny-town"&&(n==="town_started"||n==="town_started-game")){
  if(!townFirstBuildSeen){signal("town_first_build");townFirstBuildSeen=true;}
 }else eventCounts.starts++;
}
if(["run_end","game_complete","game_over","level_complete","town_completed-win","town_completed-lose"].includes(n))eventCounts.ends++;
if(n==="run_abandoned")eventCounts.abandons++;
if(n.includes("instant_replay")||n.includes("retry")||n.includes("restart")||n==="town_replayed")eventCounts.retries++;
if(["share_click","share_clicked","shared-link","town_shared-link"].includes(n))eventCounts.shares++;
if(n==="next_game_click"||n==="next_game_clicked"||n==="game_open")eventCounts.clicks++;
if(n==="level_complete"||n==="game_complete"||n==="town_completed-win"||n==="town_completed-lose"||(n==="run_end"&&Number(p?.won)===1))eventCounts.completion++;
if(n.startsWith("town_week-"))level=Math.max(level,Number(n.split("-").at(-1))||0);
if(Number.isFinite(Number(p?.level||p?.week)))level=Math.max(level,Number(p.level||p.week));
if(p?.score!==undefined&&Number.isFinite(Number(p.score)))score=Math.max(score,Math.min(10000000,Number(p.score)));
// Compact, aggregated gameplay milestones: no per-click database rows.
if(n==="cat_level_won"&&Number(p?.level)>=1&&Number(p?.level)<=9)signal("cat_room_"+Math.floor(Number(p.level)));
if(n==="cat_caught")signal("cat_caught");
if(n==="cat_fish")signal("cat_fish");
if(n==="bond_entered")signal("bond_enter");
if(n==="bond_starter_chosen")signal("bond_starter");
if(n==="bond_wild_spawned")signal("bond_wild_spawn");
if(n==="bond_first_wild_found")signal("bond_wild_found");
if(n==="bond_first_capture")signal("bond_first_capture");
if(n==="bond_continue_search")signal("bond_continue");
if(n==="bond_battle_grade"&&["S","A","B","C"].includes(p?.grade))signal("bond_grade_"+p.grade.toLowerCase());
if(n==="bond_mastery_unlocked")signal("bond_mastery_medal");
if(n==="bond_repeat_reunion")signal("bond_reunion");
if(n==="cat_souvenir")signal("cat_souvenir");
if(n==="town_first-club")signal("town_club");
if(n==="town_second-wish")signal("town_second_wish");
if(n==="town_combo_found")signal("town_combo_discovered");
if(n==="town_epic_wonder")signal("town_epic_wonder");
if(n==="town_free_day")signal("town_free_day");
if(/^town_free_(sea|mountain|train|stars|festival|meadow|rest)$/.test(n))signal(n);
if(/^town_ending_(cat|sky|party|calm|art|chaos)$/.test(n))signal(n);
if(n==="town_city_mutation")signal("town_city_mutation");
if(n==="town_petition_met")signal("town_petition_met");
if(n==="town_petition_missed")signal("town_petition_missed");
if(n==="town_social_crisis")signal("town_social_crisis");
if(n==="town_building_moved")signal("town_building_moved");
if(["town_charter_wonder","town_charter_care","town_charter_dream"].includes(n))signal(n.replaceAll("-","_"));
if(n==="town_completed-win")signal("town_win");
if(n==="town_completed-lose")signal("town_lose");
if(n.startsWith("town_feedback-")){const v=n.slice(14);if(["fun","confusing","not-fun"].includes(v))signal("town_feedback_"+v);}
if(["play_feedback_fun","play_feedback_confusing","play_feedback_not_fun"].includes(n))signal(n);
if(["elsewhere_return_yes","elsewhere_return_maybe","elsewhere_return_no"].includes(n))signal(n);
if(/^town_exit-week-[1-8]$/.test(n))signal(n.replaceAll("-","_"));
if(["feed_success","feed_drop"].includes(n)&&game==="pocket-aquarium")signal(n);
if(n==="game_complete"&&game==="pocket-aquarium"){signal("aquarium_completed");const outcome=String(p?.ending||"");if(["festival","clear","friends","rest","calm"].includes(outcome))signal("aquarium_ending_"+outcome);const grade=String(p?.grade||"").toUpperCase();if(["S","A","B","C","D"].includes(grade))signal("aquarium_grade_"+grade.toLowerCase());if(p?.reason==="dirty")signal("aquarium_dirty_end");}
if(game==="flip-dash"&&(n==="run_end"||n==="game_over")){signal("flip_finished");const duration=Number(p?.duration)||0;if(duration>=10)signal("flip_10s");if(duration>=30)signal("flip_30s");}
if(game==="parcel-panic"){if(n==="parcel_sorted")signal("parcel_sorted");if(n==="parcel_missed")signal("parcel_missed");if(n==="parcel_ten_sorted")signal("parcel_ten_sorted");}
// Start/end/replay are essential: persist immediately instead of waiting for
// pagehide, which is unreliable on mobile and inside game portal iframes.
if(["run_start","run_abandoned","game_start","run_end","game_complete","game_over","level_complete","town_completed-win","town_completed-lose","town_started","town_started-game","game_retry","bond_entered","town_charter_wonder","town_charter_care","town_charter_dream"].includes(n)||n.startsWith("play_feedback_")||n.startsWith("town_feedback-")||n.startsWith("elsewhere_return_"))flush(true);
}
window.arcadeMetric=event;
const onFirstAction=()=>{if(firstMs<0)firstMs=Math.round(performance.now()-start);};
window.addEventListener("pointerdown",onFirstAction,{once:true,passive:true});window.addEventListener("keydown",onFirstAction,{once:true,passive:true});
document.addEventListener("click",e=>{
 const link=e.target?.closest?.("a[href]");
 if(!link)return;
 event("game_open");
 if(game!=="hub")return;
 const dest=String(link.dataset?.id||"");
 if(!allowed.has(dest)||!link.closest(".feature-card,.mini-game"))return;
 signal("hub_card_"+dest.replaceAll("-","_"));
 flush(true);
},true);
const shared={game,site,viewId,visitor,firstSeen,source,referrer,utmSource,utmMedium,utmCampaign};
function send(data){if(disabled)return;try{
 const body=JSON.stringify({...shared,...data}),blob=new Blob([body],{type:"text/plain;charset=UTF-8"});
 // Foreground events should be requested immediately. sendBeacon is most
 // useful when a page is being hidden/unloaded, not for every live event.
 if((document.visibilityState==="hidden"||closed)&&navigator.sendBeacon?.(collector,blob))return;
 fetch(collector,{method:"POST",headers:{"Content-Type":"text/plain"},mode:"cors",body,keepalive:true}).catch(()=>{
  // Fallback for transient network failure; the browser still owns delivery.
  try{navigator.sendBeacon?.(collector,blob)}catch{}
 });
}catch{}}
send({kind:"visit",hubClickVersion:game==="hub"?1:undefined});
function flush(force=false){if(closed)return;const now=performance.now(),deltaSec=Math.max(0,Math.round((now-lastClock)/1000)),dif={};
let changed=deltaSec>0;for(const k of Object.keys(eventCounts)){dif[k]=eventCounts[k]-lastSent[k];if(dif[k])changed=true;}
const signals={};for(const [k,v] of Object.entries(signalCounts)){const delta=v-(lastSignals[k]||0);if(delta>0){signals[k]=delta;changed=true;}}
if(!changed&&!force)return;
const hasAction=firstMs>=0&&!firstMsSent;
send({kind:"session",seq:flushSeq++,seconds:deltaSec,firstMs:hasAction?firstMs:-1,...dif,signals,levels:level,score});
for(const k of Object.keys(eventCounts))lastSent[k]=eventCounts[k];for(const k of Object.keys(signals))lastSignals[k]=signalCounts[k];if(hasAction)firstMsSent=true;lastClock=now;
}
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")flush();else lastClock=performance.now();});
window.addEventListener("pagehide",()=>{
 // The mini games are endless; leaving before game-over is abandonment, not a clear.
 if((game==="flip-dash"||game==="parcel-panic")&&window.__MWMiniActive){window.__MWMiniActive=false;event("run_abandoned",{reason:"exit"});}
 flush(true);closed=true;
});
window.addEventListener("pageshow",e=>{if(e.persisted){closed=false;lastClock=performance.now();}});
 // Keep engaged sessions visible during long mobile play without per-click writes.
 setInterval(()=>{if(!closed&&document.visibilityState==="visible")flush()},60000);
})();