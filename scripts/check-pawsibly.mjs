/* Deterministic integration smoke test for the third flagship world. */
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync('public/pawsibly-innocent/game.js','utf8');
new vm.Script(source,{filename:'game.js'});
const nop=()=>{},nodes=new Map(),events=[],listeners={},saved={},pendingIntervals=new Map();let intervalId=0;
const ctx=new Proxy({createLinearGradient:()=>({addColorStop:nop})},{get(o,k){return o[k]??nop}});
function element(id){return{id,style:{setProperty:nop},classList:{add:nop,remove:nop,toggle:nop},hidden:false,appendChild:nop,setAttribute:nop,querySelectorAll:()=>[],
addEventListener(type,callback){listeners[id+':'+type]=callback},getContext:()=>ctx,
getBoundingClientRect:()=>({left:0,top:0,width:840,height:588})}}
const document={getElementById(id){if(!nodes.has(id))nodes.set(id,element(id));return nodes.get(id)},createElement:element,querySelectorAll:()=>[]};
const window={MorrowwishI18n:{get:()=>'en'},arcadeMetric:(name,payload)=>events.push({name,payload}),addEventListener(name,handler){listeners[name]=handler}};
let frames=0;
vm.runInNewContext(source,{window,document,performance:{now:()=>1000},navigator:{},Date,Math,console,
 URLSearchParams,location:{search:''},
 localStorage:{getItem:key=>saved[key]??null,setItem:(key,value)=>saved[key]=value},
 requestAnimationFrame:fn=>{if(frames++===0)fn(1250)},setInterval:fn=>{pendingIntervals.set(++intervalId,fn);return intervalId},clearInterval:id=>pendingIntervals.delete(id),setTimeout:()=>1,clearTimeout:nop},{timeout:2500});
const test=window.__PAWSIBLY_TEST__;
assert.equal(test.rooms.length,8);
const key=p=>p.x+','+p.y;
const pass=(s,p)=>p.x>=0&&p.x<10&&p.y>=0&&p.y<7&&!['#','S'].includes(s.grid[p.y][p.x]);
function path(s,a,b){const queue=[a],seen=new Set([key(a)]),prev=new Map();for(let i=0;i<queue.length;i++){
 const p=queue[i],k=key(p);
 if(k===key(b)){const route=[];let at=k;while(at!==key(a)){const[x,y]=at.split(',').map(Number);route.unshift({x,y});at=prev.get(at)}return route}
 for(const[dx,dy]of [[1,0],[0,1],[-1,0],[0,-1]]){const n={x:p.x+dx,y:p.y+dy},v=key(n);if(pass(s,n)&&!seen.has(v)){seen.add(v);prev.set(v,k);queue.push(n)}}
}return null}
for(let i=0;i<8;i++){
 test.choose(i,false);const s=test.getState();
 assert.equal(s.grid.length,7);assert.ok(s.grid.every(r=>r.length===10));
 const floor=[s.cat,s.human,s.door,...s.fish,...s.vases,...s.boxes];
 for(const [name,p] of Object.entries({yarn:s.yarnBall,relic:s.relic,light:s.light,milk:s.milk,vacuum:s.vacuum})){
  if(!p)continue;
  assert.ok(pass(s,p)&&path(s,s.cat,p)!==null,name+' unreachable in room '+(i+1));
  assert.ok(!floor.some(q=>key(q)===key(p)),name+' overlaps an object in room '+(i+1));
 }
 assert.ok(s.fish.length>=3&&s.fish.every(p=>path(s,s.cat,p)!==null));
 assert.ok(path(s,s.cat,s.door)!==null);
}
// Review-gate regressions: distinct room mechanics must be real, not descriptions.
test.choose(3,false);
let special=test.getState(),sleeper={...special.human};
assert.equal(special.sleepTurns,9,'Room 4 must start with a sleeping owner');
test.move(1,0);
special=test.getState();
assert.equal(special.sleepTurns,8,'Owner should wake after meaningful time');
assert.deepEqual(JSON.parse(JSON.stringify(special.human)),sleeper,'Sleeping owner must remain still');
test.choose(4,false);
assert.deepEqual(JSON.parse(JSON.stringify(test.getState().creak)),{x:2,y:1},'Library has a visible squeaky tile');
test.move(1,0);
assert.equal(test.getState().creakTriggered,true,'Stepping on squeaky floor must cause a noise');
assert.ok(events.some(e=>e.name==='cat_noisy_floor'),'Noisy-floor analytics missing');
test.choose(6,false);
assert.equal(test.getState().lightTurns,8,'Midnight room must offer temporary shadows');
test.choose(7,false);
test.getState().got=3;test.move(1,0);
assert.equal(test.getState().finalAlert,true,'Final room should escalate when fish goal is reached');
assert.ok(events.some(e=>e.name==='cat_finale_chase'),'Finale chase analytics missing');
test.choose(0,false);
const startingHuman={...test.getState().human};
const stationaryCat={...test.getState().cat};
const original=test.getState().yarn;
test.throwYarn();
assert.equal(test.isAiming(),true,'Pressing yarn should enter aim mode');
assert.equal(test.getState().yarn,original,'Aiming must not consume yarn');
const target={x:8,y:1};
assert.equal(test.throwYarnTo(target),true,'Yarn should be throwable into reachable open space');
assert.equal(test.getState().yarn,original-1,'The throw costs one yarn');
assert.notDeepEqual(JSON.parse(JSON.stringify(test.getState().human)),startingHuman,'Human must visibly move at once');
assert.equal(test.isChasing(),true,'Human should be actively walking toward distant yarn');
assert.equal(test.getState().guardMode,'investigate','Human should investigate yarn, not silently chase the cat');
assert.deepEqual(JSON.parse(JSON.stringify(test.getState().cat)),stationaryCat,'Throwing yarn must not move the cat');
let guardSteps=1;
while(test.isChasing()&&guardSteps++<25){
 for(const [id,fn] of [...pendingIntervals.entries()])if(pendingIntervals.has(id))fn();
}
assert.equal(test.isChasing(),false,'Investigation should finish rather than running forever');
assert.deepEqual(JSON.parse(JSON.stringify(test.getState().human)),target,'Owner must actually reach the yarn target');
assert.equal(test.getState().distractionTurns,4,'Yarn should grant four distracted player steps');
assert.equal(test.getState().guardMode,'distracted','Owner state should explain why they are stationary');
assert.ok(guardSteps>2,'Human must take several visible steps toward yarn');
assert.equal(test.getState().yarnAnimating,false,'Control should return to the cat after investigation');
assert.equal(JSON.parse(saved['pawsibly-innocent-save-v1']||'{}').achievements?.['yarn-lure'],true,
 'Successfully distracting the owner should unlock a real persistent achievement');
