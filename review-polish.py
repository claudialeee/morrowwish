from pathlib import Path
from PIL import Image,ImageDraw
import base64,json,hashlib
root=Path('output/refined');covers=root/'gd-hero-covers';covers.mkdir(parents=True,exist_ok=True)
# Crop the original illustrated hero panels only, never the fine-print infographic panels.
# Exact artwork composition is visually inspected before approval.
choices=[('square','portrait',(100,0,700,600),(512,512)),('card','square',(100,0,700,450),(512,384)),('small','square',(25,0,775,450),(200,120))]
for name,src,rect,wh in choices:
    im=Image.open('approved-covers/cover-'+src+'.jpg').convert('RGB')
    im.crop(rect).resize(wh,Image.Resampling.LANCZOS).save(covers/(name+'.png'),optimize=True)
def sheet(items,name,w,h,n):
    if not items:return
    board=Image.new('RGB',(w*n,(h+22)*((len(items)+n-1)//n)),'#222222');d=ImageDraw.Draw(board)
    for i,p in enumerate(items):
        im=Image.open(p).convert('RGB');im.thumbnail((w-6,h-6),Image.Resampling.LANCZOS);x=i%n*w;y=i//n*(h+22);board.paste(im,(x+(w-im.width)//2,y+(h-im.height)//2));d.text((x+3,y+h+3),p.stem,fill='white')
    p=root/(name+'.jpg');board.save(p,quality=78,optimize=True);(root/(name+'.b64.txt')).write_text(base64.b64encode(p.read_bytes()).decode())
for orient in ['landscape','portrait']:sheet(sorted((root/orient).glob('*.png')),orient+'-review',480 if orient=='landscape' else 320,270 if orient=='landscape' else 480,2 if orient=='landscape' else 3)
sheet(sorted(covers.glob('*.png')),'gd-cover-review',380,300,3)
