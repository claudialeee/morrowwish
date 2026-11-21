/* Tiny Town: Wish Cascade v4 — bilingual, no dependencies */
(()=>{
'use strict';
const $=id=>document.getElementById(id),HOME=[0,2,4,20,24], CENTER=12;
const HOME_RESIDENT={0:0,2:3,4:1,20:2,24:4};
const LEGENDARY_RULES=[
 {id:'star',day:3,wonder:55,combos:0,epics:0},
 {id:'night',day:4,wonder:115,combos:1,epics:0},
 {id:'tower',day:5,wonder:180,combos:3,epics:0},
 {id:'flight',day:6,wonder:290,combos:5,epics:2}
];
const LEGENDARY_WISHES=LEGENDARY_RULES.map(rule=>rule.id);
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
calm:['世界上最懒的小镇','The Sleepiest Paradise','镇民唯一的日程，是取消日程。','The only appointment is to cancel appointments.'],
chaos:['奇妙失控城','The Beautifully Unmanageable City','所有人都实现了愿望，小镇决定自己做主。','Everyone got a wish. The town had other ideas.']
};
const palettes={cat:['#f5b3bd','#ffe8ca'],sky:['#727bc9','#edaacb'],party:['#30366e','#d583b1'],art:['#b88cc8','#ffe4cc'],calm:['#93c6b3','#ffe3ba'],chaos:['#6b59a9','#ffc69e']};
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
const charters=[
 {id:'wonder',icon:'🎉',en:'Chaos, please',zh:'想疯就疯',descEn:'Bold wishes give +6 imagination, −1 harmony.',descZh:'大胆愿望：想象力额外 +6、友爱额外 −1。'},
 {id:'care',icon:'🛋️',en:'Nap first',zh:'先躺为敬',descEn:'First cozy wish each day: +4 imagination, +1 harmony.',descZh:'每天首个舒心愿望：想象力 +4、友爱 +1。'},
 {id:'dream',icon:'🚀',en:'Make it impossible',zh:'离谱一点才好玩',descEn:'Epic wonders give +30 imagination.',descZh:'大型奇观：想象力额外 +30。'}
];
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

function fresh(){return {seed:(Date.now()^Math.floor(Math.random()*1000000000))>>>0,day:1,places:[],found:[],legends:[],wonder:0,peace:6,news:[],events:[],mutation:'',celebration:'',lastBuilt:-1,highlight:-1,journeys:[],memories:[],legendaryUnlocked:[],lastLegendDay:-1,scenic:'meadow',moods:residents.map(()=>4),tensions:0,law:'care',lastComboDay:-1,lastComfortDay:-1,promiseHistory:[],relocateUsed:false,relocateFrom:null,hadRevolt:false,advanceAfterOverlay:false,ended:false,started:false,ending:''};}
function offers(){
 if(S.day===1){
  if(S.law==='wonder')return ['music','beach','garden'];
  if(S.law==='dream')return ['voyage','garden','cats'];
  return ['beach','picnic','garden'];
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
 return [...new Set(almost.slice(0,1).concat(rare.slice(0,1),hinted.slice(0,1),related,sample(available,S.seed+S.day*113)))].slice(0,3);
}
function wishEffect(card){
 const bold=S.law==='wonder'&&card.peace<0;
 const cozy=S.law==='care'&&card.peace>0&&S.lastComfortDay!==S.day;
 return {wonder:card.joy+(bold?6:0)+(cozy?4:0),peace:card.peace-(bold?1:0)+(cozy?1:0),cozy};
}
function newPairs(id,pos){return S.places.filter(p=>adjacent(pos,p.pos)).map(p=>pair(id,p.id)).filter(c=>c&&!S.found.some(f=>f.key===c.key));}
function type(){const totals={cat:0,sky:0,party:0,art:0,calm:0};S.places.forEach(p=>totals[byId[p.id].vibe]+=2);S.found.forEach(f=>totals[f.vibe]+=4);S.legends.forEach(l=>totals[l.vibe]+=24); if(S.journeys.length){const scenic={sea:'calm',mountain:'calm',train:'sky',stars:'sky',festival:'party',meadow:'calm',rest:'calm'};totals[scenic[S.journeys.at(-1)]]+=5;}if(S.places.length)totals[byId[S.places[0].id].vibe]+=14;if(S.peace<=2&&S.found.length)return 'chaos';return Object.keys(totals).sort((a,b)=>totals[b]-totals[a])[0];}
function goal(){return S.legends.length>=1&&S.peace>=3;}
function translate(){document.querySelectorAll('[data-en][data-zh]').forEach(el=>el.textContent=t(el.dataset.en,el.dataset.zh));document.title=t('No More Mondays: Wish Cascade','自由小镇：愿望连锁反应');}
function render(){
 translate();if(!S)return;
 $('day').textContent=S.day+' / 7';$('wonder').textContent=S.wonder;$('peace').textContent=S.peace+'/10';$('comboNum').textContent=S.found.length;
 $('progressFill').style.width=((S.ended?7:S.day-1)/7*100)+'%';
 $('mapTitle').textContent=S.mutation?t('A world you made possible','你亲手创造的奇妙世界'):t('Make a life worth remembering','创造你真正想过的生活');
 $('mapWrap').dataset.theme=S.mutation||'normal';
 $('guide').textContent=selected?t('Choose where your dream comes alive. Gold means a surprise.','选一个让梦想发生的地方。金光代表惊喜！'):t('Choose a dream. Every small decision changes the scenery.','今天做什么，由你决定。每个小愿望都会改变风景。');
 renderBoard();renderCards();renderNews();renderPeople();renderScenery();window.TownV5?.render?.();
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
  const home=HOME.includes(p),residentIndex=home?HOME_RESIDENT[p]:null,tenant=residentIndex!==null?residents[residentIndex]:null,center=p===CENTER,building=placed.get(p),moving=selected==='relocate',free=!!selected&&!home&&!center&&!building&&(!moving||S.relocateFrom!==null),combos=free&&!moving?newPairs(selected,p):[];
  const tile=document.createElement('button');tile.type='button';tile.dataset.pos=p;
  tile.className='tile'+(home?' house resident-home':'')+(center?' plaza':'')+(building?' built':'')+(free?' target':'')+(combos.length?' jackpot':'')+(moving&&building?' movable':'')+(p===S.lastBuilt?' just-built':'')+(p===S.highlight?' combo-spark':'');
   if(tenant)tile.dataset.resident=residentIndex;
  tile.disabled=!free&&!(moving&&building)&&!home;tile.setAttribute('aria-label',tenant?tenant.name+t("'s home. View resident profile.",'的家，点击查看居民档案。'):center?t('Town square','广场'):building?t(building.en,building.zh):t('Empty plot','空地'));
  let icon=home?'🏡':center?'⛲':building?building.icon:free?combos.length?'✦':'+':'·';
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
 const el=$('cards');el.innerHTML='';if(S.ended||selected==='relocate')return;
 const shown=offers();
  if(selected&&LEGENDARY_WISHES.includes(selected)&&!shown.includes(selected))shown[2]=selected;
  for(const id of shown){
  const c=byId[id],b=document.createElement('button');b.type='button';b.className='wish-card'+(id===selected?' selected':'')+(LEGENDARY_WISHES.includes(id)?' legendary-card':'');b.setAttribute('aria-pressed',String(id===selected));
  const fans=residents.filter(r=>r.likes.includes(id)),critics=residents.filter(r=>r.dislikes.includes(id)),effect=wishEffect(c);
  b.innerHTML='<span class="wish-icon">'+c.icon+'</span><span class="wish-copy"><b>'+t(c.en,c.zh)+'</b>'+(LEGENDARY_WISHES.includes(id)?'<small class="rare-mark">'+t('✦ LEGENDARY','✦ 传奇')+'</small>':'')+'<small>'+t(c.descEn,c.descZh)+'</small><em>'+t('Imagination +'+effect.wonder+' · Harmony '+(effect.peace>=0?'+':'')+effect.peace,'想象力 +'+effect.wonder+' · 友爱 '+(effect.peace>=0?'+':'')+effect.peace)+'</em><span class="wish-reactions">'+(fans.length?'<span class="fan">♥ '+fans.map(x=>x.name).join('、')+'</span>':'')+(critics.length?'<span class="critic">− '+critics.map(x=>x.name).join('、')+'</span>':'')+'</span></span><span class="wish-next">›</span>';
  b.onclick=()=>selectWish(id);
  el.appendChild(b);
 }
 $('pickHint').textContent=selected?t('Touch the landscape to bring it to life.','点击地图，让这个愿望成为现实。'):t('Three beautiful possibilities. Which sounds like you?','三种美好的生活，你更想体验哪一种？');
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
 if(o.kind==='legend'){
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
 const eicon={cat:'🐈',sky:'🏝️',party:'🎆',art:'🎨',calm:'🌺',chaos:'🌈'}[S.ending]||'✦';
 $('endArt').innerHTML='<div class="end-hero-art" data-theme="'+S.ending+'"><img class="end-landscape" src="/art/tiny-town-scene.svg" alt="">'+
 '<span class="end-centerpiece">'+(S.celebration||eicon)+'</span><div class="end-stamp">NO<br>MORE<br>MONDAYS</div><div class="end-memories">'+
 S.journeys.map(j=>'<span>'+(window.TownFreedom?.DATA?.[j]?.icon||'✦')+' '+esc(t(window.TownFreedom?.DATA?.[j]?.en||j,window.TownFreedom?.DATA?.[j]?.zh||j))+'</span>').concat(S.memories.map(m=>'<span>'+m.icon+'</span>')).join('')+'</div><div class="end-sky-portal">'+(window.TownFreedom?.svg?.(S.scenic)||'')+'</div></div>'+
 '<div hidden>'+illustrate(S.ending)+'</div>';
 endingText();$('end').classList.add('show');
 $('feedbackQuestion').hidden=false;$('feedbackThanks').hidden=true;render();
}
function endingText(){
 if(!S?.ending)return;const e=endings[S.ending];
 const happiest=residents.map((r,i)=>({...r,m:S.moods[i]})).sort((a,b)=>b.m-a.m)[0],last=S.legends[S.legends.length-1];
 const trip=S.journeys.length?window.TownFreedom?.DATA?.[S.journeys.at(-1)]:null;
 $('endStory').textContent=t(happiest.name+' found their place here. '+(trip?'You also escaped to '+trip.en+'. ':'')+(last?last.captionEn:'Life finally feels like your own.'),happiest.name+'在这里找到了喜欢的生活。'+(trip?'你还去过'+trip.zh+'。':'')+(last?last.captionZh:'每一天，都真正属于自己。'));$('endTitle').textContent=t(e[1],e[0]);$('endLine').textContent=t(e[3],e[2]);
 $('endDetail').textContent=t('7 wishes · ','7 个愿望 · ')+S.found.length+t(' discoveries · ',' 个惊喜 · ')+S.journeys.length+t(' adventures · ',' 段自由时光 · ')+S.legends.length+t(' wonders',' 座奇观');
 $('endGoal').textContent=goal()?t('✦ You found your own kind of freedom.','✦ 你创造了自己向往的生活。'):t('✦ Every kind of freedom deserves to be celebrated.','✦ 每一种自由，都值得好好庆祝。');
}
function illustrate(kind){
 const pal=palettes[kind]||palettes.calm,night=['sky','party','chaos'].includes(kind);
 let houses='';for(let i=0;i<7;i++){
  let x=28+i*113,y=277+(i%3)*16;
  houses+='<g><rect x="'+x+'" y="'+y+'" width="81" height="86" rx="9" fill="'+(i%2?'#e8abb6':'#d2bad3')+'"/><path d="M'+(x-10)+' '+y+'l49-43 50 43z" fill="'+(i%2?'#b88caa':'#b58aa3')+'"/><rect x="'+(x+14)+'" y="'+(y+24)+'" width="20" height="26" rx="4" fill="#fff1b7"/><rect x="'+(x+46)+'" y="'+(y+24)+'" width="20" height="26" rx="4" fill="#fff1b7"/></g>';
 }
 const accents=kind==='cat'?'<g fill="#ffdbb2"><path d="M353 245l20-59 36 31 28-31 26 59Z"/><ellipse cx="411" cy="274" rx="78" ry="60"/></g><path d="M378 270q11 16 26 0m18 0q13 15 26 0m-40 22q7 8 14 0" fill="none" stroke="#a65a70" stroke-width="5"/>':
 kind==='sky'?'<g><path d="M283 257q120-173 257 0" stroke="#acdcb9" stroke-width="32" fill="none"/><ellipse cx="417" cy="280" rx="150" ry="23" fill="#80a8c9"/><path d="M417 240V130" stroke="#f9e4c9" stroke-width="16"/><circle cx="417" cy="119" r="42" fill="#ffc8d8"/><path d="M350 253q55-113 115-7" stroke="#f6eed0" stroke-width="11" fill="none"/></g>':
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
   const filter={cat:'saturate(1.18)',sky:'saturate(1.25) hue-rotate(12deg)',party:'saturate(1.4) hue-rotate(108deg)',art:'saturate(1.2) hue-rotate(295deg)',calm:'brightness(1.08)',chaos:'saturate(1.5) hue-rotate(210deg)'};
   ctx.save();ctx.filter=filter[S.ending]||'none';
   ctx.drawImage(picture,20,20,1220,628);ctx.restore();
   ctx.fillStyle='#2c23457a';ctx.fillRect(20,522,1220,126);
   ctx.font='110px system-ui';ctx.textAlign='center';
   ctx.fillText(S.celebration||{cat:'🐈',sky:'🏝️',party:'🎆',calm:'🌺',art:'🎨',chaos:'🌈'}[S.ending]||'🌟',630,336);
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
 for(const [id,value] of [['feedbackFun','fun'],['feedbackConfusing','confusing'],['feedbackNotFun','not-fun']]){
  $(id).onclick=()=>{send('town_feedback-'+value);$('feedbackQuestion').hidden=true;$('feedbackThanks').hidden=false;};
 }
 window.addEventListener('morrowwish-language-change',()=>{render();endingText();if(overlays.length)showOverlay();});
 window.addEventListener('pagehide',()=>{if(S?.started&&!S.ended)send('town_exit-week-'+S.day,{week:S.day});});
 render();
}
window.TownV5State=()=>({S,selected,residents,byId,combinations,legends,offers,memories:S?.memories||[],legendaryWishes:LEGENDARY_WISHES,legendaryRules:LEGENDARY_RULES,nextLegendary:nextLegendaryRule(),rareUnlocked:!!S?.legendaryUnlocked?.length});
window.TownV5Actions={selectWish};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();