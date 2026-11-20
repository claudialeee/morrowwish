/* Pawsibly Innocent! — original Morrow Wish cat stealth-puzzle game. No dependencies. */
(()=>{"use strict";
const W=10,H=7,T=84,NEED=3,$=id=>document.getElementById(id);
const ROOMS=[
{en:"The Sunny Lounge",zh:"阳光客厅",enSub:"Grab the nearby fish first. The human moves when you do.",zhSub:"先偷旁边的小鱼。你走一步，主人也走一步。",goal:29,patrol:[[7,2],[8,2],[8,1],[7,1]],rows:["..........",".....S....","...V......",".CF....F..","...S..H...","....B..F..","...F.....E"]},
{en:"Kitchen Caper",zh:"厨房偷吃计划",enSub:"Four fish in the kitchen. Can you steal every last one?",zhSub:"厨房里有四条鱼。你敢全部偷走吗？",goal:30,patrol:[[6,1],[8,1],[8,4],[6,4]],rows:[".....F....","..S...H...",".C...V...F","...##.....","..F...S...","..B...F...",".........E"]},
{en:"The Laundry Incident",zh:"洗衣房事件",enSub:"The vacuum patrols the laundry. Watch its next move.",zhSub:"扫地机在洗衣房巡逻，留意它的移动方向。",goal:32,patrol:[[7,2],[9,2],[9,5],[7,5]],rows:["....V...F.",".C..S.....",".....B.H..","..###.....",".F.....S..","....F.....","...F.....E"]},
{en:"A Very Loud Nap",zh:"午睡大骚动",enSub:"The owner is asleep. Keep the room quiet.",zhSub:"主人正在睡觉。轻手轻脚，别把人吵醒了。",goal:32,patrol:[[5,2],[7,2],[7,5],[5,5]],rows:["...F......",".C...S...F","..S..H....",".....##...","..B..F....","...V...F..",".........E"]},
{en:"Library of Secrets",zh:"图书馆秘密",enSub:"Creaky floorboards alert the owner. Find a silent route.",zhSub:"嘎吱作响的地板会惊动主人。找条安静路线。",goal:35,patrol:[[6,3],[8,3],[8,1],[6,1]],rows:["....F.....",".C.#......","...#...F..","..V...H...","...#..S...","...F...B..","......F..E"]},
{en:"The Great Plant Plot",zh:"盆栽大阴谋",enSub:"The garden rustles when you step on fallen leaves.",zhSub:"花园里的落叶沙沙响，踩上去可要小心。",goal:36,patrol:[[7,1],[9,1],[9,4],[7,4]],rows:["..F.......",".C.....H..","...SS..F..","..V.......",".....#....","..F..B....",".......F.E"]},
{en:"Midnight Snack Club",zh:"午夜零食俱乐部",enSub:"Use the midnight shadows to stay out of sight.",zhSub:"午夜的阴影是你的掩护，趁黑行动吧。",goal:37,patrol:[[6,4],[8,4],[8,1],[6,1]],rows:["....F...F.",".C..##....","......V...","..S...S...","....B.H...","...F......",".....F...E"]},
{en:"The Grand Alibi",zh:"终极喵喵大暴走",enSub:"One last heist. The owner grows suspicious after three fish.",zhSub:"最后一次行动！偷够三条鱼后主人会提高警惕。",goal:39,patrol:[[8,2],[9,2],[9,5],[8,5]],rows:["...F....F.",".C..S.....","...V....H.","....##....","..F....B..","...S...F..",".........E"]}
];
/* Interactive props remain visible in every language. All locations are reachable floor tiles. */
const EXTRAS=[
 {yarn:[2,2],relic:[5,5],light:[7,0]},
 {yarn:[4,0],relic:[1,5],milk:[8,5],light:[7,4]},
 {yarn:[1,2],relic:[4,4],light:[0,0],robot:[8,4]},
 {yarn:[5,0],relic:[8,5],light:[8,3],robot:[6,4]},
 {yarn:[1,5],relic:[6,5],light:[8,0],robot:[8,4]},
 {yarn:[4,1],relic:[8,5],milk:[0,3],light:[6,0],robot:[8,3]},
 {yarn:[2,2],relic:[8,4],light:[8,3],robot:[9,3]},
 {yarn:[1,5],relic:[8,4],milk:[0,4],light:[5,0],robot:[8,3]}
];
// Brightly drawn creaky floor tiles, introduced only after the first two rooms.
const CREAKY_TILES={4:[2,1],5:[3,3],6:[3,3],7:[6,3]};
const P=a=>a?{x:a[0],y:a[1]}:null;
const SCENES=[
 {floor:["#fff0db","#fbe5d0"],rug:"#e4c8e8",wall:"#f5cdb9",type:"lounge"},
 {floor:["#fff2df","#f8e6db"],rug:"#efd8ac",wall:"#f4d6aa",type:"kitchen"},
 {floor:["#e8f4f0","#ddefe9"],rug:"#b6d6d8",wall:"#c5e4db",type:"laundry"},
 {floor:["#f6edfa","#eee6f5"],rug:"#d7c3ea",wall:"#ddc6e8",type:"bedroom"},
 {floor:["#f3e8d9","#f0e2cc"],rug:"#d6bd99",wall:"#ddbd97",type:"library"},
 {floor:["#e9f1d9","#dfedcf"],rug:"#bfd9a9",wall:"#c7dfb1",type:"plants"},
 {floor:["#dfe6f4","#e7eaf7"],rug:"#aebde0",wall:"#aebfe3",type:"night"},
 {floor:["#fff0e4","#fce0d8"],rug:"#edbdca",wall:"#d9adc7",type:"final"}
];
const ROOM_REWARDS={
 en:["The curtain is full of pawprints. A mystery.","The fish disappeared. The chef suspects everyone.","There is fur in every clean sock.","The human napped. You did not.","Several books have moved themselves. Suspicious.","The jungle has chosen its ruler: you.","The midnight snack society has a new leader.","An innocent cat. Eight extraordinarily messy rooms."],
 zh:["窗帘上多了几个爪印，凶手仍然成谜。","小鱼凭空消失，厨师怀疑所有人。","每只干净袜子里都藏着猫毛。","主人在午睡，你可没闲着。","有几本书自己换了位置，好神秘。","绿植王国正式由小猫统治。","午夜零食俱乐部迎来了新会长。","一只无辜小猫，八间被搞乱的房间。"]
};
const DARES=[
 {kind:"vase",en:"Knock over a vase",zh:"打翻一个花瓶"},
 {kind:"allfish",en:"Steal all four fish",zh:"偷走全部四条小鱼"},
 {kind:"relic",en:"Find the secret keepsake",zh:"找到隐藏的纪念品"},
 {kind:"yarn",en:"Distract the human with yarn",zh:"用毛线球引开主人"},
 {kind:"ghost",en:"Escape without being spotted",zh:"全程不被主人发现"},
 {kind:"vase",en:"Knock over a vase",zh:"打翻一个花瓶"},
 {kind:"allfish",en:"Steal all four fish",zh:"偷走全部四条小鱼"},
 {kind:"relic",en:"Find the secret keepsake",zh:"找到隐藏的纪念品"}];
const TX={
en:{startHint:"Tap a tile to walk",back:"← Morrow Wish",eyebrow:"A LITTLE CAT. A LOT OF TROUBLE.",subtitle:"Steal the snacks. Outsmart the human. Leave a little chaos.",missionLabel:"TODAY'S MISSION",snackLabel:"FISH ACQUIRED",scoreLabel:"SCORE",moveLabel:"STEPS",starLabel:"STARS",roomLabel:"CHOOSE A ROOM",closetLabel:"YOUR LITTLE TROUBLEMAKER",skinHint:"Earn 1–3 stars per room to unlock new cats.",retry:"↻ Retry",soundOn:"🔊 Sound effects: On",soundOff:"🔇 Sound effects: Off",rulesKicker:"HOW TO PLAY · 30 SECOND GUIDE",howTitle:"Three steps to a purrfect escape",howBody:"Every cat step moves the human. Stay out of pink sight zones; if spotted, hide behind a box or throw yarn to distract the guard.",ruleStep1Title:"1 · Tap to move",ruleStep1Text:"Tap the floor or use arrow keys.",ruleStep2Title:"2 · Steal three fish",ruleStep2Text:"Pink means visible. Hide before the alert fills! Boxes conceal you.",ruleStep3Title:"3 · Escape through the pink flap",ruleStep3Text:"Reach the cat door with three fish to win.",ruleBonus:"🧶 Tap Toss yarn (or Space), then tap an open floor tile to choose where the yarn lands. Tap the button again to cancel.",tip:"<span><strong>①</strong> Tap floor to walk</span><span><strong>②</strong> Collect 3 fish</span><span><strong>③</strong> Reach pink cat flap</span>",mission:"Collect three fish and slip through the pink cat flap. Topple a vase to distract the human.",daily:"☼ Daily",room:"ROOM",dailyRoom:"DAILY CHAOS",closed:"Grab three fish first!",blocked:"Something is blocking the way!",caught:"Caught! Try a different hiding spot.",closeCall:"Narrow escape! +40",bonusDone:"Bonus dare cleared! Escape for +150.",spotted:"SPOTTED! Break line of sight!",last:"Last life! Be sneaky.",fish:"Fish acquired! Delicious.",ready:"The cat flap is open. Run for it!",vase:"CRASH! The human heard that.",box:"A cardboard box! The perfect hiding place.",hide:"The human can't see inside the box.",winTitle:"Purrfect escape!",win:"Fish stolen, chaos delivered. The human is absolutely baffled.",loseTitle:"Caught red-pawed!",lose:"A small setback for a very ambitious cat. Try a different route.",tryAgain:"Try again",nextRoom:"Next room →",again:"Play again →",share:"Share your chaos ♡",shared:"Challenge link copied!",shareText:"I escaped in Pawsibly Innocent! Can you steal three fish without getting caught?",locked:"Earn {n} stars to unlock",dailyName:"Daily House Remix",dailySub:"A familiar house with a fresh secret snack stash.",skinNames:["Marmalade","Mochi","Shadow","Peaches","Blueberry"]},
zh:{startHint:"点地板，小猫就会走",back:"← Morrow Wish 首页",eyebrow:"一只小猫，搞出天大的动静。",subtitle:"偷零食、躲主人，顺便把家里闹个天翻地覆。",missionLabel:"本关任务",snackLabel:"偷到的小鱼",scoreLabel:"得分",moveLabel:"步数",starLabel:"星星",roomLabel:"选择房间",closetLabel:"你的捣蛋小猫",skinHint:"每关可得 1–3 星，累计星星解锁新猫。",retry:"↻ 重玩",soundOn:"🔊 音效：开",soundOff:"🔇 音效：关",rulesKicker:"游戏规则 · 30 秒看懂",howTitle:"三步学会猫猫大捣蛋",howBody:"小猫走一步，主人也走一步。粉色代表主人视野，持续暴露会被抓。躲进纸箱或扔毛球引开主人！",ruleStep1Title:"① 点击地板移动",ruleStep1Text:"点地板或按方向键，让小猫走过去。",ruleStep2Title:"② 偷到三条小鱼",ruleStep2Text:"粉色是主人视野！连续暴露会被抓，赶快躲进纸箱。",ruleStep3Title:"③ 从粉色猫门逃走",ruleStep3Text:"带着三条小鱼走到猫门，就成功过关。",ruleBonus:"🧶 点击「扔毛球」（电脑可按空格），再点地图上的地板选择落点。再次点击按钮可取消。",tip:"<span><strong>①</strong> 点击地板移动</span><span><strong>②</strong> 收集 3 条小鱼</span><span><strong>③</strong> 走进粉色猫门</span>",mission:"偷到三条鱼，再从粉色猫门溜走。经过花瓶就能把它打翻，引开主人。",daily:"☼ 每日挑战",room:"房间",dailyRoom:"每日捣蛋",closed:"先偷够三条鱼！",blocked:"有东西挡住路啦！",caught:"糟糕，被主人抓到了！",closeCall:"差点被抓！+40 分",bonusDone:"额外挑战完成！逃脱后加 150 分。",spotted:"被发现啦！快躲进纸箱！",last:"只剩一颗心了，轻手轻脚！",fish:"小鱼到手！好吃！",ready:"猫门打开了！快溜！",vase:"哐当！主人听见了。",box:"纸箱！躲猫猫的好地方。",hide:"主人看不见纸箱里的猫。",winTitle:"完美开溜！",win:"小鱼到手，家里一团乱，主人还没回过神。",loseTitle:"当场抓包！",lose:"捣蛋事业暂时受挫。换条路线再试一次！",tryAgain:"再试一次",nextRoom:"下一间 →",again:"再玩一局 →",share:"分享战绩 ♡",shared:"挑战链接已复制！",shareText:"我在《猫猫绝对无辜！》成功偷鱼逃脱！来看看你能不能骗过主人。",locked:"累计 {n} 星解锁",dailyName:"每日猫猫大捣蛋",dailySub:"熟悉的房间，小鱼藏在了新地方。",skinNames:["橘子糖","糯米","小黑","蜜桃","蓝莓"]}
};
const fur=[["#f5b46d","#ce8952","#fff1cc",0],["#f5eeec","#c5a8a6","#fff",3],["#575065","#373347","#b5a9c4",7],["#f1a8ab","#c77590","#ffdfdb",12],["#a8b4df","#7b8ab7","#e5e7fe",18]];
const entryParams=new URLSearchParams(location.search),entryRoomRaw=Number(entryParams.get("room")),entryRoom=entryParams.has("room")&&Number.isInteger(entryRoomRaw)&&entryRoomRaw>=1&&entryRoomRaw<=8?entryRoomRaw-1:0,entryDaily=entryParams.get("daily")==="1",challengeGoal=Math.max(0,Math.min(9999999,Number(entryParams.get("beat"))||0));
const c=$("board"),ctx=c.getContext("2d"),today=new Date().toISOString().slice(0,10),dpr=Math.min(2,window.devicePixelRatio||1);
c.width=840*dpr;c.height=588*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
function fitCanvasPixels(){
 const rect=c.getBoundingClientRect();
 const cssWidth=Number(rect?.width)||840;
 const scale=Math.max(1,Math.min(2.5,cssWidth/840*(window.devicePixelRatio||1)));
 const w=Math.round(840*scale),h=Math.round(588*scale);
 if(c.width!==w||c.height!==h){c.width=w;c.height=h}
 ctx.setTransform(scale,0,0,scale,0,0);
}
let lang=window.MorrowwishI18n?.get?.()==="zh"?"zh":"en";
let save={unlocked:0,best:{},cat:0,souvenirs:{}};try{const s=JSON.parse(localStorage.getItem("pawsibly-innocent-save-v1")||"{}");if(s&&typeof s==="object"){save={...save,...s};save.best=s.best||{};save.souvenirs=s.souvenirs||{};}}catch{}
save.unlocked=Math.min(7,Math.max(0,Number(save.unlocked)||0));save.cat=Math.max(0,Math.min(4,Number(save.cat)||0));
const YARN_LEGEND={
en:{ready:"🧶 Tap Toss yarn (or Space), then tap a floor tile to aim. The human walks toward the sound.",empty:"🧶 Walk onto a pink yarn ball to pick it up, then use the purple button above the board.",legend:["🐟 Fish = collect 3","🧶 Yarn = lure human","📦 Box = hide","🤖 Vacuum = blocked","🚪 Pink flap = escape"],tool:"🧶 Toss yarn (Space)",need:"🧶 Find yarn first",vision:"Pink = visible · Red = near the human · Avoid the labeled robot vacuum",quickReady:"1. Tap Toss yarn.  2. Tap an open floor tile to throw there.",quickAim:"Tap the destination tile. The human follows the sound.",quickChase:"The human moved toward the yarn. Each of your steps moves the human one tile.",cancel:"✕ Cancel throw",aim:"🧶 Tap an open floor tile to choose the yarn landing spot (or cancel).",badTarget:"Choose an open tile the human can reach.",quickEmpty:"Pick up the pink yarn ball on the floor to enable this button."},
zh:{ready:"🧶 点击「扔毛球」（电脑可按空格），再点地板决定落点，主人会循声走过去。",empty:"🧶 先让小猫走到地板上的粉色毛线球，捡到后再点击上方的紫色按钮。",legend:["🐟 小鱼＝收集三条","🧶 毛线＝引开主人","📦 纸箱＝躲藏","🤖 扫地机＝绕开","🚪 粉色猫门＝逃走"],tool:"🧶 扔毛球（空格键）",need:"🧶 先捡毛球",vision:"粉色＝主人视野 · 红色＝距离很近 · 标有「扫地机」的格子不能进入",quickReady:"① 点击「扔毛球」 ② 点地板选择落点，引开主人。",quickAim:"点击想让毛球落下的空地板，主人会循声走过去。",quickChase:"主人已经朝毛球移动！你每走一步，主人也走一步，趁机绕开它。",cancel:"✕ 取消投掷",aim:"🧶 点击地图上的空地板选择毛球落点（或取消）。",badTarget:"请选择主人能走到的空地板。",quickEmpty:"先走到地板上的粉色毛线球，捡起来才能扔。"}
};
const tr=k=>TX[lang][k]||k;
const EXTRA_WORDS={en:{yarn:"Yarn acquired — lure the human!",souvenir:"A secret keepsake! Finish the room to keep it.",milk:"A little milk. One heart restored!",light:"Lights off! Sneak through the shadows.",robot:"Robot vacuum ahead! Go around it — no heart lost.",noYarn:"Find a yarn ball first.",creak:"CREAK! The owner heard that floorboard.",wake:"The owner woke up! Stay sneaky.",finalAlert:"The owner is onto you! Escape!",routeWarning:"Careful! The owner is nearby. Pick your next step.",lured:"The human heard your yarn! Sneak away.",tool:"◉ Toss yarn",toolEmpty:"◉ Find yarn",bonus:"Secret keepsake",found:"Found",missing:"Not found",album:"Keepsakes",ability:["Starts with a yarn ball","Quieter paws: shorter sight range","Shadow stealth: extra cover in dim light","Vase master: longer distractions","Snack hunter: extra fish points"],finished:"Keepsake saved to your album!",vacuum:"The roaming vacuum is watching!",tip:"Pick up yarn and toss it to distract the human."},zh:{yarn:"拿到毛线球！可以引开主人了。",souvenir:"发现秘密纪念品！通关后就能收藏。",milk:"喝点牛奶，恢复一颗心！",light:"灯关了！趁着昏暗偷偷溜走。",robot:"前面是扫地机器人！请绕路，不会扣生命。",noYarn:"先找到毛线球！",creak:"嘎吱！主人听到了地板的声音！",wake:"主人醒了！快躲起来。",finalAlert:"主人起疑了！快逃走！",routeWarning:"主人就在附近！下一步要小心。",lured:"主人被毛线球吸引了，快溜！",tool:"◉ 扔毛线球",toolEmpty:"◉ 寻找毛线球",bonus:"秘密纪念品",found:"已找到",missing:"未找到",album:"猫咪收藏",ability:["开局自带一个毛线球","脚步轻：主人视野更短","暗影潜行：关灯后更难被发现","花瓶专家：引开主人更久","零食猎手：偷鱼分数更多"],finished:"纪念品已经收入猫咪收藏！",vacuum:"扫地机器人正在巡逻！",tip:"捡起毛线球，投出去引开主人。"}};
const et=k=>EXTRA_WORDS[lang][k]||k;
const equal=(a,b)=>!!a&&!!b&&a.x===b.x&&a.y===b.y;
const key=p=>p.x+","+p.y;
const rnd=seed=>()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^(seed>>>15),1|seed);t=t+Math.imul(t^(t>>>7),61|t)^t;return ((t^(t>>>14))>>>0)/4294967296;};
const allStars=()=>Object.values(save.best).reduce((sum,v)=>sum+Math.min(3,Math.max(0,Number(v.stars)||0)),0);
function saveGame(){try{localStorage.setItem("pawsibly-innocent-save-v1",JSON.stringify(save))}catch{}}
function metric(name,p={}){window.arcadeMetric?.(name,p)}
let stage=0,daily=false,s=null,route=[],movingTimer=null,msgTimer=null,fx=[],entered=false,aimingYarn=false,yarnPreview=null,yarnTargets=new Set(),yarnChaseTimer=null;
const seedDay=Number(today.replaceAll("-",""));
function randomRoom(){return Math.floor(rnd(seedDay)()*ROOMS.length)}
function popup(k){const el=$("toast");el.textContent=TX[lang][k]||EXTRA_WORDS[lang][k]||k;el.classList.add("on");clearTimeout(msgTimer);msgTimer=setTimeout(()=>el.classList.remove("on"),1450);}
function audio(type){window.MorrowwishAudio?.effect(type)}
function stopYarnChase(){if(yarnChaseTimer!==null){clearInterval(yarnChaseTimer);yarnChaseTimer=null}}
function readRoom(){const index=daily?randomRoom():stage,room=ROOMS[index],extras=EXTRAS[index],grid=room.rows.map(r=>r.split("")),fish=[],vases=[],boxes=[];let cat=null,human=null,door=null;
for(let y=0;y<H;y++)for(let x=0;x<W;x++){const t=grid[y][x];if(t==="C"){cat={x,y};grid[y][x]="."}if(t==="H"){human={x,y};grid[y][x]="."}if(t==="F"){fish.push({x,y});grid[y][x]="."}if(t==="V"){vases.push({x,y});grid[y][x]="."}if(t==="B"){boxes.push({x,y});grid[y][x]="."}if(t==="E")door={x,y}}
if(daily){const r=rnd(seedDay*13+91),possible=[],visited=new Set([key(cat)]),queue=[cat];for(let i=0;i<queue.length;i++){for(const p of neighbors(queue[i])){if(visited.has(key(p))||grid[p.y][p.x]==="#"||grid[p.y][p.x]==="S"||grid[p.y][p.x]==="E")continue;visited.add(key(p));queue.push(p)}}
for(const p of queue)if(Math.abs(p.x-cat.x)+Math.abs(p.y-cat.y)>=3&&!equal(p,human)&&!vases.some(v=>equal(v,p))&&!boxes.some(b=>equal(b,p))&&!Object.values(extras).some(v=>Array.isArray(v)&&v[0]===p.x&&v[1]===p.y))possible.push(p);
if(possible.length>=4){fish.length=0;while(fish.length<4){fish.push(possible.splice(Math.floor(r()*possible.length),1)[0]);}}}
return{room,index,extras,scene:SCENES[index],yarnBall:P(extras.yarn),relic:P(extras.relic),light:P(extras.light),milk:P(extras.milk),vacuum:P(extras.robot),vacuumDir:1,itemsTaken:new Set(),yarn:save.cat===0?1:0,lightTurns:index===6?8:0,hasRelic:false,room,grid,cat:{...cat},start:{...cat},human:{...human},humanStart:{...human},door,fish,vases,boxes,got:0,taken:new Set(),broken:new Set(),lives:3,steps:0,score:0,patrol:0,noise:null,throwTrail:null,alert:0,lastSeen:null,sleepTurns:index===3?9:0,creak:P(CREAKY_TILES[index]),creakTriggered:false,finalAlert:false,started:false,done:false,winning:false,invincible:0,exposure:0,everSpotted:false,dangerActive:false,nearMisses:0,yarnThrows:0,dareAnnounced:false,startedAt:0,catFrom:{...cat},humanFrom:{...human},movedAt:0,humanMovedAt:0};}
function init(index=0,isDaily=false){clearTimeout(msgTimer);stopYarnChase();if(movingTimer){clearInterval(movingTimer);movingTimer=null}route=[];fx=[];aimingYarn=false;yarnPreview=null;yarnTargets.clear();daily=isDaily;stage=index;s=readRoom();$("stage").classList.remove("yarn-aiming");if($("yarnAimBanner"))$("yarnAimBanner").hidden=true;$("overlay").hidden=true;$("toast").classList.remove("on");translateUI();syncUI();}
function translateUI(){
$("gameTitle").innerHTML=lang==="zh"?"猫猫绝对无辜！":"PAWSIBLY<br><span>INNOCENT!</span>";
$("studioByline").textContent=lang==="zh"?"出品 ♡":"presents ♡";
document.title=lang==="zh"?"猫猫绝对无辜！— Morrow Wish":"Pawsibly Innocent! — A Little Cat, A Lot of Trouble | Morrow Wish";
const ids={back:"back",eyebrow:"eyebrow",subtitle:"subtitle",missionLabel:"missionLabel",snackLabel:"snackLabel",scoreLabel:"scoreLabel",moveLabel:"moveLabel",starLabel:"starLabel",roomLabel:"roomLabel",closetLabel:"closetLabel",skinHint:"skinHint",restart:"retry",rulesKicker:"rulesKicker",howTitle:"howTitle",ruleStep1Title:"ruleStep1Title",ruleStep1Text:"ruleStep1Text",ruleStep2Title:"ruleStep2Title",ruleStep2Text:"ruleStep2Text",ruleStep3Title:"ruleStep3Title",ruleStep3Text:"ruleStep3Text",ruleBonus:"ruleBonus",mission:"mission"};for(const [id,k]of Object.entries(ids))$(id).textContent=tr(k);
$("howBody").textContent=tr("howBody");if($("visionTip"))$("visionTip").textContent=YARN_LEGEND[lang].vision;if($("yarnAimBanner"))$("yarnAimBanner").textContent=YARN_LEGEND[lang].aim;c.setAttribute("aria-label",lang==="zh"?"猫猫捣蛋游戏。点击地板移动，收集三条鱼，再从粉色猫门逃走。":"Cat stealth adventure. Tap a floor tile to move. Collect three fish and reach the pink cat flap.");if($("tool")){$("tool").classList.toggle("aiming",aimingYarn);$("tool").textContent=aimingYarn?YARN_LEGEND[lang].cancel:s.yarn>0?YARN_LEGEND[lang].tool+" · "+s.yarn:YARN_LEGEND[lang].need;$("tool").disabled=s.yarn===0}if($("yarnExplain"))$("yarnExplain").textContent=YARN_LEGEND[lang][s.yarn>0?"ready":"empty"];if($("yarnQuickHint"))$("yarnQuickHint").textContent=YARN_LEGEND[lang][aimingYarn?"quickAim":s.noise&&yarnChaseTimer!==null?"quickChase":s.yarn>0?"quickReady":"quickEmpty"];if($("catLegend"))$("catLegend").querySelectorAll("span").forEach((v,i)=>v.textContent=YARN_LEGEND[lang].legend[i]);if($("collectionLabel"))$("collectionLabel").textContent=et("album");if($("collectionHint"))$("collectionHint").textContent=lang==="zh"?"每个房间都藏着一件纪念品，成功逃脱才能收藏。":"Each room hides a souvenir. Escape to add it to your album.";if($("collection"))$("collection").textContent=Object.keys(save.souvenirs).filter(k=>save.souvenirs[k]).length+" / 8";if($("ability"))$("ability").textContent=et("ability")[save.cat];const total=allStars(),nextCat=fur.findIndex((f,i)=>i>0&&total<f[3]);if($("skinHint"))$("skinHint").textContent=nextCat<0?(lang==="zh"?"全部 5 只小猫已解锁！":"All 5 cats unlocked!"):(lang==="zh"?"累计 "+total+" 星 · 再得 "+(fur[nextCat][3]-total)+" 星解锁「"+TX.zh.skinNames[nextCat]+"」":total+" stars · "+(fur[nextCat][3]-total)+" more to unlock "+TX.en.skinNames[nextCat]);if($("tool"))$("tool").setAttribute("aria-label",aimingYarn?YARN_LEGEND[lang].cancel:YARN_LEGEND[lang].tool);$("sound").textContent=tr(window.MorrowwishAudio?.isEnabled?.()?"soundOn":"soundOff");
$("roomNum").textContent=daily?tr("dailyRoom"):tr("room")+" "+String(stage+1).padStart(2,"0")+" / 08";
$("roomTag").textContent=daily?tr("dailyName"):s.room[lang==="zh"?"zh":"en"];
$("chapter").textContent=daily?tr("dailyName"):s.room[lang==="zh"?"zh":"en"];
$("chapterSub").textContent=daily?tr("dailySub"):s.room[lang==="zh"?"zhSub":"enSub"];
const lv=$("levels");lv.innerHTML="";ROOMS.forEach((r,i)=>{const b=document.createElement("button");b.className="level-btn";b.disabled=i>save.unlocked;b.textContent=i+1;b.title=r[lang==="zh"?"zh":"en"];b.setAttribute("aria-current",String(!daily&&stage===i));b.onclick=()=>init(i,false);lv.appendChild(b)});
const dailyB=document.createElement("button");dailyB.className="level-btn daily";dailyB.textContent=tr("daily");dailyB.setAttribute("aria-current",String(daily));dailyB.onclick=()=>init(0,true);lv.appendChild(dailyB);
const shelf=$("souvenirShelf");if(shelf){shelf.innerHTML="";const glyphs=["☀","✿","♡","☾","✦","❀","★","♛"];glyphs.forEach((glyph,i)=>{const b=document.createElement("button");b.className="souvenir-stamp"+(save.souvenirs[i]?" found":"");b.disabled=i>save.unlocked;b.textContent=save.souvenirs[i]?glyph:"·";b.type="button";b.title=ROOMS[i][lang==="zh"?"zh":"en"]+" · "+(save.souvenirs[i]?et("found"):et("missing"));b.onclick=()=>init(i,false);shelf.appendChild(b)})}
const wd=$("wardrobe");wd.innerHTML="";fur.forEach((f,i)=>{const b=document.createElement("button");b.className="skin"+(save.cat===i?" active":"");b.disabled=allStars()<f[3];b.style.background="#fff5f1";b.style.setProperty("--cat-fur",f[0]);b.style.setProperty("--cat-detail",f[1]);b.innerHTML='<span class="cat-portrait"><b>•ᴗ•</b></span>';b.title=TX[lang].skinNames[i]+(b.disabled?" · "+tr("locked").replace("{n}",f[3]):"");b.setAttribute("aria-label",b.title);b.onclick=()=>{save.cat=i;saveGame();s.yarn=i===0?Math.max(1,s.yarn):s.yarn;translateUI();syncUI();audio("fish")};if(b.disabled){const span=document.createElement("span");span.className="lock";span.textContent="🔒";b.appendChild(span)}wd.appendChild(b)});
}
function dareDone(){
 if(!s)return false;
 switch(DARES[s.index].kind){
 case "vase":return s.broken.size>0;
 case "allfish":return s.got===s.fish.length;
 case "relic":return s.hasRelic;
 case "yarn":return s.yarnThrows>0;
 case "ghost":return s.winning&&!s.everSpotted;
 default:return false;
 }
}
function updateDare(){
 if(!s)return;const done=dareDone(),el=$("bonusDare");
 if(el){el.textContent=(done?"✓ ":"☆ ")+(lang==="zh"?"额外挑战 · ":"BONUS DARE · ")+DARES[s.index][lang];el.classList.toggle("complete",done);}
 if(done&&!s.dareAnnounced){s.dareAnnounced=true;metric("cat_dare_completed",{level:s.index+1,kind:DARES[s.index].kind});if(!s.done){throwStars(s.cat,"#ffd78a");audio("fish")}}
}
function resultLine(){
 const bonus=s.winning?(dareDone()?(lang==="zh"?" · 额外挑战 ✓ +150":" · BONUS ✓ +150"):(lang==="zh"?" · 额外挑战未完成":" · Bonus missed")):"";
 const target=challengeGoal&&((daily&&entryDaily)||(!daily&&stage===entryRoom))?(lang==="zh"?" · 好友目标 "+challengeGoal+(s.score>challengeGoal?" ✓":""):" · Beat "+challengeGoal+(s.score>challengeGoal?" ✓":"")):"";
 return (lang==="zh"?"得分 ":"Score ")+s.score+" · "+(lang==="zh"?"步数 ":"Steps ")+s.steps+(s.hasRelic?" · "+et("bonus")+" ✓":"")+bonus+target;
}
function contextualHint(){
 if(!s)return "";
 if(s.index===0&&!daily){
  if(s.got===0)return lang==="zh"?"先点旁边的小鱼，马上开始！":"Tap the fish beside your cat to begin!";
  if(s.got===1)return lang==="zh"?"粉色是主人视野；打翻花瓶能引开他。":"Pink tiles are in sight. A vase can distract the owner.";
  if(s.got<NEED)return lang==="zh"?"继续偷鱼，避开粉色格子。":"Keep stealing fish. Avoid the pink sight tiles.";
  return lang==="zh"?"三条鱼到手！走进绿色猫门逃走。":"Three fish! Reach the GREEN cat flap to escape.";
 }
 if(s.sleepTurns>0)return lang==="zh"?"主人睡着了，轻声行动，别碰响声！":"The owner is sleeping. Stay quiet!";
 if(s.creak&&!s.creakTriggered)return lang==="zh"?"橙色闪光地板会发出声响，请绕开。":"The amber tile CREAKS. Find a quiet route.";
 if(s.finalAlert)return lang==="zh"?"主人发现异样了，快去猫门！":"The owner is suspicious. Make your escape!";
 return YARN_LEGEND[lang].vision;
}
function syncUI(){if($("visionTip"))$("visionTip").textContent=contextualHint();updateDare();updateStealthHUD();$("fishCount").textContent=s.got+" / "+NEED;$("meterFill").style.width=100*s.got/NEED+"%";if($("tool")){$("tool").classList.toggle("aiming",aimingYarn);$("tool").textContent=aimingYarn?YARN_LEGEND[lang].cancel:s.yarn>0?YARN_LEGEND[lang].tool+" · "+s.yarn:YARN_LEGEND[lang].need;$("tool").disabled=s.yarn===0}if($("yarnExplain"))$("yarnExplain").textContent=YARN_LEGEND[lang][s.yarn>0?"ready":"empty"];if($("yarnQuickHint"))$("yarnQuickHint").textContent=YARN_LEGEND[lang][aimingYarn?"quickAim":s.noise&&yarnChaseTimer!==null?"quickChase":s.yarn>0?"quickReady":"quickEmpty"];if($("collection"))$("collection").textContent=Object.keys(save.souvenirs).filter(k=>save.souvenirs[k]).length+" / 8";$("score").textContent=s.score;$("moves").textContent=s.steps;$("starTotal").textContent=allStars();$("hearts").setAttribute("aria-label",lang==="zh"?"剩余 "+s.lives+" 颗心":s.lives+" hearts left");$("hearts").innerHTML=Array.from({length:3},(_,i)=>'<span class="'+(i>=s.lives?"empty":"")+'">♥</span>').join("");if($("heistStatus"))$("heistStatus").textContent="🐟 "+s.got+"/"+NEED+" · "+"♥".repeat(s.lives)+"♡".repeat(3-s.lives);}
function neighbors(p){return[[1,0],[0,1],[-1,0],[0,-1]].map(([dx,dy])=>({x:p.x+dx,y:p.y+dy})).filter(q=>q.x>=0&&q.x<W&&q.y>=0&&q.y<H);}
function pass(p,human=false){if(!p||p.x<0||p.y<0||p.x>=W||p.y>=H)return false;const t=s.grid[p.y][p.x];if(t==="#"||t==="S")return false;if(human&&(t==="E"||s.boxes.some(b=>equal(b,p))))return false;if(!human&&((s.vacuum&&equal(p,s.vacuum))||equal(p,s.human)))return false;return true}
function pathTo(from,to,human=false){if(equal(from,to))return[];const q=[from],seen=new Set([key(from)]),prev=new Map();for(let i=0;i<q.length;i++){const p=q[i];if(equal(p,to)){const result=[];let t=key(p);while(t!==key(from)){const next=prev.get(t);result.unshift({x:Number(t.split(",")[0]),y:Number(t.split(",")[1])});t=next}return result}for(const n of neighbors(p)){if(!pass(n,human)||seen.has(key(n)))continue;seen.add(key(n));prev.set(key(n),key(p));q.push(n)}}return[]}
// Click-to-move favors hiding and quiet routes. Manual arrows can still choose risky shortcuts.
// A simple costed search is enough for the 10x7 grid and runs only when a target is tapped.
function catPathTo(from,to){
 const frontier=[{p:from,cost:0}],dist=new Map([[key(from),0]]),prev=new Map();
 const risk=p=>{
  let cost=1;if(visible(p))cost+=9;
  const gap=Math.abs(p.x-s.human.x)+Math.abs(p.y-s.human.y);
  if(gap<=2)cost+=5;
  if(s.creak&&!s.creakTriggered&&equal(p,s.creak))cost+=6;
  if(s.vacuum&&Math.abs(p.x-s.vacuum.x)+Math.abs(p.y-s.vacuum.y)<=1)cost+=4;
  return cost;
 };
 while(frontier.length){
  frontier.sort((a,b)=>a.cost-b.cost);
  const {p,cost}=frontier.shift(),k=key(p);
  if(cost!==dist.get(k))continue;
  if(equal(p,to)){const found=[];let curr=k;
   while(curr!==key(from)){const [x,y]=curr.split(",").map(Number);found.unshift({x,y});curr=prev.get(curr)}
   return found;
  }
  for(const next of neighbors(p)){
   if(!pass(next))continue;
   const nk=key(next),nc=cost+risk(next);
   if(nc<(dist.get(nk)??Infinity)){dist.set(nk,nc);prev.set(nk,k);frontier.push({p:next,cost:nc})}
  }
 }
 return[];
}

