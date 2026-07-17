# Configuration Vercel — à lancer UNE FOIS dans PowerShell
# Prérequis : vercel login  (puis relancer ce script)

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

Write-Host "=== FigsApp — variables Vercel ===" -ForegroundColor Cyan

if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
  Write-Host "Installez Vercel CLI : npm i -g vercel" -ForegroundColor Red
  exit 1
}

$jwt = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object { [char]$_ })
# JWT fixe pour éviter de changer les sessions à chaque run (modifiable)
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
Write-Host "Supprimez VITE_API_BASE manuellement si elle pointe vers une ancienne URL :" -ForegroundColor Yellow
Write-Host "  Vercel > frontend > Settings > Environment Variables > VITE_API_BASE > Delete"
Write-Host ""
Write-Host "Puis : Deployments > dernier deploiement main > ... > Promote to Production"
Write-Host "Ou   : vercel --prod"
Write-Host ""
Write-Host "Test : https://figsappcotedivoire.com/api/health" -ForegroundColor Green
