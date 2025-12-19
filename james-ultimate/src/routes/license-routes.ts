import { Router, Request, Response } from 'express';
import { AuthService } from '../auth/auth-service';
import { LicenseService } from '../license/license-service';
import { AuthMiddleware, AuthRequest } from '../middleware/auth-middleware';
import { Database } from '../database/database';

export class LicenseRoutes {
  private router: Router;
  private authService: AuthService;
  private licenseService: LicenseService;
  private authMiddleware: AuthMiddleware;

  constructor(db: Database) {
    this.router = Router();
    this.authService = new AuthService(db);
    this.licenseService = new LicenseService(db);
    this.authMiddleware = new AuthMiddleware(this.authService, this.licenseService);
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // ===== Authentication Routes =====
    
    /**
     * POST /auth/register
     * Register new user
     */
    this.router.post('/auth/register', async (req: Request, res: Response): Promise<void> => {
      try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
          res.status(400).json({
            error: 'Missing required fields',
            message: 'Email, password, and name are required',
          });
        }

        const result = await this.authService.register(email, password, name);

        res.status(201).json({
          success: true,
          message: 'User registered successfully',
          user: result.user,
          tokens: result.tokens,
        });
      } catch (error) {
        res.status(400).json({
          error: 'Registration failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    /**
     * POST /auth/login
     * Login user
     */
    this.router.post('/auth/login', async (req: Request, res: Response): Promise<void> => {
      try {
        const { email, password } = req.body;

        if (!email || !password) {
          res.status(400).json({
            error: 'Missing credentials',
            message: 'Email and password are required',
          });
        }

        const result = await this.authService.login(email, password);

        res.json({
          success: true,
          message: 'Login successful',
          user: result.user,
          tokens: result.tokens,
        });
      } catch (error) {
        res.status(401).json({
          error: 'Login failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    /**
     * POST /auth/refresh
     * Refresh access token
     */
    this.router.post('/auth/refresh', async (req: Request, res: Response): Promise<void> => {
      try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
          res.status(400).json({
            error: 'Missing refresh token',
            message: 'Refresh token is required',
          });
        }

        const tokens = await this.authService.refreshAccessToken(refreshToken);

        res.json({
          success: true,
          tokens,
        });
      } catch (error) {
        res.status(401).json({
          error: 'Token refresh failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    /**
     * GET /auth/profile
     * Get user profile (requires authentication)
     */
    this.router.get(
      '/auth/profile',
      this.authMiddleware.authenticate,
      async (req: AuthRequest, res: Response) => {
        try {
          const profile = await this.authService.getUserProfile(req.user!.userId);

          res.json({
            success: true,
            profile,
          });
        } catch (error) {
          res.status(500).json({
            error: 'Failed to fetch profile',
            message: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    );

    /**
     * POST /auth/change-password
     * Change user password
     */
    this.router.post(
      '/auth/change-password',
      this.authMiddleware.authenticate,
      async (req: AuthRequest, res: Response): Promise<void> => {
        try {
          const { oldPassword, newPassword } = req.body;

          if (!oldPassword || !newPassword) {
            res.status(400).json({
              error: 'Missing passwords',
              message: 'Old and new passwords are required',
            });
          }

          await this.authService.changePassword(
            req.user!.userId,
            oldPassword,
            newPassword
          );

          res.json({
            success: true,
            message: 'Password changed successfully',
          });
        } catch (error) {
          res.status(400).json({
            error: 'Password change failed',
            message: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    );

    // ===== License Routes =====

    /**
     * GET /license/validate
     * Validate license key
     */
    this.router.get('/license/validate', async (req: Request, res: Response): Promise<void> => {
      try {
        const licenseKey = req.query.key as string;

        if (!licenseKey) {
          res.status(400).json({
            error: 'Missing license key',
            message: 'License key is required',
          });
        }

        const validation = await this.licenseService.validateLicense(licenseKey);

        res.json({
          success: true,
          validation,
        });
      } catch (error) {
        res.status(500).json({
          error: 'Validation failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    /**
     * GET /license/details
     * Get user's license details
     */
    this.router.get(
      '/license/details',
      this.authMiddleware.authenticate,
      async (req: AuthRequest, res: Response): Promise<void> => {
        try {
          const license = await this.licenseService.getLicenseDetails(req.user!.userId);

          if (!license) {
            res.status(404).json({
              error: 'No license found',
              message: 'User does not have a license',
            });
            return;
          }

          const validation = await this.licenseService.validateLicense(license.license_key);

          res.json({
            success: true,
            license: {
              ...license,
              validation,
            },
          });
        } catch (error) {
          res.status(500).json({
            error: 'Failed to fetch license',
            message: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    );

    /**
     * GET /license/features
     * Get available features for user's tier
     */
    this.router.get(
      '/license/features',
      this.authMiddleware.authenticate,
      async (req: AuthRequest, res: Response) => {
        try {
          const license = await this.licenseService.getLicenseDetails(req.user!.userId);
          const tier = license?.tier || 'free';
          const features = this.licenseService.getFeaturesByTier(tier);

          res.json({
            success: true,
            tier,
            features,
          });
        } catch (error) {
          res.status(500).json({
            error: 'Failed to fetch features',
            message: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    );

    /**
     * POST /license/check-feature
     * Check if user can access a specific feature
     */
    this.router.post(
      '/license/check-feature',
      this.authMiddleware.authenticate,
      async (req: AuthRequest, res: Response): Promise<void> => {
        try {
          const { feature } = req.body;

          if (!feature) {
            res.status(400).json({
              error: 'Missing feature name',
              message: 'Feature name is required',
            });
          }

          const access = await this.licenseService.checkFeatureAccess(
            req.user!.userId,
            feature
          );

          res.json({
            success: true,
            access,
          });
        } catch (error) {
          res.status(500).json({
            error: 'Feature check failed',
            message: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    );

    /**
     * POST /license/upgrade
     * Upgrade license (called after successful payment)
     */
    this.router.post(
      '/license/upgrade',
      this.authMiddleware.authenticate,
      async (req: AuthRequest, res: Response): Promise<void> => {
        try {
          const { tier, subscriptionId, expiresAt } = req.body;

          if (!tier || !subscriptionId) {
            res.status(400).json({
              error: 'Missing required fields',
              message: 'Tier and subscription ID are required',
            });
          }

          if (!['pro', 'enterprise'].includes(tier)) {
            res.status(400).json({
              error: 'Invalid tier',
              message: 'Tier must be pro or enterprise',
            });
            return;
          }

          const license = await this.licenseService.upgradeLicense(
            req.user!.userId,
            tier,
            subscriptionId,
            expiresAt
          );

          res.json({
            success: true,
            message: 'License upgraded successfully',
            license,
          });
        } catch (error) {
          res.status(500).json({
            error: 'Upgrade failed',
            message: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    );

    /**
     * POST /license/cancel
     * Cancel license
     */
    this.router.post(
      '/license/cancel',
      this.authMiddleware.authenticate,
      async (req: AuthRequest, res: Response) => {
        try {
          await this.licenseService.cancelLicense(req.user!.userId);

          res.json({
            success: true,
            message: 'License cancelled successfully',
          });
        } catch (error) {
          res.status(500).json({
            error: 'Cancellation failed',
            message: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    );

    // ===== Scan Routes =====

    /**
     * GET /scan/statistics
     * Get scan statistics
     */
    this.router.get(
      '/scan/statistics',
      this.authMiddleware.authenticate,
      async (req: AuthRequest, res: Response) => {
        try {
          const stats = await this.licenseService.getScanStatistics(req.user!.userId);

          res.json({
            success: true,
            statistics: stats,
          });
        } catch (error) {
          res.status(500).json({
            error: 'Failed to fetch statistics',
            message: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    );

    /**
     * GET /scan/history
     * Get scan history
     */
    this.router.get(
      '/scan/history',
      this.authMiddleware.authenticate,
      async (req: AuthRequest, res: Response) => {
        try {
          const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
          const history = await this.licenseService.getScanHistory(req.user!.userId, limit);

          res.json({
            success: true,
            history,
          });
        } catch (error) {
          res.status(500).json({
            error: 'Failed to fetch history',
            message: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    );

    /**
     * POST /scan/check-limit
     * Check if user can perform a scan
     */
    this.router.post(
      '/scan/check-limit',
      this.authMiddleware.authenticate,
      async (req: AuthRequest, res: Response) => {
        try {
          const canScan = await this.licenseService.canPerformScan(req.user!.userId);

          res.json({
            success: true,
            canScan,
          });
        } catch (error) {
          res.status(500).json({
            error: 'Failed to check limit',
            message: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    );

    // ===== Pricing Routes =====

    /**
     * GET /pricing
     * Get pricing tiers
     */
    this.router.get('/pricing', (req: Request, res: Response) => {
      res.json({
        success: true,
        tiers: [
          {
            name: 'Free',
            price: 0,
            interval: 'month',
            features: [
              'Basic port scanning',
              'System information gathering',
              'Simple vulnerability checks',
              'Limited to 5 scans per day',
            ],
            tier: 'free',
          },
          {
            name: 'Pro',
            price: 29,
            interval: 'month',
            features: [
              'All Free features',
              'Advanced AI-powered threat analysis',
              'Multi-LLM access (OpenAI, Claude, etc.)',
              'Unlimited scans',
              'Real-time monitoring',
              'IoT device management',
              'Custom security agents',
              'Export reports',
            ],
            tier: 'pro',
            popular: true,
          },
          {
            name: 'Enterprise',
            price: 99,
            interval: 'month',
            features: [
              'All Pro features',
              'Priority support',
              'Custom integrations',
              'Advanced analytics',
              'Team collaboration',
              'Dedicated account manager',
            ],
            tier: 'enterprise',
          },
        ],
      });
    });
  }

  public getRouter(): Router {
    return this.router;
  }

  public getAuthMiddleware(): AuthMiddleware {
    return this.authMiddleware;
  }

  public getLicenseService(): LicenseService {
    return this.licenseService;
  }
}