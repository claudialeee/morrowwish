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
 'grass+light':['highfive',[[.26,.75,.76,.75],[.35,.71,.66,.71],[.435,.67,.565,.67],[.34,.71,.66,.71],[.26,.75,.76,.75]]],
 'grass+water':['blossom',[[.20,.77,.81,.74],[.28,.71,.75,.34],[.36,.71,.65,.44],[.28,.55,.75,.64],[.22,.75,.79,.73]]],
 'light+light':['stars',[[.23,.75,.76,.75],[.31,.67,.69,.67],[.425,.66,.575,.66],[.31,.56,.69,.56],[.24,.74,.76,.74]]],
 'light+water':['lake',[[.29,.74,.80,.74],[.30,.69,.75,.61],[.31,.67,.63,.52],[.31,.70,.74,.61],[.29,.74,.79,.74]]],
 'water+water':['tides',[[.20,.77,.80,.74],[.31,.40,.70,.71],[.37,.64,.64,.39],[.27,.53,.75,.71],[.21,.74,.79,.74]]]
};
const styleAngle={
 shadow:[-.18,-.08],blink:[-.30,.20],ember:[-.11,-.30],vine:[0,-.28],
 eclipse:[-.03,-.18],mist:[-.19,.16],zigzag:[.18,-.25],spiral:[.25,-.27],
 snare:[.08,-.27],dash:[-.22,.22],bubbles:[-.18,.12],fireworks:[-.27,.28],
 petals:[.09,-.29],solar:[0,-.2],cannon:[-.07,-.32],sprout:[-.12,.11],
 halo:[0,-.22],highfive:[.085,-.085],blossom:[.10,-.30],stars:[.12,-.11],lake:[0,-.24],tides:[.18,-.25]
};
const styles=Object.fromEntries(Object.entries(map).map(([k,v])=>[k,v[0]]));
function pose(key,p,W,H,tier=1){
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
 }else if(style==='highfive'||style==='stars'){
  // Two intact watercolor kittens approach, lift their inside forepaws,
  // touch in a grounded play pose, then spring back. No detached limbs.
  const touch=ease((p-.13)/.15)*(1-ease((p-.33)/.29));
  a.angle+=touch*.07;b.angle-=touch*.07;
  a.scale*=1+touch*.055;b.scale*=1+touch*.055;
 }
 // The three trust milestones are THREE DIFFERENT PHYSICAL CHOREOGRAPHIES:
 // 20: synchronized pounce; 60: crossing attacks on upper/lower lanes;
 // 90: protect, aerial vault, reversal and two-cat finishing strike.
 // The original key-specific beats remain, so each elemental pair still has
 // its own speed, rhythm, and route. No limb is separated from its body.
 const level=Math.max(1,Math.min(3,Math.round(Number(tier)||1)));
 const seed=Math.max(0,Object.keys(map).indexOf(key));
 const soften=1+.07*Math.sin(seed*1.91);
 const bank=1+.07*Math.cos(seed*2.21);
 if(level===2){
  const across=ease((p-.13)/.20)*(1-ease((p-.67)/.19));
  const lift=ease((p-.13)/.16)*(1-ease((p-.54)/.20));
  a.x+=W*.47*across*soften;
  b.x-=W*.47*across*soften;
  a.y-=H*(.17+.014*(seed%4))*lift;
  b.y+=H*(.04+.012*(seed%3))*lift;
  a.angle+=.28*lift;b.angle-=.30*lift;
  a.scale*=1+.08*lift;b.scale*=1+.07*lift;
 }else if(level===3){
  const guard=ease((p-.05)/.12)*(1-ease((p-.24)/.10));
  const vault=ease((p-.15)/.20)*(1-ease((p-.44)/.13));
  const counter=ease((p-.39)/.17)*(1-ease((p-.68)/.13));
  const finale=ease((p-.59)/.18)*(1-ease((p-.92)/.07));
  // Staggered rising arcs; the second cat reverses the first one's route.
  a.x+=W*(-.09*guard+.17*vault-.09*counter+.22*finale)*soften;
  b.x+=W*(.07*guard-.09*vault-.19*counter-.17*finale)*bank;
  a.y-=H*(.29*vault+.13*finale)*bank;
  b.y-=H*(.08*guard+.23*counter+.15*finale)*soften;
  a.angle+=.21*vault-.20*counter;b.angle-=.22*counter-.08*finale;
  a.scale*=1+.09*vault+.10*finale;b.scale*=1+.10*counter+.10*finale;
 }
 // Visible whole-body rigs must stay in the frame even on a phone.
 for(const c of [a,b]){
  c.x=Math.max(W*.14,Math.min(W*.86,c.x));
  c.y=Math.max(H*.28,Math.min(H*.87,c.y));
 }
 return [a,b];
}
function accent(ctx,W,H,p,key,tier){
 if(!window.CatBondDuoSignatures?.paint)return;
 ctx.save();ctx.globalAlpha=.44;
 window.CatBondDuoSignatures.paint(ctx,W,H,p,tier,key);
 ctx.restore();
}
// Cinematic storyboard: 21 distinct FULL-SCENE movement tracks.
// Format per beat: [pan X %, pan Y %, camera zoom, camera rotation degrees].
// Track acts on the ENTIRE intact illustrated two-cat scene, never on two
// cropped portraits. Skill-specific impact glyphs remain in duo-finale.js.
const beats=[0,.12,.28,.48,.70,1];
const motionTracks={
 'dark+dark': [[0,0,1.08,0],[-.025,-.012,1.16,-2],[.039,-.029,1.27,2],[-.036,.021,1.18,-2],[.017,0,1.13,0],[0,0,1.08,0]],
 'dark+elec': [[0,0,1.09,0],[.030,-.028,1.21,3],[-.035,.032,1.27,-3],[.036,-.016,1.24,2],[-.023,.018,1.14,-1],[0,0,1.09,0]],
 'dark+fire': [[0,0,1.09,0],[-.011,.025,1.11,-2],[.017,-.048,1.29,2],[.035,-.023,1.21,-3],[-.014,.022,1.14,1],[0,0,1.09,0]],
 'dark+grass': [[0,0,1.08,0],[-.014,.029,1.14,1],[.014,-.040,1.19,-2],[0,-.048,1.25,0],[.026,-.011,1.11,2],[0,0,1.08,0]],
 'dark+light': [[0,0,1.10,0],[.018,.006,1.13,2],[0,-.019,1.30,0],[-.020,.010,1.19,-2],[0,-.006,1.16,0],[0,0,1.10,0]],
 'dark+water': [[0,0,1.08,0],[-.041,0,1.13,-1],[.025,-.045,1.26,1],[.041,.023,1.16,2],[-.035,-.005,1.11,-1],[0,0,1.08,0]],
 'elec+elec': [[0,0,1.09,0],[.037,-.019,1.24,3],[-.029,.026,1.28,-3],[.040,-.030,1.25,4],[-.036,.029,1.16,-2],[0,0,1.09,0]],
 'elec+fire': [[0,0,1.09,0],[.020,-.033,1.15,3],[.035,-.016,1.27,5],[-.033,.009,1.28,-5],[.024,.021,1.16,2],[0,0,1.09,0]],
 'elec+grass': [[0,0,1.08,0],[0,.031,1.16,-2],[-.034,-.032,1.26,1],[.024,-.008,1.20,-3],[0,.022,1.13,1],[0,0,1.08,0]],
 'elec+light': [[0,0,1.09,0],[-.033,.011,1.13,-2],[.040,-.033,1.31,2],[-.032,.020,1.21,-2],[.028,-.004,1.15,1],[0,0,1.09,0]],
 'elec+water': [[0,0,1.08,0],[.007,.031,1.13,-1],[.030,-.040,1.23,2],[-.025,-.035,1.26,-2],[.014,.026,1.14,1],[0,0,1.08,0]],
 'fire+fire': [[0,0,1.07,0],[-.009,.029,1.13,-2],[0,-.043,1.34,0],[.017,-.027,1.18,2],[-.021,.027,1.12,-1],[0,0,1.07,0]],
 'fire+grass': [[0,0,1.08,0],[.038,.005,1.13,3],[.003,-.028,1.27,-1],[-.030,-.031,1.23,-3],[.026,.009,1.13,2],[0,0,1.08,0]],
 'fire+light': [[0,0,1.11,0],[0,.023,1.18,0],[0,-.035,1.31,0],[.014,-.011,1.26,1],[-.015,.017,1.18,-1],[0,0,1.11,0]],
 'fire+water': [[0,0,1.08,0],[-.035,.024,1.16,-3],[-.026,-.009,1.25,3],[.042,-.024,1.29,-2],[-.015,.025,1.13,1],[0,0,1.08,0]],
 'grass+grass': [[0,0,1.08,0],[0,.039,1.11,0],[0,-.018,1.20,0],[0,-.050,1.28,0],[.014,-.012,1.16,1],[0,0,1.08,0]],
 'grass+light': [[0,0,1.08,0],[-.027,.003,1.16,-2],[0,-.031,1.28,0],[.023,-.015,1.24,2],[0,.013,1.12,0],[0,0,1.08,0]],
 'grass+water': [[0,0,1.08,0],[.034,.018,1.13,2],[-.009,-.036,1.23,-2],[-.042,-.015,1.21,-2],[.026,.006,1.13,1],[0,0,1.08,0]],
 'light+light': [[0,0,1.09,0],[-.012,.014,1.17,-2],[0,-.030,1.33,0],[.013,-.013,1.25,2],[0,.016,1.12,0],[0,0,1.09,0]],
 'light+water': [[0,0,1.08,0],[.020,-.006,1.13,1],[-.014,-.025,1.23,-1],[0,-.030,1.27,0],[-.013,.019,1.14,0],[0,0,1.08,0]],
 'water+water': [[0,0,1.08,0],[-.039,.013,1.14,-3],[.024,-.037,1.24,2],[.039,.016,1.28,3],[-.028,.024,1.14,-2],[0,0,1.08,0]]
};
function camera(key,p,W,H){
 const track=motionTracks[key]||motionTracks['grass+light'];
 const progress=clamp(p);
 let i=0;while(i<beats.length-2&&progress>beats[i+1])i++;
 const k=ease((progress-beats[i])/(beats[i+1]-beats[i]));
 const at=n=>track[i][n]+(track[i+1][n]-track[i][n])*k;
 return {dx:at(0)*W,dy:at(1)*H,zoom:at(2),
   angle:at(3)*Math.PI/180,kind:styles[key]||'highfive',
   phase:progress};
}
// Follow BOTH cats' separately-authored routes with restrained calligraphic
// movement streaks. These are NOT pasted-on heads/paws: watercolor light
// traces behind full intact illustrated characters, like traditional animation
// action lines. Movement follows each of the 21 unique staging trajectories.
const tracePalette={
 dark:'#d3badb',elec:'#e9d8a6',fire:'#f1c0aa',
 grass:'#c7d8ba',light:'#f7e7bf',water:'#c4dfe0'
};
function footwork(ctx,W,H,p,key,tier=1){
 if(p<.12||p>.79)return;
 const pair=key.split('+'),from=Math.max(.12,p-.11);
 const col=[tracePalette[pair[0]]||'#e0d0df',tracePalette[pair[1]]||'#e0dfe8'];
 const enter=ease((p-.12)/.1),leave=1-ease((p-.57)/.22);
 const fade=enter*leave;
 if(fade<=0)return;
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
 for(let member=0;member<2;member++){
  const points=[];
  for(let j=0;j<=7;j++){
   const t=from+(p-from)*j/7;
   const a=pose(key,t,W,H,tier)[member];
   points.push([a.x,a.y-H*.17]);
  }
  const c=col[member];
  ctx.strokeStyle=c;ctx.shadowColor=c;ctx.shadowBlur=6;
  ctx.globalAlpha=.36*fade;ctx.lineWidth=Math.max(1.2,H*.009);
  ctx.beginPath();ctx.moveTo(...points[0]);
  for(let i=1;i<points.length;i++)ctx.lineTo(...points[i]);
  ctx.stroke();
  // The pair converge for a high-five; lightning duos blink at different
  // corners, while flower/water duos leave a rounded, flowing afterimage.
  const final=points[points.length-1],at=pose(key,p,W,H,tier)[member];
  ctx.globalAlpha=.66*fade;ctx.fillStyle=c;
  const size=Math.max(2,H*.010);
  const angle=(p*8+member*2.4),offset=Math.max(4,H*.042);
  ctx.save();ctx.translate(final[0],final[1]);ctx.rotate(angle);
  ctx.beginPath();ctx.moveTo(0,-size*1.7);ctx.lineTo(size*.8,0);
  ctx.lineTo(0,size*1.8);ctx.lineTo(-size*.8,0);ctx.closePath();ctx.fill();
  ctx.restore();
 }
 ctx.restore();
}
window.CatBondDuoDirector={
 keys:Object.keys(map),styles,map,pose,camera,motionTracks,footwork,accent,
 isUnique:()=>new Set(Object.values(map).map(v=>JSON.stringify(v[1]))).size===21
};
})();
