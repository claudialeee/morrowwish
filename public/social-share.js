/* Morrow Wish — direct, no-account social challenge sharing. */
(()=>{'use strict';
const platforms=[
 {id:'x',name:'X'},
 {id:'facebook',name:'Facebook'},
 {id:'reddit',name:'Reddit'},
 {id:'whatsapp',name:'WhatsApp'},
 {id:'bluesky',name:'Bluesky'},
 {id:'telegram',name:'Telegram'}
];
let activeModal=null,previousFocus=null;
const zh=opts=>opts.language==='zh'||opts.language==='zh-CN';
// Story/strategy games provide their own truthful, localized invitation;
 // score-based arcade games retain their existing personalized challenge text.
const text=(opts,lang=zh(opts))=>opts.message||(
 lang?'我在 '+opts.title+' 拿了 '+opts.score+' 分！你能打破我的纪录吗？'
 :'I scored '+opts.score+' in '+opts.title+'. Can you beat me?');
function shareLink(raw,platform){
 const url=new URL(raw,location.href);url.searchParams.set('share_v','20261120');url.searchParams.set('utm_source',platform);
 url.searchParams.set('utm_medium','player_share');return url.toString();
}
function destination(id,opts){
 const link=shareLink(opts.url,id),caption=text(opts),whole=caption+'\n'+link;
 switch(id){
 case 'x':return 'https://twitter.com/intent/tweet?text='+encodeURIComponent(caption)+'&url='+encodeURIComponent(link);
 case 'facebook':return 'https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(link);
 case 'reddit':return 'https://www.reddit.com/submit?url='+encodeURIComponent(link)+'&title='+encodeURIComponent(caption);
 case 'whatsapp':return 'https://api.whatsapp.com/send?text='+encodeURIComponent(whole);
 case 'bluesky':return 'https://bsky.app/intent/compose?text='+encodeURIComponent(whole);
 case 'telegram':return 'https://t.me/share/url?url='+encodeURIComponent(link)+'&text='+encodeURIComponent(caption);
 default:return link;
 }
}
function metric(platform,opts){
 window.arcadeMetric?.('share_click',{platform,score:opts.score||0,...opts.meta});
 try{opts.onShare?.(platform)}catch{}
}
function copyFallback(message){
 const input=document.createElement('textarea');input.value=message;input.setAttribute('readonly','');input.style.position='fixed';input.style.opacity='0';document.body.append(input);
 input.select();let ok=false;try{ok=document.execCommand('copy')}catch{}input.remove();return ok;
}
function render(holder,raw){
 if(!holder)return;
 const opts={
 title:String(raw.title||document.title),
 score:Math.max(0,Math.floor(Number(raw.score)||0)),
 url:String(raw.url||location.href),language:raw.language||'en',
 message:typeof raw.message==='string'?raw.message.trim().slice(0,360):'',
 meta:raw.meta&&typeof raw.meta==='object'?raw.meta:{},
 onShare:typeof raw.onShare==='function'?raw.onShare:null
};
 holder.replaceChildren();holder.classList.add('mw-social-share');
 const label=document.createElement('p');label.className='mw-social-heading';label.textContent=opts.message
 ?(zh(opts)?'分享给朋友 · 选择平台':'Share your story · Choose a platform')
 :(zh(opts)?'挑战朋友 · 分享到':'Challenge a friend · Share to');holder.append(label);
 const links=document.createElement('div');links.className='mw-social-grid';holder.append(links);
 for(const platform of platforms){
  const a=document.createElement('a');a.textContent=platform.name;a.className='mw-social-platform mw-social-'+platform.id;
  a.href=destination(platform.id,opts);a.target='_blank';a.rel='noopener noreferrer';a.title=zh(opts)?'分享到 '+platform.name:'Share on '+platform.name;
  a.addEventListener('click',()=>metric(platform.id,opts));links.append(a);
 }
 const copy=document.createElement('button');copy.type='button';copy.className='mw-social-platform mw-social-copy';copy.textContent=zh(opts)?'复制分享链接':'Copy share link';links.append(copy);
 const status=document.createElement('div');status.className='mw-social-status';status.setAttribute('role','status');holder.append(status);
 copy.onclick=async()=>{
  const url=shareLink(opts.url,'copy'),message=text(opts)+'\n'+url;
  let ok=false;try{await navigator.clipboard.writeText(message);ok=true}catch{ok=copyFallback(message)}
  if(ok){metric('copy',opts);status.textContent=zh(opts)?'分享内容已复制，可粘贴给朋友':'Copied! Paste it to a friend.';}
  else status.textContent=zh(opts)?'复制未成功，请使用下方地址':'Copy failed. Use this link: '+url;
  if(!ok){const link=document.createElement('a');link.href=url;link.textContent=url;link.rel='noopener';status.append(' ',link);}
 };
 if(typeof navigator.share==='function'){
  const more=document.createElement('button');more.type='button';more.className='mw-social-platform mw-social-more';more.textContent=zh(opts)?'更多应用…':'More apps…';links.append(more);
  more.onclick=async()=>{try{await navigator.share({title:opts.title,text:text(opts),url:shareLink(opts.url,'native')});metric('native',opts);status.textContent='';}
    catch(err){if(err?.name!=='AbortError')status.textContent=zh(opts)?'无法打开系统分享，请选择上方平台。':'Cannot open system share; choose a platform above.';}};
 }
}
function dismiss(){
 if(!activeModal)return;
 const overlay=activeModal;activeModal=null;overlay.remove();document.removeEventListener('keydown',onKey);
 if(previousFocus?.isConnected)previousFocus.focus();previousFocus=null;
}
function onKey(event){if(event.key==='Escape')dismiss();}
function open(raw){
 dismiss();previousFocus=document.activeElement;
 const overlay=document.createElement('div');overlay.className='mw-social-modal';overlay.setAttribute('role','presentation');
 const card=document.createElement('div');card.className='mw-social-dialog';card.setAttribute('role','dialog');card.setAttribute('aria-modal','true');card.setAttribute('aria-label',zh(raw)?'分享游戏':'Share game');
 const close=document.createElement('button');close.type='button';close.className='mw-social-close';close.textContent='×';close.setAttribute('aria-label',raw.language==='zh'?'关闭':'Close');
 close.onclick=dismiss;card.append(close);const inner=document.createElement('div');card.append(inner);
 overlay.append(card);overlay.addEventListener('pointerdown',e=>{if(e.target===overlay)dismiss()});
 document.body.append(overlay);activeModal=overlay;document.addEventListener('keydown',onKey);
 render(inner,raw);close.focus();
}
const css=document.createElement('style');
css.textContent='.mw-social-share{margin:12px auto 0;max-width:410px;text-align:center}.mw-social-heading{font:850 12px/1.4 system-ui,sans-serif;color:#795d77;margin:0 0 8px}.mw-social-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.mw-social-platform{display:flex;align-items:center;justify-content:center;min-height:38px;padding:7px 6px;border:1px solid #ddcbd9;border-radius:10px;background:#fff9ef;color:#59445b;font:750 11px/1.2 system-ui,sans-serif;text-align:center;text-decoration:none;cursor:pointer}.mw-social-platform:hover,.mw-social-platform:focus-visible{background:#f4e7f2;outline-offset:2px}.mw-social-x{background:#eae8ed}.mw-social-facebook{background:#e6efff;color:#335c9b}.mw-social-reddit{background:#fff1e8;color:#b45020}.mw-social-whatsapp{background:#e7f8e8;color:#277347}.mw-social-bluesky{background:#e7f2fe;color:#3376b8}.mw-social-telegram{background:#e7f6fc;color:#2982a4}.mw-social-copy{background:#fce8c4}.mw-social-status{font:650 11px/1.4 system-ui,sans-serif;color:#527667;overflow-wrap:anywhere;margin-top:7px}.mw-social-modal{position:fixed;inset:0;z-index:20000;display:grid;place-items:center;overflow:auto;padding:20px;background:#352a45ba;backdrop-filter:blur(5px)}.mw-social-dialog{position:relative;width:min(100%,440px);border-radius:21px;border:1px solid #eddccf;background:#fffaf1;box-shadow:0 30px 80px #39263c55;padding:27px 20px 19px}.mw-social-close{position:absolute;right:9px;top:8px;border:0;background:none;color:#73536a;font-size:26px;cursor:pointer;width:36px;height:36px}.mw-social-dialog .mw-social-heading{font-size:16px}.mw-social-dialog .mw-social-share{margin-top:8px}.mw-social-dialog .mw-social-platform{font-size:12px;min-height:45px}@media(max-width:650px){.mw-social-grid{gap:5px}.mw-social-platform{min-height:35px;font-size:10px;padding:6px 3px}.mw-social-dialog{padding:23px 15px 16px}}';
document.head.append(css);
window.MorrowwishSocialShare={render,open,destination};
})();