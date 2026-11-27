export async function gardenDiscovery(page,id,{touch=false}={}){
 const marker=page.locator('[data-garden-explore="'+id+'"]');
 // The draw loop sets the world point on its first eligible frame after dialogue closes.
 // Wait for that frame instead of treating a still-hidden newly unlocked chart as missing.
 await page.waitForFunction(id=>{const b=document.querySelector('[data-garden-explore="'+id+'"]');return !!(b?._gardenWorldPoint&&window.__game?.yardPlayer?.()&&!document.querySelector('.res-host'));},id,{timeout:15000});
 for(let i=0;i<45&&!await marker.isVisible();i++){
  const d=await marker.evaluate(b=>{const g=window.__game,p=g?.yardPlayer?.(),t=b._gardenWorldPoint;return p&&t?{dx:(t.x-p.x)/g.W,dy:(t.y-p.y)/g.H}:null});
  if(!d)throw Error('Missing discovery route: '+id);
  const key=Math.abs(d.dx)>Math.abs(d.dy)?(d.dx>0?'ArrowRight':'ArrowLeft'):(d.dy>0?'ArrowDown':'ArrowUp');
  await page.keyboard.down(key);try{await page.waitForTimeout(180);}finally{await page.keyboard.up(key);}
 }
 await marker.waitFor({state:'visible',timeout:5000});
 if(touch)await marker.tap();else await marker.click();
 const predicates={'chart-0':s=>s.parts.includes(0),'chart-1':s=>s.parts.includes(1),'chart-echo':s=>s.chartEcho,seed:s=>s.seed};
 if(predicates[id])await page.waitForFunction(id=>{const s=GardenExploration.read(State.S);return id==='seed'?s.seed:id==='chart-echo'?s.chartEcho:s.parts.includes(Number(id.at(-1)));},id,{timeout:15000});
 if(id==='door')await page.waitForFunction(()=>!__game._yardArrival,null,{timeout:15000});
}
