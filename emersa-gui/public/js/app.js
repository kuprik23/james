// EMERSA AI Workspace Application
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ============================================
// Global State
// ============================================
const state = {
    avatar: null,
    mixer: null,
    animations: {},
    isMoving: false,
    moveDirection: new THREE.Vector3(),
    wsConnection: null,
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    uploadedFiles: [],
    chatHistory: [],
    activePanel: 'center',
    is3DActive: false,
    currentModel: 'gpt-4'
};

// ============================================
// Three.js Setup
// ============================================
let scene, camera, renderer, controls;
let clock = new THREE.Clock();
let particles;

function initThreeJS() {
    const container = document.getElementById('canvas-container');
    
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0f);
    scene.fog = new THREE.FogExp2(0x0a0a0f, 0.02);
    
    // Camera
    camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 5, 10);
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    
    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 30;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.target.set(0, 1, 0);
    
    // Lighting
    setupLighting();
    
    // Environment
    createEnvironment();
    
    // Particles
    createParticles();
    
    // Avatar
    createPlaceholderAvatar();
    
    // Event Listeners
    window.addEventListener('resize', onWindowResize);
    
    // Start Animation Loop
    animate();
}

function setupLighting() {
    const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
    scene.add(ambientLight);
    
    const mainLight = new THREE.DirectionalLight(0xffffff, 1);
    mainLight.position.set(10, 20, 10);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    scene.add(mainLight);
    
    const cyanLight = new THREE.PointLight(0x00ffcc, 2, 30);
    cyanLight.position.set(-5, 3, 5);
    scene.add(cyanLight);
    
    const magentaLight = new THREE.PointLight(0xff00ff, 1.5, 25);
    magentaLight.position.set(5, 3, -5);
    scene.add(magentaLight);
}

function createEnvironment() {
    // Ground
    const groundGeometry = new THREE.CircleGeometry(50, 64);
    const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x0a0a15,
        metalness: 0.8,
        roughness: 0.4
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    
    // Grid
    const gridHelper = new THREE.GridHelper(100, 100, 0x00ffcc, 0x003333);
    gridHelper.position.y = 0.01;
    gridHelper.material.opacity = 0.3;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);
    
    // Platform
    const platformGeometry = new THREE.CylinderGeometry(3, 3.5, 0.3, 32);
    const platformMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a2e,
        metalness: 0.9,
        roughness: 0.2,
        emissive: 0x00ffcc,
        emissiveIntensity: 0.1
    });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.y = 0.15;
    scene.add(platform);
    
    // Floating orbs
    createFloatingOrbs();
}

function createFloatingOrbs() {
    const orbPositions = [
        { x: -8, y: 2, z: -5, color: 0x00ffcc },
        { x: 8, y: 3, z: -3, color: 0xff00ff },
        { x: -6, y: 4, z: 6, color: 0x00aaff },
        { x: 7, y: 2.5, z: 5, color: 0x00ffcc }
    ];
    
    orbPositions.forEach((pos, index) => {
        const orbGeometry = new THREE.SphereGeometry(0.3, 32, 32);
        const orbMaterial = new THREE.MeshBasicMaterial({
            color: pos.color,
            transparent: true,
            opacity: 0.8
        });
        const orb = new THREE.Mesh(orbGeometry, orbMaterial);
        orb.position.set(pos.x, pos.y, pos.z);
        orb.userData.floatOffset = index * Math.PI / 2.5;
        orb.userData.floatSpeed = 0.5 + Math.random() * 0.5;
        orb.userData.baseY = pos.y;
        scene.add(orb);
    });
}

function createParticles() {
    const particleCount = 300;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    const colorOptions = [
        new THREE.Color(0x00ffcc),
        new THREE.Color(0xff00ff),
        new THREE.Color(0x00aaff)
    ];
    
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 100;
        positions[i * 3 + 1] = Math.random() * 30;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
        
        const color = colorOptions[Math.floor(Math.random() * colorOptions.length)];
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
    }
    
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
        size: 0.1,
        vertexColors: true,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });
    
    particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);
}

