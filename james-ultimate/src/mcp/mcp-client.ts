/**
 * MCP (Model Context Protocol) Client Integration
 * Enhanced multi-server MCP client with registry integration
 *
 * Copyright © 2025 Emersa Ltd. All Rights Reserved.
 */

import axios from 'axios';
import { EventEmitter } from 'events';
import { mcpRegistry } from './mcp-registry.js';

export interface MCPTool {
    name: string;
    description: string;
    inputSchema: Record<string, any>;
    serverSlug?: string;
}

export interface MCPResource {
    uri: string;
    name: string;
    description?: string;
    mimeType?: string;
}

export interface MCPServer {
    name: string;
    slug: string;
    url: string;
    connected: boolean;
    tools: MCPTool[];
    resources: MCPResource[];
    category: 'infrastructure' | 'agent' | 'tool';
}

export interface ToolExecutionOptions {
    timeout?: number;
    retries?: number;
    priority?: 'high' | 'normal' | 'low';
}

export class MCPClient extends EventEmitter {
    private servers: Map<string, MCPServer> = new Map();
    private connected: boolean = false;
    private requestQueue: Map<string, any[]> = new Map();
    private rateLimiters: Map<string, RateLimiter> = new Map();
    
    constructor() {
        super();
        this.initializeRegistryIntegration();
    }

    /**
     * Initialize integration with MCP Registry
     */
    private initializeRegistryIntegration(): void {
        // Listen to registry events
        mcpRegistry.on('server-started', (slug: string) => {
            console.log(`[MCP Client] Server started: ${slug}`);
            this.connectToRegisteredServer(slug).catch(console.error);
        });

        mcpRegistry.on('server-stopped', (slug: string) => {
            console.log(`[MCP Client] Server stopped: ${slug}`);
            this.disconnectServer(slug).catch(console.error);
        });

        mcpRegistry.on('server-error', ({ slug, error }: { slug: string; error: Error }) => {
            console.error(`[MCP Client] Server error (${slug}):`, error);
            this.emit('server-error', { slug, error });
        });
    }

    /**
     * Connect to a registered server
     */
    private async connectToRegisteredServer(slug: string): Promise<void> {
        const server = mcpRegistry.getServer(slug);
        if (!server || !server.config.enabled) {
            return;
        }

        try {
            // For stdio-based servers, we don't connect via HTTP
            // Instead, we mark them as available
            const mcpServer: MCPServer = {
                name: server.config.name,
                slug: server.config.slug,
                url: '', // Stdio servers don't have URLs
                connected: true,
                tools: [],
                resources: [],
                category: server.config.category,
            };

            this.servers.set(slug, mcpServer);
            this.rateLimiters.set(slug, new RateLimiter(100, 60000)); // 100 requests per minute
            
            console.log(`[MCP Client] Connected to ${slug}`);
            this.emit('server-connected', { slug, tools: 0, resources: 0 });
        } catch (error) {
            console.error(`[MCP Client] Failed to connect to ${slug}:`, error);
            throw error;
        }
    }
    
    /**
     * Connect to MCP server
     */
    async connectServer(name: string, url: string): Promise<void> {
        try {
            // Initialize connection
            await axios.post(`${url}/initialize`, {
                protocolVersion: '2024-11-05',
                capabilities: {
                    tools: {},
                    resources: {}
                },
                clientInfo: {
                    name: 'James Ultimate',
                    version: '2.0.0'
                }
            });
            
            const server: MCPServer = {
                name,
                slug: name, // Use name as slug for HTTP-based servers
                url,
                connected: true,
                tools: [],
                resources: [],
                category: 'infrastructure', // Default category for HTTP servers
            };
            
            // List available tools
            try {
                const toolsResponse = await axios.post(`${url}/tools/list`);
                server.tools = toolsResponse.data.tools || [];
            } catch (e) {
                console.warn(`[MCP] Failed to list tools from ${name}`);
            }
            
            // List available resources
            try {
                const resourcesResponse = await axios.post(`${url}/resources/list`);
                server.resources = resourcesResponse.data.resources || [];
            } catch (e) {
                console.warn(`[MCP] Failed to list resources from ${name}`);
            }
            
            this.servers.set(name, server);
            this.connected = true;
            
            console.log(`[MCP] Connected to ${name}: ${server.tools.length} tools, ${server.resources.length} resources`);
            this.emit('server-connected', { name, tools: server.tools.length, resources: server.resources.length });
            
        } catch (error) {
            console.error(`[MCP] Failed to connect to ${name}:`, error);
            throw error;
        }
    }
    
    /**
     * Connect to default MCP servers
     */
    async connectDefaultServers(): Promise<void> {
        const defaultServers = [
            { name: 'cybercat-mcp', url: 'http://localhost:3100' },
            { name: 'system-monitor-mcp', url: 'http://localhost:3101' },
            { name: 'digitalocean-mcp', url: 'http://localhost:3102' }
        ];
        
        for (const server of defaultServers) {
            try {
                await this.connectServer(server.name, server.url);
            } catch (error) {
                console.warn(`[MCP] Skipping ${server.name} - not available`);
            }
        }
    }
    
    /**
     * Call MCP tool
     */
    async callTool(serverName: string, toolName: string, args: Record<string, any>): Promise<any> {
        const server = this.servers.get(serverName);
        
        if (!server || !server.connected) {
            throw new Error(`Server ${serverName} not connected`);
        }
        
        try {
            const response = await axios.post(`${server.url}/tools/call`, {
                name: toolName,
                arguments: args
            });
            
            return response.data;
            
        } catch (error) {
            console.error(`[MCP] Tool call failed: ${serverName}/${toolName}`, error);
            throw error;
        }
    }
    
