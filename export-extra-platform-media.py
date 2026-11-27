#!/usr/bin/env python3
from pathlib import Path
from PIL import Image,ImageOps
import json,hashlib,shutil
root=Path('qa-output')
out=root/'platform-media'
def pic(src,dest,wh,fit=False):
    source=Path(src); dst=out/dest; dst.parent.mkdir(parents=True,exist_ok=True)
    im=Image.open(source).convert('RGB')
    if not fit and im.width*wh[1]!=im.height*wh[0]: raise ValueError(f'Wrong native ratio: {source}')
    if fit: im=ImageOps.fit(im,wh,Image.Resampling.LANCZOS)
    else: im=im.resize(wh,Image.Resampling.LANCZOS)
    im.save(dst,quality=94,optimize=True) if dst.suffix=='.jpg' else im.save(dst,optimize=True)
    return {'file':str(dst),'source':str(source),'size':list(im.size),'bytes':dst.stat().st_size,'sha256':hashlib.sha256(dst.read_bytes()).hexdigest(),'visualApproval':False,'cropped':fit}
rows=[]
for name,wh in [('landscape',(1920,1080)),('portrait',(800,1200)),('square',(800,800))]:
    rows.append(pic('approved-covers/cover-'+name+'.jpg','crazygames/cover-'+name+'.png',wh))
for dest,source,wh,fit in [
('gamedistribution/square.png','approved-covers/cover-square.jpg',(512,512),False),
('gamedistribution/card.png','approved-covers/cover-landscape.jpg',(512,384),True),
('gamedistribution/small.png','approved-covers/cover-landscape.jpg',(200,120),True),
('gamepix/icon.png','approved-covers/cover-square.jpg',(512,512),False),
('gamepix/landscape.jpg','qa-output/desktop-garden.png',(1280,720),False),
('gamepix/portrait.jpg','qa-output/gamepix-portrait-garden.png',(720,1280),False),
('y8/standard.jpg','qa-output/y8-standard-garden.png',(760,570),False),
('y8/game-card.jpg','qa-output/y8-standard-companions.png',(760,570),False),
('y8/widescreen.jpg','qa-output/desktop-garden.png',(1280,720),False)
]:
    if Path(source).exists():
        rows.append(pic(source,dest,wh,fit))
(root/'media-crosscheck.json').write_text(json.dumps({'assets':rows,'visualApproval':False,'note':'GD card/small original art crops require visual composition verification; no AI redrawing or gameplay misrepresentation.'},indent=2)+'\n')
print(len(rows),'platform candidate images')
