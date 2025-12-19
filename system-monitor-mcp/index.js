#!/usr/bin/env node

/**
 * System Monitor MCP Server
 * 
 * Provides tools for monitoring website availability and system health.
 * Can check HTTP/HTTPS endpoints, ping hosts, and gather system information.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import ping from 'ping';
import si from 'systeminformation';

// Create server instance
const server = new Server(
  {
    name: 'system-monitor-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Check if a website is accessible via HTTP/HTTPS
 */
async function checkWebsite(url) {
  const startTime = Date.now();
  
  try {
    // Ensure URL has protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'James-AI-Monitor/1.0'
      }
    });
    
    clearTimeout(timeout);
    const responseTime = Date.now() - startTime;
    
    return {
      url: url,
      status: 'online',
      statusCode: response.status,
      statusText: response.statusText,
      responseTime: `${responseTime}ms`,
      headers: {
        server: response.headers.get('server'),
        contentType: response.headers.get('content-type'),
        date: response.headers.get('date')
      },
      ssl: url.startsWith('https://'),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      url: url,
      status: 'offline',
      error: error.name === 'AbortError' ? 'Request timeout (10s)' : error.message,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Ping a host to check network connectivity
 */
async function pingHost(host) {
  try {
    const result = await ping.promise.probe(host, {
      timeout: 5,
      extra: ['-n', '4'] // Windows: 4 pings
    });
    
    return {
      host: host,
      alive: result.alive,
      time: result.time !== 'unknown' ? `${result.time}ms` : 'N/A',
      min: result.min !== 'unknown' ? `${result.min}ms` : 'N/A',
      max: result.max !== 'unknown' ? `${result.max}ms` : 'N/A',
      avg: result.avg !== 'unknown' ? `${result.avg}ms` : 'N/A',
      packetLoss: result.packetLoss || '0%',
      output: result.output,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      host: host,
      alive: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get local system information
 */
async function getSystemInfo() {
  try {
    const [cpu, mem, osInfo, disk, network, processes] = await Promise.all([
      si.cpu(),
      si.mem(),
      si.osInfo(),
      si.fsSize(),
      si.networkInterfaces(),
      si.processes()
    ]);
    
    const cpuLoad = await si.currentLoad();
    
    return {
      os: {
        platform: osInfo.platform,
        distro: osInfo.distro,
        release: osInfo.release,
        arch: osInfo.arch,
        hostname: osInfo.hostname
      },
      cpu: {
        manufacturer: cpu.manufacturer,
        brand: cpu.brand,
        cores: cpu.cores,
        physicalCores: cpu.physicalCores,
        speed: `${cpu.speed} GHz`,
        currentLoad: `${cpuLoad.currentLoad.toFixed(1)}%`
      },
      memory: {
        total: formatBytes(mem.total),
        used: formatBytes(mem.used),
        free: formatBytes(mem.free),
        usedPercent: `${((mem.used / mem.total) * 100).toFixed(1)}%`
      },
      disk: disk.map(d => ({
        fs: d.fs,
        type: d.type,
        size: formatBytes(d.size),
        used: formatBytes(d.used),
        available: formatBytes(d.available),
        usedPercent: `${d.use.toFixed(1)}%`,
        mount: d.mount
      })),
      network: network.filter(n => n.ip4).map(n => ({
        iface: n.iface,
        ip4: n.ip4,
        mac: n.mac,
        type: n.type,
        speed: n.speed ? `${n.speed} Mbps` : 'N/A'
      })),
      processes: {
        all: processes.all,
        running: processes.running,
        blocked: processes.blocked,
        sleeping: processes.sleeping
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get CPU and memory usage
 */
async function getResourceUsage() {
  try {
    const [cpuLoad, mem, cpuTemp] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.cpuTemperature()
    ]);
    
    return {
      cpu: {
        currentLoad: `${cpuLoad.currentLoad.toFixed(1)}%`,
        userLoad: `${cpuLoad.currentLoadUser.toFixed(1)}%`,
        systemLoad: `${cpuLoad.currentLoadSystem.toFixed(1)}%`,
        idleLoad: `${cpuLoad.currentLoadIdle.toFixed(1)}%`,
        temperature: cpuTemp.main ? `${cpuTemp.main}°C` : 'N/A'
      },
      memory: {
        total: formatBytes(mem.total),
        used: formatBytes(mem.used),
        free: formatBytes(mem.free),
        usedPercent: `${((mem.used / mem.total) * 100).toFixed(1)}%`,
        swapTotal: formatBytes(mem.swaptotal),
        swapUsed: formatBytes(mem.swapused)
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Check multiple websites at once
 */
async function checkMultipleWebsites(urls) {
  const results = await Promise.all(urls.map(url => checkWebsite(url)));
  
  const summary = {
    total: results.length,
    online: results.filter(r => r.status === 'online').length,
    offline: results.filter(r => r.status === 'offline').length
  };
  
  return {
    summary,
    results,
    timestamp: new Date().toISOString()
  };
}

/**
 * Format bytes to human readable format
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'check_website',
        description: 'Check if a website is accessible and get response details including status code, response time, and SSL status',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'The URL to check (e.g., google.com or https://example.com)'
            }
          },
          required: ['url']
        }
      },
      {
        name: 'check_multiple_websites',
        description: 'Check multiple websites at once and get a summary of their status',
        inputSchema: {
          type: 'object',
          properties: {
            urls: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of URLs to check'
            }
          },
          required: ['urls']
        }
      },
      {
        name: 'ping_host',
        description: 'Ping a host to check network connectivity and measure latency',
        inputSchema: {
          type: 'object',
          properties: {
            host: {
              type: 'string',
              description: 'The hostname or IP address to ping'
            }
          },
          required: ['host']
        }
      },
      {
        name: 'get_system_info',
        description: 'Get comprehensive information about the local system including OS, CPU, memory, disk, and network',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'get_resource_usage',
        description: 'Get current CPU and memory usage statistics',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      }
    ]
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    let result;
    
    switch (name) {
      case 'check_website':
        result = await checkWebsite(args.url);
        break;
        
      case 'check_multiple_websites':
        result = await checkMultipleWebsites(args.urls);
        break;
        
      case 'ping_host':
        result = await pingHost(args.host);
        break;
        
      case 'get_system_info':
        result = await getSystemInfo();
        break;
        
      case 'get_resource_usage':
        result = await getResourceUsage();
        break;
        
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: error.message,
            tool: name,
            timestamp: new Date().toISOString()
          }, null, 2)
        }
      ],
      isError: true
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('System Monitor MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
