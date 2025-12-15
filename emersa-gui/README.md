# EMERSA AI Workspace

**Simple GUI to Navigate Complex Systems**

EMERSA is a futuristic AI workspace interface built with Three.js for 3D visualization and a comprehensive set of tools for AI-powered analysis, content generation, and system management.

![EMERSA](https://img.shields.io/badge/EMERSA-AI%20Workspace-00ffcc?style=for-the-badge)

## Features

### 🤖 Gen AI Module
- Text generation and content creation
- Code generation in any language
- Image description and analysis
- Multi-model support (GPT-4, Claude, Local LLM)

### 🌳 Ambient / Digital Twin
- Real-time system monitoring
- Connect to remote systems
- Digital twin visualization
- Resource tracking

### 🔗 API Connector
- External service integration
- Digital Ocean management
- Custom API connections
- Webhook support

### 💾 Memory System
- Persistent knowledge base
- Context retention across sessions
- Full-text search
- Export/import capabilities

### 👥 Multi-Agent System
- Deploy specialized AI agents
- Orchestrate complex workflows
- Agent status monitoring
- Task distribution

### 🔐 Security Module
- Penetration testing
- Vulnerability scanning
- SSL/TLS analysis
- Security header checks
- Quantum-proof encryption ready

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
2. The workspace will load with the 3D environment in the background
3. Use the left panel to access different modules (Gen AI, Ambient, API, Memory, etc.)
4. Use the center chat panel to interact with EMERSA
5. View results and outputs in the right panel

### Input Methods

- **Text**: Type in the main input area
- **Files**: Drag & drop or click to upload (images, PDFs, documents, data files)
- **URLs**: Click the link icon to analyze websites
- **Voice**: Click the microphone for voice input

### Quick Actions

- 🔍 **Analyze Website** - Enter a URL for comprehensive analysis
- 📊 **Generate Report** - Create reports from your data
- 🔐 **Security Scan** - Run security assessments
- ✨ **Create Content** - Generate text, code, or other content

## Mobile Support

EMERSA is fully responsive and works on mobile devices:
- Bottom navigation for panel switching
- Touch-friendly controls
- Optimized layouts for smaller screens
- 3D view toggle for immersive experience

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Server health check |
| `/api/droplets` | GET | List Digital Ocean droplets |
| `/api/upload` | POST | Upload files |
| `/api/analyze` | POST | Analyze URL/data |
| `/api/memory` | GET/POST | Memory store operations |
| `/api/memory/search` | GET | Search memory |

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

EMERSA integrates with the James AI security system for secure credential storage using Windows DPAPI encryption.

## Architecture

```
emersa-gui/
├── public/
│   ├── index.html      # Main HTML
│   ├── css/
│   │   └── style.css   # Styles
│   └── js/
│       └── app.js      # Frontend application
├── uploads/            # Uploaded files
├── server.js           # Express + WebSocket server
├── package.json        # Dependencies
└── README.md           # This file
```

## Technologies

- **Frontend**: Three.js, Vanilla JavaScript, CSS3
- **Backend**: Node.js, Express, WebSocket
- **3D**: Three.js with OrbitControls
- **Fonts**: Orbitron, Roboto, JetBrains Mono

## Future Enhancements

- [ ] Real AI model integration (OpenAI, Anthropic)
- [ ] Browser automation (Puppeteer)
- [ ] Email sending capability
- [ ] Advanced penetration testing tools
- [ ] Database persistence
- [ ] User authentication
- [ ] Custom avatar upload (GLB/FBX)

## License

MIT License - See LICENSE file for details.

---

**EMERSA** - *Simple GUI to Navigate Complex Systems*