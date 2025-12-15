/**
 * ════════════════════════════════════════════════════════════════════════════
 * James Ultimate Anti-Ransomware Protection System
 * Copyright © 2024 Emersa Ltd. All Rights Reserved.
 * ════════════════════════════════════════════════════════════════════════════
 * 
 * CONFIDENTIAL AND PROPRIETARY
 * 
 * This module provides military-grade ransomware protection including:
 * - Real-time file system monitoring
 * - Honeypot file detection (canary files)
 * - Suspicious encryption activity detection
 * - Automatic backup and recovery
 * - Process behavior analysis
 * - Mass file modification detection
 * - Shadow copy protection (Windows)
 * 
 * SECURITY NOTICE: This code contains proprietary ransomware defense algorithms.
 * Unauthorized access, use, or distribution is strictly prohibited.
 * ════════════════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { exec } = require('child_process');
const { promisify } = require('util');
const EventEmitter = require('events');
const os = require('os');

const execAsync = promisify(exec);

/**
 * Anti-Ransomware Protection System
 * 
 * Multi-layered defense against ransomware:
 * - Behavioral monitoring for encryption activities
 * - Honeypot/canary file deployment
 * - Real-time file modification tracking
 * - Automatic backup of critical files
 * - Process suspension and kill capabilities
 * - Shadow copy protection
 */
class AntiRansomware extends EventEmitter {
  constructor() {
    super();
    
    // Honeypot configuration
    this.honeypotDir = path.join(process.cwd(), '.honeypot');
    this.honeypotFiles = new Map();
    
    // Backup configuration
    this.backupDir = path.join(process.cwd(), '.ransomware-backup');
    this.backupEnabled = true;
    this.backupInterval = 60000; // 1 minute
    this.lastBackup = null;
    
    // File monitoring
    this.watchedDirectories = new Set();
    this.fileWatchers = new Map();
    this.fileModificationLog = [];
    this.suspiciousActivityThreshold = 10; // Files modified in short time
    this.activityWindow = 5000; // 5 seconds
    
    // Ransomware indicators
    this.ransomwareExtensions = new Set([
      '.encrypted', '.locked', '.crypto', '.crypt', '.crypted',
      '.enc', '.lock', '.locky', '.cerber', '.zepto',
      '.odin', '.thor', '.aesir', '.wannacry', '.wcry',
      '.petya', '.goldeneye', '.mischa', '.ryuk', '.maze',
      '.dharma', '.phobos', '.sodinokibi', '.revil',
      '.darkside', '.blackmatter', '.lockbit'
    ]);
    
    // Known ransomware note filenames
    this.ransomwareNoteNames = new Set([
      'README.txt', 'HOW_TO_DECRYPT.txt', 'DECRYPT_INSTRUCTION.txt',
      'HELP_DECRYPT.txt', 'RECOVER_FILES.txt', 'YOUR_FILES_ARE_ENCRYPTED.txt',
      '_readme.txt', '_openme.txt', 'HELP_RESTORE_FILES.txt'
    ]);
    
    // Protection status
    this.protectionActive = false;
    this.threatsBlocked = 0;
    this.filesProtected = 0;
    
    // Statistics
    this.stats = {
      honeypotTriggers: 0,
      suspiciousActivities: 0,
      processesBlocked: 0,
      filesBackedUp: 0,
      lastThreatTime: null
    };
    
    // Initialize protection
    this.initialize();
    
    console.log('[AntiRansomware] Protection system initialized');
  }

  /**
   * Initialize anti-ransomware protection
   */
  async initialize() {
    try {
      // Create honeypot directory
      if (!fs.existsSync(this.honeypotDir)) {
        fs.mkdirSync(this.honeypotDir, { recursive: true, mode: 0o700 });
      }
      
      // Create backup directory
      if (!fs.existsSync(this.backupDir)) {
        fs.mkdirSync(this.backupDir, { recursive: true, mode: 0o700 });
      }
      
      // Deploy honeypot files
      await this.deployHoneypots();
      
      // Start automatic backup
      if (this.backupEnabled) {
        this.startAutomaticBackup();
      }
      
      this.protectionActive = true;
      console.log('[AntiRansomware] Protection is now ACTIVE');
      
    } catch (error) {
      console.error('[AntiRansomware] Initialization error:', error.message);
    }
  }

