// Mandatory real-browser release gate: page-level Cat Bond metrics, all seven game-page totals,
// and separate homepage/sitewide totals must remain correct in the actual dashboard DOM.
// Fixtures are injected into /api/summary; no credentials or real D1 events.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const historical={
  game:'cat-bond',pageviews:26,visitors:3,startedViews:8,startRate:30.8,
  starts:82,ends:79,retries:1,completion:79,abandons:3,
  signals:{
    bond_capture:73,bond_rare_encounter:4,bond_rare_capture:57,
    bond_duo_used:46,bond_yard_built:6,bond_surprise:5
  },
  visitFunnel:{pageviews:26,startedViews:8,finishedViews:7},
  conversion:{pageviews:0,startedViews:0,finishedViews:0}
};
const oldCount={
  zh:[['成功捕获',73],['捕获稀有猫',57],['触发双猫合击',46]],
  en:[['Cats captured',73],['Rare cats captured',57],['Duo attacks used',46]]
};
const sample=mixed=>{
 const base=mixed?{
  ...historical,
  pageviews:121,
  visitFunnel:{pageviews:121,startedViews:8,finishedViews:7},
  conversion:{pageviews:4,startedViews:3,finishedViews:2},
  signals:{...historical.signals,bond_battle_start_v2:3,bond_battle_end_v2:2,
    bond_capture_v2:2,bond_rare_attempt_v2:1,bond_rare_capture_v2:1,
    bond_region_yard_start_v2:2,bond_region_yard_end_v2:2}
 }:historical;
 return base;
};
const promoGames=['cat-bond','pawsibly-innocent','tiny-town','elsewhere','flip-dash','parcel-panic','pocket-aquarium'];
const browser=await chromium.launch({headless:true});
try{
 for(const language of ['zh','en'])for(const mixed of [false,true])
 for(const viewport of [{width:390,height:844},{width:1365,height:900}]){
  const context=await browser.newContext({viewport});
  const page=await context.newPage();
  const exceptions=[];
  page.on('pageerror',error=>exceptions.push(error.message));
  const row={...sample(mixed),headlineMetrics:mixed?{uniqueBrowsers:43,avgSessionSeconds:92,shareClicks:0,d1Eligible:10,d1Returned:3}:null};
  const auditedPV=mixed?121:26;
  const otherGames=[
   {game:'pawsibly-innocent',pageviews:28,retries:14,visitFunnel:{pageviews:28,startedViews:9,finishedViews:6}},
   {game:'tiny-town',pageviews:19,retries:6,headlineMetrics:{uniqueBrowsers:11,avgSessionSeconds:35,shareClicks:2,d1Eligible:5,d1Returned:1},visitFunnel:{pageviews:19,startedViews:7,finishedViews:2}},
   {game:'elsewhere',pageviews:16,retries:0,visitFunnel:{pageviews:16,startedViews:1,finishedViews:1}},
   {game:'flip-dash',pageviews:5,retries:0},
   {game:'parcel-panic',pageviews:11,retries:1,visitFunnel:{pageviews:11,startedViews:4,finishedViews:1}},
   {game:'pocket-aquarium',pageviews:12,retries:0}
  ];
  const gamePageviews=auditedPV+otherGames.reduce((n,x)=>n+x.pageviews,0);
  const homepagePageviews=134;
  const sitewidePageviews=gamePageviews+homepagePageviews;
  const hub={game:'hub',pageviews:homepagePageviews,retries:0};
  const summary={
   updated:'2026-11-23T23:56:00.000Z',from:'2026-11-22T08:00:00.000Z',days:2,records:50,
   rollup:{pageviews:sitewidePageviews,starts:148,ends:110,retries:22,headlineMetrics:mixed?{uniqueBrowsers:43,avgSessionSeconds:92,shareClicks:0,d1Eligible:10,d1Returned:3}:{uniqueBrowsers:null,avgSessionSeconds:null,shareClicks:null,d1Eligible:0,d1Returned:0}},
   byGame:[row,...otherGames,hub],byDay:[],byChannel:[],homeFunnel:{},socialPulse:{
    platforms:[{id:'youtube',published:7,views:null},{id:'instagram',published:7,views:null},
      {id:'tiktok',published:7,views:null},{id:'bluesky',published:7,views:null},{id:'itch',published:7,views:null}],
    metricScope:{verifiedPosts:[{platform:'youtube',game:'cat-bond',url:'https://example.com/current',publicVerified:true,approved:true,checkedAt:'2026-11-24T18:00:00Z',views:31}],activeApprovedPosts:1},
    publicationRounds:{rounds:[{
     id:'morning-first',status:'deleted',deletedWindow:'2026-11-22',
     platforms:{
      youtube:{posts:7,views:458,likes:4,comments:0,capturedAt:'2026-11-22T14:14:13-08:00'},
      instagram:{posts:7,views:363,likes:11,comments:0,capturedAt:'2026-11-22T13:05:00-08:00'},
      tiktok:{posts:7,views:94,likes:1,comments:0,capturedAt:'2026-11-22T13:05:00-08:00'},
      bluesky:{posts:7,views:null,likes:14,reposts:14,replies:0,quotes:0,capturedAt:'2026-11-22T14:14:13-08:00'}
     },
     posts:Array.from({length:28},(_,index)=>({
      platform:['youtube','instagram','tiktok','bluesky'][Math.floor(index/7)],
      game:promoGames[index%7],url:'https://example.com/first-round/'+index,
      views:index===0?13:null,likes:0,comments:0,shares:0,reposts:0,replies:0,quotes:0,
      capturedAt:'2026-11-22T14:14:13-08:00'
     }))
    }]}
   }
  };
  let requestedSummaryUrl='',requestedStoryUrl='';
  await page.route('**/api/summary*',route=>{
   requestedSummaryUrl=route.request().url();
   const params=new URL(requestedSummaryUrl).searchParams;
   const selected=params.has('startDate');
   const result=selected?{...summary,rollup:{...summary.rollup,pageviews:7},byGame:[{
    game:'tiny-town',pageviews:7,retries:0,headlineMetrics:{uniqueBrowsers:5,avgSessionSeconds:18,shareClicks:0,d1Eligible:2,d1Returned:0},visitFunnel:{pageviews:7,startedViews:3,finishedViews:1}
   }],range:{start:params.get('startDate'),end:params.get('endDate'),timeZone:'America/Los_Angeles'}}:summary;
   return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(result)});
  });
  await page.route('**/api/elsewhere-summary*',route=>{
   requestedStoryUrl=route.request().url();
   const p=new URL(requestedStoryUrl).searchParams;
   return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({summary:{},range:{start:p.get('startDate'),end:p.get('endDate'),timeZone:'America/Los_Angeles'}})});
  });
  try{
   await page.goto('http://127.0.0.1:8765/studio-insights/?lang='+language,{
    waitUntil:'domcontentloaded',timeout:15000
   });
   await page.locator('#report:not([hidden])').waitFor({timeout:12000});
   assert.equal(new URL(requestedSummaryUrl).searchParams.get('from'),'2026-11-22T08:00:00.000Z',
      'Dashboard must request the full fixed Pacific-time reporting window');
   const statLabels=await page.locator('#stats .stat .label').allTextContents();
   assert.equal(statLabels[0],language==='zh'?'全站页面浏览量':'All pageviews',
     'Overall pageviews must be the first headline metric');
   assert.equal(statLabels[1],language==='zh'?'网站首页浏览量':'Homepage views',
     'Homepage views must immediately follow overall pageviews');
   const statValues=await page.locator('#stats .stat .big').allTextContents();
   assert.equal(statValues[0],String(sitewidePageviews),
     'Sitewide pageviews must include homepage and all seven games');
   assert.equal(statValues[1],String(homepagePageviews),
     'Homepage pageviews must be displayed separately');
   assert.equal(statLabels.length,2,'Only website traffic KPIs are allowed above per-game metrics');
   const archive=page.locator('#archived-first-round');
   assert.equal(await archive.isVisible(),true,'Deleted first-round archive disclosure must remain visible');
   assert.equal(await archive.evaluate(el=>el.open),false,'Deleted history must be collapsed on initial load');
   assert.equal(await archive.locator('#archived-first-round-heading').innerText(),
     language==='zh'?'11/22 早间首发 · 已删除数据':'Nov 22 morning first release · deleted archive',
     'First-round archive heading must be localized');
   assert.equal(await archive.locator('#archived-first-round-posts').isVisible(),false,
     'Archived post details must remain hidden while the outer archive is collapsed');
   await archive.locator('summary').first().click();
   assert.equal(await archive.evaluate(el=>el.open),true,'Archive should expand on demand');
   assert.equal(await archive.locator('#archived-first-round-rows tr').count(),4,
     'First-round platform totals must retain all four native platforms');
   assert.equal(await archive.locator('#archived-first-round-posts tr').count(),7,
     'First-round archive must render seven games in the matching layout');
   assert.equal(await archive.locator('#archived-first-round-posts a').count(),28,
     'First-round archive must retain all 28 individual video records');
   assert.deepEqual(await archive.locator('#archived-first-round-posts').locator('..').locator('thead th').allTextContents(),
     [language==='zh'?'游戏':'Game','YouTube','Instagram','TikTok','Bluesky'],
     'Archive uses the same game and platform columns as current native metrics');
   const archiveHeaders=await archive.locator('table').first().locator('thead th').allTextContents();
   assert.equal(archiveHeaders[0],language==='zh'?'平台':'Platform',
     'First-round archive table headings must be localized');
   const postDetails=archive.locator('details').first();
   assert.equal(await postDetails.evaluate(el=>el.open),false,'Individual deleted video records must also start collapsed');
   await postDetails.locator('summary').click();
   assert.ok((await page.locator('#archived-first-round-posts a').first().innerText()).includes(language==='zh'?'播放 13':'Views 13'),
     'Archived post shows localized native metrics');
   assert.equal(await page.locator('#archived-first-round-posts a').first().getAttribute('href'),'https://example.com/first-round/0',
     'Archived metrics retain original post link');
   assert.equal(await page.locator('#games-total').count(),0,'Seven-game aggregate row must be removed');
   assert.equal(await page.locator('#games tfoot').count(),0,'Game table must not render a totals footer');
   assert.equal(await page.locator('#games tr').count(),8,'Seven existing games plus the independent Starbell preview must remain');
   const previewRow=page.locator('#games tr').first();
   assert.equal(await previewRow.locator('a').getAttribute('href'),'https://cat-bond-preview.morrowwish.pages.dev/cat-bond/','Starbell must be first and use the separate preview URL');
   assert.ok((await previewRow.locator('td').allTextContents()).slice(1).every(x=>x.trim()===''),'Unobserved Starbell data stays blank');
   const visibleText=await page.locator('body').innerText();
   assert.ok(!/统计起点：11\/22 00:00|Since Nov 22, 2026, 12:00 AM PT/.test(visibleText),
     'Reporting start date must not be shown in the dashboard');
   assert.deepEqual(exceptions,[],'Dashboard JS exceptions: '+exceptions.join('; '));
   const gameRow=page.locator('#games tr').filter({
    has:page.locator('a[href="/cat-bond/"]')
   });
   assert.equal(await gameRow.count(),1,'Cat Bond game row missing');
   const cells=(await gameRow.locator('td').allTextContents())
    .map(s=>s.trim().replace(/\s+/g,' '));
   assert.equal(cells[1],String(auditedPV),'Main table PV must use full D1 aggregate');
   assert.equal(cells[2],'8','Main-table Play count must be page visits that entered gameplay, not raw battles');
   assert.equal(cells[3],'7','Main-table Finish count must be page visits with a result screen');
   assert.equal(cells[4],'1','Historical replay total erased');
   assert.deepEqual(cells.slice(5,8),[mixed?'8 / 121 · 6.6%':'8 / 26 · 30.8%',
    '7 / 8 · 87.5%',mixed?'7 / 121 · 5.8%':'7 / 26 · 26.9%'],
    'Visit conversion must be deduplicated, not raw battle totals');
   assert.deepEqual(cells.slice(8),mixed?['43',language==='zh'?'92 秒':'92 sec','30%','0']:['','','',''],'Cat Bond metrics are independent and preserve observed zero');
   const townRow=page.locator('#games tr').filter({has:page.locator('a[href="/tiny-town/"]')});
   assert.deepEqual((await townRow.locator('td').allTextContents()).slice(8),['11',language==='zh'?'35 秒':'35 sec','20%','2'],'Tiny Town has its own metrics, not Cat Bond or website totals');
   const gameTableWrap=page.locator('#games').locator('xpath=ancestor::div[contains(@class,"table-wrap")]').first();
   assert.equal(await gameTableWrap.evaluate(el=>getComputedStyle(el).borderTopWidth),'0px',
     'Current game table must not have an outer frame');
   assert.equal(await page.locator('#video-metrics-detail').evaluate(el=>getComputedStyle(el).borderTopWidth),'0px',
     'Current native-video metrics must not have an outer frame');
   const cards=await page.locator('#focus-grid .focus-card h3 a').evaluateAll(
    nodes=>nodes.map(n=>n.getAttribute('href')));
   assert.deepEqual(cards,[
    'https://cat-bond-preview.morrowwish.pages.dev/cat-bond/','/cat-bond/','/pawsibly-innocent/','/tiny-town/','/elsewhere/',
    '/flip-dash/','/parcel-panic/','/pocket-aquarium/'
   ],'Real browser must render all seven game worlds and the independent RPG preview');
   const card=page.locator('#focus-grid .focus-card').filter({has:page.locator('a[href="/cat-bond/"]')});
   const lines=(await card.locator('.focus-line').allTextContents())
    .map(s=>s.trim().replace(/\s+/g,' '));
   for(const [label,value] of oldCount[language]){
    assert.ok(lines.some(line=>line.includes(label)&&line.endsWith(String(value))),
      language+' historical Cat Bond '+label+'='+value+' is not visible');
   }
   if(mixed){
    const details=card.locator('details').first();
    assert.equal(await details.count(),1,'New V2 cohort panel missing');
    await details.evaluate(el=>el.open=true);
    const newer=(await details.locator('.focus-line').allTextContents()).join(' ');
    assert.ok(newer.includes('3 / 4 · 75%'),
      'V2 cohort must be displayed separately, not mixed into legacy');
    // The original historical values must still be visible AFTER expanding
    // the new metrics; an expandable panel may not replace the old data.
    const still=await card.locator('.focus-line').allTextContents();
    assert.ok(still.some(x=>x.includes('73')),'Legacy capture count lost on expansion');
   }else{
    assert.ok(!cells.slice(5).some(cell=>cell.includes('75%')),
      'Legacy data cannot be fabricated into an empty V2 cohort');
   }
   await page.locator('#date-preset').selectOption('custom');
   assert.equal(await page.locator('#custom-dates').isVisible(),true);
   await page.locator('#date-start').fill('2026-11-22');
   await page.locator('#date-end').fill('2026-11-23');
   await page.locator('#apply-date').click();
   await page.waitForFunction(()=>document.querySelector('#applied-range').textContent.includes('2026-11-23')&&!document.querySelector('#apply-date').disabled);
   const selectedParams=new URL(requestedSummaryUrl).searchParams;
   assert.equal(selectedParams.get('startDate'),'2026-11-22');
   assert.equal(selectedParams.get('endDate'),'2026-11-23');
   assert.equal(new URL(requestedStoryUrl).searchParams.get('startDate'),'2026-11-22');
   assert.equal(new URL(requestedStoryUrl).searchParams.get('endDate'),'2026-11-23');
   const filteredValues=await page.locator('#stats .stat .big').allTextContents();
   assert.equal(filteredValues[0],'7');
   assert.equal(filteredValues[1],'','Missing homepage observations stay blank');
   assert.equal(filteredValues.length,2);
   const selectedTown=page.locator('#games tr').filter({has:page.locator('a[href="/tiny-town/"]')});
   assert.deepEqual((await selectedTown.locator('td').allTextContents()).slice(1),['7','3','1','0','3 / 7 · 42.9%','1 / 3 · 33.3%','1 / 7 · 14.3%','5',language==='zh'?'18 秒':'18 sec','0%','0']);
   assert.ok((await gameRow.locator('td').allTextContents()).slice(1).every(v=>v===''),'Other game must not borrow selected game metrics');
   assert.equal(await page.locator('#video-metrics-detail').isVisible(),false,'Native snapshot captured outside selected dates is excluded');
   assert.equal(await page.locator('#archived-first-round').isVisible(),true,'Archive snapshot inside selected dates is retained');
   const beforeInvalid=requestedSummaryUrl;
   await page.locator('#date-start').fill('2026-11-23');
   await page.locator('#date-end').fill('2026-11-22');
   await page.locator('#apply-date').click();
   assert.equal(requestedSummaryUrl,beforeInvalid,'Inverted range must never query the API');
   await page.locator('#date-start').fill('2026-11-24');
   await page.locator('#date-end').fill('2026-11-24');
   await page.locator('#apply-date').click();
   await page.waitForFunction(()=>document.querySelector('#applied-range').textContent.includes('2026-11-24')&&!document.querySelector('#apply-date').disabled);
   assert.equal(await page.locator('#archived-first-round').isVisible(),false,'Out-of-range archive is excluded');
   assert.equal(await page.locator('#video-metrics-detail').isVisible(),true,'In-range native snapshot is shown');
   assert.ok((await page.locator('#video-detail-rows').innerText()).includes('31'));
   await page.locator('#date-preset').selectOption('all');
   await page.locator('#apply-date').click();
   await page.waitForFunction(()=>!document.querySelector('#apply-date').disabled&&document.querySelector('#stats .stat .big').textContent!=='7');
   assert.equal(new URL(requestedSummaryUrl).searchParams.has('startDate'),false);
   assert.equal((await page.locator('#stats .stat .big').allTextContents())[0],String(sitewidePageviews));
   assert.deepEqual(exceptions,[],'Page errors after rendering and interaction');
  }finally{
   await context.close();
  }
 }
}finally{
 await browser.close();
}
console.log('Real Chromium dashboard gate passed: page-level play/finish, seven individual game rows, no aggregate row, flat current tables, and a collapsed bilingual 28-post deleted-history archive on phone and desktop.');
