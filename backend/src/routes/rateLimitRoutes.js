const express = require('express');
const router = express.Router();

// In-memory rate limiter store
const rateLimits = new Map();

// Sliding window rate limiter
class SlidingWindowRateLimiter {
  constructor(windowMs = 60000, maxRequests = 10) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  isAllowed(identifier) {
    const now = Date.now();
    const userRequests = rateLimits.get(identifier) || [];

    // Remove old requests outside the window
    const validRequests = userRequests.filter(
      timestamp => now - timestamp < this.windowMs
    );

    if (validRequests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...validRequests);
      const retryAfter = Math.ceil((oldestRequest + this.windowMs - now) / 1000);

      return {
        allowed: false,
        remaining: 0,
        retryAfter,
        resetTime: new Date(oldestRequest + this.windowMs).toISOString()
      };
    }

    // Add current request
    validRequests.push(now);
    rateLimits.set(identifier, validRequests);

    return {
      allowed: true,
      remaining: this.maxRequests - validRequests.length,
      retryAfter: null,
      resetTime: new Date(validRequests[0] + this.windowMs).toISOString()
    };
  }

  reset(identifier) {
    rateLimits.delete(identifier);
  }
}

// Create rate limiter instance (10 requests per minute)
const limiter = new SlidingWindowRateLimiter(60000, 10);

// Rate limited endpoint
router.get('/test', (req, res) => {
  const identifier = req.query.user || req.ip;
  const result = limiter.isAllowed(identifier);

  if (!result.allowed) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded',
      retryAfter: result.retryAfter,
      resetTime: result.resetTime,
      limit: limiter.maxRequests,
      windowMs: limiter.windowMs
    });
  }

  res.json({
    success: true,
    message: 'Request successful',
    rateLimit: {
      limit: limiter.maxRequests,
      remaining: result.remaining,
      resetTime: result.resetTime,
      windowMs: limiter.windowMs
    },
    timestamp: new Date().toISOString()
  });
});

// Get rate limit status
router.get('/status', (req, res) => {
  const identifier = req.query.user || req.ip;
  const userRequests = rateLimits.get(identifier) || [];
  const now = Date.now();

  const validRequests = userRequests.filter(
    timestamp => now - timestamp < limiter.windowMs
  );

  res.json({
    identifier,
    currentRequests: validRequests.length,
    maxRequests: limiter.maxRequests,
    remaining: Math.max(0, limiter.maxRequests - validRequests.length),
    windowMs: limiter.windowMs,
    resetTime: validRequests.length > 0
      ? new Date(Math.min(...validRequests) + limiter.windowMs).toISOString()
      : new Date(now + limiter.windowMs).toISOString(),
    requests: validRequests.map(timestamp => ({
      timestamp: new Date(timestamp).toISOString(),
      age: `${((now - timestamp) / 1000).toFixed(1)}s ago`
    }))
  });
});

// Reset rate limit for a user
router.post('/reset', (req, res) => {
  const identifier = req.query.user || req.ip;
  limiter.reset(identifier);

  res.json({
    message: 'Rate limit reset successfully',
    identifier
  });
});

// Get all rate limit stats
router.get('/stats', (req, res) => {
  const stats = Array.from(rateLimits.entries()).map(([identifier, requests]) => {
    const now = Date.now();
    const validRequests = requests.filter(
      timestamp => now - timestamp < limiter.windowMs
    );

    return {
      identifier,
      requests: validRequests.length,
      remaining: limiter.maxRequests - validRequests.length
    };
  });

  res.json({
    totalUsers: rateLimits.size,
    rateLimitConfig: {
      maxRequests: limiter.maxRequests,
      windowMs: limiter.windowMs,
      windowSeconds: limiter.windowMs / 1000
    },
    users: stats
  });
});

module.exports = router;
