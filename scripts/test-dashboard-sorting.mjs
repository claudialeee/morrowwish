import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('public/studio-insights/index.html','utf8');
// Fail CI if a dashboard update causes a JavaScript parse error. Otherwise the
// entire report can stay hidden while the Cloudflare deploy still succeeds.
const inlineScript=html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(inlineScript,'Dashboard inline application script missing');
assert.doesNotThrow(()=>new vm.Script(inlineScript,{filename:'studio-insights/index.html'}),'Dashboard full-page JavaScript syntax must be valid');

// The homepage is a single KPI above the table, never a fake eighth game.
// The selected-period hub count must not be replaced by the all-site total.
const statsPrefix=inlineScript.slice(inlineScript.indexOf('function render(j)'),inlineScript.indexOf('const visibleGames='));
const pvCardIndex=statsPrefix.indexOf('metricCard(t("statPv")');
const homeCardIndex=statsPrefix.indexOf('metricCard(t("statHome")');
assert.ok(statsPrefix.startsWith('function render(j)')&&pvCardIndex>=0&&homeCardIndex>pvCardIndex,
 'Overall pageviews must be first and homepage views must immediately follow');
for(const locale of ['zh','en']){
 const nodes={};
 const homeLabel=locale==='zh'?'网站首页浏览量':'Homepage views';
 const pvLabel=locale==='zh'?'全站页面浏览量':'All pageviews';
 const env={lastData:null,$:id=>(nodes[id]??={innerHTML:''}),
  t:key=>key==='statHome'?homeLabel:key==='statPv'?pvLabel:key,format:n=>String(n),pct:(a,b)=>b?Math.round(a/b*1000)/10:0,
  metricCard:(name,value,note)=>'<div data-name="'+name+'">'+value+'</div>'};
 vm.runInNewContext(statsPrefix+"}\nrender({rollup:{pageviews:123,gameStarts:8,retries:2},byGame:[{game:'hub',pageviews:37},{game:'cat-bond',ends:3}]});",env);
 const html=nodes.stats.innerHTML;
 assert.equal((html.match(/<div data-name=/g)||[]).length,2,'Only website pageview cards remain');
 assert.ok(html.startsWith('<div data-name="'+pvLabel+'">123</div>'),locale+' overall pageviews must show 123 first');
 assert.ok(html.includes('<div data-name="'+homeLabel+'">37</div>'),locale+' homepage KPI must show 37 views');
 assert.ok(html.indexOf('<div data-name="'+pvLabel+'">123</div>')<html.indexOf('<div data-name="'+homeLabel+'">37</div>'),
  locale+' homepage views must immediately follow total pageviews');
}
console.log('Overall pageviews first, homepage views second; both zh/en KPI values and seven-game table preserved.');
assert.ok(html.includes("const displayOrder=['starbell-preview'"),'Game table must start with Starbell preview');
assert.ok(!html.includes('id="games-total"')&&!html.includes('gamesTrackedTotal')&&
 !html.includes('gamesTotalNote')&&!html.includes('total-row'),
 'Game performance table must not render an aggregate row');
for(const key of ['colVisitStart','colStartFinish','colVisitFinish']){
 const labels=[...html.matchAll(new RegExp(key+':"([^"]+)"','g'))].map(match=>match[1]);
 assert.equal(labels.length,2,key+' must have zh/en labels');
 assert.ok(labels.every(label=>!/[→()]/.test(label)),key+' labels must be concise, without arrows or parentheses');
}
assert.ok(html.includes('.panel.table-wrap{border:0;background:transparent;border-radius:0;box-shadow:none;padding:0}'),
 'Current data tables must not have an outer frame');
assert.ok(html.includes('<details class="ew-details archive-first-round" id="archived-first-round"')&&
 !html.includes('<section class="ew-details archive-first-round"'),
 'Deleted first-round history must use a collapsed disclosure');
assert.ok(html.includes('class="archive-first-round-posts"'),
 'Individual deleted posts must remain in a second collapsed disclosure');
assert.ok(!html.includes('→'),'Dashboard labels must not use arrow notation');
console.log('Seven-game table has concise bilingual rates, flat table styling, and no aggregate row.');

