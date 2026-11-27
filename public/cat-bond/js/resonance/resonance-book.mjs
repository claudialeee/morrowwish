import {mountTalentTrial} from "./adventure-play.mjs";
import {companionTalents} from "./companion-talents.mjs";
import {earnedKeepsakes} from "./regional-discoveries.mjs";
// One presentation layer over the existing UI, State, Raising and CatRelations.
// No cloned cats, separate inventory, storage, or narrative progress.
import {recipes,craftSupply} from "./book-recipes.mjs";
import {echoHabit} from "./finale-combat.mjs";
const tr=(zh,en)=>window.MorrowwishI18n?.get?.()==="zh"?zh:en;
const panel=()=>document.getElementById("panel");
const game=()=>window.__game;
const state=()=>window.State?.S;
const stage=()=>document.getElementById("stage");
const tabs=[
 ["cats","猫咪","Cats","openCatHub",["solo"]],
 ["party","队伍","Party","openMapSquad",[]],
 ["duo","双猫羁绊","Duo Bonds","openBondPanel",[]],
 ["workshop","工坊","Workshop","openWorkshop",[]],
 ["dex","Catdex","Catdex","openDex",[]],
 ["wishes","星铃祈愿","Wishes"],
 ["bag","背包","Inventory"],
 ["shop","商店","Shop","openShop",[]],
 ["daily","签到","Daily","openDaily",[]],
 ["records","成就","Records"]
];
const node=(tag,cl,txt)=>{const e=document.createElement(tag);if(cl)e.className=cl;if(txt!==undefined)e.textContent=txt;return e};
let active=null,installed=false,oldFocus=null,worldLock=null;
function lockWorld(){const world=stage()?.querySelector('.rw-world');if(world&&!world.inert){world.inert=true;worldLock=world}}
function unlockWorld(){if(worldLock){worldLock.inert=false;worldLock=null}}
function blocked(){const g=game();return !g||!["map","yard"].includes(g.scene)||!!g.battle||!!g.yard?.placement||
 !!stage()?.querySelector(".res-host,.cbcp-root:not([hidden]),.rw-world:not([hidden])[data-ceremony],#intro:not(.hide)")||
 panel()?.dataset.mandatory==="true"||!!document.querySelector(".cb-slot-manager");}
