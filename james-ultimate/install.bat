@echo off
REM ════════════════════════════════════════════════════════════════════════════
REM CYBERCAT Platform Installer for Windows
REM Copyright © 2024 Emersa Ltd. All Rights Reserved.
REM ════════════════════════════════════════════════════════════════════════════

echo.
echo ╔═══════════════════════════════════════════════════════════════════════════╗
echo ║                                                                           ║
echo ║   ██████╗██╗   ██╗██████╗ ███████╗██████╗  ██████╗ █████╗ ████████╗      ║
echo ║  ██╔════╝╚██╗ ██╔╝██╔══██╗██╔════╝██╔══██╗██╔════╝██╔══██╗╚══██╔══╝      ║
echo ║  ██║      ╚████╔╝ ██████╔╝█████╗  ██████╔╝██║     ███████║   ██║         ║
echo ║  ██║       ╚██╔╝  ██╔══██╗██╔══╝  ██╔══██╗██║     ██╔══██║   ██║         ║
echo ║  ╚██████╗   ██║   ██████╔╝███████╗██║  ██║╚██████╗██║  ██║   ██║         ║
echo ║   ╚═════╝   ╚═╝   ╚═════╝ ╚══════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝   ╚═╝         ║
echo ║                                                                           ║
echo ║              Military-Grade Cybersecurity Platform                       ║
echo ║              Copyright © 2024 Emersa Ltd                                 ║
echo ╚═══════════════════════════════════════════════════════════════════════════╝
echo.
echo 🚀 Installing CYBERCAT Platform...
echo.

REM Check for Node.js
echo [1/5] Checking Node.js installation...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js not found!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo Recommended version: 18.x or higher
    pause
    exit /b 1
)

node --version
echo ✅ Node.js found
echo.

REM Check for npm
echo [2/5] Checking npm installation...
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm not found!
    pause
    exit /b 1
)

npm --version
echo ✅ npm found
echo.

REM Install dependencies
echo [3/5] Installing dependencies...
echo This may take a few minutes...
echo.
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Installation failed!
    pause
    exit /b 1
)
echo ✅ Dependencies installed
echo.

REM Create .env file if it doesn't exist
echo [4/5] Configuring environment...
if not exist ".env" (
    echo Creating .env file...
    (
        echo # CYBERCAT Platform Configuration
        echo # Copyright © 2024 Emersa Ltd
        echo.
        echo # Server Configuration
        echo PORT=3000
        echo HOST=0.0.0.0
        echo NODE_ENV=production
        echo.
        echo # LLM API Keys ^(Optional - configure later^)
        echo # OPENAI_API_KEY=sk-your-key-here
        echo # ANTHROPIC_API_KEY=sk-ant-your-key-here
        echo # GROQ_API_KEY=gsk-your-key-here
        echo.
        echo # Security Configuration
        echo RATE_LIMIT_WINDOW=60000
        echo RATE_LIMIT_MAX=200
        echo AUTO_BACKUP=true
        echo MALWARE_PROTECTION=true
        echo RANSOMWARE_PROTECTION=true
    ) > .env
    echo ✅ Configuration file created
) else (
    echo ✅ Configuration file exists
)
echo.

REM Create security directories
echo [5/5] Initializing security system...
if not exist ".quarantine" mkdir .quarantine
if not exist ".ransomware-backup" mkdir .ransomware-backup
if not exist ".honeypot" mkdir .honeypot
echo ✅ Security directories created
echo.

echo ╔═══════════════════════════════════════════════════════════════════════════╗
echo ║                    ✅ Installation Complete!                              ║
echo ╚═══════════════════════════════════════════════════════════════════════════╝
echo.
echo 🎉 CYBERCAT Platform is ready to use!
echo.
echo To start the platform:
echo   1. Run: npm run server
echo   2. Open browser at: http://localhost:3000
echo.
echo To use CLI mode:
echo   Run: node src/main.js
echo.
echo 📚 Documentation:
echo   - README.md - Complete platform guide
echo   - SECURITY.md - Security best practices
echo.
echo 🛡️  Security Features Active:
echo   ✓ AES-256-GCM Encryption
echo   ✓ Anti-Malware Protection
echo   ✓ Anti-Ransomware Defense
echo   ✓ DDoS Protection
echo   ✓ Secure Key Storage
echo.
pause