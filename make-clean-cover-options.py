from PIL import Image,ImageOps,ImageDraw,ImageFont,ImageFilter
from pathlib import Path
import base64,json
root=Path('qa-output/clean-cover-options');root.mkdir(parents=True,exist_ok=True)
art=Path('source/public/cat-bond/assets/mobile-portrait/duo')
names=['grass-light-tier-1','light-light-tier-1','light-water-tier-1','fire-light-tier-1','grass-grass-tier-1']
font='/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'
def title_only(im,wh):
    im=ImageOps.fit(im,wh,Image.Resampling.LANCZOS,centering=(.5,.48))
    draw=ImageDraw.Draw(im);w,h=im.size
    f=ImageFont.truetype(font,round(w*.094 if w>h else w*.108))
    txt='Cat Bond'
    box=draw.textbbox((0,0),txt,font=f,stroke_width=1)
    x=(w-(box[2]-box[0]))/2-box[0]; y=round(h*.055)-box[1]
    # Title only, matching the original warm cream-and-brown cover palette.
    draw.text((x,y),txt,font=f,fill='#604424',stroke_width=max(2,round(w*.003)),stroke_fill='#fff4d5')
    return im
def sheet(items,path,w=360,h=260,n=3):
    board=Image.new('RGB',(w*n,(h+22)*((len(items)+n-1)//n)),'#292929');d=ImageDraw.Draw(board)
    for i,p in enumerate(items):
        im=Image.open(p).convert('RGB');im.thumbnail((w-8,h-8),Image.Resampling.LANCZOS);x=i%n*w;y=i//n*(h+22);board.paste(im,(x+(w-im.width)//2,y+(h-im.height)//2));d.text((x+4,y+h+4),p.name,fill='white')
    board.save(path,quality=79,optimize=True);path.with_suffix('.b64.txt').write_text(base64.b64encode(path.read_bytes()).decode())
for name in names:
    source=art/(name+'.webp')
    if not source.exists():continue
    im=Image.open(source).convert('RGB')
    for fmt,wh in [('landscape',(1920,1080)),('portrait',(800,1200)),('square',(800,800))]:
        p=root/(name+'-'+fmt+'.jpg');title_only(im,wh).save(p,quality=94,optimize=True)
    # Clean GD art from original in-game paintings; small has no logo.
    for fmt,wh in [('gd-square',(512,512)),('gd-card',(512,384)),('gd-small',(200,120))]:
        ImageOps.fit(im,wh,Image.Resampling.LANCZOS,centering=(.5,.48)).save(root/(name+'-'+fmt+'.jpg'),quality=95,optimize=True)
for fmt in ['landscape','portrait','square','gd-small']:
    sheet(sorted(root.glob('*-'+fmt+'.jpg')),root/(fmt+'-review.jpg'),360,270 if fmt!='portrait' else 420,3)
# Preserve existing approved illustration files untouched. Also prepare an art-only small thumbnail
# from the hero section of the approved illustration, eliminating both logo and feature panels.
im=Image.open('approved-covers/cover-square.jpg').convert('RGB')
for i,rect in enumerate([(100,142,650,472),(130,130,680,460),(150,145,650,445)]):
    im.crop(rect).resize((200,120),Image.Resampling.LANCZOS).save(root/('approved-hero-small-'+str(i)+'.jpg'),quality=95,optimize=True)
sheet(sorted(root.glob('approved-hero-small-*.jpg')),root/'approved-hero-small-review.jpg',300,200,3)
(root/'README.md').write_text('Candidates derived from real in-game original paintings and the approved cover art. No new generated artwork. CrazyGames title-only alternatives; GameDistribution small thumbnails have no text or logos. Select only after inspecting actual composition. Original user-approved three covers are preserved.\n')
