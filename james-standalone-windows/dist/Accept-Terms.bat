@echo off
title CYBERCAT - Terms and Conditions
cd /d "%~dp0"

:: Check if terms have been accepted
if exist ".terms-accepted" (
    exit /b 0
)

:: Display Terms and Conditions
cls
echo.
echo ═══════════════════════════════════════════════════════════════════════════
echo                     CYBERCAT - TERMS AND CONDITIONS
echo             Cyber Analysis ^& Threat Detection System v2.0.0
echo ═══════════════════════════════════════════════════════════════════════════
echo.
echo                         IMPORTANT LEGAL NOTICE
echo                      PLEASE READ CAREFULLY
echo.
echo Before using CYBERCAT, you must read and agree to these Terms and Conditions.
echo By clicking "Accept", you acknowledge that you have read, understood, and
echo agree to be bound by these terms.
echo.
echo ═══════════════════════════════════════════════════════════════════════════
echo.
echo Press ANY KEY to view the complete Terms and Conditions...
pause >nul

:: Show full terms in scrollable window
more < "..\TERMS-AND-CONDITIONS.txt"

:: Ask for acceptance
echo.
echo ═══════════════════════════════════════════════════════════════════════════
echo.
echo Do you ACCEPT these Terms and Conditions?
echo.
echo Type 'ACCEPT' to agree and continue (case-sensitive)
echo Type 'DECLINE' to exit without installing
echo.
set /p RESPONSE="Your choice (ACCEPT/DECLINE): "

if "%RESPONSE%"=="ACCEPT" (
    echo.
    echo ═══════════════════════════════════════════════════════════════════════════
    echo   ✓ Terms Accepted
    echo ═══════════════════════════════════════════════════════════════════════════
    echo.
    echo You have accepted the Terms and Conditions.
    echo This acceptance will be recorded for future runs.
    echo.
    echo Creating acceptance record...
    echo Terms accepted on %date% at %time% > ".terms-accepted"
    echo User IP: %COMPUTERNAME% >> ".terms-accepted"
    echo.
    echo ✓ Acceptance recorded successfully
    echo.
    echo Press ANY KEY to continue to CYBERCAT...
    pause >nul
    exit /b 0
) else if "%RESPONSE%"=="DECLINE" (
    echo.
    echo ═══════════════════════════════════════════════════════════════════════════
    echo   ✗ Terms Declined
    echo ═══════════════════════════════════════════════════════════════════════════
    echo.
    echo You have declined the Terms and Conditions.
    echo CYBERCAT will not be installed or run.
    echo.
    echo Please remove all copies of CYBERCAT from your system.
    echo.
    echo Press ANY KEY to exit...
    pause >nul
    exit /b 1
) else (
    echo.
    echo ═══════════════════════════════════════════════════════════════════════════
    echo   ✗ Invalid Response
    echo ═══════════════════════════════════════════════════════════════════════════
    echo.
    echo You must type exactly 'ACCEPT' or 'DECLINE' (case-sensitive)
    echo.
    echo Press ANY KEY to try again...
    pause >nul
    goto :EOF
)