function createPlaceholderAvatar() {
    const avatarGroup = new THREE.Group();
    
    // Body
    const bodyGeometry = new THREE.CapsuleGeometry(0.4, 1, 8, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a2e,
        metalness: 0.7,
        roughness: 0.3,
        emissive: 0x00ffcc,
        emissiveIntensity: 0.2
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1.2;
    body.castShadow = true;
    avatarGroup.add(body);
    
    // Head
    const headGeometry = new THREE.SphereGeometry(0.35, 32, 32);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.y = 2.1;
    avatarGroup.add(head);
    
    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.08, 16, 16);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffcc });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.12, 2.15, 0.28);
    avatarGroup.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.12, 2.15, 0.28);
    avatarGroup.add(rightEye);
    
    // Energy Ring
    const ringGeometry = new THREE.TorusGeometry(0.8, 0.02, 16, 64);
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffcc,
        transparent: true,
        opacity: 0.6
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 1.2;
    avatarGroup.add(ring);
    
    avatarGroup.position.set(0, 0.3, 0);
    scene.add(avatarGroup);
    state.avatar = avatarGroup;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    const elapsed = clock.getElapsedTime();
    
    controls.update();
    
    if (state.mixer) {
        state.mixer.update(delta);
    }
    
    // Animate particles
    if (particles) {
        particles.rotation.y += 0.0002;
    }
    
    // Animate floating orbs
    scene.traverse(obj => {
        if (obj.userData.floatOffset !== undefined) {
            obj.position.y = obj.userData.baseY + 
                Math.sin(elapsed * obj.userData.floatSpeed + obj.userData.floatOffset) * 0.5;
        }
    });
    
    // Avatar idle animation
    if (state.avatar && !state.isMoving) {
        state.avatar.position.y = 0.3 + Math.sin(elapsed * 2) * 0.05;
        const ring = state.avatar.children.find(c => c.geometry?.type === 'TorusGeometry');
        if (ring) ring.rotation.z = elapsed;
    }
    
    renderer.render(scene, camera);
}

// ============================================
// UI Initialization
// ============================================
function initUI() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    // Menu toggle
    document.getElementById('menu-toggle')?.addEventListener('click', () => {
        togglePanel('right');
    });
    
    // Mobile navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const panel = btn.dataset.panel;
            handleMobileNav(panel);
        });
    });
    
    // Module cards
    document.querySelectorAll('.module-card').forEach(card => {
        card.addEventListener('click', () => {
            const module = card.dataset.module;
            handleModuleClick(module);
        });
    });
    
    // Module buttons
    document.querySelectorAll('.module-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const action = btn.dataset.action;
            handleModuleAction(action);
        });
    });
    
    // Quick actions
    document.querySelectorAll('.quick-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            handleQuickAction(action);
        });
    });
    
    // Chat controls
    document.getElementById('clear-chat')?.addEventListener('click', clearChat);
    document.getElementById('export-chat')?.addEventListener('click', exportChat);
    document.getElementById('fullscreen-chat')?.addEventListener('click', toggleFullscreenChat);
    
    // Copy buttons
    document.querySelectorAll('.copy-btn, .result-copy').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const content = e.target.closest('.chat-message, .result-card')?.querySelector('.message-content, .result-content');
            if (content) copyToClipboard(content.textContent);
        });
    });
    
    // Initialize input handlers
    initInputHandlers();
    
    // Initialize file upload
    initFileUpload();
    
    // Initialize URL input
    initURLInput();
}

function initInputHandlers() {
    const mainInput = document.getElementById('main-input');
    const sendBtn = document.getElementById('send-btn');
    const voiceBtn = document.getElementById('voice-input-btn');
    const modelSelect = document.getElementById('ai-model-select');
    
    // Send message
    sendBtn?.addEventListener('click', sendMessage);
    mainInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Auto-resize textarea
    mainInput?.addEventListener('input', () => {
        mainInput.style.height = 'auto';
        mainInput.style.height = Math.min(mainInput.scrollHeight, 150) + 'px';
    });
    
    // Voice input
    voiceBtn?.addEventListener('click', startVoiceInput);
    
    // Model selection
    modelSelect?.addEventListener('change', (e) => {
        state.currentModel = e.target.value;
        showToast(`Switched to ${e.target.value}`, 'info');
    });
    
    // Toolbar buttons
    document.getElementById('attach-file-btn')?.addEventListener('click', () => {
        document.getElementById('file-input')?.click();
    });
    
    document.getElementById('add-url-btn')?.addEventListener('click', () => {
        document.getElementById('url-input-container')?.classList.toggle('hidden');
    });
    
    document.getElementById('add-image-btn')?.addEventListener('click', () => {
        const input = document.getElementById('file-input');
        if (input) {
            input.accept = 'image/*';
            input.click();
            input.accept = 'image/*,.pdf,.txt,.json,.csv,.doc,.docx,.xls,.xlsx';
        }
    });
    
    document.getElementById('code-mode-btn')?.addEventListener('click', () => {
        mainInput.placeholder = '// Enter code or describe what code you need...';
        showToast('Code mode activated', 'info');
    });
}

