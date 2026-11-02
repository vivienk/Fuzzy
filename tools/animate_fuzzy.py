import sys, math
from pathlib import Path
sys.path.insert(0,'work/video-deps')
from PIL import Image,ImageDraw,ImageFont
import imageio_ffmpeg
W,H=1280,720;FPS=15;OUT='outputs/05-Fuzzy-Animated-Concept-Demo.mp4'
BG='#FFF6EC';INK='#4A3426';MUT='#8A6A55';ACC='#AE5948'
fontdir='/System/Library/Fonts/Supplemental/'
def font(s,b=False):return ImageFont.truetype(fontdir+('Arial Rounded Bold.ttf' if b else 'Arial.ttf'),s)
F={s:font(s) for s in [16,18,20,22,24,28,32]};B={s:font(s,True) for s in [18,20,24,32,42,50]}
sheets=[Image.open('outputs/fuzzy-lowpoly-create.png').convert('RGB'),Image.open('outputs/fuzzy-lowpoly-send.png').convert('RGB'),Image.open('outputs/fuzzy-lowpoly-keep.png').convert('RGB')]
def panel(theme,step):
 idx,col,cols=(0,step,3) if step<3 else ((1,step-3,2) if step<5 else (2,step-5,2))
 a=sheets[idx];cw=a.width/cols;ch=a.height/2
 return a.crop((round(col*cw+3),round(theme*ch+3),round((col+1)*cw-3),round((theme+1)*ch-3)))
arts={(t,s):panel(t,s) for t in range(2) for s in range(7)}
def ease(x):x=max(0,min(1,x));return 1-(1-x)**3
def text(d,tx,xy,size=22,b=False,fill=INK):d.text(xy,tx,font=(B if b else F)[size],fill=fill)
def wrap(d,tx,x,y,width,size=24,b=False):
 f=(B if b else F)[size];line=''
 for word in tx.split():
  nl=(line+' '+word).strip()
  if d.textlength(nl,font=f)>width:
   d.text((x,y),line,font=f,fill=INK);y+=size*1.38;line=word
  else:line=nl
 if line:d.text((x,y),line,font=f,fill=INK)
