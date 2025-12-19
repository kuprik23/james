/**
 * James Ultimate - Agent Manager
 * Manages multiple AI agents with different specializations
 * 
 * Copyright © 2025 Emersa Ltd. All Rights Reserved.
 */

import { EventEmitter } from 'events';
import { llmProvider } from '../llm/provider';
import { Agent, ChatMessage, ChatResponse } from '../types';

interface AgentConfig {
  name: string;
  description: string;
  icon: string;
  systemPrompt: string;
  tools: string[];
  temperature: number;
  customizable?: boolean;
}

interface ConversationMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface AgentCustomization {
  name?: string;
  description?: string;
  systemPrompt?: string;
  temperature?: number;
  tools?: string[];
  icon?: string;
  [key: string]: any;
}

export class AgentManager extends EventEmitter {
  private agents: Map<string, Agent>;
  public activeAgent: Agent | null;
  private conversationHistory: ConversationMessage[];
  private maxHistoryLength: number;
  
  constructor() {
    super();
    this.agents = new Map();
    this.activeAgent = null;
    this.conversationHistory = [];
    this.maxHistoryLength = 50;
    
    // Initialize default agents
    this.initializeDefaultAgents();
  }

  private initializeDefaultAgents(): void {
    // Security Analyst Agent
    this.registerAgent('security-analyst', {
      name: 'Security Analyst',
      description: 'Expert in vulnerability assessment, threat analysis, and security auditing',
      icon: '🔒',
      systemPrompt: `You are James, an expert cybersecurity analyst. Your specializations include:
- Vulnerability assessment and penetration testing
- Threat intelligence and analysis
- Security auditing and compliance
- Incident response and forensics
- Risk assessment and mitigation

When analyzing security issues:
1. Identify the threat vector and potential impact
2. Assess the severity (Critical, High, Medium, Low)
3. Provide specific remediation steps
4. Suggest preventive measures

Always be thorough, accurate, and provide actionable recommendations.`,
      tools: ['port_scan', 'vulnerability_scan', 'malware_analysis', 'log_analysis'],
      temperature: 0.3
    });

    // Network Guardian Agent
    this.registerAgent('network-guardian', {
      name: 'Network Guardian',
      description: 'Specializes in network security, traffic analysis, and intrusion detection',
      icon: '🌐',
      systemPrompt: `You are James Network Guardian, specializing in network security. Your expertise includes:
- Network traffic analysis and monitoring
- Intrusion detection and prevention
- Firewall configuration and management
- VPN and secure communications
- Network segmentation and architecture

When analyzing network issues:
1. Identify suspicious traffic patterns
2. Detect potential intrusions or anomalies
3. Recommend network hardening measures
4. Suggest optimal network architecture

Provide detailed technical analysis with specific configurations when needed.`,
      tools: ['network_scan', 'traffic_analysis', 'dns_lookup', 'whois_lookup', 'traceroute'],
      temperature: 0.3
    });

    // IoT Security Agent
    this.registerAgent('iot-security', {
      name: 'IoT Security Specialist',
      description: 'Expert in IoT device security, firmware analysis, and embedded systems',
      icon: '📡',
      systemPrompt: `You are James IoT Security Specialist. Your expertise includes:
- IoT device security assessment
- Firmware analysis and reverse engineering
- Protocol security (MQTT, CoAP, Zigbee, Z-Wave)
- Embedded systems security
- Smart home and industrial IoT security

When analyzing IoT security:
1. Identify device vulnerabilities
2. Assess communication protocol security
3. Check for default credentials and misconfigurations
4. Recommend secure IoT architecture

Focus on practical security measures for IoT environments.`,
      tools: ['iot_scan', 'mqtt_monitor', 'firmware_analysis', 'protocol_analysis'],
      temperature: 0.4
    });

    // Threat Hunter Agent
    this.registerAgent('threat-hunter', {
      name: 'Threat Hunter',
      description: 'Proactive threat hunting, malware analysis, and APT detection',
      icon: '🎯',
      systemPrompt: `You are James Threat Hunter, specializing in proactive threat detection. Your expertise includes:
- Advanced Persistent Threat (APT) detection
- Malware analysis and reverse engineering
- Threat hunting methodologies
- Indicators of Compromise (IoC) analysis
- MITRE ATT&CK framework mapping

When hunting threats:
1. Identify potential indicators of compromise
2. Map activities to MITRE ATT&CK techniques
3. Analyze malware behavior and capabilities
4. Provide threat intelligence context

Be proactive and thorough in identifying hidden threats.`,
      tools: ['process_analysis', 'file_analysis', 'registry_analysis', 'memory_analysis', 'ioc_check'],
      temperature: 0.3
    });

    // Compliance Auditor Agent
    this.registerAgent('compliance-auditor', {
      name: 'Compliance Auditor',
      description: 'Expert in security compliance, regulations, and best practices',
      icon: '📋',
      systemPrompt: `You are James Compliance Auditor, specializing in security compliance. Your expertise includes:
- NIST Cybersecurity Framework
- ISO 27001/27002
- PCI DSS compliance
- HIPAA security requirements
- GDPR data protection
- SOC 2 controls

When auditing compliance:
1. Identify applicable regulations and standards
2. Assess current compliance status
3. Document gaps and deficiencies
4. Provide remediation roadmap

Be thorough and reference specific control requirements.`,
      tools: ['compliance_check', 'policy_analysis', 'audit_report'],
      temperature: 0.2
    });

    // Incident Responder Agent
    this.registerAgent('incident-responder', {
      name: 'Incident Responder',
      description: 'Rapid incident response, containment, and recovery specialist',
      icon: '🚨',
      systemPrompt: `You are James Incident Responder, specializing in security incident handling. Your expertise includes:
- Incident triage and classification
- Containment and eradication
- Evidence preservation and forensics
- Recovery and restoration
- Post-incident analysis

When responding to incidents:
1. Assess the scope and severity immediately
2. Recommend containment actions
3. Preserve evidence for forensics
4. Guide recovery procedures
5. Document lessons learned

Act quickly and decisively while maintaining forensic integrity.`,
      tools: ['incident_triage', 'containment', 'forensics', 'recovery'],
      temperature: 0.3
    });

    // Code Security Agent
    this.registerAgent('code-security', {
      name: 'Code Security Analyst',
      description: 'Application security, code review, and secure development practices',
      icon: '💻',
      systemPrompt: `You are James Code Security Analyst, specializing in application security. Your expertise includes:
- Secure code review
- OWASP Top 10 vulnerabilities
- Static and dynamic analysis
- Secure development lifecycle (SDLC)
- API security

When analyzing code security:
1. Identify security vulnerabilities
2. Explain the risk and potential exploit
3. Provide secure code alternatives
4. Recommend security testing approaches

Focus on practical, implementable security improvements.`,
      tools: ['code_analysis', 'dependency_check', 'api_security_test'],
      temperature: 0.3
    });

    // General Assistant Agent
    this.registerAgent('assistant', {
      name: 'General Assistant',
      description: 'General-purpose AI assistant for various tasks',
      icon: '🤖',
      systemPrompt: `You are James, a helpful AI assistant. You can help with:
- General questions and information
- Task planning and organization
- Research and analysis
- Writing and communication
- Problem-solving

Be helpful, accurate, and friendly in your responses.`,
      tools: ['web_search', 'calculator', 'file_operations'],
      temperature: 0.7
    });

    // Custom Agent Template
    this.registerAgent('custom', {
      name: 'Custom Agent',
      description: 'Customizable agent - configure through chat',
      icon: '⚙️',
      systemPrompt: `You are a customizable AI agent. The user can modify your behavior and specialization through chat commands.

Available customization commands:
- /agent set name <name> - Set agent name
- /agent set role <role> - Set agent role/specialization
- /agent set personality <description> - Set personality traits
- /agent add skill <skill> - Add a skill or capability
- /agent set temperature <0-1> - Set creativity level

Current configuration will be applied to your responses.`,
      tools: [],
      temperature: 0.5,
      customizable: true
    });

    // Set default active agent
    this.setActiveAgent('security-analyst');
  }