function alive(){return !!active&&active.owner===state()&&active.scene===game()?.scene&&!blocked()}
function sound(open){window.MorrowwishAudio?.effect?.("page");window.MorrowwishMusic?.duckFor?.(open?650:300);window.dispatchEvent(new CustomEvent("cat-bond-resonance-book-changed",{detail:{open,scene:game()?.scene}}))}
function button(label,fn,cls="rb-action"){const b=node("button",cls,label);b.type="button";b.onclick=()=>{if(alive()&&b.isConnected)fn()};return b}
function clear(){active=null;unlockWorld();panel()?.classList.remove("rb-open");const root=panel()?.querySelector(".rb-navigation");root?.remove();oldFocus=null}
function dismiss(){if(!active)return;window.UI.closeAll()}
function attach(){
 if(!alive())return;
 const p=panel(),card=p?.querySelector(":scope > .card");if(!card||!p.classList.contains("open"))return;
 p.classList.add("rb-open");card.classList.add("rb-card");card.dataset.bookCategory=active.tab;lockWorld();
 const previous=card.querySelector(":scope > .rb-navigation");previous?.remove();card.querySelector(":scope > .rb-craft-link")?.remove();
 const n=node("section","rb-navigation");n.setAttribute("translate","no");
 const mast=node("header","rb-masthead");
 const book=node("div","rb-brand");book.append(node("small","",tr("旅人的共鸣记录","THE TRAVELER'S COMPANION")),node("strong","",tr("星月之书","Resonance Book")));
 const home=button(tr("返回花园","Sunlit Garden"),()=>{dismiss();if(game()?.scene==="map")window.WorldMap?.exitToYard?.()},"rb-home");
 home.hidden=game()?.scene==="yard";
 const close=button(tr("关闭","Close"),dismiss,"rb-close");close.setAttribute("aria-label",tr("关闭星月之书","Close Resonance Book"));
 mast.append(book,home,close);n.append(mast);const wallet=node("div","rb-wallet");wallet.append(stat(tr("金币","Coins"),Math.max(0,Number(state().coins)||0)),stat(tr("小鱼干","Fish"),Math.max(0,Number(state().fish)||0)));n.append(wallet);
 const nav=node("nav","rb-tabs");nav.setAttribute("aria-label",tr("养成分类","Companion categories"));
 for(const [id,zh,en] of tabs){const b=button(tr(zh,en),()=>select(id),"rb-tab");b.dataset.bookTab=id;b.setAttribute("aria-current",active.tab===id?"page":"false");nav.append(b)}
 n.append(nav);card.prepend(n);
 if(active.tab==="dex"&&card.querySelector(".mastery-summary"))appendArchive(card);
 if(active.tab==="workshop"&&card.querySelector(".st-list")){
   const craft=button(tr("制作配方","Crafting recipes"),()=>select("bag",true),"rb-craft-link");
   n.after(craft);
 }
}
function appendArchive(card){
 card.querySelector(".rb-dex-archive")?.remove();
 const s=state(),p=s.resonance,completed=new Set(p?.completed||[]);
 const entries=[
  ["library:M-02",["镜厅记录","Mirror room records"],["已辨认镜面中的记录；真实记忆与影像必须交叉验证。","Mirror records examined. Memories and images must be cross-checked."]],
  ["library:M-03",["身份揭晓","Identity revealed"],["暮铃确认曾认识旅行者；旅行者曾将自己留在星铃中。","Luna confirmed knowing the traveler, who once left themself inside the Star Bell."]],
  ["starfall:F-02",["星坠记录","Starfall records"],["已调查星图与灾变记录。","Star map and catastrophe records investigated."]],
  ["starfall:F-03",["中央星铃计划","The central bell plan"],["暮铃想借众猫的记忆让旅行者归来。","Luna intended to use every cat's memories to bring the traveler back."]],
  ["finale:B-02",["空白回响","Hollow Echo"],["已通过回应节拍辨别回响。","The echoes have been distinguished using their reply rhythms."]],
  ["epilogue:E-03",["最后一页","The last page"],["六地再次回应，新的家园旅程开始。","The six regions answer again. A new journey at home begins."]]
 ].filter(([id])=>completed.has(id));
 if(!entries.length)return;
 const archive=node("section","rb-dex-archive");archive.setAttribute("translate","no");
 const title=node("h3","",tr("旅途档案","Journey archive"));archive.append(title);
 for(const [id,label,description] of entries){const row=node("div","rb-dex-entry");row.dataset.archiveScene=id;row.append(node("strong","",tr(...label)),node("p","",tr(...description)));archive.append(row);}
 if(completed.has("library:M-02")){
  const notes=node("details","rb-dex-rhythms");notes.append(node("summary","",tr("伙伴的回应节拍","Companion reply rhythms")));
  notes.append(node("p","",tr("每只已收录猫咪的习惯节拍，取自真实战斗判别规则。","Each recorded companion's rhythm uses the actual battle identification rule.")));
  for(const cat of s.cats.filter(x=>s.dex?.[x.species]>0))notes.append(stat(window.State.catName(cat),echoHabit(cat).toFixed(2)+" s"));
  archive.append(notes);
 }
 card.querySelector(".mastery-summary").after(archive);
}
function shell(){window.UI.panel('<span class="card-close">×</span><section class="rb-content"></section>');return panel().querySelector(".rb-content")}
function stat(label,value){const row=node("div","rb-stat");row.append(node("span","",label),node("strong","",String(value)));return row}
function inventory(focusCraft=false){
 const s=state(),host=shell();host.setAttribute("translate","no");
 host.append(node("h2","",tr("背包与制作","Inventory & crafting")));
 const summary=node("div","rb-inventory");for(const [zh,en,v] of [["金币","Coins",s.coins],["小鱼干","Fish",s.fish],["急救包","First-aid kits",s.medkits],["幸运诱饵","Lucky lures",s.luckLure]])summary.append(stat(tr(zh,en),Math.max(0,Number(v)||0)));
 host.append(summary);
 const stones=Object.entries(s.evoStones||{}).filter(([,v])=>Number(v)>0);
 if(stones.length){const items=node("div","rb-inventory");for(const [k,v] of stones){const item=window.UI.shopItem?.("stone:"+k);items.append(stat(item?tr(item.zh,item.en):k,v))}host.append(node("h3","",tr("收集材料","Collected materials")),items)}
 const actions=node("div","rb-actions");
 actions.append(button(tr("喂食全员","Feed companions"),()=>window.UI.navigateTo(()=>window.UI.openFeed())),button(tr("急救包治疗队伍","Heal party with kits"),()=>{
 const result=window.State.useMedkitForTeam(window.UI.getPreferredBattleTeam());game().refreshHUD?.();game().toast(result.ok?tr("已治疗队伍","Party healed"):window.UI.medkitFailureText(result,tr(false,true)));inventory();
 }));
 host.append(actions);
 const recovery=node("section","rb-recovery");recovery.append(node("h3","",tr("冒险准备","Expedition recovery")));
 recovery.append(node("p","rb-rule",window.State.difficulty()==="casual"?tr("休闲模式：战后自动恢复生命。","Casual: HP refills after battle."):tr("急救包恢复35%生命；探索时每分钟恢复20%，返回花园立即休息恢复。","First-aid kits restore 35% HP. Recover 20% each minute or rest in the garden.")));
 const team=node("div","rb-recovery-grid");
 for(const [i,cat] of window.UI.getPreferredBattleTeam().entries()){
  const f=window.UI.battleCatFacts(cat),card=node("article","rb-recovery-cat"),art=node("canvas","rb-recovery-art");
  art.width=90;art.height=100;art.setAttribute("aria-hidden","true");
  const details=node("div","rb-recovery-info");
  details.append(node("strong","",window.State.catName(cat)),node("small","",tr(i<2?"首发":"替补",i<2?"Starter":"Reserve")+" · Lv."+f.level+" · "+f.elementLabel),node("small","",tr("生命 ","HP ")+f.hp+"/"+f.maxHp));
  const hp=node("progress","rb-health");hp.max=100;hp.value=f.hpPercent;hp.setAttribute("aria-label",tr("生命值","Health"));details.append(hp);
  const heal=button(tr("单猫急救","Heal cat"),()=>{const live=state().cats.find(x=>x.uid===cat.uid);if(!live)return;const result=window.State.useMedkitForHealth(live);game().refreshHUD?.();game().toast(result.ok?tr("生命已恢复","Health restored"):window.UI.medkitFailureText(result,tr(false,true)));inventory()});
  heal.disabled=f.hpPercent>=100||!(s.medkits>=1);heal.dataset.bookHeal=cat.uid;
  const gear=button(tr("技能","Skills"),()=>window.UI.navigateTo(()=>window.UI.openSkillEditor(cat)));
  const buttons=node("div","rb-recovery-actions");buttons.append(heal,gear);details.append(buttons);card.append(art,details);team.append(card);
  requestAnimationFrame(()=>{if(alive()&&art.isConnected)window.CatArt.renderCatThumb(art,window.GameData.speciesById(cat.species),cat)});
 }
 recovery.append(team);const talents=(s.cats||[]).filter(c=>companionTalents[c.storyActor]);if(talents.length){recovery.append(node("h3","",tr("伙伴专长","Companion talents")),node("p","rb-rule",tr("首发或换入战场后自动触发，每场地区战斗一次。","Triggers on the active field once per regional battle.")));for(const cat of talents){const t=companionTalents[cat.storyActor];recovery.append(node("p","rb-rule",window.State.catName(cat)+" · "+tr(...t.name)+" — "+tr(...t.description)),button(tr("试用 "+window.State.catName(cat), "Try "+window.State.catName(cat)),()=>{dismiss();mountTalentTrial(cat.storyActor);}));}}host.append(recovery,node("h3","",tr("制作配方","Crafting recipes")));
 const list=node("div","rb-recipes");list.id="rb-recipes";
 for(const recipe of recipes){const unlocked=!recipe.region||s.resonance?.sanctuaries?.includes(recipe.region);
 const card=node("article","rb-recipe");card.append(node("strong","",tr(...recipe.name)),node("p","",tr("消耗 ","Costs ")+recipe.coins+tr(" 金币 · "," coins · ")+recipe.fish+tr(" 小鱼干"," fish")),node("p","",tr("获得 ","Creates ")+recipe.count+" × "+tr(...recipe.item)));
 if(!unlocked)card.append(node("small","",tr("解锁条件：恢复","Unlock: restore ")+tr(...recipe.regionName)+tr("圣所"," sanctuary")));
 const b=button(tr("制作","Craft"),()=>{const result=craftSupply(window.State,active.owner,recipe.id);game().refreshHUD?.();game().toast(result.ok?tr("制作成功","Crafted"):tr("制作失败，资源未扣除","Could not craft; resources unchanged"));inventory(true)});
 b.dataset.bookRecipe=recipe.id;b.disabled=!unlocked||s.coins<recipe.coins||s.fish<recipe.fish;card.append(b);list.append(card)}
 host.append(list);
 if(focusCraft)requestAnimationFrame(()=>{if(alive()&&host.isConnected)list.scrollIntoView({block:"nearest"})});
}

