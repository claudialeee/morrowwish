// Mandatory real-browser release gate: historical Cat Bond metrics must remain
// visible after versioned funnels are added. This uses the ACTUAL dashboard DOM,
// but injects fixtures into /api/summary; no credentials or real D1 events.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import fs from 'node:fs';
fs.mkdirSync('audit/dashboard/browser-screenshots',{recursive:true});

const historical={
  game:'cat-bond',pageviews:26,visitors:3,startedViews:8,startRate:30.8,
  recordedGameEntries:8,recordedFirstFinishPages:7,starts:82,ends:79,retries:1,completion:79,abandons:3,
  signals:{
    bond_capture:73,bond_rare_encounter:4,bond_rare_capture:57,
    bond_duo_used:46,bond_yard_built:6,bond_surprise:5
  },
  visitFunnel:{pageviews:26,startedViews:8,finishedViews:7},
  conversion:{pageviews:0,startedViews:0,finishedViews:0}
};
const oldCount={
  zh:[['成功捕获',73],['遇见稀有猫（庭院）',4],['捕获稀有猫',57],['触发双猫合击',46],['庭院建造',6],['惊喜事件',5]],
  en:[['Cats captured',73],['Rare encounters (yard)',4],['Rare cats captured',57],['Duo attacks used',46],['Yard constructions',6],['Surprise events',5]]
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
  const summary={
   updated:'2026-11-23T23:56:00.000Z',from:'2026-11-19T08:00:00.000Z',days:2,records:50,
   rollup:{pageviews:auditedPV,starts:82,ends:79,retries:1},
   byGame:[row],byDay:[],byChannel:[],homeFunnel:{},socialPulse:{
    platforms:[{id:'youtube',published:7,views:null},{id:'instagram',published:7,views:null},
      {id:'tiktok',published:7,views:null},{id:'bluesky',published:7,views:null},{id:'itch',published:7,views:null}],
    metricScope:{verifiedPosts:[],activeApprovedPosts:28},
    
   }
  };
  let requestedSummaryUrl='';
  await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
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
   assert.equal(new URL(requestedSummaryUrl).searchParams.get('from'),'2026-11-19T08:00:00.000Z',
      'Dashboard must request the full fixed Pacific-time reporting window');
   const statLabels=await page.locator('#stats .stat .label').allTextContents();
   assert.equal(statLabels[0],language==='zh'?'全站页面浏览量':'All pageviews',
     'Overall pageviews must be the first headline metric');
   assert.equal(statLabels[1],language==='zh'?'网站首页浏览量':'Homepage views',
     'Homepage views must immediately follow overall pageviews');
   assert.equal(await page.locator('#promotion-round-history').count(),0,
     'Promotion round history must be removed from the dashboard');
   assert.equal(await page.locator('#deleted-round-details').count(),0,
     'Deleted-post archive must not be rendered');
   const visibleText=await page.locator('body').innerText();
   assert.ok(!/统计起点：11\/22 00:00|Since Nov 22, 2026, 12:00 AM PT/.test(visibleText),
     'Reporting start date must not be shown in the dashboard');
   assert.equal(await page.locator('#reset-metrics').count(),0,'No destructive reset control');
   assert.match(await page.locator('#historical-coverage').innerText(),language==='zh'?/历史覆盖未验证/:/Historical coverage unverified/);
   assert.deepEqual(exceptions,[],'Dashboard JS exceptions: '+exceptions.join('; '));
   const gameRow=page.locator('#games tr').filter({
    has:page.locator('a[href="/cat-bond/"]')
   });
   assert.equal(await gameRow.count(),1,'Cat Bond game row missing');
   const cells=(await gameRow.locator('td').allTextContents())
    .map(s=>s.trim().replace(/\s+/g,' '));
   assert.equal(cells[1],String(auditedPV),'Main table PV must use full D1 aggregate');
   assert.equal(cells[2],'8','Main-table starts must use explicit recorded game entries');
   assert.equal(cells[3],'7','Main-table finishes must use recorded first-finish pages');
   assert.equal(cells[4],'1','Historical replay total erased');
   assert.deepEqual(cells.slice(5,8),[mixed?'8 / 121 · 6.6%':'8 / 26 · 30.8%',
    '7 / 8 · 87.5%',mixed?'7 / 121 · 5.8%':'7 / 26 · 26.9%'],
    'Visit conversion must be deduplicated, not raw battle totals');
   const cards=await page.locator('#focus-grid .focus-card h3 a').evaluateAll(
    nodes=>nodes.map(n=>n.getAttribute('href')));
   assert.deepEqual(cards,[
    '/cat-bond/','/pawsibly-innocent/','/tiny-town/','/elsewhere/',
    '/flip-dash/','/parcel-panic/','/pocket-aquarium/'
   ],'Real browser must render gameplay details for ALL seven game worlds');
   const card=page.locator('#focus-grid .focus-card').first();
   const legacyPanel=card.locator('details').filter({hasText:language==='zh'?'旧版混合计数':'Legacy mixed counters'});
   assert.equal(await legacyPanel.count(),1,'Mixed historical counters must remain visible as audit-only details');
   assert.match(await legacyPanel.textContent(),/82/);assert.match(await legacyPanel.textContent(),/79/);
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
   await page.screenshot({path:'audit/dashboard/browser-screenshots/'+language+'-'+viewport.width+'-'+(mixed?'mixed':'legacy')+'.png',fullPage:true});
  }finally{
   await context.close();
  }
 }
}finally{
 await browser.close();
}
console.log('Real Chromium dashboard gate passed: raw rounds, visit funnel, homepage/pageview order, no promotion archive, and no visible start date across 8 bilingual phone/desktop cases.');
