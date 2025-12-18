@echo off
title James Ultimate - Prerequisites Setup
cd /d "%~dp0"
setlocal enabledelayedexpansion

echo.
echo ================================================================
echo   James Ultimate - Prerequisites Setup and Installer
echo ================================================================
echo.
echo This script will check and install required dependencies:
echo   - Node.js (if missing)
echo   - Java JDK 17+ (if missing)
echo   - Apache Maven (if missing)
echo   - Gradle (for Kotlin, if missing)
echo   - Rust toolchain (if missing)
echo   - CMake (if missing)
echo   - Visual Studio Build Tools / C++ Compiler (if missing)
echo.
echo Press any key to continue or Ctrl+C to cancel...
pause >nul

:: Create logs directory
if not exist "logs" mkdir logs
set LOG_FILE=logs\setup-%date:~-4,4%%date:~-10,2%%date:~-7,2%-%time:~0,2%%time:~3,2%%time:~6,2%.log
set LOG_FILE=%LOG_FILE: =0%

echo Setup started at %date% %time% > "%LOG_FILE%"

:: Check for admin rights
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo.
    echo ================================================================
    echo   WARNING: Administrator privileges recommended
    echo ================================================================
    echo.
    echo Some installations may require administrator privileges.
    echo Please run this script as Administrator if installations fail.
    echo.
    echo Press any key to continue anyway...
    pause >nul
)

:: ================================================================
:: Check Node.js
:: ================================================================
echo.
echo [1/6] Checking Node.js...
echo ================================================================
where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo [OK] Node.js !NODE_VERSION! is installed
    echo Node.js: !NODE_VERSION! >> "%LOG_FILE%"
) else (
    echo [MISSING] Node.js not found
    echo.
    echo Node.js is required for this project.
    echo Please download and install from: https://nodejs.org/
    echo.
    echo Opening download page...
    start https://nodejs.org/
    echo Please install Node.js and run this script again.
    pause
    exit /b 1
)

:: ================================================================
:: Check Java JDK
:: ================================================================
echo.
echo [2/6] Checking Java JDK...
echo ================================================================
where java >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%i in ('java -version 2^>^&1 ^| findstr "version"') do set JAVA_VERSION=%%i
    echo [OK] Java is installed: !JAVA_VERSION!
    echo Java: !JAVA_VERSION! >> "%LOG_FILE%"
    
    where javac >nul 2>nul
    if %ERRORLEVEL% NEQ 0 (
        echo [WARNING] javac not found - JDK may not be properly configured
        echo Please ensure JAVA_HOME is set and JDK bin directory is in PATH
    )
) else (
    echo [MISSING] Java JDK not found
    echo.
    echo Downloading and installing Eclipse Temurin JDK 17...
    echo.
    start https://adoptium.net/temurin/releases/?version=17
    echo Please install Java JDK 17+ and run this script again.
    pause
    exit /b 1
)

:: ================================================================
:: Check/Install Maven
:: ================================================================
echo.
echo [3/7] Checking Apache Maven...
echo ================================================================
where mvn >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%i in ('mvn --version 2^>^&1 ^| findstr "Apache Maven"') do set MVN_VERSION=%%i
    echo [OK] Maven is installed: !MVN_VERSION!
    echo Maven: !MVN_VERSION! >> "%LOG_FILE%"
) else (
    echo [MISSING] Maven not found
    echo.
    echo Maven is required to build Java modules.
    echo.
    choice /C YN /M "Do you want to download Maven installer?"
    if !errorlevel! EQU 1 (
        echo Opening Maven download page...
        start https://maven.apache.org/download.cgi
        echo.
        echo Please:
        echo 1. Download Maven binary zip archive
        echo 2. Extract to C:\Program Files\Apache\Maven
        echo 3. Add Maven bin directory to PATH
        echo 4. Run this script again
        pause
        exit /b 1
    )
)

