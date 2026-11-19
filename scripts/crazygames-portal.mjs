// CrazyGames studio developer portal auth + safe UI discovery.
// Never logs cookies, storage-state contents, credentials, account data or raw page HTML.
// Does not publish any game. Intended to discover exact submission form after sign-in.
import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';

const root='https://developer.crazygames.com';
const out=path.join(process.cwd(),'.check','crazygames','portal-inspection.json');
fs.mkdirSync(path.dirname(out),{recursive:true});
const report={checkedAt:new Date().toISOString(),status:'pending',authenticated:false,
  loginScreen:false,submissionActionFound:false,formLabels:[],pagePath:null,
  uiActions:[],portalRoutes:[],inputFields:[],submissionForm:null,
  note:'Read-only inspection; no game was submitted.'};
const session=process.env.CRAZYGAMES_STORAGE_STATE_B64||'';
const email=process.env.CRAZYGAMES_STUDIO_EMAIL||'';
const password=process.env.CRAZYGAMES_STUDIO_PASSWORD||'';
let state;
if(session){
  try{
    state=JSON.parse(Buffer.from(session,'base64').toString('utf8'));
    if(!Array.isArray(state.cookies)||!Array.isArray(state.origins))throw Error('Invalid Playwright storage state');
    report.savedSessionAvailable=true;
    report.sessionCookieCount=state.cookies.length;
  }catch{report.status='invalid-session-secret';state=undefined;}
}
function inspectFields(page){
 return page.locator('input,textarea,select').evaluateAll(nodes=>nodes.filter(n=>n.getBoundingClientRect().width>0).map(n=>({
    type:n.tagName.toLowerCase()==='input'?n.type:n.tagName.toLowerCase(),
    name:(n.getAttribute('name')||'').slice(0,45),
    placeholder:(n.getAttribute('placeholder')||'').slice(0,80),
    required:!!n.required
  })).slice(0,35)).catch(()=>[]);
}
function isLogin(page){return /\/login(?:\/|$)|\/register(?:\/|$)/i.test(new URL(page.url()).pathname);}
async function viewActions(page){
 const opts=await page.locator('button,a[role="button"],a[href]').evaluateAll(nodes=>nodes.map(n=>({
   role:n.tagName.toLowerCase(),
   text:(n.innerText||n.getAttribute('aria-label')||'').trim().slice(0,65),
   path:n.getAttribute('href')||''
 })).filter(x=>/new game|submit|add game|my games|create game|dashboard|upload game|draft|publish/i.test(x.text)).map(x=>({role:x.role,text:x.text,
    path:x.path.startsWith('/')?x.path.split('?')[0]:'n/a'})).slice(0,24)).catch(()=>[]);
 return opts;
}
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const context=await browser.newContext(state?{storageState:state}:{});
 const page=await context.newPage();
 const networkStats={scriptsOk:0,scriptsFailed:0,requestsFailed:0,serverErrors:0,consoleErrors:0};
 page.on('requestfailed',req=>{if(req.url().startsWith(root))networkStats.requestsFailed++});
 page.on('console',msg=>{if(msg.type()==='error')networkStats.consoleErrors++});
 page.on('response',res=>{try{
   const req=res.request(),url=new URL(res.url());
   if(url.host!=='developer.crazygames.com')return;
   if(req.resourceType()==='script'){
     if(res.status()>=400)networkStats.scriptsFailed++;
     else networkStats.scriptsOk++;
   }
   if(res.status()>=500)networkStats.serverErrors++;
 }catch{}});
 const loginPostStatuses=[];
 page.on('response',response=>{try{const r=response.request();if(r.method()==='POST' && new URL(response.url()).hostname.endsWith('.crazygames.com'))loginPostStatuses.push(response.status());}catch{}});
 let pageErrorCount=0;
 page.on('pageerror',()=>{pageErrorCount++;});
 const response=await page.goto(root+'/games',{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForTimeout(6200);
 report.pageErrorCount=pageErrorCount;
 report.bodyTextLength=await page.locator('body').innerText().then(x=>x.length).catch(()=>0);
 report.visibleControls=await page.locator('button:visible,a[href]:visible,input:visible').count().catch(()=>0);
 report.portalHttpStatus=response?.status()||null;
 report.firstPath=new URL(page.url()).pathname;
 if(isLogin(page)&&email&&password){
    report.credentialLoginAttempted=true;
    // Password login avoids Google SSO automated-browser restrictions.
    const e=page.locator('input[type="email"],input[name="email"],input[autocomplete="username"],input[placeholder*="@"],input[type="text"]').first();
    const pw=page.locator('input[type="password"]').first();
    if(await e.count() && await pw.count()){
      await e.fill(email);
      await pw.fill(password);
      const submit=page.getByRole('button',{name:/^(log\\s*in|sign\\s*in|login|continue)$/i}).first();
      const typed=page.locator('button[type="submit"],input[type="submit"]').first();
      const formButton=page.locator('form button').filter({hasText:/log\\s*in|sign\\s*in|continue/i}).first();
      report.loginButtons=await page.locator('form button').evaluateAll(bs=>bs.map(b=>({type:b.type,label:(b.innerText||'').trim().slice(0,48)})).filter(b=>/log\\s*in|sign\\s*in|continue/i.test(b.label)).slice(0,8)).catch(()=>[]);
      report.loginFormCount=await page.locator('form').count().catch(()=>0);
      const action=await submit.count()?submit:await typed.count()?typed:formButton;
      report.loginMethod=await action.count()?'click-login-button':'press-enter';
      if(await action.count()){
        await action.click({timeout:5000}).catch(()=>{});
      }else{
        await pw.press('Enter').catch(()=>{});
      }
      await page.waitForURL(u=>!isLogin({url:()=>u.toString()}),{timeout:12000}).catch(()=>{});
      await page.waitForTimeout(3200);
    }else{
      report.loginFormNotFound=true;
    }
 }
 report.loginPostStatuses=loginPostStatuses;
 if(report.credentialLoginAttempted){
   const body=(await page.locator('body').innerText().catch(()=>'' )).toLowerCase();
   report.loginFeedbackSignals=['incorrect','invalid','wrong password','authentication failed','sign in failed','login failed',
      'verify your email','verify your account','email not found','user not found','try again','captcha','security check',
      'check your email','too many attempts','password reset','something went wrong','sign in','log in']
       .filter(phrase=>body.includes(phrase));
   report.loginCaptchaVisible=await page.locator('iframe[src*="captcha"],iframe[src*="turnstile"],[class*="captcha"],[id*="captcha"]').count().then(x=>x>0).catch(()=>false);
 }
 if(!isLogin(page)){
   await page.waitForLoadState('networkidle',{timeout:10000}).catch(()=>{});
   await page.waitForTimeout(3500);
   const visible=await page.locator('body').innerText().then(t=>t.length).catch(()=>0);
   if(visible===0){
     report.emptyPageRetried=true;
     await page.reload({waitUntil:'domcontentloaded',timeout:30000}).catch(()=>{});
     await page.waitForTimeout(6500);
   }
 }
 report.networkStats=networkStats;
 report.pageBasics=await page.evaluate(()=>({documentReady:document.readyState,htmlBytes:document.documentElement.outerHTML.length,
   bodyMarkupLength:document.body?.innerHTML?.length||0,scriptTags:document.scripts.length,
   pageTitle:document.title.slice(0,80),rootElements:document.body?.children?.length||0})).catch(()=>null);
 report.pagePath=new URL(page.url()).pathname;
 report.loginScreen=isLogin(page);
 report.bodyTextLength=await page.locator('body').innerText().then(x=>x.length).catch(()=>0);
 report.visibleControls=await page.locator('button:visible,a[href]:visible,input:visible').count().catch(()=>0);
 report.inputFields=await inspectFields(page);
 if(report.loginScreen){
    report.status='authorization-required';
    report.authenticated=false;
    report.note=report.credentialLoginAttempted?'CrazyGames still requires login or additional verification; no game submitted.':'Saved browser session is not authenticated; configure studio email and password as GitHub secrets.';
    report.loginActions=(await viewActions(page)).slice(0,12);
 }else if(page.url().startsWith(root+'/') && report.visibleControls>0 && report.bodyTextLength>20){
    report.authenticated=true;
    report.status='studio-session-active';
    const routes=await viewActions(page);
    report.uiActions=routes.map(r=>r.text);
    report.portalRoutes=routes;
    report.submissionActionFound=routes.some(r=>/new game|submit|add game|create game|upload game/i.test(r.text));
    report.formLabels=await page.locator('label').allTextContents().then(a=>a.filter(v=>v.length<80&&/game|title|description|iframe|upload|cover|submit|category|name|instructions|controls/i.test(v)).slice(0,30)).catch(()=>[]);
    // Click only a known "new game" or "submit game" control to inspect fields.
    // No field changes, no save, and absolutely no submission here.
    const action=page.getByRole('link',{name:/^(add|new|submit|create)( a| my)? game$/i}).first();
    const fallback=page.getByRole('button',{name:/^(add|new|submit|create)( a| my)? game$/i}).first();
    const choice=await action.count()?action:fallback;
    if(await choice.count()){
       await choice.click({timeout:4500}).catch(()=>{});
       await page.waitForTimeout(1300);
       report.submissionForm={path:new URL(page.url()).pathname,fields:await inspectFields(page),
         actionLabels:(await viewActions(page)).map(x=>x.text)};
    }
 }else{
    report.status=page.url().startsWith(root+'/')?'portal-not-rendered':'unexpected-origin';
 }
 await context.close();
}catch(e){
 report.status='inspection-error';
 report.errorCategory=/timeout/i.test(String(e.message))?'timeout':'navigation-error';
 // Suppress URL and stack traces: browser URLs might carry auth tokens.
}finally{
 await browser.close();
 fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
}
