/* Tiny Town v5 — single-surface, transparent gameplay inspector */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
let opened='',focusedResident=null;
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


function reactionFor(r,wish){
 if(!wish)return 0;
 return r.likes.includes(wish.id)?1:r.dislikes.includes(wish.id)?-2:0;
}

function neighborStoryNotes(s,focus){
 const moments=(s.neighborMoments||[]).filter(m=>focus==null||m.people?.includes(focus));
 if(!moments.length)return focus==null?'<p class="neighbor-archive-empty">'+t('Neighbor stories begin as you build your town.','随着小镇慢慢建成，居民之间也会发生故事。')+'</p>':'';
 return '<section class="neighbor-archive"><h3>'+t('Stories between neighbors','居民之间的故事')+'</h3>'+
  moments.map(m=>'<div class="neighbor-memory"><strong>'+m.people.join(' × ')+' · '+t('Chapter ','第')+m.phase+t('','幕')+'</strong><p>'+quote(t(m.en,m.zh))+'</p></div>').join('')+'</section>';
}

function compareResidents(residents,s,byId,wish){
 const description=t('All five at a glance. Choose a row for that person’s full profile.','五位居民的喜好一眼对比。点击某一行，查看那个人的详细档案。');
 return '<p class="inspect-intro">'+description+'</p><div class="resident-compare-list">'+residents.map((r,i)=>{
  const likes=r.likes.map(k=>byId[k]).filter(Boolean).slice(0,5);
  const dislikes=r.dislikes.map(k=>byId[k]).filter(Boolean).slice(0,4);
  const change=reactionFor(r,wish),flag=change>0?'positive':change<0?'negative':'stable';
  const forecast=wish?(change>0?'+1':change<0?'−2':'—'):'♥ '+s.moods[i]+'/6';
  return '<button type="button" class="resident-compare-row '+flag+'" data-resident-profile="'+i+'" aria-label="'+quote(r.name+', '+t('view resident profile','查看居民档案'))+'">'+
   '<span class="resident-compare-face">'+r.face+'</span><span class="resident-compare-main"><strong>'+r.name+'</strong>'+
   '<small class="resident-compare-like"><b>'+t('Likes','喜欢')+'</b> '+likes.map(x=>x.icon).join(' ')+'</small>'+
   '<small class="resident-compare-dislike"><b>'+t('Dislikes','不喜欢')+'</b> '+(dislikes.map(x=>x.icon).join(' ')||'—')+'</small></span>'+
   '<span class="resident-compare-state">'+forecast+'</span><span class="resident-compare-chevron">›</span></button>';
 }).join('')+'</div>'+
 '<p class="inspect-note">'+t('♥ Likes: mood +1. Dislikes: mood −2. The small number on each face previews your selected wish.','♥ 喜欢的愿望：心情 +1；不喜欢：心情 −2。选中愿望后，头像上的数字可预览变化。')+'</p>'+neighborStoryNotes(s,null);
}
function oneResident(residents,index,s,byId,wish){
 const r=residents[index],change=reactionFor(r,wish);
 const effect=wish?(change>0?t('This wish will cheer them up (+1 mood).','这个愿望会让他/她更开心（心情 +1）。'):change<0?t('This wish will upset them (−2 mood).','这个愿望会让他/她不高兴（心情 −2）。'):t('This wish will not change their mood.','这个愿望不会改变他/她的心情。')):t('Choose a wish to preview how this resident will respond.','先选一个愿望，就能预览这位居民是否喜欢。');
 const tone=change>0?'good':change<0?'bad':'neutral';
 return '<button type="button" class="resident-back" data-residents-all>‹ '+t('Compare all five residents','返回五人对比')+'</button>'+
 '<div class="resident-focus-card">'+peopleMarkup(r,index,s,byId)+
 '<p class="resident-impact '+tone+'">'+(wish?wish.icon+' ':'')+effect+'</p></div>'+
 '<h3 class="resident-switch-title">'+t('Switch resident','切换居民')+'</h3><div class="resident-switch-list">'+
 residents.map((p,i)=>'<button type="button" data-resident-profile="'+i+'" class="resident-switch '+(i===index?'selected':'')+'" aria-pressed="'+(i===index)+'"><span>'+p.face+'</span><small>'+p.name+'</small></button>').join('')+'</div>'+
 '<p class="inspect-note">'+t('This person’s likes, dislikes, and mood are visible from the beginning. No hidden traits.','这位居民的喜好和心情从一开始就公开，没有故意隐藏特性。')+'</p>'+neighborStoryNotes(s,r.name);
}


