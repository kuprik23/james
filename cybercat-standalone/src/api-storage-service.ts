/**
 * CyberCAT - Secure API Storage Service
 * Encrypted storage for API keys and credentials
 * Copyright © 2025 Emersa Ltd. All Rights Reserved.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import logger from './logger-service';

export type AuthType = 'none' | 'bearer' | 'basic' | 'apiKey' | 'oauth2';

export interface ApiCredentials {
  id: string;
  name: string;
  provider: string;
  baseUrl: string;
  authType: AuthType;
  credentials: {
    token?: string;
    username?: string;
    password?: string;
    apiKey?: string;
    apiKeyHeader?: string;
    clientId?: string;
    clientSecret?: string;
    accessToken?: string;
    refreshToken?: string;
  };
  headers?: Record<string, string>;
  createdAt: string;
  lastUsed?: string;
  usageCount: number;
}

export interface ApiStorageData {
  version: string;
  encrypted: boolean;
  apis: Record<string, ApiCredentials>;
  lastModified: string;
}

class ApiStorageService {
  private storageFile: string;
  private encryptionKey: Buffer;
  private algorithm: string = 'aes-256-gcm';

  constructor() {
    this.storageFile = path.join(process.cwd(), '.cybercat-apis.enc');
    
    // Generate or load encryption key
    this.encryptionKey = this.getOrCreateEncryptionKey();
  }

  /**
   * Get or create encryption key
   */
  private getOrCreateEncryptionKey(): Buffer {
    const keyFile = path.join(process.cwd(), '.cybercat-key');
    
    try {
      if (fs.existsSync(keyFile)) {
        return fs.readFileSync(keyFile);
      }
      
      // Generate new key
      const key = crypto.randomBytes(32);
      fs.writeFileSync(keyFile, key, { mode: 0o600 }); // Owner read/write only
      logger.info('Generated new encryption key', undefined, 'SECURITY');
      return key;
    } catch (error) {
      logger.error('Error managing encryption key', { error: (error as Error).message }, 'SECURITY');
      throw new Error('Failed to initialize encryption');
    }
  }

  /**
   * Encrypt data
   */
  private encrypt(data: string): string {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv) as crypto.CipherGCM;
      
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      // Return: iv:authTag:encrypted
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
      logger.error('Encryption failed', { error: (error as Error).message }, 'SECURITY');
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt data
   */
  private decrypt(encryptedData: string): string {
    try {
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }
      
      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];
      
      const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv) as crypto.DecipherGCM;
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      logger.error('Decryption failed', { error: (error as Error).message }, 'SECURITY');
      throw new Error('Decryption failed');
    }
  }

  /**
   * Load API storage
   */
  private loadStorage(): ApiStorageData {
    try {
      if (!fs.existsSync(this.storageFile)) {
        return {
          version: '2.0',
          encrypted: true,
          apis: {},
          lastModified: new Date().toISOString()
        };
      }
      
      const encryptedContent = fs.readFileSync(this.storageFile, 'utf8');
      const decrypted = this.decrypt(encryptedContent);
      return JSON.parse(decrypted) as ApiStorageData;
    } catch (error) {
      logger.error('Error loading API storage', { error: (error as Error).message }, 'SECURITY');
      return {
        version: '2.0',
        encrypted: true,
        apis: {},
        lastModified: new Date().toISOString()
      };
    }
  }

  /**
   * Save API storage
   */
  private saveStorage(data: ApiStorageData): void {
    try {
      data.lastModified = new Date().toISOString();
      const json = JSON.stringify(data, null, 2);
      const encrypted = this.encrypt(json);
      
      fs.writeFileSync(this.storageFile, encrypted, { mode: 0o600 });
      logger.info('API storage saved securely', undefined, 'SECURITY');
    } catch (error) {
      logger.error('Error saving API storage', { error: (error as Error).message }, 'SECURITY');
      throw new Error('Failed to save API storage');
    }
  }

  /**
   * Add or update API credentials
   */
  addApi(api: Omit<ApiCredentials, 'id' | 'createdAt' | 'usageCount'>): { success: boolean; id: string; error?: string } {
    try {
      const storage = this.loadStorage();
      
      const id = crypto.randomBytes(16).toString('hex');
      const apiData: ApiCredentials = {
        ...api,
        id,
        createdAt: new Date().toISOString(),
        usageCount: 0
      };
      
      storage.apis[id] = apiData;
      this.saveStorage(storage);
      
      logger.info(`API added: ${api.name} (${api.provider})`, { id }, 'API_STORAGE');
      return { success: true, id };
    } catch (error) {
      logger.error('Failed to add API', { error: (error as Error).message }, 'API_STORAGE');
      return { success: false, id: '', error: (error as Error).message };
    }
  }

  /**
   * Get API by ID
   */
  getApi(id: string): ApiCredentials | null {
    try {
      const storage = this.loadStorage();
      const api = storage.apis[id];
      
      if (api) {
        // Update last used
        api.lastUsed = new Date().toISOString();
        api.usageCount++;
        this.saveStorage(storage);
      }
      
      return api || null;
    } catch (error) {
      logger.error('Error retrieving API', { error: (error as Error).message, id }, 'API_STORAGE');
      return null;
    }
  }

  /**
   * List all APIs (without sensitive credentials)
   */
  listApis(): Array<Omit<ApiCredentials, 'credentials'>> {
    try {
      const storage = this.loadStorage();
      
      return Object.values(storage.apis).map(api => ({
        id: api.id,
        name: api.name,
        provider: api.provider,
        baseUrl: api.baseUrl,
        authType: api.authType,
        createdAt: api.createdAt,
        lastUsed: api.lastUsed,
        usageCount: api.usageCount,
        headers: api.headers
      }));
    } catch (error) {
      logger.error('Error listing APIs', { error: (error as Error).message }, 'API_STORAGE');
      return [];
    }
  }

  /**
   * Delete API
   */
  deleteApi(id: string): { success: boolean; error?: string } {
    try {
      const storage = this.loadStorage();
      
      if (!storage.apis[id]) {
        return { success: false, error: 'API not found' };
      }
      
      const apiName = storage.apis[id].name;
      delete storage.apis[id];
      this.saveStorage(storage);
      
      logger.info(`API deleted: ${apiName}`, { id }, 'API_STORAGE');
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete API', { error: (error as Error).message, id }, 'API_STORAGE');
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Update API
   */
  updateApi(id: string, updates: Partial<Omit<ApiCredentials, 'id' | 'createdAt'>>): { success: boolean; error?: string } {
    try {
      const storage = this.loadStorage();
      
      if (!storage.apis[id]) {
        return { success: false, error: 'API not found' };
      }
      
      storage.apis[id] = {
        ...storage.apis[id],
        ...updates
      };
      
      this.saveStorage(storage);
      logger.info(`API updated: ${storage.apis[id].name}`, { id }, 'API_STORAGE');
      return { success: true };
    } catch (error) {
      logger.error('Failed to update API', { error: (error as Error).message, id }, 'API_STORAGE');
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Search APIs by name or provider
   */
  searchApis(query: string): Array<Omit<ApiCredentials, 'credentials'>> {
    const allApis = this.listApis();
    const lowerQuery = query.toLowerCase();
    
    return allApis.filter(api => 
      api.name.toLowerCase().includes(lowerQuery) ||
      api.provider.toLowerCase().includes(lowerQuery) ||
      api.baseUrl.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get API statistics
   */
  getStatistics(): {
    totalApis: number;
    byProvider: Record<string, number>;
    byAuthType: Record<string, number>;
    mostUsed: Array<{ name: string; usageCount: number }>;
  } {
    const storage = this.loadStorage();
    const apis = Object.values(storage.apis);
    
    const byProvider: Record<string, number> = {};
    const byAuthType: Record<string, number> = {};
    
    apis.forEach(api => {
      byProvider[api.provider] = (byProvider[api.provider] || 0) + 1;
      byAuthType[api.authType] = (byAuthType[api.authType] || 0) + 1;
    });
    
    const mostUsed = apis
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10)
      .map(api => ({ name: api.name, usageCount: api.usageCount }));
    
    return {
      totalApis: apis.length,
      byProvider,
      byAuthType,
      mostUsed
    };
  }

  /**
   * Export APIs (encrypted backup)
   */
  exportApis(): { success: boolean; data?: string; error?: string } {
    try {
      const storage = this.loadStorage();
      const exportData = {
        version: storage.version,
        exportDate: new Date().toISOString(),
        apis: storage.apis
      };
      
      const encrypted = this.encrypt(JSON.stringify(exportData, null, 2));
      logger.info('APIs exported', { count: Object.keys(storage.apis).length }, 'API_STORAGE');
      
      return { success: true, data: encrypted };
    } catch (error) {
      logger.error('Export failed', { error: (error as Error).message }, 'API_STORAGE');
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Import APIs (from encrypted backup)
   */
  importApis(encryptedData: string, merge: boolean = false): { success: boolean; imported: number; error?: string } {
    try {
      const decrypted = this.decrypt(encryptedData);
      const importData = JSON.parse(decrypted);
      
      const storage = merge ? this.loadStorage() : {
        version: '2.0',
        encrypted: true,
        apis: {},
        lastModified: new Date().toISOString()
      };
      
      let imported = 0;
      for (const [id, api] of Object.entries(importData.apis as Record<string, ApiCredentials>)) {
        if (!merge || !storage.apis[id]) {
          storage.apis[id] = api;
          imported++;
        }
      }
      
      this.saveStorage(storage);
      logger.info(`APIs imported: ${imported} APIs`, { merge }, 'API_STORAGE');
      
      return { success: true, imported };
    } catch (error) {
      logger.error('Import failed', { error: (error as Error).message }, 'API_STORAGE');
      return { success: false, imported: 0, error: (error as Error).message };
    }
  }

  /**
   * Validate API credentials format
   */
  validateCredentials(api: Partial<ApiCredentials>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!api.name || api.name.trim().length === 0) {
      errors.push('API name is required');
    }
    
    if (!api.provider || api.provider.trim().length === 0) {
      errors.push('Provider is required');
    }
    
    if (!api.baseUrl || api.baseUrl.trim().length === 0) {
      errors.push('Base URL is required');
    }
    
    // Validate URL format
    if (api.baseUrl) {
      try {
        new URL(api.baseUrl);
      } catch (e) {
        errors.push('Invalid base URL format');
      }
    }
    
    // Validate auth-specific requirements
    if (api.authType === 'bearer' && !api.credentials?.token) {
      errors.push('Bearer token is required for bearer auth');
    }
    
    if (api.authType === 'basic' && (!api.credentials?.username || !api.credentials?.password)) {
      errors.push('Username and password are required for basic auth');
    }
    
    if (api.authType === 'apiKey' && (!api.credentials?.apiKey || !api.credentials?.apiKeyHeader)) {
      errors.push('API key and header name are required for API key auth');
    }
    
    if (api.authType === 'oauth2' && (!api.credentials?.clientId || !api.credentials?.clientSecret)) {
      errors.push('Client ID and secret are required for OAuth2');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Clear all APIs (with confirmation)
   */
  clearAll(): { success: boolean; error?: string } {
    try {
      const storage: ApiStorageData = {
        version: '2.0',
        encrypted: true,
        apis: {},
        lastModified: new Date().toISOString()
      };
      
      this.saveStorage(storage);
      logger.warn('All APIs cleared', undefined, 'API_STORAGE');
      
      return { success: true };
    } catch (error) {
      logger.error('Failed to clear APIs', { error: (error as Error).message }, 'API_STORAGE');
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get storage file path (for backup purposes)
   */
  getStorageFilePath(): string {
    return this.storageFile;
  }
}

export default new ApiStorageService();