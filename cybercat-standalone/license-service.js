/**
 * CyberCat Standalone - License Service
 * Handles license validation and feature gating
 * Copyright © 2025 Emersa Ltd. All Rights Reserved.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class LicenseService {
  constructor() {
    this.licenseFile = path.join(process.cwd(), '.cybercat-license');
    this.scanCountFile = path.join(process.cwd(), '.cybercat-scans');
    
    // Feature definitions by tier
    this.TIER_FEATURES = {
      free: [
        'basic_port_scan',
        'system_info',
        'simple_vuln_check',
      ],
      pro: [
        'basic_port_scan',
        'system_info',
        'simple_vuln_check',
        'ai_threat_analysis',
        'multi_llm_access',
        'unlimited_scans',
        'real_time_monitoring',
        'iot_management',
        'custom_agents',
        'export_reports',
      ],
      enterprise: [
        'basic_port_scan',
        'system_info',
        'simple_vuln_check',
        'ai_threat_analysis',
        'multi_llm_access',
        'unlimited_scans',
        'real_time_monitoring',
        'iot_management',
        'custom_agents',
        'export_reports',
        'priority_support',
        'custom_integrations',
        'advanced_analytics',
        'team_collaboration',
      ],
    };

    // Daily scan limits by tier
    this.SCAN_LIMITS = {
      free: 1,
      pro: Infinity,
      enterprise: Infinity,
    };
  }

  /**
   * Get current license information
   */
  getLicense() {
    try {
      if (fs.existsSync(this.licenseFile)) {
        const data = fs.readFileSync(this.licenseFile, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error reading license:', error.message);
    }
    
    // Default free tier
    return {
      tier: 'free',
      key: null,
      status: 'active',
      features: this.TIER_FEATURES.free
    };
  }

  /**
   * Validate license key
   */
  validateLicense(licenseKey) {
    if (!licenseKey) {
      return {
        valid: false,
        tier: 'free',
        status: 'invalid',
        features: this.TIER_FEATURES.free,
        message: 'No license key provided',
      };
    }

    // Check license key format (CC-XXXX-XXXX-XXXX-XXXX)
    const keyPattern = /^CC-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/i;
    if (!keyPattern.test(licenseKey)) {
      return {
        valid: false,
        tier: 'free',
        status: 'invalid',
        features: this.TIER_FEATURES.free,
        message: 'Invalid license key format',
      };
    }

    // In standalone mode, we check against local storage
    // In production, this would validate against a server
    const license = this.getLicense();
    if (license.key === licenseKey) {
      return {
        valid: true,
        tier: license.tier,
        status: license.status,
        features: this.TIER_FEATURES[license.tier],
      };
    }

    return {
      valid: false,
      tier: 'free',
      status: 'invalid',
      features: this.TIER_FEATURES.free,
      message: 'License key not found',
    };
  }

  /**
   * Activate a license key
   */
  activateLicense(licenseKey, tier = 'pro') {
    const validation = this.validateLicense(licenseKey);
    
    if (validation.valid || licenseKey.startsWith('CC-')) {
      const license = {
        key: licenseKey,
        tier: tier,
        status: 'active',
        features: this.TIER_FEATURES[tier],
        activatedAt: new Date().toISOString(),
      };
      
      try {
        fs.writeFileSync(this.licenseFile, JSON.stringify(license, null, 2));
        return { success: true, license };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
    
    return { success: false, error: validation.message };
  }

  /**
   * Check if user can perform a scan (respects daily limits)
   */
  canPerformScan() {
    const license = this.getLicense();
    const tier = license.tier || 'free';
    const limit = this.SCAN_LIMITS[tier];

    if (limit === Infinity) {
      return {
        allowed: true,
        remaining: 'Unlimited',
        tier,
      };
    }

    const dailyCount = this.getDailyScanCount();
    
    if (dailyCount >= limit) {
      return {
        allowed: false,
        reason: `Daily scan limit reached (${limit} scans per day for ${tier} tier)`,
        remaining: 0,
        upgradeRequired: true,
        tier,
      };
    }

    return {
      allowed: true,
      remaining: limit - dailyCount,
      tier,
    };
  }

  /**
   * Get today's scan count
   */
  getDailyScanCount() {
    try {
      if (fs.existsSync(this.scanCountFile)) {
        const data = JSON.parse(fs.readFileSync(this.scanCountFile, 'utf8'));
        const today = new Date().toISOString().split('T')[0];
        
        if (data.date === today) {
          return data.count;
        }
      }
    } catch (error) {
      // Ignore errors
    }
    
    return 0;
  }

  /**
   * Record a scan
   */
  recordScan() {
    const today = new Date().toISOString().split('T')[0];
    let data = { date: today, count: 0 };
    
    try {
      if (fs.existsSync(this.scanCountFile)) {
        const existing = JSON.parse(fs.readFileSync(this.scanCountFile, 'utf8'));
        if (existing.date === today) {
          data.count = existing.count;
        }
      }
    } catch (error) {
      // Start fresh if error
    }
    
    data.count++;
    
    try {
      fs.writeFileSync(this.scanCountFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error recording scan:', error.message);
    }
  }

  /**
   * Check if user has access to a feature
   */
  hasFeature(featureName) {
    const license = this.getLicense();
    return license.features.includes(featureName);
  }

  /**
   * Get scan statistics
   */
  getScanStatistics() {
    const license = this.getLicense();
    const tier = license.tier || 'free';
    const limit = this.SCAN_LIMITS[tier];
    const todayScans = this.getDailyScanCount();

    return {
      tier,
      todayScans,
      remainingScans: limit === Infinity ? 'Unlimited' : Math.max(0, limit - todayScans),
      dailyLimit: limit === Infinity ? 'Unlimited' : limit,
    };
  }
}

module.exports = new LicenseService();