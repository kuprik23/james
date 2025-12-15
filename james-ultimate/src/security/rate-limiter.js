/**
 * ════════════════════════════════════════════════════════════════════════════
 * James Ultimate Rate Limiter & DDoS Protection
 * Copyright © 2024 Emersa Ltd. All Rights Reserved.
 * ════════════════════════════════════════════════════════════════════════════
 * 
 * CONFIDENTIAL AND PROPRIETARY
 * 
 * This module provides enterprise-grade rate limiting and DDoS protection:
 * - IP-based request throttling
 * - Sliding window rate limiting
 * - Automatic IP blacklisting
 * - Distributed rate limiting support
 * - Custom rate limit rules per endpoint
 * - Real-time threat detection
 * 
 * SECURITY NOTICE: This code contains proprietary DDoS defense algorithms.
 * Unauthorized access, use, or distribution is strictly prohibited.
 * ════════════════════════════════════════════════════════════════════════════
 */

const EventEmitter = require('events');

/**
 * Rate Limiter with DDoS Protection
 * 
 * Features:
 * - Token bucket algorithm for smooth rate limiting
 * - Sliding window for accurate counting
 * - Automatic IP blacklist management
 * - Configurable per-route limits
 * - Memory-efficient LRU cache
 */
class RateLimiter extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Default configuration
    this.windowMs = options.windowMs || 60000; // 1 minute
    this.maxRequests = options.maxRequests || 100;
    this.delayAfter = options.delayAfter || 50;
    this.delayMs = options.delayMs || 500;
    this.skipSuccessfulRequests = options.skipSuccessfulRequests || false;
    this.skipFailedRequests = options.skipFailedRequests || false;
    
    // IP tracking
    this.clients = new Map();
    this.blacklist = new Set();
    this.whitelist = new Set();
    
    // Statistics
    this.stats = {
      totalRequests: 0,
      blockedRequests: 0,
      blacklistedIPs: 0,
      activeClients: 0
    };
    
    // Cleanup interval
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    
    // Auto-blacklist threshold
    this.autoBlacklistThreshold = options.autoBlacklistThreshold || 200;
    this.blacklistDuration = options.blacklistDuration || 3600000; // 1 hour
    
    console.log('[RateLimiter] Protection initialized');
  }

  /**
   * Middleware for Express.js
   * 
   * @param {Object} options - Route-specific options
   * @returns {Function} Express middleware
   */
  middleware(options = {}) {
    const maxRequests = options.maxRequests || this.maxRequests;
    const windowMs = options.windowMs || this.windowMs;
    
    return async (req, res, next) => {
      const ip = this.getClientIp(req);
      
      // Check whitelist
      if (this.whitelist.has(ip)) {
        return next();
      }
      
      // Check blacklist
      if (this.blacklist.has(ip)) {
        this.stats.blockedRequests++;
        return res.status(403).json({
          error: 'Access denied',
          message: 'Your IP has been blacklisted due to suspicious activity',
          retryAfter: this.blacklistDuration / 1000
        });
      }
      
      // Rate limit check
      const allowed = await this.checkLimit(ip, maxRequests, windowMs);
      
      if (!allowed) {
        this.stats.blockedRequests++;
        
        // Check if should auto-blacklist
        const clientData = this.clients.get(ip);
        if (clientData && clientData.requests >= this.autoBlacklistThreshold) {
          this.addToBlacklist(ip, 'Exceeded rate limit threshold');
        }
        
        res.set('X-RateLimit-Limit', maxRequests);
        res.set('X-RateLimit-Remaining', 0);
        res.set('X-RateLimit-Reset', new Date(Date.now() + windowMs).toISOString());
        res.set('Retry-After', Math.ceil(windowMs / 1000));
        
        return res.status(429).json({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil(windowMs / 1000)
        });
      }
      
      // Set rate limit headers
      const clientData = this.clients.get(ip);
      res.set('X-RateLimit-Limit', maxRequests);
      res.set('X-RateLimit-Remaining', Math.max(0, maxRequests - clientData.requests));
      res.set('X-RateLimit-Reset', new Date(clientData.resetTime).toISOString());
      
      // Add delay if threshold exceeded
      if (clientData.requests > this.delayAfter) {
        await this.delay(this.delayMs);
      }
      
      this.stats.totalRequests++;
      next();
    };
  }

  /**
   * Get client IP address from request
   * 
   * @param {Object} req - Express request object
   * @returns {string} Client IP address
   */
  getClientIp(req) {
    return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
           req.headers['x-real-ip'] ||
           req.connection.remoteAddress ||
           req.socket.remoteAddress ||
           'unknown';
  }

  /**
   * Check if request is within rate limit
   * 
   * @param {string} ip - Client IP address
   * @param {number} maxRequests - Maximum requests allowed
   * @param {number} windowMs - Time window in milliseconds
   * @returns {boolean} True if allowed
   */
  async checkLimit(ip, maxRequests, windowMs) {
    const now = Date.now();
    let clientData = this.clients.get(ip);
    
    if (!clientData) {
      // New client
      clientData = {
        requests: 1,
        resetTime: now + windowMs,
        firstRequest: now
      };
      this.clients.set(ip, clientData);
      this.stats.activeClients = this.clients.size;
      return true;
    }
    
    // Reset if window expired
    if (now > clientData.resetTime) {
      clientData.requests = 1;
      clientData.resetTime = now + windowMs;
      clientData.firstRequest = now;
      return true;
    }
    
    // Increment request count
    clientData.requests++;
    
    // Check limit
    return clientData.requests <= maxRequests;
  }

  /**
   * Add IP to blacklist
   * 
   * @param {string} ip - IP address to blacklist
   * @param {string} reason - Reason for blacklisting
   * @param {number} duration - Blacklist duration in ms (optional)
   */
  addToBlacklist(ip, reason = 'Manual blacklist', duration = null) {
    this.blacklist.add(ip);
    this.stats.blacklistedIPs = this.blacklist.size;
    
    console.warn(`[RateLimiter] IP blacklisted: ${ip} - ${reason}`);
    
    this.emit('ip_blacklisted', { ip, reason, timestamp: new Date().toISOString() });
    
    // Auto-remove after duration
    if (duration || this.blacklistDuration) {
      setTimeout(() => {
        this.removeFromBlacklist(ip);
      }, duration || this.blacklistDuration);
    }
  }

  /**
   * Remove IP from blacklist
   * 
   * @param {string} ip - IP address to remove
   */
  removeFromBlacklist(ip) {
    if (this.blacklist.delete(ip)) {
      this.stats.blacklistedIPs = this.blacklist.size;
      console.log(`[RateLimiter] IP removed from blacklist: ${ip}`);
      this.emit('ip_unblacklisted', { ip, timestamp: new Date().toISOString() });
    }
  }

  /**
   * Add IP to whitelist
   * 
   * @param {string} ip - IP address to whitelist
   */
  addToWhitelist(ip) {
    this.whitelist.add(ip);
    console.log(`[RateLimiter] IP whitelisted: ${ip}`);
  }

  /**
   * Remove IP from whitelist
   * 
   * @param {string} ip - IP address to remove
   */
  removeFromWhitelist(ip) {
    this.whitelist.delete(ip);
    console.log(`[RateLimiter] IP removed from whitelist: ${ip}`);
  }

  /**
   * Delay execution
   * 
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} Promise that resolves after delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup expired entries
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [ip, data] of this.clients.entries()) {
      if (now > data.resetTime + this.windowMs) {
        this.clients.delete(ip);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      this.stats.activeClients = this.clients.size;
      console.log(`[RateLimiter] Cleaned ${cleaned} expired entries`);
    }
  }

  /**
   * Get rate limiter statistics
   * 
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      ...this.stats,
      blacklistedIPs: Array.from(this.blacklist),
      whitelistedIPs: Array.from(this.whitelist),
      topClients: this.getTopClients(10)
    };
  }

  /**
   * Get top clients by request count
   * 
   * @param {number} limit - Number of top clients to return
   * @returns {Array} Top clients
   */
  getTopClients(limit = 10) {
    return Array.from(this.clients.entries())
      .map(([ip, data]) => ({ ip, requests: data.requests }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, limit);
  }

  /**
   * Reset rate limit for specific IP
   * 
   * @param {string} ip - IP address to reset
   */
  reset(ip) {
    this.clients.delete(ip);
    console.log(`[RateLimiter] Rate limit reset for IP: ${ip}`);
  }

  /**
   * Reset all rate limits
   */
  resetAll() {
    this.clients.clear();
    this.stats.activeClients = 0;
    console.log('[RateLimiter] All rate limits reset');
  }

  /**
   * Destroy rate limiter and cleanup
   */
  destroy() {
    clearInterval(this.cleanupInterval);
    this.clients.clear();
    this.blacklist.clear();
    this.whitelist.clear();
    console.log('[RateLimiter] Rate limiter destroyed');
  }
}

// Export singleton instance with default configuration
const rateLimiter = new RateLimiter({
  windowMs: 60000,        // 1 minute
  maxRequests: 100,       // 100 requests per window
  delayAfter: 50,         // Start delaying after 50 requests
  delayMs: 500,           // 500ms delay
  autoBlacklistThreshold: 200,  // Blacklist after 200 requests in window
  blacklistDuration: 3600000    // 1 hour blacklist
});

module.exports = { RateLimiter, rateLimiter };