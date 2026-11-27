from pathlib import Path
from PIL import Image, ImageDraw
import json,hashlib,subprocess,shutil,base64
root=Path('signature-media');root.mkdir(exist_ok=True)
prev=Path('output/portrait-fixed-refined');prior=json.loads((prev/'capture-report.json').read_text())
report={'sourceCommit':'7637c688dc6efee7145bf6fe46e25f704d57e6fc','viewportFix':'c0c9eef798870ac84ffd2442dc68ca085cf407cd','orientations':[],'readyForVisualReview':False,'portalSaved':False}
def ff(*a):subprocess.run(['ffmpeg','-v','error','-y',*map(str,a)],check=True)
def probe(f):
 m=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(f)]))
 s=next(s for s in m['streams'] if s['codec_type']=='video')
 return {'width':s['width'],'height':s['height'],'codec':s['codec_name'],'duration':float(m['format']['duration']),'audio':any(s['codec_type']=='audio' for s in m['streams']),'sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'bytes':f.stat().st_size}
for name,wh in [('landscape',(1920,1080)),('portrait',(1080,1620))]:
 src=Path('signature-input')/name
 item={'orientation':name,'complete':False};report['orientations'].append(item)
 try:
  r=json.loads((src/(name+'-report.json')).read_text())
  assert r['duo'] and not r['errors'] and not r['failedRequests']
  assert r['duo']['uses']>=1 and r['duo']['layout']['originalArt'] and not r['duo']['layout']['actorFallback']
  assert r['duo']['layout']['source']==('63-native-portrait-painted-storyboards' if name=='portrait' else '63-original-painted-storyboards')
  item['duo']=r['duo']
  # Copy actual proof. No SSR result is published without a newly earned roster entry.
  ssr=r.get('ssr');item['ssr']=ssr
  out=root/name;out.mkdir(exist_ok=True)
  for f in (src/name).glob('*.png'):shutil.copy2(f,out/f.name)
  for f in (src/name).glob('*.mp4'):shutil.copy2(f,out/f.name)
  assert ssr and ssr['rarity']=='SSR' and ssr['owned']['rarity']=='SSR' and ssr['after']>ssr['before'],'No actual earned SSR result'
  marks={x['name']:x['at'] for x in next(c for c in prior['captures'] if c['name']==name)['marks']}
  # Opening authentic cut-in, then normal garden, workshop, real region,
  # genuine SSR combat and earned result. No title art substituted for gameplay.
  clips=[]
  def encode(src,start,dur,tag):
   dst=out/(tag+'.mp4')
   ff('-ss',max(0,start),'-i',src,'-t',dur,'-an','-vf','fps=25','-c:v','libx264','-preset','fast','-crf','21','-pix_fmt','yuv420p',dst)
   assert (probe(dst)['width'],probe(dst)['height'])==wh
   clips.append(dst.resolve())
  encode(out/'duo-real.mp4',0,4.1,'piece-1')
  encode(prev/name/'continuous.webm',marks['two-cat-garden']-.15,2.2,'piece-2')
  encode(prev/name/'continuous.webm',marks['workshop']-.15,2.2,'piece-3')
  encode(prev/name/'continuous.webm',marks['real-exploration']-.15,2.5,'piece-4')
  encode(out/'ssr-combat.mp4',0,3.4,'piece-5')
  encode(out/'ssr-earned.mp4',0,3.4,'piece-6')
  lst=out/'concat.txt';lst.write_text('\n'.join("file '"+str(c)+"'" for c in clips))
  video=out/('real-gameplay-'+name+'.mp4');ff('-f','concat','-safe',0,'-i',lst,'-c','copy','-movflags','+faststart',video)
  meta=probe(video);assert (meta['width'],meta['height'])==wh and 15<=meta['duration']<=20 and not meta['audio'] and meta['codec']=='h264'
  ff('-i',video,'-f','null','-')
  # Actual exported frames for review, including peak full-screen art and SSR.
  frames=out/'frames';frames.mkdir(exist_ok=True)
  ff('-i',video,'-vf','fps=1,scale=480:-2','-frames:v','20',frames/'%02d.jpg')
  files=sorted(frames.glob('*.jpg'));w,h=(420,236) if name=='landscape' else (260,390);cols=3 if name=='landscape' else 4
  board=Image.new('RGB',(w*cols,(h+24)*((len(files)+cols-1)//cols)),'#222222');draw=ImageDraw.Draw(board)
  for i,f in enumerate(files):
   im=Image.open(f).convert('RGB');im.thumbnail((w-8,h-8));x=i%cols*w;y=i//cols*(h+24);board.paste(im,(x+(w-im.width)//2,y+(h-im.height)//2));draw.text((x+4,y+h+3),f'{i}s',fill='white')
  b=out/'final-frames.jpg';board.save(b,quality=78,optimize=True);b.with_suffix('.b64.txt').write_text(base64.b64encode(b.read_bytes()).decode())
  for f in clips:Path(f).unlink()
  lst.unlink();shutil.rmtree(frames)
  item.update(complete=True,video=meta,scenes=['actual duo cut-in','garden','workshop','region','SSR battle','SSR earned result'])
 except Exception as e:item['error']=str(e)
report['readyForVisualReview']=all(o['complete'] for o in report['orientations'])
(root/'report.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'orientations':[(o['orientation'],o['complete'],o.get('error')) for o in report['orientations']],'readyForVisualReview':report['readyForVisualReview']}))
if not report['readyForVisualReview']:raise SystemExit(1)
