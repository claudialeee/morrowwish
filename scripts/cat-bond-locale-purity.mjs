// Test-only shared P1 language gate; inspect final visible DOM and actual Canvas labels.
export function localeLeak(value, locale, languageControl=false) {
  const text=String(value??'').trim();
  if(!text)return false;
  if(languageControl&&/^(?:中文|EN|English|切换到 English|当前中文，切换到 English|Switch to Chinese|Language: English\. Switch to Chinese|切换到英文)$/.test(text))return false;
  if(locale==='en')return /[\u3400-\u9fff]/u.test(text);
  const remaining=text.replace(/\b(?:Morrow Wish|MORROW WISH|CrazyGames|itch\.io|Y8)\b/g,'')
    .replace(/\b(?:SSR|SR|WASD|Space|Enter|Esc|Shift|Tab|Ctrl|Alt|FPS|BGM|SFX|ID|OK)\b/g,'');
  return /[A-Za-z]{2,}/.test(remaining);
}
export async function installLocaleProbe(page) {
  await page.addInitScript(()=>{
    window.__starbellLocaleCanvas=[];
    for(const key of ['fillText','strokeText']){
      const proto=CanvasRenderingContext2D.prototype,original=proto[key];
      proto[key]=function(value,...args){
        const canvas=this.canvas;
        if(window.__starbellLocaleCapture&&canvas?.isConnected&&canvas.getClientRects().length){
          const style=getComputedStyle(canvas);
          if(style.display!=='none'&&style.visibility!=='hidden'){
            const text=String(value);
            if(text.trim()&&window.__starbellLocaleCanvas.length<1500&&!window.__starbellLocaleCanvas.includes(text))window.__starbellLocaleCanvas.push(text);
          }
        }
        return original.call(this,value,...args);
      };
    }
  });
}
export async function inspectLocale(page,locale,label) {
  await page.waitForFunction(k=>document.documentElement.lang.toLowerCase().startsWith(k),locale);
  await page.evaluate(()=>{window.__starbellLocaleCanvas=[];window.__starbellLocaleCapture=true;});
  await page.waitForTimeout(120);
  const values=await page.evaluate(()=>{
    window.__starbellLocaleCapture=false;
    const out=[],names=new Set((window.State?.S?.cats||[]).flatMap(c=>[c.nickname,c.customName]).filter(Boolean));
    const visible=el=>{
      if(!el?.isConnected||el.closest('script,style,noscript,template,head,[hidden]')||!el.getClientRects().length)return false;
      for(let p=el;p;p=p.parentElement){const c=getComputedStyle(p);if(c.display==='none'||c.visibility==='hidden'||c.opacity==='0')return false;}
      return true;
    };
    const control=el=>!!el.closest('#mw-language,[data-slot-language],[data-res-language],[data-opening-language],.cbcp-language,[data-system="language"]');
    const push=(kind,value,el)=>{const text=String(value||'').trim();if(text&&!names.has(text))out.push({kind,text,languageControl:el?control(el):false,where:el?.id||el?.tagName||'canvas'});};
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    while(walker.nextNode()){const n=walker.currentNode;if(visible(n.parentElement))push('text',n.nodeValue,n.parentElement);}
    for(const el of document.querySelectorAll('[aria-label],[title],[placeholder],[alt]'))if(visible(el))for(const attr of ['aria-label','title','placeholder','alt'])if(el.hasAttribute(attr))push(attr,el.getAttribute(attr),el);
    for(const text of window.__starbellLocaleCanvas||[])push('canvas',text,null);
    return out;
  });
  const unique=new Map();
  for(const item of values)if(localeLeak(item.text,locale,item.languageControl))unique.set(item.kind+':'+item.text,{label,locale,...item});
  return [...unique.values()];
}
