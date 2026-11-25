// Chat 6 production bridge. The owner of the game lifecycle (Chat 2/4) calls this after selecting a save slot.
// It deliberately does not import a second campaign or attach itself to the obsolete opening.
import {mountResonanceCinematics} from './resonance-cinematic.mjs';

export function installGameCinematicHost({State,runtime,campaign,stage,manifest,rendererFactory,language,onLanguageChange,onError,onResolved}){
  if(!State?.S||typeof runtime?.evidence!=='function'||typeof runtime?.snapshot!=='function'||!stage)throw Error('Canonical game host unavailable');
  const root=document.createElement('div');
  root.className='resonance-cinematic-host';
  root.style.cssText='position:absolute;inset:0;z-index:120;overflow:hidden;';
  root.hidden=true;
  stage.append(root);
  const getSlotKey=()=>State.S;
  let slot=State.S,disposed=false;
  const checkpointKey='resonancePresentation';
  const slotId=()=>State.activeSlot?.()||window.SaveManager?.activeSlot?.();
  function writeCheckpoint(value){
    const root=State.S,previous=root[checkpointKey];
    if(value==null)delete root[checkpointKey];else root[checkpointKey]=value;
    let result;
    try{result=State.save()}catch(error){result={ok:false,reason:error.message}}
    if(!result?.ok&&State.S===root){if(previous===undefined)delete root[checkpointKey];else root[checkpointKey]=previous;}
    return result?.ok?{ok:true}:{ok:false,reason:result?.reason||'save-failed'};
  }
  const player=mountResonanceCinematics({root,rendererFactory,engine:runtime,campaign,manifest,getSlotKey,language,onLanguageChange,onError,onResolved:event=>{
    if(disposed||slot!==State.S)return;
    if(State.S[checkpointKey]?.sceneId===event.sceneId){
      const saved=writeCheckpoint(null);
      if(!saved.ok)onError?.({sceneId:event.sceneId,reason:'checkpoint-clear-failed'});
    }
    onResolved?.(event);
  }});
  const syncSlot=()=>{if(slot!==State.S){player.cancel();slot=State.S;}};
  // Keep reference identity private. Serializable restoration is only valid for the same slot and revision.
  const sync=()=>syncSlot();
  window.addEventListener('cat-bond-resonance-changed',sync);
  const timer=window.setInterval(syncSlot,150);
  return Object.freeze({
    async playCurrent(){syncSlot();return player.playCurrent()},
    interrupt(){syncSlot();return player.interrupt()},
    // Presentation-only metadata. Story progression remains exclusively inside State.S.resonance.
    saveInterruption(){
      syncSlot();const pending=player.interrupt();
      if(!pending?.snapshot||!slotId())return {ok:false,reason:'no-active-cinematic'};
      return writeCheckpoint({schema:1,slotId:slotId(),sceneId:pending.snapshot.sceneId,revision:pending.revision,manifestVersion:manifest.schemaVersion,
        frameIndex:pending.snapshot.frameIndex,elapsedMs:pending.snapshot.elapsedMs,paused:true});
    },
    async resume(snapshot){syncSlot();return player.playCurrent(snapshot)},
    async resumeSaved(){
      syncSlot();const saved=State.S[checkpointKey],current=runtime.view();
      if(!saved||saved.schema!==1||saved.slotId!==slotId()||saved.sceneId!==current.current?.id||saved.revision!==runtime.snapshot().revision||saved.manifestVersion!==manifest.schemaVersion||
        !Number.isInteger(saved.frameIndex)||saved.frameIndex<0||!Number.isFinite(saved.elapsedMs)||saved.elapsedMs<0)return {ok:false,reason:'no-valid-checkpoint'};
      return player.playCurrent({slot:State.S,revision:saved.revision,snapshot:{sceneId:saved.sceneId,frameIndex:saved.frameIndex,elapsedMs:saved.elapsedMs,paused:true}});
    },
    cancel(){player.cancel()},
    dispose(){if(disposed)return;disposed=true;window.clearInterval(timer);window.removeEventListener('cat-bond-resonance-changed',sync);player.dispose();root.remove()}
  });
}
