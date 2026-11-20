// End-to-end, authorized, proof-based CrazyGames iframe submission.
// No ZIP uploads. Only mark success with platform evidence; never bypass review.
// Runs with the Morrow Wish studio credentials from GitHub Actions secrets.
import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {publishedGames} from './discovery.mjs';

const ROOT='https://developer.crazygames.com';
const email=process.env.CRAZYGAMES_STUDIO_EMAIL||'';
const password=process.env.CRAZYGAMES_STUDIO_PASSWORD||'';
const requested=(process.env.CRAZYGAMES_TARGET_SLUGS||'pawsibly-innocent,elsewhere,tiny-town,parcel-panic,pocket-aquarium,flip-dash').split(',').map(x=>x.trim()).filter(Boolean);
const out='.check/crazygames/submission-results.json';
const info={
 'pawsibly-innocent':{title:'Pawsibly Innocent!',category:'Adventure',controls:'Move around the rooms and interact with objects. Distract the human with yarn and collect three fish.',description:'Play as a mischievous little cat exploring eight illustrated rooms. Steal three fish, find souvenirs, and outsmart the humans in a cozy browser adventure.'},
 'elsewhere':{title:'Elsewhere',category:'Adventure',controls:'Read each scene and click a choice to shape your story.',description:'Live another life in a choice-driven interactive story. Explore illustrated alternate lives, face personal decisions, and discover where each path leads.'},
 'tiny-town':{title:'No More Mondays: Tiny Town',category:'Simulation',controls:'Choose a venue, place it on the map, then continue to the next week. Help residents find ways to enjoy unlimited free time.',description:'AI does all the work, so humans have limitless free time. Build a small town, meet neighbors, and discover how people choose to live in an eight-turn cozy strategy game.'},
 'parcel-panic':{title:'Parcel Panic',category:'Puzzle',controls:'Click the correct delivery lane or press 1, 2, or 3 to match the next parcel.',description:'A fast and colorful parcel sorting challenge. Match each package to the correct lane, build streaks and beat your best score.'},
 'pocket-aquarium':{title:'Pocket Aquarium',category:'Casual',controls:'Select a food color and feed the matching fish before the timer ends.',description:'Feed hungry fish in a tiny aquarium. Match the right food color, time your drops, and see how many fish you can care for in sixty seconds.'},
 'flip-dash':{title:'Flip Dash',category:'Action',controls:'Press Space or tap to flip gravity and dodge obstacles.',description:'A one-button gravity runner. Flip between floor and ceiling, avoid obstacles, and chase a new high score in a quick arcade game.'}
};
const source=publishedGames(),ledger=JSON.parse(fs.readFileSync('promotion/ledger.json','utf8'));
const records=[];
function now(){return new Date().toISOString();}
function clip(t,n=2200){return String(t||'').slice(0,n).replace(/\S+@\S+/g,'[email]').replace(/https?:\/\/\S+/g,'[url]');}
function write(){fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify({checkedAt:now(),portal:ROOT,results:records},null,2)+'\n');}
const browser=await chromium.launch({channel:'chrome',headless:true});
async function wait(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
async function visibleBody(page){return page.locator('body').innerText().catch(()=>'');}
async function phase(page){return {path:new URL(page.url()).pathname,body:clip(await visibleBody(page),1500)};}
async function clickText(page,label){const control=page.getByRole('button',{name:label,exact:true}).first();if(!(await control.count())||!(await control.isEnabled().catch(()=>false)))return false;await control.evaluate(el=>el.click());await wait(900);return true;}
async function signIn(page){
  for(let attempt=0;attempt<3;attempt++){
    await page.goto(ROOT+'/login',{waitUntil:'domcontentloaded',timeout:30000}).catch(()=>{});
    const pw=page.locator('input[type=password]').first();
    await pw.waitFor({state:'visible',timeout:12000}).catch(()=>{});
    const em=page.locator('input[type=email],input[placeholder*="@"],input[autocomplete="username"],input[type=text]').first();
    if(!(await pw.isVisible().catch(()=>false))||!(await em.isVisible().catch(()=>false))){await wait(750);continue;}
    await em.fill(email);await pw.fill(password);
    const go=page.getByRole('button',{name:/^log ?in$/i}).first();
    if(!(await go.count()))continue;
    await go.click({timeout:6000}).catch(()=>{});
    await page.waitForURL(u=>!u.pathname.startsWith('/login'),{timeout:15000}).catch(()=>{});
    await wait(1500);
    if(!new URL(page.url()).pathname.startsWith('/login')){
       await page.goto(ROOT+'/games',{waitUntil:'domcontentloaded',timeout:25000}).catch(()=>{});
       await wait(1400);
       return !new URL(page.url()).pathname.startsWith('/login');
    }
    const text=(await visibleBody(page)).toLowerCase();
    if(/invalid password|incorrect password|account locked|captcha|too many attempts|verify your account/.test(text))throw Error('Studio login requires verification; no automated bypass');
  }
  return false;
}
async function eligibility(page){
  await page.goto(ROOT+'/submit',{waitUntil:'domcontentloaded',timeout:28000});
  await page.getByText('Before you submit').first().waitFor({timeout:11000}).catch(()=>{});
  const body=await visibleBody(page);
  if(!body.includes('Before you submit'))throw Error('Eligibility screen missing');
  const boxes=page.locator('input[type=checkbox]');
  const claim=await boxes.evaluateAll(xs=>xs.map(el=>{const p=el.closest('label')||el.parentElement?.parentElement;return(p?.innerText||'').trim();}));
  const keys=['desktop Chrome','mobile','Default language is English','first minute','someone other than you','rights to all code'];
  if(claim.length!==6||!keys.every(k=>claim.some(c=>c.toLowerCase().includes(k.toLowerCase()))))
   throw Error('Eligibility statement changed: review required');
  // Requirements established by user's completed validation and six-game preflight.
  for(let i=0;i<6;i++)await boxes.nth(i).evaluate(x=>{if(!x.checked)x.click();});
  if(!await clickText(page,'Continue'))throw Error('Eligibility Continue disabled');
  await page.getByText('Game name').first().waitFor({timeout:9000}).catch(()=>{});
  if(!(await visibleBody(page)).includes('Game engine'))throw Error('Upload form not loaded');
}
async function setIframe(page,game,channel){
 const field=page.locator('input[type=text][required]').first();
 if(!await field.count())throw Error('Game name input unavailable');
 await field.fill(game.title);
 await page.getByRole('combobox').first().evaluate(e=>e.click()).catch(()=>{});
 await wait(350);
 let option=page.getByRole('option',{name:'Externally hosted (iframe)',exact:true}).first();
 if(!(await option.isVisible().catch(()=>false))){
  const combo=page.getByRole('combobox').first(),box=await combo.boundingBox();
  if(box)await page.mouse.click(box.x+box.width/2,box.y+box.height/2);
  await wait(450);
 }
 option=page.getByRole('option',{name:'Externally hosted (iframe)',exact:true}).first();
 if(!await option.count())throw Error('External iframe game engine unavailable');
 await option.evaluate(e=>e.click());
 await wait(450);
 const urlField=page.locator('input[type=url]').first();
 if(!await urlField.count())throw Error('IFrame link input missing');
 await urlField.fill(channel.trackedUrl);
 const noSave=page.getByText('No, the game does not need progress save',{exact:true}).first();
 if(await noSave.count())await noSave.evaluate(e=>e.click());
 await wait(500);
 if((await urlField.inputValue())!==channel.trackedUrl)throw Error('IFrame URL mismatched');
 if((await field.inputValue())!==game.title)throw Error('Game title mismatched');
}
async function fillAccessible(page,pattern,value){
 const labels=page.getByLabel(pattern);
 if(await labels.count()&&await labels.first().isVisible().catch(()=>false)){await labels.first().fill(value);return true;}
 const placeholders=page.getByPlaceholder(pattern);
 if(await placeholders.count()&&await placeholders.first().isVisible().catch(()=>false)){await placeholders.first().fill(value);return true;}
 return false;
}
async function uploadFiles(page,slug){
 const folder='public/promo/'+slug;
 const files={
   landscape:folder+'/cover-landscape.png',
   portrait:folder+'/cover-portrait.png',
   square:folder+'/cover-square.png',
   videoLandscape:folder+'/real-gameplay-landscape.mp4',
   videoPortrait:folder+'/real-gameplay-portrait.mp4'
 };
 const inputs=page.locator('input[type=file]');
 const result={count:await inputs.count(),filesFound:Object.values(files).every(f=>fs.existsSync(f))};
 if(!result.filesFound)return result;
 const attachments=await inputs.evaluateAll(xs=>xs.map(x=>({accept:x.accept,
   context:(x.closest('label')?.innerText||x.parentElement?.parentElement?.innerText||'').slice(0,120)})));
 result.attachmentControls=attachments;
 for(let i=0;i<attachments.length;i++){
  const hint=attachments[i].context.toLowerCase(),accepted=attachments[i].accept.toLowerCase();
  let file;
  if(accepted.includes('video'))file=hint.includes('portrait')?files.videoPortrait:files.videoLandscape;
  else if(hint.includes('portrait'))file=files.portrait;
  else if(hint.includes('square'))file=files.square;
  else if(hint.includes('landscape'))file=files.landscape;
  if(file){
   await inputs.nth(i).setInputFiles(file);
   result.uploaded=(result.uploaded||[]).concat(path.basename(file));
   await wait(300);
  }
 }
 return result;
}
async function submitGame(page,slug){
 const rec={slug,attemptedAt:now(),status:'not-submitted',platformId:null,publicUrl:null};
 records.push(rec);write();
 try{
  const game=info[slug],published=source.find(g=>g.slug===slug);
  const ledgerGame=ledger.games.find(g=>g.slug===slug),channel=ledgerGame?.channels?.crazygames;
  if(!game||!published||!channel||ledgerGame.officialUrl!==published.url)throw Error('Catalog mismatch');
  if(channel.platformId||channel.publicUrl||channel.status!=='not-submitted')throw Error('Already recorded, skip duplicate');
  const url=new URL(channel.trackedUrl);
  if(url.origin!=='https://morrowwish.vercel.app'||url.pathname!==new URL(published.url).pathname||
    url.searchParams.get('utm_source')!=='crazygames'||url.searchParams.get('utm_medium')!=='portal')
    throw Error('Invalid external iframe URL');
  rec.gameTitle=game.title;
  await eligibility(page);
  await setIframe(page,game,channel);
  if(!await clickText(page,'Preview'))throw Error('Preview button disabled');
  await wait(1800);
  let screen=await visibleBody(page);
  if(screen.toLowerCase().includes('game name is already in use')){
    rec.status='name-collision';rec.blocker='Game title is already in use on CrazyGames';return;
  }
  const link=new URL(page.url());
  if(!link.pathname.startsWith('/preview/')){
    rec.status='upload-validation-failed';rec.blocker=clip(screen.slice(-700));return;
  }
  rec.previewId=link.pathname.split('/').pop();
  rec.status='qa-preview-created';
  rec.previewOnlyUrl=link.origin+link.pathname;
  rec.qaText=clip(screen.slice(-900));
  write();
  const continueButton=page.getByRole('button',{name:'Continue',exact:true}).last();
  await continueButton.waitFor({state:'visible',timeout:12000}).catch(()=>{});
  if(!await continueButton.isEnabled().catch(()=>false)){
     rec.status='qa-continue-disabled';return;
  }
  await continueButton.evaluate(e=>e.click());
  await wait(1900);
  rec.afterQA=await phase(page);
  rec.status='qa-continued';write();
  // Continue from QA to Details; account for portal's React screen timing.
  let text=await visibleBody(page);
  if(!/description|game covers|controls|details|instructions|category/i.test(text)){
     await wait(1800);text=await visibleBody(page);
  }
  rec.detailForm={page:await phase(page),
     fields:await page.locator('input,textarea,select').evaluateAll(xs=>xs.filter(x=>x.getBoundingClientRect().width>0)
       .map(x=>({tag:x.tagName,type:x.type,name:x.name,placeholder:x.placeholder,required:x.required})).slice(0,35)),
     fileInputs:await page.locator('input[type=file]').count()};
  if(!/description|game covers|controls|details|instructions|category/i.test(text)){
     rec.status='details-unavailable';return;
  }
  rec.filled={description:await fillAccessible(page,/description/i,game.description),
    controls:await fillAccessible(page,/controls|instructions|how to play/i,game.controls)};
  rec.upload=await uploadFiles(page,slug);
  write();
  // Never blindly click final submit; only if all mandatory visible fields are valid.
  const required=await page.locator('input[required],textarea[required],select[required]').evaluateAll(xs=>xs.filter(x=>x.getBoundingClientRect().width>0)
     .map(x=>({type:x.type,value:x.value||'',name:x.name,valid:x.checkValidity()})));
  rec.requiredFields=required.map(x=>({type:x.type,valid:x.valid}));write();
  if(required.some(f=>!f.valid)){rec.status='details-incomplete';return;}
  const finalButton=page.getByRole('button',{name:/^(Submit|Submit game|Send to QA)$/i}).last();
  const pageText=await visibleBody(page);
  if(!(await finalButton.count())||!(await finalButton.isEnabled())|| !/Details|Submit Your Game/i.test(pageText)){
    rec.status='awaiting-final-submission-step';return;
  }
  // This is the user-authorized publication submission action.
  await finalButton.evaluate(e=>e.click());
  await wait(2200);
  const confirm=await phase(page);
  rec.afterSubmit=confirm;
  const id=new URL(page.url()).pathname.match(/\/(?:games|submissions|submission)\/([a-z0-9-]{12,})/i)?.[1]||
    confirm.body.match(/(?:submission|game)\s*id[\s:#]*([a-z0-9-]{12,})/i)?.[1]||null;
  if(id && /submitted|pending|review|thank you|success|received/i.test(confirm.body)){
    rec.status='submitted-confirmed';rec.platformId=id;
  }else rec.status='submitted-no-receipt-requires-verification';
 }catch(e){
  rec.status='failed';
  rec.blocker=clip(String(e.message),300);
 }finally{rec.completedAt=now();write();console.log(JSON.stringify({slug:rec.slug,status:rec.status,platformId:rec.platformId,blocker:rec.blocker||null,previewId:rec.previewId||null}));}
}
let context;
try{
 if(!email||!password)throw Error('CrazyGames studio credential secrets not configured');
 context=await browser.newContext();
 const page=await context.newPage();
 if(!await signIn(page))throw Error('CrazyGames developer login failed; no submissions');
 for(const slug of requested){
  if(!info[slug]){records.push({slug,status:'unknown-game'});continue;}
  await submitGame(page,slug);
 }
}catch(e){records.push({status:'critical-blocker',message:clip(String(e.message),300)});console.log('CrazyGames batch halted: '+clip(e.message,300));}
finally{
 write();if(context)await context.close().catch(()=>{});await browser.close();
}
