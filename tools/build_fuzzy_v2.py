from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import ImageReader
from pathlib import Path
import json
ROOT=Path.cwd(); OUT=ROOT/'outputs'; ART=OUT/'fuzzy-worlds-concept.png'
for name,file in [('Sans','Arial.ttf'),('Bold','Arial Bold.ttf'),('Serif','Arial Rounded Bold.ttf')]:
 pdfmetrics.registerFont(TTFont(name,'/System/Library/Fonts/Supplemental/'+file))
BG='#FFF6EC'; INK='#4A3426'; MUTED='#8A6A55'; PURPLE='#AE5948'; LINE='#E3DBD0'
W,H=1280,720
c=canvas.Canvas(str(OUT/'02-Fuzzy-Visual-Storyboard-v2.pdf'),pagesize=(W,H)); c.setTitle('Fuzzy | AI World Storyboard'); c.setAuthor('Vivien Kong')
def box(x,y,w,h,fill,r=20):
 c.setFillColor(HexColor(fill));c.roundRect(x,y,w,h,r,fill=1,stroke=0)
def txt(s,x,y,size=18,font='Sans',color=INK):
 c.setFillColor(HexColor(color));c.setFont(font,size);c.drawString(x,y,s)
def wrap(s,x,y,width,size=18,font='Sans',color=INK,leading=None):
 words=s.split();lines=[];line=''
 for word in words:
  n=(line+' '+word).strip()
  if pdfmetrics.stringWidth(n,font,size)>width: lines.append(line);line=word
  else:line=n
 if line:lines.append(line)
 for line in lines:txt(line,x,y,size,font,color);y-=leading or size*1.4
 return y
steps=['Describe','Generate','Preview','Send','Unwrap','Play','Keep']
def base(n,title,kicker,active=None):
 c.setFillColor(HexColor(BG));c.rect(0,0,W,H,fill=1,stroke=0)
 txt('fuzzy',48,665,28,'Serif');txt('V1 CONCEPT & DESIGN',156,669,12,'Bold',MUTED)
 box(902,649,330,34,'#F9DECF',17);txt('CONCEPT VISUALS / NOT A LIVE APP',920,660,12,'Bold',PURPLE)
 txt(kicker.upper(),48,616,12,'Bold',PURPLE);txt(title,48,570,35,'Serif')
 txt('AI-generated artwork + illustrative interface states',48,25,12,'Sans',MUTED)
 txt(f'VibeLab Launchpad  /  {n:02d}',1060,25,12,'Sans',MUTED)
 if active is not None:
  for j,s in enumerate(steps):
   x=48+j*171;box(x,490,155,38,PURPLE if j==active else '#EEE8DF',15);txt(f'{j+1:02d}  {s}',x+13,503,14,'Bold','#FFFFFF' if j==active else MUTED)
def world(x,y,w,h,theme,step=2):
 from PIL import Image
 if step<3: path=OUT/'fuzzy-lowpoly-create.png';cols=3;col=step
 elif step<5: path=OUT/'fuzzy-lowpoly-send.png';cols=2;col=step-3
 else: path=OUT/'fuzzy-lowpoly-keep.png';cols=2;col=step-5
 iw,ih=Image.open(path).size;cw=iw/cols;ch=ih/2
 # Lay out an individual panel from the source sheet without changing source artwork.
 scale=min(w/cw,h/ch);pw=cw*scale;ph=ch*scale
 x+=(w-pw)/2;y+=(h-ph)/2
 c.saveState();p=c.beginPath();p.roundRect(x,y,pw,ph,14);c.clipPath(p,stroke=0)
 c.drawImage(str(path),x-col*pw,y-(1-theme)*ph,width=iw*scale,height=ih*scale,mask='auto')
 c.restoreState()
def button(label,x,y,width=180):
 box(x,y,width,36,PURPLE,18);txt(label,x+18,y+12,13,'Bold','#FFFFFF')
