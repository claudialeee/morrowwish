import subprocess, array, math, json
from pathlib import Path
p=Path('artifacts/starbell-story-trailer')
src=str(p/'soar.mp3')
duration=24.5
pcm=subprocess.check_output(['ffmpeg','-v','error','-i',src,'-ac','1','-ar','8000','-f','s16le','-'])
s=array.array('h',pcm)
n=len(s)//8000
assert n>=26
e=[math.sqrt(sum(x*x for x in s[i*8000:(i+1)*8000])/8000) for i in range(n)]
def avg(xs): return sum(xs)/max(1,len(xs))
# Select a naturally quieter opening with a later musical lift; avoid a loud cold start.
def rating(i):
 early=avg(e[i:i+4]); late=avg(e[i+15:i+21]); mid=avg(e[i+5:i+10])
 return math.log((late+30)/(early+30))+0.25*math.log((mid+30)/(early+30))+0.10*math.log(late+30)
candidates=[i for i in range(n-25) if avg(e[i:i+4])>60 and avg(e[i+15:i+21])>150]
assert candidates, 'No suitable musical passage'
start=max(candidates,key=rating)
# Gain starts quiet, gradually opens with story hook, peaks at combat, and fades out.
env="if(lt(t,4),0.16+0.20*t/4,if(lt(t,14.5),0.36+0.64*(t-4)/10.5,1))"
af="volume='"+env+"':eval=frame,afade=t=in:d=1.4,afade=t=out:st=22:d=2.5,alimiter=limit=0.84:level=false"
subprocess.run(['ffmpeg','-v','error','-y','-ss',str(start),'-i',src,'-t',str(duration),'-af',af,'-ar','44100','-ac','2',str(p/'score.wav')],check=True)
raw=array.array('h',subprocess.check_output(['ffmpeg','-v','error','-i',str(p/'score.wav'),'-ac','1','-ar','8000','-f','s16le','-']))
def rms(a,b):
 z=raw[int(a*8000):int(b*8000)];return math.sqrt(sum(x*x for x in z)/len(z))
opening=rms(0,3);battle=rms(15,20)
db=20*math.log10((battle+1)/(opening+1))
assert db>=8, f'Opening too loud: battle lift {db:.1f}dB'
proof={'sourceStartSeconds':start,'duration':duration,'fadeInSeconds':1.4,'gainRampEndsAt':14.5,'fadeOutSeconds':2.5,'openingRms':round(opening,2),'battleRms':round(battle,2),'battleLiftDb':round(db,2)}
(p/'score-proof.json').write_text(json.dumps(proof))
print('SCORE GRADUAL BUILD',proof,flush=True)
