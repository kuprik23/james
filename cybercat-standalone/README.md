# 🐱 CyberCat - AI-Powered Cybersecurity Analysis Tool

A standalone cybersecurity analysis tool that runs on your Windows PC. CyberCat provides comprehensive security scanning, network analysis, and threat detection capabilities.

## 🚀 Quick Start

### Option 1: Run Directly (Requires Node.js)
```bash
# Double-click run-cybercat.bat
# OR run from command line:
cd cybercat-standalone
run-cybercat.bat
```

### Option 2: Build Standalone Executable
```bash
# Double-click build-exe.bat to create CyberCat.exe
# The executable will be in the dist/ folder
```

## 📋 Features

### 🔍 Full Security Scan
- System information analysis
- Network security assessment
- Process monitoring
- Port scanning
- Firewall status check
- Antivirus status check

### 🌐 Network Analysis
- Network interface enumeration
- Active connection monitoring
- Suspicious connection detection
- Gateway information

### ⚙️ Process Analysis
- Running process enumeration
- Suspicious process detection
- High CPU/Memory usage alerts
- Known malware pattern matching

### 🔌 Port Scanning
- Common port scanning (21, 22, 80, 443, etc.)
- Service identification
- Risk level assessment

### 🛡️ Security Status
- Windows Firewall status
- Windows Defender status
- Security recommendations

## 💻 Commands

### Interactive Mode (Default)
```bash
cybercat
# or
node cybercat.js
```

### Command Line Options
```bash
# Full security scan
cybercat scan

# Network analysis only
cybercat network

# Port scan
cybercat ports
cybercat ports --host 192.168.1.1

# Process analysis
cybercat processes

# Security status check
cybercat status

# Interactive mode
cybercat interactive
```

## 📊 Output

CyberCat generates detailed reports in JSON format:
- `cybercat-report-[timestamp].json` - Full security report

## 🔧 Requirements

### For Running with Node.js:
- Node.js 18+ (https://nodejs.org/)
- Windows 10/11

### For Building Executable:
- Node.js 18+
- npm (comes with Node.js)
- pkg (installed automatically by build script)

## 📁 File Structure

```
cybercat-standalone/
├── cybercat.js        # Main application
├── package.json       # Dependencies
├── run-cybercat.bat   # Quick run script
├── build-exe.bat      # Build executable script
├── README.md          # This file
└── dist/              # Built executables (after build)
    └── CyberCat.exe
```

## 🛡️ Security Notes

- CyberCat runs locally on your machine
- No data is sent to external servers
- All analysis is performed offline
- Reports are saved locally only

## 🐛 Troubleshooting

### "Node.js is not installed"
Download and install Node.js from https://nodejs.org/

### "Failed to install dependencies"
Run `npm install` manually in the cybercat-standalone folder

### "Build failed"
1. Make sure Node.js is installed
2. Run `npm install` first
3. Try running as Administrator

## 📜 License

MIT License - Feel free to use and modify!

## 🤝 Contributing

Contributions welcome! Feel free to submit issues and pull requests.

---

**CyberCat** - Stay secure! 🐱🔒