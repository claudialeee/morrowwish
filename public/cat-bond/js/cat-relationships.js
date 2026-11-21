// Signature Cat Bond mechanic. Relationships are stored in the existing save.
(function(){
function db(){if(!State.S.duoRelations)State.S.duoRelations={pairs:{},active:[]};return State.S.duoRelations;}
function pair(a,b){if(!a||!b||a.uid===b.uid)return null;const d=db(),k=[a.uid,b.uid].sort().join(':');return d.pairs[k]||(d.pairs[k]={value:0,lastPlay:0});}
function grow(a,b,n){const p=pair(a,b);if(!p)return null;const old=p.value;p.value=Math.min(100,old+Math.max(0,n));if(!db().active.length)db().active=[a.uid,b.uid];return {value:p.value,levelUp:(old<20&&p.value>=20)||(old<60&&p.value>=60)||(old<90&&p.value>=90)};}
function chosen(){const c=State.S.cats,u=db().active;return u.map(id=>c.find(x=>x.uid===id)).filter(Boolean);}
function choose(a,b){if(!pair(a,b))return false;db().active=[a.uid,b.uid];State.save();return true;}
function personality(cat){
  const en=window.MorrowwishI18n?.get?.()!=='zh';
  if(en)return ({glutton:'Foodie',diligent:'Hardworking',lazy:'Sleepy',clever:'Clever',gentle:'Gentle'}[cat?.personality]||'Curious');
  return window.Raising?.PERSONALITIES?.[cat?.personality]?.name||({
    glutton:'贪吃',diligent:'勤劳',lazy:'慵懒',clever:'机敏',gentle:'温柔'
  }[cat?.personality]||'好奇');
}
function mood(a,b){
  const p=pair(a,b);if(!p)return 'unknown';
  if((p.sulkyUntil||0)>Date.now())return 'sulky';
  if(p.value>=90)return 'inseparable';
  if(p.value>=60)return 'besties';
  return p.value>=20?'friends':'shy';
}
function moodLabel(a,b){
  const en=window.MorrowwishI18n?.get?.()!=='zh';
  const m=mood(a,b);
  return ({
    sulky:en?'Sulking':'闹别扭中',
    inseparable:en?'Inseparable':'形影不离',
    besties:en?'Best friends':'最佳拍档',
    friends:en?'Friends':'成为朋友了',
    shy:en?'Getting acquainted':'慢慢熟悉彼此',
    unknown:en?'Not paired':'未结缘'
  })[m];
}
function soothe(a,b){
  const p=pair(a,b);if(!p||mood(a,b)!=='sulky')return false;
  p.sulkyUntil=0;grow(a,b,6);State.save();
  window.arcadeMetric?.('bond_duo_reconcile',{});
  return true;
}
function title(a,b){const es=[Skills.elementOf(a.species),Skills.elementOf(b.species)].sort().join('+');
 const t={'elec+fire':['雷火喵旋风','Thunderfire Pawstorm'],'fire+water':['蒸汽喵喵炮','Steamcloud Cat Cannon'],'fire+grass':['花火猫爪舞','Blossomfire Pawdance'],'grass+water':['春雨绽放','Spring Rain Bloom'],'elec+water':['闪电泡泡雨','Thunder Bubble Rain'],'dark+light':['星月交辉','Moonlight Starburst']}[es]||['双猫星光舞','Twin Star Pawdance'];
 return {name:t[window.MorrowwishI18n?.get?.()==='zh'?0:1],elementPair:es};}
function secretStory(a,b){
  const k=[Skills.elementOf(a.species),Skills.elementOf(b.species)].sort().join('+');
  const stories={
    'elec+fire':['两只猫在夜里偷偷练习，一声雷鸣后，院子里的萤火虫竟排成了心形。',
      'The cats practice under the stars. Thunder rolls, and fireflies suddenly form a heart.'],
    'fire+water':['一只猫喜欢火光，一只猫喜欢雨滴。它们发现，温柔的蒸汽能画出彩虹。',
      'One loves sparks, the other rain. Together they discover that steam can paint rainbows.'],
    'fire+grass':['原来它们早把秘密花圃照顾好了，只等第一次开出带着暖光的小花。',
      'They have tended a hidden flowerbed together. The first glowing blossom is their secret.'],
    'grass+water':['每当夜雨落下，两只猫就悄悄去浇灌同一株植物。今天它终于开花。',
      'After every rain, these two tend the same little plant. Tonight it finally blooms.'],
    'elec+water':['下雨天，一只猫数水滴，一只猫数闪电；它们有了只有彼此听得懂的暗号。',
      'One counts raindrops and the other lightning. Together they invent a secret language.'],
    'dark+light':['一个守护夜晚，一个追逐晨光。它们约好在日出时分享同一片天空。',
      'One guards the night, one follows dawn. They promise to share the sky at sunrise.']
  };
  const story=stories[k]||['这两只猫有了自己的秘密约定：无论在哪里，都记得回来找彼此。',
    'The two cats make a secret promise: wherever they roam, they will always find each other.'];
  return story[window.MorrowwishI18n?.get?.()==='zh'?0:1];
}
function active(team){const cats=team.map(t=>t.cat||t),sel=chosen();let a,b;
 if(sel.length===2&&sel.every(x=>cats.some(c=>c.uid===x.uid))){[a,b]=sel;}
 if(!a){let best=0;for(let i=0;i<cats.length;i++)for(let j=i+1;j<cats.length;j++){const v=pair(cats[i],cats[j])?.value||0;if(v>best){best=v;a=cats[i];b=cats[j];}}}
 const value=pair(a,b)?.value||0;return value>=20?{a,b,value,tier:value>=90?3:value>=60?2:1,...title(a,b)}:null;
}
function pet(cat){
  let c=chosen();
  if(!c.some(x=>x.uid===cat.uid))c=[cat,State.S.cats.find(x=>x.uid!==cat.uid)].filter(Boolean);
  if(c.length<2)return null;
  const rel=pair(c[0],c[1]),result=grow(c[0],c[1],mood(c[0],c[1])==='sulky'?1:2);
  const count=State.S.petCount||0;
  if(count>=4&&count%9===0&&Date.now()-(rel.lastQuirk||0)>180000&&
    c.some(x=>['glutton','clever','lazy'].includes(x.personality))){
    rel.lastQuirk=Date.now();rel.sulkyUntil=Date.now()+90000;result.quirk='sulky';
    window.arcadeMetric?.('bond_duo_squabble',{});
  }
  return result;
}
function play(a,b){const p=pair(a,b);if(!p)return {ok:false,reason:'pair'};
 if(State.S.treats<1)return {ok:false,reason:'treats'};
 if(Date.now()-p.lastPlay<60000)return {ok:false,reason:'cooldown'};
 State.S.treats--;p.lastPlay=Date.now();p.sulkyUntil=0;const v=grow(a,b,13);a.joy=Math.min(100,(a.joy||0)+10);b.joy=Math.min(100,(b.joy||0)+10);State.save();
 window.arcadeMetric?.('bond_duo_play',{value:v.value});return {ok:true,...v};
}
window.CatRelations={db,pair,grow,chosen,choose,title,secretStory,active,pet,play,personality,mood,moodLabel,soothe};
})();