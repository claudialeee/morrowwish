// Finish existing Morrow Wish CrazyGames drafts; never create a duplicate game.
// Uses official live iframe URLs, authentic game art and actual captured gameplay.
// All actions are on the authorized studio account. On any changing form, stop
// and record what is missing; never claim review submission before verified.
import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';
import {publishedGames} from './discovery.mjs';

const ROOT='https://developer.crazygames.com';
const email=process.env.CRAZYGAMES_STUDIO_EMAIL||'';
const password=process.env.CRAZYGAMES_STUDIO_PASSWORD||'';
const ledger=JSON.parse(fs.readFileSync('promotion/ledger.json','utf8'));
const catalog=publishedGames();
const targetSlugs=(process.env.CRAZYGAMES_TARGET_SLUGS||'pawsibly-innocent,elsewhere,tiny-town,parcel-panic,pocket-aquarium,flip-dash').split(',').filter(Boolean);
const file='.check/crazygames/submission-results.json';
const copy={
 'pawsibly-innocent':{category:'Adventure',tags:['Cat','Cats','Animals','Cute','Adventure','Cozy'],title:'Pawsibly Innocent!',description:'Play as a mischievous little cat exploring eight illustrated rooms. Steal three fish, find souvenirs, and outsmart the humans in a cozy browser adventure.',controls:'Explore the rooms with keyboard and pointer controls. Interact with objects, use yarn to distract humans, collect three fish and escape unnoticed.'},
 'elsewhere':{category:'Adventure',tags:['Story','Choices','Adventure','Narrative','Interactive Fiction','1 Player','2D','Brain'],title:'Elsewhere',description:'Live another life in a choice-driven interactive story. Explore illustrated alternate lives, face personal decisions, and discover where each path leads.',controls:'Read each scene and click one of the choices to shape your story and discover different endings.'},
 'tiny-town':{category:'Simulation',tags:['City Builder','City Building','Cozy','Management','Simulation','Strategy'],title:'No More Mondays: Tiny Town',description:'AI does all the work, so humans have unlimited free time. Build a small town, meet neighbors and discover how people choose to live in an eight-turn cozy strategy game.',controls:'Choose a venue and place it on the town map. Continue through the weeks and connect neighbors to unlock possibilities.'},
 'parcel-panic':{category:'Puzzle',tags:['Sorting','Puzzle','Arcade','Casual','Skill'],title:'Parcel Panic',description:'A quick, colorful parcel-sorting challenge. Match each package to the correct delivery lane, build streaks and beat your best score.',controls:'Click the matching delivery lane or press 1, 2, or 3 to sort the next parcel.'},
 'pocket-aquarium':{category:'Puzzle',tags:['Fish','Aquarium','Casual','Cozy','Puzzle'],title:'Pocket Aquarium',description:'Feed hungry fish in a tiny aquarium. Match the right food color, time your drops and see how many fish you can care for in sixty seconds.',controls:'Select the matching food color and feed each fish before its timer runs out. Keep the water clean.'},
 'flip-dash':{category:'Arcade',tags:['Runner','Platform','Skill','Arcade','Jumping'],title:'Flip Dash',description:'A one-button gravity runner. Flip between floor and ceiling, avoid obstacles and chase a new high score in a quick arcade challenge.',controls:'Press Space or tap to flip gravity and avoid the next obstacle. Retry instantly to beat your previous run.'}
};
const time=()=>new Date().toISOString();
const sleep=n=>new Promise(r=>setTimeout(r,n));
const mask=(x,n=1900)=>String(x||'').replace(/\S+@\S+/g,'[EMAIL]').replace(/https?:\/\/\S+/g,'[URL]').slice(-n);
const results=[];
const save=()=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify({at:time(),results},null,2)+'\n');};
async function body(page){return page.locator('body').innerText().catch(()=>'');}
async function button(page,text){
 const el=page.getByRole('button',{name:text,exact:true}).first();
 return await el.count()?el:null;
}
async function click(page,text){
 const el=await button(page,text);
 if(!el||!(await el.isEnabled().catch(()=>false)))return false;
 await el.evaluate(e=>e.click());
 await sleep(1000);return true;
}
async function authenticated(page){
 if(!email||!password)throw Error('Morrow Wish CrazyGames studio password secret unavailable');
 for(let attempt=0;attempt<2;attempt++){
  await page.goto(ROOT+'/login',{waitUntil:'domcontentloaded',timeout:35000});
  await page.locator('input[type=password]').first().waitFor({state:'visible',timeout:14000}).catch(()=>{});
  const em=page.locator('input[placeholder*="@"],input[type=email],input[type=text]').first();
  const pw=page.locator('input[type=password]').first();
  if(!await em.isVisible().catch(()=>false)||!await pw.isVisible().catch(()=>false))continue;
  await em.fill(email);await pw.fill(password);
  const sign=page.getByRole('button',{name:/^log ?in$/i}).first();
  await sign.click({timeout:7000}).catch(()=>{});
  await page.waitForURL(u=>!u.pathname.endsWith('/login'),{timeout:15000}).catch(()=>{});
  await sleep(1200);
  if(!page.url().endsWith('/login')){
    await page.goto(ROOT+'/games',{waitUntil:'domcontentloaded',timeout:32000});
    await page.getByText('My Games',{exact:true}).first().waitFor({timeout:12000}).catch(()=>{});
    await sleep(1000);
    if(!new URL(page.url()).pathname.endsWith('/login'))return true;
  }
  const txt=(await body(page)).toLowerCase();
  if(/captcha|account locked|too many attempts|verify your account/.test(txt))throw Error('CrazyGames login requires human verification');
 }
 return false;
}
async function readStage(p){return {path:new URL(p.url()).pathname,txt:mask(await body(p),2350),buttons:(await p.locator('button:visible').allTextContents().catch(()=>[])).map(x=>x.trim()).filter(Boolean).slice(-20)};}
async function toDetails(page,ctx,id,log){
 await page.goto(ROOT+'/games/'+id,{waitUntil:'domcontentloaded',timeout:35000});
 await page.getByText(/Upload your game|Game details|QA Results/i).first().waitFor({timeout:15000}).catch(()=>{});
 await sleep(1300);
 let text=await body(page);
 if(text.includes('Game details') && text.includes('Cover images'))return page;
 if(!/Upload your game|Game name/.test(text))throw Error('Draft editing view unavailable: '+mask(text,250));
 const go=await button(page,'Go to QA');
 if(go&&await go.isEnabled().catch(()=>false)){
    log.push('go-to-qa');
    await go.evaluate(e=>e.click());await sleep(1800);
    const preview=ctx.pages().find(p=>p.url().startsWith('https://www.crazygames.com/preview/'));
    if(!preview)throw Error('CrazyGames preview missing after Go to QA');
    await preview.getByRole('button',{name:'Continue',exact:true}).first().waitFor({timeout:14000}).catch(()=>{});
    if(!await click(preview,'Continue'))throw Error('CrazyGames preview Continue unavailable');
    const target=ROOT+'/qa-continue/'+id;
    let qa=ctx.pages().find(p=>p.url().startsWith(target));
    if(!qa){
      await sleep(2000);
      qa=ctx.pages().find(p=>p.url().startsWith(target));
    }
    if(!qa)throw Error('QA Continue did not open developer results page');
    await qa.getByText('QA Results',{exact:true}).first().waitFor({timeout:18000}).catch(()=>{});
    text=await body(qa);
    if(text.includes('QA Results')){
       const yes=qa.getByText('Yes',{exact:true}),no=qa.getByText('No',{exact:true});
       if(await yes.count()!==6||await no.count()!==6)throw Error('QA result form structure changed');
       // The final "No" is truthful: these games do not feature an in-game T&C or Privacy link.
       for(let i=0;i<5;i++)await yes.nth(i).evaluate(e=>(e.closest('button')||e.closest('label')||e).click());
       await no.nth(5).evaluate(e=>(e.closest('button')||e.closest('label')||e).click());
       const acknowledge=qa.locator('input[type=checkbox]').first();
       await acknowledge.evaluate(el=>{if(!el.checked)el.click()});
       if(!await click(qa,'Continue'))throw Error('QA checklist Continue disabled after truthful answers');
       log.push('QA-checklist-confirmed');
    }
    await qa.getByText('Game details',{exact:true}).first().waitFor({timeout:15000}).catch(()=>{});
    await qa.getByText('Cover images').first().waitFor({timeout:15000}).catch(()=>{});
    if((await body(qa)).includes('Cover images'))return qa;
    throw Error('CrazyGames did not load metadata form after QA');
 }
 const continueBtn=await button(page,'Continue');
 if(continueBtn&&await continueBtn.isEnabled().catch(()=>false)){
   log.push('resume-existing-QA');
   await click(page,'Continue');
   await page.getByText('Cover images').first().waitFor({timeout:17000}).catch(()=>{});
   if((await body(page)).includes('Cover images'))return page;
 }
 // Some drafts may already resume directly to third step.
 await sleep(900);
 if((await body(page)).includes('Cover images'))return page;
 throw Error('Draft cannot advance to Details; buttons '+JSON.stringify((await readStage(page)).buttons));
}
async function selectCombo(page,i,desired){
 const combo=page.getByRole('combobox').nth(i);
 if(!await combo.count())throw Error('Missing combobox index '+i);
 const current=(await combo.innerText()).trim();
 if(current && current!=='​' && current!=='Select')return {selected:current,alreadySet:true};
 // MUI multiselect controls require a DOM click rather than physical mouse
 // clicks in the headless runner (verified on the portal's real Tags menu).
 let vals=[];
 for(let attempt=0;attempt<3 && !vals.length;attempt++){
   if(attempt===0)await combo.click({timeout:5000}).catch(()=>{});
   else if(attempt===1)await combo.evaluate(el=>el.click()).catch(()=>{});
   else{
     const box=await combo.boundingBox();
     if(box)await page.mouse.click(box.x+box.width/2,box.y+box.height/2).catch(()=>{});
   }
   await sleep(750);
   vals=(await page.getByRole('option').allTextContents().catch(()=>[])).map(v=>v.trim()).filter(Boolean);
 }
 if(!vals.length)throw Error('No options for dropdown '+i+'; combo: '+mask(await combo.evaluate(x=>x.outerHTML).catch(()=>''),180));
 let chosen=desired.find(x=>vals.some(v=>v.toLowerCase()===x.toLowerCase()));
 if(!chosen)chosen=desired.find(x=>vals.some(v=>v.toLowerCase().includes(x.toLowerCase())));
 const actual=chosen?vals.find(v=>v.toLowerCase()===chosen.toLowerCase())||vals.find(v=>v.toLowerCase().includes(chosen.toLowerCase())):null;
 if(!actual){await page.keyboard.press('Escape');return {selected:null,available:vals.slice(0,26)};}
 await page.getByRole('option',{name:actual,exact:true}).first().click({timeout:7000});
 if(i>0)await page.keyboard.press('Escape').catch(()=>{});
 await sleep(200);
 return {selected:actual,alreadySet:false};
}
async function details(page,slug,rec){
 const game=copy[slug],dir='public/promo/'+slug;
 for(const f of ['cover-landscape.png','cover-portrait.png','cover-square.png','real-gameplay-landscape.mp4','real-gameplay-portrait.mp4']){
   if(!fs.existsSync(path.join(dir,f)))throw Error('Real marketing media missing '+f);
 }
 rec.category=await selectCombo(page,0,[game.category]);
 rec.tag=await selectCombo(page,1,game.tags);
 rec.tools=await selectCombo(page,2,['JavaScript','HTML5','Custom JavaScript','Custom engine','Other','Custom','Web','Code']);
 if(!rec.tag.selected||!rec.tools.selected)throw Error('Category/tag/tool options missing; need exact official menu values');
 const editors=page.locator('.ql-editor[contenteditable=true]');
 if(await editors.count()!==2)throw Error('Expected two Quill editors for description and controls');
 await editors.nth(0).fill(game.description);
 await editors.nth(1).fill(game.controls);
 const uploads=['cover-landscape.png','cover-portrait.png','cover-square.png','real-gameplay-landscape.mp4','real-gameplay-portrait.mp4'];
 if(await page.locator('input[type=file]').count()!==5)throw Error('Expected three cover and two gameplay video upload controls');
 rec.uploaded=[];
 for(let i=0;i<uploads.length;i++){
   await page.locator('input[type=file]').nth(i).setInputFiles(path.join(dir,uploads[i]));
   rec.uploaded.push(uploads[i]);await sleep(900);
 }
 const full=page.getByText('The game works well in fullscreen',{exact:true}).first();
 if(await full.count())await full.evaluate(el=>(el.closest('label')||el).click());
 // Videos are converted server-side and the button changes its label while saving.
 // Wait for actual completed conversion instead of treating an inactive button as a failure.
 let more=null;
 for(let attempt=0;attempt<75;attempt++){
   await sleep(2000);
   more=page.getByRole('button',{name:/^(save and )?continue to last step$/i}).first();
   if(await more.count() && await more.isEnabled().catch(()=>false)){
     const b=await body(page);
     if(!/converting\.\.\.|processing media/i.test(b))break;
   }
   if(attempt%10===0)rec.mediaConversionCheck={at:time(),bodyTail:mask(await body(page),480),buttonText:await more.innerText().catch(()=>'')};
 }
 rec.beforeFinal=await readStage(page);
 if(!more||!(await more.count())||!(await more.isEnabled().catch(()=>false))){
   rec.formAlerts=(await page.locator('[role=alert],.MuiFormHelperText-root').allTextContents().catch(()=>[])).slice(0,18);
   throw Error('Details cannot Continue to last step after uploading media; inspect validation');
 }
 // MUI snackbar notifications overlap the button on headless Chrome, even after
  // all validation and media conversion succeed. Invoke the React button's native
  // click handler directly to avoid interception by transient toast overlays.
  await more.evaluate(el=>el.click()).catch(e=>{throw Error('Details save failed: '+mask(e.message,180))});
  await sleep(900);
  rec.validationDiagnostics=await page.evaluate(()=>{
    const fields=[...document.querySelectorAll('input,textarea,[role="combobox"],[contenteditable="true"]')];
    const errors=[...document.querySelectorAll('[aria-invalid="true"], .Mui-error, .MuiFormHelperText-root, [role="alert"], .MuiSnackbar-root')];
    return {
      fields:fields.map((el,i)=>({i,tag:el.tagName,role:el.getAttribute('role'),type:el.getAttribute('type'),name:el.name,id:el.id,required:el.required,ariaRequired:el.getAttribute('aria-required'),invalid:el.getAttribute('aria-invalid'),value:el.type==='checkbox'?el.checked:(el.innerText||el.value||'').slice(0,90),label:(el.closest('.MuiFormControl-root,.MuiFormGroup-root')?.innerText||'').slice(0,125)})).slice(0,75),
      errors:errors.map(el=>({className:el.className?.toString().slice(0,100),text:(el.innerText||el.textContent||'').trim().slice(0,250)})).filter(x=>x.text).slice(0,35),
      formErrors:[...document.querySelectorAll('form')].map(f=>({invalidCount:f.querySelectorAll(':invalid').length,html:f.outerHTML.slice(0,200)})).slice(0,3)
    };
  });
 await page.getByText(/submit|review|terms/i).first().waitFor({timeout:14000}).catch(()=>{});
 await sleep(2200);
 rec.finalStep=await readStage(page);
 return page;
}
async function finalSubmit(page,id,rec){
 const stage=await readStage(page);
 rec.finalStep=stage;
 if(stage.txt.toLowerCase().includes('billing setup required')||stage.txt.toLowerCase().includes('complete payment setup')){
   rec.status='requires-billing-onboarding';return;
 }
 // Do not consent to any unreviewed purchase or paid service. Rights ownership was
 // expressly confirmed by the studio operator.
 const confirm=page.locator('input[type=checkbox]');
 rec.finalCheckboxCount=await confirm.count();
 const pageText=await body(page);
 if(rec.finalCheckboxCount){
   const descriptions=await confirm.evaluateAll(xs=>xs.map(el=>(el.closest('label')?.innerText||el.parentElement?.parentElement?.innerText||'').trim().slice(0,160)));
   rec.finalCheckboxLabels=descriptions;
   for(let i=0;i<descriptions.length;i++){
     const s=descriptions[i].toLowerCase();
     if(/rights|terms of service|review|agree|acknowledge|confirm/.test(s)&&!(/pay|purchase|subscribe|billing|marketing opt.in/.test(s))){
       await confirm.nth(i).evaluate(el=>{if(!el.checked)el.click()});
     }
   }
 }
 const btns=page.getByRole('button',{name:/^submit(?: game)?$|^submit for review$|^send to review$|^send to qa$/i});
 rec.submitButtonCount=await btns.count();
 const submit=btns.last();
 if(!(await submit.count())||!(await submit.isEnabled().catch(()=>false))){
    rec.status='final-step-incomplete';return;
 }
 await submit.click({timeout:14000}).catch(e=>{throw Error('Final submit click failed: '+mask(e.message,250))});
 await sleep(2400);
 const confirmation=page.getByRole('button',{name:/^confirm(?: submission)?$|^yes,? submit$|^submit game$/i});
 if(await confirmation.count() && await confirmation.last().isVisible().catch(()=>false)){
   await confirmation.last().click({timeout:7000});
   await sleep(2600);
 }
 rec.submitResult=await readStage(page);
 await page.goto(ROOT+'/games',{waitUntil:'domcontentloaded',timeout:30000});
 await page.getByText(copy[rec.slug].title,{exact:true}).first().waitFor({timeout:12000}).catch(()=>{});
 const row=page.getByText(copy[rec.slug].title,{exact:true}).first();
 rec.adminRowText=await row.evaluate(el=>(el.closest('tr')||el.closest('[role=row]')||el.parentElement?.parentElement)?.innerText?.slice(0,360)||'').catch(()=>'');
 const v=rec.adminRowText.toLowerCase()+' '+rec.submitResult.txt.toLowerCase();
 if(/submitted|in review|pending review|pending approval|waiting for approval|awaiting review|qa review/.test(v)&&!/\bdraft\b/.test(rec.adminRowText.toLowerCase())){
   rec.status='submitted-confirmed';rec.platformId=id;
 }else rec.status='submitted-no-receipt-requires-verification';
}
async function main(){
 if(!password||!email)throw Error('Missing authorized studio CrazyGames email/password');
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try {
  const ctx=await browser.newContext();
  await ctx.route('**/*',route=>{
   let u;try{u=new URL(route.request().url());}catch{return route.continue();}
   if(u.hostname==='morrowwish.vercel.app'&&/^\/api\/(?:session|event|play|analytics|elsewhere-collect)/.test(u.pathname))
     return route.abort('blockedbyclient');
   return route.continue();
  });
  const page=await ctx.newPage();
  if(!await authenticated(page))throw Error('CrazyGames studio email/password login did not reach developer portal');
  for(const slug of targetSlugs){
    const rec={slug,at:time(),status:'draft'};results.push(rec);save();
    try {
      const row=ledger.games.find(x=>x.slug===slug),g=catalog.find(x=>x.slug===slug),title=copy[slug];
      if(!row||!g||!title||row.officialUrl!==g.url)throw Error('Official catalog and release ledger mismatch');
      const c=row.channels.crazygames,ref=c.draftPreviewId;
      if(c.status!=='draft'||!ref)throw Error('No existing verified Draft ID; skip to prevent duplicate');
      const url=new URL(c.trackedUrl);
      if(url.origin!=='https://morrowwish.vercel.app'||url.pathname!==new URL(g.url).pathname||url.searchParams.get('utm_source')!=='crazygames'||url.searchParams.get('utm_medium')!=='portal')
        throw Error('Iframe URL/UTM does not match canonical catalog');
      rec.platformDraftId=ref;rec.stages=[];
      const current=await toDetails(page,ctx,ref,rec.stages);rec.status='details-open';save();
      await details(current,slug,rec);rec.status='ready-for-final-submit';save();
      await finalSubmit(current,ref,rec);
       if(rec.status==='final-step-incomplete'){console.log('CRAZYGAMES_DIAGNOSTIC_FIRST_FAILURE '+JSON.stringify(rec.validationDiagnostics)); break;}
    }catch(e){rec.status='blocked';rec.reason=mask(e.message,270);}
    finally{rec.finishedAt=time();save();console.log(JSON.stringify({slug,status:rec.status,platformId:rec.platformId||null,reason:rec.reason||null,stages:rec.stages}));}
  }
  await ctx.close();
 }finally {await browser.close();}
}
try{await main();}catch(e){results.push({status:'critical-blocker',reason:mask(e.message,320)});save();console.log('Submission workflow blocked: '+mask(e.message,320));}
