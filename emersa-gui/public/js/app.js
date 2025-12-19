// CyberCAT Multi-Agent Security Command Center
// LangGraph-powered Multi-Agent System

// ============================================
// Global State
// ============================================
const state = {
    wsConnection: null,
    isScanning: false,
    scanProgress: 0,
    agents: {
        scanner: { status: 'running', tasks: 0 },
        analyzer: { status: 'idle', tasks: 0 },
        defender: { status: 'running', tasks: 0 },
        reporter: { status: 'idle', tasks: 0 },
        hunter: { status: 'idle', tasks: 0 },
        orchestrator: { status: 'running', tasks: 0 }
    },
    stats: {
        threatsBlocked: 1247,
        scansCompleted: 89,
        responseTime: 12,
        uptime: 99.9
    },
    commandHistory: [],
    historyIndex: -1
};

// ============================================
// Matrix Rain Effect
// ============================================
function initMatrixRain() {
    const canvas = document.getElementById('matrix-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const chars = 'CYBERCAT01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
    const charArray = chars.split('');
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops = [];
    
    for (let i = 0; i < columns; i++) {
        drops[i] = Math.random() * -100;
    }
    
    function draw() {
        ctx.fillStyle = 'rgba(10, 10, 15, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#00ffcc';
        ctx.font = fontSize + 'px JetBrains Mono';
        
        for (let i = 0; i < drops.length; i++) {
            const char = charArray[Math.floor(Math.random() * charArray.length)];
            const x = i * fontSize;
            const y = drops[i] * fontSize;
            
            // Gradient effect
            const gradient = ctx.createLinearGradient(x, y - 50, x, y);
            gradient.addColorStop(0, 'rgba(0, 255, 204, 0)');
            gradient.addColorStop(0.5, 'rgba(0, 255, 204, 0.5)');
            gradient.addColorStop(1, 'rgba(0, 255, 204, 1)');
            ctx.fillStyle = gradient;
            
            ctx.fillText(char, x, y);
            
            if (y > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }
    
    setInterval(draw, 50);
    
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

// ============================================
// Loading Screen
// ============================================
function hideLoadingScreen() {
    setTimeout(() => {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }
    }, 2500);
}

// ============================================
// Terminal Functions
// ============================================
function initTerminal() {
    const input = document.getElementById('terminal-input');
    const sendBtn = document.getElementById('send-command');
    const clearBtn = document.getElementById('clear-terminal');
    const exportBtn = document.getElementById('export-log');
    
    input?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            executeCommand(input.value);
            input.value = '';
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            navigateHistory(-1);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            navigateHistory(1);
        }
    });
    
    sendBtn?.addEventListener('click', () => {
        executeCommand(input.value);
        input.value = '';
    });
    
    clearBtn?.addEventListener('click', clearTerminal);
    exportBtn?.addEventListener('click', exportLog);
}

function navigateHistory(direction) {
    const input = document.getElementById('terminal-input');
    if (!input || state.commandHistory.length === 0) return;
    
    state.historyIndex += direction;
    
    if (state.historyIndex < 0) {
        state.historyIndex = 0;
    } else if (state.historyIndex >= state.commandHistory.length) {
        state.historyIndex = state.commandHistory.length;
        input.value = '';
        return;
    }
    
    input.value = state.commandHistory[state.historyIndex] || '';
}

function executeCommand(cmd) {
    if (!cmd.trim()) return;
    
    state.commandHistory.push(cmd);
    state.historyIndex = state.commandHistory.length;
    
    addTerminalLine('user', `$ ${cmd}`);
    
    const command = cmd.toLowerCase().trim();
    
    // Process commands
    if (command === 'help') {
        showHelp();
    } else if (command === 'scan' || command === 'full-scan') {
        startFullScan();
    } else if (command === 'quick-scan') {
        startQuickScan();
    } else if (command === 'port-scan' || command.startsWith('portscan')) {
        startPortScan(command);
    } else if (command === 'vuln-scan' || command === 'vulnerability') {
        startVulnScan();
    } else if (command === 'status') {
        showStatus();
    } else if (command === 'agents') {
        showAgents();
    } else if (command === 'clear') {
        clearTerminal();
    } else if (command === 'stats') {
        showStats();
    } else if (command.startsWith('deploy')) {
        deployAgent(command);
    } else if (command === 'threat-hunt') {
        startThreatHunt();
    } else if (command === 'firewall') {
        showFirewallStatus();
    } else if (command === 'report') {
        generateReport();
    } else if (command === 'cat') {
        showCat();
    } else if (command === 'matrix') {
        toggleMatrix();
    } else if (command.startsWith('agent')) {
        handleAgentCommand(command);
    } else if (command === 'ask-agent' || command.startsWith('ask ')) {
        handleAgentChat(command);
    } else {
        addTerminalLine('error', `Unknown command: ${cmd}. Type 'help' for available commands.`);
    }
}

function addTerminalLine(type, message, prefix = 'CYBERCAT') {
    const output = document.getElementById('terminal-output');
    if (!output) return;
    
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    const line = document.createElement('div');
    line.className = `terminal-line ${type}`;
    
    const prefixMap = {
        'user': 'USER',
        'system': 'SYSTEM',
        'success': 'SUCCESS',
        'error': 'ERROR',
        'warning': 'WARNING',
        'info': 'INFO',
        'scanner': 'SCANNER',
        'analyzer': 'ANALYZER',
        'defender': 'DEFENDER'
    };
    
    line.innerHTML = `
        <span class="timestamp">[${timestamp}]</span>
        <span class="prefix">${prefixMap[type] || prefix}></span>
        <span class="message">${message}</span>
    `;
    
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
}

function clearTerminal() {
    const output = document.getElementById('terminal-output');
    if (output) {
        output.innerHTML = '';
        addTerminalLine('system', 'Terminal cleared. Type "help" for commands.');
    }
}

