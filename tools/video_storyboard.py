import sys,subprocess
sys.path.insert(0,'work/video-deps')
import imageio_ffmpeg
from reportlab.pdfgen import canvas
from pathlib import Path
frames=Path('work/video-storyboard');frames.mkdir(exist_ok=True)
times=[2.5,5.8,9.8,12.5,16.5,19.5,22.8,26.8,29.5,33.5,36.5,41.5]
exe=imageio_ffmpeg.get_ffmpeg_exe()
c=canvas.Canvas('outputs/02-Fuzzy-Visual-Storyboard-v3.pdf',pagesize=(1280,720));c.setTitle('Fuzzy Visual Storyboard - Frames from the Animated Concept Demo')
for i,t in enumerate(times,1):
 p=frames/f'{i:02d}.png'
 subprocess.run([exe,'-y','-ss',str(t),'-i','outputs/05-Fuzzy-Animated-Concept-Demo.mp4','-frames:v','1',str(p)],check=True,capture_output=True)
 c.drawImage(str(p),0,0,width=1280,height=720);c.showPage()
c.save();print('12 pages created from the final video.')
from PIL import Image,ImageDraw
out=Image.new('RGB',(1200,4*245),'#ddd')
for i,p in enumerate(sorted(frames.glob('*.png'))):
 im=Image.open(p);im.thumbnail((390,220));x=i%3*400;y=i//3*245;out.paste(im,(x,y));ImageDraw.Draw(out).text((x+5,y+223),p.stem,fill='black')
out.save('work/video-storyboard-contact.png')
