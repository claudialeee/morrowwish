/* Tiny Town: Wish Cascade v4 — bilingual, no dependencies */
(()=>{
'use strict';
const $=id=>document.getElementById(id),HOME=[0,4,20,24], CENTER=12;
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
['arcade','🕹️','无限游戏厅','Infinite Arcade','一玩就是一整夜','Play all night long',13,-1,'party']
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
['cats','park','猫咪野餐节','Cat Picnic Festival','cat'],['arcade','art','游戏美术馆','Playable Museum','art']
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
function fresh(){return {seed:(Date.now()^Math.floor(Math.random()*1000000000))>>>0,day:1,places:[],found:[],wonder:0,peace:6,news:[],events:[],mutation:'',ended:false,started:false,ending:''};}
function offers(){
 if(S.day===1)return ['cats','music','garden'];
 const used=new Set(S.places.map(p=>p.id)),last=S.places[S.places.length-1].id,available=data.filter(c=>!used.has(c.id)).map(c=>c.id);
 const related=sample(available.filter(id=>pair(id,last)),S.seed+S.day*47);
 return [...new Set(related.concat(sample(available,S.seed+S.day*113)))].slice(0,3);
}
function newPairs(id,pos){return S.places.filter(p=>adjacent(pos,p.pos)).map(p=>pair(id,p.id)).filter(c=>c&&!S.found.some(f=>f.key===c.key));}
function type(){const totals={cat:0,sky:0,party:0,art:0,calm:0};S.places.forEach(p=>totals[byId[p.id].vibe]+=2);S.found.forEach(f=>totals[f.vibe]+=4);if(S.places.length)totals[byId[S.places[0].id].vibe]+=14;if(S.peace<=2&&S.found.length)return 'chaos';return Object.keys(totals).sort((a,b)=>totals[b]-totals[a])[0];}
function goal(){return S.found.length>=2&&S.peace>=3;}
function translate(){document.querySelectorAll('[data-en][data-zh]').forEach(el=>el.textContent=t(el.dataset.en,el.dataset.zh));document.title=t('No More Mondays: Wish Cascade','自由小镇：愿望连锁反应');}
function render(){
 translate();if(!S)return;
 $('day').textContent=S.day+' / 7';$('wonder').textContent=S.wonder;$('peace').textContent=S.peace+'/10';$('comboNum').textContent=S.found.length;
 $('progressFill').style.width=((S.ended?7:S.day-1)/7*100)+'%';
 $('mapTitle').textContent=S.mutation?t('Your town is transforming','小镇正在发生奇妙变化'):t('Your little town','你的小镇');
 $('mapWrap').dataset.theme=S.mutation||'normal';
 $('guide').textContent=selected?t('Tap a glowing plot. Gold means a secret combination!','点击发光的空地。金色代表有隐藏组合！'):t('Pick a wish, then pick a place.','选择愿望，再挑个地方实现它。');
 renderBoard();renderCards();renderNews();
}
function renderBoard(){
 const board=$('board');board.innerHTML='';
 const placed=new Map(S.places.map(p=>[p.pos,byId[p.id]]));
 for(let p=0;p<25;p++){
  const home=HOME.includes(p),center=p===CENTER,building=placed.get(p),free=!!selected&&!home&&!center&&!building,combos=free?newPairs(selected,p):[];
  const tile=document.createElement('button');tile.type='button';tile.dataset.pos=p;
  tile.className='tile'+(home?' house':'')+(center?' plaza':'')+(building?' built':'')+(free?' target':'')+(combos.length?' jackpot':'');
  tile.disabled=!free;tile.setAttribute('aria-label',home?t('House','小屋'):center?t('Town square','广场'):building?t(building.en,building.zh):t('Empty plot','空地'));
  let icon=home?'🏡':center?'⛲':building?building.icon:free?combos.length?'✦':'+':'·';
  tile.innerHTML='<span class="tile-icon">'+icon+'</span>'+(home||center||building?'<span class="tile-name">'+(home?t('Home','居民'):center?t('Square','广场'):t(building.en,building.zh))+'</span>':'')+(combos.length?'<span class="combo-dot">+'+combos.reduce((n,c)=>n+c.bonus,0)+'</span>':'');
  if(free){tile.onclick=()=>place(p);tile.onmouseenter=()=>preview(p);tile.onfocus=()=>preview(p);}
  board.appendChild(tile);
 }
}
function renderCards(){
 const el=$('cards');el.innerHTML='';if(S.ended)return;
 for(const id of offers()){
  const c=byId[id],b=document.createElement('button');b.type='button';b.className='wish-card'+(id===selected?' selected':'');b.setAttribute('aria-pressed',String(id===selected));
  b.innerHTML='<span class="wish-icon">'+c.icon+'</span><span class="wish-copy"><b>'+t(c.en,c.zh)+'</b><small>'+t(c.descEn,c.descZh)+'</small></span><span class="wish-next">›</span>';
  b.onclick=()=>{selected=id;send('town_wish_selected',{week:S.day});render();preview(-1);};
  el.appendChild(b);
 }
 $('pickHint').textContent=selected?t('Choose a plot on the map.','点击地图选位置。'):t('Three possibilities. One choice.','三个可能，只能实现一个。');
}
function renderNews(){
 $('news').innerHTML=S.news.length?S.news.map(n=>'<p>'+esc(t(n.en,n.zh))+'</p>').join(''):'<p>'+t('No one needs to work. What should everyone do tomorrow?','不需要再上班了。那么，明天做什么？')+'</p>';
 $('discoveries').innerHTML=S.found.length?S.found.slice(-3).reverse().map(c=>'<span class="discovery">✦ '+esc(t(c.en,c.zh))+'</span>').join(''):'<span class="discover-empty">'+t('Secret combinations are hiding everywhere…','奇妙组合藏在地图的每个角落…')+'</span>';
}
function preview(pos){
 if(!selected)return;const c=byId[selected],extra=pos<0?[]:newPairs(selected,pos),gain=extra.reduce((n,q)=>n+q.bonus,0);
 $('preview').innerHTML='<b>'+c.icon+' '+esc(t(c.en,c.zh))+'</b><span>+'+c.joy+' '+t('wonder','奇想')+' · '+(c.peace>=0?'+':'')+c.peace+' '+t('harmony','和谐')+'</span>'+(gain?'<strong class="preview-gain">✦ '+extra.map(x=>esc(t(x.en,x.zh))).join('、')+' +'+gain+'</strong>':'');
}
function news(en,zh){S.news.unshift({en,zh});S.news=S.news.slice(0,2);}
function place(pos){
 if(!S.started||S.ended||!selected||HOME.includes(pos)||pos===CENTER||S.places.some(q=>q.pos===pos))return;
 const card=byId[selected],matches=newPairs(card.id,pos);S.places.push({id:card.id,pos});S.wonder+=card.joy;S.peace=Math.min(10,Math.max(0,S.peace+card.peace));
 if(S.day===1)send('town_started',{week:1});
 send('town_week-'+S.day,{week:S.day,score:S.wonder});
 if(S.day===2)send('town_second-wish',{week:2});
 if(matches.length){
  matches.forEach(c=>{S.found.push(c);S.wonder+=c.bonus;});
  news('✨ '+matches.map(c=>c.en).join(' + ')+'!','✨ '+matches.map(c=>c.zh).join(' + ')+'！');
  send('town_combo_found',{week:S.day});
  if(S.found.length===matches.length)send('town_first-club');
  if(S.found.length<=2)overlays.push({kind:'combo',match:matches[0]});
 }else news(card.icon+' '+card.en+' changed the town.','新愿望实现：'+card.zh+'。');
 if(S.found.length>=2&&!S.mutation){S.mutation=type();S.wonder+=20;overlays.push({kind:'mutation',type:S.mutation});send('town_city_mutation',{week:S.day});}
 if(S.day===3||S.day===5)overlays.push({kind:'event',day:S.day});
 selected='';render();if(overlays.length)showOverlay();else advance();
}
function button(text,callback,secondary){
 const b=document.createElement('button');b.type='button';b.className='button '+(secondary?'subtle':'primary');b.textContent=text;b.onclick=callback;$('storyChoices').appendChild(b);
}
function showOverlay(){
 const o=overlays[0];if(!o)return;
 $('storyModal').classList.add('show');$('storyChoices').innerHTML='';
 if(o.kind==='combo'){
  const c=o.match;$('storyKicker').textContent=t('SECRET COMBINATION!','发现隐藏组合！');$('storyTitle').textContent=t(c.en,c.zh);
  $('storyBody').textContent=t('Two little wishes made something much bigger. Wonder +'+c.bonus+'!','两个普通愿望竟碰出了新的奇迹！奇想 +'+c.bonus+'！');
  $('storyImage').innerHTML='<div class="combination-reveal">'+byId[c.a].icon+' <span>＋</span> '+byId[c.b].icon+' <span>＝</span> ✦</div>';
  button(t('Amazing!','太妙了！'),nextOverlay);
 }else if(o.kind==='mutation'){
  const e=endings[o.type];$('storyKicker').textContent=t('THE WHOLE TOWN TRANSFORMS!','整座城市开始变异！');$('storyTitle').textContent=t(e[1],e[0]);
  $('storyBody').textContent=t('Your choices have changed the town forever. The story is not over.','你的选择永久改变了小镇，但故事还没结束。');
  $('storyImage').innerHTML=illustrate(o.type);button(t('Look at my town','看看我的小镇'),nextOverlay);
 }else{
  const quiet=S.peace<=4;$('storyKicker').textContent=t('A SURPRISE FROM THE NEIGHBORS','居民们有了新主意');
  $('storyTitle').textContent=o.day===3?(quiet?t('Too much freedom?','自由是不是太吵了？'):t('Who owns the town square?','广场应该属于谁？')):t('The biggest party yet?','要不要举办最大的庆典？');
  $('storyBody').textContent=o.day===3?t('Some want quiet. Others want more excitement. What should the town protect?','有人想安静，有人想尽情玩。小镇应该保护哪种自由？'):t('Neighbors have started planning their own festival. How big should it become?','居民们开始筹备自己的节日。你想办多大？');
  $('storyImage').innerHTML='<div class="event-picture">'+(o.day===3?'🌿　🏘️　🎶':'🎈　🎉　🌙')+'</div>';
  button(t('Make room for everyone · harmony +2','照顾每个人 · 和谐 +2'),()=>chooseEvent('care'));
  button(t('Go all out · wonder +24, harmony −2','玩个痛快 · 奇想 +24，和谐 −2'),()=>chooseEvent('wild'),true);
 }
}
function chooseEvent(decision){
 S.events.push(decision);
 if(decision==='care'){S.peace=Math.min(10,S.peace+2);S.wonder+=6;news('Neighbors built a quiet corner together.','居民共同保留了一处安静角落。');}
 else{S.peace=Math.max(0,S.peace-2);S.wonder+=24;news('The celebration filled every street!','热闹的庆典占满了整条街！');}
 send('town_event_decided',{week:S.day});nextOverlay();
}
function nextOverlay(){overlays.shift();$('storyModal').classList.remove('show');if(overlays.length)showOverlay();else advance();}
function advance(){if(S.day===7){finish();return;}S.day++;render();}
function finish(){
 if(S.ended)return;
 S.ended=true;S.ending=type();S.grade=S.found.length>=3&&S.peace>=4?'S':S.found.length>=2?'A':S.found.length?'B':'C';
 send('town_completed-'+(goal()?'win':'lose'),{week:7,score:S.wonder+S.peace*4,grade:S.grade});
 send('town_ending_'+S.ending);
 $('endArt').innerHTML=illustrate(S.ending);endingText();$('end').classList.add('show');
 $('feedbackQuestion').hidden=false;$('feedbackThanks').hidden=true;render();
}
function endingText(){
 if(!S?.ending)return;const e=endings[S.ending];$('endTitle').textContent=t(e[1],e[0]);$('endLine').textContent=t(e[3],e[2]);
 $('endDetail').textContent=t('7 wishes · ','7 个愿望 · ')+S.found.length+t(' surprises · ',' 种组合 · ')+S.wonder+t(' wonder · Grade ',' 奇想 · 评级 ')+S.grade;
 $('endGoal').textContent=goal()?t('✓ Town dream fulfilled','✓ 小镇梦想实现'):t('◇ A surprising town, even without the perfect ending','◇ 没达成目标，却建成了意想不到的小镇');
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
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 840 460" role="img" aria-label="'+esc(t(endings[kind][1],endings[kind][0]))+'"><defs><linearGradient id="wishSky" x2="0" y2="1"><stop stop-color="'+pal[0]+'"/><stop offset="1" stop-color="'+pal[1]+'"/></linearGradient><linearGradient id="wishGrass" x2="0" y2="1"><stop stop-color="#a9ceb0"/><stop offset="1" stop-color="#588e89"/></linearGradient></defs><rect width="840" height="460" rx="18" fill="url(#wishSky)"/><circle cx="709" cy="97" r="54" fill="#fff2d1"/>'+stars+'<path d="M0 307q180-49 375-5t465-19v177H0z" fill="#ccdbc9" opacity=".8"/>'+houses+'<path d="M0 365q140-38 315 1t525-18v112H0z" fill="url(#wishGrass)"/>'+accents+'<g fill="#f9d4b2"><circle cx="225" cy="377" r="8"/><circle cx="247" cy="381" r="8"/><circle cx="593" cy="376" r="8"/><circle cx="615" cy="377" r="8"/></g><path d="M225 386v24m22-20v22m346-26v22m22-23v24" stroke="#605c88" stroke-width="10" stroke-linecap="round"/><path d="M50 402q28-88 54 0m626 4q25-92 57 0" fill="none" stroke="#e0d5ab" stroke-width="16" stroke-linecap="round"/></svg>';
}
function share(){
 const end=S.ending||type(),e=endings[end],score=S.wonder+S.peace*4;
 const message=t('My wish-powered town became '+e[1]+'! What would yours become?','我的自由小镇变成了「'+e[0]+'」！你会建出什么？');
 if(window.MorrowwishSocialShare?.open)window.MorrowwishSocialShare.open({title:t('No More Mondays: Wish Cascade','自由小镇：愿望连锁'),message,score,language:chinese()?'zh':'en',url:'https://morrowwish.vercel.app/tiny-town/',meta:{game:'tiny-town',ending:end},onShare:()=>send('town_shared-link')});
}
function postcard(){
 if(!S.ended)return;const svg=$('endArt').querySelector('svg');if(!svg)return;
 const canvas=document.createElement('canvas');canvas.width=1260;canvas.height=740;const ctx=canvas.getContext('2d'),img=new Image();
 img.onload=()=>{
  ctx.fillStyle='#fffaf5';ctx.fillRect(0,0,1260,740);ctx.drawImage(img,25,25,1210,660);
  ctx.fillStyle='#443851';ctx.font='bold 34px system-ui';ctx.fillText(t(endings[S.ending][1],endings[S.ending][0]),43,719);
  ctx.font='21px system-ui';ctx.fillText('MORROW WISH',1050,717);
  canvas.toBlob(blob=>{if(!blob)return;const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='wish-town-'+S.ending+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);},'image/png');
 };
 img.onerror=()=>alert(t('Sorry, this browser cannot render the postcard.','此浏览器无法生成明信片。'));
 img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new XMLSerializer().serializeToString(svg));send('town_postcard_clicked');
}
function start(){S.started=true;$('intro').hidden=true;render();}
function restart(){
 if(S?.started&&!S.ended)send('town_restarted-early',{week:S.day});if(S?.ended)send('town_replayed');
 S=fresh();selected='';overlays=[];$('end').classList.remove('show');$('storyModal').classList.remove('show');$('intro').hidden=true;S.started=true;send('game_retry');render();
}
function boot(){
 S=fresh();
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
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();