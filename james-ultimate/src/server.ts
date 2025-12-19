/**
 * ════════════════════════════════════════════════════════════════════════════
 * CYBERCAT - Cyber Analysis & Threat Detection System
 * James Ultimate Cybersecurity Platform - Main Server
 * Copyright © 2025 Emersa Ltd. All Rights Reserved.
 * Made in California, USA 🇺🇸
 * ════════════════════════════════════════════════════════════════════════════
 *
 * CONFIDENTIAL AND PROPRIETARY
 *
 * Express server with Socket.IO for real-time communication
 * Integrated military-grade security protection system
 *
 * Features:
 * - Multi-LLM AI agent system
 * - Real-time threat detection
 * - Anti-malware & anti-ransomware protection
 * - Rate limiting & DDoS protection
 * - Encrypted credential storage
 * - IoT device security management
 *
 * SECURITY NOTICE: This system contains proprietary security algorithms.
 * Unauthorized access, use, or distribution is strictly prohibited.
 * ════════════════════════════════════════════════════════════════════════════
 */

import express, { Request, Response, NextFunction, Express } from 'express';
import * as http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import * as path from 'path';
import * as fs from 'fs';
import { config } from 'dotenv';

config();

import { llmProvider } from './llm/provider';
import { agentManager } from './agents/agent-manager';
import { securityTools } from './tools/security-tools';
import { iotManager } from './iot/iot-manager';

// Import security modules
import { securityCore } from './security/security-core';
import { antiMalware } from './security/anti-malware';
import { antiRansomware } from './security/anti-ransomware';
import { rateLimiter } from './security/rate-limiter';

// Import licensing system
import { Database } from './database/database';
import { LicenseRoutes } from './routes/license-routes';

// Initialize database (will be initialized in startup)
const db = new Database();
let licenseRoutes: LicenseRoutes;
let authMiddleware: any;
let licenseService: any;

// Initialize Express app
const app: Express = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(helmet({
  contentSecurityPolicy: false // Allow inline scripts for GUI
}));
app.use(compression());

// Apply rate limiting to all routes
app.use(rateLimiter.middleware({
  windowMs: 60000,    // 1 minute
  maxRequests: 200    // 200 requests per minute
}));

// Body parser with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request sanitization middleware
app.use((req: Request, res: Response, next: NextFunction): void => {
  // Sanitize and validate inputs
  if (req.body) {
    for (const [key, value] of Object.entries(req.body)) {
      if (typeof value === 'string') {
        const validation = securityCore.validateInput(value);
        if (!validation.isValid) {
          res.status(400).json({
            error: 'Invalid input',
            field: key,
            message: 'Input contains invalid characters'
          });
          return;
        }
        req.body[key] = validation.sanitized;
      }
    }
  }
  next();
});

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
const apiRouter = express.Router();

// Health check
apiRouter.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// LLM Provider endpoints
apiRouter.get('/llm/providers', (req: Request, res: Response) => {
  res.json(llmProvider.getProviders());
});

