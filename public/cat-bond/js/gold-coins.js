// Cat Bond coins are gold. OS-provided U+1FA99 emoji usually looks gold.
(()=>{
  'use strict';
  const SRC='/cat-bond/assets/gold-coin.svg?v=gold-currency-20261122';
  const img=new Image(); img.src=SRC;
  const SKIP='script,style,noscript,textarea,code,pre,svg';
  function icon(){
    const el=document.createElement('img');el.className='cb-gold-coin';
    el.src=SRC;el.alt='';el.draggable=false;return el;
  }
  function replace(node){
    if(node?.nodeType!==3||!node.nodeValue?.includes('🪙'))return false;
    if(node.parentElement?.closest(SKIP))return false;
    const parts=node.nodeValue.split('🪙'),frag=document.createDocumentFragment();
    parts.forEach((part,i)=>{
      if(part)frag.appendChild(document.createTextNode(part));
      if(i<parts.length-1)frag.appendChild(icon());
    });
    node.replaceWith(frag);
    return true;
  }
  function decorate(root){
    if(!root)return 0;
    if(root.nodeType===3)return replace(root)?1:0;
    if(root.nodeType!==1||root.matches(SKIP))return 0;
    const tw=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];
    let n;while((n=tw.nextNode()))if(n.nodeValue?.includes('🪙'))nodes.push(n);
    let replaced=0;
    nodes.forEach(node=>{if(replace(node))replaced++});
    return replaced;
  }
  function draw(ctx,x,y,size=18){
    size=Math.max(7,size);ctx.save();
    if(img.complete&&img.naturalWidth>0){
      ctx.drawImage(img,x-size/2,y-size/2,size,size);
    }else{
      const r=size/2,g=ctx.createRadialGradient(x-r*.3,y-r*.4,r*.12,x,y,r);
      g.addColorStop(0,'#ffffff');g.addColorStop(.45,'#ffe6a0');g.addColorStop(1,'#c59032');
      ctx.fillStyle=g;ctx.strokeStyle='#98691f';ctx.lineWidth=Math.max(1,r*.11);
      ctx.beginPath();ctx.arc(x,y,r*.88,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.strokeStyle='#fff5cb';ctx.lineWidth=Math.max(.7,r*.09);
      ctx.beginPath();ctx.arc(x,y,r*.65,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle='#dbad42';ctx.beginPath();ctx.arc(x,y+r*.06,r*.24,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  }
  function mount(){
    const root=document.getElementById('game-root');if(!root)return;
    decorate(root);
    const observer=new MutationObserver(records=>{
      observer.disconnect();
      let converted=0;
      for(const rec of records){
        if(rec.type==='characterData')converted+=replace(rec.target)?1:0;
        else for(const node of rec.addedNodes)converted+=decorate(node);
      }
      // A coin glyph is replaced with <img>, splitting a single localized
      // sentence into multiple text nodes. Translate those NEW fragments now
      // (and cache their Chinese originals for future EN/ZH toggling), even
      // if MutationObserver callback ordering would otherwise skip them.
      // This applies across all panels, both on the website and in portals.
      if(converted)window.CatBondI18n?.render?.();
      observer.observe(root,{childList:true,subtree:true,characterData:true});
    });
    observer.observe(root,{childList:true,subtree:true,characterData:true});
  }
  window.CatBondGoldCoin={draw,decorate,get ready(){return img.complete&&img.naturalWidth>0;}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
  else mount();
})();