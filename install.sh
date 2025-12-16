#!/bin/bash

# ============================================
# CyberCAT Security Platform - Master Installer
# For Linux and macOS
# ============================================

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Print banner
clear
echo -e "${CYAN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║      /\_____/\                                                ║
║     /  o   o  \     CYBERCAT v2.0                            ║
║    ( ==  ^  == )    Master Installer                          ║
║     )         (     ═══════════════════════════════════      ║
║    (           )                                              ║
║   ( (  )   (  ) )   Setting up your security system...       ║
║  (__(__)___(__)__)                                            ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"
echo -e "${GREEN}Starting CyberCAT installation...${NC}\n"

# Create log file
LOGFILE="$PWD/install-log.txt"
echo "CyberCAT Security Platform Installation Log" > "$LOGFILE"
echo "Started: $(date)" >> "$LOGFILE"
echo "" >> "$LOGFILE"

# ============================================
# Step 1: Check Prerequisites
# ============================================
echo -e "${CYAN}[1/7] Checking prerequisites...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

PREREQ_OK=1

# Check Node.js
echo -n "Checking Node.js installation... "
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Found: $NODE_VERSION${NC}"
    echo "Node.js: $NODE_VERSION" >> "$LOGFILE"
else
    echo -e "${RED}✗ NOT FOUND${NC}"
    echo "Please install Node.js from: https://nodejs.org/"
    echo "Recommended version: 18.x or higher"
    PREREQ_OK=0
fi

# Check Python
echo -n "Checking Python installation... "
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}✓ Found: $PYTHON_VERSION${NC}"
    echo "Python: $PYTHON_VERSION" >> "$LOGFILE"
elif command -v python &> /dev/null; then
    PYTHON_VERSION=$(python --version)
    echo -e "${GREEN}✓ Found: $PYTHON_VERSION${NC}"
    echo "Python: $PYTHON_VERSION" >> "$LOGFILE"
else
    echo -e "${RED}✗ NOT FOUND${NC}"
    echo "Please install Python from: https://www.python.org/"
    echo "Recommended version: 3.9 or higher"
    PREREQ_OK=0
fi

# Check npm
echo -n "Checking npm installation... "
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✓ Found: $NPM_VERSION${NC}"
    echo "npm: $NPM_VERSION" >> "$LOGFILE"
else
    echo -e "${RED}✗ NOT FOUND${NC}"
    echo "npm should come with Node.js"
    PREREQ_OK=0
fi

# Check pip
echo -n "Checking pip installation... "
if command -v pip3 &> /dev/null; then
    PIP_VERSION=$(pip3 --version)
    echo -e "${GREEN}✓ Found: $PIP_VERSION${NC}"
    echo "pip: $PIP_VERSION" >> "$LOGFILE"
elif command -v pip &> /dev/null; then
    PIP_VERSION=$(pip --version)
    echo -e "${GREEN}✓ Found: $PIP_VERSION${NC}"
    echo "pip: $PIP_VERSION" >> "$LOGFILE"
else
    echo -e "${RED}✗ NOT FOUND${NC}"
    echo "pip should come with Python"
    PREREQ_OK=0
fi

if [ $PREREQ_OK -eq 0 ]; then
    echo ""
    echo -e "${RED}[✗] Prerequisites check FAILED${NC}"
    echo -e "${RED}[✗] Please install missing software and run this installer again${NC}"
    echo ""
    exit 1
fi

echo ""
echo -e "${GREEN}[√] All prerequisites found!${NC}"
echo ""
read -p "Press Enter to continue..."

# ============================================
# Step 2: Install Node.js Dependencies
# ============================================
echo -e "\n${CYAN}[2/7] Installing Node.js dependencies...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

install_node_deps() {
    local dir=$1
    echo "Installing $dir dependencies..."
    cd "$dir"
    npm install --production --no-audit
    cd ..
}

install_node_deps "emersa-gui"
install_node_deps "james-ultimate"
install_node_deps "cybercat-standalone"
install_node_deps "digitalocean-mcp"
install_node_deps "system-monitor-mcp"
install_node_deps "cybercat-mcp"

echo ""
echo -e "${GREEN}[√] Node.js dependencies installed successfully!${NC}"
echo ""

# ============================================
# Step 3: Install Python Dependencies
# ============================================
echo -e "${CYAN}[3/7] Installing Python dependencies...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd langgraph-agent
if command -v pip3 &> /dev/null; then
    pip3 install -r requirements.txt
else
    pip install -r requirements.txt
fi
cd ..

echo ""
echo -e "${GREEN}[√] Python dependencies installed successfully!${NC}"
echo ""

# ============================================
# Step 4: Create Configuration Files
# ============================================
echo -e "${CYAN}[4/7] Creating configuration files...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Create .env files from examples if they don't exist
if [ ! -f "langgraph-agent/.env" ]; then
    echo "Creating langgraph-agent/.env..."
    cp "langgraph-agent/.env.example" "langgraph-agent/.env"
    chmod 600 "langgraph-agent/.env"  # Secure permissions
    echo -e "${GREEN}[√] Created langgraph-agent/.env${NC}"
