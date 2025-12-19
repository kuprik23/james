@echo off
REM CYBERCAT Licensing System Setup Script
REM This script helps configure the licensing system for CYBERCAT

echo.
echo ============================================================
echo   CYBERCAT Licensing System Setup
echo ============================================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js is installed

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed!
    pause
    exit /b 1
)

echo [OK] npm is installed
echo.

REM Install dependencies
echo [STEP 1] Installing licensing system dependencies...
echo.
call npm install jsonwebtoken bcryptjs sqlite3 stripe @types/jsonwebtoken @types/bcryptjs

if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [OK] Dependencies installed successfully
echo.

REM Install Stripe MCP dependencies
echo [STEP 2] Installing Stripe MCP dependencies...
echo.
cd stripe-mcp
call npm install

if %errorlevel% neq 0 (
    echo [ERROR] Failed to install Stripe MCP dependencies
    cd ..
    pause
    exit /b 1
)

cd ..
echo [OK] Stripe MCP dependencies installed
echo.

REM Create .env file if it doesn't exist
if not exist .env (
    echo [STEP 3] Creating .env file...
    copy .env.example .env
    echo [OK] .env file created - PLEASE CONFIGURE IT!
    echo.
    echo IMPORTANT: Edit .env and add your:
    echo   - JWT secrets (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex')^)"^)
    echo   - Stripe API keys (from https://dashboard.stripe.com/apikeys^)
    echo   - Other configuration values
    echo.
) else (
    echo [STEP 3] .env file already exists
)

REM Create Stripe MCP .env if it doesn't exist
if not exist stripe-mcp\.env (
    echo [STEP 4] Creating Stripe MCP .env file...
    copy stripe-mcp\.env.example stripe-mcp\.env
    echo [OK] Stripe MCP .env file created - PLEASE CONFIGURE IT!
) else (
    echo [STEP 4] Stripe MCP .env file already exists
)

echo.
echo ============================================================
echo   Setup Complete!
echo ============================================================
echo.
echo Next steps:
echo.
echo 1. Configure your environment variables:
echo    - Edit james-ultimate/.env
echo    - Edit james-ultimate/stripe-mcp/.env
echo.
echo 2. Generate JWT secrets:
echo    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
echo.
echo 3. Set up Stripe account:
echo    - Go to https://dashboard.stripe.com/
echo    - Get your API keys
echo    - Create products for Pro and Enterprise tiers
echo    - Set up webhooks
echo.
echo 4. Start the server:
echo    npm run dev:server
echo.
echo 5. Access the application:
echo    - Main app: http://localhost:3000
echo    - Auth page: http://localhost:3000/auth.html
echo    - Dashboard: http://localhost:3000/license-dashboard.html
echo.
echo 6. Read the documentation:
echo    - LICENSE-SYSTEM.md (comprehensive guide)
echo    - stripe-mcp/README.md (Stripe integration)
echo.
echo ============================================================
echo.

pause