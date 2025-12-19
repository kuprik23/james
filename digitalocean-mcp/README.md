# Digital Ocean MCP Server

Enhanced MCP server for comprehensive Digital Ocean infrastructure management with CYBERCAT Cybersecurity Agent.

## Features

### Droplet Management
- **list_droplets** - List all droplets with optional tag filtering
- **get_droplet** - Get detailed droplet information
- **get_droplet_snapshots** - List all snapshots for a droplet

### Monitoring & Alerts
- **get_droplet_metrics** - Retrieve CPU, memory, bandwidth metrics
  - Supported metrics: cpu, memory_free, memory_available, disk_read, disk_write, bandwidth_inbound, bandwidth_outbound
- **get_droplet_alerts** - List all monitoring alert policies

### Networking
- **list_firewalls** - List all firewalls
- **get_firewall** - Get firewall details and rules
- **list_vpcs** - List all Virtual Private Clouds
- **list_domains** - List all DNS domains
- **get_domain** - Get domain configuration and records

### Load Balancers
- **list_load_balancers** - List all load balancers
- **get_load_balancer** - Get load balancer configuration

### Databases
- **list_databases** - List all managed database clusters
- **get_database** - Get database cluster details

### Storage
- **list_volumes** - List all block storage volumes
- **get_volume** - Get volume details and attachment status

### Account & Projects
- **list_ssh_keys** - List all SSH keys
- **get_account_info** - Get account information and limits
- **list_projects** - List all projects

## Installation

```bash
cd digitalocean-mcp
npm install
```

## Configuration

### Secure Token Storage (Recommended)
Use DPAPI encrypted storage:
```bash
# Store token securely (Windows)
cd security
store-token.bat
```

### Environment Variable
```bash
export DIGITALOCEAN_API_TOKEN=your_token_here
```

### Development (.env file)
```
DIGITALOCEAN_API_TOKEN=your_token_here
LOG_LEVEL=info
```

## Usage

### Starting the Server
```bash
npm start
```

### Example Tool Calls

#### Get Droplet Metrics
```json
{
  "name": "get_droplet_metrics",
  "arguments": {
    "droplet_id": "12345678",
    "metric": "cpu",
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-01-01T23:59:59Z"
  }
}
```

#### List Firewalls
```json
{
  "name": "list_firewalls",
  "arguments": {}
}
```

#### Get Load Balancer
```json
{
  "name": "get_load_balancer",
  "arguments": {
    "lb_id": "abc-123-def"
  }
}
```

## Security Features

- **DPAPI Encryption** - Tokens stored using Windows Data Protection API
- **Environment Variable Support** - Secure runtime configuration
- **Automatic Token Validation** - Verifies token format before use
- **Secure Logging** - Sensitive data never logged

## Error Handling

The server provides detailed error messages:
- **Invalid Token** - Token not configured or invalid format
- **API Errors** - Detailed Digital Ocean API error responses
- **Rate Limiting** - Automatic retry with exponential backoff
- **Network Errors** - Connection and timeout error details

## Integration with CYBERCAT

This MCP server integrates with the CYBERCAT platform to provide:
- Real-time infrastructure monitoring
- Security posture assessment
- Resource utilization tracking
- Network topology analysis
- Automated compliance checking

## API Reference

Full Digital Ocean API documentation: https://docs.digitalocean.com/reference/api/

## License

MIT License - Copyright © 2025 Emersa Ltd.

## Support

For issues and questions:
- GitHub Issues: [CYBERCAT Issues](https://github.com/emersa/james/issues)
- Documentation: [CYBERCAT Docs](https://cybercat.emersa.com/docs)