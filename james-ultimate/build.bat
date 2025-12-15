@echo off
title James Ultimate - Build Executable
cd /d "%~dp0"

echo.
echo ========================================
echo   James Ultimate - Build Executable
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

:: Install dependencies if needed
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
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
echo Building James.exe...
echo This may take several minutes...
echo.

call npm run build

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   BUILD SUCCESSFUL!
    echo ========================================
    echo.
    echo Executable created at: dist\James.exe
    echo.
    echo You can now run James.exe from anywhere!
    echo.
    
    :: Copy necessary files
    echo Copying configuration files...
    if not exist "dist\public" mkdir dist\public
    xcopy /E /Y public dist\public\ >nul 2>nul
    copy .env dist\ >nul 2>nul
    
    echo Done!
) else (
    echo.
    echo BUILD FAILED!
    echo Please check the error messages above.
)

pause