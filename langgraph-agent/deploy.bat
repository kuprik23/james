@echo off
title James AI Security Agent - Deploy to Digital Ocean
cd /d "%~dp0"

echo ========================================
echo   Deploy to Digital Ocean
echo ========================================
echo.

:: Check if virtual environment exists
if not exist "venv" (
    echo Setting up environment first...
    call setup.bat
)

:: Activate virtual environment
call venv\Scripts\activate.bat

:: Run deployment script
echo.
echo Starting deployment...
python deploy-to-digitalocean.py

pause