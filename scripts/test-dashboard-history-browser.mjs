// Mandatory real-browser release gate: historical Cat Bond metrics must remain
// visible after versioned funnels are added. This uses the ACTUAL dashboard DOM,
// but injects fixtures into /api/summary; no credentials or real D1 events.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const historical={
  game:'cat-bond',pageviews:26,visitors:3,startedViews:8,startRate:30.8,
  starts:82,ends:79,retries:1,completion:79,abandons:3,
  signals:{
    bond_capture:73,bond_rare_encounter:4,bond_rare_capture:57,
    bond_duo_used:46,bond_yard_built:6,bond_surprise:5
  },
  historicalVisitFunnel:{pageviews:26,startedViews:8,finishedViews:7},
  conversion:{pageviews:0,startedViews:0,finishedViews:0}
};
const oldCount={
  zh:[['成功捕获',73],['遇见稀有猫',4],['捕获稀有猫',57],
    ['触发双猫合击',46],['庭院建造',6],['惊喜事件',5]],
  en:[['Cats captured',73],['Rare encounters',4],['Rare cats captured',57],
    ['Duo attacks',46],['Yard constructions',6],['Surprise events',5]]
};
const sample=mixed=>mixed?{
  ...historical,
  conversion:{pageviews:4,startedViews:3,finishedViews:2},
  signals:{...historical.signals,bond_battle_start_v2:3,bond_battle_end_v2:2,
    bond_capture_v2:2,bond_rare_attempt_v2:1,bond_rare_capture_v2:1,
    bond_region_yard_start_v2:2,bond_region_yard_end_v2:2}
}:historical;
const browser=await chromium.launch({headless:true});
try{
 for(const language of ['zh','en'])for(const mixed of [false,true])
 for(const viewport of [{width:390,height:844},{width:1365,height:900}]){
  const context=await browser.newContext({viewport});
  const page=await context.newPage();
  const exceptions=[];
  page.on('pageerror',error=>exceptions.push(error.message));
  const row=sample(mixed);
  const summary={
   updated:'2026-11-22T22:00:00.000Z',days:7,records:50,
   rollup:{pageviews:26,starts:82,ends:79,retries:1},
   byGame:[row],byDay:[],byChannel:[],homeFunnel:{},socialPulse:{}
  };
  await page.route('**/api/summary*',route=>route.fulfill({
   status:200,contentType:'application/json',body:JSON.stringify(summary)
  }));
  await page.route('**/api/elsewhere-summary*',route=>route.fulfill({
   status:200,contentType:'application/json',body:JSON.stringify({summary:{}})
  }));
  try{
   await page.goto('http://127.0.0.1:8765/studio-insights/?lang='+language,{
    waitUntil:'domcontentloaded',timeout:15000
   });
   await page.locator('#report:not([hidden])').waitFor({timeout:12000});
   assert.deepEqual(exceptions,[],'Dashboard JS exceptions: '+exceptions.join('; '));
   const gameRow=page.locator('#games tr').filter({
    has:page.locator('a[href="/cat-bond/"]')
   });
   assert.equal(await gameRow.count(),1,'Cat Bond game row missing');
   const cells=(await gameRow.locator('td').allTextContents())
    .map(s=>s.trim().replace(/\s+/g,' '));
   assert.equal(cells[1],'26','Historical pageviews erased');
   assert.equal(cells[2],language==='zh'?'82 场战斗':'82 battles','Historic battle starts not preserved or mislabeled');
   assert.equal(cells[3],language==='zh'?'79 场结算':'79 battle finishes','Historic battle finishes not preserved or mislabeled');
   assert.equal(cells[4],'1','Historical replay total erased');
   assert.deepEqual(cells.slice(5,8),['8 / 26 · 30.8%','7 / 8 · 87.5%','7 / 26 · 26.9%'],
    'Visit conversion must be deduplicated, not raw battle totals');
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
   for(const rate of ['8 / 26 · 30.8%','79 / 82 · 96.3%'])
    assert.ok(lines.some(line=>line.includes(rate)),
      language+' historical ratio missing: '+rate);
   assert.ok(lines.some(line=>line.endsWith('1')&&
     (line.includes('重玩次数')||line.includes('Replays'))),
     language+' historical replays missing');
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
console.log('Real Chromium Cat Bond historical dashboard gate passed: 8 bilingual phone/desktop cases, legacy-only and mixed V2; 8/26, 79/82, 73, 4, 57, 46, 6, 5, 1 retained.');
