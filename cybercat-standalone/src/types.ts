/**
 * CyberCat Standalone - Type Definitions
 * Copyright © 2025 Emersa Ltd. All Rights Reserved.
 */

export type LicenseTier = 'free' | 'pro' | 'enterprise';
export type LicenseStatus = 'active' | 'expired' | 'invalid';
export type ScanStatus = 'pending' | 'running' | 'completed' | 'failed';
export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'critical';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface License {
  tier: LicenseTier;
  key: string | null;
  status: LicenseStatus;
  features: string[];
  activatedAt?: string;
}

export interface LicenseValidation {
  valid: boolean;
  tier: LicenseTier;
  status: string;
  features: string[];
  message?: string;
}

export interface ScanPermission {
  allowed: boolean;
  remaining: number | string;
  tier: LicenseTier;
  reason?: string;
  upgradeRequired?: boolean;
}

export interface ScanStatistics {
  tier: LicenseTier;
  todayScans: number;
  remainingScans: number | string;
  dailyLimit: number | string;
}

export interface ScanCountData {
  date: string;
  count: number;
}

export interface Notification {
  type: NotificationType;
  message: string;
  title?: string;
  timestamp: Date;
}

export interface ScanningSettings {
  autoSave: boolean;
  outputDir: string;
  timeout: number;
  maxConcurrent: number;
}

export interface SecuritySettings {
  enableNotifications: boolean;
  enableAutoScan: boolean;
  scanInterval: number;
}

export interface DisplaySettings {
  colorOutput: boolean;
  verboseMode: boolean;
  showTimestamps: boolean;
}

export interface AdvancedSettings {
  debugMode: boolean;
  logLevel: LogLevel;
  maxLogSize: number;
}

export interface AppSettings {
  scanning: ScanningSettings;
  security: SecuritySettings;
  display: DisplaySettings;
  advanced: AdvancedSettings;
}

export interface SystemInfo {
  os: {
    distro: string;
    release: string;
    hostname: string;
  };
  cpu: {
    brand: string;
  };
  mem: {
    total: number;
    used: number;
  };
  disk: any[];
  network: any[];
  processes: any;
  services: any[];
  users: any[];
}

export interface NetworkInterface {
  name: string;
  ip4: string;
  ip6?: string;
  mac: string;
  type: string;
  speed?: number;
}

export interface NetworkAnalysis {
  interfaces: NetworkInterface[];
  activeConnections: number;
  suspiciousConnections: any[];
  gateway: any;
}

export interface OpenPort {
  port: number;
  service: string;
}

export interface ProcessAnalysis {
  total: number;
  running: number;
  blocked: number;
  sleeping: number;
  suspicious: any[];
  highCpu: any[];
  highMemory: any[];
}

export interface SecurityStatus {
  firewall: {
    enabled: boolean | string;
    details: string;
  };
  antivirus: {
    enabled: boolean | string;
    details: string;
  };
}

export interface SecurityReport {
  timestamp: string;
  system: {
    os: string;
    hostname: string;
    cpu: string;
    memory: string;
    memoryUsed: string;
  };
  network: NetworkAnalysis & {
    openPorts?: OpenPort[];
  };
  processes: {
    total: number;
    running: number;
    suspicious: number;
    highCpu: number;
    highMemory: number;
  };
  security: SecurityStatus;
  recommendations: string[];
  license: LicenseTier;
}