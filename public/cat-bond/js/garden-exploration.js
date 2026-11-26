// V3 opening discoveries: real map targets, optional, slot-local and independent of story proof.
(function(){
'use strict';
const fresh=()=>({chartStarted:false,parts:[],butterfly:0,seed:false,snack:null,door:false,nameplate:false,nameplateHome:false, keepsakes:[]});
function read(root){const saved=root?.sunlitGarden?.exploration||{};return {...fresh(),...saved,parts:[...new Set((saved.parts||[]).filter(i=>i===0||i===1))],keepsakes:[...new Set(saved.keepsakes||[])]};}
function reduce(before,event,canOpenDoor=false){
 const next={...before,parts:[...before.parts],keepsakes:[...before.keepsakes]};
 const remember=id=>{if(!next.keepsakes.includes(id))next.keepsakes.push(id);};
 switch(event){
 case 'chart-start':if(next.chartStarted)return null;next.chartStarted=true;break;
 case 'chart-0':case 'chart-1':{const i=Number(event.at(-1));if(!next.chartStarted||next.parts.includes(i))return null;next.parts.push(i);break;}
 case 'butterfly':if(next.butterfly>=3)return null;next.butterfly++;if(next.butterfly===3)remember('ear-flower');break;
 case 'seed':if(next.seed)return null;next.seed=true;remember('golden-seed');break;
 case 'snack-keep':case 'snack-eat':if(next.snack)return null;next.snack=event.slice(6);if(next.snack==='keep')remember('fish-cake');break;
 case 'door':if(!canOpenDoor||next.door)return null;next.door=true;remember('old-garden-postcard');break;
 case 'nameplate':if(next.nameplate)return null;next.nameplate=true;break;
 case 'nameplate-home':if(!canOpenDoor||next.nameplateHome)return null;next.nameplateHome=true;break;
 default:return null;
 }return next;
}
const zh=()=>window.MorrowwishI18n?.get?.()==='zh',tr=(a,b)=>zh()?a:b;
const rootState=()=>window.State?.S;
const view=()=>window.CatBondResonance?.view?.();
const eligible=()=>window.__game?.scene==='yard'&&!!rootState()&&(view()?.current?.id==='prologue:P-05'||view()?.completed?.includes('harbor:H-05'));
function covered(){return !!document.querySelector('#panel.open,.res-host,.cbcp-root:not([hidden]),#cb-player-first-intro,#cb-system-menu:not([hidden])')||!!window.__game?.yard?.placement;}
function commit(event){if(!eligible())return false;const s=rootState(),old=s.sunlitGarden,next=reduce(read(s),event,view()?.completed?.includes('harbor:H-05'));if(!next)return false;s.sunlitGarden={...(old||{}),exploration:next};try{if(window.State.save()?.ok===true)return true;}catch{}if(old===undefined)delete s.sunlitGarden;else s.sunlitGarden=old;window.__game?.toast?.({zh:'保存失败，请再试一次。',en:'Could not save. Try again.'});return false;}
const toast=(a,b)=>window.__game?.toast?.({zh:a,en:b});
const shapes={
 butterfly:'<path d="M0 0C-23-27-26-4-9 5C-25 14-12 24 0 6C12 24 25 14 9 5C26-4 23-27 0 0Z" fill="#e5b776" stroke="#996d49" stroke-width="1.1"/><path d="M0 0V10M-3-1-7-7M3-1 7-7" fill="none" stroke="#70513d" stroke-width="1.4" stroke-linecap="round"/><path d="M-15-4-9 0M15-4 9 0" stroke="#fff4d0" stroke-width="2" stroke-linecap="round"/>',
 seed:'<path d="M-5 9Q-15-1-2-7Q13-13 8 1Q4 8-5 9Z" fill="#c49b55" stroke="#8c724d"/><path d="M-5 9 4-4" stroke="#f5e2b1" stroke-width="1.4"/><path d="M-13-10v-8m-4 4h8M13 4v-8m-4 4h8" stroke="#ffe5a2" stroke-width="1.7" stroke-linecap="round"/>',
 snack:'<path d="M-19-2Q-8-15 5-6L17-13V10L5 4Q-8 15-19-2Z" fill="#d4a367" stroke="#9a7248" stroke-width="1.5"/><circle cx="-10" cy="-2" r="1.6" fill="#785c40"/><path d="M-2-6q5 4 0 8" fill="none" stroke="#f4cf91" stroke-width="2"/>',
 chart:'<path d="m-15-9 26-3 4 20-11-3-7 5-11-3z" fill="#f8e7bd" stroke="#b38d5a" stroke-width="1.2"/><path d="m-9-3 5 3 5-5 6 3m-14 8 8-3" fill="none" stroke="#83a2a2" stroke-width="1.4" stroke-linecap="round"/>',
 nameplate:'<path d="M-19-12Q-21-15-17-15H17Q21-15 19-10L17 12Q17 15 12 15H-15Q-19 15-19 11Z" fill="#bf9767" stroke="#75533e" stroke-width="1.5"/><circle cx="-13" cy="-8" r="2" fill="#694e38"/><circle cx="13" cy="-8" r="2" fill="#694e38"/><path d="M-10 1l5 3m-3-6l5 3M3 7l5-3m-3 6l5-3" fill="none" stroke="#75533e" stroke-width="1.3" stroke-linecap="round"/>',
 door:'<path d="M0-13 4-4 13 0 4 4 0 13-4 4-13 0-4-4Z" fill="#f8d98f" stroke="#b59158" stroke-width="1"/><circle r="2.5" fill="#fff8d8"/>'
};
const targets={
 butterfly:{labels:['追蝴蝶','Chase butterfly'],type:'butterfly',points:[[.36,.46],[.79,.55],[.48,.68]]},
 seed:{labels:['花丛里的亮光','Glint among flowers'],type:'seed',points:[[.87,.70]]},
 snack:{labels:['鱼饼','Fish cake'],type:'snack',points:[[.15,.56]]},
 nameplate:{labels:['翻看木名牌','Turn the wooden nameplate'],type:'nameplate',points:[[.25,.40]]},
 door:{labels:['旧屋的秘密','Old house mystery'],type:'door',points:[[.18,.37]]},
 'chart-0':{labels:['飞走的航图 · 1','Windblown chart · 1'],type:'chart',points:[[.75,.36]]},
 'chart-1':{labels:['飞走的航图 · 2','Windblown chart · 2'],type:'chart',points:[[.40,.59]]}
};
let layer=null,buttons=new Map(),owner=null,popup=null,pending=null,projection=null;
function closePopup(){popup?.remove();popup=null;}
function init(parent){if(layer)return;layer=document.createElement('div');layer.className='sg-exploration-layer';layer.setAttribute('aria-label','Garden discoveries');parent.append(layer);
 for(const [id,target] of Object.entries(targets)){const b=document.createElement('button');b.type='button';b.className='sg-discovery sg-discovery-'+target.type;b.dataset.gardenExplore=id;b.hidden=true;b.innerHTML='<svg viewBox="-24 -24 48 48" aria-hidden="true">'+shapes[target.type]+'</svg>';b.onclick=()=>interact(id);layer.append(b);buttons.set(id,b);}
}
function pulse(id){const b=buttons.get(id);if(!b)return;const cat=window.__game?.yard?.entities?.find(e=>e.cat.species==='jinjc');if(cat&&id==='butterfly'){cat.pounceT=.8;cat.setPose?.('play',.8);}window.MorrowwishAudio?.effect?.('discover');}
function snackChoice(){if(popup)return;popup=document.createElement('section');popup.className='sg-discovery-choice';popup.setAttribute('role','dialog');popup.setAttribute('aria-label',tr('鱼饼','Fish cake'));
 const p=document.createElement('p');p.textContent=tr('一小块香喷喷的鱼饼。','A delicious little fish cake.');popup.append(p);
 for(const [id,a,b] of [['snack-keep','带在身上','Keep for later'],['snack-eat','现在吃掉','Eat now'],['close','暂时不拿','Leave it']]){const button=document.createElement('button');button.type='button';button.textContent=tr(a,b);button.onclick=()=>{if(owner!==rootState()||!eligible()){closePopup();return}if(id==='close'){closePopup();return}if(commit(id)){closePopup();pulse('snack');toast(id==='snack-keep'?'把鱼饼放进小包，留给旅途。':'香香脆脆的，适合出门前吃。',id==='snack-keep'?'You tuck the fish cake away for the road.':'A crisp little breakfast.');}};popup.append(button);}layer.append(popup);
}
function cancelChase(){if(!pending)return;delete pending.cat._gardenExploreTarget;pending=null;const b=buttons.get('butterfly');if(b)b.disabled=false;}
function startChase(){if(pending||!projection)return false;const cat=window.__game?.yard?.entities?.find(e=>e.cat.species==='jinjc'),b=buttons.get('butterfly');if(!cat||!b||cat._gardenRest||cat._playBuildT>0){toast('小猫正在忙，等一下再追蝴蝶。','Your cat is busy. Try the butterfly again in a moment.');return false;}
 const {rect,r,w,h}=projection,ground=window.World?.gardenGround?.(w,h);if(!ground)return false;const bound=(n,a,b)=>Math.max(a,Math.min(b,n));const x=bound((r.left+parseFloat(b.style.left)-rect.left)/rect.width*w,ground.left,ground.right),y=bound((r.top+parseFloat(b.style.top)-rect.top)/rect.height*h+18,ground.top,ground.bottom);pending={cat,x,y,owner,started:performance.now()};cat._gardenExploreTarget={x,y};b.disabled=true;return true;}
function finishChase(){if(!pending)return;const {cat}=pending,s=read(owner);cancelChase();if(!commit('butterfly'))return;cat.pounceT=.8;cat.setPose?.('play',.8);pulse('butterfly');toast(s.butterfly===2?'蝴蝶飞走了，一片小花落在耳尖。纪念：落在耳尖的花':'蝴蝶又飞到了另一处！ '+(s.butterfly+1)+'/3',s.butterfly===2?'The butterfly flies free. A flower lands on your ear. Keepsake: a little flower.':'The butterfly flutters away! '+(s.butterfly+1)+'/3');}
function interact(id){if(owner!==rootState()||!eligible()||covered())return false;const b=buttons.get(id);if(!b||b.hidden)return false;
 const s=read(owner);
 if(id==='butterfly'){closePopup();return startChase();}cancelChase();
 if(id==='snack'){snackChoice();return true;}closePopup();
 if(id==='nameplate'){const ended=!!view()?.ending,event=ended?'nameplate-home':'nameplate';if(!commit(event))return false;pulse(id);toast(ended?'旧名牌旁添上两道新的爪印。这里是我们的家。':'旧木牌背面只剩一笔磨掉的刻字，旁边有两道爪痕。',''+(ended?'Two new paw marks beside the old nameplate. This is our home.':'One worn stroke remains on the back of the wooden nameplate, beside two paw marks.'));return true;}
 if(id==='door'&&!view()?.completed?.includes('harbor:H-05')){toast('旧屋的门关着。门缝里似乎夹着一张褪色的画。也许旅行回来后再看看。','The old house is closed. A faded picture peeks through the door. Try again after your journey.');return true;}
 if(!commit(id))return false;pulse(id);

 if(id==='seed')toast('找到一粒浅金色种子，收进小包。','You found a little golden seed and tucked it away.');
 if(id==='door')toast('旧屋里藏着一张花园的旧明信片。把它带回家吧。','An old garden postcard was hidden inside. Take it home.');
 if(id.startsWith('chart-'))toast(s.parts.length===1?'两片航图都找到了！回去和陌生猫说话。':'找到了一片航图 · 1/2',s.parts.length===1?'Both chart pieces found! Return to the traveler.':'One chart piece found · 1/2');
 return true;
}
// Ending keepsakes are projections of earned scene evidence, not new checklist gates.
function journeyKeepsakes(root,v){const c=root?.resonance?.completed||[],i=root?.resonanceExploration?.interactions||{};if(!c.includes('finale:B-04'))return null;return {map:c.includes('harbor:H-05'),moonleaf:c.includes('forest:R-04'),lantern:c.includes('forge:E-04')?(i['forge:E-01:puzzle:lantern-show']?.shape??2):null,cups:root.resonance?.choices?.['sky:S-04']==='search'?3:2,flight:i['sky:S-03:puzzle:joint-flight']?.route||null};}
function drawJourney(ctx,w,h,art,root,v){const k=journeyKeepsakes(root,v);if(!k)return;const pos=(x,y)=>[art.x+art.width*x,art.y+art.height*y],s=Math.max(.7,Math.min(1.25,w/960));ctx.save();const place=(x,y,draw)=>{ctx.save();ctx.translate(...pos(x,y));ctx.scale(s,s);draw();ctx.restore();};const oval=(x,y,rx,ry,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();};
if(k.map)place(.30,.53,()=>{ctx.fillStyle='#f4dfb3';ctx.fillRect(-23,-14,46,28);ctx.strokeStyle='#779c85';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-16,8);ctx.lineTo(-6,-4);ctx.lineTo(5,4);ctx.lineTo(17,-8);ctx.stroke();oval(17,-8,3,3,'#d39e61');});
if(k.moonleaf)place(.76,.70,()=>{oval(0,4,22,7,'#987450');ctx.strokeStyle='#719b5d';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,3);ctx.quadraticCurveTo(-4,-14,1,-25);ctx.stroke();oval(-7,-17,12,5,'#a8cf85');oval(8,-26,13,6,'#d4e5a1');});
if(k.lantern!==null)place(.60,.42,()=>{oval(0,0,17,20,'#f6bd74');oval(0,0,13,16,'#ffe1a0');ctx.fillStyle='#75553f';if(k.lantern===0){oval(0,0,7,4,'#75553f');ctx.beginPath();ctx.moveTo(-7,0);ctx.lineTo(-12,-5);ctx.lineTo(-12,5);ctx.fill();}else if(k.lantern===1){oval(-4,-2,4,6,'#75553f');oval(4,-2,4,6,'#75553f');}else{oval(0,2,7,6,'#75553f');ctx.beginPath();ctx.moveTo(-7,0);ctx.lineTo(-8,-9);ctx.lineTo(0,-4);ctx.lineTo(6,-10);ctx.lineTo(7,1);ctx.fill();}oval(12,-15,3,3,'#fff9cf');});
place(.48,.67,()=>{oval(0,7,30,11,'#b5966e');for(let i=0;i<k.cups;i++){const x=(i-(k.cups-1)/2)*16;oval(x,0,6,5,'#f9eed9');oval(x,-3,5,2,'#b77b46');ctx.strokeStyle='#fff4df';ctx.beginPath();ctx.arc(x+6,0,3,-1,1);ctx.stroke();}});
if(k.flight)place(.35,.70,()=>{ctx.fillStyle='#e8f2e7';ctx.fillRect(-13,-9,26,18);oval(0,1,8,3,'#c5dbe4');oval(6,-4,3,3,'#dcbf72');});ctx.restore();}
function draw(parent,ctx,w,h){
 init(parent);if(owner!==rootState()){cancelChase();owner=rootState();closePopup();}
 const valid=eligible()&&!covered(),s=read(owner),v=view();
 if(!valid){cancelChase();closePopup();layer.hidden=true;return;}layer.hidden=false;
 const rect=ctx.canvas.getBoundingClientRect(),r=parent.getBoundingClientRect(),art=window.World?.gardenArtworkRect?.(w,h)||{x:0,y:0,width:w,height:h};
 if(!w||!h||!rect.width||!rect.height)return;
 if(pending&&(projection?.w!==w||projection?.h!==h||!window.__game?.yard?.entities?.includes(pending.cat)))cancelChase();
 projection={rect,r,w,h};drawJourney(ctx,w,h,art,owner,v);
 const left=Math.max(0,art.x),right=Math.min(w,art.x+art.width),top=Math.max(0,art.y),bottom=Math.min(h,art.y+art.height);
 const guide=parent.querySelector('.sg-prologue-guide:not([hidden])')?.getBoundingClientRect(),marker=parent.querySelector('.sg-npc-talk-marker:not([hidden])')?.getBoundingClientRect();
 const placed=[];
 for(const [id,b] of buttons){const def=targets[id],isChart=id.startsWith('chart-'),show=id==='butterfly'?s.butterfly<3:id==='seed'?!s.seed:id==='snack'?!s.snack:id==='door'?!s.door:id==='nameplate'?(v?.ending?!s.nameplateHome:!s.nameplate):s.chartStarted&&!v?.openingMet&&v?.current?.id==='prologue:P-05'&&!s.parts.includes(Number(id.at(-1)));
  b.hidden=!show;if(!show)continue;
  const p=def.points[id==='butterfly'?Math.min(2,s.butterfly):0];
  const preferredX=rect.left+(left+(right-left)*p[0])/w*rect.width-r.left,preferredY=rect.top+(top+(bottom-top)*p[1])/h*rect.height-r.top;
  const clamp=(a,lo,hi)=>Math.max(lo,Math.min(Math.max(lo,hi),a));let x=clamp(preferredX,25,r.width-25),y=clamp(preferredY,54,r.height-42);
  const hit=(box,a,b)=>box&&a+r.left+25>box.left&&a+r.left-25<box.right&&b+r.top+25>box.top&&b+r.top-25<box.bottom;
  const blocked=(a,b)=>hit(guide,a,b)||hit(marker,a,b)||placed.some(([u,v])=>Math.hypot(u-a,v-b)<50);
  if(blocked(x,y)){const candidates=[[0,-58],[58,0],[-58,0],[0,-116],[0,58],[58,-58],[-58,-58],[116,0],[-116,0]];for(const [dx,dy] of candidates){const a=clamp(x+dx,25,r.width-25),q=clamp(y+dy,54,r.height-42);if(!blocked(a,q)){x=a;y=q;break;}}}
  placed.push([x,y]);b.style.left=x+'px';b.style.top=y+'px';
  const label=tr(...def.labels);if(b.getAttribute('aria-label')!==label){b.setAttribute('aria-label',label);b.title=label;}
 }
 if(pending){if(Math.hypot(pending.cat.x-pending.x,pending.cat.y-pending.y)<12)finishChase();else if(performance.now()-pending.started>10000){cancelChase();toast('蝴蝶停下来了，再试一次吧。','The butterfly is waiting. Try again.');}}
}
function reset(){cancelChase();projection=null;if(layer)layer.hidden=true;closePopup();}
window.GardenExploration=Object.freeze({draw,reset,read,reduce,journeyKeepsakes,beginChart:()=>read(rootState()).chartStarted||commit('chart-start'),chartReady:()=>read(rootState()).parts.length===2});
})();