function initFileUpload() {
    const uploadZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('file-input');
    
    // Drag and drop
    uploadZone?.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });
    
    uploadZone?.addEventListener('dragleave', () => {
        uploadZone.classList.remove('dragover');
    });
    
    uploadZone?.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });
    
    // File input change
    fileInput?.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });
}

function handleFiles(files) {
    const uploadedFilesContainer = document.getElementById('uploaded-files');
    
    Array.from(files).forEach(file => {
        const fileData = {
            name: file.name,
            size: file.size,
            type: file.type,
            file: file
        };
        
        state.uploadedFiles.push(fileData);
        
        // Create preview
        const preview = document.createElement('div');
        preview.className = 'file-preview';
        
        if (file.type.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            preview.appendChild(img);
        } else {
            const icon = document.createElement('span');
            icon.className = 'file-icon';
            icon.textContent = getFileIcon(file.type);
            preview.appendChild(icon);
        }
        
        const info = document.createElement('div');
        info.className = 'file-info';
        info.innerHTML = `
            <span class="file-name">${file.name}</span>
            <span class="file-size">${formatFileSize(file.size)}</span>
        `;
        preview.appendChild(info);
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'file-remove';
        removeBtn.textContent = '✕';
        removeBtn.onclick = () => {
            state.uploadedFiles = state.uploadedFiles.filter(f => f.name !== file.name);
            preview.remove();
            if (state.uploadedFiles.length === 0) {
                uploadedFilesContainer?.classList.add('hidden');
            }
        };
        preview.appendChild(removeBtn);
        
        uploadedFilesContainer?.appendChild(preview);
        uploadedFilesContainer?.classList.remove('hidden');
    });
    
    showToast(`${files.length} file(s) uploaded`, 'success');
}

function getFileIcon(type) {
    if (type.includes('pdf')) return '📄';
    if (type.includes('image')) return '🖼️';
    if (type.includes('json')) return '📋';
    if (type.includes('csv') || type.includes('excel')) return '📊';
    if (type.includes('word') || type.includes('document')) return '📝';
    return '📁';
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function initURLInput() {
    const analyzeBtn = document.getElementById('analyze-url-btn');
    const closeBtn = document.getElementById('close-url-btn');
    const urlInput = document.getElementById('url-input');
    
    analyzeBtn?.addEventListener('click', () => {
        const url = urlInput?.value.trim();
        if (url) {
            analyzeWebsite(url);
        } else {
            showToast('Please enter a URL', 'warning');
        }
    });
    
    closeBtn?.addEventListener('click', () => {
        document.getElementById('url-input-container')?.classList.add('hidden');
    });
    
    urlInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            analyzeBtn?.click();
        }
    });
}

// ============================================
// Message Handling
// ============================================
function sendMessage() {
    const input = document.getElementById('main-input');
    const message = input?.value.trim();
    
    if (!message && state.uploadedFiles.length === 0) return;
    
    // Add user message to chat
    addChatMessage('user', message, state.uploadedFiles);
    
    // Clear input
    if (input) input.value = '';
    input.style.height = 'auto';
    
    // Clear uploaded files
    const uploadedFilesContainer = document.getElementById('uploaded-files');
    if (uploadedFilesContainer) {
        uploadedFilesContainer.innerHTML = '';
        uploadedFilesContainer.classList.add('hidden');
    }
    state.uploadedFiles = [];
    
    // Process message
    processMessage(message);
}