def end():c.showPage()
base(1,'Send your loved ones a 3D card','One idea. Two occasions.')
world(80,144,540,398,0,2)
world(660,144,540,398,1,2)
wrap('Messages don\'t disappear into a chat history. They become playful, persistent parts of a world you build together.',150,99,980,21,'Serif',leading=28)
end()
data=[
('Describe a world for someone you love.','The sender / prompt to possibility',0,
 'HALLOWEEN','Make a cozy, spooky pumpkin garden for my best friend, with a friendly ghost hiding my message.',
 'CHRISTMAS','Make a snowy Christmas cottage for my sister, with a glowing tree and a present she can open to read my note.',
 'Generate my world','Example prompts. The personal note is entered separately and preserved verbatim.'),
('Let AI turn intent into a little world.','AI generation / proposed behavior',1,
 'PUMPKIN GARDEN','AI chooses a twilight palette, pumpkin placement, a friendly ghost, and a hidden-note reveal.',
 'SNOWY COTTAGE','AI chooses snow, warm cottage lighting, a decorated tree, and a present that reveals the greeting.',
 'Creating your world...','Proposed V2 approach: AI composes curated 3D assets. These images illustrate intended results.'),
('Make sure it feels like you.','The sender / personalize and preview',2,
 'REFINE THE HALLOWEEN WORLD','Try: “Make it cozier and add more glowing pumpkins.” Review the scene and keep your note intact.',
 'REFINE THE CHRISTMAS WORLD','Try: “Add soft snowfall and warmer lights.” Review the scene and keep your note intact.',
 'Preview greeting','Preview the reveal before sending. Regenerate or retry without losing the personal message.'),
('Send a world, with a personal note.','The handoff / one recipient',3,
 'FOR YOUR BEST FRIEND','“A tiny spooky place, just for you. Wish we could share this candy together!”',
 'FOR YOUR SISTER','“A little Christmas warmth from me to you. Wish we were celebrating together.”',
 'Copy card link','Illustrative sharing state. Real recipient delivery is a V3 milestone; no message is sent here.'),
('A small surprise arrives.','The recipient / unwrap',4,
 'OPEN THE HALLOWEEN CARD','Select the glowing parcel. The garden unfolds, a friendly ghost appears, and the note is revealed.',
 'OPEN THE CHRISTMAS CARD','Select the red present. The cottage glows, the tree lights up, and the note is revealed.',
 'Open your world','Proposed reveal: one clear action, a brief animation, and a comfortable reading position.'),
('Stay for a little play.','The recipient / spatial interactions',5,
 'LIGHT. DISCOVER. SMILE.','Tap a pumpkin to light it, greet the ghost, or collect candy for a small surprise.',
 'GLOW. UNWRAP. CELEBRATE.','Illuminate the tree, open a present, or touch an ornament for a festive response.',
 'Replay the moment','Interactions are illustrative. Keep the note accessible and avoid forced camera movement.'),
('Keep the feeling close.','The recipient / a world you build together',6,
 'A PUMPKIN KEEPSAKE','Place a pumpkin in your personal nook. Reopen it to revisit the sender and their message.',
 'A CHRISTMAS KEEPSAKE','Place an ornament beside it. Every greeting adds another small memory to your world.',
 'Keep in my nook','Saved worlds and cross-session retrieval are planned for V3; persistence is not demonstrated here.')]
for idx,(title,kick,active,lhead,ltext,rhead,rtext,cta,foot) in enumerate(data,2):
 base(idx,title,kick,active)
 for side,(heading,body) in enumerate([(lhead,ltext),(rhead,rtext)]):
  x=48+side*608
  box(x,125,576,344,'#FFFFFF');world(x+10,143,320,310,side,active)
  txt('HALLOWEEN' if side==0 else 'CHRISTMAS',x+344,432,12,'Bold',PURPLE)
  wrap(body,x+344,400,215,16,leading=23)
  button(cta,x+344,149,218)
 wrap(foot,48,91,1184,16,color=MUTED,leading=22)
 end()
base(9,'From concept to a playable experience.','Delivery plan / evidence matters')
rows=[('V1','Concept & design','Two-theme storyboard, prompt examples, and generation behavior. APK optional.'),('V2','Generate & play','Prompt-driven Halloween and Christmas worlds in an installable APK.'),('V3','Send & keep','Personalization, recipient delivery, saved worlds, and retrieval after restart.'),('V4','Polish & demonstrate','Generation consistency, performance, comfort, and a complete two-theme demo.')]
for i,(v,h,b) in enumerate(rows):
 y=420-i*88;box(48,y,1184,76,'#FFFFFF');box(64,y+15,52,46,'#F9DECF',14);txt(v,75,y+30,18,'Bold',PURPLE);txt(h,137,y+43,20,'Bold');txt(b,137,y+17,16,'Sans',MUTED)
