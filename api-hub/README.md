# 🐱 CyberCAT Hub

**Security & API Command Center** | ✅ **100% TypeScript**

```
    /\_____/\
   /  o   o  \
  ( ==  ^  == )
   )         (
  (           )
 ( (  )   (  ) )
(__(__)___(__)__)
   CYBERCAT v1.0

╔═══════════════════════════════════════════════════════════════╗
║                    CyberCAT Hub                               ║
║           Security & API Command Center                       ║
║                                                               ║
║  🛡️ Security  |  📊 Monitor  |  🔌 API Connector             ║
╚═══════════════════════════════════════════════════════════════╝
```

## Overview

CyberCAT Hub is a unified command center that combines:
- **🐱 CyberCAT** - Military-grade cybersecurity analysis
- **📊 System Monitor** - Real-time system monitoring
- **🔌 API Connector** - Universal REST API integration

All in one beautiful, terminal-style interface.

## ✅ TypeScript Conversion Status

**COMPLETE - 100%** 🎉

All components have been successfully converted to TypeScript:
- ✅ [`server.ts`](src/server.ts:1) - Main server with Express & WebSocket
- ✅ [`api-storage-service.ts`](src/api-storage-service.ts:1) - API configuration management
- ✅ [`logger-service.ts`](src/logger-service.ts:1) - Logging service
- ✅ [`update-service.ts`](src/update-service.ts:1) - Update management
- ✅ [`types.ts`](src/types.ts:1) - TypeScript type definitions

**Benefits:**
- 🔒 Type-safe API handling
- 🐛 Compile-time error detection
- 📚 Better IDE support and autocomplete
- 🔧 Easier maintenance and refactoring

## Features

### 🛡️ Security Analysis (CyberCAT)
- Full security assessments with threat alerts
- Network connection monitoring
- Process analysis and anomaly detection
- User session tracking
- Real-time security status

### 📊 System Monitoring
- CPU, memory, and disk usage
- Operating system information
- Website availability checking
- Network ping functionality

### 🔌 API Connector
- Connect to any REST API
- Multiple authentication methods (Bearer, Basic, API Key)
- Request builder with visual interface
- Request history and logging

## Quick Start

### Development (TypeScript)
```bash
cd api-hub
npm install
npm run dev
```

### Production (Compiled JavaScript)
```bash
cd api-hub
npm install
npm run build
npm start
```

Open http://localhost:3001 in your browser.

### Build Commands
| Command | Description |
|---------|-------------|
| `npm run dev` | Run in development mode with ts-node |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run compiled JavaScript |
| `npm run clean` | Clean build directory |

## Commands

### Security Commands
| Command | Description |
|---------|-------------|
| `security` | 🛡️ Run full security assessment |
| `netstat` | 🌐 Analyze network connections |
| `procs` | ⚙️ Analyze running processes |
| `sessions` | 👤 Check user sessions |

### Monitor Commands
| Command | Description |
|---------|-------------|
| `sysinfo` | 💻 Get system information |
| `website <url>` | 🌍 Check website status |
| `ping <host>` | 📡 Ping a host |

### API Commands
| Command | Description |
|---------|-------------|
| `list` | List all configured APIs |
| `add <name> <url>` | Add a new API |
| `remove <name>` | Remove an API |
| `test <name>` | Test API connection |
| `get <name> [endpoint]` | Make GET request |
| `post <name> <endpoint> [json]` | Make POST request |

### General Commands
| Command | Description |
|---------|-------------|
| `help` | Show all commands |
| `status` | Show hub status |
| `history` | Show request history |
| `clear` | Clear terminal |

## Security Assessment Output

```
🛡️ SECURITY ASSESSMENT
════════════════════════════════════════
Status: SECURE
Time: 2024-12-15T12:00:00.000Z

📊 Summary:
   Connections: 45
   Foreign: 12
   Processes: 234
   Sessions: 1

✅ No security alerts
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   CyberCAT Hub (Port 3001)                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│   │   🐱        │  │    📊       │  │    🔌       │        │
│   │  CyberCAT   │  │   System    │  │    API      │        │
│   │  Security   │  │   Monitor   │  │  Connector  │        │
│   └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│   ┌─────────────────────────────────────────────────────┐  │
│   │              Terminal Interface                      │  │
│   │         Text-based Command Center                    │  │
│   └─────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│   ┌─────────────────────────────────────────────────────┐  │
│   │              WebSocket Server                        │  │
│   │         Real-time Communication                      │  │
│   └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## WebSocket Events

### Client → Server
- `command` - Execute terminal command
- `addApi` - Add API configuration
- `removeApi` - Remove API
- `callApi` - Execute API request
- `callMcpTool` - Execute MCP tool directly

### Server → Client
- `commandResult` - Command execution result
- `mcpResult` - MCP tool result
- `configs` - API configurations
- `mcpServers` - MCP server status

## REST API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/configs` | Get all API configs |
| POST | `/api/configs` | Add API config |
| DELETE | `/api/configs/:name` | Remove API config |
| POST | `/api/call` | Execute API call |
| POST | `/api/command` | Execute command |

## Technology Stack

- **TypeScript** - Type-safe development
- **Node.js** - Runtime environment
- **Express** - Web server framework
- **Socket.IO** - Real-time WebSocket communication
- **Axios** - HTTP client for API calls

## Project Structure

```
api-hub/
├── src/
│   ├── server.ts              # Main server (Express + WebSocket)
│   ├── api-storage-service.ts # API configuration storage
│   ├── logger-service.ts      # Logging service
│   ├── update-service.ts      # Update management
│   └── types.ts               # TypeScript type definitions
├── public/
│   ├── index.html             # Web interface
│   ├── css/style.css          # Styling
│   └── js/app.js              # Client-side logic
├── package.json               # Dependencies
└── tsconfig.json              # TypeScript configuration
```

## License

MIT

---

```
    /\_____/\
   /  o   o  \
  ( ==  ^  == )  "Stay secure, stay vigilant"
   )         (
  (           )
 ( (  )   (  ) )
(__(__)___(__)__)
