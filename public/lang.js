/* Morrow Wish unified language switch. No external translation requests or tracking. */
(()=>{"use strict";
const KEY="morrowwish.language";
let lang=(()=>{let explicit=null;
 try{const q=new URLSearchParams(location.search).get("lang");if(q==="zh"||q==="en")explicit=q;}catch(_){}
 if(explicit){try{localStorage.setItem(KEY,explicit)}catch(_){}return explicit;}
 try{const saved=localStorage.getItem(KEY);if(saved==="zh"||saved==="en")return saved;}catch(_){}
 return (navigator.language||"en").toLowerCase().startsWith("zh")?"zh":"en";
})();
const words={
"an indie game studio":"独立游戏工作室",
"Meet our CEO (honorary title)":"认识一下我们的 CEO（荣誉职位）",
"Chief Entertainment Officer. Expert napper. Occasionally approves new games.":"首席娱乐官。睡觉是强项，偶尔批准新游戏上线。",
"Privacy":"隐私说明",
"Contact":"联系我们",
"On itch.io":"itch.io 游戏主页",
"Back to games":"返回游戏主页",
"We make playful worlds about imagination, freedom and delightful surprises. No pressure, no endless menus—just a little joy to discover.":"我们创造充满想象、自由与惊喜的游戏世界。不必精通任何技巧，也无需面对冗长的菜单，只要来发现一点小小的快乐。",
"60-SECOND CHALLENGE":"60 秒挑战",
"Match food to hungry fish. Keep the water clean!":"给小鱼喂对食物，保持水质清洁！",
"Feed the fish":"去喂小鱼",
"Feed the fish ":"去喂小鱼 ",
"✷ Play instantly":"✷ 即点即玩",
"♡ Follow your curiosity":"♡ 跟随好奇心",
"☼ Come back whenever":"☼ 随时回来玩",
"Independent games for curious people.":"为好奇的人制作独立游戏。",
"Play our worlds":"探索游戏世界",
"03 / THE WHOLE IDEA":"03 / 我们的想法",
"Play Flip Dash":"开始玩翻转冲刺",
"Play Parcel Panic":"开始玩包裹分拣",
"Play Pocket Aquarium":"开始玩口袋水族馆",
"Flip Dash":"翻转冲刺",
"Parcel Panic":"包裹分拣",
"Pocket Aquarium":"口袋水族馆",
"Pawsibly":"猫猫",
"Innocent!":"绝对无辜！",

"Morrow Wish home":"Morrow Wish 首页",
"Play Pawsibly Innocent!":"开始玩猫猫大捣蛋","A mischievous orange cartoon cat in a cozy room":"温馨客厅里的淘气橘猫","Our worlds":"我们的世界","Tiny games":"小游戏","About":"关于","Find your next adventure":"寻找下一段冒险",
"THE HOME OF NOT-SO-ORDINARY DAYS":"让平凡的日子有点不一样",
"Steal three fish as a mischievous cat.":"化身捣蛋小猫偷三条鱼，",
"Befriend a yard full of cats.":"和满院子的猫咪成为朋友，",
"Explore a life you never lived.":"体验一段从未活过的人生，",
"Or build a town where everyone is free.":"或建造人人自由的小镇。",
"Steal three fish as a mischievous cat. Explore a life you never lived. Or build a town where everyone is free.":"化身捣蛋小猫偷三条鱼，体验一段从未活过的人生，或建造人人自由的小镇。","Pick a world and jump right in.":"选个世界，马上开玩。","Be a sneaky cat, live a completely different life, or build a town with no work. Three worlds, three kinds of fun.":"当一只偷偷摸摸的小猫，体验另一种人生，或建造无需工作的自由小镇。三个世界，三种乐趣。",
"Be a sneaky cat, raise a whole yard of them, live a completely different life, or build a town with no work. Four worlds, four kinds of fun.":"化身淘气小猫偷鱼捣蛋，养育一院子猫咪，体验另一段人生，或建造没有工作的自由小镇。四个世界，四种乐趣。",
"Raise a yard of cats and explore together. Steal three fish without getting caught. Build a town beyond work, or live another life. Which world will you play first?":"和满院子的猫咪一起成长、探索和战斗，化身小猫偷走三条鱼，建造人人自由的小镇，或体验一段从未活过的人生。先玩哪个？","SMALL PAWS. BIG PLANS.":"小爪子，大计划","Three fish to steal. One human to fool.":"三条小鱼要偷，一个主人要骗。","Throw yarn to distract them, then slip through the pink cat flap!":"扔毛线球引开主人，带着小鱼从粉色猫门成功开溜！","Sneak & escape":"潜行与逃脱","8 playful rooms":"八间捣蛋房间","Daily challenge":"每日挑战","Steal the fish":"偷鱼开溜",
"Little games.":"小小游戏。","Big surprises":"大大惊喜","Try another life. Build a free-spirited town. Or sneak around as a very mischievous cat.":"体验另一种人生，建造自由的小镇，或者化身淘气猫猫，在家里搞点小动作。","Every click leads somewhere unexpected.":"每次点击，都有意想不到的乐趣。","02 / FOUR LITTLE ADVENTURES":"02 / 四场小小冒险","Four little adventures, from lightning-fast challenges to the cutest kind of trouble. Pick one and play.":"四款随时开玩的小游戏：挑战手速，也可以当一只爱捣蛋的小猫。","COZY CAT CHAOS":"猫猫捣蛋计划","Steal three fish. Outsmart the human. Make adorable trouble.":"偷三条小鱼，骗过主人，制造一点可爱的小混乱。","Let the mischief begin":"开启捣蛋计划","Big daydreams":"大大幻想","Some days you need a whole new world. Some days you just need five minutes.":"有时你需要一个全新的世界，有时只要五分钟。",
"Come play a different kind of what-if.":"来体验不一样的「如果」。",
"✷ Free to play":"✷ 免费游玩","✷ No account needed":"✷ 无需注册","✷ Made with curiosity":"✷ 用好奇心制作",
"01 / THREE WORLDS TO GET LOST IN":"01 / 三个值得沉浸的世界","Three worlds, three ways to play: live another life, build a town where everyone is free, or become a mischievous cat.":"三种玩法，三个世界：体验另一种人生，建造自由的小镇，或者变成一只淘气的小猫。","02 / THREE QUICK ESCAPES":"02 / 三场短暂的逃离","Three quick challenges for your five-minute break. Pick one and play.":"三款随时开玩的短局挑战。选一个，马上开始。","THE ART OF GETTING AWAY WITH IT":"猫猫的无辜哲学","Eight cozy rooms. One impossibly innocent cat.":"八间温馨房间，一只看起来绝对无辜的小猫。","Steal snacks, outsmart humans and leave adorable chaos behind.":"偷零食、骗过主人，制造一点可爱的小混乱。","Cat stealth adventure":"猫猫潜行冒险","Explore & collect":"探索与收集","Daily remix":"每日新挑战","Begin the mischief":"开启捣蛋之旅","who, me?":"不是我呀",
"A YARD FULL OF LITTLE SOULMATES":"满院子的小灵魂伴侣","Raise a yard of cats, find wild ones in the grass, then":"养一院子的猫，在草丛里发现野猫，然后",
"Give your cats a home, win their trust and meet wild companions.":"给猫咪们安个家，慢慢赢得它们的信任，再去野外结识新伙伴。","capture them in a real-time arena and build bonds that never break.":"在即时竞技场里收服它们，建立永不破裂的纽带。",
"Raise, explore and battle together.":"一起养成、探索和并肩战斗。","Raise & collect":"养成与收集","Real-time battles":"即时战斗","Evolve & bond":"进化与羁绊","Meet your cats":"认识你的猫猫","best friends":"好朋友","Four worlds, four ways to play: live another life, build a town where everyone is free, cause mischief as a sneaky cat, or raise a whole yard of them.":"四个世界，四种玩法：体验另一种人生，建造人人自由的小镇，化身淘气猫猫搞点小动作，或者养一整院子的猫。","01 / FOUR WORLDS TO GET LOST IN":"01 / 四个值得沉浸的世界","An adorable ginger cat in a pastel room beside stolen fish, yarn and toppled flowers":"粉嫩房间里的淘气橘猫，旁边有小鱼、毛线球和倒下的花瓶。","We make playful worlds full of imagination, freedom, happy accidents and stories worth coming back to.":"我们创造充满想象、自由与惊喜的游戏世界，还有让人愿意再次走进的故事。","01 / TWO WORLDS WORTH GETTING LOST IN":"01 / 两个值得沉浸的世界",
"Where should we go ":"今天想去","today?":"哪里？",
"CREATE YOUR OWN TOMORROW":"创造自己的明天","THE ROADS YOU DIDN'T TAKE":"未曾走过的路",
"AI took all the jobs. Everyone has time to do anything.":"AI 接管了所有工作。人人终于可以自由安排时间。",
"What would you build a life around?":"自由之后，你想如何生活？",
"Cozy strategy":"治愈系策略","Make a meaningful town":"打造有意义的小镇","Build your little world":"建造自己的小世界",
"your rules":"你的规则","your town ✷":"你的小镇 ✷",
"A bookshop by the sea? A new beginning in Paris?":"海边书店？巴黎的新开始？",
"What would you build with that freedom?":"拥有这样的自由，你会建造怎样的小镇？",
"AI does the work. People finally have time to live.":"AI 包揽了工作，人们终于有时间好好生活。",
"Choose another life and see what happens next.":"选择另一种人生，看看故事会如何展开。",
"Four parallel lives":"四种平行人生","Choices that matter":"由选择改变结局",
"Live another life":"体验另一种人生","what if...":"如果当初……",
"02 / THREE SMALL ESCAPES":"02 / 三场短暂的逃离",
"Just five ":"再玩五","more":"分","minutes?":"钟？",
"Three tiny games, each with its own little obsession. Pick one and play.":"三款各有特色的小游戏。选一款，马上开始。",
"ONE-TAP ACTION":"一键动作","SPEED & SORTING":"反应与分类","CALM & COLLECT":"休闲收集",
"Flip Dash":"翻转冲刺","Parcel Panic":"快递大作战","Pocket Aquarium":"口袋水族馆",
"Flip gravity. Dodge the spikes. Beat your best run.":"翻转重力，躲过尖刺，不断刷新纪录。",
"Match the parcels before the docks overflow.":"在货物堆满之前，把包裹送到对应位置。",
"Feed your fish, gather pearls, grow an underwater world.":"喂养小鱼、收集珍珠，慢慢打造水下世界。",
"Let's dash ":"开始冲刺 ","Start sorting ":"开始分类 ","Visit the aquarium ":"进入水族馆 ",
"Find your next world":"寻找下一个世界",
"MORROW WISH · HOME":"MORROW WISH · 首页","MORROW WISH · HOME":"MORROW WISH · 首页",
"READY TO PLAY":"准备开玩","PLAY NOW":"开始游戏","Ready":"就绪","SCORE":"得分","BEST":"最高分","How to play":"怎么玩","Restart":"重新开始","RESUME":"继续游戏",
"HOW TO PLAY":"玩法说明","GAME OVER":"游戏结束","LEVEL COMPLETE":"关卡完成",
"PLAY AGAIN":"再玩一次","NEXT LEVEL":"下一关","RETRY":"重试","RESTART":"重新开始",
"NEXT":"下一步","BACK":"返回","SHARE":"分享","COPIED!":"已复制！","Challenge copied!":"挑战链接已复制！",
"TODAY'S CHALLENGE":"今日挑战","↻ RETRY INSTANTLY":"↻ 立刻重试",
"BEAT YOUR PERSONAL BEST":"突破个人纪录","FRIEND BEATEN!":"超过好友！",
"EXPERIMENTAL GAME":"实验小游戏","SHARE YOUR SCORE":"分享成绩",
"DAILY UTC SEED: ":"今日随机种子：","seconds":"秒","seconds.":"秒。",
"One-button Runner":"一键跑酷","Reflex / Sorting":"反应与分类","Idle Collection":"休闲收集",
"Flip gravity. Dodge danger. Beat the daily challenge.":"翻转重力，躲开危险，挑战今日纪录。",
"Tap or press Space to flip gravity and dodge the pink hazards.":"点击或按空格键翻转重力，躲开粉色障碍。",
"Drag the parcel into the right dock before it falls.":"在包裹掉落前，把它拖到对应颜色的货位。",
"Drag a package to its matching colored dock.":"将包裹拖到同颜色的货位。",
"Feed fish and build your little ocean world.":"给鱼儿喂食，建造自己的海底小天地。",
"Click water to feed, earn pearls, and buy fish.":"点击水面投喂，收集珍珠，购买新鱼。",
"Tap / Space to flip gravity":"点击或按空格翻转重力","TAP TO FLIP":"点击翻转",
"TAP TO FLIP GRAVITY":"点击翻转重力","TAP OR SPACE TO FLIP":"点击或按空格翻转",
"AVOID PINK BLOCKS":"躲开粉色障碍","KEEP MOVING":"继续前进",
"5 chances • drag boxes to the same color dock":"你有 5 次机会，把包裹拖到同色货位",
"DRAG PACKAGES INTO MATCHING DOCKS":"把包裹拖到对应颜色的货位",
"Sort accurately to build a score multiplier":"连续正确分类可提高得分倍率",
"MATCH THE BOX TO ITS DOCK":"将包裹放入对应货位","GRAB • DRAG • RELEASE":"抓住 · 拖动 · 放开",
"CYAN":"青色","GOLD":"金色","PINK":"粉色","DOCK ":"货位 ","DROP ZONE":"投递区",
"STREAK ":"连击 "," LIVES":" 次机会"," DELIVERED":" 已投递","PARCELS":"包裹",
"Pearls: ":"珍珠：","Fish: ":"鱼儿：","Income: ":"收入：",
"NEW FISH":"新鱼","BETTER FILTER":"升级过滤器"," pearls":" 颗珍珠",
"Your adventure":"你的冒险","Your journey":"你的旅程",
"NO MORE MONDAYS":"再也没有星期一","No More Mondays":"再也没有星期一",
"BUILD":"建造","PLAY":"游玩","CONTINUE":"继续","CONTINUE →":"继续 →",
"Week ":"第 ","WEEK":"周","WEEK ":"第 ","NEXT WEEK":"下一周","NEW GAME":"新游戏",
"Start over":"重新开始","Start over?":"重新开始？","Game rules":"游戏规则",
"EXPLORE ELSEWHERE →":"探索《Elsewhere》→","A MORROW WISH GAME":"MORROW WISH 出品",
"FREE TO PLAY":"免费游玩","NO SIGN-UP":"无需注册","YOUR CHOICES MATTER":"你的选择很重要",
"All lives":"所有人生","Explore all worlds":"探索所有世界","Enter your first life":"开启第一段人生",
"Somewhere,":"在某个地方，","another you":"另一个你","is living.":"正在生活。",
"FOR ALL THE ROADS NOT TAKEN":"献给所有未曾走过的路",
"A thousand possible tomorrows":"一千种可能的明天","ONE LIFE IS NEVER THE WHOLE STORY":"一种人生，远不是故事的全部",
"A STORY THAT FEELS LIKE YOURS":"属于你的故事","What are you looking for?":"你想寻找什么？",
"Choose a reading lens. Later chapters will reflect your preference, without needing an account.":"选择你的阅读偏好，后续章节会随之改变。无需登录。",
"Discover":"探索","Connect":"联结","Rest":"休息",
"THE DOORS ARE OPEN":"通往另一种生活的门已打开",
"Where will you":"你想从","begin?":"哪里开始？","FOUR LIVES · EIGHT SCENES EACH":"四种人生 · 每段八个场景",
"A SMALL EXPERIMENT IN BEING HUMAN":"关于如何生活的小实验",
"You don't have to":"你不必","get life right.":"每次都做对选择。",
"Choose your world":"选择你的世界","Follow your instincts":"跟随你的直觉",
"Discover who you become":"看看自己会成为谁","Listen":"朗读","Share":"分享",
"THIS IS YOUR OTHER LIFE":"这是你的另一种人生","YOUR JOURNEY":"你走过的旅程",
"WHAT GUIDES YOU":"是什么指引着你",
"Your story stays in this browser. No account needed.":"故事保存在当前浏览器中，无需账号。",
"Start this life again":"重新开始这一生","AN EXPERIMENT IN UNLIVED LIVES":"未曾体验的人生实验",
"PART OF THE MORROW WISH FAMILY":"MORROW WISH 工作室作品",
"ABOUT THIS EXPERIMENT":"关于这个实验","A NOTE FROM ELSEWHERE":"来自《平行人生》的一封信",
"A little space to":"留一点空间","imagine differently.":"去想象不一样的生活。",
"THANK YOU FOR BEING HERE":"感谢你来到这里",
"Shape what happens next":"你的选择决定接下来的故事",
"Curiosity":"好奇","Connection":"联结","Freedom":"自由",
"LIFE COMPLETED":"人生篇章完成","8 CINEMATIC SCENES":"八幕电影般的场景",
"See how your life ends":"查看你的结局","Continue your story":"继续故事",
"Scene ":"场景 ","SCENE ":"场景 ",
"A FRIEND":"一位朋友","Thank you for sharing your thoughts.":"感谢分享你的想法。",
"Invitation copied — share it with someone curious.":"邀请链接已复制，发给感兴趣的朋友吧。",
"Read-aloud is not available in this browser.":"你的浏览器不支持朗读。",
"Start over? Your choices and ending for this life will be replaced.":"重新开始？这一段人生的选择与结局会被覆盖。",
"The Greenhouse That Stayed":"留下的温室","The Road Beyond Tuesday":"星期二以外的路",
"The Bookshop of Open Doors":"敞开大门的书店","Postcards Beyond the Harbor":"港湾彼岸的明信片",
"The Cinema of Second Chances":"第二次机会电影院","The City of Little Screens":"小银幕之城",
"The Lantern in the Snow":"雪地里的灯","The Path After Winter":"冬日之后的路",
"The future is yours.":"未来由你决定。",
"3 small games":"三款小游戏"
};
const dynamic=[
[/^You reached (\d+(?:\.\d+)?) seconds\. Learn the pattern, then beat it\.$/,"你坚持了 $1 秒。熟悉节奏，再挑战纪录！"],
[/^You survived (\d+(?:\.\d+)?) seconds\.$/,"你坚持了 $1 秒。"],
[/^You sorted (\d+) parcels\. Chase a bigger streak\.$/,"你成功分类了 $1 个包裹。挑战更长连击！"],
[/^The delivery docks overflowed\. Deliveries: (\d+)$/,"货位堆满了，本次成功投递 $1 件。"],
[/^Lives: (\d+)  \|  Streak: (\d+)  \|  Delivered: (\d+)$/,"机会：$1  |  连击：$2  |  已投递：$3"],
[/^(\d+) points?$/,"$1 分"],[/^(\d+) seconds?$/,"$1 秒"],
[/^Week (\d+)$/,"第 $1 周"],[/^WEEK (\d+)$/,"第 $1 周"],
[/^SCENE (\d+)$/,"场景 $1"],[/^Scene (\d+)$/,"场景 $1"],
[/^LEVEL (\d+)$/,"第 $1 关"],[/^(\d+) POINTS$/,"$1 分"]
];
function translateText(s){if(lang!=="zh"||typeof s!=="string")return s;const trimmed=s.trim();if(!trimmed)return s;const lookup=Object.prototype.hasOwnProperty.call(words,trimmed)?words[trimmed]:window.MORROW_ZH_STORIES?.[trimmed];let result=lookup;if(result==null){for(const [rx,to] of [...(window.MORROW_ZH_DYNAMIC||[]),...dynamic]){if(rx.test(trimmed)){result=trimmed.replace(rx,to);break;}}}if(result==null)return s;return s.slice(0,s.indexOf(trimmed))+result+s.slice(s.indexOf(trimmed)+trimmed.length);}
const originals=new WeakMap(), rendered=new WeakMap(),attrs=new WeakMap();
const skip=new Set(["SCRIPT","STYLE","NOSCRIPT","TEXTAREA","CODE","PRE"]);
function translateNode(n){
 if(n.nodeType===3){if(!n.parentElement||skip.has(n.parentElement.tagName))return;let origin=originals.get(n);const prev=rendered.get(n);if(origin===undefined||(n.nodeValue!==prev&&n.nodeValue!==origin)){origin=n.nodeValue;originals.set(n,origin);}
 const next=lang==="zh"?translateText(origin):origin;if(n.nodeValue!==next)n.nodeValue=next;rendered.set(n,next);
 }else if(n.nodeType===1){
  if(skip.has(n.tagName))return;
  for(const a of ["title","aria-label","placeholder","data-instructions"]){if(!n.hasAttribute(a))continue;let saved=attrs.get(n)||{};let current=n.getAttribute(a);if(saved[a]===undefined||(current!==saved[a].last&&current!==saved[a].original))saved[a]={original:current,last:current};let next=lang==="zh"?translateText(saved[a].original):saved[a].original;if(next!==current)n.setAttribute(a,next);saved[a].last=next;attrs.set(n,saved);}
 }
}
let observer, busy=false;
function process(root){if(!root)return;translateNode(root);let walker=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);while(walker.nextNode())translateNode(walker.currentNode);}
function render(){if(!document.body)return;busy=true;observer?.disconnect();process(document.body);document.documentElement.lang=lang==="zh"?"zh-CN":"en";const control=document.getElementById("mw-language");if(control){control.setAttribute("aria-label",lang==="zh"?"Language / 语言":"Language / 语言");control.innerHTML=lang==="zh"?'<span class="mw-language-active">中文</span><span>EN</span>':'<span>中文</span><span class="mw-language-active">EN</span>';}
 if(document.title){let dt=originals.get(document)||document.title;originals.set(document,dt);if(lang==="zh"){document.title=dt.replace(" — Free Browser Game"," — 免费网页游戏").replace(" | Morrow Wish"," | Morrow Wish");}else document.title=dt;}
 observer?.observe(document.body,{childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:["title","aria-label","placeholder","data-instructions"]});busy=false;
}
function set(next){if(next!=="zh"&&next!=="en")return;lang=next;
 try{localStorage.setItem(KEY,lang)}catch(_){}
 try{const url=new URL(location.href);url.searchParams.set("lang",lang);history.replaceState(history.state,"",url.pathname+url.search+url.hash)}catch(_){}
 render();window.dispatchEvent(new CustomEvent("morrowwish-language-change",{detail:{lang}}));}
function mount(){
 if(!document.body||document.getElementById("mw-language"))return;
 const style=document.createElement("style");style.textContent='.mw-language-switch{display:inline-flex;align-items:center;gap:1px;border:1px solid #aaa6;border-radius:999px;padding:3px;background:#fffdf7e8;color:#293043;font:600 12px system-ui,sans-serif;cursor:pointer;white-space:nowrap;box-shadow:0 2px 12px #0001}.mw-language-switch span{padding:5px 7px;border-radius:999px}.mw-language-active{color:white;background:#394d60}.mw-language-float{position:fixed;top:12px;right:12px;z-index:2147483000}@media(max-width:700px){.mw-language-float{top:auto;bottom:12px;right:12px}}';document.head.appendChild(style);
 const b=document.createElement("button");b.id="mw-language";b.className="mw-language-switch";b.type="button";b.title="中文 / English";b.onclick=()=>set(lang==="zh"?"en":"zh");
 const holder=document.querySelector('.nav-row')||document.querySelector('.game-top .scoreboard')||document.querySelector('.arcade-return')||document.querySelector('.topbar')||document.querySelector('.site-header');
 if(holder){holder.appendChild(b);}else{b.classList.add("mw-language-float");document.body.appendChild(b);}
 observer=new MutationObserver((records)=>{if(busy)return;busy=true;observer.disconnect();for(const rec of records){if(rec.type==="characterData")translateNode(rec.target);else if(rec.type==="attributes")translateNode(rec.target);else for(const node of rec.addedNodes)if(node!==b)process(node);}observer.observe(document.body,{childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:["title","aria-label","placeholder","data-instructions"]});busy=false;});
 render();
}
window.MorrowwishI18n={get:()=>lang,set,t:translateText,words};
if(window.CanvasRenderingContext2D){for(const key of ["fillText","strokeText"]){const old=CanvasRenderingContext2D.prototype[key];if(old&&!old.__mw){const fn=function(text,...args){return old.call(this,translateText(String(text)),...args)};fn.__mw=true;CanvasRenderingContext2D.prototype[key]=fn;}}}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})();
