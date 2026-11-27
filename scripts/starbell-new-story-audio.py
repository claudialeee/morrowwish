import math, wave, array
from pathlib import Path
out=Path('artifacts/starbell-story-trailer')
out.mkdir(parents=True,exist_ok=True)
sr=44100
duration=40
samples=[0.0]*(sr*duration)
# Original bell signature: two delicate notes, repeated at the final reveal.
for onset,hz,amp in [(0.14,784,.28),(.63,1046.5,.24),(30.9,784,.27),(31.42,1046.5,.25),(36.8,1046.5,.12)]:
    for i in range(int(sr*2.4)):
        j=int(onset*sr)+i
        if j>=len(samples): break
        t=i/sr
        env=min(1,t/.012)*math.exp(-2.6*t)
        val=sum(a*math.sin(2*math.pi*hz*r*t)*math.exp(-d*t) for r,a,d in [(1,1,0),(2.01,.23,2.1),(3.05,.12,3.2),(4.2,.06,4.4)])
        samples[j]+=amp*env*val
with wave.open(str(out/'bell-cues.wav'),'wb') as w:
    w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr)
    w.writeframes(array.array('h',(int(max(-.98,min(.98,x))*32767) for x in samples)).tobytes())
