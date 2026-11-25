// Production adapter to the single Chat 4 engine. No storage, no independent campaign, no legacy fallback.
// The host passes its active engine, campaign, current slot identity and persistence callback.
// Only independently accepted raster assets can be selected; missing art must never unlock narrative evidence.
const bad=reason=>({ok:false,reason});
const isBilingual=x=>typeof x?.zh==='string'&&x.zh.trim()&&typeof x?.en==='string'&&x.en.trim();
const raster=/^assets\/cinematics\/[a-z0-9/_-]+\.(?:webp|png|avif|jpe?g)$/;
export function buildCanonicalScene({view,campaign,manifest}) {
  const scene=view?.current;
  if(!scene||campaign?.canon!=='The Last Resonance')return bad('no-canon-scene');
  if(!campaign.scenes.some(x=>x.id===scene.id))return bad('noncanonical-scene');
  if(scene.choices.length&&scene.choiceTiming==='beforeAction'&&!view.choice)return bad('choice-pending');
  if(scene.lines.length&&!view.lineReady&&view.cursor<scene.lines.length)return bad('dialogue-awaits-gameplay');
  const shots=manifest?.approvedShots?.[scene.id];
  if(!Array.isArray(shots)||shots.length<2)return bad('approved-shot-sequence-missing');
  const assets=new Map((manifest.assets||[]).map(a=>[a.id,a]));
  const unique=new Set(),covered=[],frames=[];
  for(const [i,shot] of shots.entries()){
    const asset=assets.get(shot.assetId);
    if(!asset||asset.status!=='approved'||asset.runtimeAllowed!==true||asset.sceneKey!==scene.id||!raster.test(asset.path)||!asset.visualReview?.evidence||asset.visualReview.result!=='PASS')return bad('unapproved-shot');
    if(unique.has(asset.path))return bad('repeated-shot-art');unique.add(asset.path);
    if(!isBilingual(shot.alt)||!Number.isFinite(shot.durationMs)||shot.durationMs<1200||shot.durationMs>20000||!Array.isArray(shot.lines))return bad('invalid-shot');
    const base={id:scene.id+'-shot-'+i,image:asset.path,alt:shot.alt,durationMs:shot.durationMs,camera:shot.camera,focus:shot.focus,transitionMs:shot.transitionMs||520};
    if(!shot.lines.length)frames.push(base);
    for(const index of shot.lines){
      if(!Number.isInteger(index)||!scene.lines[index])return bad('invalid-canon-line-index');
      covered.push(index);
      if(index<view.cursor)continue;
      const line=scene.lines[index],actor=campaign.cast[line.speaker];
      if(!isBilingual(line.text)||!isBilingual(actor?.name))return bad('missing-canon-localization');
      frames.push({...base,id:base.id+'-line-'+index,durationMs:Math.max(2200,Math.min(12000,900+line.text.en.length*65)),subtitle:{zh:{speaker:actor.name.zh,text:line.text.zh},en:{speaker:actor.name.en,text:line.text.en}}});
    }
  }
  if(covered.length!==scene.lines.length||covered.some((v,i)=>v!==i))return bad('incomplete-or-reordered-dialogue');
  if(!frames.length)return bad('nothing-to-play');
  return {ok:true,scene:{id:scene.id,sourceSceneId:scene.id.split(':')[1],title:scene.title,chapter:{zh:'猫猫纽带',en:'Cat Bond'},mode:'auto',allowSkip:true,frames}};
}

export async function decodeCinematicImages(scene){
  const urls=[...new Set(scene.frames.flatMap(f=>[f.image,...(f.layers||[]).map(l=>l.image)]))];
  // Sequential bounded decoding prevents a chapter from allocating all image memory at once.
  for(const url of urls){
    const image=new Image();image.src=url;await image.decode();
    if(!image.naturalWidth||!image.naturalHeight)throw Error('Empty cinematic image: '+url);
  }
}

export function mountResonanceCinematics({root,rendererFactory,engine,campaign,manifest,getSlotKey,onPersist,onResolved,onError,language,onLanguageChange,preload=decodeCinematicImages}){
  if(!root||typeof rendererFactory!=='function'||!engine?.view||!engine?.snapshot||typeof getSlotKey!=='function'||typeof onPersist!=='function')throw Error('Missing canonical host dependencies');
  let active=null,sequence=0,disposed=false;
  const valid=run=>!disposed&&active===run&&getSlotKey()===run.slot&&engine.view().current?.id===run.id&&engine.snapshot().revision===run.revision;
  const report=reason=>{onError?.({reason});return bad(reason)};
  // Scene results are committed only through the official engine.
  // World/puzzle/combat operations are NEVER recorded by this presentation layer.
  function resolve(event,skipped){
    const run=active;if(!run||event.sceneId!==run.id||!valid(run))return;
    active=null;
    const current=engine.view().current;
    const persist=result=>{if(!result?.ok)throw Error(result?.reason||'narrative-operation-rejected');onPersist(result.state)};
    try{
      while(engine.view().current?.id===run.id&&engine.view().cursor<current.lines.length){
        if(!engine.view().lineReady)throw Error('dialogue-awaits-gameplay');
        persist(engine.nextLine());
      }
      for(const op of current.requires.filter(x=>x.startsWith('cinematic:'))){
        if(engine.view().objective.includes(op))persist(engine.record(run.id,op));
      }
      // Host owns finish() and all non-cinematic event transitions.
      onResolved?.({sceneId:run.id,skipped,slot:run.slot,remaining:engine.view().objective});
    }catch(error){onError?.({sceneId:run.id,reason:error.message});}
  }
  const renderer=rendererFactory(root,{language,onLanguageChange,onComplete:e=>resolve(e,false),onSkip:e=>resolve(e,true),onError:e=>{active=null;onError?.(e)}});
  const syncLanguage=()=>renderer.setLanguage?.(typeof language==='function'?language():language||'zh');
  if(typeof window!=='undefined')window.addEventListener('morrowwish-language-change',syncLanguage);
  async function playCurrent(resume=null){
    if(disposed)return bad('disposed');
    const id=++sequence;renderer.stop();active=null;
    const view=engine.view(),result=buildCanonicalScene({view,campaign,manifest});
    if(!result.ok)return report(result.reason);
    const run={id:view.current.id,slot:getSlotKey(),revision:engine.snapshot().revision,sequence:id};
    if(resume&&(resume.slot!==run.slot||resume.revision!==run.revision||resume.snapshot?.sceneId!==run.id))return report('stale-cinematic-snapshot');
    active=run;
    try{await preload(result.scene)}catch(e){if(active===run)active=null;return report('cinematic-image-load-failed')}
    if(sequence!==id||!valid(run)){if(active===run)active=null;return bad('stale-slot-or-scene')}
    renderer.register(result.scene);
    if(resume)renderer.restore(resume.snapshot);else renderer.play(run.id);
    return {ok:true,sceneId:run.id};
  }
  function interrupt(){if(!active||!valid(active))return null;return {slot:active.slot,revision:active.revision,snapshot:renderer.interrupt()};}
  function dispose(){disposed=true;sequence++;active=null;renderer.destroy();if(typeof window!=='undefined')window.removeEventListener('morrowwish-language-change',syncLanguage)}
  return {playCurrent,interrupt,dispose};
}
