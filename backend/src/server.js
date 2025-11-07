const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const retryRoutes = require('./routes/retryRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const webhookProxyRoutes = require('./routes/webhookProxyRoutes');
const dbRoutes = require('./routes/dbRoutes');
const rateLimitRoutes = require('./routes/rateLimitRoutes');
const cacheRoutes = require('./routes/cacheRoutes');
const authRoutes = require('./routes/authRoutes');
const videoUploadRoutes = require('./routes/videoUploadRoutes');

// Use routes
app.use('/api/demo/retry', retryRoutes);
app.use('/api/demo/webhook', webhookRoutes);
app.use('/api/demo/webhook-proxy', webhookProxyRoutes);
app.use('/api/demo/database', dbRoutes);
app.use('/api/demo/rate-limit', rateLimitRoutes);
app.use('/api/demo/cache', cacheRoutes);
app.use('/api/demo/auth', authRoutes);
app.use('/api/demo/video', videoUploadRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Portfolio Backend API',
    version: '1.0.0',
    endpoints: {
      retry: '/api/demo/retry',
      webhook: '/api/demo/webhook',
      database: '/api/demo/database',
      rateLimit: '/api/demo/rate-limit',
      cache: '/api/demo/cache',
      auth: '/api/demo/auth'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Portfolio Backend API running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
