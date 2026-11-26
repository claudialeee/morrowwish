// Offline authoring audit. Separates canonical data from observed player evidence.
import fs from 'node:fs/promises';
import {campaign} from '../public/cat-bond/js/resonance/campaign.mjs';
import {execFileSync} from 'node:child_process';
const out=process.argv[2]||'artifacts/cat-bond-experience';
await fs.mkdir(out,{recursive:true});
const revision=process.env.GITHUB_SHA||execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const byId=new Map(campaign.scenes.map(s=>[s.id,s])),issues=[],chapters={},ordered=[];
const flags=(s,reason)=>issues.push({scene:s.id,reason});
for(const s of campaign.scenes){
 const requires=s.requires||[],lines=s.lines||[],choices=s.choices||[];
 if(s.previous&&!byId.has(s.previous))flags(s,'previous scene missing');
 if(new Set(requires).size!==requires.length)flags(s,'duplicate mandatory objective');
 for(const gate of s.lineGate||[])if(!requires.includes(gate))flags(s,'dialogue gate not listed as required: '+gate);
 for(const l of lines)if(!campaign.cast[l.speaker]||!l.text?.zh?.trim()||!l.text?.en?.trim())flags(s,'unknown speaker or missing localization');
 for(const c of choices)if(!c.label?.zh?.trim()||!c.label?.en?.trim())flags(s,'missing choice localization');
 const counts={};for(const op of requires){const type=op.split(':')[0];counts[type]=(counts[type]||0)+1;}
 const entry={scene:s.id,title:s.title,previous:s.previous,mandatory:requires,gate:s.lineGate||[],choiceTiming:s.choiceTiming,
   lines:lines.map(l=>({speaker:l.speaker,zh:l.text.zh,en:l.text.en})),choices:choices.map(c=>({id:c.id,label:c.label,actor:c.npc,method:c.method})),operationTypes:counts};
 ordered.push(entry);
 const ch=chapters[s.chapter]??={scenes:0,lines:0,choices:0,mandatory:0,types:{},sequence:[]};
 ch.scenes++;ch.lines+=lines.length;ch.choices+=choices.length;ch.mandatory+=requires.length;
 for(const [k,n] of Object.entries(counts))ch.types[k]=(ch.types[k]||0)+n;
 ch.sequence.push({scene:s.id,types:requires.map(op=>op.split(':')[0]),dialogueLines:lines.length,choices:choices.length});
}
// Check concrete stale presentation references against current script; these are review leads, not auto verdicts.
const dialogue=await fs.readFile('public/cat-bond/js/resonance/dialogue-ui.mjs','utf8');
const tea=byId.get('sky:S-04');
if(tea&&!tea.lines.some(l=>/修理|修复|repair/i.test(l.text.zh+' '+l.text.en))&&/修理旧铃坠|repairing the old bell pendant/.test(dialogue))flags(tea,'Presentation adds pendant repair not in canonical dialogue; remove or reconcile (confirmed by source comparison).');
const version={revision,canon:campaign.canon,openingPresentationVersion:campaign.openingPresentationVersion,sourceSha:campaign.sourceSha};
await fs.writeFile(out+'/authoring-structure.json',JSON.stringify({version,chapters,issues,ordered,limitations:['Not a rendered playthrough.','Objective count is not player click count or boredom.','Do not give this spoiler-containing file to a blind reviewer.']},null,2));
const rows=['# Campaign structure — spoiler-containing authoring audit','','Revision: '+revision,'','| Chapter | Scenes | Dialogue lines | Choice options | Required operations | Operation families |','|---|---:|---:|---:|---:|---|'];
for(const [k,c] of Object.entries(chapters))rows.push('| '+k+' | '+c.scenes+' | '+c.lines+' | '+c.choices+' | '+c.mandatory+' | '+Object.entries(c.types).map(([a,n])=>a+': '+n).join(', ')+' |');
rows.push('','## Review leads',...issues.map(i=>'- '+i.scene+': '+i.reason),'','Counts represent authored requirements, not actual player experience or difficulty. Semantic causal and emotional judgments still require review.');
await fs.writeFile(out+'/AUTHORING-STRUCTURE.md',rows.join('\n')+'\n');
console.log('Audit:',ordered.length,'scenes,',issues.length,'review leads');
