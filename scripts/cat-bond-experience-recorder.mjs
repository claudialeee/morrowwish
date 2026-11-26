// Opt-in experience evidence recorder. No production game code, writes to saves,
// story mutations, or synthetic player analytics. Only used by local browser tests.
import fs from 'node:fs';
import path from 'node:path';

export async function attachExperienceRecorder(context, page, {id, root = 'artifacts/cat-bond-experience'} = {}) {
  if (process.env.CAT_BOND_EXPERIENCE !== '1') return;
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
  record({kind:'run',id,profile:process.env.CAT_BOND_PROFILE||process.env.PROLOGUE_PROFILE||'unknown',
    language:process.env.PROLOGUE_LANG||'en',mode:process.env.CAT_BOND_FULL_CAMPAIGN==='1'?'authored campaign':'opening',
    revision:process.env.GITHUB_SHA||null});
  // Only local acceptance server can be contacted. It uses ephemeral SQLite.
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    return (url.protocol==='data:'||url.protocol==='blob:'||url.origin==='http://127.0.0.1:8765')
      ? route.continue() : route.abort();
  });
  page.on('pageerror',error=>record({kind:'pageerror',message:error.message}));
  page.on('console',msg=>{if(msg.type()==='error'||msg.type()==='warning')record({kind:'console',level:msg.type(),message:msg.text().slice(0,1000)});});
  page.on('response',res=>{if(res.status()>=400&&res.url().startsWith('http://127.0.0.1:8765/'))record({kind:'http_error',status:res.status(),url:res.url()});});
  await page.exposeBinding('__cbExperienceEmit',(_,event)=>record(event));
  await page.addInitScript(()=>{
    if(location.origin!=='http://127.0.0.1:8765')return;
    let previous='', scheduled=false;
    const send=event=>{void window.__cbExperienceEmit(event).catch(()=>{});};
    const visible=e=>!!e&&e.getClientRects().length>0&&!e.closest('[hidden],[inert],[aria-hidden="true"]')&&getComputedStyle(e).visibility!=='hidden'&&getComputedStyle(e).display!=='none';
    const clean=s=>(s||'').replace(/\s+/g,' ').trim().slice(0,1800);
    const selectors=['#cb-player-first-intro','#cb-traveler-encounter','.res-host','.cbcp-root','.sg-prologue-guide','.rw-current','.rw-next','.rw-hint','.rw-notice','.rw-puzzle-controls','.rw-world-actions','#panel.open','#battle-ui.on','#cb-system-menu:not([hidden])','#toasts','#start-error:not([hidden])'];
    function read(){
      const v=window.CatBondResonance?.view?.();
      const game=window.__game;
      const blocks=selectors.flatMap(selector=>[...document.querySelectorAll(selector)].filter(visible).map(el=>({selector,text:clean(el.innerText)}))).filter(b=>b.text);
      // Evidence is visible text. Scene/objective IDs are technical routing metadata,
      // not a source of knowledge for the spoiler-free player reviewer.
      const buttons=[...document.querySelectorAll('#stage button')].filter(visible).filter(e=>!e.disabled).map(e=>clean(e.getAttribute('aria-label')||e.innerText||e.title)).filter(Boolean).slice(0,80);
      return {scene:v?.current?.id||null,cursor:v?.cursor??null,objective:v?.objective||[],
        area:game?.scene||null,region:window.WorldMap?.currentRegion||null,blocks,buttons};
    }
    function sample(){
      scheduled=false;
      try{const state=read(),key=JSON.stringify(state);
        if(key!==previous){previous=key;send({kind:'screen',...state});}
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
    document.addEventListener('keydown',event=>{if(event.isTrusted&&['Enter',' ','Escape','w','a','s','d','q','e','r','j'].includes(event.key))send({kind:'key',key:event.key,scene:window.CatBondResonance?.view?.()?.current?.id||null});},true);
    document.addEventListener('DOMContentLoaded',()=>{
      sample();
      new MutationObserver(()=>{if(!scheduled){scheduled=true;setTimeout(sample,100);}}).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden','class','aria-hidden','disabled']});
      setInterval(sample,300);
    },{once:true});
    window.addEventListener('pagehide',sample);
  });
}
