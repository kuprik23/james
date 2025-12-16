@echo off
setlocal enabledelayedexpansion

:: ============================================
:: CyberCAT Security Platform - Master Installer
:: ============================================

color 0A
title CyberCAT Security Platform - Installation

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                                                               ║
echo ║      /\_____/\                                                ║
echo ║     /  o   o  \     CYBERCAT v2.0                            ║
echo ║    ( ==  ^  == )    Master Installer                          ║
echo ║     )         (     ═══════════════════════════════════      ║
echo ║    (           )                                              ║
echo ║   ( (  )   (  ) )   Setting up your security system...       ║
echo ║  (__(__)___(__)__)                                            ║
echo ║                                                               ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
echo Starting CyberCAT installation...
echo.

:: Check for Administrator privileges
net session >nul 2>&1
if %errorLevel% NEQ 0 (
    echo [!] This script requires administrator privileges
    echo [!] Please right-click and select "Run as Administrator"
    pause
    exit /b 1
)

:: Create log file
set LOGFILE=%CD%\install-log.txt
echo CyberCAT Security Platform Installation Log > %LOGFILE%
echo Started: %date% %time% >> %LOGFILE%
echo. >> %LOGFILE%

:: ============================================
:: Step 1: Check Prerequisites
:: ============================================
echo [1/7] Checking prerequisites...
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

set PREREQ_OK=1

:: Check Node.js
echo Checking Node.js installation...
node --version >nul 2>&1
if %errorLevel% NEQ 0 (
    echo [!] Node.js is NOT installed
    echo [!] Please download and install Node.js from: https://nodejs.org/
    echo [!] Recommended version: 18.x or higher
    set PREREQ_OK=0
) else (
    for /f "tokens=*" %%a in ('node --version') do set NODE_VERSION=%%a
    echo [√] Node.js installed: !NODE_VERSION!
    echo Node.js: !NODE_VERSION! >> %LOGFILE%
)

:: Check Python
echo Checking Python installation...
python --version >nul 2>&1
if %errorLevel% NEQ 0 (
    echo [!] Python is NOT installed
    echo [!] Please download and install Python from: https://www.python.org/
    echo [!] Recommended version: 3.9 or higher
    echo [!] Make sure to check "Add Python to PATH" during installation
    set PREREQ_OK=0
) else (
    for /f "tokens=*" %%a in ('python --version') do set PYTHON_VERSION=%%a
    echo [√] Python installed: !PYTHON_VERSION!
    echo Python: !PYTHON_VERSION! >> %LOGFILE%
)

:: Check npm
echo Checking npm installation...
npm --version >nul 2>&1
if %errorLevel% NEQ 0 (
    echo [!] npm is NOT installed (should come with Node.js)
    set PREREQ_OK=0
) else (
    for /f "tokens=*" %%a in ('npm --version') do set NPM_VERSION=%%a
    echo [√] npm installed: !NPM_VERSION!
    echo npm: !NPM_VERSION! >> %LOGFILE%
)

:: Check pip
echo Checking pip installation...
pip --version >nul 2>&1
if %errorLevel% NEQ 0 (
    echo [!] pip is NOT installed (should come with Python)
    set PREREQ_OK=0
) else (
    for /f "tokens=*" %%a in ('pip --version') do set PIP_VERSION=%%a
    echo [√] pip installed: !PIP_VERSION!
    echo pip: !PIP_VERSION! >> %LOGFILE%
)

if !PREREQ_OK! EQU 0 (
    echo.
    echo [X] Prerequisites check FAILED
    echo [X] Please install missing software and run this installer again
    echo.
    pause
    exit /b 1
)

echo.
echo [√] All prerequisites found!
echo.
pause

:: ============================================
:: Step 2: Install Node.js Dependencies
:: ============================================
echo [2/7] Installing Node.js dependencies...
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

echo Installing emersa-gui dependencies...
cd emersa-gui
call npm install
if %errorLevel% NEQ 0 (
    echo [!] Failed to install emersa-gui dependencies
    goto :error
)
cd ..

echo Installing james-ultimate dependencies...
cd james-ultimate
call npm install
if %errorLevel% NEQ 0 (
    echo [!] Failed to install james-ultimate dependencies
    goto :error
)
cd ..

echo Installing cybercat-standalone dependencies...
cd cybercat-standalone
call npm install
if %errorLevel% NEQ 0 (
    echo [!] Failed to install cybercat-standalone dependencies
    goto :error
)
cd ..

echo Installing digitalocean-mcp dependencies...
cd digitalocean-mcp
call npm install
if %errorLevel% NEQ 0 (
    echo [!] Failed to install digitalocean-mcp dependencies
    goto :error
)
cd ..

echo Installing system-monitor-mcp dependencies...
cd system-monitor-mcp
call npm install
if %errorLevel% NEQ 0 (
    echo [!] Failed to install system-monitor-mcp dependencies
    goto :error
)
cd ..

echo Installing cybercat-mcp dependencies...
cd cybercat-mcp
call npm install
if %errorLevel% NEQ 0 (
    echo [!] Failed to install cybercat-mcp dependencies
    goto :error
)
cd ..

echo.
echo [√] Node.js dependencies installed successfully!
echo.

:: ============================================
:: Step 3: Install Python Dependencies
:: ============================================
echo [3/7] Installing Python dependencies...
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

echo Installing langgraph-agent dependencies...
cd langgraph-agent
pip install -r requirements.txt
if %errorLevel% NEQ 0 (
    echo [!] Failed to install langgraph-agent dependencies
    goto :error
)
cd ..

echo.
echo [√] Python dependencies installed successfully!
echo.

:: ============================================
:: Step 4: Create Configuration Files
:: ============================================
echo [4/7] Creating configuration files...
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

:: Create .env files from examples if they don't exist
if not exist "langgraph-agent\.env" (
    echo Creating langgraph-agent/.env...
    copy "langgraph-agent\.env.example" "langgraph-agent\.env" >nul
    echo [√] Created langgraph-agent/.env
) else (
    echo [√] langgraph-agent/.env already exists
)

if not exist "digitalocean-mcp\.env" (
    echo Creating digitalocean-mcp/.env...
    copy "digitalocean-mcp\.env.example" "digitalocean-mcp\.env" >nul
    echo [√] Created digitalocean-mcp/.env
) else (
    echo [√] digitalocean-mcp/.env already exists
)

echo.
echo [√] Configuration files created!
echo.

:: ============================================
:: Step 5: Create Start Scripts
:: ============================================
echo [5/7] Creating startup scripts...
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

:: Create START-ALL.bat
echo @echo off > START-ALL.bat
echo title James AI - All Services >> START-ALL.bat
echo echo Starting James AI Security System... >> START-ALL.bat
echo echo. >> START-ALL.bat
echo start "Emersa GUI" cmd /k "cd emersa-gui && set PORT=3001 && npm start" >> START-ALL.bat
echo start "James Ultimate" cmd /k "cd james-ultimate && node src/server.js" >> START-ALL.bat
echo start "LangGraph Agent" cmd /k "cd langgraph-agent && python server.py" >> START-ALL.bat
echo echo. >> START-ALL.bat
echo echo ══════════════════════════════════════════════════════ >> START-ALL.bat
echo echo  James AI Security System is starting... >> START-ALL.bat
echo echo ══════════════════════════════════════════════════════ >> START-ALL.bat
echo echo. >> START-ALL.bat
echo echo  ^> Emersa GUI: http://localhost:3001 >> START-ALL.bat
echo echo  ^> James Ultimate: Running in background >> START-ALL.bat
echo echo  ^> LangGraph Agent: http://localhost:8000/docs >> START-ALL.bat
echo echo. >> START-ALL.bat
echo timeout /t 5 >> START-ALL.bat
echo start http://localhost:3001 >> START-ALL.bat
echo [√] Created START-ALL.bat

:: Create START-GUI.bat
echo @echo off > START-GUI.bat
echo title James AI - GUI Only >> START-GUI.bat
echo cd emersa-gui >> START-GUI.bat
echo set PORT=3001 >> START-GUI.bat
echo npm start >> START-GUI.bat
echo [√] Created START-GUI.bat

:: Create CONFIGURE.bat (shortcut to configure-api-keys.bat)
if exist "configure-api-keys.bat" (
    echo @echo off > CONFIGURE.bat
    echo call configure-api-keys.bat >> CONFIGURE.bat
    echo [√] Created CONFIGURE.bat
)

echo.
echo [√] Startup scripts created!
echo.

:: ============================================
:: Step 6: Create Desktop Shortcuts (Optional)
:: ============================================
echo [6/7] Desktop shortcuts...
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

set /p CREATE_SHORTCUTS="Create desktop shortcuts? (Y/N): "
if /i "!CREATE_SHORTCUTS!"=="Y" (
    echo Creating desktop shortcuts...
    
    :: Create shortcut using PowerShell
    powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%USERPROFILE%\Desktop\James AI.lnk'); $Shortcut.TargetPath = '%CD%\START-ALL.bat'; $Shortcut.WorkingDirectory = '%CD%'; $Shortcut.Description = 'James AI Security System'; $Shortcut.Save()"
    
    if !errorLevel! EQU 0 (
        echo [√] Desktop shortcut created: James AI
    ) else (
        echo [!] Failed to create desktop shortcut
    )
)

echo.

:: ============================================
:: Step 7: Final Configuration
:: ============================================
echo [7/7] Final configuration...
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

echo Checking API key configuration...
if exist "langgraph-agent\.env" (
    findstr /C:"OPENAI_API_KEY=sk-" "langgraph-agent\.env" >nul 2>&1
    if !errorLevel! NEQ 0 (
        findstr /C:"ANTHROPIC_API_KEY=sk-ant-" "langgraph-agent\.env" >nul 2>&1
        if !errorLevel! NEQ 0 (
            echo.
            echo [!] WARNING: No API keys configured for LangGraph Agent
            echo [!] You'll need to configure API keys to use the AI features
            echo.
            set /p CONFIG_NOW="Configure API keys now? (Y/N): "
            if /i "!CONFIG_NOW!"=="Y" (
                call configure-api-keys.bat
            )
        )
    )
)

:: ============================================
:: Installation Complete!
:: ============================================
echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                                                               ║
echo ║      /\_____/\                                                ║
echo ║     /  o   o  \     INSTALLATION COMPLETE!                   ║
echo ║    ( ==  ^  == )    ═════════════════════════════════        ║
echo ║     )         (                                               ║
echo ║    (           )    James AI is ready to protect!            ║
echo ║   ( (  )   (  ) )                                             ║
echo ║  (__(__)___(__)__)                                            ║
echo ║                                                               ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
echo Installation Summary:
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo [√] All dependencies installed
echo [√] Configuration files created
echo [√] Startup scripts ready
echo.
echo Quick Start Guide:
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo 1. To start ALL services:
echo    ^> Double-click START-ALL.bat
echo    ^> Or run: START-ALL.bat
echo.
echo 2. To start GUI only:
echo    ^> Double-click START-GUI.bat
echo    ^> Or run: START-GUI.bat
echo.
echo 3. To configure API keys:
echo    ^> Double-click CONFIGURE.bat
echo    ^> Or run: configure-api-keys.bat
echo.
echo Access Points:
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo  ^> Web Interface: http://localhost:3001
echo  ^> LangGraph API: http://localhost:8000/docs
echo.
echo Documentation:
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo  ^> README.md - Full documentation
echo  ^> STANDALONES-GUIDE.md - Standalone tools guide
echo  ^> install-log.txt - Installation log
echo.
echo For support: https://github.com/kuprik23/james
echo.

echo Installation log saved to: %LOGFILE%
echo Completed: %date% %time% >> %LOGFILE%

pause
exit /b 0

:: ============================================
:: Error Handler
:: ============================================
:error
echo.
echo [X] Installation failed!
echo [X] Check the error messages above
echo [X] Log file: %LOGFILE%
echo.
echo Failed: %date% %time% >> %LOGFILE%
pause
exit /b 1