def art(im,a,box,zoom=1):
 x,y,w,h=box;scale=min(w/a.width,h/a.height)*zoom
 r=a.resize((int(a.width*scale),int(a.height*scale)),Image.Resampling.LANCZOS)
 canvas=Image.new('RGB',(w,h),BG);canvas.paste(r,((w-r.width)//2,(h-r.height)//2));im.paste(canvas,(x,y))
def base(step,theme=None):
 im=Image.new('RGB',(W,H),BG);d=ImageDraw.Draw(im)
 text(d,'fuzzy',(46,28),32,True)
 d.rounded_rectangle((880,28,1234,64),18,fill='#F9DECF');text(d,'CONCEPT ANIMATION / SIMULATED',(897,38),16,fill=ACC)
 if theme is not None:text(d,['HALLOWEEN','CHRISTMAS'][theme],(48,112),18,True,ACC)
 text(d,step if step not in ['INTRO','END'] else '',(48,650),20,True)
 text(d,'Illustrative AI-world experience. Not a working app recording.',(48,687),16,fill=MUT)
 return im,d
prompts=['Make a cozy pumpkin garden for my best friend, with a friendly ghost hiding my note.','Make a snowy Christmas cottage for my sister, with a glowing tree and a gift to open.']
segments=[('intro',None,3)]
for t in range(2):segments += [('prompt',t,3),('generate',t,4),('send',t,3),('unwrap',t,4),('play',t,3)]
segments += [('keep',None,5),('end',None,3)]
writer=imageio_ffmpeg.write_frames(OUT,(W,H),fps=FPS,codec='libx264',quality=8,macro_block_size=16,output_params=['-movflags','+faststart','-metadata','title=Fuzzy - Animated concept demo (simulated)']);writer.send(None)
frame_no=0
for kind,t,dur in segments:
 for n in range(dur*FPS):
  u=n/(dur*FPS-1);im,d=base(kind.upper(),t)
  if kind in ['intro','end']:
   text(d,'Send your loved ones a 3D card',(48,113),42,True)
   art(im,arts[0,2],(80,195,500,390),1+.025*math.sin(u*math.pi))
   art(im,arts[1,2],(700,195,500,390),1+.025*math.sin(u*math.pi))
   text(d,'A little world. A personal message. A feeling you can keep.',(48,603),24)
   text(d,'Fuzzy / V1 Concept & Design',(48,650),20,True)
  elif kind=='prompt':
   wrap(d,'Start with someone you love.',48,161,590,42,True)
   d.rounded_rectangle((48,301,613,488),22,fill='white',outline='#E8D8CB',width=2)
   typed=prompts[t][:int(len(prompts[t])*min(1,u*1.7))]
   wrap(d,typed+('|' if n%15<8 else ''),70,326,520,24)
   d.rounded_rectangle((48,525,322,579),25,fill=ACC);text(d,'Generate my world',(72,541),20,True,'white')
   art(im,arts[t,0],(670,167,550,440),1+.02*u)
  elif kind=='generate':
   wrap(d,'Your words become a world.',48,164,570,42,True)
   wrap(d,'AI chooses the scene, objects, lighting, and a place for your note.',48,299,535,24)
   d.rounded_rectangle((48,447,600,465),9,fill='#E8D8CB')
   d.rounded_rectangle((48,447,48+int(552*ease(u)),465),9,fill=ACC)
   text(d,'Simulated generation sequence',(48,490),18,fill=MUT)
   a=arts[t,2].resize((480,480));xx,yy=710,135
   for row in range(4):
    for col in range(4):
     lag=(row*4+col)/35;p=ease((u-lag)*2.3)
     if p<=0:continue
     tile=a.crop((col*120,row*120,(col+1)*120,(row+1)*120))
     x=xx+col*120+int((col-1.5)*65*(1-p));y=yy+row*120-int(160*(1-p))
     if x>=0 and y>=0:im.paste(tile,(x,y))
  elif kind=='send':
   wrap(d,'Send a little surprise.',48,165,555,42,True)
   wrap(d,'A personal world travels to someone you love.',48,302,530,24)
   text(d,'Illustrative delivery',(48,443),18,fill=MUT)
   art(im,arts[t,3],(670+int(12*math.sin(u*math.pi*2)),145,550,460),1+.03*u)
   for j in range(5):
    x=120+j*90;d.ellipse((x,500,x+10,510),fill=ACC if u>j/6 else '#E8D8CB')
  elif kind=='unwrap':
   wrap(d,'Open a world made for you.',48,165,560,42,True)
   wrap(d,['“A tiny spooky place, just for you.”','“A little Christmas warmth from me to you.”'][t],48,316,540,28)
   art(im,arts[t,4],(670,143,550,470),1+.04*ease(u))
   # Gift-front cover slides away, revealing the illustrated scene.
   if u<.4:
    p=ease(u/.4);x=750;y=180+int(p*450)
    d=ImageDraw.Draw(im);d.rounded_rectangle((x,y,x+360,y+330),18,fill='#E59B64' if t==0 else '#C85D50');d.rectangle((x+164,y,x+196,y+330),fill='#F5D38C')
   text(d,'A personal message is revealed',(48,525),20,True)
  elif kind=='play':
   wrap(d,'Stay for a little play.',48,166,560,42,True)
   wrap(d,['Light a pumpkin. Greet a ghost. Discover a tiny surprise.','Touch an ornament. Light the tree. Celebrate together.'][t],48,310,530,28)
   art(im,arts[t,5],(665,164,565,410),1+.035*math.sin(u*math.pi))
   for j in range(6):
    angle=u*math.pi*2+j;cx=953+math.cos(angle)*145;cy=360+math.sin(angle)*108;r=3+3*math.sin(u*math.pi)**2
    d.ellipse((cx-r,cy-r,cx+r,cy+r),fill='#FFE299')
  elif kind=='keep':
   text(d,'Keep the feeling close.',(48,114),42,True)
   art(im,arts[0,6],(70,210,545,360),1+.02*u);art(im,arts[1,6],(665,210,545,360),1+.02*u)
   text(d,'Your greetings become part of a world you build together.',(48,592),24)
  # Whole-video progress, always visible.
  d=ImageDraw.Draw(im);total=sum(s[2] for s in segments)*FPS
  d.rectangle((0,H-4,int(W*(frame_no+1)/total),H),fill=ACC)
  if n==dur*FPS//2:im.save(f'work/demo-{kind}-{t}.png')
  writer.send(im.tobytes());frame_no+=1
writer.close();print(f'{OUT}: {frame_no/FPS:.1f}s, {frame_no} frames')
