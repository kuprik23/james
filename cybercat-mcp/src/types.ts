/**
 * CyberCAT MCP Server - Type Definitions
 * Copyright © 2025 Emersa Ltd. All Rights Reserved.
 */

export type ThreatLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export interface ThreatLevels {
  CRITICAL: string;
  HIGH: string;
  MEDIUM: string;
  LOW: string;
  INFO: string;
}

export interface Alert {
  timestamp: string;
  level: string;
  category: string;
  message: string;
  details: Record<string, any>;
  alertId: string;
}

export interface NetworkConnection {
  protocol?: string;
  localAddress?: string;
  localPort?: number;
  peerAddress?: string;
  peerPort?: number;
  state?: string;
  process?: string;
}

export interface NetworkAnalysis {
  totalConnections: number;
  established: number;
  listening: number;
  timeWait: number;
  suspicious: Array<{
    port: number;
    peer?: string;
    state?: string;
    process?: string;
  }>;
  byProtocol: {
    tcp: number;
    udp: number;
  };
  foreignConnections: Array<{
    localPort?: number;
    peerAddress?: string;
    peerPort?: number;
    state?: string;
    process?: string;
  }>;
  localServices: Array<{
    port?: number;
    protocol?: string;
    process?: string;
  }>;
  networkTraffic?: Array<{
    interface: string;
    rxBytes: string;
    txBytes: string;
    rxPerSec: string;
    txPerSec: string;
  }>;
}

export interface NetworkAnalysisResult {
  status: string;
  threatLevel: string;
  analysis: NetworkAnalysis;
  alerts: Alert[];
  timestamp: string;
}

export interface Process {
  name?: string;
  pid?: number;
  cpu?: number;
  mem?: number;
  user?: string;
  command?: string;
}

export interface ProcessAnalysis {
  totalProcesses: number;
  running: number;
  blocked: number;
  sleeping: number;
  suspiciousProcesses: Array<{
    name?: string;
    pid?: number;
    cpu?: number;
    mem?: number;
    user?: string;
    command?: string;
  }>;
  highCpuProcesses: Array<{
    name?: string;
    pid?: number;
    cpu: string;
    command?: string;
  }>;
  highMemoryProcesses: Array<{
    name?: string;
    pid?: number;
    mem: string;
    command?: string;
  }>;
  elevatedProcesses: any[];
  unknownProcesses: any[];
  services: {
    total: number;
    running: number;
    stopped: number;
  };
}

export interface ProcessAnalysisResult {
  status: string;
  threatLevel: string;
  analysis: ProcessAnalysis;
  alerts: Alert[];
  timestamp: string;
}

export interface PortScanResult {
  host: string;
  scannedPorts: number;
  openPorts: Array<{
    port: number;
    service: string;
    status: string;
  }>;
  openCount: number;
  threatLevel: string;
  alerts: Alert[];
  timestamp: string;
}

export interface UserSession {
  user?: string;
  terminal?: string;
  loginTime?: string;
  ip?: string;
  command?: string;
}

export interface UserSessionAnalysis {
  currentUser: string;
  activeSessions: number;
  sessions: UserSession[];
  remoteConnections: number;
}

export interface UserSessionResult {
  status: string;
  threatLevel: string;
  analysis: UserSessionAnalysis;
  alerts: Alert[];
  timestamp: string;
}

export interface SecurityCheck {
  check: string;
  status: string;
  realTimeProtection?: string;
  error?: string;
  note?: string;
}

export interface SecurityConfigAnalysis {
  os: {
    platform: string;
    distro: string;
    release: string;
    kernel: string;
    arch: string;
  };
  system: {
    manufacturer: string;
    model: string;
    serial: string;
    uuid: string;
  };
  bios: {
    vendor: string;
    version: string;
    releaseDate: string;
  };
  securityChecks: SecurityCheck[];
  recommendations: string[];
}

export interface SecurityConfigResult {
  status: string;
  threatLevel: string;
  analysis: SecurityConfigAnalysis;
  alerts: Alert[];
  findings: string[];
  timestamp: string;
}

export interface DNSRecords {
  A?: string[];
  AAAA?: string[];
  MX?: any[];
  NS?: string[];
  TXT?: string[][];
  DMARC?: string[][];
}

export interface DNSReconResult {
  domain: string;
  records: DNSRecords;
  alerts: Alert[];
  timestamp: string;
  status?: string;
  threatLevel?: string;
  error?: string;
}

export interface SecurityAssessment {
  startTime: string;
  modules: {
    network?: NetworkAnalysisResult;
    processes?: ProcessAnalysisResult;
    userSessions?: UserSessionResult;
    securityConfig?: SecurityConfigResult;
  };
  overallThreatLevel: string;
  totalAlerts: number;
  criticalAlerts: number;
  highAlerts: number;
  mediumAlerts: number;
  lowAlerts: number;
  endTime?: string;
  allAlerts?: Alert[];
  executiveSummary?: {
    status: string;
    threatLevel: string;
    alertSummary: string;
    recommendations: string[];
  };
}

export interface ToolResult {
  content: Array<{
    type: string;
    text: string;
  }>;
  isError?: boolean;
}