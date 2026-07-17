@echo off
REM Relance FigsApp-Côte d'Ivoire : libere les ports 5000 (API) et 3001 (Vite), puis ouvre deux fenetres CMD.
REM Place ce fichier a la racine du depot (a cote de frontend\ et backend\).

setlocal EnableExtensions
cd /d "%~dp0"

set "DIR_BACKEND=%~dp0backend"
set "DIR_FRONTEND=%~dp0frontend"

if not exist "%DIR_BACKEND%\package.json" (
  echo ERREUR: dossier backend introuvable : "%DIR_BACKEND%"
  pause
  exit /b 1
)
if not exist "%DIR_FRONTEND%\package.json" (
  echo ERREUR: dossier frontend introuvable : "%DIR_FRONTEND%"
  pause
  exit /b 1
)

echo.
echo [FigsApp] Arret des processus en ecoute sur 5000 et 3001...
powershell -NoProfile -ExecutionPolicy Bypass -Command "foreach ($p in 5000,3001) { Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue } }"

echo [FigsApp] Pause 2 s...
timeout /t 2 /nobreak >nul

echo [FigsApp] Demarrage API  ^(npm start^)...
start "FigsApp API :5000" cmd /k cd /d "%DIR_BACKEND%" ^&^& npm start

echo [FigsApp] Demarrage frontend ^(npm run dev^)...
start "FigsApp Vite :3001" cmd /k cd /d "%DIR_FRONTEND%" ^&^& npm run dev

echo.
echo Termine. API http://localhost:5000  |  Site http://localhost:3001
echo Fermez les fenetres CMD pour arreter les serveurs.
echo.
endlocal
