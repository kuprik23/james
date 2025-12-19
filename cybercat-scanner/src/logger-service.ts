/**
 * CyberCAT - Logger Service
 * Centralized logging system with file output and log rotation
 * Copyright © 2025 Emersa Ltd. All Rights Reserved.
 */

import * as fs from 'fs';
import * as path from 'path';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  category?: string;
}

class LoggerService {
  private logDir: string;
  private logFile: string;
  private maxLogSize: number = 10 * 1024 * 1024; // 10MB
  private maxLogFiles: number = 5;

  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.logFile = path.join(this.logDir, 'cybercat.log');
    this.ensureLogDirectory();
  }

  /**
   * Ensure log directory exists
   */
  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Rotate logs if file is too large
   */
  private rotateLogs(): void {
    try {
      if (!fs.existsSync(this.logFile)) return;

      const stats = fs.statSync(this.logFile);
      if (stats.size < this.maxLogSize) return;

      // Rotate existing logs
      for (let i = this.maxLogFiles - 1; i > 0; i--) {
        const oldFile = `${this.logFile}.${i}`;
        const newFile = `${this.logFile}.${i + 1}`;
        
        if (fs.existsSync(oldFile)) {
          if (i === this.maxLogFiles - 1) {
            fs.unlinkSync(oldFile); // Delete oldest
          } else {
            fs.renameSync(oldFile, newFile);
          }
        }
      }

      // Rotate current log
      fs.renameSync(this.logFile, `${this.logFile}.1`);
    } catch (error) {
      console.error('Error rotating logs:', (error as Error).message);
    }
  }

  /**
   * Write log entry to file
   */
  private writeToFile(entry: LogEntry): void {
    try {
      this.rotateLogs();
      
      const logLine = `[${entry.timestamp}] [${entry.level}]${entry.category ? ` [${entry.category}]` : ''} ${entry.message}${entry.data ? ' ' + JSON.stringify(entry.data) : ''}\n`;
      
      fs.appendFileSync(this.logFile, logLine, 'utf8');
    } catch (error) {
      console.error('Error writing to log file:', (error as Error).message);
    }
  }

  /**
   * Log a message
   */
  log(level: LogLevel, message: string, data?: any, category?: string): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      category
    };

    // Write to file
    this.writeToFile(entry);

    // Also output to console with colors
    const colors = {
      DEBUG: '\x1b[36m',    // Cyan
      INFO: '\x1b[32m',     // Green
      WARN: '\x1b[33m',     // Yellow
      ERROR: '\x1b[31m',    // Red
      CRITICAL: '\x1b[35m', // Magenta
      reset: '\x1b[0m'
    };

    const color = colors[level] || colors.reset;
    console.log(`${color}[${level}]${colors.reset} ${message}${data ? ' ' + JSON.stringify(data, null, 2) : ''}`);
  }

  /**
   * Convenience methods
   */
  debug(message: string, data?: any, category?: string): void {
    this.log('DEBUG', message, data, category);
  }

  info(message: string, data?: any, category?: string): void {
    this.log('INFO', message, data, category);
  }

  warn(message: string, data?: any, category?: string): void {
    this.log('WARN', message, data, category);
  }

  error(message: string, data?: any, category?: string): void {
    this.log('ERROR', message, data, category);
  }

  critical(message: string, data?: any, category?: string): void {
    this.log('CRITICAL', message, data, category);
  }

  /**
   * Get recent logs
   */
  getRecentLogs(lines: number = 100): LogEntry[] {
    try {
      if (!fs.existsSync(this.logFile)) return [];

      const content = fs.readFileSync(this.logFile, 'utf8');
      const logLines = content.trim().split('\n').slice(-lines);
      
      return logLines.map(line => {
        const match = line.match(/\[(.*?)\] \[(.*?)\](?: \[(.*?)\])? (.*)/);
        if (match) {
          const [, timestamp, level, category, rest] = match;
          const dataMatch = rest.match(/^(.*?)(\{.*\})?$/);
          
          return {
            timestamp,
            level: level as LogLevel,
            message: dataMatch ? dataMatch[1].trim() : rest,
            data: dataMatch && dataMatch[2] ? JSON.parse(dataMatch[2]) : undefined,
            category
          };
        }
        return {
          timestamp: new Date().toISOString(),
          level: 'INFO' as LogLevel,
          message: line
        };
      });
    } catch (error) {
      console.error('Error reading logs:', (error as Error).message);
      return [];
    }
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    try {
      if (fs.existsSync(this.logFile)) {
        fs.unlinkSync(this.logFile);
      }
      
      // Clear rotated logs
      for (let i = 1; i <= this.maxLogFiles; i++) {
        const rotatedFile = `${this.logFile}.${i}`;
        if (fs.existsSync(rotatedFile)) {
          fs.unlinkSync(rotatedFile);
        }
      }
      
      this.info('Logs cleared');
    } catch (error) {
      console.error('Error clearing logs:', (error as Error).message);
    }
  }

  /**
   * Get log file path
   */
  getLogFilePath(): string {
    return this.logFile;
  }

  /**
   * Get log directory path
   */
  getLogDirectory(): string {
    return this.logDir;
  }
}

export default new LoggerService();