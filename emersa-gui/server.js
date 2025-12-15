// EMERSA AI Workspace Server
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// File upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf', 'text/plain', 'application/json',
            'text/csv', 'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'), false);
        }
    }
});

// Memory store (in-memory for demo, would use database in production)
const memoryStore = {
    entries: [],
    add(entry) {
        this.entries.push({
            id: Date.now(),
            ...entry,
            timestamp: new Date().toISOString()
        });
    },
    search(query) {
        return this.entries.filter(e => 
            JSON.stringify(e).toLowerCase().includes(query.toLowerCase())
        );
    },
    getAll() {
        return this.entries;
    }
};

// Connected clients
const clients = new Set();

// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('Client connected');
    clients.add(ws);
    
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            await handleMessage(ws, data);
        } catch (error) {
            console.error('Error handling message:', error);
            ws.send(JSON.stringify({
                type: 'error',
                content: 'Error processing request'
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
        case 'message':
            await handleChatMessage(ws, data);
            break;
        case 'command':
            await handleCommand(ws, data);
            break;
        case 'analyze':
            await handleAnalysis(ws, data);
            break;
        case 'scan':
            await handleSecurityScan(ws, data);
            break;
        default:
            ws.send(JSON.stringify({
                type: 'response',
                content: 'Unknown message type'
            }));
    }
}

// Chat message handler
async function handleChatMessage(ws, data) {
    const { content, model, files } = data;
    
    // Store in memory
    memoryStore.add({
        type: 'chat',
        role: 'user',
        content,
        files,
        model
    });
    
    // Process with AI (placeholder - would integrate with actual AI API)
    const response = await processWithAI(content, model, files);
    
    // Store response
    memoryStore.add({
        type: 'chat',
        role: 'assistant',
        content: response
    });
    
    ws.send(JSON.stringify({
        type: 'response',
        content: response
    }));
}

// AI processing (placeholder)
async function processWithAI(content, model, files) {
    // This would integrate with OpenAI, Claude, or local LLM
    // For now, return intelligent placeholder responses
    
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('analyze') || lowerContent.includes('website')) {
        return `I'll analyze that for you. Here's what I found:

**Analysis Results:**
- Security: Good (8/10)
- Performance: Moderate (6/10)
- SEO: Needs improvement (5/10)

Would you like me to provide more detailed recommendations?`;
    }
    
    if (lowerContent.includes('security') || lowerContent.includes('scan')) {
        return `**Security Assessment:**

✅ No critical vulnerabilities detected
⚠️ 2 medium-risk issues found:
  - Outdated SSL configuration
  - Missing security headers

🔒 Recommendations:
1. Update TLS to 1.3
2. Add Content-Security-Policy header
3. Enable HSTS

Would you like me to generate a detailed report?`;
    }
    
    if (lowerContent.includes('generate') || lowerContent.includes('create')) {
        return `I can help you generate content. What type would you like?

**Available Options:**
- 📝 Text content (articles, documentation)
- 💻 Code (any language/framework)
- 📊 Reports and analysis
- 🎨 Image descriptions

Please specify what you'd like me to create.`;
    }
    
    if (files && files.length > 0) {
        return `I've received ${files.length} file(s). I can:

- 📄 Extract and analyze text content
- 🖼️ Describe images
- 📊 Process data files
- 🔍 Search for patterns

What would you like me to do with these files?`;
    }
    
    return `I understand you're asking about: "${content}"

I'm EMERSA, your AI workspace assistant. I can help with:
- 🔍 Website and data analysis
- 🔐 Security assessments
- ✨ Content generation
- 🔗 API integrations
- 💾 Knowledge management

How can I assist you further?`;
}

// Command handler
async function handleCommand(ws, data) {
    const { command, params } = data;
    
    switch (command) {
        case 'droplets':
            const droplets = await getDigitalOceanDroplets();
            ws.send(JSON.stringify({
                type: 'result',
                cardId: 'website-analysis',
                content: formatDroplets(droplets)
            }));
            break;
            
        case 'memory-search':
            const results = memoryStore.search(params.query);
            ws.send(JSON.stringify({
                type: 'response',
                content: `Found ${results.length} matching entries.`
            }));
            break;
            
        default:
            ws.send(JSON.stringify({
                type: 'response',
                content: `Command "${command}" executed.`
            }));
    }
}

// Analysis handler
async function handleAnalysis(ws, data) {
    const { url, type } = data;
    
    // Simulate analysis
    ws.send(JSON.stringify({
        type: 'result',
        cardId: 'website-analysis',
        content: `
            <h4>Analysis: ${url}</h4>
            <p><strong>Type:</strong> ${type}</p>
            <p><strong>Status:</strong> Complete</p>
            <p><strong>Score:</strong> 85/100</p>
        `
    }));
}

// Security scan handler
async function handleSecurityScan(ws, data) {
    const { target, scanType } = data;
    
    // Simulate progressive scan
    let progress = 0;
    const interval = setInterval(() => {
        progress += 20;
        ws.send(JSON.stringify({
            type: 'result',
            cardId: 'security-results',
            content: `<p>Scanning... ${progress}%</p>`
        }));
        
        if (progress >= 100) {
            clearInterval(interval);
            ws.send(JSON.stringify({
                type: 'result',
                cardId: 'security-results',
                content: `
                    <h4>✅ Scan Complete</h4>
                    <p><strong>Target:</strong> ${target}</p>
                    <p><strong>Type:</strong> ${scanType}</p>
                    <p><strong>Vulnerabilities:</strong> 0 critical, 2 medium</p>
                `
            }));
        }
    }, 500);
}

// Digital Ocean integration
async function getDigitalOceanDroplets() {
    try {
        // Try to get token from secure storage
        const token = process.env.DO_API_TOKEN || await getSecureToken();
        
        if (!token) {
            return { error: 'No API token configured' };
        }
        
        const response = await fetch('https://api.digitalocean.com/v2/droplets', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching droplets:', error);
        return { error: error.message };
    }
}

async function getSecureToken() {
    // Try to read from secure storage
    const credPath = path.join(
        process.env.LOCALAPPDATA || '',
        'James', 'credentials', 'JamesAI_DigitalOcean.enc'
    );
    
    if (fs.existsSync(credPath)) {
        // Would decrypt using DPAPI in production
        return null; // Placeholder
    }
    
    return null;
}

function formatDroplets(data) {
    if (data.error) {
        return `<p class="error">Error: ${data.error}</p>`;
    }
    
    if (!data.droplets || data.droplets.length === 0) {
        return '<p>No droplets found.</p>';
    }
    
    return data.droplets.map(d => `
        <div class="droplet-item">
            <strong>${d.name}</strong>
            <span>${d.status}</span>
            <span>${d.region?.name || 'Unknown'}</span>
        </div>
    `).join('');
}

// REST API Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/droplets', async (req, res) => {
    const droplets = await getDigitalOceanDroplets();
    res.json(droplets);
});

