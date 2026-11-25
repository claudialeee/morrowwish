import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {webcrypto} from 'node:crypto';

globalThis.crypto??=webcrypto;
const read=path=>fs.readFile(new URL('../'+path,import.meta.url),'utf8');
const [story,painted,worldmap,game,main,battle,ui,index,worker,state,serverSource,buildSource,deploySource]=await Promise.all([
 read('public/cat-bond/js/story-cloud.js'),
 read('public/cat-bond/js/painted-regions.js'),
 read('public/cat-bond/js/worldmap.js'),
 read('public/cat-bond/js/game.js'),
 read('public/cat-bond/js/main.js'),
 read('public/cat-bond/js/battle.js'),
 read('public/cat-bond/js/ui.js'),
 read('public/cat-bond/index.html'),
 read('src/worker.js'),
 read('public/cat-bond/js/state.js'),
 read('src/cat-bond-cloud-save.js'),
 read('scripts/build-pages.mjs'),
 read('.github/workflows/deploy-cloudflare.yml')
]);

new Function(story);
new Function(state);
new Function(game);
new Function(painted);
new Function(worldmap);
new Function(main);
new Function(battle);
new Function(ui);

for(const [name,source,needles] of [
 ['story',story,['The Last Page','Hollow','暮铃','逆响之主','startPrologue','onRegionEntered','onRegionDiscovery','hasAllRegionPages(s)','ruinsNodes.includes(\'ruins_secret\')','playEnding','showMulingQuestions','onBossPhase','showMulingCombatChoice','rescueChoice','person_not_memory','mulingAnswers','AES-GCM','catbond_cloud_key_v1','expectedRevision']],
 ['map landmarks',painted,['storyLandmarks(c,w,h,id,r)',"id==='home'","id==='sakura'","id==='creek'","id==='volcano'","id==='ruins'"]],
 ['world map story hooks',worldmap,['onRegionEntered?.(id)','onRegionDiscovery?.(world.region.id,reward)','npcs: window.CatBondNPC','window.CatBondNPC?.draw?.(ctx,npc,w.t)','window.CatBondNPC.talk(npc.id)']],
 ['final boss',game,['this.battle.storyBoss=!!opts.storyBoss','new Battle.CaptureBattle(this, team, wildSpecies, opts)','if(b.storyBoss)','onBossVictory']],
 ['authored solo boss pack',battle,['this.enemies = this.buildPack(wildSpecies, opts?.pack)','buildPack(lead, packOverride)','packOverride.map((sp,i)=>this.makeEnemy(sp,i,packOverride.length))']],
 ['Pages worker bundling',buildSource,['src', 'cat-bond-cloud-save.js','async function catBondCloudSave','cloudSave + \'\\n\' + router']],
 ['cloud save worker helper',serverSource,['const cloudJson=','byteLength=new TextEncoder().encode(raw).byteLength','cat_bond_cloud_saves']],
 ['production live verification',deploySource,['expected_story=','expected_battle=','/api/cat-bond-cloud-save','morrowwish.vercel.app/api/cat-bond-cloud-save']],
 ['Catdex story record',ui,['cb-dex-story-record','story.recordedUid','The Last Page']],
 ['entry points and cache versions',index,['css/style.css?v=three-slot-save-manager-20261124-v1','js/main.js?v=resonance-title-20261124-v2','js/state.js?v=atomic-save-book-20261124-v5','js/story-cloud.js?v=per-slot-encrypted-cloud-20261124-v7','id="intro-start"','id="intro-continue"','js/game.js?v=overworld-first-20261124-v2','js/worldmap.js?v=last-page-interactive-overworld-20261124-v5','js/battle.js?v=']],
 ['cloud route',worker,['catBondCloudSave(request,env)','/api/cat-bond-cloud-save']],
 ['local save compatibility',state,['catbond_save_v1']]
]){
 for(const needle of needles)assert.ok(source.includes(needle),name+' missing '+needle);
}

