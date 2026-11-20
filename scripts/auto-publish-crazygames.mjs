// Morrow Wish CrazyGames publisher: priority-ordered and review-gated.
// Uses the official portal UI with an authorized browser session, never private APIs.
// Does not bypass CAPTCHAs, review limits, QA or rights/playtest attestations.
import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';
import {publishedGames,trackedLink} from './discovery.mjs';

const STATE=process.env.CRAZY_STORAGE_STATE_B64||'';
const portal='https://developer.crazygames.com';
const policy=JSON.parse(fs.readFileSync('promotion/portal-status.json','utf8'));
const names={'pawsibly-innocent':'Pawsibly Innocent!','cat-bond':'Cat Bond','tiny-town':'No More Mondays: Tiny Town','elsewhere':'Elsewhere','parcel-panic':'Parcel Panic','flip-dash':'Flip Dash','pocket-aquarium':'Pocket Aquarium'};
const published=new Map(publishedGames().map(g=>[g.slug,g]));
function log(msg){console.log('CrazyGames: '+msg);if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,'\n- CrazyGames: '+msg+'\n');}
async function any(page,selectors){
  for(const s of selectors){const el=page.locator(s).first();if(await el.count()&&await el.isVisible().catch(()=>false))return el;}return null;
}
async function fill(page,selectors,value,required=true){
  const el=await any(page,selectors);if(!el){if(required)throw Error('Missing field: '+selectors.join(' | '));return false;}await el.fill(value);return true;
}
async function click(page,selectors,required=true){
  const el=await any(page,selectors);if(!el){if(required)throw Error('Missing button: '+selectors.join(' | '));return false;}await el.click();return true;
}
function evidence(slug){
  const file=path.join('public',slug,'portal-release.json');
  if(!fs.existsSync(file))return null;
  try{return JSON.parse(fs.readFileSync(file,'utf8')).crazygames||null;}catch{return null;}
}
function readyAssets(slug){
  const dir=path.join('public','promo',slug);
  return ['cover-landscape.png','cover-square.png'].every(name=>fs.existsSync(path.join(dir,name)));
}
async function run(){
  if(!STATE){log('Authentication secret CRAZY_STORAGE_STATE_B64 missing. Not submitted.');return;}
  const browser=await chromium.launch({headless:true});
  const ctx=await browser.newContext({storageState:JSON.parse(Buffer.from(STATE,'base64').toString('utf8'))});
  const page=await ctx.newPage();
  try{
    await page.goto(portal+'/games',{waitUntil:'domcontentloaded',timeout:30000});
    if(/login|signin|sign-in/i.test(page.url()))throw Error('Session expired; authorized login must be refreshed.');
    const content=await page.locator('body').innerText();
    if(!/Morrow Wish/i.test(content))throw Error('Wrong CrazyGames developer account; no submission attempted.');
    const priorities=policy.crazygames.slice().sort((a,b)=>(a.priority||99)-(b.priority||99));
    // Portal status wins over our internal ledger. Wait until any existing QA is resolved.
    if(/Awaiting review|Under review|In review/i.test(content)){log('Existing game awaiting platform review. Queue held; no additional submissions.');return;}
    const candidate=priorities.find(x=>published.has(x.slug)&&!['submitted-for-review','published','awaiting-review'].includes(x.status)) ||
      [...published.values()].filter(g=>!priorities.some(p=>p.slug===g.slug)).map(g=>({slug:g.slug,status:'not-created'}))[0];
    if(!candidate){log('No eligible new game pending.');return;}
    const game=published.get(candidate.slug);
    const name=names[game.slug]||game.title;
    const approval=evidence(game.slug);
    if(!(approval?.rightsOwned===true&&approval?.humanPlaytestCompleted===true&&approval?.qaPassed===true)){
      log(name+' is next in priority, but required developer rights / human playtest / QA attestations are not verified in public/'+game.slug+'/portal-release.json. Not submitted.');return;
    }
    if(!readyAssets(game.slug)){log(name+' is next but required portal covers are missing in public/promo/'+game.slug+'/. Not submitted.');return;}
    // Do not create a second entry if a draft already exists.
    const maybe=page.getByText(name,{exact:true}).first();
    if(await maybe.count())await maybe.click();
    else await page.goto(portal+'/submit',{waitUntil:'domcontentloaded',timeout:30000});
    if(/captcha|verify you are human/i.test((await page.locator('body').innerText()).slice(0,2000)))throw Error('Manual platform verification requested; no bypass attempted.');
    await fill(page,['input[name="title"]','input[name="name"]','input[placeholder*="Game title" i]','input[placeholder*="Game name" i]'],name,false);
    await fill(page,['textarea[name="description"]','textarea[placeholder*="description" i]'],game.description,false);
    const remote=trackedLink(game,'crazygames','portal');
    const iframe=await fill(page,['input[name="iframeUrl"]','input[name="iframe_url"]','input[placeholder*="iframe" i]','input[placeholder*="https://" i]'],remote,false);
    if(!iframe){
      log(name+' requires a different URL/build upload form. No submission without verified playable build.');return;
    }
    // Use available owned promotional artwork, never scrape stock graphics.
    for(const [label,file] of [['landscape','cover-landscape.png'],['square','cover-square.png']]){
      const el=await any(page,['input[type=file][name*="'+label+'" i]','input[type=file][accept*="image"]']);
      if(el)await el.setInputFiles(path.join('public','promo',game.slug,file));
    }
    const submit=await any(page,[
      'button:has-text("Submit for review")',
      'button:has-text("Submit game")',
      'button:has-text("Submit for QA")',
      'button:has-text("Submit")'
    ]);
    if(!submit){log(name+' form prepared but official Submit button not available. Not submitted.');return;}
    await submit.click();
    await page.waitForLoadState('domcontentloaded',{timeout:12000}).catch(()=>{});
    const text=await page.locator('body').innerText();
    if(!/Awaiting review|Submitted for review|Under review|Submission successful/i.test(text)){
      throw Error('Submission confirmation was not visible; status not recorded as submitted.');
    }
    log(name+' submitted and developer portal confirmed review state.');
  }finally{await browser.close();}
}
run().catch(e=>{console.error('::error::CrazyGames auto-publish: '+e.message);process.exitCode=1;});
