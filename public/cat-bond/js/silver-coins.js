// Cat Bond coins are silver. OS-provided U+1FA99 emoji usually looks gold.
(()=>{
  'use strict';
  const SRC='/cat-bond/assets/silver-coin.svg?v=silver-currency-20261122';
  const img=new Image(); img.src=SRC;
  const SKIP='script,style,noscript,textarea,code,pre,svg';
  function icon(){
    const el=document.createElement('img');el.className='cb-silver-coin';
    el.src=SRC;el.alt='coin';el.draggable=false;return el;
  }
  function replace(node){
    if(node?.nodeType!==3||!node.nodeValue?.includes('🪙'))return;
    if(node.parentElement?.closest(SKIP))return;
    const parts=node.nodeValue.split('🪙'),frag=document.createDocumentFragment();
    parts.forEach((part,i)=>{
      if(part)frag.appendChild(document.createTextNode(part));
      if(i<parts.length-1)frag.appendChild(icon());
    });
    node.replaceWith(frag);
  }
  function decorate(root){
    if(!root)return;
    if(root.nodeType===3){replace(root);return;}
    if(root.nodeType!==1||root.matches(SKIP))return;
    const tw=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];
    let n;while((n=tw.nextNode()))if(n.nodeValue?.includes('🪙'))nodes.push(n);
    nodes.forEach(replace);
  }
  function draw(ctx,x,y,size=18){
    size=Math.max(7,size);ctx.save();
    if(img.complete&&img.naturalWidth>0){
      ctx.drawImage(img,x-size/2,y-size/2,size,size);
    }else{
      const r=size/2,g=ctx.createRadialGradient(x-r*.3,y-r*.4,r*.12,x,y,r);
      g.addColorStop(0,'#ffffff');g.addColorStop(.45,'#dfe9f2');g.addColorStop(1,'#849bad');
      ctx.fillStyle=g;ctx.strokeStyle='#72899c';ctx.lineWidth=Math.max(1,r*.11);
      ctx.beginPath();ctx.arc(x,y,r*.88,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.strokeStyle='#f8fbff';ctx.lineWidth=Math.max(.7,r*.09);
      ctx.beginPath();ctx.arc(x,y,r*.65,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle='#8ba1b3';ctx.beginPath();ctx.arc(x,y+r*.06,r*.24,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  }
  function mount(){
    const root=document.getElementById('game-root');if(!root)return;
    decorate(root);
    const observer=new MutationObserver(records=>{
      observer.disconnect();
      for(const rec of records){
        if(rec.type==='characterData')replace(rec.target);
        else for(const node of rec.addedNodes)decorate(node);
      }
      observer.observe(root,{childList:true,subtree:true,characterData:true});
    });
    observer.observe(root,{childList:true,subtree:true,characterData:true});
  }
  window.CatBondSilverCoin={draw,decorate,get ready(){return img.complete&&img.naturalWidth>0;}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
  else mount();
})();