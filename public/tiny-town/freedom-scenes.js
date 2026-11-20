/* No More Mondays — Free Days. Tiny illustrated travel experiences.
   No external assets, accounts, audio autoplay, or timers required to finish. */
(()=>{
'use strict';
const T={
 sea:{icon:'⛵',zh:'日落海岸',en:'The Sunset Coast',descZh:'海风、浪花，还有谁也不催促的黄昏。',descEn:'Salt air, pink waves, and a sunset with no curfew.',bless:'peace',amount:2,mem:['🐚','🌊','🪸'],hintsZh:['捡到一枚彩虹贝壳','让海浪带走所有计划','发现珊瑚下的小秘密'],hintsEn:['A rainbow shell','No plans, only waves','A little reef secret']},
 mountain:{icon:'🏔️',zh:'云端山谷',en:'Valley Above the Clouds',descZh:'今天不用赶路，山顶的风等着你。',descEn:'No rush. The wind is waiting at the summit.',bless:'peace',amount:2,mem:['🦋','🌼','🪁'],hintsZh:['蝴蝶陪你走了一段路','野花在无人打扰的地方盛开','放走了一只自由的风筝'],hintsEn:['A butterfly companion','Wildflowers where nobody hurries','A kite in the open sky']},
 train:{icon:'🚂',zh:'天空列车',en:'The Cloud Express',descZh:'没有终点站，下一站永远是惊喜。',descEn:'No deadlines. No final stop. Just the horizon.',bless:'wonder',amount:23,mem:['🎈','🌈','✨'],hintsZh:['车窗外漂过热气球','看见了一整道彩虹','列车驶进闪闪发光的云'],hintsEn:['A balloon floats by','A rainbow beyond the window','The sky turns to stardust']},
 stars:{icon:'🌌',zh:'银河露营',en:'Camping Under the Galaxy',descZh:'今晚的安排：什么也不安排，躺着看星星。',descEn:'Tonight’s entire plan: lie down and watch the stars.',bless:'wonder',amount:24,mem:['⭐','☄️','🪐'],hintsZh:['许了一个没有期限的愿望','捕捉到一颗流星','发现了远处的星环'],hintsEn:['A wish with no deadline','A passing shooting star','Rings around a distant planet']},
 festival:{icon:'🎪',zh:'没有终场的庆典',en:'The Endless Carnival',descZh:'没有工作日，整座城市把今天过成了节日。',descEn:'With no work tomorrow, every street becomes a festival.',bless:'wonder',amount:22,mem:['🎆','🎺','🪅'],hintsZh:['点亮了第一束烟花','陌生人也一起合唱','彩纸像星光落下来'],hintsEn:['The first firework','Strangers sing together','Confetti like starlight']},
 meadow:{icon:'🌺',zh:'花海慢生活',en:'A Day Among Wildflowers',descZh:'睡到自然醒，再在花田里待上一整天。',descEn:'Wake when you want. Lose a whole day among flowers.',bless:'peace',amount:3,mem:['🌻','🐈','🫧'],hintsZh:['一朵向你微笑的花','野猫决定陪你午睡','吹出透明的彩虹泡泡'],hintsEn:['A flower turns to greet you','A cat joins your nap','Rainbow soap bubbles']}
};
T.rest={icon:'🛌',zh:'什么也不做的一天',en:'A Day of Doing Nothing',descZh:'自由就是今天谁也不催我。',descEn:'Freedom means nobody expects a thing of me.',bless:'peace',amount:1,mem:[],hintsZh:[],hintsEn:[]};
const DAYS={2:['sea','mountain','train'],5:['stars','festival','meadow']};
const palette={
sea:['#ffe4b5','#ff9b9c','#4a9bc1','#306a9f'],
mountain:['#d7eeff','#f5c2d9','#9ac8ab','#4f8b93'],
train:['#d6c5ff','#ffc4ba','#aab4ff','#8071c4'],
stars:['#131b51','#6a4eaa','#725aa1','#292754'],
festival:['#252957','#ae65bd','#ed9bc0','#705ca9'],
meadow:['#e1faea','#ffe5c8','#abd7aa','#8cb99a']};
let active=null;
const esc=x=>String(x).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
function svg(name){
 const p=palette[name]||palette.sea,s=T[name],night=['stars','festival'].includes(name);
 const cloud=(x,y,sc)=>'<g transform="translate('+x+' '+y+') scale('+sc+')" fill="#ffffff" opacity=".65"><ellipse cx="0" cy="8" rx="72" ry="22"/><circle cx="-26" cy="-3" r="29"/><circle cx="18" cy="-10" r="36"/></g>';
 let details='';
 if(name==='sea') details='<path d="M0 354Q180 310 350 352T900 340V600H0Z" fill="#3795b6" opacity=".8"/><g transform="translate(505 274)"><path d="M0 75V-95" stroke="#fff5dc" stroke-width="7"/><path d="M-7-75Q-131 32-5 44Z" fill="#fff2cd"/><path d="M8-80Q114-16 13 29Z" fill="#ffcbad"/><path d="M-123 82h223q-68 62-157 5Z" fill="#8e6c9e"/></g><path d="M0 461Q182 417 350 458T900 447" fill="none" stroke="#f7e3da" stroke-width="16" opacity=".65"/>';
 else if(name==='mountain')details='<path d="M0 390L170 134 335 403 487 92 687 409 807 174 900 350V600H0Z" fill="#a4b9ce"/><path d="M95 252L170 134 243 263 199 239 167 218 135 242Z M414 207L487 92 569 243 516 213 493 184 456 224Z" fill="#fffafa"/><path d="M0 478Q238 375 445 467T900 442V600H0Z" fill="#7eb09e"/><path d="M0 530Q250 436 450 518T900 500V600H0Z" fill="#569487"/>';
 else if(name==='train')details='<path d="M-40 374Q300 240 590 362T950 312" fill="none" stroke="#fff7e2" stroke-width="13"/><g transform="translate(238 258) rotate(-7)"><rect width="440" height="117" rx="39" fill="#e2b4de" stroke="#fff1cf" stroke-width="11"/><rect x="46" y="29" width="80" height="50" rx="13" fill="#5d7eae"/><rect x="145" y="29" width="80" height="50" rx="13" fill="#5d7eae"/><rect x="248" y="29" width="80" height="50" rx="13" fill="#5d7eae"/><circle cx="72" cy="110" r="19" fill="#71679b"/><circle cx="355" cy="110" r="19" fill="#71679b"/></g><path d="M0 516Q250 418 500 519T900 481V600H0Z" fill="#a5afe1"/>';
 else if(name==='stars')details='<g fill="#fff9da">'+Array.from({length:35},(_,i)=>{const x=(i*193+43)%900,y=(i*71+21)%310,r=(i%3)+2;return'<circle cx="'+x+'" cy="'+y+'" r="'+r+'" opacity="'+(.45+(i%4)*.14)+'"/>';}).join('')+'</g><path d="M0 475Q205 370 438 459T900 420V600H0Z" fill="#46568c"/><path d="M50 600L195 392 319 596m190 3 140-216 187 218" stroke="#9285c7" stroke-width="40" fill="none"/><path d="M0 508Q170 488 364 533T900 505" stroke="#f1cae3" stroke-width="4" opacity=".4" fill="none"/>';
 else if(name==='festival')details='<path d="M0 440Q219 347 431 411T900 398V600H0Z" fill="#5b568a"/>'+Array.from({length:12},(_,i)=>{const x=37+i*78,y=310+((i*7)%4)*21;return '<g transform="translate('+x+' '+y+')"><path d="M-34 7L0-30 34 7" fill="#f3b4c8"/><rect x="-28" y="7" width="56" height="62" rx="7" fill="#7964a8"/><rect x="-11" y="22" width="22" height="26" rx="5" fill="#ffedb3"/></g>';}).join('')+'<path d="M55 178Q445 40 838 173" stroke="#fff0cb" stroke-width="5" fill="none" stroke-dasharray="13 16"/><g fill="#fff4bc"><circle cx="130" cy="154" r="12"/><circle cx="430" cy="101" r="15"/><circle cx="733" cy="155" r="12"/></g>';
 else details='<path d="M0 420Q197 310 431 401T900 356V600H0Z" fill="#91c5a1"/><path d="M0 487Q207 383 456 464T900 411V600H0Z" fill="#70ad8f"/>'+Array.from({length:22},(_,i)=>{const x=(i*79+24)%900,y=405+(i*27)%130;return '<g transform="translate('+x+' '+y+')"><path d="M0-14v39" stroke="#e9e5ad" stroke-width="3"/><circle cy="-23" r="14" fill="'+(i%3===0?'#ffdbb1':i%3===1?'#fbc5e1':'#eee4fa')+'"/><circle cy="-23" r="5" fill="#ebbc88"/></g>';}).join('');
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600" preserveAspectRatio="xMidYMid slice" role="img" aria-label="'+esc(s.en)+'"><defs><linearGradient id="sky-'+name+'" x2="0" y2="1"><stop stop-color="'+p[0]+'"/><stop offset=".62" stop-color="'+p[1]+'"/><stop offset="1" stop-color="'+p[2]+'"/></linearGradient><radialGradient id="sun-'+name+'"><stop stop-color="#fffbe7"/><stop offset="1" stop-color="#fff6cf" stop-opacity=".14"/></radialGradient></defs><rect width="900" height="600" fill="url(#sky-'+name+')"/><circle cx="743" cy="156" r="125" fill="url(#sun-'+name+')"/><circle cx="743" cy="156" r="47" fill="#fff7d9" opacity="'+(night?'.4':'1')+'"/>'+cloud(145,147,.8)+cloud(478,100,.5)+cloud(788,280,.65)+details+'<path d="M0 555Q180 518 450 551T900 531V600H0Z" fill="'+p[3]+'" opacity=".45"/></svg>';
}
function play(opts,onDone){
 const mount=document.getElementById('freedomModal');
 if(!mount){onDone({id:opts.day===2?'sea':'stars',count:0});return;}
 if(active){active.cleanup();active=null;}
 const day=Number(opts.day),names=(DAYS[day]||DAYS[2]),zh=!!opts.zh,txt=(en,cn)=>zh?cn:en;
 const options=names.map(id=>T[id]);
 mount.hidden=false;mount.classList.add('show');
 mount.innerHTML='<div class="freedom-shell" role="dialog" aria-modal="true" aria-label="'+esc(txt('Your free day','你的自由日'))+'">'+
 '<div class="freedom-head"><span class="freedom-eyebrow">'+txt('A DAY WITH NO OBLIGATIONS','今天，没有任何必须做的事')+'</span>'+
 '<h2>'+txt('Where would you go, if tomorrow belonged to you?','如果明天完全属于你，你想去哪里？')+'</h2><p>'+txt('Choose a place. Collect three little memories. Bring the feeling home.','挑一个地方，亲手发现三份小快乐，把这份自由带回小镇。')+'</p></div>'+
 '<div class="freedom-options">'+names.map(id=>'<button type="button" class="freedom-option" data-destination="'+id+'"><span class="freedom-preview">'+svg(id)+'</span><b>'+esc(txt(T[id].en,T[id].zh))+'</b><small>'+esc(txt(T[id].descEn,T[id].descZh))+'</small></button>').join('')+'</div>'+
 '<button class="freedom-skip" type="button">'+txt('Or just stay home and do absolutely nothing','或者今天就什么也不做，睡到自然醒')+'</button>'+
 '<div class="freedom-adventure" hidden></div></div>';
 const btns=[...mount.querySelectorAll('[data-destination]')];
 let chosen='',taken=new Set();
 const hide=()=>{mount.classList.remove('show');mount.hidden=true;mount.innerHTML='';active=null;};
 active={cleanup:hide};
 function stage(id){
  chosen=id;taken=new Set();
  const travel=T[id];
  mount.querySelector('.freedom-head').innerHTML='<span class="freedom-eyebrow">'+txt('LIVE YOUR OWN STORY','这一天由你决定')+'</span><h2>'+esc(txt(travel.en,travel.zh))+'</h2><p>'+esc(txt(travel.descEn,travel.descZh))+'</p>';
  mount.querySelector('.freedom-options').hidden=true;mount.querySelector('.freedom-skip').hidden=true;
  const pane=mount.querySelector('.freedom-adventure');pane.hidden=false;
  pane.innerHTML='<div class="freedom-paint" data-destination="'+id+'">'+svg(id)+
  '<div class="freedom-hotspots">'+travel.mem.map((em,i)=>'<button type="button" class="freedom-collect c'+i+'" data-memory="'+i+'" aria-label="'+esc(txt('Discover a memory','发现小回忆'))+'"><span>'+em+'</span></button>').join('')+'</div>'+
  '<div class="freedom-glow" aria-hidden="true"></div></div>'+
  '<div class="freedom-finding"><strong id="foundCount">'+txt('0 / 3 memories','已发现 0 / 3 份快乐')+'</strong><span id="foundMessage">'+txt('Tap three glowing details in the scene.','点击风景中三个发光的小惊喜。')+'</span></div>'+
  '<button type="button" class="freedom-finish" hidden>'+txt('Bring this happiness home','把这份快乐带回小镇')+'</button>';
  pane.querySelectorAll('[data-memory]').forEach(button=>button.addEventListener('click',()=>{
   const i=Number(button.dataset.memory);
   if(taken.has(i))return;
   taken.add(i);button.classList.add('found');button.setAttribute('aria-pressed','true');
   pane.querySelector('#foundCount').textContent=txt(taken.size+' / 3 memories','已发现 '+taken.size+' / 3 份快乐');
   pane.querySelector('#foundMessage').textContent=txt(travel.hintsEn[i],travel.hintsZh[i]);
   if(taken.size>=3){pane.querySelector('.freedom-finish').hidden=false;pane.querySelector('.freedom-glow').classList.add('burst');}
  }));
  pane.querySelector('.freedom-finish').onclick=()=>{if(taken.size!==3)return;hide();onDone({id,day,count:taken.size,bless:travel.bless,amount:travel.amount,zh:travel.zh,en:travel.en});};
 }
 btns.forEach(btn=>btn.onclick=()=>stage(btn.dataset.destination));
 const skip=mount.querySelector('.freedom-skip');
 skip.onclick=()=>{hide();onDone({id:'rest',day,count:0,bless:'peace',amount:1,zh:T.rest.zh,en:T.rest.en});};
}
window.TownFreedom={play,svg,DATA:T,DAYS};
})();