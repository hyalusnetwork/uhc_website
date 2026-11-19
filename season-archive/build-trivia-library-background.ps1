param([string]$MinecraftJar = (Join-Path $env:APPDATA '.minecraft/versions/26.3/26.3.jar'))
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.Drawing
$archive=[System.IO.Compression.ZipFile]::OpenRead($MinecraftJar)
$textures=@{}
foreach($name in @('bookshelf','chiseled_bookshelf_empty','chiseled_bookshelf_occupied','oak_planks','cobweb')){
 $entry=$archive.GetEntry("assets/minecraft/textures/block/$name.png")
 $stream=$entry.Open();$memory=[System.IO.MemoryStream]::new();$stream.CopyTo($memory);$memory.Position=0
 $image=[System.Drawing.Image]::FromStream($memory)
 $textures[$name]=[System.Drawing.Bitmap]::new($image)
 $image.Dispose();$memory.Dispose();$stream.Dispose()
}
$archive.Dispose()
$wall=[System.Drawing.Bitmap]::new(320,288)
$graphics=[System.Drawing.Graphics]::FromImage($wall)
$graphics.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$graphics.PixelOffsetMode=[System.Drawing.Drawing2D.PixelOffsetMode]::Half
for($row=0;$row -lt 18;$row++){
 for($col=0;$col -lt 20;$col++){
  $x=$col*16;$y=$row*16
  $name=if($row%6 -eq 5){'oak_planks'}elseif(($col+[math]::Floor($row/3))%5 -lt 2){'bookshelf'}else{'chiseled_bookshelf_empty'}
  $graphics.DrawImageUnscaled($textures[$name],$x,$y)
  if($name -eq 'chiseled_bookshelf_empty'){
   $mask=(($row*17+$col*23)%64)
   for($slot=0;$slot -lt 6;$slot++){
    if(($mask -band (1 -shl $slot)) -ne 0){
     $sx=(@(0,6,11))[$slot%3];$sw=(@(6,5,5))[$slot%3];$sy=if($slot -lt 3){0}else{8}
     $dest=[System.Drawing.Rectangle]::new(($x+$sx),($y+$sy),$sw,8)
     $graphics.DrawImage($textures['chiseled_bookshelf_occupied'],$dest,$sx,$sy,$sw,8,[System.Drawing.GraphicsUnit]::Pixel)
    }
   }
  }
 }
}
# Separate clusters, each web occupying one block, with neighboring occupied blocks.
foreach($cell in @(@(0,1),@(1,1),@(1,2),@(17,7),@(18,7),@(19,7),@(18,8),@(4,13),@(5,13),@(5,14),@(10,0),@(11,0),@(12,0),@(11,1),@(8,4),@(9,4),@(8,5),@(2,8),@(3,8),@(4,8),@(2,9),@(3,9),@(2,10),@(14,12),@(15,12),@(16,12),@(16,13),@(11,16),@(12,16),@(13,16),@(11,17),@(12,17))){
 $graphics.DrawImageUnscaled($textures['cobweb'],($cell[0]*16),($cell[1]*16))
}
$wall.Save((Join-Path $PSScriptRoot 'dist/images/trivia-library-blocks.png'),[System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose();$wall.Dispose();foreach($texture in $textures.Values){$texture.Dispose()}
