#!/usr/bin/env python3
"""Validate and hash *already captured* current Cat Bond submission media.
No generation, cropping or rendering of invented scenes. Standard library + ffprobe.
Run: python3 promotion/cat-bond-platform-refresh-20261127/verify-media.py --root .check/cat-bond-platform-drafts --commit <frozen SHA>
Export exact native compositions into the paths below before running.
"""
import argparse, hashlib, json, re, subprocess
from pathlib import Path

p=argparse.ArgumentParser()
p.add_argument('--root', type=Path, required=True)
p.add_argument('--commit', required=True)
a=p.parse_args()
if not re.fullmatch(r'[0-9a-fA-F]{40}',a.commit):
    p.error('--commit must be full 40-character source commit SHA')
a.root.mkdir(parents=True,exist_ok=True)

# All mandatory known specs, not guessed GamePix portal slots.
# GamePix can be added after authenticated portal confirms exact dimensions.
specs=[
 ('crazygames/cover-landscape.png',1920,1080,None,None,None,None),
 ('crazygames/cover-portrait.png',800,1200,None,None,None,None),
 ('crazygames/cover-square.png',800,800,None,None,None,None),
 ('crazygames/real-gameplay-landscape.mp4',1920,1080,20,None,None,False),
 ('crazygames/real-gameplay-portrait.mp4',1080,1620,20,None,None,False),
 ('y8/standard.jpg',760,570,None,None,2,None),
 ('y8/widescreen.jpg',1280,720,None,None,5,None),
 ('y8/landscape-promo.jpg',1920,1080,None,None,5,None),
 ('y8/portrait-promo.jpg',1080,1920,None,None,5,None),
 ('y8/game-card.jpg',760,570,None,None,2,None),
 ('y8/continuous.mp4',1920,1080,None,15,50,None),
 ('gamedistribution/square.png',512,512,None,None,None,None),
 ('gamedistribution/card.png',512,384,None,None,None,None),
 ('gamedistribution/small.png',200,120,None,None,None,None),
]
rows=[]
for rel,w,h,max_sec,min_sec,max_mb,sound in specs:
    file=a.root/rel
    row={'file':rel,'required_dimensions':[w,h],'pass':False}
    try:
        if not file.is_file(): raise ValueError('missing file')
        raw=subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(file)])
        meta=json.loads(raw)
        stream=next(x for x in meta['streams'] if x['codec_type']=='video')
        size=file.stat().st_size
        duration=float(meta['format'].get('duration','0'))
        audio=any(x['codec_type']=='audio' for x in meta['streams'])
        row.update(width=stream['width'],height=stream['height'],bytes=size,duration=duration,has_audio=audio,sha256=hashlib.sha256(file.read_bytes()).hexdigest())
        checks=[(stream['width'],stream['height'])==(w,h),size>0]
        if max_sec is not None: checks.append(0<duration<=max_sec)
        if min_sec is not None: checks.append(duration>=min_sec)
        if max_mb is not None: checks.append(size<=max_mb*1_000_000)
        if sound is not None: checks.append(audio==sound)
        row['pass']=all(checks)
    except Exception as e:
        row['error']=str(e)
    rows.append(row)
report={'source_commit':a.commit,'technical_pass':all(r['pass'] for r in rows),'files':rows,'not_verified_by_this_tool':['visual quality','authentic gameplay','continuous no-edit Y8 recording','source-to-footage provenance','GamePix portal-specific slots','actual portal upload/preview/SDK','rights']}
(a.root/'media-verification.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
raise SystemExit(0 if report['technical_pass'] else 1)
