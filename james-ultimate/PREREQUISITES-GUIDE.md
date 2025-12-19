# James Ultimate - Prerequisites and Installation Guide

## Overview

James Ultimate is a multi-language cybersecurity platform that integrates:
- **TypeScript/Node.js** - Core application and server
- **Java** - High-performance security scanning
- **Rust** - Cryptographic operations
- **C++** - Network scanning and performance-critical operations

## Required Software

### 1. Node.js (Required) ✅
- **Version:** 16.x or higher
- **Purpose:** Core runtime environment
- **Download:** https://nodejs.org/
- **Verify:** `node --version`

### 2. Java Development Kit (Required) ✅
- **Version:** JDK 17 or higher (JDK 25 installed)
- **Purpose:** Java security scanner modules
- **Download:** https://adoptium.net/temurin/releases/
- **Verify:** `java -version` and `javac -version`
- **Note:** Both JRE and JDK components needed

### 3. Apache Maven (Required) ❌
- **Version:** 3.6.x or higher
- **Purpose:** Java project building and dependency management
- **Download:** https://maven.apache.org/download.cgi
- **Installation:**
  1. Download binary zip archive
  2. Extract to `C:\Program Files\Apache\Maven`
  3. Add `C:\Program Files\Apache\Maven\bin` to PATH
  4. Verify: `mvn --version`

### 4. Rust Toolchain (Required) ❌
- **Version:** Latest stable
- **Purpose:** High-performance cryptography
- **Download:** https://rustup.rs/
- **Installation:**
  ```cmd
  # Download and run rustup-init.exe
  # Or use the setup script which automates this
  ```
- **Verify:** `rustc --version` and `cargo --version`
- **Components Needed:**
  - rustc (compiler)
  - cargo (package manager)
  - rustup (toolchain manager)

### 5. CMake (Required) ❌
- **Version:** 3.15 or higher
- **Purpose:** C++ project configuration and building
- **Download:** https://cmake.org/download/
- **Verify:** `cmake --version`

### 6. C++ Compiler (Required) ❌
- **Options:**
  - **Visual Studio Build Tools** (Recommended for Windows)
    - Download: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022
    - Install "Desktop development with C++" workload
    - Includes MSVC compiler (cl.exe)
  - **MinGW-w64** (Alternative)
    - Download: https://www.mingw-w64.org/downloads/
    - Lighter weight option
- **Verify:** `cl --version` (MSVC) or `g++ --version` (MinGW)

## Quick Installation

### Automated Setup (Recommended)

Run the prerequisites setup script:

```cmd
cd james-ultimate
setup-prerequisites.bat
```

This script will:
1. Check all required dependencies
2. Guide you through installing missing components
3. Attempt to build all modules
4. Generate a detailed log file

### Manual Installation Steps

1. **Install Node.js**
   - Download installer from nodejs.org
   - Run installer with default settings
   - Restart terminal

2. **Install Java JDK**
   - Download Eclipse Temurin JDK 17+
   - Run installer
   - Set JAVA_HOME environment variable
   - Add JAVA_HOME\bin to PATH

3. **Install Maven**
   - Download binary zip
   - Extract to preferred location
   - Add bin directory to PATH
   - Verify with `mvn --version`

4. **Install Rust**
   - Download rustup-init.exe
   - Run and follow prompts
   - Choose default installation
   - Restart terminal

5. **Install CMake**
   - Download installer
   - Run with "Add to PATH" option
   - Restart terminal

6. **Install C++ Compiler**
   - For Visual Studio Build Tools:
     - Download installer
     - Select "Desktop development with C++"
     - Complete installation (may take time)
   - Or install MinGW-w64 as alternative

## Building the Project

### Option 1: Build Everything
```cmd
npm run build
```

This runs:
- `build:ts` - Compiles TypeScript
- `build:java` - Builds Java modules with Maven
- `build:rust` - Compiles Rust cryptography
- `build:cpp` - Builds C++ scanner

### Option 2: Build Individual Components
```cmd
npm run build:ts      # TypeScript only
npm run build:java    # Java scanner only
npm run build:rust    # Rust crypto only
npm run build:cpp     # C++ scanner only
```

### Check Dependencies
```cmd
npm run check-deps
```

This verifies all required tools are installed.

## Environment Variables

### Required Environment Variables

```cmd
# Java
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.x

# Maven (if not in default location)
set MAVEN_HOME=C:\Program Files\Apache\Maven
set PATH=%MAVEN_HOME%\bin;%PATH%

# Rust (usually set automatically by rustup)
set CARGO_HOME=%USERPROFILE%\.cargo
set PATH=%CARGO_HOME%\bin;%PATH%
```

## Troubleshooting

### Common Issues

#### Maven Not Found
```
Error: 'mvn' is not recognized
```
**Solution:** Ensure Maven bin directory is in PATH. Restart terminal after setting.

#### Rust Not Found
```
Error: 'rustc' is not recognized
```
**Solution:** Rust toolchain not installed or PATH not updated. Run rustup-init.exe and restart terminal.

#### C++ Compiler Not Found
```
Error: No CMAKE_CXX_COMPILER could be found
```
**Solution:** Install Visual Studio Build Tools or MinGW-w64. Ensure compiler is in PATH.

#### Java Version Mismatch
```
Error: Java version 17 or higher required
```
**Solution:** Update to JDK 17+. Set JAVA_HOME correctly.

#### CMake Configuration Failed
```
Error: CMake Error at CMakeLists.txt
```
**Solution:** 
- Ensure C++ compiler is installed and in PATH
- Try specifying generator: `cmake -G "Visual Studio 17 2022"`
- Or for MinGW: `cmake -G "MinGW Makefiles"`

### Build Failures

#### Java Build Fails
```cmd
cd james-ultimate/java-scanner
mvn clean install -X  # Verbose output
```

#### Rust Build Fails
```cmd
cd james-ultimate/rust-crypto
cargo clean
cargo build --release --verbose
```

#### C++ Build Fails
```cmd
cd james-ultimate/cpp-scanner
rmdir /s /q build
cmake -B build -S . -G "Visual Studio 17 2022"
cmake --build build --config Release --verbose
```

## Verification

After installation, verify everything:

```cmd
# Check all tools
node --version
npm --version
java -version
javac -version
mvn --version
rustc --version
cargo --version
cmake --version
cl --version  # or g++ --version

# Quick dependency check
npm run check-deps

# Try building
npm run build
```

## Next Steps

After successful setup:

1. Install npm dependencies: `npm install`
2. Build the project: `npm run build`
3. Run the application: `npm start`
4. Access dashboard: http://localhost:3000

## Architecture Details

### TypeScript/Node.js Layer
- Main application logic
- Express server
- WebSocket communication
- MCP integration
- LLM provider interfaces

### Java Layer
- Port scanning
- Hash analysis
- Vulnerability detection
- Security scanning operations

### Rust Layer
- AES-GCM encryption/decryption
- Argon2 password hashing
- SHA-256, Blake3 hashing
- High-performance crypto operations

### C++ Layer
- Network scanning
- Low-level system operations
- Performance-critical tasks

## Support

For issues or questions:
- Check the log file: `james-ultimate/logs/setup-*.log`
- Review build output for specific errors
- Ensure all environment variables are set correctly
- Restart terminal after PATH changes

## License

MIT License - See LICENSE file for details
