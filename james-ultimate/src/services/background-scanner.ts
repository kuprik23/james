/**
 * Background Scanner Service
 * Continuously monitors system security in the background
 * 
 * Copyright © 2025 Emersa Ltd. All Rights Reserved.
 */

import { EventEmitter } from 'events';
import { securityTools } from '../tools/security-tools';
import { getJavaScanner, isJavaAvailable } from '../java-bridge/JavaSecurityScanner';

export interface ScanTask {
    id: string;
    type: 'port_scan' | 'hash_scan' | 'vuln_scan' | 'system_analysis' | 'full_scan';
    target: string;
    schedule: 'continuous' | 'hourly' | 'daily' | 'weekly' | number; // number = interval in ms
    lastRun: Date | null;
    nextRun: Date | null;
    status: 'idle' | 'running' | 'completed' | 'failed';
    results: any;
}

export interface ScannerStats {
    totalScans: number;
    threatsFound: number;
    lastScan: Date | null;
    uptime: number;
    activeTasks: number;
    queuedTasks: number;
}

export class BackgroundScanner extends EventEmitter {
    private tasks: Map<string, ScanTask> = new Map();
    private intervals: Map<string, NodeJS.Timeout> = new Map();
    private running: boolean = false;
    private stats: ScannerStats = {
        totalScans: 0,
        threatsFound: 0,
        lastScan: null,
        uptime: 0,
        activeTasks: 0,
        queuedTasks: 0
    };
    private startTime: Date | null = null;
    private javaScanner: any;
    private useJava: boolean = false;
    
    constructor() {
        super();
        this.javaScanner = getJavaScanner();
    }
    
    /**
     * Initialize scanner service
     */
    async initialize(): Promise<void> {
        if (isJavaAvailable()) {
            try {
                await this.javaScanner.initialize();
                this.useJava = true;
                console.log('[BackgroundScanner] ⚡ Java acceleration enabled');
            } catch (error) {
                console.warn('[BackgroundScanner] Java not available, using JS fallback');
            }
        }
        
        // Initialize security tools
        await securityTools.initialize();
        
        console.log('[BackgroundScanner] Initialized successfully');
    }
    
    /**
     * Start background scanning
     */
    async start(): Promise<void> {
        if (this.running) {
            console.warn('[BackgroundScanner] Already running');
            return;
        }
        
        await this.initialize();
        
        this.running = true;
        this.startTime = new Date();
        
        // Add default monitoring tasks
        this.addDefaultTasks();
        
        // Start all scheduled tasks
        for (const [id, task] of this.tasks) {
            this.scheduleTask(id, task);
        }
        
        console.log('[BackgroundScanner] Started with', this.tasks.size, 'tasks');
        this.emit('started', { tasks: this.tasks.size });
    }
    
    /**
     * Stop background scanning
     */
    stop(): void {
        this.running = false;
        
        // Clear all intervals
        for (const interval of this.intervals.values()) {
            clearInterval(interval);
        }
        this.intervals.clear();
        
        console.log('[BackgroundScanner] Stopped');
        this.emit('stopped');
    }
    
    /**
     * Add default monitoring tasks
     */
    private addDefaultTasks(): void {
        // System analysis every 5 minutes
        this.addTask({
            id: 'system-monitor',
            type: 'system_analysis',
            target: 'localhost',
            schedule: 5 * 60 * 1000, // 5 minutes
            lastRun: null,
            nextRun: null,
            status: 'idle',
            results: null
        });
        
        // Port scan every hour
        this.addTask({
            id: 'port-monitor',
            type: 'port_scan',
            target: 'localhost',
            schedule: 'hourly',
            lastRun: null,
            nextRun: null,
            status: 'idle',
            results: null
        });
        
        // Vulnerability scan daily
        this.addTask({
            id: 'vuln-monitor',
            type: 'vuln_scan',
            target: process.cwd(),
            schedule: 'daily',
            lastRun: null,
            nextRun: null,
            status: 'idle',
            results: null
        });
    }
    
    /**
     * Add scanning task
     */
    addTask(task: ScanTask): void {
        this.tasks.set(task.id, task);
        this.stats.queuedTasks = this.tasks.size;
        
        if (this.running) {
            this.scheduleTask(task.id, task);
        }
        
        this.emit('task-added', task);
    }
    
    /**
     * Schedule task execution
     */
    private scheduleTask(id: string, task: ScanTask): void {
        const interval = this.getInterval(task.schedule);
        
        // Run immediately on first schedule
        this.executeTask(id);
        
        // Set up recurring execution
        const timer = setInterval(() => {
            this.executeTask(id);
        }, interval);
        
        this.intervals.set(id, timer);
    }
    
