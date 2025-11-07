const express = require('express');
const crypto = require('crypto');
const router = express.Router();

// In-memory store for processed webhooks (idempotency)
const processedWebhooks = new Set();
const webhookLogs = [];

// Webhook signature verification middleware
const verifyWebhookSignature = (req, res, next) => {
  const signature = req.headers['x-webhook-signature'];
  const secret = req.headers['x-webhook-secret'] || 'demo-secret-key';

  if (!signature) {
    return res.status(401).json({
      error: 'Missing webhook signature',
      message: 'x-webhook-signature header is required'
    });
  }

  // Calculate expected signature
  const payload = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  // Compare signatures
  if (signature !== expectedSignature) {
    return res.status(401).json({
      error: 'Invalid signature',
      message: 'Webhook signature verification failed'
    });
  }

  next();
};

// Check for duplicate webhooks (idempotency)
const checkIdempotency = (req, res, next) => {
  const webhookId = req.body.id || req.headers['x-webhook-id'];

  if (!webhookId) {
    return res.status(400).json({
      error: 'Missing webhook ID',
      message: 'Webhook ID is required for idempotency'
    });
  }

  if (processedWebhooks.has(webhookId)) {
    return res.status(200).json({
      success: true,
      message: 'Webhook already processed (idempotent)',
      webhookId,
      duplicate: true
    });
  }

  req.webhookId = webhookId;
  next();
};

// Webhook receiver endpoint
router.post('/receive', verifyWebhookSignature, checkIdempotency, (req, res) => {
  const { webhookId } = req;
  const payload = req.body;

  // Mark webhook as processed
  processedWebhooks.add(webhookId);

  // Log webhook
  const log = {
    id: webhookId,
    timestamp: new Date().toISOString(),
    event: payload.event || 'unknown',
    data: payload.data,
    processed: true
  };

  webhookLogs.push(log);

  // Simulate processing time
  const processingTime = Math.floor(Math.random() * 500) + 100;

  setTimeout(() => {
    res.json({
      success: true,
      message: 'Webhook processed successfully',
      webhookId,
      processingTime: `${processingTime}ms`,
      timestamp: new Date().toISOString()
    });
  }, processingTime);
});

// Generate webhook signature for testing
router.post('/generate-signature', (req, res) => {
  const payload = JSON.stringify(req.body);
  const secret = req.query.secret || 'demo-secret-key';

  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  res.json({
    signature,
    payload: req.body,
    secret: secret,
    instructions: {
      headerName: 'x-webhook-signature',
      headerValue: signature
    }
  });
});

// Get webhook logs
router.get('/logs', (req, res) => {
  res.json({
    totalProcessed: processedWebhooks.size,
    recentWebhooks: webhookLogs.slice(-20).reverse(),
    uniqueEvents: [...new Set(webhookLogs.map(log => log.event))]
  });
});

// Reset webhook data
router.post('/reset', (req, res) => {
  processedWebhooks.clear();
  webhookLogs.length = 0;
  res.json({ message: 'Webhook data reset successfully' });
});

module.exports = router;
