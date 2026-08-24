# Deploiement production Vercel (build local + deploy CLI).
# Prerequis: vercel login (une fois)
# Usage: powershell -ExecutionPolicy Bypass -File scripts/deploy-vercel.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
Set-Location $Root

function Test-VercelAuth {
  $prev = $ErrorActionPreference
  $ErrorActionPreference = "SilentlyContinue"
  vercel whoami 2>&1 | Out-Null
  $ErrorActionPreference = $prev
  return ($LASTEXITCODE -eq 0)
}

Write-Host "=== FigsApp — deploiement Vercel production ===" -ForegroundColor Cyan

if (-not (Test-VercelAuth)) {
  Write-Host ""
  Write-Host "Connexion Vercel requise. Executez dans ce terminal :" -ForegroundColor Yellow
  Write-Host "  vercel login" -ForegroundColor White
  Write-Host "Puis relancez ce script." -ForegroundColor Yellow
  exit 1
}

if (-not (Test-Path ".vercel\project.json")) {
  Write-Host "Liaison projet (selectionnez le projet avec figsappcotedivoire.com)..." -ForegroundColor Cyan
  vercel link --project frontend --yes
  if ($LASTEXITCODE -ne 0) {
    vercel link --yes
  }
}

Write-Host "Build frontend..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { throw "Build echoue." }

Write-Host "Deploiement production..." -ForegroundColor Cyan
vercel deploy --prod --yes
if ($LASTEXITCODE -ne 0) { throw "Deploiement Vercel echoue." }

Write-Host ""
Write-Host "Deploiement termine. Verification dans ~2 min :" -ForegroundColor Green
Write-Host "  npm run verify:prod"
