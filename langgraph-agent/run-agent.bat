@echo off
title James AI Security Agent
cd /d "%~dp0"

echo ========================================
echo   James AI Security Agent
echo ========================================
echo.

:: Check if virtual environment exists
if not exist "venv" (
    echo Virtual environment not found.
    echo Please run setup.bat first.
    pause
    exit /b 1
)

:: Activate virtual environment
call venv\Scripts\activate.bat

:: Check if .env exists
if not exist ".env" (
    echo .env file not found.
    echo Creating from template...
    copy .env.example .env
    echo.
    echo Please edit .env and add your API keys, then run this script again.
    pause
    exit /b 1
)

:: Start the server
echo Starting James AI Security Agent Server...
echo.
echo API Documentation: http://localhost:8000/docs
echo Health Check: http://localhost:8000/health
echo.
echo Press Ctrl+C to stop the server.
echo.

python server.py

pause