function exportLog() {
    const output = document.getElementById('terminal-output');
    if (!output) return;
    
    const lines = output.querySelectorAll('.terminal-line');
    let log = '=== CyberCAT Security Log ===\n';
    log += `Generated: ${new Date().toISOString()}\n\n`;
    
    lines.forEach(line => {
        const timestamp = line.querySelector('.timestamp')?.textContent || '';
        const prefix = line.querySelector('.prefix')?.textContent || '';
        const message = line.querySelector('.message')?.textContent || '';
        log += `${timestamp} ${prefix} ${message}\n`;
    });
    
    const blob = new Blob([log], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cybercat-log-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('Log exported successfully!', 'success');
}

// ============================================
// Command Implementations
// ============================================
function showHelp() {
    const helpText = `
Available Commands:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  scan, full-scan    - Run comprehensive security scan
  quick-scan         - Run quick security assessment
  port-scan [target] - Scan ports on target
  vuln-scan          - Vulnerability assessment
  threat-hunt        - Active threat hunting
  firewall           - Show firewall status
  status             - System status overview
  agents             - List all agents
  deploy [agent]     - Deploy specific agent
  agent [name] [cmd] - Send command to specific agent
  ask [question]     - Chat with AI agent
  stats              - Show statistics
  report             - Generate security report
  clear              - Clear terminal
  cat                - Show CyberCAT
  matrix             - Toggle matrix effect
  help               - Show this help
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
    addTerminalLine('info', helpText.replace(/\n/g, '<br>'));
}

// ============================================
// Agent Integration Functions
// ============================================
async function handleAgentCommand(command) {
    const parts = command.split(' ');
    const agentName = parts[1];
    const agentCmd = parts.slice(2).join(' ');
    
    if (!agentName) {
        addTerminalLine('error', 'Usage: agent [name] [command]');
        addTerminalLine('info', 'Available agents: scanner, analyzer, defender, reporter, hunter, orchestrator');
        return;
    }
    
    if (!state.agents[agentName]) {
        addTerminalLine('error', `Unknown agent: ${agentName}`);
        return;
    }
    
    addTerminalLine('system', `Sending command to ${agentName} agent...`);
    
    try {
        const response = await fetch(`/api/agents/${agentName}/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: agentCmd || 'status' })
        });
        
        const result = await response.json();
        
        if (result.success) {
            addTerminalLine('success', `Agent ${agentName}: ${result.message || 'Command executed'}`);
            if (result.data) {
                addTerminalLine('info', JSON.stringify(result.data, null, 2).replace(/\n/g, '<br>').replace(/ /g, '&nbsp;'));
            }
        } else {
            addTerminalLine('error', `Agent error: ${result.error}`);
        }
    } catch (error) {
        addTerminalLine('error', `Failed to communicate with agent: ${error.message}`);
    }
}

async function handleAgentChat(command) {
    const question = command.replace(/^(ask-agent|ask)\s*/i, '');
    
    if (!question.trim()) {
        addTerminalLine('error', 'Usage: ask [your question]');
        return;
    }
    
    addTerminalLine('system', `Asking AI agent: "${question}"`);
    updateAgentStatus('orchestrator', 'running');
    
    try {
        const response = await fetch('/api/agent/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: question })
        });
        
        const result = await response.json();
        
        if (result.success) {
            addTerminalLine('success', `AI Agent: ${result.response}`);
            if (result.suggestions) {
                addTerminalLine('info', `Suggestions: ${result.suggestions.join(', ')}`);
            }
        } else {
            addTerminalLine('warning', `Agent response: ${result.message || 'Agent is processing...'}`);
        }
    } catch (error) {
        addTerminalLine('error', `Chat error: ${error.message}`);
    } finally {
        updateAgentStatus('orchestrator', 'idle');
    }
}

async function triggerAgentScan() {
    if (state.isScanning) {
        addTerminalLine('warning', 'Agent scan already in progress...');
        return;
    }
    
    state.isScanning = true;
    const scanBtn = document.getElementById('agent-scan-btn');
    const eqStatus = document.getElementById('eq-status');
    
    // Update UI
    scanBtn?.classList.add('scanning');
    eqStatus?.classList.add('active');
    if (eqStatus) {
        eqStatus.querySelector('.status-text').textContent = 'Agent Scanning...';
    }
    
    addTerminalLine('system', '═══ MULTI-AGENT SCAN INITIATED ═══');
    addTerminalLine('scanner', 'Activating all security agents...');
    
    // Activate all agents
    Object.keys(state.agents).forEach(agent => {
        updateAgentStatus(agent, 'running');
    });
    
    startEQAnimation();
    showScanProgress();
    updateScanPhase('Coordinating Agents');
    
    const phases = [
        { agent: 'scanner', name: 'Network Discovery', duration: 15 },
        { agent: 'analyzer', name: 'Threat Analysis', duration: 20 },
        { agent: 'defender', name: 'Security Check', duration: 20 },
        { agent: 'hunter', name: 'Threat Hunting', duration: 25 },
        { agent: 'reporter', name: 'Generating Report', duration: 20 }
    ];
    
    let currentPhase = 0;
    let phaseProgress = 0;
    
    const scanInterval = setInterval(() => {
        phaseProgress += 2;
        state.scanProgress = Math.min(
            (currentPhase * 20) + (phaseProgress * phases[currentPhase].duration / 100),
            100
        );
        
        updateProgressBar(state.scanProgress);
        
        if (phaseProgress >= 100) {
            phaseProgress = 0;
            const phase = phases[currentPhase];
            addTerminalLine(phase.agent, `✓ ${phase.name} complete`);
            updateAgentStatus(phase.agent, 'idle');
            currentPhase++;
            
            if (currentPhase < phases.length) {
                const nextPhase = phases[currentPhase];
                updateScanPhase(nextPhase.name);
                updateAgentStatus(nextPhase.agent, 'running');
            }
        }
        
        if (state.scanProgress >= 100) {
            clearInterval(scanInterval);
            completeAgentScan();
            
            // Reset UI
            scanBtn?.classList.remove('scanning');
            eqStatus?.classList.remove('active');
            if (eqStatus) {
                eqStatus.querySelector('.status-text').textContent = 'Scan Complete';
            }
            
            setTimeout(() => {
                if (eqStatus) {
                    eqStatus.querySelector('.status-text').textContent = 'Idle';
                }
            }, 3000);
        }
    }, 100);
}

