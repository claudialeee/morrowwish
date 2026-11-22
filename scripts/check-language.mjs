// Independent, zero-dependency language and Cat Bond naming regression checks.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const read=p=>fs.readFileSync(p,'utf8');
const game=read('public/cat-bond/js/data.js');
const context={window:{MorrowwishI18n:{get:()=> 'en'}}};
vm.runInNewContext(game+';window.__species=SPECIES;window.__speciesName=speciesName;',context);
const cats=context.window.__species;
assert.equal(cats.length,32,'Cat Bond must retain all 32 breeds');
for(const [field,locale] of [['name','Chinese'],['nameEn','English']]){
 const values=cats.map(c=>c[field]);
 assert.equal(new Set(values).size,32,locale+' cat names must be unique');
 assert.ok(values.every(n=>n&&n.length<=24),locale+' cat names must be readable');
}
assert.equal(cats.find(s=>s.id==='nainai').name,'雪团','No grandma-named kitten');
assert.equal(cats.find(s=>s.id==='nainai').nameEn,'Snowball');
assert.ok(cats.every(c=>!/[\\u3400-\\u9fff]/.test(c.nameEn)),'All 32 English cat names use English text');
const dictScope={window:{MorrowwishI18n:{get:()=> 'en'},addEventListener(){}},document:{readyState:'loading',addEventListener(){}},console};
vm.runInNewContext(read('public/cat-bond/js/i18n.js'),dictScope);
const i18n=dictScope.window.CatBondI18n;
assert.ok(i18n?.toEnglish,'Cat Bond language display layer must initialize');
for(const cat of cats){
 assert.equal(i18n.toEnglish(cat.name),cat.nameEn,'Breed name mismatch: '+cat.id);
}
const mustTranslate=[
 '猫猫纽带','🧰 已给 2 只猫补血，消耗 1 个急救包。',
 '✨ 新技能 · 工坊赚钱 · 地图探索 ›',
 '🌿 点击发光的草丛，遇见第一位新伙伴！',
 '双猫默契提升！解锁新的合击动作！',
 '猫咪左右摆头，短距离持续扫射火焰，烧灼附近敌人。',
 '古老星盘为它们亮起了两颗星，这次它们的名字并排写在星空里。',
 '🏆 猫猫冒险 · 32 种全部收集 ›',
 '目标锁定','雪团', '奶酥', '奥利奥'
];
for(const source of mustTranslate){
 const output=i18n.toEnglish(source);
 assert.ok(!/[\\u3400-\\u9fff]/.test(output),'English translation leaked Chinese: '+source+' -> '+output);
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
console.log('Language QA: 32 unique bilingual cat names, English-first entry, primary menus/skills/regions localized.');
