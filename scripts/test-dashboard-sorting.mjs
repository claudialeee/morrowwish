import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync('public/studio-insights/index.html','utf8');
// Fail CI if a dashboard update causes a JavaScript parse error. Otherwise the
// entire report can stay hidden while the Cloudflare deploy still succeeds.
const inlineScript=html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(inlineScript,'Dashboard inline application script missing');
assert.doesNotThrow(()=>new vm.Script(inlineScript,{filename:'studio-insights/index.html'}),'Dashboard full-page JavaScript syntax must be valid');
for(const name of ['games','channel-rows','ew-worlds']){
 assert.ok(html.includes('id="'+name+'"'),'Missing sortable dashboard table: '+name);
}
assert.ok(html.includes('data-sort-value='),'Compound home/game visits need a numeric key');
assert.ok(html.includes('aria-sort'),'Sort direction must be accessible');
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
assert.equal(sortCellValue(row('A','14.7%'),1,'ew-worlds'),14.7,'Percentage');
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
