// Read-only inspection of the CrazyGames developer portal via an opt-in studio
// Playwright session. Never logs cookies, token values, emails, HTML, or account PII.
// Does NOT post a game. No stealth, captcha bypass, or password handling.
import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';

const domain='https://developer.crazygames.com/games';
const data=process.env.CRAZYGAMES_STORAGE_STATE_B64;
const out=path.join(process.cwd(),'.check','crazygames','portal-inspection.json');
fs.mkdirSync(path.dirname(out),{recursive:true});
if(!data) {
 const result={checkedAt:new Date().toISOString(),status:'no-studio-session',
  authenticated:false,submissionActionFound:false,
  note:'Studio login state must be supplied as a GitHub Actions secret; account registration alone does not grant this automation access.'};
 fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');
 console.log('CrazyGames portal inspection: no authorized studio session; no changes made.');
 process.exit(0);
}
let state;
try {
 state=JSON.parse(Buffer.from(data,'base64').toString('utf8'));
 if(!Array.isArray(state.cookies)||!Array.isArray(state.origins))throw Error('Invalid storage state structure');
} catch {
 throw Error('CRAZYGAMES_STORAGE_STATE_B64 is not a valid Playwright storage-state JSON. No site was accessed.');
}
const stateSummary={cookieCount:state.cookies.length,cookieDomains:[...new Set(state.cookies.map(c=>c.domain))].slice(0,10),origins:state.origins.map(o=>({origin:new URL(o.origin).host,localStorageKeys:o.localStorage?.length||0})).slice(0,10)};
const browser=await chromium.launch({headless:true});
const report={checkedAt:new Date().toISOString(),sessionStateSummary:stateSummary,status:'inspection-incomplete',
 authenticated:false,submissionActionFound:false,formLabels:[],loginScreen:false,
 note:'No game submission or modification was attempted.'};
try {
 const context=await browser.newContext({storageState:state});
 const page=await context.newPage();
 const response=await page.goto(domain,{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForTimeout(3200);
 if(!page.url().startsWith('https://developer.crazygames.com/')) {
  report.status='unexpected-domain';
 } else {
  report.portalHttpStatus=response?.status()||null;
  const allButtons=await page.getByRole('button').allTextContents().catch(()=>[]);
  const allLinks=await page.getByRole('link').allTextContents().catch(()=>[]);
  const allVisible=[...allButtons,...allLinks].map(x=>x.trim()).filter(Boolean);
  // List only generic UI actions. Never put personal/account text or cookies in CI logs.
  const uiPattern=/\b(game|submit|upload|new|create|dashboard|project|draft|developer|publish|review|iframe)\b/i;
  report.uiActions=[...new Set(allVisible.filter(x=>x.length<100&&uiPattern.test(x)).map(x=>x.slice(0,90)))].slice(0,35);
  report.portalRoutes=await page.locator('a[href]').evaluateAll(links=>links.map(a=>{
    const label=(a.innerText||a.getAttribute('aria-label')||'').trim();
    if(!/game|submit|upload|new|create|dashboard|project/i.test(label)||label.length>100)return null;
    try{const u=new URL(a.href);return {label:label.slice(0,70),path:u.origin==='https://developer.crazygames.com'?u.pathname:'external-link'};}catch{return null;}
  }).filter(Boolean).slice(0,20)).catch(()=>[]);
  report.pagePath=new URL(page.url()).pathname;
  report.headingRoles=await page.locator('h1,h2,h3').allTextContents().then(xs=>xs.filter(v=>v.length<70&&/game|dashboard|submit|create|new|upload|welcome|login|sign in/i.test(v)).slice(0,10)).catch(()=>[]);

  const hasSubmit=allVisible.some(x=>/submit\s*(a\s*)?game|add\s*(a\s*)?game|new\s*game|create\s*(a\s*)?game|upload\s*(a\s*)?game|my games/i.test(x));
  const signIn=allVisible.some(x=>/^(sign\s*in|log\s*in|login|create\s*account)$/i.test(x));
  report.loginScreen=signIn;
  report.submissionActionFound=hasSubmit;
  report.authenticated=!signIn && (hasSubmit || (report.pagePath?.startsWith('/games') && (report.uiActions?.some(x=>/game|project|dashboard/i.test(x)))));
  report.status=report.authenticated?'studio-session-active':'authorization-or-portal-ui-unconfirmed';
  // Only whitelisted UI labels; never copy personal information into CI artifacts.
  const labels=await page.locator('label').allTextContents().catch(()=>[]);
  report.formLabels=labels.map(s=>s.trim()).filter(x=>/^(game|iframe|host|title|description|instructions|controls|genre|engine|landscape|portrait|square|cover|preview|video|url|submit|publish)/i.test(x)).slice(0,30);
 }
 await context.close();
} finally {await browser.close();}
fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
