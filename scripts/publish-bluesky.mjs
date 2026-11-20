// Publish a new-game announcement only when a Morrow Wish studio Bluesky
// identity has been explicitly configured in GitHub Actions secrets.
// No user accounts or passwords are committed to Git.
import fs from 'node:fs';
if(process.env.MORROW_BLUESKY_PROMO_ENABLED!=='true'){
 console.log('Bluesky promotion paused by channel policy; no new automated posts.');
 process.exit(0);
}
const {newGames=[]}=JSON.parse(fs.readFileSync('release-kit/new-launches.json','utf8'));
if(!newGames.length){ console.log('No newly launched games to announce.'); process.exit(0); }
const identifier=process.env.MORROW_BLUESKY_HANDLE;
const password=process.env.MORROW_BLUESKY_APP_PASSWORD;
if(!identifier||!password){console.log('Studio Bluesky credentials not configured: automatic external posting skipped; release kit is available.');process.exit(0);}
const api='https://bsky.social/xrpc/';
async function request(url,opts={}){
 const r=await fetch(url,{...opts,signal:AbortSignal.timeout(18000)});
 const data=await r.json().catch(()=>({}));
 if(!r.ok)throw Error('Bluesky API '+r.status+': '+(data.message||'Request failed'));
 return data;
}
const session=await request(api+'com.atproto.server.createSession',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({identifier,password})});
const author=encodeURIComponent(session.did);
const feed=await request('https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor='+author+'&limit=100');
const texts=new Set((feed.feed||[]).map(x=>x.post?.record?.text||''));
for(const game of newGames){
 const link=new URL(game.url);
 link.searchParams.set('utm_source','bluesky');link.searchParams.set('utm_medium','social');link.searchParams.set('utm_campaign',game.slug+'-launch');
 const url=link.toString();
 if([...texts].some(t=>t.includes(url))){console.log('Already announced: '+game.slug);continue;}
 const summary=(game.description||'Play free in your browser.').slice(0,115);
 const text='A new Morrow Wish game: '+game.title+'\n'+summary+'\n'+url;
 const byteStart=Buffer.byteLength(text.slice(0,text.lastIndexOf(url)),'utf8');
 const record={$type:'app.bsky.feed.post',text,createdAt:new Date().toISOString(),facets:[{index:{byteStart,byteEnd:byteStart+Buffer.byteLength(url,'utf8')},features:[{$type:'app.bsky.richtext.facet#link',uri:url}]}]};
 const result=await request(api+'com.atproto.repo.createRecord',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.accessJwt},body:JSON.stringify({repo:session.did,collection:'app.bsky.feed.post',record})});
 console.log('Announced '+game.slug+': '+result.uri);
}
