(() => {
  'use strict';
  const seasonList=window.ELSEWHERE_SEASON||[];
  const seasonById=Object.fromEntries(seasonList.map(s=>[s.id,s]));
  const legacy=window.ELSEWHERE_WORLDS||[];
  const worlds=seasonList.length?seasonList.map(season=>{
   const base=legacy.find(w=>w.id===season.id)||{};
   return {...base,id:season.id,title:season.name,tag:season.tag,subtitle:season.intro,
    chapters:season.acts.map((act,i)=>({
     title:act.loc,time:act.clock,scene:act.n[0],
     choices:act.choices.map((choice,j)=>({label:choice[0],hint:'Shape what happens next',reply:choice[1],effect:choice[2],tag:'scene-'+i+'-choice-'+(j+1)}))
    }))};
  }):legacy;
  const WORLD_BY_ID = Object.fromEntries(worlds.map(w => [w.id, w]));
  const STORE_KEY = 'elsewhere_lives_v1';
  const LENS_KEY='elsewhere_reader_lens_v2';
  let lens=(()=>{try{return localStorage.getItem(LENS_KEY)||'curiosity'}catch{return 'curiosity'}})();
  const QUALITY_NAMES = ['Curiosity','Connection','Freedom'];
  const newId=()=>globalThis.crypto?.randomUUID?.()||Math.random().toString(36).slice(2)+Date.now().toString(36);
  const TRACKED=new Set(['world_open','chapter_view','choice_made','chapter_completed','life_completed','life_restarted','ending_view','share_clicked','ending_feedback']);
  const COLLECTOR='/api/elsewhere-collect';
  const TRACKING_ALLOWED=()=>navigator.globalPrivacyControl!==true && navigator.doNotTrack!=='1';
  const visitorId=(()=>{if(!TRACKING_ALLOWED())return null;try{let s=localStorage.getItem('arcade-visitor-v2')||localStorage.getItem('elsewhere-visitor-v2');if(!s||!/^[a-zA-Z0-9-]{8,80}$/.test(s)){s=newId()}localStorage.setItem('arcade-visitor-v2',s);return s}catch{return null}})();
  const $ = (s) => document.querySelector(s);
  let allSaves = readSaves();
  let active = null;
  let speaking = false;
  let toastTimeout;

  function readSaves() {
    let saves={};
    try{const obj=JSON.parse(localStorage.getItem(STORE_KEY)||'{}');if(obj&&typeof obj==='object'&&!Array.isArray(obj))saves=obj}catch{}
    // One-time handoff from the old Elsewhere domain. URL fragment is never sent to the server.
    if(location.hash.startsWith('#from-elsewhere=')){
      try{
        const legacy=JSON.parse(decodeURIComponent(location.hash.slice('#from-elsewhere='.length)));
        if(legacy&&typeof legacy==='object'&&!Array.isArray(legacy)){
          for(const id of Object.keys(WORLD_BY_ID))if(!saves[id]&&legacy[id]&&typeof legacy[id]==='object'&&legacy[id].world===id)saves[id]=legacy[id];
          localStorage.setItem(STORE_KEY,JSON.stringify(saves));
        }
      }catch{}
      history.replaceState({},'',location.pathname+location.search);
    }
    return saves;
  }
  function persist() {
    if (!active) return;
    allSaves[active.world] = structuredClone(active);
    try { localStorage.setItem(STORE_KEY, JSON.stringify(allSaves)); } catch { notify('Your browser could not save this life.'); }
  }
  function freshState(id) { return {world:id, chapter:0, selected:null, decisions:[], scores:[0,0,0], finished:false, runId:newId(), endingTracked:false, storyVersion:2, explored:{}, seenChapters:[]}; }
  function getState(id) {
    const s=allSaves[id], w=WORLD_BY_ID[id];
    if (!s || !w || !Array.isArray(s.decisions) || !Array.isArray(s.scores) || s.scores.length!==3 || !Number.isInteger(s.chapter) || s.chapter<0 || s.chapter>=w.chapters.length || typeof s.finished!=='boolean') return freshState(id);
    if (s.selected!==null && (typeof s.selected!=='number' || s.selected<0 || s.selected>2)) return freshState(id);
    const copy=structuredClone(s);
    if(!copy.storyVersion||copy.storyVersion<2){
      const oldFinished=copy.finished;
      copy.chapter=Math.min(oldFinished?4:copy.chapter,7);
      copy.finished=false;copy.selected=null;copy.endingTracked=false;
      copy.storyVersion=2;copy.explored={};copy.seenChapters=[];
    }
    if(!copy.explored||typeof copy.explored!=='object')copy.explored={};
    if(!Array.isArray(copy.seenChapters))copy.seenChapters=[];
    if(typeof copy.runId!=='string'||copy.runId.length<8)copy.runId=newId();
    if(typeof copy.endingTracked!=='boolean')copy.endingTracked=false;
    return copy;
  }
  function routeVector(){
    if(!active)return '';
    const choices=active.decisions.map((d,i)=>{if(Number.isInteger(d?.choice)&&d.choice>=1&&d.choice<=3)return d.choice;const items=WORLD_BY_ID[active.world].chapters[i]?.choices||[];return items.findIndex(x=>x.tag===d?.tag)+1;});
    return choices.filter(n=>n>=1&&n<=3).join('-');
  }
  function track(event,data={}){
    if(!TRACKING_ALLOWED())return;
    try{if(typeof window.va==='function')window.va('event',{name:event,data})}catch{}
    const session=(()=>{try{let s=sessionStorage.getItem('elsewhere_session_v1');if(!s){s=newId();sessionStorage.setItem('elsewhere_session_v1',s)}return s}catch{return newId()}})();
    if(event==='world_open')window.arcadeMetric?.('game_start');
    if(event==='life_completed')window.arcadeMetric?.('game_complete');
    if(event==='life_restarted')window.arcadeMetric?.('retry');
    if(event==='share_clicked')window.arcadeMetric?.('share_clicked');
    const own={event,session,runId:active?.runId||undefined,...data};
    const payload=JSON.stringify(own);
    if(TRACKED.has(event)&&active&&visitorId){
      const external=JSON.stringify({...own,visitor:visitorId,world:active.world});
      try{const blob=new Blob([external],{type:'text/plain;charset=UTF-8'});if(!navigator.sendBeacon?.(COLLECTOR,blob))fetch(COLLECTOR,{method:'POST',mode:'same-origin',credentials:'omit',headers:{'Content-Type':'text/plain'},body:external,keepalive:true}).catch(()=>{})}catch{}
    }
  }
  function notify(message) {
    const el=$('#toast'); el.textContent=message; el.classList.add('show'); clearTimeout(toastTimeout); toastTimeout=setTimeout(()=>el.classList.remove('show'),3300);
  }
  function setText(sel,value) { const el=$(sel); if(el) el.textContent=value; }
  function art(id) {
    const common='<defs><linearGradient id="s-'+id+'" x1="0" y1="0" x2=".15" y2="1"><stop offset="0" stop-color="'+({ 'no-work':'#66637e',bookshop:'#306b84',paris:'#a26981',cabin:'#283e69'}[id] || '#555')+'"/><stop offset="1" stop-color="'+({'no-work':'#efb38f',bookshop:'#9ac9bc',paris:'#f0be9e',cabin:'#86a8ac'}[id] || '#aaa')+'"/></linearGradient></defs>';
    const images={
      'no-work': `<circle cx="443" cy="105" r="76" fill="#fae1bc" opacity=".93"/><circle cx="443" cy="105" r="95" fill="none" stroke="#f7e2d1" opacity=".35"/><path d="M0 215Q150 164 260 204T600 179V360H0Z" fill="#8b8a9a"/><path d="M0 245Q140 218 265 250T600 237V360H0Z" fill="#55687c"/><g fill="#39485b"><rect x="85" y="116" width="55" height="180" rx="17"/><rect x="161" y="152" width="42" height="161" rx="10"/><rect x="244" y="117" width="49" height="183" rx="11"/><rect x="308" y="160" width="39" height="143" rx="9"/><rect x="405" y="176" width="47" height="148" rx="11"/><rect x="487" y="135" width="43" height="166" rx="13"/></g><g stroke="#f7d4bb" stroke-width="2" opacity=".65"><path d="M97 151v17m18-17v17m-18 19v17m18-17v17m58-20v20m17-20v20m63-49v23m20-23v23m45 2v16m15-16v16m89-1v20m17-20v20m57-35v24m16-24v24"/></g><path d="M0 296Q145 263 304 300T600 270V360H0Z" fill="#293d4c"/><path d="M0 323Q185 297 317 326T600 314V360H0Z" fill="#1e2f3d"/><g fill="#b0c6ab"><circle cx="30" cy="282" r="35"/><circle cx="63" cy="281" r="29"/><circle cx="550" cy="269" r="40"/><circle cx="581" cy="291" r="38"/></g>`,
      bookshop:`<circle cx="462" cy="74" r="41" fill="#fce3b0"/><path d="M0 241Q135 202 279 235T600 224V360H0Z" fill="#508d98"/><path d="M0 267Q180 245 341 273T600 261V360H0Z" fill="#39717f"/><g><path d="M118 140L296 80 440 140V311H118Z" fill="#d5ad8e"/><path d="M105 144L290 72 451 144" fill="none" stroke="#2c4b5d" stroke-width="23" stroke-linejoin="round"/><rect x="152" y="180" width="260" height="124" fill="#285060"/><rect x="171" y="193" width="92" height="103" fill="#e2c6a3"/><rect x="278" y="193" width="112" height="103" fill="#e2c6a3"/><path d="M170 216h94m-94 36h94m17-36h109m-109 36h109" stroke="#497e78" stroke-width="5"/><path d="M181 219v30m17-30v30m20-30v30m79-30v30m24-30v30m24-30v30" stroke="#bf765c" stroke-width="10"/><rect x="290" y="273" width="64" height="40" fill="#354759"/><path d="M149 165H414" stroke="#f6e5c2" stroke-width="16"/><path d="M145 166l17 27 17-27 17 27 17-27 17 27 17-27 17 27 17-27 17 27 17-27 17 27 17-27 17 27 17-27" fill="#c8736a"/><rect x="269" y="109" width="65" height="21" rx="3" fill="#e0c4a3"/></g><path d="M0 313Q184 295 337 319T600 307V360H0Z" fill="#284b56"/><g fill="#e8bf96"><circle cx="48" cy="61" r="2"/><circle cx="83" cy="100" r="2"/><circle cx="518" cy="132" r="2"/></g>`,
      paris:`<circle cx="452" cy="92" r="68" fill="#ffe0bd" opacity=".9"/><path d="M0 207Q150 199 267 220T600 194V360H0Z" fill="#d9a4a1"/><g fill="#906579"><path d="M0 210l50-52 56 52v140H0Z"/><rect x="91" y="195" width="110" height="143"/><path d="M84 195l59-41 65 41"/><rect x="380" y="191" width="95" height="160"/><path d="M367 192l59-47 61 47"/><rect x="480" y="223" width="120" height="133"/></g><path d="M280 306h74l-37-170z" fill="none" stroke="#654f66" stroke-width="7" stroke-linejoin="round"/><path d="M299 136h36M291 210h52m-59 50h66m-63-23h58" stroke="#654f66" stroke-width="6"/><path d="M317 115v21" stroke="#654f66" stroke-width="5"/><g fill="#f9d5b7"><rect x="16" y="232" width="17" height="28"/><rect x="59" y="232" width="17" height="28"/><rect x="113" y="225" width="18" height="33"/><rect x="156" y="225" width="18" height="33"/><rect x="397" y="227" width="18" height="27"/><rect x="438" y="227" width="18" height="27"/><rect x="504" y="254" width="18" height="33"/><rect x="545" y="254" width="18" height="33"/></g><path d="M0 307Q150 298 285 314T600 295V360H0Z" fill="#644d63"/><path d="M0 333Q220 309 600 327V360H0Z" fill="#403e56"/>`,
      cabin:`<circle cx="456" cy="91" r="59" fill="#efe7bf"/><circle cx="443" cy="80" r="53" fill="#f8eccd" opacity=".5"/><path d="M0 213Q133 140 244 194T600 169V360H0Z" fill="#56798a"/><path d="M0 237Q143 202 280 234T600 200V360H0Z" fill="#36556c"/><g fill="#223e51"><path d="M34 287l39-140 39 140Z M101 286l35-125 35 125Z M440 287l43-152 43 152Z M503 284l37-130 37 130Z M555 289l34-106 34 106Z"/></g><g fill="#bed0cf" opacity=".8"><path d="M51 225l22-78 22 78-22-15Z M119 223l17-62 17 62-17-11Z M463 210l20-75 22 75-22-11Z M523 217l17-63 17 63-17-10Z"/></g><path d="M166 253l105-84 103 84v86H166Z" fill="#865f5f"/><path d="M153 255l118-97 116 97" fill="none" stroke="#2b3e4c" stroke-width="20" stroke-linejoin="round"/><rect x="247" y="268" width="48" height="75" fill="#3b3f4c"/><rect x="189" y="264" width="43" height="42" fill="#ffdda4"/><rect x="310" y="264" width="43" height="42" fill="#ffdda4"/><path d="M210 264v42m-21-21h43m99-21v42m-21-21h43" stroke="#986a67" stroke-width="4"/><path d="M0 329Q140 303 276 323T600 306V360H0Z" fill="#d5dcce"/><path d="M0 344Q200 324 420 345T600 326V360H0Z" fill="#b8cfc6"/><g fill="#fff5dd"><circle cx="60" cy="55" r="2"/><circle cx="170" cy="100" r="2"/><circle cx="330" cy="58" r="1.5"/><circle cx="534" cy="105" r="2"/><circle cx="572" cy="49" r="2"/></g>`
    };
    return `<div class="world-art" aria-hidden="true"><svg viewBox="0 0 600 360" preserveAspectRatio="xMidYMid slice" role="img"><rect width="600" height="360" fill="url(#s-${id})"/>${common}${images[id]||images.cabin}</svg></div>`;
  }
  function renderGrid() {
    $('#world-grid').innerHTML=worlds.map(w=>{
      const save=allSaves[w.id];
      const progress=save?.finished?'LIFE COMPLETED':save&&(save.chapter>0||save.selected!==null)?`CONTINUE SCENE ${Math.min(save.chapter+1,8)} · 8`:'8 CINEMATIC SCENES';
      return `<button class="world-card" style="--card-accent:${w.accent}" data-world="${w.id}" type="button" aria-label="Enter ${w.title}"><img class="world-card-image" src="/elsewhere/scenes/${w.id}-1.svg" alt="${w.title}, illustrated story world" loading="lazy"><div class="world-card-info"><span class="world-tag">${w.tag}</span><div class="world-name">${w.title}</div><p class="world-description">${w.subtitle}</p><div class="world-card-bottom"><span class="world-progress">${progress}</span><span class="world-arrow" aria-hidden="true">↗</span></div></div></button>`;
    }).join('');
  }
  function stopSpeech() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    speaking=false;
    $('#narrate-btn').innerHTML='<span aria-hidden="true">◌</span> Listen';
    $('#narrate-btn').setAttribute('aria-pressed','false');
  }
  function goHome(push=true) {
    stopSpeech();active=null;
    $('#home-view').classList.remove('hidden');$('#play-view').classList.add('hidden');$('#home-btn').classList.add('hidden');$('#site-footer').classList.remove('hidden');
    renderGrid(); if(push) history.pushState({},'',location.pathname);
    window.scrollTo({top:0,behavior:'instant'});
    document.title='Elsewhere — Live another life';
  }
  function openWorld(id,options={}) {
    const w=WORLD_BY_ID[id]; if(!w)return;
    stopSpeech();active=options.restart?freshState(id):getState(id);
    if(options.restart)persist();
    $('#home-view').classList.add('hidden');$('#play-view').classList.remove('hidden');$('#home-btn').classList.remove('hidden');$('#site-footer').classList.add('hidden');
    if(options.push!==false)history.pushState({world:id},'',`/elsewhere/?world=${encodeURIComponent(id)}`);
    document.title=`${w.title} — Elsewhere`;
    track('world_open',{world:id,resume:active.chapter>0});
    renderChapter();window.scrollTo({top:0,behavior:'instant'});
  }
  function renderSidebar() {
    const w=WORLD_BY_ID[active.world];
    $('#sidebar-art').innerHTML=`<img src="/elsewhere/scenes/${w.id}-1.svg" alt="${w.title} story art" loading="lazy">`;
    setText('#sidebar-title',w.title);setText('#sidebar-subtitle',w.reading);
    $('#progress-dots').innerHTML=w.chapters.map((_,i)=>`<span class="${i<active.chapter||active.finished?'filled':i===active.chapter?'current':''}" title="Chapter ${i+1}"></span>`).join('');
    const total=Math.max(4,Math.max(...active.scores,0)+3);
    $('#quality-bars').innerHTML=QUALITY_NAMES.map((q,i)=>`<div class="quality-row"><span>${q}</span><div class="quality-rail"><div class="quality-fill" style="width:${Math.min(100,Math.round((active.scores[i]+1)/total*100))}%"></div></div></div>`).join('');
    setText('#play-breadcrumb', '');
    $('#play-breadcrumb').innerHTML=`<strong>${w.title}</strong><span> / </span>${active.finished?'Your ending':`Scene ${active.chapter+1} of ${w.chapters.length}`}`;
  }
  function resolvedChapter(){
    const w=WORLD_BY_ID[active.world],base=w.chapters[active.chapter],act=seasonById[w.id]?.acts[active.chapter];
    if(!act)return base;
    const prior=active.decisions[active.chapter-1];
    const variant=prior?.choice===2?1:0;
    return {...base,scene:act.n[variant]||act.n[0],dialogue:act.say,inspect:act.inspect,image:'/elsewhere/scenes/'+w.id+'-'+(active.chapter+1)+'.svg',branchRoute:prior?.tag};
  }
  function inspectScene(index){
    if(!active||active.finished)return;
    const ch=resolvedChapter();
    if(!ch.inspect?.[index])return;
    active.explored=active.explored||{};
    active.explored[active.chapter]=index;
    persist();renderChapter();
    document.getElementById('scene-discovery')?.scrollIntoView({block:'nearest',behavior:'smooth'});
  }
  function renderChapter(){
    if(!active)return;
    renderSidebar();
    const w=WORLD_BY_ID[active.world];
    if(active.finished){renderEnding();return;}
    const ch=resolvedChapter(),act=seasonById[w.id]?.acts[active.chapter];
    const visited=active.explored?.[active.chapter],discovery=ch.inspect?.[visited];
    const sceneNo=active.chapter+1;
    const photo=ch.image||'/elsewhere/scenes/'+w.id+'-'+sceneNo+'.svg';
    const action=active.selected===null
      ?'<div class="scene-prompt"><span class="micro-label">A MOMENT THAT CHANGES THINGS</span><h3>What would you do?</h3><div class="scene-choices">'+ch.choices.map((c,i)=>'<button type="button" class="scene-choice" data-choice="'+i+'"><span class="scene-choice-mark">'+(i===0?'✷':'✦')+'</span><span><strong>'+c.label+'</strong><small>Make this part of your story</small></span><span class="scene-choice-arrow">↗</span></button>').join('')+'</div></div>'
      :'<div class="scene-result"><span class="micro-label">YOU CHOSE · '+ch.choices[active.selected].label+'</span><p>'+ch.choices[active.selected].reply+'</p><button type="button" class="next-btn scene-next" id="continue-btn">'+(sceneNo===w.chapters.length?'See how your life ends':'Continue your story')+' <span aria-hidden="true">→</span></button></div>';
    const memory=act?.inspect||[];
    const inspectList='<div class="scene-details"><span class="micro-label">EXPLORE THE MOMENT</span><div class="scene-hotspots">'+memory.map((a,i)=>'<button type="button" data-inspect="'+i+'" class="scene-hotspot '+(visited===i?'active':'')+'"><span>'+a[0]+'</span>'+a[1]+'</button>').join('')+'</div>'+(discovery?'<div id="scene-discovery" class="scene-discovery"><span>✧ YOU NOTICED</span><p>'+discovery[2]+'</p></div>':'')+'</div>';
    $('#chapter-content').innerHTML='<div class="cinematic-frame"><img class="cinematic-image" src="'+photo+'" alt="Illustrated scene: '+ch.title+'" fetchpriority="high"><div class="cinematic-shade"></div><div class="cinematic-top"><span>ELSEWHERE / '+w.title.toUpperCase()+'</span><span>SCENE '+String(sceneNo).padStart(2,'0')+' / 08</span></div><div class="cinematic-caption"><span class="scene-time">'+ch.time+'</span><h1>'+ch.title+'</h1></div></div><div class="scene-content" id="reading-area"><div class="scene-progress-track"><span style="width:'+(sceneNo/8*100)+'%"></span></div><div class="scene-narrative"><span class="micro-label">YOUR DAY UNFOLDS</span><p id="narration-text">'+ch.scene+'</p></div><div class="scene-character"><span class="scene-avatar">'+({'no-work':'🌿',bookshop:'📚',paris:'🥐',cabin:'❄️'}[w.id])+'</span><div><span class="scene-speaker">'+(seasonById[w.id]?.character||'A FRIEND')+'</span><p>'+String(ch.dialogue||'').replace(/^([^:]+):\s*/,'')+'</p></div></div>'+inspectList+action+'</div>';
    $('#story-paper').setAttribute('aria-label','Scene '+sceneNo+': '+ch.title);
    if(active.selected===null&&!active.seenChapters.includes(active.chapter)){
      active.seenChapters.push(active.chapter);persist();
      track('chapter_view',{world:w.id,chapter:sceneNo});
      if(ch.branchRoute)track('branch_reached',{world:w.id,chapter:sceneNo});
    }
  }
  function choose(i) {
    if(!active||active.selected!==null||active.finished)return;
    const ch=resolvedChapter(), c=ch.choices[i];if(!c)return;
    active.selected=i;active.decisions[active.chapter]={tag:c.tag,label:c.label,route:ch.branchRoute||null,choice:i+1};
    active.scores=active.scores.map((n,k)=>n+c.effect[k]);
    persist();track('choice_made',{world:active.world,chapter:active.chapter+1,choice:i+1,routeVector:routeVector()});
    stopSpeech();renderChapter();
    $('#reading-area')?.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function continueChapter() {
    if(!active||active.selected===null)return;
    const w=WORLD_BY_ID[active.world];
    track('chapter_completed',{world:active.world,chapter:active.chapter+1,routeVector:routeVector()});
    if(active.chapter===w.chapters.length-1){active.finished=true;active.endingTracked=false;persist();track('life_completed',{world:active.world,routeVector:routeVector()});}
    else{active.chapter++;active.selected=null;persist();}
    stopSpeech();renderChapter();window.scrollTo({top:0,behavior:'smooth'});
  }
  const STORY_ENDINGS={"no-work":[{"title":"The Greenhouse That Stayed","sub":"You built a home for a city with nothing but time.","detail":"No one had to show up. They came because you made the room feel like theirs. The greenhouse belongs to the neighbors who keep returning."},{"title":"The Road Beyond Tuesday","sub":"Your freedom was never meant to stand still.","detail":"You planted something that will grow without you. Then you took the road to the next little adventure."}],"bookshop":[{"title":"The Bookshop of Open Doors","sub":"A town found a home between two shelves.","detail":"You turned a forgotten shop into a place where neighbors hold the keys together and the harbor has a new chapter."},{"title":"Postcards Beyond the Harbor","sub":"Some stories belong to the road.","detail":"The shop remains a place to return to. Its stories travel with you, carrying the voices of the people you met."}],"paris":[{"title":"The Cinema of Second Chances","sub":"You saved the room where strangers become neighbors.","detail":"At the first reopening, the projectionist keeps you a seat. Paris finally feels like somewhere you might stay."},{"title":"The City of Little Screens","sub":"You helped the city find new places to dream.","detail":"On roofs, in courtyards, and between narrow streets, people gather for the films you helped set free."}],"cabin":[{"title":"The Lantern in the Snow","sub":"You became a light someone could find.","detail":"On winter nights the ranger cabin glows beside the lake. Your quiet life has room for others."},{"title":"The Path After Winter","sub":"You learned to belong without standing still.","detail":"You leave the lake safer than you found it, and carry its stillness wherever your next season leads."}]};
  function renderEnding(){
    const w=WORLD_BY_ID[active.world];
    if(!active.endingTracked){active.endingTracked=true;persist();track('ending_view',{world:active.world,routeVector:routeVector()});}
    const choice=active.decisions[active.decisions.length-1]?.choice===2?1:0;
    const ending=STORY_ENDINGS[w.id]?.[choice]||STORY_ENDINGS['no-work'][0];
    const pathTaken=active.decisions.filter(Boolean).map(d=>d.choice||1).join(' → ');
    const image='/elsewhere/scenes/'+w.id+'-8.svg';
    $('#chapter-content').innerHTML='<div class="cinematic-frame ending-scene"><img class="cinematic-image" src="'+image+'" alt="The final scene of '+w.title+'"><div class="cinematic-shade"></div><div class="cinematic-caption"><span class="scene-time">YOUR UNIQUE ENDING · '+w.title.toUpperCase()+'</span><h1>'+ending.title+'</h1></div></div><div class="scene-content ending-content"><div class="micro-label">A LIFE YOU SHAPED</div><h2>'+ending.sub+'</h2><p>'+ending.detail+'</p><div class="ending-route">YOUR CHOICES<br><strong>'+pathTaken+'</strong></div><div class="ending-actions"><button type="button" class="next-btn" id="ending-share">Share this ending ↗</button><button type="button" class="outline-btn" id="ending-again">Live it differently ↺</button></div><div class="ending-feedback"><span>Would you come back to live another life?</span>'+(active.feedback?'<p>Thank you for sharing your thoughts.</p>':'<div class="feedback-actions"><button type="button" data-feedback="yes">Absolutely</button><button type="button" data-feedback="maybe">Maybe</button><button type="button" data-feedback="no">Not yet</button></div>')+'</div><div class="ending-actions"><button type="button" class="outline-btn" id="ending-home">Explore another life →</button></div></div>';
  }
  function shareWorld() {
    if(!active)return;
    const w=WORLD_BY_ID[active.world];
    const link=new URL(location.origin+location.pathname);link.searchParams.set('world',w.id);
    const chosenEnding=STORY_ENDINGS[w.id]?.[active.decisions[active.decisions.length-1]?.choice===2?1:0];
    const message=active.finished&&chosenEnding?`I discovered the ending “${chosenEnding.title}” in Elsewhere. Which life will you live?`:`I lived another life in “${w.title}.” What would you choose?`;
    track('share_clicked',{world:w.id,finished:active.finished});
    if(navigator.share){navigator.share({title:`${w.title} · Elsewhere`,text:message,url:link.toString()}).catch(()=>{});return;}
    const text=message+' '+link.toString();
    if(navigator.clipboard?.writeText){navigator.clipboard.writeText(text).then(()=>notify('Invitation copied — share it with someone curious.')).catch(()=>notify('You can copy the link from your address bar.'));}
    else{notify('Copy the link from your address bar to share.');}
  }
  function narrate() {
    if(!('speechSynthesis' in window)){notify('Read-aloud is not available in this browser.');return;}
    if(speaking){stopSpeech();return;}
    if(!active || active.finished)return;
    const ch=resolvedChapter();
    const prev=active.decisions[active.chapter-1]; const recall=(prev&&ch.recall?.[prev.tag])||'';
    const u=new SpeechSynthesisUtterance(ch.scene+' '+(ch.dialogue||'')+' '+recall+(active.selected!==null?' '+ch.choices[active.selected].reply:''));
    u.rate=.87;u.pitch=.98;u.lang='en-US';
    u.onend=u.onerror=()=>{speaking=false;$('#narrate-btn').innerHTML='<span aria-hidden="true">◌</span> Listen';$('#narrate-btn').setAttribute('aria-pressed','false');};
    speaking=true;$('#narrate-btn').innerHTML='<span aria-hidden="true">■</span> Stop';$('#narrate-btn').setAttribute('aria-pressed','true');window.speechSynthesis.speak(u);track('listen_started',{world:active.world,chapter:active.chapter+1});
  }
  function restart() {
    if(!active)return;
    if(!window.confirm('Start over? Your choices and ending for this life will be replaced.'))return;
    const id=active.world;track('life_restarted',{world:id,finished:active.finished,routeVector:routeVector()});openWorld(id,{restart:true,push:false});
  }
  function openAbout(){$('#about-dialog').showModal();}
  document.addEventListener('click',event=>{
    const world=event.target.closest('[data-world]');if(world){openWorld(world.dataset.world);return;}
    const insight=event.target.closest('[data-inspect]');if(insight){inspectScene(Number(insight.dataset.inspect));return;}
    const choice=event.target.closest('[data-choice]');if(choice){choose(Number(choice.dataset.choice));return;}
    if(event.target.closest('#continue-btn')){continueChapter();return;}
    const lensBtn=event.target.closest('[data-lens]');if(lensBtn){lens=lensBtn.dataset.lens;try{localStorage.setItem(LENS_KEY,lens)}catch{};refreshLens();track('lens_selected',{lens});return;}
    const feedback=event.target.closest('[data-feedback]');if(feedback&&active?.finished&&!active.feedback){active.feedback=feedback.dataset.feedback;persist();track('ending_feedback',{world:active.world,sentiment:active.feedback});renderEnding();notify('Thank you for helping shape Elsewhere.');return;}
    if(event.target.closest('#ending-share')||event.target.closest('#share-btn')){shareWorld();return;}
    if(event.target.closest('#ending-again')||event.target.closest('#restart-btn')){restart();return;}
    if(event.target.closest('#ending-home')||event.target.closest('#home-btn')){goHome();return;}
    if(event.target.closest('#narrate-btn')){narrate();return;}
    if(event.target.closest('#about-btn')||event.target.closest('#footer-about')){openAbout();return;}
    if(event.target.closest('#dialog-close')){$('#about-dialog').close();return;}
  });
  $('#about-dialog').addEventListener('click',event=>{if(event.target===$('#about-dialog'))$('#about-dialog').close();});
  $('#brand').addEventListener('click',e=>{e.preventDefault();goHome();});
  window.addEventListener('popstate',()=>{const id=new URLSearchParams(location.search).get('world');if(id&&WORLD_BY_ID[id])openWorld(id,{push:false});else goHome(false);});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&speaking)stopSpeech();});
  function refreshLens(){document.querySelectorAll('[data-lens]').forEach(el=>{const on=el.dataset.lens===lens;el.classList.toggle('selected',on);el.setAttribute('aria-pressed',String(on));});if(active&&!active.finished&&active.chapter>0)renderChapter();}
  refreshLens();renderGrid();
  const initial=new URLSearchParams(location.search).get('world');
  if(initial&&WORLD_BY_ID[initial])openWorld(initial,{push:false});
  else {track('home_view');}
  if ('serviceWorker' in navigator && location.protocol === 'https:') {navigator.serviceWorker.register('/elsewhere/sw.js').catch(()=>{});}
})();