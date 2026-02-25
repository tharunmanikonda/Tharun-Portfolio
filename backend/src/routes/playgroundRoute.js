const express = require('express');
const router = express.Router();
const { getClient } = require('../utils/redis');

const mem = { cache: new Map(), rl: new Map() };

// ═══════════════════════════════════════════════════════════════════════════════
// ENGINEERING DEEP DIVE DEMOS
// ═══════════════════════════════════════════════════════════════════════════════

// ── 1. LIVE REQUEST JOURNEY ───────────────────────────────────────────────────
// POST /api/playground/journey
// Full stack trace: Rate Limiter → Cache → DB → Response with real timings

router.post('/journey', async (req, res) => {
  const { sessionId = 'demo' } = req.body;
  const redis = await getClient();
  const RL_KEY    = `journey:rl:${sessionId.slice(0, 32)}`;
  const CACHE_KEY = 'journey:cache';
  const RL_LIMIT  = 20;
  const RL_WINDOW = 60;
  const DB_DELAY  = 140;

  const layers = [];
  const t0 = Date.now();

  // Layer 1: Rate Limiter
  let t = Date.now();
  let rlPassed = true, rlRemaining = RL_LIMIT;
  if (redis) {
    try {
      const count = await redis.incr(RL_KEY);
      if (count === 1) await redis.expire(RL_KEY, RL_WINDOW);
      rlRemaining = Math.max(0, RL_LIMIT - count);
      rlPassed = count <= RL_LIMIT;
    } catch {}
  }
  layers.push({
    name: 'Rate Limiter', ms: Date.now() - t,
    passed: rlPassed,
    detail: rlPassed ? `${rlRemaining} req remaining in window` : '429 — blocked',
    color: '#06b6d4',
  });

  if (!rlPassed) {
    return res.json({ layers, blocked: true, totalMs: Date.now() - t0 });
  }

  // Layer 2: Cache
  t = Date.now();
  let cacheHit = false, data = null;
  if (redis) {
    try {
      const v = await redis.get(CACHE_KEY);
      if (v) { cacheHit = true; data = JSON.parse(v); }
    } catch {}
  }
  const cacheMs = Date.now() - t;
  layers.push({
    name: 'Cache Layer', ms: cacheMs,
    passed: true, hit: cacheHit,
    detail: cacheHit ? `HIT — DB skipped (saved ~${DB_DELAY}ms)` : 'MISS — forwarding to DB',
    color: '#8b5cf6',
  });

  // Layer 3: Database
  t = Date.now();
  if (!cacheHit) {
    await new Promise(r => setTimeout(r, DB_DELAY + Math.floor(Math.random() * 20)));
    data = { userId: 'usr_001', name: 'Tharun', role: 'Engineer', ts: new Date().toISOString() };
    if (redis) { try { await redis.setEx(CACHE_KEY, 30, JSON.stringify(data)); } catch {} }
  }
  layers.push({
    name: 'Database', ms: Date.now() - t,
    passed: true, skipped: cacheHit,
    detail: cacheHit ? 'Skipped — served from cache' : `Query executed in ${Date.now() - t}ms`,
    color: '#34d399',
  });

  // Layer 4: Response
  layers.push({ name: 'Response', ms: 1, passed: true, detail: 'Serialized + sent', color: '#f0abfc' });

  res.json({ layers, blocked: false, totalMs: Date.now() - t0, cacheHit });
});

// ── 2. ALGORITHM SHOWDOWN ─────────────────────────────────────────────────────
// POST /api/playground/algo  { algo: 'fixed' | 'sliding', sessionId }
// Fixed window: simple INCR per bucket
// Sliding window: Redis sorted set ZADD/ZREMRANGEBYSCORE — shows the real algorithm

