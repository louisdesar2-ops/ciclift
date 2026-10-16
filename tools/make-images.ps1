# Génère les images PNG du site (icônes et image de partage réseaux sociaux).
# Usage : powershell -ExecutionPolicy Bypass -File tools\make-images.ps1
Add-Type -AssemblyName System.Drawing
$root = Split-Path -Parent $PSScriptRoot
$img = Join-Path $root "assets\img"

$green = [System.Drawing.Color]::FromArgb(15, 157, 108)
$yellow = [System.Drawing.Color]::FromArgb(56, 189, 248)

function New-RoundedRect([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $p.AddArc($x, $y, 2 * $r, 2 * $r, 180, 90)
  $p.AddArc($x + $w - 2 * $r, $y, 2 * $r, 2 * $r, 270, 90)
  $p.AddArc($x + $w - 2 * $r, $y + $h - 2 * $r, 2 * $r, 2 * $r, 0, 90)
  $p.AddArc($x, $y + $h - 2 * $r, 2 * $r, 2 * $r, 90, 90)
  $p.CloseFigure()
  return $p
}

# Dessine le logo (C vert + roue à rayons blanche + fine flèche bleue) dans un carré de côté $s
function Draw-Logo($g, [float]$ox, [float]$oy, [float]$s, [bool]$rounded) {
  $k = $s / 32
  $bg = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(11, 17, 23))
  if ($rounded) { $g.FillPath($bg, (New-RoundedRect $ox $oy $s $s (8 * $k))) } else { $g.FillRectangle($bg, $ox, $oy, $s, $s) }
  $green = [System.Drawing.Color]::FromArgb(34, 197, 139); $white = [System.Drawing.Color]::FromArgb(238, 244, 248); $blue = [System.Drawing.Color]::FromArgb(56, 189, 248)
  $pc = New-Object System.Drawing.Pen $green, (4 * $k); $pc.StartCap = 'Round'; $pc.EndCap = 'Round'
  $g.DrawArc($pc, $ox + 5 * $k, $oy + 5 * $k, 22 * $k, 22 * $k, 45, 270)
  $ps = New-Object System.Drawing.Pen $white, (1.4 * $k); $ps.StartCap = 'Round'; $ps.EndCap = 'Round'
  $cx = $ox + 16 * $k; $cy = $oy + 16 * $k
  foreach ($a in 0, 45, 90, 135) { $r = [Math]::PI * $a / 180; $dx = [Math]::Cos($r) * 6 * $k; $dy = [Math]::Sin($r) * 6 * $k; $g.DrawLine($ps, $cx - $dx, $cy - $dy, $cx + $dx, $cy + $dy) }
  $pw = New-Object System.Drawing.Pen $white, (2 * $k)
  $g.DrawEllipse($pw, $cx - 6 * $k, $cy - 6 * $k, 12 * $k, 12 * $k)
  $g.FillEllipse((New-Object System.Drawing.SolidBrush $white), $cx - 1.9 * $k, $cy - 1.9 * $k, 3.8 * $k, 3.8 * $k)
  $pa = New-Object System.Drawing.Pen $blue, (1.8 * $k); $pa.StartCap = 'Round'; $pa.EndCap = 'Round'; $pa.LineJoin = 'Round'
  $g.DrawLine($pa, $ox + 26.6 * $k, $oy + 20.5 * $k, $ox + 26.6 * $k, $oy + 11.5 * $k)
  $g.DrawLines($pa, [System.Drawing.PointF[]]@(
    (New-Object System.Drawing.PointF ($ox + 24.4 * $k), ($oy + 13.7 * $k)),
    (New-Object System.Drawing.PointF ($ox + 26.6 * $k), ($oy + 11.5 * $k)),
    (New-Object System.Drawing.PointF ($ox + 28.8 * $k), ($oy + 13.7 * $k))))
}
function Save-Icon([int]$size, [string]$name, [bool]$rounded) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'
  $g.Clear([System.Drawing.Color]::Transparent)
  Draw-Logo $g 0 0 $size $rounded
  $bmp.Save((Join-Path $img $name), [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
}

Save-Icon 32 "favicon-32.png" $true
Save-Icon 180 "apple-touch-icon.png" $false

# Image de partage 1200 x 630
$W = 1200; $H = 630
$bmp = New-Object System.Drawing.Bitmap $W, $H
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = 'AntiAlias'
$g.TextRenderingHint = 'AntiAliasGridFit'
$grad = New-Object System.Drawing.Drawing2D.LinearGradientBrush (New-Object System.Drawing.Point 0, 0), (New-Object System.Drawing.Point $W, $H), ([System.Drawing.Color]::FromArgb(7, 11, 16)), ([System.Drawing.Color]::FromArgb(10, 38, 52))
$g.FillRectangle($grad, 0, 0, $W, $H)

# Vélo stylisé en haut à droite (rangé « au plafond »)
$white = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(235, 255, 255, 255)), 9
$white.StartCap = 'Round'; $white.EndCap = 'Round'; $white.LineJoin = 'Round'
$ceil = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(120, 255, 255, 255)), 6
$g.DrawLine($ceil, 700, 70, 1140, 70)
$bx = 760; $by = 105; $k = 3.2
$g.DrawEllipse($white, $bx + 5 * $k, $by + 29 * $k, 38 * $k, 38 * $k)
$g.DrawEllipse($white, $bx + 77 * $k, $by + 29 * $k, 38 * $k, 38 * $k)
$pts = @(@(24,48,52,48),@(52,48,44,22),@(44,22,24,48),@(52,48,82,24),@(82,24,44,22),@(82,24,96,48),@(79,14,82,24),@(73,13,85,13),@(38,19,51,19))
foreach ($p in $pts) { $g.DrawLine($white, $bx + $p[0] * $k, $by + $p[1] * $k, $bx + $p[2] * $k, $by + $p[3] * $k) }
$arrow = New-Object System.Drawing.Pen $yellow, 8
$arrow.DashStyle = 'Dash'; $arrow.StartCap = 'Round'
$g.DrawLine($arrow, 952, 560, 952, 360)
$g.FillPolygon((New-Object System.Drawing.SolidBrush $yellow), [System.Drawing.PointF[]]@(
  (New-Object System.Drawing.PointF 952, 330), (New-Object System.Drawing.PointF 930, 368), (New-Object System.Drawing.PointF 974, 368)))

# Logo + textes
Draw-Logo $g 80 80 96 $true
$fontBig = New-Object System.Drawing.Font "Segoe UI", 64, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
$fontName = New-Object System.Drawing.Font "Segoe UI", 56, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
$fontSmall = New-Object System.Drawing.Font "Segoe UI", 30, ([System.Drawing.FontStyle]::Regular), ([System.Drawing.GraphicsUnit]::Pixel)
$wb = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
$yb = New-Object System.Drawing.SolidBrush $yellow
$g.DrawString("Ciclift", $fontName, $wb, 196, 92)
$g.DrawString("Votre vélo au plafond.", $fontBig, $wb, 76, 300)
$g.DrawString("Votre sol libéré.", $fontBig, $yb, 76, 380)
$g.DrawString("Le rangement vélo en hauteur, d'un simple bouton.", $fontSmall, $wb, 80, 500)
$bmp.Save((Join-Path $img "og-image.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
"Images générées dans $img"
