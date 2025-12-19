import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { Database } from '../database/database';

export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  created_at: string;
  stripe_customer_id?: string;
}

export interface UserProfile {
  id: number;
  email: string;
  name: string;
  created_at: string;
  license_tier: string;
  license_key?: string;
  subscription_status: string;
  subscription_end?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private db: Database;
  private readonly JWT_SECRET: string;
  private readonly JWT_REFRESH_SECRET: string;
  private readonly JWT_EXPIRES_IN = '1h';
  private readonly REFRESH_EXPIRES_IN = '7d';

  constructor(db: Database) {
    this.db = db;
    this.JWT_SECRET = process.env.JWT_SECRET || randomBytes(32).toString('hex');
    this.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || randomBytes(32).toString('hex');
    
    if (!process.env.JWT_SECRET) {
      console.warn('WARNING: JWT_SECRET not set in environment, using generated key. This will invalidate tokens on restart!');
    }
  }

  /**
   * Register a new user
   */
  async register(email: string, password: string, name: string): Promise<{ user: UserProfile; tokens: AuthTokens }> {
    // Check if user already exists
    const existingUser = await this.db.getUserByEmail(email);
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Validate email format
    if (!this.isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    // Validate password strength
    if (!this.isValidPassword(password)) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userId = await this.db.createUser({
      email,
      password: hashedPassword,
      name,
    });

    // Create free tier license by default
    await this.db.createLicense({
      user_id: userId,
      license_key: this.generateLicenseKey(),
      tier: 'free',
      status: 'active',
    });

    // Generate tokens
    const tokens = this.generateTokens(userId, email);

    // Get user profile
    const userProfile = await this.getUserProfile(userId);

    return { user: userProfile, tokens };
  }

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<{ user: UserProfile; tokens: AuthTokens }> {
    // Get user
    const user = await this.db.getUserByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate tokens
    const tokens = this.generateTokens(user.id, user.email);

    // Get user profile
    const userProfile = await this.getUserProfile(user.id);

    return { user: userProfile, tokens };
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): { userId: number; email: string } {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;
      return { userId: decoded.userId, email: decoded.email };
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const decoded = jwt.verify(refreshToken, this.JWT_REFRESH_SECRET) as any;
      return this.generateTokens(decoded.userId, decoded.email);
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  /**
   * Get user profile with license information
   */
  async getUserProfile(userId: number): Promise<UserProfile> {
    const user = await this.db.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const license = await this.db.getLicenseByUserId(userId);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      created_at: user.created_at,
      license_tier: license?.tier || 'free',
      license_key: license?.license_key,
      subscription_status: license?.status || 'inactive',
      subscription_end: license?.expires_at,
    };
  }

  /**
   * Generate JWT tokens
   */
  private generateTokens(userId: number, email: string): AuthTokens {
    const accessToken = jwt.sign(
      { userId, email },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { userId, email },
      this.JWT_REFRESH_SECRET,
      { expiresIn: this.REFRESH_EXPIRES_IN }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Generate license key
   */
  private generateLicenseKey(): string {
    const segments = [];
    for (let i = 0; i < 4; i++) {
      segments.push(randomBytes(4).toString('hex').toUpperCase());
    }
    return segments.join('-');
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   */
  private isValidPassword(password: string): boolean {
    return password.length >= 8;
  }

  /**
   * Change user password
   */
  async changePassword(userId: number, oldPassword: string, newPassword: string): Promise<void> {
    const user = await this.db.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify old password
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid current password');
    }

    // Validate new password
    if (!this.isValidPassword(newPassword)) {
      throw new Error('New password must be at least 8 characters long');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await this.db.updateUserPassword(userId, hashedPassword);
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<string> {
    const user = await this.db.getUserByEmail(email);
    if (!user) {
      // Don't reveal if user exists
      return 'If the email exists, a reset link has been sent';
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(resetToken, 10);
    
    // Store hashed token with expiration (1 hour)
    const expiresAt = new Date(Date.now() + 3600000).toISOString();
    await this.db.storePasswordResetToken(user.id, hashedToken, expiresAt);

    // In production, send email with reset link
    // For now, return token for testing
    return resetToken;
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Validate new password
    if (!this.isValidPassword(newPassword)) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Find user with valid reset token
    const resetData = await this.db.getPasswordResetToken(token);
    if (!resetData) {
      throw new Error('Invalid or expired reset token');
    }

    // Check if token is expired
    if (new Date(resetData.expires_at) < new Date()) {
      throw new Error('Reset token has expired');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await this.db.updateUserPassword(resetData.user_id, hashedPassword);

    // Delete used token
    await this.db.deletePasswordResetToken(resetData.user_id);
  }
}