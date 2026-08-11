/**
 * StegX API Client — v2.0 Enhanced Rewrite
 *
 * Centralises all fetch calls with:
 *  - Request deduplication (prevents duplicate concurrent requests)
 *  - GET response caching with configurable TTL
 *  - Structured error classification (network / server / timeout)
 *  - Connection health-check ping
 *  - Request/response logging interceptors
 *
 * The base URL is resolved from VITE_API_URL at build time.
 * API Key is sent as X-API-Key header on every request.
 */

const BASE = import.meta.env.VITE_API_URL || '';
let API_KEY = import.meta.env.VITE_API_KEY || '';

/* ── Request Cache ─────────────────────────────────────────────── */

const _cache = new Map();
const CACHE_TTL_MS = 30_000; // 30 seconds

function _getCached(key) {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    _cache.delete(key);
    return null;
  }
  return entry.response.clone();
}

function _setCache(key, response) {
  _cache.set(key, { response: response.clone(), timestamp: Date.now() });
  // Evict old entries if cache grows too large
  if (_cache.size > 50) {
    const oldest = _cache.keys().next().value;
    _cache.delete(oldest);
  }
}

/** Clear the response cache (useful after mutations). */
export function clearCache(pathPrefix) {
  if (pathPrefix) {
    for (const key of _cache.keys()) {
      if (key.startsWith(pathPrefix)) _cache.delete(key);
    }
  } else {
    _cache.clear();
  }
}

/* ── Request Deduplication ─────────────────────────────────────── */

const _inFlight = new Map();

/* ── Public Helpers ────────────────────────────────────────────── */

/** Return the API base URL for constructing download links. */
export function getApiBase() {
  return BASE;
}

/** Set or update the API key at runtime. */
export function setApiKey(key) {
  API_KEY = key || '';
}

/** Get the current API key. */
export function getApiKey() {
  return API_KEY;
}

/**
 * Human-readable file size.
 * Shared across the entire app — import from here, do NOT duplicate.
 */
