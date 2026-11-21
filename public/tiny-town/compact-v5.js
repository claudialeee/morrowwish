/* Tiny Town v5 — single-surface, transparent gameplay inspector */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
let opened='';
const quote=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const zh=()=>window.MorrowwishI18n?.get?.()==='zh'||document.documentElement.lang?.toLowerCase().startsWith('zh');
const t=(en,cn)=>zh()?cn:en;
function state(){return window.TownV5State?.();}
function peopleMarkup(r,i,s,byId){
 const likes=r.likes.map(x=>byId[x]).filter(Boolean);
 const dislikes=r.dislikes.map(x=>byId[x]).filter(Boolean);
 return '<article class="inspect-person" data-profile="'+i+'"><header><span class="face">'+r.face+'</span><div><strong>'+r.name+'</strong><small>'+quote(t(r.en,r.zh))+'</small></div><span class="hearts">'+('♥'.repeat(Math.ceil(s.moods[i]/2))||'♡')+'<small>'+s.moods[i]+'/6</small></span></header>'+
 '<p><b class="good">'+t('Likes','喜欢')+'</b> '+likes.map(c=>c.icon+' '+quote(t(c.en,c.zh))).join(' · ')+'</p>'+
 '<p><b class="bad">'+t('Dislikes','不喜欢')+'</b> '+(dislikes.length?dislikes.map(c=>c.icon+' '+quote(t(c.en,c.zh))).join(' · '):t('Nothing specific','暂无'))+'</p></article>';
}

function residentRibbon(){
 const v=state(),el=$('residentRibbonPeople'),hint=$('residentRibbonHint');
 if(!v||!el||!hint)return;
 const {S,residents,byId,selected}=v;
 const wish=selected&&byId[selected];
 const fans=wish?residents.filter(r=>r.likes.includes(wish.id)):[];
 const critics=wish?residents.filter(r=>r.dislikes.includes(wish.id)):[];
 if(!wish){
  hint.textContent=t('Tap a face to see their dreams','点头像看每个人的喜好');
 }else if(fans.length||critics.length){
  hint.textContent=t((fans.length?'♥ '+fans.length+' happy  ':'')+(critics.length?'↘ '+critics.length+' upset':''),(fans.length?'♥ '+fans.length+' 人喜欢  ':'')+(critics.length?'↘ '+critics.length+' 人不满':''));
 }else hint.textContent=t('This wish leaves their moods unchanged','这个愿望不会改变居民心情');
 el.innerHTML=residents.map((r,i)=>{
  const mood=S.moods[i],impact=wish?(r.likes.includes(wish.id)?1:r.dislikes.includes(wish.id)?-2:0):0;
  const moodClass=mood<=1?'sad':mood>=5?'happy':'steady',changeClass=impact>0?'likes':impact<0?'dislikes':'neutral';
  const change=wish?(impact>0?'+1':impact<0?'−2':'·'):'♥ '+mood+'/6';
  const alt=t(r.en,r.zh);
  const label=r.name+', '+alt+', '+t('mood','心情')+' '+mood+'/6'+(impact>0?t(', would enjoy this wish', '，喜欢这个愿望'):impact<0?t(', would dislike this wish','，不喜欢这个愿望'):'');
  return '<button type="button" class="resident-avatar '+moodClass+' '+changeClass+'" data-resident="'+i+'" aria-label="'+quote(label)+'" title="'+quote(label)+'">'+
  '<span class="resident-face">'+r.face+'</span><b>'+r.name+'</b><small>'+change+'</small></button>';
 }).join('');
}