else
    echo -e "${GREEN}[√] langgraph-agent/.env already exists${NC}"
fi

if [ ! -f "digitalocean-mcp/.env" ]; then
    echo "Creating digitalocean-mcp/.env..."
    cp "digitalocean-mcp/.env.example" "digitalocean-mcp/.env"
    chmod 600 "digitalocean-mcp/.env"  # Secure permissions
    echo -e "${GREEN}[√] Created digitalocean-mcp/.env${NC}"
else
    echo -e "${GREEN}[√] digitalocean-mcp/.env already exists${NC}"
fi

echo ""
echo -e "${GREEN}[√] Configuration files created!${NC}"
echo ""

# ============================================
# Step 5: Create Start Scripts
# ============================================
echo -e "${CYAN}[5/7] Creating startup scripts...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Create start-all.sh
cat > start-all.sh << 'EOFSCRIPT'
#!/bin/bash
echo "Starting CyberCAT Security System..."
echo ""

# Start services in background
cd emersa-gui && PORT=3001 npm start &
sleep 2
cd ../james-ultimate && node src/server.js &
sleep 2
cd ../langgraph-agent && python3 server.py &

echo ""
echo "══════════════════════════════════════════════════════"
echo " CyberCAT Security System is starting..."
echo "══════════════════════════════════════════════════════"
echo ""
echo " > Emersa GUI: http://localhost:3001"
echo " > James Ultimate: Running in background"
echo " > LangGraph Agent: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for user interrupt
wait
EOFSCRIPT

chmod +x start-all.sh
echo -e "${GREEN}[√] Created start-all.sh${NC}"

# Create start-gui.sh
cat > start-gui.sh << 'EOFSCRIPT'
#!/bin/bash
cd emersa-gui
PORT=3001 npm start
EOFSCRIPT

chmod +x start-gui.sh
echo -e "${GREEN}[√] Created start-gui.sh${NC}"

echo ""
echo -e "${GREEN}[√] Startup scripts created!${NC}"
echo ""

# ============================================
# Step 6: Set Permissions
# ============================================
echo -e "${CYAN}[6/7] Setting secure file permissions...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Secure .env files
find . -name ".env" -type f -exec chmod 600 {} \;
echo -e "${GREEN}[√] Secured .env files (600)${NC}"

# Make scripts executable
find . -name "*.sh" -type f -exec chmod +x {} \;
echo -e "${GREEN}[√] Made scripts executable${NC}"

echo ""

# ============================================
# Step 7: Final Configuration
# ============================================
echo -e "${CYAN}[7/7] Final configuration...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Checking API key configuration..."
if [ -f "langgraph-agent/.env" ]; then
    if ! grep -q "OPENAI_API_KEY=sk-" "langgraph-agent/.env" && \
       ! grep -q "ANTHROPIC_API_KEY=sk-ant-" "langgraph-agent/.env"; then
        echo ""
        echo -e "${YELLOW}[!] WARNING: No API keys configured for LangGraph Agent${NC}"
        echo -e "${YELLOW}[!] You'll need to configure API keys to use the AI features${NC}"
        echo ""
        echo "To configure API keys:"
        echo "1. Edit langgraph-agent/.env"
        echo "2. Add one of these:"
        echo "   OPENAI_API_KEY=your_key_here"
        echo "   ANTHROPIC_API_KEY=your_key_here"
        echo ""
    fi
fi

# ============================================
# Installation Complete!
# ============================================
echo ""
echo -e "${CYAN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║      /\_____/\                                                ║
║     /  o   o  \     INSTALLATION COMPLETE!                   ║
║    ( ==  ^  == )    ═════════════════════════════════        ║
║     )         (                                               ║
║    (           )    CyberCAT is ready to protect!            ║
║   ( (  )   (  ) )                                             ║
║  (__(__)___(__)__)                                            ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${GREEN}Installation Summary:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}[√]${NC} All dependencies installed"
echo -e "${GREEN}[√]${NC} Configuration files created"
echo -e "${GREEN}[√]${NC} Startup scripts ready"
echo ""

echo "Quick Start Guide:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. To start ALL services:"
echo "   ./start-all.sh"
echo ""
echo "2. To start GUI only:"
echo "   ./start-gui.sh"
echo ""
echo "3. To configure API keys:"
echo "   nano langgraph-agent/.env"
echo "   # or"
echo "   vi langgraph-agent/.env"
echo ""

echo "Access Points:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " > CyberCAT Web Interface: http://localhost:3001"
echo " > LangGraph API: http://localhost:8000/docs"
echo ""

echo "Documentation:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " > README.md - Full documentation"
echo " > STANDALONES-GUIDE.md - Standalone tools guide"
echo " > SECURITY-AUDIT.md - Security certification"
echo " > DEPLOYMENT-GUIDE.md - Production deployment"
echo " > install-log.txt - Installation log"
echo ""

echo "For support: https://github.com/kuprik23/james"
echo ""
echo "Installation log saved to: $LOGFILE"
echo "Completed: $(date)" >> "$LOGFILE"

echo -e "\n${GREEN}Installation complete! Run ./start-all.sh to begin.${NC}\n"