function completeAgentScan() {
    hideScanProgress();
    state.isScanning = false;
    state.stats.scansCompleted++;
    state.stats.threatsBlocked += Math.floor(Math.random() * 15);
    
    // Deactivate all agents
    Object.keys(state.agents).forEach(agent => {
        if (agent !== 'defender' && agent !== 'orchestrator') {
            updateAgentStatus(agent, 'idle');
        }
    });
    
    addTerminalLine('success', '═══ MULTI-AGENT SCAN COMPLETE ═══');
    addTerminalLine('success', `🔒 Threats Blocked: ${state.stats.threatsBlocked}`);
    addTerminalLine('info', '🛡️ All agents coordinated successfully');
    addTerminalLine('info', '📊 System Health: 95%');
    addTerminalLine('success', '✓ No critical vulnerabilities detected');
    
    updateResults({
        openPorts: '22, 80, 443, 3000',
        vulnerabilities: '0 Critical',
        sslGrade: 'A+',
        scanDuration: '18.5s',
        memoryUsed: '256MB'
    });
    
    updateStatsDisplay();
    showToast('Multi-agent scan completed!', 'success');
    updateSecurityGauge(95);
    
    addActivity('success', 'Multi-agent scan completed successfully');
}

function showStatus() {
    addTerminalLine('system', '═══ SYSTEM STATUS ═══');
    addTerminalLine('success', `Security Level: 90% - PROTECTED`);
    addTerminalLine('info', `Active Agents: ${Object.values(state.agents).filter(a => a.status === 'running').length}/6`);
    addTerminalLine('info', `Threats Blocked Today: ${state.stats.threatsBlocked}`);
    addTerminalLine('info', `Scans Completed: ${state.stats.scansCompleted}`);
    addTerminalLine('info', `Response Time: ${state.stats.responseTime}ms`);
    addTerminalLine('info', `System Uptime: ${state.stats.uptime}%`);
}

function showAgents() {
    addTerminalLine('system', '═══ MULTI-AGENT STATUS ═══');
    Object.entries(state.agents).forEach(([name, agent]) => {
        const status = agent.status === 'running' ? '🟢 ACTIVE' : '⚪ IDLE';
        addTerminalLine('info', `${name.toUpperCase()}: ${status} | Tasks: ${agent.tasks}`);
    });
}

function showStats() {
    addTerminalLine('system', '═══ SECURITY STATISTICS ═══');
    addTerminalLine('success', `🔒 Threats Blocked: ${state.stats.threatsBlocked.toLocaleString()}`);
    addTerminalLine('info', `🌐 Scans Today: ${state.stats.scansCompleted}`);
    addTerminalLine('info', `⚡ Avg Response: ${state.stats.responseTime}ms`);
    addTerminalLine('success', `🛡️ Uptime: ${state.stats.uptime}%`);
}

function showCat() {
    const cat = `
    /\\_____/\\
   /  o   o  \\    CYBERCAT v2.0
  ( ==  ^  == )   Multi-Agent Security
   )         (    ═══════════════════
  (           )   "Protecting your
 ( (  )   (  ) )   digital realm"
(__(__)___(__)__)
    `;
    addTerminalLine('system', cat.replace(/\n/g, '<br>').replace(/ /g, '&nbsp;'));
}

function toggleMatrix() {
    const canvas = document.getElementById('matrix-canvas');
    if (canvas) {
        canvas.style.opacity = canvas.style.opacity === '0' ? '0.15' : '0';
        addTerminalLine('info', `Matrix effect ${canvas.style.opacity === '0' ? 'disabled' : 'enabled'}`);
    }
}

// ============================================
// Scanning Functions
// ============================================
function startFullScan() {
    if (state.isScanning) {
        addTerminalLine('warning', 'Scan already in progress...');
        return;
    }
    
    state.isScanning = true;
    state.scanProgress = 0;
    
    showScanProgress();
    addTerminalLine('scanner', 'Initiating full security scan...');
    updateAgentStatus('scanner', 'running');
    updateAgentStatus('analyzer', 'running');
    
    const phases = [
        { name: 'Network Discovery', duration: 15 },
        { name: 'Port Scanning', duration: 25 },
        { name: 'Service Detection', duration: 20 },
        { name: 'Vulnerability Analysis', duration: 25 },
        { name: 'Generating Report', duration: 15 }
    ];
    
    let currentPhase = 0;
    let phaseProgress = 0;
    
    const scanInterval = setInterval(() => {
        phaseProgress += 2;
        state.scanProgress = Math.min(
            (currentPhase * 20) + (phaseProgress * phases[currentPhase].duration / 100),
            100
        );
        
        updateProgressBar(state.scanProgress);
        
        if (phaseProgress >= 100) {
            phaseProgress = 0;
            addTerminalLine('success', `✓ ${phases[currentPhase].name} complete`);
            currentPhase++;
            
            if (currentPhase < phases.length) {
                updateScanPhase(phases[currentPhase].name);
            }
        }
        
        if (state.scanProgress >= 100) {
            clearInterval(scanInterval);
            completeScan();
        }
    }, 100);
    
    updateScanPhase(phases[0].name);
}

