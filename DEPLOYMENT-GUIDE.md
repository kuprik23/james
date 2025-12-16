# 🚀 James AI - Production Deployment Guide

**Target Audience:** DevOps Engineers, System Administrators, Senior Engineers  
**Deployment Complexity:** Medium  
**Estimated Time:** 30-60 minutes

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Security Checklist](#security-checklist)
3. [Installation Methods](#installation-methods)
4. [Configuration](#configuration)
5. [Production Deployment](#production-deployment)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Troubleshooting](#troubleshooting)
8. [Performance Tuning](#performance-tuning)

---

## Prerequisites

### System Requirements

**Minimum:**
- CPU: 2 cores @ 2.0 GHz
- RAM: 4 GB
- Disk: 10 GB available
- OS: Windows 10/11, Ubuntu 20.04+, macOS 11+

**Recommended:**
- CPU: 4+ cores @ 2.5+ GHz
- RAM: 8+ GB
- Disk: 20+ GB SSD
- OS: Windows 11, Ubuntu 22.04 LTS, macOS 13+

### Required Software

| Software | Minimum Version | Recommended | Download |
|----------|----------------|-------------|----------|
| **Node.js** | 18.x | 20.x LTS | [nodejs.org](https://nodejs.org/) |
| **Python** | 3.9 | 3.11+ | [python.org](https://python.org/) |
| **npm** | 9.x | 10.x | (included with Node.js) |
| **pip** | 22.x | 24.x | (included with Python) |
| **Git** | 2.30+ | Latest | [git-scm.com](https://git-scm.com/) |

### Network Requirements

- **Inbound:** Ports 3000, 3001, 8000 (configurable)
- **Outbound:** HTTPS (443) for API calls
- **Firewall:** Configure to allow required ports

---

## Security Checklist

### Pre-Deployment Security Review

- [ ] All dependencies updated to latest stable versions
- [ ] No API keys or credentials in source code
- [ ] `.gitignore` properly configured
- [ ] File permissions set correctly (0o600 for .env files)
- [ ] HTTPS enabled (production only)
- [ ] Rate limiting configured
- [ ] Security headers enabled
- [ ] Input validation active
- [ ] Logging configured (no sensitive data)
- [ ] Backup strategy in place

### API Key Security

**CRITICAL:** Never share or commit API keys!

✅ **DO:**
- Store in `.env` files with 0o600 permissions
- Use environment variables
- Rotate keys every 90 days
- Use separate keys for dev/staging/prod
- Enable MFA on provider accounts

❌ **DON'T:**
- Hardcode in source code
- Commit to version control
- Share via email/chat
- Reuse across environments
- Log in plain text

---

## Installation Methods

### Method 1: Automated Installation (Recommended)

**For Windows:**
```bash
# 1. Clone repository
git clone https://github.com/kuprik23/james.git
cd james

# 2. Run installer as Administrator
Right-click INSTALL.bat → Run as Administrator

# 3. Start services
START-ALL.bat

# 4. Configure API keys
CONFIGURE.bat
```

**For Linux/macOS:**
```bash
# 1. Clone repository
git clone https://github.com/kuprik23/james.git
cd james

# 2. Install dependencies
chmod +x install.sh
./install.sh

# 3. Configure
cp langgraph-agent/.env.example langgraph-agent/.env
# Edit .env and add your API keys

# 4. Start services
./start-all.sh
```

### Method 2: Manual Installation

```bash
# Install Node.js dependencies
cd emersa-gui && npm install && cd ..
cd james-ultimate && npm install && cd ..
cd cybercat-standalone && npm install && cd ..
cd digitalocean-mcp && npm install && cd ..
cd system-monitor-mcp && npm install && cd ..
cd cybercat-mcp && npm install && cd ..

# Install Python dependencies
cd langgraph-agent
pip install -r requirements.txt
cd ..

# Configure
cp langgraph-agent/.env.example langgraph-agent/.env
# Edit and add API keys
```

### Method 3: Docker Deployment

```bash
# Build image
docker build -t james-ai:latest -f james-ultimate/Dockerfile .

# Run container
docker run -d \
  -p 3001:3001 \
  -p 8000:8000 \
  -e OPENAI_API_KEY=your_key \
  --name james-ai \
  --restart unless-stopped \
  james-ai:latest

# With Docker Compose
docker-compose up -d
```

---

## Configuration

### Environment Variables

#### LangGraph Agent Configuration
**File:** `langgraph-agent/.env`

```bash
# Required: Choose ONE
OPENAI_API_KEY=sk-your-openai-key-here
# OR
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here

# Optional
HOST=0.0.0.0
PORT=8000
LOG_LEVEL=info
```

#### Digital Ocean Configuration
**File:** `digitalocean-mcp/.env`

```bash
DIGITALOCEAN_API_TOKEN=dop_v1_your-token-here
LOG_LEVEL=info
```

### Port Configuration

| Service | Default Port | Environment Variable | Customizable |
|---------|-------------|---------------------|--------------|
| Emersa GUI | 3001 | `PORT` | ✅ Yes |
| James Ultimate | 3000 | `PORT` | ✅ Yes |
| LangGraph Agent | 8000 | `PORT` | ✅ Yes |

**Example:** Change Emersa GUI port:
```bash
set PORT=8080  # Windows
# or
export PORT=8080  # Linux/macOS
npm start
```

---

## Production Deployment

### Option 1: Cloud Deployment (Digital Ocean)

```bash
# 1. Configure DO token
set DIGITALOCEAN_API_TOKEN=your_token

# 2. Deploy LangGraph Agent
cd langgraph-agent
python deploy-to-digitalocean.py

# 3. Access your deployment
# URL will be provided after deployment
```

### Option 2: Self-Hosted Server

**Ubuntu/Debian:**
```bash
# 1. Install dependencies
sudo apt update
sudo apt install -y nodejs npm python3 python3-pip git

# 2. Clone and install
git clone https://github.com/kuprik23/james.git
cd james
./install.sh

# 3. Configure as systemd service
sudo cp deployment/james-ai.service /etc/systemd/system/
sudo systemctl enable james-ai
sudo systemctl start james-ai

# 4. Configure reverse proxy (nginx)
sudo cp deployment/nginx.conf /etc/nginx/sites-available/james-ai
sudo ln -s /etc/nginx/sites-available/james-ai /etc/nginx/sites-enabled/
sudo systemctl reload nginx
```

### Option 3: Kubernetes Deployment

```bash
# Apply Kubernetes manifests
kubectl apply -f james-ultimate/k8s/

# Check deployment status
kubectl get pods -n james-ai
kubectl get services -n james-ai
kubectl get ingress -n james-ai
```

---

## Monitoring & Maintenance

### Health Checks

**Endpoints:**
```http
GET /api/health              # Main service health
GET http://localhost:3001    # GUI availability
GET http://localhost:8000/health  # LangGraph agent
```

**Automated Monitoring:**
```bash
# Simple health check script
curl -f http://localhost:3001/api/health || exit 1
curl -f http://localhost:8000/health || exit 1
```

### Logging

**Log Locations:**
- Application logs: Console output or configured log files
- Installation logs: `install-log.txt`
- Build logs: `build-log.txt`
- Security events: Look for `[SECURITY]` prefix

**Log Rotation (Linux):**
```bash
# /etc/logrotate.d/james-ai
/var/log/james-ai/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 james james
}
```

### Backup Strategy

**What to Backup:**
1. Configuration files (`.env`)
2. Custom modifications
3. Generated reports (optional)
4. Application logs (for audit)

**Backup Script Example:**
```bash
#!/bin/bash
BACKUP_DIR="/backup/james-ai/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

cp langgraph-agent/.env $BACKUP_DIR/
cp digitalocean-mcp/.env $BACKUP_DIR/ 2>/dev/null
tar -czf $BACKUP_DIR/james-ai-backup.tar.gz \
    emersa-gui/ james-ultimate/ cybercat-standalone/
    
# Encrypt backup
gpg -c $BACKUP_DIR/james-ai-backup.tar.gz
```

### Updates & Patches

```bash
# Update to latest version
git pull origin main

# Reinstall dependencies
npm install  # In each Node.js directory
pip install -r requirements.txt  # In langgraph-agent/

# Restart services
# Windows:
taskkill /F /IM node.exe
START-ALL.bat

# Linux:
sudo systemctl restart james-ai
```

---

## Troubleshooting

### Common Issues

**1. Port Already in Use**
```bash
# Find process using port 3001
netstat -ano | findstr :3001  # Windows
lsof -i :3001  # Linux/macOS

# Kill process or change port
set PORT=8080
npm start
```

**2. API Key Not Working**
```bash
# Verify key format
# OpenAI: Must start with sk-
# Anthropic: Must start with sk-ant-
# Digital Ocean: Must start with dop_v1_

# Check .env file exists and has correct permissions
ls -la langgraph-agent/.env  # Should show -rw------- (600)
```

**3. Dependencies Not Installing**
```bash
# Clear npm cache
npm cache clean --force

# Clear Python cache
pip cache purge

# Reinstall
npm install
pip install -r requirements.txt
```

**4. WebSocket Connection Failed**
```bash
# Check firewall
# Ensure ports 3001 and 8000 are not blocked

# Check if services are running
curl http://localhost:3001/api/health
curl http://localhost:8000/health
```

### Debug Mode

**Enable verbose logging:**
```bash
# Node.js
set DEBUG=*  # Windows
export DEBUG=*  # Linux/macOS

# Python
set LOG_LEVEL=debug
```

---

## Performance Tuning

### Node.js Optimization

```bash
# Increase memory limit
set NODE_OPTIONS=--max-old-space-size=4096

# Enable production mode
set NODE_ENV=production
```

### Python Optimization

```bash
# Use production ASGI server
pip install gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker server:app
```

### Database Optimization (if using)

```bash
# PostgreSQL connection pooling
SQLALCHEMY_POOL_SIZE=20
SQLALCHEMY_MAX_OVERFLOW=40
```

### Caching Strategy

- Use Redis for session storage
- Enable browser caching for static assets
- Implement CDN for global distribution

---

## Security Hardening (Production)

### 1. SSL/TLS Configuration

```nginx
# nginx SSL configuration
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 2. Firewall Rules

**Windows Firewall:**
```powershell
New-NetFirewallRule -DisplayName "James AI GUI" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "James AI API" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
```

**Linux (UFW):**
```bash
sudo ufw allow 3001/tcp
sudo ufw allow 8000/tcp
sudo ufw enable
```

### 3. Process Management

**PM2 (Node.js):**
```bash
# Install PM2
npm install -g pm2

# Start services with PM2
cd emersa-gui
pm2 start npm --name "james-gui" -- start

cd ../james-ultimate
pm2 start src/server.js --name "james-ultimate"

# Save configuration
pm2 save
pm2 startup
```

**Systemd (Linux):**
```ini
# /etc/systemd/system/james-ai.service
[Unit]
Description=James AI Security Platform
After=network.target

[Service]
Type=simple
User=james
WorkingDirectory=/opt/james-ai
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

---

## 📊 Monitoring & Alerting

### Health Monitoring

```bash
# Prometheus metrics (if implemented)
curl http://localhost:3001/metrics

# Custom health check
while true; do
    if ! curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
        echo "Alert: James AI GUI is down!"
        # Send alert (email, Slack, PagerDuty, etc.)
    fi
    sleep 60
done
```

### Log Aggregation

**ELK Stack Integration:**
```bash
# Filebeat configuration
filebeat.inputs:
  - type: log
    enabled: true
    paths:
      - /var/log/james-ai/*.log
    fields:
      app: james-ai
      env: production
```

---

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy James AI

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          ./install.sh
      
      - name: Run tests
        run: |
          npm test
          pytest
      
      - name: Deploy
        env:
          DO_TOKEN: ${{ secrets.DO_TOKEN }}
        run: |
          python langgraph-agent/deploy-to-digitalocean.py
```

---

## 📦 Distribution Package

### Creating Release Package

```bash
# 1. Run production build
BUILD.bat  # Windows
# or
./build.sh  # Linux/macOS

# 2. Verify dist/ directory contents
dir dist\  # Windows
ls -la dist/  # Linux/macOS

# 3. Create ZIP for distribution
# Windows:
Compress-Archive -Path dist\* -DestinationPath james-ai-v2.0-production.zip

# Linux/macOS:
zip -r james-ai-v2.0-production.zip dist/

# 4. Create checksums
certutil -hashfile james-ai-v2.0-production.zip SHA256  # Windows
shasum -a 256 james-ai-v2.0-production.zip  # Linux/macOS
```

### Distribution Checklist

- [ ] All executables built successfully
- [ ] No `.env` files included (only `.env.example`)
- [ ] No `node_modules/` included
- [ ] README and documentation included
- [ ] LICENSE file included
- [ ] Checksums generated
- [ ] Digital signature applied (optional)

---

## 🌐 Cloud Deployment

### Digital Ocean Deployment

**Prerequisites:**
- Digital Ocean account
- API token (`dop_v1_...`)
- Domain name (optional)

**Deployment Steps:**
```bash
# 1. Set API token
set DIGITALOCEAN_API_TOKEN=dop_v1_your_token

# 2. Deploy
cd langgraph-agent
python deploy-to-digitalocean.py

# 3. Configure DNS (if using domain)
# Point A record to droplet IP

# 4. Configure SSL (Let's Encrypt)
sudo certbot --nginx -d your-domain.com
```

### AWS Deployment

```bash
# Using AWS Elastic Beanstalk
eb init james-ai
eb create james-ai-prod
eb deploy

# Using AWS EC2
# 1. Launch instance (Ubuntu 22.04 LTS)
# 2. SSH into instance
# 3. Run installation script
# 4. Configure security groups (ports 3001, 8000, 443)
```

### Azure Deployment

```bash
# Using Azure Web Apps
az webapp create --resource-group james-ai --plan james-ai-plan --name james-ai
az webapp deployment source config-local-git --name james-ai --resource-group james-ai
git remote add azure <git-url>
git push azure main
```

---

## 🔒 Production Security Hardening

### 1. Environment Isolation

```bash
# Create dedicated user
sudo useradd -r -s /bin/false james
sudo chown -R james:james /opt/james-ai

# Run services as non-root
sudo -u james npm start
```

### 2. Secret Management

**Using HashiCorp Vault:**
```bash
# Store secrets in Vault
vault kv put secret/james-ai/openai key=sk-...

# Retrieve in app
export OPENAI_API_KEY=$(vault kv get -field=key secret/james-ai/openai)
```

**Using AWS Secrets Manager:**
```bash
# Store secret
aws secretsmanager create-secret \
  --name james-ai/openai-key \
  --secret-string "sk-..."

# Retrieve in app
aws secretsmanager get-secret-value \
  --secret-id james-ai/openai-key \
  --query SecretString
```

### 3. Network Security

```bash
# Restrict access to specific IPs
# nginx configuration
location / {
    allow 192.168.1.0/24;
    allow 10.0.0.0/8;
    deny all;
    proxy_pass http://localhost:3001;
}
```

---

## 📈 Scaling Considerations

### Horizontal Scaling

```javascript
// Load balancer configuration (nginx)
upstream james_backend {
    least_conn;
    server 127.0.0.1:3001 weight=10 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:3002 weight=10 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:3003 weight=10 max_fails=3 fail_timeout=30s;
}
```

### Vertical Scaling

```bash
# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=8192"

# Increase Python workers
gunicorn -w 8 -k uvicorn.workers.UvicornWorker server:app
```

---

## ✅ Production Readiness Checklist

### Pre-Launch

- [ ] All tests passing
- [ ] Security audit completed
- [ ] Performance testing done
- [ ] Load testing completed
- [ ] Backup system configured
- [ ] Monitoring in place
- [ ] Documentation complete
- [ ] Team training done

### Launch

- [ ] DNS configured
- [ ] SSL certificate installed
- [ ] Firewall rules applied
- [ ] Services started
- [ ] Health checks passing
- [ ] Monitoring active
- [ ] Alerts configured

### Post-Launch

- [ ] Monitor for 24 hours
- [ ] Review logs
- [ ] Check performance metrics
- [ ] Verify backups
- [ ] Document any issues
- [ ] Plan first maintenance window

---

## 🆘 Support & Resources

### Documentation
- Main README: [`README.md`](README.md)
- Standalones Guide: [`STANDALONES-GUIDE.md`](STANDALONES-GUIDE.md)
- Security Audit: [`SECURITY-AUDIT.md`](SECURITY-AUDIT.md)
- Installation Guide: [`INSTALLATION_GUIDE.md`](INSTALLATION_GUIDE.md)

### Community
- GitHub: https://github.com/kuprik23/james
- Issues: https://github.com/kuprik23/james/issues
- Discussions: https://github.com/kuprik23/james/discussions

### Emergency Contacts
- Security Issues: Use GitHub Security Advisory
- Critical Bugs: Open Priority Issue
- Enterprise Support: Contact Emersa Ltd.

---

## 📝 Deployment Verification

After deployment, verify:

```bash
# 1. Services running
curl http://localhost:3001/api/health
curl http://localhost:8000/health

# 2. Database accessible (if applicable)
psql -h localhost -U james -d james_db -c "SELECT 1;"

# 3. API keys working
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Test connection"}'

# 4. Logs generating
tail -f logs/james-ai.log

# 5. WebSocket connections
# Open http://localhost:3001 in browser
# Check browser console for "Connected to CyberCAT server"
```

---

## 🎯 Performance Benchmarks

### Expected Performance

| Metric | Target | Acceptable |
|--------|--------|------------|
| **Page Load Time** | < 2s | < 5s |
| **API Response** | < 100ms | < 500ms |
| **WebSocket Latency** | < 50ms | < 200ms |
| **Scan Duration** | < 30s | < 120s |
| **Memory Usage** | < 500MB | < 1GB |
| **CPU Usage** | < 30% | < 70% |

---

**Deployment Guide Version:** 1.0  
**Last Updated:** December 15, 2025  
**Status:** Production Ready ✅

*This guide is regularly updated. Check GitHub for latest version.*