@echo off
title CYBERCAT/James - Terms and Conditions
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
echo Before using CYBERCAT/James, you must read and agree to these Terms and
echo Conditions. By clicking "Accept", you acknowledge that you have read,
echo understood, and agree to be bound by these terms.
echo.
echo ═══════════════════════════════════════════════════════════════════════════
echo.
echo Press ANY KEY to view the complete Terms and Conditions...
pause >nul

:: Show full terms in scrollable window
more < "TERMS-AND-CONDITIONS.txt"

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
    echo User: %USERNAME% >> ".terms-accepted"
    echo Computer: %COMPUTERNAME% >> ".terms-accepted"
    echo.
    echo ✓ Acceptance recorded successfully
    echo.
    echo Press ANY KEY to continue...
    pause >nul
    exit /b 0
) else if "%RESPONSE%"=="DECLINE" (
    echo.
    echo ═══════════════════════════════════════════════════════════════════════════
    echo   ✗ Terms Declined
    echo ═══════════════════════════════════════════════════════════════════════════
    echo.
    echo You have declined the Terms and Conditions.
    echo Installation/Usage will not proceed.
    echo.
    echo Please remove all copies of CYBERCAT/James from your system.
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
    echo Exiting...
    timeout /t 3 >nul
    exit /b 1
)