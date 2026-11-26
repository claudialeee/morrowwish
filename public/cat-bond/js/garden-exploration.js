// V3 opening discoveries: real map targets, optional, slot-local and independent of story proof.
(function(){
'use strict';
const fresh=()=>({chartStarted:false,parts:[],butterfly:0,seed:false,snack:null,door:false,nameplate:false,nameplateHome:false,moonleafTouched:false, keepsakes:[]});
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
 case 'moonleaf-touch':if(!canOpenDoor||next.moonleafTouched)return null;next.moonleafTouched=true;break;
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
 moonleaf:{labels:['和暮铃一起碰月叶','Touch the moonleaf with Muling'],type:'seed',points:[[.76,.70]]},
 nameplate:{labels:['翻看木名牌','Turn the wooden nameplate'],type:'nameplate',points:[[.25,.40]]},
 door:{labels:['旧屋的秘密','Old house mystery'],type:'door',points:[[.18,.37]]},
 'chart-0':{labels:['飞走的航图 · 1','Windblown chart · 1'],type:'chart',points:[[.75,.36]]},
 'chart-1':{labels:['飞走的航图 · 2','Windblown chart · 2'],type:'chart',points:[[.40,.59]]}
};
let layer=null,buttons=new Map(),owner=null,popup=null,pending=null,projection=null;
function closePopup(){popup?.remove();popup=null;}
function init(parent){if(layer)return;layer=document.createElement('div');layer.className='sg-exploration-layer';layer.setAttribute('aria-label','Garden discoveries');parent.append(layer);
 for(const [id,target] of Object.entries(targets)){const b=document.createElement('button');b.type='button';b.className='sg-discovery sg-discovery-'+target.type;b.dataset.gardenExplore=id;b.hidden=true;b.innerHTML='<svg viewBox="-24 -24 48 48" aria-hidden="true">'+shapes[target.type]+'</svg><span class="sg-discovery-label"></span>';b.onclick=()=>interact(id);layer.append(b);buttons.set(id,b);}
}
function pulse(id){const b=buttons.get(id);if(!b)return;const cat=window.__game?.yard?.entities?.find(e=>e.cat.species==='jinjc');if(cat&&id==='butterfly'){cat.pounceT=.8;cat.setPose?.('play',.8);}window.MorrowwishAudio?.effect?.('discover');}
function snackChoice(){if(popup)return;popup=document.createElement('section');popup.className='sg-discovery-choice';popup.setAttribute('role','dialog');popup.setAttribute('aria-label',tr('鱼饼','Fish cake'));
 const p=document.createElement('p');p.textContent=tr('一小块香喷喷的鱼饼。','A delicious little fish cake.');popup.append(p);
 for(const [id,a,b] of [['snack-keep','带在身上','Keep for later'],['snack-eat','现在吃掉','Eat now'],['close','暂时不拿','Leave it']]){const button=document.createElement('button');button.type='button';button.textContent=tr(a,b);button.onclick=()=>{if(owner!==rootState()||!eligible()){closePopup();return}if(id==='close'){closePopup();return}if(commit(id)){closePopup();pulse('snack');toast(id==='snack-keep'?'把鱼饼放进小包，留给旅途。':'香香脆脆的，适合出门前吃。',id==='snack-keep'?'You tuck the fish cake away for the road.':'A crisp little breakfast.');}};popup.append(button);}layer.append(popup);
}
function moonleafPose(now,start,home,target,arrived=null){const t=Math.max(0,Math.min(1,(now-start)/1200)),u=t*t*(3-2*t),back=arrived===null?0:Math.max(0,Math.min(1,(now-arrived-750)/950)),b=back*back*(3-2*back),mix=u*(1-b);return {x:home.x+(target.x-home.x)*mix,y:home.y+(target.y-home.y)*mix,touching:arrived!==null&&now-arrived<750,done:arrived!==null&&back>=1};}
function companionPose(x,y){if(pending?.id!=='moonleaf'||pending.owner!==rootState())return null;const now=performance.now();return moonleafPose(now,pending.started,{x,y},{x:pending.x+38,y:pending.y+3},pending.arrived??null);}
function cancelChase(){if(!pending)return;delete pending.cat._gardenExploreTarget;const id=pending.id;pending=null;const b=buttons.get(id);if(b)b.disabled=false;}
function startChase(id='butterfly'){if(pending||!projection)return false;const cat=window.__game?.yard?.entities?.find(e=>e.cat.species==='jinjc'),b=buttons.get(id);if(!cat||!b||cat._gardenRest||cat._playBuildT>0){toast('小猫正在忙，等一下再追蝴蝶。','Your cat is busy. Try the butterfly again in a moment.');return false;}
 const {rect,r,w,h}=projection,ground=window.World?.gardenGround?.(w,h);if(!ground)return false;const bound=(n,a,b)=>Math.max(a,Math.min(b,n));const x=bound((r.left+parseFloat(b.style.left)-rect.left)/rect.width*w,ground.left,ground.right),y=bound((r.top+parseFloat(b.style.top)-rect.top)/rect.height*h+18,ground.top,ground.bottom);pending={cat,x,y,id,owner,started:performance.now(),arrived:null};cat._gardenExploreTarget={x,y};b.disabled=true;return true;}
function finishChase(){if(!pending)return;const {cat,id}=pending,s=read(owner);cancelChase();if(id==='moonleaf'){if(!view()?.ending||!commit('moonleaf-touch'))return;pulse(id);toast('两片新叶舒展开来。','Two new leaves unfold.');return;}if(!commit('butterfly'))return;cat.pounceT=.8;cat.setPose?.('play',.8);pulse('butterfly');toast(s.butterfly===2?'蝴蝶飞走了，一片小花落在耳尖。纪念：落在耳尖的花':'蝴蝶又飞到了另一处！ '+(s.butterfly+1)+'/3',s.butterfly===2?'The butterfly flies free. A flower lands on your ear. Keepsake: a little flower.':'The butterfly flutters away! '+(s.butterfly+1)+'/3');}
function interact(id){if(owner!==rootState()||!eligible()||covered())return false;const b=buttons.get(id);if(!b||b.hidden)return false;
 const s=read(owner);
 if(id==='butterfly'||id==='moonleaf'){closePopup();return startChase(id);}cancelChase();
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
const finalArtCache=new Map();
function finalArt(ctx,name,x,y,w,h){if(typeof Image!=='function')return false;let im=finalArtCache.get(name);if(!im){im=new Image();im.decoding='async';im.src='assets/canon22-final-art/'+name+'.webp';finalArtCache.set(name,im);}if(!im.complete||!im.naturalWidth)return false;const s=Math.min(w/im.naturalWidth,h/im.naturalHeight),dw=im.naturalWidth*s,dh=im.naturalHeight*s;ctx.drawImage(im,x-dw/2,y-dh/2,dw,dh);return true;}
function drawJourney(ctx,w,h,art,root,v){const k=journeyKeepsakes(root,v);if(!k)return;const pos=(x,y)=>[art.x+art.width*x,art.y+art.height*y],s=Math.max(.7,Math.min(1.25,w/960));ctx.save();const place=(x,y,draw)=>{ctx.save();ctx.translate(...pos(x,y));ctx.scale(s,s);draw();ctx.restore();};const oval=(x,y,rx,ry,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();};
if(k.map)place(.30,.53,()=>{if(finalArt(ctx,'garden-route-map',0,0,86,58))return;ctx.fillStyle='#f4dfb3';ctx.fillRect(-23,-14,46,28);ctx.strokeStyle='#779c85';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-16,8);ctx.lineTo(-6,-4);ctx.lineTo(5,4);ctx.lineTo(17,-8);ctx.stroke();oval(17,-8,3,3,'#d39e61');});
if(k.moonleaf)place(.76,.70,()=>{if(finalArt(ctx,'garden-moonleaf',0,-23,80,94)){if(read(root).moonleafTouched){oval(-13,-43,3,3,'#ffecc0');oval(15,-46,3,3,'#ffecc0');}return;}oval(0,4,22,7,'#987450');ctx.strokeStyle='#719b5d';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,3);ctx.quadraticCurveTo(-4,-14,1,-25);ctx.stroke();oval(-7,-17,read(root).moonleafTouched?12:5,5,'#a8cf85');oval(8,-26,read(root).moonleafTouched?13:5,6,'#d4e5a1');if(read(root).moonleafTouched){oval(-13,-29,3,3,'#ffecc0');oval(15,-32,3,3,'#ffecc0');}});
if(k.lantern!==null)place(.60,.42,()=>{if(finalArt(ctx,'garden-lantern',0,0,72,82)){finalArt(ctx,['shadow-fish','shadow-butterfly','shadow-cat'][k.lantern]||'shadow-cat',0,0,22,20);return;}oval(0,0,17,20,'#f6bd74');oval(0,0,13,16,'#ffe1a0');ctx.fillStyle='#75553f';if(k.lantern===0){oval(0,0,7,4,'#75553f');ctx.beginPath();ctx.moveTo(-7,0);ctx.lineTo(-12,-5);ctx.lineTo(-12,5);ctx.fill();}else if(k.lantern===1){oval(-4,-2,4,6,'#75553f');oval(4,-2,4,6,'#75553f');}else{oval(0,2,7,6,'#75553f');ctx.beginPath();ctx.moveTo(-7,0);ctx.lineTo(-8,-9);ctx.lineTo(0,-4);ctx.lineTo(6,-10);ctx.lineTo(7,1);ctx.fill();}oval(12,-15,3,3,'#fff9cf');});
place(.48,.67,()=>{oval(0,7,30,11,'#b5966e');for(let i=0;i<k.cups;i++){const x=(i-(k.cups-1)/2)*16;if(finalArt(ctx,'garden-teacup',x,0,27,26))continue;oval(x,0,6,5,'#f9eed9');oval(x,-3,5,2,'#b77b46');ctx.strokeStyle='#fff4df';ctx.beginPath();ctx.arc(x+6,0,3,-1,1);ctx.stroke();}});
if(k.flight)place(.35,.70,()=>{ctx.fillStyle='#e8f2e7';ctx.fillRect(-13,-9,26,18);oval(0,1,8,3,'#c5dbe4');oval(6,-4,3,3,'#dcbf72');});ctx.restore();}
// Place full, real touch rectangles, not guessed icon centers. Use a
// deterministic grid fallback for crowded phone/landscape layouts.
function placeMarker(px,py,bw,bh,W,H,avoid=[]){
 const clamp=(a,lo,hi)=>Math.max(lo,Math.min(Math.max(lo,hi),a)),hx=bw/2+3,hy=bh/2+3;
 const bound=(x,y)=>[clamp(x,hx,W-hx),clamp(y,hy,H-hy)];
 const rect=([x,y])=>({left:x-bw/2,top:y-bh/2,right:x+bw/2,bottom:y+bh/2});
 const overlap=(a,b)=>Math.max(0,Math.min(a.right,b.right+4)-Math.max(a.left,b.left-4))*Math.max(0,Math.min(a.bottom,b.bottom+4)-Math.max(a.top,b.top-4));
 const points=[bound(px,py)];
 for(let n=1;n<=3;n++)for(const [dx,dy] of [[0,-1],[1,0],[-1,0],[0,1],[1,-1],[-1,-1],[1,1],[-1,1]])points.push(bound(px+dx*n*(bw+5),py+dy*n*(bh+5)));
 for(let y=hy;y<=H-hy+.01;y+=bh+5)for(let x=hx;x<=W-hx+.01;x+=bw+5)points.push([x,y]);
 let best=points[0],score=Infinity;
 for(const p of points){const box=rect(p),cost=avoid.reduce((sum,b)=>sum+overlap(box,b),0)*1000+Math.hypot(p[0]-px,p[1]-py);if(cost<score){score=cost;best=p;}if(cost===0)break;}
 return {x:best[0],y:best[1],box:rect(best)};
}
function draw(parent,ctx,w,h,npcRects=[]){
 init(parent);if(owner!==rootState()){cancelChase();owner=rootState();closePopup();}
 const valid=eligible()&&!covered(),s=read(owner),v=view();
 if(!valid){cancelChase();closePopup();layer.hidden=true;return;}layer.hidden=false;
 const rect=ctx.canvas.getBoundingClientRect(),r=parent.getBoundingClientRect(),art=window.World?.gardenArtworkRect?.(w,h)||{x:0,y:0,width:w,height:h};
 if(!w||!h||!rect.width||!rect.height)return;
 if(pending&&(projection?.w!==w||projection?.h!==h||!window.__game?.yard?.entities?.includes(pending.cat)))cancelChase();
 projection={rect,r,w,h};drawJourney(ctx,w,h,art,owner,v);
 const left=Math.max(0,art.x),right=Math.min(w,art.x+art.width),top=Math.max(0,art.y),bottom=Math.min(h,art.y+art.height);
 const relative=b=>({left:b.left-r.left,top:b.top-r.top,right:b.right-r.left,bottom:b.bottom-r.top});
 const placed=[...parent.querySelectorAll('.sg-prologue-guide:not([hidden]),.sg-npc-talk-marker:not([hidden])')].map(el=>relative(el.getBoundingClientRect())).concat(npcRects);
 // Required chart pieces take precedence over optional discoveries.
 const ordered=[...buttons].sort(([a],[b])=>Number(b.startsWith('chart-'))-Number(a.startsWith('chart-')));
 for(const [id,b] of ordered){const def=targets[id],isChart=id.startsWith('chart-'),show=id==='butterfly'?s.butterfly<3:id==='seed'?!s.seed:id==='snack'?!s.snack:id==='door'?!s.door:id==='nameplate'?(v?.ending?!s.nameplateHome:!s.nameplate):id==='moonleaf'?!!v?.ending&&!!journeyKeepsakes(owner,v)?.moonleaf&&!s.moonleafTouched:s.chartStarted&&!v?.openingMet&&v?.current?.id==='prologue:P-05'&&!s.parts.includes(Number(id.at(-1)));
  b.hidden=!show;if(!show)continue;
  const p=def.points[id==='butterfly'?Math.min(2,s.butterfly):0];
  const preferredX=rect.left+(left+(right-left)*p[0])/w*rect.width-r.left,preferredY=rect.top+(top+(bottom-top)*p[1])/h*rect.height-r.top;
  const bw=b.offsetWidth||84,bh=b.offsetHeight||70;
  // A running butterfly/moonleaf action owns its target until it finishes.
  const fixed=pending?.id===id&&Number.isFinite(parseFloat(b.style.left))&&Number.isFinite(parseFloat(b.style.top));
  const p0=fixed?{x:parseFloat(b.style.left),y:parseFloat(b.style.top)}:placeMarker(preferredX,preferredY,bw,bh,r.width,r.height,placed);
  const {x,y}=p0;placed.push(p0.box||{left:x-bw/2,top:y-bh/2,right:x+bw/2,bottom:y+bh/2});b.style.left=x+'px';b.style.top=y+'px';
  const label=tr(...def.labels);if(b.getAttribute('aria-label')!==label){b.setAttribute('aria-label',label);b.title=label;b.querySelector('.sg-discovery-label').textContent=label;}
 }
 if(pending){const now=performance.now(),arrived=Math.hypot(pending.cat.x-pending.x,pending.cat.y-pending.y)<12;
 if(pending.id==='moonleaf'){if(pending.arrived===null&&arrived&&now-pending.started>=1200){pending.arrived=now;pending.cat.setPose?.('play',.8);window.MorrowwishAudio?.effect?.('discover');}if(pending.arrived!==null){const t=now-pending.arrived;if(t<750){ctx.save();ctx.globalAlpha=Math.sin(Math.PI*t/750);finalArt(ctx,'garden-moonleaf-touch',w*.5,h*.31,Math.min(w*.45,360),h*.46);ctx.strokeStyle='#f4e5a2';ctx.lineWidth=2;for(let i=0;i<6;i++){const a=i*Math.PI/3+t*.003,r=18+t*.035;ctx.beginPath();ctx.arc(pending.x+Math.cos(a)*r,pending.y-18+Math.sin(a)*r*.6,3,0,Math.PI*2);ctx.stroke();}ctx.restore();}if(t>=1700)finishChase();}else if(now-pending.started>10000){cancelChase();toast('走近月叶再试一次。','Walk closer to the moonleaf and try again.');}}
 else if(arrived)finishChase();else if(now-pending.started>10000){cancelChase();toast('蝴蝶停下来了，再试一次吧。','The butterfly is waiting. Try again.');}}
}
function reset(){cancelChase();projection=null;if(layer)layer.hidden=true;closePopup();}
window.GardenExploration=Object.freeze({draw,reset,read,reduce,journeyKeepsakes,moonleafPose,companionPose,placeMarker,beginChart:()=>read(rootState()).chartStarted||commit('chart-start'),chartReady:()=>read(rootState()).parts.length===2});
})();
