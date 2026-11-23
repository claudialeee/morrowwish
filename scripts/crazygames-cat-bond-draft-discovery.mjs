// Read-only discovery of an EXISTING Cat Bond draft in CrazyGames.
// No checkboxes, draft creation, form updates, eligibility claims or review submissions.
import fs from 'node:fs';
import {chromium} from 'playwright';

const ROOT='https://developer.crazygames.com';
const out='.check/crazygames/cat-bond-draft-discovery.json';
const safe=s=>String(s||'').replace(/\\S+@\\S+/g,'[private-email]').replace(/https?:\\/\\/\\S+/g,'[private-link]').slice(0,350);
const report={checkedAt:new Date().toISOString(),status:'unknown',game:'Cat Bond',readOnly:true,existingDraftId:null,submitForReviewClicked:false,eligibilityChecked:false};
let browser;
try{
 const email=process.env.CRAZYGAMES_STUDIO_EMAIL||'';
 const password=process.env.CRAZYGAMES_STUDIO_PASSWORD||'';
 if(!email||!password)throw Error('Studio credentials not present in secure workflow');
 browser=await chromium.launch({channel:'chrome',headless:true});
 const context=await browser.newContext();
 const page=await context.newPage();
 await page.goto(ROOT+'/login',{waitUntil:'domcontentloaded',timeout:40000});
 await page.locator('input[type=password]').first().waitFor({state:'visible',timeout:12000});
 await page.locator('input[type=email],input[placeholder*="@"],input[type=text]').first().fill(email);
 await page.locator('input[type=password]').first().fill(password);
 await page.getByRole('button',{name:/^log ?in$/i}).first().click();
 await page.waitForURL(u=>!u.pathname.startsWith('/login'),{timeout:16000}).catch(()=>{});
 await page.goto(ROOT+'/games',{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForTimeout(2700);
 if(new URL(page.url()).pathname.startsWith('/login'))throw Error('Session not authenticated');
 const body=await page.locator('body').innerText();
 report.dashboardLoaded=/my games|submit a game/i.test(body);
 report.namesPresent=['Cat Bond','Pawsibly Innocent!','Tiny Town','Elsewhere'].filter(x=>body.toLowerCase().includes(x.toLowerCase()));
 report.catBondExactCount=await page.getByText('Cat Bond',{exact:true}).count();
 report.catBondPartialCount=await page.getByText(/Cat Bond/i).count();
 report.rowSummaries=await page.locator('tr,[role=row]').evaluateAll(ns=>ns
  .map(el=>({text:(el.innerText||'').trim().replace(/\\s+/g,' ').slice(0,210),
    hrefs:[...el.querySelectorAll('a[href]')].map(a=>a.getAttribute('href')).filter(h=>/^\\/games\\//.test(h||'')).slice(0,3)}))
  .filter(x=>/cat bond|pawsibly|tiny town|elsewhere|draft|review/i.test(x.text)).slice(0,28));
 const matching=report.rowSummaries.filter(x=>/cat bond/i.test(x.text));
 if(matching.length===1){
  report.status=/review|approved|published/i.test(matching[0].text)?'existing-nondraft':'existing-draft-candidate';
  const path=matching[0].hrefs.find(h=>/^\\/games\\/[a-z0-9-]+/.test(h));
  if(path){
   const m=path.match(/\\/games\\/([a-z0-9-]+)/i);
   if(m)report.existingDraftId=m[1];
   await page.goto(ROOT+path,{waitUntil:'domcontentloaded',timeout:30000});
   await page.waitForTimeout(1500);
   report.detailsText=safe((await page.locator('body').innerText()).slice(0,1400));
   report.detailsButtons=(await page.locator('button:visible').allTextContents()).map(safe).slice(0,20);
  }
 }else if(matching.length>1){
  report.status='ambiguous-duplicate-candidates';
 }else{
  report.status='no-cat-bond-row';
 }
 // Only inspect the first eligibility screen, without ticking or accepting
 // any unverified human-playtest / code-rights declarations.
 if(report.status==='no-cat-bond-row'){
  await page.goto(ROOT+'/submit',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForTimeout(1300);
  report.eligibility={
   pagePath:new URL(page.url()).pathname,
   labels:await page.locator('input[type=checkbox]').evaluateAll(ns=>ns.map(n=>{
     const p=n.closest('label')||n.parentElement?.parentElement||n.parentElement;
     return (p?.innerText||'').trim().slice(0,240);
   }).slice(0,10)),
   buttons:(await page.locator('button:visible').allTextContents()).map(safe).slice(0,12)
  };
 }
 await context.close();
}catch(e){
 report.status='inspection-blocked';
 report.error=/timeout/i.test(String(e.message))?'timeout':safe(String(e.message));
}finally{
 await browser?.close().catch(()=>{});
 fs.mkdirSync('.check/crazygames',{recursive:true});
 fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report));
}