function addChatMessage(role, content, files = []) {
    const chatMessages = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${role}`;
    
    let filesHtml = '';
    if (files.length > 0) {
        filesHtml = '<div class="message-files">' + 
            files.map(f => `<span class="file-tag">${getFileIcon(f.type)} ${f.name}</span>`).join('') +
            '</div>';
    }
    
    messageDiv.innerHTML = `
        <div class="message-content">
            ${filesHtml}
            <p>${formatMessageContent(content)}</p>
        </div>
        <button class="copy-btn" title="Copy">📋</button>
    `;
    
    // Add copy functionality
    messageDiv.querySelector('.copy-btn')?.addEventListener('click', () => {
        copyToClipboard(content);
    });
    
    chatMessages?.appendChild(messageDiv);
    chatMessages?.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });
    
    // Save to history
    state.chatHistory.push({ role, content, files: files.map(f => f.name), timestamp: Date.now() });
}

function formatMessageContent(content) {
    if (!content) return '';
    
    // Convert markdown-like syntax
    return content
        .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
}

async function processMessage(message) {
    // Show typing indicator
    showTypingIndicator();
    
    try {
        // Send to WebSocket if connected
        if (state.wsConnection && state.wsConnection.readyState === WebSocket.OPEN) {
            state.wsConnection.send(JSON.stringify({
                type: 'message',
                content: message,
                model: state.currentModel,
                files: state.uploadedFiles.map(f => f.name)
            }));
        } else {
            // Simulate AI response for demo
            await simulateAIResponse(message);
        }
    } catch (error) {
        console.error('Error processing message:', error);
        hideTypingIndicator();
        addChatMessage('assistant', 'Sorry, there was an error processing your request. Please try again.');
    }
}

async function simulateAIResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    hideTypingIndicator();
    
    let response = '';
    
    if (lowerMessage.includes('analyze') && lowerMessage.includes('website')) {
        response = `I'll analyze the website for you. Here's what I can check:

**Security Analysis:**
- SSL/TLS configuration
- Security headers
- Vulnerability scanning
- OWASP Top 10 checks

**Performance:**
- Page load times
- Resource optimization
- Core Web Vitals

**SEO & Accessibility:**
- Meta tags
- Structured data
- WCAG compliance

Please provide the URL you'd like me to analyze, or use the URL input field above.`;
        
    } else if (lowerMessage.includes('security') || lowerMessage.includes('scan')) {
        response = `🔐 **Security Scan Initiated**

I can perform the following security assessments:

1. **Vulnerability Scan** - Check for known CVEs
2. **Port Scan** - Identify open ports and services
3. **SSL Analysis** - Certificate and configuration check
4. **Header Analysis** - Security headers review
5. **Penetration Test** - Simulated attack scenarios

Which type of scan would you like to run? You can also specify a target IP or domain.`;
        updateResultCard('security-results', 'Security scan ready. Awaiting target specification...');
        
    } else if (lowerMessage.includes('generate') || lowerMessage.includes('create')) {
        response = `✨ **Content Generation Ready**

I can generate various types of content:

- **Text**: Articles, reports, documentation
- **Code**: Functions, scripts, full applications
- **Images**: Descriptions for image generation
- **Data**: Sample datasets, configurations

What would you like me to create?`;
        
    } else if (lowerMessage.includes('connect') || lowerMessage.includes('api')) {
        response = `🔗 **API Connection Manager**

Currently connected services:
- ✅ Digital Ocean (2 droplets active)
- ✅ Local AI Engine
- ✅ Memory Store

Available integrations:
- OpenAI / Claude API
- GitHub
- Slack / Discord
- Custom REST APIs

Would you like to add a new connection or manage existing ones?`;
        
    } else if (lowerMessage.includes('memory') || lowerMessage.includes('remember')) {
        response = `💾 **Memory System**

Your knowledge base contains:
- 📊 1.2GB of stored data
- 📝 847 indexed entries
- 🔍 Full-text search enabled

I can:
- Store new information
- Retrieve past conversations
- Search your knowledge base
- Export data

What would you like to do with your memory?`;
        
    } else {
        response = `I understand you're asking about: "${message}"

I'm EMERSA, your AI workspace assistant. I can help you with:

🤖 **Gen AI** - Create content, code, and more
🌳 **Ambient** - Monitor and connect to systems
🔗 **API** - Integrate external services
💾 **Memory** - Store and retrieve knowledge
🔐 **Security** - Scan and protect systems
👥 **Agents** - Deploy multi-agent workflows

How can I assist you today?`;
    }
    
    addChatMessage('assistant', response);
}