router.post('/algo', async (req, res) => {
  const { algo = 'sliding', sessionId = 'demo' } = req.body;
  const redis = await getClient();
  const LIMIT = 5;
  const WINDOW = 15; // 15s — short enough to demo the burst problem
  const now = Date.now();

  if (algo === 'fixed') {
    const bucket = Math.floor(now / (WINDOW * 1000));
    const KEY = `algo:fixed:${sessionId.slice(0, 32)}:${bucket}`;
    const windowStart = bucket * WINDOW * 1000;
    const windowEnd   = windowStart + WINDOW * 1000;
    let count = 0;

    if (redis) {
      try {
        count = await redis.incr(KEY);
        if (count === 1) await redis.pExpireAt(KEY, windowEnd);
      } catch { count = 1; }
    } else {
      const e = mem.rl.get(KEY);
      if (!e || now > e.exp) { mem.rl.set(KEY, { c: 1, exp: windowEnd }); count = 1; }
      else { e.c++; count = e.c; }
    }

    return res.json({
      algo: 'fixed', allowed: count <= LIMIT, count, limit: LIMIT,
      windowStart, windowEnd, windowSeconds: WINDOW,
      resetIn: Math.ceil((windowEnd - now) / 1000),
      positionPct: Math.round(((now - windowStart) / (WINDOW * 1000)) * 100),
    });
  }

  // Sliding window — the "right" way
  const KEY = `algo:sliding:${sessionId.slice(0, 32)}`;
  const windowStart = now - WINDOW * 1000;
  let count = 0, timestamps = [];

  if (redis) {
    try {
      await redis.zRemRangeByScore(KEY, '-inf', windowStart.toString());
      await redis.zAdd(KEY, [{ score: now, value: `${now}-${Math.random().toString(36).slice(2, 7)}` }]);
      await redis.expire(KEY, WINDOW + 2);
      count = await redis.zCard(KEY);
      const members = await redis.zRangeWithScores(KEY, 0, -1);
      timestamps = members.map(m => ({
        ts: Number(m.score),
        ageMs: now - Number(m.score),
        pct: Math.round(((Number(m.score) - windowStart) / (WINDOW * 1000)) * 100),
      }));
    } catch { count = 1; timestamps = [{ ts: now, ageMs: 0, pct: 100 }]; }
  } else {
    timestamps = [{ ts: now, ageMs: 0, pct: 100 }];
    count = 1;
  }

  return res.json({
    algo: 'sliding', allowed: count <= LIMIT, count, limit: LIMIT,
    timestamps, windowSeconds: WINDOW, windowStart, now,
  });
});

// ── 3. CIRCUIT BREAKER STATE MACHINE ─────────────────────────────────────────
// States: CLOSED → (N failures) → OPEN → (timeout) → HALF_OPEN → (1 success) → CLOSED
// GET  /api/playground/circuit/state
// POST /api/playground/circuit/call
// POST /api/playground/circuit/toggle-downstream
// POST /api/playground/circuit/reset

const CB = {
  STATE: 'cb:state', FAILURES: 'cb:failures',
  OPENED_AT: 'cb:opened_at', DOWNSTREAM: 'cb:downstream',
};
const CB_THRESHOLD   = 3;
const CB_TIMEOUT_MS  = 15000; // 15s until OPEN → HALF_OPEN

async function getCBState(redis) {
  if (!redis) return { status: 'CLOSED', failures: 0, openedAt: null, downstreamFailing: false, timeUntilHalfOpen: null };
  const [s, f, oa, d] = await Promise.all([
    redis.get(CB.STATE), redis.get(CB.FAILURES), redis.get(CB.OPENED_AT), redis.get(CB.DOWNSTREAM),
  ]);
  let status = s || 'CLOSED';
  const openedAt = oa ? parseInt(oa) : null;
  let timeUntilHalfOpen = null;

  if (status === 'OPEN' && openedAt) {
    const elapsed = Date.now() - openedAt;
    if (elapsed >= CB_TIMEOUT_MS) {
      status = 'HALF_OPEN';
      await redis.set(CB.STATE, 'HALF_OPEN');
    } else {
      timeUntilHalfOpen = Math.ceil((CB_TIMEOUT_MS - elapsed) / 1000);
    }
  }

  return { status, failures: parseInt(f || '0'), openedAt, downstreamFailing: d === '1', timeUntilHalfOpen };
}

router.get('/circuit/state', async (req, res) => {
  res.json(await getCBState(await getClient()));
});

router.post('/circuit/toggle-downstream', async (req, res) => {
  const redis = await getClient();
  if (!redis) return res.json({ error: 'Redis required' });
  const cur = await redis.get(CB.DOWNSTREAM);
  const next = cur === '1' ? '0' : '1';
  await redis.set(CB.DOWNSTREAM, next);
  res.json({ downstreamFailing: next === '1' });
});

