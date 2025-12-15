# System Monitor MCP Server

An MCP (Model Context Protocol) server for monitoring website availability and system health.

## Features

- **Website Monitoring**: Check if websites are accessible, get response times, status codes, and SSL status
- **Bulk Website Checks**: Monitor multiple websites at once with summary statistics
- **Network Ping**: Ping hosts to check connectivity and measure latency
- **System Information**: Get comprehensive details about CPU, memory, disk, and network
- **Resource Usage**: Monitor real-time CPU and memory usage

## Installation

```bash
cd system-monitor-mcp
npm install
```

## Usage

### Start the server
```bash
npm start
```

### Development mode (auto-restart on changes)
```bash
npm run dev
```

## Available Tools

### 1. check_website
Check if a website is accessible and get response details.

**Parameters:**
- `url` (string, required): The URL to check (e.g., "google.com" or "https://example.com")

**Returns:**
- URL, status (online/offline), status code, response time, SSL status, headers

### 2. check_multiple_websites
Check multiple websites at once and get a summary.

**Parameters:**
- `urls` (array of strings, required): Array of URLs to check

**Returns:**
- Summary (total, online, offline counts) and individual results

### 3. ping_host
Ping a host to check network connectivity.

**Parameters:**
- `host` (string, required): The hostname or IP address to ping

**Returns:**
- Alive status, response time (min/max/avg), packet loss

### 4. get_system_info
Get comprehensive information about the local system.

**Parameters:** None

**Returns:**
- OS details, CPU info, memory usage, disk space, network interfaces, process counts

### 5. get_resource_usage
Get current CPU and memory usage statistics.

**Parameters:** None

**Returns:**
- CPU load (current, user, system, idle), temperature, memory usage, swap usage

## VSCode Integration

This server is configured in `.vscode/mcp.json` for automatic integration with VSCode.

## Example Responses

### Website Check
```json
{
  "url": "https://google.com",
  "status": "online",
  "statusCode": 200,
  "statusText": "OK",
  "responseTime": "245ms",
  "ssl": true,
  "timestamp": "2024-12-15T12:00:00.000Z"
}
```

### System Info
```json
{
  "os": {
    "platform": "win32",
    "distro": "Microsoft Windows 11",
    "hostname": "DESKTOP-XXX"
  },
  "cpu": {
    "brand": "Intel Core i7",
    "cores": 8,
    "currentLoad": "15.2%"
  },
  "memory": {
    "total": "16 GB",
    "used": "8.5 GB",
    "usedPercent": "53.1%"
  }
}
```

## Dependencies

- `@modelcontextprotocol/sdk`: MCP protocol implementation
- `ping`: Network ping functionality
- `systeminformation`: System hardware and software information

## License

MIT