apiRouter.post('/llm/switch', (req: Request, res: Response) => {
  try {
    const { provider, model } = req.body;
    const result = llmProvider.setActiveProvider(provider, model);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

apiRouter.post('/llm/key', (req: Request, res: Response) => {
  try {
    const { provider, apiKey } = req.body;
    
    // Store API key securely using encryption
    const stored = securityCore.storeApiKey(provider, apiKey);
    
    if (stored) {
      // Also set in LLM provider for immediate use
      llmProvider.setApiKey(provider, apiKey);
      res.json({ success: true, message: 'API key encrypted and stored securely' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to store API key' });
    }
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

apiRouter.post('/llm/test', async (req: Request, res: Response) => {
  try {
    const { provider } = req.body;
    const result = await llmProvider.testProvider(provider);
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

apiRouter.get('/llm/ollama/models', async (req: Request, res: Response) => {
  const models = await llmProvider.listOllamaModels();
  res.json(models);
});

// Agent endpoints
apiRouter.get('/agents', (req: Request, res: Response) => {
  res.json(agentManager.getAgents());
});

apiRouter.post('/agents/switch', (req: Request, res: Response) => {
  try {
    const { agentId } = req.body;
    const result = agentManager.setActiveAgent(agentId);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

apiRouter.post('/agents/create', (req: Request, res: Response) => {
  try {
    const { id, config } = req.body;
    const agent = agentManager.createCustomAgent(id, config);
    res.json({ success: true, agent });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

apiRouter.post('/agents/customize', (req: Request, res: Response) => {
  try {
    const { agentId, customization } = req.body;
    const agent = agentManager.customizeAgent(agentId, customization);
    res.json({ success: true, agent });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

apiRouter.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, options } = req.body;
    const result = await agentManager.chat(message, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

apiRouter.get('/chat/history', (req: Request, res: Response) => {
  res.json(agentManager.getHistory());
});

apiRouter.post('/chat/clear', (req: Request, res: Response) => {
  agentManager.clearHistory();
  res.json({ success: true });
});

// Security Tools endpoints
apiRouter.get('/tools', (req: Request, res: Response) => {
  res.json(securityTools.getTools());
});

apiRouter.get('/tools/:category', (req: Request, res: Response) => {
  res.json(securityTools.getToolsByCategory(req.params.category));
});

apiRouter.post('/tools/:toolId/execute', async (req: Request, res: Response) => {
  try {
    const { toolId } = req.params;
    const params = req.body;
    const result = await securityTools.executeTool(toolId, params);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Quick scan endpoints
apiRouter.post('/scan/ports', async (req: Request, res: Response) => {
  try {
    const result = await securityTools.executeTool('port_scan', req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

apiRouter.get('/scan/system', async (req: Request, res: Response) => {
  try {
    const result = await securityTools.executeTool('system_analysis', {});
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

apiRouter.get('/scan/network', async (req: Request, res: Response) => {
  try {
    const result = await securityTools.executeTool('network_analysis', {});
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

apiRouter.get('/report', async (req: Request, res: Response) => {
  try {
    const result = await securityTools.executeTool('security_report', {});
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// IoT endpoints
apiRouter.get('/iot/protocols', (req: Request, res: Response) => {
  res.json(iotManager.getProtocols());
});

apiRouter.get('/iot/devices', (req: Request, res: Response) => {
  res.json(iotManager.getDevices());
});

apiRouter.post('/iot/devices', (req: Request, res: Response) => {
  try {
    const { id, config } = req.body;
    const device = iotManager.registerDevice(id, config);
    res.json({ success: true, device });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

apiRouter.post('/iot/devices/:deviceId/connect', async (req: Request, res: Response) => {
  try {
    const result = await iotManager.connectDevice(req.params.deviceId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

apiRouter.post('/iot/devices/:deviceId/disconnect', async (req: Request, res: Response) => {
  try {
    const result = await iotManager.disconnectDevice(req.params.deviceId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

apiRouter.delete('/iot/devices/:deviceId', (req: Request, res: Response) => {
  try {
    iotManager.removeDevice(req.params.deviceId);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

apiRouter.post('/iot/discover', async (req: Request, res: Response) => {
  try {
    const devices = await iotManager.discoverDevices(req.body);
    res.json(devices);
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

apiRouter.post('/iot/api', (req: Request, res: Response) => {
  try {
    const { id, config } = req.body;
    const device = iotManager.registerAPI(id, config);
    res.json({ success: true, device });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

apiRouter.post('/iot/api/:deviceId/call', async (req: Request, res: Response) => {
  try {
    const { endpoint, method, data } = req.body;
    const result = await iotManager.callAPI(req.params.deviceId, endpoint, method, data);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Security module endpoints
apiRouter.get('/security/status', (req: Request, res: Response) => {
  res.json({
    antiMalware: antiMalware.getStats(),
    antiRansomware: antiRansomware.getStats(),
    rateLimiter: rateLimiter.getStats(),
    encryption: {
      enabled: true,
      algorithm: 'AES-256-GCM',
      keyDerivation: 'PBKDF2'
    }
  });
});

apiRouter.post('/security/scan/malware', async (req: Request, res: Response) => {
  try {
    const { path: scanPath } = req.body;
    const result = await antiMalware.performFullScan({ directories: [scanPath || process.cwd()] });
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

apiRouter.get('/security/quarantine', (req: Request, res: Response) => {
  res.json({
    malware: antiMalware.getQuarantinedFiles(),
    ransomware: antiRansomware.getBackups()
  });
});

apiRouter.post('/security/ransomware/monitor', (req: Request, res: Response) => {
  try {
    const { directory } = req.body;
    antiRansomware.monitorDirectory(directory || process.cwd());
    res.json({ success: true, message: `Monitoring directory: ${directory}` });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

apiRouter.get('/security/audit', (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const logs = securityCore.getAuditLog(limit);
    res.json({ logs, count: logs.length });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Configuration endpoints
apiRouter.get('/config', (req: Request, res: Response) => {
  res.json({
    llm: {
      activeProvider: llmProvider.activeProvider?.id || null,
      activeModel: llmProvider.activeModel || null
    },
    agent: {
      activeAgent: agentManager.activeAgent?.id || null
    },
    version: '2.0.0'
  });
});

apiRouter.post('/config/save', (req: Request, res: Response) => {
  try {
    const configPath = path.join(__dirname, '../config/settings.json');
    const configDir = path.dirname(configPath);
    
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    fs.writeFileSync(configPath, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Mount API router
app.use('/api', apiRouter);

// Mount license routes (will be added after DB initialization)

// Socket.IO for real-time communication
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Send initial state
  socket.emit('init', {
    providers: llmProvider.getProviders(),
    agents: agentManager.getAgents(),
    tools: securityTools.getTools(),
    config: {
      activeProvider: llmProvider.activeProvider?.id,
      activeModel: llmProvider.activeModel,
      activeAgent: agentManager.activeAgent?.id
    }
  });
  
  // Chat message
  socket.on('chat', async (data: { message: string; options?: any }) => {
    try {
      const result = await agentManager.chat(data.message, data.options);
      socket.emit('chatResponse', result);
    } catch (error) {
      socket.emit('chatError', { error: (error as Error).message });
    }
  });
  
  // Switch provider
  socket.on('switchProvider', (data: { provider: string; model?: string }) => {
    try {
      const result = llmProvider.setActiveProvider(data.provider, data.model);
      socket.emit('providerSwitched', result);
      io.emit('configUpdate', { activeProvider: data.provider, activeModel: data.model });
    } catch (error) {
      socket.emit('error', { error: (error as Error).message });
    }
  });
  
  // Switch agent
  socket.on('switchAgent', (data: { agentId: string }) => {
    try {
      const result = agentManager.setActiveAgent(data.agentId);
      socket.emit('agentSwitched', result);
      io.emit('configUpdate', { activeAgent: data.agentId });
    } catch (error) {
      socket.emit('error', { error: (error as Error).message });
    }
  });
  
  // Execute tool
  socket.on('executeTool', async (data: { toolId: string; params: any }) => {
    try {
      socket.emit('toolStart', { tool: data.toolId });
      const result = await securityTools.executeTool(data.toolId, data.params);
      socket.emit('toolResult', { tool: data.toolId, result });
    } catch (error) {
      socket.emit('toolError', { tool: data.toolId, error: (error as Error).message });
    }
  });
  
  // IoT events
  socket.on('iotConnect', async (data: { deviceId: string }) => {
    try {
      const result = await iotManager.connectDevice(data.deviceId);
      socket.emit('iotConnected', result);
    } catch (error) {
      socket.emit('iotError', { error: (error as Error).message });
    }
  });
  
  socket.on('iotDisconnect', async (data: { deviceId: string }) => {
    try {
      const result = await iotManager.disconnectDevice(data.deviceId);
      socket.emit('iotDisconnected', result);
    } catch (error) {
      socket.emit('iotError', { error: (error as Error).message });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Forward events to Socket.IO
llmProvider.on('providerChanged', (data: any) => io.emit('providerChanged', data));
llmProvider.on('chatStart', (data: any) => io.emit('chatStart', data));
llmProvider.on('chatComplete', (data: any) => io.emit('chatComplete', data));

agentManager.on('agentChanged', (data: any) => io.emit('agentChanged', data));
agentManager.on('historyCleared', () => io.emit('historyCleared'));

iotManager.on('deviceConnected', (data: any) => io.emit('iotDeviceConnected', data));
iotManager.on('deviceDisconnected', (data: any) => io.emit('iotDeviceDisconnected', data));
iotManager.on('deviceError', (data: any) => io.emit('iotDeviceError', data));
iotManager.on('discoveryProgress', (data: any) => io.emit('iotDiscoveryProgress', data));

// Serve index.html for all other routes (SPA)
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

// Start anti-ransomware monitoring on critical directories
antiRansomware.monitorDirectory(process.cwd());

// Initialize security event listeners
antiMalware.on('malware_detected', (alert: any) => {
  console.error('[SECURITY ALERT] Malware detected:', alert);
  io.emit('security_alert', alert);
});

antiRansomware.on('ransomware_detected', (alert: any) => {
  console.error('[SECURITY ALERT] Ransomware detected:', alert);
  io.emit('security_alert', alert);
});

rateLimiter.on('ip_blacklisted', (data: any) => {
  console.warn('[SECURITY] IP blacklisted:', data.ip);
});

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database
    await db.initialize();
    console.log('[LICENSING] Database initialized');

    // Initialize license routes
    licenseRoutes = new LicenseRoutes(db);
    authMiddleware = licenseRoutes.getAuthMiddleware();
    licenseService = licenseRoutes.getLicenseService();

    // Mount license routes
    app.use('/api', licenseRoutes.getRouter());

    // Start server
    server.listen(PORT, HOST, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║   ██████╗██╗   ██╗██████╗ ███████╗██████╗  ██████╗ █████╗ ████████╗      ║
║  ██╔════╝╚██╗ ██╔╝██╔══██╗██╔════╝██╔══██╗██╔════╝██╔══██╗╚══██╔══╝      ║
║  ██║      ╚████╔╝ ██████╔╝█████╗  ██████╔╝██║     ███████║   ██║         ║
║  ██║       ╚██╔╝  ██╔══██╗██╔══╝  ██╔══██╗██║     ██╔══██║   ██║         ║
║  ╚██████╗   ██║   ██████╔╝███████╗██║  ██║╚██████╗██║  ██║   ██║         ║
║   ╚═════╝   ╚═╝   ╚═════╝ ╚══════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝   ╚═╝         ║
║                                                                           ║
║   Cyber Analysis & Threat Detection - Military Grade Security Monitor    ║
║   Copyright © 2025 Emersa Ltd. All Rights Reserved.                      ║
║                                                                           ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  Server running on http://${HOST}:${PORT}
║  API Documentation: http://${HOST}:${PORT}/api
║
║  🛡️  SECURITY FEATURES ACTIVE:
║  ✓ AES-256-GCM Encryption
║  ✓ Anti-Malware Protection
║  ✓ Anti-Ransomware Defense
║  ✓ DDoS Protection & Rate Limiting
║  ✓ Real-time Threat Detection
║  ✓ Secure Credential Storage
║
║  🚀 AI CAPABILITIES:
║  • Multi-LLM Support (OpenAI, Anthropic, Ollama, etc.)
║  • 8 Specialized Security Agents
║  • IoT Device Security Management
║  • Real-time Security Analysis
╚═══════════════════════════════════════════════════════════════════════════╝
  `);
      
      console.log('[CYBERCAT] All systems operational. Standing by for threats...');
    });
  } catch (error) {
    console.error('[FATAL] Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

export { app, server, io };
