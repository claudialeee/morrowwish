// Opt-in experience evidence recorder. No production game code, writes to saves,
// story mutations, or synthetic player analytics. Only used by local browser tests.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

export async function attachExperienceRecorder(context, page, {id, root = 'artifacts/cat-bond-experience', synthetic = false, chapterEntry = null} = {}) {
  if (process.env.CAT_BOND_EXPERIENCE !== '1') return;
  if (chapterEntry && (!synthetic || !/^[a-z]+:[A-Z]-\d{2}$/.test(chapterEntry))) throw Error('Invalid synthetic chapter entry');
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) throw new Error('Invalid experience run id');
  fs.mkdirSync(root, {recursive:true});
  const file = path.join(root, id + '.jsonl');
  fs.writeFileSync(file, '');
  const start = Date.now();
  let seq = 0, capped = false;
  function record(event) {
    if (seq >= 30000) {
      if (!capped) fs.appendFileSync(file, JSON.stringify({kind:'truncated', reason:'event cap reached'})+'\n');
      capped = true; return;
    }
    fs.appendFileSync(file, JSON.stringify({seq:++seq, ms:Date.now()-start, ...event})+'\n');
  }
  const revision=process.env.GITHUB_SHA||execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
  const checkpointDir=path.join(root,'checkpoints',id);
  fs.mkdirSync(checkpointDir,{recursive:true});
  const saved=new Set();
  record({kind:'run',id,profile:process.env.CAT_BOND_PROFILE||process.env.PROLOGUE_PROFILE||'unknown',
    language:id.startsWith('campaign-')?'en':process.env.PROLOGUE_LANG||'en',mode:id.startsWith('campaign-')?'authored campaign':id.startsWith('free-')?'free play':'opening',
    revision,provenance:synthetic?'synthetic checkpoint + real subsequent inputs':'fresh real-input browser route'});
  // Only local acceptance server can be contacted. It uses ephemeral SQLite.
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    return (url.protocol==='data:'||url.protocol==='blob:'||url.origin==='http://127.0.0.1:8765')
      ? route.continue() : route.abort();
  });
  page.on('pageerror',error=>record({kind:'pageerror',message:error.message}));
  page.on('console',msg=>{if(msg.type()==='error'||msg.type()==='warning')record({kind:'console',level:msg.type(),message:msg.text().slice(0,1000)});});
  page.on('response',res=>{if(res.status()>=400&&res.url().startsWith('http://127.0.0.1:8765/'))record({kind:'http_error',status:res.status(),url:res.url()});});
  await page.exposeBinding('__cbExperienceEmit',(_,event)=>{
    if(event.kind!=='checkpoint'){record(event);return;}
    // Never treat a seeded entry as player-earned; retain later chapter saves separately.
    if(synthetic&&(!chapterEntry||event.scene===chapterEntry))return;
    const {scene,slot,book,cursor,region,ending=false}=event;
    if(!/^[a-z]+:[A-Z]-\d{2}$/.test(scene)||!/^slot[123]$/.test(slot)||typeof book!=='string'||book.length>2000000)return;
    if(!Number.isInteger(cursor)||cursor<0)return;
    const key=scene+(ending?'--ending':'');
    // One early checkpoint per scene, rather than per frame or dialogue line.
    if(saved.has(key))return;
    try{
      const entry=JSON.parse(book).slots?.[slot],state=entry?.data?.state||entry?.data;
      if(state?.resonance?.scene!==scene||!state.cats?.length)return;
      if(ending&&!state.resonance.completed?.includes(scene))return;
      const fixture={schema:1,revision,run:id,scene,ending,cursor:state.resonance.cursor,region,slot,provenance:synthetic?'synthetic chapter entry + real-input browser save':'real-input local browser save',...(chapterEntry?{chapterEntry,limitations:['Prior chapter history is synthetic; not fresh-slot campaign evidence.']}:{ }),storageState:{cookies:[],origins:[{origin:'http://127.0.0.1:8765',localStorage:[{name:'catbond_save_slots_v1',value:book},{name:'catbond_active_slot_v1',value:slot}]}]}};
      const name=(key+'-'+fixture.cursor).replace(':','-')+'.json';
      fs.writeFileSync(path.join(checkpointDir,name),JSON.stringify(fixture,null,2));
      saved.add(key);record({kind:'checkpoint_saved',scene,ending,cursor:fixture.cursor,region,provenance:fixture.provenance,fixture:'checkpoints/'+id+'/'+name});
    }catch(error){record({kind:'recorder_error',message:'checkpoint: '+String(error)});}
  });
  await page.addInitScript(()=>{
    if(location.origin!=='http://127.0.0.1:8765')return;
    let previous='', scheduled=false; const captured=new Set();
    const send=event=>{void window.__cbExperienceEmit(event).catch(()=>{});};
    const visible=e=>{if(!e||!e.getClientRects().length||e.closest('[hidden],[inert],[aria-hidden="true"]'))return false;
      const r=e.getBoundingClientRect(),style=getComputedStyle(e);
      return r.width>0&&r.height>0&&r.right>0&&r.bottom>0&&r.left<innerWidth&&r.top<innerHeight&&style.visibility!=='hidden'&&style.display!=='none'&&Number(style.opacity)>0;};
    const clean=s=>(s||'').replace(/\s+/g,' ').trim().slice(0,1800);
    const selectors=['#cb-player-first-intro','#cb-traveler-encounter','.res-host','.cbcp-root','.sg-prologue-guide','.rw-current','.rw-next','.rw-hint','.rw-notice','.rw-puzzle-controls','.rw-world-actions','#panel.open','#battle-ui.on','#cb-system-menu:not([hidden])','#toasts','#start-error:not([hidden])'];
    function read(){
      const v=window.CatBondResonance?.view?.();
      const game=window.__game;
      const blocks=selectors.flatMap(selector=>[...document.querySelectorAll(selector)].filter(visible).map(el=>({selector,text:clean(el.innerText)}))).filter(b=>b.text);
      // Evidence is visible text. Scene/objective IDs are technical routing metadata,
      // not a source of knowledge for the spoiler-free player reviewer.
      const buttons=[...document.querySelectorAll('#stage button')].filter(visible).filter(e=>!e.disabled).map(e=>clean(e.getAttribute('aria-label')||e.innerText||e.title)).filter(Boolean).slice(0,80);
      return {scene:v?.current?.id||(v?.ending?window.CatBondResonance.snapshot().scene:null),ending:v?.ending===true,cursor:v?.cursor??null,objective:v?.objective||[],
        area:game?.scene||null,region:window.WorldMap?.currentRegion||null,blocks,buttons};
    }
    function sample(){
      scheduled=false;
      try{const state=read(),key=JSON.stringify(state);
        if(key!==previous){previous=key;send({kind:'screen',...state});}
        const checkpointKey=state.scene+(state.ending?'--ending':'');
        if(state.scene&&!captured.has(checkpointKey)&&['yard','map'].includes(state.area)&&!window.__game?.battle){
          const slot=window.State?.activeSlot?.(),book=localStorage.getItem('catbond_save_slots_v1');
          if(slot&&book){
            const entry=JSON.parse(book).slots?.[slot],data=entry?.data?.state||entry?.data;
            if(data?.resonance?.scene===state.scene&&data.cats?.length&&(!state.ending||data.resonance.completed?.includes(state.scene))){
              captured.add(checkpointKey);send({kind:'checkpoint',scene:state.scene,ending:state.ending,slot,book,cursor:state.cursor,region:state.region});
            }
          }
        }
      }catch(error){send({kind:'recorder_error',message:String(error)});}
    }
    document.addEventListener('click',event=>{
      if(!event.isTrusted)return;
      const e=event.target instanceof Element?event.target:null;
      const button=e?.closest('button,a,[role="button"]');
      const rect=e?.getBoundingClientRect();
      const action=button?clean(button.getAttribute('aria-label')||button.innerText||button.title)||button.id||button.className:
        e?.closest('canvas')?'canvas input':clean(e?.className?.baseVal||e?.className)||'surface';
      try{sample();send({kind:'action',action:String(action).slice(0,220),target:button?.id||e?.id||null,
        x:rect?.width?Number(((event.clientX-rect.left)/rect.width).toFixed(3)):null,
        y:rect?.height?Number(((event.clientY-rect.top)/rect.height).toFixed(3)):null,
        scene:window.CatBondResonance?.view?.()?.current?.id||null});}catch{}
    },true);
    let pointerStart=null;
    document.addEventListener('pointerdown',event=>{if(event.isTrusted)pointerStart={id:event.pointerId,x:event.clientX,y:event.clientY,at:performance.now()};},true);
    document.addEventListener('pointerup',event=>{
      if(!event.isTrusted||!pointerStart||pointerStart.id!==event.pointerId)return;
      const p=pointerStart;pointerStart=null;
      if(Math.hypot(event.clientX-p.x,event.clientY-p.y)>12)send({kind:'gesture',action:'drag',from:[p.x,p.y],to:[event.clientX,event.clientY],durationMs:Math.round(performance.now()-p.at),scene:window.CatBondResonance?.view?.()?.current?.id||null});
    },true);
    document.addEventListener('keydown',event=>{if(event.isTrusted&&['Enter',' ','Escape','w','a','s','d','q','e','r','j'].includes(event.key))send({kind:'key',key:event.key,scene:window.CatBondResonance?.view?.()?.current?.id||null});},true);
    document.addEventListener('DOMContentLoaded',()=>{
      sample();
      new MutationObserver(()=>{if(!scheduled){scheduled=true;setTimeout(sample,100);}}).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden','class','aria-hidden','disabled']});
      setInterval(sample,300);
    },{once:true});
    window.addEventListener('pagehide',sample);
  });
}
