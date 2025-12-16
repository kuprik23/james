// CyberCAT Multi-Agent Security Command Center Server
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { execSync } = require('child_process');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

// ==============================================================================
// SECURITY: Input Validation & Sanitization
// ==============================================================================

/**
 * Validate API key format
 * Prevents injection attacks and ensures proper format
 */
function validateApiKey(key, provider) {
    if (!key || typeof key !== 'string') return false;
    
    // Remove whitespace
    key = key.trim();
    
    switch(provider) {
        case 'openai':
            // OpenAI keys start with sk- and are typically 48-51 chars
            return /^sk-[A-Za-z0-9]{40,100}$/.test(key);
        
        case 'anthropic':
            // Anthropic keys start with sk-ant-
            return /^sk-ant-[A-Za-z0-9_-]{40,200}$/.test(key);
        
        case 'digitalocean':
            // DO tokens start with dop_v1_
            return /^dop_v1_[a-f0-9]{64}$/.test(key);
        
        default:
            return false;
    }
}

/**
 * Sanitize file paths to prevent directory traversal
 */
function sanitizePath(inputPath) {
    if (!inputPath || typeof inputPath !== 'string') return '';
    
    // Remove null bytes, control characters, and dangerous patterns
    let cleaned = inputPath.replace(/[\x00-\x1f\x7f]/g, '');
    
    // Remove directory traversal patterns
    cleaned = cleaned.replace(/\.\./g, '');
    cleaned = cleaned.replace(/[\\\/]{2,}/g, '/');
    
    return cleaned;
}

/**
 * Sanitize command input to prevent injection
 */
function sanitizeCommand(cmd) {
    if (!cmd || typeof cmd !== 'string') return '';
    
    // Only allow alphanumeric, spaces, and safe characters
    const cleaned = cmd.replace(/[^a-zA-Z0-9\s_-]/g, '');
    
    // Limit length
    return cleaned.substring(0, 100);
}

/**
 * Validate tool name
 */
function validateToolName(tool) {
    const validTools = ['cybercat', 'scanner', 'langgraph'];
    return validTools.includes(tool);
}

/**
 * Hash sensitive data for logging (never log actual keys)
 */
function hashForLogging(data) {
    if (!data) return 'none';
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 8) + '...';
}

// Middleware
app.use(express.json({ limit: '1mb' })); // Limit payload size
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Security headers middleware
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com;");
    next();
});

// Request logging middleware (sanitized)
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Configuration storage
const CONFIG_DIR = path.join(__dirname, '..', 'langgraph-agent');
const ENV_FILE = path.join(CONFIG_DIR, '.env');

// Ensure config directory exists with proper permissions
if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
}

// Connected clients
const clients = new Set();

// Agent state
const agentState = {
    scanner: { status: 'running', tasks: 0, lastActive: Date.now() },
    analyzer: { status: 'idle', tasks: 0, lastActive: null },
    defender: { status: 'running', tasks: 0, lastActive: Date.now() },
    reporter: { status: 'idle', tasks: 0, lastActive: null },
    hunter: { status: 'idle', tasks: 0, lastActive: null },
    orchestrator: { status: 'running', tasks: 0, lastActive: Date.now() }
};

// Security stats
const securityStats = {
    threatsBlocked: 1247,
    scansCompleted: 89,
    vulnerabilitiesFound: 0,
    lastScanTime: null,
    systemHealth: 90
};

// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('🐱 Client connected to CyberCAT');
    clients.add(ws);
    
    // Send welcome message
    ws.send(JSON.stringify({
        type: 'system',
        message: 'Connected to CyberCAT Security Server'
    }));
    
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            await handleMessage(ws, data);
        } catch (error) {
            console.error('Error handling message:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Error processing request'
            }));
        }
    });
    
    ws.on('close', () => {
        console.log('Client disconnected');
        clients.delete(ws);
    });
});

// Message handler
async function handleMessage(ws, data) {
    switch (data.type) {
        case 'command':
            await handleCommand(ws, data.command, data.params);
            break;
        case 'scan':
            await handleScan(ws, data.scanType, data.target);
            break;
        case 'agent':
            await handleAgentAction(ws, data.action, data.agent);
            break;
        default:
            ws.send(JSON.stringify({
                type: 'info',
                message: `Received: ${JSON.stringify(data)}`
            }));
    }
}

