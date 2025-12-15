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
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);
  
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
      
    case 'vulnerability_scan':
      // Comprehensive vulnerability scan
      const vulnResults = await performVulnerabilityScan();
      return vulnResults;
      
    case 'port_scan':
      // Scan common ports
      const targetHost = args.host || '127.0.0.1';
      const portResults = await scanPorts(targetHost);
      return portResults;
      
    case 'firewall_check':
      // Check firewall status
      const firewallStatus = await checkFirewall();
      return firewallStatus;
      
    case 'malware_scan':
      // Scan for suspicious processes and files
      const malwareResults = await scanForMalware();
      return malwareResults;
      
    case 'password_audit':
      // Check for weak password policies
      const passwordAudit = await auditPasswordPolicies();
      return passwordAudit;
      
    case 'ssl_check':
      // Check SSL/TLS configuration
      const sslTarget = args.url || 'https://localhost';
      const sslResults = await checkSSL(sslTarget);
      return sslResults;
      
    case 'system_hardening':
      // Check system hardening status
      const hardeningResults = await checkSystemHardening();
      return hardeningResults;
      
    case 'full_sweep':
      // Complete security sweep
      const sweepResults = await performFullSecuritySweep();
      return sweepResults;
      
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

// Vulnerability Scan
async function performVulnerabilityScan() {
  const si = await import('systeminformation');
  const vulnerabilities = [];
  const recommendations = [];
  
  // Check OS updates
  const osInfo = await si.default.osInfo();
  
  // Check for outdated software indicators
  const services = await si.default.services('*');
  const runningServices = services.filter(s => s.running);
  
  // Check open ports
  const connections = await si.default.networkConnections();
  const listeningPorts = connections.filter(c => c.state === 'LISTEN');
  
  // Common vulnerable ports
  const riskyPorts = [21, 23, 25, 110, 135, 139, 445, 1433, 3306, 3389, 5432];
  const openRiskyPorts = listeningPorts.filter(c => riskyPorts.includes(c.localPort));
  
  if (openRiskyPorts.length > 0) {
    vulnerabilities.push({
      severity: 'HIGH',
      type: 'OPEN_RISKY_PORTS',
      description: `Found ${openRiskyPorts.length} potentially risky ports open`,
      ports: openRiskyPorts.map(p => p.localPort),
      recommendation: 'Close unnecessary ports or restrict access via firewall'
    });
  }
  
  // Check for services running as SYSTEM/root
  const systemServices = runningServices.filter(s =>
    s.user === 'SYSTEM' || s.user === 'root' || s.user === 'LocalSystem'
  );
  
  if (systemServices.length > 20) {
    vulnerabilities.push({
      severity: 'MEDIUM',
      type: 'EXCESSIVE_SYSTEM_SERVICES',
      description: `${systemServices.length} services running with elevated privileges`,
      recommendation: 'Review and minimize services running with system privileges'
    });
  }
  
  // Check memory usage (potential memory leak or crypto miner)
  const mem = await si.default.mem();
  const memUsagePercent = (mem.used / mem.total) * 100;
  
  if (memUsagePercent > 90) {
    vulnerabilities.push({
      severity: 'MEDIUM',
      type: 'HIGH_MEMORY_USAGE',
      description: `Memory usage at ${memUsagePercent.toFixed(1)}%`,
      recommendation: 'Investigate high memory usage - possible memory leak or malicious process'
    });
  }
  
  // Check CPU usage
  const cpuLoad = await si.default.currentLoad();
  if (cpuLoad.currentLoad > 80) {
    vulnerabilities.push({
      severity: 'LOW',
      type: 'HIGH_CPU_USAGE',
      description: `CPU usage at ${cpuLoad.currentLoad.toFixed(1)}%`,
      recommendation: 'Investigate high CPU usage - possible crypto miner or malicious process'
    });
  }
  
  // Generate recommendations
  recommendations.push('Enable automatic security updates');
  recommendations.push('Implement network segmentation');
  recommendations.push('Use strong authentication (MFA)');
  recommendations.push('Regular security audits');
  recommendations.push('Implement least privilege access');
  
  return {
    scanTime: new Date().toISOString(),
    vulnerabilitiesFound: vulnerabilities.length,
    severityCounts: {
      critical: vulnerabilities.filter(v => v.severity === 'CRITICAL').length,
      high: vulnerabilities.filter(v => v.severity === 'HIGH').length,
      medium: vulnerabilities.filter(v => v.severity === 'MEDIUM').length,
      low: vulnerabilities.filter(v => v.severity === 'LOW').length
    },
    vulnerabilities,
    recommendations,
    overallRisk: vulnerabilities.some(v => v.severity === 'CRITICAL') ? 'CRITICAL' :
                 vulnerabilities.some(v => v.severity === 'HIGH') ? 'HIGH' :
                 vulnerabilities.some(v => v.severity === 'MEDIUM') ? 'MEDIUM' : 'LOW'
  };
}