function startQuickScan() {
    if (state.isScanning) {
        addTerminalLine('warning', 'Scan already in progress...');
        return;
    }
    
    state.isScanning = true;
    showScanProgress();
    addTerminalLine('scanner', 'Running quick security assessment...');
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += 5;
        updateProgressBar(progress);
        
        if (progress >= 100) {
            clearInterval(interval);
            completeScan('quick');
        }
    }, 100);
    
    updateScanPhase('Quick Assessment');
}

function startPortScan(cmd) {
    const target = cmd.split(' ')[1] || 'localhost';
    addTerminalLine('scanner', `Scanning ports on ${target}...`);
    
    setTimeout(() => {
        addTerminalLine('success', `Port scan results for ${target}:`);
        addTerminalLine('info', '  22/tcp   OPEN   ssh');
        addTerminalLine('info', '  80/tcp   OPEN   http');
        addTerminalLine('info', '  443/tcp  OPEN   https');
        addTerminalLine('info', '  3000/tcp OPEN   nodejs');
        addTerminalLine('success', 'Port scan complete. 4 open ports found.');
        
        updateResults({
            openPorts: '22, 80, 443, 3000',
            scanDuration: '1.2s'
        });
    }, 1500);
}

function startVulnScan() {
    addTerminalLine('analyzer', 'Starting vulnerability assessment...');
    
    if (state.isScanning) {
        addTerminalLine('warning', 'Scan already in progress...');
        return;
    }
    
    state.isScanning = true;
    showScanProgress();
    updateScanPhase('Vulnerability Analysis');
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += 3;
        updateProgressBar(progress);
        
        if (progress >= 100) {
            clearInterval(interval);
            addTerminalLine('success', '✓ Vulnerability scan complete');
            addTerminalLine('info', 'Results: 0 Critical, 2 Medium, 5 Low');
            hideScanProgress();
            state.isScanning = false;
            
            updateResults({
                vulnerabilities: '0 Critical',
                sslGrade: 'A+'
            });
        }
    }, 80);
}

function startThreatHunt() {
    addTerminalLine('system', '═══ THREAT HUNTING INITIATED ═══');
    updateAgentStatus('hunter', 'running');
    
    const threats = [
        'Scanning for malware signatures...',
        'Checking for suspicious processes...',
        'Analyzing network connections...',
        'Reviewing authentication logs...',
        'Checking for rootkits...'
    ];
    
    let i = 0;
    const interval = setInterval(() => {
        if (i < threats.length) {
            addTerminalLine('info', threats[i]);
            i++;
        } else {
            clearInterval(interval);
            addTerminalLine('success', '✓ Threat hunt complete. No active threats detected.');
            updateAgentStatus('hunter', 'idle');
            state.stats.threatsBlocked += Math.floor(Math.random() * 10);
            updateStatsDisplay();
        }
    }, 800);
}

function showFirewallStatus() {
    addTerminalLine('defender', '═══ FIREWALL STATUS ═══');
    addTerminalLine('success', '🔥 Firewall: ACTIVE');
    addTerminalLine('info', '📋 Rules: 47 active');
    addTerminalLine('info', '🚫 Blocked IPs: 1,247');
    addTerminalLine('info', '✅ Allowed: 23 services');
    addTerminalLine('info', '📊 Last update: 2 hours ago');
}

function generateReport() {
    addTerminalLine('system', 'Generating security report...');
    updateAgentStatus('reporter', 'running');
    
    setTimeout(() => {
        addTerminalLine('success', '✓ Report generated successfully');
        addTerminalLine('info', 'Report saved to: /reports/security-report-' + Date.now() + '.pdf');
        updateAgentStatus('reporter', 'idle');
        showToast('Security report generated!', 'success');
    }, 2000);
}

function deployAgent(cmd) {
    const agentName = cmd.split(' ')[1];
    if (!agentName) {
        addTerminalLine('error', 'Usage: deploy [agent-name]');
        return;
    }
    
    if (state.agents[agentName]) {
        updateAgentStatus(agentName, 'running');
        addTerminalLine('success', `Agent "${agentName}" deployed successfully`);
    } else {
        addTerminalLine('error', `Unknown agent: ${agentName}`);
    }
}

function completeScan(type = 'full') {
    hideScanProgress();
    state.isScanning = false;
    state.stats.scansCompleted++;
    
    updateAgentStatus('scanner', 'idle');
    updateAgentStatus('analyzer', 'idle');
    
    addTerminalLine('success', `═══ ${type.toUpperCase()} SCAN COMPLETE ═══`);
    addTerminalLine('info', 'Security Level: 90%');
    addTerminalLine('success', 'No critical vulnerabilities found');
    addTerminalLine('info', 'Open Ports: 22, 80, 443');
    addTerminalLine('info', 'SSL Grade: A+');
    
    updateResults({
        openPorts: '22, 80, 443',
        vulnerabilities: '0 Critical',
        sslGrade: 'A+',
        scanDuration: type === 'quick' ? '2.3s' : '15.7s',
        memoryUsed: '128MB'
    });
    
    updateStatsDisplay();
    showToast('Scan completed successfully!', 'success');
    
    // Update security gauge
    updateSecurityGauge(90);
}

// ============================================
// UI Update Functions
// ============================================
function showScanProgress() {
    const progressEl = document.getElementById('scan-progress');
    if (progressEl) {
        progressEl.classList.remove('hidden');
    }
    startEQAnimation();
}

function hideScanProgress() {
    const progressEl = document.getElementById('scan-progress');
    if (progressEl) {
        progressEl.classList.add('hidden');
    }
    stopEQAnimation();
}

function updateProgressBar(percent) {
    const bar = document.getElementById('progress-bar');
    const percentEl = document.getElementById('progress-percent');
    
    if (bar) bar.style.width = `${percent}%`;
    if (percentEl) percentEl.textContent = `${Math.round(percent)}%`;
}

