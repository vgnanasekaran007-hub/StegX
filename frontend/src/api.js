/**
 * StegX API Client
 * Centralises all fetch calls so the base URL (Render vs localhost)
 * is resolved from the VITE_API_URL env variable at build time.
 *
 * - In development: VITE_API_URL is empty → Vite's proxy forwards /api → localhost:8000
 * - In production:  VITE_API_URL = "https://stegx-03ut.onrender.com" → direct HTTPS calls
 */
const BASE = import.meta.env.VITE_API_URL || '';

/** Get the API base URL for constructing download links */
export function getApiBase() { return BASE; }

/**
 * Drop-in replacement for fetch() that prepends the backend base URL.
 * Includes a 120-second timeout to handle Render free-tier cold starts
 * and automatic retry on network failure.
 */
export async function apiFetch(path, options = {}) {
  const url = `${BASE}${path}`;
  const TIMEOUT_MS = 120000; // 2 minutes for cold-start

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timer);
    return response;
  } catch (err) {
    clearTimeout(timer);

    // If aborted due to timeout, throw a clearer error
    if (err.name === 'AbortError') {
      throw new Error('Server is taking too long to respond. The backend may be waking up — please try again in 30 seconds.');
    }

    // Network error — retry once after 3 seconds
    console.warn('StegX API: First attempt failed, retrying...', err.message);
    await new Promise(r => setTimeout(r, 3000));

    const retryController = new AbortController();
    const retryTimer = setTimeout(() => retryController.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        ...options,
        signal: retryController.signal,
      });
      clearTimeout(retryTimer);
      return response;
    } catch (retryErr) {
      clearTimeout(retryTimer);
      if (retryErr.name === 'AbortError') {
        throw new Error('Server is not responding. The backend may be starting up — please wait a moment and try again.');
      }
      throw new Error(`Cannot connect to server: ${retryErr.message}`);
    }
  }
}

export default apiFetch;
