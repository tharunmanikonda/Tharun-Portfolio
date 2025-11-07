# Portfolio Backend API

Backend API for interactive skill demonstrations showcasing real-world engineering challenges.

## Features

- **API Retry Logic**: Exponential backoff with jitter
- **Webhook Handler**: Signature verification and idempotency
- **Database Optimization**: N+1 query problem demonstration
- **Rate Limiting**: Sliding window rate limiter
- **Caching Strategy**: In-memory cache with TTL
- **JWT Authentication**: Token generation and verification

## Installation

```bash
cd backend
npm install
```

## Running the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Retry Logic Demo
- `GET /api/demo/retry/unreliable-api` - Simulated unreliable API
- `GET /api/demo/retry/stats` - Retry statistics
- `POST /api/demo/retry/reset` - Reset stats

### Webhook Handler
- `POST /api/demo/webhook/receive` - Receive webhooks
- `POST /api/demo/webhook/generate-signature` - Generate webhook signature
- `GET /api/demo/webhook/logs` - View webhook logs

### Database Optimization
- `GET /api/demo/database/n-plus-one/inefficient` - N+1 problem demo
- `GET /api/demo/database/n-plus-one/optimized` - Optimized query demo
- `GET /api/demo/database/index-comparison` - Index performance comparison
- `GET /api/demo/database/aggregation` - MongoDB aggregation pipeline

### Rate Limiting
- `GET /api/demo/rate-limit/test` - Test rate limiting
- `GET /api/demo/rate-limit/status` - Check rate limit status
- `POST /api/demo/rate-limit/reset` - Reset rate limit

### Caching
- `GET /api/demo/cache/with-cache` - Cached endpoint
- `GET /api/demo/cache/without-cache` - Non-cached endpoint
- `GET /api/demo/cache/stats` - Cache statistics

### JWT Authentication
- `POST /api/demo/auth/login` - Login and get tokens
- `POST /api/demo/auth/verify` - Verify access token
- `POST /api/demo/auth/refresh` - Refresh access token
- `POST /api/demo/auth/decode` - Decode JWT (demo only)
- `GET /api/demo/auth/protected` - Protected resource

## Demo Credentials

```json
{
  "username": "demo",
  "password": "password123"
}
```

## Tech Stack

- Node.js
- Express.js
- In-memory storage (no database required for demos)
- Native crypto for JWT and webhooks

## Deployment

### Railway.app (Free Tier)

1. Push code to GitHub
2. Connect Railway to your repository
3. Deploy automatically on push

### Render.com (Free Tier)

1. Create new Web Service
2. Connect GitHub repository
3. Set build command: `npm install`
4. Set start command: `npm start`

## Environment Variables

See `.env.example` for required environment variables.

## License

MIT
