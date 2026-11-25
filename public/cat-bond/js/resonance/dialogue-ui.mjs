// Host-mounted dialogue controller; no save store and no fallback artwork.
// The host must resolve approved art, own scene transitions, and call render after gameplay.
export function mountDialogue({root,engine,campaign,language,resolvePortrait,onPersist,onClose,onAwaitAction,onLanguage}) {
 if(!root||typeof resolvePortrait!=="function"||typeof onPersist!=="function")throw Error("Dialogue host adapter incomplete");
 const el=(tag,cls)=>{const e=document.createElement(tag);if(cls)e.className=cls;return e};
 const panel=el("section","res-dialogue"),art=el("img","res-portrait"),body=el("div","res-body"),name=el("h2","res-speaker"),line=el("p","res-line"),choices=el("div","res-choices"),tools=el("div","res-controls"),history=el("div","res-history");
 const context=el('p','res-prologue-context');context.style.cssText='font-size:clamp(11px,1.5vw,14px);line-height:1.4;color:#e3c68f;margin:0 0 8px';
 panel.setAttribute("role","region");line.setAttribute("aria-live","polite");art.alt="";history.hidden=true;body.append(context,name,line,choices,tools,history);panel.append(art,body);root.append(panel);
 // The same line can re-render on a narrative revision or language toggle.
 // Do not cancel an in-flight portrait decode by assigning its unchanged URL.
 function setPortrait(url){if(!url){art.hidden=true;if(art.hasAttribute("src"))art.removeAttribute("src");return;}if(art.getAttribute("src")!==url)art.setAttribute("src",url);art.hidden=false;}
 const buttons={};let timer=0,automatic=false,showHistory=false,disposed=false,lastScene=null,sessionHistory=[],speed=1;
 const words={zh:{next:"继续",auto:"自动",stop:"停止自动",skip:"跳过对白",history:"对白记录",close:"关闭",wait:"继续探索以推进剧情",speed:"播放速度",scene:"剧情对话"},en:{next:"Continue",auto:"Auto",stop:"Stop auto",skip:"Skip dialogue",history:"History",close:"Close",wait:"Continue exploring to advance the story",speed:"Playback speed",scene:"Story dialogue"}};
 const lang=()=>language()==="zh"?"zh":"en";
 const displayName=(id,s,k)=>id==='player'&&campaign.scenes.findIndex(x=>x.id===s.id)<campaign.scenes.findIndex(x=>x.id==='library:M-03')?(k==='zh'?'你':'You'):campaign.cast[id].name[k];
 const persist=r=>{if(!r.ok){panel.dataset.error=r.reason||"save-failed";line.setAttribute("aria-label",lang()==="zh"?"保存或推进失败，请重试":"Unable to save or advance. Retry.");return false}delete panel.dataset.error;line.removeAttribute("aria-label");onPersist(r.state);return true};
 function stop(){clearTimeout(timer);timer=0}
 function next(){const v=engine.view();if(!v.current||!v.lineReady||v.cursor>=v.current.lines.length)return;const l=v.current.lines[v.cursor];if(persist(engine.nextLine())){sessionHistory.push(l);render()}}
 function skip(){const v=engine.view();if(!v.current)return;while(engine.view().lineReady&&engine.view().cursor<v.current.lines.length){const l=v.current.lines[engine.view().cursor];if(!persist(engine.nextLine()))break;sessionHistory.push(l)}render()}
 function button(id,fn){const b=el("button");b.type="button";b.addEventListener("click",fn);tools.append(b);buttons[id]=b;return b}
 button("next",next);button("auto",()=>{automatic=!automatic;render()});button("skip",skip);button("history",()=>{showHistory=!showHistory;render()});button("close",()=>{dispose();onClose?.()});if(onLanguage)button("language",()=>onLanguage(lang()==="zh"?"en":"zh")).setAttribute("data-res-language","");
 const speedSelect=el("select");for(const n of [.75,1,1.5,2]){const o=el("option");o.value=n;o.textContent=n+"×";speedSelect.append(o)}speedSelect.value="1";speedSelect.addEventListener("change",()=>{speed=Number(speedSelect.value);render()});tools.append(speedSelect);
 function render(){if(disposed)return;stop();const v=engine.view(),s=v.current,k=lang(),w=words[k];panel.setAttribute("aria-label",w.scene);for(const id of Object.keys(buttons))buttons[id].textContent=id==="language"?(k==="zh"?"EN":"中文"):id==="auto"&&automatic?w.stop:w[id];if(buttons.language)buttons.language.setAttribute("aria-label",k==="zh"?"切换到英文":"Switch to Chinese");speedSelect.setAttribute("aria-label",w.speed);choices.replaceChildren();history.replaceChildren();history.hidden=!showHistory;
 if(!s){dispose();onClose?.();return}if(lastScene!==s.id){lastScene=s.id;sessionHistory=[]}const l=v.lineReady?s.lines[v.cursor]:null;
 context.hidden=!(s.id==='prologue:P-05'&&v.cursor===0);context.textContent=context.hidden?'':(k==='zh'?'暮铃告诉你，六地的猫正在失去记忆。她邀请你一起恢复圣所。':'Muling explains that cats across the six regions are losing their memories. She asks you to help restore the sanctuaries.');
 const harborContext=s.id==="harbor:H-03"&&!v.objective.includes("explore:tide-logbook")?["救援日志：当年岬灯关掉灯塔，救援船失去方向，但船员全部幸存。","Rescue log: Jiedeng extinguished the beacon. The rescue vessel lost its bearing, but its crew survived."]:s.id==="harbor:H-05"&&!v.objective.includes("melody:harbor")?["归潮调 · 港口居民忆起同伴与旧航路，补给船即将驶向眠根林。","Returning Tides · The harbor remembers its companions and old routes. A supply vessel will sail toward Rootsleep Forest."]:null;
 if(harborContext){context.hidden=false;context.textContent=harborContext[k==="zh"?0:1];}context.classList.toggle("res-harbor-context",!!harborContext);panel.dataset.speaker=l?.speaker||"";
 const choiceVisible=!v.choice&&s.choices.length&&(s.choiceTiming==="beforeAction"||v.cursor===s.lines.length);
 if(choiceVisible)for(const c of s.choices){const b=el("button");b.type="button";b.textContent=c.label[k];b.addEventListener("click",()=>{if(persist(engine.choose(c.id)))render()});choices.append(b)}
 if(l){const actor=campaign.cast[l.speaker],url=l.narration?null:resolvePortrait(l.speaker,s.id,v.cursor);if(!url){panel.hidden=false;setPortrait(null);name.textContent=l.narration?s.title[k]:displayName(l.speaker,s,k);line.textContent=l.text[k];if(l.narration)delete panel.dataset.missingPortrait;else panel.dataset.missingPortrait=l.speaker}else{panel.hidden=false;setPortrait(url);delete panel.dataset.missingPortrait;name.textContent=displayName(l.speaker,s,k);line.textContent=l.text[k]}}
 else{panel.hidden=false;const last=choiceVisible?s.lines[Math.max(0,v.cursor-1)]:null,url=last?resolvePortrait(last.speaker,s.id,Math.max(0,v.cursor-1)):null;setPortrait(url);delete panel.dataset.missingPortrait;name.textContent=choiceVisible?(k==="zh"?"你的选择":"Your choice"):s.title[k];line.textContent=choiceVisible?s.title[k]:w.wait}
 for(const id of ["next","skip","auto"])buttons[id].hidden=!!choiceVisible;speedSelect.hidden=!!choiceVisible;
 buttons.next.disabled=!l||!!choiceVisible;buttons.skip.disabled=!l||!!choiceVisible;buttons.auto.disabled=!l||!!choiceVisible;buttons.history.setAttribute("aria-pressed",String(showHistory));
 for(const h of sessionHistory){const p=el("p");p.textContent=(h.narration?s.title[k]:displayName(h.speaker,s,k))+" · "+h.text[k];history.append(p)}
 if(automatic&&l&&!choiceVisible)timer=setTimeout(next,Math.max(850,Math.min(5500,(800+l.text[k].length*48)/speed)));
 if(!l&&!choiceVisible)onAwaitAction?.({reason:"gameplay-or-scene-transition",scene:s.id,objective:v.objective});
 }
 function keyboard(ev){if(disposed||panel.hidden||ev.target?.closest?.("button,select,input,textarea"))return;if(ev.key==="Enter"||ev.key===" "){ev.preventDefault();next()}else if(ev.key==="Escape"){ev.preventDefault();dispose();onClose?.()}}
 function dispose(){if(disposed)return;disposed=true;stop();window.removeEventListener("morrowwish-language-change",render);panel.removeEventListener("keydown",keyboard);panel.remove()}
 panel.tabIndex=0;panel.addEventListener("keydown",keyboard);window.addEventListener("morrowwish-language-change",render);render();if(!disposed&&!panel.hidden)panel.focus();return {render,dispose};
}