for(const name of ['games','channel-rows']){
 assert.ok(html.includes('id="'+name+'"'),'Missing sortable dashboard table: '+name);
}
assert.ok(html.includes('data-sort-value='),'Site game visits must sort numerically');
assert.ok(html.indexOf('id="promotion-channels"')<html.indexOf('id="game-details"'),'Channel metrics second');
assert.ok(!html.includes('id="ew-funnel"')&&!html.includes('id="signal-grid"'),'Remove stale story and gameplay metrics');
assert.ok(html.includes('aria-sort'),'Sort direction must be accessible');
const missingKeys=['none','empty','notAvailable','syncPending','signalWait','homeFunnelEmpty','itchNoData','lastEventMissing'];
const fieldRe=/\b(none|empty|notAvailable|syncPending|signalWait|homeFunnelEmpty|itchNoData|lastEventMissing):"([^"]*)"/g;
const fields=[...html.matchAll(fieldRe)];
for(const key of missingKeys){
 const matches=fields.filter(m=>m[1]===key);
 assert.equal(matches.length,2,key+' must exist in zh/en');
 assert.ok(matches.every(m=>m[2]===''),key+' must stay blank');
}
assert.ok(!html.includes('escapeHTML(t("none"))'),'Do not render empty-state text');
assert.ok(!html.includes("pulse.capturedAt||'—'"),'Missing social snapshot cannot render dash');
// Check translations at runtime: an empty string is an intentional translated value.
// Using `translations[key] || key` would visibly print "empty" in every missing game cell.
const dictSource=inlineScript.slice(inlineScript.indexOf('const I18N='),inlineScript.indexOf('const gameNames='));
const translatorLine=inlineScript.split('\n').find(line=>line.trim().startsWith('const t=(id,params={})=>'));
assert.ok(dictSource&&translatorLine,'Localization function and dictionaries required');
for(const locale of ['zh','en']){
 const context={}; 
 vm.runInNewContext("const lang="+JSON.stringify(locale)+";"+dictSource+"\n"+translatorLine+"\nglobalThis.translate=t;",context);
 for(const key of missingKeys)assert.equal(context.translate(key),'',locale+' '+key+' must render blank at runtime');
 assert.equal(context.translate('nonexistent-test-key'),'nonexistent-test-key','Unknown translations may still fall back to the key');
}
assert.ok(html.includes("const known=Number(x.pageviews)>0;"),'Session-only records without a visit must render blank');
assert.ok(html.includes("const num=k=>known&&x[k]!=null&&Number.isFinite(Number(x[k]))?format(x[k]):'';"),'Missing metric fields must not be converted into zero');
assert.ok(html.includes('enhanceSortableTables()'),'Sort must survive dashboard refresh');
const block=html.slice(html.indexOf('const tableSorts='),html.indexOf('function dateFormat('));
assert.ok(block.includes('function sortCellValue')&&block.includes('function sortDataTable'),'Sort functions missing');
const cx={lang:'zh',Intl,Map,Set,Number,String,Array,Object,document:{querySelectorAll:()=>[]},t:x=>x,ewText:x=>x};
vm.runInNewContext(block+';globalThis.exposed={sortCellValue,sortDataTable,tableSorts};',cx);
const {sortCellValue,sortDataTable,tableSorts}=cx.exposed;
const cell=(text,sortValue)=>({textContent:text,dataset:sortValue===undefined?{}:{sortValue}});
const row=(name,metric,sortValue)=>({cells:[cell(name),cell(metric,sortValue)]});
assert.equal(sortCellValue(row('A','1,230'),1,'games'),1230,'Thousands separator');
assert.equal(sortCellValue(row('A','34 (21%)'),1,'games'),34,'Primary metric, not commentary percentage');
assert.equal(sortCellValue(row('A','14.7%'),1,'games'),14.7,'Percentage');
assert.equal(sortCellValue({cells:[cell('YouTube'),cell('2,345')]},1,'channel-rows'),2345,'Native platform views must sort numerically');
assert.equal(sortCellValue(row('A',''),1,'games'),null,'Missing metrics not fabricated as zero');
assert.equal(sortCellValue(row('A','0'),1,'itch-rows'),0,'True zero not treated as missing');
assert.equal(sortCellValue({cells:[cell('itch.io'),cell(''),cell('2'),cell('19','19'),cell('4'),cell('1')]},3,'channel-rows'),19,'Site visit column sorts by real game-page visits');
const head=()=>({setAttribute(){},querySelector(){return null}});
const body={id:'games',rows:[row('C','—'),row('A','25'),row('B','3'),row('D','0')],append(...r){this.rows=r;}};
const table={tBodies:[body],tHead:{rows:[{cells:[head(),head()]}]}};
tableSorts.set('games',{index:1,direction:'desc'});sortDataTable(table);
assert.deepEqual(body.rows.map(x=>x.cells[0].textContent),['A','B','D','C'],'Descending: missing last');
tableSorts.set('games',{index:1,direction:'asc'});sortDataTable(table);
assert.deepEqual(body.rows.map(x=>x.cells[0].textContent),['D','B','A','C'],'Ascending: missing last');
console.log('Dashboard columns sort numerically, retain real zeros, leave missing values last, and sort mixed channel visits by game-page visits.');


