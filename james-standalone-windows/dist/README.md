# CYBERCAT - Standalone Windows Application

```
  ██████╗██╗   ██╗██████╗ ███████╗██████╗  ██████╗ █████╗ ████████╗
 ██╔════╝╚██╗ ██╔╝██╔══██╗██╔════╝██╔══██╗██╔════╝██╔══██╗╚══██╔══╝
 ██║      ╚████╔╝ ██████╔╝█████╗  ██████╔╝██║     ███████║   ██║
 ██║       ╚██╔╝  ██╔══██╗██╔══╝  ██╔══██╗██║     ██╔══██║   ██║
 ╚██████╗   ██║   ██████╔╝███████╗██║  ██║╚██████╗██║  ██║   ██║
  ╚═════╝   ╚═╝   ╚═════╝ ╚══════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝   ╚═╝
```

**Cyber Analysis & Threat Detection - AI Security Platform**

Military-grade cybersecurity platform with autonomous AI agents, real-time threat detection, and multi-LLM intelligence.

---

## 📦 What's Included

This standalone CYBERCAT package includes:
- **James.exe** - Self-contained CYBERCAT executable (no Node.js required)
- **Web GUI** - Modern browser-based interface
- **CLI Tools** - Command-line security tools
- **Multi-LLM Support** - OpenAI, Anthropic, Ollama, KoboldAI, and more
- **Security Scanners** - Port scanning, vulnerability detection, malware analysis
- **IoT Integration** - MQTT, CoAP, Zigbee device management

---

## 🚀 Quick Start

### Method 1: Web Interface (Recommended)

1. Double-click **`Start-James-GUI.bat`**
2. Browser opens automatically at `http://localhost:3000`
3. Start using CYBERCAT! 🐱

### Method 2: Command Line Interface

1. Double-click **`Start-James-CLI.bat`**
2. Chat interactively with AI agents
3. Type `/help` for commands

### Method 3: Security Scan

1. Double-click **`Run-Security-Scan.bat`**
2. View comprehensive security report

---

## ⚙️ Configuration

### Setting Up LLM Providers

1. Navigate to `config` folder
2. Copy `.env.example` to `.env`
3. Add your API keys:

```env
# OpenAI
OPENAI_API_KEY=sk-your-key-here

# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Ollama (local)
OLLAMA_HOST=http://localhost:11434

# KoboldAI (local)
KOBOLDAI_HOST=http://localhost:5001
```

### Server Settings

Edit `config/.env`:

```env
PORT=3000          # Web server port
HOST=0.0.0.0       # Bind to all interfaces
```

---

## 🎯 Features

### AI Agents
- 🛡️ Security Analyst - Threat detection & analysis
- 🔍 Penetration Tester - Vulnerability assessment
- 📊 Data Analyst - Security metrics & reporting
- 🌐 Network Specialist - Network security analysis
- 💻 System Administrator - System hardening
- 🔐 Cryptography Expert - Encryption & key management
- 🚨 Incident Responder - Security incident handling
- 📝 Compliance Officer - Security policy compliance

### Security Tools
- Port scanning
- Network analysis
- System vulnerability assessment
- Malware detection
- Ransomware protection
- Hash analysis
- Security reporting

### IoT Integration
- MQTT broker connection
- CoAP device management
- Zigbee network scanning
- REST API integration
- Real-time device monitoring

---

## 📂 Folder Structure

```
james-standalone-windows/
├── dist/
│   ├── James.exe                    # Main executable
│   ├── Start-James-GUI.bat          # GUI launcher
│   ├── Start-James-CLI.bat          # CLI launcher
│   ├── Run-Security-Scan.bat        # Quick scan tool
│   ├── config/
│   │   ├── .env.example             # Configuration template
│   │   └── .env                     # Your configuration
│   ├── public/                      # Web interface files
│   ├── modules/                     # Java/Kotlin/Rust/C++ modules
│   ├── data/                        # Application data
│   └── logs/                        # Log files
```

---

## 🔧 Advanced Usage

