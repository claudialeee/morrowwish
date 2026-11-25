(()=>{"use strict";
let active=null;const lang=()=>window.MorrowwishI18n?.get?.()==="zh"?"zh":"en",tr=v=>typeof v==="string"?v:v[lang()],pair=(zh,en)=>({zh,en});
function ask({title,message,accept=pair("确定","Confirm"),cancel=true,danger=false}){
 if(active)return Promise.resolve(false);
 return new Promise(resolve=>{
 const d=document.createElement("dialog"),h=document.createElement("h2"),p=document.createElement("p"),a=document.createElement("div"),yes=document.createElement("button"),no=document.createElement("button");
 d.className="cb-confirm-dialog";d.setAttribute("aria-labelledby","cb-confirm-title");d.setAttribute("aria-describedby","cb-confirm-copy");h.id="cb-confirm-title";p.id="cb-confirm-copy";a.className="cb-confirm-actions";yes.type=no.type="button";yes.dataset.confirmAccept="";no.dataset.confirmCancel="";yes.className=danger?"cb-confirm-danger":"cb-confirm-primary";
 const previous=document.activeElement,owner=window.State?.S,slot=window.State?.activeSlot?.();let finished=false;
 const render=()=>{h.textContent=tr(title);p.textContent=tr(message);yes.textContent=tr(accept);no.textContent=tr(pair("取消","Cancel"));};
 const finish=value=>{if(finished)return;finished=true;window.removeEventListener("morrowwish-language-change",render);window.removeEventListener("cat-bond-active-save-changed",onSlot);d.remove();active=null;if(previous?.isConnected)previous.focus({preventScroll:true});resolve(value&&owner===window.State?.S&&slot===window.State?.activeSlot?.());};
 const onSlot=()=>finish(false);
 yes.onclick=()=>finish(true);no.onclick=()=>finish(false);d.addEventListener("cancel",e=>{e.preventDefault();finish(false)});d.addEventListener("close",()=>finish(false));
 if(cancel)a.append(no);a.append(yes);d.append(h,p,a);document.body.append(d);active=d;render();
 window.addEventListener("morrowwish-language-change",render);window.addEventListener("cat-bond-active-save-changed",onSlot);
 try{d.showModal();(cancel?no:yes).focus()}catch{finish(false)}
 });
}
function slot(action,n){return ask({title:{overwrite:pair("覆盖存档位"+n+"？","Overwrite save slot "+n+"?"),delete:pair("永久删除存档位"+n+"？","Permanently delete save slot "+n+"?"),load:pair("读取存档位"+n+"？","Load save slot "+n+"?")}[action],message:{overwrite:pair("原有冒险将被替换，另外两个存档位不受影响。","The existing adventure will be replaced. The other two slots will remain unchanged."),delete:pair("删除后无法恢复，其他存档位不受影响。","This cannot be undone. Other slots remain unchanged."),load:pair("当前冒险将先保存，再读取选中的存档。","Your current adventure will be saved before loading the selected slot.")}[action],accept:{overwrite:pair("覆盖存档","Overwrite"),delete:pair("删除存档","Delete"),load:pair("读取存档","Load")}[action],danger:action!=="load"})}
window.CatBondConfirm=Object.freeze({ask,slot,notice:message=>ask({title:pair("提示","Notice"),message,accept:pair("知道了","OK"),cancel:false})});
let cover=null;window.CatBondOpeningCover=Object.freeze({show(){if(cover?.isConnected)return;cover=document.createElement("div");cover.id="cb-opening-cover";cover.setAttribute("aria-hidden","true");document.getElementById("stage")?.append(cover)},hide(){cover?.remove();cover=null}});
})();