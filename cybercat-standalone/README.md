# 🐱 CYBERCAT - AI-Powered Cybersecurity Analysis Tool (TypeScript Edition)

```
  ██████╗██╗   ██╗██████╗ ███████╗██████╗  ██████╗ █████╗ ████████╗
 ██╔════╝╚██╗ ██╔╝██╔══██╗██╔════╝██╔══██╗██╔════╝██╔══██╗╚══██╔══╝
 ██║      ╚████╔╝ ██████╔╝█████╗  ██████╔╝██║     ███████║   ██║
 ██║       ╚██╔╝  ██╔══██╗██╔══╝  ██╔══██╗██║     ██╔══██║   ██║
 ╚██████╗   ██║   ██████╔╝███████╗██║  ██║╚██████╗██║  ██║   ██║
  ╚═════╝   ╚═╝   ╚═════╝ ╚══════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝   ╚═╝
```

**Version 2.0.0** - A standalone cybersecurity analysis tool that runs on your Windows PC.

CYBERCAT provides comprehensive security scanning, network analysis, and threat detection capabilities with integrated licensing and settings management.

**Copyright © 2025 Emersa Ltd. All Rights Reserved.**

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (https://nodejs.org/)
- npm (comes with Node.js)

### Installation & Build

1. **Install Dependencies:**
```bash
cd cybercat-standalone
npm install
```

2. **Build TypeScript:**
```bash
npm run build
```

3. **Run the Application:**
```bash
npm start
# OR for interactive mode:
node dist/index.js
```

### Development Mode

```bash
# Watch mode (auto-rebuild on changes)
npm run watch

# Development mode (build + run)
npm run dev
```

### Build Standalone Executable
```bash
# Build Windows executable
npm run build-exe
# The executable will be in the dist/ folder as CyberCat.exe

# Build for all platforms
npm run build-all
```

## ✨ What's New in v2.0.0

### 🔑 License System
- **Free Tier**: 1 scan per day
- **Pro Tier**: Unlimited scans + advanced features ($29/month)
- **Enterprise Tier**: All features + priority support ($99/month)
- Built-in license activation and management
- Automatic scan limit enforcement

### ⚙️ Settings Management
- Persistent settings storage
- Configurable scan output directory
- Auto-save reports
- Import/Export settings
- Display preferences

### 📢 Notification System
- Color-coded notifications (success, error, warning, info)
- Boxed alerts for important messages
- Upgrade prompts when limits are reached
- Real-time feedback on all operations

### 📊 Enhanced Reporting
- JSON reports with license tier information
- Configurable output directory
- Scan history tracking
- Daily scan statistics

## 📋 Core Features

### 🔍 Full Security Scan
- ✅ System information analysis
- ✅ Network security assessment
- ✅ Process monitoring with threat detection
- ✅ Port scanning with risk assessment
- ✅ Firewall status check
- ✅ Antivirus status check
- ✅ Automated report generation

### 🌐 Network Analysis
- ✅ Network interface enumeration
- ✅ Active connection monitoring
- ✅ Suspicious connection detection
- ✅ Gateway information
- ✅ MAC address tracking

### ⚙️ Process Analysis
- ✅ Running process enumeration
- ✅ Suspicious process detection
- ✅ High CPU/Memory usage alerts
- ✅ Known malware pattern matching
- ✅ Real-time process monitoring

### 🔌 Port Scanning
- ✅ Common port scanning (21, 22, 80, 443, etc.)
- ✅ Service identification
- ✅ Risk level assessment
- ✅ Custom host targeting

### 🛡️ Security Status
- ✅ Windows Firewall status
- ✅ Windows Defender status
- ✅ Security recommendations
- ✅ Threat alerts

## 💻 Commands

### Interactive Mode (Default)
```bash
npm start
# or directly:
node dist/index.js
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

# License Management
cybercat license
cybercat license --status
cybercat license --activate CC-XXXX-XXXX-XXXX-XXXX

# Settings Management
cybercat settings

# View Upgrade Options
cybercat upgrade
```

## 💰 Pricing & Licensing

### 🆓 FREE Tier (Default)
- **Price**: $0/month
- **Features**:
  - Basic port scanning
  - System information gathering
  - Simple vulnerability checks
- **Limit**: 1 scan per day

### 💎 PRO Tier
- **Price**: $29/month
- **Features**:
  - All Free features
  - ✅ Unlimited scans
  - ✅ AI-powered threat analysis
  - ✅ Real-time monitoring
  - ✅ Export reports
  - ✅ Priority email support

### 🏢 ENTERPRISE Tier
- **Price**: $99/month
- **Features**:
  - All Pro features
  - ✅ Custom integrations
  - ✅ Advanced analytics
  - ✅ Team collaboration
  - ✅ Dedicated account manager
  - ✅ 24/7 priority support

**To Purchase**: Email **4d@emersa.io** with subject "CYBERCAT License Purchase"

See [`LICENSE-PURCHASE.md`](./LICENSE-PURCHASE.md) for detailed purchasing information.

## 📊 Output

CYBERCAT generates detailed reports in JSON format:
- Default location: `./reports/cybercat-report-[timestamp].json`
- Configurable output directory via settings
- Reports include license tier and scan statistics

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
├── src/                          # TypeScript source files
│   ├── index.ts                  # Main application entry point
│   ├── types.ts                  # TypeScript type definitions
│   ├── license-service.ts        # License management
│   ├── notification-manager.ts   # Notification system
│   └── settings-service.ts       # Settings persistence
├── dist/                         # Compiled JavaScript output
│   ├── index.js                  # Compiled main file
│   ├── *.js                      # Other compiled files
│   ├── *.d.ts                    # Type declaration files
│   └── CyberCat.exe              # Built executable (after build-exe)
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # Dependencies and scripts
├── run-cybercat.bat              # Quick run script
├── build-exe.bat                 # Build executable script
├── README.md                     # This file
├── LICENSE-PURCHASE.md           # License purchase guide
├── TERMS-AND-CONDITIONS.txt      # Terms and conditions
├── .cybercat-license             # License file (created on activation)
├── .cybercat-settings.json       # Settings file (created automatically)
└── .cybercat-scans               # Scan counter (created automatically)
```

## 💻 Development

### TypeScript Development Workflow

**Available npm scripts:**

- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Build and run in development mode
- `npm run watch` - Watch for changes and rebuild automatically
- `npm start` - Run the compiled application
- `npm run build-exe` - Build Windows executable
- `npm run build-all` - Build executables for all platforms

### Type Safety

The codebase is fully typed with TypeScript, providing:
- ✅ Compile-time type checking
- ✅ IntelliSense support in IDEs
- ✅ Better code documentation
- ✅ Fewer runtime errors
- ✅ Enhanced maintainability

### Key TypeScript Features

- **Strict mode enabled** for maximum type safety
- **Type definitions** in [`src/types.ts`](src/types.ts:1)
- **Interface-based architecture** for services
- **Generic types** for flexible APIs
- **ESModuleInterop** for better module compatibility

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

## ⚙️ Configuration

### Settings Management

Access settings via:
```bash
cybercat settings
```

Available settings categories:
- **Scanning**: Output directory, auto-save, timeout, max concurrent scans
- **Security**: Notifications, auto-scan, scan interval
- **Display**: Color output, verbose mode, timestamps
- **Advanced**: Debug mode, log level, max log size

Settings are automatically saved to `.cybercat-settings.json`

### License Activation

Activate your license:
```bash
cybercat license --activate CC-XXXX-XXXX-XXXX-XXXX
```

Check license status:
```bash
cybercat license --status
```

## 🔒 Security & Privacy

- ✅ All scans run locally on your machine
- ✅ No data sent to external servers
- ✅ Reports saved locally only
- ✅ License validation is local
- ✅ Settings encrypted when sensitive
- ✅ Full offline operation

## 📜 License & Terms

This software is proprietary and owned by **Emersa Ltd.**

**Terms**:
- Free tier: Unlimited use with daily scan limit
- Pro/Enterprise: Requires valid paid license
- License keys are non-transferable
- See `TERMS-AND-CONDITIONS.txt` for full terms
- See `LICENSE-PURCHASE.md` for purchasing information

**Copyright © 2025 Emersa Ltd. All Rights Reserved.**

## 🤝 Contributing

Contributions welcome! Feel free to submit issues and pull requests.

## 📞 Support

**For licensing inquiries:**
- Email: 4d@emersa.io
- Subject: CYBERCAT License Purchase

**For technical support:**
- Free tier: Community support
- Pro tier: Email support (24h response)
- Enterprise: Priority support (4h response) + phone

## 🔄 Updates

Check for updates regularly. New features include:
- Enhanced threat detection
- Additional scan types
- Performance improvements
- Security patches

## 📚 Documentation

- [LICENSE-PURCHASE.md](./LICENSE-PURCHASE.md) - How to purchase licenses
- [TERMS-AND-CONDITIONS.txt](./TERMS-AND-CONDITIONS.txt) - Legal terms

---

**CYBERCAT v2.0.0** - Stay secure! 🐱🔒

*Emersa Labs (trading name for Emersa Ltd.)*
*Made with ❤️ for cybersecurity professionals*
*Copyright © 2025. All Rights Reserved.*
