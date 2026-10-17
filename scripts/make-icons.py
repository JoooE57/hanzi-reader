from PIL import Image, ImageDraw, ImageFont
for size,name in [(192,'icon-192.png'),(512,'icon-512.png'),(180,'apple-touch-icon.png')]:
    im=Image.new('RGB',(size,size),'#344f40');d=ImageDraw.Draw(im)
    d.rounded_rectangle((size*.18,size*.18,size*.82,size*.82),radius=size*.07,fill='#f5f1e8')
    f=ImageFont.truetype('C:/Windows/Fonts/msjh.ttc',int(size*.49))
    d.text((size/2,size/2),'字',font=f,anchor='mm',fill='#ba583f')
    im.save('icons/'+name)