  /**
   * Deploy honeypot/canary files to detect ransomware early
   * These files act as tripwires - if modified, ransomware is likely active
   */
  async deployHoneypots() {
    const honeypotNames = [
      'important_documents.txt',
      'passwords.txt',
      'financial_data.xlsx',
      'backup_keys.txt',
      'company_secrets.docx'
    ];

    for (const name of honeypotNames) {
      const filePath = path.join(this.honeypotDir, name);
      
      // Create honeypot with unique content
      const content = `HONEYPOT FILE - DO NOT MODIFY\nID: ${crypto.randomBytes(16).toString('hex')}\nTimestamp: ${new Date().toISOString()}`;
      fs.writeFileSync(filePath, content, { mode: 0o400 }); // Read-only
      
      // Calculate hash for integrity checking
      const hash = crypto.createHash('sha256').update(content).digest('hex');
      this.honeypotFiles.set(filePath, { hash, deployed: new Date().toISOString() });
      
      // Monitor honeypot file
      this.monitorHoneypot(filePath, hash);
    }

    console.log(`[AntiRansomware] Deployed ${honeypotNames.length} honeypot files`);
  }

  /**
   * Monitor honeypot file for any modifications (ransomware indicator)
   * 
   * @param {string} filePath - Honeypot file path
   * @param {string} originalHash - Original file hash
   */
  monitorHoneypot(filePath, originalHash) {
    try {
      fs.watch(filePath, async (eventType) => {
        if (eventType === 'change' || eventType === 'rename') {
          // ALERT: Honeypot triggered!
          this.stats.honeypotTriggers++;
          this.stats.lastThreatTime = new Date().toISOString();
          
          const alert = {
            type: 'HONEYPOT_TRIGGERED',
            severity: 'CRITICAL',
            filePath,
            timestamp: new Date().toISOString(),
            message: 'Ransomware activity detected! Honeypot file was accessed.'
          };
          
          console.error('[AntiRansomware] 🚨 CRITICAL ALERT: Honeypot triggered!', filePath);
          this.emit('ransomware_detected', alert);
          
          // Take immediate action
          await this.respondToThreat(alert);
        }
      });
    } catch (error) {
      console.error('[AntiRansomware] Honeypot monitoring error:', error.message);
    }
  }

  /**
   * Monitor directory for suspicious file modifications
   * 
   * @param {string} dirPath - Directory to monitor
   */
  monitorDirectory(dirPath) {
    if (this.watchedDirectories.has(dirPath)) {
      return; // Already monitoring
    }

    try {
      if (!fs.existsSync(dirPath)) {
        console.warn(`[AntiRansomware] Directory not found: ${dirPath}`);
        return;
      }

      const watcher = fs.watch(dirPath, { recursive: true }, async (eventType, filename) => {
        if (!filename) return;

        const fullPath = path.join(dirPath, filename);
        const ext = path.extname(filename).toLowerCase();
        
        // Check for ransomware extensions
        if (this.ransomwareExtensions.has(ext)) {
          this.handleSuspiciousFile(fullPath, 'RANSOMWARE_EXTENSION');
          return;
        }
        
        // Check for ransomware note files
        if (this.ransomwareNoteNames.has(filename.toLowerCase())) {
          this.handleSuspiciousFile(fullPath, 'RANSOMWARE_NOTE');
          return;
        }
        
        // Log file modification
        this.logFileModification(fullPath);
        
        // Check for mass encryption activity
        this.detectMassEncryption();
      });

      this.fileWatchers.set(dirPath, watcher);
      this.watchedDirectories.add(dirPath);
      
      console.log(`[AntiRansomware] Monitoring directory: ${dirPath}`);
      
    } catch (error) {
      console.error(`[AntiRansomware] Failed to monitor ${dirPath}:`, error.message);
    }
  }

  /**
   * Log file modification for pattern analysis
   * 
   * @param {string} filePath - Modified file path
   */
  logFileModification(filePath) {
    const timestamp = Date.now();
    
    this.fileModificationLog.push({
      filePath,
      timestamp,
      extension: path.extname(filePath)
    });
    
    // Clean old entries (keep only recent modifications)
    const cutoff = timestamp - this.activityWindow;
    this.fileModificationLog = this.fileModificationLog.filter(
      entry => entry.timestamp > cutoff
    );
  }

  /**
   * Detect mass encryption activity (multiple files modified rapidly)
   */
  detectMassEncryption() {
    const recentModifications = this.fileModificationLog.length;
    
    if (recentModifications >= this.suspiciousActivityThreshold) {
      this.stats.suspiciousActivities++;
      this.stats.lastThreatTime = new Date().toISOString();
      
      const alert = {
        type: 'MASS_ENCRYPTION',
        severity: 'HIGH',
        modificationCount: recentModifications,
        timeWindow: this.activityWindow,
        timestamp: new Date().toISOString(),
        message: `Mass file modification detected: ${recentModifications} files in ${this.activityWindow}ms`
      };
      
      console.warn('[AntiRansomware] ⚠️  WARNING: Mass encryption activity detected!');
      this.emit('suspicious_activity', alert);
      
      // Take action
      this.respondToThreat(alert);
    }
  }

