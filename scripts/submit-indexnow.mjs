// Submit newly published game URLs to participating IndexNow search engines.
// Google does not support IndexNow; its sitemap is generated separately.
import { publishedGames, INDEXNOW_KEY } from './discovery.mjs';
const host='morrowwish.vercel.app';
const origin='https://'+host;
const keyUrl=origin+'/'+INDEXNOW_KEY+'.txt';
const games=publishedGames();
const urls=[origin+'/',...games.map(g=>g.url)];
let verify;
try {
  verify=await fetch(keyUrl,{signal:AbortSignal.timeout(15000)});
  if(!verify.ok || (await verify.text()).trim()!==INDEXNOW_KEY)
    throw Error('IndexNow key not verifiable on live public domain (HTTP '+verify.status+')');
  const res=await fetch('https://api.indexnow.org/indexnow',{
    method:'POST',headers:{'Content-Type':'application/json; charset=utf-8'},
    body:JSON.stringify({host,key:INDEXNOW_KEY,keyLocation:keyUrl,urlList:urls}),
    signal:AbortSignal.timeout(20000)
  });
  if(!res.ok) throw Error('IndexNow returned HTTP '+res.status+': '+(await res.text()).slice(0,400));
  console.log('IndexNow accepted URL submission ('+res.status+'): '+urls.join(', '));
} catch (e) {
  console.error('IndexNow notification not confirmed:',e?.message||String(e));
  process.exitCode=1;
}
