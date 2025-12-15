/**
 * CyberCAT Hub - Security & API Command Center
 *
 * Features:
 * - 🐱 CyberCAT Security Analysis
 * - 📊 System Monitoring
 * - 🔌 Universal API Connector
 * - WebSocket real-time communication
 * - Text-based command interface
 */

import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import axios from 'axios';
import cors from 'cors';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// MCP Server processes
const mcpServers = new Map();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// API Configurations storage
const apiConfigs = new Map();
const requestHistory = [];
const MAX_HISTORY = 100;

// Load saved API configs
const configPath = join(__dirname, 'api-configs.json');
if (fs.existsSync(configPath)) {
  try {
    const saved = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    Object.entries(saved).forEach(([name, config]) => {
      apiConfigs.set(name, config);
    });
    console.log(`Loaded ${apiConfigs.size} API configurations`);
  } catch (e) {
    console.error('Error loading API configs:', e.message);
  }
}

// Save API configs
function saveConfigs() {
  const configs = Object.fromEntries(apiConfigs);
  fs.writeFileSync(configPath, JSON.stringify(configs, null, 2));
}

// Create HTTP server
const server = createServer(app);

// WebSocket server
const wss = new WebSocketServer({ server });

// Connected clients
const clients = new Set();

// Broadcast to all clients
function broadcast(message) {
  const data = JSON.stringify(message);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// MCP Server Management
const MCP_SERVERS = {
  cybercat: {
    name: 'CyberCAT',
    description: 'Military-grade Cybersecurity Analysis & Threat Detection',
    path: join(__dirname, '..', 'cybercat-mcp', 'index.js'),
    icon: '🐱',
    tools: [
      'security_assessment',
      'analyze_network',
      'analyze_processes',
      'scan_ports',
      'check_user_sessions',
      'check_security_config',
      'dns_recon'
    ]
  },
  digitalocean: {
    name: 'Digital Ocean',
    description: 'Digital Ocean Infrastructure Management',
    path: join(__dirname, '..', 'digitalocean-mcp', 'index.js'),
    icon: '🌊',
    tools: [
      'list_droplets',
      'get_droplet',
      'list_domains',
      'get_account'
    ]
  },
  'system-monitor': {
    name: 'System Monitor',
    description: 'Website & System Status Monitoring',
    path: join(__dirname, '..', 'system-monitor-mcp', 'index.js'),
    icon: '📊',
    tools: [
      'check_website',
      'check_multiple_websites',
      'ping_host',
      'get_system_info',
      'get_resource_usage'
    ]
  }
};

// Get MCP server status
function getMcpServerStatus() {
  const status = {};
  for (const [id, config] of Object.entries(MCP_SERVERS)) {
    status[id] = {
      ...config,
      available: fs.existsSync(config.path),
      running: mcpServers.has(id)
    };
  }
  return status;
}

// Log request to history
function logRequest(entry) {
  requestHistory.unshift(entry);
  if (requestHistory.length > MAX_HISTORY) {
    requestHistory.pop();
  }
  broadcast({ type: 'log', data: entry });
}

// WebSocket connection handler
wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('Client connected. Total clients:', clients.size);
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'system',
    message: '🐱 Connected to CyberCAT Hub - Security & API Command Center',
    timestamp: new Date().toISOString()
  }));
  
  // Send current API configs
  ws.send(JSON.stringify({
    type: 'configs',
    data: Object.fromEntries(apiConfigs)
  }));
  
  // Send MCP server status
  ws.send(JSON.stringify({
    type: 'mcpServers',
    data: getMcpServerStatus()
  }));
  
  // Handle incoming messages
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());
      await handleWebSocketMessage(ws, data);
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'error',
        message: error.message,
        timestamp: new Date().toISOString()
      }));
    }
  });
  
  ws.on('close', () => {
    clients.delete(ws);
    console.log('Client disconnected. Total clients:', clients.size);
  });
});

