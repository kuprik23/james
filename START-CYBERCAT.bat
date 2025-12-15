@echo off
REM ════════════════════════════════════════════════════════════════════════════
REM CYBERCAT Platform - One-Click Launcher
REM Copyright © 2024 Emersa Ltd. All Rights Reserved.
REM ════════════════════════════════════════════════════════════════════════════

title CYBERCAT Platform Launcher

echo.
echo ╔═══════════════════════════════════════════════════════════════════════════╗
echo ║   CYBERCAT - Military-Grade Cybersecurity Platform                        ║
echo ║   Copyright © 2024 Emersa Ltd                                             ║
echo ╚═══════════════════════════════════════════════════════════════════════════╝
echo.
echo 🚀 Starting CYBERCAT Platform...
echo.

cd james-ultimate

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 First-time setup detected...
    echo Installing dependencies...
    call npm install
    echo.
)

REM Start the server
echo 🛡️  Launching security platform...
start "CYBERCAT Server" cmd /k "npm run server"

REM Wait a bit for server to start
timeout /t 3 /nobreak >nul

REM Open browser
echo 🌐 Opening web interface...
start http://localhost:3000

echo.
echo ✅ CYBERCAT Platform is running!
echo.
echo 📍 Server: http://localhost:3000
echo 📚 Documentation: README.md
echo 🛡️  Security Guide: SECURITY.md
echo.
echo Press any key to close this window...
pause >nul