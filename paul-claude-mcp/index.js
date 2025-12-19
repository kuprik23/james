/**
 * Paul-Claude MCP Server
 * AI-powered MCP server that connects Paul to Claude for PC interaction
 * with real-time security scanner data access
 * 
 * Copyright © 2025 Emersa Ltd. All Rights Reserved.
 */

import Anthropic from '@anthropic-ai/sdk';
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { WebSocket, WebSocketServer } from 'ws';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3200;

app.use(cors());
app.use(express.json());

// Initialize Claude client
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || ''
});

// Scanner data connection
const SCANNER_URL = process.env.SCANNER_URL || 'http://localhost:3000';
let scannerData = {
    stats: {},
    tasks: [],
    threats: [],
    systemInfo: {},
    lastUpdate: null
};

/**
 * MCP Server Implementation
 */

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        version: '1.0.0',
        service: 'paul-claude-mcp',
        claude: !!process.env.ANTHROPIC_API_KEY,
        scanner: !!scannerData.lastUpdate
    });
});

// MCP Initialize
app.post('/initialize', (req, res) => {
    res.json({
        protocolVersion: '2024-11-05',
        capabilities: {
            tools: {},
            resources: {},
            prompts: {}
        },
        serverInfo: {
            name: 'Paul-Claude MCP Server',
            version: '1.0.0'
        }
    });
});

// MCP Tools List
app.post('/tools/list', (req, res) => {
    res.json({
        tools: [
            {
                name: 'get_scanner_status',
                description: 'Get current security scanner status and statistics',
                inputSchema: {
                    type: 'object',
                    properties: {},
                    required: []
                }
            },
            {
                name: 'get_scan_results',
                description: 'Get latest scan results from background scanner',
                inputSchema: {
                    type: 'object',
                    properties: {
                        taskId: { type: 'string', description: 'Specific task ID (optional)' }
                    }
                }
            },
            {
                name: 'get_threats',
                description: 'Get all detected threats',
                inputSchema: {
                    type: 'object',
                    properties: {
                        limit: { type: 'number', description: 'Maximum threats to return' }
                    }
                }
            },
            {
                name: 'run_security_scan',
                description: 'Run immediate security scan',
                inputSchema: {
                    type: 'object',
                    properties: {
                        type: { 
                            type: 'string', 
                            enum: ['port', 'system', 'vuln', 'full'],
                            description: 'Type of scan to run'
                        },
                        target: { type: 'string', description: 'Target to scan (host/directory)' }
                    },
                    required: ['type']
                }
            },
            {
                name: 'get_system_info',
                description: 'Get current system information and security status',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'analyze_threat',
                description: 'Get AI analysis of a specific threat using Claude',
                inputSchema: {
                    type: 'object',
                    properties: {
                        threat: { type: 'object', description: 'Threat data to analyze' }
                    },
                    required: ['threat']
                }
            },
            {
                name: 'get_recommendations',
                description: 'Get AI-powered security recommendations based on current state',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            }
        ]
    });
});

// MCP Tool Call
app.post('/tools/call', async (req, res) => {
    const { name, arguments: args } = req.body;
    
    try {
        let result;
        
        switch (name) {
            case 'get_scanner_status':
                result = await getScannerStatus();
                break;
                
            case 'get_scan_results':
                result = await getScanResults(args?.taskId);
                break;
                
            case 'get_threats':
                result = await getThreats(args?.limit || 10);
                break;
                
            case 'run_security_scan':
                result = await runSecurityScan(args.type, args.target);
                break;
                
            case 'get_system_info':
                result = await getSystemInfo();
                break;
                
            case 'analyze_threat':
                result = await analyzeThreatWithClaude(args.threat);
                break;
                
            case 'get_recommendations':
                result = await getAIRecommendations();
                break;
                
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
        
        res.json({
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result, null, 2)
                }
            ]
        });
        
    } catch (error) {
        res.status(500).json({
            error: error.message,
            isError: true
        });
    }
});

/**
 * Tool Implementations
 */

async function getScannerStatus() {
    try {
        const response = await axios.get(`${SCANNER_URL}/api/scanner/stats`);
        scannerData.stats = response.data;
        scannerData.lastUpdate = new Date();
        return response.data;
    } catch (error) {
        return { error: 'Scanner not available', offline: true };
    }
}

async function getScanResults(taskId) {
    try {
        const response = await axios.get(`${SCANNER_URL}/api/scanner/tasks`);
        scannerData.tasks = response.data;
        
        if (taskId) {
            return response.data.find(t => t.id === taskId);
        }
        return response.data;
    } catch (error) {
        return { error: 'Failed to get scan results' };
    }
}

async function getThreats(limit = 10) {
    // Return recent threats from scanner data
    return scannerData.threats.slice(0, limit);
}

async function runSecurityScan(type, target) {
    try {
        const response = await axios.post(`${SCANNER_URL}/api/scanner/quick-scan`, {
            type,
            target
        });
        return response.data;
    } catch (error) {
        return { error: 'Failed to run scan', message: error.message };
    }
}

async function getSystemInfo() {
    try {
        const response = await axios.get(`${SCANNER_URL}/api/scan/system`);
        scannerData.systemInfo = response.data;
        return response.data;
    } catch (error) {
        return { error: 'Failed to get system info' };
    }
}

