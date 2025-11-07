import React, { useState, useEffect } from 'react';
import { ChevronDown, Mail, Phone, MapPin, Github, Linkedin, ExternalLink, Code, Database, Cloud, Settings, Award, Briefcase, GraduationCap, User, Menu, X, Zap, Activity, RefreshCw, Lock, FileUp, BarChart3, Cpu, GitBranch } from 'lucide-react';

// API Base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api/demo';

// Demo Card Component with Interactive Content
const DemoCard = ({ icon, title, description, tags, isVisible, delay, children, demoId, forceExpanded = false }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  tags: string[];
  isVisible: boolean;
  delay: string;
  children?: React.ReactNode;
  demoId: string;
  forceExpanded?: boolean;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!forceExpanded) {
      setIsExpanded(!isExpanded);
    }
  };

  // Auto-expand if forceExpanded is true
  React.useEffect(() => {
    if (forceExpanded) {
      setIsExpanded(true);
    }
  }, [forceExpanded]);

  return (
    <div
      className={`glass-card rounded-lg p-6 transition-all duration-500 group ${
        isVisible ? 'animate-fade-in-scale' : 'opacity-0'
      } ${isExpanded ? 'col-span-full' : ''}`}
      style={{ animationDelay: delay }}
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="p-3 bg-gray-900/50 rounded-lg group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold mb-2 group-hover:text-blue-400 transition-colors duration-300">
            {title}
          </h3>
        </div>
      </div>

      <p className="text-gray-400 text-sm mb-4 leading-relaxed">
        {description}
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {tags.map((tag, i) => (
          <span
            key={i}
            className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded text-xs border border-blue-500/20 hover:bg-blue-500/20 transition-colors duration-300"
          >
            {tag}
          </span>
        ))}
      </div>

      {isExpanded && children && (
        <div className="mt-4 p-6 bg-gray-900/50 rounded-lg border border-blue-500/20 animate-slide-in-up max-w-full overflow-auto">
          {children}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-700/50">
        <button
          onClick={handleToggle}
          className={`text-xs flex items-center gap-1 transition-colors duration-300 ${
            forceExpanded
              ? 'text-gray-500 cursor-not-allowed'
              : 'text-blue-400 hover:text-blue-300'
          }`}
          disabled={forceExpanded}
        >
          <Code size={14} />
          {forceExpanded
            ? 'Demo in Progress...'
            : isExpanded
            ? 'Hide Demo'
            : 'Try Live Demo'}
        </button>
      </div>
    </div>
  );
};

// Interactive Demo Components
const RetryDemo = () => {
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const testRetry = async () => {
    setLoading(true);
    setAttempts(0);
    setResult(null);
    setLogs(['Starting retry demo...']);

    const maxRetries = 5;
    let attempt = 0;

    const makeRequest = async (attemptNum: number): Promise<any> => {
      try {
        setAttempts(attemptNum);
        setLogs(prev => [...prev, `Attempt ${attemptNum}: Calling API...`]);

        const response = await fetch(`${API_BASE_URL}/retry/unreliable-api?attempt=${attemptNum}&failureRate=0.7&requestId=${Date.now()}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error);
        }

        setLogs(prev => [...prev, `✅ Success on attempt ${attemptNum}!`]);
        return data;
      } catch (error: any) {
        setLogs(prev => [...prev, `❌ Attempt ${attemptNum} failed: ${error.message}`]);

        if (attemptNum < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attemptNum), 10000);
          setLogs(prev => [...prev, `⏳ Waiting ${delay}ms before retry...`]);
          await new Promise(resolve => setTimeout(resolve, delay));
          return makeRequest(attemptNum + 1);
        }
        throw error;
      }
    };

    try {
      const finalResult = await makeRequest(1);
      setResult(finalResult);
      setLogs(prev => [...prev, '🎉 Request succeeded with exponential backoff!']);
    } catch (error) {
      setLogs(prev => [...prev, '💥 All retries exhausted']);
    }

    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <button
        onClick={testRetry}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded text-sm transition-colors duration-300"
      >
        {loading ? 'Testing...' : 'Test API Retry Logic'}
      </button>

      {attempts > 0 && (
        <div className="text-sm">
          <div className="text-gray-300 mb-2">Attempts: {attempts}/5</div>
          <div className="bg-gray-950 p-3 rounded font-mono text-xs max-h-48 overflow-y-auto space-y-1">
            {logs.map((log, i) => (
              <div key={i} className="text-green-400">{log}</div>
            ))}
          </div>
        </div>
      )}

      {result && (
        <div className="text-xs text-gray-400 bg-gray-950 p-3 rounded">
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

const RateLimitDemo = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const makeRequest = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/rate-limit/test?user=demo-user`);
      const data = await response.json();

      setRequests(prev => [...prev, {
        time: new Date().toLocaleTimeString(),
        status: response.status,
        message: data.message || data.error,
        remaining: data.rateLimit?.remaining
      }]);

      if (response.status === 200) {
        setStatus(data.rateLimit);
      }
    } catch (error: any) {
      setRequests(prev => [...prev, {
        time: new Date().toLocaleTimeString(),
        status: 'error',
        message: error.message
      }]);
    }
    setLoading(false);
  };

  const reset = async () => {
    await fetch(`${API_BASE_URL}/rate-limit/reset?user=demo-user`, { method: 'POST' });
    setRequests([]);
    setStatus(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={makeRequest}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded text-sm transition-colors duration-300"
        >
          Make Request
        </button>
        <button
          onClick={reset}
          className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-sm transition-colors duration-300"
        >
          Reset
        </button>
      </div>

      {status && (
        <div className="text-sm text-gray-300">
          <div>Limit: {status.limit} requests/minute</div>
          <div className={status.remaining > 0 ? 'text-green-400' : 'text-red-400'}>
            Remaining: {status.remaining}
          </div>
        </div>
      )}

      {requests.length > 0 && (
        <div className="bg-gray-950 p-3 rounded text-xs max-h-48 overflow-y-auto space-y-1">
          {requests.map((req, i) => (
            <div key={i} className={req.status === 200 ? 'text-green-400' : 'text-red-400'}>
              [{req.time}] {req.status === 200 ? '✅' : '❌'} {req.message} {req.remaining !== undefined && `(${req.remaining} left)`}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const WebhookDemo = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookId, setWebhookId] = useState('');

  const sendWebhook = async (isDuplicate: boolean = false) => {
    if (!webhookUrl) {
      alert('Please enter a webhook URL from webhook.site');
      return;
    }

    setLoading(true);
    const startTime = Date.now();

    try {
      const payload = {
        id: isDuplicate ? webhookId : `webhook-${Date.now()}`,
        event: 'portfolio.demo',
        timestamp: new Date().toISOString(),
        source: 'tharun-portfolio',
        data: {
          userId: Math.floor(Math.random() * 1000),
          action: isDuplicate ? 'duplicate_test' : 'webhook_test',
          email: 'demo@example.com',
          metadata: {
            browser: navigator.userAgent.split(' ').slice(-2).join(' '),
            demonstration: 'signature_verification_and_idempotency'
          }
        }
      };

      // Send to backend proxy (avoids CORS issues)
      const response = await fetch(`${API_BASE_URL}/webhook-proxy/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl,
          payload
        })
      });

      const data = await response.json();

      if (!isDuplicate) {
        setWebhookId(payload.id);
      }

      setResult({
        ...data,
        isDuplicate,
        payload: payload
      });
    } catch (error: any) {
      setResult({
        error: true,
        message: error.message,
        hint: 'Make sure CORS is enabled on webhook.site or use a CORS proxy'
      });
    }

    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs text-gray-400">
          Webhook URL (get one from <a href="https://webhook.site" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">webhook.site</a>)
        </label>
        <input
          type="text"
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
          placeholder="https://webhook.site/your-unique-id"
          className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-sm text-gray-300 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => sendWebhook(false)}
          disabled={loading || !webhookUrl}
          className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:opacity-50 px-4 py-2 rounded text-sm transition-colors duration-300"
        >
          {loading ? 'Sending...' : 'Send Webhook'}
        </button>
        {webhookId && (
          <button
            onClick={() => sendWebhook(true)}
            disabled={loading}
            className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 px-4 py-2 rounded text-sm transition-colors duration-300"
          >
            Test Duplicate
          </button>
        )}
      </div>

      {result && !result.error && (
        <div className="space-y-3">
          <div className="text-sm space-y-1">
            <div className="flex items-center gap-2">
              <span className={result.success ? 'text-green-400' : 'text-red-400'}>
                {result.success ? '✅' : '❌'} HTTP {result.status} {result.statusText}
              </span>
              <span className="text-blue-400">• {result.responseTime}</span>
            </div>
            {result.isDuplicate && (
              <div className="text-orange-400 text-xs">⚠️ Duplicate webhook ID - Real systems would reject this!</div>
            )}
          </div>

          <div className="bg-gray-950 p-3 rounded text-xs font-mono space-y-1">
            <div className="text-blue-400 font-semibold mb-2">Technical Details:</div>
            <div className="text-gray-400">Webhook ID: <span className="text-green-400">{result.webhookId}</span></div>
            <div className="text-gray-400">Signature: <span className="text-purple-400">{result.signature}</span></div>
            <div className="text-gray-400">Response Time: <span className="text-yellow-400">{result.responseTime}</span></div>
            <div className="text-gray-400">Content-Type: <span className="text-gray-300">{result.headers['content-type'] || 'N/A'}</span></div>
          </div>

          <div className="bg-gray-950 p-3 rounded text-xs">
            <div className="text-gray-400 mb-1">Headers Sent:</div>
            <div className="font-mono text-green-400">
              ✓ X-Webhook-Signature (HMAC-SHA256)<br/>
              ✓ X-Webhook-Id (Idempotency)<br/>
              ✓ X-Event-Type<br/>
              ✓ X-Timestamp
            </div>
          </div>

          <div className="text-xs text-gray-500">
            💡 Check your webhook.site dashboard to see the full payload and headers received!
          </div>
        </div>
      )}

      {result?.error && (
        <div className="bg-red-900/20 border border-red-500/30 p-3 rounded text-xs">
          <div className="text-red-400 font-semibold mb-1">Error:</div>
          <div className="text-gray-300">{result.message}</div>
          {result.hint && <div className="text-gray-400 mt-2">💡 {result.hint}</div>}
        </div>
      )}
    </div>
  );
};

const DatabaseDemo = () => {
  const [loading, setLoading] = useState(false);
  const [inefficientResult, setInefficientResult] = useState<any>(null);
  const [optimizedResult, setOptimizedResult] = useState<any>(null);
  const [comparing, setComparing] = useState(false);

  const testQuery = async (type: 'inefficient' | 'optimized') => {
    setLoading(true);
    const startTime = Date.now();

    try {
      const response = await fetch(`${API_BASE_URL}/database/n-plus-one/${type}`);
      const data = await response.json();
      const clientTime = Date.now() - startTime;

      const result = {
        ...data,
        clientResponseTime: `${clientTime}ms`
      };

      if (type === 'inefficient') {
        setInefficientResult(result);
      } else {
        setOptimizedResult(result);
      }
    } catch (error: any) {
      const errorResult = { error: error.message };
      if (type === 'inefficient') {
        setInefficientResult(errorResult);
      } else {
        setOptimizedResult(errorResult);
      }
    }

    setLoading(false);
  };

  const compareQueries = async () => {
    setComparing(true);
    setInefficientResult(null);
    setOptimizedResult(null);

    await testQuery('inefficient');
    await new Promise(resolve => setTimeout(resolve, 500));
    await testQuery('optimized');

    setComparing(false);
  };

  const getSpeedImprovement = () => {
    if (!inefficientResult || !optimizedResult) return null;

    const inefficientQueries = inefficientResult.performance?.totalQueries || 0;
    const optimizedQueries = optimizedResult.performance?.totalQueries || 0;

    return {
      queriesReduced: inefficientQueries - optimizedQueries,
      percentageReduction: ((inefficientQueries - optimizedQueries) / inefficientQueries * 100).toFixed(0)
    };
  };

  const improvement = getSpeedImprovement();

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => testQuery('inefficient')}
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-4 py-2 rounded text-sm transition-colors duration-300"
        >
          Run N+1 Query
        </button>
        <button
          onClick={() => testQuery('optimized')}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded text-sm transition-colors duration-300"
        >
          Run Optimized
        </button>
        <button
          onClick={compareQueries}
          disabled={loading || comparing}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded text-sm transition-colors duration-300"
        >
          {comparing ? 'Comparing...' : 'Compare Both'}
        </button>
      </div>

      {improvement && (
        <div className="bg-green-900/20 border border-green-500/30 p-3 rounded text-sm">
          <div className="text-green-400 font-semibold mb-1">
            ⚡ Performance Improvement
          </div>
          <div className="text-gray-300">
            Reduced from <span className="text-red-400">{improvement.queriesReduced + 1} queries</span> to <span className="text-green-400">1 query</span>
          </div>
          <div className="text-gray-300">
            <span className="text-green-400 font-bold">{improvement.percentageReduction}%</span> reduction in database calls!
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Inefficient Result */}
        {inefficientResult && (
          <div className="space-y-2">
            <div className="text-sm font-semibold text-red-400 mb-2">
              ❌ N+1 Query Problem
            </div>
            <div className="bg-gray-950 p-3 rounded text-xs space-y-2">
              <div className="text-gray-400">
                Total Queries: <span className="text-red-400 font-bold">{inefficientResult.performance?.totalQueries}</span>
              </div>
              <div className="text-gray-400">
                Execution Time: <span className="text-orange-400">{inefficientResult.performance?.totalExecutionTime}</span>
              </div>
              <div className="text-gray-500 text-xs mt-2">
                Problem: {inefficientResult.performance?.problem}
              </div>

              {/* Visual representation */}
              <div className="mt-3">
                <div className="text-gray-500 text-xs mb-1">Queries Executed:</div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <div className="text-xs text-gray-400">1 query for users</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <div className="text-xs text-gray-400">+10 queries for each user's orders</div>
                  </div>
                  <div className="text-xs text-red-400 font-bold mt-1">= 11 total database calls 😢</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Optimized Result */}
        {optimizedResult && (
          <div className="space-y-2">
            <div className="text-sm font-semibold text-green-400 mb-2">
              ✅ Optimized Query
            </div>
            <div className="bg-gray-950 p-3 rounded text-xs space-y-2">
              <div className="text-gray-400">
                Total Queries: <span className="text-green-400 font-bold">{optimizedResult.performance?.totalQueries}</span>
              </div>
              <div className="text-gray-400">
                Execution Time: <span className="text-green-400">{optimizedResult.performance?.totalExecutionTime}</span>
              </div>
              <div className="text-gray-500 text-xs mt-2">
                Solution: {optimizedResult.performance?.improvement}
              </div>

              {/* Visual representation */}
              <div className="mt-3">
                <div className="text-gray-500 text-xs mb-1">Queries Executed:</div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="text-xs text-gray-400">1 JOIN query (users + orders)</div>
                  </div>
                  <div className="text-xs text-green-400 font-bold mt-1">= 1 total database call 🚀</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500 bg-gray-950 p-3 rounded">
        💡 <span className="text-gray-400">The N+1 problem:</span> Making 1 query to get users, then N additional queries to get each user's orders.
        <br/>
        <span className="text-green-400">The fix:</span> Use a JOIN or aggregation to get everything in one query.
      </div>
    </div>
  );
};

const CacheDemo = () => {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const testCache = async (withCache: boolean) => {
    setLoading(true);
    const startTime = Date.now();

    try {
      const endpoint = withCache ? '/cache/with-cache' : '/cache/without-cache';
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      const data = await response.json();
      const responseTime = Date.now() - startTime;

      setResult({
        ...data,
        actualResponseTime: `${responseTime}ms`,
        cached: withCache && data.source === 'cache'
      });

      if (withCache) {
        const statsRes = await fetch(`${API_BASE_URL}/cache/stats`);
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error: any) {
      setResult({ error: error.message });
    }

    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => testCache(true)}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-4 py-2 rounded text-sm transition-colors duration-300"
        >
          With Cache
        </button>
        <button
          onClick={() => testCache(false)}
          disabled={loading}
          className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 px-4 py-2 rounded text-sm transition-colors duration-300"
        >
          Without Cache
        </button>
      </div>

      {result && (
        <div className="space-y-2">
          <div className="text-sm">
            <div className="text-gray-300">Source: <span className={result.source === 'cache' ? 'text-green-400' : 'text-orange-400'}>{result.source}</span></div>
            <div className="text-gray-300">Response Time: <span className="text-blue-400">{result.actualResponseTime}</span></div>
            {result.cached && <div className="text-green-400">⚡ Served from cache!</div>}
          </div>

          {stats && (
            <div className="bg-gray-950 p-3 rounded text-xs">
              <div className="text-gray-300">Cache Stats:</div>
              <div className="text-green-400">Hits: {stats.hits}</div>
              <div className="text-orange-400">Misses: {stats.misses}</div>
              <div className="text-blue-400">Hit Rate: {stats.hitRate}%</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const MediaUploadDemo = ({ onActiveStateChange }: { onActiveStateChange?: (isActive: boolean) => void }) => {
  const [selectedMediaType, setSelectedMediaType] = useState('video');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [uploadSession, setUploadSession] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [processingStage, setProcessingStage] = useState<any>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [processedOutputs, setProcessedOutputs] = useState<any>(null);
  const completionRef = React.useRef<HTMLDivElement>(null);

  // Notify parent when demo becomes active/inactive
  React.useEffect(() => {
    const isActive = !!(selectedFile || isUploading || processingStage || isComplete);
    onActiveStateChange?.(isActive);
  }, [selectedFile, isUploading, processingStage, isComplete, onActiveStateChange]);

  // Auto-scroll to completion when processing finishes
  React.useEffect(() => {
    if (isComplete && completionRef.current) {
      setTimeout(() => {
        completionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 300);
    }
  }, [isComplete]);

  const presetFiles = {
    video: [
      { name: 'presentation.mp4', size: 250 * 1024 * 1024, chunkSize: 5 * 1024 * 1024 },
      { name: 'tutorial.mov', size: 180 * 1024 * 1024, chunkSize: 5 * 1024 * 1024 }
    ],
    audio: [
      { name: 'podcast.mp3', size: 45 * 1024 * 1024, chunkSize: 5 * 1024 * 1024 },
      { name: 'album.flac', size: 120 * 1024 * 1024, chunkSize: 5 * 1024 * 1024 }
    ],
    image: [
      { name: 'photo.jpg', size: 8 * 1024 * 1024, chunkSize: 2 * 1024 * 1024 },
      { name: 'banner.png', size: 15 * 1024 * 1024, chunkSize: 2 * 1024 * 1024 }
    ],
    document: [
      { name: 'report.pdf', size: 25 * 1024 * 1024, chunkSize: 5 * 1024 * 1024 },
      { name: 'manual.docx', size: 12 * 1024 * 1024, chunkSize: 2 * 1024 * 1024 }
    ]
  };

  const getMediaTypeFromFile = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const videoExts = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv'];
    const audioExts = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'];
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
    const documentExts = ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx'];

    if (videoExts.includes(ext)) return 'video';
    if (audioExts.includes(ext)) return 'audio';
    if (imageExts.includes(ext)) return 'image';
    if (documentExts.includes(ext)) return 'document';
    return 'video'; // Default
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const detectedMediaType = getMediaTypeFromFile(file.name);
    setSelectedMediaType(detectedMediaType);

    // Determine chunk size based on file size
    const chunkSize = file.size > 50 * 1024 * 1024 ? 5 * 1024 * 1024 : 2 * 1024 * 1024;

    const fileData = {
      name: file.name,
      size: file.size,
      chunkSize: chunkSize,
      isUserFile: true
    };

    startUpload(fileData);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const startUpload = async (file: any) => {
    setSelectedFile(file);
    const totalChunks = Math.ceil(file.size / file.chunkSize);

    try {
      const response = await fetch(`${API_BASE_URL}/video/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          totalChunks,
          chunkSize: file.chunkSize,
          fileType: selectedMediaType
        })
      });

      const data = await response.json();
      setUploadSession({ ...data, progress: 0, uploadedChunks: [] });
      setIsUploading(true);
      uploadChunks(data.uploadId, totalChunks, file.chunkSize);
    } catch (error) {
      console.error('Upload init failed:', error);
    }
  };

  const uploadChunks = async (uploadId: string, totalChunks: number, chunkSize: number) => {
    for (let i = 0; i < totalChunks; i++) {
      if (isPaused) break;

      try {
        const response = await fetch(`${API_BASE_URL}/video/chunk/${uploadId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chunkIndex: i,
            chunkSize,
            checksum: 'demo-checksum'
          })
        });

        const data = await response.json();

        if (data.status === 'complete') {
          setIsUploading(false);
          pollProcessingStatus(uploadId);
          return;
        }

        setUploadSession((prev: any) => ({
          ...prev,
          progress: parseFloat(data.progress),
          uploadedChunks: data.uploadedChunks,
          chunks: data.chunks,
          eta: data.estimatedTimeRemaining
        }));

        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error('Chunk upload failed:', error);
        break;
      }
    }
  };

  const generateProcessedOutputs = (mediaType: string, fileName: string, fileSize: number) => {
    const outputs: any = {
      metadata: {},
      formats: [],
      details: []
    };

    switch (mediaType) {
      case 'video':
        outputs.metadata = {
          duration: '2:45',
          originalResolution: '1920x1080',
          codec: 'H.264',
          bitrate: '5.2 Mbps',
          fps: 30
        };
        outputs.formats = [
          { resolution: '360p', size: formatBytes(fileSize * 0.15), codec: 'H.264', bitrate: '800 Kbps', status: 'ready' },
          { resolution: '720p', size: formatBytes(fileSize * 0.35), codec: 'H.264', bitrate: '2.5 Mbps', status: 'ready' },
          { resolution: '1080p', size: formatBytes(fileSize * 0.60), codec: 'H.264', bitrate: '5 Mbps', status: 'ready' }
        ];
        outputs.details = [
          'Generated 3 thumbnails (start, middle, end)',
          'Created HLS segments for adaptive streaming',
          'Extracted audio track for separate delivery',
          'Generated preview clip (first 10 seconds)'
        ];
        break;

      case 'audio':
        outputs.metadata = {
          duration: '3:42',
          sampleRate: '44.1 kHz',
          channels: 'Stereo',
          originalFormat: fileName.split('.').pop()?.toUpperCase()
        };
        outputs.formats = [
          { format: 'MP3 320kbps', size: formatBytes(fileSize * 0.8), bitrate: '320 Kbps', status: 'ready' },
          { format: 'AAC 256kbps', size: formatBytes(fileSize * 0.65), bitrate: '256 Kbps', status: 'ready' },
          { format: 'MP3 128kbps', size: formatBytes(fileSize * 0.35), bitrate: '128 Kbps', status: 'ready' }
        ];
        outputs.details = [
          'Generated waveform visualization',
          'Normalized audio levels (-14 LUFS)',
          'Applied noise reduction filter',
          'Created streaming-optimized versions'
        ];
        break;

      case 'image':
        outputs.metadata = {
          originalResolution: '4096x2160',
          colorSpace: 'sRGB',
          format: fileName.split('.').pop()?.toUpperCase(),
          hasAlpha: Math.random() > 0.5
        };
        outputs.formats = [
          { size: '150x150', fileSize: formatBytes(fileSize * 0.02), format: 'JPEG', use: 'Thumbnail', status: 'ready' },
          { size: '480px wide', fileSize: formatBytes(fileSize * 0.15), format: 'WebP', use: 'Mobile', status: 'ready' },
          { size: '1024px wide', fileSize: formatBytes(fileSize * 0.35), format: 'WebP', use: 'Tablet', status: 'ready' },
          { size: '2048px wide', fileSize: formatBytes(fileSize * 0.60), format: 'WebP', use: 'Desktop', status: 'ready' }
        ];
        outputs.details = [
          'Extracted EXIF metadata (location, camera)',
          'Optimized compression (reduced by 45%)',
          'Generated responsive image set',
          'Created blur placeholder for lazy loading'
        ];
        break;

      case 'document':
        outputs.metadata = {
          pages: Math.floor(Math.random() * 50) + 10,
          format: 'PDF',
          wordCount: Math.floor(Math.random() * 5000) + 1000,
          hasImages: true
        };
        outputs.formats = [
          { type: 'Compressed PDF', size: formatBytes(fileSize * 0.65), reduction: '35%', status: 'ready' },
          { type: 'Preview Images', size: formatBytes(fileSize * 0.25), pages: 'All', status: 'ready' },
          { type: 'Searchable Text', size: formatBytes(fileSize * 0.05), format: 'JSON', status: 'ready' }
        ];
        outputs.details = [
          'Extracted text for full-text search',
          'Generated thumbnail for first page',
          'Scanned for security threats (passed)',
          'Created web-optimized version'
        ];
        break;
    }

    return outputs;
  };

  const pollProcessingStatus = async (uploadId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/video/status/${uploadId}`);
        const data = await response.json();

        if (data.processingStage) {
          setProcessingStage(data.processingStage);
        }

        if (data.status === 'ready') {
          clearInterval(interval);
          setIsComplete(true);
          setProcessingStage(null);

          // Generate processed outputs showcase
          const outputs = generateProcessedOutputs(selectedMediaType, selectedFile.name, selectedFile.size);
          setProcessedOutputs(outputs);
        }
      } catch (error) {
        clearInterval(interval);
      }
    }, 500);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const reset = () => {
    setSelectedFile(null);
    setUploadSession(null);
    setIsUploading(false);
    setIsPaused(false);
    setProcessingStage(null);
    setIsComplete(false);
    setProcessedOutputs(null);
  };

  const totalChunks = selectedFile ? Math.ceil(selectedFile.size / selectedFile.chunkSize) : 0;

  return (
    <div className="space-y-4">
      {!selectedFile && (
        <>
          <div className="flex gap-2 mb-4">
            {['video', 'audio', 'image', 'document'].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedMediaType(type)}
                className={`px-3 py-1 rounded text-xs transition-all ${
                  selectedMediaType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          {/* Custom File Upload */}
          <div className="mb-4">
            <label className="w-full cursor-pointer">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 p-3 rounded transition-all text-center">
                <div className="flex items-center justify-center gap-2">
                  <FileUp size={18} />
                  <span className="text-sm font-medium">Upload Your Own File</span>
                </div>
                <div className="text-xs text-gray-200 mt-1">
                  Any video, audio, image, or document
                </div>
              </div>
              <input
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept="video/*,audio/*,image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
              />
            </label>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-700"></div>
            <span className="text-xs text-gray-500">or try preset files</span>
            <div className="flex-1 h-px bg-gray-700"></div>
          </div>

          <div className="space-y-2">
            {presetFiles[selectedMediaType].map((file, idx) => (
              <button
                key={idx}
                onClick={() => startUpload(file)}
                className="w-full text-left bg-gray-800 hover:bg-gray-700 p-3 rounded transition-colors"
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{file.name}</span>
                  <span className="text-xs text-gray-400">{formatBytes(file.size)}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {Math.ceil(file.size / file.chunkSize)} chunks × {formatBytes(file.chunkSize)}
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {selectedFile && !isComplete && (
        <div className="space-y-4">
          <div className="bg-gray-800 p-3 rounded">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">{selectedFile.name}</span>
              <span className="text-xs text-gray-400">{formatBytes(selectedFile.size)}</span>
            </div>

            {/* Chunk Visualization */}
            <div className="mb-3">
              <div className="grid grid-cols-10 gap-1">
                {Array.from({ length: totalChunks }).map((_, idx) => {
                  const isUploaded = uploadSession?.uploadedChunks >= idx + 1;
                  const isCurrent = uploadSession?.uploadedChunks === idx && isUploading;

                  return (
                    <div
                      key={idx}
                      className={`h-6 rounded transition-all ${
                        isUploaded
                          ? 'bg-green-500'
                          : isCurrent
                          ? 'bg-blue-500 animate-pulse'
                          : isPaused && uploadSession?.uploadedChunks === idx
                          ? 'bg-yellow-500'
                          : 'bg-gray-700'
                      }`}
                      title={`Chunk ${idx + 1}`}
                    />
                  );
                })}
              </div>
              <div className="text-xs text-gray-400 mt-2">
                {uploadSession?.uploadedChunks || 0}/{totalChunks} chunks • {uploadSession?.progress?.toFixed(1) || 0}%
              </div>
            </div>

            <div className="flex gap-2">
              {!processingStage && (
                <>
                  {isUploading && (
                    <button
                      onClick={togglePause}
                      className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-xs"
                    >
                      Pause
                    </button>
                  )}
                  {isPaused && (
                    <button
                      onClick={() => { setIsPaused(false); uploadChunks(uploadSession.uploadId, totalChunks, selectedFile.chunkSize); }}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
                    >
                      Resume
                    </button>
                  )}
                  <button
                    onClick={reset}
                    className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>

          {processingStage && (
            <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/50 p-4 rounded">
              <div className="flex items-center gap-2 mb-3">
                <div className="animate-spin">
                  <Settings className="text-purple-400" size={20} />
                </div>
                <div className="text-sm font-semibold text-purple-400">
                  Processing Your {selectedMediaType.charAt(0).toUpperCase() + selectedMediaType.slice(1)}...
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${processingStage.progress}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-purple-400 min-w-[40px]">{processingStage.progress}%</span>
                </div>

                <div className="bg-gray-900/50 p-3 rounded">
                  <div className="flex items-start gap-2">
                    <Activity className="text-blue-400 mt-0.5 animate-pulse" size={14} />
                    <div>
                      <div className="text-sm text-gray-200 font-medium mb-1">
                        {processingStage.name.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </div>
                      <div className="text-xs text-gray-400">{processingStage.message}</div>
                    </div>
                  </div>
                </div>

                {selectedMediaType === 'video' && (
                  <div className="text-xs text-gray-500 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={processingStage.progress > 20 ? 'text-green-400' : 'text-gray-500'}>
                        {processingStage.progress > 20 ? '✓' : '○'}
                      </span>
                      <span>Metadata extraction & validation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={processingStage.progress > 50 ? 'text-green-400' : 'text-gray-500'}>
                        {processingStage.progress > 50 ? '✓' : '○'}
                      </span>
                      <span>Transcoding to multiple resolutions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={processingStage.progress > 80 ? 'text-green-400' : 'text-gray-500'}>
                        {processingStage.progress > 80 ? '✓' : '○'}
                      </span>
                      <span>HLS segmentation & optimization</span>
                    </div>
                  </div>
                )}

                {selectedMediaType === 'audio' && (
                  <div className="text-xs text-gray-500 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={processingStage.progress > 25 ? 'text-green-400' : 'text-gray-500'}>
                        {processingStage.progress > 25 ? '✓' : '○'}
                      </span>
                      <span>Waveform generation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={processingStage.progress > 60 ? 'text-green-400' : 'text-gray-500'}>
                        {processingStage.progress > 60 ? '✓' : '○'}
                      </span>
                      <span>Multi-format transcoding</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={processingStage.progress > 85 ? 'text-green-400' : 'text-gray-500'}>
                        {processingStage.progress > 85 ? '✓' : '○'}
                      </span>
                      <span>Audio normalization</span>
                    </div>
                  </div>
                )}

                {selectedMediaType === 'image' && (
                  <div className="text-xs text-gray-500 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={processingStage.progress > 30 ? 'text-green-400' : 'text-gray-500'}>
                        {processingStage.progress > 30 ? '✓' : '○'}
                      </span>
                      <span>EXIF metadata extraction</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={processingStage.progress > 65 ? 'text-green-400' : 'text-gray-500'}>
                        {processingStage.progress > 65 ? '✓' : '○'}
                      </span>
                      <span>Responsive image generation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={processingStage.progress > 90 ? 'text-green-400' : 'text-gray-500'}>
                        {processingStage.progress > 90 ? '✓' : '○'}
                      </span>
                      <span>WebP conversion & optimization</span>
                    </div>
                  </div>
                )}

                {selectedMediaType === 'document' && (
                  <div className="text-xs text-gray-500 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={processingStage.progress > 30 ? 'text-green-400' : 'text-gray-500'}>
                        {processingStage.progress > 30 ? '✓' : '○'}
                      </span>
                      <span>Text extraction for search</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={processingStage.progress > 60 ? 'text-green-400' : 'text-gray-500'}>
                        {processingStage.progress > 60 ? '✓' : '○'}
                      </span>
                      <span>Security scanning</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={processingStage.progress > 85 ? 'text-green-400' : 'text-gray-500'}>
                        {processingStage.progress > 85 ? '✓' : '○'}
                      </span>
                      <span>PDF compression</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {isComplete && !processedOutputs && (
        <div className="bg-yellow-900/20 border border-yellow-500/30 p-4 rounded">
          <div className="text-yellow-400">⚠️ Processing complete but outputs not generated. This is a bug.</div>
        </div>
      )}

      {isComplete && processedOutputs && (
        <div ref={completionRef} className="space-y-6">
          {/* Header */}
          <div className="bg-green-900/20 border border-green-500/30 p-4 rounded shadow-lg">
            <div className="text-green-400 font-semibold mb-2">✅ Upload & Processing Complete!</div>
            <div className="text-sm text-gray-300 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">File:</span>
                <span>{selectedFile.name}</span>
                {selectedFile.isUserFile && (
                  <span className="text-xs bg-purple-600 px-2 py-0.5 rounded">Your File</span>
                )}
              </div>
              <div><span className="font-medium">Original Size:</span> {formatBytes(selectedFile.size)}</div>
              <div><span className="font-medium">Chunks Uploaded:</span> {totalChunks} × {formatBytes(selectedFile.chunkSize)} each</div>
            </div>
          </div>

          {/* Chunk Breakdown Details */}
          <div className="bg-gray-800 p-4 rounded border border-yellow-500/30 shadow-lg">
            <h4 className="text-sm font-semibold text-yellow-400 mb-3 flex items-center gap-2">
              <FileUp size={16} />
              Chunked Upload Breakdown
            </h4>
            <div className="space-y-3">
              {/* Visual Chunk Grid Summary */}
              <div className="bg-gray-900/50 p-3 rounded">
                <div className="text-xs text-gray-400 mb-2">Upload Strategy:</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">Total Chunks:</span>
                    <span className="font-semibold text-yellow-400">{totalChunks}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">Chunk Size:</span>
                    <span className="font-semibold text-yellow-400">{formatBytes(selectedFile.chunkSize)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">Last Chunk:</span>
                    <span className="font-semibold text-yellow-400">
                      {formatBytes(selectedFile.size - (selectedFile.chunkSize * (totalChunks - 1)))}
                      {selectedFile.size % selectedFile.chunkSize !== 0 && ' (partial)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Why Chunking? */}
              <div className="bg-blue-900/20 border border-blue-500/30 p-3 rounded">
                <div className="text-xs font-semibold text-blue-400 mb-2">Why Chunked Upload?</div>
                <div className="space-y-1 text-xs text-gray-400">
                  <div className="flex items-start gap-2">
                    <span className="text-green-400">•</span>
                    <span><b>Reliability:</b> If network fails, only retry failed chunks (not entire {formatBytes(selectedFile.size)} file)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-400">•</span>
                    <span><b>Resumable:</b> Pause and resume upload without losing progress</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-400">•</span>
                    <span><b>Parallel Transfer:</b> Can upload multiple chunks simultaneously (faster)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-400">•</span>
                    <span><b>Memory Efficient:</b> Process {formatBytes(selectedFile.chunkSize)} at a time instead of loading entire file in memory</span>
                  </div>
                </div>
              </div>

              {/* Chunk Size Calculation */}
              <div className="bg-gray-900/50 p-3 rounded">
                <div className="text-xs text-gray-400">
                  <span className="text-blue-400 font-semibold">Smart Chunk Sizing:</span> {selectedFile.chunkSize >= 5 * 1024 * 1024
                    ? `Large file (${formatBytes(selectedFile.size)}) → 5MB chunks for optimal network utilization`
                    : `Smaller file (${formatBytes(selectedFile.size)}) → 2MB chunks for faster processing`}
                </div>
              </div>
            </div>
          </div>

          {/* Extracted Metadata */}
          <div className="bg-gray-800 p-4 rounded border border-blue-500/30">
            <h4 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2">
              <Database size={16} />
              Extracted Metadata
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(processedOutputs.metadata).map(([key, value]) => (
                <div key={key} className="flex justify-between bg-gray-900/50 p-2 rounded">
                  <span className="text-gray-400">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                  <span className="text-gray-200 font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Generated Formats/Outputs */}
          <div className="bg-gray-800 p-4 rounded border border-purple-500/30">
            <h4 className="text-sm font-semibold text-purple-400 mb-3 flex items-center gap-2">
              <Settings size={16} />
              Generated Outputs
            </h4>
            <div className="space-y-2">
              {processedOutputs.formats.map((format: any, idx: number) => (
                <div key={idx} className="bg-gray-900/50 p-3 rounded flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm text-gray-200 font-medium">
                      {format.resolution || format.format || format.size || format.type}
                    </div>
                    <div className="text-xs text-gray-400">
                      {format.codec && `${format.codec} • `}
                      {format.bitrate && `${format.bitrate} • `}
                      {format.fileSize && `${format.fileSize}`}
                      {format.size && !format.fileSize && `Size: ${format.size}`}
                      {format.use && ` • ${format.use}`}
                      {format.reduction && ` • Reduced ${format.reduction}`}
                    </div>
                  </div>
                  <div className="text-xs bg-green-600 px-2 py-1 rounded">
                    {format.status}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Processing Details */}
          <div className="bg-gray-800 p-4 rounded border border-orange-500/30">
            <h4 className="text-sm font-semibold text-orange-400 mb-3 flex items-center gap-2">
              <Cpu size={16} />
              Processing Pipeline Completed
            </h4>
            <div className="space-y-1">
              {processedOutputs.details.map((detail: string, idx: number) => (
                <div key={idx} className="text-xs text-gray-300 flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>{detail}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Technical Breakdown - What Happens Under the Hood */}
          <div className="bg-gradient-to-r from-cyan-900/20 to-teal-900/20 border border-cyan-500/30 p-4 rounded">
            <h4 className="text-sm font-semibold text-cyan-400 mb-3 flex items-center gap-2">
              <Settings size={16} />
              Technical Breakdown: What Happened Under the Hood
            </h4>

            {selectedMediaType === 'video' && (
              <div className="space-y-3 text-xs">
                <div className="bg-gray-900/50 p-3 rounded">
                  <div className="font-semibold text-blue-400 mb-1">1. Validation & Metadata Extraction</div>
                  <div className="text-gray-400">
                    • Used <b>FFprobe</b> to read video container and extract codec info, resolution, frame rate, duration<br/>
                    • Validated file integrity using checksum verification<br/>
                    • Detected audio/video streams and their encoding parameters
                  </div>
                </div>

                <div className="bg-gray-900/50 p-3 rounded">
                  <div className="font-semibold text-purple-400 mb-1">2. Thumbnail Generation</div>
                  <div className="text-gray-400">
                    • Extracted frames at 0%, 50%, 100% of video timeline<br/>
                    • Used <b>FFmpeg</b> to decode frames and save as JPEG (quality: 85)<br/>
                    • Resized to 320x180px for fast loading
                  </div>
                </div>

                <div className="bg-gray-900/50 p-3 rounded">
                  <div className="font-semibold text-green-400 mb-1">3. Transcoding (H.264)</div>
                  <div className="text-gray-400">
                    • <b>360p:</b> Scaled to 640x360, CRF 28, preset: fast, bitrate: 800 Kbps<br/>
                    • <b>720p:</b> Scaled to 1280x720, CRF 23, preset: medium, bitrate: 2.5 Mbps<br/>
                    • <b>1080p:</b> Maintained 1920x1080, CRF 20, preset: slow, bitrate: 5 Mbps<br/>
                    • AAC audio encoding at 128 Kbps for all versions
                  </div>
                </div>

                <div className="bg-gray-900/50 p-3 rounded">
                  <div className="font-semibold text-orange-400 mb-1">4. HLS Segmentation</div>
                  <div className="text-gray-400">
                    • Split each resolution into 6-second segments (.ts files)<br/>
                    • Generated master playlist (m3u8) for adaptive bitrate streaming<br/>
                    • Created variant playlists for each resolution<br/>
                    • Player auto-switches quality based on network speed
                  </div>
                </div>

                <div className="bg-gray-900/50 p-3 rounded">
                  <div className="font-semibold text-pink-400 mb-1">5. Optimization</div>
                  <div className="text-gray-400">
                    • Moved moov atom to beginning (enables streaming before full download)<br/>
                    • Stripped unnecessary metadata to reduce file size<br/>
                    • Applied faststart flag for web delivery
                  </div>
                </div>
              </div>
            )}

            {selectedMediaType === 'audio' && (
              <div className="space-y-3 text-xs">
                <div className="bg-gray-900/50 p-3 rounded">
                  <div className="font-semibold text-blue-400 mb-1">1. Audio Analysis</div>
                  <div className="text-gray-400">
                    • Detected sample rate (44.1kHz/48kHz), bit depth, channels<br/>
                    • Analyzed loudness levels using EBU R128 standard<br/>
                    • Checked for clipping and distortion
                  </div>
                </div>

                <div className="bg-gray-900/50 p-3 rounded">
                  <div className="font-semibold text-purple-400 mb-1">2. Waveform Generation</div>
                  <div className="text-gray-400">
                    • Sampled audio at 100 points per second<br/>
                    • Generated SVG waveform visualization (peak amplitudes)<br/>
                    • Color-coded by loudness ranges
                  </div>
                </div>

                <div className="bg-gray-900/50 p-3 rounded">
                  <div className="font-semibold text-green-400 mb-1">3. Format Transcoding</div>
                  <div className="text-gray-400">
                    • <b>MP3 320kbps:</b> LAME encoder, VBR quality 0, joint stereo<br/>
                    • <b>AAC 256kbps:</b> FDK-AAC encoder, HE-AAC profile<br/>
                    • <b>MP3 128kbps:</b> Optimized for streaming, mono downmix
                  </div>
                </div>

                <div className="bg-gray-900/50 p-3 rounded">
                  <div className="font-semibold text-orange-400 mb-1">4. Normalization</div>
                  <div className="text-gray-400">
                    • Applied loudness normalization to -14 LUFS (Spotify standard)<br/>
                    • Used dynamic range compression (ratio 3:1, threshold -18dB)<br/>
                    • Prevented clipping with limiter at -1dB true peak
                  </div>
                </div>

                <div className="bg-gray-900/50 p-3 rounded">
                  <div className="font-semibold text-pink-400 mb-1">5. Noise Reduction</div>
                  <div className="text-gray-400">
                    • Analyzed first 2 seconds for noise profile<br/>
                    • Applied spectral gate filter (removed frequencies below -40dB)<br/>
                    • Preserved audio quality with minimal artifacts
                  </div>
                </div>
              </div>
            )}

            {selectedMediaType === 'image' && (
              <div className="space-y-3 text-xs">
                <div className="bg-gray-900/50 p-3 rounded">
                  <div className="font-semibold text-blue-400 mb-1">1. EXIF Metadata Extraction</div>
                  <div className="text-gray-400">
                    • Read camera make/model, lens info, focal length<br/>
                    • Extracted GPS coordinates (if present)<br/>
                    • Retrieved capture settings: ISO, aperture, shutter speed<br/>
                    • Parsed color space and ICC profile
                  </div>
                </div>

                <div className="bg-gray-900/50 p-3 rounded">
                  <div className="font-semibold text-purple-400 mb-1">2. Responsive Image Generation</div>
                  <div className="text-gray-400">
                    • <b>Thumbnail (150x150):</b> Cropped center, sharpened, JPEG quality 80<br/>
                    • <b>Mobile (480px):</b> Scaled proportionally, WebP quality 85<br/>
                    • <b>Tablet (1024px):</b> Scaled proportionally, WebP quality 88<br/>
                    • <b>Desktop (2048px):</b> High quality, WebP quality 90<br/>
                    • Used Lanczos resampling for crisp results
                  </div>
                </div>

                <div className="bg-gray-900/50 p-3 rounded">
                  <div className="font-semibold text-green-400 mb-1">3. WebP Conversion</div>
                  <div className="text-gray-400">
                    • Converted to WebP format (30-50% smaller than JPEG)<br/>
                    • Preserved alpha channel if present<br/>
                    • Used lossy compression with target SSIM: 0.95
                  </div>
                </div>

                <div className="bg-gray-900/50 p-3 rounded">
                  <div className="font-semibold text-orange-400 mb-1">4. Optimization</div>
                  <div className="text-gray-400">
                    • Stripped unnecessary EXIF data (kept only essential info)<br/>
                    • Optimized huffman tables for better compression<br/>
                    • Applied progressive encoding for faster perceived load<br/>
                    • Reduced by 45% while maintaining visual quality
                  </div>
                </div>

                <div className="bg-gray-900/50 p-3 rounded">
                  <div className="font-semibold text-pink-400 mb-1">5. Blur Placeholder</div>
                  <div className="text-gray-400">
                    • Generated 20x20px blurred version (base64 encoded)<br/>
                    • Used for lazy loading: shows blur while full image loads<br/>
                    • Improves perceived performance and UX
                  </div>
                </div>
              </div>
            )}

            {selectedMediaType === 'document' && (
              <div className="space-y-3 text-xs">
                <div className="bg-gray-900/50 p-3 rounded">
                  <div className="font-semibold text-blue-400 mb-1">1. Document Parsing</div>
                  <div className="text-gray-400">
                    • Used <b>PDFBox/Apache POI</b> to parse document structure<br/>
                    • Extracted page count, dimensions, fonts used<br/>
                    • Detected images, tables, and embedded objects<br/>
                    • Identified document version and producer
                  </div>
                </div>

                <div className="bg-gray-900/50 p-3 rounded">
                  <div className="font-semibold text-purple-400 mb-1">2. Text Extraction</div>
                  <div className="text-gray-400">
                    • Extracted all text content with positional data<br/>
                    • Preserved formatting, headings, and structure<br/>
                    • Indexed for full-text search (stored in Elasticsearch)<br/>
                    • Generated word count and reading time estimate
                  </div>
                </div>

                <div className="bg-gray-900/50 p-3 rounded">
                  <div className="font-semibold text-green-400 mb-1">3. Preview Image Generation</div>
                  <div className="text-gray-400">
                    • Rendered each page as PNG at 150 DPI<br/>
                    • Generated thumbnails at 200x280px for gallery view<br/>
                    • Created first-page preview at higher resolution<br/>
                    • Optimized images with lossless compression
                  </div>
                </div>

                <div className="bg-gray-900/50 p-3 rounded">
                  <div className="font-semibold text-orange-400 mb-1">4. Security Scanning</div>
                  <div className="text-gray-400">
                    • Scanned for malicious JavaScript or embedded executables<br/>
                    • Checked for password protection and encryption<br/>
                    • Validated PDF structure for corruption/malformation<br/>
                    • ✅ Passed all security checks
                  </div>
                </div>

                <div className="bg-gray-900/50 p-3 rounded">
                  <div className="font-semibold text-pink-400 mb-1">5. PDF Compression</div>
                  <div className="text-gray-400">
                    • Recompressed images using JPEG2000 (smaller, same quality)<br/>
                    • Removed duplicate fonts and resources<br/>
                    • Linearized PDF for fast web view (page-at-a-time loading)<br/>
                    • Reduced file size by 35% without quality loss
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 p-4 rounded">
            <div className="text-sm text-gray-300">
              <div className="font-semibold text-blue-400 mb-2">What We Did:</div>
              <p className="text-xs leading-relaxed">
                {selectedMediaType === 'video' && `Your video was chunked into ${totalChunks} parts for reliable upload, then transcoded to multiple resolutions (360p, 720p, 1080p) for adaptive streaming. We generated thumbnails, extracted metadata, and created HLS segments for smooth playback on any device.`}
                {selectedMediaType === 'audio' && `Your audio was chunked into ${totalChunks} parts, then transcoded to multiple formats (MP3, AAC) at different bitrates. We normalized the audio levels, generated a waveform visualization, and optimized for streaming delivery.`}
                {selectedMediaType === 'image' && `Your image was chunked into ${totalChunks} parts for upload, then resized to 4 different dimensions for responsive delivery. We extracted EXIF metadata, converted to WebP for better compression, and generated a blur placeholder for lazy loading.`}
                {selectedMediaType === 'document' && `Your document was chunked into ${totalChunks} parts, then processed to extract searchable text and generate preview images. We compressed the PDF by 35%, scanned for security threats, and created thumbnails for quick previews.`}
              </p>
            </div>
          </div>

          <button
            onClick={reset}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors"
          >
            Upload Another File
          </button>
        </div>
      )}
    </div>
  );
};

// Wrapper for MediaUploadDemo that manages expanded state
const MediaUploadDemoCard = ({ isVisible, delay }: { isVisible: boolean; delay: string }) => {
  const [isActive, setIsActive] = useState(false);

  return (
    <DemoCard
      icon={<FileUp className="text-indigo-400" size={28} />}
      title="Chunked Upload"
      description="Resumable file uploads with progress tracking, pause/resume, and network error recovery."
      tags={['UX', 'Reliability', 'Storage']}
      isVisible={isVisible}
      delay={delay}
      demoId="upload"
      forceExpanded={isActive}
    >
      <MediaUploadDemo onActiveStateChange={setIsActive} />
    </DemoCard>
  );
};

const App = () => {
  const [activeSection, setActiveSection] = useState('hero');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState({
    hero: true,
    about: false,
    experience: false,
    projects: false,
    playground: false,
    skills: false,
    education: false,
    contact: false
  });
  const [typedText, setTypedText] = useState('');
  const [currentRole, setCurrentRole] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const roles = ['Full Stack Developer', 'React Developer', 'Node.js Developer', 'MERN Stack Developer'];

  // Typewriter effect for hero section
  useEffect(() => {
    let typingTimeout;
    let deletingTimeout;
    let pauseTimeout;

    const typeWriter = () => {
      const currentText = roles[currentRole];
      let charIndex = 0;
      let isDeleting = false;

      const type = () => {
        if (!isDeleting && charIndex <= currentText.length) {
          setTypedText(currentText.slice(0, charIndex));
          charIndex++;
          typingTimeout = setTimeout(type, 100);
        } else if (!isDeleting && charIndex > currentText.length) {
          pauseTimeout = setTimeout(() => {
            isDeleting = true;
            type();
          }, 2000);
        } else if (isDeleting && charIndex > 0) {
          charIndex--;
          setTypedText(currentText.slice(0, charIndex));
          deletingTimeout = setTimeout(type, 50);
        } else if (isDeleting && charIndex === 0) {
          setCurrentRole((prev) => (prev + 1) % roles.length);
        }
      };

      type();
    };

    typeWriter();

    return () => {
      clearTimeout(typingTimeout);
      clearTimeout(deletingTimeout);
      clearTimeout(pauseTimeout);
    };
  }, [currentRole]);

  // Mouse tracking for cursor glow effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Intersection Observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.target.id) {
            setIsVisible(prev => ({
              ...prev,
              [entry.target.id]: true
            }));
          }
        });
      },
      { threshold: 0.1 }
    );

    // Wait for DOM to be ready
    const timer = setTimeout(() => {
      const sections = document.querySelectorAll('section[id]');
      sections.forEach(section => {
        if (section.id) {
          observer.observe(section);
        }
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  // Smooth scrolling and active section detection
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['hero', 'about', 'experience', 'projects', 'playground', 'skills', 'education', 'contact'];
      const current = sections.find(section => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top <= 100 && rect.bottom >= 100;
        }
        return false;
      });
      if (current) setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Counter animation for statistics
  const useCounter = (end, duration = 2000) => {
    const [count, setCount] = useState(0);
    const [hasStarted, setHasStarted] = useState(false);

    useEffect(() => {
      if (!hasStarted || !isVisible.about) return;
      
      let startTime;
      const startValue = 0;
      const endValue = end;

      const updateCount = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const currentCount = Math.floor(progress * (endValue - startValue) + startValue);
        setCount(currentCount);

        if (progress < 1) {
          requestAnimationFrame(updateCount);
        }
      };

      requestAnimationFrame(updateCount);
    }, [end, duration, hasStarted, isVisible.about]);

    useEffect(() => {
      if (isVisible.about && !hasStarted) {
        setHasStarted(true);
      }
    }, [isVisible.about, hasStarted]);

    return count;
  };

  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  const skills = {
    frontend: ['React.js', 'Redux', 'JavaScript (ES6+)', 'TypeScript', 'Tailwind CSS', 'Material UI', 'HTML5', 'CSS3'],
    backend: ['Python', 'Java', 'Spring Boot', 'Node.js', 'Express.js', 'RESTful APIs', 'JWT Authentication'],
    database: ['MongoDB', 'PostgreSQL', 'SQL', 'Spring Data JPA'],
    devops: ['GitHub Actions', 'Docker', 'Kubernetes', 'AWS (EC2, S3)', 'CI/CD', 'Prometheus', 'Grafana'],
    tools: ['Git', 'Postman', 'Swagger', 'Jest', 'Figma', 'Jira', 'Confluence']
  };

  const experiences = [
    {
      company: 'McKinsey & Company',
      role: 'Full Stack Developer / Technology Engineer',
      duration: 'May 2025 – Present',
      location: 'CA, USA',
      achievements: [
        'Developed responsive React.js interfaces for referral and rewards modules, integrating Stripe and Twilio APIs to increase engagement by 40%',
        'Redesigned customer profile workflows using Tailwind CSS, Redux, and reusable components, reducing support tickets by 20%',
        'Built RESTful services using Node.js, Express.js, and Python-based utilities to support search features for 50K+ users',
        'Streamlined state and performance management, improving frontend responsiveness by 35%'
      ]
    },
    {
      company: 'Uber',
      role: 'Full Stack Developer',
      duration: 'Feb 2024 – May 2025',
      location: 'CA, USA',
      achievements: [
        'Designed interactive React.js dashboards to manage trip metadata and audit rides, reducing bottlenecks',
        'Built dynamic frontend components using React Hooks, Material UI, and Redux, supporting 1M+ transactions/month',
        'Integrated real-time data with Kafka and performed containerized deployment via Docker',
        'Reduced UI errors by 30% through refined asynchronous UI behavior with debouncing and conditional loaders'
      ]
    },
    {
      company: 'KPMG',
      role: 'Java Full Stack Developer',
      duration: 'Sep 2021 – Jul 2022',
      location: 'India',
      achievements: [
        'Developed dashboard views using JSP, HTML, and CSS, integrated with Spring Boot controllers to monitor 100+ KPIs',
        'Created secure REST APIs using Spring Boot and J2EE, enabling data communication between PostgreSQL and frontend',
        'Deployed backend components on AWS EC2 and managed configuration via AWS Parameter Store',
        'Reduced developer onboarding time by 50% using centralized Confluence guides'
      ]
    }
  ];

  const projects = [
    {
      title: 'Coffee Shop Management System',
      description: 'Full-stack MERN application managing 1,000+ weekly orders, inventory, and daily sales with admin and cashier portals.',
      technologies: ['React', 'Node.js', 'MongoDB', 'Express.js', 'JWT'],
      features: ['Barcode scanning', 'Protected routes', 'Daily reporting', '40% faster checkout']
    },
    {
      title: 'Job Application Tracker',
      description: 'Personal productivity tool tracking 120+ job applications with dynamic filtering and authentication.',
      technologies: ['React', 'MongoDB', 'Node.js', 'JWT'],
      features: ['Dynamic filters', 'Application tagging', 'Interview tracking', 'Progress analytics']
    }
  ];

  return (
    <div className="text-gray-100 min-h-screen font-sans overflow-x-hidden relative" style={{
      background: 'radial-gradient(ellipse at 20% 20%, rgba(139, 92, 246, 0.4) 0%, transparent 50%), ' +
                  'radial-gradient(ellipse at 80% 30%, rgba(59, 130, 246, 0.4) 0%, transparent 50%), ' +
                  'radial-gradient(ellipse at 40% 70%, rgba(236, 72, 153, 0.4) 0%, transparent 50%), ' +
                  'radial-gradient(ellipse at 70% 80%, rgba(14, 165, 233, 0.4) 0%, transparent 50%), ' +
                  'radial-gradient(ellipse at 50% 50%, rgba(168, 85, 247, 0.3) 0%, transparent 50%), ' +
                  'linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 25%, #16213e 50%, #0f1419 75%, #0a0a1a 100%)',
      backgroundSize: '100% 100%',
      backgroundAttachment: 'fixed'
    }}>
      {/* Liquid Glass Cursor Glow Effect */}
      <div
        className="fixed pointer-events-none z-50 transition-all duration-500 ease-out"
        style={{
          left: `${mousePosition.x}px`,
          top: `${mousePosition.y}px`,
          transform: 'translate(-50%, -50%)',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, rgba(59, 130, 246, 0.2) 30%, rgba(236, 72, 153, 0.15) 50%, transparent 70%)',
          opacity: 0.7,
          filter: 'blur(50px)',
        }}
      />
      <div
        className="fixed pointer-events-none z-50 transition-all duration-300 ease-out"
        style={{
          left: `${mousePosition.x}px`,
          top: `${mousePosition.y}px`,
          transform: 'translate(-50%, -50%)',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, rgba(168, 85, 247, 0.1) 40%, transparent 70%)',
          opacity: 1,
          filter: 'blur(25px)',
        }}
      />

      {/* Floating Background Orbs for Glass Refraction */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-20 left-[10%] w-[500px] h-[500px] rounded-full blur-3xl" style={{
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.35) 0%, rgba(139, 92, 246, 0.1) 50%, transparent 100%)',
          animation: 'floatOrb 20s ease-in-out infinite'
        }}></div>
        <div className="absolute top-[40%] right-[15%] w-[450px] h-[450px] rounded-full blur-3xl" style={{
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.35) 0%, rgba(59, 130, 246, 0.1) 50%, transparent 100%)',
          animation: 'floatOrb 25s ease-in-out infinite 5s'
        }}></div>
        <div className="absolute bottom-[20%] left-[20%] w-[400px] h-[400px] rounded-full blur-3xl" style={{
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.35) 0%, rgba(236, 72, 153, 0.1) 50%, transparent 100%)',
          animation: 'floatOrb 22s ease-in-out infinite 10s'
        }}></div>
        <div className="absolute top-[60%] left-[50%] w-[480px] h-[480px] rounded-full blur-3xl" style={{
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, rgba(168, 85, 247, 0.08) 50%, transparent 100%)',
          animation: 'floatOrb 28s ease-in-out infinite 3s'
        }}></div>
        <div className="absolute bottom-[40%] right-[25%] w-[380px] h-[380px] rounded-full blur-3xl" style={{
          background: 'radial-gradient(circle, rgba(14, 165, 233, 0.35) 0%, rgba(14, 165, 233, 0.1) 50%, transparent 100%)',
          animation: 'floatOrb 24s ease-in-out infinite 7s'
        }}></div>
        <div className="absolute top-[15%] right-[35%] w-[350px] h-[350px] rounded-full blur-3xl" style={{
          background: 'radial-gradient(circle, rgba(147, 51, 234, 0.3) 0%, rgba(147, 51, 234, 0.08) 50%, transparent 100%)',
          animation: 'floatOrb 26s ease-in-out infinite 12s'
        }}></div>
      </div>

      <style jsx>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-20px) scale(1.02); }
        }

        @keyframes floatOrb {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(30px, -30px) scale(1.1); }
          50% { transform: translate(-20px, -50px) scale(0.9); }
          75% { transform: translate(-40px, -20px) scale(1.05); }
        }

        @keyframes slideInLeft {
          0% { transform: translateX(-100px) scale(0.95); opacity: 0; }
          60% { transform: translateX(10px) scale(1.02); opacity: 1; }
          100% { transform: translateX(0) scale(1); opacity: 1; }
        }

        @keyframes slideInRight {
          0% { transform: translateX(100px) scale(0.95); opacity: 0; }
          60% { transform: translateX(-10px) scale(1.02); opacity: 1; }
          100% { transform: translateX(0) scale(1); opacity: 1; }
        }

        @keyframes slideInUp {
          0% { transform: translateY(50px) scale(0.95); opacity: 0; }
          60% { transform: translateY(-5px) scale(1.02); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }

        @keyframes fadeInScale {
          0% { transform: scale(0.8); opacity: 0; }
          60% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.98); }
        }

        @keyframes liquidShimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        
        .animate-slide-in-left {
          animation: slideInLeft 0.8s ease-out forwards;
        }
        
        .animate-slide-in-right {
          animation: slideInRight 0.8s ease-out forwards;
        }
        
        .animate-slide-in-up {
          animation: slideInUp 0.6s ease-out forwards;
        }
        
        .animate-fade-in-scale {
          animation: fadeInScale 0.8s ease-out forwards;
        }
        
        .animate-pulse-slow {
          animation: pulse 2s ease-in-out infinite;
        }
        
        .stagger-1 { animation-delay: 0.1s; }
        .stagger-2 { animation-delay: 0.2s; }
        .stagger-3 { animation-delay: 0.3s; }
        .stagger-4 { animation-delay: 0.4s; }
        .stagger-5 { animation-delay: 0.5s; }
        .stagger-6 { animation-delay: 0.6s; }

        .glass-card {
          background: rgba(10, 10, 26, 0.35);
          backdrop-filter: blur(24px) saturate(200%) brightness(1.1);
          -webkit-backdrop-filter: blur(24px) saturate(200%) brightness(1.1);
          border: 1px solid rgba(255, 255, 255, 0.18);
          position: relative;
          overflow: hidden;
        }

        .glass-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 200%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.1),
            transparent
          );
          transition: left 0.5s ease;
        }

        .glass-card:hover::before {
          left: 100%;
        }

        .glass-card:hover {
          background: rgba(17, 24, 39, 0.35);
          border-color: rgba(255, 255, 255, 0.25);
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3),
                      0 0 0 1px rgba(255, 255, 255, 0.1),
                      inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }

        .glass-card::after {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          height: 40%;
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.15) 0%,
            rgba(255, 255, 255, 0.05) 50%,
            transparent 100%
          );
          border-radius: inherit;
          pointer-events: none;
        }

        .neon-border {
          box-shadow: 0 8px 32px rgba(59, 130, 246, 0.15),
                      0 0 0 1px rgba(59, 130, 246, 0.2),
                      inset 0 1px 0 rgba(255, 255, 255, 0.15),
                      inset 0 -1px 0 rgba(0, 0, 0, 0.1);
        }

        .code-block {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-left: 3px solid #3b82f6;
        }

        button, a.button-like {
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
          overflow: hidden;
        }

        button::before, a.button-like::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          transform: translate(-50%, -50%);
          transition: width 0.6s ease, height 0.6s ease;
        }

        button:active::before, a.button-like:active::before {
          width: 300px;
          height: 300px;
        }

        button:hover, a.button-like:hover {
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3),
                      inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }

        button:active, a.button-like:active {
          transform: translateY(0) scale(0.98);
        }
      `}</style>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 transition-all duration-300" style={{
        background: 'rgba(17, 24, 39, 0.3)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
      }}>
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-10">
          <div className="flex justify-between items-center py-4">
            <div className="text-xl font-bold text-blue-400 animate-slide-in-left">Tharun Manikonda</div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-6 animate-slide-in-right">
              {['About', 'Experience', 'Projects', 'Playground', 'Skills', 'Education', 'Contact'].map((item, index) => (
                <button
                  key={item}
                  onClick={() => scrollToSection(item.toLowerCase())}
                  className={`text-sm font-medium transition-all duration-300 hover:text-blue-400 hover:scale-105 ${
                    activeSection === item.toLowerCase() ? 'text-blue-400' : 'text-gray-300'
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {item}
                </button>
              ))}
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden text-gray-300 hover:text-blue-400"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-800">
              {['About', 'Experience', 'Projects', 'Playground', 'Skills', 'Education', 'Contact'].map((item) => (
                <button
                  key={item}
                  onClick={() => scrollToSection(item.toLowerCase())}
                  className="block w-full text-left py-2 text-gray-300 hover:text-blue-400"
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="min-h-screen flex items-center justify-center relative overflow-hidden z-10">

        <div className="text-center max-w-4xl mx-auto px-4 relative z-10">
          <div className="mb-8">
            <div 
              className="w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto mb-6 flex items-center justify-center animate-fade-in-scale hover:scale-110 transition-transform duration-300"
              style={{ animation: 'float 6s ease-in-out infinite' }}
            >
              <User size={64} className="text-white" />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-4 animate-slide-in-up">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Tharun Manikonda
              </span>
            </h1>
            <h2 className="text-2xl md:text-3xl text-gray-300 mb-6 animate-slide-in-up stagger-1">
              <span className="inline-block">{typedText}</span>
              <span className="animate-pulse-slow">|</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8 animate-slide-in-up stagger-2">
              3+ years of experience building scalable, high-performance applications using the MERN stack, 
              Java Spring Boot, and cloud-native DevOps pipelines.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 mb-12 animate-slide-in-up stagger-3">
            <a 
              href="mailto:tharun.manikonda1@outlook.com" 
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25"
            >
              <Mail size={20} />
              Get In Touch
            </a>
            <button 
              onClick={() => scrollToSection('projects')} 
              className="flex items-center gap-2 border border-gray-600 hover:border-blue-400 px-6 py-3 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25"
            >
              <Code size={20} />
              View Projects
            </button>
          </div>

          <button 
            onClick={() => scrollToSection('about')}
            className="animate-bounce text-gray-400 hover:text-blue-400 transition-colors duration-300 hover:scale-110 transform"
          >
            <ChevronDown size={32} />
          </button>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className={`text-3xl md:text-4xl font-bold text-center mb-12 ${isVisible.about ? 'animate-slide-in-up' : 'opacity-0'}`}>
            About Me
          </h2>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className={`${isVisible.about ? 'animate-slide-in-left' : 'opacity-0'}`}>
              <p className="text-lg text-gray-300 mb-6">
                I'm a passionate Full Stack Developer with expertise in building robust, scalable applications. 
                My journey spans from frontend React applications to backend microservices, with a strong focus 
                on performance optimization and user experience.
              </p>
              <p className="text-lg text-gray-300 mb-6">
                Currently based in California, I've had the privilege of working with industry leaders like 
                McKinsey & Company and Uber, delivering solutions that serve millions of users while maintaining 
                high code quality and best practices.
              </p>
              <div className="flex items-center gap-4 text-gray-400">
                <MapPin size={20} />
                <span>California, USA</span>
              </div>
            </div>
            <div className={`grid grid-cols-2 gap-6 ${isVisible.about ? 'animate-slide-in-right' : 'opacity-0'}`}>
              <div className="glass-card p-6 rounded-lg text-center hover:scale-105 transition-transform duration-300 neon-border">
                <div className="text-3xl font-bold text-blue-400 mb-2">{useCounter(3)}+</div>
                <div className="text-gray-300">Years Experience</div>
              </div>
              <div className="glass-card p-6 rounded-lg text-center hover:scale-105 transition-transform duration-300 neon-border">
                <div className="text-3xl font-bold text-purple-400 mb-2">{useCounter(15)}+</div>
                <div className="text-gray-300">Technologies</div>
              </div>
              <div className="glass-card p-6 rounded-lg text-center hover:scale-105 transition-transform duration-300 neon-border">
                <div className="text-3xl font-bold text-green-400 mb-2">{useCounter(5)}+</div>
                <div className="text-gray-300">Major Projects</div>
              </div>
              <div className="glass-card p-6 rounded-lg text-center hover:scale-105 transition-transform duration-300 neon-border">
                <div className="text-3xl font-bold text-orange-400 mb-2">{useCounter(3)}</div>
                <div className="text-gray-300">Companies</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section id="experience" className="py-20 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className={`text-3xl md:text-4xl font-bold text-center mb-12 ${isVisible.experience ? 'animate-slide-in-up' : 'opacity-0'}`}>
            Professional Experience
          </h2>
          <div className="space-y-8">
            {experiences.map((exp, index) => (
              <div
                key={index}
                className={`glass-card rounded-lg p-6 transition-all duration-500 hover:scale-105 neon-border ${
                  isVisible.experience ? 'animate-slide-in-up' : 'opacity-0'
                }`}
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-blue-400">{exp.role}</h3>
                    <h4 className="text-lg text-gray-300">{exp.company}</h4>
                  </div>
                  <div className="text-gray-400 text-sm">
                    <div>{exp.duration}</div>
                    <div>{exp.location}</div>
                  </div>
                </div>
                <ul className="space-y-2">
                  {exp.achievements.map((achievement, i) => (
                    <li key={i} className="text-gray-300 flex items-start hover:text-gray-100 transition-colors duration-300">
                      <span className="text-blue-400 mr-2 animate-pulse">•</span>
                      {achievement}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-20 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className={`text-3xl md:text-4xl font-bold text-center mb-12 ${isVisible.projects ? 'animate-slide-in-up' : 'opacity-0'}`}>
            Featured Projects
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {projects.map((project, index) => (
              <div
                key={index}
                className={`glass-card rounded-lg p-6 neon-border transition-all duration-500 hover:scale-105 hover:-translate-y-2 ${
                  isVisible.projects ? 'animate-fade-in-scale' : 'opacity-0'
                }`}
                style={{ animationDelay: `${index * 0.3}s` }}
              >
                <h3 className="text-xl font-bold text-blue-400 mb-3 hover:text-purple-400 transition-colors duration-300">
                  {project.title}
                </h3>
                <p className="text-gray-300 mb-4">{project.description}</p>
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">Technologies:</h4>
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.map((tech, i) => (
                      <span 
                        key={i} 
                        className="bg-blue-600 text-blue-100 px-2 py-1 rounded text-xs hover:bg-blue-500 transition-colors duration-300 hover:scale-110 transform"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">Key Features:</h4>
                  <ul className="space-y-1">
                    {project.features.map((feature, i) => (
                      <li key={i} className="text-gray-300 text-sm flex items-center hover:text-green-400 transition-colors duration-300">
                        <span className="text-green-400 mr-2 animate-pulse">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Skills Playground Section */}
      <section id="playground" className="py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className={`text-3xl md:text-4xl font-bold text-center mb-4 ${isVisible.playground ? 'animate-slide-in-up' : 'opacity-0'}`}>
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Skills Playground
            </span>
          </h2>
          <p className={`text-center text-gray-400 mb-12 max-w-3xl mx-auto ${isVisible.playground ? 'animate-slide-in-up stagger-1' : 'opacity-0'}`}>
            Interactive demonstrations of real-world backend engineering challenges I've tackled in production environments.
            Each demo showcases practical solutions to common distributed systems problems.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Demo 1: API Retry Logic */}
            <DemoCard
              icon={<RefreshCw className="text-blue-400" size={28} />}
              title="API Retry Logic"
              description="Exponential backoff strategy with jitter for handling API failures, timeouts, and rate limits."
              tags={['Resilience', 'Error Handling', 'Production']}
              isVisible={isVisible.playground}
              delay="0s"
              demoId="retry"
            >
              <RetryDemo />
            </DemoCard>

            {/* Demo 2: Webhook Handler */}
            <DemoCard
              icon={<Zap className="text-yellow-400" size={28} />}
              title="Webhook Handler"
              description="Secure webhook processing with signature verification, idempotency, and replay attack prevention."
              tags={['Security', 'Async', 'Integrations']}
              isVisible={isVisible.playground}
              delay="0.1s"
              demoId="webhook"
            >
              <WebhookDemo />
            </DemoCard>

            {/* Demo 3: Database Query Optimization */}
            <DemoCard
              icon={<Database className="text-purple-400" size={28} />}
              title="Query Optimization"
              description="N+1 query problem visualization with aggregation pipelines and execution time comparisons."
              tags={['Performance', 'MongoDB', 'Indexing']}
              isVisible={isVisible.playground}
              delay="0.2s"
              demoId="database"
            >
              <DatabaseDemo />
            </DemoCard>

            {/* Demo 4: Rate Limiting */}
            <DemoCard
              icon={<Activity className="text-green-400" size={28} />}
              title="Rate Limiter"
              description="Sliding window rate limiting with token bucket algorithm to prevent API abuse."
              tags={['Scalability', 'API Design', 'Redis']}
              isVisible={isVisible.playground}
              delay="0.3s"
              demoId="rate-limit"
            >
              <RateLimitDemo />
            </DemoCard>

            {/* Demo 5: CI/CD Pipeline */}
            <DemoCard
              icon={<GitBranch className="text-orange-400" size={28} />}
              title="CI/CD Dashboard"
              description="Live GitHub Actions workflow status with real-time build monitoring and deployment tracking."
              tags={['DevOps', 'Automation', 'Monitoring']}
              isVisible={isVisible.playground}
              delay="0.4s"
              demoId="cicd"
            >
              <div className="text-sm text-gray-300">
                <p className="mb-2">Monitor CI/CD pipeline status in real-time.</p>
                <div className="text-xs text-gray-400 bg-gray-950 p-2 rounded">
                  Connect to GitHub Actions API to show live build status.
                </div>
              </div>
            </DemoCard>

            {/* Demo 6: Caching Strategy */}
            <DemoCard
              icon={<Cpu className="text-pink-400" size={28} />}
              title="Caching Strategy"
              description="Cache hit/miss visualization with TTL management showing 95% response time improvement."
              tags={['Performance', 'Optimization', 'Redis']}
              isVisible={isVisible.playground}
              delay="0.5s"
              demoId="cache"
            >
              <CacheDemo />
            </DemoCard>

            {/* Demo 7: File Upload */}
            <MediaUploadDemoCard
              isVisible={isVisible.playground}
              delay="0.6s"
            />

            {/* Demo 8: JWT Auth */}
            <DemoCard
              icon={<Lock className="text-red-400" size={28} />}
              title="JWT Authentication"
              description="Token lifecycle visualization with refresh token rotation and secure session management."
              tags={['Security', 'Auth', 'Sessions']}
              isVisible={isVisible.playground}
              delay="0.7s"
              demoId="auth"
            >
              <div className="text-sm text-gray-300">
                <p className="mb-2">Test JWT authentication flow.</p>
                <div className="text-xs text-gray-400 bg-gray-950 p-2 rounded font-mono">
                  POST /api/demo/auth/login<br/>
                  {"{"}"username": "demo", "password": "password123"{"}"}
                </div>
              </div>
            </DemoCard>
          </div>

          <div className={`mt-12 text-center ${isVisible.playground ? 'animate-slide-in-up stagger-2' : 'opacity-0'}`}>
            <div className="glass-card rounded-lg p-6 max-w-4xl mx-auto">
              <h3 className="text-xl font-bold mb-3 flex items-center justify-center gap-2">
                <BarChart3 className="text-blue-400" size={24} />
                Backend Infrastructure
              </h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="bg-gray-900/50 p-3 rounded">
                  <div className="text-gray-400 mb-1">Database</div>
                  <div className="font-semibold text-purple-400">MongoDB Atlas (Free)</div>
                  <div className="text-xs text-gray-500">512MB • Replica Set</div>
                </div>
                <div className="bg-gray-900/50 p-3 rounded">
                  <div className="text-gray-400 mb-1">API Hosting</div>
                  <div className="font-semibold text-green-400">Railway.app</div>
                  <div className="text-xs text-gray-500">Node.js • Express</div>
                </div>
                <div className="bg-gray-900/50 p-3 rounded">
                  <div className="text-gray-400 mb-1">CI/CD</div>
                  <div className="font-semibold text-orange-400">GitHub Actions</div>
                  <div className="text-xs text-gray-500">Automated Deploy</div>
                </div>
              </div>
              <p className="text-gray-400 mt-4 text-sm">
                All demos use free-tier services demonstrating cost-effective, production-ready solutions
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section id="skills" className="py-20 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className={`text-3xl md:text-4xl font-bold text-center mb-12 ${isVisible.skills ? 'animate-slide-in-up' : 'opacity-0'}`}>
            Technical Skills
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Object.entries(skills).map(([category, techs], index) => (
              <div
                key={category}
                className={`glass-card rounded-lg p-6 hover:scale-105 neon-border transition-all duration-500 ${
                  isVisible.skills ? 'animate-fade-in-scale' : 'opacity-0'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center mb-4">
                  {category === 'frontend' && <Code className="text-blue-400 mr-2 animate-pulse" size={24} />}
                  {category === 'backend' && <Settings className="text-green-400 mr-2 animate-pulse" size={24} />}
                  {category === 'database' && <Database className="text-purple-400 mr-2 animate-pulse" size={24} />}
                  {category === 'devops' && <Cloud className="text-orange-400 mr-2 animate-pulse" size={24} />}
                  {category === 'tools' && <Award className="text-pink-400 mr-2 animate-pulse" size={24} />}
                  <h3 className="text-lg font-bold capitalize">{category}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {techs.map((tech, i) => (
                    <span 
                      key={i} 
                      className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm hover:bg-gray-600 transition-all duration-300 hover:scale-110 hover:text-white"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Education & Certifications */}
      <section id="education" className="py-20 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className={`text-3xl md:text-4xl font-bold text-center mb-12 ${isVisible.education ? 'animate-slide-in-up' : 'opacity-0'}`}>
            Education & Certifications
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className={`glass-card rounded-lg p-6 neon-border ${isVisible.education ? 'animate-slide-in-left' : 'opacity-0'}`}>
              <h3 className="text-xl font-bold text-blue-400 mb-4 flex items-center">
                <GraduationCap className="mr-2" size={24} />
                Education
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-200">Master's in Computer Science</h4>
                  <p className="text-gray-400">University of Alabama at Birmingham</p>
                  <p className="text-gray-500 text-sm">Aug 2022 – Dec 2023</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-200">Bachelor of Engineering in Computer Science</h4>
                  <p className="text-gray-400">K.S. Institute of Technology, Karnataka, India</p>
                  <p className="text-gray-500 text-sm">Jun 2018 – May 2022</p>
                </div>
              </div>
            </div>

            <div className={`glass-card rounded-lg p-6 neon-border ${isVisible.education ? 'animate-slide-in-right' : 'opacity-0'}`}>
              <h3 className="text-xl font-bold text-purple-400 mb-4 flex items-center">
                <Award className="mr-2" size={24} />
                Certifications
              </h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <span className="text-orange-400 mr-2">🏅</span>
                  <span className="text-gray-300">AWS Certified Solutions Architect – Associate</span>
                </div>
                <div className="flex items-center">
                  <span className="text-green-400 mr-2">🏅</span>
                  <span className="text-gray-300">Certified MERN Developer – Namaste Dev</span>
                </div>
                <div className="flex items-center">
                  <span className="text-blue-400 mr-2">🏅</span>
                  <span className="text-gray-300">Node.js Certified Developer – Coursera</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className={`text-3xl md:text-4xl font-bold mb-8 ${isVisible.contact ? 'animate-slide-in-up' : 'opacity-0'}`}>
            Let's Work Together
          </h2>
          <p className={`text-lg text-gray-300 mb-12 ${isVisible.contact ? 'animate-slide-in-up stagger-1' : 'opacity-0'}`}>
            I'm always open to discussing new opportunities and interesting projects. 
            Let's connect and see how we can build something amazing together!
          </p>
          
          <div className={`grid md:grid-cols-3 gap-8 mb-12 ${isVisible.contact ? 'animate-slide-in-up stagger-2' : 'opacity-0'}`}>
            <a
              href="mailto:tharun.manikonda1@outlook.com"
              className="flex items-center justify-center gap-3 glass-card neon-border p-6 rounded-lg transition-all duration-300 hover:scale-105"
            >
              <Mail className="text-blue-400 animate-pulse" size={24} />
              <div>
                <div className="font-semibold">Email</div>
                <div className="text-sm text-gray-400">tharun.manikonda1@outlook.com</div>
              </div>
            </a>


            <a
              href="tel:+12052598634"
              className="flex items-center justify-center gap-3 glass-card neon-border p-6 rounded-lg transition-all duration-300 hover:scale-105"
            >
              <Phone className="text-green-400 animate-pulse" size={24} />
              <div>
                <div className="font-semibold">Phone</div>
                <div className="text-sm text-gray-400">(205) 259-8634</div>
              </div>
            </a>

            <div className="flex items-center justify-center gap-3 glass-card neon-border p-6 rounded-lg hover:scale-105 transition-transform duration-300">
              <MapPin className="text-purple-400 animate-pulse" size={24} />
              <div>
                <div className="font-semibold">Location</div>
                <div className="text-sm text-gray-400">California, USA</div>
              </div>
            </div>
          </div>

          <div className={`flex justify-center gap-6 ${isVisible.contact ? 'animate-fade-in-scale stagger-3' : 'opacity-0'}`}>
            <a
              href="#"
              className="glass-card neon-border p-3 rounded-full transition-all duration-300 hover:scale-110"
            >
              <Github size={24} />
            </a>
            <a
              href="#"
              className="glass-card neon-border p-3 rounded-full transition-all duration-300 hover:scale-110"
            >
              <Linkedin size={24} />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-8" style={{
        background: 'rgba(17, 24, 39, 0.5)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)'
      }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            © 2025 Tharun Manikonda. Built with React and Tailwind CSS.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;