    /**
     * Read MCP resource
     */
    async readResource(serverName: string, uri: string): Promise<any> {
        const server = this.servers.get(serverName);
        
        if (!server || !server.connected) {
            throw new Error(`Server ${serverName} not connected`);
        }
        
        try {
            const response = await axios.post(`${server.url}/resources/read`, {
                uri
            });
            
            return response.data;
            
        } catch (error) {
            console.error(`[MCP] Resource read failed: ${uri}`, error);
            throw error;
        }
    }
    
    /**
     * Get all available tools across all servers
     */
    getAllTools(): Array<MCPTool & { server: string }> {
        const tools: Array<MCPTool & { server: string }> = [];
        
        for (const [serverName, server] of this.servers) {
            for (const tool of server.tools) {
                tools.push({ ...tool, server: serverName });
            }
        }
        
        return tools;
    }
    
    /**
     * Get all available resources
     */
    getAllResources(): Array<MCPResource & { server: string }> {
        const resources: Array<MCPResource & { server: string }> = [];
        
        for (const [serverName, server] of this.servers) {
            for (const resource of server.resources) {
                resources.push({ ...resource, server: serverName });
            }
        }
        
        return resources;
    }
    
    /**
     * Get connected servers
     */
    getServers(): MCPServer[] {
        return Array.from(this.servers.values());
    }
    
    /**
     * Check if connected to any server
     */
    isConnected(): boolean {
        return this.servers.size > 0 && this.connected;
    }
    
    /**
     * Disconnect from server
     */
    async disconnectServer(name: string): Promise<void> {
        const server = this.servers.get(name);
        
        if (server) {
            server.connected = false;
            this.servers.delete(name);
            console.log(`[MCP] Disconnected from ${name}`);
            this.emit('server-disconnected', { name });
        }
        
        if (this.servers.size === 0) {
            this.connected = false;
        }
    }
    
    /**
     * Disconnect all servers
     */
    async disconnectAll(): Promise<void> {
        for (const slug of this.servers.keys()) {
            await this.disconnectServer(slug);
        }
    }

    /**
     * Execute tool with enhanced features
     */
    async executeToolEnhanced(
        serverSlug: string,
        toolName: string,
        args: Record<string, any>,
        options: ToolExecutionOptions = {}
    ): Promise<any> {
        const { timeout = 30000, retries = 3, priority = 'normal' } = options;

        // Check rate limiting
        const rateLimiter = this.rateLimiters.get(serverSlug);
        if (rateLimiter && !rateLimiter.allowRequest()) {
            throw new Error(`Rate limit exceeded for server: ${serverSlug}`);
        }

        // Execute with retry logic
        let lastError: Error | null = null;
        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                const result = await this.callTool(serverSlug, toolName, args);
                return result;
            } catch (error) {
                lastError = error as Error;
                console.warn(`[MCP Client] Tool execution attempt ${attempt + 1} failed:`, error);
                
                if (attempt < retries - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
                }
            }
        }

        throw lastError || new Error('Tool execution failed');
    }

    /**
     * Find server that provides a specific tool
     */
    findServerForTool(toolName: string): string | null {
        for (const [slug, server] of this.servers) {
            if (server.tools.some(t => t.name === toolName)) {
                return slug;
            }
        }
        return null;
    }

    /**
     * Get all available tool names
     */
    getAllToolNames(): string[] {
        const tools = this.getAllTools();
        return tools.map(t => t.name);
    }

    /**
     * Get server statistics
     */
    getServerStatistics(): {
        totalServers: number;
        connectedServers: number;
        totalTools: number;
        toolsByCategory: Record<string, number>;
    } {
        const stats = {
            totalServers: this.servers.size,
            connectedServers: 0,
            totalTools: 0,
            toolsByCategory: {
                infrastructure: 0,
                agent: 0,
                tool: 0,
            },
        };

        for (const server of this.servers.values()) {
            if (server.connected) stats.connectedServers++;
            stats.totalTools += server.tools.length;
            stats.toolsByCategory[server.category] += server.tools.length;
        }

        return stats;
    }

    /**
     * Start all registered MCP servers
     */
    async startAllServers(): Promise<void> {
        await mcpRegistry.startAll();
        mcpRegistry.startHealthMonitoring();
    }

    /**
     * Stop all MCP servers
     */
    async stopAllServers(): Promise<void> {
        mcpRegistry.stopHealthMonitoring();
        await mcpRegistry.stopAll();
    }
}

/**
 * Rate Limiter for MCP requests
 */
class RateLimiter {
    private tokens: number;
    private readonly maxTokens: number;
    private readonly refillRate: number;
    private lastRefill: number;

    constructor(maxRequests: number, windowMs: number) {
        this.maxTokens = maxRequests;
        this.tokens = maxRequests;
        this.refillRate = maxRequests / windowMs;
        this.lastRefill = Date.now();
    }

    allowRequest(): boolean {
        this.refill();

        if (this.tokens >= 1) {
            this.tokens -= 1;
            return true;
        }

        return false;
    }

    private refill(): void {
        const now = Date.now();
        const timePassed = now - this.lastRefill;
        const tokensToAdd = timePassed * this.refillRate;

        this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
        this.lastRefill = now;
    }
}

// Singleton instance
export const mcpClient = new MCPClient();
