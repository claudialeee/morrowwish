#!/usr/bin/env python3
"""Assemble from the existing actual recordings, not a fresh capture. Separate technical and visual gates."""
from pathlib import Path
from PIL import Image,ImageOps,ImageDraw
import base64,hashlib,json,shutil,subprocess,zipfile,statistics
root=Path('release-media'); root.mkdir(exist_ok=True)
master=Path('output/media'); qa=Path('qa-input')
review=root/'_verification'; review.mkdir(exist_ok=True)
rows=[]; failures=[]
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def record(p,src,extra={}):
    rows.append({'file':str(p.relative_to(root)),'source':str(src),'bytes':p.stat().st_size,'sha256':sha(p),**extra})
def img(src,dst,wh=None,crop=False):
    s=Path(src); p=root/dst; p.parent.mkdir(parents=True,exist_ok=True)
    if not s.is_file(): failures.append('Missing '+str(s)); return
    im=Image.open(s).convert('RGB'); original=im.size
    if wh and im.size!=wh:
        if crop: im=ImageOps.fit(im,wh,Image.Resampling.LANCZOS)
        elif im.width*wh[1]!=im.height*wh[0]: failures.append('Aspect mismatch '+str(s));return
        else: im=im.resize(wh,Image.Resampling.LANCZOS)
    if p.suffix=='.jpg': im.save(p,quality=94,optimize=True)
    elif p.suffix=='.png': im.save(p,optimize=True)
    else: raise ValueError(p)
    record(p,s,{'dimensions':list(im.size),'originalDimensions':list(original),'crop':crop})
def video(src,dst,wh,maxsec=None,minsec=None,maxmb=None):
    s=Path(src); p=root/dst;p.parent.mkdir(parents=True,exist_ok=True)
    if not s.is_file(): failures.append('Missing '+str(s));return
    shutil.copy2(s,p)
    v=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(p)]))
    a=next(x for x in v['streams'] if x['codec_type']=='video')
    d=float(v['format']['duration']); audio=any(x['codec_type']=='audio' for x in v['streams'])
    ok=(a['width'],a['height'])==wh and not audio and a['codec_name']=='h264' and (maxsec is None or d<=maxsec) and (minsec is None or d>=minsec) and (maxmb is None or p.stat().st_size<=maxmb*1e6)
    if not ok: failures.append('Video specs '+str(p))
    subprocess.run(['ffmpeg','-v','error','-i',str(p),'-f','null','-'],check=True)
    record(p,s,{'dimensions':[a['width'],a['height']],'duration':d,'audio':audio,'codec':a['codec_name'],'technicalPass':ok})
def copy(src,dst):
    s=Path(src); p=root/dst;p.parent.mkdir(parents=True,exist_ok=True)
    if not s.is_file(): failures.append('Missing '+str(s));return
    shutil.copy2(s,p);record(p,s)
inventory=json.loads(Path('inventory.json').read_text())
source_mismatches=[]
for item in inventory['sourceFiles']:
    p=Path('source')/item['path']; b=p.read_bytes()
    h=hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()
    if h!=item['gitBlob'] or len(b)!=item['bytes']: source_mismatches.append(item['path'])
for item in inventory['sharedFiles']:
    p=Path('source')/item['path'];b=p.read_bytes()
    if hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()!=item['gitBlob']:source_mismatches.append(item['path'])
if source_mismatches:failures.append('Source hash mismatch')
report=json.loads(Path('output/real-capture-report.json').read_text())
if report['source']!=inventory['sourceCommit'] or len(report['captures'])!=3 or any(not c['completed'] or c['errors'] for c in report['captures']):failures.append('Capture provenance')
for name,wh in [('landscape',(1920,1080)),('portrait',(800,1200)),('square',(800,800))]:
    img('approved-covers/cover-'+name+'.jpg','crazygames/cover-'+name+'.png',wh)
video(master/'landscape-variety.mp4','crazygames/real-gameplay-landscape.mp4',(1920,1080),maxsec=20,minsec=15)
video(master/'portrait-variety.mp4','crazygames/real-gameplay-portrait.mp4',(1080,1620),maxsec=20,minsec=15)
video(master/'landscape-continuous.mp4','y8/continuous.mp4',(1920,1080),minsec=15,maxmb=50)
img(master/'landscape-two-cat-garden.png','y8/landscape-promo.jpg',(1920,1080))
img(master/'vertical-two-cat-garden.png','y8/portrait-promo.jpg',(1080,1920))
img(master/'landscape-catdex.png','y8/widescreen.jpg',(1280,720))
img(qa/'y8-standard-garden.png','y8/standard.jpg',(760,570))
img(qa/'y8-standard-companions.png','y8/game-card.jpg',(760,570))
img(master/'landscape-two-cat-garden.png','gamepix/landscape.jpg',(1280,720))
img(qa/'gamepix-portrait-garden.png','gamepix/portrait.jpg',(720,1280))
img('approved-covers/cover-square.jpg','gamepix/icon.png',(512,512))
img('approved-covers/cover-square.jpg','gamedistribution/square.png',(512,512))
img('approved-covers/cover-landscape.jpg','gamedistribution/card.png',(512,384),crop=True)
img('approved-covers/cover-landscape.jpg','gamedistribution/small.png',(200,120),crop=True)
copy('output/cat-bond-gamepix-candidate.zip','gamepix/cat-bond-gamepix-candidate.zip')
for plat in ['y8','gamedistribution']:
    name='cat-bond-'+plat+'-candidate.zip'
    if (qa/name).exists():copy(qa/name,plat+'/'+name)
    else:failures.append(plat+' actual SDK ID/build missing')
