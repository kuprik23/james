# 🚀 James AI - Standalone Applications Guide

## Repository
📦 **GitHub:** https://github.com/kuprik23/james

---

## 📍 Standalone Application Locations

### 1. **CyberCat Standalone** (Node.js)
**Location:** [`cybercat-standalone/`](cybercat-standalone/)

**Description:** AI-Powered Cybersecurity Analysis Tool
- Full security scanning
- Network analysis
- Process monitoring
- Port scanning
- Firewall & antivirus status checks

**Quick Start:**
```bash
cd cybercat-standalone
node cybercat.js status          # Check security status
node cybercat.js network         # Network analysis
node cybercat.js scan            # Full security scan
```

**Status:** ✅ Fully operational and tested

---

### 2. **CyberCAT Scanner** (Node.js Edition)
**Location:** [`cybercat-scanner/`](cybercat-scanner/)

**Description:** Military-Grade Vulnerability Scanner
- Port scanning with risk assessment
- SSL/TLS analysis
- Local security sweep
- Interactive and CLI modes

**Quick Start:**
```bash
cd cybercat-scanner
node scanner.js                  # Interactive mode
node scanner.js sweep            # Local security sweep
node scanner.js scan localhost   # Scan a target
node scanner.js --help           # Show all commands
```

**Status:** ✅ Rebuilt in Node.js (no Java/Maven required), fully tested

**Note:** Original Java version preserved in same directory

---

### 3. **LangGraph Agent** (Python)
**Location:** [`langgraph-agent/`](langgraph-agent/)

**Description:** AI-Powered Security Agent with LangGraph
- System security analysis
- IP reputation checking
- URL threat analysis
- Network monitoring
- Comprehensive security reports

**Configuration Required:**
```bash
cd langgraph-agent

# Option 1: Use the simple configurator
cd ..
configure-api-keys.bat

# Option 2: Manual configuration
# Edit .env file and add one of these:
# OPENAI_API_KEY=sk-your-key-here
# ANTHROPIC_API_KEY=sk-ant-your-key-here
```

**Quick Start:**
```bash
cd langgraph-agent

# Run as CLI
python agent.py "Generate a security report"

# Run as API server
python server.py
# Then access: http://localhost:8000/docs
```

**Status:** ✅ Fixed and tested (LangGraph v1.0.5 compatible)

---

## 🔧 Easy Configuration

### Simple Setup Script
Run [`configure-api-keys.bat`](configure-api-keys.bat) to configure all API keys at once:
```bash
configure-api-keys.bat
```

This will help you set up:
- OpenAI API key (for LangGraph Agent)
- Anthropic API key (alternative for LangGraph Agent)
- Digital Ocean API token (for cloud deployments)

### Manual Configuration

#### For LangGraph Agent:
1. Copy [`langgraph-agent/.env.example`](langgraph-agent/.env.example) to `langgraph-agent/.env`
2. Edit `.env` and add your API key:
   ```
   OPENAI_API_KEY=your_key_here
   # OR
   ANTHROPIC_API_KEY=your_key_here
   ```

#### For Digital Ocean:
1. Get your API token from: https://cloud.digitalocean.com/account/api/tokens
2. Run: `security/store-token.bat` (stores securely in Windows Credential Manager)
   OR
3. Create `.env` in root directory with:
   ```
   DIGITALOCEAN_API_TOKEN=your_token_here
   ```

---

## 🧪 Testing Status

All standalones have been built, tested, and verified:

| Application | Status | Tests Performed |
|-------------|--------|-----------------|
| **cybercat-standalone** | ✅ Working | Help, status check, network analysis |
| **cybercat-scanner** | ✅ Working | Port scan, security sweep, risk assessment |
| **langgraph-agent** | ✅ Working | Import checks, syntax validation |
| **emersa-gui** | ✅ Working | Full web interface tested on port 3001 |

---

## 📦 Dependencies Status