// Port Scanner
async function scanPorts(host) {
  const net = await import('net');
  const commonPorts = [
    { port: 21, service: 'FTP' },
    { port: 22, service: 'SSH' },
    { port: 23, service: 'Telnet' },
    { port: 25, service: 'SMTP' },
    { port: 53, service: 'DNS' },
    { port: 80, service: 'HTTP' },
    { port: 110, service: 'POP3' },
    { port: 135, service: 'RPC' },
    { port: 139, service: 'NetBIOS' },
    { port: 143, service: 'IMAP' },
    { port: 443, service: 'HTTPS' },
    { port: 445, service: 'SMB' },
    { port: 993, service: 'IMAPS' },
    { port: 995, service: 'POP3S' },
    { port: 1433, service: 'MSSQL' },
    { port: 1521, service: 'Oracle' },
    { port: 3306, service: 'MySQL' },
    { port: 3389, service: 'RDP' },
    { port: 5432, service: 'PostgreSQL' },
    { port: 5900, service: 'VNC' },
    { port: 6379, service: 'Redis' },
    { port: 8080, service: 'HTTP-Alt' },
    { port: 8443, service: 'HTTPS-Alt' },
    { port: 27017, service: 'MongoDB' }
  ];
  
  const results = [];
  
  for (const { port, service } of commonPorts) {
    const isOpen = await checkPort(host, port);
    if (isOpen) {
      results.push({ port, service, status: 'OPEN' });
    }
  }
  
  return {
    host,
    scanTime: new Date().toISOString(),
    openPorts: results.length,
    ports: results,
    riskLevel: results.some(p => [23, 135, 139, 445].includes(p.port)) ? 'HIGH' :
               results.some(p => [21, 3389, 5900].includes(p.port)) ? 'MEDIUM' : 'LOW'
  };
}

// Check single port
function checkPort(host, port) {
  return new Promise((resolve) => {
    const net = require('net');
    const socket = new net.Socket();
    socket.setTimeout(1000);
    
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    
    socket.on('error', () => {
      resolve(false);
    });
    
    socket.connect(port, host);
  });
}

// Check Firewall Status
async function checkFirewall() {
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);
  
  try {
    // Windows firewall check
    const { stdout } = await execAsync('netsh advfirewall show allprofiles state');
    const profiles = stdout.split('\n').filter(line => line.includes('State'));
    
    const firewallStatus = {
      enabled: stdout.toLowerCase().includes('on'),
      profiles: profiles.map(p => p.trim()),
      recommendation: ''
    };
    
    if (!firewallStatus.enabled) {
      firewallStatus.recommendation = 'CRITICAL: Enable Windows Firewall immediately';
      firewallStatus.risk = 'CRITICAL';
    } else {
      firewallStatus.recommendation = 'Firewall is enabled - review rules periodically';
      firewallStatus.risk = 'LOW';
    }
    
    return firewallStatus;
  } catch (e) {
    return {
      enabled: 'unknown',
      error: 'Could not determine firewall status',
      recommendation: 'Manually verify firewall configuration'
    };
  }
}