function showTypingIndicator() {
    const chatMessages = document.getElementById('chat-messages');
    const indicator = document.createElement('div');
    indicator.className = 'chat-message assistant typing-indicator';
    indicator.id = 'typing-indicator';
    indicator.innerHTML = `
        <div class="message-content">
            <div class="typing-dots">
                <span></span><span></span><span></span>
            </div>
        </div>
    `;
    chatMessages?.appendChild(indicator);
    chatMessages?.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });
    
    // Add typing animation styles
    if (!document.getElementById('typing-styles')) {
        const styles = document.createElement('style');
        styles.id = 'typing-styles';
        styles.textContent = `
            .typing-dots {
                display: flex;
                gap: 5px;
                padding: 10px 0;
            }
            .typing-dots span {
                width: 8px;
                height: 8px;
                background: var(--primary-color);
                border-radius: 50%;
                animation: typing 1.4s infinite ease-in-out;
            }
            .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
            .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
            @keyframes typing {
                0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
                40% { transform: scale(1); opacity: 1; }
            }
            .message-files {
                display: flex;
                flex-wrap: wrap;
                gap: 5px;
                margin-bottom: 10px;
            }
            .file-tag {
                padding: 4px 10px;
                background: rgba(0, 255, 204, 0.1);
                border-radius: 4px;
                font-size: 0.75rem;
                color: var(--primary-color);
            }
        `;
        document.head.appendChild(styles);
    }
}

function hideTypingIndicator() {
    document.getElementById('typing-indicator')?.remove();
}

// ============================================
// Module Handlers
// ============================================
function handleModuleClick(module) {
    const messages = {
        'gen-ai': 'Gen AI module - Create text, images, and code',
        'ambient': 'Ambient module - Digital twin and system monitoring',
        'api': 'API module - External service integration',
        'memory': 'Memory module - Knowledge base and context',
        'agents': 'Multi-Agent module - Orchestrate AI agents',
        'security': 'Security module - Quantum-proof encryption and scanning'
    };
    
    showToast(messages[module] || 'Module selected', 'info');
    
    // Highlight the module
    document.querySelectorAll('.module-card').forEach(card => {
        card.style.borderColor = card.dataset.module === module ? 'var(--primary-color)' : '';
    });
}

