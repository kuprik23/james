# 🐱 CyberCAT Scanner

**Military-Grade Vulnerability Scanner (TypeScript Edition)**

```
    /\_____/\
   /  o   o  \
  ( ==  ^  == )
   )         (
  (           )
 ( (  )   (  ) )
(__(__)___(__)__)
   CYBERCAT v2.0
```

## Overview

CyberCAT Scanner is a TypeScript-based vulnerability scanning tool that provides:
- **Port Scanning** - Detect open ports and identify risky services
- **SSL/TLS Analysis** - Check certificate validity and cipher strength
- **Local Security Sweep** - Analyze local system security posture
- **Full Vulnerability Scan** - Comprehensive security assessment

## Requirements

- Node.js 18 or higher
- TypeScript 5.3+
- Windows, Linux, or macOS

## Installation

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build
```

## Quick Start

### Development Mode
```bash
# Build and run
npm run dev

# Watch mode (auto-rebuild)
npm run watch

# Interactive mode
npm start
```

### Production Mode
```bash
# Build first
npm run build

# Run compiled code
npm start

# Or run directly
node dist/scanner.js
```

### Command Line Usage
```bash
# Full scan
npm start scan example.com

# Port scan only
npm start ports 192.168.1.1

# SSL check
npm start ssl example.com

# Local security sweep
npm start sweep

# Show license info
npm start license
```

### Install Globally (Optional)
```bash
npm install -g .
cybercat-scanner scan example.com
```

## Commands

### Interactive Mode
| Command | Description |
|---------|-------------|
| `scan <host>` | Full vulnerability scan of target |
| `ports <host>` | Port scan target host |
| `ssl <host>` | Check SSL/TLS configuration |
| `sweep` | Local system security sweep |
| `license` | Show license information |
| `help` | Show available commands |
| `exit` | Exit the scanner |

### Command Line Options
| Option | Description |
|--------|-------------|
| `--scan, -s <host>` | Full vulnerability scan |
| `--ports, -p <host>` | Port scan only |
| `--ssl <host>` | SSL/TLS check only |
| `--sweep` | Local security sweep |
| `--license` | Show license information |
| `--help, -h` | Show help |

## Features

### Port Scanner
Scans 24 common ports including:
- FTP (21), SSH (22), Telnet (23)
- HTTP (80), HTTPS (443)
- Database ports (MySQL, PostgreSQL, MSSQL, MongoDB)
- Remote access (RDP, VNC)
- And more...

**Risk Assessment:**
- 🔴 HIGH RISK - Multiple risky ports open (Telnet, SMB, etc.)
- 🟡 MEDIUM RISK - Some risky ports detected
- 🟢 LOW RISK - No risky ports found

### SSL/TLS Analyzer
- Protocol version check (TLS 1.2/1.3 recommended)
- Cipher suite analysis
- Certificate validity and expiration
- Security rating (A-F)

### Local Security Sweep
- System information gathering
- Network interface enumeration
- Memory status analysis
- Localhost port scan

## TypeScript Development

### Project Structure
```
cybercat-scanner/
├── src/
│   ├── scanner.ts           # Main scanner implementation
│   ├── license-service.ts   # License management
│   └── types.ts             # TypeScript type definitions
├── dist/                    # Compiled JavaScript output
├── tsconfig.json            # TypeScript configuration
├── package.json             # Project dependencies
└── README.md
```

### Available Scripts
```bash
npm run build       # Compile TypeScript to JavaScript
npm run dev         # Build and run in development mode
npm run watch       # Watch for changes and auto-rebuild
npm start           # Run the compiled scanner
npm run scan        # Quick scan command
npm run sweep       # Quick sweep command
```

### Type Safety Benefits
- **Compile-time error checking** - Catch bugs before runtime
- **IntelliSense support** - Better IDE autocomplete and documentation
- **Refactoring confidence** - Safe code modifications
- **Clear interfaces** - Well-defined data structures

## License System

CyberCAT Scanner includes a built-in license system with three tiers:

### Free Tier
- 1 scan per day
- Basic port scanning
- System information
- Simple vulnerability checks

### Pro Tier
- Unlimited scans
- AI threat analysis
- Multi-LLM access
- Real-time monitoring
- IoT management
- Custom agents
- Export reports

### Enterprise Tier
- All Pro features
- Priority support
- Custom integrations
- Advanced analytics
- Team collaboration

Check your license status:
```bash
npm start license
```

## Creating an Executable (Optional)

Build a standalone executable using `pkg`:

```bash
npm install -g pkg
npm run build
pkg dist/scanner.js --targets node18-win-x64 --output CyberCAT-Scanner.exe
```

Or use the TypeScript compiled version directly:
```bash
npm start
```

## Example Output

```
╔════════════════════════════════════════════════════════════╗
║                    PORT SCAN RESULTS                       ║
╠════════════════════════════════════════════════════════════╣
║  Target: 192.168.1.1                                       ║
║  Open Ports: 5                                             ║
╠════════════════════════════════════════════════════════════╣
║  PORT      SERVICE          STATUS                         ║
║  ────      ───────          ──────                         ║
║  22       SSH              ✓  OK                           ║
║  80       HTTP             ✓  OK                           ║
║  443      HTTPS            ✓  OK                           ║
║  3389     RDP              ⚠️  RISKY                        ║
╠════════════════════════════════════════════════════════════╣
║  Risk Assessment: 🟡 MEDIUM RISK                           ║
╚════════════════════════════════════════════════════════════╝
```

## Security Recommendations

Based on scan results, CyberCAT provides recommendations:
- Close unnecessary ports
- Upgrade to TLS 1.2 or higher
- Implement network segmentation
- Regular security audits
- Keep systems updated

## Integration with CyberCAT Hub

This scanner can be used standalone or integrated with the CyberCAT Hub web interface for a complete security command center.

## Migration from JavaScript

This project has been fully migrated to TypeScript for improved:
- Type safety and error prevention
- Better IDE support and autocomplete
- Easier maintenance and refactoring
- Clear API documentation through types

The original JavaScript version (`scanner.js`) is preserved for reference, but the TypeScript version (`src/scanner.ts`) is now the primary implementation.

## Legacy Java Version

The original Java version is still available in this directory. The TypeScript version provides the same functionality with modern tooling and better developer experience.

## License

MIT License - Copyright © 2025 Emersa Ltd. All Rights Reserved.

---

```
    /\_____/\
   /  o   o  \
  ( ==  ^  == )  "Stay secure, stay vigilant"
   )         (
  (           )
 ( (  )   (  ) )
(__(__)___(__)__)