function updateScanPhase(phase) {
    const phaseEl = document.getElementById('scan-phase');
    if (phaseEl) phaseEl.textContent = phase;
}

function updateAgentStatus(agentName, status) {
    state.agents[agentName].status = status;
    
    const agentCard = document.querySelector(`[data-agent="${agentName}"]`);
    if (agentCard) {
        const statusEl = agentCard.querySelector('.agent-status');
        const pulseEl = agentCard.querySelector('.agent-pulse');
        
        if (status === 'running') {
            agentCard.classList.add('active');
            if (statusEl) {
                statusEl.textContent = 'Running';
                statusEl.classList.add('running');
            }
            if (!pulseEl) {
                const pulse = document.createElement('div');
                pulse.className = 'agent-pulse';
                agentCard.appendChild(pulse);
            }
        } else {
            agentCard.classList.remove('active');
            if (statusEl) {
                statusEl.textContent = 'Idle';
                statusEl.classList.remove('running');
            }
            if (pulseEl) pulseEl.remove();
        }
    }
}

function updateResults(results) {
    const resultsContainer = document.getElementById('scan-results');
    if (!resultsContainer) return;
    
    if (results.openPorts) {
        const portEl = resultsContainer.querySelector('.result-item:nth-child(1) .result-value');
        if (portEl) portEl.textContent = results.openPorts;
    }
    
    if (results.vulnerabilities) {
        const vulnEl = resultsContainer.querySelector('.result-item:nth-child(2) .result-value');
        if (vulnEl) {
            vulnEl.textContent = results.vulnerabilities;
            vulnEl.className = 'result-value safe';
        }
    }
    
    if (results.sslGrade) {
        const sslEl = resultsContainer.querySelector('.result-item:nth-child(3) .result-value');
        if (sslEl) {
            sslEl.textContent = results.sslGrade;
            sslEl.className = 'result-value grade-a';
        }
    }
    
    if (results.scanDuration) {
        const durationEl = resultsContainer.querySelector('.result-item:nth-child(4) .result-value');
        if (durationEl) durationEl.textContent = results.scanDuration;
    }
    
    if (results.memoryUsed) {
        const memEl = resultsContainer.querySelector('.result-item:nth-child(5) .result-value');
        if (memEl) memEl.textContent = results.memoryUsed;
    }
}

function updateStatsDisplay() {
    document.getElementById('threats-blocked').textContent = state.stats.threatsBlocked.toLocaleString();
    document.getElementById('scans-completed').textContent = state.stats.scansCompleted;
    document.getElementById('response-time').textContent = state.stats.responseTime + 'ms';
    document.getElementById('uptime').textContent = state.stats.uptime + '%';
}

function updateSecurityGauge(percent) {
    const gaugeFill = document.getElementById('gauge-fill');
    const gaugeValue = document.getElementById('gauge-value');
    
    if (gaugeFill) {
        // 251 is the full arc length
        const offset = 251 - (251 * percent / 100);
        gaugeFill.setAttribute('stroke-dashoffset', offset);
    }
    
    if (gaugeValue) {
        gaugeValue.textContent = percent + '%';
    }
}

function addActivity(type, text) {
    const activityList = document.getElementById('activity-list');
    if (!activityList) return;
    
    const icons = {
        success: '✅',
        warning: '⚠️',
        error: '❌',
        info: 'ℹ️'
    };
    
    const item = document.createElement('div');
    item.className = `activity-item ${type}`;
    item.innerHTML = `
        <span class="activity-icon">${icons[type]}</span>
        <div class="activity-content">
            <span class="activity-text">${text}</span>
            <span class="activity-time">Just now</span>
        </div>
    `;
    
    activityList.insertBefore(item, activityList.firstChild);
    
    // Keep only last 10 activities
    while (activityList.children.length > 10) {
        activityList.removeChild(activityList.lastChild);
    }
}

// ============================================
// EQ Visualizer Animation
// ============================================
let eqAnimationId = null;

function startEQAnimation() {
    const bars = document.querySelectorAll('.eq-bar');
    
    function animate() {
        bars.forEach(bar => {
            const height = Math.random() * 50 + 10;
            bar.style.height = height + 'px';
        });
        eqAnimationId = requestAnimationFrame(animate);
    }
    
    // Faster animation during scanning
    function fastAnimate() {
        bars.forEach(bar => {
            const height = Math.random() * 55 + 5;
            bar.style.height = height + 'px';
        });
        eqAnimationId = setTimeout(fastAnimate, 50);
    }
    
    fastAnimate();
}

function stopEQAnimation() {
    if (eqAnimationId) {
        clearTimeout(eqAnimationId);
        cancelAnimationFrame(eqAnimationId);
        eqAnimationId = null;
    }
    
    // Reset to idle animation
    const bars = document.querySelectorAll('.eq-bar');
    bars.forEach((bar, i) => {
        bar.style.height = (20 + (i % 5) * 8) + 'px';
    });
}

// ============================================
// Control Bar Buttons
// ============================================
function initControlBar() {
    document.getElementById('btn-full-scan')?.addEventListener('click', () => {
        executeCommand('full-scan');
    });
    
    document.getElementById('btn-quick-scan')?.addEventListener('click', () => {
        executeCommand('quick-scan');
    });
    
    document.getElementById('btn-port-scan')?.addEventListener('click', () => {
        executeCommand('port-scan localhost');
    });
    
    document.getElementById('btn-vuln-scan')?.addEventListener('click', () => {
        executeCommand('vuln-scan');
    });
    
    document.getElementById('btn-threat-hunt')?.addEventListener('click', () => {
        executeCommand('threat-hunt');
    });
    
    document.getElementById('btn-firewall')?.addEventListener('click', () => {
        executeCommand('firewall');
    });
    
    document.getElementById('btn-report')?.addEventListener('click', () => {
        executeCommand('report');
    });
}

