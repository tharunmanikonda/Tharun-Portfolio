const express = require('express');
const router = express.Router();

// In-memory cache with TTL support
class SimpleCache {
  constructor() {
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0
    };
  }

  set(key, value, ttlSeconds = 60) {
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { value, expiresAt });
    this.stats.sets++;

    // Auto-cleanup expired entries
    setTimeout(() => this.delete(key), ttlSeconds * 1000);
  }

  get(key) {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.value;
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, sets: 0 };
  }

  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? ((this.stats.hits / total) * 100).toFixed(2) : 0,
      size: this.cache.size
    };
  }
}

const cache = new SimpleCache();

// Simulate slow API call
const slowApiCall = async (delay = 2000) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        data: {
          timestamp: new Date().toISOString(),
          randomValue: Math.random(),
          message: 'This data took a while to fetch!'
        }
      });
    }, delay);
  });
};

// Cached endpoint - WITH cache
router.get('/with-cache', async (req, res) => {
  const cacheKey = 'api-data';
  const startTime = Date.now();

  // Check cache first
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    const responseTime = Date.now() - startTime;
    return res.json({
      source: 'cache',
      data: cachedData,
      performance: {
        responseTime: `${responseTime}ms`,
        cacheHit: true
      },
      cacheStats: cache.getStats()
    });
  }

  // Cache miss - fetch from "API"
  const apiData = await slowApiCall(2000);
  cache.set(cacheKey, apiData.data, 30); // Cache for 30 seconds

  const responseTime = Date.now() - startTime;

  res.json({
    source: 'api',
    data: apiData.data,
    performance: {
      responseTime: `${responseTime}ms`,
      cacheHit: false,
      cachedFor: '30 seconds'
    },
    cacheStats: cache.getStats()
  });
});

// Non-cached endpoint - WITHOUT cache
router.get('/without-cache', async (req, res) => {
  const startTime = Date.now();

  // Always fetch from "API"
  const apiData = await slowApiCall(2000);

  const responseTime = Date.now() - startTime;

  res.json({
    source: 'api',
    data: apiData.data,
    performance: {
      responseTime: `${responseTime}ms`,
      cached: false
    }
  });
});

// Get cache statistics
router.get('/stats', (req, res) => {
  const stats = cache.getStats();
  const improvement = stats.hits > 0
    ? `${((2000 - 5) / 2000 * 100).toFixed(1)}% faster (${2000 - 5}ms saved per cached request)`
    : 'No cache hits yet';

  res.json({
    ...stats,
    performanceImprovement: improvement,
    cacheEntries: Array.from(cache.cache.keys())
  });
});

// Clear cache
router.post('/clear', (req, res) => {
  cache.clear();
  res.json({ message: 'Cache cleared successfully' });
});

module.exports = router;
