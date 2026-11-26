// Compress raw browser traces into a spoiler-free experience review packet.
import fs from 'node:fs/promises';
import path from 'node:path';
const root=process.argv[2]||'artifacts/cat-bond-experience';
const files=(await fs.readdir(root)).filter(x=>x.endsWith('.jsonl')).sort();
if(!files.length)throw Error('No real-play evidence was recorded');
const summaries=[];
for(const file of files){
 const raw=(await fs.readFile(path.join(root,file),'utf8')).trim();
 const events=raw?raw.split('\n').map(line=>JSON.parse(line)):[];
 const run=events.find(e=>e.kind==='run')||{};
 const screens=events.filter(e=>e.kind==='screen'), actions=events.filter(e=>e.kind==='action'||e.kind==='key');
 const issues=events.filter(e=>['pageerror','http_error','recorder_error','truncated'].includes(e.kind));
 const scenes=new Map();let last=null;
 const chapters=new Set();
 for(const e of screens){
  if(e.scene)chapters.add(e.scene.split(':')[0]);
  const id=e.scene||e.area||'title';
  if(!last||last.id!==id){
    last={id,atMs:e.ms,lastMs:e.ms,screenChanges:0,actions:0,visibleText:[],seen:new Set(),area:e.area,region:e.region};scenes.set(scenes.size,last);
  }
  last.lastMs=e.ms;last.screenChanges++;
  for(const block of e.blocks||[]){
   const key=block.selector+'\n'+block.text;
   if(!last.seen.has(key)){last.seen.add(key);last.visibleText.push({atMs:e.ms,source:block.selector,text:block.text});}
  }
 }
 const timeline=[...scenes.values()].map(({seen,...s})=>({...s,actions:actions.filter(a=>a.ms>=s.atMs&&a.ms<=s.lastMs).length}));
 const byAction={};
 for(const a of actions){const key=a.action||'key:'+a.key;byAction[key]=(byAction[key]||0)+1;}
 const result={file,run,observedChapters:[...chapters],screens:screens.length,actions:actions.length,
   elapsedMs:events.at(-1)?.ms??0,issues,frequentActions:Object.entries(byAction).sort((a,b)=>b[1]-a[1]).slice(0,15),
   timeline,limitations:['Authored route, not spontaneous player behavior.','Times include automation, waits, screenshots and device performance; not human engagement.','Only sampled visible DOM text; canvas art, dialogue skipped by automation, audio and unseen branches are not inferred.','Observed scenes do not establish completed chapters or gameplay quality.']};
 summaries.push(result);
}
await fs.writeFile(path.join(root,'review-packet.json'),JSON.stringify(summaries,null,2));
const lines=['# Cat Bond — experience evidence index','','This index is not a fun score or a release acceptance. Check runner exit status separately. For player-first critique, read each run JSONL in order and do not use the internal objective IDs as player knowledge.',''];
for(const s of summaries){
 lines.push('## '+s.file,'','Observed chapters: '+(s.observedChapters.join(', ')||'none'), 'Screen changes: '+s.screens+'; inputs: '+s.actions+'; technical observations: '+s.issues.length,
 'Frequent inputs: '+s.frequentActions.map(([a,n])=>a+' × '+n).join('; '),'','| Scene/area | First seen (s) | Screen changes | Visible text entries |','|---|---:|---:|---:|');
 for(const t of s.timeline)lines.push('| '+t.id.replaceAll('|','/')+' | '+Math.round(t.atMs/1000)+' | '+t.screenChanges+' | '+t.visibleText.length+' |');
 lines.push('','Read the corresponding JSONL for full input and screen chronology; use the screenshots for visual context.','');
}
await fs.writeFile(path.join(root,'REVIEW-INDEX.md'),lines.join('\n')+'\n');
console.log('Recorded '+summaries.length+' run(s); generated review-packet.json and REVIEW-INDEX.md');
