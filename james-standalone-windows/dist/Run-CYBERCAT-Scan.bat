@echo off
title CYBERCAT - Security Scan
cd /d "%~dp0"

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

James.exe scan
pause 
