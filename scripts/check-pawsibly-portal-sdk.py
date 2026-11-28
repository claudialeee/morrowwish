#!/usr/bin/env python3
"""Offline test only, disposable fixtures never published or uploaded."""
import os, subprocess, tempfile, zipfile, shutil
from pathlib import Path
source=Path('release-kit/pawsibly/pawsibly-standalone-candidate.zip')
with tempfile.TemporaryDirectory() as tmp:
    root=Path(tmp)
    z=root/source.name
    shutil.copy2(source,z)
    env={**os.environ,'Y8_APP_ID':'offline-test-fixture','Y8_GAME_ID':'offline-test-fixture','GD_GAME_ID':'0123456789abcdef0123456789abcdef'}
    for platform in ('y8','gd','gamepix'):
        subprocess.run(['python3','scripts/bind-pawsibly-portable-final.py',str(z),platform],env=env,check=True)
        archive=root/f'pawsibly-{platform}-sdk-candidate.zip'
        with zipfile.ZipFile(archive) as f:
            assert not f.testzip()
            assert 'portal-sdk.js' in f.namelist()
            for n in f.namelist():
                if n.endswith('.js'):
                    x=root/Path(n).name;x.write_bytes(f.read(n))
                    subprocess.run(['node','--check',str(x)],check=True)
    # Missing identifiers must fail closed.
    env.pop('Y8_APP_ID');env.pop('GD_GAME_ID')
    for platform in ('y8','gd'):
        res=subprocess.run(['python3','scripts/bind-pawsibly-portable-final.py',str(z),platform],env=env,capture_output=True)
        assert res.returncode!=0
print('SDK binder ZIP structure, JS parsing and required credential gates PASS; no test IDs exported.')
