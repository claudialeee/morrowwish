import fs from 'node:fs';
const text='Our CEO hard at work.\n\nMaking sure our cat games meet the highest feline standards.\n\nSalary: treats.\nManagement style: micromanagement.\n\nhttps://morrowwish.vercel.app/\n\n@indiedevbot.bsky.social @newindiedevbot.bsky.social\n\n#IndieDev #IndieGame #GameDev #CatCEO #MorrowWish';
const did='did:plc:d55banmfpsnzmt35hqmmwha7';
const api='https://bsky.social/xrpc/';
async function req(url,opts){const r=await fetch(url,{...opts,signal:AbortSignal.timeout(20000)}); if(!r.ok)throw Error('HTTP '+r.status+' '+(await r.json().catch(()=>({}))).error);return r.json();}
const session=await req(api+'com.atproto.server.createSession',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({identifier:process.env.MORROW_BLUESKY_HANDLE,password:process.env.MORROW_BLUESKY_APP_PASSWORD})});
if(session.did!==did)throw Error('Wrong account');
const auth={Authorization:'Bearer '+session.accessJwt};
const feed=await req('https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor='+encodeURIComponent(did)+'&limit=50');
const previous=feed.feed.find(x=>x.post.record.text===text);
if(previous){console.log('Already published '+previous.post.uri);process.exit(0);}
const mentions={'@indiedevbot.bsky.social':'did:plc:mxpuaozhcvmu2fazmn2lyjnj','@newindiedevbot.bsky.social':'did:plc:nptvomhr2s2m7fduabripuyj'};
const facets=[...text.matchAll(/https:\/\/[^\s]+|@[a-z0-9.]+|#[A-Za-z0-9]+/g)].map(m=>({index:{byteStart:Buffer.byteLength(text.slice(0,m.index)),byteEnd:Buffer.byteLength(text.slice(0,m.index+m[0].length))},features:[m[0].startsWith('https://')?{$type:'app.bsky.richtext.facet#link',uri:m[0]}:m[0].startsWith('@')?{$type:'app.bsky.richtext.facet#mention',did:mentions[m[0]]}:{$type:'app.bsky.richtext.facet#tag',tag:m[0].slice(1)}]}));
if([...text].length>300||facets.length!==8)throw Error('Caption validation failed '+facets.length);
const image=fs.readFileSync('promotion/ceo-20261126.jpg');if(image.length>1000000)throw Error('Image too large');
const {blob}=await req(api+'com.atproto.repo.uploadBlob',{method:'POST',headers:{...auth,'Content-Type':'image/jpeg'},body:image});
const record={$type:'app.bsky.feed.post',text,createdAt:new Date().toISOString(),facets,langs:['en'],embed:{$type:'app.bsky.embed.images',images:[{alt:'Gray tabby cat sitting beside a laptop on a beige sofa, with its screen blurred for privacy.',image:blob,aspectRatio:{width:1080,height:766}}]}};
const created=await req(api+'com.atproto.repo.createRecord',{method:'POST',headers:{...auth,'Content-Type':'application/json'},body:JSON.stringify({repo:did,collection:'app.bsky.feed.post',record})});
const rkey=created.uri.split('/').pop();
const verified=await req(api+'com.atproto.repo.getRecord?repo='+encodeURIComponent(did)+'&collection=app.bsky.feed.post&rkey='+rkey);
if(verified.value?.text!==text||verified.value?.embed?.$type!=='app.bsky.embed.images'||JSON.stringify(verified.value.facets)!==JSON.stringify(facets)) { if(!verified.value?.facets?.some(f=>f.features.some(x=>x.$type==='app.bsky.richtext.facet#link'&&x.uri==='https://morrowwish.vercel.app/')))throw Error('Link not verified');}
console.log('VERIFIED https://bsky.app/profile/morrowwishgames.bsky.social/post/'+rkey);
