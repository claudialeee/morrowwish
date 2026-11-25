// WorldMap implementation for the RPG integration branch, not a second story engine.
import { campaign } from "./campaign.mjs";
import { createWorldBridge } from "./world-bridge.mjs";
import { createExplorer,layouts } from "./world-exploration.mjs";
const lang=()=>window.MorrowwishI18n?.get?.()==="zh"?"zh":"en";
const tr=(zh,en)=>lang()==="zh"?zh:en;
const nodes=[["harbor",.5,.18],["forest",.79,.33],["forge",.79,.68],["sky",.5,.85],["library",.21,.68],["starfall",.21,.33]];
const regionData=nodes.map(([id,x,y],i)=>({id,x,y,name:layouts[id].name[0],sub:layouts[id].name[1],theme:{region:id},unlock:i?{after:nodes[i-1][0]}:null}));
function install(){
 let game,bridge,explorer=null,host=null,canvas=null,ctx=null,mode="map",slot=null,lastRevision="",frame=0,encounter,collect,exit,notice="",pendingExchange=null;
 const make=(tag,cl,text)=>{const e=document.createElement(tag);if(cl)e.className=cl;if(text)e.textContent=text;return e};
 const button=(text,fn,disabled=false)=>{const b=make("button","rw-button",text);b.type="button";b.disabled=disabled;b.onclick=fn;return b};
 function current(){if(slot!==State.S){slot=State.S;bridge=createWorldBridge(State);explorer=null;mode="map";pendingExchange=null;}return bridge;}
 function init(g){game=g;current();if(host)return;host=make("section","rw-world");host.hidden=true;const stage=document.getElementById("stage");stage.append(host);window.addEventListener("morrowwish-language-change",()=>{if(game.scene==="map")render()});window.addEventListener("cat-bond-resonance-changed",()=>{if(game.scene==="map")render()});}
 function sync(){const v=current().view();return v.current?.id+":"+v.cursor+":"+v.choice+":"+v.objective.join(",")+":"+JSON.stringify(v.links);}
 function enterMap(){current();mode="map";explorer=null;notice="";render();return true;}
 function enterRegion(id){const b=current(),r=b.enter(id);if(!r.ok){notice=tr("暂时无法前往："+r.reason,"Cannot travel yet: "+r.reason);render();return false;}mode="region";explorer=createExplorer(b,id);notice="";render();return true;}
 function resumeRegion(){const id=current().world().location;return id?enterRegion(id):enterMap();}
 function exitToYard(){host.hidden=true;exit?.();}
 function render(){
  if(!host)return;const b=current(),v=b.view();lastRevision=sync();host.replaceChildren();host.hidden=game.scene!=="map";const head=make("header","rw-head");head.append(make("strong","","Cat Bond · "+tr("最后的回响","The Last Resonance")),button(tr("世界地图","World atlas"),enterMap),button(tr("阳光花园","Sunlit Garden"),exitToYard));host.append(head);
  const objective=make("div","rw-objective");objective.append(make("strong","",v.current?.title[lang()]||tr("新的旅程","A new journey")),make("span","",tr("圣所","Sanctuaries")+" "+v.sanctuaries.length+"/6 · "+tr("旋律","Melodies")+" "+v.melodies.length+"/6 · "+tr("交流","Exchanges")+" "+Object.values(v.links).filter(x=>x.length===4).length+"/6"));host.append(objective);
  if(notice)host.append(make("p","rw-notice",notice));
  canvas=make("canvas","rw-surface");canvas.width=960;canvas.height=540;canvas.tabIndex=0;canvas.setAttribute("aria-label",tr("可操作的世界探索场景","Interactive world exploration"));ctx=canvas.getContext("2d");host.append(canvas);canvas.addEventListener("pointerdown",pointer);
  if(mode==="region"&&explorer){const hint=make("p","rw-hint",tr("点击道路移动，抵达地点后交互。","Tap the path to walk; interact when you reach a location."));host.append(hint);if(explorer.puzzle)host.append(make("p","rw-hint",tr("点击场景中的机关部件以操作。","Operate the mechanisms directly in the scene.")));const nav=make("div","rw-controls");nav.append(button(tr("寻找野猫","Seek wild cats"),()=>{const list=GameData.SPECIES?.filter(x=>x.rarity==="N"||x.rarity==="R")||[];if(list.length)encounter?.(list[Math.floor(Math.random()*list.length)],current().world().location);}),button(tr("取消机关操作","Leave mechanism"),()=>{explorer.cancel();render()},!explorer.puzzle));host.append(nav);}
  else{host.append(make("p","rw-hint",v.regions.length?tr("点击已开放的地区进入探索。","Select an unlocked region to explore."):tr("等待正式序章完成后开启霁潮港。","Misttide Harbor opens when the canonical prologue is complete.")));}
  drawSurface();
 }
 function pointer(ev){if(!canvas||!ctx)return;const r=canvas.getBoundingClientRect(),x=(ev.clientX-r.left)/r.width,y=(ev.clientY-r.top)/r.height;
 if(mode==="map"){const n=regionData.find(n=>Math.hypot(n.x-x,n.y-y)<.105);if(n)enterRegion(n.id);return;}
 if(!explorer)return;const p=explorer.puzzle;if(p){if(y>.35&&y<.72){const i=Math.floor((x-.2)/.2);if(i>=0&&i<3){const r=explorer.operate(i);if(!r.ok)notice=r.reason;render();}}return;}
 const v=current().view(),reg=current().world().location;const f=Object.entries(explorer.layout.features).find(([op,a])=>v.objective.includes(op)&&Math.hypot(a[0]-x,a[1]-y)<.06);
 if(f&&Math.hypot(explorer.position[0]-f[1][0],explorer.position[1]-f[1][1])<.075&&!explorer.moving){
  const [op]=f;if(op.startsWith("battle:")){window.dispatchEvent(new CustomEvent("cat-bond-resonance-battle-request",{detail:{sceneId:v.current.id,operation:op,region:reg}}));notice=tr("已请求正式战斗入口。","Canonical battle entry requested.");render();return;}
  const result=explorer.interact(op);notice=result.ok?"":result.reason;render();return;
 }
 const npc=campaign.cast&&Object.values(campaign.cast).filter(c=>c.region===reg);
 for(let i=0;i<(npc?.length||0);i++){const a=explorer.layout.paths[Math.min(i+1,explorer.layout.paths.length-1)];if(Math.hypot(a[0]-x,a[1]-y)<.05&&Math.hypot(a[0]-explorer.position[0],a[1]-explorer.position[1])<.075&&!explorer.moving){window.dispatchEvent(new CustomEvent("cat-bond-resonance-npc-request",{detail:{sceneId:v.current?.id,npcId:npc[i].id,region:reg}}));return;}}
 explorer.walk(x,y);
 }
 function text(s,x,y,size=19,color="#e9e0c6"){ctx.fillStyle=color;ctx.font=size+"px system-ui";ctx.textAlign="center";ctx.fillText(s,x*960,y*540);}
 function circle(x,y,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x*960,y*540,r,0,Math.PI*2);ctx.fill();}
 function drawSurface(){if(!ctx||!canvas)return;const v=current().view();ctx.clearRect(0,0,960,540);ctx.fillStyle="#132738";ctx.fillRect(0,0,960,540);
 // Diagnostic geometry: intentionally not the final art pipeline. No mockups or
 // unapproved portraits are shipped as final assets.
 if(mode==="map"){ctx.strokeStyle="#ac9168";ctx.lineWidth=4;ctx.beginPath();for(let i=0;i<nodes.length;i++){const [,x,y]=nodes[i];i?ctx.lineTo(x*960,y*540):ctx.moveTo(x*960,y*540);}ctx.closePath();ctx.stroke();for(const n of regionData){circle(n.x,n.y,24,v.regions.includes(n.id)?"#bca66e":"#455667");text(tr(n.name,n.sub),n.x,n.y+.085,17);}circle(.5,.5,30,"#786445");text(tr("星铃","Star Bell"),.5,.58);return;}
 if(!explorer)return;const path=explorer.layout.paths;ctx.strokeStyle="#83958d";ctx.lineWidth=24;ctx.lineJoin="round";ctx.lineCap="round";ctx.beginPath();path.forEach(([x,y],i)=>i?ctx.lineTo(x*960,y*540):ctx.moveTo(x*960,y*540));ctx.stroke();
 for(const [op,[x,y,zh,en]] of Object.entries(explorer.layout.features)){if(!v.objective.includes(op))continue;circle(x,y,13,"#e4c27b");text(tr(zh,en),x,y-.04,16);}
 const region=current().world().location;Object.values(campaign.cast).filter(c=>c.region===region).forEach((c,i)=>{const a=path[i+1];circle(a[0],a[1],10,"#85bdc9");text(c.name[lang()],a[0],a[1]+.05,15);});
 const [x,y]=explorer.position;const cat=State.S.cats?.[0],sp=cat&&GameData.speciesById(cat.species);if(sp&&window.CatArt?.drawCat){try{(window.CatMotion?.draw||window.CatArt.drawCat)(ctx,x*960,y*540,{species:sp,scale:.8,t:frame/60,face:1,pose:explorer.moving?"walk":"idle"});}catch{circle(x,y,12,"#e3d2ab");}}else circle(x,y,12,"#e3d2ab");
 const p=explorer.puzzle;if(p){ctx.fillStyle="rgba(5,13,23,.92)";ctx.fillRect(100,120,760,320);text(tr("操作机关","Operate mechanism"),.5,.29,24);for(let i=0;i<3;i++){const xx=.3+i*.2;circle(xx,.52,35,"#735d3d");text(p.type==="heat"?[tr("加热","Heat"),tr("泄压","Vent"),tr("重置","Reset")][i]:p.type==="flight"?[tr("下沉","Descend"),tr("保持","Hold"),tr("上升","Climb")][i]:String(i+1),xx,.53,18);}text(tr("当前","Current")+" "+p.values.join(" · ")+"   /   "+tr("目标","Target")+" "+p.goal.join(" · "),.5,.72,19);}
 }
 function update(dt){current();if(!host)return;host.hidden=game.scene!=="map";if(host.hidden)return;const revision=sync();if(revision!==lastRevision){render();return;}if(explorer){explorer.tick(dt);frame++;drawSurface();}}
 return {init,enterMap,enterRegion,resumeRegion,exitToYard,update,draw(){},handleTap(){return false},setDestination(){},panBy(){},onEncounter(fn){encounter=fn},onCollect(fn){collect=fn},onExit(fn){exit=fn},isUnlocked:id=>current().view().regions.includes(id),REGIONS:regionData,get mode(){return mode},get currentRegion(){return current().world().location},get atlasTargets(){return []},get spawns(){return []},get view(){return null}};
}
export const worldRuntime=install();
window.CatBondCanonicalWorld=worldRuntime;