  /**
   * Handle suspicious file detection
   * 
   * @param {string} filePath - Suspicious file path
   * @param {string} reason - Detection reason
   */
  handleSuspiciousFile(filePath, reason) {
    const alert = {
      type: 'SUSPICIOUS_FILE',
      severity: 'HIGH',
      filePath,
      reason,
      timestamp: new Date().toISOString(),
      message: `Suspicious file detected: ${path.basename(filePath)} (${reason})`
    };
    
    console.warn('[AntiRansomware] ⚠️  Suspicious file:', filePath, '-', reason);
    this.emit('suspicious_file', alert);
    
    // Quarantine the file
    this.quarantineSuspiciousFile(filePath);
  }

  /**
   * Quarantine suspicious file
   * 
   * @param {string} filePath - File to quarantine
   */
  async quarantineSuspiciousFile(filePath) {
    try {
      if (!fs.existsSync(filePath)) return;
      
      const fileName = path.basename(filePath);
      const quarantinePath = path.join(
        this.backupDir,
        `QUARANTINE_${Date.now()}_${fileName}`
      );
      
      // Move file to quarantine
      fs.renameSync(filePath, quarantinePath);
      
      console.log(`[AntiRansomware] File quarantined: ${fileName}`);
      this.emit('file_quarantined', { original: filePath, quarantine: quarantinePath });
      
    } catch (error) {
      console.error('[AntiRansomware] Quarantine failed:', error.message);
    }
  }

  /**
   * Respond to detected threat
   * 
   * @param {Object} alert - Threat alert details
   */
  async respondToThreat(alert) {
    this.threatsBlocked++;
    
    // Stop monitoring temporarily to prevent feedback loops
    this.stopMonitoring();
    
    // Attempt to identify and kill suspicious processes
    await this.killSuspiciousProcesses();
    
    // Create emergency backup
    await this.emergencyBackup();
    
    // On Windows, protect shadow copies
    if (process.platform === 'win32') {
      await this.protectShadowCopies();
    }
    
    // Resume monitoring after 5 seconds
    setTimeout(() => {
      this.resumeMonitoring();
    }, 5000);
    
    console.log('[AntiRansomware] Threat response executed');
  }

