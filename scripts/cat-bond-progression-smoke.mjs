// Cat Bond 2026 release regression: real artwork, English breed names,
// useful yard buildings and first-region combat readiness.
import assert from 'node:assert/strict';
import {startNewAdventure,continueSavedAdventure} from './cat-bond-test-start.mjs';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const origin=process.env.MOBILE_PLAYTEST_ORIGIN||'http://127.0.0.1:8765';
const problems=[];
try{
 for(const device of [
  {name:'phone',width:390,height:844,mobile:true},
  {name:'desktop',width:1140,height:745,mobile:false}
 ]){
  const ctx=await browser.newContext({
   viewport:{width:device.width,height:device.height},
   isMobile:device.mobile,hasTouch:device.mobile,deviceScaleFactor:1
  });
  const page=await ctx.newPage();
  page.on('pageerror',err=>problems.push(device.name+': '+err.message));
  try{
   await page.goto(origin+'/cat-bond/?lang=zh',{waitUntil:'domcontentloaded',timeout:30000});
   await page.waitForFunction(()=>window.__game&&window.World?.BUILDING_PRODUCTION&&
     window.CatBondDuoHero?.assetReady&&window.CatRelations,{timeout:25000});
   await startNewAdventure(page);
   const result=await page.evaluate(()=>{
    const {S}=State,game=window.__game;
    const saved=window.MorrowwishI18n.get;
    window.MorrowwishI18n.get=()=> 'en';
    const englishNames=GameData.SPECIES.map(sp=>GameData.speciesName(sp));
    const allUnique=englishNames.length===GameData.SPECIES.length&&
      new Set(englishNames).size===englishNames.length;
    const a=State.makeCat('tangyuan'),b=State.makeCat('xiaohui');
    S.cats=[a,b];
    const englishTeam=[State.catName(a),State.catName(b)];
    window.MorrowwishI18n.get=()=> 'zh';
    const chinese=GameData.speciesName('tangyuan')==='汤圆';
    window.MorrowwishI18n.get=saved;
    // Every placed facility is a persistent upgradeable investment.
    S.coins=10000;S.yardBuildings=[];
    const yard=game.yard;
    const buildingResults=[];
    for(const def of World.BUILDINGS){
      const made=yard.buildStructure(def.id);
      const index=S.yardBuildings.length-1;
      const cost1=World.upgradeCost(S.yardBuildings[index]);
      const step2=yard.upgradeStructure(index);
      const step3=yard.upgradeStructure(index);
      const maxed=yard.upgradeStructure(index);
      const facility=S.yardBuildings[index];
      const before={coins:S.coins,fish:S.fish,treats:S.treats,yarn:S.raising?.yarn||0};
      facility.lastRewardAt=0;
      yard.rewardBuildingVisit(a,facility,def);
      const after={coins:S.coins,fish:S.fish,treats:S.treats,yarn:S.raising?.yarn||0};
      const kind=World.BUILDING_PRODUCTION[def.id].kind;
      buildingResults.push({id:def.id,made,levels:[step2.level,step3.level],
        upgraded:step2.ok&&step3.ok&&!maxed.ok,maxLevel:World.buildingLevel(facility),
        kind,earned:after[kind]-before[kind],cost1});
    }
    // Two kittens visiting one facility is a real relationship interaction.
    const structure=S.yardBuildings[0];
    const levelBefore=CatRelations.pair(a,b).value;
    structure.lastVisitorAt=Date.now();structure.lastVisitorUid=a.uid;
    structure.lastBondAt=0;structure.lastRewardAt=Date.now();
    yard.rewardBuildingVisit(b,structure,World.BUILDINGS_BY_ID[structure.type]);
    const teamwork=CatRelations.pair(a,b).value-levelBefore;
    // Verify the original Moon Guard Counter artwork in the live battle
    // cut-in instead of a detached generic kitten.
    const artistic=window.CatBondDuoHero;
    const battle=new Battle.CaptureBattle(game,[a,b],GameData.speciesById('doudou'));
    game._battleTheme={region:'sakura'};
    const speciesArt=window.CatBondArtworkStatus?.breedsLoaded;
    return {englishNames,allUnique,englishTeam,chinese,
      buildingResults,teamwork,artSource:artistic.assetSource,
      assetCount:artistic.assetCount,signatureCount:artistic.signatureCount,
      speciesArt,remainingCoins:S.coins};
   });
   assert.equal(result.allUnique,true,'all current breed English names must be unique');
   assert.equal(result.chinese,true,'keep original Chinese names untouched');
   assert.deepEqual(result.englishTeam,['Mochi','Misty']);
   assert.equal(result.artSource,'63-original-painted-storyboards',
     'duo scenes must use the approved complete original paintings on every device');
   assert.equal(result.assetCount,21,'all 21 unique dynamic duo cut-ins');
   assert.equal(result.signatureCount,21,'element-specific signature catalogue');
   assert.equal(result.buildingResults.length,5);
   assert.ok(result.buildingResults.every(r=>r.made&&r.upgraded&&r.maxLevel===3
       &&r.earned>0),
     'all facilities must actually upgrade and produce resources: '+
      JSON.stringify(result.buildingResults));
   assert.ok(result.teamwork>=1,
     'two cats visiting one facility must actually earn bond trust');
   await page.screenshot({path:'/tmp/cat-bond-progress-'+device.name+'.png'});
   console.log('CAT BOND PROGRESSION PASS '+device.name+' '+JSON.stringify(result));
  }catch(e){problems.push(device.name+' '+e.stack);console.error(e)}
  finally{await ctx.close()}
 }
}finally{await browser.close()}
if(problems.length){console.error('CAT BOND PROGRESSION FAIL',problems.join('\n'));process.exitCode=1}
