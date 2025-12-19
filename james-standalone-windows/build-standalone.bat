@echo off
title Building CYBERCAT Standalone Windows Application
cd /d "%~dp0"

echo.
echo ========================================
echo   CYBERCAT - Standalone Builder
echo   Cyber Analysis and Threat Detection
echo   Windows Desktop Application
echo ========================================
echo.

:: Check if we're in the right directory
if not exist "..\james-ultimate\package.json" (
    echo ERROR: Cannot find james-ultimate directory!
    echo Please run this script from james-standalone-windows folder
    pause
    exit /b 1
)

:: Step 1: Build TypeScript
echo [1/5] Building TypeScript...
echo ========================================
cd ..\james-ultimate
call npm run build:ts
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: TypeScript build failed!
    pause
    exit /b 1
)
echo [OK] TypeScript compiled successfully
echo.

:: Step 2: Build executable
echo [2/5] Building Windows executable...
echo ========================================
call npm run build:exe
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Executable build failed!
    pause
    exit /b 1
)
echo [OK] Executable built successfully
echo.

:: Step 3: Create standalone directory structure
echo [3/5] Creating standalone package...
echo ========================================
cd ..\james-standalone-windows

:: Clean old build
if exist "dist" rmdir /s /q dist
mkdir dist
mkdir dist\config
mkdir dist\data
mkdir dist\logs

:: Copy executable
echo Copying James.exe...
copy ..\james-ultimate\dist\James.exe dist\ >nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to copy James.exe
    pause
    exit /b 1
)

:: Copy web interface files
echo Copying web interface...
if not exist "dist\public" mkdir dist\public
xcopy /E /Y /I ..\james-ultimate\public dist\public >nul

:: Copy configuration template
echo Creating configuration files...
echo # James Ultimate Configuration > dist\config\.env.example
echo # >> dist\config\.env.example
echo # LLM Provider Settings >> dist\config\.env.example
echo OPENAI_API_KEY=your-openai-api-key-here >> dist\config\.env.example
echo ANTHROPIC_API_KEY=your-anthropic-api-key-here >> dist\config\.env.example
echo OLLAMA_HOST=http://localhost:11434 >> dist\config\.env.example
echo # >> dist\config\.env.example
echo # Server Settings >> dist\config\.env.example
echo PORT=3000 >> dist\config\.env.example
echo HOST=0.0.0.0 >> dist\config\.env.example

:: Step 4: Copy Java/Kotlin modules if they exist
echo [4/5] Copying additional modules...
echo ========================================

if exist "..\james-ultimate\java-scanner\target\*.jar" (
    echo Copying Java scanner module...
    if not exist "dist\modules\java" mkdir dist\modules\java
    copy ..\james-ultimate\java-scanner\target\*.jar dist\modules\java\ >nul
)

if exist "..\james-ultimate\kotlin-scanner\build\libs\*.jar" (
    echo Copying Kotlin scanner module...
    if not exist "dist\modules\kotlin" mkdir dist\modules\kotlin
    copy ..\james-ultimate\kotlin-scanner\build\libs\*.jar dist\modules\kotlin\ >nul
)

if exist "..\james-ultimate\rust-crypto\target\release\*.dll" (
    echo Copying Rust crypto module...
    if not exist "dist\modules\rust" mkdir dist\modules\rust
    copy ..\james-ultimate\rust-crypto\target\release\*.dll dist\modules\rust\ >nul
)

if exist "..\james-ultimate\cpp-scanner\build\Release\*.dll" (
    echo Copying C++ scanner module...
    if not exist "dist\modules\cpp" mkdir dist\modules\cpp
    copy ..\james-ultimate\cpp-scanner\build\Release\*.dll dist\modules\cpp\ >nul
)

:: Step 5: Create launcher scripts
echo [5/5] Creating launcher scripts...
echo ========================================

