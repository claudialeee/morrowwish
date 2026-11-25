// Canonical cursor-driven camera, using only existing painted production assets.
const A=new URL("../../assets/",import.meta.url),art=p=>new URL(p,A).href;
const anchor="cinematics/prologue/keepers-choice.webp",library="resonance-world-v2/library.webp",bell="cinematics/prologue/star-bell.webp",broken="cinematics/prologue/broken-bell-tongue.webp",waiting="cinematics/prologue/waiting-at-workbench.webp",atlas="resonance-world-v2/atlas.webp",starfall="resonance-world-v2/starfall.webp";
export const isLibraryReveal=id=>["library:M-03","library:M-04","library:M-05"].includes(id);
export function revealShot(id,c){
 const shot=(path,mode,actors,zh,en)=>({path,mode,actors,caption:[zh,en]});
 if(id==="library:M-03"){
  if(c<4)return shot(bell,"mural",["player","muling"],"已核实壁画 · 星铃旁的两只猫","Verified mural · Two cats beside the Star Bell");
  if(c<8)return shot(library,"present",["player","muling"],"月镜书库 · 现实","Moonmirror Library · Present");
  if(c<9)return shot(bell,"memory",["player","muling"],"历史重现","Recovered memory");
  if(c===9)return shot(anchor,"anchor",["player","muling"],"第一任守铃者 · 你自愿进入应急锚室","The first Bellkeeper · You chose the emergency anchor");
  if(c<12)return shot(anchor,"anchor",["player","muling"],"你自愿献出姓名和记忆，留在星铃应急锚室","You willingly gave your name and memories and remained in the Star Bell's emergency anchor");
  if(c<14)return shot(library,"present",["player","muling"],"月镜书库 · 现实","Moonmirror Library · Present");
  return shot(waiting,"memory",["muling"],"灾变之后 · 暮铃未能阻止你","After the catastrophe · Muling could not stop you");
 }
 if(id==="library:M-04"){
  if(c<2)return shot(atlas,"ledger",["baikan"],"白栞恢复的记录 · 圣所被重定向至中央","Baikan's recovered ledger · The sanctuaries were redirected inward");
  if(c<4)return shot(broken,"memory",["muling"],"封印的裂隙 · 记忆逐渐流失","A breach in the seal · Memories began to disappear");
  if(c<7)return shot(library,"fracture",["player","muling"],"月镜书库 · 信任的裂痕","Moonmirror Library · Trust fractured");
  return shot(waiting,"fracture",["player","muling"],"等待的岁月 · 不是免责的理由","The years of waiting · Not an excuse");
 }
 if(c<4)return shot(atlas,"routes",["moye","baikan"],"两条路径 · 中央汇集与邻地共鸣","Two routes · Inward convergence and neighboring resonance");
 if(c<8)return shot(library,"present",["player","muling"],"不能替别人作出选择","No one can choose for everyone");
 return shot(starfall,"departure",["muling"],"暮铃离开书库，前往星坠原","Muling leaves the library for Starfall Expanse");
}
export function mountLibraryReveal(root,portrait){
 const doc=root.ownerDocument,node=(tag,cls)=>{const e=doc.createElement(tag);e.className=cls;return e;};
 root.classList.add("res-library-reveal");
 const stage=node("div","library-reveal-stage"),back=node("div","library-reveal-back"),actors=node("div","library-reveal-cast"),shade=node("div","library-reveal-shade"),caption=node("p","library-reveal-caption");
 stage.append(back,actors,shade,caption);root.prepend(stage);let last="",lastCast="",generation=0,disposed=false;
 function render(v,k){
  if(disposed||!v.current||!isLibraryReveal(v.current.id))return;
  if(!v.lineReady){stage.hidden=true;return;}stage.hidden=false;
  const s=v.current,shot=revealShot(s.id,v.cursor);stage.dataset.mode=shot.mode;caption.textContent=shot.caption[k==="zh"?0:1];
  const key=shot.path+"|"+shot.mode;if(last!==key){last=key;const g=++generation,img=node("img","library-reveal-painting");img.alt="";back.append(img);img.addEventListener("load",()=>{if(disposed||g!==generation){img.remove();return;}img.classList.add("is-current");for(const older of [...back.children])if(older!==img){older.classList.remove("is-current");setTimeout(()=>older.remove(),720);}},{once:true});img.src=art(shot.path);}
  const cast=shot.actors.map(id=>[id,portrait(id,s.id,v.cursor)]);const castKey=JSON.stringify([shot.mode,cast]);if(lastCast!==castKey){lastCast=castKey;actors.replaceChildren();for(const [id,url] of cast){if(!url)continue;const img=node("img","library-reveal-actor");img.alt="";img.src=url;img.dataset.actor=id;actors.append(img);}}
  for(const a of actors.children)a.classList.toggle("speaking",a.dataset.actor===s.lines[v.cursor]?.speaker);
 }
 return {render,dispose(){disposed=true;generation++;stage.remove();root.classList.remove("res-library-reveal")}};
}
