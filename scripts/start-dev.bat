@echo off
REM FigsApp — API :5000 + Admin Vite :3001
setlocal EnableExtensions
cd /d "%~dp0\.."

echo [FigsApp] Liberation ports 5000 et 3001...
powershell -NoProfile -ExecutionPolicy Bypass -Command "foreach ($p in 5000,3001) { Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue } }"
timeout /t 2 /nobreak >nul

echo [FigsApp] Demarrage npm run dev...
start "FigsApp" cmd /k npm run dev

echo Site http://localhost:3001  |  API http://localhost:5000  |  Admin /admin
endlocal
