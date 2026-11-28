#!/usr/bin/env python3
"""Bind real IDs to the final portable archive. Never publishes, never fabricates IDs.
python3 scripts/bind-pawsibly-portable-final.py PATH.zip y8|gd|gamepix
Y8_APP_ID is required, Y8_GAME_ID optional for ads. GD_GAME_ID required.
"""
from pathlib import Path
import argparse, json, os, zipfile, re
p=argparse.ArgumentParser()
p.add_argument('archive',type=Path);p.add_argument('platform',choices=('y8','gd','gamepix'))
a=p.parse_args();name=a.platform
with zipfile.ZipFile(a.archive) as z:data={i.filename:z.read(i) for i in z.infolist() if not i.is_dir()}
assert 'index.html' in data and 'game.js' in data
h=data['index.html'].decode()
if 'portal-sdk.js' in data:raise SystemExit('Bind from the standalone archive, not a previously bound SDK package.')
# Expose the actual pause API. Request ads only on voluntary next-room transitions,
# after every second earned victory and no more than once per 90 seconds.
common=r'''(()=>{"use strict";
let wins=0, busy=false, lastAd=0, started=false, pendingStart=false;
window.__MW_PAUSE_AD__=v=>window.MorrowwishPortalPause?.(Boolean(v));
const oldMetric=window.arcadeMetric;
window.arcadeMetric=(event,p)=>{oldMetric?.(event,p);
 if(event==="game_complete"){wins++;window.GamePix?.happyMoment?.("level_complete")}
 if(event==="game_over")window.GamePix?.sadMoment?.("game_over");
 if(event==="game_start"){started=true;pendingStart=true;window.__MW_REPORT_START__?.()}
};
window.__MW_GAME_STARTED__=()=>started;
window.__MW_CONSUME_START__=()=>{const p=pendingStart;pendingStart=false;return p};
document.addEventListener("DOMContentLoaded",()=>{
 const next=document.getElementById("nextResult");if(!next)return;
 const original=next.onclick;if(typeof original!=="function")return;
 next.onclick=async function(e){
  if(busy||window.__MW_PORTAL_PAUSED__)return;
  const result=document.getElementById("resultTitle")?.textContent||"";
  const won=/escape|getaway|开溜|脱身|逃亡成功/i.test(result);
  if(won&&wins>=2&&Date.now()-lastAd>=90000&&typeof window.__MW_AD_BREAK__==="function"){
   busy=true;next.disabled=true;wins=0;lastAd=Date.now();
   try{await window.__MW_AD_BREAK__()}catch(err){console.warn("Ad unavailable; play continues",err)}
   finally{next.disabled=false;busy=false}
  }
  if(!window.__MW_PORTAL_PAUSED__)original.call(next,e);
 };
});
})();'''
if name=='y8':
    app=os.environ.get('Y8_APP_ID','').strip();game_id=os.environ.get('Y8_GAME_ID','').strip()
    if not app:raise SystemExit('Copy real Y8 App ID from the existing game SDK Initialization tab.')
    extra=r'''(()=>{let initialized=false,ready=false;
    function init(){if(initialized||!window.y8?.sdk)return;initialized=true;
     try{const sdk=window.y8.sdk();const game=GAME_ID;const app={appId:APP_ID,autoLogin:true};
      const ads=game?{gameId:game,preloadAdBreaks:"on",sound:"on",onReady:()=>{ready=true}}:undefined;
      sdk.init(app,ads);window.MorrowWishY8Sdk=sdk;sdk.onAuth?.(()=>{});
      if(game)window.__MW_AD_BREAK__=async()=>{if(!ready||!sdk.showAd)return;try{await sdk.showAd({type:"next",name:"level-complete",beforeAd:()=>window.__MW_PAUSE_AD__(true),afterAd:()=>window.__MW_PAUSE_AD__(false),adBreakDone:()=>window.__MW_PAUSE_AD__(false)})}finally{window.__MW_PAUSE_AD__(false)}};
     }catch(e){console.warn("Y8 initialization unavailable; guest play continues",e)}
    }window.addEventListener("y8sdk.ready",init);window.y8?.emitReadyEvent?.();init();
    })();'''.replace('APP_ID',json.dumps(app)).replace('GAME_ID',json.dumps(game_id))
    head='<script src="./portal-sdk.js"></script><script src="https://cdn.y8.com/minimal-sdk/2-0/y8.min.js" async></script>'