const {catBondCloudSave}=await import('data:text/javascript;base64,'+Buffer.from(serverSource).toString('base64'));
// Exercise the actual Save Manager in isolated browser-like storage. Each
// save is a complete state snapshot, so future system fields are preserved.
const localValues=new Map();
let rejectStorageKey=null;
const localStorage={
 getItem:key=>localValues.has(key)?localValues.get(key):null,
 setItem:(key,value)=>{if(key===rejectStorageKey)throw new Error('QuotaExceededError');localValues.set(key,String(value));},
 removeItem:key=>localValues.delete(key)
};
let adapterRuntime={phase:'idle',npcTrust:0};
const bootSaveManager=()=>{
 const window={MorrowwishI18n:{get:()=>'zh'}};
 new Function('window','localStorage','GameData','WorldMap',state)(window,localStorage,{},{
  REGIONS:[{id:'home',name:'阳光花园',sub:'Sunlit Garden'},{id:'sakura',name:'樱花林',sub:'Sakura Woods'}]
 });
 assert.equal(window.SaveManager.registerAdapter('test-runtime',{version:1,serialize:()=>adapterRuntime,restore:value=>{adapterRuntime=value;},reset:()=>{adapterRuntime={phase:'idle',npcTrust:0};}}),true);
 return window.State;
};
let State=bootSaveManager();
assert.equal(State.loadSlot('slot1'),false,'empty slots must not load');
for(const [id,coins,region,trust] of [
 ['slot1',101,'home',11],['slot2',202,'sakura',22],['slot3',303,'home',33]
]){
 assert.equal(State.startNewGame(id),true,'new adventure should create '+id);
 State.S.coins=coins;
 State.S.worldmap={current:region,regions:{[region]:{explored:.25,nodes:['relic-'+id]}}};
 State.S.story={fragments:['memory-'+id],visited:{[region]:true}};
 State.S.futureNpcSystem={relationships:{kite:trust},choices:{truth:'keep'}};
 State.S.inventory={fish:coins%10,rareItems:['bell-'+id]};
 State.S.yardBuildings=[{id:'bench-'+id,level:coins%5+1}];
 State.S.duoRelations={pairs:{['cat-a|cat-b']:{value:trust}}};
 adapterRuntime={phase:id,npcTrust:trust};
 assert.equal(State.save().ok,true,'save should commit '+id);
}
assert.deepEqual(State.listSaveSlots().map(s=>s.coins),[101,202,303],'three slots must retain distinct progress');
assert.deepEqual(State.listSaveSlots().map(s=>s.regionId),['home','sakura','home'],'slot metadata must retain each current region');
assert.equal(State.saveToSlot('slot2').reason,'confirmation_required','manual overwrite must require explicit confirmation');
assert.equal(State.loadSlot('slot1'),true);
const activeBeforeCopy=State.activeSlot();
State.S.coins=909;
adapterRuntime={phase:'boss',npcTrust:99};
assert.equal(State.saveToSlot('slot2',{overwriteConfirmed:true}).ok,true,'confirmed manual overwrite should work');
assert.equal(State.activeSlot(),activeBeforeCopy,'saving a copy to another slot must not switch the active slot');
let refreshed=bootSaveManager();
assert.equal(refreshed.loadSlot('slot2'),true,'a fresh runtime must load after browser refresh');
assert.equal(refreshed.S.coins,909);
assert.deepEqual(adapterRuntime,{phase:'boss',npcTrust:99},'registered runtime adapters must restore their versioned data');
assert.equal(refreshed.S.futureNpcSystem.relationships.kite,11,'dynamic future NPC state must survive');
assert.equal(refreshed.S.inventory.rareItems[0],'bell-slot1');
assert.equal(refreshed.S.yardBuildings[0].id,'bench-slot1');
assert.equal(refreshed.S.duoRelations.pairs['cat-a|cat-b'].value,11);
assert.equal(refreshed.loadSlot('slot3'),true);
assert.equal(refreshed.S.coins,303,'overwriting slot 2 must not affect slot 3');
assert.deepEqual(adapterRuntime,{phase:'slot3',npcTrust:33},'each slot must restore its own adapter state');
assert.equal(refreshed.startNewGame('slot1'),false,'new game must not silently overwrite an occupied slot');
const reset=refreshed.hardReset();
assert.equal(reset.preservedSlots,true,'emergency reset must preserve all save slots');
assert.equal(refreshed.save().reason,'suppressed','pagehide autosave must not overwrite slots during emergency reload');
const afterReset=bootSaveManager();
assert.equal(afterReset.loadSlot('slot1'),true);
assert.equal(afterReset.S.coins,101,'slot 1 must survive emergency reset');
assert.equal(afterReset.loadSlot('slot2'),true);
assert.equal(afterReset.S.coins,909);
assert.equal(afterReset.loadSlot('slot3'),true);
assert.equal(afterReset.S.coins,303);
const storageKey=afterReset.SAVE_SLOTS_KEY;
const beforeFailedWrite=localValues.get(storageKey);
afterReset.S.coins=404;
rejectStorageKey=storageKey;
const failedWrite=afterReset.save();
rejectStorageKey=null;
assert.equal(failedWrite.ok,false,'quota failure must be reported');
assert.equal(localValues.get(storageKey),beforeFailedWrite,'failed write must leave the previous complete save book intact');
const afterFailedWrite=bootSaveManager();
assert.equal(afterFailedWrite.loadSlot('slot3'),true);
assert.equal(afterFailedWrite.S.coins,303,'failed write must not corrupt the previous slot');
const damagedBook=JSON.parse(localValues.get(storageKey));
damagedBook.slots.slot1.checksum='invalid';
localValues.set(storageKey,JSON.stringify(damagedBook));
const damaged=bootSaveManager().listSaveSlots().find(s=>s.id==='slot1');
assert.equal(damaged.exists,true);
assert.equal(damaged.readable,false);
assert.equal(damaged.corrupt,true,'corrupt save should be detected and blocked from loading');
const cloudRestore=bootSaveManager();
const remoteSnapshot=cloudRestore.getSaveSlot('slot3').data;
assert.equal(cloudRestore.replaceSaveSlots({slot2:{data:remoteSnapshot,savedAt:Date.now()}},'slot2').ok,true,'cloud restore must atomically replace the local save book');
const restoredCloudBook=bootSaveManager();
assert.equal(restoredCloudBook.activeSlot(),'slot2');
assert.equal(restoredCloudBook.loadSlot('slot2'),true);
assert.equal(restoredCloudBook.S.coins,303,'cloud restore must restore the chosen slot snapshot');

