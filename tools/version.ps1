# Anti-cache : ajoute un numéro de version (date + heure) aux fichiers CSS, JS et photos dans toutes les pages.
# À lancer avant chaque publication : les navigateurs (surtout sur téléphone) récupèrent alors la dernière version.
# Usage : powershell -ExecutionPolicy Bypass -File tools\version.ps1
$root = Split-Path -Parent $PSScriptRoot
$v = Get-Date -Format "yyyyMMddHHmm"
$utf8 = New-Object Text.UTF8Encoding $false
Get-ChildItem $root -Filter *.html | ForEach-Object {
  $t = [IO.File]::ReadAllText($_.FullName, [Text.Encoding]::UTF8)
  $n = [regex]::Replace($t, '((?:href|src)="[^"]*assets/(?:css|js)/[^"?]+\.(?:css|js))(\?v=[0-9]+)?"', '$1?v=' + $v + '"')
  if ($n -ne $t) { [IO.File]::WriteAllText($_.FullName, $n, $utf8) }
}
# Les photos sont chargées par main.js : on lui transmet la même version
$main = Join-Path $root "assets\js\main.js"
$t = [IO.File]::ReadAllText($main, [Text.Encoding]::UTF8)
$t = [regex]::Replace($t, 'var PHOTO_VER = "[0-9]*";', 'var PHOTO_VER = "' + $v + '";')
[IO.File]::WriteAllText($main, $t, $utf8)
"Version des fichiers : $v"
