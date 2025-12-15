# James - AI Cybersecurity Analyst Agent

## Overview

James is an intelligent cybersecurity analyst agent designed to represent your company's security posture and implement best-practice cybersecurity strategies through automated analysis, recommendations, and reporting.

## Core Functionality

### 🔍 Cybersecurity Analysis
James acts as a dedicated cybersecurity analyst that:
- **Continuously monitors** your infrastructure and security posture
- **Asks intelligent questions** to understand your security requirements
- **Collects and analyzes data** from various sources to identify vulnerabilities
- **Recommends best practices** tailored to your organization's needs

### 🤖 Autonomous Agent Capabilities
As an autonomous agent, James:
- **Implements security strategies** based on collected data and analysis
- **Generates comprehensive reports** detailing findings and recommendations
- **Sends automated email notifications** to designated parties
- **Takes proactive measures** to enhance security posture

### 📊 Reporting & Communication
- Automated email reports to stakeholders
- Real-time security alerts and notifications
- Detailed analysis of security vulnerabilities
- Actionable recommendations with priority levels

## Architecture

### MCP Server Integration
James utilizes Model Context Protocol (MCP) servers to:
- **Digital Ocean Integration**: Connect with Digital Ocean infrastructure for deployment and monitoring
- **Cloud Resource Management**: Automated provisioning and security configuration
- **Infrastructure Monitoring**: Real-time tracking of cloud resources and security events

### Technology Stack
- **Python 3.13.9**: Core agent logic and automation
- **MCP Protocol**: Server communication and integration
- **Digital Ocean API**: Cloud infrastructure management
- **Email Integration**: Automated reporting system

## Features

### 🛡️ Security Best Practices
- Vulnerability assessment and scanning
- Compliance monitoring and reporting
- Security policy enforcement
- Incident response automation

### 📈 Data Collection & Analysis
- Log aggregation and analysis
- Threat intelligence gathering
- Security metrics tracking
- Trend analysis and forecasting

### 🔐 Proactive Security
- Automated patch management recommendations
- Configuration hardening suggestions
- Access control optimization
- Security awareness insights

## Setup Status

### Current Installation Progress
- ✅ **Python 3.13.9** - Installed and verified
- ✅ **Git** - Installed and configured
- ✅ **GitHub Connection** - Connected to https://github.com/kuprik23/james.git
- ✅ **Node.js v24.11.1** - Installed and verified
- ✅ **npm v11.6.2** - Installed and verified
- ✅ **Digital Ocean MCP Server** - Created and dependencies installed
- ✅ **Emersa GUI** - Web interface created
- 🔄 **Digital Ocean API Token** - Configuration pending (optional)

### Next Steps
1. **Configure API Token** - Run `security\store-token.bat` when ready
2. **Test MCP Server** - Run `cd digitalocean-mcp && npm start`
3. **Start Web Interface** - Run `cd emersa-gui && npm start`

## Getting Started

### Prerequisites
- **Python 3.13.9 or higher** ✅ (Installed)
- **Git for version control** ✅ (Installed)
- **Node.js/npm** (Download: https://nodejs.org/en/download)
- **Digital Ocean account and API token**
- **Email service configuration (SMTP)**

### Installation Instructions

#### 1. Install Required Tools

**Git for Windows:** ✅ Completed
1. Download from https://git-scm.com/download/win
2. Run the installer
3. Select "Git from the command line and also from 3rd-party software"
4. Complete installation
5. **Important**: Restart VSCode/terminal after installation

**Node.js for Windows:**
1. Download from https://nodejs.org/en/download
2. Run the .msi installer
3. Follow the installation wizard (use default settings)
4. **Important**: Restart VSCode/terminal after installation

#### 2. Verify Installations
```bash
# Check Python version
python --version
# Should output: Python 3.13.9

# Check Git version
git --version
# Should output: git version 2.x.x

# Check Node.js and npm versions
node --version
npm --version
```

#### 3. Clone and Setup Repository
```bash
# Configure Git
git config --global user.name "kuprik23"
git config --global user.email "martkrupik@gmail.com"

# Clone the repository
git clone https://github.com/kuprik23/james.git
cd james

# Install Python dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your credentials
```

### Configuration
1. Set up Digital Ocean API credentials
2. Configure email settings for reporting
3. Define stakeholder email addresses
4. Customize security policies and thresholds

## MCP Server Setup

James includes an MCP server for Digital Ocean integration:

```bash
# Install MCP server dependencies
pip install mcp

# Configure Digital Ocean MCP server
python setup_mcp_server.py
```

## Usage

### Running the Agent
```bash
# Start James agent
python james_agent.py

# Run in background mode
python james_agent.py --daemon
```

### Manual Analysis
```bash
# Trigger security scan
python james_agent.py --scan

# Generate report
python james_agent.py --report
```

## Reporting

James automatically generates and sends reports to designated parties:
- **Daily Summary**: Overview of security posture
- **Weekly Analysis**: Detailed vulnerability assessment
- **Incident Alerts**: Real-time notifications for critical issues
- **Monthly Reports**: Comprehensive security metrics and trends

## Roadmap

- [ ] Enhanced threat intelligence integration
- [ ] Machine learning-based anomaly detection
- [ ] Multi-cloud support (AWS, Azure, GCP)
- [ ] Advanced compliance frameworks (SOC 2, ISO 27001)
- [ ] Interactive dashboard for real-time monitoring
- [ ] Integration with SIEM platforms

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

## License

[Specify your license here]

## Contact

For questions or support, please contact the development team.

---

**Note**: This project is under active development. Features and documentation are continuously being updated.
