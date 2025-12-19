# CYBERCAT - Installation Guide

```
  ██████╗██╗   ██╗██████╗ ███████╗██████╗  ██████╗ █████╗ ████████╗
 ██╔════╝╚██╗ ██╔╝██╔══██╗██╔════╝██╔══██╗██╔════╝██╔══██╗╚══██╔══╝
 ██║      ╚████╔╝ ██████╔╝█████╗  ██████╔╝██║     ███████║   ██║   
 ██║       ╚██╔╝  ██╔══██╗██╔══╝  ██╔══██╗██║     ██╔══██║   ██║   
 ╚██████╗   ██║   ██████╔╝███████╗██║  ██║╚██████╗██║  ██║   ██║   
  ╚═════╝   ╚═╝   ╚═════╝ ╚══════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝   ╚═╝   
```

**Standalone Windows Desktop Application**

---

## 📦 Package Contents

The `dist` folder contains your complete CYBERCAT standalone application:

```
dist/
├── James.exe                      # Main CYBERCAT executable
├── Start-CYBERCAT-GUI.bat         # Launch web interface
├── Start-CYBERCAT-CLI.bat         # Launch command-line interface
├── Run-CYBERCAT-Scan.bat          # Quick security scan
├── CYBERCAT-ASCII.txt             # ASCII art logo
├── README.md                      # Full documentation
├── config/
│   └── .env.example               # Configuration template
├── data/                          # Application data storage
├── logs/                          # Log files location
├── public/                        # Web interface files
│   ├── index.html
│   ├── dashboard.html
│   ├── activity-monitor.html
│   ├── css/
│   ├── js/
│   └── images/
│       └── cybercat-logo.svg     # CYBERCAT logo
└── modules/                       # Optional: Java/Kotlin/Rust/C++ modules
    ├── java/
    ├── kotlin/
    ├── rust/
    └── cpp/
```

---

## 🚀 Installation Steps

### Step 1: Extract Package

Extract the `james-standalone-windows` folder to your preferred location:

**Recommended locations:**
- `C:\Program Files\CYBERCAT\`
- `C:\Users\YourName\Desktop\CYBERCAT\`
- `D:\Applications\CYBERCAT\`

### Step 2: Navigate to dist Folder

Open the `dist` folder - this contains all executable files.

### Step 3: Run CYBERCAT

Choose your preferred method:

#### Method A: Web Interface (Best Experience)
Double-click: **`Start-CYBERCAT-GUI.bat`**
- Opens browser automatically
- Full-featured GUI
- Real-time monitoring
- Easy configuration

#### Method B: Command Line Interface
Double-click: **`Start-CYBERCAT-CLI.bat`**
- Interactive chat with AI agents
- Terminal-based commands
- Fast and lightweight

#### Method C: Quick Scan
Double-click: **`Run-CYBERCAT-Scan.bat`**
- Instant security analysis
- Comprehensive report
- No configuration needed

---

## ⚙️ Configuration (Optional)

### For Cloud AI Providers

1. Navigate to `dist\config\`
2. Copy `.env.example` to `.env`
3. Edit `.env` with your API keys:

```env
# OpenAI GPT-4/GPT-3.5
OPENAI_API_KEY=sk-your-openai-key-here

# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here

# Server Settings
PORT=3000
HOST=0.0.0.0
```

### For Local AI (Free - No API Key)

1. Install Ollama: https://ollama.ai/download
2. Open PowerShell or Command Prompt:
   ```
   ollama pull llama2
   ```
3. Start CYBERCAT - it auto-detects Ollama!

---

## 🔥 First Launch

When you first run CYBERCAT:

1. **Firewall Prompt** - Click "Allow Access" when Windows Firewall asks
2. **Browser Opens** - Automatically opens to `http://localhost:3000`
3. **Select Provider** - Choose your LLM provider in settings
4. **Start Protecting** - Begin using CYBERCAT!

---

## 📡 Port Configuration

**Default Port:** 3000

**To Change Port:**

Option 1: Edit `config\.env`
```env
PORT=8080
```

Option 2: Use command line
```batch
cd dist
James.exe start --port 8080
```

---

## 🛡️ Security Features

CYBERCAT includes built-in protection:

- ✅ **AES-256-GCM Encryption** - Military-grade credential protection
- ✅ **Anti-Malware** - Real-time threat detection
- ✅ **Anti-Ransomware** - Automatic file backup and recovery
- ✅ **DDoS Protection** - Rate limiting and IP filtering
- ✅ **Secure Storage** - Encrypted API key storage
- ✅ **Audit Logging** - Complete security event trail

---

## 💻 System Requirements

