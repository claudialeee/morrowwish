/* Pawsibly Innocent! — original Morrow Wish cat stealth-puzzle game. No dependencies. */
(()=>{"use strict";
const W=10,H=7,T=84,NEED=3,$=id=>document.getElementById(id);
const ROOMS=[
{en:"The Sunny Lounge",zh:"阳光客厅",enSub:"Take the nearby fish. The human chases only when they spot you.",zhSub:"先偷旁边的小鱼。主人看见猫才会追过来。",goal:29,patrol:[[7,2],[8,2],[8,1],[7,1]],rows:["..........",".....S....","...V......",".CF....F..","...S..H...","....B..F..","...F.....E"]},
{en:"Kitchen Caper",zh:"厨房偷吃计划",enSub:"Four fish in the kitchen. Can you steal every last one?",zhSub:"厨房里有四条鱼。你敢全部偷走吗？",goal:30,patrol:[[7,1],[9,1],[9,2],[7,2]],rows:["..........","..S...H...",".C...V...F","...##.....","..F...S...","..B...F..F",".........E"]},
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
const RELICS=[
 {glyph:"🎀",en:"Curtain tassel",zh:"窗帘流苏",enDesc:"The only clue left at the crime scene.",zhDesc:"案发现场唯一留下的线索。"},
 {glyph:"🔔",en:"Chef's bell",zh:"大厨的小铃铛",enDesc:"The kitchen will never be quiet again.",zhDesc:"厨房再也别想安静了。"},
 {glyph:"🧦",en:"Polka-dot sock",zh:"圆点袜子",enDesc:"The best treasure in the laundry basket.",zhDesc:"洗衣篮里的镇篮之宝。"},
 {glyph:"🌙",en:"Sleepy ribbon",zh:"晚安丝带",enDesc:"Acquired without waking the human... hopefully.",zhDesc:"希望主人没发现这条丝带不见了。"},
 {glyph:"📚",en:"Golden bookmark",zh:"金色书签",enDesc:"No paws allowed between the pages.",zhDesc:"书页间当然没有猫爪印啦。"},
 {glyph:"🪴",en:"Tiny flowerpot",zh:"迷你花盆",enDesc:"The garden's new ruler has spoken.",zhDesc:"花园的新主人已经登基。"},
 {glyph:"⭐",en:"Midnight star",zh:"午夜星星",enDesc:"A stolen piece of midnight.",zhDesc:"从午夜偷偷摘下的一颗星。"},
 {glyph:"👑",en:"Paper crown",zh:"纸做的皇冠",enDesc:"Official proof of ultimate innocence.",zhDesc:"证明小猫绝对无辜的王冠。"}
];
const BADGES=[
 {id:"first-fish",glyph:"🐟",en:"First snack",zh:"第一口鱼",enDesc:"Steal your first fish",zhDesc:"偷到第一条小鱼",ok:()=>save.stats.fish>=1},
 {id:"first-escape",glyph:"🚪",en:"Clean getaway",zh:"第一次开溜",enDesc:"Escape any room",zhDesc:"首次成功逃脱",ok:()=>save.stats.wins>=1||roomsWon()>=1},
 {id:"yarn-lure",glyph:"🧶",en:"Master of distraction",zh:"毛球诱敌大师",enDesc:"Make the owner investigate your yarn",zhDesc:"成功用毛球引走主人",ok:()=>save.stats.lures>=1},
 {id:"three-vases",glyph:"🏺",en:"Not my vase",zh:"花瓶不是我打的",enDesc:"Knock over 3 vases",zhDesc:"累计打翻三个花瓶",ok:()=>save.stats.vases>=3},
 {id:"near-miss",glyph:"💨",en:"Narrow escape",zh:"侥幸逃脱",enDesc:"Get spotted, then escape the owner without being caught",zhDesc:"被主人发现后成功甩开追逐，没有被抓住",ok:()=>save.stats.nearMisses>=1},
 {id:"three-star",glyph:"🌟",en:"Purrfectionist",zh:"喵喵完美主义",enDesc:"Earn 3 stars in one room",zhDesc:"任一房间获得三星",ok:()=>Object.values(save.best).some(v=>Number(v?.stars)===3)},
 {id:"ghost",glyph:"🌫️",en:"Invisible paws",zh:"隐身猫爪",enDesc:"Escape without being spotted",zhDesc:"全程不被发现并成功逃脱",ok:()=>save.stats.ghostWins>=1},
 {id:"souvenir-one",glyph:"🎁",en:"Little souvenir",zh:"第一次藏宝",enDesc:"Bring home a room souvenir",zhDesc:"成功收藏第一件纪念品",ok:()=>relicCount()>=1},
 {id:"souvenir-four",glyph:"🗃️",en:"Cat's cabinet",zh:"猫猫藏宝柜",enDesc:"Collect 4 different souvenirs",zhDesc:"收藏四件不同纪念品",ok:()=>relicCount()>=4},
 {id:"souvenir-eight",glyph:"🏛️",en:"House of treasures",zh:"满屋藏宝",enDesc:"Collect all 8 souvenirs",zhDesc:"集齐八件纪念品",ok:()=>relicCount()>=8},
 {id:"four-rooms",glyph:"🗝️",en:"House explorer",zh:"半个家都是我的",enDesc:"Clear 4 different rooms",zhDesc:"通关四个不同房间",ok:()=>roomsWon()>=4},
 {id:"all-rooms",glyph:"🏠",en:"The grand alibi",zh:"猫猫绝对无辜",enDesc:"Clear all 8 rooms",zhDesc:"通关全部八个房间",ok:()=>roomsWon()>=8},
 {id:"daily",glyph:"☀️",en:"Daily trouble",zh:"今日捣蛋王",enDesc:"Win a daily challenge",zhDesc:"成功完成每日挑战",ok:()=>save.stats.dailyWins>=1},
 {id:"cat-crew",glyph:"🐈",en:"Cat club",zh:"猫猫小队",enDesc:"Unlock at least 3 cats",zhDesc:"解锁至少三只猫",ok:()=>fur.filter(f=>allStars()>=f[3]).length>=3},
 {id:"cat-team",glyph:"🐾",en:"Full cat crew",zh:"猫猫全家福",enDesc:"Unlock all 5 cats",zhDesc:"解锁全部五只猫",ok:()=>fur.filter(f=>allStars()>=f[3]).length===5},
 {id:"fish-20",glyph:"🍣",en:"Fish enthusiast",zh:"小鱼鉴赏家",enDesc:"Steal 20 fish across runs",zhDesc:"累计偷到二十条鱼",ok:()=>save.stats.fish>=20},
 {id:"perfect-diversion",glyph:"🎭",en:"The perfect distraction",zh:"声东击西",enDesc:"Steal a fish while the human investigates a distraction",zhDesc:"趁主人调查声音时偷走小鱼",ok:()=>save.stats.combos>=1}
];
const TX={
en:{startHint:"Tap a tile to walk",back:"← Morrow Wish",eyebrow:"A LITTLE CAT. A LOT OF TROUBLE.",subtitle:"Steal the snacks. Outsmart the human. Leave a little chaos.",missionLabel:"TODAY'S MISSION",snackLabel:"FISH ACQUIRED",scoreLabel:"SCORE",moveLabel:"STEPS",starLabel:"STARS",roomLabel:"CHOOSE A ROOM",closetLabel:"YOUR LITTLE TROUBLEMAKER",skinHint:"Earn 1–3 stars per room to unlock new cats.",retry:"↻ Retry",soundOn:"🔊 Sound effects: On",soundOff:"🔇 Sound effects: Off",rulesKicker:"HOW TO PLAY · 30 SECOND GUIDE",howTitle:"Three steps to a purrfect escape",howBody:"Stay out of pink sight zones. The owner chases when they see you; hiding in a box breaks the pursuit.",ruleStep1Title:"1 · Tap to move",ruleStep1Text:"Tap the floor or use arrow keys.",ruleStep2Title:"2 · Steal three fish",ruleStep2Text:"Pink means visible. Hide before the alert fills! Boxes conceal you.",ruleStep3Title:"3 · Escape through the pink flap",ruleStep3Text:"Reach the cat door with three fish to win.",ruleBonus:"🧶 Toss yarn (Space) and tap a floor tile to lure the owner. ⏳ Wait (.) spends a step to advance patrols without moving; it is unsafe in sight.",tip:"<span><strong>①</strong> Tap floor to walk</span><span><strong>②</strong> Collect 3 fish</span><span><strong>③</strong> Reach pink cat flap</span>",mission:"Collect three fish and slip through the pink cat flap. Topple a vase to distract the human.",daily:"☼ Daily",room:"ROOM",dailyRoom:"DAILY CHAOS",closed:"Grab three fish first!",blocked:"Something is blocking the way!",caught:"Caught! Try a different hiding spot.",closeCall:"Narrow escape! +40",bonusDone:"Bonus dare cleared! Escape for +150.",spotted:"SPOTTED! Break line of sight!",last:"Last life! Be sneaky.",fish:"Fish acquired! Delicious.",ready:"The cat flap is open. Run for it!",vase:"CRASH! The human heard that.",box:"A cardboard box! The perfect hiding place.",hide:"The human can't see inside the box.",winTitle:"Purrfect escape!",win:"Fish stolen, chaos delivered. The human is absolutely baffled.",loseTitle:"Caught red-pawed!",lose:"A small setback for a very ambitious cat. Try a different route.",tryAgain:"Try again",nextRoom:"Next room →",again:"Play again →",share:"Share your chaos ♡",shared:"Challenge link copied!",shareText:"I escaped in Pawsibly Innocent! Can you steal three fish without getting caught?",locked:"Earn {n} stars to unlock",dailyName:"Daily House Remix",dailySub:"A familiar house with a fresh secret snack stash.",skinNames:["Marmalade","Mochi","Shadow","Peaches","Blueberry"]},
zh:{startHint:"点地板，小猫就会走",back:"← Morrow Wish 首页",eyebrow:"一只小猫，搞出天大的动静。",subtitle:"偷零食、躲主人，顺便把家里闹个天翻地覆。",missionLabel:"本关任务",snackLabel:"偷到的小鱼",scoreLabel:"得分",moveLabel:"步数",starLabel:"星星",roomLabel:"选择房间",closetLabel:"你的捣蛋小猫",skinHint:"每关可得 1–3 星，累计星星解锁新猫。",retry:"↻ 重玩",soundOn:"🔊 音效：开",soundOff:"🔇 音效：关",rulesKicker:"游戏规则 · 30 秒看懂",howTitle:"三步学会猫猫大捣蛋",howBody:"粉色区域是主人的视野。被发现会引来追逐，躲进纸箱就能摆脱视线。",ruleStep1Title:"① 点击地板移动",ruleStep1Text:"点地板或按方向键，让小猫走过去。",ruleStep2Title:"② 偷到三条小鱼",ruleStep2Text:"粉色是主人视野！连续暴露会被抓，赶快躲进纸箱。",ruleStep3Title:"③ 从粉色猫门逃走",ruleStep3Text:"带着三条小鱼走到猫门，就成功过关。",ruleBonus:"🧶 按「扔毛球」（空格）后点地板引开主人。⏳ 点「等待」（电脑按句号）可消耗一步推进巡逻；主人看得见你时等待依然危险。",tip:"<span><strong>①</strong> 点击地板移动</span><span><strong>②</strong> 收集 3 条小鱼</span><span><strong>③</strong> 走进粉色猫门</span>",mission:"偷到三条鱼，再从粉色猫门溜走。经过花瓶就能把它打翻，引开主人。",daily:"☼ 每日挑战",room:"房间",dailyRoom:"每日捣蛋",closed:"先偷够三条鱼！",blocked:"有东西挡住路啦！",caught:"糟糕，被主人抓到了！",closeCall:"差点被抓！+40 分",bonusDone:"额外挑战完成！逃脱后加 150 分。",spotted:"被发现啦！快躲进纸箱！",last:"只剩一颗心了，轻手轻脚！",fish:"小鱼到手！好吃！",ready:"猫门打开了！快溜！",vase:"哐当！主人听见了。",box:"纸箱！躲猫猫的好地方。",hide:"主人看不见纸箱里的猫。",winTitle:"完美开溜！",win:"小鱼到手，家里一团乱，主人还没回过神。",loseTitle:"当场抓包！",lose:"捣蛋事业暂时受挫。换条路线再试一次！",tryAgain:"再试一次",nextRoom:"下一间 →",again:"再玩一局 →",share:"分享战绩 ♡",shared:"挑战链接已复制！",shareText:"我在《猫猫绝对无辜！》成功偷鱼逃脱！来看看你能不能骗过主人。",locked:"累计 {n} 星解锁",dailyName:"每日猫猫大捣蛋",dailySub:"熟悉的房间，小鱼藏在了新地方。",skinNames:["橘子糖","糯米","小黑","蜜桃","蓝莓"]}
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
save.stats={fish:0,wins:0,lures:0,vases:0,nearMisses:0,ghostWins:0,dailyWins:0,combos:0,...(save.stats&&typeof save.stats==="object"?save.stats:{})};
save.achievements=save.achievements&&typeof save.achievements==="object"?save.achievements:{};
const relicCount=()=>Object.keys(save.souvenirs).filter(k=>save.souvenirs[k]).length;
const roomsWon=()=>Object.keys(save.best).filter(k=>/^room-[0-7]$/.test(k)&&Number(save.best[k]?.stars)>0).length;
let badgeTimer=null,badgeCollectTimer=null,badgeToastIds=[];
function updateBadgePocket(){
 const pocket=$("achievementPocket"),count=$("badgePocketCount");
 const total=Object.values(save.achievements).filter(Boolean).length;
 if(count)count.textContent=String(total);
 if(pocket){const title=lang==="zh"?"成就 · 已解锁 "+total+" 个":"Achievements · "+total+" unlocked";pocket.title=title;pocket.setAttribute("aria-label",title)}
}
function badgeToast(names,ids=[]){
 const el=$("achievementToast");if(!el||!names.length)return;
 badgeToastIds=ids.slice();
 clearTimeout(badgeTimer);clearTimeout(badgeCollectTimer);
 el.classList.remove("collecting");
 el.style.removeProperty("--badge-dx");el.style.removeProperty("--badge-dy");
 el.hidden=false;refreshBadgeToast();
 badgeCollectTimer=setTimeout(()=>{
  const pocket=$("achievementPocket");
  if(!pocket||el.hidden)return;
  const source=el.getBoundingClientRect(),dest=pocket.getBoundingClientRect();
  el.style.setProperty("--badge-dx",(dest.left+dest.width/2-source.left-source.width/2)+"px");
  el.style.setProperty("--badge-dy",(dest.top+dest.height/2-source.top-source.height/2)+"px");
  el.classList.add("collecting");pocket.classList.remove("badge-received");
  void pocket.offsetWidth;pocket.classList.add("badge-received");
 },850);
 badgeTimer=setTimeout(()=>{el.hidden=true;el.classList.remove("collecting");badgeToastIds=[];$("achievementPocket")?.classList.remove("badge-received")},1470);
}
function refreshBadgeToast(){
 const el=$("achievementToast");if(!el||el.hidden||!badgeToastIds.length)return;
 const badges=badgeToastIds.map(id=>BADGES.find(b=>b.id===id)).filter(Boolean);
 if(badges.length===1){
  const badge=badges[0],zh=lang==="zh";
  // The badge is a real in-game reward, not an advertising subtitle.
  // Keep the original icon, name, and how it was earned together.
  el.textContent='';
  const icon=document.createElement("span");icon.className="award-icon";
  icon.textContent=badge.glyph;
  const info=document.createElement("span");info.className="award-copy";
  const label=document.createElement("span");label.className="award-label";
  label.textContent=zh?"🏅 成就解锁":"🏅 ACHIEVEMENT UNLOCKED";
  const title=document.createElement("strong");title.className="award-title";
  title.textContent=badge[zh?"zh":"en"];
  const desc=document.createElement("small");desc.className="award-desc";
  desc.textContent=badge[zh?"zhDesc":"enDesc"];
  info.appendChild(label);info.appendChild(title);info.appendChild(desc);
  el.appendChild(icon);el.appendChild(info);
 }else{
  el.textContent=lang==="zh"?"🏅 解锁了 "+badges.length+" 个新成就！":"🏅 "+badges.length+" achievements unlocked!";
 }
}
function checkBadges(quiet=false){
 const earned=[],earnedIds=[];
 for(const badge of BADGES)if(!save.achievements[badge.id]&&badge.ok()){
  save.achievements[badge.id]=true;earned.push(badge[lang==="zh"?"zh":"en"]);earnedIds.push(badge.id);
  if(!quiet)metric("cat_achievement_unlocked",{achievement:badge.id,level:s?.index+1||1});
 }
 if(earned.length){saveGame();if(!quiet){
  if(s&&Array.isArray(s.newBadges))s.newBadges.push(...earnedIds);
  badgeToast(earned,earnedIds);audio("win");
 }}
 updateBadgePocket();
}
function addStat(name,n=1){save.stats[name]=(Number(save.stats[name])||0)+n;saveGame();checkBadges()}
const YARN_LEGEND={
en:{ready:"🧶 Tap Toss yarn (or Space), then tap a floor tile to aim. The human walks toward the sound.",empty:"🧶 Walk onto a pink yarn ball to pick it up, then use the purple button above the board.",legend:["🐟 Fish = collect 3","🧶 Yarn = lure human","📦 Box = hide","🤖 Vacuum = blocked","🚪 Pink flap = escape"],tool:"🧶 Toss yarn (Space)",need:"🧶 Find yarn first",vision:"Pink = visible · Red = near the human · Avoid the labeled robot vacuum",quickReady:"1. Tap Toss yarn.  2. Tap an open floor tile to throw there.",quickAim:"Tap the destination tile. The human follows the sound.",quickChase:"The owner is walking to the yarn. Sneak past when they stop!",cancel:"✕ Cancel throw",aim:"🧶 Tap an open floor tile to choose the yarn landing spot (or cancel).",badTarget:"Choose an open tile the human can reach.",quickEmpty:"Pick up the pink yarn ball on the floor to enable this button."},
zh:{ready:"🧶 点击「扔毛球」（电脑可按空格），再点地板决定落点，主人会循声走过去。",empty:"🧶 先让小猫走到地板上的粉色毛线球，捡到后再点击上方的紫色按钮。",legend:["🐟 小鱼＝收集三条","🧶 毛线＝引开主人","📦 纸箱＝躲藏","🤖 扫地机＝绕开","🚪 粉色猫门＝逃走"],tool:"🧶 扔毛球（空格键）",need:"🧶 先捡毛球",vision:"粉色＝主人视野 · 红色＝距离很近 · 标有「扫地机」的格子不能进入",quickReady:"① 点击「扔毛球」 ② 点地板选择落点，引开主人。",quickAim:"点击想让毛球落下的空地板，主人会循声走过去。",quickChase:"主人正在走向毛球。等他停下，趁机从另一边溜走！",cancel:"✕ 取消投掷",aim:"🧶 点击地图上的空地板选择毛球落点（或取消）。",badTarget:"请选择主人能走到的空地板。",quickEmpty:"先走到地板上的粉色毛线球，捡起来才能扔。"}
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
let stage=0,daily=false,s=null,route=[],movingTimer=null,msgTimer=null,currentToastKey=null,fx=[],entered=false,menuOpen=false,currentMenuTab="rooms",pausedYarn=false,aimingYarn=false,yarnPreview=null,yarnTargets=new Set(),yarnChaseTimer=null;
const seedDay=Number(today.replaceAll("-",""));
function randomRoom(){return Math.floor(rnd(seedDay)()*ROOMS.length)}
function toastText(k){
 if(k==="guardedFish")return lang==="zh"?"主人站在鱼上！在安全位置等待，或扔毛球引开。":"The human blocks this fish! Wait safely or lure them with yarn.";
 if(k==="vacuumFish")return lang==="zh"?"扫地机挡住鱼啦！点「等待」让它移动。":"The vacuum blocks this fish! Tap Wait to move it.";
 if(k==="bonus-completed")return lang==="zh"?"★ 额外任务完成！成功逃脱再得 150 分":"★ Bonus complete! Escape to claim +150";
  if(k==="pressure")return lang==="zh"?"主人开始加强巡逻！注意视野变大了。":"The human is on high alert! Watch their wider sight.";
  if(k==="heat")return lang==="zh"?"偷了两条鱼，主人开始留意小猫了！":"Two fish gone — the human is getting suspicious!";
  if(k==="caughtFish")return lang==="zh"?"被主人抓住了！最后偷到的一条鱼掉了，快去捡回来！":"Caught! You dropped your latest fish. Sneak back and recover it!";
  if(k==="trick-combo")return lang==="zh"?"🎭 声东击西！趁主人分心偷到鱼 +60":"🎭 Perfect distraction! Sneaky fish +60";
  if(k==="relic-named"){
  const relic=RELICS[s.index];return relic.glyph+" "+relic[lang==="zh"?"zh":"en"]+
    (lang==="zh"?"！逃走就能收藏":"! Escape to keep it");
 }
 return TX[lang][k]||EXTRA_WORDS[lang][k]||k;
}
function popup(k){
 currentToastKey=k;
 const el=$("toast");el.textContent=toastText(k);el.classList.add("on");
 clearTimeout(msgTimer);msgTimer=setTimeout(()=>{el.classList.remove("on");el.textContent="";currentToastKey=null},1450);
}
function refreshToasts(){
 if($("toast"))$("toast").textContent=currentToastKey!==null?toastText(currentToastKey):"";
 refreshBadgeToast();
}
function audio(type){window.MorrowwishAudio?.effect(type)}
function stopYarnChase(){
 if(yarnChaseTimer!==null){clearInterval(yarnChaseTimer);yarnChaseTimer=null}
 if(s)s.yarnAnimating=false;
}
function readRoom(){const index=daily?randomRoom():stage,room=ROOMS[index],extras=EXTRAS[index],grid=room.rows.map(r=>r.split("")),fish=[],vases=[],boxes=[];let cat=null,human=null,door=null;
for(let y=0;y<H;y++)for(let x=0;x<W;x++){const t=grid[y][x];if(t==="C"){cat={x,y};grid[y][x]="."}if(t==="H"){human={x,y};grid[y][x]="."}if(t==="F"){fish.push({x,y});grid[y][x]="."}if(t==="V"){vases.push({x,y});grid[y][x]="."}if(t==="B"){boxes.push({x,y});grid[y][x]="."}if(t==="E")door={x,y}}
if(daily){const r=rnd(seedDay*13+91),possible=[],visited=new Set([key(cat)]),queue=[cat];for(let i=0;i<queue.length;i++){for(const p of neighbors(queue[i])){if(visited.has(key(p))||grid[p.y][p.x]==="#"||grid[p.y][p.x]==="S"||grid[p.y][p.x]==="E")continue;visited.add(key(p));queue.push(p)}}
for(const p of queue)if(Math.abs(p.x-cat.x)+Math.abs(p.y-cat.y)>=3&&!equal(p,human)&&!vases.some(v=>equal(v,p))&&!boxes.some(b=>equal(b,p))&&!Object.values(extras).some(v=>Array.isArray(v)&&v[0]===p.x&&v[1]===p.y))possible.push(p);
if(possible.length>=4){fish.length=0;while(fish.length<4){fish.push(possible.splice(Math.floor(r()*possible.length),1)[0]);}}}
return{room,index,extras,scene:SCENES[index],yarnBall:P(extras.yarn),relic:P(extras.relic),light:P(extras.light),milk:P(extras.milk),vacuum:P(extras.robot),vacuumDir:1,itemsTaken:new Set(),yarn:save.cat===0?1:0,lightTurns:index===6?8:0,hasRelic:false,blockedTarget:null,room,grid,cat:{...cat},start:{...cat},human:{...human},humanStart:{...human},door,fish,vases,boxes,got:0,taken:new Set(),fishHaul:[],broken:new Set(),lives:3,caughtCount:0,steps:0,score:0,patrol:0,noise:null,throwTrail:null,alert:0,lastSeen:null,guardMode:index===3?"sleep":"patrol",guardTarget:null,searchTurns:0,curiosityCooldown:0,reaction:"",reactionUntil:0,reactionAt:0,distractionTurns:0,yarnAnimating:false,yarnDestination:null,sleepTurns:index===3?9:0,creak:P(CREAKY_TILES[index]),creakTriggered:false,finalAlert:false,pressure:false,started:false,done:false,winning:false,invincible:0,exposure:0,everSpotted:false,dangerActive:false,nearMisses:0,yarnThrows:0,dareAnnounced:false,outro:null,newBadges:[],newCats:[],startedAt:0,catFrom:{...cat},humanFrom:{...human},movedAt:0,humanMovedAt:0};}
function init(index=0,isDaily=false){menuOpen=false;pausedYarn=false;if($("gameMenu"))$("gameMenu").hidden=true;clearTimeout(msgTimer);clearTimeout(badgeTimer);clearTimeout(badgeCollectTimer);if($("achievementToast")){$("achievementToast").hidden=true;$("achievementToast").classList.remove("collecting")}badgeToastIds=[];currentToastKey=null;stopYarnChase();if(movingTimer){clearInterval(movingTimer);movingTimer=null}route=[];fx=[];aimingYarn=false;yarnPreview=null;yarnTargets.clear();daily=isDaily;stage=index;s=readRoom();$("stage").classList.remove("yarn-aiming");$("stage").classList.remove("victory");$("stage").classList.remove("outro-active");if($("yarnAimBanner"))$("yarnAimBanner").hidden=true;$("overlay").hidden=true;$("toast").classList.remove("on");translateUI();syncUI();}
function translateUI(){
$("gameTitle").innerHTML=lang==="zh"?"猫猫绝对无辜！":"PAWSIBLY <span>INNOCENT!</span>";
$("studioByline").textContent=lang==="zh"?"出品 ♡":"presents ♡";
document.title=lang==="zh"?"猫猫绝对无辜！— Morrow Wish":"Pawsibly Innocent! — A Little Cat, A Lot of Trouble | Morrow Wish";localizeMenu();
const ids={back:"back",eyebrow:"eyebrow",subtitle:"subtitle",missionLabel:"missionLabel",snackLabel:"snackLabel",scoreLabel:"scoreLabel",moveLabel:"moveLabel",starLabel:"starLabel",roomLabel:"roomLabel",closetLabel:"closetLabel",skinHint:"skinHint",rulesKicker:"rulesKicker",howTitle:"howTitle",ruleStep1Title:"ruleStep1Title",ruleStep1Text:"ruleStep1Text",ruleStep2Title:"ruleStep2Title",ruleStep2Text:"ruleStep2Text",ruleStep3Title:"ruleStep3Title",ruleStep3Text:"ruleStep3Text",ruleBonus:"ruleBonus",mission:"mission"};for(const [id,k]of Object.entries(ids))$(id).textContent=tr(k);
 if($("restartLabel"))$("restartLabel").textContent=lang==="zh"?"重玩":"Retry";
 if($("wait")){const tip=lang==="zh"?"等待一回合：猫不动，主人和扫地机继续巡逻（消耗一步）":"Wait a turn: cat stays still, patrol moves (costs a step)";$("wait").setAttribute("aria-label",tip);$("wait").title=tip}
 if($("waitLabel"))$("waitLabel").textContent=lang==="zh"?"等待":"Wait";
 if($("restart")){const tip=lang==="zh"?"重新开始当前关卡":"Restart this room";$("restart").setAttribute("aria-label",tip);$("restart").title=tip;}
$("howBody").textContent=tr("howBody");if($("visionTip"))$("visionTip").textContent=YARN_LEGEND[lang].vision;if($("yarnAimBanner"))$("yarnAimBanner").textContent=YARN_LEGEND[lang].aim;c.setAttribute("aria-label",lang==="zh"?"猫猫捣蛋游戏。点击地板移动，收集三条鱼，再从粉色猫门逃走。":"Cat stealth adventure. Tap a floor tile to move. Collect three fish and reach the pink cat flap.");if($("tool")){$("tool").classList.toggle("aiming",aimingYarn);$("tool").classList.toggle("teach-yarn",!daily&&s.index===0&&s.got===1&&s.yarnThrows===0&&s.yarn>0&&!s.yarnAnimating);$("tool").textContent=aimingYarn?YARN_LEGEND[lang].cancel:s.yarn>0?YARN_LEGEND[lang].tool+" · "+s.yarn:YARN_LEGEND[lang].need;$("tool").disabled=s.yarn===0||s.yarnAnimating}if($("yarnExplain"))$("yarnExplain").textContent=YARN_LEGEND[lang][s.yarn>0?"ready":"empty"];if($("yarnQuickHint"))$("yarnQuickHint").textContent=YARN_LEGEND[lang][aimingYarn?"quickAim":s.yarnAnimating?"quickChase":s.yarn>0?"quickReady":"quickEmpty"];if($("collectionHint"))$("collectionHint").textContent=lang==="zh"?"每个房间都藏着一件纪念品，成功逃脱才能收藏。":"Each room hides a souvenir. Escape to add it to your album.";
 if($("starRuleHelp"))$("starRuleHelp").textContent=lang==="zh"?"★ 偷到 3 条鱼逃脱即通关  ·  ★★ 偷齐 4 条鱼或完成额外任务  ·  ★★★ 4 条鱼＋额外任务＋全程未被抓＋步数达标":"★ Escape with 3 fish  ·  ★★ Collect all 4 fish or complete the bonus quest  ·  ★★★ All 4 fish + bonus + no captures + efficient steps";if($("ability"))$("ability").textContent=et("ability")[save.cat];const total=allStars(),nextCat=fur.findIndex((f,i)=>i>0&&total<f[3]);if($("skinHint"))$("skinHint").textContent=nextCat<0?(lang==="zh"?"全部 5 只小猫已解锁！":"All 5 cats unlocked!"):(lang==="zh"?"累计 "+total+" 星 · 再得 "+(fur[nextCat][3]-total)+" 星解锁「"+TX.zh.skinNames[nextCat]+"」":total+" stars · "+(fur[nextCat][3]-total)+" more to unlock "+TX.en.skinNames[nextCat]);if($("tool"))$("tool").setAttribute("aria-label",aimingYarn?YARN_LEGEND[lang].cancel:YARN_LEGEND[lang].tool);$("sound").textContent=tr(window.MorrowwishAudio?.isEnabled?.()?"soundOn":"soundOff");
if($("stageHome")){
 const homeText=lang==="zh"?"返回主页":"Home";
 $("stageHomeLabel").textContent=homeText;
 $("stageHome").setAttribute("aria-label",lang==="zh"?"返回 Morrow Wish 主页":"Back to Morrow Wish home");
 $("stageHome").title=lang==="zh"?"返回主页":"Back to home";
}
$("roomNum").textContent=daily?tr("dailyRoom"):tr("room")+" "+String(stage+1).padStart(2,"0")+" / 08";
$("roomTag").textContent=daily?tr("dailyName"):s.room[lang==="zh"?"zh":"en"];
$("chapter").textContent=daily?tr("dailyName"):s.room[lang==="zh"?"zh":"en"];
$("chapterSub").textContent=daily?tr("dailySub"):s.room[lang==="zh"?"zhSub":"enSub"];
const lv=$("levels");lv.innerHTML="";ROOMS.forEach((r,i)=>{const b=document.createElement("button");b.className="level-btn";b.disabled=i>save.unlocked;b.textContent=i+1;b.title=r[lang==="zh"?"zh":"en"];b.setAttribute("aria-current",String(!daily&&stage===i));b.onclick=()=>init(i,false);lv.appendChild(b)});
const dailyB=document.createElement("button");dailyB.className="level-btn daily";dailyB.textContent=tr("daily");dailyB.setAttribute("aria-current",String(daily));dailyB.onclick=()=>init(0,true);lv.appendChild(dailyB);
const shelf=$("souvenirShelf");if(shelf){shelf.innerHTML="";RELICS.forEach((relic,i)=>{const b=document.createElement("button");b.className="souvenir-stamp"+(save.souvenirs[i]?" found":"");b.disabled=i>save.unlocked;b.textContent=save.souvenirs[i]?relic.glyph:"?";b.type="button";b.title=(save.souvenirs[i]?relic[lang==="zh"?"zh":"en"]:"???")+" · "+ROOMS[i][lang==="zh"?"zh":"en"];b.onclick=()=>init(i,false);shelf.appendChild(b)})}
const wd=$("wardrobe");wd.innerHTML="";fur.forEach((f,i)=>{const b=document.createElement("button");b.className="skin"+(save.cat===i?" active":"");const starLocked=allStars()<f[3],runLocked=s.started&&!s.done&&save.cat!==i;b.disabled=starLocked||runLocked;b.style.background="#fff5f1";b.style.setProperty("--cat-fur",f[0]);b.style.setProperty("--cat-detail",f[1]);b.innerHTML='<span class="cat-portrait"><b>•ᴗ•</b></span>';b.title=TX[lang].skinNames[i]+(starLocked?" · "+tr("locked").replace("{n}",f[3]):runLocked?(lang==="zh"?" · 完成本局或重玩后换猫":" · Finish or retry to change cats"):"");b.setAttribute("aria-label",b.title);b.onclick=()=>{if(s.started&&!s.done||allStars()<f[3])return;save.cat=i;saveGame();if(!s.started)s.yarn=i===0?1:0;translateUI();syncUI();audio("fish")};if(b.disabled){const span=document.createElement("span");span.className="lock";span.textContent="🔒";b.appendChild(span)}wd.appendChild(b)});
}
let collectionPaintKey="";
function renderCollections(){
 const signature=lang+"|"+RELICS.map((_,i)=>save.souvenirs[i]?"1":"0").join("")+"|"+
  BADGES.map(b=>save.achievements[b.id]?"1":"0").join("")+"|"+(s?.hasRelic?s.index:"none");
 if(signature===collectionPaintKey)return;
 collectionPaintKey=signature;
 const count=relicCount(),earned=BADGES.filter(b=>save.achievements[b.id]).length;
 const gallery=$("relicGallery"),grid=$("achievementsGrid");
 
 if($("relicSummary"))$("relicSummary").textContent=(lang==="zh"?"查看八件纪念品":"Souvenir album")+" · "+count+"/8";
 if($("achievementSummary"))$("achievementSummary").textContent=(lang==="zh"?"查看成就徽章":"Achievement badges")+" · "+earned+"/"+BADGES.length;
 if(gallery)gallery.innerHTML=RELICS.map((item,i)=>{
  const unlocked=!!save.souvenirs[i],pending=s?.hasRelic&&s.index===i&&!unlocked;
  return '<div class="relic-card '+(unlocked?'':'locked')+'"><span class="glyph">'+(unlocked||pending?item.glyph:"🔒")+'</span><span><strong>'+(unlocked||pending?item[lang==="zh"?"zh":"en"]:"???")+'</strong><small>'+(unlocked?(item[lang==="zh"?"zhDesc":"enDesc"]+(lang==="zh"?" · 已收藏":" · Collected")):(pending?(lang==="zh"?"本局找到，待逃脱保存":"Found now; escape to save"):(lang==="zh"?"第 "+(i+1)+" 关 · 尚未收藏":"Room "+(i+1)+" · not found")))+'</small></span></div>';
 }).join("");
 const chipbar=$("badgeHighlights");
 if(chipbar){
  const owned=BADGES.filter(b=>save.achievements[b.id]),upcoming=BADGES.filter(b=>!save.achievements[b.id]);
  const preview=owned.slice(-3);while(preview.length<3&&upcoming.length)preview.push(upcoming.shift());
  chipbar.innerHTML=preview.map(b=>'<span class="badge-chip '+(save.achievements[b.id]?'':'locked')+'" title="'+b[lang==="zh"?"zhDesc":"enDesc"]+'">'+(save.achievements[b.id]?b.glyph:"🔒")+' '+b[lang==="zh"?"zh":"en"]+'</span>').join("");
 }
 if(grid)grid.innerHTML=BADGES.map(b=>{
  const got=!!save.achievements[b.id];return '<div class="achievement-card '+(got?'':'locked')+'"><span class="glyph">'+(got?b.glyph:"🔒")+'</span><span><strong>'+b[lang==="zh"?"zh":"en"]+'</strong><small>'+b[lang==="zh"?"zhDesc":"enDesc"]+(got?(lang==="zh"?" · 已获得":" · Unlocked"):"")+'</small></span></div>';
 }).join("");
}
function guardLabel(){
 const mode=s?.guardMode||"patrol",zh=lang==="zh";
 const modes={patrol:zh?"巡逻中 · 没发现猫":"Patrolling · cat unseen",curious:zh?"听到脚步 · 去刚才的位置查看":"Heard footsteps · checking last tile",investigate:zh?"调查响声 · 正走向声源":"Investigating · heading to the noise",chase:zh?"发现小猫！正在追赶":"Cat spotted! Giving chase",search:zh?"找猫中 · 搜索最后出现的位置":"Searching · last seen location",distracted:zh?"被毛球吸引 · 还剩 "+s.distractionTurns+" 步":"Distracted by yarn · "+s.distractionTurns+" moves left",sleep:zh?"睡着了 · 轻轻走":"Asleep · tread softly"};
 return modes[mode]||modes.patrol;
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
function dareProgress(){
 if(!s)return {value:0,total:1,label:"0/1"};
 const kind=DARES[s.index].kind;
 if(kind==="allfish")return {value:s.got,total:s.fish.length,label:s.got+"/"+s.fish.length};
 if(kind==="vase")return {value:Math.min(s.broken.size,1),total:1,label:(s.broken.size>0?1:0)+"/1"};
 if(kind==="relic")return {value:Number(s.hasRelic),total:1,label:(s.hasRelic?1:0)+"/1"};
 if(kind==="yarn")return {value:Number(s.yarnThrows>0),total:1,label:(s.yarnThrows>0?1:0)+"/1"};
 if(kind==="ghost")return {value:Number(s.winning&&!s.everSpotted),total:1,
  label:s.everSpotted?(lang==="zh"?"本局已暴露":"Spotted"):(s.winning?"1/1":(lang==="zh"?"保持潜行":"Stay unseen"))};
 return {value:0,total:1,label:"0/1"};
}
function updateDare(){
 if(!s)return;
 const done=dareDone(),dare=DARES[s.index],el=$("bonusDare"),quick=$("bonusQuick"),progress=dareProgress();
 const prefix=lang==="zh"?"额外任务":"BONUS QUEST";
 if(el){el.textContent=(done?"✓ ":"☆ ")+prefix+" · "+dare[lang]+" · "+progress.label;el.classList.toggle("complete",done)}
 if(quick){
  quick.classList.toggle("complete",done);
  quick.setAttribute("aria-label",(done?"✓ ":"★ ")+prefix+" · "+dare[lang]+" · "+progress.label);
  quick.title=prefix+" · "+dare[lang]+" · "+progress.label;
  if($("bonusQuickText"))$("bonusQuickText").textContent=cgEmbed&&window.innerWidth<=850
   ?(lang==="zh"?"额外":"BONUS")+(done?" ✓":"")
   :(done?"✓ ":prefix+" · ")+dare[lang];
  if($("bonusQuickProgress"))$("bonusQuickProgress").textContent=done?"+150":progress.label;
 }
 if(done&&!s.dareAnnounced){
  s.dareAnnounced=true;
  metric("cat_dare_completed",{level:s.index+1,kind:dare.kind});
  if(!s.done){throwStars(s.cat,"#ffd78a");audio("fish");popup("bonus-completed")}
 }
}
function renderNewCatUnlocks(){
 const panel=$("catUnlocks");if(!panel)return;
 const newly=s?.winning&&Array.isArray(s.newCats)?s.newCats:[];
 panel.hidden=newly.length===0;
 if(!newly.length){panel.innerHTML="";return}
 const zh=lang==="zh";
 panel.innerHTML='<h3 class="new-cats-title">'+(zh?"新伙伴解锁！":"New cats unlocked!")+'</h3>'+
  newly.map(i=>{
   const name=TX[lang].skinNames[i],f=fur[i],equipped=save.cat===i;
   return '<div class="new-cat-row"><span class="new-cat-face" style="--cat-fur:'+f[0]+';--cat-detail:'+f[1]+'"><span class="cat-portrait"><b>•ᴗ•</b></span></span>'+
    '<span class="new-cat-copy"><strong>'+name+'</strong><small>'+et("ability")[i]+'</small></span>'+
    '<button type="button" class="new-cat-equip" data-equip-cat="'+i+'"'+(equipped?' disabled':'')+'>'+
    (equipped?(zh?"已换上":"Equipped"):(zh?"换上这只猫":"Equip cat"))+'</button></div>';
  }).join("");
}
function resultLoot(){
 if(!s)return "";
 const parts=[];
 if(s.winning&&s.hasRelic)parts.push(RELICS[s.index].glyph+" "+RELICS[s.index][lang==="zh"?"zh":"en"]+(lang==="zh"?" · 已收藏":" · Saved"));
 if(s.newBadges?.length){
  const names=s.newBadges.map(id=>BADGES.find(b=>b.id===id)?.[lang==="zh"?"zh":"en"]).filter(Boolean);
  if(names.length)parts.push("🏅 "+(lang==="zh"?"新成就：":"Achievements: ")+names.join(" / "));
 }
 return parts.join("   ·   ");
}
function resultStarGuide(){
 if(!s.winning)return "";
 const missing=[];
 if(s.got<s.fish.length)missing.push(lang==="zh"?"还差 "+(s.fish.length-s.got)+" 条鱼":"Missing "+(s.fish.length-s.got)+" fish");
 if(!dareDone())missing.push(lang==="zh"?"额外任务未完成":"Bonus quest not completed");
 if(s.caughtCount>0)missing.push(lang==="zh"?"本局被抓过":"Caught during this run");
 if(s.steps>s.room.goal+4)missing.push(lang==="zh"?"步数超出三星标准":"Over the 3-star step target");
 if(s.nearMisses>=2)missing.push(lang==="zh"?"被发现次数过多":"Too many close calls");
 return missing.length?(lang==="zh"?"冲击三星还需：":"For 3 stars: ")+missing.join(" · ")
  :(lang==="zh"?"三星完成：偷齐 4 条鱼、额外任务、未被抓、步数达标！":"Perfect heist: every fish, bonus quest, no captures, efficient steps!");
}
function resultLine(){
 const bonus=s.winning?(dareDone()?(lang==="zh"?" · 额外挑战 ✓ +150":" · BONUS ✓ +150"):(lang==="zh"?" · 额外挑战未完成":" · Bonus missed")):"";
 const target=challengeGoal&&((daily&&entryDaily)||(!daily&&stage===entryRoom))?(lang==="zh"?" · 好友目标 "+challengeGoal+(s.score>challengeGoal?" ✓":""):" · Beat "+challengeGoal+(s.score>challengeGoal?" ✓":"")):"";
 return (lang==="zh"?"得分 ":"Score ")+s.score+" · "+(lang==="zh"?"步数 ":"Steps ")+s.steps+(s.hasRelic?" · "+et("bonus")+" ✓":"")+bonus+target;
}
function contextualHint(){
 if(!s)return "";
 if(aimingYarn)return lang==="zh"?"点地图上的空地板，主人会走向毛球。":"Tap a floor tile. The owner will walk to your yarn.";
 if(s.yarnAnimating)return lang==="zh"?"主人正被毛球引开！现在就可以移动，去偷鱼！":"The owner is following the yarn! Move now and steal the fish.";
 if(s.blockedTarget&&equal(s.blockedTarget,s.human))return lang==="zh"?"主人挡着鱼！在安全处点「等待」，或扔毛球引开。":"The human blocks a fish. Wait from a safe tile or throw yarn.";
 if(s.blockedTarget&&s.vacuum&&equal(s.blockedTarget,s.vacuum))return lang==="zh"?"扫地机挡着鱼！点「等待」让它巡逻，或改偷另一条。":"The vacuum blocks a fish. Tap Wait or choose another fish.";
 if(s.exposure>0&&!s.pressure&&!s.finalAlert)return lang==="zh"?"被发现，自动行走已停止。请点视野外的地板或躲纸箱。":"Spotted: auto-walk stopped. Tap a safe tile or hide in a box.";
 if(s.distractionTurns>0)return lang==="zh"?"主人分心了！趁这 "+s.distractionTurns+" 步偷鱼开溜。":"The owner is distracted! You have "+s.distractionTurns+" safe moves.";
 if(s.index===0&&!daily){
  if(s.got===0)return lang==="zh"?"① 点旁边的小鱼。主人看见你才会追！":"① Tap the nearby fish. The owner chases if they spot you!";
  if(s.got===1&&s.yarnThrows===0&&s.yarn>0)return lang==="zh"?"② 粉色是主人视野。试试扔毛球引开他！":"② Pink is the owner’s sight. Try throwing yarn to lure them away!";
  if(s.got<NEED)return lang==="zh"?"③ 躲开粉色区域，再偷够三条鱼。":"③ Stay out of pink tiles and steal three fish.";
  return s.got<s.fish.length
   ?(lang==="zh"?"✓ 猫门已开！想拿三星，还得偷第 4 条鱼。":"✓ Exit open! Steal the fourth fish for 3-star eligibility.")
   :(lang==="zh"?"✓ 四条鱼到手！完成额外任务再逃脱。":"✓ All four fish! Complete the bonus quest and escape.");
 }
 if(s.finalAlert)return lang==="zh"?"主人发现异样了，快去猫门！":"The owner is suspicious. Make your escape!";
 // Rising time-pressure (警戒升级) is the more urgent state — surface it ahead of the
 // ambient sleep/creak tips so the HUD always explains why the owner's sight widened.
 if(s.pressure)return lang==="zh"?"警戒升级：主人巡逻更仔细！躲视野、用毛球绕路。":"High alert: wider sight! Hide, time your moves and use yarn.";
 if(s.sleepTurns>0)return lang==="zh"?"主人睡着了，轻声行动，别碰响声！":"The owner is sleeping. Stay quiet!";
 if(s.creak&&!s.creakTriggered)return lang==="zh"?"橙色闪光地板会发出声响，请绕开。":"The amber tile CREAKS. Find a quiet route.";
  if(s.got>=NEED)return s.got<s.fish.length
   ?(lang==="zh"?"三条鱼已经可以通关；想拿三星，还得找第 4 条鱼。":"Three fish open the exit; find the fourth to chase 3 stars.")
   :(lang==="zh"?"四条鱼齐了！记得完成额外任务再撤离。":"All four fish! Complete the bonus quest before escaping.");
  if(s.index>=3&&s.got>=2)return lang==="zh"?"鱼少了！主人变警觉，尽快找机会从猫门溜走。":"Missing fish! The human is more watchful. Plan your escape.";
 return YARN_LEGEND[lang].vision;
}
function syncUI(){if($("visionTip"))$("visionTip").textContent=contextualHint();
 updateCoach();
 if($("stage"))$("stage").classList.toggle("owner-following-yarn",!!s.yarnAnimating);
 if($("guardIntent"))$("guardIntent").textContent=guardLabel();
 if($("guardStatus"))$("guardStatus").setAttribute("data-mode",s?.guardMode||"patrol");
 renderCollections();updateDare();updateStealthHUD();const fishProgress=Math.min(NEED,s.got);$("fishCount").textContent=fishProgress+" / "+NEED+(s.got>NEED?(lang==="zh"?" · 额外鱼 ✓":" · bonus fish ✓"):"");$("meterFill").style.width=Math.min(100,100*s.got/NEED)+"%";if($("tool")){$("tool").classList.toggle("aiming",aimingYarn);$("tool").classList.toggle("teach-yarn",!daily&&s.index===0&&s.got===1&&s.yarnThrows===0&&s.yarn>0&&!s.yarnAnimating);$("tool").textContent=aimingYarn?YARN_LEGEND[lang].cancel:s.yarn>0?YARN_LEGEND[lang].tool+" · "+s.yarn:YARN_LEGEND[lang].need;$("tool").disabled=s.yarn===0||s.yarnAnimating}if($("yarnExplain"))$("yarnExplain").textContent=YARN_LEGEND[lang][s.yarn>0?"ready":"empty"];if($("yarnQuickHint"))$("yarnQuickHint").textContent=YARN_LEGEND[lang][aimingYarn?"quickAim":s.yarnAnimating?"quickChase":s.yarn>0?"quickReady":"quickEmpty"];if($("wait"))$("wait").disabled=!!s.done||aimingYarn||s.yarnAnimating;$("score").textContent=s.score;$("moves").textContent=s.steps;$("starTotal").textContent=allStars();$("hearts").setAttribute("aria-label",lang==="zh"?"剩余 "+s.lives+" 颗心":s.lives+" hearts left");$("hearts").innerHTML=Array.from({length:3},(_,i)=>'<span class="'+(i>=s.lives?"empty":"")+'">♥</span>').join("");if($("heistStatus"))$("heistStatus").textContent="🐟 "+Math.min(s.got,NEED)+"/"+NEED+(s.got>NEED?" ★":"")+" · "+"♥".repeat(s.lives)+"♡".repeat(3-s.lives);}
const MENU_TEXT={
 en:{rooms:"Rooms",album:"Album",badges:"Badges",cats:"Cats",help:"Help",open:"Open game menu",close:"Close game menu",how:"How to play"},
 zh:{rooms:"关卡",album:"图鉴",badges:"成就",cats:"小猫",help:"帮助",open:"打开游戏菜单",close:"关闭菜单",how:"游戏玩法"}
};
function updateCoach(){
 const el=$("coachSpot");if(!el||!s)return;
 const show=!daily&&s.index===0&&(s.got===0||s.got>=NEED);
 const tile=s.got>=NEED?s.door:s.fish.find(f=>!s.taken.has(key(f)));
 el.classList.toggle("active",!!show&&!!tile&&!menuOpen&&!s.done);
 if(show&&tile){el.style.left=((tile.x+.5)/W*100)+"%";el.style.top=((tile.y+.5)/H*100)+"%";}
}
function setMenuTab(name){
 const tabs=["rooms","album","badges","cats","help"];
 currentMenuTab=tabs.includes(name)?name:"rooms";
 document.querySelectorAll("[data-game-tab]").forEach(button=>{
  const on=button.getAttribute("data-game-tab")===currentMenuTab;
  button.setAttribute("aria-selected",String(on));button.tabIndex=on?0:-1;
 });
 document.querySelectorAll("[data-tab-panel]").forEach(panel=>{panel.hidden=panel.getAttribute("data-tab-panel")!==currentMenuTab});
 const body=document.querySelector(".game-menu-body");if(body)body.scrollTop=0;
}
function localizeMenu(){
 const tx=MENU_TEXT[lang];
 document.querySelectorAll("[data-menu-label]").forEach(el=>{
  const k=el.getAttribute("data-menu-label");el.textContent=tx[k]||k;
 });
 for(const [id,title] of [["menuButton",tx.open],["menuClose",tx.close],["quickHelp",tx.how]]){
  const el=$(id);if(el){el.setAttribute("aria-label",title);el.title=title}
 }
 if($("helpLegend"))$("helpLegend").textContent=lang==="zh"
  ?"🐟 偷3条鱼 · 🧶 引开主人 · 📦 躲藏 · 🚪 从猫门逃脱"
  :"🐟 3 fish · 🧶 distract · 📦 hide · 🚪 escape";
 if($("menuButtonLabel"))$("menuButtonLabel").textContent=lang==="zh"?"菜单":"Menu";
 updateBadgePocket();
}
function openMenu(tab="rooms"){
 if(!s)return;
 if(movingTimer){clearInterval(movingTimer);movingTimer=null}route=[];
 if(yarnChaseTimer!==null){clearInterval(yarnChaseTimer);yarnChaseTimer=null;pausedYarn=true}
 menuOpen=true;$("gameMenu").hidden=false;
 translateUI();setYarnAim(false);setMenuTab(tab);localizeMenu();updateCoach();
 $("menuClose")?.focus?.();
}
function closeMenu(){
 if(!menuOpen)return;
 menuOpen=false;$("gameMenu").hidden=true;
 if(pausedYarn&&s?.yarnAnimating){yarnChaseTimer=setInterval(advanceYarnChase,470)}
 pausedYarn=false;updateCoach();
 $("menuButton")?.focus?.({preventScroll:true});
}
function neighbors(p){return[[1,0],[0,1],[-1,0],[0,-1]].map(([dx,dy])=>({x:p.x+dx,y:p.y+dy})).filter(q=>q.x>=0&&q.x<W&&q.y>=0&&q.y<H);}
function pass(p,human=false){if(!p||p.x<0||p.y<0||p.x>=W||p.y>=H)return false;const t=s.grid[p.y][p.x];if(t==="#"||t==="S")return false;if(human&&(t==="E"||s.boxes.some(b=>equal(b,p))))return false;if(!human&&((s.vacuum&&equal(p,s.vacuum))||equal(p,s.human)))return false;return true}
function pathTo(from,to,human=false,avoidCat=false){if(equal(from,to))return[];const q=[from],seen=new Set([key(from)]),prev=new Map();for(let i=0;i<q.length;i++){const p=q[i];if(equal(p,to)){const result=[];let t=key(p);while(t!==key(from)){const next=prev.get(t);result.unshift({x:Number(t.split(",")[0]),y:Number(t.split(",")[1])});t=next}return result}for(const n of neighbors(p)){if(!pass(n,human)||(avoidCat&&equal(n,s.cat))||seen.has(key(n)))continue;seen.add(key(n));prev.set(key(n),key(p));q.push(n)}}return[]}
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
function visible(p=s.cat){if(s.sleepTurns>0||hidden(p))return false;
 // An investigating OR temporarily distracted owner can still notice a cat
 // right beside them; a thrown yarn ball is a lure, not magical invisibility.
 if((s.yarnAnimating||s.guardMode==="distracted")&&Math.abs(s.human.x-p.x)+Math.abs(s.human.y-p.y)>1)return false;
 let a=s.human,b=p,d=Math.abs(a.x-b.x)+Math.abs(a.y-b.y);const sight=Math.max(1,3+(s.index>=3?1:0)+((s.index>=5&&s.got>=2)||s.pressure?1:0)-(save.cat===1?1:0)-(s.lightTurns>0?(save.cat===2?2:1):0));if(d>sight)return false;if(d<=1)return true;if(a.x===b.x){for(let y=Math.min(a.y,b.y)+1;y<Math.max(a.y,b.y);y++)if(s.grid[y][a.x]==="#"||s.grid[y][a.x]==="S")return false;return true}if(a.y===b.y){for(let x=Math.min(a.x,b.x)+1;x<Math.max(a.x,b.x);x++)if(s.grid[a.y][x]==="#"||s.grid[a.y][x]==="S")return false;return true}if(d===2&&Math.abs(a.x-b.x)===1&&Math.abs(a.y-b.y)===1){
 // No diagonal sight through the corner of a wall or sofa.
 const blocked=(x,y)=>["#","S"].includes(s.grid[y][x]);
 return !blocked(a.x,b.y)&&!blocked(b.x,a.y);
 }return false}
function throwStars(p,color){for(let i=0;i<9;i++)fx.push({x:(p.x+.5)*T,y:(p.y+.5)*T,dx:(Math.random()-.5)*4,dy:-Math.random()*3-1,life:30,col:color});}
function hurt(){if(s.invincible>0)return;stopYarnChase();s.caughtCount++;s.lives--;s.score=Math.max(0,s.score-30);
 // A capture costs the most recently stolen fish, rather than merely teleporting
 // the player with the full haul intact. Fish stay on their original reachable tiles.
 const dropped=s.fishHaul.pop();
 if(dropped){s.taken.delete(dropped.tile);s.got=Math.max(0,s.got-1);s.score=Math.max(0,s.score-dropped.points);
  metric("cat_fish_dropped",{level:daily?9:stage+1,remaining:s.got});}
 route=[];if(movingTimer){clearInterval(movingTimer);movingTimer=null;}audio("bad");popup(dropped?"caughtFish":"caught");throwStars(s.cat,"#fb7893");s.invincible=2;s.exposure=0;metric("cat_caught",{level:daily?9:stage+1,score:s.score});if(s.lives<=0){finish(false);return;}s.cat={...s.start};s.human={...s.humanStart};s.noise=null;s.alert=0;s.lastSeen=null;s.distractionTurns=0;s.yarnDestination=null;s.guardMode="patrol";s.guardTarget=null;s.searchTurns=0;s.curiosityCooldown=0;s.reaction="";s.reactionUntil=0;s.reactionAt=0;s.dangerActive=false;s.patrol=0;s.catFrom={...s.cat};s.humanFrom={...s.human};s.movedAt=performance.now();s.humanMovedAt=performance.now();}
function yarnTarget(p){return !!s&&yarnTargets.has(key(p))}
function setYarnAim(on){
 aimingYarn=!!on;yarnPreview=null;yarnTargets.clear();
 if(aimingYarn)for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const p={x,y};if(pass(p,true)&&!equal(p,s.human)&&!equal(p,s.cat)&&pathTo(s.human,p,true,true).length>0)yarnTargets.add(key(p));
 }
 $("stage").classList.toggle("yarn-aiming",aimingYarn);
 if($("yarnAimBanner"))$("yarnAimBanner").hidden=!aimingYarn;
 syncUI();
}
function throwYarn(){
 if(!s||s.done||s.yarnAnimating||menuOpen)return;
 if(aimingYarn){setYarnAim(false);return}
 if(s.yarn<=0){popup("noYarn");return}
 route=[];if(movingTimer){clearInterval(movingTimer);movingTimer=null}
 setYarnAim(true);
}
function throwYarnTo(p){
 if(!aimingYarn||!s||s.done||s.yarnAnimating||menuOpen)return false;
 if(!yarnTarget(p)){popup(YARN_LEGEND[lang].badTarget);return false}
 if(!s.started){s.started=true;s.startedAt=performance.now();metric("game_start",{level:daily?9:stage+1})}
 s.blockedTarget=null;s.noise={...p};s.yarnDestination={...p};s.distractionTurns=0;s.yarnThrows++;s.throwTrail={from:{...s.cat},to:{...p},at:performance.now()};
 s.alert=Math.max(7,pathTo(s.human,p,true,true).length+3);s.lastSeen=null;s.yarn--;s.steps++;
 s.decoyAwareness=Math.max(0,(s.yarnThrows||1)-1);
 setYarnAim(false);
 throwStars(s.noise,"#db9fef");audio("yarn");startYarnChase();popup("lured");
 metric("cat_yarn_toss",{level:s.index+1,target_x:p.x,target_y:p.y});
 if(equal(s.cat,s.human))hurt();syncUI();return true;
}
// The owner visibly investigates the ball over a short animation.
// Cat movement is paused during the investigation, then the owner lingers four player turns.
function finishYarnInvestigation(){
 stopYarnChase();
 if(!s||s.done)return;
 s.noise=null;s.alert=0;s.lastSeen=null;s.yarnDestination=null;s.searchTurns=0;s.reaction="";
 s.distractionTurns=Math.max(1,5-s.yarnThrows-Math.floor(s.index/3));s.guardMode="distracted";s.guardTarget={...s.human};
 guardReaction(s.decoyAwareness>0?'yarn-suspicious':'yarn-found',3);
 addStat("lures");
 audio("yarn");syncUI();
 metric("cat_yarn_distracted",{level:s.index+1,turns:s.distractionTurns});
}
function advanceYarnChase(){
 if(!s||s.done||!s.yarnAnimating)return;
 if(!s.noise||equal(s.human,s.noise)){finishYarnInvestigation();return}
 const previous={...s.human};
 guardMove();
 if(equal(previous,s.human)||!s.noise||equal(s.human,s.noise)){
  finishYarnInvestigation();return
 }
 syncUI();
}
function startYarnChase(){
 stopYarnChase();
 if(!s?.noise)return;
 s.yarnAnimating=true;s.guardMode="investigate";s.guardTarget={...s.noise};
 guardReaction('yarn-heard',3);
 advanceYarnChase(); // Visible immediate reaction.
 if(s.yarnAnimating)yarnChaseTimer=setInterval(advanceYarnChase,470);
 syncUI();
}
function guardReaction(kind,turns=2){
 s.reaction=kind;s.reactionUntil=s.steps+turns;s.reactionAt=performance.now();
}
function ownerDistance(p=s.cat){return Math.abs(s.human.x-p.x)+Math.abs(s.human.y-p.y)}
function soundApproachPoint(target){
 // If the cat made the noise, investigate BESIDE that location, not into the cat.
 // A thrown ball still draws the owner to its exact unoccupied tile.
 if(!equal(target,s.cat))return target;
 const options=neighbors(target).filter(p=>pass(p,true)&&!equal(p,s.cat));
 const reachable=options.map(p=>({p,path:pathTo(s.human,p,true,true)}))
   .filter(v=>v.path.length||equal(v.p,s.human))
   .sort((a,b)=>a.path.length-b.path.length);
 return reachable[0]?.p||target;
}
function guardMove(silent=false){
 const h=s.human;let target=null;
 if(s.sleepTurns>0&&!s.noise){
  s.sleepTurns--;s.guardMode="sleep";s.guardTarget=null;
  if(s.sleepTurns===0){popup("wake");guardReaction("wake")}
  return;
 }
 if(s.sleepTurns>0&&s.noise){s.sleepTurns=0;popup("wake");guardReaction("wake")}
 if(s.distractionTurns>0&&!s.noise){
  s.distractionTurns--;s.guardMode="distracted";s.guardTarget={...h};return;
 }
 if(s.curiosityCooldown>0)s.curiosityCooldown--;
 if(s.noise){
  if(!s.yarnAnimating&&visible(s.cat)){s.noise=null;s.alert=0}
  if(s.noise){target=soundApproachPoint(s.noise);s.guardMode="investigate";
  if(equal(h,target)||s.alert<=0){s.noise=null;s.alert=0;target=null}
  else s.alert--;
  }
 }
 // Detection immediately changes the owner's intention toward the real cat.
 // Its first sighting pauses one turn with a visible warning, preventing an instant loss.
 const seesCat=!s.noise&&visible(s.cat);
 if(!target&&seesCat){
  s.lastSeen={...s.cat};s.searchTurns=s.index>=5?4:s.index>=2?3:2;s.alert=3;
  s.guardMode="chase";s.guardTarget={...s.cat};
  if(s.exposure===0&&!s.finalAlert){guardReaction("spotted");return}
  target={...s.cat};
 }
 if(!target&&s.lastSeen&&s.searchTurns>0){
  target={...s.lastSeen};s.guardMode="search";s.searchTurns--;
  if(equal(h,target)){s.searchTurns=0;s.lastSeen=null}
 }
 // Hearing footsteps pulls the owner toward a tile the cat JUST LEFT.
 // A short cooldown gives the player time to hide, rather than a psychic constant chase.
 if(!target&&!silent&&!hidden(s.cat)&&s.steps>=2&&s.curiosityCooldown===0&&ownerDistance()<=(s.index>=4?6:4)){
  target={...s.catFrom};s.lastSeen={...target};s.searchTurns=1;
  s.curiosityCooldown=s.index<=1?4:s.index>=5?1:2;
  s.guardMode="curious";guardReaction("footsteps");
 }
 if(!target){
  const stops=s.room.patrol;
  if(equal(h,{x:stops[s.patrol][0],y:stops[s.patrol][1]}))s.patrol=(s.patrol+1)%stops.length;
  target={x:stops[s.patrol][0],y:stops[s.patrol][1]};s.guardMode="patrol";
 }
 s.guardTarget={...target};
 const investigate=s.guardMode==="investigate";
 const steps=pathTo(h,target,true,investigate),next=steps[0];
 s.humanFrom={...h};
 if(next){
  if(equal(next,s.cat)&&(investigate||s.guardMode==="curious"||s.guardMode==="search")){
   guardReaction("footsteps");return;
  }
  s.human={...next};s.humanMovedAt=performance.now()+105;
 }
}
// Escalating alert: the first room teaches controls without instant vision penalties.
// Later levels make sight, shadows, boxes and yarn meaningful choices.
function detectionLimit(){return s.index===0&&!daily?4:s.index>=4?2:3}
function updateStealthHUD(){
 const alert=$("pawsAlert");if(alert&&s){const seen=s.exposure>0&&visible();alert.hidden=!seen;alert.textContent=s.exposure>=detectionLimit()?(lang==="zh"?"危险！下一步仍暴露会被抓":"DANGER! Hide before next move"):(lang==="zh"?"被发现 "+s.exposure+" / "+detectionLimit():"SPOTTED "+s.exposure+" / "+detectionLimit());}
 const hud=document.querySelector?.("#cgStealthHUD");if(!hud||!s)return;
 const seen=s.exposure>0&&visible();
 const safeDistraction=s.yarnAnimating||["investigate","distracted","sleep"].includes(s.guardMode);
 hud.textContent=lang==="zh"?(seen?(s.exposure>=detectionLimit()?"危险！再暴露一步就会被抓":"被发现！快躲起来"):(safeDistraction?"主人正在分心":"潜行中"))+" · 小鱼 "+s.got+"/"+NEED
  :(seen?(s.exposure>=detectionLimit()?"DANGER — HIDE NOW!":"SPOTTED — HIDE!"):(safeDistraction?"OWNER DISTRACTED":"SNEAK MODE"))+" · FISH "+s.got+"/"+NEED;
 hud.classList.toggle("alert",seen);
 hud.setAttribute("aria-label",lang==="zh"?"警戒状态与小鱼数量":"Detection status and fish collected");
}
function resolveDetection(){
 if(s.done)return;
 if(hidden(s.cat)||!visible()){
  if(s.dangerActive){s.dangerActive=false;if(s.invincible===0&&s.nearMisses<2){s.nearMisses++;addStat("nearMisses");s.score+=40;throwStars(s.cat,"#8ddbbc");audio("yarn");popup("closeCall");metric("cat_close_call",{level:s.index+1,score:s.score});}}
  // Breaking sight clears the alert, so the next sighting starts fresh.
  s.exposure=0;return
 }
 s.dangerActive=true;s.everSpotted=true;
 const limit=detectionLimit(),before=s.exposure;
 s.exposure=Math.min(limit,s.exposure+(ownerDistance()<=1?2:1));
 // Give a visible warning at full alert before capture on a later move.
 if(before>=limit&&s.invincible===0){hurt();return}
 if(before===0&&limit<99)popup("spotted");
}
function moveTo(p){if(s.done||!pass(p)||Math.abs(p.x-s.cat.x)+Math.abs(p.y-s.cat.y)!==1)return;
if(!s.started){s.started=true;s.startedAt=performance.now();metric("game_start",{level:daily?9:stage+1})}
s.blockedTarget=null;s.catFrom={...s.cat};s.cat={...p};s.movedAt=performance.now();s.steps++;s.invincible=Math.max(0,s.invincible-1);
const fishIndex=s.fish.findIndex(f=>equal(f,p)&&!s.taken.has(key(f)));if(fishIndex>=0){s.taken.add(key(p));s.got++;addStat("fish");const fishValue=save.cat===4?135:100; s.score+=fishValue;
 const combo=!!(s.guardMode==="distracted"||s.guardMode==="investigate")&&!visible(p);
 if(combo){
  s.score+=60;addStat("combos");
  throwStars(p,"#ecc1fc");metric("cat_trick_combo",{level:s.index+1,score:s.score});
 }
 s.fishHaul.push({tile:key(p),points:fishValue+(combo?60:0)});
 audio("fish");throwStars(p,"#ffd16e");popup(s.got>=NEED?"ready":combo?"trick-combo":"fish");
 if(s.index>=2&&ownerDistance(p)<=5&&s.sleepTurns===0&&!s.yarnAnimating&&!s.noise){
  s.noise={...p};s.alert=4;guardReaction("fish",2);
 }
 metric("cat_fish",{level:daily?9:stage+1,score:s.score});}
if(s.creak&&!s.creakTriggered&&equal(s.creak,p)){
 s.creakTriggered=true;guardReaction("footsteps",2);s.noise={...p};s.alert=5;s.lastSeen=null;
 audio("vase");throwStars(p,"#ffd89e");popup("creak");metric("cat_noisy_floor",{level:s.index+1});
}
const vase=s.vases.find(v=>equal(v,p));if(vase&&!s.broken.has(key(vase))){s.broken.add(key(vase));addStat("vases");s.score+=35;guardReaction("vase",2);s.noise={...p};s.alert=save.cat===3?11:6;s.lastSeen=null;audio("vase");throwStars(p,"#d4a8dc");popup("vase");metric("cat_vase",{level:daily?9:stage+1})}
if(s.yarnBall&&equal(p,s.yarnBall)&&!s.itemsTaken.has("yarn")){s.itemsTaken.add("yarn");s.yarn++;s.score+=25;popup("yarn");audio("yarn");metric("cat_yarn",{level:s.index+1})}
if(s.relic&&equal(p,s.relic)&&!s.itemsTaken.has("relic")){s.itemsTaken.add("relic");s.hasRelic=true;s.score+=90;
 popup("relic-named");audio("souvenir");throwStars(p,"#aeb0ee");metric("cat_souvenir",{level:s.index+1})}
if(s.milk&&equal(p,s.milk)&&!s.itemsTaken.has("milk")){s.itemsTaken.add("milk");s.lives=Math.min(3,s.lives+1);s.score+=25;popup("milk");audio("milk");throwStars(p,"#d6f5ef")}
if(s.light&&equal(p,s.light)&&!s.itemsTaken.has("light")){s.itemsTaken.add("light");s.lightTurns=8;s.score+=30;popup("light");audio("light");throwStars(p,"#fbd886")}
if(hidden(p))popup("hide");
if(equal(p,s.door)){if(s.got>=NEED){finish(true);return}else popup("closed")}
if(s.index>=3&&s.got===2&&fishIndex>=0)popup("heat");
 if(s.index>=2&&s.steps>=s.room.goal&&!s.pressure){s.pressure=true;if(!s.finalAlert)popup("pressure");guardReaction("footsteps",2)}
 if(s.index===7&&s.got>=NEED&&!s.finalAlert){s.finalAlert=true;s.alert=4;s.lastSeen={...s.cat};audio("bad");popup("finalAlert");metric("cat_finale_chase",{level:8})}
if(!s.yarnAnimating)guardMove();s.lightTurns=Math.max(0,s.lightTurns-1);
if(s.vacuum&&(s.index===2||s.index===7||s.steps%2===0)){const a={x:s.vacuum.x+s.vacuumDir,y:s.vacuum.y};if(!pass(a,true)||equal(a,s.door)||equal(a,s.cat)){s.vacuumDir*=-1}else{s.vacuum=a}}
if(equal(s.cat,s.human))hurt();
else resolveDetection();
if(!s.done&&s.vacuum&&equal(s.cat,s.vacuum)){popup("robot");s.vacuumDir*=-1;}
// Sustained time in guard vision triggers capture after the tutorial level.
// Boxes or breaking line-of-sight lower exposure; direct overlap always catches.
syncUI();}
function finish(win){if(s.done)return;stopYarnChase();s.done=true;s.winning=win;route=[];if(movingTimer){clearInterval(movingTimer);movingTimer=null;}
const bonus=win&&dareDone();
 const cleanRun=s.steps<=s.room.goal+4&&s.nearMisses<2;
 const allFish=s.got===s.fish.length;
 // Three fish open the exit; only all fish + bonus + no captures + a clean
 // route earn three stars. Recovering hearts never erases a capture.
 const stars=win?(allFish&&bonus&&s.caughtCount===0&&cleanRun?3:(allFish||bonus?2:1)):0;
if(win){s.score+=Math.max(80,300-s.steps*3)+s.lives*50+(s.everSpotted?0:125)+(bonus?150:0);if(daily||s.index!==7)audio("win");if(!daily&&stage<=save.unlocked)save.unlocked=Math.max(save.unlocked,Math.min(7,stage+1));if(s.hasRelic){save.souvenirs[s.index]=true;s.score+=75;metric("cat_relic_saved",{level:s.index+1})}
const starsBefore=allStars();
const id=daily?"daily-"+today:"room-"+stage;const old=save.best[id]||{stars:0,score:0};save.best[id]={stars:Math.max(old.stars,stars),score:Math.max(old.score,s.score)};save.stats.wins=(Number(save.stats.wins)||0)+1;
 if(daily)save.stats.dailyWins=(Number(save.stats.dailyWins)||0)+1;
 if(!s.everSpotted)save.stats.ghostWins=(Number(save.stats.ghostWins)||0)+1;
 s.newCats=fur.map((f,i)=>i>0&&starsBefore<f[3]&&allStars()>=f[3]?i:-1).filter(i=>i>=0);
 saveGame();for(const i of s.newCats)metric("cat_skin_unlocked",{cat:i,stars:allStars()});checkBadges();
 metric("cat_level_won",{level:daily?9:stage+1,score:s.score});}
metric(win?"game_complete":"game_over",{level:daily?9:stage+1,score:s.score,stars,bonus:bonus?1:0,steps:s.steps,duration:s.startedAt?Math.round((performance.now()-s.startedAt)/1000):0});syncUI();translateUI();
$("medal").textContent=win?"😼":"😿";$("stars").textContent=win?"★".repeat(stars)+"☆".repeat(3-stars):"☆☆☆";$("resultTitle").textContent=resultHeading();$("resultDesc").textContent=resultDescription();
$("resultScore").textContent=resultLine();$("resultStarGuide").textContent=resultStarGuide();if($("resultUnlocks"))$("resultUnlocks").textContent=resultLoot();renderNewCatUnlocks();$("stage").classList.toggle("victory",win);
$("retryResult").textContent=tr("tryAgain");$("nextResult").textContent=nextResultLabel();$("shareResult").textContent=tr("share");$("closeResult").setAttribute("aria-label",lang==="zh"?"关闭结算":"Close results");$("closeResult").title=lang==="zh"?"关闭结算":"Close results";
 if(win&&!daily&&s.index===7){
  s.outro={startedAt:performance.now(),duration:window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches?1800:4600};
  $("stage").classList.add("outro-active");
  $("overlay").hidden=true;
  audio("yarn");
 }else $("overlay").hidden=false;
}
function closeResult(){if(!s?.done)return;$("overlay").hidden=true;$("menuButton")?.focus?.({preventScroll:true})}
function resultHeading(){
 return s.winning&&!daily&&s.index===7
  ?(lang==="zh"?"猫猫大逃亡成功！":"THE GREAT CAT ESCAPE!")
  :tr(s.winning?"winTitle":"loseTitle");
}
function resultDescription(){
 return s.winning&&!daily&&s.index===7
  ?(lang==="zh"?"八间房被闹得鸡飞狗跳，主人还在后面喊，小猫已经叼着鱼跑远了。"
    :"Eight rooms in chaos. The human is still grumbling; the cat is long gone with the fish.")
  :(s.winning?(daily?tr("win"):ROOM_REWARDS[lang][s.index]):tr("lose"));
}
function nextResultLabel(){
 return s.winning&&!daily&&s.index===7
  ?(lang==="zh"?"再挑战最终关":"Replay the finale")
  :tr(s.winning?"nextRoom":"tryAgain");
}
function endOutro(){
 if(!s?.outro)return;
 s.outro=null;
 $("stage").classList.remove("outro-active");
 $("overlay").hidden=false;
 audio("win");
}
function drawOutro(time){
 const el=s.outro,elapsed=Math.max(0,Math.min(4600,(time-el.startedAt)*4600/el.duration)),zh=lang==="zh";
 const progress=Math.max(0,Math.min(1,(elapsed-400)/3200));
 ctx.save();
 const sky=ctx.createLinearGradient(0,0,0,588);
 sky.addColorStop(0,"#fff0d8");sky.addColorStop(.72,"#f4d2d1");sky.addColorStop(1,"#eac9bc");
 ctx.fillStyle=sky;ctx.fillRect(0,0,840,588);
 // House and sunlit garden: the same soft outlines and palette as the level art.
 ellipse(698,156,79,72,"#ffdf9b70");
 round(0,180,282,271,15,"#f8dfd1");
 ctx.fillStyle="#ba879b";ctx.beginPath();ctx.moveTo(0,202);ctx.lineTo(140,114);ctx.lineTo(305,202);ctx.closePath();ctx.fill();
 round(174,252,88,192,30,"#855b75");round(187,263,72,180,27,"#cf9e9f");
 label("⌂",224,360,"bold 57px Fredoka,system-ui","#fff1df");
 round(27,258,100,93,14,"#fffaf1");round(37,268,80,74,10,"#b0d2cd");
 stroke(76,267,76,344,"#fffaf1",7);stroke(38,305,114,305,"#fffaf1",7);
 for(let i=0;i<8;i++){round(i*113,375,104,12,3,"#eed7bc");round(i*113+12,342,10,59,4,"#e8cda9")}
 round(0,409,840,179,0,"#e8d4c0");
 for(let i=0;i<11;i++){const x=23+i*83;ellipse(x,469+(i%2)*49,52,13,"#fff0dc70")}
 for(const [x,y] of [[312,400],[384,394],[648,400],[725,398],[802,404]]){
  ellipse(x,y,34,18,"#a9cda7");ellipse(x-17,y-12,25,21,"#afd4ae");ellipse(x+13,y-14,27,22,"#b4d7b1");
  shape(x-7,y-23,5,"#f19aac");shape(x+15,y-8,4,"#f4bc78");
 }
 const catX=218+545*progress,ownerX=82+481*Math.max(0,Math.min(1,(elapsed-135)/3370));
 const catHop=progress>.71?65*Math.sin(Math.PI*Math.min(1,(progress-.71)/.29)):0;
 const catY=435-catHop-Math.abs(Math.sin(elapsed/118))*11;
 const ownerY=444-Math.abs(Math.sin(elapsed/151))*5;
 for(let i=0;i<4;i++)ellipse(catX-45-i*21,476+i%2*11,7+i*2,3+i,"#cfaeab66");
 ctx.save();ctx.translate(ownerX,ownerY);ctx.rotate(-.035+Math.sin(elapsed/140)*.025);
 humanDraw(0,0,time);
 stroke(19,-2,37,-28-Math.sin(elapsed/125)*10,"#f7d5b4",9);
 shape(37,-28-Math.sin(elapsed/125)*10,7,"#f7d5b4");
 ctx.restore();
 ctx.save();ctx.translate(catX,catY);ctx.rotate(-.055+Math.sin(elapsed/110)*.035);
 catDraw(0,0,time);
 ctx.save();ctx.translate(31,-25);ctx.scale(.55,.55);fishDraw(0,0,time);ctx.restore();
 ctx.restore();
 const speeches=elapsed<1350
  ?[zh?"小坏猫！站住！":"HEY! STOP RIGHT THERE!",zh?"那是我的鱼！":"THAT'S MY FISH!"]
  :elapsed<2650
   ?[zh?"把鱼给我放下！":"GIVE THAT BACK!",zh?"听到没有！":"I'M TALKING TO YOU!"]
   :[zh?"下次别让我抓到！":"JUST YOU WAIT!",zh?"……又让它跑了！":"...NOT AGAIN!"];
 const bx=Math.max(146,Math.min(688,ownerX+38));
 round(bx-141,267,282,75,17,"#d5b4ae");round(bx-140,263,280,75,17,"#fffcf4");
 label(speeches[0],bx,296,"bold 21px Nunito,system-ui","#8a526b");
 label(speeches[1],bx,320,"bold 14px Nunito,system-ui","#a47782");
 shape(bx-55,344,7,"#fffcf4");
 round(88,22,664,105,25,"#fffaf3ed");
 label(elapsed<2950?(zh?"偷完鱼，快跑！":"FISH STOLEN. RUN!"):(zh?"抓不到我吧！":"YOU'LL NEVER CATCH ME!"),420,71,"bold 37px Fredoka,system-ui","#a66a8d");
 label(elapsed<2950?(zh?"主人正在后面气急败坏地追……":"The human is not taking this well..."):(zh?"八间房都没能困住这只狡猾的小猫":"Eight rooms. One very sneaky cat."),420,103,"bold 16px Nunito,system-ui","#8b7281");
 if(elapsed>3300){
  ctx.globalAlpha=Math.min(1,(elapsed-3300)/400);
  round(204,495,432,55,19,"#fff9f1f2");
  label(zh?"猫猫完美脱身！":"A PERFECT GETAWAY!",420,531,"bold 27px Fredoka,system-ui","#a15d80");
  ctx.globalAlpha=1;
 }
 label(zh?"点击跳过":"TAP TO SKIP",742,575,"bold 12px Nunito,system-ui","#8a7180");
 ctx.restore();
}
// A tap immediately starts walking, with no confirmation. On the first sighting,
// stop queued steps so the player can react instead of auto-walking into danger.
function stopWalking(){route=[];if(movingTimer!==null){clearInterval(movingTimer);movingTimer=null}}
function advanceCatRoute(){
 if(!s||s.done||!route.length){stopWalking();return}
 const next=route.shift();
 if(!pass(next)){stopWalking();popup("blocked");return}
 const wasExposed=s.exposure;
 moveTo(next);
 if(!s.done&&(s.exposure>wasExposed||(s.exposure>0&&visible()))){stopWalking();return}
 if(s.done||!route.length)stopWalking();
}
function command(x,y){
 if(!s||s.done||menuOpen||aimingYarn)return;
 if(x===s.cat.x&&y===s.cat.y){if(route.length)stopWalking();return}
 const target={x,y};
 if(equal(target,s.human)){s.blockedTarget={...target};popup(s.fish.some(f=>equal(f,target)&&!s.taken.has(key(f)))?"guardedFish":"blocked");syncUI();return}
 if(s.vacuum&&equal(target,s.vacuum)){s.blockedTarget={...target};popup(s.fish.some(f=>equal(f,target)&&!s.taken.has(key(f)))?"vacuumFish":"robot");syncUI();return}
 if(!pass(target)){popup("blocked");return}
 if(movingTimer&&equal(route[route.length-1],target))return;
 route=catPathTo(s.cat,target);
 if(!route.length){stopWalking();popup("blocked");return}
 if(movingTimer===null){advanceCatRoute();if(route.length)movingTimer=setInterval(advanceCatRoute,300)}
}
function single(dx,dy){if(!s||s.done||menuOpen)return;route=[];if(movingTimer){clearInterval(movingTimer);movingTimer=null}const p={x:s.cat.x+dx,y:s.cat.y+dy};if(s.vacuum&&equal(p,s.vacuum)){popup("robot");return}if(!pass(p)){popup("blocked");return}moveTo(p)}
// Wait consumes a turn, even when the cat stays still. Enemies and sight advance.
function waitTurn(){
 if(!s||s.done||menuOpen||aimingYarn||s.yarnAnimating)return;
 stopWalking();
 if(!s.started){s.started=true;s.startedAt=performance.now();metric("game_start",{level:daily?9:stage+1})}
 s.steps++;s.invincible=Math.max(0,s.invincible-1);s.catFrom={...s.cat};s.movedAt=performance.now();
 if(s.index>=2&&s.steps>=s.room.goal&&!s.pressure){s.pressure=true;if(!s.finalAlert)popup("pressure");guardReaction("footsteps",2)}
 guardMove(true);s.lightTurns=Math.max(0,s.lightTurns-1);
 if(s.vacuum&&(s.index===2||s.index===7||s.steps%2===0)){
  const p={x:s.vacuum.x+s.vacuumDir,y:s.vacuum.y};
  if(!pass(p,true)||equal(p,s.door)||equal(p,s.cat))s.vacuumDir*=-1;else s.vacuum=p;
 }
 if(equal(s.cat,s.human))hurt();else resolveDetection();
 syncUI();
}
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
function relicDraw(x,y,time,idx){
 ellipse(x,y+16,20,6,"#9673ae44");ctx.save();ctx.translate(x,y+Math.sin(time*.004+x)*3);ctx.rotate(-.1);
 round(-21,-22,42,42,12,"#fff1d8");round(-18,-19,36,36,9,"#f8dfed");
 label(RELICS[idx].glyph,0,10,"29px system-ui","#9f6b9c");ctx.restore()
}
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
function draw(time){if(!s)return;if(s.outro){drawOutro(time);if(time-s.outro.startedAt>=s.outro.duration)endOutro();requestAnimationFrame(draw);return}const g=ctx.createLinearGradient(0,0,840,588);g.addColorStop(0,s.scene.wall);g.addColorStop(1,s.scene.floor[1]);ctx.fillStyle=g;ctx.fillRect(0,0,840,588);
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
// A quiet in-world first action cue, not another blocking explanation panel.
// It disappears as soon as the player takes a step; it does not change difficulty.
if(!daily&&s.index===0&&s.steps===0&&s.got===0){
 const firstFish=s.fish.find(f=>Math.abs(f.x-s.cat.x)+Math.abs(f.y-s.cat.y)===1&&!s.taken.has(key(f)));
 if(firstFish){
  const fx=(firstFish.x+.5)*T,fy=(firstFish.y+.5)*T;
  ctx.save();
  ctx.strokeStyle='#fff4c6';ctx.lineWidth=4;
  ctx.shadowColor='#db8cba';ctx.shadowBlur=15;
  ctx.beginPath();ctx.arc(fx,fy,33+3*Math.sin(time*.006),0,Math.PI*2);ctx.stroke();
  ctx.restore();
  label(lang==='zh'?'点这条鱼':'TAP FISH',fx,fy-43,'800 13px Nunito,system-ui','#895679');
 }
}
if(s.yarnBall&&!s.itemsTaken.has("yarn"))yarnDraw((s.yarnBall.x+.5)*T,(s.yarnBall.y+.5)*T,time);
if(s.relic&&!s.itemsTaken.has("relic"))relicDraw((s.relic.x+.5)*T,(s.relic.y+.5)*T,time,s.index);
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
if(s.guardTarget&&!equal(s.guardTarget,s.human)&&!["sleep","distracted"].includes(s.guardMode)){
 const pursuit=pathTo(s.human,s.guardTarget,true,s.guardMode==="investigate").slice(0,5);
 const tint=s.guardMode==="investigate"?"#a779d0aa":(s.guardMode==="chase"||s.guardMode==="search"?"#e76c81aa":s.guardMode==="curious"?"#e7aa56cc":"#67b7b1aa");
 pursuit.forEach((p,i)=>{shape((p.x+.5)*T,(p.y+.5)*T,Math.max(4,9-i),tint)});
}
if(s.alert>0||s.finalAlert){
 const listening=s.guardMode==="investigate";
 ellipse((s.human.x+.5)*T,(s.human.y+.5)*T+7,37,29,listening?"#b490d944":"#fa999744");
 label(listening?"?":"!",(s.human.x+.5)*T+25,(s.human.y+.5)*T-33,"bold 26px Fredoka",listening?"#9b66b8":"#e76e7a");
}
const hu=s.human,ca=s.cat;
 // Both the owner and cat use the same smooth animation window.
 const catGlide=Math.min(1,Math.max(0,(time-(s.movedAt||0))/170));
 const catEase=catGlide*catGlide*(3-2*catGlide);
 const catX=(s.catFrom.x+(ca.x-s.catFrom.x)*catEase+.5)*T;
 const catY=(s.catFrom.y+(ca.y-s.catFrom.y)*catEase+.5)*T;
 const hop=(catGlide>0&&catGlide<1?Math.sin(catGlide*Math.PI)*7:0);
 // Brief in-between frames make the owner's reaction and chase readable.
 const glide=Math.min(1,Math.max(0,(time-(s.humanMovedAt||0))/155));
 const easing=glide*glide*(3-2*glide);
 const hx=(s.humanFrom.x+(hu.x-s.humanFrom.x)*easing+.5)*T;
 const hy=(s.humanFrom.y+(hu.y-s.humanFrom.y)*easing+.5)*T;
 humanDraw(hx,hy+10,time);
 // Occupied collectibles must remain legible above an owner or vacuum.
 for(const obstacle of [s.human,s.vacuum])if(obstacle&&s.fish.some(f=>equal(f,obstacle)&&!s.taken.has(key(f)))){
  const x=obstacle===s.human?hx:(obstacle.x+.5)*T,y=obstacle===s.human?hy:(obstacle.y+.5)*T;
  const px=Math.min(804,x+17),py=Math.max(5,y-46);
  round(px,py,31,28,9,"#fff8ec");label("🐟",px+15,py+21,"19px system-ui","#8c6082");
 }
 // In-world intent follows the owner, but never overlaps their reaction speech.
 const speaking=s.reaction&&s.steps<=s.reactionUntil&&time-(s.reactionAt||0)<1850;
 if(!speaking&&!s.yarnAnimating&&!s.done){
  const tags={
   patrol:[lang==="zh"?"巡逻":"PATROL","#fffcf4","#685970"],
   curious:[lang==="zh"?"听声":"HEARD","#fff0d6","#855e36"],
   investigate:[lang==="zh"?"调查":"CHECK","#f1e0ff","#7c4e9e"],
   chase:[lang==="zh"?"追猫":"CHASE","#ffe2e2","#ae3e60"],
   search:[lang==="zh"?"找猫":"SEARCH","#fff0da","#995c43"],
   distracted:[lang==="zh"?"分心":"BUSY","#e4faeb","#417a60"],
   sleep:[lang==="zh"?"睡觉":"ASLEEP","#eef0fa","#65709a"]
  };
  const tag=tags[s.guardMode]||tags.patrol;
  const bx=Math.max(51,Math.min(787,hx+42)),by=Math.max(92,hy-37);
  round(bx-43,by-15,86,27,12,tag[1]);
  label(tag[0],bx,by+4,"bold 13px Nunito,system-ui",tag[2]);
 }
 if(speaking){
  const reactions={
   spotted:lang==="zh"?"发现小猫！":"KITTY!",
   footsteps:lang==="zh"?"谁在那里？":"WHO'S THERE?",
   fish:lang==="zh"?"我的鱼呢？！":"MY FISH?!",
   vase:lang==="zh"?"花瓶！":"MY VASE!",
   wake:lang==="zh"?"什么声音？":"WHAT WAS THAT?",
    "yarn-heard":lang==="zh"?"咦？毛球的声音！":"WHAT WAS THAT?",
    "yarn-found":lang==="zh"?"好可疑的毛球……":"A YARN BALL?",
    "yarn-suspicious":lang==="zh"?"怎么又是毛球！":"NOT AGAIN!"
  };
  const msg=reactions[s.reaction]||"?";
  const bx=Math.max(95,Math.min(740,hx)),by=Math.max(77,hy-64);
  round(bx-86,by-21,172,34,14,"#fffdf3ef");
  label(msg,bx,by+2,"bold 14px Nunito,system-ui","#805875");
 }
 if(s.yarnAnimating){
   label(lang==="zh"?"去看看！":"CHECKING!",hx,hy-50,"bold 14px Nunito,system-ui","#9b58b8");
   // Show the investigation movement rather than teleporting at 240ms/step.
   const bx=(s.noise.x+.5)*T,by=(s.noise.y+.5)*T;
   ctx.save();ctx.strokeStyle="#bd7fc9aa";ctx.lineWidth=3;ctx.setLineDash([6,7]);
   ctx.beginPath();ctx.moveTo(hx,hy);ctx.lineTo(bx,by);ctx.stroke();ctx.restore();
 }
 if(s.sleepTurns>0){label("Z z z",hx,hy-41+Math.sin(time*.004)*3,"bold 18px Nunito, system-ui","#816d9e");}
 if(!hidden(ca)){catDraw(catX,catY+9+Math.sin(time*.007)*2-hop,time)}
 else{catDraw(catX,catY+17-hop,time);round(ca.x*T+15,ca.y*T+45,54,27,5,"#e2b380");label("♡",(ca.x+.5)*T,ca.y*T+67,"19px system-ui","#c18395")}
if(s.exposure>0&&!s.done){ctx.save();ctx.strokeStyle=s.exposure>=detectionLimit()-1?"#ed435e":"#f59b45";ctx.lineWidth=5;ctx.beginPath();ctx.arc((ca.x+.5)*T,(ca.y+.5)*T,34+Math.sin(time*.012)*4,0,Math.PI*2);ctx.stroke();ctx.restore()}
if(!s.started&&!s.done){const x=Math.min(610,Math.max(6,s.cat.x*T-20)),y=Math.max(65,s.cat.y*T-99);round(x,y,225,38,14,"#fffdf5ef");const first=s.index===0&&!daily;label(first?(lang==="zh"?"先点旁边的小鱼！":"Tap the nearby fish!") : tr("startHint"),x+112,y+25,"bold 15px Nunito, system-ui","#8a5773");}
for(let i=fx.length-1;i>=0;i--){const p=fx[i];shape(p.x,p.y,Math.max(1,p.life/8),p.col);p.x+=p.dx;p.y+=p.dy;p.dy+=.07;p.life--;if(p.life<0)fx.splice(i,1)}requestAnimationFrame(draw)}
function canvasTile(e){const rect=c.getBoundingClientRect();return {x:Math.floor((e.clientX-rect.left)/rect.width*W),y:Math.floor((e.clientY-rect.top)/rect.height*H)}}
function onClick(e){if(s?.outro){endOutro();return}if(s.done||menuOpen)return;const p=canvasTile(e);if(p.x<0||p.x>=W||p.y<0||p.y>=H)return;if(aimingYarn)throwYarnTo(p);else command(p.x,p.y)}
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
  html.cg-play,html.cg-play body{width:100%;height:100%;min-height:0;overflow:hidden!important;margin:0!important;background:#e8d9e8}
  html.cg-play body{overscroll-behavior:none}
  html.cg-play .sitebar,html.cg-play .music-permission,html.cg-play #mw-fullscreen-toggle,html.cg-play #shareResult,html.cg-play #musicCredit{display:none!important}
  html.cg-play .single-screen-game,html.cg-play .wrap{width:100%!important;height:100dvh!important;max-width:none!important;margin:0!important;padding:0!important}
  html.cg-play .board-layout{width:100%!important;height:100%!important;margin:0!important;display:block!important}
  html.cg-play #stage{box-sizing:border-box!important;width:100%!important;height:100dvh!important;max-width:none!important;max-height:none!important;aspect-ratio:auto!important;margin:0!important;border:0!important;border-radius:0!important;box-shadow:none!important;display:flex!important;flex-direction:column!important;justify-content:center!important;align-items:center!important;background:radial-gradient(ellipse at 50% 45%,#fff0e2,#e6d4e8)!important}
  html.cg-play #stage>.in-game-top{width:100%!important;max-width:990px!important;min-height:43px!important;padding:4px 9px!important;flex:0 0 auto!important}
  html.cg-play #stage>.playfield{box-sizing:border-box!important;width:min(100%,calc((100dvh - 138px)*10/7))!important;height:auto!important;max-width:100%!important;max-height:calc(100dvh - 138px)!important;aspect-ratio:10/7!important;flex:0 1 auto!important;margin:0 auto!important}
  html.cg-play #stage>.playfield canvas{width:100%!important;height:100%!important;aspect-ratio:10/7!important}
  @media(max-width:850px){
   html.cg-play #bonusQuick .bonus-star,html.cg-play #bonusQuickProgress{display:none!important}
   html.cg-play #bonusQuick{padding:3px 6px!important;gap:0!important}
   html.cg-play #bonusQuickText{white-space:nowrap!important;overflow:visible!important;text-overflow:clip!important;max-height:none!important}
  }
  html.cg-play .game-menu{inset:0!important}
  html.cg-play .menu-shell{max-height:98%!important}
  @media(max-height:390px){
   html.cg-play #stage>.in-game-top{min-height:37px!important}
   html.cg-play #stage>.playfield{width:min(100%,calc((100dvh - 130px)*10/7))!important;max-height:calc(100dvh - 130px)!important}
  }
`;

 document.head.appendChild(css);
 // Progress and warning now live in the existing board HUD.
}

// A tap is one action; dragging a finger over the board is not a tap.
let fingerTap=null;
c.addEventListener("pointerdown",e=>{
 if(e.pointerType==="touch"){
  if(e.isPrimary===false)return;
  fingerTap={id:e.pointerId,x:e.clientX,y:e.clientY};return;
 }
 if(e.button!==undefined&&e.button!==0)return;
 onClick(e);
});
c.addEventListener("pointerup",e=>{
 if(e.pointerType!=="touch"||!fingerTap||e.pointerId!==fingerTap.id)return;
 const dx=e.clientX-fingerTap.x,dy=e.clientY-fingerTap.y;
 fingerTap=null;
 if(dx*dx+dy*dy>196)return;
 onClick(e);
});
c.addEventListener("pointercancel",()=>{fingerTap=null});
c.addEventListener("pointermove",e=>{if(aimingYarn){const p=canvasTile(e);yarnPreview=yarnTarget(p)?p:null}});c.addEventListener("pointerleave",()=>{yarnPreview=null});window.addEventListener("keydown",e=>{if(e.key==="Escape"&&menuOpen){e.preventDefault();closeMenu();return}
 if(menuOpen)return;
 if(s?.outro){if(["Escape","Enter"," "].includes(e.key)){e.preventDefault();endOutro()}return}
 if(e.key==="Escape"&&s?.done&&!$("overlay").hidden){e.preventDefault();closeResult();return}
  if(e.key==="Escape"&&aimingYarn){e.preventDefault();setYarnAim(false);return}if(e.key==="."&&!["INPUT","TEXTAREA","SELECT"].includes(e.target?.tagName)){e.preventDefault();waitTurn();return}if((e.code==="Space"||e.key===" ")&&!["INPUT","TEXTAREA","SELECT","BUTTON"].includes(e.target?.tagName)){e.preventDefault();throwYarn();return}const k={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]}[e.key];if(k&&!["INPUT","TEXTAREA","SELECT"].includes(e.target?.tagName)){e.preventDefault();single(...k)}});

$("menuButton").onclick=()=>openMenu("rooms");
 $("achievementPocket").onclick=()=>openMenu("badges");
$("bonusQuick").onclick=()=>openMenu("rooms");
$("quickHelp").onclick=()=>openMenu("help");
$("menuClose").onclick=closeMenu;
$("gameMenu").addEventListener("pointerdown",e=>{if(e.target===$("gameMenu"))closeMenu()});
document.querySelectorAll("[data-game-tab]").forEach(el=>el.onclick=()=>setMenuTab(el.getAttribute("data-game-tab")));
$("wait").onclick=waitTurn;
$("restart").onclick=()=>{metric("game_retry");init(stage,daily)};
$("retryResult").onclick=()=>{metric("game_retry");init(stage,daily)};
$("nextResult").onclick=()=>{if(!s.winning)metric("game_retry");init(s.winning&&!daily?Math.min(7,stage+1):stage,daily)};
$("shareResult").onclick=share;
$("closeResult").onclick=closeResult;
 $("catUnlocks").onclick=e=>{
  const control=e.target.closest?.("[data-equip-cat]");if(!control)return;
  const i=Number(control.dataset.equipCat);
  if(!Number.isInteger(i)||i<0||i>=fur.length||allStars()<fur[i][3])return;
  save.cat=i;saveGame();renderNewCatUnlocks();audio("fish");
 };
$("tool")&&($("tool").onclick=throwYarn);
$("sound").onclick=()=>{window.MorrowwishAudio?.toggle?.();$("sound").textContent=tr(window.MorrowwishAudio?.isEnabled?.()?"soundOn":"soundOff")};
window.addEventListener("morrowwish-language-change",e=>{lang=e.detail.lang==="zh"?"zh":"en";translateUI();syncUI();refreshToasts();if(s.done)finishOverlayTranslate()});
function finishOverlayTranslate(){renderNewCatUnlocks();$("resultTitle").textContent=resultHeading();$("resultDesc").textContent=resultDescription();$("resultScore").textContent=resultLine();$("resultStarGuide").textContent=resultStarGuide();if($("resultUnlocks"))$("resultUnlocks").textContent=resultLoot();$("retryResult").textContent=tr("tryAgain");$("nextResult").textContent=nextResultLabel();$("shareResult").textContent=tr("share");$("closeResult").setAttribute("aria-label",lang==="zh"?"关闭结算":"Close results");$("closeResult").title=lang==="zh"?"关闭结算":"Close results"}
window.__PAWSIBLY_TEST__={getState:()=>s,move:single,choose:init,throwYarn,throwYarnTo,advanceYarnChase,isChasing:()=>yarnChaseTimer!==null,isAiming:()=>aimingYarn,rooms:ROOMS};
window.addEventListener("resize",fitCanvasPixels);
fitCanvasPixels();checkBadges(true);init(entryRoom,entryDaily);requestAnimationFrame(draw);
})();