const hidden=p=>s.boxes.some(b=>equal(b,p));
function visible(p=s.cat){if(s.sleepTurns>0||hidden(p))return false;let a=s.human,b=p,d=Math.abs(a.x-b.x)+Math.abs(a.y-b.y);const sight=Math.max(1,3-(save.cat===1?1:0)-(s.lightTurns>0?(save.cat===2?2:1):0));if(d>sight)return false;if(d<=1)return true;if(a.x===b.x){for(let y=Math.min(a.y,b.y)+1;y<Math.max(a.y,b.y);y++)if(s.grid[y][a.x]==="#"||s.grid[y][a.x]==="S")return false;return true}if(a.y===b.y){for(let x=Math.min(a.x,b.x)+1;x<Math.max(a.x,b.x);x++)if(s.grid[a.y][x]==="#"||s.grid[a.y][x]==="S")return false;return true}return d<=2}
function throwStars(p,color){for(let i=0;i<9;i++)fx.push({x:(p.x+.5)*T,y:(p.y+.5)*T,dx:(Math.random()-.5)*4,dy:-Math.random()*3-1,life:30,col:color});}
function hurt(){if(s.invincible>0)return;stopYarnChase();s.lives--;s.score=Math.max(0,s.score-30);route=[];if(movingTimer){clearInterval(movingTimer);movingTimer=null;}audio("bad");popup("caught");throwStars(s.cat,"#fb7893");s.invincible=2;s.exposure=0;metric("cat_caught",{level:daily?9:stage+1,score:s.score});if(s.lives<=0){finish(false);return;}s.cat={...s.start};s.human={...s.humanStart};s.noise=null;s.alert=0;s.lastSeen=null;s.dangerActive=false;s.patrol=0;}
function yarnTarget(p){return !!s&&yarnTargets.has(key(p))}
function setYarnAim(on){
 aimingYarn=!!on;yarnPreview=null;yarnTargets.clear();
 if(aimingYarn)for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const p={x,y};if(pass(p,true)&&!equal(p,s.human)&&!equal(p,s.cat)&&pathTo(s.human,p,true).length>0)yarnTargets.add(key(p));
 }
 $("stage").classList.toggle("yarn-aiming",aimingYarn);
 if($("yarnAimBanner"))$("yarnAimBanner").hidden=!aimingYarn;
 syncUI();
}
function throwYarn(){
 if(!s||s.done)return;
 if(aimingYarn){setYarnAim(false);return}
 if(s.yarn<=0){popup("noYarn");return}
 route=[];if(movingTimer){clearInterval(movingTimer);movingTimer=null}
 setYarnAim(true);
}
function throwYarnTo(p){
 if(!aimingYarn||!s||s.done)return false;
 if(!yarnTarget(p)){popup(YARN_LEGEND[lang].badTarget);return false}
 s.noise={...p};s.yarnThrows++;s.throwTrail={from:{...s.cat},to:{...p},at:performance.now()};
 s.alert=Math.max(7,pathTo(s.human,p,true).length+3);s.lastSeen=null;s.yarn--;s.steps++;
 setYarnAim(false);
 throwStars(s.noise,"#db9fef");audio("yarn");startYarnChase();popup("lured");
 metric("cat_yarn_toss",{level:s.index+1,target_x:p.x,target_y:p.y});
 if(equal(s.cat,s.human))hurt();syncUI();return true;
}
// Yarn distractions cause immediate, visible autonomous movement: the player
// no longer has to take a cat turn to make the human react.
function advanceYarnChase(){
 if(!s||s.done||!s.noise){stopYarnChase();return}
 if(equal(s.human,s.noise)){s.noise=null;s.alert=0;stopYarnChase();syncUI();return}
 guardMove();
 if(equal(s.cat,s.human)||
   (s.invincible===0&&!hidden(s.cat)&&
    Math.abs(s.cat.x-s.human.x)+Math.abs(s.cat.y-s.human.y)===1&&visible()))hurt();
 if(!s||s.done){stopYarnChase();return}
 if(s.noise&&equal(s.human,s.noise)){s.noise=null;s.alert=0;stopYarnChase()}
 if(!s.noise)stopYarnChase();
 syncUI();
}
function startYarnChase(){
 // Immediate reaction, then exactly one human step per cat step. No real-time
 // chase timer: players get time to read the board and plan their escape.
 stopYarnChase();
 guardMove();
 syncUI();
}
function guardMove(){
 const h=s.human;let target=null;
 // A short sleeping-owner window adds a different stealth strategy in room 4.
 if(s.sleepTurns>0&&!s.noise){
  s.sleepTurns--;
  if(s.sleepTurns===0)popup("wake");
  return;
 }
 if(s.sleepTurns>0&&s.noise){s.sleepTurns=0;popup("wake")}
 if(s.noise){
  target=s.noise;
  if(equal(h,target)||s.alert<=0){s.noise=null;s.alert=0}
  else s.alert--;
 }
 if(!target&&visible()){
  s.lastSeen={...s.cat};
  // One full turn of visible warning before actively chasing the player.
  if(s.exposure>0||s.finalAlert){target={...s.cat};s.alert=3}
 }
 if(!target&&s.alert>0&&s.lastSeen){target=s.lastSeen;s.alert--;if(equal(h,target))s.lastSeen=null}
 if(!target){const stops=s.room.patrol;if(equal(h,{x:stops[s.patrol][0],y:stops[s.patrol][1]}))s.patrol=(s.patrol+1)%stops.length;target={x:stops[s.patrol][0],y:stops[s.patrol][1]}}
 const steps=pathTo(h,target,true);s.humanFrom={...h};
 if(steps.length){
  // The guard must not collide with a completely unaware cat on a first sighting.
  if(equal(steps[0],s.cat)&&s.exposure===0&&!s.finalAlert){s.alert=Math.max(2,s.alert);s.lastSeen={...s.cat};return}
  s.human={...steps[0]};s.humanMovedAt=performance.now();
 }
}
// Escalating alert: the first room teaches controls without instant vision penalties.
// Later levels make sight, shadows, boxes and yarn meaningful choices.
function detectionLimit(){return s.index===0&&!daily?4:s.index>=4?2:3}
function updateStealthHUD(){
 const alert=$("pawsAlert");if(alert&&s){alert.hidden=s.exposure<=0;alert.textContent=lang==="zh"?"警戒 "+s.exposure+" / "+detectionLimit():"SPOTTED "+s.exposure+" / "+detectionLimit();}
 const hud=document.querySelector?.("#cgStealthHUD");if(!hud||!s)return;
 const seen=s.exposure>0;
 hud.textContent=lang==="zh"?(seen?"被发现！快躲起来":"潜行中")+" · 小鱼 "+s.got+"/"+NEED
  :(seen?"SPOTTED — HIDE!":"SNEAK MODE")+" · FISH "+s.got+"/"+NEED;
 hud.classList.toggle("alert",seen);
 hud.setAttribute("aria-label",lang==="zh"?"警戒状态与小鱼数量":"Detection status and fish collected");
}
function resolveDetection(){
 if(s.done)return;
 if(hidden(s.cat)||!visible()){
  if(s.dangerActive){s.dangerActive=false;if(s.invincible===0&&s.nearMisses<2){s.nearMisses++;s.score+=40;throwStars(s.cat,"#8ddbbc");audio("yarn");popup("closeCall");metric("cat_close_call",{level:s.index+1,score:s.score});}}
  s.exposure=Math.max(0,s.exposure-1);return
 }
 s.dangerActive=true;s.everSpotted=true;
 const limit=detectionLimit(),before=s.exposure;
 s.exposure=Math.min(limit,s.exposure+1);
 if(s.exposure>=limit&&s.invincible===0){hurt();return}
 if(before===0&&limit<99)popup("spotted");
}
function moveTo(p){if(s.done||!pass(p)||Math.abs(p.x-s.cat.x)+Math.abs(p.y-s.cat.y)!==1)return;
if(!s.started){s.started=true;s.startedAt=performance.now();metric("game_start",{level:daily?9:stage+1})}
s.catFrom={...s.cat};s.cat={...p};s.movedAt=performance.now();s.steps++;s.invincible=Math.max(0,s.invincible-1);
const fishIndex=s.fish.findIndex(f=>equal(f,p)&&!s.taken.has(key(f)));if(fishIndex>=0){s.taken.add(key(p));s.got++;s.score+=save.cat===4?135:100;audio("fish");throwStars(p,"#ffd16e");popup(s.got>=NEED?"ready":"fish");metric("cat_fish",{level:daily?9:stage+1,score:s.score});}
if(s.creak&&!s.creakTriggered&&equal(s.creak,p)){
 s.creakTriggered=true;s.noise={...p};s.alert=5;s.lastSeen=null;
 audio("vase");throwStars(p,"#ffd89e");popup("creak");metric("cat_noisy_floor",{level:s.index+1});
}
const vase=s.vases.find(v=>equal(v,p));if(vase&&!s.broken.has(key(vase))){s.broken.add(key(vase));s.score+=35;s.noise={...p};s.alert=save.cat===3?11:6;s.lastSeen=null;audio("vase");throwStars(p,"#d4a8dc");popup("vase");metric("cat_vase",{level:daily?9:stage+1})}
if(s.yarnBall&&equal(p,s.yarnBall)&&!s.itemsTaken.has("yarn")){s.itemsTaken.add("yarn");s.yarn++;s.score+=25;popup("yarn");audio("yarn");metric("cat_yarn",{level:s.index+1})}
if(s.relic&&equal(p,s.relic)&&!s.itemsTaken.has("relic")){s.itemsTaken.add("relic");s.hasRelic=true;s.score+=90;popup("souvenir");audio("souvenir");throwStars(p,"#aeb0ee");metric("cat_souvenir",{level:s.index+1})}
if(s.milk&&equal(p,s.milk)&&!s.itemsTaken.has("milk")){s.itemsTaken.add("milk");s.lives=Math.min(3,s.lives+1);s.score+=25;popup("milk");audio("milk");throwStars(p,"#d6f5ef")}
if(s.light&&equal(p,s.light)&&!s.itemsTaken.has("light")){s.itemsTaken.add("light");s.lightTurns=8;s.score+=30;popup("light");audio("light");throwStars(p,"#fbd886")}
if(hidden(p))popup("hide");
if(equal(p,s.door)){if(s.got>=NEED){finish(true);return}else popup("closed")}
if(s.index===7&&s.got>=NEED&&!s.finalAlert){s.finalAlert=true;s.alert=4;s.lastSeen={...s.cat};audio("bad");popup("finalAlert");metric("cat_finale_chase",{level:8})}
guardMove();s.lightTurns=Math.max(0,s.lightTurns-1);
if(s.vacuum&&(s.index===2||s.index===7||s.steps%2===0)){const a={x:s.vacuum.x+s.vacuumDir,y:s.vacuum.y};if(!pass(a,true)||equal(a,s.door)||equal(a,s.cat)){s.vacuumDir*=-1}else{s.vacuum=a}}
if(equal(s.cat,s.human))hurt();
else resolveDetection();
if(!s.done&&s.vacuum&&equal(s.cat,s.vacuum)){popup("robot");s.vacuumDir*=-1;}
// Sustained time in guard vision triggers capture after the tutorial level.
// Boxes or breaking line-of-sight lower exposure; direct overlap always catches.
syncUI();}
function finish(win){if(s.done)return;stopYarnChase();s.done=true;s.winning=win;route=[];if(movingTimer){clearInterval(movingTimer);movingTimer=null;}
const bonus=win&&dareDone();
 const stars=win?(bonus&&s.lives===3?3:(bonus||s.lives===3?2:1)):0;
if(win){s.score+=Math.max(80,300-s.steps*3)+s.lives*50+(s.everSpotted?0:125)+(bonus?150:0);audio("win");if(!daily&&stage<=save.unlocked)save.unlocked=Math.max(save.unlocked,Math.min(7,stage+1));if(s.hasRelic){save.souvenirs[s.index]=true;s.score+=75;metric("cat_relic_saved",{level:s.index+1})}
const id=daily?"daily-"+today:"room-"+stage;const old=save.best[id]||{stars:0,score:0};save.best[id]={stars:Math.max(old.stars,stars),score:Math.max(old.score,s.score)};saveGame();metric("cat_level_won",{level:daily?9:stage+1,score:s.score});}
metric(win?"game_complete":"game_over",{level:daily?9:stage+1,score:s.score,stars,bonus:bonus?1:0,steps:s.steps,duration:s.startedAt?Math.round((performance.now()-s.startedAt)/1000):0});syncUI();translateUI();
$("medal").textContent=win?"😼":"😿";$("stars").textContent=win?"★".repeat(stars)+"☆".repeat(3-stars):"☆☆☆";$("resultTitle").textContent=tr(win?"winTitle":"loseTitle");$("resultDesc").textContent=win?(daily?tr("win"):ROOM_REWARDS[lang][s.index]):tr("lose");
$("resultScore").textContent=resultLine();
$("retryResult").textContent=tr("tryAgain");$("nextResult").textContent=tr(win?"nextRoom":"tryAgain");$("shareResult").textContent=tr("share");$("overlay").hidden=false;}
function command(x,y){if(!s||s.done)return;if(x===s.cat.x&&y===s.cat.y)return;if(s.vacuum&&equal({x,y},s.vacuum)){popup("robot");return;}if(!pass({x,y})){popup("blocked");return;}route=catPathTo(s.cat,{x,y});if(!route.length){popup("blocked");return}if(!movingTimer){movingTimer=setInterval(()=>{if(s.done||!route.length){clearInterval(movingTimer);movingTimer=null;return}const p=route.shift();if(!pass(p)){route=[];clearInterval(movingTimer);movingTimer=null;popup("blocked");return}
 // Risk-aware routing already avoids dangerous tiles; a tap must never deadlock movement.
 moveTo(p);if(s.done||!route.length){clearInterval(movingTimer);movingTimer=null}},180)}}
