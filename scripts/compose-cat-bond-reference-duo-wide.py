# Preserve every original two-cat cinematic frame from the user-approved V10 review
# while compositing onto real 16:9 battle footage; NO original animation replacement.
from pathlib import Path
from PIL import Image
import math, json, tempfile, subprocess
base=Path('public/promo/cat-bond')
src=base/'trailer-v10-20261121.mp4'
wide=base/'trailer-v10-landscape-20261122.mp4'
out=base/'trailer-v10-landscape-reference-duo-20261122.mp4'
poster=base/'trailer-v10-landscape-reference-duo-20261122.jpg'
meta=base/'trailer-v10-landscape-reference-duo-20261122.json'
font='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
def run(cmd):
 print('executing',cmd[0],cmd[-3:]);subprocess.run(cmd,check=True,timeout=300)
def probe(p):
 return json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','stream=codec_type,width,height:format=duration,size','-of','json',str(p)]))
assert src.exists() and wide.exists(), 'Missing exact original and widescreen reference videos'
orig=probe(src); layout=probe(wide)
assert any(s.get('width')==1080 and s.get('height')==1920 for s in orig['streams'])
assert any(s.get('width')==1920 and s.get('height')==1080 for s in layout['streams'])
review=json.loads(Path('public/promo/v12-review.json').read_text())
shots=next(t['shots'] for t in review['trailers'] if t['slug']=='cat-bond')
assert len(shots)==21 and shots[16]['scene']=='duo' and shots[16]['seconds']==3.1
start=sum(float(s['seconds']) for s in shots[:16]);length=shots[16]['seconds'];end=start+length
assert abs(start-44.7)<.01
with tempfile.TemporaryDirectory(prefix='source-duo-wide-') as folder:
 d=Path(folder);mask=d/'mask.png';backdrop=d/'backdrop.png';duo=d/'original-duo.mp4'
 W,H=1080,850
 a=Image.new('L',(W,H));pix=a.load()
 for y in range(H):
  yy=(y-H/2)/(H/2)
  for x in range(W):
   xx=(x-W/2)/(W/2);rr=math.hypot(xx,yy)
   t=max(0,min(1,(rr-.79)/.20))
   pix[x,y]=round(255*(1-t*t*(3-2*t)))
 a.save(mask)
 run(['ffmpeg','-nostdin','-y','-v','error','-ss',str(start+.55),'-i',str(wide),'-frames:v','1',str(backdrop)])
 caption=d/'caption.txt';caption.write_text('ONE POWERFUL DUO FINISHER!',encoding='utf-8')
 name=d/'move.txt';name.write_text('Blossomfire Pawdance',encoding='utf-8')
 f=('[1:v]crop=1080:850:0:510,scale=1080:850:flags=lanczos,fps=30,format=rgba[fg];'
    '[2:v]format=gray[alpha];[fg][alpha]alphamerge[foreground];'
    '[0:v]scale=1920:1080:flags=lanczos,format=rgba[bg];'
    '[bg][foreground]overlay=x=(W-w)/2:y=118:shortest=1:format=auto,format=yuv420p,'
    f'drawtext=fontfile={font}:textfile={caption}:fontcolor=white:fontsize=52:box=1:boxcolor=black@0.48:boxborderw=12:x=(w-text_w)/2:y=150,'
    f'drawtext=fontfile={font}:textfile={name}:fontcolor=white:fontsize=43:shadowcolor=black@0.8:shadowx=2:shadowy=2:x=(w-text_w)/2:y=915[v]')
 run(['ffmpeg','-nostdin','-y','-v','error','-loop','1','-framerate','30','-i',str(backdrop),
      '-ss',f'{start:.3f}','-i',str(src),'-loop','1','-i',str(mask),
      '-filter_complex',f,'-map','[v]','-t',f'{length:.3f}','-r','30',
      '-c:v','libx264','-preset','veryfast','-crf','18','-pix_fmt','yuv420p','-an',str(duo)])
 concat=(f'[0:v]trim=start=0:end={start:.3f},setpts=PTS-STARTPTS,fps=30[v0];'
         '[1:v]setpts=PTS-STARTPTS,fps=30[v1];'
         f'[0:v]trim=start={end:.3f},setpts=PTS-STARTPTS,fps=30[v2];'
         '[v0][v1][v2]concat=n=3:v=1:a=0,format=yuv420p[vout]')
 run(['ffmpeg','-nostdin','-y','-v','error','-i',str(wide),'-i',str(duo),
      '-filter_complex',concat,'-map','[vout]','-map','0:a:0','-c:v','libx264',
      '-preset','veryfast','-crf','20','-c:a','copy','-pix_fmt','yuv420p',
      '-movflags','+faststart',str(out)])
info=probe(out);duration=float(info['format']['duration'])
assert abs(duration-59.5667)<.09,info
assert any(s.get('width')==1920 and s.get('height')==1080 for s in info['streams']),info
assert any(s.get('codec_type')=='audio' for s in info['streams']),info
assert int(info['format']['size'])>1000000,info
run(['ffmpeg','-nostdin','-y','-v','error','-ss','46.20','-i',str(out),'-frames:v','1','-q:v','2',str(poster)])
proofs=[]
for i,t in enumerate([45.25,45.70,46.20,46.65,47.15,47.55]):
 f=base/f'reference-duo-landscape-{i+1}.jpg'
 run(['ffmpeg','-nostdin','-y','-v','error','-ss',str(t),'-i',str(out),'-frames:v','1','-q:v','3',str(f)])
 proofs.append('/promo/cat-bond/'+f.name)
result={'source':'/promo/cat-bond/trailer-v10-20261121.mp4','sourceDuoStart':start,
 'sourceDuoEnd':end,'originalDuoVideoFramesUsed':True,'originalDuoVideoRetimed':False,
 'recordedWidescreenBackdrop':str(wide),'video':'/promo/cat-bond/'+out.name,
 'poster':'/promo/cat-bond/'+poster.name,'proofImages':proofs,
 'width':1920,'height':1080,'duration':duration,'bytes':int(info['format']['size']),
 'publishedOnYouTube':False}
meta.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print('CORRECT ORIGINAL DUO FOOTAGE IN NATIVE WIDE SCENE',json.dumps(result))
