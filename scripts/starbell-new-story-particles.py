import math, random, subprocess
from PIL import Image, ImageDraw, ImageFilter
W,H=540,960;r=random.Random(42)
pts=[(r.uniform(20,W-20),r.uniform(20,H-20),r.uniform(1,2.5),r.uniform(.4,1),r.uniform(0,6.28)) for _ in range(30)]
cmd=['ffmpeg','-hide_banner','-loglevel','error','-y','-f','rawvideo','-pixel_format','rgba','-video_size',f'{W}x{H}','-framerate','30','-i','-','-vf','scale=1080:1920:flags=bilinear','-c:v','qtrle','-pix_fmt','argb','artifacts/starbell-story-trailer/sparkles.mov']
p=subprocess.Popen(cmd,stdin=subprocess.PIPE)
for i in range(150):
 t=i/30;im=Image.new('RGBA',(W,H));d=ImageDraw.Draw(im)
 for x,y,s,v,ph in pts:
  yy=(y-t*(8+v*7))%H;xx=x+math.sin(ph+t*.7)*8
  a=int(55+70*(1+math.sin(ph+t*1.2))/2)
  d.ellipse((xx-s,yy-s,xx+s,yy+s),fill=(255,233,171,a))
 im=im.filter(ImageFilter.GaussianBlur(.65));p.stdin.write(im.tobytes())
p.stdin.close()
if p.wait()!=0:raise RuntimeError('Particle encode failed')
