// Development-only interactive world UI. Do not release without original art, real finale, and browser QA.
window.CatBondResonanceWorldUI=(function install(){
"use strict";
const M=window.CatBondResonanceModel,A=window.CatBondResonanceAtlas,P=window.CatBondResonancePuzzles,D=window.CatBondResonanceDialogue;
if(!M||!A||!P||!D)throw Error("Resonance modules must load before the world controller");
const tr=(zh,en)=>window.MorrowwishI18n?.get?.()==="zh"?zh:en;
const loc=o=>tr(o.zh,o.en);
const palette=["#8fb8ca","#8fb38d","#cf9869","#a6c8e1","#aca5d7","#c6ad84"];
const pools=[["tangyuan","doudou","xiaohui","niuniu"],["nainai","sanhua","senlin","yinghua"],["jiafei","xianluo","jinwu"],["yunduo","lanbao","dundun"],["moqiu","youling","yuelian"],["xingchen","jinwu","yuelian"]];
const regions=M.REGIONS.map((r,i)=>({...r,name:r.zh,sub:r.en,difficulty:i+1,desc:r.zh,descEn:r.en,speciesPool:pools[i],theme:{region:r.id,sky1:"#172735",sky2:"#34495b",ground:"#273b3e",ground2:"#536b60",accent:palette[i]},unlock:i?{after:M.REGIONS[i-1].id}:null}));
let game,world,host,stage,canvas,cam,unbind,observer,mode="map",dialog=null,puzzle=null,notice="",selectedRoute=null,encounter,collect,exit,frame=0,slotRoot,participants=new Set();
const E=(tag,cl,content)=>{const el=document.createElement(tag);if(cl)el.className=cl;if(content!=null)el.textContent=content;return el;};
const btn=(label,fn,disabled=false)=>{const b=E("button","lr-action",label);b.type="button";b.disabled=disabled;b.addEventListener("click",fn);return b;};
function syncSlot(){if(slotRoot!==State.S){slotRoot=State.S;dialog=puzzle=null;participants.clear();notice="";selectedRoute=null;world=M.attach(State);}}
function view(){syncSlot();return world.view();}
function result(ok){notice=ok?"":tr("无法完成，请检查条件或存档空间。","Cannot complete. Check prerequisites or save space.");return ok;}
function mount(){if(host)return;stage=document.getElementById("stage")||document.getElementById("scene").parentElement;host=E("section","lr-world");host.setAttribute("aria-label","The Last Resonance");host.hidden=true;stage.append(host);
 observer=new ResizeObserver(()=>{if(canvas&&cam)resize();});observer.observe(host);window.addEventListener("morrowwish-language-change",()=>{if(game?.scene==="map")render();});}
function init(g){game=g;syncSlot();mount();}
function clearSurface(){unbind?.();unbind=null;canvas=null;cam=null;host.replaceChildren();}
function navigate(m){mode=m;dialog=puzzle=null;participants.clear();selectedRoute=null;notice="";render();}
function enterMap(){navigate("map");return true;}
function enterRegion(id){if(!result(world.visit(id))){render();return false;}navigate("region");return true;}
function resumeRegion(){navigate("region");return true;}
function exitToYard(){host.hidden=true;exit?.();}
function resize(){if(!canvas||!cam)return;const r=canvas.getBoundingClientRect();if(r.width<1||r.height<1)return;const d=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(r.width*d);canvas.height=Math.round(r.height*d);cam.resize(r.width,r.height);drawAtlas();}
function drawAtlas(){if(!canvas||!cam)return;const b=canvas.getBoundingClientRect(),c=canvas.getContext("2d"),d=canvas.width/b.width;if(!d)return;const v=view();c.setTransform(d,0,0,d,0,0);c.clearRect(0,0,b.width,b.height);c.fillStyle="#111f2b";c.fillRect(0,0,b.width,b.height);
 const t=cam.transform;c.save();c.translate(t.x,t.y);c.scale(t.scale,t.scale);c.fillStyle="#1e3540";c.fillRect(0,0,A.W,A.H);
 // Diagnostic geometry only. Release gate requires an original hand-painted atlas.
 c.strokeStyle="#344a54";c.lineWidth=2;for(let i=0;i<5;i++){c.beginPath();c.arc(800,600,140+i*110,0,Math.PI*2);c.stroke();}
 for(const e of A.roads){const status=v.links.find(l=>l.id===e.id);c.strokeStyle=status?.complete?"#ddc180":"#778995";c.lineWidth=9;c.setLineDash(status?.complete?[]:[15,14]);c.beginPath();c.moveTo(e.a.x,e.a.y);c.lineTo(e.b.x,e.b.y);c.stroke();}c.setLineDash([]);
 for(const [i,n] of A.regions.entries()){const r=v.regions.find(x=>x.id===n.id);c.fillStyle=r.unlocked?palette[i]:"#53636c";c.strokeStyle=r.id===v.location?"#fff2c7":"#23333c";c.lineWidth=r.id===v.location?10:5;c.beginPath();c.arc(n.x,n.y,42,0,Math.PI*2);c.fill();c.stroke();c.font="bold 34px Georgia, serif";c.textAlign="center";c.fillStyle="#f5ebd6";c.fillText(tr(r.zh,r.en),n.x,n.y+83);if(r.melody){c.font="28px Georgia";c.fillText("♫",n.x,n.y+8);}}
 c.strokeStyle="#dbbe82";c.lineWidth=5;c.beginPath();c.arc(A.bell.x,A.bell.y,60,0,Math.PI*2);c.stroke();c.font="bold 30px Georgia";c.textAlign="center";c.fillStyle="#e7d3a6";c.fillText(tr("中央星铃","Star Bell"),800,610);c.restore();}
function mapBody(body,v){canvas=E("canvas","lr-atlas");canvas.setAttribute("aria-label",tr("六地环形地图","Six-region ring atlas"));body.append(canvas);cam=A.camera(1,1);const select=h=>{if(h.type==="region"){if(world.view().regions.find(r=>r.id===h.id)?.unlocked)enterRegion(h.id);else{notice=tr("完成前一章以开启该地。","Complete the previous chapter to unlock this region.");render();}}else if(h.type==="route"){selectedRoute=h.id;render();}else{notice=v.finale.phase?tr("终章接口等待战斗整合。","Finale awaits battle integration."):tr("六地尚未彼此回应。","The six regions have not answered each other yet.");render();}};
 unbind=A.bind(canvas,cam,select,drawAtlas);requestAnimationFrame(resize);
 const bar=E("div","lr-row");bar.append(btn("−",()=>{cam.zoom(.8,{x:canvas.clientWidth/2,y:canvas.clientHeight/2});drawAtlas();}),btn("+",()=>{cam.zoom(1.25,{x:canvas.clientWidth/2,y:canvas.clientHeight/2});drawAtlas();}),btn(tr("复位视角","Reset view"),()=>{cam.reset();drawAtlas();}));body.append(bar);
 const routes=E("div","lr-route");for(const r of v.regions)routes.append(btn(`${r.melody?"♫ ":""}${tr(r.zh,r.en)}`,()=>enterRegion(r.id),!r.unlocked));body.append(routes);
 if(selectedRoute){const l=v.links.find(x=>x.id===selectedRoute);if(l){const a=regions.find(x=>x.id===l.a),b=regions.find(x=>x.id===l.b);body.append(E("p","lr-note",`${tr(a.zh,a.en)} ↔ ${tr(b.zh,b.en)} · ${["abSent","abReceived","baSent","baReceived"].filter(k=>l[k]).length}/4`));}}
}
function linePanel(body,scene,after){const lines=D.scenes[scene]||[];if(!lines.length){after();return;}
 if(!dialog||dialog.scene!==scene)dialog={scene,index:0};const line=lines[dialog.index],who=D.cast[line[0]];const card=E("div","lr-dialog");card.append(E("small","",tr(who[2],who[3])),E("h3","",tr(who[0],who[1])),E("p","",tr(line[1],line[2])));card.append(btn(dialog.index+1===lines.length?tr("结束对话","End conversation"):tr("下一句","Next"),()=>{if(dialog.index+1<lines.length){dialog.index++;render();}else{dialog=null;after();render();}}));body.append(card);}
const actionLabel={"local-response":["召集当地居民","Gather local residents"],"restore-sanctuary":["修复圣所","Restore sanctuary"],"recover-melody":["找回旋律","Recover melody"],"ring-ready":["确认六地双向交流","Verify all reciprocal exchanges"],"distributed-control":["共同控制观星仪","Share observatory control"],"community-agreement":["促成共同水道协议","Agree on shared waterways"],"public-accountability":["与工人确认安全责任","Agree on worker safety responsibilities"],"inward-call":["面对最后的内向铃声","Face the last inward call"],"identity-reveal":["与暮铃对质","Confront Muling"],"betrayal-reveal":["检查路由记录","Examine the routing record"],"reverse-plan-reveal":["面对暮铃的计划","Confront Muling's plan"],"muling-conversation":["与暮铃谈话","Talk to Muling"]};
const puzzleControls={heat:["加热","Heat"],cool:["冷却","Cool"],vent:["泄压","Vent"],seal:["加压","Pressurize"],test:["验证","Test"],climb:["上升","Climb"],hold:["保持高度","Hold"],descend:["下降","Descend"],reset:["重置","Reset"]};
function puzzlePanel(body,region,action){if(!puzzle||puzzle.action!==action)puzzle=P.create(region,action);const d=P.definition(region,action);if(!puzzle||!d)return;
 const card=E("div","lr-puzzle");card.append(E("h3","",loc(d.title)),E("p","",loc(d.hint)));
 const vals=E("div","lr-values");puzzle.values.forEach((n,i)=>vals.append(E("span","",`${i+1} · ${n}`)));card.append(vals);
 const goal=d.kind==="wind"?`${tr("气流","Wind")}: ${d.winds.map(n=>n>0?"↑":n<0?"↓":"—").join("  ")}`:`${tr("观测记录","Observation")}: ${d.target.join(" · ")}`;card.append(E("p","lr-note",goal));
 if(puzzle.failed)card.append(E("p","lr-note",tr("未达到目标，重新调整。","Target not reached. Try another adjustment.")));
 const row=E("div","lr-row");for(const k of P.controls(puzzle)){const label=puzzleControls[k]?tr(...puzzleControls[k]):d.kind==="memory"?`${tr("记录","Record")} ${Number(k)+1}`:`${tr("旋转／调整","Adjust")} ${Number(k)+1}`;row.append(btn(label,()=>{P.apply(puzzle,k);if(puzzle.solved){result(P.complete(puzzle,world));puzzle=null;}render();}));}card.append(row);body.append(card);}
function regionBody(body,v){const r=regions.find(r=>r.id===v.location);if(!r)return;
 const title=E("div","lr-region");title.style.setProperty("--lr-accent",palette[r.chapter-1]);title.append(E("h2","",tr(r.zh,r.en)),E("p","",tr(r.melodyZh,r.melodyEn)));body.append(title);
 const current=v.objective?.region===r.id?v.objective:null;
 const npc=E("div","lr-row");for(const id of r.npcs){const c=D.cast[id];npc.append(btn(tr(c[0],c[1])+" · "+tr(c[2],c[3]),()=>{participants.add(id);const a="meet:"+id;if(current?.pending.includes(a)){dialog={scene:current.scene,index:0,onDone:()=>result(world.record(a))};}else if(current?.pending.includes("local-response")&&r.npcs.every(id=>participants.has(id)))result(world.record("local-response",{participants:[...participants]}));render();}));}body.append(npc);
 if(current){
  body.append(E("small","lr-note",`${tr("当前场景","Current scene")} · ${current.scene}`));
  const action=current.pending[0];
  if(dialog?.onDone){const done=dialog.onDone;linePanel(body,current.scene,done); // Preserve completion callback through each line.
   if(dialog)dialog.onDone=done;
  }else if(action?.startsWith("meet:"))body.append(E("p","lr-note",tr("与当地角色交谈，继续故事。","Speak with the local characters to advance the story.")));
  else if(action==="choice"){const row=E("div","lr-row");for(const id of r.choices){row.append(btn(tr(...D.choices[id]),()=>{result(world.record("choice",{choice:id}));render();}));}body.append(row);}
  else if(P.definition(r.id,action))puzzlePanel(body,r.id,action);
  else if(action==="local-response")body.append(E("p","lr-note",tr("请分别邀请两位当地角色回应。","Invite both local characters to respond.")));
  else if(action){const label=actionLabel[action]||[action,action];const needsDialogue=["identity-reveal","betrayal-reveal","reverse-plan-reveal","muling-conversation","inward-call","community-agreement","public-accountability","distributed-control"].includes(action);if(needsDialogue){const complete=()=>result(world.record(action));if(dialog)linePanel(body,current.scene,complete);else body.append(btn(tr(...label),()=>{dialog={scene:current.scene,index:0};render();}));}else body.append(btn(tr(...label),()=>{result(world.record(action));render();},action==="ring-ready"&&!M.ringReady(State.S.lastResonanceWorld)));}
 }
 const exchangeBox=E("div","lr-exchange");exchangeBox.append(E("h3","",tr("邻地交流","Neighbor exchanges")));
 for(const l of M.LINKS.filter(l=>l.a===r.id||l.b===r.id)){const status=v.links.find(x=>x.id===l.id),other=regions.find(x=>x.id===(l.a===r.id?l.b:l.a));const row=E("div","lr-row");row.append(E("span","",tr(other.zh,other.en)));const kinds=l.a===r.id?["abSent","baReceived"]:["abReceived","baSent"];for(const k of kinds){const isSend=k.endsWith("Sent");const enabled=(k==="abSent"?v.regions.find(x=>x.id===l.a).melody:k==="abReceived"?status.abSent:k==="baSent"?status.abReceived&&v.regions.find(x=>x.id===l.b).melody:status.baSent)&&v.regions.find(x=>x.id===other.id).unlocked;row.append(btn(status[k]?tr("已完成","Done"):isSend?tr("交付物资","Send supplies"):tr("确认收货","Accept delivery"),()=>{result(world.exchange(l.id,k,r.id));render();},!!status[k]||!enabled));}exchangeBox.append(row);}body.append(exchangeBox);
 const field=E("div","lr-row");field.append(btn(tr("寻找野猫","Seek wild cats"),()=>{const list=r.speciesPool.map(id=>GameData.speciesById(id)).filter(Boolean);if(list.length)encounter?.(list[Math.floor(Math.random()*list.length)],r.id);}),btn(tr("返回世界地图","World atlas"),enterMap));body.append(field);}
function render(){if(!host||!world)return;syncSlot();clearSurface();const v=view();const head=E("header","lr-head");head.append(E("strong","",tr("猫猫纽带 · 世界","Cat Bond · World")),E("span","",`${tr("第","Chapter ")}${v.chapter}${tr("章","")} · ${v.regions.filter(r=>r.melody).length}/6`),btn(tr("阳光花园","Sunlit Garden"),exitToYard));host.append(head);const body=E("div","lr-body");host.append(body);if(notice)body.append(E("p","lr-note",notice));if(mode==="map")mapBody(body,v);else regionBody(body,v);host.hidden=game?.scene!=="map";}
function update(){syncSlot();if(host){const visible=game?.scene==="map";if(visible&&host.hidden){host.hidden=false;render();}else if(!visible)host.hidden=true;}}
return {init,enterMap,enterRegion,resumeRegion,update,draw(){},handleTap(){return false;},setDestination(){},panBy(){},exitToYard,isUnlocked:id=>view().regions.some(r=>r.id===id&&r.unlocked),onEncounter:fn=>encounter=fn,onCollect:fn=>collect=fn,onExit:fn=>exit=fn,REGIONS:regions,get mode(){return mode},get currentRegion(){return view().location},get atlasTargets(){return []},get spawns(){return []},get view(){return null}};
})();
