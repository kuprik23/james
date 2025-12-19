# CYBERCAT - Build Guide

```
  ██████╗██╗   ██╗██████╗ ███████╗██████╗  ██████╗ █████╗ ████████╗
 ██╔════╝╚██╗ ██╔╝██╔══██╗██╔════╝██╔══██╗██╔════╝██╔══██╗╚══██╔══╝
 ██║      ╚████╔╝ ██████╔╝█████╗  ██████╔╝██║     ███████║   ██║   
 ██║       ╚██╔╝  ██╔══██╗██╔══╝  ██╔══██╗██║     ██╔══██║   ██║   
 ╚██████╗   ██║   ██████╔╝███████╗██║  ██║╚██████╗██║  ██║   ██║   
  ╚═════╝   ╚═╝   ╚═════╝ ╚══════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝   ╚═╝   
```

**Building the Standalone Windows Application from Source**

---

## 📋 Prerequisites

### Required Software

1. **Node.js 18+**
   - Download: https://nodejs.org/
   - Verify: `node --version`

2. **TypeScript**
   - Install: `npm install -g typescript`
   - Verify: `tsc --version`

3. **Git** (optional, for cloning)
   - Download: https://git-scm.com/

### Optional (for multi-language modules)

- **Java 11+** and **Maven** (for Java scanner)
- **Kotlin** and **Gradle** (for Kotlin scanner)
- **Rust** and **Cargo** (for crypto module)
- **CMake** and **C++ compiler** (for C++ scanner)

---

## 🚀 Quick Build

### One-Step Build

From the `james-standalone-windows` folder:

```batch
build-standalone.bat
```

This will:
1. ✅ Compile TypeScript to JavaScript
2. ✅ Build Windows executable (James.exe)
3. ✅ Copy all necessary files
4. ✅ Create launcher scripts
5. ✅ Package everything in `dist/` folder

---

## 📝 Detailed Build Process

### Step 1: Install Dependencies

Navigate to `james-ultimate` folder:

```batch
cd ..\james-ultimate
npm install
```

This installs all Node.js dependencies including:
- Express (web server)
- Socket.IO (real-time communication)
- TypeScript compiler
- pkg (executable builder)

### Step 2: Compile TypeScript

```batch
npm run build:ts
```

This compiles all TypeScript files from `src/` to `dist/`:
- `src/main.ts` → `dist/main.js`
- `src/server.ts` → `dist/server.js`
- All modules and dependencies

### Step 3: Build Executable

```batch
npm run build:exe
```

This uses `pkg` to bundle Node.js runtime + compiled code into a single `James.exe`:
- Target: Windows x64
- Node.js: v18 embedded
- Size: ~50-80 MB (includes everything)

### Step 4: Package Standalone App

Run the build script:

```batch
cd ..\james-standalone-windows
build-standalone.bat
```

This creates the complete package in `dist/`:
- Copies `James.exe`
- Creates launcher scripts
- Copies web interface files
- Sets up configuration templates

---

## 🔧 Manual Build (Advanced)

If you need to build manually:

### 1. Compile TypeScript

```batch
cd james-ultimate
npx tsc
```

### 2. Build Executable with pkg

```batch
npx pkg dist/main.js --targets node18-win-x64 --output dist/James.exe
```

### 3. Copy Files

```batch
cd ..\james-standalone-windows
mkdir dist
copy ..\james-ultimate\dist\James.exe dist\
xcopy /E /Y ..\james-ultimate\public dist\public\
```

### 4. Create Launcher Scripts

Create `dist\Start-CYBERCAT-GUI.bat`:
```batch
@echo off
title CYBERCAT - Cyber Analysis and Threat Detection
cd /d "%~dp0"
start http://localhost:3000
James.exe start
pause
```

---

## 🏗️ Build Architecture

### Project Structure

```
james-standalone-windows/
├── build-standalone.bat       # Main build script
├── README.md                  # User documentation
├── QUICKSTART.md             # Quick start guide
├── INSTALLATION.md           # Installation guide
├── BUILD-GUIDE.md            # This file
└── dist/                     # Output directory (created by build)

james-ultimate/               # Source code
├── src/                      # TypeScript source
│   ├── main.ts              # CLI entry point
│   ├── server.ts            # Web server
│   ├── agents/              # AI agents
│   ├── llm/                 # LLM providers
│   ├── security/            # Security modules
│   └── tools/               # Security tools
├── public/                   # Web interface
├── dist/                     # Compiled JavaScript
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
└── build-exe.js             # Executable builder
```

