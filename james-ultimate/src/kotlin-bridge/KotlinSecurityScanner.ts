/**
 * Kotlin Security Scanner Bridge
 * 
 * Provides TypeScript/Node.js interface to Kotlin security scanner.
 * Uses child_process to communicate with Kotlin JAR.
 * 
 * Copyright © 2025 Emersa Ltd. All Rights Reserved.
 */

import * as path from 'path';
import { spawn, exec } from 'child_process';
import { EventEmitter } from 'events';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface KotlinPortScanResult {
    host: string;
    port: number;
    isOpen: boolean;
    service: string | null;
    risk: string;
    responseTime: number;
}

export interface KotlinHashResult {
    filePath: string;
    md5: string;
    sha1: string;
    sha256: string;
    sizeBytes: number;
    calculationTime: number;
    timestamp: string;
}

export interface KotlinApiSecurityResult {
    url: string;
    method: string;
    statusCode: number;
    headers: Record<string, string>;
    vulnerabilities: string[];
    riskScore: number;
    recommendations: string[];
}

export class KotlinSecurityScanner extends EventEmitter {
    private jarPath: string;
    private initialized: boolean = false;
    
    constructor() {
        super();
        this.jarPath = path.join(__dirname, '../../kotlin-scanner/build/libs/kotlin-scanner-2.0.0.jar');
    }
    
    /**
     * Initialize Kotlin scanner (check if JAR exists)
     */
    async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }
        
        try {
            const fs = require('fs');
            if (!fs.existsSync(this.jarPath)) {
                throw new Error(`Kotlin scanner JAR not found at ${this.jarPath}. Run 'npm run build:kotlin'`);
            }
            
            // Test if Java is available
            await execAsync('java -version');
            
            this.initialized = true;
            this.emit('initialized');
            console.log('[KotlinBridge] Security scanner initialized successfully');
            
        } catch (error) {
            console.error('[KotlinBridge] Failed to initialize:', error);
            throw new Error(`Kotlin scanner initialization failed: ${error}`);
        }
    }
    
    /**
     * Ensure scanner is initialized
     */
    private async ensureInitialized(): Promise<void> {
        if (!this.initialized) {
            await this.initialize();
        }
    }
    
    /**
     * Execute Kotlin scanner command
     */
    private async executeCommand(args: string[]): Promise<string> {
        await this.ensureInitialized();
        
        return new Promise((resolve, reject) => {
            const java = spawn('java', ['-jar', this.jarPath, ...args]);
            
            let stdout = '';
            let stderr = '';
            
            java.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            
            java.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            
            java.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`Kotlin scanner exited with code ${code}: ${stderr}`));
                } else {
                    resolve(stdout.trim());
                }
            });
            
            java.on('error', (error) => {
                reject(error);
            });
        });
    }
    
    /**
     * Execute via JSON API
     */
    private async execute(command: string, params: Record<string, string>): Promise<any> {
        await this.ensureInitialized();
        
        return new Promise((resolve, reject) => {
            // For JSON API, we'll need to add a JSON mode to the Kotlin scanner
            // For now, use command-line mode
            const args = [command];
            Object.entries(params).forEach(([key, value]) => {
                args.push(value);
            });
            
            this.executeCommand(args)
                .then(output => {
                    try {
                        // Try to parse as JSON
                        const result = JSON.parse(output);
                        resolve(result);
                    } catch (e) {
                        // If not JSON, return as is
                        resolve({ output });
                    }
                })
                .catch(reject);
        });
    }
    
    /**
     * Port scan - scan range of ports
     */
    async portScan(host: string, startPort: number, endPort: number): Promise<any> {
        console.log(`[KotlinBridge] Port scanning ${host}:${startPort}-${endPort}`);
        
        try {
            const output = await this.executeCommand(['scan', host, String(startPort), String(endPort)]);
            // Parse the output and format it
            return {
                host,
                startPort,
                endPort,
                output,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            throw new Error(`Port scan failed: ${error}`);
        }
    }
    
    /**
     * Fast port scan - scan common ports only
     */
    async portScanFast(host: string): Promise<any> {
        console.log(`[KotlinBridge] Fast port scanning ${host}`);
        
        return this.portScan(host, 1, 1024);
    }
    
    /**
     * Calculate file hash
     */
    async hashFile(filePath: string): Promise<KotlinHashResult> {
        console.log(`[KotlinBridge] Calculating hash for ${filePath}`);
        
        try {
            const output = await this.executeCommand(['hash', filePath]);
            const result = JSON.parse(output);
            return result as KotlinHashResult;
        } catch (error) {
            throw new Error(`Hash calculation failed: ${error}`);
        }
    }
    
    /**
     * Scan API security
     */
    async scanApiSecurity(url: string, method: string = 'GET'): Promise<KotlinApiSecurityResult> {
        console.log(`[KotlinBridge] Scanning API ${url}`);
        
        try {
            const output = await this.executeCommand(['api', url, method]);
            const result = JSON.parse(output);
            return result as KotlinApiSecurityResult;
        } catch (error) {
            throw new Error(`API scan failed: ${error}`);
        }
    }
    
    /**
     * Get scanner information
     */
    async getInfo(): Promise<any> {
        await this.ensureInitialized();
        
        try {
            const output = await this.executeCommand(['info']);
            return JSON.parse(output);
        } catch (error) {
            throw new Error(`Failed to get info: ${error}`);
        }
    }
    
    /**
     * Check if Kotlin scanner is available
     */
    static isAvailable(): boolean {
        try {
            const fs = require('fs');
            const jarPath = path.join(__dirname, '../../kotlin-scanner/build/libs/kotlin-scanner-2.0.0.jar');
            return fs.existsSync(jarPath);
        } catch {
            return false;
        }
    }
    
    /**
     * Shutdown and cleanup
     */
    async shutdown(): Promise<void> {
        if (this.initialized) {
            this.initialized = false;
            this.emit('shutdown');
            console.log('[KotlinBridge] Scanner shutdown');
        }
    }
}

// Singleton instance
let scannerInstance: KotlinSecurityScanner | null = null;

/**
 * Get or create scanner instance
 */
export function getKotlinScanner(): KotlinSecurityScanner {
    if (!scannerInstance) {
        scannerInstance = new KotlinSecurityScanner();
    }
    return scannerInstance;
}

/**
 * Check if Kotlin scanning is available
 */
export function isKotlinAvailable(): boolean {
    return KotlinSecurityScanner.isAvailable();
}

export default KotlinSecurityScanner;
