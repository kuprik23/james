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

CyberCAT Scanner is a Java-based vulnerability scanning tool that provides:
- **Port Scanning** - Detect open ports and identify risky services
- **SSL/TLS Analysis** - Check certificate validity and cipher strength
- **Local Security Sweep** - Analyze local system security posture
- **Full Vulnerability Scan** - Comprehensive security assessment

## Requirements

- Java 11 or higher
- Windows, Linux, or macOS

## Quick Start

### Build
```bash
# Using Maven
mvn clean package

# Or using the build script (Windows)
build.bat
```

### Run
```bash
# Interactive mode
java -jar target/cybercat-scanner-1.0.0.jar

# Or use the launcher (Windows)
cybercat.bat

# Command line mode
java -jar target/cybercat-scanner-1.0.0.jar --scan example.com
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

## Creating an Executable

### Windows EXE
```bash
# Run the EXE creator script
create-exe.bat
```

This creates:
- `dist/CyberCAT.exe` - Windows executable
- `dist/CyberCAT.bat` - Batch launcher
- `dist/cybercat-scanner-1.0.0.jar` - JAR file

### Manual JAR Execution
```bash
java -jar cybercat-scanner-1.0.0.jar
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