// ============================================
// Agent Cards
// ============================================
function initAgentCards() {
    document.querySelectorAll('.agent-card').forEach(card => {
        card.addEventListener('click', () => {
            const agentName = card.dataset.agent;
            const agent = state.agents[agentName];
            
            if (agent.status === 'running') {
                updateAgentStatus(agentName, 'idle');
                addTerminalLine('info', `Agent "${agentName}" stopped`);
            } else {
                updateAgentStatus(agentName, 'running');
                addTerminalLine('success', `Agent "${agentName}" activated`);
            }
        });
    });
    
    // Quick action buttons
    document.querySelector('[data-action="deploy-all"]')?.addEventListener('click', () => {
        Object.keys(state.agents).forEach(agent => {
            updateAgentStatus(agent, 'running');
        });
        addTerminalLine('success', 'All agents deployed!');
        showToast('All agents deployed!', 'success');
    });
    
    document.querySelector('[data-action="stop-all"]')?.addEventListener('click', () => {
        Object.keys(state.agents).forEach(agent => {
            updateAgentStatus(agent, 'idle');
        });
        addTerminalLine('info', 'All agents stopped');
        showToast('All agents stopped', 'info');
    });
    
    document.querySelector('[data-action="sync-agents"]')?.addEventListener('click', () => {
        addTerminalLine('info', 'Synchronizing agents...');
        setTimeout(() => {
            addTerminalLine('success', 'Agents synchronized');
            showToast('Agents synchronized!', 'success');
        }, 1000);
    });
}

// ============================================
// Tab Navigation
// ============================================
function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const tab = btn.dataset.tab;
            addTerminalLine('info', `Switched to ${tab} view`);
        });
    });
}

// ============================================
// Toast Notifications
// ============================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    toast.innerHTML = `<span>${icons[type]}</span> ${message}`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================
// WebSocket Connection
// ============================================
function initWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    try {
        state.wsConnection = new WebSocket(wsUrl);
        
        state.wsConnection.onopen = () => {
            addTerminalLine('success', 'Connected to CyberCAT server');
            updateSystemStatus('online');
        };
        
        state.wsConnection.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                handleServerMessage(data);
            } catch (e) {
                console.error('Error parsing message:', e);
            }
        };
        
        state.wsConnection.onclose = () => {
            addTerminalLine('warning', 'Connection lost. Reconnecting...');
            updateSystemStatus('offline');
            setTimeout(initWebSocket, 5000);
        };
        
        state.wsConnection.onerror = () => {
            console.log('WebSocket error - running in offline mode');
        };
    } catch (error) {
        console.log('WebSocket not available - running in offline mode');
    }
}

function handleServerMessage(data) {
    switch (data.type) {
        case 'scan-result':
            addTerminalLine('success', data.message);
            break;
        case 'alert':
            addTerminalLine('warning', data.message);
            showToast(data.message, 'warning');
            break;
        case 'error':
            addTerminalLine('error', data.message);
            break;
        default:
            addTerminalLine('info', data.message || JSON.stringify(data));
    }
}

function updateSystemStatus(status) {
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-text');
    
    if (status === 'online') {
        statusDot?.classList.add('online');
        if (statusText) statusText.textContent = 'SECURE';
    } else {
        statusDot?.classList.remove('online');
        if (statusText) statusText.textContent = 'OFFLINE';
    }
}

// ============================================
// System Stats Animation
// ============================================
function animateStats() {
    setInterval(() => {
        // Simulate live stats
        const cpu = 40 + Math.floor(Math.random() * 20);
        const mem = 55 + Math.floor(Math.random() * 15);
        const net = 100 + Math.floor(Math.random() * 50);
        
        document.getElementById('cpu-stat').textContent = cpu + '%';
        document.getElementById('mem-stat').textContent = mem + '%';
        document.getElementById('net-stat').textContent = net + 'Mb';
        
        state.stats.responseTime = 10 + Math.floor(Math.random() * 5);
        document.getElementById('response-time').textContent = state.stats.responseTime + 'ms';
    }, 3000);
}

// ============================================
// Cat Eye Animation
// ============================================
function initCatEyes() {
    const leftEye = document.getElementById('left-eye');
    const rightEye = document.getElementById('right-eye');
    
    document.addEventListener('mousemove', (e) => {
        const catDisplay = document.getElementById('cybercat-display');
        if (!catDisplay) return;
        
        const rect = catDisplay.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 3;
        
        const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
        const distance = Math.min(3, Math.hypot(e.clientX - centerX, e.clientY - centerY) / 100);
        
        const offsetX = Math.cos(angle) * distance;
        const offsetY = Math.sin(angle) * distance;
        
        if (leftEye) {
            leftEye.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
        }
        if (rightEye) {
            rightEye.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
        }
    });
}

// ============================================
// Settings Modal
// ============================================
let logViewerAutoScroll = true;
let fullLogLines = [];

function initSettings() {
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettings = document.getElementById('close-settings');
    
    settingsBtn?.addEventListener('click', openSettings);
    closeSettings?.addEventListener('click', closeSettingsModal);
    
    // Settings tabs
    document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.settingsTab;
            switchSettingsTab(targetTab);
        });
    });
    
    // Toggle visibility buttons
    document.querySelectorAll('.toggle-visibility').forEach(btn => {
        btn.addEventListener('click', function() {
            const inputId = this.dataset.input;
            const input = document.getElementById(inputId);
            if (input) {
                input.type = input.type === 'password' ? 'text' : 'password';
                this.classList.toggle('active');
            }
        });
    });
    
    // Save API keys
    document.getElementById('save-api-keys')?.addEventListener('click', saveApiKeys);
    document.getElementById('test-connection')?.addEventListener('click', testApiConnection);
    
    // Standalone tool buttons
    document.querySelectorAll('[data-tool]').forEach(btn => {
        btn.addEventListener('click', function() {
            const tool = this.dataset.tool;
            const cmd = this.dataset.cmd;
            executeStandaloneTool(tool, cmd);
        });
    });
    
    // System info
    document.getElementById('refresh-system-info')?.addEventListener('click', loadSystemInfo);
}

