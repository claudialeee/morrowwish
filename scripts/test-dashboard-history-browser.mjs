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
const sample=mixed=>{
 const base=mixed?{
  ...historical,
  conversion:{pageviews:4,startedViews:3,finishedViews:2},
  signals:{...historical.signals,bond_battle_start_v2:3,bond_battle_end_v2:2,
    bond_capture_v2:2,bond_rare_attempt_v2:1,bond_rare_capture_v2:1,
    bond_region_yard_start_v2:2,bond_region_yard_end_v2:2}
 }:historical;
 return base;
};
const promoGames=['cat-bond','pawsibly-innocent','tiny-town','elsewhere','flip-dash','parcel-panic','pocket-aquarium'];
const archiveMetrics={youtube:[13,53,1,3,245,87,56],instagram:[6,11,3,1,254,45,43],
 tiktok:[12,21,18,23,2,18,0],bluesky:[2,2,2,3,2,2,6]};
const archivePosts=['youtube','instagram','tiktok','bluesky'].flatMap(platform=>promoGames.map((game,i)=>({
 platform,game,url:'https://example.test/'+platform+'/'+game,
 views:platform==='bluesky'?null:archiveMetrics[platform][i],
 likes:platform==='youtube'?(i===4||i===5?2:0):platform==='instagram'?[1,2,1,1,2,2,2][i]:
  platform==='tiktok'?(i===3?1:0):2,
 reposts:platform==='bluesky'?2:null,
 replies:0,quotes:0,deleted:true
})));
const roundFixture={rounds:[
 {id:'morning-first',status:'deleted',posts:archivePosts,platforms:{
  youtube:{posts:7,views:458,likes:4,comments:0,capturedAt:'2026-11-22T14:14:13-08:00'},
  instagram:{posts:7,views:363,likes:11,comments:0,capturedAt:'2026-11-22T13:05:00-08:00'},
  tiktok:{posts:7,views:94,likes:1,comments:0,capturedAt:'2026-11-22T13:05:00-08:00'},
  bluesky:{posts:7,views:null,likes:14,reposts:14,replies:0,quotes:0,capturedAt:'2026-11-22T14:14:13-08:00'}
 }},
 {id:'evening-repost',status:'active',postsCount:28,platforms:{
  youtube:{posts:7,views:null,likes:null,comments:null},
  instagram:{posts:7,views:null,likes:null,comments:null},
  tiktok:{posts:7,views:null,likes:null,comments:null},
  bluesky:{posts:7,views:null,likes:19,reposts:16,replies:1,quotes:0,capturedAt:'2026-11-23T04:00:41.086Z'}
 }}
]};
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
   byGame:[row],byDay:[],byChannel:[],homeFunnel:{},socialPulse:{
    platforms:[{id:'youtube',published:7,views:null},{id:'instagram',published:7,views:null},
      {id:'tiktok',published:7,views:null},{id:'bluesky',published:7,views:null},{id:'itch',published:7,views:null}],
    metricScope:{verifiedPosts:[],activeApprovedPosts:28},
    publicationRounds:roundFixture
   }
  };
  await page.route('**/api/summary*',route=>route.fulfill({
   status:200,contentType:'application/json',body:JSON.stringify(summary)
  }));
  const auditedPV=mixed?121:26;
  await page.route('**/api/cat-bond-traffic-audit*',route=>route.fulfill({
   status:200,contentType:'application/json',body:JSON.stringify({
    game:'cat-bond',days:7,source:'uncapped-d1-aggregate',total:auditedPV,
    totals:{pageviews:auditedPV,startedViews:8,finishedViews:7},
    byDay:[{day:'2026-11-22',pageviews:auditedPV,startedViews:8,finishedViews:7}],
    history:{firstDay:'2026-11-16',lastDay:'2026-11-22',pageviews:auditedPV,rawVisits:auditedPV}
   })
  }));
  await page.route('**/api/elsewhere-summary*',route=>route.fulfill({
   status:200,contentType:'application/json',body:JSON.stringify({summary:{}})
  }));
  try{
   await page.goto('http://127.0.0.1:8765/studio-insights/?lang='+language,{
    waitUntil:'domcontentloaded',timeout:15000
   });
   await page.locator('#report:not([hidden])').waitFor({timeout:12000});
   await page.waitForFunction(()=>document.querySelector('#cat-bond-traffic-audit')?.textContent?.includes('数据库全量核对')||
     document.querySelector('#cat-bond-traffic-audit')?.textContent?.includes('Full D1 audit'),null,{timeout:12000});
   const statLabels=await page.locator('#stats .stat .label').allTextContents();
   assert.equal(statLabels[0],language==='zh'?'页面浏览量':'Pageviews · PV',
     'Overall pageviews must be the first headline metric');
   assert.equal(statLabels[1],language==='zh'?'网站首页浏览量':'Homepage views',
     'Homepage views must immediately follow overall pageviews');
   const roundRows=page.locator('#promotion-round-rows tr');
   assert.equal(await roundRows.count(),4,'All four promotion platforms need two-round metrics');
   const youtubeRound=await roundRows.filter({hasText:'YouTube Shorts'}).textContent();
   assert.ok(youtubeRound.includes('458'),'Deleted morning YouTube snapshot must be visible');
   assert.ok(youtubeRound.includes(language==='zh'?'原生数据待刷新':'Native metrics pending'),
     'Current YouTube round must not inherit deleted views');
   const blueskyRound=await roundRows.filter({hasText:'Bluesky'}).textContent();
   for(const value of ['14','19','16','1'])assert.ok(blueskyRound.includes(value),
     'Bluesky first/current round engagement missing: '+value);
   const deletedDetails=page.locator('#deleted-round-details');
   assert.equal(await deletedDetails.count(),1,'Deleted first-round detail archive must exist');
   await deletedDetails.evaluate(el=>el.open=true);
   assert.equal(await page.locator('#round-post-history-rows tr').count(),7,
     'All seven games must retain their deleted first-round post links and readings');
   assert.deepEqual(exceptions,[],'Dashboard JS exceptions: '+exceptions.join('; '));
   const gameRow=page.locator('#games tr').filter({
    has:page.locator('a[href="/cat-bond/"]')
   });
   assert.equal(await gameRow.count(),1,'Cat Bond game row missing');
   const cells=(await gameRow.locator('td').allTextContents())
    .map(s=>s.trim().replace(/\s+/g,' '));
   assert.equal(cells[1],String(auditedPV),'Main table PV must use full D1 aggregate');
   assert.equal(cells[2],'82','Main-table starts must preserve raw battle totals');
   assert.equal(cells[3],'79 96.3%','Main-table finishes must preserve raw battle totals');
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
   const lines=(await card.locator('.focus-line').allTextContents())
    .map(s=>s.trim().replace(/\s+/g,' '));
   for(const [label,value] of oldCount[language]){
    assert.ok(lines.some(line=>line.includes(label)&&line.endsWith(String(value))),
      language+' historical Cat Bond '+label+'='+value+' is not visible');
   }
   assert.ok(lines.some(line=>line.includes('82'))&&lines.some(line=>line.includes('79')),
     'Raw historic battle counts must remain in the game details');
   for(const rate of [mixed?'8 / 121 · 6.6%':'8 / 26 · 30.8%','7 / 8 · 87.5%'])
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
console.log('Real Chromium dashboard gate passed: Cat Bond history, pageview/homepage metric order, and both deleted/current promotion rounds across 8 bilingual phone/desktop cases.');
