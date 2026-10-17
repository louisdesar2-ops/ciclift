# Ciclift - enregistre la cle API qui vient d'etre copiee (Ctrl+C), sans avoir a la coller nulle part.
# Usage : cle-copiee.ps1 GoatCounter   ou   cle-copiee.ps1 Brevo
# La cle est chiffree avec ta session Windows (DPAPI) puis le presse-papier est vide.
param([Parameter(Mandatory = $true)][ValidateSet("GoatCounter", "Brevo")][string]$Service)
$ErrorActionPreference = "Stop"
$dossier = Split-Path -Parent $MyInvocation.MyCommand.Path
$fichier = Join-Path $dossier "cles.xml"

$texte = ((Get-Clipboard -Raw) -as [string])
if ($texte) { $texte = $texte.Trim() }

# Verification du format, pour ne pas enregistrer autre chose par erreur
function FormatOk($t) { if ($Service -eq "Brevo") { return $t -match '^xkeysib-[A-Za-z0-9-]{20,}$' } else { return $t -match '^[A-Za-z0-9]{20,}$' } }
$ok = FormatOk $texte
if (-not $ok) {
  # Rien de valable dans le presse-papier : petite fenetre avec une case pour coller la cle (Ctrl+V)
  Add-Type -AssemblyName Microsoft.VisualBasic
  $saisie = [Microsoft.VisualBasic.Interaction]::InputBox("Colle ici ta cle $Service (Ctrl+V), puis clique sur OK.", "Cle $Service - Ciclift", "")
  if ($saisie) { $texte = $saisie.Trim(); $ok = FormatOk $texte }
}
if (-not $ok) {
  Write-Host ""
  Write-Host "Je ne trouve pas de cle $Service dans ce que tu as copie." -ForegroundColor Red
  if ($Service -eq "Brevo") { Write-Host "Dans Brevo, clique sur le bouton Copier a cote de la cle (elle commence par xkeysib-), puis relance ce raccourci." }
  else { Write-Host "Dans GoatCounter, clique sur 'show', selectionne la longue suite de caracteres, fais Ctrl+C, puis relance ce raccourci." }
  exit 1
}

$cles = [ordered]@{ GoatCounter = $null; Brevo = $null }
if (Test-Path $fichier) { $old = Import-Clixml $fichier; $cles.GoatCounter = $old.GoatCounter; $cles.Brevo = $old.Brevo }
$cles[$Service] = ConvertTo-SecureString $texte -AsPlainText -Force
[pscustomobject]$cles | Export-Clixml -Path $fichier
Set-Clipboard -Value " "

Write-Host ""
Write-Host "Cle $Service enregistree (chiffree) et presse-papier vide." -ForegroundColor Green
$manque = @("GoatCounter", "Brevo") | Where-Object { -not $cles[$_] }
if ($manque) { Write-Host "Il reste a enregistrer : $($manque -join ', ')" } else { Write-Host "Les deux cles sont enregistrees. Tu peux ouvrir le tableau de bord." }