function single(dx,dy){if(!s||s.done)return;route=[];if(movingTimer){clearInterval(movingTimer);movingTimer=null}const p={x:s.cat.x+dx,y:s.cat.y+dy};if(s.vacuum&&equal(p,s.vacuum)){popup("robot");return}if(!pass(p)){popup("blocked");return}moveTo(p)}
function shape(x,y,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()}
function round(x,y,w,h,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill()}
function ellipse(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill()}
function stroke(x1,y1,x2,y2,color,width=2){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()}
function label(txt,x,y,font,color){ctx.fillStyle=color;ctx.font=font;ctx.textAlign="center";ctx.fillText(txt,x,y)}
function fishDraw(x,y,t){ctx.save();ctx.translate(x,y+Math.sin(t*.003+x)*3);ctx.rotate(-.2);ellipse(0,0,21,11,"#ffb965");ctx.fillStyle="#f8c77e";ctx.beginPath();ctx.moveTo(14,0);ctx.lineTo(35,-16);ctx.lineTo(33,16);ctx.closePath();ctx.fill();shape(-9,-3,2.5,"#664550");stroke(-2,0,4,0,"#fff0d2",2);ctx.restore()}
function vaseDraw(x,y,broken,t){if(broken){ellipse(x,y+17,21,6,"#dbb4c7");shape(x-11,y+10,6,"#df9bcb");shape(x+11,y+12,5,"#edbcd4");return}
ellipse(x,y+18,19,6,"#ca9bc0");ctx.fillStyle="#b987b9";ctx.beginPath();ctx.moveTo(x-14,y-15);ctx.lineTo(x+14,y-15);ctx.lineTo(x+20,y+11);ctx.quadraticCurveTo(x,y+26,x-20,y+11);ctx.closePath();ctx.fill();round(x-17,y-17,34,6,3,"#e4b5d5");stroke(x,y-14,x-4,y-34,"#7caa85",3);stroke(x,y-22,x+15,y-38,"#7caa85",3);ellipse(x-14,y-33,9,5,"#81b885");ellipse(x+17,y-40,10,5,"#81b885")}
function sofaDraw(x,y){round(x-39,y-27,78,59,17,"#bea7d9");round(x-30,y-19,60,43,12,"#dfcef0");round(x-39,y-27,16,53,9,"#ac93cc");round(x+23,y-27,16,53,9,"#ac93cc");stroke(x-25,y+18,x+25,y+18,"#b8a6d3",3)}
function boxDraw(x,y){ellipse(x,y+23,29,8,"#ceb4aa");round(x-26,y-19,52,42,4,"#daab71");round(x-22,y-24,44,10,2,"#edc48c");stroke(x-3,y-19,x-3,y+23,"#c28f59",2);label("⌣",x+12,y+11,"19px system-ui","#9b744e")}
function catDraw(x,y,t){const f=fur[save.cat],tail=Math.sin(t*.006)*5;ctx.save();ctx.translate(x,y);ellipse(0,23,29,8,"#846b7e37");ctx.strokeStyle=f[1];ctx.lineWidth=12;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(21,7);ctx.bezierCurveTo(41,6,41,-16,28,-22+tail);ctx.stroke();ctx.fillStyle=f[0];ctx.strokeStyle=f[1];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-28,-18);ctx.lineTo(-28,-44);ctx.quadraticCurveTo(-25,-49,-20,-43);ctx.lineTo(-8,-28);ctx.lineTo(8,-28);ctx.lineTo(22,-44);ctx.quadraticCurveTo(26,-47,28,-40);ctx.lineTo(28,-18);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle="#f7c4bb";ctx.beginPath();ctx.moveTo(-22,-29);ctx.lineTo(-22,-38);ctx.lineTo(-13,-30);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(16,-30);ctx.lineTo(23,-39);ctx.lineTo(23,-29);ctx.closePath();ctx.fill();ellipse(0,-4,33,31,f[0]);ellipse(0,15,17,8,f[2]);if(Math.floor(t/2800)%9===0){stroke(-15,-8,-5,-8,"#574759",3);stroke(8,-8,18,-8,"#574759",3)}else{ellipse(-13,-10,3.5,5.2,"#473c51");ellipse(13,-10,3.5,5.2,"#473c51");shape(-14,-12,1.3,"white");shape(12,-12,1.3,"white")}ellipse(-23,3,6,4,"#f49b9e");ellipse(23,3,6,4,"#f49b9e");ctx.fillStyle="#aa6973";ctx.beginPath();ctx.moveTo(-4,1);ctx.lineTo(4,1);ctx.lineTo(0,6);ctx.closePath();ctx.fill();stroke(0,6,-7,10,"#886270",1.5);stroke(0,6,7,10,"#886270",1.5);for(const side of[-1,1]){stroke(side*17,6,side*36,3,"#936f73",1.4);stroke(side*17,10,side*35,15,"#936f73",1.4)}
if(save.cat===0){for(const dx of[-8,0,8])stroke(dx,-27,dx-3,-21,f[1],3)}if(save.cat===1){shape(-25,-27,5,"#d3bfc4");shape(23,-28,5,"#d3bfc4")}
if(save.cat===2){ctx.fillStyle="#685a8b";ctx.beginPath();ctx.moveTo(-26,-40);ctx.lineTo(0,-62);ctx.lineTo(26,-40);ctx.fill();round(-30,-44,60,8,4,"#685a8b")}
if(save.cat===3){ellipse(0,-44,12,7,"#f6d2e3");shape(0,-46,5,"#e58ca4")}
if(save.cat===4){ellipse(0,-45,11,7,"#fff2ac");label("★",0,-43,"bold 13px system-ui","#ae8acc")}
ctx.restore()}
function humanDraw(x,y,t){ctx.save();ctx.translate(x,y);ellipse(0,28,24,8,"#a4798755");const leg=Math.sin(t*.008)*2;round(-18,5,14,20+leg,5,"#6d6488");round(5,5,14,20-leg,5,"#6d6488");ellipse(0,0,25,28,"#86b2a0");ellipse(0,-32,19,20,"#f7d5b4");ctx.fillStyle="#71536b";ctx.beginPath();ctx.arc(0,-38,20,Math.PI,Math.PI*2);ctx.lineTo(20,-30);ctx.lineTo(-20,-30);ctx.fill();ellipse(-6,-31,2.4,3,"#453b4c");ellipse(6,-31,2.4,3,"#453b4c");stroke(-4,-22,4,-22,"#ae7778",2);ctx.restore()}

