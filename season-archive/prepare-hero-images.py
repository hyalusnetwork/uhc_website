from PIL import Image
from pathlib import Path
source=Path(r'E:\Games\Minecraft\UHC\Screenshots & Videos')
target=Path('dist/images')
target.mkdir(exist_ok=True)
names=['2026-11-17T23_33_23','2026-11-18T01_11_03','2026-11-18T00_57_12','2026-11-17T23_50_01','2026-11-17T23_46_48']
for i,name in enumerate(names,1):
 with Image.open(source/(name+'.png')) as im:
  im.convert('RGB').resize((1440,810),Image.Resampling.LANCZOS).save(target/f'hero-season-{i}.webp',quality=84,method=6)
print('Prepared five hero photographs.')
