import struct, pathlib
out=pathlib.Path('artifacts/starbell-story-trailer');out.mkdir(parents=True,exist_ok=True)
PPQ=480;events=[]
def ev(t,data):events.append((round(t*PPQ),bytes(data)))
def note(c,p,t,d,v):ev(t,[0x90+c,p,v]);ev(t+d,[0x80+c,p,0])
for c,p,v,pan in [(0,8,100,65),(1,46,82,45),(2,73,100,78),(3,48,85,64),(4,45,87,45),(5,0,88,72),(6,60,77,62),(7,14,94,74)]:
 ev(0,[0xc0+c,p]);ev(0,[0xb0+c,7,v]);ev(0,[0xb0+c,10,pan]);ev(0,[0xb0+c,91,42])
chords=[(53,57,60,64),(50,53,57,60),(58,62,65,69),(60,64,67,70),(53,57,60,65),(50,53,57,62),(55,58,62,65),(60,64,67,72),(58,62,65,69),(60,64,67,72),(57,60,64,69),(50,53,57,65),(58,62,65,70),(60,64,67,72),(50,53,57,60),(55,58,62,65),(60,64,67,72),(53,57,60,65)]
mel=[(77,81,84,81,79),(77,74,72,74),(77,79,81,82),(84,79,76,79),(81,84,86,84),(81,77,74,77),(79,82,86,84),(84,79,76,77),(77,81,82,86,84),(84,86,88,84,79),(81,84,88,89),(86,84,81,77,74),(82,84,86,89,86),(88,89,91,88,84),(81,77),(79,74),(76,79),(77,)]
for i,ch in enumerate(chords):
 t=i*4;quiet=i in (14,15,16);high=8<=i<=13
 if i in (0,15,17):
  note(7,77,t+.05,1.5,83);note(7,81,t+.65,1.65,77)
 if not quiet:
  for k,j in enumerate([0,2,1,3,2,1,2,3]):note(1,ch[j]+12,t+k*.5,.43,61+(8 if high else 0)+(k%2)*5)
  for k in range(4):note(4,ch[0]-12+(12 if k%2 else 0),t+k,.40,56+(12 if high else 0))
 for p in ch[:3]:note(3,p,t,3.88,36 if quiet else 47 if high else 38)
 phrase=mel[i];spacing=4/len(phrase)
 for k,p in enumerate(phrase):
  note(0 if i<2 or quiet else 2,p,t+k*spacing,spacing*.87,66 if quiet else 92 if high else 80)
  if high:note(5,p-12,t+k*spacing,spacing*.75,73)
 if high:
  for p in ch[:3]:note(6,p,t,1.65,62)
  for k in [0,2]:note(9,36,t+k,.12,80 if k==0 else 64)
  for k in [1,3]:note(9,38,t+k,.1,53)
  for k in [0,.5,1,1.5,2,2.5,3,3.5]:note(9,42,t+k,.08,37)
 if i==13:note(9,49,t,2,72)
 if i==17:
  for p in [53,60,65,69,77]:note(5,p,t,3.8,61)
def vlq(n):
 b=[n&127];n>>=7
 while n:b.insert(0,(n&127)|128);n>>=7
 return bytes(b)
track=bytearray(b'\x00\xff\x51\x03\x07\xa1\x20');last=0
for t,data in sorted(events,key=lambda x:x[0]):
 track+=vlq(t-last)+data;last=t
track+=vlq(max(0,72*PPQ-last))+b'\xff\x2f\x00'
(out/'score.mid').write_bytes(b'MThd'+struct.pack('>IHHH',6,0,1,PPQ)+b'MTrk'+struct.pack('>I',len(track))+track)
