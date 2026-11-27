import {REGIONAL_BOSSES,bossKey,optionalBossAvailable} from "./regional-bosses.mjs";
import {finaleBattleAsset} from "./finale-art.mjs?v=phase-paired-20261127";
import { campaign } from "./campaign.mjs";
import {withForeground,depthScale} from "./exploration-depth.mjs";
import {spatialControls,spatialTap,paintSpatial,chasePoint} from "./canon22-spatial.mjs";
import {chaseArt,drawPortraitChase,portraitChaseTap} from "./portrait-chase.mjs";
import {portraitAsset,projectPortrait,unprojectPortrait,projectFarwindLandscape,unprojectFarwindLandscape} from "./portrait-map.mjs";
import {hasPendingDialogue} from "./dialogue-ui.mjs";
import { openFinaleLatch } from "./finale-latch.mjs";
import { createWorldBridge } from "./world-bridge.mjs";
import {availableSideEvents} from "./side-adventures.mjs";
import {mountSideAdventure} from "./adventure-play.mjs";
import {availableDiscoveries,layoutDiscoveries,paintDiscovery} from "./regional-discoveries.mjs";
import {markerMetrics,layoutMarkerLabels,pickMarker,discoveryNames} from "./map-affordances.mjs?v=npc-talk-bubble-1";
import { createExplorer,layouts,exchangeOptions,distance } from "./world-exploration.mjs";
import {paintHarborEnvironment,paintHarborPuzzle,harborObjective,harborPuzzleHint,paintHarborCeremony,paintHarborPortraitCeremony} from "./harbor-presentation.mjs";
import {paintForgeEnvironment,paintForgeCeremony,forgeObjective,paintForgePuzzle} from "./forge-presentation.mjs";
import { echoBeaconOptions,symbol,featureIcon,puzzleWords,puzzleHit,paintPuzzle } from "./world-mechanisms.mjs";
const lang=()=>window.MorrowwishI18n?.get?.()==="zh"?"zh":"en",tr=(zh,en)=>lang()==="zh"?zh:en;
const starfallClues={"rescue:steady-channel":["芽禾：我来稳住上游！暮铃，带它沿湿水痕下去。别追那个奇怪的声音！","Fern: I'll hold the upstream channel! Luna, follow the wet trail together. Don't chase that strange voice!"],"explore:water-marks":["暮铃：水痕通向下面。干燥树根上的呼唤是幻象！","Luna: The wet marks lead down. The call from the dry roots is an illusion!"],"rescue:trapped-cats":["榆川：根须松开了！大家都出来了，水路也重新畅通了。","Rowan: The roots are loose! Everyone is out, and the channel is flowing again."],"puzzle:festival-lantern":["试验提灯安全亮起。去找小栗。","The test lantern lights safely. Find Pip."],"explore:letter-recipient":["孤岛收信员已签收 · 信袋安全送达","The island recipient signed for the delivered pouch"],"puzzle:caravan-route":["商队沿真实星标离开了险地。","The caravan followed the real stars to safety."],"explore:crater-fragment":["撞击碎片与星铃材质一致。沿星光辨认旧信标。","The impact fragment matches the Star Bell. Follow the starlight to verify the old beacons."],"puzzle:echo-navigation":["幻象的星序与真星不符。陨坑旁的星铃碎片证实了当年的撞击。用真星校准观星仪。","The illusion cannot match the real stars. The bell fragment by the crater confirms the old impact. Align the observatory with the true stars."],"explore:ruin-fragment":["六座圣所同时受损；档案指向天文台。","All six sanctuaries were damaged together. The archive points to the observatory."],"explore:catastrophe-record":["记录完整：六座古铃在同一天损坏。回到中央遗迹，看看当年发生了什么。","The record is complete: all six old bells fell silent on the same day. Return to the central ruins to discover what happened."]};
const W=960,H=540,nodes=[["harbor",.5,.18],["forest",.79,.33],["forge",.79,.68],["sky",.5,.85],["library",.21,.68],["starfall",.21,.33]];
const pools={
 harbor:["biscuit","shell","ripplet","cinder","tidemark"],
 forest:["puff","biscuit","clover","mossbell"],
 forge:["biscuit","inkspot","cinder","fizz","emberwing"],
 sky:["shell","puff","sunlace","fizz","zest"],
 library:["inkspot","shell","button","sunlace","nightloom"],
 starfall:["puff","inkspot","clover","ripplet","zest","aurora","nightloom"]
};
const ruinsPoint=[.23,.78];
const duoMemories={harbor:"creek",forest:"sakura",forge:"volcano",starfall:"ruins"};
const cargoNames={"beacon-supply-vessel":["灯塔引航物资","Beacon-guided supplies"],"herbs-waterway-map":["药材与水路图","Herbs and waterway map"],"cooling-plans-herbs":["冷却水与药材","Cooling water and herbs"],"pumps-tools":["水泵与工具","Pumps and tools"],"wind-vanes-flight-parts":["风向仪与飞行部件","Wind vanes and flight parts"],"wind-data-airship-route":["风况与飞艇航路","Wind data and airship route"],"courier-route":["信使航线","Courier route"],"archived-flight-maps":["旧航图与档案","Archived flight maps"],"star-chart-coordinates":["星图及坐标","Star chart and coordinates"],"astronomical-observations":["天文观测记录","Astronomical observations"],"navigation-bell-compass":["导航铃与星罗盘","Navigation bell and star compass"],"beacon-response":["港口航行回报","Harbor navigation response"]};
const cargoName=id=>cargoNames[id]?tr(...cargoNames[id]):id;
import {libraryWords,libraryBlocked,paintLibraryEnvironment,routeGesture} from "./library-mechanisms.mjs";
import {paintSkyFlight,paintSkyWeather,skyLaunch,skyPartsReady,canLandSkyFlight} from "./sky-flight.mjs";


