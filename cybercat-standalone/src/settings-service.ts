/**
 * CyberCat Standalone - Settings Service
 * Handles application settings with file persistence
 * Copyright © 2025 Emersa Ltd. All Rights Reserved.
 */

import * as fs from 'fs';
import * as path from 'path';
import { AppSettings } from './types';

class SettingsService {
  private settingsFile: string;
  private settings: AppSettings;

  constructor() {
    this.settingsFile = path.join(process.cwd(), '.cybercat-settings.json');
    this.settings = this.loadSettings();
  }

  /**
   * Get default settings
   */
  getDefaults(): AppSettings {
    return {
      scanning: {
        autoSave: true,
        outputDir: './reports',
        timeout: 5000,
        maxConcurrent: 10
      },
      security: {
        enableNotifications: true,
        enableAutoScan: false,
        scanInterval: 3600000 // 1 hour
      },
      display: {
        colorOutput: true,
        verboseMode: false,
        showTimestamps: true
      },
      advanced: {
        debugMode: false,
        logLevel: 'info',
        maxLogSize: 100
      }
    };
  }

  /**
   * Load settings from file
   */
  loadSettings(): AppSettings {
    try {
      if (fs.existsSync(this.settingsFile)) {
        const data = fs.readFileSync(this.settingsFile, 'utf8');
        const loaded = JSON.parse(data) as AppSettings;
        // Merge with defaults to handle missing keys
        return this.deepMerge(this.getDefaults(), loaded);
      }
    } catch (error) {
      console.error('Error loading settings:', (error as Error).message);
    }
    return this.getDefaults();
  }

  /**
   * Save settings to file
   */
  saveSettings(): boolean {
    try {
      fs.writeFileSync(this.settingsFile, JSON.stringify(this.settings, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving settings:', (error as Error).message);
      return false;
    }
  }

  /**
   * Get all settings
   */
  getSettings(): AppSettings {
    return { ...this.settings };
  }

  /**
   * Get specific setting
   */
  get(key: string): any {
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
   * Set specific setting
   */
  set(key: string, value: any): boolean {
    const keys = key.split('.');
    let current: any = this.settings;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
    return this.saveSettings();
  }

  /**
   * Update scanning settings
   */
  updateScanningSettings(settings: Partial<AppSettings['scanning']>): boolean {
    this.settings.scanning = { ...this.settings.scanning, ...settings };
    return this.saveSettings();
  }

  /**
   * Update security settings
   */
  updateSecuritySettings(settings: Partial<AppSettings['security']>): boolean {
    this.settings.security = { ...this.settings.security, ...settings };
    return this.saveSettings();
  }

  /**
   * Update display settings
   */
  updateDisplaySettings(settings: Partial<AppSettings['display']>): boolean {
    this.settings.display = { ...this.settings.display, ...settings };
    return this.saveSettings();
  }

  /**
   * Update advanced settings
   */
  updateAdvancedSettings(settings: Partial<AppSettings['advanced']>): boolean {
    this.settings.advanced = { ...this.settings.advanced, ...settings };
    return this.saveSettings();
  }

  /**
   * Reset to defaults
   */
  reset(): boolean {
    this.settings = this.getDefaults();
    return this.saveSettings();
  }

  /**
   * Export settings to JSON string
   */
  export(): string {
    return JSON.stringify(this.settings, null, 2);
  }

  /**
   * Import settings from JSON string
   */
  import(json: string): boolean {
    try {
      const imported = JSON.parse(json) as AppSettings;
      this.settings = this.deepMerge(this.getDefaults(), imported);
      return this.saveSettings();
    } catch (error) {
      console.error('Error importing settings:', (error as Error).message);
      return false;
    }
  }

  /**
   * Deep merge objects
   */
  private deepMerge(target: any, source: any): any {
    const output = { ...target };

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        output[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        output[key] = source[key];
      }
    }

    return output;
  }
}

export default new SettingsService();