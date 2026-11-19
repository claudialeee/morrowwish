/* Local-only mini-game records and achievement badges. No login required. */
(()=>{'use strict';
const id=document.body.dataset.game;
const rules={
'flip-dash':[['first','First Flip','初次翻转','runs',1],['15','15 Seconds','坚持 15 秒','duration',15],['30','Gravity Rider','重力骑士','duration',30],['60','Gravity Master','重力大师','duration',60]],
'parcel-panic':[['first','First Delivery','首次配送','runs',1],['5','Parcel Rookie','配送新手','delivered',5],['15','Sorting Pro','分拣达人','delivered',15],['30','Dock Legend','码头传奇','delivered',30]],
'pocket-aquarium':[['first','First Feeding','初次喂鱼','runs',1],['5','Fish Friend','鱼儿之友','fed',5],['15','Aquarium Keeper','水族馆达人','fed',15],['A','Ocean Expert','海洋专家','grade',2]]
};
const badges=rules[id];if(!badges)return;
const key='mw:mini-achievements-v1:'+id,priorKey=id==='pocket-aquarium'?'mw:pocket-aquarium:best-v2':'arcade-high-'+id;
let state={runs:0,best:0,duration:0,delivered:0,fed:0,grade:0,unlocked:{}};
try{const previous=JSON.parse(localStorage.getItem(key)||'null');if(previous&&typeof previous==='object')state={...state,...previous,unlocked:previous.unlocked||{}};state.best=Math.max(Number(state.best)||0,Number(localStorage.getItem(priorKey))||0)}catch{}
let card=null,teaser=null,last=null;
const zh=()=>id==='pocket-aquarium'?document.getElementById('zh')?.classList.contains('active'):(window.MorrowwishI18n?.get?.()==='zh'||document.documentElement.lang.toLowerCase().startsWith('zh'));
const tr=(cn,en)=>zh()?cn:en, badgeName=b=>b[zh()?2:1],count=()=>badges.filter(b=>state.unlocked[b[0]]).length;
function goalMessage(){
 const b=badges.find(b=>!state.unlocked[b[0]]);if(!b)return tr('全部徽章已解锁！','All badges unlocked!');
 const need=Math.max(0,b[4]-(Number(state[b[3]])||0));
 if(b[3]==='duration')return tr('再坚持 '+need+' 秒解锁「'+badgeName(b)+'」','Survive '+need+' more seconds to unlock '+badgeName(b));
 if(b[3]==='delivered')return tr('再配送 '+need+' 个包裹解锁「'+badgeName(b)+'」','Deliver '+need+' more parcels to unlock '+badgeName(b));
 if(b[3]==='fed')return tr('再喂食 '+need+' 次解锁「'+badgeName(b)+'」','Feed '+need+' more fish to unlock '+badgeName(b));
 if(b[3]==='grade')return tr('获得 A 或 S 评级解锁「'+badgeName(b)+'」','Earn an A or S grade to unlock '+badgeName(b));
 return tr('完成一局解锁第一枚徽章','Finish a run for your first badge');
}
function mount(){
 if(card)return;
 const parent=id==='pocket-aquarium'?document.querySelector('.dialog'):document.querySelector('.overlay-panel');if(!parent)return;
 card=document.createElement('section');card.className='mw-achievements';card.hidden=true;card.setAttribute('aria-live','polite');
 const play=id==='pocket-aquarium'?document.getElementById('start'):null;if(play)parent.insertBefore(card,play);else parent.append(card);
 teaser=document.createElement('div');teaser.className='mw-ach-teaser';
 (id==='pocket-aquarium'?document.querySelector('.scores'):document.querySelector('.lab-daily'))?.after(teaser);
 const css=document.createElement('style');css.textContent='.mw-achievements[hidden]{display:none}.mw-achievements{border:1px solid #e2d2c3;border-radius:13px;background:#fff9ed;color:#524258;padding:10px;margin:10px auto 0;max-width:410px;text-align:left;font:500 12px/1.4 system-ui,sans-serif}.mw-achievements h3{font-size:15px;margin:0 0 5px;font-weight:900}.mw-ach-record{margin-bottom:6px}.mw-ach-record strong{font-size:18px}.mw-ach-unlock{font-weight:850;color:#9a723c}.mw-ach-grid{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin:8px 0}.mw-ach-grid span{border-radius:8px;background:#f1e5dc;padding:6px;font-size:11px;font-weight:750}.mw-ach-grid .locked{opacity:.47}.mw-ach-next{border-top:1px solid #e1d7d0;padding-top:7px;font-size:11px}.mw-ach-teaser{font:750 11px/1.4 system-ui,sans-serif;text-align:center;padding:6px;color:#77586e}.mw-ach-share{background:#f9d39a;border:0;padding:9px 17px;border-radius:99px;font-weight:850;color:#445651;margin-top:8px;cursor:pointer}.mw-ach-status{font-size:11px;margin-left:7px}.game-overlay.mw-ach-open{overflow-y:auto;align-items:flex-start}.game-overlay.mw-ach-open .overlay-panel{margin:auto}.tank .mw-achievements{color:#245750}.tank .overlay{overflow-y:auto}@media(max-width:650px){.mw-achievements{padding:8px;margin-top:6px}.mw-achievements h3{font-size:13px}.mw-ach-grid span{font-size:10px;padding:5px}.tank .overlay{align-items:start}.tank .dialog{margin:auto}}';document.head.append(css);
 showTeaser();
}
function showTeaser(){if(teaser)teaser.textContent=tr('已解锁 '+count()+'/4 枚徽章 · 成绩保存在本机','Badges '+count()+'/4 · Saved on this device')}
function render(){
 mount();if(!card||!last)return;card.hidden=false;card.replaceChildren();
 const add=(tag,val,cls,parent=card)=>{const el=document.createElement(tag);if(cls)el.className=cls;el.textContent=val;parent.append(el);return el};
 add('h3',(last.record?'★ ':'')+(last.record?tr('新的个人纪录！','New personal best!'):tr('下个纪录等着你','Your next record awaits')));
 const row=add('div',tr('本局 '+last.score+' 分 · 个人最高 ','Run '+last.score+' pts · Personal best '),'mw-ach-record');add('strong',String(state.best),'',row);
 if(last.awards.length)add('div','✦ '+tr('新解锁：','Unlocked: ')+last.awards.map(badgeName).join(' · '),'mw-ach-unlock');
 const grid=add('div','','mw-ach-grid');for(const b of badges)add('span',(state.unlocked[b[0]]?'✓ ':'○ ')+badgeName(b),state.unlocked[b[0]]?'':'locked',grid);
 add('div',goalMessage(),'mw-ach-next');showTeaser();
 if(id==='pocket-aquarium'){
  const socials=add('div','','mw-ach-share-options');
  const url=new URL(location.origin+'/pocket-aquarium/');url.searchParams.set('beat',String(last.score));
  if(zh())url.searchParams.set('lang','zh');
  window.MorrowwishSocialShare?.render(socials,{title:tr('口袋水族箱','Pocket Aquarium'),score:last.score,url:url.toString(),language:zh()?'zh':'en'});
 }
}
function completed(d){
 const score=Math.max(0,Math.floor(Number(d.score)||0)),oldBest=state.best;
 state.runs++;state.best=Math.max(state.best,score);
 for(const key of ['duration','delivered','fed'])state[key]=Math.max(state[key],Number(d[key])||0);
 state.grade=Math.max(state.grade,({S:3,A:2,B:1})[String(d.grade||'').toUpperCase()]||0);
 const awards=[];for(const b of badges)if(!state.unlocked[b[0]]&&(Number(state[b[3]])||0)>=b[4]){state.unlocked[b[0]]=true;awards.push(b)}
 last={score,record:score>oldBest,awards};try{localStorage.setItem(key,JSON.stringify(state))}catch{}
 render();if(id!=='pocket-aquarium')document.getElementById('overlay')?.classList.add('mw-ach-open');
}
const previous=window.arcadeMetric;
window.arcadeMetric=function(name,data){const result=typeof previous==='function'?previous.apply(this,arguments):undefined;
 if((id==='pocket-aquarium'&&name==='game_complete')||(id!=='pocket-aquarium'&&name==='run_end'))completed(data||{});
 if(name==='game_start'||name==='run_start'){if(card)card.hidden=true;document.getElementById('overlay')?.classList.remove('mw-ach-open')}
 return result;
};
const refresh=()=>{if(last)render();else showTeaser()};
window.addEventListener('morrowwish-language-change',refresh);
if(id==='pocket-aquarium')document.querySelectorAll('.languages button').forEach(b=>b.addEventListener('click',()=>setTimeout(refresh,0)));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();