function yarnDraw(x,y,time){const r=12+Math.sin(time*.007)*1.2;ellipse(x,y+13,20,6,"#b4879b44");shape(x,y,r,"#dc93ba");stroke(x-9,y-6,x+9,y+8,"#fff0f4",2);stroke(x+3,y-11,x-4,y+10,"#fff0f4",2);ctx.strokeStyle="#ba6b99";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x+11,y+5);ctx.bezierCurveTo(x+30,y+4,x+29,y+24,x+38,y+21);ctx.stroke()}
function relicDraw(x,y,time){ellipse(x,y+16,20,6,"#9673ae44");ctx.save();ctx.translate(x,y+Math.sin(time*.004+x)*3);ctx.rotate(-.18);round(-15,-14,30,29,8,"#eacde9");label("✿",0,8,"bold 26px system-ui","#b07bc3");ctx.restore()}
function lampDraw(x,y,on,time){round(x-18,y-24,36,51,8,on?"#8d90a0":"#f9d7a6");round(x-13,y-21,26,34,7,on?"#c9c7df":"#ffedb8");ellipse(x,y+30,25,7,"#ac8a9255");label(on?"☾":"☀",x,y+11,"bold 22px system-ui",on?"#81749d":"#edb778")}
function milkDraw(x,y){ellipse(x,y+16,25,9,"#9da2b955");ellipse(x,y+5,26,15,"#9db8cb");ellipse(x,y+2,22,10,"#fffaf2");label("♡",x,y+7,"bold 16px system-ui","#dd9dad")}
function vacuumDraw(x,y,time){
 // A clearly labeled robot vacuum, with a red caution rim rather than a bun-shaped prop.
 ellipse(x,y+20,31,9,"#584c6844");
 ellipse(x,y+1,34,28,"#e98087");ellipse(x,y,29,23,"#554d69");
 ellipse(x,y-2,23,17,"#d1e1ec");
 round(x-15,y-9,30,12,5,"#8394a6");
 round(x-12,y-6,24,6,3,"#e6f3f6");
 shape(x-18,y+12,3,"#f5be70");shape(x+18,y+12,3,"#f5be70");
 label("!",x+24,y-17,"bold 18px system-ui","#fff4c8");
 round(x-31,y+25,62,17,6,"#6c4459");
 label(lang==="zh"?"扫地机":"VACUUM",x,y+38,"bold 12px system-ui","#ffffff");
}
function roomDecor(time){const theme=s.scene,night=s.index===6||s.lightTurns>0;round(12,9,816,48,13,theme.wall);for(let i=0;i<8;i++){shape(38+i*106,20+Math.sin(time*.001+i)*3,2.8,"#fff9eeee")}
const motif={lounge:"☀",kitchen:"♡",laundry:"☁",bedroom:"☾",library:"✦",plants:"❀",night:"✧",final:"★"}[theme.type];
label(motif,810,43,"bold 29px system-ui","#fff8f5");
/* No decorative central rug: it looked like a target despite having no effect. */
if(night){round(0,0,840,588,0,"#6463a319");for(let i=0;i<12;i++){let x=30+i*67,y=110+(i*61)%440;shape(x,y,1.5+Math.sin(time*.002+i), "#fff9d1aa")}}
}
function draw(time){if(!s)return;const g=ctx.createLinearGradient(0,0,840,588);g.addColorStop(0,s.scene.wall);g.addColorStop(1,s.scene.floor[1]);ctx.fillStyle=g;ctx.fillRect(0,0,840,588);
for(let y=0;y<H;y++)for(let x=0;x<W;x++){let px=x*T,py=y*T,alt=(x+y)%2;round(px+2,py+2,T-4,T-4,10,s.scene.floor[alt?0:1]);round(px+7,py+7,T-14,T-14,7,s.scene.floor[alt?1:0]);if((x*11+y*13)%9===0){shape(px+15,py+17,2,"#efd9c8");shape(px+22,py+25,1.4,"#efd9c8")}if(s.grid[y][x]==="#"){round(px+4,py+2,T-8,T-8,12,"#9d97b0");round(px+9,py+5,T-18,T-22,10,"#cac1d4");}if(s.grid[y][x]==="S")sofaDraw(px+T/2,py+T/2)}
roomDecor(time);
 if(s.creak&&!s.creakTriggered){
  const x=s.creak.x*T+8,y=s.creak.y*T+8;
  round(x,y,T-16,T-16,13,"#f7bf7160");
  ctx.save();ctx.strokeStyle="#ba8143";ctx.lineWidth=2;ctx.setLineDash([4,6]);ctx.strokeRect(x+4,y+4,T-24,T-24);ctx.restore();
  label(s.index===5?"♧":"~",x+T/2-8,y+T/2+6,"bold 31px Nunito, system-ui","#a66f52");
 }
 // Stealth heatmap uses exactly the same line-of-sight rule as the guard AI.
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const p={x,y};if(!pass(p)||!visible(p))continue;
  const near=Math.abs(s.human.x-x)+Math.abs(s.human.y-y)<=1;
  round(x*T+8,y*T+8,T-16,T-16,12,near?"#ed64715c":"#df7eb249");
  if(near){ctx.save();ctx.strokeStyle="#db6478a0";ctx.lineWidth=2;ctx.strokeRect(x*T+9,y*T+9,T-18,T-18);ctx.restore();}
 }