elif name=='gd':
    game_id=os.environ.get('GD_GAME_ID','').strip()
    if not re.fullmatch(r'[0-9a-fA-F]{32}',game_id):raise SystemExit('Copy real 32-hex GameDistribution game ID from the existing record.')
    extra=r'''(()=>{let ready=false,paused=false,resolveBreak=null;
    function settle(){paused=false;window.__MW_PAUSE_AD__(false);const cb=resolveBreak;resolveBreak=null;cb?.()}
    window.GD_OPTIONS={gameId:GAME_ID,onEvent(e){
      if(e.name==="SDK_READY")ready=true;
      else if(e.name==="SDK_GAME_PAUSE"){paused=true;window.__MW_PAUSE_AD__(true)}
      else if(e.name==="SDK_GAME_START"||e.name==="SDK_ERROR"||e.name==="AD_ERROR")settle()
    }};
    window.__MW_AD_BREAK__=()=>{if(!ready||typeof window.gdsdk?.showAd!=="function")return Promise.resolve();
      return new Promise(resolve=>{resolveBreak=resolve;try{const call=window.gdsdk.showAd();
       if(call&&typeof call.then==="function")call.then(()=>{if(!paused)settle()},settle);
       setTimeout(()=>{if(!paused&&resolveBreak)settle()},3500);
      }catch(e){settle()}});
    };
    document.addEventListener("DOMContentLoaded",()=>window.__MW_PAUSE_AD__(paused));
    })();'''.replace('GAME_ID',json.dumps(game_id))
    head='<script src="./portal-sdk.js"></script><script id="gamedistribution-jssdk" src="https://html5.api.gamedistribution.com/main.min.js" async></script>'
else:
    extra=r'''window.GamePixConfig={lifecycle:"manual"};'''
    # Load SDK before the game reads localStorage. Wait for loaded() before reporting the start.
    data['gamepix-init.js']=r'''(()=>{let ready=false,paused=false;
     const gp=window.GamePix;if(!gp)return;
     gp.events.on("pause",()=>{paused=true;window.__MW_PAUSE_AD__(true)});
     gp.events.on("resume",()=>{paused=false;window.__MW_PAUSE_AD__(false)});
     gp.lifecycle.loading(0);
     window.__MW_REPORT_START__=()=>{if(ready&&window.__MW_CONSUME_START__())gp.lifecycle.gameStart()};
     window.__MW_AD_BREAK__=async()=>{if(ready)await gp.ads.interstitial()};
     document.addEventListener("DOMContentLoaded",async()=>{
       window.__MW_PAUSE_AD__(paused);
       try{gp.lifecycle.loading(100);await gp.lifecycle.loaded();ready=true;window.__MW_REPORT_START__()}catch(e){console.warn("GamePix initialization unavailable",e)}
     });
    })();'''.encode()
    head='<script src="./portal-sdk.js"></script><script src="https://integration.gamepix.com/sdk/v3/gamepix.sdk.js"></script><script src="./gamepix-init.js"></script>'
h=h.replace('<head>','<head><script>window.__MW_PORTAL_KIND__='+json.dumps(name)+';</script>'+head,1)
data['index.html']=h.encode();data['portal-sdk.js']=(common+'\n'+extra).encode()
target=a.archive.parent/f'pawsibly-{name}-sdk-candidate.zip'
with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED) as z:
 for n,v in sorted(data.items()):z.writestr(n,v)
with zipfile.ZipFile(target) as z:assert z.testzip() is None
print(target)
