# James Ultimate - Fully Automated Prerequisites Installer
# PowerShell script for unattended installation
# Copyright © 2025 Emersa Ltd.

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  James Ultimate - Automated Prerequisites Installer" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Elevate to admin if needed
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "⚠ Running as regular user. Some installations may require admin rights." -ForegroundColor Yellow
    Write-Host ""
}

# Create logs directory
$logDir = "logs"
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$logFile = Join-Path $logDir "auto-install-$timestamp.log"
$installDir = "C:\DevTools"

function Write-Log {
    param($Message)
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$ts - $Message" | Out-File -FilePath $logFile -Append
    Write-Host $Message
}

function Test-CommandExists {
    param($Command)
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

Write-Log "===== Installation Started ====="

# Check Node.js
Write-Host "[1/7] Checking Node.js..." -ForegroundColor Cyan
if (Test-CommandExists "node") {
    $nodeVersion = node --version
    Write-Log "[OK] Node.js $nodeVersion is installed"
} else {
    Write-Host "[ERROR] Node.js not found. Please install from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check Java
Write-Host "[2/7] Checking Java JDK..." -ForegroundColor Cyan
if (Test-CommandExists "java") {
    $javaVersion = java -version 2>&1 | Select-String "version" | Select-Object -First 1
    Write-Log "[OK] Java is installed: $javaVersion"
} else {
    Write-Host "[ERROR] Java JDK not found" -ForegroundColor Red
    exit 1
}

# Install Maven
Write-Host "[3/7] Installing Apache Maven..." -ForegroundColor Cyan
if (Test-CommandExists "mvn") {
    $mvnVersion = mvn --version | Select-String "Apache Maven" | Select-Object -First 1
    Write-Log "[OK] Maven already installed: $mvnVersion"
} else {
    Write-Log "[INFO] Downloading Maven..."
    $mavenVersion = "3.9.6"
    $mavenUrl = "https://dlcdn.apache.org/maven/maven-3/$mavenVersion/binaries/apache-maven-$mavenVersion-bin.zip"
    $mavenZip = Join-Path $env:TEMP "maven.zip"
    $mavenExtractPath = Join-Path $installDir "apache-maven-$mavenVersion"
    $mavenDir = Join-Path $installDir "Maven"
    
    try {
        if (-not (Test-Path $installDir)) {
            New-Item -ItemType Directory -Path $installDir -Force | Out-Null
        }
        
        Write-Host "  Downloading Maven..." -ForegroundColor Yellow
        Invoke-WebRequest -Uri $mavenUrl -OutFile $mavenZip -UseBasicParsing
        
        Write-Host "  Extracting Maven..." -ForegroundColor Yellow
        Expand-Archive -Path $mavenZip -DestinationPath $installDir -Force
        
        if (Test-Path $mavenDir) {
            Remove-Item -Path $mavenDir -Recurse -Force
        }
        Rename-Item -Path $mavenExtractPath -NewName $mavenDir -Force
        
        # Add to PATH
        $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
        $mavenBinPath = Join-Path $mavenDir "bin"
        if ($currentPath -notlike "*$mavenBinPath*") {
            $newPath = "$currentPath;$mavenBinPath"
            [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
        }
        
        Remove-Item $mavenZip -Force
        Write-Log "[OK] Maven installed to $mavenDir"
        Write-Host "✓ Maven installed successfully" -ForegroundColor Green
    } catch {
        Write-Log "[ERROR] Maven installation failed: $_"
        Write-Host "✗ Maven installation failed: $_" -ForegroundColor Red
    }
}

# Install Gradle
Write-Host "[4/7] Installing Gradle..." -ForegroundColor Cyan
if (Test-CommandExists "gradle") {
    $gradleVersion = gradle --version | Select-String "Gradle" | Select-Object -First 1
    Write-Log "[OK] Gradle already installed: $gradleVersion"
} else {
    Write-Log "[INFO] Downloading Gradle..."
    $gradleVer = "8.5"
    $gradleUrl = "https://services.gradle.org/distributions/gradle-$gradleVer-bin.zip"
    $gradleZip = Join-Path $env:TEMP "gradle.zip"
    $gradleExtractPath = Join-Path $installDir "gradle-$gradleVer"
    $gradleDir = Join-Path $installDir "Gradle"
    
    try {
        if (-not (Test-Path $installDir)) {
            New-Item -ItemType Directory -Path $installDir -Force | Out-Null
        }
        
        Write-Host "  Downloading Gradle..." -ForegroundColor Yellow
        Invoke-WebRequest -Uri $gradleUrl -OutFile $gradleZip -UseBasicParsing
        
        Write-Host "  Extracting Gradle..." -ForegroundColor Yellow
        Expand-Archive -Path $gradleZip -DestinationPath $installDir -Force
        
        if (Test-Path $gradleDir) {
            Remove-Item -Path $gradleDir -Recurse -Force
        }
        Rename-Item -Path $gradleExtractPath -NewName $gradleDir -Force
        
        # Add to PATH
        $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
        $gradleBinPath = Join-Path $gradleDir "bin"
        if ($currentPath -notlike "*$gradleBinPath*") {
            $newPath = "$currentPath;$gradleBinPath"
            [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
        }
        
        Remove-Item $gradleZip -Force
        Write-Log "[OK] Gradle installed to $gradleDir"
        Write-Host "✓ Gradle installed successfully" -ForegroundColor Green
    } catch {
        Write-Log "[ERROR] Gradle installation failed: $_"
        Write-Host "✗ Gradle installation failed: $_" -ForegroundColor Red
    }
}

# Install Rust
Write-Host "[5/7] Installing Rust..." -ForegroundColor Cyan
if (Test-CommandExists "rustc") {
    $rustVersion = rustc --version
    Write-Log "[OK] Rust already installed: $rustVersion"
} else {
    Write-Log "[INFO] Downloading Rust installer..."
    $rustupUrl = "https://static.rust-lang.org/rustup/dist/x86_64-pc-windows-msvc/rustup-init.exe"
    $rustupExe = Join-Path $env:TEMP "rustup-init.exe"
    
    try {
        Write-Host "  Downloading Rust installer..." -ForegroundColor Yellow
        Invoke-WebRequest -Uri $rustupUrl -OutFile $rustupExe -UseBasicParsing
        
        Write-Host "  Installing Rust (this may take a few minutes)..." -ForegroundColor Yellow
        Start-Process -FilePath $rustupExe -ArgumentList "-y", "--default-toolchain", "stable" -Wait -NoNewWindow
        
        Remove-Item $rustupExe -Force
        Write-Log "[OK] Rust installed"
        Write-Host "✓ Rust installed successfully" -ForegroundColor Green
    } catch {
        Write-Log "[ERROR] Rust installation failed: $_"
        Write-Host "✗ Rust installation failed: $_" -ForegroundColor Red
    }
}

# Install CMake
Write-Host "[6/7] Installing CMake..." -ForegroundColor Cyan
if (Test-CommandExists "cmake") {
    $cmakeVersion = cmake --version | Select-String "cmake version" | Select-Object -First 1
    Write-Log "[OK] CMake already installed: $cmakeVersion"
} else {
    Write-Log "[INFO] Downloading CMake..."
    $cmakeVer = "3.28.1"
    $cmakeUrl = "https://github.com/Kitware/CMake/releases/download/v$cmakeVer/cmake-$cmakeVer-windows-x86_64.zip"
    $cmakeZip = Join-Path $env:TEMP "cmake.zip"
    $cmakeExtractPath = Join-Path $installDir "cmake-$cmakeVer-windows-x86_64"
    $cmakeDir = Join-Path $installDir "CMake"
    
    try {
        if (-not (Test-Path $installDir)) {
            New-Item -ItemType Directory -Path $installDir -Force | Out-Null
        }
        
        Write-Host "  Downloading CMake..." -ForegroundColor Yellow
        Invoke-WebRequest -Uri $cmakeUrl -OutFile $cmakeZip -UseBasicParsing
        
        Write-Host "  Extracting CMake..." -ForegroundColor Yellow
        Expand-Archive -Path $cmakeZip -DestinationPath $installDir -Force
        
        if (Test-Path $cmakeDir) {
            Remove-Item -Path $cmakeDir -Recurse -Force
        }
        Rename-Item -Path $cmakeExtractPath -NewName $cmakeDir -Force
        
        # Add to PATH
        $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
        $cmakeBinPath = Join-Path $cmakeDir "bin"
        if ($currentPath -notlike "*$cmakeBinPath*") {
            $newPath = "$currentPath;$cmakeBinPath"
            [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
        }
        
        Remove-Item $cmakeZip -Force
        Write-Log "[OK] CMake installed to $cmakeDir"
        Write-Host "✓ CMake installed successfully" -ForegroundColor Green
    } catch {
        Write-Log "[ERROR] CMake installation failed: $_"
        Write-Host "✗ CMake installation failed: $_" -ForegroundColor Red
    }
}

# Check C++ Compiler
Write-Host "[7/7] Checking C++ Compiler..." -ForegroundColor Cyan
$hasCompiler = $false

# Check for MSVC
try {
    $vcvarsPath = "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat"
    if (Test-Path $vcvarsPath) {
        Write-Log "[OK] Visual Studio 2022 found"
        $hasCompiler = $true
    }
} catch {}

# Check for Build Tools
if (-not $hasCompiler) {
    try {
        $buildToolsPath = "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat"
        if (Test-Path $buildToolsPath) {
            Write-Log "[OK] VS Build Tools found"
            $hasCompiler = $true
        }
    } catch {}
}

# Check for MinGW
if (-not $hasCompiler) {
    if (Test-CommandExists "g++") {
        $gccVersion = g++ --version | Select-Object -First 1
        Write-Log "[OK] MinGW found: $gccVersion"
        $hasCompiler = $true
    }
}

if (-not $hasCompiler) {
    Write-Host "✗ No C++ compiler found" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To install Visual Studio Build Tools:" -ForegroundColor Cyan
    Write-Host "1. Download from: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022" -ForegroundColor White
    Write-Host "2. Run installer" -ForegroundColor White
    Write-Host "3. Select 'Desktop development with C++'" -ForegroundColor White
    Write-Host "4. Install (takes 15-30 minutes)" -ForegroundColor White
    Write-Log "[WARNING] No C++ compiler found"
} else {
    Write-Host "✓ C++ compiler available" -ForegroundColor Green
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  Installation Summary" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Tools installed in: $installDir" -ForegroundColor White
Write-Host "Log file: $logFile" -ForegroundColor White
Write-Host ""
Write-Host "⚠ IMPORTANT: Close and reopen your terminal to use new tools!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Close this terminal" -ForegroundColor White
Write-Host "2. Open a new terminal" -ForegroundColor White
Write-Host "3. Run: npm run build" -ForegroundColor White
Write-Host ""

Write-Log "===== Installation Completed ====="

# Refresh environment variables in current session
$userPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
$machinePath = [System.Environment]::GetEnvironmentVariable("Path", "Machine")
$env:Path = "$userPath;$machinePath"

Write-Host "Installation complete! Press any key to exit..." -ForegroundColor Green
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')