"""Polish Cat Bond CrazyGames covers and previews from verified 63 original watercolor scenes.
Never synthesizes new cat subjects or uses recycled wrong-version media.
"""
import json
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path('public/promo/cat-bond')
PROOFS = Path('.check/crazygames')
PORTRAIT = PROOFS / 'cat-bond-original-duo-portrait.png'
LANDSCAPE = PROOFS / 'cat-bond-original-duo-landscape.png'
fontpath = '/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf'
for aspect in ('portrait', 'landscape'):
    data = json.loads((PROOFS / f'cat-bond-trim-{aspect}.json').read_text())
    assert data['originalArt'] is True and data['originalSceneCount'] == 63
    assert 'duo-storyboard-21x3-v3.webp' in data['artSource']
portrait = Image.open(PORTRAIT).convert('RGB')
landscape = Image.open(LANDSCAPE).convert('RGB')
assert portrait.size == (1080, 1620) and landscape.size == (1920, 1080)
ROOT.mkdir(parents=True, exist_ok=True)

def soften(picture, margin):
    mask = Image.new('L', picture.size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rectangle((margin, margin, picture.width - margin, picture.height - margin), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(margin * .70))
    picture = picture.convert('RGBA')
    picture.putalpha(mask)
    return picture

def paper(image, dimensions):
    blurred = image.resize(dimensions, Image.Resampling.BICUBIC).filter(ImageFilter.GaussianBlur(88)).convert('RGB')
    tint = Image.new('RGB', dimensions, (250, 242, 229))
    return Image.blend(blurred, tint, .76).convert('RGBA')

def title(image, center, font_size):
    font = ImageFont.truetype(fontpath, font_size)
    ImageDraw.Draw(image).text(center, 'Cat Bond', font=font, anchor='mm',
        fill=(255, 251, 239), stroke_width=3, stroke_fill=(43, 70, 55))

# Landscape crop removes peripheral HP/skill HUD; only authentic painted cats remain.
wide = paper(landscape, (1920, 1080))
art = landscape.crop((205, 95, 1645, 775)).resize((1780, 840), Image.Resampling.LANCZOS)
wide.alpha_composite(soften(art, 70), (70, 16))
title(wide, (960, 920), 160)
wide.convert('RGB').save(ROOT / 'cover-landscape.png', optimize=True)

portrait_cover = paper(portrait, (800, 1200))
art = portrait.crop((60, 465, 1025, 1100)).resize((790, 740), Image.Resampling.LANCZOS)
portrait_cover.alpha_composite(soften(art, 58), (5, 220))
title(portrait_cover, (400, 130), 92)
portrait_cover.convert('RGB').save(ROOT / 'cover-portrait.png', optimize=True)

square = paper(portrait, (800, 800))
art = portrait.crop((60, 465, 1025, 1100)).resize((800, 635), Image.Resampling.LANCZOS)
square.alpha_composite(soften(art, 55), (0, 38))
title(square, (400, 718), 91)
square.convert('RGB').save(ROOT / 'cover-square.png', optimize=True)

for filename, expected in [('cover-landscape.png', (1920, 1080)),
                           ('cover-portrait.png', (800, 1200)),
                           ('cover-square.png', (800, 800))]:
    with Image.open(ROOT / filename) as im:
        assert im.size == expected and im.mode == 'RGB', filename
    print('COVER READY', filename, (ROOT / filename).stat().st_size)

def probe(file):
    return json.loads(subprocess.check_output([
        'ffprobe', '-v', 'error', '-show_entries',
        'stream=codec_type,width,height:format=duration,size', '-of', 'json', str(file)]))

# Replace only the opening 0.5-second card. Preserve actual game footage.
for name, (width, height), cover in [
    ('real-gameplay-landscape.mp4', (1920, 1080), 'cover-landscape.png'),
    ('real-gameplay-portrait.mp4', (1080, 1620), 'cover-portrait.png')]:
    clip = ROOT / name
    info = probe(clip)
    assert any(s.get('codec_type') == 'video' and s.get('width') == width and s.get('height') == height for s in info['streams'])
    assert not any(s.get('codec_type') == 'audio' for s in info['streams'])
    assert 17.0 <= float(info['format']['duration']) <= 18.0
    target = clip.with_name(name + '.polished.mp4')
    scaling = f'fps=30,scale={width}:{height}:flags=lanczos,setsar=1'
    filt = (f'[0:v]{scaling},trim=duration=0.5,setpts=PTS-STARTPTS[c];'
            f'[1:v]{scaling},trim=duration=17,setpts=PTS-STARTPTS[g];'
            '[c][g]concat=n=2:v=1:a=0[v]')
    subprocess.run(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error',
        '-loop', '1', '-framerate', '30', '-t', '0.5', '-i', str(ROOT / cover),
        '-ss', '0.5', '-i', str(clip), '-filter_complex', filt,
        '-map', '[v]', '-an', '-c:v', 'libx264', '-preset', 'veryfast',
        '-crf', '24', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(target)],
        check=True, timeout=210)
    updated = probe(target)
    assert 15 < float(updated['format']['duration']) < 20
    assert not any(s.get('codec_type') == 'audio' for s in updated['streams'])
    assert any(s.get('width') == width and s.get('height') == height for s in updated['streams'])
    assert target.stat().st_size < 50_000_000
    target.replace(clip)
    print('REAL SILENT GAMEPLAY READY', name, updated['format']['duration'])

print('CAT BOND CANONICAL ORIGINAL-63 COVERS/PREVIEWS QA PASS')