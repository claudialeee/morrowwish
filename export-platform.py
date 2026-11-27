#!/usr/bin/env python3
"""Offline platform ZIP exporter. IDs must come from the existing portal record."""
import argparse,hashlib,json,os,re,shutil,zipfile
from pathlib import Path
root=Path(__file__).resolve().parent
p=argparse.ArgumentParser()
p.add_argument('platform',choices=['gamepix','y8','gamedistribution','itch'])
p.add_argument('--awaiting-id',action='store_true',help='Internal SDK template only; never upload as configured build')
args=p.parse_args()
platform=args.platform
appid=os.environ.get('Y8_APP_ID','').strip()
gdid=os.environ.get('GD_GAME_ID','').strip()
if platform=='y8' and not appid and not args.awaiting_id: p.error('Set Y8_APP_ID from the existing Y8 record')
if platform=='gamedistribution' and not re.fullmatch(r'[0-9a-fA-F]{32}',gdid) and not args.awaiting_id: p.error('Set actual existing GD_GAME_ID (32 hex characters)')
out=root/'output';out.mkdir(exist_ok=True)
dest=out/platform
if dest.exists(): shutil.rmtree(dest)
shutil.copytree(root/'package-base',dest)
idx=dest/'index.html';html=idx.read_text()
for f in list(dest.rglob('*.js'))+list(dest.rglob('*.css')):
    txt=f.read_text(); updated=txt.replace('/cat-bond/assets/', '../assets/' if f.parent.name=='css' else 'assets/')
    if txt!=updated: f.write_text(updated)
configured=platform in ('y8','gamedistribution') and bool(appid if platform=='y8' else re.fullmatch(r'[0-9a-fA-F]{32}',gdid))
if platform=='y8':
    # Authentication only; no ads until actual portal ad integration is verified.
    bridge=(root/'sdk'/'y8.js').read_text().replace('__APP_ID_JSON__',json.dumps(appid if configured else ''))
    (dest/'portal-sdk.js').write_text(bridge)
    html=html.replace('</head>','<script src="portal-sdk.js" defer></script>\n</head>')
elif platform=='gamedistribution':
    bridge=(root/'sdk'/'gamedistribution.js').read_text().replace('__GAME_ID_JSON__',json.dumps(gdid if configured else ''))
    (dest/'portal-sdk.js').write_text(bridge)
    html=html.replace('</head>','<script src="portal-sdk.js" defer></script>\n</head>')
idx.write_text(html)
assert len(list((dest/'assets/mobile-portrait/duo').glob('*.webp')))==63
assert (dest/'assets/duo-storyboard-21x3-v3.webp').stat().st_size>100000
assert not re.search(r'(?:src|href)="/',html)
assert 'telemetry.js' not in html and 'studio-music.js' not in html
assert ('portal-sdk.js' in html)==(platform in ('y8','gamedistribution'))
files=sorted(x for x in dest.rglob('*') if x.is_file())
suffix='awaiting-sdk-id' if platform in ('y8','gamedistribution') and not configured else 'candidate'
zpath=out/f'cat-bond-{platform}-{suffix}.zip'
with zipfile.ZipFile(zpath,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for f in files: z.write(f,f.relative_to(dest).as_posix())
with zipfile.ZipFile(zpath) as z:
    assert z.testzip() is None and 'index.html' in z.namelist()
report={'portraitViewportFix':'20261127-uniform-world-camera-and-portal-stage','worldmapSha256':hashlib.sha256((dest/'js/worldmap.js').read_bytes()).hexdigest(),'cssSha256':hashlib.sha256((dest/'css/style.css').read_bytes()).hexdigest(),'sourceCommit':'7637c688dc6efee7145bf6fe46e25f704d57e6fc','platform':platform,'bytes':zpath.stat().st_size,'sha256':hashlib.sha256(zpath.read_bytes()).hexdigest(),'fileCount':len(files),'sdkConfigurationPresent':configured,'awaitingSdkId':platform in ('y8','gamedistribution') and not configured,'runtimeVerified':False,'portalSaved':False,'reviewReady':False}
(out/f'{platform}-build-report.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