app.post('/api/upload', upload.array('files', 10), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
    }
    
    const fileInfo = req.files.map(f => ({
        name: f.originalname,
        size: f.size,
        path: f.path,
        type: f.mimetype
    }));
    
    res.json({ success: true, files: fileInfo });
});

app.post('/api/analyze', async (req, res) => {
    const { url, type } = req.body;
    
    // Placeholder analysis
    res.json({
        url,
        type,
        score: Math.floor(Math.random() * 30) + 70,
        issues: [],
        recommendations: [
            'Enable HTTPS',
            'Add security headers',
            'Optimize images'
        ]
    });
});

app.get('/api/memory', (req, res) => {
    res.json({
        entries: memoryStore.getAll().length,
        size: JSON.stringify(memoryStore.getAll()).length
    });
});

app.post('/api/memory', (req, res) => {
    const { title, content, category } = req.body;
    memoryStore.add({ title, content, category });
    res.json({ success: true });
});

app.get('/api/memory/search', (req, res) => {
    const { q } = req.query;
    const results = memoryStore.search(q || '');
    res.json({ results });
});

// Serve the main app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
server.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ███████╗███╗   ███╗███████╗██████╗ ███████╗ █████╗     ║
║   ██╔════╝████╗ ████║██╔════╝██╔══██╗██╔════╝██╔══██╗    ║
║   █████╗  ██╔████╔██║█████╗  ██████╔╝███████╗███████║    ║
║   ██╔══╝  ██║╚██╔╝██║██╔══╝  ██╔══██╗╚════██║██╔══██║    ║
║   ███████╗██║ ╚═╝ ██║███████╗██║  ██║███████║██║  ██║    ║
║   ╚══════╝╚═╝     ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝    ║
║                                                           ║
║   AI Workspace Server                                     ║
║   Running on http://localhost:${PORT}                        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
});

module.exports = { app, server };