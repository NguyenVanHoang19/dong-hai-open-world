"""Original procedural sound pack for Dong Hai. Python 3 + NumPy; no source recordings."""
from pathlib import Path
import json, wave, hashlib, sys, subprocess
import numpy as np
OUT=Path(sys.argv[1]);OUT.mkdir(parents=True,exist_ok=True)
SR=32000
rng=np.random.default_rng(20260910)
manifest=[]
def write(name,samples,description,loop=False):
 a=np.asarray(samples,dtype=np.float64)
 a=np.nan_to_num(a);peak=float(np.max(np.abs(a)))
 if peak>.85:a*=.85/peak
 a=np.clip(a,-.95,.95);pcm=np.round(a*32767).astype('<i2')
 path=OUT/(name+'.wav')
 with wave.open(str(path),'wb') as w:w.setnchannels(1 if a.ndim==1 else a.shape[1]);w.setsampwidth(2);w.setframerate(SR);w.writeframes(pcm.tobytes())
 if loop:
  encoded=OUT/(name+'.mp3');subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(path),'-codec:a','libmp3lame','-b:a','96k',str(encoded)],check=True);path.unlink();path=encoded
 manifest.append({'id':name,'file':path.name,'seconds':len(a)/SR,'sampleRate':SR,'channels':1 if a.ndim==1 else a.shape[1],'peak':float(np.max(np.abs(a))),'loop':loop,'description':description,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
def noise(n,window=1):
 a=rng.standard_normal(n+window)
 if window>1:
  c=np.concatenate(([0.],np.cumsum(a)));a=(c[window:]-c[:-window])/np.sqrt(window)
 return a[:n]
def fade(a,seconds=.012):
 n=min(int(SR*seconds),len(a)//2);e=np.ones(len(a));e[:n]=np.linspace(0,1,n);e[-n:]=np.linspace(1,0,n)
 return a*(e if a.ndim==1 else e[:,None])
def note(freq,length,kind='pluck'):
 t=np.arange(int(length*SR))/SR
 if kind=='pad':a=(np.sin(2*np.pi*freq*t)+.24*np.sin(2*np.pi*freq*2*t))*.08*np.sin(np.pi*t/length)**2
 else:a=(np.sin(2*np.pi*freq*t)+.3*np.sin(2*np.pi*freq*2*t)*np.exp(-t*3)+.1*np.sin(2*np.pi*freq*3*t)*np.exp(-t*7))*.22*np.exp(-t*2.3)
 return fade(a)
def add(dst,src,start,pan=0):
 i=int(start*SR);j=min(len(dst),i+len(src));a=src[:j-i]
 dst[i:j,0]+=a*np.sqrt((1-pan)/2);dst[i:j,1]+=a*np.sqrt((1+pan)/2)
# 16 bars, 80 BPM. Pentatonic melody composed for this project, with space for game sounds.
length=48;music=np.zeros((length*SR,2));beat=.75
melody=[62,65,69,67,65,62,60,62, 65,67,72,69,67,65,62,60, 62,69,74,72,69,67,65,62, 60,62,65,67,65,62,60,62]
for bar in range(16):
 chord=[[50,57,62],[48,55,60],[46,53,58],[48,55,60]][bar//4]
 for midi in chord:add(music,note(440*2**((midi-69)/12),3,'pad'),bar*3,0)
 for k in range(2):
  midi=melody[(bar*2+k)%len(melody)];add(music,note(440*2**((midi-69)/12),1.6),bar*3+k*1.5+.05,(-.3 if k==0 else .3))
# Tail is quiet and both boundaries reach zero to avoid a loop click.
write('village-music',fade(music,.2),'Original 48-second pentatonic instrumental loop',True)
# Soft wind and distant sea, no recognizable sampled recordings.
for name,seconds,level,window in [('village-air',12,.022,90),('coast-surf',12,.035,22)]:
 t=np.arange(seconds*SR)/SR;stereo=np.column_stack([noise(len(t),window),noise(len(t),window)])
 mod=.5+.5*np.sin(2*np.pi*t/6-.9)**2
 stereo*=level*mod[:,None]
 if name=='village-air':
  for start in [1.3,4.1,7.4,10.2]:
   n=int(.17*SR);u=np.arange(n)/SR;bird=np.sin(2*np.pi*(1700*u+600*u*u))*.021*np.sin(np.pi*u/.17)**2;add(stereo,bird,start,.5 if start<6 else -.5)
 write(name,fade(stereo,.35),'Procedural wind and birds' if name=='village-air' else 'Procedural soft surf',True)
for surface in ['road','dirt']:
 for v in range(3):
  t=np.arange(int(.2*SR))/SR;a=noise(len(t),7 if surface=='road' else 28)*np.exp(-t*32)*(.15 if surface=='road' else .12)
  a+=np.sin(2*np.pi*(100+v*17)*t)*np.exp(-t*42)*.16
  at=int(.048*SR);a[at:]+=noise(len(a)-at,4 if surface=='road' else 16)*np.exp(-np.arange(len(a)-at)/SR*40)*.05
  write('step-'+surface+'-'+str(v+1),fade(a,.005),'Footstep '+surface+' variation '+str(v+1))
for name,freq,duration in [('ui',660,.08),('interact',520,.18),('mount',220,.17),('dismount',170,.17),('jump',180,.18),('land',85,.23)]:
 t=np.arange(int(duration*SR))/SR;a=np.sin(2*np.pi*(freq*t+(220*t*t if name=='jump' else 0)))*np.exp(-t*18)*.17
 if name in ['mount','dismount','land']:a+=noise(len(t),12)*np.exp(-t*24)*.12
 write(name,fade(a,.005),'Original '+name+' cue')
for name,notes in [('purchase',[72,76]),('quest',[62,65,69,74])]:
 a=np.zeros((int(1.2*SR),2))
 for i,m in enumerate(notes):add(a,note(440*2**((m-69)/12),.5),i*.16)
 write(name,fade(a),'Original '+name+' confirmation')
(OUT/'manifest.json').write_text(json.dumps({'authoring':'Original procedural audio authored for this project; no external samples or music.','generator':'scripts/generate-audio.py','seed':20260910,'assets':manifest},indent=2)+'\n')
print(json.dumps({'assets':len(manifest),'bytes':sum((OUT/a['file']).stat().st_size for a in manifest),'durationMusic':48}))
