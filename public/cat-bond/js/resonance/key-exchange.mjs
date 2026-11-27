const asset=new URL("../../assets/npc/props/garden-key.svg",import.meta.url).href;
export function mountKeyExchange({root,language,isCurrent,commit,onComplete}){
 const t=(zh,en)=>language()==="zh"?zh:en;
 const panel=document.createElement("section");panel.className="res-key-panel res-key-handover";
 const title=document.createElement("h2"),image=document.createElement("img"),hint=document.createElement("p"),button=document.createElement("button");image.src=asset;image.alt="";button.type="button";panel.append(title,image,hint,button);root.append(panel);
 let disposed=false,busy=false,error=false;
 function render(){if(disposed)return;title.textContent=t("第二把花园钥匙","The second garden key");hint.textContent=error?t("保存失败，请再试一次。","Unable to save. Try again."):t("把另一把钥匙交给暮铃，欢迎伙伴回家。","Give Luna the second key and welcome your companion home.");button.textContent=t("交给暮铃","Give Luna the key");}
 button.onclick=()=>{if(disposed||busy||!isCurrent())return;busy=true;let r;try{r=commit();}finally{busy=false;}if(r?.ok){onComplete();return;}error=true;render();};
 function dispose(){disposed=true;window.removeEventListener("morrowwish-language-change",render);panel.remove();}
 window.addEventListener("morrowwish-language-change",render);render();button.focus();return {render,dispose};
}
