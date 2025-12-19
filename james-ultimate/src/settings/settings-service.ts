/**
 * James Ultimate - Settings Management Service
 * Handles all application settings with database persistence
 *
 * Copyright © 2025 Emersa Ltd. All Rights Reserved.
 */

import { EventEmitter } from 'events';
import { Database } from '../database/database';
import { Settings, LLMSettings, ScanningSettings, SecuritySettings, NotificationSettings, DigitalOceanSettings, AdvancedSettings } from '../types';
import { securityCore } from '../security/security-core';
import * as crypto from 'crypto';

export class SettingsService extends EventEmitter {
  private db: Database;
  private settings: Settings;
  private defaultSettings: Settings;

  constructor(db: Database) {
    super();
    this.db = db;
    
    // Define default settings
    this.defaultSettings = {
      llm: {
        providers: {
          openai: { enabled: false },
          anthropic: { enabled: false },
          ollama: { enabled: true, defaultModel: 'llama2' },
          groq: { enabled: false },
          koboldai: { enabled: false }
        },
        defaultProvider: 'ollama',
        temperature: 0.7
      },
      scanning: {
        autoStart: true,
        interval: 60,
        concurrentScans: 3,
        retryFailedScans: true,
        maxRetries: 3,
        enabledScanTypes: ['port', 'vulnerability', 'malware', 'network']
      },
      security: {
        enableAntiMalware: true,
        enableAntiRansomware: true,
        enableFirewall: true,
        enableEncryption: true,
        monitoredDirectories: [process.cwd()],
        quarantineLocation: './quarantine'
      },
      notifications: {
        enableToasts: true,
        enableAlerts: true,
        enableEmailNotifications: false,
        notifyOnThreats: true,
        notifyOnScansCompleted: true,
        notifyOnErrors: true
      },
      digitalOcean: {
        enabled: false
      },
      advanced: {
        debugMode: false,
        logLevel: 'info',
        enableJavaAcceleration: true,
        enableRustCrypto: true,
        maxLogSize: 100,
        backupEnabled: true,
        backupInterval: 24
      }
    };

    this.settings = { ...this.defaultSettings };
  }

  /**
   * Initialize settings from database
   */
  async initialize(): Promise<void> {
    await this.ensureSettingsTable();
    await this.loadSettings();
  }

