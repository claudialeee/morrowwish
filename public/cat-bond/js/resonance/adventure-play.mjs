import {companionTalents,activateCompanionTalents} from "./companion-talents.mjs";
import {sideAdventures,newSideState,sideAction,dryLanes,herbs,weights,basketTotals,starPoints,starLinks} from "./side-adventures.mjs";
const zh=()=>window.MorrowwishI18n?.get?.()==="zh",tr=p=>p[zh()?0:1],pair=(a,b)=>[a,b],el=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=text;return x;};
const svgNS="http://www.w3.org/2000/svg",svg=(tag,attrs={})=>{const e=document.createElementNS(svgNS,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));return e;};
const titleNames={qilan:["栖蓝","Skye"],yahe:["芽禾","Fern"],xiaomao:["小栗","Pip"]};
const regions={qilan:"harbor",yahe:"forest",xiaomao:"forge"};
const trialHelp={qilan:["把能量充到100，再释放大招击响练习铃。","Build charge to 100, then cast an ultimate to ring the practice bell."],yahe:["小猫只有55%生命。让芽禾上场，治疗它，再护送它回家。","The kitten has 55% HP. Bring Fern onto the field, heal it, then escort it home."],xiaomao:["让小栗上场，等到预警出现后测试护盾。","Bring Pip onto the field, then test the shield when the attack warning appears."]};
export function newTrial(id){
 const actor={cat:{storyActor:id},hp:100,maxhp:100,alive:true},ally={cat:{storyActor:"practice"},hp:id==="yahe"?55:100,maxhp:100,alive:true,shieldT:0};
 const b={regionalCombat:{cast:null},t:0,ult:id==="qilan"?88:0,team:[ally],gainUlt(n){this.ult=Math.min(100,this.ult+n)},healUnit(f,n){f.hp=Math.min(f.maxhp,f.hp+n)}};
 return {id,actor,ally,b,phase:0,done:false};
}
export function trialAction(s,a){
 if(!s||s.done||!companionTalents[s.id])return false;
 if(a==="deploy"&&s.phase===0){s.b.team.push(s.actor);s.b.t=2;activateCompanionTalents(s.b);s.phase=1;return true;}
 if(s.id==="qilan"&&a==="cast"&&s.phase===1&&s.b.ult===100){s.b.ult=0;s.done=true;return true;}
 if(s.id==="yahe"&&a==="escort"&&s.phase===1&&s.ally.hp>=75){s.done=true;return true;}
 if(s.id==="xiaomao"&&a==="warn"&&s.phase===1){s.b.regionalCombat.cast={};activateCompanionTalents(s.b);s.phase=2;return true;}
 if(s.id==="xiaomao"&&a==="impact"&&s.phase===2&&s.ally.shieldT>=3.5){s.ally.hp-=40*.55;s.done=true;return true;}
 return false;
}
let active=null;
function css(){if(document.getElementById("cb-adventure-play-css"))return;const l=el("link");l.id="cb-adventure-play-css";l.rel="stylesheet";l.href=new URL("../../css/adventure-play.css?v=talent-effects-20261127",import.meta.url).href;document.head.append(l);}
function stage(){return document.getElementById("stage");}
function mount({id,region,title,help,draw,reset,commit,guard,portrait,kind}){
 if(active||!stage())return false;css();
 const owner=window.State?.S,scene=window.__game?.scene,previous=document.activeElement;
 const root=el("section","cb-adventure-overlay");root.dataset.adventure=id;root.dataset.kind=kind;root.setAttribute("role","dialog");root.setAttribute("aria-modal","true");root.tabIndex=-1;
 const bg=el("img","cb-adventure-bg");bg.alt="";bg.src=new URL("../../assets/resonance-world-v2/"+region+".webp",import.meta.url).href;
 const card=el("section","cb-adventure-card"),header=el("header","cb-adventure-header"),h=el("h2"),close=el("button","cb-adventure-close"),hint=el("p","cb-adventure-hint"),body=el("div","cb-adventure-body"),foot=el("footer","cb-adventure-footer"),retry=el("button"),status=el("p","cb-adventure-status");status.setAttribute("role","status");
 close.type=retry.type="button";header.append(h,close);if(portrait){const img=el("img","cb-adventure-portrait");img.alt="";img.src=new URL("../../assets/npc/"+portrait+"-painted.webp",import.meta.url).href;header.prepend(img);}
 foot.append(retry);card.append(header,hint,body,status,foot);root.append(bg,card);
 let done=false,committed=false,fail=false;
 const locked=[];for(const child of stage().children){if(child!==root&&!child.inert){child.inert=true;locked.push(child);}}
 function live(){return owner===window.State?.S&&scene===window.__game?.scene&&(!guard||guard());}
 function dispose(){if(active!==root)return;active=null;root.remove();locked.forEach(x=>x.inert=false);window.removeEventListener("cat-bond-active-save-changed",dispose);window.removeEventListener("morrowwish-language-change",render);window.removeEventListener("pagehide",dispose);clearInterval(timer);if(previous?.isConnected)previous.focus({preventScroll:true});}
 function finish(){done=true;if(!committed){const r=commit?.();if(r===false||r?.ok===false){fail=true;render();return;}committed=true;window.MorrowwishAudio?.effect?.("discover");}render();}
 const button=(text,action,opts={})=>{const b=el("button",opts.className||"",tr(text));b.type="button";if(opts.id)b.dataset.playAction=opts.id;b.disabled=!!opts.disabled;b.onclick=()=>{if(!live()){dispose();return;}if(action()===true)finish();else render();};return b;};
 function render(){if(!live()){dispose();return;}h.textContent=tr(title);root.setAttribute("aria-label",h.textContent);close.textContent=tr(kind==="trial"?pair("结束练习","Exit practice"):done&&committed?pair("返回探索","Return to exploration"):pair("返回地图","Return to map"));hint.textContent=tr(help);retry.textContent=tr(fail?pair("重试保存","Retry save"):pair("重置本次小游戏","Reset this activity"));retry.hidden=kind==="trial"||(done&&committed&&kind==="exploration");status.textContent=fail?tr(pair("保存失败，奖励未领取。请重试。","Save failed. Reward not claimed; please retry.")):"";body.replaceChildren();draw({body,status,button,done,committed});if(done&&committed)root.dataset.complete="true";else delete root.dataset.complete;}
 close.onclick=dispose;retry.onclick=()=>{if(!live()){dispose();return;}if(fail){fail=false;finish();return;}done=committed=false;reset();render();};
 root.onkeydown=e=>{e.stopPropagation();if(e.key==="Escape"){e.preventDefault();e.stopPropagation();dispose();}else if(e.key==="Tab"){const a=[...root.querySelectorAll("button:not(:disabled):not([hidden]),input")];if(!a.length)return;if(e.shiftKey&&document.activeElement===a[0]){e.preventDefault();a.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===a.at(-1)){e.preventDefault();a[0].focus();}}};
 active=root;stage().append(root);window.addEventListener("cat-bond-active-save-changed",dispose);window.addEventListener("morrowwish-language-change",render);window.addEventListener("pagehide",dispose,{once:true});const timer=setInterval(()=>{if(!live())dispose()},200);render();root.focus();return true;
}
function row(body){const r=el("div","cb-adventure-actions");body.append(r);return r;}
function bar(body,label,n,max=100){const box=el("div","cb-adventure-meter"),p=el("progress");p.max=max;p.value=n;p.setAttribute("aria-label",tr(label));box.append(el("strong","",tr(label)+" · "+n+"/"+max),p);body.append(box);}
// The preview calls the same passive-talent function as regional combat. It
// never pretends to cast an unrelated ultimate or changes the player's save.
function talentArena(body,s,t,feedback){
 const arena=el("div","cb-talent-arena");arena.dataset.talentEffect=feedback||"ready";arena.style.setProperty("--talent-color",t.color);
 const cat=(id,cls,label)=>{const unit=el("div","cb-talent-unit "+cls),img=el("img");img.alt="";img.src=new URL("../../assets/"+(id==="player"?"core-art-remaster/leads/player.webp":"npc/"+id+"-painted.webp"),import.meta.url).href;unit.append(img,el("span","cb-talent-name",tr(label)));arena.append(unit);return unit;};
 cat(s.id,"cb-talent-caster",titleNames[s.id]);cat("player","cb-talent-target",pair("练习伙伴","Practice ally"));
 const shield=s.id==="xiaomao"&&s.ally.shieldT>0;
 if(shield){for(const cls of ["cb-talent-caster","cb-talent-target"]){const unit=arena.querySelector("."+cls);unit.append(el("span","cb-talent-shield"));}}
 if(feedback&&feedback!=="ready"){
  const effect=el("div","cb-talent-effect");effect.setAttribute("aria-hidden","true");const ray=el("span","cb-talent-ray");effect.append(ray);
  const result=feedback==="charge"?"+12":feedback==="heal"?"+20 HP":feedback==="ward"?tr(pair("护盾","WARD")):tr(pair("−22 生命","−22 HP"));
  effect.append(el("strong","cb-talent-float",result));arena.append(effect);
 }
 body.append(arena);
}
export function mountTalentTrial(id){
 if(!companionTalents[id]||!window.State?.S?.cats?.some(c=>c.storyActor===id)||!["yard","map"].includes(window.__game?.scene))return false;
 let s=newTrial(id),feedback="ready";const t=companionTalents[id];
 const help={qilan:pair("点击试用，看看栖蓝怎样为大招补充能量。","Try Tailwind to see how Skye adds ultimate charge."),yahe:pair("练习伙伴只有55点生命，点击试用，看芽禾为它治疗。","The practice ally has 55 HP. Try Fern's healing talent."),xiaomao:pair("点击试用，模拟地区敌人发起攻击预警，再测试护盾效果。","Try Pip's talent during a simulated enemy warning, then test the ward.")};
 const reset=()=>{s=newTrial(id);feedback="ready";};
 return mount({id:"trial-"+id,kind:"trial",region:regions[id],portrait:id,title:[titleNames[id][0]+" · "+t.name[0],titleNames[id][1]+" · "+t.name[1]],help:[help[id][0]+"（独立模拟，不消耗资源。）",help[id][1]+" (Isolated simulation; no resources spent.)"],reset,guard:()=>window.State.S.cats.some(c=>c.storyActor===id),draw:({body,status,button})=>{
  talentArena(body,s,t,feedback);
  body.append(el("p","cb-adventure-explain",tr(t.description)));
  if(id==="qilan")bar(body,pair("大招能量","Ultimate charge"),s.b.ult);
  else bar(body,pair("练习伙伴生命","Practice ally HP"),s.ally.hp);
  if(id==="xiaomao")bar(body,pair("护盾持续时间（秒）","Ward duration (s)"),s.ally.shieldT||0,3.5);
  const r=row(body);
  if(feedback==="ready"){
   r.append(button(pair("试用专长","Try talent"),()=>{
    if(!trialAction(s,"deploy"))return false;
    if(id==="xiaomao"){if(!trialAction(s,"warn"))return false;feedback="ward";}
    else if(id==="qilan"&&s.b.ult===100)feedback="charge";
    else if(id==="yahe"&&s.ally.hp===75)feedback="heal";
    if(feedback!=="ready")window.MorrowwishMusic?.cue?.(id==="xiaomao"?"seal":id==="yahe"?"reward":"bell");
    return false;
   },{id:"deploy"}));
  }else if(feedback==="ward"){
   r.append(button(pair("测试敌人攻击","Test incoming hit"),()=>{if(trialAction(s,"impact")){feedback="impact";window.MorrowwishMusic?.cue?.("impact");}return false;},{id:"impact"}));
  }
  if(feedback!=="ready")r.append(button(pair("再试一次","Try again"),()=>{reset();return false;},{id:"repeat"}));
  const results={charge:pair("顺风领航已触发：88 → 100，大招已充满。正式战斗中可以接着释放大招。","Tailwind triggered: 88 → 100. Your ultimate is now ready in a real battle."),heal:pair("月叶急救已触发：55 → 75，练习伙伴恢复20点生命。","Moonleaf remedy triggered: 55 → 75. The ally recovered 20 HP."),ward:pair("暖光护盾已触发：两只猫均受到保护，持续3.5秒。","Lantern ward triggered: both cats are protected for 3.5 seconds."),impact:pair("护盾挡住18点伤害：40点攻击只扣22点生命。","The ward blocked 18 damage: a 40-point hit dealt 22 HP.")};
  status.textContent=feedback==="ready"?tr(pair("地区战斗中满足条件时自动触发，每场一次。","Triggers automatically when its condition is met, once per regional battle.")):tr(results[feedback]);
 }});
}
// Practice is a player-initiated action from the companion detail panel.
if(typeof window!=="undefined")window.CatBondTalentPractice=Object.freeze({talents:companionTalents,open:mountTalentTrial});
function diagram(body){const e=svg("svg",{viewBox:"0 0 340 145",class:"cb-adventure-diagram","aria-hidden":"true"});body.append(e);return e;}
export function mountSideAdventure(region,{guard,commit}={}){
 const d=sideAdventures[region];if(!d)return false;let s=newSideState(region);
 return mount({id:"side-"+region,kind:"exploration",region,title:d.title,help:d.clue,reset:()=>{s=newSideState(region)},guard,commit:()=>commit?.(s.trace),draw:({body,status,button,done,committed})=>{
 const action=(type,i)=>()=>{sideAction(s,{type,...(i===undefined?{}:{i})});return s.done;};
 if(done&&committed){const reward=el("div","cb-adventure-reward");reward.append(el("h3","",tr(d.reward)),el("p","",tr(d.win)),el("p","",tr(pair("已收入旅途纪念物，之后还能听到伙伴的回访故事。","Added to your travel keepsakes, with a companion memory to discover later."))));body.append(reward);return;}
 if(s.message&&!done)status.textContent=tr(s.message);
 if(region==="harbor"){const grid=el("div","cb-tide-grid");for(let j=2;j>=0;j--)for(let i=0;i<3;i++){const dry=dryLanes[j].includes(i),label=dry?pair("干石","Dry stone"):pair("海水","Water");const b=button(label,action("step",i),{id:"step-"+j+"-"+i,disabled:j!==s.row,className:dry?"cb-dry":"cb-water"});if(j<s.row)b.classList.add("cb-crossed");grid.append(b);}body.append(grid);bar(body,pair("已渡过","Crossed"),s.row,3);}
 if(region==="forest"){const r=row(body);herbs.forEach((h,i)=>{const b=button([h[1],h[2]],action("pick",i),{id:"pick-"+i,className:s.selected.includes(i)?"cb-picked":""});b.setAttribute("aria-pressed",String(s.selected.includes(i)));const art=svg("svg",{viewBox:"0 0 64 48",width:64,height:48,"aria-hidden":"true"});art.append(svg("path",{d:"M32 45V9",stroke:"#68865b","stroke-width":3,fill:"none"}));for(const [x,y,a] of [[20,22,-35],[44,22,35],[32,9,0]])art.append(h[0]==="round3"?svg("ellipse",{cx:x,cy:y,rx:10,ry:6,fill:"#91ba79",transform:"rotate("+a+" "+x+" "+y+")"}):svg("path",{d:"M"+(x-9)+" "+(y+6)+" L"+x+" "+(y-8)+" L"+(x+9)+" "+(y+6)+"Z",fill:"#719a71"}));b.prepend(art);r.append(b);});bar(body,pair("茶篮","Tea basket"),s.selected.length,2);row(body).append(button(pair("冲泡香草茶","Brew herbal tea"),action("brew"),{id:"brew",disabled:s.selected.length!==2}));}
 if(region==="forge"){const art=diagram(body);art.append(svg("circle",{cx:170,cy:72,r:59,fill:"#ffe2a1",stroke:"#d3aa67","stroke-width":3}));const g=svg("g",{transform:"rotate("+s.rotation*90+" 170 72)"});g.append(svg("path",{d:"M133 95 Q124 76 139 58 L140 26 L162 45 Q177 42 191 50 L209 42 L202 67 Q217 93 190 110 Q160 123 133 95Z",fill:"#825b44"}));art.append(g);const r=row(body);r.append(button(pair("转动灯片","Rotate cutout"),action("rotate"),{id:"rotate"}),button(pair("点亮","Light lantern"),action("light"),{id:"light"}));}
 if(region==="sky"){const [l,r]=basketTotals(s),art=diagram(body);art.append(svg("path",{d:"M170 35 V120 M130 120 H210",stroke:"#806a58","stroke-width":6,fill:"none"}));const g=svg("g",{transform:"rotate("+Math.max(-20,Math.min(20,(r-l)*5))+" 170 35)"});g.append(svg("path",{d:"M65 35 H275 M65 35 L35 95 H95Z M275 35 L245 95 H305Z",stroke:"#a88a63","stroke-width":3,fill:"#f7e3b1"}));art.append(g);bar(body,pair("左篮重量","Left basket"),l,10);bar(body,pair("右篮重量","Right basket"),r,10);const rr=row(body);weights.forEach((w,i)=>rr.append(button([w+" · "+["未放置","左篮","右篮"][s.baskets[i]],w+" · "+["unplaced","left","right"][s.baskets[i]]],action("weight",i),{id:"weight-"+i})));row(body).append(button(pair("放飞信袋","Launch mailbag"),action("launch"),{id:"launch",disabled:s.baskets.some(x=>!x)}));}
 if(region==="library"){const pages=[pair("夜晚：小猫在家门前点亮灯。","Night: the kitten lights a lamp at home."),pair("早晨：小猫背起小包出门。","Morning: the kitten leaves with a little bag."),pair("午后：小猫在桥上遇见朋友。","Afternoon: the kitten meets a friend on the bridge.")];const r=row(body);pages.forEach((p,i)=>r.append(button(p,action("page",i),{id:"page-"+i,disabled:s.pages.includes(i)})));const list=el("ol","cb-pages");s.pages.forEach(i=>list.append(el("li","",tr(pages[i]))));body.append(list);row(body).append(button(pair("重新排列","Rearrange"),action("unbind"),{id:"unbind"}),button(pair("装订成册","Bind story"),action("bind"),{id:"bind",disabled:s.pages.length!==3}));}
 if(region==="starfall"){const sky=el("div","cb-constellation"),art=svg("svg",{viewBox:"0 0 340 145",preserveAspectRatio:"none","aria-hidden":"true"});for(const [a,b] of starLinks){const lit=s.stars.some((x,i)=>i>0&&((x===a&&s.stars[i-1]===b)||(x===b&&s.stars[i-1]===a)));art.append(svg("line",{x1:starPoints[a][0]*340,y1:starPoints[a][1]*145,x2:starPoints[b][0]*340,y2:starPoints[b][1]*145,stroke:lit?"#f8d777":"#a7abc5","stroke-width":lit?5:2,"stroke-dasharray":lit?"none":"5 5"}));}sky.append(art);starPoints.forEach(([x,y],i)=>{const b=button(["星"+(i+1),"Star "+(i+1)],action("star",i),{id:"star-"+i,disabled:s.stars.includes(i),className:s.stars.includes(i)?"cb-star cb-picked":"cb-star"});b.style.left=x*100+"%";b.style.top=y*100+"%";sky.append(b);});body.append(sky);bar(body,pair("星光","Stars lit"),s.stars.length,5);row(body).append(button(pair("重新连接","Reconnect"),action("reset"),{id:"reset"}));}
 }});
}
