@echo off
REM Start Smart Building API with Swagger UI
REM This script starts the API on port 3001 and opens Swagger UI in your browser

cd /d "%~dp0"

echo.
echo ========================================
echo  Smart Building & Industrial IoT API
echo ========================================
echo.
echo Starting API server on port 3001...
echo.

REM Set port environment variable
set PORT=3001

REM Start Node app in background
start "Smart Building API" node dist/main.js

REM Wait for app to start
timeout /t 3 /nobreak

echo.
echo ✅ API is starting...
echo    - Main API: http://localhost:3001
echo    - Swagger UI (NestJS): http://localhost:3001/docs
echo.
echo Attempting to open Swagger UI in browser...
echo.

REM Wait a bit more for app to fully boot
timeout /t 2 /nobreak

REM Try to open Swagger UI in default browser
start http://localhost:3001/docs

echo.
echo If browser didn't open automatically, visit:
echo   http://localhost:3001/docs
echo.
echo To stop the server, close the "Smart Building API" window or press Ctrl+C there.
echo.

pause
