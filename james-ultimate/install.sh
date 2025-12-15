#!/bin/bash
################################################################################
# CYBERCAT Platform Installer for Linux/macOS
# Copyright © 2024 Emersa Ltd. All Rights Reserved.
################################################################################

GREEN='\033[0;32m'
CYAN='\033[0;36m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║   ██████╗██╗   ██╗██████╗ ███████╗██████╗  ██████╗ █████╗ ████████╗      ║
║  ██╔════╝╚██╗ ██╔╝██╔══██╗██╔════╝██╔══██╗██╔════╝██╔══██╗╚══██╔══╝      ║
║  ██║      ╚████╔╝ ██████╔╝█████╗  ██████╔╝██║     ███████║   ██║         ║
║  ██║       ╚██╔╝  ██╔══██╗██╔══╝  ██╔══██╗██║     ██╔══██║   ██║         ║
║  ╚██████╗   ██║   ██████╔╝███████╗██║  ██║╚██████╗██║  ██║   ██║         ║
║   ╚═════╝   ╚═╝   ╚═════╝ ╚══════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝   ╚═╝         ║
║                                                                           ║
║              Military-Grade Cybersecurity Platform                       ║
║              Copyright © 2024 Emersa Ltd                                 ║
╚═══════════════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${GREEN}🚀 Installing CYBERCAT Platform...${NC}\n"

# Check for Node.js
echo -e "${CYAN}[1/5] Checking Node.js installation...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found!${NC}"
    echo ""
    echo "Please install Node.js from: https://nodejs.org/"
    echo "Recommended version: 18.x or higher"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node --version) found${NC}\n"

# Check for npm
echo -e "${CYAN}[2/5] Checking npm installation...${NC}"
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ npm $(npm --version) found${NC}\n"

# Install dependencies
echo -e "${CYAN}[3/5] Installing dependencies...${NC}"
echo "This may take a few minutes..."
echo ""
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Installation failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Dependencies installed${NC}\n"

# Create .env file if it doesn't exist
echo -e "${CYAN}[4/5] Configuring environment...${NC}"
if [ ! -f ".env" ]; then
    cat > .env << 'ENVEOF'
# CYBERCAT Platform Configuration
# Copyright © 2024 Emersa Ltd

# Server Configuration
PORT=3000
HOST=0.0.0.0
NODE_ENV=production

# LLM API Keys (Optional - configure later)
# OPENAI_API_KEY=sk-your-key-here
# ANTHROPIC_API_KEY=sk-ant-your-key-here
# GROQ_API_KEY=gsk-your-key-here

# Security Configuration
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX=200
AUTO_BACKUP=true
MALWARE_PROTECTION=true
RANSOMWARE_PROTECTION=true
ENVEOF
    echo -e "${GREEN}✅ Configuration file created${NC}"
else
    echo -e "${GREEN}✅ Configuration file exists${NC}"
fi
echo ""

# Create security directories
echo -e "${CYAN}[5/5] Initializing security system...${NC}"
mkdir -p .quarantine
mkdir -p .ransomware-backup
mkdir -p .honeypot
chmod 700 .quarantine .ransomware-backup .honeypot
echo -e "${GREEN}✅ Security directories created${NC}\n"

echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    ✅ Installation Complete!                              ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}🎉 CYBERCAT Platform is ready to use!${NC}"
echo ""
echo "To start the platform:"
echo "  1. Run: npm run server"
echo "  2. Open browser at: http://localhost:3000"
echo ""
echo "To use CLI mode:"
echo "  Run: node src/main.js"
echo ""
echo -e "${CYAN}📚 Documentation:${NC}"
echo "  - README.md - Complete platform guide"
echo "  - SECURITY.md - Security best practices"
echo ""
echo -e "${GREEN}🛡️  Security Features Active:${NC}"
echo "  ✓ AES-256-GCM Encryption"
echo "  ✓ Anti-Malware Protection"
echo "  ✓ Anti-Ransomware Defense"
echo "  ✓ DDoS Protection"
echo "  ✓ Secure Key Storage"
echo ""