// Chat 2 title/slot handoff to Chat 4's authoritative slot runtime and Chat 6's
// cinematic presenter. No campaign copy and no independent story-progress key.
const lang=()=>window.MorrowwishI18n?.get?.()==='zh'?'zh':'en';
const t=(zh,en)=>lang()==='zh'?zh:en;
const cinematics=new Set(['prologue:P-01','prologue:P-02','prologue:P-03']);
export function classifyPrologue(view){
 const id=view?.current?.id;
 if(cinematics.has(id))return 'cinematic';
 if(id==='prologue:P-04')return 'garden';
 if(id==='prologue:P-05')return 'departure';
 return 'world';
}
export function finishCinematicScene(runtime,sceneId){
 const view=runtime.view();
 if(view.current?.id!==sceneId)return {ok:true,alreadyAdvanced:true};
 if(!cinematics.has(sceneId))return {ok:false,reason:'not-opening-cinematic'};
 if(view.objective.length||view.cursor!==view.current.lines.length)return {ok:false,reason:'cinematic-incomplete'};
 return runtime.finish();
}
let active=null;
function errorPanel(game,reason,retry){
 const stage=document.getElementById('stage');
 const box=document.createElement('section');box.className='cb-opening-error';box.setAttribute('role','alertdialog');box.setAttribute('aria-modal','true');
 const heading=document.createElement('h2'),copy=document.createElement('p'),buttons=document.createElement('div');
 const again=document.createElement('button'),back=document.createElement('button'),locale=document.createElement('button');
 for(const button of [again,back,locale])button.type='button';
 function render(){
  heading.textContent=t('序章暂无法播放','The opening is unavailable');
  copy.textContent=t('正式演出资源未通过检查，剧情进度没有被跳过。你可以重试或返回标题画面。','Required canonical cinematic assets did not pass validation. No story progress has been skipped. Retry or return to the title.');
  again.textContent=t('重试','Retry');back.textContent=t('返回标题','Return to title');locale.textContent=t('English','中文');
 }
 const clean=()=>{window.removeEventListener('morrowwish-language-change',render);box.remove()};
 again.onclick=()=>{clean();retry();};
 back.onclick=()=>{clean();window.State.hardReset();location.reload()};
 locale.onclick=()=>window.MorrowwishI18n?.set?.(lang()==='zh'?'en':'zh');
 buttons.append(again,back,locale);box.append(heading,copy,buttons);stage.append(box);
 box.dataset.reason=reason;render();window.addEventListener('morrowwish-language-change',render);again.focus();
 return clean;
}
export async function startCanonicalOpening(game,{onWorld}={}){
 if(active)active.dispose();
 const rootState=window.State?.S,slot=window.State?.activeSlot?.();
 if(!rootState||!slot)return {ok:false,reason:'no-active-slot'};
 window.__CAT_BOND_CANONICAL_ACTIVE__=true;
 const same=()=>window.State.S===rootState&&window.State.activeSlot()===slot;
 let closed=false,controller=null,root=null,removeError=null,launching=false,runtime=null;
 const onSlotChange=()=>{if(!same())dispose();};
 const dispose=()=>{if(closed)return;closed=true;controller?.dispose();root?.remove();removeError?.();window.removeEventListener('cat-bond-resonance-changed',onSlotChange);window.removeEventListener('pagehide',dispose);};
 const live=()=>{if(closed)return false;if(!same()){dispose();return false;}return true;};
 active={dispose};
 window.addEventListener('cat-bond-resonance-changed',onSlotChange);
 window.addEventListener('pagehide',dispose,{once:true});
 const showError=reason=>{if(!live())return;controller?.cancel?.();removeError?.();removeError=errorPanel(game,reason,()=>{removeError=null;if(controller&&typeof advance==='function')advance();else{dispose();startCanonicalOpening(game,{onWorld})}});};
 const toGarden=()=>{
  game.scene='yard';game.battle=null;game.rebuildYard?.();game.showYardChrome?.();game.refreshHUD?.();
 };
 let advance;
 try{
  const [{campaign},{createSlotRuntime}]=await Promise.all([import('./campaign.mjs'),import('./slot-runtime.mjs')]);
  if(!live())return {ok:false,reason:'slot-changed'};
  runtime=createSlotRuntime(window.State,{notify:detail=>window.dispatchEvent(new CustomEvent('cat-bond-resonance-changed',{detail}))});
  const initialized=runtime.initialize();
  if(!initialized.ok)throw Error(initialized.reason||'narrative-slot-initialization-failed');
  if(!live())return {ok:false,reason:'slot-changed'};
  const initial=runtime.view();
  const initialMode=classifyPrologue(initial);
  // A save that already left the cinematic part does not require downloading
  // cinematic assets on every Continue. Physical P-04/P-05 objectives remain
  // with the garden/world host, and never get manufactured by this module.
  const handoff=mode=>{
   controller?.dispose();controller=null;root?.remove();root=null;
   if(mode==='garden'){toGarden();dispose();return;}
   if(mode==='departure'){
    game.openWorldMap?.();
    window.CatBondResonance?.showCurrent?.();
    dispose();return;
   }
   try{onWorld?.();}finally{dispose();}
  };
  if(initialMode!=='cinematic'){handoff(initialMode);return {ok:true,mode:initialMode};}
  const [{mountResonanceCinematics},manifest]=await Promise.all([
   import('../resonance-cinematic.mjs'),
   fetch(new URL('../../assets/cinematics/asset-manifest.json',import.meta.url)).then(r=>{if(!r.ok)throw Error('missing-cinematic-manifest');return r.json()})
  ]);
  if(!live())return {ok:false,reason:'slot-changed'};
  const renderer=window.CatBondCinematicPresentation;
  if(typeof renderer?.create!=='function')throw Error('missing-cinematic-presenter');
  root=document.createElement('div');root.id='cb-canonical-opening';document.getElementById('stage').append(root);
  controller=mountResonanceCinematics({
   root,rendererFactory:renderer.create,engine:runtime,campaign,manifest,
   getSlotKey:()=>window.State.activeSlot(),language:lang,
   onLanguageChange:next=>window.MorrowwishI18n?.set?.(next),
   onResolved:result=>{
    if(!live())return;
    const finished=finishCinematicScene(runtime,result.sceneId);
    if(!finished.ok){showError(finished.reason);return;}
    queueMicrotask(()=>{if(live())advance();});
   },
   onError:result=>showError(result?.reason||'cinematic-failed')
  });
  advance=async()=>{
   if(!live()||launching)return;
   const mode=classifyPrologue(runtime.view());
   if(mode!=='cinematic'){handoff(mode);return;}
   launching=true;
   try{const result=await controller.playCurrent();if(!result.ok&&live())showError(result.reason);return result;}
   catch(e){const reason=e.message||'cinematic-failed';showError(reason);return {ok:false,reason};}
   finally{launching=false;}
  };
  const result=await advance();return result?.ok===false?result:{ok:true,mode:classifyPrologue(runtime.view())};
 }catch(error){
  if(live())showError(error.message||'canonical-opening-failed');
  return {ok:false,reason:error.message||'canonical-opening-failed'};
 }
}
window.CatBondTitlePrologue=Object.freeze({start:startCanonicalOpening,available:()=>!!(window.__CAT_BOND_CANONICAL_RELEASE__||window.CatBondResonance||window.CatBondCanonicalWorld),dispose:()=>active?.dispose()});
