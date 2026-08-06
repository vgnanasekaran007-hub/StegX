/**
 * StegX API Client
 * Centralises all fetch calls so the base URL (Render vs localhost)
 * is resolved from the VITE_API_URL env variable at build time.
 *
 * - In development: VITE_API_URL is empty → Vite's proxy forwards /api → localhost:8000
 * - In production:  VITE_API_URL = "https://stegx-03ut.onrender.com" → direct HTTPS calls
 */
const BASE = import.meta.env.VITE_API_URL || '';

/**
 * Drop-in replacement for fetch() that prepends the backend base URL.
 * Usage:  apiFetch('/api/upload', { method: 'POST', body: formData })
 */
export async function apiFetch(path, options = {}) {
  const url = `${BASE}${path}`;
  const response = await fetch(url, options);
  return response;
}

export default apiFetch;
