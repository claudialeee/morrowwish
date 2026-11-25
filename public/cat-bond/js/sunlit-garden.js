// Sunlit Garden home-space adapter. Story/NPC state and dialogue remain Chat 4-owned.
(() => {
  'use strict';
  const HOME_ANCHORS = Object.freeze({
    muling:{x:.78,y:.70,scale:1.08,radius:58},
    jiedeng:{x:.15,y:.54,scale:.92,radius:46}, qilan:{x:.25,y:.59,scale:.86,radius:44},
    yahe:{x:.34,y:.56,scale:.90,radius:45}, yuchuan:{x:.42,y:.58,scale:.98,radius:48},
    jinpo:{x:.86,y:.50,scale:.98,radius:48}, xiaomao:{x:.91,y:.58,scale:.82,radius:42},
    lingyu:{x:.65,y:.46,scale:.96,radius:46}, yuanfan:{x:.70,y:.57,scale:.84,radius:42},
    moye:{x:.53,y:.46,scale:.98,radius:46}, baikan:{x:.59,y:.55,scale:.82,radius:42},
    xingya:{x:.47,y:.67,scale:.90,radius:45}, lichuan:{x:.37,y:.70,scale:.92,radius:46}
  });
  const HOTSPOTS = [
    {id:'cats',icon:'🐾',zh:'猫咪',en:'Cats',left:'12%',top:'57%',action:()=>window.UI?.openCatHub?.('solo')},
    {id:'facilities',icon:'⌂',zh:'家园设施',en:'Facilities',left:'29%',top:'34%',action:()=>window.UI?.openBuild?.()},
    {id:'catdex',icon:'▤',zh:'Catdex',en:'Catdex',left:'55%',top:'36%',action:()=>window.UI?.openDex?.()},
    {id:'workshop',icon:'⚒',zh:'工坊',en:'Workshop',left:'81%',top:'43%',action:()=>window.UI?.openWorkshop?.()},
    {id:'bond',icon:'∞',zh:'双猫羁绊',en:'Duo Bond',left:'77%',top:'71%',action:()=>window.UI?.openBondPanel?.()}
  ];
  let game=null,root=null,active=false,lastNpcHits=[],narrativeAdapter=null,visitedState=null,hitState=null;
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
      b.querySelector('.sg-hotspot-icon').textContent=item.icon;
      b.querySelector('.sg-hotspot-label').textContent=label;
      b.title=label;b.setAttribute('aria-label',label);
    }
    const map=document.getElementById('fab-map');
    if(map){map.title=en?'Return to the world map':'返回世界地图';map.setAttribute('aria-label',map.title);
      const small=map.querySelector('small');if(small)small.textContent=en?'World':'地图';}
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
    document.getElementById('stage').append(root);renderLabels();return root;
  }
  function init(controller){
    game=controller||window.__game||null;ensureRoot();
    window.addEventListener('morrowwish-language-change',renderLabels);
    return api;
  }
  function enter(){
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
    root?.classList.add('is-active');document.getElementById('stage')?.classList.add('cb-sunlit-garden');renderLabels();
  }
  function leave(){window.GardenProjects?.cancel?.();active=false;if(root)root.inert=true;root?.classList.remove('is-active');document.getElementById('stage')?.classList.remove('cb-sunlit-garden');lastNpcHits=[];hitState=null;}
  function registerNarrativeAdapter(adapter){
    if(!adapter||typeof adapter.getHomeNpcs!=='function'||typeof adapter.drawHomeNpc!=='function'||
       typeof adapter.interactHomeNpc!=='function')return false;
    narrativeAdapter=adapter;lastNpcHits=[];hitState=null;return true;
  }
  function draw(ctx,width,height,time){
    if(!active||game?.scene!=='yard')return;
    if(visitedState!==state())enter();
    root?.classList.toggle('is-placing',!!game.yard?.placement);
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
        lastNpcHits.push({id:npc.id,x,y,radius:Math.max(24,a.radius*Math.min(1,width/1000))});}
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