// Regression from the 2026-11-22 live incident. An empty V2 cohort MUST NOT
// replace historic Cat Bond activity with blanks. This invokes the actual
// dashboard renderers for both languages and mixed/legacy-only cohorts.
const historicalBond={game:'cat-bond',pageviews:26,startedViews:8,startRate:30.8,
 starts:82,ends:79,retries:1,
 visitFunnel:{pageviews:26,startedViews:8,finishedViews:7},
 conversion:{pageviews:0,startedViews:0,finishedViews:0},
 signals:{bond_capture:73,bond_rare_encounter:4,bond_rare_capture:57,
  bond_duo_used:46,bond_yard_built:6,bond_surprise:5}};
for(const locale of ['zh','en'])for(const v2 of [false,true]){
 const bond=v2?{...historicalBond,
  conversion:{pageviews:4,startedViews:3,finishedViews:2},
  signals:{...historicalBond.signals,bond_battle_start_v2:3,
   bond_battle_end_v2:2,bond_capture_v2:2,bond_rare_attempt_v2:1}}:historicalBond;
 const dom={};
 const env={lang:locale,elsewhereData:null,
  gameNames:{'cat-bond':{zh:'猫猫纽带',en:'Cat Bond'}},
  escapeHTML:s=>String(s??''),format:n=>Number(n||0).toLocaleString('en-US'),
  pct:(a,b)=>b?Math.round(a*1000/b)/10:0,
  t:id=>id==='bondBattleStarts'?(locale==='zh'?'场战斗':'battles'):id==='bondBattleEnds'?(locale==='zh'?'场结算':'battle finishes'):id,
  $:id=>(dom[id]??={innerHTML:''})};
 const focusCode=inlineScript.slice(inlineScript.indexOf('function renderSignals('),
  inlineScript.indexOf('\nfunction render(j)'));
 vm.runInNewContext(focusCode+';globalThis.draw=renderSignals;',env);
 env.draw([bond]);
 const card=dom['focus-grid'].innerHTML;
 for(const snippet of ['<b>73</b>','<b>57</b>','<b>46</b>'])
   assert.ok(card.includes(snippet),locale+' compact Cat Bond metric missing '+snippet);
 if(v2)assert.ok(card.includes('3 / 4 · 75%'),'New cohort must be separate');
 const tableCode=inlineScript.match(/const displayOrder=\[[^\n]+\];/)?.[0]+'\n'+inlineScript.slice(inlineScript.indexOf('const visibleGames='),
  inlineScript.indexOf('\nconst channels=Array.isArray'));
 vm.runInNewContext('const games=globalThis.fixture;\n'+tableCode,{...env,fixture:[bond]});
 const main=dom.games.innerHTML;
 assert.ok(main.includes('<td>8</td><td>7</td><td>1</td>'),
  locale+' main table must show page-level plays and finishes, not raw battle counts');
 assert.ok(!main.includes('<td>82 <small>')&&!main.includes('<td>79 <small>'),locale+' raw round totals must not carry extra conversion percentages');
 for(const ratio of ['8 / 26 · 30.8%','7 / 8 · 87.5%','7 / 26 · 26.9%'])
  assert.ok(main.includes('<td>'+ratio+'</td>'),locale+' per-visit conversion missing: '+ratio);
 assert.ok(!main.includes('79 / 82 · 96.3%</td>'),
  'Raw battle totals must not replace visit-deduplicated conversion columns');

 assert.ok(!html.includes('games-total')&&!html.includes('totalConv'),
  'No seven-game aggregate row or aggregate conversion renderer may remain');
}
console.log('Cat Bond dashboard gate: play/finish cells use page-level counts; battle counts stay in gameplay details; conversions remain 8/26, 7/8, 7/26 in zh/en.');


