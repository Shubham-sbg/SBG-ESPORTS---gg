/**
 * Centralized API & WebSocket Configuration
 * 
 * Supports both:
 * 1. Split Deployments (Frontend on Vercel / Netlify / AI Studio, Backend on Render / Cloud Run):
 *    Uses VITE_API_URL or defaults to https://sbg-esports-gg.onrender.com
 * 2. Unified / Same-Origin / Local Development:
 *    Uses relative /api routes with Vite dev proxy
 */

const envApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();

export const PRODUCTION_DEFAULT_BACKEND_URL = 'https://sbg-esports-gg.onrender.com';

function resolveBackendUrl(): string {
  if (envApiUrl) {
    return envApiUrl.replace(/\/+$/, '').replace(/\/api$/, '');
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    // Local development or running directly on Render host -> relative /api
    if (host === 'localhost' || host === '127.0.0.1' || host === 'sbg-esports-gg.onrender.com' || host === '0.0.0.0') {
      return '';
    }
  }
  return PRODUCTION_DEFAULT_BACKEND_URL;
}

// Clean up trailing slash and any accidental trailing '/api'
export const BACKEND_URL: string = resolveBackendUrl();

export const API_BASE: string = BACKEND_URL ? `${BACKEND_URL}/api` : '/api';

/**
 * Normalizes an API path into a full backend URL.
 * 
 * Examples:
 *   apiUrl('/api/admin/login') -> "https://api.domain.com/api/admin/login" (or "/api/admin/login")
 *   apiUrl('/admin/login')     -> "https://api.domain.com/api/admin/login" (or "/api/admin/login")
 *   apiUrl('/health')          -> "https://api.domain.com/health" (or "/health")
 */
export function apiUrl(path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (clean.startsWith('/api/') || clean === '/api') {
    return BACKEND_URL ? `${BACKEND_URL}${clean}` : clean;
  }
  // Standalone root endpoints like /health, /healthz, /robots.txt
  if (clean === '/health' || clean === '/healthz' || clean === '/robots.txt' || clean === '/sitemap.xml') {
    return BACKEND_URL ? `${BACKEND_URL}${clean}` : clean;
  }
  return `${API_BASE}${clean}`;
}

/**
 * Returns the WebSocket URL derived from the backend URL or window location.
 */
export function getWsUrl(): string {
  const wsPath = '/ws';
  if (BACKEND_URL) {
    try {
      const parsed = new URL(BACKEND_URL);
      const protocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${protocol}//${parsed.host}${wsPath}`;
    } catch {
      // Fall through to window.location
    }
  }
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}${wsPath}`;
  }
  return `ws://localhost:8081${wsPath}`;
}