function legendaryPanel(v){
 const {S,byId,legendaryRules,legendaryPowers,nextLegendary,selected}=v;
 const unlocked=S.legendaryUnlocked.length;
 const next=nextLegendary;
 const explanation=t('Legendary wishes unlock one at a time, at the start of a new day. Every tier needs a little more imagination and discovery.','传奇愿望逐个解锁：每天开始时最多开放一个，后面的愿望还需要更多想象力与探索成果。');
 const progress=next?Math.min(100,Math.round(S.wonder/next.wonder*100)):100;
 return '<p class="inspect-intro">'+explanation+'</p>'+
 '<div class="legend-unlock-status"><div><strong>'+t('✦ LEGENDARY COLLECTION','✦ 传奇愿望图鉴')+'</strong><b>'+unlocked+' / '+legendaryRules.length+'</b></div>'+
 '<div class="legend-progress"><span style="width:'+progress+'%"></span></div>'+
 '<small>'+(next?t('Next: ','下一项：')+quote(t(byId[next.id].en,byId[next.id].zh))+' · '+S.wonder+'/'+next.wonder+' '+t('imagination','想象力'):t('All four legendary wishes unlocked!','四项传奇愿望全部解锁！'))+'</small></div>'+
 '<div class="legend-wish-list">'+legendaryRules.map((rule,index)=>{
  const c=byId[rule.id],power=legendaryPowers[rule.id],built=S.places.some(p=>p.id===rule.id),unlockedOne=S.legendaryUnlocked.includes(rule.id);
  const disabled=built||!unlockedOne||!S.started||S.ended,active=selected===rule.id;
  const status=built?t('Built','已建造'):!unlockedOne?t('Locked','尚未解锁'):active?t('Selected · place on map','已选中 · 去地图放置'):t('Select & build','选择并建造');
  const goals=[
   [S.wonder>=rule.wonder,S.wonder+'/'+rule.wonder+' '+t('imagination','想象力')],
   [S.day>=rule.day,t('Day ','第')+rule.day+t(' or later','天起')],
   ...(rule.combos?[[S.found.length>=rule.combos,S.found.length+'/'+rule.combos+' '+t('combos','种组合')]]:[]),
   ...(rule.epics?[[S.legends.length>=rule.epics,S.legends.length+'/'+rule.epics+' '+t('epic wonders','大型奇观')]]:[])
  ];
  const note=unlockedOne?t('Unlocked!','已解锁！'):index===unlocked?t('Next in line','下一个解锁目标'):t('Unlock the previous tier first','需先解锁前一项');
  return '<article class="legend-wish '+(built?'built':'')+(active?' active':'')+(!unlockedOne?' locked':'')+'">'+
   '<div class="legend-wish-symbol">'+c.icon+'</div><div class="legend-wish-copy"><strong>'+quote(t(c.en,c.zh))+'</strong>'+
   '<p>'+quote(t(c.descEn,c.descZh))+'</p><p class="legend-power-detail">✦ '+quote(t(power.en,power.zh))+'</p><small class="legend-power-stats">'+t('Build effect: imagination +','建造效果：想象力 +')+(c.joy+power.wonder)+' · '+t('harmony ','友爱 ')+(c.peace+power.peace>=0?'+':'')+(c.peace+power.peace)+'</small><small class="legend-tier-label">'+quote(note)+'</small></div>'+
   '<div class="legend-requirements">'+goals.map(([met,label])=>'<span class="'+(met?'met':'pending')+'">'+(met?'✓ ':'○ ')+quote(label)+'</span>').join('')+'</div>'+
   '<button type="button" class="legend-wish-action" data-legend-wish="'+rule.id+'" '+(disabled?'disabled aria-disabled="true"':'')+'>'+status+'</button></article>';
 }).join('')+'</div>'+
 '<p class="inspect-note">'+t('The third travel souvenir gives +6 imagination; it no longer unlocks the whole collection. Legendary wishes are still one-day builds and can form epic three-wish combinations.','旅行发现第三件纪念品会增加 6 点想象力，不再直接解锁整套传奇愿望。传奇愿望依然占用一天建造，也能参与大型奇观组合。')+'</p>';
}

