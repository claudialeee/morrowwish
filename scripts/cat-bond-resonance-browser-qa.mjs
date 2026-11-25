import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
const out='artifacts/cat-bond-resonance';
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const errors=[];
for(const viewport of [{name:'desktop',width:1440,height:1000},{name:'mobile',width:390,height:844}]){
 const page=await browser.newPage({viewport:{width:viewport.width,height:viewport.height},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push(viewport.name+': '+e.message));
 await page.goto('http://127.0.0.1:8765/cat-bond/?resonance-dev=1',{waitUntil:'networkidle'});
 await page.waitForFunction(()=>window.__game&&window.WorldMap&&window.CatBondResonanceArt);
 await page.evaluate(()=>{
   window.__CAT_BOND_STARTED__=true;
   const intro=document.getElementById('intro');if(intro){intro.style.display='none';intro.hidden=true;}
   window.__game.start();
   window.__game.openWorldMap();
 });
 await page.waitForSelector('.lr-world:not([hidden]) .lr-atlas');
 await page.waitForFunction(()=>{
   const card=document.querySelector('.lr-region-card');
   const canvas=document.querySelector('.lr-atlas');
   return card&&canvas&&canvas.width>0&&getComputedStyle(card).backgroundImage.includes('resonance-scenes.svg');
 });
 await page.waitForTimeout(350);
 const atlas=await page.locator('.lr-atlas').evaluate(c=>{
   const ctx=c.getContext('2d'),d=ctx.getImageData(0,0,c.width,c.height).data;
   const seen=new Set();for(let i=0;i<d.length;i+=Math.max(4,Math.floor(d.length/5000))*4)seen.add(d[i]+','+d[i+1]+','+d[i+2]);
   return {width:c.width,height:c.height,uniqueSampledColors:seen.size};
 });
 if(atlas.uniqueSampledColors<8)throw new Error(viewport.name+': atlas canvas is blank or missing original art '+JSON.stringify(atlas));
 const cards=await page.locator('.lr-region-card').count();
 if(cards!==6)throw new Error(viewport.name+': expected six region art cards, got '+cards);
 await page.screenshot({path:path.join(out,viewport.name+'-atlas.png'),fullPage:false});
 await page.locator('.lr-region-card:not([disabled])').first().click();
 await page.waitForTimeout(500);
 const afterRegionClick=await page.evaluate(()=>({mode:window.WorldMap?.mode,currentRegion:window.WorldMap?.currentRegion,unlocked:window.WorldMap?.REGIONS?.filter(r=>window.WorldMap.isUnlocked(r.id)).map(r=>r.id),hero:!!document.querySelector(".lr-region-hero"),state:window.State?.S?.lastResonanceWorld?.scene}));
 console.log(viewport.name+" region click "+JSON.stringify(afterRegionClick));
 if(!afterRegionClick.hero){const first=window.WorldMap?.REGIONS?.find(r=>window.WorldMap.isUnlocked(r.id));if(first)await page.evaluate(id=>window.WorldMap.enterRegion(id),first.id);}
 await page.waitForSelector('.lr-region-hero');
 await page.waitForSelector('.lr-npc-card');
 const npcPortrait=await page.locator('.lr-npc-card .lr-portrait').first().evaluate(el=>getComputedStyle(el).backgroundImage);
 if(!npcPortrait.includes('resonance-portraits.svg'))throw new Error(viewport.name+': original NPC portrait sheet not connected');
 await page.screenshot({path:path.join(out,viewport.name+'-region.png'),fullPage:false});
 await page.locator('.lr-npc-card').first().click();
 await page.waitForSelector('.lr-dialog');
 await page.waitForSelector('.lr-dialog .lr-portrait');
 await page.screenshot({path:path.join(out,viewport.name+'-dialogue.png'),fullPage:false});
 await page.close();
}
await browser.close();
if(errors.length)throw new Error('Browser runtime errors: '+errors.join(' | '));
console.log(JSON.stringify({passed:true,viewports:2,atlas:'original SVG art rendered',regions:6,npcPortraits:'connected',dialogue:'rendered',screenshots:out}));
