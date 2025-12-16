@echo off
echo.
echo ========================================
echo    James AI - API Key Configuration
echo ========================================
echo.
echo This will help you configure API keys for:
echo   - OpenAI (for LangGraph Agent)
echo   - Anthropic (alternative for LangGraph Agent)
echo   - Digital Ocean (for cloud deployments)
echo.
echo Press Ctrl+C to cancel at any time.
echo.
pause

REM Check if langgraph-agent/.env exists
if not exist "langgraph-agent\.env" (
    echo Creating langgraph-agent/.env from template...
    copy "langgraph-agent\.env.example" "langgraph-agent\.env" >nul 2>&1
)

echo.
echo === LangGraph Agent API Keys ===
echo.
set /p OPENAI_KEY="Enter your OpenAI API key (or press Enter to skip): "
set /p ANTHROPIC_KEY="Enter your Anthropic API key (or press Enter to skip): "

if not "%OPENAI_KEY%"=="" (
    echo OPENAI_API_KEY=%OPENAI_KEY%> langgraph-agent\.env
    echo ✓ OpenAI API key saved
)

if not "%ANTHROPIC_KEY%"=="" (
    if "%OPENAI_KEY%"=="" (
        echo ANTHROPIC_API_KEY=%ANTHROPIC_KEY%> langgraph-agent\.env
    ) else (
        echo ANTHROPIC_API_KEY=%ANTHROPIC_KEY%>> langgraph-agent\.env
    )
    echo ✓ Anthropic API key saved
)

echo.
echo === Digital Ocean Configuration ===
echo.
set /p DO_TOKEN="Enter your Digital Ocean API token (or press Enter to skip): "

if not "%DO_TOKEN%"=="" (
    REM Store in Windows Credential Manager
    echo Storing Digital Ocean token securely...
    powershell -ExecutionPolicy Bypass -File "security\credential-manager.ps1" -Target "DigitalOcean_API" -Username "james-ai" -Password "%DO_TOKEN%"
    if errorlevel 1 (
        echo ⚠ Warning: Could not store in Credential Manager
        echo Token will be saved to .env file instead
        echo DIGITALOCEAN_API_TOKEN=%DO_TOKEN%> .env
    ) else (
        echo ✓ Digital Ocean token stored securely
    )
)

echo.
echo ========================================
echo    Configuration Complete!
echo ========================================
echo.
echo To test your configuration:
echo   1. LangGraph Agent: cd langgraph-agent ^&^& python agent.py
echo   2. Digital Ocean: Check with 'node digitalocean-mcp/index.js'
echo.
echo Configuration files created:
if exist "langgraph-agent\.env" echo   ✓ langgraph-agent/.env
if exist ".env" echo   ✓ .env (root directory)
echo.
pause