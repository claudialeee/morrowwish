import assert from 'node:assert/strict';
import fs from 'node:fs';
const nop=()=>{},clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const w={clamp,lerp:(a,b,t)=>a+(b-a)*t,State:{S:{cats:[],catchCount:10,battlePrefs:{autoBattle:true},tutorial:{battle:true},aiProfile:{},battleTutorialDone:true},catName:c=>c.nickname||c.species,save:nop,difficulty:()=>"casual",catHpFraction:()=>1},MorrowwishI18n:{get:()=>"en"},MorrowwishAudio:{effect:nop},arcadeMetric:nop,location:{search:""},performance:{now:()=>0}};w.window=w;
for(const f of ["data","skills","contact-fx","vfx","moon-fx","magnetic-fx","skill-fx","ult-vfx","battle"])new Function("window","with(window){"+fs.readFileSync(new URL("../public/cat-bond/js/"+f+".js",import.meta.url),"utf8")+"\n}")(w);
const D=w.GameData,S=w.Skills;
const ids=[...D.SPECIES.map(x=>x.id),...Object.keys(D.STORY_SPECIES),"jinjc"];
assert.equal(new Set(ids).size,30);
for(const [id,species] of [["tidalPulse","story_qilan"],["lickWound","puff"],["magneticField","story_xingya"],["arcanePulse","inkspot"],["shadowTendrils","story_moye"],["crescentFan","story_baikan"]]){
 const c={uid:"c1",species,level:12,affinity:70,stats:{pow:32,agi:28,vit:32,cha:26},learned:[],loadout:[null,id,null,null],skillEdited:true};
 c.buildType=S.buildTypeForBreed(c);S.autoLearn(c);w.State.S.cats=[c];
 const g={W:960,H:540,scene:"yard",isTouch:false,keys:{},mouse:{x:650,y:310},toast:nop,ui:{},onBattleEnd:nop};
 const wild={...D.speciesById("biscuit"),encounterLevel:12};const b=new w.Battle.CaptureBattle(g,[c],wild,{seed:42,pack:[wild]});
 b.coach=null;b.autoMode=false;b.me().qSkill=S.skillById(id);const f=b.me(),e=b.enemies[0];f.x=400;f.y=320;e.x=580;e.y=320;e.hp=e.maxhp=800;b.aim=0;g.mouse.x=580;g.mouse.y=320;f.cd.q=0;if(id==="lickWound")f.hp=f.maxhp*.4;
 const before=e.hp,ownBefore=f.hp;
 assert.ok(b.skillQ(f,0),id+" cast");
 if(id==="lickWound")assert.ok(Math.abs(f.hp-ownBefore-f.maxhp*.30)<2);
 b.autoMode=true;for(let i=0;i<700&&!b.done;i++)b.update(1/60);
 assert.ok(Number.isFinite(e.hp)&&Number.isFinite(f.hp),id+" finite HP");
 assert.ok(e.hp<before,id+" damage in simulated encounter");
}
console.log("Starbell migration: 30-role roster and six skill encounters passed");
