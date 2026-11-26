// Reuse existing deterministic combat policies. Keep failures explicit, never fabricate results.
import {spawnSync} from 'node:child_process';
import fs from 'node:fs/promises';
const out=process.argv[2]||'artifacts/cat-bond-experience';
await fs.mkdir(out+'/combat',{recursive:true});
const personas=['masher','cautious','explorer','panicky','lazy','impatient','balanced'];
const runs=[];
for(const persona of personas)for(const seed of [12345,90210]){
 const r=spawnSync(process.execPath,['scripts/playtest-sim.mjs',persona,'6',String(seed)],{encoding:'utf8',timeout:90000,maxBuffer:4*1024*1024});
 const file=out+'/combat/'+persona+'-'+seed+'.json';
 if(r.status===0){
   try{const data=JSON.parse(r.stdout);if(!Array.isArray(data.battles)||data.battles.length!==6||!data.summary)throw Error('invalid result');
     await fs.writeFile(file,JSON.stringify(data,null,2));runs.push({persona,seed,status:'measured',summary:data.summary});continue;
   }catch(error){runs.push({persona,seed,status:'invalid-output',error:String(error)});continue;}
 }
 runs.push({persona,seed,status:'failed',exit:r.status,error:String(r.error||r.stderr||'unknown').slice(0,4000)});
}
const measured=runs.filter(r=>r.status==='measured');
await fs.writeFile(out+'/combat/summary.json',JSON.stringify({runs,measuredBattles:measured.length*6,limitations:['Fake DOM legacy capture battle simulation; not regional boss playthrough or real player behavior.','Policy skill/idle metrics are proxies; not enjoyment.','No fabricated results for failed runs.']},null,2));
console.log('Combat simulation:',measured.length,'of',runs.length,'policy/seed runs measured');
if(measured.length!==runs.length)process.exitCode=1;
