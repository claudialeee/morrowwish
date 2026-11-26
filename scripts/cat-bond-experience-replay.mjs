// Load a genuine test checkpoint through the normal title/continue flow.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';
const file=process.argv[2];if(!file)throw Error('Usage: node scripts/cat-bond-experience-replay.mjs <fixture.json> [--headed] [--allow-revision-mismatch]');
const fixture=JSON.parse(await fs.readFile(file,'utf8')),origin='http://127.0.0.1:8765';
assert.equal(fixture.schema,1);
const synthetic=fixture.provenance==='synthetic engine-model browser-restored';
if(synthetic&&!process.argv.includes('--synthetic'))throw Error('Synthetic fixture requires explicit --synthetic acknowledgment; never count it as real-play coverage.');
const chapterDerived=fixture.provenance==='synthetic chapter entry + real-input browser save';
if(chapterDerived&&!process.argv.includes('--chapter-derived'))throw Error('Chapter-derived save requires explicit --chapter-derived acknowledgment; not fresh campaign evidence.');
if(!synthetic&&!chapterDerived)assert.equal(fixture.provenance,'real-input local browser save');
const revision=process.env.GITHUB_SHA||execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(revision!==fixture.revision&&!process.argv.includes('--allow-revision-mismatch'))throw Error('Checkpoint revision mismatch; regenerate or explicitly opt in for migration testing.');
assert.deepEqual(fixture.storageState.cookies,[]);
assert.equal(fixture.storageState.origins.length,1);
assert.equal(fixture.storageState.origins[0].origin,origin);
assert.ok(fixture.storageState.origins[0].localStorage.every(x=>['catbond_save_slots_v1','catbond_active_slot_v1'].includes(x.name)));
const entries=fixture.storageState.origins[0].localStorage;
const book=JSON.parse(entries.find(x=>x.name==='catbond_save_slots_v1').value);
const entry=book.slots?.[fixture.slot];
const expected=entry?.data?.state||entry?.data;
assert.equal(expected?.resonance?.scene,fixture.scene,'Fixture must contain the expected saved scene');
assert.ok(expected.cats?.length,'Fixture must contain a party');
const expectedEnding=fixture.ending===true;
if(expectedEnding)assert.ok(expected.resonance.completed.includes(fixture.scene),'Terminal fixture must contain completed last scene');
const party=cats=>cats.map(c=>({uid:c.uid,species:c.species,actor:c.storyActor||null,level:c.level??null}));
const profiles={
 desktop:{viewport:{width:1440,height:900},hasTouch:false},
 portrait:{viewport:{width:390,height:844},hasTouch:true},
 landscape:{viewport:{width:844,height:390},hasTouch:true}
};
const profile=process.env.CAT_BOND_REPLAY_PROFILE||'desktop';
const lang=process.env.CAT_BOND_REPLAY_LANG||'zh';
assert.ok(Object.hasOwn(profiles,profile),'Unknown replay profile');
assert.ok(['zh','en'].includes(lang),'Unknown replay language');
const browser=await chromium.launch({headless:!process.argv.includes('--headed')});
try{
 const context=await browser.newContext({storageState:fixture.storageState,...profiles[profile]});
 await context.route('**/*',route=>{const u=new URL(route.request().url());return u.origin===origin||['data:','blob:'].includes(u.protocol)?route.continue():route.abort();});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+'/cat-bond/?lang='+lang+'&rpgDev=1');
 await page.waitForFunction(()=>window.__CAT_BOND_READY__&&window.CatBondResonance);
 await page.locator('#intro-continue').click();await page.locator('#intro-slot-list [data-slot="'+fixture.slot+'"]').click();
 await page.waitForFunction(({scene,ending})=>{const v=window.CatBondResonance?.view();return ending?v?.ending===true&&window.CatBondResonance.snapshot().scene===scene:v?.current?.id===scene;},{scene:fixture.scene,ending:expectedEnding},{timeout:15000});
 await page.waitForFunction(()=>['map','yard'].includes(window.__game?.scene));
 const actual=await page.evaluate(()=>({story:CatBondResonance.snapshot(),ending:CatBondResonance.view().ending,cats:State.S.cats,away:State.S.storyAway?.muling?.uid||null,exploration:State.S.resonanceExploration,team:State.S.battlePrefs?.teamUids,duo:State.S.duoRelations,dex:State.S.dex}));
 assert.deepEqual(party(actual.cats),party(expected.cats),'Restored party identity/order/levels');
 assert.equal(actual.away,expected.storyAway?.muling?.uid||null,'Restored away companion identity');
 assert.equal(actual.ending,expectedEnding,'Ending state must survive reload');
 if(expected.battlePrefs?.teamUids)assert.deepEqual(actual.team,expected.battlePrefs.teamUids,'Active lineup');
 if(expected.duoRelations)assert.deepEqual(actual.duo,expected.duoRelations,'Duo relationships and chosen pair');
 if(expected.dex)assert.deepEqual(actual.dex,expected.dex,'Collection progress');
 for(const key of ['scene','cursor','completed','evidence','choices','melodies','sanctuaries','trust','links','support','returned','postgame','ambientDone','openingMet','ruins']){
   if(Object.hasOwn(expected.resonance,key))assert.deepEqual(actual.story[key],expected.resonance[key],'Restored story '+key);
 }
 for(const key of ['interactions','pickups','cargo']){
   if(Object.hasOwn(expected.resonanceExploration||{},key))assert.deepEqual(actual.exploration?.[key],expected.resonanceExploration[key],'Restored exploration '+key);
 }
 assert.equal(await page.evaluate(()=>MorrowwishI18n.get()),lang,'Restored UI language');
 assert.deepEqual(errors,[]);
 console.log('PASS checkpoint restore',fixture.provenance,fixture.scene,fixture.slot,lang,profile);
 const evidenceDir=path.join(path.dirname(file),'replays');
 await fs.mkdir(evidenceDir,{recursive:true});
 await page.screenshot({path:path.join(evidenceDir,path.basename(file,'.json')+'-'+lang+'-'+profile+'.png')});
 if(process.argv.includes('--headed'))await page.waitForEvent('close',{timeout:0});
}finally{await browser.close();}
