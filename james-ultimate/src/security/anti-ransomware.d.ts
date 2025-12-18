/**
 * Type definitions for Anti-Ransomware module
 */

import { EventEmitter } from 'events';
import { RansomwareAlert } from '../types';

export class AntiRansomware extends EventEmitter {
  constructor();
  monitorDirectory(dirPath: string): void;
  stopMonitoring(): void;
  resumeMonitoring(): void;
  setProtection(enabled: boolean): void;
  getStats(): any;
  getBackups(): any[];
  restoreFromBackup(backupFile: string, targetPath: string): { success: boolean; restored?: string; error?: string };
  quarantineSuspiciousFile(filePath: string): Promise<void>;
}

export const antiRansomware: AntiRansomware;