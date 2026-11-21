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
// Every possible pairing of the six elements has a specific move and
// combat identity (6 self-pairs + 15 mixed pairs = 21).
// [Chinese name, English name, Chinese effect, English effect, status,
//  team support, damage factor, additional status at trust tier 2+]
const DUO_ARTS={
 'dark+dark':['双影夜巡','Twin Shadow Hunt','撕裂目标，双猫短暂无敌','Bleed enemies; brief evasion for both cats','bleed','evade',1.04,'expose'],
 'dark+elec':['影雷瞬袭','Shadowbolt Pounce','感电敌人，加速积攒必杀','Shock enemies and charge the ultimate','shock','charge',1.04,'expose'],
 'dark+fire':['暗焰猫爪','Midnight Ember Claws','灼烧与破绽，双猫攻击提升','Ignite and expose foes; boost ally damage','burn','boost',1.09,'expose'],
 'dark+grass':['夜藤伏击','Nightvine Ambush','荆棘困敌，双猫伺机闪避','Bind enemies and grant evasive cover','bind','evade',.98,'bleed'],
 'dark+light':['星月交辉','Moonlight Starburst','致盲敌人，星光保护全队','Blind enemies and shield your team','blind','shield',1.02,'weaken'],
 'dark+water':['深海迷雾','Deepwater Mist','迷雾致盲，为队友回复斗志','Blind enemies in mist and restore resolve','blind','heal',.99,'soak'],
 'elec+elec':['双雷连闪','Twin Lightning Dash','连环感电，刷新部分技能冷却','Shock targets and quicken ally skill cooldowns','shock','haste',1.09,'dizzy'],
 'elec+fire':['雷火喵旋风','Thunderfire Pawstorm','雷火连击，灼烧感电并加强进攻','Shock and burn enemies with a fierce combo','shock','boost',1.16,'burn'],
 'elec+grass':['雷芽缠锁','Thunderroot Snare','麻痹束缚敌人，补充必杀能量','Root enemies and recharge the team ultimate','bind','charge',1.02,'shock'],
 'elec+light':['闪光连击','Radiant Spark Rush','炫目闪击，加快全队技能循环','Blind enemies and shorten ally cooldowns','blind','haste',1.04,'shock'],
 'elec+water':['闪电泡泡雨','Thunder Bubble Rain','导电泡泡，感电并保护同伴','Electrified bubbles shock enemies; shield allies','shock','shield',1.02,'soak'],
 'fire+fire':['双焰喵盛典','Twin Ember Festival','烈焰盛开，强化全队攻击','Blazing flames empower allied attacks','burn','boost',1.16,'rust'],
 'fire+grass':['花火猫爪舞','Blossomfire Pawdance','燃烧花瓣，治疗全队','Fire blossoms scorch foes and heal allies','burn','heal',1.00,'bind'],
 'fire+light':['日曜喵闪','Sunflare Pawburst','耀眼烈焰，鼓舞双猫连击','Dazzle foes and empower ally attacks','blind','boost',1.10,'burn'],
 'fire+water':['蒸汽喵喵炮','Steamcloud Cat Cannon','蒸汽爆发、淋湿敌人并护队友','Steam blast soaks enemies and shields allies','soak','shield',1.08,'weaken'],
 'grass+grass':['双叶春醒','Twinleaf Awakening','藤蔓封锁，治愈全队','Entangle enemies and regenerate ally health','bind','regen',.97,'bleed'],
 'grass+light':['晨光花环','Dawnbloom Halo','花环禁锢敌人、治疗同伴','Root enemies and bathe allies in healing light','bind','heal',1.00,'weaken'],
 'grass+water':['春雨绽放','Spring Rain Bloom','春雨冰封敌人，为全队疗伤','Freeze enemies and heal every allied cat','chill','heal',.99,'soak'],
 'light+light':['双星祝福','Twin Starlight Blessing','群星致盲，给予短暂完全格挡','Blind enemies and give allies a guarded moment','blind','protect',.98,'weaken'],
 'light+water':['月湖屏障','Moonlit Lake Ward','月光浸润敌人，为队友建立护盾','Soak enemies in moonlight and shield allies','soak','shield',.99,'chill'],
 'water+water':['双潮回响','Twin Tidal Echo','层层冰潮禁锢敌人，唤醒生命','Chill enemies with two tides and heal allies','chill','regen',.97,'soak']
};
function title(a,b){
 const es=[Skills.elementOf(a.species),Skills.elementOf(b.species)].sort().join('+');
 const art=DUO_ARTS[es];
 const en=window.MorrowwishI18n?.get?.()!=='zh';
 if(!art)return {name:en?'Twin Star Pawdance':'双猫星光舞',elementPair:es,
   description:en?'Twin cats attack together.':'双猫携手出击。',
   effect:{status:'expose',support:'shield',mult:1,secondStatus:'weaken'}};
 return {name:art[en?1:0],description:art[en?3:2],elementPair:es,
   effect:{status:art[4],support:art[5],mult:art[6],secondStatus:art[7]}};
}
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
window.CatRelations={db,pair,grow,chosen,choose,title,secretStory,active,pet,play,personality,mood,moodLabel,soothe,DUO_ARTS};
})();