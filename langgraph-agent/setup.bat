@echo off
title James AI Security Agent - Setup
cd /d "%~dp0"

echo ========================================
echo   James AI Security Agent - Setup
echo ========================================
echo.

:: Check if Python is installed
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Python is not installed.
    echo Please install Python 3.10+ from: https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation.
    pause
    exit /b 1
)

:: Check Python version
python --version

:: Create virtual environment if it doesn't exist
if not exist "venv" (
    echo.
    echo Creating virtual environment...
    python -m venv venv
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to create virtual environment.
        pause
        exit /b 1
    )
)

:: Activate virtual environment
echo.
echo Activating virtual environment...
call venv\Scripts\activate.bat

:: Upgrade pip
echo.
echo Upgrading pip...
python -m pip install --upgrade pip

:: Install dependencies
echo.
echo Installing dependencies...
pip install -r requirements.txt

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Some dependencies failed to install.
    echo This is often due to missing build tools.
    echo.
    echo Try installing Visual C++ Build Tools from:
    echo https://visualstudio.microsoft.com/visual-cpp-build-tools/
    pause
    exit /b 1
)

:: Create .env file if it doesn't exist
if not exist ".env" (
    echo.
    echo Creating .env file from template...
    copy .env.example .env
    echo.
    echo IMPORTANT: Edit .env file and add your API keys!
)

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Edit .env file and add your OPENAI_API_KEY or ANTHROPIC_API_KEY
echo 2. Run 'run-agent.bat' to start the server
echo 3. Open http://localhost:8000/docs for API documentation
echo.
pause