// Independent, zero-dependency language and Cat Bond naming regression checks.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const read=p=>fs.readFileSync(p,'utf8');
const game=read('public/cat-bond/js/data.js');
const context={window:{MorrowwishI18n:{get:()=> 'en'}}};
vm.runInNewContext(game+';window.__species=SPECIES;window.__speciesName=speciesName;',context);
const cats=context.window.__species;
assert.equal(cats.length,33,'All 33 playable species, including Jiafei, must stay in the catalogue');
const introHtml=read('public/cat-bond/index.html');
const introMain=read('public/cat-bond/js/main.js');
const introCount=Number(introHtml.match(/id="intro-breed-count">🐾 收集 (\d+) 种猫<\/span>/)?.[1]);
assert.equal(introCount,cats.length,'Intro first-paint collection count must match canonical roster');
assert.ok(introMain.includes('window.GameData?.SPECIES?.length') &&
  introMain.includes('introBreedCount.textContent=`🐾 收集 ${totalBreeds} 种猫`'),
  'Intro must derive its displayed count from the live roster, not a hard-coded number');
for(const [field,locale] of [['name','Chinese'],['nameEn','English']]){
 const values=cats.map(c=>c[field]);
 assert.equal(new Set(values).size,cats.length,locale+' cat names must be unique');
 assert.ok(values.every(n=>n&&n.length<=24),locale+' cat names must be readable');
}
assert.equal(cats.find(s=>s.id==='nainai').name,'雪团','No grandma-named kitten');
assert.equal(cats.find(s=>s.id==='nainai').nameEn,'Snowball');
assert.equal(cats.find(s=>s.id==='jiafei').name,'圆宝');
assert.equal(cats.find(s=>s.id==='jiafei').nameEn,'Pudding');
assert.ok(cats.every(c=>!/[\u3400-\u9fff]/.test(c.nameEn)),'All 32 English cat names use English text');
const dictScope={window:{MorrowwishI18n:{get:()=> 'en'},addEventListener(){}},document:{readyState:'loading',addEventListener(){}},console};
vm.runInNewContext(read('public/cat-bond/js/i18n.js'),dictScope);
const i18n=dictScope.window.CatBondI18n;
assert.ok(i18n?.toEnglish,'Cat Bond language display layer must initialize');
for(const count of [cats.length,cats.length+1]){
 assert.equal(i18n.toEnglish(`🐾 收集 ${count} 种猫`),
   `🐾 Collect ${count} cat breeds`,
   'Intro English count must follow the live species count');
}
for(const cat of cats){
 assert.equal(i18n.toEnglish(cat.name),cat.nameEn,'Breed name mismatch: '+cat.id);
}
const mustTranslate=[
 '地图',
 "水枪", "✓ 可建造", "猫猫冒险指引", "已解锁的双猫合击", "派猫咪去工坊", "把猫咪送回庭院", "火山口", "必 杀 技",
 '猫猫纽带','🧰 已给 2 只猫补血，消耗 1 个急救包。',
 '✨ 新技能 · 工坊赚钱 · 地图探索 ›',
 '🌿 点击发光的草丛，遇见第一位新伙伴！',
 '双猫默契提升！解锁新的合击动作！',
 '猫咪左右摆头，短距离持续扫射火焰，烧灼附近敌人。',
 '古老星盘为它们亮起了两颗星，这次它们的名字并排写在星空里。',
 '🏆 猫猫冒险 · '+cats.length+' 种全部收集 ›',
 '目标锁定','雪团', '奶酥', '奥利奥', '圆宝', '加菲',
 // Real DOM gold-coin renderer replaces the emoji with an <img> and splits
 // translation into multiple text nodes, exposing these partial strings.
 '消耗 ', '最多 10 次 · 每次 80', '每次 ', '最多 '
];
for(const [source,value] of Object.entries(i18n.dict)){
 assert.ok(!/[\u3400-\u9fff]/.test(value),'English dictionary contains Chinese: '+source);
}
const coinPricePieces=[
 ['消耗 ','Cost '],
 ['最多 10 次 · 每次 80','Up to 10 times · 80']
];
for(const [zh,en] of coinPricePieces)
 assert.equal(i18n.toEnglish(zh),en,
   'Coin icon splitting must preserve translated words and spaces: '+zh);
