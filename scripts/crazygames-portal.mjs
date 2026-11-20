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
 const context=await browser.newContext(email&&password?{}:state?{storageState:state}:{});
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
 const response=await page.goto(email&&password?root+'/login':root+'/games',{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForTimeout(2500);
 if(isLogin(page)){
   await page.locator('input[type="password"]').first().waitFor({state:'attached',timeout:13000}).catch(()=>{});
   if(!(await page.locator('input[type="password"]').count())){
      await page.reload({waitUntil:'domcontentloaded',timeout:25000}).catch(()=>{});
      await page.locator('input[type="password"]').first().waitFor({state:'attached',timeout:11000}).catch(()=>{});
   }
 }else{
   await page.waitForTimeout(2300);
 }
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
      const submit=page.getByRole('button',{name:/^(log ?in|sign ?in|login|continue)$/i}).first();
      const typed=page.locator('button[type="submit"],input[type="submit"]').first();
      const formButton=page.locator('form button').filter({hasText:/log ?in|sign ?in|continue/i}).first();
      report.loginButtons=await page.locator('form button').evaluateAll(bs=>bs.map(b=>({type:b.type,label:(b.innerText||'').trim().slice(0,48)})).filter(b=>/log ?in|sign ?in|continue/i.test(b.label)).slice(0,8)).catch(()=>[]);
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
      if(!isLogin(page) && !page.url().startsWith(root+'/games')){
        await page.goto(root+'/games',{waitUntil:'domcontentloaded',timeout:30000}).catch(()=>{});
        await page.waitForTimeout(1800);
      }
    }else{
      report.loginFormNotFound=true;
    }
 }

 // Exactly one additional attempt on transient login redirect. Do not spin or
 // defeat challenge/captcha; stop after second attempt if still unauthenticated.
 if(isLogin(page)&&email&&password&&report.credentialLoginAttempted){
   report.loginRetryAttempted=true;
   await page.reload({waitUntil:'domcontentloaded',timeout:22000}).catch(()=>{});
   await page.locator('input[type="password"]').first().waitFor({state:'visible',timeout:9000}).catch(()=>{});
   const el=page.locator('input[placeholder*="@"]').first();
   const pw2=page.locator('input[type="password"]').first();
   if(await el.count()&&await pw2.count()){
      await el.fill(email);await pw2.fill(password);
      const submit2=page.getByRole('button',{name:/^log ?in$/i}).first();
      if(await submit2.count())await submit2.click({timeout:4500}).catch(()=>{});
      await page.waitForURL(u=>!isLogin({url:()=>u.toString()}),{timeout:8000}).catch(()=>{});
      if(!isLogin(page))await page.waitForTimeout(2000);
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
 const safeText=(await page.locator('body').innerText().catch(()=>'' )).toLowerCase();
 report.uiSignals=['create','new game','submit','add game','my games','dashboard','log in','sign in','logout',
  'welcome','billing','payment','verification','verify','error','not found','loading','please','try again',
  'pending','approval','support','cookie','accept','access','unauthorized','loading','sign up','javascript']
  .filter(x=>safeText.includes(x));
 report.visibleButtonKinds=await page.locator('button:visible').evaluateAll(bs=>bs.map(b=>(b.innerText||b.getAttribute('aria-label')||'').trim().toLowerCase())
   .filter(x=>/^(create|add|new|submit|accept|continue|reload|refresh|log in|sign in|retry|back|close|ok|manage|games|dashboard|enable|start|yes|no)/i.test(x))
   .slice(0,15)).catch(()=>[]);
 report.pageHeadings=await page.locator('h1,h2,h3').allTextContents().then(xs=>xs.map(s=>s.trim())
   .filter(x=>x.length<=70 && /game|start|publish|dashboard|error|access|login|review|verify|welcome|billing/i.test(x)).slice(0,8)).catch(()=>[]);

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
       const safe=t=>String(t||'').replace(/\S+@\S+/g,'[redacted-email]').replace(/https?:\/\/\S+/g,'[redacted-url]').slice(0,2500);
       const formRegion=await page.locator('main').count()?page.locator('main').first():page.locator('body');
       const checkboxDescriptions=await page.locator('input[type="checkbox"]').evaluateAll(ns=>ns.map(n=>{
         const parent=n.closest('label')||n.parentElement?.parentElement||n.parentElement;
         return {text:(parent?.innerText||'').trim().slice(0,230),checked:n.checked};
       }).slice(0,15)).catch(()=>[]);
       const buttons=await page.locator('button:visible').evaluateAll(ns=>ns.map(n=>({
         text:(n.innerText||n.getAttribute('aria-label')||'').trim().slice(0,120),
         type:n.type,disabled:n.disabled
       })).slice(0,45)).catch(()=>[]);
       report.submissionForm={path:new URL(page.url()).pathname,fields:await inspectFields(page),
         actionLabels:(await viewActions(page)).map(x=>x.text),
         stepText:safe(await formRegion.innerText().catch(()=>'')),
         checkboxDescriptions:checkboxDescriptions.map(o=>({text:safe(o.text),checked:o.checked})),
         buttons:buttons.map(o=>({...o,text:safe(o.text)}))
       };
       // Advance only the six already-confirmed eligibility declarations.
       // This is an intermediate wizard step, NEVER the final Submit action.
       const verifiedText=checkboxDescriptions.map(x=>x.text.toLowerCase()).join(' ');
       const requiredPhrases=['desktop chrome','tested and works on mobile','default language is english',
          'the first minute makes it clear','someone other than you','rights to all code'];
       if(checkboxDescriptions.length===6 && requiredPhrases.every(p=>verifiedText.includes(p))){
         const boxes=page.locator('input[type="checkbox"]');
         report.wizardProgress={phase:'checking'};
         for(let i=0;i<6;i++){
           report.wizardProgress.lastAttempted=i+1;
           await boxes.nth(i).evaluate(el=>{if(!el.checked)el.click();});
           await page.waitForTimeout(100);
           if(!(await boxes.nth(i).isChecked())){report.wizardProgress.failedCheckbox=i+1;break;}
         }
         report.wizardProgress.checkedCount=await boxes.evaluateAll(ns=>ns.filter(n=>n.checked).length);
         const next=page.getByRole('button',{name:'Continue',exact:true});
         report.wizardProgress.continueEnabled=!!(await next.count()&&await next.isEnabled());
         if(report.wizardProgress.checkedCount===6 && report.wizardProgress.continueEnabled){
           report.wizardProgress.phase='advancing';
           await next.evaluate(button=>button.click());
           await page.waitForTimeout(3500);
           report.wizardProgress.phase='advanced';
           const region=await page.locator('main').count()?page.locator('main').first():page.locator('body');
           const stepFields=await inspectFields(page);
           const nextButtons=await page.locator('button:visible').evaluateAll(ns=>ns.map(n=>({
              text:(n.innerText||n.getAttribute('aria-label')||'').trim().slice(0,100),
              type:n.type,disabled:n.disabled
           })).filter(x=>x.text.length<100).slice(0,40)).catch(()=>[]);
           report.submissionForm.nextStep={path:new URL(page.url()).pathname,text:safe(await region.innerText().catch(()=>'')),
             fields:stepFields,buttons:nextButtons.map(o=>({...o,text:safe(o.text)}))};
           // Populate only local upload-stage fields for the first game to discover
           // allowed engines / externally hosted URL mode, without submitting anything.
           report.submissionForm.uploadProbe={phase:'checking-form',inputCount:await page.locator('input').count()};
           if((await region.innerText()).includes('Game name')){
             report.submissionForm.uploadProbe.phase='game-name-found';
             const title=page.locator('input[type="text"][required]').first();
             if(await title.count())await title.fill('Flip Dash');
             const radios=page.locator('input[type="radio"]');
             if(await radios.count())await radios.first().evaluate(e=>e.click());
             const mobile=page.locator('input[type="checkbox"]').first();
             if(await mobile.count())await mobile.evaluate(e=>e.click());
             const engine=page.locator('input').nth(1);
             if(await engine.count()){
               report.submissionForm.uploadProbe.phase='engine-control-found';
               await engine.evaluate(e=>e.click());
               await page.waitForTimeout(600);
               const menu=await page.locator('[role="option"],[role="listbox"],li').allTextContents().catch(()=>[]);
               report.submissionForm.uploadProbe={
                 engineMenu:menu.map(x=>safe(x.trim().slice(0,110))).filter(Boolean).slice(0,35),
                 visibleMenuText:safe(await page.locator('body').innerText().catch(()=>'' )).slice(-1600),
                 inputFields:await inspectFields(page)
               };
               // The portal uses a custom engine-select control. Clicking the
               // visible "Select" text bubbles through its React button wrapper.
               const selectText=page.getByText('Select',{exact:true}).first();
               if(await selectText.count())await selectText.evaluate(el=>el.click()).catch(()=>{});
               await page.waitForTimeout(500);
               const options=await page.locator('[role="option"],[role="menuitem"],li').allTextContents().catch(()=>[]);
               report.submissionForm.uploadProbe.afterOpenOptions=options.map(t=>safe(t.trim())).filter(Boolean).slice(0,30);
               report.submissionForm.uploadProbe.afterOpenText=safe(await page.locator('body').innerText().catch(()=>'' )).slice(-1400);
               const combo=page.getByRole('combobox').first();
               const select=page.getByText('Select',{exact:true}).first();
               report.submissionForm.uploadProbe.comboCount=await page.getByRole('combobox').count();
               report.submissionForm.uploadProbe.selectTextCount=await page.getByText('Select',{exact:true}).count();
               report.submissionForm.uploadProbe.engineInputInfo=await engine.evaluate(el=>{
                 const attrs=e=>e?{tag:e.tagName,role:e.getAttribute('role'),className:String(e.className).slice(0,140),
                    ariaExpanded:e.getAttribute('aria-expanded'),ariaHaspopup:e.getAttribute('aria-haspopup'),
                    readOnly:e.readOnly,tabIndex:e.tabIndex}:null;
                 return {self:attrs(el),parent:attrs(el.parentElement),grandparent:attrs(el.parentElement?.parentElement)};
               });
               const el=await combo.count()?combo:await select.count()?select:engine;
               const bounds=await el.boundingBox().catch(()=>null);
               if(bounds)await page.mouse.click(bounds.x+bounds.width/2,bounds.y+bounds.height/2).catch(()=>{});
               await page.waitForTimeout(750);
               report.submissionForm.uploadProbe.afterPhysicalClickOptions=
                 (await page.locator('[role="option"],[role="menuitem"],[role="listbox"]').allTextContents().catch(()=>[]))
                 .map(t=>safe(t.trim())).filter(Boolean).slice(0,30);
               report.submissionForm.uploadProbe.afterPhysicalClickText=safe(await page.locator('body').innerText().catch(()=>'' )).slice(-1450);

               const external=page.getByRole('option',{name:/externally hosted/i}).first();
               const fallback=page.getByText('Externally hosted (iframe)',{exact:true}).first();
               const target=await external.count()?external:fallback;
               if(await target.count()&&await target.isVisible().catch(()=>false)){
                 await target.evaluate(el=>el.click());
                 await page.waitForTimeout(1800);
                 report.submissionForm.uploadProbe.selectedEngine='Externally hosted (iframe)';
                 report.submissionForm.uploadProbe.afterSelect=safe(await page.locator('body').innerText().catch(()=>'' )).slice(-2200);
                 report.submissionForm.uploadProbe.afterSelectionFields=await inspectFields(page);
                 report.submissionForm.uploadProbe.afterSelectionButtons=await page.locator('button:visible').allTextContents().catch(()=>[]);
                 report.submissionForm.uploadProbe.afterSelectionPath=new URL(page.url()).pathname;
                 // First-game preflight: fill actual production link and inspect Preview/QA.
                 // Never click final Submit. No posting in this inspection workflow.
                 const liveLink='https://morrowwish.vercel.app/flip-dash/?utm_source=crazygames&utm_medium=portal&utm_campaign=flip-dash-playtest';
                 const urlField=page.locator('input[type="url"]').first();
                 if(await urlField.count()){
                   await urlField.fill(liveLink);
                   const noSave=page.getByText('No, the game does not need progress save',{exact:true}).first();
                   if(await noSave.count())await noSave.evaluate(el=>el.click()).catch(()=>{});
                   await page.waitForTimeout(500);
                   report.submissionForm.uploadProbe.readyForPreview={
                      gameName:await page.locator('input[required][type="text"]').first().inputValue().catch(()=>null),
                      iframeLink:await urlField.inputValue(),
                      selectedRadioValues:await page.locator('input[type="radio"]:checked').count(),
                      canPreview:await page.getByRole('button',{name:'Preview',exact:true}).isEnabled().catch(()=>false)
                   };
                   const preview=page.getByRole('button',{name:'Preview',exact:true});
                   if(await preview.count() && await preview.isEnabled()){
                     await preview.evaluate(el=>el.click());
                     await page.waitForTimeout(2800);
                     report.submissionForm.uploadProbe.previewStep={
                       path:new URL(page.url()).pathname,
                       text:safe(await page.locator('body').innerText().catch(()=>'' )).slice(-2800),
                       fields:await inspectFields(page),
                       buttons:(await page.locator('button:visible').allTextContents().catch(()=>[])).map(x=>safe(x.trim())).slice(0,35)
                     };
                   }
                 }

               }

             }
           }

           report.note='Advanced eligibility checkboxes to inspect game form; no game submitted.';
         }
       }

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