async function analyzeThreatWithClaude(threat) {
    if (!process.env.ANTHROPIC_API_KEY) {
        return { error: 'Claude API key not configured' };
    }
    
    try {
        const message = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1024,
            messages: [{
                role: 'user',
                content: `As a cybersecurity expert, analyze this threat and provide:
1. Severity assessment
2. Potential impact
3. Recommended actions
4. Prevention measures

Threat Data:
${JSON.stringify(threat, null, 2)}`
            }]
        });
        
        return {
            analysis: message.content[0].text,
            model: 'claude-3-5-sonnet',
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        return { error: 'Claude analysis failed', message: error.message };
    }
}

async function getAIRecommendations() {
    if (!process.env.ANTHROPIC_API_KEY) {
        return { error: 'Claude API key not configured' };
    }
    
    try {
        const stats = await getScannerStatus();
        const systemInfo = await getSystemInfo();
        
        const message = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 2048,
            messages: [{
                role: 'user',
                content: `As a cybersecurity expert, analyze the current security posture and provide specific recommendations.

Current Status:
${JSON.stringify({ stats, systemInfo }, null, 2)}

Provide:
1. Top 5 security recommendations
2. Priority level for each
3. Implementation steps
4. Expected impact`
            }]
        });
        
        return {
            recommendations: message.content[0].text,
            model: 'claude-3-5-sonnet',
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        return { error: 'Failed to get recommendations', message: error.message };
    }
}

/**
 * Real-time scanner data updates via WebSocket
 */
async function startScannerDataSync() {
    setInterval(async () => {
        try {
            // Fetch latest scanner data
            const stats = await getScannerStatus();
            const tasks = await getScanResults();
            const system = await getSystemInfo();
            
            scannerData = {
                stats,
                tasks,
                threats: extractThreats(tasks),
                systemInfo: system,
                lastUpdate: new Date()
            };
            
            // Broadcast to connected clients
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: 'scanner-update',
                        data: scannerData
                    }));
                }
            });
            
        } catch (error) {
            console.error('[Paul-Claude-MCP] Scanner sync error:', error.message);
        }
    }, 5000); // Update every 5 seconds
}

function extractThreats(tasks) {
    const threats = [];
    
    for (const task of tasks || []) {
        if (task.results) {
            if (task.results.threatsFound) {
                threats.push(...(task.results.threats || []));
            }
            if (task.results.vulnerabilities) {
                threats.push(...task.results.vulnerabilities);
            }
        }
    }
    
    return threats;
}

// WebSocket server for real-time updates
const server = app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🤖 PAUL-CLAUDE MCP SERVER                               ║
║                                                            ║
║   Claude-powered AI with Real-time Scanner Integration    ║
║                                                            ║
║   Server: http://localhost:${PORT}                          ║
║   WebSocket: ws://localhost:${PORT}                         ║
║                                                            ║
║   Tools Available: 7                                       ║
║   - Scanner Status & Results                               ║
║   - Threat Detection & Analysis                            ║
║   - AI-powered Recommendations                             ║
║   - System Information                                     ║
║                                                            ║
║   Connect your web app to this MCP server for             ║
║   AI-powered security analysis with Claude!                ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);
    
    // Start syncing scanner data
    startScannerDataSync();
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    console.log('[Paul-Claude-MCP] Client connected');
    
    // Send current scanner data immediately
    ws.send(JSON.stringify({
        type: 'initial-data',
        data: scannerData
    }));
    
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message.toString());
            
            if (data.type === 'chat') {
                // Handle chat message with Claude
                const response = await handleChatWithClaude(data.message, scannerData);
                ws.send(JSON.stringify({
                    type: 'chat-response',
                    response
                }));
            }
        } catch (error) {
            ws.send(JSON.stringify({
                type: 'error',
                error: error.message
            }));
        }
    });
    
    ws.on('close', () => {
        console.log('[Paul-Claude-MCP] Client disconnected');
    });
});

/**
 * Handle chat with Claude and scanner context
 */
async function handleChatWithClaude(userMessage, context) {
    if (!process.env.ANTHROPIC_API_KEY) {
        return {
            error: true,
            message: 'Claude API key not configured. Set ANTHROPIC_API_KEY in .env file.'
        };
    }
    
    try {
        const message = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 4096,
            system: `You are Paul, an advanced AI security assistant with real-time access to system security data.

Current Security Status:
- Total Scans: ${context.stats?.totalScans || 0}
- Threats Found: ${context.stats?.threatsFound || 0}
- Active Tasks: ${context.stats?.activeTasks || 0}
- Scanner Uptime: ${formatUptime(context.stats?.uptime || 0)}

You have access to:
1. Real-time scanner statistics
2. Recent scan results
3. Threat detections
4. System information
5. Security tools

When users ask about security:
- Provide specific, actionable advice
- Reference actual scan data when available
- Explain threats in detail
- Suggest concrete remediation steps
- Use the MCP tools to get fresh data if needed`,
            messages: [{
                role: 'user',
                content: userMessage
            }]
        });
        
        return {
            success: true,
            response: message.content[0].text,
            model: 'claude-3-5-sonnet',
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        return {
            error: true,
            message: `Claude error: ${error.message}`
        };
    }
}

function formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
}

console.log('[Paul-Claude-MCP] Initializing...');
