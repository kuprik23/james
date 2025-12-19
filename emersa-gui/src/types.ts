/**
 * EMERSA GUI - Type Definitions
 * Copyright © 2025 Emersa Ltd. All Rights Reserved.
 */

import { WebSocket } from 'ws';

export type LicenseTier = 'free' | 'pro' | 'enterprise';
export type LicenseStatus = 'active' | 'expired' | 'invalid';
export type AgentStatus = 'running' | 'idle' | 'error';

export interface AgentState {
  status: AgentStatus;
  tasks: number;
  lastActive: number | null;
}

export interface AgentStates {
  scanner: AgentState;
  analyzer: AgentState;
  defender: AgentState;
  reporter: AgentState;
  hunter: AgentState;
  orchestrator: AgentState;
}

export interface SecurityStats {
  threatsBlocked: number;
  scansCompleted: number;
  vulnerabilitiesFound: number;
  lastScanTime: string | null;
  systemHealth: number;
}

export interface SystemInfo {
  platform: string;
  arch: string;
  cpus: number;
  totalMemory: string;
  freeMemory: string;
  uptime: string;
}

export interface ScanResults {
  openPorts: number[];
  vulnerabilities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  sslGrade: string;
  duration: string;
  memoryUsed: string;
}

export interface WebSocketMessage {
  type: string;
  message?: string;
  command?: string;
  params?: any;
  scanType?: string;
  target?: string;
  action?: string;
  agent?: string;
}

export interface ApiKeyConfig {
  openai?: string;
  anthropic?: string;
  digitalocean?: string;
}

export interface ApiKeyResponse {
  success: boolean;
  message?: string;
  error?: string;
  keysStored?: number;
}

export interface ToolExecutionRequest {
  tool: string;
  command: string;
}

export interface ToolExecutionResponse {
  success: boolean;
  output?: string;
  error?: string;
  tool?: string;
  command?: string;
  redirect?: string;
}

export interface SystemInfoResponse {
  platform: string;
  node: string;
  python: string;
  path: string;
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

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  data?: any;
  category?: string;
}

export interface ExtendedWebSocket extends WebSocket {
  isAlive?: boolean;
}