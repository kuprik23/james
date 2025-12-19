/**
 * MCP Registry & Manager
 * Centralized management for all MCP servers
 * 
 * Copyright © 2025 Emersa Ltd. All Rights Reserved.
 */

import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';
import { existsSync } from 'fs';

export interface ServerConfig {
    name: string;
    slug: string;
    path: string;
    category: 'infrastructure' | 'agent' | 'tool';
    enabled: boolean;
    autoRestart: boolean;
    maxRestarts: number;
    restartDelay: number;
    port?: number;
    env?: Record<string, string>;
}

export interface ServerHealth {
    status: 'online' | 'offline' | 'error' | 'starting' | 'stopping';
    uptime: number;
    restartCount: number;
    lastError?: string;
    lastRestart?: Date;
    memoryUsage?: number;
    cpuUsage?: number;
}

export interface MCPServer {
    config: ServerConfig;
    health: ServerHealth;
    process?: ChildProcess;
    startTime?: Date;
}

export class MCPRegistry extends EventEmitter {
    private servers: Map<string, MCPServer> = new Map();
    private healthCheckInterval: NodeJS.Timeout | null = null;
    private readonly baseDir: string;

    constructor(baseDir: string) {
        super();
        this.baseDir = baseDir;
        this.loadDefaultServers();
    }

    /**
     * Load default server configurations
     */
    private loadDefaultServers(): void {
        const defaultServers: ServerConfig[] = [
            // Infrastructure Servers
            {
                name: 'Digital Ocean MCP',
                slug: 'digitalocean-mcp',
                path: join(this.baseDir, '../../../digitalocean-mcp'),
                category: 'infrastructure',
                enabled: true,
                autoRestart: true,
                maxRestarts: 5,
                restartDelay: 5000,
            },
            {
                name: 'Stripe MCP',
                slug: 'stripe-mcp',
                path: join(this.baseDir, '../../stripe-mcp'),
                category: 'infrastructure',
                enabled: true,
                autoRestart: true,
                maxRestarts: 5,
                restartDelay: 5000,
            },
            // Agent Servers
            {
                name: 'Security Analyst',
                slug: 'security-analyst-mcp',
                path: join(this.baseDir, '../../agents-mcp/security-analyst-mcp'),
                category: 'agent',
                enabled: true,
                autoRestart: true,
                maxRestarts: 3,
                restartDelay: 3000,
            },
            {
                name: 'Penetration Tester',
                slug: 'penetration-tester-mcp',
                path: join(this.baseDir, '../../agents-mcp/penetration-tester-mcp'),
                category: 'agent',
                enabled: false,
                autoRestart: true,
                maxRestarts: 3,
                restartDelay: 3000,
            },
            {
                name: 'Data Analyst',
                slug: 'data-analyst-mcp',
                path: join(this.baseDir, '../../agents-mcp/data-analyst-mcp'),
                category: 'agent',
                enabled: false,
                autoRestart: true,
                maxRestarts: 3,
                restartDelay: 3000,
            },
            {
                name: 'Network Specialist',
                slug: 'network-specialist-mcp',
                path: join(this.baseDir, '../../agents-mcp/network-specialist-mcp'),
                category: 'agent',
                enabled: false,
                autoRestart: true,
                maxRestarts: 3,
                restartDelay: 3000,
            },
            {
                name: 'System Administrator',
                slug: 'sysadmin-mcp',
                path: join(this.baseDir, '../../agents-mcp/sysadmin-mcp'),
                category: 'agent',
                enabled: false,
                autoRestart: true,
                maxRestarts: 3,
                restartDelay: 3000,
            },
            {
                name: 'Crypto Expert',
                slug: 'crypto-expert-mcp',
                path: join(this.baseDir, '../../agents-mcp/crypto-expert-mcp'),
                category: 'agent',
                enabled: false,
                autoRestart: true,
                maxRestarts: 3,
                restartDelay: 3000,
            },
            {
                name: 'Incident Responder',
                slug: 'incident-responder-mcp',
                path: join(this.baseDir, '../../agents-mcp/incident-responder-mcp'),
                category: 'agent',
                enabled: false,
                autoRestart: true,
                maxRestarts: 3,
                restartDelay: 3000,
            },
            {
                name: 'Compliance Officer',
                slug: 'compliance-officer-mcp',
                path: join(this.baseDir, '../../agents-mcp/compliance-officer-mcp'),
                category: 'agent',
                enabled: false,
                autoRestart: true,
                maxRestarts: 3,
                restartDelay: 3000,
            },
            // Tool Servers
            {
                name: 'Port Scanner',
                slug: 'port-scanner-mcp',
                path: join(this.baseDir, '../../security-tools-mcp/port-scanner-mcp'),
                category: 'tool',
                enabled: false,
                autoRestart: true,
                maxRestarts: 3,
                restartDelay: 2000,
            },
            {
                name: 'Vulnerability Scanner',
                slug: 'vulnerability-scanner-mcp',
                path: join(this.baseDir, '../../security-tools-mcp/vulnerability-scanner-mcp'),
                category: 'tool',
                enabled: false,
                autoRestart: true,
                maxRestarts: 3,
                restartDelay: 2000,
            },
        ];

        // Register all default servers
        for (const config of defaultServers) {
            this.registerServer(config);
        }
    }

