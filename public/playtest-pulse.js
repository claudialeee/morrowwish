/* Single-question, optional after-game feedback for games that don't already ask.
   No sign-in, no text entry and no interruption during gameplay. */
(()=>{'use strict';
 const game=document.body.dataset.game||location.pathname.split('/').filter(Boolean)[0];
 if(!['pawsibly-innocent','flip-dash','parcel-panic','pocket-aquarium'].includes(game))return;
 const isZh=()=>game==='pocket-aquarium'?
  !!document.querySelector('.languages button.active')?.id?.includes('zh'):
  (window.MorrowwishI18n?.get?.()==='zh'||document.documentElement.lang.toLowerCase().startsWith('zh'));
 const tr=(zh,en)=>isZh()?zh:en;
 const key='mw:play-feedback-session:'+game;
 let chosen='';try{chosen=sessionStorage.getItem(key)||''}catch{}
 let card=null,title=null,thanks=null,buttons=[];
 function mount(){
  if(card)return true;
  const target=game==='pawsibly-innocent'?document.querySelector('#overlay .modal'):
   game==='pocket-aquarium'?document.querySelector('#overlay .dialog'):
   document.querySelector('#overlay .overlay-panel');
  if(!target)return false;
  card=document.createElement('div');card.className='mw-quick-feedback';card.hidden=true;
  title=document.createElement('div');title.className='mw-quick-feedback-title';card.append(title);
  const options=document.createElement('div');options.className='mw-quick-feedback-options';card.append(options);
  for(const value of ['fun','confusing','not_fun']){
   const btn=document.createElement('button');btn.type='button';btn.dataset.choice=value;
   btn.addEventListener('click',()=>{
    if(chosen)return;
    chosen=value;try{sessionStorage.setItem(key,value)}catch{}
    window.arcadeMetric?.('play_feedback_'+value,{});
    update();
   });
   buttons.push(btn);options.append(btn);
  }
  thanks=document.createElement('div');thanks.className='mw-quick-feedback-thanks';card.append(thanks);
  target.append(card);
  const style=document.createElement('style');
  style.textContent='.mw-quick-feedback{margin:12px 0 0;padding:10px 8px 2px;border-top:1px solid #dccdc4;text-align:center;font:600 12px/1.4 system-ui,sans-serif;color:inherit}.mw-quick-feedback[hidden]{display:none}.mw-quick-feedback-title{font-weight:850;margin-bottom:7px}.mw-quick-feedback-options{display:flex;justify-content:center;flex-wrap:wrap;gap:6px}.mw-quick-feedback-options button{border:1px solid #dbc7c4;background:#fff8ef;color:#725568;padding:7px 11px;border-radius:999px;font:750 11px system-ui,sans-serif;cursor:pointer}.mw-quick-feedback-options button:hover,.mw-quick-feedback-options button:focus-visible{background:#ffe3d8;border-color:#d3a99b;outline-offset:2px}.mw-quick-feedback-thanks{margin-top:5px;font-size:11px;color:#658e75}@media(max-width:520px){.mw-quick-feedback{padding:8px 3px 0}.mw-quick-feedback-options button{padding:6px 8px;font-size:10px}}';
  document.head.append(style);update();return true;
 }
 function update(){
  if(!card)return;
  title.textContent=tr('这一局玩得怎么样？','How was that round?');
  const labels=[tr('好玩','Fun'),tr('没看懂','Confusing'),tr('不太好玩','Not fun')];
  buttons.forEach((btn,i)=>{btn.textContent=labels[i];btn.hidden=!!chosen});
  title.hidden=!!chosen;thanks.hidden=!chosen;
  thanks.textContent=chosen?tr('谢谢反馈！','Thanks for the feedback!'):'';
 }
 function show(){
  if(chosen)return;
  if(!mount())return;
  card.hidden=false;update();
 }
 const previous=window.arcadeMetric;
 window.arcadeMetric=function(name,data){
  const result=typeof previous==='function'?previous.apply(this,arguments):undefined;
  if(name==='run_end'||name==='game_complete'||name==='game_over'){
   queueMicrotask(show);
  }
  if(name==='run_start'||name==='game_start'){if(card)card.hidden=true}
  return result;
 };
 const refresh=()=>{if(card)update()};
 window.addEventListener('morrowwish-language-change',refresh);
 if(game==='pocket-aquarium')document.querySelectorAll('.languages button').forEach(b=>b.addEventListener('click',()=>setTimeout(refresh,0)));
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();