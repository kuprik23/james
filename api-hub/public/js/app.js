/**
 * James API Hub - Frontend Application
 */

class APIHub {
    constructor() {
        this.ws = null;
        this.apis = {};
        this.mcpServers = {};
        this.commandHistory = [];
        this.historyIndex = -1;
        this.startTime = Date.now();
        
        this.init();
    }
    
    init() {
        this.connectWebSocket();
        this.bindEvents();
        this.startUptimeTimer();
    }
    
    // WebSocket Connection
    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
            this.updateConnectionStatus('connected');
            this.log('Connected to API Hub server', 'success');
        };
        
        this.ws.onclose = () => {
            this.updateConnectionStatus('disconnected');
            this.log('Disconnected from server. Reconnecting...', 'error');
            setTimeout(() => this.connectWebSocket(), 3000);
        };
        
        this.ws.onerror = (error) => {
            this.log('WebSocket error', 'error');
        };
        
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
        };
    }
    
    // Handle incoming WebSocket messages
    handleMessage(data) {
        switch (data.type) {
            case 'system':
                this.log(data.message, 'system');
                break;
                
            case 'configs':
                this.apis = data.data;
                this.updateApiList();
                this.updateApiSelect();
                this.updateApiCount();
                break;
                
            case 'success':
                this.log(data.message, 'success');
                break;
                
            case 'error':
                this.log(data.message, 'error');
                break;
                
            case 'response':
                this.displayResponse(data.data);
                break;
                
            case 'testResult':
                this.displayTestResult(data.data);
                break;
                
            case 'commandResult':
                this.displayCommandResult(data.data);
                break;
                
            case 'log':
                this.updateRequestCount();
                break;
                
            case 'history':
                this.displayHistory(data.data);
                break;
                
            case 'mcpServers':
                this.mcpServers = data.data;
                this.updateMcpServerList();
                break;
                
            case 'mcpResult':
                this.displayMcpResult(data);
                break;
        }
    }
    
    // Bind UI events
    bindEvents() {
        // Terminal input
        const terminalInput = document.getElementById('terminalInput');
        terminalInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.executeCommand(terminalInput.value);
                terminalInput.value = '';
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigateHistory(-1);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.navigateHistory(1);
            }
        });
        
        // Send button
        document.getElementById('sendBtn').addEventListener('click', () => {
            this.executeCommand(terminalInput.value);
            terminalInput.value = '';
        });
        
        // Clear button
        document.getElementById('clearBtn').addEventListener('click', () => {
            document.getElementById('terminalOutput').innerHTML = '';
        });
        
        // History button
        document.getElementById('historyBtn').addEventListener('click', () => {
            this.sendCommand('history');
        });
        
        // Refresh button
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.ws.send(JSON.stringify({ action: 'getConfigs' }));
        });
        
        // Add API button
        document.getElementById('addApiBtn').addEventListener('click', () => {
            this.showModal('addApiModal');
        });
        
        // Close modal
        document.getElementById('closeModal').addEventListener('click', () => {
            this.hideModal('addApiModal');
        });
        
        document.getElementById('cancelAddApi').addEventListener('click', () => {
            this.hideModal('addApiModal');
        });
        
        // Save API
        document.getElementById('saveApiBtn').addEventListener('click', () => {
            this.saveNewApi();
        });
        
        // Auth type change
        document.getElementById('newApiAuthType').addEventListener('change', (e) => {
            this.updateAuthFields(e.target.value);
        });
        
        // Execute request
        document.getElementById('executeBtn').addEventListener('click', () => {
            this.executeRequest();
        });
        
        // Click outside modal to close
        document.getElementById('addApiModal').addEventListener('click', (e) => {
            if (e.target.id === 'addApiModal') {
                this.hideModal('addApiModal');
            }
        });
    }
    
    // Execute terminal command
    executeCommand(command) {
        if (!command.trim()) return;
        
        // Add to history
        this.commandHistory.push(command);
        this.historyIndex = this.commandHistory.length;
        
        // Display command
        this.log(command, 'command');
        
        // Send to server
        this.sendCommand(command);
    }
    
    // Send command to server
    sendCommand(command) {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                action: 'command',
                payload: { command }
            }));
        }
    }
    
    // Navigate command history
    navigateHistory(direction) {
        const input = document.getElementById('terminalInput');
        const newIndex = this.historyIndex + direction;
        
        if (newIndex >= 0 && newIndex < this.commandHistory.length) {
            this.historyIndex = newIndex;
            input.value = this.commandHistory[newIndex];
        } else if (newIndex >= this.commandHistory.length) {
            this.historyIndex = this.commandHistory.length;
            input.value = '';
        }
    }
    
    // Display command result
    displayCommandResult(result) {
        switch (result.type) {
            case 'help':
                let helpText = 'Available commands:\n';
                result.commands.forEach(cmd => {
                    helpText += `  ${cmd.cmd.padEnd(30)} - ${cmd.desc}\n`;
                });
                this.log(helpText, 'system');
                break;
                
            case 'list':
                if (result.apis.length === 0) {
                    this.log('No APIs configured. Use "add <name> <url>" to add one.', 'system');
                } else {
                    let listText = 'Configured APIs:\n';
                    result.apis.forEach(api => {
                        const auth = api.hasAuth ? '🔐' : '🔓';
                        listText += `  ${auth} ${api.name.padEnd(20)} ${api.baseUrl}\n`;
                    });
                    this.log(listText, 'system');
                }
                break;
                
            case 'success':
                this.log(result.message, 'success');
                break;
                
            case 'error':
                this.log(result.message, 'error');
                break;
                
            case 'history':
                if (result.data.length === 0) {
                    this.log('No request history', 'system');
                } else {
                    let historyText = 'Recent requests:\n';
                    result.data.forEach(req => {
                        const status = req.success ? '✓' : '✗';
                        historyText += `  ${status} [${req.method}] ${req.apiName}${req.url ? ' - ' + req.url : ''} (${req.duration})\n`;
                    });
                    this.log(historyText, 'system');
                }
                break;
                
            case 'status':
                const status = result.data;
                const uptime = this.formatUptime(status.uptime);
                const mem = (status.memory.heapUsed / 1024 / 1024).toFixed(2);
                this.log(`Hub Status:
  Uptime: ${uptime}
  APIs: ${status.apis}
  Clients: ${status.clients}
  Requests: ${status.requests}
  Memory: ${mem} MB`, 'system');
                break;
                
            case 'clear':
                document.getElementById('terminalOutput').innerHTML = '';
                break;
                
            case 'mcpList':
                this.displayMcpList(result.servers);
                break;
                
            case 'info':
                this.log(result.message, 'system');
                break;
                
            default:
                // API response or MCP result
                if (result.success !== undefined) {
                    this.displayResponse(result);
                } else if (result.error) {
                    this.log(`Error: ${result.error}`, 'error');
                } else {
                    // Format MCP results nicely
                    this.displayMcpData(result);
                }
        }
    }
    
    // Display MCP server list
    displayMcpList(servers) {
        let text = '🔌 Available MCP Servers:\n\n';
        servers.forEach(s => {
            const status = s.available ? '✓' : '✗';
            text += `${s.icon} ${s.name} [${status}]\n`;
            text += `   ${s.description}\n`;
            text += `   Tools: ${s.tools.join(', ')}\n\n`;
        });
        this.log(text, 'system');
    }
    
    // Display MCP result
    displayMcpResult(data) {
        const serverConfig = this.mcpServers[data.server];
        const icon = serverConfig?.icon || '🔧';
        this.log(`${icon} ${data.server}/${data.tool} result:`, 'success');
        this.displayMcpData(data.data);
    }
    
    // Display MCP data formatted
    displayMcpData(data) {
        if (data.error) {
            this.log(`Error: ${data.error}`, 'error');
            return;
        }
        
        // Special formatting for security assessment
        if (data.status && data.alerts) {
            this.displaySecurityAssessment(data);
            return;
        }
        
        // Special formatting for network analysis
        if (data.totalConnections !== undefined) {
            this.displayNetworkAnalysis(data);
            return;
        }
        
        // Special formatting for process analysis
        if (data.topCpu) {
            this.displayProcessAnalysis(data);
            return;
        }
        
        // Special formatting for system info
        if (data.os && data.cpu) {
            this.displaySystemInfo(data);
            return;
        }
        
        // Default JSON display
        const output = document.getElementById('terminalOutput');
        const pre = document.createElement('pre');
        pre.textContent = JSON.stringify(data, null, 2);
        pre.style.color = '#00ff88';
        
        const line = document.createElement('div');
        line.className = 'output-line';
        line.appendChild(pre);
        output.appendChild(line);
        output.scrollTop = output.scrollHeight;
    }
    
    // Display security assessment
    displaySecurityAssessment(data) {
        const statusColors = {
            'SECURE': '#00ff88',
            'REVIEW_RECOMMENDED': '#ffaa00',
            'ALERT': '#ff4444'
        };
        
        let text = `\n🛡️ SECURITY ASSESSMENT\n`;
        text += `${'═'.repeat(40)}\n`;
        text += `Status: ${data.status}\n`;
        text += `Time: ${data.timestamp}\n\n`;
        
        text += `📊 Summary:\n`;
        text += `   Connections: ${data.summary.totalConnections}\n`;
        text += `   Foreign: ${data.summary.foreignConnections}\n`;
        text += `   Processes: ${data.summary.totalProcesses}\n`;
        text += `   Sessions: ${data.summary.activeSessions}\n\n`;
        
        if (data.alerts.length > 0) {
            text += `⚠️ Alerts:\n`;
            data.alerts.forEach(a => {
                const icon = a.level === 'HIGH' ? '🔴' : a.level === 'MEDIUM' ? '🟡' : '🟢';
                text += `   ${icon} [${a.level}] ${a.message}\n`;
            });
        } else {
            text += `✅ No security alerts\n`;
        }
        
        this.log(text, data.status === 'SECURE' ? 'success' : 'warning');
    }
    
    // Display network analysis
    displayNetworkAnalysis(data) {
        let text = `\n🌐 NETWORK ANALYSIS\n`;
        text += `${'═'.repeat(40)}\n`;
        text += `Total Connections: ${data.totalConnections}\n`;
        text += `Established: ${data.established}\n`;
        text += `Listening: ${data.listening}\n`;
        text += `Foreign: ${data.foreignConnections}\n`;
        
        if (data.topConnections && data.topConnections.length > 0) {
            text += `\nTop Foreign Connections:\n`;
            data.topConnections.forEach(c => {
                text += `   ${c.local} → ${c.remote} (${c.process})\n`;
            });
        }
        
        this.log(text, 'system');
    }
    
    // Display process analysis
    displayProcessAnalysis(data) {
        let text = `\n⚙️ PROCESS ANALYSIS\n`;
        text += `${'═'.repeat(40)}\n`;
        text += `Total: ${data.total} | Running: ${data.running} | Blocked: ${data.blocked}\n\n`;
        
        text += `Top CPU:\n`;
        data.topCpu.forEach(p => {
            text += `   ${p.name.padEnd(20)} CPU: ${p.cpu.padEnd(8)} MEM: ${p.mem}\n`;
        });
        
        if (data.topMem) {
            text += `\nTop Memory:\n`;
            data.topMem.forEach(p => {
                text += `   ${p.name.padEnd(20)} CPU: ${p.cpu.padEnd(8)} MEM: ${p.mem}\n`;
            });
        }
        
        this.log(text, 'system');
    }
    
    // Display system info
    displaySystemInfo(data) {
        let text = `\n💻 SYSTEM INFORMATION\n`;
        text += `${'═'.repeat(40)}\n`;
        text += `OS: ${data.os.distro} ${data.os.release} (${data.os.platform})\n`;
        text += `CPU: ${data.cpu.brand} (${data.cpu.cores} cores)\n`;
        text += `Memory: ${data.memory.used} / ${data.memory.total} (${data.memory.free} free)\n`;
        
        if (data.disk) {
            text += `\nDisks:\n`;
            data.disk.forEach(d => {
                text += `   ${d.mount}: ${d.used} / ${d.size}\n`;
            });
        }
        
        this.log(text, 'system');
    }
    
    // Update MCP server list in sidebar
    updateMcpServerList() {
        const container = document.getElementById('mcpServerList');
        if (!container) return;
        
        container.innerHTML = '';
        
        Object.entries(this.mcpServers).forEach(([id, server]) => {
            const item = document.createElement('div');
            item.className = `mcp-server-item ${server.available ? 'available' : 'unavailable'}`;
            item.innerHTML = `
                <span class="mcp-icon">${server.icon}</span>
                <div class="mcp-info">
                    <div class="mcp-name">${server.name}</div>
                    <div class="mcp-status">${server.available ? 'Available' : 'Not installed'}</div>
                </div>
            `;
            item.addEventListener('click', () => {
                if (server.available) {
                    this.executeCommand(id === 'cybercat' ? 'cybercat' : 'monitor');
                }
            });
            container.appendChild(item);
        });
    }
    
    // Display API response
    displayResponse(response) {
        const statusClass = response.success ? 'success' : 'error';
        const statusIcon = response.success ? '✓' : '✗';
        
        this.log(`${statusIcon} Response (${response.status || 'N/A'}) - ${response.duration}`, statusClass);
        
        if (response.data) {
            const output = document.getElementById('terminalOutput');
            const pre = document.createElement('pre');
            pre.textContent = JSON.stringify(response.data, null, 2);
            
            const line = document.createElement('div');
            line.className = 'output-line';
            line.appendChild(pre);
            output.appendChild(line);
            output.scrollTop = output.scrollHeight;
        }
        
        // Update response panel
        const responseStatus = document.getElementById('responseStatus');
        const responseBody = document.getElementById('responseBody');
        
        responseStatus.textContent = response.success ? `${response.status} OK` : `${response.status || 'Error'}`;
        responseStatus.className = `response-status ${statusClass}`;
        responseBody.textContent = JSON.stringify(response.data || response.error, null, 2);
    }
    
    // Display test result
    displayTestResult(result) {
        if (result.success) {
            this.log(`✓ ${result.apiName} is reachable (${result.latency})`, 'success');
        } else {
            this.log(`✗ ${result.apiName} test failed: ${result.error}`, 'error');
        }
    }
    
    // Display history
    displayHistory(history) {
        if (history.length === 0) {
            this.log('No request history', 'system');
            return;
        }
        
        let text = 'Request History:\n';
        history.slice(0, 20).forEach((req, i) => {
            const status = req.success ? '✓' : '✗';
            text += `  ${i + 1}. ${status} [${req.method}] ${req.apiName} - ${req.status} (${req.duration})\n`;
        });
        this.log(text, 'system');
    }
    
    // Log message to terminal
    log(message, type = 'info') {
        const output = document.getElementById('terminalOutput');
        const line = document.createElement('div');
        line.className = `output-line ${type}`;
        
        const timestamp = document.createElement('span');
        timestamp.className = 'timestamp';
        timestamp.textContent = `[${new Date().toLocaleTimeString()}]`;
        
        const msg = document.createElement('span');
        msg.className = 'message';
        msg.textContent = message;
        
        if (type !== 'command') {
            line.appendChild(timestamp);
        }
        line.appendChild(msg);
        
        output.appendChild(line);
        output.scrollTop = output.scrollHeight;
    }
    
    // Update connection status
    updateConnectionStatus(status) {
        const indicator = document.getElementById('connectionStatus');
        indicator.className = `status-indicator ${status}`;
        indicator.querySelector('.status-text').textContent = 
            status === 'connected' ? 'Connected' : 'Disconnected';
    }
    
    // Update API list in sidebar
    updateApiList() {
        const list = document.getElementById('apiList');
        list.innerHTML = '';
        
        Object.values(this.apis).forEach(api => {
            const item = document.createElement('div');
            item.className = 'api-item';
            item.innerHTML = `
                <div class="api-info">
                    <div class="api-name">${api.name}</div>
                    <div class="api-url">${api.baseUrl}</div>
                </div>
                <div class="api-actions">
                    <button class="btn-icon" onclick="hub.testApi('${api.name}')" title="Test">🔍</button>
                    <button class="btn-icon" onclick="hub.removeApi('${api.name}')" title="Remove">🗑️</button>
                </div>
            `;
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.api-actions')) {
                    this.selectApi(api.name);
                }
            });
            list.appendChild(item);
        });
    }
    
    // Update API select dropdown
    updateApiSelect() {
        const select = document.getElementById('apiSelect');
        select.innerHTML = '<option value="">Select API...</option>';
        
        Object.values(this.apis).forEach(api => {
            const option = document.createElement('option');
            option.value = api.name;
            option.textContent = api.name;
            select.appendChild(option);
        });
    }
    
    // Update API count
    updateApiCount() {
        document.getElementById('apiCount').textContent = 
            `${Object.keys(this.apis).length} APIs`;
    }
    
    // Update request count
    updateRequestCount() {
        const count = document.getElementById('requestCount');
        const current = parseInt(count.textContent) || 0;
        count.textContent = `${current + 1} requests`;
    }
    
    // Select API
    selectApi(name) {
        document.getElementById('apiSelect').value = name;
        
        // Update active state
        document.querySelectorAll('.api-item').forEach(item => {
            item.classList.remove('active');
            if (item.querySelector('.api-name').textContent === name) {
                item.classList.add('active');
            }
        });
    }
    
    // Test API connection
    testApi(name) {
        this.ws.send(JSON.stringify({
            action: 'testConnection',
            payload: { name }
        }));
    }
    
    // Remove API
    removeApi(name) {
        if (confirm(`Remove API "${name}"?`)) {
            this.ws.send(JSON.stringify({
                action: 'removeApi',
                payload: { name }
            }));
        }
    }
    
    // Execute request from builder
    executeRequest() {
        const apiName = document.getElementById('apiSelect').value;
        const method = document.getElementById('methodSelect').value;
        const endpoint = document.getElementById('endpointInput').value;
        const headersText = document.getElementById('headersInput').value;
        const bodyText = document.getElementById('bodyInput').value;
        
        if (!apiName) {
            this.log('Please select an API', 'error');
            return;
        }
        
        let headers = {};
        let data = null;
        
        try {
            if (headersText.trim()) {
                headers = JSON.parse(headersText);
            }
        } catch (e) {
            this.log('Invalid headers JSON', 'error');
            return;
        }
        
        try {
            if (bodyText.trim()) {
                data = JSON.parse(bodyText);
            }
        } catch (e) {
            this.log('Invalid body JSON', 'error');
            return;
        }
        
        this.log(`Executing ${method} ${apiName}${endpoint}...`, 'system');
        
        this.ws.send(JSON.stringify({
            action: 'callApi',
            payload: {
                apiName,
                method,
                endpoint,
                headers,
                data
            }
        }));
    }
    
    // Show modal
    showModal(id) {
        document.getElementById(id).classList.add('active');
    }
    
    // Hide modal
    hideModal(id) {
        document.getElementById(id).classList.remove('active');
        this.clearModalForm();
    }
    
    // Clear modal form
    clearModalForm() {
        document.getElementById('newApiName').value = '';
        document.getElementById('newApiUrl').value = '';
        document.getElementById('newApiAuthType').value = '';
        document.getElementById('newApiHeaders').value = '';
        document.getElementById('authFields').innerHTML = '';
        document.getElementById('authFields').style.display = 'none';
    }
    
    // Update auth fields based on type
    updateAuthFields(type) {
        const container = document.getElementById('authFields');
        container.innerHTML = '';
        
        if (!type) {
            container.style.display = 'none';
            return;
        }
        
        container.style.display = 'block';
        
        switch (type) {
            case 'bearer':
                container.innerHTML = `
                    <div class="form-group">
                        <label>Bearer Token</label>
                        <input type="text" id="authToken" placeholder="your-token-here">
                    </div>
                `;
                break;
                
            case 'basic':
                container.innerHTML = `
                    <div class="form-group">
                        <label>Username</label>
                        <input type="text" id="authUsername" placeholder="username">
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input type="password" id="authPassword" placeholder="password">
                    </div>
                `;
                break;
                
            case 'apiKey':
                container.innerHTML = `
                    <div class="form-group">
                        <label>Key Name</label>
                        <input type="text" id="authKeyName" placeholder="X-API-Key">
                    </div>
                    <div class="form-group">
                        <label>Key Value</label>
                        <input type="text" id="authKeyValue" placeholder="your-api-key">
                    </div>
                    <div class="form-group">
                        <label>Location</label>
                        <select id="authKeyIn">
                            <option value="header">Header</option>
                            <option value="query">Query Parameter</option>
                        </select>
                    </div>
                `;
                break;
        }
    }
    
    // Save new API
    saveNewApi() {
        const name = document.getElementById('newApiName').value.trim();
        const baseUrl = document.getElementById('newApiUrl').value.trim();
        const authType = document.getElementById('newApiAuthType').value;
        const headersText = document.getElementById('newApiHeaders').value.trim();
        
        if (!name || !baseUrl) {
            this.log('Name and URL are required', 'error');
            return;
        }
        
        let headers = {};
        try {
            if (headersText) {
                headers = JSON.parse(headersText);
            }
        } catch (e) {
            this.log('Invalid headers JSON', 'error');
            return;
        }
        
        let auth = null;
        if (authType) {
            switch (authType) {
                case 'bearer':
                    auth = {
                        type: 'bearer',
                        token: document.getElementById('authToken').value
                    };
                    break;
                    
                case 'basic':
                    auth = {
                        type: 'basic',
                        username: document.getElementById('authUsername').value,
                        password: document.getElementById('authPassword').value
                    };
                    break;
                    
                case 'apiKey':
                    auth = {
                        type: 'apiKey',
                        name: document.getElementById('authKeyName').value,
                        value: document.getElementById('authKeyValue').value,
                        in: document.getElementById('authKeyIn').value
                    };
                    break;
            }
        }
        
        this.ws.send(JSON.stringify({
            action: 'addApi',
            payload: { name, baseUrl, headers, auth }
        }));
        
        this.hideModal('addApiModal');
    }
    
    // Start uptime timer
    startUptimeTimer() {
        setInterval(() => {
            const uptime = Math.floor((Date.now() - this.startTime) / 1000);
            document.getElementById('uptime').textContent = `Uptime: ${this.formatUptime(uptime)}`;
        }, 1000);
    }
    
    // Format uptime
    formatUptime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        
        if (h > 0) {
            return `${h}h ${m}m ${s}s`;
        } else if (m > 0) {
            return `${m}m ${s}s`;
        }
        return `${s}s`;
    }
}

// Initialize app
const hub = new APIHub();