// D1 stores three independent encrypted rows, with independent compare-and-swap revisions.
class FakeStatement{
 constructor(db,sql){this.db=db;this.sql=sql;this.args=[];}
 bind(...args){this.args=args;return this;}
 async run(){
  if(this.sql.includes('CREATE TABLE IF NOT EXISTS cat_bond_cloud_saves'))return {success:true};
  if(this.sql.includes('INSERT INTO cat_bond_cloud_saves')){
   const [keyHash,iv,ciphertext,updatedAt,byteLength,expected]=this.args;
   const old=this.db.rows.get(keyHash);
   if((old?.revision??0)!==expected)return {success:true,meta:{changes:0}};
   this.db.rows.set(keyHash,{key_hash:keyHash,iv,ciphertext,revision:(old?.revision||0)+1,updated_at:updatedAt,byte_length:byteLength});
   return {success:true,meta:{changes:1}};
  }
  throw Error('Unexpected D1 write: '+this.sql);
 }
 async first(){
  const [hash]=this.args;
  if(this.sql.includes('SELECT iv,ciphertext,revision,updated_at')){
   return this.db.rows.get(hash)||null;
  }
  if(this.sql.includes('SELECT revision FROM cat_bond_cloud_saves')){
   const row=this.db.rows.get(hash);return row?{revision:row.revision}:null;
  }
  throw new Error('Unexpected SQL in cloud-save test: '+this.sql);
 }
}
class FakeDB{
 constructor(){this.rows=new Map();}
 prepare(sql){return new FakeStatement(this,sql);}
}
const db=new FakeDB(),env={DB:db};
const token='A'.repeat(43),otherToken='B'.repeat(43);
const url='https://game.example/api/cat-bond-cloud-save';
const req=(method,auth,body,slotId)=>new Request(url+(slotId?'?slot='+slotId:''),{
 method,headers:{...(auth?{authorization:'Bearer '+auth}:{}),...(body?{'content-type':'application/json'}:{})},
 body:body?JSON.stringify(body):undefined
});
let response=await catBondCloudSave(req('GET',null),env);
assert.equal(response.status,401,'unauthenticated reads must be rejected');
response=await catBondCloudSave(req('PUT',token,{slotId:'slot1',iv:'C'.repeat(16),ciphertext:'D'.repeat(64),expectedRevision:0}),env);
assert.equal(response.status,200,'slot 1 should create revision 1');
let data=await response.json();assert.equal(data.revision,1);
response=await catBondCloudSave(req('PUT',token,{slotId:'slot2',iv:'E'.repeat(16),ciphertext:'F'.repeat(64),expectedRevision:0}),env);
data=await response.json();assert.equal(response.status,200);assert.equal(data.revision,1,'slot 2 has its own revision counter');
response=await catBondCloudSave(req('GET',token,null,'slot1'),env);
data=await response.json();assert.equal(response.status,200);assert.equal(data.exists,true);assert.equal(data.ciphertext,'D'.repeat(64));
response=await catBondCloudSave(req('PUT',token,{slotId:'slot1',iv:'G'.repeat(16),ciphertext:'H'.repeat(64),expectedRevision:0}),env);
assert.equal(response.status,409,'stale slot 1 writes must conflict');
data=await response.json();assert.equal(data.revision,1);assert.equal(data.slotId,'slot1');
response=await catBondCloudSave(req('PUT',token,{slotId:'slot1',iv:'G'.repeat(16),ciphertext:'H'.repeat(64),expectedRevision:1}),env);
data=await response.json();assert.equal(response.status,200);assert.equal(data.revision,2);
response=await catBondCloudSave(req('GET',token,null,'slot2'),env);
data=await response.json();assert.equal(data.exists,true);assert.equal(data.revision,1);assert.equal(data.ciphertext,'F'.repeat(64),'slot 1 update must not overwrite slot 2');
response=await catBondCloudSave(req('GET',otherToken,null,'slot1'),env);
data=await response.json();assert.equal(data.exists,false,'recovery codes must isolate slots');
response=await catBondCloudSave(req('GET',token,null,'slot4'),env);
assert.equal(response.status,400,'unknown slot ids must be rejected');
response=await catBondCloudSave(req('PUT',token,{slotId:'slot4',iv:'C'.repeat(16),ciphertext:'D'.repeat(64),expectedRevision:0}),env);
assert.equal(response.status,400,'unknown slot writes must be rejected');
response=await catBondCloudSave(req('PUT',token,{slotId:'slot3',iv:'bad',ciphertext:'F'.repeat(64),expectedRevision:0}),env);
assert.equal(response.status,400,'malformed encrypted payloads must be rejected');
response=await catBondCloudSave(req('GET',token),{});
assert.equal(response.status,503,'missing D1 binding must fail closed');
// Legacy unslotted records remain readable for migration, but new slots use separate keys.
response=await catBondCloudSave(req('PUT',token,{iv:'I'.repeat(16),ciphertext:'J'.repeat(64),expectedRevision:0}),env);
assert.equal(response.status,200);
response=await catBondCloudSave(req('GET',token),env);
data=await response.json();assert.equal(data.exists,true,'legacy cloud snapshot remains readable');

