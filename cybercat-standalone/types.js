/**
 * CyberCat Standalone - Type Definitions
 * Copyright © 2025 Emersa Ltd. All Rights Reserved.
 */

/**
 * License validation result
 * @typedef {Object} LicenseValidation
 * @property {boolean} valid - Whether the license is valid
 * @property {'free'|'pro'|'enterprise'} tier - License tier
 * @property {string} status - License status
 * @property {string[]} features - Available features
 * @property {string} [message] - Optional message
 */

/**
 * Scan result
 * @typedef {Object} ScanResult
 * @property {string} id - Unique scan ID
 * @property {string} type - Scan type
 * @property {string} target - Scan target
 * @property {'pending'|'running'|'completed'|'failed'} status - Scan status
 * @property {Array} findings - Scan findings
 * @property {string} startedAt - ISO timestamp
 * @property {string} [completedAt] - ISO timestamp
 * @property {number} [duration] - Duration in ms
 */

/**
 * Notification
 * @typedef {Object} Notification
 * @property {string} id - Notification ID
 * @property {'success'|'error'|'warning'|'info'} type - Notification type
 * @property {string} message - Notification message
 * @property {number} [duration] - Duration in ms
 */

/**
 * Settings
 * @typedef {Object} Settings
 * @property {Object} scanning - Scanning settings
 * @property {boolean} scanning.autoSave - Auto-save reports
 * @property {string} scanning.outputDir - Output directory
 * @property {Object} security - Security settings
 * @property {boolean} security.enableNotifications - Enable notifications
 */

module.exports = {};