router.post('/circuit/call', async (req, res) => {
  const redis = await getClient();
  const state = await getCBState(redis);

  // OPEN: short-circuit — don't even touch downstream
  if (state.status === 'OPEN') {
    return res.json({
      outcome: 'rejected', state,
      reason: 'Circuit OPEN — request short-circuited, downstream protected',
    });
  }

  const latency = 50 + Math.floor(Math.random() * 60);
  await new Promise(r => setTimeout(r, latency));
  const success = !state.downstreamFailing;

  if (success) {
    if (redis) {
      await Promise.all([
        redis.set(CB.STATE, 'CLOSED'),
        redis.set(CB.FAILURES, '0'),
        redis.del(CB.OPENED_AT),
      ]).catch(() => {});
    }
    return res.json({ outcome: 'success', latencyMs: latency, state: { ...state, status: 'CLOSED', failures: 0 } });
  }

  // Failure
  let newFailures = state.failures + 1;
  let newStatus = state.status;
  if (redis) {
    await redis.incr(CB.FAILURES).catch(() => {});
    if (state.status === 'HALF_OPEN' || newFailures >= CB_THRESHOLD) {
      newStatus = 'OPEN';
      await redis.set(CB.STATE, 'OPEN').catch(() => {});
      if (state.status !== 'OPEN') await redis.set(CB.OPENED_AT, Date.now().toString()).catch(() => {});
    }
  }

  return res.json({
    outcome: 'failure', reason: 'Downstream service error',
    tripped: newStatus === 'OPEN' && state.status !== 'OPEN',
    state: { ...state, status: newStatus, failures: newFailures },
  });
});

router.post('/circuit/reset', async (req, res) => {
  const redis = await getClient();
  if (redis) {
    await Promise.all([
      redis.del(CB.STATE), redis.del(CB.FAILURES),
      redis.del(CB.OPENED_AT), redis.set(CB.DOWNSTREAM, '0'),
    ]).catch(() => {});
  }
  res.json({ reset: true });
});

// ── 4. CACHE CONSISTENCY ──────────────────────────────────────────────────────
// Strategy: 'cache-aside' (lazy) vs 'write-through' (eager)
// POST /api/playground/consistency/write  { value, strategy }
// GET  /api/playground/consistency/read
// POST /api/playground/consistency/reset

router.post('/consistency/write', async (req, res) => {
  const { value = 'new_value', strategy = 'cache-aside' } = req.body;
  const redis = await getClient();
  const ts = Date.now();
  const record = JSON.stringify({ value, ts });

  if (redis) {
    await redis.set('cons:db', record).catch(() => {});
    if (strategy === 'write-through') {
      await redis.setEx('cons:cache', 60, record).catch(() => {});
    }
    // cache-aside intentionally does NOT update cache — that's the point
  }

  res.json({
    strategy, value, ts,
    dbUpdated: true,
    cacheUpdated: strategy === 'write-through',
    staleRisk: strategy === 'cache-aside',
  });
});

router.get('/consistency/read', async (req, res) => {
  const redis = await getClient();
  if (!redis) return res.json({ source: 'none', value: null, stale: false });

  const [cachedRaw, dbRaw] = await Promise.all([
    redis.get('cons:cache').catch(() => null),
    redis.get('cons:db').catch(() => null),
  ]);

  const db = dbRaw ? JSON.parse(dbRaw) : null;

  if (cachedRaw) {
    const cached = JSON.parse(cachedRaw);
    const stale = db ? db.ts > cached.ts : false;
    return res.json({ source: 'cache', value: cached.value, ts: cached.ts, stale, dbValue: db?.value });
  }

  if (db) {
    // cache-aside: populate on miss
    await redis.setEx('cons:cache', 60, dbRaw).catch(() => {});
    return res.json({ source: 'db', value: db.value, ts: db.ts, stale: false, populated: true });
  }

  res.json({ source: 'empty', value: null, stale: false });
});

