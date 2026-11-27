// Developer-only sandbox: replay canonical engine to the selected chapter, never modify a public save.
import {campaign} from './campaign.mjs';
import {makeEngine} from './engine.mjs';
import {storyPartyPatch} from './story-party.mjs';
if(window.__STARBELL_DEVELOPER__){
 const areas=[['garden','阳光花园','Sunlit Garden','prologue:P-05'],['harbor','风铃镇','Windchime Town','harbor:H-01'],['forest','眠根林','Rootsleep Forest','forest:R-01'],['forge','千灯城','Lantern City','forge:E-01'],['sky','云海','Skyspine','sky:S-01'],['library','月镜书库','Moonmirror Library','library:M-01'],['starfall','星坠原','Starfall','starfall:F-01'],['finale','终章','Finale','finale:B-01']];
 const params=new URLSearchParams(location.search);
 const selected=()=>areas.find(a=>a[0]===params.get('region'))||areas[1];
 function checkpoint(target){
  const e=makeEngine(campaign),initial=e.snapshot(),ok=x=>{if(!x?.ok)throw Error(x?.reason||'Developer checkpoint failed')};
  const late=new Set(['mechanism:muling-unlock','npc:public-accountability','npc:second-garden-key']);
  for(const scene of campaign.scenes){
   if(scene.id===target)break;
   if(scene.id==='prologue:P-05'&&!e.view().openingMet)ok(e.meetTraveler());
   if(scene.choiceTiming==='beforeAction'&&scene.choices.length)ok(e.choose(scene.choices[0].id));
   if(scene.id==='finale:B-03')for(let j=0;j<campaign.regions.length;j++)ok(e.supportAction(campaign.regions[j],campaign.support[j]));
   for(const op of scene.requires.filter(op=>!late.has(op)))ok(e.record(scene.id,op));
   while(e.view().cursor<scene.lines.length){if(scene.choiceAt===e.view().cursor&&!e.view().choice)ok(e.choose(scene.choices[0].id));ok(e.nextLine());}
   if(scene.choiceTiming!=='beforeAction'&&scene.choices.length&&!e.view().choice)ok(e.choose(scene.choices[0].id));
   for(const op of scene.requires.filter(op=>late.has(op)))ok(e.record(scene.id,op));ok(e.finish());
  }
  if(e.view().current?.id!==target)throw Error('Unknown developer scene '+target);
  return {initial,story:e.snapshot()};
 }
 function prepare(){
  const a=selected(),root=State.S,{initial,story}=checkpoint(a[3]);const hero=State.makeCat('jinjc',{affinity:35,protagonist:true});
  root.cats=[hero];root.dex={jinjc:1};root.resonance=story;
  const party=storyPartyPatch(root,initial,story,State.makeCat.bind(State),cat=>window.Raising?.decorateNewCat?.(cat,{shinyOdds:0}));if(party)Object.assign(root,party.fields);
  root.coins=1000;root.fish=100;root.tutorialDone=true;root.resonanceExploration={location:a[0]==='finale'?'starfall':a[0],positions:{},interactions:{},pickups:{},cargo:null};root.developerCheckpoint=a[3];if(!State.save()?.ok)throw Error('Developer save failed');
 }
 function launch(game){
  const a=selected();
  if(!State.S.cats?.length||State.S.developerCheckpoint!==a[3]||params.has('reset'))prepare();
  game.rebuildYard();game.refreshHUD();window.CatBondOpeningCover?.hide();
  if(a[0]==='garden'){game.scene='yard';game.showYardChrome();window.dispatchEvent(new Event('cat-bond-garden-entered'));}
  else{game.openWorldMap();window.WorldMap?.enterRegion?.(a[0]==='finale'?'starfall':a[0]);}
  const panel=document.createElement('details');panel.id='starbell-developer-menu';panel.style.cssText='position:fixed;top:58px;left:10px;z-index:10000;max-width:min(240px,75vw);background:#fff1d2;color:#654923;border:1px solid #aa844c;border-radius:10px;padding:8px;font:700 14px system-ui;';
  const summary=document.createElement('summary');summary.style.cssText='cursor:pointer;min-height:30px';panel.append(summary);
  const select=document.createElement('select');select.style.cssText='display:block;width:100%;min-height:44px;margin:6px 0;background:#fffaf0;color:#654923';panel.append(select);
  const reset=document.createElement('button');reset.style.cssText='min-height:44px;width:100%;background:#ecd4a5;color:#654923;border:1px solid #aa844c;border-radius:6px';panel.append(reset);
  function locale(){const zh=window.MorrowwishI18n?.get?.()==='zh';summary.textContent=zh?'开发者 · 地图跳转':'Developer · Map jump';select.replaceChildren(...areas.map(a=>{const o=document.createElement('option');o.value=a[0];o.textContent=a[zh?1:2];return o}));select.value=selected()[0];reset.textContent=zh?'重置当前章节':'Reset this chapter';}
  function jump(region){const url=new URL(location.href);url.searchParams.set('region',region);url.searchParams.set('reset','1');location.assign(url.href);}
  select.onchange=()=>jump(select.value);reset.onclick=()=>jump(select.value);locale();window.addEventListener('morrowwish-language-change',locale);document.body.append(panel);
  if(params.has('reset')){const url=new URL(location.href);url.searchParams.delete('reset');history.replaceState(null,'',url);}
 }
 window.StarbellDeveloper=Object.freeze({prepare,launch});
}