function handleModuleAction(action) {
    switch (action) {
        case 'gen-text':
            document.getElementById('main-input').placeholder = 'Describe the text content you want to generate...';
            document.getElementById('main-input').focus();
            break;
        case 'gen-image':
            document.getElementById('main-input').placeholder = 'Describe the image you want to create...';
            document.getElementById('main-input').focus();
            break;
        case 'gen-code':
            document.getElementById('main-input').placeholder = '// Describe the code you need...';
            document.getElementById('main-input').focus();
            break;
        case 'connect-system':
            showModal('Connect System', `
                <div class="modal-form">
                    <input type="text" placeholder="System hostname or IP" class="modal-input">
                    <select class="modal-input">
                        <option>SSH</option>
                        <option>HTTP/HTTPS</option>
                        <option>Database</option>
                        <option>Custom</option>
                    </select>
                    <button class="modal-btn" onclick="connectSystem()">Connect</button>
                </div>
            `);
            break;
        case 'monitor':
            showToast('Opening system monitor...', 'info');
            updateResultCard('website-analysis', `
                <h4>System Monitor</h4>
                <p>CPU: 45% | Memory: 62% | Disk: 78%</p>
                <p>Network: 125 Mbps ↓ | 45 Mbps ↑</p>
                <p>Active connections: 23</p>
            `);
            break;
        case 'api-list':
            showModal('Connected APIs', `
                <div class="api-list">
                    <div class="api-item">
                        <span>☁️ Digital Ocean</span>
                        <span class="status online">Connected</span>
                    </div>
                    <div class="api-item">
                        <span>🤖 OpenAI</span>
                        <span class="status">Not configured</span>
                    </div>
                    <div class="api-item">
                        <span>🐙 GitHub</span>
                        <span class="status">Not configured</span>
                    </div>
                </div>
            `);
            break;
        case 'api-add':
            showModal('Add API Connection', `
                <div class="modal-form">
                    <input type="text" placeholder="API Name" class="modal-input">
                    <input type="url" placeholder="API Endpoint" class="modal-input">
                    <input type="password" placeholder="API Key" class="modal-input">
                    <button class="modal-btn" onclick="addAPI()">Add Connection</button>
                </div>
            `);
            break;
        case 'memory-view':
            showModal('Memory Store', `
                <div class="memory-view">
                    <p>📊 Total: 1.2GB | 📝 Entries: 847</p>
                    <div class="memory-search">
                        <input type="text" placeholder="Search memory..." class="modal-input">
                    </div>
                    <div class="memory-entries">
                        <div class="memory-entry">Chat history - 234 entries</div>
                        <div class="memory-entry">Documents - 156 files</div>
                        <div class="memory-entry">Code snippets - 89 items</div>
                        <div class="memory-entry">Analysis results - 368 records</div>
                    </div>
                </div>
            `);
            break;
        case 'memory-add':
            showModal('Add to Memory', `
                <div class="modal-form">
                    <input type="text" placeholder="Title/Label" class="modal-input">
                    <textarea placeholder="Content to remember..." class="modal-textarea"></textarea>
                    <select class="modal-input">
                        <option>General</option>
                        <option>Code</option>
                        <option>Document</option>
                        <option>Analysis</option>
                    </select>
                    <button class="modal-btn" onclick="addMemory()">Save to Memory</button>
                </div>
            `);
            break;
        case 'agents-list':
            showModal('Active Agents', `
                <div class="agents-list">
                    <div class="agent-item">
                        <span>🔍 Scanner Agent</span>
                        <span class="status online">Active</span>
                    </div>
                    <div class="agent-item">
                        <span>📊 Analyzer Agent</span>
                        <span class="status">Idle</span>
                    </div>
                    <div class="agent-item">
                        <span>🛡️ Security Agent</span>
                        <span class="status online">Active</span>
                    </div>
                </div>
            `);
            break;
        case 'agents-deploy':
            showModal('Deploy Agent', `
                <div class="modal-form">
                    <select class="modal-input">
                        <option>Scanner Agent</option>
                        <option>Analyzer Agent</option>
                        <option>Security Agent</option>
                        <option>Custom Agent</option>
                    </select>
                    <input type="text" placeholder="Target/Task" class="modal-input">
                    <button class="modal-btn" onclick="deployAgent()">Deploy</button>
                </div>
            `);
            break;
        case 'pentest':
            showModal('Penetration Test', `
                <div class="modal-form">
                    <input type="text" placeholder="Target URL or IP" class="modal-input" id="pentest-target">
                    <select class="modal-input" id="pentest-type">
                        <option value="quick">Quick Scan</option>
                        <option value="full">Full Assessment</option>
                        <option value="vuln">Vulnerability Scan</option>
                        <option value="web">Web Application Test</option>
                    </select>
                    <button class="modal-btn" onclick="startPentest()">Start Test</button>
                </div>
            `);
            break;
        case 'scan':
            showToast('Starting security scan...', 'info');
            simulateSecurityScan();
            break;
        default:
            showToast(`Action: ${action}`, 'info');
    }
}

function handleQuickAction(action) {
    switch (action) {
        case 'analyze-website':
            document.getElementById('url-input-container')?.classList.remove('hidden');
            document.getElementById('url-input')?.focus();
            break;
        case 'generate-report':
            showToast('Generating report...', 'info');
            generateReport();
            break;
        case 'security-scan':
            handleModuleAction('scan');
            break;
        case 'create-content':
            document.getElementById('main-input').placeholder = 'Describe what content you want to create...';
            document.getElementById('main-input').focus();
            break;
    }
}

// ============================================
// Analysis Functions
// ============================================
async function analyzeWebsite(url) {
    showToast(`Analyzing ${url}...`, 'info');
    
    // Add to chat
    addChatMessage('user', `Analyze website: ${url}`);
    showTypingIndicator();
    
    // Simulate analysis
    await new Promise(resolve => setTimeout(resolve, 2000));
    hideTypingIndicator();
    
    const analysis = `
**Website Analysis: ${url}**

🔒 **Security:**
- SSL: Valid certificate
- Headers: 7/10 security headers present
- Vulnerabilities: None critical detected

⚡ **Performance:**
- Load time: 2.3s
- Page size: 1.8MB
- Requests: 45

📊 **SEO:**
- Meta tags: Present
- Mobile friendly: Yes
- Structured data: Partial

🔍 **Technologies:**
- Framework: React
- Server: Nginx
- CDN: Cloudflare
    `;
    
    addChatMessage('assistant', analysis);
    updateResultCard('website-analysis', analysis.replace(/\*\*/g, '').replace(/\n/g, '<br>'));
}