:: ================================================================
:: Check/Install Gradle
:: ================================================================
echo.
echo [4/7] Checking Gradle...
echo ================================================================
where gradle >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%i in ('gradle --version 2^>^&1 ^| findstr "Gradle"') do set GRADLE_VERSION=%%i
    echo [OK] Gradle is installed: !GRADLE_VERSION!
    echo Gradle: !GRADLE_VERSION! >> "%LOG_FILE%"
) else (
    echo [MISSING] Gradle not found
    echo.
    echo Gradle is required to build Kotlin modules.
    echo.
    choice /C YN /M "Do you want to download Gradle installer?"
    if !errorlevel! EQU 1 (
        echo Opening Gradle download page...
        start https://gradle.org/install/
        echo.
        echo Please:
        echo 1. Download Gradle binary zip
        echo 2. Extract to C:\Program Files\Gradle
        echo 3. Add Gradle bin directory to PATH
        echo 4. Run this script again
        pause
        exit /b 1
    )
)

:: ================================================================
:: Check/Install Rust
:: ================================================================
echo.
echo [5/7] Checking Rust toolchain...
echo ================================================================
where rustc >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%i in ('rustc --version') do set RUST_VERSION=%%i
    echo [OK] Rust is installed: !RUST_VERSION!
    echo Rust: !RUST_VERSION! >> "%LOG_FILE%"
) else (
    echo [MISSING] Rust not found
    echo.
    echo Rust is required for high-performance cryptography module.
    echo.
    choice /C YN /M "Do you want to install Rust now?"
    if !errorlevel! EQU 1 (
        echo.
        echo Downloading Rust installer (rustup-init.exe)...
        powershell -Command "Invoke-WebRequest -Uri 'https://static.rust-lang.org/rustup/dist/x86_64-pc-windows-msvc/rustup-init.exe' -OutFile 'rustup-init.exe'"
        
        if exist "rustup-init.exe" (
            echo.
            echo Running Rust installer...
            echo Please follow the installation prompts.
            rustup-init.exe
            del rustup-init.exe
            
            echo.
            echo Rust installation complete.
            echo Please restart your terminal and run this script again.
            pause
            exit /b 0
        ) else (
            echo Failed to download Rust installer.
            echo Please install manually from: https://rustup.rs/
            pause
            exit /b 1
        )
    )
)

:: ================================================================
:: Check/Install CMake
:: ================================================================
echo.
echo [6/7] Checking CMake...
echo ================================================================
where cmake >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%i in ('cmake --version 2^>^&1 ^| findstr "cmake version"') do set CMAKE_VERSION=%%i
    echo [OK] CMake is installed: !CMAKE_VERSION!
    echo CMake: !CMAKE_VERSION! >> "%LOG_FILE%"
) else (
    echo [MISSING] CMake not found
    echo.
    echo CMake is required to build C++ modules.
    echo.
    choice /C YN /M "Do you want to download CMake installer?"
    if !errorlevel! EQU 1 (
        echo Opening CMake download page...
        start https://cmake.org/download/
        echo.
        echo Please download and install CMake, then run this script again.
        pause
        exit /b 1
    )
)

:: ================================================================
:: Check C++ Compiler
:: ================================================================
echo.
echo [7/7] Checking C++ Compiler...
echo ================================================================
where cl >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] MSVC compiler found
    echo MSVC: Found >> "%LOG_FILE%"
) else (
    where g++ >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        for /f "tokens=*" %%i in ('g++ --version 2^>^&1 ^| findstr "g++"') do set GCC_VERSION=%%i
        echo [OK] GCC/MinGW found: !GCC_VERSION!
        echo GCC: !GCC_VERSION! >> "%LOG_FILE%"
    ) else (
        echo [MISSING] C++ compiler not found
        echo.
        echo A C++ compiler is required for building native modules.
        echo.
        echo Options:
        echo 1. Visual Studio Build Tools (Recommended for Windows)
        echo 2. MinGW-w64 (Alternative)
        echo.
        choice /C 12 /M "Select option (1=VS Build Tools, 2=MinGW)"
        if !errorlevel! EQU 1 (
            echo.
            echo Opening Visual Studio Build Tools download page...
            start https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022
            echo.
            echo Please:
            echo 1. Download and run the installer
            echo 2. Select "Desktop development with C++"
            echo 3. Install and run this script again
            pause
            exit /b 1
        ) else (
            echo.
            echo Opening MinGW-w64 download page...
            start https://www.mingw-w64.org/downloads/
            echo.
            echo Please install MinGW-w64 and add to PATH, then run this script again.
            pause
            exit /b 1
        )
    )
)

