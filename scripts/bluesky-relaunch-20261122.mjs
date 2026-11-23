// Owner-approved one-time V14 Bluesky video relaunch, 2026-11-22 PST.
// Each post has a real MP4 embed, UTF-8 link + hashtag facets, and live verification.
// No third-party posting quota, no secrets in source, and duplicate-safe.
const base = 'https://morrowwish.vercel.app';
const api = 'https://bsky.social/xrpc/';
const handle = process.env.MORROW_BLUESKY_HANDLE || 'morrowwishgames.bsky.social';
const password = process.env.MORROW_BLUESKY_APP_PASSWORD;
const expectedDid = 'did:plc:d55banmfpsnzmt35hqmmwha7';
const sleep = ms => new Promise(ok => setTimeout(ok, ms));
if (!handle || !password) throw Error('BLUESKY_CREDENTIALS_MISSING: configure GitHub Actions MORROW_BLUESKY_HANDLE and MORROW_BLUESKY_APP_PASSWORD; no posts sent');
if (!/^(?:@?morrowwishgames(?:\.bsky\.social)?)$/i.test(handle)) throw Error('Wrong Bluesky account; no posts sent');
const games = [
  {
    slug:'pocket-aquarium', video:'/promo/pocket-aquarium/trailer-v7-20261121.mp4',
    text:'Looks peaceful... until the timer starts! 🐠\n\nFeed your fish, build combos, and beat the clock. How high can you score?\n\nPlay free: '+base+'/pocket-aquarium/\n\n@indiedevbot.bsky.social @newindiedevbot.bsky.social\n\n#IndieGame #IndieDev #GameDev #BrowserGame'
  },
  {
    slug:'parcel-panic', video:'/promo/parcel-panic/trailer-challenge-20261122.mp4',
    text:'Looks easy? 📦 Wait until the express orders hit!\n\nOne mistake could end your shift. Can you keep up?\n\nPlay free: '+base+'/parcel-panic/\n\n@indiedevbot.bsky.social @newindiedevbot.bsky.social\n\n#IndieGame #IndieDev #GameDev #BrowserGame'
  },
  {
    slug:'flip-dash',video:'/promo/flip-dash/trailer-v7-20261121.mp4',
    text:'ONE wrong flip. Game over. ⚡\n\nFlip gravity, dodge obstacles, and push your reflexes to the limit. Can you beat my run?\n\nPlay free: '+base+'/flip-dash/\n\n@indiedevbot.bsky.social @newindiedevbot.bsky.social\n\n#IndieGame #IndieDev #GameDev #BrowserGame'
  },
  {
    slug:'elsewhere',video:'/promo/elsewhere/trailer-v7-20261121.mp4',
    text:'What if you could live a completely different life? 🌙\n\nParis, Tokyo, or even a hotel on the moon. Every choice changes your story.\n\nPlay free: '+base+'/elsewhere/\n\n@indiedevbot.bsky.social @newindiedevbot.bsky.social\n\n#IndieGame #IndieDev #GameDev #BrowserGame'
  },
  {
    slug:'tiny-town',video:'/promo/tiny-town/trailer-v7-20261121.mp4',
    text:'No jobs. Just dreams. 🌸\n\nSeven days to build a little town, meet five neighbors, and make their wishes come true.\n\nPlay free: '+base+'/tiny-town/\n\n@indiedevbot.bsky.social @newindiedevbot.bsky.social\n\n#IndieGame #IndieDev #GameDev #BrowserGame'
  },
  {
    slug:'pawsibly-innocent',video:'/promo/pawsibly-innocent/trailer-v12-20261121.mp4',
    text:'Three fish. One sneaky cat. Zero evidence. 🐈\n\nDistract the human, steal the fish, and escape before you\'re caught!\n\nPlay free: '+base+'/pawsibly-innocent/\n\n@indiedevbot.bsky.social @newindiedevbot.bsky.social\n\n#IndieGame #IndieDev #GameDev #BrowserGame'
  },
  {
    slug:'cat-bond',video:'/promo/cat-bond/trailer-v13-20261122.mp4',
    text:'WAIT... TWO CATS CAN UNLEASH A LEGENDARY COMBO?! 🐱⚡\n\nBuild your dream cat team, unlock duo attacks, and collect rare cats!\n\nPlay free: '+base+'/cat-bond/\n\n@indiedevbot.bsky.social @newindiedevbot.bsky.social\n\n#IndieGame #IndieDev #GameDev #BrowserGame'
  }
];
// Preserve the approved 19:00 release time, or begin at the next safe slot if setup is late.
const releaseStart = Date.now() + 30000; // resume remaining posts only, preserving five-minute gaps
for (const [i,g] of games.entries()) {
  if ([...g.text].length > 300) throw Error('Bluesky 300-char limit exceeded for '+g.slug);
  if (g.text.includes('hook-v3')) throw Error('Wrong media for '+g.slug);
}
async function json(url, opts={}) {
  const res=await fetch(url,{signal:AbortSignal.timeout(45000),...opts});
  const body=await res.json().catch(()=>({}));
  if(!res.ok)throw Error('Bluesky '+res.status+': '+JSON.stringify(body).slice(0,900));
  return body;
}
function facets(text) {
  const spans = [];
  const re=/https:\/\/[^\s]+|@[A-Za-z0-9_.-]+|#[A-Za-z][A-Za-z0-9]*/g;
  for (const match of text.matchAll(re)) {
    const token=match[0], index=match.index;
    const byteStart=Buffer.byteLength(text.slice(0,index),'utf8');
    const byteEnd=byteStart+Buffer.byteLength(token,'utf8');
    const mentionDids={'@indiedevbot.bsky.social':'did:plc:mxpuaozhcvmu2fazmn2lyjnj','@newindiedevbot.bsky.social':'did:plc:nptvomhr2s2m7fduabripuyj'};
    const feature=token.startsWith('#')
      ? {$type:'app.bsky.richtext.facet#tag',tag:token.slice(1)}
      : token.startsWith('@')
        ? {$type:'app.bsky.richtext.facet#mention',did:mentionDids[token]}
        : {$type:'app.bsky.richtext.facet#link',uri:token};
    if(token.startsWith('@')&&!feature.did)throw Error('Unknown bot handle: '+token);
    spans.push({index:{byteStart,byteEnd},features:[feature]});
  }
  if(spans.filter(x=>x.features[0].$type.endsWith('#link')).length!==1)throw Error('Expected one clickable game link');
  if(spans.filter(x=>x.features[0].$type.endsWith('#tag')).length!==4)throw Error('Expected four discoverable hashtags');
  if(spans.filter(x=>x.features[0].$type.endsWith('#mention')).length!==2)throw Error('Expected two true bot mentions');
  return spans;
}
const session=await json(api+'com.atproto.server.createSession',{
  method:'POST',headers:{'content-type':'application/json'},
  body:JSON.stringify({identifier:handle,password})
});
if(session.did!==expectedDid)throw Error('BLUESKY_DID_MISMATCH: refuse to post to unexpected account');
const auth={'Authorization':'Bearer '+session.accessJwt,'content-type':'application/json'};
const pdsEndpoint=session.didDoc?.service?.find(x=>x.id?.endsWith('#atproto_pds'))?.serviceEndpoint;
if(!pdsEndpoint)throw Error('Bluesky session didDoc missing atproto PDS endpoint');
const serviceAud='did:web:'+new URL(pdsEndpoint).host;
const existing=await json(api+'com.atproto.repo.listRecords?'+new URLSearchParams({repo:session.did,collection:'app.bsky.feed.post',limit:'100'}),{headers:{Authorization:auth.Authorization}});
// Resume safely after canceling the earlier workflow: deduplicate by game and published video,
// not exact post text (new copy includes two explicit bot mentions).
const previous=new Map();
for(const item of existing.records||[]){
  for(const g of games){
    if(item.value?.text?.includes('Play free: '+base+'/'+g.slug+'/') && item.value?.embed?.$type==='app.bsky.embed.video'){
      previous.set(g.slug,item.uri);
    }
  }
}
const remaining=games.filter(g=>!previous.has(g.slug));
console.log('Existing verified video games '+JSON.stringify([...previous.keys()]));
console.log('Owner-approved V14 campaign; account DID verified; seven 5-minute slots, Cat Bond last');
const live=[];
let lastPublishedAt = 0;
for(let i=0;i<remaining.length;i++){
  const g=remaining[i], start=releaseStart+i*5*60000;
  const gap=Math.max(start,lastPublishedAt+5*60000)-Date.now();
  if(gap>0){console.log('Waiting for '+g.slug+' slot');await sleep(gap);}
  const url=base+g.video;
  const res=await fetch(url,{signal:AbortSignal.timeout(120000)});
  if(!res.ok)throw Error('Failed to fetch V14 source MP4 '+g.slug+' '+res.status);
  const bytes=Buffer.from(await res.arrayBuffer());
  if(bytes.length===0||bytes.length>50000000)throw Error('Invalid or too large source MP4 for '+g.slug);
  const svc=await json(api+'com.atproto.server.getServiceAuth?'+new URLSearchParams({
    aud:serviceAud,lxm:'com.atproto.repo.uploadBlob',exp:String(Math.floor(Date.now()/1000)+1800)
  }),{headers:{Authorization:auth.Authorization}});
  const uploadUrl='https://video.bsky.app/xrpc/app.bsky.video.uploadVideo?'+new URLSearchParams({did:session.did,name:g.video.split('/').at(-1)});
  const upload=await json(uploadUrl,{method:'POST',
    headers:{'Authorization':'Bearer '+svc.token,'Content-Type':'video/mp4'},
    body:bytes,signal:AbortSignal.timeout(180000)});
  let blob=upload.blob||upload.jobStatus?.blob, jobId=upload.jobId||upload.jobStatus?.jobId;
  for(let tries=0;!blob&&tries<150;tries++){
    await sleep(1500);
    const status=await json('https://video.bsky.app/xrpc/app.bsky.video.getJobStatus?'+new URLSearchParams({jobId}),{});
    const job=status.jobStatus||status;
    blob=job.blob;
    if(job.state==='JOB_STATE_FAILED')throw Error('Bluesky transcode failed for '+g.slug+': '+JSON.stringify(job).slice(0,300));
  }
  if(!blob)throw Error('Bluesky video not processed: '+g.slug);
  const record={$type:'app.bsky.feed.post',text:g.text,createdAt:new Date().toISOString(),langs:['en'],
    facets:facets(g.text),
    embed:{$type:'app.bsky.embed.video',video:blob,aspectRatio:{width:9,height:16},alt:'Real gameplay trailer for '+g.slug}};
  const created=await json(api+'com.atproto.repo.createRecord',{method:'POST',headers:auth,
    body:JSON.stringify({repo:session.did,collection:'app.bsky.feed.post',record})});
  const rkey=created.uri.split('/').at(-1),page='https://bsky.app/profile/'+session.did+'/post/'+rkey;
  lastPublishedAt = Date.now();
  console.log('POSTED '+g.slug+' '+page);
  let verified=false;
  for(let tries=0;tries<8&&!verified;tries++){
    await sleep(2500);
    try{
      const thread=await json('https://public.api.bsky.app/xrpc/app.bsky.feed.getPostThread?'+new URLSearchParams({uri:created.uri,depth:'0'}),{});
      const found=thread.thread?.post?.record;
      verified=found?.text===g.text && found?.facets?.some(f=>f.features?.some(x=>x.$type==='app.bsky.richtext.facet#link' && x.uri===base+'/'+g.slug+'/')) && found?.facets?.filter(f=>f.features?.some(x=>x.$type==='app.bsky.richtext.facet#mention')).length===2 && found?.embed?.$type==='app.bsky.embed.video';
    }catch(e){console.log('Visibility check pending for '+g.slug);}
  }
  if(!verified)throw Error('Posted but PUBLIC_FACET_OR_VIDEO_UNVERIFIED '+page);
  console.log('PUBLIC_VERIFIED '+g.slug+' '+page);
  live.push({game:g.slug,url:page,uri:created.uri});
}
for(const p of live) {
  try{
    const r=await json('https://public.api.bsky.app/xrpc/app.bsky.feed.getRepostedBy?'+new URLSearchParams({uri:p.uri,limit:'100'}),{});
    console.log('REPOSTS '+p.game+' '+JSON.stringify((r.repostedBy||[]).map(a=>({did:a.did,handle:a.handle}))));
  }catch(e){console.log('Repost check unavailable: '+p.game+' '+String(e.message).slice(0,200));}
}
console.log('BLUESKY_RELAUNCH_FINISHED '+JSON.stringify(live));