// Handle WebSocket messages
async function handleWebSocketMessage(ws, data) {
  const { action, payload } = data;
  
  switch (action) {
    case 'addApi':
      addApiConfig(payload);
      ws.send(JSON.stringify({
        type: 'success',
        message: `API "${payload.name}" added successfully`,
        timestamp: new Date().toISOString()
      }));
      broadcast({ type: 'configs', data: Object.fromEntries(apiConfigs) });
      break;
      
    case 'removeApi':
      apiConfigs.delete(payload.name);
      saveConfigs();
      ws.send(JSON.stringify({
        type: 'success',
        message: `API "${payload.name}" removed`,
        timestamp: new Date().toISOString()
      }));
      broadcast({ type: 'configs', data: Object.fromEntries(apiConfigs) });
      break;
      
    case 'callApi':
      const result = await callApi(payload);
      ws.send(JSON.stringify({
        type: 'response',
        data: result,
        timestamp: new Date().toISOString()
      }));
      break;
      
    case 'testConnection':
      const testResult = await testApiConnection(payload.name);
      ws.send(JSON.stringify({
        type: 'testResult',
        data: testResult,
        timestamp: new Date().toISOString()
      }));
      break;
      
    case 'getHistory':
      ws.send(JSON.stringify({
        type: 'history',
        data: requestHistory,
        timestamp: new Date().toISOString()
      }));
      break;
      
    case 'command':
      const cmdResult = await executeCommand(payload.command);
      ws.send(JSON.stringify({
        type: 'commandResult',
        data: cmdResult,
        timestamp: new Date().toISOString()
      }));
      break;
      
    case 'getMcpServers':
      ws.send(JSON.stringify({
        type: 'mcpServers',
        data: getMcpServerStatus()
      }));
      break;
      
    case 'callMcpTool':
      const mcpResult = await callMcpTool(payload.server, payload.tool, payload.args);
      ws.send(JSON.stringify({
        type: 'mcpResult',
        server: payload.server,
        tool: payload.tool,
        data: mcpResult,
        timestamp: new Date().toISOString()
      }));
      break;
      
    default:
      ws.send(JSON.stringify({
        type: 'error',
        message: `Unknown action: ${action}`,
        timestamp: new Date().toISOString()
      }));
  }
}

// Add API configuration
function addApiConfig(config) {
  const { name, baseUrl, headers, auth } = config;
  apiConfigs.set(name, {
    name,
    baseUrl,
    headers: headers || {},
    auth: auth || null,
    createdAt: new Date().toISOString()
  });
  saveConfigs();
}