:: ================================================================
:: Install npm dependencies
:: ================================================================
echo.
echo ================================================================
echo   Installing npm dependencies...
echo ================================================================
echo.

if exist "package.json" (
    call npm install
    if !errorlevel! EQU 0 (
        echo [OK] npm dependencies installed
        echo npm install: Success >> "%LOG_FILE%"
    ) else (
        echo [ERROR] npm install failed
        echo npm install: Failed >> "%LOG_FILE%"
    )
) else (
    echo [WARNING] package.json not found in current directory
)

:: ================================================================
:: Build all modules
:: ================================================================
echo.
echo ================================================================
echo   Building all modules...
echo ================================================================
echo.

:: Try to build Java module
if exist "java-scanner\pom.xml" (
    echo Building Java scanner module...
    cd java-scanner
    call mvn clean package -DskipTests
    if !errorlevel! EQU 0 (
        echo [OK] Java module built successfully
        echo Java build: Success >> "%LOG_FILE%"
    ) else (
        echo [WARNING] Java module build failed
        echo Java build: Failed >> "%LOG_FILE%"
    )
    cd ..
)

:: Try to build Kotlin module
if exist "kotlin-scanner\build.gradle.kts" (
    echo.
    echo Building Kotlin scanner module...
    cd kotlin-scanner
    call gradle build
    if !errorlevel! EQU 0 (
        echo [OK] Kotlin module built successfully
        echo Kotlin build: Success >> "%LOG_FILE%"
    ) else (
        echo [WARNING] Kotlin module build failed
        echo Kotlin build: Failed >> "%LOG_FILE%"
    )
    cd ..
)

:: Try to build Rust module
if exist "rust-crypto\Cargo.toml" (
    echo.
    echo Building Rust crypto module...
    cd rust-crypto
    cargo build --release
    if !errorlevel! EQU 0 (
        echo [OK] Rust module built successfully
        echo Rust build: Success >> "%LOG_FILE%"
    ) else (
        echo [WARNING] Rust module build failed
        echo Rust build: Failed >> "%LOG_FILE%"
    )
    cd ..
)

:: Try to build C++ module
if exist "cpp-scanner\CMakeLists.txt" (
    echo.
    echo Building C++ scanner module...
    if not exist "cpp-scanner\build" mkdir cpp-scanner\build
    cd cpp-scanner\build
    cmake .. -G "NMake Makefiles" 2>nul || cmake .. -G "MinGW Makefiles" 2>nul || cmake ..
    if !errorlevel! EQU 0 (
        cmake --build . --config Release
        if !errorlevel! EQU 0 (
            echo [OK] C++ module built successfully
            echo C++ build: Success >> "%LOG_FILE%"
        ) else (
            echo [WARNING] C++ module build failed
            echo C++ build: Failed >> "%LOG_FILE%"
        )
    ) else (
        echo [WARNING] CMake configuration failed
        echo CMake: Failed >> "%LOG_FILE%"
    )
    cd ..\..
)

:: ================================================================
:: Summary
:: ================================================================
echo.
echo ================================================================
echo   Setup Complete!
echo ================================================================
echo.
echo Log file saved to: %LOG_FILE%
echo.
echo Next steps:
echo 1. Review the log file for any warnings or errors
echo 2. Restart your terminal to refresh PATH variables
echo 3. Run 'npm run build' to build TypeScript code
echo 4. Run 'npm start' to start the application
echo.
echo If any component failed to install, please:
echo - Check the log file for details
echo - Install manually using the provided URLs
echo - Run this script again after installation
echo.

pause