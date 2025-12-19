/**
 * MCP (Model Context Protocol) Client Integration
 * Connects Paul AI to MCP servers for enhanced tool access
 * 
 * Copyright © 2025 Emersa Ltd. All Rights Reserved.
 */

import axios from 'axios';
import { EventEmitter } from 'events';

export interface MCPTool {
    name: string;
    description: string;
    inputSchema: Record<string, any>;
}

export interface MCPResource {
    uri: string;
    name: string;
    description?: string;
    mimeType?: string;
}

export interface MCPServer {
    name: string;
    url: string;
    connected: boolean;
    tools: MCPTool[];
    resources: MCPResource[];
}

export class MCPClient extends EventEmitter {
    private servers: Map<string, MCPServer> = new Map();
    private connected: boolean = false;
    
    constructor() {
        super();
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
                url,
                connected: true,
                tools: [],
                resources: []
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
        for (const name of this.servers.keys()) {
            await this.disconnectServer(name);
        }
    }
}

// Singleton instance
export const mcpClient = new MCPClient();