### Command Line Options

Run James from command prompt:

```batch
# Start web server
James.exe start --port 3000

# Interactive chat
James.exe chat

# Run security scan
James.exe scan --type full

# List available tools
James.exe tools

# List AI agents
James.exe agents

# List LLM providers
James.exe providers

# Configure settings
James.exe config
```

### Scan Types

```batch
# Full security report
James.exe scan --type full

# System analysis only
James.exe scan --type system

# Network analysis
James.exe scan --type network

# Port scan (specific host)
James.exe scan --type ports --host 192.168.1.1
```

---

## 🛡️ Security Features

### Built-in Protection
- ✅ AES-256-GCM encryption for credentials
- ✅ Anti-malware scanning
- ✅ Anti-ransomware defense
- ✅ DDoS protection
- ✅ Rate limiting
- ✅ Secure credential storage
- ✅ Real-time threat detection

### Data Privacy
- All data stays local (except cloud LLM calls)
- Encrypted credential storage
- No telemetry or tracking
- Audit logging for all security events

---

## 🌐 Multi-LLM Support

James supports multiple AI providers:

### Cloud Providers
- **OpenAI** - GPT-4, GPT-3.5
- **Anthropic** - Claude 3 Opus, Sonnet, Haiku
- **Cohere** - Command models
- **Groq** - Fast inference
- **Together AI** - Various open models

### Local Providers (No API Key Required)
- **Ollama** - Run models locally (llama2, mistral, etc.)
- **KoboldAI** - Local text generation
- **LM Studio** - Local model hosting

### Switching Providers

In Web GUI:
1. Click Settings icon
2. Select "LLM Provider"
3. Choose provider and model
4. Enter API key if needed

In CLI:
```batch
James.exe config
# Select "Set API Key" or "Select Default Provider"
```

---

## 📊 System Requirements

### Minimum Requirements
- Windows 10 or later (64-bit)
- 4 GB RAM
- 500 MB disk space
- Internet connection (for cloud LLMs)

### Recommended
- Windows 11 (64-bit)
- 8 GB RAM
- 2 GB disk space
- SSD storage

### For Local LLMs (Ollama/KoboldAI)
- 16 GB RAM minimum
- GPU recommended (NVIDIA with CUDA support)
- Additional disk space for models (2-8 GB per model)

---

## 🔍 Troubleshooting

### Port Already in Use

If port 3000 is busy, change it:

1. Edit `config/.env`:
   ```env
   PORT=8080
   ```
2. Or run with custom port:
   ```batch
   James.exe start --port 8080
   ```

### Browser Doesn't Open

Manually open: `http://localhost:3000`

### Ollama Connection Failed

1. Install Ollama: https://ollama.ai
2. Start Ollama service
3. Pull a model:
   ```batch
   ollama pull llama2
   ```
4. James will auto-detect Ollama

### Cannot Find Configuration

Create `config/.env` from `config/.env.example`

### Firewall Warning

Allow James.exe through Windows Firewall when prompted.

---

## 📝 Logging

Logs are stored in `logs/` folder:
- `james.log` - Application logs
- `security.log` - Security events
- `audit.log` - Audit trail

---

## 🆘 Support

### Documentation
- Full documentation in `/docs` folder
- API documentation: `http://localhost:3000/api`

### Getting Help
1. Check logs in `logs/` folder
2. Review configuration in `config/.env`
3. Verify firewall settings

---

## 📜 License

Copyright © 2025 Emersa Ltd. All Rights Reserved.

---

## 🎉 Version

**James Ultimate v2.0.0**

Built with ❤️ for cybersecurity professionals.

---

## 🚦 Getting Started Checklist

- [ ] Extract package to desired location
- [ ] (Optional) Configure API keys in `config/.env`
- [ ] Run `Start-James-GUI.bat`
- [ ] Open browser to `http://localhost:3000`
- [ ] Select LLM provider from settings
- [ ] Start chatting or run security scans!

**Enjoy your AI-powered cybersecurity assistant! 🛡️**