/* Pawsibly Innocent! — original Morrow Wish cat stealth-puzzle game. No dependencies. */
(()=>{"use strict";
const W=10,H=7,T=84,NEED=3,$=id=>document.getElementById(id);
const ROOMS=[
{en:"The Sunny Lounge",zh:"阳光客厅",enSub:"Nobody suspects the little orange menace.",zhSub:"小橘猫，看起来一点也不可疑。",goal:29,patrol:[[6,4],[8,4],[8,2],[6,2]],rows:["..........","..F..S....","...V......",".C.....F..","...S..H...","....B..F..","...F.....E"]},
{en:"Kitchen Caper",zh:"厨房偷吃计划",enSub:"Someone left the fish unattended.",zhSub:"有人竟然把小鱼放在了桌上。",goal:30,patrol:[[6,1],[8,1],[8,4],[6,4]],rows:[".....F....","..S...H...",".C...V...F","...##.....","..F...S...","..B...F...",".........E"]},
{en:"The Laundry Incident",zh:"洗衣房事件",enSub:"There is no such thing as too much fluff.",zhSub:"毛毛越多，生活越精彩。",goal:32,patrol:[[7,2],[9,2],[9,5],[7,5]],rows:["....V...F.",".C..S.....",".....B.H..","..###.....",".F.....S..","....F.....","...F.....E"]},
{en:"A Very Loud Nap",zh:"午睡大骚动",enSub:"Do not disturb the cat. The cat will disturb you.",zhSub:"请勿打扰小猫。小猫会主动打扰你。",goal:32,patrol:[[5,2],[7,2],[7,5],[5,5]],rows:["...F......",".C...S...F","..S..H....",".....##...","..B..F....","...V...F..",".........E"]},
{en:"Library of Secrets",zh:"图书馆秘密",enSub:"Shhh. You didn't hear that crash.",zhSub:"嘘。刚刚什么都没碎。",goal:35,patrol:[[6,3],[8,3],[8,1],[6,1]],rows:["....F.....",".C.#......","...#...F..","..V...H...","...#..S...","...F...B..","......F..E"]},
{en:"The Great Plant Plot",zh:"盆栽大阴谋",enSub:"Everything looks better on the floor.",zhSub:"所有东西放在地上更好看。",goal:36,patrol:[[7,1],[9,1],[9,4],[7,4]],rows:["..F.......",".C.....H..","...SS..F..","..V.......",".....#....","..F..B....",".......F.E"]},
{en:"Midnight Snack Club",zh:"午夜零食俱乐部",enSub:"A snack tastes better when it's stolen.",zhSub:"偷来的小鱼总是格外香。",goal:37,patrol:[[6,4],[8,4],[8,1],[6,1]],rows:["....F...F.",".C..##....","......V...","..S...S...","....B.H...","...F......",".....F...E"]},
{en:"The Grand Alibi",zh:"终极喵喵大暴走",enSub:"The legend of the tiny furry troublemaker.",zhSub:"小小捣蛋猫，终于要成为传奇。",goal:39,patrol:[[8,2],[9,2],[9,5],[8,5]],rows:["...F....F.",".C..S.....","...V....H.","....##....","..F....B..","...S...F..",".........E"]}
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
const TX={
en:{startHint:"Tap a tile to walk",back:"← Morrow Wish",eyebrow:"A LITTLE CAT. A LOT OF TROUBLE.",subtitle:"Steal the snacks. Outsmart the human. Leave a little chaos.",missionLabel:"TODAY'S MISSION",snackLabel:"FISH ACQUIRED",scoreLabel:"SCORE",moveLabel:"STEPS",starLabel:"STARS",roomLabel:"CHOOSE A ROOM",closetLabel:"YOUR LITTLE TROUBLEMAKER",skinHint:"Earn 1–3 stars per room to unlock new cats.",retry:"↻ Retry",soundOn:"🔊 Sound effects: On",soundOff:"🔇 Sound effects: Off",rulesKicker:"HOW TO PLAY · 30 SECOND GUIDE",howTitle:"Three steps to a purrfect escape",howBody:"The human moves after every step. Pink tiles show their sight; red tiles are especially risky. Hide in boxes — you have three hearts.",ruleStep1Title:"1 · Tap to move",ruleStep1Text:"Tap the floor or use arrow keys.",ruleStep2Title:"2 · Steal three fish",ruleStep2Text:"Pink tiles show sight; boxes hide you.",ruleStep3Title:"3 · Escape through the pink flap",ruleStep3Text:"Reach the cat door with three fish to win.",ruleBonus:"🧶 Tap Toss yarn (or Space), then tap an open floor tile to choose where the yarn lands. Tap the button again to cancel.",tip:"<span><strong>①</strong> Tap floor to walk</span><span><strong>②</strong> Collect 3 fish</span><span><strong>③</strong> Reach pink cat flap</span>",mission:"Collect three fish and slip through the pink cat flap. Topple a vase to distract the human.",daily:"☼ Daily",room:"ROOM",dailyRoom:"DAILY CHAOS",closed:"Grab three fish first!",blocked:"Something is blocking the way!",caught:"Oops! The human spotted you!",last:"Last life! Be sneaky.",fish:"Fish acquired! Delicious.",ready:"The cat flap is open. Run for it!",vase:"CRASH! The human heard that.",box:"A cardboard box! The perfect hiding place.",hide:"The human can't see inside the box.",winTitle:"Purrfect escape!",win:"Fish stolen, chaos delivered. The human is absolutely baffled.",loseTitle:"Caught red-pawed!",lose:"A small setback for a very ambitious cat. Try a different route.",tryAgain:"Try again",nextRoom:"Next room →",again:"Play again →",share:"Share your chaos ♡",shared:"Challenge link copied!",shareText:"I escaped in Pawsibly Innocent! Can you steal three fish without getting caught?",locked:"Earn {n} stars to unlock",dailyName:"Daily House Remix",dailySub:"A familiar house with a fresh secret snack stash.",skinNames:["Marmalade","Mochi","Shadow","Peaches","Blueberry"]},
zh:{startHint:"点地板，小猫就会走",back:"← Morrow Wish 首页",eyebrow:"一只小猫，搞出天大的动静。",subtitle:"偷零食、躲主人，顺便把家里闹个天翻地覆。",missionLabel:"本关任务",snackLabel:"偷到的小鱼",scoreLabel:"得分",moveLabel:"步数",starLabel:"星星",roomLabel:"选择房间",closetLabel:"你的捣蛋小猫",skinHint:"每关可得 1–3 星，累计星星解锁新猫。",retry:"↻ 重玩",soundOn:"🔊 音效：开",soundOff:"🔇 音效：关",rulesKicker:"游戏规则 · 30 秒看懂",howTitle:"三步学会猫猫大捣蛋",howBody:"你每走一步，主人也会移动。粉色格是视野，红色格更危险；钻进纸箱就能躲起来。你有三颗心。",ruleStep1Title:"① 点击地板移动",ruleStep1Text:"点地板或按方向键，让小猫走过去。",ruleStep2Title:"② 偷到三条小鱼",ruleStep2Text:"避开粉色视野，躲进纸箱就安全。",ruleStep3Title:"③ 从粉色猫门逃走",ruleStep3Text:"带着三条小鱼走到猫门，就成功过关。",ruleBonus:"🧶 点击「扔毛球」（电脑可按空格），再点地图上的地板选择落点。再次点击按钮可取消。",tip:"<span><strong>①</strong> 点击地板移动</span><span><strong>②</strong> 收集 3 条小鱼</span><span><strong>③</strong> 走进粉色猫门</span>",mission:"偷到三条鱼，再从粉色猫门溜走。经过花瓶就能把它打翻，引开主人。",daily:"☼ 每日挑战",room:"房间",dailyRoom:"每日捣蛋",closed:"先偷够三条鱼！",blocked:"有东西挡住路啦！",caught:"糟糕，被主人抓到了！",last:"只剩一颗心了，轻手轻脚！",fish:"小鱼到手！好吃！",ready:"猫门打开了！快溜！",vase:"哐当！主人听见了。",box:"纸箱！躲猫猫的好地方。",hide:"主人看不见纸箱里的猫。",winTitle:"完美开溜！",win:"小鱼到手，家里一团乱，主人还没回过神。",loseTitle:"当场抓包！",lose:"捣蛋事业暂时受挫。换条路线再试一次！",tryAgain:"再试一次",nextRoom:"下一间 →",again:"再玩一局 →",share:"分享战绩 ♡",shared:"挑战链接已复制！",shareText:"我在《猫猫绝对无辜！》成功偷鱼逃脱！来看看你能不能骗过主人。",locked:"累计 {n} 星解锁",dailyName:"每日猫猫大捣蛋",dailySub:"熟悉的房间，小鱼藏在了新地方。",skinNames:["橘子糖","糯米","小黑","蜜桃","蓝莓"]}
};
const fur=[["#f5b46d","#ce8952","#fff1cc",0],["#f5eeec","#c5a8a6","#fff",3],["#575065","#373347","#b5a9c4",7],["#f1a8ab","#c77590","#ffdfdb",12],["#a8b4df","#7b8ab7","#e5e7fe",18]];
const c=$("board"),ctx=c.getContext("2d"),today=new Date().toISOString().slice(0,10),dpr=Math.min(2,window.devicePixelRatio||1);
c.width=840*dpr;c.height=588*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
let lang=window.MorrowwishI18n?.get?.()==="zh"?"zh":"en";
let save={unlocked:0,best:{},cat:0,souvenirs:{}};try{const s=JSON.parse(localStorage.getItem("pawsibly-innocent-save-v1")||"{}");if(s&&typeof s==="object"){save={...save,...s};save.best=s.best||{};save.souvenirs=s.souvenirs||{};}}catch{}
save.unlocked=Math.min(7,Math.max(0,Number(save.unlocked)||0));save.cat=Math.max(0,Math.min(4,Number(save.cat)||0));
const YARN_LEGEND={
en:{ready:"🧶 Tap Toss yarn (or Space), then tap a floor tile to aim. The human walks toward the sound.",empty:"🧶 Walk onto a pink yarn ball to pick it up, then use the purple button above the board.",legend:["🐟 Fish = collect 3","🧶 Yarn = lure human","📦 Box = hide","🚪 Pink flap = escape"],tool:"🧶 Toss yarn (Space)",need:"🧶 Find yarn first",vision:"Pink = visible to the human · Red = close danger · A box hides you",quickReady:"1. Tap Toss yarn.  2. Tap an open floor tile to throw there.",quickAim:"Tap the destination tile. The human follows the sound.",quickChase:"The human is already walking toward your yarn. Sneak past!",cancel:"✕ Cancel throw",aim:"🧶 Tap an open floor tile to choose the yarn landing spot (or cancel).",badTarget:"Choose an open tile the human can reach.",quickEmpty:"Pick up the pink yarn ball on the floor to enable this button."},
zh:{ready:"🧶 点击「扔毛球」（电脑可按空格），再点地板决定落点，主人会循声走过去。",empty:"🧶 先让小猫走到地板上的粉色毛线球，捡到后再点击上方的紫色按钮。",legend:["🐟 小鱼＝收集三条","🧶 毛线＝引开主人","📦 纸箱＝躲藏","🚪 粉色猫门＝逃走"],tool:"🧶 扔毛球（空格键）",need:"🧶 先捡毛球",vision:"粉色格＝主人能看见 · 红色格＝靠近危险 · 纸箱里安全",quickReady:"① 点击「扔毛球」 ② 点地板选择落点，引开主人。",quickAim:"点击想让毛球落下的空地板，主人会循声走过去。",quickChase:"主人已经循声赶过去了！快趁机偷鱼。",cancel:"✕ 取消投掷",aim:"🧶 点击地图上的空地板选择毛球落点（或取消）。",badTarget:"请选择主人能走到的空地板。",quickEmpty:"先走到地板上的粉色毛线球，捡起来才能扔。"}
};
const tr=k=>TX[lang][k]||k;
const EXTRA_WORDS={en:{yarn:"Yarn acquired — lure the human!",souvenir:"A secret keepsake! Finish the room to keep it.",milk:"A little milk. One heart restored!",light:"Lights off! Sneak through the shadows.",robot:"The robot vacuum bumped you!",noYarn:"Find a yarn ball first.",lured:"The human heard your yarn! Sneak away.",tool:"◉ Toss yarn",toolEmpty:"◉ Find yarn",bonus:"Secret keepsake",found:"Found",missing:"Not found",album:"Keepsakes",ability:["Starts with a yarn ball","Quieter paws: shorter sight range","Shadow stealth: extra cover in dim light","Vase master: longer distractions","Snack hunter: extra fish points"],finished:"Keepsake saved to your album!",vacuum:"The roaming vacuum is watching!",tip:"Pick up yarn and toss it to distract the human."},zh:{yarn:"拿到毛线球！可以引开主人了。",souvenir:"发现秘密纪念品！通关后就能收藏。",milk:"喝点牛奶，恢复一颗心！",light:"灯关了！趁着昏暗偷偷溜走。",robot:"哎呀！被扫地机器人撞到了！",noYarn:"先找到毛线球！",lured:"主人被毛线球吸引了，快溜！",tool:"◉ 扔毛线球",toolEmpty:"◉ 寻找毛线球",bonus:"秘密纪念品",found:"已找到",missing:"未找到",album:"猫咪收藏",ability:["开局自带一个毛线球","脚步轻：主人视野更短","暗影潜行：关灯后更难被发现","花瓶专家：引开主人更久","零食猎手：偷鱼分数更多"],finished:"纪念品已经收入猫咪收藏！",vacuum:"扫地机器人正在巡逻！",tip:"捡起毛线球，投出去引开主人。"}};
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
return{room,index,extras,scene:SCENES[index],yarnBall:P(extras.yarn),relic:P(extras.relic),light:P(extras.light),milk:P(extras.milk),vacuum:P(extras.robot),vacuumDir:1,itemsTaken:new Set(),yarn:save.cat===0?1:0,lightTurns:0,hasRelic:false,room,grid,cat:{...cat},start:{...cat},human:{...human},humanStart:{...human},door,fish,vases,boxes,got:0,taken:new Set(),broken:new Set(),lives:3,steps:0,score:0,patrol:0,noise:null,throwTrail:null,alert:0,lastSeen:null,started:false,done:false,winning:false,invincible:0,catFrom:{...cat},humanFrom:{...human},movedAt:0};}
function init(index=0,isDaily=false){stopYarnChase();if(movingTimer){clearInterval(movingTimer);movingTimer=null}route=[];fx=[];aimingYarn=false;yarnPreview=null;yarnTargets.clear();daily=isDaily;stage=index;s=readRoom();$("stage").classList.remove("yarn-aiming");if($("yarnAimBanner"))$("yarnAimBanner").hidden=true;$("overlay").hidden=true;$("toast").classList.remove("on");translateUI();syncUI();}
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
function syncUI(){$("fishCount").textContent=s.got+" / "+NEED;$("meterFill").style.width=100*s.got/NEED+"%";if($("tool")){$("tool").classList.toggle("aiming",aimingYarn);$("tool").textContent=aimingYarn?YARN_LEGEND[lang].cancel:s.yarn>0?YARN_LEGEND[lang].tool+" · "+s.yarn:YARN_LEGEND[lang].need;$("tool").disabled=s.yarn===0}if($("yarnExplain"))$("yarnExplain").textContent=YARN_LEGEND[lang][s.yarn>0?"ready":"empty"];if($("yarnQuickHint"))$("yarnQuickHint").textContent=YARN_LEGEND[lang][aimingYarn?"quickAim":s.noise&&yarnChaseTimer!==null?"quickChase":s.yarn>0?"quickReady":"quickEmpty"];if($("collection"))$("collection").textContent=Object.keys(save.souvenirs).filter(k=>save.souvenirs[k]).length+" / 8";$("score").textContent=s.score;$("moves").textContent=s.steps;$("starTotal").textContent=allStars();$("hearts").setAttribute("aria-label",lang==="zh"?"剩余 "+s.lives+" 颗心":s.lives+" hearts left");$("hearts").innerHTML=Array.from({length:3},(_,i)=>'<span class="'+(i>=s.lives?"empty":"")+'">♥</span>').join("");}
function neighbors(p){return[[1,0],[0,1],[-1,0],[0,-1]].map(([dx,dy])=>({x:p.x+dx,y:p.y+dy})).filter(q=>q.x>=0&&q.x<W&&q.y>=0&&q.y<H);}
function pass(p,human=false){if(!p||p.x<0||p.y<0||p.x>=W||p.y>=H)return false;const t=s.grid[p.y][p.x];if(t==="#"||t==="S")return false;if(human&&(t==="E"||s.boxes.some(b=>equal(b,p))))return false;return true}
function pathTo(from,to,human=false){if(equal(from,to))return[];const q=[from],seen=new Set([key(from)]),prev=new Map();for(let i=0;i<q.length;i++){const p=q[i];if(equal(p,to)){const result=[];let t=key(p);while(t!==key(from)){const next=prev.get(t);result.unshift({x:Number(t.split(",")[0]),y:Number(t.split(",")[1])});t=next}return result}for(const n of neighbors(p)){if(!pass(n,human)||seen.has(key(n)))continue;seen.add(key(n));prev.set(key(n),key(p));q.push(n)}}return[]}
const hidden=p=>s.boxes.some(b=>equal(b,p));
function visible(p=s.cat){if(hidden(p))return false;let a=s.human,b=p,d=Math.abs(a.x-b.x)+Math.abs(a.y-b.y);const sight=Math.max(1,3-(save.cat===1?1:0)-(s.lightTurns>0?(save.cat===2?2:1):0));if(d>sight)return false;if(d<=1)return true;if(a.x===b.x){for(let y=Math.min(a.y,b.y)+1;y<Math.max(a.y,b.y);y++)if(s.grid[y][a.x]==="#"||s.grid[y][a.x]==="S")return false;return true}if(a.y===b.y){for(let x=Math.min(a.x,b.x)+1;x<Math.max(a.x,b.x);x++)if(s.grid[a.y][x]==="#"||s.grid[a.y][x]==="S")return false;return true}return d<=2}
function throwStars(p,color){for(let i=0;i<9;i++)fx.push({x:(p.x+.5)*T,y:(p.y+.5)*T,dx:(Math.random()-.5)*4,dy:-Math.random()*3-1,life:30,col:color});}
function hurt(){if(s.invincible>0)return;stopYarnChase();s.lives--;s.score=Math.max(0,s.score-30);route=[];if(movingTimer){clearInterval(movingTimer);movingTimer=null;}audio("bad");popup("caught");throwStars(s.cat,"#fb7893");s.invincible=2;metric("cat_caught",{level:daily?9:stage+1,score:s.score});if(s.lives<=0){finish(false);return;}s.cat={...s.start};s.human={...s.humanStart};s.noise=null;s.alert=0;s.lastSeen=null;s.patrol=0;}
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
 s.noise={...p};s.throwTrail={from:{...s.cat},to:{...p},at:performance.now()};
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
 stopYarnChase();
 // Move the first tile on the same click/tap that throws the yarn.
 advanceYarnChase();
 if(s&&!s.done&&s.noise)yarnChaseTimer=setInterval(advanceYarnChase,240);
 syncUI();
}
function guardMove(){const h=s.human;let target=null;if(s.noise){target=s.noise;if(equal(h,target)||s.alert<=0){s.noise=null;s.alert=0}else s.alert--;}
if(!target&&visible()){target={...s.cat};s.lastSeen=target;s.alert=3;}
if(!target&&s.alert>0&&s.lastSeen){target=s.lastSeen;s.alert--;if(equal(h,target))s.lastSeen=null;}
if(!target){const stops=s.room.patrol;if(equal(h,{x:stops[s.patrol][0],y:stops[s.patrol][1]}))s.patrol=(s.patrol+1)%stops.length;target={x:stops[s.patrol][0],y:stops[s.patrol][1]}}
const steps=pathTo(h,target,true);s.humanFrom={...h};if(steps.length)s.human={...steps[0]};}
function moveTo(p){if(s.done||!pass(p)||Math.abs(p.x-s.cat.x)+Math.abs(p.y-s.cat.y)!==1)return;
if(!s.started){s.started=true;metric("game_start",{level:daily?9:stage+1})}
s.catFrom={...s.cat};s.cat={...p};s.movedAt=performance.now();s.steps++;s.invincible=Math.max(0,s.invincible-1);
const fishIndex=s.fish.findIndex(f=>equal(f,p)&&!s.taken.has(key(f)));if(fishIndex>=0){s.taken.add(key(p));s.got++;s.score+=save.cat===4?135:100;audio("fish");throwStars(p,"#ffd16e");popup(s.got>=NEED?"ready":"fish");metric("cat_fish",{level:daily?9:stage+1,score:s.score});}
const vase=s.vases.find(v=>equal(v,p));if(vase&&!s.broken.has(key(vase))){s.broken.add(key(vase));s.score+=35;s.noise={...p};s.alert=save.cat===3?11:6;s.lastSeen=null;audio("vase");throwStars(p,"#d4a8dc");popup("vase");metric("cat_vase",{level:daily?9:stage+1})}
if(s.yarnBall&&equal(p,s.yarnBall)&&!s.itemsTaken.has("yarn")){s.itemsTaken.add("yarn");s.yarn++;s.score+=25;popup("yarn");audio("yarn");metric("cat_yarn",{level:s.index+1})}
if(s.relic&&equal(p,s.relic)&&!s.itemsTaken.has("relic")){s.itemsTaken.add("relic");s.hasRelic=true;s.score+=90;popup("souvenir");audio("souvenir");throwStars(p,"#aeb0ee");metric("cat_souvenir",{level:s.index+1})}
if(s.milk&&equal(p,s.milk)&&!s.itemsTaken.has("milk")){s.itemsTaken.add("milk");s.lives=Math.min(3,s.lives+1);s.score+=25;popup("milk");audio("milk");throwStars(p,"#d6f5ef")}
if(s.light&&equal(p,s.light)&&!s.itemsTaken.has("light")){s.itemsTaken.add("light");s.lightTurns=8;s.score+=30;popup("light");audio("light");throwStars(p,"#fbd886")}
if(hidden(p))popup("hide");
if(equal(p,s.door)){if(s.got>=NEED){finish(true);return}else popup("closed")}
if(yarnChaseTimer===null)guardMove();s.lightTurns=Math.max(0,s.lightTurns-1);
if(s.vacuum&&s.steps%2===0){const a={x:s.vacuum.x+s.vacuumDir,y:s.vacuum.y};if(!pass(a)||equal(a,s.door)){s.vacuumDir*=-1}else{s.vacuum=a}}
if(equal(s.cat,s.human))hurt();
else if(s.vacuum&&equal(s.cat,s.vacuum)){popup("robot");hurt()}
else if(s.invincible===0&&Math.abs(s.cat.x-s.human.x)+Math.abs(s.cat.y-s.human.y)===1&&!hidden(s.cat)&&s.alert>0&&visible())hurt();
syncUI();}
function finish(win){if(s.done)return;stopYarnChase();s.done=true;s.winning=win;route=[];if(movingTimer){clearInterval(movingTimer);movingTimer=null;}
const stars=win?(s.lives===3&&s.steps<=s.room.goal?3:(s.lives>=2&&s.steps<=s.room.goal+12?2:1)):0;
if(win){s.score+=Math.max(80,300-s.steps*3)+s.lives*50;audio("win");if(!daily)save.unlocked=Math.max(save.unlocked,Math.min(7,stage+1));if(s.hasRelic){save.souvenirs[s.index]=true;s.score+=75;metric("cat_relic_saved",{level:s.index+1})}
const id=daily?"daily-"+today:"room-"+stage;const old=save.best[id]||{stars:0,score:0};save.best[id]={stars:Math.max(old.stars,stars),score:Math.max(old.score,s.score)};saveGame();metric("cat_level_won",{level:daily?9:stage+1,score:s.score});}
metric(win?"game_complete":"game_over",{level:daily?9:stage+1,score:s.score});syncUI();translateUI();
$("medal").textContent=win?"😼":"😿";$("stars").textContent=win?"★".repeat(stars)+"☆".repeat(3-stars):"☆☆☆";$("resultTitle").textContent=tr(win?"winTitle":"loseTitle");$("resultDesc").textContent=win?(daily?tr("win"):ROOM_REWARDS[lang][s.index]):tr("lose");
$("resultScore").textContent=(lang==="zh"?"得分 ":"Score ")+s.score+" · "+(lang==="zh"?"步数 ":"Steps ")+s.steps+(s.hasRelic?" · "+et("bonus")+" ✓":"");
$("retryResult").textContent=tr("tryAgain");$("nextResult").textContent=tr(win?"nextRoom":"tryAgain");$("shareResult").textContent=tr("share");$("overlay").hidden=false;}
function command(x,y){if(!s||s.done)return;if(x===s.cat.x&&y===s.cat.y)return;if(!pass({x,y})){popup("blocked");return;}route=pathTo(s.cat,{x,y});if(!route.length){popup("blocked");return}if(!movingTimer){movingTimer=setInterval(()=>{if(s.done||!route.length){clearInterval(movingTimer);movingTimer=null;return}const p=route.shift();moveTo(p);if(s.done||!route.length){clearInterval(movingTimer);movingTimer=null}},180)}}
function single(dx,dy){if(!s||s.done)return;route=[];if(movingTimer){clearInterval(movingTimer);movingTimer=null}const p={x:s.cat.x+dx,y:s.cat.y+dy};if(!pass(p)){popup("blocked");return}moveTo(p)}
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
function vacuumDraw(x,y,time){ellipse(x,y+18,30,10,"#73709b44");ellipse(x,y,26,22,"#988bbd");ellipse(x,y-5,20,15,"#ded7f2");shape(x-7,y-7,2.5,"#544964");shape(x+7,y-7,2.5,"#544964");stroke(x-7,y+2,x+7,y+2,"#9c7da7",2);shape(x+20,y-18,4,"#fa97a0")}
function roomDecor(time){const theme=s.scene,night=s.index===6||s.lightTurns>0;round(12,9,816,48,13,theme.wall);for(let i=0;i<8;i++){shape(38+i*106,20+Math.sin(time*.001+i)*3,2.8,"#fff9eeee")}
const motif={lounge:"☀",kitchen:"♡",laundry:"☁",bedroom:"☾",library:"✦",plants:"❀",night:"✧",final:"★"}[theme.type];
label(motif,810,43,"bold 29px system-ui","#fff8f5");
ctx.fillStyle=theme.rug+"77";ctx.beginPath();ctx.ellipse(415,330,190,110,-.14,0,Math.PI*2);ctx.fill();
if(night){round(0,0,840,588,0,"#6463a319");for(let i=0;i<12;i++){let x=30+i*67,y=110+(i*61)%440;shape(x,y,1.5+Math.sin(time*.002+i), "#fff9d1aa")}}
}
function draw(time){if(!s)return;const g=ctx.createLinearGradient(0,0,840,588);g.addColorStop(0,s.scene.wall);g.addColorStop(1,s.scene.floor[1]);ctx.fillStyle=g;ctx.fillRect(0,0,840,588);
for(let y=0;y<H;y++)for(let x=0;x<W;x++){let px=x*T,py=y*T,alt=(x+y)%2;round(px+2,py+2,T-4,T-4,10,s.scene.floor[alt?0:1]);round(px+7,py+7,T-14,T-14,7,s.scene.floor[alt?1:0]);if((x*11+y*13)%9===0){shape(px+15,py+17,2,"#efd9c8");shape(px+22,py+25,1.4,"#efd9c8")}if(s.grid[y][x]==="#"){round(px+4,py+2,T-8,T-8,12,"#9d97b0");round(px+9,py+5,T-18,T-22,10,"#cac1d4");}if(s.grid[y][x]==="S")sofaDraw(px+T/2,py+T/2)}
roomDecor(time);
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
if(s.vacuum)vacuumDraw((s.vacuum.x+.5)*T,(s.vacuum.y+.5)*T,time);
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
if(s.alert>0){ellipse((s.human.x+.5)*T,(s.human.y+.5)*T+7,37,29,"#fa999744");label("!",(s.human.x+.5)*T+25,(s.human.y+.5)*T-33,"bold 26px Fredoka","#e76e7a")}
const hu=s.human,ca=s.cat;humanDraw((hu.x+.5)*T,(hu.y+.5)*T+10,time);if(!hidden(ca)){catDraw((ca.x+.5)*T,(ca.y+.5)*T+9+Math.sin(time*.007)*2,time)}else{catDraw((ca.x+.5)*T,(ca.y+.5)*T+17,time);round(ca.x*T+15,ca.y*T+45,54,27,5,"#e2b380");label("♡",(ca.x+.5)*T,ca.y*T+67,"19px system-ui","#c18395")}
if(!s.started&&!s.done){const x=Math.min(680,Math.max(6,s.cat.x*T-20)),y=Math.max(65,s.cat.y*T-99);round(x,y,208,38,14,"#fffdf5ef");label(tr("startHint"),x+104,y+25,"bold 15px Nunito, system-ui","#8a5773");const next={x:s.cat.x+1,y:s.cat.y};if(pass(next)){ctx.strokeStyle="#d887ac";ctx.lineWidth=4;ctx.setLineDash([5,7]);ctx.beginPath();ctx.arc((next.x+.5)*T,(next.y+.5)*T,25+Math.sin(time*.005)*2,0,Math.PI*2);ctx.stroke();ctx.setLineDash([])}}
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
 window.MorrowwishSocialShare.open({
  title:lang==="zh"?'猫猫绝对无辜！':'Pawsibly Innocent!',
  message,score,language:lang,
  url:'https://morrowwish.vercel.app/pawsibly-innocent/',
  meta:{game:'pawsibly-innocent',level:room}
 });
}

c.addEventListener("pointerdown",onClick);c.addEventListener("pointermove",e=>{if(aimingYarn){const p=canvasTile(e);yarnPreview=yarnTarget(p)?p:null}});c.addEventListener("pointerleave",()=>{yarnPreview=null});window.addEventListener("keydown",e=>{if(e.key==="Escape"&&aimingYarn){e.preventDefault();setYarnAim(false);return}if((e.code==="Space"||e.key===" ")&&!["INPUT","TEXTAREA","SELECT","BUTTON"].includes(e.target?.tagName)){e.preventDefault();throwYarn();return}const k={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]}[e.key];if(k&&!["INPUT","TEXTAREA","SELECT"].includes(e.target?.tagName)){e.preventDefault();single(...k)}});