assert.ok(story.includes("const cloudRevisionKey=id=>'catbond_cloud_revision_v2_'+id"),'cloud revision must be tracked per slot');
assert.ok(story.includes('State.replaceSaveSlots(entries'),'cloud restore must atomically replace the local save book');
assert.ok(story.includes('slotId:id,expectedRevision:expected'),'cloud uploads must target one explicit slot');
assert.ok(story.includes('data-cloud="overwrite"'),'cloud conflict resolution must offer an explicit local overwrite action');
assert.ok(story.includes('CLOUD_AUTOSYNC_INTERVAL_MS=60000'),'background cloud autosync must be throttled to protect the D1 quota');
assert.ok(!story.includes('data-delete='),'in-game save manager must not expose destructive slot deletion');
assert.ok(!main.includes('data-delete-slot'),'title save picker must not expose slot deletion');
assert.ok(!index.includes('intro-cloud-save'),'title screen must contain only the two primary game entry actions');
const resetBody=state.match(/function hardReset\(\)\s*\{([\s\S]*?)\n\}/)?.[1]||'';
assert.ok(!/\bsave\s*\(/.test(resetBody)&&resetBody.includes('preservedSlots'),'emergency reset must not write a fresh state over an existing slot');
assert.ok(state.includes('window.SaveManager = SaveManager'),'the shared Save Manager interface must be exported');
assert.ok(main.includes('catbond_resume_slot_v1'),'in-game Load Game must resume the selected slot after reload');
assert.ok(!story.includes('npcDeliver'),'NPCs must not use fetch-and-deliver quest loops');
assert.ok(story.includes('if(!page||reward?.discovery?.id!==regionId)return'),'Regional memories must be earned by finding their unique relics');
assert.ok(story.includes('if(hasAllRegionPages(s)&&ruinsNodes.includes(\'ruins_secret\')'),'The last page must require all five memories and the Moonshadow relic');
assert.ok(game.includes('WorldMap.enterMap();')&&!game.includes('UI.openMapChooser();'),'The overworld atlas must open before the region directory');
assert.ok(story.includes('showCreekRescueChoice')&&story.includes('showVolcanoAid'),'Creek memory choice must affect the Volcano support scene');
assert.ok(story.includes('actorRaf=requestAnimationFrame(animateActors)')&&story.includes('CatArt?.drawCat')&&story.includes('cb-story-atmosphere'),'Cutscenes must animate original watercolor characters and layered regional atmosphere');
console.log('Cat Bond The Last Page, character arcs, three boss phases, five story landmarks, encrypted cloud save and revision-conflict checks passed.');
