@echo off
setlocal
title TidSure

rem ============================================================
rem  TidSure - one file, one window, runs the whole app.
rem
rem  Double-click this file. It will:
rem    1) clean up any leftover servers
rem    2) start the backend API   (in the background)
rem    3) start the frontend site (in this window)
rem    4) open your browser at http://localhost:5173
rem
rem  To stop: just close this window. Anything left over is
rem  cleaned up automatically the next time you run this file.
rem
rem  NOTE: written in English only on purpose - Thai text inside
rem  a .bat gets garbled by cmd.exe and breaks parsing.
rem ============================================================

rem --- 1) Put Node.js on PATH -------------------------------------------------
rem Windows Explorer can still use an OLD PATH from before Node was installed,
rem so npm is not found on double-click. Add it here to be safe.
rem If you move Node.js elsewhere, change NODE_DIR below.
set "NODE_DIR=E:\"
set "PATH=%NODE_DIR%;%PATH%"

set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "FRONTEND=%ROOT%frontend"

echo ==================================================
echo   TidSure
echo ==================================================
echo.

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm was not found.
  echo Node.js is expected at: %NODE_DIR%
  echo If it is somewhere else, edit: set "NODE_DIR=..." in this file.
  echo.
  pause
  exit /b 1
)

rem --- 2) Clean up leftovers ---------------------------------------------------
rem A server left running from an earlier session keeps holding its port and
rem serves STALE code, which looks like "my changes did nothing".
echo Cleaning up old servers...
call :killport 5000
call :killport 5173
call :killport 5174

rem --- 3) Backend needs its .env ----------------------------------------------
if not exist "%BACKEND%\.env" (
  echo [ERROR] Missing file: %BACKEND%\.env
  echo Copy .env.example to .env and fill in MONGODB_URI and JWT_SECRET.
  echo.
  pause
  exit /b 1
)

rem --- 4) First run: install dependencies --------------------------------------
if not exist "%BACKEND%\node_modules" (
  echo Installing backend dependencies for the first time, please wait...
  pushd "%BACKEND%"
  call npm install
  popd
)
if not exist "%FRONTEND%\node_modules" (
  echo Installing frontend dependencies for the first time, please wait...
  pushd "%FRONTEND%"
  call npm install
  popd
)

rem --- 5) Start the backend in the background (no extra window) -----------------
rem We use "npm start" (plain node), NOT "npm run dev" (nodemon).
rem Reason: nodemon listens on stdin for its "rs" restart command. Sharing this
rem console with the frontend made them fight over stdin and the site never came up.
rem Auto-restart is a coding feature; for just running the app plain node is right.
echo Starting backend API...
start /b "" cmd /c "cd /d %BACKEND% && set PATH=%NODE_DIR%;%%PATH%% && npm start"

rem --- 6) Wait until the backend actually answers ------------------------------
echo Waiting for the backend to be ready...
set /a tries=0
:waitloop
set /a tries+=1
curl -s -o nul http://localhost:5000/api/health
if not errorlevel 1 goto backend_ok
if %tries% GEQ 30 goto backend_slow
rem Sleep ~1 second. We use ping instead of "timeout" on purpose:
rem "timeout" crashes with "Input redirection is not supported" in some contexts,
rem which turns this into a busy loop that gives up instantly.
ping -n 2 127.0.0.1 >nul
goto waitloop

:backend_slow
echo.
echo [WARNING] The backend did not answer within 30 seconds.
echo The website will still open, but LOGIN and REGISTER will not work.
echo Any backend error is printed in this same window - scroll up to read it.
echo Most common cause: your IP is not allowed in MongoDB Atlas
echo (Atlas -^> Network Access -^> Add IP Address -^> 0.0.0.0/0).
echo.
goto start_frontend

:backend_ok
echo Backend is ready.

:start_frontend
echo Starting website...
echo.
echo   Your browser will open at http://localhost:5173
echo   Close this window when you are done.
echo.
cd /d "%FRONTEND%"
call npm run dev

rem --- 7) Frontend stopped -> shut the backend down too ------------------------
echo.
echo Shutting down...
call :killport 5000
call :killport 5173
call :killport 5174
echo Stopped.
ping -n 3 127.0.0.1 >nul
exit /b 0

rem ============================================================
rem  Helper: kill whatever process is LISTENING on a given port
rem ============================================================
:killport
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":%~1 " ^| findstr "LISTENING"') do (
  taskkill /F /PID %%p >nul 2>nul
)
exit /b 0
