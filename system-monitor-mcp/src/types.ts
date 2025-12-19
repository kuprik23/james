/**
 * System Monitor MCP Server - Type Definitions
 * Copyright © 2025 Emersa Ltd. All Rights Reserved.
 */

export interface WebsiteCheckResult {
  url: string;
  status: 'online' | 'offline';
  statusCode?: number;
  statusText?: string;
  responseTime: string;
  headers?: {
    server?: string | null;
    contentType?: string | null;
    date?: string | null;
  };
  ssl?: boolean;
  error?: string;
  timestamp: string;
}

export interface PingResult {
  host: string;
  alive: boolean;
  time: string;
  min: string;
  max: string;
  avg: string;
  packetLoss: string;
  output?: string;
  error?: string;
  timestamp: string;
}

export interface SystemInfo {
  os: {
    platform: string;
    distro: string;
    release: string;
    arch: string;
    hostname: string;
  };
  cpu: {
    manufacturer: string;
    brand: string;
    cores: number;
    physicalCores: number;
    speed: string;
    currentLoad: string;
  };
  memory: {
    total: string;
    used: string;
    free: string;
    usedPercent: string;
  };
  disk: Array<{
    fs: string;
    type: string;
    size: string;
    used: string;
    available: string;
    usedPercent: string;
    mount: string;
  }>;
  network: Array<{
    iface: string;
    ip4: string;
    mac: string;
    type: string;
    speed: string;
  }>;
  processes: {
    all: number;
    running: number;
    blocked: number;
    sleeping: number;
  };
  timestamp: string;
  error?: string;
}

export interface ResourceUsage {
  cpu: {
    currentLoad: string;
    userLoad: string;
    systemLoad: string;
    idleLoad: string;
    temperature: string;
  };
  memory: {
    total: string;
    used: string;
    free: string;
    usedPercent: string;
    swapTotal: string;
    swapUsed: string;
  };
  timestamp: string;
  error?: string;
}

export interface MultipleWebsitesResult {
  summary: {
    total: number;
    online: number;
    offline: number;
  };
  results: WebsiteCheckResult[];
  timestamp: string;
}