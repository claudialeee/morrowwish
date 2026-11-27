// Sunlit Garden home-space adapter. Story/NPC state and dialogue remain Chat 4-owned.
(() => {
  'use strict';
  const HOME_ANCHORS = Object.freeze({
    muling:{x:.60,y:.70,scale:1.30,radius:72},
    jiedeng:{x:.15,y:.54,scale:.92,radius:46}, qilan:{x:.25,y:.59,scale:.86,radius:44},
    yahe:{x:.34,y:.56,scale:.90,radius:45}, yuchuan:{x:.42,y:.58,scale:.98,radius:48},
    jinpo:{x:.86,y:.50,scale:.98,radius:48}, xiaomao:{x:.91,y:.58,scale:.82,radius:42},
    lingyu:{x:.65,y:.46,scale:.96,radius:46}, yuanfan:{x:.70,y:.57,scale:.84,radius:42},
    moye:{x:.53,y:.46,scale:.98,radius:46}, baikan:{x:.59,y:.55,scale:.82,radius:42},
    xingya:{x:.47,y:.67,scale:.90,radius:45}, lichuan:{x:.37,y:.70,scale:.92,radius:46}
  });
  // Original, consistent line icons. They are UI symbols, not scene art.
  const ICONS=Object.freeze({
    cats:'<path d="M5 11 4 4l5 3a10 10 0 0 1 6 0l5-3-1 7c2 7-3 10-7 10s-9-3-7-10Z"/><path d="M8 13h.1m7.9 0h.1M10 16l2 1 2-1m-8-1-4-1m16 1 4-1"/>',
    facilities:'<path d="m3 11 9-8 9 8M6 10v10h12V10M10 20v-6h4v6"/><path d="M2 21h20"/>',
    catdex:'<path d="M12 6C8 3 5 4 3 5v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-2-1-5-2-9 1Zm0 0v14M6 9h3m-3 3h3m6-3h3m-3 3h3"/>',
    workshop:'<path d="m4 19 9-9m-4-4 3-3 5 5-3 3M5 4l3 3-1 3-3 1-2-2m12 6 5 5 2-2-5-5"/><path d="m3 18 3 3"/>',
    bond:'<path d="M12 9c-2-4-8-4-9 1s5 9 9 4l4-5c2-3 6-2 6 2s-5 6-8 2"/><path d="m8 4 1 2m6-2-1 2"/>'
  });
  const HOTSPOTS = [
    {id:'facilities',zh:'家园布置',en:'Garden design',action:()=>window.UI?.openBuild?.()}
  ];
  let game=null,root=null,active=false,lastNpcHits=[],narrativeAdapter=null,visitedState=null,hitState=null,guide=null,guideKey='';
  const talkMarkers=new Map();
  let guestPage=0,guestRosterKey='';
  const GUESTS_PER_PAGE=4;
  function gardenGuests(v){const ids=[...new Set(v?.returned||[])].filter(id=>id!=='muling');return ids.reverse();}
  function syncGuestPage(v){const ids=gardenGuests(v),key=ids.join('|');if(key!==guestRosterKey){guestRosterKey=key;guestPage=0;}const pages=Math.max(1,Math.ceil(ids.length/GUESTS_PER_PAGE));guestPage=Math.min(guestPage,pages-1);return {ids,pages};}
  const isEnglish=()=>window.MorrowwishI18n?.get?.()!=='zh';
  const state=()=>window.State?.S||null;
  function canonicalProgress(){
    const s=state()?.resonance;
    if(!s||typeof s!=='object')return{chapter:'prologue',completed:[],sanctuaries:[],returned:[],postgame:[],ending:false};
    const completed=Array.isArray(s.completed)?s.completed:[];
    return{chapter:String(s.scene||'prologue:P-01').split(':')[0]||'prologue',completed,
      sanctuaries:Array.isArray(s.sanctuaries)?s.sanctuaries:[],
      returned:Array.isArray(s.returned)?s.returned:[],postgame:Array.isArray(s.postgame)?s.postgame:[],
      ending:completed.includes('epilogue:E-03')};
  }
  function renderLabels(){
    if(!root)return;
    const en=isEnglish();
    root.setAttribute('aria-label',en?'Sunlit Garden locations':'阳光花园地点');
    for(const item of HOTSPOTS){
      const b=root.querySelector('[data-garden-action="'+item.id+'"]');if(!b)continue;
      const label=en?item.en:item.zh;
      b.querySelector('.sg-hotspot-icon').innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+ICONS[item.id]+'</svg>';
      b.querySelector('.sg-hotspot-label').textContent=label;
      b.title=label;b.setAttribute('aria-label',label);
    }
    const book=document.getElementById('sg-book-entry');if(book){book.textContent=en?'Resonance Book':'星月之书';book.title=book.textContent;book.setAttribute('aria-label',book.textContent);}
    const map=document.getElementById('fab-map');
    if(map){map.title=en?'Return to the world map':'返回世界地图';map.setAttribute('aria-label',map.title);
      const small=map.querySelector('small');if(small)small.textContent=en?'World':'地图';}
  }
  const guideTabs=[['cats','猫咪','Cats'],['party','队伍','Party'],['workshop','工坊','Workshop'],['dex','图鉴','Catdex']];
  function noteBookVisit(tab){
    const s=state(),scene=window.CatBondResonance?.view?.()?.current?.id;
    if(!active||game?.scene!=='yard'||s!==visitedState||!['prologue:P-04','prologue:P-05'].includes(scene)||!guideTabs.some(t=>t[0]===tab))return;
    const previous=s.sunlitGarden,seen=Array.isArray(previous?.bookGuide)?previous.bookGuide:[];
    if(seen.includes(tab))return;
    s.sunlitGarden={...(previous||{schema:1}),bookGuide:[...seen,tab]};
    let saved=false;try{saved=window.State.save()?.ok===true}catch{}
    if(!saved){if(previous===undefined)delete s.sunlitGarden;else s.sunlitGarden=previous;}
  }
  function refreshGuide(){
    if(!guide)return;
    const v=window.CatBondResonance?.view?.(),scene=v?.current?.id;
    const covered=!!document.querySelector('#panel.open,.res-host,.cbcp-root:not([hidden]),#cb-player-first-intro');
    const show=active&&game?.scene==='yard'&&state()?.cats?.length>0&&!covered&&(scene==='prologue:P-04'||scene==='prologue:P-05'||scene==='epilogue:E-02'||scene==='epilogue:E-03'||v?.ending);
    guide.hidden=!show;if(!show){guideKey='';return}
    const en=isEnglish(),ending=!!v.ending,epilogue=['epilogue:E-02','epilogue:E-03'].includes(scene),talk=!ending&&(epilogue||v.cursor<v.current.lines.length),departure=scene==='prologue:P-05'&&!talk;
    const seen=state()?.sunlitGarden?.bookGuide||[],next=guideTabs.find(t=>!seen.includes(t[0])),guests=ending?syncGuestPage(v):{ids:[],pages:1};
    const echo=scene==='prologue:P-05'&&!!state()?.sunlitGarden?.exploration?.chartEcho;const key=scene+'|'+talk+'|'+en+'|'+v.openingMet+'|'+echo+'|'+seen.join(',')+'|'+(ending?guestRosterKey+'|'+guestPage+'|'+v.postgame.length:'');if(key===guideKey)return;guideKey=key;
    guide.replaceChildren();guide.classList.remove('sg-minimal-opening');guide.classList.toggle('sg-postgame-guide',ending);
    const title=document.createElement('strong');
    title.textContent=ending?(en?'The world answers again':'六地再次回应'):epilogue?(scene==='epilogue:E-02'?(en?'A promise to repair':'承担责任'):(en?'The second garden key':'第二把花园钥匙')):departure?(en?'Ready for the journey':'准备出发'):talk?(en?'Find Muling':'与暮铃交谈'):(en?'The old garden bell':'花园里的旧铃');
    const hint=document.createElement('span');hint.textContent=ending?(en?guests.ids.length+' visiting friends':'来访伙伴 '+guests.ids.length+' 位'):epilogue?(en?'Speak with Muling and finish the story in Sunlit Garden.':'与暮铃交谈，在阳光花园完成故事。'):departure?(en?'Prepare your companions before heading to Windchime Town.':'整理伙伴，准备前往风铃镇。'):talk?(en?'Open Resonance Book to explore your cats, party, workshop and Catdex, then speak to Muling.':'可打开星月之书查看猫咪、队伍、工坊和 Catdex，再与暮铃交谈。'):(en?'Pull the bell cord to hear its response.':'拉动铃绳，听听它的回应。');
    guide.append(title,hint);
    const row=document.createElement('div');guide.append(row);
    const add=(zh,enText,action)=>{const b=document.createElement('button');b.type='button';b.textContent=en?enText:zh;b.onclick=()=>{if(active&&state()===visitedState)action()};row.append(b)};
    if(talk){add('与暮铃交谈','Talk to Muling',()=>approachHomeNpc('muling'));row.lastElementChild.classList.add('sg-main-continue');}
    if(!epilogue&&!ending&&next&&talk&&!departure){
      hint.textContent=en?'Talk to Muling to continue the story. Optional: explore '+next[2]+'.':'与暮铃交谈推进主线。也可以查看'+next[1]+'（可选）。';
      add('查看'+next[1],'Explore '+next[2],()=>window.ResonanceBook?.open(next[0]));
    }
    if(ending){add('花园复兴','Garden Restoration',()=>window.GardenProjects?.open?.());add('继续探索','Continue exploring',()=>game.openWorldMap());if(guests.pages>1){add('下一批访客 '+(guestPage+1)+'/'+guests.pages,'Next visitors '+(guestPage+1)+'/'+guests.pages,()=>{guestPage=(guestPage+1)%guests.pages;guideKey='';refreshGuide()});row.lastElementChild.dataset.guestPage=String(guestPage);}}
    if(departure){
      title.textContent=en?'Find your name':'寻找自己的名字';hint.textContent=en?'Look for clues in the garden, or follow the trail to Windchime Town.':'在花园找找线索，或去风铃镇打听。';
      guide.classList.add('sg-minimal-opening');
      add('下一场景 · 风铃镇','Next scene · Windchime Town',()=>{game.openWorldMap();if(game.scene==='map')window.WorldMap?.enterRegion?.('harbor')});
      row.firstElementChild.classList.add('sg-main-continue');
      if(echo){title.textContent=en?'The bell answered you':'古铃回应了你';hint.textContent=en?'The rope never moved. Yet the old bell answered the two notes you hummed. Why? Follow the clue to Windchime Town.':'铃绳没有动，古铃却回应了你哼出的两声。为什么？去风铃镇追寻这条线索。';}


    }
  }
  function approachHomeNpc(id){
    if(!active||game?.scene!=='yard'||game.worldDialogueOpen?.())return false;
    const hit=lastNpcHits.find(n=>n.id===id);
    const talk=()=>{if(active&&state()===visitedState&&narrativeAdapter?.getHomeNpcs?.().some(n=>n.id===id))narrativeAdapter.interactHomeNpc(id);};
    if(hit&&game.yardExploreEnabled?.()&&!game.yardNear?.(hit.x,hit.groundY,.12)&&!window.CatBondResonance?.view?.()?.ending)return game.yardWalkTo?.(hit.x,hit.groundY,talk)||false;
    talk();return true;
  }
  function getTalkMarker(npc){
    if(talkMarkers.has(npc.id))return talkMarkers.get(npc.id);
    const b=document.createElement('button');b.type='button';b.className='sg-npc-talk-marker';b.dataset.npcTalk=npc.id;b.hidden=true;
    b.innerHTML='<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h16v12H9l-5 4z"/><path d="M8 10h.1m4 0h.1m4 0h.1" stroke-width="2.5" stroke-linecap="round"/></svg><span></span>';
    b.onclick=()=>approachHomeNpc(npc.id);
    root.append(b);talkMarkers.set(npc.id,b);return b;
  }
  function hideTalkMarkers(){for(const b of talkMarkers.values())b.hidden=true;}
  function syncTalkMarker(ctx,width,height,npc,x,y,scale,avoid,cell=null){
    const covered=!!document.querySelector('#panel.open,.res-host,.cbcp-root:not([hidden]),#cb-player-first-intro,#cb-system-menu:not([hidden])');
    if(covered||game?.yard?.placement)return;
    const canvasRect=(game.yardViewportRect?.()||ctx.canvas.getBoundingClientRect()),r=root.getBoundingClientRect();
    if(!width||!height||!r.width||!r.height)return;
    const b=getTalkMarker(npc),en=isEnglish(),raw=npc.name,profileName=typeof raw==='string'?raw:raw?.[en?'en':'zh'];
    const label=npc.id==='muling'&&window.CatBondResonance?.view?.().current?.id==='prologue:P-05'?(en?'Stranger':'陌生猫'):(profileName||npc.id);
    b.querySelector('span').textContent=label;b.setAttribute('aria-label',en?'Talk to '+label:'与'+label+'对话');b.classList.toggle('sg-guest-marker',!!cell);const v=window.CatBondResonance?.view?.();const main=npc.id==='muling'&&!v?.ending&&!!v?.current&&(v.current.chapter==='prologue'||v.current.chapter==='epilogue')&&v.cursor<v.current.lines.length;b.dataset.questPrimary=String(main);if(!main&&!v?.ending&&npc.id!=='muling'&&!game.yardNear?.(x,y,.25)){b.hidden=true;return;}b.hidden=false;
    if(cell){b.style.left=cell.x+'px';b.style.top=cell.box.bottom+'px';return;}
    const px=canvasRect.left-r.left+x/width*canvasRect.width,py=canvasRect.top-r.top+(y-112*scale)/height*canvasRect.height;
    const bw=Math.max(44,b.offsetWidth||72),bh=Math.max(44,b.offsetHeight||44);
    const p=window.GardenExploration?.placeMarker?.(px,py-bh/2,bw,bh,r.width,r.height,avoid)||{x:Math.max(bw/2,Math.min(r.width-bw/2,px)),y:Math.max(bh/2,py-bh/2)};
    b.style.left=p.x+'px';b.style.top=(p.y+bh/2)+'px';avoid.push(p.box||{left:p.x-bw/2,top:p.y-bh/2,right:p.x+bw/2,bottom:p.y+bh/2});
  }
  function ensureRoot(){
    if(root||!document.getElementById('stage'))return root;
    root=document.createElement('nav');root.id='sunlit-garden-hotspots';root.className='sg-hotspots';root.inert=true;
    root.setAttribute('aria-label',isEnglish()?'Sunlit Garden locations':'阳光花园地点');
    for(const item of HOTSPOTS){
      const b=document.createElement('button');b.type='button';b.className='sg-hotspot sg-hotspot-'+item.id;
      b.dataset.gardenAction=item.id;
      b.innerHTML='<span class="sg-hotspot-icon" aria-hidden="true"></span><span class="sg-hotspot-label"></span>';
      b.addEventListener('click',()=>{if(active&&game?.scene==='yard')item.action?.();});
      root.append(b);
    }
    const actions=document.getElementById('yard-actions');if(actions&&!document.getElementById('sg-book-entry')){const book=document.createElement('button');book.id='sg-book-entry';book.type='button';book.className='fab sg-book-entry';book.onclick=()=>{if(active&&game?.scene==='yard')window.ResonanceBook?.open()};actions.prepend(book);}
    guide=document.createElement('section');guide.className='sg-prologue-guide';guide.hidden=true;root.append(guide);document.getElementById('stage').append(root);renderLabels();return root;
  }
  function init(controller){
    game=controller||window.__game||null;ensureRoot();
    window.addEventListener('morrowwish-language-change',()=>{renderLabels();refreshGuide()});
    return api;
  }
  function enter(){
    game ||= window.__game;
    if(!game||game.scene!=='yard')return;
    ensureRoot();
    const slotState=state();
    const arriving=!active||visitedState!==slotState;
    if(arriving){
      lastNpcHits=[];hitState=null;guestPage=0;guestRosterKey='';if(visitedState!==slotState)window.GardenProjects?.resetSlot?.();
      active=true;visitedState=slotState;const s=slotState;
      if(s){
        const previous=s.sunlitGarden;
        s.sunlitGarden={...(previous&&typeof previous==='object'&&!Array.isArray(previous)?previous:{}),schema:1,visits:Math.max(0,Number(previous?.visits)||0)+1,lastVisitedAt:Date.now()};
        let saved=false;try{saved=window.State?.save?.()?.ok===true}catch(error){console.warn('Garden visit save failed',error)}
        if(!saved){if(previous===undefined)delete s.sunlitGarden;else s.sunlitGarden=previous;}
      }
    }
    if(root)root.inert=false;
    root?.classList.add('is-active');document.getElementById('stage')?.classList.add('cb-sunlit-garden');renderLabels();refreshGuide();
    if(arriving)window.dispatchEvent(new Event('cat-bond-garden-entered'));
  }
  function leave(){window.GardenProjects?.resetSlot?.();active=false;if(root)root.inert=true;root?.classList.remove('is-active');document.getElementById('stage')?.classList.remove('cb-sunlit-garden');lastNpcHits=[];hitState=null;hideTalkMarkers();window.GardenExploration?.reset?.();}
  function registerNarrativeAdapter(adapter){
    if(!adapter||typeof adapter.getHomeNpcs!=='function'||typeof adapter.drawHomeNpc!=='function'||
       typeof adapter.interactHomeNpc!=='function')return false;
    narrativeAdapter=adapter;lastNpcHits=[];hitState=null;return true;
  }
  function draw(ctx,width,height,time,{projects=true,residents=true}={}){
    if(!active||game?.scene!=='yard')return;
    if(visitedState!==state())enter();
    root?.classList.toggle('is-placing',!!game.yard?.placement);refreshGuide();
    if(root)root.inert=!!game.yard?.placement;
    if(projects)window.GardenProjects?.draw?.(ctx,width,height,time);
    if(!residents)return;
    hideTalkMarkers();
    if(!narrativeAdapter&&window.CatBondResonanceNPC?.gardenAdapter)registerNarrativeAdapter(window.CatBondResonanceNPC.gardenAdapter);
    lastNpcHits=[];hitState=null;if(!narrativeAdapter)return;
    let npcs;try{npcs=narrativeAdapter.getHomeNpcs()||[]}catch(error){console.warn('Garden NPC availability failed',error);return}
    if(!Array.isArray(npcs))return;hitState=state();
    const v=window.CatBondResonance?.view?.(),ending=!!v?.ending;
    if(ending){const {ids}=syncGuestPage(v),shown=new Set(ids.slice(guestPage*GUESTS_PER_PAGE,(guestPage+1)*GUESTS_PER_PAGE));npcs=npcs.filter(n=>n.id==='muling'||shown.has(n.id));npcs.sort((a,b)=>Number(b.id==='muling')-Number(a.id==='muling'));}
    const talkPositions=[],npcRects=[],r=root.getBoundingClientRect(),canvasRect=(game.yardViewportRect?.()||ctx.canvas.getBoundingClientRect());
    const occupied=[];
    if(ending){for(const el of [guide,...document.querySelectorAll('#map-menu,#cb-system-toggle,.sg-hotspot,#tabbar')]){if(!el||el.hidden||!el.getClientRects().length||getComputedStyle(el).visibility==='hidden')continue;const b=el.getBoundingClientRect();if(b.width&&b.height)occupied.push({left:b.left-r.left,top:b.top-r.top,right:b.right-r.left,bottom:b.bottom-r.top});}}
    const toRect=(x,y,scale)=>{const cx=canvasRect.left-r.left+x/width*canvasRect.width,cy=canvasRect.top-r.top+y/height*canvasRect.height,sx=canvasRect.width/width,sy=canvasRect.height/height;return {left:cx-40*scale*sx,right:cx+40*scale*sx,top:cy-98*scale*sy,bottom:cy+5*scale*sy};};
    for(const npc of npcs){
      const a=HOME_ANCHORS[npc?.id];if(!a||!npc?.id)continue;
      const f=window.World?.gardenArtworkRect?.(width,height)||{x:0,y:0,width,height};
      let x=Math.max(42,Math.min(width-42,f.x+f.width*a.x)),y=Math.max(90,Math.min(height-28,f.y+f.height*a.y));const shared=npc.id==='muling'?window.GardenExploration?.companionPose?.(x,y):null;if(shared){x=Math.max(42,Math.min(width-42,shared.x));y=Math.max(90,Math.min(height-28,shared.y));if(shared.touching)y-=3*Math.sin(time*8);}
      // No generic sprite or emoji fallback: Chat 4 must supply approved character art.
      try{let scale=a.scale*(npc.id==='muling'?.95:.68)*Math.max(.72,Math.min(1.1,height/460)),cell=null;
        if(ending&&!shared&&r.width&&r.height&&canvasRect.width&&canvasRect.height){const sx=canvasRect.width/width,sy=canvasRect.height/height;const bodyHeight=Math.max(45,Math.min(80,r.height*.15));scale=Math.min(scale,bodyHeight/(108*sy),92/(118*sx));const bx=canvasRect.left-r.left+x*sx,by=canvasRect.top-r.top+y*sy;
          cell=window.GardenExploration?.placeMarker?.(bx,by-bodyHeight/2+22,Math.min(118,r.width-8),bodyHeight+48,r.width,r.height,occupied);
          if(cell){occupied.push(cell.box);x=(cell.x+r.left-canvasRect.left)/sx;y=(cell.box.top+bodyHeight+r.top-canvasRect.top)/sy;}}
        const visible=narrativeAdapter.drawHomeNpc(ctx,npc,{x,y,scale,time});
        if(visible===false)continue;
        npcRects.push(toRect(x,y,scale));if(!shared)talkPositions.push({npc,x,y,scale,cell});
        if(npc.id==='muling'&&!ending){ctx.save();ctx.font='600 12px Cat Bond Nunito, Cat Bond WenKai GB, Yuanti SC, PingFang SC, Microsoft YaHei, Noto Sans CJK SC, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';const stranger=window.CatBondResonance?.view?.().current?.id==='prologue:P-05';const label=window.MorrowwishI18n?.get?.()==='zh'?(stranger?'陌生猫':'暮铃'):(stranger?'Stranger':'Muling');const w=ctx.measureText(label).width+16;ctx.fillStyle='#fff2d9e8';ctx.beginPath();ctx.roundRect(x-w/2,y+5,w,21,10);ctx.fill();ctx.fillStyle='#594431';ctx.fillText(label,x,y+15.5);ctx.restore();}
        if(!shared)lastNpcHits.push({id:npc.id,x,y:npc.id==='muling'?y-52*scale:y-30*scale,groundY:y,radius:Math.max(24,a.radius*.75*Math.min(1,width/1000))});}
      catch(error){console.warn('Sunlit Garden NPC art unavailable:',npc.id,error);}
    }
    const avoid=[...npcRects];const guideRect=guide&&!guide.hidden?guide.getBoundingClientRect():null;if(guideRect)avoid.push({left:guideRect.left-r.left,top:guideRect.top-r.top,right:guideRect.right-r.left,bottom:guideRect.bottom-r.top});
    for(const {npc,x,y,scale,cell} of talkPositions)syncTalkMarker(ctx,width,height,npc,x,y,scale,avoid,cell);
    if(ending){const meta=JSON.stringify({page:guestPage,visible:talkPositions.map(({npc,cell})=>({id:npc.id,box:cell?.box||null})),total:gardenGuests(v).length+1});if(root.dataset.guestLayout!==meta)root.dataset.guestLayout=meta;}else delete root.dataset.guestLayout;
    window.GardenExploration?.draw?.(root,ctx,width,height,npcRects);
  }
  function handleTap(x,y){
    if(!active||game?.scene!=='yard')return false;
    if(visitedState!==state()){enter();return false;}
    if(game.yard?.placement)return false;
    const hidden=game.yard?.hide;
    if(hidden&&!hidden.found&&Math.hypot(x-hidden.spot.x,y-hidden.spot.y)<58)return false;
    if(hitState===state()&&narrativeAdapter){
      for(let i=lastNpcHits.length-1;i>=0;i--){const h=lastNpcHits[i];
        if(Math.hypot(x-h.x,y-h.y)>h.radius)continue;
        try{const current=narrativeAdapter.getHomeNpcs();if(!Array.isArray(current)||!current.some(n=>n?.id===h.id))continue;
          return approachHomeNpc(h.id);
        }catch(error){console.warn('Garden NPC interaction failed',error);return false;}
      }
    }
    return !!window.GardenProjects?.tap?.(x,y);
  }
  function placementBlocked(x,y){
    if(!active||game?.scene!=='yard'||visitedState!==state())return false;
    if(window.GardenProjects?.placementBlocked?.(x,y))return true;
    return hitState===state()&&lastNpcHits.some(n=>Math.hypot(n.x-x,(n.groundY-y)*1.6)<Math.max(26,n.radius*.65));
  }
  function getProgress(){
    const p=canonicalProgress();
    return{chapter:p.chapter,completedScenes:p.completed.length,restoredSanctuaries:p.sanctuaries.slice(),
      returnedNpcIds:p.returned.slice(),postgameEvents:p.postgame.slice(),ending:p.ending};
  }
  const api={init,enter,leave,draw,handleTap,getProgress,noteBookVisit,placementBlocked,registerNarrativeAdapter,homeAnchors:HOME_ANCHORS};
  window.SunlitGarden=api;
  window.addEventListener('DOMContentLoaded',()=>init(window.__game),{once:true});
})();
