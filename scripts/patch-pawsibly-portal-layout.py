#!/usr/bin/env python3
"""Apply visual QA fixes to isolated portable exports; not production."""
from pathlib import Path
import zipfile,hashlib,json
out=Path('release-kit/pawsibly')
css=Path('scripts/pawsibly-portable-layout.css').read_text()
for z in sorted(out.glob('*.zip')):
    if 'itch-live-wrapper' in z.name:continue
    with zipfile.ZipFile(z) as f:data={i.filename:f.read(i) for i in f.infolist() if not i.is_dir()}
    h=data['index.html'].decode()
    h=h.replace('<html ','<html data-pawsibly-portal="true" ',1).replace('</head>','<link rel="stylesheet" href="./portal-layout.css"></head>')
    data['index.html']=h.encode()
    data['portal-layout.css']=css.encode()
    with zipfile.ZipFile(z,'w',zipfile.ZIP_DEFLATED) as f:
        for n,v in sorted(data.items()):f.writestr(n,v)
    with zipfile.ZipFile(z) as f:assert f.testzip() is None and 'index.html' in f.namelist()
    if z.name=='pawsibly-standalone-candidate.zip':
        d=out/'standalone'
        with zipfile.ZipFile(z) as f:f.extractall(d)
# Refresh checksums for every archive, not the old manifest only.
p=out/'build-manifest.json';m=json.loads(p.read_text())
m['packages']=[{'file':z.name,'bytes':z.stat().st_size,'sha256':hashlib.sha256(z.read_bytes()).hexdigest()} for z in sorted(out.glob('*.zip'))]
p.write_text(json.dumps(m,indent=2)+'\n')