function inspect(){
 const view=state();if(!view)return;
 const {S,residents,byId}=view,pane=$('townInspector'),content=$('inspectorContent');
 if(!pane||!content)return;
 pane.hidden=!opened;
 for(const [name,key] of [['tabResidents','residents'],['tabMemories','memories'],['tabDiscoveries','discoveries'],['tabLegends','legends']]){
  const el=$(name);if(el){el.setAttribute('aria-expanded',String(opened===key));el.classList.toggle('active',opened===key);}
 }
 if(!opened)return;
 $('inspectorTitle').textContent={
  residents:t('Meet your neighbors','认识居民'),
  memories:t('Your memory book','自由生活纪念册'),
  discoveries:t('How the town works','数值与发现'),
  legends:t('Legendary wishes','传奇愿望')
 }[opened];
 if(opened==='residents'){
  const focused=Number.isInteger(focusedResident)&&focusedResident>=0&&focusedResident<residents.length?focusedResident:null;
  const wish=view.selected&&byId[view.selected];
  $('inspectorTitle').textContent=focused===null?t('Compare neighbors','居民喜好对比'):residents[focused].name+' · '+t('Profile','个人档案');
  content.innerHTML=focused===null?compareResidents(residents,S,byId,wish):oneResident(residents,focused,S,byId,wish);
 }else if(opened==='memories'){
  const places=window.TownFreedom?.DATA||{};
  const journeys=S.journeys||[],memories=S.memories||[];
  content.innerHTML='<p class="inspect-intro">'+t('Travel is optional. Every detail you discover gives a real reward and stays in your final postcard.','旅行和收集都不是任务。每个发现都有奖励，并会出现在最终明信片里。')+'</p>'+
  (journeys.length?'<div class="inspect-trips">'+journeys.map((id,i)=>'<div class="inspect-trip"><span>'+(places[id]?.icon||'✦')+'</span><div><strong>'+quote(t(places[id]?.en||id,places[id]?.zh||id))+'</strong><small>'+t('Free day ','自由日 ')+(i===0?'2':'5')+'</small></div></div>').join('')+'</div>':
   '<div class="inspect-empty">'+t('Your first free day arrives after day 2.','完成第二天后，就可以去体验第一段自由生活。')+'</div>')+
   '<h3>'+t('Souvenirs','纪念品')+' · '+memories.length+'</h3>'+
   (memories.length?'<div class="inspect-souvenirs">'+memories.map(m=>'<div><span>'+m.icon+'</span><small>'+quote(t(m.en,m.zh))+'</small></div>').join('')+'</div>':
   '<div class="inspect-empty">'+t('No souvenirs yet. Take your time.','还没有纪念品。慢慢来，想去哪儿就去哪儿。')+'</div>')+
   '<p class="inspect-note">'+t('First discovery: +8 imagination. Second: +1 harmony. Third: +6 imagination. Build legendary progress gradually; leave whenever you like.','第一个发现：想象力 +8；第二个：友爱 +1；第三个：想象力 +6。传奇愿望逐步解锁，随时可以返回。')+'</p>';
 }else if(opened==='legends'){
  content.innerHTML=legendaryPanel(view);
 }else{
  content.innerHTML='<div class="inspect-mechanics">'+
   '<section><strong>✨ '+t('Imagination','想象力')+' · '+S.wonder+'</strong><p>'+t('Imagination advances the legendary collection. Each wish has its own milestone; combos and epic wonders unlock later tiers.','想象力可以推进传奇愿望图鉴，每项有独立门槛；后期还需要发现建筑组合与大型奇观。')+'</p></section>'+
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
 const next=view.nextLegendary;
 if($('wonderHint')){
  const missing=next?(
   s.wonder<next.wonder?t('Need '+(next.wonder-s.wonder)+' more imagination','差 '+(next.wonder-s.wonder)+' 想象力'):
   s.found.length<next.combos?t('Need '+(next.combos-s.found.length)+' combos','还需 '+(next.combos-s.found.length)+' 个组合'):
   s.legends.length<next.epics?t('Need '+(next.epics-s.legends.length)+' epic wonders','还需 '+(next.epics-s.legends.length)+' 个奇观'):
   s.day<next.day?t('Available from day '+next.day,'第 '+next.day+' 天起可解锁'):
   t('Unlocks on the next day','下一天解锁')
  ):t('All four unlocked','四项全部解锁');
  $('wonderHint').textContent=missing;
 }
 if($('wonderMeter'))$('wonderMeter').style.width=Math.max(0,Math.min(100,s.wonder/(next?.wonder||290)*100))+'%';
 const news=s.news[0];if($('liveNotice'))$('liveNotice').textContent=news?t(news.en,news.zh):t('Choose a wish, then touch a glowing plot.','选一个愿望，再点击地图上的发光空地。');
 if($('tabMemories'))$('tabMemories').textContent=t('Memories','回忆')+' · '+s.memories.length;
 if($('tabDiscoveries'))$('tabDiscoveries').textContent=t('Wonders','发现')+' · '+(s.found.length+s.legends.length);
 const legendary=$('tabLegends');
 if(legendary){
  const count=s.legendaryUnlocked.length;
  legendary.textContent=(count?'✦ ':'✧ ')+t('Legends ','传奇 ')+count+'/4';
  legendary.classList.toggle('unlocked',count>0);
  legendary.setAttribute('aria-label',t('View legendary collection, '+count+' of 4 unlocked','查看传奇愿望图鉴，已解锁 '+count+'/4'));
 }
 inspect();
}
function toggle(section){
 if(section==='residents'&&opened==='residents'&&focusedResident!==null){
  focusedResident=null;
 }else{
  opened=opened===section?'':section;
  if(section==='residents')focusedResident=null;
 }
 inspect();
 if(opened){$('closeInspector')?.focus();window.arcadeMetric?.('town_info_open',{section});}
}
function openResident(index,source){
 const v=state();
 if(!v||!Number.isInteger(index)||index<0||index>=v.residents.length)return false;
 focusedResident=index;opened='residents';inspect();
 $('closeInspector')?.focus();
 window.arcadeMetric?.('town_resident_profile_open',{resident:index,source:source||'avatar'});
 return true;
}
function boot(){
 $('residentRibbonPeople')?.addEventListener('click',e=>{
  const btn=e.target.closest?.('[data-resident]');
  if(!btn)return;
  const index=Number(btn.dataset.resident);
  if(!Number.isInteger(index)||index<0||index>=state()?.residents.length)return;
  openResident(index,'avatar');
 });
 $('inspectorContent')?.addEventListener('click',event=>{
  const legend=event.target.closest?.('[data-legend-wish]');
  if(legend){
   const id=legend.dataset.legendWish;
   const chosen=window.TownV5Actions?.selectWish?.(id);
   if(chosen){
    opened='';focusedResident=null;inspect();
    window.arcadeMetric?.('town_legendary_wish_chosen',{wish:id});
   }
   return;
  }
  const back=event.target.closest?.('[data-residents-all]');
  if(back){focusedResident=null;opened='residents';inspect();return;}
  const row=event.target.closest?.('[data-resident-profile]');
  if(!row)return;
  const index=Number(row.dataset.residentProfile),v=state();
  if(!v||!Number.isInteger(index)||index<0||index>=v.residents.length)return;
  focusedResident=index;opened='residents';inspect();
  $('inspectorContent').scrollTop=0;
  window.arcadeMetric?.('town_resident_profile_open',{resident:index});
 });
 for(const [id,key] of [['tabResidents','residents'],['tabMemories','memories'],['tabDiscoveries','discoveries'],['tabLegends','legends']])$(id)?.addEventListener('click',()=>toggle(key));
 $('wonderStat')?.addEventListener('click',()=>{opened='legends';inspect();$('closeInspector')?.focus();});
 for(const id of ['peaceStat','comboStat'])$(id)?.addEventListener('click',()=>{opened='discoveries';inspect();$('closeInspector')?.focus();});
 $('closeInspector')?.addEventListener('click',()=>{opened='';focusedResident=null;inspect();});
 $('townInspector')?.addEventListener('keydown',event=>{if(event.key==='Escape'){opened='';focusedResident=null;inspect();$('tabResidents')?.focus();}});
 window.addEventListener('morrowwish-language-change',()=>render());
}
window.TownV5={boot,render,toggle,openResident};
})();