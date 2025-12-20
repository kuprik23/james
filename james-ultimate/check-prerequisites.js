#!/usr/bin/env node
/**
 * James Ultimate - Comprehensive Prerequisites Checker
 * Checks all required dependencies and provides installation guidance
 * 
 * Copyright © 2025 Emersa Ltd. All Rights Reserved.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function print(message, color = '') {
    console.log(`${color}${message}${colors.reset}`);
}

function execCommand(command) {
    try {
        const output = execSync(command, { 
            encoding: 'utf8', 
            stdio: ['pipe', 'pipe', 'pipe']
        });
        return { success: true, output: output.trim() };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function checkNodeJS() {
    const result = execCommand('node --version');
    if (result.success) {
        const version = result.output.replace('v', '');
        const major = parseInt(version.split('.')[0]);
        return {
            installed: true,
            version: result.output,
            adequate: major >= 16,
            details: major >= 16 ? 'Version is adequate' : 'Minimum version 16 required'
        };
    }
    return {
        installed: false,
        details: 'Node.js not found',
        installUrl: 'https://nodejs.org/'
    };
}

function checkJava() {
    const result = execCommand('java -version');
    if (result.success) {
        const javaVersion = execCommand('javac -version');
        const hasJDK = javaVersion.success;
        
        return {
            installed: true,
            hasJDK: hasJDK,
            version: result.output.split('\n')[0],
            adequate: hasJDK,
            details: hasJDK ? 'JDK installed' : 'Only JRE found, JDK required'
        };
    }
    return {
        installed: false,
        hasJDK: false,
        details: 'Java not found',
        installUrl: 'https://adoptium.net/temurin/releases/'
    };
}

function checkMaven() {
    const result = execCommand('mvn --version');
    if (result.success) {
        const version = result.output.split('\n')[0];
        return {
            installed: true,
            version: version,
            adequate: true,
            details: 'Maven is installed'
        };
    }
    return {
        installed: false,
        details: 'Maven not found',
        installUrl: 'https://maven.apache.org/download.cgi',
        autoInstall: 'Run: powershell -ExecutionPolicy Bypass -File auto-install-prerequisites.ps1'
    };
}

function checkGradle() {
    const result = execCommand('gradle --version');
    if (result.success) {
        const version = result.output.split('\n')[0];
        return {
            installed: true,
            version: version,
            adequate: true,
            details: 'Gradle is installed'
        };
    }
    return {
        installed: false,
        details: 'Gradle not found',
        installUrl: 'https://gradle.org/install/',
        autoInstall: 'Run: powershell -ExecutionPolicy Bypass -File auto-install-prerequisites.ps1'
    };
}

function checkRust() {
    const rustc = execCommand('rustc --version');
    const cargo = execCommand('cargo --version');
    
    if (rustc.success && cargo.success) {
        return {
            installed: true,
            version: rustc.output,
            hasCargo: true,
            adequate: true,
            details: 'Rust toolchain is installed'
        };
    }
    return {
        installed: false,
        details: 'Rust not found',
        installUrl: 'https://rustup.rs/',
        autoInstall: 'Run: powershell -ExecutionPolicy Bypass -File auto-install-prerequisites.ps1'
    };
}

function checkCMake() {
    const result = execCommand('cmake --version');
    if (result.success) {
        const version = result.output.split('\n')[0];
        return {
            installed: true,
            version: version,
            adequate: true,
            details: 'CMake is installed'
        };
    }
    return {
        installed: false,
        details: 'CMake not found',
        installUrl: 'https://cmake.org/download/',
        autoInstall: 'Run: powershell -ExecutionPolicy Bypass -File auto-install-prerequisites.ps1'
    };
}

function checkCppCompiler() {
    // Check for MSVC
    const msvc = execCommand('cl 2>nul');
    if (msvc.success || msvc.error.includes('Microsoft')) {
        return {
            installed: true,
            compiler: 'MSVC',
            adequate: true,
            details: 'Visual Studio C++ compiler found'
        };
    }
    
    // Check for MinGW
    const gcc = execCommand('g++ --version');
    if (gcc.success) {
        return {
            installed: true,
            compiler: 'MinGW/GCC',
            version: gcc.output.split('\n')[0],
            adequate: true,
            details: 'MinGW C++ compiler found'
        };
    }
    
    return {
        installed: false,
        details: 'No C++ compiler found',
        installUrl: 'https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022',
        note: 'Install "Desktop development with C++" workload'
    };
}

function checkJavaScanner() {
    const jarPath = path.join(__dirname, 'java-scanner', 'target', 'security-scanner.jar');
    const exists = fs.existsSync(jarPath);
    
    return {
        built: exists,
        path: jarPath,
        details: exists ? 'Java scanner JAR found' : 'Java scanner not built',
        buildCommand: 'npm run build:java'
    };
}

function checkKotlinScanner() {
    const jarPath = path.join(__dirname, 'kotlin-scanner', 'build', 'libs');
    const exists = fs.existsSync(jarPath);
    
    return {
        built: exists,
        path: jarPath,
        details: exists ? 'Kotlin scanner found' : 'Kotlin scanner not built',
        buildCommand: 'npm run build:kotlin'
    };
}

function checkRustCrypto() {
    const targetPath = path.join(__dirname, 'rust-crypto', 'target', 'release');
    const exists = fs.existsSync(targetPath);
    
    return {
        built: exists,
        path: targetPath,
        details: exists ? 'Rust crypto module found' : 'Rust crypto not built',
        buildCommand: 'npm run build:rust'
    };
}

function checkCppScanner() {
    const buildPath = path.join(__dirname, 'cpp-scanner', 'build');
    const exists = fs.existsSync(buildPath);
    
    return {
        built: exists,
        path: buildPath,
        details: exists ? 'C++ scanner found' : 'C++ scanner not built',
        buildCommand: 'npm run build:cpp'
    };
}

function printStatus(name, status) {
    const icon = status.installed || status.built ? '✓' : '✗';
    const color = status.installed || status.built ? colors.green : colors.red;
    const adequate = status.adequate !== false;
    const adequateIcon = adequate ? '' : ' ⚠';
    
    print(`  ${icon} ${name}${adequateIcon}`, color);
    
    if (status.version) {
        print(`    Version: ${status.version}`, colors.cyan);
    }
    
    if (status.details) {
        print(`    ${status.details}`, colors.cyan);
    }
    
    if (status.installUrl) {
        print(`    Install: ${status.installUrl}`, colors.yellow);
    }
    
    if (status.autoInstall) {
        print(`    Auto: ${status.autoInstall}`, colors.yellow);
    }
    
    if (status.buildCommand) {
        print(`    Build: ${status.buildCommand}`, colors.yellow);
    }
    
    if (status.note) {
        print(`    Note: ${status.note}`, colors.yellow);
    }
}

function main() {
    print('\n' + '='.repeat(70), colors.cyan);
    print('  James Ultimate - Prerequisites Checker', colors.bright + colors.cyan);
    print('='.repeat(70) + '\n', colors.cyan);
    
    // Check core prerequisites
    print('Core Prerequisites:', colors.bright + colors.blue);
    const node = checkNodeJS();
    printStatus('Node.js', node);
    
    const java = checkJava();
    printStatus('Java JDK', java);
    
    print('\nBuild Tools:', colors.bright + colors.blue);
    const maven = checkMaven();
    printStatus('Maven', maven);
    
    const gradle = checkGradle();
    printStatus('Gradle', gradle);
    
    const rust = checkRust();
    printStatus('Rust', rust);
    
    const cmake = checkCMake();
    printStatus('CMake', cmake);
    
    const cpp = checkCppCompiler();
    printStatus('C++ Compiler', cpp);
    
    // Check built modules
    print('\nBuilt Modules:', colors.bright + colors.blue);
    const javaScanner = checkJavaScanner();
    printStatus('Java Scanner', javaScanner);
    
    const kotlinScanner = checkKotlinScanner();
    printStatus('Kotlin Scanner', kotlinScanner);
    
    const rustCrypto = checkRustCrypto();
    printStatus('Rust Crypto', rustCrypto);
    
    const cppScanner = checkCppScanner();
    printStatus('C++ Scanner', cppScanner);
    
    // Summary
    print('\n' + '='.repeat(70), colors.cyan);
    print('Summary:', colors.bright + colors.blue);
    
    const allInstalled = node.installed && java.installed && java.hasJDK && 
                         maven.installed && gradle.installed && rust.installed && 
                         cmake.installed && cpp.installed;
    
    const allBuilt = javaScanner.built && kotlinScanner.built && 
                     rustCrypto.built && cppScanner.built;
    
    if (allInstalled && allBuilt) {
        print('✓ All prerequisites and modules ready!', colors.green);
        print('\nYou can run: npm start', colors.cyan);
    } else if (allInstalled) {
        print('✓ All prerequisites installed', colors.green);
        print('⚠ Some modules need to be built', colors.yellow);
        print('\nRun: npm run build', colors.cyan);
    } else {
        print('✗ Missing prerequisites', colors.red);
        print('\nInstall missing prerequisites, then run: npm run build', colors.yellow);
        
        if (!allInstalled) {
            print('\nQuick install: powershell -ExecutionPolicy Bypass -File auto-install-prerequisites.ps1', colors.cyan);
        }
    }
    
    print('='.repeat(70) + '\n', colors.cyan);
}

main();