// Lightweight release regression for Cat Bond host-specific behavior.
// Run with: node scripts/check-cat-bond-host.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('public/cat-bond/js/platform.js','utf8');
const portal=fs.readFileSync('public/portal-mode.js','utf8');
const html=fs.readFileSync('public/cat-bond/index.html','utf8');
const telemetry=fs.readFileSync('public/telemetry.js','utf8');
const main=fs.readFileSync('public/cat-bond/js/main.js','utf8');
const fullscreen=fs.readFileSync('public/game-fullscreen.js','utf8');
const submission=fs.readFileSync('scripts/crazygames-complete-drafts.mjs','utf8');

for(const [name,content] of [
  ['platform.js',source],['portal-mode.js',portal],['telemetry.js',telemetry],
  ['main.js',main],['game-fullscreen.js',fullscreen],
])new vm.Script(content,{filename:name});

function boot(url,referrer=''){
  const classes=new Set();
  const win={location:new URL(url)};
  const doc={referrer,documentElement:{classList:{add:x=>classes.add(x)}}};
  vm.runInNewContext(source,{window:win,document:doc,URL,URLSearchParams});
  return {win,doc,classes};
}
const hostCases=[
  ['web','https://morrowwish.vercel.app/cat-bond/?lang=en','',true,false],
  ['crazygames','https://morrowwish.vercel.app/cat-bond/?utm_source=crazygames&utm_medium=portal','',false,true],
  ['crazygames','https://morrowwish.pages.dev/cat-bond/','https://www.crazygames.com/game/cat-bond',false,true],
  ['crazygames','https://morrowwish.pages.dev/cat-bond/?platform=crazygames','',false,true],
  ['steam','https://morrowwish.pages.dev/cat-bond/?platform=steam','',true,true],
  ['ios','https://morrowwish.pages.dev/cat-bond/?platform=ios','',true,true],
  ['portal','https://morrowwish.pages.dev/cat-bond/?utm_source=itch&utm_medium=portal','',true,false],
];
for(const [host,url,referrer,analytics,ownsFullscreen] of hostCases){
  const {win,classes}=boot(url,referrer);
  assert.equal(win.CatBondPlatform.host,host,url);
  assert.equal(win.CatBondPlatform.firstPartyAnalytics,analytics,url);
  assert.equal(win.CatBondPlatform.ownsFullscreen,ownsFullscreen,url);
  assert.equal(classes.has('cb-cg'),host==='crazygames',url);
}
const {win,doc}=boot(hostCases[1][1]);
const links=['/','/pawsibly-innocent/','/cat-bond/','https://external.example/'].map(href=>({
  hidden:false,getAttribute(){return href},setAttribute(k,v){this[k]=v;},tabIndex:0,
}));
doc.readyState='complete';
doc.querySelectorAll=()=>links;
vm.runInNewContext(portal,{window:win,document:doc,location:win.location,URL,URLSearchParams});
assert.equal(links[0].hidden,true,'Portal cannot link to the studio homepage');
assert.equal(links[1].hidden,true,'Portal cannot promote another playable game');
assert.equal(links[2].hidden,false,'Portal does not hide a local self-reference');
assert.equal(links[3].hidden,false,'Non-game external links are evaluated separately');
assert.ok(html.indexOf('src="js/platform.js')>0&&
  html.indexOf('src="js/platform.js')<html.indexOf('rel="stylesheet"'),
  'Host mode must be set before the game CSS and deferred scripts load');
assert.match(html,/id="intro-start"/);
assert.match(html,/id="intro-continue"/);
assert.match(html,/id="cb-system-toggle"/);
assert.ok(!html.includes('id="intro-reset"'));
assert.ok(telemetry.includes("CatBondPlatform?.firstPartyAnalytics===false"),
  'Third-party mode disables first-party tracking');
assert.ok(telemetry.includes('if(!disabled&&navigator.globalPrivacyControl'),
  'No persistent visitor ID should be created when tracking is disabled');
assert.ok(main.includes("window.addEventListener('pagehide'")&&
  main.includes("document.addEventListener('visibilitychange'"),
  'Browser and native WebView background paths should both save');
assert.ok(fullscreen.includes('window.CatBondPlatform?.ownsFullscreen'));
assert.ok(!main.includes('localStorage.clear()'),'Developer fixtures must not wipe unrelated saves');
assert.ok(main.includes("location.hostname"),'Developer fixtures are allowed only on localhost');
assert.ok(submission.includes("'cat-bond':{category:'Adventure'"));
console.log('CAT BOND HOST / PORTAL RELEASE GATE PASS ('+hostCases.length+' host modes)');
