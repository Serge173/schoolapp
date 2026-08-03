# Référence dashboard Vercel — projet frontend / figsappcotedivoire.com
# Voir aussi config/vercel.env.example et DEPLOIEMENT-VERCEL.md

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

Write-Host "=== FigsApp — configuration Vercel (dashboard) ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Settings → General → Build and Deployment :" -ForegroundColor Yellow
Write-Host "  Root Directory     = . (vide, racine du repo)"
Write-Host "  Framework Preset   = Other"
Write-Host "  Node.js Version    = 24.x"
Write-Host "  Build Command      = npm run build  (ou vide — vercel.json)"
Write-Host "  Output Directory   = admin/dist"
Write-Host "  Install Command    = npm install --omit=dev  (ou vide — vercel.json)"
Write-Host ""
Write-Host "Settings → Environment Variables (Production + Preview) :" -ForegroundColor Yellow
Write-Host "  1. Storage → Neon → Connect to Project (prefix vide)"
Write-Host "  2. Ajoutez les variables de config/vercel.env.example"
Write-Host "  3. Supprimez VITE_API_BASE et variables MySQL (DB_HOST, etc.)"
Write-Host ""
Write-Host "Redeploy sans cache, puis testez :" -ForegroundColor Green
Write-Host "  https://figsappcotedivoire.com/api/health"
Write-Host "  https://figsappcotedivoire.com/api/ping"
Write-Host "  https://figsappcotedivoire.com/api/programmes-figs"
