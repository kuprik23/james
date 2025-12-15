# 📦 CYBERCAT Platform Installation Guide
## Complete Setup for Your Computer & Distribution to Others

**Copyright © 2024 Emersa Ltd. All Rights Reserved.**

---

## 🖥️ Installing on Your Computer (Windows)

### Option 1: Quick Installation (Recommended)

1. **Navigate to the james-ultimate folder**
   ```cmd
   cd james-ultimate
   ```

2. **Run the installer**
   ```cmd
   install.bat
   ```

3. **Start the platform**
   ```cmd
   npm run server
   ```

4. **Open your browser**
   ```
   http://localhost:3000
   ```

### Option 2: Manual Installation

```cmd
cd james-ultimate
npm install
node src/server.js
```

---

## 🐧 Installing on Linux/macOS

### Quick Installation

1. **Navigate to the james-ultimate folder**
   ```bash
   cd james-ultimate
   ```

2. **Make installer executable**
   ```bash
   chmod +x install.sh
   ```

3. **Run the installer**
   ```bash
   ./install.sh
   ```

4. **Start the platform**
   ```bash
   npm run server
   ```

---

## 📤 Distributing to Other Users

### Method 1: GitHub Repository (Recommended)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Share Repository URL**
   - Users clone: `git clone <your-repo-url>`
   - Users run: `cd james-ultimate && install.bat` (Windows) or `./install.sh` (Linux/Mac)

### Method 2: Standalone Distribution Package

#### Creating Distribution Package

**For Windows Users:**

1. **Create distribution folder**
   ```cmd
   mkdir CYBERCAT-Distribution
   xcopy james-ultimate CYBERCAT-Distribution\james-ultimate /E /I
   ```

2. **Create distribution README**
   ```cmd
   copy README.md CYBERCAT-Distribution\
   copy SECURITY.md CYBERCAT-Distribution\
   ```

3. **Create one-click installer**
   
   Create `CYBERCAT-Distribution\INSTALL-CYBERCAT.bat`:
   ```batch
   @echo off
   echo Installing CYBERCAT Platform...
   cd james-ultimate
   call install.bat
   pause
   ```

4. **Create one-click launcher**
   
   Create `CYBERCAT-Distribution\START-CYBERCAT.bat`:
   ```batch
   @echo off
   cd james-ultimate
   start cmd /k "npm run server"
   timeout /t 3
   start http://localhost:3000
   ```

5. **Compress for distribution**
   ```cmd
   # Right-click folder → Send to → Compressed folder
   # OR use 7-Zip/WinRAR
   ```

**For Linux/macOS Users:**

```bash
# Create distribution package
mkdir CYBERCAT-Distribution
cp -r james-ultimate CYBERCAT-Distribution/
cp README.md SECURITY.md CYBERCAT-Distribution/

# Create installer script
cat > CYBERCAT-Distribution/INSTALL-CYBERCAT.sh << 'EOF'
#!/bin/bash
cd james-ultimate
chmod +x install.sh
./install.sh
EOF

chmod +x CYBERCAT-Distribution/INSTALL-CYBERCAT.sh

# Create launcher script  
cat > CYBERCAT-Distribution/START-CYBERCAT.sh << 'EOF'
#!/bin/bash
cd james-ultimate
npm run server
EOF

chmod +x CYBERCAT-Distribution/START-CYBERCAT.sh

# Compress
tar -czf CYBERCAT-Platform.tar.gz CYBERCAT-Distribution/
```

### Method 3: Docker Distribution (Cross-Platform)

**Build Docker image:**
```bash
cd james-ultimate
docker build -t cybercat-platform:latest .
```

**Save Docker image for distribution:**
```bash
docker save cybercat-platform:latest > cybercat-platform.tar
# Compress: gzip cybercat-platform.tar
```

**Users load the image:**
```bash
docker load < cybercat-platform.tar.gz
docker run -p 3000:3000 cybercat-platform:latest
```

---

## 🌐 Cloud Deployment (For Remote Access)

### Digital Ocean Deployment

1. **Prerequisites**
   - Digital Ocean account
   - API token configured

2. **Deploy**
   ```bash
   cd langgraph-agent
   python deploy-to-digitalocean.py
   ```