for(const phrase of [
 '消耗 2🐠 小鱼干，提升好感和饱食',
 '已解锁 1 种技能 · 点击替换 Q / E / 必杀。每只猫拥有不同的元素技能与解锁路线。'
])assert.ok(!/[\\u3400-\\u9fff]/.test(i18n.toEnglish(phrase)),
  'Dynamic bilingual panel copy must not leak Han characters: '+phrase);
for(const source of mustTranslate){
 const output=i18n.toEnglish(source);
 assert.ok(!/[\u3400-\u9fff]/.test(output),'English translation leaked Chinese: '+source+' -> '+output);
}
const lang=read('public/lang.js');
assert.ok(lang.includes('return "en"; // English for first-time visitors'),'First visit must default to English');
for(const file of ['public/index.html','public/cat-bond/index.html','public/pawsibly-innocent/index.html','public/tiny-town/index.html','public/elsewhere/index.html','public/flip-dash/index.html','public/parcel-panic/index.html','public/pocket-aquarium/index.html']){
 const src=read(file);
 assert.ok(/<html[^>]*lang="en"/.test(src),'Missing English first paint: '+file);
}
assert.ok(read('public/pawsibly-innocent/game.js').includes('morrowwish-language-change'));
assert.ok(read('public/elsewhere/dreams.js').includes('return "en"')); 
assert.ok(read('public/pocket-aquarium/index.html').includes("||'en'"));

// Regression: source strings used by Cat Bond must not retain Chinese when translated.
for(const file of ["public/cat-bond/js/data.js","public/cat-bond/js/ui.js","public/cat-bond/js/game.js","public/cat-bond/js/battle.js","public/cat-bond/js/skills.js","public/cat-bond/js/world.js","public/cat-bond/js/worldmap.js","public/cat-bond/js/raising.js","public/cat-bond/js/duo-bond.js","public/cat-bond/index.html"]){
 const lines=read(file).split('\n');
 for(let line=0;line<lines.length;line++){
  if(/^\s*(\/\/|\/\*|\*|#)/.test(lines[line]))continue;
  for(const m of lines[line].matchAll(/(["'])([^"'\n]{1,210})\1/g)){
   const source=m[2];
   if(!/[\u3400-\u9fff]/.test(source)||source.length>=180)continue;
   assert.ok(!/[\u3400-\u9fff]/.test(i18n.toEnglish(source)),
    'Untranslated Cat Bond string: '+file+':'+(line+1)+' '+source);
  }
 }
}
// Other titles store authored English in en/enDesc/data-en fields.
for(const file of ['public/pawsibly-innocent/game.js','public/tiny-town/game-v4.js',
 'public/tiny-town/index.html','public/elsewhere/dreams.js',
 'public/elsewhere/dream-lives.js','public/elsewhere/casefiles-a.js',
 'public/elsewhere/casefiles-b.js','public/pocket-aquarium/index.html']){
 const source=read(file);
 for(const rx of [/\ben(?:Text|Desc|Sub)?\s*:\s*(["'])([^"'\n]{1,200})\1/g,/\bdata-en\s*=\s*(["'])([^"'<>]{1,200})\1/g]){
  for(const m of source.matchAll(rx))
   assert.ok(!/[\u3400-\u9fff]/.test(m[2]),'Chinese in an English text field: '+file+': '+m[2]);
 }
}
console.log('Language QA: '+cats.length+' unique bilingual cat names, English-first entry, primary menus/skills/regions localized.');
