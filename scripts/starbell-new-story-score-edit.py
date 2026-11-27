import subprocess, wave, array, math
from pathlib import Path
p=Path('artifacts/starbell-story-trailer')
src=str(p/'soar.mp3')
# Choose a continuous passage with an audible crescendo; never loop or synthesize the music.
pcm=subprocess.check_output(['ffmpeg','-v','error','-i',src,'-ac','1','-ar','8000','-f','s16le','-'])
s=array.array('h',pcm)
n=len(s)//8000
assert n>=42
e=[math.sqrt(sum(x*x for x in s[i*8000:(i+1)*8000])/8000) for i in range(n)]
def rating(i):
 a=sum(e[i:i+7])/7;b=sum(e[i+14:i+28])/14
 return b+0.7*(b-a)-0.4*abs(e[i+28]-e[i+31])
start=max(range(max(1,n-42)),key=rating)
print('Selected continuous orchestral excerpt',start,'seconds, source',n,flush=True)
subprocess.run(['ffmpeg','-v','error','-y','-ss',str(start),'-i',src,'-t','42','-af',"afade=t=in:d=0.15,afade=t=out:st=39.5:d=2.5",'-ar','44100','-ac','2',str(p/'score.wav')],check=True)
