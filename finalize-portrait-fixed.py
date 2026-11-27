#!/usr/bin/env python3
"""Final one-pass packaging of authentic existing footage and tested ZIPs. No recapture, SDK calls or portal writes."""
from pathlib import Path
from PIL import Image,ImageDraw
import json,hashlib,shutil,subprocess,zipfile,base64
root=Path('release-media');v=root/'_verification';refined=Path('output/portrait-fixed-refined')
def png(src,dst):
    Image.open(src).convert('RGB').save(dst,optimize=True)
for fmt in ['landscape','portrait','square']:png(v/'selected-art'/('cg-'+fmt+'.jpg'),root/'crazygames'/('cover-'+fmt+'.png'))
for fmt in ['square','card','small']:png(v/'selected-art'/('gd-'+fmt+'.jpg'),root/'gamedistribution'/(fmt+'.png'))
png(v/'selected-art'/'gd-square.jpg',root/'gamepix'/'icon.png')
shutil.copy2(v/'selected-art'/'cg-landscape.jpg',root/'itch'/'cover-candidate.jpg')
rep=json.loads((refined/'capture-report.json').read_text())
assert all(c['complete'] and not c['errors'] and not c['failedActions'] and c['fed'] and c['duoPlay'] for c in rep['captures'])
def ff(*args):subprocess.run(['ffmpeg','-v','error','-y',*map(str,args)],check=True)
def montage(orient,keys,target):
    cap=next(c for c in rep['captures'] if c['name']==orient)
    times={x['name']:x['at'] for x in cap['marks']}
    dir=refined/orient;temp=v/'tmp';temp.mkdir(exist_ok=True)
    clips=[]
    for i,k in enumerate(keys):
        clip=temp/(orient+str(i)+'.mp4')
        ff('-ss',max(0,times[k]-.2),'-i',dir/'continuous.webm','-t',3.2,'-an','-vf','fps=25','-c:v','libx264','-preset','fast','-crf','21','-pix_fmt','yuv420p',clip)
        clips.append(clip.resolve())
    lst=temp/(orient+'.txt');lst.write_text('\n'.join("file '"+str(c)+"'" for c in clips))
    ff('-f','concat','-safe',0,'-i',lst,'-c','copy','-movflags','+faststart',target)
    for c in clips:c.unlink()
    lst.unlink()
# The corrected portrait region is included in the preview.
# Each preview remains authentic native capture, with real collection/bonding and normal combat.
chosen={'landscape':['two-cat-garden','capture','teaser','duo','real-exploration','active-battle'],'portrait':['two-cat-garden','capture','teaser','duo','real-exploration','active-battle']}
for o,keys in chosen.items():montage(o,keys,root/'crazygames'/('real-gameplay-'+o+'.mp4'))
shutil.copy2(root/'crazygames'/'real-gameplay-landscape.mp4',root/'itch'/'gameplay-preview.mp4')
land=next(c for c in rep['captures'] if c['name']=='landscape')
times={x['name']:x['at'] for x in land['marks']}
# Start immediately on the actual earned-capture result, then continuous care, duo, dex, workshop and exploration.
ff('-ss',max(0,times['capture']-.4),'-i',refined/'landscape'/'continuous.webm','-an','-c:v','libx264','-preset','fast','-crf','23','-pix_fmt','yuv420p','-movflags','+faststart',root/'y8'/'continuous.mp4')
# Keep full first-capture take as internal proof, not a second upload.
shutil.copy2(refined/'landscape'/'refined-continuous.mp4',v/'full-continuous-take.mp4')
def jpg(src,dst,wh=None):
    im=Image.open(src).convert('RGB')
    if wh:
        assert im.width*wh[1]==im.height*wh[0],str(src)
        im=im.resize(wh,Image.Resampling.LANCZOS)
    dst.parent.mkdir(parents=True,exist_ok=True)
    im.save(dst,quality=94,optimize=True)
# Replace weak empty-map and duplicate screenshots; keep native 4:3 and 720x1280 from corrected ZIP QA.
for scene in ['two-cat-garden','capture','duo','teaser','catdex','workshop','real-exploration','active-battle']:
    jpg(refined/'landscape'/(scene+'.png'),root/'itch'/'screenshots'/(scene+'.jpg'),(1280,720))
