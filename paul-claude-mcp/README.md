# 🤖 Paul-Claude MCP Server

AI-powered MCP server that connects Paul to Claude AI for intelligent PC interaction with real-time security scanner data access.

## Features

- **Claude Integration** - Powered by Claude 3.5 Sonnet for intelligent responses
- **Real-time Scanner Data** - Live connection to James Ultimate scanner
- **MCP Protocol** - Standard Model Context Protocol support
- **WebSocket Updates** - Real-time data streaming
- **7 Security Tools** - Comprehensive security analysis capabilities

## Tools Available

1. **get_scanner_status** - Get current scanner statistics
2. **get_scan_results** - Retrieve latest scan results
3. **get_threats** - List detected security threats
4. **run_security_scan** - Execute immediate security scan
5. **get_system_info** - Get current system information
6. **analyze_threat** - AI analysis of specific threats using Claude
7. **get_recommendations** - AI-powered security recommendations

## Installation

```bash
cd paul-claude-mcp
npm install
```

## Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Edit `.env` and add your Anthropic API key:
```env
ANTHROPIC_API_KEY=your_key_here
SCANNER_URL=http://localhost:3000
PORT=3200
```

## Usage

### Start the Server

```bash
npm start
```

Server will be available at: `http://localhost:3200`

### Connect from Web App

```javascript
// Connect via WebSocket
const ws = new WebSocket('ws://localhost:3200');

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Scanner data:', data);
};

// Send chat message
ws.send(JSON.stringify({
    type: 'chat',
    message: 'What threats have been detected?'
}));
```

### Use as MCP Server

```javascript
// Initialize MCP connection
await fetch('http://localhost:3200/initialize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        protocolVersion: '2024-11-05',
        capabilities: { tools: {}, resources: {} }
    })
});

// Call MCP tool
const response = await fetch('http://localhost:3200/tools/call', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        name: 'get_scanner_status',
        arguments: {}
    })
});

const result = await response.json();
console.log(result);
```

## Integration with James Ultimate

This MCP server connects to James Ultimate scanner at `http://localhost:3000` and provides:

- Real-time scanner statistics
- Live threat detection updates
- System security posture
- AI-powered threat analysis
- Security recommendations from Claude

## Architecture

```
┌─────────────────────────────────────────────────────┐
│           Your Web App / Dashboard                  │
│              (React/Vue/Plain JS)                   │
└────────────────┬────────────────────────────────────┘
                 │ WebSocket / HTTP
                 ↓
┌─────────────────────────────────────────────────────┐
│           Paul-Claude MCP Server                    │
│          (This Server - Port 3200)                  │
│                                                      │
│  ┌──────────────┐         ┌──────────────┐         │
│  │   Claude AI  │←────────│  MCP Tools   │         │
│  │  (Analysis)  │         │  (7 tools)   │         │
│  └──────────────┘         └──────────────┘         │
│                                  │                  │
└──────────────────────────────────┼──────────────────┘
                                   │ HTTP
                                   ↓
┌─────────────────────────────────────────────────────┐
│         James Ultimate Scanner                      │
│         (Port 3000)                                 │
│                                                      │
│  Background Scanner │ Java/Rust/C++ │ Security APIs │
└─────────────────────────────────────────────────────┘
```

## Example Queries

### Get Scanner Status
```bash
curl -X POST http://localhost:3200/tools/call \
  -H "Content-Type: application/json" \
  -d '{"name": "get_scanner_status", "arguments": {}}'
```

### Run Security Scan
```bash
curl -X POST http://localhost:3200/tools/call \
  -H "Content-Type: application/json" \
  -d '{"name": "run_security_scan", "arguments": {"type": "port"}}'
```

### Get AI Recommendations
```bash
curl -X POST http://localhost:3200/tools/call \
  -H "Content-Type: application/json" \
  -d '{"name": "get_recommendations", "arguments": {}}'
```

## Real-time Updates

The server automatically syncs scanner data every 5 seconds and broadcasts updates to all connected WebSocket clients.

```javascript
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    if (data.type === 'scanner-update') {
        // Update your UI with fresh scanner data
        updateDashboard(data.data);
    }
};
```

## Security

- API key stored in environment variables
- CORS enabled for cross-origin requests
- Real-time data sanitization
- Rate limiting (coming soon)

## Troubleshooting

### "Claude API key not configured"
Set your Anthropic API key in `.env`:
```env
ANTHROPIC_API_KEY=sk-ant-...
```

### "Scanner not available"
Make sure James Ultimate scanner is running on port 3000:
```bash
cd james-ultimate
npm start
```

### WebSocket connection fails
Check firewall settings and ensure port 3200 is open.

## License

Copyright © 2025 Emersa Ltd. All Rights Reserved.

---

**Paul-Claude MCP - AI-Powered Security Analysis with Real-time Scanner Integration** 🤖🔒