const wishDay=()=>new Date().toISOString().slice(0,10);
const WISH_FISH=5;
function wishPull(owner){
 const s=state(),R=window.Raising,G=window.GameData,S=window.State;
 if(!alive()||s!==owner||!(s.catchCount>0)||!R||!G)return {ok:false};
 const r=R.init(),day=wishDay(),free=r.wishDay!==day;
 if(!free&&!(s.fish>=WISH_FISH))return {ok:false};
 const before={fish:s.fish,coins:s.coins,pity:r.pity.count,day:r.wishDay,total:r.wishTotal};
 const roll=R.rollGacha(0),sp=roll.species,owned=s.cats.filter(cat=>cat.species===sp.id);
 const reunion=owned.length>=2,cat=reunion?owned.reduce((a,b)=>S.catPower(a)>=S.catPower(b)?a:b):S.makeCat(sp.id,{affinity:20});
 const priorAffinity=cat.affinity,priorDex=s.dex[sp.id],bonus=reunion?({N:10,R:25,SR:60,SSR:150}[sp.rarity]||10):0;
 if(free)r.wishDay=day;else s.fish-=WISH_FISH;
 r.wishTotal=(Number(r.wishTotal)||0)+1;
 if(reunion){cat.affinity=Math.min(100,(cat.affinity||0)+10);s.coins+=bonus;}
 else{R.decorateNewCat(cat);s.cats.push(cat);}
 s.dex[sp.id]=(priorDex||0)+1;
 if(!S.save()?.ok){
  s.fish=before.fish;s.coins=before.coins;r.pity.count=before.pity;
  for(const [key,value] of [["wishDay",before.day],["wishTotal",before.total]]){if(value===undefined)delete r[key];else r[key]=value;}
  if(priorDex===undefined)delete s.dex[sp.id];else s.dex[sp.id]=priorDex;
  if(reunion)cat.affinity=priorAffinity;else s.cats.splice(s.cats.indexOf(cat),1);
  return {ok:false};
 }
 game().rebuildYard?.();game().refreshHUD?.();game().refreshCollectionGoal?.();
 window.MorrowwishAudio?.effect?.("discover");
 return {ok:true,sp,cat,reunion,bonus,free};
}
function wishes(result=null){
 const s=state(),host=shell();host.setAttribute("translate","no");
 const R=window.Raising,r=R?.init(),cap=R?.config?.PITY_CAP||40;
 host.append(node("h2","",tr("星铃祈愿","Starbell Wishes")),node("p","rb-rule",tr("向星铃许下心愿，也许会有意想不到的小伙伴回应。探索和战斗收服仍然独立可玩。","Make a wish at the Starbell. A surprising companion may answer! Exploring and befriending wild cats remain independent.")));
 if(!r||!(s.catchCount>0)){host.append(node("p","",tr("先通过战斗收服第一只野猫，再开启祈愿。","Befriend your first wild cat in battle to unlock wishes.")));return;}
 const free=r.wishDay!==wishDay(),count=Math.max(0,Number(r.pity.count)||0);
 const summary=node("div","rb-inventory");
 summary.append(stat(tr("今日免费祈愿","Daily free wish"),free?tr("可领取","Available"):tr("已领取","Claimed")),stat(tr("史诗及以上保底","Epic or better guarantee"),count+"/"+cap),stat(tr("小鱼干","Fish"),s.fish),stat(tr("累计祈愿","Total wishes"),r.wishTotal||0));
 host.append(summary);
 const progress=node("progress","rb-health");progress.max=cap;progress.value=Math.min(cap,count);progress.setAttribute("aria-label",tr("祈愿保底进度","Wish guarantee progress"));host.append(progress);
 const odds=node("div","rb-inventory");for(const k of ["N","R","SR","SSR"]){const v=window.GameData.RARITY[k];odds.append(stat(k+" · "+tr(v.name,({N:"Common",R:"Rare",SR:"Epic",SSR:"Legendary"})[k]),v.weight+"%"))}
 host.append(node("h3","",tr("基础概率","Base odds")),odds,node("p","rb-rule",tr("连续39次未出现SR或SSR时，第40次至少为SR；保底时原N/R结果转为85% SR、15% SSR。每天协调世界时零点恢复一次免费祈愿，其后每次消耗5个游戏内小鱼干。无真钱消费。","After 39 wishes without SR or SSR, wish 40 guarantees SR or better; an N/R result at guarantee becomes 85% SR or 15% SSR. One free wish resets at 00:00 UTC; further wishes cost 5 in-game fish. No real money.")));
 if(result?.ok){
  const card=node("article","rb-recipe"),art=node("canvas","rb-recovery-art");
  card.setAttribute("role","status");card.style.cssText="text-align:center;padding:16px;border:2px solid "+window.GameData.RARITY[result.sp.rarity].color+";border-radius:16px";
  art.width=180;art.height=160;art.style.cssText="display:block;margin:8px auto;max-width:100%;width:180px;height:160px";
  card.append(node("h3","",result.sp.rarity+" · "+window.GameData.speciesName(result.sp)),art,node("strong","",result.reunion?tr("熟悉的朋友再次回应！","A familiar friend answered!"):tr("新的小伙伴加入花园！","A new companion joins your garden!")),node("p","",result.reunion?tr("好感 +10（上限100） · 金币 +","Affinity +10 (max 100) · Coins +")+result.bonus:tr("已收入猫咪名册和图鉴。","Added to your roster and Catdex.")));
  host.append(card);
  requestAnimationFrame(()=>{if(alive()&&art.isConnected){window.CatArt.renderCatThumb(art,result.sp,result.cat);if(!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches)art.animate?.([{opacity:0,transform:"scale(.8)"},{opacity:1,transform:"scale(1)"}],{duration:450,easing:"ease-out"});}});
 }
 host.append(node("p","rb-rule",tr("每品种最多新增两只；再次遇见同品种会增加已有猫咪的好感并赠送金币。","Up to two new residents per breed; further matches increase an existing companion's affinity and award coins.")));
 const actions=node("div","rb-actions"),pull=button(free?tr("免费祈愿一次","Free wish"):tr("祈愿一次 · 5小鱼干","Make a wish · 5 fish"),()=>{
  pull.disabled=true;const outcome=wishPull(s);
  if(!outcome.ok){game().toast(tr("祈愿未完成，资源未扣除。","Wish not completed; resources unchanged."));wishes();attach();return;}
  wishes(outcome);attach();
 });
 pull.dataset.bookWish="true";pull.disabled=!free&&s.fish<WISH_FISH;
 actions.append(pull,button(tr("查看猫咪图鉴","Open Catdex"),()=>select("dex")));host.append(actions);
}

