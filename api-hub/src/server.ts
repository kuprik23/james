/**
 * CyberCAT Hub - Security & API Command Center
 * TypeScript Edition with Enhanced Security
 *
 * Features:
 * - 🐱 CyberCAT Security Analysis
 * - 📊 System Monitoring
 * - 🔌 Universal API Connector with Encrypted Storage
 * - WebSocket real-time communication
 * - Text-based command interface
 * - Comprehensive logging and update management
 * 
 * Copyright © 2025 Emersa Ltd. All Rights Reserved.
 */

import express, { Request, Response, NextFunction } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import axios, { AxiosRequestConfig } from 'axios';
import cors from 'cors';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { spawn, ChildProcess } from 'child_process';
import si from 'systeminformation';
import ping from 'ping';
import { promisify } from 'util';
import { exec } from 'child_process';
import dns from 'dns';
import logger from './logger-service.js';
import updateService from './update-service.js';
import apiStorage from './api-storage-service.js';
import type {
  ApiConfig,
  ApiCallParams,
  ApiCallResult,
  TestConnectionResult,
  McpServerConfig,
  McpServerStatus,
  WebSocketMessage,
  ExtendedWebSocket
} from './types.js';

const execAsync = promisify(exec);
const dnsResolve = promisify(dns.resolve);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// MCP Server processes
const mcpServers = new Map<string, ChildProcess>();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, '..', 'public')));

// API Configurations storage
const apiConfigs = new Map<string, ApiConfig>();
const requestHistory: any[] = [];
const MAX_HISTORY = 100;

// Load saved API configs
const configPath = join(__dirname, '..', 'api-configs.json');
if (fs.existsSync(configPath)) {
  try {
    const saved = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    Object.entries(saved).forEach(([name, config]) => {
      apiConfigs.set(name, config as ApiConfig);
    });
    logger.info(`Loaded ${apiConfigs.size} API configurations`, undefined, 'STARTUP');
  } catch (e) {
    logger.error('Error loading API configs', { error: (e as Error).message }, 'STARTUP');
  }
}

// Save API configs
function saveConfigs(): void {
  const configs = Object.fromEntries(apiConfigs);
  fs.writeFileSync(configPath, JSON.stringify(configs, null, 2));
}

// Create HTTP server
const server = createServer(app);

// WebSocket server
const wss = new WebSocketServer({ server });

// Connected clients
const clients = new Set<ExtendedWebSocket>();