  registerAgent(id: string, config: AgentConfig): void {
    this.agents.set(id, {
      id,
      name: config.name,
      description: config.description,
      icon: config.icon || '🤖',
      systemPrompt: config.systemPrompt,
      tools: config.tools || [],
      temperature: config.temperature || 0.7,
      customizable: config.customizable || false,
      customConfig: {},
      isActive: false
    });
  }

  getAgents(): Agent[] {
    return Array.from(this.agents.values()).map(a => ({
      ...a,
      isActive: this.activeAgent?.id === a.id
    }));
  }

  getAgent(id: string): Agent | undefined {
    return this.agents.get(id);
  }

  setActiveAgent(agentId: string): { id: string; name: string } {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent '${agentId}' not found`);
    }
    
    this.activeAgent = agent;
    this.emit('agentChanged', { agent: agentId, name: agent.name });
    
    return { id: agentId, name: agent.name };
  }

  customizeAgent(agentId: string, customization: AgentCustomization): Agent {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent '${agentId}' not found`);
    }
    
    if (customization.name) agent.name = customization.name;
    if (customization.description) agent.description = customization.description;
    if (customization.systemPrompt) agent.systemPrompt = customization.systemPrompt;
    if (customization.temperature !== undefined) agent.temperature = customization.temperature;
    if (customization.tools) agent.tools = customization.tools;
    if (customization.icon) agent.icon = customization.icon;
    
    if (!agent.customConfig) {
      agent.customConfig = {};
    }
    Object.assign(agent.customConfig, customization);
    
    this.emit('agentCustomized', { agent: agentId, customization });
    
    return agent;
  }

  createCustomAgent(id: string, config: Partial<AgentConfig>): Agent {
    if (this.agents.has(id)) {
      throw new Error(`Agent '${id}' already exists`);
    }
    
    this.registerAgent(id, {
      name: config.name || `Custom Agent ${id}`,
      description: config.description || 'Custom AI agent',
      icon: config.icon || '🔧',
      systemPrompt: config.systemPrompt || 'You are a helpful AI assistant.',
      tools: config.tools || [],
      temperature: config.temperature || 0.7,
      customizable: true
    });
    
    this.emit('agentCreated', { agent: id });
    
    return this.agents.get(id)!;
  }

  deleteAgent(agentId: string): void {
    if (!this.agents.has(agentId)) {
      throw new Error(`Agent '${agentId}' not found`);
    }
    
    // Don't delete default agents
    const defaultAgents = ['security-analyst', 'network-guardian', 'iot-security', 
                          'threat-hunter', 'compliance-auditor', 'incident-responder',
                          'code-security', 'assistant', 'custom'];
    
    if (defaultAgents.includes(agentId)) {
      throw new Error(`Cannot delete default agent '${agentId}'`);
    }
    
    this.agents.delete(agentId);
    
    if (this.activeAgent?.id === agentId) {
      this.setActiveAgent('security-analyst');
    }
    
    this.emit('agentDeleted', { agent: agentId });
  }

  private addToHistory(role: 'system' | 'user' | 'assistant', content: string): void {
    this.conversationHistory.push({
      role,
      content,
      timestamp: new Date().toISOString()
    });
    
    // Trim history if too long
    if (this.conversationHistory.length > this.maxHistoryLength) {
      this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength);
    }
  }

  clearHistory(): void {
    this.conversationHistory = [];
    this.emit('historyCleared');
  }

  getHistory(): ConversationMessage[] {
    return this.conversationHistory;
  }

  async chat(userMessage: string, options: Record<string, any> = {}): Promise<ChatResponse> {
    if (!this.activeAgent) {
      throw new Error('No active agent. Call setActiveAgent() first.');
    }
    
    // Check for agent commands
    const commandResult = this.processCommand(userMessage);
    if (commandResult) {
      return commandResult;
    }
    
    // Build messages array
    const messages: ChatMessage[] = [
      { role: 'system', content: this.activeAgent.systemPrompt }
    ];
    
    // Add conversation history
    for (const msg of this.conversationHistory) {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    }
    
    // Add current message
    messages.push({ role: 'user', content: userMessage });
    
    // Add to history
    this.addToHistory('user', userMessage);
    
    this.emit('chatStart', { agent: this.activeAgent.id, message: userMessage });
    
    try {
      // Get response from LLM
      const response = await llmProvider.chat(messages, {
        temperature: options.temperature || this.activeAgent.temperature,
        ...options
      });
      
      // Add response to history
      this.addToHistory('assistant', response);
      
      this.emit('chatComplete', { agent: this.activeAgent.id, response });
      
      return {
        agent: {
          id: this.activeAgent.id,
          name: this.activeAgent.name,
          icon: this.activeAgent.icon
        },
        response,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.emit('chatError', { agent: this.activeAgent.id, error });
      throw error;
    }
  }

  private processCommand(message: string): ChatResponse | null {
    const trimmed = message.trim();
    
    // Agent switching commands
    if (trimmed.startsWith('/agent ') || trimmed.startsWith('/switch ')) {
      const parts = trimmed.split(' ');
      const command = parts[1];
      
      if (command === 'list') {
        const agents = this.getAgents();
        return {
          agent: { id: 'system', name: 'System', icon: '⚙️' },
          response: `**Available Agents:**\n\n${agents.map(a => 
            `${a.icon} **${a.name}** (${a.id})${a.isActive ? ' ✓ Active' : ''}\n   ${a.description}`
          ).join('\n\n')}\n\nUse \`/agent switch <id>\` to change agents.`,
          timestamp: new Date().toISOString()
        };
      }
      
      if (command === 'switch' && parts[2]) {
        try {
          const result = this.setActiveAgent(parts[2]);
          return {
            agent: { id: 'system', name: 'System', icon: '⚙️' },
            response: `✅ Switched to **${result.name}** agent.`,
            timestamp: new Date().toISOString()
          };
        } catch (error) {
          return {
            agent: { id: 'system', name: 'System', icon: '⚙️' },
            response: `❌ ${(error as Error).message}`,
            timestamp: new Date().toISOString()
          };
        }
      }
      
      if (command === 'info') {
        const agent = this.activeAgent!;
        return {
          agent: { id: 'system', name: 'System', icon: '⚙️' },
          response: `**Current Agent: ${agent.icon} ${agent.name}**\n\n${agent.description}\n\n**Tools:** ${agent.tools.join(', ') || 'None'}\n**Temperature:** ${agent.temperature}`,
          timestamp: new Date().toISOString()
        };
      }
      
      if (command === 'create' && parts[2]) {
        const id = parts[2];
        const name = parts.slice(3).join(' ') || `Custom Agent ${id}`;
        try {
          this.createCustomAgent(id, { name });
          return {
            agent: { id: 'system', name: 'System', icon: '⚙️' },
            response: `✅ Created new agent **${name}** (${id}). Use \`/agent switch ${id}\` to activate.`,
            timestamp: new Date().toISOString()
          };
        } catch (error) {
          return {
            agent: { id: 'system', name: 'System', icon: '⚙️' },
            response: `❌ ${(error as Error).message}`,
            timestamp: new Date().toISOString()
          };
        }
      }
      
      if (command === 'set' && parts[2] && parts[3]) {
        const property = parts[2];
        const value = parts.slice(3).join(' ');
        
        try {
          const customization: AgentCustomization = {};
          if (property === 'name') customization.name = value;
          else if (property === 'role' || property === 'prompt') customization.systemPrompt = value;
          else if (property === 'temperature') customization.temperature = parseFloat(value);
          else if (property === 'icon') customization.icon = value;
          
          this.customizeAgent(this.activeAgent!.id, customization);
          
          return {
            agent: { id: 'system', name: 'System', icon: '⚙️' },
            response: `✅ Updated agent ${property} to: ${value}`,
            timestamp: new Date().toISOString()
          };
        } catch (error) {
          return {
            agent: { id: 'system', name: 'System', icon: '⚙️' },
            response: `❌ ${(error as Error).message}`,
            timestamp: new Date().toISOString()
          };
        }
      }
    }
    
    // Clear history command
    if (trimmed === '/clear' || trimmed === '/reset') {
      this.clearHistory();
      return {
        agent: { id: 'system', name: 'System', icon: '⚙️' },
        response: '✅ Conversation history cleared.',
        timestamp: new Date().toISOString()
      };
    }
    
    // Help command
    if (trimmed === '/help') {
      return {
        agent: { id: 'system', name: 'System', icon: '⚙️' },
        response: `**Available Commands:**

**Agent Commands:**
- \`/agent list\` - List all available agents
- \`/agent switch <id>\` - Switch to a different agent
- \`/agent info\` - Show current agent info
- \`/agent create <id> [name]\` - Create a custom agent
- \`/agent set <property> <value>\` - Customize current agent

**LLM Commands:**
- \`/llm list\` - List available LLM providers
- \`/llm switch <provider> [model]\` - Switch LLM provider
- \`/llm models\` - List models for current provider

**Other Commands:**
- \`/clear\` or \`/reset\` - Clear conversation history
- \`/help\` - Show this help message
- \`/tools\` - List available security tools
- \`/scan <target>\` - Quick security scan`,
        timestamp: new Date().toISOString()
      };
    }
    
    // LLM commands
    if (trimmed.startsWith('/llm ')) {
      const parts = trimmed.split(' ');
      const command = parts[1];
      
      if (command === 'list') {
        const providers = llmProvider.getProviders();
        return {
          agent: { id: 'system', name: 'System', icon: '⚙️' },
          response: `**Available LLM Providers:**\n\n${providers.map(p => 
            `${p.isLocal ? '🏠' : '☁️'} **${p.name}** (${p.id})${p.hasKey || p.isLocal ? ' ✓ Ready' : ' ⚠️ Needs API Key'}\n   Models: ${p.models.slice(0, 3).join(', ')}${p.models.length > 3 ? '...' : ''}`
          ).join('\n\n')}\n\nUse \`/llm switch <provider> [model]\` to change.`,
          timestamp: new Date().toISOString()
        };
      }
      
      if (command === 'switch' && parts[2]) {
        try {
          const result = llmProvider.setActiveProvider(parts[2], parts[3]);
          return {
            agent: { id: 'system', name: 'System', icon: '⚙️' },
            response: `✅ Switched to **${result.provider}** with model **${result.model}**.`,
            timestamp: new Date().toISOString()
          };
        } catch (error) {
          return {
            agent: { id: 'system', name: 'System', icon: '⚙️' },
            response: `❌ ${(error as Error).message}`,
            timestamp: new Date().toISOString()
          };
        }
      }
      
      if (command === 'models') {
        const provider = llmProvider.activeProvider;
        if (!provider) {
          return {
            agent: { id: 'system', name: 'System', icon: '⚙️' },
            response: '❌ No active provider. Use `/llm switch <provider>` first.',
            timestamp: new Date().toISOString()
          };
        }
        return {
          agent: { id: 'system', name: 'System', icon: '⚙️' },
          response: `**Models for ${provider.name}:**\n\n${provider.models.map(m => `- ${m}`).join('\n')}`,
          timestamp: new Date().toISOString()
        };
      }
      
      if (command === 'key' && parts[2] && parts[3]) {
        llmProvider.setApiKey(parts[2], parts[3]);
        return {
          agent: { id: 'system', name: 'System', icon: '⚙️' },
          response: `✅ API key set for **${parts[2]}**.`,
          timestamp: new Date().toISOString()
        };
      }
    }
    
    return null; // Not a command, process as regular chat
  }
}

// Singleton instance
export const agentManager = new AgentManager();