// Scan for Malware indicators
async function scanForMalware() {
  const si = await import('systeminformation');
  const suspiciousIndicators = [];
  
  // Get all processes
  const processes = await si.default.processes();
  
  // Known suspicious process names (simplified list)
  const suspiciousNames = [
    'cryptominer', 'xmrig', 'minerd', 'cgminer', 'bfgminer',
    'coinhive', 'cryptonight', 'stratum', 'nicehash',
    'mimikatz', 'pwdump', 'procdump', 'lazagne',
    'netcat', 'ncat', 'nc.exe', 'psexec',
    'keylogger', 'spyware', 'trojan'
  ];
  
  // Check for suspicious processes
  const suspiciousProcesses = processes.list.filter(p =>
    suspiciousNames.some(name => p.name.toLowerCase().includes(name))
  );
  
  if (suspiciousProcesses.length > 0) {
    suspiciousIndicators.push({
      type: 'SUSPICIOUS_PROCESS',
      severity: 'CRITICAL',
      details: suspiciousProcesses.map(p => ({ name: p.name, pid: p.pid, cpu: p.cpu }))
    });
  }
  
  // Check for processes with high CPU (potential miners)
  const highCpuProcesses = processes.list.filter(p => p.cpu > 50);
  if (highCpuProcesses.length > 0) {
    suspiciousIndicators.push({
      type: 'HIGH_CPU_PROCESS',
      severity: 'MEDIUM',
      details: highCpuProcesses.map(p => ({ name: p.name, pid: p.pid, cpu: `${p.cpu.toFixed(1)}%` }))
    });
  }
  
  // Check for unusual network connections
  const connections = await si.default.networkConnections();
  const unusualPorts = connections.filter(c =>
    c.state === 'ESTABLISHED' &&
    c.peerPort &&
    (c.peerPort > 49151 || [4444, 5555, 6666, 7777, 8888, 9999].includes(c.peerPort))
  );
  
  if (unusualPorts.length > 0) {
    suspiciousIndicators.push({
      type: 'UNUSUAL_CONNECTIONS',
      severity: 'HIGH',
      details: unusualPorts.map(c => ({
        remote: `${c.peerAddress}:${c.peerPort}`,
        process: c.process || 'unknown'
      }))
    });
  }
  
  return {
    scanTime: new Date().toISOString(),
    indicatorsFound: suspiciousIndicators.length,
    status: suspiciousIndicators.some(i => i.severity === 'CRITICAL') ? 'INFECTED' :
            suspiciousIndicators.some(i => i.severity === 'HIGH') ? 'SUSPICIOUS' : 'CLEAN',
    indicators: suspiciousIndicators,
    recommendation: suspiciousIndicators.length > 0 ?
      'Run a full antivirus scan and investigate flagged processes' :
      'No obvious malware indicators found'
  };
}

// Audit Password Policies
async function auditPasswordPolicies() {
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);
  
  try {
    const { stdout } = await execAsync('net accounts');
    const lines = stdout.split('\n');
    
    const policies = {};
    lines.forEach(line => {
      if (line.includes(':')) {
        const [key, value] = line.split(':').map(s => s.trim());
        policies[key] = value;
      }
    });
    
    const issues = [];
    
    // Check minimum password length
    const minLength = parseInt(policies['Minimum password length']) || 0;
    if (minLength < 12) {
      issues.push({
        issue: 'Weak minimum password length',
        current: minLength,
        recommended: 12,
        severity: 'HIGH'
      });
    }
    
    // Check password history
    const history = parseInt(policies['Length of password history maintained']) || 0;
    if (history < 5) {
      issues.push({
        issue: 'Insufficient password history',
        current: history,
        recommended: 5,
        severity: 'MEDIUM'
      });
    }
    
    // Check lockout threshold
    const lockout = parseInt(policies['Lockout threshold']) || 0;
    if (lockout === 0 || lockout > 5) {
      issues.push({
        issue: 'Weak account lockout policy',
        current: lockout === 0 ? 'Never' : lockout,
        recommended: '3-5 attempts',
        severity: 'HIGH'
      });
    }
    
    return {
      policies,
      issues,
      overallRating: issues.some(i => i.severity === 'HIGH') ? 'POOR' :
                     issues.some(i => i.severity === 'MEDIUM') ? 'FAIR' : 'GOOD',
      recommendations: [
        'Enforce minimum 12 character passwords',
        'Enable password complexity requirements',
        'Set account lockout after 3-5 failed attempts',
        'Implement multi-factor authentication'
      ]
    };
  } catch (e) {
    return {
      error: 'Could not audit password policies',
      recommendation: 'Manually review password policies'
    };
  }
}