:: Create GUI launcher
echo @echo off > dist\Start-CYBERCAT-GUI.bat
echo title CYBERCAT - Cyber Analysis and Threat Detection >> dist\Start-CYBERCAT-GUI.bat
echo cd /d "%%~dp0" >> dist\Start-James-GUI.bat
echo echo. >> dist\Start-James-GUI.bat
echo echo ======================================== >> dist\Start-CYBERCAT-GUI.bat
echo echo   CYBERCAT - Starting Server... >> dist\Start-CYBERCAT-GUI.bat
echo echo ======================================== >> dist\Start-CYBERCAT-GUI.bat
echo echo. >> dist\Start-James-GUI.bat
echo if exist "config\.env" ( >> dist\Start-CYBERCAT-GUI.bat
echo     set ENV_FILE=config\.env >> dist\Start-CYBERCAT-GUI.bat
echo ) else ( >> dist\Start-CYBERCAT-GUI.bat
echo     set ENV_FILE=config\.env.example >> dist\Start-CYBERCAT-GUI.bat
echo ) >> dist\Start-CYBERCAT-GUI.bat
echo echo Loading configuration from: %%ENV_FILE%% >> dist\Start-CYBERCAT-GUI.bat
echo echo. >> dist\Start-CYBERCAT-GUI.bat
echo echo Starting CYBERCAT server on http://localhost:3000 >> dist\Start-CYBERCAT-GUI.bat
echo echo Browser will open automatically... >> dist\Start-CYBERCAT-GUI.bat
echo echo. >> dist\Start-CYBERCAT-GUI.bat
echo echo Press Ctrl+C to stop the server >> dist\Start-CYBERCAT-GUI.bat
echo echo. >> dist\Start-CYBERCAT-GUI.bat
echo start http://localhost:3000 >> dist\Start-CYBERCAT-GUI.bat
echo James.exe start >> dist\Start-CYBERCAT-GUI.bat
echo pause >> dist\Start-CYBERCAT-GUI.bat

:: Create CLI launcher
echo @echo off > dist\Start-CYBERCAT-CLI.bat
echo title CYBERCAT - Interactive CLI >> dist\Start-CYBERCAT-CLI.bat
echo cd /d "%%~dp0" >> dist\Start-CYBERCAT-CLI.bat
echo James.exe chat >> dist\Start-CYBERCAT-CLI.bat
echo pause >> dist\Start-CYBERCAT-CLI.bat

:: Create security scan launcher
echo @echo off > dist\Run-CYBERCAT-Scan.bat
echo title CYBERCAT - Security Scan >> dist\Run-CYBERCAT-Scan.bat
echo cd /d "%%~dp0" >> dist\Run-CYBERCAT-Scan.bat
echo James.exe scan >> dist\Run-CYBERCAT-Scan.bat
echo pause >> dist\Run-CYBERCAT-Scan.bat

:: Copy README
copy README.md dist\ >nul 2>nul
copy CYBERCAT-ASCII.txt dist\ >nul 2>nul
if not exist "dist\README.md" (
    echo Creating README...
    echo # CYBERCAT - Standalone Windows Application > dist\README.md
    echo. >> dist\README.md
    echo ## Quick Start >> dist\README.md
    echo. >> dist\README.md
    echo 1. Double-click Start-CYBERCAT-GUI.bat to launch the web interface >> dist\README.md
    echo 2. Or use Start-CYBERCAT-CLI.bat for command-line interface >> dist\README.md
    echo 3. Configure API keys in config\.env if needed >> dist\README.md
)

echo.
echo ========================================
echo   BUILD COMPLETE!
echo ========================================
echo.
echo Standalone application created in: dist\
echo.
echo Files created:
echo   - James.exe (CYBERCAT main executable)
echo   - Start-CYBERCAT-GUI.bat (launch web interface)
echo   - Start-CYBERCAT-CLI.bat (launch CLI)
echo   - Run-CYBERCAT-Scan.bat (run security scan)
echo   - config\.env.example (configuration template)
echo   - public\ (web interface)
echo   - modules\ (Java/Kotlin/Rust/C++ modules)
echo.
echo To run CYBERCAT:
echo   1. Go to dist\ folder
echo   2. Run Start-CYBERCAT-GUI.bat
echo.
echo Press any key to open the dist folder...
pause
explorer dist