// Broadcast to all clients
function broadcast(message: any): void {
  const data = JSON.stringify(message);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// MCP Server Management
const MCP_SERVERS: Record<string, McpServerConfig> = {
  cybercat: {
    name: 'CyberCAT',
    description: 'Military-grade Cybersecurity Analysis & Threat Detection',
    path: join(__dirname, '..', '..', 'cybercat-mcp', 'dist', 'index.js'),
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
    path: join(__dirname, '..', '..', 'digitalocean-mcp', 'index.js'),
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
    path: join(__dirname, '..', '..', 'system-monitor-mcp', 'dist', 'index.js'),
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
function getMcpServerStatus(): Record<string, McpServerStatus> {
  const status: Record<string, McpServerStatus> = {};
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
function logRequest(entry: any): void {
  requestHistory.unshift(entry);
  if (requestHistory.length > MAX_HISTORY) {
    requestHistory.pop();
  }
  broadcast({ type: 'log', data: entry });
}

// WebSocket connection handler
wss.on('connection', (ws: ExtendedWebSocket) => {
  clients.add(ws);
  logger.info('Client connected', { totalClients: clients.size }, 'WebSocket');
  
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
  ws.on('message', async (message: Buffer) => {
    try {
      const data: WebSocketMessage = JSON.parse(message.toString());
      await handleWebSocketMessage(ws, data);
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'error',
        message: (error as Error).message,
        timestamp: new Date().toISOString()
      }));
    }
  });
  
  ws.on('close', () => {
    clients.delete(ws);
    logger.info('Client disconnected', { totalClients: clients.size }, 'WebSocket');
  });
});

// Handle WebSocket messages
async function handleWebSocketMessage(ws: ExtendedWebSocket, data: WebSocketMessage): Promise<void> {
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
function addApiConfig(config: any): void {
  const { name, baseUrl, headers, auth } = config;
  apiConfigs.set(name, {
    name,
    baseUrl,
    headers: headers || {},
    auth: auth || null,
    createdAt: new Date().toISOString()
  });
  saveConfigs();
  logger.info(`API added: ${name}`, { baseUrl }, 'API');
}

// Call an API
async function callApi(params: ApiCallParams): Promise<ApiCallResult> {
  const { apiName, method = 'GET', endpoint = '', data, headers = {} } = params;
  
  const config = apiConfigs.get(apiName);
  if (!config) {
    throw new Error(`API "${apiName}" not found`);
  }
  
  const url = `${config.baseUrl}${endpoint}`;
  const startTime = Date.now();
  
  try {
    const requestConfig: AxiosRequestConfig = {
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
        requestConfig.headers!['Authorization'] = `Bearer ${config.auth.token}`;
      } else if (config.auth.type === 'basic') {
        requestConfig.auth = {
          username: config.auth.username!,
          password: config.auth.password!
        };
      } else if (config.auth.type === 'apiKey') {
        if (config.auth.in === 'header') {
          requestConfig.headers![config.auth.name!] = config.auth.value!;
        } else {
          requestConfig.params = requestConfig.params || {};
          requestConfig.params[config.auth.name!] = config.auth.value!;
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
    logger.info(`API call successful: ${method} ${url}`, { status: response.status, duration: `${duration}ms` }, 'API');
    
    return {
      success: true,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      duration: `${duration}ms`
    };
  } catch (error: any) {
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
    logger.error(`API call failed: ${method} ${url}`, { error: error.message }, 'API');
    
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
async function testApiConnection(apiName: string): Promise<TestConnectionResult> {
  const config = apiConfigs.get(apiName);
  if (!config) {
    return { success: false, error: `API "${apiName}" not found`, timestamp: new Date().toISOString() };
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
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    };
  }
}

// Call MCP tool
async function callMcpTool(serverId: string, toolName: string, args: any = {}): Promise<any> {
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
    return { error: (error as Error).message };
  }
}

// Execute MCP tool directly
async function executeMcpToolDirect(serverId: string, toolName: string, args: any): Promise<any> {
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
async function executeSystemMonitorTool(toolName: string, args: any): Promise<any> {
  switch (toolName) {
    case 'get_system_info':
      const [cpu, mem, osInfo, disk] = await Promise.all([
        si.cpu(),
        si.mem(),
        si.osInfo(),
        si.fsSize()
      ]);
      return {
        os: { platform: osInfo.platform, distro: osInfo.distro, release: osInfo.release },
        cpu: { brand: cpu.brand, cores: cpu.cores },
        memory: { total: formatBytes(mem.total), used: formatBytes(mem.used), free: formatBytes(mem.free) },
        disk: disk.map(d => ({ mount: d.mount, size: formatBytes(d.size), used: formatBytes(d.used) }))
      };
      
    case 'get_resource_usage':
      const [cpuLoad, memory] = await Promise.all([
        si.currentLoad(),
        si.mem()
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
        return { url, status: 'offline', error: (e as Error).message };
      }
      
    case 'ping_host':
      const host = args.host || '8.8.8.8';
      const result = await ping.promise.probe(host);
      return {
        host,
        alive: result.alive,
        time: result.time !== 'unknown' ? `${result.time}ms` : 'N/A'
      };
      
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

// Execute CyberCAT tools (simplified - full implementation would be much longer)
async function executeCyberCatTool(toolName: string, args: any): Promise<any> {
  switch (toolName) {
    case 'analyze_network':
      const connections = await si.networkConnections();
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
      const processes = await si.processes();
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
      const users = await si.users();
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
      
      const alerts: any[] = [];
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

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Execute text command
async function executeCommand(command: string): Promise<any> {
  const parts = command.trim().split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);
  
  logger.info(`Executing command: ${cmd}`, { args }, 'COMMAND');
  
  switch (cmd) {
    case 'help':
      return {
        type: 'help',
        commands: [
          { cmd: 'help', desc: 'Show this help message' },
          { cmd: 'list', desc: 'List all configured APIs' },
          { cmd: 'status', desc: 'Show hub status' },
          { cmd: 'mcp', desc: 'List available MCP servers' },
          { cmd: 'security', desc: 'Run full security assessment' },
          { cmd: 'sysinfo', desc: 'Get system information' },
          { cmd: 'updates', desc: 'Check for updates' },
          { cmd: 'logs [lines]', desc: 'View recent logs' }
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
      
    case 'security':
      return await callMcpTool('cybercat', 'security_assessment', {});
      
    case 'sysinfo':
      return await callMcpTool('system-monitor', 'get_system_info', {});
      
    case 'updates':
      const updateResult = await updateService.checkForUpdates();
      return {
        type: 'updates',
        hasUpdates: updateResult.hasUpdates,
        totalUpdates: updateResult.totalUpdates,
        updates: updateResult.updates
      };
      
    case 'logs':
      const lines = parseInt(args[0]) || 50;
      const logs = logger.getRecentLogs(lines);
      return {
        type: 'logs',
        logs: logs.map(l => `[${l.timestamp}] [${l.level}] ${l.message}`)
      };
      
    default:
      return { type: 'error', message: `Unknown command: ${cmd}. Type "help" for available commands.` };
  }
}

// REST API Routes
app.get('/api/configs', (req: Request, res: Response) => {
  res.json(Object.fromEntries(apiConfigs));
});

app.post('/api/configs', (req: Request, res: Response) => {
  try {
    addApiConfig(req.body);
    res.json({ success: true, message: 'API added' });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

app.delete('/api/configs/:name', (req: Request, res: Response) => {
  if (apiConfigs.has(req.params.name)) {
    apiConfigs.delete(req.params.name);
    saveConfigs();
    res.json({ success: true, message: 'API removed' });
  } else {
    res.status(404).json({ success: false, error: 'API not found' });
  }
});

app.post('/api/call', async (req: Request, res: Response) => {
  try {
    const result = await callApi(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/test/:name', async (req: Request, res: Response) => {
  const result = await testApiConnection(req.params.name);
  res.json(result);
});

app.get('/api/history', (req: Request, res: Response) => {
  res.json(requestHistory);
});

app.post('/api/command', async (req: Request, res: Response) => {
  try {
    const result = await executeCommand(req.body.command);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Logging endpoints
app.get('/api/logs/recent', (req: Request, res: Response) => {
  const lines = parseInt(req.query.lines as string) || 100;
  const logs = logger.getRecentLogs(lines);
  res.json({ logs });
});

app.delete('/api/logs', (req: Request, res: Response) => {
  logger.clearLogs();
  res.json({ success: true, message: 'Logs cleared' });
});

app.get('/api/logs/path', (req: Request, res: Response) => {
  res.json({
    logFile: logger.getLogFilePath(),
    logDirectory: logger.getLogDirectory()
  });
});

// Update endpoints
app.get('/api/updates/check', async (req: Request, res: Response) => {
  try {
    const result = await updateService.checkForUpdates();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post('/api/updates/install', async (req: Request, res: Response) => {
  try {
    const result = await updateService.updateDependencies();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// API Storage endpoints (encrypted)
app.get('/api/storage/apis', (req: Request, res: Response) => {
  const apis = apiStorage.listApis();
  res.json({ apis });
});

app.post('/api/storage/apis', (req: Request, res: Response) => {
  const validation = apiStorage.validateCredentials(req.body);
  if (!validation.valid) {
    return res.status(400).json({ success: false, errors: validation.errors });
  }
  
  const result = apiStorage.addApi(req.body);
  res.json(result);
});

app.get('/api/storage/apis/:id', (req: Request, res: Response) => {
  const api = apiStorage.getApi(req.params.id);
  if (api) {
    res.json({ api });
  } else {
    res.status(404).json({ error: 'API not found' });
  }
});

app.delete('/api/storage/apis/:id', (req: Request, res: Response) => {
  const result = apiStorage.deleteApi(req.params.id);
  res.json(result);
});

app.get('/api/storage/stats', (req: Request, res: Response) => {
  const stats = apiStorage.getStatistics();
  res.json(stats);
});

app.post('/api/storage/export', (req: Request, res: Response) => {
  const result = apiStorage.exportApis();
  res.json(result);
});

app.post('/api/storage/import', (req: Request, res: Response) => {
  const { data, merge } = req.body;
  const result = apiStorage.importApis(data, merge);
  res.json(result);
});

// Proxy endpoint for direct API calls
app.all('/proxy/*', async (req: Request, res: Response) => {
  const targetUrl = req.params[0];
  
  try {
    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: { ...req.headers, host: undefined } as any,
      data: req.body,
      params: req.query,
      timeout: 30000
    });
    
    res.status(response.status).json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      error: error.message,
      data: error.response?.data
    });
  }
});

// Start server
server.listen(PORT, () => {
  logger.info(`Server starting on port ${PORT}`, undefined, 'STARTUP');
  
  // Check for updates on startup
  if (updateService.shouldCheckForUpdates()) {
    updateService.checkForUpdates().then(result => {
      if (result.hasUpdates) {
        logger.warn(`${result.totalUpdates} package updates available`, undefined, 'UPDATES');
      }
    });
  }
  
  console.log(`
    /\\_____/\\
   /  o   o  \\
  ( ==  ^  == )
   )         (
  (           )
 ( (  )   (  ) )
(__(__)___(__)__)

╔═══════════════════════════════════════════════════════════════╗
║                    🐱 CyberCAT Hub v2.0                       ║
║           Security & API Command Center (TypeScript)          ║
╚═══════════════════════════════════════════════════════════════╝

🚀 HTTP Server: http://localhost:${PORT}
🔌 WebSocket:   ws://localhost:${PORT}
🛡️  Security:   CyberCAT Active
📊 Monitor:     System Monitor Active
🔐 APIs:        ${apiConfigs.size} configured
📝 Logs:        ${logger.getLogDirectory()}

Type "help" for available commands
"Stay secure, stay vigilant" 🐱
`);
});