// Preserve existing rarity odds; a region filters species, not the rarity distribution.
function pickWild(ids,luck=0,preferNew=false){
 const species=ids.map(id=>GameData.speciesById(id)).filter(Boolean),tiers=[...new Set(species.map(s=>s.rarity))];
 const weights=tiers.map(t=>(GameData.RARITY[t]?.weight||0)*(t==="N"?1-luck*.6:1+luck*({R:1,SR:2,SSR:3}[t]||0)));
 let roll=Math.random()*weights.reduce((a,b)=>a+b,0),tier=tiers.at(-1);
 for(let i=0;i<tiers.length;i++){roll-=weights[i];if(roll<0){tier=tiers[i];break;}}
 const group=species.filter(s=>s.rarity===tier),newCats=group.filter(s=>!State.S.dex?.[s.id]);
 const pool=preferNew&&newCats.length&&Math.random()<.65?newCats:group;
 return pool[Math.floor(Math.random()*pool.length)];
}
const regions=nodes.map(([id,x,y],i)=>({id,x,y,name:layouts[id].name[0],sub:layouts[id].name[1],speciesPool:pools[id],difficulty:i+1,theme:{region:id},unlock:i?{after:nodes[i-1][0]}:null}));
function install(){
 let W=960,H=540;
 const portraitMap=()=>portraitLayout()&&(mode==="map"||mode==="region"&&!!explorer&&!explorer.puzzle&&!ceremony);
 const portraitId=()=>mode==="map"?"atlas":current().world().location;
 const portraitRemote=()=>!!explorer?.survey()?.remote;
 const fixedFinale=()=>mode==="region"&&current().world().location==="finale";
 const wideRemoteMap=()=>!portraitMap()&&mode==="region"&&!!explorer&&!explorer.puzzle&&!ceremony&&current().world().location==="sky"&&portraitRemote();
 const nativeHarborCeremony=()=>portraitLayout()&&ceremony?.region==='harbor';
 const nativeCeremonyFile=()=>portraitLayout()&&ceremony?(ceremony.region==='harbor'?'harbor-ceremony-matched.webp':portraitAsset(ceremony.region)):null;
 function nativePuzzleFile(){const p=explorer?.puzzle;if(!portraitLayout()||!p)return null;return p.spatial?.kind==="bridge"?"forest-moonleaf-bridge.webp":p.spatial?.kind==="light"?(p.operation==="puzzle:lantern-show"?"lantern-shadow-square.webp":"lantern-vault.webp"):p.type==="skyFlight"?"sky-glide.webp":p.spatial?.kind==="chase"?"harbor-chase.webp":(["blueprint","lanternFocus"].includes(p.type)||current().world().location==="harbor"&&["tide","mirrors","rescue"].includes(p.type))?null:portraitAsset(current().world().location);}
 function nativeImage(file){const key="portrait:"+file;if(art[key])return art[key];const im=new Image();art[key]=im;im.onload=()=>{if(canvas)draw();};im.src=new URL("../../assets/mobile-portrait/"+file,import.meta.url).href;return im;}
 function nativePlate(im){const k=Math.max(W/im.naturalWidth,H/im.naturalHeight),w=im.naturalWidth*k,h=im.naturalHeight*k;ctx.drawImage(im,(W-w)/2,(H-h)/2,w,h);}

 const project=p=>portraitMap()?projectPortrait(portraitId(),p,portraitRemote()):wideRemoteMap()?projectFarwindLandscape(p):p;
 const unproject=p=>portraitMap()?unprojectPortrait(portraitId(),p,portraitRemote()):wideRemoteMap()?unprojectFarwindLandscape(p):p;
 function setMapGeometry(){const p=portraitMap();const native=nativePuzzleFile()||nativeCeremonyFile(),shell=canvas?.parentElement?.getBoundingClientRect();W=p?(portraitId()==='library'?574:540):native?640:960;H=p?960:native&&shell?.width>0?Math.max(400,Math.round(W*shell.height/shell.width)):540;if(canvas){canvas.dataset.logicalWidth=String(W);canvas.dataset.logicalHeight=String(H);canvas.style.setProperty('--rw-map-ratio',W+'/'+H);canvas.style.setProperty('--rw-map-width-ratio',String(W/H));}return p;}
 function sceneArt(id){if(id==="finale"){const file=finaleBattleAsset(current().view().current?.id,portraitMap());return image("finale:"+file);}if(id==="sky"&&wideRemoteMap())return image("sky-farwind-wide");const file=portraitMap()?(id==='harbor'&&current().view().melodies.includes('harbor')?'harbor-ceremony-matched.webp':portraitAsset(id,portraitRemote())):null;if(!file)return image(id);return nativeImage(file);}
 function drawMapPlate(img){if(portraitMap())ctx.drawImage(img,0,0,W,H);else if(nativePuzzleFile())nativePlate(img);else window.CatBondSceneFit.draw(ctx,img,W,H);}

 let fitPage=0,fitKey="",fitNotice="",fitObserver=null,fitFrame=0;
 let lastPortrait=null,regionMenuOpen=false,atlasMenuOpen=false,optionalOpen=null,cargoOpen=null;
 let demoPuzzle=null,demoActive=false,demoGeneration=0,demoShown=false,demoIndex=-1;
 const melodyShapes=["●","◆","✿"],melodyNames=[["露珠","Dew"],["星光","Starlight"],["花铃","Flower bell"]];
 const pitches={harbor:[261.63,329.63,392],forest:[392,523.25,659.25],forge:[261.63,329.63,392],sky:[392,523.25,659.25],library:[329.63,440,587.33],starfall:[329.63,493.88,659.25]};
 function melodyNote(p,i){const region=p.operation.split(":")[1],hz=pitches[region]?.[i];if(!hz)return;window.MorrowwishMusic?.duckFor?.(650);if(region==="forest"&&window.MorrowwishMusic?.qualityCue?.(["bell-g4","bell-c5","bell-e5"][i],hz))return;if(!window.MorrowwishMusic?.cue?.("melody",hz))window.MorrowwishAudio?.note?.(hz,.36,.16);}
 function stopDemo(){window.MorrowwishMusic?.stopQuality?.();demoGeneration++;demoActive=false;demoIndex=-1;demoPuzzle=null;demoShown=false;}
 function addMelodyControls(row,p){
  if(demoPuzzle!==p.operation){stopDemo();demoPuzzle=p.operation;}
  row.classList.add("rw-quality-puzzle");const phrase=E("div","rw-quality-phrase");phrase.setAttribute("role","status");
  if(p.residentLead){const instructions={forest:["林间的居民已经回铃。敲响最后一音。","The forest residents have answered. Ring the final note."],forge:["居民已点亮两盏节灯，点亮最后一盏。","The residents lit two festival lamps. Light the final lamp."],sky:["居民已经回铃，送出最后一道风讯。","The residents have answered. Send the final wind signal."],library:["两位馆员已经回铃，为记忆补上最后一音。","The archivists have answered. Add the final note to the memory."],starfall:["邻地已准备就绪，敲响最后一音，聆听六地回应。","The neighboring regions are ready. Ring the final note and hear all six reply."]};const target=p.goal[2];phrase.textContent=tr(...instructions[p.operation.split(":")[1]]);const button=B(melodyShapes[target]+" "+tr(...melodyNames[target]),()=>operate(target),!!ceremony);button.setAttribute("aria-label",tr(...melodyNames[target])+" · "+tr(...[["低音","Low"],["中音","Middle"],["高音","High"]][target]));button.dataset.note=String(target);row.append(phrase,button);return;}
  const updatePhrase=()=>{row.dataset.demoState=demoActive?"playing":demoShown?"complete":"ready";phrase.replaceChildren(E("span","",demoActive?tr("聆听示范","Listen to the example"):p.mistakes?tr("试试当前这一格","Try the current step"):tr("播放示范，按顺序跟奏","Play the example, then echo it")));
   p.goal.forEach((n,j)=>{const done=j<p.values.length,visible=done||demoShown||j===demoIndex||(p.mistakes>0&&j===p.values.length);const step=E("span","rw-quality-step",(j+1)+" "+(visible?melodyShapes[n]:"·")+(done?" ✓":""));step.dataset.current=String(j===(demoActive?demoIndex:p.values.length));phrase.append(step);});};
  const keys=p.goal.map((_,i)=>{const b=B(melodyShapes[i]+" "+tr(...melodyNames[i]),()=>operate(i),!!ceremony||demoActive);b.setAttribute("aria-label",tr(...melodyNames[i])+" · "+tr(...[["低音","Low"],["中音","Middle"],["高音","High"]][i]));b.dataset.note=String(i);return b;});
  const keypad=E("div","rw-quality-cards");keypad.append(...keys);
  const demo=B(tr("播放示范","Play example"),()=>{if(demoActive)return;demoActive=true;const token=++demoGeneration,owner=State.S;demo.disabled=true;keys.forEach(b=>b.disabled=true);updatePhrase();
   const demoExplorer=explorer;const live=()=>token===demoGeneration&&owner===State.S&&game.scene==="map"&&explorer===demoExplorer&&explorer?.puzzle?.operation===p.operation&&row.isConnected;
   p.goal.forEach((n,j)=>setTimeout(()=>{if(!live())return;demoIndex=j;updatePhrase();keys.forEach((b,i)=>b.dataset.highlight=String(i===n));melodyNote(p,n);draw();},j*650));
   setTimeout(()=>{if(!live())return;demoActive=false;demoShown=true;demoIndex=-1;demo.disabled=false;keys.forEach(b=>{b.disabled=false;delete b.dataset.highlight;});updatePhrase();draw();},p.goal.length*650);
  },!!ceremony||demoActive);demo.classList.add("rw-melody-demo");updatePhrase();row.append(phrase,keypad,demo);
 }
 function portraitLayout(){return matchMedia("(orientation:portrait) and (max-width:700px)").matches;}
 function scheduleFit(){if(fitFrame)return;fitFrame=requestAnimationFrame(()=>{fitFrame=0;if(!host||host.hidden)return;const p=portraitLayout();if(lastPortrait!==null&&lastPortrait!==p){zoom=1;pan=[0,0];followCamera=false;render();return;}fitRail();draw();});}
 function fitRail(){
  if(!host||host.hidden||!host.isConnected)return;
  const rail=host.querySelector(".rw-fit-rail"),head=host.querySelector(".rw-head");
  if(!rail||!head||host.classList.contains("rw-dedicated-puzzle"))return;
  const stage=host.parentElement,bar=stage.querySelector("#cb-header"),frame=stage.getBoundingClientRect();
  const top=Math.max(44,Math.ceil((bar?.getBoundingClientRect().bottom||frame.top+42)-frame.top+4));
  host.style.setProperty("--rw-header-clearance",top+"px");
  const wide=host.clientWidth>=500&&host.clientWidth>host.clientHeight*1.18;
  host.classList.toggle("rw-fit-wide",wide);
  host.classList.toggle("rw-atlas-wide",wide&&mode==="map");
  host.classList.toggle("rw-forest-landscape",wide&&mode==="region");
  const style=getComputedStyle(host),available=host.clientHeight-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom)-head.offsetHeight-12;
  const limit=Math.max(104,Math.floor(wide?available:Math.min(available-100,available*.67)));
  host.style.setProperty("--rw-rail-limit",limit+"px");
  if(mode==="map"||host.classList.contains("rw-region-compact")){
   const portrait=portraitLayout(),menu=rail.querySelector(".rw-atlas-menu"),camera=rail.querySelector(".rw-menu-camera"),toggle=host.querySelector(".rw-region-toggle");
   if(menu)menu.open=atlasMenuOpen;
   if(camera)camera.hidden=!portrait;
   if(mode==="region"){rail.hidden=!regionMenuOpen;toggle?.setAttribute("aria-expanded",String(!rail.hidden));}
   host.dataset.fitPages="1";host.dataset.fitPage="0";return;
  }
  const pager=rail.querySelector(".rw-fit-pages"),items=[...rail.children].filter(el=>el!==pager);
  for(const el of items){el.removeAttribute("data-fit-hidden");for(const child of el.querySelectorAll("[data-fit-hidden]"))child.removeAttribute("data-fit-hidden");}
  pager.hidden=true;
  const gap=4,measure=el=>Math.ceil(el.getBoundingClientRect().height)+gap;
  const heights=items.map(measure),total=heights.reduce((a,b)=>a+b,0),pages=[];
  if(total<=limit){fitPage=0;host.dataset.fitPages="1";host.dataset.fitPage="0";return;}
  const room=Math.max(64,limit-40);let group=[],height=0;
  const flush=()=>{if(group.length)pages.push(group);group=[];height=0;};
  for(let i=0;i<items.length;i++){
   const el=items[i],buttons=[...el.children].filter(c=>c.tagName==="BUTTON");
   if(heights[i]>room&&buttons.length>1){
    flush();
    // Split an unusually long action grid by its real rendered rows. Keep
    // its pressure/status/cargo instructions on every page, not offscreen.
    const rows=[];
    for(const btn of buttons){const b=btn.getBoundingClientRect();let row=rows.find(r=>Math.abs(r.top-b.top)<2);if(!row){row={top:b.top,height:0,buttons:[]};rows.push(row);}row.height=Math.max(row.height,b.height+gap);row.buttons.push(btn);}
    const fixed=[...el.children].filter(c=>c.tagName!=="BUTTON").reduce((h,c)=>h+measure(c),gap);
    let subset=[],used=fixed;
    for(const row of rows){if(subset.length&&used+row.height>room){pages.push([{el,buttons:subset}]);subset=[];used=fixed;}subset.push(...row.buttons);used+=row.height;}
    if(subset.length)pages.push([{el,buttons:subset}]);
   }else{
    if(group.length&&height+heights[i]>room)flush();
    group.push({el,buttons:null});height+=heights[i];
   }
  }
  flush();
  fitPage=Math.min(fitPage,pages.length-1);
  function select(n){
   fitPage=Math.max(0,Math.min(n,pages.length-1));
   const selected=new Map(pages[fitPage].map(entry=>[entry.el,entry]));
   for(const el of items){const entry=selected.get(el);el.toggleAttribute("data-fit-hidden",!entry);
    for(const child of el.children)if(child.tagName==="BUTTON")child.toggleAttribute("data-fit-hidden",!!entry?.buttons&&!entry.buttons.includes(child));
   }
   pager.querySelector("[data-fit-prev]").disabled=fitPage===0;
   pager.querySelector("[data-fit-next]").disabled=fitPage===pages.length-1;
   pager.querySelector("output").textContent=(fitPage+1)+" / "+pages.length;
   host.dataset.fitPages=String(pages.length);host.dataset.fitPage=String(fitPage);
  }
  pager.hidden=pages.length<2;
  pager.querySelector("[data-fit-prev]").fitNavigate=()=>select(fitPage-1);
  pager.querySelector("[data-fit-next]").fitNavigate=()=>select(fitPage+1);
  select(fitPage);
 }
 function makeFitRail(head,shell){
  const activePuzzle=explorer?.puzzle,festival=activePuzzle?.operation==="puzzle:lantern-show";
  host.classList.toggle("rw-festival-story",festival);
  host.classList.toggle("rw-story-ceremony",!!ceremony);
  host.classList.toggle("rw-chase-mode",activePuzzle?.spatial?.kind==="chase");
  // A dedicated playfield is not a compact exploration grid. Clear the old
  // layout before the early returns; otherwise grid-area and camera cover rules survive.
  if(activePuzzle||ceremony)host.classList.remove("rw-region-compact","rw-fit-wide","rw-forest-landscape");
  host.classList.toggle("rw-dedicated-puzzle",!!activePuzzle&&!festival&&activePuzzle.spatial?.kind!=="chase"&&!ceremony);
  const native=nativePuzzleFile(),backdrop=native||(activePuzzle&&portraitLayout()?portraitAsset(current().world().location):null);host.classList.toggle("rw-native-puzzle",!!native);if(backdrop){host.style.setProperty("--rw-puzzle-art",`url("${new URL("../../assets/mobile-portrait/"+backdrop,import.meta.url).href}")`);}else host.style.removeProperty("--rw-puzzle-art");
  if(ceremony){
   // Let the story payoff breathe. No inactive controls or quest checklists
   // over the ceremony; progress still commits only after the live animation.
   for(const n of [...host.children])if(n!==shell)n.remove();
   const caption=E("div","rw-ceremony-caption");caption.setAttribute("role","status");
   caption.append(E("strong","",tr("听，大家在回应","Listen, they're answering")),E("span","",tr("这一次，每座铃都唱着自己的歌。","This time, each bell sings its own song.")));
   host.append(caption);return;
  }
  if(festival){
   const row=host.querySelector(".rw-puzzle-controls"),p=activePuzzle.spatial;
   if(row){
    const card=E("section","rw-festival-card");card.setAttribute("aria-label",tr("皮影戏","Shadow puppet show"));
    const actor=campaign.cast.xiaomao.name;
    const title=E("strong","rw-festival-title",tr(`${actor.zh}的第一场皮影戏`,`${actor.en}’s First Shadow Puppet Show`));
    const dialogue=p.audience?tr(["快看，他们喜欢这条鱼！","蝴蝶飞起来了！大家都在看呢。","原来歪耳朵也能这么可爱！"][p.shape],["Look, they love the fish!","The butterfly is flying! Everyone is watching.","Even a crooked ear can be cute!"][p.shape]):tr("我的歪耳灯没人来看……你愿意陪我演一场吗？","Nobody came to see my crooked-ear lantern. Will you put on a show with me?");
    const line=E("p","rw-festival-line",tr(`${actor.zh}：`,`${actor.en}: `)+dialogue);
    line.setAttribute("aria-live","polite");
    const hint=E("p","rw-festival-hint",tr("选一个影子就好。也可以左右拖动灯光，不用得分。","Choose any shadow. Drag the light if you like; there is no score."));
    const buttons=[...row.querySelectorAll("button")];const leave=buttons.pop();if(leave)leave.remove();
    buttons.slice(0,3).forEach((button,i)=>{button.setAttribute("aria-pressed",String(p.shape===i));button.dataset.minigameKey=String(i+1);});
    const finish=buttons.at(-1);if(finish){finish.classList.add("rw-festival-finish");finish.dataset.minigameKey="4";}
    for(const n of [...host.children])if(n!==head&&n!==shell&&n!==row)n.remove();
    card.append(title,line,hint,row);host.append(card);
    canvas.focus({preventScroll:true});return;
   }
  }
  if(activePuzzle&&activePuzzle.spatial?.kind!=="chase"&&!ceremony){
   const p=activePuzzle,row=host.querySelector(".rw-puzzle-controls");
   if(row){
    const rail=E("aside","rw-fit-rail rw-dedicated-rail");rail.setAttribute("aria-label",tr("小游戏目标与操作","Minigame goal and controls"));
    const guide=p.type==="canonSpatial"?(p.spatial.kind==="bridge"?[(p.operation==="puzzle:moonleaf-loop"?["打破森林回环","Break the forest loop"]:["跨过月叶桥","Cross the moonleaf bridge"]),(p.operation==="puzzle:moonleaf-loop"?["上次连通的方向已经变了。先找到现在亮着的桥，再沿它走出回环。","The route has changed. Find the bridge that is lit now and follow it out of the loop."]:["点击发光落脚点前进，在岔路选择树冠或蘑菇洞穴。","Tap a glowing landing to move; choose the canopy or mushroom path at the fork."])]:p.spatial.kind==="stars"?[["踏着星光到达对岸","Reach the far side on starlight"],["点击发亮的相邻星石跳过去，暗色星石不可到达。","Tap a lit neighboring stone to jump. Dark stones are out of reach."]]:p.operation==="puzzle:lantern-show"?[["为小猫表演灯影","Put on a shadow show"],["选择影子形状，拖动灯光观察变化，准备好后继续庆典。","Pick a shadow shape, drag the light to experiment, then continue the festival."]]:[["寻找三只影子猫","Find three hiding shadow cats"],["拖动灯光，照亮闪烁的眼睛。找到三只影子猫后继续。","Drag the light over the glimmering eyes. Find all three shadow cats, then continue."]]):p.type==="skyFlight"?[["安全滑翔到目的地","Glide safely to the destination"],["拖动控制高度，沿云朵上方或下方飞行；羽毛可以选收，撞云只会减速。","Drag to steer above or below the clouds. Feathers are optional; clouds only slow you down."]]:libraryWords(p)||puzzleWords[p.type];
    const title=E("strong","rw-minigame-title",tr(...(guide?.[0]||["完成机关","Complete the mechanism"]))),hint=E("p","rw-minigame-hint",tr(...(guide?.[1]||["点击场景中的机关，或使用下方操作按钮。","Interact with the scene or use the controls below."])));
    const progress=E("p","rw-minigame-progress");progress.setAttribute("role","status");
    if(p.type==="lanternFocus")progress.textContent=tr("已点亮星灯 ","Star lanterns lit ")+p.values.filter((v,i)=>v===p.goal[i]).length+"/"+p.goal.length;
    else if(["mirrors","stars","water","libraryMirrors"].includes(p.type))progress.textContent=tr("已对准 ","Aligned ")+p.values.filter((v,i)=>v===p.goal[i]).length+"/"+p.goal.length;
    else if(p.operation==="puzzle:distributed-routing")progress.textContent=tr("摇铃后，留意哪几处先亮起来。","Ring and watch which places light up first.");
    else if(p.type==="libraryRoutes")progress.textContent=tr("已体验路线 ","Routes explored ")+(p.routeSeen?.length||0)+"/2";
    else if(p.type==="librarySeal")progress.textContent=tr("已查看记忆 ","Memories viewed ")+(p.seen?.length||0)+"/3";
    else if(p.type==="canonSpatial"&&p.spatial.kind==="bridge")progress.textContent=p.spatial.warning?tr("请选择发光的落脚点。","Choose a glowing landing."):tr("沿相连的桥面前进","Follow the connected bridge");
    else if(p.type==="canonSpatial"&&p.spatial.kind==="stars")progress.textContent=p.spatial.warning?tr("请选发亮的相邻星石。","Choose a lit neighboring stone."):"";
    else if(p.type==="canonSpatial"&&p.spatial.kind==="light"&&p.operation!=="puzzle:lantern-show")progress.textContent=tr("已找到 ","Found ")+p.spatial.discoveries.filter(x=>x.startsWith("found-shadow-")).length+"/3";
    else if(p.type==="canonSpatial"||p.type==="skyFlight"||p.type==="libraryCompanion"||p.type==="libraryLedger")progress.textContent="";
    else if(p.goal?.length)progress.textContent=tr("进度 ","Progress ")+p.values.length+"/"+p.goal.length+(p.mistakes?tr(" · 刚才的操作未成功，请参照提示重试"," · That action did not work; follow the hint and retry"):"");
    const goal=E("div","rw-minigame-goal");goal.append(title,hint);if(progress.textContent)goal.append(progress);
    const buttons=[...row.querySelectorAll("button")];const leave=buttons.pop();if(leave){leave.classList.add("rw-minigame-leave");goal.append(leave);}const message=host.querySelector(".rw-notice");if(message){message.setAttribute("role","status");goal.append(message);}
    for(const n of [...host.children])if(n!==head&&n!==shell&&n!==row)n.remove();
    rail.append(goal,row);host.append(rail);
    host.dataset.fitPages="1";host.dataset.fitPage="0";
    const controls=[...row.querySelectorAll("button")];controls.forEach((button,i)=>{if(i<9){button.dataset.minigameKey=String(i+1);button.setAttribute("aria-keyshortcuts",String(i+1));}});
    canvas.focus({preventScroll:true});return;
   }
  }
  if(explorer?.puzzle?.spatial?.kind==="chase"){
   for(const n of [...host.children])if(n!==head&&n!==shell)n.remove();
   const bar=E("aside","rw-chase-bar");bar.dataset.spatial="chase";const hint=E("span","rw-chase-status");hint.dataset.chaseStatus="";const p=explorer.puzzle.spatial;
   const follow=B(p.readyPounce?tr("扑住铃光","Pounce!"):tr("追上铃光","Chase the light"),()=>{const q=explorer?.puzzle?.spatial;if(q&&!q.chaseActive){const [x,y]=chasePoint(q);chaseInput({type:"target",x,y});}});follow.dataset.chaseFollow="";follow.disabled=p.chaseActive;
   const shortcut=B(tr("翻过低墙","Jump the low wall"),()=>chaseInput({type:"jump"}));shortcut.dataset.chaseShortcut="";shortcut.hidden=p.phase!==1;shortcut.disabled=p.chaseActive;
   hint.textContent=tr("街巷追逐 ","Street chase ")+(p.phase+1)+"/3 · "+tr("点击铃光继续","Tap the light to continue");bar.append(hint,follow,shortcut,B(tr("退出","Leave"),()=>{explorer.cancel();render();}));host.append(bar);
   canvas.focus({preventScroll:true});return;
  }
  const rail=E("aside","rw-fit-rail "+(mode==="map"?"rw-atlas-rail":"rw-forest-rail"));
  rail.setAttribute("aria-label",tr("剧情与探索操作","Story and exploration controls"));
  const priority=el=>el.matches(".rw-puzzle-controls")?-4:el.matches(".rw-objective")?-3:el.matches(".rw-notice")?-2:el.matches(".rw-forge-release")?-1:el.matches(".rw-starfall-summary")&&host.dataset.region==="starfall"&&!explorer?.puzzle?-0.5:el.matches(".rw-puzzle-controls,.rw-world-actions,.rw-system-nav")?0:el.matches(".rw-objective")?1:el.matches(".rw-regions,.rw-cargo")?2:el.matches(".rw-controls")?3:4;
  const items=[...host.children].filter(n=>n!==head&&n!==shell);
  const message=items.find(n=>n.matches(".rw-notice"));const messageText=message?.textContent||"";
  if(messageText!==fitNotice){fitNotice=messageText;if(messageText){fitPage=0;message.setAttribute("role","status");message.setAttribute("aria-live","polite");}}
  const puzzle=items.find(el=>el.matches(".rw-puzzle-controls")),guide=items.find(el=>el.matches(".rw-harbor-guide"));
  if(puzzle&&guide){puzzle.prepend(guide);items.splice(items.indexOf(guide),1);}
  items.sort((a,b)=>priority(a)-priority(b));
  const currentHeading=host.querySelector(".rw-current strong"),brand=head.querySelector(".rw-brand");
  if(currentHeading&&brand){const summary=E("span","rw-fit-summary",currentHeading.textContent);summary.title=currentHeading.textContent;brand.append(summary);}
  if(mode==="map"){
   const menu=E("details","rw-atlas-menu");
   menu.open=atlasMenuOpen;
   menu.append(E("summary","",tr("旅程与地区","Journey and regions")));
   for(const item of items){
    if(item.matches(".rw-notice"))continue;
    menu.append(item);
   }
   menu.addEventListener("toggle",()=>{if(menu.isConnected)atlasMenuOpen=menu.open;});
   rail.append(menu);
   host.append(rail);
   fitRail();
   return;
  }
  const compact=!puzzle&&!ceremony;
  host.classList.toggle("rw-region-compact",compact);
  if(compact){
   const view=current().view();
   const upcoming=view.current?.chapter;
   const nextRegion=layouts[upcoming];
   if(!head.querySelector("[data-next-scene]")&&nextRegion&&upcoming!==current().world().location&&(view.regions.includes(upcoming)||(upcoming==="finale"&&view.ring))&&!current().world().cargo){
    const journey=B(tr("继续旅程 · ","Continue journey · ")+tr(...nextRegion.name),()=>enterRegion(upcoming));
    journey.classList.add("rw-journey-action");
    rail.append(journey);
   }
   const hint=host.querySelector(".rw-next");
   if(hint&&brand){const summary=brand.querySelector(".rw-fit-summary");if(summary){summary.textContent=hint.textContent;summary.title=hint.textContent;}}
   const guardians=items.some(item=>item.querySelector("[data-regional-boss]"));
   const toggle=B(guardians?tr("探索与挑战","Explore & challenges"):tr("探索操作","Explore actions"),()=>{
    regionMenuOpen=!regionMenuOpen;
    rail.hidden=!regionMenuOpen;
    toggle.setAttribute("aria-expanded",String(regionMenuOpen));
    if(regionMenuOpen)fitRail();
   });
   toggle.classList.add("rw-region-toggle");
   toggle.setAttribute("aria-controls","rw-region-actions");
   toggle.setAttribute("aria-expanded",String(regionMenuOpen));
   rail.id="rw-region-actions";
   rail.hidden=!regionMenuOpen;
   toggle.setAttribute("aria-expanded",String(!rail.hidden));
   const camera=items.find(el=>el.matches(".rw-camera-controls"));
   if(camera){camera.classList.add("rw-menu-camera");camera.hidden=!portraitLayout();}
   if(message){items.splice(items.indexOf(message),1);message.classList.add("rw-floating-notice");}
   host.append(toggle);
  }
  for(const el of items)rail.append(el);
  const pager=E("nav","rw-fit-pages"),prev=B(tr("上一组","Previous"),()=>prev.fitNavigate?.()),next=B(tr("下一组操作","More actions"),()=>next.fitNavigate?.()),counter=E("output","","");
  prev.dataset.fitPrev="";next.dataset.fitNext="";counter.setAttribute("aria-live","polite");
  pager.append(prev,counter,next);pager.hidden=true;rail.append(pager);host.append(rail);
  fitRail();
 }
 let game,bridge,explorer,host,canvas,ctx,slot,mode="map",revision="",frame=0,encounter,exit,notice="",pending=null,wild=null,wildRegion=null,spawnDelay=0,zoom=1,pan=[0,0],followCamera=false,initialExploreCamera=false,drag=null,pointers=new Map(),pinch=0,dragged=false,selectedRoute=null,art={},ceremony=null;
 const E=(tag,cl,t)=>{const e=document.createElement(tag);if(cl)e.className=cl;if(t!==undefined)e.textContent=t;return e},B=(t,fn,disabled=false)=>{const e=E("button","rw-button",t);e.type="button";e.disabled=disabled;const owner=State.S;const activate=()=>{if(!e.disabled&&owner===State.S&&e.isConnected&&game?.scene==="map")return fn()};let touch=null,lastTouch=-Infinity;
 // Native touch gesture activation: a stationary finger opens the real world control.
 // Scrolling, pinching, cancellation, detached controls and stale save slots never activate.
 e.addEventListener("touchstart",event=>{const t=event.changedTouches[0];touch=event.touches.length===1&&t?{id:t.identifier,x:t.clientX,y:t.clientY}:null;},{passive:true});
 e.addEventListener("touchmove",event=>{if(!touch)return;const t=[...event.changedTouches].find(t=>t.identifier===touch.id);if(event.touches.length!==1||!t||Math.hypot(t.clientX-touch.x,t.clientY-touch.y)>10)touch=null;},{passive:true});
 e.addEventListener("touchcancel",()=>{touch=null;},{passive:true});
 e.addEventListener("touchend",event=>{const start=touch;touch=null;if(!start||event.touches.length||e.disabled||!e.isConnected||owner!==State.S||game?.scene!=="map")return;const t=[...event.changedTouches].find(t=>t.identifier===start.id);if(!t||Math.hypot(t.clientX-start.x,t.clientY-start.y)>10||!e.contains(document.elementFromPoint(t.clientX,t.clientY)))return;event.preventDefault();lastTouch=performance.now();activate();},{passive:false});
 e.onclick=event=>{if(event?.detail!==0&&performance.now()-lastTouch<750)return;return activate();};return e};
 function current(){if(slot!==State.S){clearRewardPopup();stopDemo();regionMenuOpen=false;atlasMenuOpen=false;optionalOpen=cargoOpen=null;ceremony=null;slot=State.S;bridge=createWorldBridge(State);explorer=null;mode="map";pending=null;wild=null;wildRegion=null;spawnDelay=0;zoom=1;pan=[0,0];followCamera=false;notice="";selectedRoute=null;revision="";drag=null;dragged=false;pinch=0;pointers.clear();}return bridge;}
 const sync=()=>{let v=current().view();return v.current?.id+":"+v.cursor+":"+v.choice+":"+v.objective.join(",")+":"+JSON.stringify(v.links)+":"+JSON.stringify(v.postgame)+":"+JSON.stringify(State.S.resonance?.ambientDone||[])};
 function init(g){game=g;current();if(host)return;host=E("section","rw-world");image("forge");host.hidden=true;document.getElementById("stage").append(host);for(let ev of ["morrowwish-language-change","cat-bond-resonance-changed"])window.addEventListener(ev,()=>{if(game.scene==="map")render()});
  if(typeof window.ResizeObserver==="function"){fitObserver=new window.ResizeObserver(scheduleFit);fitObserver.observe(host.parentElement);}
  for(const event of ["resize","orientationchange","morrowwish-fullscreen-change"])window.addEventListener(event,scheduleFit);
  window.visualViewport?.addEventListener("resize",scheduleFit);
  document.addEventListener("fullscreenchange",scheduleFit);
  window.addEventListener("cat-bond-active-save-changed",()=>{
   current();host.replaceChildren();host.hidden=true;canvas=ctx=null;
   if(game.scene==="map")render();
  });}
 function enterMap(){current();initialExploreCamera=false;clearRewardPopup();stopDemo();host?.classList.remove("rw-region-compact");atlasMenuOpen=portraitLayout();regionMenuOpen=false;optionalOpen=cargoOpen=null;ceremony=null;mode="map";explorer=null;pending=null;notice="";selectedRoute=null;zoom=1;pan=[0,0];followCamera=false;render();return true;}
 function enterRegion(id){const b=current();clearRewardPopup();stopDemo();regionMenuOpen=false;ceremony=null;const r=b.enter(id);if(!r.ok){notice=tr("暂时无法前往","Cannot travel yet")+" · "+reason(r.reason);render();return false;}mode="region";initialExploreCamera=true;explorer=createExplorer(b,id,{deferForestMelody:true,deferSkyMelody:true,deferForgeMelody:true,deferHarborMelody:true,deferLibraryMelody:true,deferStarfallMelody:true,adventureActions:true});pending=null;notice="";zoom=explorationZoom();pan=[0,0];followCamera=true;if(wildRegion!==id){optionalOpen=cargoOpen=null;wildRegion=id;spawnDelay=0;wild=null;}if(!wild&&spawnDelay<=0)spawnWild(id);render();return true;}
 function spawnWild(id){
  if(id==="finale"){wild=null;return;}
  const p=explorer.layout.paths;
  // Harbor is the RPG's introductory hunting region. Before the first
  // capture, offer an ordinary level-one kitten so the player can learn
  // combat and unlock Duo without an unlucky rare-enemy progression wall.
  const novice=id==="harbor"&&(State.S.catchCount||0)===0;
  const candidates=novice?pools[id].filter(key=>GameData.speciesById(key)?.rarity==="N"):pools[id];
  const species=pickWild(candidates,0,!novice);
  const t=novice?.5:.25+Math.random()*.5;
  wild={species:novice?{...species,encounterLevel:1}:species,point:[p[2][0]*(1-t)+p[3][0]*t,p[2][1]*(1-t)+p[3][1]*t]};
 }
 function lureWild(id){
  const s=State.S;
  if(!(s.catchCount>0)||!(s.luckLure>0)||!wild||wildRegion!==id||wild.species.rarity!=="N"||pending||explorer.puzzle||explorer.cargo||ceremony)return;
  const previous=wild,amount=s.luckLure;
  const species=pickWild(pools[id],.9,true);
  s.luckLure--;
  if(!State.save()?.ok){s.luckLure=amount;return;}
  wild={...previous,species};
  notice=["幸运诱饵引来新的脚步声！","A lucky lure attracted fresh footsteps!"];
  window.MorrowwishAudio?.effect?.("discover");render();
 }
 function wildClue(sp){
  const rarity=sp?.rarity;
  if(rarity==="SSR")return tr("传说邂逅 · 接近野猫","Legendary sighting · Approach wild cat");
  if(rarity==="SR")return tr("史诗邂逅 · 接近野猫","Epic sighting · Approach wild cat");
  if(rarity==="R")return tr("稀有邂逅 · 接近野猫","Rare sighting · Approach wild cat");
  return tr("接近野猫","Approach wild cat");
 }
 function resumeRegion(won){
  const b=current(),id=b.world().location;
  if(b.view().current?.chapter==="finale"&&id==="starfall")return enterRegion("finale");
  if(id==="finale"&&b.view().current?.chapter!=="finale")return enterMap();
  if(won&&wildRegion===id){wild=null;spawnDelay=7;}
  return id?enterRegion(id):enterMap();
 }
 function exitToYard(){clearRewardPopup();stopDemo();ceremony=null;host.hidden=true;pending=null;exit?.();}
 function reason(k,asPair=false){const m={"walk-to-discovery":["先走到发现地点，或继续探索其他地方。","Approach the discovery, or explore somewhere else."],"story-operation-order":["请先完成当前调查或行动","Complete the current investigation or action first"],"mechanism-incomplete":["机关尚未完成","Complete the mechanism first"],"starfall-routing-order":["先接通相邻古铃，再修复圣所","Connect the neighboring bells, then restore the sanctuary"],"starfall-record-order":["请按调查顺序前往地点","Follow the investigation stations in order"],"walk-to-cargo":["请先抵达物资领取地点","Reach the cargo pickup point"],"walk-to-recipient":["请先抵达接收地点","Reach the recipient"],"library-previous-station":["请先核验前一份档案","Verify the previous archive station first"],"library-catdex-required":["需要已收录图鉴记录的猫咪","A cat with a Catdex record is required"],"library-repair-first":["先修复月镜圣所","Restore the Moonmirror sanctuary first"],"library-record-unverified":["档案证据尚未核实","Archive evidence is not verified"],"harbor-repair-first":["请先修复古铃圣所","Restore the town bell sanctuary first"],"npc-not-available":["该居民暂时无法响应，请先修复圣所","The resident cannot respond yet. Restore the sanctuary first."],"local-response-required":["需要两位居民共同回应旋律","Both residents must answer the melody"],"slot-changed":["存档已切换，请重新操作","The active save has changed. Try again."],"incomplete-forge-parts":["先在旧工坊收集三件零件","Collect all three old workshop parts first"],"two-cat-required":["需要至少一只已收集的猫咪","At least one collected cat is needed"],"paired-flow-incomplete":["双猫尚未完成协作","Both cats must complete the flow"],"region-locked":["尚未开放","Region locked"],"rescue-first":["先救援遇险小船","Rescue the boat first"],"beacon-first":["先校准灯塔","Align the lighthouse first"],"departure-dialogue-pending":["先与暮铃交谈","Speak with Luna before departing"],"invite-local-cats":["先邀请两位当地居民","Invite both local residents"],"choice-pending":["请先作出剧情选择","Make the story choice first"],"save-failed":["存档失败，请重试","Save failed; retry"],"not_started":["请先开始或读取存档","Start or load a save"],"local-crisis-unresolved":["先完成当地危机","Resolve the local crisis first"],"cargo-busy":["先交付当前物资","Deliver the current cargo first"],"canonical-exchange-unavailable":["正式交流接口暂不可用","Canonical exchange unavailable"],"canonical-host-unavailable":["正式剧情接口暂不可用","Canonical story unavailable"],"walk-to-objective":["请先抵达地点","Walk to the location"],"walk-to-tide":["沿退潮刻痕抵达正确地点","Follow the ebb marks to the correct location"],"incomplete-tide-trail":["先调查退潮刻痕与石阶","Inspect the ebb marks and dry steps first"],"walk-to-scent":["先沿气味抵达正确地点","Follow the scent to the correct location"],"incomplete-scent-trail":["尚未找到全部踪迹","The scent trail is incomplete"],"postgame-repair-unavailable":["请先抵达待修复圣所","Reach the sanctuary needing repair"],"postgame-visit-unavailable":["请先修复圣所并前往居民处","Repair the sanctuary and visit the resident first"]};const pair=m[k]||["操作失败，请重试。","Action failed. Please try again."];if(!m[k]&&k)console.warn("World action:",k);return asPair?pair:tr(...pair);}
 let rewardPopup=null,rewardPopupTimer=0;
 function clearRewardPopup(){clearTimeout(rewardPopupTimer);rewardPopupTimer=0;rewardPopup?.remove();rewardPopup=null;}
 function reportPickup(r,labels){
  if(!r?.ok)return report(r);
  notice="";fitNotice="";game.refreshHUD?.();clearRewardPopup();
  const reward=r.reward||{},coins=reward.coins||0,fish=reward.fish||0;
  const popup=E("div","rw-reward-popup");popup.setAttribute("role","status");popup.setAttribute("aria-live","polite");
  Object.assign(popup.style,{position:"absolute",zIndex:"19",top:"clamp(56px,18%,140px)",left:"50%",transform:"translateX(-50%)",boxSizing:"border-box",width:"max-content",maxWidth:"calc(100% - 32px)",padding:"10px 20px",border:"1px solid #b99a61",borderRadius:"12px",background:"#fff6e9f5",color:"#493e2b",boxShadow:"0 4px 18px #47321d38",textAlign:"center",pointerEvents:"none",fontFamily:"var(--cb-font-body)",lineHeight:"1.35"});
  const heading=E("strong","rw-reward-title",tr(...labels));Object.assign(heading.style,{display:"block",fontFamily:"var(--cb-font-display)",fontSize:"clamp(16px,2.1vw,22px)",fontWeight:"700"});
  const details=E("div","rw-reward-amounts",[[coins,tr("金币","coins")],[fish,tr("小鱼干","fish")]].filter(([n])=>n>0).map(([n,label])=>"+"+n+" "+label).join(" · "));
  Object.assign(details.style,{fontSize:"clamp(14px,1.8vw,18px)",marginTop:"4px"});popup.append(heading);if(details.textContent)popup.append(details);
  host.parentElement.append(popup);rewardPopup=popup;
  if(!window.matchMedia("(prefers-reduced-motion: reduce)").matches)popup.animate?.([{opacity:0,transform:"translate(-50%,-6px)"},{opacity:1,transform:"translate(-50%,0)",offset:.09},{opacity:1,transform:"translate(-50%,0)",offset:.84},{opacity:0,transform:"translate(-50%,-4px)"}],{duration:2500,fill:"forwards",easing:"ease"});
  rewardPopupTimer=setTimeout(clearRewardPopup,2500);return true;
 }
 function report(r,t=""){if(!r?.ok){notice=reason(r?.reason,true);return false;}notice=t;if(r.reward){game.refreshHUD?.();const suffix=[`+${r.reward.coins} 金币 · +${r.reward.fish} 小鱼干`,`+${r.reward.coins} coins · +${r.reward.fish} fish`];notice=Array.isArray(t)?t.map((s,i)=>(s?s+" · ":"")+suffix[i]):t?(t+" · "+tr(...suffix)):suffix;}return true;}
 function image(id){
  if(art[id])return art[id];
   const img=new Image();
  art[id]=img;
  img.onload=()=>{if(canvas)draw();};
  img.onerror=()=>{notice=tr("场景原画加载失败","Environment artwork failed to load");};
  img.src=new URL(id.startsWith("finale:")?"../../assets/"+id.slice(7):id==="finale"?"../../assets/combat/star-bell-arena-wide.webp":id==="harbor-ceremony"?"../../assets/resonance-world-v2/harbor.webp":"../../assets/resonance-world-v2/"+(id==="harbor"?"harbor-mist":id)+".webp",import.meta.url).href;
  return img;
 }
 function render(){if(!host)return;lastPortrait=portraitLayout();if(!window.CatBondResonance?.view){host.replaceChildren(E("p","rw-notice",tr("正式剧情正在初始化","Initializing the canonical story")));host.hidden=game.scene!=="map";return;}const b=current(),v=b.view(),w=b.world();revision=sync();if(explorer?.puzzle?.type!=="melody"&&demoPuzzle!==null)stopDemo();if(demoActive){demoGeneration++;demoActive=false;demoIndex=-1;window.MorrowwishMusic?.stopQuality?.();}host.replaceChildren();host.hidden=game.scene!=="map";if(ceremony)host.dataset.ceremony=ceremony.region;else delete host.dataset.ceremony;const forestRegion=mode==="region"&&w.location==="forest",forgeRegion=mode==="region"&&w.location==="forge",regionStep=mode+"/"+w.location+"/"+(v.current?.id||"")+"/"+(explorer?.puzzle?.operation||"explore");if(fitKey!==regionStep){fitKey=regionStep;fitPage=0;fitNotice="";optionalOpen=null;}host.dataset.regionStep=regionStep;host.classList.toggle("rw-interaction-fit",!!explorer?.puzzle||!!ceremony);host.classList.toggle("rw-atlas-mode",mode==="map");if(mode==="map")host.classList.remove("rw-region-compact");host.classList.toggle("rw-forest-region",forestRegion);host.classList.toggle("rw-forge-region",forgeRegion);host.classList.toggle("rw-library-region",mode==="region"&&w.location==="library");host.classList.toggle("rw-sky-region",mode==="region"&&w.location==="sky");
 const head=E("header","rw-head"),brand=E("div","rw-brand");brand.append(E("small","",tr("星铃回响","STAR BELL")),E("strong","",mode==="map"?tr("星铃回响","Echoes of the Starbell"):tr(...layouts[w.location].name)));head.append(brand);if(mode!=="map"){const back=B(tr("世界地图","World atlas"),enterMap,!!ceremony);back.dataset.worldNav="atlas";head.append(back);}const home=B(tr("阳光花园","Sunlit Garden"),exitToYard,!!ceremony);home.dataset.worldNav="garden";head.append(home);host.append(head);if(forestRegion){const credit=E("p","rw-hint rw-quality-credit");const link=E("a","",tr("魔法山谷","Enchanted Valley"));link.dataset.originalTitle="Enchanted Valley";link.href="https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1200093";link.target="_blank";link.rel="noopener noreferrer";const license=E("a","",tr("知识共享署名 4.0 国际许可","CC BY 4.0"));license.href="https://creativecommons.org/licenses/by/4.0/";license.target="_blank";license.rel="noopener noreferrer";credit.dataset.originalArtist="Kevin MacLeod";credit.append(link,document.createTextNode(tr(" · 作者：凯文·麦克劳德 · "," by Kevin MacLeod (incompetech.com), ")),license,document.createTextNode(tr(" · 已转换音频格式。",", transcoded to Opus.")));host.append(credit);}
 if(mode==="map"){
  const nav=E("nav","rw-system-nav");
  const book=B(tr("星月之书","Resonance Book"),()=>window.ResonanceBook?.open());book.classList.add("rb-world-entry");nav.append(book,B(tr("故事手册","Journal"),()=>{window.CatBondResonance?.showCurrent?.()}));
  host.append(nav);
 }else if(!ceremony&&!explorer?.puzzle){const book=B(tr("星月之书","Resonance Book"),()=>window.ResonanceBook?.open());book.classList.add("rb-world-entry");head.append(book);}
 const objective=E("section","rw-objective"),q=E("div","rw-current");q.append(E("small","",tr("当前主线","CURRENT STORY")),E("strong","",v.current?.title?.[lang()]||(v.ending?tr("六封信与新的家园","Six Letters and a New Home"):tr("新的旅程","A new journey"))));
 const chapter=v.current?.chapter,chapterIndex=campaign.regions.indexOf(chapter);
 const chapterLabel=chapterIndex>=0?tr("第 "+(chapterIndex+1)+" 章","Chapter "+(chapterIndex+1)):chapter==="prologue"?tr("序章","Prologue"):chapter==="finale"?tr("终章","Finale"):chapter==="epilogue"?tr("尾声","Epilogue"):tr("冒险之后","After the adventure");
 q.firstChild.textContent=chapterLabel+" · "+tr("主线任务","Main quest");
 const locationLabel=layouts[w.location]?.name;
 const regionLabel=layouts[chapter]?.name;
 const operation=v.objective[0],feature=layouts[chapter]?.features?.[operation];
 const currentScene=v.current?.id;
 const next=feature?tr(feature[2],feature[3]):v.ending?tr("继续探索与花园生活","Explore and enjoy the garden"):currentScene==="harbor:H-01"?tr("找到栖蓝，问问跑掉的铃声","Find Skye and ask about the runaway chime"):currentScene==="harbor:H-03"?tr("去旧铃房找檐灯","Find Alder at the old bell house"):currentScene==="forest:R-01"?tr("找芽禾，看看会移动的月叶","Find Fern and the moving moonleaves"):currentScene==="sky:S-04"?tr("去观景台和暮铃喝茶","Join Luna for tea at the lookout"):currentScene==="epilogue:E-01"?tr("回阳光花园，也可以先拜访老朋友","Return to Sunlit Garden, or visit old friends first"):regionLabel&&mode==="map"?tr("前往","Travel to ")+tr(...regionLabel):operation?.startsWith("npc:")?tr("与剧情人物交谈","Speak with the story character"):operation?.startsWith("battle:")?tr("前往挑战地点","Approach the challenge"):operation?.startsWith("cinematic:")?tr("观看剧情","Watch the story scene"):tr("继续当前剧情","Continue the current story");
 if(locationLabel)q.append(E("span","rw-location",tr("当前位置：","Location: ")+tr(...locationLabel)));
 const destination=regionLabel&&mode==="region"&&w.location!==chapter?tr("前往","Travel to ")+tr(...regionLabel):"";
 if(["sky:S-01","sky:S-02"].includes(v.current?.id)&&!skyPartsReady(v))q.append(E("span","rw-next",tr("先完成千灯城的主线故事。","Finish the Lantern City story first.")));
 const missing=mode==="region"?pendingInvites(v):[];const melodyReady=mode==="region"&&v.objective.includes("melody:"+w.location)&&!v.objective.includes("repair:"+w.location);const melodyName=explorer?.layout.features["melody:"+w.location];
 const inviteNext=melodyReady?(missing.length?tr("邀请 "+missing.map(n=>n.name.zh).join("、")+" 参加合奏。","Invite "+missing.map(n=>n.name.en).join(" and ")+" to join the performance."):tr("居民已全部就位，前往"+(melodyName?.[2]||"圣所")+"开始合奏。","All residents are ready. Begin "+(melodyName?.[3]||"the performance")+".")):"";
 const harborNext=inviteNext;
 if(destination||harborNext||next){q.append(E("small","rw-next-label",tr("下一步","Next step")));q.append(E("span","rw-next",destination||harborNext||next));}objective.append(q);const metrics=E("div","rw-metrics");for(const [n,l] of [[v.sanctuaries.length,tr("圣所","Sanctuaries")],[v.melodies.length,tr("旋律","Melodies")],[Object.values(v.links).filter(x=>x.length===4).length,tr("交流","Exchanges")]]){let m=E("div","rw-metric");m.append(E("b","",n+"/6"),E("span","",l));metrics.append(m);}const progress=E("details","rw-quest-progress");progress.append(E("summary","",tr("冒险总进度","Overall journey progress")),metrics);objective.append(progress);host.append(objective);

  if(notice)host.append(E("p","rw-notice",Array.isArray(notice)?tr(...notice):notice));

 const shell=E("div","rw-shell");canvas=E("canvas","rw-surface");canvas.width=W;canvas.height=H;canvas.dataset.logicalWidth=String(W);canvas.dataset.logicalHeight=String(H);canvas.tabIndex=0;canvas.style.cursor=cameraEnabled()?"grab":explorer?.puzzle?.type==="skyFlight"?"ns-resize":explorer?.puzzle?.spatial?.kind==="light"?"ew-resize":explorer?.puzzle&&explorer.puzzle.spatial?.kind!=="chase"?"pointer":"default";canvas.setAttribute("aria-label",tr("可操作的世界探索场景","Interactive world exploration"));ctx=canvas.getContext("2d");shell.append(canvas);host.append(shell);
 if(mode==="region"&&w.location==="harbor"){host.dataset.region="harbor";const p=explorer?.puzzle;if(p){host.dataset.harborPuzzle="true";host.append(E("p","rw-harbor-guide",ceremony?tr("聆听风铃镇居民的回应……","Listen to the townsfolk answer…"):(p.type==="canonSpatial"?tr("追上不断移动的铃光","Intercept the moving chime"):harborPuzzleHint(p,lang()))));}else{delete host.dataset.harborPuzzle;const status=E("div","rw-harbor-status");status.append(E("span","",v.melodies.includes("harbor")?tr("古铃 · 已恢复","Town bell · Restored"):v.current?.id==="harbor:H-04"?tr("铃舌兽 · 等待挑战","Belltongue Beast · Challenge ahead"):tr("铃声错乱 · 等待恢复","Chimes confused · Awaiting repair")));if(v.melodies.includes("harbor"))status.append(E("span","",tr("古铃已恢复 · 眠根林新路 · 花园泉水已解锁","Town bell restored · Rootsleep trail · Garden fountain unlocked")));host.append(status);}}else{if(mode==="region")host.dataset.region=w.location;else delete host.dataset.region;delete host.dataset.harborPuzzle;}pointers.clear();drag=null;dragged=false;
 heldChaseKeys=[];const surface=canvas,owner=State.S;
 const listen=(type,fn,options)=>surface.addEventListener(type,e=>{
  if(surface===canvas&&surface.isConnected&&owner===State.S&&game.scene==="map")fn(e);
 },options);
 if(ceremony){makeFitRail(head,shell);draw();return;}
 listen("pointerdown",down);listen("pointermove",move);listen("pointerup",up);listen("pointercancel",e=>{pointers.delete(e.pointerId);dragged=true;drag=null;pinch=0;if(!pointers.size&&cameraEnabled())canvas.style.cursor="grab";});listen("lostpointercapture",e=>{if(pointers.has(e.pointerId)){pointers.delete(e.pointerId);dragged=true;drag=null;pinch=0;}});listen("wheel",e=>{if(cameraEnabled()){e.preventDefault();const p=point(e);scale(e.deltaY>0?.85:1.18,p[0],p[1])}},{passive:false});listen("keydown",key);listen("keyup",e=>chaseKey(e,true));listen("blur",()=>{heldChaseKeys=[];chaseDirection(0,0);});
 if(mode==="map"){let c=E("div","rw-controls");c.append(B("−",()=>scale(.8,.5,.5)),B("+",()=>scale(1.25,.5,.5)),B(tr("全图","Overview"),()=>overviewCamera()));host.append(c);if(selectedRoute){const [a,z]=selectedRoute.split(":");host.append(E("p","rw-hint",tr(...layouts[a].name)+" ↔ "+tr(...layouts[z].name)+" · "+(selectedRoute==="harbor:forest"&&v.completed.includes("harbor:H-05")?tr("航路已开放 · 物资交流 ","Route open · Cargo exchange "):"")+v.links[selectedRoute].length+"/4"));}host.append(E("p","rw-hint",v.regions.length?tr("点击地区前往；拖动、双指缩放或滚轮查看地图。","Tap a region to travel; drag, pinch or scroll to zoom."):tr("完成序章后开启风铃镇。","Windchime Town opens after the prologue.")));const row=E("div","rw-regions");for(const r of regions){const e=B(tr(r.name,r.sub),()=>enterRegion(r.id),!v.regions.includes(r.id));e.dataset.region=r.id;e.setAttribute('aria-label',tr(r.name,r.sub));const state=v.sanctuaries.includes(r.id)?tr("圣所已恢复","Restored"):v.regions.includes(r.id)?tr("可探索","Open"):tr("未解锁","Locked");e.setAttribute('aria-description',state);e.append(E("small","rw-region-status",state));if(w.location===r.id)e.setAttribute("aria-current","location");row.append(e);}const central=B(tr("中央星铃","Star Bell"),()=>enterRegion("finale"),!(v.ring&&v.current?.chapter==="finale"));central.dataset.region="finale";if(w.location==="finale")central.setAttribute("aria-current","location");row.append(central);host.append(row);}
 else if(explorer){if(cameraEnabled()&&!explorer.puzzle&&!ceremony){const c=E("div","rw-controls rw-camera-controls");c.append(B("−",()=>scale(.8,.5,.5)),B("+",()=>scale(1.25,.5,.5)),B(tr("跟随猫咪","Follow cat"),()=>{followCamera=true;zoom=Math.max(zoom,explorationZoom());centerCamera(explorer.position);draw()}),B(tr("全图","Overview"),()=>overviewCamera()));host.append(c);}if(explorer.puzzle){const p=explorer.puzzle,words=p.type==="canonSpatial"?[null,null,[]]:p.type==="skyFlight"?[null,null,[["升高","Climb"],["平飞","Level"],["降低","Descend"]]]:libraryWords(p)||puzzleWords[p.type];const home=explorer.homeQuest();if(explorer.active?.homeRepair&&home)host.append(E("p","rw-notice",tr(...home.letterText)));const row=E("div","rw-controls rw-puzzle-controls"+(p.type==="skyFlight"?" rw-active-flight":""));if(p.type==="echo"){const data=echoBeaconOptions(p);const status=E("p","rw-hint rw-starfall-puzzle-status",tr("原始星序：","Reference: ")+data.signal.join(" ")+" · "+p.values.length+"/3"+(p.mistakes?tr(" · 幻象干扰后重新校准"," · Recalibrating after an illusion"):""));status.setAttribute("role","status");row.append(status);}if(p.type==="skyFlight"){const status=E("p","rw-sky-flight-status");status.dataset.skyFlightStatus="true";status.dataset.gates=String(p.flight.gate);if(p.flight.openGlide)status.dataset.route="open";status.dataset.attempts=String(p.flight.attempts);status.dataset.phase=p.flight.notice;status.setAttribute("role","status");row.append(status);status.textContent=p.flight.practice?tr("借上升气流，随后回到中央高度安全落地。","Catch the updraft, then return to middle altitude for a safe landing."):p.flight.openGlide?tr("拖动控制高度，穿过云海；沿途羽毛可选收。","Drag to steer through the clouds; collect feathers if you like."):tr("拖动高度或按升高／平飞／降低，穿过三个风圈后回到中央。","Drag altitude or use Climb / Level / Descend. Cross three wind gates, then return to center.");}if(p.type==="libraryCompanion"){const m=p.mirror,clue=E("p","rw-hint");clue.dataset.mirrorResponse="true";clue.dataset.leftFacing=String(m.faces[0]);clue.dataset.rightFacing=String(m.faces[1]);clue.dataset.position=String(m.position);clue.setAttribute("role","status");const desc=face=>face===0?tr("仍看着旧位置","Still faces the old spot"):face>0?tr("转向右边并回铃","Turns right and answers"):tr("转向左边并回铃","Turns left and answers");clue.textContent=tr("左边：","Left: ")+desc(m.faces[0])+" · "+tr("右边：","Right: ")+desc(m.faces[1]);row.append(clue);if(m.mistakes)row.append(E("p","rw-hint",tr("先改变位置并观察回应，再选择。","Move and observe a new response before choosing.")));}if(p.type==="libraryEcho"){const record=p.record,individual=record&&State.S.cats.find(c=>c.uid===record.uid),name=record&&(individual?State.catName(individual):GameData.speciesName(record.species));const clue=E("p","rw-hint",record?tr("已收录："+name+" · 战斗胜利 "+record.wins+" 次。请在图鉴查找个体回响。","Collected: "+name+" · "+record.wins+" battle wins. Look up the individual echo in Catdex."):tr("没有可核验记录","No record to verify"));clue.dataset.libraryMemory="true";clue.setAttribute("role","status");row.append(clue,B(tr("查看猫咪图鉴","Inspect Catdex"),()=>window.UI?.openDex?.()));if(p.mistakes){const warning=E("p","rw-hint",tr("回响不符 · 请重新核对图鉴记录。","Echo mismatch · check the Catdex record and try again."));warning.setAttribute("role","status");warning.dataset.libraryMismatch="true";row.append(warning);}}if(p.type==="libraryMirrors"){const count=p.values.filter((value,index)=>value===p.goal[index]).length;const status=E("p","rw-hint",tr("已对准镜面 ","Mirrors aligned ")+count+"/3");status.dataset.libraryMirrors=String(count);status.setAttribute("role","status");row.append(status);}if(p.type==="melody")addMelodyControls(row,p);else if(p.type==="libraryRoutes"){const seen=p.routeSeen?.length||0;if(seen===2)row.append(B(tr("继续剧情","Continue story"),()=>operate(2),!!routeDemo));else row.append(B(tr(seen?"正在展示两种结果":"观看两种可能的未来",seen?"Showing both outcomes":"Watch two possible futures"),startRouteDemo,!!routeDemo));}else if(p.type==="canonSpatial"){row.dataset.spatial=p.spatial.kind;for(const entry of spatialControls(p.spatial)){const button=B(tr(...entry.label),()=>spatialAct(entry.action),!!p.spatial.walk||entry.available===false);if(entry.available!==undefined)button.dataset.pathAvailable=String(entry.available);row.append(button);}}else words[2].forEach((t,i)=>row.append(B(tr(...t),()=>operate(i),!!ceremony||p.type==="libraryCompanion"&&i!==1&&!p.mirror.changes)));if(p.type==="skyFlight"&&p.flight.openGlide&&!p.flight.practice&&p.operation!=="puzzle:joint-flight"){const rest=B(tr("降落安全岛","Land on safe isle"),()=>{if(explorer.flightLand())render();},!canLandSkyFlight(p.flight));rest.dataset.skyLand="true";row.append(rest);}row.append(B(tr("离开机关","Leave mechanism"),()=>{stopDemo();routeDemo=null;ceremony=null;explorer.cancel();render()},!!ceremony));host.append(row);}else if(explorer.survey()?.remote){const s=explorer.survey(),actions=E("div","rw-controls rw-world-actions");host.append(E("p","rw-hint",tr("远风岛 · 只能滑翔往返。沿岛上石径寻找隐藏信使补给。","Farwind Isle · Accessible only by glider. Follow its path to find a hidden courier cache.")));if(s.cache){const cache=explorer.rewardPoints()[0],button=B(tr("调查信使补给","Inspect courier cache"),()=>visitCache(cache),!explorer.near(cache.point));button.dataset.skyCache="true";actions.append(button);host.append(E("p","rw-hint",tr("线索：沿石径向岛的右端走，接近后才能调查。","Clue: follow the stone path toward the far right. Inspect only when close.")));}actions.append(B(tr(...s.name),()=>visitSurvey(s)));host.append(actions);}else{host.append(E("p","rw-hint",explorer.cargo?tr("沿道路运送物资：","Carry the cargo along the path: ")+cargoName(explorer.cargo.action):(portraitLayout()?tr("点击道路、居民或地点前往，也可使用下方探索操作。双指放大后可随时恢复全图。","Tap paths, residents or landmarks to walk there, or use the exploration actions below. Pinch to zoom and return to Overview anytime."):tr("拖动画面探索，双指或滚轮缩放；点击道路、居民或地点，猫咪会前往。","Drag to explore, pinch or scroll to zoom; tap a path, resident or landmark to walk there."))));const actions=E("div","rw-controls rw-world-actions");const primary=(button)=>{button.dataset.questPrimary="true";return button;};const chooseFirst=v.current?.choiceTiming==="beforeAction"&&v.current.choices?.length&&!v.choice;const survey=explorer.survey();if(w.location==="forge"&&v.completed.includes("forge:E-01"))actions.append(B(tr("再玩皮影戏","Play the shadow theater"),()=>{go(explorer.layout.features["puzzle:lantern-show"],()=>{report(explorer.openOptionalTheater());render();});}));if(survey)actions.append(B(tr(...survey.name),()=>visitSurvey(survey),!!explorer.cargo));for(const [op,f] of Object.entries(explorer.layout.features))if(v.objective.includes(op)&&(!(v.current?.orderedRequires||["starfall:F-02","starfall:F-04"].includes(v.current?.id))||v.objective[0]===op)&&!libraryBlocked(op,v.objective,v)&&op!=="explore:scent-trail"&&(op!=="puzzle:safety-blueprint"||!explorer.forgeStep())&&(op!=="explore:tide-logbook"||!explorer.tideStep())&&(!["melody:harbor","melody:forest","melody:sky","melody:forge"].includes(op)||!v.objective.includes("repair:"+op.split(":")[1])))actions.append(chooseFirst?B(tr(f[2],f[3]),()=>visitFeature(op,f),true):primary(B(tr(f[2],f[3]),()=>visitFeature(op,f),op.startsWith("melody:")&&missing.length>0)));if(v.current?.id==="forest:R-03"&&v.objective[0]==="explore:water-marks")actions.append(B(tr("调查干燥树根的呼唤","Investigate the call from dry roots"),()=>visitFalseForestTrail()));const home=explorer.homeQuest();if(home&&!home.repaired)actions.append(B(tr("暮铃的来信 · 修复圣所","Luna’s letter · Repair the sanctuary"),()=>visitHomeRepair(home)));const tide=explorer.tideStep(),part=explorer.forgeStep();if(part)actions.append(primary(B(tr(...part.name)+" · "+(part.index+1)+"/"+part.total,()=>visitForgePart(part))));if(tide)actions.append(primary(B(tr(...tide.name)+" · "+(tide.index+1)+"/"+tide.total,()=>visitTide(tide))));const scent=explorer.scentStep();if(scent){const control=B(tr(...scent.name)+" · "+(scent.index+1)+"/"+scent.total,()=>go(scent.point,()=>{const live=explorer.scentStep();if(live?.index===scent.index)visitScent(live)}));control.dataset.scent="true";actions.append(primary(control));host.append(E("p","rw-hint",tr("沿林路移动，或点击踪迹按钮前往调查。","Walk the forest paths, or select the trail action to walk there and investigate.")));}for(const npc of storyNpcs()){const invite=missing.some(n=>n.id===npc.id);const invited=melodyReady&&explorer.localNpcs().some(n=>n.id===npc.id)&&explorer.invited.includes(npc.id);const reunion=home?.repaired&&home.actors.some(a=>a.id===npc.id&&!a.visited);const button=B((reunion?tr("邀请回花园 ","Invite to garden: "):invite?tr("邀请 ","Invite "):invited?tr("已就位 · ","Ready · "):tr("交谈 ","Talk to "))+npc.name[lang()],()=>visitNpc(npc),invited&&!reunion);if(invite||invited)button.dataset.melodyInvite=npc.id;if(isMainNpc(npc,v,missing)||reunion)primary(button);actions.append(button);}if((v.current?.chapter===w.location)&&hasPendingDialogue(v)&&!v.objective.some(op=>op.startsWith("npc:")||op.startsWith("cinematic:"))){const resume=B(tr("继续剧情","Continue story"),()=>window.CatBondResonance.showCurrent());resume.dataset.storyResume=v.current.id;actions.append(primary(resume));}if(v.current?.id==="epilogue:E-01"&&["harbor","forest"].includes(w.location)&&v.objective.length&&v.objective.every(op=>op.startsWith("cinematic:")))actions.append(primary(B(tr("回顾六地的新生活","Revisit the restored regions"),()=>window.CatBondChapterCinematics.play(v.current.id))));
 for(const [id,boss] of Object.entries(REGIONAL_BOSSES))if(optionalBossAvailable(id,v,w)){const cleared=w.interactions?.[bossKey(id)];const btn=B(tr(...boss.name)+" · "+(cleared?tr("再次挑战","Rematch"):tr("可选 Boss","Optional boss")),()=>visitOptionalBoss(id));btn.dataset.regionalBoss=id;actions.append(btn);}
 if(w.location==="starfall"){
  if(v.ending){actions.append(B(tr("星铃废墟 · 传说挑战","Star Bell Ruins · Legendary challenge"),()=>visitRuins("legendary")),B(tr("星铃废墟 · 双猫约定挑战","Star Bell Ruins · Duo Promise challenge"),()=>visitRuins("duo")));actions.append(E("p","rw-hint",tr(`遗迹胜利 ${v.ruins?.clears||0} · 约定胜利 ${v.ruins?.duoClears||0}`,`Ruins clears ${v.ruins?.clears||0} · Promise clears ${v.ruins?.duoClears||0}`)));}
 }
 if(w.location==="finale"){
  const battle=v.current?.chapter==="finale"&&v.objective.find(op=>op.startsWith("battle:"));
  if(battle)actions.append(primary(B(tr("前往中央星铃","Approach the Star Bell"),()=>go(explorer.layout.paths.at(-1),()=>requestBattle(battle,"finale")))));
  if(v.current?.id==="finale:B-03"&&v.cursor===v.current.lines.length&&v.objective.includes("mechanism:muling-unlock"))actions.append(primary(B(tr("协助暮铃打开最后一道锁","Help Luna release the last lock"),()=>go(explorer.layout.paths.at(-1),openFinaleLatch))));
 }
 if(w.location==="starfall"||w.location==="finale"){
  if(v.objective.length&&v.objective.every(op=>op.startsWith("cinematic:")))actions.append(primary(B(v.current?.id==="starfall:F-02"?tr("回想当年的抉择","Remember the choice"):tr("观看剧情","Watch the story scene"),()=>go(explorer.layout.paths.at(-1),()=>window.CatBondChapterCinematics.play(v.current.id)))));
 }
 for(const memory of availableMemories(w.location))actions.append(B(memory.name,()=>visitDuoMemory(memory)));
 // Optional clue, not a main quest or a global map marker. The same walk/proof
 // path as the proximity marker is used, including the real saved position.
 for(const s of availableSideEvents(w.location,w,v)){const clue=B(tr(...s.clue),()=>{regionMenuOpen=false;const rail=host.querySelector("#rw-region-actions");if(rail)rail.hidden=true;host.querySelector(".rw-region-toggle")?.setAttribute("aria-expanded","false");visitDiscovery(s);});clue.dataset.sideClue=w.location;actions.append(clue);}
 if(wild?.species){const sighting=B(wildClue(wild.species),()=>visitWild(w.location));sighting.dataset.wildRarity=wild.species.rarity;actions.append(sighting);if(State.S.catchCount>0&&State.S.luckLure>0&&wild.species.rarity==="N"&&!explorer.cargo)actions.append(B(tr("使用幸运诱饵 · 1","Use lucky lure · 1"),()=>lureWild(w.location)));}if(actions.children.length){const all=[...actions.children],main=all.filter(el=>el.dataset.questPrimary==="true"),other=all.filter(el=>el.dataset.questPrimary!=="true");actions.replaceChildren();if(main.length)actions.append(E("strong","rw-action-heading",tr("主线行动","Main quest actions")),...main);if(other.length){const details=E("details","rw-optional-actions");details.open=optionalOpen??false;details.addEventListener("toggle",()=>{if(details.isConnected){optionalOpen=details.open;scheduleFit();}});details.append(E("summary","",tr("探索与支线列表","Exploration & side quest list")));const grid=E("div","rw-optional-grid");grid.append(...other);details.append(grid);actions.append(details);}host.append(actions);}const opts=exchangeOptions(b,w.location,campaign.links);if(opts.length||explorer.cargo){const c=E("details","rw-cargo");c.open=!!explorer.cargo||cargoOpen===true;c.addEventListener("toggle",()=>{if(c.isConnected){cargoOpen=c.open;scheduleFit();}});c.append(E("summary","",tr("可选 · 邻地物资交流","Optional · Neighbor exchange")));if(explorer.cargo&&explorer.cargo.actor!==w.location)c.append(B(tr("返回物资所在地","Return to cargo location"),()=>enterRegion(explorer.cargo.actor)));for(const o of explorer.cargo?(explorer.cargo.actor===w.location?[explorer.cargo]:[]):opts){const carrying=!!explorer.cargo;c.append(B((carrying?tr("交付 ","Deliver "):tr("领取 ","Collect "))+cargoName(o.action),()=>visitCargo(o,carrying)));}host.append(c);}}}addNextSceneControl(head,v,w);
 makeFitRail(head,shell);
 draw();}
 // Navigate to the next authored scene, never grant completion evidence.
 function addNextSceneControl(container,v,w){
  if(!v.current||explorer?.puzzle||ceremony||explorer?.survey()?.remote)return;
  const id=v.current.id,chapter=v.current.chapter,owner=State.S;
  const destination=chapter==="prologue"?"harbor":chapter==="epilogue"?"garden":chapter;
  let action,label;
  if(destination==="garden"){action=exitToYard;label=tr("主线 · 返回阳光花园","Main quest · Return to Sunlit Garden");}
  else if((v.regions.includes(destination)||(destination==="finale"&&v.ring))&&(mode==="map"||w.location!==destination)){
   action=()=>enterRegion(destination);label=tr("主线 · 前往","Main quest · Travel to ")+tr(...layouts[destination].name);
  }else if(mode==="region"&&w.location===destination){
   const primary=[...host.querySelectorAll('button[data-quest-primary="true"]')].find(b=>!b.disabled);
   if(primary){action=()=>{if(primary.isConnected&&!primary.disabled)primary.click()};label=tr("主线 · ","Main quest · ")+primary.textContent.trim();const next=host.querySelector(".rw-next");if(next&&!pendingInvites(v).length)next.textContent=primary.textContent.trim();}
   else if(storyNpcs().some(n=>isMainNpc(n,v))){const n=storyNpcs().find(n=>isMainNpc(n,v));action=()=>visitNpc(n);label=tr("主线 · 与"+n.name[lang()]+"交谈","Main quest · Talk to "+n.name[lang()]);}
   else if(hasPendingDialogue(v)&&!v.objective.some(o=>o.startsWith("npc:")||o.startsWith("cinematic:"))){
    action=()=>window.CatBondResonance?.showCurrent?.();label=tr("继续剧情","Continue story");
   }
  }
  if(!action)return;
  const button=B(label,()=>{if(State.S!==owner||current().view().current?.id!==id||game.scene!=="map"||explorer?.puzzle||ceremony||current().world().cargo)return;action();});
  button.dataset.nextScene=id;button.style.cssText="grid-column:1/-1;align-self:center;min-height:44px;padding:10px 15px;border-radius:10px;background:#fff1d2;color:#654923;border:2px solid #aa844c;font-weight:800;box-shadow:0 3px 8px #3a2b2533;";
  container.append(button);
 }
 function point(e){const r=canvas.getBoundingClientRect();return [(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height];}
 function dialoguePaused(){return !!game?.worldDialogueOpen?.()||!!document.querySelector(".res-dialogue[aria-modal=true],.cb-story-overlay.is-visible");}
 function explorationZoom(){return fixedFinale()?1:portraitLayout()?1.65:2;}
 function nearbyExploration(p,radius=.24){return !explorer||mode!=="region"||!!explorer.puzzle||!!ceremony||distance(project(explorer.position),project(p))<=radius;}
 function cameraEnabled(){return mode==="map"||!!explorer&&!fixedFinale()&&!explorer.puzzle&&!ceremony;}
 function cameraViewport(){const r=canvas?.getBoundingClientRect(),s=canvas?.parentElement?.getBoundingClientRect();if(!r?.width||!r.height||!s?.width||!s.height)return [[0,1],[0,1]];return [[Math.max(0,(s.left-r.left)/r.width),Math.min(1,(s.right-r.left)/r.width)],[Math.max(0,(s.top-r.top)/r.height),Math.min(1,(s.bottom-r.top)/r.height)]];}
 function contain(){const axes=cameraViewport();pan=pan.map((n,i)=>Math.max(axes[i][1]-zoom,Math.min(axes[i][0],n)));}
 function cameraCenter(){return cameraViewport().map(([a,b])=>(a+b)/2);}
 function centerCamera(p){p=project(p);pan=cameraCenter().map((n,i)=>n-p[i]*zoom);contain();}
 function overviewCamera(){initialExploreCamera=false;followCamera=false;zoom=1;pan=[0,0];draw();}
 function cameraPoint(p){return cameraEnabled()?[(p[0]-pan[0])/zoom,(p[1]-pan[1])/zoom]:p;}
 function followPlayer(){if(pointers.size||!followCamera||!cameraEnabled()||mode!=="region")return;const p=project(explorer.position),goal=cameraCenter().map((n,i)=>n-p[i]*zoom);pan=pan.map((n,i)=>n+(goal[i]-n)*.15);contain();}
 function beginWalk(){if(fixedFinale()){initialExploreCamera=false;zoom=1;pan=[0,0];followCamera=false;return;}if(mode==="region"&&explorer&&!explorer.puzzle&&zoom<explorationZoom()){zoom=explorationZoom();centerCamera(explorer.position);}followCamera=true;}
 function scale(f,x,y){if(dialoguePaused()||!cameraEnabled())return;followCamera=false;const a=[(x-pan[0])/zoom,(y-pan[1])/zoom];zoom=Math.max(1,Math.min(3.5,zoom*f));pan=[x-a[0]*zoom,y-a[1]*zoom];contain();draw();}
 function down(e){if(dialoguePaused())return;if(!portraitLayout()&&mode==="map"&&atlasMenuOpen){const menu=host.querySelector(".rw-atlas-menu");if(menu)menu.open=false;atlasMenuOpen=false;}if(!portraitLayout()&&mode==="region"&&regionMenuOpen&&!explorer?.puzzle&&!ceremony){regionMenuOpen=false;const rail=host.querySelector("#rw-region-actions"),toggle=host.querySelector(".rw-region-toggle");if(rail)rail.hidden=true;toggle?.setAttribute("aria-expanded","false");}let p=point(e);if(explorer?.puzzle?.type==="skyFlight"){canvas.focus();canvas.setPointerCapture?.(e.pointerId);pointers.set(e.pointerId,p);explorer.flightSteer(p[1]);e.preventDefault();return;}pointers.set(e.pointerId,p);canvas.setPointerCapture?.(e.pointerId);if(cameraEnabled())canvas.style.cursor="grabbing";if(pointers.size===1){drag=p;dragged=false;}if(pointers.size===2){const a=[...pointers.values()];pinch=distance(a[0],a[1]);dragged=true;}e.preventDefault();}
 function move(e){if(dialoguePaused()||!pointers.has(e.pointerId))return;const prev=pointers.get(e.pointerId),p=point(e);pointers.set(e.pointerId,p);if(explorer?.puzzle?.type==="skyFlight"){explorer.flightSteer(p[1]);return;}if(explorer?.puzzle?.spatial?.kind==="light"&&p[1]<.79){dragged=true;explorer.spatialAct({type:"aim",x:Math.max(0,Math.min(1,p[0]))});draw();return;}if(!cameraEnabled())return;if(pointers.size===2){const a=[...pointers.values()],n=distance(a[0],a[1]);if(pinch>0){const oldMid=[(a[0][0]+a[1][0]-p[0]+prev[0])/2,(a[0][1]+a[1][1]-p[1]+prev[1])/2],mid=[(a[0][0]+a[1][0])/2,(a[0][1]+a[1][1])/2];scale(n/pinch,oldMid[0],oldMid[1]);pan=pan.map((v,i)=>v+mid[i]-oldMid[i]);contain();draw();}pinch=n;dragged=true;}else if(drag&&(dragged||distance(drag,p)>.012)){dragged=true;followCamera=false;pan=[pan[0]+p[0]-prev[0],pan[1]+p[1]-prev[1]];contain();draw();}}
 function up(e){const p=point(e),had=pointers.has(e.pointerId);pointers.delete(e.pointerId);if(dialoguePaused()){drag=null;pinch=0;dragged=true;return;}if(had&&explorer?.puzzle?.type==="libraryRoutes"){drag=null;return;}if(!pointers.size&&cameraEnabled())canvas.style.cursor="grab";if(explorer?.puzzle?.type==="skyFlight")return;if(explorer?.puzzle?.spatial?.kind==="light"&&dragged){render();return;}if(had&&!dragged&&!pointers.size)tap(...p);}
 function chaseInput(action){if(explorer?.puzzle?.spatial?.kind!=="chase")return;const r=explorer.spatialAct(action);if(r?.ok&&!r.pending){report(r,["成功 · 继续探索","Success · Continue exploring"]);render();}}
 function chaseDirection(dx,dy){const s=explorer?.puzzle?.spatial;if(s?.kind!=="chase"||(!s.direct&&!dx&&!dy)||(s.direction?.[0]===dx&&s.direction?.[1]===dy))return;chaseInput({type:"direction",dx,dy});}
 const chaseKeys={arrowleft:[-1,0],a:[-1,0],arrowright:[1,0],d:[1,0],arrowup:[0,-1],w:[0,-1],arrowdown:[0,1],s:[0,1]};
 let heldChaseKeys=[];
 function chaseKey(e,release=false){if(explorer?.puzzle?.spatial?.kind!=="chase")return false;const k=e.key.toLowerCase();if(k===" "||k==="spacebar"){e.preventDefault();e.stopPropagation();if(!release&&!e.repeat){const p=explorer.puzzle.spatial,[x,y]=chasePoint(p);chaseInput({type:"target",x,y});}return true;}if(!chaseKeys[k])return false;e.preventDefault();e.stopPropagation();heldChaseKeys=heldChaseKeys.filter(x=>x!==k);if(!release)heldChaseKeys.push(k);chaseDirection(...(chaseKeys[heldChaseKeys.at(-1)]||[0,0]));return true;}
 function key(e){if(dialoguePaused())return;if(chaseKey(e))return;if(explorer?.puzzle?.operation==="puzzle:lantern-show"&&["ArrowLeft","ArrowRight"].includes(e.key)){e.preventDefault();spatialAct({type:"aim",x:Math.max(0,Math.min(1,explorer.puzzle.spatial.angle+(e.key==="ArrowLeft"?-.1:.1)))});return;}if(explorer?.puzzle?.type==="skyFlight"&&["ArrowUp","ArrowDown"].includes(e.key)){e.preventDefault();explorer.flightSteer(explorer.puzzle.flight.target+(e.key==="ArrowUp"?-.13:.13));return;}if(cameraEnabled()&&(e.key==="+"||e.key==="="||e.key==="-")){e.preventDefault();scale(e.key==="-"?.83:1.2,.5,.5);return;}if(cameraEnabled()&&(mode==="map"||e.shiftKey)){const d={ArrowLeft:[.08,0],ArrowRight:[-.08,0],ArrowUp:[0,.08],ArrowDown:[0,-.08]}[e.key];if(d){e.preventDefault();followCamera=false;pan=[pan[0]+d[0],pan[1]+d[1]];contain();draw();}else if(e.key==="+"||e.key==="=")scale(1.2,.5,.5);else if(e.key==="-")scale(.83,.5,.5);}else if(explorer?.puzzle&&/^[1-9]$/.test(e.key)){const button=host.querySelector(`[data-minigame-key="${e.key}"]`);if(button&&!button.disabled){e.preventDefault();button.click();}}else if(explorer?.puzzle){if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"," "].includes(e.key))e.preventDefault();return;}else if(explorer){const d={ArrowLeft:[-.05,0],ArrowRight:[.05,0],ArrowUp:[0,-.05],ArrowDown:[0,.05]}[e.key];if(d){e.preventDefault();pending=null;beginWalk();explorer.walk(explorer.position[0]+d[0],explorer.position[1]+d[1]);}}}
 function go(p,fn){const w=current().world(),saved=w.positions[w.location];if(explorer.near(p)&&saved&&distance([saved.x,saved.y],p)<.072){fn();return;}pending={p:[...p],fn};beginWalk();if(!explorer.walk(...p))pending=null;}
 function spatialAct(action){if(!action||ceremony)return;const r=explorer?.spatialAct(action);if(!r)return;report(r,r.ok&&!r.pending?[ "成功 · 继续探索","Success · Continue exploring"]:"");render();}
 let portraitMirrorCue=null,routeDemo=null;
 function startRouteDemo(){if(routeDemo||explorer?.puzzle?.type!=="libraryRoutes")return;const owner=State.S,source=explorer,run={owner,source};routeDemo=run;const live=()=>routeDemo===run&&owner===State.S&&source===explorer&&source.puzzle?.type==="libraryRoutes"&&game.scene==="map";const seen=source.puzzle.routeSeen||[];if(!seen.includes(0))operate(0);setTimeout(()=>{if(!live()){if(routeDemo===run)routeDemo=null;return;}if(!source.puzzle.routeSeen?.includes(1))operate(1);setTimeout(()=>{if(routeDemo===run)routeDemo=null;if(live()||owner===State.S&&source===explorer&&source.puzzle?.type==="libraryRoutes")render();},2600);},2600);}

 function operate(i){if(ceremony||demoActive)return;const before=explorer.puzzle,p=before,op=explorer.active?.operation,owner=State.S;const correctNote=p?.goal?.[p.values.length]===i;
 const previousMirror=p?.type==="libraryCompanion"?JSON.parse(JSON.stringify(p.mirror)):null;
 const r=explorer.operate(i);if(previousMirror){portraitMirrorCue=i===1&&r.ok?{owner:State.S,source:explorer,previous:previousMirror,started:performance.now()}:null;}
 if(before?.type==="skyFlight"&&r.pending){draw();return;}
 if(p?.type==="melody"&&r.ok){if(correctNote)melodyNote(p,i);else window.MorrowwishMusic?.cue?.("error");}
 if(r.ceremony){ceremony={owner:State.S,explorer,region:before.operation.split(":")[1],elapsed:0,notes:0};if(ceremony.region==="harbor")image("harbor-ceremony");render();return;}const result=op==="explore:tide-logbook"?["找到救援日志","Rescue log recovered"]:op==="rescue:storm-boat"?["救援船已安全入港","Rescue boat safely in harbor"]:op==="melody:harbor"?["归家调 · 古铃已回应","Coming Home · The sanctuary answers"]:["机关已完成","Mechanism restored"];report(r,r.ok&&!r.pending?result:"");render();}
 function requestNpc(npcId,region){const sceneId=current().view().current?.id;if(sceneId)window.dispatchEvent(new CustomEvent("cat-bond-resonance-npc-request",{detail:{sceneId,npcId,region}}));}
 function requestBattle(op,region){const v=current().view();if(!v.current||!v.objective.includes(op)||v.current.orderedRequires&&v.objective[0]!==op)return;if(v.current.chapter==="finale"&&(region!=="finale"||current().world().location!=="finale"||!explorer||!explorer.near(layouts.finale.paths.at(-1))))return;window.dispatchEvent(new CustomEvent("cat-bond-resonance-battle-request",{detail:{sceneId:v.current.id,operation:op,region}}));}
 function availableMemories(region){
  const base=duoMemories[region],relations=window.CatRelations,pair=relations?.chosen?.();
  if(!base||pair?.length!==2||relations.pair(...pair).value<20)return [];
  const read=relations.memoryList(...pair),paths=explorer.layout.paths;
  return [base,base+"-moment"].flatMap((id,i)=>{
   const entry=relations.MEMORY_CATALOG.find(m=>m.id===id);
   if(!entry||read.includes(id))return [];
   return [{id,pair,entry,name:tr(entry.zh,entry.en),point:region==="forge"?(i===0?[.15,.84]:[.68,.455]):paths[i===0?1:paths.length-2]}];
  });
 }
 function visitDuoMemory(memory){
  const owner=State.S;
  go(memory.point,()=>{
   if(owner!==State.S||window.CatRelations.chosen().some((cat,i)=>cat.uid!==memory.pair[i].uid))return;
   const r=window.CatRelations.remember(...memory.pair,memory.id);
   if(!r.ok){report(r);render();return;}
   const e=memory.entry;
   window.UI.openRegionSecret({discovery:{id:e.id,icon:e.icon,name:e.zh,en:e.en,story:e.zhStory,storyEn:e.enStory},duoMemory:true,duoNames:memory.pair.map(c=>State.catName(c))});
   render();
  });
 }
 function retrySkyEncounter(expectedSpecies,owner){const b=current();if(State.S!==owner||game.scene!=="map"||game.battle||mode!=="region"||b.world().location!=="sky"||wildRegion!=="sky"||explorer?.puzzle||explorer?.survey()?.remote||wild?.species?.id!==expectedSpecies)return false;visitWild("sky");return true;}
 function visitWild(region){if(wild?.species)go(wild.point,()=>encounter?.(wild.species,region));}
 function visitOptionalBoss(id){const boss=REGIONAL_BOSSES[id];if(!boss||!explorer||explorer.puzzle||ceremony||explorer.survey()?.remote||!optionalBossAvailable(id,current().view(),current().world()))return;regionMenuOpen=false;go(boss.point,()=>{if(!window.CatBondRegionalArt?.prepareOptionalBoss?.(game,id))game.toast?.({zh:"暂时无法开始挑战，请检查队伍或稍后再试。",en:"Challenge unavailable. Check your party or try again."});});}
 function visitRuins(mode="legendary"){go(ruinsPoint,()=>{window.CatBondRegionalArt?.prepareRuins?.(game,mode);});}
 function visitHomeRepair(home){go(home.point,()=>{report(explorer.startHomeRepair());render()});}
 function visitFalseForestTrail(){go([.39,.40],()=>{notice=tr("这里没有水痕，声音却在重复。不是求救猫咪的位置。","There are no water marks here, but the voice repeats. This is not where the cats are trapped.");render()});}
 function visitForgePart(step){go(step.point,()=>{const r=explorer.collectForgePart(step.index);report(r,r.ok?step.clue:"");render()});}
 function visitTide(step){go(step.point,()=>{const r=explorer.traceTide(step.index);report(r,r.ok?step.clue:"");render()});}
 function visitScent(step){if(!explorer.near(step.point)){go(step.point,()=>{const live=explorer.scentStep();if(live?.index===step.index)visitScent(live);});return;}const r=explorer.traceScent(step.index);report(r,r.ok?step.clue:"");render();}
 function discoveryTargets(region,w,v){
  if(region==="finale")return [];
  if(!explorer||explorer.puzzle||ceremony)return [];
  const items=[...availableDiscoveries(region,w,v),...availableSideEvents(region,w,v)];if(!items.length)return [];
  const reserved=[...Object.entries(explorer.layout.features).filter(([op])=>v.objective.includes(op)).map(([,p])=>p),...explorer.rewardPoints().filter(p=>!w.pickups[region+":"+p.id]).map(p=>p.point),...storyNpcs().flatMap(n=>{const p=npcPosition(n);return [p,[p[0],Math.max(.035,p[1]-.1)],[p[0],p[1]-.045]]}),...availableMemories(region).map(m=>m.point),...explorer.cargoPoints(),wild?.point];
  for(const q of [explorer.scentStep(),explorer.tideStep(),explorer.forgeStep(),explorer.homeQuest()])if(q?.point)reserved.push(q.point);
  const survey=explorer.survey();if(survey?.from)reserved.push(survey.from);
  return layoutDiscoveries(items,reserved,W,H);
 }
 function visitDiscovery(s){const owner=State.S,source=explorer,region=current().world().location;go(s.at,()=>{if(owner!==State.S||explorer!==source||game.scene!=="map"||explorer.puzzle||ceremony||explorer.cargo||explorer.survey()?.remote)return;if(s.sideEvent){mountSideAdventure(region,{guard:()=>owner===State.S&&explorer===source&&game.scene==="map"&&current().world().location===region&&!explorer.puzzle&&!ceremony&&!explorer.cargo,commit:trace=>{const r=current().finishSideEvent(region,trace);if(r.ok){notice=r.message;render();}return r;}});return;}const result=current().discover(region,s.id);if(result.ok){const msg=result.message;if(!result.decoy)window.MorrowwishAudio?.effect?.("discover");const label=result.souvenir?[msg[0]+" · 纪念物："+result.souvenir[0],msg[1]+" · Keepsake: "+result.souvenir[1]]:msg;notice=label;game.toast?.({zh:label[0],en:label[1]});}else report(result);render();});}
 function visitCache(cache){if(!cache)return;go(cache.point,()=>{reportPickup(explorer.pickup(cache.id),["发现信使补给","Courier cache discovered"]);render()});}
 function visitSurvey(s){go(s.from,()=>{report(explorer.startSurvey());render()});}
 function pendingInvites(v=current().view()){const region=current().world().location;return explorer&&v.objective.includes("melody:"+region)&&!v.objective.includes("repair:"+region)?explorer.localNpcs().filter(n=>!explorer.invited.includes(n.id)):[];}
 function startStoryMelody(op){
  const r=explorer.interact(op);if(!r.ok){report(r);render();return;}
  if(r.ceremony){ceremony={owner:State.S,explorer,region:op.split(":")[1],elapsed:0,notes:0};if(ceremony.region==="harbor")image("harbor-ceremony");render();return;}
  const song=explorer.puzzle;
  if(song?.type==="melody"&&song.residentLead){operate(song.goal[2]);return;}
  report(r);render();
 }
 function visitFeature(op,p){if(op.startsWith("melody:")&&pendingInvites().length){regionMenuOpen=true;notice="";render();return;}regionMenuOpen=false;go(current().world().location==="sky"&&skyLaunch[op]||p,()=>{if(op.startsWith("battle:")){requestBattle(op,current().world().location);return;}if(op.startsWith("melody:")){startStoryMelody(op);return;}const result=explorer.interact(op);if(result.ceremony){ceremony={owner:State.S,explorer,region:op.split(":")[1],elapsed:0,notes:0};if(ceremony.region==="harbor")image("harbor-ceremony");render();return;}if(result.ok&&!result.puzzle&&op.startsWith("repair:")){
   const melody="melody:"+op.split(":")[1],target=explorer.layout.features[melody],v=current().view();
   // The repair action is explicit and proximity-verified. The resident-led
   // response follows immediately, using a fresh action token and real proof.
   if(v.objective.includes(melody)&&v.objective[0]===melody&&target&&explorer.near(target)&&!pendingInvites(v).length){startStoryMelody(melody);return;}
  }
  report(result,result.ok&&!result.puzzle?starfallClues[op]||[ "已完成 · 继续冒险","Completed · Continue your adventure"]:"");render()});}
 function storyNpcs(){const region=current().world().location,v=current().view(),hidden=(v.current?.id==="forest:R-01"?"yuchuan":v.current?.id==="forge:E-01"&&v.objective.includes("puzzle:festival-lantern")?"jinpo":v.current?.id==="sky:S-01"&&v.objective.includes("puzzle:sky-pouch")?"lingyu":null),locals=explorer.localNpcs().filter(n=>n.id!==hidden),residents=(window.CatBondResonance?.residents?.(region)||[]).filter(n=>n.id!==hidden);return [...locals,...residents.filter(n=>!locals.some(l=>l.id===n.id)).map((n,i)=>({...n,point:n.id==="muling"?(region==="harbor"?[.34,.478]:region==="sky"?[.74,.36]:region==="starfall"?(v.current?.id==="starfall:F-03"?[.92,.30]:[.86,.36]):explorer.layout.paths.at(-2)):explorer.layout.paths[Math.max(1,Math.min(explorer.layout.paths.length-2,Math.round((i+1)*explorer.layout.paths.length/(residents.length+1))))]}))];}
 function isMainNpc(npc,v,missing=pendingInvites(v)){
  const invite=missing.some(n=>n.id===npc.id),chooseFirst=v.current?.choiceTiming==="beforeAction"&&v.current.choices?.length&&!v.choice;
  const firstNpc={"npc:forest-dispute":"yahe","npc:forge-dispute":"xiaomao","npc:sky-dispute":"yuanfan","npc:archive-dispute":"baikan","npc:two-routes":"moye","npc:central-dispute-lichuan":"lichuan","npc:central-dispute":"xingya"}[v.objective[0]],reunionPrimary=v.current?.id==="epilogue:E-01"&&v.objective.includes("npc:regional-reunion")&&["qilan","yuchuan"].includes(npc.id);const relevant=reunionPrimary||firstNpc===npc.id|| (chooseFirst?v.current.choices.some(c=>c.npc===npc.id):invite||v.objective.some(op=>op.startsWith("npc:")&&(op.includes(npc.id)||(npc.id==="qilan"&&op==="npc:harbor-arrival")||(npc.id==="jiedeng"&&op==="npc:keeper-talk")))||(v.objective.some(op=>op.startsWith("npc:"))&&v.current?.lines?.[v.cursor]?.speaker===npc.id&&!firstNpc));return !!relevant;
 }
 function npcPosition(n){const v=current().view();if(n.id==="yahe"&&v.current?.id==="forest:R-03"&&v.objective.includes("rescue:trapped-cats"))return [.53,.40];if(n.id==="yuchuan"&&v.current?.id==="forest:R-03"&&v.objective.includes("rescue:trapped-cats"))return [.77,.44];return [...n.point];}
 function visitNpc(npc){const v0=current().view();if(v0.current?.id==="forest:R-03"&&v0.objective.includes("rescue:trapped-cats")){if(npc.id==="yahe"&&v0.objective[0]==="rescue:steady-channel"){visitFeature("rescue:steady-channel",explorer.layout.features["rescue:steady-channel"]);return;}if(npc.id==="yuchuan"&&v0.objective[0]==="rescue:trapped-cats"){visitFeature("rescue:trapped-cats",explorer.layout.features["rescue:trapped-cats"]);return;}if(["yahe","yuchuan"].includes(npc.id)){notice=tr("先沿水痕完成当前救援行动。","Follow the water marks and complete the current rescue action first.");render();return;}}regionMenuOpen=false;const rail=host.querySelector("#rw-region-actions");if(rail)rail.hidden=true;host.querySelector(".rw-region-toggle")?.setAttribute("aria-expanded","false");const region=current().world().location;go(npc.point,()=>{const v=current().view(),home=explorer.homeQuest(),actor=home?.actors.find(a=>a.id===npc.id&&!a.visited);if(home?.repaired&&actor){report(explorer.meetHomeResident(npc.id),actor.reply);render();return;}if(v.current?.choices?.length&&v.current.choiceTiming==="beforeAction"&&!v.choice&&v.current.choices.some(c=>c.npc===npc.id)){requestNpc(npc.id,region);return;}if(explorer.localNpcs().some(n=>n.id===npc.id)&&v.objective.includes("melody:"+region)&&!(["harbor","forest","forge","sky","library","starfall"].includes(region)&&v.objective.includes("repair:"+region))&&!explorer.invited.includes(npc.id)){const result=explorer.inviteNpc(npc.id);report(result,[npc.name.zh+"：好呀，我这就来参加合奏！",npc.name.en+": Of course! I’ll join the performance."]);regionMenuOpen=true;render();return;}requestNpc(npc.id,region);});}
 function visitCargo(o,carrying){const p=explorer.cargoPoints()[carrying?o.to:o.from];go(p,()=>{report(carrying?explorer.deliverCargo():explorer.startCargo(o),carrying?tr("当地居民收到物资","Local recipient accepted delivery"):tr("已领取","Collected")+" · "+cargoName(o.action));render()});}
 function tap(x,y){if(dialoguePaused())return;if(mode==="map"){const q=[(x-pan[0])/zoom,(y-pan[1])/zoom];if(portraitMap()&&!pickMarker(markerHits,q[0]*W,q[1]*H)&&!regions.some(n=>distance(project([n.x,n.y]),q)<.055)&&distance(project([.5,.5]),q)>.055)return;const p=markerPoint(q),n=regions.find(n=>distance([n.x,n.y],p)<.105);if(n){enterRegion(n.id);return;}if(distance(p,[.5,.5])<.085){const v=current().view(),op=v.current?.chapter==="finale"&&v.objective.find(o=>o.startsWith("battle:"));if(v.current?.chapter==="finale"&&v.ring){enterRegion("finale");}else{notice=tr("星铃 · 修复六地圣所后开启","Star Bell · Restore the six sanctuaries to unlock");render();}return;}const link=campaign.links.find(([a,z])=>{let u=regions.find(n=>n.id===a),v=regions.find(n=>n.id===z),dx=v.x-u.x,dy=v.y-u.y,t=Math.max(0,Math.min(1,((p[0]-u.x)*dx+(p[1]-u.y)*dy)/(dx*dx+dy*dy)));return distance(p,[u.x+t*dx,u.y+t*dy])<.027;});if(link){selectedRoute=link[0]+":"+link[1];render();}return;}
 if(!explorer)return;if(ceremony)return;[x,y]=cameraPoint([x,y]);if(explorer.puzzle){if(explorer.puzzle.type==="canonSpatial"){const spatial=explorer.puzzle.spatial,rect=canvas.getBoundingClientRect(),im=spatial.kind==="chase"&&portraitLayout()?chaseArt():null,action=im?portraitChaseTap(spatial,x,y,rect.width,rect.height,im.naturalWidth||928,im.naturalHeight||1648):spatialTap(spatial,x,y);if(spatial.kind==="chase"){if(action)chaseInput(action);}else spatialAct(action);return;}if(["melody","skyFlight","libraryRoutes"].includes(explorer.puzzle.type))return;const type=explorer.puzzle.type;let i=puzzleHit(x,y);if(type==="lanternFocus")i=y>=.58&&y<=.78?[.30,.50,.70].findIndex(cx=>Math.abs(x-cx)<.095):-1;if(type==="routing")i=Math.hypot(x-.5,y-.53)<.14?0:-1;if(type==="libraryCompanion")i=y>=.32&&y<=.78?(Math.abs(x-.50)<.13?1:explorer.puzzle.mirror.changes?(Math.abs(x-.30)<.13?0:Math.abs(x-.70)<.13?2:-1):-1):-1;if(type==="libraryLedger")i=y>=.34&&y<=.67?[.23,.50,.77].findIndex(cx=>Math.abs(x-cx)<.12):-1;if(i>=0)operate(i);return;}const selected=pickMarker(markerHits,x*W,y*H);if(selected?.activate){selected.activate();return;}if(selected)[x,y]=selected.target;else [x,y]=unproject([x,y]);const b=current(),v=b.view(),reg=b.world().location,t=[x,y],hit=p=>distance(t,p)<((reg==="forest"||reg==="sky")&&canvas.clientWidth<600?.052:.038),cargo=explorer.cargo,depots=explorer.cargoPoints();
 const survey=explorer.survey();if(survey?.remote){const cache=explorer.rewardPoints().find(p=>survey.cache&&explorer.near(p.point)&&hit(p.point));if(cache){visitCache(cache);return;}if(hit(survey.from)){visitSurvey(survey);return;}pending=null;beginWalk();explorer.walk(x,y);return;}
 if(survey&&!cargo&&hit(survey.from)){visitSurvey(survey);return;}
 const discovery=discoveryTargets(reg,b.world(),v).map(s=>({s,d:Math.hypot((x-s.point[0])*W,(y-s.point[1])*H)})).filter(o=>nearbyExploration(o.s.point,.22)&&o.d<Math.max(20,Math.min(32,20*W/Math.max(1,canvas.clientWidth)/zoom))).sort((a,b)=>a.d-b.d)[0];if(discovery){visitDiscovery(discovery.s);return;}
 if(cargo&&hit(depots[cargo.to])){visitCargo(cargo,true);return;}
 const opt=exchangeOptions(b,reg,campaign.links).find(o=>!cargo&&hit(depots[o.from]));if(opt){visitCargo(opt,false);return;}
 if(reg==="finale"&&hit(layouts.finale.paths.at(-1))){const op=v.objective[0],point=layouts.finale.paths.at(-1);if(op?.startsWith("battle:")){go(point,()=>requestBattle(op,"finale"));return;}if(op==="mechanism:muling-unlock"&&v.cursor===v.current.lines.length){go(point,openFinaleLatch);return;}if(op?.startsWith("cinematic:")){go(point,()=>window.CatBondChapterCinematics.play(v.current.id));return;}}
 for(const [id,boss] of Object.entries(REGIONAL_BOSSES))if(optionalBossAvailable(id,v,current().world())&&hit(boss.point)){visitOptionalBoss(id);return;}
 if(v.ending&&reg==="starfall"&&hit(ruinsPoint)){visitRuins();return;}
 const home=explorer.homeQuest();if(home&&!home.repaired&&hit(home.point)){visitHomeRepair(home);return;}
 if(reg==="forest"&&v.current?.id==="forest:R-03"&&v.objective[0]==="explore:water-marks"&&hit([.39,.40])){visitFalseForestTrail();return;}
 const part=explorer.forgeStep();if(part&&hit(part.point)){visitForgePart(part);return;}
 const tide=explorer.tideStep();if(tide&&hit(tide.point)){visitTide(tide);return;}
 const scent=explorer.scentStep();if(scent&&hit(scent.point)){visitScent(scent);return;}
 const launchOp=reg==="sky"&&v.objective.find(op=>skyLaunch[op]&&hit(skyLaunch[op]));if(launchOp){visitFeature(launchOp,explorer.layout.features[launchOp]);return;}
 const inviteTarget=pendingInvites(v).map(n=>({n,d:Math.min(...[0,.045,.10].map(dy=>distance(t,[n.point[0],Math.max(.035,n.point[1]-dy)])))})).filter(x=>x.d<.045).sort((a,b)=>a.d-b.d)[0];if(inviteTarget){visitNpc(inviteTarget.n);return;}
 const f=Object.entries(explorer.layout.features).find(([op,p])=>!libraryBlocked(op,v.objective,v)&&op!=="explore:scent-trail"&&(op!=="puzzle:safety-blueprint"||!explorer.forgeStep())&&(op!=="explore:tide-logbook"||!explorer.tideStep())&&(!op.startsWith("melody:")||!v.objective.includes("repair:"+op.split(":")[1]))&&v.objective.includes(op)&&(!(v.current?.orderedRequires||["starfall:F-02","starfall:F-04"].includes(v.current?.id))||v.objective[0]===op)&&hit(p));if(f){visitFeature(f[0],f[1]);return;}
 const memory=availableMemories(reg).find(m=>nearbyExploration(m.point,.22)&&hit(m.point));if(memory){visitDuoMemory(memory);return;}
 const npc=storyNpcs().find(n=>hit(npcPosition(n))||hit([npcPosition(n)[0],Math.max(.035,npcPosition(n)[1]-.10)])||hit([npcPosition(n)[0],npcPosition(n)[1]-.045]));if(npc){visitNpc(npc);return;}
 const cache=explorer.rewardPoints().find(p=>!b.world().pickups[reg+":"+p.id]&&nearbyExploration(p.point,.22)&&hit(p.point));if(cache){go(cache.point,()=>{reportPickup(explorer.pickup(cache.id),["发现宝藏","Treasure found"]);render()});return;}
 if(wild&&hit(wild.point)){visitWild(reg);return;}
 pending=null;beginWalk();explorer.walk(x,y);
 }
 function text(s,x,y,n=18,col="#f6e6c7"){ctx.font="600 "+n+"px Cat Bond Nunito, Cat Bond WenKai GB, Yuanti SC, PingFang SC, Microsoft YaHei, Noto Sans CJK SC, sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle=col;ctx.fillText(s,x*W,y*H);}
 const mapMarks=[],markerHits=[],actorAvoid=[];
 function regSkyLaunch(op,region){return region==="sky"?skyLaunch[op]:null;}
 function mark(x,y,k,t,col="#e9ca8e",labelDy=0,activate=null,discovery=null,optional=false){
  const target=[x,y];
  if(mode==="region"&&!explorer?.puzzle&&!ceremony&&(optional||k==="chest"||k==="discovery")&&!nearbyExploration(target,k==="npc"?.30:.22))return;
  [x,y]=project(target);
  if(k==="npc")y=Math.max(.045,y-(portraitMap()?.052:.06));
  mapMarks.push({x:x*W,y:y*H,k,t,col,labelDy,target,activate,discovery,optional});
 }
 function markerPoint(p){return pickMarker(markerHits,p[0]*W,p[1]*H)?.target||unproject(p);}
 function paintMapMarkers(){
  if(!mapMarks.length){if(canvas.dataset.affordances!=="[]")canvas.dataset.affordances="[]";return;}
  const metrics=markerMetrics(canvas.clientWidth,cameraEnabled()?zoom:1,W),{r,font}=metrics;
  const family="Cat Bond Nunito, Cat Bond WenKai GB, Yuanti SC, PingFang SC, Microsoft YaHei, Noto Sans CJK SC, sans-serif";
  const v=current().view(),focused=!!v.current&&!v.ending&&!explorer?.survey()?.remote;
  const marks=mapMarks.map(m=>({...m,main:focused&&!m.optional,secondary:!!m.optional})).sort((a,b)=>Number(b.main)-Number(a.main)||Number(a.secondary)-Number(b.secondary));
  const placed=layoutMarkerLabels(marks,metrics,(t,fs)=>{ctx.font="700 "+fs+"px "+family;return ctx.measureText(t).width;},W,H,actorAvoid);
  
  markerHits.splice(0,markerHits.length,...placed);
  const metadata=JSON.stringify(placed.map(({x,y,r,hit,rect,t,k,target,main,optional,labelFont,bubbleFont})=>({x,y,r,hit,rect,t,k,target,main,optional,font:labelFont||bubbleFont,scale:metrics.scale})));if(canvas.dataset.affordances!==metadata)canvas.dataset.affordances=metadata;
  for(const m of [...placed].sort((a,b)=>Number(a.main)-Number(b.main))){
   if(m.bubble)continue;
   ctx.save();if(m.origin&&(m.origin[0]!==m.x||m.origin[1]!==m.y)){ctx.beginPath();ctx.moveTo(...m.origin);ctx.lineTo(m.x,m.y);ctx.strokeStyle=m.main?"#a77b35":"#89766177";ctx.lineWidth=(m.main?1.5:.8)/metrics.scale;ctx.stroke();}ctx.beginPath();ctx.globalAlpha=1;ctx.arc(m.x,m.y,m.r,0,Math.PI*2);ctx.fillStyle=m.main?"#fff2cb":"#f8f1e2";ctx.shadowColor=m.main?"#b58d4c88":"transparent";ctx.shadowBlur=m.main?8/metrics.scale:0;ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle=m.main?"#b17d28":"#a59a86";ctx.lineWidth=(m.main?2.5:1)/metrics.scale;ctx.stroke();
   if(m.discovery){ctx.translate(m.x,m.y);ctx.scale(m.r/21,m.r/21);ctx.translate(-m.x,-m.y);paintDiscovery(ctx,{...m.discovery,point:[m.x/W,m.y/H]},W,H,frame/60);}
   else symbol(ctx,m.k,m.x,m.y,m.r/24,m.col);
   ctx.restore();
  }
  for(const m of [...placed].sort((a,b)=>Number(a.main)-Number(b.main))){if(!m.rect||m.bubble)continue;const {x,y,w,h}=m.rect;
   ctx.save();ctx.beginPath();ctx.moveTo(m.x,m.y);ctx.lineTo(Math.max(x,Math.min(x+w,m.x)),Math.max(y,Math.min(y+h,m.y)));ctx.strokeStyle=m.main?"#a77b35":"#89766177";ctx.lineWidth=(m.main?1.5:.7)/metrics.scale;ctx.stroke();
   ctx.beginPath();ctx.roundRect(x,y,w,h,6/metrics.scale);ctx.fillStyle=m.main?"#fff1ca":"#fbf5e9";ctx.fill();ctx.strokeStyle=m.main?"#b17d28":"#b4a58c";ctx.lineWidth=(m.main?2:0.8)/metrics.scale;ctx.stroke();
   ctx.font=(m.main?"800 ":"650 ")+(m.labelFont||font)+"px "+family;ctx.fillStyle=m.main?"#5c3a16":"#716858";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(m.t,x+w/2,y+h/2,w-6/metrics.scale);if(m.main){const u=1/metrics.scale;ctx.translate(m.x,m.y-m.r-7*u);ctx.rotate(Math.PI/4);ctx.fillStyle="#e9b955";ctx.strokeStyle="#875e27";ctx.lineWidth=u;ctx.fillRect(-5*u,-5*u,10*u,10*u);ctx.strokeRect(-5*u,-5*u,10*u,10*u);}ctx.restore();
  }
  // Canvas equivalent of .sg-npc-talk-marker in rpg-fullbleed.css:
  // same cream fill, gold outline, rounded body, speech glyph and tail.
  for(const m of placed){if(!m.bubble)continue;
   const {x,y,w,h}=m.bubble,u=1/metrics.scale,cx=x+w/2,cy=y+h/2;
   ctx.save();ctx.globalAlpha=1;ctx.fillStyle=m.main?"#fff1d2":"#fbf5e9";ctx.strokeStyle=m.main?"#aa844c":"#b4a58c";ctx.lineWidth=u;ctx.shadowColor=m.main?"#3a2b2533":"transparent";ctx.shadowBlur=m.main?8*u:0;ctx.shadowOffsetY=m.main?3*u:0;
   ctx.beginPath();ctx.roundRect(x,y,w,h,12*u);ctx.fill();ctx.shadowColor="transparent";ctx.stroke();
   if(m.main){ctx.save();ctx.strokeStyle="#c7943e";ctx.lineWidth=2*u;ctx.beginPath();ctx.roundRect(x-3*u,y-3*u,w+6*u,h+6*u,15*u);ctx.stroke();ctx.translate(cx,y-12*u);ctx.rotate(Math.PI/4);ctx.fillStyle="#e9b955";ctx.strokeStyle="#875e27";ctx.lineWidth=1.2*u;ctx.fillRect(-6*u,-6*u,12*u,12*u);ctx.strokeRect(-6*u,-6*u,12*u,12*u);ctx.restore();}
   ctx.beginPath();ctx.moveTo(cx-5*u,y+h-.5*u);ctx.lineTo(cx,y+h+5*u);ctx.lineTo(cx+5*u,y+h-.5*u);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(cx-5*u,y+h-.5*u);ctx.lineTo(cx,y+h+5*u);ctx.lineTo(cx+5*u,y+h-.5*u);ctx.stroke();
   const fs=m.bubbleFont,g=(m.main?17:12)*u;ctx.font=(m.main?"800 ":"600 ")+fs+"px "+family;
   const labelWidth=Math.min(ctx.measureText(m.t).width,Math.max(1,w-(m.main?36:23)*u)),left=cx-(g+5*u+labelWidth)/2;
   if(m.main){ctx.save();ctx.font="900 "+Math.max(15*u,g*1.3)+"px "+family;ctx.fillStyle="#9c5d0b";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("!",left+g/2,cy);ctx.restore();}else{ctx.save();ctx.translate(left,cy-g/2);ctx.scale(g/24,g/24);ctx.strokeStyle="#654923";ctx.lineWidth=1.7;ctx.lineJoin="round";
   ctx.beginPath();ctx.moveTo(4,4);ctx.lineTo(20,4);ctx.lineTo(20,16);ctx.lineTo(9,16);ctx.lineTo(4,20);ctx.closePath();ctx.stroke();ctx.lineWidth=2.5;ctx.lineCap="round";for(const dx of [8,12,16]){ctx.beginPath();ctx.moveTo(dx,10);ctx.lineTo(dx+.1,10);ctx.stroke();}ctx.restore();}
   ctx.fillStyle=m.main?"#654923":"#716858";ctx.textAlign="left";ctx.textBaseline="middle";ctx.fillText(m.t,left+g+5*u,cy,labelWidth);ctx.restore();
  }
 }

 function depthActor(p,s,draw){
  if(mode!=="region"||!explorer||explorer.puzzle||ceremony)return draw(s);
  const im=sceneArt(current().world().location);
  if(!im?.naturalWidth)return draw(s);
  const fit=portraitMap()?{x:0,y:0,width:W,height:H}:window.CatBondSceneFit.rect(im.naturalWidth,im.naturalHeight,W,H);
  const scale=s*depthScale(p[1]);
  return withForeground(ctx,im.src,fit,p[0]*W,p[1]*H,scale,()=>draw(scale));
 }
 function cat(sp,p,walk=false,s=.8){p=project(p);const fn=window.CatMotion?.draw||window.CatArt?.drawCat;if(fn&&sp)try{depthActor(p,s,scale=>{if(!explorer?.puzzle)actorAvoid.push({x:p[0]*W-38*scale,y:p[1]*H-65*scale,w:76*scale,h:100*scale});return fn(ctx,p[0]*W,p[1]*H,{species:sp,scale,t:frame/60,face:1,pose:walk?"walk":"idle"});});}catch(e){console.warn("World cat art unavailable",e.message)}}
 function paintQualityBoard(p){if(p.type!=="melody")return false;
 ctx.fillStyle="#243d3bcc";ctx.fillRect(W*.18,H*.16,W*.64,H*.66);ctx.textAlign="center";ctx.textBaseline="middle";ctx.font="bold 36px Cat Bond Nunito, Cat Bond WenKai GB, Yuanti SC, PingFang SC, Microsoft YaHei, Noto Sans CJK SC, sans-serif";ctx.fillStyle="#fff2ce";ctx.fillText(tr("圣所的铃声","Sanctuary bells"),W*.5,H*.28);
 p.goal.forEach((n,j)=>{const x=W*(.34+j*.16),shown=demoShown||j<p.values.length||j===demoIndex||(p.mistakes&&j===p.values.length);ctx.fillStyle=j===(demoActive?demoIndex:p.values.length)?"#ffe098":"#cce5d8";ctx.font="bold 56px Cat Bond Nunito, Cat Bond WenKai GB, Yuanti SC, PingFang SC, Microsoft YaHei, Noto Sans CJK SC, sans-serif";ctx.fillText(shown?melodyShapes[n]:"·",x,H*.48);ctx.font="24px Cat Bond Nunito, Cat Bond WenKai GB, Yuanti SC, PingFang SC, Microsoft YaHei, Noto Sans CJK SC, sans-serif";ctx.fillText(String(j+1)+(j<p.values.length?" ✓":""),x,H*.62);});return true;}
 // Keep all navigation, camera and hit-test geometry in 960x540 logical units.
 function fitWorldBacking(){
  const rect=canvas.getBoundingClientRect(),dpr=window.devicePixelRatio||1;
  const rendered=Math.max(rect.width/W,rect.height/H,1);
  const backing=Math.min(3,Math.max(1,Math.ceil(rendered*dpr*(cameraEnabled()?Math.min(zoom,1.5):1)*2)/2));
  const pw=Math.round(W*backing),ph=Math.round(H*backing);
  if(canvas.width!==pw||canvas.height!==ph){canvas.width=pw;canvas.height=ph;}
  ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
 }
 function draw(){if(!ctx||!canvas)return;if(portraitLayout()&&explorer?.puzzle?.spatial?.kind==="chase"){const rect=canvas.getBoundingClientRect(),w=rect.width,h=rect.height;if(!w||!h)return;const dpr=Math.min(3,window.devicePixelRatio||1),pw=Math.round(w*dpr),ph=Math.round(h*dpr);if(canvas.width!==pw||canvas.height!==ph){canvas.width=pw;canvas.height=ph;}ctx.setTransform(pw/w,0,0,ph/h,0,0);const im=chaseArt();host.dataset.artReady=String(!!(im.complete&&im.naturalWidth));canvas.dataset.camera="[1,0,0]";canvas.dataset.logicalWidth=String(w);canvas.dataset.logicalHeight=String(h);canvas.dataset.affordances="[]";const leader=State.S.cats?.find(c=>c.protagonist===true)||State.S.cats?.[0];drawPortraitChase(ctx,explorer.puzzle.spatial,w,h,lang(),(x,y,walk)=>{const fn=window.CatMotion?.draw||window.CatArt?.drawCat,sp=leader&&GameData.speciesById(leader.species);if(fn&&sp)fn(ctx,x,y,{species:sp,scale:.66,t:frame/60,face:1,pose:walk?"walk":"idle"});});return;}setMapGeometry();if(initialExploreCamera&&mode==="region"&&explorer&&cameraEnabled()){initialExploreCamera=false;centerCamera(explorer.position);}if(cameraEnabled())contain();fitWorldBacking();const b=current(),v=b.view(),w=b.world();
 // Publish the rendered transform as read-only DOM metadata for actual pointer-coordinate QA.
 const transform=cameraEnabled()?[zoom,...pan]:[1,0,0],cameraValue=JSON.stringify(transform);if(canvas.dataset.camera!==cameraValue)canvas.dataset.camera=cameraValue;mapMarks.length=0;markerHits.length=0;actorAvoid.length=0;if((explorer?.puzzle||ceremony)&&canvas.dataset.affordances!=="[]")canvas.dataset.affordances="[]";ctx.clearRect(0,0,W,H);ctx.fillStyle="#122637";ctx.fillRect(0,0,W,H);const native=nativePuzzleFile(),img=nativeCeremonyFile()?nativeImage(nativeCeremonyFile()):native?nativeImage(native):sceneArt(mode==="map"?"atlas":w.location);host.dataset.artReady=String(!!(img.complete&&img.naturalWidth));host.dataset.artSource=img.src;if(!img.complete||!img.naturalWidth){text(tr("正在载入场景原画","Loading environment artwork"),.5,.5,21);return;}
 if(mode==="map"){ctx.save();ctx.translate(pan[0]*W,pan[1]*H);ctx.scale(zoom,zoom);drawMapPlate(img);for(const [a,z] of campaign.links){let u=regions.find(n=>n.id===a),d=regions.find(n=>n.id===z),n=v.links[a+":"+z].length,harborRoute=a==="harbor"&&z==="forest"&&v.completed.includes("harbor:H-05");ctx.strokeStyle=n===4?"#ffe5a6":harborRoute?"#a6e6d2":"#c7c5aa";ctx.globalAlpha=(n===4||harborRoute) ? .95 : .5;ctx.lineWidth=n===4?4:harborRoute?3:2;ctx.setLineDash(n===4||harborRoute?[]:[9,9]);ctx.beginPath();const up=project([u.x,u.y]),dp=project([d.x,d.y]);ctx.moveTo(up[0]*W,up[1]*H);ctx.lineTo(dp[0]*W,dp[1]*H);ctx.stroke();}ctx.setLineDash([]);ctx.globalAlpha=1;for(const n of regions){const open=v.regions.includes(n.id),done=v.melodies.includes(n.id);mark(n.x,n.y,done?"bell":open?"star":"lock",tr(n.name,n.sub)+(open?"":tr(" · 未解锁"," · Locked")),open?"#f5d89f":"#84949e",0,null,null,n.id!==(v.current?.chapter==="prologue"?"harbor":v.current?.chapter));if(w.location===n.id){ctx.beginPath();const pos=project([n.x,n.y]);ctx.arc(pos[0]*W,pos[1]*H,23,0,Math.PI*2);ctx.strokeStyle="#adf1d5";ctx.lineWidth=2;ctx.stroke();}}mark(.5,.5,"bell",tr("中央星铃","Star Bell"),v.ring?"#ffe6a7":"#b49a6d",0,null,null,v.current?.chapter!=="finale");paintMapMarkers();ctx.restore();return;}
 if(ceremony){if(nativeHarborCeremony()){paintHarborPortraitCeremony(ctx,img,W,H,ceremony.elapsed,lang(),window.CatBondResonanceNPC?.drawResident);return;}if(nativeCeremonyFile()){nativePlate(img);const t=ceremony.elapsed,k=.5+.5*Math.sin(t*2),p=projectPortrait(ceremony.region,explorer.layout.features['repair:'+ceremony.region].slice(0,2),false),x=p[0]*W,y=p[1]*H,r=Math.min(W,H)*.22;const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(255,239,177,${.18+.18*k})`);g.addColorStop(1,'rgba(255,239,177,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);for(let i=0;i<3;i++){const a=(t*.55+i/3)%1;ctx.strokeStyle=`rgba(255,241,191,${.45*(1-a)})`;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,r*(.12+.75*a),r*(.07+.35*a),0,0,Math.PI*2);ctx.stroke();}return;}if(ceremony.region==="harbor"){const twilight=image("harbor-ceremony");paintHarborCeremony(ctx,twilight.complete&&twilight.naturalWidth?twilight:img,ceremony.elapsed,lang(),window.CatBondResonanceNPC?.drawResident);}else if(ceremony.region==="sky")drawSkyCeremony(img);else if(ceremony.region==="library")drawLibraryCeremony(img);else if(ceremony.region==="starfall")drawStarfallCeremony(img,v);else if(ceremony.region==="forge")paintForgeCeremony(ctx,img,ceremony.elapsed,lang(),(id,p)=>window.CatBondResonanceNPC?.drawResident?.(ctx,id,{x:p[0]*W,y:p[1]*H,scale:.9,time:ceremony.elapsed}));else drawForestCeremony(img);return;}if(explorer?.puzzle?.type==="skyFlight"){const leader=State.S.cats?.[0];paintSkyFlight(ctx,explorer.puzzle.flight,img,W,H,lang(),(x,y)=>cat(leader&&GameData.speciesById(leader.species),[x,y],false,.72),(id,x,y,scale)=>window.CatBondResonanceNPC?.drawResident?.(ctx,id,{x:x*W,y:y*H,scale,time:frame/60}),!!native);return;}ctx.save();try{if(cameraEnabled()){ctx.translate(pan[0]*W,pan[1]*H);ctx.scale(zoom,zoom);}drawMapPlate(img);if(!explorer)return;
 if(native&&explorer.puzzle){const p=explorer.puzzle,leader=State.S.cats?.find(c=>c.protagonist===true)||State.S.cats?.[0];
 if(p.type==="canonSpatial"){paintSpatial(ctx,p.spatial,W,H,lang(),(x,y,moving=false,species=null,scale=.8)=>cat(GameData.speciesById(species||leader?.species),[x,y],moving,scale),(id,x,y,scale)=>window.CatBondResonanceNPC?.drawResident?.(ctx,id,{x:x*W,y:y*H,scale,time:frame/60}),frame/60,true);}
 else paintPuzzle(ctx,p,lang(),campaign.cast,W,H,{nativeBackground:true,mirror:portraitMirrorCue?.source===explorer&&portraitMirrorCue?.owner===State.S?{previous:portraitMirrorCue.previous,elapsed:(performance.now()-portraitMirrorCue.started)/1000}:null});
 return;}if(w.location==="harbor"&&!portraitMap()&&!native)paintHarborEnvironment(ctx,v,frame);if(w.location==="forest"&&!portraitMap()&&!native)forestEffects(v);if(w.location==="forge"){if(!portraitMap()&&!native)paintForgeEnvironment(ctx,v,frame);const part=explorer.forgeStep();if(part)mark(...part.point,"gear",tr(...part.name),"#f6cb93");}if(w.location==="sky"&&!wideRemoteMap()&&!portraitMap()&&!native)paintSkyWeather(ctx,v,frame,W,H,img);if(w.location==="library"&&!portraitMap()&&!native)paintLibraryEnvironment(ctx,v,frame,W,H,explorer.position);const survey=explorer.survey();if(survey){mark(...survey.from,"star",tr(...survey.name),"#b7e7e4",0,null,null,!survey.remote);if(survey.remote){for(const p of explorer.rewardPoints())if(survey.cache&&explorer.near(p.point))mark(...p.point,"chest",tr("信使补给","Courier cache"));const leader=State.S.cats?.[0];cat(leader&&GameData.speciesById(leader.species),explorer.position,explorer.moving,.64);paintMapMarkers();return;}}for(const [op,[x,y,zh,en]] of Object.entries(explorer.layout.features))if(!libraryBlocked(op,v.objective,v)&&op!=="explore:scent-trail"&&(op!=="puzzle:safety-blueprint"||!explorer.forgeStep())&&(op!=="explore:tide-logbook"||!explorer.tideStep())&&(!["melody:harbor","melody:forest","melody:sky","melody:forge"].includes(op)||!v.objective.includes("repair:"+op.split(":")[1]))&&v.objective.includes(op)&&(!(v.current?.orderedRequires||["starfall:F-02","starfall:F-04","forest:R-03"].includes(v.current?.id))||v.objective[0]===op))mark(...(regSkyLaunch(op,w.location)||[x,y]),featureIcon(op),tr(zh,en));if(v.current?.id==="forest:R-03"&&v.objective[0]==="explore:water-marks")mark(.39,.40,"star",tr("干燥树根 · 呼唤","Dry roots · A call"),"#bba4de");const home=explorer.homeQuest();if(home&&!home.repaired)mark(...home.point,"gear",tr("暮铃的来信","Luna’s letter"),"#c9d7ac",0,null,null,true);const tide=explorer.tideStep();if(tide)mark(...tide.point,"book",tr(...tide.name),"#b6e6cd");const scent=explorer.scentStep();if(scent)mark(...scent.point,"book",tr(...scent.name),"#b6e6cd");const reg=w.location;if(reg==="finale"&&v.current?.chapter==="finale"){const op=v.objective[0],point=layouts.finale.paths.at(-1);if(op?.startsWith("battle:"))mark(...point,"star",tr("中央星铃","Star Bell"),"#ffe6a7",0,()=>go(point,()=>requestBattle(op,"finale")));else if(op==="mechanism:muling-unlock"&&v.cursor===v.current.lines.length)mark(...point,"star",tr("最后的锁","The last lock"),"#ffe6a7",0,()=>go(point,openFinaleLatch));else if(op?.startsWith("cinematic:"))mark(...point,"star",tr("继续剧情","Continue story"),"#ffe6a7",0,()=>go(point,()=>window.CatBondChapterCinematics.play(v.current.id)));}for(const [id,boss] of Object.entries(REGIONAL_BOSSES))if(optionalBossAvailable(id,v,current().world()))mark(...boss.point,"star",tr(...boss.name),"#dbc5ec",0,()=>visitOptionalBoss(id),null,true);if(v.ending&&reg==="starfall")mark(...ruinsPoint,"star",tr("星铃废墟","Star Bell Ruins"),"#dbc5ec");for(const n of storyNpcs()){const p=npcPosition(n),drawP=project(p);depthActor(drawP,.58,scale=>{actorAvoid.push({x:drawP[0]*W-48*scale,y:drawP[1]*H-100*scale,w:96*scale,h:104*scale});return window.CatBondResonanceNPC?.drawResident?.(ctx,n.id,{x:drawP[0]*W,y:drawP[1]*H,scale,time:frame/60});});if(!(reg==="forest"&&v.current?.id==="forest:R-03"&&v.objective.includes("rescue:trapped-cats")&&["yahe","yuchuan"].includes(n.id)))mark(p[0],portraitMap()?p[1]:Math.max(.035,p[1]-.10),"npc",(pendingInvites(v).some(x=>x.id===n.id)?tr("邀请 ","Invite "):explorer.invited.includes(n.id)?tr("已邀请 ","Invited "):"")+n.name[lang()],(explorer.invited.includes(n.id)||home?.actors.some(a=>a.id===n.id&&a.visited))?"#b3e8c9":"#a9d7d8",0,()=>visitNpc(n),null,!isMainNpc(n,v)&&!home?.actors.some(a=>a.id===n.id&&!a.visited));}
 for(const memory of availableMemories(reg))mark(...memory.point,"star",memory.name,"#dbb7ed",0,null,null,true);
 for(const p of explorer.rewardPoints())if(!w.pickups[reg+":"+p.id])mark(...p.point,"chest",tr("宝藏","Cache"),"#e9ca8e",0,null,null,true);if(!explorer.puzzle&&!ceremony)for(const s of discoveryTargets(reg,w,v))mark(...s.point,"discovery",tr(...(s.label||discoveryNames[s.kind]||["探索","Discover"])),"#dbb98a",0,()=>visitDiscovery(s),s,true);const opts=exchangeOptions(b,reg,campaign.links),cargo=explorer.cargo;if(cargo)mark(...explorer.cargoPoints()[cargo.to],"crate",tr("交付物资","Deliver cargo"),"#b6e6cd");else if(opts.length)mark(...explorer.cargoPoints()[opts[0].from],"crate",tr("领取物资","Collect cargo"),"#e9ca8e",0,null,null,true);if(wild)cat(wild.species,wild.point,false,.72);const leader=State.S.cats?.find(c=>c.protagonist===true)||State.S.cats?.[0];/* Normal exploration renders only the chosen protagonist. Recruited companions stay in the party; explicit puzzle and story actors are handled separately. */if(explorer.puzzle?.type!=="canonSpatial")cat(leader&&GameData.speciesById(leader.species),explorer.position,explorer.moving,.9);if(cargo){const cp=project(explorer.position);symbol(ctx,"crate",cp[0]*W+26,cp[1]*H+5,.7);}if(!explorer.puzzle)paintMapMarkers();if(explorer.puzzle){const p=explorer.puzzle;if(p.type==="canonSpatial"){paintSpatial(ctx,p.spatial,W,H,lang(),(x,y,moving=false,species=null,scale=.8)=>cat(GameData.speciesById(species||leader?.species),[x,y],moving,scale),(id,x,y,scale)=>window.CatBondResonanceNPC?.drawResident?.(ctx,id,{x:x*W,y:y*H,scale,time:frame/60}),frame/60,!!native);return;}if(!(reg==="forge"&&paintForgePuzzle(ctx,p,lang(),(id,pt,scale)=>window.CatBondResonanceNPC?.drawResident?.(ctx,id,{x:pt[0]*W,y:pt[1]*H,scale,time:frame/60})))&&!paintQualityBoard(p)&&(reg!=="harbor"||!paintHarborPuzzle(ctx,p,lang(),campaign.cast,frame)))paintPuzzle(ctx,p,lang(),campaign.cast,W,H);}}finally{ctx.restore();}}
 function drawLibraryCeremony(img){const t=ceremony.elapsed,k=Math.min(1,t/3.4),z=1;ctx.save();ctx.translate(W*.5,H*.5);ctx.scale(z,z);ctx.translate(-W*.5,-H*.5);window.CatBondSceneFit.draw(ctx,img,W,H);ctx.restore();paintLibraryEnvironment(ctx,current().view(),frame,W,H,explorer.position);const x=.89*W,y=.28*H,g=ctx.createRadialGradient(x,y,0,x,y,W*.44);g.addColorStop(0,"rgba(248,220,156,"+(.16+.20*Math.sin(Math.PI*k))+")");g.addColorStop(1,"rgba(248,220,156,0)");ctx.fillStyle=g;ctx.fillRect(0,0,W,H);for(const n of storyNpcs())if(["moye","baikan"].includes(n.id))window.CatBondResonanceNPC?.drawResident?.(ctx,n.id,{x:n.point[0]*W,y:n.point[1]*H,scale:1,time:t});const leader=State.S.cats?.[0];cat(leader&&GameData.speciesById(leader.species),explorer.position,false,.9);text(tr("照影调 · 记忆重归邻里","Reflections · memories return to their neighbors"),.5,.86,24);if(t>1.8){const k=Math.min(1,(t-1.8)*1.5),a=[.89*W,.28*H],b=[.20*W,.35*H];ctx.save();ctx.strokeStyle="#d1e4ff";ctx.lineWidth=2.5;for(const [from,to,delay] of [[b,a,0],[a,b,.35]]){const q=Math.max(0,Math.min(1,k-delay));if(!q)continue;ctx.beginPath();ctx.moveTo(...from);ctx.lineTo(from[0]+(to[0]-from[0])*q,from[1]+(to[1]-from[1])*q);ctx.stroke();}text(tr("云脊群岛 ↔ 月镜书库","Skyspine ↔ Moonmirror"),.32,.30,16,"#e1efff");ctx.restore();}}
 function drawStarfallCeremony(img,v){
  const t=ceremony.elapsed,u=Math.min(1,t/2.8),ease=u*u*(3-2*u),z=1;
  ctx.save();ctx.translate(-W*.82*(z-1),-H*.27*(z-1));ctx.scale(z,z);window.CatBondSceneFit.draw(ctx,img,W,H);
  const x=.89*W,y=.30*H,origins=[[.75,.43],[.83,.40],[.88,.46]];
  for(const [i,id] of ["xingya","lichuan"].entries()){const p=origins[i];window.CatBondResonanceNPC?.drawResident?.(ctx,id,{x:p[0]*W,y:p[1]*H,scale:.94,time:t});}
  const leader=State.S.cats?.[0];if(leader)cat(GameData.speciesById(leader.species),origins[2],false,.88);
  // Real local responses meet in the sanctuary; other routes light ONLY for acknowledged cargo.
  for(let i=0;i<origins.length;i++){const p=origins[i],start=.32+i*.70,k=Math.max(0,Math.min(1,(t-start)/.72));if(!k)continue;const dx=p[0]*W,dy=p[1]*H;ctx.strokeStyle=["#b5d9ff","#e7c9ff","#ffdf9c"][i];ctx.shadowBlur=16;ctx.shadowColor=ctx.strokeStyle;ctx.lineWidth=2.6;ctx.beginPath();ctx.moveTo(dx,dy);ctx.quadraticCurveTo(dx+(x-dx)*k*.5,dy-38*k,dx+(x-dx)*k,dy+(y-dy)*k);ctx.stroke();}
  ctx.shadowBlur=0;
  for(let i=0;i<5;i++){const a=(t*.44+i/5)%1;ctx.strokeStyle="rgba(226,208,255,"+(.7*(1-a)*ease)+")";ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(x,y,10+a*81,5+a*43,0,0,Math.PI*2);ctx.stroke();}
  const g=ctx.createRadialGradient(x,y,1,x,y,140);g.addColorStop(0,"rgba(244,225,255,"+(.44*ease)+")");g.addColorStop(1,"rgba(204,181,255,0)");ctx.fillStyle=g;ctx.fillRect(x-140,y-140,280,280);
  for(let i=0;i<34;i++){const a=i*2.399+t*.45,rad=(i%9)*9+13*t;ctx.globalAlpha=.45+.20*Math.sin(t*2+i);ctx.fillStyle="#e5daff";ctx.beginPath();ctx.arc(x+Math.cos(a)*rad,y+Math.sin(a)*rad*.56-t*9,1.4+i%3*.5,0,Math.PI*2);ctx.fill();}
  ctx.restore();ctx.save();ctx.globalAlpha=Math.min(1,t*2);
  const shade=ctx.createLinearGradient(0,H*.60,0,H);shade.addColorStop(0,"rgba(15,16,37,0)");shade.addColorStop(1,"rgba(15,16,37,.93)");ctx.fillStyle=shade;ctx.fillRect(0,H*.60,W,H*.40);
  text(tr("续星调","Beyond Stars"),.5,.79,32,"#f6eaff");
  text(tr("星芽与砾川共同回应","Nova and Flint answer together"),.5,.87,16,"#e4dcf7");
  text(tr("远处的铃声正逐一回应","Distant bells answer, one by one"),.5,.93,15,"#e4dcf7");ctx.restore();
  const trial=explorer.active?.shortRing;if(trial){ctx.save();const center=[.34*W,.32*H],rad=H*.17,pts=campaign.regions.map((_,i)=>[center[0]+Math.cos(i*Math.PI/3-Math.PI/2)*rad,center[1]+Math.sin(i*Math.PI/3-Math.PI/2)*rad]),colors=["#f6d88b","#b7e5a8","#ffbb88","#b4dcff","#d8c2ff","#ffe9b5"];for(let i=0;i<6;i++){const a=pts[i],b=pts[(i+1)%6],count=trial.events.filter(e=>e.edge===i).length;ctx.strokeStyle=count===2?colors[i]:"#9f9eab55";ctx.lineWidth=count===2?4:2;ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...(count===1?[(a[0]+b[0])/2,(a[1]+b[1])/2]:b));ctx.stroke();}for(let i=0;i<6;i++){const q=pts[i],lit=trial.events.some(e=>e.region===campaign.regions[i]);ctx.fillStyle=lit?colors[i]:"#596173";ctx.beginPath();ctx.arc(...q,lit?8:5,0,Math.PI*2);ctx.fill();ctx.font="12px sans-serif";ctx.textAlign="center";ctx.fillStyle="#fff0d9";ctx.fillText(tr(...layouts[campaign.regions[i]].name),q[0],q[1]+22);}ctx.restore();}

 }
 function drawSkyCeremony(img){
  const t=ceremony.elapsed,u=Math.min(1,t/3.1),ease=u*u*(3-2*u),z=1;
  ctx.save();ctx.translate(-W*.65*(z-1),-H*.22*(z-1));ctx.scale(z,z);window.CatBondSceneFit.draw(ctx,img,W,H);
  const x=.89*W,y=.24*H,g=ctx.createRadialGradient(x,y,4,x,y,140);g.addColorStop(0,"#fff3b59e");g.addColorStop(1,"#fff3b500");ctx.fillStyle=g;ctx.fillRect(x-140,y-140,280,280);
  for(let i=0;i<4;i++){const a=(t*.42+i/4)%1;ctx.strokeStyle="rgba(211,249,255,"+(.6*(1-a))+")";ctx.lineWidth=2.4;ctx.beginPath();ctx.ellipse(x,y,12+a*135,5+a*50,0,0,Math.PI*2);ctx.stroke();}
  for(const [i,id] of ["lingyu","yuanfan"].entries()){const p=i?[.87,.32]:[.81,.36];window.CatBondResonanceNPC?.drawResident?.(ctx,id,{x:p[0]*W,y:p[1]*H,scale:1,time:t});}
  const leader=State.S.cats?.[0];cat(leader&&GameData.speciesById(leader.species),[.78,.42],false,.85);
  for(let i=0;i<3;i++){const progress=Math.max(0,Math.min(1,(t-i*.3)/2.5));ctx.strokeStyle="rgba(222,250,236,"+(.5+progress*.4)+")";ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo((.18+i*.07)*W,(.55-i*.03)*H);ctx.quadraticCurveTo((.18+progress*.35)*W,(.18+i*.07)*H,(.18+progress*.71)*W,(.55-progress*.31)*H);ctx.stroke();}
  ctx.restore();ctx.save();const shade=ctx.createLinearGradient(0,H*.62,0,H);shade.addColorStop(0,"#142d4700");shade.addColorStop(1,"#142d47e8");ctx.fillStyle=shade;ctx.fillRect(0,H*.62,W,H*.38);text(tr("逐风调","The Song of the Open Sky"),.5,.83,32,"#f5f0c7");text(tr("两位信使共同奏响 · 航线重开","Two couriers answer · The air route reopens"),.5,.91,17,"#e4f8ef");if(t>1.8){const k=Math.min(1,(t-1.8)*2);ctx.globalAlpha=k;const gx=.20*W,gy=.51*H;ctx.fillStyle="#ffcd8a";for(let i=0;i<7;i++){ctx.beginPath();ctx.arc(gx+(i%4)*12,gy+Math.floor(i/4)*10,3,0,Math.PI*2);ctx.fill();}ctx.strokeStyle="#ffd59b";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(gx,gy);ctx.quadraticCurveTo(.43*W,.14*H,.82*W,.32*H);ctx.stroke();text(tr("千灯城回铃","Lantern City answers"),.22,.60,14,"#fff0be");}ctx.restore();
 }
 function drawForestCeremony(img){
  const t=ceremony.elapsed,u=Math.min(1,t/2.7),ease=u*u*(3-2*u),z=.96+.04*ease;
  ctx.save();ctx.translate(W*(1-z)/2,H*(1-z)/2);ctx.scale(z,z);window.CatBondSceneFit.draw(ctx,img,W,H);const x=.89*W,y=.20*H;
  for(let i=0;i<4;i++){const a=(t*.53+i/4)%1;ctx.strokeStyle="rgba(238,255,184,"+(.65*(1-a))+")";ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(x,y,16+a*91,9+a*43,0,0,Math.PI*2);ctx.stroke();}
  const glow=ctx.createRadialGradient(x,y,1,x,y,130);glow.addColorStop(0,"rgba(250,255,198,.55)");glow.addColorStop(1,"rgba(250,255,198,0)");ctx.fillStyle=glow;ctx.fillRect(x-130,y-130,260,260);
  for(const [i,id] of ["yahe","yuchuan"].entries()){const pt=i?[.88,.28]:[.82,.32];window.CatBondResonanceNPC?.drawResident?.(ctx,id,{x:pt[0]*W,y:pt[1]*H,scale:.92,time:t});}
  const leader=State.S.cats?.[0];cat(leader&&GameData.speciesById(leader.species),[.86,.36],false,.85);window.CatBondResonanceNPC?.drawResident?.(ctx,"muling",{x:.94*W,y:.29*H,scale:.75,time:t});if(t>1.4){ctx.save();ctx.globalAlpha=Math.min(.8,(t-1.4)*1.4);ctx.lineWidth=2;ctx.lineCap="round";for(const [i,ex] of [.835,.945].entries()){ctx.strokeStyle=i?"#a2baa1":"#f5e6a2";ctx.beginPath();ctx.moveTo(x,y+9);ctx.quadraticCurveTo((x+ex*W)/2,y+23,ex*W,y+45);ctx.stroke();}ctx.restore();}
  for(let i=0;i<40;i++){const a=i*2.399+t*.4,rad=(i%10)*8+t*8;ctx.globalAlpha=.38+.25*Math.sin(t*2+i);ctx.fillStyle="#e9ffd2";ctx.beginPath();ctx.arc(x+Math.cos(a)*rad,y+Math.sin(a)*rad*.5-t*12,1.8+i%3*.4,0,Math.PI*2);ctx.fill();}ctx.restore();
  const fade=Math.min(1,t*2);ctx.save();ctx.globalAlpha=fade;const shade=ctx.createLinearGradient(0,H*.63,0,H);shade.addColorStop(0,"rgba(10,30,24,0)");shade.addColorStop(1,"rgba(10,30,24,.92)");ctx.fillStyle=shade;ctx.fillRect(0,H*.63,W,H*.37);text(tr("相枝调","The Song of Living Roots"),.5,.83,32,"#eaffcb");text(tr("水路重连 · 两座森林终于相互回应","The channels rejoin. Two forests answer each other."),.5,.91,17,"#e2f2ce");ctx.restore();
 }
 function forestEffects(v){
  const t=frame/60,restored=v.sanctuaries.includes("forest"),melody=v.melodies.includes("forest"),p=explorer.position,scent=explorer.scentStep();ctx.save();
  for(let i=0;i<3;i++){const x=(.18+i*.29)*W+Math.sin(t*.33+i)*11,g=ctx.createLinearGradient(x,0,x+110,H*.68);g.addColorStop(0,"rgba(239,248,180,0.15)");g.addColorStop(1,"rgba(239,248,180,0)");ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(x-17,0);ctx.lineTo(x+25,0);ctx.lineTo(x+145,H*.68);ctx.lineTo(x+70,H*.68);ctx.closePath();ctx.fill();}
  for(let i=0;i<36;i++){const x=((i*.317+Math.sin(t*.19+i)*.024+1)%1)*W,y=((i*.173+t*.014)%1)*H;ctx.globalAlpha=.17+.15*Math.sin(t+i);ctx.fillStyle=i%4?"#d5e9a4":"#a8ead6";ctx.beginPath();ctx.ellipse(x,y,1.8+i%3,1+i%2,t*.4+i,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
  if(scent){const d=distance(p,scent.point),strength=Math.max(.12,1-d*2.2);for(let i=0;i<15;i++){const phase=t*.45+i*.7,rad=(.025+.04*(1-strength))*W;ctx.globalAlpha=strength*(.34+.25*Math.sin(phase));ctx.fillStyle="#e9e29d";ctx.beginPath();ctx.arc(scent.point[0]*W+Math.cos(phase)*rad*.8,scent.point[1]*H+Math.sin(phase)*rad*.44,2.2,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;}
  const cleared=restored||v.completed.includes("forest:R-03")||v.current?.id==="forest:R-03"&&!v.objective.includes("rescue:trapped-cats");
  if(v.current?.id==="forest:R-03"&&!cleared&&v.objective.includes("battle:root-echo")){const x=.69*W,y=.53*H;const g=ctx.createRadialGradient(x,y,3,x,y,65);g.addColorStop(0,"rgba(55,35,20,.48)");g.addColorStop(1,"rgba(55,35,20,0)");ctx.fillStyle=g;ctx.fillRect(x-65,y-65,130,130);for(let i=0;i<8;i++){const a=i*2.399,dx=Math.cos(a)*(12+i*3),dy=Math.sin(a)*(8+i*2);ctx.strokeStyle=i%2?"#8b7456aa":"#503d2aa0";ctx.lineWidth=3+i%3;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(x+dx,y+dy);ctx.quadraticCurveTo(x+dx+7,y+dy-12,x+dx*1.8,y+dy*1.4);ctx.stroke();}}
  if(cleared){ctx.strokeStyle=restored?"#b1f6d1aa":"#8cddcba0";ctx.lineWidth=4;ctx.setLineDash([12,18]);ctx.lineDashOffset=-t*35;ctx.beginPath();ctx.moveTo(.53*W,.40*H);ctx.quadraticCurveTo(.56*W,.48*H,.69*W,.53*H);if(restored)ctx.quadraticCurveTo(.81*W,.41*H,.89*W,.20*H);ctx.stroke();ctx.setLineDash([]);}
  if(melody){const x=.89*W,y=.20*H,g=ctx.createRadialGradient(x,y,1,x,y,95);g.addColorStop(0,"rgba(237,255,191,.38)");g.addColorStop(1,"rgba(237,255,191,0)");ctx.fillStyle=g;ctx.fillRect(x-95,y-95,190,190);for(let i=0;i<3;i++){const a=(t*.35+i/3)%1;ctx.strokeStyle="rgba(220,255,190,"+(.36*(1-a))+")";ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,12+a*67,6+a*31,0,0,Math.PI*2);ctx.stroke();}}
  ctx.restore();
  if(!explorer.puzzle){const level=p[1]<.37?tr("树冠","Canopy"):p[0]>.54&&p[1]>.44?tr("根系水道","Root channels"):tr("林地","Forest floor");ctx.save();ctx.fillStyle="#142e28d9";ctx.beginPath();ctx.roundRect(15,15,144,31,8);ctx.fill();text(level,.09,.055,15,"#d6edc3");ctx.restore();}
 }
 function update(dt){current();if(!host||!window.CatBondResonance?.view)return;host.hidden=game.scene!=="map";if(dialoguePaused()){pointers.clear();drag=null;pinch=0;dragged=true;return;}if(host.hidden||window.ResonanceBook?.isOpen?.()){clearRewardPopup();if(demoActive){stopDemo();revision="";}return;}if(sync()!==revision){render();return;}if(explorer){if(spawnDelay>0){spawnDelay-=dt;if(spawnDelay<=0){spawnWild(current().world().location);render();}}if(ceremony){if(ceremony.owner!==State.S||ceremony.explorer!==explorer){ceremony=null;return;}ceremony.elapsed+=Math.min(.1,Math.max(0,dt));if(ceremony.region==="starfall"){for(const e of explorer.advanceShortRing(dt)){const tones=[392,523.25,329.63,659.25,440,587.33],note=tones[campaign.regions.indexOf(e.region)];window.MorrowwishAudio?.note?.(note,.24,.10);}}if(ceremony.notes<3&&ceremony.elapsed>=[.4,1.12,1.84][ceremony.notes]){if(ceremony.region==="forest"){melodyNote({operation:"melody:forest"},[1,0,2][ceremony.notes++]);}else window.MorrowwishAudio?.note?.((ceremony.region==="harbor"?[261.63,392,329.63]:ceremony.region==="forge"?[392,329.63,261.63]:ceremony.region==="starfall"?[329.63,493.88,659.25]:ceremony.region==="library"?[587.33,329.63,440]:ceremony.region==="sky"?[523.25,659.25,392]:[523.25,392,659.25])[ceremony.notes++],.63,.14);}if(ceremony.elapsed>=(ceremony.region==="forge"?4.4:ceremony.region==="library"?3.6:ceremony.region==="starfall"?4.3:3.1)){const star=ceremony.region==="starfall",library=ceremony.region==="library",sky=ceremony.region==="sky",forge=ceremony.region==="forge",harbor=ceremony.region==="harbor";ceremony=null;const r=explorer.complete();report(r,r.ok?(harbor?["归家调 · 古铃已回应","Coming Home · The sanctuary answers"]:forge?["承火调已奏响 · 千灯城重燃彩灯","Song of Ember · Lantern City shines again"]:star?["续星调已奏响 · 星原圣所恢复","Beyond Stars restored · Starfall sanctuary awakened"]:library?["照影调已奏响 · 月镜圣所恢复","Reflections restored · Moonmirror sanctuary awakened"]:sky?["逐风调已奏响 · 空中航线恢复","Open Sky restored · Air routes reopen"]:["相枝调已奏响 · 森林圣所恢复","Living Roots restored · Forest sanctuary awakened"]):"");render();if(forge&&r.ok&&current().view().current?.id==="forge:E-04"&&current().view().lineReady)window.CatBondResonance?.showCurrent?.();return;}draw();return;}const chase=explorer.puzzle?.spatial,chaseStatus=host.querySelector("[data-chase-status]");if(chase?.kind==="chase"&&chase.moves&&chaseStatus){const message=tr("街巷追逐 ","Street chase ")+(chase.phase+1)+"/3 · "+(chase.chaseActive?tr("正在追赶","Chasing"):chase.readyPounce?tr("扑住铃光！","Pounce now!"):tr("点击铃光继续","Tap the light to continue"));const follow=host.querySelector("[data-chase-follow]"),shortcut=host.querySelector("[data-chase-shortcut]");if(follow){follow.disabled=chase.chaseActive;follow.textContent=chase.readyPounce?tr("扑住铃光","Pounce!"):tr("追上铃光","Chase the light");}if(shortcut){shortcut.hidden=chase.phase!==1;shortcut.disabled=chase.chaseActive;}if(chaseStatus.textContent!==message)chaseStatus.textContent=message;}const spatial=explorer.spatialTick(dt);if(spatial){report(spatial,spatial.ok&&!spatial.pending?["成功 · 继续探索","Success · Continue exploring"]:"");render();return;}const flight=explorer.flightTick(dt);if(flight){report(flight,flight.ok?["安全降落 · 航线已验证","Safe landing · route verified"]:"");render();return;}const flightStatus=host.querySelector("[data-sky-flight-status]"),f=explorer.puzzle?.flight;if(flightStatus&&f){flightStatus.dataset.gates=String(f.gate);flightStatus.dataset.attempts=String(f.attempts);flightStatus.dataset.phase=f.notice;flightStatus.dataset.progress=String(f.x);if(f.openGlide)flightStatus.dataset.chosenRoute=f.routeUsed||"";const message=f.operation==="puzzle:joint-flight"?tr("飞行 ","Flight ")+Math.round(f.x*100)+"% · "+(f.notice==="cloud"?tr("云雾减速","Cloud slows you"):f.notice==="approach"?tr("即将降落","Landing soon"):tr("拖动控制高度","Drag to steer")):f.practice?(f.notice==="flying"?tr("飞行进度 ","Flight progress ")+Math.round(f.x*100)+"% · "+tr("借风后回到中央","Catch wind, then return to middle"):tr("升高借风，安全落地","Climb into the updraft and land safely")):f.openGlide?(f.notice==="ready"?tr("选择高处借风或沿低处绕行","Climb into the updraft or glide low"):f.notice==="flying"?tr("飞行进度 ","Flight progress ")+Math.round(f.x*100)+"% · "+(f.x>.72?tr("回到中央降落","Return to center to land"):tr("沿云瀑外侧或上方飞行","Fly above or below the waterfall")):tr("重新起飞，可选择另一条路线","Relaunch or try the other route")):f.notice==="ready"?tr("拖动高度或按升高／平飞／降低，穿过三个风圈后回到中央。","Drag altitude or use Climb / Level / Descend. Cross three wind gates, then return to center."):f.notice==="flying"?tr("航标 ","Gates ")+f.gate+"/3 · "+tr("最后回到中央降落","Return to center for landing"):tr("重新起飞，风圈已放宽。","Relaunch. Wind gates are wider.");const flightMessage=f.paused?tr("已在安全岛降落，选择高度继续起飞。","Resting on the safe isle. Choose altitude to relaunch."):message;if(flightStatus.textContent!==flightMessage)flightStatus.textContent=flightMessage;const land=host.querySelector("[data-sky-land]");if(land)land.disabled=!canLandSkyFlight(f);}explorer.tick(dt);followPlayer();const cacheButton=host.querySelector("[data-sky-cache]");if(cacheButton){const p=explorer.rewardPoints()[0];cacheButton.disabled=!p||!explorer.near(p.point);}frame++;if(pending&&!explorer.moving){const p=pending;pending=null;if(explorer.near(p.p))p.fn();}draw();}}
 return {init,enterMap,enterRegion,resumeRegion,retrySkyEncounter,libraryMemory:()=>current().view().current?.id==="library:M-02"?current().libraryRecord():null,exitToYard,update,draw(){},handleTap(){return false},setDestination(){},panBy(){},onEncounter(fn){encounter=fn},onCollect(){},onExit(fn){exit=fn},isUnlocked:id=>id==="finale"?current().view().ring&&current().view().current?.chapter==="finale":current().view().regions.includes(id),REGIONS:regions,get mode(){return mode},get currentRegion(){return current().world().location},get atlasTargets(){return []},get spawns(){return []},get view(){return null}};
}
export const worldRuntime=install();
window.CatBondCanonicalWorld=worldRuntime;
