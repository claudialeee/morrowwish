import {portraitAsset} from "./portrait-map.mjs";
import {regionalKeepsakes} from "./regional-keepsake-talents.mjs?v=narrative-play-20261127-r2";
import {companionTalents,activateCompanionTalents,talentRank} from "./companion-talents.mjs";
import {sideAdventures,newSideState,sideAction,lanesFor,herbs,weights,basketTotals,starPoints,starLinks} from "./side-adventures.mjs?v=narrative-play-20261127-r2";
const zh=()=>window.MorrowwishI18n?.get?.()==="zh",tr=p=>p[zh()?0:1],pair=(a,b)=>[a,b],el=(tag,cls,text)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=text;return x;};
const svgNS="http://www.w3.org/2000/svg",svg=(tag,attrs={})=>{const e=document.createElementNS(svgNS,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));return e;};
const titleNames={qilan:["栖蓝","Skye"],yahe:["芽禾","Fern"],xiaomao:["小栗","Pip"]};
const regions={qilan:"harbor",yahe:"forest",xiaomao:"forge"};
const trialHelp={qilan:["把能量充到100，再释放大招击响练习铃。","Build charge to 100, then cast an ultimate to ring the practice bell."],yahe:["小猫只有55%生命。让芽禾上场，治疗它，再护送它回家。","The kitten has 55% HP. Bring Fern onto the field, heal it, then escort it home."],xiaomao:["让小栗上场，等到预警出现后测试护盾。","Bring Pip onto the field, then test the shield when the attack warning appears."]};
export function newTrial(id,level=1){
 const actor={cat:{storyActor:id,level},hp:100,maxhp:100,alive:true},ally={cat:{storyActor:"practice"},hp:id==="yahe"?55:100,maxhp:100,alive:true,shieldT:0};
 const rank=talentRank(actor.cat),charge=12+4*(rank-1),heal=20+4*(rank-1),ward=3.5+.75*(rank-1);
 const b={regionalCombat:{cast:null},t:0,ult:id==="qilan"?100-charge:0,team:[ally],gainUlt(n){this.ult=Math.min(100,this.ult+n)},healUnit(f,n){f.hp=Math.min(f.maxhp,f.hp+n)}};
 return {id,actor,ally,b,rank,charge,heal,ward,phase:0,done:false};
}
export function trialAction(s,a){
 if(!s||s.done||!companionTalents[s.id])return false;
 if(a==="deploy"&&s.phase===0){s.b.team.push(s.actor);s.b.t=2;activateCompanionTalents(s.b);s.phase=1;return true;}
 if(s.id==="qilan"&&a==="cast"&&s.phase===1&&s.b.ult===100){s.b.ult=0;s.done=true;return true;}
 if(s.id==="yahe"&&a==="escort"&&s.phase===1&&s.ally.hp>=55+s.heal){s.done=true;return true;}
 if(s.id==="xiaomao"&&a==="warn"&&s.phase===1){s.b.regionalCombat.cast={};activateCompanionTalents(s.b);s.phase=2;return true;}
 if(s.id==="xiaomao"&&a==="impact"&&s.phase===2&&s.ally.shieldT>=s.ward){s.ally.hp-=40*.55;s.done=true;return true;}
 return false;
}
let active=null;
function css(){if(document.getElementById("cb-adventure-play-css"))return;const l=el("link");l.id="cb-adventure-play-css";l.rel="stylesheet";l.href=new URL("../../css/adventure-play.css?v=regional-depth-20261127",import.meta.url).href;document.head.append(l);}
function stage(){return document.getElementById("stage");}
function mount({id,region,title,help,draw,reset,commit,guard,portrait,kind}){
 if(active||!stage())return false;css();
 const owner=window.State?.S,scene=window.__game?.scene,previous=document.activeElement;
 const root=el("section","cb-adventure-overlay");root.dataset.adventure=id;root.dataset.kind=kind;root.setAttribute("role","dialog");root.setAttribute("aria-modal","true");root.tabIndex=-1;
 const bg=el("img","cb-adventure-bg");bg.alt="";bg.src=new URL(window.matchMedia("(orientation:portrait) and (max-width:700px)").matches&&portraitAsset(region)?"../../assets/mobile-portrait/"+portraitAsset(region):"../../assets/resonance-world-v2/"+region+".webp",import.meta.url).href;bg.onerror=()=>{bg.onerror=null;bg.src=new URL("../../assets/resonance-world-v2/"+region+".webp",import.meta.url).href;};
 const card=el("section","cb-adventure-card"),header=el("header","cb-adventure-header"),h=el("h2"),close=el("button","cb-adventure-close"),hint=el("p","cb-adventure-hint"),body=el("div","cb-adventure-body"),foot=el("footer","cb-adventure-footer"),retry=el("button"),status=el("p","cb-adventure-status");status.setAttribute("role","status");
 close.type=retry.type="button";header.append(h,close);if(portrait){const img=el("img","cb-adventure-portrait");img.alt="";img.src=new URL("../../assets/npc/"+portrait+"-painted.webp",import.meta.url).href;header.prepend(img);}
 foot.append(retry);card.append(header,hint,body,status,foot);root.append(bg,card);
 let done=false,committed=false,fail=false;
 const locked=[];for(const child of stage().children){if(child!==root&&!child.inert){child.inert=true;locked.push(child);}}
 function live(){return owner===window.State?.S&&scene===window.__game?.scene&&(!guard||guard());}
 function dispose(){if(active!==root)return;active=null;root.remove();locked.forEach(x=>x.inert=false);window.removeEventListener("cat-bond-active-save-changed",dispose);window.removeEventListener("morrowwish-language-change",render);window.removeEventListener("pagehide",dispose);clearInterval(timer);if(previous?.isConnected)previous.focus({preventScroll:true});}
 function finish(){done=true;if(!committed){const r=commit?.();if(r===false||r?.ok===false){fail=true;render();return;}committed=true;window.MorrowwishAudio?.effect?.("discover");}render();}
 const button=(text,action,opts={})=>{const b=el("button",opts.className||"",tr(text));b.type="button";if(opts.id)b.dataset.playAction=opts.id;b.disabled=!!opts.disabled;b.onclick=()=>{if(!live()){dispose();return;}if(action()===true)finish();else render();};return b;};
 function render(){if(!live()){dispose();return;}h.textContent=tr(title);root.setAttribute("aria-label",h.textContent);close.textContent=tr(kind==="trial"?pair("结束练习","Exit practice"):done&&committed?pair("返回探索","Return to exploration"):pair("返回地图","Return to map"));hint.textContent=done&&committed&&kind==="exploration"?tr(pair("这是可选探索，主线进度不受影响。返回地图后可继续上方主线任务。","This is an optional discovery. Return to the map and follow the story quest at the top.")):tr(help);retry.textContent=tr(fail?pair("重试保存","Retry save"):pair("重置本次小游戏","Reset this activity"));retry.hidden=kind==="trial"||(done&&committed&&kind==="exploration");status.textContent=fail?tr(pair("保存失败，奖励未领取。请重试。","Save failed. Reward not claimed; please retry.")):"";body.replaceChildren();draw({body,status,button,done,committed});if(done&&committed)root.dataset.complete="true";else delete root.dataset.complete;}
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
  const result=feedback==="charge"?"+"+s.charge:feedback==="heal"?"+"+s.heal+" HP":feedback==="ward"?tr(pair("护盾","WARD")):tr(pair("−22 生命","−22 HP"));
  effect.append(el("strong","cb-talent-float",result));arena.append(effect);
 }
 body.append(arena);
}
export function mountTalentTrial(id){
 if(!companionTalents[id]||!window.State?.S?.cats?.some(c=>c.storyActor===id)||!["yard","map"].includes(window.__game?.scene))return false;
 const level=window.State.S.cats.find(c=>c.storyActor===id)?.level||1;let s=newTrial(id,level),feedback="ready";const t=companionTalents[id];
 const help={qilan:pair("点击试用，看看栖蓝怎样为大招补充能量。","Try Tailwind to see how Skye adds ultimate charge."),yahe:pair("练习伙伴只有55点生命，点击试用，看芽禾为它治疗。","The practice ally has 55 HP. Try Fern's healing talent."),xiaomao:pair("点击试用，模拟地区敌人发起攻击预警，再测试护盾效果。","Try Pip's talent during a simulated enemy warning, then test the ward.")};
 const reset=()=>{s=newTrial(id,level);feedback="ready";};
 return mount({id:"trial-"+id,kind:"trial",region:regions[id],portrait:id,title:[titleNames[id][0]+" · "+t.name[0],titleNames[id][1]+" · "+t.name[1]],help:[help[id][0]+"（独立模拟，不消耗资源。）",help[id][1]+" (Isolated simulation; no resources spent.)"],reset,guard:()=>window.State.S.cats.some(c=>c.storyActor===id),draw:({body,status,button})=>{
  talentArena(body,s,t,feedback);
  body.append(el("p","cb-adventure-explain",tr(pair("专长 "+s.rank+" 阶 · 等级 "+level,"Talent rank "+s.rank+" · Level "+level))));
  if(id==="qilan")bar(body,pair("大招能量","Ultimate charge"),s.b.ult);
  else bar(body,pair("练习伙伴生命","Practice ally HP"),s.ally.hp);
  if(id==="xiaomao")bar(body,pair("护盾持续时间（秒）","Ward duration (s)"),s.ally.shieldT||0,s.ward);
  const r=row(body);
  if(feedback==="ready"){
   r.append(button(pair("试用专长","Try talent"),()=>{
    if(!trialAction(s,"deploy"))return false;
    if(id==="xiaomao"){if(!trialAction(s,"warn"))return false;feedback="ward";}
    else if(id==="qilan"&&s.b.ult===100)feedback="charge";
    else if(id==="yahe"&&s.ally.hp===55+s.heal)feedback="heal";
    if(feedback!=="ready")window.MorrowwishMusic?.cue?.(id==="xiaomao"?"seal":id==="yahe"?"reward":"bell");
    return false;
   },{id:"deploy"}));
  }else if(feedback==="ward"){
   r.append(button(pair("测试敌人攻击","Test incoming hit"),()=>{if(trialAction(s,"impact")){feedback="impact";window.MorrowwishMusic?.cue?.("impact");}return false;},{id:"impact"}));
  }
  if(feedback!=="ready")r.append(button(pair("再试一次","Try again"),()=>{reset();return false;},{id:"repeat"}));
  const results={charge:pair("顺风领航已触发："+(100-s.charge)+" → 100，大招已充满。","Tailwind triggered: "+(100-s.charge)+" → 100. Ultimate ready."),heal:pair("月叶急救已触发：55 → "+(55+s.heal)+"，恢复"+s.heal+"点生命。","Moonleaf remedy triggered: 55 → "+(55+s.heal)+". Recovered "+s.heal+" HP."),ward:pair("暖光护盾已触发：两只猫均受到保护，持续"+s.ward+"秒。","Lantern ward triggered: both cats protected for "+s.ward+" seconds."),impact:pair("护盾挡住18点伤害：40点攻击只扣22点生命。","The ward blocked 18 damage: a 40-point hit dealt 22 HP.")};
  status.textContent=feedback==="ready"?tr(pair("地区战斗中满足条件时自动触发，每场一次。","Triggers automatically when its condition is met, once per regional battle.")):tr(results[feedback]);
 }});
}
// Practice is a player-initiated action from the companion detail panel.
if(typeof window!=="undefined")window.CatBondTalentPractice=Object.freeze({talents:companionTalents,rank:talentRank,open:mountTalentTrial});
function diagram(body){const e=svg("svg",{viewBox:"0 0 340 145",class:"cb-adventure-diagram","aria-hidden":"true"});body.append(e);return e;}
export function mountSideAdventure(region,{guard,commit}={}){
 const d=sideAdventures[region];if(!d)return false;let s=newSideState(region),selectedWeight=null;
 return mount({id:"side-"+region,kind:"exploration",region,portrait:d.actor,title:d.title,help:d.clue,reset:()=>{s=newSideState(region);selectedWeight=null},guard,commit:()=>commit?.(s.trace),draw:({body,status,button,done,committed})=>{
 const action=(type,i)=>()=>{sideAction(s,{type,...(i===undefined?{}:{i})});return s.done;};
 if(done&&committed){const reward=el("div","cb-adventure-reward");reward.append(el("h3","",tr(d.reward)),el("p","",tr(d.win)),el("p","cb-region-rule",tr(regionalKeepsakes[region].description)),el("p","",tr(pair("纪念物已收录 · 金币 ×25、鱼干 ×2。伙伴日后会在花园聊起这次经历。","Keepsake added · 25 coins and 2 fish. Your companion will remember this in the garden."))));const back=el("button","cb-adventure-continue",tr(pair("返回地图 · 继续旅程","Return to map · Continue journey")));back.type="button";back.onclick=()=>body.closest(".cb-adventure-overlay")?.querySelector(".cb-adventure-close")?.click();reward.append(back);body.append(reward);return;}
 if(s.message&&!done)status.textContent=tr(s.message);
 if(region==="harbor"){const grid=el("div","cb-tide-grid");grid.setAttribute("aria-label",tr(pair("潮池石路","Tidepool stepping stones")));grid.dataset.artSlot="tidepool";for(let j=2;j>=0;j--)for(let i=0;i<3;i++){const dry=lanesFor(s)[j].includes(i),here=j===s.row-1&&i===s.lane,label=here?pair("小蟹","Crab"):dry?pair("干石","Dry stone"):pair("海水","Water");const b=button(label,action("step",i),{id:"step-"+j+"-"+i,disabled:j!==s.row,className:dry?"cb-dry":"cb-water"});b.dataset.artSlot=dry?"dry-stone":"water-stone";if(here){b.classList.add("cb-crossed");b.dataset.crab="true";}if(j===s.row){b.dataset.current="true";if(Math.abs(i-s.lane)>1)b.dataset.unreachable="true";}grid.append(b);}body.append(el("p","cb-region-rule",tr(s.tide?pair("潮水上涨 · 观察新露出的石头","High tide · Watch the exposed stones"):pair("潮水退去 · 小蟹可向左右相邻石头移动","Low tide · The crab can reach adjacent stones"))),grid);row(body).append(button(pair("等待潮水变化","Wait for tide"),action("wait"),{id:"wait"}));bar(body,pair("已渡过","Crossed"),s.row,3);}
 if(region==="forest"){body.append(el("p","cb-region-rule",tr(s.recipe?pair("第二杯 · 尖叶 + 蕨叶","Cup 2 · Pointed leaf + fern"):pair("第一杯 · 两株三片圆叶","Cup 1 · Two three-round-leaf herbs"))));const r=row(body);r.classList.add("cb-herb-board");herbs.forEach((h,i)=>{const b=button(["香草 "+(i+1),"Herb "+(i+1)],action("pick",i),{id:"pick-"+i,className:s.selected.includes(i)?"cb-picked":""});b.setAttribute("aria-pressed",String(s.selected.includes(i)));b.setAttribute("aria-label",tr([h[1],h[2]]));b.dataset.artSlot=h[0];const art=svg("svg",{viewBox:"0 0 64 48",width:64,height:48,"aria-hidden":"true"});art.append(svg("path",{d:"M32 45V9",stroke:"#68865b","stroke-width":3,fill:"none"}));for(const [x,y,a] of [[20,22,-35],[44,22,35],[32,9,0]])art.append(h[0]==="round3"?svg("ellipse",{cx:x,cy:y,rx:10,ry:6,fill:"#91ba79",transform:"rotate("+a+" "+x+" "+y+")"}):h[0]==="fern"?svg("path",{d:"M"+(x-10)+" "+(y+4)+" q4 -10 10 -8 q6 -2 10 8 M"+x+" "+(y-8)+" v12",fill:"none",stroke:"#638c62","stroke-width":3}):svg("path",{d:"M"+(x-9)+" "+(y+6)+" L"+x+" "+(y-8)+" L"+(x+9)+" "+(y+6)+"Z",fill:"#719a71"}));b.prepend(art);r.append(b);});bar(body,pair("茶篮","Tea basket"),s.selected.length,2);bar(body,pair("已配茶方","Blends brewed"),s.recipe,2);row(body).append(button(pair("冲泡香草茶","Brew herbal tea"),action("brew"),{id:"brew",disabled:s.selected.length!==2}));}
 if(region==="forge"){const art=diagram(body);art.dataset.artSlot="lantern-stage";art.append(svg("circle",{cx:170,cy:72,r:59,fill:"#ffe2a1",stroke:"#d3aa67","stroke-width":3}));const g=svg("g",{transform:"rotate("+s.rotation*90+" 170 72)"+(s.mirrored?" translate(340 0) scale(-1 1)":""),"data-art-slot":"rotating-cat"});g.append(svg("path",{d:"M133 95 Q124 76 139 58 L140 26 L162 45 Q177 42 191 50 L209 42 L202 67 Q217 93 190 110 Q160 123 133 95Z",fill:"#825b44"}));art.append(g);const r=row(body);r.append(button(pair("转动灯片","Rotate cutout"),action("rotate"),{id:"rotate"}),button(pair("翻转灯片","Flip cutout"),action("flip"),{id:"flip"}),button(pair("点亮","Light lantern"),action("light"),{id:"light"}));}
 if(region==="sky"){
  const [l,r]=basketTotals(s),placed=s.baskets.filter(Boolean).length,balanced=placed===4&&l===r&&s.baskets[3]===1;
  const board=el("div","cb-mail-board");board.dataset.balanced=String(balanced);board.style.setProperty("--mail-tilt",Math.max(-14,Math.min(14,(r-l)*2))+"deg");
  const art=el("div","cb-mail-scene"),rig=el("div","cb-mail-rig"),mast=el("div","cb-mail-mast"),beam=el("div","cb-mail-beam");art.dataset.artSlot="mail-dock";mast.dataset.artSlot="mail-mast";beam.dataset.artSlot="mail-beam";
  const pouch=(side,total,label)=>{const b=button(label,()=>{if(selectedWeight===null)return false;sideAction(s,{type:"place",i:selectedWeight,side});selectedWeight=null;return false;},{id:"basket-"+side,className:"cb-mail-pouch",disabled:selectedWeight===null});b.dataset.artSlot="mail-pouch";b.replaceChildren(el("span","cb-mail-pouch-name",tr(label)),el("strong","cb-mail-total",String(total)),el("span","cb-mail-weight-list",s.baskets.map((p,i)=>p===side?weights[i]:null).filter(x=>x!==null).join(" + ")||tr(pair("空袋","Empty"))));return b;};
  const baskets=el("div","cb-mail-baskets");baskets.append(pouch(1,l,pair("左信袋","Left pouch")),pouch(2,r,pair("右信袋","Right pouch")));rig.append(mast,beam,baskets);art.append(rig);board.append(art);
  const state=el("div","cb-mail-state");state.setAttribute("role","status");state.textContent=balanced?tr(pair("平衡完成 · 可以放飞","Balanced · Ready to launch")):placed<4?tr(pair("已装入 "+placed+"/4 块配重","Weights loaded "+placed+"/4")):l===r?tr(pair("重量平衡 · 封蜡配重4需在左袋","Balanced · Sealed weight 4 must be left")):tr(pair((l>r?"左":"右")+"侧较重 · 相差 "+Math.abs(l-r),(l>r?"Left":"Right")+" side heavier · difference "+Math.abs(l-r)));board.append(state);
  const tray=el("div","cb-mail-tray");weights.forEach((value,i)=>{const b=button([String(value),String(value)],()=>{selectedWeight=selectedWeight===i?null:i;return false;},{id:"weight-"+i,className:"cb-mail-weight"+(selectedWeight===i?" cb-mail-selected":"")});b.dataset.artSlot="mail-weight";if(i===3){b.dataset.sealed="true";b.setAttribute("aria-label",tr(pair("封蜡配重4，放在左袋","Sealed weight 4, left pouch only")));}b.setAttribute("aria-pressed",String(selectedWeight===i));b.append(el("small","",tr([["待装","左袋","右袋"][s.baskets[i]],["Unloaded","Left","Right"][s.baskets[i]]])));tray.append(b);});board.append(tray);
  board.append(el("p","cb-mail-instruction",selectedWeight===null?tr(pair("① 选一块配重","1 · Choose a weight")):tr(pair("② 点要放入的信袋 · 已选 "+weights[selectedWeight],"2 · Choose a pouch · Selected "+weights[selectedWeight]))));
  if(selectedWeight!==null&&s.baskets[selectedWeight])board.append(button(pair("取出选中的配重","Remove selected weight"),()=>{sideAction(s,{type:"place",i:selectedWeight,side:0});selectedWeight=null;return false;},{id:"remove-weight",className:"cb-mail-remove"}));
  board.append(button(pair("放飞信袋","Launch mailbag"),action("launch"),{id:"launch",disabled:!balanced,className:"cb-mail-launch"}));body.append(board);
 }
 if(region==="library"){const pages=[pair("小猫和朋友在家门前点亮灯。","The kitten and its friend light a lamp at home."),pair("小猫背起小包，独自出门。","The kitten leaves alone with a little bag."),pair("小猫在桥上遇到朋友，邀请它回家。","The kitten meets a friend on the bridge and invites it home.")];const r=row(body);r.classList.add("cb-story-pages");pages.forEach((p,i)=>{const card=button(p,action("page",i),{id:"page-"+i,disabled:s.pages.includes(i),className:"cb-story-page"});card.dataset.artSlot=["page-night","page-morning","page-afternoon"][i];const picture=el("span","cb-page-picture",["⌂","↗","◇"][i]);picture.setAttribute("aria-hidden","true");card.prepend(picture);r.append(card);});const list=el("ol","cb-pages");s.pages.forEach(i=>list.append(el("li","",tr(pages[i]))));body.append(list);row(body).append(button(pair("重新排列","Rearrange"),action("unbind"),{id:"unbind"}),button(pair("装订成册","Bind story"),action("bind"),{id:"bind",disabled:s.pages.length!==3}));}
 if(region==="starfall"){const sky=el("div","cb-constellation");sky.dataset.artSlot="star-chart";const art=svg("svg",{viewBox:"0 0 340 145",preserveAspectRatio:"none","aria-hidden":"true"});for(const [a,b] of starLinks){const lit=s.stars.some((x,i)=>i>0&&((x===a&&s.stars[i-1]===b)||(x===b&&s.stars[i-1]===a)));art.append(svg("line",{x1:starPoints[a][0]*340,y1:starPoints[a][1]*145,x2:starPoints[b][0]*340,y2:starPoints[b][1]*145,stroke:lit?"#f8d777":"#a7abc5","stroke-width":lit?5:2,"stroke-dasharray":lit?"none":"5 5"}));}sky.append(art);starPoints.forEach(([x,y],i)=>{const b=button(["星"+(i+1),"Star "+(i+1)],action("star",i),{id:"star-"+i,disabled:s.stars.includes(i),className:s.stars.includes(i)?"cb-star cb-picked":"cb-star"});b.dataset.artSlot="star-node";if(i===0)b.dataset.start="true";if(i===4){b.dataset.home="true";b.setAttribute("aria-label",tr(pair("归航星，最后连接","Home star, connect last")));}b.style.left=x*100+"%";b.style.top=y*100+"%";sky.append(b);});body.append(sky);bar(body,pair("星光","Stars lit"),s.stars.length,5);row(body).append(button(pair("撤回一段","Undo last link"),action("undo"),{id:"undo",disabled:s.stars.length<=1}),button(pair("重新连接","Reconnect"),action("reset"),{id:"reset"}));}
 }});
}