function inspect(){
 const view=state();if(!view)return;
 const {S,residents,byId}=view,pane=$('townInspector'),content=$('inspectorContent');
 if(!pane||!content)return;
 pane.hidden=!opened;
 for(const [name,key] of [['tabResidents','residents'],['tabMemories','memories'],['tabDiscoveries','discoveries']]){
  const el=$(name);if(el){el.setAttribute('aria-expanded',String(opened===key));el.classList.toggle('active',opened===key);}
 }
 if(!opened)return;
 $('inspectorTitle').textContent={
  residents:t('Meet your neighbors','认识居民'),
  memories:t('Your memory book','自由生活纪念册'),
  discoveries:t('How the town works','数值与发现')
 }[opened];
 if(opened==='residents'){
  content.innerHTML='<p class="inspect-intro">'+t('You can see everyone’s preferences before choosing a wish. A liked wish adds one heart; a disliked wish removes two.','选择愿望之前，就能看到所有居民的喜好。喜欢的愿望心情 +1，不喜欢的 −2。')+'</p>'+
   residents.map((r,i)=>peopleMarkup(r,i,S,byId)).join('')+
   '<p class="inspect-note">'+t('When two neighbors fall to 1/6, harmony drops by one. If harmony reaches 2 or less, a town debate may begin.','当两位居民心情下降到 1/6，友爱会下降；友爱为 2 或更低时，可能出现需要处理的居民争议。')+'</p>';
 }else if(opened==='memories'){
  const places=window.TownFreedom?.DATA||{};
  const journeys=S.journeys||[],memories=S.memories||[];
  content.innerHTML='<p class="inspect-intro">'+t('Travel is optional. Every detail you discover gives a real reward and stays in your final postcard.','旅行和收集都不是任务。每个发现都有奖励，并会出现在最终明信片里。')+'</p>'+
  (journeys.length?'<div class="inspect-trips">'+journeys.map((id,i)=>'<div class="inspect-trip"><span>'+(places[id]?.icon||'✦')+'</span><div><strong>'+quote(t(places[id]?.en||id,places[id]?.zh||id))+'</strong><small>'+t('Free day ','自由日 ')+(i===0?'2':'5')+'</small></div></div>').join('')+'</div>':
   '<div class="inspect-empty">'+t('Your first free day arrives after day 2.','完成第二天后，就可以去体验第一段自由生活。')+'</div>')+
   '<h3>'+t('Souvenirs','纪念品')+' · '+memories.length+'</h3>'+
   (memories.length?'<div class="inspect-souvenirs">'+memories.map(m=>'<div><span>'+m.icon+'</span><small>'+quote(t(m.en,m.zh))+'</small></div>').join('')+'</div>':
   '<div class="inspect-empty">'+t('No souvenirs yet. Take your time.','还没有纪念品。慢慢来，想去哪儿就去哪儿。')+'</div>')+
   '<p class="inspect-note">'+t('Discover the first detail: +8 imagination. Second: +1 harmony. Third: +6 imagination and an early rare-wish unlock. You can return at any time.','第一个发现：想象力 +8；第二个：友爱 +1；第三个：想象力 +6，并能提前解锁传奇愿望。随时都可以返回。')+'</p>';
 }else{
  content.innerHTML='<div class="inspect-mechanics">'+
   '<section><strong>✨ '+t('Imagination','想象力')+' · '+S.wonder+'</strong><p>'+t('Reach 55 to unlock rare wishes: Flying Day, Stargazing Tower, and Midnight Market. Build adjacent combos to earn more.','达到 55 可解锁飞行自由日、观星塔、午夜市集等传奇愿望。相邻建造相关愿望，可以更快积累想象力。')+'</p></section>'+
   '<section><strong>♥ '+t('Harmony','友爱')+' · '+S.peace+'/10</strong><p>'+t('Preferences affect residents’ moods. Low harmony (2 or less) can start a town dispute, which you can resolve or embrace.','居民喜好影响心情。友爱降至 2 或以下时，可能出现居民争议，你可以协调，也可以任由小镇放飞。')+'</p></section>'+
   '<section><strong>✦ '+t('Discoveries','发现')+' · '+S.found.length+'</strong><p>'+t('Two related neighboring wishes produce a combination. Three connected wishes can create a town-wide spectacle.','相邻的两个相关愿望触发组合；三个连成一片的相关愿望可能创造整个城市的奇观。')+'</p></section>'+
   '</div><h3>'+t('Found combinations','已发现的组合')+'</h3>'+
   (S.found.length?'<div class="inspect-found">'+S.found.map(c=>'<span>✦ '+quote(t(c.en,c.zh))+'</span>').join('')+'</div>':'<div class="inspect-empty">'+t('Nothing yet. Try placing two related wishes side by side.','还没有。试试把两个相关的愿望建在一起。')+'</div>')+
   '<h3>'+t('Epic wonders','大型奇观')+'</h3>'+
   (S.legends.length?'<div class="inspect-found">'+S.legends.map(l=>'<span>'+l.icon+' '+quote(t(l.en,l.zh))+'</span>').join('')+'</div>':'<div class="inspect-empty">'+t('More secrets ahead.','还有许多惊喜尚未发现。')+'</div>');
 }
}
function render(){
 const view=state();if(!view)return;
 const s=view.S;
 residentRibbon();
 if($('wonderHint'))$('wonderHint').textContent=s.wonder>=55||s.memories.some(m=>m.i===2)?t('Rare wishes unlocked','传奇愿望已解锁'):t((55-s.wonder)+' to rare wishes','还差 '+(55-s.wonder)+' 解锁传奇');
 if($('wonderMeter'))$('wonderMeter').style.width=Math.max(0,Math.min(100,s.wonder/55*100))+'%';
 const news=s.news[0];if($('liveNotice'))$('liveNotice').textContent=news?t(news.en,news.zh):t('Choose a wish, then touch a glowing plot.','选一个愿望，再点击地图上的发光空地。');
 if($('tabMemories'))$('tabMemories').textContent=t('Memories','回忆')+' · '+s.memories.length;
 if($('tabDiscoveries'))$('tabDiscoveries').textContent=t('Wonders','发现')+' · '+(s.found.length+s.legends.length);
 inspect();
}
function toggle(section){
 opened=opened===section?'':section;
 inspect();
 if(opened){$('closeInspector')?.focus();window.arcadeMetric?.('town_info_open',{section});}
}
function boot(){
 $('residentRibbonPeople')?.addEventListener('click',e=>{
  const btn=e.target.closest?.('[data-resident]');
  if(!btn)return;
  opened='residents';inspect();
  const index=Number(btn.dataset.resident);
  const target=$('inspectorContent')?.querySelector?.('[data-profile="'+index+'"]');
  target?.scrollIntoView?.({block:'nearest',behavior:'smooth'});
  $('closeInspector')?.focus();
  window.arcadeMetric?.('town_resident_profile_open',{resident:index});
 });
 for(const [id,key] of [['tabResidents','residents'],['tabMemories','memories'],['tabDiscoveries','discoveries']])$(id)?.addEventListener('click',()=>toggle(key));
 for(const id of ['wonderStat','peaceStat','comboStat'])$(id)?.addEventListener('click',()=>{opened='discoveries';inspect();$('closeInspector')?.focus();});
 $('closeInspector')?.addEventListener('click',()=>{opened='';inspect();});
 $('townInspector')?.addEventListener('keydown',event=>{if(event.key==='Escape'){opened='';inspect();$('tabResidents')?.focus();}});
 window.addEventListener('morrowwish-language-change',()=>render());
}
window.TownV5={boot,render,toggle};
})();