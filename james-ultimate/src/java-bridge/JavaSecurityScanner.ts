/**
 * Java Security Scanner Bridge
 * 
 * Provides TypeScript/Node.js interface to high-performance Java security scanners.
 * Uses the 'java' npm package for JVM integration.
 * 
 * Copyright © 2025 Emersa Ltd. All Rights Reserved.
 */

import * as path from 'path';
import { EventEmitter } from 'events';

// Java bridge
let java: any;
try {
    java = require('java');
} catch (e) {
    console.warn('[JavaBridge] Java module not available. Install with: npm install java');
}

export interface PortScanResult {
    host: string;
    startPort: number;
    endPort: number;
    openPorts: Array<{
        port: number;
        service: string;
        risk: string;
    }>;
    durationMs: number;
    timestamp: string;
}

export interface FileHashResult {
    filePath: string;
    sizeBytes: number;
    md5: string;
    sha1: string;
    sha256: string;
    sha512: string;
    isMalware: boolean;
    calculationTimeMs: number;
    timestamp: string;
}

export interface VulnerabilityScanResult {
    filePath: string;
    vulnerabilityCount: number;
    vulnerabilities: Array<{
        type: string;
        severity: string;
        description: string;
        lineNumber: number;
        code: string;
    }>;
    riskScore: number;
    scanTimeMs: number;
    timestamp: string;
}

export class JavaSecurityScanner extends EventEmitter {
    private scanner: any = null;
    private initialized: boolean = false;
    private jarPath: string;
    
    constructor() {
        super();
        this.jarPath = path.join(__dirname, '../../java-scanner/target/security-scanner.jar');
    }
    
    /**
     * Initialize Java bridge and load scanner
     */
    async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }
        
        if (!java) {
            throw new Error('Java module not available. Install with: npm install java');
        }
        
        try {
            // Add JAR to classpath
            java.classpath.push(this.jarPath);
            
            // Configure JVM options for performance
            java.options.push('-Xmx2g'); // Max heap 2GB
            java.options.push('-Xms512m'); // Initial heap 512MB
            java.options.push('-XX:+UseG1GC'); // Use G1 garbage collector
            
            // Import Java class
            const SecurityScannerClass = java.import('com.emersa.james.scanner.SecurityScanner');
            
            // Create instance
            this.scanner = new SecurityScannerClass();
            
            this.initialized = true;
            this.emit('initialized');
            
            console.log('[JavaBridge] Security scanner initialized successfully');
            
        } catch (error) {
            console.error('[JavaBridge] Failed to initialize:', error);
            throw new Error(`Java scanner initialization failed: ${error}`);
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
     * Execute Java scanner command
     */
    private async execute(command: string, params: Record<string, string>): Promise<any> {
        await this.ensureInitialized();
        
        return new Promise((resolve, reject) => {
            try {
                // Convert params to Java HashMap
                const HashMap = java.import('java.util.HashMap');
                const paramsMap = new HashMap();
                
                for (const [key, value] of Object.entries(params)) {
                    paramsMap.putSync(key, String(value));
                }
                
                // Execute command
                this.scanner.execute(command, paramsMap, (err: Error, result: string) => {
                    if (err) {
                        reject(err);
                    } else {
                        try {
                            resolve(JSON.parse(result));
                        } catch (parseError) {
                            reject(new Error(`Failed to parse result: ${parseError}`));
                        }
                    }
                });
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    /**
     * Port scan - scan range of ports
     */
    async portScan(host: string, startPort: number, endPort: number): Promise<PortScanResult> {
        console.log(`[JavaBridge] Port scanning ${host}:${startPort}-${endPort}`);
        
        const result = await this.execute('port_scan', {
            host,
            startPort: String(startPort),
            endPort: String(endPort)
        });
        
        return result as PortScanResult;
    }
    
    /**
     * Fast port scan - scan common ports only
     */
    async portScanFast(host: string): Promise<PortScanResult> {
        console.log(`[JavaBridge] Fast port scanning ${host}`);
        
        const result = await this.execute('port_scan_fast', {
            host
        });
        
        return result as PortScanResult;
    }
    
    /**
     * Calculate file hashes
     */
    async hashFile(filePath: string): Promise<FileHashResult> {
        console.log(`[JavaBridge] Calculating hash for ${filePath}`);
        
        const result = await this.execute('hash_file', {
            filePath
        });
        
        return result as FileHashResult;
    }
    
    /**
     * Calculate hashes for directory
     */
    async hashDirectory(directory: string, recursive: boolean = true, maxDepth: number = 10): Promise<any> {
        console.log(`[JavaBridge] Hashing directory ${directory}`);
        
        const result = await this.execute('hash_directory', {
            directory,
            recursive: String(recursive),
            maxDepth: String(maxDepth)
        });
        
        return result;
    }
    
    /**
     * Scan file for vulnerabilities
     */
    async vulnScanFile(filePath: string): Promise<VulnerabilityScanResult> {
        console.log(`[JavaBridge] Vulnerability scanning ${filePath}`);
        
        const result = await this.execute('vuln_scan_file', {
            filePath
        });
        
        return result as VulnerabilityScanResult;
    }
    
    /**
     * Scan directory for vulnerabilities
     */
    async vulnScanDirectory(directory: string, recursive: boolean = true): Promise<any> {
        console.log(`[JavaBridge] Vulnerability scanning directory ${directory}`);
        
        const result = await this.execute('vuln_scan_directory', {
            directory,
            recursive: String(recursive)
        });
        
        return result;
    }
    
    /**
     * Comprehensive security scan
     */
    async fullScan(target: string): Promise<any> {
        console.log(`[JavaBridge] Full scan of ${target}`);
        
        const result = await this.execute('full_scan', {
            target
        });
        
        return result;
    }
    
    /**
     * Get scanner information
     */
    async getInfo(): Promise<any> {
        await this.ensureInitialized();
        
        return new Promise((resolve, reject) => {
            try {
                this.scanner.getInfo((err: Error, result: string) => {
                    if (err) {
                        reject(err);
                    } else {
                        try {
                            resolve(JSON.parse(result));
                        } catch (parseError) {
                            reject(new Error(`Failed to parse info: ${parseError}`));
                        }
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }
    
    /**
     * Check if Java scanner is available
     */
    static isAvailable(): boolean {
        return java !== null && java !== undefined;
    }
    
    /**
     * Shutdown and cleanup
     */
    async shutdown(): Promise<void> {
        if (this.initialized) {
            // Java objects are garbage collected
            this.scanner = null;
            this.initialized = false;
            this.emit('shutdown');
            console.log('[JavaBridge] Scanner shutdown');
        }
    }
}

// Singleton instance
let scannerInstance: JavaSecurityScanner | null = null;

/**
 * Get or create scanner instance
 */
export function getJavaScanner(): JavaSecurityScanner {
    if (!scannerInstance) {
        scannerInstance = new JavaSecurityScanner();
    }
    return scannerInstance;
}

/**
 * Check if Java scanning is available
 */
export function isJavaAvailable(): boolean {
    return JavaSecurityScanner.isAvailable();
}

export default JavaSecurityScanner;