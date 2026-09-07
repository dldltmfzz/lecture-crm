@echo off
setlocal EnableExtensions

set "REPO_WIN=%~dp0"
set "WSLENV=REPO_WIN/p"

if not exist "%REPO_WIN%apps\web\package.json" (
  echo Could not find the project files.
  pause
  exit /b 1
)

echo Running typecheck, tests, and lint...
wsl.exe bash -lc "export PATH=/home/user/.local/bin:/usr/local/bin:/usr/bin:/bin; cd $REPO_WIN; status=0; pnpm --filter @aileaders/web typecheck || status=1; pnpm --filter @aileaders/web test || status=1; pnpm --filter @aileaders/web lint || status=1; exit $status"
set "CHECK_EXIT=%ERRORLEVEL%"

if not "%CHECK_EXIT%"=="0" (
  echo.
  echo One or more checks failed.
  echo Show the output to Codex so it can be fixed.
) else (
  echo.
  echo All local checks passed.
)

pause
exit /b %CHECK_EXIT%
