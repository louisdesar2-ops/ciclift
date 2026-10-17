# Ciclift - tableau de bord des resultats.
# Lit les chiffres chez GoatCounter (visites, sondage, sources) et Brevo (inscrits),
# puis genere tableau-de-bord.html dans ce dossier et l'ouvre dans le navigateur.
# Aucune adresse email n'est enregistree dans la page : seulement des nombres et des dates.
$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$dossier = Split-Path -Parent $MyInvocation.MyCommand.Path
$fichierCles = Join-Path $dossier "cles.xml"
$modele = Join-Path $dossier "modele.html"
$sortie = Join-Path $dossier "tableau-de-bord.html"

$GOAT = "https://ciclift.goatcounter.com/api/v0"
$BREVO = "https://api.brevo.com/v3"
$LISTE_BREVO = 3
$DEBUT = "2026-10-16"   # premier jour de collecte

if (-not (Test-Path $fichierCles)) {
  Write-Host "Cles absentes : lance d'abord 'Configurer les cles'." -ForegroundColor Red
  exit 1
}
$cles = Import-Clixml $fichierCles
function EnClair($s) { [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s)) }
$hGoat = @{ Authorization = "Bearer " + (EnClair $cles.GoatCounter); "Content-Type" = "application/json" }
$hBrevo = @{ "api-key" = (EnClair $cles.Brevo); accept = "application/json" }

$fin = (Get-Date).ToString("yyyy-MM-dd")
$erreurs = New-Object System.Collections.ArrayList
$data = [ordered]@{ generatedAt = (Get-Date).ToString("yyyy-MM-ddTHH:mm"); start = $DEBUT; end = $fin }

# ---------- GoatCounter ----------
try {
  Write-Host "GoatCounter : visites..."
  $tot = Invoke-RestMethod -Uri "$GOAT/stats/total?start=$DEBUT&end=$fin" -Headers $hGoat
  $jours = @()
  foreach ($s in $tot.stats) { $jours += [ordered]@{ day = ([string]$s.day).Substring(0, 10); n = [int]$s.daily } }
  $data.visits = [ordered]@{ total = [int]$tot.total; days = $jours }

  Write-Host "GoatCounter : reponses au sondage..."
  $hits = @(); $after = $null
  do {
    $u = "$GOAT/stats/hits?start=$DEBUT&end=$fin&limit=100"
    if ($after) { $u += "&exclude_paths=" + ($after -join ",") }
    $r = Invoke-RestMethod -Uri $u -Headers $hGoat
    $hits += $r.hits
    $after = @($hits | ForEach-Object { $_.path_id })
  } while ($r.more -and $hits.Count -lt 1000)

  $polls = @{}; $inscriptions = 0; $questions = 0
  foreach ($h in $hits) {
    $p = [string]$h.path; $n = [int]$h.count
    if ($p -match '^sondage-([a-z]+)-(.+)$') {
      $q = $Matches[1]; $v = $Matches[2]
      if (-not $polls.ContainsKey($q)) { $polls[$q] = @{} }
      $polls[$q][$v] = $n + [int]$polls[$q][$v]
    } elseif ($p -eq "inscription") { $inscriptions += $n }
    elseif ($p -eq "question") { $questions += $n }
  }
  $data.polls = $polls
  $data.signupEvents = $inscriptions
  $data.questions = $questions

  Write-Host "GoatCounter : sources..."
  $refs = Invoke-RestMethod -Uri "$GOAT/stats/toprefs?start=$DEBUT&end=$fin&limit=20" -Headers $hGoat
  $data.refs = @($refs.stats | ForEach-Object { [ordered]@{ name = $(if ($_.name) { [string]$_.name } else { "(direct)" }); n = [int]$_.count } })
} catch {
  [void]$erreurs.Add("GoatCounter : " + $_.Exception.Message)
}

# ---------- Brevo ----------
try {
  Write-Host "Brevo : inscrits..."
  $liste = Invoke-RestMethod -Uri "$BREVO/contacts/lists/$LISTE_BREVO" -Headers $hBrevo
  $parJour = @{}; $offset = 0
  do {
    $r = Invoke-RestMethod -Uri "$BREVO/contacts/lists/$LISTE_BREVO/contacts?limit=500&offset=$offset" -Headers $hBrevo
    foreach ($c in $r.contacts) {
      $d = ([string]$c.createdAt).Substring(0, 10)
      $parJour[$d] = 1 + [int]$parJour[$d]
    }
    $offset += 500
  } while ($r.contacts.Count -eq 500)
  $data.brevo = [ordered]@{
    subscribers = [int]$liste.totalSubscribers
    days = @($parJour.Keys | Sort-Object | ForEach-Object { [ordered]@{ day = $_; n = $parJour[$_] } })
  }
} catch {
  $msg = $_.Exception.Message
  if ($msg -match "401|403") { $msg += " (cle refusee : verifie la cle Brevo, ou ajoute ton adresse IP dans Brevo > Securite > IP autorisees)" }
  [void]$erreurs.Add("Brevo : " + $msg)
}

$data.errors = @($erreurs)
$json = $data | ConvertTo-Json -Depth 8 -Compress
$html = [IO.File]::ReadAllText($modele, [Text.Encoding]::UTF8).Replace("/*DATA*/null", $json)
[IO.File]::WriteAllText($sortie, $html, (New-Object Text.UTF8Encoding($true)))

if ($erreurs.Count) { $erreurs | ForEach-Object { Write-Host $_ -ForegroundColor Yellow } }
Write-Host "Tableau de bord genere : $sortie" -ForegroundColor Green
if (-not $env:CICLIFT_NO_OPEN) { Start-Process $sortie }
