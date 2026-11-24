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
  const SANCTUARIES = [
    {id:'harbor',color:'#8ebdc2',x:.16},{id:'forest',color:'#9fb77a',x:.29},
    {id:'forge',color:'#d69a62',x:.42},{id:'sky',color:'#9eb9d7',x:.55},
    {id:'library',color:'#b9a1c8',x:.68},{id:'starfall',color:'#d8c18a',x:.81}
  ];
  const HOTSPOTS = [
    {id:'cats',icon:'🐾',zh:'猫咪',en:'Cats',left:'12%',top:'57%',action:()=>window.UI?.openCatHub?.('solo')},
    {id:'facilities',icon:'⌂',zh:'家园设施',en:'Facilities',left:'29%',top:'34%',action:()=>window.UI?.openBuild?.()},
    {id:'catdex',icon:'▤',zh:'Catdex',en:'Catdex',left:'55%',top:'36%',action:()=>window.UI?.openDex?.()},
    {id:'workshop',icon:'⚒',zh:'工坊',en:'Workshop',left:'81%',top:'43%',action:()=>window.UI?.openWorkshop?.()},
    {id:'bond',icon:'∞',zh:'双猫羁绊',en:'Duo Bond',left:'77%',top:'71%',action:()=>window.UI?.openBondPanel?.()}
  ];
  let game=null,root=null,active=false,lastNpcHits=[],narrativeAdapter=null;
  const isEnglish=()=>window.MorrowwishI18n?.get?.()!=='zh';
  const state=()=>window.State?.S||null;
  function canonicalProgress(){
    const s=state()?.resonance;
    if(!s||typeof s!=='object')return{chapter:'prologue',completed:[],sanctuaries:[],returned:[],postgame:[],ending:false};
    const completed=Array.isArray(s.completed)?s.completed:[];
    return{chapter:String(s.scene||'prologue:P-01').split(':')[0]||'prologue',completed,
      sanctuaries:Array.isArray(s.sanctuaries)?s.sanctuaries:[],
      returned:Array.isArray(s.returned)?s.returned:[],postgame:Array.isArray(s.postgame)?s.postgame:[],
      ending:completed.includes('finale:B-04')};
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
    root=document.createElement('nav');root.id='sunlit-garden-hotspots';root.className='sg-hotspots';
    root.setAttribute('aria-label','Sunlit Garden locations');
    for(const item of HOTSPOTS){
      const b=document.createElement('button');b.type='button';b.className='sg-hotspot sg-hotspot-'+item.id;
      b.dataset.gardenAction=item.id;b.style.left=item.left;b.style.top=item.top;
      b.innerHTML='<span class="sg-hotspot-icon" aria-hidden="true"></span><span class="sg-hotspot-label"></span>';
      b.addEventListener('click',()=>{if(active&&game?.scene==='yard')item.action?.();});
      root.append(b);
    }
    document.getElementById('stage').append(root);renderLabels();return root;
  }
  function init(controller){
    game=controller||window.__game||null;ensureRoot();
    window.addEventListener('morrowwish-language-change',renderLabels);
    if(game?.scene==='yard')enter();return api;
  }
  function enter(){
    if(!game||game.scene!=='yard')return;
    ensureRoot();
    if(!active){
      active=true;const s=state();
      if(s){
        if(!s.sunlitGarden||typeof s.sunlitGarden!=='object')s.sunlitGarden={schema:1,visits:0,lastVisitedAt:0};
        s.sunlitGarden.visits=Math.max(0,Number(s.sunlitGarden.visits)||0)+1;
        s.sunlitGarden.lastVisitedAt=Date.now();window.State?.save?.();
      }
    }
    root?.classList.add('is-active');document.getElementById('stage')?.classList.add('cb-sunlit-garden');renderLabels();
  }
  function leave(){active=false;root?.classList.remove('is-active');document.getElementById('stage')?.classList.remove('cb-sunlit-garden');lastNpcHits=[];}
  function registerNarrativeAdapter(adapter){
    if(!adapter||typeof adapter.getHomeNpcs!=='function'||typeof adapter.drawHomeNpc!=='function'||
       typeof adapter.interactHomeNpc!=='function')return false;
    narrativeAdapter=adapter;return true;
  }
  function drawRestoredBed(ctx,x,y,scale,color,t){
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
    ctx.fillStyle='rgba(23,42,34,.28)';ctx.beginPath();ctx.ellipse(0,4,29,9,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#8c8b70';ctx.beginPath();ctx.moveTo(-27,0);ctx.quadraticCurveTo(-18,-13,0,-11);
    ctx.quadraticCurveTo(19,-14,28,0);ctx.quadraticCurveTo(12,10,-16,7);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#d1c3a0';ctx.lineWidth=2;ctx.stroke();
    ctx.strokeStyle='#66825e';ctx.lineWidth=3;ctx.lineCap='round';ctx.beginPath();
    ctx.moveTo(0,-7);ctx.quadraticCurveTo(-3,-25,1,-34);ctx.stroke();
    ctx.fillStyle=color;
    for(let i=0;i<5;i++){const a=i*Math.PI*2/5+t*.08;ctx.beginPath();
      ctx.ellipse(Math.cos(a)*7,-35+Math.sin(a)*7,4.2,8,a,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle='#f4d59a';ctx.beginPath();ctx.arc(0,-35,4,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=.28+.18*Math.sin(t*2);ctx.fillStyle=color;ctx.beginPath();ctx.arc(0,-35,16,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
  function draw(ctx,width,height,time){
    if(!active||game?.scene!=='yard')return;
    const p=canonicalProgress();
    SANCTUARIES.forEach((item,i)=>{if(p.sanctuaries.includes(item.id))
      drawRestoredBed(ctx,width*item.x,height*(i%2===0?.88:.92),Math.max(.58,Math.min(1,width/1200)),item.color,time+i);});
    lastNpcHits=[];if(!narrativeAdapter)return;
    const npcs=narrativeAdapter.getHomeNpcs()||[];
    for(const npc of npcs){
      const a=HOME_ANCHORS[npc?.id];if(!a||!npc?.id)continue;
      const x=width*a.x,y=height*a.y;
      // No generic sprite or emoji fallback: Chat 4 must supply approved character art.
      try{narrativeAdapter.drawHomeNpc(ctx,npc,{x,y,scale:a.scale,time});
        lastNpcHits.push({id:npc.id,x,y,radius:a.radius*Math.min(1,width/1000)});}
      catch(error){console.warn('Sunlit Garden NPC art unavailable:',npc.id,error);}
    }
  }
  function handleTap(x,y){
    if(!active||!narrativeAdapter||game?.scene!=='yard')return false;
    for(let i=lastNpcHits.length-1;i>=0;i--){const h=lastNpcHits[i];
      if(Math.hypot(x-h.x,y-h.y)<=h.radius){narrativeAdapter.interactHomeNpc(h.id);return true;}}
    return false;
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
