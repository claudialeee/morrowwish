import assert from 'node:assert/strict';
import fs from 'node:fs';
import {campaign} from '../public/cat-bond/js/resonance/campaign.mjs';
import {layouts,createPuzzle,puzzleSpecs,retiredWorldOperations} from '../public/cat-bond/js/resonance/world-exploration.mjs';
import {libraryPuzzle} from '../public/cat-bond/js/resonance/library-mechanisms.mjs';
const spec=fs.readFileSync(new URL('../docs/cat-bond-rpg/02-MAIN-STORY-SCRIPT.md',import.meta.url),'utf8');
assert.match(spec,/Canon 2\.2/);
const ids=[...spec.matchAll(/^###\s+([a-z]+:[A-Z]-\d\d)\b/gm)].map(x=>x[1]);
assert.equal(ids.length,40);assert.equal(new Set(ids).size,40);
assert.deepEqual(campaign.scenes.map(s=>s.id),ids,'Identity alignment is not gameplay acceptance');
// Legacy IDs reused for new actions (flight-recorder, broken-pendant, distributed-routing,
 // NPC meeting IDs) are NOT retired operations. Their runtime is checked by browser tests.
const retiredIds=new Set(['explore:tide-logbook','puzzle:beam-mirrors','rescue:storm-boat','explore:scent-trail','puzzle:paired-water-gates','rescue:steady-channel','explore:water-marks','battle:root-echo','rescue:trapped-cats','puzzle:festival-lantern','puzzle:safety-blueprint','puzzle:heat-pressure','battle:forge-guardian','explore:letter-recipient','explore:sealed-archive','puzzle:mirror-records','puzzle:caravan-route','battle:observatory-echo']);
const stale=campaign.scenes.flatMap(s=>s.requires.filter(op=>retiredIds.has(op)).map(op=>({scene:s.id,op})));
assert.deepEqual(stale,[],'Retired required operations must never return to Canon 2.2');
for(const op of retiredWorldOperations){assert.ok(!campaign.scenes.some(s=>s.requires.includes(op)),op+' still in story');assert.ok(!Object.values(layouts).some(r=>Object.hasOwn(r.features,op)),op+' still on map');assert.ok(!Object.hasOwn(puzzleSpecs,op),op+' still in puzzle registry');assert.equal(createPuzzle(op),null,op+' remains constructible');assert.equal(libraryPuzzle(op,null),null,op+' remains constructible in library');}
const names=[{actor:'jiedeng',expected:'檐灯',actual:campaign.cast.jiedeng.name.zh}].filter(x=>x.expected!==x.actual);
const gates=[['prologue','optional background and encounter, both convergence routes'],['harbor','moving echo chase, two routes, real duo win'],['forest','moving bridge collision, both routes, no compulsory boss'],['forge','light exposes real stone bridge, shadow beast combat'],['sky','continuous glide, two routes, wind, landing and recovery'],['library','novel response to changed position or rhythm, no guessed completion'],['starfall','stepping stones, local propagation, two routes'],['finale','three stages, six actual reciprocal replies, stable loop after unlock'],['epilogue','direct return vs optional revisits, accountability, second key']];
const report={canon:'2.2',revision:process.env.GITHUB_SHA||null,sceneIdsAligned:ids.length,retiredRequiredOperations:stale,staleNames:names,chapterAcceptance:gates.map(([chapter,requirement])=>({chapter,requirement,status:'UNVERIFIED_REAL_INPUT'})),fullAccepted:false};
fs.mkdirSync('artifacts/canon22',{recursive:true});fs.writeFileSync('artifacts/canon22/migration-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
if(process.argv.includes('--release'))throw Error('Canon 2.2 is not accepted until new real chapter input evidence is integrated.');