// Adversarial coverage gate: every one of the seven playable game worlds has
// a gameplay detail card; do not silently revert to four flagship cards.
const sevenIds=['cat-bond','pawsibly-innocent','tiny-town','elsewhere',
 'flip-dash','parcel-panic','pocket-aquarium'];
const allRender=inlineScript.slice(inlineScript.indexOf('function renderSignals('),
 inlineScript.indexOf('\nfunction render(j)'));
for(const locale of ['zh','en']){
 const nodes={};
 const localized={
  flipRuns:locale==='zh'?'结束的局数':'Finished runs',
  flip10:locale==='zh'?'存活至少 10 秒':'Survived at least 10 seconds',
  flip30:locale==='zh'?'存活至少 30 秒':'Survived at least 30 seconds',
  parcelSorted:locale==='zh'?'正确分拣':'Correctly sorted',
  parcelMissed:locale==='zh'?'漏接 / 分错':'Missed / wrong',
  parcel10:locale==='zh'?'完成至少 10 件的局数':'Runs with 10+ parcels',
  fishFed:locale==='zh'?'成功投喂':'Successful feeds',
  fishFinished:locale==='zh'?'完整结束 60 秒':'Completed 60s',
  fishGood:locale==='zh'?'S / A 评级':'S / A grades'
 };
 const env={lang:locale,elsewhereData:null,
  gameNames:Object.fromEntries(sevenIds.map(id=>[id,{zh:id,en:id}])),
  escapeHTML:s=>String(s??''),format:n=>String(Number(n||0)),
  pct:(a,b)=>b?Math.round(a*1000/b)/10:0,
  t:k=>localized[k]??k,$:id=>(nodes[id]??={innerHTML:''})};
 vm.runInNewContext(allRender+';globalThis.drawAll=renderSignals;',env);
 env.drawAll([
  {game:'flip-dash',pageviews:6,signals:{flip_finished:5,flip_10s:3,flip_30s:2}},
  {game:'parcel-panic',pageviews:6,signals:{parcel_sorted:25,parcel_missed:4,parcel_ten_sorted:1}},
  {game:'pocket-aquarium',pageviews:6,signals:{feed_success:18,aquarium_completed:4,aquarium_grade_s:1,aquarium_grade_a:2}}
 ]);
 const out=nodes['focus-grid'].innerHTML;
 for(const id of sevenIds)
  assert.ok(out.includes('href="/'+id+'/"'),locale+' missing game-world card '+id);
 for(const [label,number] of [['flipRuns',5],['flip10',3],['flip30',2],
  ['parcelSorted',25],['parcelMissed',4],['parcel10',1],
  ['fishFed',18],['fishFinished',4],['fishGood',3]])
  assert.ok(out.includes(localized[label]+'</span><b>'+number+'</b>'),
    locale+' missing game telemetry '+label+' = '+number);
}
console.log('All seven gameplay worlds: detailed cards, real event keys, and zh/en labels verified.');


