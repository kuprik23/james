# Security Analyst MCP Server

AI-powered Security Analyst agent providing threat detection, risk assessment, and security analysis capabilities for CYBERCAT platform.

## Features

### Threat Analysis
- **analyze_threat** - Analyze threat indicators (IP, domain, hash, URL)
- **identify_ttp** - Identify Tactics, Techniques, and Procedures from attack patterns
- **track_ioc** - Track Indicators of Compromise across systems

### Risk Assessment
- **assess_risk** - Comprehensive security risk assessment
- **recommend_mitigation** - Generate mitigation strategies based on threat severity

### Event Correlation
- **correlate_events** - Correlate security events to identify attack patterns
- **analyze_logs** - Analyze security logs for anomalies

### Reporting
- **generate_report** - Generate comprehensive security analysis reports

## Installation

```bash
cd james-ultimate/agents-mcp/security-analyst-mcp
npm install
```

## Usage

```bash
npm start
```

## Tool Examples

### Analyze Threat
```json
{
  "name": "analyze_threat",
  "arguments": {
    "indicator": "192.168.1.100",
    "type": "ip"
  }
}
```

### Identify TTP
```json
{
  "name": "identify_ttp",
  "arguments": {
    "attackPattern": "Suspicious PowerShell execution followed by network connections"
  }
}
```

### Recommend Mitigation
```json
{
  "name": "recommend_mitigation",
  "arguments": {
    "threat": "Ransomware detected",
    "severity": "critical"
  }
}
```

## Integration

This MCP server integrates with CYBERCAT's security analysis pipeline to provide:
- Real-time threat intelligence
- Automated risk assessment
- Security event correlation
- Incident analysis and reporting

## License

MIT License - Copyright © 2025 Emersa Ltd.