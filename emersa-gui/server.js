// CyberCAT Multi-Agent Security Command Center Server
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const os = require('os');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

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