for old in ['exploration.jpg','battle.jpg','capture-result.jpg','companions.jpg']:
    (root/'itch'/'screenshots'/old).unlink(missing_ok=True)
alt=root/'y8'/'alternates'
if alt.exists():shutil.rmtree(alt)
alt.mkdir()
jpg(refined/'landscape'/'duo.png',root/'y8'/'widescreen.jpg',(1280,720))
jpg(Path('output/media/landscape-two-cat-garden.png'),root/'y8'/'landscape-promo.jpg',(1920,1080))
jpg(Path('portrait-fix-qa/vertical-garden.png'),root/'y8'/'portrait-promo.jpg',(1080,1920))
for s in ['capture','real-exploration']:
    jpg(refined/'landscape'/(s+'.png'),alt/('landscape-promo-'+s+'.jpg'))
for s in ['catdex','workshop','capture']:
    jpg(refined/'landscape'/(s+'.png'),alt/('widescreen-'+s+'.jpg'),(1280,720))
for s in ['capture-result','companions']:
    jpg(Path('output/media')/('vertical-'+s+'.png'),alt/('portrait-promo-'+s+'.jpg'))
# Separate stale earlier QA report from final evidence.
(v/'crosscheck.json').unlink(missing_ok=True)
for f in v.glob('*.b64.txt'):f.unlink()
for f in v.glob('*-frames.jpg'):f.unlink()
# Validate all actual primary assets independently.
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
specs={
'crazygames/cover-landscape.png':(1920,1080,0),'crazygames/cover-portrait.png':(800,1200,0),'crazygames/cover-square.png':(800,800,0),
'y8/standard.jpg':(760,570,2),'y8/game-card.jpg':(760,570,2),'y8/widescreen.jpg':(1280,720,5),'y8/landscape-promo.jpg':(1920,1080,5),'y8/portrait-promo.jpg':(1080,1920,5),
'gamepix/landscape.jpg':(1280,720,0),'gamepix/portrait.jpg':(720,1280,0),'gamepix/icon.png':(512,512,0),
'gamedistribution/square.png':(512,512,0),'gamedistribution/card.png':(512,384,0),'gamedistribution/small.png':(200,120,0)}
rows=[];errors=[]
for name,(w,h,mb) in specs.items():
    p=root/name;im=Image.open(p);ok=im.size==(w,h) and (not mb or p.stat().st_size<=mb*1e6);im.verify()
    rows.append({'file':name,'dimensions':[w,h],'bytes':p.stat().st_size,'sha256':sha(p),'pass':ok})
    if not ok:errors.append(name)
for name,wh,maxsec in [('crazygames/real-gameplay-landscape.mp4',(1920,1080),20),('crazygames/real-gameplay-portrait.mp4',(1080,1620),20),('y8/continuous.mp4',(1920,1080),None),('itch/gameplay-preview.mp4',(1920,1080),20)]:
    p=root/name;meta=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(p)]));s=next(x for x in meta['streams'] if x['codec_type']=='video');d=float(meta['format']['duration']);audio=any(x['codec_type']=='audio' for x in meta['streams'])
    ok=(s['width'],s['height'])==wh and s['codec_name']=='h264' and not audio and d>=15 and (maxsec is None or d<=maxsec) and p.stat().st_size<=50e6
    subprocess.run(['ffmpeg','-v','error','-i',str(p),'-f','null','-'],check=True)
    rows.append({'file':name,'dimensions':list(wh),'seconds':d,'bytes':p.stat().st_size,'sha256':sha(p),'hasAudio':audio,'pass':ok})
    if not ok:errors.append(name)
ziprows=[];refbytes={}
for p in sorted(root.rglob('*.zip')):
    with zipfile.ZipFile(p) as z:
        bad=z.testzip();names=z.namelist();art=[x for x in names if x.startswith('assets/mobile-portrait/duo/') and x.endswith('.webp')]
        ok=bad is None and 'index.html' in names and len(art)==63
        diff=[]
        for n in art:
            if z.read(n)!=(Path('source/public/cat-bond')/n).read_bytes():diff.append(n)
        ok=ok and not diff
        zrow={'file':str(p.relative_to(root)),'files':len(names),'bytes':p.stat().st_size,'sha256':sha(p),'portraitArtExact':len(art)-len(diff),'crcPass':bad is None,'pass':ok,'awaitingSdkId':'awaiting-sdk-id' in p.name}
        ziprows.append(zrow)
        if not ok:errors.append(str(p))
