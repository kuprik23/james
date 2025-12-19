/**
 * CyberCAT Scanner - Type Definitions
 * Copyright © 2025 Emersa Ltd. All Rights Reserved.
 */

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type LicenseTier = 'free' | 'pro' | 'enterprise';
export type LicenseStatus = 'active' | 'expired' | 'invalid';

export interface PortInfo {
  name: string;
  risk: RiskLevel;
}

export interface OpenPort {
  port: number;
  service: string;
  risk: RiskLevel;
  status: string;
}

export interface SSLInfo {
  valid: boolean;
  validFrom: string;
  validTo: string;
  issuer: string;
  subject: string;
  protocol: string;
  cipher: string;
}

export interface SystemInfo {
  platform: string;
  release: string;
  arch: string;
  hostname: string;
  uptime: string;
  totalMem: string;
  freeMem: string;
  cpus: number;
  networkInterfaces: number;
}

export interface ScanResults {
  host: string;
  timestamp: string;
  ports: OpenPort[];
  ssl: SSLInfo | null;
  system: SystemInfo | null;
  riskLevel: RiskLevel;
}

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

export interface Colors {
  reset: string;
  bright: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  cyan: string;
}