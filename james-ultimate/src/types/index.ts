/**
 * Common Type Definitions for James Ultimate
 * Copyright © 2025 Emersa Ltd. All Rights Reserved.
 */

// ===== Security Types =====

export interface EncryptedData {
    encrypted: string;
    iv: string;
    salt: string;
    authTag: string;
}

export interface SecurityEvent {
    timestamp: string;
    type: string;
    message: string;
    metadata: Record<string, any>;
    pid: number;
}

export interface ValidationResult {
    isValid: boolean;
    sanitized: string;
    original: string;
    type: string;
}

// ===== Agent Types =====

export interface Agent {
    id: string;
    name: string;
    description: string;
    icon: string;
    systemPrompt: string;
    tools: string[];
    temperature: number;
    customizable?: boolean;
    customConfig?: Record<string, any>;
    isActive?: boolean;
}

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
    timestamp?: string;
}

export interface ChatResponse {
    agent: {
        id: string;
        name: string;
        icon: string;
    };
    response: string;
    timestamp: string;
}

// ===== LLM Provider Types =====

export interface LLMProvider {
    id: string;
    name: string;
    models: string[];
    endpoint?: string;
    requiresKey: boolean;
    keyEnvVar?: string;
    apiKey?: string | null;
    hasKey?: boolean;
    isLocal?: boolean;
    chat: (messages: ChatMessage[], options?: ChatOptions) => Promise<string>;
}

export interface ChatOptions {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
    provider?: string;
}

// ===== Security Tool Types =====

export interface SecurityTool {
    id: string;
    name: string;
    description: string;
    category: string;
    execute: (params: Record<string, any>) => Promise<any>;
}

export interface PortScanResult {
    host: string;
    portsScanned: number;
    openPorts: Array<{
        port: number;
        service: string;
        risk: string;
    }>;
    timestamp: string;
}

export interface SystemAnalysisResult {
    timestamp: string;
    system: Record<string, any>;
    security: Record<string, any>;
    processes: Record<string, any>;
    network: Record<string, any>;
    score: number;
    issues: string[];
    recommendations: string[];
}

// ===== IoT Types =====

export interface IoTDevice {
    id: string;
    name: string;
    type: string;
    protocol: string;
    host: string;
    port?: number;
    credentials?: Record<string, any>;
    metadata?: Record<string, any>;
    status: 'connected' | 'disconnected' | 'error';
    lastSeen: string | null;
    connection: any;
}

export interface IoTProtocol {
    id: string;
    name: string;
    description: string;
    defaultPort?: number;
    securePort?: number;
    connect: (config: any) => Promise<any>;
}

// ===== Rate Limiter Types =====

export interface RateLimiterOptions {
    windowMs?: number;
    maxRequests?: number;
    delayAfter?: number;
    delayMs?: number;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    autoBlacklistThreshold?: number;
    blacklistDuration?: number;
}

export interface ClientData {
    requests: number;
    resetTime: number;
    firstRequest: number;
}

// ===== Malware Types =====

export interface FileHashResult {
    filePath: string;
    safe: boolean;
    threats: string[];
    detectionType: string | null;
    hash: {
        sha256: string;
        md5: string;
    } | null;
    timestamp: string;
}

export interface MalwareScanResult {
    directory: string;
    filesScanned: number;
    threatsFound: number;
    threats: FileHashResult[];
    startTime: string;
    endTime: string | null;
}

// ===== Ransomware Types =====

export interface RansomwareAlert {
    type: string;
    severity: string;
    filePath?: string;
    timestamp: string;
    message: string;
    modificationCount?: number;
    timeWindow?: number;
}

// All types are already exported with the 'export interface' declarations above