for scene in ['two-cat-garden','catdex','workshop','companions','battle','capture-result','exploration']:
    img(master/('landscape-'+scene+'.png'),'itch/screenshots/'+scene+'.jpg',(1280,720))
    for fmt,wh in [('landscape',(1920,1080)),('vertical',(1080,1920))]:
        img(master/(fmt+'-'+scene+'.png'),'y8/alternates/'+fmt+'-'+scene+'.jpg',wh)
img('approved-covers/cover-landscape.jpg','itch/cover-candidate.jpg')
video(master/'landscape-variety.mp4','itch/gameplay-preview.mp4',(1920,1080),maxsec=20,minsec=15)
copy('handoff/manifest.json','_verification/manifest.json')
for f in ['standalone-qa.json','itch-live-parity.json','y8-build-report.json','gamedistribution-build-report.json','y8-blocked.txt','gamedistribution-blocked.txt']:
    if (qa/f).exists():copy(qa/f,'_verification/'+f)
copy('output/gamepix-build-report.json','_verification/gamepix-build-report.json')
copy('output/real-capture-report.json','_verification/real-capture-report.json')
# Verify archive integrity and portrait art count independently of exporter.
zipreports=[]
for p in root.rglob('*.zip'):
    with zipfile.ZipFile(p) as z:
        names=z.namelist(); bad=z.testzip(); count=sum(x.startswith('assets/mobile-portrait/duo/') and x.endswith('.webp') for x in names)
        ok=bad is None and 'index.html' in names and count==63
        zipreports.append({'file':str(p.relative_to(root)),'files':len(names),'portraitCount':count,'crcPass':bad is None,'pass':ok,'sha256':sha(p)})
        if not ok:failures.append('ZIP integrity '+str(p))
# Render visual-review contact sheets from original full-res captures and actual MP4 frames.
def sheet(items,name,cell=(480,300),columns=2):
    if not items:return
    width,height=cell; rowh=height+26
    board=Image.new('RGB',(width*columns,((len(items)+columns-1)//columns)*rowh),'#222222');draw=ImageDraw.Draw(board)
    for i,(p,label) in enumerate(items):
        im=Image.open(p).convert('RGB');im.thumbnail((width-8,height-8),Image.Resampling.LANCZOS)
        x=(i%columns)*width;y=(i//columns)*rowh
        board.paste(im,(x+(width-im.width)//2,y+(height-im.height)//2));draw.text((x+6,y+height+4),label,fill='white')
    p=review/(name+'.jpg');board.save(p,quality=78,optimize=True)
    (review/(name+'.b64.txt')).write_text(base64.b64encode(p.read_bytes()).decode())
for fmt in ['landscape','portrait','vertical']:
    paths=sorted(master.glob(fmt+'-*.png'))
    sheet([(p,p.stem) for p in paths],fmt+'-screens',cell=(480,270) if fmt=='landscape' else (320,480),columns=2 if fmt=='landscape' else 3)
sheet([(p,p.relative_to(root).as_posix()) for p in sorted(root.rglob('*.png')) if 'cover' in p.name or p.parent.name=='gamedistribution'],'covers',cell=(400,320),columns=3)
for name in ['landscape-variety','portrait-variety','landscape-continuous']:
    frames=review/'frames'/name;frames.mkdir(parents=True,exist_ok=True)
    subprocess.run(['ffmpeg','-v','error','-i',str(master/(name+'.mp4')),'-vf','fps=1/3,scale=480:-2','-frames:v','15',str(frames/'%02d.jpg')],check=True)
    sheet([(p,name+' '+str(i*3)+'s') for i,p in enumerate(sorted(frames.glob('*.jpg')))],name+'-frames',cell=(480,270) if 'portrait' not in name else (300,450),columns=2 if 'portrait' not in name else 3)
    shutil.rmtree(frames)
qa_status={}
for n in ['standalone-qa','itch-live-parity']:
    f=qa/(n+'.json')
    if f.exists():
        j=json.loads(f.read_text());qa_status[n]=j.get('pass',False)
    else:qa_status[n]=False
    if not qa_status[n]:failures.append(n+' not passed')
final={'sourceCommit':inventory['sourceCommit'],'sourceBlobMatches':len(inventory['sourceFiles'])-len(source_mismatches),'sourceMismatches':source_mismatches,'files':rows,'zipChecks':zipreports,'technicalFailures':failures,'technicalPass':not failures,'visualApproved':False,'portalSaved':False,'qaStatus':qa_status}
(review/'crosscheck.json').write_text(json.dumps(final,indent=2)+'\n')
print(json.dumps({'files':len(rows),'failures':failures,'zipChecks':zipreports,'qaStatus':qa_status}))
