/**
 * Centralized API & WebSocket Configuration
 * 
 * Supports both:
 * 1. Split Deployments (Frontend on Vercel / Netlify, Backend on Render / Cloud Run):
 *    Set VITE_API_URL=https://<your-backend-domain> (e.g. https://sbg-esportsgg.onrender.com)
 * 2. Unified / Same-Origin / Local Development:
 *    Leave VITE_API_URL unset or empty (uses relative /api routes with Vite dev proxy)
 */

const envApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();

// Clean up trailing slash and any accidental trailing '/api'
export const BACKEND_URL: string = envApiUrl
  ? envApiUrl.replace(/\/+$/, '').replace(/\/api$/, '')
  : '';

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
