# 🐱 CyberCAT - Military-Grade Cybersecurity MCP Server (TypeScript Edition)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║   ██████╗██╗   ██╗██████╗ ███████╗██████╗  ██████╗ █████╗ ████████╗      ║
║  ██╔════╝╚██╗ ██╔╝██╔══██╗██╔════╝██╔══██╗██╔════╝██╔══██╗╚══██╔══╝      ║
║  ██║      ╚████╔╝ ██████╔╝█████╗  ██████╔╝██║     ███████║   ██║         ║
║  ██║       ╚██╔╝  ██╔══██╗██╔══╝  ██╔══██╗██║     ██╔══██║   ██║         ║
║  ╚██████╗   ██║   ██████╔╝███████╗██║  ██║╚██████╗██║  ██║   ██║         ║
║   ╚═════╝   ╚═╝   ╚═════╝ ╚══════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝   ╚═╝         ║
║                                                                           ║
║   Cyber Analysis & Threat Detection - Military Grade Security Monitor    ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

An advanced MCP (Model Context Protocol) server for military-grade cybersecurity monitoring and threat detection, now with full TypeScript support for enhanced type safety and maintainability.

## 🎯 Features

### 🔒 Security Assessment
- Full system security audit
- Threat level classification (CRITICAL, HIGH, MEDIUM, LOW, INFO)
- Executive summary with actionable recommendations

### 🌐 Network Analysis
- Active connection monitoring
- Suspicious port detection
- Foreign connection tracking
- Network traffic analysis
- Backdoor port identification

### ⚙️ Process Security
- Malware process detection
- Resource abuse monitoring (cryptominers, DoS)
- Suspicious process identification
- Service status tracking

### 🔍 Port Scanning
- TCP port scanning
- Service identification
- Vulnerability assessment
- Suspicious port alerting

### 👤 User Session Monitoring
- Active session tracking
- Remote connection detection
- Unauthorized access alerts

### 🛡️ Security Configuration
- Windows Defender status
- Firewall status
- Security recommendations
- System hardening checks

### 🔎 DNS Reconnaissance
- DNS record enumeration (A, AAAA, MX, NS, TXT)
- SPF record verification
- DMARC configuration check
- Email security assessment

## 📦 Installation

```bash
cd cybercat-mcp
npm install
```

## 🚀 Usage

### TypeScript Development

#### Build the project
```bash
npm run build
```

#### Development mode (build + run)
```bash
npm run dev
```

#### Watch mode (auto-rebuild)
```bash
npm run watch
```

#### Start the server (production)
```bash
npm start
```

### Project Structure
```
cybercat-mcp/
├── src/
│   ├── index.ts              # Main MCP server (1,020 lines)
│   └── types.ts              # TypeScript type definitions
├── dist/                     # Compiled JavaScript output
├── tsconfig.json             # TypeScript configuration
├── package.json              # Project dependencies
└── README.md
```

### TypeScript Benefits
- ✅ **Full Type Safety** - Catch errors at compile time
- ✅ **Better IDE Support** - IntelliSense and autocomplete
- ✅ **Clear Interfaces** - Well-defined data structures
- ✅ **Maintainability** - Easier to refactor and extend
- ✅ **Documentation** - Types serve as inline documentation

## 🛠️ Available Tools

### 1. security_assessment
Perform a comprehensive security assessment of the entire system.

**Parameters:** None

**Returns:**
- Overall threat level
- Module-by-module analysis
- All security alerts
- Executive summary with recommendations

### 2. analyze_network
Analyze network connections for suspicious activity.

**Parameters:** None

**Returns:**
- Connection statistics
- Suspicious connections
- Foreign connections
- Local services
- Network traffic data

### 3. analyze_processes
Analyze running processes for security threats.

**Parameters:** None

**Returns:**
- Process statistics
- Suspicious processes
- High CPU/memory processes
- Service status

### 4. scan_ports
Scan ports on a target host.

**Parameters:**
- `host` (required): Target hostname or IP
- `portRange` (optional): Port range (e.g., "1-1024" or "80,443,8080")

**Returns:**
- Open ports
- Service identification
- Suspicious port alerts

### 5. check_user_sessions
Check active user sessions.

**Parameters:** None

**Returns:**
- Active sessions
- Remote connections
- Session details

### 6. check_security_config
Check system security configuration.

**Parameters:** None

**Returns:**
- OS information
- Windows Defender status
- Firewall status
- Security recommendations

### 7. dns_recon
Perform DNS reconnaissance on a domain.

**Parameters:**
- `domain` (required): Domain to investigate

**Returns:**
- DNS records (A, AAAA, MX, NS, TXT)
- SPF status
- DMARC status
- Email security alerts

## 🚨 Threat Levels

| Level | Icon | Description |
|-------|------|-------------|
| CRITICAL | 🔴 | Immediate action required - active threat detected |
| HIGH | 🟠 | Significant security risk - investigate immediately |
| MEDIUM | 🟡 | Potential security issue - review recommended |
| LOW | 🟢 | Minor concern - monitor situation |
| INFO | 🔵 | Informational - no action required |

## 📊 Example Output

### Security Assessment
```json
{
  "executiveSummary": {
    "status": "ACTION_RECOMMENDED",
    "threatLevel": "🟠 HIGH",
    "alertSummary": "0 Critical, 2 High, 1 Medium, 0 Low",
    "recommendations": [
      "Review and close unnecessary network connections",
      "Investigate suspicious port activity",
      "Enable Windows Defender and real-time protection"
    ]
  }
}
```

### Network Analysis
```json
{
  "status": "THREATS_DETECTED",
  "threatLevel": "🟠 HIGH",
  "analysis": {
    "totalConnections": 45,
    "established": 12,
    "listening": 8,
    "suspicious": [
      {
        "port": 4444,
        "peer": "192.168.1.100",
        "state": "ESTABLISHED"
      }
    ]
  }
}
```

## 🔐 Security Considerations

- This tool is for **defensive security monitoring only**
- Always obtain proper authorization before scanning external systems
- Port scanning external networks may be illegal without permission
- Use responsibly and ethically

## 📋 Suspicious Port List

The following ports are flagged as potentially suspicious:
- 4444, 5555, 6666, 7777, 8888, 9999 (Common backdoor ports)
- 31337, 12345, 27374, 1234 (Known trojan ports)
- 6667, 6668, 6669 (IRC - often used by botnets)
- 3389 (RDP - if unexpected)
- 23 (Telnet - insecure)
- 445, 139 (SMB - potential lateral movement)

## 🐱 Why "CyberCAT"?

**C**yber **A**nalysis & **T**hreat Detection

Like a vigilant cat, CyberCAT:
- 👀 Watches everything silently
- 🐾 Moves quickly to detect threats
- 🦁 Pounces on security issues
- 😺 Keeps your systems safe

## 🔧 TypeScript Configuration

The project uses strict TypeScript settings for maximum type safety:
- Strict mode enabled
- ES2020 target
- ESNext modules
- Full type checking

## 📄 License

MIT License - Copyright © 2025 Emersa Ltd. All Rights Reserved.

## ⚠️ Disclaimer

This tool is provided for educational and defensive security purposes only. Users are responsible for ensuring they have proper authorization before using any scanning or monitoring features on systems they do not own.

---

**Version:** 2.0.0 (TypeScript Edition)
**Last Updated:** 2025-12-19
