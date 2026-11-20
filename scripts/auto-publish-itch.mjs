// Morrow Wish: unattended itch.io project creation after a verified production release.
// Browser automation is required because Butler cannot create a game/project page.
// Does not bypass login, CAPTCHA, reviews or platform rate limits.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {publishedGames, trackedLink} from './discovery.mjs';
import {chromium} from 'playwright';

const ROOT=process.cwd();
const STUDIO='morrowwishgames';
const HOST='https://'+STUDIO+'.itch.io';
const STATE=process.env.ITCH_STORAGE_STATE_B64||'';
const report=[];
const LEDGER=JSON.parse(fs.readFileSync('promotion/ledger.json','utf8'));
const alreadyVerified=new Set(LEDGER.games.filter(g=>g.channels?.itch?.status==='published' && g.channels.itch.publicUrl).map(g=>g.slug));
const write=(status,game,details)=>{report.push({status,slug:game.slug,details});console.log('itch.io '+game.slug+': '+status+' — '+details);};
const short=s=>String(s).replace(/[\n\r]+/g,' ').replace(/\s+/g,' ').trim();
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const htmlEsc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mappedName=g=>({'tiny-town':'Tiny Town','cat-bond':'Cat Bond','pawsibly-innocent':'Pawsibly Innocent!','elsewhere':'Elsewhere'}[g.slug]||g.title);
const slogans={'cat-bond':'RAISE CATS. MAKE FRIENDS.','pawsibly-innocent':'A LITTLE CAT. BIG TROUBLE.','elsewhere':'ONE MORE LIFE TO LIVE.','tiny-town':'BUILD A TOWN. LIVE FREE.','pocket-aquarium':'A LITTLE WORLD UNDERWATER.','parcel-panic':'SORT FAST. STAY SHARP.','flip-dash':'ONE MORE JUMP.'};
const exists=f=>fs.existsSync(path.join(ROOT,f));
const coverSource=g=>[
  'public/art/'+g.slug+'-editorial.webp',
  'public/art/'+g.slug+'-cozy.webp',
  'public/art/'+g.slug+'-scene.svg',
  'public/promo/'+g.slug+'/cover-landscape.png',
  'public/promo/'+g.slug+'/cover-square.png',
  'public/social/'+g.slug+'.png',
].find(exists);
async function coverFor(browser,g,tmp){
  const p=coverSource(g);if(!p)throw Error('No game artwork. Need a promotional cover before publication.');
  const bytes=fs.readFileSync(path.join(ROOT,p));
  const mime=p.endsWith('.webp')?'image/webp':p.endsWith('.svg')?'image/svg+xml':'image/png';
  const data='data:'+mime+';base64,'+bytes.toString('base64');
  const cover=await browser.newPage({viewport:{width:1260,height:1000},deviceScaleFactor:1});
  await cover.setContent('<style>*{box-sizing:border-box}body{margin:0;background:#ddd;font-family:Arial,Helvetica,sans-serif}.art{width:1260px;height:1000px;background:linear-gradient(to top,rgba(18,18,27,.85),transparent 47%),url("'+data+'") center/cover no-repeat;position:relative}.brand{position:absolute;top:38px;left:38px;background:#171820;border-radius:18px;color:white;font-size:32px;font-weight:800;padding:14px 24px}.bottom{position:absolute;bottom:45px;left:55px;right:48px;color:white}.title{font-weight:900;font-size:108px;line-height:1.08;letter-spacing:-2px;text-shadow:0 4px 0 #1c1523,0 0 8px #1c1523}.sub{font-size:30px;font-weight:800;margin-top:22px;letter-spacing:1px;text-shadow:0 3px 5px #000}</style><div class="art"><div class="brand">MORROW WISH</div><div class="bottom"><div class="title">'+htmlEsc(mappedName(g).toUpperCase())+'</div><div class="sub">'+htmlEsc(slogans[g.slug]||'PLAY. EXPLORE. DISCOVER.')+'</div></div></div>');
  await cover.evaluate(()=>document.fonts.ready);
  const out=path.join(tmp,g.slug+'-cover.png');await cover.screenshot({path:out});await cover.close();return out;
}
function createEmbeddedHTML(g,tmp){
  // A real, interactive game is loaded from the already verified canonical production
  // host. This preserves dynamic game updates and existing telemetry, not a static image.
  const url=trackedLink(g,'itch','portal');
  const content='<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>'+htmlEsc(mappedName(g))+'</title><style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#151b20}iframe{border:0;display:block;width:100%;height:100%;background:#151b20}</style></head><body><iframe src="'+htmlEsc(url)+'" title="'+htmlEsc(mappedName(g))+'" allow="fullscreen; autoplay; gamepad" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></body></html>';
  const dir=path.join(tmp,g.slug);fs.mkdirSync(dir,{recursive:true});
  const file=path.join(dir,'index.html');fs.writeFileSync(file,content);
  // itch.io HTML Game projects expect an uploadable ZIP with index.html at its root.
  const zip=path.join(tmp,g.slug+'.zip');
  execFileSync('zip',['-q','-j',zip,'index.html'],{cwd:dir});
  return zip;
}
async function first(page,selectors){
  for(const s of selectors){const l=page.locator(s).first();if(await l.count())return l;}
  return null;
}
async function fill(page,selectors,text,required=false){
  const l=await first(page,selectors);
  if(!l){if(required)throw Error('Missing required form field: '+selectors.join(' / '));return false;}
  await l.fill(text,{timeout:8000});return true;
}
async function clickAny(page,selectors,required=false){
  for(const s of selectors){let l;try{l=page.locator(s).first();if(await l.count()&&await l.isVisible()){await l.click({timeout:8000});return true;}}catch(e){if(required)console.warn('UI control changed: '+s+' — '+e.message.slice(0,100));}}
  if(required)throw Error('Missing required action: '+selectors.join(' / '));return false;
}
async function projectExists(page,slug){
  const target=HOST+'/'+slug;
  const res=await page.goto(target,{waitUntil:'domcontentloaded',timeout:20000}).catch(()=>null);
  if(!res||res.status()!==200)return false;
  const title=await page.title();
  const url=new URL(page.url());
  if(url.hostname!==STUDIO+'.itch.io'||url.pathname.replace(/\/$/,'')!=='/'+slug)return false;
  if(/not found|404|page isn't available/i.test(title))return false;
  const body=(await page.locator('body').innerText()).slice(0,1600);
  if(/this page isn't available|could not be found/i.test(body))return false;
  return title.toLowerCase().includes(slug.replaceAll('-',' ').toLowerCase()) ||
    await page.locator('.game_info_panel_widget, .game_title, #game_drop, .game_frame, .game_page').count()>0;
}
async function publish(browser,ctx,page,g,tmp){
  const target=HOST+'/'+g.slug;
  if(alreadyVerified.has(g.slug)){write('already-live',g,target);return;}
  if(await projectExists(page,g.slug)){write('project-exists',g,'A private or public project with this URL already exists; do not create a duplicate. Check visibility: '+target);return;}
  const cover=await coverFor(browser,g,tmp);
  const html=createEmbeddedHTML(g,tmp);
  await page.goto('https://itch.io/game/new',{waitUntil:'domcontentloaded',timeout:30000});
  if(/login|register/i.test(new URL(page.url()).pathname)||!(await page.locator('form').count()))throw Error('itch.io session expired: one-time authorization needs renewal.');
  await fill(page,['#game_title','input[name="game[title]"]','input[name="title"]','input[placeholder*="title" i]'],mappedName(g),true);
  await fill(page,['#game_url','input[name="game[slug]"]','input[name="game[url]"]','input[name="slug"]'],g.slug);
  await fill(page,['#game_short_text','input[name="game[short_text]"]','textarea[name="game[short_text]"]'],short(g.description).slice(0,180));
  // The two dropdowns have different semantics: classification=game, kind=HTML5.
  const type=await first(page,['select[name="game[classification]"]','select[name="game[type]"]','#game_classification']);
  if(type){const opts=await type.locator('option').evaluateAll(xs=>xs.map(x=>({v:x.value,t:x.textContent})));const o=opts.find(x=>/^game$/i.test(x.t.trim()));if(o)await type.selectOption(o.v);}
  const kind=await first(page,['select[name="game[kind]"]','#game_kind','select[name="game[embed_type]"]']);
  if(kind){const opts=await kind.locator('option').evaluateAll(xs=>xs.map(x=>({v:x.value,t:x.textContent})));const o=opts.find(x=>/html/i.test(x.t));if(o)await kind.selectOption(o.v);}
  await clickAny(page,['label:has-text("HTML"),text="HTML — You have a ZIP or HTML file"'],false);
  await fill(page,['textarea[name="game[description]"]','#game_description'],'Raise adorable cats, build friendships and explore a world full of feline companions.\n\nPlay free in your browser. No account required.\n\nOfficial website: '+g.url);
  const upload=await first(page,[
    'input[type=file][name*="upload" i]','input[type=file][name*="file" i]','#game_uploads input[type=file]','.uploads input[type=file]'
  ]);
  if(!upload)throw Error('No HTML-game upload input detected. Do not create an empty listing.');
  await upload.setInputFiles(html,{timeout:15000});
  const coverInput=await first(page,['input[type=file][name*="cover" i]','#game_cover_file','input[type=file][accept*="image"]']);
  if(coverInput)await coverInput.setInputFiles(cover,{timeout:15000});
  else throw Error('Cannot locate cover upload. Refusing to publish a coverless project.');
  await delay(3000);
  // New itch.io pages begin private. Save first, then explicitly set Public.
  await clickAny(page,['button:has-text("Save & view page")','input[type=submit][value*="Save"]','button:has-text("Save")'],true);
  await page.waitForLoadState('domcontentloaded',{timeout:20000}).catch(()=>{});
  if(!page.url().includes(STUDIO+'.itch.io')&&!/\/game\/edit/i.test(page.url()))throw Error('Save did not reach an itch.io game page: '+page.url());
  await clickAny(page,['a:has-text("Edit game")','a:has-text("Edit")'],true);
  const pub=await first(page,['input[type=radio][value="public"]','input[name="game[visibility]"][value="public"]']);
  if(pub)await pub.check({timeout:6000}); else {
    const visibility=await first(page,['select[name="game[visibility]"]','#game_visibility']);
    if(visibility)await visibility.selectOption({label:/public/i}); else throw Error('Cannot set Public visibility; project remains private.');
  }
  await clickAny(page,['button:has-text("Save")','input[type=submit][value*="Save"]'],true);
  const anon=await browser.newContext();const check=await anon.newPage();
  const res=await check.goto(target,{waitUntil:'domcontentloaded',timeout:30000}).catch(()=>null);
  const good=res?.status()===200&&!/not found|404/i.test(await check.title());
  await anon.close();
  if(!good)throw Error('Project not verified publicly accessible after save: '+target);
  write('published',g,target);
}
async function main(){
  const games=publishedGames();
  if(!STATE){console.log('::notice::Missing ITCH_STORAGE_STATE_B64 — create-project automation is waiting for a one-time authorized login.');return;}
  const state=JSON.parse(Buffer.from(STATE,'base64').toString('utf8'));
  const browser=await chromium.launch({headless:true});
  const ctx=await browser.newContext({storageState:state});
  const page=await ctx.newPage();
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'morrowwish-itch-'));
  try{
    const response=await page.goto('https://itch.io/dashboard',{waitUntil:'domcontentloaded',timeout:30000});
    if(!response||/login|register/i.test(new URL(page.url()).pathname))throw Error('ITCH_STORAGE_STATE_B64 expired or wrong account.');
    const visible=await page.locator('body').innerText();
    if(!/morrowwishgames/i.test(visible))throw Error('itch.io publisher identity not verified as morrowwishgames. Aborting.');
    // Publishing all missing live games is intended. Never duplicate based on a local queue status.
    for(const g of games){
      try{await publish(browser,ctx,page,g,tmp);}
      catch(e){write('failed',g,e.message);break;} // Fail closed on CAPTCHA/UI changes.
    }
  }finally{
    await browser.close();fs.rmSync(tmp,{recursive:true,force:true});
    if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,'\n## itch.io automatic project publication\n\n'+report.map(x=>'- '+x.slug+': **'+x.status+'** — '+x.details).join('\n')+'\n');
  }
  if(report.some(r=>r.status==='failed'))process.exitCode=1;
}
main().catch(e=>{console.error('::error::itch.io publisher: '+e.message);process.exitCode=1;});