// Late post-reset session events without visits must not display zeros.
for(const language of ['zh','en'])for(const fixture of [
 {game:'flip-dash',pageviews:0,starts:0,ends:0,retries:0,
  conversion:{pageviews:0,startedViews:0,finishedViews:0}},
 {game:'flip-dash',pageviews:2,starts:null,ends:null,retries:null},
 {game:'flip-dash',pageviews:2,retries:0,
  visitFunnel:{pageviews:2,startedViews:0,finishedViews:0}}
]){
 const nodes={};
 const env={lang:language,fixture:[fixture],gameNames:{'flip-dash':{zh:'翻转冲刺',en:'Flip Dash'}},
  escapeHTML:s=>String(s??''),format:n=>String(n),pct:(a,b)=>b?Math.round(a*1000/b)/10:0,
  t:key=>key,$:id=>(nodes[id]??={innerHTML:''})};
 const script=inlineScript.match(/const displayOrder=\[[^\n]+\];/)?.[0]+'\n'+inlineScript.slice(inlineScript.indexOf('const visibleGames='),
  inlineScript.indexOf('\nconst channels=Array.isArray'));
 vm.runInNewContext('const games=globalThis.fixture;\n'+script,env);
 const segment=nodes.games.innerHTML.split('href="/flip-dash/"')[1]?.split('</tr>')[0];
 assert.ok(segment,'Flip Dash row exists even with no metric data');
 const cells=[...segment.matchAll(/<td>(.*?)<\/td>/g)].map(m=>m[1]);
 assert.equal(cells.length,11,'All eleven game metrics render');
 if(fixture.pageviews===0)
  assert.ok(cells.every(c=>c===''),'Post-reset session-only event must leave every metric blank');
 else if(fixture.starts===null)
  assert.deepEqual(cells.slice(0,4),['2','','',''],
   'Missing fields remain blank despite a real PV');
 else
  assert.deepEqual(cells.slice(0,4),['2','0','0','0'],
   'Verified zero activity remains zero when real visits exist');
}
console.log('Reset-safe game table gate: orphan session rows empty; missing fields blank; confirmed zeros retained.');


// First-round native metrics must reconcile at every level: 28 individual rows,
// the matching seven-game/four-platform matrix, and platform subtotals.
const nativeSnapshot=JSON.parse(fs.readFileSync('promotion/social-metrics-snapshot.json','utf8'));
const firstRound=nativeSnapshot.publicationRounds.rounds.find(round=>round.id==='morning-first');
const firstRoundPlatforms=['youtube','instagram','tiktok','bluesky'];
assert.equal(firstRound?.posts.length,28,'first-round archive contains exactly 28 posts');
assert.equal(new Set(firstRound.posts.map(post=>post.game+'|'+post.platform)).size,28,
 'first-round archive has one unique post for each game/platform pair');
for(const game of sevenIds)for(const platform of firstRoundPlatforms)
 assert.equal(firstRound.posts.filter(post=>post.game===game&&post.platform===platform).length,1,
  'exactly one archived post for '+game+' / '+platform);

assert.ok(html.includes('id="archived-first-round-posts"'),
 'first-round archive must have the same per-game native-metrics matrix');
assert.ok(!html.includes('id="archived-first-round-game-rows"'),'No duplicate first-round matrix');
assert.ok(inlineScript.includes("renderVideoMatrix(verifiedVideos,'checkedAt')")&&
 inlineScript.includes("renderVideoMatrix(archivedPosts,'capturedAt')"),
 'current and archived rounds must use the same matrix renderer with separate timestamps');
assert.ok(inlineScript.includes('$("archived-first-round-posts").innerHTML=archivedRound?renderVideoMatrix'),
 'replace the original details table rather than adding another table');

const matrixStart=inlineScript.indexOf('const verifiedPlatforms=');
const matrixEnd=inlineScript.indexOf('$("video-metrics-detail")',matrixStart);
assert.ok(matrixStart>=0&&matrixEnd>matrixStart,'Shared native-metrics matrix renderer missing');
const matrixEnv={lang:'en',gameNames:Object.fromEntries(sevenIds.map(id=>[id,{zh:id,en:id}])),
 escapeHTML:value=>String(value??''),format:value=>String(value)};