ctx.strokeStyle="#e3caba";ctx.lineWidth=4;ctx.strokeRect(3,3,834,582);
if(s.got>=NEED){round(s.door.x*T+10,s.door.y*T+14,64,66,20,"#8fba9c");round(s.door.x*T+16,s.door.y*T+20,52,54,15,"#e0f5db")}else{round(s.door.x*T+10,s.door.y*T+14,64,66,20,"#d997aa");round(s.door.x*T+16,s.door.y*T+20,52,54,15,"#ffcbda")}
label("⌂",s.door.x*T+42,s.door.y*T+61,"bold 46px system-ui",s.got>=NEED?"#68947e":"#af6485");
for(const p of s.boxes)boxDraw(p.x*T+42,p.y*T+42);
for(const p of s.vases)vaseDraw(p.x*T+42,p.y*T+42,s.broken.has(key(p)),time);
for(const p of s.fish)if(!s.taken.has(key(p)))fishDraw(p.x*T+42,p.y*T+40,time);
if(s.yarnBall&&!s.itemsTaken.has("yarn"))yarnDraw((s.yarnBall.x+.5)*T,(s.yarnBall.y+.5)*T,time);
if(s.relic&&!s.itemsTaken.has("relic"))relicDraw((s.relic.x+.5)*T,(s.relic.y+.5)*T,time);
if(s.light&&!s.itemsTaken.has("light"))lampDraw((s.light.x+.5)*T,(s.light.y+.5)*T,false,time);
if(s.milk&&!s.itemsTaken.has("milk"))milkDraw((s.milk.x+.5)*T,(s.milk.y+.5)*T);
if(s.vacuum){const vx=s.vacuum.x*T,vy=s.vacuum.y*T;round(vx+5,vy+6,T-10,T-12,12,"#eb869d44");vacuumDraw((s.vacuum.x+.5)*T,(s.vacuum.y+.5)*T,time);}
if(aimingYarn){for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(yarnTarget({x,y}))shape((x+.5)*T,(y+.5)*T,4,"#a367c999");if(yarnPreview&&yarnTarget(yarnPreview)){const px=(yarnPreview.x+.5)*T,py=(yarnPreview.y+.5)*T;ctx.save();ctx.strokeStyle="#ad4ec9";ctx.lineWidth=4;ctx.setLineDash([7,6]);ctx.beginPath();ctx.arc(px,py,30+Math.sin(time*.008)*3,0,Math.PI*2);ctx.stroke();ctx.restore();yarnDraw(px,py,time)}}
if(route.length){for(const p of route.slice(0,12))shape((p.x+.5)*T,(p.y+.5)*T,5,"#e4aab9aa")}if(s.noise){
 yarnDraw((s.noise.x+.5)*T,(s.noise.y+.5)*T,time);
 ctx.save();ctx.strokeStyle="#af6bcb88";ctx.lineWidth=4;ctx.setLineDash([5,9]);ctx.beginPath();ctx.moveTo((s.human.x+.5)*T,(s.human.y+.5)*T);ctx.lineTo((s.noise.x+.5)*T,(s.noise.y+.5)*T);ctx.stroke();ctx.restore();
 label("?",(s.noise.x+.5)*T,(s.noise.y+.5)*T-27,"bold 30px system-ui","#9d5fbc");
}
if(s.throwTrail&&time-s.throwTrail.at<950){const from=s.throwTrail.from,to=s.throwTrail.to,f=Math.max(0,Math.min(1,(time-s.throwTrail.at)/650));
 const sx=(from.x+.5)*T,sy=(from.y+.5)*T,ex=(to.x+.5)*T,ey=(to.y+.5)*T;
 const x=sx+(ex-sx)*f,y=sy+(ey-sy)*f-65*Math.sin(f*Math.PI);
 yarnDraw(x,y,time);ctx.save();ctx.globalAlpha=.28;ctx.strokeStyle="#c785bc";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(sx,sy);ctx.quadraticCurveTo((sx+ex)/2,(sy+ey)/2-110,ex,ey);ctx.stroke();ctx.restore();
}
if(s.alert>0||s.finalAlert){ellipse((s.human.x+.5)*T,(s.human.y+.5)*T+7,37,29,"#fa999744");label("!",(s.human.x+.5)*T+25,(s.human.y+.5)*T-33,"bold 26px Fredoka","#e76e7a")}
const hu=s.human,ca=s.cat;
 // Both the owner and cat use the same smooth animation window.
 const catGlide=Math.min(1,Math.max(0,(time-(s.movedAt||0))/170));
 const catEase=catGlide*catGlide*(3-2*catGlide);
 const catX=(s.catFrom.x+(ca.x-s.catFrom.x)*catEase+.5)*T;
 const catY=(s.catFrom.y+(ca.y-s.catFrom.y)*catEase+.5)*T;
 const hop=(catGlide>0&&catGlide<1?Math.sin(catGlide*Math.PI)*7:0);
 // Brief in-between frames make the owner's reaction and chase readable.
 const glide=Math.min(1,Math.max(0,(time-(s.humanMovedAt||0))/190));
 const easing=glide*glide*(3-2*glide);
 const hx=(s.humanFrom.x+(hu.x-s.humanFrom.x)*easing+.5)*T;
 const hy=(s.humanFrom.y+(hu.y-s.humanFrom.y)*easing+.5)*T;
 humanDraw(hx,hy+10,time);
 if(s.sleepTurns>0){label("Z z z",hx,hy-41+Math.sin(time*.004)*3,"bold 18px Nunito, system-ui","#816d9e");}
 if(!hidden(ca)){catDraw(catX,catY+9+Math.sin(time*.007)*2-hop,time)}
 else{catDraw(catX,catY+17-hop,time);round(ca.x*T+15,ca.y*T+45,54,27,5,"#e2b380");label("♡",(ca.x+.5)*T,ca.y*T+67,"19px system-ui","#c18395")}