wrap('Preferred prototype: WebXR / Three.js / React Three Fiber. Spatial SDK compatibility and the required Unity SDK or Spatial SDK choice need confirmation before the APK path is committed.',48,95,1184,16,color=MUTED)
end();c.save()
# Reference document uses the same restrained visual language.
W,H=612,792
c=canvas.Canvas(str(OUT/'04-Fuzzy-References-and-Credits-v2.pdf'),pagesize=(W,H));c.setTitle('Fuzzy | References & Credits')
def refbase(num,title):
 c.setFillColor(HexColor(BG));c.rect(0,0,W,H,fill=1,stroke=0);txt('fuzzy',44,738,28,'Serif');txt('REFERENCES & CREDITS',44,701,11,'Bold',PURPLE);txt(title,44,659,25,'Serif');txt(f'V1 Concept & Design  /  {num}',44,30,10,'Sans',MUTED)
def link(label,url,y):
 txt(label,44,y,13,'Bold',PURPLE);c.linkURL(url,(44,y-3,568,y+17),relative=0,thickness=0)
 return wrap(url,44,y-24,524,10,color=MUTED,leading=14)
refbase(1,'Inspiration, with clear attribution.')
y=wrap('Capy Post is an external inspiration for Fuzzy. This submission does not claim ownership, authorship, affiliation, or permission to reuse its code or assets.',44,616,524,13,leading=20)
y=link('Capy Post live demo / primary art reference','https://hack-tripothon.vercel.app/',y-23)
y=link('Capy Post repository','https://github.com/chinesepowered/hack-tripothon',y-25)
y=link('Capy Post demo video','https://github.com/chinesepowered/hack-tripothon/blob/main/submission/capy-post-demo-day.mp4',y-30)
y=wrap('These are the reference links supplied in the conversation. The video is a Capy Post reference, not a Fuzzy product demonstration. Any future code or asset reuse needs a separate license and attribution review.',44,y-27,524,12,leading=18)
txt('Experience references',44,y-35,17,'Bold');y=wrap('Animal Crossing: warmth, collecting, and personal spaces. Snapchat: spontaneous sharing between friends. These describe the intended experience; neither brand is affiliated with or endorses Fuzzy. No third-party brand artwork is included.',44,y-62,524,12,leading=18)
txt('What the submission actually demonstrates',44,y-37,17,'Bold');y=wrap('The storyboard and captioned walkthrough communicate a proposed interaction design. They are not a recording of a working app. The scene illustrations are AI-generated concept art; the interface layouts are illustrative. Live AI world generation, delivery, persistence, and headset behavior remain to be implemented and tested.',44,y-65,524,12,leading=18)

end();refbase(2,'Artwork & generation notes')
y=wrap('Created for this submission using the built-in OpenAI image-generation tool. The concept artwork depicts fourteen distinct scene panels across Halloween and Christmas, using the Capy Post live site public preview artwork as the primary style reference. It is a 2D illustration, not a generated 3D asset or a playable world.',44,614,524,12,leading=18)
txt('Art direction',44,y-32,17,'Bold')
y=wrap('Warm peach and lilac skies; shallow floating grassy islands; faceted soil, rocks, and foliage; simple rounded characters and miniature props; cream panels and brown typography. Seven different moments per theme: describe, generate, preview, send, unwrap, play, and keep. The supplied angular-island image was an initial reference; the live Capy Post direction supersedes it.',44,y-58,524,12,leading=18)
y=wrap('Generated illustrations are original concept assets, not screenshots of Capy Post or Fuzzy. Source attribution does not imply ownership, affiliation, or endorsement. Character selection remains illustrative and is not limited to capybaras.',44,y-22,524,12,leading=18)
txt('Proposed product generation',44,y-33,17,'Bold');y=wrap('For the first implementation, AI can create a structured scene description and compose curated 3D assets, lighting, layout, and supported interactions. This is distinct from generating every mesh or texture from scratch. Model/provider selection, runtime compatibility, and performance are unconfirmed.',44,y-59,524,12,leading=18)
wrap('The MP4 is a silent, captioned concept walkthrough built from the storyboard. No music, recorded product footage, or Capy Post media is embedded.',44,y-25,524,11,leading=16)
link('Fuzzy concept & design document','https://docs.google.com/document/d/12gPP4mVYLw11Uf6eXVF3MDj5qTxOrRkBJ3WHt_EC2qA',105)
end()
for i,(key,prompt) in enumerate(json.loads((ROOT/'work/art-prompts.json').read_text()).items(),3):
 refbase(i,'Artwork prompt '+key)
 wrap(prompt,44,610,524,11,leading=16)
 end()
c.save()
print('Created storyboard (9 pages) and references (2 pages).')
