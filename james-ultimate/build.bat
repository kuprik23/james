@echo off
title James Ultimate - Multi-Language Build
cd /d "%~dp0"

echo.
echo ========================================
echo   James Ultimate - Multi-Language Build
echo ========================================
echo.
echo Building TypeScript, Java, Kotlin, Rust, and C++ modules
echo.

:: Check prerequisites
echo [1/4] Checking prerequisites...
echo ========================================
set PREREQ_MISSING=0

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [X] Node.js not found
    set PREREQ_MISSING=1
) else (
    echo [OK] Node.js installed
)

where java >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [X] Java not found
    set PREREQ_MISSING=1
) else (
    echo [OK] Java installed
)

where mvn >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Maven not found - Java module won't build
) else (
    echo [OK] Maven installed
)

where rustc >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Rust not found - Rust crypto module won't build
) else (
    echo [OK] Rust installed
)

where cmake >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] CMake not found - C++ module won't build
) else (
    echo [OK] CMake installed
)

where cl >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] MSVC compiler found
) else (
    where g++ >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo [OK] GCC/MinGW compiler found
    ) else (
        echo [WARNING] C++ compiler not found - C++ module won't build
    )
)

if %PREREQ_MISSING% EQU 1 (
    echo.
    echo ERROR: Critical prerequisites missing!
    echo Please run setup-prerequisites.bat first
    pause
    exit /b 1
)

:: Install npm dependencies if needed
if not exist "node_modules" (
    echo.
    echo [2/4] Installing npm dependencies...
    echo ========================================
    call npm install
)

:: Create dist directory
if not exist "dist" mkdir dist

:: Build all modules
echo.
echo [3/4] Building all modules...
echo ========================================

echo.
echo Building TypeScript...
call npm run build:ts
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] TypeScript build failed
    goto :build_failed
)
echo [OK] TypeScript built successfully

echo.
echo Building Java module...
call npm run build:java
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Java build failed - continuing anyway
) else (
    echo [OK] Java module built successfully
)

echo.
echo Building Kotlin module...
call npm run build:kotlin
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Kotlin build failed - continuing anyway
) else (
    echo [OK] Kotlin module built successfully
)

echo.
echo Building Rust crypto module...
call npm run build:rust
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Rust build failed - continuing anyway
) else (
    echo [OK] Rust module built successfully
)

echo.
echo Building C++ scanner module...
call npm run build:cpp
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] C++ build failed - continuing anyway
) else (
    echo [OK] C++ module built successfully
)

:: Build executable
echo.
echo [4/4] Building executable...
echo ========================================

:: Install pkg globally if not present
call npm list -g pkg >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Installing pkg globally...
    call npm install -g pkg
)

echo Building James.exe...
call npm run build:exe

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   BUILD SUCCESSFUL!
    echo ========================================
    echo.
    echo Executable created at: dist\James.exe
    echo.
    
    :: Copy necessary files
    echo Copying configuration files...
    if not exist "dist\public" mkdir dist\public
    xcopy /E /Y public dist\public\ >nul 2>nul
    if exist ".env" copy .env dist\ >nul 2>nul
    
    :: Copy compiled modules
    if exist "java-scanner\target\security-scanner.jar" (
        if not exist "dist\java-scanner" mkdir dist\java-scanner
        copy java-scanner\target\security-scanner.jar dist\java-scanner\ >nul 2>nul
        echo [OK] Copied Java module
    )
    
    if exist "kotlin-scanner\build\libs\kotlin-scanner-2.0.0.jar" (
        if not exist "dist\kotlin-scanner" mkdir dist\kotlin-scanner
        copy kotlin-scanner\build\libs\kotlin-scanner-2.0.0.jar dist\kotlin-scanner\ >nul 2>nul
        echo [OK] Copied Kotlin module
    )
    
    if exist "rust-crypto\target\release\james_crypto.dll" (
        if not exist "dist\rust-crypto" mkdir dist\rust-crypto
        copy rust-crypto\target\release\james_crypto.dll dist\rust-crypto\ >nul 2>nul
        echo [OK] Copied Rust module
    )
    
    if exist "cpp-scanner\build\Release\james_scanner.dll" (
        if not exist "dist\cpp-scanner" mkdir dist\cpp-scanner
        copy cpp-scanner\build\Release\james_scanner.dll dist\cpp-scanner\ >nul 2>nul
        echo [OK] Copied C++ module
    )
    
    echo.
    echo You can now run James.exe from: %cd%\dist\James.exe
    echo Done!
    goto :end
) else (
    :build_failed
    echo.
    echo ========================================
    echo   BUILD FAILED!
    echo ========================================
    echo Please check the error messages above.
    echo.
    echo To install missing prerequisites, run:
    echo   setup-prerequisites.bat
)

:end
pause