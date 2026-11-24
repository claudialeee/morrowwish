/* Cat Bond: The Last Page story campaign + encrypted cross-device save.
   The original cat art, combat engine, local save key and five region maps stay intact. */
(()=>{
'use strict';
const SAVE_KEY='catbond_save_v1';
const SLOT_KEY='catbond_save_slots_v1';
const ACTIVE_SLOT_KEY='catbond_active_slot_v1';
const CLOUD_KEY='catbond_cloud_key_v1';
const REV_KEY='catbond_cloud_revision_v1';
const SYNC_KEY='catbond_cloud_synced_at_v1';
const CLOUD_PAUSE_KEY='catbond_cloud_paused_v1';
const CODE_PREFIX='CB1.';
const REGIONS=['home','sakura','creek','volcano','ruins'];
const REGION_PAGES={
 home: {
  id: "home-bell",
  title: "庭院门口的铃声",
  titleEn: "The Bell at the Garden Gate",
  text: "【纸鸢】你醒了。\n【你】刚才是谁在叫我？\n【纸鸢】我只听见铃响。可奇怪的是，铃声传来之前，你的影子先回头了。\n\n木凳下有一只旧毛线盒，里面压着半张双猫合影。照片边缘被烧焦，其中一只猫的脸恰好缺失。背面写着：听见铃声，就回家。",
  textEn: "[Kite] You are awake.\n[You] Who called me?\n[Kite] I only heard the bell. The strange thing is… your shadow turned around before the sound arrived. The blank places left behind are called the Hollow.\n\nBeneath the bench lies an old yarn box and half of a photograph. One kitten’s face has been burned away. On the back: When the bell rings, come home.",
  region: "home",
  chapter: "第一章 · 空白页",
  chapterEn: "CHAPTER I · THE BLANK PAGE"
 },
 sakura: {
  id: "sakura-promise",
  title: "花瓣下的约定",
  titleEn: "A Promise Beneath the Petals",
  text: "【绯枝】这支签不是预言，是有人后来补上去的。\n【你】补了什么？\n【绯枝】原文不是“星铃只能敲响一次”，而是“星铃只能由一个自愿交出名字的人敲响”。\n\n花瓣间闪过旧日画面：你把铃绳交给一只小猫。它笑着说：“你总会忘东西。那这次，换我替你记住。”",
  textEn: "[Feizhi] This fortune is not a prophecy. Someone added those words later.\n[You] What did it say before?\n[Feizhi] Not “The Star Bell may ring only once.” It said, “The Star Bell may be rung only by one who gives their name willingly.”\n\nA memory flickers between the petals: you hand the bell cord to a kitten. They laugh. “You always lose things. This time, let me remember for you.”",
  region: "sakura",
  chapter: "第二章 · 旧约",
  chapterEn: "CHAPTER II · THE OLD PROMISE"
 },
 creek: {
  id: "creek-name",
  title: "被河水带走的名字",
  titleEn: "The Name the River Carried",
  text: "【渡川】河水没有偷走你的名字。是你把它放进水里。\n【你】为什么？\n【渡川】因为星铃需要一个锚。你不肯让它落在那只小猫身上。\n\n倒影里，暮铃抓住你的爪子。\n【暮铃】答应我，你会回来。\n【你】我会尽力。\n【暮铃】我不要尽力。我要你答应。",
  textEn: "[Duchuan] The river did not steal your name. You placed it in the current.\n[You] Why would I do that?\n[Duchuan] The Bell needed an anchor. You would not let it be that kitten.\n\nIn the reflection, Muling catches your paw.\n[Muling] Promise you will come back.\n[You] I will try.\n[Muling] I do not want “try.” I want a promise.",
  region: "creek",
  chapter: "第三章 · 失去的名字",
  chapterEn: "CHAPTER III · THE LOST NAME"
 },
 volcano: {
  id: "volcano-seal",
  title: "星铃灾变",
  titleEn: "The Star Bell Catastrophe",
  text: "【烬禾】我亲眼看见你回头。出口就在身后，你却走进了钟里。\n【你】暮铃呢？\n【烬禾】它只看见门关上。没人告诉它，你是留下来，不是逃走。\n\n火山深处，六道记忆丝线正从各地汇入星铃。每亮起一道，钟内的影子就更像你一分。",
  textEn: "[Jinhe] I saw you turn back. The exit was behind you. You walked into the Bell.\n[You] What happened to Muling?\n[Jinhe] They only saw the door close. No one told them you stayed. They thought you ran.\n\nDeep in the volcano, six threads of memory flow toward the Star Bell. With every thread, the silhouette inside looks more like you.",
  region: "volcano",
  chapter: "第四章 · 最后的守铃者",
  chapterEn: "CHAPTER IV · THE LAST BELLKEEPER"
 },
 ruins: {
  id: "ruins-reverse",
  title: "倒着响的钟",
  titleEn: "The Bell That Rings Backward",
  text: "【星簿】这些旋律不是钥匙。它们是你们共同经历过的六段记忆。\n【你】那为什么它们会启动星铃？\n【星簿】暮铃在用它们拼出一个“你”。可记忆能拼出回声，拼不回一个人。\n\n星盘转向你。最后一页浮现出熟悉的字迹：如果世界不肯把你还给我，我就让世界只剩下你。",
  textEn: "[Star Scribe] These melodies are not keys. They are six memories you once shared.\n[You] Then why are they starting the Bell?\n[Star Scribe] Muling is using them to assemble an “you.” Memories can make an echo. They cannot restore a person.\n\nThe astrolabe turns toward you. The final page bears familiar handwriting: If the world will not give you back, I will make a world with only you left in it.",
  region: "ruins",
  chapter: "第五章 · 逆响",
  chapterEn: "CHAPTER V · THE REVERSED BELL"
 }
};
const LAST_PAGE={
 id:'last-page',title:'最后一页：暮铃',titleEn:'The Last Page: Muling',
 text:'呼唤你的声音来自暮铃——你曾经最重要的伙伴。封印灾变时，你牺牲名字与记忆；暮铃却只看见你消失，以为自己被抛弃。它成为“逆响之主”，吸收其他猫咪的记忆，只为把你带回来。你找回的六段旋律，正是它复活你的仪式。',
 textEn:'The voice belongs to Muling, once your closest companion. You sacrificed your name and memories to seal the catastrophe; Muling only saw you disappear and believed you had abandoned them. Now the Lord of the Reversed Bell absorbs other cats’ memories to bring you back. The six melodies you recovered are the ritual that will revive you.',
 region:'ruins',chapter:'终章 · 最后一页',chapterEn:'FINAL CHAPTER · THE LAST PAGE'
};
const PROLOGUE=[
 {
  region: "home",
  kicker: "序章 · 倒着响的铃",
  kickerEn: "PROLOGUE · A BELL IN REVERSE",
  title: "先响起的，是你的影子。",
  titleEn: "Your shadow moved before the bell.",
  text: "夜色压低了庭院的树梢。一根旧铃绳挂在枝头，风没有吹，它却轻轻摆动。\n\n一只小猫伸出爪子。铃声响起——不是从远处传来，而是从每个人的记忆里倒退回来。",
  textEn: "Night lowers the garden branches. An old bell cord hangs from a tree. There is no wind, yet it begins to sway.\n\nA kitten reaches out. The bell rings—not from somewhere far away, but backwards through everyone’s memory."
 },
 {
  region: "home",
  kicker: "第一幕 · 空白页",
  kickerEn: "SCENE I · THE BLANK PAGE",
  title: "“你迟到了。”",
  titleEn: "“You are late.”",
  text: "你在木凳下醒来。面前站着一只抱着旧书的猫。\n\n【纸鸢】你迟到了。\n【你】我们认识？\n【纸鸢】我不知道。但这本书一直替你留着位置。\n\nCatdex 自动翻开第一页。上面没有名字，只有一道像被爪子反复划过的空白。",
  textEn: "You wake beneath a garden bench. A cat stands nearby, holding an old book.\n\n[Kite] You are late.\n[You] Do we know each other?\n[Kite] I do not know. But this book has kept a place for you.\n\nThe Catdex opens by itself. Its first page has no name—only a blank scratched over and over."
 },
 {
  region: "sakura",
  kicker: "第二幕 · 不完整的约定",
  kickerEn: "SCENE II · AN UNFINISHED PROMISE",
  title: "“我会尽力回来。”",
  titleEn: "“I will try to come back.”",
  text: "一段记忆从铃绳里闪过：两只小猫坐在樱花树下。\n\n【小猫】不许说尽力。\n【你】那我该说什么？\n【小猫】说你一定会回来。\n\n你张开嘴，却没有声音。画面里的另一只猫替你笑了笑，把铃绳系在自己腕上。",
  textEn: "A memory flickers from the bell cord: two kittens beneath a cherry tree.\n\n[Kitten] Do not say “I will try.”\n[You] What should I say, then?\n[Kitten] Say you will come back.\n\nYou open your mouth, but no sound comes. The other kitten smiles for you and ties the cord around their wrist."
 },
 {
  region: "creek",
  kicker: "第三幕 · 醒来的名字",
  kickerEn: "SCENE III · THE NAME THAT WOKE",
  title: "有人还记得你。",
  titleEn: "Someone still remembers you.",
  text: "画面骤然熄灭。你听见水声、急促的脚步，还有一道被截断的呼唤。\n\n【未知的声音】这一次，我不会再让你离开。\n\n纸鸢合上 Catdex。\n【纸鸢】如果它真的找到了你，千万别急着答应它任何事。",
  textEn: "The vision cuts to black. You hear rushing water, hurried paws, and a voice cut short.\n\n[Unknown voice] This time, I will not let you leave.\n\nKite closes the Catdex.\n[Kite] If it has truly found you, do not promise it anything. Not yet."
 },
 {
  region: "home",
  kicker: "旅程开始",
  kickerEn: "THE JOURNEY BEGINS",
  title: "先找到那些还记得自己的人。",
  titleEn: "Find those who still remember themselves.",
  text: "你可以从庭院出发，沿着地图寻找失去记忆的猫咪。每一段回声都属于一个真实的人，也可能属于你不愿想起的过去。\n\n纸鸢把一枚旧铃扣交给你。它背面刻着两个字：暮铃。",
  textEn: "Leave the sanctuary and follow the world map to find cats losing their memories. Every echo belongs to a real person—and may belong to a past you are not ready to face.\n\nKite gives you an old bell clasp. Two words are engraved on its back: Muling."
 }
];
const ENDING=[
 {
  region: "ruins",
  kicker: "终幕 · 未完成的愿望",
  kickerEn: "FINALE · THE UNFINISHED WISH",
  title: "“你终于回来了。”",
  titleEn: "“You finally came back.”",
  text: "暮铃站在星铃中央。它身边浮着无数被夺走的记忆，像一片没有星星的夜空。\n\n【暮铃】我把每一段都记得很清楚。你喜欢晒太阳，讨厌下雨，害怕我一个人睡着。只要拼得足够完整，你就会回来。\n【你】那不是我。那只是你记得的我。",
  textEn: "Muling stands at the heart of the Star Bell. Stolen memories drift around them like a night without stars.\n\n[Muling] I remember everything. You loved sunbeams, hated rain, and worried I would fall asleep alone. If I make the picture complete enough, you will come back.\n[You] That would not be me. It would only be the version you remember."
 },
 {
  region: "volcano",
  kicker: "真相 · 门的另一边",
  kickerEn: "THE TRUTH · THE OTHER SIDE OF THE DOOR",
  title: "你没有离开它。",
  titleEn: "You did not leave them.",
  text: "最后一道封印松开。暮铃终于看见那一天：你把它推向出口，自己转身走进星铃。你喊了它的名字，可封印吞掉了声音。\n\n【暮铃】我等了这么久……\n【你】我知道。可你让别人替我们承受了这份等待。",
  textEn: "The final seal breaks. Muling finally sees that day: you pushed them toward the exit and turned back into the Star Bell. You called their name, but the seal swallowed your voice.\n\n[Muling] I waited so long…\n[You] I know. But you made everyone else pay for that waiting."
 },
 {
  region: "creek",
  kicker: "选择 · 羁绊不是枷锁",
  kickerEn: "CHOICE · A BOND IS NOT A CHAIN",
  title: "“我不能答应永远不离开。”",
  titleEn: "“I cannot promise never to leave.”",
  text: "你没有替暮铃抹去罪责，也没有把它留在黑暗里。你要求它亲手归还每一段记忆，向每一只被伤害的猫道歉。\n\n【暮铃】如果我再听见铃声，你会来吗？\n【你】我会尽力回来。现在，这句话终于足够了。",
  textEn: "You do not erase Muling’s wrongdoing, and you do not leave them in the dark. You ask them to return every memory and face every cat they hurt.\n\n[Muling] If I hear the bell again, will you come?\n[You] I will try to come back. This time, that is enough."
 },
 {
  region: "ruins",
  kicker: "Catdex · 第一页",
  kickerEn: "THE CATDEX · PAGE ONE",
  title: "名字，不必从过去借来。",
  titleEn: "A name does not have to come from the past.",
  text: "记忆回到每一位主人身边。Catdex 没有把你变回从前的样子；它留下了你现在的伙伴、选择和旅程。你在第一页写下一个新的名字。\n\n暮铃没有替你写。它把笔放在你手边，第一次学会等待你的回答。",
  textEn: "Every memory returns to its owner. The Catdex does not turn you into who you used to be; it keeps the companions, choices and journey you have now. You write a new name on its first page.\n\nMuling does not write it for you. They set the pen beside your paw and, for the first time, wait for your answer."
 },
 {
  region: "home",
  kicker: "尾声 · 新的清晨",
  kickerEn: "EPILOGUE · A NEW MORNING",
  title: "这一次，铃声没有倒流。",
  titleEn: "This time, the bell rings forward.",
  text: "庭院门口，阳光落在两只猫之间。暮铃把旧铃绳放在地上，没有系住任何人的爪子。\n\n远处传来伙伴们的笑声。Catdex 翻开新的一页。故事没有回到过去——它终于可以继续向前。",
  textEn: "At the garden gate, sunlight falls between two cats. Muling lays the old bell cord on the ground; it is tied around no one’s paw.\n\nYour companions laugh in the distance. The Catdex opens a new page. The story does not return to the past. At last, it can move forward."
 }
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
  region:'ruins',kicker:'最后一页 · 逆响仪式',kickerEn:'THE LAST PAGE · THE REVERSED RITUAL',
  title:'你找回的每段记忆，都在替它敲响星铃。',titleEn:'Every memory you recovered has been ringing the Bell for them.',
  text:'星盘中央浮现出那只熟悉的猫。它没有咆哮，只是伸出爪子，像从前在樱花树下那样等你牵住。\n\n【暮铃】我知道你会找到这里。你总会回来。\n【你】你拿走了他们的记忆。\n【暮铃】我只想把你带回家。\n\n六段旋律同时亮起。你终于明白：这一路的线索既在帮你找回过去，也在替暮铃完成仪式。',
  textEn:'A familiar cat appears at the center of the astrolabe. They do not roar. They simply hold out a paw, waiting as they once did beneath the cherry blossoms.\n\n[Muling] I knew you would find me. You always come back.\n[You] You took their memories.\n[Muling] I only wanted to bring you home.\n\nAll six melodies flare. You understand at last: the clues that restored your past have also been completing Muling’s ritual.'
 }],()=>showMulingQuestions(()=>showBossGate()),{canSkip:false});
}
function showMulingQuestions(done){
 const root=npcRoot();if(!root)return done?.();
 root.mulingAnswers||={};
 const questions=[
  {id:'cost',prompt:'你什么时候知道，这些记忆不能真正把我带回来？',promptEn:'When did you know these memories could never truly bring me back?',options:[
   {id:'always',label:'一开始就知道。',labelEn:'You knew from the beginning.',reply:'我知道。但我告诉自己，只要再多一段，就会不一样。',replyEn:'I knew. I kept telling myself that one more memory would make the difference.'},
   {id:'too_late',label:'第一只猫失去记忆之后？',labelEn:'After the first cat lost a memory?',reply:'那只猫忘了最喜欢的食物。我还是继续了。',replyEn:'That cat forgot their favourite food. I continued anyway.'}]},
  {id:'restore',prompt:'你想让我记住哪一个你？',promptEn:'Which version of you do you want me to remember?',options:[
   {id:'old_us',label:'樱花树下，那个等我的小猫。',labelEn:'The kitten who waited for me beneath the cherry tree.',reply:'我只想你记得，我们还没有失去彼此。',replyEn:'I only wanted you to remember that we had not lost each other yet.'},
   {id:'today',label:'今天的逆响之主。',labelEn:'The one standing here as Lord of the Reversed Bell.',reply:'我不知道现在的我，还能不能被你认出来。',replyEn:'I do not know whether you could recognize who I have become.'}]},
  {id:'stop',prompt:'如果我不会回到过去，你会停下来吗？',promptEn:'If I cannot return to the past, will you stop?',options:[
   {id:'return_memories',label:'先把所有人的记忆还回去。',labelEn:'Return everyone’s memories first.',reply:'我会把他们的名字还回去。可是我不知道他们会不会原谅我。',replyEn:'I will return their names. I do not know whether they will forgive me.'},
   {id:'meet_now',label:'学着认识现在的我，而不是复刻过去。',labelEn:'Learn who I am now instead of recreating the past.',reply:'我不知道怎样放下，但我不想再让他们成为代价。',replyEn:'I do not know how to let go. But I do not want them to be the price anymore.'}]}
 ];
 let step=0,selected=null;
 const overlay=document.createElement('div');overlay.className='cb-cloud-overlay cb-npc-dialog cb-muling-questions';
 overlay.innerHTML='<section class="cb-cloud-card cb-npc-dialog-card"><button class="cb-cloud-close" type="button" aria-label="Close">×</button><p class="cb-cloud-eyebrow">THE LAST PAGE · THREE QUESTIONS</p><h2></h2><p class="cb-npc-dialog-line"></p><div class="cb-cloud-actions"></div></section>';
 document.body.append(overlay);
 const close=()=>{window.removeEventListener('morrowwish-language-change',rerender);overlay.remove();};
 const rerender=()=>render();window.addEventListener('morrowwish-language-change',rerender);
 overlay.querySelector('.cb-cloud-close').onclick=()=>{close();done?.();};
 function render(){
  const en=!isZh(),title=overlay.querySelector('h2'),line=overlay.querySelector('.cb-npc-dialog-line'),actions=overlay.querySelector('.cb-cloud-actions');
  actions.innerHTML='';
  if(step>=questions.length){
   title.textContent=en?'The Bell is waiting.':'星铃正在等待。';
   line.textContent=en?'You have heard what Muling could not say plainly. The truth does not decide what happens next; your choices do.':'你已经听见暮铃无法直说的话。真相不能替你决定接下来发生什么，你的选择才可以。';
   const b=document.createElement('button');b.type='button';b.className='cb-cloud-primary';b.textContent=en?'Face the Reversed Bell':'面对逆响之钟';b.onclick=()=>{close();done?.();};actions.append(b);return;
  }
  const q=questions[step],answer=root.mulingAnswers[q.id];
  title.textContent=(en?'QUESTION ':'问题 ')+(step+1)+' / 3';
  line.textContent=(en?q.promptEn:q.prompt)+(answer?'\n\n'+(en?q.options.find(o=>o.id===answer)?.replyEn:q.options.find(o=>o.id===answer)?.reply):'');
  if(answer){
   const next=document.createElement('button');next.type='button';next.className='cb-cloud-primary';next.textContent=en?(step===2?'Continue':'Next question'):(step===2?'继续':'下一个问题');next.onclick=()=>{step++;render();};actions.append(next);return;
  }
  q.options.forEach(option=>{
   const b=document.createElement('button');b.type='button';b.className='cb-cloud-primary';b.textContent=en?option.labelEn:option.label;
   b.onclick=()=>{root.mulingAnswers[q.id]=option.id;npcSave();render();};actions.append(b);
  });
 }
 render();
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
  '<div class="cb-boss-emblem">✧</div><p>'+t('带上你最信任的伙伴，结束逆响仪式。','Bring your trusted companions and end the reversed-bell ritual.')+'</p>'+
  '<div class="cb-cloud-actions"><button class="cb-cloud-primary" data-boss-start>'+t('开始最终战','Begin final battle')+'</button>'+
  '<button class="cb-cloud-secondary" data-boss-later>'+t('稍后再战','Not yet')+'</button></div></section>';
 document.body.append(overlay);
 const close=()=>{window.removeEventListener('morrowwish-language-change',rerender);overlay.remove();};
 const rerender=()=>{close();showBossGate();};
 window.addEventListener('morrowwish-language-change',rerender);
 overlay.querySelector('[data-boss-later]').onclick=close;
 overlay.querySelector('[data-boss-start]').onclick=()=>{close();startBoss();};
}
const MULING_COMBAT_CHOICES=[
 {id:'truth',label:'我想回来，但我做不到。你确实受了伤。',labelEn:'I wanted to come back. I could not. And you were hurt.',reply:'暮铃的爪子慢慢垂下。它第一次没有把你的回答改写成自己想听的样子。',replyEn:'Muling slowly lowers a paw. For the first time, they do not reshape your answer into the one they wanted.'},
 {id:'return',label:'先把他们的记忆还回去。我们再谈我们。',labelEn:'Return their memories first. Then we can talk about us.',reply:'暮铃看向那些被困住的名字。星铃的光第一次不再向它聚拢。',replyEn:'Muling looks at the names trapped in the Bell. For the first time, its light stops gathering around them.'},
 {id:'now',label:'我不会成为你记忆里的那个人。你必须认识现在的我。',labelEn:'I will not become the person in your memories. You must meet who I am now.',reply:'暮铃没有回答。它只是松开了铃绳，像终于明白那不是一条牵引你的线。',replyEn:'Muling does not answer. They loosen their grip on the bell cord, as if finally understanding it was never a leash.'}
];
function showMulingCombatChoice(done){
 const root=npcRoot();if(!root)return done?.();
 const overlay=document.createElement('div');overlay.className='cb-cloud-overlay cb-npc-dialog cb-muling-combat-choice';
 overlay.innerHTML='<section class="cb-cloud-card cb-npc-dialog-card"><p class="cb-cloud-eyebrow">THE UNFINISHED PROMISE</p><h2></h2><p class="cb-npc-dialog-line"></p><div class="cb-cloud-actions"></div></section>';
 document.body.append(overlay);
 const close=()=>{window.removeEventListener('morrowwish-language-change',render);overlay.remove();};
 function render(){
  const en=!isZh(),line=overlay.querySelector('.cb-npc-dialog-line'),actions=overlay.querySelector('.cb-cloud-actions'),title=overlay.querySelector('h2');
  actions.innerHTML='';title.textContent=en?'Muling asks you to stay.':'暮铃请求你留下。';
  const chosen=MULING_COMBAT_CHOICES.find(x=>x.id===root.mulingCombatChoice);
  line.textContent=en
   ?'The Star Bell trembles. Muling stops attacking. “If I let go, will you disappear again?”'
   :'星铃开始震颤。暮铃停止攻击：“如果我放手，你是不是又会消失？”';
  if(chosen){
   line.textContent+='\\n\\n'+(en?chosen.replyEn:chosen.reply);
   const b=document.createElement('button');b.type='button';b.className='cb-cloud-primary';b.textContent=en?'Continue the fight':'继续战斗';b.onclick=()=>{close();done?.();};actions.append(b);return;
  }
  MULING_COMBAT_CHOICES.forEach(option=>{
   const b=document.createElement('button');b.type='button';b.className='cb-cloud-primary';b.textContent=en?option.labelEn:option.label;
   b.onclick=()=>{root.mulingCombatChoice=option.id;npcSave();render();};actions.append(b);
  });
 }
 window.addEventListener('morrowwish-language-change',render);
 render();
}
function onBossPhase(phase,done){
 if(phase===1){
  showSequence('memory',[{
   region:'ruins',kicker:'第一阶段 · 回声',kickerEn:'PHASE I · THE ECHO',
   title:'你认出了那一招。',titleEn:'You recognize that move.',
   text:'暮铃使出你们从前在庭院里玩闹时创造的双猫合击。它记得你总把最后一步留给它，也记得那时你们笑得喘不过气。\\n\\n它收集的不是力量，而是你们共同经历过的日子。',textEn:'Muling uses a duo technique you invented together while playing in the garden. They remember how you always saved the final move for them, and how you both laughed until you could hardly breathe.\\n\\nThey have not been collecting power. They have been collecting the days you shared.'
  }],()=>done?.(),{canSkip:false});
  return;
 }
 if(phase>=2){
  showSequence('memory',[{
   region:'ruins',kicker:'第二阶段 · 借来的名字',kickerEn:'PHASE II · THE BORROWED NAMES',
   title:'伙伴们叫出了记忆主人的名字。',titleEn:'Your companions call the memories by their owners’ names.',
   text:'无数被夺走的记忆从星铃周围浮现。你的伙伴没有向暮铃攻击，而是逐个叫出那些猫咪的名字。每叫出一个名字，缠在星铃上的光线就松开一分。\\n\\n暮铃终于停下了动作。它问你：“我还能不能把你留下？”',textEn:'Stolen memories rise around the Star Bell. Your companions do not attack Muling. They call each memory by its owner’s name. With every name, one thread loosens.\\n\\nMuling finally stops. “Can I still make you stay?”'
  }],()=>showMulingCombatChoice(done),{canSkip:false});
 }
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
 const endingPages=ENDING.map(page=>({...page}));
 const relationships=npcRoot()?.relationships||{},bondScore=Object.values(relationships).reduce((sum,value)=>sum+(Number(value)||0),0);
 const arc=npcRoot()||{},flags=arc.flags||{},answers=arc.mulingAnswers||{};
 if(flags.person_not_memory){endingPages[2].text=endingPages[2].text.replace('那不是我。那只是你记得的我。','记忆不是一个人。那不是我，只是你记得的我。');endingPages[2].textEn=endingPages[2].textEn.replace('That would not be me. It would only be the version you remember.','A memory is not a person. That would not be me; it would only be the version you remember.');}
 if(answers.stop==='return_memories'||arc.mulingCombatChoice==='return'){endingPages[2].text+='\n\n【暮铃】我会先把他们的名字还回去。即使他们不再愿意听我解释。';endingPages[2].textEn+='\n\n[Muling] I will return their names first, even if they never want to hear my explanation.';}
 else if(answers.stop==='meet_now'||arc.mulingCombatChoice==='now'){endingPages[2].text+='\n\n【暮铃】我不知道怎样重新认识你。但我愿意从今天开始。';endingPages[2].textEn+='\n\n[Muling] I do not know how to meet you again. But I am willing to begin today.';}
 if(flags.accountability){endingPages[2].text+='\n\n【烬禾】这次我不会替任何人决定该不该原谅。我会陪他们听完每一句道歉。';endingPages[2].textEn+='\n\n[Jinhe] This time I will not decide who deserves forgiveness. I will stay and hear every apology.';}
 if(flags.truth_now){endingPages[3].text+='\n\n绯枝把被删掉的碑文重新刻回去，让后来的人知道牺牲从来不是命运。';endingPages[3].textEn+='\n\nFeizhi restores the erased words to the shrine so no one can call sacrifice destiny again.';}
 endingPages[endingPages.length-1].text+='\\n\\n'+(bondScore>=4?'纸鸢、绯枝、渡川、烬禾与星簿都记得你一路上的回答。你们不再只靠过去的约定维系彼此。':'伙伴们记得你曾经的迟疑与坚持。新的羁绊不需要每个人都给出相同的答案。');
 endingPages[endingPages.length-1].textEn+='\\n\\n'+(bondScore>=4?'Kite, Feizhi, Duchuan, Jinhe and Star Scribe remember the answers you gave along the way. You are no longer held together only by an old promise.':'Your companions remember both your hesitation and your resolve. A new bond does not require everyone to give the same answer.');
 showSequence('ending',endingPages,()=>{
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
  '<p class="cb-cloud-eyebrow">CAT BOND · SAVE & LOAD</p><h2>'+t('云存档','Cloud save')+'</h2>'+
  '<p class="cb-cloud-lead">'+t('云端会同步三个独立存档位。游戏同时在本机自动保存，也可在游戏菜单中手动保存或读取任意存档位。','Cloud sync keeps all three independent save slots. The game also autosaves locally; use the in-game Save Slots menu to save or load any slot manually.')+'</p>'+
  '<div class="cb-cloud-body"></div></section>';
 document.body.append(overlay);
 const body=overlay.querySelector('.cb-cloud-body');
 const close=()=>{window.removeEventListener('morrowwish-language-change',updateLocale);overlay.remove();};
 overlay.querySelector('.cb-cloud-close').onclick=close;
 overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
 function render(status=''){
  const token=localStorage.getItem(CLOUD_KEY)||'';
  if(token){
   body.innerHTML='<div class="cb-cloud-status" id="cb-cloud-status">'+esc(status||t('云存档已就绪。','Cloud save is ready.'))+'</div>'+
    '<div class="cb-cloud-actions"><button class="cb-cloud-primary" data-cloud="sync">'+t('立即保存','Save now')+'</button>'+
    '<button class="cb-cloud-secondary" data-cloud="restore">'+t('读取云端存档','Load cloud save')+'</button></div>'+
    '<p class="cb-cloud-footnote">'+t('自动保存已开启。读取云档会替换当前设备的猫猫纽带进度。','Automatic sync is enabled. Loading replaces the Cat Bond progress on this device.')+'</p>';
  }else{
   body.innerHTML='<div class="cb-cloud-status" id="cb-cloud-status">'+esc(status||t('尚未建立云端存档。','No cloud save has been created yet.'))+'</div>'+
    '<button class="cb-cloud-primary cb-cloud-enable" data-cloud="enable">'+t('启用云存档','Enable cloud save')+'</button>'+
    '<p class="cb-cloud-footnote">'+t('启用后会自动同步当前浏览器中的游戏进度。','Once enabled, game progress in this browser will sync automatically.')+'</p>';
  }
  body.querySelectorAll('[data-cloud]').forEach(button=>button.onclick=()=>cloudAction(button.dataset.cloud));
 }
 async function cloudAction(action){
  const status=body.querySelector('#cb-cloud-status');
  const say=msg=>{if(status)status.textContent=msg;};
  try{
   if(action==='enable'){
    const token=makeToken();localStorage.setItem(CLOUD_KEY,token);localStorage.setItem(REV_KEY,'0');
    render(t('云存档已启用，正在保存当前进度。','Cloud save enabled. Saving current progress…'));
    const result=await syncNow(true);
    say(result.ok?t('云端存档已创建。','Cloud save created.'):result.empty?t('开始游戏后会自动保存。','Your progress will sync after you start playing.'):t('云端暂不可用，请稍后重试。','Cloud is unavailable. Please try again.'));
    return;
   }
   const token=localStorage.getItem(CLOUD_KEY);if(!token)throw Error('Cloud save is not enabled');
   if(action==='sync'){
    say(t('正在保存进度…','Saving progress…'));
    const result=await syncNow(true);
    say(result.ok?t('保存成功。','Saved successfully.'):result.conflict?t('云端有更新版本，请先读取云端存档。','A newer cloud save exists. Load it before saving again.'):result.empty?t('当前还没有游戏进度。','There is no game progress to save yet.'):t('保存失败，请检查网络后重试。','Save failed. Check your connection and try again.'));
    return;
   }
   if(action==='restore'){
    if(localStorage.getItem(SAVE_KEY)&&!confirm(t('读取云端存档会替换当前设备的猫猫纽带进度。继续吗？','Loading the cloud save replaces Cat Bond progress on this device. Continue?')))return;
    say(t('正在读取云端存档…','Loading cloud save…'));
    await restoreWithToken(token);return;
   }
  }catch(error){
   say(error?.message==='Cloud save not found'?t('暂时没有可读取的云端存档。','There is no cloud save to load yet.'):t('操作失败：','Action failed: ')+(error?.message||''));
  }
 }
 const updateLocale=()=>{
  render();
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
 if(!parsed||typeof parsed!=='object'||(!Array.isArray(parsed.cats)&&!(parsed.version===2&&parsed.slots&&typeof parsed.slots==='object')))
  throw Error(t('云存档内容无效，未覆盖本机存档。','Cloud save is invalid; local progress was not changed.'));
 if(parsed.version===2&&parsed.slots){
  localStorage.setItem(SLOT_KEY,JSON.stringify({version:1,slots:parsed.slots}));
  const active=Object.prototype.hasOwnProperty.call(parsed.slots,parsed.activeSlot)?parsed.activeSlot:'slot1';
  localStorage.setItem(ACTIVE_SLOT_KEY,active);
  const activeData=parsed.slots[active]?.data;
  if(activeData)localStorage.setItem(SAVE_KEY,JSON.stringify(activeData));
  else localStorage.removeItem(SAVE_KEY);
 }else{
  localStorage.setItem(SAVE_KEY,raw);
  localStorage.setItem(SLOT_KEY,JSON.stringify({version:1,slots:{slot1:{data:parsed,savedAt:parsed.lastSeen||Date.now()}}}));
  localStorage.setItem(ACTIVE_SLOT_KEY,'slot1');
 }
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
 if(syncPromise){syncPending=true;return syncPromise;}
 syncPromise=(async()=>{
  const raw=localStorage.getItem(SAVE_KEY);
  let payload=raw;
  try{
   const book=JSON.parse(localStorage.getItem(SLOT_KEY)||'null');
   if(book?.slots&&typeof book.slots==='object')payload=JSON.stringify({version:2,activeSlot:localStorage.getItem(ACTIVE_SLOT_KEY)||'slot1',slots:book.slots});
  }catch{}
  if(!payload)return {ok:false,empty:true};
  const encrypted=await encrypt(payload,token);
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
 if(!localStorage.getItem(CLOUD_KEY))return;
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
function openSlotManager(){
 document.querySelector('.cb-slot-manager')?.remove();
 const overlay=document.createElement('div');overlay.className='cb-cloud-overlay cb-slot-manager';
 overlay.innerHTML='<section class="cb-cloud-card cb-slot-manager-card"><button class="cb-cloud-close" type="button" aria-label="Close">×</button>'+
  '<p class="cb-cloud-eyebrow">THE LAST PAGE · SAVE ARCHIVE</p><h2>'+t('三个冒险存档位','Three adventure slots')+'</h2>'+
  '<p class="cb-cloud-lead">'+t('手动保存会把当前进度写入所选位置；读取会重新载入游戏。','Save writes your current progress into the selected slot. Load restarts the game from that slot.')+'</p>'+
  '<div class="cb-slot-manager-list"></div><p class="cb-cloud-footnote">'+t('自动保存始终写入当前选中的存档位。','Autosave always updates the currently active slot.')+'</p></section>';
 document.body.append(overlay);
 const close=()=>overlay.remove();
 overlay.querySelector('.cb-cloud-close').onclick=close;
 overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
 const list=overlay.querySelector('.cb-slot-manager-list');
 function render(){
  const current=window.State.activeSlot();
  list.innerHTML=window.State.listSaveSlots().map(slot=>{
   const date=slot.savedAt?new Date(slot.savedAt).toLocaleString():'';
   const label=slot.exists?slot.chapter:t('空存档位','Empty slot');
   const meta=slot.exists?t(slot.cats+' 只猫 · '+slot.fragments+'/6 段记忆 · '+date,slot.cats+' cats · '+slot.fragments+'/6 memories · '+date):t('尚未开始冒险','No adventure started');
   return '<article class="cb-slot-manager-row"><div><strong>'+t('存档位 ','Slot ')+slot.number+(slot.id===current?' · '+t('当前','Active'):'')+'</strong><span>'+esc(label)+'</span><small>'+esc(meta)+'</small></div><div class="cb-slot-manager-actions"><button type="button" data-save="'+slot.id+'">'+t('保存到此处','Save here')+'</button><button type="button" data-load="'+slot.id+'" '+(slot.exists?'':'disabled')+'>'+t('读取','Load')+'</button><button type="button" data-delete="'+slot.id+'" '+(slot.exists?'':'disabled')+'>'+t('删除','Delete')+'</button></div></article>';
  }).join('');
  list.querySelectorAll('[data-save]').forEach(btn=>btn.onclick=()=>{
   const id=btn.dataset.save,slot=window.State.listSaveSlots().find(x=>x.id===id);
   if(slot?.exists&&id!==current&&!confirm(t('覆盖这个存档位？','Overwrite this save slot?')))return;
   window.State.saveToSlot(id);render();
  });
  list.querySelectorAll('[data-load]').forEach(btn=>btn.onclick=()=>{
   const id=btn.dataset.load;if(id===current){close();return;}
   if(!confirm(t('读取此存档将重新载入游戏。继续吗？','Loading this save will restart the game. Continue?')))return;
   window.State.save();window.State.setActiveSlot(id);location.reload();
  });
  list.querySelectorAll('[data-delete]').forEach(btn=>btn.onclick=()=>{
   const id=btn.dataset.delete;
   if(!confirm(t('永久删除这个存档？此操作无法撤销。','Permanently delete this save? This cannot be undone.')))return;
   window.State.deleteSlot(id);
   window.CatBondCloudSave?.queue?.();
   if(id===current){close();location.reload();return;}
   render();
  });
 }
 render();
}
function openCloudPanel(){openCloudPanelImpl();}
function openCloudPanelImpl(){
 if(!window.crypto?.subtle){alert(t('当前浏览器不支持加密云存档。','This browser does not support encrypted cloud saves.'));return;}
 renderCloudPanel();
}
// Keep the two Last Page actions attached to the existing expedition menu.
// The main UI rebuilds this panel on a language change; sync after that rebuild
// as well, so narrow/portal layouts never retain stale or missing labels.
function syncExploreMenuActions(){
 const actions=document.querySelector('#panel .explore-menu-actions');
 if(!actions)return;
 for(const [action,icon,zh,en] of [
  ['journal','📖','故事手册','Story journal'],
  ['slots','💾','存档管理','Save slots'],
  ['cloud','☁️','云存档','Cloud save']
 ]){
  let button=actions.querySelector('[data-cb-story-action="'+action+'"]');
  if(!button){
   button=document.createElement('button');button.type='button';
   button.dataset.cbStoryAction=action;
   button.addEventListener('click',()=>action==='journal'?openJournal():action==='slots'?openSlotManager():openCloudPanelImpl());
   actions.append(button);
  }
  button.innerHTML='<span aria-hidden="true">'+icon+'</span><span>'+t(zh,en)+'</span>';
 }
}
if(window.UI?.openExploreMenu&&!window.UI.openExploreMenu.__lastPage){
 const original=window.UI.openExploreMenu;
 const wrapped=function(...args){
  const result=original.apply(this,args);
  syncExploreMenuActions();
  return result;
 };
 wrapped.__lastPage=true;window.UI.openExploreMenu=wrapped;
}
window.addEventListener('morrowwish-language-change',()=>{
 setTimeout(syncExploreMenuActions,0);
});
// A reset starts a fresh local run; the next save may replace this browser's cloud slot.
if(window.State?.save&&!window.State.save.__cbCloudWrapped){
 const original=window.State.save.bind(window.State);
 const wrapped=function(...args){const result=original(...args);try{queueSync();}catch{}return result;};
 wrapped.__cbCloudWrapped=true;window.State.save=wrapped;
}
function installIntro(){
 const cloudButton=document.getElementById('intro-cloud-save');
 const updateCloudLabel=()=>{if(cloudButton)cloudButton.textContent=t('☁️ 云存档','☁️ Cloud save');};
 updateCloudLabel();window.addEventListener('morrowwish-language-change',updateCloudLabel);
 // The prologue is launched only after the player chooses a new slot; continuing a save never replays it.
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

const NPC_CAST=[
 {id:'kite',region:'home',name:'纸鸢',en:'Kite',role:'Catdex 记录员',roleEn:'Catdex Keeper',species:'xiaohui',x:480,y:650,accent:'#d9b7c1',
  intro:['你醒来时，铃声已经停了。','“醒来”和“被叫回来”不是一回事。','这本 Catdex 替你留着一页空白。我一直不确定，那究竟是等待，还是警告。'],
  introEn:['The bell had already stopped when you woke.','Waking up and being called back are not the same thing.','This Catdex kept a blank page for you. I have never known whether it was an invitation or a warning.'],
  reveal:['我藏了被撕下的那一页。它记录着你和暮铃最后一次争执。','你说：“别替我决定我能承受什么。”','我害怕你看见真相后会转身离开，所以替你决定了该看见什么。现在我知道，这和当年的沉默没有区别。'],
  revealEn:['I hid the page that was torn out. It records your last argument with Muling.','You said, “Do not decide what I can bear for me.”','I feared the truth would make you turn away, so I decided what you were allowed to see. I understand now that this is another kind of silence.'],
  after:['我把残页放回 Catdex 了。它没有替你写下答案。','这次，最后一页留给你自己。'],
  afterEn:['I have returned the torn page to the Catdex. It does not answer the question for you.','This time, the last page belongs to you.'],
  epilogue:['我终于学会了记录一件事，而不替它决定意义。','你写下的新名字，我会好好保管。'],
  epilogueEn:['I have finally learned to record something without deciding what it must mean.','I will keep the new name you wrote safe.']},
 {id:'feizhi',region:'sakura',name:'绯枝',en:'Feizhi',role:'神社守签人',roleEn:'Shrine Keeper',species:'yinghua',x:520,y:650,accent:'#efadc4',
  intro:['别把签文当成预言。我只是替人保管问题。','这张纸被改过太多次，薄得快要透光了。','有些人害怕的不是未来，而是过去终于有了名字。'],
  introEn:['Do not mistake a fortune for a prophecy. I only keep people’s questions safe.','This paper has been rewritten so many times it is almost translucent.','Some people do not fear the future. They fear the past finally having a name.'],
  reveal:['我改写了神社的旧预言。原文曾被用来为星铃实验辩护。','我删掉了“自愿交出名字”那几个字，以为这样就没人会再把牺牲说成命运。','可被删掉的真相不会消失，只会让后来的人更难理解彼此。'],
  revealEn:['I rewrote the shrine’s old prophecy. The original words were used to justify the Star Bell experiment.','I removed the words “a name given willingly,” believing no one could turn sacrifice into destiny if the words were gone.','But an erased truth does not disappear. It only makes it harder for those left behind to understand one another.'],
  after:['我会把原文重新刻回石碑。不是为了恢复传统，而是让后来的人知道它曾经错在哪里。'],
  afterEn:['I will carve the original words back into the stone—not to restore the tradition, but to show where it went wrong.'],
  epilogue:['神社不再替任何人预言结局。','每一张新签都从一个问题开始。'],
  epilogueEn:['The shrine no longer predicts anyone’s ending.','Every new fortune begins with a question.']},
 {id:'duchuan',region:'creek',name:'渡川',en:'Duchuan',role:'溪谷摆渡人',roleEn:'Creek Ferryman',species:'lanbao',x:500,y:650,accent:'#8fc8d9',
  intro:['河水会带走东西，也会把东西还回来。','名字很轻。把它交出去的人，通常知道自己在做什么。','你一直看着水面，像是在等谁先开口。'],
  introEn:['The river carries things away. Sometimes it brings them back.','A name is light. Those who give one away usually know what they are doing.','You keep watching the water, as if waiting for someone else to speak first.'],
  reveal:['河没有偷走你的名字。是你亲手把它放进水里。','你不想让星铃把暮铃变成封印的锚，所以把自己的名字交给了河。','你知道这样一来，暮铃也许再也找不到你。你还是做了。'],
  revealEn:['The river did not steal your name. You placed it in the current yourself.','You would not let the Star Bell use Muling as the seal’s anchor, so you gave the river your name instead.','You knew Muling might never find you again. You chose it anyway.'],
  after:['河水没有替你保管一个旧答案。它只是让你有机会重新决定，什么值得带走。'],
  afterEn:['The river did not keep an old answer for you. It gave you the chance to decide what is worth carrying forward.'],
  epilogue:['渡船仍会经过这里。','只是这次，我会把灯留给所有想回家的人。'],
  epilogueEn:['The ferry will keep crossing this river.','This time, I will leave the lantern lit for everyone trying to find their way home.']},
 {id:'jinhe',region:'volcano',name:'烬禾',en:'Jinhe',role:'余烬守望者',roleEn:'Ember Warden',species:'senlin',x:540,y:650,accent:'#e7a16f',
  intro:['别把安静当成安全。星铃还在发热。','我记得封印合上的声音。比火山喷发的声音更清楚。','如果你想问那一天发生了什么，先听完，再决定要不要恨我。'],
  introEn:['Do not mistake quiet for safety. The Star Bell is still hot.','I remember the sound of the seal closing more clearly than the eruption.','If you want to ask what happened that day, hear me out before deciding whether to hate me.'],
  reveal:['我看见你转身走回星铃。你让我先带其他猫离开。','我关上了外面的门。暮铃只看见门合上，以为你选择了离开。','我本可以喊出真相。我没有。我把沉默称作守约，其实也有一部分是懦弱。'],
  revealEn:['I saw you turn back toward the Star Bell. You told me to get the other cats out first.','I closed the outer gate. Muling saw only the door shut and believed you had chosen to leave.','I could have shouted the truth. I did not. I called my silence loyalty. Part of it was cowardice.'],
  after:['如果你见到暮铃，不必替我求情。','我会留下来，亲自向那些被伤害的猫解释，也承担修复的责任。'],
  afterEn:['If you see Muling, do not ask them to forgive me.','I will stay and answer to the cats who were hurt. I will help repair what I helped seal away.'],
  epilogue:['我没有请求所有人原谅我。','我只答应每天把门打开，直到他们愿意相信这里安全为止。'],
  epilogueEn:['I did not ask everyone to forgive me.','I promised to open the gate every day until they believe this place is safe again.']},
 {id:'xingce',region:'ruins',name:'星簿',en:'Star Scribe',role:'遗迹解读者',roleEn:'Ruins Archivist',species:'yuelian',x:520,y:650,accent:'#b8a5df',
  intro:['星铃不回答问题。它只会重复你最放不下的那一句。','我读过最后一段乐谱。','我知道它会走向哪里，却一直没有告诉任何人。'],
  introEn:['The Star Bell does not answer questions. It repeats the words you cannot let go.','I have read the final movement of the score.','I know where it leads. I have not told anyone.'],
  reveal:['我知道逆响不能复原你。它只能制造一个足够像你的回声。','我以为你会在仪式完成前阻止暮铃，所以把真相留到最后。','我把怯懦伪装成研究，把别人的希望当成自己的筹码。这不是旁观，是共谋。'],
  revealEn:['I knew the Reversed Bell could not restore you. It could only make an echo convincing enough to resemble you.','I thought you would stop Muling before the ritual was complete, so I kept the truth until the end.','I disguised fear as research and used other people’s hope as leverage. That was not observation. It was complicity.'],
  after:['六段旋律原本是纪念，不是钥匙。','暮铃改写了最后一个音。我看见了，却没有阻止。'],
  afterEn:['The six melodies were written as a memorial, not a key.','Muling changed the final note. I saw it happen, and did nothing.'],
  epilogue:['我会把乐谱公开，也会把自己的沉默写进去。','历史不该只留下听起来体面的部分。'],
  epilogueEn:['I will publish the score, including the part where I stayed silent.','History should not preserve only the parts that sound respectable.']}
];
const NPC_CHOICES={
 kite:{prompt:'纸鸢问：如果一本记录完整，却让你误会一个人，你会先相信记录，还是先听当事人说话？',promptEn:'Kite asks: If a complete record made you misunderstand someone, would you trust the record or hear the person first?',
  options:[
   {id:'hear_people',flag:'hear_people',bond:2,label:'我会先听当事人的声音。',labelEn:'I would hear the person first.',reply:'纸鸢把爪子从书脊上移开：“那我会把残页交给你。”',replyEn:'Kite takes a paw off the book spine. “Then I will show you the missing page.”'},
   {id:'question_record',flag:'question_records',bond:1,label:'先找出每一处删改。',labelEn:'First, show me every alteration.',reply:'纸鸢点头：“记录也应该接受质疑。”',replyEn:'Kite nods. “Records should be questioned, too.”'}]},
 feizhi:{prompt:'绯枝问：如果真相会让一个等待你的人受伤，你希望现在听见，还是等记忆自己回来？',promptEn:'Feizhi asks: If the truth might hurt someone waiting for you, would you hear it now or let the memory return in its own time?',
  options:[
   {id:'truth_now',flag:'truth_now',bond:2,label:'现在告诉我。等待不该靠谎言维持。',labelEn:'Tell me now. Waiting should not be built on a lie.',reply:'绯枝收起笑容：“好。那我们从被涂掉的字开始。”',replyEn:'Feizhi stops smiling. “Then we begin with the words someone erased.”'},
   {id:'patience',flag:'patience',bond:1,label:'让我自己想起来，再面对它。',labelEn:'Let me remember it myself before I face it.',reply:'绯枝轻轻点头：“有些答案需要自己走到面前。”',replyEn:'Feizhi nods. “Some answers must be reached on your own.”'}]},
 duchuan:{prompt:'渡川问：如果取回自己的名字，会让另一个人再次成为封印的代价，你还会取回来吗？',promptEn:'Duchuan asks: If reclaiming your name could make someone else the seal’s price again, would you still take it back?',
  options:[
   {id:'protect_muling',flag:'protect_muling',bond:2,label:'我不会再让别人替我付出这种代价。',labelEn:'I will not let someone else pay that price for me again.',reply:'渡川望向河面：“你还是先看见了别人。”',replyEn:'Duchuan looks toward the water. “You still see the other person first.”'},
   {id:'claim_name',flag:'claim_name',bond:1,label:'我需要知道自己是谁，才能作出选择。',labelEn:'I need to know who I am before I can choose.',reply:'渡川点头：“知道自己是谁，也是一种责任。”',replyEn:'Duchuan nods. “Knowing who you are is also a responsibility.”'}]},
 jinhe:{prompt:'烬禾问：如果守约让另一个人误会了你，你能原谅守约的人吗？',promptEn:'Jinhe asks: If keeping a promise made someone misunderstand you, could you forgive the one who kept it?',
  options:[
   {id:'accountability',flag:'accountability',bond:2,label:'理由不能代替道歉。先承担，再谈原谅。',labelEn:'A reason is not an apology. Take responsibility first.',reply:'烬禾没有辩解：“你说得对。我欠的不只是解释。”',replyEn:'Jinhe does not argue. “You are right. I owe more than an explanation.”'},
   {id:'compassion',flag:'compassion',bond:1,label:'我会听完理由，但不会假装没有伤害。',labelEn:'I will hear the reason, but I will not pretend no one was hurt.',reply:'烬禾低下头：“这已经比我当年给自己的宽容多了。”',replyEn:'Jinhe lowers her head. “That is more grace than I gave myself.”'}]},
 xingce:{prompt:'星簿问：如果一段回忆能完美复刻一个人，你会把它叫作复活吗？',promptEn:'Star Scribe asks: If a memory could perfectly recreate someone, would you call that resurrection?',
  options:[
   {id:'person',flag:'person_not_memory',bond:2,label:'不会。记忆不是一个人。',labelEn:'No. A memory is not a person.',reply:'星簿终于抬起眼睛：“暮铃需要亲耳听见这句话。”',replyEn:'Star Scribe finally looks up. “Muling needs to hear that from you.”'},
   {id:'echo',flag:'echo_can_matter',bond:1,label:'回声仍然重要，但不能代替活着的人。',labelEn:'An echo matters, but it cannot replace someone living.',reply:'星簿合上星盘：“那么我们必须让它听见区别。”',replyEn:'Star Scribe closes the astrolabe. “Then we must make Muling hear the difference.”'}]}
};
function npcRoot(){
 const s=state();if(!s)return null;
 if(!s.npcStory||typeof s.npcStory!=='object')s.npcStory={talked:{},choices:{},relationships:{},revealed:{},memoryReady:{},visited:{},responses:{},flags:{},completed:0};
 const root=s.npcStory;
 root.talked||={};root.choices||={};root.relationships||={};root.revealed||={};root.memoryReady||={};root.visited||={};root.responses||={};root.flags||={};
 return root;
}
function npcSave(){save();window.__game?.refreshHUD?.();}
function npcHasMemory(npc){
 const page=REGION_PAGES[npc.region],s=storyState();
 return !!(page&&s?.fragments?.includes(page.id));
}
function showCreekRescueChoice(){
 const root=npcRoot();if(!root||root.rescueChoice)return;
 const en=!isZh(),overlay=document.createElement('div');overlay.className='cb-cloud-overlay cb-npc-dialog cb-rescue-memory';
 overlay.innerHTML='<section class="cb-cloud-card cb-npc-dialog-card"><p class="cb-cloud-eyebrow">CAT BOND · '+(en?'A MEMORY TO PROTECT':'必须先保护的记忆')+'</p><h2></h2><p class="cb-npc-dialog-line"></p><div class="cb-cloud-actions"></div></section>';
 document.body.append(overlay);
 overlay.querySelector('h2').textContent=en?'Two memories are slipping beneath the current.':'两段记忆正在被河水带走。';
 overlay.querySelector('.cb-npc-dialog-line').textContent=en
  ?'A frightened kitten remembers the way home. Duchuan remembers the promise that kept Muling from becoming the seal. You can stabilize only one before the current changes.'
  :'一只受惊的小猫还记得回家的路。渡川记得那句让暮铃没有成为封印代价的约定。水流正在改变，你只能先稳住其中一段。';
 const close=()=>{overlay.remove();};
 const choose=(id)=>{
  root.rescueChoice=id;root.flags[id==='kitten'?'saved_kitten_memory':'saved_ferryman_testimony']=true;
  npcSave();close();
  window.__game?.toast?.(id==='kitten'
   ?{zh:'你稳住了小猫回家的记忆。它记得一条穿过火山烟尘的安全小路。',en:'You preserved the kitten’s way home. It remembers a safe path through the volcanic smoke.'}
   :{zh:'你稳住了渡川的证词。河上的灯会为火山中的幸存者指路。',en:'You preserved Duchuan’s testimony. The river lanterns will guide survivors through the volcano.'});
 };
 const add=(zh,en,id)=>{const b=document.createElement('button');b.type='button';b.className='cb-cloud-primary';b.textContent=en?en:zh;b.onclick=()=>choose(id);overlay.querySelector('.cb-cloud-actions').append(b);};
 add('保护小猫记得的回家路线','Preserve the kitten’s way home','kitten');
 add('保护渡川关于封印的证词','Preserve Duchuan’s testimony','ferryman');
}
function showVolcanoAid(root){
 if(root.volcanoAidShown||!root.rescueChoice)return;
 root.volcanoAidShown=true;npcSave();
 const page=root.rescueChoice==='kitten'?{
  region:'volcano',kicker:'援手 · 记得回家的路',kickerEn:'AN ALLY · THE WAY HOME',
  title:'有人把路带来了。',titleEn:'Someone brought the way home.',
  text:'绯枝带着溪谷那只小猫赶到火山。小猫没有带来武器，只记得一条穿过烟尘的路。它把爪子按在地上，火光沿着那条路一盏盏亮起。\\n\\n【绯枝】你当时保护了它的记忆。现在，它来保护其他人。',textEn:'Feizhi reaches the volcano with the kitten from Creek Valley. The kitten carries no weapon, only the path it remembers through the smoke. It places a paw on the ground, and lights begin to glow along the route.\\n\\n[Feizhi] You protected its memory. Now it is here to help protect everyone else.'
 }:{
  region:'volcano',kicker:'援手 · 河灯作证',kickerEn:'AN ALLY · THE RIVER BEARS WITNESS',
  title:'河上的灯没有熄灭。',titleEn:'The river lanterns did not go dark.',
  text:'渡川把摆渡船驶进火山外缘的熔岩河道。河灯一盏接一盏亮起，为被困的猫咪标出撤离路线。\\n\\n【渡川】你保护了证词。现在，我会让所有人都听见它。',textEn:'Duchuan guides his ferry into the lava channel at the volcano’s edge. River lanterns ignite one by one, marking an evacuation route for the trapped cats.\\n\\n[Duchuan] You protected the testimony. Now I will make sure everyone hears it.'
 };
 setTimeout(()=>afterPanelClosed(()=>showSequence('memory',[page],()=>updateTracker(),{canSkip:false})),180);
}
function npcTalk(id){
 const npc=NPC_CAST.find(n=>n.id===id);if(!npc)return;
 const root=npcRoot();if(!root)return;
 const en=!isZh(),choice=NPC_CHOICES[id],hasChoice=!!root.choices[id],hasMemory=npcHasMemory(npc)||!!root.memoryReady[id];
 let stage=!hasChoice?'intro':(hasMemory&&!root.revealed[id]?'reveal':(state()?.story?.bossDefeated?'epilogue':'after'));
 if(stage==='reveal'){root.revealed[id]=true;root.completed=(root.completed||0)+1;npcSave();}
 root.talked[id]=true;
 let lines=stage==='intro'?(en?npc.introEn:npc.intro):
  stage==='reveal'?(en?npc.revealEn:npc.reveal):
  stage==='epilogue'?(en?npc.epilogueEn:npc.epilogue):(en?npc.afterEn:npc.after);
 lines=lines.slice();
 const response=root.responses[id];
 if(response)lines.push(en?response.en:response.zh);
 if(stage==='reveal'&&id==='jinhe'&&root.rescueChoice){
  lines.push(root.rescueChoice==='kitten'
   ?(en?'The kitten you protected has come with Feizhi. Its remembered path is guiding the others out.':'你保护过的小猫和绯枝一起来了。它记得的路线正在帮助其他猫撤离。')
   :(en?'Duchuan’s lanterns have reached the outer gate. His testimony will not be lost again.':'渡川的河灯已经抵达外门。他的证词不会再被埋没。'));
 }
 if(stage==='reveal'&&id==='xingce'&&root.rescueChoice){
  lines.push(root.rescueChoice==='kitten'
   ?(en?'The kitten’s memory survived because you chose a living path over a convenient record.':'小猫的记忆被保住了，因为你选择了活着的路，而不是一份方便的记录。')
   :(en?'Duchuan’s testimony survived. The Bell can no longer hide behind an incomplete account.':'渡川的证词被保住了。星铃再也不能躲在不完整的记录后面。'));
 }
 const overlay=document.createElement('div');overlay.className='cb-cloud-overlay cb-npc-dialog';
 overlay.innerHTML='<section class="cb-cloud-card cb-npc-dialog-card"><button class="cb-cloud-close" type="button" aria-label="Close">×</button><p class="cb-cloud-eyebrow">CAT BOND · '+(en?'A CONVERSATION THAT CHANGES':'一次会改变旅程的对话')+'</p><div class="cb-npc-dialog-head"><canvas width="120" height="120"></canvas><div><h2></h2><small></small><span></span></div></div><p class="cb-npc-dialog-line"></p><div class="cb-cloud-actions"></div></section>';
 document.body.append(overlay);
 const card=overlay.querySelector('.cb-npc-dialog-card'),close=()=>{window.removeEventListener('morrowwish-language-change',rerender);overlay.remove();};
 const rerender=()=>{close();npcTalk(id);};
 window.addEventListener('morrowwish-language-change',rerender);
 overlay.querySelector('.cb-cloud-close').onclick=close;overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
 card.querySelector('h2').textContent=en?npc.en:npc.name;
 card.querySelector('small').textContent=en?npc.roleEn:npc.role;
 card.querySelector('span').textContent=stage==='intro'?(en?'FIRST MEETING':'初次相遇'):stage==='reveal'?(en?'A MEMORY SURFACED':'记忆回响'):stage==='epilogue'?(en?'AFTER THE ENDING':'结局之后'):(en?'ON THE ROAD':'旅途中的对话');
 card.querySelector('.cb-npc-dialog-line').textContent=lines.join('\n\n');
 const species=window.GameData?.speciesById?.(npc.species);
 if(species&&window.CatArt?.renderCatThumb)window.CatArt.renderCatThumb(card.querySelector('canvas'),species);
 const actions=card.querySelector('.cb-cloud-actions');
 const add=(label,fn,primary=false)=>{const b=document.createElement('button');b.type='button';b.className=primary?'cb-cloud-primary':'cb-cloud-secondary';b.textContent=label;b.onclick=fn;actions.append(b);};
 if(stage==='intro'&&!hasChoice&&choice){
  card.querySelector('.cb-npc-dialog-line').textContent=lines.join('\n\n')+'\n\n'+(en?choice.promptEn:choice.prompt);
  choice.options.forEach(option=>add(en?option.labelEn:option.label,()=>{
   root.choices[id]=option.id;root.flags[option.flag]=true;
   root.relationships[id]=(root.relationships[id]||0)+(option.bond||1);
   root.responses[id]={zh:option.reply,en:option.replyEn};
   npcSave();close();npcTalk(id);
  },true));
  add(en?'Leave for now':'稍后再谈',close,false);return;
 }
 if(stage==='reveal')add(en?'Ask what happens next':'追问接下来会怎样',()=>{
  const extra=en?npc.afterEn:npc.after;
  card.querySelector('.cb-npc-dialog-line').textContent+='\n\n'+extra.join('\n\n');
 },true);
 add(en?'Close':'离开',close,false);
}
function npcEntered(region){
 const npc=NPC_CAST.find(n=>n.region===region);if(!npc)return;
 const root=npcRoot();if(!root)return;
 const first=!root.visited[npc.id];root.visited[npc.id]=true;
 if(npcHasMemory(npc))root.memoryReady[npc.id]=true;
 if(first){
  npcSave();
  window.__game?.toast?.({zh:'你听见有人哼着熟悉的旋律。靠近 '+npc.name+'，听听它为什么记得这段曲子。',en:'Someone is humming a familiar melody. Approach '+npc.en+' to learn why they remember it.'});
 }
 if(region==='volcano')showVolcanoAid(root);
}
function npcFound(region,reward){
 const npc=NPC_CAST.find(n=>n.region===region);if(!npc)return;
 if(reward?.discovery?.id!==region)return;
 const root=npcRoot();if(!root)return;
 root.memoryReady[npc.id]=true;npcSave();
 if(region==='creek'&&!root.rescueChoice){
  setTimeout(()=>afterPanelClosed(showCreekRescueChoice,0),180);
 }
}
function npcDraw(ctx,npc,time){
 const sp=window.GameData?.speciesById?.(npc.species);if(!sp)return;
 const root=npcRoot()||{choices:{},revealed:{}};
 const bob=Math.sin(time*1.8+npc.x)*2;
 ctx.save();ctx.fillStyle='rgba(25,31,37,.22)';ctx.beginPath();ctx.ellipse(npc.x,npc.y+18,28,8,0,0,Math.PI*2);ctx.fill();
 const draw=window.CatMotion?.draw||window.CatArt?.drawCat;
 if(draw)draw(ctx,npc.x,npc.y+bob,{species:sp,scale:.92,face:1,t:time,pose:'idle',motion:.08,mood:'happy'});
 ctx.fillStyle='rgba(24,29,39,.82)';ctx.font='800 12px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';
 const label=isZh()?npc.name:npc.en,ww=Math.max(54,ctx.measureText(label).width+18);
 ctx.beginPath();ctx.roundRect(npc.x-ww/2,npc.y-88+bob,ww,23,10);ctx.fill();
 ctx.fillStyle='#fff7e8';ctx.fillText(label,npc.x,npc.y-76+bob);
 const memory=npcHasMemory(npc)||!!root.memoryReady[npc.id];
 const mark=!root.choices[npc.id]?'✦':(memory&&!root.revealed[npc.id]?'!':(state()?.story?.bossDefeated?'★':'·'));
 ctx.fillStyle=mark==='!'?'#ffd36b':mark==='★'?'#c8e7bd':'#ffe8ae';ctx.beginPath();ctx.arc(npc.x+30,npc.y-82+bob,10,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#465345';ctx.font='900 11px system-ui';ctx.fillText(mark,npc.x+30,npc.y-81+bob);
 ctx.restore();
}
window.CatBondNPC={
 forRegion:id=>NPC_CAST.filter(n=>n.region===id),
 talk:npcTalk,draw:npcDraw,onRegionEntered:npcEntered,onDiscovery:npcFound
};
window.CatBondStory={
 startPrologue,onRegionEntered,onRegionDiscovery,openJournal,showBossReveal,showBossRetry,onBossPhase,
 onBossVictory,playEnding,updateTracker
};
window.CatBondCloudSave={openPanel:openCloudPanelImpl,queue:queueSync,syncNow};
})();