    /**
     * Execute scanning task
     */
    private async executeTask(id: string): Promise<void> {
        const task = this.tasks.get(id);
        if (!task || task.status === 'running') return;
        
        task.status = 'running';
        task.lastRun = new Date();
        this.stats.activeTasks++;
        
        this.emit('scan-started', { taskId: id, type: task.type });
        
        try {
            let result: any;
            
            switch (task.type) {
                case 'port_scan':
                    result = await this.runPortScan(task.target);
                    break;
                case 'hash_scan':
                    result = await this.runHashScan(task.target);
                    break;
                case 'vuln_scan':
                    result = await this.runVulnScan(task.target);
                    break;
                case 'system_analysis':
                    result = await this.runSystemAnalysis();
                    break;
                case 'full_scan':
                    result = await this.runFullScan(task.target);
                    break;
            }
            
            task.results = result;
            task.status = 'completed';
            task.nextRun = new Date(Date.now() + this.getInterval(task.schedule));
            
            this.stats.totalScans++;
            this.stats.lastScan = new Date();
            
            // Check for threats
            const threats = this.extractThreats(result);
            if (threats > 0) {
                this.stats.threatsFound += threats;
                this.emit('threats-found', { taskId: id, count: threats, result });
            }
            
            this.emit('scan-completed', { taskId: id, result });
            
        } catch (error) {
            task.status = 'failed';
            this.emit('scan-failed', { taskId: id, error: (error as Error).message });
        } finally {
            this.stats.activeTasks--;
        }
    }
    
    /**
     * Run port scan
     */
    private async runPortScan(host: string): Promise<any> {
        if (this.useJava) {
            return await this.javaScanner.portScanFast(host);
        }
        return await securityTools.executeTool('port_scan', { host, ports: '1-1024' });
    }
    
    /**
     * Run hash scan
     */
    private async runHashScan(target: string): Promise<any> {
        if (this.useJava) {
            return await this.javaScanner.hashDirectory(target, true, 5);
        }
        return { message: 'Hash scanning requires Java acceleration' };
    }
    
    /**
     * Run vulnerability scan
     */
    private async runVulnScan(target: string): Promise<any> {
        if (this.useJava) {
            return await this.javaScanner.vulnScanDirectory(target, true);
        }
        return await securityTools.executeTool('vulnerability_scan', { directory: target, recursive: true });
    }
    
    /**
     * Run system analysis
     */
    private async runSystemAnalysis(): Promise<any> {
        return await securityTools.executeTool('system_analysis', {});
    }
    
    /**
     * Run full comprehensive scan
     */
    private async runFullScan(target: string): Promise<any> {
        if (this.useJava) {
            return await this.javaScanner.fullScan(target);
        }
        return await securityTools.executeTool('security_report', {});
    }
    
    /**
     * Extract threat count from results
     */
    private extractThreats(result: any): number {
        if (!result) return 0;
        
        let count = 0;
        
        // Check various result formats
        if (result.threatsFound) count += result.threatsFound;
        if (result.vulnerabilityCount) count += result.vulnerabilityCount;
        if (result.openPorts?.length) {
            count += result.openPorts.filter((p: any) => p.risk === 'high').length;
        }
        if (result.issues?.length) count += result.issues.length;
        
        return count;
    }
    
    /**
     * Get interval in milliseconds
     */
    private getInterval(schedule: ScanTask['schedule']): number {
        if (typeof schedule === 'number') return schedule;
        
        switch (schedule) {
            case 'continuous': return 60 * 1000; // 1 minute
            case 'hourly': return 60 * 60 * 1000; // 1 hour
            case 'daily': return 24 * 60 * 60 * 1000; // 24 hours
            case 'weekly': return 7 * 24 * 60 * 60 * 1000; // 7 days
            default: return 60 * 1000;
        }
    }
    
    /**
     * Get all tasks
     */
    getTasks(): ScanTask[] {
        return Array.from(this.tasks.values());
    }
    
    /**
     * Get scanner statistics
     */
    getStats(): ScannerStats {
        if (this.startTime) {
            this.stats.uptime = Date.now() - this.startTime.getTime();
        }
        return { ...this.stats };
    }
    
    /**
     * Remove task
     */
    removeTask(id: string): boolean {
        const interval = this.intervals.get(id);
        if (interval) {
            clearInterval(interval);
            this.intervals.delete(id);
        }
        
        const removed = this.tasks.delete(id);
        if (removed) {
            this.stats.queuedTasks = this.tasks.size;
            this.emit('task-removed', { taskId: id });
        }
        
        return removed;
    }
    
    /**
     * Run immediate scan
     */
    async runImmediateScan(type: ScanTask['type'], target: string): Promise<any> {
        const tempTask: ScanTask = {
            id: `immediate-${Date.now()}`,
            type,
            target,
            schedule: 'continuous',
            lastRun: null,
            nextRun: null,
            status: 'idle',
            results: null
        };
        
        this.tasks.set(tempTask.id, tempTask);
        await this.executeTask(tempTask.id);
        
        const result = this.tasks.get(tempTask.id)?.results;
        this.tasks.delete(tempTask.id);
        
        return result;
    }
}

// Singleton instance
export const backgroundScanner = new BackgroundScanner();