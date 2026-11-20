// Signature Cat Bond mechanic. Relationships are stored in the existing save.
(function(){
function db(){if(!State.S.duoRelations)State.S.duoRelations={pairs:{},active:[]};return State.S.duoRelations;}
function pair(a,b){if(!a||!b||a.uid===b.uid)return null;const d=db(),k=[a.uid,b.uid].sort().join(':');return d.pairs[k]||(d.pairs[k]={value:0,lastPlay:0});}
function grow(a,b,n){const p=pair(a,b);if(!p)return null;const old=p.value;p.value=Math.min(100,old+Math.max(0,n));if(!db().active.length)db().active=[a.uid,b.uid];return {value:p.value,levelUp:(old<20&&p.value>=20)||(old<60&&p.value>=60)||(old<90&&p.value>=90)};}
function chosen(){const c=State.S.cats,u=db().active;return u.map(id=>c.find(x=>x.uid===id)).filter(Boolean);}
function choose(a,b){if(!pair(a,b))return false;db().active=[a.uid,b.uid];State.save();return true;}
function title(a,b){const es=[Skills.elementOf(a.species),Skills.elementOf(b.species)].sort().join('+');
 const t={'electric+fire':['雷火喵旋风','Thunderfire Pawstorm'],'fire+water':['蒸汽喵喵炮','Steamcloud Cat Cannon'],'fire+grass':['花火猫爪舞','Blossomfire Pawdance'],'grass+water':['春雨绽放','Spring Rain Bloom'],'electric+water':['闪电泡泡雨','Thunder Bubble Rain'],'dark+light':['星月交辉','Moonlight Starburst']}[es]||['双猫星光舞','Twin Star Pawdance'];
 return {name:t[window.MorrowwishI18n?.get?.()==='zh'?0:1],elementPair:es};}
function active(team){const cats=team.map(t=>t.cat||t),sel=chosen();let a,b;
 if(sel.length===2&&sel.every(x=>cats.some(c=>c.uid===x.uid))){[a,b]=sel;}
 if(!a){let best=0;for(let i=0;i<cats.length;i++)for(let j=i+1;j<cats.length;j++){const v=pair(cats[i],cats[j])?.value||0;if(v>best){best=v;a=cats[i];b=cats[j];}}}
 const value=pair(a,b)?.value||0;return value>=20?{a,b,value,tier:value>=90?3:value>=60?2:1,...title(a,b)}:null;
}
function pet(cat){let c=chosen();if(!c.some(x=>x.uid===cat.uid))c=[cat,State.S.cats.find(x=>x.uid!==cat.uid)].filter(Boolean);if(c.length<2)return null;return grow(c[0],c[1],2);}
function play(a,b){const p=pair(a,b);if(!p)return {ok:false,reason:'pair'};
 if(State.S.treats<1)return {ok:false,reason:'treats'};
 if(Date.now()-p.lastPlay<60000)return {ok:false,reason:'cooldown'};
 State.S.treats--;p.lastPlay=Date.now();const v=grow(a,b,13);a.joy=Math.min(100,(a.joy||0)+10);b.joy=Math.min(100,(b.joy||0)+10);State.save();
 window.arcadeMetric?.('bond_duo_play',{value:v.value});return {ok:true,...v};
}
window.CatRelations={db,pair,grow,chosen,choose,title,active,pet,play};
})();