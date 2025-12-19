# CyberCAT Multi-Agent Security Command Center

**v1.0 - Agent-Integrated Security Platform**

CyberCAT is a military-grade cybersecurity command center powered by AI agents, featuring real-time threat detection, multi-agent coordination, and an intuitive terminal interface for comprehensive security operations.

![CyberCAT](https://img.shields.io/badge/CyberCAT-v1.0-00ffcc?style=for-the-badge)
![Security](https://img.shields.io/badge/Security-Military%20Grade-00ff88?style=for-the-badge)
![Agents](https://img.shields.io/badge/Agents-6%20Active-ff00ff?style=for-the-badge)

## ✨ What's New in v1.0

### 🤖 Agent-Integrated Chatbot
- **Direct Agent Commands**: Control individual agents via terminal
- **AI Chat Interface**: Ask questions and get intelligent security recommendations
- **Multi-Agent Coordination**: Orchestrate complex security workflows
- **Real-Time Agent Status**: Monitor all 6 agents simultaneously

### 🔍 Agent Scan Button with EQ Visualizer
- **One-Click Multi-Agent Scan**: Trigger comprehensive security assessment
- **Live EQ Bar Animation**: Visual feedback during agent operations
- **Sequential Agent Activation**: Watch agents coordinate in real-time
- **Status Indicators**: Know exactly what's happening at every moment

### 🛡️ Enhanced Security Features
- **6 Specialized Agents**: Scanner, Analyzer, Defender, Reporter, Hunter, Orchestrator
- **Agent-Specific Commands**: Execute targeted security operations
- **Intelligent Responses**: Context-aware agent feedback and recommendations
- **Coordinated Scanning**: All agents work together for comprehensive coverage

## Features

### 🤖 Multi-Agent System (NEW in v1.0)
- **Scanner Agent** - Network discovery and port scanning
- **Analyzer Agent** - Threat analysis and vulnerability assessment
- **Defender Agent** - Active defense and firewall management
- **Reporter Agent** - Security report generation and compliance
- **Hunter Agent** - Continuous threat hunting and monitoring
- **Orchestrator Agent** - AI chat and agent coordination

### 💬 Chatbot Terminal (NEW in v1.0)
- **Agent Commands**: `agent [name] [command]` - Direct agent control
- **AI Chat**: `ask [question]` - Get security advice from orchestrator
- **Status Checks**: Real-time monitoring of all agents
- **Command History**: Navigate previous commands with arrow keys

### 🎵 EQ Visualizer with Scan (NEW in v1.0)
- **Agent Scan Button**: Prominent scan trigger in EQ bar
- **Live Animation**: Visual feedback during operations
- **Status Display**: Shows idle, scanning, or complete states
- **Multi-Phase Scanning**: Sequential agent coordination

### 🔐 Security Operations
- Full network security scanning
- Port scanning and service detection
- Vulnerability assessment
- SSL/TLS analysis
- Firewall rule management
- Threat hunting and monitoring
- Security report generation

### 🌐 System Integration
- WebSocket real-time communication
- RESTful API endpoints
- Digital Ocean integration
- Secure credential storage
- Multi-platform support

## Installation

```bash
# Navigate to the emersa-gui directory
cd emersa-gui

# Install dependencies
npm install

# Start the server
npm start

# Or for development with auto-reload
npm run dev
```

## Usage

1. Open your browser to `http://localhost:3000`
2. The CyberCAT loading screen will initialize
3. View the three-panel layout: Agents (left), Terminal (center), Results (right)
4. Click the **"🔍 AGENT SCAN"** button in the EQ visualizer for a full security scan
5. Use the terminal to interact with agents and execute commands

### Terminal Commands (v1.0)

```bash
# Agent Commands
agent scanner status           # Check scanner agent
agent defender firewall        # Update firewall rules
agent hunter scan              # Run threat hunting
agent orchestrator status      # Check coordinator

# AI Chat
ask what is the system health  # Get system status
ask should I run a scan        # Security recommendations
ask how do I check threats     # Get help and guidance

# Security Operations
scan                          # Full security scan
quick-scan                    # Quick assessment
port-scan [target]            # Scan specific target
vuln-scan                     # Vulnerability check
threat-hunt                   # Active threat hunting

# System Commands
status                        # System overview
agents                        # List all agents
stats                         # Security statistics
report                        # Generate report
help                          # Show all commands
```

### Agent Scan Button (v1.0)

The **Agent Scan Button** in the EQ visualizer provides one-click access to comprehensive multi-agent security scanning:

1. **Click the Button**: Located in the EQ bar header
2. **Watch Coordination**: All 6 agents activate sequentially
3. **View Progress**: Real-time updates in terminal and progress bar
4. **Review Results**: Complete security assessment with recommendations

### Quick Actions

- 🔍 **Agent Scan** - One-click multi-agent security assessment
- ⚡ **Quick Scan** - Rapid security check
- 🔌 **Port Scan** - Network port analysis
- 🛡️ **Vulnerability Scan** - Find security weaknesses
- 🎯 **Threat Hunt** - Active threat detection
- 🔥 **Firewall** - Firewall status and management
- 📊 **Report** - Generate security reports

## Mobile Support

EMERSA is fully responsive and works on mobile devices:
- Bottom navigation for panel switching
- Touch-friendly controls
- Optimized layouts for smaller screens
- 3D view toggle for immersive experience

## API Endpoints (v1.0)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Server health check |
| `/api/status` | GET | System and agent status |
| `/api/agents` | GET | List all agents |
| `/api/agents/:name/start` | POST | Start specific agent |
| `/api/agents/:name/stop` | POST | Stop specific agent |
| `/api/agents/:name/execute` | POST | Execute agent command ⭐ NEW |
| `/api/agent/chat` | POST | Chat with orchestrator AI ⭐ NEW |
| `/api/scan` | POST | Trigger security scan |
| `/api/stats` | GET | Security statistics |
| `/api/config/api-keys` | GET/POST | API key management |
| `/api/standalone/execute` | POST | Execute standalone tools |
| `/api/system/info` | GET | System information |

## WebSocket Events

The server uses WebSocket for real-time communication:

```javascript
// Message types
{
  type: 'message',    // Chat message
  type: 'command',    // Execute command
  type: 'analyze',    // Run analysis
  type: 'scan'        // Security scan
}
```

## Configuration

### Environment Variables

```bash
PORT=3000                    # Server port
DO_API_TOKEN=your_token     # Digital Ocean API token
```

### Secure Token Storage

EMERSA integrates with the CYBERCAT security system for secure credential storage using Windows DPAPI encryption.

## Architecture

```
emersa-gui/
├── public/
│   ├── index.html      # Main HTML with agent scan button
│   ├── css/
│   │   └── style.css   # Cyberpunk theme with agent styles
│   └── js/
│       └── app.js      # Multi-agent coordination logic
├── server.js           # Express + WebSocket + Agent APIs
├── package.json        # Dependencies
└── README.md           # This documentation (v1.0)
```

## Version History

### v1.0 (December 2024) - Agent Integration Release
- ✨ Added agent-integrated chatbot terminal
- 🔍 Implemented Agent Scan button with EQ visualizer
- 🤖 Created 6 specialized security agents
- 💬 Added AI chat with orchestrator agent
- 📡 New agent command API endpoints
- 🎨 Enhanced cyberpunk UI with agent controls
- 🔐 Multi-agent coordinated scanning

### v0.x (Pre-release)
- Initial CyberCAT interface
- Basic security scanning
- Terminal implementation
- WebSocket communication

## Technologies

- **Frontend**: Three.js, Vanilla JavaScript, CSS3
- **Backend**: Node.js, Express, WebSocket
- **3D**: Three.js with OrbitControls
- **Fonts**: Orbitron, Roboto, JetBrains Mono

## Future Enhancements (v2.0+)

- [ ] LangGraph agent backend integration
- [ ] Real AI model responses (OpenAI, Anthropic)
- [ ] Persistent agent memory and learning
- [ ] Advanced penetration testing automation
- [ ] Custom agent creation and deployment
- [ ] Multi-user collaboration
- [ ] Agent performance analytics
- [ ] Automated threat response

## Credits & Tribute

**CyberCAT v1.0** - Multi-Agent Security Command Center

Built with 💙 by the EMERSA team

Special recognition to:
- **Original Vision**: Cyber Analysis & Threat Detection concept
- **Agent Architecture**: Multi-agent coordination system
- **Interface Design**: Cyberpunk-inspired security UI
- **Development**: CYBERCAT integration framework

*"Protecting the digital realm, one agent at a time"* 🐱

---

## License

MIT License - Copyright © 2024 Emersa Ltd. All Rights Reserved.

---

**CyberCAT v1.0** - *Military Grade Security Monitor with AI Agent Integration*
