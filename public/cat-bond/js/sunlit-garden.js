// Sunlit Garden home-space adapter. Story/NPC state and dialogue remain Chat 4-owned.
(() => {
  'use strict';
  const HOME_ANCHORS = Object.freeze({
    muling:{x:.66,y:.72,scale:1.08,radius:65},
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
    {id:'book',zh:'星铃之书',en:'Resonance Book',action:()=>window.ResonanceBook?.open()},
    {id:'facilities',zh:'家园设施',en:'Facilities',action:()=>window.UI?.openBuild?.()}
  ];
  let game=null,root=null,active=false,lastNpcHits=[],narrativeAdapter=null,visitedState=null,hitState=null,guide=null,guideKey='';
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
    for(const item of HOTSPOTS){
      const b=root.querySelector('[data-garden-action="'+item.id+'"]');if(!b)continue;
      const label=en?item.en:item.zh;
      b.querySelector('.sg-hotspot-icon').innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+ICONS[item.id==='book'?'catdex':item.id]+'</svg>';
      b.querySelector('.sg-hotspot-label').textContent=label;
      b.title=label;b.setAttribute('aria-label',label);
    }
    const map=document.getElementById('fab-map');
    if(map){map.title=en?'Return to the world map':'返回世界地图';map.setAttribute('aria-label',map.title);
      const small=map.querySelector('small');if(small)small.textContent=en?'World':'地图';}
  }
  function refreshGuide(){
    if(!guide)return;
    const v=window.CatBondResonance?.view?.(),scene=v?.current?.id;
    const covered=!!document.querySelector('#panel.open,.res-host,.cbcp-root:not([hidden])');
    const show=active&&game?.scene==='yard'&&state()?.cats?.length>0&&!covered&&(scene==='prologue:P-04'||scene==='prologue:P-05');
    guide.hidden=!show;if(!show){guideKey='';return}
    const en=isEnglish(),talk=v.cursor<v.current.lines.length,departure=scene==='prologue:P-05'&&!talk;
    const key=scene+'|'+talk+'|'+en;if(key===guideKey)return;guideKey=key;
    guide.replaceChildren();
    const title=document.createElement('strong');
    title.textContent=departure?(en?'Ready for the journey':'准备出发'):talk?(en?'Find Muling':'与暮铃交谈'):(en?'The old garden bell':'花园里的旧铃');
    const hint=document.createElement('span');hint.textContent=departure?(en?'Prepare your companions before heading to Misttide Harbor.':'整理伙伴，准备前往霁潮港。'):talk?(en?'Speak with the traveler by the garden path.':'与花园小径旁的旅人交谈。'):(en?'Pull the bell cord to hear its response.':'拉动铃绳，听听它的回应。');
    guide.append(title,hint);
    const row=document.createElement('div');guide.append(row);
    const add=(zh,enText,action)=>{const b=document.createElement('button');b.type='button';b.textContent=en?enText:zh;b.onclick=()=>{if(active&&state()===visitedState)action()};row.append(b)};
    if(talk)add('与暮铃交谈','Talk to Muling',()=>narrativeAdapter?.interactHomeNpc('muling'));
    if(departure){
      hint.textContent=en?'Open Resonance Book to prepare your companions, then head to Misttide Harbor.':'打开星铃之书整理伙伴，再前往霁潮港。';
      add('前往世界地图','World map',()=>game.openWorldMap());
    }
  }
  function ensureRoot(){
    if(root||!document.getElementById('stage'))return root;
    root=document.createElement('nav');root.id='sunlit-garden-hotspots';root.className='sg-hotspots';root.inert=true;
    root.setAttribute('aria-label','Sunlit Garden locations');
    for(const item of HOTSPOTS){
      const b=document.createElement('button');b.type='button';b.className='sg-hotspot sg-hotspot-'+item.id;
      b.dataset.gardenAction=item.id;
      b.innerHTML='<span class="sg-hotspot-icon" aria-hidden="true"></span><span class="sg-hotspot-label"></span>';
      b.addEventListener('click',()=>{if(active&&game?.scene==='yard')item.action?.();});
      root.append(b);
    }
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
    if(!active||visitedState!==slotState){
      lastNpcHits=[];hitState=null;if(visitedState!==slotState)window.GardenProjects?.resetSlot?.();
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
  }
  function leave(){window.GardenProjects?.resetSlot?.();active=false;if(root)root.inert=true;root?.classList.remove('is-active');document.getElementById('stage')?.classList.remove('cb-sunlit-garden');lastNpcHits=[];hitState=null;}
  function registerNarrativeAdapter(adapter){
    if(!adapter||typeof adapter.getHomeNpcs!=='function'||typeof adapter.drawHomeNpc!=='function'||
       typeof adapter.interactHomeNpc!=='function')return false;
    narrativeAdapter=adapter;lastNpcHits=[];hitState=null;return true;
  }
  function draw(ctx,width,height,time){
    if(!active||game?.scene!=='yard')return;
    if(visitedState!==state())enter();
    root?.classList.toggle('is-placing',!!game.yard?.placement);refreshGuide();
    if(root)root.inert=!!game.yard?.placement;
    window.GardenProjects?.draw?.(ctx,width,height,time);
    if(!narrativeAdapter&&window.CatBondResonanceNPC?.gardenAdapter)registerNarrativeAdapter(window.CatBondResonanceNPC.gardenAdapter);
    lastNpcHits=[];hitState=null;if(!narrativeAdapter)return;
    let npcs;try{npcs=narrativeAdapter.getHomeNpcs()||[]}catch(error){console.warn('Garden NPC availability failed',error);return}
    if(!Array.isArray(npcs))return;hitState=state();
    for(const npc of npcs){
      const a=HOME_ANCHORS[npc?.id];if(!a||!npc?.id)continue;
      const x=width*a.x,y=height*a.y;
      // No generic sprite or emoji fallback: Chat 4 must supply approved character art.
      try{const visible=narrativeAdapter.drawHomeNpc(ctx,npc,{x,y,scale:a.scale,time});
        if(visible===false)continue;
        lastNpcHits.push({id:npc.id,x,y:npc.id==='muling'?y-52*a.scale:y,radius:Math.max(24,a.radius*Math.min(1,width/1000))});}
      catch(error){console.warn('Sunlit Garden NPC art unavailable:',npc.id,error);}
    }
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
          const result=narrativeAdapter.interactHomeNpc(h.id);return result!==false&&result?.ok!==false;
        }catch(error){console.warn('Garden NPC interaction failed',error);return false;}
      }
    }
    return !!window.GardenProjects?.tap?.(x,y);
  }
  function getProgress(){
    const p=canonicalProgress();
    return{chapter:p.chapter,completedScenes:p.completed.length,restoredSanctuaries:p.sanctuaries.slice(),
      returnedNpcIds:p.returned.slice(),postgameEvents:p.postgame.slice(),ending:p.ending};
  }
  const api={init,enter,leave,draw,handleTap,getProgress,registerNarrativeAdapter,homeAnchors:HOME_ANCHORS};
  window.SunlitGarden=api;
  window.addEventListener('DOMContentLoaded',()=>init(window.__game),{once:true});
})();