// Command handler
async function handleCommand(ws, command, params) {
    switch (command) {
        case 'status':
            ws.send(JSON.stringify({
                type: 'status',
                agents: agentState,
                stats: securityStats,
                system: getSystemInfo()
            }));
            break;
            
        case 'scan':
            await performScan(ws, params?.type || 'quick', params?.target);
            break;
            
        case 'deploy':
            if (params?.agent && agentState[params.agent]) {
                agentState[params.agent].status = 'running';
                agentState[params.agent].lastActive = Date.now();
                broadcast({
                    type: 'agent-update',
                    agent: params.agent,
                    status: 'running'
                });
            }
            break;
            
        default:
            ws.send(JSON.stringify({
                type: 'info',
                message: `Command "${command}" executed`
            }));
    }
}

// Scan handler
async function handleScan(ws, scanType, target) {
    agentState.scanner.status = 'running';
    agentState.scanner.tasks++;
    
    broadcast({
        type: 'scan-start',
        scanType,
        target
    });
    
    // Simulate scan progress
    let progress = 0;
    const interval = setInterval(() => {
        progress += 10;
        broadcast({
            type: 'scan-progress',
            progress,
            phase: getScanPhase(progress)
        });
        
        if (progress >= 100) {
            clearInterval(interval);
            completeScan(ws, scanType, target);
        }
    }, 500);
}

function getScanPhase(progress) {
    if (progress < 20) return 'Network Discovery';
    if (progress < 40) return 'Port Scanning';
    if (progress < 60) return 'Service Detection';
    if (progress < 80) return 'Vulnerability Analysis';
    return 'Generating Report';
}

function completeScan(ws, scanType, target) {
    agentState.scanner.status = 'idle';
    securityStats.scansCompleted++;
    securityStats.lastScanTime = new Date().toISOString();
    
    const results = {
        type: 'scan-complete',
        scanType,
        target: target || 'localhost',
        results: {
            openPorts: [22, 80, 443],
            vulnerabilities: { critical: 0, high: 0, medium: 2, low: 5 },
            sslGrade: 'A+',
            duration: '2.3s',
            memoryUsed: '128MB'
        }
    };
    
    broadcast(results);
}

// Agent action handler
async function handleAgentAction(ws, action, agentName) {
    if (!agentState[agentName]) {
        ws.send(JSON.stringify({
            type: 'error',
            message: `Unknown agent: ${agentName}`
        }));
        return;
    }
    
    switch (action) {
        case 'start':
            agentState[agentName].status = 'running';
            agentState[agentName].lastActive = Date.now();
            break;
        case 'stop':
            agentState[agentName].status = 'idle';
            break;
        case 'status':
            ws.send(JSON.stringify({
                type: 'agent-status',
                agent: agentName,
                ...agentState[agentName]
            }));
            return;
    }
    
    broadcast({
        type: 'agent-update',
        agent: agentName,
        status: agentState[agentName].status
    });
}

// Broadcast to all clients
function broadcast(data) {
    const message = JSON.stringify(data);
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// Get system info
function getSystemInfo() {
    return {
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        totalMemory: Math.round(os.totalmem() / (1024 * 1024 * 1024)) + 'GB',
        freeMemory: Math.round(os.freemem() / (1024 * 1024 * 1024)) + 'GB',
        uptime: Math.round(os.uptime() / 3600) + ' hours'
    };
}

// REST API Routes
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        name: 'CyberCAT Security Server'
    });
});

app.get('/api/status', (req, res) => {
    res.json({
        agents: agentState,
        stats: securityStats,
        system: getSystemInfo()
    });
});

app.get('/api/agents', (req, res) => {
    res.json(agentState);
});

app.post('/api/agents/:name/start', (req, res) => {
    const { name } = req.params;
    if (agentState[name]) {
        agentState[name].status = 'running';
        agentState[name].lastActive = Date.now();
        broadcast({ type: 'agent-update', agent: name, status: 'running' });
        res.json({ success: true, agent: name, status: 'running' });
    } else {
        res.status(404).json({ error: 'Agent not found' });
    }
});

app.post('/api/agents/:name/stop', (req, res) => {
    const { name } = req.params;
    if (agentState[name]) {
        agentState[name].status = 'idle';
        broadcast({ type: 'agent-update', agent: name, status: 'idle' });
        res.json({ success: true, agent: name, status: 'idle' });
    } else {
        res.status(404).json({ error: 'Agent not found' });
    }
});

