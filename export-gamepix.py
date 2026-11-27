#!/usr/bin/env python3
"""Create an SDK-free GamePix candidate. Requires portal preview before upload acceptance."""
from pathlib import Path
import hashlib,json,zipfile
root=Path(__file__).resolve().parent
src=root/'package-base'
files=sorted(p for p in src.rglob('*') if p.is_file())
assert (src/'index.html').is_file()
assert len(list((src/'assets/mobile-portrait/duo').glob('*.webp')))==63
out=root/'output';out.mkdir(exist_ok=True)
zpath=out/'cat-bond-gamepix-candidate.zip'
with zipfile.ZipFile(zpath,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for p in files:
        z.write(p,p.relative_to(src).as_posix())
with zipfile.ZipFile(zpath) as z:
    assert z.testzip() is None
    assert 'index.html' in z.namelist()
report={'sourceCommit':'7637c688dc6efee7145bf6fe46e25f704d57e6fc','platform':'GamePix','sdk':'none','runtimeVerified':False,'portalSaved':False,'bytes':zpath.stat().st_size,'sha256':hashlib.sha256(zpath.read_bytes()).hexdigest(),'files':len(files)}
(out/'gamepix-build-report.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
