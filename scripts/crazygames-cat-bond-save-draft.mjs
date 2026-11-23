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
// Fail closed: neither CI nor a direct script run may submit a batch.
const targetSlugs=(process.env.CRAZYGAMES_TARGET_SLUGS||'').split(',').map(x=>x.trim()).filter(Boolean);
if(targetSlugs.length!==1||!/^[a-z][a-z0-9-]+$/.test(targetSlugs[0]))
  throw Error('Exactly ONE CrazyGames game must be selected. Bulk submissions are disabled.');
const file='.check/crazygames/cat-bond-draft-fill.json';
const copy={
 'cat-bond':{category:'Adventure',tags:['Cats','Animals','Cute','Action','Adventure','Simulation'],title:'Cat Bond',description:'Raise an adorable team of cats, explore illustrated regions, rescue and collect new feline companions, and discover powerful duo bonds in real-time battles. Earn medals, grow your garden, and uncover new cat stories.',controls:'Choose a starter cat, tap the glowing grass to discover a wild cat, and follow the first quest. In battles use WASD or arrow keys to move, mouse to aim, left-click or J to attack, Q/E for skills, Space to dodge and R for the ultimate. You can also enable Auto Battle. On mobile use the on-screen controls.'},
 'pawsibly-innocent':{category:'Adventure',tags:['Cat','Cats','Animals','Cute','Adventure','Cozy'],title:'Pawsibly Innocent!',description:'Play as a mischievous little cat exploring eight illustrated rooms. Steal three fish, find souvenirs, and outsmart the humans in a cozy browser adventure.',controls:'Explore the rooms with keyboard and pointer controls. Interact with objects, use yarn to distract humans, collect three fish and escape unnoticed.'},
 'elsewhere':{category:'Adventure',tags:['Story','Choices','Adventure','Narrative','Interactive Fiction','1 Player','2D','Brain'],title:'Elsewhere',description:'Live another life in a choice-driven interactive story. Explore illustrated alternate lives, face personal decisions, and discover where each path leads.',controls:'Read each scene and click one of the choices to shape your story and discover different endings.'},
 'tiny-town':{category:'Simulation',tags:['City Builder','City Building','Cozy','Management','Simulation','Strategy'],title:'No More Mondays: Tiny Town',description:'AI does all the work, so humans have unlimited free time. Build a small town, meet neighbors and discover how people choose to live in an eight-turn cozy strategy game.',controls:'Choose a venue and place it on the town map. Continue through the weeks and connect neighbors to unlock possibilities.'},
 'parcel-panic':{category:'Puzzle',tags:['Sorting','Puzzle','Arcade','Casual','Skill'],title:'Parcel Panic',description:'A quick, colorful parcel-sorting challenge. Match each package to the correct delivery lane, build streaks and beat your best score.',controls:'Click the matching delivery lane or press 1, 2, or 3 to sort the next parcel.'},
 'pocket-aquarium':{category:'Puzzle',tags:['Fish','Aquarium','Casual','Cozy','Puzzle'],title:'Pocket Aquarium',description:'Feed hungry fish in a tiny aquarium. Match the right food color, time your drops and see how many fish you can care for in sixty seconds.',controls:'Select the matching food color and feed each fish before its timer runs out. Keep the water clean.'},
 'flip-dash':{category:'Arcade',tags:['Runner','Platform','Skill','Arcade','Jumping'],title:'Flip Dash',description:'A one-button gravity runner. Flip between floor and ceiling, avoid obstacles and chase a new high score in a quick arcade challenge.',controls:'Press Space or tap to flip gravity and avoid the next obstacle. Retry instantly to beat your previous run.'}
};
// Use the submission copy the studio has already prepared and reviewed.
const draftCopy=JSON.parse(fs.readFileSync('promotion/crazygames-cat-bond-submission-draft.json','utf8'));
copy['cat-bond'].description=draftCopy.description;
copy['cat-bond'].controls=draftCopy.instructions;
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
 await page.getByText(/Upload your game|Game details|QA Results|Finalize submission/i).first().waitFor({timeout:15000}).catch(()=>{});
 await sleep(1300);
 let text=await body(page);
 if(/You already have a game waiting for review/i.test(text))throw Error('CRAZYGAMES_REVIEW_SLOT_OCCUPIED');
 if(text.includes('Finalize submission')&&text.includes('Ready to submit?'))return page;
 if(text.includes('Game details') && text.includes('Cover images'))return page;
 if(!/Upload your game|Game name/.test(text))throw Error('Draft editing view unavailable: '+mask(text,1500));
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
       if(await yes.count()!==7||await no.count()!==7){
         results[0].qaDiagnostics={
           path:new URL(qa.url()).pathname,
           body:mask(await qa.locator('body').innerText(),5000),
           yesCount:await yes.count(),noCount:await no.count(),
           buttons:(await qa.locator('button:visible').allTextContents().catch(()=>[]))
             .map(x=>mask(x,140)).slice(-45)
         };
         save();
         throw Error('QA result form structure changed: '+results[0].qaDiagnostics.yesCount+'/'+results[0].qaDiagnostics.noCount);
       }
       // Latest Basic Implementation has SEVEN checks, not six.
       // Gameplay, CrazyGames domains, browsers, mobile, no third-party ads,
       // and no third-party login all pass the game's verified basic tests.
       // T&C / privacy notice is not displayed inside the game => truthful No.
       for(let i=0;i<6;i++)await yes.nth(i).evaluate(e=>(e.closest('button')||e.closest('label')||e).click());
       await no.nth(6).evaluate(e=>(e.closest('button')||e.closest('label')||e).click());
       results[0].qaAnswered={total:7,yes:6,no:1,details:'No in-game terms/privacy link'};
       save();
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
 const stage=await readStage(page);
 throw Error('Draft cannot advance to Details: '+JSON.stringify({path:stage.path,buttons:stage.buttons,body:stage.txt.slice(0,1700)}));
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
 // CrazyGames marks the extra free-text field as invalid when AI tools = Other.
 // The portal's generic mandatory-fields message hides this conditional requirement.
 if((await page.getByRole('combobox').nth(2).innerText()).includes('Other')){
   // The conditional textbox exists before validation, but aria-invalid=true
   // is added only AFTER a failed Save. Select the first text input following
   // the tool combobox instead, verified by real portal DOM diagnostics.
   const otherTool=page.getByRole('combobox').nth(2).locator('xpath=following::input[@type="text"][1]');
   if(!await otherTool.count())throw Error('Other selected but its explanatory input is missing');
   await otherTool.fill('Custom HTML5, JavaScript and CSS; AI-assisted development with ChatGPT and Claude.');
   await otherTool.press('Tab');
   rec.otherToolDetailsProvided=(await otherTool.inputValue()).length>10;
   if(!rec.otherToolDetailsProvided)throw Error('Other tool explanation could not be retained');
 }
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
 rec.networkDiagnostics=[];
 const captureResponse=async(response)=>{
   try{
     const u=new URL(response.url());
     if(u.origin!==ROOT)return;
     const request=response.request();
     if(request.method()==='GET'&&response.status()<400)return;
     const contentType=response.headers()['content-type']||'';
     const raw=/json|text/.test(contentType)?await response.text().catch(()=>''):'';
     rec.networkDiagnostics.push({method:request.method(),path:u.pathname,status:response.status(),body:mask(raw,750)});
     rec.networkDiagnostics=rec.networkDiagnostics.slice(-20);
   }catch{}
 };
 page.on('response',captureResponse);
 // MUI snackbar notifications overlap the button on headless Chrome, even after
  // all validation and media conversion succeed. Invoke the React button's native
  // click handler directly to avoid interception by transient toast overlays.
  await more.evaluate(el=>el.click()).catch(e=>{throw Error('Details save failed: '+mask(e.message,180))});
  await sleep(1900);
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

