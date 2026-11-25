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
  const player=mountResonanceCinematics({root,rendererFactory,engine:runtime,campaign,manifest,getSlotKey,language,onLanguageChange,onError,onResolved:event=>{
    if(disposed||slot!==State.S)return;
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
    async resume(snapshot){syncSlot();return player.playCurrent(snapshot)},
    cancel(){player.cancel()},
    dispose(){if(disposed)return;disposed=true;window.clearInterval(timer);window.removeEventListener('cat-bond-resonance-changed',sync);player.dispose();root.remove()}
  });
}
