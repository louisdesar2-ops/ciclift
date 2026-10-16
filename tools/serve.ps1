# Petit serveur local pour prévisualiser le site, comme sur ciclift.fr.
# Usage : powershell -ExecutionPolicy Bypass -File tools\serve.ps1   puis ouvrir http://localhost:8080/
param([int]$Port = 8080)
$root = Split-Path -Parent $PSScriptRoot
$prefix = "/"
$types = @{ ".html" = "text/html; charset=utf-8"; ".css" = "text/css; charset=utf-8"; ".js" = "text/javascript; charset=utf-8";
  ".svg" = "image/svg+xml"; ".png" = "image/png"; ".xml" = "application/xml"; ".txt" = "text/plain; charset=utf-8"; ".json" = "application/json" }
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Aperçu : http://localhost:$Port$prefix  (Ctrl+C pour arrêter)"
while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath)
  $status = 200
  $file = $null
  if ($path.StartsWith($prefix)) {
    $rel = $path.Substring($prefix.Length)
    if ($rel -eq "" -or $rel.EndsWith("/")) { $rel += "index.html" }
    $candidate = [IO.Path]::GetFullPath((Join-Path $root $rel))
    if ($candidate.StartsWith($root) -and (Test-Path $candidate -PathType Leaf)) { $file = $candidate }
  }
  if (-not $file) { $file = Join-Path $root "404.html"; $status = 404 }
  $bytes = [IO.File]::ReadAllBytes($file)
  $ext = [IO.Path]::GetExtension($file).ToLower()
  $ctx.Response.StatusCode = $status
  $ctx.Response.ContentType = $(if ($types[$ext]) { $types[$ext] } else { "application/octet-stream" })
  $ctx.Response.Headers.Add("Cache-Control", "no-store")
  $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  $ctx.Response.Close()
}
