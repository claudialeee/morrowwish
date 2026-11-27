import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {gardenDiscovery} from './starbell-garden-qa.mjs';
const browser=await chromium.launch({headless:true}),origin=process.env.CAT_BOND_SMOKE_ORIGIN||'http://127.0.0.1:8765';
try{
 for(const [name,opts,lang] of [['wide',{viewport:{width:1280,height:800}},'en'],['portrait',{viewport:{width:390,height:844},isMobile:true,hasTouch:true},'zh']].filter(([p])=>!process.env.STARBELL_FOCUS_PROFILE||p===process.env.STARBELL_FOCUS_PROFILE)){
  const ctx=await browser.newContext(opts),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/cat-bond/?developer=1&qa=garden-camera&region=garden&reset=1&lang='+lang);
  await page.waitForFunction(()=>__game?.yardCameraAvailable?.()&&document.querySelector('#map-menu'));
  const snapshot=()=>page.evaluate(()=>{const g=__game,c=g._yardCamera,p=g.yardPlayer();return {z:c.z,tx:c.tx,ty:c.ty,follow:c.follow,manual:c.manual,W:g.W,H:g.H,x:p.x,y:p.y};});
  const menu=async id=>{await page.locator('#map-menu').click();await page.locator('[data-system="page-camera"]').click();await page.locator('[data-system="garden-camera-'+id+'"]').click();};
  await menu('overview');let c=await snapshot();assert.equal(c.z,1);assert.equal(c.tx,0);assert.equal(c.ty,0);
  const before=await snapshot();
  const box=await page.locator('#scene').boundingBox();
  if(name==='wide'){await page.mouse.move(box.x+box.width*.5,box.y+box.height*.48);await page.mouse.wheel(0,-500);}
  else{
    const dev=await ctx.newCDPSession(page);
    const x=box.x+box.width*.5,y=box.y+box.height*.48;
    await dev.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x-35,y,id:0},{x:x+35,y,id:1}]});
    await dev.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-85,y,id:0},{x:x+85,y,id:1}]});
    await dev.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  }
  await page.waitForFunction(()=>__game._yardCamera.z>1.5);
  c=await snapshot();assert.equal(c.follow,false);
  const x=box.x+box.width*.52,y=box.y+box.height*.48;
  if(name==='wide'){await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+45,y+40,{steps:5});await page.mouse.up();}
  else{const dev=await ctx.newCDPSession(page);await dev.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:0}]});await dev.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+45,y:y+40,id:0}]});await dev.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
  const pan=await snapshot();assert.ok(Math.abs(pan.tx-c.tx)+Math.abs(pan.ty-c.ty)>10,'drag pans');
  assert.ok(Math.hypot(pan.x-before.x,pan.y-before.y)<15,'drag/pinch must not trigger walking');
  const roundtrip=await page.evaluate(()=>{const g=__game,c=g._yardCamera,p=g.yardPlayer(),q=g.yardInputPoint(p.x*c.z+c.tx,p.y*c.z+c.ty);return Math.hypot(q.x-p.x,q.y-p.y)});
  assert.ok(roundtrip<1e-6,'hit-test inverse');
  await menu('out');assert.ok((await snapshot()).z<pan.z);
  await menu('in');assert.ok((await snapshot()).z>1);
  await menu('follow');assert.equal((await snapshot()).follow,true);
  await menu('overview');assert.equal((await snapshot()).z,1);
  await gardenDiscovery(page,'seed',{touch:name==='portrait'});
  assert.ok(await page.evaluate(()=>GardenExploration.read(State.S).seed),'discovery remains reachable');
  assert.deepEqual(errors,[]);console.log('GARDEN CAMERA PASS',name,lang);
  await ctx.close();
 }
}finally{await browser.close()}
