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
# GoatCounter attend des dates avec l'heure ; la fin est exclue, donc on va jusqu'a demain 00:00
$periode = "start=${DEBUT}T00:00:00Z&end=" + (Get-Date).ToUniversalTime().AddDays(1).ToString("yyyy-MM-dd") + "T00:00:00Z"

# GoatCounter limite le nombre d'appels par seconde : petite pause et nouvel essai si besoin
function Goat($chemin) {
  for ($essai = 1; $essai -le 4; $essai++) {
    Start-Sleep -Milliseconds 700
    try { return Invoke-RestMethod -Uri "$GOAT$chemin" -Headers $hGoat }
    catch { if ($_.Exception.Response -and [int]$_.Exception.Response.StatusCode -eq 429 -and $essai -lt 4) { Start-Sleep -Seconds 3 } else { throw } }
  }
}

# ---------- GoatCounter ----------
try {
  Write-Host "GoatCounter : visites..."
  $tot = Goat "/stats/total?$periode"
  $jours = @()
  foreach ($s in $tot.stats) { $d = ([string]$s.day).Substring(0, 10); if ($d -le $fin) { $jours += [ordered]@{ day = $d; n = [int]$s.daily } } }
  # « total » compte aussi les evenements (votes, inscriptions) : on les retire pour avoir les visites
  $data.visits = [ordered]@{ total = [int]$tot.total - [int]$tot.total_events; days = $jours }

  Write-Host "GoatCounter : reponses au sondage..."
  $hits = @(); $after = $null
  do {
    $u = "/stats/hits?$periode&limit=100"
    if ($after) { $u += "&exclude_paths=" + ($after -join ",") }
    $r = Goat $u
    $hits += $r.hits
    $after = @($hits | ForEach-Object { $_.path_id })
  } while ($r.more -and $hits.Count -lt 1000)

  # Visites par jour : uniquement les pages vues (les votes et inscriptions sont des evenements)
  $parJourVisites = @{}
  foreach ($h in $hits) {
    if ($h.event) { continue }
    foreach ($s in $h.stats) { $d = ([string]$s.day).Substring(0, 10); $parJourVisites[$d] = [int]$s.daily + [int]$parJourVisites[$d] }
  }
  $data.visits.days = @($data.visits.days | ForEach-Object { [ordered]@{ day = $_.day; n = [int]$parJourVisites[$_.day] } })

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
  $refs = Goat "/stats/toprefs?$periode&limit=20"
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
