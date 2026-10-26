Add-Type -AssemblyName System.Drawing

$srcPath = 'C:\Users\aveks\.cursor\projects\c-Users-aveks-Desktop-4\assets\c__Users_aveks_AppData_Roaming_Cursor_User_workspaceStorage_6359495887e7fbdf921ec5aae68cdd51_images_image-689c2924-a3dc-4af0-81bf-1df493ae4056.png'
$outDir = Join-Path (Split-Path $PSScriptRoot -Parent) 'public\icons'
$src = [System.Drawing.Bitmap]::FromFile($srcPath)

function Save-Fit([int]$size, [string]$name, [double]$scale) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $bg = $src.GetPixel(4, [int]($src.Height / 2))
  $g.Clear($bg)
  $side = [int]($size * $scale)
  $pos = [int](($size - $side) / 2)
  $g.DrawImage($src, $pos, $pos, $side, $side)
  $bmp.Save((Join-Path $outDir $name), [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
}

Save-Fit 192 'icon-192.png' 1
Save-Fit 512 'icon-512.png' 1
Save-Fit 180 'apple-touch-icon.png' 1
Save-Fit 512 'icon-maskable-512.png' 0.72
$src.Dispose()
Write-Output 'resized'