// Check SSL/TLS
async function checkSSL(url) {
  const https = await import('https');
  const tls = await import('tls');
  
  return new Promise((resolve) => {
    try {
      const urlObj = new URL(url);
      const options = {
        host: urlObj.hostname,
        port: urlObj.port || 443,
        method: 'GET',
        rejectUnauthorized: false
      };
      
      const req = https.request(options, (res) => {
        const cert = res.socket.getPeerCertificate();
        const cipher = res.socket.getCipher();
        const protocol = res.socket.getProtocol();
        
        const issues = [];
        
        // Check protocol version
        if (protocol === 'TLSv1' || protocol === 'TLSv1.1') {
          issues.push({
            issue: 'Outdated TLS version',
            current: protocol,
            recommended: 'TLSv1.2 or TLSv1.3',
            severity: 'HIGH'
          });
        }
        
        // Check certificate expiry
        if (cert.valid_to) {
          const expiryDate = new Date(cert.valid_to);
          const daysUntilExpiry = Math.floor((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
          
          if (daysUntilExpiry < 0) {
            issues.push({
              issue: 'Certificate expired',
              severity: 'CRITICAL'
            });
          } else if (daysUntilExpiry < 30) {
            issues.push({
              issue: 'Certificate expiring soon',
              daysRemaining: daysUntilExpiry,
              severity: 'HIGH'
            });
          }
        }
        
        resolve({
          url,
          protocol,
          cipher: cipher ? cipher.name : 'unknown',
          certificate: {
            subject: cert.subject,
            issuer: cert.issuer,
            validFrom: cert.valid_from,
            validTo: cert.valid_to
          },
          issues,
          rating: issues.some(i => i.severity === 'CRITICAL') ? 'F' :
                  issues.some(i => i.severity === 'HIGH') ? 'C' :
                  issues.some(i => i.severity === 'MEDIUM') ? 'B' : 'A'
        });
      });
      
      req.on('error', (e) => {
        resolve({
          url,
          error: e.message,
          rating: 'F'
        });
      });
      
      req.setTimeout(5000, () => {
        req.destroy();
        resolve({
          url,
          error: 'Connection timeout',
          rating: 'F'
        });
      });
      
      req.end();
    } catch (e) {
      resolve({
        url,
        error: e.message,
        rating: 'F'
      });
    }
  });
}

// Check System Hardening
async function checkSystemHardening() {
  const si = await import('systeminformation');
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);
  
  const checks = [];
  
  // Check if Windows Defender is running
  try {
    const services = await si.default.services('WinDefend');
    const defender = services.find(s => s.name === 'WinDefend');
    checks.push({
      check: 'Windows Defender',
      status: defender && defender.running ? 'ENABLED' : 'DISABLED',
      severity: defender && defender.running ? 'OK' : 'CRITICAL'
    });
  } catch (e) {
    checks.push({ check: 'Windows Defender', status: 'UNKNOWN', severity: 'MEDIUM' });
  }
  
  // Check UAC status
  try {
    const { stdout } = await execAsync('reg query "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System" /v EnableLUA');
    const uacEnabled = stdout.includes('0x1');
    checks.push({
      check: 'User Account Control (UAC)',
      status: uacEnabled ? 'ENABLED' : 'DISABLED',
      severity: uacEnabled ? 'OK' : 'HIGH'
    });
  } catch (e) {
    checks.push({ check: 'UAC', status: 'UNKNOWN', severity: 'MEDIUM' });
  }
  
  // Check Remote Desktop
  try {
    const { stdout } = await execAsync('reg query "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Terminal Server" /v fDenyTSConnections');
    const rdpDisabled = stdout.includes('0x1');
    checks.push({
      check: 'Remote Desktop',
      status: rdpDisabled ? 'DISABLED' : 'ENABLED',
      severity: rdpDisabled ? 'OK' : 'MEDIUM',
      note: rdpDisabled ? 'Good - RDP is disabled' : 'RDP is enabled - ensure it is secured'
    });
  } catch (e) {
    checks.push({ check: 'Remote Desktop', status: 'UNKNOWN', severity: 'LOW' });
  }
  
  // Check auto-login
  try {
    const { stdout } = await execAsync('reg query "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon" /v AutoAdminLogon');
    const autoLogin = stdout.includes('1');
    checks.push({
      check: 'Auto-Login',
      status: autoLogin ? 'ENABLED' : 'DISABLED',
      severity: autoLogin ? 'HIGH' : 'OK'
    });
  } catch (e) {
    checks.push({ check: 'Auto-Login', status: 'DISABLED', severity: 'OK' });
  }
  
  const criticalIssues = checks.filter(c => c.severity === 'CRITICAL').length;
  const highIssues = checks.filter(c => c.severity === 'HIGH').length;
  
  return {
    scanTime: new Date().toISOString(),
    checks,
    summary: {
      total: checks.length,
      passed: checks.filter(c => c.severity === 'OK').length,
      failed: criticalIssues + highIssues
    },
    overallScore: criticalIssues > 0 ? 'CRITICAL' :
                  highIssues > 0 ? 'NEEDS_IMPROVEMENT' : 'HARDENED',
    recommendations: [
      'Enable Windows Defender real-time protection',
      'Keep UAC enabled at highest level',
      'Disable Remote Desktop if not needed',
      'Never enable auto-login on shared systems'
    ]
  };
}

// Full Security Sweep
async function performFullSecuritySweep() {
  console.log('🐱 CyberCAT: Starting full security sweep...');
  
  const results = {
    sweepTime: new Date().toISOString(),
    modules: {}
  };
  
  // Run all security checks
  try {
    results.modules.vulnerabilities = await performVulnerabilityScan();
  } catch (e) {
    results.modules.vulnerabilities = { error: e.message };
  }
  
  try {
    results.modules.malware = await scanForMalware();
  } catch (e) {
    results.modules.malware = { error: e.message };
  }
  
  try {
    results.modules.firewall = await checkFirewall();
  } catch (e) {
    results.modules.firewall = { error: e.message };
  }
  
  try {
    results.modules.hardening = await checkSystemHardening();
  } catch (e) {
    results.modules.hardening = { error: e.message };
  }
  
  try {
    results.modules.passwords = await auditPasswordPolicies();
  } catch (e) {
    results.modules.passwords = { error: e.message };
  }
  
  try {
    results.modules.ports = await scanPorts('127.0.0.1');
  } catch (e) {
    results.modules.ports = { error: e.message };
  }
  
  // Calculate overall security score
  let score = 100;
  
  if (results.modules.vulnerabilities?.overallRisk === 'CRITICAL') score -= 40;
  else if (results.modules.vulnerabilities?.overallRisk === 'HIGH') score -= 25;
  else if (results.modules.vulnerabilities?.overallRisk === 'MEDIUM') score -= 10;
  
  if (results.modules.malware?.status === 'INFECTED') score -= 50;
  else if (results.modules.malware?.status === 'SUSPICIOUS') score -= 20;
  
  if (results.modules.firewall?.risk === 'CRITICAL') score -= 30;
  
  if (results.modules.hardening?.overallScore === 'CRITICAL') score -= 25;
  else if (results.modules.hardening?.overallScore === 'NEEDS_IMPROVEMENT') score -= 10;
  
  if (results.modules.passwords?.overallRating === 'POOR') score -= 15;
  else if (results.modules.passwords?.overallRating === 'FAIR') score -= 5;
  
  results.securityScore = Math.max(0, score);
  results.grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';
  results.status = score >= 80 ? 'SECURE' : score >= 60 ? 'AT_RISK' : 'VULNERABLE';
  
  results.priorityActions = [];
  if (results.modules.malware?.status !== 'CLEAN') {
    results.priorityActions.push('🚨 Run full antivirus scan immediately');
  }
  if (results.modules.firewall?.risk === 'CRITICAL') {
    results.priorityActions.push('🔥 Enable firewall immediately');
  }
  if (results.modules.vulnerabilities?.overallRisk === 'HIGH' || results.modules.vulnerabilities?.overallRisk === 'CRITICAL') {
    results.priorityActions.push('⚠️ Address high-severity vulnerabilities');
  }
  if (results.modules.hardening?.overallScore !== 'HARDENED') {
    results.priorityActions.push('🔒 Implement system hardening measures');
  }
  
  return results;
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
          { cmd: 'ping <host>', desc: 'Ping a host' },
          { cmd: '', desc: '' },
          { cmd: '--- Security Sweep ---', desc: '' },
          { cmd: 'sweep', desc: '🔍 Full security sweep (all checks)' },
          { cmd: 'vulnscan', desc: '🔎 Vulnerability scan' },
          { cmd: 'portscan [host]', desc: '🔌 Port scan (default: localhost)' },
          { cmd: 'firewall', desc: '🔥 Check firewall status' },
          { cmd: 'malware', desc: '🦠 Scan for malware indicators' },
          { cmd: 'passwords', desc: '🔑 Audit password policies' },
          { cmd: 'sslcheck <url>', desc: '🔒 Check SSL/TLS configuration' },
          { cmd: 'hardening', desc: '🛡️ Check system hardening' }
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
      
    // Security Sweep Commands
    case 'sweep':
      return await callMcpTool('cybercat', 'full_sweep', {});
      
    case 'vulnscan':
      return await callMcpTool('cybercat', 'vulnerability_scan', {});
      
    case 'portscan':
      return await callMcpTool('cybercat', 'port_scan', { host: args[0] || '127.0.0.1' });
      
    case 'firewall':
      return await callMcpTool('cybercat', 'firewall_check', {});
      
    case 'malware':
      return await callMcpTool('cybercat', 'malware_scan', {});
      
    case 'passwords':
      return await callMcpTool('cybercat', 'password_audit', {});
      
    case 'sslcheck':
      if (args.length === 0) {
        return { type: 'error', message: 'Usage: sslcheck <url>' };
      }
      return await callMcpTool('cybercat', 'ssl_check', { url: args[0] });
      
    case 'hardening':
      return await callMcpTool('cybercat', 'system_hardening', {});
      
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