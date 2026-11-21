/* Elsewhere — Casefiles v3. Short coherent thrillers, real consequences, and earned endings. */
(()=>{"use strict";
const L=(zh,en)=>[zh,en];
const CASES=window.ELSEWHERE_CASEFILES||{};
const META=[
 {id:"amalfi",name:L("继承阿马尔菲海岸的豪宅","An Amalfi Villa Is Yours"),place:L("意大利 · 阿马尔菲","ITALY · AMALFI"),tag:L("奢华 · 反转","LUXURY · REVERSAL"),color:"#cf7c51"},
 {id:"paris",name:L("巴黎恋爱，卷入名画失窃案","Love and Art Theft in Paris"),place:L("法国 · 巴黎","FRANCE · PARIS"),tag:L("浪漫 · 悬疑","ROMANCE · MYSTERY"),color:"#be7591"},
 {id:"tokyo",name:L("今晚，夺回你的巨星人生","Take Back Your Superstar Life"),place:L("日本 · 东京","JAPAN · TOKYO"),tag:L("巨星 · 逆袭","STARDOM · COMEBACK"),color:"#8e70c8"},
 {id:"iceland",name:L("极光之夜，收到失踪者的求救","An SOS Beneath the Aurora"),place:L("冰岛 · 极光之夜","ICELAND · NORTHERN LIGHTS"),tag:L("极光 · 惊险","AURORA · THRILLER"),color:"#568f99"},
 {id:"maldives",name:L("一觉醒来，继承私人海岛","You Wake Up Owning an Island"),place:L("马尔代夫 · 私人海岛","MALDIVES · PRIVATE ISLAND"),tag:L("海岛 · 反击","PARADISE · COMEBACK"),color:"#4c9e9b"},
 {id:"swiss",name:L("雪山豪华列车的秘密拍卖","A Secret Auction on the Alpine Express"),place:L("瑞士 · 阿尔卑斯山","SWITZERLAND · THE ALPS"),tag:L("豪华列车 · 悬疑","LUXURY TRAIN · MYSTERY"),color:"#7495c0"}
];
const NEW_TITLES={
 amalfi:{name:L("阿马尔菲豪宅：我的富豪人生","The Amalfi Villa Life"),tag:L("豪宅 · 爽文","LUXURY · COMEBACK")},
 paris:{name:L("巴黎：和旧爱再爱一次","Love Again in Paris"),tag:L("浪漫 · 重逢","ROMANCE · REUNION")},
 tokyo:{name:L("今夜我是东京超级巨星","Tonight, I'm Tokyo's Superstar"),tag:L("巨星 · 逆袭","STARDOM · COMEBACK")},
 iceland:{name:L("极光下的温柔奇迹","A Night of Aurora and Wonder"),tag:L("治愈 · 心动","WONDER · ROMANCE")},
 maldives:{name:L("继承一座会航行的私人海岛","My Floating Private Island"),tag:L("奢华 · 离谱","LUXURY · WILD")},
 swiss:{name:L("雪山列车：离谱奢华的一夜","The Wild Luxury Alpine Express"),tag:L("荒诞 · 奇遇","SPECTACLE · ADVENTURE")}
};
for(const meta of META)Object.assign(meta,NEW_TITLES[meta.id]||{});
for(const meta of META)if(!CASES[meta.id])throw Error("Missing Elsewhere casefile: "+meta.id);
const Q={
 hero:L("换一段人生，亲手改写结局。","A new life. A story only you can change."),
 intro:L("先过上梦寐以求的生活，再揭开一个不得不面对的秘密。你做的决定会留下真实后果。","Wake up in a life you once dreamed of. Uncover its secret—and live with the consequences."),
 random:L("随机开启一段人生","Surprise me"),explore:L("选择人生","Choose your life"),
 tiny:L("六段冒险 · 每局五幕 · 结局由你争取","6 ADVENTURES · 5 MOMENTS EACH · EARN YOUR ENDING"),
 gallery:L("结局收藏","Endings discovered"),saved:L("已解锁","discovered"),none:L("你的第一段故事，还没有开始。","Your first case is waiting."),
 home:L("其他人生","All lives"),choice:L("你准备怎么做？","WHAT WILL YOU DO?"),
 proof:L("证据","Evidence"),allies:L("支援","Allies"),leverage:L("筹码","Leverage"),
 stake:L("本次目标","YOUR MISSION"),next:L("继续调查","Continue"),endingNext:L("看看你的结局","Reveal the outcome"),
 reveal:L("揭开真相","Reveal the truth"),sealed:L("刚找到的线索，将在下一刻改写整件事。","What you've found is about to change everything."),
 twist:L("关键反转","THE REVEAL"),result:L("你的行动带来的后果","WHAT YOUR ACTION CHANGED"),
 prior:L("上一幕，你成功做到","LAST TIME YOU"),secret:L("隐藏证据已收集","Hidden evidence secured"),
 findSecret:L("发现一份隐藏证据","Find hidden evidence"),
 ending:L("这一生，你改变了什么？","WHAT DID YOU ACTUALLY CHANGE?"),
 earned:L("成果报告","YOUR CASE REPORT"),strong:L("漂亮逆转","A decisive win"),cost:L("险中争取到一线机会","A narrow victory"),perfect:L("完美反击","A perfect reversal"),
 missingProof:L("公开的材料还不够完整。你迫使对方暂停行动，但后续仍需补齐证据。","Your evidence was incomplete. You forced a pause, but must finish the investigation."),
 missingAllies:L("你争取到公开谈判的机会，但支持者还不够多。下一步需要更多人站出来。","You won a public hearing, but not enough people stood with you. More support is needed."),
 missingLeverage:L("对手暂时让步，但你的实际控制权还不足以让他们彻底退出。","The opponent backs down for now, but you lack the leverage to keep them out for good."),
 strongBecause:L("你的准备足够充分，最终一击真正奏效。","Your earlier decisions gave your final move real force."),
 perfectBecause:L("你找到隐藏证据、建立了盟友，也有足够的调查材料，一举逆转局面。","You found the hidden evidence, built an alliance, and brought proof strong enough to turn everything around."),
 recap:L("关键行动","DECISIVE ACTIONS"),replay:L("换一种打法","Try another approach"),
 another:L("体验另一段人生","Another life"),share:L("分享结局","Share this ending"),
 galleryNote:L("只记录这一版真实解锁的结局。","Only outcomes earned in this edition are counted."),
 collected:L("收藏了一张结局明信片","ENDING POSTCARD UNLOCKED"),partialDesc:L("你拖住了对方，但这次还不足以让他们彻底认输。","You stopped them for now, but the case is not fully won."),notCollected:L("再多一点线索，你就能彻底逆转","Find more evidence to earn a decisive ending"),goal:L("最后选择对应的证据、支援或筹码，累计至少 2 项才能彻底获胜","Your final action needs at least 2 in its resource to succeed decisively")
};
Object.assign(Q,{
 hero:L("醒来，活一种舍不得结束的人生。","Wake up to a life too good to end."),
 intro:L("在巴黎开启全新恋情，住进海边豪宅享受自由，也可以成为万人追捧的巨星。换一段人生，尽情去活。","Fall in love for the first time in Paris, enjoy your own Amalfi villa, or live as a superstar. A new life is yours."),
 tiny:L("六种人生 · 五个精彩瞬间 · 24 种结局","6 DREAM LIVES · 5 MOMENTS · 24 ENDINGS"),
 choice:L("接下来，你想怎么活？","WHAT HAPPENS NEXT?"),
 stake:L("这一生的心愿","THE LIFE YOU WANT"),
 next:L("接下来会怎样","See what happens next"),
 endingNext:L("揭晓这一生","See how it ends"),
 reveal:L("迎接惊喜","See the surprise"),
 sealed:L("你以为今天已经够精彩了……","You thought this day couldn't get any better..."),
 twist:L("意想不到的下一幕","THE UNEXPECTED TURN"),
 result:L("这一刻，发生了什么","WHAT HAPPENED NEXT"),
 prior:L("刚才，你做到了","YOU MADE THIS HAPPEN"),
 secret:L("隐藏惊喜已发现","Hidden surprise discovered"),
 findSecret:L("发现隐藏彩蛋","Find a hidden surprise"),
 ending:L("这一生，你活成了什么样？","WHAT KIND OF LIFE DID YOU LIVE?"),
 earned:L("你的高光时刻","YOUR HIGHLIGHTS"),
 strong:L("精彩人生","A Life Worth Living"),
 cost:L("还差一口气","Not Quite There"),
 perfect:L("传奇人生","A Legendary Life"),
 recap:L("你亲手创造的瞬间","MOMENTS YOU CREATED"),
 replay:L("换条路再活一次","Live it differently"),
 galleryNote:L("每段人生都有四种结局，换条路还有新惊喜。","Each life has four endings, with new surprises on other paths."),
 collected:L("你解锁了这一生的结局","ENDING UNLOCKED")
});
let lang=(()=>{const q=new URLSearchParams(location.search).get("lang");if(q==="zh"||q==="en"){try{localStorage.setItem("morrowwish.language",q)}catch{}return q}
try{const x=localStorage.getItem("morrowwish.language");if(x==="zh"||x==="en")return x}catch{}return navigator.language?.toLowerCase().startsWith("zh")?"zh":"en"})();
const T=v=>Array.isArray(v)?v[lang==="zh"?0:1]:v;
const esc=s=>String(s??"").replace(/[&<>"']/g,x=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[x]));
const Qe=k=>esc(T(Q[k])), $=s=>document.querySelector(s);
const STORAGE="elsewhere_life_gallery_v4";
let gallery=(()=>{try{return JSON.parse(localStorage.getItem(STORAGE)||"{}")}catch{return {}}})();
if(!gallery||typeof gallery!=="object"||Array.isArray(gallery))gallery={};
let state=null,lastWorld=null;
const uid=()=>globalThis.crypto?.randomUUID?.()||String(Date.now())+Math.random().toString(36).slice(2);
const tracked=()=>navigator.globalPrivacyControl!==true&&navigator.doNotTrack!=="1";
const visitor=(()=>{if(!tracked())return "";try{return localStorage.getItem("arcade-visitor-v2")||uid()}catch{return ""}})();
function track(event,data={}){
 if(!tracked())return;
 if(event==="world_open")window.arcadeMetric?.("game_start");
 if(event==="life_completed")window.arcadeMetric?.("game_complete");
 if(event==="life_restarted")window.arcadeMetric?.("retry");
 if(event==="share_clicked")window.arcadeMetric?.("share_clicked");
 const payload={event,world:state?.id||"",edition:"life-v4",scenes:5,visitor,runId:state?.runId||"",session:state?.session||"",...data};
 if(!visitor)return;
 try{
  const body=JSON.stringify(payload);
  if(!navigator.sendBeacon?.("/api/elsewhere-collect",new Blob([body],{type:"text/plain;charset=UTF-8"})))
   fetch("/api/elsewhere-collect",{method:"POST",headers:{"Content-Type":"text/plain"},body,keepalive:true}).catch(()=>{});
 }catch{}
}
const story=id=>CASES[id],meta=id=>META.find(x=>x.id===id);
const types=["proof","allies","leverage"];
function node(){
 if(!state)return null;
 const c=story(state.id);
 if(state.stage===0)return c.intro;
 if(state.stage===4)return c.finale;
 return c.paths[state.route][state.stage-1];
}
function isDream(id=state?.id){return story(id)?.mode!=="comeback"}
function localResource(kind){return window.ELSEWHERE_VIBES?.[state?.id]?.stats?.[kind]||Q[kind]}
function resolve(){
 if(!state||state.history.length!==5)return null;
 const last=state.history[4],kind=last.gain,n=types.indexOf(kind),dream=isDream();
 const rare=state.secret&&(state.id==="amalfi"||state.id==="paris"||(state.scores.proof>=2&&state.scores.allies>=2&&(dream||n===0)));
 const quality=rare?"perfect":dream?"strong":state.scores[kind]>=2?"strong":"cost";
 const entry=rare?story(state.id).rare:story(state.id).endings[n];
 const vibe=window.ELSEWHERE_VIBES?.[state.id];
 const detail=quality==="cost"?Q["missing"+kind[0].toUpperCase()+kind.slice(1)]:quality==="perfect"?(vibe?.rare||Q.perfectBecause):(vibe?.quality||Q.strongBecause);
 return {n:rare?3:n,kind,quality,entry,detail};
}
function badge(kind){
 return '<span class="case-gain '+kind+'">'+esc(T(localResource(kind)))+(["amalfi","paris"].includes(state?.id)?"":" +1")+'</span>';
}
function counters(){
 if(["amalfi","paris"].includes(state?.id))return "";
 return '<div class="case-resources" aria-label="'+(lang==="zh"?"人生收获":"Life experiences")+'">'+types.map(t=>'<span>'+esc(T(localResource(t)))+' <b>'+state.scores[t]+'</b></span>').join("")+'</div>';
}
function closeToTop(){window.scrollTo({top:0,behavior:"instant"})}
const sky=(a,b)=>'<defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="'+a+'"/><stop offset="1" stop-color="'+b+'"/></linearGradient><linearGradient id="sea" x2="0" y2="1"><stop stop-color="#71d5d5"/><stop offset="1" stop-color="#196f9c"/></linearGradient><filter id="glow"><feGaussianBlur stdDeviation="22"/></filter></defs><rect width="900" height="540" fill="url(#sky)"/>';
function art(id){
 let s="",defs="";
 const mount=(x,y,w,h,c)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="'+c+'"/>';
 const windowGrid=(x,y,c)=>Array.from({length:c},(_,i)=>'<rect x="'+(x+(i%3)*19)+'" y="'+(y+Math.floor(i/3)*28)+'" width="11" height="17" rx="2" fill="#f9e7bd"/>').join("");
 if(id==="amalfi"){
 defs=sky("#a67cbf","#ffd6a3");
 s='<circle cx="709" cy="137" r="69" fill="#fff1bd"/><path d="M0 270Q170 176 344 241T900 220V540H0Z" fill="#608f9b"/><path d="M0 337Q225 273 432 351T900 310V540H0Z" fill="#2b819d"/><path d="M0 404Q255 368 433 404T900 385V540H0Z" fill="#1884aa"/><path d="M0 540V195Q93 168 167 216T380 178L455 540Z" fill="#4c7582"/>';
 for(let i=0;i<11;i++){let x=14+(i*31)%380,y=172+Math.floor(i/4)*60;s+='<rect x="'+x+'" y="'+y+'" width="54" height="74" rx="4" fill="'+["#ffdec8","#f9c8ac","#f0dacd"][i%3]+'"/><path d="M'+(x-4)+' '+y+'l31-30 31 30" fill="#b88289"/>'+windowGrid(x+6,y+15,3);}
 s+='<path d="M0 462Q220 419 460 471T900 441V540H0Z" fill="#c9ae93"/><path d="M0 491H900" stroke="#e8d1b0" stroke-width="14"/><path d="M40 540V357M223 540V357" stroke="#ffdfc2" stroke-width="24"/><path d="M13 354q113-85 237 0" fill="none" stroke="#ffdfc2" stroke-width="25"/><circle cx="315" cy="394" r="36" fill="#f5cbb2"/><path d="M260 447q48-43 100 0v65H260z" fill="#fff4e6"/><g fill="#d25587">'+Array.from({length:13},(_,i)=>'<circle cx="'+(38+(i*37)%850)+'" cy="'+(450+(i*17)%60)+'" r="'+(9+i%3*4)+'"/>').join("")+'</g><g fill="#f1d15e">'+Array.from({length:9},(_,i)=>'<circle cx="'+(55+i*42)+'" cy="'+(340+(i%2)*29)+'" r="12"/>').join("")+'</g>';
 }else if(id==="paris"){
 defs=sky("#957eb2","#ffd3c6");
 s='<circle cx="737" cy="116" r="58" fill="#fff1cc"/><path d="M0 300L91 255l74 33 66-86 85 85 101-30 85 40 65-59 93 30 108-60 132 45V540H0Z" fill="#a482aa"/>';
 for(let i=0;i<10;i++){let x=i*100-20,y=263+(i%3)*31;s+='<rect x="'+x+'" y="'+y+'" width="106" height="'+(540-y)+'" fill="'+["#d9adad","#ba94a2","#efc5bb"][i%3]+'"/><path d="M'+(x-5)+' '+y+'l60-49 60 49" fill="#8b718e"/>'+windowGrid(x+18,y+29,9);}
 s+='<path d="M580 357l49-236 45 236M599 263h56M610 207h34" stroke="#6c5a78" stroke-width="10" fill="none"/><rect x="39" y="331" width="290" height="116" rx="17" fill="#842f5e"/><path d="M27 342h315" stroke="#eaa4af" stroke-width="26" stroke-dasharray="27 15"/><rect x="92" y="414" width="141" height="13" rx="4" fill="#e6be9e"/><path d="M159 425v89" stroke="#f6d4b1" stroke-width="12"/><path d="M0 492q350-47 900 0v48H0Z" fill="#b78c9b"/><g fill="#f6c4bf">'+Array.from({length:11},(_,i)=>'<circle cx="'+(i*93+18)+'" cy="'+(480+(i%2)*14)+'" r="'+(8+i%3*3)+'"/>').join("")+'</g><path d="M39 86Q300 169 580 75" stroke="#fff4c9" stroke-width="3" fill="none" stroke-dasharray="2 18"/>';
 }else if(id==="tokyo"){
 defs=sky("#201b4d","#bd5fa1");
 s='<circle cx="733" cy="105" r="64" fill="#ffc0e9" opacity=".55" filter="url(#glow)"/><path d="M0 317L43 260h85v-93h86v128h73v-175h101v155h91v-145h105v142h92v-90h103v130h120V540H0Z" fill="#292958"/>';
 for(let i=0;i<21;i++){let x=10+i*42,y=176+(i%4)*25;s+='<rect x="'+x+'" y="'+y+'" width="22" height="13" rx="2" fill="'+(i%2?"#eb84ff":"#6de6ed")+'" opacity=".85"/>';}
 s+='<path d="M320 38L442 340H277Z" fill="#ec78d1" opacity=".23"/><path d="M720 20L461 345H604Z" fill="#8effd8" opacity=".23"/><path d="M0 384Q450 340 900 385V540H0Z" fill="#1d1d49"/><rect x="188" y="324" width="525" height="87" rx="9" fill="#c653ba"/><rect x="221" y="339" width="460" height="53" fill="#392352"/><path d="M0 478h900" stroke="#e578d1" stroke-width="16"/><g fill="#171837">'+Array.from({length:44},(_,i)=>'<circle cx="'+(i*53%902)+'" cy="'+(460+(i*19%73))+'" r="'+(13+i%3*3)+'"/>').join("")+'</g><path d="M405 398v-108m-32 121l32-43 29 43" stroke="#ffe2b8" stroke-width="15" stroke-linecap="round"/><circle cx="405" cy="268" r="26" fill="#ffe2b8"/><path d="M377 259q27-46 53-1" stroke="#2a2647" stroke-width="19"/>';
 }else if(id==="iceland"){
 defs=sky("#172d52","#6989a8");
 s='<path d="M0 175Q203-29 398 157T900 68" stroke="#66ffca" stroke-width="80" opacity=".34" fill="none"/><path d="M0 80Q270 239 490 40T900 110" stroke="#c88fff" stroke-width="65" opacity=".32" fill="none"/><path d="M0 359l152-173 123 103 152-173 167 205 168-159 138 150v228H0Z" fill="#b4d2d4"/><path d="M0 402l190-118 121 131 179-171 155 179 132-123 123 97v143H0Z" fill="#5b899e"/><path d="M0 457q260-45 463 12t437-18v89H0Z" fill="#e0e9e7"/><path d="M454 459V317l130-92 147 92v142Z" fill="#334f64"/><path d="M436 318l147-111 169 111" fill="#f1e4d3"/><rect x="515" y="340" width="155" height="102" fill="#f2bd82"/><path d="M592 336v110" stroke="#466076" stroke-width="12"/><circle cx="778" cy="149" r="5" fill="#fff"/><g fill="#fff">'+Array.from({length:23},(_,i)=>'<circle cx="'+(i*137%890)+'" cy="'+(i*83%215)+'" r="'+(i%2+2)+'"/>').join("")+'</g>';
 }else if(id==="maldives"){
 defs=sky("#7ad7e1","#fff3cb");
 s='<circle cx="761" cy="105" r="63" fill="#fff6bd"/><path d="M0 280Q250 249 480 286T900 262V540H0Z" fill="url(#sea)"/><path d="M0 364Q230 343 446 378T900 346" stroke="#c4fff0" stroke-width="10" fill="none"/><path d="M0 439Q220 418 500 450T900 416" stroke="#9de9e0" stroke-width="9" fill="none"/><path d="M0 507Q255 478 531 511T900 479" stroke="#c0f4e6" stroke-width="7" fill="none"/><path d="M0 540V385q143-53 255 0v155Z" fill="#f9e6b2"/><rect x="326" y="310" width="277" height="108" rx="10" fill="#f8d9aa"/><path d="M300 316l158-105 169 105Z" fill="#bd956f"/><path d="M358 414v126m215-126v126" stroke="#8d6e63" stroke-width="16"/><rect x="414" y="340" width="111" height="73" rx="9" fill="#78bac0"/><path d="M457 340v74" stroke="#f9dfb7" stroke-width="10"/><path d="M130 420Q200 255 233 193" stroke="#926956" stroke-width="25" fill="none"/><path d="M234 195q-150-74-203-7m203 7q-53-118 45-140m-45 140q116-104 150-39m-150 39q148 4 156 89" stroke="#3eaa87" stroke-width="32" fill="none" stroke-linecap="round"/><path d="M220 447h680" stroke="#f0dfbf" stroke-width="17"/>';
 }else if(id==="swiss"){
 defs=sky("#84bbdc","#fff1d5");
 s='<circle cx="733" cy="112" r="67" fill="#fff6c6"/><path d="M0 384L151 140l105 145 148-215 172 274 124-218 200 259v155H0Z" fill="#dce9ec"/><path d="M0 411l180-200 99 144 125-212 165 229 127-176 204 224v120H0Z" fill="#7aa4b5"/><path d="M0 450Q240 386 430 442T900 410V540H0Z" fill="#8ab6a7"/><path d="M0 490q270-51 510-3t390-33v86H0Z" fill="#577e83"/><path d="M40 381q370-30 820-56" fill="none" stroke="#735e62" stroke-width="31"/><path d="M40 381q370-30 820-56" fill="none" stroke="#e6d6c3" stroke-width="10"/><path d="M156 362L235 302h404l84 44v56H156Z" fill="#ab4047"/><rect x="232" y="322" width="385" height="42" fill="#f1c57f"/><g fill="#416a86">'+Array.from({length:7},(_,i)=>'<rect x="'+(244+i*55)+'" y="327" width="40" height="28" rx="4"/>').join("")+'</g><path d="M156 399h567" stroke="#593f52" stroke-width="19"/><path d="M0 520q260-58 540-8t360-19" fill="none" stroke="#a9d2a5" stroke-width="18"/>';
 }
 const unique=(defs+s).replaceAll('id="sky"','id="sky-'+id+'"').replaceAll("url(#sky)","url(#sky-"+id+")").replaceAll('id="sea"','id="sea-'+id+'"').replaceAll("url(#sea)","url(#sea-"+id+")");
 return '<svg class="dream-art" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 540" preserveAspectRatio="xMidYMid slice" aria-hidden="true">'+unique+'</svg>';
}

function renderHome(){
 state=null;window.DreamAudio?.setWorld("home");
 history.replaceState({}, "", "/elsewhere/"+(lang==="zh"?"?lang=zh":""));
 $("#home").hidden=false;$("#game").hidden=true;$("#ending").hidden=true;
 const unlocked=Object.values(gallery).filter(Array.isArray).reduce((n,v)=>n+v.length,0);
 $("#home").innerHTML='<div class="intro"><span class="kicker">ELSEWHERE · LIVE ANOTHER LIFE</span><h1>'+Qe("hero")+'</h1><p>'+Qe("intro")+'</p><div class="intro-actions"><button class="big-btn" data-random>'+Qe("random")+' ↗</button><a class="soft-link" href="#lives">'+Qe("explore")+' ↓</a></div><small>'+Qe("tiny")+'</small><div class="home-audio">'+(window.DreamAudio?.controls()||"")+'</div></div><div class="life-grid" id="lives">'+META.map(m=>'<button type="button" class="life-card" data-world="'+m.id+'" style="--accent:'+m.color+'"><div class="card-image">'+art(m.id)+'</div><span class="place">'+esc(T(m.place))+'</span><strong>'+esc(T(m.name))+'</strong><span class="tease">'+esc(T(story(m.id).mystery))+'</span><span class="card-foot">'+esc(T(m.tag))+' <b>↗</b></span></button>').join("")+'</div><section class="album"><div class="album-head"><h2>'+Qe("gallery")+'</h2><span>'+unlocked+' / 24 '+Qe("saved")+'</span></div><div class="album-cards">'+(unlocked?Object.entries(gallery).flatMap(([id,nums])=>(nums||[]).map(n=>{if(!story(id))return "";const end=n===3?story(id).rare:story(id).endings[n];return end?'<div class="album-card"><span>'+esc(T(meta(id).place))+'</span><strong>'+esc(T(end[0]))+'</strong></div>':""})).join(""):'<p>'+Qe("none")+'</p>')+'</div><p class="case-gallery-note">'+Qe("galleryNote")+'</p></section>';
 document.title=lang==="zh"?"平行人生 — Morrow Wish":"Elsewhere — Morrow Wish";window.DreamAudio?.sync();
}
function openWorld(id,retry=false,push=true){
 if(!story(id))return;
 lastWorld=id;
 state={id,route:null,stage:0,selected:null,history:[],scores:{proof:0,allies:0,leverage:0},secret:false,seen:{},revealed:{},completed:false,runId:uid(),session:uid()};
 window.DreamAudio?.setWorld(id);
 if(retry)track("life_restarted",{world:id});
 track("world_open",{world:id,resume:false});
 $("#home").hidden=true;$("#game").hidden=false;$("#ending").hidden=true;
 if(push)history.pushState({world:id},"","/elsewhere/?world="+encodeURIComponent(id)+(lang==="zh"?"&lang=zh":""));
 renderStage();closeToTop();document.title=T(meta(id).name)+" — Elsewhere";
}
function randomWorld(){
 const list=META.filter(x=>x.id!==lastWorld),chosen=list[Math.floor(Math.random()*list.length)]||META[0];
 openWorld(chosen.id);
}
function particles(){
 return '<div class="surprise-particles" aria-hidden="true">'+Array.from({length:16},(_,n)=>'<i style="--n:'+n+';--x:'+Math.round(Math.cos(n*2.4)*(90+n*9))+'px;--y:'+Math.round(Math.sin(n*2.4)*(90+n*8))+'px"></i>').join("")+'</div>';
}
function renderStage(){
 if(!state)return;
 const m=meta(state.id),s=node(),i=state.stage,dream=isDream(),isTwist=[2,4].includes(i),sealed=isTwist&&!state.revealed[i]&&state.selected===null;
 const result=state.selected===null?null:s.choices[state.selected];
 const prior=state.history[i-1],controls=window.DreamAudio?.controls()||"";
 const chapterBody=i===4&&s.routeBodies?.[state.route]?s.routeBodies[state.route]:s.body;
 const continuity=i>=2&&i<=3&&prior&&s.links?.[prior.index]?s.links[prior.index]:null;
 const clue=state.secret?'<span class="case-secret-found">'+Qe("secret")+' · '+esc(T(story(state.id).secret))+'</span>':'';
 const historyHint=prior?'<div class="case-previous"><b>'+Qe("prior")+'</b> <span>'+esc(T(prior.title))+'</span><em>'+esc(T(prior.result))+'</em></div>':'';
 const actions=sealed?
  '<div class="reveal-cta"><button class="big-btn" type="button" data-twist>'+Qe("reveal")+' ✧</button></div>':
  result?
   '<div class="impact"><span>'+Qe("result")+'</span><p>'+esc(T(result.result))+'</p>'+badge(result.gain)+'<button class="big-btn" type="button" data-continue>'+(i===4?Qe("endingNext"):Qe("next"))+' →</button></div>':
   '<div class="choices-label">'+Qe("choice")+'</div><div class="choices">'+s.choices.map((a,n)=>'<button class="choice" type="button" data-choice="'+n+'"><span class="choice-num">0'+(n+1)+'</span><strong>'+esc(T(a.title))+'</strong><span aria-hidden="true">↗</span>'+(i===4&&!dream?'<small class="case-demand '+(state.scores[a.gain]>=1?'is-ready':'is-short')+'">'+esc(T(localResource(a.gain)))+' '+(state.scores[a.gain]+1)+'/2</small>':'')+'</button>').join("")+'</div>';
 const cover=sealed?'<button class="twist-curtain" type="button" data-twist aria-label="'+Qe("reveal")+'"><span class="curtain-eye">✧</span><small>'+Qe("twist")+'</small><strong>'+Qe("reveal")+'</strong><span aria-hidden="true">↗</span></button>':'';
 const secretButton=!sealed&&i>=2?'<button class="secret-pin '+(state.secret?"is-found":"")+'" type="button" data-secret aria-label="'+Qe("findSecret")+'" title="'+Qe("findSecret")+'">✦</button>':'';
 const artTop='<div class="art-label"><span>'+esc(T(m.tag))+'</span><h2>'+esc(T(m.name))+'</h2></div>';
 const chapterLabels=[0,1,2,3,4].map(n=>'<span class="'+(n<i?"is-done":n===i?"is-current":"")+'"></span>').join("");
 $("#game").innerHTML='<div class="game-top"><button class="ghost-btn" type="button" data-home>← '+Qe("home")+'</button><span class="game-place">'+esc(T(m.place))+'</span><div class="game-tools"><span class="count">'+(i+1)+' / 5</span>'+controls+'</div></div><div class="scene '+(isTwist?'surprise-stage':'')+(sealed?' scene-sealed':'')+'" style="--world-accent:'+m.color+'"><div class="scene-picture" data-phase="'+i+'">'+art(m.id)+(isTwist?particles():"")+secretButton+artTop+cover+'</div><div class="scene-body"><div class="progress-track"><span style="width:'+((i+1)*20)+'%"></span></div><div class="moment-pips" aria-hidden="true">'+chapterLabels+'</div><div class="case-topline"><span class="scene-kicker">'+(i+1)+' / 05 · '+esc(T(window.ELSEWHERE_VIBES?.[state.id]?.genre||m.tag))+'</span>'+counters()+'</div><p class="case-objective"><b>'+Qe("stake")+'</b> '+esc(T(story(state.id).objective))+'</p><h2>'+esc(T(sealed?Q.twist:s.title))+'</h2>'+(!sealed?historyHint:"")+(!sealed&&continuity?'<p class="story-link">'+esc(T(continuity))+'</p>':"")+'<p class="story-line">'+esc(T(sealed?Q.sealed:chapterBody))+'</p>'+clue+(i===4&&!dream&&!sealed&&state.selected===null?'<p class="case-goal">'+Qe("goal")+'</p>':"")+actions+'</div></div>';
 window.DreamAudio?.sync();
 if(state.selected===null&&!state.seen[i]){state.seen[i]=true;track("chapter_view",{world:state.id,chapter:i+1})}
}
function revealTwist(){
 if(!state||![2,4].includes(state.stage)||state.revealed[state.stage])return;
 state.revealed[state.stage]=true;
 renderStage();
 const el=$("#game .scene");el?.classList.add("twist-burst");
 window.DreamAudio?.fx("twist");
 window.setTimeout(()=>el?.classList.remove("twist-burst"),1450);
}
function makeChoice(n){
 if(!state||state.selected!==null||(!state.revealed[state.stage]&&[2,4].includes(state.stage))||!Number.isInteger(n)||n<0||n>=3)return;
 const act=node().choices[n];
 if(!act)return;
 if(state.stage===0)state.route=n;
 state.selected=n;
 state.scores[act.gain]++;
 state.history.push({stage:state.stage,index:n,title:act.title,result:act.result,gain:act.gain});
 track("choice_made",{world:state.id,chapter:state.stage+1,choice:n+1,routeVector:state.history.map(c=>c.index+1).join("-")});
 track("chapter_completed",{world:state.id,chapter:state.stage+1});
 window.DreamAudio?.fx("select");renderStage();
}
function advance(){
 if(!state||state.selected===null)return;
 if(state.stage<4){state.stage++;state.selected=null;renderStage();closeToTop()}
 else finish();
}
function finish(){
 if(!state||state.history.length!==5)return;
 const m=meta(state.id),decision=resolve();
 const key=decision.kind,winning=decision.quality!=="cost";
 const copies=decision.quality==="perfect"?Qe("perfect"):decision.quality==="strong"?Qe("strong"):Qe("cost");
 const result=winning?T(decision.entry[1]):T(Q.partialDesc);
 const past=Array.isArray(gallery[state.id])?gallery[state.id]:[];
 if(winning&&!past.includes(decision.n)){gallery[state.id]=[...past,decision.n];try{localStorage.setItem(STORAGE,JSON.stringify(gallery))}catch{}}
 if(!state.completed){
  state.completed=true;
  track("life_completed",{world:state.id,routeVector:state.history.map(c=>c.index+1).join("-"),outcome:decision.quality});
  track("ending_view",{world:state.id,lifeDirection:decision.n,routeVector:state.history.map(c=>c.index+1).join("-"),outcome:decision.quality});
  window.DreamAudio?.fx("ending");
 }
 const audit=state.history.filter((c,i)=>i===0||i===2||i===4);
 $("#home").hidden=true;$("#game").hidden=true;$("#ending").hidden=false;
 $("#ending").innerHTML='<div class="game-top"><button class="ghost-btn" data-home>← '+Qe("home")+'</button><span>'+esc(T(m.place))+'</span><div class="game-tools"><span> '+Qe("gallery")+' </span>'+(window.DreamAudio?.controls()||"")+'</div></div><div class="ending-art">'+art(m.id)+'<span>'+(winning?Qe("collected"):Qe("notCollected"))+'</span></div><div class="ending-paper case-report"><span class="case-grade '+decision.quality+'">'+copies+'</span><span class="kicker">'+Qe("ending")+'</span><h1>'+(winning?esc(T(decision.entry[0])):Qe("cost"))+'</h1><p>'+esc(result)+'</p><div class="case-verdict">'+esc(T(decision.detail))+'</div><div class="case-summary"><strong>'+Qe("earned")+'</strong>'+counters()+'<div class="case-key-actions"><span>'+Qe("recap")+'</span>'+audit.map(c=>'<p>• '+esc(T(c.title))+' — '+esc(T(c.result))+'</p>').join("")+'</div></div><div class="end-actions"><button class="big-btn" data-retry>'+Qe("replay")+' ↺</button><button class="outline-btn" data-random>'+Qe("another")+' ↗</button><button class="outline-btn" data-share>'+Qe("share")+'</button></div></div>';
 window.DreamAudio?.sync();closeToTop();
}
async function share(){
 if(!state||state.history.length!==5)return;
 const d=resolve(),m=meta(state.id),url=location.origin+"/elsewhere/?world="+encodeURIComponent(state.id);
 const shareTitle=d.quality==="cost"?T(Q.cost):T(d.entry[0]);
 const message=d.quality==="cost"?(lang==="zh"?"我在《平行人生》的「"+T(m.name)+"」篇还差一步就能逆转。你会怎么选？":"I came close to winning "+T(m.name)+" in Elsewhere. What would you do?"):(lang==="zh"?"我在《平行人生》的「"+T(m.name)+"」篇，赢得了「"+T(d.entry[0])+"」这个结局。你能做得更好吗？":'I earned "'+T(d.entry[0])+'" in Elsewhere: '+T(m.name)+'. Can you beat my ending?');
 track("share_clicked",{world:state.id,outcome:d.quality});
 if(window.MorrowwishSocialShare?.open){window.MorrowwishSocialShare.open({title:shareTitle,message,url,language:lang,meta:{game:"elsewhere",world:state.id},onShare:platform=>track("share_clicked",{world:state.id,platform})});return}
 try{if(navigator.share){await navigator.share({title:shareTitle,text:message,url});return}}catch(err){if(err?.name==="AbortError")return}
 try{await navigator.clipboard.writeText(message+" "+url);toast(lang==="zh"?"已复制分享文案和链接":"Share link copied")}catch{toast(url)}
}
function toast(msg){
 $("#toast").textContent=msg;$("#toast").hidden=false;window.setTimeout(()=>{$("#toast").hidden=true},2300);
}
function setLanguage(l){
 if(l!=="zh"&&l!=="en")return;
 lang=l;document.documentElement.lang=l==="zh"?"zh-CN":"en";
 try{localStorage.setItem("morrowwish.language",l)}catch{}
 const url=new URLSearchParams(location.search);
 if(l==="zh")url.set("lang","zh");else url.delete("lang");
 history.replaceState(history.state||{},"",location.pathname+(url.toString()?"?"+url:"")+location.hash);
 document.querySelectorAll("[data-language]").forEach(btn=>{
  const active=btn.dataset.language===l;
  btn.classList.toggle("is-active",active);
  btn.setAttribute("aria-pressed",String(active));
 });
 $(".brand").innerHTML=(l==="zh"?"平行人生":"Elsewhere")+"<i>.</i>";
 $(".top-right span").textContent=l==="zh"?"MORROW WISH · 平行人生":"A MORROW WISH ADVENTURE";
 $(".footer-title").textContent=l==="zh"?"平行人生 · MORROW WISH":"ELSEWHERE · MORROW WISH";
 if(!state)renderHome();else if($("#ending").hidden)renderStage();else finish();
 window.DreamAudio?.sync();
}
document.addEventListener("click",e=>{
 const el=e.target.closest("button,a");if(!el)return;
 if(el.matches("[data-twist]"))revealTwist();
 else if(el.matches("[data-language]"))setLanguage(el.dataset.language);
 else if(el.matches("[data-world]"))openWorld(el.dataset.world);
 else if(el.matches("[data-random]"))randomWorld();
 else if(el.matches("[data-home]"))renderHome();
 else if(el.matches("[data-retry]"))openWorld(state.id,true);
 else if(el.matches("[data-choice]"))makeChoice(Number(el.dataset.choice));
 else if(el.matches("[data-continue]"))advance();
 else if(el.matches("[data-secret]")&&state&&!state.secret){
  state.secret=true;state.scores.proof++;
  window.DreamAudio?.fx("secret");toast(T(story(state.id).secret));renderStage();
 }
 else if(el.matches("[data-share]"))share();
});
window.addEventListener("popstate",()=>{const id=new URLSearchParams(location.search).get("world");if(!id)renderHome();else if(!state||state.id!==id)openWorld(id,false,false)});
const urlWorld=new URLSearchParams(location.search).get("world");
setLanguage(lang);
if(urlWorld&&CASES[urlWorld])openWorld(urlWorld,false,false);
if("serviceWorker" in navigator)navigator.serviceWorker.register("/elsewhere/sw.js").catch(()=>{});
})();