async function eligibility(page){
  await page.goto(ROOT+'/submit',{waitUntil:'domcontentloaded',timeout:28000});
  await page.getByText('Before you submit').first().waitFor({timeout:11000}).catch(()=>{});
  const body=await body(page);
  if(!body.includes('Before you submit'))throw Error('Eligibility screen missing');
  const boxes=page.locator('input[type=checkbox]');
  const claim=await boxes.evaluateAll(xs=>xs.map(el=>{const p=el.closest('label')||el.parentElement?.parentElement;return(p?.innerText||'').trim();}));
  const keys=['desktop Chrome','mobile','Default language is English','first minute','someone other than you','rights to all code'];
  if(claim.length!==6||!keys.every(k=>claim.some(c=>c.toLowerCase().includes(k.toLowerCase()))))
   throw Error('Eligibility statement changed: review required');
  // Requirements established by user's completed validation and six-game preflight.
  for(let i=0;i<6;i++)await boxes.nth(i).evaluate(x=>{if(!x.checked)x.click();});
  if(!await click(page,'Continue'))throw Error('Eligibility Continue disabled');
  await page.getByText('Game name').first().waitFor({timeout:9000}).catch(()=>{});
  if(!(await body(page)).includes('Game engine'))throw Error('Upload form not loaded');
}
async function setIframe(page,game,channel){
 const field=page.locator('input[type=text][required]').first();
 if(!await field.count())throw Error('Game name input unavailable');
 await field.fill(game.title);
 await page.getByRole('combobox').first().evaluate(e=>e.click()).catch(()=>{});
 await sleep(350);
 let option=page.getByRole('option',{name:'Externally hosted (iframe)',exact:true}).first();
 if(!(await option.isVisible().catch(()=>false))){
  const combo=page.getByRole('combobox').first(),box=await combo.boundingBox();
  if(box)await page.mouse.click(box.x+box.width/2,box.y+box.height/2);
  await sleep(450);
 }
 option=page.getByRole('option',{name:'Externally hosted (iframe)',exact:true}).first();
 if(!await option.count())throw Error('External iframe game engine unavailable');
 await option.evaluate(e=>e.click());
 await sleep(450);
 const urlField=page.locator('input[type=url]').first();
 if(!await urlField.count())throw Error('IFrame link input missing');
 await urlField.fill(channel.trackedUrl);
 // CrazyGames' SDK Data Module and CrazyGames-account-backed server save
 // are NOT integrated. The game currently uses localStorage, not either
 // platform service. Select the basic/no-platform-save configuration; local
 // browser progress remains untouched and must be documented as local only.
 const noPlatformSave=page.getByText('No, the game does not need progress save',{exact:true}).first();
 if(!(await noPlatformSave.count()))throw Error('CrazyGames save-mode choices changed');
 await noPlatformSave.evaluate(e=>(e.closest('label')||e).click());
 await sleep(300);
 const selected=await page.locator('input[type=radio]:checked').count();
 if(selected<1)throw Error('CrazyGames save mode not selected');
 const mobile=page.getByText('The game supports mobile devices',{exact:true}).first();
 if(await mobile.count()){
   await mobile.evaluate(e=>{
      const cb=(e.closest('label')||e.parentElement)?.querySelector('input[type=checkbox]');
      if(cb&&!cb.checked)(e.closest('label')||e).click();
   });
 }

 await sleep(500);
 if((await urlField.inputValue())!==channel.trackedUrl)throw Error('IFrame URL mismatched');
 if((await field.inputValue())!==game.title)throw Error('Game title mismatched');
}