inv=json.loads(Path('inventory.json').read_text());mismatch=[]
for item in inv['sourceFiles']:
    b=(Path('source')/item['path']).read_bytes()
    if hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()!=item['gitBlob']:mismatch.append(item['path'])
if mismatch:errors.append('source provenance')
stand=json.loads((v/'standalone-qa.json').read_text());live=json.loads((v/'live-parity-final.json').read_text())
if not stand['pass']:errors.append('exact GamePix ZIP runtime')
if not json.loads(Path('portrait-fix-qa/report.json').read_text())['pass']:errors.append('portrait geometry QA')
if not all(t['pass'] for t in live['targets']):errors.append('actual public game parity')
expected=json.loads((v/'gamepix-build-report.json').read_text())['sha256']
if sha(root/'gamepix'/'cat-bond-gamepix-candidate.zip')!=expected:errors.append('GamePix ZIP differs from actual tested build')
# Contact sheets permit real visual review in Chat; no generated visual content.
def sheet(items,name,cell=(480,300),cols=2):
    w,h=cell;board=Image.new('RGB',(w*cols,(h+24)*((len(items)+cols-1)//cols)),'#222222');draw=ImageDraw.Draw(board)
    for i,(p,label) in enumerate(items):
        im=Image.open(p).convert('RGB');im.thumbnail((w-6,h-6),Image.Resampling.LANCZOS);x=i%cols*w;y=i//cols*(h+24);board.paste(im,(x+(w-im.width)//2,y+(h-im.height)//2));draw.text((x+4,y+h+3),label,fill='white')
    p=v/(name+'.jpg');board.save(p,quality=78,optimize=True);(v/(name+'.b64.txt')).write_text(base64.b64encode(p.read_bytes()).decode())
sheet([(root/x,x) for x in specs if 'cover' in x or 'gamedistribution/' in x or 'icon' in x],'final-cover-review',(360,300),3)
sheet([(root/x,x) for x in specs if 'y8/' in x or ('gamepix/' in x and 'icon' not in x)],'final-platform-screens',(380,320),3)
for o in ['landscape','portrait']:
    temp=v/'tmp'/o;temp.mkdir(parents=True,exist_ok=True)
    ff('-i',root/'crazygames'/('real-gameplay-'+o+'.mp4'),'-vf','fps=1/3,scale=480:-2','-frames:v',7,temp/'%02d.jpg')
    sheet([(p,o+' '+str(i*3)+'s') for i,p in enumerate(sorted(temp.glob('*.jpg')))],'final-'+o+'-frames',(480,270) if o=='landscape' else (300,450),2 if o=='landscape' else 3)
shutil.rmtree(v/'tmp',ignore_errors=True)
final={'sourceCommit':inv['sourceCommit'],'sourceBlobMatches':len(inv['sourceFiles'])-len(mismatch),'primaryFiles':rows,'zips':ziprows,'captureScenes':chosen,'technicalErrors':errors,'technicalPass':not errors,'standaloneVerified':stand['pass'],'publicParity':{t['name']:t['pass'] for t in live['targets']},'visualReviewPending':True,'sdkGate':{'y8':'actual App ID unavailable','gamedistribution':'actual game ID unavailable'},'portalSaved':False,'reviewSubmitted':False,'portraitViewportFix':'c0c9eef798870ac84ffd2442dc68ca085cf407cd','portraitGeometryQA':json.loads(Path('portrait-fix-qa/report.json').read_text())['pass'],'publicParityNote':'Prior parity evidence predates this unreleased web patch; verify again after approved production deployment.','knownVisualIssue':None}
(v/'final-verification.json').write_text(json.dumps(final,indent=2)+'\n')
print(json.dumps({'technicalPass':not errors,'errors':errors,'primaryFiles':len(rows),'zips':ziprows,'parity':final['publicParity']},indent=2))
if errors:raise SystemExit(1)
