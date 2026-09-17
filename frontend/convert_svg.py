import base64

image_path = r'C:\Users\M.BHARANIDHARAN\.gemini\antigravity-ide\brain\5450138f-6f2d-4cae-8abc-1d3f2cab1969\.user_uploaded\media_1789539675378.png'
with open(image_path, 'rb') as f:
    img_data = f.read()

b64_data = base64.b64encode(img_data).decode('utf-8')

svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <image href="data:image/png;base64,{b64_data}" width="512" height="512"/>
</svg>'''

with open(r'c:\Users\M.BHARANIDHARAN\OneDrive\Documents\Portfolio_Builder\frontend\public\logo.svg', 'w') as f:
    f.write(svg_content)
    
with open(r'c:\Users\M.BHARANIDHARAN\OneDrive\Documents\Portfolio_Builder\frontend\public\favicon.svg', 'w') as f:
    f.write(svg_content)
print('Conversion successful')
