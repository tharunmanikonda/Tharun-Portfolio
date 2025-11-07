const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// Proxy webhook to external URL (avoids CORS issues)
router.post('/send', async (req, res) => {
  const { webhookUrl, payload } = req.body;

  if (!webhookUrl) {
    return res.status(400).json({ error: 'webhookUrl is required' });
  }

  const startTime = Date.now();

  try {
    // Generate HMAC signature
    const secret = 'demo-secret-key-2024';
    const payloadString = JSON.stringify(payload);
    const signature = crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');

    // Make request to external webhook URL
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Tharun-Portfolio-Webhook/1.0',
        'X-Webhook-Signature': signature,
        'X-Webhook-Id': payload.id,
        'X-Event-Type': payload.event,
        'X-Timestamp': payload.timestamp
      },
      body: payloadString
    });

    const responseTime = Date.now() - startTime;
    const contentType = response.headers.get('content-type');

    // Try to parse response body
    let responseBody = '';
    try {
      if (contentType?.includes('application/json')) {
        responseBody = await response.json();
      } else {
        responseBody = await response.text();
      }
    } catch (e) {
      responseBody = null;
    }

    res.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      responseTime: `${responseTime}ms`,
      webhookId: payload.id,
      signature: signature.substring(0, 20) + '...',
      fullSignature: signature,
      headers: {
        'content-type': contentType,
        'content-length': response.headers.get('content-length'),
        'server': response.headers.get('server')
      },
      responseBody
    });
  } catch (error) {
    res.status(500).json({
      error: true,
      message: error.message,
      hint: 'Failed to send webhook. Check if the URL is valid.'
    });
  }
});

module.exports = router;
