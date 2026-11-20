// Examine whether CrazyGames QA Continue navigates, opens a popup, or closes
// the preview. Uses existing preview reference; no duplicate game created.
import {chromium} from 'playwright';
import fs from 'node:fs';
const root='https://developer.crazygames.com';
const previewId='6d2e15dc-74a7-4ce9-8a37-d2775008339c';
const email=process.env.CRAZYGAMES_STUDIO_EMAIL,password=process.env.CRAZYGAMES_STUDIO_PASSWORD;
const redact=s=>String(s||'').replace(/https?:\/\/\S+/g,'[URL]').replace(/\S+@\S+/g,'[EMAIL]').slice(-2500);
const browser=await chromium.launch({channel:'chrome',headless:true});
const report={checkedAt:new Date().toISOString(),previewId,events:[],pages:[]};
let context;
try{
 context=await browser.newContext();
 const page=await context.newPage();
 await page.goto(root+'/login',{waitUntil:'domcontentloaded',timeout:30000});
 await page.locator('input[type=password]').first().waitFor({state:'visible',timeout:14000});
 await page.locator('input[type=email],input[placeholder*="@"],input[type=text]').first().fill(email);
 await page.locator('input[type=password]').first().fill(password);
 await page.getByRole('button',{name:/log ?in/i}).first().click();
 await page.waitForURL(url=>!url.pathname.includes('/login'),{timeout:12000}).catch(()=>{});
 await page.goto(root+'/games',{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForTimeout(1800);
 report.dashboardText=redact(await page.locator('body').innerText().catch(()=>'' )).slice(-1700);
 const preview=await context.newPage();
 preview.on('popup',p=>report.events.push({kind:'popup',urlPath:new URL(p.url()).pathname}));
 preview.on('close',()=>report.events.push({kind:'preview-closed'}));
 context.on('page',p=>report.events.push({kind:'new-tab',urlPath:new URL(p.url()||'about:blank').pathname}));
 await preview.goto('https://www.crazygames.com/preview/'+previewId,{waitUntil:'domcontentloaded',timeout:30000});
 await preview.getByText('This build has not been sent to QA').first().waitFor({timeout:12000}).catch(()=>{});
 await preview.waitForTimeout(1200);
 const control=preview.getByRole('button',{name:'Continue',exact:true}).last();
 report.before={pagePath:new URL(preview.url()).pathname,body:redact(await preview.locator('body').innerText().catch(()=>'' )).slice(-1550),
  buttons:await preview.locator('button:visible').allTextContents().then(xs=>xs.slice(-15)).catch(()=>[])};
 report.continueFound=await control.count();
 report.continueEnabled=await control.isEnabled().catch(()=>false);
 report.continueDOM=await control.evaluate(el=>({
   html:el.outerHTML.slice(0,700),type:el.type,disabled:el.disabled,
   parent:el.parentElement?.outerHTML.slice(0,700)||''
 })).catch(()=>null);
 if(report.continueEnabled){
   await control.click({timeout:8000}).catch(e=>{report.clickError=redact(e.message).slice(0,300)});
   await preview.waitForTimeout(3500);
   report.afterClick={path:new URL(preview.url()).pathname,body:redact(await preview.locator('body').innerText().catch(()=>'' )).slice(-1700)};
 }
 for(const p of context.pages()){
  report.pages.push({path:new URL(p.url()).pathname,origin:new URL(p.url()).origin,closed:p.isClosed(),
   body:!p.isClosed()?redact(await p.locator('body').innerText().catch(()=>'' )).slice(-1250):''});
 }
}catch(e){report.error=redact(e.message).slice(0,400)}
finally{
 if(context)await context.close().catch(()=>{});await browser.close();
 fs.mkdirSync('.check/crazygames',{recursive:true});
 fs.writeFileSync('.check/crazygames/resume-inspection.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify(report,null,2));
}