    /**
     * Register a new MCP server
     */
    registerServer(config: ServerConfig): void {
        const health: ServerHealth = {
            status: 'offline',
            uptime: 0,
            restartCount: 0,
        };

        this.servers.set(config.slug, {
            config,
            health,
        });

        console.log(`[MCP Registry] Registered server: ${config.name} (${config.slug})`);
        this.emit('server-registered', config);
    }

    /**
     * Unregister an MCP server
     */
    async unregisterServer(slug: string): Promise<void> {
        const server = this.servers.get(slug);
        if (!server) {
            throw new Error(`Server not found: ${slug}`);
        }

        // Stop server if running
        if (server.process) {
            await this.stopServer(slug);
        }

        this.servers.delete(slug);
        console.log(`[MCP Registry] Unregistered server: ${slug}`);
        this.emit('server-unregistered', slug);
    }

    /**
     * Start an MCP server
     */
    async startServer(slug: string): Promise<void> {
        const server = this.servers.get(slug);
        if (!server) {
            throw new Error(`Server not found: ${slug}`);
        }

        if (server.process) {
            throw new Error(`Server already running: ${slug}`);
        }

        // Check if server directory exists
        if (!existsSync(server.config.path)) {
            throw new Error(`Server path not found: ${server.config.path}`);
        }

        server.health.status = 'starting';
        this.emit('server-starting', slug);

        try {
            // Spawn server process
            const indexPath = join(server.config.path, 'index.js');
            const proc = spawn('node', [indexPath], {
                cwd: server.config.path,
                env: { ...process.env, ...server.config.env },
                stdio: ['pipe', 'pipe', 'pipe'],
            });

            server.process = proc;
            server.startTime = new Date();

            // Handle process events
            proc.stdout?.on('data', (data) => {
                console.log(`[${slug}] ${data.toString().trim()}`);
            });

            proc.stderr?.on('data', (data) => {
                console.error(`[${slug}] ${data.toString().trim()}`);
            });

            proc.on('error', (error) => {
                console.error(`[MCP Registry] Server error (${slug}):`, error);
                server.health.lastError = error.message;
                server.health.status = 'error';
                this.emit('server-error', { slug, error });

                if (server.config.autoRestart && server.health.restartCount < server.config.maxRestarts) {
                    setTimeout(() => this.restartServer(slug), server.config.restartDelay);
                }
            });

            proc.on('exit', (code, signal) => {
                console.log(`[MCP Registry] Server exited (${slug}): code=${code}, signal=${signal}`);
                server.process = undefined;
                server.health.status = 'offline';
                this.emit('server-stopped', slug);

                if (code !== 0 && server.config.autoRestart && server.health.restartCount < server.config.maxRestarts) {
                    setTimeout(() => this.restartServer(slug), server.config.restartDelay);
                }
            });

            // Wait a bit for server to start
            await new Promise(resolve => setTimeout(resolve, 2000));

            server.health.status = 'online';
            server.health.uptime = 0;
            console.log(`[MCP Registry] Server started: ${slug}`);
            this.emit('server-started', slug);

        } catch (error) {
            server.health.status = 'error';
            server.health.lastError = (error as Error).message;
            this.emit('server-error', { slug, error });
            throw error;
        }
    }

    /**
     * Stop an MCP server
     */
    async stopServer(slug: string): Promise<void> {
        const server = this.servers.get(slug);
        if (!server) {
            throw new Error(`Server not found: ${slug}`);
        }

        if (!server.process) {
            throw new Error(`Server not running: ${slug}`);
        }

        server.health.status = 'stopping';
        this.emit('server-stopping', slug);

        return new Promise((resolve, reject) => {
            const proc = server.process!;
            
            const timeout = setTimeout(() => {
                proc.kill('SIGKILL');
                reject(new Error(`Server stop timeout: ${slug}`));
            }, 10000);

            proc.on('exit', () => {
                clearTimeout(timeout);
                server.process = undefined;
                server.health.status = 'offline';
                console.log(`[MCP Registry] Server stopped: ${slug}`);
                this.emit('server-stopped', slug);
                resolve();
            });

            proc.kill('SIGTERM');
        });
    }