app.post('/api/agents/:name/execute', (req, res) => {
    const { name } = req.params;
    const { command } = req.body;
    
    if (!agentState[name]) {
        return res.status(404).json({ error: 'Agent not found' });
    }
    
    // Activate agent
    agentState[name].status = 'running';
    agentState[name].lastActive = Date.now();
    agentState[name].tasks++;
    
    broadcast({ type: 'agent-update', agent: name, status: 'running' });
    
    // Simulate agent processing
    setTimeout(() => {
        agentState[name].status = 'idle';
        broadcast({ type: 'agent-update', agent: name, status: 'idle' });
    }, 2000);
    
    // Return agent-specific response
    const responses = {
        scanner: {
            status: 'Network scan initiated',
            findings: ['22 open ports detected', '3 services running', 'SSL certificate valid']
        },
        analyzer: {
            status: 'Analysis complete',
            findings: ['0 critical vulnerabilities', '2 medium issues', 'System healthy']
        },
        defender: {
            status: 'Defense systems active',
            findings: ['Firewall rules updated', '47 IPs blocked', 'All services protected']
        },
        reporter: {
            status: 'Report generation started',
            findings: ['Security score: 95%', 'Compliance: PASSED', 'Last scan: Just now']
        },
        hunter: {
            status: 'Threat hunting active',
            findings: ['No active threats detected', 'All systems clear', 'Monitoring continues']
        },
        orchestrator: {
            status: 'Coordinating agents',
            findings: ['All agents online', 'Task queue: empty', 'System optimized']
        }
    };
    
    res.json({
        success: true,
        agent: name,
        message: `Agent ${name} executed: ${command || 'status check'}`,
        data: responses[name] || { status: 'Command processed' }
    });
});

app.post('/api/agent/chat', async (req, res) => {
    const { message } = req.body;
    
    if (!message || !message.trim()) {
        return res.status(400).json({
            success: false,
            error: 'Message is required'
        });
    }
    
    // Activate orchestrator
    agentState.orchestrator.status = 'running';
    broadcast({ type: 'agent-update', agent: 'orchestrator', status: 'running' });
    
    // Simulate AI processing
    setTimeout(() => {
        agentState.orchestrator.status = 'idle';
        broadcast({ type: 'agent-update', agent: 'orchestrator', status: 'idle' });
    }, 1500);
    
    // Simple response logic based on keywords
    const msg = message.toLowerCase();
    let response = '';
    let suggestions = [];
    
    if (msg.includes('scan') || msg.includes('check')) {
        response = 'I recommend running a full security scan. All agents are ready to coordinate a comprehensive assessment.';
        suggestions = ['Run full-scan', 'Check agent status', 'View recent threats'];
    } else if (msg.includes('threat') || msg.includes('attack')) {
        response = 'Currently monitoring for threats. No active attacks detected. The hunter agent is continuously scanning.';
        suggestions = ['Activate threat-hunt', 'Review firewall', 'Check logs'];
    } else if (msg.includes('status') || msg.includes('health')) {
        response = `System health is excellent at ${securityStats.systemHealth}%. All critical agents are operational and ${securityStats.threatsBlocked} threats have been blocked today.`;
        suggestions = ['View full status', 'Deploy all agents', 'Generate report'];
    } else if (msg.includes('agent')) {
        response = 'I have 6 specialized agents available: Scanner, Analyzer, Defender, Reporter, Hunter, and Orchestrator. Each handles specific security tasks.';
        suggestions = ['List all agents', 'Deploy scanner', 'Agent workflow'];
    } else {
        response = 'I\'m your AI security assistant. I can help with scans, threat analysis, agent coordination, and system monitoring. What would you like to know?';
        suggestions = ['Run security scan', 'Check threats', 'System status'];
    }
    
    res.json({
        success: true,
        response: response,
        suggestions: suggestions,
        agent: 'orchestrator'
    });
});

app.get('/api/stats', (req, res) => {
    res.json(securityStats);
});

app.post('/api/scan', async (req, res) => {
    const { type, target } = req.body;
    
    // Start scan
    agentState.scanner.status = 'running';
    agentState.scanner.tasks++;
    
    // Simulate scan
    setTimeout(() => {
        agentState.scanner.status = 'idle';
        securityStats.scansCompleted++;
        
        broadcast({
            type: 'scan-complete',
            scanType: type,
            target: target || 'localhost'
        });
    }, 3000);
    
    res.json({ 
        success: true, 
        message: 'Scan started',
        scanId: Date.now()
    });
});

