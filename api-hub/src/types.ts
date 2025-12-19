/**
 * API Hub - Type Definitions
 * Copyright © 2025 Emersa Ltd. All Rights Reserved.
 */

import { WebSocket } from 'ws';

export interface ApiConfig {
  name: string;
  baseUrl: string;
  headers: Record<string, string>;
  auth: ApiAuth | null;
  createdAt: string;
}

export interface ApiAuth {
  type: 'bearer' | 'basic' | 'apiKey';
  token?: string;
  username?: string;
  password?: string;
  name?: string;
  value?: string;
  in?: 'header' | 'query';
}

export interface RequestLogEntry {
  id: number;
  apiName: string;
  method: string;
  url: string;
  status: number | string;
  duration: string;
  timestamp: string;
  success: boolean;
  error?: string;
}

export interface ApiCallParams {
  apiName: string;
  method?: string;
  endpoint?: string;
  data?: any;
  headers?: Record<string, string>;
}

export interface ApiCallResult {
  success: boolean;
  status?: number;
  statusText?: string;
  headers?: any;
  data?: any;
  error?: string;
  duration: string;
}

export interface TestConnectionResult {
  success: boolean;
  apiName?: string;
  status?: number;
  latency?: string;
  error?: string;
  timestamp: string;
}

export interface McpServerConfig {
  name: string;
  description: string;
  path: string;
  icon: string;
  tools: string[];
}

export interface McpServerStatus extends McpServerConfig {
  available: boolean;
  running: boolean;
}

export interface WebSocketMessage {
  action: string;
  payload?: any;
}

export interface SystemInfoData {
  os: {
    platform: string;
    distro: string;
    release: string;
  };
  cpu: {
    brand: string;
    cores: number;
  };
  memory: {
    total: string;
    used: string;
    free: string;
  };
  disk: Array<{
    mount: string;
    size: string;
    used: string;
  }>;
}

export interface NetworkAnalysis {
  totalConnections: number;
  established: number;
  listening: number;
  foreignConnections: number;
  topConnections: Array<{
    local: string;
    remote: string;
    process: string;
  }>;
}

export interface ProcessAnalysis {
  total: number;
  running: number;
  blocked: number;
  topCpu: Array<{
    name: string;
    pid: number;
    cpu: string;
    mem: string;
  }>;
  topMem: Array<{
    name: string;
    pid: number;
    cpu: string;
    mem: string;
  }>;
}

export interface UserSessionInfo {
  activeSessions: number;
  sessions: Array<{
    user: string;
    terminal: string;
    ip: string;
    date: string;
    time: string;
  }>;
}

export interface SecurityAlert {
  level: string;
  message: string;
}

export interface SecurityAssessment {
  status: string;
  summary: {
    totalConnections: number;
    foreignConnections: number;
    totalProcesses: number;
    activeSessions: number;
  };
  alerts: SecurityAlert[];
  timestamp: string;
}

export interface ExtendedWebSocket extends WebSocket {
  isAlive?: boolean;
}