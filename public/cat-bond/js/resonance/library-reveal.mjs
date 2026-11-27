// Canonical cursor-driven camera, using only existing painted production assets.
const A=new URL("../../assets/",import.meta.url),art=p=>new URL(p,A).href;
const anchorDetail="core-art-remaster/story/m03-reveal.webp",library="resonance-world-v2/library.webp",bell="core-art-remaster/story/m03-reveal.webp",atlas="resonance-world-v2/atlas.webp",starfall="resonance-world-v2/starfall.webp";
export const isLibraryReveal=id=>["library:M-03","library:M-04","library:M-05"].includes(id);
export function revealShot(id,c,choice=null){
 const shot=(path,mode,actors,zh,en)=>({path,mode,actors,caption:[zh,en]});
 if(id==="library:M-03"){
  if(c<4)return shot(bell,"mural",[],"壁画里的两只猫","Two cats in the mural");
  return shot(library,"present",["player","muling"],"月镜书库 · 现实","Moonmirror Library · Present");
 }
 if(id==="library:M-04"){
  if(c<2)return shot(atlas,"ledger",["baikan"],"借阅记录 · 与暮铃铃坠相同的印记","Borrowing record · A mark matching Muling's pendant");
  return shot(library,"fracture",["player","muling"],"月镜书库 · 信任的裂痕","Moonmirror Library · Trust fractured");
 }
 if(c<3)return shot(atlas,"routes",["moye","baikan"],"两条路径 · 中央汇集与邻地共鸣","Two routes · Inward convergence and neighboring resonance");
 if(c<7)return shot(library,"present",["player","muling"],"不能替别人作出选择","No one can choose for everyone");
 return shot(starfall,"departure",["muling"],"暮铃离开书库，前往星坠原","Muling leaves the library for Starfall Expanse");
}

export function mountLibraryReveal(root,portrait,onSettled=()=>{}){
 const doc=root.ownerDocument,node=(tag,cls)=>{const e=doc.createElement(tag);e.className=cls;return e;};
 root.classList.add("res-library-reveal");
 const stage=node("div","library-reveal-stage"),back=node("div","library-reveal-back"),actors=node("div","library-reveal-cast"),shade=node("div","library-reveal-shade"),caption=node("p","library-reveal-caption"),detail=node("div","library-anchor-detail");
 detail.hidden=true;detail.style.backgroundImage=`url("${art(anchorDetail)}")`;detail.setAttribute("aria-hidden","true");stage.append(back,actors,detail,shade,caption);root.prepend(stage);let last="",lastCast="",generation=0,disposed=false,departureDone=false,departureTimer=0;
 function render(v,k){
  if(disposed||!v.current||!isLibraryReveal(v.current.id))return;
  if(!v.lineReady){stage.hidden=true;return;}stage.hidden=false;
  const s=v.current,shot=revealShot(s.id,v.cursor,v.choice);stage.dataset.mode=shot.mode;stage.dataset.cursor=String(v.cursor);detail.hidden=shot.mode!=="anchor";caption.textContent=shot.caption[k==="zh"?0:1];
  const native=window.matchMedia("(orientation:portrait) and (max-width:700px)").matches;const alternate={[bell]:"mobile-portrait/story-m03-reveal.webp",[library]:"mobile-portrait/moonmirror-library-tall.webp",[atlas]:"mobile-portrait/atlas.webp",[starfall]:"mobile-portrait/starfall-expanse.webp"};const path=native&&alternate[shot.path]||shot.path;stage.dataset.nativePortrait=String(path!==shot.path);const key=path+"|"+shot.mode;if(last!==key){last=key;stage.dataset.ready="false";const g=++generation,img=node("img","library-reveal-painting");img.alt="";back.append(img);img.addEventListener("load",()=>{if(disposed||g!==generation){img.remove();return;}img.classList.add("is-current");stage.dataset.ready="true";if(shot.mode==="departure"){clearTimeout(departureTimer);departureTimer=setTimeout(settleDeparture,3200);}for(const older of [...back.children])if(older!==img){older.classList.remove("is-current");setTimeout(()=>older.remove(),720);}},{once:true});img.addEventListener("error",()=>{if(g!==generation||disposed)return;img.remove();stage.dataset.ready="error";if(shot.mode==="departure")settleDeparture();},{once:true});img.src=art(path);if(shot.mode==="departure"){clearTimeout(departureTimer);departureTimer=setTimeout(settleDeparture,6500);}}
  const cast=shot.actors.map(id=>[id,portrait(id,s.id,v.cursor)]);const castKey=JSON.stringify([shot.mode,cast]);if(lastCast!==castKey){lastCast=castKey;actors.replaceChildren();for(const [id,url] of cast){if(!url)continue;const img=node("img","library-reveal-actor");img.alt="";img.src=url;img.dataset.actor=id;if(id==="player"){const cat=window.State?.S?.cats?.[0];img.dataset.species=cat?.species||"";img.dataset.catUid=String(cat?.uid??"");}actors.append(img);}}
  for(const a of actors.children)a.classList.toggle("speaking",a.dataset.actor===s.lines[v.cursor]?.speaker);
 }
 function settleDeparture(){if(disposed||departureDone)return;departureDone=true;clearTimeout(departureTimer);onSettled();}
 return {render,departurePending(v){return v.current?.id==="library:M-05"&&v.cursor===v.current.lines.length&&v.objective.length===0&&!departureDone;},dispose(){disposed=true;clearTimeout(departureTimer);generation++;stage.remove();root.classList.remove("res-library-reveal")}};
}
