import fs from 'node:fs';
import assert from 'node:assert/strict';

const source=fs.readFileSync('src/worker.js','utf8')
 .replace('import {api} from "./analytics.js";','')
 .replace('export default','const handler =');
const handler=new Function('api',source+';return handler;')(
  ()=>new Response('api stub',{status:200})
);
const assets={fetch:()=>new Response('assets stub',{status:200})};
const base='https://morrowwish.vercel.app';
const providers=['youtube','tiktok','instagram','bluesky','reddit','itch','facebook'];
for(const provider of providers){
  const request=new Request(base+'/go/'+provider);
  const response=await handler.fetch(request,{ASSETS:assets},{});
  assert.equal(response.status,302,provider+' profile HTTP redirect');
  assert.equal(response.headers.get('cache-control'),'no-store, max-age=0');
  const u=new URL(response.headers.get('location'));
  assert.equal(u.origin,base);
  assert.equal(u.pathname,'/');
  assert.equal(u.searchParams.get('utm_source'),provider);
  assert.equal(u.searchParams.get('utm_medium'),'profile');
  assert.equal(u.searchParams.get('utm_campaign'),'studio');
}
for(const provider of providers){
  for(const game of ['cat-bond','tiny-town','pawsibly-innocent','elsewhere','flip-dash','parcel-panic','pocket-aquarium']){
    const res=await handler.fetch(new Request(base+'/go/'+provider+'/'+game),{ASSETS:assets},{});
    assert.equal(res.status,302);
    const u=new URL(res.headers.get('location'));
    assert.equal(u.pathname,'/'+game+'/');
    assert.equal(u.searchParams.get('utm_source'),provider);
    assert.equal(u.searchParams.get('utm_medium'),'post');
    assert.equal(u.searchParams.get('utm_campaign'),game);
  }
}
for(const bad of ['/go/unknown','/go/youtube/not-a-game','/go/youtube/cat-bond/extra']){
  const res=await handler.fetch(new Request(base+bad),{ASSETS:assets},{});
  assert.equal(res.status,404,bad+' must never be an open redirect');
}
const noPost=await handler.fetch(new Request(base+'/go/youtube',{method:'POST'}),{ASSETS:assets},{});
assert.equal(noPost.status,405,'Profile redirect must not accept POST');
const home=await handler.fetch(new Request(base+'/'),{ASSETS:assets},{});
assert.equal(await home.text(),'assets stub','Regular site traffic unchanged');
const telemetry=fs.readFileSync('public/telemetry.js','utf8');
for(const marker of ['utm_source','utm_campaign','morrowwish-session-campaign','sessionStorage.setItem']){
  assert.ok(telemetry.includes(marker),'Existing JS attribution missing: '+marker);
}
console.log('Social short links: 7 profile sources, 49 game-specific links, no open redirects, existing landing attribution verified.');