    /**
     * Restart an MCP server
     */
    async restartServer(slug: string): Promise<void> {
        const server = this.servers.get(slug);
        if (!server) {
            throw new Error(`Server not found: ${slug}`);
        }

        console.log(`[MCP Registry] Restarting server: ${slug}`);
        server.health.restartCount++;
        server.health.lastRestart = new Date();
        this.emit('server-restarting', slug);

        if (server.process) {
            await this.stopServer(slug);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        await this.startServer(slug);
    }

    /**
     * Get server information
     */
    getServer(slug: string): MCPServer | null {
        return this.servers.get(slug) || null;
    }

    /**
     * List all servers
     */
    listServers(): MCPServer[] {
        return Array.from(this.servers.values());
    }

    /**
     * Get server health status
     */
    getServerHealth(slug: string): ServerHealth | null {
        const server = this.servers.get(slug);
        return server ? server.health : null;
    }

    /**
     * Update server configuration
     */
    updateServerConfig(slug: string, updates: Partial<ServerConfig>): void {
        const server = this.servers.get(slug);
        if (!server) {
            throw new Error(`Server not found: ${slug}`);
        }

        Object.assign(server.config, updates);
        this.emit('server-config-updated', { slug, updates });
    }

    /**
     * Start health monitoring
     */
    startHealthMonitoring(interval: number = 30000): void {
        if (this.healthCheckInterval) {
            return;
        }

        this.healthCheckInterval = setInterval(() => {
            this.performHealthCheck();
        }, interval);

        console.log('[MCP Registry] Health monitoring started');
    }

    /**
     * Stop health monitoring
     */
    stopHealthMonitoring(): void {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
            console.log('[MCP Registry] Health monitoring stopped');
        }
    }

    /**
     * Perform health check on all servers
     */
    private performHealthCheck(): void {
        for (const [slug, server] of this.servers) {
            if (server.process && server.startTime) {
                const uptime = Date.now() - server.startTime.getTime();
                server.health.uptime = Math.floor(uptime / 1000);

                // Check if process is still alive
                try {
                    process.kill(server.process.pid!, 0);
                } catch (error) {
                    console.error(`[MCP Registry] Server health check failed: ${slug}`);
                    server.health.status = 'error';
                    server.health.lastError = 'Process not responding';
                    
                    if (server.config.autoRestart && server.health.restartCount < server.config.maxRestarts) {
                        this.restartServer(slug).catch(console.error);
                    }
                }
            }
        }
    }

    /**
     * Start all enabled servers
     */
    async startAll(): Promise<void> {
        console.log('[MCP Registry] Starting all enabled servers...');
        const servers = Array.from(this.servers.values())
            .filter(s => s.config.enabled);

        for (const server of servers) {
            try {
                await this.startServer(server.config.slug);
            } catch (error) {
                console.error(`[MCP Registry] Failed to start ${server.config.slug}:`, error);
            }
        }
    }

    /**
     * Stop all running servers
     */
    async stopAll(): Promise<void> {
        console.log('[MCP Registry] Stopping all servers...');
        const servers = Array.from(this.servers.values())
            .filter(s => s.process);

        for (const server of servers) {
            try {
                await this.stopServer(server.config.slug);
            } catch (error) {
                console.error(`[MCP Registry] Failed to stop ${server.config.slug}:`, error);
            }
        }
    }

    /**
     * Get statistics
     */
    getStatistics(): {
        total: number;
        online: number;
        offline: number;
        error: number;
        byCategory: Record<string, number>;
    } {
        const stats = {
            total: this.servers.size,
            online: 0,
            offline: 0,
            error: 0,
            byCategory: {
                infrastructure: 0,
                agent: 0,
                tool: 0,
            },
        };

        for (const server of this.servers.values()) {
            if (server.health.status === 'online') stats.online++;
            else if (server.health.status === 'error') stats.error++;
            else stats.offline++;

            stats.byCategory[server.config.category]++;
        }

        return stats;
    }
}

// Singleton instance
export const mcpRegistry = new MCPRegistry(__dirname);