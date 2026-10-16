# Publie le site : numéro de version anti-cache, sauvegarde Git, synchronisation avec GitHub, envoi, puis vérification.
# Usage : powershell -ExecutionPolicy Bypass -File tools\publish.ps1 "message de la modification"
param([string]$Message = "Mise à jour du site")
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
& (Join-Path $PSScriptRoot "version.ps1")
git add -A
git diff --cached --quiet
if ($LASTEXITCODE -ne 0) { git commit -q -m $Message }
# GitHub peut modifier le dépôt de son côté (ex. fichier CNAME) : on récupère d'abord ses changements
git pull -q --rebase origin main
if ($LASTEXITCODE -ne 0) { throw "Synchronisation avec GitHub impossible : à régler avant de publier." }
git push -q origin main
if ($LASTEXITCODE -ne 0) { throw "L'envoi vers GitHub a échoué." }
$local = git rev-parse HEAD
$remote = git rev-parse origin/main
if ($local -ne $remote) { throw "GitHub n'a pas la même version que l'ordinateur." }
"Publié : $($local.Substring(0,7)) (en ligne d'ici 1 à 2 minutes)"
