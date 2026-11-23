#!/usr/bin/env python3
"""Real gameplay only: recut V14 Cat Bond for CrazyGames with VARIETY first.

Uses the already-reviewed V14 source movie (V13 release asset according to
public/promo/v14-review.json) in native portrait and landscape aspect ratios.
Never includes the 63-frame original duo cut-in, even for a single frame.
No generated animation, fabricated UI, marketing title cards, or gameplay audio.
No publishing or draft changes: this script creates review artifacts only.
"""
import json
import subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
ART=ROOT/'.check/crazygames-v14-variety'
ART.mkdir(parents=True,exist_ok=True)
REVIEW=json.loads((ROOT/'public/promo/v14-review.json').read_text())
CAT=next(x for x in REVIEW['trailers'] if x['slug']=='cat-bond')
assert CAT['video']=='/promo/cat-bond/trailer-v13-20261122.mp4'
LND=json.loads((ROOT/'public/promo/cat-bond/trailer-v13-landscape-20261122.json').read_text())
assert LND['video']=='/promo/cat-bond/trailer-v13-landscape-20261122.mp4'
# No whole-screen finisher, regardless of shot content or title.
BANNED={'duo','rare-aftermath','battle-hud','rare-encounter','end-card'}
SHOTS=[
  ('yard',          0.25, 2.05,'explore','Enter a living cat world'),
  ('cat-upgrade',   2.70, 2.00,'growth','Raise and train cats'),
  ('duo-partners',  5.85, 1.80,'collection','Choose a two-cat team'),
  ('duo-promise',  10.38, 1.90,'story','Discover their stories'),
  ('work-after',   23.30, 1.50,'management','Send cats to work'),
  ('map-choice',   27.98, 2.00,'exploration','Discover regions'),
  ('map-explore',  30.45, 2.02,'exploration','Travel the world'),
  ('battle-skills',42.08, 1.55,'battle','A short taste of real-time skills'),
  ('rare-capture', 49.25, 2.10,'collection','Welcome a new cat'),
  ('ssr-showcase', 52.70, 1.90,'collection','Meet a rare companion'),
]
duration=sum(x[2] for x in SHOTS)
assert 18<=duration<20
assert sum(x[2] for x in SHOTS if x[3]=='battle')/duration<.15
assert len(set(s[0] for s in SHOTS))==len(SHOTS)
for manifest in (CAT,LND):
  scenes={x.get('scene'):x for x in manifest['shots']}
  assert 'duo' in scenes
  ultimate=scenes['duo']
  forbidden=(ultimate.get('startAt',44.7),ultimate.get('startAt',44.7)+ultimate['seconds'])
  for name,start,seconds,kind,description in SHOTS:
    assert name in scenes and name not in BANNED
    block=scenes[name]
    bstart=block['startAt'] if 'startAt' in block else sum(z['seconds'] for z in manifest['shots'][:manifest['shots'].index(block)])
    assert start>=bstart+.04 and start+seconds<=bstart+block['seconds']-.04,(name,start,seconds,bstart,block['seconds'])
    assert start+seconds<forbidden[0]-.7 or start>forbidden[1]+.7,(name,'duo ultimate overlap')
  assert abs(sum(x['seconds'] for x in manifest['shots'])-59.55)<.3

def probe(file):
  p=subprocess.check_output(['ffprobe','-v','error','-show_entries',
    'stream=codec_type,width,height:format=duration,size','-of','json',str(file)])
  return json.loads(p)

def make(aspect,src,width,height):
  assert src.is_file(),src
  meta=probe(src)
  assert float(meta['format']['duration'])>57
  assert any(s.get('codec_type')=='video' for s in meta['streams'])
  cropped='scale=1920:1080:flags=lanczos' if aspect=='landscape' else 'scale=1080:1920:flags=lanczos,crop=1080:1620:0:150'
  filt=[]
  for i,(name,start,seconds,kind,description) in enumerate(SHOTS):
    filt.append(f'[0:v]trim=start={start:.3f}:duration={seconds:.3f},setpts=PTS-STARTPTS,'
                f'fps=30,{cropped},setsar=1,format=yuv420p[v{i}]')
  filt.append(''.join(f'[v{i}]' for i in range(len(SHOTS)))+
              f'concat=n={len(SHOTS)}:v=1:a=0,format=yuv420p[out]')
  target=ART/f'cat-bond-crazygames-v14-variety-{aspect}.mp4'
  cmd=['ffmpeg','-nostdin','-y','-hide_banner','-loglevel','error',
    '-i',str(src),'-filter_complex',';'.join(filt),'-map','[out]','-an',
    '-c:v','libx264','-preset','veryfast','-crf','20','-pix_fmt','yuv420p',
    '-movflags','+faststart',str(target)]
  subprocess.run(cmd,check=True,timeout=360)
  info=probe(target)
  stream=[s for s in info['streams'] if s['codec_type']=='video']
  assert len(stream)==1 and stream[0]['width']==width and stream[0]['height']==height
  assert not any(s['codec_type']=='audio' for s in info['streams'])
  assert 18.5<float(info['format']['duration'])<19.5
  assert target.stat().st_size<50_000_000
  # Evidence: contact sheet inputs at real edited-video timestamps.
  for idx,at in enumerate([.7,2.8,5.2,7.8,10.1,12.5,14.5,16.5,18.1]):
    subprocess.run(['ffmpeg','-nostdin','-y','-hide_banner','-loglevel','error',
      '-ss',str(at),'-i',str(target),'-frames:v','1','-update','1',
      str(ART/f'{aspect}-review-{idx:02d}.jpg')],check=True,timeout=30)
  return {'video':str(target.relative_to(ROOT)),
          'duration':float(info['format']['duration']),
          'bytes':target.stat().st_size,'width':width,'height':height,
          'source':str(src.relative_to(ROOT))}

portrait=make('portrait',ROOT/'public/promo/cat-bond/trailer-v13-20261122.mp4',1080,1620)
landscape=make('landscape',ROOT/'public/promo/cat-bond/trailer-v13-landscape-20261122.mp4',1920,1080)
report={'kind':'real-gameplay-V14-creative-recut-not-ai',
  'reference':'public/promo/v14-review.json',
  'durationSeconds':round(duration,3),
  'battleFraction':round(sum(x[2] for x in SHOTS if x[3]=='battle')/duration,3),
  'containsOriginal63DuoCinematic':False,
  'original63CutinExcludedAtSeconds':[44.7,47.8],
  'showcases':[{'scene':n,'startSeconds':s,'seconds':d,'kind':k,'purpose':desc}
               for n,s,d,k,desc in SHOTS],
  'videos':{'portrait':portrait,'landscape':landscape},
  'crazygamesDraftTouched':False,'requiresVisualReview':True}
(ART/'shot-plan-and-qa.json').write_text(json.dumps(report,indent=2)+'\n')
print('CAT BOND REAL GAMEPLAY V14 VARIETY PREVIEW PASS',json.dumps(report))