// Call an API
async function callApi(params) {
  const { apiName, method = 'GET', endpoint = '', data, headers = {} } = params;
  
  const config = apiConfigs.get(apiName);
  if (!config) {
    throw new Error(`API "${apiName}" not found`);
  }
  
  const url = `${config.baseUrl}${endpoint}`;
  const startTime = Date.now();
  
  try {
    const requestConfig = {
      method,
      url,
      headers: { ...config.headers, ...headers },
      data: method !== 'GET' ? data : undefined,
      params: method === 'GET' ? data : undefined,
      timeout: 30000
    };
    
    // Add authentication
    if (config.auth) {
      if (config.auth.type === 'bearer') {
        requestConfig.headers['Authorization'] = `Bearer ${config.auth.token}`;
      } else if (config.auth.type === 'basic') {
        requestConfig.auth = {
          username: config.auth.username,
          password: config.auth.password
        };
      } else if (config.auth.type === 'apiKey') {
        if (config.auth.in === 'header') {
          requestConfig.headers[config.auth.name] = config.auth.value;
        } else {
          requestConfig.params = requestConfig.params || {};
          requestConfig.params[config.auth.name] = config.auth.value;
        }
      }
    }
    
    const response = await axios(requestConfig);
    const duration = Date.now() - startTime;
    
    const logEntry = {
      id: Date.now(),
      apiName,
      method,
      url,
      status: response.status,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      success: true
    };
    logRequest(logEntry);
    
    return {
      success: true,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      duration: `${duration}ms`
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    
    const logEntry = {
      id: Date.now(),
      apiName,
      method,
      url,
      status: error.response?.status || 'ERROR',
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      success: false,
      error: error.message
    };
    logRequest(logEntry);
    
    return {
      success: false,
      status: error.response?.status,
      statusText: error.response?.statusText,
      error: error.message,
      data: error.response?.data,
      duration: `${duration}ms`
    };
  }
}

// Test API connection
async function testApiConnection(apiName) {
  const config = apiConfigs.get(apiName);
  if (!config) {
    return { success: false, error: `API "${apiName}" not found` };
  }
  
  try {
    const startTime = Date.now();
    const response = await axios.head(config.baseUrl, {
      headers: config.headers,
      timeout: 10000
    });
    const duration = Date.now() - startTime;
    
    return {
      success: true,
      apiName,
      status: response.status,
      latency: `${duration}ms`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      apiName,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Call MCP tool
async function callMcpTool(serverId, toolName, args = {}) {
  const serverConfig = MCP_SERVERS[serverId];
  if (!serverConfig) {
    return { error: `Unknown MCP server: ${serverId}` };
  }
  
  if (!fs.existsSync(serverConfig.path)) {
    return { error: `MCP server not installed: ${serverId}` };
  }
  
  try {
    const result = await executeMcpToolDirect(serverId, toolName, args);
    return result;
  } catch (error) {
    return { error: error.message };
  }
}

// Execute MCP tool directly
async function executeMcpToolDirect(serverId, toolName, args) {
  switch (serverId) {
    case 'system-monitor':
      return await executeSystemMonitorTool(toolName, args);
    case 'cybercat':
      return await executeCyberCatTool(toolName, args);
    default:
      return { error: `Direct execution not supported for ${serverId}` };
  }
}

// Execute System Monitor tools
async function executeSystemMonitorTool(toolName, args) {
  const si = await import('systeminformation');
  const ping = await import('ping');
  
  switch (toolName) {
    case 'get_system_info':
      const [cpu, mem, osInfo, disk] = await Promise.all([
        si.default.cpu(),
        si.default.mem(),
        si.default.osInfo(),
        si.default.fsSize()
      ]);
      return {
        os: { platform: osInfo.platform, distro: osInfo.distro, release: osInfo.release },
        cpu: { brand: cpu.brand, cores: cpu.cores },
        memory: { total: formatBytes(mem.total), used: formatBytes(mem.used), free: formatBytes(mem.free) },
        disk: disk.map(d => ({ mount: d.mount, size: formatBytes(d.size), used: formatBytes(d.used) }))
      };
      
    case 'get_resource_usage':
      const [cpuLoad, memory] = await Promise.all([
        si.default.currentLoad(),
        si.default.mem()
      ]);
      return {
        cpu: { load: `${cpuLoad.currentLoad.toFixed(1)}%` },
        memory: { used: `${((memory.used / memory.total) * 100).toFixed(1)}%` }
      };
      
    case 'check_website':
      const url = args.url || 'https://google.com';
      const startTime = Date.now();
      try {
        const response = await axios.get(url.startsWith('http') ? url : `https://${url}`, { timeout: 10000 });
        return {
          url,
          status: 'online',
          statusCode: response.status,
          responseTime: `${Date.now() - startTime}ms`
        };
      } catch (e) {
        return { url, status: 'offline', error: e.message };
      }
      
    case 'ping_host':
      const host = args.host || '8.8.8.8';
      const result = await ping.default.promise.probe(host);
      return {
        host,
        alive: result.alive,
        time: result.time !== 'unknown' ? `${result.time}ms` : 'N/A'
      };
      
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

// Execute CyberCAT tools
async function executeCyberCatTool(toolName, args) {
  const si = await import('systeminformation');
  
  switch (toolName) {
    case 'analyze_network':
      const connections = await si.default.networkConnections();
      const suspicious = connections.filter(c =>
        c.peerAddress &&
        c.peerAddress !== '127.0.0.1' &&
        c.peerAddress !== '::1' &&
        c.state === 'ESTABLISHED'
      );
      return {
        totalConnections: connections.length,
        established: connections.filter(c => c.state === 'ESTABLISHED').length,
        listening: connections.filter(c => c.state === 'LISTEN').length,
        foreignConnections: suspicious.length,
        topConnections: suspicious.slice(0, 10).map(c => ({
          local: `${c.localAddress}:${c.localPort}`,
          remote: `${c.peerAddress}:${c.peerPort}`,
          process: c.process || 'unknown'
        }))
      };
      
    case 'analyze_processes':
      const processes = await si.default.processes();
      return {
        total: processes.all,
        running: processes.running,
        blocked: processes.blocked,
        topCpu: processes.list.sort((a, b) => b.cpu - a.cpu).slice(0, 5).map(p => ({
          name: p.name,
          pid: p.pid,
          cpu: `${p.cpu.toFixed(1)}%`,
          mem: `${p.mem.toFixed(1)}%`
        })),
        topMem: processes.list.sort((a, b) => b.mem - a.mem).slice(0, 5).map(p => ({
          name: p.name,
          pid: p.pid,
          cpu: `${p.cpu.toFixed(1)}%`,
          mem: `${p.mem.toFixed(1)}%`
        }))
      };
      
    case 'check_user_sessions':
      const users = await si.default.users();
      return {
        activeSessions: users.length,
        sessions: users.map(u => ({
          user: u.user,
          terminal: u.tty,
          ip: u.ip,
          date: u.date,
          time: u.time
        }))
      };
      
    case 'security_assessment':
      const [network, procs, userSessions] = await Promise.all([
        executeCyberCatTool('analyze_network', {}),
        executeCyberCatTool('analyze_processes', {}),
        executeCyberCatTool('check_user_sessions', {})
      ]);
      
      const alerts = [];
      if (network.foreignConnections > 20) {
        alerts.push({ level: 'HIGH', message: `High number of foreign connections: ${network.foreignConnections}` });
      } else if (network.foreignConnections > 10) {
        alerts.push({ level: 'MEDIUM', message: `Elevated foreign connections: ${network.foreignConnections}` });
      }
      if (userSessions.activeSessions > 3) {
        alerts.push({ level: 'LOW', message: `Multiple user sessions detected: ${userSessions.activeSessions}` });
      }
      if (procs.blocked > 5) {
        alerts.push({ level: 'MEDIUM', message: `Blocked processes detected: ${procs.blocked}` });
      }
      
      return {
        status: alerts.some(a => a.level === 'HIGH') ? 'ALERT' :
                alerts.some(a => a.level === 'MEDIUM') ? 'REVIEW_RECOMMENDED' : 'SECURE',
        summary: {
          totalConnections: network.totalConnections,
          foreignConnections: network.foreignConnections,
          totalProcesses: procs.total,
          activeSessions: userSessions.activeSessions
        },
        alerts,
        timestamp: new Date().toISOString()
      };
      
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Execute text command
async function executeCommand(command) {
  const parts = command.trim().split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);
  
  switch (cmd) {
    case 'help':
      return {
        type: 'help',
        commands: [
          { cmd: 'help', desc: 'Show this help message' },
          { cmd: 'list', desc: 'List all configured APIs' },
          { cmd: 'add <name> <baseUrl>', desc: 'Add a new API' },
          { cmd: 'remove <name>', desc: 'Remove an API' },
          { cmd: 'test <name>', desc: 'Test API connection' },
          { cmd: 'call <name> <method> <endpoint>', desc: 'Call an API endpoint' },
          { cmd: 'get <name> <endpoint>', desc: 'GET request to API' },
          { cmd: 'post <name> <endpoint> <json>', desc: 'POST request to API' },
          { cmd: 'history', desc: 'Show request history' },
          { cmd: 'clear', desc: 'Clear the console' },
          { cmd: 'status', desc: 'Show hub status' },
          { cmd: '', desc: '' },
          { cmd: '--- MCP Commands ---', desc: '' },
          { cmd: 'mcp', desc: 'List available MCP servers' },
          { cmd: 'cybercat <tool>', desc: 'Run CyberCAT security tool' },
          { cmd: 'monitor <tool>', desc: 'Run System Monitor tool' },
          { cmd: 'security', desc: 'Run full security assessment' },
          { cmd: 'sysinfo', desc: 'Get system information' },
          { cmd: 'netstat', desc: 'Analyze network connections' },
          { cmd: 'procs', desc: 'Analyze running processes' },
          { cmd: 'sessions', desc: 'Check user sessions' },
          { cmd: 'website <url>', desc: 'Check website status' },
          { cmd: 'ping <host>', desc: 'Ping a host' }
        ]
      };
      
    case 'list':
      return {
        type: 'list',
        apis: Array.from(apiConfigs.values()).map(c => ({
          name: c.name,
          baseUrl: c.baseUrl,
          hasAuth: !!c.auth
        }))
      };
      
    case 'add':
      if (args.length < 2) {
        return { type: 'error', message: 'Usage: add <name> <baseUrl>' };
      }
      addApiConfig({ name: args[0], baseUrl: args[1] });
      return { type: 'success', message: `API "${args[0]}" added` };
      
    case 'remove':
      if (args.length < 1) {
        return { type: 'error', message: 'Usage: remove <name>' };
      }
      if (apiConfigs.has(args[0])) {
        apiConfigs.delete(args[0]);
        saveConfigs();
        return { type: 'success', message: `API "${args[0]}" removed` };
      }
      return { type: 'error', message: `API "${args[0]}" not found` };
      
    case 'test':
      if (args.length < 1) {
        return { type: 'error', message: 'Usage: test <name>' };
      }
      return await testApiConnection(args[0]);
      
    case 'get':
      if (args.length < 1) {
        return { type: 'error', message: 'Usage: get <name> [endpoint]' };
      }
      return await callApi({
        apiName: args[0],
        method: 'GET',
        endpoint: args[1] || ''
      });
      
    case 'post':
      if (args.length < 2) {
        return { type: 'error', message: 'Usage: post <name> <endpoint> [json]' };
      }
      let postData = {};
      if (args[2]) {
        try {
          postData = JSON.parse(args.slice(2).join(' '));
        } catch (e) {
          return { type: 'error', message: 'Invalid JSON data' };
        }
      }
      return await callApi({
        apiName: args[0],
        method: 'POST',
        endpoint: args[1],
        data: postData
      });
      
    case 'call':
      if (args.length < 2) {
        return { type: 'error', message: 'Usage: call <name> <method> [endpoint]' };
      }
      return await callApi({
        apiName: args[0],
        method: args[1].toUpperCase(),
        endpoint: args[2] || ''
      });
      
    case 'history':
      return { type: 'history', data: requestHistory.slice(0, 20) };
      
    case 'status':
      return {
        type: 'status',
        data: {
          uptime: process.uptime(),
          apis: apiConfigs.size,
          clients: clients.size,
          requests: requestHistory.length,
          memory: process.memoryUsage()
        }
      };
      
    case 'clear':
      return { type: 'clear' };
      
    // MCP Commands
    case 'mcp':
      const mcpStatus = getMcpServerStatus();
      return {
        type: 'mcpList',
        servers: Object.entries(mcpStatus).map(([id, s]) => ({
          id,
          name: s.name,
          icon: s.icon,
          description: s.description,
          available: s.available,
          tools: s.tools
        }))
      };
      
    case 'cybercat':
      if (args.length === 0) {
        return {
          type: 'info',
          message: '🐱 CyberCAT Tools:\n• security_assessment - Full security scan\n• analyze_network - Network connections\n• analyze_processes - Process analysis\n• check_user_sessions - Active sessions'
        };
      }
      return await callMcpTool('cybercat', args[0], {});
      
    case 'monitor':
      if (args.length === 0) {
        return {
          type: 'info',
          message: '📊 System Monitor Tools:\n• get_system_info - System details\n• get_resource_usage - CPU/Memory usage\n• check_website <url> - Website status\n• ping_host <host> - Ping host'
        };
      }
      return await callMcpTool('system-monitor', args[0], args[1] ? { url: args[1], host: args[1] } : {});
      
    case 'security':
      return await callMcpTool('cybercat', 'security_assessment', {});
      
    case 'sysinfo':
      return await callMcpTool('system-monitor', 'get_system_info', {});
      
    case 'netstat':
      return await callMcpTool('cybercat', 'analyze_network', {});
      
    case 'procs':
      return await callMcpTool('cybercat', 'analyze_processes', {});
      
    case 'sessions':
      return await callMcpTool('cybercat', 'check_user_sessions', {});
      
    case 'website':
      if (args.length === 0) {
        return { type: 'error', message: 'Usage: website <url>' };
      }
      return await callMcpTool('system-monitor', 'check_website', { url: args[0] });
      
    case 'ping':
      if (args.length === 0) {
        return { type: 'error', message: 'Usage: ping <host>' };
      }
      return await callMcpTool('system-monitor', 'ping_host', { host: args[0] });
      
    default:
      return { type: 'error', message: `Unknown command: ${cmd}. Type "help" for available commands.` };
  }
}

// REST API Routes

// Get all API configs
app.get('/api/configs', (req, res) => {
  res.json(Object.fromEntries(apiConfigs));
});

// Add API config
app.post('/api/configs', (req, res) => {
  try {
    addApiConfig(req.body);
    res.json({ success: true, message: 'API added' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete API config
app.delete('/api/configs/:name', (req, res) => {
  if (apiConfigs.has(req.params.name)) {
    apiConfigs.delete(req.params.name);
    saveConfigs();
    res.json({ success: true, message: 'API removed' });
  } else {
    res.status(404).json({ success: false, error: 'API not found' });
  }
});

// Call API
app.post('/api/call', async (req, res) => {
  try {
    const result = await callApi(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test API connection
app.get('/api/test/:name', async (req, res) => {
  const result = await testApiConnection(req.params.name);
  res.json(result);
});

// Get request history
app.get('/api/history', (req, res) => {
  res.json(requestHistory);
});

// Execute command
app.post('/api/command', async (req, res) => {
  try {
    const result = await executeCommand(req.body.command);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Proxy endpoint for direct API calls
app.all('/proxy/*', async (req, res) => {
  const targetUrl = req.params[0];
  
  try {
    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: { ...req.headers, host: undefined },
      data: req.body,
      params: req.query,
      timeout: 30000
    });
    
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.message,
      data: error.response?.data
    });
  }
});

// Start server
server.listen(PORT, () => {
  console.log('');
  console.log('    /\\_____/\\');
  console.log('   /  o   o  \\');
  console.log('  ( ==  ^  == )');
  console.log('   )         (');
  console.log('  (           )');
  console.log(' ( (  )   (  ) )');
  console.log('(__(__)___(__)__)');
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                    🐱 CyberCAT Hub                            ║');
  console.log('║           Security & API Command Center                       ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`🚀 HTTP Server: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket:   ws://localhost:${PORT}`);
  console.log(`🛡️  Security:   CyberCAT Active`);
  console.log(`📊 Monitor:     System Monitor Active`);
  console.log(` APIs:        ${apiConfigs.size} configured`);
  console.log('');
  console.log('Type "help" for available commands');
  console.log('"Stay secure, stay vigilant" 🐱');
  console.log('');
});