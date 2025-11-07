const express = require('express');
const crypto = require('crypto');
const router = express.Router();

// Simple JWT implementation for demo purposes
class SimpleJWT {
  constructor(secret = 'demo-secret-key-2024') {
    this.secret = secret;
  }

  base64UrlEncode(str) {
    return Buffer.from(str)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  base64UrlDecode(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(str, 'base64').toString();
  }

  sign(payload, expiresIn = 3600) {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const tokenPayload = {
      ...payload,
      iat: now,
      exp: now + expiresIn
    };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(tokenPayload));

    const signature = crypto
      .createHmac('sha256', this.secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  verify(token) {
    try {
      const [encodedHeader, encodedPayload, signature] = token.split('.');

      // Verify signature
      const expectedSignature = crypto
        .createHmac('sha256', this.secret)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

      if (signature !== expectedSignature) {
        return { valid: false, error: 'Invalid signature' };
      }

      const payload = JSON.parse(this.base64UrlDecode(encodedPayload));

      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        return {
          valid: false,
          error: 'Token expired',
          payload,
          expiredAt: new Date(payload.exp * 1000).toISOString()
        };
      }

      return { valid: true, payload };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  decode(token) {
    const [, encodedPayload] = token.split('.');
    return JSON.parse(this.base64UrlDecode(encodedPayload));
  }
}

const jwt = new SimpleJWT();

// Mock users database
const users = [
  { id: 1, username: 'demo', password: 'password123', role: 'admin' },
  { id: 2, username: 'user', password: 'user123', role: 'user' }
];

// Refresh tokens store
const refreshTokens = new Map();

// Login endpoint
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Find user
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({
      error: 'Invalid credentials',
      message: 'Username or password is incorrect'
    });
  }

  // Generate access token (short-lived: 15 minutes)
  const accessToken = jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    900 // 15 minutes
  );

  // Generate refresh token (long-lived: 7 days)
  const refreshToken = jwt.sign(
    { userId: user.id, type: 'refresh' },
    604800 // 7 days
  );

  // Store refresh token
  refreshTokens.set(refreshToken, {
    userId: user.id,
    createdAt: new Date().toISOString()
  });

  res.json({
    success: true,
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    },
    tokenInfo: {
      accessTokenExpiry: '15 minutes',
      refreshTokenExpiry: '7 days'
    }
  });
});

// Verify token endpoint
router.post('/verify', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      error: 'No token provided',
      message: 'Authorization header is required'
    });
  }

  const result = jwt.verify(token);

  if (!result.valid) {
    return res.status(401).json({
      valid: false,
      error: result.error,
      expiredAt: result.expiredAt
    });
  }

  res.json({
    valid: true,
    payload: result.payload,
    timeRemaining: `${Math.floor((result.payload.exp - Date.now() / 1000) / 60)} minutes`
  });
});

// Refresh token endpoint
router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      error: 'Refresh token required'
    });
  }

  // Verify refresh token
  const result = jwt.verify(refreshToken);

  if (!result.valid || !refreshTokens.has(refreshToken)) {
    return res.status(401).json({
      error: 'Invalid or expired refresh token'
    });
  }

  const tokenData = refreshTokens.get(refreshToken);

  // Generate new access token
  const user = users.find(u => u.id === tokenData.userId);
  const newAccessToken = jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    900 // 15 minutes
  );

  res.json({
    success: true,
    accessToken: newAccessToken,
    tokenInfo: {
      accessTokenExpiry: '15 minutes'
    }
  });
});

// Decode token (without verification) - for demo purposes
router.post('/decode', (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      error: 'Token required'
    });
  }

  try {
    const decoded = jwt.decode(token);
    const [header, payload, signature] = token.split('.');

    res.json({
      token: {
        header: JSON.parse(jwt.base64UrlDecode(header)),
        payload: decoded,
        signature: signature.substring(0, 20) + '...'
      },
      visualization: {
        structure: 'header.payload.signature',
        parts: {
          header: header.substring(0, 20) + '...',
          payload: payload.substring(0, 20) + '...',
          signature: signature.substring(0, 20) + '...'
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      error: 'Invalid token format',
      message: error.message
    });
  }
});

// Protected route example
router.get('/protected', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please provide a valid access token'
    });
  }

  const result = jwt.verify(token);

  if (!result.valid) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: result.error
    });
  }

  res.json({
    message: 'Access granted to protected resource!',
    user: result.payload,
    accessedAt: new Date().toISOString()
  });
});

module.exports = router;