test.move(0,-1);
assert.deepEqual(JSON.parse(JSON.stringify(test.getState().human)),target,'Distracted human must stay at the yarn for several player steps');
assert.equal(test.getState().distractionTurns,3,'Lure pause must consume one step at a time');
assert.equal(test.getState().cat.y,2,'The player can sneak past while the guard is distracted');
// A visible cat must draw the owner toward the current cat location. The
// FIRST sighting is a warning; this is not an impossible instant capture.
test.choose(0,false);
let chase=test.getState();
chase.cat={x:3,y:3};chase.catFrom={x:3,y:3};
chase.human={x:6,y:3};chase.humanFrom={x:6,y:3};
chase.noise=null;chase.exposure=0;chase.guardMode="patrol";
test.move(1,0);
assert.equal(test.getState().guardMode,"chase","Owner must recognize the cat on first sight");
assert.deepEqual(JSON.parse(JSON.stringify(test.getState().human)),{x:6,y:3},
 "First sighting must telegraph a warning rather than instantly grab the cat");
assert.deepEqual(JSON.parse(JSON.stringify(test.getState().guardTarget)),{x:4,y:3},
 "Chase waypoint should match where the cat just moved");
test.move(-1,0);
assert.deepEqual(JSON.parse(JSON.stringify(test.getState().human)),{x:5,y:3},
 "Owner must actually MOVE one tile toward the visible cat");
assert.equal(test.getState().lives,3,"An early visible chase must remain escapable");
// Footsteps are weaker than visual detection: they move toward the previously
// occupied tile and have a cooldown instead of psychic continuous pursuit.
test.choose(0,false);
chase=test.getState();
chase.cat={x:2,y:3};chase.catFrom={x:2,y:3};
chase.human={x:7,y:3};chase.humanFrom={x:7,y:3};
chase.noise=null;chase.steps=2;chase.curiosityCooldown=0;
test.move(1,0);
assert.equal(test.getState().guardMode,"curious","Owner should hear nearby footsteps");
assert.deepEqual(JSON.parse(JSON.stringify(test.getState().guardTarget)),{x:2,y:3},
 "Footstep curiosity must follow the position the cat LEFT, not know the future");
test.choose(0,false);
// Exercise an intentional stealth route, not a nearest-fish bot that walks straight into the guard.
// Players can clear room one without yarn or purchased cat powers, and may topple its vase for a bonus.
const safeRoute=[
 [1,0],[1,0],[0,-1],[-1,0],[0,1],[0,1],[0,1],[0,1],
 [1,0],[1,0],[1,0],[1,0],[1,0],[0,-1],[0,1],[1,0],[1,0]
];
for(const [dx,dy] of safeRoute){
 if(test.getState().done)break;
 test.move(dx,dy);
}
assert.equal(test.getState().got,3,'First room must award three fish on the escape route');
assert.ok(test.getState().dareAnnounced,'The optional vase dare should visibly complete');
assert.equal(nodes.get('bonusQuickProgress').textContent,'+150','On-board bonus pill must visibly show the reward');
assert.ok(nodes.get('bonusQuickText').textContent.includes('Knock over a vase'),
 'The extra task must be readable without opening a sidebar');
