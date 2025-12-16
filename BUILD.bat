@echo off
setlocal enabledelayedexpansion

:: ============================================
:: CyberCAT Security Platform - Production Build Script
:: ============================================

color 0A
title CyberCAT - Production Build

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                                                               ║
echo ║      /\_____/\                                                ║
echo ║     /  o   o  \     CYBERCAT v2.0                            ║
echo ║    ( ==  ^  == )    Production Build System                  ║
echo ║     )         (     ═══════════════════════════════════      ║
echo ║    (           )                                              ║
echo ║   ( (  )   (  ) )   Building for production...               ║
echo ║  (__(__)___(__)__)                                            ║
echo ║                                                               ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

:: Create build log
set BUILDLOG=%CD%\build-log.txt
echo CyberCAT Security Platform - Production Build Log > %BUILDLOG%
echo Started: %date% %time% >> %BUILDLOG%
echo. >> %BUILDLOG%

:: ============================================
:: Step 1: Clean Previous Builds
:: ============================================
echo [1/5] Cleaning previous builds...
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if exist "dist" (
    echo Removing old dist directory...
    rd /s /q dist
)

mkdir dist 2>nul
mkdir dist\cybercat-standalone 2>nul
mkdir dist\cybercat-scanner 2>nul
mkdir dist\emersa-gui 2>nul
mkdir dist\james-ultimate 2>nul

echo [√] Clean complete
echo.

:: ============================================
:: Step 2: Build CyberCat Standalone Executable
:: ============================================
echo [2/5] Building CyberCat Standalone executable...
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

cd cybercat-standalone
echo Building CyberCat.exe...
call npm run build 2>> %BUILDLOG%
if %errorLevel% NEQ 0 (
    echo [!] CyberCat build failed
    goto :error
)

if exist "dist\CyberCat.exe" (
    echo [√] CyberCat.exe created
    copy dist\CyberCat.exe ..\dist\cybercat-standalone\ >nul
    copy README.md ..\dist\cybercat-standalone\ >nul
    copy run-cybercat.bat ..\dist\cybercat-standalone\ >nul 2>nul
    echo Built: CyberCat Standalone >> %BUILDLOG%
) else (
    echo [!] CyberCat.exe not found after build
)
cd ..

echo.

:: ============================================
:: Step 3: Package Emersa GUI
:: ============================================
echo [3/5] Packaging Emersa GUI...
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

xcopy /E /I /Y emersa-gui\*.* dist\emersa-gui\ >nul
echo [√] Emersa GUI packaged
echo Packaged: Emersa GUI >> %BUILDLOG%

echo.

:: ============================================
:: Step 4: Package James Ultimate
:: ============================================
echo [4/5] Packaging James Ultimate...
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

xcopy /E /I /Y james-ultimate\*.* dist\james-ultimate\ >nul
echo [√] James Ultimate packaged
echo Packaged: James Ultimate >> %BUILDLOG%

echo.

:: ============================================
:: Step 5: Create Distribution Package
:: ============================================
echo [5/5] Creating distribution package...
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

:: Copy root files
copy README.md dist\ >nul
copy LICENSE dist\ >nul 2>nul
copy SECURITY.md dist\ >nul
copy SECURITY-AUDIT.md dist\ >nul
copy STANDALONES-GUIDE.md dist\ >nul
copy INSTALL.bat dist\ >nul
copy configure-api-keys.bat dist\ >nul

:: Copy example .env files (not real ones!)
copy digitalocean-mcp\.env.example dist\ >nul
copy langgraph-agent\.env.example dist\ >nul

:: Create distribution README
echo # CyberCAT Security Platform - Distribution Package > dist\README-DIST.md
echo. >> dist\README-DIST.md
echo This is the production-ready distribution of CyberCAT. >> dist\README-DIST.md
echo. >> dist\README-DIST.md
echo ## Quick Start >> dist\README-DIST.md
echo 1. Run INSTALL.bat as Administrator >> dist\README-DIST.md
echo 2. Configure API keys with configure-api-keys.bat >> dist\README-DIST.md
echo 3. Launch with START-ALL.bat >> dist\README-DIST.md
echo. >> dist\README-DIST.md
echo For full documentation, see README.md >> dist\README-DIST.md

:: Create checksums for integrity verification
echo Creating checksums...
certutil -hashfile dist\README.md SHA256 > dist\checksums.txt 2>nul
echo [√] Checksums created

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                                                               ║
echo ║                   BUILD COMPLETE!                             ║
echo ║                                                               ║
echo ║   Production build ready in: dist\                           ║
echo ║                                                               ║
echo ║   Contents:                                                   ║
echo ║   • cybercat-standalone\CyberCat.exe                         ║
echo ║   • emersa-gui\ (Web interface)                              ║
echo ║   • james-ultimate\ (Main platform)                          ║
echo ║   • Documentation and setup files                            ║
echo ║                                                               ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.

echo Build log saved to: %BUILDLOG%
echo Completed: %date% %time% >> %BUILDLOG%

echo.
echo Next steps:
echo 1. Test the distribution: cd dist ^&^& INSTALL.bat
echo 2. Create ZIP for distribution
echo 3. Upload to release platform
echo.

pause
exit /b 0

:: ============================================
:: Error Handler
:: ============================================
:error
echo.
echo [X] Build failed!
echo [X] Check the error messages above
echo [X] Build log: %BUILDLOG%
echo.
echo Failed: %date% %time% >> %BUILDLOG%
pause
exit /b 1