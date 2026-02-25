import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, AlertTriangle, Zap, Shield, Database, Activity } from 'lucide-react';

const API = '/api/playground';
const CHAT_API = '/api/chat';

function useVisible(threshold = 0.05) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    obs.observe(el); return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible] as const;
}

// ── HELPERS ──────────────────────────────────────────────────────────────────

function Badge({ children, color = '#8b5cf6' }: { children: React.ReactNode; color?: string }) {
  return (
    <span className="text-[0.6rem] font-mono px-1.5 py-0.5 rounded" style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>
      {children}
    </span>
  );
}

function Panel({ title, badges, children }: { title: string; badges?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-sm font-bold text-slate-100 font-mono">{title}</span>
        <div className="flex gap-1.5 flex-wrap">{badges}</div>
      </div>
      {children}
    </div>
  );
}

// ── DEMO 1: REQUEST JOURNEY ───────────────────────────────────────────────────

const NODES = [
  { id: 'client',  label: 'Client',       icon: '⬡', color: '#64748b' },
  { id: 'rl',      label: 'Rate Limiter', icon: '⚡', color: '#06b6d4' },
  { id: 'cache',   label: 'Cache',        icon: '◈', color: '#8b5cf6' },
  { id: 'db',      label: 'Database',     icon: '⊞', color: '#34d399' },
  { id: 'resp',    label: 'Response',     icon: '✓', color: '#f0abfc' },
];