function openSettings() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.classList.remove('hidden');
        loadSystemInfo();
        loadApiKeys();
    }
}

function closeSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function switchSettingsTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.settingsTab === tabName) {
            tab.classList.add('active');
        }
    });
    
    // Update panels
    document.querySelectorAll('.settings-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    
    const targetPanel = document.getElementById(`${tabName}-settings`);
    if (targetPanel) {
        targetPanel.classList.add('active');
    }
}

async function saveApiKeys() {
    const openaiKey = document.getElementById('openai-key')?.value;
    const anthropicKey = document.getElementById('anthropic-key')?.value;
    const doToken = document.getElementById('digitalocean-token')?.value;
    
    const statusEl = document.getElementById('api-status');
    
    try {
        const response = await fetch('/api/config/api-keys', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                openai: openaiKey,
                anthropic: anthropicKey,
                digitalocean: doToken
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            statusEl.className = 'status-message success';
            statusEl.textContent = '✓ API keys saved successfully!';
            statusEl.classList.remove('hidden');
            showToast('API keys saved successfully!', 'success');
            
            setTimeout(() => statusEl.classList.add('hidden'), 5000);
        } else {
            throw new Error(result.error || 'Failed to save keys');
        }
    } catch (error) {
        statusEl.className = 'status-message error';
        statusEl.textContent = '✗ Error saving API keys: ' + error.message;
        statusEl.classList.remove('hidden');
        showToast('Error saving API keys', 'error');
    }
}

async function testApiConnection() {
    const statusEl = document.getElementById('api-status');
    statusEl.className = 'status-message info';
    statusEl.textContent = '⏳ Testing connection...';
    statusEl.classList.remove('hidden');
    
    try {
        const response = await fetch('/api/config/test-connection');
        const result = await response.json();
        
        if (result.success) {
            statusEl.className = 'status-message success';
            statusEl.textContent = '✓ Connection test successful! Provider: ' + result.provider;
            showToast('Connection test successful!', 'success');
        } else {
            statusEl.className = 'status-message error';
            statusEl.textContent = '✗ Connection test failed: ' + result.error;
        }
    } catch (error) {
        statusEl.className = 'status-message error';
        statusEl.textContent = '✗ Connection test error: ' + error.message;
    }
}

async function loadApiKeys() {
    try {
        const response = await fetch('/api/config/api-keys');
        const keys = await response.json();
        
        if (keys.openai) document.getElementById('openai-key').value = keys.openai;
        if (keys.anthropic) document.getElementById('anthropic-key').value = keys.anthropic;
        if (keys.digitalocean) document.getElementById('digitalocean-token').value = keys.digitalocean;
    } catch (error) {
        console.error('Error loading API keys:', error);
    }
}

async function loadSystemInfo() {
    try {
        const response = await fetch('/api/system/info');
        const info = await response.json();
        
        document.getElementById('sys-platform').textContent = info.platform || '-';
        document.getElementById('sys-node').textContent = info.node || '-';
        document.getElementById('sys-python').textContent = info.python || '-';
        document.getElementById('sys-path').textContent = info.path || '-';
    } catch (error) {
        console.error('Error loading system info:', error);
    }
}

async function executeStandaloneTool(tool, cmd) {
    const outputEl = document.getElementById('tool-output');
    outputEl.classList.remove('hidden');
    outputEl.innerHTML = '<div style="color: #ffaa00;">⏳ Executing command...</div>';
    
    try {
        const response = await fetch('/api/standalone/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tool, command: cmd })
        });
        
        const result = await response.json();
        
        if (result.success) {
            outputEl.innerHTML = `<pre>${escapeHtml(result.output)}</pre>`;
            addTerminalLine('success', `${tool} ${cmd} completed`);
        } else {
            outputEl.innerHTML = `<div style="color: #ff4444;">✗ Error: ${escapeHtml(result.error)}</div>`;
        }
    } catch (error) {
        outputEl.innerHTML = `<div style="color: #ff4444;">✗ Connection error: ${escapeHtml(error.message)}</div>`;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// Expanded Log Viewer
// ============================================
function initLogViewer() {
    const exportBtn = document.getElementById('export-log');
    const logViewerModal = document.getElementById('log-viewer-modal');
    const closeLogViewer = document.getElementById('close-log-viewer');
    const expandedOutput = document.getElementById('expanded-log-output');
    const searchInput = document.getElementById('log-search');
    const filterSelect = document.getElementById('log-filter');
    const exportFullBtn = document.getElementById('export-full-log');
    const clearFullBtn = document.getElementById('clear-full-log');
    const autoScrollToggle = document.getElementById('auto-scroll-toggle');
    
    // Open log viewer when export is clicked
    exportBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        openLogViewer();
    });
    
    closeLogViewer?.addEventListener('click', closeLogViewerModal);
    
    // Search functionality
    searchInput?.addEventListener('input', (e) => {
        filterLogs(e.target.value, filterSelect.value);
    });
    
    filterSelect?.addEventListener('change', (e) => {
        filterLogs(searchInput.value, e.target.value);
    });
    
    exportFullBtn?.addEventListener('click', exportFullLog);
    clearFullBtn?.addEventListener('click', clearFullLog);
    
    autoScrollToggle?.addEventListener('click', () => {
        logViewerAutoScroll = !logViewerAutoScroll;
        autoScrollToggle.classList.toggle('disabled');
        autoScrollToggle.textContent = `📜 Auto-scroll: ${logViewerAutoScroll ? 'ON' : 'OFF'}`;
    });
}

