// Production adapter to the single Chat 4 engine. No storage, no independent campaign, no legacy fallback.
// The host passes its active engine, campaign, current slot identity and persistence callback.
// Only independently accepted raster assets can be selected; missing art must never unlock narrative evidence.
const bad=reason=>({ok:false,reason});
const isBilingual=x=>typeof x?.zh==='string'&&x.zh.trim()&&typeof x?.en==='string'&&x.en.trim();
const raster=/^assets\/cinematics\/[a-z0-9/_-]+\.(?:webp|png|avif|jpe?g)$/;
export function buildCanonicalScene({view,campaign,manifest,staging=false,openingRelease=false}) {
  const scene=view?.current;
  if(!scene||campaign?.canon!=='The Last Resonance')return bad('no-canon-scene');
  if(campaign.openingPresentationVersion===2&&/^prologue:P-0[1-5]$/.test(scene.id))return bad('opening-animation-retired');
  const canonical=campaign.scenes.find(x=>x.id===scene.id);
  if(!canonical||JSON.stringify(canonical)!==JSON.stringify(scene))return bad('noncanonical-scene');
  if(scene.choices.length&&scene.choiceTiming==='beforeAction'&&!view.choice)return bad('choice-pending');
  if(view.objective.some(op=>!op.startsWith('cinematic:')))return bad('gameplay-pending');
  if(scene.lines.length&&!view.lineReady&&view.cursor<scene.lines.length)return bad('dialogue-awaits-gameplay');
  const approved=manifest?.approvedShots?.[scene.id];
  const release=openingRelease&&!approved&&/^prologue:P-0[123]$/.test(scene.id)&&manifest?.prologueReleaseShots?.[scene.id];
  const useStaging=staging&&!approved&&!release;
  const shots=approved||release||(useStaging?manifest?.stagingShots?.[scene.id]:null);
  if(!Array.isArray(shots)||shots.length<2)return bad('approved-shot-sequence-missing');
  const assets=new Map((manifest.assets||[]).map(a=>[a.id,a]));
  const unique=new Set(),covered=[],frames=[];
  for(const [i,shot] of shots.entries()){
    const asset=assets.get(shot.assetId);
    const independentlyApproved=asset?.status==='approved'&&asset.runtimeAllowed===true&&asset.visualReview?.evidence&&asset.visualReview.result==='PASS';
    const allowed=release
      ?manifest.prologueReleaseAuthorization?.assets?.includes(asset?.id)&&(independentlyApproved||(asset?.status==='candidate'&&asset.stagingAllowed===true&&asset.runtimeAllowed===false))
      :useStaging
      ?asset?.status==='candidate'&&asset.stagingAllowed===true&&asset.runtimeAllowed===false
      :independentlyApproved;
    const recalled=(useStaging||!!approved)&&scene.id==='starfall:F-02'&&['opening-star-bell','opening-keepers-choice','opening-broken-bell-tongue'].includes(asset?.id)&&/^prologue:P-0[12]$/.test(asset.sceneKey);
    if(!allowed||(!recalled&&asset.sceneKey!==scene.id)||!raster.test(asset.path))return bad('unapproved-shot');
    if(unique.has(asset.path))return bad('repeated-shot-art');unique.add(asset.path);
    if(!isBilingual(shot.alt)||!Number.isFinite(shot.durationMs)||shot.durationMs<1200||shot.durationMs>20000||!Array.isArray(shot.lines))return bad('invalid-shot');
    const base={id:scene.id+'-shot-'+i,image:asset.path,alt:shot.alt,durationMs:shot.durationMs,camera:shot.camera,focus:shot.focus,transitionMs:shot.transitionMs||520,effect:shot.effect};
    if(!shot.lines.length){
      const openingCaptions={
        'opening-star-bell':{zh:'六座圣所曾用各自的歌互相回应，中央星铃为它们合拍。直到一颗陨星击碎了星铃。',en:'Six sanctuaries once answered each other in song, guided by the Star Bell. Then a fallen star shattered it.'},
        'opening-harbor-at-twilight':{zh:'失去回应的铃声开始模仿、覆盖真实记忆。猫咪逐渐忘记自己的家和伙伴。',en:'The unanswered ringing began to copy and overwrite memories. Cats started forgetting their homes and friends.'},
        'opening-waiting-at-workbench':{zh:'那场灾难暂时平息。一只小猫把旧铃修了又修，守着一个归来的约定。',en:'The disaster subsided. One cat kept repairing an old bell, holding on to a promise of return.'},
        'opening-garden-at-dawn':{zh:'许多年后，阳光花园里终于传来了一声熟悉的铃响。新的旅程就此开始。',en:'Years later, a familiar bell finally rang in Sunlit Garden. A new adventure was about to begin.'}
      };
      const copy=recalled&&isBilingual(shot.caption)?shot.caption:scene.chapter==='prologue'?openingCaptions[asset.id]:null;
      const caption=isBilingual(copy)?{zh:{speaker:'',text:copy.zh},en:{speaker:'',text:copy.en}}:undefined;
      frames.push({...base,subtitle:caption,shotDurationMs:base.durationMs,shotOffsetMs:0});}
    const duration=index=>Math.max(2600,Math.min(11000,1100+scene.lines[index].text.en.length*70));
    const total=shot.lines.reduce((sum,index)=>sum+(scene.lines[index]?duration(index):0),0)+(shot.effect==='seal'?4200:0);
    let offset=0;
    for(const index of shot.lines){
      if(!Number.isInteger(index)||!scene.lines[index])return bad('invalid-canon-line-index');
      covered.push(index);
      const ms=duration(index),start=offset;offset+=ms;
      // Chapter cinematics can be retried after a partial save of dialogue.
      // Replay the authored presentation; resolve() persists only missing lines.
      if(scene.chapter==="prologue"&&index<view.cursor)continue;
      const line=scene.lines[index],actor=campaign.cast[line.speaker];
      if(!isBilingual(line.text)||!isBilingual(actor?.name))return bad('missing-canon-localization');
      const speaker=scene.id==='prologue:P-02'&&line.speaker==='player'?{zh:'陌生的猫',en:'Unknown cat'}:actor.name;
      frames.push({...base,id:base.id+'-line-'+index,durationMs:ms,shotDurationMs:total,shotOffsetMs:start,subtitle:{zh:{speaker:speaker.zh,text:line.text.zh},en:{speaker:speaker.en,text:line.text.en}}});
    }
    if(shot.effect==='seal')frames.push({...base,id:base.id+'-closure',durationMs:4200,shotDurationMs:total,shotOffsetMs:offset});
  }
  if(covered.length!==scene.lines.length||covered.some((v,i)=>v!==i))return bad('incomplete-or-reordered-dialogue');
  if(!frames.length)return bad('nothing-to-play');
  // The six existing painted world plates establish the six sanctuaries before
  // the original Star Bell image. They are not substitutes for any of the six
  // owner-selected opening paintings, nor a general staging-art bypass.
  if(release&&scene.id==='prologue:P-01'){
    const montage=manifest.openingRegionMontage;
    const ids=['harbor','forest','forge','sky','library','starfall'];
    if(!Array.isArray(montage)||montage.length!==ids.length||montage.some((s,i)=>s.id!==ids[i]||s.image!=='assets/resonance-world-v2/'+ids[i]+'.webp'||!isBilingual(s.title)||!Number.isFinite(s.note)||s.durationMs!==1800))return bad('invalid-opening-region-montage');
    frames.unshift(...montage.map(s=>({id:'prologue:P-01-region-'+s.id,image:s.image,alt:s.title,kicker:s.title,durationMs:s.durationMs,transitionMs:420,camera:{from:{x:0,y:0,scale:1.03},to:{x:0,y:0,scale:1.09}},effect:'sanctuary',note:s.note})));
  }
  // Six concrete exchanges use the existing painted regions and their actual residents.
  // The approved/staging asset gate above remains unchanged.
  if(scene.id==='epilogue:E-01'){
    const regions=['harbor','forest','forge','sky','library','starfall'];
    const journeys=[
      ['港口船只抵达眠根林','Harbor ships reach Rootsleep Forest'],
      ['眠根林送出药草与木材','Rootsleep sends herbs and timber to Emberforge'],
      ['赤炉环城检修空中航路的器材','Emberforge prepares equipment for the air routes'],
      ['云脊群岛的信使抵达月镜书库','Skyspine couriers reach Moonmirror Library'],
      ['月镜书库与星坠原共享历史档案','Moonmirror shares its records with Starfall'],
      ['星坠原的导航信号指引港口船只','Starfall restores the navigation signal to Harbor']
    ];
    const original=frames.slice();frames.length=0;
    for(const [i,region] of regions.entries()){
      const names=Object.entries(campaign.cast).filter(([,a])=>a.region===region);
      const shot=i===0?original[0]:i===3?original[1]:null;
      const [zh,en]=journeys[i];
      frames.push({...shot,id:'epilogue:E-01-exchange-'+region,image:shot?.image||'assets/resonance-world-v2/'+region+'.webp',
       alt:{zh,en},durationMs:5400,transitionMs:680,kicker:{zh,en},subtitle:i<2?{zh:{speaker:campaign.cast[scene.lines[i].speaker].name.zh,text:scene.lines[i].text.zh},en:{speaker:campaign.cast[scene.lines[i].speaker].name.en,text:scene.lines[i].text.en}}:undefined,
       camera:{from:{x:i%2?1:-1,y:0,scale:1.025},to:{x:i%2?-2:2,y:0,scale:1.075}},
       layers:names.map(([id],j)=>({image:'assets/npc/'+id+'-painted.webp',kind:'actor',x:j===0?23:76,y:80,width:22,travel:j===0?4:-4})),
       effect:'sanctuary',note:[261.63,293.66,329.63,392,440,523.25][i]});
    }
  }
  if(scene.id==='finale:B-04'){
    frames.unshift({id:'finale:B-04-memory-bell',image:'assets/cinematics/prologue/star-bell.webp',
      alt:{zh:'记忆回到守铃者身边',en:'The Bellkeeper’s memories return'},durationMs:3400,transitionMs:800,
      camera:{from:{x:0,y:0,scale:1.03},to:{x:0,y:0,scale:1.09}},effect:'sanctuary',note:392});
  }
  return {ok:true,scene:{id:scene.id,sourceSceneId:scene.id.split(':')[1],title:scene.id==='prologue:P-02'?{zh:'抉择',en:'The Choice'}:scene.title,chapter:{zh:'猫猫纽带',en:'Cat Bond'},mode:'auto',allowSkip:true,frames}};
}

