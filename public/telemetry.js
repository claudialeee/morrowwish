(()=>{"use strict";
const allowed=new Set(["flip-dash","parcel-panic","tower-tuck","traffic-tangle","tiny-town","echo-heist","elsewhere","pocket-aquarium","meowhem"]);
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
let visitor="",firstSeen="",persistent=false;
try{if(navigator.globalPrivacyControl!==true&&navigator.doNotTrack!=="1"){
visitor=localStorage.getItem("arcade-visitor-v2")||"";
firstSeen=localStorage.getItem("arcade-visitor-day-v2")||"";
if(!/^[0-9a-f-]{20,64}$/i.test(visitor)){visitor=globalThis.crypto?.randomUUID?.()||"";firstSeen=day;localStorage.setItem("arcade-visitor-v2",visitor);localStorage.setItem("arcade-visitor-day-v2",firstSeen);}
persistent=!!visitor;
}}catch{}
const eventCounts={starts:0,ends:0,retries:0,shares:0,clicks:0,completion:0};
const lastSent={starts:0,ends:0,retries:0,shares:0,clicks:0,completion:0};
let firstMs=-1,firstMsSent=false,level=0,score=0,lastClock=performance.now(),closed=false,flushSeq=0;
function event(eventName,p={}){const n=String(eventName||"").toLowerCase();
if(n==="run_start"||n==="game_start"||n==="town_started"||n==="town_started-game")eventCounts.starts++;
if(n==="run_end"||n==="game_complete"||n==="game_over"||n.startsWith("town_duration-"))eventCounts.ends++;
if(n.includes("instant_replay")||n.includes("retry")||n.includes("restart")||n==="town_replayed")eventCounts.retries++;
if(["share_click","share_clicked","shared-link","town_shared-link"].includes(n))eventCounts.shares++;
if(n==="next_game_click"||n==="next_game_clicked"||n==="game_open")eventCounts.clicks++;
if(n==="level_complete"||n==="game_complete"||n.startsWith("town_grade-")||n.startsWith("town_grade"))eventCounts.completion++;
if(n.startsWith("town_week-"))level=Math.max(level,Number(n.split("-").at(-1))||0);
if(Number.isFinite(Number(p?.level||p?.week)))level=Math.max(level,Number(p.level||p.week));
if(p?.score!==undefined&&Number.isFinite(Number(p.score)))score=Math.max(score,Math.min(10000000,Number(p.score)));
}
window.arcadeMetric=event;
const onFirstAction=()=>{if(firstMs<0)firstMs=Math.round(performance.now()-start);};
window.addEventListener("pointerdown",onFirstAction,{once:true,passive:true});window.addEventListener("keydown",onFirstAction,{once:true,passive:true});
document.addEventListener("click",e=>{if(e.target?.closest?.("a[href]"))event("game_open");},true);
const shared={game,site,viewId,visitor,firstSeen,source,referrer,utmSource,utmMedium,utmCampaign};
function send(data){if(disabled)return;try{const body=JSON.stringify({...shared,...data});const blob=new Blob([body],{type:"text/plain;charset=UTF-8"});if(navigator.sendBeacon&&navigator.sendBeacon(collector,blob))return;fetch(collector,{method:"POST",headers:{"Content-Type":"text/plain"},mode:"cors",body,keepalive:true}).catch(()=>{});}catch{}}
send({kind:"visit"});
function flush(force=false){if(closed)return;const now=performance.now(),deltaSec=Math.max(0,Math.round((now-lastClock)/1000)),dif={};
let changed=deltaSec>0;for(const k of Object.keys(eventCounts)){dif[k]=eventCounts[k]-lastSent[k];if(dif[k])changed=true;}
if(!changed&&!force)return;
const hasAction=firstMs>=0&&!firstMsSent;
send({kind:"session",seq:flushSeq++,seconds:deltaSec,firstMs:hasAction?firstMs:-1,...dif,levels:level,score});
for(const k of Object.keys(eventCounts))lastSent[k]=eventCounts[k];if(hasAction)firstMsSent=true;lastClock=now;
}
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")flush();});
window.addEventListener("pagehide",()=>{flush(true);closed=true;});
window.addEventListener("pageshow",e=>{if(e.persisted){closed=false;lastClock=performance.now();}});
})();