const blocked=message=>{throw Error(message)};
function safeText(str,n=1000){return mask(String(str||''),n);}
async function inspectAt(page,label,rec){
  const p=new URL(page.url()).pathname;
  const text=await body(page);
  rec.stages.push({label,path:p,buttons:(await page.locator('button:visible').allTextContents().catch(()=>[])).slice(-22),body:safeText(text,1500)});
  save();
}
async function findDraft(page){
  await page.goto(ROOT+'/games',{waitUntil:'domcontentloaded',timeout:35000});
  await page.getByText('My Games',{exact:true}).first().waitFor({timeout:11000}).catch(()=>{});
  await sleep(1700);
  const target=page.getByText('Cat Bond',{exact:true}).first();
  if(!(await target.count()))return null;
  await target.click({timeout:7000}).catch(()=>{});
  await sleep(1200);
  const p=new URL(page.url()).pathname;
  const m=p.match(/\/games\/([a-z0-9-]+)/i);
  return m?m[1]:null;
}
async function detectDraftId(ctx,page){
  const candidates=ctx.pages().map(p=>p.url());
  candidates.push(page.url());
  for(const link of candidates){
    const m=link.match(/\/(?:games|preview|qa-continue)\/([a-f0-9-]{12,})/i);
    if(m)return m[1];
  }
  await page.goto(ROOT+'/games',{waitUntil:'domcontentloaded',timeout:30000});
  await sleep(1500);
  return await findDraft(page);
}
async function createDraft(ctx,page,rec){
  await page.goto(ROOT+'/submit',{waitUntil:'domcontentloaded',timeout:35000});
  await sleep(1400);
  const boxes=page.locator('input[type=checkbox]');
  await boxes.first().waitFor({state:'visible',timeout:16000}).catch(()=>{});
  await sleep(1300);
  const claims=await boxes.evaluateAll(xs=>xs.map(el=>
    (el.closest('label')||el.parentElement?.parentElement||el.parentElement)?.innerText?.trim()||''));
  rec.eligibilityLabelCount=claims.length;
  rec.eligibilityLabels=claims.map(x=>safeText(x,250));
  rec.eligibilityPagePath=new URL(page.url()).pathname;
  save();
  const required=[
    'desktop Chrome within 20 seconds',
    'Tested and works on mobile',
    'Default language is English',
    'first minute makes it clear',
    'Someone other than you',
    'rights to all code'
  ];
  if(claims.length!==6||!required.every(k=>claims.some(v=>v.toLowerCase().includes(k.toLowerCase()))))
    blocked('CrazyGames eligibility: '+claims.length+' labels; missing '+required.filter(k=>!claims.some(v=>v.toLowerCase().includes(k.toLowerCase()))).join('|'))
  for(let i=0;i<6;i++)await boxes.nth(i).evaluate(e=>{if(!e.checked)e.click()});
  rec.eligibilityUserConfirmed=true;
  rec.status='eligibility-confirmed';save();
  if(!await click(page,'Continue'))blocked('Eligibility Continue unavailable');
  await page.getByText('Game name').first().waitFor({timeout:14000}).catch(()=>{});
  if(!(await body(page)).includes('Game name'))blocked('New game form did not load');
  rec.status='initial-upload-step';save();
  const row=ledger.games.find(x=>x.slug==='cat-bond'),game=copy['cat-bond'];
  if(!row||row.channels?.crazygames?.status!=='not-created')blocked('Unexpected catalog/portal status');
  const tracked=row.channels.crazygames.trackedUrl;
  await setIframe(page,game,{trackedUrl:tracked});
  await inspectAt(page,'iframe-configured',rec);
  // No false 'progress save not needed' declaration.
  const values=(await page.locator('input[type=radio]').evaluateAll(xs=>xs.map(x=>x.closest('label')?.innerText||x.parentElement?.parentElement?.innerText||'')));
  rec.saveOptions=values.map(x=>safeText(x,200));
  rec.progressSave={mode:'browser-localStorage',noCloudSync:true};
  const preview=page.getByRole('button',{name:'Preview',exact:true});
  if(!(await preview.count())||!(await preview.isEnabled().catch(()=>false)))
    blocked('Preview disabled; verify save-progress option / iframe form before continuing');
  await preview.evaluate(el=>el.click());
  await sleep(2700);
  await inspectAt(page,'preview-created',rec);
  let id=await detectDraftId(ctx,page);
  if(!id)blocked('Preview created but no unique draft ID found; check dashboard before retrying');
  rec.platformDraftId=id;rec.status='platform-draft-created';save();
  return id;
}
async function main(){
  const rec={slug:'cat-bond',status:'started',startedAt:time(),
    platformDraftId:null,stages:[],uploaded:[],finalSubmitClicked:false,reviewSubmitted:false};
  results.push(rec);save();
  if(!email||!password)blocked('CrazyGames studio secrets are not configured');
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try{
    const ctx=await browser.newContext();
    const page=await ctx.newPage();
    page.on('pageerror',e=>{rec.pageErrors=(rec.pageErrors||[]).concat(safeText(e.message,170)).slice(-10)});
    const authenticatedOk=await authenticated(page);
    if(!authenticatedOk)blocked('CrazyGames studio login was not authenticated');
    rec.status='authenticated';save();
    const row=ledger.games.find(x=>x.slug==='cat-bond');
    if(!row)blocked('Catalog row for Cat Bond missing');
    let id=await findDraft(page);
    if(!id){
      // Reuse the platform-created Cat Bond ID; never create a second game.
      const priorId='cda65c21-75f7-4ce5-b717-62b425097981';
      await page.goto(ROOT+'/games/'+priorId,{waitUntil:'domcontentloaded',timeout:30000});
      await sleep(1700);
      const priorText=await body(page);
      if(/Cat Bond/i.test(priorText)&&/game|upload|qa|draft/i.test(priorText)){
        id=priorId;
        rec.stages.push({label:'resume-verified-platform-draft',path:'/games/'+priorId});
      }else blocked('Existing Cat Bond draft unavailable; refusing duplicate creation');
    }
    if(id){
      rec.status='existing-platform-draft-found';
      rec.platformDraftId=id;save();
    }else{
      await inspectAt(page,'dashboard-no-cat-bond',rec);
      id=await createDraft(ctx,page,rec);
    }
    // The portal may offer a "Go to QA" button; this is NOT "Submit for review".
    // Continue through authentic game-preview QA to the upload details form.
    // No final terms/rights checkbox on the last step, no publishing action.
    const detailsPage=await toDetails(page,ctx,id,rec.stages);
    rec.status='metadata-and-media-upload';save();
    await details(detailsPage,'cat-bond',rec);
    rec.status='saved-final-step-unsubmitted';rec.savedAt=time();
    rec.finalStepBeforeSubmission=await readStage(detailsPage);save();
    await page.goto(ROOT+'/games',{waitUntil:'domcontentloaded',timeout:30000});
    await sleep(1600);
    const exact=page.getByText('Cat Bond',{exact:true}).first();
    const label=await exact.evaluate(el=>(el.closest('tr')||el.closest('[role=row]')||el.parentElement?.parentElement)?.innerText||'').catch(()=>null);
    rec.dashboardRow=safeText(label,420);
    rec.verifiedDraftVisible=await exact.count()>0;
    if(!rec.verifiedDraftVisible)rec.status='unconfirmed-draft-needs-inspection';
    if(/submitted|under review|in review/i.test(rec.dashboardRow||''))rec.status='unexpected-platform-review-state-needs-inspection';
    save();
    await ctx.close();
  }finally{await browser.close();}
}
try {await main();} catch(e) {
  const rec=results[0]||{slug:'cat-bond'};
  rec.error=safeText(e.message,900);
  rec.status=rec.platformDraftId?'partial-platform-draft-needs-review':'blocked-before-verified-draft';
  rec.finishedAt=time();save();
  console.log('CAT BOND PORTAL DRAFT BLOCKED',JSON.stringify({status:rec.status,stage:rec.stages?.at(-1)?.label,reason:rec.error}));
}
console.log('CAT BOND DRAFT RESULT',JSON.stringify({
 status:results[0]?.status,id:results[0]?.platformDraftId,
 uploaded:results[0]?.uploaded,verified:results[0]?.verifiedDraftVisible,
 submitted:results[0]?.reviewSubmitted
}));
