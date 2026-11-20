/* 16 earned badges per live mini-game; stored locally without an account. */
(()=>{'use strict';
const id=document.body.dataset.game;
const B=(id,en,cn,stat,goal,tier=0)=>({id,en,cn,stat,goal,tier});
const rules={
 'flip-dash':[
  B('first','First Flip','初次翻转','runs',1),
  B('5s','Warm Up','热身成功','duration',5),
  B('15','15 Seconds','坚持 15 秒','duration',15),
  B('30','Gravity Rider','重力骑士','duration',30,1),
  B('45s','Air Dancer','空中舞者','duration',45,1),
  B('60','Gravity Master','重力大师','duration',60,2),
  B('90s','Unstoppable','势不可挡','duration',90,2),
  B('dodge5','Quick Reflex','反应迅速','dodges',5),
  B('dodge15','Hazard Hunter','障碍猎手','dodges',15,1),
  B('flip5','Switch Starter','切换新手','flips',5),
  B('flip15','Flip Artist','翻转大师','flips',15,1),
  B('gem3','Star Seeker','追星者','gems',3),
  B('gem10','Star Collector','星星收藏家','gems',10,2),
  B('run5','Comeback Kid','再来一局','runs',5),
  B('run15','Never Give Up','百折不挠','runs',15,1),
  B('score400','Sky High','飞跃巅峰','best',400,2)
 ],
 'parcel-panic':[
  B('first','First Delivery','首次配送','runs',1),
  B('5','Parcel Rookie','配送新手','delivered',5),
  B('15','Sorting Pro','分拣达人','delivered',15),
  B('30','Dock Legend','码头传奇','delivered',30,1),
  B('parcel50','Dispatch Chief','调度主管','delivered',50,1),
  B('parcel75','Warehouse Hero','仓库英雄','delivered',75,2),
  B('streak5','Five in a Row','连续五件','maxStreak',5),
  B('streak10','Perfect Rhythm','分拣节奏','maxStreak',10,1),
  B('streak20','Unbroken Chain','连锁高手','maxStreak',20,2),
  B('clean5','Spotless Start','五件零失误','clean5',1),
  B('clean10','Precision Ten','十件零失误','clean10',1,1),
  B('score300','Fast Hands','闪电快手','best',300),
  B('score800','Express Route','特快专线','best',800,1),
  B('score1600','Sorting Titan','分拣巨匠','best',1600,2),
  B('run5','Shift Regular','常驻值班','runs',5),
  B('run15','Night Shift Legend','夜班传奇','runs',15,1)
 ],
 'pocket-aquarium':[
  B('first','First Feeding','初次喂鱼','runs',1),
  B('5','Fish Friend','鱼儿之友','fed',5),
  B('15','Aquarium Keeper','水族馆达人','fed',15),
  B('feed20','Fish Feast','欢乐开饭','fed',20,1),
  B('feed30','Reef Caretaker','珊瑚礁守护者','fed',30,2),
  B('combo5','Feeding Rhythm','喂食节奏','maxCombo',5),
  B('combo10','Ten in a Row','十连喂食','maxCombo',10,1),
  B('combo15','Perfect Flow','行云流水','maxCombo',15,2),
  B('gradeB','Rising Keeper','进阶饲养员','grade',1),
  B('A','Ocean Expert','海洋专家','grade',2,1),
  B('gradeS','Sea Superstar','海洋之星','grade',3,2),
  B('clear80','Clear Water','清澈水域','clear80',1),
  B('clear95','Crystal Reef','水晶珊瑚礁','clear95',1,2),
  B('score600','Big Splash','水花满分','best',600,2),
  B('festival','Reef Festival','海底庆典','festival',1,1),
  B('run10','Ocean Regular','海洋常客','runs',10,1)
 ]
};
const badges=rules[id];if(!badges)return;
const key='mw:mini-achievements-v1:'+id;
const priorKey=id==='pocket-aquarium'?'mw:pocket-aquarium:best-v2':'arcade-high-'+id;
const fresh=()=>({runs:0,best:0,duration:0,delivered:0,fed:0,grade:0,dodges:0,flips:0,gems:0,maxStreak:0,maxCombo:0,clean5:0,clean10:0,clear80:0,clear95:0,festival:0,unlocked:{}});
let state=fresh(),last=null,card=null,teaser=null,expanded=false;
try{
 const p=JSON.parse(localStorage.getItem(key)||'null');
 if(p&&typeof p==='object')state={...state,...p,unlocked:p.unlocked&&typeof p.unlocked==='object'?p.unlocked:{}};
 state.best=Math.max(Number(state.best)||0,Number(localStorage.getItem(priorKey))||0);
}catch{}
const isZh=()=>id==='pocket-aquarium'?document.getElementById('zh')?.classList.contains('active'):(window.MorrowwishI18n?.get?.()==='zh'||document.documentElement.lang.toLowerCase().startsWith('zh'));
const tr=(cn,en)=>isZh()?cn:en;
const name=b=>isZh()?b.cn:b.en;
const count=()=>badges.filter(b=>state.unlocked[b.id]).length;
const number=v=>Math.max(0,Number(v)||0);
function condition(b){return number(state[b.stat])>=b.goal}
function persist(){try{localStorage.setItem(key,JSON.stringify(state))}catch{}}
function reconcile(){let changed=false;for(const b of badges)if(!state.unlocked[b.id]&&condition(b)){state.unlocked[b.id]=true;changed=true}if(changed)persist()}
reconcile();
function requirement(b){
 const v=number(state[b.stat]),need=Math.max(0,b.goal-v);
 switch(b.stat){
 case 'runs':return tr('完成 '+b.goal+' 局（累计 '+Math.floor(v)+' 局）','Finish '+b.goal+' runs ('+Math.floor(v)+' so far)');
 case 'duration':return tr('单局存活 '+b.goal+' 秒','Survive '+b.goal+' seconds in one run');
 case 'delivered':return tr('单局送达 '+b.goal+' 件包裹','Deliver '+b.goal+' parcels in one run');
 case 'fed':return tr('单局成功喂食 '+b.goal+' 次','Feed '+b.goal+' fish in one run');
 case 'dodges':return tr('单局躲过 '+b.goal+' 个障碍','Dodge '+b.goal+' hazards in one run');
 case 'flips':return tr('单局翻转 '+b.goal+' 次','Flip '+b.goal+' times in one run');
 case 'gems':return tr('单局收集 '+b.goal+' 颗星星','Collect '+b.goal+' stars in one run');
 case 'maxStreak':return tr('单局连续分拣 '+b.goal+' 件','Sort '+b.goal+' parcels without a miss');
 case 'maxCombo':return tr('单局连续喂食 '+b.goal+' 次','Feed '+b.goal+' fish in a row');
 case 'grade':return tr('单局达到 '+(['','B','A','S'][b.goal])+' 评级','Earn grade '+(['','B','A','S'][b.goal])+' in one run');
 case 'clean5':return tr('前 5 件不失误','Sort the first 5 parcels without a miss');
 case 'clean10':return tr('前 10 件不失误','Sort the first 10 parcels without a miss');
 case 'clear80':return tr('喂食至少 10 次，结束时水质 ≥80%','Feed 10+ fish and finish with 80% clarity');
 case 'clear95':return tr('喂食至少 10 次，结束时水质 ≥95%','Feed 10+ fish and finish with 95% clarity');
 case 'festival':return tr('获得海底庆典结局','Reach the Reef Festival ending');
 case 'best':return tr('单局获得 '+b.goal+' 分','Score '+b.goal+' in one run');
 default:return tr('达成挑战','Complete the challenge');
 }
}
function nextBadge(){
 const locked=badges.filter(b=>!state.unlocked[b.id]);
 if(!locked.length)return null;
 return locked.sort((a,b)=>Math.max(0,1-number(state[b.stat])/b.goal)-Math.max(0,1-number(state[a.stat])/a.goal)).at(-1);
}
function textNode(tag,text,cls,parent){
 const el=document.createElement(tag);if(cls)el.className=cls;
 el.textContent=text;parent.append(el);return el;
}
function mount(){
 if(card)return;
 const parent=id==='pocket-aquarium'?document.querySelector('.dialog'):document.querySelector('.overlay-panel');
 if(!parent)return;
 card=document.createElement('section');card.className='mw-achievements';card.hidden=true;card.setAttribute('aria-label',tr('徽章收藏','Achievement collection'));
 const play=id==='pocket-aquarium'?document.getElementById('start'):null;
 if(play)parent.insertBefore(card,play);else parent.append(card);
 teaser=document.createElement('button');teaser.type='button';teaser.className='mw-ach-teaser';
 teaser.title=tr('查看我的徽章','View achievements');
 (id==='pocket-aquarium'?document.querySelector('.scores'):document.querySelector('.lab-daily'))?.after(teaser);
 teaser.addEventListener('click',()=>{
  const overlay=document.getElementById('overlay');
  if(!overlay||overlay.hidden)return;
  expanded=!expanded;render();
 });
 const style=document.createElement('style');style.textContent=
 '.mw-achievements[hidden]{display:none}.mw-achievements{max-width:500px;max-height:52vh;overflow:auto;margin:10px auto 0;padding:12px;border:1px solid #e4d7ca;border-radius:14px;background:#fffcf6;color:#4a4058;text-align:left;font:500 12px/1.45 system-ui,sans-serif}.mw-ach-head{display:flex;align-items:center;justify-content:space-between;gap:8px}.mw-ach-head h3{font:850 15px system-ui,sans-serif;margin:0}.mw-ach-count{font-weight:900;color:#86614c}.mw-ach-track{height:7px;background:#e9deda;border-radius:9px;overflow:hidden;margin:7px 0}.mw-ach-fill{height:100%;background:linear-gradient(90deg,#e0b46c,#f2d59a);border-radius:9px}.mw-ach-meta{font-size:11px;color:#756879;margin:7px 0}.mw-ach-recent{font-weight:850;color:#94611c;margin:8px 0}.mw-ach-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin:8px 0}.mw-ach-badge{display:flex;align-items:center;gap:7px;min-width:0;padding:7px;border:1px solid #decdb7;border-radius:9px;background:#fdf0d9}.mw-ach-badge.locked{background:#f3f0ed;border-color:#e7e0db;color:#948c93}.mw-ach-badge[data-tier="2"]:not(.locked){background:#f9e5ae;border-color:#d9ae59}.mw-ach-icon{flex:none;display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:#d4a65d;color:#fff;font-size:16px;font-weight:900}.locked .mw-ach-icon{background:#d3cdd2;color:#f8f5f5}.mw-ach-name{display:block;font-size:11px;font-weight:850}.mw-ach-requirement{display:block;font-size:10px;line-height:1.3;margin-top:2px}.mw-ach-next{margin-top:5px;font-size:11px;font-weight:650}.mw-ach-toggle,.mw-ach-teaser{background:none;border:0;color:#7b5469;cursor:pointer;text-decoration:underline;font-weight:800}.mw-ach-toggle{padding:5px 0;font-size:11px}.mw-ach-teaser{display:block;margin:3px auto 6px;padding:4px 8px;text-decoration:none;font-size:12px;text-align:center}.game-overlay.mw-ach-open{overflow-y:auto;align-items:flex-start}.game-overlay.mw-ach-open .overlay-panel{margin:auto}.tank .overlay{overflow-y:auto}.tank .mw-achievements{color:#245750}.tank .mw-ach-teaser{color:#347a69}@media(max-width:420px){.mw-achievements{max-height:49vh;padding:8px}.mw-ach-grid{gap:4px}.mw-ach-badge{padding:5px;gap:5px}.mw-ach-icon{width:22px;height:22px;font-size:13px}.mw-ach-name{font-size:10px}.mw-ach-requirement{font-size:9px}}';
 document.head.append(style);
 showTeaser();
}
function showTeaser(){
 if(teaser)teaser.textContent=tr('徽章 '+count()+'/'+badges.length+' · 本机保存 · 查看收藏','Badges '+count()+'/'+badges.length+' · Saved here · View');
}
function render(){
 mount();if(!card)return;
 card.hidden=false;card.replaceChildren();
 const head=textNode('div','','mw-ach-head',card);
 textNode('h3',tr('徽章收藏','Achievement Collection'),'',head);
 textNode('span',count()+' / '+badges.length,'mw-ach-count',head);
 const track=textNode('div','','mw-ach-track',card);
 const bar=textNode('div','','mw-ach-fill',track);bar.style.width=(100*count()/badges.length)+'%';
 if(last){
  textNode('div',tr('本局 '+last.score+' 分 · 个人最佳 '+state.best,'Run '+last.score+' pts · Personal best '+state.best)+(last.record?tr(' · 新纪录',' · New record'):''),
   'mw-ach-meta',card);
  if(last.awards.length)textNode('div',tr('新解锁：','Newly unlocked: ')+last.awards.map(name).join(' · '),'mw-ach-recent',card);
 }else textNode('div',tr('完成挑战解锁徽章，无需注册账号。','Complete challenges to unlock badges. No sign-up needed.'),'mw-ach-meta',card);
 const next=nextBadge();
 if(next)textNode('div',tr('下个目标：','Next target: ')+name(next)+' · '+requirement(next),'mw-ach-next',card);
 else textNode('div',tr('全部徽章已解锁！','Every badge unlocked!'),'mw-ach-next',card);
 const visible=expanded?badges:badges.filter(b=>state.unlocked[b.id]||b===next).slice(0,7);
 // Keep a few attainable goals visible even when nothing is unlocked yet.
 if(!expanded&&visible.length<7)for(const b of badges)if(!visible.includes(b)){visible.push(b);if(visible.length>=7)break}
 const grid=textNode('div','','mw-ach-grid',card);
 for(const b of visible){
  const cell=textNode('div','','mw-ach-badge'+(state.unlocked[b.id]?'':' locked'),grid);
  cell.dataset.tier=String(b.tier);
  textNode('span',state.unlocked[b.id]?'★':'◇','mw-ach-icon',cell);
  const body=textNode('span','','mw-ach-details',cell);
  textNode('span',name(b),'mw-ach-name',body);
  textNode('span',requirement(b),'mw-ach-requirement',body);
 }
 const toggle=textNode('button',expanded?tr('收起徽章','Show fewer'):tr('查看全部 '+badges.length+' 枚徽章','View all '+badges.length+' badges'),'mw-ach-toggle',card);
 toggle.type='button';toggle.addEventListener('click',()=>{expanded=!expanded;render()});
 if(id==='pocket-aquarium'&&last){
  const socials=textNode('div','','mw-ach-share-options',card);
  const url=new URL(location.origin+'/pocket-aquarium/');
  url.searchParams.set('beat',String(last.score));
  if(isZh())url.searchParams.set('lang','zh');
  window.MorrowwishSocialShare?.render(socials,{title:tr('口袋水族馆','Pocket Aquarium'),score:last.score,url:url.toString(),language:isZh()?'zh':'en'});
 }
 showTeaser();
 if(id!=='pocket-aquarium')document.getElementById('overlay')?.classList.add('mw-ach-open');
}
function completed(d){
 const score=Math.floor(number(d.score)),oldBest=number(state.best);
 state.runs++;state.best=Math.max(oldBest,score);
 for(const stat of ['duration','delivered','fed','dodges','flips','gems','maxStreak','maxCombo'])
  state[stat]=Math.max(number(state[stat]),number(d[stat]));
 const grade={S:3,A:2,B:1}[String(d.grade||'').toUpperCase()]||0;
 state.grade=Math.max(number(state.grade),grade);
 if(number(d.clean5)>0)state.clean5=1;
 if(number(d.clean10)>0)state.clean10=1;
 if(number(d.fed)>=10&&number(d.quality)>=80)state.clear80=1;
 if(number(d.fed)>=10&&number(d.quality)>=95)state.clear95=1;
 if(d.ending==='festival')state.festival=1;
 const awards=[];
 for(const b of badges)if(!state.unlocked[b.id]&&condition(b)){state.unlocked[b.id]=true;awards.push(b)}
 last={score,record:score>oldBest,awards};
 persist();render();
}
const previous=window.arcadeMetric;
window.arcadeMetric=function(name,data){
 const result=typeof previous==='function'?previous.apply(this,arguments):undefined;
 if((id==='pocket-aquarium'&&name==='game_complete')||(id!=='pocket-aquarium'&&name==='run_end'))completed(data||{});
 if(name==='game_start'||name==='run_start'){
  last=null;expanded=false;if(card)card.hidden=true;
  document.getElementById('overlay')?.classList.remove('mw-ach-open');
 }
 return result;
};
const refresh=()=>{showTeaser();if(card&&!card.hidden)render()};
window.addEventListener('morrowwish-language-change',refresh);
if(id==='pocket-aquarium')document.querySelectorAll('.languages button').forEach(b=>b.addEventListener('click',()=>setTimeout(refresh,0)));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
