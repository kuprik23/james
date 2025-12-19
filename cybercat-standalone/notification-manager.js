/**
 * CyberCat Standalone - Notification Manager
 * Handles toast notifications and alerts for CLI
 * Copyright © 2025 Emersa Ltd. All Rights Reserved.
 */

const chalk = require('chalk');
const boxen = require('boxen');

class NotificationManager {
  constructor() {
    this.notifications = [];
  }

  /**
   * Show success notification
   */
  success(message) {
    console.log(chalk.green('✓'), chalk.green(message));
    this.notifications.push({ type: 'success', message, timestamp: new Date() });
  }

  /**
   * Show error notification
   */
  error(message) {
    console.log(chalk.red('✗'), chalk.red(message));
    this.notifications.push({ type: 'error', message, timestamp: new Date() });
  }

  /**
   * Show warning notification
   */
  warning(message) {
    console.log(chalk.yellow('⚠'), chalk.yellow(message));
    this.notifications.push({ type: 'warning', message, timestamp: new Date() });
  }

  /**
   * Show info notification
   */
  info(message) {
    console.log(chalk.blue('ℹ'), chalk.blue(message));
    this.notifications.push({ type: 'info', message, timestamp: new Date() });
  }

  /**
   * Show critical alert (boxed)
   */
  critical(title, message) {
    const content = `${chalk.bold.red(title)}\n\n${message}`;
    console.log(boxen(content, {
      padding: 1,
      margin: 1,
      borderStyle: 'double',
      borderColor: 'red'
    }));
    this.notifications.push({ type: 'critical', title, message, timestamp: new Date() });
  }

  /**
   * Show upgrade prompt
   */
  upgradePrompt(feature, currentTier, requiredTier) {
    const message = `
${chalk.yellow('⚠ Feature Locked')}

${chalk.white('Feature:')} ${chalk.cyan(feature)}
${chalk.white('Current Tier:')} ${chalk.yellow(currentTier)}
${chalk.white('Required Tier:')} ${chalk.green(requiredTier)}

${chalk.white('To unlock this feature, upgrade your license:')}
${chalk.cyan('Email:')} 4d@emersa.io
${chalk.cyan('Subject:')} CYBERCAT License Purchase - [${requiredTier}]

${chalk.gray('Learn more: See LICENSE-PURCHASE.md')}
`;
    console.log(boxen(message, {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'yellow'
    }));
  }

  /**
   * Show scan limit reached message
   */
  scanLimitReached(tier, limit) {
    const message = `
${chalk.red('🚫 Daily Scan Limit Reached')}

${chalk.white('Current Tier:')} ${chalk.yellow(tier)}
${chalk.white('Daily Limit:')} ${chalk.yellow(limit + ' scan(s)')}

${chalk.white('Upgrade to Pro for unlimited scans!')}

${chalk.green('Pro Features:')}
  ✓ Unlimited scans
  ✓ AI-powered threat analysis
  ✓ Real-time monitoring
  ✓ Export reports
  ✓ Priority support

${chalk.cyan('Contact:')} 4d@emersa.io
${chalk.cyan('Price:')} $29/month

${chalk.gray('Your scans will reset tomorrow.')}
`;
    console.log(boxen(message, {
      padding: 1,
      margin: 1,
      borderStyle: 'double',
      borderColor: 'red'
    }));
  }

  /**
   * Clear all notifications
   */
  clear() {
    this.notifications = [];
  }

  /**
   * Get all notifications
   */
  getAll() {
    return this.notifications;
  }
}

module.exports = new NotificationManager();