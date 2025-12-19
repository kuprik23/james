@echo off
echo Checking for Node.js installation...
echo.

node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please complete the Node.js installation first.
    echo.
    echo After installation:
    echo 1. Close and reopen this terminal/VSCode
    echo 2. Run this script again
    pause
    exit /b 1
)

echo [SUCCESS] Node.js is installed!
node --version
npm --version
echo.

echo Installing MCP server dependencies...
cd mcp-servers\digitalocean
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)
cd ..\..

echo.
echo [SUCCESS] Dependencies installed!
echo.
echo Next steps:
echo 1. Get your Digital Ocean API token
echo 2. Run: add-digital-ocean-token.bat
echo 3. The MCP server will be ready to use in VSCode
echo.
pause