### Minimum
- Windows 10 (64-bit)
- 4 GB RAM
- 500 MB free disk space
- Internet connection (for cloud LLMs)

### Recommended
- Windows 11 (64-bit)
- 8 GB RAM
- 2 GB free disk space
- SSD storage

### For Local AI
- 16 GB RAM
- GPU with CUDA support (NVIDIA)
- 5-10 GB additional storage per model

---

## 🔧 Advanced Configuration

### Environment Variables

All configuration in `config\.env`:

```env
# LLM Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
COHERE_API_KEY=...
GROQ_API_KEY=...

# Local LLM Servers
OLLAMA_HOST=http://localhost:11434
KOBOLDAI_HOST=http://localhost:5001
LMSTUDIO_HOST=http://localhost:1234

# Server Configuration
PORT=3000
HOST=0.0.0.0

# Security Settings
ENABLE_MALWARE_SCAN=true
ENABLE_RANSOMWARE_PROTECTION=true
RATE_LIMIT_MAX_REQUESTS=200
RATE_LIMIT_WINDOW_MS=60000
```

### Command Line Usage

From `dist` folder:

```batch
# Start web server
James.exe start

# Interactive chat
James.exe chat

# Security scans
James.exe scan --type full
James.exe scan --type system
James.exe scan --type network
James.exe scan --type ports --host 192.168.1.1

# Configuration
James.exe config

# List features
James.exe tools
James.exe agents
James.exe providers
```

---

## 🔍 Troubleshooting

### Issue: Port Already in Use

**Solution:** Change port in `config\.env` or use:
```batch
James.exe start --port 8080
```

### Issue: Browser Doesn't Open

**Solution:** Manually open http://localhost:3000

### Issue: Cannot Connect to Ollama

**Solution:**
1. Verify Ollama is running: `ollama list`
2. Check host in config: `OLLAMA_HOST=http://localhost:11434`
3. Restart CYBERCAT

### Issue: Firewall Blocking

**Solution:**
1. Windows Firewall → Allow an app
2. Find `James.exe` in `dist` folder
3. Check both Private and Public networks

### Issue: Missing Configuration

**Solution:** Copy `config\.env.example` to `config\.env`

---

## 📊 Monitoring & Logs

### Log Files

Located in `dist\logs\`:
- `james.log` - General application logs
- `security.log` - Security events and alerts
- `audit.log` - Audit trail of all actions

### Real-Time Monitoring

Web Interface: `http://localhost:3000/activity-monitor.html`
- Live system status
- Active threats
- Resource usage
- Connected devices

---

## 🆘 Getting Help

### Documentation
- **README.md** - Complete feature guide
- **QUICKSTART.md** - Fast setup guide
- **API Docs:** http://localhost:3000/api

### Support Resources
1. Check log files in `logs\` folder
2. Verify configuration in `config\.env`
3. Review Windows Firewall settings
4. Ensure port 3000 is available

---

## 📦 Package Distribution

### To Share This Package

1. Zip the entire `james-standalone-windows` folder
2. Share the zip file
3. Recipient extracts and runs from `dist` folder
4. No Node.js or dependencies required!

### What's Included
- ✅ Self-contained executable
- ✅ All necessary files
- ✅ Web interface assets
- ✅ Configuration templates
- ✅ Documentation
- ❌ NO external dependencies
- ❌ NO installation required

---

## 🎯 Quick Reference

| Action | File to Run |
|--------|------------|
| Web Interface | `Start-CYBERCAT-GUI.bat` |
| Command Line | `Start-CYBERCAT-CLI.bat` |
| Security Scan | `Run-CYBERCAT-Scan.bat` |
| Custom Command | `James.exe [command]` |

**Web Interface URLs:**
- Main Dashboard: http://localhost:3000
- Activity Monitor: http://localhost:3000/activity-monitor.html
- API Documentation: http://localhost:3000/api

---

## ✅ Post-Installation Checklist

- [ ] Package extracted to permanent location
- [ ] Configuration file created (`config\.env`)
- [ ] API keys added (if using cloud LLMs)
- [ ] Ollama installed (if using local AI)
- [ ] Firewall permissions granted
- [ ] First successful launch completed
- [ ] LLM provider selected and tested
- [ ] Security scan performed

---

## 🚀 You're Ready!

CYBERCAT is now installed and ready to protect your systems with AI-powered cybersecurity!

**Next Steps:**
1. Launch using `Start-CYBERCAT-GUI.bat`
2. Configure your preferred LLM provider
3. Run your first security scan
4. Explore the AI agents and tools

**Stay secure with CYBERCAT! 🐱🛡️**

---

*Copyright © 2025 Emersa Ltd. All Rights Reserved.*  
*CYBERCAT v2.0.0 - James Ultimate Edition*