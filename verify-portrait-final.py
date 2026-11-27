from pathlib import Path
import json, hashlib, subprocess
from PIL import Image
r=Path('release-media');v=r/'_verification';p=v/'final-verification.json';j=json.loads(p.read_text())
qa=json.loads(Path('portrait-fix-qa/report.json').read_text())
assert qa['pass'] and all(x['pass'] for x in qa['tests'])
assert j['technicalPass'] and not j['technicalErrors']
capture=json.loads((v/'refined-capture-report.json').read_text())
assert capture['fix']==qa['fix'] and all(x['complete'] and not x['errors'] and not x['failedActions'] for x in capture['captures'])
video=r/'y8/continuous.mp4'
assert video.read_bytes()==(v/'full-continuous-take.mp4').read_bytes()
meta=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(video)]))
s=next(x for x in meta['streams'] if x['codec_type']=='video');d=float(meta['format']['duration'])
assert (s['width'],s['height'])==(1920,1080) and s['codec_name']=='h264' and not any(x['codec_type']=='audio' for x in meta['streams'])
assert 15<=d and video.stat().st_size<=50_000_000
subprocess.run(['ffmpeg','-v','error','-i',str(video),'-f','null','-'],check=True)
sha=lambda x:hashlib.sha256(x.read_bytes()).hexdigest()
for item in j['primaryFiles']:
    if item['file']=='y8/continuous.mp4':
        item.update(seconds=d,bytes=video.stat().st_size,sha256=sha(video),pass_=True)
        item.pop('pass_',None)
    assert sha(r/item['file'])==item['sha256'],item['file']
for item in j['zips']:assert sha(r/item['file'])==item['sha256']
# Additional screenshots and alternates: validate actual image bytes, not only the primary 18.
extra=[]
for f in sorted(list((r/'itch/screenshots').glob('*.jpg'))+list((r/'y8/alternates').glob('*.jpg'))):
    im=Image.open(f);wh=list(im.size);im.verify()
    assert f.stat().st_size<=5_000_000 and min(wh)>=720
    extra.append({'file':str(f.relative_to(r)),'dimensions':wh,'bytes':f.stat().st_size,'sha256':sha(f)})
j.update(visualReviewPending=False,additionalImages=extra,visualReview={'decision':'Viewport defect closed for local release candidate; four contact sheets reviewed.','reviewed':['final-cover-review.jpg','final-platform-screens.jpg','final-landscape-frames.jpg','final-portrait-frames.jpg'],'scope':'Observed full-bleed GamePix and corrected portrait exploration; original unmodified cover art. The screenshots show real interface panels, not actual duo burst cinematic or SSR capture.','remaining':['Signed-in portal preview, SDK IDs, draft save and public website rollout/parity are not validated.','Browser QA samples canvas coverage and checks real input target/camera transforms, not a physical-device matrix or every region.']},productionParityAfterFix=False)
p.write_text(json.dumps(j,indent=2)+'\n')
(v/'visual-review.md').write_text('# Portrait correction visual re-review\n\nReviewed all four regenerated contact sheets. GamePix portrait no longer has the top/bottom webpage margins; corrected portrait exploration fills its viewport; landscape also covers the old thin edge. Genuine capture includes garden, ordinary battle, earned cat, care, duo menu, workshop and region exploration. Y8 now uses the complete continuous take including first battle. No actual SSR or full cinematic duo burst was recorded; no claim of either. All 6 viewport tests and 3 standalone capture/save tests passed, plus primary media and archive hashes, and additional image decoding.\n\nNo signed-in portal preview or draft save, no actual SDK IDs, no production deployment. Previous public parity predates this patch. Browser testing is not physical-device or exhaustive all-region testing.\n')
Path('RELEASE-HOLD.md').write_text('# Portrait correction — local QA passed; portal gates remain\n\nOnly the newly verified release-media files should be used. Old output directories are historical evidence, not upload material. The website patch is in source-overlay/public/cat-bond and is not deployed. CrazyGames and itch public parity must be reverified after explicit rollout approval. Y8 and GameDistribution await actual SDK IDs and platform SDK verification. No existing draft has been saved.\n')
print(json.dumps({'completeY8Seconds':d,'primaryFiles':len(j['primaryFiles']),'additionalImages':len(extra),'zips':len(j['zips']),'localQA':True}))
