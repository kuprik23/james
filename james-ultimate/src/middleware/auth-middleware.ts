import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../auth/auth-service';
import { LicenseService } from '../license/license-service';

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
  };
  license?: {
    tier: string;
    features: string[];
  };
}

export class AuthMiddleware {
  private authService: AuthService;
  private licenseService: LicenseService;

  constructor(authService: AuthService, licenseService: LicenseService) {
    this.authService = authService;
    this.licenseService = licenseService;
  }

  /**
   * Verify JWT token and attach user to request
   */
  authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          error: 'No token provided',
          message: 'Authentication required',
        });
        return;
      }

      const token = authHeader.substring(7);
      const decoded = this.authService.verifyToken(token);

      req.user = {
        userId: decoded.userId,
        email: decoded.email,
      };

      next();
    } catch (error) {
      res.status(401).json({
        error: 'Invalid token',
        message: error instanceof Error ? error.message : 'Authentication failed',
      });
      return;
    }
  };

  /**
   * Optional authentication - doesn't fail if no token
   */
  optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const decoded = this.authService.verifyToken(token);

        req.user = {
          userId: decoded.userId,
          email: decoded.email,
        };
      }

      next();
    } catch (error) {
      // Continue without authentication
      next();
    }
  };

  /**
   * Require specific license tier
   */
  requireTier = (requiredTier: 'free' | 'pro' | 'enterprise') => {
    return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
      if (!req.user) {
        res.status(401).json({
          error: 'Authentication required',
          message: 'Please log in to access this feature',
        });
        return;
      }

      const license = await this.licenseService.getLicenseDetails(req.user.userId);

      if (!license) {
        res.status(403).json({
          error: 'No license found',
          message: 'Please upgrade your account',
          upgradeRequired: true,
          currentTier: 'free',
          requiredTier,
        });
        return;
      }

      const tierHierarchy = { free: 0, pro: 1, enterprise: 2 };
      const userTierLevel = tierHierarchy[license.tier];
      const requiredTierLevel = tierHierarchy[requiredTier];

      if (userTierLevel < requiredTierLevel) {
        res.status(403).json({
          error: 'Insufficient license tier',
          message: `This feature requires ${requiredTier} tier`,
          upgradeRequired: true,
          currentTier: license.tier,
          requiredTier,
        });
        return;
      }

      // Attach license info to request
      const validation = await this.licenseService.validateLicense(license.license_key);
      req.license = {
        tier: license.tier,
        features: validation.features,
      };

      next();
    };
  };

  /**
   * Require specific feature access
   */
  requireFeature = (featureName: string) => {
    return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
      if (!req.user) {
        res.status(401).json({
          error: 'Authentication required',
          message: 'Please log in to access this feature',
        });
        return;
      }

      const access = await this.licenseService.checkFeatureAccess(
        req.user.userId,
        featureName
      );

      if (!access.allowed) {
        res.status(403).json({
          error: 'Feature not available',
          message: access.reason || 'You do not have access to this feature',
          upgradeRequired: access.upgradeRequired,
          currentTier: access.currentTier,
          requiredTier: access.requiredTier,
          feature: featureName,
        });
        return;
      }

      next();
    };
  };

  /**
   * Check scan limit before allowing scan
   */
  checkScanLimit = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to perform scans',
      });
      return;
    }

    const canScan = await this.licenseService.canPerformScan(req.user.userId);

    if (!canScan.allowed) {
      res.status(429).json({
        error: 'Scan limit reached',
        message: canScan.reason,
        upgradeRequired: canScan.upgradeRequired,
        currentTier: canScan.currentTier,
        requiredTier: canScan.requiredTier,
      });
      return;
    }

    next();
  };

  /**
   * Rate limiting middleware
   */
  rateLimit = (maxRequests: number, windowMs: number) => {
    const requests = new Map<string, { count: number; resetTime: number }>();

    return (req: Request, res: Response, next: NextFunction) => {
      const identifier = req.ip || 'unknown';
      const now = Date.now();
      const record = requests.get(identifier);

      if (!record || now > record.resetTime) {
        requests.set(identifier, {
          count: 1,
          resetTime: now + windowMs,
        });
        return next();
      }

      if (record.count >= maxRequests) {
        return res.status(429).json({
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((record.resetTime - now) / 1000),
        });
      }

      record.count++;
      next();
    };
  };

  /**
   * Validate license key middleware
   */
  validateLicenseKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const licenseKey = req.body.licenseKey || req.query.licenseKey;

    if (!licenseKey) {
      res.status(400).json({
        error: 'License key required',
        message: 'Please provide a license key',
      });
      return;
    }

    const validation = await this.licenseService.validateLicense(licenseKey as string);

    if (!validation.valid) {
      res.status(403).json({
        error: 'Invalid license',
        message: validation.message,
        tier: validation.tier,
        status: validation.status,
      });
      return;
    }

    next();
  };

  /**
   * Admin only middleware
   */
  requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'Admin access required',
      });
      return;
    }

    // In production, check if user has admin role
    // For now, we'll use a simple email check
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',');
    
    if (!adminEmails.includes(req.user.email)) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required',
      });
      return;
    }

    next();
  };
}