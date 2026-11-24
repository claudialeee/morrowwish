import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {webcrypto} from 'node:crypto';

globalThis.crypto??=webcrypto;
const read=path=>fs.readFile(new URL('../'+path,import.meta.url),'utf8');
const [story,painted,worldmap,game,battle,ui,index,worker,state,serverSource,buildSource,deploySource]=await Promise.all([
 read('public/cat-bond/js/story-cloud.js'),
 read('public/cat-bond/js/painted-regions.js'),
 read('public/cat-bond/js/worldmap.js'),
 read('public/cat-bond/js/game.js'),
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
new Function(painted);
new Function(worldmap);
new Function(game);
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
 ['entry points and cache versions',index,['css/style.css?v=story-actors-starter-order-20261124-v3','js/main.js?v=starter-before-prologue-20261124-v5','id="intro-cloud-save"','js/story-cloud.js?v=story-memory-on-discovery-20261124-v5','js/game.js?v=overworld-first-20261124-v2','js/worldmap.js?v=last-page-interactive-overworld-20261124-v4','js/battle.js?v=']],
 ['cloud route',worker,['catBondCloudSave(request,env)','/api/cat-bond-cloud-save']],
 ['local save compatibility',state,['catbond_save_v1']]
]){
 for(const needle of needles)assert.ok(source.includes(needle),name+' missing '+needle);
}

const {catBondCloudSave}=await import('data:text/javascript;base64,'+Buffer.from(serverSource).toString('base64'));
class FakeStatement{
 constructor(db,sql){this.db=db;this.sql=sql;this.args=[];}
 bind(...args){this.args=args;return this;}
 async run(){assert.ok(this.sql.includes('CREATE TABLE IF NOT EXISTS cat_bond_cloud_saves'));return {success:true};}
 async first(){
  const [hash]=this.args;
  if(this.sql.includes('SELECT iv,ciphertext,revision,updated_at')){
   return this.db.rows.get(hash)||null;
  }
  if(this.sql.includes('SELECT revision FROM cat_bond_cloud_saves')){
   const row=this.db.rows.get(hash);return row?{revision:row.revision}:null;
  }
  if(this.sql.includes('INSERT INTO cat_bond_cloud_saves')){
   const [keyHash,iv,ciphertext,updatedAt,byteLength,expected]=this.args;
   const old=this.db.rows.get(keyHash);
   if((old?.revision??0)!==expected)return null;
   const row={key_hash:keyHash,iv,ciphertext,revision:(old?.revision||0)+1,updated_at:updatedAt,byte_length:byteLength};
   this.db.rows.set(keyHash,row);
   return {revision:row.revision,updated_at:row.updated_at};
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
const req=(method,auth,body)=>new Request(url,{method,headers:{...(auth?{authorization:'Bearer '+auth}:{}),...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
let response=await catBondCloudSave(req('GET',null),env);
assert.equal(response.status,401,'unauthenticated reads must be rejected');
response=await catBondCloudSave(req('PUT',token,{iv:'C'.repeat(16),ciphertext:'D'.repeat(64),expectedRevision:0}),env);
assert.equal(response.status,200,'first encrypted save should create revision 1');
let data=await response.json();assert.equal(data.revision,1);
response=await catBondCloudSave(req('GET',token),env);
data=await response.json();assert.equal(response.status,200);assert.equal(data.exists,true);assert.equal(data.ciphertext,'D'.repeat(64));
response=await catBondCloudSave(req('PUT',token,{iv:'E'.repeat(16),ciphertext:'F'.repeat(64),expectedRevision:0}),env);
assert.equal(response.status,409,'stale writes must not overwrite another device');
data=await response.json();assert.equal(data.revision,1);
response=await catBondCloudSave(req('PUT',token,{iv:'E'.repeat(16),ciphertext:'F'.repeat(64),expectedRevision:1}),env);
data=await response.json();assert.equal(response.status,200);assert.equal(data.revision,2);
response=await catBondCloudSave(req('GET',otherToken),env);
data=await response.json();assert.equal(data.exists,false,'recovery codes must isolate saves');
response=await catBondCloudSave(req('PUT',token,{iv:'bad',ciphertext:'F'.repeat(64),expectedRevision:2}),env);
assert.equal(response.status,400,'malformed encrypted payloads must be rejected');
response=await catBondCloudSave(req('GET',token),{});
assert.equal(response.status,503,'missing D1 binding must fail closed');

assert.ok(!story.includes('npcDeliver'),'NPCs must not use fetch-and-deliver quest loops');
assert.ok(story.includes('if(!page||reward?.discovery?.id!==regionId)return'),'Regional memories must be earned by finding their unique relics');
assert.ok(worldmap.includes('if(hasAllRegionPages(s)&&ruinsNodes.includes(\'ruins_secret\')'),'The last page must require all five memories and the Moonshadow relic');
assert.ok(game.includes('WorldMap.enterMap();')&&!game.includes('UI.openMapChooser();'),'The overworld atlas must open before the region directory');
assert.ok(story.includes('showCreekRescueChoice')&&story.includes('showVolcanoAid'),'Creek memory choice must affect the Volcano support scene');
console.log('Cat Bond The Last Page, character arcs, three boss phases, five story landmarks, encrypted cloud save and revision-conflict checks passed.');
