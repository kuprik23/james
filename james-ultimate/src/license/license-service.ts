import { Database, License } from '../database/database';
import { randomBytes } from 'crypto';

export interface LicenseValidation {
  valid: boolean;
  tier: 'free' | 'pro' | 'enterprise';
  status: string;
  expiresAt?: string;
  features: string[];
  message?: string;
}

export interface FeatureAccess {
  allowed: boolean;
  reason?: string;
  upgradeRequired?: boolean;
  currentTier?: string;
  requiredTier?: string;
}

export class LicenseService {
  private db: Database;

  // Feature definitions by tier
  private readonly TIER_FEATURES = {
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
  private readonly SCAN_LIMITS = {
    free: 1,
    pro: Infinity,
    enterprise: Infinity,
  };

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * Validate license key
   */
  async validateLicense(licenseKey: string): Promise<LicenseValidation> {
    const license = await this.db.getLicenseByKey(licenseKey);

    if (!license) {
      return {
        valid: false,
        tier: 'free',
        status: 'invalid',
        features: this.TIER_FEATURES.free,
        message: 'Invalid license key',
      };
    }

    // Check if license is active
    if (license.status !== 'active') {
      return {
        valid: false,
        tier: license.tier,
        status: license.status,
        features: this.TIER_FEATURES[license.tier],
        message: `License is ${license.status}`,
      };
    }

    // Check expiration
    if (license.expires_at) {
      const expiresAt = new Date(license.expires_at);
      if (expiresAt < new Date()) {
        // Update license status to expired
        await this.db.updateLicense(license.user_id, { status: 'expired' });
        
        return {
          valid: false,
          tier: license.tier,
          status: 'expired',
          features: this.TIER_FEATURES.free,
          expiresAt: license.expires_at,
          message: 'License has expired',
        };
      }
    }

    return {
      valid: true,
      tier: license.tier,
      status: license.status,
      features: this.TIER_FEATURES[license.tier],
      expiresAt: license.expires_at,
    };
  }

  /**
   * Check if user can access a feature
   */
  async checkFeatureAccess(userId: number, featureName: string): Promise<FeatureAccess> {
    const license = await this.db.getLicenseByUserId(userId);

    if (!license) {
      return {
        allowed: false,
        reason: 'No license found',
        upgradeRequired: true,
        currentTier: 'free',
      };
    }

    const validation = await this.validateLicense(license.license_key);

    if (!validation.valid) {
      return {
        allowed: false,
        reason: validation.message || 'License is not valid',
        upgradeRequired: true,
        currentTier: license.tier,
      };
    }

    // Check if feature is available in user's tier
    const hasFeature = validation.features.includes(featureName);

    if (!hasFeature) {
      // Find minimum required tier
      const requiredTier = this.getMinimumTierForFeature(featureName);
      
      return {
        allowed: false,
        reason: `Feature requires ${requiredTier} tier`,
        upgradeRequired: true,
        currentTier: license.tier,
        requiredTier,
      };
    }

    return {
      allowed: true,
      currentTier: license.tier,
    };
  }

  /**
   * Check if user can perform a scan (respects daily limits)
   */
  async canPerformScan(userId: number): Promise<FeatureAccess> {
    const license = await this.db.getLicenseByUserId(userId);
    const tier = license?.tier || 'free';

    // Check daily scan limit
    const dailyCount = await this.db.getDailyScanCount(userId);
    const limit = this.SCAN_LIMITS[tier];

    if (dailyCount >= limit) {
      return {
        allowed: false,
        reason: `Daily scan limit reached (${limit} scans per day for ${tier} tier)`,
        upgradeRequired: tier === 'free',
        currentTier: tier,
        requiredTier: 'pro',
      };
    }

    return {
      allowed: true,
      currentTier: tier,
    };
  }

  /**
   * Generate new license key
   */
  generateLicenseKey(): string {
    const segments = [];
    for (let i = 0; i < 4; i++) {
      segments.push(randomBytes(4).toString('hex').toUpperCase());
    }
    return `CC-${segments.join('-')}`;
  }

  /**
   * Upgrade license tier
   */
  async upgradeLicense(
    userId: number,
    newTier: 'pro' | 'enterprise',
    subscriptionId: string,
    expiresAt?: string
  ): Promise<License> {
    const existingLicense = await this.db.getLicenseByUserId(userId);

    if (existingLicense) {
      // Update existing license
      await this.db.updateLicense(userId, {
        tier: newTier,
        status: 'active',
        stripe_subscription_id: subscriptionId,
        expires_at: expiresAt,
      });
    } else {
      // Create new license
      await this.db.createLicense({
        user_id: userId,
        license_key: this.generateLicenseKey(),
        tier: newTier,
        status: 'active',
        stripe_subscription_id: subscriptionId,
        expires_at: expiresAt,
      });
    }

    const updatedLicense = await this.db.getLicenseByUserId(userId);
    if (!updatedLicense) {
      throw new Error('Failed to update license');
    }

    return updatedLicense;
  }

  /**
   * Downgrade license to free tier
   */
  async downgradeLicense(userId: number): Promise<void> {
    await this.db.updateLicense(userId, {
      tier: 'free',
      status: 'active',
      stripe_subscription_id: undefined,
      expires_at: undefined,
    });
  }

  /**
   * Cancel license
   */
  async cancelLicense(userId: number): Promise<void> {
    await this.db.deactivateLicense(userId);
  }

  /**
   * Get license details
   */
  async getLicenseDetails(userId: number): Promise<License | null> {
    return this.db.getLicenseByUserId(userId);
  }

  /**
   * Get available features for tier
   */
  getFeaturesByTier(tier: 'free' | 'pro' | 'enterprise'): string[] {
    return this.TIER_FEATURES[tier];
  }

  /**
   * Get minimum tier required for feature
   */
  private getMinimumTierForFeature(featureName: string): string {
    if (this.TIER_FEATURES.free.includes(featureName)) return 'free';
    if (this.TIER_FEATURES.pro.includes(featureName)) return 'pro';
    if (this.TIER_FEATURES.enterprise.includes(featureName)) return 'enterprise';
    return 'enterprise';
  }

  /**
   * Record successful scan
   */
  async recordScan(userId: number, scanType: string, target: string, results: string): Promise<void> {
    await this.db.recordScan({
      user_id: userId,
      scan_type: scanType,
      target,
      results,
    });
  }

  /**
   * Get scan history
   */
  async getScanHistory(userId: number, limit?: number): Promise<any[]> {
    return this.db.getScanHistory(userId, limit);
  }

  /**
   * Get scan statistics
   */
  async getScanStatistics(userId: number): Promise<{
    totalScans: number;
    todayScans: number;
    remainingScans: number | string;
    tier: string;
  }> {
    const license = await this.db.getLicenseByUserId(userId);
    const tier = license?.tier || 'free';
    const limit = this.SCAN_LIMITS[tier];
    const todayScans = await this.db.getDailyScanCount(userId);
    const history = await this.db.getScanHistory(userId);

    return {
      totalScans: history.length,
      todayScans,
      remainingScans: limit === Infinity ? 'Unlimited' : Math.max(0, limit - todayScans),
      tier,
    };
  }
}