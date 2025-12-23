/**
 * James Ultimate - TypeScript Type Definitions
 * Copyright © 2025 Emersa Ltd. All Rights Reserved.
 */

// ============================================================================
// LLM Provider Types
// ============================================================================

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  model?: string;
  provider?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface LLMProvider {
  id: string;
  name: string;
  models: string[];
  endpoint?: string;
  requiresKey: boolean;
  keyEnvVar?: string;
  apiKey?: string | null;
  chat: (messages: ChatMessage[], options?: ChatOptions) => Promise<string>;
  listModels?: () => Promise<string[]>;
}

// ============================================================================
// Agent Types
// ============================================================================

export interface Agent {
  id: string;
  name: string;
  description: string;
  icon: string;
  systemPrompt: string;
  tools: string[];
  temperature: number;
  customizable: boolean;
  customConfig?: Record<string, any>;
  isActive: boolean;
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

// ============================================================================
// Security Tool Types
// ============================================================================

export interface SecurityTool {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  parameters: ToolParameter[];
  execute: (params: any) => Promise<any>;
}

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  required: boolean;
  description: string;
  default?: any;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
  duration?: number;
}

// ============================================================================
// Scan Types
// ============================================================================

export interface ScanConfig {
  type: 'port' | 'vulnerability' | 'malware' | 'network' | 'system';
  target: string;
  options?: Record<string, any>;
  scheduled?: boolean;
  interval?: number;
}

export interface ScanResult {
  id: string;
  type: string;
  target: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  findings: ScanFinding[];
  startedAt: string;
  completedAt?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface ScanFinding {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  recommendation?: string;
  cve?: string;
  cvss?: number;
  references?: string[];
}

// ============================================================================
// Alert & Notification Types
// ============================================================================

export interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  dismissible: boolean;
  actions?: AlertAction[];
  autoClose?: number; // milliseconds
}

export interface AlertAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

// ============================================================================
// Settings Types
// ============================================================================

export interface Settings {
  llm: LLMSettings;
  scanning: ScanningSettings;
  security: SecuritySettings;
  notifications: NotificationSettings;
  digitalOcean?: DigitalOceanSettings;
  advanced: AdvancedSettings;
}

export interface LLMSettings {
  providers: {
    [key: string]: {
      apiKey?: string;
      enabled: boolean;
      defaultModel?: string;
    };
  };
  defaultProvider: string;
  temperature: number;
}

export interface ScanningSettings {
  autoStart: boolean;
  interval: number; // minutes
  concurrentScans: number;
  retryFailedScans: boolean;
  maxRetries: number;
  enabledScanTypes: string[];
}

export interface SecuritySettings {
  enableAntiMalware: boolean;
  enableAntiRansomware: boolean;
  enableFirewall: boolean;
  enableEncryption: boolean;
  monitoredDirectories: string[];
  quarantineLocation: string;
}

export interface NotificationSettings {
  enableToasts: boolean;
  enableAlerts: boolean;
  enableEmailNotifications: boolean;
  emailAddress?: string;
  notifyOnThreats: boolean;
  notifyOnScansCompleted: boolean;
  notifyOnErrors: boolean;
}

export interface DigitalOceanSettings {
  apiToken?: string;
  enabled: boolean;
  defaultRegion?: string;
}

export interface AdvancedSettings {
  debugMode: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  enableJavaAcceleration: boolean;
  enableRustCrypto: boolean;
  maxLogSize: number; // MB
  backupEnabled: boolean;
  backupInterval: number; // hours
}

// ============================================================================
// Database Types
// ============================================================================

export interface LogEntry {
  id: number;
  timestamp: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  category: string;
  message: string;
  metadata?: string; // JSON
  userId?: number;
}

export interface ApiKeyStore {
  id: number;
  provider: string;
  encryptedKey: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

export interface ScanLog {
  id: number;
  userId: number;
  scanType: string;
  target: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  results?: string; // JSON
  findings?: string; // JSON
  startedAt: string;
  completedAt?: string;
  duration?: number;
}

// ============================================================================
// Report Types
// ============================================================================

export interface SecurityReport {
  id: string;
  title: string;
  generatedAt: string;
  generatedBy: string;
  period: {
    start: string;
    end: string;
  };
  summary: ReportSummary;
  scans: ScanResult[];
  threats: ThreatSummary;
  recommendations: string[];
  complianceStatus?: ComplianceStatus;
}

export interface ReportSummary {
  totalScans: number;
  successfulScans: number;
  failedScans: number;
  threatsFound: number;
  vulnerabilitiesFound: number;
  criticalFindings: number;
  highFindings: number;
  mediumFindings: number;
  lowFindings: number;
}

export interface ThreatSummary {
  total: number;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
  topThreats: Array<{
    name: string;
    count: number;
    severity: string;
  }>;
}

export interface ComplianceStatus {
  framework: string;
  overallScore: number;
  passedControls: number;
  failedControls: number;
  details: Array<{
    controlId: string;
    name: string;
    status: 'pass' | 'fail' | 'partial';
    score: number;
  }>;
}

// ============================================================================
// IoT Types
// ============================================================================

export interface IoTDevice {
  id: string;
  name: string;
  type: string;
  protocol: string;
  ipAddress?: string;
  macAddress?: string;
  manufacturer?: string;
  model?: string;
  firmwareVersion?: string;
  status: 'online' | 'offline' | 'unknown';
  lastSeen?: string;
  securityScore?: number;
  vulnerabilities?: ScanFinding[];
}

// ============================================================================
// MCP Types
// ============================================================================

export interface MCPServer {
  name: string;
  description: string;
  tools: MCPTool[];
  resources?: MCPResource[];
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

// ============================================================================
// Export all types
// ============================================================================

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type ScanStatus = 'pending' | 'running' | 'completed' | 'failed';
export type AlertType = 'error' | 'warning' | 'info' | 'success';
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

// ============================================================================
// Additional Security Types
// ============================================================================

export interface PortScanResult {
  host: string;
  portsScanned: number;
  openPorts: Array<{
    port: number;
    service: string;
    risk: string;
  }>;
  timestamp: string;
  timedOut?: boolean;
  scanDuration?: number;
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

export interface EncryptedData {
  data?: string;
  encrypted?: string;
  iv: string;
  tag?: string;
  salt?: string;
  authTag?: string;
}

export interface SecurityEvent {
  id?: string;
  type: string;
  severity?: SeverityLevel;
  message: string;
  timestamp: string;
  pid?: number;
  metadata?: Record<string, any>;
}

export interface ValidationResult {
  valid: boolean;
  isValid?: boolean;
  message?: string;
  errors?: string[];
  warnings?: string[];
  sanitized?: any;
  original?: any;
}