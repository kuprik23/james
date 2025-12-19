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

🛡️ CYBERCAT Security Platform
Cyber Analysis & Threat Detection System

Copyright © 2025 Emersa Ltd. All Rights Reserved.
Made in California, USA

A state-of-the-art, military-grade cybersecurity platform powered by artificial intelligence with comprehensive threat detection, malware protection, and real-time security monitoring.

---

🚀 Quick Start (Plug & Play Installation)

CyberCAT Security Platform - Enterprise-Ready Cybersecurity Solution

Prerequisites

Required Software:
- Node.js 18.x or higher ([Download](https://nodejs.org/))
- Python 3.9 or higher ([Download](https://www.python.org/downloads/))
- npm (comes with Node.js)
- pip (comes with Python)

System Requirements:
- Windows 10/11 (Recommended) or Linux/macOS
- 4GB RAM minimum (8GB recommended)
- 2GB disk space for installation
- Internet connection for initial setup

One-Click Installation (Windows)

1. Download or Clone the repository:
   ```bash
   git clone https://github.com/kuprik23/james.git
   cd james
   ```

2. Run the Installer (Right-click → Run as Administrator):
   ```bash
   INSTALL.bat
   ```

3. Start CYBERCAT:
   ```bash
   START-ALL.bat
   ```

4. Access the Interface:
   - Web GUI: http://localhost:3001
   - LangGraph API: http://localhost:8000/docs

That's it! The installer will:
- ✅ Check all prerequisites
- ✅ Install all dependencies automatically
- ✅ Create configuration files
- ✅ Set up startup scripts
- ✅ Create desktop shortcuts (optional)
- ✅ Guide you through API key configuration

Manual Installation

If you prefer manual setup or are on Linux/macOS:

```bash
# Clone the repository
git clone https://github.com/kuprik23/james.git
cd james

# Install Node.js dependencies
cd emersa-gui && npm install && cd ..
cd james-ultimate && npm install && cd ..
cd cybercat-standalone && npm install && cd ..

# Install Python dependencies
cd langgraph-agent
pip install -r requirements.txt
cd ..

# Configure API keys (optional but recommended)
# Edit langgraph-agent/.env and add:
# OPENAI_API_KEY=your_key_here
# OR
# ANTHROPIC_API_KEY=your_key_here

# Start services
cd emersa-gui && PORT=3001 npm start &
cd james-ultimate && node src/server.js &
cd langgraph-agent && python server.py &
```

Configuration

Quick Config Tool:
```bash
CONFIGURE.bat  # Windows
# or
configure-api-keys.bat
```

Manual Configuration:
- Edit [`langgraph-agent/.env`](langgraph-agent/.env) for LangGraph Agent API keys
- Edit [`digitalocean-mcp/.env`](digitalocean-mcp/.env) for Digital Ocean token

Available Platforms:
- Web Interface: http://localhost:3001 (Emersa GUI)
- Main Platform: http://localhost:3000 (James Ultimate)
- API Documentation: http://localhost:8000/docs (LangGraph Agent)

---

🏗️ System Architecture

Core Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    CYBERCAT Platform                             │
│                  (james-ultimate/)                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │  Web Server   │  │  Socket.IO   │  │   API Gateway    │    │
│  │  (Express.js) │  │  Real-time   │  │  RESTful APIs    │    │
│  └───────┬───────┘  └──────┬───────┘  └────────┬─────────┘    │
│          │                  │                   │               │
│  ┌───────┴──────────────────┴───────────────────┴─────────┐   │
│  │              Security Core Layer                        │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │   │
│  │  │  AES-256 │ │   Rate   │ │  Input   │ │  Audit   │ │   │
│  │  │  Encrypt │ │  Limiter │ │Validation│ │  Logger  │ │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          Multi-LLM AI Agent System                       │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │  │
│  │  │ Security │ │ Network  │ │   IoT    │ │  Threat  │  │  │
│  │  │ Analyst  │ │ Guardian │ │ Security │ │  Hunter  │  │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            Threat Detection & Protection                 │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │  │
│  │  │   Anti-  │ │   Anti-  │ │  Process │ │   File   │  │  │
│  │  │ Malware  │ │Ransomware│ │ Monitor  │ │Integrity │  │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Security Analysis Tools                     │  │
│  │  • Port Scanner      • DNS Lookup      • SSL Checker    │  │
│  │  • IP Reputation     • URL Analysis    • File Hashing   │  │
│  │  • Process Analysis  • Network Monitor • System Audit   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

Security Architecture

1. Encryption Layer (AES-256-GCM)
- Algorithm: AES-256-GCM with unique IVs per encryption
- Key Derivation: PBKDF2 with 100,000 iterations
- Use Cases: 
  - API key storage
  - Sensitive configuration
  - Credential management
- Implementation: [`james-ultimate/src/security/security-core.js`](james-ultimate/src/security/security-core.js)

2. Anti-Malware Protection
- Signature-Based Detection: Hash-based malware identification
- Heuristic Analysis: Behavioral pattern recognition
- File Scanning: Real-time file system monitoring
- Process Monitoring: Suspicious process detection
- Quarantine System: Automatic threat isolation
- Implementation: [`james-ultimate/src/security/anti-malware.js`](james-ultimate/src/security/anti-malware.js)

3. Anti-Ransomware Defense
- Honeypot Files: Canary file deployment for early detection
- Mass Encryption Detection: Pattern-based activity monitoring
- Automatic Backup: Continuous file protection
- Process Termination: Suspicious process kill capability
- Shadow Copy Protection: Windows VSS safeguarding
- Implementation: [`james-ultimate/src/security/anti-ransomware.js`](james-ultimate/src/security/anti-ransomware.js)

4. DDoS Protection & Rate Limiting
- Token Bucket Algorithm: Smooth rate limiting
- IP Blacklisting: Automatic threat blocking
- Request Throttling: Per-route limits
- Sliding Window: Accurate request counting
- Implementation: [`james-ultimate/src/security/rate-limiter.js`](james-ultimate/src/security/rate-limiter.js)

---

🤖 AI Agent System

Available Agents

| Agent | Icon | Specialization | Use Case |
|-------|------|----------------|----------|
| Security Analyst | 🔒 | Vulnerability assessment, penetration testing | General security audits |
| Network Guardian | 🌐 | Network security, traffic analysis, IDS | Network monitoring |
| IoT Security | 📡 | IoT device security, protocol analysis | Smart device protection |
| Threat Hunter | 🎯 | APT detection, malware analysis | Proactive threat hunting |
| Compliance Auditor | 📋 | NIST, ISO 27001, PCI DSS, HIPAA | Regulatory compliance |
| Incident Responder | 🚨 | Incident response, forensics | Security incident handling |
| Code Security | 💻 | Secure code review, OWASP Top 10 | Application security |
| General Assistant | 🤖 | General-purpose AI assistant | General queries |

LLM Providers Supported

- Local: Ollama, LM Studio
- Cloud: OpenAI, Anthropic, Google Gemini, Groq, Together AI, OpenRouter
- Enterprise: Azure OpenAI

---

🔧 Security Tools

Network Security
- Port Scanner: Identify open ports and services
- Network Analysis: Monitor active connections
- DNS Lookup: Domain reconnaissance
- SSL Certificate Check: TLS/SSL validation
- WHOIS Lookup: Domain information

System Security
- System Analysis: Security posture assessment
- Process Analysis: Detect suspicious processes
- File Hash Analysis: Integrity verification
- Password Strength Checker: Password security validation

### Threat Intelligence
- IP Reputation Check: Malicious IP detection
- URL Analysis: Phishing and malware URL detection
- Security Report Generator: Comprehensive security audits

---

🌐 IoT Security Management

Supported Protocols
- MQTT: Message queuing for IoT
- CoAP: Constrained Application Protocol
- Modbus TCP: Industrial automation
- HTTP/REST: RESTful APIs
- WebSocket: Real-time communication
- Serial Port: Local device communication
- Raw TCP/UDP: Low-level protocols

IoT Features
- Device discovery and registration
- Protocol-specific security analysis
- Real-time device monitoring
- Automated vulnerability scanning

---

📊 API Endpoints

Core APIs

```http
# Health Check
GET /api/health

# LLM Management
GET /api/llm/providers
POST /api/llm/switch
POST /api/llm/key

# Agent Management
GET /api/agents
POST /api/agents/switch
POST /api/chat

# Security Operations
GET /api/security/status
POST /api/security/scan/malware
GET /api/security/quarantine
POST /api/security/ransomware/monitor
GET /api/security/audit

# Security Tools
GET /api/tools
POST /api/tools/:toolId/execute
POST /api/scan/ports
GET /api/scan/system
GET /api/report

# IoT Management
GET /api/iot/devices
POST /api/iot/devices
POST /api/iot/discover
```

---

🛡️ Security Features

✅ Implemented Protections

1. Encryption
   - ✓ AES-256-GCM for data at rest
   - ✓ Secure key derivation (PBKDF2)
   - ✓ Unique IV per encryption
   - ✓ Authentication tags for integrity

2. Access Control
   - ✓ Rate limiting (100-200 req/min)
   - ✓ IP blacklisting
   - ✓ Request throttling
   - ✓ Input validation & sanitization

   Malware Protection
   - ✓ Signature-based detection
   - ✓ Heuristic analysis
   - ✓ Real-time file scanning
   - ✓ Process monitoring
   - ✓ Automatic quarantine

4. **Ransomware Protection**
   - ✓ Honeypot deployment
   - ✓ Mass encryption detection
   - ✓ Automatic backups
   - ✓ Process termination
   - ✓ Shadow copy protection

5. Audit & Compliance
   - ✓ Security event logging
   - ✓ Audit trail maintenance
   - ✓ Compliance reporting
   - ✓ Incident tracking

---

🚦 Usage Examples

Command Line Interface

```bash
# Start interactive mode
james

# Start web server
james start

# Run security scan
james scan --type full

# Interactive chat
james chat

# List tools
james tools

# List agents
james agents
```

Programmatic Usage

```javascript
const { securityCore } = require('./src/security/security-core');
const { antiMalware } = require('./src/security/anti-malware');

// Encrypt sensitive data
const encrypted = securityCore.encrypt('my-api-key');

// Scan for malware
const scanResult = await antiMalware.scanFile('/path/to/file');

// Monitor for ransomware
antiRansomware.monitorDirectory('/important/data');
```

Web Interface

1. Navigate to `http://localhost:3000`
2. Select an AI agent from the dropdown
3. Choose your preferred LLM provider
4. Start chatting or run security scans
5. Monitor threats in real-time

---

📁 Project Structure

```
james/
├── james-ultimate/              # Main CYBERCAT platform
│   ├── src/
│   │   ├── server.js           # Main server with security integration
│   │   ├── main.js             # CLI interface
│   │   ├── security/           # Security modules
│   │   │   ├── security-core.js        # Encryption & key management
│   │   │   ├── anti-malware.js         # Malware detection
│   │   │   ├── anti-ransomware.js      # Ransomware protection
│   │   │   └── rate-limiter.js         # DDoS protection
│   │   ├── agents/             # AI agent system
│   │   ├── llm/                # Multi-LLM integration
│   │   ├── tools/              # Security tools
│   │   └── iot/                # IoT management
│   ├── public/                 # Web interface
│   └── package.json
│
├── cybercat-mcp/               # MCP server for AI integration
├── system-monitor-mcp/         # System monitoring MCP
├── digitalocean-mcp/           # Cloud deployment MCP
├── emersa-gui/                 # Alternative web GUI
├── langgraph-agent/            # Python LangGraph agent
├── security/                   # Security utilities
└── docs/                       # Documentation

```

---

🔐 Security Best Practices

For Developers

1. Never commit sensitive data
   - Use `.gitignore` for credential files
   - Store keys in encrypted format only
   - Use environment variables for configuration

2. API Key Management
   - Store using `securityCore.storeApiKey()`
   - Retrieve using `securityCore.getApiKey()`
   - Never log or expose keys in responses

3. **Input Validation**
   - Always sanitize user input
   - Use `securityCore.validateInput()`
   - Implement type checking

4. **Rate Limiting**
   - Apply to all public endpoints
   - Use stricter limits for sensitive operations
   - Monitor for abuse patterns

For System Administrators

1. Regular Updates
   - Keep Node.js updated
   - Update npm packages regularly
   - Apply security patches promptly

2. Monitoring
   - Review audit logs daily
   - Monitor rate limiter statistics
   - Check quarantine regularly

3. Backup Strategy
   - Enable automatic backups
   - Test restoration procedures
   - Maintain off-site backups

---

🧪 Testing

Run Security Scans

```javascript
// Malware scan
const result = await antiMalware.performFullScan();

// Ransomware protection test
antiRansomware.getStats();

// Check encryption
const encrypted = securityCore.encrypt('test');
const decrypted = securityCore.decrypt(encrypted);
```

---

📞 Support & Contact

Emersa Ltd.
- Documentation: See `/docs` directory
- Security Issues: Report via secure channels only
- License: Proprietary - All Rights Reserved

---

⚖️ Legal Notice

Copyright & Intellectual Property

This software and all associated documentation are proprietary to **Emersa Ltd.** and are protected by copyright, trade secret, and other intellectual property laws.

CONFIDENTIAL AND PROPRIETARY INFORMATION

Unauthorized copying, distribution, modification, public display, or public performance of this software, via any medium, is strictly prohibited. This software contains trade secrets and proprietary algorithms that are the exclusive property of Emersa Ltd.

Restrictions

- ❌ No reverse engineering
- ❌ No decompilation or disassembly
- ❌ No distribution without written permission
- ❌ No modification of security components
- ❌ No commercial use without license

License

All rights reserved. For licensing inquiries, contact Emersa Ltd.

---

🎯 Roadmap

Completed ✅
- Multi-LLM integration
- AI agent system
- AES-256-GCM encryption
- Anti-malware protection
- Anti-ransomware defense
- Rate limiting & DDoS protection
- IoT security management
- Web interface

In Progress 🚧
- Machine learning threat detection
- Automated penetration testing
- Cloud security posture management
- Blockchain integration

Planned 📋
- Mobile app support
- Advanced AI models
- Integration with SIEM systems
- Zero-trust architecture

---

CYBERCAT - Protecting Systems for Generations to Come
Copyright © 2025 Emersa Ltd. All Rights Reserved. Made in California, USA 