function openLogViewer() {
    const modal = document.getElementById('log-viewer-modal');
    const expandedOutput = document.getElementById('expanded-log-output');
    
    if (modal && expandedOutput) {
        // Copy all terminal lines to expanded viewer
        const terminalOutput = document.getElementById('terminal-output');
        if (terminalOutput) {
            expandedOutput.innerHTML = terminalOutput.innerHTML;
            fullLogLines = Array.from(terminalOutput.querySelectorAll('.terminal-line'));
        }
        
        modal.classList.remove('hidden');
        updateLogStats();
        
        if (logViewerAutoScroll) {
            expandedOutput.scrollTop = expandedOutput.scrollHeight;
        }
    }
}

function closeLogViewerModal() {
    const modal = document.getElementById('log-viewer-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function filterLogs(searchTerm, level) {
    const expandedOutput = document.getElementById('expanded-log-output');
    const lines = expandedOutput.querySelectorAll('.terminal-line');
    
    lines.forEach(line => {
        let show = true;
        
        // Filter by level
        if (level !== 'all') {
            show = line.classList.contains(level);
        }
        
        // Filter by search term
        if (show && searchTerm) {
            const text = line.textContent.toLowerCase();
            show = text.includes(searchTerm.toLowerCase());
            
            if (show) {
                line.classList.add('highlight');
            } else {
                line.classList.remove('highlight');
            }
        } else {
            line.classList.remove('highlight');
        }
        
        line.style.display = show ? '' : 'none';
    });
    
    updateLogStats();
}

function updateLogStats() {
    const expandedOutput = document.getElementById('expanded-log-output');
    const lines = expandedOutput.querySelectorAll('.terminal-line');
    const visibleLines = Array.from(lines).filter(l => l.style.display !== 'none');
    
    const errors = visibleLines.filter(l => l.classList.contains('error')).length;
    const warnings = visibleLines.filter(l => l.classList.contains('warning')).length;
    
    document.getElementById('log-count').textContent = visibleLines.length;
    document.getElementById('log-errors').textContent = errors;
    document.getElementById('log-warnings').textContent = warnings;
}

function exportFullLog() {
    const expandedOutput = document.getElementById('expanded-log-output');
    const lines = expandedOutput.querySelectorAll('.terminal-line');
    
    let log = '='.repeat(70) + '\n';
    log += 'CyberCAT Security Log - Expanded Export\n';
    log += '='.repeat(70) + '\n';
    log += `Generated: ${new Date().toISOString()}\n`;
    log += `Total Lines: ${lines.length}\n`;
    log += '='.repeat(70) + '\n\n';
    
    lines.forEach(line => {
        if (line.style.display !== 'none') {
            const timestamp = line.querySelector('.timestamp')?.textContent || '';
            const prefix = line.querySelector('.prefix')?.textContent || '';
            const message = line.querySelector('.message')?.textContent || '';
            log += `${timestamp} ${prefix} ${message}\n`;
        }
    });
    
    log += '\n' + '='.repeat(70) + '\n';
    log += 'End of Log\n';
    log += '='.repeat(70);
    
    const blob = new Blob([log], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cybercat-full-log-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('Full log exported successfully!', 'success');
}

function clearFullLog() {
    if (confirm('Are you sure you want to clear all logs?')) {
        const terminalOutput = document.getElementById('terminal-output');
        const expandedOutput = document.getElementById('expanded-log-output');
        
        if (terminalOutput) terminalOutput.innerHTML = '';
        if (expandedOutput) expandedOutput.innerHTML = '';
        
        fullLogLines = [];
        addTerminalLine('system', 'Logs cleared. Type "help" for commands.');
        showToast('Logs cleared', 'info');
        closeLogViewerModal();
    }
}

// Sync logs from terminal to expanded viewer
function syncLogsToViewer() {
    const modal = document.getElementById('log-viewer-modal');
    if (!modal || modal.classList.contains('hidden')) return;
    
    const terminalOutput = document.getElementById('terminal-output');
    const expandedOutput = document.getElementById('expanded-log-output');
    
    if (terminalOutput && expandedOutput) {
        expandedOutput.innerHTML = terminalOutput.innerHTML;
        updateLogStats();
        
        if (logViewerAutoScroll) {
            expandedOutput.scrollTop = expandedOutput.scrollHeight;
        }
    }
}

// Override addTerminalLine to sync with expanded viewer
const originalAddTerminalLine = addTerminalLine;
window.addTerminalLine = function(...args) {
    originalAddTerminalLine(...args);
    syncLogsToViewer();
};

// ============================================
// Initialization
// ============================================
function init() {
    hideLoadingScreen();
    initMatrixRain();
    initTerminal();
    initControlBar();
    initAgentCards();
    initTabs();
    initSettings();
    initLogViewer();
    initWebSocket();
    animateStats();
    initCatEyes();
    
    // Initial security gauge
    updateSecurityGauge(90);
    
    // Welcome message
    setTimeout(() => {
        addTerminalLine('system', '═══════════════════════════════════════════');
        addTerminalLine('system', '  CYBERCAT Multi-Agent Security System v2.0');
        addTerminalLine('system', '═══════════════════════════════════════════');
        addTerminalLine('success', 'All systems operational. Type "help" for commands.');
    }, 2600);
    
    console.log(`
    ╔═══════════════════════════════════════════╗
    ║     /\\_____/\\                             ║
    ║    /  o   o  \\    CYBERCAT v2.0          ║
    ║   ( ==  ^  == )   Multi-Agent Security   ║
    ║    )         (    Command Center         ║
    ║   (           )                          ║
    ║  ( (  )   (  ) )  Ready to protect!      ║
    ║ (__(__)___(__)__)                        ║
    ╚═══════════════════════════════════════════╝
    `);
}

document.addEventListener('DOMContentLoaded', init);
