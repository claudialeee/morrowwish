// One-time local setup for unattended GitHub Actions publishing.
// Opens a normal interactive Chromium session. Never prints or commits cookies.
// Requires: npm install --no-save playwright@1.56.1 ; uses the already-installed Google Chrome (no Playwright Chromium download)
// Also requires GitHub CLI "gh" authenticated with permission to edit repo secrets.
import {chromium} from 'playwright';
import {spawnSync} from 'node:child_process';
import readline from 'node:readline/promises';
import process from 'node:process';

const portal=(process.argv[2]||'').toLowerCase();
const sites={
  itch:{url:'https://itch.io/dashboard',secret:'ITCH_STORAGE_STATE_B64',expected:'morrowwishgames'},
  crazy:{url:'https://developer.crazygames.com/games',secret:'CRAZY_STORAGE_STATE_B64',expected:'Morrow Wish'}
};
if(!sites[portal]){console.error('Usage: node scripts/authorize-portals.mjs itch|crazy');process.exit(2);}
if(portal==='itch'){
  console.log('itch.io is currently blocking automated Chrome login via anti-bot verification.');
  console.log('Do not retry this Playwright login flow. Use your regular browser for account login.');
  console.log('Open: https://itch.io/dashboard');
  console.log('For existing-project build updates, use the supported itch.io Butler credentials: https://itch.io/docs/butler/login.html');
  console.log('Official Butler cannot create new itch.io game project pages.');
  process.exit(0);
}
const info=sites[portal];
const browser=await chromium.launch({headless:false,channel:'chrome'});
const context=await browser.newContext();
const page=await context.newPage();
try{
  await page.goto(info.url,{waitUntil:'domcontentloaded',timeout:30000});
  console.log('\nSign in to your '+portal+' studio account using this normal browser window.');
  const prompt=readline.createInterface({input:process.stdin,output:process.stdout});
  await prompt.question('When you can see the '+info.expected+' dashboard, press Enter here: ');
  prompt.close();
  if(page.url().includes('login')||page.url().includes('signin'))throw Error('Dashboard is not signed in.');
  const body=await page.locator('body').innerText();
  if(!body.toLowerCase().includes(info.expected.toLowerCase()))throw Error('Wrong account. Expected '+info.expected+'.');
  const state=JSON.stringify(await context.storageState());
  const value=Buffer.from(state,'utf8').toString('base64');
  const r=spawnSync('gh',['secret','set',info.secret,'--repo','claudialeee/morrowwish'],{
    input:value,encoding:'utf8',stdio:['pipe','inherit','inherit']
  });
  if(r.error)throw Error('GitHub CLI is required: install gh, then run gh auth login.');
  if(r.status!==0)throw Error('GitHub secret upload failed. Run gh auth login and retry.');
  console.log('Authorization saved securely as GitHub Actions secret '+info.secret+'.');
  console.log('No password or browser token was printed or checked into Git.');
}finally{await browser.close();}
