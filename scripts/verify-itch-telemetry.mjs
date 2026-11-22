import {chromium} from 'playwright';
import {randomUUID} from 'node:crypto';

const SLUGS=['cat-bond','pawsibly-innocent'];
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
let failures=0,verified=0;
for(const slug of SLUGS){
  const context=await browser.newContext({viewport:{width:1250,height:920},ignoreHTTPSErrors:false});
  const page=await context.newPage();
  const posted=[],consoleErrors=[],networkErrors=[],gameResponses=[];
  const probe='mw-qa-'+randomUUID();
  let intercepted=0;
  await context.route('**/api/session',async route=>{
    let payload=null;
    try{payload=JSON.parse(route.request().postData()||'{}');}catch{}
    posted.push({url:route.request().url(),method:route.request().method(),origin:route.request().headers()['origin']||'',data:payload&&{game:payload.game,kind:payload.kind,source:payload.source,referrer:payload.referrer,utmSource:payload.utmSource}});
    // Forward ONLY isolated diagnostic records, never user gameplay metrics.
    // The production API stores smokeProbe in category=diagnostic and
    // /api/diagnostic-check immediately deletes it after verification.
    if(payload?.game===slug&&['visit','session'].includes(payload.kind)){
      intercepted++;
      await route.continue({postData:JSON.stringify({...payload,viewId:probe,smokeProbe:'mw-qa-v1'})});
    } else await route.abort();
  });
  page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text().slice(0,300))});
  page.on('pageerror',e=>consoleErrors.push(e.message.slice(0,300)));
  page.on('requestfailed',r=>networkErrors.push({url:r.url().slice(0,180),failure:r.failure()?.errorText}));
  page.on('response',r=>{if(/morrowwish|itch\.zone/i.test(r.url()))gameResponses.push({status:r.status(),url:r.url().slice(0,240)})});
  try{
    const url='https://morrowwishgames.itch.io/'+slug;
    const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForTimeout(4000);
    let buttonInfo=await page.evaluate(()=>[...document.querySelectorAll('button,a,[role="button"],.game_frame,.embed_wrapper')].map(el=>({tag:el.tagName,selector:el.id?'#'+el.id:el.className?.toString()?.slice(0,90),text:el.textContent?.trim().slice(0,100)})).filter(x=>/play|run|frame|start|launch/i.test((x.text||'')+' '+(x.selector||''))).slice(0,20)).catch(()=>[]);
    const b=page.getByText(/run game|play game|launch game|play now|click to play/i).first();
    if(await b.count()&&await b.isVisible().catch(()=>false))await b.click({timeout:7000}).catch(()=>{});
    else for(const selector of ['#play_button','.game_frame .button','button:has-text("Run game")','.launch_btn','.start_game']){const x=page.locator(selector).first();if(await x.count()&&await x.isVisible().catch(()=>false)){await x.click({timeout:7000}).catch(()=>{});break}}
    await page.waitForTimeout(12000);
    const frames=page.frames().map(f=>({name:f.name(),url:f.url().slice(0,400)}));
    const fr=await page.evaluate(()=>[...document.querySelectorAll('iframe')].map(x=>({src:x.src,outer:x.outerHTML.slice(0,420)})));
    const expected='morrowwish.vercel.app/'+slug+'/';
    let diagnostic=null;
    if(response?.status()===200&&intercepted>0){
      try{const check=await fetch('https://morrowwish.vercel.app/api/diagnostic-check?probe='+encodeURIComponent(probe));diagnostic={status:check.status,...await check.json()};}
      catch(e){diagnostic={error:String(e).slice(0,200)};}
    }
    const outcome={slug,status:response?.status(),title:await page.title(),pageUrl:page.url(),buttonInfo,iframes:fr,frames,telemetryPostIntercepted:posted,diagnostic,gameResponses:gameResponses.slice(-15),consoleErrors:consoleErrors.slice(-15),networkErrors:networkErrors.slice(-15)};
    console.log('ITCH_QA '+JSON.stringify(outcome));
    if(response?.status()===429){console.warn('ITCH_QA_RATE_LIMITED '+slug);continue;}
    if(posted.some(p=>p.data?.kind==='visit'&&p.data?.game===slug&&['itch','itchio','itch.io'].includes(p.data.utmSource))&&diagnostic?.recorded===true&&diagnostic?.removed===true){verified++;}
    else{console.error('ITCH_QA_LIVE_EVENT_NOT_RECORDED '+slug);failures++;}
  }catch(e){console.error('ITCH_QA_EXCEPTION '+slug+' '+String(e.stack||e).slice(0,1000));failures++;}
  await context.close();
}
await browser.close();
console.log('ITCH_QA_SUMMARY '+JSON.stringify({verified,failures}));
process.exitCode=failures||verified===0?1:0;