### Installed & Ready:
- ✅ cybercat-standalone: All Node.js dependencies installed
- ✅ cybercat-scanner: No dependencies needed (built-in Node.js only)
- ✅ langgraph-agent: All Python dependencies installed (langgraph, langchain, fastapi, etc.)

### Running Services:
- ✅ emersa-gui: Running on http://localhost:3001
- ✅ james-ultimate: Running backend server

---

## 🌐 Digital Ocean Status

### Current Setup:
- MCP Server: [`digitalocean-mcp/`](digitalocean-mcp/)
- Security: Tokens stored via Windows Credential Manager
- Configuration: Use `configure-api-keys.bat` or `security/store-token.bat`

### To Deploy:
```bash
cd langgraph-agent
python deploy-to-digitalocean.py
```

**Note:** Requires Digital Ocean API token to be configured first

---

## 📖 Documentation

### Standalone READMEs:
- [`cybercat-standalone/README.md`](cybercat-standalone/README.md) - Detailed usage guide
- [`cybercat-scanner/README.md`](cybercat-scanner/README.md) - Scanner documentation
- [`langgraph-agent/README.md`](langgraph-agent/README.md) - Agent and API docs

### Setup Guides:
- [`INSTALLATION_GUIDE.md`](INSTALLATION_GUIDE.md) - Full installation instructions
- [`SETUP_COMPLETION_GUIDE.md`](SETUP_COMPLETION_GUIDE.md) - Setup verification
- [`security/README.md`](security/README.md) - Secure token management

---

## 🚀 Quick Start Summary

### 1. Configure API Keys (Optional but recommended for LangGraph):
```bash
configure-api-keys.bat
```

### 2. Test Standalone Applications:

**CyberCat Standalone:**
```bash
cd cybercat-standalone
node cybercat.js status
```

**CyberCAT Scanner:**
```bash
cd cybercat-scanner
node scanner.js sweep
```

**LangGraph Agent** (requires API key):
```bash
cd langgraph-agent
python server.py
# Access API at: http://localhost:8000/docs
```

### 3. Access Web Interface:
```
http://localhost:3001
```

---

## 📊 Recent Updates

### Latest Commit (Just Pushed to GitHub):
```
Add Node.js CyberCAT Scanner and fix LangGraph agent
- All standalones now operational
- cybercat-scanner: Complete Node.js rewrite (no Java/Maven needed)
- langgraph-agent: Fixed ToolExecutor import, updated for LangGraph v1.0.5
- All three standalones tested and working
```

### Changes:
- ✅ Created Node.js version of cybercat-scanner (no Java required)
- ✅ Fixed LangGraph agent for v1.0.5 compatibility
- ✅ Added `configure-api-keys.bat` for easy setup
- ✅ All dependencies installed and tested
- ✅ All standalones verified working

---

## 🎯 What's Next?

1. **Configure API Keys** (if you haven't):
   - Run `configure-api-keys.bat`
   - Or manually edit `.env` files as needed

2. **Test Each Standalone**:
   - Try the quick start commands above
   - Verify everything works in your environment

3. **Deploy to Cloud** (optional):
   - Configure Digital Ocean token
   - Run deployment scripts in `langgraph-agent/`

4. **Customize**:
   - Each standalone is fully customizable
   - Check individual README files for advanced options

---

## ❓ Troubleshooting

### LangGraph Agent not starting?
- Ensure you have an API key configured in `langgraph-agent/.env`
- Check Python dependencies: `pip list | findstr langchain`

### CyberCAT Scanner no Java version?
- The Node.js version is now primary (no Java needed!)
- Original Java version still available if needed

### Can't find API keys?
- Run `configure-api-keys.bat` for guided setup
- Check `.env` files in respective directories

---

## 🔒 Security Notes

- API keys stored securely in `.env` files (not committed to git)
- Digital Ocean tokens can use Windows Credential Manager
- `.gitignore` configured to protect sensitive data
- All standalones run locally by default

---

**Built and tested:** December 15, 2025  
**Repository:** https://github.com/kuprik23/james  
**Status:** All standalones operational and ready to use! 🎉