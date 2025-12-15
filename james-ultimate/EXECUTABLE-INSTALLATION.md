# 🛡️ CYBERCAT Platform - Standalone Executables
## Double-Click Installation Guide

**Copyright © 2025 Emersa Ltd. All Rights Reserved.**
**Made in California, USA 🇺🇸**

---

## 📦 Available Executables

This folder contains standalone CYBERCAT executables for all platforms:

| Platform | File | Size | Double-Click? |
|----------|------|------|---------------|
| **Windows** | `CYBERCAT-Windows.exe` | 59 MB | ✅ Yes |
| **macOS** | `CYBERCAT-macOS` | 73 MB | ✅ Yes* |
| **Linux** | `CYBERCAT-Linux` | 68 MB | ✅ Yes* |

*macOS/Linux require execute permissions (see below)

---

## 🚀 Windows Installation (Easiest!)

### Just Double-Click!

1. **Double-click:** `CYBERCAT-Windows.exe`
2. **Wait:** Server starts automatically
3. **Browser opens:** http://localhost:3000
4. **Done!** 🎉

That's it! No installation needed.

### Alternative: Command Line
```cmd
CYBERCAT-Windows.exe
```

---

## 🍎 macOS Installation

### Step 1: Make Executable (First Time Only)
```bash
chmod +x CYBERCAT-macOS
```

### Step 2: Run
```bash
./CYBERCAT-macOS
```

Or double-click `CYBERCAT-macOS` in Finder after making it executable.

### Step 3: Access
Open browser: http://localhost:3000

---

## 🐧 Linux Installation

### Step 1: Make Executable (First Time Only)
```bash
chmod +x CYBERCAT-Linux
```

### Step 2: Run
```bash
./CYBERCAT-Linux
```

### Step 3: Access
Open browser: http://localhost:3000

---

## 📊 Activity Monitor

View real-time scanning activity:
```
http://localhost:3000/activity-monitor.html
```

Features:
- ✅ Live activity feed (20+ lines visible)
- ✅ Scan progress visualization
- ✅ Complete scan history
- ✅ Export reports to JSON
- ✅ Detailed report viewer

---

## 🛡️ Security Features

All executables include:
- ✅ AES-256-GCM Encryption
- ✅ Anti-Malware Protection
- ✅ Anti-Ransomware Defense
- ✅ DDoS Protection
- ✅ Secure API Key Storage
- ✅ Real-time Threat Detection

---

## 🔧 Troubleshooting

### Windows: "Windows protected your PC" Warning

This is normal for unsigned executables.

**To run:**
1. Click "More info"
2. Click "Run anyway"

**Or:** Right-click → Properties → Check "Unblock" → Apply

### macOS: "Cannot be opened because it is from an unidentified developer"

**Solution:**
```bash
xattr -cr CYBERCAT-macOS
./CYBERCAT-macOS
```

Or: System Preferences → Security & Privacy → Click "Open Anyway"

### Linux: Permission Denied

**Solution:**
```bash
chmod +x CYBERCAT-Linux
./CYBERCAT-Linux
```

### Port 3000 Already in Use

**Solution:** Change port in the executable's `.env` file or stop the conflicting service

---

## 📚 Documentation

- **Platform Guide:** See main README.md
- **Security Guide:** See SECURITY.md
- **Full Install Guide:** See INSTALLATION_GUIDE.md

---

## 🎯 Quick Start Checklist

### Windows
- [ ] Download `CYBERCAT-Windows.exe`
- [ ] Double-click to run
- [ ] Access http://localhost:3000
- [ ] Start securing! 🛡️

### macOS  
- [ ] Download `CYBERCAT-macOS`
- [ ] Run: `chmod +x CYBERCAT-macOS`
- [ ] Double-click or run: `./CYBERCAT-macOS`
- [ ] Access http://localhost:3000

### Linux
- [ ] Download `CYBERCAT-Linux`
- [ ] Run: `chmod +x CYBERCAT-Linux`
- [ ] Run: `./CYBERCAT-Linux`
- [ ] Access http://localhost:3000

---

## 💡 Pro Tips

1. **Create Desktop Shortcut** (Windows)
   - Right-click `CYBERCAT-Windows.exe`
   - Send to → Desktop (create shortcut)

2. **Add to Applications** (macOS)
   - Move to `/Applications` folder
   - Right-click → Get Info → Open with → This application

3. **Create Alias** (Linux)
   ```bash
   sudo ln -s /path/to/CYBERCAT-Linux /usr/local/bin/cybercat
   # Now run from anywhere: cybercat
   ```

---

## 📞 Support

**Issues?** Check the troubleshooting section above first.

**Need Help?**
- Review SECURITY.md for security questions
- Check INSTALLATION_GUIDE.md for detailed setup
- View README.md for platform documentation

---

## ⚖️ Legal

**Copyright © 2025 Emersa Ltd. All Rights Reserved.**
**Made in California, USA 🇺🇸**

This software is proprietary and confidential. Unauthorized copying, distribution, or modification is strictly prohibited.

---

**CYBERCAT - Military-Grade Security Made Simple** 🛡️

*Just double-click and you're protected!*