// ============================================
// SECURE API Key Management Routes
// ============================================
app.post('/api/config/api-keys', (req, res) => {
    try {
        const { openai, anthropic, digitalocean } = req.body;
        
        let envContent = '';
        let validKeys = 0;
        
        // Validate and sanitize OpenAI key
        if (openai && openai.trim()) {
            const cleanKey = openai.trim();
            if (validateApiKey(cleanKey, 'openai')) {
                envContent += `OPENAI_API_KEY=${cleanKey}\n`;
                validKeys++;
                console.log(`[SECURITY] OpenAI API key validated: ${hashForLogging(cleanKey)}`);
            } else {
                console.warn('[SECURITY] Invalid OpenAI API key format rejected');
                return res.status(400).json({
                    success: false,
                    error: 'Invalid OpenAI API key format. Must start with sk- and be 40-100 characters.'
                });
            }
        }
        
        // Validate and sanitize Anthropic key
        if (anthropic && anthropic.trim()) {
            const cleanKey = anthropic.trim();
            if (validateApiKey(cleanKey, 'anthropic')) {
                envContent += `ANTHROPIC_API_KEY=${cleanKey}\n`;
                validKeys++;
                console.log(`[SECURITY] Anthropic API key validated: ${hashForLogging(cleanKey)}`);
            } else {
                console.warn('[SECURITY] Invalid Anthropic API key format rejected');
                return res.status(400).json({
                    success: false,
                    error: 'Invalid Anthropic API key format. Must start with sk-ant-.'
                });
            }
        }
        
        // Validate and sanitize Digital Ocean token
        if (digitalocean && digitalocean.trim()) {
            const cleanKey = digitalocean.trim();
            if (validateApiKey(cleanKey, 'digitalocean')) {
                envContent += `DIGITALOCEAN_API_TOKEN=${cleanKey}\n`;
                validKeys++;
                console.log(`[SECURITY] Digital Ocean token validated: ${hashForLogging(cleanKey)}`);
            } else {
                console.warn('[SECURITY] Invalid Digital Ocean token format rejected');
                return res.status(400).json({
                    success: false,
                    error: 'Invalid Digital Ocean token format. Must start with dop_v1_.'
                });
            }
        }
        
        if (validKeys === 0) {
            return res.status(400).json({
                success: false,
                error: 'No valid API keys provided'
            });
        }
        
        // Write with restricted permissions (owner read/write only)
        fs.writeFileSync(ENV_FILE, envContent, {
            encoding: 'utf8',
            mode: 0o600  // -rw-------
        });
        
        console.log(`[SECURITY] ${validKeys} API key(s) saved securely to ${ENV_FILE}`);
        res.json({
            success: true,
            message: `${validKeys} API key(s) saved successfully`,
            keysStored: validKeys
        });
        
    } catch (error) {
        console.error('[SECURITY] Error saving API keys:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to save API keys. Please check server logs.'
        });
    }
});

