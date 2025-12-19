# James Ultimate - Quick Start Guide

## 🚀 Fast Setup (5 Minutes)

### Step 1: Install Prerequisites

Run the automated installer:
```cmd
setup-prerequisites.bat
```

This will check and guide you to install:
- ✅ Node.js (Already detected if running this)
- ✅ Java JDK 17+ (✅ INSTALLED: OpenJDK 25.0.1)
- ❌ Apache Maven (MISSING - Required)
- ❌ Rust toolchain (MISSING - Required)
- ❌ CMake (MISSING - Required)
- ❌ C++ Compiler (MISSING - Required)

### Step 2: Build Everything

```cmd
npm install
npm run build
```

### Step 3: Start Application

```cmd
npm start
```

Visit: http://localhost:3000

## 🛠️ What's Missing?

Based on system diagnostics:

### ⚠️ Critical (Blocks Java builds)
- **Apache Maven** - [Download](https://maven.apache.org/download.cgi)
  - Extract to: `C:\Program Files\Apache\Maven`
  - Add to PATH: `C:\Program Files\Apache\Maven\bin`

### ⚠️ Optional (Enhanced Features)
- **Rust** - [Install](https://rustup.rs/)
  - Provides high-performance cryptography
  - Install with: Download and run `rustup-init.exe`

- **CMake** - [Download](https://cmake.org/download/)
  - Required for C++ network scanner
  - Install with "Add to PATH" option

- **Visual Studio Build Tools** - [Download](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)
  - Required for C++ compilation
  - Select "Desktop development with C++" workload

## 📋 Installation Order

1. **Install Maven** (10 minutes)
   - Download binary zip
   - Extract to Program Files
   - Add to PATH
   - Verify: `mvn --version`

2. **Install Rust** (5 minutes)
   - Run setup-prerequisites.bat (will download installer)
   - Or download manually from rustup.rs
   - Restart terminal
   - Verify: `rustc --version`

3. **Install CMake** (5 minutes)
   - Download Windows installer
   - Run with "Add to PATH" option
   - Verify: `cmake --version`

4. **Install C++ Compiler** (30 minutes)
   - Download VS Build Tools installer
   - Select "Desktop development with C++"
   - Wait for installation
   - Verify: `cl` (in VS Developer Command Prompt)

## 🎯 Minimal Setup (TypeScript + Java Only)

If you only want core functionality:

1. Install Maven only
2. Run:
```cmd
npm install
npm run build:ts
npm run build:java
npm start
```

This gives you:
- ✅ Web server and API
- ✅ Java security scanner
- ❌ Rust cryptography (falls back to Node.js crypto)
- ❌ C++ network scanner (falls back to TypeScript)

## 📖 Documentation

- **Full Prerequisites Guide:** [`PREREQUISITES-GUIDE.md`](PREREQUISITES-GUIDE.md)
- **Multi-Language Integration:** [`MULTI-LANGUAGE-INTEGRATION.md`](MULTI-LANGUAGE-INTEGRATION.md)
- **Build Instructions:** [`BUILD.md`](BUILD.md)

## 🐛 Common Issues

### "Maven not found"
```
Error: 'mvn' is not recognized
```
**Solution:** Install Maven and add to PATH. Restart terminal.

### "Java module not available"
**Solution:** Install Maven and run `npm run build:java`

### "Cannot find module rust-crypto"
**Solution:** Install Rust and run `npm run build:rust`

## 💡 Tips

- **Use automated installer:** `setup-prerequisites.bat` handles everything
- **Check what's installed:** `npm run check-deps`
- **Build individually:** Use `npm run build:ts`, `build:java`, etc.
- **View logs:** Check `logs/setup-*.log` for details

## 🆘 Need Help?

1. Check the log file in `logs/` directory
2. Read [`PREREQUISITES-GUIDE.md`](PREREQUISITES-GUIDE.md)
3. Ensure all environment variables are set
4. Restart terminal after installing tools

## ✅ Success Checklist

- [ ] Node.js installed and in PATH
- [ ] Java JDK 17+ installed (✅ Already done)
- [ ] Maven installed and in PATH
- [ ] Rust installed and in PATH
- [ ] CMake installed and in PATH
- [ ] C++ compiler available
- [ ] `npm install` completed
- [ ] `npm run build` succeeded
- [ ] Application starts with `npm start`
- [ ] Can access http://localhost:3000

---

**Time to full setup:** 15-60 minutes depending on missing components

**Minimum time (TypeScript + Java only):** 5-10 minutes