  /**
   * Create settings table if it doesn't exist
   */
  private async ensureSettingsTable(): Promise<void> {
    await this.db['run'](`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        category TEXT NOT NULL,
        encrypted BOOLEAN DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this.db['run'](`
      CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key)
    `);

    await this.db['run'](`
      CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category)
    `);
  }

  /**
   * Load settings from database
   */
  private async loadSettings(): Promise<void> {
    try {
      const rows = await this.db['all']<any>('SELECT * FROM settings', []);
      
      for (const row of rows) {
        let value = row.value;
        
        // Decrypt if encrypted
        if (row.encrypted) {
          try {
            const encData = JSON.parse(value);
            value = securityCore.decrypt(encData);
          } catch (e) {
            console.error('Failed to decrypt setting:', row.key);
            continue;
          }
        }
        
        // Parse JSON
        try {
          value = JSON.parse(value);
        } catch (e) {
          // Keep as string if not JSON
        }
        
        // Apply to settings object
        this.setNestedValue(this.settings, row.key, value);
      }
      
      this.emit('loaded', this.settings);
    } catch (error) {
      console.error('Failed to load settings:', error);
      // Use defaults on error
    }
  }

  /**
   * Save a setting to database
   */
  private async saveSetting(key: string, value: any, category: string, encrypted: boolean = false): Promise<void> {
    let valueStr = typeof value === 'string' ? value : JSON.stringify(value);
    
    // Encrypt if needed
    if (encrypted) {
      const encData = securityCore.encrypt(valueStr);
      valueStr = JSON.stringify(encData);
    }
    
    await this.db['run'](`
      INSERT OR REPLACE INTO settings (key, value, category, encrypted, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [key, valueStr, category, encrypted ? 1 : 0]);
  }

  /**
   * Get all settings
   */
  getSettings(): Settings {
    return { ...this.settings };
  }

  /**
   * Get settings by category
   */
  getCategory<K extends keyof Settings>(category: K): Settings[K] {
    return { ...this.settings[category] };
  }

  /**
   * Update LLM settings
   */
  async updateLLMSettings(llmSettings: Partial<LLMSettings>): Promise<void> {
    this.settings.llm = { ...this.settings.llm, ...llmSettings };
    
    // Save individual provider settings
    if (llmSettings.providers) {
      for (const [provider, config] of Object.entries(llmSettings.providers)) {
        if (config.apiKey) {
          // Store API key encrypted
          await this.saveSetting(
            `llm.providers.${provider}.apiKey`,
            config.apiKey,
            'llm',
            true
          );
        }
        await this.saveSetting(
          `llm.providers.${provider}.enabled`,
          config.enabled,
          'llm',
          false
        );
        if (config.defaultModel) {
          await this.saveSetting(
            `llm.providers.${provider}.defaultModel`,
            config.defaultModel,
            'llm',
            false
          );
        }
      }
    }
    
    if (llmSettings.defaultProvider) {
      await this.saveSetting('llm.defaultProvider', llmSettings.defaultProvider, 'llm', false);
    }
    
    if (llmSettings.temperature !== undefined) {
      await this.saveSetting('llm.temperature', llmSettings.temperature, 'llm', false);
    }
    
    this.emit('updated', { category: 'llm', settings: this.settings.llm });
  }

  /**
   * Update scanning settings
   */
  async updateScanningSettings(scanningSettings: Partial<ScanningSettings>): Promise<void> {
    this.settings.scanning = { ...this.settings.scanning, ...scanningSettings };
    
    for (const [key, value] of Object.entries(scanningSettings)) {
      await this.saveSetting(`scanning.${key}`, value, 'scanning', false);
    }
    
    this.emit('updated', { category: 'scanning', settings: this.settings.scanning });
  }

  /**
   * Update security settings
   */
  async updateSecuritySettings(securitySettings: Partial<SecuritySettings>): Promise<void> {
    this.settings.security = { ...this.settings.security, ...securitySettings };
    
    for (const [key, value] of Object.entries(securitySettings)) {
      await this.saveSetting(`security.${key}`, value, 'security', false);
    }
    
    this.emit('updated', { category: 'security', settings: this.settings.security });
  }

  /**
   * Update notification settings
   */
  async updateNotificationSettings(notificationSettings: Partial<NotificationSettings>): Promise<void> {
    this.settings.notifications = { ...this.settings.notifications, ...notificationSettings };
    
    for (const [key, value] of Object.entries(notificationSettings)) {
      const encrypted = key === 'emailAddress';
      await this.saveSetting(`notifications.${key}`, value, 'notifications', encrypted);
    }
    
    this.emit('updated', { category: 'notifications', settings: this.settings.notifications });
  }

  /**
   * Update DigitalOcean settings
   */
  async updateDigitalOceanSettings(doSettings: Partial<DigitalOceanSettings>): Promise<void> {
    if (!this.settings.digitalOcean) {
      this.settings.digitalOcean = { enabled: false };
    }
    this.settings.digitalOcean = { ...this.settings.digitalOcean, ...doSettings };
    
    for (const [key, value] of Object.entries(doSettings)) {
      const encrypted = key === 'apiToken';
      await this.saveSetting(`digitalOcean.${key}`, value, 'digitalOcean', encrypted);
    }
    
    this.emit('updated', { category: 'digitalOcean', settings: this.settings.digitalOcean });
  }

  /**
   * Update advanced settings
   */
  async updateAdvancedSettings(advancedSettings: Partial<AdvancedSettings>): Promise<void> {
    this.settings.advanced = { ...this.settings.advanced, ...advancedSettings };
    
    for (const [key, value] of Object.entries(advancedSettings)) {
      await this.saveSetting(`advanced.${key}`, value, 'advanced', false);
    }
    
    this.emit('updated', { category: 'advanced', settings: this.settings.advanced });
  }

  /**
   * Reset settings to defaults
   */
  async resetToDefaults(): Promise<void> {
    await this.db['run']('DELETE FROM settings', []);
    this.settings = { ...this.defaultSettings };
    await this.loadSettings();
    this.emit('reset');
  }

  /**
   * Reset a specific category to defaults
   */
  async resetCategory(category: keyof Settings): Promise<void> {
    await this.db['run']('DELETE FROM settings WHERE category = ?', [category]);
    this.settings[category] = JSON.parse(JSON.stringify(this.defaultSettings[category])) as any;
    this.emit('updated', { category, settings: this.settings[category] });
  }

  /**
   * Export settings to JSON
   */
  exportSettings(): string {
    // Create a copy without sensitive data
    const exportData = { ...this.settings };
    
    // Remove API keys and tokens
    if (exportData.llm?.providers) {
      for (const provider in exportData.llm.providers) {
        if (exportData.llm.providers[provider].apiKey) {
          exportData.llm.providers[provider].apiKey = '[REDACTED]';
        }
      }
    }
    
    if (exportData.digitalOcean?.apiToken) {
      exportData.digitalOcean.apiToken = '[REDACTED]';
    }
    
    if (exportData.notifications?.emailAddress) {
      exportData.notifications.emailAddress = '[REDACTED]';
    }
    
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import settings from JSON
   */
  async importSettings(json: string): Promise<void> {
    try {
      const imported = JSON.parse(json);
      
      // Validate structure
      if (!this.validateSettings(imported)) {
        throw new Error('Invalid settings format');
      }
      
      // Update each category
      if (imported.llm) await this.updateLLMSettings(imported.llm);
      if (imported.scanning) await this.updateScanningSettings(imported.scanning);
      if (imported.security) await this.updateSecuritySettings(imported.security);
      if (imported.notifications) await this.updateNotificationSettings(imported.notifications);
      if (imported.digitalOcean) await this.updateDigitalOceanSettings(imported.digitalOcean);
      if (imported.advanced) await this.updateAdvancedSettings(imported.advanced);
      
      this.emit('imported');
    } catch (error) {
      throw new Error(`Failed to import settings: ${(error as Error).message}`);
    }
  }

  /**
   * Validate settings structure
   */
  private validateSettings(settings: any): boolean {
    // Basic validation - ensure it's an object
    if (typeof settings !== 'object' || settings === null) {
      return false;
    }
    
    // Check for at least one valid category
    const validCategories = ['llm', 'scanning', 'security', 'notifications', 'digitalOcean', 'advanced'];
    return Object.keys(settings).some(key => validCategories.includes(key));
  }

  /**
   * Helper to set nested object value from dot notation key
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  /**
   * Get a specific setting value
   */
  getSetting(key: string): any {
    const keys = key.split('.');
    let value: any = this.settings;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  /**
   * Set a specific setting value
   */
  async setSetting(key: string, value: any, encrypted: boolean = false): Promise<void> {
    const category = key.split('.')[0];
    await this.saveSetting(key, value, category, encrypted);
    this.setNestedValue(this.settings, key, value);
    this.emit('settingChanged', { key, value });
  }
}