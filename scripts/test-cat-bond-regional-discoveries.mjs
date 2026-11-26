import assert from "node:assert/strict";
import {discoveries,availableDiscoveries,applyDiscovery,progress,layoutDiscoveries,earnedKeepsakes} from "../public/cat-bond/js/resonance/regional-discoveries.mjs";
import {layouts,createExplorer} from "../public/cat-bond/js/resonance/world-exploration.mjs";
for(const [region,d] of Object.entries(discoveries)){
 let w={location:region,positions:{},interactions:{},cargo:null},v={regions:[region],completed:[]};
 const act=s=>{w={...w,positions:{[region]:{x:s.at[0],y:s.at[1]}}};const result=applyDiscovery(region,s.id,w,v);assert.ok(result.ok,s.id);if(result.next)w=result.next;return result;};
 for(const s of d.steps){assert.ok(layouts[region].paths.some(p=>Math.hypot(p[0]-s.at[0],p[1]-s.at[1])<.001),region+" unreachable "+s.id);assert.ok(s.point.every(n=>n>0&&n<1));}
 assert.equal(availableDiscoveries(region,w,{...v,regions:[]}).length,0);assert.equal(availableDiscoveries(region,{...w,cargo:{}},v).length,0);
 assert.equal(applyDiscovery(region,d.steps[0].id,w,v).ok,false);
 let count=0;for(let i=0;i<8;i++){const a=availableDiscoveries(region,w,v);for(const s of a.filter(x=>x.mode==="decoy")){const res=act(s);assert.equal(res.decoy,true);assert.equal(res.next,undefined);}const s=a.find(x=>x.mode!=="decoy");if(!s)break;const res=act(s);if(res.souvenir)count++;assert.equal(applyDiscovery(region,s.id,w,v).ok,false);}
 assert.ok(progress(region,w.interactions).complete);assert.equal(count,1);assert.equal(availableDiscoveries(region,w,v).length,0);
 v.completed=[d.after];const ret=availableDiscoveries(region,w,v);assert.equal(ret.length,1);assert.equal(ret[0].mode,"return");assert.deepEqual(act(ret[0]).souvenir,d.returnSouvenir);assert.equal(availableDiscoveries(region,w,v).length,0);assert.ok(progress(region,w.interactions).returned);assert.equal(progress(region,{}).complete,false);
 console.log(region,"optional trail, approach, decoy, one-time and return gates passed");
}

// Use the actual walking engine, then the same saved-position validator used by the bridge.
for(const [region,d] of Object.entries(discoveries)){
 let w={location:region,positions:{},interactions:{},pickups:{},cargo:null},v={regions:[region],completed:[d.after]},owner={};
 const mock={slotIdentity:()=>owner,isSlot:x=>x===owner,world:()=>w,view:()=>v,position:(region,x,y)=>{w.positions[region]={x,y};return {ok:true}},surveyStatus:()=>null};
 for(const region of Object.keys(discoveries))mock[region+"Invited"]=()=>[];
 const walker=createExplorer(mock,region);
 const obstacles=[...Object.values(layouts[region].features),...Object.values(layouts[region].castPoints||{})];
 let n=0;
 while(n++<10){
  const raw=availableDiscoveries(region,w,v),a=layoutDiscoveries(raw,obstacles),s=a.find(x=>x.mode!=="decoy");if(!s)break;
  assert.ok(s.point.every(x=>x>0&&x<1));assert.ok(walker.walk(...s.at));
  for(let i=0;walker.moving&&i<1200;i++)walker.tick(.05);
  assert.equal(walker.moving,false);assert.ok(walker.near(s.at),region+" "+s.id);
  const res=applyDiscovery(region,s.id,w,v);assert.ok(res.ok);w=res.next;
 }
 assert.equal(earnedKeepsakes(w.interactions).length,2);
 console.log(region,"actual path movement and earned keepsake list passed");
}