function JourneyDemo() {
  const [status, setStatus] = useState<'idle' | 'running' | 'done'>('idle');
  const [activeNode, setActiveNode] = useState(-1);
  const [result, setResult] = useState<any>(null);
  const [stats, setStats] = useState({ total: 0, hits: 0, dbQ: 0, msSaved: 0 });

  const send = async () => {
    if (status === 'running') return;
    setStatus('running'); setActiveNode(0); setResult(null);
    try {
      const r = await fetch(`${API}/journey`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: 'demo' }) });
      const data = await r.json();
      for (let i = 1; i <= NODES.length - 1; i++) {
        await new Promise(r => setTimeout(r, 280));
        setActiveNode(i);
      }
      await new Promise(r => setTimeout(r, 200));
      setResult(data);
      setStats(p => ({ total: p.total + 1, hits: p.hits + (data.cacheHit ? 1 : 0), dbQ: p.dbQ + (data.cacheHit ? 0 : 1), msSaved: p.msSaved + (data.cacheHit ? 140 : 0) }));
      setStatus('done');
    } catch { setStatus('idle'); }
  };

  const getNodeStyle = (i: number) => {
    if (i === 0) return { border: 'rgba(100,116,139,0.3)', bg: 'rgba(100,116,139,0.08)', glow: 'none' };
    const layer = result?.layers?.[i - 1];
    const color = NODES[i].color;
    if (activeNode === i) return { border: `${color}80`, bg: `${color}18`, glow: `0 0 20px ${color}40` };
    if (layer?.skipped) return { border: 'rgba(55,65,81,0.5)', bg: 'rgba(55,65,81,0.15)', glow: 'none' };
    if (layer?.hit) return { border: '#22c55e50', bg: '#22c55e12', glow: '0 0 10px #22c55e25' };
    if (result) return { border: `${color}35`, bg: `${color}10`, glow: 'none' };
    return { border: 'rgba(100,100,140,0.2)', bg: 'rgba(15,17,40,0.6)', glow: 'none' };
  };

  const getLineColor = (i: number) => activeNode > i + 1 ? NODES[i + 1].color : 'rgba(100,100,140,0.25)';

  return (
    <Panel title="Live Request Journey"
      badges={<><Badge color="#06b6d4">Rate Limiting</Badge><Badge color="#8b5cf6">Caching</Badge><Badge color="#34d399">DB Query</Badge></>}>

      {/* Flow diagram */}
      <div className="flex items-start gap-1 py-2">
        {NODES.map((node, i) => {
          const s = getNodeStyle(i);
          const layer = result?.layers?.[i - 1];
          return (
            <React.Fragment key={node.id}>
              <div className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full py-2.5 px-1 rounded-xl text-center transition-all duration-300"
                  style={{ background: s.bg, border: `1px solid ${s.border}`, boxShadow: s.glow, transform: activeNode === i ? 'scale(1.06)' : 'scale(1)' }}>
                  <div className="text-base mb-0.5 leading-none" style={{ color: s.glow !== 'none' ? NODES[i].color : '#64748b' }}>{node.icon}</div>
                  <div className="text-[0.55rem] font-mono text-slate-400 leading-tight">{node.label}</div>
                  {layer && (
                    <div className="text-[0.5rem] font-mono mt-0.5 leading-tight"
                      style={{ color: layer.skipped ? '#374151' : layer.hit ? '#22c55e' : layer.passed === false ? '#ef4444' : NODES[i].color }}>
                      {layer.skipped ? 'skipped' : `${layer.ms}ms`}
                    </div>
                  )}
                </div>
              </div>
              {i < NODES.length - 1 && (
                <div className="shrink-0 w-3 h-px mt-7 transition-all duration-400"
                  style={{ background: getLineColor(i), boxShadow: activeNode > i + 1 ? `0 0 6px ${NODES[i + 1].color}60` : 'none' }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Layer detail log */}
      {result && (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(139,92,246,0.12)' }}>
          {result.layers.map((l: any, i: number) => (
            <div key={i} className="flex items-center justify-between px-3 py-2 text-xs font-mono"
              style={{ background: i % 2 === 0 ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.15)', borderTop: i > 0 ? '1px solid rgba(139,92,246,0.06)' : 'none' }}>
              <span className="text-slate-500 flex items-center gap-1.5">
                <span style={{ color: NODES[i + 1]?.color }}>{NODES[i + 1]?.icon}</span>
                {l.name}
              </span>
              <span style={{ color: l.skipped ? '#374151' : l.hit ? '#22c55e' : l.passed === false ? '#ef4444' : '#94a3b8' }}>{l.detail}</span>
            </div>
          ))}
          <div className="flex justify-between px-3 py-2 text-xs font-mono" style={{ background: 'rgba(139,92,246,0.08)', borderTop: '1px solid rgba(139,92,246,0.15)' }}>
            <span className="text-violet-400">Total round-trip</span>
            <span className="text-violet-300 font-bold">{result.totalMs}ms</span>
          </div>
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-2">
        {[{ l: 'Requests', v: stats.total, c: '#8b5cf6' }, { l: 'Cache Hits', v: stats.hits, c: '#22c55e' }, { l: 'DB Queries', v: stats.dbQ, c: '#06b6d4' }, { l: 'ms Saved', v: stats.msSaved, c: '#f59e0b' }].map(s => (
          <div key={s.l} className="rounded-xl p-2 text-center" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(139,92,246,0.1)' }}>
            <div className="text-xl font-bold font-mono" style={{ color: s.c }}>{s.v}</div>
            <div className="text-[0.5rem] text-slate-600 font-mono mt-0.5">{s.l}</div>
          </div>
        ))}
      </div>

      <button onClick={send} disabled={status === 'running'}
        className="w-full py-3 rounded-xl font-mono text-sm font-semibold transition-all duration-200 disabled:opacity-50 hover:scale-[1.01]"
        style={{ background: 'linear-gradient(135deg, #7c3aed, #0891b2)', color: 'white' }}>
        {status === 'running' ? '→  routing request through stack...' : '$ send_request()  →  trace full journey'}
      </button>
    </Panel>
  );
}

// ── DEMO 2: ALGORITHM SHOWDOWN ────────────────────────────────────────────────

function AlgoPanel({ algo, sessionId }: { algo: 'fixed' | 'sliding'; sessionId: string }) {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ allowed: boolean; ts: number }[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [tick, setTick] = useState(0);

  // Tick every 500ms to animate the sliding window
  useEffect(() => {
    timerRef.current = setInterval(() => setTick(t => t + 1), 500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const fire = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/algo`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ algo, sessionId }) });
      const data = await r.json();
      setResult(data);
      setHistory(h => [...h.slice(-12), { allowed: data.allowed, ts: Date.now() }]);
    } catch {}
    setLoading(false);
  }, [algo, sessionId]);

  const isFixed = algo === 'fixed';
  const color = isFixed ? '#f59e0b' : '#8b5cf6';
  const now = Date.now();

  return (
    <div className="flex-1 rounded-2xl p-4 space-y-3" style={{ background: 'rgba(0,0,0,0.35)', border: `1px solid ${color}20` }}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-bold font-mono" style={{ color }}>{isFixed ? 'Fixed Window' : 'Sliding Window'}</div>
          <div className="text-[0.55rem] text-slate-600 font-mono mt-0.5">
            {isFixed ? 'Simple — but vulnerable to edge bursts' : 'ZADD/ZREMRANGEBYSCORE — precise & fair'}
          </div>
        </div>
        {result && (
          <div className="text-right">
            <div className="text-xs font-bold font-mono" style={{ color: result.allowed ? '#22c55e' : '#ef4444' }}>
              {result.allowed ? 'ALLOWED' : 'BLOCKED'}
            </div>
            <div className="text-[0.5rem] text-slate-500 font-mono">{result.count}/{result.limit} req</div>
          </div>
        )}
      </div>

      {/* Visualization */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid ${color}18`, minHeight: 64 }}>
        {isFixed ? (
          <div className="p-3">
            <div className="flex items-center justify-between text-[0.5rem] text-slate-600 font-mono mb-1.5">
              <span>window start</span>
              <span>{result ? `${result.resetIn}s remaining` : '15s window'}</span>
              <span>window end</span>
            </div>
            {/* Window progress bar */}
            <div className="h-6 rounded-lg overflow-hidden relative" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <div className="h-full transition-all duration-500 rounded-lg" style={{ width: `${result?.positionPct ?? 0}%`, background: 'linear-gradient(90deg, rgba(245,158,11,0.3), rgba(245,158,11,0.1))' }} />
              {/* Request dots */}
              {history.filter(h => result && h.ts >= result.windowStart).map((h, i) => (
                <div key={i} className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full transition-all duration-300"
                  style={{ left: `${result ? Math.min(95, ((h.ts - result.windowStart) / ((result.windowEnd - result.windowStart))) * 100) : 50}%`, background: h.allowed ? '#22c55e' : '#ef4444' }} />
              ))}
            </div>
            <div className="text-[0.48rem] text-slate-700 font-mono mt-1.5 text-center">
              ⚠ Burst attack: 5 req at t=14s + 5 req at t=0s (new window) = 10 req/s but both windows allow it
            </div>
          </div>
        ) : (
          <div className="p-3">
            <div className="flex items-center justify-between text-[0.5rem] text-slate-600 font-mono mb-1.5">
              <span>15s ago</span>
              <span>sliding window ({result?.count ?? 0}/{result?.limit ?? 5} requests)</span>
              <span>now</span>
            </div>
            {/* Timeline */}
            <div className="h-6 rounded-lg relative" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
              {result?.timestamps?.map((ts: any, i: number) => {
                const pct = Math.max(2, Math.min(97, 100 - (ts.ageMs / (result.windowSeconds * 1000)) * 100));
                const opacity = pct / 100;
                return (
                  <div key={i} className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full transition-all duration-300"
                    style={{ left: `${pct}%`, transform: 'translate(-50%, -50%)', background: '#8b5cf6', opacity: 0.4 + opacity * 0.6, boxShadow: pct > 80 ? '0 0 6px #8b5cf6' : 'none' }} />
                );
              })}
            </div>
            <div className="text-[0.48rem] text-slate-700 font-mono mt-1.5 text-center">
              ✓ Dots age out of the window smoothly — no burst vulnerability at boundaries
            </div>
          </div>
        )}
      </div>

      {/* History dots */}
      <div className="flex gap-1">
        {Array.from({ length: 12 }).map((_, i) => {
          const h = history[history.length - 12 + i];
          return <div key={i} className="flex-1 h-1.5 rounded-full transition-all duration-300"
            style={{ background: h ? (h.allowed ? '#22c55e' : '#ef4444') : 'rgba(100,100,140,0.15)' }} />;
        })}
      </div>

      <button onClick={fire} disabled={loading}
        className="w-full py-2 rounded-xl font-mono text-xs font-semibold transition-all duration-200 disabled:opacity-50"
        style={{ background: `${color}20`, border: `1px solid ${color}35`, color }}>
        {loading ? 'firing...' : `fire_request() [${result?.count ?? 0}/${result?.limit ?? 5}]`}
      </button>
    </div>
  );
}

function AlgorithmDemo() {
  const sessionId = useRef(`algo-${Math.random().toString(36).slice(2, 8)}`).current;
  return (
    <Panel title="Rate Limit Algorithm Showdown"
      badges={<><Badge color="#f59e0b">Fixed Window</Badge><Badge color="#8b5cf6">Sliding Window</Badge><Badge color="#06b6d4">Redis ZADD</Badge></>}>
      <p className="text-[0.65rem] text-slate-500 font-mono leading-relaxed">
        Both enforce 5 req / 15s. Fire rapidly near a Fixed Window boundary to expose the burst vulnerability.
        Sliding Window uses Redis sorted sets — no edge-case exploit possible.
      </p>
      <div className="flex gap-3 flex-col sm:flex-row">
        <AlgoPanel algo="fixed"   sessionId={sessionId + '-f'} />
        <AlgoPanel algo="sliding" sessionId={sessionId + '-s'} />
      </div>
    </Panel>
  );
}

// ── DEMO 3: CIRCUIT BREAKER ───────────────────────────────────────────────────

type CBStatus = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CBState {
  status: CBStatus;
  failures: number;
  downstreamFailing: boolean;
  timeUntilHalfOpen: number | null;
}

const CB_STATES: { id: CBStatus; desc: string; color: string }[] = [
  { id: 'CLOSED',    desc: 'Healthy — requests pass through',           color: '#22c55e' },
  { id: 'OPEN',      desc: 'Tripped — requests short-circuited',        color: '#ef4444' },
  { id: 'HALF_OPEN', desc: 'Probing — one request allowed through',     color: '#f59e0b' },
];

function CircuitBreakerDemo() {
  const [state, setState] = useState<CBState>({ status: 'CLOSED', failures: 0, downstreamFailing: false, timeUntilHalfOpen: null });
  const [log, setLog] = useState<{ text: string; type: 'ok' | 'err' | 'warn' | 'info' }[]>([]);
  const [loading, setLoading] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const push = (text: string, type: 'ok' | 'err' | 'warn' | 'info') =>
    setLog(l => [...l.slice(-18), { text, type }]);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch(`${API}/circuit/state`);
      setState(await r.json());
    } catch {}
  }, []);

  useEffect(() => {
    refresh();
    pollRef.current = setInterval(refresh, 2000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [refresh]);

  useEffect(() => { logRef.current?.scrollTo(0, logRef.current.scrollHeight); }, [log]);

  const toggleDownstream = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/circuit/toggle-downstream`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const d = await r.json();
      setState(s => ({ ...s, downstreamFailing: d.downstreamFailing }));
      push(d.downstreamFailing ? '⚠  Downstream service set to FAILING' : '✓  Downstream service restored', d.downstreamFailing ? 'warn' : 'ok');
    } catch { push('✗  Could not reach backend', 'err'); }
    setLoading(false);
  };

  const sendCall = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/circuit/call`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const d = await r.json();
      setState(d.state);
      if (d.outcome === 'rejected') push(`⚡ [${d.state.status}] Short-circuited — downstream protected`, 'warn');
      else if (d.outcome === 'success') push(`✓  [${d.state.status}] Success — ${d.latencyMs}ms`, 'ok');
      else {
        push(`✗  [${d.state.status}] Downstream failed (${d.state.failures}/3)`, 'err');
        if (d.tripped) push(`🔴 Circuit TRIPPED → OPEN — blocking all requests`, 'err');
      }
    } catch { push('✗  Cannot reach backend', 'err'); }
    setLoading(false);
  };

  const reset = async () => {
    await fetch(`${API}/circuit/reset`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    setLog([]);
    refresh();
    push('⟳  Reset — circuit CLOSED, downstream healthy', 'info');
  };

  const currentState = CB_STATES.find(s => s.id === state.status)!;

  return (
    <Panel title="Circuit Breaker State Machine"
      badges={<><Badge color="#22c55e">CLOSED</Badge><Badge color="#ef4444">OPEN</Badge><Badge color="#f59e0b">HALF_OPEN</Badge></>}>
      <p className="text-[0.65rem] text-slate-500 font-mono leading-relaxed">
        Toggle the downstream service to failing. After 3 failures the circuit trips OPEN — requests are
        short-circuited immediately (no downstream hit). After 15s it enters HALF_OPEN to probe recovery.
      </p>

      {/* State machine diagram */}
      <div className="flex items-center justify-between gap-2">
        {CB_STATES.map((s, i) => (
          <React.Fragment key={s.id}>
            <div className="flex-1 rounded-xl p-3 text-center transition-all duration-400"
              style={{
                background: state.status === s.id ? `${s.color}18` : 'rgba(0,0,0,0.3)',
                border: `1px solid ${state.status === s.id ? s.color + '60' : s.color + '15'}`,
                boxShadow: state.status === s.id ? `0 0 20px ${s.color}30` : 'none',
                transform: state.status === s.id ? 'scale(1.03)' : 'scale(1)',
              }}>
              <div className="text-xs font-bold font-mono mb-0.5" style={{ color: state.status === s.id ? s.color : '#475569' }}>{s.id}</div>
              <div className="text-[0.48rem] text-slate-600 font-mono leading-tight">{s.desc}</div>
              {s.id === 'CLOSED' && state.status === 'CLOSED' && state.failures > 0 && (
                <div className="text-[0.5rem] font-mono mt-1" style={{ color: '#f59e0b' }}>⚠ {state.failures}/3 failures</div>
              )}
              {s.id === 'OPEN' && state.status === 'OPEN' && state.timeUntilHalfOpen !== null && (
                <div className="text-[0.5rem] font-mono mt-1" style={{ color: '#f59e0b' }}>→ HALF_OPEN in {state.timeUntilHalfOpen}s</div>
              )}
            </div>
            {i < CB_STATES.length - 1 && (
              <div className="text-[0.6rem] text-slate-700 font-mono shrink-0">→</div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Activity log */}
      <div ref={logRef} className="font-mono text-[0.65rem] rounded-xl p-3 h-28 overflow-y-auto space-y-0.5"
        style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(139,92,246,0.1)' }}>
        {log.length === 0 && <div className="text-slate-700">Waiting for requests...</div>}
        {log.map((l, i) => (
          <div key={i} style={{ color: l.type === 'ok' ? '#22c55e' : l.type === 'err' ? '#ef4444' : l.type === 'warn' ? '#f59e0b' : '#06b6d4' }}>{l.text}</div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <button onClick={toggleDownstream} disabled={loading}
          className="flex-1 py-2.5 rounded-xl font-mono text-xs font-semibold transition-all duration-200 disabled:opacity-50"
          style={{ background: state.downstreamFailing ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.12)', border: `1px solid ${state.downstreamFailing ? '#ef4444' : '#22c55e'}35`, color: state.downstreamFailing ? '#ef4444' : '#22c55e' }}>
          downstream: {state.downstreamFailing ? '✗ FAILING' : '✓ healthy'}
        </button>
        <button onClick={sendCall} disabled={loading}
          className="flex-1 py-2.5 rounded-xl font-mono text-xs font-semibold transition-all duration-200 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#0891b2)', color: 'white' }}>
          {loading ? '...' : '$ call_service()'}
        </button>
        <button onClick={reset} title="Reset"
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-200"
          style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
          <RefreshCw size={12} className="text-violet-400" />
        </button>
      </div>
    </Panel>
  );
}

// ── DEMO 4: CACHE CONSISTENCY ─────────────────────────────────────────────────

function ConsistencyDemo() {
  const [strategy, setStrategy] = useState<'cache-aside' | 'write-through'>('cache-aside');
  const [writeVal, setWriteVal] = useState('v1');
  const [writeResult, setWriteResult] = useState<any>(null);
  const [readResult, setReadResult] = useState<any>(null);
  const [log, setLog] = useState<{ text: string; type: 'ok' | 'err' | 'warn' | 'info' | 'dim' }[]>([]);
  const [loading, setLoading] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const vals = ['v1', 'v2', 'v3', 'hello', 'world', 'stale_data', 'fresh_data'];

  const push = (text: string, type: 'ok' | 'err' | 'warn' | 'info' | 'dim') =>
    setLog(l => [...l.slice(-20), { text, type }]);

  useEffect(() => { logRef.current?.scrollTo(0, logRef.current.scrollHeight); }, [log]);

  const write = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/consistency/write`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value: writeVal, strategy }) });
      const d = await r.json();
      setWriteResult(d);
      setReadResult(null);
      push(`✎  User A writes "${writeVal}" → DB  [${strategy}]`, 'info');
      if (strategy === 'write-through') push(`   ↪ Cache also updated (write-through)`, 'ok');
      else push(`   ↪ Cache NOT updated — stale reads possible`, 'warn');
      // Rotate write value
      setWriteVal(v => vals[(vals.indexOf(v) + 1) % vals.length]);
    } catch { push('✗  Backend offline', 'err'); }
    setLoading(false);
  };

  const read = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/consistency/read`);
      const d = await r.json();
      setReadResult(d);
      if (d.source === 'cache' && d.stale) {
        push(`⚠  User B reads → cache HIT → got "${d.value}" (STALE! DB has "${d.dbValue}")`, 'err');
      } else if (d.source === 'cache') {
        push(`⚡ User B reads → cache HIT → got "${d.value}" (fresh ✓)`, 'ok');
      } else if (d.source === 'db') {
        push(`🗄  User B reads → cache MISS → DB query → got "${d.value}"${d.populated ? ' → cached' : ''}`, 'dim');
      } else {
        push(`○  Nothing in DB or cache yet — write first`, 'dim');
      }
    } catch { push('✗  Backend offline', 'err'); }
    setLoading(false);
  };

  const reset = async () => {
    await fetch(`${API}/consistency/reset`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    setWriteResult(null); setReadResult(null);
    setLog([]); push('⟳  State cleared — DB and cache both empty', 'dim');
  };

  const isStale = readResult?.source === 'cache' && readResult?.stale;
  const isFresh = readResult?.source === 'cache' && !readResult?.stale;

  return (
    <Panel title="Cache Consistency Strategies"
      badges={<><Badge color="#f43f5e">Cache-Aside</Badge><Badge color="#34d399">Write-Through</Badge><Badge color="#8b5cf6">Redis</Badge></>}>
      <p className="text-[0.65rem] text-slate-500 font-mono leading-relaxed">
        Write a value, then read it. With Cache-Aside the cache is NOT updated on write — simulate stale reads.
        Switch to Write-Through to see consistency guaranteed on every read.
      </p>

      {/* Strategy toggle */}
      <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(139,92,246,0.2)' }}>
        {(['cache-aside', 'write-through'] as const).map(s => (
          <button key={s} onClick={() => { setStrategy(s); reset(); }}
            className="flex-1 py-2.5 font-mono text-xs font-semibold transition-all duration-200"
            style={{ background: strategy === s ? (s === 'cache-aside' ? 'rgba(244,63,94,0.2)' : 'rgba(52,211,153,0.2)') : 'rgba(0,0,0,0.3)', color: strategy === s ? (s === 'cache-aside' ? '#f43f5e' : '#34d399') : '#475569' }}>
            {s}
          </button>
        ))}
      </div>

      {/* State visualization */}
      <div className="grid grid-cols-3 gap-3 items-center">
        {/* Writer */}
        <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(100,100,140,0.2)' }}>
          <div className="text-[0.6rem] text-slate-500 font-mono mb-2">User A  (writer)</div>
          <div className="text-[0.55rem] font-mono px-2 py-1 rounded mb-2" style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)' }}>
            writing: "{writeVal}"
          </div>
          {writeResult && (
            <div className="space-y-1">
              <div className="text-[0.5rem] font-mono text-green-400">DB ✓ updated</div>
              <div className="text-[0.5rem] font-mono" style={{ color: writeResult.cacheUpdated ? '#22c55e' : '#ef444488' }}>
                Cache {writeResult.cacheUpdated ? '✓ updated' : '✗ not updated'}
              </div>
            </div>
          )}
        </div>

        {/* DB + Cache */}
        <div className="space-y-2">
          <div className="rounded-lg p-2 text-center" style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
            <div className="text-[0.5rem] text-slate-500 font-mono">Database</div>
            <div className="text-[0.6rem] font-mono" style={{ color: '#34d399' }}>{writeResult ? `"${writeResult.value}"` : '—'}</div>
          </div>
          <div className="rounded-lg p-2 text-center transition-all duration-300"
            style={{ background: isStale ? 'rgba(239,68,68,0.12)' : isFresh ? 'rgba(34,197,94,0.1)' : 'rgba(139,92,246,0.08)', border: `1px solid ${isStale ? '#ef444440' : isFresh ? '#22c55e40' : 'rgba(139,92,246,0.2)'}` }}>
            <div className="text-[0.5rem] text-slate-500 font-mono">Cache</div>
            <div className="text-[0.6rem] font-mono" style={{ color: isStale ? '#ef4444' : isFresh ? '#22c55e' : '#8b5cf6' }}>
              {readResult?.source === 'cache' ? `"${readResult.value}" ${isStale ? '⚠ STALE' : '✓'}` : '—'}
            </div>
          </div>
        </div>

        {/* Reader */}
        <div className="rounded-xl p-3 text-center transition-all duration-300"
          style={{ background: isStale ? 'rgba(239,68,68,0.08)' : isFresh ? 'rgba(34,197,94,0.08)' : 'rgba(0,0,0,0.3)', border: `1px solid ${isStale ? '#ef444435' : isFresh ? '#22c55e35' : 'rgba(100,100,140,0.2)'}` }}>
          <div className="text-[0.6rem] text-slate-500 font-mono mb-2">User B  (reader)</div>
          {readResult ? (
            <div className="space-y-1">
              <div className="text-[0.55rem] font-mono px-2 py-1 rounded" style={{ background: isStale ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.12)', color: isStale ? '#ef4444' : '#22c55e', border: `1px solid ${isStale ? '#ef444430' : '#22c55e30'}` }}>
                "{readResult.value}"
              </div>
              <div className="text-[0.5rem] font-mono" style={{ color: readResult.source === 'cache' ? '#8b5cf6' : '#06b6d4' }}>
                from {readResult.source} {isStale ? '← STALE!' : isFresh ? '← fresh' : ''}
              </div>
            </div>
          ) : <div className="text-[0.5rem] text-slate-600 font-mono">no read yet</div>}
        </div>
      </div>

      {/* Log */}
      <div ref={logRef} className="font-mono text-[0.62rem] rounded-xl p-3 h-24 overflow-y-auto space-y-0.5"
        style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(139,92,246,0.1)' }}>
        {log.length === 0 && <div className="text-slate-700">Start by writing a value, then reading it.</div>}
        {log.map((l, i) => (
          <div key={i} style={{ color: l.type === 'ok' ? '#22c55e' : l.type === 'err' ? '#ef4444' : l.type === 'warn' ? '#f59e0b' : l.type === 'info' ? '#06b6d4' : '#475569' }}>{l.text}</div>
        ))}
      </div>

      <div className="flex gap-2">
        <button onClick={write} disabled={loading}
          className="flex-1 py-2.5 rounded-xl font-mono text-xs font-semibold transition-all duration-200 disabled:opacity-50"
          style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa' }}>
          {loading ? '...' : `✎  write "${writeVal}"`}
        </button>
        <button onClick={read} disabled={loading}
          className="flex-1 py-2.5 rounded-xl font-mono text-xs font-semibold transition-all duration-200 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#0891b2)', color: 'white' }}>
          {loading ? '...' : '⟵  read value'}
        </button>
        <button onClick={reset} title="Reset" className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
          <RefreshCw size={12} className="text-violet-400" />
        </button>
      </div>
    </Panel>
  );
}

// ── TERMINAL ─────────────────────────────────────────────────────────────────

type TLine = { id: string; type: 'input' | 'out' | 'system' | 'assistant'; text: string; prompt?: string };

const SHELL_HELP = [
  'help        show commands',
  'about       quick bio',
  'projects    list projects',
  'skills      tech stack',
  'playground  what this section is',
  'contact     how to reach me',
  'tharun      enter AI chat mode',
  'clear       clear terminal',
];
const BOOT = ['TharunOS v1.0.0', 'Type "help" for commands. Type "tharun" to chat with AI.'];
const CHAT_BOOT = ['[session] connecting to Tharun AI...', '[session] ready'];

function Terminal() {
  const [mode, setMode] = useState<'shell' | 'chat'>('shell');
  const [lines, setLines] = useState<TLine[]>(() => BOOT.map((t, i) => ({ id: `b${i}`, type: 'system', text: t })));
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [history, setHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const outRef = useRef<HTMLDivElement>(null);
  const inRef = useRef<HTMLInputElement>(null);
  const prompt = mode === 'chat' ? 'tharun>' : 'guest@tharun:~$';

  useEffect(() => { outRef.current && (outRef.current.scrollTop = outRef.current.scrollHeight); }, [lines, streaming]);
  const hasMounted = useRef(false);
  useEffect(() => {
    if (!hasMounted.current) { hasMounted.current = true; return; }
    inRef.current?.focus({ preventScroll: true });
  }, [mode]);

  const push = (line: TLine) => setLines(p => [...p, line]);
  const clear = () => setLines(BOOT.map((t, i) => ({ id: `b${i}-${Date.now()}`, type: 'system', text: t })));

  const shell = (raw: string) => {
    const cmd = raw.trim().toLowerCase();
    if (cmd === 'clear') { clear(); return; }
    if (cmd === 'help') { push({ id: `h0-${Date.now()}`, type: 'out', text: 'Commands:' }); SHELL_HELP.forEach((t, i) => push({ id: `h${i+1}-${Date.now()}`, type: 'out', text: `  ${t}` })); return; }
    if (cmd === 'about') { push({ id: `a-${Date.now()}`, type: 'out', text: 'Full Stack Developer + AI Engineer, California. 3+ yrs at McKinsey, Uber, KPMG.' }); return; }
    if (cmd === 'projects') { push({ id: `p-${Date.now()}`, type: 'out', text: 'Health Tracker AI · QA Voice Agent · NotchSafe · WHOOP Motivator' }); return; }
    if (cmd === 'skills') { push({ id: `s-${Date.now()}`, type: 'out', text: 'React · Node.js · Python · PostgreSQL · Redis · Docker · Kubernetes · LLMs' }); return; }
    if (cmd === 'contact') { push({ id: `c-${Date.now()}`, type: 'out', text: 'tharun.manikonda1@outlook.com  |  github.com/tharunmanikonda' }); return; }
    if (cmd === 'playground') { push({ id: `pg-${Date.now()}`, type: 'out', text: 'Live engineering demos: request journeys, rate-limit algorithms, circuit breakers, cache consistency.' }); return; }
    if (cmd === 'tharun') {
      setMode('chat');
      const boot = CHAT_BOOT.map((t, i) => ({ id: `cb${i}-${Date.now()}`, type: 'system' as const, text: t }));
      const greet = { id: `cg-${Date.now()}`, type: 'assistant' as const, text: "Hi! I'm Tharun — ask me about my projects, experience, or tech stack." };
      setLines([...boot, greet]); return;
    }
    push({ id: `nf-${Date.now()}`, type: 'out', text: `command not found: ${raw}` });
  };

  const chat = async (raw: string) => {
    if (raw.toLowerCase() === 'exit') { setMode('shell'); push({ id: `ex-${Date.now()}`, type: 'system', text: 'Exited AI chat. Back to shell.' }); return; }
    if (raw.toLowerCase() === 'clear') { clear(); return; }
    const uid = `u-${Date.now()}`, aid = `a-${Date.now()}`;
    push({ id: uid, type: 'input', text: raw, prompt });
    push({ id: aid, type: 'assistant', text: '' });
    setStreaming(true);

    // Word-by-word drip queue
    const queue: string[] = [];
    let displayed = '';
    let sseComplete = false;
    let fullText = '';

    const updateLine = (text: string) => setLines(prev => {
      const c = [...prev];
      const idx = c.findIndex(l => l.id === aid);
      if (idx !== -1) c[idx] = { ...c[idx], text };
      return c;
    });

    const drip = () => {
      if (queue.length === 0) {
        if (sseComplete) { setStreaming(false); return; }
        setTimeout(drip, 16);
        return;
      }
      displayed += queue.shift();
      updateLine(displayed);
      setTimeout(drip, 32 + Math.random() * 24);
    };
    setTimeout(drip, 0);

    try {
      const r = await fetch(CHAT_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: raw, history }) });
      if (!r.ok || !r.body) throw new Error();
      const reader = r.body.getReader(); const dec = new TextDecoder(); let buf = '';
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split('\n'); buf = parts.pop() ?? '';
        for (const p of parts) {
          if (!p.startsWith('data: ')) continue;
          const tok = p.slice(6);
          if (tok === '[DONE]') { sseComplete = true; setHistory(h => [...h, { role: 'user', content: raw }, { role: 'assistant', content: fullText }]); return; }
          fullText += tok;
          // split token into words, preserving spaces between them
          tok.split(/(\s+)/).filter(Boolean).forEach(w => queue.push(w));
        }
      }
    } catch {
      sseComplete = true;
      if (!displayed) updateLine("Couldn't connect to backend — make sure it's running.");
    } finally {
      sseComplete = true;
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim(); if (!text || streaming) return;
    setInput('');
    if (mode === 'shell') { push({ id: `i-${Date.now()}`, type: 'input', text, prompt }); shell(text); }
    else await chat(text);
  };

  return (
    <div className="terminal-card">
      <div className="terminal-bar">
        <div className="terminal-dots"><span className="dot dot-red"/><span className="dot dot-amber"/><span className="dot dot-green"/></div>
        <div className="terminal-title">{mode === 'chat' ? 'Tharun AI' : 'TharunOS Shell'}</div>
      </div>
      <div className="terminal-body">
        <div ref={outRef} className="terminal-output">
          {lines.map(l => (
            <div key={l.id} className={`terminal-line terminal-${l.type}`}>
              {l.type === 'input' && <span className="terminal-prompt">{l.prompt}</span>}
              <span>{l.text}</span>
            </div>
          ))}
          {streaming && <div className="terminal-line terminal-assistant"><span className="terminal-caret"/></div>}
        </div>
        <form onSubmit={submit} className="terminal-input-row">
          <span className="terminal-prompt">{prompt}</span>
          <input ref={inRef} value={input} onChange={e => setInput(e.target.value)} className="terminal-input" spellCheck={false} autoComplete="off" placeholder={mode === 'chat' ? 'Ask me anything...' : 'Type a command...'} />
        </form>
      </div>
    </div>
  );
}


// ── TABS ──────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'journey',     label: 'Request Journey',    icon: Zap,      color: '#06b6d4', sub: 'trace a request end-to-end' },
  { id: 'algorithms',  label: 'Algo Showdown',      icon: Shield,   color: '#8b5cf6', sub: 'fixed vs sliding window' },
  { id: 'circuit',     label: 'Circuit Breaker',    icon: Activity, color: '#ef4444', sub: 'trip · recover · probe' },
  { id: 'consistency', label: 'Cache Consistency',  icon: Database, color: '#34d399', sub: 'cache-aside vs write-through' },
];

// ── SECTION ───────────────────────────────────────────────────────────────────

export default function Playground() {
  const [ref, visible] = useVisible();
  const [tab, setTab] = useState('journey');

  return (
    <section id="playground" ref={ref as React.RefObject<HTMLElement>} className="py-28 px-6 relative z-10">
      <div className="max-w-6xl mx-auto">
        <div className="transition-all duration-700" style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(32px)' }}>

          <p className="text-xs text-violet-400 font-mono mb-3 tracking-[0.18em] uppercase">// engineering depth</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Live Playground</h2>
          <p className="text-slate-400 text-sm mb-10 max-w-xl font-mono">
            <span className="text-slate-600">// </span>
            Not "I know Redis". Four live systems showcasing the <em>why</em> and <em>tradeoffs</em> behind patterns that run at Uber-scale.
          </p>

          {/* Tab bar */}
          <div className="flex gap-1 flex-wrap mb-6 p-1 rounded-2xl" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(139,92,246,0.12)' }}>
            {TABS.map(t => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className="flex-1 flex flex-col items-center gap-0.5 py-2.5 px-2 rounded-xl transition-all duration-200 min-w-[100px]"
                  style={{ background: active ? `${t.color}18` : 'transparent', border: `1px solid ${active ? t.color + '40' : 'transparent'}`, boxShadow: active ? `0 0 16px ${t.color}20` : 'none' }}>
                  <Icon size={14} style={{ color: active ? t.color : '#475569' }}/>
                  <span className="text-[0.6rem] font-mono font-semibold" style={{ color: active ? t.color : '#475569' }}>{t.label}</span>
                  <span className="text-[0.5rem] font-mono hidden sm:block" style={{ color: active ? `${t.color}80` : '#2d3748' }}>{t.sub}</span>
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="glass rounded-2xl p-6 mb-6 min-h-[400px]">
            {tab === 'journey'     && <JourneyDemo />}
            {tab === 'algorithms'  && <AlgorithmDemo />}
            {tab === 'circuit'     && <CircuitBreakerDemo />}
            {tab === 'consistency' && <ConsistencyDemo />}
          </div>

          {/* Terminal — full width */}
          <div><Terminal /></div>

        </div>
      </div>
    </section>
  );
}