vm.runInNewContext(inlineScript.slice(matrixStart,matrixEnd)+';globalThis.drawMatrix=renderVideoMatrix;',matrixEnv);
const firstRoundMatrix=matrixEnv.drawMatrix(firstRound.posts,'capturedAt');
const matrixRows=[...firstRoundMatrix.matchAll(/<tr>([\s\S]*?)<\/tr>/g)];
assert.equal(matrixRows.length,7,'first-round matrix renders seven game rows');
const metricLabels={views:'Views',likes:'Likes',comments:'Comments',shares:'Shares',reposts:'Reposts',replies:'Replies',quotes:'Quotes'};
const metricFields={youtube:['views','likes','comments'],instagram:['views','likes','comments','shares'],
 tiktok:['views','likes','comments','shares'],bluesky:['likes','reposts','replies','quotes']};
for(const game of sevenIds){
 const row=matrixRows.find(match=>match[1].includes('>'+game+'</td>'));
 assert.ok(row,'first-round matrix row missing '+game);
 const cells=[...row[1].matchAll(/<td(?:\s[^>]*)?>([\s\S]*?)<\/td>/g)].map(match=>match[1]);
 assert.equal(cells.length,5,'matrix row has game plus four platform cells for '+game);
 for(let index=0;index<firstRoundPlatforms.length;index++){
  const platform=firstRoundPlatforms[index];
  const post=firstRound.posts.find(item=>item.game===game&&item.platform===platform);
  assert.ok(cells[index+1].includes(post.url),'matrix link must be the exact archived post for '+game+'/'+platform);
  for(const key of metricFields[platform]){
   if(Number.isSafeInteger(post[key]))
    assert.ok(cells[index+1].includes(metricLabels[key]+' '+post[key]),
     'matrix metric must match the individual archive row: '+game+'/'+platform+'/'+key);
   else assert.ok(!cells[index+1].includes(metricLabels[key]+' '),
     'unknown native metric must remain blank: '+game+'/'+platform+'/'+key);
  }
 }
}

const summaryStart=inlineScript.indexOf('const summarizeArchivedPosts=');
const summaryEnd=inlineScript.indexOf('const archivedPosts=',summaryStart);
assert.ok(summaryStart>=0&&summaryEnd>summaryStart,'Archive summary must be derived from individual post rows');
const summaryEnv={};
vm.runInNewContext(inlineScript.slice(summaryStart,summaryEnd)+';globalThis.summarize=summarizeArchivedPosts;',summaryEnv);
const calculated=summaryEnv.summarize(firstRound.posts,firstRoundPlatforms,firstRound.platforms);
const summaryKeys={youtube:['views','likes','comments'],instagram:['views','likes','comments','shares'],
 tiktok:['views','likes','comments','shares'],bluesky:['views','likes','reposts','replies','quotes']};
for(const summary of calculated){
 const stored=firstRound.platforms[summary.platform];
 assert.equal(summary.posts,stored.posts,summary.platform+' archived post count reconciles');
 for(const key of summaryKeys[summary.platform]){
  const individual=firstRound.posts.filter(post=>post.platform===summary.platform);
  const expected=individual.every(post=>Number.isSafeInteger(post[key]))?individual.reduce((sum,post)=>sum+post[key],0):null;
  assert.equal(summary[key],expected,summary.platform+' '+key+' subtotal reconciles to all 7 post rows');
  if(Object.hasOwn(stored,key))assert.equal(summary[key],stored[key],summary.platform+' '+key+' retains saved subtotal');
 }
}
assert.equal(calculated.find(row=>row.platform==='bluesky').comments,null,
 'Bluesky replies must not be mislabeled as comments');
assert.equal(calculated.find(row=>row.platform==='youtube').shares,null,
 'YouTube does not expose a native shares metric in this report');
const partialRows=firstRound.posts.map(post=>post.platform==='youtube'&&post.game==='cat-bond'?{...post,views:null}:post);
assert.equal(summaryEnv.summarize(partialRows,['youtube'])[0].views,null,
 'an incomplete first-round metric subtotal must remain blank, never become zero');
assert.ok(inlineScript.includes("platform==='bluesky'?['likes','reposts','replies','quotes']"),
 'Bluesky uses only native interactions, not comments or views');
console.log('First-round 28-post detail, per-game native matrix and platform subtotals reconcile from one archived data set.');
