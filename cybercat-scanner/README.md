# 🐱 CyberCAT Scanner

**Military-Grade Vulnerability Scanner**

```
    /\_____/\
   /  o   o  \
  ( ==  ^  == )
   )         (
  (           )
 ( (  )   (  ) )
(__(__)___(__)__)
   CYBERCAT v1.0
```

## Overview

CyberCAT Scanner is a Node.js-based vulnerability scanning tool that provides:
- **Port Scanning** - Detect open ports and identify risky services
- **SSL/TLS Analysis** - Check certificate validity and cipher strength
- **Local Security Sweep** - Analyze local system security posture
- **Full Vulnerability Scan** - Comprehensive security assessment

## Requirements

- Node.js 14 or higher
- Windows, Linux, or macOS

## Quick Start

### Run Directly
```bash
# Interactive mode
node scanner.js

# Or use the launcher (Windows)
run-scanner.bat

# Command line mode
node scanner.js scan example.com
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
| `help` | Show available commands |
| `exit` | Exit the scanner |

### Command Line Options
| Option | Description |
|--------|-------------|
| `--scan, -s <host>` | Full vulnerability scan |
| `--ports, -p <host>` | Port scan only |
| `--ssl <host>` | SSL/TLS check only |
| `--sweep` | Local security sweep |
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

## Creating an Executable (Optional)

You can use `pkg` to create standalone executables:

```bash
npm install -g pkg
pkg scanner.js --targets node18-win-x64 --output dist/CyberCAT-Scanner.exe
```

Or simply run directly with Node.js:
```bash
node scanner.js
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

## Legacy Java Version

The original Java version is still available in this directory. The Node.js version provides the same functionality without requiring Java/Maven installation.

## License

MIT

---

```
    /\_____/\
   /  o   o  \
  ( ==  ^  == )  "Stay secure, stay vigilant"
   )         (
  (           )
 ( (  )   (  ) )
(__(__)___(__)__)