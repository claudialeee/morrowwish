/* Cat Bond — 21 distinct, BREED-MATCHED illustrated duo cut-ins.
 * No fixed-pair paintings or yard sprites are shown as combatants. The previous static
 * 8-painting strip repeated the same cats across 21 skills; replaced by
 * original, independent cinematic character portraits matching the selected breeds.
 * Art direction retains approved painterly scenery / palette and distinct
 * elemental attacks with a synchronized .78s strike beat.
 */
(function(){
'use strict';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
const colors={dark:'#d6b7f5',elec:'#dfbafa',fire:'#ffb98b',
 grass:'#9acfae',light:'#fff0c2',water:'#9ccfe9'};
const en=()=>window.MorrowwishI18n?.get?.()!=='zh';
function catLabel(cat){
 if(!cat)return '';
 if(window.State?.catName)try{return window.State.catName(cat)}catch{}
 return cat.nickname||window.GameData?.speciesById?.(cat.species)?.name||String(cat.species||'');
}
const stageNames={
 shadow:'Phantom Hunt',blink:'Lightning Teleport',ember:'Midnight Ember',
 vine:'Nightvine Ambush',eclipse:'Moon Guard Counter',mist:'Mist Pursuit',
 zigzag:'Lightning Zigzag',spiral:'Thunder Spiral Claw',snare:'Thunderroot Snare',
 dash:'Radiant Dash',bubbles:'Electric Bubble Dance',fireworks:'Twin Flame Burst',
 petals:'Blossomfire Leap',solar:'Sunflare Carousel',cannon:'Steam Cannon Launch',
 sprout:'Twinleaf Awakening',halo:'Dawn Halo Guard',blossom:'Spring Rain Bloom',
 stars:'Starbound Dance',lake:'Moonlit Lake Counter',tides:'Tidal Ribbon Chase'
};
function painterlyStage(ctx,W,H,p,key){
 const art=window.CatBondDuoArtwork;
 if(art?.backdrop)art.backdrop(ctx,W,H,p,key);
 else{const g=ctx.createLinearGradient(0,0,W,H);
   g.addColorStop(0,'#dfdafa');g.addColorStop(1,'#ebf5f7');
   ctx.fillStyle=g;ctx.fillRect(0,0,W,H)}
 // Layer translucent sky-light and a faint horizon, WITHOUT the original
 // fixed-breed cats; their faces would otherwise contradict the two starters.
 const glow=ctx.createRadialGradient(W*.53,H*.52,0,W*.53,H*.52,W*.65);
 glow.addColorStop(0,'#fffef777');glow.addColorStop(1,'#e9e6ff00');
 ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
 ctx.save();ctx.globalAlpha=.32;ctx.strokeStyle='#fffdf6';
 ctx.lineWidth=Math.max(1,H*.009);
 ctx.beginPath();ctx.ellipse(W*.5,H*.87,W*.36,H*.065,0,0,Math.PI*2);ctx.stroke();
 ctx.restore();
}
function flourish(ctx,W,H,p,key,tier,kind){
 const pair=key.split('+'),colA=colors[pair[0]]||'#dbcdfa';
 const colB=colors[pair[1]]||'#a8dce9';
 const hit=Math.max(0,1-Math.abs(p-.284)/.105);
 if(!hit)return;
 if(kind==='stars'||kind==='halo'||kind==='highfive'){
   // Genuine two-cat high five: raised front paws meet once, creating
   // one visible celebratory burst rather than identical claw streaks.
   ctx.save();ctx.globalAlpha=hit*.82;
   const cx=W*.5,cy=H*.50,r=H*(.055+.11*hit);
   ctx.shadowColor='#fff4ac';ctx.shadowBlur=20;
   ctx.fillStyle='#fff7cc';ctx.beginPath();ctx.arc(cx,cy,r*.34,0,Math.PI*2);ctx.fill();
   ctx.strokeStyle=kind==='stars'?'#f9e2fd':'#eafed1';ctx.lineWidth=5;
   for(let n=0;n<8;n++){
     const a=n*Math.PI/4;
     ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*r*.55,cy+Math.sin(a)*r*.55);
     ctx.lineTo(cx+Math.cos(a)*r*1.15,cy+Math.sin(a)*r*1.15);ctx.stroke();
   }
   ctx.restore();return;
 }
 const cx=W*.505,cy=H*.58,rad=Math.min(W,H)*(.11+hit*.11);
 ctx.save();ctx.globalAlpha=hit*.72;
 ctx.shadowColor=colA;ctx.shadowBlur=Math.min(22,H*.05);
 // White core at the exact strike, only ~100ms wide, so cat faces remain
 // readable throughout the action. One claw at tier 1, crossed at tier 2.
 for(let i=0;i<(tier>=3?3:tier>=2?2:1);i++){
  const direction=i%2===0?1:-1;
  const a=(direction*.54)+(i===2?1.04:0);
  ctx.save();ctx.translate(cx,cy);ctx.rotate(a);
  ctx.strokeStyle=i%2?colB:colA;
  ctx.lineWidth=Math.max(3,H*.018);ctx.lineCap='round';
  for(let k=-1;k<=1;k++){
   ctx.beginPath();ctx.moveTo(-rad*.85,k*rad*.30-rad*.14);
   ctx.quadraticCurveTo(0,k*rad*.27,rad*.9,k*rad*.30+rad*.13);
   ctx.stroke();
  }
  ctx.restore();
 }
 if(tier>=3){
  ctx.strokeStyle='#fff7cd';ctx.lineWidth=5;
  ctx.beginPath();ctx.arc(cx,cy,rad*(1.1+(1-hit)*.8),0,Math.PI*2);ctx.stroke();
 }
 ctx.restore();
}
function motionRibbons(ctx,W,H,p,key,tier,positions){
 // Ribbons follow the cats' actual trajectories, not static drifting cards.
 if(p<.13||p>.73)return;
 const S=window.CatBondDuoDirector;
 if(!S)return;
 const trail=[.09,.15,.21,.27].filter(t=>t<p);
 const c=key.split('+'),cs=c.map(el=>colors[el]||'#bfb5e8');
 ctx.save();ctx.globalCompositeOperation='screen';ctx.lineCap='round';
 for(let i=0;i<2;i++){
  const trailPoints=trail.map(t=>S.pose(key,t,W,H)[i]);
  trailPoints.push(positions[i]);
  ctx.beginPath();trailPoints.forEach((s,j)=>{if(j)ctx.lineTo(s.x,s.y-H*.09);
    else ctx.moveTo(s.x,s.y-H*.09)});
  ctx.globalAlpha=.20;ctx.strokeStyle=cs[i];ctx.lineWidth=Math.max(9,H*.045);
  ctx.shadowColor=cs[i];ctx.shadowBlur=15;ctx.stroke();
  ctx.globalAlpha=.65;ctx.strokeStyle='#fffdf1';
  ctx.lineWidth=Math.max(2,H*.007);ctx.shadowBlur=0;ctx.stroke();
 }
 ctx.restore();
}
function render(ctx,W,H,seq,lookup){
 if(!seq||seq.t<=0)return false;
 const Director=window.CatBondDuoDirector;
 const key=seq.elements&&Director?.styles?.[seq.elements]?seq.elements:'elec+fire';
 const age=seq.max-seq.t, p=clamp(age/(seq.max||2.75));
 const tier=clamp(Number(seq.tier)||1,1,3);
 const opacity=smooth(age/.13)*(1-smooth((age-2.50)/.24));
 if(opacity<=0)return true;
 // A 16:9 animated watercolor cut-in; fits portrait and short landscape.
 const stageW=Math.min(W*.965,H*.91*650/366),
 stageH=stageW*366/650,stageX=(W-stageW)/2,stageY=(H-stageH)/2;
 const duo=(seq.catUids||[]).map(uid=>lookup?.(uid));
 const pair=key.split('+');
 ctx.save();ctx.globalAlpha=opacity;
 ctx.beginPath();ctx.roundRect(stageX,stageY,stageW,stageH,Math.min(18,stageW*.035));
 ctx.clip();
 ctx.save();ctx.translate(stageX,stageY);
 painterlyStage(ctx,stageW,stageH,p,key);
 // A distinct elemental tableau for all 21 combinations (not re-colored
 // copies of one scene); large motifs remain under the cats, not over faces.
 if(Director)Director.accent(ctx,stageW,stageH,p,key,tier);
 const poses=Director?.pose(key,p,stageW,stageH)||[
  {x:stageW*.26,y:stageH*.72,angle:0,size:1,opacity:1,phase:p},
  {x:stageW*.74,y:stageH*.72,angle:0,size:1,opacity:1,phase:p}
 ];
 motionRibbons(ctx,stageW,stageH,p,key,tier,poses);
 // Each selected cat retains its species-specific watercolor fur, ears,
 // silhouette and markings. Never draw the eight fixed cats from the old sheet.
 // Make the illustrated cats the main subjects (not 60px stickers in an
 // otherwise empty scene). Keep stage-relative limits for landscape/portrait.
 const size=Math.min(302,stageH*.67,stageW*.35);
 for(let i=0;i<2;i++){
  const actor=duo[i]||null,pose=poses[i],color=colors[pair[i]]||'#e5c7ff';
  if(!actor||!window.CatBondDuoArtwork?.drawKitten)continue;
  ctx.save();ctx.globalAlpha=pose.opacity;
  // Rotate the entire coherent illustrated cat: never disassemble legs/head.
  // Keep complete ears and paws in frame even at high leap moments. The
  // horizontal duo choreography remains unchanged, only vertical safety.
  const groundedY=Math.max(stageH*.14+size*.91,Math.min(stageH*.87,pose.y));
  ctx.translate(pose.x,groundedY);ctx.rotate(pose.angle);
  window.CatBondDuoArtwork.drawKitten(ctx,0,0,size*pose.size,actor,i===1,p,
     Director?.styles?.[key]||'dash',color);
  ctx.restore();
 }
 flourish(ctx,stageW,stageH,p,key,tier,Director?.styles?.[key]);
 // Accessible nameplate, protected from bright effects and outside cat faces.
 const panelH=Math.min(72,Math.max(43,stageH*.19));
 const overlay=ctx.createLinearGradient(0,stageH-panelH,0,stageH);
 overlay.addColorStop(0,'#1b254000');overlay.addColorStop(1,'#1e2648e8');
 ctx.fillStyle=overlay;ctx.fillRect(0,stageH-panelH,stageW,panelH);
 ctx.textAlign='center';ctx.textBaseline='alphabetic';
 const titleSize=clamp(stageW*.040,12,25);
 ctx.shadowColor='#14203a';ctx.shadowBlur=4;
 ctx.fillStyle='#fffdf9';ctx.font='900 '+Math.round(titleSize)+'px system-ui,sans-serif';
 ctx.fillText(seq.name||window.CatBondDuoSignatures?.get?.(key)?.label||
   (en()?'Duo Special':'双猫合击'),stageW*.5,stageH-panelH*.40,stageW*.87);
 ctx.shadowBlur=0;
 ctx.font='700 '+Math.round(clamp(stageW*.019,10,13))+'px system-ui,sans-serif';
 ctx.fillStyle='#f6ebda';
 if(duo[0]&&duo[1])ctx.fillText(catLabel(duo[0])+' × '+catLabel(duo[1]),
   stageW*.5,stageH-7,stageW*.88);
 ctx.restore();
 ctx.restore();
 return true;
}
window.CatBondDuoHero={
 draw:render,scenes:Object.fromEntries(Object.entries(window.CatBondDuoDirector?.styles||{}).map(([k,v])=>[k,v])),
 sceneKeys:window.CatBondDuoDirector?.keys||[],
 get assetReady(){return !!(window.CatBondDuoArtwork?.ready&&window.CatBondDuoArtwork?.backdropReady)},
 get assetSource(){return 'independent-cinematic-breed-portraits'},
 assetCount:21,signatureCount:21,breedCount:25,
};
})();