function simulateSecurityScan() {
    let progress = 0;
    const interval = setInterval(() => {
        progress += 10;
        updateResultCard('security-results', `
            <div class="scan-progress">
                <div class="progress-bar" style="width: ${progress}%"></div>
            </div>
            <p>Scanning... ${progress}%</p>
            <p>Checking ports, vulnerabilities, and configurations...</p>
        `);
        
        if (progress >= 100) {
            clearInterval(interval);
            updateResultCard('security-results', `
                <h4>✅ Scan Complete</h4>
                <p><strong>Ports:</strong> 3 open (22, 80, 443)</p>
                <p><strong>Vulnerabilities:</strong> 0 critical, 2 medium</p>
                <p><strong>SSL:</strong> A+ rating</p>
                <p><strong>Headers:</strong> 8/10 configured</p>
            `);
            showToast('Security scan complete!', 'success');
        }
    }, 500);
    
    // Add progress bar styles
    if (!document.getElementById('progress-styles')) {
        const styles = document.createElement('style');
        styles.id = 'progress-styles';
        styles.textContent = `
            .scan-progress {
                height: 4px;
                background: var(--bg-darker);
                border-radius: 2px;
                overflow: hidden;
                margin-bottom: 10px;
            }
            .progress-bar {
                height: 100%;
                background: var(--primary-color);
                transition: width 0.3s ease;
            }
        `;
        document.head.appendChild(styles);
    }
}

function generateReport() {
    updateResultCard('generated-content', `
        <h4>📊 Generated Report</h4>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        <p><strong>Type:</strong> System Analysis</p>
        <hr>
        <p>Summary of findings and recommendations...</p>
        <p>• 2 active droplets monitored</p>
        <p>• 0 critical security issues</p>
        <p>• System health: Good</p>
    `);
    showToast('Report generated!', 'success');
}

// ============================================
// UI Helpers
// ============================================
function updateResultCard(cardId, content) {
    const card = document.getElementById(cardId);
    const contentDiv = card?.querySelector('.result-content');
    if (contentDiv) {
        contentDiv.innerHTML = content;
    }
}

function showModal(title, content) {
    const container = document.getElementById('modal-container');
    container.innerHTML = `
        <div class="modal-box">
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="modal-close" onclick="closeModal()">✕</button>
            </div>
            <div class="modal-content">
                ${content}
            </div>
        </div>
    `;
    container.classList.add('active');
    
    // Add modal styles
    if (!document.getElementById('modal-styles')) {
        const styles = document.createElement('style');
        styles.id = 'modal-styles';
        styles.textContent = `
            .modal-form {
                display: flex;
                flex-direction: column;
                gap: 15px;
            }
            .modal-input, .modal-textarea {
                padding: 12px 15px;
                background: var(--bg-input);
                border: 1px solid var(--border-subtle);
                border-radius: 8px;
                color: var(--text-primary);
                font-size: 0.9rem;
            }
            .modal-textarea {
                min-height: 100px;
                resize: vertical;
            }
            .modal-btn {
                padding: 12px;
                background: var(--primary-color);
                border: none;
                border-radius: 8px;
                color: var(--bg-dark);
                font-weight: 600;
                cursor: pointer;
            }
            .api-list, .agents-list, .memory-entries {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .api-item, .agent-item, .memory-entry {
                display: flex;
                justify-content: space-between;
                padding: 10px;
                background: var(--bg-input);
                border-radius: 8px;
            }
            .status { color: var(--text-muted); }
            .status.online { color: var(--success-color); }
        `;
        document.head.appendChild(styles);
    }
}

window.closeModal = function() {
    document.getElementById('modal-container').classList.remove('active');
};

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    toast.innerHTML = `<span>${icons[type] || ''}</span> ${message}`;
    container?.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!', 'success');
    }).catch(() => {
        showToast('Failed to copy', 'error');
    });
}

