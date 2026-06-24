@echo off
rem ProcureHub launcher: starts the server if it's not running, then opens Edge.
set "PATH=%USERPROFILE%\nodejs-portable\node-v22.14.0-win-x64;%PATH%"
cd /d "C:\Users\procu\OneDrive\Desktop\Claude Project\procurehub"

rem Already running? Just open the browser.
powershell -NoProfile -Command "try { Invoke-WebRequest -Uri 'http://localhost:3000/login' -UseBasicParsing -TimeoutSec 3 | Out-Null; exit 0 } catch { exit 1 }"
if %errorlevel%==0 goto open

echo Starting ProcureHub server...
start "ProcureHub Server" /min cmd /k "npm run dev"

echo Waiting for the server to come up (first start can take a minute)...
powershell -NoProfile -Command "$d=(Get-Date).AddSeconds(180); while((Get-Date) -lt $d){ try { Invoke-WebRequest -Uri 'http://localhost:3000/login' -UseBasicParsing -TimeoutSec 3 | Out-Null; exit 0 } catch { Start-Sleep -Seconds 2 } }; exit 1"
if not %errorlevel%==0 (
  echo Server did not start. Check the "ProcureHub Server" window for errors.
  pause
  exit /b 1
)

:open
start msedge http://localhost:3000
exit /b 0
