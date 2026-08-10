/**
 * StegX API Client — Rewritten from Scratch
 *
 * Centralises all fetch calls. The base URL is resolved from the
 * VITE_API_URL env variable at build time.
 *
 * - Development : VITE_API_URL is empty → Vite proxy forwards /api → localhost:8000
 * - Production  : VITE_API_URL = "https://your-backend.example.com"
 *
 * API Key is read from VITE_API_KEY and sent as the X-API-Key header
 * on every request (can also be set at runtime via setApiKey()).
 */

const BASE = import.meta.env.VITE_API_URL || '';
let API_KEY = import.meta.env.VITE_API_KEY || '';

/* ── Public Helpers ────────────────────────────────────────────── */

/** Return the API base URL for constructing download links. */
export function getApiBase() {
  return BASE;
}

/** Set or update the API key at runtime. */
export function setApiKey(key) {
  API_KEY = key || '';
}

/** Get the current API key (useful for display / settings). */
export function getApiKey() {
  return API_KEY;
}

/**
 * Human-readable file size.
 * Shared across the entire app — import from here, do NOT duplicate.
 */
export function formatSize(bytes) {
  if (bytes == null || bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/* ── Core Fetch Wrapper ────────────────────────────────────────── */

const TIMEOUT_MS = 120_000;  // 2 minutes (Render free-tier cold start)
const RETRY_DELAY_MS = 3_000;

/**
 * Drop-in replacement for fetch() that:
 *  1. Prepends the backend base URL
 *  2. Injects the X-API-Key header (when set)
 *  3. Adds a 120-second timeout
 *  4. Retries once on network failure
 */
export async function apiFetch(path, options = {}) {
  const url = `${BASE}${path}`;

  // Merge API key header (do not override Content-Type for FormData)
  const headers = { ...(options.headers || {}) };
  if (API_KEY) {
    headers['X-API-Key'] = API_KEY;
  }
  const mergedOptions = { ...options, headers };

  // First attempt
  try {
    return await _fetchWithTimeout(url, mergedOptions, TIMEOUT_MS);
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(
        'Server is taking too long to respond. ' +
        'The backend may be waking up — please try again in 30 seconds.'
      );
    }

    // Retry once after a short delay
    console.warn('StegX API: first attempt failed, retrying…', err.message);
    await _sleep(RETRY_DELAY_MS);

    try {
      return await _fetchWithTimeout(url, mergedOptions, TIMEOUT_MS);
    } catch (retryErr) {
      if (retryErr.name === 'AbortError') {
        throw new Error(
          'Server is not responding. ' +
          'The backend may be starting up — please wait and try again.'
        );
      }
      throw new Error(`Cannot connect to server: ${retryErr.message}`);
    }
  }
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

export default apiFetch;
