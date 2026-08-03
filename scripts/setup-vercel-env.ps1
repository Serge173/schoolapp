# Vercel — configuration dashboard (projet schoolapp / figsapp)
# Root Directory : . (racine du repo, PAS frontend/)
# Framework Preset : Other (PAS Vite)
# Node.js : 20.x
# Build Command : (vide — vercel.json) ou npm run vercel-build
# Output Directory : frontend/dist
# Install Command : (vide — vercel.json)

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

Write-Host "=== FigsApp — variables Vercel ===" -ForegroundColor Cyan

if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
  Write-Host "Installez Vercel CLI : npm i -g vercel" -ForegroundColor Red
  exit 1
}

$jwt = "c0fa1d11372c43eb6ef99da0b89599b07b4cb29f085bfa56e25d128c28c8b780ca391ff32924613a00a85581c8df536d"

function Add-VercelEnv($name, $value) {
  Write-Host "Ajout $name ..."
  $value | vercel env add $name production preview --force 2>$null
  if ($LASTEXITCODE -ne 0) {
    $value | vercel env add $name production --force
    $value | vercel env add $name preview --force
  }
}

Add-VercelEnv "NODE_ENV" "production"
Add-VercelEnv "JWT_SECRET" $jwt
Add-VercelEnv "CORS_ORIGIN" "https://figsappcotedivoire.com,https://www.figsappcotedivoire.com"

Write-Host ""
Write-Host "Dashboard Vercel (Build and Deployment) :" -ForegroundColor Yellow
Write-Host "  Root Directory = . (vide)"
Write-Host "  Framework Preset = Other"
Write-Host "  Node.js = 20.x"
Write-Host "  Build / Install = vides (vercel.json gere tout)"
Write-Host "  Output Directory = admin/dist"
Write-Host ""
Write-Host "Supprimez VITE_API_BASE si present."
Write-Host ""
Write-Host "Test : https://figsappcotedivoire.com/api/health" -ForegroundColor Green
