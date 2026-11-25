// Forge Guardian encounter rules. Pure state transitions; no campaign/save ownership.
export const FORGE_ENCOUNTER = Object.freeze({
  id: "forge:E-03",
  operation: "battle:forge-guardian",
  region: "forge",
  bossSpecies: "jinwu",
  supportNpcs: Object.freeze(["jinpo", "xiaomao"]),
  supportCharges: 2
});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const clone=x=>JSON.parse(JSON.stringify(x));
export function createForgeState(){
  return {version:1,heat:24,pressure:18,phase:0,attackIndex:0,attackCooldown:2.6,cast:null,
    ventOpen:0,supportCharges:2,elapsed:0,pressureBursts:0};
}
export function tickForgeState(state,dt,hpFraction,target){
  if(!state||state.version!==1)throw new Error("Invalid forge encounter state");
  const d=clamp(Number(dt)||0,0,.08),events=[];
  state.elapsed+=d;
  state.ventOpen=Math.max(0,state.ventOpen-d);
  const next=hpFraction<=.22?2:hpFraction<=.55?1:0;
  if(next>state.phase){state.phase=next;events.push({type:"phase",phase:next});}
  state.heat=clamp(state.heat+d*(state.phase===2?3.4:state.phase===1?3.05:2.7),0,100);
  state.pressure=clamp((state.pressure??18)+d*(state.ventOpen>0?-8:state.phase===2?5.3:state.phase===1?3.8:2.6),0,100);
  if((state.heat>=100||state.pressure>=100)&&state.ventOpen<=0){
    state.heat=34;state.pressure=28;state.pressureBursts++;
    events.push({type:"pressure-burst",radius:178,damageScale:1.22});
  }
  if(state.cast){
    state.cast.remaining=Math.max(0,state.cast.remaining-d);
    if(state.cast.remaining===0){
      events.push({type:"release",cast:clone(state.cast)});
      state.cast=null;
      state.attackCooldown=state.phase===2?3.0:state.phase===1?3.7:4.6;
    }
  }else{
    state.attackCooldown=Math.max(0,state.attackCooldown-d);
    if(state.attackCooldown===0){
      const sets=[["hammerfall","slag-fan"],["slag-fan","hammerfall","steam-vents"],["steam-vents","hammerfall","slag-fan"]];
      const list=sets[state.phase],kind=list[state.attackIndex++%list.length];
      const cast={kind,phase:state.phase,remaining:state.phase===2 ? 0.88 : state.phase===1 ? 1.02 : 1.18,
        target:target&&Number.isFinite(target.x)&&Number.isFinite(target.y)?{x:target.x,y:target.y}:null};
      state.cast=cast;
      events.push({type:"windup",cast:clone(cast)});
    }
  }
  return events;
}
export function useForgeSupport(state){
  if(!state||state.version!==1)return {ok:false,reason:"invalid-state"};
  if(state.supportCharges<=0)return {ok:false,reason:"no-charges"};
  if(state.ventOpen>0)return {ok:false,reason:"vent-already-open"};
  state.supportCharges--;
  state.heat=Math.max(0,state.heat-46);state.pressure=Math.max(0,(state.pressure??18)-55);
  state.ventOpen=6;
  state.cast=null;
  state.attackCooldown=Math.max(state.attackCooldown,3.4);
  return {ok:true,heat:state.heat,ventOpen:state.ventOpen,charges:state.supportCharges,
    supportNpcs:[...FORGE_ENCOUNTER.supportNpcs]};
}
export function forgeDamageScale(state){
  if(!state||state.version!==1)return 1;
  if(state.ventOpen>0)return 1.18;
  return (state.heat>=65||state.pressure>=75) ? 0.36 : 0.72;
}
export function validateForgeState(state){
  if(!state||state.version!==1||!Number.isFinite(state.heat)||state.heat<0||state.heat>100||
    ![0,1,2].includes(state.phase)||!Number.isInteger(state.supportCharges)||state.supportCharges<0||
    state.supportCharges>2||!Number.isFinite(state.ventOpen)||state.ventOpen<0||
    !Number.isFinite(state.attackCooldown)||state.attackCooldown<0)throw new Error("Invalid forge state");
  if(state.cast&&(!["hammerfall","slag-fan","steam-vents"].includes(state.cast.kind)||
    !Number.isFinite(state.cast.remaining)||state.cast.remaining<0))throw new Error("Invalid forge cast");
  return true;
}
