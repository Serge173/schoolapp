# Configure JWT_SECRET explicite sur Vercel (Production + Preview).
# Usage: powershell -ExecutionPolicy Bypass -File scripts/setup-jwt-secret-vercel.ps1
# Prerequis: vercel login (une fois)

param(
  [string]$ProjectName = "",
  [switch]$SkipDeploy
)

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root

function Write-Step($msg) {
  Write-Host $msg -ForegroundColor Cyan
}

function Test-VercelAuth {
  $prev = $ErrorActionPreference
  $ErrorActionPreference = "SilentlyContinue"
  $out = vercel whoami 2>&1
  $ErrorActionPreference = $prev
  return ($LASTEXITCODE -eq 0)
}

function Ensure-VercelAuth {
  if (Test-VercelAuth) { return }
  Write-Host ""
  Write-Host "Connexion Vercel requise. Un navigateur va s'ouvrir..." -ForegroundColor Yellow
  vercel login
  if (-not (Test-VercelAuth)) {
    throw "Echec connexion Vercel. Relancez apres vercel login."
  }
}

Write-Step "=== FigsApp - configuration JWT_SECRET sur Vercel ==="
Ensure-VercelAuth

$secret = node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
if (-not $secret -or $secret.Length -lt 32) {
  throw "Generation JWT_SECRET invalide."
}

if ($ProjectName) {
  Write-Step "Liaison projet Vercel: $ProjectName"
  vercel link --project $ProjectName --yes
}
elseif (-not (Test-Path ".vercel\project.json")) {
  Write-Step "Liaison au projet Vercel (selectionnez figsappcotedivoire.com)"
  vercel link --yes
}

Write-Step "Ajout JWT_SECRET (Production + Preview)..."
foreach ($envName in @("production", "preview")) {
  vercel env add JWT_SECRET $envName --value $secret --sensitive --force --yes
  if ($LASTEXITCODE -ne 0) {
    throw "Echec vercel env add JWT_SECRET ($envName)"
  }
  Write-Host "  OK  JWT_SECRET -> $envName" -ForegroundColor Green
}

Write-Host ""
Write-Host "JWT_SECRET configure sur Vercel." -ForegroundColor Green
Write-Host "Note: au prochain deploiement, les sessions admin actives seront invalidees (reconnexion requise)." -ForegroundColor Yellow
Write-Host "La valeur n'est pas enregistree localement (Vercel > Settings > Environment Variables)." -ForegroundColor Gray

if (-not $SkipDeploy) {
  Write-Step "Redeploiement production..."
  vercel deploy --prod --yes
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Deploiement CLI echoue - redeployez depuis le dashboard Vercel (sans cache)." -ForegroundColor Yellow
  }
  else {
    Write-Host "Deploiement demande." -ForegroundColor Green
  }
}
else {
  Write-Host "Redeployez sans cache depuis Vercel pour appliquer la variable." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Verification (apres propagation ~2 min):" -ForegroundColor Cyan
Write-Host "  npm run verify:security"
Write-Host "  npm run verify:prod"