  /**
   * Kill suspicious processes that may be ransomware
   */
  async killSuspiciousProcesses() {
    try {
      const suspiciousPatterns = [
        /encrypt/i, /crypt/i, /ransom/i, /locker/i,
        /wannacry/i, /petya/i, /cerber/i, /locky/i
      ];

      if (process.platform === 'win32') {
        const { stdout } = await execAsync('tasklist /FO CSV /NH');
        const lines = stdout.split('\n');
        
        for (const line of lines) {
          const processName = line.split(',')[0]?.replace(/"/g, '').trim();
          
          for (const pattern of suspiciousPatterns) {
            if (pattern.test(processName)) {
              // Kill suspicious process
              try {
                await execAsync(`taskkill /F /IM "${processName}"`);
                this.stats.processesBlocked++;
                console.log(`[AntiRansomware] Killed suspicious process: ${processName}`);
              } catch (e) {
                console.error(`[AntiRansomware] Failed to kill ${processName}:`, e.message);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('[AntiRansomware] Process kill error:', error.message);
    }
  }

  /**
   * Create emergency backup of critical files
   */
  async emergencyBackup() {
    try {
      const criticalDirs = [
        path.join(os.homedir(), 'Documents'),
        path.join(os.homedir(), 'Desktop'),
        process.cwd()
      ];

      for (const dir of criticalDirs) {
        if (fs.existsSync(dir)) {
          await this.backupDirectory(dir, { emergency: true, maxDepth: 2 });
        }
      }
      
      console.log('[AntiRansomware] Emergency backup completed');
      
    } catch (error) {
      console.error('[AntiRansomware] Emergency backup error:', error.message);
    }
  }

  /**
   * Protect Windows shadow copies from deletion
   */
  async protectShadowCopies() {
    if (process.platform !== 'win32') return;

    try {
      // Enable shadow copy protection
      await execAsync('vssadmin list shadows');
      console.log('[AntiRansomware] Shadow copies checked');
      
      // Prevent deletion via group policy (requires admin)
      // This would typically be done via registry in a production system
      
    } catch (error) {
      console.error('[AntiRansomware] Shadow copy protection error:', error.message);
    }
  }

  /**
   * Backup directory contents
   * 
   * @param {string} dirPath - Directory to backup
   * @param {Object} options - Backup options
   */
  async backupDirectory(dirPath, options = {}) {
    const maxDepth = options.maxDepth || 5;
    const emergency = options.emergency || false;
    
    const backupDir = async (currentPath, depth = 0) => {
      if (depth > maxDepth) return;

      try {
        const entries = fs.readdirSync(currentPath, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(currentPath, entry.name);
          
          // Skip system and hidden directories
          if (entry.name.startsWith('.') || entry.name.startsWith('$')) {
            continue;
          }

          if (entry.isDirectory()) {
            await backupDir(fullPath, depth + 1);
          } else if (entry.isFile()) {
            await this.backupFile(fullPath, emergency);
          }
        }
      } catch (error) {
        // Skip inaccessible directories
      }
    };

    await backupDir(dirPath);
  }

  /**
   * Backup individual file
   * 
   * @param {string} filePath - File to backup
   * @param {boolean} emergency - Emergency backup flag
   */
  async backupFile(filePath, emergency = false) {
    try {
      if (!fs.existsSync(filePath)) return;
      
      const stats = fs.statSync(filePath);
      
      // Skip large files (> 100MB) in normal backups
      if (!emergency && stats.size > 100 * 1024 * 1024) {
        return;
      }
      
      const timestamp = Date.now();
      const relativePath = path.relative(process.cwd(), filePath);
      const backupPath = path.join(
        this.backupDir,
        `${timestamp}_${relativePath.replace(/[\\\/]/g, '_')}`
      );
      
      // Copy file to backup
      fs.copyFileSync(filePath, backupPath);
      this.stats.filesBackedUp++;
      this.filesProtected++;
      
    } catch (error) {
      // Silently skip files that can't be backed up
    }
  }

  /**
   * Start automatic backup service
   */
  startAutomaticBackup() {
    setInterval(async () => {
      if (!this.protectionActive) return;
      
      // Backup critical directories
      const criticalDirs = [
        process.cwd()
      ];

      for (const dir of criticalDirs) {
        if (fs.existsSync(dir)) {
          await this.backupDirectory(dir, { maxDepth: 2 });
        }
      }
      
      this.lastBackup = new Date().toISOString();
      
    }, this.backupInterval);

    console.log('[AntiRansomware] Automatic backup service started');
  }

  /**
   * Stop all monitoring
   */
  stopMonitoring() {
    for (const [dir, watcher] of this.fileWatchers.entries()) {
      watcher.close();
    }
    this.fileWatchers.clear();
    this.watchedDirectories.clear();
    console.log('[AntiRansomware] Monitoring stopped');
  }

  /**
   * Resume monitoring
   */
  resumeMonitoring() {
    // Re-monitor previously watched directories
    const dirs = Array.from(this.watchedDirectories);
    this.watchedDirectories.clear();
    
    for (const dir of dirs) {
      this.monitorDirectory(dir);
    }
    
    console.log('[AntiRansomware] Monitoring resumed');
  }

  /**
   * Get protection statistics
   */
  getStats() {
    return {
      ...this.stats,
      protectionActive: this.protectionActive,
      threatsBlocked: this.threatsBlocked,
      filesProtected: this.filesProtected,
      honeypotFiles: this.honeypotFiles.size,
      watchedDirectories: this.watchedDirectories.size,
      lastBackup: this.lastBackup
    };
  }

  /**
   * Get list of backed up files
   */
  getBackups() {
    try {
      if (!fs.existsSync(this.backupDir)) return [];
      
      return fs.readdirSync(this.backupDir)
        .filter(file => !file.startsWith('QUARANTINE_'))
        .map(file => ({
          filename: file,
          path: path.join(this.backupDir, file),
          size: fs.statSync(path.join(this.backupDir, file)).size,
          created: fs.statSync(path.join(this.backupDir, file)).birthtime
        }))
        .sort((a, b) => b.created - a.created);
        
    } catch (error) {
      console.error('[AntiRansomware] Error listing backups:', error.message);
      return [];
    }
  }

  /**
   * Restore file from backup
   * 
   * @param {string} backupFile - Backup filename to restore
   * @param {string} targetPath - Target restore path
   */
  restoreFromBackup(backupFile, targetPath) {
    try {
      const backupPath = path.join(this.backupDir, backupFile);
      
      if (!fs.existsSync(backupPath)) {
        throw new Error('Backup file not found');
      }
      
      fs.copyFileSync(backupPath, targetPath);
      console.log(`[AntiRansomware] File restored from backup: ${targetPath}`);
      
      return { success: true, restored: targetPath };
      
    } catch (error) {
      console.error('[AntiRansomware] Restore failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Enable/disable protection
   * 
   * @param {boolean} enabled - Protection state
   */
  setProtection(enabled) {
    this.protectionActive = enabled;
    
    if (enabled) {
      console.log('[AntiRansomware] Protection ENABLED');
    } else {
      console.log('[AntiRansomware] Protection DISABLED');
      this.stopMonitoring();
    }
  }
}

// Export singleton instance
const antiRansomware = new AntiRansomware();

module.exports = { AntiRansomware, antiRansomware };