// Pure permission check: no save, story mutation, staging or URL override.
export function starfallReleaseReady(campaign,manifest){
 try{return ["starfall:F-02","starfall:F-05"].every(id=>{
  const current=campaign.scenes.find(s=>s.id===id);
  if(!current||!manifest?.approvedShots?.[id])return false;
  return buildCanonicalScene({campaign,manifest,view:{current,choice:null,objective:current.requires.filter(o=>o.startsWith("cinematic:")),cursor:0,lineReady:true},staging:false}).ok;
 });}catch{return false;}
}
export async function decodeCinematicImages(scene){
  const urls=[...new Set(scene.frames.flatMap(f=>[f.image,...(f.layers||[]).map(l=>l.image)]))];
  // Sequential bounded decoding prevents a chapter from allocating all image memory at once.
  for(const url of urls){
    const image=new Image();image.src=url;await image.decode();
    if(!image.naturalWidth||!image.naturalHeight)throw Error('Empty cinematic image: '+url);
  }
}

export function mountResonanceCinematics({root,rendererFactory,engine,campaign,manifest,getSlotKey,onPersist,onResolved,onError,language,onLanguageChange,staging=false,openingRelease=false,onCheckpoint,decorateScene,preload=decodeCinematicImages}){
  if(!root||typeof rendererFactory!=='function'||!engine?.view||!engine?.snapshot||typeof getSlotKey!=='function'||(typeof engine.evidence!=='function'&&typeof onPersist!=='function'))throw Error('Missing canonical host dependencies');
  let active=null,sequence=0,disposed=false;
  const valid=run=>!disposed&&active===run&&getSlotKey()===run.slot&&engine.view().current?.id===run.id&&engine.snapshot().revision===run.revision;
  const report=reason=>{onError?.({reason});return bad(reason)};
  // Scene results are committed only through the official engine.
  // World/puzzle/combat operations are NEVER recorded by this presentation layer.
  function resolve(event,skipped){
    const run=active;if(!run||event.sceneId!==run.id||!valid(run))return;
    active=null;
    const current=engine.view().current;
    const transactional=typeof engine.evidence==='function';
    const persist=result=>{if(!result?.ok)throw Error(result?.reason||'narrative-operation-rejected');if(!transactional)onPersist(result.state)};
    try{
      while(engine.view().current?.id===run.id&&engine.view().cursor<current.lines.length){
        if(!engine.view().lineReady)throw Error('dialogue-awaits-gameplay');
        persist(engine.nextLine());
      }
      for(const op of current.requires.filter(x=>x.startsWith('cinematic:'))){
        if(engine.view().objective.includes(op))persist(transactional?engine.evidence({sceneId:run.id,operation:op,region:current.chapter==="finale"?"starfall":current.chapter,verified:true,token:run.token}):engine.record(run.id,op));
      }
      // Host owns finish() and all non-cinematic event transitions.
      onResolved?.({sceneId:run.id,skipped,slot:run.slot,remaining:engine.view().objective});
    }catch(error){onError?.({sceneId:run.id,reason:error.message});}
  }
  const renderer=rendererFactory(root,{language,onLanguageChange,onCheckpoint:snapshot=>{const run=active;if(run&&valid(run))onCheckpoint?.({slot:run.slot,revision:run.revision,snapshot});},onComplete:e=>resolve(e,false),onSkip:e=>resolve(e,true),onError:e=>{active=null;onError?.(e)}});
  const syncLanguage=()=>renderer.setLanguage?.(typeof language==='function'?language():language||'zh');
  if(typeof window!=='undefined')window.addEventListener('morrowwish-language-change',syncLanguage);
  async function playCurrent(resume=null,{skip=false}={}){
    if(disposed)return bad('disposed');
    const id=++sequence;renderer.stop({preserveFrame:openingRelease&&!skip});active=null;
    const view=engine.view(),result=buildCanonicalScene({view,campaign,manifest,staging,openingRelease});
    if(!result.ok)return report(result.reason);
    const run={id:view.current.id,slot:getSlotKey(),revision:engine.snapshot().revision,sequence:id,token:engine.capture?.()};
    if(resume&&(resume.slot!==run.slot||resume.revision!==run.revision||resume.snapshot?.sceneId!==run.id))return report('stale-cinematic-snapshot');
    active=run;
    try{await decorateScene?.(result.scene);await preload(result.scene)}catch(e){if(!valid(run))return bad('stale-slot-or-scene');active=null;return report('cinematic-image-load-failed')}
    if(sequence!==id||!valid(run)){if(active===run)active=null;return bad('stale-slot-or-scene')}
    try{
      let checkpoint=resume?.snapshot;
      if(checkpoint){
        // Stable authored frame identity survives insertion of the six-region
        // montage. Old P-01 checkpoints had only the two original shots.
        const index=checkpoint.frameId?result.scene.frames.findIndex(f=>f.id===checkpoint.frameId)
          :run.id==='prologue:P-01'&&openingRelease&&result.scene.frames[0]?.effect==='sanctuary'
          ?checkpoint.frameIndex+6:checkpoint.frameIndex;
        if(!Number.isInteger(index)||index<0||index>=result.scene.frames.length||!Number.isFinite(checkpoint.elapsedMs)||checkpoint.elapsedMs<0){active=null;return report('invalid-cinematic-checkpoint');}
        checkpoint={...checkpoint,frameIndex:index,elapsedMs:Math.min(checkpoint.elapsedMs,Math.max(0,result.scene.frames[index].durationMs-1))};
      }
      if(skip&&openingRelease&&/^prologue:P-0[123]$/.test(run.id)){resolve({sceneId:run.id},true);return {ok:true,sceneId:run.id};}
      renderer.register(result.scene);
      const started=checkpoint?renderer.restore(checkpoint):renderer.play(run.id);
      if(started===false){active=null;return report('cinematic-start-failed');}
      return {ok:true,sceneId:run.id};
    }catch(error){active=null;renderer.stop();return report('cinematic-start-failed');}
  }
  function interrupt(){if(!active||!valid(active))return null;return {slot:active.slot,revision:active.revision,snapshot:renderer.interrupt()};}
  function dispose(){disposed=true;sequence++;active=null;renderer.destroy();if(typeof window!=='undefined')window.removeEventListener('morrowwish-language-change',syncLanguage)}
  function cancel(){sequence++;active=null;renderer.stop();}
  return {playCurrent,interrupt,cancel,dispose,snapshot:()=>active&&valid(active)?{slot:active.slot,revision:active.revision,snapshot:renderer.snapshot?.()}:null};
}