assert.ok(test.getState().winning,'First room should be winnable without special tools');
const earned=JSON.parse(saved['pawsibly-innocent-save-v1']||'{}');
assert.ok(earned.best?.['room-0']?.stars>=1&&earned.best?.['room-0']?.stars<=3,'Winning a room must save real stars toward new cats');
assert.ok(earned.unlocked>=1,'Winning a room should unlock the next room');
if(earned.best['room-0'].stars>=3){
 assert.ok(nodes.get('catUnlocks').innerHTML.includes('Mochi'),'New cat head and name must visibly appear on the victory card');
 assert.ok(events.some(e=>e.name==='cat_skin_unlocked'&&e.payload.cat===1),'Unlocking three stars must award a new cat exactly once');
}
const unlockedCatsAtFirstWin=events.filter(e=>e.name==='cat_skin_unlocked').length;
assert.equal(events.filter(e=>e.name==='game_complete').length,1,'Exactly one completion event');
listeners['morrowwish-language-change']({detail:{lang:'zh'}});
assert.ok(nodes.get('subtitle').textContent.includes('偷零食'),'Chinese gameplay copy switches correctly');
assert.equal(nodes.get('menuButtonLabel').textContent,'菜单','The menu button must have a visible localized label');
assert.equal(nodes.get('stageHomeLabel').textContent,'返回主页','Permanent home link must localize in Chinese');
if(earned.best['room-0'].stars>=3)assert.ok(nodes.get('catUnlocks').innerHTML.includes('糯米'),'Cat unlock card must also localize to Chinese');
assert.ok(nodes.get('bonusQuickText').textContent.includes('打翻一个花瓶'),
 'Bonus objective must show its full Chinese name');
assert.ok(frames>=1,'Canvas art rendered');
const reviewStyle=fs.readFileSync('public/pawsibly-innocent/index.html','utf8');
assert.ok(reviewStyle.includes('single-screen.css?v=')&&reviewStyle.includes('heistStatus')&&reviewStyle.includes('id="catUnlocks"'),
 'CrazyGames build should show new board HUD with an uncached script');
assert.ok(source.includes('html.cg-play #stage>.playfield')&&!source.includes('html.cg-play #stage>.stealth-actionbar'),
 'CrazyGames embed must fit the single playfield and its in-frame HUD');
assert.ok(source.includes('fitCanvasPixels')&&source.includes('catPathTo')&&source.includes('before>=limit')&&source.includes('s.exposure>wasExposed'),
 'High-DPI canvas and risk-aware click routing must remain in the review build');
// A new player's simple click sequence must clear the kitchen without being trapped in a repeat-loss loop.
test.choose(1,false);
for(const p of [{x:2,y:4},{x:6,y:5},{x:9,y:5},{x:9,y:6}]){
 const evt={clientX:(p.x+.5)*84,clientY:(p.y+.5)*84};
 listeners['board:pointerdown'](evt);
 for(let tick=0;tick<75&&pendingIntervals.size;tick++){
  for(const [id,fn] of [...pendingIntervals.entries()])if(pendingIntervals.has(id))fn();
 }
}
assert.equal(test.getState().winning,true,'Kitchen must be playable by following a short, intuitive route');
assert.equal(test.getState().lives,3,'Early kitchen should not punish an ordinary path with an unfair capture');
// Collect a REAL room souvenir and verify its name, preview, and permanent album entry.
test.choose(0,false);
let relicMoves=0;
while(!test.getState().done&&!test.getState().hasRelic&&relicMoves++<40){
 const room=test.getState(),next=path(room,room.cat,room.relic)?.[0];
 assert.ok(next,'Souvenir must remain reachable');
 test.move(next.x-room.cat.x,next.y-room.cat.y);
}
assert.equal(test.getState().hasRelic,true,'Touching the souvenir must pick it up');
assert.ok(nodes.get('relicGallery').innerHTML.includes('窗帘流苏'),
 'The collection gallery must identify the acquired item');
const finalRoom=test.getState();
finalRoom.got=3;finalRoom.cat={x:8,y:6};
test.move(1,0);
assert.equal(test.getState().winning,true,'A found souvenir must be banked on a successful escape');
const relicSave=JSON.parse(saved['pawsibly-innocent-save-v1']||'{}');
assert.equal(relicSave.souvenirs[0],true,'The collected object must persist across sessions');
assert.ok(nodes.get('relicGallery').innerHTML.includes('已收藏'),
 'The album must mark an escaped-with souvenir as saved');
