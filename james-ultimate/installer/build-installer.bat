@echo off
title Build James Ultimate Installer
cd /d "%~dp0"

echo.
echo ========================================
echo   Building James Ultimate Installer
echo ========================================
echo.

:: Check if Inno Setup is installed
if exist "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" (
    set ISCC="C:\Program Files (x86)\Inno Setup 6\ISCC.exe"
) else if exist "C:\Program Files\Inno Setup 6\ISCC.exe" (
    set ISCC="C:\Program Files\Inno Setup 6\ISCC.exe"
) else (
    echo ERROR: Inno Setup not found!
    echo.
    echo Please install Inno Setup 6:
    echo https://jrsoftware.org/isdl.php
    echo.
    pause
    exit /b 1
)

:: Check if dist exists
if not exist "..\dist\" (
    echo Building application first...
    cd ..
    call npm run build
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Build failed!
        pause
        exit /b 1
    )
    cd installer
)

:: Compile installer
echo.
echo Compiling installer with Inno Setup...
%ISCC% james-installer.iss

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   Installer Built Successfully!
    echo ========================================
    echo.
    echo Installer location: output\James-Ultimate-Setup-2.0.0.exe
    echo.
    echo You can now distribute this installer!
    echo.
) else (
    echo.
    echo ERROR: Installer build failed!
    echo.
)

pause