if(s.exposure>0&&!s.done){ctx.save();ctx.strokeStyle=s.exposure>=detectionLimit()-1?"#ed435e":"#f59b45";ctx.lineWidth=5;ctx.beginPath();ctx.arc((ca.x+.5)*T,(ca.y+.5)*T,34+Math.sin(time*.012)*4,0,Math.PI*2);ctx.stroke();ctx.restore()}
if(!s.started&&!s.done){const x=Math.min(610,Math.max(6,s.cat.x*T-20)),y=Math.max(65,s.cat.y*T-99);round(x,y,225,38,14,"#fffdf5ef");const first=s.index===0&&!daily;label(first?(lang==="zh"?"先点旁边的小鱼！":"Tap the nearby fish!") : tr("startHint"),x+112,y+25,"bold 15px Nunito, system-ui","#8a5773");}
for(let i=fx.length-1;i>=0;i--){const p=fx[i];shape(p.x,p.y,Math.max(1,p.life/8),p.col);p.x+=p.dx;p.y+=p.dy;p.dy+=.07;p.life--;if(p.life<0)fx.splice(i,1)}requestAnimationFrame(draw)}
function canvasTile(e){const rect=c.getBoundingClientRect();return {x:Math.floor((e.clientX-rect.left)/rect.width*W),y:Math.floor((e.clientY-rect.top)/rect.height*H)}}
function onClick(e){if(s.done)return;const p=canvasTile(e);if(p.x<0||p.x>=W||p.y<0||p.y>=H)return;if(aimingYarn)throwYarnTo(p);else command(p.x,p.y)}
function share(){
 const room=daily?9:stage+1;
 const score=Math.max(0,Math.floor(Number(s?.score)||0));
 const isWin=!!s?.winning;
 const message=lang==="zh"
  ?(isWin?'我在《猫猫绝对无辜！》第 '+room+' 关成功偷鱼，拿了 '+score+' 分！你能比我更调皮吗？':
           '我在《猫猫绝对无辜！》第 '+room+' 关挑战了 '+score+' 分。来试试能不能偷走三条鱼！')
  :(isWin?'I stole the fish in room '+room+' of Pawsibly Innocent! and scored '+score+'. Can you beat my escape?':
           'I scored '+score+' in room '+room+' of Pawsibly Innocent! Can you sneak out with three fish?');
 const link=new URL("https://morrowwish.vercel.app/pawsibly-innocent/");
 if(daily)link.searchParams.set("daily","1");else link.searchParams.set("room",String(stage+1));
 link.searchParams.set("beat",String(score));
 window.MorrowwishSocialShare.open({
  title:lang==="zh"?'猫猫绝对无辜！':'Pawsibly Innocent!',
  message,score,language:lang,
  url:link.toString(),
  meta:{game:'pawsibly-innocent',level:room}
 });
}

