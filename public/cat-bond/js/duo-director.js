/* Cat Bond: distinct original attack motion for all 21 elemental duos.
 * Each key has FOUR separately authored pair poses: windup, launch, hit and
 * follow-through. The hit keyframe is synchronized to combat strikeAt=.78s.
 * Whole watercolor cats always move as single unbroken subjects.
 */
(function(){
'use strict';
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{x=clamp(x);return x*x*(3-2*x)};
const stage=[0,.13,.28,.64,1];
const map={
 'dark+dark':   ['shadow',[[.20,.75,.80,.75],[.15,.72,.86,.75],[.37,.49,.67,.70],[.27,.74,.72,.51],[.21,.74,.79,.74]]],
 'dark+elec':   ['blink', [[.22,.73,.79,.70],[.17,.64,.87,.48],[.35,.65,.64,.40],[.27,.44,.72,.72],[.23,.73,.78,.72]]],
 'dark+fire':   ['ember', [[.20,.77,.82,.72],[.29,.74,.84,.31],[.38,.76,.64,.42],[.25,.70,.70,.65],[.20,.77,.80,.72]]],
 'dark+grass':  ['vine',  [[.24,.72,.81,.72],[.24,.68,.88,.73],[.32,.70,.62,.40],[.27,.68,.73,.62],[.24,.72,.80,.72]]],
 'dark+light':  ['eclipse',[[.28,.73,.79,.73],[.30,.72,.77,.65],[.30,.67,.63,.54],[.30,.67,.74,.69],[.28,.73,.79,.73]]],
 'dark+water':  ['mist',  [[.20,.76,.81,.73],[.30,.61,.78,.52],[.36,.45,.64,.73],[.26,.66,.76,.50],[.21,.76,.80,.74]]],
 'elec+elec':  ['zigzag',[[.17,.70,.85,.76],[.33,.41,.72,.72],[.36,.73,.64,.41],[.26,.43,.76,.70],[.18,.71,.83,.74]]],
 'elec+fire':  ['spiral',[[.20,.77,.80,.75],[.30,.39,.70,.76],[.36,.63,.64,.43],[.29,.75,.75,.44],[.20,.76,.80,.75]]],
 'elec+grass': ['snare', [[.24,.76,.79,.74],[.24,.69,.75,.35],[.35,.73,.65,.42],[.27,.64,.78,.62],[.24,.75,.79,.74]]],
 'elec+light': ['dash',  [[.19,.76,.82,.75],[.34,.68,.75,.44],[.37,.49,.62,.67],[.25,.69,.74,.44],[.20,.76,.80,.75]]],
 'elec+water': ['bubbles',[[.25,.73,.75,.77],[.31,.36,.75,.71],[.37,.55,.67,.73],[.27,.44,.73,.64],[.25,.75,.76,.74]]],
 'fire+fire':  ['fireworks',[[.19,.79,.83,.79],[.27,.34,.75,.34],[.36,.44,.64,.47],[.28,.65,.75,.61],[.20,.78,.80,.77]]],
 'fire+grass': ['petals',[[.22,.76,.79,.72],[.27,.74,.72,.30],[.36,.65,.64,.44],[.28,.56,.74,.75],[.23,.74,.79,.73]]],
 'fire+light': ['solar', [[.31,.75,.77,.68],[.31,.69,.73,.30],[.33,.68,.66,.52],[.32,.68,.73,.41],[.30,.74,.79,.71]]],
 'fire+water': ['cannon',[[.28,.75,.78,.74],[.30,.75,.82,.72],[.34,.62,.63,.38],[.29,.67,.77,.49],[.25,.75,.78,.73]]],
 'grass+grass':['sprout',[[.25,.74,.75,.74],[.30,.69,.70,.69],[.36,.58,.65,.58],[.29,.53,.71,.53],[.25,.73,.75,.73]]],
 'grass+light':['halo',[[.30,.75,.79,.73],[.30,.71,.75,.36],[.32,.65,.65,.51],[.30,.68,.76,.43],[.29,.74,.79,.73]]],
 'grass+water':['blossom',[[.20,.77,.81,.74],[.28,.71,.75,.34],[.36,.71,.65,.44],[.28,.55,.75,.64],[.22,.75,.79,.73]]],
 'light+light':['stars',[[.23,.75,.76,.75],[.32,.49,.69,.48],[.36,.60,.64,.59],[.27,.46,.73,.46],[.24,.74,.76,.74]]],
 'light+water':['lake',[[.29,.74,.80,.74],[.30,.69,.75,.61],[.31,.67,.63,.52],[.31,.70,.74,.61],[.29,.74,.79,.74]]],
 'water+water':['tides',[[.20,.77,.80,.74],[.31,.40,.70,.71],[.37,.64,.64,.39],[.27,.53,.75,.71],[.21,.74,.79,.74]]]
};
const styleAngle={
 shadow:[-.18,-.08],blink:[-.30,.20],ember:[-.11,-.30],vine:[0,-.28],
 eclipse:[-.03,-.18],mist:[-.19,.16],zigzag:[.18,-.25],spiral:[.25,-.27],
 snare:[.08,-.27],dash:[-.22,.22],bubbles:[-.18,.12],fireworks:[-.27,.28],
 petals:[.09,-.29],solar:[0,-.2],cannon:[-.07,-.32],sprout:[-.12,.11],
 halo:[0,-.22],blossom:[.10,-.30],stars:[.12,-.11],lake:[0,-.24],tides:[.18,-.25]
};
const styles=Object.fromEntries(Object.entries(map).map(([k,v])=>[k,v[0]]));
function pose(key,p,W,H){
 const [style,poses]=map[key]||map['light+water'];p=clamp(p);
 let idx=0;while(idx<stage.length-2&&p>stage[idx+1])idx++;
 const t=ease((p-stage[idx])/(stage[idx+1]-stage[idx]));
 const xy=(n,cat)=>poses[idx][n+cat*2]+(poses[idx+1][n+cat*2]-poses[idx][n+cat*2])*t;
 const rush=Math.sin(Math.PI*clamp(p/.60));
 const a={x:xy(0,0)*W,y:xy(1,0)*H,angle:styleAngle[style][0]*rush,scale:1+Math.min(.10,rush*.08),opacity:1,phase:p};
 const b={x:xy(0,1)*W,y:xy(1,1)*H,angle:styleAngle[style][1]*rush,scale:1+Math.min(.10,rush*.08),opacity:1,phase:p};
 if(style==='shadow'||style==='blink')a.opacity=Math.max(.26,Math.min(1,Math.abs(p-.17)*16));
 if(style==='zigzag'||style==='blink')b.opacity=Math.max(.27,Math.min(1,Math.abs(p-.16)*17));
 // Extra differences in spacing and kinetic accent, not just swapped colors.
 if(style==='spiral'||style==='tides'){
  a.angle+=Math.sin(2*Math.PI*p)*.17;
  b.angle-=Math.sin(2*Math.PI*p)*.17;
 }else if(style==='halo'||style==='eclipse'||style==='lake'){
  a.scale*=1.05; // guardian cat braces in front of the attack
 }else if(style==='cannon'){
  b.scale*=1+.10*Math.sin(Math.PI*clamp((p-.13)/.28));
 }
 return [a,b];
}
function accent(ctx,W,H,p,key,tier){
 if(!window.CatBondDuoSignatures?.paint)return;
 ctx.save();ctx.globalAlpha=.44;
 window.CatBondDuoSignatures.paint(ctx,W,H,p,tier,key);
 ctx.restore();
}
window.CatBondDuoDirector={
 keys:Object.keys(map),styles,map,pose,accent,
 isUnique:()=>new Set(Object.values(map).map(v=>JSON.stringify(v[1]))).size===21
};
})();