export function formatSize(bytes) {
  if (bytes == null || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${i === 0 ? value : value.toFixed(i === 1 ? 1 : 2)} ${units[i]}`;
}

/**
 * Format a duration in seconds to human-readable.
 */
export function formatDuration(seconds) {
  if (seconds < 1) return `${Math.round(seconds * 1000)}ms`;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

/* ── Error Classification ──────────────────────────────────────── */

export class ApiError extends Error {
  constructor(message, type, status = null, details = null) {
    super(message);
    this.name = 'ApiError';
    /** @type {'network'|'timeout'|'server'|'client'|'unknown'} */
    this.type = type;
    this.status = status;
    this.details = details;
  }

  get isNetwork()  { return this.type === 'network'; }
  get isTimeout()  { return this.type === 'timeout'; }
  get isServer()   { return this.type === 'server'; }
  get isClient()   { return this.type === 'client'; }

  /** User-friendly message for display in toasts. */
  get userMessage() {
    switch (this.type) {
      case 'timeout':
        return 'Server is taking too long. It may be waking up — please try again in 30 seconds.';
      case 'network':
        return 'Cannot connect to server. Please check your internet connection.';
      case 'server':
        return this.details || `Server error (${this.status}). Please try again.`;
      case 'client':
        return this.details || `Request error (${this.status}).`;
      default:
        return this.message;
    }
  }
}

/* ── Core Fetch Wrapper ────────────────────────────────────────── */

const TIMEOUT_MS = 120_000;  // 2 minutes (Render free-tier cold start)
const RETRY_DELAY_MS = 3_000;

/**
 * Drop-in replacement for fetch() that:
 *  1. Prepends the backend base URL
 *  2. Injects the X-API-Key header
 *  3. Caches GET responses (with TTL)
 *  4. Deduplicates in-flight requests
 *  5. Adds 120s timeout + 1 auto-retry
 *  6. Classifies errors for better UX
 *
 * @param {string} path - API path (e.g. '/api/upload')
 * @param {RequestInit} options - fetch options
 * @param {object} [extra] - { cache: false } to skip cache
 * @returns {Promise<Response>}
 */
export async function apiFetch(path, options = {}, extra = {}) {
  const url = `${BASE}${path}`;
  const method = (options.method || 'GET').toUpperCase();

  // Merge API key header (do not override Content-Type for FormData)
  const headers = { ...(options.headers || {}) };
  if (API_KEY) headers['X-API-Key'] = API_KEY;
  const mergedOptions = { ...options, headers };

  // ── GET caching ───────────────────────────────────────────────
  if (method === 'GET' && extra.cache !== false) {
    const cached = _getCached(url);
    if (cached) return cached;
  }

  // ── Request deduplication ─────────────────────────────────────
  const dedupeKey = `${method}:${url}`;
  if (method === 'GET' && _inFlight.has(dedupeKey)) {
    return _inFlight.get(dedupeKey).then((r) => r.clone());
  }

  const requestPromise = _executeWithRetry(url, mergedOptions);

  if (method === 'GET') {
    _inFlight.set(dedupeKey, requestPromise);
    requestPromise.finally(() => _inFlight.delete(dedupeKey));
  }

  const response = await requestPromise;

  // Cache successful GET responses
  if (method === 'GET' && response.ok && extra.cache !== false) {
    _setCache(url, response);
  }

  // Invalidate related caches on mutations
  if (method !== 'GET') {
    clearCache(path.split('?')[0]);
  }

  return response;
}

async function _executeWithRetry(url, options) {
  const startTime = Date.now();

  // First attempt
  try {
    const response = await _fetchWithTimeout(url, options, TIMEOUT_MS);
    _logResponse(url, options.method || 'GET', response.status, Date.now() - startTime);
    return response;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new ApiError(
        'Request timed out',
        'timeout'
      );
    }

    // Retry once after a short delay
    console.warn('[StegX API] First attempt failed, retrying…', err.message);
    await _sleep(RETRY_DELAY_MS);

    try {
      const response = await _fetchWithTimeout(url, options, TIMEOUT_MS);
      _logResponse(url, options.method || 'GET', response.status, Date.now() - startTime);
      return response;
    } catch (retryErr) {
      if (retryErr.name === 'AbortError') {
        throw new ApiError('Server not responding after retry', 'timeout');
      }
      throw new ApiError(
        `Cannot connect to server: ${retryErr.message}`,
        'network'
      );
    }
  }
}

/* ── Connection Health Check ───────────────────────────────────── */

let _lastHealthStatus = null;
let _healthCheckPromise = null;

/**
 * Ping the backend to check if it's alive.
 * Returns { alive: boolean, latencyMs: number }
 */
export async function healthCheck() {
  if (_healthCheckPromise) return _healthCheckPromise;

  _healthCheckPromise = (async () => {
    const start = Date.now();
    try {
      const res = await _fetchWithTimeout(`${BASE}/api/health`, {
        headers: API_KEY ? { 'X-API-Key': API_KEY } : {},
      }, 50_000);
      const latencyMs = Date.now() - start;
      _lastHealthStatus = { alive: res.ok, latencyMs, timestamp: Date.now() };
      return _lastHealthStatus;
    } catch {
      _lastHealthStatus = { alive: false, latencyMs: -1, timestamp: Date.now() };
      return _lastHealthStatus;
    } finally {
      _healthCheckPromise = null;
    }
  })();

  return _healthCheckPromise;
}

/** Get the last cached health status without making a request. */
export function getLastHealthStatus() {
  return _lastHealthStatus;
}

/* ── Internal Utilities ────────────────────────────────────────── */

function _fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, { ...options, signal: controller.signal })
    .then((response) => {
      clearTimeout(timer);
      return response;
    })
    .catch((err) => {
      clearTimeout(timer);
      throw err;
    });
}

function _sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function _logResponse(url, method, status, durationMs) {
  const shortUrl = url.replace(BASE, '');
  const color = status < 300 ? '#00FF88' : status < 400 ? '#FFB800' : '#FF3D71';
  console.log(
    `%c[API] %c${method} %c${shortUrl} %c${status} %c${durationMs}ms`,
    'color:#00E5FF;font-weight:bold',
    'color:#E8EAED',
    'color:#9BA1B0',
    `color:${color};font-weight:bold`,
    'color:#5A607A'
  );
}

export default apiFetch;
