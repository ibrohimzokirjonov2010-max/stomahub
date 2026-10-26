Add-Type -AssemblyName System.Drawing

$coords = @(
  7.5, 3.5,
  5.1, 3.5, 3.5, 5.4, 3.5, 8.1,
  3.5, 10.4, 4.5, 11.7, 5.1, 13.7,
  5.8, 16.1, 6.0, 20.5, 7.8, 20.5,
  9.4, 20.5, 9.4, 15.9, 12.0, 15.9,
  14.6, 15.9, 14.6, 20.5, 16.2, 20.5,
  18.0, 20.5, 18.2, 16.1, 18.9, 13.7,
  19.5, 11.7, 20.5, 10.4, 20.5, 8.1,
  20.5, 5.4, 18.9, 3.5, 16.5, 3.5,
  14.7, 3.5, 13.8, 4.5, 12.0, 4.5,
  10.2, 4.5, 9.3, 3.5, 7.5, 3.5
)

function Save-Icon([int]$size, [string]$out, [double]$padRatio) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.Clear([System.Drawing.Color]::FromArgb(255, 11, 109, 115))
  $pad = $size * $padRatio
  $scale = ($size - (2 * $pad)) / 24.0
  $pts = New-Object System.Drawing.PointF[] ($coords.Length / 2)
  for ($i = 0; $i -lt $pts.Length; $i++) {
    $pts[$i] = New-Object System.Drawing.PointF (($pad + $coords[$i * 2] * $scale), ($pad + $coords[$i * 2 + 1] * $scale))
  }
  $shape = New-Object System.Drawing.Drawing2D.GraphicsPath
  $shape.AddBeziers($pts)
  $shape.CloseFigure()
  $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
  $g.FillPath($brush, $shape)
  $dir = Split-Path $out
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
  $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
  $brush.Dispose(); $shape.Dispose(); $g.Dispose(); $bmp.Dispose()
}

$root = Split-Path $PSScriptRoot -Parent
Save-Icon 192 (Join-Path $root 'public\icons\icon-192.png') 0.16
Save-Icon 512 (Join-Path $root 'public\icons\icon-512.png') 0.16
Save-Icon 512 (Join-Path $root 'public\icons\icon-maskable-512.png') 0.28
Save-Icon 180 (Join-Path $root 'public\icons\apple-touch-icon.png') 0.16
Write-Output 'icons ok'
