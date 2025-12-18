# 🛡️ James Ultimate - AI-Powered Cybersecurity Platform

The ultimate cybersecurity interface with multi-LLM support, IoT integration, and comprehensive security analysis tools.

## 🚀 Quick Start

### Run with GUI (Recommended)
```batch
run.bat
```
This will start the web server and open the GUI at http://localhost:3000

### Build Standalone Executable
```batch
build.bat
```
Creates `dist/James.exe` that can run anywhere.

## ✨ Features

### 🤖 Multi-LLM Support
Switch between AI providers on the fly:
- **OpenAI** (GPT-4, GPT-3.5, GPT-4o)
- **Anthropic** (Claude 3 Opus, Sonnet, Haiku)
- **Ollama** (Local - Llama, Mistral, CodeLlama, etc.)
- **KoboldAI** (Local - Privacy-focused, Custom models) ⭐ NEW
- **Groq** (Ultra-fast inference)
- **Google** (Gemini)
- **Azure OpenAI**
- **Together AI**
- **OpenRouter**
- **LM Studio** (Local)

**Privacy-First Options:**
- 🔒 **Ollama** - Easy local deployment
- 🔒 **KoboldAI** - Advanced local AI with custom model support
- 🔒 Both run 100% offline with no data sent to cloud

### 🔒 Security Agents
Specialized AI agents for different security tasks:
- **Security Analyst** - Vulnerability assessment and auditing
- **Network Guardian** - Network security and traffic analysis
- **IoT Security** - IoT device security assessment
- **Threat Hunter** - Proactive threat detection
- **Compliance Auditor** - Regulatory compliance
- **Incident Responder** - Security incident handling
- **Code Security** - Application security analysis

### 🔧 Security Tools
- Port Scanner
- System Security Analysis
- Network Analysis
- DNS Lookup
- IP Reputation Check
- URL Analysis
- File Hash Analysis
- Process Analysis
- SSL/TLS Certificate Check
- Password Strength Checker
- Security Report Generator

### 📡 IoT Integration
Connect and manage IoT devices:
- **MQTT** - Message broker protocol
- **CoAP** - Constrained Application Protocol
- **Modbus** - Industrial automation
- **HTTP/REST** - RESTful APIs
- **WebSocket** - Real-time communication
- **Serial Port** - Local device communication
- **Raw TCP/UDP** - Low-level protocols

### 🌐 Web GUI
Modern, responsive web interface with:
- Real-time chat with AI agents
- Security dashboard
- Tool execution
- IoT device management
- LLM provider configuration
- Security reports

## 📋 Commands

### Chat Commands
```
/help              - Show all commands
/agent list        - List available agents
/agent switch <id> - Switch to different agent
/agent info        - Show current agent info
/llm list          - List LLM providers
/llm switch <id>   - Switch LLM provider
/clear             - Clear chat history
/tools             - List security tools
```

### CLI Commands
```bash
# Start web server
james start

# Interactive chat mode
james chat

# Run security scan
james scan
james scan -t system
james scan -t network
james scan -t ports

# List tools
james tools

# List providers
james providers

# List agents
james agents

# Configure settings
james config
```

## 🔧 Configuration

### Environment Variables
Edit `.env` file:

```env
# LLM API Keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GROQ_API_KEY=gsk_...

# Server
PORT=3000
HOST=0.0.0.0

# Ollama (local)
OLLAMA_HOST=http://localhost:11434
```

### Using Ollama (Free, Local)
1. Install Ollama: https://ollama.ai
2. Pull a model: `ollama pull llama2`
3. James will automatically detect Ollama

### Using KoboldAI (Advanced Local AI)
1. Download KoboldCpp: https://github.com/LostRuins/koboldcpp/releases
2. Load your preferred GGUF model (Mistral, CodeLlama, etc.)
3. Start on port 5001 (default)
4. Switch in James: `/llm switch koboldai`
5. See [`KOBOLDAI-INTEGRATION.md`](KOBOLDAI-INTEGRATION.md) for detailed setup

**Why KoboldAI?**
- ✅ Complete privacy and offline operation
- ✅ Custom model support (GGUF, GGML)
- ✅ Fine-tuning capabilities
- ✅ No API costs
- ✅ Community-driven models

## 📁 Project Structure

```
james-ultimate/
├── src/
│   ├── main.js           # CLI entry point
│   ├── server.js         # Express server
│   ├── llm/
│   │   └── provider.js   # Multi-LLM provider system
│   ├── agents/
│   │   └── agent-manager.js  # AI agent management
│   ├── tools/
│   │   └── security-tools.js # Security analysis tools
│   └── iot/
│       └── iot-manager.js    # IoT device management
├── public/
│   └── index.html        # Web GUI
├── config/               # Configuration files
├── .env                  # Environment variables
├── run.bat              # Quick start script
├── build.bat            # Build executable script
└── package.json
```

## 🔌 API Endpoints

### Chat
- `POST /api/chat` - Send message to AI agent
- `GET /api/chat/history` - Get conversation history
- `POST /api/chat/clear` - Clear history

### LLM Providers
- `GET /api/llm/providers` - List providers
- `POST /api/llm/switch` - Switch provider
- `POST /api/llm/key` - Set API key

### Agents
- `GET /api/agents` - List agents
- `POST /api/agents/switch` - Switch agent
- `POST /api/agents/create` - Create custom agent

### Security Tools
- `GET /api/tools` - List tools
- `POST /api/tools/:id/execute` - Execute tool
- `POST /api/scan/ports` - Port scan
- `GET /api/scan/system` - System analysis
- `GET /api/scan/network` - Network analysis
- `GET /api/report` - Generate report

### IoT
- `GET /api/iot/devices` - List devices
- `POST /api/iot/devices` - Register device
- `POST /api/iot/discover` - Discover devices
- `POST /api/iot/api` - Register API

## 🛠️ Requirements

### Core Requirements
- **Node.js 18+** (https://nodejs.org)
- **Java JDK 17+** (for Java security scanner)
- **Apache Maven** (for building Java modules)

### Optional for Full Features
- **Rust** (for high-performance crypto)
- **C++ Compiler** (MSVC/GCC for network scanner)
- **CMake** (for C++ builds)

### Optional AI Providers
- **Ollama** (free, local LLM)
- **KoboldAI/KoboldCpp** (advanced local AI)
- API keys for cloud providers (OpenAI, Anthropic, etc.)

### Quick Setup
Run the automated installer:
```cmd
cd james-ultimate
setup-prerequisites.bat
```

See [`PREREQUISITES-GUIDE.md`](PREREQUISITES-GUIDE.md) for detailed installation.

## 📜 License

MIT License

## 🤝 Contributing

Contributions welcome! Please submit issues and pull requests.

## 📚 Documentation

- **[Quick Start Guide](QUICK-START.md)** - Get up and running in 5 minutes
- **[Prerequisites Guide](PREREQUISITES-GUIDE.md)** - Complete installation guide
- **[Multi-Language Integration](MULTI-LANGUAGE-INTEGRATION.md)** - Architecture details
- **[KoboldAI Integration](KOBOLDAI-INTEGRATION.md)** - Local AI setup
- **[Build Guide](BUILD.md)** - Building from source

## 🏗️ Architecture

James Ultimate uses a **multi-language architecture**:
- **TypeScript/Node.js** - Core application, web server, API
- **Java** - High-performance security scanning
- **Rust** - Ultra-fast cryptographic operations
- **C++** - Low-level network operations

All seamlessly integrated for maximum performance and capability.

---

**James Ultimate** - Your AI-Powered Security Command Center 🛡️