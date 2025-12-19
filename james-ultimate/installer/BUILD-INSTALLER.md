# Building James Ultimate Windows Installer

## Overview

This directory contains the Inno Setup script to create a professional Windows installer (.exe) for James Ultimate that:
- ✅ Checks for prerequisites automatically
- ✅ Downloads and installs missing components
- ✅ Sets up PATH variables
- ✅ Creates Start Menu shortcuts
- ✅ Handles upgrades and uninstallation
- ✅ One-click installation experience

## Prerequisites to Build Installer

### Required Software
1. **Inno Setup 6.x** (Free)
   - Download: https://jrsoftware.org/isdl.php
   - Install with default settings
   - Adds "Inno Setup Compiler" to Start Menu

2. **James Ultimate built**
   ```cmd
   cd james-ultimate
   npm install
   npm run build
   ```

## Building the Installer

### Step 1: Compile Inno Setup Script

**Option A: Using Inno Setup IDE (GUI)**
1. Open Inno Setup Compiler
2. File → Open → Select `james-installer.iss`
3. Build → Compile (or press Ctrl+F9)
4. Installer will be created in `output/` directory

**Option B: Using Command Line**
```cmd
"C:\Program Files (x86)\Inno Setup 6\ISCC.exe" james-installer.iss
```

**Option C: Using Build Script** (Easiest)
```cmd
build-installer.bat
```

### Step 2: Test the Installer

```cmd
cd output
James-Ultimate-Setup-2.0.0.exe
```

## What the Installer Does

### 1. Checks System
- Node.js (requires manual installation if missing)
- Java JDK (requires manual installation if missing)
- Maven (auto-installs if selected)
- Gradle (auto-installs if selected)
- Rust (auto-installs if selected)
- CMake (auto-installs if selected)
- C++ Compiler (opens download page if missing)

### 2. Downloads Prerequisites
When "Install prerequisites" is checked during installation:
- **Maven 3.9.6** - Downloads and installs automatically
- **Gradle 8.5** - Downloads and installs automatically
- **Rust** - Downloads rustup-init.exe and installs
- **CMake 3.28.1** - Downloads and installs automatically

### 3. Installs Application
- Copies all files to Program Files
- Creates Start Menu shortcuts
- Adds to PATH (optional)
- Sets up shortcuts

### 4. Post-Installation
- Option to launch application
- Quick start guide displayed
- Prerequisites checked

## Installer Features

### Modern UI
- Professional Windows 11-style wizard
- Progress bars for downloads
- Clear status messages
- Professional branding

### Smart Detection
- Skips already installed components
- Checks for updates
- Validates installations
- Provides helpful error messages

### Prerequisites Included
- Maven binary (auto-download)
- Gradle binary (auto-download)
- Rust toolchain (auto-download)
- CMake binary (auto-download)
- VS Build Tools (opens download page)

### Uninstaller
- Complete removal
- Cleans up PATH entries
- Removes shortcuts
- Optional data preservation

## Customization

### Modify Installer Appearance

Edit these sections in `james-installer.iss`:

```pascal
[Setup]
WizardImageFile=compiler:WizModernImage.bmp
WizardSmallImageFile=compiler:WizModernSmallImage.bmp
```

### Add Custom Components

```pascal
[Components]
Name: "core"; Description: "Core Application"; Types: full compact custom; Flags: fixed
Name: "java"; Description: "Java Security Scanner"; Types: full
Name: "kotlin"; Description: "Kotlin Security Scanner"; Types: full
Name: "rust"; Description: "Rust Crypto Module"; Types: full
Name: "cpp"; Description: "C++ Network Scanner"; Types: full
```

### Modify Download URLs

Update version numbers and URLs in the `[Code]` section's `NextButtonClick` function.

## Distribution

### Publishing the Installer

1. **Test thoroughly** on clean Windows installation
2. **Sign the executable** (optional but recommended)
3. **Upload to GitHub Releases**
   ```
   Title: James Ultimate v2.0.0
   Tag: v2.0.0
   Assets: James-Ultimate-Setup-2.0.0.exe
   ```

### File Size
Expected installer size: **~30-50 MB** (includes Node.js application)

With prerequisites downloaded: **~500-700 MB** total installation

## Troubleshooting

### Inno Setup Compiler Not Found
```
Error: Cannot find ISCC.exe
```
**Solution:** Install Inno Setup from https://jrsoftware.org/isdl.php

### Build Failed
```
Error: Cannot find source files
```
**Solution:** Run `npm run build` first to create dist/ directory

### Download Failed
**Solution:** Check internet connection, firewall settings

### Prerequisites Won't Install
**Solution:** Run installer as Administrator

## Advanced Features

### Silent Installation
```cmd
James-Ultimate-Setup-2.0.0.exe /SILENT /SUPPRESSMSGBOXES /TASKS="installprereqs,addtopath"
```

### Unattended Installation
```cmd
James-Ultimate-Setup-2.0.0.exe /VERYSILENT /NORESTART /TASKS="installprereqs"
```

### Custom Install Directory
```cmd
James-Ultimate-Setup-2.0.0.exe /DIR="C:\MyApps\James"
```

## Build Automation

### CI/CD Integration

**GitHub Actions Example:**
```yaml
name: Build Installer
on: [push, release]

jobs:
  build:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run build
      - name: Build Installer
        run: |
          choco install innosetup
          "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" installer\james-installer.iss
      - uses: actions/upload-artifact@v3
        with:
          name: installer
          path: installer/output/*.exe
```

## Version Updates

When releasing new version:

1. Update version in `james-installer.iss`:
   ```pascal
   #define MyAppVersion "2.0.1"
   ```

2. Rebuild installer

3. Test installation

4. Publish to GitHub Releases

## Support

For installer issues:
- Check Inno Setup documentation: https://jrsoftware.org/ishelp/
- Review build logs in Inno Setup compiler
- Test on clean Windows VM
- Verify all source files exist

---

**Pro Tip:** Build the installer on a clean Windows VM or test thoroughly on different Windows versions (10, 11) to ensure compatibility.