// No CrazyGames external links or custom fullscreen; platform supplies its own chrome.
// Explicit ?platform=crazygames also permits QA at the exact developer iframe size.
const cgEmbed=/(?:^|\/\/)(?:[^/]*\.)?crazygames\.com(?:\/|$)/i.test(document.referrer||"")||
 /(?:[?&])platform=crazygames(?:&|$)/.test(window.location?.search||"");
if(cgEmbed&&document.head){
 document.documentElement.classList.add("cg-play");
 const css=document.createElement("style");
 css.textContent=`
 html.cg-play,html.cg-play body{height:100%;min-height:0;overflow:hidden;margin:0;background:#302839}
 html.cg-play body{-webkit-user-select:none;user-select:none;overscroll-behavior:none}
 html.cg-play .sitebar,html.cg-play .heading,html.cg-play .explainer,html.cg-play .cat-legend,
 html.cg-play .tip,html.cg-play .music-permission,html.cg-play #mw-fullscreen-toggle,
 html.cg-play #shareResult,html.cg-play #musicCredit,html.cg-play #cgStealthHUD{display:none!important}
 html.cg-play .wrap{width:100%;max-width:none;margin:0;padding:4px!important}
 html.cg-play .board-layout{display:grid!important;grid-template-columns:minmax(0,1fr) clamp(204px,27vw,290px);gap:8px;max-width:none;margin:0!important;align-items:start}
 html.cg-play .board-layout>div:first-child{min-width:0;display:flex;flex-direction:column;align-items:center}
 html.cg-play .stealth-actionbar{height:57px;max-width:100%;width:min(100%,calc((100dvh - 74px)*10/7));margin:0 auto 4px!important;padding:5px 8px!important;gap:7px!important;min-height:0}
 html.cg-play .stealth-actionbar .stealth-help{font-size:11px!important;min-width:0;line-height:1.2}
 html.cg-play .stealth-actionbar .stealth-help strong{font-size:11px;line-height:1.15}
 html.cg-play .stealth-actionbar .stealth-help span:not(.bonus-dare){display:none}
 html.cg-play .stealth-actionbar .board-yarn{min-width:122px;min-height:38px;padding:7px 9px;font-size:11px;box-shadow:0 3px 0 #773b91}
 html.cg-play .bonus-dare{font-size:11px!important;line-height:1.15}
 html.cg-play #stage{width:min(100%,calc((100dvh - 74px)*10/7))!important;max-width:none;max-height:calc(100dvh - 66px);margin:0 auto;border:4px solid #fff7ea;border-radius:14px}
 html.cg-play #board{display:block;width:100%;height:auto;aspect-ratio:10/7;touch-action:none}
 html.cg-play .sticker{top:7px;left:7px;max-width:45%;padding:5px 7px}
 html.cg-play .sticker small{font-size:9px}
 html.cg-play .sticker b{font-size:12px}
 html.cg-play .stage .overlay{padding:5px}
 html.cg-play .modal{max-height:100%;padding:10px;overflow:auto}
 html.cg-play .modal h2{font-size:27px}
 html.cg-play .board-layout aside.panel{display:flex!important;flex-direction:column!important;gap:7px;padding:10px 11px!important;margin:0!important;max-width:none!important;max-height:calc(100dvh - 9px);overflow:hidden;box-shadow:none;border-radius:13px;align-self:start}
 html.cg-play .panel .sidebar-extra,html.cg-play .panel .clothes,html.cg-play .panel .collection-count{display:none!important}
 html.cg-play .panel .sidebar-mission,html.cg-play .panel .sidebar-fish,html.cg-play .panel .stats,html.cg-play .panel .sidebar-actions,html.cg-play .panel .levels{display:block;min-width:0}
 html.cg-play .panel .chapter{font-size:19px;line-height:1.1;margin:3px 0}
 html.cg-play .panel .chapter-sub,html.cg-play .panel .mission{font-size:11px;line-height:1.35;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}
 html.cg-play .panel .stats{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px}
 html.cg-play .panel .stat{padding:6px 2px;border-radius:9px}
 html.cg-play .panel .stat strong{font-size:17px}
 html.cg-play .panel .stat small{font-size:9px}
 html.cg-play .panel .sidebar-actions .button{min-height:33px;padding:6px 10px}
 html.cg-play .panel .progress{gap:4px}
 html.cg-play .panel .level-btn{min-width:30px;min-height:30px;padding:4px;font-size:11px}
 @media(max-width:740px), (max-height:390px){
  html.cg-play .board-layout{grid-template-columns:minmax(0,1fr)}
  html.cg-play .board-layout aside.panel{display:none!important}
  html.cg-play #stage{width:min(calc(100vw - 12px),calc((100dvh - 74px)*10/7))!important}
 }
 @media(max-height:470px){
  html.cg-play .stealth-actionbar{height:48px}
  html.cg-play #stage{width:min(100%,calc((100dvh - 64px)*10/7))!important}
  html.cg-play .board-layout aside.panel{gap:5px;padding:8px 10px!important}
  html.cg-play .panel .chapter-sub,html.cg-play .panel .mission{-webkit-line-clamp:1}
 }

 `;
 document.head.appendChild(css);
 // Progress and warning now live in the existing board HUD.
}