router.post('/consistency/reset', async (req, res) => {
  const redis = await getClient();
  if (redis) await Promise.all([redis.del('cons:db'), redis.del('cons:cache')]).catch(() => {});
  res.json({ reset: true });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ORIGINAL DEMOS (kept)
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/health', async (req, res) => {
  const redis = await getClient();
  const start = Date.now();
  let redisPingMs = null, redisStatus = 'not_configured';
  if (redis) {
    try { await redis.ping(); redisPingMs = Date.now() - start; redisStatus = 'connected'; await redis.incr('portfolio:requests'); }
    catch { redisStatus = 'error'; }
  }
  let requestCount = 0;
  if (redis) { try { requestCount = parseInt(await redis.get('portfolio:requests') || '0', 10); } catch {} }
  res.json({ api: { status: 'online', uptimeSeconds: Math.floor(process.uptime()) }, redis: { status: redisStatus, pingMs: redisPingMs }, requestCount });
});

router.get('/cache', async (req, res) => {
  const CACHE_KEY = 'demo:user_profile', CACHE_TTL = 30, FAKE_DB_DELAY = 160;
  const redis = await getClient();
  const bust = req.query.bust === '1';
  const fetchStart = Date.now();
  if (!bust) {
    let cached = redis ? await redis.get(CACHE_KEY).catch(() => null) : mem.cache.get(CACHE_KEY);
    if (cached) {
      const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
      return res.json({ source: 'cache', latencyMs: Date.now() - fetchStart, ttlRemaining: redis ? await redis.ttl(CACHE_KEY).catch(() => null) : null, data });
    }
  } else {
    if (redis) { try { await redis.del(CACHE_KEY); } catch {} } else mem.cache.delete(CACHE_KEY);
  }
  await new Promise(r => setTimeout(r, FAKE_DB_DELAY));
  const profile = { id: 'usr_tharun_001', name: 'Tharun Manikonda', role: 'Full Stack Developer', skills: ['React','Node.js','Redis','Docker'], fetchedAt: new Date().toISOString() };
  const serialized = JSON.stringify(profile);
  if (redis) { try { await redis.setEx(CACHE_KEY, CACHE_TTL, serialized); } catch {} }
  else { mem.cache.set(CACHE_KEY, serialized); setTimeout(() => mem.cache.delete(CACHE_KEY), CACHE_TTL * 1000); }
  res.json({ source: 'db', latencyMs: Date.now() - fetchStart, ttlRemaining: CACHE_TTL, data: profile });
});

router.post('/ratelimit', async (req, res) => {
  const { sessionId = 'anonymous' } = req.body;
  const KEY = `ratelimit:demo:${sessionId.slice(0, 32)}`, LIMIT = 5, WINDOW = 30;
  const redis = await getClient();
  let count = 0, ttl = WINDOW;
  if (redis) {
    try { count = await redis.incr(KEY); if (count === 1) await redis.expire(KEY, WINDOW); ttl = await redis.ttl(KEY); }
    catch { count = 1; }
  } else {
    const e = mem.rl.get(KEY), now = Date.now();
    if (!e || now > e.exp) { mem.rl.set(KEY, { c: 1, exp: now + WINDOW * 1000 }); count = 1; ttl = WINDOW; }
    else { e.c++; count = e.c; ttl = Math.ceil((e.exp - now) / 1000); }
  }
  const allowed = count <= LIMIT;
  res.status(allowed ? 200 : 429).json({ allowed, count, remaining: Math.max(0, LIMIT - count), limit: LIMIT, windowSeconds: WINDOW, resetInSeconds: ttl, message: allowed ? `Request ${count}/${LIMIT} allowed` : `Rate limit exceeded. Resets in ${ttl}s` });
});

router.get('/cache/stats', async (req, res) => {
  const redis = await getClient();
  if (!redis) return res.json({ hits: 0, misses: 0, ratio: 0, redisConfigured: false });
  try {
    const [hits, misses] = await Promise.all([redis.get('demo:cache:hits').then(v => parseInt(v||'0',10)), redis.get('demo:cache:misses').then(v => parseInt(v||'0',10))]);
    const total = hits + misses;
    res.json({ hits, misses, ratio: total ? Math.round((hits/total)*100) : 0, redisConfigured: true });
  } catch { res.json({ hits: 0, misses: 0, ratio: 0, redisConfigured: true }); }
});

module.exports = router;
