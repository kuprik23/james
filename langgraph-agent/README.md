# 🤖 James AI Security Agent - LangGraph

An AI-powered cybersecurity analysis agent built with LangGraph. This agent can analyze systems, scan networks, check IP reputations, and provide security recommendations.

## 🚀 Quick Start

### Local Installation (Windows)

1. **Run Setup**
   ```batch
   setup.bat
   ```

2. **Configure API Keys**
   Edit `.env` file and add your API key:
   ```
   OPENAI_API_KEY=sk-your-key-here
   # OR
   ANTHROPIC_API_KEY=sk-ant-your-key-here
   ```

3. **Start the Agent**
   ```batch
   run-agent.bat
   ```

4. **Access the API**
   - API Documentation: http://localhost:8000/docs
   - Health Check: http://localhost:8000/health

### Cloud Deployment (Digital Ocean)

1. **Set Digital Ocean Token**
   ```
   DIGITALOCEAN_API_TOKEN=dop_v1_your-token-here
   ```

2. **Deploy**
   ```bash
   python deploy-to-digitalocean.py
   ```

## 📋 Features

### 🔍 Security Analysis Tools

| Tool | Description |
|------|-------------|
| `scan_open_ports` | Scan for open ports on a target host |
| `analyze_system_security` | Analyze system security posture |
| `check_ip_reputation` | Check IP address reputation |
| `analyze_url` | Analyze URLs for threats |
| `get_network_info` | Get network interface information |
| `generate_security_report` | Generate comprehensive security report |

### 🌐 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat` | POST | Chat with the AI agent |
| `/api/scan` | POST | Scan ports on a target |
| `/api/analyze/url` | POST | Analyze a URL |
| `/api/check/ip` | POST | Check IP reputation |
| `/api/system/security` | GET | Get system security analysis |
| `/api/network/info` | GET | Get network information |
| `/api/report` | GET | Generate security report |

## 💬 Chat Examples

### Using the API

```python
import requests

# Chat with the agent
response = requests.post("http://localhost:8000/api/chat", json={
    "message": "Scan my system for security issues"
})
print(response.json()["response"])
```

### Using curl

```bash
# Generate a security report
curl http://localhost:8000/api/report

# Scan ports
curl -X POST http://localhost:8000/api/scan \
  -H "Content-Type: application/json" \
  -d '{"host": "localhost", "port_range": "1-100"}'

# Check IP reputation
curl -X POST http://localhost:8000/api/check/ip \
  -H "Content-Type: application/json" \
  -d '{"ip_address": "8.8.8.8"}'
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Server                           │
│                   (server.py)                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│  │   /api/     │    │  LangGraph  │    │   Tools     │    │
│  │  endpoints  │───▶│   Agent     │───▶│  Executor   │    │
│  └─────────────┘    └─────────────┘    └─────────────┘    │
│                            │                   │           │
│                            ▼                   ▼           │
│                     ┌─────────────┐    ┌─────────────┐    │
│                     │    LLM      │    │  Security   │    │
│                     │ (GPT-4/    │    │   Tools     │    │
│                     │  Claude)    │    │             │    │
│                     └─────────────┘    └─────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 📁 File Structure

```
langgraph-agent/
├── agent.py                 # LangGraph agent implementation
├── server.py                # FastAPI server
├── requirements.txt         # Python dependencies
├── .env.example            # Environment template
├── setup.bat               # Windows setup script
├── run-agent.bat           # Windows run script
├── Dockerfile              # Docker container
├── deploy-to-digitalocean.py  # DO deployment script
└── README.md               # This file
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key | One of these |
| `ANTHROPIC_API_KEY` | Anthropic API key | is required |
| `HOST` | Server host (default: 0.0.0.0) | No |
| `PORT` | Server port (default: 8000) | No |
| `DIGITALOCEAN_API_TOKEN` | DO API token | For cloud deploy |

## 🐳 Docker Deployment

```bash
# Build image
docker build -t james-agent .

# Run container
docker run -d \
  -p 8000:8000 \
  -e OPENAI_API_KEY=your-key \
  --name james-agent \
  james-agent
```

## 🔒 Security Notes

- The agent runs with limited permissions
- Network scans are rate-limited
- No data is sent to external servers (except LLM API)
- All analysis is performed locally

## 🛠️ Development

### Running Tests
```bash
pytest tests/
```

### Adding New Tools
1. Create a new tool function with `@tool` decorator
2. Add to the `tools` list in `agent.py`
3. Update the system prompt if needed

## 📜 License

MIT License

## 🤝 Contributing

Contributions welcome! Please submit issues and pull requests.

---

**James AI Security Agent** - Powered by LangGraph 🔒