assert.ok(source.includes('const RELICS=[')&&source.includes('const BADGES=['),
 'Named souvenirs and persistent achievements must remain wired');
assert.ok(reviewStyle.includes('id="stageHome"')&&reviewStyle.includes('class="stage-left"'),
 'A permanent top-left home link must remain visible outside menu and results');
assert.ok(reviewStyle.includes('id="achievementsGrid"')&&reviewStyle.includes('id="relicGallery"')&&reviewStyle.includes('id="guardIntent"'),
 'The game must show collectible names, earned badges and the owner state');
assert.ok(!reviewStyle.includes('id="collectionPreview"')&&!reviewStyle.includes('class="collection-count"'),'Album summary and recent-item preview must stay removed');
assert.ok(reviewStyle.indexOf('id="restart"')>reviewStyle.indexOf('id="tool"')&&reviewStyle.indexOf('id="restart"')<reviewStyle.indexOf('id="board"'),'Replay button must be directly accessible above the board');
assert.ok(!reviewStyle.includes('<section class="explainer"'),
 'The duplicate how-to-play section must not reappear below the game');
// Final-room regression: the eighth escape deserves a visible, skippable
// illustrated chase BEFORE the ordinary result card, with only one win event.
test.choose(7,false);
const finalChase=test.getState();
finalChase.cat={x:8,y:6};finalChase.catFrom={...finalChase.cat};finalChase.got=3;
const winsBefore=events.filter(e=>e.name==='cat_level_won').length;
test.move(1,0);
assert.equal(finalChase.winning,true,'Final room must finish when the cat reaches the door');
assert.ok(finalChase.outro?.duration>=1800,'Final escape must enter animated outro state');
assert.equal(nodes.get('overlay').hidden,true,'Scores must wait until the final chase has played');
assert.equal(nodes.get('resultTitle').textContent,'猫猫大逃亡成功！','Final victory must have its own title');
assert.equal(events.filter(e=>e.name==='cat_level_won').length,winsBefore+1,'Finale must count once');
listeners['morrowwish-language-change']({detail:{lang:'en'}});
assert.equal(nodes.get('resultTitle').textContent,'THE GREAT CAT ESCAPE!','English finale must be localized');
assert.ok(source.includes('function drawOutro(time)')&&source.includes('catDraw(0,0,time)')&&source.includes('humanDraw(0,0,time)'),
 'Finale must animate the existing character art, not show a static slide');
listeners['board:pointerdown']({clientX:300,clientY:250,pointerType:'mouse',button:0});
assert.equal(finalChase.outro,null,'A click should skip directly to results');
assert.equal(nodes.get('overlay').hidden,false,'Skipping the chase must reveal scores');
assert.equal(events.filter(e=>e.name==='cat_level_won').length,winsBefore+1,'Skipping cannot duplicate a win');
assert.ok(events.filter(e=>e.name==='cat_skin_unlocked').length>=unlockedCatsAtFirstWin,'New cats must be recorded when earned');
test.choose(0,false);
const earlyWin=test.getState();earlyWin.cat={x:8,y:6};earlyWin.catFrom={...earlyWin.cat};earlyWin.got=3;
test.move(1,0);
assert.equal(earlyWin.outro,null,'Earlier rooms should keep their simple results');
assert.equal(nodes.get('overlay').hidden,false,'Non-final room results remain immediate');

// Closing the score card leaves the completed board visible, with room navigation available.
assert.ok(reviewStyle.includes('id="closeResult"'),'Result card needs an accessible close button');
nodes.get('closeResult').onclick();
assert.equal(nodes.get('overlay').hidden,true,'Closing results should reveal the board');
nodes.get('menuButton').onclick();
assert.equal(nodes.get('gameMenu').hidden,false,'Menu should remain usable after closing results');
nodes.get('menuClose').onclick();
assert.equal(nodes.get('gameMenu').hidden,true,'Completed board menu should be closable');
// Higher rooms escalate after the published step target, while room one stays instructional.
test.choose(5,false);
const hard=test.getState();
assert.equal(hard.pressure,false,'Later room must start without time-pressure vision');
hard.steps=hard.room.goal-1;
test.move(1,0);
assert.equal(hard.pressure,true,'Spending the room step budget should raise guard alertness');
assert.ok(nodes.get('visionTip').textContent.includes('High alert'),'Rising pressure must be explained in HUD');
assert.ok(source.includes('s.index>=3?1:0')&&source.includes('s.searchTurns=s.index>=5'),
 'Later rooms must widen sight and extend guard search memory');
console.log('Pawsibly Innocent: QA PASS (animated final chase, 8 rooms, real multi-step yarn lure, persistent achievements, named collectibles, compact UI, first-two-room playability).');
