// Fast P1 authored language gate; no browser or assets.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {campaign} from '../public/cat-bond/js/resonance/campaign.mjs';
import {localeLeak} from './cat-bond-locale-purity.mjs';
const issues=[],counts={};
const check=(text,locale,where)=>{
 if(typeof text!=='string'||!text.trim()||localeLeak(text,locale))issues.push(where+' '+locale+': '+JSON.stringify(text));
 counts[locale]=(counts[locale]||0)+1;
};
function walk(value,where){
 if(!value||typeof value!=='object')return;
 if(Object.hasOwn(value,'zh')||Object.hasOwn(value,'en')){
   check(value.zh,'zh',where);check(value.en,'en',where);return;
 }
 for(const [key,child] of Object.entries(value))walk(child,where+'.'+key);
}
const chapters=['prologue','harbor','forest','forge','sky','library','starfall','finale','epilogue'];
for(const chapter of chapters)assert.ok(campaign.scenes.some(s=>s.chapter===chapter),chapter+' has no scenes');
walk(campaign,'campaign');
const dir='public/cat-bond/js/resonance/';
let files=0;
for(const entry of fs.readdirSync(dir).filter(n=>n.endsWith('.mjs'))){
 const content=fs.readFileSync(dir+entry,'utf8');files++;
 // Require a complete literal pair, not two adjacent entries in an indexed array.
 const pattern=/\btr\(\s*(\[)?\s*(["'])((?:\\.|(?!\2)[^\\\n])*)\2\s*,\s*(["'])((?:\\.|(?!\4)[^\\\n])*)\4\s*(\])?\s*\)/g;
 for(const m of content.matchAll(pattern)){
   if(Boolean(m[1])!==Boolean(m[6])||!/[\u3400-\u9fff]/.test(m[3]))continue;
   check(m[3],'zh',entry+':'+content.slice(0,m.index).split('\n').length);
   check(m[5],'en',entry+':'+content.slice(0,m.index).split('\n').length);
 }
}
const context=vm.createContext({window:{addEventListener(){}},document:{readyState:'loading',addEventListener(){},documentElement:{lang:'en'}}});
vm.runInContext(fs.readFileSync('public/cat-bond/js/i18n.js','utf8'),context);
const i18n=context.window.CatBondI18n;
assert.equal(i18n.toChinese('Catdex · 核验回响'),'图鉴 · 核验回响');
assert.equal(i18n.toEnglish('图鉴'),'Catdex');
assert.equal(i18n.toEnglish('关闭'),'Close');
assert.equal(i18n.toEnglish('关闭面板'),'Close panel');
assert.equal(localeLeak('查看 Catdex 记录','zh'),true);
assert.equal(localeLeak('Catdex · 核验回响','en'),true);
assert.equal(localeLeak('Collect cats','zh'),true);
assert.equal(localeLeak('史诗 SR · 15%','zh'),false);
assert.equal(localeLeak('中文','en',true),false);
assert.equal(localeLeak('中文','en'),true);
assert.equal(localeLeak('Switch to Chinese','zh',true),false);
assert.equal(localeLeak('Switch to Chinese','zh'),true);
for(const [zh,en] of Object.entries(i18n.dict))if(/[\u3400-\u9fff]/.test(zh)&&/[\u3400-\u9fff]/.test(en))issues.push('Dictionary English output: '+zh+' -> '+en);
console.log('STAR BELL P1 LOCALE SOURCE',JSON.stringify({chapters,files,counts,issues}));
assert.equal(issues.length,0,'Localization source gate failed:\n'+issues.slice(0,60).join('\n'));