function clearChat() {
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
        chatMessages.innerHTML = `
            <div class="chat-message system">
                <div class="message-content">
                    <p>Chat cleared. How can I help you?</p>
                </div>
            </div>
        `;
    }
    state.chatHistory = [];
    showToast('Chat cleared', 'info');
}

function exportChat() {
    const chatData = JSON.stringify(state.chatHistory, null, 2);
    const blob = new Blob([chatData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `emersa-chat-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Chat exported!', 'success');
}

function toggleFullscreenChat() {
    const chatContainer = document.getElementById('chat-container');
    chatContainer?.classList.toggle('fullscreen');
    
    if (!document.getElementById('fullscreen-styles')) {
        const styles = document.createElement('style');
        styles.id = 'fullscreen-styles';
        styles.textContent = `
            #chat-container.fullscreen {
                position: fixed;
                top: 60px;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 100;
                background: var(--bg-card);
                border-radius: 0;
            }
        `;
        document.head.appendChild(styles);
    }
}

// ============================================
// Mobile Navigation
// ============================================
function handleMobileNav(panel) {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.panel === panel);
    });
    
    const leftPanel = document.getElementById('left-panel');
    const rightPanel = document.getElementById('right-panel');
    const canvasContainer = document.getElementById('canvas-container');
    
    leftPanel?.classList.remove('active');
    rightPanel?.classList.remove('active');
    canvasContainer?.classList.remove('active');
    
    switch (panel) {
        case 'left':
            leftPanel?.classList.add('active');
            break;
        case 'right':
            rightPanel?.classList.add('active');
            break;
        case '3d':
            canvasContainer?.classList.add('active');
            state.is3DActive = true;
            break;
        default:
            state.is3DActive = false;
    }
    
    state.activePanel = panel;
}

function togglePanel(panel) {
    const panelEl = document.getElementById(`${panel}-panel`);
    panelEl?.classList.toggle('active');
}

// ============================================
// Voice Input
// ============================================
function startVoiceInput() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showToast('Voice input not supported', 'error');
        return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    
    const voiceBtn = document.getElementById('voice-input-btn');
    
    recognition.onstart = () => {
        voiceBtn?.classList.add('active');
        showToast('Listening...', 'info');
    };
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const input = document.getElementById('main-input');
        if (input) input.value = transcript;
    };
    
    recognition.onerror = () => {
        showToast('Voice recognition error', 'error');
    };
    
    recognition.onend = () => {
        voiceBtn?.classList.remove('active');
    };
    
    recognition.start();
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
            console.log('WebSocket connected');
        };
        
        state.wsConnection.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleServerMessage(data);
        };
        
        state.wsConnection.onclose = () => {
            setTimeout(initWebSocket, 5000);
        };
    } catch (error) {
        console.error('WebSocket error:', error);
    }
}

function handleServerMessage(data) {
    hideTypingIndicator();
    
    switch (data.type) {
        case 'response':
            addChatMessage('assistant', data.content);
            break;
        case 'error':
            showToast(data.content, 'error');
            break;
        case 'result':
            if (data.cardId) {
                updateResultCard(data.cardId, data.content);
            }
            break;
    }
}

// ============================================
// Global Functions for Modal Actions
// ============================================
window.connectSystem = function() {
    showToast('Connecting to system...', 'info');
    closeModal();
};

window.addAPI = function() {
    showToast('API connection added!', 'success');
    closeModal();
};

window.addMemory = function() {
    showToast('Saved to memory!', 'success');
    closeModal();
};

window.deployAgent = function() {
    showToast('Agent deployed!', 'success');
    closeModal();
};

window.startPentest = function() {
    const target = document.getElementById('pentest-target')?.value;
    if (!target) {
        showToast('Please enter a target', 'warning');
        return;
    }
    showToast(`Starting pentest on ${target}...`, 'info');
    closeModal();
    simulateSecurityScan();
};

// ============================================
// Initialization
// ============================================
function init() {
    // Hide loading screen
    setTimeout(() => {
        document.getElementById('loading-screen')?.classList.add('hidden');
    }, 1500);
    
    initThreeJS();
    initUI();
    initWebSocket();
    
    console.log('EMERSA AI Workspace initialized');
}

document.addEventListener('DOMContentLoaded', init);