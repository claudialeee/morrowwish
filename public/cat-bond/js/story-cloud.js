/* Cat Bond: The Last Page story campaign + encrypted cross-device save.
   The original cat art, combat engine, local save key and five region maps stay intact. */
(()=>{
'use strict';
const SAVE_KEY='catbond_save_v1';
const CLOUD_KEY='catbond_cloud_key_v1';
const REV_KEY='catbond_cloud_revision_v1';
const SYNC_KEY='catbond_cloud_synced_at_v1';
const CLOUD_PAUSE_KEY='catbond_cloud_paused_v1';
const CODE_PREFIX='CB1.';
const REGIONS=['home','sakura','creek','volcano','ruins'];
const REGION_PAGES={
 home:{id:'home-bell',title:'庭院门口的铃声',titleEn:'The Bell at the Garden Gate',
  text:'很久以前，有两只小猫约好：无论走到多远，只要听见星铃，就一定要回来。你记得那只猫的影子，却想不起它的名字。',
  textEn:'Long ago, two kittens made a promise: wherever life took them, they would return when the Star Bell rang. You remember a small shadow beside you, but not its name.',
  region:'home',chapter:'第一章 · 空白页',chapterEn:'CHAPTER I · THE BLANK PAGE'},
 sakura:{id:'sakura-promise',title:'花瓣下的约定',titleEn:'A Promise Beneath the Petals',
  text:'樱花神社的旧签写着：星铃只能敲响一次。那一天，你把铃绳交给了最信任的伙伴。',
  textEn:'An old shrine fortune says the Star Bell may be rung only once. On that day, you placed its cord in the paws of the one you trusted most.',
  region:'sakura',chapter:'第二章 · 旧约',chapterEn:'CHAPTER II · THE OLD PROMISE'},
 creek:{id:'creek-name',title:'被河水带走的名字',titleEn:'The Name the River Carried',
  text:'溪水映出一段模糊的画面：你主动交出了自己的名字。那不是被夺走的惩罚，而是你亲手做出的选择。',
  textEn:'The creek reflects a blurred memory: you gave your name away willingly. It was not taken as punishment. It was your choice.',
  region:'creek',chapter:'第三章 · 失去的名字',chapterEn:'CHAPTER III · THE LOST NAME'},
 volcano:{id:'volcano-seal',title:'星铃灾变',titleEn:'The Star Bell Catastrophe',
  text:'火山深处的余烬记得真相：灾变从星铃内部爆发。你留在钟中封住裂隙，把自己的记忆化作最后一道封印。',
  textEn:'The embers remember what happened: the catastrophe erupted from inside the Star Bell. You stayed within it to seal the breach, turning your own memories into the final lock.',
  region:'volcano',chapter:'第四章 · 最后的守铃者',chapterEn:'CHAPTER IV · THE LAST BELLKEEPER'},
 ruins:{id:'ruins-reverse',title:'倒着响的钟',titleEn:'The Bell That Rings Backward',
  text:'月影遗迹的星盘开始逆转。你终于明白：一路找回的旋律，不只是在修复记忆——它们也在替某个人重新启动逆响仪式。',
  textEn:'The astrolabe begins to turn backward. The melodies you have recovered are not only restoring memories. They are also restarting a reversed-bell ritual for someone.',
  region:'ruins',chapter:'第五章 · 逆响',chapterEn:'CHAPTER V · THE REVERSED BELL'}
};
const LAST_PAGE={
 id:'last-page',title:'最后一页：暮铃',titleEn:'The Last Page: Muling',
 text:'呼唤你的声音来自暮铃——你曾经最重要的伙伴。封印灾变时，你牺牲名字与记忆；暮铃却只看见你消失，以为自己被抛弃。它成为“逆响之主”，吸收其他猫咪的记忆，只为把你带回来。你找回的六段旋律，正是它复活你的仪式。',
 textEn:'The voice belongs to Muling, once your closest companion. You sacrificed your name and memories to seal the catastrophe; Muling only saw you disappear and believed you had abandoned them. Now the Lord of the Reversed Bell absorbs other cats’ memories to bring you back. The six melodies you recovered are the ritual that will revive you.',
 region:'ruins',chapter:'终章 · 最后一页',chapterEn:'FINAL CHAPTER · THE LAST PAGE'
};
const PROLOGUE=[
 {region:'home',kicker:'猫猫纽带 · 最后一页',kickerEn:'CAT BOND · THE LAST PAGE',
  title:'每只猫，都有一页自己的故事。',titleEn:'Every cat has a page of its own.',
  text:'在这片世界，名字、经历与羁绊，都被写进一本会呼吸的书——Catdex。它记录每只猫曾经是谁，也记得它们与谁并肩。',
  textEn:'In this world, names, memories and bonds are written in a living book: the Catdex. It remembers who every cat has been, and who stood beside them.'},
 {region:'sakura',kicker:'空白蔓延之地',kickerEn:'THE HOLLOW',
  title:'被遗忘的地方，会慢慢变空。',titleEn:'Where memories vanish, the world grows hollow.',
  text:'当一段重要记忆消失，Catdex 就会留下空白。空白蔓延之处，被称为 Hollow。没有名字的猫，也会逐渐从世界上消失。',
  textEn:'When an important memory disappears, the Catdex leaves a blank page. Where the blankness spreads, the world becomes Hollow. A nameless cat can slowly vanish from it.'},
 {region:'creek',kicker:'初醒之时',kickerEn:'A STRANGE AWAKENING',
  title:'你在一座安静的庭院醒来。',titleEn:'You wake in a quiet garden.',
  text:'你没有名字，也想不起自己从哪里来。但你能听见空白页的声音——那是一声倒着响的铃。',
  textEn:'You have no name and no memory of where you came from. Yet you can hear the blank pages: a bell ringing backward.'},
 {region:'volcano',kicker:'星铃中的声音',kickerEn:'A VOICE IN THE BELL',
  title:'远处有人在呼唤你。',titleEn:'Someone is calling from beyond the bell.',
  text:'“这一次，我不会再让你离开。”声音很轻，却像等了很久。你不知道它是谁，只知道它认得你。',
  textEn:'“This time, I will not let you leave again.” The voice is quiet, but it sounds as if it has waited a very long time. You do not know who it is. It knows you.'},
 {region:'ruins',kicker:'旅程开始',kickerEn:'YOUR JOURNEY BEGINS',
  title:'去找回那些被抹去的名字。',titleEn:'Find the names that were erased.',
  text:'探索五片土地，结识新的伙伴，收集散落的记忆。可那本书似乎早已为你留好最后一页。',
  textEn:'Explore five lands, meet new companions and gather the memories scattered across the world. Yet the book seems to have reserved its final page for you.'}
];
const ENDING=[
 {region:'ruins',kicker:'逆响之钟归于沉寂',kickerEn:'THE REVERSED BELL FALLS SILENT',
  title:'暮铃终于停下了。',titleEn:'At last, Muling falls silent.',
  text:'六道记忆锁在伙伴们的羁绊中逐一解开。逆响停止，其他猫咪的名字与记忆从钟声里回到它们身边。',
  textEn:'One by one, the six memory locks yield to the bonds you have built. The reversed bell falls silent, and every stolen name and memory returns to its owner.'},
 {region:'volcano',kicker:'记忆归来',kickerEn:'THE MEMORY RETURNS',
  title:'你从未抛下暮铃。',titleEn:'You never abandoned Muling.',
  text:'暮铃终于看见那一天的完整记忆：你不是离开它，而是留下来封住灾变。它等了这么久，却一直把牺牲当成了告别。',
  textEn:'Muling finally sees the whole memory: you did not leave them. You stayed behind to seal the catastrophe. They waited all this time, mistaking your sacrifice for goodbye.'},
 {region:'creek',kicker:'另一种羁绊',kickerEn:'A DIFFERENT KIND OF BOND',
  title:'羁绊不是把谁留在原地。',titleEn:'A bond is not a chain.',
  text:'你没有要求暮铃忘记过去，也没有答应永远不再离开。你们选择从今天开始重新同行——这一次，不再靠夺取记忆证明彼此重要。',
  textEn:'You do not ask Muling to forget the past, and you do not promise never to leave again. You choose to walk together from today—not by taking memories, but by making new ones.'},
 {region:'ruins',kicker:'CATDEX · 第一页',kickerEn:'THE CATDEX · PAGE ONE',
  title:'最后一页，写回了你的名字。',titleEn:'The last page writes your name again.',
  text:'Catdex 恢复了你曾经的记忆，却没有抹去现在的你。第一页记录着你的新名字、你的伙伴，以及你们共同完成的故事。',
  textEn:'The Catdex restores your old memories without erasing who you are now. Its first page records your new name, your companions and the story you wrote together.'},
 {region:'home',kicker:'新的清晨',kickerEn:'A NEW MORNING',
  title:'星铃再次响起。',titleEn:'The Star Bell rings once more.',
  text:'清晨，你和暮铃坐在庭院门口。伙伴们在阳光里追逐，Catdex 翻开了新的空白页。故事没有回到从前——它终于有了未来。',
  textEn:'At dawn, you and Muling sit by the garden gate. Your companions chase the sunlight, and the Catdex opens a fresh blank page. The story does not return to what it was. At last, it has a future.'}
];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const isZh=()=>window.MorrowwishI18n?.get?.()==='zh';
const t=(zh,en)=>isZh()?zh:en;
function readLocal(){
 try{const raw=localStorage.getItem(SAVE_KEY);return raw?JSON.parse(raw):{};}catch{return {};}
}
function writeLocal(data){
 try{localStorage.setItem(SAVE_KEY,JSON.stringify(data));return true;}catch{return false;}
}
function state(){return window.State?.S||null;}
function save(){try{window.State?.save?.();}catch(error){console.warn('Cat Bond story save failed',error);}}
function storyState(){
 const S=state();if(!S)return null;
 if(!S.story||typeof S.story!=='object')S.story={};
 const story=S.story;
 if(!Array.isArray(story.fragments))story.fragments=[];
 if(!story.visited||typeof story.visited!=='object')story.visited={};
 if(!story.version)story.version=1;
 if(!story.migrated){
  const old=S.worldmap?.regions||{};
  for(const id of REGIONS){
   const progress=old[id];
   if(progress&&Number(progress.explored)>0){
    story.visited[id]=true;
    const page=REGION_PAGES[id];
    if(page&&!story.fragments.includes(page.id))story.fragments.push(page.id);
   }
  }
  // A previously collected ruins secret is revealed only after all five
  // regional memories have been restored (see onRegionEntered below).
  story.migrated=true;
  save();
 }
 return story;
}
function hasAllRegionPages(s){
 return REGIONS.every(id=>s.fragments.includes(REGION_PAGES[id].id));
}
function allSix(s){return hasAllRegionPages(s)&&s.fragments.includes(LAST_PAGE.id);}
function markFragment(id){
 const s=storyState();if(!s)return false;
 if(s.fragments.includes(id))return false;
 s.fragments.push(id);s.fragments=[...new Set(s.fragments)];
 save();updateTracker();return true;
}
const artCache=new Map();
function drawBackdrop(canvas,region){
 if(!canvas)return;
 const ctx=canvas.getContext('2d');if(!ctx)return;
 const dpr=Math.min(window.devicePixelRatio||1,2);
 const rect=canvas.getBoundingClientRect();
 const w=Math.max(1,Math.round((rect.width||900)*dpr)),h=Math.max(1,Math.round((rect.height||560)*dpr));
 if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
 ctx.clearRect(0,0,w,h);
 let art=artCache.get(region);
 if(!art&&window.CatBondPaintedRegions?.build){
  art=window.CatBondPaintedRegions.build(region,1800,1300);if(art)artCache.set(region,art);
 }
 if(art){
  const scale=Math.max(w/art.width,h/art.height),sw=w/scale,sh=h/scale;
  const sx=Math.max(0,(art.width-sw)*.5),sy=Math.max(0,(art.height-sh)*.5);
  ctx.drawImage(art,sx,sy,sw,sh,0,0,w,h);
 }else{
  const g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,'#29233f');g.addColorStop(1,'#111522');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
 }
 const shade=ctx.createLinearGradient(0,0,0,h);
 shade.addColorStop(0,'rgba(14,17,31,.16)');shade.addColorStop(.48,'rgba(12,14,28,.38)');shade.addColorStop(1,'rgba(10,12,24,.88)');
 ctx.fillStyle=shade;ctx.fillRect(0,0,w,h);
 const x=w*.76,y=h*.28,r=Math.min(w,h)*.16;
 const glow=ctx.createRadialGradient(x,y,2,x,y,r*2.6);
 glow.addColorStop(0,'rgba(255,224,156,.42)');glow.addColorStop(.25,'rgba(255,194,121,.16)');glow.addColorStop(1,'rgba(255,194,121,0)');
 ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
 // The bell is a story emblem, not a substitute cat illustration.
 ctx.save();ctx.translate(x,y);ctx.strokeStyle='rgba(255,231,183,.72)';ctx.lineWidth=Math.max(1.2,dpr*1.4);
 ctx.shadowColor='rgba(255,213,139,.65)';ctx.shadowBlur=18*dpr;
 ctx.beginPath();ctx.arc(0,0,r*.78,0,Math.PI*2);ctx.stroke();
 ctx.beginPath();ctx.moveTo(-r*.24,-r*.08);ctx.quadraticCurveTo(-r*.24,-r*.55,0,-r*.57);
 ctx.quadraticCurveTo(r*.24,-r*.55,r*.24,-r*.08);ctx.lineTo(r*.4,r*.31);
 ctx.quadraticCurveTo(0,r*.48,-r*.4,r*.31);ctx.closePath();ctx.stroke();
 ctx.beginPath();ctx.arc(0,r*.4,r*.08,0,Math.PI*2);ctx.stroke();ctx.restore();
}
function renderPortraits(root){
 const S=state(),cat=S?.cats?.find(c=>c.uid===S.battlePrefs?.teamUids?.[0])||S?.cats?.[0];
 const player=root.querySelector('[data-cb-player-portrait]');
 if(player&&cat&&window.CatArt?.renderCatThumb)
  window.CatArt.renderCatThumb(player,window.GameData?.speciesById?.(cat.species),cat);
 const muling=root.querySelector('[data-cb-muling-portrait]');
 const sp=bossSpecies();
 if(muling&&sp&&window.CatArt?.renderCatThumb)window.CatArt.renderCatThumb(muling,sp);
}
function showSequence(kind,pages,done,options={}){
 document.querySelector('.cb-story-overlay')?.remove();
 let index=0,closed=false;
 const overlay=document.createElement('div');
 overlay.className='cb-story-overlay';
 overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');
 overlay.innerHTML='<div class="cb-story-scene"><canvas class="cb-story-art" aria-hidden="true"></canvas><div class="cb-story-scene-glow"></div>'+
  '<div class="cb-story-scene-mark" aria-hidden="true">✦</div></div>'+
  '<section class="cb-story-card"><div class="cb-story-card-top"><span class="cb-story-brand">MORROW · WISH</span><span class="cb-story-step"></span></div>'+
  '<p class="cb-story-kicker"></p><h1 class="cb-story-title"></h1><p class="cb-story-copy"></p>'+
  '<div class="cb-story-portraits"><figure><canvas data-cb-player-portrait width="180" height="150"></canvas><figcaption></figcaption></figure>'+
  '<span class="cb-story-portrait-link" aria-hidden="true">✦</span><figure><canvas data-cb-muling-portrait width="180" height="150"></canvas><figcaption></figcaption></figure></div>'+
  '<div class="cb-story-progress"></div><div class="cb-story-actions"><button type="button" class="cb-story-skip"></button><button type="button" class="cb-story-next"></button></div></section>';
 document.body.append(overlay);
 const canvas=overlay.querySelector('.cb-story-art');
 const render=()=>{
  const page=pages[index],en=!isZh();
  drawBackdrop(canvas,page.region||'home');
  overlay.querySelector('.cb-story-step').textContent=String(index+1).padStart(2,'0')+' / '+String(pages.length).padStart(2,'0');
  overlay.querySelector('.cb-story-kicker').textContent=en?(page.kickerEn||page.chapterEn||'THE LAST PAGE'):(page.kicker||page.chapter||'最后一页');
  overlay.querySelector('.cb-story-title').textContent=en?(page.titleEn||page.title):(page.title||page.titleEn);
  overlay.querySelector('.cb-story-copy').textContent=en?(page.textEn||page.text):(page.text||page.textEn);
  const mulingCaption=overlay.querySelector('.cb-story-portraits figure:last-child figcaption');
  if(mulingCaption)mulingCaption.textContent=t('暮铃','Muling');
  const progress=overlay.querySelector('.cb-story-progress');
  progress.innerHTML=pages.map((_,i)=>'<span class="'+(i<=index?'is-lit':'')+'"></span>').join('');
  const portraits=overlay.querySelector('.cb-story-portraits');
  const showPortraits=kind==='ending'&&index===pages.length-1;
  portraits.classList.toggle('is-visible',showPortraits);
  if(showPortraits){
   renderPortraits(overlay);
   const S=state(),cat=S?.cats?.find(c=>c.uid===S.battlePrefs?.teamUids?.[0])||S?.cats?.[0];
   const fig=overlay.querySelector('.cb-story-portraits figure:first-child figcaption');
   if(fig)fig.textContent=cat?window.State.catName(cat):t('你','You');
  }
  overlay.querySelector('.cb-story-skip').textContent=options.canSkip===false?'':t('跳过','Skip');
  overlay.querySelector('.cb-story-skip').hidden=options.canSkip===false;
  overlay.querySelector('.cb-story-next').textContent=index===pages.length-1
   ?(kind==='ending'?t('写下新篇章','Begin the next chapter'):t('继续冒险','Continue'))
   :t('下一页','Next');
 };
 const close=()=>{
  if(closed)return;closed=true;
  window.removeEventListener('morrowwish-language-change',render);
  overlay.classList.add('is-leaving');
  setTimeout(()=>{overlay.remove();done?.();},220);
 };
 overlay.querySelector('.cb-story-next').onclick=()=>{
  if(index<pages.length-1){index++;render();}else close();
 };
 overlay.querySelector('.cb-story-skip').onclick=close;
 window.addEventListener('morrowwish-language-change',render);
 requestAnimationFrame(()=>overlay.classList.add('is-visible'));
 render();
}
function persistIntroSeen(){
 const data=readLocal();data.story=data.story&&typeof data.story==='object'?data.story:{};
 data.story.version=1;data.story.introSeen=true;
 writeLocal(data);
 if(state()){state().story=data.story;}
}
function startPrologue(done){
 showSequence('prologue',PROLOGUE,()=>{
  persistIntroSeen();done?.();
 },{canSkip:true});
}
function afterPanelClosed(callback,attempt=0){
 const panel=document.getElementById('panel');
 if(panel?.classList.contains('open')&&attempt<40){
  setTimeout(()=>afterPanelClosed(callback,attempt+1),250);return;
 }
 callback();
}
function onRegionEntered(id){
 const s=storyState();if(!s||!REGIONS.includes(id))return;
 if(!s.introSeen)return;
 let pages=[];
 if(!s.visited[id]){
  s.visited[id]=true;
  const page=REGION_PAGES[id];
  if(page){markFragment(page.id);pages.push(page);}
 }
 const ruinsNodes=state()?.worldmap?.regions?.ruins?.nodes||[];
 if(id==='ruins'&&hasAllRegionPages(s)&&ruinsNodes.includes('ruins_secret')&&!s.fragments.includes(LAST_PAGE.id)){
  markFragment(LAST_PAGE.id);pages.push(LAST_PAGE);
 }
 if(pages.length){
  save();
  setTimeout(()=>afterPanelClosed(()=>showSequence('memory',pages,()=>{updateTracker();if(allSix(storyState()))showBossReveal();})),140);
 }else{
  updateTracker();
  if(allSix(s)&&!s.bossDefeated&&id==='ruins')setTimeout(showBossReveal,140);
 }
}
function onRegionDiscovery(regionId,reward){
 if(regionId!=='ruins'||reward?.discovery?.id!=='ruins')return;
 const s=storyState();if(!s||!s.introSeen||!hasAllRegionPages(s))return;
 if(markFragment(LAST_PAGE.id)){
  setTimeout(()=>afterPanelClosed(()=>showSequence('reveal',[LAST_PAGE],()=>{
   if(allSix(storyState()))showBossReveal();
  })),220);
 }
}
function updateTracker(){
 const host=document.getElementById('cb-story-tracker');
 const game=window.__game;
 if(!host||!game||!window.__CAT_BOND_STARTED__)return;
 const s=storyState();if(!s)return;
 const visible=game.scene==='map';
 host.classList.toggle('is-visible',visible);
 const count=Math.min(6,s.fragments.length);
 const nextRegion=REGIONS.find(id=>!s.fragments.includes(REGION_PAGES[id].id));
 const regionLabels={
  home:['阳光花园','Sunlit Garden'],sakura:['樱花林','Sakura Woods'],
  creek:['溪谷','Creek Valley'],volcano:['火山口','Volcano'],ruins:['月影遗迹','Moonshadow Ruins']
 };
 const next=nextRegion
  ?(isZh()?'探索'+regionLabels[nextRegion][0]+'，寻找记忆回声。':'Explore '+regionLabels[nextRegion][1]+' for its memory echo.')
  :!s.fragments.includes(LAST_PAGE.id)
    ?t('在月影遗迹找到隐藏的星光匣，揭开最后一页。','Find the hidden star box in Moonshadow Ruins to reveal the last page.')
    :s.bossDefeated?t('暮铃已被唤回。打开故事手册重温结局。','Muling has returned. Open the journal to revisit the ending.')
    :t('前往月影遗迹，面对逆响之主。','Return to Moonshadow Ruins and face the Lord of the Reversed Bell.');
 host.querySelector('.cb-story-tracker-count').textContent=count+'/6';
 host.querySelector('.cb-story-tracker-next').textContent=next;
 host.querySelector('.cb-story-tracker-title').textContent=s.completed?t('最后一页 · 已完成','The Last Page · Complete'):t('主线 · 最后一页','MAIN STORY · THE LAST PAGE');
}
function openJournal(){
 const s=storyState();if(!s)return;
 const pages=[...REGIONS.map(id=>REGION_PAGES[id]),LAST_PAGE];
 const fragments=pages.map((p,i)=>{
  const found=s.fragments.includes(p.id);
  return '<li class="'+(found?'is-found':'')+'"><span class="cb-journal-mark">'+(found?'✦':'◇')+'</span><span><strong>'+
   esc(found?t(p.title,p.titleEn):t('尚未找回的记忆','Memory not yet recovered'))+'</strong><small>'+
   esc(found?t(p.chapter,p.chapterEn):t('探索对应区域，寻找记忆回声','Explore its region to find the memory echo'))+'</small></span></li>';
 }).join('');
 const overlay=document.createElement('div');overlay.className='cb-cloud-overlay cb-journal-overlay';
 overlay.innerHTML='<section class="cb-cloud-card cb-journal-card"><button class="cb-cloud-close" type="button" aria-label="Close">×</button>'+
  '<p class="cb-cloud-eyebrow">CAT BOND · THE LAST PAGE</p><h2>'+t('故事手册','Story Journal')+'</h2>'+
  '<p class="cb-cloud-lead">'+t('六段记忆，五片土地。你正在找回谁的故事？','Six memories. Five lands. Whose story are you restoring?')+'</p>'+
  '<div class="cb-journal-meter"><strong>'+s.fragments.length+'/6</strong><span>'+t('已找回的记忆','Memories recovered')+'</span></div>'+
  '<ol class="cb-journal-list">'+fragments+'</ol>'+
  '<p class="cb-journal-status">'+(s.completed?t('结局已解锁：星铃再次响起。','Ending unlocked: the Star Bell rings again.'):allSix(s)?t('所有记忆已集齐。回到月影遗迹，完成最后的对决。','All memories are found. Return to Moonshadow Ruins for the final confrontation.'):t('继续探索地图，寻找每片土地留下的记忆。','Keep exploring the map to uncover each land’s memory.'))+'</p>'+
  '<div class="cb-cloud-actions"><button class="cb-cloud-primary" data-journal-action="continue">'+(allSix(s)&&!s.bossDefeated?t('前往最终对决','Go to final confrontation'):t('继续探索','Continue exploring'))+'</button>'+
  (s.completed?'<button class="cb-cloud-secondary" data-journal-action="ending">'+t('重看结局动画','Replay ending')+'</button>':'')+
  '<button class="cb-cloud-secondary" data-journal-action="cloud">'+t('云存档','Cloud save')+'</button></div></section>';
 document.body.append(overlay);
 const close=()=>{window.removeEventListener('morrowwish-language-change',rerender);overlay.remove();};
 const rerender=()=>{close();openJournal();};
 window.addEventListener('morrowwish-language-change',rerender);
 overlay.querySelector('.cb-cloud-close').onclick=close;
 overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
 overlay.querySelector('[data-journal-action="continue"]').onclick=()=>{
  close();
  if(allSix(storyState())&&!storyState().bossDefeated){
   if(window.__game?.scene==='map'&&window.WorldMap?.currentRegion==='ruins')showBossReveal();
   else openWorldMapForBoss();
  }else openWorldMapForBoss();
 };
 overlay.querySelector('[data-journal-action="cloud"]')?.addEventListener('click',()=>{close();openCloudPanel();});
 overlay.querySelector('[data-journal-action="ending"]')?.addEventListener('click',()=>{close();playEnding(true);});
}
function openWorldMapForBoss(){
 const game=window.__game;if(!game)return;
 if(game.scene==='yard'){game.openWorldMap();return;}
 if(game.scene==='map'&&window.WorldMap?.currentRegion!=='ruins'){
  window.UI?.openMapChooser?.();return;
 }
 if(game.scene==='map'&&window.WorldMap?.currentRegion==='ruins'&&!state()?.story?.bossDefeated)
  showBossReveal();
}
function showBossReveal(){
 const s=storyState();if(!s||!allSix(s)||s.bossDefeated)return;
 document.querySelector('.cb-story-overlay')?.remove();
 showSequence('reveal',[{
  region:'ruins',kicker:'最后一页',kickerEn:'THE LAST PAGE',
  title:'那道声音，终于有了名字。',titleEn:'The voice finally has a name.',
  text:'暮铃就在星盘另一端。六段旋律已经启动逆响仪式。现在，你必须阻止它继续夺走其他猫咪的记忆。',
  textEn:'Muling is waiting beyond the astrolabe. The six melodies have started the reversed-bell ritual. You must stop it before more memories are taken.'
 }],()=>showBossGate(),{canSkip:false});
}
function bossSpecies(){
 const base=window.GameData?.speciesById?.('xingchen');
 if(!base)return null;
 const team=window.UI?.getPreferredBattleTeam?.()||state()?.cats||[];
 const avg=team.length?team.reduce((n,c)=>n+(c.level||1),0)/team.length:1;
 return {...base,id:'xingchen',name:'暮铃·逆响之主',nameEn:'Muling, Lord of the Reversed Bell',
  palette:'black',pattern:'spotted',eyeColor:'#e5b6ff',point:'#79648f',fluffy:true,ears:'tufted',
  desc:'被逆向星铃吞噬记忆后显现的暮铃。',encounterLevel:Math.max(10,Math.round(avg+3)),
  base:{pow:26,agi:23,vit:30,cha:26},__storyBoss:true};
}
function showBossGate(){
 const overlay=document.createElement('div');overlay.className='cb-cloud-overlay cb-boss-overlay';
 overlay.innerHTML='<section class="cb-cloud-card cb-boss-card"><p class="cb-cloud-eyebrow">'+t('终章 · 逆响之钟','FINAL CHAPTER · THE REVERSED BELL')+'</p>'+
  '<h2>'+t('暮铃 · 逆响之主','Muling · Lord of the Reversed Bell')+'</h2>'+
  '<p class="cb-cloud-lead">'+t('它不是为了毁灭世界而战。它只是想让你回来——哪怕代价是夺走所有人的记忆。','Muling does not fight to destroy the world. It only wants you back—even if every other memory must be taken.')+'</p>'+
  '<div class="cb-boss-emblem">✧</div><p>'+t('带上两位最信任的伙伴，结束逆响仪式。','Bring the two companions you trust most and end the reversed-bell ritual.')+'</p>'+
  '<div class="cb-cloud-actions"><button class="cb-cloud-primary" data-boss-start>'+t('开始最终战','Begin final battle')+'</button>'+
  '<button class="cb-cloud-secondary" data-boss-later>'+t('稍后再战','Not yet')+'</button></div></section>';
 document.body.append(overlay);
 const close=()=>{window.removeEventListener('morrowwish-language-change',rerender);overlay.remove();};
 const rerender=()=>{close();showBossGate();};
 window.addEventListener('morrowwish-language-change',rerender);
 overlay.querySelector('[data-boss-later]').onclick=close;
 overlay.querySelector('[data-boss-start]').onclick=()=>{close();startBoss();};
}
function startBoss(){
 const game=window.__game,boss=bossSpecies();
 if(!game||!boss){showBossGate();return;}
 const team=window.UI?.getPreferredBattleTeam?.()||state()?.cats?.slice(0,5)||[];
 if(!team.length){openJournal();return;}
 const region=window.WorldMap?.REGIONS?.find(r=>r.id==='ruins');
 game._returnScene='map';game._battleTheme=region?.theme||{region:'ruins'};
 game.startBattle(team,boss,{storyBoss:true,pack:[boss]});
}
function showBossRetry(){
 const overlay=document.createElement('div');overlay.className='cb-cloud-overlay cb-boss-overlay';
 overlay.innerHTML='<section class="cb-cloud-card cb-boss-card"><p class="cb-cloud-eyebrow">'+t('逆响仍在继续','THE BELL IS STILL RINGING')+'</p>'+
  '<h2>'+t('逆响仍未停止','The reversed bell still rings')+'</h2>'+
  '<p class="cb-cloud-lead">'+t('暮铃的记忆还被困在星铃里。调整队伍、恢复状态，再试一次。','Muling’s memories are still trapped in the Star Bell. Adjust your team, recover, and try again.')+'</p>'+
  '<div class="cb-cloud-actions"><button class="cb-cloud-primary" data-retry>'+t('再次挑战','Try again')+'</button>'+
  '<button class="cb-cloud-secondary" data-journal>'+t('查看故事手册','Open journal')+'</button></div></section>';
 document.body.append(overlay);
 const close=()=>{window.removeEventListener('morrowwish-language-change',rerender);overlay.remove();};
 const rerender=()=>{close();showBossRetry();};
 window.addEventListener('morrowwish-language-change',rerender);
 overlay.querySelector('[data-retry]').onclick=()=>{close();startBoss();};
 overlay.querySelector('[data-journal]').onclick=()=>{close();openJournal();};
}
function playEnding(replay=false){
 const s=storyState();if(!s)return;
 if(!replay&&!s.bossDefeated)return;
 s.completed=true;s.endingSeen=true;s.playerRecorded=true;
 const lead=state()?.cats?.find(c=>c.uid===state()?.battlePrefs?.teamUids?.[0])||state()?.cats?.[0];
 s.recordedUid=lead?.uid||'';
 save();
 showSequence('ending',ENDING,()=>{
  window.WorldMap?.exitToYard?.();
  updateTracker();
 },{canSkip:false});
}
function onBossVictory(){
 const s=storyState();if(!s)return;
 s.bossDefeated=true;s.completed=false;save();
 playEnding(false);
}
function createTracker(){
 const stage=document.getElementById('stage');if(!stage||document.getElementById('cb-story-tracker'))return;
 const el=document.createElement('button');el.id='cb-story-tracker';el.type='button';
 el.className='cb-story-tracker';
 el.innerHTML='<span class="cb-story-tracker-top"><strong class="cb-story-tracker-title"></strong><b class="cb-story-tracker-count"></b></span><span class="cb-story-tracker-next"></span>';
 el.addEventListener('click',openJournal);stage.append(el);
}
function renderCloudPanel(){
 document.querySelector('.cb-cloud-overlay')?.remove();
 const overlay=document.createElement('div');overlay.className='cb-cloud-overlay';
 overlay.innerHTML='<section class="cb-cloud-card"><button class="cb-cloud-close" type="button" aria-label="Close">×</button>'+
  '<p class="cb-cloud-eyebrow">CAT BOND · PRIVATE CLOUD SAVE</p><h2>'+t('云存档','Cloud save')+'</h2>'+
  '<p class="cb-cloud-lead">'+t('存档在上传前会在本机使用 AES-GCM 加密。服务器只保存密文；恢复码是唯一的解密钥匙。','Your save is encrypted on this device with AES-GCM before upload. The server stores ciphertext only; your recovery code is the decryption key.')+'</p>'+
  '<div class="cb-cloud-body"></div></section>';
 document.body.append(overlay);
 const card=overlay.querySelector('.cb-cloud-card'),body=overlay.querySelector('.cb-cloud-body');
 const close=()=>{window.removeEventListener('morrowwish-language-change',updateLocale);overlay.remove();};
 overlay.querySelector('.cb-cloud-close').onclick=close;
 overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
 let currentStatus='';
 function render(statusText=''){
  currentStatus=statusText;
  const token=localStorage.getItem(CLOUD_KEY)||'';
  const paused=localStorage.getItem(CLOUD_PAUSE_KEY)==='1';
  if(token){
   body.innerHTML='<div class="cb-cloud-status" id="cb-cloud-status">'+esc(statusText||(paused?t('本机进度已重置，自动同步已暂停。请恢复旧云档，或明确覆盖。','Local progress was reset; auto-sync is paused. Restore the old cloud save or explicitly replace it.'):t('云存档已启用。','Cloud save is enabled.')) )+'</div>'+
    '<label class="cb-cloud-label">'+t('跨设备恢复码（请妥善保存）','Cross-device recovery code (keep it safe)')+'</label>'+
    '<div class="cb-cloud-code" id="cb-cloud-code">'+esc(CODE_PREFIX+token)+'</div>'+
    '<div class="cb-cloud-actions"><button class="cb-cloud-primary" data-cloud="copy">'+t('复制恢复码','Copy recovery code')+'</button>'+
    '<button class="cb-cloud-secondary" data-cloud="sync">'+t('立即同步','Sync now')+'</button>'+
    '<button class="cb-cloud-secondary" data-cloud="restore">'+t('从云端恢复','Restore from cloud')+'</button>'+
    '<button class="cb-cloud-secondary" data-cloud="replace">'+t('用本机覆盖云端','Replace cloud with this device')+'</button></div>'+
    '<p class="cb-cloud-footnote">'+t('不要把恢复码发给他人。忘记恢复码后，服务器无法解密你的存档。','Do not share this code. If it is lost, the server cannot decrypt your save.')+'</p>';
  }else{
   body.innerHTML='<div class="cb-cloud-status" id="cb-cloud-status">'+esc(statusText||t('还没有启用云存档。','Cloud save is not enabled yet.'))+'</div>'+
    '<button class="cb-cloud-primary cb-cloud-enable" data-cloud="enable">'+t('为当前设备启用加密云存档','Enable encrypted cloud save')+'</button>'+
    '<div class="cb-cloud-divider">'+t('或在新设备上输入恢复码','Or enter a recovery code on a new device')+'</div>'+
    '<label class="cb-cloud-label" for="cb-cloud-code-input">'+t('恢复码','Recovery code')+'</label>'+
    '<input id="cb-cloud-code-input" class="cb-cloud-input" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="CB1.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx">'+
    '<button class="cb-cloud-secondary" data-cloud="import">'+t('恢复此云存档','Restore this cloud save')+'</button>'+
    '<p class="cb-cloud-footnote">'+t('恢复会替换当前设备的猫猫纽带存档；其他游戏的存档不受影响。','Restoring replaces only the Cat Bond save on this device. Other games are untouched.')+'</p>';
  }
  body.querySelectorAll('[data-cloud]').forEach(button=>button.onclick=()=>cloudAction(button.dataset.cloud));
 }
 async function cloudAction(action){
  const status=body.querySelector('#cb-cloud-status');
  const say=msg=>{if(status)status.textContent=msg;};
  try{
   if(action==='enable'){
    const hasLocal=!!localStorage.getItem(SAVE_KEY);
    const token=makeToken();localStorage.setItem(CLOUD_KEY,token);localStorage.setItem(REV_KEY,'0');localStorage.removeItem(CLOUD_PAUSE_KEY);
    render(hasLocal
     ?t('已生成恢复码，正在安排首次加密同步。','Recovery code created. Initial encrypted sync is queued.')
     :t('已生成恢复码。开始游戏并创建存档后会自动上传。','Recovery code created. It will upload automatically after your first game save.'));
    if(hasLocal)queueSync();
    return;
   }
   if(action==='copy'){
    const code=CODE_PREFIX+(localStorage.getItem(CLOUD_KEY)||'');
    await copyText(code);say(t('恢复码已复制。请保存到安全的地方。','Recovery code copied. Store it somewhere safe.'));
    return;
   }
   if(action==='sync'){
    if(localStorage.getItem(CLOUD_PAUSE_KEY)==='1'){
     if(!confirm(t('检测到本机进度刚刚被重置。要用新进度覆盖旧云存档吗？','This device was just reset. Replace the previous cloud save with this new progress?')))return;
     localStorage.removeItem(CLOUD_PAUSE_KEY);
    }
    say(t('正在加密并同步…','Encrypting and syncing…'));
    const result=await syncNow(true);
    say(result.conflict?t('检测到另一台设备有更新。请选择恢复云端或覆盖云端。','A newer save exists on another device. Restore it or explicitly replace it.')
     :result.ok?t('云存档已同步。','Cloud save synced.')
     :result.empty?t('当前设备还没有游戏存档。','This device has no game save yet.')
     :t('同步失败，请检查网络后重试。','Sync failed. Check your connection and try again.'));
    return;
   }
   if(action==='restore'){
    const token=localStorage.getItem(CLOUD_KEY);if(!token)throw Error('No recovery code');
    if(localStorage.getItem(SAVE_KEY)&&!confirm(t('这会替换当前设备的猫猫纽带进度。继续吗？','This replaces the Cat Bond progress on this device. Continue?')))return;
    say(t('正在下载并解密云存档…','Downloading and decrypting cloud save…'));
    await restoreWithToken(token);return;
   }
   if(action==='replace'){
    if(!confirm(t('将用当前设备的存档覆盖云端版本。继续吗？','Replace the cloud version with this device’s save?')))return;
    const token=localStorage.getItem(CLOUD_KEY);
    let remote;try{remote=await fetchCloud(token);}catch(error){if(error?.message==='Cloud save not found')remote={revision:0};else throw error;}
    localStorage.setItem(REV_KEY,String(remote.revision||0));
    localStorage.removeItem(CLOUD_PAUSE_KEY);
    const result=await syncNow(true);
    say(result.conflict?t('云端仍有更新，请重试。','Cloud changed again; retry.')
     :result.ok?t('云端已更新为本机存档。','Cloud save replaced with this device.')
     :t('本机存档尚未同步，请稍后重试。','The local save could not be uploaded. Please retry.'));
    return;
   }
   if(action==='import'){
    const code=body.querySelector('#cb-cloud-code-input')?.value||'';
    const token=parseCode(code);
    if(!token)throw Error(t('恢复码格式不正确。','Invalid recovery code.'));
    if(localStorage.getItem(SAVE_KEY)&&!confirm(t('这会替换当前设备的猫猫纽带进度。继续吗？','This replaces the Cat Bond progress on this device. Continue?')))return;
    say(t('正在下载并解密云存档…','Downloading and decrypting cloud save…'));
    await restoreWithToken(token);return;
   }
  }catch(error){
   say(error?.message==='Cloud save not found'
    ?t('没有找到这个恢复码对应的云存档。','No cloud save was found for this recovery code.')
    :t('操作失败：','Action failed: ')+(error?.message||''));
  }
 }
 const updateLocale=()=>{
  const input=body.querySelector('#cb-cloud-code-input')?.value||'';
  const token=localStorage.getItem(CLOUD_KEY);
  const paused=localStorage.getItem(CLOUD_PAUSE_KEY)==='1';
  render(token
   ?paused?t('本机进度已重置，自动同步已暂停。请恢复旧云档，或明确覆盖。','Local progress was reset; auto-sync is paused. Restore the old cloud save or explicitly replace it.')
    :t('云存档已启用。','Cloud save is enabled.')
   :t('还没有启用云存档。','Cloud save is not enabled yet.'));
  const nextInput=body.querySelector('#cb-cloud-code-input');if(nextInput)nextInput.value=input;
 };
 window.addEventListener('morrowwish-language-change',updateLocale);
 render();
}
function makeToken(){
 const bytes=crypto.getRandomValues(new Uint8Array(32));
 return toB64url(bytes);
}
function toB64url(bytes){
 let binary='';for(const b of bytes)binary+=String.fromCharCode(b);
 return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function fromB64url(value){
 const s=value.replace(/-/g,'+').replace(/_/g,'/');
 const binary=atob(s+'='.repeat((4-s.length%4)%4));
 return Uint8Array.from(binary,c=>c.charCodeAt(0));
}
function parseCode(value){
 const text=String(value||'').trim().replace(/\s+/g,'');
 const token=text.startsWith(CODE_PREFIX)?text.slice(CODE_PREFIX.length):text;
 return /^[A-Za-z0-9_-]{43}$/.test(token)?token:null;
}
async function cryptoKey(token){
 return crypto.subtle.importKey('raw',fromB64url(token),{name:'AES-GCM'},false,['encrypt','decrypt']);
}
async function encrypt(raw,token){
 const iv=crypto.getRandomValues(new Uint8Array(12));
 const key=await cryptoKey(token);
 const data=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(raw));
 return {iv:toB64url(iv),ciphertext:toB64url(new Uint8Array(data))};
}
async function decrypt(remote,token){
 const key=await cryptoKey(token),iv=fromB64url(remote.iv),data=fromB64url(remote.ciphertext);
 const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv},key,data);
 return new TextDecoder().decode(plain);
}
async function fetchCloud(token){
 const response=await fetch('/api/cat-bond-cloud-save',{method:'GET',headers:{Authorization:'Bearer '+token},cache:'no-store'});
 const data=await response.json().catch(()=>({}));
 if(response.status===404||data.exists===false)throw Error('Cloud save not found');
 if(!response.ok)throw Error(data.error||'Cloud save unavailable');
 return data;
}
async function restoreWithToken(token){
 const remote=await fetchCloud(token);
 const raw=await decrypt(remote,token);
 const parsed=JSON.parse(raw);
 if(!parsed||typeof parsed!=='object'||!Array.isArray(parsed.cats))
  throw Error(t('云存档内容无效，未覆盖本机存档。','Cloud save is invalid; local progress was not changed.'));
 localStorage.setItem(SAVE_KEY,raw);
 localStorage.setItem(CLOUD_KEY,token);
 localStorage.removeItem(CLOUD_PAUSE_KEY);
 localStorage.setItem(REV_KEY,String(remote.revision||0));
 localStorage.setItem(SYNC_KEY,String(remote.updatedAt||Date.now()));
 location.reload();
}
let syncTimer=null,syncPromise=null,syncPending=false,lastStatus='';
function setSyncStatus(status){
 lastStatus=status;
 const el=document.getElementById('cb-cloud-status');if(el)el.textContent=status;
}
async function syncNow(force=false){
 const token=localStorage.getItem(CLOUD_KEY);
 if(!token)return {ok:false,disabled:true};
 if(localStorage.getItem(CLOUD_PAUSE_KEY)==='1'&&!force){
  setSyncStatus(t('本机重置后已暂停自动同步。请先恢复旧云档，或明确选择覆盖。','Auto-sync is paused after a local reset. Restore the old cloud save or explicitly replace it.'));
  return {ok:false,paused:true};
 }
 if(syncPromise){syncPending=true;return syncPromise;}
 syncPromise=(async()=>{
  const raw=localStorage.getItem(SAVE_KEY);
  if(!raw)return {ok:false,empty:true};
  const encrypted=await encrypt(raw,token);
  const expected=Number(localStorage.getItem(REV_KEY)||0);
  const response=await fetch('/api/cat-bond-cloud-save',{
   method:'PUT',headers:{'content-type':'application/json',Authorization:'Bearer '+token},
   body:JSON.stringify({...encrypted,expectedRevision:expected}),cache:'no-store'
  });
  const data=await response.json().catch(()=>({}));
  if(response.status===409){setSyncStatus(t('云端版本已变化，需要手动选择同步方向。','Cloud version changed; choose a sync direction manually.'));return {ok:false,conflict:true,revision:data.revision};}
  if(!response.ok)throw Error(data.error||'Cloud sync failed');
  localStorage.setItem(REV_KEY,String(data.revision));
  localStorage.setItem(SYNC_KEY,String(data.updatedAt||Date.now()));
  setSyncStatus(t('已同步 · ','Synced · ')+new Date(data.updatedAt||Date.now()).toLocaleString());
  return {ok:true,revision:data.revision};
 })().catch(error=>{
  setSyncStatus(t('同步暂不可用：','Sync unavailable: ')+(error?.message||''));
  return {ok:false,error};
 }).finally(()=>{
  syncPromise=null;
  if(syncPending){syncPending=false;queueSync();}
 });
 return syncPromise;
}
function queueSync(){
 if(!localStorage.getItem(CLOUD_KEY)||localStorage.getItem(CLOUD_PAUSE_KEY)==='1')return;
 clearTimeout(syncTimer);
 syncTimer=setTimeout(()=>syncNow(false),2200);
}
async function copyText(value){
 try{await navigator.clipboard.writeText(value);}
 catch{
  const input=document.createElement('textarea');input.value=value;input.style.position='fixed';input.style.opacity='0';
  document.body.append(input);input.select();document.execCommand('copy');input.remove();
 }
}
function openCloudPanel(){openCloudPanelImpl();}
function openCloudPanelImpl(){
 if(!window.crypto?.subtle){alert(t('当前浏览器不支持加密云存档。','This browser does not support encrypted cloud saves.'));return;}
 renderCloudPanel();
}
// Patch the existing menu, rather than adding another floating HUD button.
if(window.UI?.openExploreMenu&&!window.UI.openExploreMenu.__lastPage){
 const original=window.UI.openExploreMenu;
 const wrapped=function(...args){
  const result=original.apply(this,args);
  const actions=document.querySelector('#panel .explore-menu-actions');
  if(actions&&!actions.querySelector('[data-cb-story-action]')){
   const add=(action,icon,label)=>{
    const button=document.createElement('button');button.type='button';button.dataset.cbStoryAction=action;
    button.innerHTML='<span aria-hidden="true">'+icon+'</span><span>'+label+'</span>';
    button.addEventListener('click',()=>action==='journal'?openJournal():openCloudPanelImpl());
    actions.append(button);
   };
   add('journal','📖',t('故事手册','Story journal'));
   add('cloud','☁️',t('云存档','Cloud save'));
  }
  return result;
 };
 wrapped.__lastPage=true;window.UI.openExploreMenu=wrapped;
}
if(window.State?.hardReset&&!window.State.hardReset.__cbCloudWrapped){
 const original=window.State.hardReset.bind(window.State);
 const wrapped=function(...args){
  if(localStorage.getItem(CLOUD_KEY))localStorage.setItem(CLOUD_PAUSE_KEY,'1');
  return original(...args);
 };
 wrapped.__cbCloudWrapped=true;window.State.hardReset=wrapped;
}
if(window.State?.save&&!window.State.save.__cbCloudWrapped){
 const original=window.State.save.bind(window.State);
 const wrapped=function(...args){const result=original(...args);try{queueSync();}catch{}return result;};
 wrapped.__cbCloudWrapped=true;window.State.save=wrapped;
}
function installIntro(){
 const cloudButton=document.getElementById('intro-cloud-save');
 const updateCloudLabel=()=>{if(cloudButton)cloudButton.textContent=t('☁️ 云存档','☁️ Cloud save');};
 updateCloudLabel();window.addEventListener('morrowwish-language-change',updateCloudLabel);
 const start=document.getElementById('intro-start');
 if(start&&!start.dataset.cbStoryBound){
  start.dataset.cbStoryBound='1';
  let bypass=false;
  start.addEventListener('click',event=>{
   if(bypass||readLocal().story?.introSeen)return;
   event.preventDefault();event.stopImmediatePropagation();
   startPrologue(()=>{
    bypass=true;start.click();bypass=false;
   });
  },true);
 }
 document.getElementById('intro-cloud-save')?.addEventListener('click',openCloudPanelImpl);
 const stage=document.getElementById('stage');
 if(stage&&!document.getElementById('cb-story-tracker')){
  const tracker=document.createElement('button');tracker.id='cb-story-tracker';tracker.type='button';tracker.className='cb-story-tracker';
  tracker.innerHTML='<span class="cb-story-tracker-top"><strong class="cb-story-tracker-title"></strong><b class="cb-story-tracker-count"></b></span><span class="cb-story-tracker-next"></span>';
  tracker.onclick=openJournal;stage.append(tracker);
 }
 if(window.__game){
  const game=window.__game,originalUpdate=game.update.bind(game);
  if(!game.__cbStoryUpdate){
   game.update=function(dt){const result=originalUpdate(dt);updateTracker();return result;};
   game.__cbStoryUpdate=true;
  }
 }
}
window.addEventListener('DOMContentLoaded',installIntro,{once:true});
window.addEventListener('morrowwish-language-change',updateTracker);
window.addEventListener('pagehide',()=>{if(localStorage.getItem(CLOUD_KEY))syncNow(false);});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&localStorage.getItem(CLOUD_KEY))syncNow(false);});
window.CatBondStory={
 startPrologue,onRegionEntered,onRegionDiscovery,openJournal,showBossReveal,showBossRetry,
 onBossVictory,playEnding,updateTracker
};
window.CatBondCloudSave={openPanel:openCloudPanelImpl,queue:queueSync,syncNow};
})();