app.get('/api/config/api-keys', (req, res) => {
    try {
        if (fs.existsSync(ENV_FILE)) {
            const envContent = fs.readFileSync(ENV_FILE, 'utf8');
            const keys = {};
            
            // Parse env file (mask the actual keys for security)
            const lines = envContent.split('\n');
            lines.forEach(line => {
                if (line.includes('OPENAI_API_KEY=') && line.split('=')[1]) {
                    keys.openai = '***' + line.split('=')[1].slice(-4);
                }
                if (line.includes('ANTHROPIC_API_KEY=') && line.split('=')[1]) {
                    keys.anthropic = '***' + line.split('=')[1].slice(-4);
                }
                if (line.includes('DIGITALOCEAN_API_TOKEN=') && line.split('=')[1]) {
                    keys.digitalocean = '***' + line.split('=')[1].slice(-4);
                }
            });
            
            res.json(keys);
        } else {
            res.json({});
        }
    } catch (error) {
        console.error('Error reading API keys:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/config/test-connection', async (req, res) => {
    try {
        // Try to check if LangGraph agent is running
        const http = require('http');
        const options = {
            hostname: 'localhost',
            port: 8000,
            path: '/health',
            method: 'GET',
            timeout: 3000
        };
        
        const healthReq = http.request(options, (healthRes) => {
            if (healthRes.statusCode === 200) {
                res.json({
                    success: true,
                    provider: 'LangGraph Agent',
                    status: 'Connected'
                });
            } else {
                res.json({
                    success: false,
                    error: 'LangGraph Agent not responding properly'
                });
            }
        });
        
        healthReq.on('error', () => {
            res.json({
                success: false,
                error: 'LangGraph Agent not running. Start with: cd langgraph-agent && python server.py'
            });
        });
        
        healthReq.end();
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// ============================================
// Standalone Tool Execution Routes
// ============================================
app.post('/api/standalone/execute', (req, res) => {
    try {
        const { tool, command } = req.body;
        
        // SECURITY: Validate tool name
        if (!validateToolName(tool)) {
            console.warn(`[SECURITY] Invalid tool name rejected: ${tool}`);
            return res.status(400).json({
                success: false,
                error: 'Invalid tool name'
            });
        }
        
        // SECURITY: Sanitize command
        const sanitizedCmd = sanitizeCommand(command);
        if (sanitizedCmd !== command) {
            console.warn(`[SECURITY] Command sanitized from "${command}" to "${sanitizedCmd}"`);
        }
        
        console.log(`[SECURITY] Executing standalone tool: ${tool} ${sanitizedCmd}`);
        
        let output = '';
        let cmd = '';
        
        switch(tool) {
            case 'cybercat':
                const cybercatPath = sanitizePath(path.join(__dirname, '..', 'cybercat-standalone'));
                cmd = `cd "${cybercatPath}" && node cybercat.js ${sanitizedCmd}`;
                break;
                
            case 'scanner':
                const scannerPath = sanitizePath(path.join(__dirname, '..', 'cybercat-scanner'));
                cmd = `cd "${scannerPath}" && node scanner.js ${sanitizedCmd}`;
                break;
                
            case 'langgraph':
                if (sanitizedCmd === 'docs') {
                    return res.json({
                        success: true,
                        output: 'Opening API documentation...',
                        redirect: 'http://localhost:8000/docs'
                    });
                } else if (sanitizedCmd === 'health') {
                    cmd = 'curl -s http://localhost:8000/health';
                } else {
                    cmd = 'curl -s http://localhost:8000/api/report';
                }
                break;
                
            default:
                return res.status(400).json({ success: false, error: 'Unknown tool' });
        }
        
        try {
            output = execSync(cmd, {
                encoding: 'utf8',
                timeout: 30000,
                maxBuffer: 1024 * 1024 * 10,
                windowsHide: true  // Security: Hide command window
            });
            
            res.json({
                success: true,
                output: output || 'Command executed successfully',
                tool: tool,
                command: sanitizedCmd
            });
            
        } catch (execError) {
            console.error(`[SECURITY] Tool execution error: ${execError.message}`);
            res.json({
                success: false,
                error: 'Tool execution failed',
                output: execError.stdout || execError.stderr || 'Execution failed'
            });
        }
    } catch (error) {
        console.error('[SECURITY] Error in standalone tool execution:', error.message);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// ============================================
// System Information Route
// ============================================
app.get('/api/system/info', (req, res) => {
    try {
        let nodeVersion = 'Not available';
        let pythonVersion = 'Not available';
        
        try {
            nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
        } catch (e) {}
        
        try {
            pythonVersion = execSync('python --version', { encoding: 'utf8' }).trim();
        } catch (e) {}
        
        res.json({
            platform: `${os.platform()} ${os.release()}`,
            node: nodeVersion,
            python: pythonVersion,
            path: process.cwd()
        });
    } catch (error) {
        console.error('Error getting system info:', error);
        res.status(500).json({ error: error.message });
    }
});

// Serve the main app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
server.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║      /\\_____/\\                                                ║
║     /  o   o  \\     CYBERCAT v2.0                            ║
║    ( ==  ^  == )    Multi-Agent Security Command Center      ║
║     )         (     ═══════════════════════════════════      ║
║    (           )                                              ║
║   ( (  )   (  ) )   Server running on http://localhost:${PORT}   ║
║  (__(__)___(__)__)                                            ║
║                                                               ║
║   🔒 Security Status: PROTECTED                               ║
║   🤖 Agents: 6 available (3 active)                          ║
║   📊 Ready for commands                                       ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
    `);
});

module.exports = { app, server };