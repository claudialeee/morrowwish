// Conservative incremental chapter selection. Never substitute this for full release acceptance.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const entries=Object.freeze({
  harbor:'harbor:H-01', forest:'forest:R-01', forge:'forge:E-01', sky:'sky:S-01',
  library:'library:M-01', starfall:'starfall:F-01', finale:'finale:B-01', epilogue:'epilogue:E-01'
});
const all=Object.keys(entries);
const local=Object.freeze({
  'public/cat-bond/js/resonance/harbor-presentation.mjs':['harbor'],
  'public/cat-bond/js/resonance/forge-presentation.mjs':['forge']
});
const openingPlaytestFiles=new Set([
  "scripts/test-cat-bond-canon22-spatial.mjs",
  "scripts/cat-bond-experience-chapters.mjs",
  "public/cat-bond/js/sunlit-garden.js",
  "public/cat-bond/js/resonance/npc-world.mjs",
  "public/cat-bond/js/resonance/canon22-spatial.mjs",
  "public/cat-bond/js/resonance/world-runtime.mjs",
  "scripts/cat-bond-experience-qa-scope.mjs"
]);
const festivalPlaytestFiles=new Set(["public/cat-bond/js/resonance/world-exploration.mjs","public/cat-bond/js/resonance/world-runtime.mjs","public/cat-bond/js/resonance/world-mechanisms.mjs","public/cat-bond/js/resonance/forge-presentation.mjs","public/cat-bond/js/resonance/world-bridge.mjs","public/cat-bond/js/resonance/regional-combat.mjs","scripts/cat-bond-experience-chapters.mjs","scripts/check-cat-bond-resonance-world.mjs","scripts/cat-bond-experience-qa-scope.mjs"]);
const latePlaytestFiles=new Set(["public/cat-bond/js/resonance/campaign.mjs","public/cat-bond/js/resonance/sky-lookout.mjs","public/cat-bond/js/resonance/world-runtime.mjs","scripts/cat-bond-experience-qa-scope.mjs"]);
const homecomingFiles=new Set(["public/cat-bond/js/sunlit-garden.js","public/cat-bond/js/game.js","public/cat-bond/js/resonance/finale-combat.mjs","scripts/cat-bond-experience-chapters.mjs","scripts/cat-bond-experience-qa-scope.mjs"]);
const qaFiles=new Set([".github/actions/starbell-browser-setup/action.yml",".github/workflows/cat-bond-canon22-browser.yml",".github/workflows/cat-bond-canon22-fresh.yml",".github/workflows/cat-bond-preview.yml",".github/workflows/starbell-canon22-playtest.yml","docs/cat-bond-rpg/QA-OPTIMIZATION.md","scripts/cat-bond-experience-qa-scope.mjs"]);
function impact(files) {
  if (!files.length || files.some(f=>!Object.hasOwn(local,f))) return all;
  const affected=new Set(files.flatMap(f=>local[f]));
  return all.filter(ch=>affected.has(ch));
}
const visualFidelityFiles=new Set(["public/cat-bond/js/resonance/library-mechanisms.mjs","public/cat-bond/js/resonance/dialogue-ui.mjs","public/cat-bond/js/resonance/sky-lookout.mjs","public/cat-bond/css/resonance-host.css","scripts/cat-bond-experience-chapters.mjs","scripts/cat-bond-experience-qa-scope.mjs",".github/workflows/cat-bond-preview.yml","docs/cat-bond-rpg/PLAYTEST-WORK-HANDOFF.md"]);
const fidelityFiles=new Set(["public/cat-bond/js/resonance-cinematic.mjs","public/cat-bond/js/resonance/dialogue-ui.mjs","public/cat-bond/js/resonance/library-mechanisms.mjs","scripts/cat-bond-experience-chapters.mjs","scripts/cat-bond-experience-qa-scope.mjs","public/cat-bond/js/resonance/sky-lookout.mjs","docs/cat-bond-rpg/PLAYTEST-WORK-HANDOFF.md"]);
const audioOnly=new Set(["public/cat-bond/js/rpg-audio.js","scripts/test-cat-bond-rpg-audio-lifecycle.mjs","scripts/cat-bond-title-audio-qa.mjs","scripts/cat-bond-experience-qa-scope.mjs",".github/workflows/cat-bond-canon22-browser.yml",".github/workflows/cat-bond-preview.yml"]);
function choose({manual='',message='',files=[],review=false}={}) {
  if(!manual&&message.includes('[qa-windchime-playtest]')&&files.length&&files.every(f=>openingPlaytestFiles.has(f)))return ['harbor'];
  if(!manual&&message.includes('[qa-late-playtest]')&&files.length&&files.every(f=>latePlaytestFiles.has(f)))return ['forge','sky','starfall'];
  if(!manual&&message.includes('[qa-festival-playtest]')&&files.length&&files.every(f=>festivalPlaytestFiles.has(f)))return ['forest','forge'];
  if(!manual&&message.includes('[qa-homecoming-playtest]')&&files.length&&files.every(f=>homecomingFiles.has(f)))return ['finale','epilogue'];
  if(!manual&&message.includes('[qa-title-audio]')&&files.length&&files.every(f=>audioOnly.has(f)))return [];
  if(!manual&&message.includes('[qa-fidelity-visual]')&&files.length&&files.every(f=>visualFidelityFiles.has(f)))return ['sky','library','starfall','finale','epilogue'];
  if(!manual&&message.includes('[qa-fidelity-3]')&&files.length&&files.every(f=>fidelityFiles.has(f)))return ['sky','library','starfall'];
  if (manual==='chapters'||message.includes('[qa-full]')||message.includes('[fresh-campaign]')) return all;
  if (manual==='tail'||(!manual&&message.includes('[qa-tail]'))) return ['finale','epilogue'];
  if (manual) {
    const requested=manual.split(',').map(s=>s.trim());
    if (requested.some(s=>!Object.hasOwn(entries,s))) throw Error('Invalid explicit chapter scope: '+manual);
    return all.filter(s=>requested.includes(s));
  }
  if (message.includes('[qa-toolchain]')&&files.length&&files.every(f=>qaFiles.has(f))) return ['harbor'];
  if (review) return ['harbor']; // isolated toolchain smoke only, never release evidence
  return impact(files);
}
const harbor=Object.keys(local)[0], forge=Object.keys(local)[1];
assert.deepEqual(choose({files:[harbor]}),['harbor']);
assert.deepEqual(choose({files:[forge,harbor]}),['harbor','forge']);
assert.deepEqual(choose({files:[harbor,'public/cat-bond/js/resonance/engine.mjs']}),all);
assert.deepEqual(choose({files:[]}),all);
assert.deepEqual(choose({files:[harbor],message:'[qa-full]'}),all);
assert.deepEqual(choose({files:[harbor],message:'[fresh-campaign]'}),all);
assert.deepEqual(choose({manual:'sky,forest'}),['forest','sky']);
assert.deepEqual(choose({manual:'tail'}),['finale','epilogue']);
assert.deepEqual(choose({manual:'chapters',review:true}),all);
assert.throws(()=>choose({manual:'sky,typo'}));
assert.deepEqual(choose({files:[...qaFiles],message:'[qa-toolchain]'}),['harbor']);
assert.deepEqual(choose({files:[harbor,'public/cat-bond/js/resonance/engine.mjs'],message:'[qa-toolchain]'}),all);
assert.deepEqual(choose({files:[],message:'[qa-toolchain]'}),all);
assert.deepEqual(choose({files:[...fidelityFiles],message:'[qa-fidelity-3]'}),['sky','library','starfall']);
assert.deepEqual(choose({files:[...fidelityFiles,'public/cat-bond/js/resonance/engine.mjs'],message:'[qa-fidelity-3]'}),all);
assert.deepEqual(choose({files:[...visualFidelityFiles],message:'[qa-fidelity-visual]'}),['sky','library','starfall','finale','epilogue']);
assert.deepEqual(choose({files:[...audioOnly],message:'[qa-title-audio]'}),[]);
assert.deepEqual(choose({files:[...audioOnly,'public/cat-bond/js/resonance/engine.mjs'],message:'[qa-title-audio]'}),all);
assert.deepEqual(choose({files:[...openingPlaytestFiles],message:'[qa-windchime-playtest]'}),['harbor']);
assert.deepEqual(choose({files:[...openingPlaytestFiles,'public/cat-bond/js/resonance/engine.mjs'],message:'[qa-windchime-playtest]'}),all);
if (process.argv.includes('--self-test')) { console.log('QA scope: 15 assertions passed'); process.exit(0); }
const {BEFORE='',HEAD='',MANUAL_SCOPE='',COMMIT_MESSAGE='',TOOLCHAIN_ONLY='false'}=process.env;
let files=[];
if (/^[0-9a-f]{40}$/.test(BEFORE)&&/^[0-9a-f]{40}$/.test(HEAD)&&!/^0+$/.test(BEFORE)) {
  try {
    // Diff all commits in the push, not only the last commit. Unknown/unavailable base => full.
    files=execFileSync('git',['diff','--no-renames','--name-only','-z',BEFORE,HEAD],{encoding:'utf8'}).split('\0').filter(Boolean);
  } catch (e) { console.error('No reliable changed-file set; selecting full matrix'); }
}
const chapters=choose({manual:MANUAL_SCOPE,message:COMMIT_MESSAGE,files,review:TOOLCHAIN_ONLY==='true'});
const result={include:chapters.map(chapter=>({chapter,entry:entries[chapter]}))};
console.error(JSON.stringify({head:HEAD,changedFiles:files,selected:chapters,fullChapterMatrix:chapters.length===all.length,isolatedSmoke:TOOLCHAIN_ONLY==='true'},null,2));
console.log(JSON.stringify(result));
