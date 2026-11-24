/* Tiny Town: Wish Cascade v4 — bilingual, no dependencies */
(()=>{
'use strict';
const $=id=>document.getElementById(id),HOME=[0,2,4,20,24], CENTER=12;
const HOME_POSITIONS=[...HOME];
const LEGENDARY_RULES=[
 {id:'star',day:3,wonder:55,combos:0,epics:0},
 {id:'night',day:4,wonder:115,combos:1,epics:0},
 {id:'tower',day:5,wonder:180,combos:3,epics:0},
 {id:'flight',day:6,wonder:290,combos:5,epics:2}
];
const LEGENDARY_WISHES=LEGENDARY_RULES.map(rule=>rule.id);
const LEGENDARY_POWERS={
 star:{wonder:30,peace:2,mood:[3],boost:2,scene:'stars',theme:'sky',en:'The whole town gathers under a dazzling starry sky. Nora cheers up!',zh:'全城一起看流星雨，Nora 的心情大幅提升！'},
 night:{wonder:35,peace:2,mood:[1,4],boost:3,scene:'festival',theme:'party',en:'An all-night festival lights up the town. Leo and Kai are delighted!',zh:'整条街变成不打烊的夜市，Leo 和 Kai 开心极了！'},
 tower:{wonder:45,peace:3,mood:'all',boost:1,scene:'train',theme:'sky',en:'The town floats higher. Every resident feels a little lighter!',zh:'小镇飘向云端，全体居民心情 +1！'},
 flight:{wonder:65,peace:3,mood:'all',boost:2,scene:'train',theme:'sky',en:'Everyone takes flight, and a special sky-city ending awaits!',zh:'全体居民飞上天空，获得专属的「天空自由城」结局！'}
};

function legendaryRule(id){return LEGENDARY_RULES.find(rule=>rule.id===id);}
function rareUnlocked(id){return !!(S&&S.legendaryUnlocked.includes(id));}
function nextLegendaryRule(){return LEGENDARY_RULES.find(rule=>!rareUnlocked(rule.id))||null;}
function legendaryReady(rule){return S.day>=rule.day&&S.wonder>=rule.wonder&&S.found.length>=rule.combos&&S.legends.length>=rule.epics;}
function unlockNextLegendary(){
 if(!S.started||S.ended||S.lastLegendDay===S.day)return;
 const next=nextLegendaryRule();
 if(!next||!legendaryReady(next))return;
 S.legendaryUnlocked.push(next.id);S.lastLegendDay=S.day;
 const name=byId[next.id];
 news('A new legendary wish is yours: '+name.en+'!','传奇愿望解锁：'+name.zh+'！');
 send('town_legendary_unlocked',{wish:next.id,week:S.day,unlocked_count:S.legendaryUnlocked.length});
}

const data=[
['cats','🐈','猫咪自由','Cat Freedom','每户都欢迎猫咪','Cats may enter anywhere',11,1,'cat'],
['music','🎸','随处演出','Music Everywhere','在任何地方开演唱会','Play music anywhere',14,-1,'party'],
['garden','🌸','屋顶花园','Rooftop Gardens','把城市种到天空','Grow above the streets',11,2,'sky'],
['cafe','☕','露天咖啡馆','Open-air Café','想见面就见面','Meet without appointments',9,1,'cat'],
['library','📚','自由图书馆','Free Library','每本书都有读者','Read without limits',8,2,'calm'],
['art','🎨','全民艺术','Art for Everyone','每个人都是艺术家','Create without limits',11,0,'art'],
['park','🌳','梦境公园','Dream Park','给发呆留一块地方','Make room to daydream',9,2,'calm'],
['night','🎡','午夜市集','Midnight Market','反正明天不用早起','Nobody has to wake early',14,-2,'party'],
['star','🔭','观星塔','Stargazing Tower','把星星分给所有人','Share the night sky',11,1,'sky'],
['tower','🎈','气球塔','Balloon Tower','让城市慢慢升空','Take the town higher',13,-1,'sky'],
['pond','🪷','月光湖','Moonlit Lake','在屋顶造一片湖','A lake among rooftops',9,2,'calm'],
['arcade','🕹️','无限游戏厅','Infinite Arcade','一玩就是一整夜','Play all night long',13,-1,'party'],
['beach','🏖️','永久假日海滩','Forever Beach','每个人都有自己的海边假期','Every day is your own holiday',11,2,'calm'],
['voyage','🚂','说走就走的列车','Anywhere Express','没有终点，也没有误车','No final stop and no missed train',14,1,'sky'],
['flight','🪁','飞行自由日','The Day of Flying','想飞就飞，天空向所有人开放','The sky belongs to everyone',13,0,'sky'],
['picnic','🧺','永远的野餐日','The Endless Picnic','找个喜欢的地方，就这样过一天','A whole afternoon with nowhere to be',10,2,'calm']
].map(a=>({id:a[0],icon:a[1],zh:a[2],en:a[3],descZh:a[4],descEn:a[5],joy:a[6],peace:a[7],vibe:a[8]}));
const byId=Object.fromEntries(data.map(c=>[c.id,c]));
const combinations=[
['cats','cafe','猫咪咖啡王国','Cat Café Kingdom','cat'],['cats','garden','云上猫咪乐园','Sky Cat Walk','cat'],
['cats','library','猫咪图书馆','Cat Librarians','cat'],['music','cafe','露天音乐节','Spontaneous Concert','party'],
['music','art','流动艺术节','Living Art Festival','art'],['music','park','森林交响乐','Forest Orchestra','party'],
['night','music','永不散场的狂欢','Never-ending Carnival','party'],['night','arcade','霓虹游乐城','Neon Playground','party'],
['garden','tower','浮空岛屿','Floating Islands','sky'],['garden','star','星空花园','Sky Gardens','sky'],
['garden','pond','云上瀑布','Cloud Waterfall','sky'],['star','pond','银河湖','Galaxy Lake','sky'],
['library','art','会呼吸的故事书','Living Storybook','art'],['park','pond','午睡天堂','World of Naps','calm'],
['cafe','art','彩绘街道','Painted Street','art'],['library','star','星星图书馆','Library of Stars','sky'],
['cats','park','猫咪野餐节','Cat Picnic Festival','cat'],['arcade','art','游戏美术馆','Playable Museum','art'],
['beach','pond','海边的秘密花园','Secret Tide Garden','calm'],['beach','music','海岸露天演出','Oceanfront Concert','party'],
['beach','park','无人催促的假期','The Unhurried Holiday','calm'],['voyage','star','银河铁路','The Galaxy Express','sky'],
['voyage','tower','飞往世界的列车','Worldbound Sky Train','sky'],['flight','garden','自由飞翔的花园','A Flying Garden','sky'],
['flight','music','云上演唱会','Concert Above the Clouds','party'],['picnic','cats','猫咪野餐大会','Cat Picnic Paradise','cat'],
['picnic','art','野外创作日','Art Without Walls','art'],['picnic','park','无限悠闲下午','An Endless Afternoon','calm']
].map((a,i)=>({a:a[0],b:a[1],zh:a[2],en:a[3],vibe:a[4],bonus:18+(i%4)*2,key:[a[0],a[1]].sort().join('+')}));
const endings={
cat:['猫咪自治共和国','The Cats Elected a Mayor','人类终于自由了。除了铲猫砂。','Humanity is finally free. Except for scooping litter.'],
sky:['空中花园共和国','The Town That Learned to Fly','原本只想种点花，结果整座城飞起来了。','You planted a flower. The whole town took off.'],
party:['永不散场的城市','The City That Never Said Goodnight','没有人需要早起，于是没人愿意回家。','Nobody needed to wake early. Nobody went home.'],
art:['奇想艺术之都','A Town Made of Imagination','没人需要上班，每个人都有一件代表作。','No jobs. Everybody has a masterpiece.'],
calm:['不赶时间的花园小镇','The Town With All the Time in the World','醒来没有闹钟，下午想去哪儿就去哪儿。','No alarms. No rush. Every afternoon is yours.'],
 coast:['永不结束的海边假期','An Endless Seaside Holiday','早上冲浪，午后看云，整个小镇都住进了假期。','Morning waves, afternoon daydreams. The whole town is on holiday.'],
 roaming:['开往自由的银河列车','The Train to Everywhere','没有终点，也没有归期，世界就是你的家。','No final stop, no return ticket. The whole world is home.'],
 flight:['人人都能飞的天空城','The City Where Everyone Can Fly','一觉醒来，整个小镇飞进了云层，每个人都有自己的天空。','One morning, the whole town took flight. Everyone has their own sky.'],
chaos:['奇妙失控城','The Beautifully Unmanageable City','所有人都实现了愿望，小镇决定自己做主。','Everyone got a wish. The town had other ideas.']
};
const palettes={cat:['#f5b3bd','#ffe8ca'],sky:['#727bc9','#edaacb'],party:['#30366e','#d583b1'],art:['#b88cc8','#ffe4cc'],calm:['#f2c1cd','#ffe6ba'],coast:['#f4bcc6','#ffe4c8'],roaming:['#9384c8','#ffc8ba'],flight:['#828bd4','#ffd7e6'],chaos:['#6b59a9','#ffc69e']};
let S,selected='',overlays=[],introOpen=true;
const chinese=()=>window.MorrowwishI18n?.get?.()==='zh'||document.documentElement.lang.toLowerCase().startsWith('zh');
const t=(en,zh)=>chinese()?zh:en;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function send(name,details){window.arcadeMetric?.(name,Object.assign({game:'tiny-town'},details||{}));}
function rand(seed){let n=seed>>>0;return ()=>{n=(n+0x6d2b79f5)>>>0;let v=n;v=Math.imul(v^(v>>>15),v|1);v^=v+Math.imul(v^(v>>>7),v|61);return((v^(v>>>14))>>>0)/4294967296;};}
function sample(arr,seed){let a=[...arr],r=rand(seed);for(let i=a.length-1;i>0;i--){let j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function adjacent(a,b){return Math.abs(a%5-b%5)+Math.abs(Math.floor(a/5)-Math.floor(b/5))===1;}
function pair(a,b){return combinations.find(x=>x.key===[a,b].sort().join('+'));}

/* Wish Cascade 4.5: dramatic triplet wonders, citizens, meaningful town charter,
   daily promises, one repair move, and consequences beyond arbitrary points. */
const residents=[
 {name:'Mia',face:'👩🏻‍🎨',en:'The quiet dreamer',zh:'喜欢安静的梦想家',likes:['library','garden','pond','park','beach','picnic'],dislikes:['night','arcade','music']},
 {name:'Leo',face:'🧑🏽‍🎤',en:'The festival starter',zh:'永远不嫌热闹的乐手',likes:['music','night','arcade','cafe','voyage','flight'],dislikes:['pond','library']},
 {name:'Lulu',face:'👩🏼‍🌾',en:'The cat rescuer',zh:'想照顾所有小猫的人',likes:['cats','cafe','park','picnic','beach'],dislikes:['night','arcade']},
 {name:'Nora',face:'👩🏾‍🚀',en:'The sky explorer',zh:'梦想在云上生活',likes:['garden','tower','star','pond','voyage','flight'],dislikes:['arcade']},
 {name:'Kai',face:'🧑🏻‍🎨',en:'The street artist',zh:'想把街道变成画布',likes:['art','cafe','library','music','picnic','beach'],dislikes:['night']}
];
const legends=[
 {ids:['cats','cafe','library'],zh:'猫咪当选市长！',en:'A CAT WAS ELECTED MAYOR!',vibe:'cat',icon:'🐈',captionZh:'图书馆被改造成喵喵市政厅。',captionEn:'The library is now the Feline City Hall.'},
 {ids:['cats','garden','park'],zh:'巨型猫咪空中游乐园！',en:'THE SKY CAT PLAYGROUND!',vibe:'cat',icon:'🎠',captionZh:'城市上空出现了猫咪专属天桥。',captionEn:'Cats now own the skybridges.'},
 {ids:['music','cafe','night'],zh:'整座城变成夜间音乐节！',en:'THE NEVER-ENDING FESTIVAL!',vibe:'party',icon:'🎆',captionZh:'街道自动亮起灯光，居民开始狂欢。',captionEn:'Every street becomes a glowing festival.'},
 {ids:['music','night','arcade'],zh:'无限霓虹游乐城！',en:'THE INFINITE NEON ARCADE!',vibe:'party',icon:'🎡',captionZh:'太阳落山后，小镇的游戏才真正开始。',captionEn:'The real town comes alive after dark.'},
 {ids:['garden','tower','star'],zh:'整座小镇升上天空！',en:'THE ENTIRE TOWN TAKES FLIGHT!',vibe:'sky',icon:'🏝️',captionZh:'屋顶连成悬浮岛屿，街道变成彩虹桥。',captionEn:'Roofs are floating islands. Roads become skybridges.'},
 {ids:['garden','star','pond'],zh:'天空中出现了一整片银河！',en:'A GALAXY APPEARED OVER TOWN!',vibe:'sky',icon:'🌌',captionZh:'湖面倒映繁星，水流从云端倾泻而下。',captionEn:'The lake becomes a river through the stars.'},
 {ids:['library','art','park'],zh:'故事书里的世界成真了！',en:'THE STORYBOOK COMES ALIVE!',vibe:'art',icon:'🦋',captionZh:'书中的角色与居民一起走上街头。',captionEn:'Characters walk out of books and into town.'},
 {ids:['library','art','cafe'],zh:'整个小镇都变成艺术品！',en:'THE TOWN BECOMES AN ARTWORK!',vibe:'art',icon:'🎭',captionZh:'每面墙都开始创作，每个人都能留下痕迹。',captionEn:'Every wall becomes a canvas.'},
 {ids:['park','pond','library'],zh:'史上最盛大的集体午睡！',en:'THE GREAT TOWN NAP!',vibe:'calm',icon:'🛌',captionZh:'街道铺满吊床，终于无人安排任何事。',captionEn:'Hammocks everywhere. Absolutely no schedule.'},
 {ids:['beach','park','pond'],zh:'整个小镇搬到了海边！',en:'THE WHOLE TOWN MOVES TO THE BEACH!',vibe:'calm',icon:'🏝️',captionZh:'从此每天醒来都听得见海浪。',captionEn:'Now everyone wakes to the sound of waves.'},
 {ids:['voyage','star','tower'],zh:'一条铁路驶入银河！',en:'THE RAILWAY THROUGH THE STARS!',vibe:'sky',icon:'🚂',captionZh:'列车没有终点，窗外却有无数个世界。',captionEn:'No final stop. Countless worlds outside the window.'},
 {ids:['flight','garden','tower'],zh:'花园有了自己的翅膀！',en:'GARDENS LEARNED TO FLY!',vibe:'sky',icon:'🪽',captionZh:'居民可以坐在花丛里飞越城市。',captionEn:'People can soar above the town in a garden.'},
 {ids:['beach','music','cafe'],zh:'海边举办了永不落幕的音乐节！',en:'THE BEACH FESTIVAL NEVER ENDS!',vibe:'party',icon:'🌅',captionZh:'海风、吉他、晚霞，谁也不着急回家。',captionEn:'Sea breeze and guitars. Nobody needs to go home.'}
];

const RESIDENT_ORIGINS=residents.map(r=>({...r,likes:[...r.likes],dislikes:[...r.dislikes]}));
const LEGEND_FANS={star:['Mia','Nora','Kai'],night:['Leo','Lulu','Kai'],tower:['Mia','Leo','Nora'],flight:['Leo','Lulu','Nora']};
function randomizeNeighbors(seed){
 const homeResidents=sample(residents.map((_,i)=>i),seed^0x2a90475d);
 const ordinary=data.filter(c=>!LEGENDARY_WISHES.includes(c.id)).map(c=>c.id);
 const dislikeCounts=Object.fromEntries(ordinary.map(id=>[id,0]));
 RESIDENT_ORIGINS.forEach((base,i)=>{
  const likes=[...base.likes.filter(id=>!LEGENDARY_WISHES.includes(id)).slice(0,2)];
  const coreDislike=base.dislikes.find(id=>ordinary.includes(id)&&!likes.includes(id)&&dislikeCounts[id]<2);
  const dislikes=coreDislike?[coreDislike]:[];
  if(coreDislike)dislikeCounts[coreDislike]++;
  for(const id of sample(ordinary,seed+i*179+29)){
   if(likes.length>=5)break;
   if(!likes.includes(id)&&!dislikes.includes(id))likes.push(id);
  }
  for(const id of sample(ordinary,seed+i*271+61)){
   if(dislikes.length>=2)break;
   if(!likes.includes(id)&&!dislikes.includes(id)&&dislikeCounts[id]<2){
    dislikes.push(id);dislikeCounts[id]++;
   }
  }
  for(const [id,fans] of Object.entries(LEGEND_FANS))if(fans.includes(base.name))likes.push(id);
  residents[i].likes=likes;residents[i].dislikes=dislikes;
 });
 return homeResidents;
}
function daySpark(){
 if(!S)return 'sky';
 const vibes=['sky','cat','party','art','calm'];
 return vibes[Math.floor(rand((S.seed^(S.day*2381)^0x71cad33f)>>>0)()*vibes.length)];
}

const charters=[
 {id:'wonder',icon:'🎉',en:'Chaos, please',zh:'想疯就疯',descEn:'Bold wishes give +6 imagination, −1 harmony.',descZh:'大胆愿望：想象力额外 +6、友爱额外 −1。'},
 {id:'care',icon:'🛋️',en:'Nap first',zh:'先躺为敬',descEn:'First cozy wish each day: +4 imagination, +1 harmony.',descZh:'每天首个舒心愿望：想象力 +4、友爱 +1。'},
 {id:'dream',icon:'🚀',en:'Make it impossible',zh:'离谱一点才好玩',descEn:'Epic wonders give +30 imagination.',descZh:'大型奇观：想象力额外 +30。'}
];

/* Short, branching neighbor relationships replace generic town-hall disputes. */
const NEIGHBOR_ARCS=[
 {id:'music',trigger:['music'],people:[0,1],scene:'festival',
  titleEn:'A song outside Mia’s window',titleZh:'Mia 窗外的那场演出',
  introEn:'Leo has put a drum kit beneath Mia’s quiet balcony. Mia opens the window carrying her unfinished song. Neither wants the other to stop.',
  introZh:'Leo 把鼓架在 Mia 安静的阳台下。Mia 推开窗，手里拿着一首没写完的歌。两人都舍不得停下。',
  first:[
   ['Turn it into a sunset duet','把它变成一场日落二重奏'],
   ['Give them a rooftop stage','给他们一座屋顶舞台']
  ],
  follow:[
   ['Mia finally plays her own melody. Leo slows the drums to match. People stop walking to listen.','Mia 终于弹出自己的旋律，Leo 把鼓点放慢。路过的人都停下来听。'],
   ['The rooftop concert gets so popular that Leo installs a silent headphone stage. Mia ends up dancing in the first row.','屋顶音乐会越来越热闹，Leo 搭起了耳机舞台。最先跳起来的竟然是 Mia。']
  ]},
 {id:'cats',trigger:['cats'],people:[2,3],scene:'train',
  titleEn:'A kitten in Nora’s flying machine',titleZh:'Nora 的飞行器里有只小猫',
  introEn:'Lulu’s rescued kitten curls up inside Nora’s flight simulator. Every time it purrs, the engine lights up. Nora thinks she has found her copilot.',
  introZh:'Lulu 救下的小猫钻进了 Nora 的飞行模拟器。它每呼噜一声，引擎就亮一下。Nora 觉得自己找到了副驾驶。',
  first:[
   ['Let the kitten try a tiny flight','让小猫试飞一小圈'],
   ['Build the kitten a control tower','给小猫造一座指挥塔']
  ],
  follow:[
   ['The kitten safely circles the garden in a tiny balloon. Lulu cries happy tears; Nora names a new constellation after it.','小猫坐着小气球绕花园飞了一圈。Lulu 开心得落泪，Nora 还用它的名字命名了一颗星。'],
   ['From its soft cushion in the tower, the kitten launches Nora’s first successful sky garden. Lulu brings a blanket to celebrate.','小猫趴在指挥塔的软垫上，按亮了 Nora 第一座空中花园的启动灯。Lulu 带了毯子来庆祝。']
  ]},
 {id:'art',trigger:['art','library'],people:[4,0],scene:'meadow',
  titleEn:'A mural with a secret door',titleZh:'Kai 的壁画藏着一扇门',
  introEn:'Kai covers an empty wall with wild colors. Mia notices a little painted door in the corner—and insists she can hear waves behind it.',
  introZh:'Kai 把一面空墙画得五颜六色。Mia 注意到角落里画着一扇小门，说自己听见了门后传来的海浪。',
  first:[
   ['Paint a seaside world behind it','把门后画成一整个海边世界'],
   ['Let Mia write the door’s secret','让 Mia 写下这扇门的秘密']
  ],
  follow:[
   ['The painted door opens at sunset. Kai and Mia walk straight into a beach made of watercolor and spend the afternoon there.','傍晚，画里的门真的打开了。Kai 和 Mia 走进水彩画般的海滩，玩了一整个下午。'],
   ['Mia’s story appears on every wall in town. Kai draws the last page, which turns into a real bridge of butterflies.','Mia 写下的故事一夜之间出现在满城墙上。Kai 画出最后一页，蝴蝶真的搭成了一座桥。']
  ]},
 {id:'travel',trigger:['voyage','garden','star','tower'],people:[3,1],scene:'train',
  titleEn:'An impossible concert tour',titleZh:'一场不可能的巡演',
  introEn:'Nora wants to test a train that follows the stars. Leo wants to take his music somewhere nobody has heard it. They stare at the same map.',
  introZh:'Nora 想试开一趟追着星星跑的列车。Leo 想去没人听过他音乐的地方演出。两个人盯着同一张地图。',
  first:[
   ['Make their first stop the clouds','第一站就开去云里'],
   ['Invite the entire town aboard','邀请整座小镇一起上车']
  ],
  follow:[
   ['The train stops on a cloud. Leo performs for a crowd of curious birds while Nora sketches a railway across the sky.','列车停在一朵云上。Leo 给好奇的小鸟开了场演唱会，Nora 则画下横跨天空的新铁路线。'],
   ['Everyone boards the star train. By sunrise, the residents have invented a festival that travels from world to world.','全镇一起登上星星列车。天亮时，大家已经发明了一场从一个世界开往另一个世界的流动节日。']
  ]},
 {id:'picnic',trigger:[],people:[0,2],scene:'sea',
  titleEn:'The picnic nobody scheduled',titleZh:'没有人预约的野餐',
  introEn:'Mia leaves a blanket beside the little beach. Lulu arrives with warm bread and a family of rescued kittens. An accidental picnic begins.',
  introZh:'Mia 在海边铺了一块毯子。Lulu 带着刚烤好的面包和一窝获救的小猫路过。一场没人安排的野餐开始了。',
  first:[
   ['Build a blanket fort for everyone','给大家搭一座毯子城堡'],
   ['Follow the kittens to a secret cove','跟着小猫去找秘密海湾']
  ],
  follow:[
   ['The blanket fort becomes a tiny neighborhood of hammocks. Mia writes poems while Lulu’s kittens nap on everyone’s knees.','毯子城堡变成了一片吊床村。Mia 写诗，Lulu 的小猫轮流趴在每个人膝盖上睡觉。'],
   ['The kittens discover a hidden cove full of glowing shells. Mia and Lulu declare it a place where nobody ever needs a plan.','小猫找到了满是发光贝壳的秘密海湾。Mia 和 Lulu 宣布，这里永远不需要任何计划。']
  ]}
];
function chooseNeighborArc(){
 const built=new Set(S.places.map(p=>p.id));
 return NEIGHBOR_ARCS.find(a=>a.trigger.some(id=>built.has(id)))||NEIGHBOR_ARCS.at(-1);
}
function neighborMoment(arc,phase,option){
 const indices=arc.people;
 S.neighborArc=arc.id;
 if(phase===1)S.neighborChoice=option;
 const previous=arc.follow[S.neighborChoice??0];
 const message=phase===1?
  [arc.first[option][0]+'. They have a new idea to try.',arc.first[option][1]+'，两个人决定一起试一试。']:
  previous;
 const wonder=phase===1?7:15;
 S.wonder+=wonder;
 S.peace=Math.min(10,S.peace+1);
 indices.forEach(i=>{S.moods[i]=Math.min(6,S.moods[i]+1);});
 S.neighborMoments.push({arc:arc.id,phase,choice:phase===1?option:S.neighborChoice,en:message[0],zh:message[1],people:indices.map(i=>residents[i].name)});
 news(message[0],message[1]);
 send('town_neighbor_story',{arc:arc.id,phase,choice:option,week:S.day});
}
function showNeighborStory(day){
 const arc=day===3?chooseNeighborArc():NEIGHBOR_ARCS.find(a=>a.id===S.neighborArc);
 if(!arc)return false;
 const follow=day===5,people=arc.people.map(i=>residents[i]);
 $('storyKicker').textContent=t(follow?'STORY CONTINUES':'TWO NEIGHBORS, ONE ADVENTURE',follow?'居民故事 · 下集':'居民之间的新故事');
 $('storyTitle').textContent=t(arc.titleEn,arc.titleZh);
 $('storyBody').textContent=t(...(follow?arc.follow[S.neighborChoice??0]:[arc.introEn,arc.introZh]));
 $('storyImage').innerHTML='<div class="neighbor-scene">'+
   '<div class="neighbor-scene-art">'+(window.TownFreedom?.svg?.(arc.scene)||'')+'</div>'+
   '<div class="neighbor-scene-portraits"><span>'+people[0].face+'</span><b>✦</b><span>'+people[1].face+'</span></div></div>';
 if(follow){
  button(t('See where this friendship goes','看看他们的新生活'),()=>{neighborMoment(arc,2,S.neighborChoice??0);nextOverlay();});
 }else{
  arc.first.forEach((choice,i)=>button(t(...choice),()=>{neighborMoment(arc,1,i);nextOverlay();},i===1));
 }
 return true;
}

const petitions={
 2:{zh:'Mia 想看看某种新奇的组合',en:'Mia hopes to see an unexpected combination',passes:()=>S.found.length>=1},
 4:{zh:'Leo 想举办更有趣的活动',en:'Leo dreams of two surprising discoveries',passes:()=>S.found.length>=2},
 6:{zh:'Nora 想看看一座真正的奇观',en:'Nora hopes to witness a breathtaking wonder',passes:()=>S.legends.length>=1}
};
function shouldPromise(day){return petitions[day]||null;}
function connectedLegend(legend){
 const found=legend.ids.map(id=>S.places.find(p=>p.id===id));
 if(found.some(p=>!p))return false;
 const visited=new Set([0]);let moved=true;
 while(moved){moved=false;for(let i=0;i<3;i++)for(let j=0;j<3;j++){
  if(visited.has(i)&&!visited.has(j)&&adjacent(found[i].pos,found[j].pos)){visited.add(j);moved=true;}
 }}
 return visited.size===3;
}
function discoverLegends(){
 const gained=legends.filter(l=>!S.legends.some(a=>a.ids.join()===l.ids.join())&&connectedLegend(l));
 for(const l of gained){S.legends.push(l);S.wonder+=65+(S.law==='dream'?30:0);S.mutation=l.vibe;S.celebration=l.icon;send('town_city_mutation',{week:S.day});send('town_epic_wonder',{week:S.day});}
 return gained;
}
function processCombos(card,pos){
 const matches=newPairs(card.id,pos);
 if(matches.length)S.highlight=pos;
 matches.forEach(c=>{S.found.push(c);S.wonder+=c.bonus;});
 if(matches.length){
  send('town_combo_found',{week:S.day});
  if(S.found.length===matches.length)send('town_first-club');
  /* Cozy bonus is applied to the first peaceful wish, not to combos. */
  news('✨ '+matches.map(c=>c.en).join(' + ')+'!','✨ '+matches.map(c=>c.zh).join(' + ')+'！');
  if(S.found.length<=2)overlays.push({kind:'combo',match:matches[0]});
 }
 return matches;
}
function processResidents(card){
 const moods=S.moods;
 residents.forEach((r,i)=>{
  if(r.likes.includes(card.id))moods[i]=Math.min(6,moods[i]+1);
  if(r.dislikes.includes(card.id))moods[i]=Math.max(0,moods[i]-2);
 });
 const struggling=moods.filter(v=>v<=1).length;
 if(struggling>=2){S.peace=Math.max(0,S.peace-1);S.tensions++;news('Some neighbors are feeling left out.','有居民感到自己的生活方式被忽视了。');}
}
function updatePromise(day){
 const p=shouldPromise(day);if(!p)return;
 const success=p.passes();S.promiseHistory.push({day,success});
 if(success){S.wonder+=17;S.peace=Math.min(10,S.peace+1);news('The town kept its promise. +17 wonder!','兑现了全体居民的小愿望！奇想 +17。');send('town_petition_met',{week:day});}
 else{news('A dream for another day. Tomorrow is still yours.','没实现也没关系。自由的日子还有很多。');send('town_petition_missed',{week:day});}
}
function renderPeople(){
 const el=$('citizens');if(!el)return;
 el.innerHTML=residents.map((r,i)=>{
  const m=S.moods[i],mood=m>=5?'♥♥♥':m>=3?'♥♥':m>=2?'♥':'!';
  const level=m>=4?'happy':m<=1?'sad':'neutral';
  return '<div class="citizen '+level+'" title="'+esc(t(r.en,r.zh))+'"><span class="portrait">'+r.face+'</span><span class="citizen-name">'+r.name+'</span><span class="citizen-mood">'+mood+'</span></div>';
 }).join('');
 const p=shouldPromise(S.day);
 $('petition').innerHTML=p?'<b>💌 '+t('A neighbor has a dream','邻居的自由心愿')+'</b><span>'+t(p.en,p.zh)+'</span><small>'+t('Make it happen for a bonus. Or follow your own dream.','实现会有额外惊喜；不做也没关系。')+'</small>':'<b>✨ '+t('Build a town with personality','打造有自己性格的小镇')+'</b><span>'+t('Your neighbors have feelings and opinions.','居民会对每个愿望做出不同反应。')+'</span>';
 $('moveWish').hidden=S.day<3||S.ended||S.relocateUsed;
 $('moveWish').textContent=S.relocateFrom===null?t('↔ Move one building (once per town)','↔ 免费搬迁一次建筑'):t('Choose an empty plot to move here','点击空地完成搬迁');
 $('moveWish').classList.toggle('chosen',selected==='relocate');
 $('cityLandmark').textContent=S.celebration||'';
 $('cityLandmark').className='city-landmark'+(S.legends.length?' revealed':'');
 $('legendCount').textContent=S.legends.length+'/'+legends.length;
}
function runAnomaly(){
 if(S.peace>2||S.hadRevolt||S.day<3)return;
 S.hadRevolt=true;overlays.push({kind:'revolt'});send('town_social_crisis',{week:S.day});
}
function relocate(pos){
 if(selected!=='relocate'||S.relocateUsed)return;
 if(S.relocateFrom===null){
  const existing=S.places.find(q=>q.pos===pos);
  if(!existing)return;
  S.relocateFrom=pos;
  news('One last chance to change the town layout.','小镇获得了一次重新调整布局的机会。');render();return;
 }
 if(pos===S.relocateFrom){S.relocateFrom=null;selected='';render();return;}
 if(HOME.includes(pos)||pos===CENTER||S.places.some(q=>q.pos===pos))return;
 const building=S.places.find(q=>q.pos===S.relocateFrom);
 if(!building)return;
 building.pos=pos;S.relocateUsed=true;S.relocateFrom=null;selected='';
 processCombos(byId[building.id],pos);
 const gained=discoverLegends();
 gained.forEach(l=>overlays.push({kind:'legend',legend:l}));
 send('town_building_moved',{week:S.day});
 news('A building moved. A different future became possible.','建筑换了位置，小镇的未来也跟着改变了。');
 S.advanceAfterOverlay=false;render();
 if(overlays.length)showOverlay();
}
function finalLayers(){
 const top=S.legends[S.legends.length-1];
 const collections=S.places.slice(0,7).map((p,i)=>{
  const x=88+i*110,y=304+(i%2)*24;
  return '<text x="'+x+'" y="'+y+'" font-size="34" text-anchor="middle">'+byId[p.id].icon+'</text>';
 }).join('');
 const scenic=top?'<text x="420" y="102" font-size="60" text-anchor="middle">'+top.icon+'</text>':'';
 return collections+scenic;
}

function fresh(){const seed=(Date.now()^Math.floor(Math.random()*1000000000))>>>0;const homeResidents=randomizeNeighbors(seed);return {seed,homeResidents,day:1,places:[],found:[],legends:[],wonder:0,peace:6,news:[],events:[],mutation:'',celebration:'',lastBuilt:-1,highlight:-1,journeys:[],memories:[],legendaryUnlocked:[],lastLegendDay:-1,scenic:'meadow',moods:residents.map(()=>4),tensions:0,law:'care',lastComboDay:-1,lastComfortDay:-1,promiseHistory:[],neighborArc:null,neighborChoice:null,neighborMoments:[],relocateUsed:false,relocateFrom:null,hadRevolt:false,advanceAfterOverlay:false,ended:false,started:false,ending:''};}
function offers(){
 if(S.day===1){
  const pools={
   wonder:['music','arcade','beach','art','cats','voyage','garden'],
   dream:['voyage','garden','cats','music','art','beach','pond'],
   care:['beach','picnic','garden','park','cats','library','cafe']
  };
  return sample(pools[S.law]||pools.care,S.seed^0x39ab21cf).slice(0,3);
 }
 const used=new Set(S.places.map(p=>p.id)),last=S.places[S.places.length-1].id;
 const advanced=LEGENDARY_WISHES;
 const available=data.filter(c=>!used.has(c.id)&&(!advanced.includes(c.id)||rareUnlocked(c.id))).map(c=>c.id);
 const related=sample(available.filter(id=>pair(id,last)),S.seed+S.day*47);
 const recent=S.journeys[S.journeys.length-1];
 const routes={sea:['beach','pond','park'],mountain:['garden','tower','park'],train:['voyage','tower','star'],stars:['star','library','tower'],festival:['music','night','cafe'],meadow:['park','garden','picnic'],rest:['park','picnic','library']};
 const hinted=recent?sample((routes[recent]||[]).filter(id=>available.includes(id)),S.seed+S.day*37):[];
 const almost=legends.filter(l=>l.ids.filter(id=>used.has(id)).length===2).flatMap(l=>l.ids.filter(id=>available.includes(id)));
 const rare=sample(available.filter(id=>advanced.includes(id)),S.seed+S.day*97);
 const dayVibe=daySpark();
 const freshStyle=sample(available.filter(id=>byId[id].vibe===dayVibe),S.seed+S.day*479);
 const rotation=sample(available,S.seed+S.day*277+S.places.length*31);
 return [...new Set([
  ...rare.slice(0,1),...almost.slice(0,1),...freshStyle.slice(0,1),
  ...hinted.slice(0,1),...related.slice(0,1),...rotation
 ])].slice(0,3);
}

function wonderStyleBonus(card){
 const usedVibes=new Set(S.places.map(p=>byId[p.id].vibe));
 const newVibe=!usedVibes.has(card.vibe);
 const spotlight=card.vibe===daySpark();
 return {newVibe,spotlight,extra:(newVibe?8:0)+(spotlight?7:0)};
}

function wishEffect(card){
 const isLegendary=LEGENDARY_WISHES.includes(card.id);
  const bold=!isLegendary&&S.law==='wonder'&&card.peace<0;
 const cozy=S.law==='care'&&card.peace>0&&S.lastComfortDay!==S.day;
 const power=LEGENDARY_POWERS[card.id],variety=wonderStyleBonus(card);
 return {wonder:card.joy+(bold?6:0)+(cozy?4:0)+(power?.wonder||0)+variety.extra,peace:(isLegendary?Math.max(0,card.peace):card.peace)-(bold?1:0)+(cozy?1:0)+(power?.peace||0),cozy,power,variety};
}
function activateLegendaryPower(card,power,effect){
 if(!power)return;
 const indexes=power.mood==='all'?residents.map((_,i)=>i):power.mood;
 indexes.forEach(i=>{S.moods[i]=Math.min(6,S.moods[i]+power.boost);});
 S.mutation=power.theme;S.celebration=card.icon;S.scenic=power.scene;
 news(power.en,power.zh);
 overlays.push({kind:'legendaryBuild',card,power,effect});
 send('town_legendary_power_used',{wish:card.id,week:S.day,bonus_wonder:power.wonder,bonus_harmony:power.peace});
}
function newPairs(id,pos){return S.places.filter(p=>adjacent(pos,p.pos)).map(p=>pair(id,p.id)).filter(c=>c&&!S.found.some(f=>f.key===c.key));}
function type(){
 const built=S.places.map(p=>byId[p.id]);
 if(built.some(c=>c.id==='flight'))return 'flight';
 const score={cat:0,sky:0,party:0,art:0,calm:0};
 built.forEach((c,i)=>{score[c.vibe]+=4+(i>=4?1:0);});
 S.found.forEach(c=>{score[c.vibe]+=7;});
 S.legends.forEach(c=>{score[c.vibe]+=18;});
 const travel={sea:'calm',mountain:'calm',train:'sky',stars:'sky',festival:'party',meadow:'calm',rest:'calm'};
 S.journeys.forEach(j=>{if(travel[j])score[travel[j]]+=2;});
 if(S.law==='wonder')score.party+=3;
 if(S.law==='dream')score.sky+=3;
 if(S.law==='care')score.calm+=1;
 if(S.mutation&&Object.hasOwn(score,S.mutation))score[S.mutation]+=3;
 const winner=Object.keys(score).sort((a,b)=>score[b]-score[a]||(['sky','party','cat','art','calm'].indexOf(a)-['sky','party','cat','art','calm'].indexOf(b)))[0];
 if(S.peace<=1&&S.events.includes('revolt')&&S.found.length)return 'chaos';
 if(winner==='calm'&&built.some(c=>c.id==='beach')&&(S.journeys.includes('sea')||built.some(c=>['pond','picnic','park'].includes(c.id))))return 'coast';
 if(winner==='sky'&&built.some(c=>c.id==='voyage')&&S.journeys.includes('train'))return 'roaming';
 return winner;
}
function goal(){return S.legends.length>=1&&S.peace>=3;}
function translate(){document.querySelectorAll('[data-en][data-zh]').forEach(el=>el.textContent=t(el.dataset.en,el.dataset.zh));document.title=t('No More Mondays: Wish Cascade','自由小镇：愿望连锁反应');}
function render(){
 translate();if(!S)return;
 // On the first wish, keep the board and the action itself in focus.
 document.body.classList.toggle('town-first-wish',!!S.started&&!S.ended&&S.places.length===0);
 $('day').textContent=S.day+' / 7';$('wonder').textContent=S.wonder;$('peace').textContent=S.peace+'/10';$('comboNum').textContent=S.found.length;
 $('progressFill').style.width=((S.ended?7:S.day-1)/7*100)+'%';
 $('mapTitle').textContent=S.mutation?t('A world you made possible','你亲手创造的奇妙世界'):t('Make a life worth remembering','创造你真正想过的生活');
 $('mapWrap').dataset.theme=S.mutation||'normal';
 $('guide').textContent=!S.places.length
   ?(selected?t('Step 2: tap a glowing empty plot to build your first wish.','第 2 步：点击发光的空地，建造你的第一个愿望。'):t('Step 1: choose a wish from the cards below.','第 1 步：从下面的卡片选一个愿望。'))
   :selected?t('Tap a glowing plot. Place related wishes beside each other for surprises.','点击发光的空地。把相关愿望建在一起，会有惊喜！')
   :t('Choose your next wish. Try placing it beside something related!','选下一个愿望，试试建在有关联的建筑旁边！');
 renderBoard();renderCards();renderNews();renderPeople();renderScenery();window.TownV5?.render?.();
 // The visible banner, not the hidden legacy #guide caption, owns the first-run hint.
 const introPrompt=$('liveNotice');
 if(introPrompt&&S.started&&!S.ended&&S.places.length===0){
  introPrompt.textContent=selected
   ?t('2 / 2 · Now tap a glowing empty plot to place your wish.','第 2 步 · 点击发光的空地，把愿望建在这里。')
   :t('1 / 2 · Pick any wish below. There is no wrong choice.','第 1 步 · 从下方选一个愿望，没有错误答案。');
 }

}
function renderScenery(){
 const art=$('worldIllustration');
 if(!art)return;
 const scenicForWish={beach:'sea',voyage:'train',flight:'train',garden:'meadow',star:'stars',music:'festival',night:'festival',park:'meadow',picnic:'meadow',cats:'meadow',tower:'train',pond:'sea',cafe:'festival',art:'meadow',library:'mountain',arcade:'festival'};
 const current=S.journeys.length?S.scenic:(scenicForWish[S.places[S.places.length-1]?.id]||'meadow');
 const first=S.places[0]?.id;
 const theme=first&&S.journeys.length===0?scenicForWish[first]:current;
 if(art.dataset.current!==theme){
  art.dataset.current=theme;
  art.innerHTML=window.TownFreedom?.svg?.(theme)||'';
 }
 $('mapWrap').dataset.destination=theme;
 const passports=$('journeyPassport');
 if(passports)passports.innerHTML=S.journeys.length?S.journeys.map(j=>'<span class="passport-stamp">'+(window.TownFreedom?.DATA?.[j]?.icon||'✦')+' '+esc(t(window.TownFreedom?.DATA?.[j]?.en||j,window.TownFreedom?.DATA?.[j]?.zh||j))+'</span>').join(''):'<span class="passport-empty">'+t('Your adventure memories will appear here.','走出去看看世界，回忆就会留在这里。')+'</span>';
}
function renderBoard(){
 const board=$('board');board.innerHTML='';
 const placed=new Map(S.places.map(p=>[p.pos,byId[p.id]]));
 for(let p=0;p<25;p++){
  const home=HOME.includes(p),residentIndex=home?S.homeResidents[HOME.indexOf(p)]:null,tenant=residentIndex!==null?residents[residentIndex]:null,center=p===CENTER,building=placed.get(p),moving=selected==='relocate',free=!!selected&&!home&&!center&&!building&&(!moving||S.relocateFrom!==null),combos=free&&!moving?newPairs(selected,p):[];
  const tile=document.createElement('button');tile.type='button';tile.dataset.pos=p;
  tile.className='tile'+(home?' house resident-home':'')+(center?' plaza':'')+(building?' built':'')+(free?' target':'')+(combos.length?' jackpot':'')+(moving&&building?' movable':'')+(p===S.lastBuilt?' just-built':'')+(p===S.highlight?' combo-spark':'');
   if(tenant)tile.dataset.resident=residentIndex;
   if(building)tile.dataset.building=building.id;
  tile.disabled=!free&&!(moving&&building)&&!home;tile.setAttribute('aria-label',tenant?tenant.name+t("'s home. View resident profile.",'的家，点击查看居民档案。'):center?t('Town square','广场'):building?t(building.en,building.zh):t('Empty plot','空地'));
  let icon=home?'🏠':center?'⛲':building?building.icon:free?combos.length?'✦':'+':'·';
  tile.innerHTML='<span class="tile-icon">'+icon+'</span>'+(home||center||building?'<span class="tile-name">'+(tenant?esc(tenant.name):center?t('Square','广场'):t(building.en,building.zh))+'</span>':'')+(tenant?'<span class="home-face">'+tenant.face+'</span>':'')+(building?'<span class="tile-people">'+residents.filter(r=>r.likes.includes(building.id)).slice(0,2).map(r=>r.face).join('')+'</span>':'')+(combos.length?'<span class="combo-dot">+'+combos.reduce((n,c)=>n+c.bonus,0)+'</span>':'');
  if(tenant){tile.onclick=()=>window.TownV5?.openResident?.(residentIndex,'house');}
   else if(free||moving&&building){tile.onclick=()=>moving?relocate(p):place(p);if(!moving){tile.onmouseenter=()=>preview(p);tile.onfocus=()=>preview(p);}}
  board.appendChild(tile);
 }
}
function selectWish(id){
 if(!S||!S.started||S.ended||!byId[id]||selected==='relocate'||S.places.some(p=>p.id===id))return false;
 if(LEGENDARY_WISHES.includes(id)&&!rareUnlocked(id))return false;
 if(!LEGENDARY_WISHES.includes(id)&&!offers().includes(id))return false;
 selected=id;send('town_wish_selected',{week:S.day,legendary:LEGENDARY_WISHES.includes(id)});render();preview(-1);return true;
}
function renderCards(){
 const el=$('cards');if(!el||!S)return;
 const title=$('cardsTitle'),description=title?.nextElementSibling,hint=$('pickHint');
 el.innerHTML='';
 if(S.ended){
  el.classList.add('is-complete');
  if(title)title.textContent=t('Your seven-day story is complete','七日旅程已经完成');
  if(description)description.textContent=t('Your town has reached its own ending. Revisit the story or begin a new town.','你的小镇已经迎来自己的结局。可以重看故事，也可以重新开始。');
  if(hint)hint.textContent=t('This town is complete. Your next story can begin whenever you are ready.','本局已经完成，准备好时就可以开启下一座小镇。');
  const endingTitle=$('endTitle')?.textContent?.trim()||t('A town of your own','属于你的小镇');
  const icons={cat:'🐈',sky:'☁️',party:'🎆',art:'🎨',calm:'🌷',coast:'🐚',roaming:'🚂',flight:'🪽',chaos:'🌈'};
  const card=document.createElement('section');card.className='town-complete-card';
  const top=document.createElement('div');top.className='town-complete-top';
  const mark=document.createElement('span');mark.className='town-complete-mark';mark.textContent=icons[S.ending]||'✦';
  const kicker=document.createElement('small');kicker.className='town-complete-kicker';kicker.textContent=t('YOUR SEVEN-DAY STORY','你的七日故事');
  const heading=document.createElement('strong');heading.className='town-complete-heading';heading.textContent=endingTitle;
  const grade=document.createElement('span');grade.className='town-complete-grade';grade.textContent=t('Grade ','本局评级 ')+(S.grade||'—');
  top.append(mark,kicker,heading,grade);
  const copy=document.createElement('p');copy.className='town-complete-copy';copy.textContent=t('Seven days of wishes became a town and a story that belongs to you.','七天的愿望，最终变成了一座独一无二的小镇和属于你的故事。');
  const stats=document.createElement('div');stats.className='town-complete-stats';
  [[t('Imagination','想象力'),String(S.wonder)],[t('Harmony','友爱'),String(S.peace)+'/10'],[t('Discoveries','发现'),String(S.found.length)]].forEach(item=>{
   const stat=document.createElement('div');stat.className='town-complete-stat';
   const value=document.createElement('strong');value.textContent=item[1];
   const label=document.createElement('small');label.textContent=item[0];
   stat.append(value,label);stats.append(stat);
  });
  const actions=document.createElement('div');actions.className='town-complete-actions';
  const again=document.createElement('button');again.type='button';again.className='button primary';again.textContent=t('Build another town','再建一座小镇');again.addEventListener('click',restart);
  const replay=document.createElement('button');replay.type='button';replay.className='button';replay.textContent=t('Replay ending','重看结局');replay.addEventListener('click',()=>$('end').classList.add('show'));
  actions.append(again,replay);card.append(top,copy,stats,actions);el.append(card);
  return;
 }
 el.classList.remove('is-complete');
 if(selected==='relocate'){
  if(title)title.textContent=t('Move one building','搬迁一座建筑');
  if(description)description.textContent=t('Choose an empty plot on the map to place the selected building.','点击地图上的空地，选择建筑的新位置。');
  if(hint)hint.textContent=t('Tap an empty plot to finish the move.','点击一块空地完成搬迁。');
  return;
 }
 const shown=offers();
 if(!shown.length){
  if(title)title.textContent=t('A new town is waiting','还有新的小镇在等你');
  if(description)description.textContent=t('There are no wishes left to place in this run.','本局已经没有可放置的愿望了。');
  if(hint)hint.textContent=t('Start another town to explore a different story.','重新开始，探索另一种生活。');
  const empty=document.createElement('div');empty.className='town-complete-card';
  const message=document.createElement('strong');message.className='town-complete-heading';message.textContent=t('All wishes explored','所有愿望都已探索');
  const again=document.createElement('button');again.type='button';again.className='button primary';again.textContent=t('Build another town','再建一座小镇');again.addEventListener('click',restart);
  empty.append(message,again);el.append(empty);return;
 }
 if(selected&&LEGENDARY_WISHES.includes(selected)&&!shown.includes(selected))shown[2]=selected;
 for(const id of shown){
  const c=byId[id],b=document.createElement('button');b.type='button';b.className='wish-card'+(id===selected?' selected':'')+(LEGENDARY_WISHES.includes(id)?' legendary-card':'');b.setAttribute('aria-pressed',String(id===selected));
  const fans=residents.filter(r=>r.likes.includes(id)),critics=residents.filter(r=>r.dislikes.includes(id)),effect=wishEffect(c);
  b.innerHTML='<span class="wish-icon">'+c.icon+'</span><span class="wish-copy"><b>'+t(c.en,c.zh)+'</b>'+(LEGENDARY_WISHES.includes(id)?'<small class="rare-mark">'+t('✦ LEGENDARY','✦ 传奇')+'</small>':'')+'<small>'+t(c.descEn,c.descZh)+'</small><span class="wish-variety">'+(effect.variety.newVibe?t('✦ New lifestyle +8','✦ 新生活方式 +8')+' ':'')+(effect.variety.spotlight?t('☀ Today’s spark +7','☀ 今日灵感 +7'):'')+'</span><em>'+t('Imagination +'+effect.wonder+' · Harmony '+(effect.peace>=0?'+':'')+effect.peace,'想象力 +'+effect.wonder+' · 友爱 '+(effect.peace>=0?'+':'')+effect.peace)+'</em><span class="wish-reactions">'+(fans.length?'<span class="fan">♥ '+fans.map(x=>x.name).join('、')+'</span>':'')+(critics.length?'<span class="critic">− '+critics.map(x=>x.name).join('、')+'</span>':'')+'</span></span><span class="wish-next">›</span>';
  b.onclick=()=>selectWish(id);
  el.appendChild(b);
 }
 if(hint)hint.textContent=selected?t('Touch the landscape to bring it to life.','点击地图，让这个愿望成为现实。'):t('Three beautiful possibilities. Which sounds like you?','三种美好的生活，你更想体验哪一种？');
}
function renderNews(){
 $('news').innerHTML=S.news.length?S.news.map(n=>'<p>'+esc(t(n.en,n.zh))+'</p>').join(''):'<p>'+t('No one needs to work. What should everyone do tomorrow?','不需要再上班了。那么，明天做什么？')+'</p>';
 $('discoveries').innerHTML=S.found.length?S.found.slice(-3).reverse().map(c=>'<span class="discovery">✦ '+esc(t(c.en,c.zh))+'</span>').join(''):'<span class="discover-empty">'+t('Secret combinations are hiding everywhere…','奇妙组合藏在地图的每个角落…')+'</span>';
}
function preview(pos){
 if(!selected||!byId[selected])return;const c=byId[selected],effect=wishEffect(c),extra=pos<0?[]:newPairs(selected,pos),gain=extra.reduce((n,q)=>n+q.bonus,0);
 $('preview').innerHTML='<b>'+c.icon+' '+esc(t(c.en,c.zh))+'</b><span>+'+effect.wonder+' '+t('imagination','想象力')+' · '+(effect.peace>=0?'+':'')+effect.peace+' '+t('harmony','友爱')+'</span>'+(gain?'<strong class="preview-gain">✦ '+extra.map(x=>esc(t(x.en,x.zh))).join('、')+' +'+gain+'</strong>':'');
}
function news(en,zh){S.news.unshift({en,zh});S.news=S.news.slice(0,2);}
function place(pos){
 if(!S.started||S.ended||!selected||HOME.includes(pos)||pos===CENTER||S.places.some(q=>q.pos===pos))return;
 const card=byId[selected],matches=newPairs(card.id,pos),effect=wishEffect(card);
 S.places.push({id:card.id,pos});S.lastBuilt=pos;S.highlight=-1;
 S.wonder+=effect.wonder;
 S.peace=Math.min(10,Math.max(0,S.peace+effect.peace));
 if(effect.cozy)S.lastComfortDay=S.day;
 processResidents(card);
 activateLegendaryPower(card,effect.power,effect);
 if(S.day===1)send('town_started',{week:1});
 send('town_week-'+S.day,{week:S.day,score:S.wonder});
 if(S.day===2)send('town_second-wish',{week:2});
 processCombos(card,pos);
 if(!matches.length){
  const happy=residents.find(r=>r.likes.includes(card.id));
  const scenes={
   beach:['Nobody checked the time. The sea was enough.','所有人都忘了看时间，光是海风就让人开心。'],
   voyage:['The first train departed with no return date.','第一趟列车出发了，没有人问什么时候回来。'],
   flight:['The sky became a place to play.','天空从此不只是用来仰望的。'],
   picnic:['A whole afternoon passed without a single plan.','一个下午就这样过去，谁也没觉得浪费。'],
   garden:['Someone held their first picnic among the flowers.','屋顶开满了花，邻居在花丛里野餐。'],
   cats:['A neighborhood cat found five new favorite homes.','一只小猫找到了五个喜欢的新家。'],
   music:['The first concert started before anyone asked for tickets.','第一场音乐会开始了，没有人需要买门票。'],
   park:['Mia stayed in the park until sunset, doing nothing.','Mia 在公园里发了一下午呆，看着太阳落山。'],
   night:['The lanterns went on. No one had a last train to catch.','街灯亮了，没有人需要赶末班车。'],
   art:['The walls turned into a shared canvas.','街道变成画布，谁都可以留下自己的颜色。']
  };
  const line=scenes[card.id]||[card.en+' found its place in town.',card.zh+'在小镇有了自己的位置。'];
  news((happy?happy.face+' ':'')+line[0],(happy?happy.face+' ':'')+line[1]);
 }
 const gained=discoverLegends();
 gained.forEach(l=>overlays.push({kind:'legend',legend:l}));
 updatePromise(S.day);
 if(S.day===3||S.day===5)overlays.push({kind:'event',day:S.day});
 if(S.day===2||S.day===5)overlays.push({kind:'journey',day:S.day});
 runAnomaly();
 selected='';S.advanceAfterOverlay=true;render();if(overlays.length)showOverlay();else advance();
}
function button(text,callback,secondary){
 const b=document.createElement('button');b.type='button';b.className='button '+(secondary?'subtle':'primary');b.textContent=text;b.onclick=callback;$('storyChoices').appendChild(b);
}
function showOverlay(){
 const o=overlays[0];if(!o)return;
 $('storyModal').classList.add('show');$('storyChoices').innerHTML='';
 if(o.kind==='journey'){
  $('storyModal').classList.remove('show');
  const finish=memory=>{
    if(!memory||!memory.id){nextOverlay();return;}
    S.journeys.push(memory.id);S.scenic=memory.id==='rest'?'meadow':memory.id;
    const found=Array.isArray(memory.found)?[...new Set(memory.found.filter(i=>Number.isInteger(i)&&i>=0&&i<3))]:[];
    const info=window.TownFreedom?.DATA?.[memory.id];
    found.forEach(i=>{
      S.memories.push({place:memory.id,i,icon:info?.mem?.[i]||'✦',en:info?.hintsEn?.[i]||'A souvenir',zh:info?.hintsZh?.[i]||'一份纪念'});
      if(i===0)S.wonder+=8;
      if(i===1)S.peace=Math.min(10,S.peace+1);
      if(i===2)S.wonder+=6;
    });
    if(found.length)send('town_memories_collected',{count:found.length,week:S.day});
    if(memory.id==='rest'){S.peace=Math.min(10,S.peace+2);}
    else if(memory.bless==='peace'){S.peace=Math.min(10,S.peace+1);}
    else{S.wonder+=5;}
    S.moods=S.moods.map(v=>Math.min(6,v+1));
    const destination=window.TownFreedom?.DATA?.[memory.id];
    news('A whole day of freedom: '+(destination?.en||memory.id)+'.','自由的一天：'+(destination?.zh||memory.id)+'。');
    send('town_free_day',{week:S.day});
    send('town_free_'+memory.id,{week:S.day});
    nextOverlay();
  };
  if(window.TownFreedom?.play)window.TownFreedom.play({day:o.day,zh:chinese(),seed:S.seed},finish);
  else finish({id:o.day===2?'sea':'stars',bless:'peace',amount:2});
  return;
 }
 if(o.kind==='legendaryBuild'){
  const p=o.power,c=o.card;
  $('storyKicker').textContent=t('LEGENDARY WISH COMES ALIVE!','传奇愿望成真！');
  $('storyTitle').textContent=t(c.en,c.zh);
  $('storyBody').textContent=t(p.en,p.zh)+'  '+t('Imagination','想象力')+' +'+o.effect.wonder+' · '+t('Harmony','友爱')+' '+(o.effect.peace>=0?'+':'')+o.effect.peace;
  $('storyImage').innerHTML='<div class="wonder-film legend-power-film" data-vibe="'+p.theme+'">'+(window.TownFreedom?.svg?.(p.scene)||illustrate(p.theme))+'<span class="wonder-super-icon">'+c.icon+'</span></div>';
  button(t('Back to my amazing town','回去看看我的小镇'),nextOverlay);
 }else if(o.kind==='legend'){
  const l=o.legend;$('storyKicker').textContent=t('A CITY-SIZED MIRACLE!','城市级奇观诞生！');$('storyTitle').textContent=t(l.en,l.zh);
  $('storyBody').textContent=t(l.captionEn,l.captionZh)+'  +'+(65+(S.law==='dream'?30:0))+' '+t('wonder','奇想');
  const scene={cat:'meadow',sky:'train',party:'festival',art:'meadow',calm:'sea',chaos:'stars'}[l.vibe]||'meadow';
  $('storyImage').innerHTML='<div class="wonder-film" data-vibe="'+l.vibe+'">'+(window.TownFreedom?.svg?.(scene)||illustrate(l.vibe))+
  '<span class="wonder-super-icon">'+l.icon+'</span><div class="wonder-particles" aria-hidden="true">✧ ✦ ✧ ✦</div></div>';
  button(t('Explore the transformed town','探索全新小镇'),nextOverlay);
 }else if(o.kind==='revolt'){
  $('storyKicker').textContent=t('CITY HALL EMERGENCY','市政厅紧急会议');$('storyTitle').textContent=t('The town is dividing!','居民开始争论不休！');
  $('storyBody').textContent=t('You have granted incredible freedom, but some people feel left out. Make a genuine tradeoff.','你让城市变得不可思议，但有居民觉得自己被忽视。现在必须做出取舍。');
  $('storyImage').innerHTML='<div class="event-picture">⚡　🏛️　💬</div>';
  button(t('Protect shared spaces · harmony +4, wonder −12','保留公共空间 · 和谐 +4、奇想 −12'),()=>{S.peace=Math.min(10,S.peace+4);S.wonder=Math.max(0,S.wonder-12);S.events.push('reconcile');nextOverlay();});
  button(t('Let the city run wild · wonder +35, harmony −1','让城市彻底放飞 · 奇想 +35、和谐 −1'),()=>{S.wonder+=35;S.peace=Math.max(0,S.peace-1);S.events.push('revolt');S.mutation='chaos';nextOverlay();},true);
 }else if(o.kind==='combo'){
  const c=o.match;$('storyKicker').textContent=t('SECRET COMBINATION!','发现隐藏组合！');$('storyTitle').textContent=t(c.en,c.zh);
  $('storyBody').textContent=t('Two little wishes made something much bigger. Wonder +'+c.bonus+'!','两个普通愿望竟碰出了新的奇迹！奇想 +'+c.bonus+'！');
  $('storyImage').innerHTML='<div class="combination-reveal">'+byId[c.a].icon+' <span>＋</span> '+byId[c.b].icon+' <span>＝</span> ✦</div>';
  button(t('Amazing!','太妙了！'),nextOverlay);
 }else if(o.kind==='mutation'){
  const e=endings[o.type];$('storyKicker').textContent=t('THE WHOLE TOWN TRANSFORMS!','整座城市开始变异！');$('storyTitle').textContent=t(e[1],e[0]);
  $('storyBody').textContent=t('Your choices have changed the town forever. The story is not over.','你的选择永久改变了小镇，但故事还没结束。');
  $('storyImage').innerHTML=illustrate(o.type);button(t('Look at my town','看看我的小镇'),nextOverlay);
 }else if(o.kind==='event'&&showNeighborStory(o.day)){
  // Resident stories replace the older generic debate; earlier choices shape the follow-up.
 }else{
  const unhappy=residents.map((r,i)=>({...r,m:S.moods[i]})).sort((a,b)=>a.m-b.m)[0],quiet=S.peace<=4;
  $('storyKicker').textContent=t('A SURPRISE FROM '+unhappy.name,unhappy.name+' 带来一场小风波');
  $('storyTitle').textContent=o.day===3?(quiet?t('Too much freedom?','自由是不是太吵了？'):t('Who owns the town square?','广场应该属于谁？')):t('Who decides what fun means?','谁来决定什么才叫好玩？');
  $('storyBody').textContent=unhappy.face+' '+unhappy.name+'：'+t(unhappy.en+' has started a petition. Some want a quiet corner, others want bigger celebrations. Choose a lasting direction.','「'+unhappy.zh+'」发起了请愿：有人想安静，有人想彻底放飞。你必须决定小镇未来的方向。');
  $('storyImage').innerHTML='<div class="event-picture">'+(o.day===3?'🌿　🏘️　🎶':'🎈　🎉　🌙')+'</div>';
  button(t('Make room for everyone · harmony +2','照顾每个人 · 和谐 +2'),()=>chooseEvent('care'));
  button(t('Go all out · wonder +24, harmony −2','玩个痛快 · 奇想 +24，和谐 −2'),()=>chooseEvent('wild'),true);
 }
}
function chooseEvent(decision){
 S.events.push(decision);
 if(decision==='care'){S.peace=Math.min(10,S.peace+2);S.wonder+=6;S.moods=S.moods.map(m=>Math.min(6,m+1));news('Neighbors built a quiet corner together.','居民共同保留了一处安静角落。');}
 else{S.peace=Math.max(0,S.peace-2);S.wonder+=24;news('The celebration filled every street!','热闹的庆典占满了整条街！');}
 send('town_event_decided',{week:S.day});nextOverlay();
}
function nextOverlay(){overlays.shift();$('storyModal').classList.remove('show');if(overlays.length)showOverlay();else if(S.advanceAfterOverlay){S.advanceAfterOverlay=false;advance();}else render();}
function advance(){if(S.day===7){finish();return;}S.day++;unlockNextLegendary();render();}
function finish(){
 if(S.ended)return;
 S.ended=true;S.ending=type();S.grade=S.legends.length>=2&&S.peace>=4?'S':S.legends.length>=1&&S.peace>=3?'A':S.found.length>=2?'B':'C';
 send('town_completed-'+(goal()?'win':'lose'),{week:7,score:S.wonder+S.peace*4,grade:S.grade});
 send('town_ending_'+S.ending);
 const cover=window.TownFreedom?.DATA?.[S.scenic]||{icon:'🌺'};
 const eicon={cat:'🐈',sky:'🏝️',party:'🎆',art:'🎨',calm:'🌺',coast:'🏖️',roaming:'🚂',flight:'🪽',chaos:'🌈'}[S.ending]||'✦';
 $('endArt').innerHTML='<div class="end-hero-art" data-theme="'+S.ending+'"><img class="end-landscape" src="/art/tiny-town-scene.svg" alt="">'+
 '<span class="end-centerpiece">'+(['flight','coast','roaming'].includes(S.ending)?eicon:(S.celebration||eicon))+'</span><div class="end-stamp">NO<br>MORE<br>MONDAYS</div><div class="end-memories">'+
 S.journeys.map(j=>'<span>'+(window.TownFreedom?.DATA?.[j]?.icon||'✦')+' '+esc(t(window.TownFreedom?.DATA?.[j]?.en||j,window.TownFreedom?.DATA?.[j]?.zh||j))+'</span>').concat(S.memories.map(m=>'<span>'+m.icon+'</span>')).join('')+'</div><div class="end-sky-portal">'+(window.TownFreedom?.svg?.(({flight:'train',coast:'sea',roaming:'train'})[S.ending]||S.scenic)||'')+'</div>'+endingDiorama()+'</div>'+
 '<div hidden>'+illustrate(S.ending)+'</div>';
 endingText();$('endLegacy').innerHTML=endingAchievements();$('end').classList.add('show');
 $('feedbackQuestion').hidden=false;$('feedbackThanks').hidden=true;render();
}

const ENDING_EPILOGUES={
 cat:{en:'The cats abolished closing hours. A tiny pawprint appeared on every front door, and nobody ever asked who owned the town again.',zh:'猫咪宣布全城永久开放。每家门口多了一枚小爪印，从此再没有人讨论这座城到底属于谁。',symbol:'🐾',event:'Feline freedom decree',eventZh:'猫咪自由宣言'},
 sky:{en:'At sunrise, the first rooftop detached from the earth. By lunchtime the entire city was sailing between clouds, and everyone was free to choose a horizon.',zh:'日出时，第一片屋顶缓缓离开地面。中午之前，整座城已经飘进云海，每个人都能挑选自己的地平线。',symbol:'☁️',event:'The great ascent',eventZh:'全城升空日'},
 party:{en:'The final encore went on for three days. The stars joined the dance, and the town invented a new clock that only counted happy moments.',zh:'最后一首返场曲足足唱了三天。连星星也加入舞会，小镇发明了一种只记录快乐时刻的新时钟。',symbol:'🎇',event:'The endless encore',eventZh:'永不结束的安可'},
 art:{en:'The paintings came alive. Every morning a new mural appeared; every evening the residents stepped inside a different story of their own making.',zh:'所有画作都活了过来。每天早上城里冒出一幅新壁画，傍晚大家就一起走进自己创作的另一个世界。',symbol:'🦋',event:'When the walls woke up',eventZh:'墙壁醒来的那一天'},
 calm:{en:'The last alarm clock became a flowerpot. The town declared a permanent afternoon and discovered that life could be full without being busy.',zh:'全镇最后一个闹钟被改成花盆。大家宣布下午永不结束，终于发现生活可以很充实，却不需要很忙。',symbol:'🌷',event:'The forever afternoon',eventZh:'永远的午后'},
 coast:{en:'One morning the sea reached every doorstep. Residents learned to surf to the library and watch the sun set from their own floating balconies.',zh:'有一天清晨，海水一直漫到每家门前。居民们开始冲浪去图书馆，在自家的漂浮阳台上等日落。',symbol:'🐚',event:'The sea came home',eventZh:'大海搬进家里'},
 roaming:{en:'The train crossed an entire constellation and returned with a postcard from a planet made of flowers. Then the town tore up every timetable for good.',zh:'列车穿过一整片星座，带回一张来自花朵星球的明信片。随后大家把所有时刻表都撕掉了。',symbol:'🚂',event:'The last timetable',eventZh:'最后一张时刻表'},
 flight:{en:'On the first Flying Day, even the houses grew wings. By evening every resident had their own patch of sky, and the town no longer needed roads.',zh:'第一个飞行自由日，连房子都长出了翅膀。到傍晚，每位居民都有了自己的一片天空，小镇再也不需要马路。',symbol:'🪽',event:'The day the houses flew',eventZh:'房子长出翅膀'},
 chaos:{en:'Every wish happened at once. The city rearranged itself like a kaleidoscope and the people celebrated a holiday nobody had remembered to invent.',zh:'所有愿望在同一刻成真。整座小镇像万花筒一样重新排列，居民们庆祝了一场谁也没来得及发明的节日。',symbol:'🌈',event:'The impossible holiday',eventZh:'不存在的节日'}
};
function endingDiorama(){
 const buildingList=S.places.slice(-5).map((p,i)=>{
  const card=byId[p.id];
  return '<div class="end-model-building" style="--chip:'+i+'"><span>'+card.icon+'</span><small>'+esc(t(card.en,card.zh))+'</small></div>';
 }).join('');
 const people=S.homeResidents.map(i=>residents[i]).slice(0,5).map(r=>'<span title="'+esc(r.name)+'">'+r.face+'</span>').join('');
 const epilogue=ENDING_EPILOGUES[S.ending];
 return '<div class="end-story-world" aria-label="'+esc(t('Your own town, shaped by seven wishes','由你七个愿望打造的独一无二小镇'))+'">'+
  '<div class="end-story-night">'+epilogue.symbol+'</div>'+
  '<div class="end-model-buildings">'+buildingList+'</div>'+
  '<div class="end-model-people">'+people+'</div>'+
  '</div>';
}
function endingAchievements(){
 const epic=ENDING_EPILOGUES[S.ending],lastFriend=S.neighborMoments.at(-1);
 const rare=S.places.filter(p=>LEGENDARY_WISHES.includes(p.id));
 const names=rare.map(p=>byId[p.id].icon+' '+t(byId[p.id].en,byId[p.id].zh));
 const built=S.places.map(p=>byId[p.id]);
 const styles=[...new Set(built.map(c=>c.vibe))].length;
 return '<section class="ending-legacy"><header><span>'+epic.symbol+'</span><div><small>'+t('THE MIRACLE YOU CREATED','你亲手创造的奇迹')+'</small><strong>'+esc(t(epic.event,epic.eventZh))+'</strong></div></header>'+
  '<p>'+esc(t(epic.en,epic.zh))+'</p>'+
  '<div class="ending-legacy-stats"><span>'+t('✦ '+styles+' lifestyles','✦ '+styles+' 种生活方式')+'</span><span>'+t('♥ '+S.neighborMoments.length+' neighbor moments','♥ '+S.neighborMoments.length+' 段居民故事')+'</span><span>'+t('★ '+rare.length+' legendary builds','★ '+rare.length+' 座传奇建筑')+'</span></div>'+
  (names.length?'<div class="ending-legacy-relics">'+names.map(x=>'<span>'+esc(x)+'</span>').join('')+'</div>':'')+
  (lastFriend?'<p class="ending-last-friend">'+t('Meanwhile, ','与此同时，')+esc(lastFriend.people.join(' × '))+'：'+esc(t(lastFriend.en,lastFriend.zh))+'</p>':'')+
  '</section>';
}

const END_REASONS={
 cat:['Your cat-friendly buildings and neighborly combinations led the way.','你建造的猫咪空间和邻里组合，决定了小镇的性格。'],
 sky:['You chose exploration, skyward dreams, and surprising combinations.','你的天空建筑、探索选择和奇妙组合，把小镇带向了云端。'],
 party:['Music, late nights, and joyful surprises shaped the town.','音乐、夜生活和热闹的组合，让小镇永远充满快乐。'],
 art:['Artistic spaces and creative combinations transformed the streets.','你留下的创作空间和艺术组合，让整个小镇变成作品。'],
 calm:['Your quiet gardens, parks, and gentle wishes created a slower rhythm.','花园、公园与安静的愿望，让这个地方可以自由地慢下来。'],
 coast:['You made room for beach days and unhurried afternoons.','你把海滩、野餐和悠闲的午后，变成了小镇的日常。'],
 roaming:['The anywhere train and your travels led this town beyond its borders.','说走就走的列车和旅途选择，让小镇再也没有边界。'],
 flight:['You built Flying Day. The whole town earned a new way to live.','你亲手建造了飞行自由日，让全镇拥有真正飞上天空的生活。'],
 chaos:['Your bold decisions and heated town debates took freedom to the extreme.','你大胆的选择和居民间的争论，把自由推到了极致。']
};
function endingText(){
 if(!S?.ending)return;const e=endings[S.ending];
 const happiest=residents.map((r,i)=>({...r,m:S.moods[i]})).sort((a,b)=>b.m-a.m)[0],last=S.legends[S.legends.length-1];
 const trip=S.journeys.length?window.TownFreedom?.DATA?.[S.journeys.at(-1)]:null;
 const neighborEnding=S.neighborMoments.at(-1);
 $('endStory').textContent=t(happiest.name+' found their place here. '+(trip?'You also escaped to '+trip.en+'. ':'')+(neighborEnding?neighborEnding.en:(last?last.captionEn:'Life finally feels like your own.')),happiest.name+'在这里找到了喜欢的生活。'+(trip?'你还去过'+trip.zh+'。':'')+(neighborEnding?neighborEnding.zh:(last?last.captionZh:'每一天，都真正属于自己。')));$('endTitle').textContent=t(e[1],e[0]);$('endLine').textContent=t(e[3],e[2]);
 $('endDetail').textContent=t('7 wishes · ','7 个愿望 · ')+S.found.length+t(' discoveries · ',' 个惊喜 · ')+S.journeys.length+t(' adventures · ',' 段自由时光 · ')+S.legends.length+t(' wonders',' 座奇观');
 $('endGoal').textContent=goal()?t('✦ You found your own kind of freedom.','✦ 你创造了自己向往的生活。'):t('✦ Every kind of freedom deserves to be celebrated.','✦ 每一种自由，都值得好好庆祝。');
 $('endReason').textContent=t(...END_REASONS[S.ending]);
}
function illustrate(kind){
 const pal=palettes[kind]||palettes.calm,night=['sky','party','chaos'].includes(kind);
 let houses='';for(let i=0;i<7;i++){
  let x=28+i*113,y=277+(i%3)*16;
  houses+='<g><rect x="'+x+'" y="'+y+'" width="81" height="86" rx="9" fill="'+(i%2?'#e8abb6':'#d2bad3')+'"/><path d="M'+(x-10)+' '+y+'l49-43 50 43z" fill="'+(i%2?'#b88caa':'#b58aa3')+'"/><rect x="'+(x+14)+'" y="'+(y+24)+'" width="20" height="26" rx="4" fill="#fff1b7"/><rect x="'+(x+46)+'" y="'+(y+24)+'" width="20" height="26" rx="4" fill="#fff1b7"/></g>';
 }
 const accents=kind==='cat'?'<g fill="#ffdbb2"><path d="M353 245l20-59 36 31 28-31 26 59Z"/><ellipse cx="411" cy="274" rx="78" ry="60"/></g><path d="M378 270q11 16 26 0m18 0q13 15 26 0m-40 22q7 8 14 0" fill="none" stroke="#a65a70" stroke-width="5"/>':
 ['sky','flight','roaming'].includes(kind)?'<g><path d="M283 257q120-173 257 0" stroke="#acdcb9" stroke-width="32" fill="none"/><ellipse cx="417" cy="280" rx="150" ry="23" fill="#80a8c9"/><path d="M417 240V130" stroke="#f9e4c9" stroke-width="16"/><circle cx="417" cy="119" r="42" fill="#ffc8d8"/><path d="M350 253q55-113 115-7" stroke="#f6eed0" stroke-width="11" fill="none"/></g>':
 kind==='party'||kind==='chaos'?'<g><path d="M326 275v-90l90-62 94 62v90" fill="#8567b5" stroke="#ffe0ba" stroke-width="12"/><rect x="359" y="210" width="113" height="59" rx="9" fill="#f6adc1"/><path d="M238 113l355 23" stroke="#ffdbba" stroke-width="5" stroke-dasharray="14 11"/><circle cx="232" cy="111" r="19" fill="#fff1a1"/><circle cx="595" cy="136" r="18" fill="#f5b9da"/></g>':
 kind==='art'?'<g><path d="M310 244l105-114 110 114" fill="#eaa9bd"/><rect x="332" y="234" width="166" height="91" rx="12" fill="#d9a4c8"/><rect x="372" y="248" width="86" height="68" rx="7" fill="#fff2cb"/><path d="M377 293l28-31 23 18 28-30" stroke="#aa86c7" stroke-width="10" fill="none"/></g>':
 '<g><path d="M330 274q85-154 172 0" fill="#ffe6c0" stroke="#c9adb5" stroke-width="11"/><rect x="373" y="228" width="83" height="89" rx="25" fill="#9acbb3"/><path d="M305 224q36-112 102-23m43 5q67-117 92 24" fill="none" stroke="#90c6a4" stroke-width="17"/></g>';
 let stars='';for(let i=0;i<18;i++){const x=47+i*44,y=48+(i%5)*26;stars+='<circle cx="'+x+'" cy="'+y+'" r="'+(2+i%3)+'" fill="#fff7d0"/>';}
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 840 460" role="img" aria-label="'+esc(t(endings[kind][1],endings[kind][0]))+'"><defs><linearGradient id="wishSky" x2="0" y2="1"><stop stop-color="'+pal[0]+'"/><stop offset="1" stop-color="'+pal[1]+'"/></linearGradient><linearGradient id="wishGrass" x2="0" y2="1"><stop stop-color="#a9ceb0"/><stop offset="1" stop-color="#588e89"/></linearGradient></defs><rect width="840" height="460" rx="18" fill="url(#wishSky)"/><circle cx="709" cy="97" r="54" fill="#fff2d1"/>'+stars+'<path d="M0 307q180-49 375-5t465-19v177H0z" fill="#ccdbc9" opacity=".8"/>'+houses+'<path d="M0 365q140-38 315 1t525-18v112H0z" fill="url(#wishGrass)"/>'+accents+finalLayers()+'<g fill="#f9d4b2"><circle cx="225" cy="377" r="8"/><circle cx="247" cy="381" r="8"/><circle cx="593" cy="376" r="8"/><circle cx="615" cy="377" r="8"/></g><path d="M225 386v24m22-20v22m346-26v22m22-23v24" stroke="#605c88" stroke-width="10" stroke-linecap="round"/><path d="M50 402q28-88 54 0m626 4q25-92 57 0" fill="none" stroke="#e0d5ab" stroke-width="16" stroke-linecap="round"/></svg>';
}
function share(){
 const end=S.ending||type(),e=endings[end],score=S.wonder+S.peace*4;
 const last=S.journeys.at(-1),trip=last?window.TownFreedom?.DATA?.[last]:null;
 const message=t('Seven free days made '+e[1]+'! '+(trip?'I went to '+trip.en+'. ':'')+'What life would you choose?','七天自由生活，我建成了「'+e[0]+'」！'+(trip?'还去过'+trip.zh+'。':'')+'你想过怎样的生活？');
 if(window.MorrowwishSocialShare?.open)window.MorrowwishSocialShare.open({title:t('No More Mondays: Wish Cascade','自由小镇：愿望连锁'),message,score,language:chinese()?'zh':'en',url:'https://morrowwish.vercel.app/tiny-town/',meta:{game:'tiny-town',ending:end},onShare:()=>send('town_shared-link')});
}
function postcard(){
 if(!S.ended)return;
 const canvas=document.createElement('canvas');canvas.width=1260;canvas.height=740;
 const ctx=canvas.getContext('2d');if(!ctx)return;
 const picture=new Image();
 const draw=()=>{
  try{
   ctx.fillStyle='#fff8ed';ctx.fillRect(0,0,1260,740);
   const filter={cat:'saturate(1.18)',sky:'saturate(1.25) hue-rotate(12deg)',party:'saturate(1.4) hue-rotate(108deg)',art:'saturate(1.2) hue-rotate(295deg)',calm:'brightness(1.08)',coast:'saturate(1.2) sepia(.08)',roaming:'saturate(1.2)',flight:'saturate(1.22)',chaos:'saturate(1.5) hue-rotate(210deg)'};
   ctx.save();ctx.filter=filter[S.ending]||'none';
   ctx.drawImage(picture,20,20,1220,628);ctx.restore();
   ctx.fillStyle='#2c23457a';ctx.fillRect(20,522,1220,126);
   ctx.font='110px system-ui';ctx.textAlign='center';
   ctx.fillText(S.celebration||{cat:'🐈',sky:'🏝️',party:'🎆',calm:'🌺',art:'🎨',coast:'🏖️',roaming:'🚂',flight:'🪽',chaos:'🌈'}[S.ending]||'🌟',630,336);
   ctx.save();
    const landmarks=S.places.slice(-5);
    landmarks.forEach((place,index)=>{
     const x=334+index*147,y=432;
     ctx.fillStyle='#fff4eeed';ctx.fillRect(x,y,111,77);
     ctx.strokeStyle='#e8c8de';ctx.lineWidth=3;ctx.strokeRect(x,y,111,77);
     ctx.textAlign='center';ctx.font='40px system-ui';ctx.fillText(byId[place.id].icon,x+55,y+45);
     ctx.fillStyle='#65527a';ctx.font='bold 13px system-ui';ctx.fillText(t(byId[place.id].en,byId[place.id].zh).slice(0,9),x+55,y+65);
    });
    ctx.restore();
    ctx.font='bold 39px system-ui';ctx.fillStyle='#fff7e9';ctx.fillText(t(endings[S.ending][1],endings[S.ending][0]),630,584);
   ctx.font='25px system-ui';ctx.fillText(t('The life I chose · '+S.journeys.length+' adventures','我的自由生活 · '+S.journeys.length+' 段旅程'),630,626);
   ctx.textAlign='left';ctx.fillStyle='#514063';ctx.font='bold 28px system-ui';
   ctx.fillText('MORROW WISH',36,705);
   ctx.font='26px system-ui';ctx.textAlign='center';ctx.fillText(S.memories.slice(0,6).map(m=>m.icon).join('  '),630,705);
   ctx.textAlign='right';ctx.font='19px system-ui';ctx.fillText('NO MORE MONDAYS',1220,704);
   canvas.toBlob(blob=>{if(!blob)return;const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='my-free-town-'+S.ending+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(u),1500);},'image/png');
  }catch(err){alert(t('Could not save this postcard in your browser.','此浏览器暂时无法保存这张明信片。'));}
 };
 picture.onload=draw;
 picture.onerror=()=>alert(t('Could not load the postcard artwork.','结局插画暂时无法载入。'));
 picture.src='/art/tiny-town-scene.svg';
 send('town_postcard_clicked');
}
function start(){
 S.law=document.querySelector('[data-law].active')?.dataset.law||'care';
 S.started=true;$('intro').hidden=true;
 const firstThought={
  wonder:['No alarms. No rules. Time to make a little trouble!','没有闹钟，也没有规矩。先闹个痛快！'],
  care:['Sleeping in is a perfectly good plan.','睡到自然醒，就是今天最棒的计划。'],
  dream:['What if this little town could do the impossible?','如果这座小镇能把不可能变成日常呢？']
 };
 news(...firstThought[S.law]);
 send('town_charter_'+S.law);render();
}
function restart(){
 if(S?.started&&!S.ended)send('town_restarted-early',{week:S.day});if(S?.ended)send('town_replayed');
 S=fresh();selected='';overlays=[];$('end').classList.remove('show');$('storyModal').classList.remove('show');$('intro').hidden=true;S.started=true;send('game_retry');render();
}
function boot(){
 S=fresh();window.TownV5?.boot?.();
 document.querySelectorAll('[data-law]').forEach(el=>el.addEventListener('click',()=>{document.querySelectorAll('[data-law]').forEach(n=>{n.classList.toggle('active',n===el);n.setAttribute('aria-pressed',String(n===el));});}));
 $('moveWish').onclick=()=>{if(!S.started||S.ended||S.relocateUsed||S.day<3)return;selected=selected==='relocate'?'':'relocate';S.relocateFrom=null;render();};
 $('introStart').onclick=start;$('retry').onclick=restart;$('newAgain').onclick=restart;
 $('shareGame').onclick=share;$('shareEnding').onclick=share;$('savePostcard').onclick=postcard;
 $('viewTown').onclick=()=>$('end').classList.remove('show');
 $('closeEnding').onclick=()=>$('end').classList.remove('show');
 for(const [id,value] of [['feedbackFun','fun'],['feedbackConfusing','confusing'],['feedbackNotFun','not-fun']]){
  $(id).onclick=()=>{send('town_feedback-'+value);$('feedbackQuestion').hidden=true;$('feedbackThanks').hidden=false;};
 }
 window.addEventListener('morrowwish-language-change',()=>{render();endingText();if(overlays.length)showOverlay();});
 window.addEventListener('pagehide',()=>{if(S?.started&&!S.ended)send('town_exit-week-'+S.day,{week:S.day});});
 render();
}
window.TownV5State=()=>({S,selected,residents,byId,combinations,legends,offers,memories:S?.memories||[],legendaryWishes:LEGENDARY_WISHES,legendaryRules:LEGENDARY_RULES,legendaryPowers:LEGENDARY_POWERS,nextLegendary:nextLegendaryRule(),rareUnlocked:!!S?.legendaryUnlocked?.length});
window.TownV5Actions={selectWish};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();