$("restart").onclick=()=>{metric("game_retry");init(stage,daily)};
$("retryResult").onclick=()=>{metric("game_retry");init(stage,daily)};
$("nextResult").onclick=()=>{if(!s.winning)metric("game_retry");init(s.winning&&!daily?Math.min(7,stage+1):stage,daily)};
$("shareResult").onclick=share;
$("tool")&&($("tool").onclick=throwYarn);
$("sound").onclick=()=>{window.MorrowwishAudio?.toggle?.();$("sound").textContent=tr(window.MorrowwishAudio?.isEnabled?.()?"soundOn":"soundOff")};
window.addEventListener("morrowwish-language-change",e=>{lang=e.detail.lang==="zh"?"zh":"en";translateUI();if(s.done)finishOverlayTranslate()});
function finishOverlayTranslate(){$("resultTitle").textContent=tr(s.winning?"winTitle":"loseTitle");$("resultDesc").textContent=s.winning?(daily?tr("win"):ROOM_REWARDS[lang][s.index]):tr("lose");$("resultScore").textContent=(lang==="zh"?"得分 ":"Score ")+s.score+" · "+(lang==="zh"?"步数 ":"Steps ")+s.steps+(s.hasRelic?" · "+et("bonus")+" ✓":"");$("retryResult").textContent=tr("tryAgain");$("nextResult").textContent=tr(s.winning?"nextRoom":"tryAgain");$("shareResult").textContent=tr("share")}
window.__PAWSIBLY_TEST__={getState:()=>s,move:single,choose:init,throwYarn,throwYarnTo,advanceYarnChase,isChasing:()=>yarnChaseTimer!==null,isAiming:()=>aimingYarn,rooms:ROOMS};
init(0,false);requestAnimationFrame(draw);
})();