c.addEventListener("pointerdown",onClick);c.addEventListener("pointermove",e=>{if(aimingYarn){const p=canvasTile(e);yarnPreview=yarnTarget(p)?p:null}});c.addEventListener("pointerleave",()=>{yarnPreview=null});window.addEventListener("keydown",e=>{if(e.key==="Escape"&&aimingYarn){e.preventDefault();setYarnAim(false);return}if((e.code==="Space"||e.key===" ")&&!["INPUT","TEXTAREA","SELECT","BUTTON"].includes(e.target?.tagName)){e.preventDefault();throwYarn();return}const k={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]}[e.key];if(k&&!["INPUT","TEXTAREA","SELECT"].includes(e.target?.tagName)){e.preventDefault();single(...k)}});

$("restart").onclick=()=>{metric("game_retry");init(stage,daily)};
$("retryResult").onclick=()=>{metric("game_retry");init(stage,daily)};
$("nextResult").onclick=()=>{if(!s.winning)metric("game_retry");init(s.winning&&!daily?Math.min(7,stage+1):stage,daily)};
$("shareResult").onclick=share;
$("tool")&&($("tool").onclick=throwYarn);
$("sound").onclick=()=>{window.MorrowwishAudio?.toggle?.();$("sound").textContent=tr(window.MorrowwishAudio?.isEnabled?.()?"soundOn":"soundOff")};
window.addEventListener("morrowwish-language-change",e=>{lang=e.detail.lang==="zh"?"zh":"en";translateUI();syncUI();if(s.done)finishOverlayTranslate()});
function finishOverlayTranslate(){$("resultTitle").textContent=tr(s.winning?"winTitle":"loseTitle");$("resultDesc").textContent=s.winning?(daily?tr("win"):ROOM_REWARDS[lang][s.index]):tr("lose");$("resultScore").textContent=resultLine();$("retryResult").textContent=tr("tryAgain");$("nextResult").textContent=tr(s.winning?"nextRoom":"tryAgain");$("shareResult").textContent=tr("share")}
window.__PAWSIBLY_TEST__={getState:()=>s,move:single,choose:init,throwYarn,throwYarnTo,advanceYarnChase,isChasing:()=>yarnChaseTimer!==null,isAiming:()=>aimingYarn,rooms:ROOMS};
window.addEventListener("resize",fitCanvasPixels);
fitCanvasPixels();init(entryRoom,entryDaily);requestAnimationFrame(draw);
})();