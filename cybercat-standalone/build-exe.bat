@echo off
title Building CyberCat Executable
cd /d "%~dp0"

echo ========================================
echo   CyberCat Executable Builder
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

:: Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm is not installed.
    pause
    exit /b 1
)

:: Install dependencies if needed
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to install dependencies.
        pause
        exit /b 1
    )
)

:: Install pkg globally if not present
echo Checking for pkg...
call npm list -g pkg >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Installing pkg globally...
    call npm install -g pkg
)

:: Create dist directory
if not exist "dist" mkdir dist

:: Build the executable
echo.
echo Building CyberCat.exe...
echo This may take a few minutes...
echo.

call npx pkg . --targets node18-win-x64 --output dist/CyberCat.exe

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   BUILD SUCCESSFUL!
    echo ========================================
    echo.
    echo Executable created at: dist\CyberCat.exe
    echo.
    echo You can now run CyberCat.exe from anywhere!
    echo.
) else (
    echo.
    echo BUILD FAILED!
    echo Please check the error messages above.
)

pause