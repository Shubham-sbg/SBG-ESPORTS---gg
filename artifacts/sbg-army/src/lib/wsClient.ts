type WsListener = (event: { collection?: string; data?: unknown; updates?: Record<string, unknown> }) => void;

const listeners = new Set<WsListener>();
let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let isConnecting = false;
let hasConnectedBefore = false;
let reconnectCallback: (() => void) | null = null;

/**
 * Register a callback invoked whenever the socket (re)connects after having
 * been connected before. Used to resync the client's in-memory DB cache with
 * the server after a dropped connection (e.g. tab backgrounded/sleep for a
 * while), so a stale local snapshot doesn't get pushed back and clobber data
 * that changed elsewhere while disconnected.
 */
export function onWsReconnect(cb: () => void): void {
  reconnectCallback = cb;
}

// In a single-origin deployment (Replit, or Vercel serving both frontend and
// backend behind one domain) leave VITE_API_URL unset — relative '/api'
// works unchanged. For split deployments (e.g. frontend on Vercel, backend
// on Render) set VITE_API_URL to the backend's origin only, e.g.
// "https://sbg-army-api.onrender.com" (no trailing /api — this is the same
// variable ImageUpload.tsx uses as a prefix in front of "/api/upload", so
// both must share the same origin-only convention).
const configuredOrigin = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '');
const API_BASE = configuredOrigin ? `${configuredOrigin}/api` : '/api';
const WS_PATH = '/ws';

function resolveWsUrl(): string {
  if (configuredOrigin) {
    // Derive the ws(s):// URL from the configured backend origin so both
    // stay in sync when pointed at a remote backend.
    const apiUrl = new URL(configuredOrigin);
    const protocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${apiUrl.host}${WS_PATH}`;
  }
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${location.host}${WS_PATH}`;
}

export function getApiBase(): string {
  return API_BASE;
}

export async function apiGet(collection: string): Promise<unknown> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(`${API_BASE}/db/${collection}`, {
      cache: 'no-store',
      credentials: 'include',
      headers: adminAuthHeaders(),
      signal: controller.signal,
    });
    clearTimeout(id);
    if (!res.ok) throw new Error(`API GET failed: ${collection}`);
    return res.json();
  } catch (err: any) {
    clearTimeout(id);
    if (err.name === 'AbortError') throw new Error('Request timed out (10s)');
    throw err;
  }
}

function adminAuthHeaders(): Record<string, string> {
  const token = (() => {
    try {
      if (typeof window !== 'undefined') {
        return sessionStorage.getItem('sbg_admin_token') || localStorage.getItem('sbg_admin_token') || '';
      }
      return '';
    } catch {
      return '';
    }
  })();
  return token ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } : { 'Content-Type': 'application/json' };
}

export async function apiPost(collection: string, data: unknown): Promise<void> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(`${API_BASE}/db/${collection}`, {
      method: 'POST',
      headers: adminAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
      signal: controller.signal,
    });
    clearTimeout(id);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData?.error || `API save failed (${res.status}). Please re-login if session expired.`);
    }
  } catch (err: any) {
    clearTimeout(id);
    if (err.name === 'AbortError') throw new Error('Request timed out (15s)');
    if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
      throw new Error('Server connection error. Local changes saved.');
    }
    throw err;
  }
}

export async function apiPostBulk(updates: Record<string, unknown>): Promise<void> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(`${API_BASE}/db`, {
      method: 'POST',
      headers: adminAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(updates),
      signal: controller.signal,
    });
    clearTimeout(id);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData?.error || `API bulk save failed (${res.status}). Please re-login if session expired.`);
    }
  } catch (err: any) {
    clearTimeout(id);
    if (err.name === 'AbortError') throw new Error('Request timed out (15s)');
    if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
      throw new Error('Server connection error. Local changes saved.');
    }
    throw err;
  }
}

export async function apiGetAll(): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(`${API_BASE}/db`, {
      cache: 'no-store',
      credentials: 'include',
      headers: adminAuthHeaders(),
      signal: controller.signal,
    });
    clearTimeout(id);
    if (!res.ok) throw new Error('API GET all failed');
    return res.json();
  } catch (err: any) {
    clearTimeout(id);
    if (err.name === 'AbortError') throw new Error('Request timed out (10s)');
    throw err;
  }
}

export function connectWs(): void {
  if (isConnecting || (socket && socket.readyState === WebSocket.OPEN)) return;
  isConnecting = true;

  const wsUrl = resolveWsUrl();

  try {
    socket = new WebSocket(wsUrl);
  } catch {
    isConnecting = false;
    scheduleReconnect();
    return;
  }

  socket.onopen = () => {
    isConnecting = false;
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
    if (hasConnectedBefore) {
      // Reconnecting after a drop — our in-memory cache may be stale relative
      // to the server (e.g. other admins made changes while we were offline).
      reconnectCallback?.();
    }
    hasConnectedBefore = true;
  };

  socket.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data);
      if (
        msg.type === 'db_update' ||
        msg.type === 'db_update_bulk' ||
        msg.type === 'db_change' ||
        msg.type === 'db_updated' ||
        msg.type === 'change' ||
        msg.type === 'update' ||
        msg.collection ||
        msg.updates
      ) {
        listeners.forEach(fn => fn(msg));
      }
    } catch {
      // ignore non-JSON or ping frames
    }
  };

  socket.onclose = () => {
    isConnecting = false;
    socket = null;
    scheduleReconnect();
  };

  socket.onerror = () => {
    isConnecting = false;
    socket?.close();
  };
}

function scheduleReconnect(): void {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectWs();
  }, 3000);
}

export function addWsListener(fn: WsListener): () => void {
  listeners.add(fn);
  connectWs();
  return () => listeners.delete(fn);
}

export function isWsConnected(): boolean {
  return socket?.readyState === WebSocket.OPEN;
}

export async function apiDownloadBackup(): Promise<void> {
  const res = await fetch(`${API_BASE}/backup`, { credentials: 'include' });
  if (!res.ok) throw new Error('Backup download failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const cd = res.headers.get('content-disposition') ?? '';
  const match = cd.match(/filename="([^"]+)"/);
  a.download = match ? match[1] : `sbg-army-backup-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function apiRestoreBackup(file: File): Promise<void> {
  const text = await file.text();
  const data = JSON.parse(text);
  const res = await fetch(`${API_BASE}/restore`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Restore failed');
}

export async function apiDownloadSourceExport(): Promise<void> {
  const res = await fetch(`${API_BASE}/source-export`, { credentials: 'include' });
  if (!res.ok) throw new Error('Source export failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const cd = res.headers.get('content-disposition') ?? '';
  const match = cd.match(/filename="([^"]+)"/);
  a.download = match ? match[1] : `sbg-army-source-${Date.now()}.tar.gz`;
  a.click();
  URL.revokeObjectURL(url);
}
