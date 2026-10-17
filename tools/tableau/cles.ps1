# Ciclift - enregistrement des cles API (GoatCounter + Brevo) sur CE PC uniquement.
# Les cles sont chiffrees avec ta session Windows (DPAPI) : illisibles depuis un autre compte ou un autre PC.
# Elles ne vont JAMAIS dans le depot GitHub.
$ErrorActionPreference = "Stop"
$dossier = Split-Path -Parent $MyInvocation.MyCommand.Path
$fichier = Join-Path $dossier "cles.xml"

Write-Host ""
Write-Host "=== Cles API du tableau de bord Ciclift ===" -ForegroundColor Green
Write-Host "Colle chaque cle puis appuie sur Entree (rien ne s'affiche pendant la saisie, c'est normal)."
Write-Host "Laisse vide et appuie sur Entree pour garder la cle deja enregistree."
Write-Host ""

$anciennes = $null
if (Test-Path $fichier) { $anciennes = Import-Clixml $fichier }

$gc = Read-Host "Cle GoatCounter (lecture des statistiques)" -AsSecureString
$br = Read-Host "Cle API Brevo" -AsSecureString

if ($gc.Length -eq 0) { if ($anciennes) { $gc = $anciennes.GoatCounter } else { Write-Host "Cle GoatCounter manquante." -ForegroundColor Red; exit 1 } }
if ($br.Length -eq 0) { if ($anciennes) { $br = $anciennes.Brevo } else { Write-Host "Cle Brevo manquante." -ForegroundColor Red; exit 1 } }

[pscustomobject]@{ GoatCounter = $gc; Brevo = $br } | Export-Clixml -Path $fichier
Write-Host ""
Write-Host "Cles enregistrees (chiffrees) dans $fichier" -ForegroundColor Green
Write-Host "Tu peux maintenant ouvrir le tableau de bord."
