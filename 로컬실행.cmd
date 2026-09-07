@echo off
setlocal EnableExtensions

set "REPO_WIN=%~dp0"
set "WSLENV=REPO_WIN/p"
set "LOCAL_URL=http://localhost:3000/login"

if not exist "%REPO_WIN%apps\web\package.json" (
  echo Project files were not found.
  echo Keep this file in the AILeaders repository root.
  pause
  exit /b 1
)

call :is_ready
if not errorlevel 1 (
  echo AILeaders local server is already running.
  goto open_browser
)

echo Starting the AILeaders local server.
echo Keep the new server window open while reviewing the site.
start "AILeaders Local Server" cmd.exe /k wsl.exe bash -lc "export PATH=/home/user/.local/bin:/usr/local/bin:/usr/bin:/bin; cd $REPO_WIN && pnpm --filter @aileaders/web dev"

echo Waiting for the local server to become ready.
for /l %%I in (1,1,60) do (
  call :is_ready
  if not errorlevel 1 goto open_browser
  timeout /t 1 /nobreak >nul
)

echo The local server was not ready within 60 seconds.
echo Check the server window for an error message.
pause
exit /b 1

:open_browser
start "" "%LOCAL_URL%"

echo Opened %LOCAL_URL% in the default browser.
echo Press Ctrl+C in the server window to stop the server.
exit /b 0

:is_ready
powershell.exe -NoProfile -Command "try { $response = Invoke-WebRequest -UseBasicParsing -Uri '%LOCAL_URL%' -TimeoutSec 2; if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) { exit 0 } } catch {}; exit 1" >nul 2>&1
exit /b %ERRORLEVEL%
