# Tharun Manikonda - Interactive Portfolio

A modern, interactive portfolio showcasing full-stack development skills through live backend engineering demonstrations.

## What's New - 2025 Upgrade

### Modern Design Enhancements
✨ **Cursor Glow Effect** - Interactive spotlight follows mouse movement  
🎨 **Glassmorphism UI** - Frosted glass effects on cards and sections  
⚡ **Neon Accents** - Vibrant borders and hover animations  
🚀 **Smooth Animations** - Professional slide-in, fade, and scale effects  

### Interactive Skills Playground
8 live backend engineering demonstrations showing real production challenges:

1. **API Retry Logic** - Exponential backoff + jitter
2. **Webhook Handler** - Signature verification + idempotency
3. **DB Query Optimization** - N+1 problem visualization
4. **Rate Limiting** - Sliding window algorithm
5. **Caching Strategy** - Hit/miss visualization with TTL
6. **JWT Authentication** - Token lifecycle management
7. **CI/CD Dashboard** - Live GitHub Actions monitoring
8. **File Upload** - Chunked upload with error recovery

## Tech Stack

**Frontend:** React 19, TypeScript, Tailwind CSS, Lucide Icons  
**Backend:** Node.js, Express.js, In-memory storage  
**Deployment:** GitHub Pages + Railway.app (all free tier!)

## Quick Start

```bash
# Install dependencies
npm install --legacy-peer-deps
cd backend && npm install && cd ..

# Start frontend (port 4000)
npm start

# Start backend (port 5001) - in another terminal
cd backend && npm start
```

Visit [http://localhost:4000](http://localhost:4000)

## API Demo Examples

```bash
# Test API Retry Logic
curl "http://localhost:5001/api/demo/retry/unreliable-api"

# Test Rate Limiter (make 15 requests)
for i in {1..15}; do curl "http://localhost:5001/api/demo/rate-limit/test?user=demo"; done

# Test Caching (first slow, second fast)
curl http://localhost:5001/api/demo/cache/with-cache

# Login & Get JWT
curl -X POST http://localhost:5001/api/demo/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "demo", "password": "password123"}'
```

## Project Structure

```
tharun-portfolio/
├── src/
│   ├── App.tsx           # Main component with all demos
│   └── index.tsx
├── backend/
│   ├── src/
│   │   ├── server.js     # Express server
│   │   └── routes/       # All demo endpoints
│   └── README.md         # Backend documentation
└── README.md
```

## What Makes This Portfolio Stand Out

✅ **Live Demos** - Interactive backend engineering challenges, not just descriptions  
✅ **Production-Ready** - Real patterns used in enterprise applications  
✅ **Cost-Effective** - Built entirely on free-tier services  
✅ **Modern UX** - 2025 design trends (glassmorphism, cursor glow, neon accents)  
✅ **Well-Documented** - Comprehensive README and code comments  
✅ **Realistic** - Demonstrates 3 YOE problem-solving approach  

## Skills Demonstrated

**Backend Engineering:**
- API resilience (retry logic, circuit breakers)
- Security (JWT, HMAC signatures, idempotency)
- Performance (caching, query optimization, rate limiting)
- Distributed systems (webhooks, async processing)

**Frontend Development:**
- Modern React with hooks
- TypeScript for type safety
- Responsive design with Tailwind
- Smooth animations and UX

**DevOps & Architecture:**
- RESTful API design
- Separation of concerns
- Error handling & logging
- Free-tier cloud deployment

## Deployment

**Frontend (GitHub Pages):**
```bash
npm run build
# Deploy build folder
```

**Backend (Railway.app / Render.com):**
1. Connect GitHub repository
2. Set root directory to `backend`
3. Add environment variables
4. Auto-deploy on push

## Contact

📧 tharun.manikonda1@outlook.com  
📱 (205) 259-8634  
📍 California, USA  

---

**Built with ❤️ showcasing 3+ years of full-stack engineering experience**

*From McKinsey & Uber to you - real-world solutions, modern design, production-ready code*
