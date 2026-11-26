// Run node scripts/check-cat-bond-vfx-compact.mjs
import fs from 'node:fs';
import vm from 'node:vm';
const w={};
const box=vm.createContext({window:w,console});
for(const file of ["skills.js","contact-fx.js","moon-fx.js","skill-fx.js","ult-vfx.js","trait-fx.js","vfx.js"])vm.runInContext(fs.readFileSync(new URL('../public/cat-bond/js/'+file,import.meta.url),'utf8'),box);

const S=w.Skills,F=w.CatBondSkillFX,U=w.CatBondUltVFX,M=w.CatBondMoonFX,C=w.CatBondContactFX,T=w.CatBondTraitFX;
let frames=0,depth=0,calls=0;
function check(v,m){if(!v)throw Error(m)}
const gradient={addColorStop(p){check(p>=0&&p<=1,'gradient stop')}};
const ctx=new Proxy({}, {get(o,k){if(k in o)return o[k];return (...a)=>{calls++;check(a.every(v=>typeof v!=='number'||Number.isFinite(v)),'nonfinite '+String(k));if(k==='save')depth++;if(k==='restore')depth--;if(k==='ellipse')check(a[2]>=0&&a[3]>=0,'ellipse radius');if(k==='arc')check(a[2]>=0,'arc radius');if(String(k).includes('Gradient'))return gradient}},set(o,k,v){if(k==='globalAlpha')check(Number.isFinite(v)&&v>=0&&v<=1,'alpha '+v);o[k]=v;return true}});
const normal=S.SKILLS.filter(sk=>!sk.legacy&&!sk.ultCost),ults=S.SKILLS.filter(sk=>sk.ultCost>0);
for(const sk of normal){check(F.has(sk.id),'missing '+sk.id);
 for(const kind of ['signatureCast','signatureHit'])for(let i=0;i<20;i++){F.draw(ctx,{kind,skillId:sk.id,x:300,y:200,angle:.45,life:1-i/20,max:1,heavy:!!sk.heavy},i/30);frames++}
 for(let i=0;i<20;i++){const style=C.classify(sk.heavy?'heavy':'light',sk);C.draw(ctx,{style,tier:sk.heavy?'heavy':'light',element:sk.element,x:500,y:200,angle:.45,life:1-i/20,max:1},i/30);frames++}
}
for(const sk of ults){check(U.has(sk.id),'ult missing '+sk.id);for(const layer of ['back','front'])for(let i=0;i<24;i++){U.draw(ctx,{kind:'ultimate',skillId:sk.id,x:250,y:200,angle:.2,reach:350,width:36,targets:[{x:500,y:200},{x:420,y:120}],life:1-i/24,max:1},800,420,i/30,layer);frames++}}
for(const id of T.ids)for(const phase of ['ready','fire'])for(let i=0;i<20;i++){T.drawEvent(ctx,{species:id,phase,x:420,y:190,ox:220,oy:190,start:0,life:1,radius:90},i/20);frames++}
for(const style of ['light','heavy','slash','smash','fire','water','ice','elec','dark','grass','vine','heal','cleanse','guard','barrier','reflect','wardFade','shieldBreak','kill','stagger'])for(let i=0;i<20;i++){C.draw(ctx,{style,tier:'crit',x:100,y:100,angle:.5,life:1-i/20,max:1},i/30);frames++}
const vfx=new w.VFX();vfx.impactType(100,100,'heavy',{skill:{element:'water',id:'waterJet'}});check(vfx.fx.length===1&&vfx.fx[0].style==='water','typed routing');
const before=calls;vfx.draw(ctx,'back');check(calls===before,'contact leaked into back');vfx.draw(ctx,'contact');check(calls>before,'contact not rendered');vfx.update(.5);check(vfx.fx.length===0,'contact expired');
check(depth===0,'unbalanced saves');console.log(JSON.stringify({normal:normal.length,ults:ults.length,traits:T.ids.length,frames,calls,depth,typedContactRouting:'pass'}));
