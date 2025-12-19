import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

export interface UserData {
  email: string;
  password: string;
  name: string;
  stripe_customer_id?: string;
}

export interface User extends UserData {
  id: number;
  created_at: string;
}

export interface LicenseData {
  user_id: number;
  license_key: string;
  tier: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'inactive' | 'expired' | 'cancelled';
  stripe_subscription_id?: string;
  expires_at?: string;
}

export interface License extends LicenseData {
  id: number;
  created_at: string;
  updated_at: string;
}

export interface ScanRecord {
  user_id: number;
  scan_type: string;
  target: string;
  results: string;
}

export interface PasswordResetToken {
  user_id: number;
  token: string;
  expires_at: string;
}

export class Database {
  private db: sqlite3.Database;
  private dbPath: string;

  constructor(dbPath?: string) {
    this.dbPath = dbPath || path.join(process.cwd(), 'cybercat.db');
    this.db = new sqlite3.Database(this.dbPath);
  }

  /**
   * Initialize database schema
   */
  async initialize(): Promise<void> {
    await this.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        stripe_customer_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this.run(`
      CREATE TABLE IF NOT EXISTS licenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        license_key TEXT UNIQUE NOT NULL,
        tier TEXT NOT NULL CHECK(tier IN ('free', 'pro', 'enterprise')),
        status TEXT NOT NULL CHECK(status IN ('active', 'inactive', 'expired', 'cancelled')),
        stripe_subscription_id TEXT,
        expires_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    await this.run(`
      CREATE TABLE IF NOT EXISTS scan_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        scan_type TEXT NOT NULL,
        target TEXT NOT NULL,
        results TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    await this.run(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    await this.run(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
    `);

    await this.run(`
      CREATE INDEX IF NOT EXISTS idx_licenses_user_id ON licenses(user_id)
    `);

    await this.run(`
      CREATE INDEX IF NOT EXISTS idx_licenses_key ON licenses(license_key)
    `);

    await this.run(`
      CREATE INDEX IF NOT EXISTS idx_scan_history_user_id ON scan_history(user_id)
    `);
  }

  /**
   * User operations
   */
  async createUser(userData: UserData): Promise<number> {
    const result = await this.run(
      `INSERT INTO users (email, password, name, stripe_customer_id) VALUES (?, ?, ?, ?)`,
      [userData.email, userData.password, userData.name, userData.stripe_customer_id]
    );
    return result.lastID;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.get<User>(`SELECT * FROM users WHERE email = ?`, [email]);
  }

  async getUserById(id: number): Promise<User | null> {
    return this.get<User>(`SELECT * FROM users WHERE id = ?`, [id]);
  }

  async updateUserPassword(userId: number, hashedPassword: string): Promise<void> {
    await this.run(`UPDATE users SET password = ? WHERE id = ?`, [hashedPassword, userId]);
  }

  async updateStripeCustomerId(userId: number, stripeCustomerId: string): Promise<void> {
    await this.run(`UPDATE users SET stripe_customer_id = ? WHERE id = ?`, [stripeCustomerId, userId]);
  }

  /**
   * License operations
   */
  async createLicense(licenseData: LicenseData): Promise<number> {
    const result = await this.run(
      `INSERT INTO licenses (user_id, license_key, tier, status, stripe_subscription_id, expires_at) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        licenseData.user_id,
        licenseData.license_key,
        licenseData.tier,
        licenseData.status,
        licenseData.stripe_subscription_id,
        licenseData.expires_at,
      ]
    );
    return result.lastID;
  }

  async getLicenseByUserId(userId: number): Promise<License | null> {
    return this.get<License>(`SELECT * FROM licenses WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`, [userId]);
  }

  async getLicenseByKey(licenseKey: string): Promise<License | null> {
    return this.get<License>(`SELECT * FROM licenses WHERE license_key = ?`, [licenseKey]);
  }

  async updateLicense(userId: number, updates: Partial<LicenseData>): Promise<void> {
    const setClause = Object.keys(updates)
      .map(key => `${key} = ?`)
      .join(', ');
    const values = [...Object.values(updates), new Date().toISOString(), userId];
    
    await this.run(
      `UPDATE licenses SET ${setClause}, updated_at = ? WHERE user_id = ?`,
      values
    );
  }

  async activateLicense(licenseKey: string, subscriptionId: string, tier: string, expiresAt?: string): Promise<void> {
    await this.run(
      `UPDATE licenses 
       SET status = 'active', tier = ?, stripe_subscription_id = ?, expires_at = ?, updated_at = ?
       WHERE license_key = ?`,
      [tier, subscriptionId, expiresAt, new Date().toISOString(), licenseKey]
    );
  }

  async deactivateLicense(userId: number): Promise<void> {
    await this.run(
      `UPDATE licenses SET status = 'cancelled', updated_at = ? WHERE user_id = ?`,
      [new Date().toISOString(), userId]
    );
  }

  /**
   * Scan history operations
   */
  async recordScan(scanRecord: ScanRecord): Promise<number> {
    const result = await this.run(
      `INSERT INTO scan_history (user_id, scan_type, target, results) VALUES (?, ?, ?, ?)`,
      [scanRecord.user_id, scanRecord.scan_type, scanRecord.target, scanRecord.results]
    );
    return result.lastID;
  }

  async getScanHistory(userId: number, limit: number = 50): Promise<any[]> {
    return this.all(
      `SELECT * FROM scan_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
      [userId, limit]
    );
  }

  async getDailyScanCount(userId: number): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const result = await this.get<{ count: number }>(
      `SELECT COUNT(*) as count FROM scan_history 
       WHERE user_id = ? AND DATE(created_at) = ?`,
      [userId, today]
    );
    return result?.count || 0;
  }

  /**
   * Password reset token operations
   */
  async storePasswordResetToken(userId: number, token: string, expiresAt: string): Promise<void> {
    // Delete any existing tokens for this user
    await this.run(`DELETE FROM password_reset_tokens WHERE user_id = ?`, [userId]);
    
    // Insert new token
    await this.run(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)`,
      [userId, token, expiresAt]
    );
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | null> {
    return this.get<PasswordResetToken>(
      `SELECT * FROM password_reset_tokens WHERE token = ? AND expires_at > datetime('now')`,
      [token]
    );
  }

  async deletePasswordResetToken(userId: number): Promise<void> {
    await this.run(`DELETE FROM password_reset_tokens WHERE user_id = ?`, [userId]);
  }

  /**
   * Database helper methods
   */
  private run(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  private get<T>(sql: string, params: any[] = []): Promise<T | null> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row as T || null);
      });
    });
  }

  private all<T>(sql: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows as T[] || []);
      });
    });
  }

  /**
   * Close database connection
   */
  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Backup database
   */
  async backup(backupPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const source = fs.createReadStream(this.dbPath);
      const destination = fs.createWriteStream(backupPath);
      
      source.pipe(destination);
      destination.on('finish', () => resolve());
      destination.on('error', (err) => reject(err));
    });
  }
}