function records(){
 const s=state(),host=shell();host.setAttribute("translate","no");host.append(node("h2","",tr("冒险成就","Adventure records")));
 const rows=node("div","rb-inventory"),discovered=Object.values(s.dex||{}).filter(n=>n>0).length;
 for(const [zh,en,v] of [["发现品种","Breeds discovered",discovered+"/"+window.GameData.SPECIES.length],["金爪徽章","Golden Paw medals",Object.values(s.masteryBadges||{}).filter(Boolean).length],["捕捉次数","Captures",s.catchCount||0],["猫咪互动","Cat interactions",s.petCount||0],["恢复圣所","Restored sanctuaries",(s.resonance?.sanctuaries?.length||0)+"/6"],["旋律","Melodies",(s.resonance?.melodies?.length||0)+"/6"]])rows.append(stat(tr(zh,en),v));
 host.append(rows,node("p","",tr("品种与战斗评级奖励仍可在图鉴查看和领取。","Collection and battle-grade rewards remain available in Catdex.")),button(tr("查看图鉴","Open Catdex"),()=>select("dex")));
 const keeps=earnedKeepsakes(s.resonanceExploration?.interactions),gardenNames={"ear-flower":["耳尖的小花","Little flower"],"golden-seed":["浅金色种子","Golden seed"],"fish-cake":["鱼饼","Fish cake"],"old-garden-postcard":["旧花园明信片","Old garden postcard"],"windblown-chart":["风中的航图","Windblown chart"],"revisit-qilan":["栖蓝的新航图","Skye’s new route chart"],"revisit-yahe":["芽禾的月叶新芽","Fern’s moonleaf sprout"],"revisit-xiaomao":["小栗的歪耳灯","Pip’s crooked-ear lantern"]};
 const garden=(s.sunlitGarden?.exploration?.keepsakes||[]).map(id=>gardenNames[id]).filter(Boolean);
 const names=[...garden,...keeps.map(k=>k.name)];
 host.append(node("h3","",tr("旅途纪念物","Travel keepsakes")));
 if(names.length){const list=node("div","rb-inventory");for(const [zh,en] of names)list.append(stat(tr(zh,en),"✓"));host.append(list);}else host.append(node("p","",tr("散步时留意地图中的小惊喜。","Look for little surprises as you explore.")));
 const reset=node("button","rb-reset",tr("安全重启游戏","Safe restart"));reset.type="button";reset.id="cb-menu-reset";host.append(reset);window.CatBondBindResetButton?.(reset);
}
function select(id,focusCraft=false){
 if(!alive())return false;const tab=tabs.find(t=>t[0]===id);if(!tab)return false;
 active.tab=id;window.UI.resetNavigation();
 const run=()=>{if(!alive())return false;if(id==="bag")inventory(focusCraft);else if(id==="records")records();else if(id==="wishes")wishes();else window.UI[tab[3]](...tab[4]);return true};
 window.UI._navCurrent=run;run();attach();if(alive()&&panel()?.classList.contains('open'))window.SunlitGarden?.noteBookVisit?.(id);return true
}
function open(id="cats"){
 if(!installed||blocked()||!state()?.cats?.length||panel()?.classList.contains("open"))return false;
 oldFocus=document.activeElement;active={owner:state(),scene:game().scene,tab:id};sound(true);
 if(!select(id)||!panel()?.classList.contains("open")){clear();return false}
 panel().querySelector(".rb-close")?.focus({preventScroll:true});return true
}
function install(){
 if(installed||!window.UI||!panel())return;installed=true;
 const css=node("link");css.rel="stylesheet";css.href=new URL("../../css/resonance-book.css",import.meta.url).href;document.head.append(css);
 stage()?.classList.add("rb-canonical");
 const ui=window.UI,originalPanel=ui.panel,originalClose=ui.closeAll;
 ui.panel=function(...args){const result=originalPanel.apply(this,args);if(active){if(alive())attach();else clear()}return result};
 ui.closeAll=function(...args){const focus=oldFocus,was=!!active;clear();const result=originalClose.apply(this,args);if(was){sound(false);if(focus?.isConnected)focus.focus({preventScroll:true})}return result};
 // Only the legacy expedition menu is redirected; all actual cat actions remain native.
 const oldExplore=ui.openExploreMenu;
 ui.openExploreMenu=function(...args){if(active)return select("cats");if(stage()?.classList.contains("rb-canonical"))return open();return oldExplore.apply(this,args)};
 document.getElementById("map-menu")?.addEventListener("click",e=>{if(!window.CatBondSystemMenu)return;e.stopImmediatePropagation();window.CatBondSystemMenu.open()},true);
 window.addEventListener("cat-bond-active-save-changed",()=>{if(active){ui.closeAll();panel()?.replaceChildren()}});
 window.addEventListener("morrowwish-language-change",()=>{if(!alive())return;if(active.tab==="bag"&&panel()?.querySelector(".rb-content"))inventory();else if(active.tab==="records")records();else if(active.tab==="wishes"){wishes();attach();}else attach();});
 window.addEventListener("cat-bond-resonance-changed",()=>{if(active&&!alive())ui.closeAll()});
 const guard=new MutationObserver(()=>{if(active&&!alive())ui.closeAll()});
 guard.observe(stage(),{childList:true,subtree:false,attributes:true,attributeFilter:["class"]});
 document.addEventListener("keydown",e=>{
  if(e.key!=="Escape"||!active)return;
  const viewer=document.getElementById("cb-duo-viewer"),system=document.getElementById("cb-system-menu");
  if(viewer){e.preventDefault();e.stopImmediatePropagation();viewer.querySelector(".cb-duo-viewer-close")?.click();return}
  if(system?.hidden===false){e.preventDefault();e.stopImmediatePropagation();window.CatBondSystemMenu?.close?.();return}
  if(alive()){e.preventDefault();e.stopImmediatePropagation();dismiss()}
 },true);
}
window.ResonanceBook=Object.freeze({open,isOpen:()=>alive(),close:dismiss,canOpen:()=>installed&&!blocked()});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});else install();
