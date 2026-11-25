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
 const book=node("div","rb-brand");book.append(node("small","",tr("旅人的共鸣记录","THE TRAVELER'S COMPANION")),node("strong","",tr("星铃之书","Resonance Book")));
 const home=button(tr("返回花园","Sunlit Garden"),()=>{dismiss();if(game()?.scene==="map")window.WorldMap?.exitToYard?.()},"rb-home");
 home.hidden=game()?.scene==="yard";
 const close=button(tr("关闭","Close"),dismiss,"rb-close");close.setAttribute("aria-label",tr("关闭星铃之书","Close Resonance Book"));
 mast.append(book,home,close);n.append(mast);
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
  ["library:M-03",["身份揭晓","Identity revealed"],["暮铃确认曾认识旅行者；旅行者曾将自己留在星铃中。","Muling confirmed knowing the traveler, who once left themself inside the Star Bell."]],
  ["starfall:F-02",["星坠记录","Starfall records"],["已调查星图与灾变记录。","Star map and catastrophe records investigated."]],
  ["starfall:F-03",["中央星铃计划","The central bell plan"],["暮铃想借众猫的记忆让旅行者归来。","Muling intended to use every cat's memories to bring the traveler back."]],
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
 recovery.append(team);host.append(recovery,node("h3","",tr("制作配方","Crafting recipes")));
 const list=node("div","rb-recipes");list.id="rb-recipes";
 for(const recipe of recipes){const unlocked=!recipe.region||s.resonance?.sanctuaries?.includes(recipe.region);
 const card=node("article","rb-recipe");card.append(node("strong","",tr(...recipe.name)),node("p","",tr("消耗 ","Costs ")+recipe.coins+tr(" 金币 · "," coins · ")+recipe.fish+tr(" 小鱼干"," fish")),node("p","",tr("获得 ","Creates ")+recipe.count+" × "+tr(...recipe.item)));
 if(!unlocked)card.append(node("small","",tr("解锁条件：恢复","Unlock: restore ")+tr(...recipe.regionName)+tr("圣所"," sanctuary")));
 const b=button(tr("制作","Craft"),()=>{const result=craftSupply(window.State,active.owner,recipe.id);game().refreshHUD?.();game().toast(result.ok?tr("制作成功","Crafted"):tr("制作失败，资源未扣除","Could not craft; resources unchanged"));inventory(true)});
 b.dataset.bookRecipe=recipe.id;b.disabled=!unlocked||s.coins<recipe.coins||s.fish<recipe.fish;card.append(b);list.append(card)}
 host.append(list);
 if(focusCraft)requestAnimationFrame(()=>{if(alive()&&host.isConnected)list.scrollIntoView({block:"nearest"})});
}
function records(){
 const s=state(),host=shell();host.setAttribute("translate","no");host.append(node("h2","",tr("冒险成就","Adventure records")));
 const rows=node("div","rb-inventory"),discovered=Object.values(s.dex||{}).filter(n=>n>0).length;
 for(const [zh,en,v] of [["发现品种","Breeds discovered",discovered+"/"+window.GameData.SPECIES.length],["金爪徽章","Golden Paw medals",Object.values(s.masteryBadges||{}).filter(Boolean).length],["捕捉次数","Captures",s.catchCount||0],["猫咪互动","Cat interactions",s.petCount||0],["恢复圣所","Restored sanctuaries",(s.resonance?.sanctuaries?.length||0)+"/6"],["旋律","Melodies",(s.resonance?.melodies?.length||0)+"/6"]])rows.append(stat(tr(zh,en),v));
 host.append(rows,node("p","",tr("品种与战斗评级奖励仍可在 Catdex 查看和领取。","Collection and battle-grade rewards remain available in Catdex.")),button(tr("查看 Catdex","Open Catdex"),()=>select("dex")));
 const reset=node("button","rb-reset",tr("安全重启游戏","Safe restart"));reset.type="button";reset.id="cb-menu-reset";host.append(reset);window.CatBondBindResetButton?.(reset);
}
function select(id,focusCraft=false){
 if(!alive())return false;const tab=tabs.find(t=>t[0]===id);if(!tab)return false;
 active.tab=id;window.UI.resetNavigation();
 const run=()=>{if(!alive())return false;if(id==="bag")inventory(focusCraft);else if(id==="records")records();else window.UI[tab[3]](...tab[4]);return true};
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
 window.addEventListener("morrowwish-language-change",()=>{if(!alive())return;if(active.tab==="bag"&&panel()?.querySelector(".rb-content"))inventory();else if(active.tab==="records")records();else attach();});
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
