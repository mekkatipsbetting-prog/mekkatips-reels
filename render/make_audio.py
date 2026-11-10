import sys, numpy as np, wave
sr=44100; D=27; n=sr*D; t=np.arange(n)/sr
rng=np.random.default_rng(3)
L=np.zeros(n); 
def add(sig,at,gain=1.0):
    i=int(at*sr); e=min(n,i+len(sig)); 
    if i<n: L[i:e]+=sig[:e-i]*gain
def tt(d): return np.arange(int(d*sr))/sr
def kick():
    x=tt(.35); f=110*np.exp(-x*18)+45; return np.sin(2*np.pi*np.cumsum(f)/sr)*np.exp(-x*9)
def hat():
    x=tt(.08); nz=rng.standard_normal(len(x)); nz=np.diff(nz,prepend=0); return nz*np.exp(-x*55)*.5
def clap():
    x=tt(.2); nz=rng.standard_normal(len(x)); return nz*np.exp(-x*22)*.5
def pad(freqs,d):
    x=tt(d); s=sum(np.sin(2*np.pi*f*x)+.4*np.sin(2*np.pi*2*f*x) for f in freqs)/len(freqs)
    env=np.minimum(1,x/.15)*np.minimum(1,(d-x)/.25); return s*env
def bass(f,d):
    x=tt(d); return np.sin(2*np.pi*f*x)*np.exp(-x*2.2)*np.minimum(1,x/.01)
def swish(d=.55,up=True):
    x=tt(d); nz=rng.standard_normal(len(x)); 
    # filtro simple por media movil variable
    out=np.zeros_like(nz); k=np.linspace(40,3,len(x)) if up else np.linspace(3,40,len(x))
    acc=0
    for i in range(len(x)): a=1/k[i]; acc+=a*(nz[i]-acc); out[i]=acc
    env=np.sin(np.pi*x/d)**2; return out*env*3.2
def ding(f=1318,d=.9):
    x=tt(d); return (np.sin(2*np.pi*f*x)+.5*np.sin(2*np.pi*f*2.01*x))*np.exp(-x*5)*.5
bpm=100; b=60/bpm
chords=[[220,261.6,329.6],[174.6,220,261.6],[261.6,329.6,392],[196,246.9,293.7]]; roots=[55,43.65,65.4,49]
bars=int(D/(4*b))+1
for bar in range(bars):
    t0=bar*4*b; c=bar%4
    add(pad(chords[c],4*b),t0,.22); add(bass(roots[c],2*b),t0,.6); add(bass(roots[c],2*b),t0+2*b,.5)
    for beat in range(4):
        tb=t0+beat*b
        if t0>=1.0 or beat==0: add(kick(),tb,.75) if beat in(0,2) or (beat==3 and bar%2) else None
        if beat in(1,3) and tb>3.5: add(clap(),tb,.35)
        if tb>3.5:
            add(hat(),tb+b/2,.5)
            if beat%2==0: add(hat(),tb+b/4,.25)
# transiciones y hits
for tr in [3.5,7,12,17,21]: add(swish(.6,True),tr-.45,.55)
add(swish(.5,True),12+.35,.5)       # OVER aparece
add(ding(),12+.6,.35)
add(ding(1568),17+1.6,.45); add(ding(2093,1.2),17+1.75,.3)   # resultado cumplio
add(swish(.5,False),21+.2,.4)
add(ding(1568,1.2),21+4.3,.35)
# fade out
L*=np.clip((D-t)/1.2,0,1)*np.clip(t/.1,0,1)
L=np.tanh(L*1.1); L=L/np.max(np.abs(L))*.85
st=(np.stack([L,L],1)*32767).astype('<i2')
w=wave.open(sys.argv[1] if len(sys.argv)>1 else "audio.wav",'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr); w.writeframes(st.tobytes()); w.close()
