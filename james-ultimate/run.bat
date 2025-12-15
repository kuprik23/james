@echo off
title James Ultimate - Cybersecurity Platform
cd /d "%~dp0"

echo.
echo ========================================
echo   James Ultimate - Cybersecurity Platform
echo ========================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed.
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

:: Check if dependencies are installed
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to install dependencies.
        pause
        exit /b 1
    )
)

:: Run James
echo Starting James Ultimate...
echo.
echo Web GUI will open at: http://localhost:3000
echo.
node src/main.js start

pause