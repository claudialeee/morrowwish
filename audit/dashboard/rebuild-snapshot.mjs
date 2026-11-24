// Offline only. No network, no database, no deployment.
import fs from 'node:fs';
function rebuild(s){
 const checks=[];
 const check=(name,actual,expected)=>{checks.push({name,actual,expected,pass:actual===expected});};
 const sig=(g,k)=>Object.hasOwn(g.signals||{},k)?g.signals[k]:null;
 const pct=(n,d)=>n===null||!d?null:Math.round(n/d*1000)/10;
 const b=s.byGame.find(g=>g.game==="cat-bond");if(!b)throw Error("Missing Cat Bond");
 const ds=s.byPacificDay.map(d=>({day:d.day,g:d.byGame.find(g=>g.game==="cat-bond")})).filter(d=>d.g);
 check("Cat Bond duplicate snapshot section matches byGame",JSON.stringify(s.catBond),JSON.stringify(b));
 for(const k of ["rawRows","visitRows","sessionRows","rawBattleStarts","rawBattleFinishes","rawRetries"])check("Cat Bond daily additive "+k,ds.reduce((a,d)=>a+d.g[k],0),b[k]);
 for(const k of Object.keys(b.signals))check("Cat Bond daily additive signal "+k,ds.reduce((a,d)=>a+(sig(d.g,k)??0),0),sig(b,k));
 check("Cat Bond rows reconcile",b.visitRows+b.sessionRows,b.rawRows);
 check("All arcade rows reconcile with scope (this snapshot)",s.byGame.reduce((a,g)=>a+g.rawRows,0),s.scope.rowsAfterSessionSequenceDedup);
 check("Snapshot reported no sequence duplicates",s.scope.rawEventRows,s.scope.rowsAfterSessionSequenceDedup);
 const metrics=g=>({pageLoadRows:g.visitRows,distinctPageKeys:g.uniquePageVisits,recordedGameEntries:sig(g,"bond_enter"),recordedFirstPlaySignals:sig(g,"funnel_first_run"),legacyStartedPageVisits:g.startedPageVisits,legacyFinishedPageVisits:g.finishedPageVisits,legacyMixedStarts:g.rawBattleStarts,legacyEnds:g.rawBattleFinishes,v11PageVisits:g.trackingV11PageVisits,v11EnteredPageVisits:g.trackingV11EnteredViews,v11FinishedPageVisits:g.trackingV11FinishedViews,v11EntryRate:pct(g.trackingV11EnteredViews,g.trackingV11PageVisits),v11FinishPerEntryRate:pct(g.trackingV11FinishedViews,g.trackingV11EnteredViews),v11BattleStarts:sig(g,"bond_battle_start_v2"),v11BattleFinishes:sig(g,"bond_battle_end_v2"),allHistoricalBattleStarts:null,allHistoricalBattleFinishes:null,allHistoricalGameStarts:null,allHistoricalGameRestarts:null,legacyRetrySignals:g.rawRetries,recordedReplayAfterFinish:sig(g,"funnel_replay_after_finish"),legacyGameplaySignals:g.signals});
 return {status:"SNAPSHOT_RECONCILIATION_ONLY_NOT_PRODUCTION_VERIFIED",source:{generatedAt:s.generatedAt,startTimestamp:s.scope.startTimestamp,lastEventAt:s.lastEventAt,rawEventRows:s.scope.rawEventRows},catBond:metrics(b),catBondByPacificDay:ds.map(d=>({day:d.day,...metrics(d.g)})),allGames:s.byGame.map(g=>({game:g.game,pageLoadRows:g.visitRows,distinctPageKeys:g.uniquePageVisits,recordedFirstPlaySignals:sig(g,"funnel_first_run"),legacyStarts:g.rawBattleStarts,legacyEnds:g.rawBattleFinishes,legacyStartedPageVisits:g.startedPageVisits,legacyFinishedPageVisits:g.finishedPageVisits})),checks,limitations:["Existing aggregate export only; raw event rows not available. No production requests made.","Signal counts are recorded observations, not proof of full historical coverage. Null means unrecoverable/unverified from this snapshot, not zero.","Legacy started/finished page counts use mixed counters. They cannot validate game-entry or game-completion conversions.","V11 page funnel measures entry and at least one battle finish, not entire game completion. V2 battle signal counts in the snapshot are not proven cohort-filtered.","Daily unique counts are not necessarily additive across midnight.","Internal QA traffic, missing events, visit retry duplication, and restore completeness cannot be independently verified without raw events and provenance."]};
}
const source=JSON.parse(fs.readFileSync(process.argv[2]||'recovery/d1-analytics-audit.json','utf8'));
const report=rebuild(source);
console.log(JSON.stringify(report,null,2));
if(report.checks.some(c=>!c.pass)) process.exitCode=1;
