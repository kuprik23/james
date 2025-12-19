@echo off
title CYBERCAT - Cyber Analysis and Threat Detection

:: Check and enforce Terms acceptance
call Accept-Terms.bat
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Terms and Conditions not accepted.
    echo CYBERCAT cannot run without acceptance.
    echo.
    pause
    exit /b 1
)

echo ========================================
echo   CYBERCAT - Starting Server... 
echo ======================================== 
if exist "config\.env" ( 
    set ENV_FILE=config\.env 
) else ( 
    set ENV_FILE=config\.env.example 
) 
echo Loading configuration from: %ENV_FILE% 
echo. 
echo Starting CYBERCAT server on http://localhost:3000 
echo Browser will open automatically... 
echo. 
echo Press Ctrl+C to stop the server 
echo. 
start http://localhost:3000 
James.exe start 
pause 