3. **Access**
   ```
   http://your-droplet-ip:3000
   ```

### Docker Compose Deployment

```bash
cd james-ultimate
docker-compose up -d
```

---

## 📋 Installation Checklist

### For Your Computer
- [x] Node.js 18+ installed
- [x] npm installed
- [ ] Run `install.bat` (Windows) or `./install.sh` (Linux/Mac)
- [ ] Configure API keys (optional)
- [ ] Start platform: `npm run server`
- [ ] Access: `http://localhost:3000`

### For Distribution
- [ ] Test installation on clean system
- [ ] Create distribution package
- [ ] Include README.md and SECURITY.md
- [ ] Test on target OS (Windows/Linux/Mac)
- [ ] Provide support documentation
- [ ] Share via GitHub or direct download

---

## 🔧 Configuration

### API Keys (Optional)

Configure AI capabilities by adding API keys:

1. **Via Web Interface**
   - Go to http://localhost:3000
   - Click "LLM Providers" tab
   - Enter API key
   - Click "Save Key"

2. **Via Environment File**
   ```bash
   # Edit james-ultimate/.env
   OPENAI_API_KEY=sk-your-key-here
   ANTHROPIC_API_KEY=sk-ant-your-key-here
   ```

3. **Via CLI**
   ```bash
   node src/main.js config
   ```

---

## 🚀 Starting the Platform

### Web Interface Mode (Recommended)
```bash
cd james-ultimate
npm run server
# Open http://localhost:3000
```

### CLI Mode
```bash
cd james-ultimate
node src/main.js
# Select from interactive menu
```

### Specific Commands
```bash
# Security scan
node src/main.js scan --type full

# Interactive chat
node src/main.js chat

# List tools
node src/main.js tools
```

---

## 🐛 Troubleshooting

### Installation Issues

**Error: Node.js not found**
- Download from https://nodejs.org/
- Install version 18 or higher
- Restart terminal after installation

**Error: Permission denied**
- Windows: Run as Administrator
- Linux/Mac: Use `sudo` or check file permissions

**Error: npm install fails**
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` folder
- Run `npm install` again

### Runtime Issues

**Error: Port 3000 already in use**
```bash
# Change port in .env file
PORT=3001
```

**Error: Cannot connect to database**
- Check network connectivity
- Verify firewall settings
- Check logs in `~/.james-security/audit.log`

---

## 📊 System Requirements

### Minimum
- **OS**: Windows 10, Ubuntu 20.04, macOS 11+
- **RAM**: 4 GB
- **Disk**: 500 MB free
- **Node.js**: 18.x or higher

### Recommended
- **OS**: Windows 11, Ubuntu 22.04, macOS 13+
- **RAM**: 8 GB or more
- **Disk**: 2 GB free
- **Node.js**: 20.x or higher
- **Internet**: Required for cloud LLM providers

---

## 🔐 Security After Installation

### Immediate Steps

1. **Change default configuration**
   - Review `.env` file
   - Set strong rate limits
   - Configure allowed IPs

2. **Enable firewall**
   ```bash
   # Windows
   netsh advfirewall set allprofiles state on
   
   # Linux
   sudo ufw enable
   sudo ufw allow 3000/tcp
   ```

3. **Review audit logs**
   ```bash
   # Check logs regularly
   tail -f ~/.james-security/audit.log
   ```

---

## 📞 Support

For installation issues:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review `SECURITY.md` for security questions
3. Check GitHub Issues (if using repository)

---

## 🎁 Distribution Package Contents

When sharing CYBERCAT with others, include:

```
CYBERCAT-Distribution/
├── james-ultimate/          # Main platform
│   ├── src/                 # Source code
│   ├── public/              # Web interface
│   ├── install.bat          # Windows installer
│   ├── install.sh           # Linux/Mac installer
│   └── package.json         # Dependencies
├── README.md                # Platform documentation
├── SECURITY.md              # Security guide
├── INSTALLATION_GUIDE.md    # This file
├── INSTALL-CYBERCAT.bat     # One-click Windows installer
└── START-CYBERCAT.bat       # One-click Windows launcher
```

---

**CYBERCAT Platform - Military-Grade Security for Everyone**

*Copyright © 2024 Emersa Ltd. All Rights Reserved.*