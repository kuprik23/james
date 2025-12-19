/**
 * Type definitions for Rate Limiter module
 */

import { EventEmitter } from 'events';
import { Request, Response, NextFunction } from 'express';
import { RateLimiterOptions, ClientData } from '../types';

export class RateLimiter extends EventEmitter {
  constructor(options?: RateLimiterOptions);
  middleware(options?: RateLimiterOptions): (req: Request, res: Response, next: NextFunction) => Promise<void>;
  checkLimit(ip: string, maxRequests: number, windowMs: number): Promise<boolean>;
  addToBlacklist(ip: string, reason?: string, duration?: number): void;
  removeFromBlacklist(ip: string): void;
  addToWhitelist(ip: string): void;
  removeFromWhitelist(ip: string): void;
  getStats(): any;
  reset(ip: string): void;
  resetAll(): void;
  destroy(): void;
}

export const rateLimiter: RateLimiter;
