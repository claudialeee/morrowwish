#!/usr/bin/env python3
"""Bind actual portal credentials to an already-built standalone candidate.
Example: python3 scripts/pawsibly-bind-platform.py release-kit/pawsibly/pawsibly-standalone-candidate.zip gamepix
Y8_APP_ID and GD_GAME_ID are supplied by authorized portal operator, not invented.
No paid ads automatically inserted. Portal SDK preview still required.
"""
from pathlib import Path
import argparse, json, os, zipfile, re
p=argparse.ArgumentParser()
p.add_argument('archive',type=Path);p.add_argument('platform',choices=('y8','gd','gamepix'))
a=p.parse_args(); name=a.platform
with zipfile.ZipFile(a.archive) as z: data={i.filename:z.read(i) for i in z.infolist() if not i.is_dir()}
assert 'index.html' in data and 'game.js' in data
h=data['index.html'].decode()
if name=='y8':
    app=os.environ.get('Y8_APP_ID','').strip()
    if not app: raise SystemExit('Obtain actual Y8 App ID from SDK Initialization first.')
    code='''(()=>{let initialized=false;function init(){if(initialized||!window.y8?.sdk)return;initialized=true;try{const sdk=window.y8.sdk();sdk.init({appId:APP_ID,autoLogin:true});window.MorrowWishY8Sdk=sdk;sdk.onAuth?.((user,error)=>{if(error)console.warn("Y8 guest play remains available")});}catch(e){console.warn("Y8 initialization requires portal verification",e)}}window.addEventListener("y8sdk.ready",init);window.y8?.emitReadyEvent?.();init();})();'''.replace('APP_ID',json.dumps(app))
    head='<script src="./portal-sdk.js"></script><script src="https://cdn.y8.com/minimal-sdk/2-0/y8.min.js" async></script>'
elif name=='gd':
    game_id=os.environ.get('GD_GAME_ID','').strip()
    if not re.fullmatch(r'[0-9a-fA-F]{32}',game_id):raise SystemExit('Obtain real GameDistribution Game ID (32 hex characters).')
    code='''window.GD_OPTIONS={gameId:GAME_ID,advertisementSettings:{autoplay:false},onEvent(e){if(e.name==="SDK_GAME_PAUSE"){window.__GD_PAUSED__=true;window.MorrowwishPortalPause?.(true)}else if(e.name==="SDK_GAME_START"||e.name==="SDK_ERROR"){window.__GD_PAUSED__=false;window.MorrowwishPortalPause?.(false)}}};window.addEventListener("DOMContentLoaded",()=>window.MorrowwishPortalPause?.(!!window.__GD_PAUSED__));'''.replace('GAME_ID',json.dumps(game_id))
    head='<script src="./portal-sdk.js"></script><script id="gamedistribution-jssdk" src="https://html5.api.gamedistribution.com/main.min.js" async></script>'
else:
    code='''window.GamePixConfig={lifecycle:"manual"};window.arcadeMetric=(event)=>{if(event==="game_start")window.GamePix?.lifecycle?.gameStart?.()};'''
    head='<script src="./portal-sdk.js"></script><script src="https://integration.gamepix.com/sdk/v3/gamepix.sdk.js"></script><script>try{GamePix.lifecycle.loading(0);GamePix.events.on("pause",()=>{window.__GP_PAUSED__=true;window.MorrowwishPortalPause?.(true)});GamePix.events.on("resume",()=>{window.__GP_PAUSED__=false;window.MorrowwishPortalPause?.(false)});window.addEventListener("DOMContentLoaded",()=>{window.MorrowwishPortalPause?.(!!window.__GP_PAUSED__);GamePix.lifecycle.loading(100);GamePix.lifecycle.loaded()});}catch(e){console.warn("GamePix SDK requires actual portal verification",e)}</script>'
h=h.replace('<head>','<head>'+head,1)
data['index.html']=h.encode();data['portal-sdk.js']=code.encode()
target=a.archive.parent/f'pawsibly-{name}-sdk-candidate.zip'
with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED) as z:
    for n,v in sorted(data.items()):z.writestr(n,v)
with zipfile.ZipFile(target) as z: assert z.testzip() is None
print(target)
