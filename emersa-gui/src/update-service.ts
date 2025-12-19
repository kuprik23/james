/**
 * CyberCAT - Update Service
 * Checks for dependency updates and application updates
 * Copyright © 2025 Emersa Ltd. All Rights Reserved.
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import logger from './logger-service';

export interface DependencyUpdate {
  name: string;
  current: string;
  latest: string;
  type: 'dependencies' | 'devDependencies';
  updateAvailable: boolean;
}

export interface UpdateCheckResult {
  hasUpdates: boolean;
  updates: DependencyUpdate[];
  lastChecked: string;
  totalUpdates: number;
}

class UpdateService {
  private updateCheckFile: string;
  private checkInterval: number = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    this.updateCheckFile = path.join(process.cwd(), '.cybercat-update-check');
  }

  /**
   * Check if we should check for updates (based on last check time)
   */
  shouldCheckForUpdates(): boolean {
    try {
      if (!fs.existsSync(this.updateCheckFile)) return true;

      const data = JSON.parse(fs.readFileSync(this.updateCheckFile, 'utf8'));
      const lastCheck = new Date(data.lastChecked);
      const now = new Date();

      return (now.getTime() - lastCheck.getTime()) > this.checkInterval;
    } catch (error) {
      return true;
    }
  }

  /**
   * Save last update check time
   */
  private saveUpdateCheck(result: UpdateCheckResult): void {
    try {
      fs.writeFileSync(this.updateCheckFile, JSON.stringify(result, null, 2));
    } catch (error) {
      logger.error('Failed to save update check', { error: (error as Error).message });
    }
  }

  /**
   * Check for dependency updates using npm outdated
   */
  async checkForUpdates(): Promise<UpdateCheckResult> {
    logger.info('Checking for dependency updates...');

    const result: UpdateCheckResult = {
      hasUpdates: false,
      updates: [],
      lastChecked: new Date().toISOString(),
      totalUpdates: 0
    };

    try {
      // Run npm outdated to check for updates
      const output = execSync('npm outdated --json', {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      }).toString();

      const outdated = JSON.parse(output || '{}');

      // Parse outdated packages
      for (const [name, info] of Object.entries(outdated as Record<string, any>)) {
        result.updates.push({
          name,
          current: info.current,
          latest: info.latest,
          type: info.type || 'dependencies',
          updateAvailable: true
        });
      }

      result.hasUpdates = result.updates.length > 0;
      result.totalUpdates = result.updates.length;

      if (result.hasUpdates) {
        logger.warn(`Found ${result.totalUpdates} package updates available`);
      } else {
        logger.info('All dependencies are up to date');
      }

    } catch (error) {
      // npm outdated returns exit code 1 when updates are found
      // Try to parse the error output
      try {
        const errorOutput = (error as any).stdout?.toString() || '{}';
        const outdated = JSON.parse(errorOutput);

        for (const [name, info] of Object.entries(outdated as Record<string, any>)) {
          result.updates.push({
            name,
            current: info.current,
            latest: info.latest,
            type: info.type || 'dependencies',
            updateAvailable: true
          });
        }

        result.hasUpdates = result.updates.length > 0;
        result.totalUpdates = result.updates.length;
      } catch (parseError) {
        logger.debug('No updates found or error checking updates');
      }
    }

    this.saveUpdateCheck(result);
    return result;
  }

  /**
   * Update all dependencies
   */
  async updateDependencies(): Promise<{ success: boolean; message: string }> {
    logger.info('Updating dependencies...');

    try {
      execSync('npm update', {
        encoding: 'utf8',
        stdio: 'inherit'
      });

      logger.info('Dependencies updated successfully');
      return {
        success: true,
        message: 'All dependencies updated successfully'
      };
    } catch (error) {
      const errorMessage = (error as Error).message;
      logger.error('Failed to update dependencies', { error: errorMessage });
      return {
        success: false,
        message: `Update failed: ${errorMessage}`
      };
    }
  }

  /**
   * Update specific package
   */
  async updatePackage(packageName: string): Promise<{ success: boolean; message: string }> {
    logger.info(`Updating package: ${packageName}`);

    try {
      execSync(`npm update ${packageName}`, {
        encoding: 'utf8',
        stdio: 'inherit'
      });

      logger.info(`Package ${packageName} updated successfully`);
      return {
        success: true,
        message: `${packageName} updated successfully`
      };
    } catch (error) {
      const errorMessage = (error as Error).message;
      logger.error(`Failed to update ${packageName}`, { error: errorMessage });
      return {
        success: false,
        message: `Update failed: ${errorMessage}`
      };
    }
  }

  /**
   * Run security audit
   */
  async runSecurityAudit(): Promise<{ vulnerabilities: number; report: string }> {
    logger.info('Running security audit...');

    try {
      const output = execSync('npm audit --json', {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      }).toString();

      const audit = JSON.parse(output);
      const vulnerabilities = audit.metadata?.vulnerabilities?.total || 0;

      logger.info(`Security audit complete: ${vulnerabilities} vulnerabilities found`);

      return {
        vulnerabilities,
        report: output
      };
    } catch (error) {
      // npm audit returns exit code 1 when vulnerabilities are found
      try {
        const errorOutput = (error as any).stdout?.toString() || '{}';
        const audit = JSON.parse(errorOutput);
        const vulnerabilities = audit.metadata?.vulnerabilities?.total || 0;

        if (vulnerabilities > 0) {
          logger.warn(`Security audit found ${vulnerabilities} vulnerabilities`);
        }

        return {
          vulnerabilities,
          report: errorOutput
        };
      } catch (parseError) {
        logger.error('Failed to run security audit', { error: (error as Error).message });
        return {
          vulnerabilities: -1,
          report: 'Audit failed'
        };
      }
    }
  }

  /**
   * Fix security vulnerabilities automatically
   */
  async fixVulnerabilities(): Promise<{ success: boolean; message: string }> {
    logger.info('Attempting to fix security vulnerabilities...');

    try {
      execSync('npm audit fix', {
        encoding: 'utf8',
        stdio: 'inherit'
      });

      logger.info('Security vulnerabilities fixed');
      return {
        success: true,
        message: 'Vulnerabilities fixed successfully'
      };
    } catch (error) {
      const errorMessage = (error as Error).message;
      logger.error('Failed to fix vulnerabilities', { error: errorMessage });
      return {
        success: false,
        message: `Fix failed: ${errorMessage}`
      };
    }
  }

  /**
   * Get last update check result
   */
  getLastUpdateCheck(): UpdateCheckResult | null {
    try {
      if (!fs.existsSync(this.updateCheckFile)) return null;

      const data = fs.readFileSync(this.updateCheckFile, 'utf8');
      return JSON.parse(data) as UpdateCheckResult;
    } catch (error) {
      return null;
    }
  }

  /**
   * Display update summary
   */
  displayUpdateSummary(result: UpdateCheckResult): void {
    if (!result.hasUpdates) {
      console.log('\n✅ All dependencies are up to date!\n');
      return;
    }

    console.log('\n📦 Available Updates:\n');
    console.log('═'.repeat(60));
    
    result.updates.forEach(update => {
      const arrow = update.current !== update.latest ? '→' : '=';
      console.log(`  ${update.name}: ${update.current} ${arrow} ${update.latest}`);
    });

    console.log('═'.repeat(60));
    console.log(`\nTotal: ${result.totalUpdates} updates available`);
    console.log('\nRun "npm update" to update all dependencies');
    console.log('Or update individually: npm update <package-name>\n');
  }
}

export default new UpdateService();