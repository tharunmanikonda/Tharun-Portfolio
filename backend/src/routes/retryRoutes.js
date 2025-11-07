const express = require('express');
const router = express.Router();

// In-memory store for demo purposes
let requestCount = 0;
const requestLogs = [];

// Simulate an unreliable API endpoint
router.get('/unreliable-api', (req, res) => {
  requestCount++;
  const attemptNumber = parseInt(req.query.attempt) || 1;
  const failureRate = parseFloat(req.query.failureRate) || 0.7;

  const log = {
    timestamp: new Date().toISOString(),
    attempt: attemptNumber,
    requestId: req.query.requestId || `req-${Date.now()}`
  };

  // Simulate random failures
  const shouldFail = Math.random() < failureRate;

  // Simulate different error types
  if (shouldFail) {
    const errors = [
      { status: 500, message: 'Internal Server Error' },
      { status: 503, message: 'Service Unavailable' },
      { status: 429, message: 'Too Many Requests' },
      { status: 408, message: 'Request Timeout' }
    ];
    const error = errors[Math.floor(Math.random() * errors.length)];

    log.status = error.status;
    log.success = false;
    log.error = error.message;
    requestLogs.push(log);

    return res.status(error.status).json({
      success: false,
      error: error.message,
      attempt: attemptNumber,
      timestamp: new Date().toISOString()
    });
  }

  // Success response
  log.status = 200;
  log.success = true;
  requestLogs.push(log);

  res.json({
    success: true,
    data: {
      message: 'Request successful!',
      attempt: attemptNumber,
      timestamp: new Date().toISOString(),
      totalRequests: requestCount
    }
  });
});

// Get retry statistics
router.get('/stats', (req, res) => {
  const successCount = requestLogs.filter(log => log.success).length;
  const failureCount = requestLogs.filter(log => !log.success).length;

  res.json({
    totalRequests: requestLogs.length,
    successful: successCount,
    failed: failureCount,
    successRate: requestLogs.length > 0 ? (successCount / requestLogs.length * 100).toFixed(2) : 0,
    recentLogs: requestLogs.slice(-10)
  });
});

// Reset stats
router.post('/reset', (req, res) => {
  requestCount = 0;
  requestLogs.length = 0;
  res.json({ message: 'Stats reset successfully' });
});

module.exports = router;