### Build Pipeline

```
TypeScript Source
    ↓ (tsc)
JavaScript Output
    ↓ (pkg)
Windows Executable
    ↓ (build script)
Standalone Package
```

---

## ⚙️ Build Configuration

### TypeScript Config (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

### pkg Configuration (package.json)

```json
{
  "pkg": {
    "assets": [
      "src/**/*",
      "public/**/*",
      "config/**/*"
    ],
    "outputPath": "dist"
  }
}
```

---

## 🔍 Troubleshooting Build Issues

### Issue: TypeScript compilation errors

**Solution:**
```batch
cd james-ultimate
npm install
npx tsc --noEmit
```

### Issue: pkg build fails

**Solution:**
```batch
# Clear cache
npm cache clean --force

# Reinstall pkg
npm uninstall pkg
npm install pkg@5.8.1

# Try build again
npm run build:exe
```

### Issue: Missing dependencies

**Solution:**
```batch
cd james-ultimate
rm -rf node_modules package-lock.json
npm install
```

### Issue: Build script hangs

**Solution:**
- Close any running James.exe processes
- Check if ports are available
- Run as Administrator if needed

---

## 🎯 Build Optimization

### Reduce Executable Size

1. **Exclude unused modules** in package.json:
```json
{
  "pkg": {
    "scripts": ["dist/**/*.js"],
    "assets": ["public/**/*"]
  }
}
```

2. **Use production build**:
```batch
set NODE_ENV=production
npm run build:exe
```

### Faster Build Times

1. **Skip TypeScript type checking**:
```batch
npx tsc --skipLibCheck
```

2. **Parallel builds** (if building multiple platforms):
```batch
npm run build:exe -- --all
```

---

## 📦 Distribution Package

### What Gets Included

✅ **Required:**
- James.exe (executable)
- public/ (web interface)
- config/.env.example (configuration template)
- Launcher scripts (.bat files)
- Documentation (README, etc.)

❌ **Not Included:**
- node_modules/ (embedded in exe)
- src/ (source code)
- TypeScript files
- .git/ (version control)

### Package Size

- **Minimal Package:** ~60 MB
  - James.exe + public files
  
- **Full Package:** ~80-100 MB
  - With Java/Kotlin/Rust/C++ modules

---

## 🔄 Continuous Integration

### Automated Build Script

Create `auto-build.bat`:

```batch
@echo off
echo Starting automated build...

cd james-ultimate
call npm install
call npm run build:ts
call npm run build:exe

cd ..\james-standalone-windows
call build-standalone.bat

echo Build complete!
```

### Version Tagging

Update version in `package.json`:
```json
{
  "version": "2.0.0"
}
```

---

## 🧪 Testing the Build

### Quick Test

```batch
cd dist
James.exe --version
James.exe tools
```

### Full Test

```batch
cd dist
Start-CYBERCAT-GUI.bat
# Browser should open to http://localhost:3000
# Test chat, security scan, settings
```

---

## 📊 Build Metrics

### Typical Build Times

- **TypeScript compilation:** 10-30 seconds
- **Executable creation:** 30-60 seconds
- **Package assembly:** 5-10 seconds
- **Total:** ~1-2 minutes

### Output Sizes

- **James.exe:** 50-80 MB
- **public/ folder:** 5-10 MB
- **Total package:** 60-100 MB

---

## 🚀 Next Steps

After successful build:

1. ✅ Test the executable in `dist/`
2. ✅ Verify all launchers work
3. ✅ Check configuration files
4. ✅ Test with different LLM providers
5. ✅ Package for distribution

---

## 📝 Notes

### Technology Stack

- **Runtime:** Node.js 18 (embedded)
- **Language:** TypeScript 5.3
- **Framework:** Express 4.18
- **Real-time:** Socket.IO 4.7
- **Security:** Helmet, Rate Limiter
- **Packaging:** pkg 5.8

### Known Limitations

- pkg warnings about bytecode (non-critical)
- Some dynamic imports may need manual configuration
- File paths must be relative to executable

---

**Build completed successfully! 🎉**

You now have a standalone Windows executable in the `dist/` folder ready for distribution!

---

*Copyright © 2025 Emersa Ltd. All Rights Reserved.*  
*CYBERCAT v2.0.0 - James Ultimate Edition*