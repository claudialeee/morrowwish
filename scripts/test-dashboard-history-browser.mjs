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
  const row=sample(mixed);
  const auditedPV=mixed?121:26;
  const otherGames=[
   {game:'pawsibly-innocent',pageviews:28,retries:14,visitFunnel:{pageviews:28,startedViews:9,finishedViews:6}},
   {game:'tiny-town',pageviews:19,retries:6,visitFunnel:{pageviews:19,startedViews:7,finishedViews:2}},
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
   rollup:{pageviews:sitewidePageviews,starts:148,ends:110,retries:22},
   byGame:[row,...otherGames,hub],byDay:[],byChannel:[],homeFunnel:{},socialPulse:{
    platforms:[{id:'youtube',published:7,views:null},{id:'instagram',published:7,views:null},
      {id:'tiktok',published:7,views:null},{id:'bluesky',published:7,views:null},{id:'itch',published:7,views:null}],
    metricScope:{verifiedPosts:[],activeApprovedPosts:28},
    
   }
  };
  let requestedSummaryUrl='';
  await page.route('**/api/summary*',route=>{
   requestedSummaryUrl=route.request().url();
   return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(summary)});
  });
  await page.route('**/api/elsewhere-summary*',route=>route.fulfill({
   status:200,contentType:'application/json',body:JSON.stringify({summary:{}})
  }));
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
   const totalCells=(await page.locator('#games-total tr td').allTextContents())
    .map(s=>s.trim().replace(/\s+/g,' '));
   assert.equal(totalCells[0],String(gamePageviews),
    'Seven-game total must include games without gameplay tracking, but exclude homepage');
   assert.equal(totalCells[1],'29','Total Play must sum page-level tracked visits');
   assert.equal(totalCells[2],'17','Total Finish must sum page-level tracked visits');
   const cards=await page.locator('#focus-grid .focus-card h3 a').evaluateAll(
    nodes=>nodes.map(n=>n.getAttribute('href')));
   assert.deepEqual(cards,[
    '/cat-bond/','/pawsibly-innocent/','/tiny-town/','/elsewhere/',
    '/flip-dash/','/parcel-panic/','/pocket-aquarium/'
   ],'Real browser must render gameplay details for ALL seven game worlds');
   const card=page.locator('#focus-grid .focus-card').first();
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
   assert.deepEqual(exceptions,[],'Page errors after rendering and interaction');
  }finally{
   await context.close();
  }
 }
}finally{
 await browser.close();
}
console.log('Real Chromium dashboard gate passed: page-level play/finish, all-seven-game pageview totals, separate homepage/sitewide totals, bilingual phone/desktop rendering.');
